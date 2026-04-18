/**
 * AthenaAnalyze — Sub-panel que muestra el último análisis del documento.
 *
 * Botón "Analizar documento" llama athenaAnalyze. Renderiza 3 secciones
 * (Correcciones / Contenido / Sugerencias) con renderAthenaMarkdown.
 * Loading skeleton mientras corre. Si doc < 20 chars, muestra placeholder.
 *
 * Bloque 2c Athena IA.
 */

import React, { useState } from 'react';
import { athenaAnalyze, AthenaQuotaError } from '../../../services/workspacesApi';
import { renderAthenaMarkdown } from './renderAthenaMarkdown';
import styles from './AthenaPanel.module.css';

interface AthenaAnalyzeProps {
  docId: string;
  onQuotaExceeded: () => void;
}

export default function AthenaAnalyze({
  docId,
  onQuotaExceeded,
}: AthenaAnalyzeProps): React.ReactElement {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await athenaAnalyze(docId);
      setResult(res.result);
    } catch (err) {
      const isQuota =
        err instanceof AthenaQuotaError ||
        (err instanceof Error && (err as Error & { code?: string }).code === 'athena-quota');
      if (isQuota) {
        onQuotaExceeded();
      } else {
        setError('No se pudo analizar el documento. Por favor intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className={styles.analyzeBtn}
        onClick={() => void handleAnalyze()}
        disabled={loading}
        aria-label="Analizar documento con Athena"
      >
        {loading ? 'Analizando...' : 'Analizar documento'}
      </button>

      {loading && (
        <div aria-label="Cargando análisis" aria-busy="true">
          <div className={styles.skeleton} style={{ height: 12, width: '80%' }} />
          <div className={styles.skeleton} style={{ height: 12, width: '60%' }} />
          <div className={styles.skeleton} style={{ height: 12, width: '70%' }} />
        </div>
      )}

      {error && (
        <p style={{ color: 'var(--error, #f38ba8)', fontSize: 13 }} role="alert">
          {error}
        </p>
      )}

      {result && !loading && (
        <div
          className={styles.analyzeResult}
          dangerouslySetInnerHTML={{ __html: renderAthenaMarkdown(result) }}
          aria-label="Resultado del análisis"
        />
      )}

      {!result && !loading && !error && (
        <p className={styles.analyzePlaceholder}>
          Pulsa "Analizar documento" para que Athena revise tu texto y sugiera mejoras.
        </p>
      )}
    </div>
  );
}
