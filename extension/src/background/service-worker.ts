// ═══════════════════════════════════════════════════════════════
// SERVICE WORKER — Background script de la extension Conniku
// Responsabilidades:
//   - Recibir notificaciones del detector (plataforma detectada)
//   - Orquestar la extraccion (enviar mensajes al extractor)
//   - Enviar datos extraidos a la API de Conniku
//   - Manejar el estado global de la extension
//   - Actualizar el badge del icono
// ═══════════════════════════════════════════════════════════════

import { API_BASE, STORAGE_KEYS } from '@shared/constants';
import type {
  ExtractionPayload,
  LmsInstance,
  PlatformDetection,
  SyncStatus,
} from '@shared/types';

// ── Validacion de seguridad ──────────────────────────────────

if (!API_BASE.startsWith('https://')) {
  console.error('[Conniku] API_BASE debe ser HTTPS. Valor actual:', API_BASE);
}

// ── Storage helpers ──────────────────────────────────────────

async function getStorage<T>(key: string): Promise<T | undefined> {
  const result = await chrome.storage.local.get(key);
  return result[key] as T | undefined;
}

async function setStorage(data: Record<string, unknown>): Promise<void> {
  await chrome.storage.local.set(data);
}

async function setSyncStatus(status: SyncStatus): Promise<void> {
  await setStorage({ [STORAGE_KEYS.SYNC_STATUS]: status });
}

/** Guarda deteccion de plataforma por tab en storage.session (sobrevive sleep del SW) */
async function setTabPlatform(tabId: number, platform: PlatformDetection): Promise<void> {
  const key = `tab_platform_${tabId}`;
  await chrome.storage.session.set({ [key]: platform });
}

async function getTabPlatform(tabId: number): Promise<PlatformDetection | undefined> {
  const key = `tab_platform_${tabId}`;
  const result = await chrome.storage.session.get(key);
  return result[key] as PlatformDetection | undefined;
}

// ── Badge ────────────────────────────────────────────────────

function updateBadge(state: SyncStatus['state'], tabId?: number): void {
  const config: Record<string, { text: string; color: string }> = {
    logged_out: { text: '', color: '#666' },
    idle: { text: '', color: '#4f8cff' },
    detected: { text: '!', color: '#22c55e' },
    syncing: { text: '...', color: '#fbbf24' },
    synced: { text: '', color: '#22c55e' },
    error: { text: '!', color: '#ef4444' },
  };

  const { text, color } = config[state] || config.idle;

  chrome.action.setBadgeText({ text, tabId }).catch(() => {});
  chrome.action.setBadgeBackgroundColor({ color, tabId }).catch(() => {});
}

// ── API de Conniku ───────────────────────────────────────────

/** Convierte keys de camelCase a snake_case para el backend Python */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function convertKeysToSnake(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(convertKeysToSnake);
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[toSnakeCase(key)] = convertKeysToSnake(value);
    }
    return result;
  }
  return obj;
}

