/**
 * TermsOfService — wrapper que usa LegalDocumentRenderer.
 *
 * D-L7=A: reescrito para usar el renderer con el markdown canónico.
 * Mantiene prop onNavigate para compatibilidad con App.tsx.
 * La ruta /terms sigue activa (D-L4=B).
 *
 * Bloque: legal-viewer-v1
 */
import React from 'react';
import { LegalDocumentRenderer } from '../components/Legal/LegalDocumentRenderer';
import tosStyles from './TermsOfService.module.css';

interface Props {
  onNavigate: (path: string) => void;
}

export default function TermsOfService({ onNavigate }: Props) {
  return (
    <>
      <div className={tosStyles.topProgress}>
        <div className={tosStyles.tpLeft}>
          <span className={tosStyles.pulse} aria-hidden="true" />
          <span>Términos y condiciones</span>
        </div>
        <span>Ley 19.496 Chile · vigente</span>
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
      <LegalDocumentRenderer docKey="terms" variant="page" registerView={true} />
    </>
  );
}
