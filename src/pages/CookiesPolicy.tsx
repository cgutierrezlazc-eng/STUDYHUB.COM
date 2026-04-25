/**
 * CookiesPolicy — wrapper que usa LegalDocumentRenderer.
 *
 * D-L7=A: reescrito para usar el renderer con el markdown canónico.
 * RESUELVE BUG GDPR Art. 7(1): el usuario ahora ve exactamente el mismo
 * contenido que firma (markdown v1.0.0 hash 48b90468…).
 * Mantiene prop onNavigate para compatibilidad con App.tsx.
 * La ruta /cookies sigue activa (D-L4=B).
 *
 * Bloque: legal-viewer-v1
 */
import React from 'react';
import { LegalDocumentRenderer } from '../components/Legal/LegalDocumentRenderer';
import cpStyles from './CookiesPolicy.module.css';

interface Props {
  onNavigate: (path: string) => void;
}

export default function CookiesPolicy({ onNavigate }: Props) {
  return (
    <>
      <div className={cpStyles.topProgress}>
        <div className={cpStyles.tpLeft}>
          <span className={cpStyles.pulse} aria-hidden="true" />
          <span>Política de Cookies</span>
        </div>
        <span>Ley 19.628 · GDPR · ePrivacy</span>
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
      <LegalDocumentRenderer docKey="cookies" variant="page" registerView={true} />
    </>
  );
}
