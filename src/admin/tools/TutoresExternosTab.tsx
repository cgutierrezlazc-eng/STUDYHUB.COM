import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  UserPlus,
  Users,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';

// ─── helpers ──────────────────────────────────────────────────────
const fmtClp = (n: number) => `$${(n || 0).toLocaleString('es-CL')} CLP`;
const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString('es-CL') : '—');
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_review: { label: 'Pendiente', color: '#f59e0b' },
  approved: { label: 'Aprobado', color: '#22c55e' },
  rejected: { label: 'Rechazado', color: '#ef4444' },
  suspended: { label: 'Suspendido', color: '#ef4444' },
  appealing: { label: 'Apelando', color: '#8b5cf6' },
  draft: { label: 'Borrador', color: '#94a3b8' },
  pending_approval: { label: 'En Revisión', color: '#f59e0b' },
};
function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] || { label: status, color: '#94a3b8' };
  return (
    <span
      style={{
        padding: '2px 10px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        background: s.color + '22',
        color: s.color,
      }}
    >
      {s.label}
    </span>
  );
}
function PayFreqLabel(f: string) {
  return f === 'per_class' ? 'Por clase' : f === 'biweekly' ? 'Quincenal' : 'Mensual';
}

// ─── Reject/Suspend modal ─────────────────────────────────────────
function ReasonModal({
  title,
  onConfirm,
  onCancel,
}: {
  title: string;
  onConfirm: (r: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="card" style={{ width: 480, padding: 28 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>{title}</h3>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="Escribe el motivo..."
          style={{
            width: '100%',
            padding: 10,
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: 13,
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'none',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              background: '#ef4444',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              cursor: reason.trim() ? 'pointer' : 'not-allowed',
              opacity: reason.trim() ? 1 : 0.5,
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Application Card ─────────────────────────────────────────────
function ApplicationCard({
  app,
  onApprove,
  onReject,
  loading,
}: {
  app: any;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className="card"
      style={{
        padding: 20,
        marginBottom: 12,
        borderLeft: `4px solid ${STATUS_LABELS[app.status]?.color || '#94a3b8'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontWeight: 800, fontSize: 15 }}>{app.user_name}</span>
            <StatusBadge status={app.status} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {app.tutor_role_number}
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>
            {app.user_email}
          </div>
          <div style={{ fontSize: 13, marginBottom: 2 }}>
            {app.professional_title} — {app.institution || app.career}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 16,
              fontSize: 12,
              color: 'var(--text-muted)',
              marginTop: 6,
            }}
          >
            <span>
              📄 {app.documents_count} doc{app.documents_count !== 1 ? 's' : ''}
            </span>
            <span>💰 {fmtClp(app.individual_rate)}/hora</span>
            <span>🔄 {PayFreqLabel(app.payment_frequency)}</span>
            <span>📅 {fmtDate(app.created_at)}</span>
          </div>
          {app.appeal_text && (
            <div
              style={{
                marginTop: 8,
                padding: '8px 12px',
                background: 'rgba(139,92,246,0.08)',
                borderRadius: 8,
                fontSize: 12,
                color: '#8b5cf6',
              }}
            >
              <strong>Apelación:</strong> {app.appeal_text}
            </div>
          )}
          {app.rejection_reason && (
            <div
              style={{
                marginTop: 8,
                padding: '8px 12px',
                background: 'rgba(239,68,68,0.08)',
                borderRadius: 8,
                fontSize: 12,
                color: '#ef4444',
              }}
            >
              <strong>Rechazo previo:</strong> {app.rejection_reason}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          {(app.status === 'pending_review' || app.status === 'appealing') && (
            <>
              <button
                onClick={onApprove}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#22c55e',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <CheckCircle size={14} /> Aprobar
              </button>
              <button
                onClick={onReject}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#ef4444',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <XCircle size={14} /> Rechazar
              </button>
            </>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'none',
              cursor: 'pointer',
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            {expanded ? 'Menos ▲' : 'Más ▼'}
          </button>
        </div>
      </div>
      {expanded && (
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid var(--border)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Especialidades
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(app.specialties || []).length > 0 ? (
                (app.specialties as string[]).map((s, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: 'rgba(245,158,11,0.12)',
                      color: '#f59e0b',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Sin especialidades</span>
              )}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Datos Bancarios
            </div>
            {app.bank_name ? (
              <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                <div>
                  <strong>Banco:</strong> {app.bank_name}
                </div>
                <div>
                  <strong>Tipo:</strong> {app.bank_account_type}
                </div>
                <div>
                  <strong>Nro:</strong> {app.bank_account_number}
                </div>
                <div>
                  <strong>RUT:</strong> {app.rut}
                </div>
              </div>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Sin datos bancarios</span>
            )}
          </div>
          {app.bio && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                Biografía
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.6 }}>{app.bio}</div>
            </div>
          )}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Tarifas por Grupo
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.8 }}>
              <div>Individual: {fmtClp(app.individual_rate)}</div>
              {app.group_2_rate > 0 && <div>2 personas: {fmtClp(app.group_2_rate)}</div>}
              {app.group_3_rate > 0 && <div>3 personas: {fmtClp(app.group_3_rate)}</div>}
              {app.group_4_rate > 0 && <div>4 personas: {fmtClp(app.group_4_rate)}</div>}
              {app.group_5_rate > 0 && <div>5 personas: {fmtClp(app.group_5_rate)}</div>}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Contrato
            </div>
            <div style={{ fontSize: 12 }}>
              {app.contract_signed ? (
                <span style={{ color: '#22c55e' }}>
                  ✓ Firmado el {fmtDate(app.contract_signed_at)}
                </span>
              ) : (
                <span style={{ color: '#ef4444' }}>✗ No firmado</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────
export default function TutoresExternosTab() {
  const [tutorSubTab, setTutorSubTab] = useState<
    'overview' | 'applications' | 'subjects' | 'payments' | 'directory'
  >('overview');

  // Applications state
  const [applications, setApplications] = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{
    id: string;
    action: 'reject' | 'suspend' | 'reject_subject';
  } | null>(null);

  // Subjects state
  const [pendingSubjects, setPendingSubjects] = useState<any[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsTotal, setSubjectsTotal] = useState(0);

  // Directory state
  const [allTutors, setAllTutors] = useState<any[]>([]);
  const [dirLoading, setDirLoading] = useState(false);
  const [dirSearch, setDirSearch] = useState('');
  const [dirStatus, setDirStatus] = useState('');
  const [dirTotal, setDirTotal] = useState(0);

  // Payments state
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [payTotal, setPayTotal] = useState(0);

  // Overview stats
  const [stats, setStats] = useState({ active: 0, pending: 0, suspended: 0, pendingSubjects: 0 });

  const loadApplications = useCallback(() => {
    setAppsLoading(true);
    setAppsError('');
    api
      .getTutorApplications()
      .then((d: any) => setApplications(d.applications || []))
      .catch(() => setAppsError('No se pudo cargar las postulaciones'))
      .finally(() => setAppsLoading(false));
  }, []);

  const loadDirectory = useCallback(() => {
    setDirLoading(true);
    const params = new URLSearchParams();
    if (dirSearch) params.set('search', dirSearch);
    if (dirStatus) params.set('status', dirStatus);
    api
      .getAllTutors(params.toString())
      .then((d: any) => {
        setAllTutors(d.tutors || []);
        setDirTotal(d.total || 0);
      })
      .catch(() => {})
      .finally(() => setDirLoading(false));
  }, [dirSearch, dirStatus]);

  const loadPayments = useCallback(() => {
    setPaymentsLoading(true);
    api
      .getAdminTutorPayments()
      .then((d: any) => {
        setPayments(d.payments || []);
        setPayTotal(d.total || 0);
      })
      .catch(() => {})
      .finally(() => setPaymentsLoading(false));
  }, []);

  const loadSubjects = useCallback(() => {
    setSubjectsLoading(true);
    api
      .getAdminSubjects()
      .then((d: any) => {
        setPendingSubjects(d.subjects || []);
        setSubjectsTotal(d.total || 0);
      })
      .catch(() => {})
      .finally(() => setSubjectsLoading(false));
  }, []);

  const loadStats = useCallback(() => {
    Promise.all([
      api.getAllTutors('status=approved&per_page=1').catch(() => ({ total: 0 })),
      api.getTutorApplications().catch(() => ({ applications: [] })),
      api.getAllTutors('status=suspended&per_page=1').catch(() => ({ total: 0 })),
      api.getAdminSubjects().catch(() => ({ total: 0 })),
    ]).then(([active, pending, suspended, subs]) => {
      setStats({
        active: (active as any).total || 0,
        pending: ((pending as any).applications || []).length,
        suspended: (suspended as any).total || 0,
        pendingSubjects: (subs as any).total || 0,
      });
    });
  }, []);

  useEffect(() => {
    loadStats();
    if (tutorSubTab === 'applications') loadApplications();
    if (tutorSubTab === 'subjects') loadSubjects();
    if (tutorSubTab === 'directory') loadDirectory();
    if (tutorSubTab === 'payments') loadPayments();
  }, [tutorSubTab]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await api.approveTutor(id);
      loadApplications();
      loadStats();
    } catch (e: any) {
      alert(e?.message || 'Error al aprobar');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.id);
    setRejectModal(null);
    try {
      if (rejectModal.action === 'reject') {
        await api.rejectTutor(rejectModal.id, reason);
        loadApplications();
      } else if (rejectModal.action === 'suspend') {
        await api.suspendTutor(rejectModal.id, reason);
        loadDirectory();
      } else if (rejectModal.action === 'reject_subject') {
        await api.rejectSubject(rejectModal.id, reason);
        loadSubjects();
      }
      loadStats();
    } catch (e: any) {
      alert(e?.message || 'Error en la acción');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveSubject = async (id: string) => {
    setActionLoading(id);
    try {
      await api.approveSubject(id);
      loadSubjects();
      loadStats();
    } catch (e: any) {
      alert(e?.message || 'Error al aprobar asignatura');
    } finally {
      setActionLoading(null);
    }
  };

  const handleProcessPayment = async (id: string) => {
    setActionLoading(id);
    try {
      await api.processAdminTutorPayment(id);
      loadPayments();
    } catch (e: any) {
      alert(e?.message || 'Error al procesar pago');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        className="card"
        style={{
          padding: 20,
          marginBottom: 20,
          background: 'linear-gradient(135deg, #92400e, #f59e0b)',
          color: '#fff',
          borderRadius: 16,
        }}
      >
        <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={20} /> Tutores Externos — Prestadores de Servicios
        </h3>
        <p style={{ fontSize: 13, opacity: 0.9, margin: 0 }}>
          Gestión de tutores con boleta de honorarios. Comisión Conniku: 10%. El tutor recibe 90%
          bruto y es responsable de pagar su retención al SII (13.75%).
        </p>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { id: 'overview', label: 'Resumen' },
          {
            id: 'applications',
            label: `Postulaciones${stats.pending > 0 ? ` (${stats.pending})` : ''}`,
          },
          {
            id: 'subjects',
            label: `Asignaturas${stats.pendingSubjects > 0 ? ` (${stats.pendingSubjects})` : ''}`,
          },
          { id: 'directory', label: 'Directorio' },
          { id: 'payments', label: 'Pagos a Tutores' },
        ].map((st) => (
          <button
            key={st.id}
            onClick={() => setTutorSubTab(st.id as any)}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: tutorSubTab === st.id ? 'none' : '1px solid #f59e0b33',
              background: tutorSubTab === st.id ? '#f59e0b' : 'rgba(245,158,11,0.05)',
              color: tutorSubTab === st.id ? '#fff' : '#f59e0b',
              fontWeight: 600,
              fontSize: 12,
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tutorSubTab === 'overview' && (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #22c55e' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                Tutores Activos
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#22c55e' }}>{stats.active}</div>
            </div>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                Postulaciones Pendientes
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>{stats.pending}</div>
            </div>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #ef4444' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                Suspendidos
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#ef4444' }}>
                {stats.suspended}
              </div>
            </div>
            <div
              className="card"
              style={{ padding: 16, borderLeft: '4px solid #8b5cf6', cursor: 'pointer' }}
              onClick={() => setTutorSubTab('subjects')}
            >
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                Asignaturas Pendientes
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#8b5cf6' }}>
                {stats.pendingSubjects}
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>
              Cómo Funciona el Sistema de Tutores
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
              }}
            >
              {[
                {
                  step: 1,
                  title: 'Estudiante Paga',
                  desc: 'El estudiante selecciona un tutor, elige la clase y paga a través de Conniku. Conniku retiene el 100% hasta confirmar la clase.',
                },
                {
                  step: 2,
                  title: 'Clase con Jitsi',
                  desc: 'El tutor usa la sala Jitsi integrada. El estudiante accede desde la plataforma. Ambos registran clock in/out.',
                },
                {
                  step: 3,
                  title: 'Pago al Tutor',
                  desc: 'Confirmada la clase por ambas partes, el tutor sube su boleta. Conniku paga el 90% en máx 7 días hábiles.',
                },
              ].map((s) => (
                <div
                  key={s.step}
                  style={{
                    padding: 16,
                    background: 'var(--bg-tertiary)',
                    borderRadius: 12,
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: '#f59e0b',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      margin: '0 auto 12px',
                    }}
                  >
                    {s.step}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {s.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing model */}
          <div className="card" style={{ padding: 20, borderLeft: '4px solid #f59e0b' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Modelo de Precios y Comisiones</h4>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 2 }}>
              <p>
                <strong>Comisión Conniku:</strong> 10% fijo sobre el monto pagado por el estudiante.
              </p>
              <p>
                <strong>Ejemplo:</strong> Estudiante paga $20.000 → Conniku retiene $2.000 (10%) →
                Tutor recibe $18.000 bruto.
              </p>
              <p>
                <strong>Boleta:</strong> El tutor emite boleta de honorarios por $18.000 a nombre de
                Conniku SpA, RUT 78.395.702-7.
              </p>
              <p>
                <strong>Retención SII:</strong> El tutor paga 13.75% al SII ($2.475). Neto tutor:
                $15.525.
              </p>
              <p>
                <strong>Frecuencia de pago:</strong> Por clase, quincenal o mensual (a elección del
                tutor al inscribirse).
              </p>
              <p>
                <strong>Plazo:</strong> Máximo 7 días hábiles desde recepción de boleta validada.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Applications ── */}
      {tutorSubTab === 'applications' && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <h4 style={{ margin: 0, fontSize: 14 }}>
              {appsLoading
                ? 'Cargando...'
                : `${applications.length} postulación${applications.length !== 1 ? 'es' : ''} pendiente${applications.length !== 1 ? 's' : ''}`}
            </h4>
            <button
              onClick={loadApplications}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
              }}
            >
              <RefreshCw size={13} /> Actualizar
            </button>
          </div>

          {appsError && (
            <div
              style={{
                padding: 16,
                background: 'rgba(239,68,68,0.08)',
                borderRadius: 8,
                color: '#ef4444',
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {appsError}
            </div>
          )}

          {!appsLoading && applications.length === 0 && !appsError && (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <UserPlus size={48} style={{ color: '#f59e0b', marginBottom: 12 }} />
              <h3>Sin postulaciones pendientes</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                Cuando un profesional solicite ser tutor, aparecerá aquí para revisión y aprobación.
              </p>
            </div>
          )}

          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              loading={actionLoading === app.id}
              onApprove={() => handleApprove(app.id)}
              onReject={() => setRejectModal({ id: app.id, action: 'reject' })}
            />
          ))}
        </div>
      )}

      {/* ── Subjects ── */}
      {tutorSubTab === 'subjects' && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <h4 style={{ margin: 0, fontSize: 14 }}>
              {subjectsLoading
                ? 'Cargando...'
                : `${subjectsTotal} asignatura${subjectsTotal !== 1 ? 's' : ''} en revisión`}
            </h4>
            <button
              onClick={loadSubjects}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
              }}
            >
              <RefreshCw size={13} /> Actualizar
            </button>
          </div>

          {!subjectsLoading && pendingSubjects.length === 0 && (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <CheckCircle size={48} style={{ color: '#22c55e', marginBottom: 12 }} />
              <h3>Sin asignaturas pendientes</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                Cuando un tutor envíe una asignatura para revisión, aparecerá aquí.
              </p>
            </div>
          )}

          {pendingSubjects.map((s) => (
            <div
              key={s.id}
              className="card"
              style={{ padding: 20, marginBottom: 12, borderLeft: '4px solid #8b5cf6' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: 15 }}>{s.name}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Tutor: <strong>{s.tutor_name}</strong> ({s.tutor_role_number})
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 14,
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      marginBottom: 8,
                    }}
                  >
                    {s.category && <span>📂 {s.category}</span>}
                    {s.level && <span>📊 {s.level}</span>}
                    <span>⏱ {s.duration_hours}h</span>
                    <span>👥 Máx {s.max_students} estudiantes</span>
                    <span>📅 {fmtDate(s.created_at)}</span>
                  </div>
                  {s.description && (
                    <div style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 6 }}>
                      {s.description}
                    </div>
                  )}
                  {s.learning_objectives && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                      <strong>Objetivos:</strong> {s.learning_objectives}
                    </div>
                  )}
                  {s.prerequisites && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      <strong>Requisitos previos:</strong> {s.prerequisites}
                    </div>
                  )}
                  {(s.materials || []).length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          marginBottom: 4,
                        }}
                      >
                        Materiales:
                      </div>
                      {(s.materials as any[]).map((m: any, i: number) => (
                        <div key={i} style={{ fontSize: 12 }}>
                          📎 {m.name || m}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    onClick={() => handleApproveSubject(s.id)}
                    disabled={actionLoading === s.id}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#22c55e',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <CheckCircle size={14} /> Aprobar
                  </button>
                  <button
                    onClick={() => setRejectModal({ id: s.id, action: 'reject_subject' })}
                    disabled={actionLoading === s.id}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#ef4444',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <XCircle size={14} /> Rechazar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Directory ── */}
      {tutorSubTab === 'directory' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                value={dirSearch}
                onChange={(e) => setDirSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadDirectory()}
                placeholder="Buscar por nombre, título, carrera..."
                style={{
                  width: '100%',
                  padding: '8px 10px 8px 32px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <select
              value={dirStatus}
              onChange={(e) => setDirStatus(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: 13,
              }}
            >
              <option value="">Todos los estados</option>
              <option value="approved">Aprobados</option>
              <option value="pending_review">Pendientes</option>
              <option value="rejected">Rechazados</option>
              <option value="suspended">Suspendidos</option>
            </select>
            <button
              onClick={loadDirectory}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                background: '#f59e0b',
                color: '#fff',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Buscar
            </button>
          </div>

          {dirLoading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
              Cargando...
            </div>
          ) : allTutors.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <Users size={48} style={{ color: '#f59e0b', marginBottom: 12 }} />
              <h3>Sin tutores registrados</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                {dirSearch || dirStatus
                  ? 'No hay resultados para esta búsqueda.'
                  : 'Aún no hay tutores en el sistema.'}
              </p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                {dirTotal} tutor{dirTotal !== 1 ? 'es' : ''} total
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {allTutors.map((t) => (
                  <div
                    key={t.id}
                    className="card"
                    style={{
                      padding: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}
                      >
                        <span style={{ fontWeight: 700 }}>{t.user_name}</span>
                        <StatusBadge status={t.status} />
                        <span
                          style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {t.tutor_role_number}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {t.professional_title} — {t.institution || t.career}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: 12,
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          marginTop: 4,
                        }}
                      >
                        <span>⭐ {(t.rating_average || 0).toFixed(1)}</span>
                        <span>📚 {t.total_classes} clases</span>
                        <span>👥 {t.total_students} estudiantes</span>
                        <span>💰 {fmtClp(t.individual_rate)}/h</span>
                      </div>
                    </div>
                    {t.status === 'approved' && (
                      <button
                        onClick={() => setRejectModal({ id: t.id, action: 'suspend' })}
                        disabled={actionLoading === t.id}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 8,
                          border: 'none',
                          background: '#ef444422',
                          color: '#ef4444',
                          fontWeight: 700,
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        Suspender
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Payments ── */}
      {tutorSubTab === 'payments' && (
        <div>
          {paymentsLoading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
              Cargando...
            </div>
          ) : payments.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <CreditCard size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <h3>Sin pagos pendientes</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                Los pagos aparecen cuando un tutor sube su boleta de honorarios después de una clase
                confirmada.
              </p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                {payTotal} pago{payTotal !== 1 ? 's' : ''} encontrado{payTotal !== 1 ? 's' : ''}
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {payments.map((p: any) => (
                  <div
                    key={p.id}
                    className="card"
                    style={{
                      padding: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>
                        {p.tutor_name || p.tutor_id}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {fmtClp(p.amount_clp)} bruto → Conniku {fmtClp(p.commission_clp)} → Tutor{' '}
                        {fmtClp(p.net_clp)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        Estado: <strong>{p.payment_status}</strong> | {fmtDate(p.created_at)}
                      </div>
                    </div>
                    {p.payment_status === 'pending_boleta' && (
                      <button
                        onClick={() => handleProcessPayment(p.id)}
                        disabled={actionLoading === p.id}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 8,
                          border: 'none',
                          background: '#3b82f6',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Procesar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Reject / Suspend modal */}
      {rejectModal && (
        <ReasonModal
          title={rejectModal.action === 'reject' ? 'Rechazar postulación' : 'Suspender tutor'}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectModal(null)}
        />
      )}
    </div>
  );
}
