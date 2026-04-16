// ═══════════════════════════════════════════════════════════════
// TIPOS COMPARTIDOS — Extension Conniku
// Usados por: content scripts, service worker, popup
// ═══════════════════════════════════════════════════════════════

/** Plataformas LMS soportadas */
export type PlatformType =
  | 'moodle'
  | 'canvas'
  | 'blackboard'
  | 'brightspace'
  | 'sakai'
  | 'google-classroom'
  | 'teams'
  | 'unknown';

/** Resultado de deteccion de plataforma */
export interface PlatformDetection {
  platform: PlatformType;
  baseUrl: string;
  siteName: string;
  confidence: number; // 0-1 — cuantos indicadores matchearon
  userId?: string;
  sesskey?: string;
}

/** Curso extraido de la plataforma LMS */
export interface ExtractedCourse {
  externalId: string;
  name: string;
  shortName?: string;
  startDate?: number; // Unix timestamp
  endDate?: number;
  isCurrent: boolean;
  fileCount: number;
  platform: PlatformType;
}

/** Archivo/recurso extraido de un curso */
export interface ExtractedFile {
  externalId: string;
  courseExternalId: string;
  name: string;
  url: string;
  mimeType?: string;
  fileSize?: number;
  topicName?: string;
  topicOrder?: number;
  itemType: 'file' | 'url' | 'assignment' | 'quiz' | 'page';
  timeModified?: number;
}

/** Evento de calendario extraido */
export interface ExtractedEvent {
  externalId: string;
  title: string;
  description?: string;
  courseExternalId?: string;
  courseName?: string;
  startTime: number; // Unix timestamp
  endTime?: number;
  eventType: 'deadline' | 'exam' | 'class' | 'forum' | 'task';
  url?: string;
  submissionStatus?: 'submitted' | 'draft' | 'pending' | 'graded' | 'unknown';
}

/** Calificacion extraida */
export interface ExtractedGrade {
  externalId: string;
  courseExternalId: string;
  itemName: string;
  grade?: number | string;
  gradeMax?: number;
  percentage?: number;
  weight?: number;
  feedback?: string;
  timeModified?: number;
}

/** Paquete completo de datos extraidos de una instancia LMS */
export interface ExtractionPayload {
  platform: PlatformType;
  baseUrl: string;
  siteName: string;
  userId: string;
  timestamp: number;
  courses: ExtractedCourse[];
  files: ExtractedFile[];
  events: ExtractedEvent[];
  grades: ExtractedGrade[];
}

// ═══════════════════════════════════════════════════════════════
// MENSAJES INTERNOS — Content Script <-> Service Worker
// ═══════════════════════════════════════════════════════════════

/** Moodle detectado en la pagina actual */
export interface MsgPlatformDetected {
  type: 'PLATFORM_DETECTED';
  payload: PlatformDetection;
}

/** Datos extraidos listos para enviar */
export interface MsgDataExtracted {
  type: 'DATA_EXTRACTED';
  payload: ExtractionPayload;
}

/** Solicitud de extraccion desde popup/background */
export interface MsgExtractRequest {
  type: 'EXTRACT_REQUEST';
  payload: {
    mode: 'full' | 'update';
    courseIds?: string[];
  };
}

/** Estado de sincronizacion */
export interface MsgSyncStatus {
  type: 'SYNC_STATUS';
  payload: SyncStatus;
}

/** Sesskey obtenido del injector */
export interface MsgSesskeyObtained {
  type: 'SESSKEY_OBTAINED';
  payload: {
    sesskey: string;
    userId: string;
    wwwroot: string;
  };
}

export type ExtensionMessage =
  | MsgPlatformDetected
  | MsgDataExtracted
  | MsgExtractRequest
  | MsgSyncStatus
  | MsgSesskeyObtained;

// ═══════════════════════════════════════════════════════════════
// ESTADO DE LA EXTENSION
// ═══════════════════════════════════════════════════════════════

export type ConnectionState =
  | 'logged_out'       // Sin sesion Conniku
  | 'idle'             // Logueado pero sin campus detectado
  | 'detected'         // Campus detectado, cursos encontrados
  | 'syncing'          // Sincronizando datos
  | 'synced'           // Todo sincronizado
  | 'error';           // Error en la conexion

export interface SyncStatus {
  state: ConnectionState;
  platform?: PlatformDetection;
  coursesFound?: number;
  coursesSelected?: number;
  progress?: SyncProgress;
  lastSync?: number; // Unix timestamp
  error?: string;
  stats?: SyncStats;
}

export interface SyncProgress {
  step: 'courses' | 'files' | 'calendar' | 'grades';
  current: number;
  total: number;
  currentItem?: string;
}

export interface SyncStats {
  courses: number;
  files: number;
  events: number;
  grades: number;
  newFiles?: number;
}

// ═══════════════════════════════════════════════════════════════
// ALMACENAMIENTO LOCAL (chrome.storage.local)
// ═══════════════════════════════════════════════════════════════

export interface StorageSchema {
  /** JWT token de Conniku */
  connikuToken?: string;
  /** Nombre del usuario en Conniku */
  connikuUser?: string;
  /** Instancias LMS detectadas y conectadas */
  lmsInstances: LmsInstance[];
  /** Estado actual de la extension */
  syncStatus: SyncStatus;
}

export interface LmsInstance {
  id: string;
  platform: PlatformType;
  baseUrl: string;
  siteName: string;
  userId: string;
  lastSync?: number;
  courses: ExtractedCourse[];
}
