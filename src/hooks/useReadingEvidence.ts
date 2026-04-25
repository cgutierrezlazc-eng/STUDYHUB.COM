/**
 * useReadingEvidence — gestiona sesión anónima de lectura de documentos legales.
 *
 * Genera un UUID v4 como session_token al montar, persistido en localStorage
 * para sobrevivir recargas de página. Registra cada lectura en el endpoint
 * POST /legal/documents/:docKey/viewed con reintentos exponenciales (3 intentos).
 *
 * Optimistic UI: el estado local se actualiza inmediatamente al leer (scrolled=true),
 * independientemente del resultado del endpoint.
 *
 * D-M2=A: session_token uuid4 anónimo pre-registro
 * D-M3=B+C: scroll 90% marca como leído + fallback botón explícito
 *
 * Bloque: multi-document-consent-v1
 */
import { useState, useCallback } from 'react';
import type { DocumentKey } from '../legal/documentRegistry';

export interface ViewedDocs {
  terms: boolean;
  privacy: boolean;
  cookies: boolean;
  'age-declaration': boolean;
}

export interface ReadingEvidenceState {
  sessionToken: string;
  viewedDocs: ViewedDocs;
  allRead: boolean;
  onDocRead: (docKey: DocumentKey, scrolled: boolean) => Promise<void>;
}

const LS_KEY = 'conniku_legal_session_token_v1';
const API_BASE =
  (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ??
  'https://studyhub-api-bpco.onrender.com';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Genera un UUID v4 usando Web Crypto API (disponible en navegadores modernos y Node 20+). */
function generateUuidV4(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // Setear versión 4 (bits 12-15 del byte 6)
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  // Setear variante 1 (bits 6-7 del byte 8)
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/** Recupera o crea el session_token persistido en localStorage. */
function getOrCreateSessionToken(): string {
  if (typeof window === 'undefined') return generateUuidV4();

  const stored = localStorage.getItem(LS_KEY);
  if (stored && UUID_V4_REGEX.test(stored)) {
    return stored;
  }

  const fresh = generateUuidV4();
  localStorage.setItem(LS_KEY, fresh);
  return fresh;
}

/** Llama al endpoint con backoff exponencial (3 intentos, delays 1s/2s). */
async function postDocViewed(
  docKey: DocumentKey,
  sessionToken: string,
  attempt = 1
): Promise<void> {
  const url = `${API_BASE}/api/legal/documents/${docKey}/viewed`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_token: sessionToken }),
    });
  } catch {
    if (attempt < 3) {
      const delay = attempt * 1000; // 1s, 2s
      await new Promise((resolve) => setTimeout(resolve, delay));
      return postDocViewed(docKey, sessionToken, attempt + 1);
    }
    // 3er intento fallido: fallo silencioso (UI ya está en optimistic)
  }
}

const INITIAL_VIEWED: ViewedDocs = {
  terms: false,
  privacy: false,
  cookies: false,
  'age-declaration': false,
};

export function useReadingEvidence(): ReadingEvidenceState {
  const [sessionToken] = useState<string>(() => getOrCreateSessionToken());
  const [viewedDocs, setViewedDocs] = useState<ViewedDocs>(INITIAL_VIEWED);

  const onDocRead = useCallback(
    async (docKey: DocumentKey, scrolled: boolean): Promise<void> => {
      if (!scrolled) return;

      // Optimistic: actualizar estado local inmediatamente
      setViewedDocs((prev) => ({ ...prev, [docKey]: true }));

      // Registrar en backend con reintentos
      await postDocViewed(docKey, sessionToken);
    },
    [sessionToken]
  );

  const allRead =
    viewedDocs.terms && viewedDocs.privacy && viewedDocs.cookies && viewedDocs['age-declaration'];

  return {
    sessionToken,
    viewedDocs,
    allRead,
    onDocRead,
  };
}
