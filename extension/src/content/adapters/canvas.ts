// ═══════════════════════════════════════════════════════════════
// ADAPTADOR CANVAS — Extraccion de datos via Canvas REST API
// Usa la sesion activa del estudiante (cookies de sesion)
// Canvas expone su API REST internamente con autenticacion por cookie
// ═══════════════════════════════════════════════════════════════

import type { LmsAdapter } from './base';
import type {
  ExtractedCourse,
  ExtractedEvent,
  ExtractedFile,
  ExtractedGrade,
  PlatformDetection,
} from '@shared/types';
import { CALENDAR_DAYS_FORWARD, SYNC_FILE_EXTENSIONS } from '@shared/constants';

// ── Helpers ──────────────────────────────────────────────────

/** CSRF token de Canvas — necesario para requests autenticados */
function getCanvasCsrfToken(): string | null {
  const meta = document.querySelector('meta[name="csrf_token"]');
  return meta?.getAttribute('content') || null;
}

/** Fetch autenticado a la API interna de Canvas */
async function canvasApi<T>(path: string): Promise<T> {
  const csrf = getCanvasCsrfToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  if (csrf) {
    headers['X-CSRF-Token'] = csrf;
  }

  const response = await fetch(`/api/v1${path}`, {
    credentials: 'same-origin',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Canvas API error: HTTP ${response.status} on ${path}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Canvas pagina resultados con Link headers.
 * Esta funcion sigue todas las paginas y retorna el array completo.
 */
async function canvasApiPaginated<T>(path: string): Promise<T[]> {
  const results: T[] = [];
  let url: string | null = `/api/v1${path}`;
  const csrf = getCanvasCsrfToken();
  const MAX_PAGES = 50;
  let pages = 0;

  while (url && pages < MAX_PAGES) {
    pages++;
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (csrf) headers['X-CSRF-Token'] = csrf;

    const response = await fetch(url, { credentials: 'same-origin', headers });
    if (!response.ok) {
      console.warn(`[Conniku] Canvas API pagination stopped: HTTP ${response.status} on page ${pages}`);
      break;
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      results.push(...data);
    }

    // Buscar link "next" en headers
    const linkHeader = response.headers.get('Link') || '';
    const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
    url = nextMatch ? nextMatch[1] : null;
  }

  return results;
}

// ── Tipos de respuesta Canvas ────────────────────────────────

interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
  start_at?: string;
  end_at?: string;
  workflow_state: string;
  term?: { name?: string; start_at?: string; end_at?: string };
}

interface CanvasFile {
  id: number;
  filename: string;
  url: string;
  size: number;
  'content-type': string;
  created_at: string;
  updated_at: string;
  folder_id: number;
}

interface CanvasFolder {
  id: number;
  name: string;
  full_name: string;
  position: number;
}

interface CanvasEvent {
  id: string;
  title: string;
  description?: string;
  start_at: string;
  end_at?: string;
  context_code?: string;
  context_name?: string;
  assignment?: { submission_types?: string[] };
  url?: string;
}

interface CanvasSubmission {
  assignment_id: number;
  score?: number;
  grade?: string;
  submitted_at?: string;
  graded_at?: string;
}

interface CanvasAssignment {
  id: number;
  name: string;
  points_possible: number;
  due_at?: string;
  submission?: CanvasSubmission;
}

// ── Adaptador ────────────────────────────────────────────────

export const canvasAdapter: LmsAdapter = {
  platform: 'canvas',

  detect(): PlatformDetection | null {
    const indicators: boolean[] = [];

    // 1. Meta tag csrf_token (Canvas siempre lo incluye)
    indicators.push(!!document.querySelector('meta[name="csrf_token"]'));

    // 2. Canvas JS environment
    indicators.push(!!document.getElementById('application'));

    // 3. Body data attribute
    indicators.push(document.body?.classList.contains('ic-app') ?? false);

    // 4. Script con canvas en el src
    indicators.push(!!document.querySelector('script[src*="/dist/webpack"]'));

    // 5. URL patterns de Canvas
    const url = window.location.href;
    indicators.push(/\/(courses|dashboard|calendar|grades|assignments)/.test(url));

    // 6. Canvas brand (footer o header)
    const footer = document.querySelector('#footer, .ic-app-footer');
    indicators.push(footer?.textContent?.toLowerCase().includes('canvas') ?? false);

    const matched = indicators.filter(Boolean).length;
    const confidence = matched / indicators.length;

    if (matched < 2) return null;

    const siteName =
      document.querySelector('.ic-brand-mobile-global-nav-logo')?.getAttribute('alt') ||
      document.querySelector('title')?.textContent?.replace(/:\s.*$/, '').trim() ||
      window.location.hostname;

    return {
      platform: 'canvas',
      baseUrl: window.location.origin,
      siteName,
      confidence,
    };
  },

  async getSessionKey(): Promise<string | null> {
    // Canvas usa CSRF token en vez de sesskey
    return getCanvasCsrfToken();
  },

  async getUserId(): Promise<string | null> {
    try {
      const user = await canvasApi<{ id: number }>('/users/self/profile');
      return String(user.id);
    } catch {
      // Fallback: buscar en el DOM
      const envScript = document.getElementById('guarded-javascript-env');
      const match = envScript?.textContent?.match(/"current_user_id"\s*:\s*"?(\d+)"?/);
      return match ? match[1] : null;
    }
  },

  async extractCourses(sesskey: string, _userId: string): Promise<ExtractedCourse[]> {
    const courses = await canvasApiPaginated<CanvasCourse>(
      '/courses?enrollment_state=active&include[]=term&per_page=100',
    );

    const now = Date.now();

    return courses
      .filter((c) => c.workflow_state === 'available')
      .map((c) => {
        const start = c.start_at ? new Date(c.start_at).getTime() / 1000 : undefined;
        const end = c.end_at ? new Date(c.end_at).getTime() / 1000 : undefined;
        const isCurrent = !end || end * 1000 > now;

        return {
          externalId: String(c.id),
          name: c.name,
          shortName: c.course_code,
          startDate: start,
          endDate: end,
          isCurrent,
          fileCount: 0,
          platform: 'canvas' as const,
        };
      });
  },

  async extractFiles(_sesskey: string, courseId: string): Promise<ExtractedFile[]> {
    // Obtener folders para tener el nombre de la seccion
    let folders: CanvasFolder[] = [];
    try {
      folders = await canvasApiPaginated<CanvasFolder>(
        `/courses/${courseId}/folders?per_page=100`,
      );
    } catch { /* Si no tiene permisos, seguir sin folders */ }

    const folderMap = new Map(folders.map((f) => [f.id, f]));

    // Obtener archivos
    const files = await canvasApiPaginated<CanvasFile>(
      `/courses/${courseId}/files?per_page=100`,
    );

    return files
      .filter((f) => {
        const ext = f.filename.substring(f.filename.lastIndexOf('.')).toLowerCase();
        return (
          f['content-type']?.includes('pdf') ||
          f['content-type']?.includes('word') ||
          f['content-type']?.includes('presentation') ||
          f['content-type']?.includes('spreadsheet') ||
          f['content-type']?.includes('text/plain') ||
          SYNC_FILE_EXTENSIONS.has(ext)
        );
      })
      .map((f) => {
        const folder = folderMap.get(f.folder_id);
        return {
          externalId: `canvas-${courseId}-${f.id}`,
          courseExternalId: courseId,
          name: f.filename,
          url: f.url,
          mimeType: f['content-type'],
          fileSize: f.size,
          topicName: folder?.name || 'Sin carpeta',
          topicOrder: folder?.position || 0,
          itemType: 'file' as const,
          timeModified: Math.floor(new Date(f.updated_at).getTime() / 1000),
        };
      });
  },

  async extractEvents(_sesskey: string): Promise<ExtractedEvent[]> {
    const now = new Date();
    const future = new Date(now.getTime() + CALENDAR_DAYS_FORWARD * 24 * 60 * 60 * 1000);

    const events = await canvasApiPaginated<CanvasEvent>(
      `/calendar_events?start_date=${now.toISOString().split('T')[0]}&end_date=${future.toISOString().split('T')[0]}&per_page=100`,
    );

    return events.map((e) => {
      // Determinar tipo de evento
      let eventType: ExtractedEvent['eventType'] = 'task';
      if (e.assignment) eventType = 'deadline';
      if (e.title?.toLowerCase().includes('exam') || e.title?.toLowerCase().includes('prueba')) {
        eventType = 'exam';
      }

      // Extraer course ID del context_code (formato "course_123")
      const courseMatch = e.context_code?.match(/course_(\d+)/);

      return {
        externalId: `canvas-event-${e.id}`,
        title: e.title,
        description: e.description,
        courseExternalId: courseMatch ? courseMatch[1] : undefined,
        courseName: e.context_name,
        startTime: Math.floor(new Date(e.start_at).getTime() / 1000),
        endTime: e.end_at ? Math.floor(new Date(e.end_at).getTime() / 1000) : undefined,
        eventType,
        url: e.url,
      };
    });
  },

  async extractGrades(_sesskey: string, courseId: string, _userId: string): Promise<ExtractedGrade[]> {
    try {
      const assignments = await canvasApiPaginated<CanvasAssignment>(
        `/courses/${courseId}/assignments?include[]=submission&per_page=100`,
      );

      return assignments
        .filter((a) => a.submission?.score != null || a.submission?.grade != null)
        .map((a) => ({
          externalId: `canvas-grade-${courseId}-${a.id}`,
          courseExternalId: courseId,
          itemName: a.name,
          grade: a.submission?.score ?? a.submission?.grade ?? undefined,
          gradeMax: a.points_possible,
          percentage: a.submission?.score != null && a.points_possible > 0
            ? (a.submission.score / a.points_possible) * 100
            : undefined,
          timeModified: a.submission?.graded_at
            ? Math.floor(new Date(a.submission.graded_at).getTime() / 1000)
            : undefined,
        }));
    } catch {
      return [];
    }
  },

  async downloadFile(fileUrl: string): Promise<{ base64: string; mimeType: string; size: number }> {
    const response = await fetch(fileUrl, { credentials: 'same-origin' });
    if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);

    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || result;
        resolve({
          base64,
          mimeType: blob.type || 'application/octet-stream',
          size: blob.size,
        });
      };
      reader.onerror = () => reject(new Error('Error leyendo archivo'));
      reader.readAsDataURL(blob);
    });
  },
};
