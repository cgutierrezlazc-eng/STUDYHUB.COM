/**
 * LegalReacceptanceModal
 *
 * Pieza 6 del bloque bloque-legal-consolidation-v2.
 *
 * Modal bloqueante que presenta al usuario la lista de documentos legales
 * cuya versión vigente aún no ha aceptado. Estructura:
 *
 *  - Un bloque por documento con:
 *      · título (Términos, Privacidad, Cookies),
 *      · versión + hash corto,
 *      · botón "Leer documento" que abre la ruta correspondiente en una
 *        pestaña nueva y marca internamente ``read=true`` para ese
 *        documento (invariante I9: el checkbox final solo se habilita
 *        cuando TODOS los documentos fueron abiertos al menos una vez).
 *
 *  - Un checkbox final que declara "He leído y acepto todos los
 *    documentos actualizados", inicialmente deshabilitado.
 *
 *  - Botón de confirmar que llama ``onAccept(documents)`` solo cuando
 *    el checkbox está marcado.
 *
 * El modal NO realiza llamadas de red por sí solo: es puro componente
 * controlado. Es el caller quien invoca al backend y maneja errores.
 */

import { useMemo, useState } from 'react';
import type { LegalDocumentDescriptor } from '../../shared/legal_constants';

export interface LegalReacceptanceModalProps {
  /** Documentos pendientes que el usuario debe abrir y aceptar. */
  documents: LegalDocumentDescriptor[];

  /**
   * Se invoca cuando el usuario confirma la re-aceptación de todos los
   * documentos. El caller es responsable de enviar la lista al backend.
   */
  onAccept: (documents: LegalDocumentDescriptor[]) => Promise<void> | void;

  /**
   * Navegación interna. Si el caller la pasa, el botón "Leer documento"
   * usa la SPA en lugar de abrir una pestaña nueva. Si no la pasa, se
   * abre en pestaña nueva con ``window.open``.
   */
  onNavigate?: (path: string) => void;

  /**
   * Mensaje de error que se muestra debajo del checkbox si onAccept lanza.
   */
  errorMessage?: string | null;
}

export default function LegalReacceptanceModal({
  documents,
  onAccept,
  onNavigate,
  errorMessage,
}: LegalReacceptanceModalProps) {
  const [readMap, setReadMap] = useState<Record<string, boolean>>({});
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const allRead = useMemo(
    () => documents.every((doc) => readMap[doc.documentType] === true),
    [documents, readMap]
  );

  const handleOpenDocument = (doc: LegalDocumentDescriptor) => {
    setReadMap((prev) => ({ ...prev, [doc.documentType]: true }));
    if (onNavigate) {
      onNavigate(doc.route);
    } else if (typeof window !== 'undefined') {
      window.open(doc.route, '_blank', 'noopener,noreferrer');
    }
  };

  const handleAccept = async () => {
    if (!accepted || !allRead || submitting) return;
    setSubmitting(true);
    try {
      await onAccept(documents);
    } finally {
      setSubmitting(false);
    }
  };

  if (documents.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-reaccept-title"
      data-testid="legal-reaccept-modal"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        style={{
          background: 'var(--bg-primary, #fff)',
          color: 'var(--text-primary, #111)',
          borderRadius: 12,
          maxWidth: 560,
          width: '100%',
          padding: '28px 28px 24px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          lineHeight: 1.55,
        }}
      >
        <h2 id="legal-reaccept-title" style={{ margin: '0 0 8px', fontSize: 22 }}>
          Actualización de nuestros documentos legales
        </h2>
        <p style={{ margin: '0 0 18px', color: 'var(--text-secondary, #444)', fontSize: 14 }}>
          Hemos publicado nuevas versiones de los siguientes documentos. Para continuar usando
          Conniku necesitamos que abras cada uno de ellos, los leas y confirmes tu aceptación.
        </p>

        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 18px' }}>
          {documents.map((doc) => {
            const isRead = readMap[doc.documentType] === true;
            return (
              <li
                key={doc.documentType}
                style={{
                  border: '1px solid var(--border, #e5e7eb)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{doc.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary, #666)' }}>
                    Versión {doc.version} · {doc.hash.slice(0, 8)}…
                    {isRead && (
                      <span
                        style={{ marginLeft: 8, color: 'var(--accent, #2D62C8)', fontWeight: 600 }}
                        data-testid={`legal-read-${doc.documentType}`}
                      >
                        Leído
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenDocument(doc)}
                  data-testid={`legal-open-${doc.documentType}`}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 6,
                    border: '1px solid var(--accent, #2D62C8)',
                    background: isRead ? 'transparent' : 'var(--accent, #2D62C8)',
                    color: isRead ? 'var(--accent, #2D62C8)' : '#fff',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {isRead ? 'Releer' : 'Leer documento'}
                </button>
              </li>
            );
          })}
        </ul>

        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            fontSize: 14,
            color: allRead ? 'var(--text-primary, #111)' : 'var(--text-tertiary, #9CA3AF)',
            cursor: allRead ? 'pointer' : 'not-allowed',
            marginBottom: 16,
          }}
        >
          <input
            type="checkbox"
            checked={accepted}
            disabled={!allRead}
            onChange={(e) => setAccepted(e.target.checked)}
            data-testid="legal-reaccept-checkbox"
            style={{ marginTop: 3 }}
          />
          <span>
            He leído y acepto los documentos actualizados (Términos y Condiciones, Política de
            Privacidad y Política de Cookies). Esta aceptación se registra con fecha, hora y hash
            del texto, como evidencia en caso de disputa.
          </span>
        </label>

        {errorMessage && (
          <div
            role="alert"
            style={{
              marginBottom: 12,
              padding: '10px 12px',
              background: 'rgba(220, 38, 38, 0.08)',
              border: '1px solid rgba(220, 38, 38, 0.25)',
              borderRadius: 6,
              color: '#B91C1C',
              fontSize: 13,
            }}
          >
            {errorMessage}
          </div>
        )}

        <button
          type="button"
          onClick={handleAccept}
          disabled={!accepted || !allRead || submitting}
          data-testid="legal-reaccept-submit"
          style={{
            width: '100%',
            padding: '12px 18px',
            borderRadius: 8,
            border: 'none',
            background:
              accepted && allRead && !submitting
                ? 'var(--accent, #2D62C8)'
                : 'var(--bg-secondary, #E5E7EB)',
            color: accepted && allRead && !submitting ? '#fff' : 'var(--text-tertiary, #9CA3AF)',
            cursor: accepted && allRead && !submitting ? 'pointer' : 'not-allowed',
            fontWeight: 600,
            fontSize: 15,
          }}
        >
          {submitting ? 'Registrando aceptación…' : 'Aceptar y continuar'}
        </button>
      </div>
    </div>
  );
}
