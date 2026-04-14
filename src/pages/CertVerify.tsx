import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import {
  CheckCircle,
  XCircle,
  GraduationCap,
  Award,
  Calendar,
  BookOpen,
  Star,
} from '../components/Icons';

interface CertData {
  valid: boolean;
  studentName: string;
  courseName: string;
  courseArea: string;
  issuedAt: string;
  hoursCompleted: number;
  finalGrade: number;
  code: string;
  institution: string;
}

export default function CertVerify() {
  const { code } = useParams<{ code: string }>();
  const [cert, setCert] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setError('Código inválido');
      setLoading(false);
      return;
    }
    api
      .verifyCertificate(code)
      .then((data: any) => {
        if (data?.valid) setCert(data);
        else setError('Certificado no encontrado o no es público');
      })
      .catch(() => setError('Certificado no encontrado'))
      .finally(() => setLoading(false));
  }, [code]);

  const issuedDate = cert
    ? new Date(cert.issuedAt).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f4ff 0%, #e8eef8 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: '#2D62C8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg viewBox="0 0 40 40" width={18} height={18}>
              <circle
                cx="20"
                cy="20"
                r="12"
                fill="none"
                stroke="#fff"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray="56 19"
              />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "'Outfit', -apple-system, sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: '#1e293b',
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          >
            conni<span style={{ color: '#2D62C8' }}>ku</span>
          </span>
        </div>
        <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Verificación de Certificados</p>
      </div>

      {/* Card */}
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          padding: '40px 36px',
          maxWidth: 520,
          width: '100%',
          boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
          border: '1px solid #e2e8f0',
        }}
      >
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: '3px solid #e2e8f0',
                borderTopColor: '#2D62C8',
                margin: '0 auto 16px',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <p style={{ color: '#64748b', fontSize: 15 }}>Verificando certificado...</p>
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 16 }}>{XCircle({ size: 56, color: '#ef4444' })}</div>
            <h2 style={{ color: '#1e293b', marginBottom: 8, fontSize: 20 }}>
              Certificado no válido
            </h2>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>
              Este código no corresponde a ningún certificado emitido por Conniku, o el certificado
              no es público.
            </p>
            <div
              style={{
                marginTop: 20,
                padding: '12px 16px',
                background: '#fef2f2',
                borderRadius: 10,
                border: '1px solid #fecaca',
              }}
            >
              <code style={{ fontSize: 13, color: '#991b1b', letterSpacing: 1 }}>{code}</code>
            </div>
          </div>
        )}

        {!loading && cert && (
          <>
            {/* Valid badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 24,
                  padding: '6px 14px',
                }}
              >
                {CheckCircle({ size: 18, color: '#16a34a' })}
                <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 14 }}>
                  Certificado Válido
                </span>
              </div>
            </div>

            {/* Certificate icon */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 18,
                  background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                }}
              >
                {Award({ size: 36, color: '#2D62C8' })}
              </div>
            </div>

            {/* Student name */}
            <h1
              style={{
                textAlign: 'center',
                color: '#1e293b',
                fontSize: 22,
                fontWeight: 800,
                marginBottom: 4,
              }}
            >
              {cert.studentName}
            </h1>
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginBottom: 28 }}>
              ha completado satisfactoriamente
            </p>

            {/* Course name */}
            <div
              style={{
                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                borderRadius: 14,
                padding: '18px 20px',
                marginBottom: 24,
                border: '1px solid #bfdbfe',
                textAlign: 'center',
              }}
            >
              <h2 style={{ color: '#1e40af', fontSize: 18, fontWeight: 700, margin: 0 }}>
                {cert.courseName}
              </h2>
              {cert.courseArea && (
                <p style={{ color: '#3b82f6', fontSize: 13, margin: '4px 0 0' }}>
                  {cert.courseArea}
                </p>
              )}
            </div>

            {/* Details grid */}
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}
            >
              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: 10,
                  padding: '14px 16px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  {Calendar({ size: 14, color: '#64748b' })}
                  <span
                    style={{
                      fontSize: 11,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Emitido
                  </span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                  {issuedDate}
                </span>
              </div>
              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: 10,
                  padding: '14px 16px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  {BookOpen({ size: 14, color: '#64748b' })}
                  <span
                    style={{
                      fontSize: 11,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Duración
                  </span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                  {cert.hoursCompleted}h
                </span>
              </div>
              {cert.finalGrade != null && (
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: 10,
                    padding: '14px 16px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    {Star({ size: 14, color: '#64748b' })}
                    <span
                      style={{
                        fontSize: 11,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      Calificación
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                    {cert.finalGrade}/100
                  </span>
                </div>
              )}
              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: 10,
                  padding: '14px 16px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  {GraduationCap({ size: 14, color: '#64748b' })}
                  <span
                    style={{
                      fontSize: 11,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Institución
                  </span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                  {cert.institution}
                </span>
              </div>
            </div>

            {/* Code */}
            <div
              style={{
                textAlign: 'center',
                padding: '14px',
                background: '#f1f5f9',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: '#94a3b8',
                  margin: '0 0 4px',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Código de verificación
              </p>
              <code style={{ fontSize: 14, fontWeight: 700, color: '#475569', letterSpacing: 2 }}>
                {cert.code}
              </code>
            </div>
          </>
        )}
      </div>

      <p style={{ marginTop: 20, color: '#94a3b8', fontSize: 12, textAlign: 'center' }}>
        conniku.com — Plataforma educativa para universitarios
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
