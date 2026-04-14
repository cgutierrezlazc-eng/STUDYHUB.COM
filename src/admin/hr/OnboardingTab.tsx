// ═════════════════════════════════════════════════════════════════
// ONBOARDING / OFFBOARDING TAB
// Gestión de Ingreso y Salida de Personal — Conniku SpA
// Ref: Código del Trabajo Art. 9 (contrato escrito), Art. 159-163
// (terminación), Art. 177 (finiquito ante ministro de fe)
// ═════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
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
import { DEPARTMENTS } from '../shared/constants';

// ─── Types ──────────────────────────────────────────────────────

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  responsible: string;
  dueDate: string;
  notes: string;
}

interface OnboardingProcess {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  startDate: string;
  templateId: string;
  items: ChecklistItem[];
  status: 'en_curso' | 'completado' | 'cancelado';
  createdAt: string;
}

interface OffboardingProcess {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  exitDate: string;
  exitReason:
    | 'renuncia'
    | 'despido_necesidades'
    | 'despido_causal'
    | 'mutuo_acuerdo'
    | 'termino_plazo';
  items: ChecklistItem[];
  status: 'en_curso' | 'completado' | 'cancelado';
  createdAt: string;
}

interface Template {
  id: string;
  name: string;
  type: 'onboarding' | 'offboarding';
  department: string | null;
  items: { label: string; defaultResponsible: string }[];
  isDefault: boolean;
}

// ─── Default Templates ──────────────────────────────────────────

const DEFAULT_ONBOARDING_ITEMS: { label: string; defaultResponsible: string }[] = [
  {
    label: 'Contrato firmado (Art. 9 Código del Trabajo — plazo 15 días)',
    defaultResponsible: 'RRHH',
  },
  { label: 'Copia cédula de identidad', defaultResponsible: 'RRHH' },
  { label: 'Certificado AFP', defaultResponsible: 'RRHH' },
  { label: 'Certificado salud (Fonasa/Isapre)', defaultResponsible: 'RRHH' },
  { label: 'Certificado de antecedentes', defaultResponsible: 'RRHH' },
  { label: 'Ficha de datos personales', defaultResponsible: 'RRHH' },
  { label: 'Foto tipo carnet', defaultResponsible: 'RRHH' },
  { label: 'Entrega de credencial/acceso', defaultResponsible: 'Operaciones' },
  { label: 'Inducción empresa (cultura, políticas)', defaultResponsible: 'RRHH' },
  { label: 'Inducción cargo (funciones, KPIs)', defaultResponsible: 'Jefatura directa' },
  { label: 'Configuración email corporativo', defaultResponsible: 'TI' },
  { label: 'Alta en sistema de asistencia', defaultResponsible: 'TI' },
  { label: 'Entrega de equipamiento/herramientas', defaultResponsible: 'Operaciones' },
  {
    label: 'Firma Reglamento Interno de Orden, Higiene y Seguridad (Art. 153 CT)',
    defaultResponsible: 'RRHH',
  },
  { label: 'Registro en mutual de seguridad (Ley 16.744)', defaultResponsible: 'RRHH' },
];

const DEFAULT_OFFBOARDING_ITEMS: { label: string; defaultResponsible: string }[] = [
  {
    label: 'Carta de renuncia / Notificación de despido (Art. 159-163 CT)',
    defaultResponsible: 'RRHH',
  },
  { label: 'Cálculo de finiquito', defaultResponsible: 'RRHH' },
  { label: 'Devolución de equipos', defaultResponsible: 'Operaciones' },
  { label: 'Desactivación de accesos (email, sistemas)', defaultResponsible: 'TI' },
  { label: 'Entrega de documentos pendientes', defaultResponsible: 'RRHH' },
  { label: 'Certificado de antigüedad', defaultResponsible: 'RRHH' },
  { label: 'Pago de vacaciones pendientes (Art. 73 CT)', defaultResponsible: 'RRHH' },
  {
    label: 'Firma de finiquito ante notario/Inspección del Trabajo (Art. 177 CT)',
    defaultResponsible: 'RRHH',
  },
  { label: 'Baja en Previred', defaultResponsible: 'RRHH' },
  { label: 'Entrega certificado AFC (Ley 19.728)', defaultResponsible: 'RRHH' },
];

