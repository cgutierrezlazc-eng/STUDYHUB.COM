import React, { useState, useEffect, useRef } from 'react';
import { api, getApiBase } from '../services/api';

const API_BASE = getApiBase();

interface Props {
  username: string;
  onNavigate: (path: string) => void;
}

function StarRating({ value, max = 5, size = 16 }: { value: number; max?: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={i < Math.round(value) ? '#f59e0b' : 'none'}
          stroke={i < Math.round(value) ? '#f59e0b' : '#d1d5db'}
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function QRCodeCanvas({ url, size = 200 }: { url: string; size?: number }) {
  // Use QR code service (no dependency needed)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&color=1a3a7a&bgcolor=ffffff&margin=10&format=png`;
  return (
    <img
      src={qrUrl}
      alt="QR Code"
      width={size}
      height={size}
      style={{ borderRadius: 12, border: '2px solid var(--border)', display: 'block' }}
    />
  );
}

export default function PublicTutorPage({ username, onNavigate }: Props) {
  const [tutor, setTutor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<'about' | 'classes' | 'reviews'>('about');

  const publicUrl = `https://conniku.com/tutor/${username}`;

  useEffect(() => {
    api
      .getTutorPublicByUsername(username)
      .then((data) => setTutor(data))
      .catch(() => setError('Tutor no encontrado o no disponible.'))
      .finally(() => setLoading(false));
  }, [username]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${tutor?.first_name} ${tutor?.last_name_initial} — Tutor en Conniku`,
        text: `Conoce al tutor ${tutor?.first_name} en Conniku`,
        url: publicUrl,
      });
    } else {
      handleCopyUrl();
    }
  };

  if (loading)
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              border: '4px solid var(--border)',
              borderTopColor: '#2D62C8',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: 'var(--text-muted)' }}>Cargando perfil del tutor...</p>
        </div>
      </div>
    );

  if (error || !tutor)
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
        }}
      >
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Tutor no encontrado</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>{error}</p>
          <button
            onClick={() => onNavigate('/tutores')}
            style={{
              padding: '10px 24px',
              background: '#2D62C8',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Ver directorio de tutores
          </button>
        </div>
      </div>
    );

  const avatarSrc = tutor.avatar?.startsWith('/uploads')
    ? `${API_BASE}${tutor.avatar}`
    : tutor.avatar;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Hero Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #071e3d 0%, #0a2a5e 40%, #1a3a7a 100%)',
          paddingBottom: 0,
        }}
      >
        {/* Conniku branding bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 24px',
            maxWidth: 800,
            margin: '0 auto',
          }}
        >
          <button
            onClick={() => onNavigate('/')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>
              conniku
            </span>
          </button>
          <button
            onClick={() => onNavigate('/tutores')}
            style={{
              padding: '7px 16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Ver todos los tutores
          </button>
        </div>

        {/* Tutor profile card */}
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 24px 0' }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  border: '4px solid rgba(255,255,255,0.3)',
                  background: '#2D62C8',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 36,
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  `${tutor.first_name?.[0] || ''}${tutor.last_name_initial?.[0] || ''}`
                )}
              </div>
              {tutor.verified && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: '#22c55e',
                    border: '2px solid #fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                  }}
                  title="Tutor verificado"
                >
                  ✓
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#fff' }}>
                  {tutor.first_name} {tutor.last_name_initial}
                </h1>
                {tutor.verified && (
                  <span
                    style={{
                      padding: '2px 10px',
                      borderRadius: 20,
                      background: 'rgba(34,197,94,0.2)',
                      border: '1px solid rgba(34,197,94,0.5)',
                      color: '#86efac',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    ✓ Verificado
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>
                {tutor.professional_title || tutor.career}
                {tutor.institution ? ` · ${tutor.institution}` : ''}
              </p>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
                {tutor.rating_average > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StarRating value={tutor.rating_average} size={14} />
                    <span style={{ color: '#fde68a', fontWeight: 700, fontSize: 14 }}>
                      {tutor.rating_average.toFixed(1)}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                      ({tutor.reviews_count || 0})
                    </span>
                  </div>
                )}
                {tutor.total_classes > 0 && (
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                    <strong style={{ color: '#fff' }}>{tutor.total_classes}</strong> clases
                  </div>
                )}
                {tutor.total_students > 0 && (
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                    <strong style={{ color: '#fff' }}>{tutor.total_students}</strong> estudiantes
                  </div>
                )}
                {tutor.experience_years > 0 && (
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                    <strong style={{ color: '#fff' }}>{tutor.experience_years}</strong> años exp.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div
            style={{ display: 'flex', gap: 10, marginTop: 20, paddingBottom: 20, flexWrap: 'wrap' }}
          >
            <button
              onClick={() => onNavigate('/register')}
              style={{
                padding: '10px 24px',
                background: '#2D62C8',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              📚 Reservar clase
            </button>
            <button
              onClick={handleShare}
              style={{
                padding: '10px 18px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 8,
                cursor: 'pointer',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {copied ? '✓ Copiado!' : '🔗 Compartir'}
            </button>
            <button
              onClick={() => setShowQR((v) => !v)}
              style={{
                padding: '10px 18px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 8,
                cursor: 'pointer',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {showQR ? '✕ Cerrar QR' : '📱 Ver QR'}
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div
          style={{
            maxWidth: 800,
            margin: '0 auto',
            display: 'flex',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {(
            [
              { key: 'about', label: 'Sobre mí' },
              {
                key: 'classes',
                label: `Clases disponibles${tutor.upcoming_classes?.length ? ` (${tutor.upcoming_classes.length})` : ''}`,
              },
              {
                key: 'reviews',
                label: `Reseñas${tutor.reviews_count ? ` (${tutor.reviews_count})` : ''}`,
              },
            ] as { key: 'about' | 'classes' | 'reviews'; label: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              style={{
                padding: '14px 20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: activeSection === tab.key ? '#fff' : 'rgba(255,255,255,0.55)',
                fontWeight: activeSection === tab.key ? 700 : 500,
                fontSize: 14,
                borderBottom:
                  activeSection === tab.key ? '3px solid #60a5fa' : '3px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* QR Popup */}
      {showQR && (
        <div
          style={{
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border)',
            padding: '24px',
          }}
        >
          <div
            style={{
              maxWidth: 800,
              margin: '0 auto',
              display: 'flex',
              gap: 24,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <QRCodeCanvas url={publicUrl} size={160} />
            <div>
              <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)', fontSize: 16 }}>
                Comparte tu página de tutor
              </h3>
              <p style={{ margin: '0 0 12px', color: 'var(--text-muted)', fontSize: 13 }}>
                Comparte este QR o el enlace directo con tus estudiantes.
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {publicUrl}
                </span>
                <button
                  onClick={handleCopyUrl}
                  style={{
                    padding: '4px 12px',
                    background: '#2D62C8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {copied ? '✓' : 'Copiar'}
                </button>
              </div>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(publicUrl)}&color=1a3a7a&bgcolor=ffffff&margin=20&format=png`}
                download={`qr-tutor-${username}.png`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: '#2D62C8', fontWeight: 600, textDecoration: 'none' }}
              >
                ⬇ Descargar QR (512×512)
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
        {/* ABOUT */}
        {activeSection === 'about' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {tutor.bio && (
              <div
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 12,
                  padding: 20,
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>
                  Sobre mí
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {tutor.bio}
                </p>
              </div>
            )}

            {tutor.specialties?.length > 0 && (
              <div
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 12,
                  padding: 20,
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>
                  Especialidades
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {tutor.specialties.map((s: string) => (
                    <span
                      key={s}
                      style={{
                        padding: '5px 14px',
                        background: 'rgba(45,98,200,0.1)',
                        color: '#2D62C8',
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 600,
                        border: '1px solid rgba(45,98,200,0.2)',
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Rates */}
            {tutor.individual_rate > 0 && (
              <div
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 12,
                  padding: 20,
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <h3 style={{ margin: '0 0 14px', fontSize: 16, color: 'var(--text-primary)' }}>
                  Tarifas por sesión
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: 10,
                  }}
                >
                  {[
                    { label: 'Individual', value: tutor.individual_rate },
                    { label: '2 personas', value: tutor.group_2_rate },
                    { label: '3 personas', value: tutor.group_3_rate },
                    { label: '4 personas', value: tutor.group_4_rate },
                    { label: '5 personas', value: tutor.group_5_rate },
                  ]
                    .filter((r) => r.value > 0)
                    .map((r) => (
                      <div
                        key={r.label}
                        style={{
                          padding: '12px 14px',
                          background: 'var(--bg-secondary)',
                          borderRadius: 10,
                          textAlign: 'center',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#2D62C8' }}>
                          ${r.value.toLocaleString('es-CL')}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {r.label} / hora
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1a3a7a 0%, #2D62C8 100%)',
                borderRadius: 12,
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>
                  ¿Listo para aprender con {tutor.first_name}?
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>
                  Crea tu cuenta gratis y reserva tu primera clase
                </div>
              </div>
              <button
                onClick={() => onNavigate('/register')}
                style={{
                  padding: '10px 24px',
                  background: '#fff',
                  color: '#1a3a7a',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                Comenzar gratis →
              </button>
            </div>
          </div>
        )}

        {/* CLASSES */}
        {activeSection === 'classes' && (
          <div>
            {!tutor.upcoming_classes?.length ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                <p>No hay clases disponibles próximamente.</p>
                <button
                  onClick={() => onNavigate('/register')}
                  style={{
                    marginTop: 12,
                    padding: '10px 24px',
                    background: '#2D62C8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Registrarme para ser notificado
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tutor.upcoming_classes.map((cls: any) => (
                  <div
                    key={cls.id}
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: 12,
                      padding: 20,
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 16,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                        {cls.title}
                      </div>
                      {cls.category && (
                        <div
                          style={{ fontSize: 12, color: '#2D62C8', fontWeight: 600, marginTop: 4 }}
                        >
                          {cls.category}
                        </div>
                      )}
                      {cls.description && (
                        <p
                          style={{
                            fontSize: 13,
                            color: 'var(--text-muted)',
                            margin: '6px 0 0',
                            lineHeight: 1.5,
                          }}
                        >
                          {cls.description.slice(0, 120)}
                          {cls.description.length > 120 ? '…' : ''}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
                        {cls.scheduled_at && (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            📅{' '}
                            {new Date(cls.scheduled_at).toLocaleDateString('es-CL', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                        {cls.duration_minutes && (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            ⏱ {cls.duration_minutes} min
                          </span>
                        )}
                        {cls.spots_available > 0 && (
                          <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
                            ✓ {cls.spots_available} cupos
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {cls.price_clp > 0 && (
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#2D62C8' }}>
                          ${cls.price_clp.toLocaleString('es-CL')}
                        </div>
                      )}
                      {cls.price_clp === 0 && (
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>
                          Gratis
                        </div>
                      )}
                      <button
                        onClick={() => onNavigate('/register')}
                        style={{
                          marginTop: 8,
                          padding: '8px 16px',
                          background: '#2D62C8',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        Inscribirse
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REVIEWS */}
        {activeSection === 'reviews' && (
          <div>
            {tutor.rating_average > 0 && (
              <div
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 12,
                  padding: 20,
                  border: '1px solid var(--border-subtle)',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: 48,
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      lineHeight: 1,
                    }}
                  >
                    {tutor.rating_average.toFixed(1)}
                  </div>
                  <StarRating value={tutor.rating_average} size={18} />
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {tutor.reviews_count} reseñas
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = (tutor.reviews || []).filter(
                      (r: any) => Math.round(r.rating) === star
                    ).length;
                    const pct = tutor.reviews_count > 0 ? (count / tutor.reviews_count) * 100 : 0;
                    return (
                      <div
                        key={star}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}
                      >
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 8 }}>
                          {star}
                        </span>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="#f59e0b"
                          stroke="#f59e0b"
                          strokeWidth="2"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <div
                          style={{
                            flex: 1,
                            height: 6,
                            background: 'var(--bg-secondary)',
                            borderRadius: 3,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              background: '#f59e0b',
                              borderRadius: 3,
                              transition: 'width 0.5s',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 20 }}>
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!tutor.reviews?.length ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
                <p>Este tutor aún no tiene reseñas. ¡Sé el primero!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tutor.reviews.map((review: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: 12,
                      padding: 16,
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: '#2D62C8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: 13,
                          }}
                        >
                          {review.student_initials}
                        </div>
                        <div>
                          <div
                            style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}
                          >
                            Estudiante anónimo
                          </div>
                          {review.class_title && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {review.class_title}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <StarRating value={review.rating} size={13} />
                        {review.date && (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {new Date(review.date).toLocaleDateString('es-CL', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    {review.comment && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          color: 'var(--text-secondary)',
                          lineHeight: 1.6,
                        }}
                      >
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 40,
          borderTop: '1px solid var(--border-subtle)',
          padding: '20px 24px',
          textAlign: 'center',
        }}
      >
        <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>
          © 2026 Conniku SpA · RUT 78.395.702-7 ·{' '}
          <button
            onClick={() => onNavigate('/privacy')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 12,
              textDecoration: 'underline',
            }}
          >
            Privacidad
          </button>
          {' · '}
          <button
            onClick={() => onNavigate('/terms')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 12,
              textDecoration: 'underline',
            }}
          >
            Términos
          </button>
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
