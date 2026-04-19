/**
 * UpgradeModal — Modal que aparece cuando el usuario Free agota su cupo diario de Athena.
 *
 * Copy en español chileno, neutral (sin presionar). No cita precio (puede cambiar).
 * Cumple Ley 19.496 — no información engañosa sobre costo/beneficio.
 *
 * Bloque 2c Athena IA.
 */

import React, { useEffect, useRef } from 'react';
import styles from './AthenaPanel.module.css';

interface UpgradeModalProps {
  limit: number;
  onNavigate: (path: string) => void;
  onClose: () => void;
}

export default function UpgradeModal({
  limit,
  onNavigate,
  onClose,
}: UpgradeModalProps): React.ReactElement {
  const primaryBtnRef = useRef<HTMLButtonElement>(null);

  // Cerrar con ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Focus al abrir
  useEffect(() => {
    primaryBtnRef.current?.focus();
  }, []);

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal}>
        <h2 id="upgrade-modal-title" className={styles.modalTitle}>
          Agotaste tu cupo diario de Athena
        </h2>
        <p className={styles.modalBody}>
          En Conniku Free tienes {limit} interacciones diarias con Athena. Se reinicia a las 6:00
          AM. Con Conniku Pro tienes interacciones ilimitadas y sin espera.
        </p>
        <div className={styles.modalActions}>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>
            Entendido
          </button>
          <button
            ref={primaryBtnRef}
            type="button"
            className={styles.btnPrimary}
            onClick={() => onNavigate('/suscripciones')}
          >
            Mejorar a Conniku Pro
          </button>
        </div>
      </div>
    </div>
  );
}
