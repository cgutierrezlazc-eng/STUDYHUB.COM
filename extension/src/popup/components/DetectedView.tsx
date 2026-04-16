import { useEffect, useState } from 'react';
import type { ExtractedCourse, PlatformDetection } from '@shared/types';
import { safeHostname } from '@shared/utils';
import { HelpTrigger } from './HelpOverlay';

interface Props {
  platform?: PlatformDetection;
  onStartSync: (courseIds?: string[]) => void;
}

export function DetectedView({ platform, onStartSync }: Props) {
  const [courses, setCourses] = useState<ExtractedCourse[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Leer cursos desde storage (el extractor los guarda ahi)
    async function loadCourses() {
      try {
        const result = await chrome.storage.local.get('detectedCourses');
        if (!cancelled && Array.isArray(result.detectedCourses) && result.detectedCourses.length > 0) {
          setCourses(result.detectedCourses);
          // Pre-seleccionar cursos actuales
          const currentIds = new Set(
            result.detectedCourses
              .filter((c: ExtractedCourse) => c.isCurrent)
              .map((c: ExtractedCourse) => c.externalId),
          );
          setSelected(currentIds);
          setLoading(false);
          return;
        }
      } catch { /* storage vacio, intentar extraccion */ }

      // Si no hay cursos en storage, pedir al extractor
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id || cancelled) { setLoading(false); return; }

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['extractor.js'],
        });

        chrome.tabs.sendMessage(tab.id, {
          type: 'EXTRACT_REQUEST',
          payload: { mode: 'full' },
        });
      } catch (err) {
        console.warn('[Conniku] Error inyectando extractor:', err);
        if (!cancelled) setLoading(false);
      }
    }

    loadCourses();

    // Escuchar cuando los cursos lleguen via storage update
    function onStorageChanged(changes: Record<string, chrome.storage.StorageChange>) {
      if (cancelled) return;
      if (changes.detectedCourses?.newValue) {
        const newCourses = changes.detectedCourses.newValue as ExtractedCourse[];
        setCourses(newCourses);
        const currentIds = new Set(
          newCourses.filter((c) => c.isCurrent).map((c) => c.externalId),
        );
        setSelected(currentIds);
        setLoading(false);
      }
      if (changes.syncStatus?.newValue?.state === 'error') {
        setLoading(false);
      }
    }
    chrome.storage.local.onChanged.addListener(onStorageChanged);

    const timeout = setTimeout(() => { if (!cancelled) setLoading(false); }, 15000);

    return () => {
      cancelled = true;
      chrome.storage.local.onChanged.removeListener(onStorageChanged);
      clearTimeout(timeout);
    };
  }, []);

  const toggleCourse = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSync = () => {
    const ids = selected.size > 0 ? Array.from(selected) : undefined;
    onStartSync(ids);
  };

  return (
    <div className="popup-body">
      {platform && (
        <div className="platform-banner">
          <div className="platform-icon" aria-hidden="true">🎓</div>
          <div className="platform-info">
            <div className="platform-name">
              {platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)} — {platform.siteName}
            </div>
            <div className="platform-url">{safeHostname(platform.baseUrl)}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <p>Detectando asignaturas...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <h3 className="section-header">Campus detectado</h3>
          <p className="section-sub">
            Presiona sincronizar para importar tus asignaturas, documentos y calendario.
          </p>
          <button className="btn-primary" onClick={() => onStartSync()}>
            Sincronizar con Conniku
          </button>
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <HelpTrigger helpKey="sync" />
          </div>
        </div>
      ) : (
        <>
          <h3 className="section-header">{courses.length} asignaturas detectadas</h3>
          <p className="section-sub">Selecciona las que quieres sincronizar con Conniku</p>

          <div className="course-list" role="listbox" aria-label="Asignaturas disponibles">
            {courses.map((course) => {
              const isSelected = selected.has(course.externalId);
              return (
                <button
                  key={course.externalId}
                  className="course-item"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => toggleCourse(course.externalId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleCourse(course.externalId);
                    }
                  }}
                >
                  <div
                    className={`course-check ${isSelected ? 'checked' : ''}`}
                    aria-hidden="true"
                  >
                    {isSelected ? '✓' : ''}
                  </div>
                  <div
                    className="course-name"
                    style={{ color: course.isCurrent ? undefined : 'var(--text-muted)' }}
                  >
                    {course.name}
                    {!course.isCurrent && ' (anterior)'}
                  </div>
                  {course.fileCount > 0 && (
                    <div className="course-files">{course.fileCount} docs</div>
                  )}
                </button>
              );
            })}
          </div>

          <button className="btn-primary" onClick={handleSync} disabled={selected.size === 0}>
            Crear asignaturas en Conniku
          </button>

          <div className="popup-footer-inline">
            <span>{selected.size} seleccionadas</span>
            <HelpTrigger helpKey="courses" />
          </div>
        </>
      )}
    </div>
  );
}
