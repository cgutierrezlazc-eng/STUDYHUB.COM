import React from 'react';
import { X, Zap, Infinity as InfinityIcon, Shield, Sparkles } from 'lucide-react';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  featureLabel?: string;
  onNavigate?: (path: string) => void;
}

const benefits = [
  { icon: InfinityIcon, text: 'Herramientas inteligentes ilimitadas' },
  { icon: Sparkles, text: 'Mapas conceptuales, planes de estudio y más' },
  { icon: Shield, text: 'Exportar documentos y sincronizar con tu universidad' },
];

export default function UpgradeModal({
  open,
  onClose,
  featureLabel,
  onNavigate,
}: UpgradeModalProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--bg-primary, #fff)',
          borderRadius: 16,
          padding: '32px 28px',
          maxWidth: 420,
          width: '90%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          position: 'relative',
          animation: 'slideUp 0.3s ease',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary, #888)',
            padding: 4,
          }}
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              marginBottom: 12,
            }}
          >
            <Zap size={28} color="#fff" />
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: 20, color: 'var(--text-primary, #1a1a1a)' }}>
            {featureLabel ? `Desbloquea ${featureLabel}` : 'Pasa a Conniku PRO'}
          </h3>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary, #666)' }}>
            Accede a todas las herramientas inteligentes sin límites
          </p>
        </div>

        {/* Benefits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {benefits.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'var(--bg-secondary, #f5f5f5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <b.icon size={16} color="var(--accent, #3b82f6)" />
              </div>
              <span style={{ fontSize: 14, color: 'var(--text-primary, #1a1a1a)' }}>{b.text}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div
          style={{
            textAlign: 'center',
            padding: '12px 0',
            marginBottom: 16,
            borderTop: '1px solid var(--border, #e5e5e5)',
            borderBottom: '1px solid var(--border, #e5e5e5)',
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--text-secondary, #888)' }}>Desde </span>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary, #1a1a1a)' }}>
            $3.490
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary, #888)' }}>/semana</span>
          <span
            style={{
              fontSize: 12,
              color: 'var(--text-secondary, #999)',
              display: 'block',
              marginTop: 2,
            }}
          >
            o $8.990/mes · IVA incluido
          </span>
        </div>

        {/* CTA */}
        <button
          onClick={() => {
            onClose();
            if (onNavigate) onNavigate('/suscripcion');
          }}
          style={{
            width: '100%',
            padding: '12px 0',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 8,
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.transform = 'translateY(-1px)';
            (e.target as HTMLElement).style.boxShadow = '0 4px 12px rgba(59,130,246,0.4)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.transform = '';
            (e.target as HTMLElement).style.boxShadow = '';
          }}
        >
          Ver planes PRO
        </button>
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '10px 0',
            borderRadius: 10,
            border: 'none',
            background: 'transparent',
            color: 'var(--text-secondary, #888)',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Quizás después
        </button>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  );
}
