import React, { useState } from 'react'
import { useI18n } from '../services/i18n'
import { useAuth } from '../services/auth'

const CONTACT_EMAIL = 'soporte@studyhub.app'

interface Suggestion {
  id: string
  type: string
  subject: string
  message: string
  date: string
  status: 'sent' | 'reviewed'
}

function loadSuggestions(): Suggestion[] {
  try { return JSON.parse(localStorage.getItem('studyhub_suggestions') || '[]') }
  catch { return [] }
}

function saveSuggestions(items: Suggestion[]) {
  localStorage.setItem('studyhub_suggestions', JSON.stringify(items))
}

export default function Suggestions() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [type, setType] = useState('feature')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [history, setHistory] = useState<Suggestion[]>(loadSuggestions)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return

    const newSuggestion: Suggestion = {
      id: Date.now().toString(36),
      type,
      subject: subject.trim(),
      message: message.trim(),
      date: new Date().toISOString(),
      status: 'sent',
    }

    const updated = [newSuggestion, ...history]
    setHistory(updated)
    saveSuggestions(updated)
    setSubject('')
    setMessage('')
    setSent(true)
    setTimeout(() => setSent(false), 4000)
  }

  const typeOptions = [
    { value: 'feature', label: t('sug.feature'), icon: '💡' },
    { value: 'bug', label: t('sug.bug'), icon: '🐛' },
    { value: 'improvement', label: t('sug.improvement'), icon: '🔧' },
    { value: 'other', label: t('sug.other'), icon: '💬' },
  ]

  return (
    <>
      <div className="page-header">
        <h2>{t('sug.title')}</h2>
        <p>{t('sug.subtitle')}</p>
      </div>
      <div className="page-body">
        {sent && <div className="profile-toast">{t('sug.sent')}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, maxWidth: 960 }}>
          {/* Form */}
          <div className="card" style={{ padding: 28 }}>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{t('sug.type')}</label>
                <div className="sug-types">
                  {typeOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`sug-type-btn ${type === opt.value ? 'active' : ''}`}
                      onClick={() => setType(opt.value)}
                    >
                      <span>{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>{t('sug.subject')}</label>
                <input
                  className="form-input"
                  placeholder={t('sug.subjectPlaceholder')}
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>{t('sug.message')}</label>
                <textarea
                  className="form-input"
                  placeholder={t('sug.messagePlaceholder')}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={6}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {t('sug.send')}
              </button>
            </form>
          </div>

          {/* Sidebar: contact + history */}
          <div>
            {/* Contact card */}
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <h4 style={{ fontSize: 14, marginBottom: 12 }}>📧 {t('sug.contact')}</h4>
              <a href={`mailto:${CONTACT_EMAIL}`} className="sug-email">{CONTACT_EMAIL}</a>
            </div>

            {/* Previous suggestions */}
            {history.length > 0 && (
              <div className="card" style={{ padding: 20 }}>
                <h4 style={{ fontSize: 14, marginBottom: 12 }}>{t('sug.previous')}</h4>
                <div className="sug-history">
                  {history.slice(0, 5).map(item => (
                    <div key={item.id} className="sug-history-item">
                      <div className="sug-history-type">
                        {typeOptions.find(o => o.value === item.type)?.icon} {item.subject}
                      </div>
                      <div className="sug-history-date">
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
