// ═══════════════════════════════════════════════════════════════
// PASSIVE LISTENER — Intercepta AJAX que Moodle/Canvas ya hacen
// CERO requests adicionales — solo escucha lo que la pagina carga
// Se activa automaticamente cuando el detector confirma un LMS
// ═══════════════════════════════════════════════════════════════

import type { ExtractedCourse, ExtractedEvent, ExtractedFile } from '@shared/types';

// ── Estado acumulado ─────────────────────────────────────────

interface PassiveData {
  courses: ExtractedCourse[];
  files: ExtractedFile[];
  events: ExtractedEvent[];
  lastUpdate: number;
}

const passiveData: PassiveData = {
  courses: [],
  files: [],
  events: [],
  lastUpdate: 0,
};

// ── Procesadores por funcion Moodle ──────────────────────────

type MoodleHandler = (args: Record<string, unknown>, data: unknown) => void;

const moodleHandlers: Record<string, MoodleHandler> = {
  'core_enrol_get_users_courses': (_args, data) => {
    if (!Array.isArray(data)) return;
    const now = Math.floor(Date.now() / 1000);

    passiveData.courses = data
      .filter((c: any) => c.visible !== 0)
      .map((c: any) => ({
        externalId: String(c.id),
        name: c.fullname || c.shortname,
        shortName: c.shortname,
        startDate: c.startdate || undefined,
        endDate: c.enddate || undefined,
        isCurrent: !c.enddate || c.enddate > now,
        fileCount: 0,
        platform: 'moodle' as const,
      }));

    passiveData.lastUpdate = Date.now();
    savePassiveData();
  },

  'core_course_get_contents': (args, data) => {
    if (!Array.isArray(data)) return;
    const courseId = String(args.courseid || '');
    if (!courseId) return;

    for (const section of data) {
      if (!section.modules) continue;
      for (const mod of section.modules) {
        if (!mod.contents) continue;
        for (const content of mod.contents) {
          if (!content.filename || !content.fileurl) continue;

          const exists = passiveData.files.some(
            (f) => f.externalId === `${courseId}-${mod.id}-${content.filename}`,
          );
          if (exists) continue;

          passiveData.files.push({
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
      }
    }

    passiveData.lastUpdate = Date.now();
    savePassiveData();
  },

  'core_calendar_get_calendar_events': (_args, data: any) => {
    const events = data?.events;
    if (!Array.isArray(events)) return;

    for (const e of events) {
      const exists = passiveData.events.some(
        (ev) => ev.externalId === String(e.id),
      );
      if (exists) continue;

      let eventType: ExtractedEvent['eventType'] = 'task';
      const mod = (e.modulename || '').toLowerCase();
      if (mod === 'assign' || mod === 'assignment') eventType = 'deadline';
      else if (mod === 'quiz') eventType = 'exam';
      else if (mod === 'bigbluebuttonbn' || mod === 'zoom') eventType = 'class';
      else if (mod === 'forum') eventType = 'forum';

      passiveData.events.push({
        externalId: String(e.id),
        title: e.name,
        description: e.description,
        courseExternalId: e.courseid ? String(e.courseid) : undefined,
        courseName: e.course?.fullname,
        startTime: e.timestart,
        endTime: e.timeduration > 0 ? e.timestart + e.timeduration : undefined,
        eventType,
        url: e.url,
      });
    }

    passiveData.lastUpdate = Date.now();
    savePassiveData();
  },

  'core_course_get_enrolled_courses_by_timeline_classification': (_args, data: any) => {
    const coursesList = data?.courses;
    if (!Array.isArray(coursesList)) return;
    const now = Math.floor(Date.now() / 1000);

    for (const c of coursesList) {
      if (!c.id) continue;
      const exists = passiveData.courses.some((pc) => pc.externalId === String(c.id));
      if (exists) continue;

      passiveData.courses.push({
        externalId: String(c.id),
        name: c.fullname || c.shortname,
        shortName: c.shortname,
        startDate: c.startdate || undefined,
        endDate: c.enddate || undefined,
        isCurrent: !c.enddate || c.enddate > now,
        fileCount: 0,
        platform: 'moodle' as const,
      });
    }

    passiveData.lastUpdate = Date.now();
    savePassiveData();
  },

  'core_calendar_get_action_events_by_timesort': (_args, data: any) => {
    const events = data?.events;
    if (!Array.isArray(events)) return;

    for (const e of events) {
      const exists = passiveData.events.some(
        (ev) => ev.externalId === `action-${e.id}`,
      );
      if (exists) continue;

      passiveData.events.push({
        externalId: `action-${e.id}`,
        title: e.name,
        description: e.description,
        courseExternalId: e.course?.id ? String(e.course.id) : undefined,
        courseName: e.course?.fullname,
        startTime: e.timesort,
        eventType: e.action?.actionable ? 'deadline' : 'task',
        url: e.url,
      });
    }

    passiveData.lastUpdate = Date.now();
    savePassiveData();
  },
};

// ── Guardar en storage para que el popup/SW lo lea ───────────

function savePassiveData(): void {
  chrome.storage.local.set({
    passiveData: {
      courses: passiveData.courses,
      files: passiveData.files.length,
      events: passiveData.events.length,
      lastUpdate: passiveData.lastUpdate,
    },
    detectedCourses: passiveData.courses,
  }).catch(() => {});
}

// ── Listener de postMessage desde el injector del main world ─

function handleInterceptedData(event: MessageEvent): void {
  if (event.origin !== window.location.origin) return;
  if (event.data?.type !== 'CONNIKU_PASSIVE_AJAX') return;

  const { methodname, args, response } = event.data;
  if (!methodname || response === undefined) return;

  const handler = moodleHandlers[methodname];
  if (handler) {
    try {
      handler(args || {}, response);
    } catch (err) {
      console.warn('[Conniku Passive] Error processing:', methodname, err);
    }
  }
}

// ── Inyectar interceptor en el main world ────────────────────
// Usa web_accessible_resource (archivo externo) para cumplir CSP

function injectPassiveInterceptor(): void {
  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('passive-interceptor.js');
    script.onload = () => script.remove();
    script.onerror = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
  } catch {
    // Si falla (CSP muy restrictiva), el modo pasivo no funciona
    // pero la extraccion activa sigue funcionando normalmente
  }
}

// ── Inicializar ──────────────────────────────────────────────

export function startPassiveListener(): void {
  window.addEventListener('message', handleInterceptedData);
  injectPassiveInterceptor();
}
