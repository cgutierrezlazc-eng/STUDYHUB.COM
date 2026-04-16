import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../services/auth';
import { api } from '../services/api';
import EmployeeDocumentsDrawer from '../components/EmployeeDocumentsDrawer';
import {
  Users,
  UserPlus,
  FileText,
  DollarSign,
  Building,
  Shield,
  Calculator,
  Upload,
  Download,
  Check,
  X,
  Search,
  ChevronDown,
  ChevronRight,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Briefcase,
  Edit,
  Trash2,
  FolderOpen,
  Eye,
  PenTool,
  BarChart3,
  TrendingUp,
  Info,
  Plus,
  Minus,
  CreditCard,
  Receipt,
  Home,
  Wifi,
  Globe,
  BookOpen,
  Star,
  ArrowRight,
} from 'lucide-react';

interface Props {
  onNavigate: (path: string) => void;
}

// ─── Types ──────────────────────────────────────────────────────
interface Employee {
  id: string;
  rut: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  birthDate: string;
  nationality: string;
  maritalStatus: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  position: string;
  department: string;
  hireDate: string;
  endDate: string | null;
  contractType: string;
  workSchedule: string;
  weeklyHours: number;
  grossSalary: number;
  colacion: number;
  movilizacion: number;
  afp: string;
  healthSystem: string;
  isapreName: string | null;
  isapreUf: number | null;
  afcActive: boolean;
  bankName: string;
  bankAccountType: string;
  bankAccountNumber: string;
  status: string;
  createdAt: string;
}

interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  periodMonth: number;
  periodYear: number;
  grossSalary: number;
  gratificacion: number;
  overtimeHours: number;
  overtimeAmount: number;
  bonuses: number;
  colacion: number;
  movilizacion: number;
  totalHaberesImponibles: number;
  totalHaberesNoImponibles: number;
  afpEmployee: number;
  healthEmployee: number;
  afcEmployee: number;
  taxAmount: number;
  totalDeductions: number;
  netSalary: number;
  afpEmployer: number;
  afcEmployer: number;
  mutualEmployer: number;
  totalEmployerCost: number;
  status: string;
}

interface OperationalExpense {
  id: string;
  category: string;
  description: string;
  amountClp: number;
  amountUsd: number | null;
  providerName: string;
  providerRut: string | null;
  documentNumber: string;
  documentType: string;
  taxDeductible: boolean;
  ivaAmount: number | null;
  periodMonth: number;
  periodYear: number;
  recurring: boolean;
  recurringFrequency: string | null;
  createdAt: string;
}

interface PreviredData {
  period: string;
  employees: {
    rut: string;
    name: string;
    afp: string;
    afpAmount: number;
    healthSystem: string;
    healthAmount: number;
    afcEmployee: number;
    afcEmployer: number;
    sis: number;
    mutual: number;
    taxableIncome: number;
  }[];
  totals: {
    totalAfp: number;
    totalHealth: number;
    totalAfcEmployee: number;
    totalAfcEmployer: number;
    totalSis: number;
    totalMutual: number;
  };
}

// ─── Chilean Labor Law Constants (Auto-updatable) ──────────────
// Fuente: Ministerio del Trabajo, SII, Superintendencia de Pensiones
// IMPORTANTE: Actualizar estos valores cada vez que cambien por ley
const CHILE_LABOR = {
  // ─── Ingreso Minimo Mensual (IMM) — Art. 44 Codigo del Trabajo ───
  // Ley 21.578: Reajuste escalonado del salario minimo
  IMM: {
    current: 500000, // $500.000 desde 01-Jul-2024
    effectiveDate: '2024-07-01',
    history: [
      { from: '2024-07-01', amount: 500000 },
      { from: '2024-01-01', amount: 460000 },
      { from: '2023-09-01', amount: 440000 },
      { from: '2023-05-01', amount: 410000 },
      { from: '2022-08-01', amount: 400000 },
    ],
    // Minimo para jornada parcial (Art. 40 bis): proporcional a horas
    partialRate: (weeklyHours: number) => Math.round((500000 * weeklyHours) / 40),
    // Minimo para menores de 18 y mayores de 65
    reduced: 372989,
    // Para fines no remuneracionales
    nonRemunerational: 296514,
  },

  // ─── UF (Unidad de Fomento) — Actualizar mensualmente ───
  UF: {
    value: 38700, // Valor aproximado Abril 2026 — ACTUALIZAR
    lastUpdate: '2026-04-01',
  },

  // ─── UTM (Unidad Tributaria Mensual) ───
  UTM: {
    value: 67294, // Valor aproximado Abril 2026 — ACTUALIZAR
    lastUpdate: '2026-04-01',
  },

  // ─── Topes Imponibles (Art. 16 DL 3.500) ───
  TOPES: {
    afpUF: 81.6, // Tope AFP: 81,6 UF
    afcUF: 122.6, // Tope AFC: 122,6 UF (Ley 19.728)
    saludUF: 81.6, // Tope Salud: 81,6 UF
    get afpCLP() {
      return Math.round(CHILE_LABOR.UF.value * this.afpUF);
    },
    get afcCLP() {
      return Math.round(CHILE_LABOR.UF.value * this.afcUF);
    },
    get saludCLP() {
      return Math.round(CHILE_LABOR.UF.value * this.saludUF);
    },
  },

  // ─── Gratificacion Legal (Art. 47-50 CT) ───
  GRATIFICACION: {
    rate: 0.25, // 25% de remuneraciones devengadas
    topeMensualIMM: 4.75, // Tope: 4,75 IMM anuales = 4.75/12 IMM mensual
    get topeMensual() {
      return Math.round((CHILE_LABOR.IMM.current * this.topeMensualIMM) / 12);
    },
  },

  // ─── AFC — Seguro de Cesantia (Ley 19.728) ───
  AFC: {
    employeeRate: 0.006, // 0,6% cargo trabajador (solo indefinido)
    employerIndefinido: 0.024, // 2,4% cargo empleador (indefinido)
    employerPlazoFijo: 0.03, // 3,0% cargo empleador (plazo fijo / obra)
  },

  // ─── SIS — Seguro de Invalidez y Sobrevivencia (Art. 59 DL 3.500) ───
  SIS: {
    rate: 0.0141, // 1,41% cargo empleador
  },

  // ─── Mutual de Seguridad (Ley 16.744) ───
  MUTUAL: {
    baseRate: 0.0093, // 0,93% tasa base
    // Tasa adicional segun actividad economica (0% a 3,4%)
    additionalRate: 0, // Conniku: actividad de bajo riesgo
  },

  // ─── Horas Extraordinarias (Art. 30-32 CT) ───
  HORAS_EXTRA: {
    recargo: 0.5, // 50% recargo sobre hora ordinaria
    maxDiarias: 2, // Max 2 horas extras diarias
    maxPacto: 3, // Pacto max 3 meses
  },

  // ─── Impuesto Unico de Segunda Categoria (Art. 43 N°1 LIR) ───
  // Tramos 2024 — en UTM. Actualizar anualmente.
  TAX_BRACKETS: [
    { from: 0, to: 13.5, rate: 0, deduction: 0 },
    { from: 13.5, to: 30, rate: 0.04, deduction: 0.54 },
    { from: 30, to: 50, rate: 0.08, deduction: 1.74 },
    { from: 50, to: 70, rate: 0.135, deduction: 4.49 },
    { from: 70, to: 90, rate: 0.23, deduction: 11.14 },
    { from: 90, to: 120, rate: 0.304, deduction: 17.8 },
    { from: 120, to: 150, rate: 0.35, deduction: 23.32 },
    { from: 150, to: Infinity, rate: 0.4, deduction: 30.82 },
  ],

  // ─── APV — Ahorro Previsional Voluntario (Art. 20-20L DL 3.500) ───
  APV: {
    regimes: [
      {
        value: 'A',
        label: 'Regimen A — Bonificacion fiscal 15% (tope 6 UTM/ano)',
        maxAnnualUTM: 6,
      },
      { value: 'B', label: 'Regimen B — Rebaja base tributable (sin tope legal, tope 600 UF/ano)' },
    ],
    maxAnnualUF: 600, // Tope APV regimen B: 600 UF anuales
  },

  // ─── Pension de Alimentos (Art. 8 Ley 14.908) ───
  PENSION_ALIMENTOS: {
    // Retencion judicial obligatoria por el empleador (Art. 8)
    // Puede ser monto fijo o % del sueldo
    // Minimo legal por hijo: 40% del IMM (1 hijo), 30% c/u (2+ hijos)
    minimoPerHijo: 0.4, // 40% IMM por 1 hijo
    minimoMultiple: 0.3, // 30% IMM por cada hijo si son 2+
    maxRetencion: 0.5, // Max 50% de la remuneracion (Art. 7 Ley 14.908)
  },

  // ─── Descuentos Voluntarios (Art. 58 CT) ───
  VOLUNTARY_DEDUCTIONS: {
    maxRate: 0.15, // Max 15% de la remuneracion total
    // Tipos: cuotas sindicales, prestamos, seguros, cooperativas
  },

  // ─── Fechas Clave Conniku ───
  CONNIKU_PAYROLL: {
    cierreDia: 22, // Cierre de calculo de remuneraciones: dia 22
    pagoDia: 'ultimo_habil', // Pago: ultimo dia habil del mes
    anticipoDia: 15, // Anticipo quincenal: dia 15 (si aplica)
    anticipoMaxPct: 0.4, // Max anticipo: 40% del sueldo liquido estimado
    previredPlazo: 13, // Plazo Previred: dia 13 del mes siguiente
  },

  // ─── Progresion de Contratos Conniku ───
  CONTRACT_PROGRESSION: {
    // Primer contrato: plazo fijo 30 dias
    // Segundo contrato: plazo fijo 60 dias
    // Tercer contrato: indefinido (automatico por ley, Art. 159 N°4)
    stages: [
      { stage: 1, type: 'plazo_fijo', days: 30, label: '1er Contrato — Plazo Fijo 30 dias' },
      { stage: 2, type: 'plazo_fijo', days: 60, label: '2do Contrato — Plazo Fijo 60 dias' },
      { stage: 3, type: 'indefinido', days: 0, label: '3er Contrato — Indefinido' },
    ],
    allowDirectIndefinido: true, // CEO/RRHH puede saltar directo a indefinido
  },

  // ─── Indemnizaciones (Art. 163, 168, 169 CT) ───
  INDEMNIZACIONES: {
    anosServicioTope: 11, // Tope: 11 anos (330 dias)
    remuneracionTopeUF: 90, // Tope remuneracion mensual: 90 UF
    sustitutiva: 30, // 30 dias por ano
    faltaAviso: 30, // 30 dias adicionales si no hay aviso previo
    recargos: {
      art161: 0.3, // 30% necesidades empresa
      art159_4_6: 0.5, // 50% causales objetivas
      art160: 0.8, // 80% causales imputables al trabajador (injustificado)
    },
  },

  // ─── Feriado Legal (Art. 67-76 CT) ───
  FERIADO: {
    diasBase: 15, // 15 dias habiles
    progresivo: { fromYear: 10, extraPerYears: 3, extraDays: 1 },
    acumulacionMax: 2, // Max 2 periodos acumulables
  },
};

// Helper: Validate salary against IMM
function validateSalary(
  gross: number,
  weeklyHours: number = 40
): { valid: boolean; min: number; message: string } {
  const min = weeklyHours < 40 ? CHILE_LABOR.IMM.partialRate(weeklyHours) : CHILE_LABOR.IMM.current;
  return {
    valid: gross >= min,
    min,
    message:
      gross < min
        ? `Sueldo $${gross.toLocaleString('es-CL')} es inferior al minimo legal $${min.toLocaleString('es-CL')} para ${weeklyHours}h/sem (Art. 44 CT)`
        : '',
  };
}

// Helper: Calculate tax (Impuesto Unico 2da Categoria)
function calculateTax(taxableIncome: number): number {
  const utm = CHILE_LABOR.UTM.value;
  const incomeUTM = taxableIncome / utm;
  for (const bracket of CHILE_LABOR.TAX_BRACKETS) {
    if (incomeUTM > bracket.from && incomeUTM <= bracket.to) {
      return Math.round((incomeUTM * bracket.rate - bracket.deduction) * utm);
    }
  }
  return 0;
}

// ─── Constants ──────────────────────────────────────────────────
const AFP_OPTIONS = [
  { value: 'capital', label: 'Capital', rate: 11.44 },
  { value: 'cuprum', label: 'Cuprum', rate: 11.44 },
  { value: 'habitat', label: 'Habitat', rate: 11.27 },
  { value: 'modelo', label: 'Modelo', rate: 10.58 },
  { value: 'planvital', label: 'PlanVital', rate: 10.41 },
  { value: 'provida', label: 'ProVida', rate: 11.45 },
  { value: 'uno', label: 'Uno', rate: 10.69 },
];

const HEALTH_OPTIONS = [
  { value: 'fonasa', label: 'Fonasa (7%)' },
  { value: 'isapre', label: 'Isapre' },
];

const ISAPRE_OPTIONS = [
  { value: 'Banmédica', label: 'Banmédica' },
  { value: 'Colmena Golden Cross', label: 'Colmena Golden Cross' },
  { value: 'Consalud', label: 'Consalud' },
  { value: 'Cruz Blanca', label: 'Cruz Blanca' },
  { value: 'Esencial', label: 'Esencial' },
  { value: 'MasVida', label: 'MasVida' },
  { value: 'Vida Tres', label: 'Vida Tres' },
];

const CONTRACT_TYPES = [
  { value: 'indefinido', label: 'Indefinido' },
  { value: 'plazo_fijo', label: 'Plazo Fijo' },
  { value: 'por_obra', label: 'Por Obra o Faena' },
  { value: 'honorarios', label: 'Honorarios' },
];

const DEPARTMENTS = [
  'Tecnologia',
  'Diseno',
  'Marketing',
  'Ventas',
  'Operaciones',
  'Finanzas',
  'Legal',
  'Recursos Humanos',
  'Soporte',
  'Direccion',
];

const BANKS = [
  'Banco de Chile',
  'Banco Estado',
  'Banco Santander',
  'BCI',
  'Scotiabank',
  'Banco Itau',
  'Banco BICE',
  'Banco Security',
  'Banco Falabella',
  'Banco Ripley',
  'MACH',
  'Cuenta RUT',
  'Mercado Pago',
  'Tenpo',
];

const EXPENSE_CATEGORIES = [
  { value: 'suscripcion', label: 'Suscripciones y Software' },
  { value: 'arriendo', label: 'Arriendo Oficina/Cowork' },
  { value: 'servicios', label: 'Servicios Basicos (luz, agua, internet)' },
  { value: 'equipamiento', label: 'Equipamiento y Hardware' },
  { value: 'marketing', label: 'Marketing y Publicidad' },
  { value: 'legal', label: 'Servicios Legales' },
  { value: 'contabilidad', label: 'Contabilidad y Auditoria' },
  { value: 'hosting', label: 'Hosting y Infraestructura Cloud' },
  { value: 'dominio', label: 'Dominios y Certificados' },
  { value: 'capacitacion', label: 'Capacitacion' },
  { value: 'viajes', label: 'Viajes y Representacion' },
  { value: 'seguros', label: 'Seguros' },
  { value: 'otro', label: 'Otro' },
];

const TABS = [
  { id: 'personal', label: 'Personal', icon: Users },
  { id: 'contratos', label: 'Contratos', icon: FileText },
  { id: 'payroll', label: 'PayRoll', icon: DollarSign },
  { id: 'tutores', label: 'Tutores Externos', icon: BookOpen, highlight: true },
  { id: 'gastos', label: 'Gastos Operacionales', icon: Receipt },
  { id: 'inspeccion', label: 'Inspeccion del Trabajo', icon: Shield },
  { id: 'impuestos', label: 'Impuestos / F129', icon: Calculator },
  { id: 'legal', label: 'Legal y Compliance', icon: Shield },
  { id: 'owner', label: 'Guia del Owner', icon: Star },
];

const PAYROLL_SUBTABS = [
  { id: 'liquidaciones', label: 'Liquidaciones' },
  { id: 'previred', label: 'Previred' },
  { id: 'finiquitos', label: 'Finiquitos' },
  { id: 'historial', label: 'Historial de Pagos' },
];

const fmt = (n: number | undefined | null) => {
  if (n == null || isNaN(n)) return '0';
  return Math.round(n).toLocaleString('es-CL');
};

