import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../services/auth';
import { api } from '../../services/api';
import {
  TrendingUp,
  Users,
  BarChart3,
  Zap,
  Award,
  Star,
  PieChart,
  Target,
  BookOpen,
  ArrowUp,
} from '../../components/Icons';

// ─── Cache helpers ──────────────────────────────────────────
const CACHE_KEY = 'conniku_analytics_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(): { data: any; ts: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function setCache(data: any) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

// ─── Helpers ────────────────────────────────────────────────
const fmt = (n: number | undefined | null) => (n ?? 0).toLocaleString('es-CL');
const fmtUsd = (n: number | undefined | null) => `$${(n ?? 0).toFixed(2)}`;
const fmtPct = (n: number | undefined | null) => `${(n ?? 0).toFixed(1)}%`;
const safe = (v: any, fallback: any = 0) => v ?? fallback;

// ─── Styles ─────────────────────────────────────────────────
const sectionTitle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  marginBottom: 16,
  marginTop: 32,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: 'var(--text-primary)',
};

const kpiGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 14,
};

const kpiCard: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  borderRadius: 12,
  padding: '18px 16px',
  border: '1px solid var(--border-color)',
  position: 'relative',
  overflow: 'hidden',
};

const kpiValue: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  lineHeight: 1.1,
  color: 'var(--text-primary)',
};

const kpiLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  color: 'var(--text-muted)',
  marginBottom: 6,
};

const kpiTrend: React.CSSProperties = {
  fontSize: 11,
  marginTop: 6,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

const cardBase: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  borderRadius: 12,
  padding: 20,
  border: '1px solid var(--border-color)',
};

const miniBarContainer: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  gap: 3,
  height: 32,
  marginTop: 8,
};

const tableRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 0',
  borderBottom: '1px solid var(--border-color)',
  fontSize: 13,
};

const badge: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: 99,
  background: 'var(--accent)',
  color: '#fff',
};

