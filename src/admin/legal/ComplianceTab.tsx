import React, { useState, useEffect } from 'react';
import { useAuth } from '../../services/auth';
import { api } from '../../services/api';
import { useI18n } from '../../services/i18n';
import { CheckCircle, Hourglass, ClipboardList } from '../../components/Icons';

export default function ComplianceTab() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [compliance, setComplianceStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'owner') return;
    api
      .getComplianceStatus()
      .then(setComplianceStatus)
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

  if (!compliance) return null;

  return (
    <div className="u-card" style={{ padding: 24 }}>
      <h3 style={{ marginTop: 0 }}>
        {CheckCircle({ size: 18 })} {t('ceo.complianceStatus')}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {compliance.requirements?.map((req: string, i: number) => (
          <div
            key={i}
            style={{
              fontSize: 14,
              padding: '8px 12px',
              background: 'var(--bg-secondary)',
              borderRadius: 8,
            }}
          >
            {req}
          </div>
        ))}
      </div>
      {compliance.pending?.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ color: 'var(--accent-orange)' }}>
            {Hourglass({ size: 16 })} {t('ceo.pending')}
          </h4>
          {compliance.pending.map((p: string, i: number) => (
            <div key={i} style={{ fontSize: 13, padding: 8, color: 'var(--accent-orange)' }}>
              • {p}
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        <h4>
          {ClipboardList({ size: 16 })} {t('ceo.legalNotes')}
        </h4>
        {compliance.legalNotes?.map((n: string, i: number) => (
          <div key={i} style={{ fontSize: 13, padding: 4, color: 'var(--text-muted)' }}>
            • {n}
          </div>
        ))}
      </div>
    </div>
  );
}
