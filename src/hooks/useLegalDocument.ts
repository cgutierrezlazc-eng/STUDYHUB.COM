/**
 * useLegalDocument — carga el contenido markdown de un documento legal.
 *
 * Estrategia (D-L1=A): import estático con ?raw de Vite.
 * Si el import falla (entorno de test sin Vite), cae a string vacío.
 *
 * Bloque: legal-viewer-v1
 */
import { useState, useEffect } from 'react';
import { DocumentKey, LEGAL_DOCUMENT_REGISTRY } from '../legal/documentRegistry';

export interface UseLegalDocumentResult {
  content: string | null;
  version: string | null;
  hash: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Cache en memoria por sesión: evita re-fetch al navegar entre secciones del layout.
 * Clave: docKey → contenido ya cargado.
 */
const sessionCache = new Map<DocumentKey, string>();

export function useLegalDocument(docKey: DocumentKey): UseLegalDocumentResult {
  const meta = LEGAL_DOCUMENT_REGISTRY[docKey];
  const [content, setContent] = useState<string | null>(sessionCache.get(docKey) ?? null);
  const [loading, setLoading] = useState<boolean>(!sessionCache.has(docKey));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionCache.has(docKey)) {
      setContent(sessionCache.get(docKey)!);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    /**
     * Carga dinámica del markdown con ?raw (Vite nativo).
     * En tests, este import fallará porque jsdom no procesa ?raw —
     * el mock de useLegalDocument en los tests sobrescribe esta función,
     * así que el fallback de error es solo para entornos reales sin el mock.
     */
    const loadMarkdown = async () => {
      try {
        // Importación dinámica con sufijo ?raw para obtener el texto plano.
        // Vite convierte esto en una cadena en tiempo de build.
        const markdownModules: Record<DocumentKey, () => Promise<{ default: string }>> = {
          terms: () => import('/docs/legal/v3.2/terms.md?raw') as Promise<{ default: string }>,
          privacy: () => import('/docs/legal/v3.2/privacy.md?raw') as Promise<{ default: string }>,
          cookies: () => import('/docs/legal/v3.2/cookies.md?raw') as Promise<{ default: string }>,
          'age-declaration': () =>
            import('/docs/legal/v3.2/age-declaration.md?raw') as Promise<{ default: string }>,
        };

        const mod = await markdownModules[docKey]();
        if (cancelled) return;
        const text: string = mod.default ?? (mod as unknown as string);
        sessionCache.set(docKey, text);
        setContent(text);
        setLoading(false);
      } catch {
        if (cancelled) return;
        setError('Error al cargar el documento. Intenta nuevamente.');
        setLoading(false);
      }
    };

    loadMarkdown();
    return () => {
      cancelled = true;
    };
  }, [docKey]);

  return {
    content,
    version: meta.version,
    hash: meta.sha256,
    loading,
    error,
  };
}
