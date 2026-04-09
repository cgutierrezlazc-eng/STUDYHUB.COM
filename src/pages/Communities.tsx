import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'
import { useI18n } from '../services/i18n'
import { BookOpen, GraduationCap, Globe, Lock, MessageSquare, Users, Search as SearchIcon } from '../components/Icons'

interface Props {
  onNavigate: (path: string) => void
}

const CATEGORY_KEYS = [
  { value: '', key: 'communities.catAll' },
  { value: 'materia', key: 'communities.catSubject' },
  { value: 'carrera', key: 'communities.catCareer' },
  { value: 'universidad', key: 'communities.catUniversity' },
  { value: 'estudio', key: 'communities.catStudy' },
  { value: 'hobby', key: 'communities.catHobby' },
  { value: 'general', key: 'communities.catGeneral' },
]

export default function Communities({ onNavigate }: Props) {
  const { user } = useAuth()
  const { t } = useI18n()
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
      <div className="page-header page-enter">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>{Users({ size: 22 })} {t('communities.title')}</h2>
            <p>{t('communities.subtitle')}</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>{t('communities.create')}</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className={`tab ${tab === 'explore' ? 'active' : ''}`} onClick={() => setTab('explore')}>{t('communities.tabExplore')}</button>
          <button className={`tab ${tab === 'my' ? 'active' : ''}`} onClick={() => setTab('my')}>{t('communities.tabMy')}</button>
        </div>
      </div>

      <div className="page-body">
        {tab === 'explore' && suggestions.length > 0 && (
          <div className="u-card hover-lift" style={{ padding: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>{Users({ size: 16 })} {t('communities.suggestedPeople')}</h4>
              <button className="btn btn-secondary btn-xs" onClick={() => onNavigate('/friends')}>{t('communities.viewAll')}</button>
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
              placeholder={t('communities.searchPlaceholder')}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
            <select value={category} onChange={e => { setCategory(e.target.value); setTimeout(loadCommunities, 100) }}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
              {CATEGORY_KEYS.map(c => <option key={c.value} value={c.value}>{t(c.key)}</option>)}
            </select>
            <button className="btn btn-primary" onClick={handleSearch}>{t('communities.search')}</button>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton skeleton-card" style={{ height: 160 }} />
            ))}
          </div>
        ) : communities.length === 0 ? (
          <div className="empty-state" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ marginBottom: 16, opacity: 0.6 }}>
              {Users({ size: 56, color: 'var(--accent-purple)' })}
            </div>
            {tab === 'my' ? (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Aun no te unes a ninguna comunidad</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.6 }}>
                  Unete a comunidades para discutir temas, compartir recursos y conocer gente de tu carrera
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 16 }}>
                  Ej: Ingenieria Civil UCH, Medicina UDP, Derecho PUC
                </p>
                <button className="btn btn-primary" onClick={() => setTab('explore')}>
                  {SearchIcon({ size: 14 })} Explorar comunidades
                </button>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No se encontraron comunidades</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.6 }}>
                  Se el primero en crear una comunidad para tu carrera, ramo o grupo de estudio
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 16 }}>
                  Ej: Grupo Calculo II, Foro Ingenieria, Club de Programacion
                </p>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                  + Crear comunidad
                </button>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {communities.map(c => (
              <div key={c.id} className="u-card hover-lift" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => onNavigate(`/communities/${c.id}`)}>
                <div style={{ height: 80, background: `linear-gradient(135deg, var(--accent)33, var(--accent-purple)33)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 36 }}>{c.avatar || Globe({ size: 36 })}</span>
                </div>
                <div style={{ padding: 16 }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: 15 }}>{c.name}</h4>
                  {c.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</p>}
                  <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                    <span>{Users({ size: 14 })} {c.memberCount} {t('communities.members')}</span>
                    {c.category && <span style={{ background: 'var(--accent)15', color: 'var(--accent)', padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{c.category}</span>}
                  </div>
                  <div onClick={e => e.stopPropagation()}>
                    {c.memberRole ? (
                      <span style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 600 }}>
                        ✓ {c.memberRole === 'admin' ? t('communities.admin') : c.memberRole === 'moderator' ? t('communities.moderator') : t('communities.member')}
                      </span>
                    ) : (
                      <button className="btn btn-primary btn-xs" onClick={() => handleJoin(c.id)}>{t('communities.join')}</button>
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
              <h3>{t('communities.modalTitle')}</h3>
              <div className="auth-field"><label>{t('communities.nameLabel')}</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder={t('communities.namePlaceholder')} autoFocus />
              </div>
              <div className="auth-field"><label>{t('communities.descLabel')}</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t('communities.descPlaceholder')}
                  style={{ width: '100%', minHeight: 60, resize: 'vertical', padding: 10, border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
              </div>
              <div className="auth-field"><label>{t('communities.categoryLabel')}</label>
                <select value={comCategory} onChange={e => setComCategory(e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  {CATEGORY_KEYS.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{t(c.key)}</option>)}
                </select>
              </div>
              <div className="auth-field"><label>{t('communities.typeLabel')}</label>
                <select value={comType} onChange={e => setComType(e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  <option value="public">{t('communities.typePublic')}</option>
                  <option value="private">{t('communities.typePrivate')}</option>
                </select>
              </div>
              <div className="auth-field"><label>{t('communities.rulesLabel')}</label>
                <textarea value={rules} onChange={e => setRules(e.target.value)} placeholder={t('communities.rulesPlaceholder')}
                  style={{ width: '100%', minHeight: 40, resize: 'vertical', padding: 10, border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>{t('communities.cancel')}</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={!name.trim()}>{t('communities.createSubmit')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
