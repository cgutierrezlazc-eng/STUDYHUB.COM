import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'
import { BookOpen, GraduationCap, Globe, Lock, MessageSquare, Users, Search as SearchIcon } from '../components/Icons'

interface Props {
  onNavigate: (path: string) => void
}

const CATEGORIES = [
  { value: '', label: 'Todas' },
  { value: 'materia', label: 'Materia' },
  { value: 'carrera', label: 'Carrera' },
  { value: 'universidad', label: 'Universidad' },
  { value: 'estudio', label: 'Grupo de Estudio' },
  { value: 'hobby', label: 'Hobby' },
  { value: 'general', label: 'General' },
]

export default function Communities({ onNavigate }: Props) {
  const { user } = useAuth()
  const [tab, setTab] = useState<'explore' | 'my' | 'create'>('explore')
  const [communities, setCommunities] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [comType, setComType] = useState('public')
  const [comCategory, setComCategory] = useState('general')
  const [rules, setRules] = useState('')

  useEffect(() => { loadCommunities() }, [tab])

  useEffect(() => {
    api.getFriendSuggestions().then(data => setSuggestions((data || []).slice(0, 4))).catch(() => {})
  }, [])

  const loadCommunities = async () => {
    setLoading(true)
    try {
      const data = await api.getCommunities(search || undefined, category || undefined, undefined, tab === 'my', 1)
      setCommunities(data.communities || [])
    } catch (err: any) { console.error('Failed to load communities:', err) }
    setLoading(false)
  }

  const handleSearch = () => loadCommunities()

  const handleCreate = async () => {
    if (!name.trim()) return
    try {
      const result = await api.createCommunity({
        name: name.trim(), description, type: comType, category: comCategory, rules,
        university: user?.university || '',
      })
      setShowCreate(false)
      setName(''); setDescription(''); setRules('')
      onNavigate(`/communities/${result.id}`)
    } catch (err: any) {
      alert(err.message || 'Error al crear comunidad')
    }
  }

  const handleJoin = async (id: string) => {
    try {
      await api.joinCommunity(id)
      setCommunities(prev => prev.map(c => c.id === id ? { ...c, memberRole: 'member', memberCount: (c.memberCount || 0) + 1 } : c))
    } catch (err: any) {
      alert(err.message || 'Error al unirse')
    }
  }

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>{Users({ size: 22 })} Comunidades</h2>
            <p>Únete a grupos de estudio y conecta con estudiantes</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Crear Comunidad</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className={`tab ${tab === 'explore' ? 'active' : ''}`} onClick={() => setTab('explore')}>Explorar</button>
          <button className={`tab ${tab === 'my' ? 'active' : ''}`} onClick={() => setTab('my')}>Mis Comunidades</button>
        </div>
      </div>

      <div className="page-body">
        {tab === 'explore' && suggestions.length > 0 && (
          <div className="card" style={{ padding: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>{Users({ size: 16 })} Personas sugeridas</h4>
              <button className="btn btn-secondary btn-xs" onClick={() => onNavigate('/friends')}>Ver todas</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {suggestions.map(s => (
                <div key={s.id} onClick={() => onNavigate(`/user/${s.id}`)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                  background: 'var(--bg-secondary)', borderRadius: 12, cursor: 'pointer',
                  border: '1px solid var(--border-color)', transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 14, fontWeight: 600, overflow: 'hidden', flexShrink: 0
                  }}>
                    {s.avatar ? <img src={s.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : s.firstName?.[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>{s.firstName} {s.lastName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.career || s.university || `@${s.username}`}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'explore' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar comunidades..."
              style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
            <select value={category} onChange={e => { setCategory(e.target.value); setTimeout(loadCommunities, 100) }}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <button className="btn btn-primary" onClick={handleSearch}>Buscar</button>
          </div>
        )}

        {loading ? (
          <div className="loading-dots"><span /><span /><span /></div>
        ) : communities.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div style={{ fontSize: 48 }}>{Users({ size: 48 })}</div>
            <h3>{tab === 'my' ? 'Aún no te has unido a ninguna comunidad' : 'No se encontraron comunidades'}</h3>
            <p>{tab === 'my' ? 'Explora y únete a comunidades de tu interés' : 'Sé el primero en crear una'}</p>
            {tab === 'my' && <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setTab('explore')}>Explorar</button>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {communities.map(c => (
              <div key={c.id} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => onNavigate(`/communities/${c.id}`)}>
                <div style={{ height: 80, background: `linear-gradient(135deg, var(--accent)33, var(--accent-purple)33)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 36 }}>{c.avatar || Globe({ size: 36 })}</span>
                </div>
                <div style={{ padding: 16 }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: 15 }}>{c.name}</h4>
                  {c.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</p>}
                  <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                    <span>{Users({ size: 14 })} {c.memberCount} miembros</span>
                    {c.category && <span style={{ background: 'var(--accent)15', color: 'var(--accent)', padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{c.category}</span>}
                  </div>
                  <div onClick={e => e.stopPropagation()}>
                    {c.memberRole ? (
                      <span style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 600 }}>
                        ✓ {c.memberRole === 'admin' ? 'Admin' : c.memberRole === 'moderator' ? 'Moderador' : 'Miembro'}
                      </span>
                    ) : (
                      <button className="btn btn-primary btn-xs" onClick={() => handleJoin(c.id)}>Unirse</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Crear Comunidad</h3>
              <div className="auth-field"><label>Nombre *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Cálculo II - UNAM" autoFocus />
              </div>
              <div className="auth-field"><label>Descripción</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="¿De qué trata esta comunidad?"
                  style={{ width: '100%', minHeight: 60, resize: 'vertical', padding: 10, border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
              </div>
              <div className="auth-field"><label>Categoría</label>
                <select value={comCategory} onChange={e => setComCategory(e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  {CATEGORIES.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="auth-field"><label>Tipo</label>
                <select value={comType} onChange={e => setComType(e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  <option value="public">Pública</option>
                  <option value="private">Privada</option>
                </select>
              </div>
              <div className="auth-field"><label>Reglas (opcional)</label>
                <textarea value={rules} onChange={e => setRules(e.target.value)} placeholder="Reglas de la comunidad..."
                  style={{ width: '100%', minHeight: 40, resize: 'vertical', padding: 10, border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={!name.trim()}>Crear</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
