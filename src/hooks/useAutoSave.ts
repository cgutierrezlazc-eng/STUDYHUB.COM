/**
 * Hook de auto-guardado del documento colaborativo.
 *
 * Escucha updates del Y.Doc, hace debounce de 2s desde el último update,
 * y persiste el snapshot via la función updateFn.
 *
 * Solo el "cliente elegido" dispara el PATCH. El elegido se determina como
 * el userId más pequeño lexicográficamente entre los awareness states activos.
 * Si el cliente está solo, siempre es el elegido.
 *
 * Estados:
 *   'saved'   → sin cambios pendientes.
 *   'unsaved' → hay cambios que no se han persistido aún.
 *   'saving'  → el PATCH está en vuelo.
 *   'offline' → provider desconectado (no se intenta PATCH).
 *
 * Bloque 2b Colaboración.
 */

import { useState, useEffect, useRef } from 'react';
import * as Y from 'yjs';
import type { WebsocketProvider } from 'y-websocket';
import type { UpdateWorkspaceInput } from '../../shared/workspaces-types';

export type SaveStatus = 'saved' | 'unsaved' | 'saving' | 'offline';

export interface UseAutoSaveOptions {
  ydoc: Y.Doc;
  docId: string;
  currentUserId: string;
  awareness: WebsocketProvider['awareness'];
  updateFn: (docId: string, patch: UpdateWorkspaceInput) => Promise<unknown>;
  debounceMs?: number;
  /**
   * Si es `false`, el hook NO dispara PATCHes aunque haya updates del Y.Doc.
   * Útil cuando el docId aún no está resuelto o el provider no está listo,
   * para evitar llamadas a `PATCH /workspaces//` con id vacío.
   * Default: `true`.
   */
  enabled?: boolean;
}

export interface UseAutoSaveResult {
  saveStatus: SaveStatus;
}

/**
 * Determina si currentUserId es el "cliente elegido" para guardar.
 * El elegido es el userId más pequeño lexicográficamente entre los
 * awareness states activos que tienen un campo 'user.userId'.
 */
function isChosenClient(currentUserId: string, awareness: WebsocketProvider['awareness']): boolean {
  const states = awareness.getStates();
  const userIds: string[] = [];

  states.forEach((state) => {
    const user = (state as { user?: { userId?: string } }).user;
    if (user?.userId) {
      userIds.push(user.userId);
    }
  });

  if (userIds.length === 0) {
    // Sin awareness states — el cliente actual es el único
    return true;
  }

  // El elegido es el userId menor lexicográficamente
  const sorted = [...userIds].sort();
  return sorted[0] === currentUserId;
}

/**
 * Serializa el Y.Doc completo como base64 para persistirlo en el backend.
 */
function encodeYdocToBase64(ydoc: Y.Doc): string {
  const update = Y.encodeStateAsUpdate(ydoc);
  // Convertir Uint8Array a base64
  let binary = '';
  const len = update.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(update[i]);
  }
  return btoa(binary);
}

export function useAutoSave({
  ydoc,
  docId,
  currentUserId,
  awareness,
  updateFn,
  debounceMs = 2000,
  enabled = true,
}: UseAutoSaveOptions): UseAutoSaveResult {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !docId) {
      // Hook deshabilitado o docId vacío: no registrar listener.
      return;
    }

    function handleUpdate() {
      if (!isMountedRef.current) return;

      setSaveStatus('unsaved');

      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        if (!isMountedRef.current) return;

        if (!isChosenClient(currentUserId, awareness)) {
          return;
        }

        setSaveStatus('saving');

        try {
          const contentYjs = encodeYdocToBase64(ydoc);
          await updateFn(docId, { content_yjs: contentYjs });
          if (isMountedRef.current) {
            setSaveStatus('saved');
          }
        } catch {
          if (isMountedRef.current) {
            setSaveStatus('unsaved');
          }
        }
      }, debounceMs);
    }

    ydoc.on('update', handleUpdate);

    return () => {
      ydoc.off('update', handleUpdate);
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [ydoc, docId, currentUserId, awareness, updateFn, debounceMs, enabled]);

  return { saveStatus };
}
