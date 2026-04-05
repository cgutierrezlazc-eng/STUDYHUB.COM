import React, { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'
import { Bell } from './Icons'

interface Props {
  onNavigate: (path: string) => void
}

const TYPE_EMOJIS: Record<string, string> = {
  like: '\u2764\uFE0F',
  comment: '\uD83D\uDCAC',
  friend_request: '\uD83D\uDC4B',
  friend_accepted: '\uD83E\uDD1D',
  wall_post: '\uD83D\uDCDD',
  mention: '\uD83D\uDCE3',
  community_invite: '\uD83C\uDFD8\uFE0F',
  event_reminder: '\uD83D\uDCC5',
}

export default function NotificationBell({ onNavigate }: Props) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const fetchCount = async () => {
    try {
      const data = await api.getUnreadNotificationCount()
      setUnreadCount(data.count || 0)
    } catch {}
  }

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const data = await api.getNotifications()
      setNotifications(data.notifications || [])
    } catch {}
    setLoading(false)
  }

  const handleOpen = () => {
    if (!open) loadNotifications()
    setOpen(!open)
  }

  const handleClick = async (notif: any) => {
    if (!notif.isRead) {
      await api.markNotificationRead(notif.id).catch(() => {})
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    if (notif.link) {
      onNavigate(notif.link)
      setOpen(false)
    }
  }

  const handleMarkAll = async () => {
    await api.markAllNotificationsRead().catch(() => {})
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'ahora'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={handleOpen}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 20, padding: '4px 8px', position: 'relative',
          color: 'var(--text-primary)',
        }}
      >
        {Bell({ size: 20 })}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: '#ef4444', color: '#fff', borderRadius: '50%',
            width: 18, height: 18, fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 8,
          width: 380, maxHeight: 440, overflowY: 'auto',
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          zIndex: 1000,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', borderBottom: '1px solid var(--border-color)',
          }}>
            <strong style={{ fontSize: 15 }}>Notificaciones</strong>
            {unreadCount > 0 && (
              <button onClick={handleMarkAll} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--accent)', fontSize: 12, fontWeight: 600,
              }}>
                Marcar todo como le\u00EDdo
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Cargando...</div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{Bell({ size: 32 })}</div>
              <p style={{ fontSize: 13 }}>No tienes notificaciones</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 16px',
                  cursor: 'pointer', borderBottom: '1px solid var(--border-color)',
                  background: notif.isRead ? 'transparent' : 'var(--accent)08',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--accent)15', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, overflow: 'hidden',
                }}>
                  {notif.actor?.avatar
                    ? <img src={notif.actor.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                    : (TYPE_EMOJIS[notif.type] || '\uD83D\uDD14')
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                    <strong>{notif.actor?.firstName || ''}</strong>{' '}
                    {notif.title.replace(notif.actor?.firstName + ' ' + (notif.actor?.lastName || ''), '').trim() || notif.title}
                  </div>
                  {notif.body && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {notif.body}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {timeAgo(notif.createdAt)}
                </div>
                {!notif.isRead && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 4 }} />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
