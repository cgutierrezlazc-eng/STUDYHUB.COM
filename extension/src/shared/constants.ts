// ═══════════════════════════════════════════════════════════════
// CONSTANTES — Extension Conniku
// ═══════════════════════════════════════════════════════════════

/** URL base de la API de Conniku */
export const API_BASE =
  import.meta.env?.VITE_API_URL ?? 'https://studyhub-api-bpco.onrender.com';

/** URL de la app web de Conniku */
export const APP_URL =
  import.meta.env?.VITE_APP_URL ?? 'https://conniku.com';

/** Delay entre requests al LMS (ms) — anti rate-limit */
export const THROTTLE_DELAY_MS = 1500;

/** Maximo de requests en una rafaga antes de pausa larga */
export const MAX_BURST_REQUESTS = 15;

/** Pausa larga despues de una rafaga (ms) */
export const BURST_PAUSE_MS = 5000;

/** Dias hacia adelante para sincronizar calendario */
export const CALENDAR_DAYS_FORWARD = 90;

/** Tipos MIME de archivos que se sincronizan (documentos academicos) */
export const SYNC_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.ms-excel',
  'text/plain',
  'application/zip',
]);

/** Extensiones de archivo que se sincronizan (fallback si no hay MIME) */
export const SYNC_FILE_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.ppt', '.pptx',
  '.xls', '.xlsx', '.txt', '.zip',
]);

/** Claves de chrome.storage.local */
export const STORAGE_KEYS = {
  TOKEN: 'connikuToken',
  USER: 'connikuUser',
  INSTANCES: 'lmsInstances',
  SYNC_STATUS: 'syncStatus',
} as const;
