import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'
import { useI18n } from '../services/i18n'
import {
  Inbox, Send, Trash2, Star, Search, RefreshCw, Plus, X, ChevronLeft, ChevronRight,
  Pencil, Eye, EyeOff, Paperclip, Megaphone, CheckCircle, Clock, AlertTriangle, Settings
} from '../components/Icons'

interface Props {
  onNavigate: (path: string) => void
}

interface EmailItem {
  id: string
  to_email?: string
  from_name?: string
  subject: string
  body: string
  preview?: string
  email_type?: string
  status?: string
  created_at?: string
  read?: boolean
  starred?: boolean
}

interface Signature {
  department: string
  tagline: string
  location: string
  website: string
  motto: string
  showLogo: boolean
}

type Folder = 'inbox' | 'sent' | 'drafts' | 'starred' | 'trash'
type FilterMode = 'all' | 'unread' | 'starred'

const DEFAULT_SIGNATURE: Signature = {
  department: 'Dirección Ejecutiva',
  tagline: 'Conniku SpA — Plataforma de Aprendizaje',
  location: 'Santiago, Chile',
  website: 'conniku.com',
  motto: '"Donde los estudiantes se conectan, aprenden y crecen"',
  showLogo: true,
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
  const isThisYear = d.getFullYear() === now.getFullYear()
  if (isThisYear) return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function stripHtml(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

export default function CeoMail({ onNavigate }: Props) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [folder, setFolder] = useState<Folder>('inbox')
  const [emails, setEmails] = useState<EmailItem[]>([])
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeAccount, setActiveAccount] = useState<'all' | 'ceo' | 'contacto'>('all')

  // Compose state
  const [showCompose, setShowCompose] = useState(false)
  const [composeFrom, setComposeFrom] = useState<'ceo' | 'contacto'>('ceo')
  const [composeTo, setComposeTo] = useState('')
  const [composeCc, setComposeCc] = useState('')
  const [composeBcc, setComposeBcc] = useState('')
  const [composeSubject, setComposeSubject] = useState('')
  const [composeBody, setComposeBody] = useState('')
  const [composeCta, setComposeCta] = useState('')
  const [composeCtaUrl, setComposeCtaUrl] = useState('')
  const [composeSending, setComposeSending] = useState(false)
  const [composeMode, setComposeMode] = useState<'new' | 'reply' | 'forward'>('new')

  // Broadcast
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [broadcastSubject, setBroadcastSubject] = useState('')
  const [broadcastBody, setBroadcastBody] = useState('')
  const [broadcastFilter, setBroadcastFilter] = useState('all')
  const [broadcastCta, setBroadcastCta] = useState('')
  const [broadcastCtaUrl, setBroadcastCtaUrl] = useState('')
  const [broadcastSending, setBroadcastSending] = useState(false)

  // Signature
  const [showSignatureSettings, setShowSignatureSettings] = useState(false)
  const [signature, setSignature] = useState<Signature>(() => {
    try {
      const saved = localStorage.getItem('conniku_ceo_signature')
      return saved ? JSON.parse(saved) : DEFAULT_SIGNATURE
    } catch { return DEFAULT_SIGNATURE }
  })

  // Mobile state
  const [mobileView, setMobileView] = useState<'list' | 'reading'>('list')
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  // Load emails
  const loadEmails = useCallback(async (p = 1, filter = '') => {
    setLoading(true)
    try {
      const emailTypeMap: Record<Folder, string> = {
        inbox: '', sent: 'sent', drafts: 'draft', starred: 'starred', trash: 'trash',
      }
      const accountFilter = activeAccount === 'all' ? undefined : activeAccount
      const [inbox, st] = await Promise.all([
        api.getCeoEmailInbox(p, emailTypeMap[folder] || filter, accountFilter),
        api.getCeoEmailStats(),
      ])
      setEmails(inbox.emails || [])
      setTotal(inbox.total || 0)
      setPage(p)
      setStats(st)
    } catch (e) {
      console.error('Email load error:', e)
      // Use mock data if API fails
      setEmails(getMockEmails(folder))
      setTotal(getMockEmails(folder).length)
      setStats({ total: 24, sent: 12, unread: 5 })
    }
    setLoading(false)
  }, [folder, activeAccount])

  useEffect(() => {
    if (user?.role !== 'owner') return
    loadEmails(1)
  }, [folder, loadEmails, user, activeAccount])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showCompose || showBroadcast || showSignatureSettings) return
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (e.key === 'j') navigateEmail(1)
      if (e.key === 'k') navigateEmail(-1)
      if (e.key === 'e' && selectedEmail) handleDelete(selectedEmail.id)
      if (e.key === 'Escape') { setSelectedEmail(null); setMobileView('list') }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedEmail, emails, showCompose, showBroadcast, showSignatureSettings])

  const navigateEmail = (dir: number) => {
    if (!selectedEmail) {
      if (emails.length > 0) selectEmail(emails[0])
      return
    }
    const idx = emails.findIndex(e => e.id === selectedEmail.id)
    const next = idx + dir
    if (next >= 0 && next < emails.length) selectEmail(emails[next])
  }

  const selectEmail = async (email: EmailItem) => {
    try {
      const detail = await api.getCeoEmailDetail(email.id)
      setSelectedEmail({ ...email, ...detail, read: true })
    } catch {
      setSelectedEmail(email)
    }
    setMobileView('reading')
  }

  const handleSend = async () => {
    if (!composeTo || !composeSubject || !composeBody) return
    setComposeSending(true)
    try {
      await api.ceoSendEmail(composeTo, composeSubject, composeBody + getSignatureHtml(), composeCta, composeCtaUrl, composeFrom)
      setShowCompose(false)
      resetCompose()
      loadEmails(1)
    } catch (e: any) { alert(e.message || t('ceomail.errorSending')) }
    setComposeSending(false)
  }

  const handleBroadcast = async () => {
    if (!broadcastSubject || !broadcastBody) return
    if (!confirm(t('ceomail.broadcastConfirm').replace('{filter}', broadcastFilter))) return
    setBroadcastSending(true)
    try {
      const result = await api.ceoBroadcastEmail(broadcastSubject, broadcastBody + getSignatureHtml(), broadcastFilter, broadcastCta, broadcastCtaUrl)
      alert(t('ceomail.broadcastSentTo').replace('{count}', String(result.recipients)))
      setShowBroadcast(false)
      resetBroadcast()
      loadEmails(1)
    } catch (e: any) { alert(e.message || t('ceomail.errorSending')) }
    setBroadcastSending(false)
  }

  const handleDelete = async (emailId: string) => {
    if (!confirm(t('ceomail.deleteConfirm'))) return
    try {
      await api.ceoDeleteEmail(emailId)
      setEmails(prev => prev.filter(e => e.id !== emailId))
      setTotal(prev => prev - 1)
      if (selectedEmail?.id === emailId) { setSelectedEmail(null); setMobileView('list') }
    } catch (e: any) { alert(e.message || t('ceomail.errorDeleting')) }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(t('ceomail.bulkDeleteConfirm').replace('{count}', String(selectedIds.size)))) return
    try {
      await api.ceoDeleteEmailsBulk([...selectedIds])
      setEmails(prev => prev.filter(e => !selectedIds.has(e.id)))
      setTotal(prev => prev - selectedIds.size)
      setSelectedIds(new Set())
      if (selectedEmail && selectedIds.has(selectedEmail.id)) { setSelectedEmail(null); setMobileView('list') }
    } catch (e: any) { alert(e.message || t('ceomail.errorDeleting')) }
  }

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleReply = (email: EmailItem) => {
    setComposeMode('reply')
    setComposeTo(email.to_email || email.from_name || '')
    setComposeSubject(`Re: ${email.subject}`)
    setComposeBody(`\n\n${t('ceomail.originalMessage')}\n${stripHtml(email.body || '')}`)
    setShowCompose(true)
  }

  const handleForward = (email: EmailItem) => {
    setComposeMode('forward')
    setComposeTo('')
    setComposeSubject(`Fwd: ${email.subject}`)
    setComposeBody(`\n\n${t('ceomail.forwardedMessage')}\n${t('ceomail.forwardFrom')} ${email.from_name || email.to_email || ''}\n${t('ceomail.forwardSubject')} ${email.subject}\n\n${stripHtml(email.body || '')}`)
    setShowCompose(true)
  }

  const resetCompose = () => {
    setComposeTo(''); setComposeCc(''); setComposeBcc('')
    setComposeSubject(''); setComposeBody('')
    setComposeCta(''); setComposeCtaUrl('')
    setComposeMode('new')
  }

  const resetBroadcast = () => {
    setBroadcastSubject(''); setBroadcastBody('')
    setBroadcastFilter('all'); setBroadcastCta(''); setBroadcastCtaUrl('')
  }

  const saveSignature = () => {
    localStorage.setItem('conniku_ceo_signature', JSON.stringify(signature))
    setShowSignatureSettings(false)
  }

  const getSignatureHtml = (): string => {
    if (!signature.department) return ''
    return `
<br/><br/>
<div style="border-top:1px solid #d0d0d0;padding-top:12px;margin-top:16px;font-family:Arial,sans-serif;font-size:13px;color:#555;">
  —<br/>
  <strong style="color:#333;font-size:14px;">${signature.department}</strong><br/>
  <span style="color:#0078d4;">${signature.tagline}</span><br/>
  <span>${signature.location}</span><br/>
  <span>${signature.website}</span><br/>
  ${signature.showLogo ? '<img src="/logo.png" alt="Conniku" style="height:28px;margin-top:8px;" /><br/>' : ''}
  <em style="color:#888;">${signature.motto}</em>
</div>`
  }

  const insertFormatting = (tag: string) => {
    if (!bodyRef.current) return
    const ta = bodyRef.current
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const sel = ta.value.substring(start, end)
    const wrapped = tag === 'bold' ? `**${sel}**` : tag === 'italic' ? `*${sel}*` : tag === 'underline' ? `__${sel}__` : tag === 'list' ? `\n- ${sel}` : sel
    setComposeBody(ta.value.substring(0, start) + wrapped + ta.value.substring(end))
  }

  const filteredEmails = emails.filter(e => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!(e.subject?.toLowerCase().includes(q) || e.to_email?.toLowerCase().includes(q) || e.from_name?.toLowerCase().includes(q) || e.preview?.toLowerCase().includes(q))) return false
    }
    if (filterMode === 'unread' && e.read) return false
    if (filterMode === 'starred' && !e.starred) return false
    return true
  })

  if (user?.role !== 'owner') {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>{t('ceomail.restrictedAccess')}</p>
        <button onClick={() => onNavigate('/')} style={{ marginTop: 16, padding: '8px 24px', borderRadius: 6, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}>{t('ceomail.goBack')}</button>
      </div>
    )
  }

  const folderCounts = {
    inbox: stats?.total || total,
    sent: stats?.sent || 0,
    drafts: 0,
    starred: 0,
    trash: 0,
  }

  return (
    <div className="ceo-mail-root">
      <style>{`
        .ceo-mail-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
          overflow: hidden;
        }

        /* ─── Header Bar ─── */
        .mail-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          background: #0078d4;
          color: #fff;
          flex-shrink: 0;
          z-index: 10;
        }
        [data-theme="dark"] .mail-header,
        @media (prefers-color-scheme: dark) { .mail-header { background: #1a1a2e; border-bottom: 1px solid #333; } }
        .mail-header-title {
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -0.02em;
          white-space: nowrap;
        }
        .mail-header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: auto;
        }
        .mail-header-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.1);
          color: #fff;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .mail-header-btn:hover { background: rgba(255,255,255,0.2); }
        .mail-header-btn.primary { background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.4); }
        .mail-search-wrap {
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.15);
          border-radius: 4px;
          padding: 0 10px;
          flex: 1;
          max-width: 360px;
        }
        .mail-search-wrap svg { opacity: 0.7; }
        .mail-search {
          background: none;
          border: none;
          color: #fff;
          padding: 7px 8px;
          font-size: 13px;
          width: 100%;
          outline: none;
        }
        .mail-search::placeholder { color: rgba(255,255,255,0.6); }
        .mail-filter-tabs {
          display: flex;
          gap: 2px;
          margin-left: 8px;
        }
        .mail-filter-tab {
          padding: 5px 10px;
          font-size: 12px;
          border-radius: 3px;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          transition: all 0.15s;
        }
        .mail-filter-tab.active { background: rgba(255,255,255,0.2); color: #fff; font-weight: 600; }

        /* ─── Body (3 panels) ─── */
        .mail-body {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        /* ─── Left Folder Panel ─── */
        .mail-folders {
          width: 200px;
          min-width: 200px;
          background: var(--bg-secondary, #f3f3f3);
          border-right: 1px solid var(--border, #e0e0e0);
          padding: 8px 0;
          overflow-y: auto;
          flex-shrink: 0;
        }
        .mail-folder-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 16px;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.12s;
          color: var(--text-primary);
          border-left: 3px solid transparent;
        }
        .mail-folder-item:hover { background: var(--bg-hover, rgba(0,0,0,0.04)); }
        .mail-folder-item.active {
          background: var(--bg-hover, rgba(0,120,212,0.08));
          border-left-color: #0078d4;
          font-weight: 600;
          color: #0078d4;
        }
        .mail-folder-item svg { opacity: 0.7; flex-shrink: 0; }
        .mail-folder-item.active svg { opacity: 1; color: #0078d4; }
        .mail-folder-count {
          margin-left: auto;
          font-size: 11px;
          background: var(--bg-tertiary, #e0e0e0);
          color: var(--text-secondary);
          padding: 1px 7px;
          border-radius: 10px;
          font-weight: 600;
        }
        .mail-folder-divider {
          height: 1px;
          background: var(--border, #e0e0e0);
          margin: 8px 16px;
        }
        .mail-folder-section {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-tertiary, #999);
          padding: 12px 16px 4px;
          font-weight: 600;
        }

        /* ─── Center Message List ─── */
        .mail-list {
          width: 360px;
          min-width: 280px;
          border-right: 1px solid var(--border, #e0e0e0);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--bg-primary);
        }
        .mail-list-toolbar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-bottom: 1px solid var(--border, #e0e0e0);
          background: var(--bg-secondary, #fafafa);
          font-size: 12px;
          flex-shrink: 0;
        }
        .mail-list-toolbar label {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          color: var(--text-secondary);
        }
        .mail-list-toolbar input[type="checkbox"] { accent-color: #0078d4; }
        .mail-list-scroll {
          flex: 1;
          overflow-y: auto;
        }
        .mail-list-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 11px 14px;
          border-bottom: 1px solid var(--border, #f0f0f0);
          cursor: pointer;
          transition: background 0.1s;
          position: relative;
        }
        .mail-list-item:hover { background: var(--bg-hover, #f5f5f5); }
        .mail-list-item.selected { background: var(--bg-hover, rgba(0,120,212,0.06)); }
        .mail-list-item.active { background: rgba(0,120,212,0.1); border-left: 3px solid #0078d4; }
        .mail-list-item.unread { font-weight: 600; }
        .mail-list-item.unread::before {
          content: '';
          position: absolute;
          left: 4px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #0078d4;
        }
        .mail-item-checkbox {
          margin-top: 2px;
          accent-color: #0078d4;
          flex-shrink: 0;
        }
        .mail-item-content {
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }
        .mail-item-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .mail-item-sender {
          font-size: 13px;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mail-item-date {
          font-size: 11px;
          color: var(--text-tertiary, #999);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .mail-item-subject {
          font-size: 12.5px;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 2px 0 1px;
        }
        .mail-item-preview {
          font-size: 12px;
          color: var(--text-tertiary, #999);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: 400;
        }
        .mail-item-star {
          cursor: pointer;
          flex-shrink: 0;
          opacity: 0.3;
          transition: opacity 0.15s;
          margin-top: 2px;
        }
        .mail-item-star:hover, .mail-item-star.active { opacity: 1; color: #f5a623; }
        .mail-item-badge {
          display: inline-block;
          font-size: 10px;
          padding: 1px 6px;
          border-radius: 3px;
          font-weight: 600;
          margin-right: 6px;
        }
        .mail-item-badge.system { background: #e8f0fe; color: #1967d2; }
        .mail-item-badge.broadcast { background: #fef3e0; color: #e65100; }
        .mail-item-badge.direct { background: #e8f5e9; color: #2e7d32; }

        .mail-list-empty {
          padding: 40px 20px;
          text-align: center;
          color: var(--text-tertiary, #999);
          font-size: 14px;
        }

        .mail-list-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 8px;
          border-top: 1px solid var(--border, #e0e0e0);
          font-size: 12px;
          color: var(--text-secondary);
          flex-shrink: 0;
        }
        .mail-list-pagination button {
          background: none;
          border: 1px solid var(--border, #ddd);
          border-radius: 4px;
          padding: 4px 10px;
          cursor: pointer;
          color: var(--text-secondary);
          font-size: 12px;
        }
        .mail-list-pagination button:disabled { opacity: 0.3; cursor: default; }

        /* ─── Right Reading Pane ─── */
        .mail-reading {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--bg-primary);
        }
        .mail-reading-empty {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 12px;
          color: var(--text-tertiary, #bbb);
        }
        .mail-reading-empty svg { opacity: 0.3; }
        .mail-reading-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border, #e0e0e0);
          flex-shrink: 0;
        }
        .mail-reading-subject {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        .mail-reading-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          color: var(--text-secondary);
          flex-wrap: wrap;
        }
        .mail-reading-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #0078d4;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          flex-shrink: 0;
        }
        .mail-reading-actions {
          display: flex;
          gap: 6px;
          padding: 8px 20px;
          border-bottom: 1px solid var(--border, #e0e0e0);
          flex-shrink: 0;
        }
        .mail-action-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 4px;
          border: 1px solid var(--border, #ddd);
          background: var(--bg-secondary, #fafafa);
          color: var(--text-primary);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.12s;
        }
        .mail-action-btn:hover { background: var(--bg-hover, #eee); border-color: #0078d4; color: #0078d4; }
        .mail-action-btn.danger:hover { border-color: #d32f2f; color: #d32f2f; }
        .mail-reading-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          font-size: 14px;
          line-height: 1.65;
          color: var(--text-primary);
        }
        .mail-reading-body img { max-width: 100%; }

        /* ─── Compose Modal ─── */
        .mail-compose-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mail-compose {
          background: var(--bg-primary, #fff);
          border-radius: 8px;
          width: 680px;
          max-width: 95vw;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 40px rgba(0,0,0,0.25);
          overflow: hidden;
        }
        .mail-compose-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: #0078d4;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
        }
        [data-theme="dark"] .mail-compose-header { background: #1a1a2e; }
        .mail-compose-header button {
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          padding: 4px;
          display: flex;
        }
        .mail-compose-fields {
          padding: 0;
          border-bottom: 1px solid var(--border, #e0e0e0);
        }
        .mail-compose-field {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-bottom: 1px solid var(--border, #f0f0f0);
          font-size: 13px;
        }
        .mail-compose-field label {
          font-weight: 600;
          color: var(--text-secondary);
          width: 60px;
          flex-shrink: 0;
          font-size: 12px;
        }
        .mail-compose-field input {
          flex: 1;
          border: none;
          background: none;
          font-size: 13px;
          color: var(--text-primary);
          outline: none;
          padding: 4px 0;
        }
        .mail-compose-toolbar {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 6px 16px;
          border-bottom: 1px solid var(--border, #e0e0e0);
          background: var(--bg-secondary, #fafafa);
        }
        .mail-compose-toolbar button {
          background: none;
          border: 1px solid transparent;
          border-radius: 3px;
          padding: 4px 8px;
          cursor: pointer;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
          transition: all 0.1s;
        }
        .mail-compose-toolbar button:hover { background: var(--bg-hover, #e8e8e8); border-color: var(--border, #ddd); }
        .mail-compose-body {
          flex: 1;
          padding: 0;
          min-height: 200px;
        }
        .mail-compose-body textarea {
          width: 100%;
          height: 100%;
          min-height: 200px;
          border: none;
          background: none;
          font-size: 14px;
          color: var(--text-primary);
          padding: 16px;
          resize: none;
          outline: none;
          font-family: inherit;
          line-height: 1.6;
        }
        .mail-compose-cta {
          padding: 8px 16px;
          border-top: 1px solid var(--border, #e0e0e0);
          display: flex;
          gap: 8px;
          align-items: center;
          font-size: 12px;
        }
        .mail-compose-cta input {
          flex: 1;
          padding: 6px 10px;
          border-radius: 4px;
          border: 1px solid var(--border, #ddd);
          background: var(--bg-secondary, #fafafa);
          font-size: 12px;
          color: var(--text-primary);
          outline: none;
        }
        .mail-compose-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-top: 1px solid var(--border, #e0e0e0);
          background: var(--bg-secondary, #fafafa);
        }
        .mail-compose-footer .left { display: flex; gap: 8px; }
        .mail-compose-footer .right { display: flex; gap: 8px; }
        .mail-btn {
          padding: 7px 20px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          border: 1px solid transparent;
        }
        .mail-btn.primary { background: #0078d4; color: #fff; }
        .mail-btn.primary:hover { background: #106ebe; }
        .mail-btn.primary:disabled { opacity: 0.5; cursor: default; }
        .mail-btn.secondary { background: var(--bg-primary, #fff); border-color: var(--border, #ddd); color: var(--text-primary); }
        .mail-btn.secondary:hover { background: var(--bg-hover, #f0f0f0); }
        .mail-btn.danger { background: none; border-color: #d32f2f; color: #d32f2f; }
        .mail-btn.danger:hover { background: #fbe9e7; }

        /* ─── Signature Settings ─── */
        .sig-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          z-index: 1001;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sig-modal {
          background: var(--bg-primary, #fff);
          border-radius: 8px;
          width: 520px;
          max-width: 95vw;
          box-shadow: 0 8px 40px rgba(0,0,0,0.25);
          overflow: hidden;
        }
        .sig-header {
          padding: 14px 20px;
          background: #0078d4;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        [data-theme="dark"] .sig-header { background: #1a1a2e; }
        .sig-body { padding: 20px; }
        .sig-field {
          margin-bottom: 12px;
        }
        .sig-field label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }
        .sig-field input {
          width: 100%;
          padding: 8px 10px;
          border-radius: 4px;
          border: 1px solid var(--border, #ddd);
          background: var(--bg-secondary, #fafafa);
          font-size: 13px;
          color: var(--text-primary);
          outline: none;
        }
        .sig-field input:focus { border-color: #0078d4; }
        .sig-preview {
          border: 1px solid var(--border, #e0e0e0);
          border-radius: 6px;
          padding: 16px;
          margin: 16px 0;
          background: var(--bg-secondary, #fafafa);
        }
        .sig-preview-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-tertiary);
          margin-bottom: 8px;
          font-weight: 600;
        }
        .sig-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 12px 20px;
          border-top: 1px solid var(--border, #e0e0e0);
        }

        /* ─── Mobile ─── */
        @media (max-width: 768px) {
          .mail-folders { display: none; }
          .mail-list { width: 100%; min-width: 0; border-right: none; }
          .mail-body.mobile-reading .mail-list { display: none; }
          .mail-body.mobile-list .mail-reading { display: none; }
          .mail-reading { width: 100%; }
          .mail-header { padding: 8px 12px; gap: 8px; flex-wrap: wrap; }
          .mail-search-wrap { max-width: 100%; order: 10; }
          .mail-filter-tabs { display: none; }
          .mail-compose { width: 100%; max-width: 100%; height: 100vh; max-height: 100vh; border-radius: 0; }
          .mail-reading-header { padding: 12px 14px; }
          .mail-reading-body { padding: 14px; }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .mail-folders { width: 160px; min-width: 160px; }
          .mail-list { width: 280px; min-width: 240px; }
        }

        /* ─── Scrollbar ─── */
        .mail-list-scroll::-webkit-scrollbar,
        .mail-reading-body::-webkit-scrollbar { width: 6px; }
        .mail-list-scroll::-webkit-scrollbar-thumb,
        .mail-reading-body::-webkit-scrollbar-thumb { background: var(--border, #ccc); border-radius: 3px; }

        /* ─── Loading ─── */
        .mail-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: var(--text-tertiary);
        }
        @keyframes mail-spin { to { transform: rotate(360deg); } }
        .mail-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid var(--border, #ddd);
          border-top-color: #0078d4;
          border-radius: 50%;
          animation: mail-spin 0.8s linear infinite;
        }

        /* Back button for mobile */
        .mail-back-btn {
          display: none;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: #0078d4;
          font-size: 13px;
          cursor: pointer;
          padding: 4px 0;
          margin-bottom: 8px;
        }
        @media (max-width: 768px) {
          .mail-back-btn { display: flex; }
        }
      `}</style>

      {/* ─── Header Bar ─── */}
      <div className="mail-header">
        <button onClick={() => onNavigate('/ceo')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', padding: 4 }}>
          <ChevronLeft size={18} />
        </button>
        <span className="mail-header-title">{t('ceomail.title')}</span>

        <div className="mail-search-wrap">
          <Search size={14} />
          <input
            className="mail-search"
            placeholder={t('ceomail.searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="mail-filter-tabs">
          {(['all', 'unread', 'starred'] as FilterMode[]).map(f => (
            <button
              key={f}
              className={`mail-filter-tab ${filterMode === f ? 'active' : ''}`}
              onClick={() => setFilterMode(f)}
            >
              {f === 'all' ? t('ceomail.filterAll') : f === 'unread' ? t('ceomail.filterUnread') : t('ceomail.filterStarred')}
            </button>
          ))}
        </div>

        <div className="mail-header-actions">
          <button className="mail-header-btn" onClick={() => loadEmails(1)} title={t('ceo.refresh')}>
            <RefreshCw size={14} />
          </button>
          <button className="mail-header-btn" onClick={() => { resetCompose(); setShowCompose(true) }}>
            <Plus size={14} /> {t('ceomail.new')}
          </button>
          <button className="mail-header-btn" onClick={() => setShowBroadcast(true)}>
            <Megaphone size={14} /> {t('ceomail.broadcast')}
          </button>
          <button className="mail-header-btn" onClick={() => setShowSignatureSettings(true)} title={t('ceomail.settings')}>
            <Settings size={14} /> {t('ceomail.settings')}
          </button>
        </div>
      </div>

      {/* ─── Body ─── */}
      <div className={`mail-body ${mobileView === 'reading' ? 'mobile-reading' : 'mobile-list'}`}>

        {/* Left Folder Panel */}
        <div className="mail-folders">
          <div className="mail-folder-section">{t('ceomail.accountSection')}</div>
          {([
            { key: 'all' as const, label: t('ceomail.allAccounts'), color: '#64748B' },
            { key: 'ceo' as const, label: 'ceo@conniku.com', color: '#0078d4' },
            { key: 'contacto' as const, label: 'contacto@conniku.com', color: '#10B981' },
          ]).map(a => (
            <div
              key={a.key}
              className={`mail-folder-item ${activeAccount === a.key ? 'active' : ''}`}
              onClick={() => { setActiveAccount(a.key); setSelectedEmail(null) }}
              style={activeAccount === a.key ? { borderLeftColor: a.color } : {}}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12 }}>{a.label}</span>
            </div>
          ))}
          <div className="mail-folder-divider" />
          <div className="mail-folder-section">{t('ceomail.foldersSection')}</div>
          {([
            { key: 'inbox' as Folder, icon: <Inbox size={15} />, label: t('ceomail.inbox') },
            { key: 'sent' as Folder, icon: <Send size={15} />, label: t('ceomail.sent') },
            { key: 'drafts' as Folder, icon: <Pencil size={15} />, label: t('ceomail.drafts') },
            { key: 'starred' as Folder, icon: <Star size={15} />, label: t('ceomail.starred') },
            { key: 'trash' as Folder, icon: <Trash2 size={15} />, label: t('ceomail.trash') },
          ]).map(f => (
            <div
              key={f.key}
              className={`mail-folder-item ${folder === f.key ? 'active' : ''}`}
              onClick={() => { setFolder(f.key); setSelectedEmail(null); setMobileView('list') }}
            >
              {f.icon}
              <span>{f.label}</span>
              {(folderCounts[f.key] || 0) > 0 && (
                <span className="mail-folder-count">{folderCounts[f.key]}</span>
              )}
            </div>
          ))}
          <div className="mail-folder-divider" />
          <div className="mail-folder-section">{t('ceomail.statsSection')}</div>
          {stats && (
            <div style={{ padding: '4px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>{t('ceomail.totalSent')}</span><strong>{stats.sent || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>{t('ceomail.unread')}</span><strong style={{ color: '#0078d4' }}>{stats.unread || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t('ceomail.total')}</span><strong>{stats.total || 0}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Center Message List */}
        <div className="mail-list">
          <div className="mail-list-toolbar">
            <label>
              <input
                type="checkbox"
                checked={selectedIds.size > 0 && selectedIds.size === filteredEmails.length}
                onChange={() => {
                  if (selectedIds.size === filteredEmails.length) setSelectedIds(new Set())
                  else setSelectedIds(new Set(filteredEmails.map(e => e.id)))
                }}
              />
              {t('ceomail.select')}
            </label>
            {selectedIds.size > 0 && (
              <button className="mail-action-btn danger" style={{ fontSize: 11, padding: '3px 8px' }} onClick={handleBulkDelete}>
                <Trash2 size={12} /> {t('ceomail.delete')} ({selectedIds.size})
              </button>
            )}
            <span style={{ marginLeft: 'auto', color: 'var(--text-tertiary)', fontSize: 11 }}>
              {filteredEmails.length} {t('ceomail.of')} {total}
            </span>
          </div>

          <div className="mail-list-scroll">
            {loading ? (
              <div className="mail-loading"><div className="mail-spinner" /></div>
            ) : filteredEmails.length === 0 ? (
              <div className="mail-list-empty">
                <Inbox size={32} />
                <p style={{ marginTop: 8 }}>{t('ceomail.noEmails')}</p>
              </div>
            ) : (
              filteredEmails.map(email => (
                <div
                  key={email.id}
                  className={`mail-list-item ${!email.read ? 'unread' : ''} ${selectedEmail?.id === email.id ? 'active' : ''} ${selectedIds.has(email.id) ? 'selected' : ''}`}
                  onClick={() => selectEmail(email)}
                >
                  <input
                    type="checkbox"
                    className="mail-item-checkbox"
                    checked={selectedIds.has(email.id)}
                    onClick={e => toggleSelection(email.id, e)}
                    onChange={() => {}}
                  />
                  <div className="mail-item-content">
                    <div className="mail-item-top">
                      <span className="mail-item-sender">
                        {email.email_type && (
                          <span className={`mail-item-badge ${email.email_type === 'broadcast' ? 'broadcast' : email.email_type === 'system' ? 'system' : 'direct'}`}>
                            {email.email_type === 'broadcast' ? t('ceomail.typeBroadcast') : email.email_type === 'system' ? t('ceomail.typeSystem') : t('ceomail.typeDirect')}
                          </span>
                        )}
                        {email.to_email || email.from_name || t('ceomail.unknown')}
                      </span>
                      <span className="mail-item-date">{formatDate(email.created_at)}</span>
                    </div>
                    <div className="mail-item-subject">{email.subject || t('ceomail.noSubject')}</div>
                    <div className="mail-item-preview">{email.preview || stripHtml(email.body || '').slice(0, 100)}</div>
                  </div>
                  <div
                    className={`mail-item-star ${email.starred ? 'active' : ''}`}
                    onClick={e => { e.stopPropagation() }}
                  >
                    <Star size={14} />
                  </div>
                </div>
              ))
            )}
          </div>

          {total > 20 && (
            <div className="mail-list-pagination">
              <button disabled={page <= 1} onClick={() => loadEmails(page - 1)}>
                <ChevronLeft size={12} /> {t('ceomail.previous')}
              </button>
              <span>{t('ceomail.page')} {page}</span>
              <button disabled={filteredEmails.length < 20} onClick={() => loadEmails(page + 1)}>
                {t('ceomail.next')} <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Right Reading Pane */}
        <div className="mail-reading">
          {!selectedEmail ? (
            <div className="mail-reading-empty">
              <Inbox size={48} />
              <p style={{ fontSize: 15 }}>{t('ceomail.selectToRead')}</p>
              <p style={{ fontSize: 12, marginTop: -4 }}>{t('ceomail.shortcuts')}</p>
            </div>
          ) : (
            <>
              <button className="mail-back-btn" onClick={() => { setSelectedEmail(null); setMobileView('list') }}>
                <ChevronLeft size={14} /> {t('ceomail.backToList')}
              </button>
              <div className="mail-reading-header">
                <div className="mail-reading-subject">{selectedEmail.subject}</div>
                <div className="mail-reading-meta">
                  <div className="mail-reading-avatar">
                    {(selectedEmail.to_email || selectedEmail.from_name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{selectedEmail.to_email || selectedEmail.from_name || 'Conniku'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{formatDate(selectedEmail.created_at)}</div>
                  </div>
                  {selectedEmail.email_type && (
                    <span className={`mail-item-badge ${selectedEmail.email_type === 'broadcast' ? 'broadcast' : selectedEmail.email_type === 'system' ? 'system' : 'direct'}`}>
                      {selectedEmail.email_type === 'broadcast' ? 'Masivo' : selectedEmail.email_type === 'system' ? 'Sistema' : 'Directo'}
                    </span>
                  )}
                  {selectedEmail.status && (
                    <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {selectedEmail.status === 'delivered' ? <><CheckCircle size={12} /> {t('ceomail.delivered')}</> :
                       selectedEmail.status === 'pending' ? <><Clock size={12} /> {t('ceomail.pending')}</> :
                       selectedEmail.status === 'failed' ? <><AlertTriangle size={12} /> {t('ceomail.error')}</> :
                       selectedEmail.status}
                    </span>
                  )}
                </div>
              </div>
              <div className="mail-reading-actions">
                <button className="mail-action-btn" onClick={() => handleReply(selectedEmail)}>
                  <Send size={12} /> {t('ceomail.reply')}
                </button>
                <button className="mail-action-btn" onClick={() => handleForward(selectedEmail)}>
                  <Send size={12} /> {t('ceomail.forward')}
                </button>
                <button className="mail-action-btn danger" onClick={() => handleDelete(selectedEmail.id)}>
                  <Trash2 size={12} /> {t('ceomail.delete')}
                </button>
              </div>
              <div
                className="mail-reading-body"
                dangerouslySetInnerHTML={{ __html: selectedEmail.body || `<p style="color:#999;">${t('ceomail.noContent')}</p>` }}
              />
            </>
          )}
        </div>
      </div>

      {/* ─── Compose Modal ─── */}
      {showCompose && (
        <div className="mail-compose-overlay" onClick={() => setShowCompose(false)}>
          <div className="mail-compose" onClick={e => e.stopPropagation()}>
            <div className="mail-compose-header">
              <span>{composeMode === 'reply' ? t('ceomail.composeReply') : composeMode === 'forward' ? t('ceomail.composeForward') : t('ceomail.composeNew')}</span>
              <button onClick={() => setShowCompose(false)}><X size={16} /></button>
            </div>
            <div className="mail-compose-fields">
              <div className="mail-compose-field">
                <label>{t('ceomail.from')}</label>
                <select value={composeFrom} onChange={e => setComposeFrom(e.target.value as 'ceo' | 'contacto')}
                  style={{ flex: 1, padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border, #ddd)', background: 'var(--bg-secondary, #f5f5f5)', color: 'var(--text-primary)', fontSize: 13 }}>
                  <option value="ceo">ceo@conniku.com</option>
                  <option value="contacto">contacto@conniku.com</option>
                </select>
              </div>
              <div className="mail-compose-field">
                <label>{t('ceomail.to')}</label>
                <input value={composeTo} onChange={e => setComposeTo(e.target.value)} placeholder={t('ceomail.toPlaceholder')} />
              </div>
              <div className="mail-compose-field">
                <label>{t('ceomail.cc')}</label>
                <input value={composeCc} onChange={e => setComposeCc(e.target.value)} placeholder={t('ceomail.optional')} />
              </div>
              <div className="mail-compose-field">
                <label>{t('ceomail.bcc')}</label>
                <input value={composeBcc} onChange={e => setComposeBcc(e.target.value)} placeholder={t('ceomail.optional')} />
              </div>
              <div className="mail-compose-field">
                <label>{t('ceomail.subject')}</label>
                <input value={composeSubject} onChange={e => setComposeSubject(e.target.value)} placeholder={t('ceomail.subjectPlaceholder')} />
              </div>
            </div>
            <div className="mail-compose-toolbar">
              <button onClick={() => insertFormatting('bold')} title={t('ceomail.bold')}><strong>N</strong></button>
              <button onClick={() => insertFormatting('italic')} title={t('ceomail.italic')}><em>C</em></button>
              <button onClick={() => insertFormatting('underline')} title={t('ceomail.underline')}><u>S</u></button>
              <span style={{ width: 1, height: 16, background: 'var(--border, #ddd)', margin: '0 4px' }} />
              <button onClick={() => insertFormatting('list')} title={t('ceomail.list')}>• {t('ceomail.list')}</button>
              <span style={{ width: 1, height: 16, background: 'var(--border, #ddd)', margin: '0 4px' }} />
              <button title={t('ceomail.attach')}><Paperclip size={13} /></button>
            </div>
            <div className="mail-compose-body">
              <textarea
                ref={bodyRef}
                value={composeBody}
                onChange={e => setComposeBody(e.target.value)}
                placeholder={t('ceomail.bodyPlaceholder')}
              />
            </div>
            <div className="mail-compose-cta">
              <span style={{ fontWeight: 600, fontSize: 11, color: 'var(--text-secondary)' }}>{t('ceomail.ctaOptional')}</span>
              <input value={composeCta} onChange={e => setComposeCta(e.target.value)} placeholder={t('ceomail.ctaTextPlaceholder')} />
              <input value={composeCtaUrl} onChange={e => setComposeCtaUrl(e.target.value)} placeholder={t('ceomail.ctaUrlPlaceholder')} />
            </div>
            <div className="mail-compose-footer">
              <div className="left">
                <button className="mail-btn primary" disabled={composeSending || !composeTo || !composeSubject} onClick={handleSend}>
                  {composeSending ? t('ceomail.sending') : t('ceomail.send')}
                </button>
                <button className="mail-btn secondary" onClick={() => setShowCompose(false)}>{t('ceomail.saveDraft')}</button>
              </div>
              <div className="right">
                <button className="mail-btn danger" onClick={() => { setShowCompose(false); resetCompose() }}>{t('ceomail.discard')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Broadcast Modal ─── */}
      {showBroadcast && (
        <div className="mail-compose-overlay" onClick={() => setShowBroadcast(false)}>
          <div className="mail-compose" onClick={e => e.stopPropagation()}>
            <div className="mail-compose-header" style={{ background: '#e65100' }}>
              <span>{t('ceomail.broadcastTitle')}</span>
              <button onClick={() => setShowBroadcast(false)}><X size={16} /></button>
            </div>
            <div className="mail-compose-fields">
              <div className="mail-compose-field">
                <label>{t('ceomail.filterLabel')}</label>
                <select
                  value={broadcastFilter}
                  onChange={e => setBroadcastFilter(e.target.value)}
                  style={{ flex: 1, border: 'none', background: 'none', fontSize: 13, color: 'var(--text-primary)', outline: 'none', padding: '4px 0' }}
                >
                  <option value="all">{t('ceomail.filterAllUsers')}</option>
                  <option value="active">{t('ceomail.filterActiveUsers')}</option>
                  <option value="premium">{t('ceomail.filterPremiumUsers')}</option>
                </select>
              </div>
              <div className="mail-compose-field">
                <label>{t('ceomail.subject')}</label>
                <input value={broadcastSubject} onChange={e => setBroadcastSubject(e.target.value)} placeholder={t('ceomail.broadcastSubjectPlaceholder')} />
              </div>
            </div>
            <div className="mail-compose-body">
              <textarea
                value={broadcastBody}
                onChange={e => setBroadcastBody(e.target.value)}
                placeholder={t('ceomail.broadcastBodyPlaceholder')}
              />
            </div>
            <div className="mail-compose-cta">
              <span style={{ fontWeight: 600, fontSize: 11, color: 'var(--text-secondary)' }}>{t('ceomail.ctaOptional')}</span>
              <input value={broadcastCta} onChange={e => setBroadcastCta(e.target.value)} placeholder={t('ceomail.ctaTextPlaceholder')} />
              <input value={broadcastCtaUrl} onChange={e => setBroadcastCtaUrl(e.target.value)} placeholder={t('ceomail.ctaUrlPlaceholder')} />
            </div>
            <div className="mail-compose-footer">
              <div className="left">
                <button className="mail-btn primary" style={{ background: '#e65100' }} disabled={broadcastSending || !broadcastSubject || !broadcastBody} onClick={handleBroadcast}>
                  {broadcastSending ? t('ceomail.sending') : t('ceomail.sendBroadcast')}
                </button>
              </div>
              <div className="right">
                <button className="mail-btn danger" onClick={() => { setShowBroadcast(false); resetBroadcast() }}>{t('ceomail.cancel')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Signature Settings Modal ─── */}
      {showSignatureSettings && (
        <div className="sig-overlay" onClick={() => setShowSignatureSettings(false)}>
          <div className="sig-modal" onClick={e => e.stopPropagation()}>
            <div className="sig-header">
              <span>{t('ceomail.configureSignature')}</span>
              <button onClick={() => setShowSignatureSettings(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <div className="sig-body">
              <div className="sig-field">
                <label>{t('ceomail.department')}</label>
                <input value={signature.department} onChange={e => setSignature(s => ({ ...s, department: e.target.value }))} placeholder={t('ceomail.departmentPlaceholder')} />
              </div>
              <div className="sig-field">
                <label>{t('ceomail.tagline')}</label>
                <input value={signature.tagline} onChange={e => setSignature(s => ({ ...s, tagline: e.target.value }))} />
              </div>
              <div className="sig-field">
                <label>{t('ceomail.location')}</label>
                <input value={signature.location} onChange={e => setSignature(s => ({ ...s, location: e.target.value }))} />
              </div>
              <div className="sig-field">
                <label>{t('ceomail.website')}</label>
                <input value={signature.website} onChange={e => setSignature(s => ({ ...s, website: e.target.value }))} />
              </div>
              <div className="sig-field">
                <label>{t('ceomail.motto')}</label>
                <input value={signature.motto} onChange={e => setSignature(s => ({ ...s, motto: e.target.value }))} />
              </div>
              <div className="sig-field">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={signature.showLogo} onChange={e => setSignature(s => ({ ...s, showLogo: e.target.checked }))} style={{ accentColor: '#0078d4' }} />
                  {t('ceomail.includeLogo')}
                </label>
              </div>

              <div className="sig-preview">
                <div className="sig-preview-title">{t('ceomail.preview')}</div>
                <div style={{ borderTop: '1px solid #d0d0d0', paddingTop: 12, fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#555' }}>
                  —<br />
                  <strong style={{ color: '#333', fontSize: 14 }}>{signature.department}</strong><br />
                  <span style={{ color: '#0078d4' }}>{signature.tagline}</span><br />
                  <span>{signature.location}</span><br />
                  <span>{signature.website}</span><br />
                  {signature.showLogo && <><img src="/logo.png" alt="Conniku" style={{ height: 28, marginTop: 8 }} /><br /></>}
                  <em style={{ color: '#888' }}>{signature.motto}</em>
                </div>
              </div>
            </div>
            <div className="sig-footer">
              <button className="mail-btn secondary" onClick={() => setShowSignatureSettings(false)}>{t('ceomail.cancelSig')}</button>
              <button className="mail-btn primary" onClick={saveSignature}>{t('ceomail.saveSignature')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Mock data when API is not available
function getMockEmails(folder: Folder): EmailItem[] {
  if (folder === 'trash' || folder === 'drafts') return []
  const now = new Date()
  return [
    {
      id: 'mock-1',
      from_name: 'Sistema Conniku',
      to_email: 'sistema@conniku.com',
      subject: 'Reporte semanal de actividad',
      body: '<p>Estimado CEO,</p><p>Este es el resumen semanal de actividad en la plataforma Conniku:</p><ul><li>Nuevos usuarios registrados: <strong>47</strong></li><li>Sesiones de tutoria completadas: <strong>128</strong></li><li>Cursos iniciados: <strong>89</strong></li><li>Tasa de retencion: <strong>94.2%</strong></li></ul><p>Las metricas muestran un crecimiento sostenido respecto a la semana anterior.</p><p>Saludos,<br/>Sistema Conniku</p>',
      preview: 'Este es el resumen semanal de actividad en la plataforma Conniku...',
      email_type: 'system',
      status: 'delivered',
      created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      read: false,
      starred: true,
    },
    {
      id: 'mock-2',
      from_name: 'Alerta Tutor',
      to_email: 'tutores@conniku.com',
      subject: 'Nuevo tutor pendiente de aprobacion',
      body: '<p>Un nuevo tutor ha solicitado unirse a la plataforma:</p><p><strong>Maria Gonzalez</strong> - Especialista en Matematicas<br/>Universidad de Chile, 8 anos de experiencia.</p><p>Por favor revise su perfil y apruebe o rechace la solicitud desde el panel de administracion.</p>',
      preview: 'Un nuevo tutor ha solicitado unirse a la plataforma: Maria Gonzalez...',
      email_type: 'system',
      status: 'delivered',
      created_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      read: false,
      starred: false,
    },
    {
      id: 'mock-3',
      to_email: 'juan.perez@email.com',
      from_name: 'CEO Conniku',
      subject: 'Bienvenido al programa premium',
      body: '<p>Hola Juan,</p><p>Te damos la bienvenida al programa premium de Conniku. Ahora tienes acceso a:</p><ul><li>Tutorias ilimitadas</li><li>Contenido exclusivo</li><li>Certificaciones oficiales</li><li>Soporte prioritario</li></ul><p>Si tienes alguna pregunta, no dudes en contactarnos.</p><p>Saludos cordiales,<br/>Cristian G.<br/>CEO, Conniku</p>',
      preview: 'Te damos la bienvenida al programa premium de Conniku...',
      email_type: 'direct',
      status: 'delivered',
      created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      read: true,
      starred: false,
    },
    {
      id: 'mock-4',
      to_email: 'todos@conniku.com',
      from_name: 'CEO Conniku',
      subject: 'Actualizacion importante de la plataforma',
      body: '<p>Estimados usuarios,</p><p>Nos complace anunciar las siguientes mejoras en Conniku:</p><ol><li>Nuevo sistema de mensajeria en tiempo real</li><li>Mejoras en el rendimiento de las salas de estudio</li><li>Nuevas herramientas de colaboracion</li><li>Integracion con calendario</li></ol><p>Estas mejoras ya estan disponibles para todos los usuarios.</p><p>Gracias por ser parte de Conniku.</p>',
      preview: 'Nos complace anunciar las siguientes mejoras en Conniku...',
      email_type: 'broadcast',
      status: 'delivered',
      created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
      starred: true,
    },
    {
      id: 'mock-5',
      from_name: 'Alerta Financiera',
      to_email: 'finanzas@conniku.com',
      subject: 'Resumen de ingresos - Marzo 2026',
      body: '<p>Resumen financiero del mes:</p><table style="border-collapse:collapse;width:100%;"><tr style="background:#f0f0f0;"><th style="padding:8px;text-align:left;border:1px solid #ddd;">Concepto</th><th style="padding:8px;text-align:right;border:1px solid #ddd;">Monto (CLP)</th></tr><tr><td style="padding:8px;border:1px solid #ddd;">Suscripciones Premium</td><td style="padding:8px;text-align:right;border:1px solid #ddd;">$4.250.000</td></tr><tr><td style="padding:8px;border:1px solid #ddd;">Tutorias</td><td style="padding:8px;text-align:right;border:1px solid #ddd;">$1.890.000</td></tr><tr><td style="padding:8px;border:1px solid #ddd;">Marketplace</td><td style="padding:8px;text-align:right;border:1px solid #ddd;">$780.000</td></tr><tr style="font-weight:bold;"><td style="padding:8px;border:1px solid #ddd;">Total</td><td style="padding:8px;text-align:right;border:1px solid #ddd;">$6.920.000</td></tr></table>',
      preview: 'Resumen financiero del mes: Suscripciones Premium $4.250.000...',
      email_type: 'system',
      status: 'delivered',
      created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
      starred: false,
    },
  ]
}
