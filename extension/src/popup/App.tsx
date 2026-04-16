import { useEffect, useState } from 'react';
import { STORAGE_KEYS } from '@shared/constants';
import { applyTheme, DEFAULT_THEME } from '@shared/themes';
import type { PlatformDetection, SyncStatus } from '@shared/types';
import { LoginView } from './components/LoginView';
import { IdleView } from './components/IdleView';
import { ConsentView, hasValidConsent, needsConsentUpdate } from './components/ConsentView';
import { DetectedView } from './components/DetectedView';
import { SyncingView } from './components/SyncingView';
import { SyncedView } from './components/SyncedView';
import { ErrorView } from './components/ErrorView';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles.css';

export function App() {
  const [status, setStatus] = useState<SyncStatus>({ state: 'logged_out' });
  const [platform, setPlatform] = useState<PlatformDetection | undefined>();
  const [loading, setLoading] = useState(true);
  const [consentGiven, setConsentGiven] = useState(false);
  const [consentIsUpdate, setConsentIsUpdate] = useState(false);

  // Aplicar tema del usuario al abrir el popup
  useEffect(() => {
    chrome.storage.local.get('connikuTheme', (result) => {
      applyTheme(result.connikuTheme || DEFAULT_THEME);
    });
  }, []);

  // Cargar estado al abrir el popup
  useEffect(() => {
    async function loadState() {
      try {
        const stored = await chrome.storage.local.get([
          STORAGE_KEYS.TOKEN,
          STORAGE_KEYS.SYNC_STATUS,
        ]);

        const token = stored[STORAGE_KEYS.TOKEN];
        const syncStatus: SyncStatus = stored[STORAGE_KEYS.SYNC_STATUS] || { state: 'logged_out' };

        if (!token) {
          setStatus({ state: 'logged_out' });
        } else {
          setStatus(syncStatus);
          // Verificar consentimiento
          const consent = await hasValidConsent();
          setConsentGiven(consent);
          if (!consent) {
            const isUpdate = await needsConsentUpdate();
            setConsentIsUpdate(isUpdate);
          }
        }

        // Preguntar al service worker si la pestana activa tiene un LMS
        chrome.runtime.sendMessage({ type: 'GET_TAB_PLATFORM' }, async (response) => {
          if (response?.platform) {
            setPlatform(response.platform);
            if (syncStatus.state === 'idle') {
              const ns: SyncStatus = { ...syncStatus, state: 'detected', platform: response.platform };
              await chrome.storage.local.set({ [STORAGE_KEYS.SYNC_STATUS]: ns });
              setStatus(ns);
            }
          } else if (token) {
            // No hay platform en session — re-inyectar detector
            try {
              const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
              if (tab?.id) {
                await chrome.scripting.executeScript({
                  target: { tabId: tab.id },
                  files: ['detector.js'],
                });
                await new Promise((r) => setTimeout(r, 500));
                chrome.runtime.sendMessage({ type: 'GET_TAB_PLATFORM' }, async (resp2) => {
                  if (resp2?.platform) {
                    setPlatform(resp2.platform);
                    if (syncStatus.state === 'idle' || syncStatus.state === 'logged_out') {
                      const ns2: SyncStatus = { state: 'detected', platform: resp2.platform };
                      await chrome.storage.local.set({ [STORAGE_KEYS.SYNC_STATUS]: ns2 });
                      setStatus(ns2);
                    }
                  }
                });
              }
            } catch { /* no permissions for this tab */ }
          }
        });
      } catch (err) {
        console.error('[Conniku Popup] Error cargando estado:', err);
      } finally {
        setLoading(false);
      }
    }

    loadState();
  }, []);

  // Escuchar cambios en storage (actualizaciones del service worker)
  useEffect(() => {
    function onStorageChanged(changes: Record<string, chrome.storage.StorageChange>) {
      if (changes[STORAGE_KEYS.SYNC_STATUS]) {
        setStatus(changes[STORAGE_KEYS.SYNC_STATUS].newValue);
      }
    }

    chrome.storage.local.onChanged.addListener(onStorageChanged);
    return () => chrome.storage.local.onChanged.removeListener(onStorageChanged);
  }, []);

  // Handlers
  const handleLogin = async (token: string, userName: string) => {
    await chrome.storage.local.set({
      [STORAGE_KEYS.TOKEN]: token,
      [STORAGE_KEYS.USER]: userName,
    });
    // Re-consultar si la pestana activa ya tiene un LMS detectado
    chrome.runtime.sendMessage({ type: 'GET_TAB_PLATFORM' }, async (response) => {
      if (response?.platform) {
        setPlatform(response.platform);
        const newStatus: SyncStatus = { state: 'detected', platform: response.platform };
        await chrome.storage.local.set({ [STORAGE_KEYS.SYNC_STATUS]: newStatus });
        setStatus(newStatus);
      } else {
        // Fallback: re-inyectar detector en la pestana activa y esperar resultado
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id) {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['detector.js'],
            });
            // Esperar un momento y re-consultar
            await new Promise((r) => setTimeout(r, 500));
            chrome.runtime.sendMessage({ type: 'GET_TAB_PLATFORM' }, async (resp2) => {
              if (resp2?.platform) {
                setPlatform(resp2.platform);
                const ns: SyncStatus = { state: 'detected', platform: resp2.platform };
                await chrome.storage.local.set({ [STORAGE_KEYS.SYNC_STATUS]: ns });
                setStatus(ns);
              } else {
                const ns: SyncStatus = { state: 'idle' };
                await chrome.storage.local.set({ [STORAGE_KEYS.SYNC_STATUS]: ns });
                setStatus(ns);
              }
            });
          } else {
            const ns: SyncStatus = { state: 'idle' };
            await chrome.storage.local.set({ [STORAGE_KEYS.SYNC_STATUS]: ns });
            setStatus(ns);
          }
        } catch {
          const ns: SyncStatus = { state: 'idle' };
          await chrome.storage.local.set({ [STORAGE_KEYS.SYNC_STATUS]: ns });
          setStatus(ns);
        }
      }
    });
  };

  const handleStartSync = (courseIds?: string[]) => {
    chrome.runtime.sendMessage({
      type: 'START_EXTRACTION',
      payload: { mode: 'full', courseIds },
    });
  };

  const handleUpdate = () => {
    chrome.runtime.sendMessage({
      type: 'START_EXTRACTION',
      payload: { mode: 'update' },
    });
  };

  const handleOpenConniku = () => {
    chrome.tabs.create({ url: 'https://conniku.com/mi-universidad' });
  };

  const handleLogout = async () => {
    await chrome.storage.local.remove([
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.USER,
      STORAGE_KEYS.SYNC_STATUS,
      'connikuConsent',
      'connikuTheme',
      'detectedCourses',
      'passiveData',
    ]);
    setStatus({ state: 'logged_out' });
    setConsentGiven(false);
    setPlatform(undefined);
  };

  if (loading) {
    return (
      <div className="popup">
        <div className="popup-loading">Cargando...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="popup">
      {/* Header */}
      <header className="popup-header">
        <div className="popup-logo">
          <div className="popup-logo-icon">C</div>
          <span className="popup-logo-text">Conniku</span>
        </div>
        <div className={`popup-status-dot ${status.state === 'logged_out' ? 'offline' : ''}`} />
      </header>

      {/* Body — renderiza segun el estado */}
      {status.state === 'logged_out' && (
        <LoginView onLogin={handleLogin} />
      )}

      {status.state === 'idle' && (
        <IdleView onLogout={handleLogout} />
      )}

      {status.state === 'detected' && !consentGiven && (
        <ConsentView
          platform={platform || status.platform}
          onAccept={async () => {
            setConsentGiven(true);
            // Persistir estado detected en storage
            await chrome.storage.local.set({
              [STORAGE_KEYS.SYNC_STATUS]: status,
            });
          }}
          onDecline={async () => {
            const newStatus: SyncStatus = { state: 'idle' };
            await chrome.storage.local.set({ [STORAGE_KEYS.SYNC_STATUS]: newStatus });
            setStatus(newStatus);
          }}
          isUpdate={consentIsUpdate}
        />
      )}

      {status.state === 'detected' && consentGiven && (
        <DetectedView
          platform={platform || status.platform}
          onStartSync={handleStartSync}
        />
      )}

      {status.state === 'syncing' && (
        <SyncingView
          platform={platform || status.platform}
          progress={status.progress}
        />
      )}

      {status.state === 'synced' && (
        <SyncedView
          platform={platform || status.platform}
          stats={status.stats}
          lastSync={status.lastSync}
          onUpdate={handleUpdate}
          onOpenConniku={handleOpenConniku}
          onLogout={handleLogout}
        />
      )}

      {status.state === 'error' && (
        <ErrorView
          error={status.error}
          onRetry={handleStartSync}
        />
      )}

      {/* Footer */}
      <footer className="popup-footer">
        <span>v{chrome.runtime.getManifest().version}</span>
        <a href="https://conniku.com" target="_blank" rel="noopener noreferrer">
          conniku.com
        </a>
      </footer>
    </div>
    </ErrorBoundary>
  );
}
