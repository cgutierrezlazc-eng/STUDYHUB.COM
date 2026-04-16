// ═══════════════════════════════════════════════════════════════
// ADAPTADOR BLACKBOARD — Extraccion de datos via Blackboard Learn REST API
// Usa la sesion activa del estudiante (cookies de sesion)
// ═══════════════════════════════════════════════════════════════

import type { LmsAdapter } from './base';
import type {
  ExtractedCourse,
  ExtractedEvent,
  ExtractedFile,
  ExtractedGrade,
  PlatformDetection,
} from '@shared/types';

// ── Helpers ──────────────────────────────────────────────────

async function bbApi<T>(path: string): Promise<T> {
  const response = await fetch(`/learn/api/public/v3${path}`, {
    credentials: 'same-origin',
    headers: { 'Accept': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Blackboard API error: HTTP ${response.status} on ${path}`);
  }
  return response.json() as Promise<T>;
}

// ── Tipos de respuesta Blackboard ────────────────────────────

interface BbCourse {
  id: string;
  courseId: string;
  name: string;
  description?: string;
  created?: string;
  availability?: { available: string };
  term?: { name?: string };
}

interface BbContent {
  id: string;
  title: string;
  contentHandler?: { id: string };
  links?: Array<{ href: string; title?: string; type?: string }>;
  body?: string;
  created?: string;
  modified?: string;
}

interface BbGradeColumn {
  id: string;
  name: string;
  score?: { possible: number };
}

interface BbGradeAttempt {
  columnId: string;
  score?: number;
  text?: string;
}

// ── Adaptador ────────────────────────────────────────────────

export const blackboardAdapter: LmsAdapter = {
  platform: 'blackboard',

  detect(): PlatformDetection | null {
    const indicators: boolean[] = [];

    // 1. URL patterns de Blackboard
    const url = window.location.href;
    indicators.push(/\/ultra\/|\/webapps\/|\/learn\//.test(url));

    // 2. Blackboard brand en el DOM
    const hasLogo = !!document.querySelector('[class*="blackboard"], [id*="blackboard"]');
    indicators.push(hasLogo);

    // 3. Meta o script de Blackboard
    indicators.push(!!document.querySelector('script[src*="blackboard"]'));

    // 4. Ultra UI markers
    indicators.push(!!document.querySelector('[data-bbid], .bb-offcanvas, #learn-uls-app'));

    // 5. Body class
    indicators.push(document.body?.className?.includes('bb-') ?? false);

    const matched = indicators.filter(Boolean).length;
    if (matched < 2) return null;

    const siteName =
      document.querySelector('.institution-name, .brand-title')?.textContent?.trim() ||
      document.title.replace(/:.*$/, '').trim() ||
      window.location.hostname;

    return {
      platform: 'blackboard',
      baseUrl: window.location.origin,
      siteName,
      confidence: matched / indicators.length,
    };
  },

  async getSessionKey(): Promise<string | null> {
    // Blackboard usa cookies de sesion, no sesskey
    return 'bb-session';
  },

  async getUserId(): Promise<string | null> {
    try {
      const user = await bbApi<{ id: string }>('/users/me');
      return user.id;
    } catch {
      return null;
    }
  },

  async extractCourses(_sesskey: string, _userId: string): Promise<ExtractedCourse[]> {
    try {
      const data = await bbApi<{ results: BbCourse[] }>('/users/me/courses');
      const now = Date.now();

      return (data.results || [])
        .filter((c) => c.availability?.available !== 'No')
        .map((c) => ({
          externalId: c.id,
          name: c.name,
          shortName: c.courseId,
          isCurrent: true,
          fileCount: 0,
          platform: 'blackboard' as const,
        }));
    } catch {
      return [];
    }
  },

  async extractFiles(_sesskey: string, courseId: string): Promise<ExtractedFile[]> {
    try {
      const data = await bbApi<{ results: BbContent[] }>(`/courses/${courseId}/contents`);
      const files: ExtractedFile[] = [];

      for (const item of data.results || []) {
        if (item.contentHandler?.id === 'resource/x-bb-file' || item.contentHandler?.id === 'resource/x-bb-document') {
          files.push({
            externalId: `bb-${courseId}-${item.id}`,
            courseExternalId: courseId,
            name: item.title,
            url: `/learn/api/public/v3/courses/${courseId}/contents/${item.id}/attachments`,
            itemType: 'file',
            topicName: 'Contenido',
            timeModified: item.modified ? Math.floor(new Date(item.modified).getTime() / 1000) : undefined,
          });
        }
      }

      return files;
    } catch {
      return [];
    }
  },

  async extractEvents(_sesskey: string): Promise<ExtractedEvent[]> {
    // Blackboard calendar API es limitada en v3 REST
    return [];
  },

  async extractGrades(_sesskey: string, courseId: string, userId: string): Promise<ExtractedGrade[]> {
    try {
      const columns = await bbApi<{ results: BbGradeColumn[] }>(`/courses/${courseId}/gradebook/columns`);
      const grades: ExtractedGrade[] = [];

      for (const col of columns.results || []) {
        try {
          const attempt = await bbApi<BbGradeAttempt>(
            `/courses/${courseId}/gradebook/columns/${col.id}/users/${userId}`,
          );
          if (attempt.score != null) {
            grades.push({
              externalId: `bb-grade-${courseId}-${col.id}`,
              courseExternalId: courseId,
              itemName: col.name,
              grade: attempt.score,
              gradeMax: col.score?.possible,
              percentage: col.score?.possible ? (attempt.score / col.score.possible) * 100 : undefined,
            });
          }
        } catch {
          // Sin nota para esta columna
        }
      }

      return grades;
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
        resolve({
          base64: result.split(',')[1] || result,
          mimeType: blob.type || 'application/octet-stream',
          size: blob.size,
        });
      };
      reader.onerror = () => reject(new Error('Error leyendo archivo'));
      reader.readAsDataURL(blob);
    });
  },
};
