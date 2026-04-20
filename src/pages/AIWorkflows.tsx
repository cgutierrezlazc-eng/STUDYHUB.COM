import React, { useState } from 'react';
import { api } from '../services/api';
import aiStyles from './AIWorkflows.module.css';

interface Props {
  onNavigate: (path: string) => void;
}

type Tab = 'marketing' | 'calendar' | 'community' | 'qa' | 'design';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'marketing', label: 'Marketing', icon: '📣' },
  { id: 'calendar', label: 'Calendario', icon: '📅' },
  { id: 'community', label: 'Comunidad', icon: '👥' },
  { id: 'qa', label: 'QA / Code Review', icon: '🔍' },
  { id: 'design', label: 'Diseno', icon: '🎨' },
];

export default function AIWorkflows({ onNavigate }: Props) {
  const [tab, setTab] = useState<Tab>('marketing');

  return (
    <div style={{ padding: '0 20px 24px', maxWidth: 900, margin: '0 auto' }}>
      <div className={aiStyles.topProgress}>
        <div className={aiStyles.tpLeft}>
          <span className={aiStyles.pulse} aria-hidden="true" />
          <span>Workflows internos</span>
        </div>
        <span>Marketing · Comunidad · QA · Diseño</span>
      </div>
      <div className={aiStyles.heroWrap}>
        <h1 className={aiStyles.heroH1}>
          <span className={aiStyles.hlViolet}>Workflows</span>.
        </h1>
        <p className={aiStyles.heroLead}>
          Automatización inteligente para marketing, comunidad, QA y diseño. Plantillas listas para
          operaciones recurrentes de Conniku.
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 20,
          overflowX: 'auto',
          padding: '4px',
          background: 'var(--bg-secondary)',
          borderRadius: 12,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 8,
              border: 'none',
              background: tab === t.id ? 'var(--accent)' : 'transparent',
              color: tab === t.id ? '#fff' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'marketing' && <MarketingTab />}
      {tab === 'calendar' && <CalendarTab />}
      {tab === 'community' && <CommunityTab />}
      {tab === 'qa' && <QATab />}
      {tab === 'design' && <DesignTab />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const cardStyle: React.CSSProperties = { padding: 20, borderRadius: 12, marginBottom: 16 };
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  fontSize: 13,
  fontFamily: 'inherit',
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 100,
  resize: 'vertical' as const,
};
const btnPrimary: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 10,
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};
const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-muted)',
  display: 'block',
  marginBottom: 4,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};
const resultBox: React.CSSProperties = {
  padding: 16,
  background: 'var(--bg-secondary)',
  borderRadius: 10,
  fontSize: 13,
  lineHeight: 1.7,
  whiteSpace: 'pre-wrap' as const,
  color: 'var(--text-primary)',
  marginTop: 16,
  border: '1px solid var(--border)',
};

function LoadingDots() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: 20,
        justifyContent: 'center',
      }}
    >
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 300 }}
      >
        <div className="skeleton skeleton-text" style={{ width: '80%' }} />
        <div className="skeleton skeleton-text" style={{ width: '60%' }} />
        <div className="skeleton skeleton-text" style={{ width: '70%' }} />
      </div>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Generando...</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MARKETING TAB
