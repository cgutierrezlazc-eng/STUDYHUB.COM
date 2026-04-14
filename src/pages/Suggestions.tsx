import React, { useState } from 'react';
import { useI18n } from '../services/i18n';
import { useAuth } from '../services/auth';
import { api } from '../services/api';
import {
  Lightbulb,
  MessageSquare,
  AlertTriangle,
  Settings,
  CheckCircle,
} from '../components/Icons';

interface Suggestion {
  id: string;
  type: string;
  subject: string;
  message: string;
  date: string;
}

function loadHistory(): Suggestion[] {
  try {
    return JSON.parse(localStorage.getItem('conniku_suggestions') || '[]');
  } catch {
    return [];
  }
}

function saveHistory(items: Suggestion[]) {
  localStorage.setItem('conniku_suggestions', JSON.stringify(items));
}

export default function Suggestions() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [type, setType] = useState('feature');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<Suggestion[]>(loadHistory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSending(true);
    setError('');
    try {
      await api.sendSuggestion(type, subject.trim(), message.trim());

      const newItem: Suggestion = {
        id: Date.now().toString(36),
        type,
        subject: subject.trim(),
        message: message.trim(),
        date: new Date().toISOString(),
      };
      const updated = [newItem, ...history].slice(0, 10);
      setHistory(updated);
      saveHistory(updated);

      setSubject('');
      setMessage('');
      setSent(true);
      setTimeout(() => setSent(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Error al enviar. Intenta de nuevo.');
    }
    setSending(false);
  };

  const typeOptions = [
    {
      value: 'feature',
      label: 'Nueva funcion',
      icon: Lightbulb({ size: 16, color: 'var(--accent-orange)' }),
    },
    {
      value: 'bug',
      label: 'Reportar error',
      icon: AlertTriangle({ size: 16, color: 'var(--accent-red)' }),
    },
    {
      value: 'improvement',
      label: 'Mejora',
      icon: Settings({ size: 16, color: 'var(--accent-blue)' }),
    },
    {
      value: 'other',
      label: 'Otro',
      icon: MessageSquare({ size: 16, color: 'var(--accent-purple)' }),
    },
  ];

  return (
    <>
      <div className="page-header">
        <h2>{Lightbulb({ size: 22 })} Sugerencias</h2>
        <p>Tu feedback nos ayuda a mejorar Conniku</p>
      </div>
      <div className="page-body page-enter">
        {sent && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 16px',
              borderRadius: 'var(--radius)',
              background: 'rgba(5,150,105,0.08)',
              border: '1px solid rgba(5,150,105,0.2)',
              color: 'var(--accent-green)',
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 16,
            }}
            className="toast"
          >
            {CheckCircle({ size: 16 })} Tu sugerencia fue enviada al equipo. Gracias!
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius)',
              background: 'rgba(220,38,38,0.08)',
              border: '1px solid rgba(220,38,38,0.2)',
              color: 'var(--accent-red)',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, maxWidth: 960 }}>
          {/* Form */}
          <div className="u-card-flat" style={{ padding: 28 }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  Tipo de sugerencia
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {typeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={
                        type === opt.value ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'
                      }
                      onClick={() => setType(opt.value)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>
                  Asunto
                </label>
                <input
                  className="form-input"
                  placeholder="Describe brevemente tu sugerencia"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>
                  Mensaje
                </label>
                <textarea
                  className="form-input"
                  placeholder="Cuentanos los detalles..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  style={{ resize: 'vertical', width: '100%' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-glow press-feedback"
                disabled={sending || !subject.trim() || !message.trim()}
                style={{ width: '100%', padding: '12px 0', fontSize: 14 }}
              >
                {sending ? 'Enviando...' : 'Enviar Sugerencia'}
              </button>
            </form>
          </div>

          {/* Right sidebar */}
          <div>
            {/* Contact info */}
            <div className="u-card-flat" style={{ padding: 20, marginBottom: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Contacto directo</h4>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Tambien puedes escribirnos directamente:
              </p>
              <a
                href="mailto:contacto@conniku.com"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--accent)',
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                {MessageSquare({ size: 14 })} contacto@conniku.com
              </a>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="u-card-flat" style={{ padding: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                  Enviadas anteriormente
                </h4>
                {history.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid var(--border-subtle)',
                      fontSize: 13,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        className={`u-card-tag${item.type === 'bug' ? '-red' : item.type === 'improvement' ? '' : item.type === 'other' ? '-purple' : '-orange'}`}
                      >
                        {item.type === 'feature'
                          ? 'Funcion'
                          : item.type === 'bug'
                            ? 'Error'
                            : item.type === 'improvement'
                              ? 'Mejora'
                              : 'Otro'}
                      </span>
                      <span style={{ fontWeight: 500 }}>{item.subject}</span>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                      {new Date(item.date).toLocaleDateString('es-CL')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
