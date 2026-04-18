/**
 * Hook que acumula caracteres añadidos localmente al Y.Doc y los envía
 * al servidor cada 30s mediante PATCH /workspaces/{id}/members/{mid}/contribution.
 *
 * Solo cuenta caracteres añadidos (positivos), no borrados.
 * El delta se resetea al flush exitoso.
 *
 * Props:
 *   ydoc        Y.Doc compartido (observamos el ytext 'lexical').
 *   docId       ID del workspace.
 *   memberId    ID del WorkspaceMember del usuario actual.
 *   enabled     Si false, no acumula ni flushea (para viewers).
 *   flushMs     Intervalo de flush en ms (default: 30000).
 *
 * Bloque 2b Colaboración.
 */

import { useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { updateContributionMetric } from '../services/workspacesApi';

export interface UseCharContributionTrackerOptions {
  ydoc: Y.Doc;
  docId: string;
  memberId: string;
  enabled?: boolean;
  flushMs?: number;
}

const YTEXT_KEY = 'lexical';

export function useCharContributionTracker({
  ydoc,
  docId,
  memberId,
  enabled = true,
  flushMs = 30_000,
}: UseCharContributionTrackerOptions): void {
  const deltaRef = useRef(0);
  const prevLengthRef = useRef<number>(0);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !docId || !memberId) return;

    const ytext = ydoc.getText(YTEXT_KEY);
    prevLengthRef.current = ytext.length;

    function handleTextUpdate() {
      const newLength = ytext.length;
      const diff = newLength - prevLengthRef.current;

      // Solo acumulamos adiciones (positivas)
      if (diff > 0) {
        deltaRef.current += diff;
      }

      prevLengthRef.current = newLength;
    }

    ytext.observe(handleTextUpdate);

    // Flush periódico cada flushMs
    flushTimerRef.current = setInterval(async () => {
      if (!isMountedRef.current) return;
      const delta = deltaRef.current;
      if (delta <= 0) return;

      // Reset optimista antes del PATCH (evita doble envío si el timer se solapa)
      deltaRef.current = 0;

      try {
        await updateContributionMetric(docId, memberId, delta);
      } catch {
        // En caso de error, reacumular el delta no enviado
        if (isMountedRef.current) {
          deltaRef.current += delta;
        }
      }
    }, flushMs);

    return () => {
      ytext.unobserve(handleTextUpdate);
      if (flushTimerRef.current !== null) {
        clearInterval(flushTimerRef.current);
        flushTimerRef.current = null;
      }
    };
  }, [ydoc, docId, memberId, enabled, flushMs]);
}
