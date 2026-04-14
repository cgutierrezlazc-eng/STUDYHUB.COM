// ═════════════════════════════════════════════════════════════════
// CAPACITACION TAB — Plan de Capacitación y Franquicia SENCE
// Cumplimiento Ley N° 19.518, Estatuto de Capacitación y Empleo
// ODI: Art. 21 DS 40 (Obligación de Informar)
// ═════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  btnPrimary,
  btnSecondary,
  btnSmall,
  inputStyle,
  selectStyle,
  thStyle,
  tdStyle,
  grid2,
  fmt,
} from '../shared/styles';
import { SEED_EMPLOYEES } from '../shared/seedEmployees';

// ─── Types ──────────────────────────────────────────────────────

type Modalidad = 'Presencial' | 'E-learning' | 'Blended';
type EstadoCurso = 'Planificada' | 'En curso' | 'Completada' | 'Cancelada';
type TipoCurso = 'Técnica' | 'Habilidades blandas' | 'Seguridad laboral (ODI)' | 'Normativa';
type SubTab = 'plan' | 'sence' | 'registro' | 'metricas';

interface Training {
  id: string;
  nombre: string;
  proveedorOTEC: string;
  modalidad: Modalidad;
  duracionHoras: number;
  fechaInicio: string;
  fechaFin: string;
  costoCLP: number;
  empleadosInscritos: string[]; // employee IDs
  estado: EstadoCurso;
  tipo: TipoCurso;
  codigoSENCE: string | null;
  acogidoFranquicia: boolean;
  montoImputado: number;
  certificadoURL: string | null;
}

// ─── Constants ──────────────────────────────────────────────────

const STORAGE_KEY = 'conniku_capacitacion_v2'; // v2: limpia datos demo previos
const MODALIDADES: Modalidad[] = ['Presencial', 'E-learning', 'Blended'];
const ESTADOS: EstadoCurso[] = ['Planificada', 'En curso', 'Completada', 'Cancelada'];
const TIPOS: TipoCurso[] = [
  'Técnica',
  'Habilidades blandas',
  'Seguridad laboral (ODI)',
  'Normativa',
];

// Ley 19.518 Art. 36: Franquicia tributaria = 1% planilla anual remuneraciones imponibles
const FRANQUICIA_PERCENT = 0.01;

// ─── Helpers ────────────────────────────────────────────────────

