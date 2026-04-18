/**
 * Wrapper sobre y-websocket + y-indexeddb para el módulo Workspaces.
 *
 * Encapsula:
 * - Inyección del JWT desde localStorage en la URL del WS.
 * - Awareness con {userId, name, avatar, color} derivado de getAuthorColor.
 * - Backoff exponencial (tope 30s) en caso de desconexión.
 * - Detección de close codes 4001/4003/4004/4010.
 * - Observer de window.online para reconexión inmediata.
 * - IndexedDB persistence (decisión §1.2.1 #3 del plan 2b).
 *
 * Exports:
 *   createWorkspaceProvider(docId, userMeta) → WorkspaceProviderHandle
 *   calcBackoffMs(attempt)  → number   (expuesto para tests)
 *
 * Bloque 2b Colaboración.
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { getAuthorColor } from '../components/workspaces/authorColors';

// ─── Constantes ───────────────────────────────────────────────────────────────

const TOKEN_KEY = 'conniku_token';
const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 30_000;

/** Close codes que requieren detener el reconnect (error fatal). */
const FATAL_CLOSE_CODES = new Set([4001, 4003, 4004]);
/** Close code de token expirado → no fatal, requiere refresh. */
const TOKEN_EXPIRED_CODE = 4010;

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export type ProviderStatus = 'connecting' | 'connected' | 'disconnected' | 'offline' | 'fatal';

export interface UserMeta {
  userId: string;
  name: string;
  color?: string;
  avatar?: string | undefined;
}

/** Ref de solo lectura para el estado del provider. */
export interface StatusRef {
  get(): ProviderStatus;
}

export interface WorkspaceProviderHandle {
  /** Instancia de Y.Doc compartida entre el editor y el chat. */
  ydoc: Y.Doc;
  /** Provider WebSocket de Yjs. */
  provider: WebsocketProvider;
  /** Awareness compartido (cursores + presencia). */
  awareness: WebsocketProvider['awareness'];
  /** IndexedDB persistence para modo offline. */
  indexeddbPersistence: IndexeddbPersistence;
  /** Ref de solo lectura al estado actual de la conexión. */
  status$: StatusRef;
  /** Limpia provider, indexeddb y listeners. Llamar en cleanup de useEffect. */
  destroy(): void;
  /** Fuerza una reconexión inmediata (disconnect → connect). */
  forceReconnect(): void;
}

// ─── Utilidades exportadas ────────────────────────────────────────────────────

/**
 * Calcula el delay de backoff exponencial.
 * delay = min(1000 * 2^attempt, 30000) ms.
 * Exportada para facilitar tests unitarios.
 */
export function calcBackoffMs(attempt: number): number {
  return Math.min(BACKOFF_BASE_MS * Math.pow(2, attempt), BACKOFF_MAX_MS);
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? '';
}

function getWsBase(): string {
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return 'ws://localhost:8899';
  }
  return 'wss://studyhub-api-bpco.onrender.com';
}

function buildWsUrl(docId: string, token: string): string {
  const base = getWsBase();
  const encodedToken = encodeURIComponent(token);
  return `${base}/workspaces/ws/${docId}?token=${encodedToken}`;
}

// ─── Factory principal ────────────────────────────────────────────────────────

/**
 * Crea e inicializa un provider de Yjs para un documento de workspace.
 *
 * El provider se conecta al WS y al IndexedDB en paralelo.
 * El editor debe esperar que status$ retorne 'connected' o 'disconnected'
 * (IndexedDB ya tiene el estado local) antes de montar el CollaborationPlugin.
 */
export function createWorkspaceProvider(
  docId: string,
  userMeta: UserMeta
): WorkspaceProviderHandle {
  const ydoc = new Y.Doc();
  const token = getToken();
  const wsUrl = buildWsUrl(docId, token);

  // Color: usar el proporcionado o calcular deterministicamente
  const resolvedColor = userMeta.color ?? getAuthorColor(userMeta.userId);

  // ── IndexedDB persistence (paralelo al WS) ────────────────────────
  const indexeddbPersistence = new IndexeddbPersistence(docId, ydoc);

  // ── WebSocket provider ────────────────────────────────────────────
  const provider = new WebsocketProvider(wsUrl, docId, ydoc, {
    connect: false, // conectamos manualmente tras sync de IndexedDB
  });

  // ── Awareness: publicar estado local del usuario ──────────────────
  provider.awareness.setLocalStateField('user', {
    userId: userMeta.userId,
    name: userMeta.name,
    color: resolvedColor,
    avatar: userMeta.avatar,
  });

  // ── Estado de conexión ────────────────────────────────────────────
  let currentStatus: ProviderStatus = 'connecting';
  let reconnectAttempt = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let destroyed = false;
  let fatalError = false;

  const status$: StatusRef = {
    get: () => currentStatus,
  };

  function scheduleReconnect(): void {
    if (destroyed || fatalError) return;
    if (reconnectTimer !== null) return; // ya hay uno pendiente
    const delay = calcBackoffMs(reconnectAttempt);
    reconnectAttempt++;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (!destroyed && !fatalError) {
        provider.connect();
      }
    }, delay);
  }

  // ── Listener de estado del provider ──────────────────────────────
  provider.on('status', ({ status }: { status: string }) => {
    if (status === 'connected') {
      currentStatus = 'connected';
      reconnectAttempt = 0; // reset al conectar con éxito
    } else if (status === 'disconnected') {
      if (!fatalError) {
        currentStatus = 'disconnected';
        scheduleReconnect();
      }
    } else if (status === 'connecting') {
      currentStatus = 'connecting';
    }
  });

  // ── Listener de close codes ───────────────────────────────────────
  // y-websocket v3 emite 'connection-close' con el CloseEvent nativo.
  provider.on('connection-close', (event: { code: number } | null) => {
    if (!event) return;
    if (FATAL_CLOSE_CODES.has(event.code)) {
      fatalError = true;
      currentStatus = 'fatal';
      // Limpiar timer pendiente de reconexión
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    } else if (event.code === TOKEN_EXPIRED_CODE) {
      // Token expirado: no fatal. WorkspaceEditor manejará el refresh.
      fatalError = false;
      currentStatus = 'disconnected';
    }
  });

  // ── Handler window.online ─────────────────────────────────────────
  function handleOnline(): void {
    if (destroyed) return;
    if (currentStatus === 'disconnected' || currentStatus === 'offline') {
      reconnectAttempt = 0; // reset backoff al recuperar red
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      provider.connect();
    }
  }

  function handleOffline(): void {
    currentStatus = 'offline';
  }

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // ── Conexión inicial: esperar sync de IndexedDB ───────────────────
  indexeddbPersistence.on('synced', () => {
    if (!destroyed) {
      provider.connect();
    }
  });

  // ── Cleanup ───────────────────────────────────────────────────────
  function destroy(): void {
    destroyed = true;
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    try {
      provider.destroy();
    } catch {
      // ignorar errores en destroy
    }
    try {
      indexeddbPersistence.destroy();
    } catch {
      // ignorar errores en destroy
    }
  }

  function forceReconnect(): void {
    if (destroyed) return;
    provider.disconnect();
    provider.connect();
  }

  return {
    ydoc,
    provider,
    awareness: provider.awareness,
    indexeddbPersistence,
    status$,
    destroy,
    forceReconnect,
  };
}