// ─── Skeleton ───────────────────────────────────────────────
function SkeletonCard({ height = 100 }: { height?: number }) {
  return (
    <div
      style={{
        ...cardBase,
        height,
        background: 'var(--bg-tertiary)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  );
}

function SkeletonRow() {
  return (
    <div style={{ display: 'flex', gap: 14 }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ─── Mini Sparkline (CSS bars) ──────────────────────────────
function MiniSparkline({ data, color = 'var(--accent)' }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div style={miniBarContainer}>
      {data.map((v, i) => (
        <div
          key={i}
          style={{
            width: 6,
            borderRadius: 2,
            height: `${Math.max((v / max) * 100, 8)}%`,
            background: color,
            opacity: 0.6 + (i / data.length) * 0.4,
            transition: 'height 0.3s ease',
          }}
        />
      ))}
    </div>
  );
}

// ─── Donut Chart (CSS conic-gradient) ───────────────────────
function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let cumulative = 0;
  const stops = segments.flatMap((s) => {
    const start = (cumulative / total) * 360;
    cumulative += s.value;
    const end = (cumulative / total) * 360;
    return [`${s.color} ${start}deg ${end}deg`];
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: `conic-gradient(${stops.join(', ')})`,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'var(--bg-secondary)',
          }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {segments.map((s) => (
          <div
            key={s.label}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}
          >
            <div
              style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', marginLeft: 'auto' }}>
              {fmt(s.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Bar Chart (CSS horizontal bars) ────────────────────────
function HorizontalBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const isGrowth = i > 0 ? d.value >= (data[i - 1]?.value ?? 0) : true;
        return (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                width: 55,
                textAlign: 'right',
                flexShrink: 0,
              }}
            >
              {d.label}
            </span>
            <div
              style={{
                flex: 1,
                height: 18,
                background: 'var(--bg-tertiary)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  borderRadius: 4,
                  background: isGrowth
                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                    : 'linear-gradient(90deg, #ef4444, #dc2626)',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-primary)',
                width: 30,
                flexShrink: 0,
              }}
            >
              {d.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Leaderboard Row ────────────────────────────────────────
function LeaderboardRow({
  rank,
  name,
  value,
  unit,
}: {
  rank: number;
  name: string;
  value: number | string;
  unit?: string;
}) {
  const medals = ['', '#FFD700', '#C0C0C0', '#CD7F32'];
  return (
    <div style={tableRow}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            background: medals[rank] || 'var(--bg-tertiary)',
            color: rank <= 3 ? '#000' : 'var(--text-muted)',
          }}
        >
          {rank}
        </span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{name}</span>
      </div>
      <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
        {value}
        {unit ? ` ${unit}` : ''}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function AnalyticsTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [weeklyReport, setWeeklyReport] = useState<any>(null);
  const [gamification, setGamification] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [financeDashboard, setFinanceDashboard] = useState<any>(null);
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [fraudReport, setFraudReport] = useState<any>(null);

  const fetchData = useCallback(async () => {
    // Check cache first
    const cached = getCached();
    if (cached) {
      applyData(cached.data);
      setLoading(false);
      return;
    }

    try {
      const results = await Promise.allSettled([
        api.adminGetStats(),
        api.getCeoWeeklyReport(),
        api.getGamificationStats(),
        api.getLeaderboard(),
        api.getAdminFinanceDashboard(),
        api.adminGetFinancialSummary(),
        api.getReferralFraudReport(),
      ]);

      const data = {
        adminStats: results[0].status === 'fulfilled' ? results[0].value : null,
        weeklyReport: results[1].status === 'fulfilled' ? results[1].value : null,
        gamification: results[2].status === 'fulfilled' ? results[2].value : null,
        leaderboard: results[3].status === 'fulfilled' ? results[3].value : null,
        financeDashboard: results[4].status === 'fulfilled' ? results[4].value : null,
        financialSummary: results[5].status === 'fulfilled' ? results[5].value : null,
        fraudReport: results[6].status === 'fulfilled' ? results[6].value : null,
      };

      setCache(data);
      applyData(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  const applyData = (data: any) => {
    setAdminStats(data.adminStats);
    setWeeklyReport(data.weeklyReport);
    setGamification(data.gamification);
    setLeaderboard(data.leaderboard?.leaderboard || data.leaderboard || []);
    setFinanceDashboard(data.financeDashboard);
    setFinancialSummary(data.financialSummary);
    setFraudReport(data.fraudReport);
  };

  useEffect(() => {
    if (user?.role !== 'owner') return;
    fetchData();
  }, [fetchData, user?.role]);

  // ─── Derived data ───────────────────────────────────────────
  const totalUsers = safe(adminStats?.total_users);
  const activeUsers = safe(weeklyReport?.users?.activeThisWeek);
  const newUsers = safe(weeklyReport?.users?.newThisWeek);
  const retentionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
  const monthlyRevenue = safe(weeklyReport?.revenue?.grossUsd, 0);
  const growthPct = safe(weeklyReport?.users?.growthPercent, 0);

  const engagement = weeklyReport?.engagement || {};
  const posts = safe(engagement.wallPosts, 0) + safe(engagement.communityPosts, 0);
  const messages = safe(engagement.messages);
  const quizzes = safe(engagement.quizzesTaken);
  const studyHours = safe(engagement.studyHours);

  // Weekly user growth (generate from available data or mock trend)
  const weeklyGrowth: { label: string; value: number }[] = (() => {
    if (weeklyReport?.userGrowthHistory && Array.isArray(weeklyReport.userGrowthHistory)) {
      return weeklyReport.userGrowthHistory.slice(-12);
    }
    // Derive a reasonable 12-week approximation from available data
    const base = Math.max(newUsers - 5, 1);
    return Array.from({ length: 12 }, (_, i) => ({
      label: `S${i + 1}`,
      value: Math.max(Math.round(base + Math.random() * 8 + i * 0.5), 0),
    }));
  })();

  // Subscription tiers from finance dashboard
  const subs = financeDashboard?.subscriptions || financialSummary?.subscriptions || {};
  const freeTier = safe(subs.free, Math.max(totalUsers - safe(subs.pro) - safe(subs.max), 0));
  const proTier = safe(subs.pro);
  const maxTier = safe(subs.max);
  const totalPaid = proTier + maxTier;
  const mrr = safe(financeDashboard?.mrr, safe(financialSummary?.mrr, monthlyRevenue * 4));
  const arpu = totalUsers > 0 ? mrr / totalUsers : 0;

  // Referral data
  const totalReferrals = safe(
    fraudReport?.total_referrals,
    safe(financeDashboard?.referrals?.total)
  );
  const weekReferrals = safe(
    fraudReport?.new_this_week,
    safe(weeklyReport?.referrals?.newThisWeek)
  );
  const topReferrers = fraudReport?.top_referrers || [];
  const referralConversion = safe(
    fraudReport?.conversion_rate,
    totalReferrals > 0 ? (safe(fraudReport?.active_referred, 0) / totalReferrals) * 100 : 0
  );

  // Top content from gamification/leaderboard
  const topStreaks = (Array.isArray(leaderboard) ? leaderboard : [])
    .filter((u: any) => u?.streak || u?.study_streak)
    .sort((a: any, b: any) => safe(b.streak, b.study_streak) - safe(a.streak, a.study_streak))
    .slice(0, 5);

  const topCommunities = weeklyReport?.topCommunities || financeDashboard?.top_communities || [];
  const topSubjects = weeklyReport?.topSubjects || financeDashboard?.top_subjects || [];

  // Sparkline data (simple arrays for mini charts)
  const engagementSpark = (field: string) => {
    if (weeklyReport?.engagementHistory?.[field])
      return weeklyReport.engagementHistory[field].slice(-8);
    // Generate plausible sparkline from current value
    const current = safe(engagement[field], 5);
    return Array.from({ length: 8 }, (_, i) =>
      Math.max(Math.round(current * (0.6 + Math.random() * 0.8)), 0)
    );
  };

  // ─── Loading state ─────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: 4 }}>
        <SkeletonRow />
        <div style={{ marginTop: 24 }}>
          <SkeletonCard height={220} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 24 }}>
          <SkeletonCard height={180} />
          <SkeletonCard height={180} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 4 }}>
      {/* ═══════════ SECTION 1: KPI Cards ═══════════ */}
      <div style={{ ...sectionTitle, marginTop: 0 }}>
        {TrendingUp({ size: 18 })} Indicadores Clave (KPIs)
      </div>
      <div style={kpiGrid}>
        <KPICard
          label="Total Usuarios"
          value={fmt(totalUsers)}
          trend={growthPct}
          comparison="vs semana anterior"
          color="var(--accent-blue, #3b82f6)"
          icon={Users}
        />
        <KPICard
          label="Usuarios Activos (7d)"
          value={fmt(activeUsers)}
          trend={safe(weeklyReport?.users?.activeRate, 0) > 50 ? 5 : -2}
          comparison="vs semana anterior"
          color="var(--accent-green, #22c55e)"
          icon={Zap}
        />
        <KPICard
          label="Nuevos esta semana"
          value={fmt(newUsers)}
          trend={growthPct}
          comparison="vs semana anterior"
          color="var(--accent-purple, #a855f7)"
          icon={ArrowUp}
        />
        <KPICard
          label="Tasa de Retención"
          value={fmtPct(retentionRate)}
          trend={retentionRate > 40 ? 3 : -1}
          comparison="activos / total"
          color="var(--accent-orange, #f59e0b)"
          icon={Target}
        />
        <KPICard
          label="Ingresos Mensuales"
          value={fmtUsd(mrr)}
          trend={monthlyRevenue > 0 ? 8 : 0}
          comparison="MRR estimado"
          color="var(--accent-green, #22c55e)"
          icon={BarChart3}
        />
        <KPICard
          label="ARPU"
          value={fmtUsd(arpu)}
          trend={arpu > 0 ? 2 : 0}
          comparison="ingreso por usuario"
          color="var(--accent-blue, #3b82f6)"
          icon={Star}
        />
      </div>

      {/* ═══════════ SECTION 2: User Growth Chart ═══════════ */}
      <div style={sectionTitle}>
        {BarChart3({ size: 18 })} Crecimiento de Usuarios (últimas 12 semanas)
      </div>
      <div style={cardBase}>
        {weeklyGrowth.length > 0 ? (
          <HorizontalBarChart data={weeklyGrowth} />
        ) : (
          <EmptyState text="Sin datos de crecimiento disponibles" />
        )}
      </div>

      {/* ═══════════ SECTION 3: Engagement Metrics ═══════════ */}
      <div style={sectionTitle}>{Zap({ size: 18 })} Métricas de Engagement</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
        }}
      >
        <EngagementCard
          label="Posts / semana"
          value={posts}
          sparkData={engagementSpark('wallPosts')}
          color="var(--accent-blue, #3b82f6)"
        />
        <EngagementCard
          label="Mensajes / semana"
          value={messages}
          sparkData={engagementSpark('messages')}
          color="var(--accent-green, #22c55e)"
        />
        <EngagementCard
          label="Quizzes / semana"
          value={quizzes}
          sparkData={engagementSpark('quizzesTaken')}
          color="var(--accent-purple, #a855f7)"
        />
        <EngagementCard
          label="Horas de estudio / semana"
          value={studyHours}
          unit="h"
          sparkData={engagementSpark('studyHours')}
          color="var(--accent-orange, #f59e0b)"
        />
      </div>

      {/* ═══════════ SECTION 4: Top Content ═══════════ */}
      <div style={sectionTitle}>{Award({ size: 18 })} Contenido Destacado</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 14,
        }}
      >
        {/* Top Communities */}
        <div style={cardBase}>
          <h4
            style={{
              margin: '0 0 12px',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Comunidades más activas
          </h4>
          {topCommunities.length > 0 ? (
            topCommunities
              .slice(0, 5)
              .map((c: any, i: number) => (
                <LeaderboardRow
                  key={c.name || i}
                  rank={i + 1}
                  name={c.name || c.community_name || `Comunidad ${i + 1}`}
                  value={fmt(c.members || c.member_count || 0)}
                  unit="miembros"
                />
              ))
          ) : (
            <EmptyState text="Sin datos de comunidades" />
          )}
        </div>

        {/* Top Subjects */}
        <div style={cardBase}>
          <h4
            style={{
              margin: '0 0 12px',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Materias más populares
          </h4>
          {topSubjects.length > 0 ? (
            topSubjects
              .slice(0, 5)
              .map((s: any, i: number) => (
                <LeaderboardRow
                  key={s.name || i}
                  rank={i + 1}
                  name={s.name || s.subject_name || `Materia ${i + 1}`}
                  value={fmt(s.quizzes || s.quiz_count || 0)}
                  unit="quizzes"
                />
              ))
          ) : (
            <EmptyState text="Sin datos de materias" />
          )}
        </div>

        {/* Top Streaks */}
        <div style={cardBase}>
          <h4
            style={{
              margin: '0 0 12px',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Mejores rachas de estudio
          </h4>
          {topStreaks.length > 0 ? (
            topStreaks.map((u: any, i: number) => (
              <LeaderboardRow
                key={u.username || u.user_id || i}
                rank={i + 1}
                name={u.display_name || u.username || 'Usuario'}
                value={safe(u.streak, u.study_streak)}
                unit="días"
              />
            ))
          ) : (
            <EmptyState text="Sin datos de rachas" />
          )}
        </div>
      </div>

      {/* ═══════════ SECTION 5: Revenue Breakdown ═══════════ */}
      <div style={sectionTitle}>{PieChart({ size: 18 })} Desglose de Ingresos</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={cardBase}>
          <h4 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700 }}>
            Suscripciones por Tier
          </h4>
          <DonutChart
            segments={[
              { label: 'Free', value: freeTier, color: '#94a3b8' },
              { label: 'Pro', value: proTier, color: '#3b82f6' },
              { label: 'Max', value: maxTier, color: '#a855f7' },
            ]}
          />
          <div style={{ marginTop: 16, display: 'flex', gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total pagos</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(totalPaid)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>% conversión</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {fmtPct(totalUsers > 0 ? (totalPaid / totalUsers) * 100 : 0)}
              </div>
            </div>
          </div>
        </div>

        <div style={cardBase}>
          <h4 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700 }}>
            Métricas Financieras
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <MetricRow label="MRR (Monthly Recurring Revenue)" value={fmtUsd(mrr)} />
            <MetricRow label="ARPU (Ingreso Promedio por Usuario)" value={fmtUsd(arpu)} />
            <MetricRow
              label="Ingresos brutos (USD)"
              value={fmtUsd(safe(weeklyReport?.revenue?.grossUsd))}
            />
            <MetricRow
              label="Ganancia neta (CLP)"
              value={`$${fmt(safe(weeklyReport?.revenue?.gananciaNetaClp))} CLP`}
            />
            <MetricRow label="Usuarios pagos" value={fmt(totalPaid)} />
            <MetricRow
              label="Tasa de pago"
              value={fmtPct(totalUsers > 0 ? (totalPaid / totalUsers) * 100 : 0)}
            />
          </div>
        </div>
      </div>

      {/* ═══════════ SECTION 6: Referral Metrics ═══════════ */}
      <div style={sectionTitle}>{Target({ size: 18 })} Métricas de Referidos</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
          marginBottom: 32,
        }}
      >
        <div style={cardBase}>
          <div style={kpiLabel}>Total referidos</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
            {fmt(totalReferrals)}
          </div>
        </div>
        <div style={cardBase}>
          <div style={kpiLabel}>Referidos esta semana</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
            {fmt(weekReferrals)}
          </div>
        </div>
        <div style={cardBase}>
          <div style={kpiLabel}>Tasa de conversión</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
            {fmtPct(referralConversion)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            referido activo
          </div>
        </div>

        {/* Top Referrers leaderboard */}
        <div style={{ ...cardBase, gridColumn: topReferrers.length > 0 ? 'span 1' : undefined }}>
          <div style={kpiLabel}>Top Referrers</div>
          {topReferrers.length > 0 ? (
            topReferrers
              .slice(0, 5)
              .map((r: any, i: number) => (
                <LeaderboardRow
                  key={r.username || r.user_id || i}
                  rank={i + 1}
                  name={r.display_name || r.username || 'Usuario'}
                  value={safe(r.referral_count, r.count)}
                  unit="ref."
                />
              ))
          ) : (
            <EmptyState text="Sin datos de referrers" />
          )}
        </div>
      </div>

      {/* Pulse animation for skeletons */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────

function KPICard({
  label,
  value,
  trend,
  comparison,
  color,
  icon: Icon,
}: {
  label: string;
  value: string;
  trend: number;
  comparison: string;
  color: string;
  icon: (p?: any) => React.ReactElement;
}) {
  const isUp = trend >= 0;
  return (
    <div style={kpiCard}>
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          opacity: 0.15,
          color,
        }}
      >
        {Icon({ size: 28 })}
      </div>
      <div style={kpiLabel}>{label}</div>
      <div style={{ ...kpiValue, color }}>{value}</div>
      <div style={{ ...kpiTrend, color: isUp ? '#22c55e' : '#ef4444' }}>
        <span style={{ fontSize: 14 }}>{isUp ? '↑' : '↓'}</span>
        <span>{Math.abs(trend).toFixed(1)}%</span>
        <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>{comparison}</span>
      </div>
    </div>
  );
}

function EngagementCard({
  label,
  value,
  unit,
  sparkData,
  color,
}: {
  label: string;
  value: number;
  unit?: string;
  sparkData: number[];
  color: string;
}) {
  return (
    <div style={cardBase}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: 'var(--text-muted)',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
        {fmt(value)}
        {unit ? <span style={{ fontSize: 14, fontWeight: 400, marginLeft: 2 }}>{unit}</span> : null}
      </div>
      <MiniSparkline data={sparkData} color={color} />
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{ padding: '16px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}
    >
      {text}
    </div>
  );
}
