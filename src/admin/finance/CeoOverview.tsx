import React, { useState, useEffect } from 'react'
import { useAuth } from '../../services/auth'
import { api } from '../../services/api'
import { useI18n } from '../../services/i18n'
import { BarChart3, Gem } from '../../components/Icons'

interface Props {
  onNavigate: (path: string) => void
}

export default function CeoOverview({ onNavigate }: Props) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [weeklyReport, setWeeklyReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role !== 'owner') return
    api.getCeoWeeklyReport()
      .then(setWeeklyReport)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const fmt = (n: number) => n?.toLocaleString('es-CL') || '0'
  const fmtUsd = (n: number) => `$${(n || 0).toFixed(2)}`

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-card" />)}
      </div>
    )
  }

  if (!weeklyReport) return null

  return (
    <div>
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>{t('ceo.weeklyReport')}</h3>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>{weeklyReport.period}</p>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
          <div className="stat-value">{fmtUsd(weeklyReport.revenue?.grossUsd)}</div>
          <div className="stat-label">{t('ceo.weekRevenue')} {weeklyReport.revenue?.trend}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
          <div className="stat-value">{weeklyReport.users?.newThisWeek}</div>
          <div className="stat-label">{t('ceo.newUsers')} ({weeklyReport.users?.growthPercent > 0 ? '+' : ''}{weeklyReport.users?.growthPercent}%)</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
          <div className="stat-value">{weeklyReport.users?.activeThisWeek}</div>
          <div className="stat-label">{t('ceo.activeUsers')} ({weeklyReport.users?.activeRate}%)</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-orange)' }}>
          <div className="stat-value">{weeklyReport.engagement?.studyHours}h</div>
          <div className="stat-label">{t('ceo.studyHours')}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="u-card" style={{ padding: 20 }}>
          <h4 style={{ marginTop: 0 }}>{Gem({ size: 16 })} {t('ceo.netProfit')}</h4>
          <div style={{ fontSize: 28, fontWeight: 700 }}>${fmt(weeklyReport.revenue?.gananciaNetaClp)} CLP</div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('ceo.afterCommissions')}</p>
        </div>
        <div className="u-card" style={{ padding: 20 }}>
          <h4 style={{ marginTop: 0 }}>{BarChart3({ size: 16 })} {t('ceo.engagement')}</h4>
          <div style={{ fontSize: 13 }}>
            <div>{t('ceo.posts')}: {weeklyReport.engagement?.wallPosts} | {t('ceo.community')}: {weeklyReport.engagement?.communityPosts}</div>
            <div>{t('ceo.messages')}: {weeklyReport.engagement?.messages} | {t('ceo.quizzes')}: {weeklyReport.engagement?.quizzesTaken}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