// ─── Storage Keys ───────────────────────────────────────────────

const STORAGE_KEYS = {
  onboarding: 'conniku_onboarding_processes',
  offboarding: 'conniku_offboarding_processes',
  templates: 'conniku_onoff_templates',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return fallback;
}

function saveToStorage(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Shared Sub-Components ──────────────────────────────────────

const card: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  borderRadius: 12,
  border: '1px solid var(--border)',
  padding: 16,
  marginBottom: 12,
};

const badge = (color: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 700,
  background: `${color}22`,
  color,
});

const EXIT_REASONS: { value: OffboardingProcess['exitReason']; label: string }[] = [
  { value: 'renuncia', label: 'Renuncia voluntaria (Art. 159 Nº2)' },
  { value: 'despido_necesidades', label: 'Necesidades de la empresa (Art. 161)' },
  { value: 'despido_causal', label: 'Despido con causal (Art. 160)' },
  { value: 'mutuo_acuerdo', label: 'Mutuo acuerdo (Art. 159 Nº1)' },
  { value: 'termino_plazo', label: 'Vencimiento plazo fijo (Art. 159 Nº4)' },
];

// ─── Progress Bar ───────────────────────────────────────────────

function ProgressBar({ items }: { items: ChecklistItem[] }) {
  const done = items.filter((i) => i.completed).length;
  const pct = items.length > 0 ? Math.round((done / items.length) * 100) : 0;
  const color = pct === 100 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--bg-primary)' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 4,
            background: color,
            transition: 'width 0.3s',
          }}
        />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color }}>{pct}%</span>
      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
        ({done}/{items.length})
      </span>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════

