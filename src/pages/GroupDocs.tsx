import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../services/auth';
import { api } from '../services/api';
import {
  FileText,
  Plus,
  Users,
  Search,
  Trash2,
  Pencil,
  Check,
  X,
  Clock,
  Crown,
} from '../components/Icons';

interface Props {
  onNavigate: (path: string) => void;
}

interface CollabDoc {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  owner: any;
  status: string;
  university: string;
  career: string;
  courseName: string;
  color: string;
  icon: string;
  members: any[];
  createdAt: string;
  updatedAt: string;
}

const COLORS = [
  '#2D62C8',
  '#E53E3E',
  '#38A169',
  '#D69E2E',
  '#805AD5',
  '#DD6B20',
  '#319795',
  '#E53E84',
];

export default function GroupDocs({ onNavigate }: Props) {
  const { user } = useAuth();
  const [docs, setDocs] = useState<CollabDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseName, setCourseName] = useState('');
  const [color, setColor] = useState('#2D62C8');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<any>(null);

  // Edit/delete
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    try {
      const data = await api.collabList();
      setDocs(data);
    } catch (err) {
      console.error('Error loading docs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || creating) return;
    setCreating(true);
    try {
      await api.collabCreate({
        title: title.trim(),
        description: description.trim(),
        courseName: courseName.trim(),
        color,
        memberIds: selectedMembers.map((m) => m.id),
      });
      setShowCreate(false);
      setTitle('');
      setDescription('');
      setCourseName('');
      setColor('#2D62C8');
      setSelectedMembers([]);
      await loadDocs();
    } catch (err: any) {
      alert(err.message || 'Error al crear documento');
    } finally {
      setCreating(false);
    }
  };

  const handleSearchUsers = (q: string) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await api.collabSearchUsers(q.trim());
        // Filter out already selected
        const selectedIds = new Set(selectedMembers.map((m) => m.id));
        setSearchResults(results.filter((r: any) => !selectedIds.has(r.id)));
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 300);
  };

  const addMember = (u: any) => {
    setSelectedMembers((prev) => [...prev, u]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeMember = (id: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleDelete = async (id: string) => {
    if (deleting) return;
    setDeleting(id);
    try {
      await api.collabDelete(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    } finally {
      setDeleting(null);
    }
  };

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      await api.collabUpdate(id, { title: editTitle.trim() });
      setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, title: editTitle.trim() } : d)));
      setEditingId(null);
    } catch (err: any) {
      alert(err.message || 'Error al renombrar');
    }
  };

  const timeAgo = (iso: string) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `hace ${days}d`;
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Trabajos Grupales
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Documentos colaborativos en tiempo real
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: '#2D62C8',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {Plus()} Nuevo documento
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowCreate(false)}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 500,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 20px',
              }}
            >
              Nuevo Documento Grupal
            </h2>

            {/* Title */}
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: 6,
              }}
            >
              Titulo *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Informe Final - Economia"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 14,
                marginBottom: 16,
                boxSizing: 'border-box',
              }}
            />

            {/* Description */}
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: 6,
              }}
            >
              Descripcion
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el trabajo grupal..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 14,
                marginBottom: 16,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />

            {/* Course */}
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: 6,
              }}
            >
              Asignatura
            </label>
            <input
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="Ej: Macroeconomia II"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 14,
                marginBottom: 16,
                boxSizing: 'border-box',
              }}
            />

            {/* Color */}
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: 6,
              }}
            >
              Color
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: color === c ? '3px solid var(--text-primary)' : '2px solid transparent',
                    background: c,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                />
              ))}
            </div>

            {/* Members */}
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: 6,
              }}
            >
              Agregar miembros
            </label>

            {/* Selected members */}
            {selectedMembers.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {selectedMembers.map((m) => (
                  <span
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      borderRadius: 20,
                      background: 'var(--accent-muted)',
                      color: 'var(--accent)',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {m.firstName} {m.lastName}
                    <button
                      onClick={() => removeMember(m.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        color: 'var(--accent)',
                        display: 'flex',
                      }}
                    >
                      {X({ size: 14 })}
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search input */}
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <input
                value={searchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
                placeholder="Buscar por nombre o email..."
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              >
                {Search({ size: 16 })}
              </span>

              {/* Dropdown results */}
              {searchResults.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    marginTop: 4,
                    maxHeight: 200,
                    overflowY: 'auto',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  {searchResults.map((r: any) => (
                    <button
                      key={r.id}
                      onClick={() => addMember(r)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: 'var(--text-primary)',
                        fontSize: 13,
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#2D62C8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: 13,
                          fontWeight: 700,
                          flexShrink: 0,
                          overflow: 'hidden',
                        }}
                      >
                        {r.avatar ? (
                          <img
                            src={r.avatar}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          (r.firstName?.[0] || '?').toUpperCase()
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {r.firstName} {r.lastName}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          @{r.username}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!title.trim() || creating}
                style={{
                  padding: '10px 24px',
                  borderRadius: 8,
                  border: 'none',
                  background: title.trim() ? '#2D62C8' : '#555',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: title.trim() ? 'pointer' : 'not-allowed',
                  opacity: creating ? 0.7 : 1,
                }}
              >
                {creating ? 'Creando...' : 'Crear documento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          Cargando documentos...
        </div>
      )}

      {/* Empty state */}
      {!loading && docs.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--bg-secondary)',
            borderRadius: 16,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>{FileText({ size: 48 })}</div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: '0 0 8px',
            }}
          >
            Sin documentos grupales
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 20px' }}>
            Crea tu primer documento colaborativo e invita a tus companeros
          </p>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding: '10px 24px',
              borderRadius: 10,
              border: 'none',
              background: '#2D62C8',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {Plus()} Crear documento
          </button>
        </div>
      )}

      {/* Document grid */}
      {!loading && docs.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280, 1fr))',
            gap: 16,
          }}
        >
          {docs.map((doc) => (
            <div
              key={doc.id}
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: 14,
                border: '1px solid var(--border)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onClick={() => onNavigate(`/group-docs/${doc.id}`)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = '';
                (e.currentTarget as HTMLElement).style.boxShadow = '';
              }}
            >
              {/* Color bar */}
              <div style={{ height: 4, background: doc.color }} />

              <div style={{ padding: 16 }}>
                {/* Title row */}
                <div
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: doc.color + '20',
                      color: doc.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {FileText({ size: 20 })}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editingId === doc.id ? (
                      <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRename(doc.id)}
                          autoFocus
                          style={{
                            flex: 1,
                            padding: '4px 8px',
                            borderRadius: 6,
                            border: '1px solid var(--border)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            fontSize: 14,
                          }}
                        />
                        <button
                          onClick={() => handleRename(doc.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#38A169',
                            padding: 2,
                          }}
                        >
                          {Check({ size: 16 })}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            padding: 2,
                          }}
                        >
                          {X({ size: 16 })}
                        </button>
                      </div>
                    ) : (
                      <h3
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {doc.title}
                      </h3>
                    )}
                    {doc.courseName && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {doc.courseName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {doc.description && (
                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      margin: '0 0 12px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {doc.description}
                  </p>
                )}

                {/* Members */}
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {/* Avatar stack */}
                    <div style={{ display: 'flex' }}>
                      {doc.members.slice(0, 4).map((m, i) => (
                        <div
                          key={m.id}
                          title={`${m.user?.firstName || ''} ${m.user?.lastName || ''}`}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: m.role === 'owner' ? doc.color : '#666',
                            border: '2px solid var(--bg-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: 10,
                            fontWeight: 700,
                            marginLeft: i > 0 ? -8 : 0,
                            position: 'relative',
                            zIndex: 4 - i,
                            overflow: 'hidden',
                          }}
                        >
                          {m.user?.avatar ? (
                            <img
                              src={m.user.avatar}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            (m.user?.firstName?.[0] || '?').toUpperCase()
                          )}
                        </div>
                      ))}
                      {doc.members.length > 4 && (
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: 'var(--bg-primary)',
                            border: '2px solid var(--bg-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 9,
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            marginLeft: -8,
                          }}
                        >
                          +{doc.members.length - 4}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {doc.members.length} {doc.members.length === 1 ? 'miembro' : 'miembros'}
                    </span>
                  </div>

                  {/* Time + actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {timeAgo(doc.updatedAt)}
                    </span>
                    {doc.ownerId === user?.id && (
                      <div style={{ display: 'flex', gap: 2 }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setEditingId(doc.id);
                            setEditTitle(doc.title);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            padding: 4,
                          }}
                          title="Renombrar"
                        >
                          {Pencil({ size: 14 })}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Eliminar este documento?')) handleDelete(doc.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#E53E3E',
                            padding: 4,
                          }}
                          title="Eliminar"
                        >
                          {Trash2({ size: 14 })}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
