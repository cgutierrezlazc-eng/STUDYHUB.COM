// ═══════════════════════════════════════════════════════════════
// ADAPTADOR BRIGHTSPACE (D2L) — Extraccion via Valence API
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

async function d2lApi<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Accept': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Brightspace API error: HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

// ── Tipos ────────────────────────────────────────────────────

interface D2LEnrollment {
  OrgUnit: {
    Id: number;
    Name: string;
    Code?: string;
    Type?: { Id: number; Name: string };
  };
  Access?: { StartDate?: string; EndDate?: string; IsActive?: boolean };
}

interface D2LModule {
  ModuleId: number;
  Title: string;
  Topics?: D2LTopic[];
}

interface D2LTopic {
  TopicId: number;
  Title: string;
  Url?: string;
  TypeIdentifier?: string;
}

interface D2LGradeItem {
  Id: number;
  Name: string;
  MaxPoints?: number;
}

interface D2LGradeValue {
  PointsNumerator?: number;
  PointsDenominator?: number;
  DisplayedGrade?: string;
}

// ── Adaptador ────────────────────────────────────────────────

export const brightspaceAdapter: LmsAdapter = {
  platform: 'brightspace',

  detect(): PlatformDetection | null {
    const indicators: boolean[] = [];

    // 1. URL patterns de Brightspace/D2L
    const url = window.location.href;
    indicators.push(/\/d2l\//.test(url));

    // 2. D2L scripts o CSS
    indicators.push(!!document.querySelector('script[src*="/d2l/"], link[href*="/d2l/"]'));

    // 3. Brightspace DOM markers
    indicators.push(!!document.querySelector('.d2l-page, .d2l-navigation, [class*="d2l-"]'));

    // 4. Meta viewport con d2l
    const meta = document.querySelector('meta[name="application-name"]');
    indicators.push(meta?.getAttribute('content')?.toLowerCase().includes('brightspace') ?? false);

    const matched = indicators.filter(Boolean).length;
    if (matched < 2) return null;

    const siteName =
      document.querySelector('.d2l-branding-navigation-title')?.textContent?.trim() ||
      document.title.replace(/ - .*$/, '').trim() ||
      window.location.hostname;

    return {
      platform: 'brightspace',
      baseUrl: window.location.origin,
      siteName,
      confidence: matched / indicators.length,
    };
  },

  async getSessionKey(): Promise<string | null> {
    return 'd2l-session';
  },

  async getUserId(): Promise<string | null> {
    try {
      const who = await d2lApi<{ Identifier: string }>('/d2l/api/lp/1.0/users/whoami');
      return who.Identifier;
    } catch {
      return null;
    }
  },

  async extractCourses(_sesskey: string, _userId: string): Promise<ExtractedCourse[]> {
    try {
      const data = await d2lApi<{ Items: D2LEnrollment[] }>(
        '/d2l/api/lp/1.0/enrollments/myenrollments/?sortBy=StartDate&isActive=true',
      );

      return (data.Items || [])
        .filter((e) => e.OrgUnit.Type?.Name === 'Course Offering')
        .map((e) => ({
          externalId: String(e.OrgUnit.Id),
          name: e.OrgUnit.Name,
          shortName: e.OrgUnit.Code,
          isCurrent: e.Access?.IsActive ?? true,
          fileCount: 0,
          platform: 'brightspace' as const,
        }));
    } catch {
      return [];
    }
  },

  async extractFiles(_sesskey: string, courseId: string): Promise<ExtractedFile[]> {
    try {
      const modules = await d2lApi<D2LModule[]>(
        `/d2l/api/le/1.0/${courseId}/content/root/`,
      );

      const files: ExtractedFile[] = [];
      for (const mod of modules) {
        for (const topic of mod.Topics || []) {
          if (topic.TypeIdentifier === 'File' && topic.Url) {
            files.push({
              externalId: `d2l-${courseId}-${topic.TopicId}`,
              courseExternalId: courseId,
              name: topic.Title,
              url: topic.Url,
              itemType: 'file',
              topicName: mod.Title,
            });
          }
        }
      }
      return files;
    } catch {
      return [];
    }
  },

  async extractEvents(_sesskey: string): Promise<ExtractedEvent[]> {
    return [];
  },

  async extractGrades(_sesskey: string, courseId: string, _userId: string): Promise<ExtractedGrade[]> {
    try {
      const items = await d2lApi<D2LGradeItem[]>(
        `/d2l/api/le/1.0/${courseId}/grades/`,
      );

      const grades: ExtractedGrade[] = [];
      for (const item of items) {
        try {
          const value = await d2lApi<D2LGradeValue>(
            `/d2l/api/le/1.0/${courseId}/grades/${item.Id}/values/myGradeValue`,
          );
          grades.push({
            externalId: `d2l-grade-${courseId}-${item.Id}`,
            courseExternalId: courseId,
            itemName: item.Name,
            grade: value.PointsNumerator,
            gradeMax: value.PointsDenominator ?? item.MaxPoints,
            percentage: value.PointsDenominator
              ? ((value.PointsNumerator ?? 0) / value.PointsDenominator) * 100
              : undefined,
          });
        } catch {
          // Sin nota para este item
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
