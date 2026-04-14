import React, { useState, useEffect } from 'react';
import { useAuth } from '../../services/auth';
import { api } from '../../services/api';
import { useI18n } from '../../services/i18n';
import { Shield, CheckCircle } from '../../components/Icons';

export default function FraudTab() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [fraudReport, setFraudReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'owner') return;
    api
      .getReferralFraudReport()
      .then(setFraudReport)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton skeleton-card" />
        ))}
      </div>
    );
  }

  if (!fraudReport) return null;

  return (
    <div>
      <div className="u-card" style={{ padding: 20, marginBottom: 16 }}>
        <h4 style={{ marginTop: 0 }}>
          {Shield({ size: 16 })} {t('ceo.fraudDetection')}
        </h4>
        <p style={{ fontSize: 14 }}>
          {t('ceo.totalReferrals')}: <strong>{fraudReport.totalReferrals}</strong>
        </p>
      </div>
      {fraudReport.suspiciousAccounts?.length > 0 ? (
        fraudReport.suspiciousAccounts.map((s: any) => (
          <div
            key={s.userId}
            className="u-card"
            style={{
              padding: 16,
              marginBottom: 8,
              borderLeft: `4px solid ${s.fraudProbability > 70 ? 'var(--accent-red)' : 'var(--accent-orange)'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong>{s.name}</strong>{' '}
                <span style={{ color: 'var(--text-muted)' }}>@{s.username}</span>
                <div style={{ fontSize: 13 }}>
                  {t('ceo.referrals')}: {s.totalReferred} | {t('ceo.inactive')}:{' '}
                  {s.inactiveReferred}
                </div>
              </div>
              <span
                style={{
                  fontSize: 12,
                  padding: '4px 12px',
                  borderRadius: 12,
                  background:
                    s.fraudProbability > 70 ? 'rgba(220,38,38,0.08)' : 'rgba(217,119,6,0.08)',
                  color: s.fraudProbability > 70 ? 'var(--accent-red)' : 'var(--accent-orange)',
                  fontWeight: 600,
                }}
              >
                {s.fraudProbability}% {t('ceo.risk')} — {s.recommendation}
              </span>
            </div>
          </div>
        ))
      ) : (
        <div className="empty-state" style={{ padding: 40 }}>
          <div className="empty-state-icon">{CheckCircle({ size: 48 })}</div>
          <h3>{t('ceo.noSuspiciousActivity')}</h3>
        </div>
      )}
    </div>
  );
}
