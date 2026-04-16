import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../services/auth';
import { api } from '../services/api';
import { BookOpen, Search, Star, ChevronRight } from '../components/Icons';

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
  source_type: 'user_shared' | 'open_library' | 'gutenberg' | 'openstax';
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
        sources: 'openstax',
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

  const openReader = (doc: LibDoc) => {
    setSelected(null);
    setIframeLoaded(false);
    setIframeError(false);
    setReading(doc);
  };

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
    try {
      const res = await api.cloneBibliotecaDoc(cloneDoc.id, projectId);
      setCloneSuccess(res.project_name || 'tu asignatura');
      setTimeout(() => {
        setCloneDoc(null);
        setCloneSuccess('');
      }, 2000);
    } catch (err: any) {
      alert(err?.message || 'Error al agregar documento');
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
    if (doc.embed_url) return doc.embed_url;
    return '';
  };

  const pages_total = Math.ceil(total / 24);

  return (
    <>
      {/* ── Header ── */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {BookOpen({ size: 22 })} Biblioteca
            </h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>
              {sourceTab === 'comunidad'
                ? total > 0
                  ? `${total} recurso${total !== 1 ? 's' : ''} de la comunidad`
                  : 'Recursos académicos compartidos por la comunidad'
                : sourceTab === 'academicos'
                  ? acTotal > 0
                    ? `${acTotal} textbooks universitarios — OpenStax`
                    : 'Textbooks universitarios gratuitos — OpenStax'
                  : pdTotal > 0
                    ? `${pdTotal.toLocaleString()} libros en Project Gutenberg`
                    : 'Libros de dominio público — Project Gutenberg'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {sourceTab === 'comunidad' && (
              <>
                <button
                  className={`btn btn-sm ${view === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setView('grid')}
                  title="Cuadrícula"
                >
                  <svg
                    width="16"
                    height="16"
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
                  className={`btn btn-sm ${view === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setView('list')}
                  title="Lista"
                >
                  <svg
                    width="16"
                    height="16"
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
              </>
            )}
          </div>
        </div>

        {/* ── Source tabs ── */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            marginTop: 14,
            background: 'var(--bg-secondary)',
            borderRadius: 10,
            padding: 4,
            width: 'fit-content',
          }}
        >
          <button
            onClick={() => setSourceTab('comunidad')}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              background: sourceTab === 'comunidad' ? 'var(--bg-primary)' : 'transparent',
              color: sourceTab === 'comunidad' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: sourceTab === 'comunidad' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            📚 Comunidad
          </button>
          <button
            onClick={() => setSourceTab('academicos')}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              background: sourceTab === 'academicos' ? 'var(--bg-primary)' : 'transparent',
              color: sourceTab === 'academicos' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: sourceTab === 'academicos' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            🎓 Académicos
          </button>
          <button
            onClick={() => setSourceTab('publica')}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              background: sourceTab === 'publica' ? 'var(--bg-primary)' : 'transparent',
              color: sourceTab === 'publica' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: sourceTab === 'publica' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            🌐 Dominio Público
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginTop: 12 }}>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={
              sourceTab === 'publica'
                ? 'Buscar en Project Gutenberg...'
                : 'Buscar por título, autor o tema...'
            }
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              opacity: 0.45,
            }}
          >
            {Search({ size: 16 })}
          </span>
        </div>

        {/* Filtros según tab */}
        {sourceTab === 'comunidad' ? (
          <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => handleCategoryChange(c.value)}
                style={{
                  padding: '5px 13px',
                  borderRadius: 20,
                  border: '1px solid',
                  borderColor: category === c.value ? 'var(--accent)' : 'var(--border-color)',
                  background: category === c.value ? 'rgba(37,99,235,0.09)' : 'transparent',
                  color: category === c.value ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>{c.icon}</span> {c.label}
              </button>
            ))}
          </div>
        ) : sourceTab === 'publica' ? (
          <div
            style={{
              display: 'flex',
              gap: 6,
              marginTop: 12,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
              Idioma:
            </span>
            {[
              { v: '', l: 'Todos' },
              { v: 'es', l: '🇪🇸 Español' },
              { v: 'en', l: '🇬🇧 Inglés' },
              { v: 'fr', l: '🇫🇷 Francés' },
              { v: 'de', l: '🇩🇪 Alemán' },
              { v: 'pt', l: '🇧🇷 Portugués' },
            ].map((opt) => (
              <button
                key={opt.v}
                onClick={() => {
                  setPdLang(opt.v);
                  setPdPage(1);
                }}
                style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  border: '1px solid',
                  borderColor: pdLang === opt.v ? 'var(--accent)' : 'var(--border-color)',
                  background: pdLang === opt.v ? 'rgba(37,99,235,0.09)' : 'transparent',
                  color: pdLang === opt.v ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {opt.l}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* ── Body ── */}
      <div className="page-body">
        {sourceTab === 'comunidad' ? (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                Cargando biblioteca...
              </div>
            ) : docs.length === 0 ? (
              <div className="empty-state" style={{ padding: 60 }}>
                <div className="empty-state-icon">{BookOpen({ size: 48 })}</div>
                <h3>No se encontraron recursos</h3>
                <p>
                  {search || category
                    ? 'Intenta con otros términos o categoría'
                    : 'Sé el primero en compartir un documento desde tus asignaturas'}
                </p>
                {(search || category) && (
                  <button
                    className="btn btn-secondary"
                    style={{ marginTop: 12 }}
                    onClick={() => {
                      setSearchInput('');
                      setSearch('');
                      setCategory('');
                    }}
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : view === 'grid' ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: 16,
                }}
              >
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Anterior
                </button>
                <span style={{ alignSelf: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                  Pág. {page} / {pages_total}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page >= pages_total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        ) : sourceTab === 'academicos' ? (
          /* ══ ACADÉMICOS (OpenStax) ══ */
          <>
            {/* Info banner */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                padding: '12px 16px',
                background: 'rgba(139,92,246,0.06)',
                border: '1px solid rgba(139,92,246,0.15)',
                borderRadius: 10,
                marginBottom: 18,
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>🎓</span>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: 2,
                  }}
                >
                  OpenStax — Textbooks universitarios gratuitos
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Libros de Cálculo, Física, Química, Biología, Economía y más. Licencia Creative
                  Commons — lectura gratuita dentro de Conniku.
                </div>
              </div>
            </div>

            {acLoading ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                Buscando en OpenStax...
              </div>
            ) : acDocs.length === 0 ? (
              <div className="empty-state" style={{ padding: 60 }}>
                <div className="empty-state-icon">📖</div>
                <h3>Sin resultados</h3>
                <p>
                  {search
                    ? 'No se encontraron textbooks con ese término'
                    : 'Explora textbooks universitarios buscando un tema'}
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: 16,
                }}
              >
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

            {/* Paginación Académicos */}
            {acTotal > 24 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={acPage === 1}
                  onClick={() => setAcPage((p) => p - 1)}
                >
                  ← Anterior
                </button>
                <span style={{ alignSelf: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                  Página {acPage} / {Math.ceil(acTotal / 24)}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={acDocs.length < 24}
                  onClick={() => setAcPage((p) => p + 1)}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        ) : (
          /* ══ DOMINIO PÚBLICO ══ */
          <>
            {/* Info banner */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                padding: '12px 16px',
                background: 'rgba(37,99,235,0.06)',
                border: '1px solid rgba(37,99,235,0.15)',
                borderRadius: 10,
                marginBottom: 18,
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>🌐</span>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: 2,
                  }}
                >
                  Project Gutenberg — 70.000+ libros gratuitos
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Libros clásicos sin derechos de autor. Haz clic en un libro para leerlo
                  directamente desde Conniku.
                </div>
              </div>
            </div>

            {pdLoading ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                Buscando en Project Gutenberg...
              </div>
            ) : pdDocs.length === 0 ? (
              <div className="empty-state" style={{ padding: 60 }}>
                <div className="empty-state-icon">📖</div>
                <h3>Sin resultados</h3>
                <p>Intenta con otro término de búsqueda o cambia el idioma</p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: 16,
                }}
              >
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

            {/* Paginación Gutenberg */}
            {(pdTotal > 32 || pdPage > 1) && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={pdPage === 1}
                  onClick={() => setPdPage((p) => p - 1)}
                >
                  ← Anterior
                </button>
                <span style={{ alignSelf: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                  Página {pdPage}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={pdDocs.length < 32}
                  onClick={() => setPdPage((p) => p + 1)}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>

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
                          : 'rgba(37,99,235,0.12)',
                      color: selected.source_type === 'user_shared' ? '#10B981' : '#2563EB',
                    }}
                  >
                    {selected.source_type === 'user_shared' ? 'Comunidad' : 'Biblioteca Online'}
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
                  <button
                    className="btn btn-secondary"
                    onClick={() => openCloneModal(selected)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    {ChevronRight({ size: 14 })} Agregar a mi asignatura
                  </button>
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

            {cloneSuccess ? (
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
          {/* Toolbar */}
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
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{reading.title}</span>
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
        </div>
      )}
    </>
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
  const catColor = getCategoryColor(doc.category);
  const catIcon = CATEGORIES.find((c) => c.value === doc.category)?.icon || '📖';
  return (
    <div
      className="u-card"
      style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
      onClick={onOpen}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Cover */}
      <div
        style={{
          height: 130,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${catColor}15, ${catColor}30)`,
          borderBottom: '1px solid var(--border-color)',
          position: 'relative',
        }}
      >
        {doc.cover_url ? (
          <img
            src={doc.cover_url}
            alt=""
            style={{ height: '100%', width: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 34 }}>{catIcon}</span>
            {doc.pages && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                {doc.pages} págs.
              </div>
            )}
          </div>
        )}
        <span
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 7px',
            borderRadius: 8,
            background:
              doc.source_type === 'user_shared'
                ? 'rgba(16,185,129,0.9)'
                : doc.source_type === 'openstax'
                  ? 'rgba(139,92,246,0.9)'
                  : 'rgba(37,99,235,0.9)',
            color: '#fff',
          }}
        >
          {doc.source_type === 'user_shared'
            ? 'Comunidad'
            : doc.source_type === 'openstax'
              ? 'OpenStax'
              : 'Online'}
        </span>
      </div>

      <div style={{ padding: 14 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 6,
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.35,
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {doc.title}
          </h4>
          {doc.source_type === 'user_shared' && (
            <button
              onClick={onSave}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 2,
                flexShrink: 0,
              }}
            >
              <Star
                size={15}
                fill={doc.is_saved ? '#F59E0B' : 'none'}
                color={doc.is_saved ? '#F59E0B' : 'var(--text-muted)'}
              />
            </button>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
          {doc.author}
        </div>
        {doc.rating !== undefined && doc.rating > 0 && (
          <div style={{ fontSize: 11, color: '#F59E0B', marginTop: 6 }}>
            {stars(doc.rating)} <span style={{ color: 'var(--text-muted)' }}>{doc.rating}</span>
          </div>
        )}
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
  const catColor = getCategoryColor(doc.category);
  return (
    <div
      className="u-card"
      style={{ padding: 14, cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'center' }}
      onClick={onOpen}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 8,
          flexShrink: 0,
          fontSize: 22,
          background: `${catColor}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {catIcon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 13,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {doc.title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          {doc.author}
          {doc.year ? ` · ${doc.year}` : ''}
          {doc.pages ? ` · ${doc.pages} págs.` : ''}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {doc.rating !== undefined && doc.rating > 0 && (
          <span style={{ fontSize: 12, color: '#F59E0B' }}>★ {doc.rating}</span>
        )}
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 8,
            background:
              doc.source_type === 'user_shared'
                ? 'rgba(16,185,129,0.12)'
                : doc.source_type === 'openstax'
                  ? 'rgba(139,92,246,0.12)'
                  : 'rgba(37,99,235,0.12)',
            color:
              doc.source_type === 'user_shared'
                ? '#10B981'
                : doc.source_type === 'openstax'
                  ? '#8B5CF6'
                  : '#2563EB',
          }}
        >
          {doc.source_type === 'user_shared'
            ? 'Comunidad'
            : doc.source_type === 'openstax'
              ? 'OpenStax'
              : 'Online'}
        </span>
        {doc.source_type === 'user_shared' && (
          <button
            onClick={onSave}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <Star
              size={14}
              fill={doc.is_saved ? '#F59E0B' : 'none'}
              color={doc.is_saved ? '#F59E0B' : 'var(--text-muted)'}
            />
          </button>
        )}
      </div>
    </div>
  );
}
