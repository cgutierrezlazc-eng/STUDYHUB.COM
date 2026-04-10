import React, { useState } from 'react'
import { Bell, Send, Smartphone, Users, Megaphone, CheckCircle, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../services/auth'
import { api } from '../../services/api'
import { btnPrimary, btnSecondary, inputStyle, selectStyle } from '../shared/styles'

const TEMPLATES = [
  { id: 'update', icon: '🔄', title: 'Actualiza tu App Conniku', body: 'Hemos actualizado el logo oficial y mejorado la plataforma. Actualiza para ver los cambios.', url: '/' },
  { id: 'feature', icon: '✨', title: 'Nueva función disponible', body: 'Descubre las nuevas herramientas de estudio que hemos preparado para ti.', url: '/dashboard' },
  { id: 'event', icon: '📅', title: 'Evento próximo', body: 'No te pierdas el evento de esta semana. ¡Inscríbete ahora!', url: '/events' },
  { id: 'promo', icon: '🎉', title: 'Oferta especial', body: 'Aprovecha nuestra promoción por tiempo limitado. Mejora tu plan ahora.', url: '/subscription' },
]

export default function PushNotificationsModule() {
  const { user } = useAuth()
  const [mode, setMode] = useState<'templates' | 'custom' | 'history'>('templates')
  const [customTitle, setCustomTitle] = useState('')
  const [customBody, setCustomBody] = useState('')
  const [customUrl, setCustomUrl] = useState('/')
  const [customFilter, setCustomFilter] = useState('all')
  const [sending, setSending] = useState(false)
  const [sentHistory, setSentHistory] = useState<{ title: string; body: string; sentAt: string; count: number }[]>([
    { title: '🔄 Actualiza tu App Conniku', body: 'Hemos actualizado el logo oficial...', sentAt: '2026-04-07 14:30', count: 127 },
    { title: '✨ Nuevo: Asistente de Estudio Conniku', body: 'Prueba el nuevo asistente...', sentAt: '2026-04-05 10:00', count: 98 },
    { title: '📅 Hackathon Conniku 2026', body: 'Inscríbete al hackathon...', sentAt: '2026-04-01 09:00', count: 145 },
  ])

  const sendPush = async (title: string, body: string, url: string) => {
    if (!confirm(`¿Enviar notificación push a todos los usuarios?\n\nTítulo: ${title}\nMensaje: ${body}`)) return
    setSending(true)
    try {
      await api.broadcastPush(title, body, url)
      setSentHistory(prev => [{ title, body, sentAt: new Date().toLocaleString('es-CL'), count: 0 }, ...prev])
      alert('Notificación enviada correctamente')
    } catch (e: any) {
      alert('Error: ' + (e.message || e))
    } finally {
      setSending(false)
    }
  }

  if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Acceso restringido</div>
  }

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bell size={26} /> Push Notifications
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>
          Enviar notificaciones push a todos los usuarios de la plataforma
        </p>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border)', paddingBottom: 8 }}>
        {[
          { id: 'templates' as const, label: 'Plantillas Rápidas', icon: <Megaphone size={14} /> },
          { id: 'custom' as const, label: 'Personalizado', icon: <Send size={14} /> },
          { id: 'history' as const, label: 'Historial', icon: <CheckCircle size={14} /> },
        ].map(tab => (
          <button key={tab.id} onClick={() => setMode(tab.id)} style={{
            padding: '8px 16px', borderRadius: '8px 8px 0 0', border: 'none',
            background: mode === tab.id ? 'var(--accent)' : 'transparent',
            color: mode === tab.id ? '#fff' : 'var(--text-muted)',
            fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Templates */}
      {mode === 'templates' && (
        <div style={{ display: 'grid', gap: 12 }}>
          {TEMPLATES.map(t => (
            <div key={t.id} style={{
              padding: '20px 24px', borderRadius: 14, background: 'var(--bg-secondary)',
              border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{ fontSize: 32 }}>{t.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.body}</div>
              </div>
              <button
                onClick={() => sendPush(t.icon + ' ' + t.title, t.body, t.url)}
                disabled={sending}
                style={{ ...btnPrimary, opacity: sending ? 0.5 : 1 }}
              >
                <Send size={14} /> Enviar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Custom */}
      {mode === 'custom' && (
        <div style={{
          padding: 24, borderRadius: 14, background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>Notificación Personalizada</h3>
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Título</label>
              <input value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder="Ej: Nueva actualización disponible" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Mensaje</label>
              <textarea
                value={customBody} onChange={e => setCustomBody(e.target.value)}
                placeholder="Escribe el mensaje que verán los usuarios..."
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>URL de destino</label>
                <input value={customUrl} onChange={e => setCustomUrl(e.target.value)} placeholder="/" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Audiencia</label>
                <select value={customFilter} onChange={e => setCustomFilter(e.target.value)} style={selectStyle}>
                  <option value="all">Todos los usuarios</option>
                  <option value="pro">Solo PRO</option>
                  <option value="max">Solo MAX</option>
                  <option value="free">Solo FREE</option>
                </select>
              </div>
            </div>
          </div>

          {/* Preview */}
          {customTitle && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vista previa</div>
              <div style={{
                padding: '12px 16px', borderRadius: 12, background: 'var(--bg-primary)',
                border: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 12, maxWidth: 380,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, flexShrink: 0 }}>C</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Conniku</div>
                  <div style={{ fontWeight: 600, fontSize: 12, marginTop: 2 }}>{customTitle}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{customBody || '...'}</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 20, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={() => sendPush(customTitle, customBody, customUrl)}
              disabled={sending || !customTitle || !customBody}
              style={{ ...btnPrimary, opacity: (sending || !customTitle || !customBody) ? 0.5 : 1 }}
            >
              <Send size={14} /> {sending ? 'Enviando...' : 'Enviar Push'}
            </button>
          </div>
        </div>
      )}

      {/* History */}
      {mode === 'history' && (
        <div style={{ display: 'grid', gap: 8 }}>
          {sentHistory.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 14 }}>
              <Bell size={48} style={{ marginBottom: 12 }} />
              <p>No hay notificaciones enviadas aún.</p>
            </div>
          ) : (
            sentHistory.map((h, i) => (
              <div key={i} style={{
                padding: '14px 18px', borderRadius: 12, background: 'var(--bg-secondary)',
                border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{h.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{h.body}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{h.sentAt}</div>
                  {h.count > 0 && <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>{h.count} alcanzados</div>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
