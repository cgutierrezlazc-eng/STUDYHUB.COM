/**
 * MultiDocumentConsent — consentimiento unificado de múltiples documentos legales.
 *
 * Requiere que el usuario abra y lea (scroll 90%) cada uno de los 4 documentos
 * antes de habilitar el checkbox de aceptación final.
 *
 * D-M1=C: src/components/LegalConsent/
 * D-M3=B+C: scroll 90% marca "leído" + fallback botón explícito
 * D-M6=A+C: checkbox disabled + barra de progreso "X de 4 leídos"
 * D-M8=A: solo español
 * WCAG AA: aria-progressbar, aria-describedby, keyboard nav
 *
 * Bloque: multi-document-consent-v1
 */
import React, { useState, useEffect, useId } from 'react';
import { LegalDocumentModal } from '../Legal/LegalDocumentModal';
import { useReadingEvidence } from '../../hooks/useReadingEvidence';
import type { ViewedDocs } from '../../hooks/useReadingEvidence';
import type { DocumentKey } from '../../legal/documentRegistry';
import {
  MULTI_DOC_CONSENT_TEXT_V1,
  REQUIRED_DOCS,
  DOC_DISPLAY_NAMES,
} from '../../legal/multiDocConsent';

// ── Tipos públicos ─────────────────────────────────────────────────────────────

export interface ConsentState {
  sessionToken: string;
  consented: boolean;
  viewedDocs: ViewedDocs;
}

interface Props {
  onConsentChange: (state: ConsentState) => void;
  disabled?: boolean;
}

// ── Componente ─────────────────────────────────────────────────────────────────

export function MultiDocumentConsent({
  onConsentChange,
  disabled = false,
}: Props): React.ReactElement {
  const progressId = useId();
  const { sessionToken, viewedDocs, allRead, onDocRead } = useReadingEvidence();

  // Doc actualmente abierto en modal, o null
  const [openDoc, setOpenDoc] = useState<DocumentKey | null>(null);
  // Checkbox de aceptación final
  const [consented, setConsented] = useState(false);

  // Contar docs leídos para la barra
  const readCount = REQUIRED_DOCS.filter((dk) => viewedDocs[dk as DocumentKey]).length;

  // Notificar cambios de estado al padre
  useEffect(() => {
    onConsentChange({
      sessionToken,
      consented: consented && allRead,
      viewedDocs,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken, consented, allRead, viewedDocs]);

  // Al cerrar el modal: llamar onDocRead con scrolled state
  // El modal no emite si hubo scroll; para este flujo usamos el botón explícito
  // como criterio de lectura (D-M3 fallback C). El LegalDocumentRenderer ya
  // detecta scroll 90% vía onScrolledToEnd que será conectado en iteración posterior.
  // Por ahora cerramos sin información de scroll → scrolled=false desde aquí,
  // y el estado se actualiza solo vía onScrolledToEnd del renderer (ver TODO abajo).
  const handleModalClose = (docKey: DocumentKey, scrolledToEnd: boolean) => {
    setOpenDoc(null);
    onDocRead(docKey, scrolledToEnd);
  };

  const handleConsentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConsented(e.target.checked);
  };

  return (
    <div data-testid="multi-document-consent">
      {/* Párrafo legal unificado */}
      <p
        data-testid="consent-paragraph"
        style={{
          fontSize: 13,
          lineHeight: 1.6,
          color: 'var(--text-primary)',
          marginBottom: 16,
          padding: '12px 16px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
        }}
      >
        {MULTI_DOC_CONSENT_TEXT_V1}
      </p>

      {/* Tarjetas de documentos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {REQUIRED_DOCS.map((docKey) => {
          const key = docKey as DocumentKey;
          const isRead = viewedDocs[key];

          return (
            <DocumentCard
              key={docKey}
              docKey={key}
              displayName={DOC_DISPLAY_NAMES[key]}
              isRead={isRead}
              onRead={() => setOpenDoc(key)}
            />
          );
        })}
      </div>

      {/* Barra de progreso */}
      <div
        id={progressId}
        role="progressbar"
        aria-valuenow={readCount}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-label={`Documentos leídos: ${readCount} de 4`}
        style={{
          marginBottom: 16,
          fontSize: 13,
          color: 'var(--text-secondary, #666)',
        }}
      >
        <span>{readCount} de 4 documentos leídos</span>
        <div
          style={{
            marginTop: 6,
            height: 4,
            borderRadius: 2,
            background: 'var(--border-subtle)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${(readCount / 4) * 100}%`,
              background: 'var(--accent)',
              borderRadius: 2,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Checkbox final de aceptación */}
      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          cursor: allRead && !disabled ? 'pointer' : 'not-allowed',
          opacity: allRead && !disabled ? 1 : 0.6,
        }}
      >
        <input
          type="checkbox"
          checked={consented}
          onChange={handleConsentChange}
          disabled={!allRead || disabled}
          aria-describedby={progressId}
          aria-label="Acepto los documentos legales"
          style={{ marginTop: 3 }}
        />
        <span style={{ fontSize: 14, lineHeight: 1.5 }}>
          Acepto haber leído y comprendido los 4 documentos legales anteriores
        </span>
      </label>

      {/* Modales de documentos */}
      {REQUIRED_DOCS.map((docKey) => {
        const key = docKey as DocumentKey;
        return (
          <ModalWithScrollDetection
            key={docKey}
            docKey={key}
            isOpen={openDoc === key}
            onClose={(scrolled) => handleModalClose(key, scrolled)}
          />
        );
      })}
    </div>
  );
}