function loadTrainings(): Training[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveTrainings(t: Training[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
}

function empName(id: string): string {
  const e = SEED_EMPLOYEES.find((x) => x.id === id);
  return e ? `${e.firstName} ${e.lastName}` : id;
}

function estadoBadge(estado: EstadoCurso): React.CSSProperties {
  const colors: Record<EstadoCurso, { bg: string; color: string }> = {
    Planificada: { bg: '#3b82f620', color: '#3b82f6' },
    'En curso': { bg: '#f59e0b20', color: '#f59e0b' },
    Completada: { bg: '#22c55e20', color: '#22c55e' },
    Cancelada: { bg: '#ef444420', color: '#ef4444' },
  };
  const c = colors[estado];
  return {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    background: c.bg,
    color: c.color,
  };
}

function tipoBadge(tipo: TipoCurso): React.CSSProperties {
  const colors: Record<TipoCurso, { bg: string; color: string }> = {
    Técnica: { bg: '#8b5cf620', color: '#8b5cf6' },
    'Habilidades blandas': { bg: '#06b6d420', color: '#06b6d4' },
    'Seguridad laboral (ODI)': { bg: '#ef444420', color: '#ef4444' },
    Normativa: { bg: '#64748b20', color: '#64748b' },
  };
  const c = colors[tipo];
  return {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    background: c.bg,
    color: c.color,
  };
}

// ─── Planilla anual calculation ─────────────────────────────────
// Sum of grossSalary * 12 for all active employees = planilla anual imponible
function calcPlanillaAnual(): number {
  return SEED_EMPLOYEES.filter((e) => e.status === 'active').reduce(
    (sum, e) => sum + e.grossSalary * 12,
    0
  );
}

// ═════════════════════════════════════════════════════════════════
// COMPONENT
// ═════════════════════════════════════════════════════════════════

export default function CapacitacionTab() {
  const [subTab, setSubTab] = useState<SubTab>('plan');
  const [trainings, setTrainings] = useState<Training[]>(loadTrainings);
  const [showForm, setShowForm] = useState(false);
  const [filterEmpleado, setFilterEmpleado] = useState('');

  // ─── Form state ─────────────────────────────────────────────
  const blank: Omit<Training, 'id'> = {
    nombre: '',
    proveedorOTEC: '',
    modalidad: 'Presencial',
    duracionHoras: 0,
    fechaInicio: '',
    fechaFin: '',
    costoCLP: 0,
    empleadosInscritos: [],
    estado: 'Planificada',
    tipo: 'Técnica',
    codigoSENCE: null,
    acogidoFranquicia: false,
    montoImputado: 0,
    certificadoURL: null,
  };
  const [form, setForm] = useState(blank);

  function persist(updated: Training[]) {
    setTrainings(updated);
    saveTrainings(updated);
  }

  function handleAdd() {
    const t: Training = { ...form, id: `cap-${Date.now()}` } as Training;
    persist([...trainings, t]);
    setForm(blank);
    setShowForm(false);
  }

  function toggleEmpleado(id: string) {
    setForm((f) => ({
      ...f,
      empleadosInscritos: f.empleadosInscritos.includes(id)
        ? f.empleadosInscritos.filter((x) => x !== id)
        : [...f.empleadosInscritos, id],
    }));
  }

  function updateEstado(id: string, estado: EstadoCurso) {
    persist(trainings.map((t) => (t.id === id ? { ...t, estado } : t)));
  }

  // ─── Calculations ───────────────────────────────────────────
  const planillaAnual = calcPlanillaAnual();
  const topeFranquicia = Math.round(planillaAnual * FRANQUICIA_PERCENT);
  const montoUsado = trainings
    .filter((t) => t.acogidoFranquicia && t.estado !== 'Cancelada')
    .reduce((s, t) => s + t.montoImputado, 0);
  const saldoFranquicia = topeFranquicia - montoUsado;
  const pctUsado = topeFranquicia > 0 ? (montoUsado / topeFranquicia) * 100 : 0;

  const completadas = trainings.filter((t) => t.estado === 'Completada');
  const totalInversion = trainings
    .filter((t) => t.estado !== 'Cancelada')
    .reduce((s, t) => s + t.costoCLP, 0);

  // ─── Sub-tab selector ──────────────────────────────────────
  const tabs: { key: SubTab; label: string }[] = [
    { key: 'plan', label: 'Plan de Capacitación' },
    { key: 'sence', label: 'Franquicia SENCE' },
    { key: 'registro', label: 'Registro de Capacitaciones' },
    { key: 'metricas', label: 'Métricas' },
  ];

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Sub-tabs */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          borderBottom: '1px solid var(--border)',
          paddingBottom: 8,
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            style={{
              ...btnSmall,
              background: subTab === t.key ? 'var(--accent)' : 'var(--bg-secondary)',
              color: subTab === t.key ? '#fff' : 'var(--text-secondary)',
              border: subTab === t.key ? '1px solid var(--accent)' : '1px solid var(--border)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB 1: PLAN DE CAPACITACION ─────────────────────── */}
      {subTab === 'plan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header + Add button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)' }}>
                Plan Anual de Capacitación 2026
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                Ley N° 19.518 — Estatuto de Capacitación y Empleo
              </p>
            </div>
            <button style={btnPrimary} onClick={() => setShowForm(!showForm)}>
              {showForm ? '✕ Cerrar' : '+ Agregar Capacitación'}
            </button>
          </div>

          {/* Add form */}
          {showForm && (
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                Nueva Capacitación
              </div>
              <div style={grid2}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                    Nombre del Curso
                  </label>
                  <input
                    style={inputStyle}
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Nombre del curso"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                    Proveedor / OTEC
                  </label>
                  <input
                    style={inputStyle}
                    value={form.proveedorOTEC}
                    onChange={(e) => setForm({ ...form, proveedorOTEC: e.target.value })}
                    placeholder="Organismo Técnico de Capacitación"
                  />
                </div>
              </div>
              <div style={grid2}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                    Modalidad
                  </label>
                  <select
                    style={selectStyle}
                    value={form.modalidad}
                    onChange={(e) => setForm({ ...form, modalidad: e.target.value as Modalidad })}
                  >
                    {MODALIDADES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                    Tipo
                  </label>
                  <select
                    style={selectStyle}
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoCurso })}
                  >
                    {TIPOS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={grid2}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                    Duración (horas)
                  </label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={form.duracionHoras || ''}
                    onChange={(e) => setForm({ ...form, duracionHoras: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                    Costo (CLP)
                  </label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={form.costoCLP || ''}
                    onChange={(e) => setForm({ ...form, costoCLP: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div style={grid2}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                    Fecha Inicio
                  </label>
                  <input
                    style={inputStyle}
                    type="date"
                    value={form.fechaInicio}
                    onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                    Fecha Fin
                  </label>
                  <input
                    style={inputStyle}
                    type="date"
                    value={form.fechaFin}
                    onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
                  />
                </div>
              </div>
              <div style={grid2}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                    Código SENCE (opcional)
                  </label>
                  <input
                    style={inputStyle}
                    value={form.codigoSENCE || ''}
                    onChange={(e) => setForm({ ...form, codigoSENCE: e.target.value || null })}
                    placeholder="Ej: 1238-0045-2026"
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 18 }}>
                  <input
                    type="checkbox"
                    checked={form.acogidoFranquicia}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        acogidoFranquicia: e.target.checked,
                        montoImputado: e.target.checked ? form.costoCLP : 0,
                      })
                    }
                  />
                  <label style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                    Acogido a Franquicia SENCE
                  </label>
                </div>
              </div>

              {/* Employee multi-select */}
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Empleados Inscritos
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {SEED_EMPLOYEES.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => toggleEmpleado(e.id)}
                      style={{
                        ...btnSmall,
                        background: form.empleadosInscritos.includes(e.id)
                          ? 'var(--accent)'
                          : 'var(--bg-secondary)',
                        color: form.empleadosInscritos.includes(e.id)
                          ? '#fff'
                          : 'var(--text-secondary)',
                        border: form.empleadosInscritos.includes(e.id)
                          ? '1px solid var(--accent)'
                          : '1px solid var(--border)',
                      }}
                    >
                      {e.firstName} {e.lastName}
                    </button>
                  ))}
                </div>
              </div>

              <button
                style={{ ...btnPrimary, alignSelf: 'flex-start' }}
                onClick={handleAdd}
                disabled={!form.nombre || !form.fechaInicio}
              >
                Guardar Capacitación
              </button>
            </div>
          )}

          {/* Calendar view */}
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 12,
              }}
            >
              Calendario de Capacitaciones
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {trainings
                .filter((t) => t.estado !== 'Cancelada')
                .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))
                .map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div
                      style={{
                        minWidth: 56,
                        textAlign: 'center',
                        padding: '4px 8px',
                        borderRadius: 8,
                        background: 'var(--accent)',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {t.fechaInicio.slice(5)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {t.nombre}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {t.proveedorOTEC} — {t.duracionHoras}h — {t.modalidad}
                      </div>
                    </div>
                    <span style={tipoBadge(t.tipo)}>{t.tipo}</span>
                    <span style={estadoBadge(t.estado)}>{t.estado}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Full training list table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={thStyle}>Curso</th>
                  <th style={thStyle}>OTEC</th>
                  <th style={thStyle}>Tipo</th>
                  <th style={thStyle}>Horas</th>
                  <th style={thStyle}>Fechas</th>
                  <th style={thStyle}>Costo</th>
                  <th style={thStyle}>Inscritos</th>
                  <th style={thStyle}>Estado</th>
                  <th style={thStyle}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {trainings.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ ...tdStyle, fontWeight: 600, maxWidth: 200 }}>{t.nombre}</td>
                    <td style={tdStyle}>{t.proveedorOTEC}</td>
                    <td style={tdStyle}>
                      <span style={tipoBadge(t.tipo)}>{t.tipo}</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{t.duracionHoras}</td>
                    <td style={{ ...tdStyle, fontSize: 11 }}>
                      {t.fechaInicio} / {t.fechaFin}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(t.costoCLP)}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {t.empleadosInscritos.map((id) => (
                          <span
                            key={id}
                            style={{
                              fontSize: 10,
                              padding: '2px 6px',
                              borderRadius: 10,
                              background: 'var(--bg-primary)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {empName(id).split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={estadoBadge(t.estado)}>{t.estado}</span>
                    </td>
                    <td style={tdStyle}>
                      <select
                        style={{ ...selectStyle, padding: '4px 6px', fontSize: 11, width: 'auto' }}
                        value={t.estado}
                        onChange={(e) => updateEstado(t.id, e.target.value as EstadoCurso)}
                      >
                        {ESTADOS.map((es) => (
                          <option key={es} value={es}>
                            {es}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: FRANQUICIA SENCE ─────────────────────────── */}
      {subTab === 'sence' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Legal reference */}
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: '#3b82f610',
              border: '1px solid #3b82f630',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6', marginBottom: 8 }}>
              Franquicia Tributaria SENCE — Ley N° 19.518
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <p style={{ margin: '0 0 6px' }}>
                <strong>Art. 36:</strong> Las empresas contribuyentes de primera categoría de la Ley
                de Impuesto a la Renta podrán descontar del impuesto a pagar, los gastos efectuados
                en programas de capacitación de sus trabajadores, hasta un monto equivalente al{' '}
                <strong>1% de la planilla anual de remuneraciones imponibles</strong>.
              </p>
              <p style={{ margin: '0 0 6px' }}>
                <strong>Art. 46:</strong> Los cursos deben ser impartidos por Organismos Técnicos de
                Capacitación (OTEC) acreditados por el SENCE y estar registrados con un código SENCE
                válido.
              </p>
              <p style={{ margin: 0 }}>
                <strong>Art. 10:</strong> Las actividades de capacitación deberán contribuir a
                elevar la productividad de la empresa y ser pertinentes a las funciones del
                trabajador. El SENCE fiscaliza la adecuada utilización de la franquicia.
              </p>
            </div>
          </div>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                Planilla Anual Imponible
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                ${fmt(planillaAnual)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {SEED_EMPLOYEES.filter((e) => e.status === 'active').length} trabajadores activos
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                Tope Franquicia (1%)
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#3b82f6' }}>
                ${fmt(topeFranquicia)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Máximo descontable de impuestos
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                Monto Imputado
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>
                ${fmt(montoUsado)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {pctUsado.toFixed(1)}% utilizado
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                Saldo Disponible
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: saldoFranquicia >= 0 ? '#22c55e' : '#ef4444',
                }}
              >
                ${fmt(saldoFranquicia)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Restante por usar</div>
            </div>
          </div>

          {/* Alert if near limit */}
          {pctUsado >= 80 && (
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: pctUsado >= 100 ? '#ef444415' : '#f59e0b15',
                border: `1px solid ${pctUsado >= 100 ? '#ef444440' : '#f59e0b40'}`,
                fontSize: 12,
                color: pctUsado >= 100 ? '#ef4444' : '#f59e0b',
                fontWeight: 600,
              }}
            >
              {pctUsado >= 100
                ? 'Se ha excedido el tope de franquicia SENCE. El excedente no será descontable de impuestos.'
                : `Atención: Se ha utilizado el ${pctUsado.toFixed(1)}% de la franquicia tributaria. Quedan $${fmt(saldoFranquicia)} disponibles.`}
            </div>
          )}

          {/* Progress bar */}
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 10,
              }}
            >
              Utilización de Franquicia Tributaria
            </div>
            <div
              style={{
                height: 24,
                borderRadius: 12,
                background: 'var(--bg-primary)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  height: '100%',
                  borderRadius: 12,
                  width: `${Math.min(pctUsado, 100)}%`,
                  background: pctUsado >= 100 ? '#ef4444' : pctUsado >= 80 ? '#f59e0b' : '#22c55e',
                  transition: 'width 0.5s ease',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                {pctUsado.toFixed(1)}% — ${fmt(montoUsado)} / ${fmt(topeFranquicia)}
              </div>
            </div>
          </div>

          {/* SENCE courses table */}
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 12,
              }}
            >
              Cursos Acogidos a Franquicia SENCE
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={thStyle}>Código SENCE</th>
                  <th style={thStyle}>Curso</th>
                  <th style={thStyle}>OTEC</th>
                  <th style={thStyle}>Horas</th>
                  <th style={thStyle}>Costo</th>
                  <th style={thStyle}>Imputado</th>
                  <th style={thStyle}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {trainings
                  .filter((t) => t.acogidoFranquicia)
                  .map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 600 }}>
                        {t.codigoSENCE || '—'}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{t.nombre}</td>
                      <td style={tdStyle}>{t.proveedorOTEC}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{t.duracionHoras}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(t.costoCLP)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>
                        ${fmt(t.montoImputado)}
                      </td>
                      <td style={tdStyle}>
                        <span style={estadoBadge(t.estado)}>{t.estado}</span>
                      </td>
                    </tr>
                  ))}
                {trainings.filter((t) => t.acogidoFranquicia).length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)' }}
                    >
                      No hay cursos acogidos a franquicia SENCE
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: REGISTRO DE CAPACITACIONES ───────────────── */}
      {subTab === 'registro' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)' }}>
                Registro de Capacitaciones Completadas
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                Cumplimiento ODI — Art. 21 DS 40 (Obligación de Informar sobre riesgos laborales)
              </p>
            </div>
            <div>
              <select
                style={selectStyle}
                value={filterEmpleado}
                onChange={(e) => setFilterEmpleado(e.target.value)}
              >
                <option value="">Todos los empleados</option>
                {SEED_EMPLOYEES.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ODI Compliance alert */}
          {(() => {
            const odiTrainings = trainings.filter(
              (t) => t.tipo === 'Seguridad laboral (ODI)' && t.estado === 'Completada'
            );
            const allEmployeeIds = SEED_EMPLOYEES.map((e) => e.id);
            const odiCoveredIds = new Set(odiTrainings.flatMap((t) => t.empleadosInscritos));
            const missing = allEmployeeIds.filter((id) => !odiCoveredIds.has(id));
            if (missing.length > 0) {
              return (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: '#ef444415',
                    border: '1px solid #ef444440',
                    fontSize: 12,
                    color: '#ef4444',
                  }}
                >
                  <strong>Alerta ODI (Art. 21 DS 40):</strong> Los siguientes trabajadores no tienen
                  capacitación de seguridad completada:{' '}
                  {missing.map((id) => empName(id)).join(', ')}. La empresa está obligada a informar
                  a los trabajadores sobre los riesgos laborales, las medidas preventivas y los
                  métodos de trabajo correctos.
                </div>
              );
            }
            return null;
          })()}

          {/* Per-employee view */}
          {SEED_EMPLOYEES.filter((e) => !filterEmpleado || e.id === filterEmpleado).map((emp) => {
            const empTrainings = trainings.filter((t) => t.empleadosInscritos.includes(emp.id));
            const empCompleted = empTrainings.filter((t) => t.estado === 'Completada');
            const totalHours = empCompleted.reduce((s, t) => s + t.duracionHoras, 0);
            const hasODI = empTrainings.some(
              (t) => t.tipo === 'Seguridad laboral (ODI)' && t.estado === 'Completada'
            );
            // Minimum recommended: 20 hrs/year based on industry best practice
            const minHours = 20;

            return (
              <div
                key={emp.id}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {emp.firstName} {emp.lastName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {emp.position} — {emp.department}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '3px 10px',
                        borderRadius: 20,
                        fontWeight: 700,
                        background: hasODI ? '#22c55e20' : '#ef444420',
                        color: hasODI ? '#22c55e' : '#ef4444',
                      }}
                    >
                      ODI: {hasODI ? 'Cumple' : 'Pendiente'}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '3px 10px',
                        borderRadius: 20,
                        fontWeight: 700,
                        background: totalHours >= minHours ? '#22c55e20' : '#f59e0b20',
                        color: totalHours >= minHours ? '#22c55e' : '#f59e0b',
                      }}
                    >
                      {totalHours}h / {minHours}h
                    </span>
                  </div>
                </div>

                {/* Hours progress bar */}
                <div
                  style={{
                    height: 8,
                    borderRadius: 4,
                    background: 'var(--bg-primary)',
                    overflow: 'hidden',
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 4,
                      width: `${Math.min((totalHours / minHours) * 100, 100)}%`,
                      background: totalHours >= minHours ? '#22c55e' : '#f59e0b',
                    }}
                  />
                </div>

                {empTrainings.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th style={thStyle}>Curso</th>
                        <th style={thStyle}>Horas</th>
                        <th style={thStyle}>Tipo</th>
                        <th style={thStyle}>Estado</th>
                        <th style={thStyle}>Certificado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {empTrainings.map((t) => (
                        <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{t.nombre}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>{t.duracionHoras}</td>
                          <td style={tdStyle}>
                            <span style={tipoBadge(t.tipo)}>{t.tipo}</span>
                          </td>
                          <td style={tdStyle}>
                            <span style={estadoBadge(t.estado)}>{t.estado}</span>
                          </td>
                          <td style={tdStyle}>
                            {t.estado === 'Completada' ? (
                              t.certificadoURL ? (
                                <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>
                                  {t.certificadoURL}
                                </span>
                              ) : (
                                <button
                                  style={btnSmall}
                                  onClick={() => {
                                    const filename = `cert_${t.nombre.replace(/\s+/g, '_').slice(0, 30)}.pdf`;
                                    persist(
                                      trainings.map((tr) =>
                                        tr.id === t.id ? { ...tr, certificadoURL: filename } : tr
                                      )
                                    );
                                  }}
                                >
                                  Subir Certificado
                                </button>
                              )
                            ) : (
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      textAlign: 'center',
                      padding: 12,
                    }}
                  >
                    Sin capacitaciones registradas
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── TAB 4: METRICAS ─────────────────────────────────── */}
      {subTab === 'metricas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)' }}>
            Métricas de Capacitación
          </h3>

          {/* Top KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                Total Horas Capacitadas
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                {completadas.reduce((s, t) => s + t.duracionHoras * t.empleadosInscritos.length, 0)}
                h
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                horas-persona completadas
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                Inversión Total
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#8b5cf6' }}>
                ${fmt(totalInversion)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                en capacitaciones activas
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                Franquicia SENCE
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#3b82f6' }}>
                {pctUsado.toFixed(1)}%
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>del 1% utilizado</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                Cursos Completados
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#22c55e' }}>
                {completadas.length}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                de {trainings.length} totales
              </div>
            </div>
          </div>

          {/* Hours per employee */}
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 12,
              }}
            >
              Horas Capacitadas por Empleado
            </div>
            {SEED_EMPLOYEES.map((emp) => {
              const hrs = trainings
                .filter((t) => t.empleadosInscritos.includes(emp.id) && t.estado === 'Completada')
                .reduce((s, t) => s + t.duracionHoras, 0);
              const maxHrs = 60; // visual max for bar
              return (
                <div
                  key={emp.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}
                >
                  <div
                    style={{
                      width: 140,
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {emp.firstName} {emp.lastName}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: 16,
                      borderRadius: 8,
                      background: 'var(--bg-primary)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        borderRadius: 8,
                        width: `${Math.min((hrs / maxHrs) * 100, 100)}%`,
                        background: 'var(--accent)',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      width: 40,
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      textAlign: 'right',
                    }}
                  >
                    {hrs}h
                  </div>
                </div>
              );
            })}
          </div>

          {/* Investment per department */}
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 12,
              }}
            >
              Inversión por Departamento
            </div>
            {(() => {
              const deptMap: Record<string, { hours: number; cost: number; count: number }> = {};
              trainings
                .filter((t) => t.estado !== 'Cancelada')
                .forEach((t) => {
                  t.empleadosInscritos.forEach((empId) => {
                    const emp = SEED_EMPLOYEES.find((e) => e.id === empId);
                    if (!emp) return;
                    const dept = emp.department;
                    if (!deptMap[dept]) deptMap[dept] = { hours: 0, cost: 0, count: 0 };
                    deptMap[dept].hours += t.duracionHoras;
                    deptMap[dept].cost += Math.round(t.costoCLP / t.empleadosInscritos.length);
                    deptMap[dept].count++;
                  });
                });
              const depts = Object.entries(deptMap).sort((a, b) => b[1].cost - a[1].cost);
              const maxCost = depts.length > 0 ? depts[0][1].cost : 1;

              return depts.map(([dept, data]) => (
                <div
                  key={dept}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}
                >
                  <div
                    style={{
                      width: 120,
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {dept}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: 16,
                      borderRadius: 8,
                      background: 'var(--bg-primary)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        borderRadius: 8,
                        width: `${(data.cost / maxCost) * 100}%`,
                        background: '#8b5cf6',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      width: 100,
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      textAlign: 'right',
                    }}
                  >
                    ${fmt(data.cost)}
                  </div>
                  <div
                    style={{
                      width: 50,
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      textAlign: 'right',
                    }}
                  >
                    {data.hours}h
                  </div>
                </div>
              ));
            })()}
          </div>

          {/* Upcoming expirations */}
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 12,
              }}
            >
              Vencimientos Próximos (Certificaciones de Seguridad)
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {(() => {
                const safetyTrainings = trainings.filter(
                  (t) => t.tipo === 'Seguridad laboral (ODI)' && t.estado === 'Completada'
                );
                if (safetyTrainings.length === 0) {
                  return (
                    <span>
                      No hay certificaciones de seguridad completadas. Se recomienda programar
                      capacitación ODI a la brevedad.
                    </span>
                  );
                }
                return safetyTrainings.map((t) => {
                  // ODI trainings typically need renewal annually
                  const completionDate = new Date(t.fechaFin);
                  const expiryDate = new Date(completionDate);
                  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                  const now = new Date();
                  const daysLeft = Math.round(
                    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const isExpiringSoon = daysLeft <= 90;

                  return (
                    <div
                      key={t.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderRadius: 8,
                        marginBottom: 6,
                        background: isExpiringSoon ? '#f59e0b10' : 'var(--bg-primary)',
                        border: `1px solid ${isExpiringSoon ? '#f59e0b30' : 'var(--border)'}`,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {t.nombre}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Vence: {expiryDate.toISOString().slice(0, 10)} —{' '}
                          {t.empleadosInscritos.length} trabajadores
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontWeight: 700,
                          background: isExpiringSoon ? '#f59e0b20' : '#22c55e20',
                          color: isExpiringSoon ? '#f59e0b' : '#22c55e',
                        }}
                      >
                        {daysLeft > 0 ? `${daysLeft} días restantes` : 'VENCIDO'}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Training type distribution */}
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 12,
              }}
            >
              Distribución por Tipo de Capacitación
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {TIPOS.map((tipo) => {
                const count = trainings.filter(
                  (t) => t.tipo === tipo && t.estado !== 'Cancelada'
                ).length;
                const hours = trainings
                  .filter((t) => t.tipo === tipo && t.estado !== 'Cancelada')
                  .reduce((s, t) => s + t.duracionHoras, 0);
                return (
                  <div
                    key={tipo}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      textAlign: 'center',
                    }}
                  >
                    <span style={tipoBadge(tipo)}>{tipo}</span>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        marginTop: 8,
                      }}
                    >
                      {count}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      cursos — {hours}h
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared card style ──────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 12,
  border: '1px solid var(--border)',
  background: 'var(--bg-secondary)',
};
