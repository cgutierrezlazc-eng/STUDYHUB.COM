// ═════════════════════════════════════════════════════════════════
// DESEMPENO TAB — Evaluacion de Desempeno y Metas
// Modulo de Gestion de Rendimiento para Conniku SpA
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

type EvalType = '90' | '180' | '360';
type CycleStatus = 'activo' | 'cerrado' | 'borrador';
type GoalStatus = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';

interface EvalCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: EvalType;
  employeeIds: string[];
  status: CycleStatus;
  createdAt: string;
}

interface Evaluation {
  id: string;
  cycleId: string;
  employeeId: string;
  scores: Record<string, number>;
  overallScore: number;
  classification: string;
  strengths: string;
  improvements: string;
  developmentPlan: string;
  isDraft: boolean;
  createdAt: string;
}

interface Goal {
  id: string;
  employeeId: string;
  name: string;
  description: string;
  targetMetric: string;
  deadline: string;
  weight: number;
  progress: number;
  status: GoalStatus;
  createdAt: string;
}

// ─── Constants ──────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'objetivos', label: 'Cumplimiento de objetivos', weight: 0.3 },
  { key: 'calidad', label: 'Calidad del trabajo', weight: 0.2 },
  { key: 'iniciativa', label: 'Iniciativa y proactividad', weight: 0.15 },
  { key: 'equipo', label: 'Trabajo en equipo', weight: 0.15 },
  { key: 'puntualidad', label: 'Puntualidad y asistencia', weight: 0.1 },
  { key: 'comunicacion', label: 'Comunicación', weight: 0.1 },
];

function classify(score: number): string {
  if (score >= 4.5) return 'Sobresaliente';
  if (score >= 3.5) return 'Destacado';
  if (score >= 2.5) return 'Competente';
  if (score >= 1.5) return 'En desarrollo';
  return 'Insuficiente';
}

function classColor(c: string): string {
  if (c === 'Sobresaliente') return '#22c55e';
  if (c === 'Destacado') return '#3b82f6';
  if (c === 'Competente') return '#eab308';
  if (c === 'En desarrollo') return '#f97316';
  return '#ef4444';
}

const LS_CYCLES = 'conniku_eval_cycles';
const LS_EVALS = 'conniku_evaluations';
const LS_GOALS = 'conniku_goals';

function loadLS<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function saveLS<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function empName(id: string): string {
  const e = SEED_EMPLOYEES.find((x) => x.id === id);
  return e ? `${e.firstName} ${e.lastName}` : id;
}

// ─── Sub-components ─────────────────────────────────────────────

const card: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  borderRadius: 12,
  border: '1px solid var(--border)',
  padding: 16,
  marginBottom: 12,
};

const label: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase' as const,
  marginBottom: 4,
  letterSpacing: '0.04em',
};

