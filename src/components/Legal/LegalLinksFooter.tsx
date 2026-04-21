/**
 * LegalLinksFooter — fragmento reutilizable con los 4 links legales.
 *
 * D-L6=C: componente mínimo que cada página embebe donde le convenga.
 *
 * Modos:
 * - usePageNavigation=false (default): botones que abren LegalDocumentModal
 * - usePageNavigation=true: links <a> que navegan a /legal/:doc
 *
 * Bloque: legal-viewer-v1
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DocumentKey, LEGAL_DOCUMENT_ENTRIES } from '../../legal/documentRegistry';
import { LegalDocumentModal } from './LegalDocumentModal';

interface Props {
  /** Si true, usa links de navegación en lugar de abrir modal. */
  usePageNavigation?: boolean;
}

export function LegalLinksFooter({ usePageNavigation = false }: Props): React.ReactElement {
  const [openDoc, setOpenDoc] = useState<DocumentKey | null>(null);

  return (
    <>
      <nav aria-label="enlaces legales">
        {LEGAL_DOCUMENT_ENTRIES.map(([key, meta], idx) => (
          <React.Fragment key={key}>
            {idx > 0 && <span aria-hidden="true"> · </span>}
            {usePageNavigation ? (
              <Link to={`/legal/${meta.slug}`}>{meta.title}</Link>
            ) : (
              <button type="button" onClick={() => setOpenDoc(key)}>
                {meta.title}
              </button>
            )}
          </React.Fragment>
        ))}
      </nav>

      {!usePageNavigation && openDoc && (
        <LegalDocumentModal documentKey={openDoc} isOpen={true} onClose={() => setOpenDoc(null)} />
      )}
    </>
  );
}

export default LegalLinksFooter;