async function sendToConniku(payload: ExtractionPayload): Promise<{ ok: boolean; error?: string }> {
  const token = await getStorage<string>(STORAGE_KEYS.TOKEN);
  if (!token) {
    return { ok: false, error: 'No hay sesion de Conniku. Inicia sesion primero.' };
  }

  try {
    // Convertir keys a snake_case para compatibilidad con Pydantic/Python
    const snakePayload = convertKeysToSnake(payload);

    const response = await fetch(`${API_BASE}/lms/extension/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Extension-Version': chrome.runtime.getManifest().version,
      },
      body: JSON.stringify(snakePayload),
    });

    if (!response.ok) {
      const body = (await response.text()).slice(0, 200);
      return { ok: false, error: `Error del servidor: ${response.status} — ${body}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: `Error de red: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ── UNICO listener de mensajes (HIGH-09 fix) ────────────────

chrome.runtime.onMessage.addListener(
  (message: { type: string; payload?: unknown }, sender, sendResponse) => {
    if (!message || typeof message.type !== 'string') {
      sendResponse({ ok: false, error: 'Mensaje invalido' });
      return false;
    }

    const tabId = sender.tab?.id;

    switch (message.type) {
      // ── Popup: login request (via SW para evitar CORS) ──
      case 'LOGIN_REQUEST': {
        const { email, password } = (message.payload || {}) as { email?: string; password?: string };
        if (!email || !password) {
          sendResponse({ error: 'Email y contrasena son requeridos' });
          break;
        }
        fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
          .then(async (res) => {
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              sendResponse({ error: body.detail || 'Email o contrasena incorrectos' });
              return;
            }
            const data = await res.json();
            if (data.token && data.user) {
              sendResponse({
                token: data.token,
                userName: data.user.first_name || data.user.username || 'Usuario',
              });
            } else {
              sendResponse({ error: 'Respuesta inesperada del servidor' });
            }
          })
          .catch(() => {
            sendResponse({ error: 'No se pudo conectar con Conniku' });
          });
        return true;
      }

      // ── Detector: plataforma detectada en una pestana ──
      case 'PLATFORM_DETECTED': {
        const detection = message.payload as PlatformDetection;
        if (tabId && detection) {
          setTabPlatform(tabId, detection).catch(console.error);
          updateBadge('detected', tabId);
        }
        handlePlatformDetected(detection).catch(console.error);
        sendResponse({ ok: true });
        break;
      }

      // ── Extractor: datos listos para enviar ──
      case 'DATA_EXTRACTED': {
        handleDataExtracted(message.payload as ExtractionPayload)
          .then((result) => sendResponse(result))
          .catch((err) => sendResponse({ ok: false, error: String(err) }));
        return true;
      }

      // ── Extractor: actualizacion de estado de sync ──
      case 'SYNC_STATUS': {
        const status = message.payload as SyncStatus;
        setSyncStatus(status).catch(console.error);
        if (tabId) updateBadge(status.state, tabId);
        sendResponse({ ok: true });
        break;
      }

      // ── Popup: pide la plataforma de la pestana activa ──
      case 'GET_TAB_PLATFORM': {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
          if (chrome.runtime.lastError) {
            sendResponse({ platform: undefined });
            return;
          }
          const activeTabId = tabs[0]?.id;
          const platform = activeTabId ? await getTabPlatform(activeTabId) : undefined;
          sendResponse({ platform });
        });
        return true;
      }

      // ── Popup: pide iniciar extraccion ──
      case 'START_EXTRACTION': {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
          if (chrome.runtime.lastError) {
            sendResponse({ ok: false, error: 'Error consultando pestanas' });
            return;
          }

          // Defense-in-depth: verificar consentimiento antes de extraer
          const consentResult = await chrome.storage.local.get('connikuConsent');
          const consent = consentResult.connikuConsent;
          if (!consent?.accepted) {
            sendResponse({ ok: false, error: 'Se requiere consentimiento antes de sincronizar' });
            return;
          }

          const activeTabId = tabs[0]?.id;
          if (!activeTabId) {
            sendResponse({ ok: false, error: 'No hay pestana activa' });
            return;
          }

          try {
            await chrome.scripting.executeScript({
              target: { tabId: activeTabId },
              files: ['extractor.js'],
            });

            chrome.tabs.sendMessage(activeTabId, {
              type: 'EXTRACT_REQUEST',
              payload: (message.payload as Record<string, unknown>) || { mode: 'full' },
            });

            sendResponse({ ok: true });
          } catch (err) {
            sendResponse({ ok: false, error: `Error inyectando extractor: ${String(err)}` });
          }
        });
        return true;
      }

      default:
        sendResponse({ ok: false, error: 'Mensaje no reconocido' });
    }

    return false;
  },
);

// ── Handlers ─────────────────────────────────────────────────

async function handlePlatformDetected(detection: PlatformDetection): Promise<void> {
  const instances = (await getStorage<LmsInstance[]>(STORAGE_KEYS.INSTANCES)) || [];

  const existing = instances.find(
    (i) => i.baseUrl === detection.baseUrl && i.platform === detection.platform,
  );

  if (!existing) {
    const status = (await getStorage<SyncStatus>(STORAGE_KEYS.SYNC_STATUS)) || { state: 'logged_out' };
    if (status.state === 'idle' || status.state === 'logged_out') {
      await setSyncStatus({
        ...status,
        state: 'detected',
        platform: detection,
      });
    }
  }
}

async function handleDataExtracted(
  payload: ExtractionPayload,
): Promise<{ ok: boolean; error?: string }> {
  const result = await sendToConniku(payload);

  if (result.ok) {
    const instances = (await getStorage<LmsInstance[]>(STORAGE_KEYS.INSTANCES)) || [];
    const idx = instances.findIndex(
      (i) => i.baseUrl === payload.baseUrl && i.platform === payload.platform,
    );

    const instance: LmsInstance = {
      id: idx >= 0 ? instances[idx].id : crypto.randomUUID(),
      platform: payload.platform,
      baseUrl: payload.baseUrl,
      siteName: payload.siteName,
      userId: payload.userId || '',
      lastSync: Date.now(),
      courses: payload.courses,
    };

    if (idx >= 0) {
      instances[idx] = instance;
    } else {
      instances.push(instance);
    }

    await setStorage({ [STORAGE_KEYS.INSTANCES]: instances });

    await setSyncStatus({
      state: 'synced',
      platform: {
        platform: payload.platform,
        baseUrl: payload.baseUrl,
        siteName: payload.siteName,
        confidence: 1,
      },
      lastSync: Date.now(),
      stats: {
        courses: payload.courses.length,
        files: payload.files.filter((f) => f.itemType === 'file').length,
        events: payload.events.length,
        grades: payload.grades.length,
      },
    });
  } else {
    await setSyncStatus({
      state: 'error',
      error: result.error,
    });
  }

  return result;
}

// ── Limpiar storage.session cuando se cierra una pestana ─────

chrome.tabs.onRemoved.addListener((tabId) => {
  const key = `tab_platform_${tabId}`;
  chrome.storage.session.remove(key).catch(() => {});
});

// ── Instalacion / actualizacion ──────────────────────────────

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await setStorage({
      [STORAGE_KEYS.INSTANCES]: [],
      [STORAGE_KEYS.SYNC_STATUS]: { state: 'logged_out' },
    });
  }
});
