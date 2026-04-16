// ═══════════════════════════════════════════════════════════════
// EXTRACTOR — Content script que extrae datos del LMS detectado
// Se inyecta SOLO cuando el detector confirma un LMS soportado
// Orquesta la extraccion completa: cursos, archivos, calendario, notas
// ═══════════════════════════════════════════════════════════════

import { moodleAdapter } from './adapters/moodle';
import { canvasAdapter } from './adapters/canvas';
import { blackboardAdapter } from './adapters/blackboard';
import { brightspaceAdapter } from './adapters/brightspace';
import { sakaiAdapter } from './adapters/sakai';
import type { LmsAdapter } from './adapters/base';
import type {
  ExtractedCourse,
  ExtractedFile,
  ExtractedEvent,
  ExtractedGrade,
  ExtractionPayload,
  MsgDataExtracted,
  MsgSyncStatus,
  PlatformType,
} from '@shared/types';
import { THROTTLE_DELAY_MS } from '@shared/constants';

// ── Registro de adaptadores ──────────────────────────────────

const adapterMap: Record<string, LmsAdapter> = {
  moodle: moodleAdapter,
  canvas: canvasAdapter,
  blackboard: blackboardAdapter,
  brightspace: brightspaceAdapter,
  sakai: sakaiAdapter,
};

// ── Throttle ─────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Comunicacion con service worker ──────────────────────────

function sendStatus(status: MsgSyncStatus['payload']): void {
  const msg: MsgSyncStatus = { type: 'SYNC_STATUS', payload: status };
  chrome.runtime.sendMessage(msg).catch(() => {});
}

function sendData(payload: ExtractionPayload): void {
  const msg: MsgDataExtracted = { type: 'DATA_EXTRACTED', payload };
  chrome.runtime.sendMessage(msg).catch(() => {});
}

// ── Extraccion principal ─────────────────────────────────────

/**
 * Ejecuta la extraccion completa para la plataforma detectada.
 * Llamado por el service worker via chrome.scripting.executeScript
 * cuando el usuario pide sincronizar.
 */
export async function extractAll(
  platform: PlatformType,
  mode: 'full' | 'update' = 'full',
  courseIds?: string[],
): Promise<void> {
  const adapter = adapterMap[platform];
  if (!adapter) {
    sendStatus({ state: 'error', error: `Plataforma no soportada: ${platform}` });
    return;
  }

  try {
    // 1. Obtener sesskey y userId
    sendStatus({ state: 'syncing', progress: { step: 'courses', current: 0, total: 0 } });

    const sesskey = await adapter.getSessionKey();
    if (!sesskey) {
      sendStatus({ state: 'error', error: 'No se pudo obtener la clave de sesion. Asegurate de estar logueado.' });
      return;
    }

    const userId = await adapter.getUserId();
    if (!userId) {
      sendStatus({ state: 'error', error: 'No se pudo identificar tu usuario. Recarga la pagina.' });
      return;
    }

    // 2. Extraer cursos
    const allCourses = await adapter.extractCourses(sesskey, userId);
    const coursesToSync = courseIds
      ? allCourses.filter((c) => courseIds.includes(c.externalId))
      : allCourses;

    // Guardar cursos en storage para que el popup los lea
    chrome.storage.local.set({ detectedCourses: allCourses }).catch(() => {});

    sendStatus({
      state: 'syncing',
      coursesFound: allCourses.length,
      progress: { step: 'courses', current: allCourses.length, total: allCourses.length },
    });

    await delay(THROTTLE_DELAY_MS);

    // 3. Extraer archivos por curso
    const allFiles: ExtractedFile[] = [];
    for (let i = 0; i < coursesToSync.length; i++) {
      const course = coursesToSync[i];

      sendStatus({
        state: 'syncing',
        progress: {
          step: 'files',
          current: i,
          total: coursesToSync.length,
          currentItem: course.name,
        },
      });

      try {
        const files = await adapter.extractFiles(sesskey, course.externalId);
        allFiles.push(...files);
        // Actualizar fileCount en el curso
        course.fileCount = files.filter((f) => f.itemType === 'file').length;
      } catch (err) {
        console.warn(`[Conniku] Error extrayendo archivos de ${course.name}:`, err);
      }

      await delay(THROTTLE_DELAY_MS);
    }

    // 4. Extraer calendario
    sendStatus({
      state: 'syncing',
      progress: { step: 'calendar', current: 0, total: 1, currentItem: 'Calendario' },
    });

    let allEvents: ExtractedEvent[] = [];
    try {
      allEvents = await adapter.extractEvents(sesskey);
    } catch (err) {
      console.warn('[Conniku] Error extrayendo calendario:', err);
    }

    await delay(THROTTLE_DELAY_MS);

    // 5. Extraer calificaciones por curso
    const allGrades: ExtractedGrade[] = [];
    for (let i = 0; i < coursesToSync.length; i++) {
      const course = coursesToSync[i];

      sendStatus({
        state: 'syncing',
        progress: {
          step: 'grades',
          current: i,
          total: coursesToSync.length,
          currentItem: course.name,
        },
      });

      try {
        const grades = await adapter.extractGrades(sesskey, course.externalId, userId);
        allGrades.push(...grades);
      } catch (err) {
        console.warn(`[Conniku] Error extrayendo notas de ${course.name}:`, err);
      }

      await delay(THROTTLE_DELAY_MS);
    }

    // 6. Empaquetar y enviar (usar origin capturado al inicio, no re-detectar)
    const payload: ExtractionPayload = {
      platform,
      baseUrl: window.location.origin,
      siteName: document.title.replace(/:.*$/, '').trim() || window.location.hostname,
      userId,
      timestamp: Date.now(),
      courses: coursesToSync,
      files: allFiles,
      events: allEvents,
      grades: allGrades,
    };

    sendData(payload);

    sendStatus({
      state: 'synced',
      lastSync: Date.now(),
      stats: {
        courses: coursesToSync.length,
        files: allFiles.filter((f) => f.itemType === 'file').length,
        events: allEvents.length,
        grades: allGrades.length,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    sendStatus({ state: 'error', error: message });
  }
}

// ── Listener de mensajes del service worker ──────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'EXTRACT_REQUEST') {
    const { mode, courseIds } = message.payload || {};

    // Detectar plataforma actual
    const adapter = Object.values(adapterMap).find((a) => a.detect());
    if (!adapter) {
      sendResponse({ success: false, error: 'No se detecta un LMS en esta pagina' });
      return true;
    }

    // Ejecutar extraccion asincrona
    extractAll(adapter.platform, mode || 'full', courseIds)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: String(err) }));

    return true; // Mantener canal abierto para respuesta asincrona
  }

  return false;
});
