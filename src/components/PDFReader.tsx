import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker para pdfjs-dist + Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface PDFReaderProps {
  url: string;
  title: string;
  initialPage?: number;
  onPageChange?: (page: number, total: number) => void;
  onClose: () => void;
  onError?: () => void;
}

export default function PDFReader({
  url,
  title,
  initialPage = 1,
  onPageChange,
  onClose,
  onError,
}: PDFReaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const renderingRef = useRef(false);
  const onErrorRef = useRef(onError);
  const onPageChangeRef = useRef(onPageChange);

  // Mantener refs actualizados sin causar re-renders
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [nightMode, setNightMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageInput, setPageInput] = useState(String(initialPage));

  // Cargar documento PDF (solo depende de url — no de initialPage/onError)
  useEffect(() => {
    let cancelled = false;

    async function loadPDF() {
      // Destruir documento anterior si existe
      if (pdfRef.current) {
        pdfRef.current.destroy();
        pdfRef.current = null;
      }

      setLoading(true);
      setError('');
      try {
        const pdf = await pdfjsLib.getDocument(url).promise;
        if (cancelled) {
          pdf.destroy();
          return;
        }
        pdfRef.current = pdf;
        setTotalPages(pdf.numPages);
        const startPage = Math.min(initialPage, pdf.numPages);
        setCurrentPage(startPage);
        setPageInput(String(startPage));
        setLoading(false);
      } catch {
        if (cancelled) return;
        setError('No se pudo cargar el PDF');
        setLoading(false);
        onErrorRef.current?.();
      }
    }

    loadPDF();
    return () => {
      cancelled = true;
      pdfRef.current?.destroy();
      pdfRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // Render página actual en canvas (rendering como ref, no state)
  const renderPage = useCallback(async () => {
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !canvas || renderingRef.current) return;

    renderingRef.current = true;
    try {
      const page = await pdf.getPage(currentPage);
      const baseViewport = page.getViewport({ scale: 1.0 });

      const container = containerRef.current;
      const containerWidth = container ? container.clientWidth - 40 : 800;
      const fitScale = containerWidth / baseViewport.width;
      const finalScale = fitScale * zoom;

      const viewport = page.getViewport({ scale: finalScale });
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch {
      // Render error — página podría estar corrupta
    }
    renderingRef.current = false;
  }, [currentPage, zoom]);

  useEffect(() => {
    if (!loading && totalPages > 0) {
      renderPage();
    }
  }, [currentPage, zoom, loading, totalPages, renderPage]);

  // Notificar cambio de página (debounce 2s)
  useEffect(() => {
    if (totalPages === 0) return;
    const timer = setTimeout(() => {
      onPageChangeRef.current?.(currentPage, totalPages);
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentPage, totalPages]);

  // Navegación
  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(clamped);
      setPageInput(String(clamped));
    },
    [totalPages]
  );

  const handlePageInputSubmit = () => {
    const num = parseInt(pageInput, 10);
    if (!isNaN(num)) {
      goToPage(num);
    } else {
      setPageInput(String(currentPage));
    }
  };

  // Keyboard shortcuts (con dependency array, skip en input focus)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // No interceptar shortcuts cuando el input de página tiene foco
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToPage(currentPage + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPage(currentPage - 1);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentPage, goToPage, onClose]);

  const percent = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 16,
          color: '#fff',
        }}
      >
        <div style={{ fontSize: 40 }}>⚠️</div>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{error}</p>
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div
        style={{
          height: 48,
          background: '#0F172A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          flexShrink: 0,
          gap: 8,
        }}
      >
        {/* Navegación de páginas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              borderRadius: 4,
              padding: '4px 8px',
              cursor: currentPage <= 1 ? 'default' : 'pointer',
              opacity: currentPage <= 1 ? 0.3 : 1,
              fontSize: 13,
            }}
          >
            ←
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={handlePageInputSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handlePageInputSubmit()}
              style={{
                width: 40,
                textAlign: 'center',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 4,
                color: '#fff',
                fontSize: 12,
                padding: '2px 4px',
              }}
            />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>/ {totalPages}</span>
          </div>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              borderRadius: 4,
              padding: '4px 8px',
              cursor: currentPage >= totalPages ? 'default' : 'pointer',
              opacity: currentPage >= totalPages ? 0.3 : 1,
              fontSize: 13,
            }}
          >
            →
          </button>
        </div>

        {/* Título */}
        <span
          style={{
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            flex: 1,
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            padding: '0 8px',
          }}
        >
          {title}
        </span>

        {/* Controles derecha */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Zoom */}
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              borderRadius: 4,
              padding: '4px 6px',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            −
          </button>
          <span
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 11,
              minWidth: 36,
              textAlign: 'center',
            }}
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.25, 3.0))}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              borderRadius: 4,
              padding: '4px 6px',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            +
          </button>

          {/* Modo nocturno */}
          <button
            onClick={() => setNightMode((n) => !n)}
            style={{
              background: nightMode ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.1)',
              border: nightMode ? '1px solid rgba(99,102,241,0.5)' : 'none',
              color: '#fff',
              borderRadius: 4,
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            🌙
          </button>

          {/* Cerrar */}
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              borderRadius: 6,
              padding: '4px 12px',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            ✕ Cerrar
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: 20,
          background: nightMode ? '#1a1a2e' : '#2d2d2d',
        }}
      >
        {loading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                border: '3px solid rgba(255,255,255,0.1)',
                borderTopColor: '#3b82f6',
                borderRadius: '50%',
                animation: 'spin 0.9s linear infinite',
              }}
            />
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Cargando PDF...</p>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            style={{
              maxWidth: '100%',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              borderRadius: 4,
              filter: nightMode ? 'invert(0.88) hue-rotate(180deg)' : 'none',
            }}
          />
        )}
      </div>

      {/* Barra de progreso */}
      <div
        style={{
          height: 28,
          background: '#0F172A',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            height: 4,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${percent}%`,
              height: '100%',
              background: '#3b82f6',
              borderRadius: 2,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, flexShrink: 0 }}>
          {percent}%
        </span>
      </div>
    </div>
  );
}
