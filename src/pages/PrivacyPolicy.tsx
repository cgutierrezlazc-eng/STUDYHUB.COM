/**
 * PrivacyPolicy — wrapper que usa LegalDocumentRenderer.
 *
 * D-L7=A: reescrito para usar el renderer con el markdown canónico.
 * Mantiene prop onNavigate para compatibilidad con App.tsx.
 * La ruta /privacy sigue activa (D-L4=B).
 *
 * Bloque: legal-viewer-v1
 */
import React from 'react';
import { LegalDocumentRenderer } from '../components/Legal/LegalDocumentRenderer';
import ppStyles from './PrivacyPolicy.module.css';

interface Props {
  onNavigate: (path: string) => void;
}

export default function PrivacyPolicy({ onNavigate }: Props) {
  return (
    <>
      <div className={ppStyles.topProgress}>
        <div className={ppStyles.tpLeft}>
          <span className={ppStyles.pulse} aria-hidden="true" />
          <span>Política de Privacidad</span>
        </div>
        <span>Ley 19.628 Chile · GDPR · vigente</span>
      </div>
      <button
        onClick={() => onNavigate('/')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 16px',
          margin: '16px 24px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        ← Volver
      </button>
      <LegalDocumentRenderer docKey="privacy" variant="page" registerView={true} />
    </>
  );
}
