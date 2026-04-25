/**
 * useLegalDocumentView — registra la apertura de un documento legal.
 *
 * Idempotencia client-side: usa localStorage para evitar llamadas repetidas
 * dentro de la misma sesión para el mismo docKey + hash.
 *
 * Si registerView es false (hash=null), no registra nada.
 *
 * Bloque: legal-viewer-v1
 */
import { useEffect } from 'react';
import { DocumentKey } from '../legal/documentRegistry';

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://studyhub-api-bpco.onrender.com';

function getViewedKey(docKey: DocumentKey, hash: string): string {
  return `conniku_legal_viewed_${docKey}_${hash.slice(0, 8)}`;
}

export function useLegalDocumentView(docKey: DocumentKey, hash: string | null): void {
  useEffect(() => {
    // hash=null significa registerView=false — no registrar
    if (!hash) return;

    const storageKey = getViewedKey(docKey, hash);
    if (typeof window !== 'undefined' && localStorage.getItem(storageKey)) {
      // Ya registrado en esta sesión, no duplicar
      return;
    }

    const meta = {
      document_version: hash.slice(0, 8),
      document_hash: hash,
    };

    // Fire-and-forget: el registro de apertura no bloquea el render
    fetch(`${API_BASE}/api/legal/documents/${docKey}/viewed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meta),
    })
      .then(() => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, '1');
        }
      })
      .catch(() => {
        // Fallo silencioso: el registro es best-effort, no bloquea la lectura
      });
  }, [docKey, hash]);
}
