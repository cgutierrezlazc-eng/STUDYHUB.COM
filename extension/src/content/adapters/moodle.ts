// ═══════════════════════════════════════════════════════════════
// ADAPTADOR MOODLE — Extraccion de datos via /lib/ajax/service.php
// Usa la sesion activa del estudiante (MoodleSession cookie + sesskey)
// NO requiere que la universidad tenga Web Services habilitados
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

// ── Deteccion ────────────────────────────────────────────────

/** Indicadores DOM que confirman que la pagina es Moodle */
const MOODLE_BODY_CLASSES = [
  'path-course', 'path-my', 'path-mod', 'path-grade',
  'path-calendar', 'path-admin', 'path-user', 'path-login',
  'pagelayout-standard', 'pagelayout-course', 'pagelayout-mydashboard',
  'pagelayout-incourse', 'pagelayout-admin',
];

// ── Helpers AJAX ─────────────────────────────────────────────

/**
 * Llama al endpoint AJAX interno de Moodle.
 * Usa la sesion activa del estudiante (cookies se envian automaticamente).
 * NO es lo mismo que el Web Service API — este endpoint funciona siempre.
 */
async function moodleAjax<T>(
  sesskey: string,
  methodname: string,
  args: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(
    `/lib/ajax/service.php?sesskey=${encodeURIComponent(sesskey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify([{ index: 0, methodname, args }]),
    },
  );

  if (!response.ok) {
    throw new Error(`Moodle AJAX error: HTTP ${response.status}`);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error('Moodle AJAX: respuesta no es JSON valido');
  }

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Moodle AJAX: respuesta vacia o formato inesperado');
  }

  const entry = data[0] as Record<string, unknown>;

  if (entry.error) {
    const exc = entry.exception as Record<string, string> | undefined;
    const msg = exc?.message || exc?.errorcode || 'Error desconocido';
    throw new Error(`Moodle AJAX: ${msg}`);
  }

  if (entry.data === undefined || entry.data === null) {
    throw new Error('Moodle AJAX: respuesta sin datos');
  }

  // El cast a T es necesario porque el tipo exacto depende de la funcion llamada.
  // La validacion anterior garantiza que data existe y no es un error.
  return entry.data as T;
}

// ── Tipos de respuesta Moodle ────────────────────────────────

interface MoodleCourse {
  id: number;
  shortname: string;
  fullname: string;
  startdate: number;
  enddate: number;
  visible: number;
  enrolledusercount?: number;
}

interface MoodleSection {
  id: number;
  name: string;
  visible: number;
  modules: MoodleModule[];
}

interface MoodleModule {
  id: number;
  name: string;
  modname: string;
  url?: string;
  contents?: MoodleContent[];
}

interface MoodleContent {
  filename: string;
  fileurl: string;
  filesize: number;
  type: string;
  mimetype?: string;
  timecreated: number;
  timemodified: number;
}

interface MoodleEvent {
  id: number;
  name: string;
  description?: string;
  timestart: number;
  timeduration: number;
  eventtype: string;
  courseid?: number;
  modulename?: string;
  url?: string;
  course?: { fullname?: string };
}

interface MoodleGradeItem {
  itemname?: string;
  graderaw?: number;
  grademax?: number;
  percentageformatted?: string;
  feedback?: string;
  gradedatesubmitted?: number;
}

interface MoodleGradesResponse {
  usergrades?: Array<{
    gradeitems?: MoodleGradeItem[];
  }>;
}

// ── Mapeo de tipos de evento ─────────────────────────────────

function mapMoodleEventType(modulename?: string, eventtype?: string): ExtractedEvent['eventType'] {
  const mod = (modulename || '').toLowerCase();
  if (mod === 'assign' || mod === 'assignment' || mod === 'workshop') return 'deadline';
  if (mod === 'quiz' || mod === 'questionnaire') return 'exam';
  if (mod === 'bigbluebuttonbn' || mod === 'zoom' || mod === 'teams' || mod === 'attendance') return 'class';
  if (mod === 'forum' || mod === 'chat') return 'forum';
  if (eventtype === 'due') return 'deadline';
  return 'task';
}

// ── Lectura segura de M.cfg desde main world ────────────────

interface MoodleCfgResult {
  sesskey: string | null;
  userid: string | null;
  wwwroot: string | null;
}

/** Cache con TTL para evitar busquedas repetidas pero permitir refresh */
let _cachedCfg: MoodleCfgResult | null = null;
let _cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Lee sesskey y userId del DOM de Moodle.
 * NO usa inline script injection — extrae de multiples fuentes DOM.
 * Resultado se cachea para evitar busquedas repetidas.
 */
function _getMoodleCfg(): Promise<MoodleCfgResult | null> {
  if (_cachedCfg && (Date.now() - _cachedAt) < CACHE_TTL_MS) {
    return Promise.resolve(_cachedCfg);
  }

  let sesskey: string | null = null;
  let userid: string | null = null;
  const wwwroot: string | null = window.location.origin;

  // ── Metodo 1: sesskey desde link de logout ──
  const logoutLink = document.querySelector('a[href*="sesskey="]');
  if (logoutLink) {
    try {
      const url = new URL(logoutLink.getAttribute('href') || '', window.location.origin);
      sesskey = url.searchParams.get('sesskey');
    } catch { /* URL invalida */ }
  }

  // ── Metodo 2: sesskey desde input hidden ──
  if (!sesskey) {
    const input = document.querySelector<HTMLInputElement>('input[name="sesskey"]');
    sesskey = input?.value || null;
  }

  // ── Metodo 3: sesskey desde data attributes ──
  if (!sesskey) {
    const el = document.querySelector('[data-sesskey]');
    sesskey = el?.getAttribute('data-sesskey') || null;
  }

  // ── Metodo 4: sesskey desde scripts inline (regex, no injection) ──
  if (!sesskey) {
    const scripts = document.querySelectorAll('script:not([src])');
    for (const s of scripts) {
      const text = s.textContent || '';
      const match = text.match(/"sesskey"\s*:\s*"([a-zA-Z0-9]+)"/);
      if (match) {
        sesskey = match[1];
        break;
      }
    }
  }

  // ── userId desde data attributes ──
  const userMenuLink = document.querySelector('a[href*="/user/profile.php?id="]');
  if (userMenuLink) {
    try {
      const url = new URL(userMenuLink.getAttribute('href') || '', window.location.origin);
      userid = url.searchParams.get('id');
    } catch { /* URL invalida */ }
  }

  // ── userId desde body data attribute ──
  if (!userid) {
    const body = document.body;
    userid = body?.getAttribute('data-userid') || null;
  }

  // ── userId desde scripts inline (regex) ──
  if (!userid) {
    const scripts = document.querySelectorAll('script:not([src])');
    for (const s of scripts) {
      const text = s.textContent || '';
      const match = text.match(/"userid"\s*:\s*(\d+)/);
      if (match) {
        userid = match[1];
        break;
      }
    }
  }

  if (sesskey || userid) {
    _cachedCfg = { sesskey, userid, wwwroot };
    _cachedAt = Date.now();
    return Promise.resolve(_cachedCfg);
  }

  // ── Fallback: escuchar postMessage del injector.js si fue cargado ──
  return new Promise((resolve) => {
    const expectedOrigin = window.location.origin;

    const handler = (event: MessageEvent) => {
      if (event.origin !== expectedOrigin) return;
      if (event.data?.type !== 'CONNIKU_MOODLE_CFG') return;

      window.removeEventListener('message', handler);
      _cachedCfg = {
        sesskey: event.data.sesskey || null,
        userid: event.data.userid || null,
        wwwroot: event.data.wwwroot || null,
      };
      _cachedAt = Date.now();
      resolve(_cachedCfg);
    };
    window.addEventListener('message', handler);

    // Timeout corto — si injector.js no esta cargado, retornar null
    setTimeout(() => {
      window.removeEventListener('message', handler);
      resolve(null);
    }, 1000);
  });
}

// ── DOM Scraping fallback (cuando AJAX no esta disponible) ───

/**
 * Extrae cursos del DOM del dashboard de Moodle.
 * Funciona en Moodle 3.x y 4.x, con temas Boost y Classic.
 * NO hace requests adicionales — lee el HTML ya renderizado.
 */
function _scrapeCoursesFromDOM(): ExtractedCourse[] {
  const seen = new Set<string>();
  const courses: ExtractedCourse[] = [];

  // Metodo A: elementos con data-courseid o data-course-id (Moodle 3.9+ / 4.x)
  const dataSelectors = '[data-courseid], [data-course-id]';
  document.querySelectorAll<HTMLElement>(dataSelectors).forEach((el) => {
    const courseId = el.getAttribute('data-courseid') || el.getAttribute('data-course-id');
    if (!courseId || seen.has(courseId)) return;

    const nameEl =
      el.querySelector('.coursename a, .course-title, [data-field="fullname"], .multiline, h4, h3') ||
      el.querySelector('a[href*="/course/view.php"]');

    const name = nameEl?.textContent?.trim();
    if (!name) return;

    seen.add(courseId);
    courses.push({
      externalId: courseId,
      name,
      shortName: el.getAttribute('data-shortname') || undefined,
      isCurrent: true,
      fileCount: 0,
      platform: 'moodle' as const,
    });
  });

  // Metodo B: links /course/view.php?id=X (funciona en CUALQUIER Moodle)
  document.querySelectorAll<HTMLAnchorElement>('a[href*="/course/view.php?id="]').forEach((a) => {
    try {
      const url = new URL(a.href, window.location.origin);
      const courseId = url.searchParams.get('id');
      if (!courseId || seen.has(courseId)) return;

      // Solo incluir si viene de un contenedor de cursos o del nav drawer
      const isRelevant =
        a.closest('#nav-drawer, .block_myoverview, .block_course_list, .coursebox, .card-deck, [class*="course"], .course-list-container') !== null;
      const isBreadcrumb = a.closest('.breadcrumb') !== null;

      if (!isRelevant || isBreadcrumb) return;

      const name = a.textContent?.trim() || a.title || '';
      if (!name || name.length < 2) return;

      seen.add(courseId);
      courses.push({
        externalId: courseId,
        name,
        isCurrent: true,
        fileCount: 0,
        platform: 'moodle' as const,
      });
    } catch { /* URL invalida */ }
  });

  return courses;
}

/**
 * Fallback: fetch /my/ y parsear el HTML para extraer cursos.
 * Funciona incluso si el estudiante no esta en el dashboard.
 * Usa las cookies de sesion del navegador.
 */
async function _fetchAndScrapeDashboard(): Promise<ExtractedCourse[]> {
  try {
    const response = await fetch('/my/', {
      credentials: 'same-origin',
      headers: { 'Accept': 'text/html' },
    });
    if (!response.ok) return [];

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const seen = new Set<string>();
    const courses: ExtractedCourse[] = [];

    // Buscar data attributes primero
    doc.querySelectorAll<HTMLElement>('[data-courseid], [data-course-id]').forEach((el) => {
      const courseId = el.getAttribute('data-courseid') || el.getAttribute('data-course-id');
      if (!courseId || seen.has(courseId)) return;

      const nameEl = el.querySelector('.coursename a, .course-title, h4, h3, a[href*="/course/view.php"]');
      const name = nameEl?.textContent?.trim();
      if (!name) return;

      seen.add(courseId);
      courses.push({
        externalId: courseId,
        name,
        isCurrent: true,
        fileCount: 0,
        platform: 'moodle' as const,
      });
    });

    // Fallback: links de cursos en el nav drawer y bloques
    doc.querySelectorAll<HTMLAnchorElement>('a[href*="/course/view.php?id="]').forEach((a) => {
      try {
        const url = new URL(a.getAttribute('href') || '', window.location.origin);
        const courseId = url.searchParams.get('id');
        if (!courseId || seen.has(courseId)) return;

        const isRelevant = a.closest('#nav-drawer, .block_myoverview, .block_course_list, .coursebox, [class*="course"]') !== null;
        if (!isRelevant) return;

        const name = a.textContent?.trim() || '';
        if (!name || name.length < 2) return;

        seen.add(courseId);
        courses.push({
          externalId: courseId,
          name,
          isCurrent: true,
          fileCount: 0,
          platform: 'moodle' as const,
        });
      } catch { /* URL invalida */ }
    });

    return courses;
  } catch {
    return [];
  }
}

// ── Adaptador ────────────────────────────────────────────────

export const moodleAdapter: LmsAdapter = {
  platform: 'moodle',

  detect(): PlatformDetection | null {
    const indicators: boolean[] = [];

    // 1. Body classes de Moodle
    const bodyClasses = document.body?.className || '';
    indicators.push(MOODLE_BODY_CLASSES.some((c) => bodyClasses.includes(c)));

    // 2. Meta tag generator
    const generator = document.querySelector('meta[name="generator"]');
    indicators.push(generator?.getAttribute('content')?.toLowerCase().includes('moodle') ?? false);

    // 3. Cookie MoodleSession
    indicators.push(document.cookie.includes('MoodleSession'));

    // 4. Scripts de Moodle
    indicators.push(!!document.querySelector('script[src*="/lib/requirejs/"]'));

    // 5. Elemento #page (estructura Moodle)
    indicators.push(!!document.getElementById('page'));

    // 6. URL patterns tipicas
    const url = window.location.href;
    indicators.push(
      /\/(my|course\/view|mod\/\w+\/view|grade\/report|calendar\/view|login\/index)/.test(url),
    );

    const matched = indicators.filter(Boolean).length;
    const confidence = matched / indicators.length;

    // Al menos 2 indicadores para confirmar
    if (matched < 2) return null;

    // Intentar obtener nombre del sitio
    const siteName =
      document.querySelector('.site-name')?.textContent?.trim() ||
      document.querySelector('.navbar-brand')?.textContent?.trim() ||
      document.title.replace(/:.*$/, '').trim() ||
      window.location.hostname;

    return {
      platform: 'moodle',
      baseUrl: window.location.origin,
      siteName,
      confidence,
    };
  },

  async getSessionKey(): Promise<string | null> {
    const cfg = await _getMoodleCfg();
    return cfg?.sesskey || null;
  },

  async getUserId(): Promise<string | null> {
    const cfg = await _getMoodleCfg();
    return cfg?.userid || null;
  },

  async extractCourses(sesskey: string, userId: string): Promise<ExtractedCourse[]> {
    // ── 1. Intentar AJAX: core_enrol_get_users_courses ──
    try {
      const raw = await moodleAjax<MoodleCourse[]>(
        sesskey,
        'core_enrol_get_users_courses',
        { userid: parseInt(userId, 10) },
      );
      const now = Math.floor(Date.now() / 1000);
      return raw
        .filter((c) => c.visible !== 0)
        .map((c) => ({
          externalId: String(c.id),
          name: c.fullname,
          shortName: c.shortname,
          startDate: c.startdate || undefined,
          endDate: c.enddate || undefined,
          isCurrent: c.enddate === 0 || c.enddate > now,
          fileCount: 0,
          platform: 'moodle' as const,
        }));
    } catch {
      console.warn('[Conniku] AJAX core_enrol_get_users_courses no disponible, intentando alternativas...');
    }

    // ── 2. Intentar AJAX alternativo: core_course_get_enrolled_courses_by_timeline_classification ──
    try {
      const raw = await moodleAjax<{ courses: MoodleCourse[] }>(
        sesskey,
        'core_course_get_enrolled_courses_by_timeline_classification',
        { classification: 'all', limit: 0 },
      );
      if (raw.courses && raw.courses.length > 0) {
        const now = Math.floor(Date.now() / 1000);
        return raw.courses.map((c) => ({
          externalId: String(c.id),
          name: c.fullname,
          shortName: c.shortname,
          startDate: c.startdate || undefined,
          endDate: c.enddate || undefined,
          isCurrent: c.enddate === 0 || c.enddate > now,
          fileCount: 0,
          platform: 'moodle' as const,
        }));
      }
    } catch {
      console.warn('[Conniku] AJAX timeline classification no disponible');
    }

    // ── 3. DOM scraping de la pagina actual ──
    const domCourses = _scrapeCoursesFromDOM();
    if (domCourses.length > 0) return domCourses;

    // ── 4. Fetch /my/ y parsear HTML ──
    const fetchedCourses = await _fetchAndScrapeDashboard();
    if (fetchedCourses.length > 0) return fetchedCourses;

    // ── 5. Sin resultados ──
    console.warn('[Conniku] No se pudieron extraer cursos por ningún método');
    return [];
  },

  async extractFiles(sesskey: string, courseId: string): Promise<ExtractedFile[]> {
    let sections: MoodleSection[];
    try {
      sections = await moodleAjax<MoodleSection[]>(
        sesskey,
        'core_course_get_contents',
        { courseid: parseInt(courseId, 10) },
      );
    } catch {
      // AJAX no disponible — retornar vacio (los archivos se pueden agregar manualmente)
      return [];
    }

    const files: ExtractedFile[] = [];

    for (const section of sections) {
      if (section.visible === 0) continue;

      for (const mod of section.modules) {
        if (!mod.contents) continue;

        for (const content of mod.contents) {
          // Solo archivos documentales
          const ext = content.filename.substring(content.filename.lastIndexOf('.')).toLowerCase();
          const isSyncable =
            (content.mimetype && (
              content.mimetype.includes('pdf') ||
              content.mimetype.includes('word') ||
              content.mimetype.includes('presentation') ||
              content.mimetype.includes('spreadsheet') ||
              content.mimetype.includes('text/plain') ||
              content.mimetype.includes('zip')
            )) || SYNC_FILE_EXTENSIONS.has(ext);

          if (!isSyncable) continue;

          files.push({
            externalId: `${courseId}-${mod.id}-${content.filename}`,
            courseExternalId: courseId,
            name: content.filename,
            url: content.fileurl,
            mimeType: content.mimetype,
            fileSize: content.filesize,
            topicName: section.name,
            topicOrder: section.id,
            itemType: 'file',
            timeModified: content.timemodified,
          });
        }

        // Tambien capturar actividades (assignments, quizzes) como items
        if (mod.modname === 'assign' || mod.modname === 'assignment') {
          files.push({
            externalId: `${courseId}-assign-${mod.id}`,
            courseExternalId: courseId,
            name: mod.name,
            url: mod.url || '',
            topicName: section.name,
            topicOrder: section.id,
            itemType: 'assignment',
          });
        } else if (mod.modname === 'quiz') {
          files.push({
            externalId: `${courseId}-quiz-${mod.id}`,
            courseExternalId: courseId,
            name: mod.name,
            url: mod.url || '',
            topicName: section.name,
            topicOrder: section.id,
            itemType: 'quiz',
          });
        }
      }
    }

    return files;
  },

  async extractEvents(sesskey: string): Promise<ExtractedEvent[]> {
    const now = Math.floor(Date.now() / 1000);
    const future = now + CALENDAR_DAYS_FORWARD * 24 * 60 * 60;

    interface CalendarResponse {
      events: MoodleEvent[];
    }

    const response = await moodleAjax<CalendarResponse>(
      sesskey,
      'core_calendar_get_calendar_events',
      {
        events: { courseids: [], groupids: [] },
        options: {
          timestart: now,
          timeend: future,
          userevents: true,
          siteevents: true,
        },
      },
    );

    return (response.events || []).map((e) => ({
      externalId: String(e.id),
      title: e.name,
      description: e.description,
      courseExternalId: e.courseid ? String(e.courseid) : undefined,
      courseName: e.course?.fullname,
      startTime: e.timestart,
      endTime: e.timeduration > 0 ? e.timestart + e.timeduration : undefined,
      eventType: mapMoodleEventType(e.modulename, e.eventtype),
      url: e.url,
    }));
  },

  async extractGrades(sesskey: string, courseId: string, userId: string): Promise<ExtractedGrade[]> {
    try {
      const response = await moodleAjax<MoodleGradesResponse>(
        sesskey,
        'gradereport_user_get_grade_items',
        {
          courseid: parseInt(courseId, 10),
          userid: parseInt(userId, 10),
        },
      );

      const userGrades = response.usergrades?.[0]?.gradeitems || [];

      return userGrades
        .filter((g) => g.itemname) // Solo items con nombre (no categorias vacias)
        .map((g) => ({
          externalId: `${courseId}-grade-${g.itemname}`,
          courseExternalId: courseId,
          itemName: g.itemname!,
          grade: g.graderaw ?? undefined,
          gradeMax: g.grademax ?? undefined,
          percentage: g.percentageformatted ? parseFloat(g.percentageformatted) : undefined,
          feedback: g.feedback || undefined,
          timeModified: g.gradedatesubmitted || undefined,
        }));
    } catch {
      // gradereport_user_get_grade_items puede no estar disponible en todos los Moodle
      // Fallback: retornar vacio sin error
      return [];
    }
  },

  async downloadFile(fileUrl: string): Promise<{ base64: string; mimeType: string; size: number }> {
    const response = await fetch(fileUrl, { credentials: 'same-origin' });

    if (!response.ok) {
      throw new Error(`Download failed: HTTP ${response.status}`);
    }

    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Extraer solo la parte base64 (sin el prefijo data:...;base64,)
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
