// ═══════════════════════════════════════════════════════════════
// ADAPTADOR SAKAI — Extraccion via Sakai REST API
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

async function sakaiApi<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Accept': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Sakai API error: HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

// ── Tipos ────────────────────────────────────────────────────

interface SakaiSite {
  id: string;
  title: string;
  shortDescription?: string;
  type: string;
  createdDate?: string;
}

interface SakaiResource {
  resourceId: string;
  name: string;
  type: string;
  url?: string;
  size?: number;
  container?: string;
  modifiedDate?: string;
}

interface SakaiAssignment {
  id: string;
  title: string;
  dueDate?: { epochSecond?: number };
  closeDate?: { epochSecond?: number };
}

interface SakaiGradeItem {
  id: number;
  itemName: string;
  points?: number;
  grade?: string;
}

// ── Adaptador ────────────────────────────────────────────────

export const sakaiAdapter: LmsAdapter = {
  platform: 'sakai',

  detect(): PlatformDetection | null {
    const indicators: boolean[] = [];

    // 1. URL patterns de Sakai
    const url = window.location.href;
    indicators.push(/\/portal\/|\/sakai\//.test(url));

    // 2. Sakai scripts
    indicators.push(!!document.querySelector('script[src*="/sakai/"], script[src*="sakai-"]'));

    // 3. Sakai DOM markers
    indicators.push(!!document.querySelector('#portletBody, .Mrphs-mainHeader, .sakaiPortalBody'));

    // 4. Powered by Sakai footer
    const footer = document.querySelector('#footer, .Mrphs-footer');
    indicators.push(footer?.textContent?.toLowerCase().includes('sakai') ?? false);

    const matched = indicators.filter(Boolean).length;
    if (matched < 2) return null;

    const siteName =
      document.querySelector('.Mrphs-hierarchy--siteName')?.textContent?.trim() ||
      document.title.replace(/:.*$/, '').trim() ||
      window.location.hostname;

    return {
      platform: 'sakai',
      baseUrl: window.location.origin,
      siteName,
      confidence: matched / indicators.length,
    };
  },

  async getSessionKey(): Promise<string | null> {
    return 'sakai-session';
  },

  async getUserId(): Promise<string | null> {
    try {
      const session = await sakaiApi<{ userId?: string }>('/direct/session/current.json');
      return session.userId || null;
    } catch {
      return null;
    }
  },

  async extractCourses(_sesskey: string, _userId: string): Promise<ExtractedCourse[]> {
    try {
      const data = await sakaiApi<{ site_collection: SakaiSite[] }>(
        '/direct/site.json?_limit=100',
      );

      return (data.site_collection || [])
        .filter((s) => s.type === 'course')
        .map((s) => ({
          externalId: s.id,
          name: s.title,
          shortName: s.shortDescription,
          isCurrent: true,
          fileCount: 0,
          platform: 'sakai' as const,
        }));
    } catch {
      return [];
    }
  },

  async extractFiles(_sesskey: string, courseId: string): Promise<ExtractedFile[]> {
    try {
      const data = await sakaiApi<{ content_collection: SakaiResource[] }>(
        `/direct/content/site/${courseId}.json?_limit=500`,
      );

      return (data.content_collection || [])
        .filter((r) => r.type === 'resource')
        .map((r) => ({
          externalId: `sakai-${courseId}-${r.resourceId}`,
          courseExternalId: courseId,
          name: r.name,
          url: r.url || `/direct/content${r.resourceId}`,
          fileSize: r.size,
          itemType: 'file' as const,
          topicName: r.container || 'Recursos',
          timeModified: r.modifiedDate
            ? Math.floor(new Date(r.modifiedDate).getTime() / 1000)
            : undefined,
        }));
    } catch {
      return [];
    }
  },

  async extractEvents(_sesskey: string): Promise<ExtractedEvent[]> {
    return [];
  },

  async extractGrades(_sesskey: string, courseId: string, _userId: string): Promise<ExtractedGrade[]> {
    try {
      const data = await sakaiApi<{ assignments: SakaiGradeItem[] }>(
        `/direct/gradebook/site/${courseId}.json`,
      );

      return (data.assignments || [])
        .filter((g) => g.grade != null)
        .map((g) => ({
          externalId: `sakai-grade-${courseId}-${g.id}`,
          courseExternalId: courseId,
          itemName: g.itemName,
          grade: g.grade ? parseFloat(g.grade) : undefined,
          gradeMax: g.points,
          percentage: g.grade && g.points
            ? (parseFloat(g.grade) / g.points) * 100
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
