import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../services/auth';
import { api } from '../services/api';
import { BookOpen, Star, ChevronRight } from '../components/Icons';
import PDFReader from '../components/PDFReader';
import TierGate from '../components/TierGate';
import styles from './Biblioteca.module.css';

/* Paleta editorial de covers por índice — ciclo determinístico para que
 * el mismo libro siempre se vea con el mismo color sin requerir dato
 * del backend. Los nombres coinciden con las clases .coverXxx del CSS. */
const COVER_PALETTE = [
  'coverLime',
  'coverPink',
  'coverInk',
  'coverCream',
  'coverViolet',
  'coverCyan',
  'coverPaper',
  'coverOrange',
] as const;

function coverClassFor(key: string): string {
  // Hash estable basado en el id del doc (o cualquier string)
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % COVER_PALETTE.length;
  return styles[COVER_PALETTE[idx]];
}

function sourceBadgeLabel(source: string): string {
  switch (source) {
    case 'user_shared':
      return 'Comunidad';
    case 'openstax':
      return 'OpenStax';
    case 'scielo':
      return 'SciELO';
    case 'internetarchive':
      return 'Archive';
    case 'gutenberg':
      return 'Gutenberg';
    default:
      return 'Online';
  }
}

interface Props {
  onNavigate: (path: string) => void;
}

interface LibDoc {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  cover_url?: string;
  pages?: number;
  year?: number;
  language?: string;
  rating?: number;
  rating_count?: number;
  source_type:
    | 'user_shared'
    | 'open_library'
    | 'gutenberg'
    | 'openstax'
    | 'scielo'
    | 'internetarchive';
  has_file: boolean;
  embed_url?: string;
  tags?: string[];
  views?: number;
  is_saved: boolean;
  shared_by?: string;
  source_display?: string;
  license?: string;
  license_url?: string;
  is_nc?: boolean;
  copyright_holder?: string;
  pdf_url?: string;
  read_url?: string;
  gutenberg_id?: number;
  openstax_id?: number;
  openstax_slug?: string;
  scielo_id?: string;
  ia_identifier?: string;
}

const CATEGORIES = [
  { value: '', label: 'Todas', icon: '📚' },
  { value: 'matematicas', label: 'Matemáticas', icon: '📐' },
  { value: 'ciencias', label: 'Ciencias', icon: '🔬' },
  { value: 'programacion', label: 'Programación', icon: '💻' },
  { value: 'ingenieria', label: 'Ingeniería', icon: '⚙️' },
  { value: 'medicina', label: 'Medicina', icon: '🏥' },
  { value: 'derecho', label: 'Derecho', icon: '⚖️' },
  { value: 'negocios', label: 'Negocios', icon: '📊' },
  { value: 'humanidades', label: 'Humanidades', icon: '📜' },
  { value: 'idiomas', label: 'Idiomas', icon: '🌍' },
  { value: 'arte', label: 'Arte y Diseño', icon: '🎨' },
  { value: 'psicologia', label: 'Psicología', icon: '🧠' },
];

function getCategoryColor(cat: string): string {
  const map: Record<string, string> = {
    matematicas: '#2D62C8',
    ciencias: '#0891B2',
    programacion: '#7C3AED',
    ingenieria: '#D97706',
    medicina: '#DC2626',
    derecho: '#4338CA',
    negocios: '#059669',
    humanidades: '#92400E',
    idiomas: '#0284C7',
    arte: '#DB2777',
    psicologia: '#7C3AED',
  };
  return map[cat] || '#64748B';
}

function stars(r: number) {
  const full = Math.floor(r);
  return '★'.repeat(full) + (r % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.ceil(r));
}

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'https://studyhub-api-bpco.onrender.com';

const SOURCE_NAMES: Record<string, string> = {
  user_shared: 'Conniku',
  open_library: 'Open Library',
  gutenberg: 'Project Gutenberg',
  openstax: 'OpenStax',
  scielo: 'SciELO Livros',
  internetarchive: 'Internet Archive',
};

function generateCitation(doc: LibDoc, style: 'apa' | 'mla' | 'chicago'): string {
  const author = doc.author || 'Autor desconocido';
  const title = doc.title || 'Sin título';
  const year = doc.year ? String(doc.year) : 's.f.';
  const source = SOURCE_NAMES[doc.source_type] || doc.source_display || '';
  if (style === 'apa') return `${author}. (${year}). ${title}. ${source}.`;
  if (style === 'mla') return `${author}. "${title}." ${source}, ${year}.`;
  return `${author}. ${title}. ${source}, ${year}.`; // chicago
}