const badge = (bg: string, color: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 700,
  background: bg,
  color,
});

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2, cursor: onChange ? 'pointer' : 'default' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          onClick={() => onChange?.(s)}
          style={{
            fontSize: 18,
            color: s <= value ? '#eab308' : 'var(--text-muted)',
            transition: 'color 0.15s',
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function ProgressBar({ value, color }: { value: number; color?: string }) {
  const c = color || (value >= 75 ? '#22c55e' : value >= 40 ? '#eab308' : '#ef4444');
  return (
    <div style={{ width: '100%', height: 8, borderRadius: 4, background: 'var(--border)' }}>
      <div
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          height: '100%',
          borderRadius: 4,
          background: c,
          transition: 'width 0.3s',
        }}
      />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════

export default function DesempenoTab() {
  const [tab, setTab] = useState<'ciclos' | 'evaluar' | 'metas' | 'historial'>('ciclos');

  // ─── State: Cycles ────────────────────────────────────────────
  const [cycles, setCycles] = useState<EvalCycle[]>(() => loadLS(LS_CYCLES, []));
  const [showCycleForm, setShowCycleForm] = useState(false);
  const [cycleForm, setCycleForm] = useState<Partial<EvalCycle>>({
    name: '',
    startDate: '',
    endDate: '',
    type: '90',
    employeeIds: [],
    status: 'borrador',
  });

  // ─── State: Evaluations ───────────────────────────────────────
  const [evals, setEvals] = useState<Evaluation[]>(() => loadLS(LS_EVALS, []));
  const [evalEmployeeId, setEvalEmployeeId] = useState('');
  const [evalCycleId, setEvalCycleId] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [devPlan, setDevPlan] = useState('');

  // ─── State: Goals ─────────────────────────────────────────────
  const [goals, setGoals] = useState<Goal[]>(() => loadLS(LS_GOALS, []));
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalForm, setGoalForm] = useState<Partial<Goal>>({
    employeeId: '',
    name: '',
    description: '',
    targetMetric: '',
    deadline: '',
    weight: 25,
    progress: 0,
    status: 'pendiente',
  });
  const [goalFilterEmp, setGoalFilterEmp] = useState('');

  // ─── State: Historial ─────────────────────────────────────────
  const [histEmpId, setHistEmpId] = useState('');

  // ─── Persist helpers ──────────────────────────────────────────
  function saveCycles(c: EvalCycle[]) {
    setCycles(c);
    saveLS(LS_CYCLES, c);
  }
  function saveEvals(e: Evaluation[]) {
    setEvals(e);
    saveLS(LS_EVALS, e);
  }
  function saveGoals(g: Goal[]) {
    setGoals(g);
    saveLS(LS_GOALS, g);
  }

  // ─── Computed ─────────────────────────────────────────────────
  const overallScore = CATEGORIES.reduce(
    (acc, cat) => acc + (scores[cat.key] || 0) * cat.weight,
    0
  );
  const overallClass = classify(overallScore);

  // ═════════════════════════════════════════════════════════════════
  // TAB NAVIGATION
  // ═════════════════════════════════════════════════════════════════

  const tabs: { key: typeof tab; label: string }[] = [
    { key: 'ciclos', label: 'Evaluaciones Activas' },
    { key: 'evaluar', label: 'Evaluar' },
    { key: 'metas', label: 'Metas y KPIs' },
    { key: 'historial', label: 'Historial' },
  ];

  // ═════════════════════════════════════════════════════════════════
  // TAB 1: CICLOS DE EVALUACION
  // ═════════════════════════════════════════════════════════════════

  function handleCreateCycle() {
    if (
      !cycleForm.name ||
      !cycleForm.startDate ||
      !cycleForm.endDate ||
      !cycleForm.employeeIds?.length
    )
      return;
    const newCycle: EvalCycle = {
      id: uid(),
      name: cycleForm.name!,
      startDate: cycleForm.startDate!,
      endDate: cycleForm.endDate!,
      type: (cycleForm.type as EvalType) || '90',
      employeeIds: cycleForm.employeeIds!,
      status: 'activo',
      createdAt: new Date().toISOString(),
    };
    saveCycles([newCycle, ...cycles]);
    setCycleForm({
      name: '',
      startDate: '',
      endDate: '',
      type: '90',
      employeeIds: [],
      status: 'borrador',
    });
    setShowCycleForm(false);
  }

  function toggleCycleEmployee(empId: string) {
    const current = cycleForm.employeeIds || [];
    setCycleForm({
      ...cycleForm,
      employeeIds: current.includes(empId)
        ? current.filter((x) => x !== empId)
        : [...current, empId],
    });
  }

  function closeCycle(cycleId: string) {
    saveCycles(
      cycles.map((c) => (c.id === cycleId ? { ...c, status: 'cerrado' as CycleStatus } : c))
    );
  }

  function deleteCycle(cycleId: string) {
    saveCycles(cycles.filter((c) => c.id !== cycleId));
  }

  function cycleProgress(cycleId: string): { done: number; total: number } {
    const cycle = cycles.find((c) => c.id === cycleId);
    if (!cycle) return { done: 0, total: 0 };
    const completed = evals.filter((e) => e.cycleId === cycleId && !e.isDraft).length;
    return { done: completed, total: cycle.employeeIds.length };
  }

  function renderCiclos() {
    return (
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)' }}>
              Ciclos de Evaluacion
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              {cycles.filter((c) => c.status === 'activo').length} ciclo(s) activo(s)
            </p>
          </div>
          <button style={btnPrimary} onClick={() => setShowCycleForm(!showCycleForm)}>
            {showCycleForm ? 'Cancelar' : '+ Nuevo Ciclo'}
          </button>
        </div>

        {showCycleForm && (
          <div style={{ ...card, border: '1px solid var(--accent)' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>
              Crear Ciclo de Evaluacion
            </h4>
            <div style={grid2}>
              <div>
                <div style={label}>Nombre del ciclo</div>
                <input
                  style={inputStyle}
                  placeholder="Ej: Semestre 1 2026"
                  value={cycleForm.name || ''}
                  onChange={(e) => setCycleForm({ ...cycleForm, name: e.target.value })}
                />
              </div>
              <div>
                <div style={label}>Tipo de evaluacion</div>
                <select
                  style={selectStyle}
                  value={cycleForm.type || '90'}
                  onChange={(e) => setCycleForm({ ...cycleForm, type: e.target.value as EvalType })}
                >
                  <option value="90">90° — Jefe evalua</option>
                  <option value="180">180° — Jefe + Autoevaluacion</option>
                  <option value="360">360° — Jefe + Auto + Pares + Subordinados</option>
                </select>
              </div>
              <div>
                <div style={label}>Fecha inicio</div>
                <input
                  type="date"
                  style={inputStyle}
                  value={cycleForm.startDate || ''}
                  onChange={(e) => setCycleForm({ ...cycleForm, startDate: e.target.value })}
                />
              </div>
              <div>
                <div style={label}>Fecha fin</div>
                <input
                  type="date"
                  style={inputStyle}
                  value={cycleForm.endDate || ''}
                  onChange={(e) => setCycleForm({ ...cycleForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={label}>Empleados incluidos</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {SEED_EMPLOYEES.map((emp) => {
                  const selected = (cycleForm.employeeIds || []).includes(emp.id);
                  return (
                    <button
                      key={emp.id}
                      onClick={() => toggleCycleEmployee(emp.id)}
                      style={{
                        ...btnSmall,
                        background: selected ? 'var(--accent)' : 'var(--bg-secondary)',
                        color: selected ? '#fff' : 'var(--text-secondary)',
                        border: selected ? '1px solid var(--accent)' : '1px solid var(--border)',
                      }}
                    >
                      {emp.firstName} {emp.lastName}
                    </button>
                  );
                })}
                <button
                  style={{ ...btnSmall, fontStyle: 'italic' }}
                  onClick={() =>
                    setCycleForm({ ...cycleForm, employeeIds: SEED_EMPLOYEES.map((e) => e.id) })
                  }
                >
                  Seleccionar todos
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button style={btnPrimary} onClick={handleCreateCycle}>
                Crear Ciclo
              </button>
              <button style={btnSecondary} onClick={() => setShowCycleForm(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {cycles.length === 0 && !showCycleForm && (
          <div style={{ ...card, textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 14 }}>No hay ciclos de evaluacion creados</p>
            <p style={{ fontSize: 12 }}>Crea un nuevo ciclo para comenzar a evaluar a tu equipo</p>
          </div>
        )}

        {cycles.map((cycle) => {
          const prog = cycleProgress(cycle.id);
          const pct = prog.total > 0 ? Math.round((prog.done / prog.total) * 100) : 0;
          return (
            <div key={cycle.id} style={card}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {cycle.name}
                    </span>
                    <span
                      style={badge(
                        cycle.status === 'activo'
                          ? 'rgba(34,197,94,0.15)'
                          : 'rgba(156,163,175,0.15)',
                        cycle.status === 'activo' ? '#22c55e' : '#9ca3af'
                      )}
                    >
                      {cycle.status === 'activo' ? 'Activo' : 'Cerrado'}
                    </span>
                    <span style={badge('rgba(59,130,246,0.15)', '#3b82f6')}>
                      {cycle.type === '90' ? '90°' : cycle.type === '180' ? '180°' : '360°'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {cycle.startDate} — {cycle.endDate} | {cycle.employeeIds.length} empleado(s)
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {cycle.status === 'activo' && (
                    <button style={btnSmall} onClick={() => closeCycle(cycle.id)}>
                      Cerrar
                    </button>
                  )}
                  <button
                    style={{ ...btnSmall, color: '#ef4444' }}
                    onClick={() => deleteCycle(cycle.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginBottom: 4,
                  }}
                >
                  <span>
                    {prog.done} de {prog.total} evaluaciones completadas
                  </span>
                  <span>{pct}%</span>
                </div>
                <ProgressBar value={pct} color="var(--accent)" />
              </div>
              {/* Employee list */}
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {cycle.employeeIds.map((eid) => {
                  const hasEval = evals.some(
                    (e) => e.cycleId === cycle.id && e.employeeId === eid && !e.isDraft
                  );
                  return (
                    <span
                      key={eid}
                      style={{
                        ...badge(
                          hasEval ? 'rgba(34,197,94,0.12)' : 'rgba(234,179,8,0.12)',
                          hasEval ? '#22c55e' : '#eab308'
                        ),
                        fontSize: 10,
                      }}
                    >
                      {empName(eid)} {hasEval ? '✓' : '○'}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // TAB 2: EVALUAR
  // ═════════════════════════════════════════════════════════════════

  function handleSubmitEval(isDraft: boolean) {
    if (!evalEmployeeId || !evalCycleId) return;
    const hasAnyScore = Object.values(scores).some((s) => s > 0);
    if (!isDraft && !hasAnyScore) return;

    const newEval: Evaluation = {
      id: uid(),
      cycleId: evalCycleId,
      employeeId: evalEmployeeId,
      scores: { ...scores },
      overallScore: Math.round(overallScore * 100) / 100,
      classification: overallClass,
      strengths,
      improvements,
      developmentPlan: devPlan,
      isDraft,
      createdAt: new Date().toISOString(),
    };

    // Replace existing eval for same cycle+employee if exists
    const filtered = evals.filter(
      (e) => !(e.cycleId === evalCycleId && e.employeeId === evalEmployeeId)
    );
    saveEvals([newEval, ...filtered]);

    // Reset form
    setScores({});
    setStrengths('');
    setImprovements('');
    setDevPlan('');
  }

  function loadExistingEval(cycleId: string, empId: string) {
    const existing = evals.find((e) => e.cycleId === cycleId && e.employeeId === empId);
    if (existing) {
      setScores(existing.scores);
      setStrengths(existing.strengths);
      setImprovements(existing.improvements);
      setDevPlan(existing.developmentPlan);
    } else {
      setScores({});
      setStrengths('');
      setImprovements('');
      setDevPlan('');
    }
  }

  function renderEvaluar() {
    const activeCycles = cycles.filter((c) => c.status === 'activo');
    const selectedCycle = cycles.find((c) => c.id === evalCycleId);
    const availableEmployees = selectedCycle
      ? SEED_EMPLOYEES.filter((e) => selectedCycle.employeeIds.includes(e.id))
      : [];

    return (
      <div>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, color: 'var(--text-primary)' }}>
          Formulario de Evaluacion
        </h3>

        {activeCycles.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 14 }}>No hay ciclos activos</p>
            <p style={{ fontSize: 12 }}>
              Crea un ciclo en la pestana "Evaluaciones Activas" primero
            </p>
          </div>
        ) : (
          <>
            <div style={{ ...card }}>
              <div style={grid2}>
                <div>
                  <div style={label}>Ciclo de evaluacion</div>
                  <select
                    style={selectStyle}
                    value={evalCycleId}
                    onChange={(e) => {
                      setEvalCycleId(e.target.value);
                      setEvalEmployeeId('');
                      setScores({});
                    }}
                  >
                    <option value="">Seleccionar ciclo...</option>
                    {activeCycles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type}°)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={label}>Empleado</div>
                  <select
                    style={selectStyle}
                    value={evalEmployeeId}
                    onChange={(e) => {
                      setEvalEmployeeId(e.target.value);
                      loadExistingEval(evalCycleId, e.target.value);
                    }}
                  >
                    <option value="">Seleccionar empleado...</option>
                    {availableEmployees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.firstName} {e.lastName} — {e.position}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {evalEmployeeId && evalCycleId && (
              <>
                {/* Scoring */}
                <div style={card}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>
                    Calificacion por Categoria
                  </h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th style={{ ...thStyle, textAlign: 'left' }}>Categoria</th>
                        <th style={thStyle}>Peso</th>
                        <th style={thStyle}>Puntuacion</th>
                        <th style={thStyle}>Ponderado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CATEGORIES.map((cat) => (
                        <tr key={cat.key} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{cat.label}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            {Math.round(cat.weight * 100)}%
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <Stars
                              value={scores[cat.key] || 0}
                              onChange={(v) => setScores({ ...scores, [cat.key]: v })}
                            />
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>
                            {((scores[cat.key] || 0) * cat.weight).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Overall score */}
                  <div
                    style={{
                      marginTop: 16,
                      padding: 16,
                      borderRadius: 10,
                      background: `${classColor(overallClass)}15`,
                      border: `1px solid ${classColor(overallClass)}40`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                        PUNTAJE FINAL
                      </div>
                      <div
                        style={{ fontSize: 28, fontWeight: 800, color: classColor(overallClass) }}
                      >
                        {overallScore.toFixed(2)}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        background: classColor(overallClass),
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {overallClass}
                    </div>
                  </div>
                </div>

                {/* Qualitative feedback */}
                <div style={card}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>
                    Retroalimentacion Cualitativa
                  </h4>
                  <div style={{ marginBottom: 12 }}>
                    <div style={label}>Fortalezas</div>
                    <textarea
                      style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
                      placeholder="Principales fortalezas del colaborador..."
                      value={strengths}
                      onChange={(e) => setStrengths(e.target.value)}
                    />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={label}>Areas de mejora</div>
                    <textarea
                      style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
                      placeholder="Aspectos a mejorar..."
                      value={improvements}
                      onChange={(e) => setImprovements(e.target.value)}
                    />
                  </div>
                  <div>
                    <div style={label}>Plan de desarrollo (metas proximo periodo)</div>
                    <textarea
                      style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
                      placeholder="Objetivos y acciones concretas para el siguiente periodo..."
                      value={devPlan}
                      onChange={(e) => setDevPlan(e.target.value)}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={btnPrimary} onClick={() => handleSubmitEval(false)}>
                    Enviar Evaluacion
                  </button>
                  <button style={btnSecondary} onClick={() => handleSubmitEval(true)}>
                    Guardar Borrador
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // TAB 3: METAS Y KPIs
  // ═════════════════════════════════════════════════════════════════

  function handleCreateGoal() {
    if (!goalForm.employeeId || !goalForm.name || !goalForm.deadline) return;
    const newGoal: Goal = {
      id: uid(),
      employeeId: goalForm.employeeId!,
      name: goalForm.name!,
      description: goalForm.description || '',
      targetMetric: goalForm.targetMetric || '',
      deadline: goalForm.deadline!,
      weight: goalForm.weight || 25,
      progress: 0,
      status: 'pendiente',
      createdAt: new Date().toISOString(),
    };
    saveGoals([newGoal, ...goals]);
    setGoalForm({
      employeeId: '',
      name: '',
      description: '',
      targetMetric: '',
      deadline: '',
      weight: 25,
      progress: 0,
      status: 'pendiente',
    });
    setShowGoalForm(false);
  }

  function updateGoalProgress(goalId: string, progress: number) {
    saveGoals(
      goals.map((g) => {
        if (g.id !== goalId) return g;
        const status: GoalStatus =
          progress >= 100 ? 'completada' : progress > 0 ? 'en_progreso' : 'pendiente';
        return { ...g, progress: Math.min(100, Math.max(0, progress)), status };
      })
    );
  }

  function deleteGoal(goalId: string) {
    saveGoals(goals.filter((g) => g.id !== goalId));
  }

  function renderMetas() {
    const filtered = goalFilterEmp ? goals.filter((g) => g.employeeId === goalFilterEmp) : goals;

    // KPI summary per employee
    const empSummary = SEED_EMPLOYEES.map((emp) => {
      const empGoals = goals.filter((g) => g.employeeId === emp.id);
      if (empGoals.length === 0) return null;
      const avgProgress = empGoals.reduce((s, g) => s + g.progress, 0) / empGoals.length;
      const completed = empGoals.filter((g) => g.status === 'completada').length;
      const overdue = empGoals.filter(
        (g) => g.deadline < new Date().toISOString().slice(0, 10) && g.status !== 'completada'
      ).length;
      return { emp, avgProgress, completed, total: empGoals.length, overdue };
    }).filter(Boolean) as {
      emp: (typeof SEED_EMPLOYEES)[0];
      avgProgress: number;
      completed: number;
      total: number;
      overdue: number;
    }[];

    return (
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)' }}>Metas y KPIs</h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              {goals.length} meta(s) registrada(s) |{' '}
              {goals.filter((g) => g.status === 'completada').length} completada(s)
            </p>
          </div>
          <button style={btnPrimary} onClick={() => setShowGoalForm(!showGoalForm)}>
            {showGoalForm ? 'Cancelar' : '+ Nueva Meta'}
          </button>
        </div>

        {/* KPI Dashboard */}
        {empSummary.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 10,
              marginBottom: 16,
            }}
          >
            {empSummary.map(({ emp, avgProgress, completed, total, overdue }) => {
              const color =
                avgProgress >= 75 ? '#22c55e' : avgProgress >= 40 ? '#eab308' : '#ef4444';
              return (
                <div
                  key={emp.id}
                  style={{
                    ...card,
                    marginBottom: 0,
                    cursor: 'pointer',
                    border:
                      goalFilterEmp === emp.id
                        ? '1px solid var(--accent)'
                        : '1px solid var(--border)',
                  }}
                  onClick={() => setGoalFilterEmp(goalFilterEmp === emp.id ? '' : emp.id)}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: 6,
                    }}
                  >
                    {emp.firstName} {emp.lastName}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                    {completed}/{total} metas |{' '}
                    {overdue > 0 ? (
                      <span style={{ color: '#ef4444' }}>{overdue} vencida(s)</span>
                    ) : (
                      'Al dia'
                    )}
                  </div>
                  <ProgressBar value={avgProgress} color={color} />
                  <div
                    style={{
                      fontSize: 11,
                      color,
                      fontWeight: 700,
                      marginTop: 4,
                      textAlign: 'right',
                    }}
                  >
                    {Math.round(avgProgress)}%
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Filter */}
        <div style={{ marginBottom: 12 }}>
          <select
            style={{ ...selectStyle, maxWidth: 280 }}
            value={goalFilterEmp}
            onChange={(e) => setGoalFilterEmp(e.target.value)}
          >
            <option value="">Todos los empleados</option>
            {SEED_EMPLOYEES.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Goal creation form */}
        {showGoalForm && (
          <div style={{ ...card, border: '1px solid var(--accent)' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>
              Nueva Meta
            </h4>
            <div style={grid2}>
              <div>
                <div style={label}>Empleado</div>
                <select
                  style={selectStyle}
                  value={goalForm.employeeId || ''}
                  onChange={(e) => setGoalForm({ ...goalForm, employeeId: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  {SEED_EMPLOYEES.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div style={label}>Nombre de la meta</div>
                <input
                  style={inputStyle}
                  placeholder="Ej: Aumentar ventas 20%"
                  value={goalForm.name || ''}
                  onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                />
              </div>
              <div>
                <div style={label}>Descripcion</div>
                <input
                  style={inputStyle}
                  placeholder="Detalle de la meta..."
                  value={goalForm.description || ''}
                  onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                />
              </div>
              <div>
                <div style={label}>Metrica objetivo</div>
                <input
                  style={inputStyle}
                  placeholder="Ej: $10M en ventas, 95% NPS"
                  value={goalForm.targetMetric || ''}
                  onChange={(e) => setGoalForm({ ...goalForm, targetMetric: e.target.value })}
                />
              </div>
              <div>
                <div style={label}>Fecha limite</div>
                <input
                  type="date"
                  style={inputStyle}
                  value={goalForm.deadline || ''}
                  onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
                />
              </div>
              <div>
                <div style={label}>Peso (%)</div>
                <input
                  type="number"
                  style={inputStyle}
                  min={1}
                  max={100}
                  value={goalForm.weight || 25}
                  onChange={(e) => setGoalForm({ ...goalForm, weight: Number(e.target.value) })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button style={btnPrimary} onClick={handleCreateGoal}>
                Crear Meta
              </button>
              <button style={btnSecondary} onClick={() => setShowGoalForm(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Goals list */}
        {filtered.length === 0 && !showGoalForm ? (
          <div style={{ ...card, textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 14 }}>No hay metas registradas</p>
          </div>
        ) : (
          filtered.map((goal) => {
            const isOverdue =
              goal.deadline < new Date().toISOString().slice(0, 10) && goal.status !== 'completada';
            const statusColor =
              goal.status === 'completada'
                ? '#22c55e'
                : goal.status === 'cancelada'
                  ? '#9ca3af'
                  : isOverdue
                    ? '#ef4444'
                    : goal.status === 'en_progreso'
                      ? '#3b82f6'
                      : '#eab308';
            const statusLabel =
              goal.status === 'completada'
                ? 'Completada'
                : goal.status === 'cancelada'
                  ? 'Cancelada'
                  : isOverdue
                    ? 'Vencida'
                    : goal.status === 'en_progreso'
                      ? 'En progreso'
                      : 'Pendiente';

            return (
              <div key={goal.id} style={card}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {goal.name}
                      </span>
                      <span style={badge(`${statusColor}20`, statusColor)}>{statusLabel}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Peso: {goal.weight}%
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {empName(goal.employeeId)} | Limite: {goal.deadline}
                      {goal.targetMetric && ` | Metrica: ${goal.targetMetric}`}
                    </div>
                    {goal.description && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                        {goal.description}
                      </div>
                    )}
                  </div>
                  <button
                    style={{ ...btnSmall, color: '#ef4444' }}
                    onClick={() => deleteGoal(goal.id)}
                  >
                    Eliminar
                  </button>
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <ProgressBar value={goal.progress} />
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        minWidth: 36,
                        textAlign: 'right',
                      }}
                    >
                      {goal.progress}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                    {[0, 25, 50, 75, 100].map((v) => (
                      <button
                        key={v}
                        style={{
                          ...btnSmall,
                          background: goal.progress === v ? 'var(--accent)' : 'var(--bg-secondary)',
                          color: goal.progress === v ? '#fff' : 'var(--text-muted)',
                          fontSize: 10,
                          padding: '4px 8px',
                        }}
                        onClick={() => updateGoalProgress(goal.id, v)}
                      >
                        {v}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // TAB 4: HISTORIAL
  // ═════════════════════════════════════════════════════════════════

  function renderHistorial() {
    const empEvals = histEmpId ? evals.filter((e) => e.employeeId === histEmpId && !e.isDraft) : [];
    const sortedEvals = [...empEvals].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    // Trend calculation
    let trendLabel = '';
    let trendColor = 'var(--text-muted)';
    if (sortedEvals.length >= 2) {
      const latest = sortedEvals[0].overallScore;
      const previous = sortedEvals[1].overallScore;
      const diff = latest - previous;
      if (diff > 0.2) {
        trendLabel = 'Mejorando';
        trendColor = '#22c55e';
      } else if (diff < -0.2) {
        trendLabel = 'Declinando';
        trendColor = '#ef4444';
      } else {
        trendLabel = 'Estable';
        trendColor = '#eab308';
      }
    }

    return (
      <div>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, color: 'var(--text-primary)' }}>
          Historial de Evaluaciones
        </h3>

        <div style={{ marginBottom: 16 }}>
          <div style={label}>Seleccionar empleado</div>
          <select
            style={{ ...selectStyle, maxWidth: 320 }}
            value={histEmpId}
            onChange={(e) => setHistEmpId(e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {SEED_EMPLOYEES.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName}
              </option>
            ))}
          </select>
        </div>

        {histEmpId && sortedEvals.length === 0 && (
          <div style={{ ...card, textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 14 }}>Sin evaluaciones completadas para este empleado</p>
          </div>
        )}

        {histEmpId && sortedEvals.length > 0 && (
          <>
            {/* Summary card */}
            <div
              style={{
                ...card,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 16,
                textAlign: 'center',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  EVALUACIONES
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {sortedEvals.length}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  ULTIMA NOTA
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: classColor(sortedEvals[0].classification),
                  }}
                >
                  {sortedEvals[0].overallScore.toFixed(1)}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: classColor(sortedEvals[0].classification),
                    fontWeight: 600,
                  }}
                >
                  {sortedEvals[0].classification}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  TENDENCIA
                </div>
                {trendLabel ? (
                  <>
                    <div style={{ fontSize: 24, fontWeight: 800, color: trendColor }}>
                      {trendLabel === 'Mejorando' ? '↑' : trendLabel === 'Declinando' ? '↓' : '→'}
                    </div>
                    <div style={{ fontSize: 11, color: trendColor, fontWeight: 600 }}>
                      {trendLabel}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Se requieren 2+ evaluaciones
                  </div>
                )}
              </div>
            </div>

            {/* Comparison chart (text-based) */}
            {sortedEvals.length >= 2 && (
              <div style={card}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>
                  Comparacion entre Periodos
                </h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Categoria</th>
                      {sortedEvals.slice(0, 3).map((ev, i) => {
                        const cycle = cycles.find((c) => c.id === ev.cycleId);
                        return (
                          <th key={i} style={thStyle}>
                            {cycle?.name || `Eval ${i + 1}`}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {CATEGORIES.map((cat) => (
                      <tr key={cat.key} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{cat.label}</td>
                        {sortedEvals.slice(0, 3).map((ev, i) => (
                          <td key={i} style={{ ...tdStyle, textAlign: 'center' }}>
                            <Stars value={ev.scores[cat.key] || 0} />
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr style={{ borderTop: '2px solid var(--border)' }}>
                      <td style={{ ...tdStyle, fontWeight: 800 }}>TOTAL</td>
                      {sortedEvals.slice(0, 3).map((ev, i) => (
                        <td
                          key={i}
                          style={{
                            ...tdStyle,
                            textAlign: 'center',
                            fontWeight: 800,
                            color: classColor(ev.classification),
                          }}
                        >
                          {ev.overallScore.toFixed(2)} — {ev.classification}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Individual evaluation details */}
            {sortedEvals.map((ev, idx) => {
              const cycle = cycles.find((c) => c.id === ev.cycleId);
              return (
                <div key={ev.id} style={card}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {cycle?.name || 'Ciclo eliminado'}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                        {new Date(ev.createdAt).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                    <div
                      style={{
                        padding: '4px 12px',
                        borderRadius: 8,
                        background: `${classColor(ev.classification)}20`,
                        color: classColor(ev.classification),
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      {ev.overallScore.toFixed(1)} — {ev.classification}
                    </div>
                  </div>

                  {/* Scores breakdown */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 6,
                      marginBottom: 10,
                    }}
                  >
                    {CATEGORIES.map((cat) => (
                      <div
                        key={cat.key}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: 12,
                        }}
                      >
                        <span style={{ color: 'var(--text-secondary)' }}>{cat.label}</span>
                        <Stars value={ev.scores[cat.key] || 0} />
                      </div>
                    ))}
                  </div>

                  {/* Qualitative */}
                  {ev.strengths && (
                    <div style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e' }}>
                        Fortalezas:{' '}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {ev.strengths}
                      </span>
                    </div>
                  )}
                  {ev.improvements && (
                    <div style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#f97316' }}>
                        Areas de mejora:{' '}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {ev.improvements}
                      </span>
                    </div>
                  )}
                  {ev.developmentPlan && (
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6' }}>
                        Plan de desarrollo:{' '}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {ev.developmentPlan}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════

  return (
    <div>
      {/* Tab navigation */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 20,
          padding: 4,
          background: 'var(--bg-secondary)',
          borderRadius: 10,
          border: '1px solid var(--border)',
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              background: tab === t.key ? 'var(--accent)' : 'transparent',
              color: tab === t.key ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'ciclos' && renderCiclos()}
      {tab === 'evaluar' && renderEvaluar()}
      {tab === 'metas' && renderMetas()}
      {tab === 'historial' && renderHistorial()}
    </div>
  );
}
