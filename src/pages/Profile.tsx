import React, { useState, useRef } from 'react'
import { useAuth } from '../services/auth'
import { useI18n, LANGUAGES } from '../services/i18n'
import { api } from '../services/api'
import { LanguageSkill } from '../types'

type Section = 'profile' | 'academic' | 'appearance' | 'notifications' | 'security' | 'email'

export default function Profile() {
  const { user, updateProfile, logout } = useAuth()
  const { t } = useI18n()
  const [activeSection, setActiveSection] = useState<Section>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editingUsername, setEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ ...user! })
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  if (!user) return null

  const update = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    updateProfile(form)
    setIsEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      update('avatar', reader.result as string)
      updateProfile({ avatar: reader.result as string })
    }
    reader.readAsDataURL(file)
  }

  const handleChangeUsername = async () => {
    if (!newUsername || newUsername.length < 3) {
      setUsernameError(t('err.usernameShort'))
      return
    }
    try {
      await api.changeUsername(newUsername)
      setEditingUsername(false)
      setUsernameError('')
      window.location.reload()
    } catch (err: any) {
      setUsernameError(err.message)
    }
  }

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()

  const SKILL_OPTIONS: { value: LanguageSkill; label: string; desc: string }[] = [
    { value: 'beginner', label: t('skill.beginner'), desc: t('skill.beginnerDesc') },
    { value: 'intermediate', label: t('skill.intermediate'), desc: t('skill.intermediateDesc') },
    { value: 'advanced', label: t('skill.advanced'), desc: t('skill.advancedDesc') },
  ]

  const SECTIONS: { id: Section; label: string; icon: string }[] = [
    { id: 'profile', label: 'Mi Perfil', icon: '👤' },
    { id: 'academic', label: 'Académico', icon: '🎓' },
    { id: 'appearance', label: 'Apariencia', icon: '🎨' },
    { id: 'notifications', label: 'Notificaciones', icon: '🔔' },
    { id: 'security', label: 'Seguridad', icon: '🔒' },
    ...(user.role === 'owner' ? [{ id: 'email' as Section, label: 'Correo Corporativo', icon: '✉️' }] : []),
  ]

  const ToggleRow = ({ label, desc, defaultOn = true }: { label: string; desc: string; defaultOn?: boolean }) => (
    <label className="pf-toggle-row">
      <div>
        <div className="pf-toggle-label">{label}</div>
        <div className="pf-toggle-desc">{desc}</div>
      </div>
      <input type="checkbox" defaultChecked={defaultOn} className="pf-checkbox" />
    </label>
  )

  return (
    <>
      <div className="page-header">
        <h2>Configuración</h2>
        <p>Gestiona tu cuenta, privacidad y preferencias</p>
      </div>
      <div className="page-body">
        {saved && <div className="profile-toast">{t('profile.saved')}</div>}

        {/* Header Card — Avatar + Identity */}
        <div className="pf-header-card">
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
          <div className="pf-header-avatar" onClick={() => fileInputRef.current?.click()}>
            {user.avatar ? (
              <img src={user.avatar} alt="" className="pf-avatar-img" />
            ) : (
              <div className="pf-avatar-initials">{initials || '?'}</div>
            )}
            <div className="pf-avatar-edit">Editar</div>
          </div>
          <div className="pf-header-info">
            <h2 className="pf-header-name">{user.firstName} {user.lastName}</h2>
            <div className="pf-header-meta">
              {editingUsername ? (
                <div className="pf-username-edit">
                  <span>@</span>
                  <input value={newUsername} onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))} placeholder={user.username} />
                  <button className="btn btn-primary btn-xs" onClick={handleChangeUsername}>Guardar</button>
                  <button className="btn btn-secondary btn-xs" onClick={() => setEditingUsername(false)}>Cancelar</button>
                  {usernameError && <span style={{ color: 'var(--accent-red)', fontSize: 12 }}>{usernameError}</span>}
                </div>
              ) : (
                <span className="pf-username" onClick={() => { setNewUsername(user.username); setEditingUsername(true) }}>
                  @{user.username} <span className="pf-user-number">#{String(user.userNumber || 0).padStart(4, '0')}</span>
                </span>
              )}
              <span className="pf-header-dot">·</span>
              <span>{user.career || 'Estudiante'}</span>
              <span className="pf-header-dot">·</span>
              <span>{user.university || 'Sin universidad'}</span>
            </div>
            <div className="pf-header-badges">
              {user.emailVerified ? (
                <span className="pf-badge pf-badge-green">✓ Correo verificado</span>
              ) : (
                <span className="pf-badge pf-badge-orange">⚠ Correo sin verificar</span>
              )}
              {user.role === 'owner' && <span className="pf-badge pf-badge-blue">Owner / CEO</span>}
              {user.isAdmin && user.role !== 'owner' && <span className="pf-badge pf-badge-purple">Administrador</span>}
              <span className="pf-badge">{t('reg.semester')} {user.semester}</span>
            </div>
          </div>
        </div>

        {/* Settings Layout — Sidebar + Content */}
        <div className="pf-settings-layout">
          {/* Navigation Sidebar */}
          <nav className="pf-settings-nav">
            {SECTIONS.map(s => (
              <button key={s.id} className={`pf-nav-item ${activeSection === s.id ? 'active' : ''}`}
                onClick={() => setActiveSection(s.id)}>
                <span className="pf-nav-icon">{s.icon}</span>
                {s.label}
              </button>
            ))}
            <div className="pf-nav-divider" />
            <button className="pf-nav-item pf-nav-danger" onClick={logout}>
              Cerrar Sesión
            </button>
          </nav>

          {/* Content Panel */}
          <div className="pf-settings-content">

            {/* ─── Mi Perfil ─── */}
            {activeSection === 'profile' && (
              <div className="pf-section">
                <div className="pf-section-header">
                  <h3>Información Personal</h3>
                  {!isEditing ? (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setForm({ ...user }); setIsEditing(true) }}>Editar</button>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>Cancelar</button>
                      <button className="btn btn-primary btn-sm" onClick={handleSave}>Guardar cambios</button>
                    </div>
                  )}
                </div>
                <div className="pf-fields-grid">
                  <div className="pf-field">
                    <label>{t('reg.name')}</label>
                    {isEditing ? <input className="form-input" value={form.firstName} onChange={e => update('firstName', e.target.value)} /> : <p>{user.firstName || '—'}</p>}
                  </div>
                  <div className="pf-field">
                    <label>{t('reg.lastName')}</label>
                    {isEditing ? <input className="form-input" value={form.lastName} onChange={e => update('lastName', e.target.value)} /> : <p>{user.lastName || '—'}</p>}
                  </div>
                  <div className="pf-field">
                    <label>{t('auth.email')}</label>
                    <p>{user.email}</p>
                  </div>
                  <div className="pf-field">
                    <label>{t('reg.phone')}</label>
                    {isEditing ? <input className="form-input" value={form.phone || ''} onChange={e => update('phone', e.target.value)} /> : <p>{user.phone || '—'}</p>}
                  </div>
                  <div className="pf-field">
                    <label>{t('reg.birthDate')}</label>
                    <p>{user.birthDate ? new Date(user.birthDate).toLocaleDateString() : '—'}</p>
                  </div>
                  <div className="pf-field">
                    <label>{t('profile.method')}</label>
                    <p>{user.provider === 'google' ? 'Google' : t('profile.methodEmail')}</p>
                  </div>
                </div>

                <div className="pf-divider" />

                <h3>Bio</h3>
                {isEditing ? (
                  <textarea className="form-input" rows={3} value={form.bio || ''} onChange={e => update('bio', e.target.value)} placeholder="Cuéntanos sobre ti..." />
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{user.bio || 'Sin bio. Haz clic en Editar para agregar una.'}</p>
                )}

                <div className="pf-footer-meta">
                  <small>Cuenta creada: {new Date(user.createdAt).toLocaleDateString()}</small>
                  <small>Último acceso: {new Date(user.lastLogin).toLocaleDateString()}</small>
                </div>
              </div>
            )}

            {/* ─── Académico ─── */}
            {activeSection === 'academic' && (
              <div className="pf-section">
                <div className="pf-section-header">
                  <h3>Información Académica</h3>
                  {!isEditing ? (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setForm({ ...user }); setIsEditing(true) }}>Editar</button>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>Cancelar</button>
                      <button className="btn btn-primary btn-sm" onClick={handleSave}>Guardar</button>
                    </div>
                  )}
                </div>
                <div className="pf-fields-grid">
                  <div className="pf-field">
                    <label>{t('reg.university')}</label>
                    {isEditing ? <input className="form-input" value={form.university} onChange={e => update('university', e.target.value)} /> : <p>{user.university || '—'}</p>}
                  </div>
                  <div className="pf-field">
                    <label>{t('reg.career')}</label>
                    {isEditing ? <input className="form-input" value={form.career} onChange={e => update('career', e.target.value)} /> : <p>{user.career || '—'}</p>}
                  </div>
                  <div className="pf-field">
                    <label>{t('reg.semester')}</label>
                    {isEditing ? (
                      <select className="form-input" value={form.semester} onChange={e => update('semester', parseInt(e.target.value))}>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(s => <option key={s} value={s}>{t('reg.semester')} {s}</option>)}
                      </select>
                    ) : <p>{t('reg.semester')} {user.semester}</p>}
                  </div>
                </div>

                <div className="pf-divider" />

                <h3>{t('skill.title')}</h3>
                <p className="pf-hint">{t('skill.hint')}</p>
                <div className="pf-skill-options">
                  {SKILL_OPTIONS.map(opt => (
                    <button key={opt.value} className={`pf-skill-btn ${(user.languageSkill || 'intermediate') === opt.value ? 'active' : ''}`}
                      onClick={() => updateProfile({ languageSkill: opt.value } as any)}>
                      <strong>{opt.label}</strong>
                      <small>{opt.desc}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Apariencia ─── */}
            {activeSection === 'appearance' && (
              <div className="pf-section">
                <h3>Tema Visual</h3>
                <p className="pf-hint">Elige la apariencia que prefieras para Conniku</p>
                <div className="theme-selector">
                  {([
                    { id: 'nocturno', name: '☀️ Sereno', desc: 'Cálido y profesional', colors: ['#F5F3EF', '#2563EB', '#1D2939'] },
                    { id: 'calido', name: '🌙 Noche Calma', desc: 'Oscuro y suave', colors: ['#111318', '#60A5FA', '#ECECEF'] },
                    { id: 'profesional', name: '🌿 Bosque', desc: 'Verde y natural', colors: ['#F2F5F0', '#16A34A', '#1A2E1A'] },
                    { id: 'vibrante', name: '🌊 Océano', desc: 'Azul profundo', colors: ['#0F172A', '#38BDF8', '#F1F5F9'] },
                  ] as const).map(theme => (
                    <button key={theme.id} className={`theme-card ${(user.theme || 'nocturno') === theme.id ? 'active' : ''}`}
                      onClick={() => {
                        document.documentElement.setAttribute('data-theme', theme.id)
                        updateProfile({ theme: theme.id } as any)
                        api.updateMe({ theme: theme.id }).catch(() => {})
                      }}>
                      <div className="theme-preview">
                        {theme.colors.map((c, i) => <div key={i} style={{ background: c, flex: 1 }} />)}
                      </div>
                      <strong>{theme.name}</strong>
                      <small>{theme.desc}</small>
                    </button>
                  ))}
                </div>

                <div className="pf-divider" />

                <h3>Idioma de la Plataforma</h3>
                <p className="pf-hint">Elige el idioma en que Conniku se comunica contigo</p>
                <select
                  value={user.platformLanguage || user.language || 'es'}
                  onChange={e => updateProfile({ platformLanguage: e.target.value } as any)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, marginBottom: 16 }}
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                  ))}
                </select>

                <h3>Idiomas Adicionales</h3>
                <p className="pf-hint">Selecciona hasta 3 idiomas adicionales que hablas. Conniku adaptará el contenido y las interacciones.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {LANGUAGES.filter(l => l.code !== (user.platformLanguage || user.language || 'es')).map(l => {
                    const selected = (user.secondaryLanguages || []).includes(l.code)
                    return (
                      <button
                        key={l.code}
                        onClick={() => {
                          const current = user.secondaryLanguages || []
                          let updated: string[]
                          if (selected) {
                            updated = current.filter((c: string) => c !== l.code)
                          } else if (current.length < 3) {
                            updated = [...current, l.code]
                          } else {
                            return
                          }
                          updateProfile({ secondaryLanguages: updated } as any)
                        }}
                        style={{
                          padding: '6px 12px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                          border: selected ? '2px solid var(--accent)' : '1px solid var(--border)',
                          background: selected ? 'rgba(37,99,235,0.08)' : 'var(--bg-secondary)',
                          color: selected ? 'var(--accent)' : 'var(--text-secondary)',
                          fontWeight: selected ? 600 : 400,
                        }}
                      >
                        {l.flag} {l.name} {selected && '✓'}
                      </button>
                    )
                  })}
                </div>
                {(user.secondaryLanguages || []).length >= 3 && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Máximo 3 idiomas adicionales seleccionados</p>
                )}
              </div>
            )}

            {/* ─── Notificaciones & Privacidad ─── */}
            {activeSection === 'notifications' && (
              <div className="pf-section">
                <h3>Privacidad</h3>
                <div className="pf-toggles">
                  <ToggleRow label="Perfil privado" desc="Solo amigos pueden ver tu perfil completo" />
                  <ToggleRow label="Mostrar estado en línea" desc="Otros usuarios pueden ver cuando estás conectado" />
                  <ToggleRow label="Aparecer en sugerencias" desc="Permitir que otros te encuentren como sugerencia de amistad" />
                </div>

                <div className="pf-divider" />

                <h3>Notificaciones por Email</h3>
                <div className="pf-toggles">
                  <ToggleRow label="Notificaciones por email" desc="Recibir emails sobre actividad de amigos y mensajes" />
                  <ToggleRow label="Nuevas publicaciones de amigos" desc="Notificar cuando un amigo publica en su muro" />
                  <ToggleRow label="Solicitudes de amistad" desc="Notificar cuando alguien quiere ser tu amigo" />
                  <ToggleRow label="Mensajes directos" desc="Notificar cuando recibes un mensaje nuevo" />
                </div>
              </div>
            )}

            {/* ─── Seguridad ─── */}
            {activeSection === 'security' && (
              <div className="pf-section">
                <h3>Cambiar Contraseña</h3>
                {user.provider === 'email' ? (
                  !showPasswordChange ? (
                    <div>
                      <p className="pf-hint">Actualiza tu contraseña para mantener tu cuenta segura.</p>
                      <button className="btn btn-secondary btn-sm" onClick={() => setShowPasswordChange(true)}>
                        Cambiar contraseña
                      </button>
                    </div>
                  ) : (
                    <div className="pf-password-form">
                      <div className="pf-field"><label>Contraseña actual</label><input className="form-input" type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} /></div>
                      <div className="pf-field"><label>Nueva contraseña</label><input className="form-input" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} /></div>
                      <div className="pf-field"><label>Confirmar nueva contraseña</label><input className="form-input" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} /></div>
                      {pwError && <p style={{ color: 'var(--accent-red)', fontSize: 13 }}>{pwError}</p>}
                      {pwSuccess && <p style={{ color: 'var(--accent-green)', fontSize: 13 }}>Contraseña actualizada correctamente</p>}
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={async () => {
                          setPwError(''); setPwSuccess(false)
                          if (newPw.length < 6) { setPwError('Mínimo 6 caracteres'); return }
                          if (newPw !== confirmPw) { setPwError('Las contraseñas no coinciden'); return }
                          try {
                            await api.changePassword(currentPw, newPw)
                            setPwSuccess(true); setCurrentPw(''); setNewPw(''); setConfirmPw('')
                            setTimeout(() => setShowPasswordChange(false), 2000)
                          } catch (e: any) { setPwError(e.message || 'Error al cambiar contraseña') }
                        }}>Guardar contraseña</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setShowPasswordChange(false); setPwError('') }}>Cancelar</button>
                      </div>
                    </div>
                  )
                ) : (
                  <p className="pf-hint">Tu cuenta usa inicio de sesión con Google. No puedes cambiar la contraseña aquí.</p>
                )}

                <div className="pf-divider" />

                <h3 style={{ color: 'var(--accent-red)' }}>Eliminar Cuenta</h3>
                <div className="pf-danger-zone">
                  <p>Una vez que elimines tu cuenta, se borrarán permanentemente todos tus datos, proyectos, mensajes y publicaciones. Esta acción no se puede deshacer.</p>
                  <button className="btn btn-danger btn-sm" onClick={() => {
                    if (confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es IRREVERSIBLE.')) {
                      if (confirm('ÚLTIMA CONFIRMACIÓN: Todos tus datos serán eliminados permanentemente. ¿Continuar?')) {
                        api.deleteAccount().then(() => {
                          alert('Tu cuenta ha sido eliminada. Serás redirigido.')
                          logout()
                        }).catch((err: any) => alert(err.message || 'Error al eliminar cuenta'))
                      }
                    }
                  }}>
                    Eliminar mi cuenta permanentemente
                  </button>
                </div>
              </div>
            )}

            {/* ─── Correo Corporativo (Owner) ─── */}
            {activeSection === 'email' && user.role === 'owner' && (
              <div className="pf-section">
                <h3>Cuentas de Correo Corporativo</h3>
                <p className="pf-hint" style={{ marginBottom: 20 }}>
                  Administra las cuentas de correo electrónico de Conniku. Configura estas cuentas en tu cliente de correo (Outlook, Gmail, etc.)
                  usando los datos IMAP/SMTP de tu proveedor de dominio.
                </p>
                <div className="pf-toggles">
                  {[
                    { email: 'contacto@conniku.com', label: 'Contacto General', desc: 'Soporte y consultas de usuarios', status: 'active' },
                    { email: 'cristian.a.gutierrez@conniku.com', label: 'CEO / Fundador', desc: 'Correo personal del propietario', status: 'active' },
                    { email: 'soporte@conniku.com', label: 'Soporte Técnico', desc: 'Tickets de soporte y ayuda', status: 'pending' },
                    { email: 'pagos@conniku.com', label: 'Facturación', desc: 'Recibos, facturas y pagos', status: 'pending' },
                  ].map(account => (
                    <div key={account.email} className="pf-email-row">
                      <div className={`pf-email-icon ${account.status}`}>
                        {account.status === 'active' ? '✉️' : '⏳'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{account.label}</div>
                        <div style={{ fontSize: 13, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{account.email}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{account.desc}</div>
                      </div>
                      <span className={`pf-badge ${account.status === 'active' ? 'pf-badge-green' : 'pf-badge-orange'}`}>
                        {account.status === 'active' ? 'Activa' : 'Pendiente'}
                      </span>
                    </div>
                  ))}
                </div>
                <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }} onClick={() => {
                  const email = prompt('Nuevo correo (ej: marketing@conniku.com):')
                  if (email) alert(`Para crear ${email}, configúralo en tu panel de hosting (cPanel, Google Workspace, Zoho Mail, etc.)`)
                }}>
                  + Crear nueva cuenta de correo
                </button>

                <div className="pf-divider" />

                <h3>Configuración para Outlook / Gmail</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
                  <div className="pf-config-box">
                    <h4 style={{ color: 'var(--accent-blue)' }}>Correo Entrante (IMAP)</h4>
                    <div>Servidor: <strong style={{ fontFamily: 'var(--font-mono)' }}>mail.conniku.com</strong></div>
                    <div>Puerto: <strong>993</strong> (SSL/TLS)</div>
                    <div>Usuario: <strong style={{ fontFamily: 'var(--font-mono)' }}>tu@conniku.com</strong></div>
                  </div>
                  <div className="pf-config-box">
                    <h4 style={{ color: 'var(--accent-green)' }}>Correo Saliente (SMTP)</h4>
                    <div>Servidor: <strong style={{ fontFamily: 'var(--font-mono)' }}>smtp.conniku.com</strong></div>
                    <div>Puerto: <strong>587</strong> (STARTTLS)</div>
                    <div>Autenticación: <strong>Requerida</strong></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