export default function Biblioteca({ onNavigate }: Props) {
  const { user } = useAuth();

  // ── Source tab ──
  const [sourceTab, setSourceTab] = useState<'comunidad' | 'academicos' | 'publica'>('comunidad');

  const [docs, setDocs] = useState<LibDoc[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);

  // ── Public domain (Gutenberg) state ──
  const [pdDocs, setPdDocs] = useState<LibDoc[]>([]);
  const [pdTotal, setPdTotal] = useState(0);
  const [pdLoading, setPdLoading] = useState(false);
  const [pdPage, setPdPage] = useState(1);
  const [pdLang, setPdLang] = useState('es');

  // ── Académicos (OpenStax) state ──
  const [acDocs, setAcDocs] = useState<LibDoc[]>([]);
  const [acTotal, setAcTotal] = useState(0);
  const [acLoading, setAcLoading] = useState(false);
  const [acPage, setAcPage] = useState(1);

  const [selected, setSelected] = useState<LibDoc | null>(null);
  const [reading, setReading] = useState<LibDoc | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [iframeRetry, setIframeRetry] = useState(0);

  // ── Clone-to-workspace state ──
  const [cloneDoc, setCloneDoc] = useState<LibDoc | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string; color?: string }[]>([]);
  const [cloneLoading, setCloneLoading] = useState(false);
  const [cloneSuccess, setCloneSuccess] = useState('');
  const [cloneDuplicate, setCloneDuplicate] = useState('');
  const [citationCopied, setCitationCopied] = useState('');

  // Carga datos comunidad
  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getBiblioteca({ q: search, category, page });
      setDocs(res.items || []);
      setTotal(res.total || 0);
    } catch {
      setDocs([]);
    }
    setLoading(false);
  }, [search, category, page]);

  useEffect(() => {
    if (sourceTab === 'comunidad') loadDocs();
  }, [loadDocs, sourceTab]);

  // Carga libros dominio público
  const loadPublicDomain = useCallback(async () => {
    setPdLoading(true);
    try {
      const res = await api.getPublicDomainBooks({
        q: search,
        lang: pdLang || undefined,
        page: pdPage,
      });
      setPdDocs(res.items || []);
      setPdTotal(res.total || 0);
    } catch {
      setPdDocs([]);
    }
    setPdLoading(false);
  }, [search, pdLang, pdPage]);

  useEffect(() => {
    if (sourceTab === 'publica') loadPublicDomain();
  }, [loadPublicDomain, sourceTab]);

  // Carga libros académicos (OpenStax)
  const loadAcademicos = useCallback(async () => {
    setAcLoading(true);
    try {
      const res = await api.searchBibliotecaUnified({
        q: search,
        sources: 'openstax,scielo,internetarchive',
        page: acPage,
      });
      setAcDocs(res.items || []);
      setAcTotal(res.total || 0);
    } catch {
      setAcDocs([]);
    }
    setAcLoading(false);
  }, [search, acPage]);

  useEffect(() => {
    if (sourceTab === 'academicos') loadAcademicos();
  }, [loadAcademicos, sourceTab]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
      setPdPage(1);
      setAcPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Timeout fallback: si el iframe no carga en 20s, mostrar error con link directo
  useEffect(() => {
    if (!reading || iframeLoaded || iframeError) return;
    const timer = setTimeout(() => setIframeError(true), 20_000);
    return () => clearTimeout(timer);
  }, [reading, iframeLoaded, iframeError]);

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setPage(1);
  };

  const toggleSave = async (doc: LibDoc, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await api.toggleBibliotecaSave(doc.id);
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, is_saved: res.saved } : d)));
      if (selected?.id === doc.id) setSelected((s) => (s ? { ...s, is_saved: res.saved } : s));
      if (reading?.id === doc.id) setReading((r) => (r ? { ...r, is_saved: res.saved } : r));
    } catch {
      /* offline */
    }
  };

  // ── Progreso de lectura ──
  const [savedProgress, setSavedProgress] = useState<{
    current_page: number;
    total_pages: number;
  } | null>(null);

  const isPDFSource = (doc: LibDoc): boolean =>
    doc.source_type === 'openstax' ||
    doc.source_type === 'scielo' ||
    (doc.source_type === 'user_shared' && doc.has_file && (doc.embed_url || '').endsWith('.pdf'));

  const openReader = async (doc: LibDoc) => {
    setSelected(null);
    setIframeLoaded(false);
    setIframeError(false);
    setSavedProgress(null);
    setReading(doc);

    // Cargar progreso guardado para PDFs
    if (isPDFSource(doc)) {
      const extId = doc.id.replace(/^(openstax|scielo|gutenberg|ia)-/, '');
      try {
        const progress = await api.getReadingProgress(doc.source_type, extId);
        if (progress && progress.current_page > 1) {
          setSavedProgress(progress);
        }
      } catch {
        // Sin progreso guardado — empezar desde página 1
      }
    }
  };

  const handlePageChange = useCallback(
    (page: number, total: number) => {
      if (!reading) return;
      const extId = reading.id.replace(/^(openstax|scielo|gutenberg|ia)-/, '');
      api.saveReadingProgress(reading.source_type, extId, page, total).catch(() => {});
    },
    [reading]
  );

  const openCloneModal = async (doc: LibDoc) => {
    setCloneDoc(doc);
    setCloneSuccess('');
    try {
      const list = await api.getProjects();
      setProjects(Array.isArray(list) ? list : []);
    } catch {
      setProjects([]);
    }
  };

  const executeClone = async (projectId: string) => {
    if (!cloneDoc || cloneLoading) return;
    setCloneLoading(true);
    setCloneDuplicate('');
    try {
      const res = await api.cloneBibliotecaDoc(cloneDoc.id, projectId);
      if (res.duplicate) {
        setCloneDuplicate(res.project_name || 'esta asignatura');
        setTimeout(() => {
          setCloneDoc(null);
          setCloneDuplicate('');
        }, 2500);
      } else {
        setCloneSuccess(res.project_name || 'tu asignatura');
        setTimeout(() => {
          setCloneDoc(null);
          setCloneSuccess('');
        }, 2000);
      }
    } catch (err: any) {
      setCloneDuplicate(err?.message || 'Error al agregar documento');
      setTimeout(() => setCloneDuplicate(''), 3000);
    }
    setCloneLoading(false);
  };

  const getViewUrl = (doc: LibDoc): string => {
    if (doc.has_file) return `${API_BASE}/biblioteca/${doc.id}/file`;
    // Libros de Gutenberg: usar proxy propio para evitar X-Frame-Options
    if (doc.source_type === 'gutenberg' && doc.embed_url) {
      return `${API_BASE}/biblioteca/gutenberg-read?url=${encodeURIComponent(doc.embed_url)}`;
    }
    // OpenStax: CC-BY → servir PDF desde cache; CC-BY-NC-SA → leer en OpenStax directo
    if (doc.source_type === 'openstax') {
      if (doc.is_nc && doc.read_url) {
        return doc.read_url;
      }
      const extId = doc.id.replace('openstax-', '');
      return `${API_BASE}/biblioteca/v2/openstax/${extId}/read`;
    }
    // SciELO: servir PDF desde cache
    if (doc.source_type === 'scielo') {
      if (doc.is_nc && doc.read_url) {
        return doc.read_url;
      }
      const extId = doc.id.replace('scielo-', '');
      return `${API_BASE}/biblioteca/v2/scielo/${extId}/read`;
    }
    // Internet Archive: NC → leer en archive.org; CC-BY → embed BookReader
    if (doc.source_type === 'internetarchive') {
      if (doc.is_nc && doc.read_url) {
        return doc.read_url;
      }
      // IA BookReader es embeddable — usar embed_url directo
      if (doc.embed_url) return doc.embed_url;
      const extId = doc.id.replace('ia-', '');
      return `${API_BASE}/biblioteca/v2/internetarchive/${extId}/read`;
    }
    if (doc.embed_url) return doc.embed_url;
    return '';
  };

  const pages_total = Math.ceil(total / 24);

  // Filtros idioma Gutenberg
  const PD_LANGS = [
    { v: '', l: 'Todos' },
    { v: 'es', l: 'Español' },
    { v: 'en', l: 'Inglés' },
    { v: 'fr', l: 'Francés' },
    { v: 'de', l: 'Alemán' },
    { v: 'pt', l: 'Portugués' },
  ];

  const subtitleByTab = () => {
    if (sourceTab === 'comunidad')
      return total > 0
        ? `${total} recurso${total !== 1 ? 's' : ''} de la comunidad`
        : 'Recursos compartidos por la comunidad';
    if (sourceTab === 'academicos')
      return acTotal > 0
        ? `${acTotal} recursos — OpenStax · SciELO · Internet Archive`
        : 'Textbooks y libros académicos gratuitos';
    return pdTotal > 0
      ? `${pdTotal.toLocaleString()} libros en Project Gutenberg`
      : 'Libros de dominio público';
  };

  return (
    <div className={styles.bibRoot}>
      {/* ── Top progress bar ── */}
      <div className={styles.topProgress}>
        <div className={styles.tpLeft}>
          <span className={styles.pulse} aria-hidden="true"></span>
          <span>Biblioteca Conniku</span>
        </div>
        <span>{subtitleByTab()}</span>
      </div>

      <main className={styles.main}>
        {/* ── Hero editorial ── */}
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <h1 className={styles.heroH1}>
              Biblioteca,
              <br />
              <span className={styles.chipCyan}>uno tuyo</span>.
            </h1>
            <p className={styles.heroLead}>
              Académicos y generales. Filtra por tu carrera.{' '}
              <strong>Explora, guarda y clona</strong> libros directamente a tus asignaturas dentro
              de Conniku.
            </p>
          </div>

          <div className={styles.searchCard}>
            <div className={styles.searchLabel}>Buscar en biblioteca</div>
            <input
              className={styles.searchInput}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={
                sourceTab === 'publica'
                  ? 'Buscar en Project Gutenberg…'
                  : sourceTab === 'academicos'
                    ? 'Buscar en textbooks y académicos…'
                    : 'Termodinámica clásica'
              }
              aria-label="Buscar en biblioteca"
            />
            <div className={styles.sourceTabs} role="tablist" aria-label="Fuente de biblioteca">
              <button
                className={`${styles.sourceTabBtn} ${sourceTab === 'comunidad' ? styles.active : ''}`}
                onClick={() => setSourceTab('comunidad')}
                type="button"
                role="tab"
                aria-selected={sourceTab === 'comunidad'}
              >
                Comunidad
              </button>
              <button
                className={`${styles.sourceTabBtn} ${sourceTab === 'academicos' ? styles.active : ''}`}
                onClick={() => setSourceTab('academicos')}
                type="button"
                role="tab"
                aria-selected={sourceTab === 'academicos'}
              >
                Académicos
              </button>
              <button
                className={`${styles.sourceTabBtn} ${sourceTab === 'publica' ? styles.active : ''}`}
                onClick={() => setSourceTab('publica')}
                type="button"
                role="tab"
                aria-selected={sourceTab === 'publica'}
              >
                Dominio público
              </button>
            </div>
          </div>
        </section>

        {/* ── Filtros según tab ── */}
        {sourceTab === 'comunidad' ? (
          <div className={styles.filtersRow}>
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => handleCategoryChange(c.value)}
                className={`${styles.filterChip} ${category === c.value ? styles.active : ''}`}
                type="button"
              >
                {c.label}
              </button>
            ))}
          </div>
        ) : sourceTab === 'publica' ? (
          <div className={styles.filtersRow}>
            <span className={styles.filterLabel}>Idioma:</span>
            {PD_LANGS.map((opt) => (
              <button
                key={opt.v}
                onClick={() => {
                  setPdLang(opt.v);
                  setPdPage(1);
                }}
                className={`${styles.filterChip} ${pdLang === opt.v ? styles.active : ''}`}
                type="button"
              >
                {opt.l}
              </button>
            ))}
          </div>
        ) : null}

        {/* ── Section label ── */}
        <div className={styles.sectionLabel}>
          <span>
            {sourceTab === 'comunidad'
              ? 'Recursos compartidos'
              : sourceTab === 'academicos'
                ? 'Textbooks y académicos'
                : 'Clásicos de dominio público'}
          </span>
          {sourceTab === 'comunidad' && (
            <div className={styles.viewToggle}>
              <button
                onClick={() => setView('grid')}
                className={`${styles.viewBtn} ${view === 'grid' ? styles.active : ''}`}
                aria-label="Vista cuadrícula"
                type="button"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </button>
              <button
                onClick={() => setView('list')}
                className={`${styles.viewBtn} ${view === 'list' ? styles.active : ''}`}
                aria-label="Vista lista"
                type="button"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* ── Body por tab ── */}
        {sourceTab === 'comunidad' ? (
          <>
            {loading ? (
              <div className={styles.loading}>Cargando biblioteca…</div>
            ) : docs.length === 0 ? (
              <div className={styles.empty}>
                <div style={{ fontSize: 42, marginBottom: 8 }}>{BookOpen({ size: 48 })}</div>
                <h3>No se encontraron recursos</h3>
                <p>
                  {search || category
                    ? 'Intenta con otros términos o categoría'
                    : 'Sé el primero en compartir un documento desde tus asignaturas'}
                </p>
                {(search || category) && (
                  <button
                    className={styles.pagBtn}
                    onClick={() => {
                      setSearchInput('');
                      setSearch('');
                      setCategory('');
                    }}
                    type="button"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : view === 'grid' ? (
              <div className={styles.booksGrid}>
                {docs.map((doc) => (
                  <BookCard
                    key={doc.id}
                    doc={doc}
                    onOpen={() => setSelected(doc)}
                    onSave={(e) => toggleSave(doc, e)}
                  />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {docs.map((doc) => (
                  <BookRow
                    key={doc.id}
                    doc={doc}
                    onOpen={() => setSelected(doc)}
                    onSave={(e) => toggleSave(doc, e)}
                  />
                ))}
              </div>
            )}
            {pages_total > 1 && (
              <div className={styles.paginator}>
                <button
                  className={styles.pagBtn}
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  type="button"
                >
                  ← Anterior
                </button>
                <span className={styles.pagInfo}>
                  Pág. {page} / {pages_total}
                </span>
                <button
                  className={styles.pagBtn}
                  disabled={page >= pages_total}
                  onClick={() => setPage((p) => p + 1)}
                  type="button"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        ) : sourceTab === 'academicos' ? (
          <>
            <div className={styles.infoBanner}>
              <span className={styles.infoBannerIcon}>🎓</span>
              <div>
                <div className={styles.infoBannerTitle}>Biblioteca Académica — 3 fuentes</div>
                <div className={styles.infoBannerText}>
                  OpenStax (textbooks), SciELO (Latinoamérica), Internet Archive. Licencias Creative
                  Commons — lectura gratuita dentro de Conniku.
                </div>
              </div>
            </div>

            {acLoading ? (
              <div className={styles.loading}>Buscando recursos académicos…</div>
            ) : acDocs.length === 0 ? (
              <div className={styles.empty}>
                <div style={{ fontSize: 42, marginBottom: 8 }}>📖</div>
                <h3>Sin resultados</h3>
                <p>
                  {search
                    ? 'No se encontraron textbooks con ese término'
                    : 'Explora textbooks universitarios buscando un tema'}
                </p>
              </div>
            ) : (
              <div className={styles.booksGrid}>
                {acDocs.map((doc) => (
                  <BookCard
                    key={doc.id}
                    doc={doc}
                    onOpen={() => setSelected(doc)}
                    onSave={(e) => e.stopPropagation()}
                  />
                ))}
              </div>
            )}

            {acTotal > 24 && (
              <div className={styles.paginator}>
                <button
                  className={styles.pagBtn}
                  disabled={acPage === 1}
                  onClick={() => setAcPage((p) => p - 1)}
                  type="button"
                >
                  ← Anterior
                </button>
                <span className={styles.pagInfo}>
                  Página {acPage} / {Math.ceil(acTotal / 24)}
                </span>
                <button
                  className={styles.pagBtn}
                  disabled={acDocs.length < 24}
                  onClick={() => setAcPage((p) => p + 1)}
                  type="button"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className={styles.infoBanner}>
              <span className={styles.infoBannerIcon}>🌐</span>
              <div>
                <div className={styles.infoBannerTitle}>Project Gutenberg</div>
                <div className={styles.infoBannerText}>
                  Libros clásicos sin derechos de autor. Haz clic en un libro para leerlo
                  directamente desde Conniku.
                </div>
              </div>
            </div>

            {pdLoading ? (
              <div className={styles.loading}>Buscando en Project Gutenberg…</div>
            ) : pdDocs.length === 0 ? (
              <div className={styles.empty}>
                <div style={{ fontSize: 42, marginBottom: 8 }}>📖</div>
                <h3>Sin resultados</h3>
                <p>Intenta con otro término de búsqueda o cambia el idioma</p>
              </div>
            ) : (
              <div className={styles.booksGrid}>
                {pdDocs.map((doc) => (
                  <BookCard
                    key={doc.id}
                    doc={doc}
                    onOpen={() => setSelected(doc)}
                    onSave={(e) => e.stopPropagation()}
                  />
                ))}
              </div>
            )}

            {(pdTotal > 32 || pdPage > 1) && (
              <div className={styles.paginator}>
                <button
                  className={styles.pagBtn}
                  disabled={pdPage === 1}
                  onClick={() => setPdPage((p) => p - 1)}
                  type="button"
                >
                  ← Anterior
                </button>
                <span className={styles.pagInfo}>Página {pdPage}</span>
                <button
                  className={styles.pagBtn}
                  disabled={pdDocs.length < 32}
                  onClick={() => setPdPage((p) => p + 1)}
                  type="button"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Categorías rail (discovery al final) ── */}
        {sourceTab === 'comunidad' && (
          <>
            <div className={styles.sectionLabel}>
              <span>Explora por categoría</span>
            </div>
            <div className={styles.categoriasRail}>
              {CATEGORIES.filter((c) => c.value).map((c) => (
                <button
                  key={c.value}
                  onClick={() => handleCategoryChange(c.value)}
                  className={`${styles.catChip} ${category === c.value ? styles.active : ''}`}
                  type="button"
                >
                  <span className={styles.catIcon}>{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </>
        )}
      </main>

      {/* ── Modal Detalle ── */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <button
              onClick={() => setSelected(null)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 20,
                color: 'var(--text-muted)',
              }}
            >
              ×
            </button>

            <div style={{ display: 'flex', gap: 20 }}>
              {/* Portada */}
              <div
                style={{
                  width: 110,
                  height: 150,
                  borderRadius: 8,
                  flexShrink: 0,
                  background: `linear-gradient(135deg, ${getCategoryColor(selected.category)}25, ${getCategoryColor(selected.category)}45)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-color)',
                  fontSize: 44,
                }}
              >
                {selected.cover_url ? (
                  <img
                    src={selected.cover_url}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
                  />
                ) : (
                  CATEGORIES.find((c) => c.value === selected.category)?.icon || '📖'
                )}
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, paddingRight: 24 }}>
                  {selected.title}
                </h3>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  {selected.author}
                  {selected.year && ` · ${selected.year}`}
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 9px',
                      borderRadius: 10,
                      background:
                        selected.source_type === 'user_shared'
                          ? 'rgba(16,185,129,0.12)'
                          : selected.source_type === 'openstax'
                            ? 'rgba(139,92,246,0.12)'
                            : selected.source_type === 'scielo'
                              ? 'rgba(14,165,233,0.12)'
                              : selected.source_type === 'internetarchive'
                                ? 'rgba(234,88,12,0.12)'
                                : 'rgba(37,99,235,0.12)',
                      color:
                        selected.source_type === 'user_shared'
                          ? '#10B981'
                          : selected.source_type === 'openstax'
                            ? '#8B5CF6'
                            : selected.source_type === 'scielo'
                              ? '#0EA5E9'
                              : selected.source_type === 'internetarchive'
                                ? '#EA580C'
                                : '#2563EB',
                    }}
                  >
                    {selected.source_type === 'user_shared'
                      ? 'Comunidad'
                      : selected.source_display || 'Biblioteca Online'}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: '2px 9px',
                      borderRadius: 10,
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {CATEGORIES.find((c) => c.value === selected.category)?.label ||
                      selected.category}
                  </span>
                  {selected.language && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 9px',
                        borderRadius: 10,
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {selected.language}
                    </span>
                  )}
                </div>

                {selected.rating !== undefined && selected.rating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ color: '#F59E0B', fontSize: 13 }}>{stars(selected.rating)}</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{selected.rating}</span>
                    {selected.rating_count !== undefined && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        ({selected.rating_count} reseñas)
                      </span>
                    )}
                  </div>
                )}

                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    display: 'flex',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  {selected.pages && <span>{selected.pages} págs.</span>}
                  {selected.views !== undefined && selected.views > 0 && (
                    <span>{selected.views} vistas</span>
                  )}
                  {selected.shared_by && <span>Por {selected.shared_by}</span>}
                  {selected.source_display && <span>Fuente: {selected.source_display}</span>}
                  {selected.copyright_holder && <span>&copy; {selected.copyright_holder}</span>}
                  {selected.license &&
                    (selected.license_url ? (
                      <a
                        href={selected.license_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}
                      >
                        {selected.license}
                      </a>
                    ) : (
                      <span>{selected.license}</span>
                    ))}
                </div>
              </div>
            </div>

            {selected.description && (
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  marginTop: 16,
                }}
              >
                {selected.description}
              </p>
            )}

            {selected.tags && selected.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                {selected.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 10,
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
              {(selected.has_file || selected.embed_url) && (
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => openReader(selected)}
                >
                  {BookOpen({ size: 14 })} Leer en Conniku
                </button>
              )}
              {selected.source_type === 'gutenberg' && selected.gutenberg_id && (
                <a
                  href={`https://www.gutenberg.org/ebooks/${selected.gutenberg_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ textDecoration: 'none' }}
                >
                  🌐 Abrir en Gutenberg
                </a>
              )}
              {selected.source_type === 'openstax' && selected.read_url && (
                <a
                  href={selected.read_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ textDecoration: 'none' }}
                >
                  🌐 Leer en OpenStax
                </a>
              )}
              {selected.source_type === 'user_shared' && (
                <button
                  className={`btn ${selected.is_saved ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => toggleSave(selected)}
                >
                  <Star size={14} fill={selected.is_saved ? 'currentColor' : 'none'} />
                  {selected.is_saved ? 'Guardado' : 'Guardar'}
                </button>
              )}
              {(selected.has_file || selected.embed_url) &&
                (selected.source_type === 'user_shared' ||
                  selected.source_type === 'gutenberg') && (
                  <TierGate feature="biblioteca_clone" onNavigate={onNavigate}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => openCloneModal(selected)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {ChevronRight({ size: 14 })} Agregar a mi asignatura
                    </button>
                  </TierGate>
                )}
              {/* Botón Citar */}
              {selected.title && (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      const citation = generateCitation(selected, 'apa');
                      navigator.clipboard.writeText(citation).then(
                        () => {
                          setCitationCopied('APA');
                          setTimeout(() => setCitationCopied(''), 2000);
                        },
                        () => {
                          setCitationCopied('Error');
                          setTimeout(() => setCitationCopied(''), 2000);
                        }
                      );
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    📋 {citationCopied ? `${citationCopied} copiado` : 'Citar APA'}
                  </button>
                </div>
              )}
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Selector de Proyecto (Clone) ── */}
      {cloneDoc && (
        <div className="modal-overlay" onClick={() => !cloneLoading && setCloneDoc(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <button
              onClick={() => !cloneLoading && setCloneDoc(null)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 20,
                color: 'var(--text-muted)',
              }}
            >
              ×
            </button>

            {cloneDuplicate ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>Ya existe</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>
                  Este libro ya está en <strong>{cloneDuplicate}</strong>.
                </p>
              </div>
            ) : cloneSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>Documento agregado</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>
                  Agregado a <strong>{cloneSuccess}</strong>. Ya puedes estudiarlo de forma
                  inteligente.
                </p>
              </div>
            ) : (
              <>
                <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Agregar a mi asignatura</h3>
                <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 13 }}>
                  Selecciona dónde agregar "<strong>{cloneDoc.title}</strong>"
                </p>

                {projects.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '20px 0',
                      color: 'var(--text-muted)',
                      fontSize: 13,
                    }}
                  >
                    No tienes asignaturas creadas aún.
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      maxHeight: 300,
                      overflowY: 'auto',
                    }}
                  >
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => executeClone(p.id)}
                        disabled={cloneLoading}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          cursor: cloneLoading ? 'wait' : 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          opacity: cloneLoading ? 0.6 : 1,
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          if (!cloneLoading) e.currentTarget.style.background = 'var(--bg-hover)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--bg-secondary)';
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            flexShrink: 0,
                            background: p.color || 'var(--accent)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          {(p.name || '?')[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 13,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: 'var(--text-primary)',
                            }}
                          >
                            {p.name}
                          </div>
                        </div>
                        {ChevronRight({ size: 14 })}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  className="btn btn-secondary"
                  onClick={() => setCloneDoc(null)}
                  disabled={cloneLoading}
                  style={{ marginTop: 14, width: '100%' }}
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Visor Embebido (full-screen overlay) ── */}
      {reading && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.95)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

          {isPDFSource(reading) ? (
            /* ── PDF Reader (pdfjs-dist) ── */
            <PDFReader
              url={getViewUrl(reading)}
              title={reading.title}
              initialPage={savedProgress?.current_page}
              onPageChange={handlePageChange}
              onClose={() => setReading(null)}
              onError={() => setIframeError(true)}
            />
          ) : (
            <>
              {/* Toolbar para iframe */}
              <div
                style={{
                  height: 48,
                  background: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 16px',
                  flexShrink: 0,
                }}
              >
                <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                  {reading.title}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {reading.source_type === 'user_shared' && (
                    <button
                      onClick={() => toggleSave(reading)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: reading.is_saved ? '#F59E0B' : '#94A3B8',
                        fontSize: 13,
                      }}
                    >
                      <Star size={16} fill={reading.is_saved ? 'currentColor' : 'none'} />{' '}
                      {reading.is_saved ? 'Guardado' : 'Guardar'}
                    </button>
                  )}
                  <button
                    onClick={() => setReading(null)}
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

              {/* Iframe con loading state */}
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {!iframeLoaded && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: '#0D1526',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 16,
                      zIndex: 1,
                    }}
                  >
                    {iframeError ? (
                      <>
                        <div style={{ fontSize: 40, marginBottom: 4 }}>⚠️</div>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: 0 }}>
                          No se pudo cargar el libro
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>
                          El servidor no respondió a tiempo
                        </p>
                        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                          <button
                            onClick={() => {
                              setIframeError(false);
                              setIframeLoaded(false);
                              setIframeRetry((r) => r + 1);
                            }}
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
                            Reintentar
                          </button>
                          {(reading.embed_url || reading.gutenberg_id) && (
                            <a
                              href={
                                reading.source_type === 'gutenberg' && reading.gutenberg_id
                                  ? `https://www.gutenberg.org/ebooks/${reading.gutenberg_id}`
                                  : reading.embed_url || '#'
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '8px 16px',
                                borderRadius: 8,
                                border: 'none',
                                background: '#3b82f6',
                                color: '#fff',
                                fontSize: 13,
                                textDecoration: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              Abrir en la fuente original →
                            </a>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
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
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>
                          Cargando libro…
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>
                          Esto puede tardar algunos segundos
                        </p>
                      </>
                    )}
                  </div>
                )}
                <iframe
                  key={`${getViewUrl(reading)}_${iframeRetry}`}
                  src={getViewUrl(reading)}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: iframeLoaded ? 'block' : 'none',
                    background: '#0D1526',
                  }}
                  title={reading.title}
                  allowFullScreen
                  onLoad={() => setIframeLoaded(true)}
                  onError={() => setIframeError(true)}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────── */

function BookCard({
  doc,
  onOpen,
  onSave,
}: {
  doc: LibDoc;
  onOpen: () => void;
  onSave: (e: React.MouseEvent) => void;
}) {
  const coverClass = coverClassFor(doc.id || doc.title);
  // Spine label: categoría si existe, si no source display
  const spine =
    CATEGORIES.find((c) => c.value === doc.category)?.label ||
    doc.source_display ||
    sourceBadgeLabel(doc.source_type);

  return (
    <div className={styles.bookCard} onClick={onOpen} role="button" tabIndex={0}>
      <div className={`${styles.bookCover} ${coverClass}`}>
        <span className={styles.sourceBadge}>{sourceBadgeLabel(doc.source_type)}</span>
        {doc.cover_url && <img src={doc.cover_url} alt="" />}
        <div className={styles.spineLabel} style={{ position: 'relative', zIndex: 1 }}>
          {spine}
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h4 className={styles.bookTitle}>{doc.title}</h4>
        </div>
        <div className={styles.bookAuthor}>— {doc.author || 'Autor desconocido'}</div>
      </div>
      <div className={styles.bookInfo}>
        <span>{doc.pages ? `${doc.pages} pp.` : doc.year ? `${doc.year}` : 'Sin detalles'}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {doc.rating !== undefined && doc.rating > 0 && (
            <span className={styles.rating}>★ {doc.rating.toFixed(1)}</span>
          )}
          {doc.source_type === 'user_shared' && (
            <button
              onClick={onSave}
              className={styles.saveBtn}
              type="button"
              aria-label={doc.is_saved ? 'Quitar de guardados' : 'Guardar'}
            >
              <Star
                size={15}
                fill={doc.is_saved ? '#FF4A1C' : 'none'}
                color={doc.is_saved ? '#FF4A1C' : 'currentColor'}
              />
            </button>
          )}
        </span>
      </div>
    </div>
  );
}

function BookRow({
  doc,
  onOpen,
  onSave,
}: {
  doc: LibDoc;
  onOpen: () => void;
  onSave: (e: React.MouseEvent) => void;
}) {
  const catIcon = CATEGORIES.find((c) => c.value === doc.category)?.icon || '📖';
  return (
    <div className={styles.bookRow} onClick={onOpen} role="button" tabIndex={0}>
      <div className={styles.bookRowThumb}>{catIcon}</div>
      <div className={styles.bookRowBody}>
        <h4 className={styles.bookRowTitle}>{doc.title}</h4>
        <div className={styles.bookRowAuthor}>
          {doc.author}
          {doc.year ? ` · ${doc.year}` : ''}
          {doc.pages ? ` · ${doc.pages} págs.` : ''}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {doc.rating !== undefined && doc.rating > 0 && (
          <span className={styles.bookRowMeta}>★ {doc.rating.toFixed(1)}</span>
        )}
        <span className={styles.sourceBadge} style={{ position: 'static' }}>
          {sourceBadgeLabel(doc.source_type)}
        </span>
        {doc.source_type === 'user_shared' && (
          <button
            onClick={onSave}
            className={styles.saveBtn}
            type="button"
            aria-label={doc.is_saved ? 'Quitar de guardados' : 'Guardar'}
          >
            <Star
              size={16}
              fill={doc.is_saved ? '#FF4A1C' : 'none'}
              color={doc.is_saved ? '#FF4A1C' : 'currentColor'}
            />
          </button>
        )}
      </div>
    </div>
  );
}
