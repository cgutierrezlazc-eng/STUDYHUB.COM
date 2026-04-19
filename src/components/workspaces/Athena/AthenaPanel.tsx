/**
 * AthenaPanel — Panel raíz de Athena IA en la zona derecha superior.
 *
 * Tabs: Análisis | Chat | Sugerencias.
 * Header con avatar gradiente.
 * Footer con usage-meter (X de Y interacciones hoy, barra).
 * Banner ámbar si remaining === 0.
 * Banner de error si ping falla o claude_available === false.
 * UpgradeModal cuando se agota la cuota.
 *
 * Props:
 * - docId: ID del workspace/documento.
 * - currentUser: usuario logueado.
 * - editorBridge: ref al plugin AthenaApplyBridge montado en el editor.
 * - onNavigate: función de navegación para el modal de upgrade.
 *
 * Bloque 2c Athena IA.
 */

import React, { useState, useEffect } from 'react';
import type { RefObject } from 'react';
import type {
  AthenaChatMessage,
  AthenaSuggestion,
  AthenaUsageInfo,
} from '../../../../shared/workspaces-types';
import {
  pingAthena,
  listAthenaChats,
  listAthenaSuggestions,
  getAthenaUsage,
} from '../../../services/workspacesApi';
import AthenaAnalyze from './AthenaAnalyze';
import AthenaChat from './AthenaChat';
import AthenaSuggestions from './AthenaSuggestions';
import UpgradeModal from './UpgradeModal';
import styles from './AthenaPanel.module.css';

export interface EditorBridgeHandle {
  applyText: (text: string, mode?: 'insert-at-cursor' | 'replace-selection' | 'append') => void;
  getSelection: () => string | null;
}

type TabId = 'analyze' | 'chat' | 'suggestions';

interface AthenaPanelProps {
  docId: string;
  currentUser: {
    userId: string;
    name: string;
    avatar?: string | null;
    color?: string;
  };
  editorBridge: RefObject<EditorBridgeHandle | null> | null;
  onNavigate?: (path: string) => void;
}

export default function AthenaPanel({
  docId,
  currentUser,
  editorBridge,
  onNavigate,
}: AthenaPanelProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<TabId>('analyze');
  const [chats, setChats] = useState<AthenaChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<AthenaSuggestion[]>([]);
  const [usage, setUsage] = useState<AthenaUsageInfo | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [athenaAvailable, setAthenaAvailable] = useState<boolean | null>(null);
  const [pingError, setPingError] = useState(false);

  // Carga inicial al montar
  useEffect(() => {
    void pingAthena(docId)
      .then((res) => {
        setAthenaAvailable(res.claude_available);
        setPingError(false);
      })
      .catch(() => {
        setPingError(true);
        setAthenaAvailable(false);
      });

    void listAthenaChats(docId, { limit: 50 })
      .then((res) => setChats(res.chats))
      .catch(() => {});

    void listAthenaSuggestions(docId, {})
      .then((res) => setSuggestions(res.suggestions))
      .catch(() => {});

    void getAthenaUsage(docId)
      .then((res) => setUsage(res))
      .catch(() => {});
  }, [docId]);

  function handleQuotaExceeded() {
    setShowUpgrade(true);
    // Refrescar usage para reflejar estado actual
    void getAthenaUsage(docId)
      .then((res) => setUsage(res))
      .catch(() => {});
  }

  function handleSuggestionChange(id: string, status: AthenaSuggestion['status']) {
    setSuggestions((prev) =>
      status === 'pending'
        ? prev.filter((s) => s.id !== id) // fue eliminada
        : prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  }

  const isUnavailable = pingError || athenaAvailable === false;
  const quotaExhausted = usage !== null && usage.limit !== -1 && usage.remaining === 0;
  const isPro = usage?.limit === -1;

  // Calcular porcentaje del usage-meter
  const usagePct = usage && usage.limit > 0 ? Math.min(100, (usage.used / usage.limit) * 100) : 0;

  // Iniciales del avatar
  const initials = currentUser.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={styles.panel} aria-label="Panel Athena">
      {/* Header */}
      <div className={styles.header} aria-label="Encabezado Athena">
        <div className={styles.headerAvatar} aria-hidden="true">
          {initials || 'A'}
        </div>
        <span className={styles.headerTitle}>Athena</span>
        {isPro && <span className={styles.headerStatus}>Pro</span>}
      </div>

      {/* Banner de no disponible */}
      {isUnavailable && (
        <div className={styles.errorBanner} role="region" aria-label="Athena no disponible">
          <p className={styles.errorBannerText}>
            Athena no disponible en este momento. Escribe a contacto@conniku.com si persiste.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs} role="tablist" aria-label="Secciones de Athena">
        <button
          role="tab"
          type="button"
          className={`${styles.tab} ${activeTab === 'analyze' ? styles.tabActive : ''}`}
          aria-selected={activeTab === 'analyze'}
          onClick={() => setActiveTab('analyze')}
        >
          Análisis
        </button>
        <button
          role="tab"
          type="button"
          className={`${styles.tab} ${activeTab === 'chat' ? styles.tabActive : ''}`}
          aria-selected={activeTab === 'chat'}
          onClick={() => setActiveTab('chat')}
        >
          Chat
        </button>
        <button
          role="tab"
          type="button"
          className={`${styles.tab} ${activeTab === 'suggestions' ? styles.tabActive : ''}`}
          aria-selected={activeTab === 'suggestions'}
          onClick={() => setActiveTab('suggestions')}
        >
          Sugerencias
        </button>
      </div>

      {/* Contenido del tab activo */}
      <div className={styles.content}>
        {activeTab === 'analyze' && (
          <AthenaAnalyze docId={docId} onQuotaExceeded={handleQuotaExceeded} />
        )}
        {activeTab === 'chat' && (
          <AthenaChat
            docId={docId}
            currentUser={currentUser}
            initialChats={chats}
            onQuotaExceeded={handleQuotaExceeded}
          />
        )}
        {activeTab === 'suggestions' && (
          <AthenaSuggestions
            docId={docId}
            suggestions={suggestions}
            editorBridge={editorBridge}
            onSuggestionChange={handleSuggestionChange}
            onQuotaExceeded={handleQuotaExceeded}
          />
        )}
      </div>

      {/* Banner de cupo agotado */}
      {quotaExhausted && (
        <div className={styles.rateBanner} role="region" aria-label="Cupo agotado — Mejorar a Pro">
          <p className={styles.rateBannerText}>
            Agotaste tus {usage?.limit} interacciones diarias. Se reinicia a las 6:00 AM.
          </p>
          <button
            type="button"
            className={styles.rateBannerBtn}
            onClick={() => setShowUpgrade(true)}
          >
            Mejorar a Conniku Pro →
          </button>
        </div>
      )}

      {/* Usage meter (solo en Free con cuota) */}
      {usage && !isPro && (
        <div className={styles.usageMeter} aria-label="Uso de Athena">
          <div className={styles.usageMeterLabel}>
            <span>
              {usage.used} de {usage.limit} interacciones hoy
            </span>
          </div>
          <div
            className={styles.usageMeterBar}
            role="progressbar"
            aria-valuenow={usage.used}
            aria-valuemax={usage.limit}
          >
            <div
              className={`${styles.usageMeterFill} ${usagePct >= 80 ? styles.usageMeterFillWarning : ''}`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
        </div>
      )}

      {/* Modal de upgrade */}
      {showUpgrade && (
        <UpgradeModal
          limit={usage?.limit ?? 3}
          onNavigate={onNavigate ?? (() => {})}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
}