// ─── Main Component ─────────────────────────────────────────────
export default function HRDashboard({ onNavigate }: Props) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [payrollSubTab, setPayrollSubTab] = useState('liquidaciones');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [expenses, setExpenses] = useState<OperationalExpense[]>([]);
  const [previredData, setPreviredData] = useState<PreviredData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [indicators, setIndicators] = useState<any>(null);
  const [indicatorsError, setIndicatorsError] = useState('');

  // Load Chilean economic indicators (UF, UTM, IMM, etc.)
  useEffect(() => {
    api
      .getChileIndicators()
      .then((data: any) => {
        setIndicators(data);
        // Update global CHILE_LABOR with live values
        if (data?.uf?.value) CHILE_LABOR.UF.value = Math.round(data.uf.value);
        if (data?.utm?.value) CHILE_LABOR.UTM.value = Math.round(data.utm.value);
        if (data?.imm?.value) CHILE_LABOR.IMM.current = data.imm.value;
        if (data?.uf?.value) {
          CHILE_LABOR.UF.lastUpdate = new Date().toISOString().split('T')[0];
          CHILE_LABOR.UTM.lastUpdate = new Date().toISOString().split('T')[0];
        }
        setIndicatorsError('');
      })
      .catch(() =>
        setIndicatorsError('No se pudieron cargar indicadores. Usando valores por defecto.')
      );
  }, []);

  // Check access
  if (user?.role !== 'owner') {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Shield size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
        <h2>Acceso Restringido</h2>
        <p style={{ color: 'var(--text-muted)' }}>Solo el owner puede acceder al modulo de RRHH.</p>
      </div>
    );
  }

  const loadEmployees = async () => {
    try {
      const data = await api.getEmployees();
      setEmployees(data || []);
    } catch {
      setEmployees([]);
    }
  };

  const loadPayroll = async () => {
    try {
      const data = await api.getPayroll(selectedYear, selectedMonth);
      setPayroll(data || []);
    } catch {
      setPayroll([]);
    }
  };

  const loadExpenses = async () => {
    try {
      const data = await api.getExpenses(`year=${selectedYear}&month=${selectedMonth}`);
      setExpenses(data || []);
    } catch {
      setExpenses([]);
    }
  };

  const loadPrevired = async () => {
    try {
      const data = await api.getPrevired(selectedYear, selectedMonth);
      setPreviredData(data || null);
    } catch {
      setPreviredData(null);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (activeTab === 'payroll') {
      loadPayroll();
      loadPrevired();
    }
    if (activeTab === 'gastos' || activeTab === 'impuestos') loadExpenses();
  }, [activeTab, selectedMonth, selectedYear]);

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Users size={28} /> Recursos Humanos
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>
          Gestion de personal, remuneraciones y cumplimiento legal — Legislacion Chilena
        </p>
      </div>

      {/* ─── Indicadores Economicos en Vivo ─── */}
      <div
        style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}
      >
        {indicators ? (
          <>
            <div
              style={{
                padding: '8px 14px',
                background: 'var(--bg-secondary)',
                borderRadius: 10,
                fontSize: 12,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>UF</span>{' '}
              <strong>
                ${indicators.uf?.value?.toLocaleString('es-CL', { maximumFractionDigits: 2 })}
              </strong>
            </div>
            <div
              style={{
                padding: '8px 14px',
                background: 'var(--bg-secondary)',
                borderRadius: 10,
                fontSize: 12,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>UTM</span>{' '}
              <strong>${indicators.utm?.value?.toLocaleString('es-CL')}</strong>
            </div>
            <div
              style={{
                padding: '8px 14px',
                background: 'var(--bg-secondary)',
                borderRadius: 10,
                fontSize: 12,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>USD</span>{' '}
              <strong>${indicators.dolar?.value?.toLocaleString('es-CL')}</strong>
            </div>
            <div
              style={{
                padding: '8px 14px',
                background: 'var(--bg-secondary)',
                borderRadius: 10,
                fontSize: 12,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>IMM</span>{' '}
              <strong>${indicators.imm?.value?.toLocaleString('es-CL')}</strong>
            </div>
            <div
              style={{
                padding: '8px 14px',
                background: 'var(--bg-secondary)',
                borderRadius: 10,
                fontSize: 12,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Tope AFP</span>{' '}
              <strong>${indicators.topes?.afp_clp?.toLocaleString('es-CL')}</strong>
            </div>
            <div
              style={{
                padding: '8px 14px',
                background: 'var(--bg-secondary)',
                borderRadius: 10,
                fontSize: 12,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Grat. Mensual</span>{' '}
              <strong>${indicators.gratificacion?.tope_mensual?.toLocaleString('es-CL')}</strong>
            </div>
            {indicators.daily_update?.updated_today ? (
              <div
                style={{
                  padding: '8px 14px',
                  background: 'rgba(34,197,94,0.15)',
                  border: '1px solid #22c55e',
                  borderRadius: 10,
                  fontSize: 11,
                  whiteSpace: 'nowrap',
                  color: '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <CheckCircle size={12} /> Actualizado hoy 08:00
                {indicators.daily_update.imm_changed && (
                  <span
                    style={{
                      marginLeft: 6,
                      background: '#f59e0b',
                      color: '#fff',
                      borderRadius: 4,
                      padding: '1px 6px',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    IMM CAMBIÓ: ${indicators.daily_update.imm_prev?.toLocaleString('es-CL')} → $
                    {indicators.imm?.value?.toLocaleString('es-CL')}
                  </span>
                )}
              </div>
            ) : (
              <div
                style={{
                  padding: '8px 14px',
                  background: 'rgba(34,197,94,0.1)',
                  borderRadius: 10,
                  fontSize: 11,
                  whiteSpace: 'nowrap',
                  color: '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <CheckCircle size={12} /> En vivo — mindicador.cl
              </div>
            )}
          </>
        ) : indicatorsError ? (
          <div
            style={{
              padding: '8px 14px',
              background: 'rgba(245,158,11,0.1)',
              borderRadius: 10,
              fontSize: 12,
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <AlertTriangle size={14} /> {indicatorsError}
          </div>
        ) : (
          <div
            style={{
              padding: '8px 14px',
              background: 'var(--bg-secondary)',
              borderRadius: 10,
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            Cargando indicadores economicos...
          </div>
        )}
      </div>

      {/* Tabs */}
      <div
        style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}
      >
        {TABS.map((tab: any) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: tab.highlight && activeTab !== tab.id ? '1px solid #f59e0b' : 'none',
              background:
                activeTab === tab.id
                  ? tab.highlight
                    ? '#f59e0b'
                    : 'var(--accent)'
                  : tab.highlight
                    ? 'rgba(245,158,11,0.1)'
                    : 'var(--bg-secondary)',
              color:
                activeTab === tab.id ? '#fff' : tab.highlight ? '#f59e0b' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            <tab.icon size={15} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Period Selector (shared across tabs) */}
      {['payroll', 'gastos', 'impuestos', 'tutores'].includes(activeTab) && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
            Periodo:
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: 13,
            }}
          >
            {[
              'Enero',
              'Febrero',
              'Marzo',
              'Abril',
              'Mayo',
              'Junio',
              'Julio',
              'Agosto',
              'Septiembre',
              'Octubre',
              'Noviembre',
              'Diciembre',
            ].map((m, i) => (
              <option key={i} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: 13,
            }}
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: Personal */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'personal' && (
        <PersonalTab
          employees={employees}
          onRefresh={loadEmployees}
          showAdd={showAddEmployee}
          setShowAdd={setShowAddEmployee}
          selectedEmployee={selectedEmployee}
          setSelectedEmployee={setSelectedEmployee}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: Contratos */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'contratos' && (
        <ContratosTab employees={employees} onRefresh={loadEmployees} />
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: PayRoll (sub-tabs inside) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'payroll' && (
        <div>
          {/* Sub-tabs */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              marginBottom: 20,
              borderBottom: '2px solid var(--border)',
              paddingBottom: 8,
            }}
          >
            {PAYROLL_SUBTABS.map((st) => (
              <button
                key={st.id}
                onClick={() => setPayrollSubTab(st.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px 8px 0 0',
                  border: 'none',
                  background: payrollSubTab === st.id ? 'var(--accent)' : 'transparent',
                  color: payrollSubTab === st.id ? '#fff' : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {st.label}
              </button>
            ))}
          </div>

          {payrollSubTab === 'liquidaciones' && (
            <RemuneracionesTab
              payroll={payroll}
              employees={employees}
              month={selectedMonth}
              year={selectedYear}
              onRefresh={loadPayroll}
            />
          )}
          {payrollSubTab === 'previred' && (
            <PreviredTab
              data={previredData}
              month={selectedMonth}
              year={selectedYear}
              onRefresh={loadPrevired}
            />
          )}
          {payrollSubTab === 'finiquitos' && <FiniquitosTab employees={employees} />}
          {payrollSubTab === 'historial' && (
            <HistorialPagosTab payroll={payroll} month={selectedMonth} year={selectedYear} />
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: Tutores Externos */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'tutores' && <TutoresExternosTab month={selectedMonth} year={selectedYear} />}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: Gastos Operacionales */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'gastos' && (
        <GastosTab
          expenses={expenses}
          month={selectedMonth}
          year={selectedYear}
          onRefresh={loadExpenses}
          showAdd={showAddExpense}
          setShowAdd={setShowAddExpense}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: Impuestos / F129 */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'impuestos' && (
        <ImpuestosTab expenses={expenses} year={selectedYear} month={selectedMonth} />
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: Inspeccion del Trabajo */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'inspeccion' && <InspeccionTrabajoTab employees={employees} />}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: Legal y Compliance */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'legal' && <LegalTab />}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: Guia del Owner */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'owner' && <OwnerGuideTab />}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// PERSONAL TAB
// ═════════════════════════════════════════════════════════════════
function PersonalTab({
  employees,
  onRefresh,
  showAdd,
  setShowAdd,
  selectedEmployee,
  setSelectedEmployee,
  searchTerm,
  setSearchTerm,
}: any) {
  const imm = CHILE_LABOR.IMM.current;
  const emptyForm = {
    rut: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    nationality: 'Chilena',
    maritalStatus: 'soltero',
    emergencyContactName: '',
    emergencyContactPhone: '',
    position: '',
    department: 'Tecnologia',
    hireDate: '',
    contractType: 'plazo_fijo',
    endDate: '',
    workSchedule: 'full_time',
    weeklyHours: 45,
    grossSalary: imm,
    colacion: 0,
    movilizacion: 0,
    afp: 'modelo',
    healthSystem: 'fonasa',
    isapreName: '',
    isapreUf: 0,
    afcActive: true,
    bankName: 'Banco Estado',
    bankAccountType: 'cuenta_vista',
    bankAccountNumber: '',
  };
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filtered = employees.filter((e: Employee) =>
    `${e.firstName} ${e.lastName} ${e.rut} ${e.position}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.rut.trim()) e.rut = 'RUT es obligatorio';
    if (!form.firstName.trim()) e.firstName = 'Nombre es obligatorio';
    if (!form.lastName.trim()) e.lastName = 'Apellido es obligatorio';
    if (!form.email.trim()) e.email = 'Email es obligatorio';
    if (!form.position.trim()) e.position = 'Cargo es obligatorio';
    if (!form.hireDate) e.hireDate = 'Fecha de ingreso es obligatoria';
    const minSalary = form.weeklyHours < 40 ? CHILE_LABOR.IMM.partialRate(form.weeklyHours) : imm;
    if (!form.grossSalary || Number(form.grossSalary) < minSalary)
      e.grossSalary = `Mínimo legal: $${minSalary.toLocaleString('es-CL')} (Art. 44 CT)`;
    if (form.healthSystem === 'isapre' && !form.isapreName) e.isapreName = 'Seleccione una Isapre';
    if (form.healthSystem === 'isapre' && (!form.isapreUf || Number(form.isapreUf) <= 0))
      e.isapreUf = 'Ingrese el costo del plan en UF';
    return e;
  };

  const handleSave = async () => {
    const errors = validate();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      await api.createEmployee(form);
      setShowAdd(false);
      setFormErrors({});
      setForm(emptyForm);
      onRefresh();
    } catch (err: any) {
      setFormErrors({
        _general:
          err?.message ||
          err?.detail ||
          'Error al guardar. Verifica los datos e intenta nuevamente.',
      });
    }
    setSaving(false);
  };

  const openModal = () => {
    setFormErrors({});
    setShowAdd(true);
  };
  const closeModal = () => {
    setShowAdd(false);
    setFormErrors({});
  };

  // Inline error helper
  const Err = ({ f }: { f: string }) =>
    formErrors[f] ? (
      <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{formErrors[f]}</div>
    ) : null;

  return (
    <div>
      {/* ─── Header ─── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 20,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Users size={20} style={{ color: 'var(--accent)' }} /> Directorio de Personal
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 3 }}>
            {employees.length === 0
              ? 'Aún no hay colaboradores registrados'
              : `${employees.filter((e: Employee) => e.status === 'active').length} activo${employees.filter((e: Employee) => e.status === 'active').length !== 1 ? 's' : ''} de ${employees.length} colaborador${employees.length !== 1 ? 'es' : ''}`}
          </p>
        </div>
        <button
          onClick={openModal}
          style={{ ...btnPrimary, padding: '11px 22px', fontSize: 14, flexShrink: 0 }}
        >
          <UserPlus size={18} /> Nuevo Colaborador
        </button>
      </div>

      {/* ─── Stats ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <StatCard
          icon={Users}
          label="Total Colaboradores"
          value={employees.length}
          color="#3b82f6"
        />
        <StatCard
          icon={CheckCircle}
          label="Activos"
          value={employees.filter((e: Employee) => e.status === 'active').length}
          color="#22c55e"
        />
        <StatCard
          icon={Clock}
          label="Plazo Fijo"
          value={employees.filter((e: Employee) => e.contractType === 'plazo_fijo').length}
          color="#f59e0b"
        />
        <StatCard
          icon={AlertTriangle}
          label="Inactivos"
          value={employees.filter((e: Employee) => e.status !== 'active').length}
          color="#ef4444"
        />
      </div>

      {/* ─── Search (solo si hay empleados) ─── */}
      {employees.length > 0 && (
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Buscar por nombre, RUT o cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 10px 10px 36px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: 14,
            }}
          />
        </div>
      )}

      {/* ─── Employee List OR Empty State ─── */}
      {filtered.length > 0 ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map((emp: Employee) => (
            <div
              key={emp.id}
              className="card"
              style={{
                padding: 16,
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
              onClick={() => setSelectedEmployee(selectedEmployee?.id === emp.id ? null : emp)}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 17,
                  flexShrink: 0,
                }}
              >
                {emp.firstName.charAt(0)}
                {emp.lastName.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>
                  {emp.firstName} {emp.lastName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {emp.position} · {emp.department} · RUT: {emp.rut}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>${fmt(emp.grossSalary)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Bruto mensual</div>
              </div>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  flexShrink: 0,
                  background:
                    emp.status === 'active'
                      ? 'rgba(34,197,94,0.15)'
                      : emp.status === 'on_leave'
                        ? 'rgba(245,158,11,0.15)'
                        : 'rgba(239,68,68,0.15)',
                  color:
                    emp.status === 'active'
                      ? '#22c55e'
                      : emp.status === 'on_leave'
                        ? '#f59e0b'
                        : '#ef4444',
                }}
              >
                {emp.status === 'active'
                  ? 'Activo'
                  : emp.status === 'on_leave'
                    ? 'Licencia'
                    : 'Inactivo'}
              </span>
              <ChevronRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      ) : (
        /* ─── Empty State + Guía de Contratación ─── */
        <div>
          {/* CTA Hero */}
          <div
            className="card"
            style={{
              padding: '36px 32px',
              textAlign: 'center',
              marginBottom: 20,
              border: '2px dashed var(--border)',
            }}
          >
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent) 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <UserPlus size={30} color="#fff" />
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: 22 }}>
              {searchTerm
                ? `Sin resultados para "${searchTerm}"`
                : 'Registra tu primer colaborador'}
            </h2>
            <p
              style={{
                color: 'var(--text-muted)',
                maxWidth: 500,
                margin: '0 auto 24px',
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              {searchTerm
                ? 'Prueba con otro nombre, RUT o cargo.'
                : 'Gestiona contratos, remuneraciones, previsión social y documentos legales de tu equipo de forma centralizada y conforme al Código del Trabajo de Chile.'}
            </p>
            {!searchTerm && (
              <button
                onClick={openModal}
                style={{ ...btnPrimary, fontSize: 15, padding: '13px 32px', margin: '0 auto' }}
              >
                <UserPlus size={18} /> Crear primer colaborador
              </button>
            )}
          </div>

          {/* ─── Guías de Contratación (solo cuando no hay búsqueda activa) ─── */}
          {!searchTerm && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
                gap: 16,
              }}
            >
              {/* Paso a paso */}
              <div className="card" style={{ padding: 20 }}>
                <h3
                  style={{
                    margin: '0 0 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 15,
                  }}
                >
                  <Briefcase size={16} style={{ color: '#3b82f6' }} /> Cómo Contratar en Chile
                </h3>
                {[
                  {
                    n: 1,
                    title: 'Recepción de documentos',
                    body: 'Cédula vigente, certificado de antecedentes (vigente 30 días) y títulos si el cargo lo exige.',
                  },
                  {
                    n: 2,
                    title: 'Examen pre-ocupacional',
                    body: 'Evaluación médica básica obligatoria (Art. 184 CT, Ley 16.744). Costo a cargo del empleador.',
                  },
                  {
                    n: 3,
                    title: 'Redacción del contrato',
                    body: 'Contrato escrito en un plazo máximo de 15 días corridos desde el inicio (Art. 9 CT). Debe incluir: partes, funciones, jornada, remuneración, lugar de trabajo.',
                  },
                  {
                    n: 4,
                    title: 'Firma y distribución',
                    body: '2 ejemplares firmados. Una copia para el trabajador, una para la empresa (Art. 9 CT).',
                  },
                  {
                    n: 5,
                    title: 'Alta previsional y laboral',
                    body: 'Declarar en AFP, FONASA/ISAPRE y AFC. Incluir en la nómina de Previred al primer pago.',
                  },
                ].map((s) => (
                  <div key={s.n} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {s.n}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                        {s.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {s.body}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progresión de contratos */}
              <div className="card" style={{ padding: 20 }}>
                <h3
                  style={{
                    margin: '0 0 6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 15,
                  }}
                >
                  <FileText size={16} style={{ color: '#f59e0b' }} /> Progresión de Contratos
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Art. 159 N°4 Código del Trabajo
                </p>
                {[
                  {
                    label: '1er Contrato',
                    tipo: 'Plazo Fijo',
                    dur: '30 días corridos',
                    color: '#f59e0b',
                    icon: '🟡',
                    art: 'Art. 159 CT',
                  },
                  {
                    label: '2do Contrato',
                    tipo: 'Plazo Fijo',
                    dur: '60 días corridos',
                    color: '#f97316',
                    icon: '🟠',
                    art: 'Art. 159 CT',
                  },
                  {
                    label: '3er Contrato',
                    tipo: 'Indefinido',
                    dur: 'Automático por ley',
                    color: '#22c55e',
                    icon: '🟢',
                    art: 'Art. 159 N°4 CT',
                  },
                ].map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'var(--bg-primary)',
                      marginBottom: 10,
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{c.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{c.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {c.tipo} · {c.dur}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                      {c.art}
                    </span>
                  </div>
                ))}
                <div
                  style={{
                    marginTop: 12,
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(34,197,94,0.08)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    fontSize: 12,
                    color: '#16a34a',
                    lineHeight: 1.5,
                  }}
                >
                  <strong>CEO/RRHH puede saltar directo a Indefinido.</strong> El tercer contrato a
                  plazo fijo se convierte en indefinido por ley de forma automática.
                </div>
              </div>

              {/* Documentos obligatorios */}
              <div className="card" style={{ padding: 20 }}>
                <h3
                  style={{
                    margin: '0 0 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 15,
                  }}
                >
                  <FolderOpen size={16} style={{ color: '#8b5cf6' }} /> Documentos Obligatorios
                </h3>
                {[
                  { icon: '📋', label: 'Contrato de Trabajo', ref: 'Art. 9 CT', req: true },
                  { icon: '🪪', label: 'Cédula de Identidad', ref: 'Art. 8 CT', req: true },
                  {
                    icon: '📜',
                    label: 'Certificado de Antecedentes',
                    ref: 'Ley 19.628',
                    req: true,
                  },
                  { icon: '🏥', label: 'Examen Pre-Ocupacional', ref: 'Ley 16.744', req: true },
                  { icon: '📊', label: 'Ficha AFP / Sistema de Salud', ref: 'DL 3.500', req: true },
                  {
                    icon: '🎓',
                    label: 'Título/Certificados profesionales',
                    ref: 'Según cargo',
                    req: false,
                  },
                  {
                    icon: '🏦',
                    label: 'Datos bancarios para el pago',
                    ref: 'Art. 54 CT',
                    req: false,
                  },
                ].map((d, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '7px 0',
                      borderBottom: i < 6 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{d.icon}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{d.label}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                        {d.ref}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 12,
                        flexShrink: 0,
                        background: d.req ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                        color: d.req ? '#ef4444' : '#22c55e',
                      }}
                    >
                      {d.req ? 'Obligatorio' : 'Opcional'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Mínimos legales vigentes */}
              <div className="card" style={{ padding: 20 }}>
                <h3
                  style={{
                    margin: '0 0 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 15,
                  }}
                >
                  <Calculator size={16} style={{ color: '#ef4444' }} /> Mínimos Legales Vigentes
                </h3>
                {[
                  {
                    label: 'Ingreso Mínimo Mensual',
                    value: `$${CHILE_LABOR.IMM.current.toLocaleString('es-CL')}`,
                    ref: 'Ley 21.578 · Art. 44 CT',
                  },
                  { label: 'Jornada máxima semanal', value: '45 horas', ref: 'Art. 22 CT' },
                  { label: 'Horas extras máx. diarias', value: '2 hrs (+50%)', ref: 'Art. 30 CT' },
                  { label: 'Feriado legal anual', value: '15 días hábiles', ref: 'Art. 67 CT' },
                  {
                    label: 'AFP — retención trabajador',
                    value: '10,41% – 11,45%',
                    ref: 'DL 3.500 (según AFP)',
                  },
                  { label: 'Salud — FONASA', value: '7%', ref: 'Art. 84 Ley 18.469' },
                  { label: 'AFC — Seguro Cesantía', value: '0,6% trabajador', ref: 'Ley 19.728' },
                  {
                    label: 'SIS — Inv. y Sobrev.',
                    value: '1,41% empleador',
                    ref: 'Art. 59 DL 3.500',
                  },
                ].map((m, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '7px 0',
                      borderBottom: i < 7 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {m.label}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {m.value}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                      {m.ref}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Employee Detail Panel ─── */}
      {selectedEmployee && (
        <EmployeeDetail
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onRefresh={onRefresh}
        />
      )}

      {/* ─── Modal: Nuevo Colaborador ─── */}
      {showAdd && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 720, maxHeight: '90vh', overflow: 'auto', padding: 28 }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <h2
                style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, fontSize: 20 }}
              >
                <UserPlus size={22} /> Nuevo Colaborador
              </h2>
              <button
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: 4,
                }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Legal notice */}
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(59,130,246,0.07)',
                border: '1px solid rgba(59,130,246,0.2)',
                fontSize: 12,
                color: '#3b82f6',
                marginBottom: 20,
                lineHeight: 1.5,
              }}
            >
              <strong>Art. 9 CT:</strong> El contrato debe quedar firmado dentro de los 15 días
              corridos desde el inicio de la prestación. Sueldo mínimo legal:{' '}
              <strong>${imm.toLocaleString('es-CL')}</strong> (IMM vigente).
            </div>

            {/* General error banner */}
            {formErrors._general && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  fontSize: 13,
                  color: '#ef4444',
                  marginBottom: 16,
                }}
              >
                ⚠️ {formErrors._general}
              </div>
            )}

            {/* ── Datos Personales ── */}
            <SectionTitle>Datos Personales</SectionTitle>
            <div style={grid2}>
              <div>
                <FormField
                  label="RUT"
                  value={form.rut}
                  onChange={(v) => setForm({ ...form, rut: v })}
                  placeholder="12.345.678-9"
                  required
                />
                <Err f="rut" />
              </div>
              <div>
                <FormField
                  label="Nombre"
                  value={form.firstName}
                  onChange={(v) => setForm({ ...form, firstName: v })}
                  required
                />
                <Err f="firstName" />
              </div>
              <div>
                <FormField
                  label="Apellido"
                  value={form.lastName}
                  onChange={(v) => setForm({ ...form, lastName: v })}
                  required
                />
                <Err f="lastName" />
              </div>
              <div>
                <FormField
                  label="Email"
                  value={form.email}
                  onChange={(v) => setForm({ ...form, email: v })}
                  type="email"
                  required
                />
                <Err f="email" />
              </div>
              <FormField
                label="Teléfono"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                placeholder="+56 9 1234 5678"
              />
              <FormField
                label="Dirección"
                value={form.address}
                onChange={(v) => setForm({ ...form, address: v })}
              />
              <FormField
                label="Fecha Nacimiento"
                value={form.birthDate}
                onChange={(v) => setForm({ ...form, birthDate: v })}
                type="date"
              />
              <FormField
                label="Nacionalidad"
                value={form.nationality}
                onChange={(v) => setForm({ ...form, nationality: v })}
              />
              <SelectField
                label="Estado Civil"
                value={form.maritalStatus}
                onChange={(v) => setForm({ ...form, maritalStatus: v })}
                options={[
                  { value: 'soltero', label: 'Soltero/a' },
                  { value: 'casado', label: 'Casado/a' },
                  { value: 'divorciado', label: 'Divorciado/a' },
                  { value: 'viudo', label: 'Viudo/a' },
                ]}
              />
            </div>

            <SectionTitle>Contacto de Emergencia</SectionTitle>
            <div style={grid2}>
              <FormField
                label="Nombre contacto"
                value={form.emergencyContactName}
                onChange={(v) => setForm({ ...form, emergencyContactName: v })}
              />
              <FormField
                label="Teléfono contacto"
                value={form.emergencyContactPhone}
                onChange={(v) => setForm({ ...form, emergencyContactPhone: v })}
              />
            </div>

            {/* ── Datos Laborales ── */}
            <SectionTitle>Datos Laborales</SectionTitle>
            <div style={grid2}>
              <div>
                <FormField
                  label="Cargo"
                  value={form.position}
                  onChange={(v) => setForm({ ...form, position: v })}
                  required
                />
                <Err f="position" />
              </div>
              <SelectField
                label="Departamento"
                value={form.department}
                onChange={(v) => setForm({ ...form, department: v })}
                options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
              />
              <div>
                <FormField
                  label="Fecha Ingreso"
                  value={form.hireDate}
                  onChange={(v) => setForm({ ...form, hireDate: v })}
                  type="date"
                  required
                />
                <Err f="hireDate" />
              </div>
              <SelectField
                label="Tipo Contrato"
                value={form.contractType}
                onChange={(v) => setForm({ ...form, contractType: v })}
                options={CONTRACT_TYPES}
              />
              {form.contractType === 'plazo_fijo' && (
                <FormField
                  label="Fecha Término Contrato"
                  value={form.endDate}
                  onChange={(v) => setForm({ ...form, endDate: v })}
                  type="date"
                />
              )}
              <SelectField
                label="Jornada"
                value={form.workSchedule}
                onChange={(v) => setForm({ ...form, workSchedule: v })}
                options={[
                  { value: 'full_time', label: 'Completa (45 hrs/sem)' },
                  { value: 'part_time', label: 'Parcial' },
                ]}
              />
              <FormField
                label="Horas Semanales"
                value={form.weeklyHours}
                onChange={(v) => setForm({ ...form, weeklyHours: Number(v) })}
                type="number"
              />
            </div>
            <div
              style={{
                marginTop: 8,
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(245,158,11,0.07)',
                border: '1px solid rgba(245,158,11,0.2)',
                fontSize: 11,
                color: '#92400e',
              }}
            >
              <strong>Progresión legal:</strong> 1er contrato plazo fijo 30 días → 2do plazo fijo 60
              días → 3er contrato indefinido automático (Art. 159 N°4 CT)
            </div>

            {/* ── Remuneración ── */}
            <SectionTitle>Remuneración</SectionTitle>
            <div style={grid2}>
              <div>
                <FormField
                  label={`Sueldo Bruto (CLP) — Mínimo: $${imm.toLocaleString('es-CL')}`}
                  value={form.grossSalary}
                  onChange={(v) => setForm({ ...form, grossSalary: Number(v) })}
                  type="number"
                  required
                />
                <Err f="grossSalary" />
              </div>
              <FormField
                label="Colación (CLP)"
                value={form.colacion}
                onChange={(v) => setForm({ ...form, colacion: Number(v) })}
                type="number"
              />
              <FormField
                label="Movilización (CLP)"
                value={form.movilizacion}
                onChange={(v) => setForm({ ...form, movilizacion: Number(v) })}
                type="number"
              />
            </div>

            {/* ── Previsión Social ── */}
            <SectionTitle>Previsión Social</SectionTitle>
            <div style={grid2}>
              <SelectField
                label="AFP"
                value={form.afp}
                onChange={(v) => setForm({ ...form, afp: v })}
                options={AFP_OPTIONS.map((a) => ({
                  value: a.value,
                  label: `${a.label} (${a.rate}%)`,
                }))}
              />
              <SelectField
                label="Sistema de Salud"
                value={form.healthSystem}
                onChange={(v) =>
                  setForm({
                    ...form,
                    healthSystem: v,
                    isapreName:
                      v === 'isapre' ? form.isapreName || ISAPRE_OPTIONS[0].value : form.isapreName,
                  })
                }
                options={HEALTH_OPTIONS}
              />
              {form.healthSystem === 'isapre' && (
                <>
                  <div>
                    <SelectField
                      label="Isapre"
                      value={form.isapreName || ''}
                      onChange={(v) => setForm({ ...form, isapreName: v })}
                      options={ISAPRE_OPTIONS}
                    />
                    {formErrors.isapreName && (
                      <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>
                        {formErrors.isapreName}
                      </div>
                    )}
                  </div>
                  <div>
                    <FormField
                      label="Plan mensual (UF)"
                      value={form.isapreUf}
                      onChange={(v) => setForm({ ...form, isapreUf: Number(v) })}
                      type="number"
                      step="0.01"
                    />
                    {formErrors.isapreUf && (
                      <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>
                        {formErrors.isapreUf}
                      </div>
                    )}
                  </div>
                  {form.isapreUf > 0 &&
                    form.grossSalary > 0 &&
                    (() => {
                      const ufVal = CHILE_LABOR.UF.value;
                      const planClp = Math.round(form.isapreUf * ufVal);
                      const minLegal = Math.round(form.grossSalary * 0.07);
                      const descuento = Math.max(planClp, minLegal);
                      const adicional = Math.max(0, planClp - minLegal);
                      const adicionalPct = ((descuento / form.grossSalary) * 100).toFixed(1);
                      return (
                        <div
                          style={{
                            gridColumn: 'span 2',
                            background: 'var(--bg-secondary)',
                            borderRadius: 8,
                            padding: '10px 14px',
                            fontSize: 12,
                            lineHeight: 1.7,
                          }}
                        >
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>
                            Cálculo descuento salud
                          </div>
                          <div>
                            Plan {form.isapreName}:{' '}
                            <strong>
                              {form.isapreUf} UF = ${planClp.toLocaleString('es-CL')} CLP
                            </strong>
                          </div>
                          <div>
                            Mínimo legal Fonasa (7%): ${minLegal.toLocaleString('es-CL')} CLP
                          </div>
                          <div style={{ color: adicional > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
                            Descuento total:{' '}
                            <strong>
                              ${descuento.toLocaleString('es-CL')} CLP ({adicionalPct}% del sueldo
                              bruto)
                            </strong>
                            {adicional > 0 && (
                              <span> — exceso s/ Fonasa: ${adicional.toLocaleString('es-CL')}</span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                </>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                <input
                  type="checkbox"
                  checked={form.afcActive}
                  onChange={(e) => setForm({ ...form, afcActive: e.target.checked })}
                  id="afc"
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="afc" style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  AFC (Seguro Cesantía) Activo — Ley 19.728
                </label>
              </div>
            </div>

            {/* ── Datos Bancarios ── */}
            <SectionTitle>Datos Bancarios</SectionTitle>
            <div style={grid2}>
              <SelectField
                label="Banco"
                value={form.bankName}
                onChange={(v) => setForm({ ...form, bankName: v })}
                options={BANKS.map((b) => ({ value: b, label: b }))}
              />
              <SelectField
                label="Tipo de Cuenta"
                value={form.bankAccountType}
                onChange={(v) => setForm({ ...form, bankAccountType: v })}
                options={[
                  { value: 'cuenta_vista', label: 'Cuenta Vista / RUT' },
                  { value: 'cuenta_corriente', label: 'Cuenta Corriente' },
                  { value: 'cuenta_ahorro', label: 'Cuenta Ahorro' },
                  { value: 'cuenta_rut', label: 'CuentaRUT' },
                ]}
              />
              <FormField
                label="Número de Cuenta"
                value={form.bankAccountNumber}
                onChange={(v) => setForm({ ...form, bankAccountNumber: v })}
              />
            </div>

            {/* Buttons */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                marginTop: 28,
                justifyContent: 'flex-end',
                borderTop: '1px solid var(--border)',
                paddingTop: 20,
              }}
            >
              <button onClick={closeModal} style={btnSecondary}>
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ ...btnPrimary, minWidth: 160, justifyContent: 'center' }}
              >
                {saving ? '⏳ Guardando...' : '✓ Guardar Colaborador'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// EMPLOYEE DETAIL
// ═════════════════════════════════════════════════════════════════
function EmployeeDetail({
  employee,
  onClose,
  onRefresh,
}: {
  employee: Employee;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [detailTab, setDetailTab] = useState<'info' | 'docs' | 'liquidaciones'>('info');
  const [docsDrawerOpen, setDocsDrawerOpen] = useState(false);

  useEffect(() => {
    api
      .getEmployeeDocuments(employee.id)
      .then(setDocuments)
      .catch(() => setDocuments([]));
  }, [employee.id]);

  const afpInfo = AFP_OPTIONS.find((a) => a.value === employee.afp);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 800, maxHeight: '90vh', overflow: 'auto', padding: 28 }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 22,
            }}
          >
            {employee.firstName.charAt(0)}
            {employee.lastName.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0 }}>
              {employee.firstName} {employee.lastName}
            </h2>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {employee.position} • {employee.department}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Detail tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          {[
            { id: 'info', label: 'Informacion', icon: Info },
            { id: 'docs', label: 'Documentos', icon: FolderOpen },
            { id: 'liquidaciones', label: 'Liquidaciones', icon: DollarSign },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setDetailTab(t.id as any)}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                background: detailTab === t.id ? 'var(--accent)' : 'var(--bg-secondary)',
                color: detailTab === t.id ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {detailTab === 'info' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <InfoRow label="RUT" value={employee.rut} />
            <InfoRow label="Email" value={employee.email} />
            <InfoRow label="Telefono" value={employee.phone} />
            <InfoRow label="Direccion" value={employee.address} />
            <InfoRow label="Fecha Nacimiento" value={employee.birthDate} />
            <InfoRow label="Nacionalidad" value={employee.nationality} />
            <InfoRow label="Estado Civil" value={employee.maritalStatus} />
            <InfoRow label="Fecha Ingreso" value={employee.hireDate} />
            <InfoRow
              label="Tipo Contrato"
              value={
                CONTRACT_TYPES.find((c) => c.value === employee.contractType)?.label ||
                employee.contractType
              }
            />
            <InfoRow label="Jornada" value={`${employee.weeklyHours} hrs/semana`} />
            <InfoRow label="Sueldo Bruto" value={`$${fmt(employee.grossSalary)} CLP`} highlight />
            <InfoRow label="Colacion" value={`$${fmt(employee.colacion)} CLP`} />
            <InfoRow label="Movilizacion" value={`$${fmt(employee.movilizacion)} CLP`} />
            <InfoRow label="AFP" value={`${afpInfo?.label || employee.afp} (${afpInfo?.rate}%)`} />
            <InfoRow
              label="Salud"
              value={
                employee.healthSystem === 'fonasa'
                  ? 'Fonasa (7%)'
                  : `${employee.isapreName} (${employee.isapreUf} UF)`
              }
            />
            <InfoRow label="AFC" value={employee.afcActive ? 'Activo' : 'Inactivo'} />
            <InfoRow label="Banco" value={`${employee.bankName} - ${employee.bankAccountNumber}`} />
            <InfoRow
              label="Contacto Emergencia"
              value={`${employee.emergencyContactName} (${employee.emergencyContactPhone})`}
            />
          </div>
        )}

        {detailTab === 'docs' && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16 }}>Carpeta Personal</h3>
              <button style={btnPrimary} onClick={() => setDocsDrawerOpen(true)}>
                <Upload size={14} /> Subir Documento
              </button>
            </div>

            {/* Required documents checklist */}
            <div
              className="card"
              style={{ padding: 16, marginBottom: 16, background: 'var(--bg-tertiary)' }}
            >
              <h4
                style={{
                  margin: '0 0 12px',
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Documentos Requeridos por Ley
              </h4>
              {[
                { type: 'contrato', label: 'Contrato de Trabajo', required: true },
                {
                  type: 'job_description',
                  label: 'Descripcion de Cargo (firmada)',
                  required: true,
                },
                { type: 'cedula', label: 'Copia Cedula de Identidad', required: true },
                { type: 'afp', label: 'Certificado AFP', required: true },
                { type: 'salud', label: 'Certificado Fonasa/Isapre', required: true },
                { type: 'antecedentes', label: 'Certificado de Antecedentes', required: false },
                { type: 'titulo', label: 'Copia Titulo Profesional', required: false },
                { type: 'reglamento', label: 'Reglamento Interno (firmado)', required: true },
                {
                  type: 'obligacion_informar',
                  label: 'Obligacion de Informar (ODI)',
                  required: true,
                },
                { type: 'mutual', label: 'Registro Mutual de Seguridad', required: true },
              ].map((doc) => {
                const exists = documents.some((d: any) => d.documentType === doc.type);
                return (
                  <div
                    key={doc.type}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 0',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {exists ? (
                      <CheckCircle size={16} style={{ color: '#22c55e' }} />
                    ) : (
                      <AlertTriangle
                        size={16}
                        style={{ color: doc.required ? '#ef4444' : '#f59e0b' }}
                      />
                    )}
                    <span style={{ flex: 1, fontSize: 13 }}>{doc.label}</span>
                    {doc.required && (
                      <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 600 }}>
                        OBLIGATORIO
                      </span>
                    )}
                    {exists && (
                      <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>
                        COMPLETO
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Uploaded documents */}
            {documents.length > 0 && (
              <div style={{ display: 'grid', gap: 8 }}>
                {documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="card"
                    style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    <FileText size={20} style={{ color: 'var(--accent)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{doc.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {doc.documentType} • {new Date(doc.createdAt).toLocaleDateString('es-CL')}
                      </div>
                    </div>
                    {doc.signed && (
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 12,
                          background: 'rgba(34,197,94,0.15)',
                          color: '#22c55e',
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      >
                        FIRMADO
                      </span>
                    )}
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <Download size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {detailTab === 'liquidaciones' && (
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Las liquidaciones se generan desde la pestana "Remuneraciones" y quedan disponibles
              aqui.
            </p>
          </div>
        )}
      </div>

      {/* Drawer de documentos — módulo aislado */}
      <EmployeeDocumentsDrawer
        isOpen={docsDrawerOpen}
        onClose={() => setDocsDrawerOpen(false)}
        employeeId={employee.id}
        employeeName={`${employee.firstName} ${employee.lastName}`}
        employeeRut={employee.rut}
        salary={employee.grossSalary || 0}
        afpName={employee.afp || 'No especificada'}
        afpRate={11.44}
        healthPlan={employee.healthSystem || 'Fonasa'}
        healthRate={7}
      />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// ─── Contract PDF Generator ─────────────────────────────────────
interface ContractFormData {
  // Empresa
  companyName: string;
  companyRut: string;
  companyAddress: string;
  companyCity: string;
  companyGiro: string;
  repName: string;
  repRut: string;
  // Trabajador
  firstName: string;
  lastName: string;
  rut: string;
  nationality: string;
  birthDate: string;
  maritalStatus: string;
  address: string;
  commune: string;
  city: string;
  phone: string;
  email: string;
  // Contrato
  contractType: string;
  startDate: string;
  endDate: string;
  trialDays: number;
  position: string;
  department: string;
  functions: string;
  workPlace: string;
  workModality: string; // presencial, remoto, hibrido
  // Jornada
  scheduleType: string; // 'normal' | 'art22' | 'parcial'
  weeklyHours: number;
  scheduleStart: string;
  scheduleEnd: string;
  lunchBreak: number; // minutes
  workDays: string; // 'lun-vie' | 'lun-sab' | 'turnos'
  // Remuneracion
  grossSalary: number;
  gratificationType: string; // 'art50' (25% tope 4.75 IMM) | 'mensual'
  colacion: number;
  movilizacion: number;
  otherBonuses: string;
  payDay: string; // 'ultimo_dia' | 'dia_15' | custom
  payMethod: string; // 'transferencia' | 'cheque'
  // Previsional
  afp: string;
  healthSystem: string;
  isapreName: string;
  isapreUf: number;
  afcActive: boolean;
  // Clausulas adicionales
  confidentiality: boolean;
  nonCompete: boolean;
  nonCompeteMonths: number;
  intellectualProperty: boolean;
  remoteWorkClause: boolean;
  toolsProvided: string;
  uniformRequired: boolean;
  // Vacaciones
  extraVacationDays: number;
  progressiveVacation: boolean;
  // ─── Descuentos Legales / Voluntarios ───
  pensionAlimentos: boolean;
  pensionAlimentosTipo: string; // 'fijo' | 'porcentaje'
  pensionAlimentosMonto: number;
  pensionAlimentosPct: number;
  pensionAlimentosBeneficiarios: number;
  apvActive: boolean;
  apvRegime: string; // 'A' | 'B'
  apvMonthlyAmount: number;
  anticipoQuincenal: boolean;
  anticipoPct: number;
  // ─── Progresion contractual Conniku ───
  contractStage: number; // 1, 2, 3
  directIndefinido: boolean;
}

const WORK_MODALITIES = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'remoto', label: 'Teletrabajo (Ley 21.220)' },
  { value: 'hibrido', label: 'Hibrido' },
];

const SCHEDULE_TYPES = [
  { value: 'normal', label: 'Jornada Ordinaria (max 40 hrs - Ley 21.561)' },
  { value: 'art22', label: 'Excluido de Jornada (Art. 22 inc. 2)' },
  { value: 'parcial', label: 'Jornada Parcial (max 30 hrs)' },
];

const GRATIFICATION_TYPES = [
  { value: 'art50', label: 'Art. 50 — 25% remuneracion, tope 4.75 IMM' },
  { value: 'mensual', label: 'Pago mensual proporcional (Art. 50 inc. 2)' },
];

function generateContractHTML(f: ContractFormData) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const contractTypeLabel =
    CONTRACT_TYPES.find((c) => c.value === f.contractType)?.label || f.contractType;
  const salary = f.grossSalary.toLocaleString('es-CL');
  const colacion = f.colacion.toLocaleString('es-CL');
  const movilizacion = f.movilizacion.toLocaleString('es-CL');
  const afpLabel = AFP_OPTIONS.find((a) => a.value === f.afp)?.label || f.afp;
  const afpRate = AFP_OPTIONS.find((a) => a.value === f.afp)?.rate || 0;
  const healthLabel = f.healthSystem === 'fonasa' ? 'Fonasa' : `Isapre ${f.isapreName || ''}`;
  const healthDetail =
    f.healthSystem === 'fonasa'
      ? '7% de la remuneracion imponible'
      : `${f.isapreUf || 0} UF mensuales`;

  // Jornada
  let scheduleText = '';
  if (f.scheduleType === 'art22') {
    scheduleText =
      'El Trabajador queda excluido de la limitacion de jornada de trabajo, conforme al articulo 22 inciso 2 del Codigo del Trabajo, por tratarse de un trabajador que presta sus servicios sin fiscalizacion superior inmediata o que, por su naturaleza, no requiere de supervigilancia directa. En consecuencia, no tendra derecho al pago de horas extraordinarias.';
  } else if (f.scheduleType === 'parcial') {
    scheduleText = `La jornada de trabajo sera parcial, de ${f.weeklyHours} horas semanales, distribuidas de ${f.workDays === 'lun-vie' ? 'lunes a viernes' : 'lunes a sabado'}, en horario de ${f.scheduleStart} a ${f.scheduleEnd} horas, con un descanso de ${f.lunchBreak} minutos para colacion${f.lunchBreak > 0 ? ', no imputable a la jornada' : ''}. Se aplicaran las normas del articulo 40 bis y siguientes del Codigo del Trabajo.`;
  } else {
    scheduleText = `La jornada ordinaria de trabajo sera de ${f.weeklyHours} horas semanales, distribuidas de ${f.workDays === 'lun-vie' ? 'lunes a viernes' : f.workDays === 'lun-sab' ? 'lunes a sabado' : 'acuerdo a turnos rotativos'}, en horario de ${f.scheduleStart} a ${f.scheduleEnd} horas, con un descanso de ${f.lunchBreak} minutos para colacion, no imputable a la jornada de trabajo. Conforme a la Ley 21.561, la jornada ordinaria maxima es de 40 horas semanales. El Trabajador no podra laborar horas extraordinarias sin autorizacion previa y por escrito del Empleador, y estas no podran exceder de 2 horas diarias (Art. 31).`;
  }

  // Duracion
  let durationClause = '';
  if (f.contractType === 'indefinido') {
    durationClause =
      'El presente contrato tendra una duracion indefinida, pudiendo cualquiera de las partes ponerle termino conforme a las causales establecidas en la ley.';
  } else if (f.contractType === 'plazo_fijo') {
    durationClause = `El presente contrato tendra una duracion determinada, desde el ${new Date(f.startDate).toLocaleDateString('es-CL')} hasta el ${f.endDate ? new Date(f.endDate).toLocaleDateString('es-CL') : '[fecha termino]'}. Si el Trabajador continua prestando servicios con conocimiento del Empleador despues de expirado el plazo, el contrato se transformara en indefinido. La duracion maxima del contrato a plazo fijo es de 1 ano, salvo gerentes o personas con titulo profesional o tecnico (2 anos). La segunda renovacion lo convierte en indefinido (Art. 159 N°4).`;
  } else if (f.contractType === 'por_obra') {
    durationClause =
      'El presente contrato durara mientras subsista la obra o faena que le dio origen, conforme al articulo 159 N°5 del Codigo del Trabajo. La obra o faena consiste en: [descripcion de la obra]. Una vez concluida la obra, el contrato terminara sin derecho a indemnizacion por anos de servicio, salvo pacto en contrario.';
  }

  // Gratificacion
  const gratText =
    f.gratificationType === 'art50'
      ? 'El Empleador pagara al Trabajador gratificacion legal conforme al articulo 50 del Codigo del Trabajo, equivalente al 25% de las remuneraciones devengadas en el ano, con un tope de 4,75 Ingresos Minimos Mensuales (IMM). Este pago se realizara en forma mensual y proporcional, liberando al empleador de toda otra obligacion por concepto de gratificaciones.'
      : 'El Empleador pagara al Trabajador una gratificacion legal mensual proporcional, conforme al articulo 50 inciso 2 del Codigo del Trabajo, equivalente a la doceava parte del 25% del total de remuneraciones anuales, con tope de 4,75/12 IMM mensuales.';

  // Teletrabajo
  const remoteClause =
    f.remoteWorkClause || f.workModality !== 'presencial'
      ? `
<div class="clause">
<h2>CLAUSULA ESPECIAL: TELETRABAJO (Ley 21.220)</h2>
<p>Las partes acuerdan que el Trabajador prestara servicios bajo la modalidad de ${f.workModality === 'remoto' ? 'teletrabajo' : 'trabajo hibrido'}, conforme a la Ley 21.220 que regula el trabajo a distancia y teletrabajo.</p>
<p>El Empleador proporcionara al Trabajador los equipos, herramientas y materiales necesarios para el desempe&ntilde;o de sus funciones${f.toolsProvided ? `, incluyendo: ${f.toolsProvided}` : ''}. Los costos de operacion, funcionamiento, mantencion y reparacion de los equipos seran de cargo del Empleador.</p>
<p>El Trabajador debera mantener un lugar de trabajo adecuado y cumplir con las normas de seguridad y salud en el trabajo. El Empleador tendra derecho a verificar las condiciones del lugar de trabajo, previo aviso.</p>
<p>El derecho a desconexion digital sera de al menos 12 horas continuas en un periodo de 24 horas, conforme al articulo 152 quater J del Codigo del Trabajo.</p>
</div>`
      : '';

  // Confidencialidad
  const confClause = f.confidentiality
    ? `
<div class="clause">
<h2>CLAUSULA DE CONFIDENCIALIDAD</h2>
<p>El Trabajador se obliga a mantener estricta reserva y confidencialidad respecto de toda informacion, datos, documentos, procedimientos, metodologias, software, codigos fuente, bases de datos, estrategias comerciales, listado de clientes y proveedores, y en general, todo antecedente o informacion de caracter reservado que llegue a su conocimiento con motivo o con ocasion de la prestacion de sus servicios.</p>
<p>Esta obligacion se mantendra vigente durante la relacion laboral y por un periodo de 2 anos contados desde la terminacion del contrato, cualquiera sea la causa. La infraccion a esta obligacion constituira causal de terminacion del contrato por incumplimiento grave de las obligaciones (Art. 160 N°7), sin perjuicio de las acciones civiles y penales que procedan.</p>
</div>`
    : '';

  // No competencia
  const nonCompClause = f.nonCompete
    ? `
<div class="clause">
<h2>CLAUSULA DE NO COMPETENCIA</h2>
<p>El Trabajador se obliga, durante la vigencia del contrato y por un periodo de ${f.nonCompeteMonths} meses contados desde su terminacion, a no prestar servicios, directa o indirectamente, a empresas competidoras del Empleador, ni a desarrollar actividades comerciales que compitan con el giro del Empleador. Como compensacion por esta restriccion, el Empleador pagara al Trabajador una indemnizacion equivalente al 50% de la remuneracion mensual por cada mes de vigencia de la restriccion, conforme al articulo 160 bis del Codigo del Trabajo.</p>
</div>`
    : '';

  // Propiedad intelectual
  const ipClause = f.intellectualProperty
    ? `
<div class="clause">
<h2>CLAUSULA DE PROPIEDAD INTELECTUAL</h2>
<p>Todo invento, creacion, desarrollo, programa computacional, base de datos, obra intelectual, dise&ntilde;o, marca u otro resultado del trabajo intelectual que el Trabajador realice en el desempe&ntilde;o de sus funciones, o utilizando medios proporcionados por el Empleador, sera de propiedad exclusiva del Empleador, conforme a la Ley 19.039 sobre Propiedad Industrial y la Ley 17.336 sobre Propiedad Intelectual. El Trabajador se obliga a suscribir los documentos necesarios para formalizar la cesion de derechos.</p>
</div>`
    : '';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Contrato de Trabajo - ${f.firstName} ${f.lastName}</title>
<style>
  @page { size: letter; margin: 2.5cm 3cm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.8; color: #000; }
  h1 { text-align: center; font-size: 16pt; margin-bottom: 24pt; text-transform: uppercase; letter-spacing: 2px; }
  h2 { font-size: 12pt; margin: 18pt 0 6pt; text-transform: uppercase; }
  p { text-align: justify; margin-bottom: 12pt; }
  .clause { margin-bottom: 16pt; page-break-inside: avoid; }
  .signatures { margin-top: 60pt; display: flex; justify-content: space-between; }
  .sig-block { text-align: center; width: 40%; }
  .sig-line { border-top: 1px solid #000; margin-top: 60pt; padding-top: 6pt; }
  .header-info { text-align: center; margin-bottom: 30pt; font-size: 10pt; color: #555; }
  .legal-ref { font-size: 9pt; color: #666; font-style: italic; }
</style>
</head><body>
<div class="header-info">${f.companyName}<br/>RUT: ${f.companyRut}<br/>${f.companyAddress}, ${f.companyCity}</div>
<h1>Contrato Individual de Trabajo</h1>

<p>En ${f.companyCity}, a ${dateStr}, entre <strong>${f.companyName}</strong>, RUT ${f.companyRut}, ${f.companyGiro ? `giro ${f.companyGiro}, ` : ''}representada legalmente por don(a) <strong>${f.repName}</strong>, RUT ${f.repRut}, ambos con domicilio en ${f.companyAddress}, ${f.companyCity}, en adelante "el Empleador"; y don(a) <strong>${f.firstName} ${f.lastName}</strong>, RUT ${f.rut}, de nacionalidad ${f.nationality}, nacido(a) el ${f.birthDate ? new Date(f.birthDate).toLocaleDateString('es-CL') : '[fecha]'}, estado civil ${f.maritalStatus}, domiciliado(a) en ${f.address}, ${f.commune}, ${f.city}, en adelante "el Trabajador", se ha convenido el siguiente contrato individual de trabajo:</p>

<div class="clause">
<h2>PRIMERO: Naturaleza de los Servicios</h2>
<p>El Trabajador se obliga a prestar servicios como <strong>${f.position}</strong> en el departamento de <strong>${f.department}</strong>, debiendo realizar las siguientes funciones principales: ${f.functions || 'las propias del cargo y aquellas complementarias que le encomiende el Empleador'}.</p>
<p>El Empleador podra alterar la naturaleza de los servicios, a condicion de que se trate de labores similares y sin que ello importe menoscabo para el Trabajador, conforme al articulo 12 del Codigo del Trabajo.</p>
<p class="legal-ref">Ref: Art. 10 N°3 y Art. 12 del Codigo del Trabajo.</p>
</div>

<div class="clause">
<h2>SEGUNDO: Lugar de Prestacion de Servicios</h2>
<p>El Trabajador prestara sus servicios en ${f.workPlace || f.companyAddress + ', ' + f.companyCity}${f.workModality !== 'presencial' ? `, bajo modalidad de ${f.workModality === 'remoto' ? 'teletrabajo' : 'trabajo hibrido'}` : ''}. El Empleador podra modificar el lugar de trabajo, siempre que el nuevo sitio quede dentro de la misma ciudad o localidad.</p>
<p class="legal-ref">Ref: Art. 10 N°4 y Art. 12 del Codigo del Trabajo.</p>
</div>

<div class="clause">
<h2>TERCERO: Jornada de Trabajo</h2>
<p>${scheduleText}</p>
<p class="legal-ref">Ref: Art. 22, 28, 31, 32 y 40 bis del Codigo del Trabajo; Ley 21.561 (reduccion jornada a 40 hrs).</p>
</div>

<div class="clause">
<h2>CUARTO: Remuneracion</h2>
<p>El Empleador se obliga a pagar al Trabajador una remuneracion bruta mensual de <strong>$${salary}</strong> (pesos chilenos), pagadera mediante ${f.payMethod === 'transferencia' ? 'transferencia electronica a la cuenta bancaria informada por el Trabajador' : 'cheque nominativo'}.</p>
<p><strong>Ciclo de Remuneraciones:</strong> El periodo de calculo de remuneraciones se cierra el dia <strong>22 de cada mes</strong>. La remuneracion correspondiente al periodo comprendido entre el dia 23 del mes anterior y el dia 22 del mes en curso sera pagada el <strong>ultimo dia habil del mes en curso</strong>. Los dias trabajados entre el 23 y el ultimo dia del mes se contabilizaran en la liquidacion del mes siguiente. Este ciclo sera permanente y aplicable a todos los trabajadores de la empresa, garantizando un periodo de calculo, revision y procesamiento de pagos adecuado.</p>
<p><strong>Ejemplo:</strong> La liquidacion pagada el ultimo dia habil de marzo corresponde al trabajo realizado entre el 23 de febrero y el 22 de marzo. Los dias 23 al 31 de marzo se incluiran en la liquidacion de abril.</p>
${f.anticipoQuincenal ? `<p><strong>Anticipo Quincenal:</strong> Las partes acuerdan, conforme al articulo 55 del Codigo del Trabajo, que el Trabajador podra solicitar un anticipo equivalente a un maximo del ${f.anticipoPct}% de su remuneracion liquida estimada, calculada sobre el salario devengado al cierre del dia 22 del mes anterior (considerado como el 100% ganado). Este anticipo sera pagadero el dia 15 de cada mes y descontado integramente de la liquidacion de fin de mes. Esta opcion estara disponible a partir del segundo mes de trabajo, una vez que exista un ciclo completo de remuneracion como base de calculo. El anticipo no constituye una remuneracion adicional, sino un adelanto de la misma, y podra ser revocado por el Trabajador con aviso de 15 dias.</p>` : ''}
<p>${gratText}</p>
<p>Adicionalmente, el Trabajador recibira las siguientes asignaciones de caracter no imponible ni tributable:</p>
<p>a) Asignacion de colacion: $${colacion} mensuales.<br/>
b) Asignacion de movilizacion: $${movilizacion} mensuales.${f.otherBonuses ? '<br/>c) ' + f.otherBonuses : ''}</p>
<p class="legal-ref">Ref: Art. 10 N°5, Art. 41, Art. 42, Art. 50 del Codigo del Trabajo; Art. 17 inc. 1 DL 3.500.</p>
</div>

<div class="clause">
<h2>QUINTO: Cotizaciones Previsionales</h2>
<p>De la remuneracion bruta imponible se deduciran las siguientes cotizaciones obligatorias, conforme a la legislacion vigente:</p>
<p>a) <strong>AFP ${afpLabel}</strong>: ${afpRate}% de la remuneracion imponible (cotizacion obligatoria + comision), con tope imponible de 81,6 UF mensuales.<br/>
b) <strong>Salud — ${healthLabel}</strong>: ${healthDetail}, con tope imponible de 81,6 UF mensuales.<br/>
c) <strong>Seguro de Cesantia (AFC)</strong>: ${f.afcActive ? (f.contractType === 'indefinido' ? '0,6% a cargo del Trabajador y 2,4% a cargo del Empleador' : '3% a cargo del Empleador') : 'No aplica'}.<br/>
d) <strong>Impuesto Unico de Segunda Categoria</strong>: conforme a la tabla del Art. 43 N°1 de la Ley de Impuesto a la Renta.</p>
<p>El Empleador sera responsable de retener y enterar las cotizaciones previsionales dentro de los primeros 10 dias del mes siguiente al del pago de la remuneracion.</p>
${f.apvActive ? `<p>e) <strong>APV — Ahorro Previsional Voluntario</strong>: El Trabajador ha optado por efectuar un ahorro previsional voluntario bajo el Regimen ${f.apvRegime} del articulo 20${f.apvRegime === 'B' ? ' L' : ''} del DL 3.500, por un monto mensual de $${f.apvMonthlyAmount.toLocaleString('es-CL')}, que sera descontado de su remuneracion y enterado en la institucion autorizada que el Trabajador indique.</p>` : ''}
${f.pensionAlimentos ? `<p>f) <strong>Pension de Alimentos</strong>: Conforme a resolucion judicial y al articulo 8 de la Ley 14.908, el Empleador retendra mensualmente de la remuneracion del Trabajador ${f.pensionAlimentosTipo === 'fijo' ? `la suma de $${f.pensionAlimentosMonto.toLocaleString('es-CL')}` : `el ${f.pensionAlimentosPct}% de la remuneracion bruta`} por concepto de pension de alimentos, depositandola directamente en la cuenta del beneficiario ordenada por el tribunal. El incumplimiento de esta obligacion por parte del empleador lo hace solidariamente responsable del pago (Art. 8 inc. 3 Ley 14.908).</p>` : ''}
<p class="legal-ref">Ref: DL 3.500 (AFP); Ley 18.469/18.933 (Salud); Ley 19.728 (AFC); Art. 58 Codigo del Trabajo${f.apvActive ? '; Art. 20/20L DL 3.500 (APV)' : ''}${f.pensionAlimentos ? '; Ley 14.908 (Pension de Alimentos)' : ''}.</p>
</div>

<div class="clause">
<h2>SEXTO: Duracion del Contrato</h2>
<p>${durationClause}</p>
${f.trialDays > 0 ? `<p>Se establece un periodo de prueba de ${f.trialDays} dias, durante el cual cualquiera de las partes podra poner termino al contrato, dando aviso con al menos 3 dias habiles de anticipacion.</p>` : ''}
<p class="legal-ref">Ref: Art. 10 N°6, Art. 159 N°4 y N°5 del Codigo del Trabajo.</p>
</div>

<div class="clause">
<h2>SEPTIMO: Feriado Anual y Permisos</h2>
<p>El Trabajador tendra derecho a un feriado anual de 15 dias habiles con remuneracion integra${f.extraVacationDays > 0 ? `, mas ${f.extraVacationDays} dias adicionales pactados por las partes` : ''}, despues de un a&ntilde;o de servicio. ${f.progressiveVacation ? 'Adicionalmente, tendra derecho a feriado progresivo de 1 dia por cada 3 nuevos a&ntilde;os trabajados, a partir del decimo a&ntilde;o (Art. 68).' : ''}</p>
<p>Se reconocen los permisos legales: 5 dias por fallecimiento de conyuge/hijo/padre (Art. 66), 5 dias de permiso parental (Ley 21.247), dias de nacimiento de hijo (Art. 195), y demas permisos establecidos por ley.</p>
<p class="legal-ref">Ref: Art. 67-76 del Codigo del Trabajo.</p>
</div>

<div class="clause">
<h2>OCTAVO: Obligaciones del Trabajador</h2>
<p>El Trabajador se obliga a:</p>
<p>a) Prestar sus servicios con diligencia y responsabilidad, cumpliendo las instrucciones del Empleador.<br/>
b) Mantener absoluta reserva sobre la informacion confidencial de la empresa.<br/>
c) Cuidar los bienes, equipos y herramientas puestos a su disposicion, respondiendo de los da&ntilde;os causados por negligencia.<br/>
d) Cumplir con el Reglamento Interno de Orden, Higiene y Seguridad de la empresa.<br/>
e) Informar oportunamente cualquier cambio en sus datos personales (domicilio, estado civil, cargas familiares).<br/>
f) No realizar, durante la jornada de trabajo, actividades ajenas a sus funciones sin autorizacion.${f.uniformRequired ? '<br/>g) Utilizar el uniforme y elementos de proteccion personal proporcionados por el Empleador.' : ''}</p>
</div>

<div class="clause">
<h2>NOVENO: Obligaciones del Empleador</h2>
<p>El Empleador se obliga a:</p>
<p>a) Pagar la remuneracion en la forma y fecha convenidas.<br/>
b) Proporcionar al Trabajador los medios necesarios para el desempe&ntilde;o de sus funciones.<br/>
c) Cumplir con las normas de higiene y seguridad en el trabajo (Ley 16.744).<br/>
d) Respetar la dignidad del Trabajador y garantizar un ambiente laboral libre de acoso (Ley 20.607).<br/>
e) Otorgar las prestaciones de seguridad social conforme a la ley.<br/>
f) Mantener reserva de toda la informacion personal del Trabajador (Ley 19.628 y Ley 21.719).</p>
</div>

${remoteClause}
${confClause}
${nonCompClause}
${ipClause}

<div class="clause">
<h2>${f.confidentiality || f.nonCompete || f.intellectualProperty || f.remoteWorkClause || f.workModality !== 'presencial' ? 'CLAUSULA ADICIONAL' : 'DECIMO'}: TERMINO DEL CONTRATO</h2>
<p>El presente contrato podra terminar por las causales establecidas en los articulos 159 (causales objetivas), 160 (causales imputables al trabajador) y 161 (necesidades de la empresa) del Codigo del Trabajo. El Empleador debera comunicar el termino por escrito, personalmente o por carta certificada, indicando la causal invocada y los hechos en que se funda.</p>
<p>En caso de despido por necesidades de la empresa (Art. 161), el Trabajador tendra derecho a indemnizacion por a&ntilde;os de servicio equivalente a 30 dias de la ultima remuneracion mensual por cada a&ntilde;o de servicio y fraccion superior a 6 meses, con tope de 330 dias (11 a&ntilde;os). El tope de la remuneracion mensual para este calculo es de 90 UF.</p>
<p class="legal-ref">Ref: Art. 159, 160, 161, 162, 163, 168, 169 del Codigo del Trabajo.</p>
</div>

<div class="clause">
<h2>DISPOSICIONES FINALES</h2>
<p>El presente contrato se firma en dos ejemplares de identico tenor y fecha, quedando uno en poder de cada parte contratante. Toda modificacion, actualizacion o complemento al presente contrato debera constar por escrito y ser firmada por ambas partes.</p>
<p>Se deja constancia que el Trabajador recibio un ejemplar del presente contrato y del Reglamento Interno de Orden, Higiene y Seguridad de la empresa en esta fecha.</p>
<p>Para todos los efectos legales derivados del presente contrato, las partes fijan domicilio en la ciudad de ${f.companyCity} y se someten a la jurisdiccion de sus tribunales.</p>
</div>

<div class="signatures">
  <div class="sig-block">
    <div class="sig-line">
      <strong>${f.repName}</strong><br/>
      RUT: ${f.repRut}<br/>
      p.p. ${f.companyName}<br/>
      <strong>EL EMPLEADOR</strong>
    </div>
  </div>
  <div class="sig-block">
    <div class="sig-line">
      <strong>${f.firstName} ${f.lastName}</strong><br/>
      RUT: ${f.rut}<br/>
      <strong>EL TRABAJADOR</strong>
    </div>
  </div>
</div>

<div style="margin-top: 40pt; text-align: center;">
  <div class="sig-block" style="width: 40%; margin: 0 auto;">
    <div class="sig-line">
      <strong>MINISTRO DE FE</strong><br/>
      (Notario / Inspector del Trabajo)
    </div>
  </div>
</div>
</body></html>`;
}

function ContractModal({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<
    | 'empresa'
    | 'trabajador'
    | 'contrato'
    | 'jornada'
    | 'remuneracion'
    | 'previsional'
    | 'clausulas'
    | 'preview'
  >('empresa');

  const [form, setForm] = useState<ContractFormData>({
    companyName: 'Conniku SpA',
    companyRut: '',
    companyAddress: '',
    companyCity: 'Santiago',
    companyGiro: 'Servicios tecnologicos y plataformas educativas',
    repName: 'Cristian Garcia',
    repRut: '',
    firstName: employee.firstName,
    lastName: employee.lastName,
    rut: employee.rut,
    nationality: employee.nationality || 'Chilena',
    birthDate: employee.birthDate || '',
    maritalStatus: employee.maritalStatus || 'Soltero/a',
    address: employee.address || '',
    commune: '',
    city: 'Santiago',
    phone: employee.phone || '',
    email: employee.email || '',
    contractType: employee.contractType,
    startDate: employee.hireDate,
    endDate: employee.endDate || '',
    trialDays: 30,
    position: employee.position,
    department: employee.department,
    functions: '',
    workPlace: '',
    workModality: 'remoto',
    scheduleType: employee.workSchedule === 'art22' ? 'art22' : 'normal',
    weeklyHours: employee.weeklyHours || 40,
    scheduleStart: '09:00',
    scheduleEnd: '18:00',
    lunchBreak: 60,
    workDays: 'lun-vie',
    grossSalary: employee.grossSalary,
    gratificationType: 'art50',
    colacion: employee.colacion,
    movilizacion: employee.movilizacion,
    otherBonuses: '',
    payDay: 'ultimo_dia',
    payMethod: 'transferencia',
    afp: employee.afp,
    healthSystem: employee.healthSystem,
    isapreName: employee.isapreName || '',
    isapreUf: employee.isapreUf || 0,
    afcActive: employee.afcActive,
    confidentiality: true,
    nonCompete: false,
    nonCompeteMonths: 6,
    intellectualProperty: true,
    remoteWorkClause: false,
    toolsProvided: 'Computador portatil, licencias de software necesarias',
    uniformRequired: false,
    extraVacationDays: 0,
    progressiveVacation: true,
    pensionAlimentos: false,
    pensionAlimentosTipo: 'fijo',
    pensionAlimentosMonto: 0,
    pensionAlimentosPct: 0,
    pensionAlimentosBeneficiarios: 1,
    apvActive: false,
    apvRegime: 'A',
    apvMonthlyAmount: 0,
    anticipoQuincenal: false,
    anticipoPct: 30,
    contractStage: 1,
    directIndefinido: false,
  });

  const u = (key: keyof ContractFormData, val: any) => setForm((prev) => ({ ...prev, [key]: val }));

  const handlePrint = () => {
    const html = generateContractHTML(form);
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 500);
    }
  };

  const handleDownload = () => {
    const html = generateContractHTML(form);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Contrato_${form.firstName}_${form.lastName}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 13,
    fontFamily: 'inherit',
  };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    display: 'block',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };
  const fieldStyle: React.CSSProperties = { marginBottom: 12 };
  const checkboxRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    fontSize: 13,
    cursor: 'pointer',
  };

  const tabs: { id: typeof activeTab; label: string; icon: React.ReactNode }[] = [
    { id: 'empresa', label: 'Empresa', icon: <Building size={14} /> },
    { id: 'trabajador', label: 'Trabajador', icon: <Users size={14} /> },
    { id: 'contrato', label: 'Contrato', icon: <FileText size={14} /> },
    { id: 'jornada', label: 'Jornada', icon: <Clock size={14} /> },
    { id: 'remuneracion', label: 'Remuneracion', icon: <DollarSign size={14} /> },
    { id: 'previsional', label: 'Previsional', icon: <Shield size={14} /> },
    { id: 'clausulas', label: 'Clausulas', icon: <PenTool size={14} /> },
    { id: 'preview', label: 'Vista Previa', icon: <Eye size={14} /> },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'relative',
          background: 'var(--bg-primary)',
          borderRadius: 16,
          width: '95%',
          maxWidth: 820,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
              <FileText size={20} /> Generar Contrato de Trabajo
            </h3>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: 4,
              }}
            >
              <X size={20} />
            </button>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto', marginBottom: -1 }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 14px',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === tab.id ? 'var(--bg-primary)' : 'transparent',
                  borderBottom:
                    activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                  color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {/* EMPRESA */}
          {activeTab === 'empresa' && (
            <div>
              <div
                style={{
                  padding: 12,
                  background: 'linear-gradient(135deg, #3B82F620, #6366F120)',
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: 12,
                  color: 'var(--text-muted)',
                }}
              >
                <strong>Art. 10 N°1 y N°2 — Codigo del Trabajo:</strong> El contrato debe contener
                la individualizacion de las partes con indicacion de la nacionalidad, domicilio y
                direccion del empleador.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Razon Social</label>
                  <input
                    style={inputStyle}
                    value={form.companyName}
                    onChange={(e) => u('companyName', e.target.value)}
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>RUT Empresa</label>
                  <input
                    style={inputStyle}
                    value={form.companyRut}
                    onChange={(e) => u('companyRut', e.target.value)}
                    placeholder="77.XXX.XXX-X"
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Giro / Actividad Economica</label>
                  <input
                    style={inputStyle}
                    value={form.companyGiro}
                    onChange={(e) => u('companyGiro', e.target.value)}
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Ciudad</label>
                  <input
                    style={inputStyle}
                    value={form.companyCity}
                    onChange={(e) => u('companyCity', e.target.value)}
                  />
                </div>
                <div style={{ ...fieldStyle, gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Direccion Empresa</label>
                  <input
                    style={inputStyle}
                    value={form.companyAddress}
                    onChange={(e) => u('companyAddress', e.target.value)}
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Representante Legal</label>
                  <input
                    style={inputStyle}
                    value={form.repName}
                    onChange={(e) => u('repName', e.target.value)}
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>RUT Representante</label>
                  <input
                    style={inputStyle}
                    value={form.repRut}
                    onChange={(e) => u('repRut', e.target.value)}
                    placeholder="XX.XXX.XXX-X"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TRABAJADOR */}
          {activeTab === 'trabajador' && (
            <div>
              <div
                style={{
                  padding: 12,
                  background: 'linear-gradient(135deg, #10B98120, #06B6D420)',
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: 12,
                  color: 'var(--text-muted)',
                }}
              >
                <strong>Art. 10 N°1 — Codigo del Trabajo:</strong> Individualizacion del trabajador
                con indicacion de nacionalidad, fecha de nacimiento, domicilio e ingreso.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Nombres</label>
                  <input
                    style={inputStyle}
                    value={form.firstName}
                    onChange={(e) => u('firstName', e.target.value)}
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Apellidos</label>
                  <input
                    style={inputStyle}
                    value={form.lastName}
                    onChange={(e) => u('lastName', e.target.value)}
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>RUT</label>
                  <input
                    style={inputStyle}
                    value={form.rut}
                    onChange={(e) => u('rut', e.target.value)}
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Nacionalidad</label>
                  <input
                    style={inputStyle}
                    value={form.nationality}
                    onChange={(e) => u('nationality', e.target.value)}
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Fecha de Nacimiento</label>
                  <input
                    style={inputStyle}
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => u('birthDate', e.target.value)}
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Estado Civil</label>
                  <select
                    style={selectStyle}
                    value={form.maritalStatus}
                    onChange={(e) => u('maritalStatus', e.target.value)}
                  >
                    <option value="Soltero/a">Soltero/a</option>
                    <option value="Casado/a">Casado/a</option>
                    <option value="Divorciado/a">Divorciado/a</option>
                    <option value="Viudo/a">Viudo/a</option>
                    <option value="Conviviente Civil">Conviviente Civil</option>
                  </select>
                </div>
                <div style={{ ...fieldStyle, gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Direccion</label>
                  <input
                    style={inputStyle}
                    value={form.address}
                    onChange={(e) => u('address', e.target.value)}
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Comuna</label>
                  <input
                    style={inputStyle}
                    value={form.commune}
                    onChange={(e) => u('commune', e.target.value)}
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Ciudad</label>
                  <input
                    style={inputStyle}
                    value={form.city}
                    onChange={(e) => u('city', e.target.value)}
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Telefono</label>
                  <input
                    style={inputStyle}
                    value={form.phone}
                    onChange={(e) => u('phone', e.target.value)}
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Email</label>
                  <input
                    style={inputStyle}
                    value={form.email}
                    onChange={(e) => u('email', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* CONTRATO */}
          {activeTab === 'contrato' && (
            <div>
              <div
                style={{
                  padding: 12,
                  background: 'linear-gradient(135deg, #F59E0B20, #F9731620)',
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: 12,
                  color: 'var(--text-muted)',
                }}
              >
                <strong>Art. 10 N°3, N°4, N°6 — Codigo del Trabajo:</strong> Determinacion de la
                naturaleza de los servicios, lugar de trabajo y plazo del contrato. Art. 159 N°4:
                plazo fijo max 1 ano (2 anos profesionales). Segunda renovacion lo convierte en
                indefinido.
              </div>
              {/* Progresion contractual Conniku */}
              <div
                style={{
                  padding: 12,
                  background: 'var(--bg-secondary)',
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>
                  Progresion Contractual Conniku
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Politica interna: 1er contrato plazo fijo 30 dias → 2do contrato 60 dias → 3er
                  contrato indefinido (Art. 159 N°4: segunda renovacion = indefinido).
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  {CHILE_LABOR.CONTRACT_PROGRESSION.stages.map((stage) => (
                    <button
                      key={stage.stage}
                      onClick={() => {
                        u('contractStage', stage.stage);
                        u('contractType', stage.type);
                        if (stage.type === 'plazo_fijo' && form.startDate) {
                          const end = new Date(form.startDate);
                          end.setDate(end.getDate() + stage.days);
                          u('endDate', end.toISOString().split('T')[0]);
                        }
                        u('directIndefinido', false);
                      }}
                      style={{
                        ...btnSmall,
                        flex: 1,
                        textAlign: 'center',
                        background:
                          form.contractStage === stage.stage && !form.directIndefinido
                            ? 'var(--accent)'
                            : undefined,
                        color:
                          form.contractStage === stage.stage && !form.directIndefinido
                            ? '#fff'
                            : undefined,
                      }}
                    >
                      {stage.label}
                    </button>
                  ))}
                </div>
                <label
                  style={{
                    ...checkboxRow,
                    padding: 8,
                    background: 'var(--bg-tertiary)',
                    borderRadius: 6,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.directIndefinido}
                    onChange={(e) => {
                      u('directIndefinido', e.target.checked);
                      if (e.target.checked) u('contractType', 'indefinido');
                    }}
                  />
                  <div>
                    <strong>Contratacion directa a Indefinido</strong> (decision CEO/RRHH)
                    <br />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Omite la progresion y genera contrato indefinido desde el inicio.
                    </span>
                  </div>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Tipo de Contrato</label>
                  <select
                    style={selectStyle}
                    value={form.contractType}
                    onChange={(e) => u('contractType', e.target.value)}
                  >
                    {CONTRACT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Dias de Prueba</label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={form.trialDays}
                    onChange={(e) => u('trialDays', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Fecha Inicio</label>
                  <input
                    style={inputStyle}
                    type="date"
                    value={form.startDate}
                    onChange={(e) => u('startDate', e.target.value)}
                  />
                </div>
                {form.contractType === 'plazo_fijo' && (
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Fecha Termino</label>
                    <input
                      style={inputStyle}
                      type="date"
                      value={form.endDate}
                      onChange={(e) => u('endDate', e.target.value)}
                    />
                  </div>
                )}
                <div style={fieldStyle}>
                  <label style={labelStyle}>Cargo / Posicion</label>
                  <input
                    style={inputStyle}
                    value={form.position}
                    onChange={(e) => u('position', e.target.value)}
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Departamento</label>
                  <select
                    style={selectStyle}
                    value={form.department}
                    onChange={(e) => u('department', e.target.value)}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ ...fieldStyle, gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Funciones Principales (descripcion)</label>
                  <textarea
                    style={{ ...inputStyle, height: 70, resize: 'vertical' }}
                    value={form.functions}
                    onChange={(e) => u('functions', e.target.value)}
                    placeholder="Desarrollo de software, mantencion de plataformas, soporte tecnico..."
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Modalidad de Trabajo</label>
                  <select
                    style={selectStyle}
                    value={form.workModality}
                    onChange={(e) => u('workModality', e.target.value)}
                  >
                    {WORK_MODALITIES.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Lugar de Trabajo</label>
                  <input
                    style={inputStyle}
                    value={form.workPlace}
                    onChange={(e) => u('workPlace', e.target.value)}
                    placeholder="Direccion o 'Domicilio del trabajador'"
                  />
                </div>
              </div>
            </div>
          )}

          {/* JORNADA */}
          {activeTab === 'jornada' && (
            <div>
              <div
                style={{
                  padding: 12,
                  background: 'linear-gradient(135deg, #EC489920, #F4385E20)',
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: 12,
                  color: 'var(--text-muted)',
                }}
              >
                <strong>Art. 10 N°5, Art. 22-40 bis — Codigo del Trabajo:</strong> Duracion y
                distribucion de la jornada. Ley 21.561: reduccion gradual a 40 hrs semanales. Art.
                22 inc. 2: excluye de limitacion a gerentes, teletrabajadores sin fiscalizacion y
                otros.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ ...fieldStyle, gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Tipo de Jornada</label>
                  <select
                    style={selectStyle}
                    value={form.scheduleType}
                    onChange={(e) => u('scheduleType', e.target.value)}
                  >
                    {SCHEDULE_TYPES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                {form.scheduleType !== 'art22' && (
                  <>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Horas Semanales</label>
                      <input
                        style={inputStyle}
                        type="number"
                        value={form.weeklyHours}
                        onChange={(e) => u('weeklyHours', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Distribucion</label>
                      <select
                        style={selectStyle}
                        value={form.workDays}
                        onChange={(e) => u('workDays', e.target.value)}
                      >
                        <option value="lun-vie">Lunes a Viernes</option>
                        <option value="lun-sab">Lunes a Sabado</option>
                        <option value="turnos">Turnos Rotativos</option>
                      </select>
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Hora Entrada</label>
                      <input
                        style={inputStyle}
                        type="time"
                        value={form.scheduleStart}
                        onChange={(e) => u('scheduleStart', e.target.value)}
                      />
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Hora Salida</label>
                      <input
                        style={inputStyle}
                        type="time"
                        value={form.scheduleEnd}
                        onChange={(e) => u('scheduleEnd', e.target.value)}
                      />
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Colacion (minutos)</label>
                      <input
                        style={inputStyle}
                        type="number"
                        value={form.lunchBreak}
                        onChange={(e) => u('lunchBreak', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </>
                )}
                {form.scheduleType === 'art22' && (
                  <div
                    style={{
                      gridColumn: 'span 2',
                      padding: 12,
                      background: 'var(--bg-tertiary)',
                      borderRadius: 8,
                      fontSize: 12,
                      color: 'var(--text-muted)',
                    }}
                  >
                    <AlertTriangle
                      size={14}
                      style={{ display: 'inline', verticalAlign: 'middle' }}
                    />{' '}
                    El trabajador excluido de jornada (Art. 22 inc. 2) no tiene derecho a horas
                    extraordinarias. Aplica para: gerentes, administradores, apoderados con
                    facultades de administracion, teletrabajadores que distribuyen libremente su
                    jornada, y trabajadores sin fiscalizacion superior inmediata.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REMUNERACION */}
          {activeTab === 'remuneracion' &&
            (() => {
              const salaryCheck = validateSalary(form.grossSalary, form.weeklyHours);
              const gratMensual = CHILE_LABOR.GRATIFICACION.topeMensual;
              return (
                <div>
                  <div
                    style={{
                      padding: 12,
                      background: 'linear-gradient(135deg, #10B98120, #14B8A620)',
                      borderRadius: 8,
                      marginBottom: 16,
                      fontSize: 12,
                      color: 'var(--text-muted)',
                    }}
                  >
                    <strong>Art. 10 N°5, Art. 41-52 — Codigo del Trabajo:</strong> Monto, forma y
                    periodo de pago. Art. 42: constituyen remuneracion el sueldo, sobresueldo,
                    comision, participacion y gratificacion. Art. 44: sueldo no puede ser inferior
                    al IMM (${CHILE_LABOR.IMM.current.toLocaleString('es-CL')}). Art. 50:
                    gratificacion legal obligatoria.
                  </div>

                  {/* Salary validation */}
                  {!salaryCheck.valid && (
                    <div
                      style={{
                        padding: 12,
                        background: '#FEF2F220',
                        border: '2px solid #EF4444',
                        borderRadius: 8,
                        marginBottom: 16,
                        fontSize: 13,
                        color: '#DC2626',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <AlertTriangle size={18} /> <strong>ALERTA LEGAL:</strong>{' '}
                      {salaryCheck.message}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Sueldo Bruto Mensual ($CLP)</label>
                      <input
                        style={{
                          ...inputStyle,
                          borderColor: !salaryCheck.valid ? '#EF4444' : undefined,
                        }}
                        type="number"
                        value={form.grossSalary}
                        onChange={(e) => u('grossSalary', parseInt(e.target.value) || 0)}
                      />
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                        Minimo legal: ${salaryCheck.min.toLocaleString('es-CL')} ({form.weeklyHours}
                        h/sem)
                      </div>
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Gratificacion Legal</label>
                      <select
                        style={selectStyle}
                        value={form.gratificationType}
                        onChange={(e) => u('gratificationType', e.target.value)}
                      >
                        {GRATIFICATION_TYPES.map((g) => (
                          <option key={g.value} value={g.value}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                        Tope mensual: ${gratMensual.toLocaleString('es-CL')}
                      </div>
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Colacion ($CLP, no imponible)</label>
                      <input
                        style={inputStyle}
                        type="number"
                        value={form.colacion}
                        onChange={(e) => u('colacion', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Movilizacion ($CLP, no imponible)</label>
                      <input
                        style={inputStyle}
                        type="number"
                        value={form.movilizacion}
                        onChange={(e) => u('movilizacion', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Dia de Pago de Remuneracion</label>
                      <select
                        style={selectStyle}
                        value={form.payDay}
                        onChange={(e) => u('payDay', e.target.value)}
                      >
                        <option value="ultimo_dia">Ultimo dia habil del mes</option>
                        <option value="dia_30">Dia 30 de cada mes</option>
                      </select>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                        Cierre de calculo: dia {CHILE_LABOR.CONNIKU_PAYROLL.cierreDia} de cada mes
                      </div>
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Forma de Pago</label>
                      <select
                        style={selectStyle}
                        value={form.payMethod}
                        onChange={(e) => u('payMethod', e.target.value)}
                      >
                        <option value="transferencia">Transferencia Bancaria</option>
                        <option value="cheque">Cheque Nominativo</option>
                      </select>
                    </div>
                    <div style={{ ...fieldStyle, gridColumn: 'span 2' }}>
                      <label style={labelStyle}>Otros Bonos / Asignaciones (opcional)</label>
                      <input
                        style={inputStyle}
                        value={form.otherBonuses}
                        onChange={(e) => u('otherBonuses', e.target.value)}
                        placeholder="Ej: Bono de productividad $50.000, asignacion de herramientas $30.000"
                      />
                    </div>
                  </div>

                  {/* Anticipo Quincenal */}
                  <div
                    style={{
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      borderRadius: 8,
                      marginTop: 12,
                    }}
                  >
                    <label style={checkboxRow}>
                      <input
                        type="checkbox"
                        checked={form.anticipoQuincenal}
                        onChange={(e) => u('anticipoQuincenal', e.target.checked)}
                      />
                      <div>
                        <strong>
                          Anticipo Quincenal (dia {CHILE_LABOR.CONNIKU_PAYROLL.anticipoDia})
                        </strong>
                        <br />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Art. 55 CT: Pago fraccionado por acuerdo de partes. Max 40% del salario
                          devengado al cierre del dia 22 (100% ganado). Disponible desde el 2do mes
                          de trabajo.
                        </span>
                      </div>
                    </label>
                    {form.anticipoQuincenal && (
                      <div style={{ marginTop: 8, marginLeft: 24 }}>
                        <label style={labelStyle}>
                          % del Sueldo Liquido (calculado al cierre dia 22)
                        </label>
                        <input
                          style={{ ...inputStyle, width: 120 }}
                          type="number"
                          value={form.anticipoPct}
                          onChange={(e) =>
                            u('anticipoPct', Math.min(parseInt(e.target.value) || 0, 40))
                          }
                        />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                          Max 40%
                        </span>
                        <div
                          style={{
                            marginTop: 8,
                            padding: 8,
                            background: 'var(--bg-tertiary)',
                            borderRadius: 6,
                            fontSize: 11,
                            color: 'var(--text-muted)',
                          }}
                        >
                          <strong>Como funciona:</strong> El sueldo devengado al cierre del dia 22
                          del mes anterior se considera el 100% ganado. El anticipo es hasta el{' '}
                          {form.anticipoPct}% del liquido estimado sobre ese monto. Se paga el dia
                          15 y se descuenta de la liquidacion de fin de mes. Solo aplica desde el
                          2do mes (requiere 1 ciclo completo como base).
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Resumen */}
                  <div
                    style={{
                      padding: 12,
                      background: 'var(--bg-tertiary)',
                      borderRadius: 8,
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      marginTop: 12,
                    }}
                  >
                    <strong>Resumen Haberes:</strong>
                    <br />
                    Sueldo bruto: ${form.grossSalary.toLocaleString('es-CL')} | Gratificacion
                    (tope): ${gratMensual.toLocaleString('es-CL')} | Colacion: $
                    {form.colacion.toLocaleString('es-CL')} | Movilizacion: $
                    {form.movilizacion.toLocaleString('es-CL')}
                    <br />
                    <strong>Total haberes imponibles:</strong> $
                    {(form.grossSalary + gratMensual).toLocaleString('es-CL')} |{' '}
                    <strong>Total no imponibles:</strong> $
                    {(form.colacion + form.movilizacion).toLocaleString('es-CL')}
                    <br />
                    <strong>Total bruto:</strong> $
                    {(
                      form.grossSalary +
                      gratMensual +
                      form.colacion +
                      form.movilizacion
                    ).toLocaleString('es-CL')}
                    {form.anticipoQuincenal && (
                      <>
                        <br />
                        <strong>Anticipo dia 15:</strong> ~$
                        {Math.round(
                          (form.grossSalary * 0.7 * form.anticipoPct) / 100
                        ).toLocaleString('es-CL')}{' '}
                        ({form.anticipoPct}% del liquido estimado)
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

          {/* PREVISIONAL */}
          {activeTab === 'previsional' &&
            (() => {
              const afpRate = AFP_OPTIONS.find((a) => a.value === form.afp)?.rate || 0;
              const afpAmount = Math.round(
                (Math.min(form.grossSalary, CHILE_LABOR.TOPES.afpCLP) * afpRate) / 100
              );
              const healthAmount = Math.round(
                Math.min(form.grossSalary, CHILE_LABOR.TOPES.saludCLP) * 0.07
              );
              const afcEmpAmount = form.afcActive
                ? Math.round(
                    Math.min(form.grossSalary, CHILE_LABOR.TOPES.afcCLP) *
                      (form.contractType === 'indefinido' ? CHILE_LABOR.AFC.employeeRate : 0)
                  )
                : 0;
              const afcErAmount = form.afcActive
                ? Math.round(
                    Math.min(form.grossSalary, CHILE_LABOR.TOPES.afcCLP) *
                      (form.contractType === 'indefinido'
                        ? CHILE_LABOR.AFC.employerIndefinido
                        : CHILE_LABOR.AFC.employerPlazoFijo)
                  )
                : 0;
              const sisAmount = Math.round(form.grossSalary * CHILE_LABOR.SIS.rate);
              const mutualAmount = Math.round(
                form.grossSalary * (CHILE_LABOR.MUTUAL.baseRate + CHILE_LABOR.MUTUAL.additionalRate)
              );
              const totalDescOblig = afpAmount + healthAmount + afcEmpAmount;
              const taxableIncome = form.grossSalary - afpAmount - healthAmount - afcEmpAmount;
              const taxAmount = calculateTax(Math.max(taxableIncome, 0));
              const pensionAmt = form.pensionAlimentos
                ? form.pensionAlimentosTipo === 'fijo'
                  ? form.pensionAlimentosMonto
                  : Math.round((form.grossSalary * form.pensionAlimentosPct) / 100)
                : 0;
              const apvAmt = form.apvActive ? form.apvMonthlyAmount : 0;
              const netEstimate =
                form.grossSalary -
                totalDescOblig -
                taxAmount -
                pensionAmt -
                apvAmt +
                form.colacion +
                form.movilizacion;

              return (
                <div>
                  <div
                    style={{
                      padding: 12,
                      background: 'linear-gradient(135deg, #6366F120, #8B5CF620)',
                      borderRadius: 8,
                      marginBottom: 16,
                      fontSize: 12,
                      color: 'var(--text-muted)',
                    }}
                  >
                    <strong>DL 3.500 (AFP), Ley 18.469/18.933 (Salud), Ley 19.728 (AFC):</strong>{' '}
                    Cotizaciones obligatorias. Tope imponible: {CHILE_LABOR.TOPES.afpUF} UF = $
                    {CHILE_LABOR.TOPES.afpCLP.toLocaleString('es-CL')}. SIS (
                    {(CHILE_LABOR.SIS.rate * 100).toFixed(2)}%) y Mutual (
                    {(
                      (CHILE_LABOR.MUTUAL.baseRate + CHILE_LABOR.MUTUAL.additionalRate) *
                      100
                    ).toFixed(2)}
                    %): cargo del empleador.
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>AFP</label>
                      <select
                        style={selectStyle}
                        value={form.afp}
                        onChange={(e) => u('afp', e.target.value)}
                      >
                        <option value="">Seleccionar AFP</option>
                        {AFP_OPTIONS.map((a) => (
                          <option key={a.value} value={a.value}>
                            {a.label} ({a.rate}%)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Sistema de Salud</label>
                      <select
                        style={selectStyle}
                        value={form.healthSystem}
                        onChange={(e) => u('healthSystem', e.target.value)}
                      >
                        {HEALTH_OPTIONS.map((h) => (
                          <option key={h.value} value={h.value}>
                            {h.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {form.healthSystem === 'isapre' && (
                      <>
                        <div style={fieldStyle}>
                          <label style={labelStyle}>Nombre Isapre</label>
                          <input
                            style={inputStyle}
                            value={form.isapreName}
                            onChange={(e) => u('isapreName', e.target.value)}
                          />
                        </div>
                        <div style={fieldStyle}>
                          <label style={labelStyle}>Plan Isapre (UF mensuales)</label>
                          <input
                            style={inputStyle}
                            type="number"
                            step="0.1"
                            value={form.isapreUf}
                            onChange={(e) => u('isapreUf', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </>
                    )}
                    <div style={{ ...fieldStyle, gridColumn: 'span 2' }}>
                      <label style={checkboxRow}>
                        <input
                          type="checkbox"
                          checked={form.afcActive}
                          onChange={(e) => u('afcActive', e.target.checked)}
                        />
                        <span>
                          <strong>Seguro de Cesantia (AFC)</strong> — Obligatorio para contratos
                          desde Oct 2002. Tope: {CHILE_LABOR.TOPES.afcUF} UF
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* APV */}
                  <div
                    style={{
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      borderRadius: 8,
                      marginTop: 12,
                    }}
                  >
                    <label style={checkboxRow}>
                      <input
                        type="checkbox"
                        checked={form.apvActive}
                        onChange={(e) => u('apvActive', e.target.checked)}
                      />
                      <div>
                        <strong>APV — Ahorro Previsional Voluntario (Art. 20 DL 3.500)</strong>
                        <br />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Descuento voluntario del trabajador. Regimen A: bonificacion fiscal 15%.
                          Regimen B: rebaja base tributable.
                        </span>
                      </div>
                    </label>
                    {form.apvActive && (
                      <div
                        style={{
                          marginTop: 8,
                          marginLeft: 24,
                          display: 'flex',
                          gap: 12,
                          alignItems: 'end',
                        }}
                      >
                        <div>
                          <label style={labelStyle}>Regimen</label>
                          <select
                            style={{ ...selectStyle, width: 280 }}
                            value={form.apvRegime}
                            onChange={(e) => u('apvRegime', e.target.value)}
                          >
                            {CHILE_LABOR.APV.regimes.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>Monto Mensual ($CLP)</label>
                          <input
                            style={{ ...inputStyle, width: 150 }}
                            type="number"
                            value={form.apvMonthlyAmount}
                            onChange={(e) => u('apvMonthlyAmount', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pension de Alimentos */}
                  <div
                    style={{
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      borderRadius: 8,
                      marginTop: 12,
                    }}
                  >
                    <label style={checkboxRow}>
                      <input
                        type="checkbox"
                        checked={form.pensionAlimentos}
                        onChange={(e) => u('pensionAlimentos', e.target.checked)}
                      />
                      <div>
                        <strong>Pension de Alimentos (Ley 14.908)</strong>
                        <br />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Retencion judicial obligatoria. El empleador DEBE retener y depositar
                          directamente (Art. 8). Incumplimiento = arresto (Art. 14). Max retencion:
                          50% de la remuneracion.
                        </span>
                      </div>
                    </label>
                    {form.pensionAlimentos && (
                      <div
                        style={{
                          marginTop: 8,
                          marginLeft: 24,
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr 1fr',
                          gap: 12,
                        }}
                      >
                        <div>
                          <label style={labelStyle}>Tipo</label>
                          <select
                            style={selectStyle}
                            value={form.pensionAlimentosTipo}
                            onChange={(e) => u('pensionAlimentosTipo', e.target.value)}
                          >
                            <option value="fijo">Monto Fijo</option>
                            <option value="porcentaje">% del Sueldo</option>
                          </select>
                        </div>
                        {form.pensionAlimentosTipo === 'fijo' ? (
                          <div>
                            <label style={labelStyle}>Monto Mensual ($CLP)</label>
                            <input
                              style={inputStyle}
                              type="number"
                              value={form.pensionAlimentosMonto}
                              onChange={(e) =>
                                u('pensionAlimentosMonto', parseInt(e.target.value) || 0)
                              }
                            />
                          </div>
                        ) : (
                          <div>
                            <label style={labelStyle}>% del Sueldo Bruto</label>
                            <input
                              style={inputStyle}
                              type="number"
                              value={form.pensionAlimentosPct}
                              onChange={(e) =>
                                u(
                                  'pensionAlimentosPct',
                                  Math.min(parseInt(e.target.value) || 0, 50)
                                )
                              }
                            />
                          </div>
                        )}
                        <div>
                          <label style={labelStyle}>N° Beneficiarios</label>
                          <input
                            style={inputStyle}
                            type="number"
                            value={form.pensionAlimentosBeneficiarios}
                            onChange={(e) =>
                              u('pensionAlimentosBeneficiarios', parseInt(e.target.value) || 1)
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Desglose completo */}
                  {form.afp && (
                    <div
                      style={{
                        padding: 16,
                        background: 'var(--bg-tertiary)',
                        borderRadius: 8,
                        fontSize: 12,
                        marginTop: 16,
                      }}
                    >
                      <strong style={{ fontSize: 13 }}>
                        Simulacion de Liquidacion — Sueldo $
                        {form.grossSalary.toLocaleString('es-CL')}
                      </strong>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 8,
                          marginTop: 12,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              color: 'var(--accent)',
                              marginBottom: 6,
                              textTransform: 'uppercase',
                              fontSize: 11,
                            }}
                          >
                            Haberes
                          </div>
                          <div>Sueldo Base: ${form.grossSalary.toLocaleString('es-CL')}</div>
                          <div>
                            Gratificacion: $
                            {CHILE_LABOR.GRATIFICACION.topeMensual.toLocaleString('es-CL')}
                          </div>
                          <div>Colacion: ${form.colacion.toLocaleString('es-CL')}</div>
                          <div>Movilizacion: ${form.movilizacion.toLocaleString('es-CL')}</div>
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              color: '#EF4444',
                              marginBottom: 6,
                              textTransform: 'uppercase',
                              fontSize: 11,
                            }}
                          >
                            Descuentos Obligatorios
                          </div>
                          <div>
                            AFP {AFP_OPTIONS.find((a) => a.value === form.afp)?.label} ({afpRate}%):
                            -${afpAmount.toLocaleString('es-CL')}
                          </div>
                          <div>Salud (7%): -${healthAmount.toLocaleString('es-CL')}</div>
                          {form.afcActive && (
                            <div>
                              AFC Trabajador ({(CHILE_LABOR.AFC.employeeRate * 100).toFixed(1)}%):
                              -${afcEmpAmount.toLocaleString('es-CL')}
                            </div>
                          )}
                          <div>Impuesto 2da Cat.: -${taxAmount.toLocaleString('es-CL')}</div>
                          {form.pensionAlimentos && (
                            <div style={{ color: '#DC2626' }}>
                              Pension Alimentos: -${pensionAmt.toLocaleString('es-CL')}
                            </div>
                          )}
                          {form.apvActive && (
                            <div>
                              APV Reg. {form.apvRegime}: -${apvAmt.toLocaleString('es-CL')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div
                        style={{
                          borderTop: '2px solid var(--border)',
                          marginTop: 12,
                          paddingTop: 12,
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: 15, color: 'var(--accent-green)' }}>
                            Liquido Estimado: ${netEstimate.toLocaleString('es-CL')}
                          </strong>
                        </div>
                        <div
                          style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}
                        >
                          Costo empleador: SIS ${sisAmount.toLocaleString('es-CL')} + AFC $
                          {afcErAmount.toLocaleString('es-CL')} + Mutual $
                          {mutualAmount.toLocaleString('es-CL')} ={' '}
                          <strong>
                            ${(sisAmount + afcErAmount + mutualAmount).toLocaleString('es-CL')}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

          {/* CLAUSULAS ADICIONALES */}
          {activeTab === 'clausulas' && (
            <div>
              <div
                style={{
                  padding: 12,
                  background: 'linear-gradient(135deg, #F43F5E20, #EF444420)',
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: 12,
                  color: 'var(--text-muted)',
                }}
              >
                <strong>Art. 10 N°7 — Codigo del Trabajo:</strong> Demas pactos que acordaren las
                partes. Estas clausulas son opcionales pero altamente recomendadas para proteger los
                intereses de la empresa.
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                <label
                  style={{
                    ...checkboxRow,
                    padding: 12,
                    background: 'var(--bg-secondary)',
                    borderRadius: 8,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.confidentiality}
                    onChange={(e) => u('confidentiality', e.target.checked)}
                  />
                  <div>
                    <strong>Clausula de Confidencialidad</strong>
                    <br />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Protege informacion reservada durante y despues del contrato (2 anos).
                      Infraccion = causal Art. 160 N°7.
                    </span>
                  </div>
                </label>

                <label
                  style={{
                    ...checkboxRow,
                    padding: 12,
                    background: 'var(--bg-secondary)',
                    borderRadius: 8,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.intellectualProperty}
                    onChange={(e) => u('intellectualProperty', e.target.checked)}
                  />
                  <div>
                    <strong>Propiedad Intelectual</strong>
                    <br />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Cesion de inventos, software, obras creadas en el ejercicio del cargo. Ref:
                      Ley 19.039 y Ley 17.336.
                    </span>
                  </div>
                </label>

                <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <label style={checkboxRow}>
                    <input
                      type="checkbox"
                      checked={form.nonCompete}
                      onChange={(e) => u('nonCompete', e.target.checked)}
                    />
                    <div>
                      <strong>No Competencia Post-Contractual</strong>
                      <br />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Restriccion temporal post-termino. Requiere compensacion economica (Art. 160
                        bis).
                      </span>
                    </div>
                  </label>
                  {form.nonCompete && (
                    <div style={{ marginTop: 8, marginLeft: 24 }}>
                      <label style={labelStyle}>Meses de Restriccion</label>
                      <input
                        style={{ ...inputStyle, width: 120 }}
                        type="number"
                        value={form.nonCompeteMonths}
                        onChange={(e) => u('nonCompeteMonths', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  )}
                </div>

                <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <label style={checkboxRow}>
                    <input
                      type="checkbox"
                      checked={form.remoteWorkClause || form.workModality !== 'presencial'}
                      onChange={(e) => u('remoteWorkClause', e.target.checked)}
                    />
                    <div>
                      <strong>Clausula de Teletrabajo (Ley 21.220)</strong>
                      <br />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Obligatoria si la modalidad es remota o hibrida. Incluye derecho a
                        desconexion digital (12 hrs).
                      </span>
                    </div>
                  </label>
                  {(form.remoteWorkClause || form.workModality !== 'presencial') && (
                    <div style={{ marginTop: 8, marginLeft: 24 }}>
                      <label style={labelStyle}>Herramientas Proporcionadas</label>
                      <input
                        style={inputStyle}
                        value={form.toolsProvided}
                        onChange={(e) => u('toolsProvided', e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <label
                  style={{
                    ...checkboxRow,
                    padding: 12,
                    background: 'var(--bg-secondary)',
                    borderRadius: 8,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.uniformRequired}
                    onChange={(e) => u('uniformRequired', e.target.checked)}
                  />
                  <div>
                    <strong>Uso de Uniforme</strong>
                    <br />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Obliga al uso de uniforme/EPP proporcionado por el empleador.
                    </span>
                  </div>
                </label>

                <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>Vacaciones</div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'end' }}>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Dias Adicionales Pactados</label>
                      <input
                        style={{ ...inputStyle, width: 120 }}
                        type="number"
                        value={form.extraVacationDays}
                        onChange={(e) => u('extraVacationDays', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <label style={{ ...checkboxRow, marginBottom: 12 }}>
                      <input
                        type="checkbox"
                        checked={form.progressiveVacation}
                        onChange={(e) => u('progressiveVacation', e.target.checked)}
                      />
                      <span>Feriado Progresivo (Art. 68)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PREVIEW */}
          {activeTab === 'preview' && (
            <div>
              <div
                style={{
                  padding: 12,
                  background: 'linear-gradient(135deg, #3B82F620, #10B98120)',
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: 13,
                }}
              >
                <strong>Vista previa del contrato.</strong> Revisa todos los datos antes de generar
                el PDF.
              </div>

              <div
                style={{
                  background: '#fff',
                  color: '#000',
                  padding: 32,
                  borderRadius: 8,
                  border: '1px solid #ddd',
                  fontSize: 12,
                  lineHeight: 1.6,
                  maxHeight: 500,
                  overflow: 'auto',
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <strong style={{ fontSize: 15, letterSpacing: 2 }}>
                    CONTRATO INDIVIDUAL DE TRABAJO
                  </strong>
                </div>
                <p>
                  <strong>Empleador:</strong> {form.companyName} — RUT:{' '}
                  {form.companyRut || '[pendiente]'}
                </p>
                <p>
                  <strong>Representante:</strong> {form.repName} — RUT:{' '}
                  {form.repRut || '[pendiente]'}
                </p>
                <p>
                  <strong>Trabajador:</strong> {form.firstName} {form.lastName} — RUT: {form.rut}
                </p>
                <p>
                  <strong>Cargo:</strong> {form.position} — Depto: {form.department}
                </p>
                <p>
                  <strong>Tipo:</strong>{' '}
                  {CONTRACT_TYPES.find((c) => c.value === form.contractType)?.label} — Inicio:{' '}
                  {form.startDate
                    ? new Date(form.startDate).toLocaleDateString('es-CL')
                    : '[pendiente]'}
                </p>
                <p>
                  <strong>Jornada:</strong>{' '}
                  {SCHEDULE_TYPES.find((s) => s.value === form.scheduleType)?.label}
                  {form.scheduleType !== 'art22' ? ` — ${form.weeklyHours} hrs/sem` : ''}
                </p>
                <p>
                  <strong>Modalidad:</strong>{' '}
                  {WORK_MODALITIES.find((m) => m.value === form.workModality)?.label}
                </p>
                <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #ddd' }} />
                <p>
                  <strong>Sueldo Bruto:</strong> ${form.grossSalary.toLocaleString('es-CL')}
                </p>
                <p>
                  <strong>Colacion:</strong> ${form.colacion.toLocaleString('es-CL')} |{' '}
                  <strong>Movilizacion:</strong> ${form.movilizacion.toLocaleString('es-CL')}
                </p>
                <p>
                  <strong>AFP:</strong>{' '}
                  {AFP_OPTIONS.find((a) => a.value === form.afp)?.label || '[pendiente]'} |{' '}
                  <strong>Salud:</strong>{' '}
                  {form.healthSystem === 'fonasa' ? 'Fonasa' : `Isapre ${form.isapreName}`}
                </p>
                <p>
                  <strong>AFC:</strong> {form.afcActive ? 'Si' : 'No'}
                  {form.apvActive
                    ? ` | APV Reg. ${form.apvRegime}: $${form.apvMonthlyAmount.toLocaleString('es-CL')}`
                    : ''}
                </p>
                {form.pensionAlimentos && (
                  <p style={{ color: '#DC2626' }}>
                    <strong>Pension Alimentos:</strong>{' '}
                    {form.pensionAlimentosTipo === 'fijo'
                      ? `$${form.pensionAlimentosMonto.toLocaleString('es-CL')}`
                      : `${form.pensionAlimentosPct}%`}{' '}
                    — {form.pensionAlimentosBeneficiarios} beneficiario(s)
                  </p>
                )}
                {form.anticipoQuincenal && (
                  <p>
                    <strong>Anticipo Quincenal:</strong> {form.anticipoPct}% el dia 15
                  </p>
                )}
                <p>
                  <strong>Cierre Payroll:</strong> Dia 22 | <strong>Pago:</strong> Ultimo dia habil
                </p>
                {!form.directIndefinido && form.contractType === 'plazo_fijo' && (
                  <p>
                    <strong>Progresion:</strong> Etapa {form.contractStage} de 3 (30d → 60d →
                    Indefinido)
                  </p>
                )}
                {form.directIndefinido && (
                  <p>
                    <strong>Contratacion directa a Indefinido</strong> (decision CEO/RRHH)
                  </p>
                )}
                <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #ddd' }} />
                <p>
                  <strong>Clausulas adicionales:</strong>
                </p>
                <ul style={{ paddingLeft: 20 }}>
                  {form.confidentiality && <li>Confidencialidad</li>}
                  {form.intellectualProperty && <li>Propiedad Intelectual</li>}
                  {form.nonCompete && <li>No Competencia ({form.nonCompeteMonths} meses)</li>}
                  {(form.remoteWorkClause || form.workModality !== 'presencial') && (
                    <li>Teletrabajo (Ley 21.220)</li>
                  )}
                  {form.uniformRequired && <li>Uso de Uniforme</li>}
                  {form.extraVacationDays > 0 && (
                    <li>{form.extraVacationDays} dias adicionales de vacaciones</li>
                  )}
                  {form.progressiveVacation && <li>Feriado Progresivo (Art. 68)</li>}
                </ul>
              </div>

              {/* Validation warnings */}
              {(!form.companyRut || !form.repRut || !form.rut || !form.startDate) && (
                <div
                  style={{
                    padding: 12,
                    background: '#FEF3C720',
                    border: '1px solid #F59E0B40',
                    borderRadius: 8,
                    marginTop: 12,
                    fontSize: 12,
                    color: '#92400E',
                  }}
                >
                  <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
                  <strong>Campos pendientes:</strong>
                  {!form.companyRut && ' RUT Empresa,'} {!form.repRut && ' RUT Representante,'}{' '}
                  {!form.rut && ' RUT Trabajador,'} {!form.startDate && ' Fecha inicio'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
          }}
        >
          {activeTab !== 'preview' ? (
            <>
              <div style={{ flex: 1, fontSize: 11, color: 'var(--text-muted)' }}>
                Completa todas las pestanas y revisa en "Vista Previa" antes de generar.
              </div>
              <button
                onClick={() => {
                  const tabOrder: string[] = [
                    'empresa',
                    'trabajador',
                    'contrato',
                    'jornada',
                    'remuneracion',
                    'previsional',
                    'clausulas',
                    'preview',
                  ];
                  const idx = tabOrder.indexOf(activeTab);
                  if (idx >= 0 && idx < tabOrder.length - 1) setActiveTab(tabOrder[idx + 1] as any);
                }}
                style={btnPrimary}
              >
                Siguiente <ArrowRight size={14} />
              </button>
            </>
          ) : (
            <>
              <button onClick={handlePrint} style={{ ...btnPrimary, flex: 1 }}>
                <Download size={16} /> Imprimir / Guardar PDF
              </button>
              <button onClick={handleDownload} style={{ ...btnSecondary, flex: 1 }}>
                <FileText size={16} /> Descargar HTML
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// CONTRATOS TAB
// ═════════════════════════════════════════════════════════════════
function ContratosTab({ employees, onRefresh }: { employees: Employee[]; onRefresh: () => void }) {
  const [contractEmployee, setContractEmployee] = useState<Employee | null>(null);

  return (
    <div>
      <div
        className="card"
        style={{
          padding: 20,
          marginBottom: 16,
          background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary))',
        }}
      >
        <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={20} /> Gestion de Contratos
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
          Segun el Codigo del Trabajo de Chile, el contrato debe firmarse dentro de los primeros 15
          dias (indefinido) o 5 dias (plazo fijo) desde el inicio de la relacion laboral.
        </p>
      </div>

      {/* Contract status for each employee */}
      <div style={{ display: 'grid', gap: 12 }}>
        {employees
          .filter((e) => e.status === 'active')
          .map((emp) => {
            const daysSinceHire = Math.floor(
              (Date.now() - new Date(emp.hireDate).getTime()) / (1000 * 60 * 60 * 24)
            );
            const contractDeadline = emp.contractType === 'plazo_fijo' ? 5 : 15;

            return (
              <div key={emp.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>
                      {emp.firstName} {emp.lastName}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {CONTRACT_TYPES.find((c) => c.value === emp.contractType)?.label} • Ingreso:{' '}
                      {new Date(emp.hireDate).toLocaleDateString('es-CL')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={btnSmall} onClick={() => setContractEmployee(emp)}>
                      <FileText size={14} /> Generar Contrato
                    </button>
                    <button
                      style={btnSmall}
                      onClick={async () => {
                        try {
                          const docs = await api.getEmployeeDocuments(emp.id);
                          const contract = (Array.isArray(docs) ? docs : docs.documents || []).find(
                            (d: any) => d.document_type === 'contrato' && !d.fes_signed
                          );
                          if (!contract) {
                            alert('No hay contrato pendiente de firma para este empleado.');
                            return;
                          }
                          if (
                            confirm(
                              `¿Firmar electrónicamente el contrato de ${emp.firstName} ${emp.lastName}? (Firma Electrónica Simple — Ley 19.799)`
                            )
                          ) {
                            await api.fesSignDocument(contract.id);
                            alert('Contrato firmado exitosamente.');
                          }
                        } catch (e: any) {
                          alert(e?.message || 'Error al firmar');
                        }
                      }}
                    >
                      <PenTool size={14} /> Firmar
                    </button>
                    <button
                      style={{ ...btnSmall, opacity: 0.5, cursor: 'not-allowed' }}
                      disabled
                      title="Generador de Anexo — próximamente"
                    >
                      <FileText size={14} /> Anexo
                    </button>
                  </div>
                </div>

                {/* Contract clauses reminder */}
                <div
                  style={{
                    marginTop: 12,
                    padding: 12,
                    background: 'var(--bg-tertiary)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                >
                  <strong>Clausulas obligatorias (Art. 10 Codigo del Trabajo):</strong>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 4,
                      marginTop: 6,
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span>• Lugar y fecha del contrato</span>
                    <span>• Individualizacion de las partes</span>
                    <span>• Naturaleza de los servicios</span>
                    <span>• Lugar de prestacion de servicios</span>
                    <span>• Monto, forma y periodo de pago</span>
                    <span>• Duracion y distribucion de jornada</span>
                    <span>• Plazo del contrato</span>
                    <span>• Otros pactos acordados</span>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Legal notes */}
      <div
        className="card"
        style={{ padding: 20, marginTop: 20, borderLeft: '4px solid var(--accent)' }}
      >
        <h4 style={{ margin: '0 0 12px' }}>Normativa Aplicable</h4>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <p>
            <strong>Art. 9:</strong> El contrato de trabajo es consensual; debera constar por
            escrito en los plazos legales.
          </p>
          <p>
            <strong>Art. 10:</strong> Clausulas minimas obligatorias del contrato.
          </p>
          <p>
            <strong>Art. 159-160:</strong> Causales de terminacion del contrato (necesidades de la
            empresa, mutuo acuerdo, renuncia, despido).
          </p>
          <p>
            <strong>Art. 162:</strong> Obligacion de pago de cotizaciones al dia para validez del
            despido (Ley Bustos).
          </p>
          <p>
            <strong>Art. 163:</strong> Indemnizacion por anos de servicio: 30 dias de ultima
            remuneracion por cada ano, tope 330 dias (11 anos). Tope mensual: 90 UF.
          </p>
          <p>
            <strong>Art. 168:</strong> Recargo indemnizatorio por despido injustificado: 30% (art.
            161), 50% (art. 159 N°4-5-6), 80% (art. 160).
          </p>
        </div>
      </div>

      {contractEmployee && (
        <ContractModal employee={contractEmployee} onClose={() => setContractEmployee(null)} />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// REMUNERACIONES TAB
// ═════════════════════════════════════════════════════════════════
function RemuneracionesTab({ payroll, employees, month, year, onRefresh }: any) {
  const [calculating, setCalculating] = useState(false);

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      await api.calculatePayroll(month, year);
      onRefresh();
    } catch (err) {
      alert('Error al calcular nomina');
    }
    setCalculating(false);
  };

  const months = [
    '',
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  return (
    <div>
      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button onClick={handleCalculate} disabled={calculating} style={btnPrimary}>
          <Calculator size={16} /> {calculating ? 'Calculando...' : 'Calcular Nomina'}
        </button>
        <button style={btnSecondary}>
          <Download size={16} /> Exportar PDF
        </button>
      </div>

      {payroll.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <Calculator size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3>
            Sin liquidaciones para {months[month]} {year}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Presiona "Calcular Nomina" para generar las liquidaciones del periodo.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Summary */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
            }}
          >
            <StatCard
              icon={DollarSign}
              label="Total Bruto"
              value={`$${fmt(payroll.reduce((s: number, p: any) => s + p.grossSalary, 0))}`}
              color="#3b82f6"
            />
            <StatCard
              icon={Minus}
              label="Total Descuentos"
              value={`$${fmt(payroll.reduce((s: number, p: any) => s + p.totalDeductions, 0))}`}
              color="#ef4444"
            />
            <StatCard
              icon={CreditCard}
              label="Total Liquido"
              value={`$${fmt(payroll.reduce((s: number, p: any) => s + p.netSalary, 0))}`}
              color="#22c55e"
            />
            <StatCard
              icon={Building}
              label="Costo Empresa"
              value={`$${fmt(payroll.reduce((s: number, p: any) => s + p.totalEmployerCost, 0))}`}
              color="#f59e0b"
            />
          </div>

          {/* Individual liquidaciones */}
          {payroll.map((record: PayrollRecord) => (
            <LiquidacionCard key={record.id} record={record} />
          ))}
        </div>
      )}

      {/* Legal info */}
      <div
        className="card"
        style={{ padding: 16, marginTop: 20, borderLeft: '4px solid var(--accent)' }}
      >
        <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Conceptos Legales de la Liquidacion</h4>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            lineHeight: 1.8,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 4,
          }}
        >
          <span>
            <strong>Gratificacion Legal:</strong> Art. 47 CT — 25% sueldo, tope 4.75 IMM/ano
          </span>
          <span>
            <strong>Horas Extra:</strong> Art. 32 CT — Recargo 50% sobre hora ordinaria
          </span>
          <span>
            <strong>Colacion:</strong> No imponible, no tributable
          </span>
          <span>
            <strong>Movilizacion:</strong> No imponible, no tributable
          </span>
          <span>
            <strong>AFP:</strong> 10% cotizacion obligatoria + comision variable
          </span>
          <span>
            <strong>Salud:</strong> 7% cotizacion legal minima
          </span>
          <span>
            <strong>AFC:</strong> Seguro de cesantia Ley 19.728
          </span>
          <span>
            <strong>Impuesto:</strong> Impuesto Unico de 2da Categoria, Art. 43 LIR
          </span>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// LIQUIDACION CARD
// ═════════════════════════════════════════════════════════════════
function LiquidacionCard({ record }: { record: PayrollRecord }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card" style={{ padding: 16 }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{record.employeeName}</div>
        </div>
        <div style={{ textAlign: 'right', marginRight: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Liquido</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-green)' }}>
            ${fmt(record.netSalary)}
          </div>
        </div>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: 12,
            fontSize: 10,
            fontWeight: 600,
            background:
              record.status === 'paid'
                ? 'rgba(34,197,94,0.15)'
                : record.status === 'approved'
                  ? 'rgba(59,130,246,0.15)'
                  : 'rgba(245,158,11,0.15)',
            color:
              record.status === 'paid'
                ? '#22c55e'
                : record.status === 'approved'
                  ? '#3b82f6'
                  : '#f59e0b',
          }}
        >
          {record.status === 'paid'
            ? 'Pagado'
            : record.status === 'approved'
              ? 'Aprobado'
              : 'Borrador'}
        </span>
        {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </div>

      {expanded && (
        <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Haberes */}
            <div>
              <h4
                style={{
                  margin: '0 0 8px',
                  fontSize: 13,
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                }}
              >
                Haberes
              </h4>
              <table style={{ width: '100%', fontSize: 13 }}>
                <tbody>
                  <tr>
                    <td>Sueldo Base</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      ${fmt(record.grossSalary)}
                    </td>
                  </tr>
                  <tr>
                    <td>Gratificacion Legal</td>
                    <td style={{ textAlign: 'right' }}>${fmt(record.gratificacion)}</td>
                  </tr>
                  {record.overtimeAmount > 0 && (
                    <tr>
                      <td>Horas Extra ({record.overtimeHours}h)</td>
                      <td style={{ textAlign: 'right' }}>${fmt(record.overtimeAmount)}</td>
                    </tr>
                  )}
                  {record.bonuses > 0 && (
                    <tr>
                      <td>Bonos</td>
                      <td style={{ textAlign: 'right' }}>${fmt(record.bonuses)}</td>
                    </tr>
                  )}
                  <tr style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ fontWeight: 600 }}>Total Imponible</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      ${fmt(record.totalHaberesImponibles)}
                    </td>
                  </tr>
                  {(record.colacion > 0 || record.movilizacion > 0) && (
                    <>
                      {record.colacion > 0 && (
                        <tr>
                          <td>Colacion</td>
                          <td style={{ textAlign: 'right' }}>${fmt(record.colacion)}</td>
                        </tr>
                      )}
                      {record.movilizacion > 0 && (
                        <tr>
                          <td>Movilizacion</td>
                          <td style={{ textAlign: 'right' }}>${fmt(record.movilizacion)}</td>
                        </tr>
                      )}
                      <tr style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ fontWeight: 600 }}>Total No Imponible</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          ${fmt(record.totalHaberesNoImponibles)}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Descuentos */}
            <div>
              <h4
                style={{
                  margin: '0 0 8px',
                  fontSize: 13,
                  color: '#ef4444',
                  textTransform: 'uppercase',
                }}
              >
                Descuentos
              </h4>
              <table style={{ width: '100%', fontSize: 13 }}>
                <tbody>
                  <tr>
                    <td>AFP</td>
                    <td style={{ textAlign: 'right', color: '#ef4444' }}>
                      -${fmt(record.afpEmployee)}
                    </td>
                  </tr>
                  <tr>
                    <td>Salud</td>
                    <td style={{ textAlign: 'right', color: '#ef4444' }}>
                      -${fmt(record.healthEmployee)}
                    </td>
                  </tr>
                  <tr>
                    <td>AFC</td>
                    <td style={{ textAlign: 'right', color: '#ef4444' }}>
                      -${fmt(record.afcEmployee)}
                    </td>
                  </tr>
                  <tr>
                    <td>Impuesto Unico</td>
                    <td style={{ textAlign: 'right', color: '#ef4444' }}>
                      -${fmt(record.taxAmount)}
                    </td>
                  </tr>
                  <tr style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ fontWeight: 600 }}>Total Descuentos</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>
                      -${fmt(record.totalDeductions)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: 'var(--bg-tertiary)',
              borderRadius: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>SUELDO LIQUIDO</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-green)' }}>
                ${fmt(record.netSalary)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>COSTO EMPRESA</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>${fmt(record.totalEmployerCost)}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                (SIS: ${fmt(record.afpEmployer)} + AFC emp: ${fmt(record.afcEmployer)} + Mutual: $
                {fmt(record.mutualEmployer)})
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// PREVIRED TAB
// ═════════════════════════════════════════════════════════════════
function PreviredTab({
  data,
  month,
  year,
  onRefresh,
}: {
  data: PreviredData | null;
  month: number;
  year: number;
  onRefresh: () => void;
}) {
  const months = [
    '',
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  return (
    <div>
      <div
        className="card"
        style={{
          padding: 20,
          marginBottom: 20,
          background: 'linear-gradient(135deg, #1e3a5f, #2d62c8)',
          color: '#fff',
          borderRadius: 16,
        }}
      >
        <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building size={20} /> Consolidado Previred — {months[month]} {year}
        </h3>
        <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>
          Resumen de cotizaciones previsionales para declaracion y pago en previred.com. Plazo:
          hasta el dia 13 del mes siguiente.
        </p>
      </div>

      {!data || !data.employees?.length ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <Building size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3>Sin datos de Previred</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Primero calcula la nomina del periodo en la pestana "Remuneraciones".
          </p>
        </div>
      ) : (
        <>
          {/* Totals */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <StatCard
              icon={Building}
              label="Total AFP"
              value={`$${fmt(data.totals.totalAfp)}`}
              color="#3b82f6"
            />
            <StatCard
              icon={Shield}
              label="Total Salud"
              value={`$${fmt(data.totals.totalHealth)}`}
              color="#22c55e"
            />
            <StatCard
              icon={Users}
              label="AFC Trabajador"
              value={`$${fmt(data.totals.totalAfcEmployee)}`}
              color="#f59e0b"
            />
            <StatCard
              icon={Building}
              label="AFC Empleador"
              value={`$${fmt(data.totals.totalAfcEmployer)}`}
              color="#8b5cf6"
            />
            <StatCard
              icon={Shield}
              label="SIS"
              value={`$${fmt(data.totals.totalSis)}`}
              color="#ec4899"
            />
            <StatCard
              icon={AlertTriangle}
              label="Mutual"
              value={`$${fmt(data.totals.totalMutual)}`}
              color="#6366f1"
            />
          </div>

          {/* Detail table */}
          <div className="card" style={{ padding: 16, overflow: 'auto' }}>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  <th style={thStyle}>RUT</th>
                  <th style={thStyle}>Nombre</th>
                  <th style={thStyle}>AFP</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Monto AFP</th>
                  <th style={thStyle}>Salud</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Monto Salud</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>AFC Trab.</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>AFC Emp.</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>SIS</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Mutual</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Renta Imp.</th>
                </tr>
              </thead>
              <tbody>
                {data.employees.map((emp, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={tdStyle}>{emp.rut}</td>
                    <td style={tdStyle}>{emp.name}</td>
                    <td style={tdStyle}>{emp.afp}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(emp.afpAmount)}</td>
                    <td style={tdStyle}>{emp.healthSystem}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(emp.healthAmount)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(emp.afcEmployee)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(emp.afcEmployer)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(emp.sis)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(emp.mutual)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>
                      ${fmt(emp.taxableIncome)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button style={btnPrimary}>
              <Download size={16} /> Descargar Planilla Previred
            </button>
            <button
              style={btnSecondary}
              onClick={() => window.open('https://www.previred.com', '_blank')}
            >
              <Globe size={16} /> Ir a Previred.com
            </button>
          </div>

          {/* Instructions */}
          <div
            className="card"
            style={{ padding: 16, marginTop: 20, borderLeft: '4px solid #f59e0b' }}
          >
            <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Pasos para Pagar en Previred</h4>
            <ol
              style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 2, paddingLeft: 20 }}
            >
              <li>
                Ingresa a <strong>previred.com</strong> con tus credenciales de empleador
              </li>
              <li>Selecciona "Declaracion y Pago de Cotizaciones"</li>
              <li>Sube la planilla generada o ingresa los datos manualmente</li>
              <li>Verifica que los montos coincidan con esta pantalla</li>
              <li>Selecciona medio de pago (PAC, transferencia, tarjeta)</li>
              <li>Confirma y guarda el comprobante de pago</li>
              <li>
                <strong>Plazo limite:</strong> Dia 13 del mes siguiente al periodo
              </li>
            </ol>
          </div>
        </>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// GASTOS OPERACIONALES TAB
// ═════════════════════════════════════════════════════════════════
function GastosTab({ expenses, month, year, onRefresh, showAdd, setShowAdd }: any) {
  const [form, setForm] = useState<any>({
    category: 'suscripcion',
    description: '',
    amountClp: 0,
    amountUsd: null,
    providerName: '',
    providerRut: '',
    documentNumber: '',
    documentType: 'factura',
    taxDeductible: true,
    ivaAmount: null,
    periodMonth: month,
    periodYear: year,
    recurring: false,
    recurringFrequency: 'monthly',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.createExpense(form);
      setShowAdd(false);
      onRefresh();
    } catch {
      alert('Error al guardar gasto');
    }
    setSaving(false);
  };

  const totalByCategory = expenses.reduce(
    (acc: any, exp: OperationalExpense) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amountClp;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalExpenses = expenses.reduce((s: number, e: OperationalExpense) => s + e.amountClp, 0);
  const totalIva = expenses.reduce((s: number, e: OperationalExpense) => s + (e.ivaAmount || 0), 0);
  const totalDeductible = expenses
    .filter((e: OperationalExpense) => e.taxDeductible)
    .reduce((s: number, e: OperationalExpense) => s + e.amountClp, 0);

  return (
    <div>
      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <StatCard
          icon={Receipt}
          label="Total Gastos"
          value={`$${fmt(totalExpenses)}`}
          color="#ef4444"
        />
        <StatCard
          icon={Calculator}
          label="IVA Credito Fiscal"
          value={`$${fmt(totalIva)}`}
          color="#3b82f6"
        />
        <StatCard
          icon={CheckCircle}
          label="Total Deducible"
          value={`$${fmt(totalDeductible)}`}
          color="#22c55e"
        />
        <StatCard icon={FileText} label="N° Gastos" value={expenses.length} color="#8b5cf6" />
      </div>

      {/* Add button */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => {
            setForm({ ...form, periodMonth: month, periodYear: year });
            setShowAdd(true);
          }}
          style={btnPrimary}
        >
          <Plus size={16} /> Agregar Gasto
        </button>
        <button style={btnSecondary}>
          <Download size={16} /> Exportar Excel
        </button>
      </div>

      {/* By Category */}
      {Object.keys(totalByCategory).length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Gastos por Categoria</h4>
          {Object.entries(totalByCategory)
            .sort(([, a]: any, [, b]: any) => b - a)
            .map(([cat, amount]: any) => (
              <div
                key={cat}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <span style={{ flex: 1, fontSize: 13 }}>
                  {EXPENSE_CATEGORIES.find((c) => c.value === cat)?.label || cat}
                </span>
                <span style={{ fontWeight: 700, fontSize: 14 }}>${fmt(amount)}</span>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    width: 50,
                    textAlign: 'right',
                  }}
                >
                  {totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0}%
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Expenses List */}
      <div style={{ display: 'grid', gap: 8 }}>
        {expenses.map((exp: OperationalExpense) => (
          <div
            key={exp.id}
            className="card"
            style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}
          >
            <Receipt size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{exp.description}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {EXPENSE_CATEGORIES.find((c) => c.value === exp.category)?.label} •{' '}
                {exp.providerName} • {exp.documentType} #{exp.documentNumber}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>${fmt(exp.amountClp)}</div>
              {exp.ivaAmount && (
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  IVA: ${fmt(exp.ivaAmount)}
                </div>
              )}
            </div>
            {exp.taxDeductible && (
              <span
                style={{
                  padding: '3px 8px',
                  borderRadius: 12,
                  background: 'rgba(34,197,94,0.15)',
                  color: '#22c55e',
                  fontSize: 10,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                DEDUCIBLE
              </span>
            )}
            {exp.recurring && (
              <span
                style={{
                  padding: '3px 8px',
                  borderRadius: 12,
                  background: 'rgba(59,130,246,0.15)',
                  color: '#3b82f6',
                  fontSize: 10,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                RECURRENTE
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Suggested expenses for tech company */}
      {expenses.length === 0 && (
        <div
          className="card"
          style={{ padding: 20, marginTop: 16, borderLeft: '4px solid var(--accent)' }}
        >
          <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>
            Gastos Comunes para Empresas de Tecnologia
          </h4>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 2 }}>
            <p>
              <strong>Suscripciones:</strong> Vercel, Render, GitHub, Anthropic API, Google Cloud,
              dominios, Figma
            </p>
            <p>
              <strong>Infraestructura:</strong> Hosting, bases de datos, CDN, certificados SSL
            </p>
            <p>
              <strong>Arriendo:</strong> Oficina, cowork, o espacio en casa (proporcional)
            </p>
            <p>
              <strong>Servicios:</strong> Internet, electricidad (proporcional si es home office)
            </p>
            <p>
              <strong>Legal:</strong> Abogado, notaria, escrituras, registro de marca
            </p>
            <p>
              <strong>Contabilidad:</strong> Contador, software contable, declaraciones
            </p>
            <p>
              <strong>Marketing:</strong> Google Ads, redes sociales, diseno
            </p>
            <p>
              <strong>Equipamiento:</strong> Computadores, monitores, perifericos (depreciacion)
            </p>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 600, maxHeight: '90vh', overflow: 'auto', padding: 28 }}
          >
            <h2 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Receipt size={22} /> Registrar Gasto
            </h2>

            <div style={grid2}>
              <SelectField
                label="Categoria"
                value={form.category}
                onChange={(v) => setForm({ ...form, category: v })}
                options={EXPENSE_CATEGORIES}
              />
              <FormField
                label="Descripcion"
                value={form.description}
                onChange={(v) => setForm({ ...form, description: v })}
                required
              />
              <FormField
                label="Monto CLP"
                value={form.amountClp}
                onChange={(v) => setForm({ ...form, amountClp: Number(v) })}
                type="number"
                required
              />
              <FormField
                label="Monto USD (opcional)"
                value={form.amountUsd || ''}
                onChange={(v) => setForm({ ...form, amountUsd: v ? Number(v) : null })}
                type="number"
              />
              <FormField
                label="Proveedor"
                value={form.providerName}
                onChange={(v) => setForm({ ...form, providerName: v })}
              />
              <FormField
                label="RUT Proveedor"
                value={form.providerRut}
                onChange={(v) => setForm({ ...form, providerRut: v })}
                placeholder="76.xxx.xxx-x"
              />
              <SelectField
                label="Tipo Documento"
                value={form.documentType}
                onChange={(v) => setForm({ ...form, documentType: v })}
                options={[
                  { value: 'factura', label: 'Factura Electronica' },
                  { value: 'boleta', label: 'Boleta' },
                  { value: 'boleta_honorarios', label: 'Boleta de Honorarios' },
                  { value: 'recibo', label: 'Recibo/Comprobante' },
                  { value: 'nota_credito', label: 'Nota de Credito' },
                ]}
              />
              <FormField
                label="N° Documento"
                value={form.documentNumber}
                onChange={(v) => setForm({ ...form, documentNumber: v })}
              />
              <FormField
                label="IVA (CLP)"
                value={form.ivaAmount || ''}
                onChange={(v) => setForm({ ...form, ivaAmount: v ? Number(v) : null })}
                type="number"
              />
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={form.taxDeductible}
                  onChange={(e) => setForm({ ...form, taxDeductible: e.target.checked })}
                />
                Deducible de impuestos
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={form.recurring}
                  onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
                />
                Gasto recurrente
              </label>
            </div>

            {form.recurring && (
              <SelectField
                label="Frecuencia"
                value={form.recurringFrequency}
                onChange={(v) => setForm({ ...form, recurringFrequency: v })}
                options={[
                  { value: 'monthly', label: 'Mensual' },
                  { value: 'quarterly', label: 'Trimestral' },
                  { value: 'yearly', label: 'Anual' },
                ]}
              />
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAdd(false)} style={btnSecondary}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} style={btnPrimary}>
                {saving ? 'Guardando...' : 'Guardar Gasto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// IMPUESTOS / F129 TAB
// ═════════════════════════════════════════════════════════════════
function ImpuestosTab({
  expenses,
  year,
  month,
}: {
  expenses: OperationalExpense[];
  year: number;
  month: number;
}) {
  const totalIngresos = 0; // Would come from payment data
  const totalGastos = expenses.reduce((s, e) => s + e.amountClp, 0);
  const totalIvaCredito = expenses.reduce((s, e) => s + (e.ivaAmount || 0), 0);
  const totalDeducible = expenses
    .filter((e) => e.taxDeductible)
    .reduce((s, e) => s + e.amountClp, 0);

  return (
    <div>
      <div
        className="card"
        style={{
          padding: 20,
          marginBottom: 20,
          background: 'linear-gradient(135deg, #1a2332, #2d62c8)',
          color: '#fff',
          borderRadius: 16,
        }}
      >
        <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calculator size={20} /> Centro Tributario — {year}
        </h3>
        <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>
          Consolidacion de ingresos y gastos para declaraciones mensuales (F29) y anuales (F22) ante
          el SII.
        </p>
      </div>

      {/* F29 Monthly */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3
          style={{
            margin: '0 0 16px',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <FileText size={18} /> Formulario 29 — Declaracion Mensual de IVA
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12 }}>
            <h4
              style={{
                margin: '0 0 12px',
                fontSize: 13,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}
            >
              Debitos (Ventas)
            </h4>
            <table style={{ width: '100%', fontSize: 13 }}>
              <tbody>
                <tr>
                  <td>Ventas con boleta</td>
                  <td style={{ textAlign: 'right' }}>$0</td>
                </tr>
                <tr>
                  <td>Ventas con factura</td>
                  <td style={{ textAlign: 'right' }}>$0</td>
                </tr>
                <tr>
                  <td>Ventas de exportacion</td>
                  <td style={{ textAlign: 'right' }}>$0</td>
                </tr>
                <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                  <td>Total Debito IVA (19%)</td>
                  <td style={{ textAlign: 'right' }}>$0</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12 }}>
            <h4
              style={{
                margin: '0 0 12px',
                fontSize: 13,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}
            >
              Creditos (Compras)
            </h4>
            <table style={{ width: '100%', fontSize: 13 }}>
              <tbody>
                <tr>
                  <td>Compras con factura</td>
                  <td style={{ textAlign: 'right' }}>${fmt(totalGastos)}</td>
                </tr>
                <tr>
                  <td>IVA Credito Fiscal</td>
                  <td style={{ textAlign: 'right', color: '#22c55e' }}>${fmt(totalIvaCredito)}</td>
                </tr>
                <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                  <td>Total Credito IVA</td>
                  <td style={{ textAlign: 'right', color: '#22c55e' }}>${fmt(totalIvaCredito)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            padding: 16,
            background: 'var(--bg-tertiary)',
            borderRadius: 12,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
            IVA A PAGAR / (A FAVOR)
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: totalIvaCredito > 0 ? '#22c55e' : 'var(--text-primary)',
            }}
          >
            ${fmt(Math.abs(0 - totalIvaCredito))} {totalIvaCredito > 0 ? '(Remanente a favor)' : ''}
          </div>
        </div>
      </div>

      {/* F129 */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3
          style={{
            margin: '0 0 16px',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <FileText size={18} /> Formulario 129 — Compras y Ventas
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          El F129 es un anexo del F29 donde se detallan las compras y ventas del periodo. Se genera
          automaticamente con los gastos registrados.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={thStyle}>Tipo</th>
                <th style={thStyle}>RUT Proveedor</th>
                <th style={thStyle}>Proveedor</th>
                <th style={thStyle}>Documento</th>
                <th style={thStyle}>N°</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Neto</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>IVA</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={tdStyle}>Compra</td>
                  <td style={tdStyle}>{exp.providerRut || '-'}</td>
                  <td style={tdStyle}>{exp.providerName}</td>
                  <td style={tdStyle}>{exp.documentType}</td>
                  <td style={tdStyle}>{exp.documentNumber}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    ${fmt(exp.amountClp - (exp.ivaAmount || 0))}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(exp.ivaAmount || 0)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>
                    ${fmt(exp.amountClp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* F22 Annual */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3
          style={{
            margin: '0 0 16px',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <FileText size={18} /> Formulario 22 — Renta Anual (Abril)
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          La declaracion de renta anual se presenta en abril. Aqui se consolidan los ingresos y
          gastos del ano anterior.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <h4 style={{ fontSize: 13, margin: '0 0 8px' }}>Regimen Tributario Recomendado</h4>
            <div className="card" style={{ padding: 12, background: 'var(--bg-tertiary)' }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                Pro Pyme General (14D N°3)
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                <p>Tasa: 25% sobre renta liquida imponible</p>
                <p>Beneficio: Depreciacion instantanea de activos fijos</p>
                <p>PPM (Pago Provisional Mensual): 0.25% de ventas</p>
                <p>Ideal para empresas con ventas &lt; 75,000 UF anuales</p>
              </div>
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: 13, margin: '0 0 8px' }}>Gastos Deducibles Anuales</h4>
            <div className="card" style={{ padding: 12, background: 'var(--bg-tertiary)' }}>
              <table style={{ width: '100%', fontSize: 12 }}>
                <tbody>
                  <tr>
                    <td>Remuneraciones</td>
                    <td style={{ textAlign: 'right' }}>$0</td>
                  </tr>
                  <tr>
                    <td>Cotizaciones previsionales</td>
                    <td style={{ textAlign: 'right' }}>$0</td>
                  </tr>
                  <tr>
                    <td>Gastos operacionales</td>
                    <td style={{ textAlign: 'right' }}>${fmt(totalDeducible)}</td>
                  </tr>
                  <tr>
                    <td>Depreciacion activos</td>
                    <td style={{ textAlign: 'right' }}>$0</td>
                  </tr>
                  <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                    <td>Total Gastos Deducibles</td>
                    <td style={{ textAlign: 'right' }}>${fmt(totalDeducible)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Deadlines */}
      <div className="card" style={{ padding: 16, borderLeft: '4px solid #f59e0b' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Plazos Tributarios Importantes</h4>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 2 }}>
          <p>
            <strong>Dia 12 de cada mes:</strong> Declaracion y pago F29 (IVA + PPM + retenciones)
          </p>
          <p>
            <strong>Dia 13 de cada mes:</strong> Pago cotizaciones en Previred
          </p>
          <p>
            <strong>Abril:</strong> Declaracion de Renta Anual (F22)
          </p>
          <p>
            <strong>Marzo:</strong> Declaraciones Juradas (DJ 1887 remuneraciones, DJ 1879
            honorarios)
          </p>
          <p>
            <strong>Permanente:</strong> Emision de DTE (Documentos Tributarios Electronicos) en
            sii.cl
          </p>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// DOCUMENT GENERATORS — Chilean Labor Law
// ═════════════════════════════════════════════════════════════════

const openDoc = (html: string) => {
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }
};

const DOC_STYLES = `
  @page { size: letter; margin: 2.5cm 3cm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.8; color: #000; }
  h1 { text-align: center; font-size: 16pt; margin-bottom: 24pt; text-transform: uppercase; letter-spacing: 2px; }
  h2 { font-size: 12pt; margin: 18pt 0 6pt; text-transform: uppercase; }
  p { text-align: justify; margin-bottom: 12pt; }
  .clause { margin-bottom: 16pt; page-break-inside: avoid; }
  .signatures { margin-top: 60pt; display: flex; justify-content: space-between; }
  .sig-block { text-align: center; width: 30%; }
  .sig-line { border-top: 1px solid #000; margin-top: 60pt; padding-top: 6pt; }
  .header-info { text-align: center; margin-bottom: 30pt; font-size: 10pt; color: #555; }
  .legal-ref { font-size: 9pt; color: #666; font-style: italic; }
  table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
  th, td { padding: 6pt 10pt; text-align: left; border-bottom: 1px solid #ccc; font-size: 11pt; }
  th { font-weight: 700; background: #f5f5f5; }
  td.amount { text-align: right; font-family: 'Courier New', monospace; }
  tr.total td { border-top: 2px solid #000; font-weight: 800; font-size: 12pt; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
`;

function generateFiniquitoHTML(
  emp: Employee,
  result: any,
  causalLabel: string,
  pendingVacationDays: number,
  avisoPrevio: boolean
): string {
  const today = new Date();
  const dateStr = today.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const hireDate = new Date(emp.hireDate).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const terminationDate = dateStr;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Finiquito - ${emp.firstName} ${emp.lastName}</title>
<style>${DOC_STYLES}</style>
</head><body>
<div class="header-info">CONNIKU SpA<br/>RUT: 77.XXX.XXX-X<br/>Santiago, Chile</div>
<h1>Finiquito de Contrato de Trabajo</h1>
<p class="legal-ref" style="text-align: center; margin-bottom: 24pt;">Conforme al Articulo 177 del Codigo del Trabajo</p>

<div class="clause">
<h2>PRIMERO: Partes</h2>
<p>En Santiago, a ${dateStr}, entre <strong>CONNIKU SpA</strong>, RUT 77.XXX.XXX-X, representada legalmente para estos efectos, en adelante "el Empleador"; y don(a) <strong>${emp.firstName} ${emp.lastName}</strong>, RUT ${emp.rut}, de nacionalidad ${emp.nationality}, domiciliado(a) en ${emp.address}, en adelante "el Trabajador", se celebra el presente finiquito de contrato de trabajo.</p>
</div>

<div class="clause">
<h2>SEGUNDO: Antecedentes de la Relacion Laboral</h2>
<p>El Trabajador presto servicios para el Empleador desde el <strong>${hireDate}</strong>, desempenandose como <strong>${emp.position}</strong> en el departamento de <strong>${emp.department}</strong>, con un contrato de tipo <strong>${emp.contractType}</strong>.</p>
<p>La ultima remuneracion mensual bruta fue de <strong>$${fmt(emp.grossSalary)}</strong>.</p>
</div>

<div class="clause">
<h2>TERCERO: Causal de Termino</h2>
<p>El contrato de trabajo termina por la siguiente causal: <strong>${causalLabel}</strong>.</p>
<p>La fecha de termino efectivo de la relacion laboral es el <strong>${terminationDate}</strong>.</p>
</div>

<div class="clause">
<h2>CUARTO: Desglose de Pagos</h2>
<p>El Empleador pagara al Trabajador las siguientes sumas, a titulo de finiquito:</p>
<table>
<thead>
<tr><th>Concepto</th><th style="text-align: right;">Monto (CLP)</th></tr>
</thead>
<tbody>
${result.indemnizacionAnos > 0 ? `<tr><td>Indemnizacion por anos de servicio (${result.yearsApplied} anos, tope 11 — Art. 163 CT)</td><td class="amount">$${fmt(result.indemnizacionAnos)}</td></tr>` : ''}
${result.indemnizacionAviso > 0 ? `<tr><td>Indemnizacion sustitutiva del aviso previo (1 mes — Art. 161 inc. 2 CT)</td><td class="amount">$${fmt(result.indemnizacionAviso)}</td></tr>` : ''}
${result.recargo > 0 ? `<tr><td>Recargo legal (${result.recargoPercent}% — Art. 168 CT)</td><td class="amount">$${fmt(result.recargo)}</td></tr>` : ''}
<tr><td>Vacaciones proporcionales (${pendingVacationDays} dias — Art. 73 CT)</td><td class="amount">$${fmt(result.vacaciones)}</td></tr>
<tr><td>Gratificacion proporcional (Art. 50 CT)</td><td class="amount">$${fmt(result.gratificacionProp)}</td></tr>
<tr><td>Dias trabajados del mes en curso</td><td class="amount">$${fmt(result.diasTrabajados)}</td></tr>
<tr class="total"><td>TOTAL BRUTO FINIQUITO</td><td class="amount">$${fmt(result.totalBruto)}</td></tr>
</tbody>
</table>
</div>

<div class="clause">
<h2>QUINTO: Estado de Cotizaciones Previsionales</h2>
<p>El Empleador declara que las cotizaciones previsionales del Trabajador se encuentran <strong>integramente pagadas</strong> hasta el ultimo dia trabajado, incluyendo AFP (${emp.afp}), salud (${emp.healthSystem === 'fonasa' ? 'Fonasa' : 'Isapre ' + (emp.isapreName || '')}), y Seguro de Cesantia (AFC).</p>
<p class="legal-ref">Conforme al Art. 162 incisos 5, 6 y 7 del Codigo del Trabajo (Ley Bustos), el despido es nulo si las cotizaciones previsionales no se encuentran al dia. El empleador debera acompanar los certificados de la AFP, Fonasa/Isapre y AFC que acrediten el pago integro.</p>
</div>

<div class="clause">
<h2>SEXTO: Declaraciones</h2>
<p>El Trabajador declara que recibe a su entera satisfaccion las sumas indicadas en la clausula CUARTO y que no tiene reclamo alguno que formular en contra del Empleador por concepto de remuneraciones, horas extraordinarias, gratificaciones, feriado, indemnizaciones ni ningun otro concepto derivado de la relacion laboral que por este acto termina.</p>
<p>No obstante lo anterior, el Trabajador se reserva el derecho a reclamar ante los Tribunales de Justicia las diferencias que pudieran existir, conforme a lo dispuesto en el articulo 177 inciso final del Codigo del Trabajo.</p>
</div>

<div class="clause">
<h2>SEPTIMO: Ratificacion</h2>
<p>El presente finiquito se firma ante Ministro de Fe, conforme lo exige el articulo 177 del Codigo del Trabajo, en tres ejemplares de identico tenor, quedando uno en poder de cada parte y el tercero en poder del Ministro de Fe.</p>
</div>

<div class="signatures">
  <div class="sig-block">
    <div class="sig-line">
      <strong>EL EMPLEADOR</strong><br/>
      CONNIKU SpA<br/>
      RUT: 77.XXX.XXX-X
    </div>
  </div>
  <div class="sig-block">
    <div class="sig-line">
      <strong>EL TRABAJADOR</strong><br/>
      ${emp.firstName} ${emp.lastName}<br/>
      RUT: ${emp.rut}
    </div>
  </div>
  <div class="sig-block">
    <div class="sig-line">
      <strong>MINISTRO DE FE</strong><br/>
      (Notario / Inspector del Trabajo /<br/>Presidente del Sindicato)
    </div>
  </div>
</div>

<div style="margin-top: 40pt; padding: 12pt; border: 1px solid #ccc; font-size: 9pt; color: #666; line-height: 1.6;">
<strong>Nota Legal — Art. 177 del Codigo del Trabajo:</strong> El finiquito debidamente ratificado por el trabajador ante un Inspector del Trabajo o un Notario Publico, o firmado por el trabajador y el presidente del sindicato, tendra merito ejecutivo respecto de las obligaciones pendientes que se hubieren consignado en el. El finiquito no puede ser firmado con anterioridad a la fecha de termino de la relacion laboral.
</div>
</body></html>`;
}

function generateCartaDespidoHTML(
  emp: Employee,
  causal: 'art159' | 'art161',
  hechos: string,
  fechaDespido: string
): string {
  const today = new Date();
  const dateStr = today.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const hireDate = new Date(emp.hireDate).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const plazo = causal === 'art161' ? '6 dias habiles' : '3 dias habiles';
  const causalText =
    causal === 'art161'
      ? 'Articulo 161 del Codigo del Trabajo — Necesidades de la empresa'
      : 'Articulo 159 del Codigo del Trabajo — Vencimiento del plazo convenido / Mutuo acuerdo / Conclusion de la obra';

  // Calculate years for indemnizacion (only for art161)
  const hire = new Date(emp.hireDate);
  const now = new Date();
  const yearsWorked = Math.min(
    Math.floor((now.getTime() - hire.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
    11
  );
  const topeMensual = 90 * CHILE_LABOR.UF.value;
  const salaryForCalc = Math.min(emp.grossSalary, topeMensual);
  const indemnizacionAnos = causal === 'art161' ? salaryForCalc * yearsWorked : 0;
  const indemnizacionAviso = causal === 'art161' ? salaryForCalc : 0;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Carta de Despido - ${emp.firstName} ${emp.lastName}</title>
<style>${DOC_STYLES}</style>
</head><body>
<div class="header-info">CONNIKU SpA<br/>RUT: 77.XXX.XXX-X<br/>Santiago, Chile</div>

<p style="text-align: right;">Santiago, ${dateStr}</p>

<p>
Senor(a)<br/>
<strong>${emp.firstName} ${emp.lastName}</strong><br/>
RUT: ${emp.rut}<br/>
${emp.address}<br/>
<strong>PRESENTE</strong>
</p>

<p><strong>REF: Comunicacion de termino de contrato de trabajo</strong></p>

<div class="clause">
<p>De mi consideracion:</p>
<p>Por medio de la presente, y en conformidad con lo dispuesto en el <strong>${causalText}</strong>, comunico a usted que se ha resuelto poner termino a su contrato de trabajo, con efectos a contar del <strong>${fechaDespido || dateStr}</strong>.</p>
</div>

<div class="clause">
<h2>Antecedentes de la Relacion Laboral</h2>
<p>Usted presta servicios para CONNIKU SpA desde el <strong>${hireDate}</strong>, desempenandose como <strong>${emp.position}</strong> en el departamento de <strong>${emp.department}</strong>.</p>
</div>

<div class="clause">
<h2>Causal Invocada</h2>
<p>La causal de termino invocada es: <strong>${causalText}</strong>.</p>
</div>

<div class="clause">
<h2>Hechos que Fundamentan la Causal</h2>
<p>${hechos || '[Describir los hechos concretos que fundamentan la causal de termino invocada]'}</p>
</div>

${
  causal === 'art161'
    ? `
<div class="clause">
<h2>Indemnizaciones Ofrecidas</h2>
<p>En virtud de lo dispuesto en los articulos 162 y 163 del Codigo del Trabajo, se ofrecen las siguientes indemnizaciones:</p>
<table>
<tbody>
<tr><td>Indemnizacion por anos de servicio (${yearsWorked} anos, tope 11)</td><td class="amount">$${fmt(indemnizacionAnos)}</td></tr>
<tr><td>Indemnizacion sustitutiva del aviso previo (1 mes)</td><td class="amount">$${fmt(indemnizacionAviso)}</td></tr>
<tr class="total"><td>Total Indemnizaciones</td><td class="amount">$${fmt(indemnizacionAnos + indemnizacionAviso)}</td></tr>
</tbody>
</table>
<p class="legal-ref">Nota: Las indemnizaciones se calculan con tope de 90 UF mensual ($${fmt(topeMensual)}) y maximo 11 anos de servicio (Art. 163 y 172 CT).</p>
</div>
`
    : `
<div class="clause">
<h2>Indemnizaciones</h2>
<p>Atendida la causal invocada (Art. 159), no corresponde el pago de indemnizacion por anos de servicio ni indemnizacion sustitutiva del aviso previo, salvo pacto en contrario.</p>
</div>
`
}

<div class="clause">
<h2>Estado de Cotizaciones Previsionales</h2>
<p>Se deja constancia que las cotizaciones previsionales del trabajador se encuentran <strong>integramente pagadas</strong> hasta el ultimo dia trabajado, conforme al articulo 162 incisos 5, 6 y 7 del Codigo del Trabajo (Ley Bustos). Se adjuntan los certificados correspondientes de AFP, salud y AFC.</p>
</div>

<p>Sin otro particular, le saluda atentamente,</p>

<div style="margin-top: 80pt; width: 40%;">
  <div class="sig-line">
    <strong>CONNIKU SpA</strong><br/>
    Representante Legal<br/>
    RUT: 77.XXX.XXX-X
  </div>
</div>

<div style="margin-top: 40pt; padding: 12pt; border: 1px solid #ccc; font-size: 9pt; color: #666; line-height: 1.6;">
<strong>Nota Legal — Art. 162 del Codigo del Trabajo:</strong><br/>
• Esta carta debe ser entregada personalmente o enviada por correo certificado al domicilio del trabajador dentro de los <strong>${plazo}</strong> siguientes a la separacion del trabajador.<br/>
• Se debe enviar <strong>copia a la Inspeccion del Trabajo</strong> respectiva dentro del mismo plazo.<br/>
• Si las cotizaciones previsionales no se encuentran al dia, el despido sera <strong>nulo</strong> y el empleador debera seguir pagando las remuneraciones hasta la convalidacion del despido (Ley Bustos).<br/>
• El trabajador podra recurrir al Juzgado del Trabajo dentro de los 60 dias habiles siguientes al despido si considera que este es injustificado, indebido o improcedente (Art. 168 CT).
</div>

<div style="margin-top: 20pt; font-size: 9pt; color: #999; text-align: center;">
c.c.: Inspeccion del Trabajo — Carpeta personal del trabajador
</div>
</body></html>`;
}

function generateCartaAmonestacionHTML(
  emp: Employee,
  tipo: string,
  descripcion: string,
  fecha: string,
  articuloRI: string
): string {
  const today = new Date();
  const dateStr = today.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const tipoLabel =
    tipo === 'verbal'
      ? 'Amonestacion Verbal (registro interno)'
      : tipo === 'escrita'
        ? 'Amonestacion Escrita'
        : 'Amonestacion Escrita con Copia a la Direccion del Trabajo';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Carta de Amonestacion - ${emp.firstName} ${emp.lastName}</title>
<style>${DOC_STYLES}</style>
</head><body>
<div class="header-info">CONNIKU SpA<br/>RUT: 77.XXX.XXX-X<br/>Santiago, Chile</div>
<h1>Carta de Amonestacion</h1>

<p style="text-align: right;">Santiago, ${dateStr}</p>

<div class="clause">
<h2>Datos del Trabajador</h2>
<table>
<tbody>
<tr><td><strong>Nombre</strong></td><td>${emp.firstName} ${emp.lastName}</td></tr>
<tr><td><strong>RUT</strong></td><td>${emp.rut}</td></tr>
<tr><td><strong>Cargo</strong></td><td>${emp.position}</td></tr>
<tr><td><strong>Departamento</strong></td><td>${emp.department}</td></tr>
<tr><td><strong>Fecha de Ingreso</strong></td><td>${new Date(emp.hireDate).toLocaleDateString('es-CL')}</td></tr>
</tbody>
</table>
</div>

<div class="clause">
<h2>Tipo de Amonestacion</h2>
<p><strong>${tipoLabel}</strong></p>
</div>

<div class="clause">
<h2>Fecha del Incumplimiento</h2>
<p>${fecha || dateStr}</p>
</div>

<div class="clause">
<h2>Descripcion de los Hechos</h2>
<p>${descripcion || '[Describir detalladamente los hechos que motivan la presente amonestacion, incluyendo fecha, hora, lugar y circunstancias]'}</p>
</div>

${
  articuloRI
    ? `
<div class="clause">
<h2>Norma Infringida</h2>
<p>Los hechos descritos constituyen una infraccion al <strong>Articulo ${articuloRI} del Reglamento Interno de Orden, Higiene y Seguridad</strong> de CONNIKU SpA.</p>
</div>
`
    : ''
}

<div class="clause">
<h2>Consecuencias</h2>
<p>Se deja constancia que la reiteracion de conductas como la descrita podra dar lugar a la aplicacion de medidas disciplinarias de mayor gravedad, incluyendo la eventual terminacion del contrato de trabajo por <strong>incumplimiento grave de las obligaciones que impone el contrato</strong>, conforme al articulo 160 N°7 del Codigo del Trabajo.</p>
<p class="legal-ref">Nota: Si bien el Codigo del Trabajo no regula expresamente las amonestaciones, la jurisprudencia laboral ha reconocido que constituyen evidencia valida ante una eventual necesidad de invocar la causal del Art. 160 N°7. Se recomienda acumular al menos 3 amonestaciones escritas antes de proceder al despido por esta causal.</p>
</div>

<div class="signatures" style="justify-content: space-around;">
  <div class="sig-block">
    <div class="sig-line">
      <strong>EL EMPLEADOR</strong><br/>
      CONNIKU SpA<br/>
      Representante Legal
    </div>
  </div>
  <div class="sig-block">
    <div class="sig-line">
      <strong>EL TRABAJADOR</strong><br/>
      ${emp.firstName} ${emp.lastName}<br/>
      RUT: ${emp.rut}<br/>
      <span style="font-size: 9pt; color: #666;">(Acuse de recibo — no implica aceptacion de los hechos)</span>
    </div>
  </div>
</div>

${
  tipo === 'con_copia_dt'
    ? `
<div style="margin-top: 30pt; font-size: 9pt; color: #999; text-align: center;">
c.c.: Inspeccion del Trabajo — Carpeta personal del trabajador
</div>
`
    : ''
}
</body></html>`;
}

function generateCertificadoHTML(
  emp: Employee,
  tipo: 'antiguedad' | 'remuneraciones' | 'vacaciones'
): string {
  const today = new Date();
  const dateStr = today.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const hireDate = new Date(emp.hireDate);
  const hireDateStr = hireDate.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const diffMs = today.getTime() - hireDate.getTime();
  const yearsWorked = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
  const monthsExtra = Math.floor(
    (diffMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000)
  );

  let titulo = '';
  let contenido = '';

  if (tipo === 'antiguedad') {
    titulo = 'Certificado de Antiguedad Laboral';
    contenido = `
<div class="clause">
<p>Por medio del presente, <strong>CONNIKU SpA</strong>, RUT 77.XXX.XXX-X, certifica que don(a) <strong>${emp.firstName} ${emp.lastName}</strong>, RUT ${emp.rut}, presta servicios para esta empresa desde el <strong>${hireDateStr}</strong>, desempenandose actualmente como <strong>${emp.position}</strong> en el departamento de <strong>${emp.department}</strong>.</p>
<p>A la fecha del presente certificado, el trabajador cuenta con una antiguedad de <strong>${yearsWorked} anos y ${monthsExtra} meses</strong> de servicio continuo.</p>
<p>Su contrato de trabajo es de tipo <strong>${emp.contractType}</strong>, con una jornada de <strong>${emp.weeklyHours} horas semanales</strong>.</p>
<p>Se extiende el presente certificado a solicitud del interesado, para los fines que estime convenientes.</p>
</div>`;
  } else if (tipo === 'remuneraciones') {
    titulo = 'Certificado de Remuneraciones';
    const mes1 = new Date(today.getFullYear(), today.getMonth() - 1, 1).toLocaleDateString(
      'es-CL',
      { month: 'long', year: 'numeric' }
    );
    const mes2 = new Date(today.getFullYear(), today.getMonth() - 2, 1).toLocaleDateString(
      'es-CL',
      { month: 'long', year: 'numeric' }
    );
    const mes3 = new Date(today.getFullYear(), today.getMonth() - 3, 1).toLocaleDateString(
      'es-CL',
      { month: 'long', year: 'numeric' }
    );
    contenido = `
<div class="clause">
<p>Por medio del presente, <strong>CONNIKU SpA</strong>, RUT 77.XXX.XXX-X, certifica que don(a) <strong>${emp.firstName} ${emp.lastName}</strong>, RUT ${emp.rut}, presta servicios para esta empresa como <strong>${emp.position}</strong> y ha percibido las siguientes remuneraciones en los ultimos tres meses:</p>
<table>
<thead>
<tr><th>Periodo</th><th style="text-align: right;">Remuneracion Bruta</th><th style="text-align: right;">Colacion</th><th style="text-align: right;">Movilizacion</th></tr>
</thead>
<tbody>
<tr><td>${mes3}</td><td class="amount">$${fmt(emp.grossSalary)}</td><td class="amount">$${fmt(emp.colacion)}</td><td class="amount">$${fmt(emp.movilizacion)}</td></tr>
<tr><td>${mes2}</td><td class="amount">$${fmt(emp.grossSalary)}</td><td class="amount">$${fmt(emp.colacion)}</td><td class="amount">$${fmt(emp.movilizacion)}</td></tr>
<tr><td>${mes1}</td><td class="amount">$${fmt(emp.grossSalary)}</td><td class="amount">$${fmt(emp.colacion)}</td><td class="amount">$${fmt(emp.movilizacion)}</td></tr>
</tbody>
</table>
<p>Las remuneraciones indicadas corresponden al sueldo base bruto mensual pactado en el contrato de trabajo, mas las asignaciones de colacion y movilizacion (no imponibles).</p>
<p>Se extiende el presente certificado a solicitud del interesado, para los fines que estime convenientes.</p>
</div>`;
  } else if (tipo === 'vacaciones') {
    titulo = 'Constancia de Vacaciones';
    const diasBase = 15;
    const diasAcumulados = yearsWorked * diasBase;
    contenido = `
<div class="clause">
<p>Por medio del presente, <strong>CONNIKU SpA</strong>, RUT 77.XXX.XXX-X, deja constancia del registro de feriado anual (vacaciones) de don(a) <strong>${emp.firstName} ${emp.lastName}</strong>, RUT ${emp.rut}, quien presta servicios desde el <strong>${hireDateStr}</strong>.</p>

<h2>Detalle de Feriado Anual</h2>
<table>
<tbody>
<tr><td>Dias de feriado base anual (Art. 67 CT)</td><td class="amount">${diasBase} dias habiles</td></tr>
<tr><td>Anos de servicio</td><td class="amount">${yearsWorked} anos</td></tr>
<tr><td>Total dias acumulados (teorico)</td><td class="amount">${diasAcumulados} dias habiles</td></tr>
</tbody>
</table>

<p class="legal-ref">Conforme al Art. 67 del Codigo del Trabajo, todo trabajador con mas de un ano de servicio tiene derecho a un feriado anual de 15 dias habiles con remuneracion integra. El feriado podra acumularse hasta por dos periodos consecutivos (Art. 70). El trabajador cuyo contrato termine antes de completar el ano de servicio tiene derecho a la remuneracion por feriado proporcional (Art. 73).</p>
<p>Se extiende la presente constancia para los fines que el interesado estime convenientes.</p>
</div>`;
  }

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>${titulo} - ${emp.firstName} ${emp.lastName}</title>
<style>${DOC_STYLES}</style>
</head><body>
<div class="header-info">CONNIKU SpA<br/>RUT: 77.XXX.XXX-X<br/>Santiago, Chile</div>
<h1>${titulo}</h1>

<p style="text-align: right;">Santiago, ${dateStr}</p>

${contenido}

<div style="margin-top: 80pt; width: 40%;">
  <div class="sig-line">
    <strong>CONNIKU SpA</strong><br/>
    Representante Legal<br/>
    RUT: 77.XXX.XXX-X
  </div>
</div>
</body></html>`;
}

// ═════════════════════════════════════════════════════════════════
// INSPECCION DEL TRABAJO TAB
// ═════════════════════════════════════════════════════════════════
function InspeccionTrabajoTab({ employees }: { employees: Employee[] }) {
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));

  // Document generation state
  const [finiquitoEmp, setFiniquitoEmp] = useState<string>('');
  const [despidoEmp, setDespidoEmp] = useState<string>('');
  const [despidoHechos, setDespidoHechos] = useState('');
  const [amonestacionEmp, setAmonestacionEmp] = useState<string>('');
  const [amonestacionTipo, setAmonestacionTipo] = useState('escrita');
  const [amonestacionDesc, setAmonestacionDesc] = useState('');
  const [amonestacionArt, setAmonestacionArt] = useState('');
  const [certificadoEmp, setCertificadoEmp] = useState<string>('');

  const selectStyle: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 13,
    fontFamily: 'inherit',
  };
  const textareaStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 13,
    fontFamily: 'inherit',
    minHeight: 60,
    resize: 'vertical' as const,
  };
  const inputStyle: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 13,
    fontFamily: 'inherit',
  };

  const sections = [
    {
      title: 'Documentacion Obligatoria del Empleador',
      ref: 'Art. 9, 10, 154, 155 Codigo del Trabajo',
      items: [
        {
          key: 'contratos_firmados',
          label: 'Contratos de trabajo firmados y entregados al trabajador (copia)',
          ref: 'Art. 9 CT — Plazo: 15 dias (indefinido) o 5 dias (plazo fijo)',
        },
        {
          key: 'reglamento_interno',
          label:
            'Reglamento Interno de Orden, Higiene y Seguridad (obligatorio con 10+ trabajadores)',
          ref: 'Art. 153-157 CT',
        },
        {
          key: 'registro_asistencia',
          label: 'Registro de asistencia y control de jornada (reloj control o libro)',
          ref: 'Art. 33 CT — Obligatorio salvo Art. 22 inc. 2',
        },
        {
          key: 'libro_remuneraciones',
          label: 'Libro auxiliar de remuneraciones (timbrado por SII)',
          ref: 'Art. 62 CT',
        },
        {
          key: 'comprobantes_pago',
          label: 'Comprobantes de pago de remuneraciones (liquidaciones firmadas)',
          ref: 'Art. 54 CT',
        },
        {
          key: 'cotizaciones_dia',
          label: 'Cotizaciones previsionales al dia (AFP, Salud, AFC)',
          ref: 'Art. 58 CT, Ley Bustos Art. 162',
        },
        {
          key: 'certificado_cotizaciones',
          label: 'Certificados de cotizaciones Previred actualizados',
          ref: 'DL 3.500',
        },
        {
          key: 'comite_paritario',
          label: 'Comite Paritario de Higiene y Seguridad (obligatorio con 25+ trabajadores)',
          ref: 'Art. 66 Ley 16.744, DS 54',
        },
        {
          key: 'seguro_accidentes',
          label: 'Seguro de accidentes del trabajo y enfermedades profesionales (Mutual/ISL)',
          ref: 'Ley 16.744',
        },
        {
          key: 'derecho_saber',
          label: 'Obligacion de Informar riesgos laborales (ODI) firmado por cada trabajador',
          ref: 'DS 40 Art. 21 — "Derecho a Saber"',
        },
        {
          key: 'protocolo_acoso',
          label: 'Protocolo de prevencion de acoso laboral y sexual',
          ref: 'Ley 20.607, Ley 21.643 (Ley Karin)',
        },
        {
          key: 'politica_inclusion',
          label: 'Politica de inclusion y no discriminacion',
          ref: 'Ley 20.609 (Ley Zamudio)',
        },
        {
          key: 'registro_vacaciones',
          label: 'Registro de feriado anual (vacaciones tomadas y pendientes)',
          ref: 'Art. 67-76 CT',
        },
        {
          key: 'horas_extra_pactadas',
          label: 'Pactos de horas extraordinarias por escrito (max 3 meses)',
          ref: 'Art. 32 CT',
        },
        {
          key: 'finiquitos_archivados',
          label: 'Finiquitos ratificados ante Ministro de Fe archivados',
          ref: 'Art. 177 CT',
        },
        {
          key: 'carpetas_personales',
          label: 'Carpetas personales por trabajador (documentos, certificados, anexos)',
          ref: 'Buena practica laboral',
        },
      ],
    },
    {
      title: 'Obligaciones Periodicas',
      ref: 'Varias normas',
      items: [
        {
          key: 'previred_mensual',
          label: 'Declaracion y pago Previred (antes del dia 13 de cada mes)',
          ref: 'DL 3.500, Ley 19.728',
        },
        {
          key: 'f29_mensual',
          label: 'Formulario 29 — Declaracion mensual de impuestos (IVA, retenciones)',
          ref: 'Art. 64 Codigo Tributario',
        },
        {
          key: 'dj1887',
          label: 'DJ 1887 — Declaracion jurada anual de sueldos (marzo de cada ano)',
          ref: 'Res. SII',
        },
        {
          key: 'actualizacion_contratos',
          label: 'Actualizacion de contratos por cambios de condiciones (anexos)',
          ref: 'Art. 11 CT',
        },
        {
          key: 'evaluacion_riesgos',
          label: 'Evaluacion de riesgos laborales anual',
          ref: 'DS 594',
        },
        {
          key: 'capacitacion_seguridad',
          label: 'Capacitaciones de seguridad laboral registradas',
          ref: 'Ley 16.744',
        },
      ],
    },
  ];

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = sections.reduce((s, sec) => s + sec.items.length, 0);

  return (
    <div>
      {/* Header */}
      <div
        className="card"
        style={{
          padding: 20,
          marginBottom: 16,
          background: 'linear-gradient(135deg, #1e3a5f, #2d62c8)',
          color: '#fff',
          borderRadius: 16,
        }}
      >
        <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={20} /> Inspeccion del Trabajo — Preparacion y Compliance
        </h3>
        <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>
          Checklist de documentacion y obligaciones legales para estar preparado ante una
          fiscalizacion de la Direccion del Trabajo (DT). Multas por incumplimiento: 1 a 60 UTM ($
          {CHILE_LABOR.UTM.value.toLocaleString('es-CL')} a $
          {(CHILE_LABOR.UTM.value * 60).toLocaleString('es-CL')}).
        </p>
      </div>

      {/* Progress */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
              Cumplimiento
            </div>
            <div
              style={{
                height: 8,
                background: 'var(--bg-tertiary)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                  background: completedCount === totalCount ? '#22c55e' : '#3b82f6',
                  borderRadius: 4,
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>
            {completedCount}/{totalCount}
          </div>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 600,
              background:
                completedCount === totalCount
                  ? 'rgba(34,197,94,0.15)'
                  : completedCount > totalCount * 0.7
                    ? 'rgba(59,130,246,0.15)'
                    : 'rgba(245,158,11,0.15)',
              color:
                completedCount === totalCount
                  ? '#22c55e'
                  : completedCount > totalCount * 0.7
                    ? '#3b82f6'
                    : '#f59e0b',
            }}
          >
            {completedCount === totalCount
              ? 'Listo para fiscalizacion'
              : completedCount > totalCount * 0.7
                ? 'Avanzado'
                : 'Pendiente'}
          </span>
        </div>
      </div>

      {/* Checklists */}
      {sections.map((section, si) => (
        <div key={si} className="card" style={{ padding: 16, marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 4px', fontSize: 14 }}>{section.title}</h4>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
            {section.ref}
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            {section.items.map((item) => (
              <label
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '8px 10px',
                  background: checklist[item.key] ? 'rgba(34,197,94,0.08)' : 'var(--bg-secondary)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                <input
                  type="checkbox"
                  checked={!!checklist[item.key]}
                  onChange={() => toggle(item.key)}
                  style={{ marginTop: 2 }}
                />
                <div>
                  <div
                    style={{
                      textDecoration: checklist[item.key] ? 'line-through' : undefined,
                      color: checklist[item.key] ? 'var(--text-muted)' : undefined,
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    {item.ref}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}

      {/* ─── Documentos Generables ─── */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h4 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={18} /> Documentos Laborales
        </h4>

        {/* Finiquito */}
        <div
          style={{
            padding: 16,
            background: 'var(--bg-secondary)',
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
            Finiquito (Art. 177 CT)
          </div>
          <div
            style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.8 }}
          >
            Documento que pone termino a la relacion laboral. Debe ser:
            <br />• <strong>Firmado ante Ministro de Fe</strong> (Notario Publico, Inspector del
            Trabajo, o Presidente del Sindicato)
            <br />• <strong>Cotizaciones al dia</strong> — Sin cotizaciones pagadas, el finiquito es
            NULO (Ley Bustos, Art. 162)
            <br />• <strong>Pago al momento de la firma</strong> — Plazo maximo: 10 dias habiles
            desde el termino
            <br />• <strong>Copia al trabajador</strong> — Obligatorio entregar copia firmada
            <br />• <strong>Reserva de derechos</strong> — El trabajador puede reservar el derecho a
            reclamar ante tribunales
          </div>
          <div
            style={{
              padding: 10,
              background: 'var(--bg-tertiary)',
              borderRadius: 6,
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            <strong>Contenido obligatorio del finiquito:</strong>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 4,
                marginTop: 6,
                color: 'var(--text-muted)',
              }}
            >
              <span>• Causal de termino invocada</span>
              <span>• Fecha de inicio y termino de la relacion laboral</span>
              <span>• Ultima remuneracion mensual</span>
              <span>• Indemnizacion sustitutiva del aviso previo (si aplica)</span>
              <span>• Indemnizacion por anos de servicio</span>
              <span>• Feriado proporcional (vacaciones pendientes)</span>
              <span>• Remuneraciones pendientes de pago</span>
              <span>• Estado de cotizaciones previsionales</span>
              <span>• Gratificacion proporcional</span>
              <span>• Certificado de AFP y AFC</span>
            </div>
          </div>
          {employees.filter((e) => e.status === 'active').length > 0 && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={finiquitoEmp}
                onChange={(e) => setFiniquitoEmp(e.target.value)}
                style={selectStyle}
              >
                <option value="">Seleccionar trabajador...</option>
                {employees
                  .filter((e) => e.status === 'active')
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName}
                    </option>
                  ))}
              </select>
              <button
                style={{ ...btnPrimary, opacity: finiquitoEmp ? 1 : 0.5 }}
                disabled={!finiquitoEmp}
                onClick={() => {
                  const emp = employees.find((e) => e.id === finiquitoEmp);
                  if (!emp) return;
                  const hire = new Date(emp.hireDate);
                  const now = new Date();
                  const diffMs = now.getTime() - hire.getTime();
                  const years = Math.min(Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000)), 11);
                  const months = Math.floor(
                    (diffMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000)
                  );
                  const topeMensual = 90 * CHILE_LABOR.UF.value;
                  const salaryForCalc = Math.min(emp.grossSalary, topeMensual);
                  const indemnizacionAnos = salaryForCalc * years;
                  const indemnizacionAviso = salaryForCalc;
                  const dailySalary = emp.grossSalary / 30;
                  const vacaciones = dailySalary * 15;
                  const gratificacionMensual = Math.min(
                    emp.grossSalary * 0.25,
                    (500000 * 4.75) / 12
                  );
                  const gratificacionProp = gratificacionMensual * (months / 12);
                  const diasTrabajados = dailySalary * 15;
                  const totalBruto =
                    indemnizacionAnos +
                    indemnizacionAviso +
                    vacaciones +
                    gratificacionProp +
                    diasTrabajados;
                  const result = {
                    indemnizacionAnos,
                    indemnizacionAviso,
                    recargo: 0,
                    recargoPercent: 0,
                    vacaciones,
                    gratificacionProp,
                    diasTrabajados,
                    totalBruto,
                    yearsApplied: years,
                    topeMensualApplied: emp.grossSalary > topeMensual,
                  };
                  openDoc(
                    generateFiniquitoHTML(
                      emp,
                      result,
                      'Art. 161 — Necesidades de la empresa',
                      15,
                      true
                    )
                  );
                }}
              >
                <Download size={14} /> Generar Finiquito
              </button>
            </div>
          )}
        </div>

        {/* Carta de Despido */}
        <div
          style={{
            padding: 16,
            background: 'var(--bg-secondary)',
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
            Carta de Despido (Art. 162 CT)
          </div>
          <div
            style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.8 }}
          >
            Comunicacion formal de termino del contrato. Requisitos:
            <br />• <strong>Por escrito</strong> — Entrega personal o por carta certificada al
            domicilio del trabajador
            <br />• <strong>Plazo</strong> — Dentro de los 3 dias habiles siguientes a la separacion
            (6 dias si es Art. 161)
            <br />• <strong>Copia a la Inspeccion del Trabajo</strong> — Obligatorio enviar copia
            dentro del mismo plazo
            <br />• <strong>Contenido</strong> — Causal invocada, hechos que la fundamentan, monto
            de indemnizaciones ofrecidas, estado de cotizaciones
            <br />• <strong>Cotizaciones</strong> — Si no estan al dia, adjuntar certificado de la
            AFP con el monto adeudado
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <select
              value={despidoEmp}
              onChange={(e) => setDespidoEmp(e.target.value)}
              style={selectStyle}
            >
              <option value="">Seleccionar trabajador...</option>
              {employees
                .filter((e) => e.status === 'active')
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName}
                  </option>
                ))}
            </select>
            <textarea
              value={despidoHechos}
              onChange={(e) => setDespidoHechos(e.target.value)}
              placeholder="Hechos que fundamentan el despido..."
              style={textareaStyle}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={{ ...btnSecondary, opacity: despidoEmp ? 1 : 0.5 }}
                disabled={!despidoEmp}
                onClick={() => {
                  const emp = employees.find((e) => e.id === despidoEmp);
                  if (!emp) return;
                  openDoc(
                    generateCartaDespidoHTML(
                      emp,
                      'art159',
                      despidoHechos,
                      new Date().toLocaleDateString('es-CL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    )
                  );
                }}
              >
                <FileText size={14} /> Generar Carta Art. 159 (Vencimiento/Mutuo Acuerdo)
              </button>
              <button
                style={{ ...btnSecondary, opacity: despidoEmp ? 1 : 0.5 }}
                disabled={!despidoEmp}
                onClick={() => {
                  const emp = employees.find((e) => e.id === despidoEmp);
                  if (!emp) return;
                  openDoc(
                    generateCartaDespidoHTML(
                      emp,
                      'art161',
                      despidoHechos,
                      new Date().toLocaleDateString('es-CL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    )
                  );
                }}
              >
                <FileText size={14} /> Generar Carta Art. 161 (Necesidades Empresa)
              </button>
            </div>
          </div>
        </div>

        {/* Carta de Amonestacion */}
        <div
          style={{
            padding: 16,
            background: 'var(--bg-secondary)',
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
            Carta de Amonestacion
          </div>
          <div
            style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.8 }}
          >
            Registro formal de incumplimiento del trabajador. No esta regulada expresamente en el
            CT, pero es una buena practica laboral y sirve como evidencia ante eventuales despidos
            por Art. 160.
            <br />• <strong>Tipos:</strong> Amonestacion verbal (registro interno), amonestacion
            escrita (firmada por el trabajador), amonestacion con copia a la DT
            <br />• <strong>Contenido:</strong> Descripcion del hecho, fecha, articulo del
            reglamento interno infringido, consecuencias
            <br />• <strong>Importante:</strong> 3 amonestaciones escritas pueden configurar causal
            de despido por "incumplimiento grave" (Art. 160 N°7)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={amonestacionEmp}
                onChange={(e) => setAmonestacionEmp(e.target.value)}
                style={selectStyle}
              >
                <option value="">Seleccionar trabajador...</option>
                {employees
                  .filter((e) => e.status === 'active')
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName}
                    </option>
                  ))}
              </select>
              <select
                value={amonestacionTipo}
                onChange={(e) => setAmonestacionTipo(e.target.value)}
                style={selectStyle}
              >
                <option value="verbal">Verbal (registro interno)</option>
                <option value="escrita">Escrita</option>
                <option value="con_copia_dt">Con copia a la DT</option>
              </select>
            </div>
            <textarea
              value={amonestacionDesc}
              onChange={(e) => setAmonestacionDesc(e.target.value)}
              placeholder="Descripcion del incumplimiento o falta..."
              style={textareaStyle}
            />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={amonestacionArt}
                onChange={(e) => setAmonestacionArt(e.target.value)}
                placeholder="Art. del Reglamento Interno (ej: 15)"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                style={{ ...btnSecondary, opacity: amonestacionEmp ? 1 : 0.5 }}
                disabled={!amonestacionEmp}
                onClick={() => {
                  const emp = employees.find((e) => e.id === amonestacionEmp);
                  if (!emp) return;
                  openDoc(
                    generateCartaAmonestacionHTML(
                      emp,
                      amonestacionTipo,
                      amonestacionDesc,
                      new Date().toLocaleDateString('es-CL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      }),
                      amonestacionArt
                    )
                  );
                }}
              >
                <FileText size={14} /> Generar Carta de Amonestacion
              </button>
            </div>
          </div>
        </div>

        {/* Certificado Antigüedad */}
        <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Otros Documentos</div>
          <div style={{ marginTop: 8 }}>
            <select
              value={certificadoEmp}
              onChange={(e) => setCertificadoEmp(e.target.value)}
              style={{ ...selectStyle, marginBottom: 8 }}
            >
              <option value="">Seleccionar trabajador...</option>
              {employees
                .filter((e) => e.status === 'active')
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName}
                  </option>
                ))}
            </select>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button
                style={{ ...btnSmall, opacity: certificadoEmp ? 1 : 0.5 }}
                disabled={!certificadoEmp}
                onClick={() => {
                  const emp = employees.find((e) => e.id === certificadoEmp);
                  if (emp) openDoc(generateCertificadoHTML(emp, 'antiguedad'));
                }}
              >
                <FileText size={14} /> Certificado de Antiguedad
              </button>
              <button
                style={{ ...btnSmall, opacity: certificadoEmp ? 1 : 0.5 }}
                disabled={!certificadoEmp}
                onClick={() => {
                  const emp = employees.find((e) => e.id === certificadoEmp);
                  if (emp) openDoc(generateCertificadoHTML(emp, 'remuneraciones'));
                }}
              >
                <FileText size={14} /> Certificado de Remuneraciones
              </button>
              <button
                style={{ ...btnSmall, opacity: certificadoEmp ? 1 : 0.5 }}
                disabled={!certificadoEmp}
                onClick={() => {
                  const emp = employees.find((e) => e.id === certificadoEmp);
                  if (emp) openDoc(generateCertificadoHTML(emp, 'vacaciones'));
                }}
              >
                <FileText size={14} /> Constancia de Vacaciones
              </button>
              <button style={btnSmall}>
                <FileText size={14} /> Anexo de Contrato
              </button>
              <button style={btnSmall}>
                <FileText size={14} /> Pacto de Horas Extra
              </button>
              <button style={btnSmall}>
                <FileText size={14} /> Autorizacion de Descuento Voluntario
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Links Directos ─── */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h4 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Globe size={18} /> Links Directos — Instituciones Laborales
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            {
              name: 'Direccion del Trabajo (DT)',
              url: 'https://www.dt.gob.cl',
              desc: 'Portal principal. Consultas laborales, denuncias, dictamenes.',
            },
            {
              name: 'Mi DT — Tramites en Linea',
              url: 'https://mi.dt.gob.cl',
              desc: 'Finiquitos electronicos, certificados, registro de contratos, fiscalizacion.',
            },
            {
              name: 'Previred',
              url: 'https://www.previred.com',
              desc: 'Declaracion y pago de cotizaciones previsionales. Plazo: dia 13 del mes siguiente.',
            },
            {
              name: 'SII — Servicio de Impuestos',
              url: 'https://www.sii.cl',
              desc: 'F29, DJ 1887, boletas, facturacion electronica.',
            },
            {
              name: 'AFC Chile (Seguro Cesantia)',
              url: 'https://www.afcchile.cl',
              desc: 'Consulta de saldo, simulacion de prestaciones, certificados.',
            },
            {
              name: 'Superintendencia de Pensiones',
              url: 'https://www.spensiones.cl',
              desc: 'Regulacion AFP, APV, topes imponibles, tasas vigentes.',
            },
            {
              name: 'Superintendencia de Salud',
              url: 'https://www.supersalud.gob.cl',
              desc: 'Fonasa, Isapres, licencias medicas, COMPIN.',
            },
            {
              name: 'ISL — Instituto de Seguridad Laboral',
              url: 'https://www.isl.gob.cl',
              desc: 'Seguro de accidentes (empresas sin mutual adherida).',
            },
            {
              name: 'SUSESO',
              url: 'https://www.suseso.cl',
              desc: 'Superintendencia de Seguridad Social. Accidentes laborales, licencias.',
            },
            {
              name: 'Biblioteca del Congreso — Leyes',
              url: 'https://www.bcn.cl/leychile',
              desc: 'Texto actualizado del Codigo del Trabajo y leyes laborales.',
            },
          ].map((link, i) => (
            <div
              key={i}
              style={{
                padding: 12,
                background: 'var(--bg-secondary)',
                borderRadius: 8,
                cursor: 'pointer',
              }}
              onClick={() => window.open(link.url, '_blank')}
            >
              <div
                style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent)', marginBottom: 2 }}
              >
                {link.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{link.desc}</div>
              <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 4, opacity: 0.7 }}>
                {link.url}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Ley Karin ─── */}
      <div
        className="card"
        style={{ padding: 20, marginBottom: 16, borderLeft: '4px solid #EF4444' }}
      >
        <h4 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} color="#EF4444" /> Ley Karin (Ley 21.643) — Vigente desde
          01-Ago-2024
        </h4>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <p>
            Modifica el Codigo del Trabajo en materia de prevencion, investigacion y sancion del{' '}
            <strong>acoso laboral, sexual y violencia en el trabajo</strong>.
          </p>
          <p>
            <strong>Obligaciones del empleador:</strong>
          </p>
          <p>
            • Elaborar un <strong>protocolo de prevencion</strong> del acoso laboral, sexual y
            violencia en el trabajo.
            <br />
            • Informar semestralmente sobre los canales de denuncia y el protocolo.
            <br />• Implementar un <strong>procedimiento de investigacion</strong> (max 30 dias) con
            imparcialidad y confidencialidad.
            <br />
            • Adoptar medidas de resguardo para el denunciante (separacion de espacios,
            reasignacion, teletrabajo).
            <br />• Sanciones: amonestacion, multa (25% remuneracion diaria x dias), o despido (Art.
            160 N°1).
          </p>
          <p>
            <strong>El acoso laboral por una sola vez ya es sancionable</strong> (se elimino el
            requisito de "reiteracion").
          </p>
        </div>
      </div>

      {/* ─── Multas de referencia ─── */}
      <div className="card" style={{ padding: 20, borderLeft: '4px solid #F59E0B' }}>
        <h4 style={{ margin: '0 0 12px' }}>Tabla de Multas — Direccion del Trabajo</h4>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>Infraccion</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Multa (UTM)</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Aprox. $CLP</th>
              </tr>
            </thead>
            <tbody>
              {[
                { desc: 'No escriturar contrato en plazo', utm: '1-5', mult: 5 },
                { desc: 'No llevar registro de asistencia', utm: '1-10', mult: 10 },
                { desc: 'No pagar remuneraciones completas/oportunas', utm: '3-20', mult: 20 },
                { desc: 'No pagar cotizaciones previsionales', utm: '5-50', mult: 50 },
                { desc: 'Infraccion jornada de trabajo', utm: '1-10', mult: 10 },
                { desc: 'No tener Reglamento Interno (10+ trabajadores)', utm: '1-5', mult: 5 },
                { desc: 'Incumplimiento normas higiene y seguridad', utm: '1-60', mult: 60 },
                { desc: 'No implementar protocolo Ley Karin', utm: '5-60', mult: 60 },
                { desc: 'Practicas antisindicales', utm: '10-150', mult: 150 },
                {
                  desc: 'Simulacion de contratacion (subcontratacion ilegal)',
                  utm: '5-100',
                  mult: 100,
                },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '6px 8px' }}>{row.desc}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>
                    {row.utm}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: '#EF4444' }}>
                    ${(CHILE_LABOR.UTM.value * row.mult).toLocaleString('es-CL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 8, fontSize: 11 }}>
            * Montos aproximados basados en UTM ${CHILE_LABOR.UTM.value.toLocaleString('es-CL')}.
            Multas pueden aumentar por reincidencia o gravedad. Microempresas (1-9 trabajadores):
            multa reducida al 50%. Pequenas empresas (10-49): multa al 75%.
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// LEGAL TAB
// ═════════════════════════════════════════════════════════════════
function LegalTab() {
  return (
    <div>
      <div
        className="card"
        style={{
          padding: 20,
          marginBottom: 20,
          background: 'linear-gradient(135deg, #1a2332, #2d62c8)',
          color: '#fff',
          borderRadius: 16,
        }}
      >
        <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={20} /> Compliance Legal — Chile
        </h3>
        <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>
          Checklist completo de cumplimiento legal para Conniku SpA como empleador en Chile.
        </p>
      </div>

      {/* Brand Registration Guide */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3
          style={{
            margin: '0 0 16px',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Star size={18} /> Registro de Marca — INAPI
        </h3>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: 14 }}>
            Pasos para registrar "Conniku" en Chile:
          </h4>
          <ol style={{ paddingLeft: 20, lineHeight: 2.2 }}>
            <li>
              <strong>Busqueda previa:</strong> Verificar disponibilidad en{' '}
              <strong>inapi.cl</strong> → Busqueda de Marcas. Buscar "Conniku" en todas las clases.
            </li>
            <li>
              <strong>Definir clases Niza:</strong>
              <ul style={{ marginTop: 4, lineHeight: 1.8 }}>
                <li>
                  <strong>Clase 9:</strong> Software, aplicaciones moviles, plataformas digitales
                </li>
                <li>
                  <strong>Clase 41:</strong> Servicios de educacion, formacion, ensenanza
                </li>
                <li>
                  <strong>Clase 42:</strong> SaaS, diseno y desarrollo de software, plataformas
                  cloud
                </li>
                <li>
                  <strong>Clase 35:</strong> Publicidad, gestion de negocios (si aplica marketplace)
                </li>
              </ul>
            </li>
            <li>
              <strong>Presentar solicitud:</strong> Portal online INAPI. Necesitas:
              <ul style={{ marginTop: 4, lineHeight: 1.8 }}>
                <li>RUT de la empresa (Conniku SpA)</li>
                <li>Representante legal</li>
                <li>Logo en formato digital (JPEG/PNG min 300 DPI)</li>
                <li>Descripcion detallada de productos/servicios por clase</li>
              </ul>
            </li>
            <li>
              <strong>Pago:</strong> ~1 UTM (~$66,000 CLP) por cada clase solicitada
            </li>
            <li>
              <strong>Publicacion:</strong> Se publica en el Diario Oficial por 30 dias para
              oposiciones
            </li>
            <li>
              <strong>Examen de fondo:</strong> INAPI revisa distintividad y posibles conflictos
              (2-4 meses)
            </li>
            <li>
              <strong>Resolucion:</strong> Si no hay oposiciones, se concede el registro por 10 anos
              (renovable)
            </li>
          </ol>

          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: 'var(--bg-tertiary)',
              borderRadius: 8,
            }}
          >
            <strong>Recomendacion:</strong> Registrar minimo en Clases 9, 41 y 42. Costo estimado:
            ~3 UTM (~$198,000 CLP). Considerar tambien registro de dominio .cl si no lo tienes (NIC
            Chile). El proceso toma aproximadamente 4-8 meses en total.
          </div>
        </div>
      </div>

      {/* Labor Law Compliance */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Obligaciones como Empleador</h3>
        {[
          {
            title: 'Reglamento Interno de Orden, Higiene y Seguridad',
            description:
              'Obligatorio con 10+ trabajadores (Art. 153 CT). Debe ser registrado en la Direccion del Trabajo e Inspeccion del Trabajo.',
            status: 'pending',
          },
          {
            title: 'Registro en Direccion del Trabajo',
            description:
              'Inscripcion como empleador en dt.gob.cl. Necesario para inicio de actividades laborales.',
            status: 'pending',
          },
          {
            title: 'Mutual de Seguridad',
            description:
              'Afiliacion a una mutual (ACHS, Mutual de Seguridad, IST) para seguro de accidentes laborales. Tasa base: 0.93%.',
            status: 'pending',
          },
          {
            title: 'Comite Paritario de Higiene y Seguridad',
            description:
              'Obligatorio con 25+ trabajadores. 3 representantes del empleador y 3 de los trabajadores.',
            status: 'na',
          },
          {
            title: 'Obligacion de Informar (ODI)',
            description:
              'Informar riesgos laborales al trabajador. DS 40 Art. 21. Debe quedar firmado.',
            status: 'pending',
          },
          {
            title: 'Libro de Remuneraciones Electronico',
            description:
              'Obligatorio via DT desde 2021 para empresas con 5+ trabajadores. Envio mensual.',
            status: 'pending',
          },
          {
            title: 'Asistencia y Control de Jornada',
            description:
              'Art. 33 CT. Registro de asistencia obligatorio (reloj control, libro, sistema electronico).',
            status: 'pending',
          },
          {
            title: 'Certificado de Cumplimiento Laboral',
            description: 'Obtener en dt.gob.cl. Necesario para licitaciones y contratos publicos.',
            status: 'pending',
          },
          {
            title: 'Ley Karin (Ley 21.643)',
            description:
              'Protocolo de prevencion del acoso laboral, sexual y violencia en el trabajo. Obligatorio desde agosto 2024.',
            status: 'pending',
          },
          {
            title: 'Ley de Inclusion (Ley 21.015)',
            description:
              'Empresas con 100+ trabajadores deben tener al menos 1% personas con discapacidad.',
            status: 'na',
          },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '12px 0',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {item.status === 'done' ? (
              <CheckCircle size={18} style={{ color: '#22c55e', flexShrink: 0, marginTop: 2 }} />
            ) : item.status === 'na' ? (
              <Minus
                size={18}
                style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }}
              />
            ) : (
              <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {item.description}
              </div>
            </div>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 12,
                fontSize: 10,
                fontWeight: 600,
                flexShrink: 0,
                marginLeft: 'auto',
                background:
                  item.status === 'done'
                    ? 'rgba(34,197,94,0.15)'
                    : item.status === 'na'
                      ? 'rgba(150,150,150,0.15)'
                      : 'rgba(245,158,11,0.15)',
                color:
                  item.status === 'done'
                    ? '#22c55e'
                    : item.status === 'na'
                      ? 'var(--text-muted)'
                      : '#f59e0b',
              }}
            >
              {item.status === 'done' ? 'CUMPLE' : item.status === 'na' ? 'N/A' : 'PENDIENTE'}
            </span>
          </div>
        ))}
      </div>

      {/* Data Protection */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Proteccion de Datos Personales</h3>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <p>
            <strong>Ley 19.628:</strong> Proteccion de la vida privada. Obligacion de informar al
            trabajador sobre datos recopilados.
          </p>
          <p>
            <strong>Ley 21.096:</strong> Proteccion de datos como garantia constitucional.
          </p>
          <p>
            <strong>Recomendaciones:</strong>
          </p>
          <ul style={{ paddingLeft: 20 }}>
            <li>Consentimiento explicito del trabajador para tratamiento de datos</li>
            <li>Politica de privacidad laboral interna</li>
            <li>Clausula de confidencialidad en contratos</li>
            <li>Protocolo de eliminacion de datos al termino de relacion laboral</li>
            <li>Designar encargado de proteccion de datos (DPO)</li>
          </ul>
        </div>
      </div>

      {/* Links */}
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Enlaces Utiles</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'SII — Servicio de Impuestos Internos', url: 'sii.cl' },
            { label: 'Direccion del Trabajo', url: 'dt.gob.cl' },
            { label: 'Previred — Cotizaciones', url: 'previred.com' },
            { label: 'INAPI — Registro de Marcas', url: 'inapi.cl' },
            { label: 'Superintendencia de Pensiones', url: 'spensiones.cl' },
            { label: 'Superintendencia de Salud', url: 'supersalud.gob.cl' },
            { label: 'ACHS — Mutual', url: 'achs.cl' },
            { label: 'NIC Chile — Dominios .cl', url: 'nic.cl' },
          ].map((link, i) => (
            <div
              key={i}
              style={{
                padding: '10px 12px',
                background: 'var(--bg-tertiary)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
              }}
            >
              <Globe size={14} style={{ color: 'var(--accent)' }} />
              <span style={{ flex: 1 }}>{link.label}</span>
              <span style={{ fontSize: 11, color: 'var(--accent)' }}>{link.url}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// OWNER GUIDE TAB
// ═════════════════════════════════════════════════════════════════
function OwnerGuideTab() {
  return (
    <div>
      <div
        className="card"
        style={{
          padding: 20,
          marginBottom: 20,
          background: 'linear-gradient(135deg, #1a2332, #c8872d)',
          color: '#fff',
          borderRadius: 16,
        }}
      >
        <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Star size={20} /> Guia para el Owner — Conniku SpA
        </h3>
        <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>
          Recomendaciones legales y tributarias para tu situacion como dueno-fundador de una SpA en
          Chile.
        </p>
      </div>

      {/* Compensation modalities */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Modalidades de Sueldo del Owner</h3>

        <div style={{ display: 'grid', gap: 16 }}>
          {/* Option 1 */}
          <div
            style={{
              padding: 16,
              background: 'var(--bg-tertiary)',
              borderRadius: 12,
              borderLeft: '4px solid #22c55e',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 12,
                  background: 'rgba(34,197,94,0.15)',
                  color: '#22c55e',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                RECOMENDADA
              </span>
              <h4 style={{ margin: 0, fontSize: 15 }}>
                Opcion 1: Sueldo como Trabajador Dependiente
              </h4>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
              <p>
                <strong>Como funciona:</strong> Te contratas a ti mismo como trabajador de tu SpA
                con contrato de trabajo y liquidacion de sueldo.
              </p>
              <p>
                <strong>Ventajas:</strong>
              </p>
              <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                <li>Cotizas AFP, salud y AFC (acceso a prestaciones sociales completas)</li>
                <li>El sueldo es gasto deducible para la empresa (reduce base imponible)</li>
                <li>Acceso a licencias medicas y seguro de cesantia</li>
                <li>Genera antiguedad laboral y ahorro previsional</li>
                <li>Compatible con retiros de utilidades adicionales</li>
              </ul>
              <p>
                <strong>Desventajas:</strong>
              </p>
              <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                <li>Mayor carga de cotizaciones (~20% del sueldo entre empleado y empleador)</li>
                <li>Impuesto Unico de 2da Categoria sobre el sueldo</li>
                <li>Costo empresa adicional (SIS, mutual, AFC empleador)</li>
              </ul>
              <div
                style={{
                  marginTop: 8,
                  padding: 10,
                  background: 'rgba(34,197,94,0.1)',
                  borderRadius: 8,
                }}
              >
                <strong>Ejemplo con sueldo bruto $1,500,000:</strong>
                <br />
                AFP Modelo: -$158,700 | Fonasa: -$105,000 | AFC: -$9,000 | Impuesto: ~$0
                <br />
                <strong>Liquido estimado: ~$1,227,300</strong>
                <br />
                Costo empresa adicional: ~$73,000 (SIS + AFC emp + Mutual)
              </div>
            </div>
          </div>

          {/* Option 2 */}
          <div
            style={{
              padding: 16,
              background: 'var(--bg-tertiary)',
              borderRadius: 12,
              borderLeft: '4px solid #3b82f6',
            }}
          >
            <h4 style={{ margin: '0 0 8px', fontSize: 15 }}>Opcion 2: Boleta de Honorarios</h4>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
              <p>
                <strong>Como funciona:</strong> Emites boleta de honorarios a tu propia SpA como
                trabajador independiente.
              </p>
              <p>
                <strong>Ventajas:</strong>
              </p>
              <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                <li>Retencion de 13.75% (2025) como PPM (puede recuperarse en renta anual)</li>
                <li>Menor carga administrativa mensual</li>
                <li>Flexibility en montos y frecuencia</li>
              </ul>
              <p>
                <strong>Desventajas:</strong>
              </p>
              <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                <li>Debes cotizar como independiente en la declaracion anual (Ley 21.133)</li>
                <li>Menor proteccion social (sin seguro de cesantia, licencias limitadas)</li>
                <li>
                  El SII puede objetar si es tu unica fuente de ingreso (relacion laboral
                  encubierta)
                </li>
              </ul>
            </div>
          </div>

          {/* Option 3 */}
          <div
            style={{
              padding: 16,
              background: 'var(--bg-tertiary)',
              borderRadius: 12,
              borderLeft: '4px solid #8b5cf6',
            }}
          >
            <h4 style={{ margin: '0 0 8px', fontSize: 15 }}>Opcion 3: Retiro de Utilidades</h4>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
              <p>
                <strong>Como funciona:</strong> La empresa genera utilidades y las retiras como
                dividendos/retiros.
              </p>
              <p>
                <strong>Ventajas:</strong>
              </p>
              <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                <li>No pagas cotizaciones previsionales sobre retiros</li>
                <li>Puedes diferir los retiros (dejar utilidades en la empresa)</li>
                <li>Impuesto pagado por la empresa (25%) se usa como credito</li>
              </ul>
              <p>
                <strong>Desventajas:</strong>
              </p>
              <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                <li>Sin proteccion social (AFP, salud, cesantia) si no cotizas por otro medio</li>
                <li>Tributa con Impuesto Global Complementario (hasta 40%)</li>
                <li>No aplica si la empresa no tiene utilidades</li>
              </ul>
            </div>
          </div>

          {/* Recommendation */}
          <div
            style={{
              padding: 16,
              background: 'var(--bg-tertiary)',
              borderRadius: 12,
              border: '2px solid var(--accent)',
            }}
          >
            <h4 style={{ margin: '0 0 8px', fontSize: 15, color: 'var(--accent)' }}>
              Recomendacion para tu caso (Conniku SpA, etapa early-stage):
            </h4>
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>
              <p>
                <strong>Estrategia mixta recomendada:</strong>
              </p>
              <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
                <li>
                  <strong>Sueldo base como dependiente:</strong> Fijate un sueldo minimo razonable
                  ($500,000 - $1,000,000 CLP) para cubrir cotizaciones y tener proteccion social.
                </li>
                <li>
                  <strong>Complementar con retiros de utilidades:</strong> Cuando la empresa genere
                  ganancias, puedes retirar utilidades adicionales.
                </li>
                <li>
                  <strong>Nunca dejes de cotizar:</strong> Aunque sea el minimo, cotiza AFP y salud
                  para no perder cobertura previsional.
                </li>
                <li>
                  <strong>Consulta un contador:</strong> Un contador puede optimizar la estructura
                  tributaria segun los ingresos reales de Conniku.
                </li>
              </ol>
              <p
                style={{
                  marginTop: 8,
                  padding: 8,
                  background: 'rgba(45,98,200,0.1)',
                  borderRadius: 8,
                }}
              >
                <strong>Dato clave:</strong> En una SpA, el sueldo del socio-trabajador es gasto
                deducible, lo que reduce la base imponible de la empresa. Si tu sueldo + gastos
                superan los ingresos, la empresa queda con perdida tributaria (arrastrable a anos
                futuros).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Business Creation Checklist */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>
          Checklist de Creacion de Empresa en Chile
        </h3>
        {[
          {
            step: 1,
            title: 'Constitucion de la SpA',
            description:
              'En tuempresaenundia.cl o con abogado. Escritura publica con estatutos, capital, administracion.',
            status: 'done',
          },
          {
            step: 2,
            title: 'Inscripcion en el Registro de Comercio',
            description: 'Conservador de Bienes Raices. Extracto publicado en el Diario Oficial.',
            status: 'done',
          },
          {
            step: 3,
            title: 'Obtener RUT de la empresa',
            description: 'Se obtiene automaticamente con la constitucion o en el SII.',
            status: 'done',
          },
          {
            step: 4,
            title: 'Inicio de Actividades en SII',
            description:
              'sii.cl → Inicio de Actividades. Codigos de actividad economica: 620200 (desarrollo software), 855900 (educacion).',
            status: 'done',
          },
          {
            step: 5,
            title: 'Timbraje de documentos / DTE',
            description:
              'Activar facturacion electronica en sii.cl. Emision de boletas y facturas.',
            status: 'pending',
          },
          {
            step: 6,
            title: 'Cuenta bancaria empresa',
            description:
              'Abrir cuenta corriente a nombre de la SpA. Requiere: RUT, carpeta tributaria, escritura.',
            status: 'pending',
          },
          {
            step: 7,
            title: 'Registro de marca INAPI',
            description: 'Registrar "Conniku" en clases 9, 41, 42. Ver guia en pestana Legal.',
            status: 'pending',
          },
          {
            step: 8,
            title: 'Registro como empleador',
            description: 'dt.gob.cl para inscripcion laboral. Necesario antes de contratar.',
            status: 'pending',
          },
          {
            step: 9,
            title: 'Afiliacion a Mutual de Seguridad',
            description: 'ACHS, Mutual de Seguridad o IST. Obligatorio para accidentes laborales.',
            status: 'pending',
          },
          {
            step: 10,
            title: 'Politica de Privacidad y ToS',
            description: 'Documentos legales para la plataforma. Cumplimiento Ley 19.628.',
            status: 'done',
          },
          {
            step: 11,
            title: 'Contratar Contador',
            description:
              'Para declaraciones mensuales (F29) y anuales (F22). Costo estimado: $50,000-$150,000/mes.',
            status: 'pending',
          },
          {
            step: 12,
            title: 'Patente Municipal',
            description:
              'Patente comercial en la municipalidad donde opera la empresa. Costo: 0.25-0.5% del capital.',
            status: 'pending',
          },
        ].map((item) => (
          <div
            key={item.step}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '12px 0',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                flexShrink: 0,
                background: item.status === 'done' ? '#22c55e' : 'var(--bg-tertiary)',
                color: item.status === 'done' ? '#fff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {item.status === 'done' ? <Check size={14} /> : item.step}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {item.description}
              </div>
            </div>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 12,
                fontSize: 10,
                fontWeight: 600,
                background:
                  item.status === 'done' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                color: item.status === 'done' ? '#22c55e' : '#f59e0b',
              }}
            >
              {item.status === 'done' ? 'LISTO' : 'PENDIENTE'}
            </span>
          </div>
        ))}
      </div>

      {/* Key Advice */}
      <div className="card" style={{ padding: 20, borderLeft: '4px solid #22c55e' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Consejos Clave para tu Etapa</h3>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 2 }}>
          <p>
            <strong>1. Formaliza todo:</strong> Aunque seas el unico, ten contrato de trabajo,
            liquidaciones y cotizaciones al dia. Te protege legalmente y genera historial.
          </p>
          <p>
            <strong>2. Separa finanzas:</strong> Nunca mezcles gastos personales con los de la
            empresa. Ten una cuenta bancaria exclusiva para Conniku SpA.
          </p>
          <p>
            <strong>3. Documenta gastos:</strong> Guarda TODAS las facturas. El IVA credito fiscal
            es dinero que recuperas. Un computador de $1M tiene $190,000 de IVA recuperable.
          </p>
          <p>
            <strong>4. Aprovecha la depreciacion:</strong> En regimen Pro Pyme, los activos fijos se
            deprecian al 100% el primer ano (depreciacion instantanea). Compra equipos y registralos
            como activo.
          </p>
          <p>
            <strong>5. PPM minimo:</strong> El Pago Provisional Mensual es solo 0.25% de ventas en
            Pro Pyme. Si no hay ventas, no hay PPM.
          </p>
          <p>
            <strong>6. Perdidas tributarias:</strong> Si gastas mas de lo que ingresas, la perdida
            se arrastra y reduce impuestos futuros cuando haya utilidades.
          </p>
          <p>
            <strong>7. Primer empleado:</strong> Cuando contrates, la Ley Bustos (Art. 162 CT) te
            obliga a tener TODAS las cotizaciones al dia para poder despedir validamente.
          </p>
          <p>
            <strong>8. Registro de marca:</strong> Hazlo lo antes posible. Si alguien registra
            "Conniku" antes, perderas el nombre. Cuesta ~$200,000 CLP y toma 4-8 meses.
          </p>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═════════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════
// FINIQUITOS TAB
// ═════════════════════════════════════════════════════════════════
function FiniquitosTab({ employees }: { employees: Employee[] }) {
  const [selectedEmp, setSelectedEmp] = useState<string>('');
  const [causal, setCausal] = useState('161_necesidades');
  const [lastSalary, setLastSalary] = useState(0);
  const [yearsWorked, setYearsWorked] = useState(0);
  const [monthsExtra, setMonthsExtra] = useState(0);
  const [pendingVacationDays, setPendingVacationDays] = useState(0);
  const [avisoPrevio, setAvisoPrevio] = useState(true);
  const [result, setResult] = useState<any>(null);

  const CAUSALES = [
    {
      value: '159_1_mutuo',
      label: 'Art. 159 N°1 — Mutuo acuerdo',
      indemnizacion: false,
      aviso: false,
      recargo: 0,
    },
    {
      value: '159_2_renuncia',
      label: 'Art. 159 N°2 — Renuncia voluntaria',
      indemnizacion: false,
      aviso: false,
      recargo: 0,
    },
    {
      value: '159_4_vencimiento',
      label: 'Art. 159 N°4 — Vencimiento de plazo',
      indemnizacion: false,
      aviso: false,
      recargo: 0.5,
    },
    {
      value: '159_5_obra',
      label: 'Art. 159 N°5 — Conclusion de obra',
      indemnizacion: false,
      aviso: false,
      recargo: 0.5,
    },
    {
      value: '160_conducta',
      label: 'Art. 160 — Despido por falta grave (sin indemnizacion)',
      indemnizacion: false,
      aviso: false,
      recargo: 0,
    },
    {
      value: '161_necesidades',
      label: 'Art. 161 — Necesidades de la empresa',
      indemnizacion: true,
      aviso: true,
      recargo: 0,
    },
    {
      value: '161_desahucio',
      label: 'Art. 161 inc. 2 — Desahucio',
      indemnizacion: true,
      aviso: true,
      recargo: 0,
    },
    {
      value: '168_injustificado',
      label: 'Art. 168 — Despido injustificado',
      indemnizacion: true,
      aviso: true,
      recargo: 0.3,
    },
    {
      value: '168_improcedente_159',
      label: 'Art. 168 — Improcedente (causal 159 N°4-6)',
      indemnizacion: true,
      aviso: true,
      recargo: 0.5,
    },
    {
      value: '168_improcedente_160',
      label: 'Art. 168 — Improcedente (causal 160)',
      indemnizacion: true,
      aviso: true,
      recargo: 0.8,
    },
  ];

  const UF_VALUE = 38000;

  const handleCalculate = () => {
    const c = CAUSALES.find((x) => x.value === causal);
    if (!c) return;

    const yearsTotal = Math.min(yearsWorked, 11);
    const topeMensual = 90 * UF_VALUE; // 90 UF tope mensual para indemnizacion
    const salaryForCalc = Math.min(lastSalary, topeMensual);

    // Indemnizacion por anos de servicio
    const indemnizacionAnos = c.indemnizacion ? salaryForCalc * yearsTotal : 0;

    // Indemnizacion sustitutiva del aviso previo (1 mes)
    const indemnizacionAviso = c.aviso && avisoPrevio ? salaryForCalc : 0;

    // Recargo legal
    const recargo = (indemnizacionAnos + indemnizacionAviso) * c.recargo;

    // Vacaciones proporcionales (sueldo diario * dias pendientes)
    const dailySalary = lastSalary / 30;
    const vacaciones = dailySalary * pendingVacationDays;

    // Gratificacion proporcional
    const gratificacionMensual = Math.min(lastSalary * 0.25, (500000 * 4.75) / 12);
    const gratificacionProp = gratificacionMensual * (monthsExtra / 12);

    // Dias trabajados del mes (estimado 15 dias)
    const diasTrabajados = dailySalary * 15;

    const totalBruto =
      indemnizacionAnos +
      indemnizacionAviso +
      recargo +
      vacaciones +
      gratificacionProp +
      diasTrabajados;

    setResult({
      causalLabel: c.label,
      indemnizacionAnos,
      indemnizacionAviso,
      recargo,
      recargoPercent: c.recargo * 100,
      vacaciones,
      gratificacionProp,
      diasTrabajados,
      totalBruto,
      yearsApplied: yearsTotal,
      topeMensualApplied: salaryForCalc < lastSalary,
    });
  };

  useEffect(() => {
    if (selectedEmp) {
      const emp = employees.find((e) => e.id === selectedEmp);
      if (emp) {
        setLastSalary(emp.grossSalary);
        const hire = new Date(emp.hireDate);
        const now = new Date();
        const diffMs = now.getTime() - hire.getTime();
        const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
        const months = Math.floor(
          (diffMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000)
        );
        setYearsWorked(years);
        setMonthsExtra(months);
      }
    }
  }, [selectedEmp]);

  return (
    <div>
      <div
        className="card"
        style={{
          padding: 20,
          marginBottom: 20,
          background: 'linear-gradient(135deg, #1a2332, #991b1b)',
          color: '#fff',
          borderRadius: 16,
        }}
      >
        <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={20} /> Calculadora de Finiquitos
        </h3>
        <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>
          Calculo completo segun el Codigo del Trabajo de Chile. Art. 159-163, 168. Tope
          indemnizacion: 11 anos, tope mensual: 90 UF.
        </p>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                display: 'block',
                marginBottom: 4,
                color: 'var(--text-muted)',
              }}
            >
              Empleado
            </label>
            <select
              value={selectedEmp}
              onChange={(e) => setSelectedEmp(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: 13,
              }}
            >
              <option value="">Seleccionar empleado...</option>
              {employees
                .filter((e) => e.status === 'active')
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} — {e.position}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                display: 'block',
                marginBottom: 4,
                color: 'var(--text-muted)',
              }}
            >
              Causal de Termino
            </label>
            <select
              value={causal}
              onChange={(e) => setCausal(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: 13,
              }}
            >
              {CAUSALES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <FormField
            label="Ultima Remuneracion Mensual (CLP)"
            value={lastSalary}
            onChange={(v: string) => setLastSalary(Number(v))}
            type="number"
          />
          <FormField
            label="Anos Trabajados"
            value={yearsWorked}
            onChange={(v: string) => setYearsWorked(Number(v))}
            type="number"
          />
          <FormField
            label="Meses Adicionales"
            value={monthsExtra}
            onChange={(v: string) => setMonthsExtra(Number(v))}
            type="number"
          />
          <FormField
            label="Dias de Vacaciones Pendientes"
            value={pendingVacationDays}
            onChange={(v: string) => setPendingVacationDays(Number(v))}
            type="number"
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={avisoPrevio}
              onChange={(e) => setAvisoPrevio(e.target.checked)}
              id="aviso"
            />
            <label htmlFor="aviso" style={{ fontSize: 13 }}>
              Incluir indemnizacion sustitutiva del aviso previo (no se dio aviso de 30 dias)
            </label>
          </div>
        </div>

        <button onClick={handleCalculate} style={{ ...btnPrimary, marginTop: 20 }}>
          <Calculator size={16} /> Calcular Finiquito
        </button>
      </div>

      {result && (
        <div className="card" style={{ padding: 20, border: '2px solid #ef4444' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18, color: '#ef4444' }}>
            Resultado del Finiquito
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
            Causal: {result.causalLabel}
          </p>
          {result.topeMensualApplied && (
            <div
              style={{
                padding: 8,
                background: 'rgba(245,158,11,0.1)',
                borderRadius: 8,
                marginBottom: 12,
                fontSize: 12,
                color: '#f59e0b',
              }}
            >
              Se aplico tope mensual de 90 UF (${fmt(90 * UF_VALUE)}) para el calculo de
              indemnizacion.
            </div>
          )}
          <table style={{ width: '100%', fontSize: 14 }}>
            <tbody>
              {result.indemnizacionAnos > 0 && (
                <tr>
                  <td>Indemnizacion por anos de servicio ({result.yearsApplied} anos, tope 11)</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    ${fmt(result.indemnizacionAnos)}
                  </td>
                </tr>
              )}
              {result.indemnizacionAviso > 0 && (
                <tr>
                  <td>Indemnizacion sustitutiva aviso previo (1 mes)</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    ${fmt(result.indemnizacionAviso)}
                  </td>
                </tr>
              )}
              {result.recargo > 0 && (
                <tr style={{ color: '#ef4444' }}>
                  <td>Recargo legal ({result.recargoPercent}%)</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>${fmt(result.recargo)}</td>
                </tr>
              )}
              <tr>
                <td>Vacaciones proporcionales ({pendingVacationDays} dias)</td>
                <td style={{ textAlign: 'right' }}>${fmt(result.vacaciones)}</td>
              </tr>
              <tr>
                <td>Gratificacion proporcional</td>
                <td style={{ textAlign: 'right' }}>${fmt(result.gratificacionProp)}</td>
              </tr>
              <tr>
                <td>Dias trabajados del mes (est. 15 dias)</td>
                <td style={{ textAlign: 'right' }}>${fmt(result.diasTrabajados)}</td>
              </tr>
              <tr style={{ borderTop: '3px solid var(--border)', fontSize: 18 }}>
                <td style={{ fontWeight: 800, paddingTop: 12 }}>TOTAL FINIQUITO BRUTO</td>
                <td
                  style={{ textAlign: 'right', fontWeight: 800, color: '#ef4444', paddingTop: 12 }}
                >
                  ${fmt(result.totalBruto)}
                </td>
              </tr>
            </tbody>
          </table>

          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: 'var(--bg-tertiary)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--text-muted)',
              lineHeight: 1.8,
            }}
          >
            <strong>Requisitos legales para el finiquito:</strong>
            <br />
            • Debe ser firmado ante un ministro de fe (notario, inspector del trabajo, o presidente
            del sindicato)
            <br />
            • Cotizaciones previsionales deben estar al dia (Ley Bustos, Art. 162)
            <br />
            • Se debe entregar copia del finiquito al trabajador
            <br />
            • El pago debe realizarse al momento de la firma
            <br />• Plazo para pagar: 10 dias habiles desde la terminacion del contrato
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button
              style={{ ...btnPrimary, opacity: selectedEmp ? 1 : 0.5 }}
              disabled={!selectedEmp}
              onClick={() => {
                const emp = employees.find((e) => e.id === selectedEmp);
                if (!emp || !result) return;
                openDoc(
                  generateFiniquitoHTML(
                    emp,
                    result,
                    result.causalLabel,
                    pendingVacationDays,
                    avisoPrevio
                  )
                );
              }}
            >
              <Download size={16} /> Generar PDF Finiquito
            </button>
            <button
              style={{ ...btnSecondary, opacity: selectedEmp ? 1 : 0.5 }}
              disabled={!selectedEmp}
              onClick={() => {
                const emp = employees.find((e) => e.id === selectedEmp);
                if (!emp) return;
                const causalType = causal.startsWith('161') ? 'art161' : 'art159';
                openDoc(
                  generateCartaDespidoHTML(
                    emp,
                    causalType as 'art159' | 'art161',
                    '',
                    new Date().toLocaleDateString('es-CL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  )
                );
              }}
            >
              <FileText size={16} /> Generar Carta de Despido
            </button>
          </div>
        </div>
      )}

      {/* Legal reference */}
      <div className="card" style={{ padding: 16, marginTop: 20, borderLeft: '4px solid #ef4444' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>
          Causales de Termino — Referencia Rapida
        </h4>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 2 }}>
          <p>
            <strong>Art. 159:</strong> Causales objetivas — Mutuo acuerdo, renuncia, muerte,
            vencimiento plazo, conclusion obra. No generan indemnizacion salvo pacto en contrario.
          </p>
          <p>
            <strong>Art. 160:</strong> Conductas del trabajador — Falta de probidad, acoso,
            abandono, actos ilicitos. Despido sin indemnizacion. Si el tribunal declara
            injustificado, aplica recargo 80%.
          </p>
          <p>
            <strong>Art. 161:</strong> Necesidades de la empresa / desahucio — Genera indemnizacion
            por anos de servicio (1 mes x ano, tope 11). Si no se da aviso de 30 dias, se paga mes
            adicional.
          </p>
          <p>
            <strong>Art. 168:</strong> Despido injustificado — Recargo 30% (Art. 161), 50% (Art. 159
            N°4-6), 80% (Art. 160) sobre indemnizacion total.
          </p>
          <p>
            <strong>Art. 162 (Ley Bustos):</strong> Si las cotizaciones no estan al dia, el despido
            es NULO. Empleador debe seguir pagando hasta regularizar.
          </p>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// HISTORIAL DE PAGOS TAB
// ═════════════════════════════════════════════════════════════════
function HistorialPagosTab({
  payroll,
  month,
  year,
}: {
  payroll: PayrollRecord[];
  month: number;
  year: number;
}) {
  const months = [
    '',
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ];

  return (
    <div>
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3
          style={{
            margin: '0 0 16px',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Clock size={18} /> Historial de Pagos — {months[month]} {year}
        </h3>
        {payroll.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
            Sin registros de pago para este periodo.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={thStyle}>Empleado</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Bruto</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Descuentos</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Liquido</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Costo Emp.</th>
                  <th style={thStyle}>Estado</th>
                  <th style={thStyle}>Fecha Pago</th>
                </tr>
              </thead>
              <tbody>
                {payroll.map((r: PayrollRecord) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={tdStyle}>{r.employeeName}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(r.grossSalary)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#ef4444' }}>
                      -${fmt(r.totalDeductions)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>
                      ${fmt(r.netSalary)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>${fmt(r.totalEmployerCost)}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 12,
                          fontSize: 10,
                          fontWeight: 600,
                          background:
                            r.status === 'paid' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                          color: r.status === 'paid' ? '#22c55e' : '#f59e0b',
                        }}
                      >
                        {r.status === 'paid'
                          ? 'Pagado'
                          : r.status === 'approved'
                            ? 'Aprobado'
                            : 'Borrador'}
                      </span>
                    </td>
                    <td style={tdStyle}>—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// TUTORES EXTERNOS TAB
// ═════════════════════════════════════════════════════════════════
function TutoresExternosTab({ month, year }: { month: number; year: number }) {
  const [tutorSubTab, setTutorSubTab] = useState<
    'overview' | 'applications' | 'payments' | 'directory'
  >('overview');
  const [tutors, setTutors] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    api.getEmployees().catch(() => {}); // placeholder - will use tutor endpoints
  }, []);

  return (
    <div>
      {/* Header with distinct color */}
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
          Gestion de tutores con boleta de honorarios. Comision Conniku: 10%. El tutor recibe 90%
          bruto y es responsable de pagar su retencion al SII (13.75%).
        </p>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[
          { id: 'overview', label: 'Resumen' },
          { id: 'applications', label: 'Postulaciones' },
          { id: 'payments', label: 'Pagos a Tutores' },
          { id: 'directory', label: 'Directorio' },
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
            }}
          >
            {st.label}
          </button>
        ))}
      </div>

      {tutorSubTab === 'overview' && (
        <div>
          {/* Stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                Tutores Activos
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>0</div>
            </div>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                Postulaciones Pendientes
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#3b82f6' }}>0</div>
            </div>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #22c55e' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                Clases Este Mes
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#22c55e' }}>0</div>
            </div>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                Comisiones Conniku
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#8b5cf6' }}>$0</div>
            </div>
          </div>

          {/* How it works */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>
              Como Funciona el Sistema de Tutores
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {[
                {
                  step: 1,
                  title: 'Estudiante Paga',
                  desc: 'El estudiante selecciona un tutor, elige la clase y paga a traves de Conniku. Conniku retiene el 100% hasta confirmar la clase.',
                },
                {
                  step: 2,
                  title: 'Clase via Zoom',
                  desc: 'El tutor crea el link de Zoom, levanta la clase en la plataforma. El estudiante recibe la invitacion una vez confirmado el pago.',
                },
                {
                  step: 3,
                  title: 'Pago al Tutor',
                  desc: 'Confirmada la clase, el tutor sube su boleta de honorarios. Conniku paga el 90% en max 7 dias habiles. Conniku retiene 10% comision.',
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

          {/* Tutor levels */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Niveles de Tutor</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div
                style={{
                  padding: 12,
                  background: 'rgba(245,158,11,0.05)',
                  borderRadius: 8,
                  border: '1px solid #f59e0b33',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13, color: '#f59e0b' }}>Tutor Nuevo</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  0-10 clases • Tarifa limitada • Badge amarillo
                </div>
              </div>
              <div
                style={{
                  padding: 12,
                  background: 'rgba(59,130,246,0.05)',
                  borderRadius: 8,
                  border: '1px solid #3b82f633',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13, color: '#3b82f6' }}>Tutor Regular</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  11-50 clases • Tarifa libre • Badge azul
                </div>
              </div>
              <div
                style={{
                  padding: 12,
                  background: 'rgba(168,85,247,0.05)',
                  borderRadius: 8,
                  border: '1px solid #a855f733',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13, color: '#a855f7' }}>Tutor Premium</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  51+ clases • Rating 4.5+ • Prioridad busqueda
                </div>
              </div>
            </div>
          </div>

          {/* Pricing model */}
          <div className="card" style={{ padding: 20, borderLeft: '4px solid #f59e0b' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Modelo de Precios y Comisiones</h4>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 2 }}>
              <p>
                <strong>Tarifa individual:</strong> El tutor define su precio/hora libremente.
              </p>
              <p>
                <strong>Tarifas grupales:</strong> El tutor fija precio para 2, 3, 4 y 5 estudiantes
                (maximo 5 por clase).
              </p>
              <p>
                <strong>Comision Conniku:</strong> 10% fijo sobre el monto pagado por el estudiante.
              </p>
              <p>
                <strong>Ejemplo:</strong> Estudiante paga $20,000 → Conniku retiene $2,000 (10%) →
                Tutor recibe $18,000 bruto.
              </p>
              <p>
                <strong>Boleta:</strong> El tutor emite boleta de honorarios por $18,000 a nombre de
                Conniku SpA.
              </p>
              <p>
                <strong>Retencion SII:</strong> El tutor paga 13.75% al SII ($2,475). Neto tutor:
                $15,525.
              </p>
              <p>
                <strong>Frecuencia de pago:</strong> Por clase, quincenal o mensual (a eleccion del
                tutor).
              </p>
              <p>
                <strong>Plazo de pago:</strong> Maximo 7 dias habiles desde recepcion de boleta
                validada.
              </p>
            </div>
          </div>
        </div>
      )}

      {tutorSubTab === 'applications' && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <UserPlus size={48} style={{ color: '#f59e0b', marginBottom: 12 }} />
          <h3>Sin postulaciones pendientes</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Cuando un profesional solicite ser tutor, aparecera aqui para revision y aprobacion.
          </p>
          <div
            style={{
              marginTop: 16,
              padding: 16,
              background: 'var(--bg-tertiary)',
              borderRadius: 12,
              textAlign: 'left',
              maxWidth: 500,
              margin: '16px auto 0',
            }}
          >
            <h4 style={{ margin: '0 0 8px', fontSize: 13 }}>
              Documentos requeridos para aprobacion:
            </h4>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 2 }}>
              <p>• Cedula de identidad (ambos lados)</p>
              <p>• Titulo profesional o certificado alumno regular ultimo ano</p>
              <p>• Certificado de antecedentes (vigente, menos de 30 dias)</p>
              <p>• Curriculum vitae</p>
              <p>• Contrato de prestacion de servicios firmado digitalmente</p>
            </div>
          </div>
        </div>
      )}

      {tutorSubTab === 'payments' && (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Boletas Pendientes</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>0</div>
            </div>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>En Proceso</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>0</div>
            </div>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #22c55e' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pagados Este Mes</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>$0</div>
            </div>
          </div>

          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <CreditCard size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <h3>Sin pagos a tutores este periodo</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Los pagos aparecen cuando un tutor sube su boleta de honorarios despues de una clase
              confirmada.
            </p>
          </div>
        </div>
      )}

      {tutorSubTab === 'directory' && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <Users size={48} style={{ color: '#f59e0b', marginBottom: 12 }} />
          <h3>Directorio de Tutores</h3>
          <p
            style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 500, margin: '8px auto' }}
          >
            Aqui veras todos los tutores aprobados con su perfil, rating, clases dadas y estado. En
            poco estara lista la plataforma para que los tutores se inscriban.
          </p>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═════════════════════════════════════════════════════════════════
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: any;
  color: string;
}) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon size={16} style={{ color }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: 14,
        fontWeight: 700,
        marginTop: 20,
        marginBottom: 10,
        paddingBottom: 6,
        borderBottom: '2px solid var(--border)',
        color: 'var(--accent)',
      }}
    >
      {children}
    </h3>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  step,
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  step?: string;
}) {
  return (
    <div>
      <label
        style={{
          fontSize: 12,
          fontWeight: 600,
          display: 'block',
          marginBottom: 4,
          color: 'var(--text-muted)',
        }}
      >
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        step={step}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          fontSize: 13,
        }}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[] | string[];
}) {
  return (
    <div>
      <label
        style={{
          fontSize: 12,
          fontWeight: 600,
          display: 'block',
          marginBottom: 4,
          color: 'var(--text-muted)',
        }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          fontSize: 13,
        }}
      >
        {options.map((opt: any) => (
          <option key={opt.value || opt} value={opt.value || opt}>
            {opt.label || opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: highlight ? 700 : 400,
          color: highlight ? 'var(--accent)' : 'var(--text-primary)',
          marginTop: 2,
        }}
      >
        {value || '—'}
      </div>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────
const btnPrimary: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 10,
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const btnSecondary: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const btnSmall: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-secondary)',
  fontWeight: 600,
  fontSize: 11,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

const grid2: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
};

const thStyle: React.CSSProperties = {
  padding: '8px 6px',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 6px',
  fontSize: 12,
};
