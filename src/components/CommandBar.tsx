import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search,
  Brain,
  BookOpen,
  FileText,
  Settings,
  User,
  Home,
  Calendar,
  MessageCircle,
  Users,
  Map,
  ClipboardList,
  Sparkles,
  Target,
  Compass,
} from './Icons';

interface CommandItem {
  id: string;
  label: string;
  /** Searchable keywords (accent-free, lowercase) */
  keywords: string;
  icon: React.ReactNode;
  group: 'herramientas' | 'paginas';
  action: string; // path to navigate
}

interface CommandBarProps {
  onNavigate: (path: string) => void;
}

/* ── Accent-insensitive normaliser ─────────────────────── */
function normalise(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/* ── Static command definitions ────────────────────────── */
const COMMANDS: CommandItem[] = [
  // ── Herramientas ──
  {
    id: 'quiz',
    label: 'Generar Quiz',
    keywords: 'generar quiz examen prueba test evaluacion',
    icon: <ClipboardList size={18} />,
    group: 'herramientas',
    action: '/quizzes',
  },
  {
    id: 'flashcards',
    label: 'Crear Flashcards',
    keywords: 'crear flashcards tarjetas memoria repaso',
    icon: <Sparkles size={18} />,
    group: 'herramientas',
    action: '/study-paths',
  },
  {
    id: 'resumen',
    label: 'Generar Resumen',
    keywords: 'generar resumen resumir documento apuntes notas',
    icon: <FileText size={18} />,
    group: 'herramientas',
    action: '/ai-workflows',
  },
  {
    id: 'mapa',
    label: 'Mapa Conceptual',
    keywords: 'mapa conceptual diagrama esquema visual',
    icon: <Map size={18} />,
    group: 'herramientas',
    action: '/ai-workflows',
  },
  {
    id: 'plan',
    label: 'Plan de Estudio',
    keywords: 'plan estudio planificar organizacion calendario',
    icon: <Target size={18} />,
    group: 'herramientas',
    action: '/study-paths',
  },
  {
    id: 'biblioteca',
    label: 'Biblioteca Virtual',
    keywords: 'biblioteca virtual libros leer buscar documentos',
    icon: <BookOpen size={18} />,
    group: 'herramientas',
    action: '/biblioteca',
  },

  // ── Paginas ──
  {
    id: 'perfil',
    label: 'Mi Perfil',
    keywords: 'mi perfil cuenta usuario datos',
    icon: <User size={18} />,
    group: 'paginas',
    action: '/my-profile',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    keywords: 'dashboard inicio panel principal',
    icon: <Home size={18} />,
    group: 'paginas',
    action: '/dashboard',
  },
  {
    id: 'mensajes',
    label: 'Mensajes',
    keywords: 'mensajes chat conversaciones inbox',
    icon: <MessageCircle size={18} />,
    group: 'paginas',
    action: '/messages',
  },
  {
    id: 'amigos',
    label: 'Amigos',
    keywords: 'amigos contactos conexiones red social',
    icon: <Users size={18} />,
    group: 'paginas',
    action: '/friends',
  },
  {
    id: 'calendario',
    label: 'Calendario',
    keywords: 'calendario eventos fechas agenda horario',
    icon: <Calendar size={18} />,
    group: 'paginas',
    action: '/calendar',
  },
  {
    id: 'comunidades',
    label: 'Comunidades',
    keywords: 'comunidades grupos foros comunidad',
    icon: <Compass size={18} />,
    group: 'paginas',
    action: '/communities',
  },
  {
    id: 'suscripcion',
    label: 'Suscripcion',
    keywords: 'suscripcion plan premium pago facturacion',
    icon: <Settings size={18} />,
    group: 'paginas',
    action: '/subscription',
  },
  {
    id: 'soporte',
    label: 'Soporte',
    keywords: 'soporte ayuda contacto problema reporte',
    icon: <Brain size={18} />,
    group: 'paginas',
    action: '/soporte',
  },
];

const GROUP_LABELS: Record<string, string> = {
  herramientas: 'Herramientas',
  paginas: 'Paginas',
};

export default function CommandBar({ onNavigate }: CommandBarProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /* ── Filtered results ─────────────────────────────────── */
  const filtered = useMemo(() => {
    if (!query.trim()) return COMMANDS;
    const q = normalise(query);
    return COMMANDS.filter((cmd) => normalise(cmd.label).includes(q) || cmd.keywords.includes(q));
  }, [query]);

  /* ── Flat list for arrow navigation ───────────────────── */
  const flatItems = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const item of filtered) {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    }
    const flat: CommandItem[] = [];
    for (const g of ['herramientas', 'paginas']) {
      if (groups[g]) flat.push(...groups[g]);
    }
    return flat;
  }, [filtered]);

  /* ── Reset selection when results change ──────────────── */
  useEffect(() => {
    setSelectedIndex(0);
  }, [flatItems]);

  /* ── Scroll selected item into view ───────────────────── */
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector('[data-selected="true"]');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  /* ── Execute command ──────────────────────────────────── */
  const execute = useCallback(
    (item: CommandItem) => {
      setOpen(false);
      setQuery('');
      onNavigate(item.action);
    },
    [onNavigate]
  );

  /* ── Global Cmd+K / Ctrl+K listener ──────────────────── */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => {
          if (prev) {
            setQuery('');
            return false;
          }
          return true;
        });
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /* ── Focus input when opened ─────────────────────────── */
  useEffect(() => {
    if (open) {
      // Small delay to let the animation start
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  /* ── Keyboard nav inside the palette ─────────────────── */
  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      setQuery('');
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[selectedIndex]) execute(flatItems[selectedIndex]);
    }
  }

  if (!open) return null;

  /* ── Group results for rendering ─────────────────────── */
  const grouped: { group: string; items: CommandItem[] }[] = [];
  const seen = new Set<string>();
  for (const item of flatItems) {
    if (!seen.has(item.group)) {
      seen.add(item.group);
      grouped.push({
        group: item.group,
        items: flatItems.filter((i) => i.group === item.group),
      });
    }
  }

  /* ── Get flat index for a specific item ──────────────── */
  let runningIdx = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 9998,
          animation: 'cmdbar-fade-in 0.15s ease-out',
        }}
        onClick={() => {
          setOpen(false);
          setQuery('');
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 560,
          maxHeight: '60vh',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.25)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'cmdbar-slide-down 0.2s ease-out',
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <Search size={20} color="var(--text-muted)" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Buscar paginas, herramientas..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 16,
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
            }}
          />
          <kbd
            style={{
              padding: '2px 8px',
              borderRadius: 6,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-muted)',
              fontSize: 11,
              fontFamily: 'inherit',
              lineHeight: '18px',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div
          ref={listRef}
          style={{
            overflowY: 'auto',
            padding: '8px',
          }}
        >
          {flatItems.length === 0 && (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 14,
              }}
            >
              No se encontraron resultados
            </div>
          )}

          {grouped.map((g) => {
            const groupContent = (
              <div key={g.group}>
                <div
                  style={{
                    padding: '8px 12px 4px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {GROUP_LABELS[g.group] || g.group}
                </div>
                {g.items.map((item) => {
                  const idx = runningIdx++;
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      data-selected={isSelected}
                      onClick={() => execute(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        background: isSelected ? 'var(--bg-secondary)' : 'transparent',
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                        transition: 'background 0.1s, color 0.1s',
                      }}
                    >
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: isSelected ? '#4F46E5' : 'var(--bg-tertiary)',
                          color: isSelected ? '#fff' : 'var(--text-secondary)',
                          flexShrink: 0,
                          transition: 'background 0.1s, color 0.1s',
                        }}
                      >
                        {item.icon}
                      </span>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          flex: 1,
                        }}
                      >
                        {item.label}
                      </span>
                      {isSelected && (
                        <kbd
                          style={{
                            padding: '1px 6px',
                            borderRadius: 4,
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-muted)',
                            fontSize: 10,
                            fontFamily: 'inherit',
                            lineHeight: '16px',
                          }}
                        >
                          Enter
                        </kbd>
                      )}
                    </div>
                  );
                })}
              </div>
            );
            return groupContent;
          })}
        </div>

        {/* Footer hint */}
        <div
          style={{
            padding: '8px 18px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 11,
            color: 'var(--text-muted)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <kbd
              style={{
                padding: '1px 4px',
                borderRadius: 3,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                fontSize: 10,
                lineHeight: '14px',
              }}
            >
              ↑↓
            </kbd>
            navegar
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <kbd
              style={{
                padding: '1px 4px',
                borderRadius: 3,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                fontSize: 10,
                lineHeight: '14px',
              }}
            >
              ↵
            </kbd>
            abrir
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <kbd
              style={{
                padding: '1px 4px',
                borderRadius: 3,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                fontSize: 10,
                lineHeight: '14px',
              }}
            >
              esc
            </kbd>
            cerrar
          </span>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes cmdbar-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cmdbar-slide-down {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </>
  );
}
