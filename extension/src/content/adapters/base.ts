// ═══════════════════════════════════════════════════════════════
// ADAPTADOR BASE — Interfaz comun para todos los LMS
// Cada plataforma implementa esta interfaz con su logica especifica
// ═══════════════════════════════════════════════════════════════

import type {
  ExtractedCourse,
  ExtractedEvent,
  ExtractedFile,
  ExtractedGrade,
  PlatformDetection,
  PlatformType,
} from '@shared/types';

export interface LmsAdapter {
  /** Tipo de plataforma que este adaptador maneja */
  readonly platform: PlatformType;

  /**
   * Detecta si la pagina actual es de este LMS.
   * Retorna null si no es de esta plataforma, o PlatformDetection si lo es.
   * El score de confianza (0-1) indica cuantos indicadores matchearon.
   */
  detect(): PlatformDetection | null;

  /**
   * Obtiene el sesskey/CSRF token desde la pagina.
   * Necesario para hacer llamadas AJAX autenticadas.
   */
  getSessionKey(): Promise<string | null>;

  /**
   * Obtiene el ID del usuario logueado.
   */
  getUserId(): Promise<string | null>;

  /**
   * Extrae la lista de cursos en los que esta inscrito el estudiante.
   */
  extractCourses(sesskey: string, userId: string): Promise<ExtractedCourse[]>;

  /**
   * Extrae los archivos/recursos de un curso especifico.
   */
  extractFiles(sesskey: string, courseId: string): Promise<ExtractedFile[]>;

  /**
   * Extrae eventos del calendario (deadlines, examenes, clases).
   */
  extractEvents(sesskey: string): Promise<ExtractedEvent[]>;

  /**
   * Extrae calificaciones de un curso especifico.
   */
  extractGrades(sesskey: string, courseId: string, userId: string): Promise<ExtractedGrade[]>;

  /**
   * Descarga un archivo y retorna su contenido como base64.
   */
  downloadFile(fileUrl: string): Promise<{ base64: string; mimeType: string; size: number }>;
}
