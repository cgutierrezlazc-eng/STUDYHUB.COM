/**
 * LegalGate
 *
 * Pieza 6 del bloque bloque-legal-consolidation-v2.
 *
 * Wrapper que decide si el usuario autenticado necesita re-aceptar los
 * documentos legales vigentes antes de continuar usando Conniku.
 *
 * Flujo:
 *  1. Tras login/refresh, consulta ``/auth/reaccept-status``.
 *  2. Si el backend responde ``enforce_enabled=false`` (feature flag
 *     LEGAL_GATE_ENFORCE=false), el gate queda desactivado: renderiza
 *     los children sin interrumpir. Permite deploy del código sin
 *     riesgo de lockout.
 *  3. Si ``enforce_enabled=true`` y ``pending`` no está vacía, renderiza
 *     ``LegalReacceptanceModal`` bloqueando la interfaz hasta que el
 *     usuario acepte o haga logout.
 *
 * El gate respeta ``user === null``: mientras no hay usuario autenticado
 * no se consulta el backend ni se monta el modal.
 */

import { ReactNode, useCallback, useEffect, useState } from 'react';
import { REACCEPT_DOCUMENTS, type LegalDocumentDescriptor } from '../../shared/legal_constants';
import { api } from '../services/api';
import { useAuth } from '../services/auth';
import LegalReacceptanceModal from './LegalReacceptanceModal';

interface Props {
  children: ReactNode;
}

export default function LegalGate({ children }: Props) {
  const { user } = useAuth();
  const [pending, setPending] = useState<LegalDocumentDescriptor[]>([]);
  const [enforceEnabled, setEnforceEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!user) {
      setPending([]);
      setReady(true);
      return;
    }
    try {
      const res = await api.getReacceptStatus();
      setEnforceEnabled(res.enforce_enabled);
      if (res.is_up_to_date) {
        setPending([]);
      } else {
        const descriptors = res.pending
          .map((p) =>
            REACCEPT_DOCUMENTS.find(
              (d) => d.documentType === p.document_type && d.version === p.version
            )
          )
          .filter((d): d is LegalDocumentDescriptor => Boolean(d));
        setPending(descriptors);
      }
    } catch (err) {
      // En caso de error de red no bloqueamos al usuario: simplemente no
      // se monta el modal. La próxima petición autenticada cargará el
      // estado correcto.
      console.warn('[LegalGate] No se pudo consultar reaccept-status', err);
      setPending([]);
    } finally {
      setReady(true);
    }
  }, [user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleAccept = useCallback(async (documents: LegalDocumentDescriptor[]) => {
    setErrorMessage(null);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      await api.postReacceptLegal(
        documents.map((d) => ({
          document_type: d.documentType,
          text_version: d.version,
          text_version_hash: d.hash,
        })),
        timezone
      );
      setPending([]);
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'No se pudo registrar la aceptación. Intenta de nuevo.';
      setErrorMessage(message);
    }
  }, []);

  const shouldBlock = ready && user && enforceEnabled && pending.length > 0;

  return (
    <>
      {children}
      {shouldBlock && (
        <LegalReacceptanceModal
          documents={pending}
          onAccept={handleAccept}
          errorMessage={errorMessage}
        />
      )}
    </>
  );
}
