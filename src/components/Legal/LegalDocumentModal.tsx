/**
 * LegalDocumentModal — modal flotante genérico para documentos legales.
 *
 * D-L2=A: componente genérico con prop documentKey.
 * Cierra con ESC, clic en overlay, botón X.
 * Focus trap básico: foco vuelve al trigger al cerrar.
 * aria-dialog + aria-modal + aria-labelledby.
 *
 * Bloque: legal-viewer-v1
 */
import React, { useEffect, useRef, useId } from 'react';
import { DocumentKey, getDocumentTitle } from '../../legal/documentRegistry';
import { LegalDocumentRenderer } from './LegalDocumentRenderer';
import styles from './LegalDocumentModal.module.css';

interface Props {
  documentKey: DocumentKey;
  isOpen: boolean;
  onClose: () => void;
  /** Callback opcional que se dispara al abrir el modal. */
  onOpen?: () => void;
  /**
   * Callback opcional cuando el usuario llega al 90% del scroll del documento.
   * Bloque multi-document-consent-v1 D-M3=B: scroll 90% marca como "leído".
   * Se dispara una sola vez por instancia abierta del modal.
   */
  onScrolledToEnd?: () => void;
}

export function LegalDocumentModal({
  documentKey,
  isOpen,
  onClose,
  onOpen,
  onScrolledToEnd,
}: Props): React.ReactElement | null {
  const titleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  // Guardar foco previo y llamar onOpen al abrir
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      // Mover foco al botón de cierre en el siguiente tick
      requestAnimationFrame(() => {
        closeBtnRef.current?.focus();
      });
      onOpen?.();
    } else {
      // Restaurar foco al trigger original al cerrar
      if (previousFocusRef.current && 'focus' in previousFocusRef.current) {
        (previousFocusRef.current as HTMLElement).focus?.();
      }
    }
  }, [isOpen, onOpen]);

  // ESC para cerrar
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const title = getDocumentTitle(documentKey);

  return (
    <div
      className={styles.overlay}
      data-testid="modal-overlay"
      onClick={onClose}
      aria-hidden="false"
    >
      {/* El panel detiene la propagación para no cerrar al hacer clic dentro */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.panel}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar"
            title="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className={styles.body}>
          <LegalDocumentRenderer
            docKey={documentKey}
            variant="modal"
            registerView={true}
            onScrolledToEnd={onScrolledToEnd}
          />
        </div>
      </div>
    </div>
  );
}

export default LegalDocumentModal;