// ═══════════════════════════════════════════════════════════════
function MarketingTab() {
  const [type, setType] = useState('social_post');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('profesional');
  const [audience, setAudience] = useState('universitarios chilenos 18-30');
  const [extra, setExtra] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.aiMarketing({
        type,
        topic,
        tone,
        audience,
        extra_instructions: extra || undefined,
      });
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Error al generar contenido');
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="u-card" style={cardStyle}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Generar Contenido de Marketing</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Tipo de Contenido</label>
            <select value={type} onChange={(e) => setType(e.target.value)} style={selectStyle}>
              <option value="social_post">Post para Redes Sociales</option>
              <option value="email_campaign">Campana de Email</option>
              <option value="landing_copy">Copy para Landing Page</option>
              <option value="ad_copy">Copy Publicitario</option>
              <option value="blog_post">Articulo de Blog</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Tono</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} style={selectStyle}>
              <option value="profesional">Profesional</option>
              <option value="casual">Casual / Cercano</option>
              <option value="inspirador">Inspirador</option>
              <option value="urgente">Urgente / FOMO</option>
              <option value="educativo">Educativo</option>
              <option value="humoristico">Humoristico</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Tema / Topico</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ej: Lanzamiento de nueva funcion de comunidades..."
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Audiencia</label>
            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Instrucciones Extra (opcional)</label>
            <input
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="Incluir CTA, mencionar descuento..."
              style={inputStyle}
            />
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading || !topic.trim()}
          style={{ ...btnPrimary, marginTop: 16, opacity: loading || !topic.trim() ? 0.5 : 1 }}
        >
          Generar Contenido
        </button>
      </div>

      {loading && <LoadingDots />}
      {error && (
        <div style={{ ...resultBox, color: '#ef4444', borderColor: '#ef4444' }}>{error}</div>
      )}

      {result && (
        <div className="u-card" style={cardStyle}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Contenido Generado</h4>
          <div style={resultBox}>{result.content}</div>
          {result.suggestions?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: 8,
                }}
              >
                Ideas de seguimiento:
              </div>
              {result.suggestions.map((s: string, i: number) => (
                <div
                  key={i}
                  style={{
                    padding: '8px 12px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 8,
                    fontSize: 12,
                    marginBottom: 4,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setTopic(s);
                    setResult(null);
                  }}
                >
                  {i + 1}. {s}
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => {
              navigator.clipboard.writeText(result.content);
            }}
            style={{
              ...btnPrimary,
              marginTop: 12,
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
            }}
          >
            Copiar al Portapapeles
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CALENDAR TAB
// ═══════════════════════════════════════════════════════════════
function CalendarTab() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [postsPerWeek, setPostsPerWeek] = useState(3);
  const [platforms, setPlatforms] = useState(['instagram', 'linkedin', 'tiktok']);
  const [loading, setLoading] = useState(false);
  const [calendar, setCalendar] = useState<any[]>([]);
  const [error, setError] = useState('');

  const togglePlatform = (p: string) => {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const generate = async () => {
    if (platforms.length === 0) return;
    setLoading(true);
    setError('');
    setCalendar([]);
    try {
      const res = await api.aiMarketingCalendar({
        month,
        year,
        platforms,
        posts_per_week: postsPerWeek,
      });
      setCalendar(res.calendar || []);
    } catch (e: any) {
      setError(e.message || 'Error al generar calendario');
    }
    setLoading(false);
  };

  const MONTHS = [
    '',
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  const PLATFORM_COLORS: Record<string, string> = {
    instagram: '#E4405F',
    linkedin: '#0A66C2',
    tiktok: '#000000',
    twitter: '#1DA1F2',
    facebook: '#1877F2',
    youtube: '#FF0000',
  };

  return (
    <div>
      <div className="u-card" style={cardStyle}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Calendario de Contenido</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Mes</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              style={selectStyle}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  {MONTHS[m]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Ano</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              style={selectStyle}
            >
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Posts / Semana</label>
            <select
              value={postsPerWeek}
              onChange={(e) => setPostsPerWeek(Number(e.target.value))}
              style={selectStyle}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>Plataformas</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['instagram', 'linkedin', 'tiktok', 'twitter', 'facebook', 'youtube'].map((p) => (
              <button
                key={p}
                onClick={() => togglePlatform(p)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: '1px solid var(--border)',
                  background: platforms.includes(p)
                    ? PLATFORM_COLORS[p] || 'var(--accent)'
                    : 'var(--bg-primary)',
                  color: platforms.includes(p) ? '#fff' : 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textTransform: 'capitalize' as const,
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading || platforms.length === 0}
          style={{ ...btnPrimary, marginTop: 16, opacity: loading ? 0.5 : 1 }}
        >
          Generar Calendario {MONTHS[month]}
        </button>
      </div>

      {loading && <LoadingDots />}
      {error && <div style={{ ...resultBox, color: '#ef4444' }}>{error}</div>}

      {calendar.length > 0 && (
        <div className="u-card" style={cardStyle}>
          <h4 style={{ margin: '0 0 16px', fontSize: 14 }}>
            Calendario {MONTHS[month]} {year} — {calendar.length} posts
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {calendar.map((post: any, i: number) => (
              <div
                key={i}
                style={{
                  padding: 14,
                  background: 'var(--bg-secondary)',
                  borderRadius: 10,
                  borderLeft: `4px solid ${PLATFORM_COLORS[post.platform] || 'var(--accent)'}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 10,
                        fontWeight: 700,
                        background: PLATFORM_COLORS[post.platform] || 'var(--accent)',
                        color: '#fff',
                        textTransform: 'uppercase' as const,
                      }}
                    >
                      {post.platform}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{post.type}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {post.date}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{post.topic}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {post.caption}
                </div>
                {post.hashtags?.length > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 6 }}>
                    {post.hashtags.map((h: string) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMMUNITY TAB
// ═══════════════════════════════════════════════════════════════
function CommunityTab() {
  const [mode, setMode] = useState<'moderate' | 'engage'>('moderate');
  const [content, setContent] = useState('');
  const [context, setContext] = useState('community post');
  const [communityName, setCommunityName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const run = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      if (mode === 'moderate') {
        const res = await api.aiModerate({ content, context });
        setResult({ type: 'moderate', data: res });
      } else {
        const res = await api.aiEngage({
          post_content: content,
          post_type: context,
          community_name: communityName || undefined,
        });
        setResult({ type: 'engage', data: res });
      }
    } catch (e: any) {
      setError(e.message || 'Error');
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="u-card" style={cardStyle}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Gestión de Comunidad</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => {
              setMode('moderate');
              setResult(null);
            }}
            style={{
              ...btnPrimary,
              background: mode === 'moderate' ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: mode === 'moderate' ? '#fff' : 'var(--text-secondary)',
            }}
          >
            Moderar Contenido
          </button>
          <button
            onClick={() => {
              setMode('engage');
              setResult(null);
            }}
            style={{
              ...btnPrimary,
              background: mode === 'engage' ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: mode === 'engage' ? '#fff' : 'var(--text-secondary)',
            }}
          >
            Generar Engagement
          </button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>
            {mode === 'moderate' ? 'Contenido a Moderar' : 'Post para Responder'}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              mode === 'moderate'
                ? 'Pega el contenido a revisar...'
                : 'Pega el post al que quieres generar engagement...'
            }
            style={textareaStyle}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Contexto</label>
            <select
              value={context}
              onChange={(e) => setContext(e.target.value)}
              style={selectStyle}
            >
              <option value="community post">Post de Comunidad</option>
              <option value="comment">Comentario</option>
              <option value="message">Mensaje Directo</option>
              <option value="discussion">Discusion</option>
            </select>
          </div>
          {mode === 'engage' && (
            <div>
              <label style={labelStyle}>Nombre de Comunidad (opcional)</label>
              <input
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
                placeholder="Ej: Ingenieria Civil UChile"
                style={inputStyle}
              />
            </div>
          )}
        </div>

        <button
          onClick={run}
          disabled={loading || !content.trim()}
          style={{ ...btnPrimary, marginTop: 16, opacity: loading || !content.trim() ? 0.5 : 1 }}
        >
          {mode === 'moderate' ? 'Analizar' : 'Generar Respuesta'}
        </button>
      </div>

      {loading && <LoadingDots />}
      {error && <div style={{ ...resultBox, color: '#ef4444' }}>{error}</div>}

      {result?.type === 'moderate' && (
        <div
          className="u-card"
          style={{
            ...cardStyle,
            borderLeft: `4px solid ${result.data.approved ? '#22c55e' : '#ef4444'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span
              style={{
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                background: result.data.approved ? '#22c55e' : '#ef4444',
                color: '#fff',
              }}
            >
              {result.data.approved ? 'APROBADO' : 'RECHAZADO'}
            </span>
          </div>
          <div style={{ fontSize: 13, marginBottom: 8 }}>
            <strong>Razon:</strong> {result.data.reason}
          </div>
          {result.data.flags?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <strong style={{ fontSize: 12 }}>Problemas detectados:</strong>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {result.data.flags.map((f: string, i: number) => (
                  <span
                    key={i}
                    style={{
                      padding: '2px 10px',
                      borderRadius: 12,
                      fontSize: 11,
                      background: 'rgba(239,68,68,0.1)',
                      color: '#ef4444',
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
          {result.data.suggestion && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              <strong>Sugerencia:</strong> {result.data.suggestion}
            </div>
          )}
        </div>
      )}

      {result?.type === 'engage' && (
        <div className="u-card" style={cardStyle}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Respuesta Generada</h4>
          <div style={resultBox}>{result.data.reply}</div>
          {result.data.questions?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: 6,
                }}
              >
                Preguntas de seguimiento:
              </div>
              {result.data.questions.map((q: string, i: number) => (
                <div
                  key={i}
                  style={{
                    padding: '6px 12px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 8,
                    fontSize: 12,
                    marginBottom: 4,
                  }}
                >
                  {i + 1}. {q}
                </div>
              ))}
            </div>
          )}
          {result.data.related_topics?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: 6,
                }}
              >
                Temas relacionados:
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {result.data.related_topics.map((t: string, i: number) => (
                  <span
                    key={i}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: 11,
                      background: 'var(--bg-tertiary)',
                      color: 'var(--accent)',
                      fontWeight: 600,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => {
              navigator.clipboard.writeText(result.data.reply);
            }}
            style={{
              ...btnPrimary,
              marginTop: 12,
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
            }}
          >
            Copiar Respuesta
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// QA TAB
// ═══════════════════════════════════════════════════════════════
function QATab() {
  const [mode, setMode] = useState<'review' | 'testplan'>('review');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [codeContext, setCodeContext] = useState('');
  const [featureDesc, setFeatureDesc] = useState('');
  const [testType, setTestType] = useState('functional');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const run = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      if (mode === 'review') {
        if (!code.trim()) return;
        const res = await api.aiCodeReview({ code, language, context: codeContext || undefined });
        setResult({ type: 'review', data: res });
      } else {
        if (!featureDesc.trim()) return;
        const res = await api.aiTestPlan({ feature_description: featureDesc, type: testType });
        setResult({ type: 'testplan', data: res });
      }
    } catch (e: any) {
      setError(e.message || 'Error');
    }
    setLoading(false);
  };

  const severityColors: Record<string, string> = {
    critical: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };
  const priorityColors: Record<string, string> = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#22c55e',
  };

  return (
    <div>
      <div className="u-card" style={cardStyle}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>QA y Revision de Codigo</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => {
              setMode('review');
              setResult(null);
            }}
            style={{
              ...btnPrimary,
              background: mode === 'review' ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: mode === 'review' ? '#fff' : 'var(--text-secondary)',
            }}
          >
            Code Review
          </button>
          <button
            onClick={() => {
              setMode('testplan');
              setResult(null);
            }}
            style={{
              ...btnPrimary,
              background: mode === 'testplan' ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: mode === 'testplan' ? '#fff' : 'var(--text-secondary)',
            }}
          >
            Plan de Pruebas
          </button>
        </div>

        {mode === 'review' ? (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Codigo a Revisar</label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Pega tu codigo aqui..."
                style={{ ...textareaStyle, minHeight: 200, fontFamily: 'monospace' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Lenguaje</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={selectStyle}
                >
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="react">React/TSX</option>
                  <option value="css">CSS</option>
                  <option value="html">HTML</option>
                  <option value="sql">SQL</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Contexto (opcional)</label>
                <input
                  value={codeContext}
                  onChange={(e) => setCodeContext(e.target.value)}
                  placeholder="Ej: componente de login..."
                  style={inputStyle}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Descripcion de la Funcionalidad</label>
              <textarea
                value={featureDesc}
                onChange={(e) => setFeatureDesc(e.target.value)}
                placeholder="Describe la funcionalidad que necesitas testear..."
                style={textareaStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Tipo de Prueba</label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                style={selectStyle}
              >
                <option value="functional">Funcional</option>
                <option value="integration">Integracion</option>
                <option value="e2e">End-to-End</option>
                <option value="security">Seguridad</option>
                <option value="performance">Rendimiento</option>
                <option value="usability">Usabilidad</option>
              </select>
            </div>
          </>
        )}

        <button
          onClick={run}
          disabled={loading}
          style={{ ...btnPrimary, marginTop: 16, opacity: loading ? 0.5 : 1 }}
        >
          {mode === 'review' ? 'Revisar Codigo' : 'Generar Plan de Pruebas'}
        </button>
      </div>

      {loading && <LoadingDots />}
      {error && <div style={{ ...resultBox, color: '#ef4444' }}>{error}</div>}

      {result?.type === 'review' && (
        <div className="u-card" style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <h4 style={{ margin: 0, fontSize: 14 }}>Resultado de la Revision</h4>
            <div
              style={{
                padding: '6px 16px',
                borderRadius: 20,
                fontSize: 18,
                fontWeight: 800,
                background:
                  result.data.score >= 80
                    ? '#22c55e'
                    : result.data.score >= 50
                      ? '#f59e0b'
                      : '#ef4444',
                color: '#fff',
              }}
            >
              {result.data.score}/100
            </div>
          </div>
          <div style={{ fontSize: 13, marginBottom: 16, color: 'var(--text-secondary)' }}>
            {result.data.summary}
          </div>
          {result.data.issues?.length > 0 && (
            <div>
              {result.data.issues.map((issue: any, i: number) => (
                <div
                  key={i}
                  style={{
                    padding: 12,
                    background: 'var(--bg-secondary)',
                    borderRadius: 8,
                    marginBottom: 8,
                    borderLeft: `4px solid ${severityColors[issue.severity] || '#999'}`,
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontSize: 10,
                        fontWeight: 700,
                        background: severityColors[issue.severity] || '#999',
                        color: '#fff',
                        textTransform: 'uppercase' as const,
                      }}
                    >
                      {issue.severity}
                    </span>
                    {issue.line && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Linea {issue.line}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, marginBottom: 4 }}>{issue.description}</div>
                  <div style={{ fontSize: 12, color: 'var(--accent)' }}>{issue.suggestion}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {result?.type === 'testplan' && (
        <div className="u-card" style={cardStyle}>
          <h4 style={{ margin: '0 0 16px', fontSize: 14 }}>
            Plan de Pruebas — {result.data.test_cases?.length || 0} casos
          </h4>
          {result.data.test_cases?.map((tc: any, i: number) => (
            <div
              key={i}
              style={{
                padding: 14,
                background: 'var(--bg-secondary)',
                borderRadius: 10,
                marginBottom: 8,
                borderLeft: `4px solid ${priorityColors[tc.priority] || '#999'}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {tc.id} — {tc.name}
                </div>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontSize: 10,
                    fontWeight: 600,
                    background: priorityColors[tc.priority] || '#999',
                    color: '#fff',
                  }}
                >
                  {tc.priority}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                {tc.steps?.map((s: string, j: number) => (
                  <div key={j}>
                    {j + 1}. {s}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: '#22c55e', marginTop: 6, fontWeight: 600 }}>
                Esperado: {tc.expected}
              </div>
            </div>
          ))}
          {result.data.coverage_notes && (
            <div style={{ ...resultBox, marginTop: 12 }}>
              <strong>Notas de Cobertura:</strong>
              <br />
              {result.data.coverage_notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DESIGN TAB
// ═══════════════════════════════════════════════════════════════
function DesignTab() {
  const [type, setType] = useState('social_graphic');
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState('moderno, limpio, profesional');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.aiDesignBrief({ type, description, style });
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Error');
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="u-card" style={cardStyle}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Brief de Diseño</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Tipo de Diseno</label>
            <select value={type} onChange={(e) => setType(e.target.value)} style={selectStyle}>
              <option value="social_graphic">Grafica para Redes</option>
              <option value="landing_page">Landing Page</option>
              <option value="email_template">Template de Email</option>
              <option value="app_screen">Pantalla de App</option>
              <option value="logo">Logo / Icono</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Estilo</label>
            <input value={style} onChange={(e) => setStyle(e.target.value)} style={inputStyle} />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>Descripcion del Diseno</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe lo que necesitas disenar..."
            style={textareaStyle}
          />
        </div>
        <button
          onClick={generate}
          disabled={loading || !description.trim()}
          style={{
            ...btnPrimary,
            marginTop: 16,
            opacity: loading || !description.trim() ? 0.5 : 1,
          }}
        >
          Generar Brief de Diseno
        </button>
      </div>

      {loading && <LoadingDots />}
      {error && <div style={{ ...resultBox, color: '#ef4444' }}>{error}</div>}

      {result && (
        <div className="u-card" style={cardStyle}>
          <h4 style={{ margin: '0 0 16px', fontSize: 14 }}>Brief Generado</h4>
          <div style={resultBox}>{result.brief}</div>

          {result.specifications && (
            <div
              style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
            >
              {result.specifications.dimensions && (
                <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: 4,
                    }}
                  >
                    DIMENSIONES
                  </div>
                  <div style={{ fontSize: 13 }}>{result.specifications.dimensions}</div>
                </div>
              )}
              {result.specifications.typography && (
                <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: 4,
                    }}
                  >
                    TIPOGRAFIA
                  </div>
                  <div style={{ fontSize: 13 }}>{result.specifications.typography}</div>
                </div>
              )}
              {result.specifications.colors?.length > 0 && (
                <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: 4,
                    }}
                  >
                    COLORES
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {result.specifications.colors.map((c: string, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 4,
                            background: c,
                            border: '1px solid var(--border)',
                          }}
                        />
                        <span style={{ fontSize: 11 }}>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {result.specifications.layout && (
                <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: 4,
                    }}
                  >
                    LAYOUT
                  </div>
                  <div style={{ fontSize: 13 }}>{result.specifications.layout}</div>
                </div>
              )}
            </div>
          )}

          {result.copy_suggestions?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: 8,
                }}
              >
                Copy sugerido:
              </div>
              {result.copy_suggestions.map((s: string, i: number) => (
                <div
                  key={i}
                  style={{
                    padding: '8px 12px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 8,
                    fontSize: 12,
                    marginBottom: 4,
                    cursor: 'pointer',
                  }}
                  onClick={() => navigator.clipboard.writeText(s)}
                >
                  {i + 1}. {s}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
