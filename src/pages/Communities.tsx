import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'
import { useI18n } from '../services/i18n'
import { Globe, Lock, Users, Search as SearchIcon, Flame, Plus } from '../components/Icons'

interface Props {
  onNavigate: (path: string) => void
}

const CATEGORIES = [
  { value: '', label: '🌐 Todas', color: '#6366f1' },
  { value: 'materia', label: '📚 Materias', color: '#3b82f6' },
  { value: 'carrera', label: '🎓 Carrera', color: '#8b5cf6' },
  { value: 'estudio', label: '📖 Estudio', color: '#10b981' },
  { value: 'universidad', label: '🏛️ Universidad', color: '#f59e0b' },
  { value: 'hobby', label: '🎮 Hobby', color: '#ef4444' },
  { value: 'general', label: '💬 General', color: '#64748b' },
]

export default function Communities({ onNavigate }: Props) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [tab, setTab] = useState<'explore' | 'my'>('explore')
  const [communities, setCommunities] = useState<any[]>([])
  const [trending, setTrending] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  // Create form
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [comType, setComType] = useState('public')
  const [comCategory, setComCategory] = useState('general')
  const [rules, setRules] = useState('')

  useEffect(() => {
    loadCommunities()
    if (tab === 'explore') {
      api.getTrendingCommunities().then(setTrending).catch(() => {})
    }
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadCommunities = async () => {
    setLoading(true)
    try {
      const data = await api.getCommunities(search || undefined, category || undefined, undefined, tab === 'my', 1)
      setCommunities(data.communities || [])
    } catch (err: any) { console.error('Failed to load communities:', err) }
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true)
    try {
      const result = await api.createCommunity({
        name: name.trim(), description, type: comType, category: comCategory, rules,
        university: user?.university || '',
      })
      setShowCreate(false)
      setName(''); setDescription(''); setRules('')
      onNavigate(`/communities/${result.id}`)
    } catch (err: any) { alert(err.message || 'Error al crear') }
    setCreating(false)
  }

  const handleJoin = async (e: React.MouseEvent, communityId: string) => {
    e.stopPropagation()
    try {
      await api.joinCommunity(communityId)
      setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, isMember: true, memberCount: (c.memberCount || 0) + 1 } : c))
      setTrending(prev => prev.map(c => c.id === communityId ? { ...c, isMember: true } : c))
    } catch (err: any) { alert(err.message || 'Error') }
  }

  const categoryColor = (cat: string) => CATEGORIES.find(c => c.value === cat)?.color || '#6366f1'

  return (
    <>
      <div className="page-header page-enter">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>{t('nav.communities')}</h2>
            <p style={{ margin: 0 }}>{t('communities.subtitle') || 'Grupos de estudio, materias y más'}</p>
          </div>
          <button
            className="btn btn-primary btn-sm"
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => setShowCreate(true)}
          >
            {Plus({ size: 14 })} Crear comunidad
          </button>
        </div>
      </div>

      <div className="page-body">

        {/* ── Trending section (explore only) ── */}
        {tab === 'explore' && trending.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              {Flame({ size: 16, color: '#f97316' })}
              <span style={{ fontWeight: 700, fontSize: 15 }}>Trending esta semana</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
              {trending.map(c => (
                <div
                  key={c.id}
                  onClick={() => onNavigate(`/communities/${c.id}`)}
                  style={{
                    background: 'var(--bg-card)', borderRadius: 12, overflow: 'hidden',
                    border: '1px solid var(--border-subtle)', cursor: 'pointer',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
                >
                  {/* Cover */}
                  <div style={{
                    height: 60,
                    background: c.coverImage ? `url(${c.coverImage}) center/cover` :
                      `linear-gradient(135deg, ${categoryColor(c.category)}33, ${categoryColor(c.category)}66)`,
                  }} />
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: c.avatar ? `url(${c.avatar}) center/cover` : categoryColor(c.category) + '33',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: categoryColor(c.category),
                        border: '2px solid var(--bg-card)',
                        marginTop: -20,
                      }}>
                        {!c.avatar && c.name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.memberCount} miembros</div>
                      </div>
                    </div>
                    {!c.isMember && (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', marginTop: 8, fontSize: 12 }}
                        onClick={e => handleJoin(e, c.id)}
                      >Unirse</button>
                    )}
                    {c.isMember && (
                      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--accent-green)', fontWeight: 600, textAlign: 'center' }}>
                        ✓ Miembro
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {(['explore', 'my'] as const).map(t2 => (
            <button
              key={t2}
              className={`btn btn-sm ${tab === t2 ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTab(t2)}
            >
              {t2 === 'explore' ? 'Explorar' : 'Mis comunidades'}
            </button>
          ))}

          {/* Category chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginLeft: 8 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => { setCategory(cat.value); setTimeout(loadCommunities, 50) }}
                style={{
                  background: category === cat.value ? cat.color + '22' : 'var(--bg-secondary)',
                  border: `1px solid ${category === cat.value ? cat.color : 'var(--border-subtle)'}`,
                  color: category === cat.value ? cat.color : 'var(--text-secondary)',
                  borderRadius: 20, padding: '4px 12px', fontSize: 12, cursor: 'pointer',
                  fontWeight: category === cat.value ? 700 : 400,
                  transition: 'all 0.15s',
                }}
              >{cat.label}</button>
            ))}
          </div>

          {/* Search */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadCommunities()}
              placeholder="Buscar comunidades..."
              style={{
                padding: '7px 12px', borderRadius: 20, border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)', fontSize: 13, outline: 'none', width: 200,
              }}
            />
            <button className="btn btn-secondary btn-sm" onClick={loadCommunities}>
              {SearchIcon({ size: 14 })}
            </button>
          </div>
        </div>

        {/* ── Community grid ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 14, overflow: 'hidden' }}>
                <div className="skeleton" style={{ height: 80 }} />
                <div style={{ padding: 14 }}>
                  <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: 8 }} />
                  <div className="skeleton skeleton-text" style={{ width: '90%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : communities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏘️</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
              {tab === 'my' ? 'Aún no estás en ninguna comunidad' : 'No se encontraron comunidades'}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
              {tab === 'my' ? 'Explora comunidades y únete a las que te interesen' : 'Sé el primero en crear una comunidad para tu área'}
            </div>
            <button className="btn btn-primary" onClick={() => tab === 'my' ? setTab('explore') : setShowCreate(true)}>
              {tab === 'my' ? 'Explorar comunidades' : '+ Crear comunidad'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {communities.map(c => (
              <div
                key={c.id}
                onClick={() => onNavigate(`/communities/${c.id}`)}
                style={{
                  background: 'var(--bg-card)', borderRadius: 14, overflow: 'hidden',
                  border: '1px solid var(--border-subtle)', cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
              >
                {/* Cover banner */}
                <div style={{
                  height: 72,
                  background: c.coverImage ? `url(${c.coverImage}) center/cover` :
                    `linear-gradient(135deg, ${categoryColor(c.category)}22, ${categoryColor(c.category)}55)`,
                  position: 'relative',
                }}>
                  {c.type === 'private' && (
                    <span style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'rgba(0,0,0,0.5)', color: '#fff',
                      borderRadius: 6, padding: '2px 8px', fontSize: 11,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      {Lock({ size: 10 })} Privada
                    </span>
                  )}
                </div>

                <div style={{ padding: '0 14px 14px' }}>
                  {/* Avatar overlapping cover */}
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: c.avatar ? `url(${c.avatar}) center/cover` : categoryColor(c.category) + '22',
                    border: '3px solid var(--bg-card)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700, color: categoryColor(c.category),
                    marginTop: -22, marginBottom: 8,
                  }}>
                    {!c.avatar && c.name?.[0]?.toUpperCase()}
                  </div>

                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{c.name}</div>
                  <div style={{
                    fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.4,
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                  }}>
                    {c.description || 'Sin descripción'}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {Users({ size: 12 })} {c.memberCount || 0}
                      </span>
                      <span style={{
                        fontSize: 11, borderRadius: 6, padding: '2px 8px',
                        background: categoryColor(c.category) + '18',
                        color: categoryColor(c.category), fontWeight: 600,
                      }}>
                        {CATEGORIES.find(cat => cat.value === c.category)?.label || c.category}
                      </span>
                    </div>
                    {(c.isMember || c.memberRole) ? (
                      <span style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 700 }}>✓ Miembro</span>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: 12, padding: '5px 12px' }}
                        onClick={e => handleJoin(e, c.id)}
                      >Unirse</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create modal ── */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>✨ Crear comunidad</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="auth-field">
                <label>Nombre de la comunidad *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Cálculo I - UCH 2025" />
              </div>
              <div className="auth-field">
                <label>Descripción</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="¿De qué trata esta comunidad?" rows={3}
                  style={{ resize: 'vertical', fontFamily: 'inherit', padding: '8px 12px', borderRadius: 8,
                    border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', fontSize: 14 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="auth-field">
                  <label>Tipo</label>
                  <select value={comType} onChange={e => setComType(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)', fontSize: 14 }}>
                    <option value="public">🌐 Pública</option>
                    <option value="private">🔒 Privada</option>
                  </select>
                </div>
                <div className="auth-field">
                  <label>Categoría</label>
                  <select value={comCategory} onChange={e => setComCategory(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)', fontSize: 14 }}>
                    {CATEGORIES.filter(c => c.value).map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="auth-field">
                <label>Reglas de la comunidad</label>
                <textarea value={rules} onChange={e => setRules(e.target.value)}
                  placeholder="Ej: 1. Respeto ante todo&#10;2. Solo contenido académico&#10;3. Sin spam"
                  rows={3}
                  style={{ resize: 'vertical', fontFamily: 'inherit', padding: '8px 12px', borderRadius: 8,
                    border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', fontSize: 14 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={creating || !name.trim()}>
                {creating ? 'Creando...' : '✨ Crear comunidad'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
