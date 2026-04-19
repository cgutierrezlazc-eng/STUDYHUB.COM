/**
 * Modal de exportación de documento Workspaces — 2d.7.
 *
 * Formato PDF/DOCX + opciones include_cover/include_rubric. Llama al
 * backend (workspaces_export.py) y descarga el blob resultante. Maneja
 * estado loading, error, y close al completar.
 *
 * Bloque 2d.7 Workspaces Export.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  downloadBlob,
  exportWorkspaceDocx,
  exportWorkspacePdf,
  type ExportOptions,
} from '../../../services/workspacesApi';

interface ExportModalProps {
  docId: string;
  docTitle: string;
  htmlContent: string;
  onClose: () => void;
}

type Format = 'pdf' | 'docx';

export default function ExportModal({ docId, docTitle, htmlContent, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<Format>('pdf');
  const [includeCover, setIncludeCover] = useState(true);
  const [includeRubric, setIncludeRubric] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function sanitizeFilename(title: string): string {
    return (title || 'workspace').replace(/[^\w\-]+/g, '_').slice(0, 80) || 'workspace';
  }

  async function handleExport() {
    setLoading(true);
    setError(null);
    try {
      const opts: ExportOptions = {
        include_cover: includeCover,
        include_rubric: includeRubric,
      };
      const safeTitle = sanitizeFilename(docTitle);

      if (format === 'pdf') {
        opts.html = htmlContent;
        const blob = await exportWorkspacePdf(docId, opts);
        downloadBlob(blob, `${safeTitle}.pdf`);
      } else {
        // DOCX requiere bloques estructurados. Para v1 publicable, convertimos
        // el HTML a un solo bloque `p` con el texto plano (sin formato). El
        // formato completo llegará con el CollaborationPlugin serializer en 2d.10.
        const plain = htmlContent
          .replace(/<[^>]+>/g, '\n')
          .replace(/\n{2,}/g, '\n')
          .trim();
        opts.blocks = [
          { type: 'h1', text: docTitle, level: 1 },
          ...plain.split('\n').map((line) => ({ type: 'p', text: line })),
        ];
        const blob = await exportWorkspaceDocx(docId, opts);
        downloadBlob(blob, `${safeTitle}.docx`);
      }
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="ws-export-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ws-export-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ws-export-modal">
        <h2 id="ws-export-title" className="ws-export-title">
          Exportar documento
        </h2>

        <fieldset className="ws-export-fieldset">
          <legend className="ws-export-legend">Formato</legend>
          <label className="ws-export-radio">
            <input
              type="radio"
              name="format"
              value="pdf"
              checked={format === 'pdf'}
              onChange={() => setFormat('pdf')}
            />
            <span>PDF (recomendado — impresión, envío formal)</span>
          </label>
          <label className="ws-export-radio">
            <input
              type="radio"
              name="format"
              value="docx"
              checked={format === 'docx'}
              onChange={() => setFormat('docx')}
            />
            <span>DOCX (Microsoft Word — editable)</span>
          </label>
        </fieldset>

        <fieldset className="ws-export-fieldset">
          <legend className="ws-export-legend">Incluir</legend>
          <label className="ws-export-check">
            <input
              type="checkbox"
              checked={includeCover}
              onChange={(e) => setIncludeCover(e.target.checked)}
            />
            <span>Tapa/portada del documento</span>
          </label>
          <label className="ws-export-check">
            <input
              type="checkbox"
              checked={includeRubric}
              onChange={(e) => setIncludeRubric(e.target.checked)}
            />
            <span>Rúbrica de evaluación como anexo</span>
          </label>
        </fieldset>

        {error && (
          <div className="ws-export-error" role="alert">
            {error}
          </div>
        )}

        <div className="ws-export-actions">
          <button
            type="button"
            className="ws-btn ws-btn--ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            ref={firstBtnRef}
            type="button"
            className="ws-btn ws-btn--primary"
            onClick={() => void handleExport()}
            disabled={loading}
          >
            {loading ? 'Generando...' : 'Descargar'}
          </button>
        </div>
      </div>
    </div>
  );
}