// ── Subcomponentes ─────────────────────────────────────────────────────────────

interface DocumentCardProps {
  docKey: DocumentKey;
  displayName: string;
  isRead: boolean;
  onRead: () => void;
}

function DocumentCard({
  docKey,
  displayName,
  isRead,
  onRead,
}: DocumentCardProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        border: `1px solid ${isRead ? 'var(--accent)' : 'var(--border-subtle)'}`,
        borderRadius: 6,
        background: isRead
          ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
          : 'var(--bg-primary)',
        gap: 12,
      }}
    >
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
          {displayName}
        </span>
        <span
          style={{
            display: 'block',
            fontSize: 12,
            marginTop: 2,
            color: isRead ? 'var(--accent)' : 'var(--text-secondary, #888)',
          }}
          aria-live="polite"
        >
          {isRead ? '✓ Leído' : 'Por leer'}
        </span>
      </div>
      <button
        type="button"
        onClick={onRead}
        aria-label={`Leer ${displayName}`}
        style={{
          padding: '6px 14px',
          fontSize: 13,
          border: '1px solid var(--border-subtle)',
          borderRadius: 4,
          cursor: 'pointer',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
        }}
        data-doc-key={docKey}
      >
        Leer
      </button>
    </div>
  );
}

// ── Modal con detección de scroll ──────────────────────────────────────────────

interface ModalWithScrollDetectionProps {
  docKey: DocumentKey;
  isOpen: boolean;
  onClose: (scrolledToEnd: boolean) => void;
}

function ModalWithScrollDetection({
  docKey,
  isOpen,
  onClose,
}: ModalWithScrollDetectionProps): React.ReactElement {
  const [scrolledToEnd, setScrolledToEnd] = useState(false);

  // Reset al abrir cada vez
  useEffect(() => {
    if (isOpen) setScrolledToEnd(false);
  }, [isOpen]);

  return (
    <LegalDocumentModal
      documentKey={docKey}
      isOpen={isOpen}
      onClose={() => onClose(scrolledToEnd)}
      onScrolledToEnd={() => setScrolledToEnd(true)}
    />
  );
}

export default MultiDocumentConsent;
