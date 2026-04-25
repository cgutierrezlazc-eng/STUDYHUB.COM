/**
 * LegalDocumentRenderer — renderiza un documento legal canónico desde markdown.
 *
 * D-L1=A: usa react-markdown + remark-gfm para render runtime.
 * El contenido viene del hook useLegalDocument (import ?raw via Vite).
 * Registra apertura via useLegalDocumentView (D-L5=A, best-effort).
 *
 * Bloque: legal-viewer-v1
 */
import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DocumentKey, LEGAL_DOCUMENT_REGISTRY } from '../../legal/documentRegistry';
import { useLegalDocument } from '../../hooks/useLegalDocument';
import { useLegalDocumentView } from '../../hooks/useLegalDocumentView';
import styles from './LegalDocumentRenderer.module.css';

interface Props {
  docKey: DocumentKey;
  variant: 'page' | 'modal';
  /** Registrar apertura del documento en backend (default true). */
  registerView?: boolean;
  /** Callback cuando el render terminó y el contenido es visible. */
  onReady?: () => void;
  /** Callback cuando el scroll alcanza el 90% del documento. */
  onScrolledToEnd?: () => void;
}

export function LegalDocumentRenderer({
  docKey,
  variant,
  registerView = true,
  onReady,
  onScrolledToEnd,
}: Props): React.ReactElement {
  const { content, version, hash, loading, error } = useLegalDocument(docKey);
  const meta = LEGAL_DOCUMENT_REGISTRY[docKey];
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrolledRef = useRef(false);

  // Registrar apertura — hash=null cuando registerView=false para señalizar al hook
  useLegalDocumentView(docKey, registerView ? hash : null);

  // onReady se dispara cuando el contenido está disponible
  useEffect(() => {
    if (!loading && content && onReady) {
      onReady();
    }
  }, [loading, content, onReady]);

  // Detección de scroll al 90%
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !onScrolledToEnd) return;

    const handleScroll = () => {
      if (scrolledRef.current) return;
      const ratio = el.scrollTop / (el.scrollHeight - el.clientHeight);
      if (ratio >= 0.9) {
        scrolledRef.current = true;
        onScrolledToEnd();
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [onScrolledToEnd]);

  if (loading) {
    return (
      <div className={styles.loading} role="status" aria-live="polite">
        Cargando documento...
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className={styles.error} role="alert">
        <p className={styles.errorTitle}>Error al cargar el documento</p>
        <p>
          {error ?? 'El documento no está disponible temporalmente.'} Si el problema persiste,
          escríbenos a{' '}
          <a href="mailto:contacto@conniku.com" style={{ color: 'var(--accent)' }}>
            contacto@conniku.com
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className={styles.wrapper} data-variant={variant}>
      <div className={styles.docMeta}>
        {meta.title} · Versión {version}
      </div>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Links externos se abren en pestaña nueva
          a: ({ href, children, ...rest }) => {
            const isExternal = href?.startsWith('http');
            return (
              <a
                href={href}
                {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                {...rest}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default LegalDocumentRenderer;
