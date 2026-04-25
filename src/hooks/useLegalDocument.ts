/**
 * useLegalDocument — STUB temporal durante bloque-reset-frontend-from-orbit-v1.
 *
 * Razón: los archivos `docs/legal/v3.2/*.md` no existen en el repo (solo `.gitkeep`),
 * lo que rompe el build de Vite/Rollup al intentar resolver imports estáticos.
 *
 * Estrategia: devolver un estado de error legible. El sistema legal-viewer
 * completo se reconstruirá en una fase posterior cuando se decida la nueva
 * arquitectura (markdown vs base de datos vs CMS).
 */
import { DocumentKey, LEGAL_DOCUMENT_REGISTRY } from '../legal/documentRegistry';

export interface UseLegalDocumentResult {
  content: string | null;
  version: string | null;
  hash: string | null;
  loading: boolean;
  error: string | null;
}

export function useLegalDocument(docKey: DocumentKey): UseLegalDocumentResult {
  const meta = LEGAL_DOCUMENT_REGISTRY[docKey];
  return {
    content: null,
    version: meta?.version ?? null,
    hash: meta?.sha256 ?? null,
    loading: false,
    error:
      'Documento en reconstrucción tras el reset del frontend. Contenido temporal hasta nueva arquitectura legal.',
  };
}
