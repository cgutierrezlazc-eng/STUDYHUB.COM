import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { api } from '../services/api';
import {
  Users,
  Clock,
  ChevronLeft,
  Plus,
  Trash2,
  X,
  Search,
  Check,
  Crown,
  MessageSquare,
  Send,
  Download,
} from '../components/Icons';
import TierGate from '../components/TierGate';

const CollabEditor = lazy(() => import('../components/CollabEditor'));

interface Props {
  onNavigate: (path: string) => void;
}

export default function GroupDocEditor({ onNavigate }: Props) {
  const { docId } = useParams<{ docId: string }>();
  const { user } = useAuth();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Members panel
  const [showMembers, setShowMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const searchTimeout = useRef<any>(null);

  // Versions
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [savingVersion, setSavingVersion] = useState(false);

  // Chat
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatPollRef = useRef<any>(null);

  // Auto-save
  const saveTimeout = useRef<any>(null);
  const pendingContent = useRef<string>('');

  useEffect(() => {
    if (docId) loadDoc();
  }, [docId]);

  const loadDoc = async () => {
    if (!docId) return;
    try {
      const data = await api.collabGet(docId);
      setDoc(data);
      pendingContent.current = data.content || '';
    } catch (err: any) {
      setError(err.message || 'Error al cargar documento');
    } finally {
      setLoading(false);
    }
  };

  const handleContentUpdate = useCallback(
    (html: string) => {
      pendingContent.current = html;
      // Auto-save after 2 seconds of inactivity
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        saveContent(html);
      }, 2000);
    },
    [docId]
  );

  const saveContent = async (html: string) => {
    if (!docId || saving) return;
    setSaving(true);
    try {
      await api.collabUpdate(docId, { content: html });
      setLastSaved(new Date());
    } catch (err) {
      console.error('Auto-save error:', err);
    } finally {
      setSaving(false);
    }
  };

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      if (pendingContent.current && docId) {
        api.collabUpdate(docId, { content: pendingContent.current }).catch(() => {});
      }
    };
  }, [docId]);

  // Members
  const handleSearchUsers = (q: string) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await api.collabSearchUsers(q.trim());
        const memberIds = new Set((doc?.members || []).map((m: any) => m.userId));
        setSearchResults(results.filter((r: any) => !memberIds.has(r.id)));
      } catch {
        setSearchResults([]);
      }
    }, 300);
  };

  const handleAddMember = async (userId: string) => {
    if (!docId) return;
    try {
      await api.collabAddMember(docId, { userId, role: 'editor' });
      setSearchQuery('');
      setSearchResults([]);
      await loadDoc();
    } catch (err: any) {
      alert(err.message || 'Error al agregar miembro');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!docId) return;
    try {
      await api.collabRemoveMember(docId, userId);
      await loadDoc();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar miembro');
    }
  };

  const handleChangeRole = async (userId: string, role: string) => {
    if (!docId) return;
    try {
      await api.collabUpdateRole(docId, userId, { role });
      await loadDoc();
    } catch (err: any) {
      alert(err.message || 'Error al cambiar rol');
    }
  };

  // Versions
  const loadVersions = async () => {
    if (!docId) return;
    try {
      const data = await api.collabVersions(docId);
      setVersions(data);
    } catch {
      setVersions([]);
    }
  };

  const handleSaveVersion = async () => {
    if (!docId || savingVersion) return;
    // Save current content first
    if (pendingContent.current) {
      await saveContent(pendingContent.current);
    }
    setSavingVersion(true);
    try {
      await api.collabSaveVersion(docId);
      await loadVersions();
    } catch (err: any) {
      alert(err.message || 'Error al guardar version');
    } finally {
      setSavingVersion(false);
    }
  };

  // Chat functions
  const loadChat = async () => {
    if (!docId) return;
    try {
      const msgs = await api.collabChatMessages(docId);
      setChatMessages(msgs);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      /* ignore */
    }
  };

  const handleSendChat = async () => {
    if (!docId || !chatInput.trim() || sendingChat) return;
    const content = chatInput.trim();
    setChatInput('');
    setSendingChat(true);
    try {
      const msg = await api.collabSendChat(docId, content);
      setChatMessages((prev) => [...prev, msg]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: any) {
      setChatInput(content);
      alert(err.message || 'Error al enviar');
    } finally {
      setSendingChat(false);
    }
  };

  // Poll chat when open (WS also pushes, but polling is safety net)
  useEffect(() => {
    if (showChat && docId) {
      loadChat();
      chatPollRef.current = setInterval(loadChat, 10000);
    }
    return () => {
      if (chatPollRef.current) clearInterval(chatPollRef.current);
    };
  }, [showChat, docId]);

  const isOwner = doc?.ownerId === user?.id;
  const myRole = doc?.members?.find((m: any) => m.userId === user?.id)?.role || 'viewer';
  const canEdit = isOwner || myRole === 'editor' || myRole === 'owner';

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--text-muted)',
        }}
      >
        Cargando documento...
      </div>
    );
  }

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
        }}
      >
        <p style={{ color: '#E53E3E', fontSize: 14 }}>{error}</p>
        <button
          onClick={() => onNavigate('/group-docs')}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: 'none',
            background: '#2D62C8',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Volver a Trabajos Grupales
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          flexShrink: 0,
        }}
      >
        {/* Back */}
        <button
          onClick={() => onNavigate('/group-docs')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            display: 'flex',
            padding: 4,
          }}
          title="Volver"
        >
          {ChevronLeft({ size: 20 })}
        </button>

        {/* Color dot + title */}
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: doc?.color || '#2D62C8',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
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
            {doc?.title}
          </h2>
          {doc?.courseName && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doc.courseName}</span>
          )}
        </div>

        {/* Save status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          {saving ? (
            <span>Guardando...</span>
          ) : lastSaved ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {Check({ size: 14 })} Guardado
            </span>
          ) : null}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4 }}>
          {/* Save version */}
          {/* Export */}
          <div style={{ position: 'relative' }}>
            <TierGate feature="can_export" onNavigate={onNavigate}>
              <button
                onClick={() => {
                  const menu = document.getElementById('export-menu');
                  if (menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {Download({ size: 14 })} Exportar
              </button>
            </TierGate>
            <div
              id="export-menu"
              style={{
                display: 'none',
                position: 'absolute',
                top: '100%',
                right: 0,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                marginTop: 4,
                zIndex: 20,
                minWidth: 160,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              <TierGate feature="can_download_docs" onNavigate={onNavigate}>
                <button
                  onClick={async () => {
                    document.getElementById('export-menu')!.style.display = 'none';
                    if (pendingContent.current && docId) await saveContent(pendingContent.current);
                    const res = await api.collabExportPdf(docId!);
                    if (res.ok) {
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${doc?.title || 'documento'}.pdf`;
                      a.click();
                      URL.revokeObjectURL(url);
                    } else {
                      alert('Error exportando PDF');
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  Descargar PDF
                </button>
              </TierGate>
              <TierGate feature="can_download_docs" onNavigate={onNavigate}>
                <button
                  onClick={async () => {
                    document.getElementById('export-menu')!.style.display = 'none';
                    if (pendingContent.current && docId) await saveContent(pendingContent.current);
                    const res = await api.collabExportDocx(docId!);
                    if (res.ok) {
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${doc?.title || 'documento'}.docx`;
                      a.click();
                      URL.revokeObjectURL(url);
                    } else {
                      alert('Error exportando DOCX');
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  Descargar Word
                </button>
              </TierGate>
            </div>
          </div>

          {canEdit && (
            <button
              onClick={handleSaveVersion}
              disabled={savingVersion}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: 12,
                cursor: 'pointer',
              }}
              title="Guardar version"
            >
              {Clock({ size: 14 })} Version
            </button>
          )}

          {/* Versions */}
          <button
            onClick={() => {
              setShowVersions(!showVersions);
              if (!showVersions) {
                loadVersions();
                setShowMembers(false);
                setShowChat(false);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: showVersions ? 'var(--accent-muted)' : 'transparent',
              color: showVersions ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {Clock({ size: 14 })} Historial
          </button>

          {/* Chat */}
          <button
            onClick={() => {
              setShowChat(!showChat);
              if (!showChat) {
                setShowMembers(false);
                setShowVersions(false);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: showChat ? 'var(--accent-muted)' : 'transparent',
              color: showChat ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {MessageSquare({ size: 14 })} Chat
          </button>

          {/* Members */}
          <button
            onClick={() => {
              setShowMembers(!showMembers);
              if (!showMembers) {
                setShowChat(false);
                setShowVersions(false);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: showMembers ? 'var(--accent-muted)' : 'transparent',
              color: showMembers ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {Users({ size: 14 })} {doc?.members?.length || 0}
          </button>
        </div>
      </div>

      {/* Main area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Editor */}
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg-primary)' }}>
          <Suspense
            fallback={
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                Cargando editor...
              </div>
            }
          >
            <CollabEditor
              content={doc?.content || ''}
              onUpdate={handleContentUpdate}
              editable={canEdit}
              docId={docId}
              userName={user ? `${user.firstName} ${user.lastName}` : undefined}
              userColor={doc?.color || '#2D62C8'}
            />
          </Suspense>
        </div>

        {/* Side panels */}
        {(showMembers || showVersions || showChat) && (
          <div
            style={{
              width: 300,
              borderLeft: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {/* Members panel */}
            {showMembers && (
              <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                  }}
                >
                  <h3
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    Miembros ({doc?.members?.length || 0})
                  </h3>
                  <button
                    onClick={() => setShowMembers(false)}
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

                {/* Add member search */}
                {(isOwner || myRole === 'owner') && (
                  <div style={{ position: 'relative', marginBottom: 16 }}>
                    <input
                      value={searchQuery}
                      onChange={(e) => handleSearchUsers(e.target.value)}
                      placeholder="Agregar miembro..."
                      style={{
                        width: '100%',
                        padding: '8px 10px 8px 32px',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: 13,
                        boxSizing: 'border-box',
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        left: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {Search({ size: 14 })}
                    </span>

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
                          maxHeight: 180,
                          overflowY: 'auto',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }}
                      >
                        {searchResults.map((r: any) => (
                          <button
                            key={r.id}
                            onClick={() => handleAddMember(r.id)}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '8px 10px',
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              textAlign: 'left',
                              color: 'var(--text-primary)',
                              fontSize: 12,
                            }}
                          >
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: '#2D62C8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: 11,
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
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                @{r.username}
                              </div>
                            </div>
                            <span style={{ marginLeft: 'auto', color: '#38A169' }}>
                              {Plus({ size: 14 })}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Member list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {doc?.members?.map((m: any) => (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: 'var(--bg-primary)',
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: m.role === 'owner' ? doc.color : '#666',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 700,
                          flexShrink: 0,
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
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}
                        >
                          {m.user?.firstName} {m.user?.lastName}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {m.role === 'owner' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                              {Crown({ size: 10 })} Creador
                            </span>
                          )}
                          {m.role === 'editor' && 'Editor'}
                          {m.role === 'viewer' && 'Solo lectura'}
                        </div>
                      </div>

                      {/* Actions (only owner can manage) */}
                      {isOwner && m.role !== 'owner' && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <select
                            value={m.role}
                            onChange={(e) => handleChangeRole(m.userId, e.target.value)}
                            style={{
                              padding: '2px 4px',
                              borderRadius: 4,
                              border: '1px solid var(--border)',
                              background: 'var(--bg-secondary)',
                              color: 'var(--text-secondary)',
                              fontSize: 10,
                              cursor: 'pointer',
                            }}
                          >
                            <option value="editor">Editor</option>
                            <option value="viewer">Solo lectura</option>
                          </select>
                          <button
                            onClick={() => handleRemoveMember(m.userId)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#E53E3E',
                              padding: 2,
                            }}
                            title="Eliminar miembro"
                          >
                            {Trash2({ size: 14 })}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Versions panel */}
            {showVersions && !showMembers && (
              <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                  }}
                >
                  <h3
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    Historial de versiones
                  </h3>
                  <button
                    onClick={() => setShowVersions(false)}
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

                {versions.length === 0 ? (
                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      textAlign: 'center',
                      padding: 20,
                    }}
                  >
                    Sin versiones guardadas. Usa el boton "Version" para crear un punto de
                    restauracion.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {versions.map((v) => (
                      <div
                        key={v.id}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span
                            style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}
                          >
                            Version {v.versionNumber}
                          </span>
                          <button
                            onClick={async () => {
                              try {
                                const full = await api.collabGetVersion(docId!, v.id);
                                if (
                                  confirm(
                                    'Restaurar esta version? El contenido actual se reemplazara.'
                                  )
                                ) {
                                  await api.collabUpdate(docId!, { content: full.content });
                                  loadDoc();
                                }
                              } catch (err: any) {
                                alert(err.message || 'Error');
                              }
                            }}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              border: '1px solid var(--border)',
                              background: 'transparent',
                              color: 'var(--text-secondary)',
                              fontSize: 11,
                              cursor: 'pointer',
                            }}
                          >
                            Restaurar
                          </button>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          {v.createdBy?.firstName} {v.createdBy?.lastName} &middot;{' '}
                          {new Date(v.createdAt).toLocaleString('es-CL')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Chat panel */}
            {showChat && (
              <div
                style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <h3
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    Chat del documento
                  </h3>
                  <button
                    onClick={() => setShowChat(false)}
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

                {/* Messages */}
                <div
                  style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '12px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  {chatMessages.length === 0 && (
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        textAlign: 'center',
                        padding: 20,
                      }}
                    >
                      Sin mensajes. Inicia la conversacion sobre este documento.
                    </p>
                  )}
                  {chatMessages.map((msg) => {
                    const isMe = msg.userId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start',
                        }}
                      >
                        {!isMe && (
                          <span
                            style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}
                          >
                            {msg.user?.firstName}
                          </span>
                        )}
                        <div
                          style={{
                            maxWidth: '85%',
                            padding: '8px 12px',
                            borderRadius: 12,
                            background: isMe ? '#2D62C8' : 'var(--bg-primary)',
                            color: isMe ? '#fff' : 'var(--text-primary)',
                            fontSize: 13,
                            lineHeight: 1.4,
                            wordBreak: 'break-word',
                          }}
                        >
                          {msg.content}
                        </div>
                        <span style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                          {msg.createdAt
                            ? new Date(msg.createdAt).toLocaleTimeString('es-CL', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    padding: '10px 12px',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChat();
                      }
                    }}
                    placeholder="Escribe un mensaje..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={!chatInput.trim() || sendingChat}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      border: 'none',
                      background: chatInput.trim() ? '#2D62C8' : 'var(--bg-primary)',
                      color: chatInput.trim() ? '#fff' : 'var(--text-muted)',
                      cursor: chatInput.trim() ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {Send({ size: 16 })}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