export default function OnboardingTab() {
  const [subTab, setSubTab] = useState<'onboarding' | 'offboarding' | 'plantillas'>('onboarding');

  // ─── Data State ─────────────────────────────────────────────
  const [onboardings, setOnboardings] = useState<OnboardingProcess[]>(() =>
    loadFromStorage(STORAGE_KEYS.onboarding, [])
  );
  const [offboardings, setOffboardings] = useState<OffboardingProcess[]>(() =>
    loadFromStorage(STORAGE_KEYS.offboarding, [])
  );
  const [templates, setTemplates] = useState<Template[]>(() =>
    loadFromStorage(STORAGE_KEYS.templates, [
      {
        id: 'tpl-on-default',
        name: 'Onboarding Chile (Estándar)',
        type: 'onboarding',
        department: null,
        items: DEFAULT_ONBOARDING_ITEMS,
        isDefault: true,
      },
      {
        id: 'tpl-off-default',
        name: 'Offboarding Chile (Estándar)',
        type: 'offboarding',
        department: null,
        items: DEFAULT_OFFBOARDING_ITEMS,
        isDefault: true,
      },
    ])
  );

  // Persist on change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.onboarding, onboardings);
  }, [onboardings]);
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.offboarding, offboardings);
  }, [offboardings]);
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.templates, templates);
  }, [templates]);

  // ─── Sub-tab navigation ─────────────────────────────────────
  const tabs: { key: typeof subTab; label: string }[] = [
    { key: 'onboarding', label: 'Onboarding (Ingreso)' },
    { key: 'offboarding', label: 'Offboarding (Salida)' },
    { key: 'plantillas', label: 'Plantillas' },
  ];

  return (
    <div>
      {/* Sub-tab bar */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 20,
          borderBottom: '1px solid var(--border)',
          paddingBottom: 8,
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: subTab === t.key ? 'var(--accent)' : 'transparent',
              color: subTab === t.key ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'onboarding' && (
        <OnboardingSection
          processes={onboardings}
          setProcesses={setOnboardings}
          templates={templates.filter((t) => t.type === 'onboarding')}
        />
      )}
      {subTab === 'offboarding' && (
        <OffboardingSection
          processes={offboardings}
          setProcesses={setOffboardings}
          templates={templates.filter((t) => t.type === 'offboarding')}
        />
      )}
      {subTab === 'plantillas' && (
        <TemplatesSection templates={templates} setTemplates={setTemplates} />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// SECTION 1: ONBOARDING
// ═════════════════════════════════════════════════════════════════

function OnboardingSection({
  processes,
  setProcesses,
  templates,
}: {
  processes: OnboardingProcess[];
  setProcesses: React.Dispatch<React.SetStateAction<OnboardingProcess[]>>;
  templates: Template[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const onboardingTemplates = templates.filter((t) => t.type === 'onboarding');
  const [selectedTplId, setSelectedTplId] = useState(onboardingTemplates[0]?.id || '');
  const [startDate, setStartDate] = useState(todayStr());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Ensure template is selected when templates load
  useEffect(() => {
    if (!selectedTplId && onboardingTemplates.length > 0) {
      setSelectedTplId(onboardingTemplates[0].id);
    }
  }, [onboardingTemplates.length]);

  const handleCreate = () => {
    const emp = SEED_EMPLOYEES.find((e) => e.id === selectedEmpId);
    const tplId = selectedTplId || onboardingTemplates[0]?.id;
    const tpl = templates.find((t) => t.id === tplId);
    if (!emp || !tpl) return;

    // Prevent duplicates for active processes
    if (processes.some((p) => p.employeeId === emp.id && p.status === 'en_curso')) return;

    const newProcess: OnboardingProcess = {
      id: genId(),
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      department: emp.department,
      position: emp.position,
      startDate,
      templateId: tpl.id,
      items: tpl.items.map((item, idx) => ({
        id: `item-${idx}`,
        label: item.label,
        completed: false,
        responsible: item.defaultResponsible,
        dueDate: startDate,
        notes: '',
      })),
      status: 'en_curso',
      createdAt: new Date().toISOString(),
    };
    setProcesses((prev) => [newProcess, ...prev]);
    setShowForm(false);
    setSelectedEmpId('');
  };

  const toggleItem = (processId: string, itemId: string) => {
    setProcesses((prev) =>
      prev.map((p) => {
        if (p.id !== processId) return p;
        const items = p.items.map((i) => (i.id === itemId ? { ...i, completed: !i.completed } : i));
        const allDone = items.every((i) => i.completed);
        return { ...p, items, status: allDone ? 'completado' : 'en_curso' };
      })
    );
  };

  const updateItemField = (
    processId: string,
    itemId: string,
    field: keyof ChecklistItem,
    value: string
  ) => {
    setProcesses((prev) =>
      prev.map((p) => {
        if (p.id !== processId) return p;
        return {
          ...p,
          items: p.items.map((i) => (i.id === itemId ? { ...i, [field]: value } : i)),
        };
      })
    );
  };

  const cancelProcess = (processId: string) => {
    setProcesses((prev) =>
      prev.map((p) => (p.id === processId ? { ...p, status: 'cancelado' } : p))
    );
  };

  const active = processes.filter((p) => p.status === 'en_curso');
  const completed = processes.filter((p) => p.status === 'completado');
  const cancelled = processes.filter((p) => p.status === 'cancelado');

  return (
    <div>
      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {[
          { label: 'En Curso', value: active.length, color: '#3b82f6' },
          { label: 'Completados', value: completed.length, color: '#22c55e' },
          { label: 'Cancelados', value: cancelled.length, color: '#ef4444' },
        ].map((s) => (
          <div key={s.label} style={{ ...card, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* New onboarding button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Procesos de Onboarding
        </h3>
        <button style={btnPrimary} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nuevo Onboarding'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{ ...card, border: '1px solid var(--accent)' }}>
          <h4
            style={{
              margin: '0 0 12px',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Iniciar Proceso de Onboarding
          </h4>
          <div style={grid2}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                Colaborador
              </label>
              <select
                style={selectStyle}
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {SEED_EMPLOYEES.filter((e) => e.status === 'active').map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} — {e.position}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                Plantilla
              </label>
              <select
                style={selectStyle}
                value={selectedTplId}
                onChange={(e) => setSelectedTplId(e.target.value)}
              >
                {onboardingTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                Fecha de ingreso
              </label>
              <input
                type="date"
                style={inputStyle}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                style={btnPrimary}
                onClick={handleCreate}
                disabled={!selectedEmpId || !selectedTplId}
              >
                Crear Onboarding
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process list */}
      {processes.length === 0 && (
        <div style={{ ...card, textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          No hay procesos de onboarding. Presiona "+ Nuevo Onboarding" para comenzar.
        </div>
      )}

      {processes.map((proc) => {
        const isExpanded = expandedId === proc.id;
        return (
          <div key={proc.id} style={{ ...card, opacity: proc.status === 'cancelado' ? 0.5 : 1 }}>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
                cursor: 'pointer',
              }}
              onClick={() => setExpandedId(isExpanded ? null : proc.id)}
            >
              <div>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                  {proc.employeeName}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                  {proc.position} · {proc.department}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={badge(
                    proc.status === 'en_curso'
                      ? '#3b82f6'
                      : proc.status === 'completado'
                        ? '#22c55e'
                        : '#ef4444'
                  )}
                >
                  {proc.status === 'en_curso'
                    ? 'En Curso'
                    : proc.status === 'completado'
                      ? 'Completado'
                      : 'Cancelado'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Ingreso: {proc.startDate}
                </span>
                <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>
                  {isExpanded ? '▾' : '▸'}
                </span>
              </div>
            </div>

            <ProgressBar items={proc.items} />

            {/* Expanded checklist */}
            {isExpanded && proc.status !== 'cancelado' && (
              <div style={{ marginTop: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ ...thStyle, width: 30 }}>✓</th>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Ítem</th>
                      <th style={{ ...thStyle, width: 140 }}>Responsable</th>
                      <th style={{ ...thStyle, width: 120 }}>Fecha límite</th>
                      <th style={{ ...thStyle, width: 160 }}>Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proc.items.map((item) => (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          opacity: item.completed ? 0.6 : 1,
                        }}
                      >
                        <td style={tdStyle}>
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => toggleItem(proc.id, item.id)}
                          />
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            textDecoration: item.completed ? 'line-through' : 'none',
                            fontSize: 12,
                          }}
                        >
                          {item.label}
                        </td>
                        <td style={tdStyle}>
                          <input
                            style={{ ...inputStyle, padding: '4px 6px', fontSize: 11 }}
                            value={item.responsible}
                            onChange={(e) =>
                              updateItemField(proc.id, item.id, 'responsible', e.target.value)
                            }
                          />
                        </td>
                        <td style={tdStyle}>
                          <input
                            type="date"
                            style={{ ...inputStyle, padding: '4px 6px', fontSize: 11 }}
                            value={item.dueDate}
                            onChange={(e) =>
                              updateItemField(proc.id, item.id, 'dueDate', e.target.value)
                            }
                          />
                        </td>
                        <td style={tdStyle}>
                          <input
                            style={{ ...inputStyle, padding: '4px 6px', fontSize: 11 }}
                            placeholder="Nota..."
                            value={item.notes}
                            onChange={(e) =>
                              updateItemField(proc.id, item.id, 'notes', e.target.value)
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {proc.status === 'en_curso' && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <button
                      style={{ ...btnSmall, color: '#ef4444', borderColor: '#ef4444' }}
                      onClick={() => cancelProcess(proc.id)}
                    >
                      Cancelar proceso
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// SECTION 2: OFFBOARDING
// ═════════════════════════════════════════════════════════════════

function OffboardingSection({
  processes,
  setProcesses,
  templates,
}: {
  processes: OffboardingProcess[];
  setProcesses: React.Dispatch<React.SetStateAction<OffboardingProcess[]>>;
  templates: Template[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedTplId, setSelectedTplId] = useState(templates[0]?.id || '');
  const [exitDate, setExitDate] = useState(todayStr());
  const [exitReason, setExitReason] = useState<OffboardingProcess['exitReason']>('renuncia');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCreate = () => {
    const emp = SEED_EMPLOYEES.find((e) => e.id === selectedEmpId);
    const tpl = templates.find((t) => t.id === selectedTplId);
    if (!emp || !tpl) return;

    if (processes.some((p) => p.employeeId === emp.id && p.status === 'en_curso')) return;

    const newProcess: OffboardingProcess = {
      id: genId(),
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      department: emp.department,
      position: emp.position,
      exitDate,
      exitReason,
      items: tpl.items.map((item, idx) => ({
        id: `item-${idx}`,
        label: item.label,
        completed: false,
        responsible: item.defaultResponsible,
        dueDate: exitDate,
        notes: '',
      })),
      status: 'en_curso',
      createdAt: new Date().toISOString(),
    };
    setProcesses((prev) => [newProcess, ...prev]);
    setShowForm(false);
    setSelectedEmpId('');
  };

  const toggleItem = (processId: string, itemId: string) => {
    setProcesses((prev) =>
      prev.map((p) => {
        if (p.id !== processId) return p;
        const items = p.items.map((i) => (i.id === itemId ? { ...i, completed: !i.completed } : i));
        const allDone = items.every((i) => i.completed);
        return { ...p, items, status: allDone ? 'completado' : 'en_curso' };
      })
    );
  };

  const updateItemField = (
    processId: string,
    itemId: string,
    field: keyof ChecklistItem,
    value: string
  ) => {
    setProcesses((prev) =>
      prev.map((p) => {
        if (p.id !== processId) return p;
        return {
          ...p,
          items: p.items.map((i) => (i.id === itemId ? { ...i, [field]: value } : i)),
        };
      })
    );
  };

  const cancelProcess = (processId: string) => {
    setProcesses((prev) =>
      prev.map((p) => (p.id === processId ? { ...p, status: 'cancelado' } : p))
    );
  };

  const reasonLabel = (r: OffboardingProcess['exitReason']) =>
    EXIT_REASONS.find((er) => er.value === r)?.label || r;

  const active = processes.filter((p) => p.status === 'en_curso');
  const completed = processes.filter((p) => p.status === 'completado');

  return (
    <div>
      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {[
          { label: 'En Curso', value: active.length, color: '#f59e0b' },
          { label: 'Finalizados', value: completed.length, color: '#22c55e' },
          { label: 'Total', value: processes.length, color: '#6366f1' },
        ].map((s) => (
          <div key={s.label} style={{ ...card, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Header + button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Procesos de Offboarding
        </h3>
        <button style={btnPrimary} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nuevo Offboarding'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{ ...card, border: '1px solid var(--accent)' }}>
          <h4
            style={{
              margin: '0 0 12px',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Iniciar Proceso de Offboarding
          </h4>
          <div style={grid2}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                Colaborador
              </label>
              <select
                style={selectStyle}
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {SEED_EMPLOYEES.filter((e) => e.status === 'active').map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} — {e.position}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                Causal de término
              </label>
              <select
                style={selectStyle}
                value={exitReason}
                onChange={(e) => setExitReason(e.target.value as OffboardingProcess['exitReason'])}
              >
                {EXIT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                Fecha de salida
              </label>
              <input
                type="date"
                style={inputStyle}
                value={exitDate}
                onChange={(e) => setExitDate(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                Plantilla
              </label>
              <select
                style={selectStyle}
                value={selectedTplId}
                onChange={(e) => setSelectedTplId(e.target.value)}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button style={btnPrimary} onClick={handleCreate} disabled={!selectedEmpId}>
              Crear Offboarding
            </button>
          </div>

          {/* Legal note */}
          <div
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 8,
              background: '#f59e0b11',
              border: '1px solid #f59e0b33',
              fontSize: 11,
              color: '#f59e0b',
            }}
          >
            <strong>Recordatorio legal:</strong> El finiquito debe ser firmado ante un ministro de
            fe (notario, inspector del trabajo, o presidente del sindicato) dentro de los 10 días
            hábiles siguientes al término del contrato (Art. 177 Código del Trabajo).
          </div>
        </div>
      )}

      {/* Process list */}
      {processes.length === 0 && (
        <div style={{ ...card, textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          No hay procesos de offboarding. Presiona "+ Nuevo Offboarding" para comenzar.
        </div>
      )}

      {processes.map((proc) => {
        const isExpanded = expandedId === proc.id;
        return (
          <div key={proc.id} style={{ ...card, opacity: proc.status === 'cancelado' ? 0.5 : 1 }}>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
                cursor: 'pointer',
              }}
              onClick={() => setExpandedId(isExpanded ? null : proc.id)}
            >
              <div>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                  {proc.employeeName}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                  {proc.position}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={badge(
                    proc.status === 'en_curso'
                      ? '#f59e0b'
                      : proc.status === 'completado'
                        ? '#22c55e'
                        : '#ef4444'
                  )}
                >
                  {proc.status === 'en_curso'
                    ? 'En Curso'
                    : proc.status === 'completado'
                      ? 'Finalizado'
                      : 'Cancelado'}
                </span>
                <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>
                  {isExpanded ? '▾' : '▸'}
                </span>
              </div>
            </div>

            {/* Exit info */}
            <div
              style={{
                display: 'flex',
                gap: 16,
                fontSize: 11,
                color: 'var(--text-muted)',
                marginBottom: 8,
              }}
            >
              <span>
                Causal:{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  {reasonLabel(proc.exitReason)}
                </strong>
              </span>
              <span>
                Fecha salida:{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{proc.exitDate}</strong>
              </span>
            </div>

            <ProgressBar items={proc.items} />

            {/* Timeline view */}
            {isExpanded && proc.status !== 'cancelado' && (
              <div style={{ marginTop: 16 }}>
                <div style={{ position: 'relative', paddingLeft: 24 }}>
                  {/* Vertical line */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 8,
                      top: 0,
                      bottom: 0,
                      width: 2,
                      background: 'var(--border)',
                    }}
                  />

                  {proc.items.map((item, idx) => (
                    <div
                      key={item.id}
                      style={{ position: 'relative', marginBottom: 12, paddingLeft: 16 }}
                    >
                      {/* Dot */}
                      <div
                        style={{
                          position: 'absolute',
                          left: -20,
                          top: 4,
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          border: '2px solid',
                          borderColor: item.completed ? '#22c55e' : 'var(--border)',
                          background: item.completed ? '#22c55e' : 'var(--bg-primary)',
                        }}
                      />

                      <div
                        style={{
                          background: 'var(--bg-primary)',
                          borderRadius: 8,
                          padding: 10,
                          border: '1px solid var(--border)',
                          opacity: item.completed ? 0.7 : 1,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={() => toggleItem(proc.id, item.id)}
                            />
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                textDecoration: item.completed ? 'line-through' : 'none',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {item.label}
                            </span>
                          </div>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {item.responsible} · {item.dueDate}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                          <input
                            style={{ ...inputStyle, padding: '3px 6px', fontSize: 10, flex: 1 }}
                            placeholder="Responsable"
                            value={item.responsible}
                            onChange={(e) =>
                              updateItemField(proc.id, item.id, 'responsible', e.target.value)
                            }
                          />
                          <input
                            type="date"
                            style={{ ...inputStyle, padding: '3px 6px', fontSize: 10 }}
                            value={item.dueDate}
                            onChange={(e) =>
                              updateItemField(proc.id, item.id, 'dueDate', e.target.value)
                            }
                          />
                          <input
                            style={{ ...inputStyle, padding: '3px 6px', fontSize: 10, flex: 1 }}
                            placeholder="Nota..."
                            value={item.notes}
                            onChange={(e) =>
                              updateItemField(proc.id, item.id, 'notes', e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {proc.status === 'en_curso' && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <button
                      style={{ ...btnSmall, color: '#ef4444', borderColor: '#ef4444' }}
                      onClick={() => cancelProcess(proc.id)}
                    >
                      Cancelar proceso
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// SECTION 3: PLANTILLAS (Templates)
// ═════════════════════════════════════════════════════════════════

function TemplatesSection({
  templates,
  setTemplates,
}: {
  templates: Template[];
  setTemplates: React.Dispatch<React.SetStateAction<Template[]>>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form state
  const [tplName, setTplName] = useState('');
  const [tplType, setTplType] = useState<'onboarding' | 'offboarding'>('onboarding');
  const [tplDept, setTplDept] = useState<string>('');
  const [tplItems, setTplItems] = useState<{ label: string; defaultResponsible: string }[]>([]);

  const resetForm = () => {
    setTplName('');
    setTplType('onboarding');
    setTplDept('');
    setTplItems([]);
    setShowForm(false);
    setEditId(null);
  };

  const startEdit = (tpl: Template) => {
    setEditId(tpl.id);
    setTplName(tpl.name);
    setTplType(tpl.type);
    setTplDept(tpl.department || '');
    setTplItems([...tpl.items]);
    setShowForm(true);
  };

  const startNew = () => {
    resetForm();
    setShowForm(true);
  };

  const startFromDefault = (type: 'onboarding' | 'offboarding') => {
    resetForm();
    setTplType(type);
    setTplName(type === 'onboarding' ? 'Onboarding Personalizado' : 'Offboarding Personalizado');
    setTplItems(
      type === 'onboarding' ? [...DEFAULT_ONBOARDING_ITEMS] : [...DEFAULT_OFFBOARDING_ITEMS]
    );
    setShowForm(true);
  };

  const addItem = () => {
    setTplItems((prev) => [...prev, { label: '', defaultResponsible: 'RRHH' }]);
  };

  const removeItem = (idx: number) => {
    setTplItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: 'label' | 'defaultResponsible', value: string) => {
    setTplItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const handleSave = () => {
    if (!tplName.trim() || tplItems.length === 0) return;
    const cleanItems = tplItems.filter((i) => i.label.trim());
    if (cleanItems.length === 0) return;

    if (editId) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editId
            ? {
                ...t,
                name: tplName,
                type: tplType,
                department: tplDept || null,
                items: cleanItems,
              }
            : t
        )
      );
    } else {
      const newTpl: Template = {
        id: genId(),
        name: tplName,
        type: tplType,
        department: tplDept || null,
        items: cleanItems,
        isDefault: false,
      };
      setTemplates((prev) => [...prev, newTpl]);
    }
    resetForm();
  };

  const deleteTpl = (id: string) => {
    const tpl = templates.find((t) => t.id === id);
    if (tpl?.isDefault) return; // cannot delete defaults
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const onboardingTpls = templates.filter((t) => t.type === 'onboarding');
  const offboardingTpls = templates.filter((t) => t.type === 'offboarding');

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Plantillas de Checklist
        </h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btnSecondary} onClick={() => startFromDefault('onboarding')}>
            + Desde Onboarding Base
          </button>
          <button style={btnSecondary} onClick={() => startFromDefault('offboarding')}>
            + Desde Offboarding Base
          </button>
          <button style={btnPrimary} onClick={startNew}>
            + Plantilla Vacía
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ ...card, border: '1px solid var(--accent)', marginBottom: 16 }}>
          <h4
            style={{
              margin: '0 0 12px',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            {editId ? 'Editar Plantilla' : 'Nueva Plantilla'}
          </h4>
          <div style={grid2}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                Nombre
              </label>
              <input
                style={inputStyle}
                value={tplName}
                onChange={(e) => setTplName(e.target.value)}
                placeholder="Nombre de la plantilla"
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                Tipo
              </label>
              <select
                style={selectStyle}
                value={tplType}
                onChange={(e) => setTplType(e.target.value as 'onboarding' | 'offboarding')}
              >
                <option value="onboarding">Onboarding (Ingreso)</option>
                <option value="offboarding">Offboarding (Salida)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                Departamento (opcional)
              </label>
              <select
                style={selectStyle}
                value={tplDept}
                onChange={(e) => setTplDept(e.target.value)}
              >
                <option value="">Todos los departamentos</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Items editor */}
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                Ítems del checklist ({tplItems.length})
              </span>
              <button style={btnSmall} onClick={addItem}>
                + Agregar ítem
              </button>
            </div>

            {tplItems.length === 0 && (
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  padding: 20,
                }}
              >
                Agrega al menos un ítem al checklist.
              </div>
            )}

            {tplItems.map((item, idx) => (
              <div
                key={idx}
                style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    minWidth: 20,
                    textAlign: 'right',
                  }}
                >
                  {idx + 1}.
                </span>
                <input
                  style={{ ...inputStyle, flex: 2, padding: '6px 8px', fontSize: 12 }}
                  placeholder="Descripción del ítem"
                  value={item.label}
                  onChange={(e) => updateItem(idx, 'label', e.target.value)}
                />
                <input
                  style={{ ...inputStyle, flex: 1, padding: '6px 8px', fontSize: 12 }}
                  placeholder="Responsable"
                  value={item.defaultResponsible}
                  onChange={(e) => updateItem(idx, 'defaultResponsible', e.target.value)}
                />
                <button
                  style={{ ...btnSmall, color: '#ef4444', padding: '4px 8px' }}
                  onClick={() => removeItem(idx)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button style={btnPrimary} onClick={handleSave}>
              {editId ? 'Guardar Cambios' : 'Crear Plantilla'}
            </button>
            <button style={btnSecondary} onClick={resetForm}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Template lists */}
      {[
        { label: 'Plantillas de Onboarding', list: onboardingTpls, color: '#3b82f6' },
        { label: 'Plantillas de Offboarding', list: offboardingTpls, color: '#f59e0b' },
      ].map((section) => (
        <div key={section.label} style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: section.color, marginBottom: 8 }}>
            {section.label}
          </h4>
          {section.list.length === 0 && (
            <div
              style={{
                ...card,
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 12,
                padding: 20,
              }}
            >
              No hay plantillas en esta categoría.
            </div>
          )}
          {section.list.map((tpl) => (
            <div key={tpl.id} style={card}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                    {tpl.name}
                  </span>
                  {tpl.isDefault && (
                    <span style={{ ...badge('#6366f1'), marginLeft: 8 }}>Por defecto</span>
                  )}
                  {tpl.department && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                      Depto: {tpl.department}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                    {tpl.items.length} ítems
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={btnSmall} onClick={() => startEdit(tpl)}>
                    Editar
                  </button>
                  {!tpl.isDefault && (
                    <button
                      style={{ ...btnSmall, color: '#ef4444', borderColor: '#ef4444' }}
                      onClick={() => deleteTpl(tpl.id)}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
              {/* Items preview */}
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {tpl.items.slice(0, 5).map((item, i) => (
                  <span
                    key={i}
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: 'var(--bg-primary)',
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {item.label.length > 40 ? item.label.slice(0, 40) + '...' : item.label}
                  </span>
                ))}
                {tpl.items.length > 5 && (
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', padding: '2px 4px' }}>
                    +{tpl.items.length - 5} más
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
