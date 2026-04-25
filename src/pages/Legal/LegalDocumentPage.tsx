/**
 * LegalDocumentPage — página individual dentro del layout /legal/:docKey.
 *
 * Bloque: legal-viewer-v1
 */
import React from 'react';
import { DocumentKey } from '../../legal/documentRegistry';
import { LegalDocumentRenderer } from '../../components/Legal/LegalDocumentRenderer';

interface Props {
  docKey: DocumentKey;
}

export function LegalDocumentPage({ docKey }: Props): React.ReactElement {
  return <LegalDocumentRenderer docKey={docKey} variant="page" registerView={true} />;
}

export default LegalDocumentPage;
