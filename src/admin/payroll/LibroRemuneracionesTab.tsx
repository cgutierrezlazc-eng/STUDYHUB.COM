import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Download,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Users,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../services/auth';
import { api } from '../../services/api';
import { CHILE_LABOR } from '../shared/ChileLaborConstants';
import { AFP_OPTIONS } from '../shared/constants';
import {
  btnPrimary,
  btnSecondary,
  btnSmall,
  thStyle,
  tdStyle,
  inputStyle,
  selectStyle,
  fmt,
} from '../shared/styles';
import type { Employee, PayrollRecord } from '../shared/types';

// ─── LRE Column definitions per DT format ──────────────────────
// Resolución Exenta DT N°31, columnas obligatorias del LRE
const LRE_COLUMNS = [
  'RUT',
  'Nombre',
  'Cargo',
  'Fecha Ingreso',
  'Días Trabajados',
  'Sueldo Base',
  'Gratificación',
  'Horas Extra',
  'Monto HE',
  'Bonos/Comisiones',
  'Total Haberes Imponibles',
  'Colación',
  'Movilización',
  'Total Haberes No Imponibles',
  'AFP',
  '% AFP',
  'Monto AFP',
  'Salud',
  'Monto Salud',
  'AFC Trabajador',
  'Impuesto Único',
  'Total Descuentos Legales',
  'Otros Descuentos',
  'Total Descuentos',
  'Líquido a Pagar',
  'AFC Empleador',
  'SIS',
  'Mutual',
  'Total Costo Empleador',
];

interface LRERow {
  rut: string;
  name: string;
  position: string;
  hireDate: string;
  daysWorked: number;
  baseSalary: number;
  gratificacion: number;
  overtimeHours: number;
  overtimeAmount: number;
  bonuses: number;
  totalImponible: number;
  colacion: number;
  movilizacion: number;
  totalNoImponible: number;
  afpName: string;
  afpRate: number;
  afpAmount: number;
  healthSystem: string;
  healthAmount: number;
  afcEmployee: number;
  taxAmount: number;
  totalLegalDeductions: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  afcEmployer: number;
  sisAmount: number;
  mutualAmount: number;
  totalEmployerCost: number;
}

interface LREPeriod {
  month: number;
  year: number;
  rows: LRERow[];
  totals: Record<string, number>;
  generatedAt: string;
  status: 'borrador' | 'cerrado';
}

const MONTHS = [
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

export default function LibroRemuneracionesTab() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'libro' | 'historial' | 'config'>('libro');
  const [lreHistory, setLreHistory] = useState<LREPeriod[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);

  // Load data
  useEffect(() => {
    setLoading(true);
    Promise.all([api.getEmployees().catch(() => []), Promise.resolve([])]).then(
      ([emps, records]) => {
        setEmployees(emps || []);
        setPayrollRecords(records || []);
        setLoading(false);
      }
    );
  }, [selectedMonth, selectedYear]);

  // Datos reales de la API — sin fallback demo
  const demoEmployees: Employee[] = useMemo(() => {
    return employees;
  }, [employees]);

  // Calculate LRE rows from employee + payroll data
  const lreRows: LRERow[] = useMemo(() => {
    const activeEmps = demoEmployees.filter((e) => e.status === 'active');
    return activeEmps.map((emp) => {
      const afpInfo = AFP_OPTIONS.find((a) => a.value === emp.afp);
      const afpRate = afpInfo?.rate ?? 0.1144;
      const gratificacion = Math.min(
        Math.round(emp.grossSalary * CHILE_LABOR.GRATIFICACION.rate),
        CHILE_LABOR.GRATIFICACION.topeMensual
      );
      const totalImponible = emp.grossSalary + gratificacion;
      const afpAmount = Math.round(Math.min(totalImponible, CHILE_LABOR.TOPES.afpCLP) * afpRate);
      const healthAmount = Math.round(Math.min(totalImponible, CHILE_LABOR.TOPES.saludCLP) * 0.07);
      const afcRate = emp.contractType === 'indefinido' ? CHILE_LABOR.AFC.employeeRate : 0;
      const afcEmployee = Math.round(Math.min(totalImponible, CHILE_LABOR.TOPES.afcCLP) * afcRate);

      // Tax calculation
      const taxableBase = totalImponible - afpAmount - healthAmount - afcEmployee;
      const taxInUTM = taxableBase / CHILE_LABOR.UTM.value;
      const bracket = CHILE_LABOR.TAX_BRACKETS.find((b) => taxInUTM >= b.from && taxInUTM < b.to);
      const taxAmount = bracket
        ? Math.max(
            0,
            Math.round(
              taxInUTM * bracket.rate * CHILE_LABOR.UTM.value -
                bracket.deduction * CHILE_LABOR.UTM.value
            )
          )
        : 0;

      const totalLegalDeductions = afpAmount + healthAmount + afcEmployee + taxAmount;
      const totalDeductions = totalLegalDeductions;
      const netSalary = totalImponible + emp.colacion + emp.movilizacion - totalDeductions;

      // Employer costs
      const afcEmployerRate =
        emp.contractType === 'indefinido'
          ? CHILE_LABOR.AFC.employerIndefinido
          : CHILE_LABOR.AFC.employerPlazoFijo;
      const afcEmployer = Math.round(
        Math.min(totalImponible, CHILE_LABOR.TOPES.afcCLP) * afcEmployerRate
      );
      const sisAmount = Math.round(totalImponible * CHILE_LABOR.SIS.rate);
      const mutualAmount = Math.round(totalImponible * CHILE_LABOR.MUTUAL.baseRate);
      const totalEmployerCost =
        totalImponible + emp.colacion + emp.movilizacion + afcEmployer + sisAmount + mutualAmount;

      return {
        rut: emp.rut,
        name: `${emp.firstName} ${emp.lastName}`,
        position: emp.position,
        hireDate: emp.hireDate,
        daysWorked: 30,
        baseSalary: emp.grossSalary,
        gratificacion,
        overtimeHours: 0,
        overtimeAmount: 0,
        bonuses: 0,
        totalImponible,
        colacion: emp.colacion,
        movilizacion: emp.movilizacion,
        totalNoImponible: emp.colacion + emp.movilizacion,
        afpName: emp.afp,
        afpRate,
        afpAmount,
        healthSystem: emp.healthSystem,
        healthAmount,
        afcEmployee,
        taxAmount,
        totalLegalDeductions,
        otherDeductions: 0,
        totalDeductions,
        netSalary,
        afcEmployer,
        sisAmount,
        mutualAmount,
        totalEmployerCost,
      };
    });
  }, [demoEmployees]);

  // Totals
  const totals = useMemo(() => {
    const t = {
      baseSalary: 0,
      gratificacion: 0,
      overtimeAmount: 0,
      bonuses: 0,
      totalImponible: 0,
      colacion: 0,
      movilizacion: 0,
      totalNoImponible: 0,
      afpAmount: 0,
      healthAmount: 0,
      afcEmployee: 0,
      taxAmount: 0,
      totalLegalDeductions: 0,
      otherDeductions: 0,
      totalDeductions: 0,
      netSalary: 0,
      afcEmployer: 0,
      sisAmount: 0,
      mutualAmount: 0,
      totalEmployerCost: 0,
    };
    lreRows.forEach((r) => {
      t.baseSalary += r.baseSalary;
      t.gratificacion += r.gratificacion;
      t.overtimeAmount += r.overtimeAmount;
      t.bonuses += r.bonuses;
      t.totalImponible += r.totalImponible;
      t.colacion += r.colacion;
      t.movilizacion += r.movilizacion;
      t.totalNoImponible += r.totalNoImponible;
      t.afpAmount += r.afpAmount;
      t.healthAmount += r.healthAmount;
      t.afcEmployee += r.afcEmployee;
      t.taxAmount += r.taxAmount;
      t.totalLegalDeductions += r.totalLegalDeductions;
      t.otherDeductions += r.otherDeductions;
      t.totalDeductions += r.totalDeductions;
      t.netSalary += r.netSalary;
      t.afcEmployer += r.afcEmployer;
      t.sisAmount += r.sisAmount;
      t.mutualAmount += r.mutualAmount;
      t.totalEmployerCost += r.totalEmployerCost;
    });
    return t;
  }, [lreRows]);

  // CSV Export for DT upload
  const generateCSV = () => {
    const separator = ';';
    const headers = LRE_COLUMNS.join(separator);
    const rows = lreRows.map((r) =>
      [
        r.rut,
        r.name,
        r.position,
        r.hireDate,
        r.daysWorked,
        r.baseSalary,
        r.gratificacion,
        r.overtimeHours,
        r.overtimeAmount,
        r.bonuses,
        r.totalImponible,
        r.colacion,
        r.movilizacion,
        r.totalNoImponible,
        r.afpName,
        (r.afpRate * 100).toFixed(2),
        r.afpAmount,
        r.healthSystem,
        r.healthAmount,
        r.afcEmployee,
        r.taxAmount,
        r.totalLegalDeductions,
        r.otherDeductions,
        r.totalDeductions,
        r.netSalary,
        r.afcEmployer,
        r.sisAmount,
        r.mutualAmount,
        r.totalEmployerCost,
      ].join(separator)
    );

    const totalsRow = [
      'TOTALES',
      '',
      '',
      '',
      '',
      totals.baseSalary,
      totals.gratificacion,
      '',
      totals.overtimeAmount,
      totals.bonuses,
      totals.totalImponible,
      totals.colacion,
      totals.movilizacion,
      totals.totalNoImponible,
      '',
      '',
      totals.afpAmount,
      '',
      totals.healthAmount,
      totals.afcEmployee,
      totals.taxAmount,
      totals.totalLegalDeductions,
      totals.otherDeductions,
      totals.totalDeductions,
      totals.netSalary,
      totals.afcEmployer,
      totals.sisAmount,
      totals.mutualAmount,
      totals.totalEmployerCost,
    ].join(separator);

    const csv = [headers, ...rows, totalsRow].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LRE_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate printable HTML
  const generatePrintHTML = () => {
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Libro de Remuneraciones — ${MONTHS[selectedMonth - 1]} ${selectedYear}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 10px; margin: 20px; }
  h1 { font-size: 16px; margin-bottom: 4px; }
  h2 { font-size: 12px; color: #666; margin-top: 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th { background: #f0f0f0; padding: 4px 6px; border: 1px solid #ccc; font-size: 9px; text-align: right; }
  td { padding: 4px 6px; border: 1px solid #ddd; text-align: right; font-size: 9px; }
  td:nth-child(1), td:nth-child(2), td:nth-child(3), th:nth-child(1), th:nth-child(2), th:nth-child(3) { text-align: left; }
  .totals td { font-weight: bold; background: #f9f9f9; border-top: 2px solid #333; }
  .footer { margin-top: 40px; font-size: 10px; color: #666; display: flex; justify-content: space-between; }
  .signature { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 4px; }
  @media print { body { margin: 10px; } }
</style></head><body>
<h1>LIBRO DE REMUNERACIONES ELECTRÓNICO</h1>
<h2>Conniku SpA — RUT: 77.XXX.XXX-X — ${MONTHS[selectedMonth - 1]} ${selectedYear}</h2>
<table>
<thead><tr>${LRE_COLUMNS.map((c) => `<th>${c}</th>`).join('')}</tr></thead>
<tbody>
${lreRows
  .map(
    (r) => `<tr>
  <td>${r.rut}</td><td>${r.name}</td><td>${r.position}</td><td>${r.hireDate}</td><td>${r.daysWorked}</td>
  <td>${fmt(r.baseSalary)}</td><td>${fmt(r.gratificacion)}</td><td>${r.overtimeHours}</td><td>${fmt(r.overtimeAmount)}</td>
  <td>${fmt(r.bonuses)}</td><td>${fmt(r.totalImponible)}</td>
  <td>${fmt(r.colacion)}</td><td>${fmt(r.movilizacion)}</td><td>${fmt(r.totalNoImponible)}</td>
  <td>${r.afpName}</td><td>${(r.afpRate * 100).toFixed(2)}%</td><td>${fmt(r.afpAmount)}</td>
  <td>${r.healthSystem}</td><td>${fmt(r.healthAmount)}</td>
  <td>${fmt(r.afcEmployee)}</td><td>${fmt(r.taxAmount)}</td><td>${fmt(r.totalLegalDeductions)}</td>
  <td>${fmt(r.otherDeductions)}</td><td>${fmt(r.totalDeductions)}</td>
  <td><strong>${fmt(r.netSalary)}</strong></td>
  <td>${fmt(r.afcEmployer)}</td><td>${fmt(r.sisAmount)}</td><td>${fmt(r.mutualAmount)}</td><td>${fmt(r.totalEmployerCost)}</td>
</tr>`
  )
  .join('')}
<tr class="totals">
  <td colspan="5">TOTALES</td>
  <td>${fmt(totals.baseSalary)}</td><td>${fmt(totals.gratificacion)}</td><td></td><td>${fmt(totals.overtimeAmount)}</td>
  <td>${fmt(totals.bonuses)}</td><td>${fmt(totals.totalImponible)}</td>
  <td>${fmt(totals.colacion)}</td><td>${fmt(totals.movilizacion)}</td><td>${fmt(totals.totalNoImponible)}</td>
  <td colspan="2"></td><td>${fmt(totals.afpAmount)}</td>
  <td></td><td>${fmt(totals.healthAmount)}</td>
  <td>${fmt(totals.afcEmployee)}</td><td>${fmt(totals.taxAmount)}</td><td>${fmt(totals.totalLegalDeductions)}</td>
  <td>${fmt(totals.otherDeductions)}</td><td>${fmt(totals.totalDeductions)}</td>
  <td><strong>${fmt(totals.netSalary)}</strong></td>
  <td>${fmt(totals.afcEmployer)}</td><td>${fmt(totals.sisAmount)}</td><td>${fmt(totals.mutualAmount)}</td><td>${fmt(totals.totalEmployerCost)}</td>
</tr>
</tbody></table>
<div class="footer">
  <div class="signature">Firma Empleador</div>
  <div style="text-align:right">Generado: ${new Date().toLocaleString('es-CL')}<br>Conniku SpA — Sistema de Remuneraciones</div>
</div>
</body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Acceso restringido
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1600, margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <BookOpen size={26} /> Libro de Remuneraciones Electrónico
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>
            Resolución Exenta DT N°31 — Obligatorio para empresas con 5+ trabajadores
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(+e.target.value)}
            style={{ ...selectStyle, width: 140 }}
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(+e.target.value)}
            style={{ ...selectStyle, width: 100 }}
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

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
        {[
          { id: 'libro' as const, label: 'Libro del Período', icon: <BookOpen size={14} /> },
          { id: 'historial' as const, label: 'Historial LRE', icon: <Calendar size={14} /> },
          { id: 'config' as const, label: 'Configuración', icon: <FileText size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeView === tab.id ? 'var(--accent)' : 'transparent',
              color: activeView === tab.id ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      {activeView === 'libro' && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
              marginBottom: 20,
            }}
          >
            {[
              { label: 'Trabajadores', value: lreRows.length.toString(), color: 'var(--accent)' },
              {
                label: 'Total Imponibles',
                value: `$${fmt(totals.totalImponible)}`,
                color: '#10b981',
              },
              {
                label: 'Total Descuentos',
                value: `$${fmt(totals.totalDeductions)}`,
                color: '#ef4444',
              },
              { label: 'Total Líquido', value: `$${fmt(totals.netSalary)}`, color: '#3b82f6' },
              {
                label: 'Costo Empleador',
                value: `$${fmt(totals.totalEmployerCost)}`,
                color: '#8b5cf6',
              },
            ].map((card, i) => (
              <div
                key={i}
                style={{
                  padding: '16px 20px',
                  borderRadius: 14,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginBottom: 4,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {card.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: card.color }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Legal notice */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              marginBottom: 16,
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 12,
              color: 'var(--text-secondary)',
            }}
          >
            <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
            <span>
              <strong>Obligación legal:</strong> Las empresas con 5 o más trabajadores deben llevar
              LRE y tenerlo disponible para fiscalización de la Dirección del Trabajo. El archivo
              CSV generado es compatible con el formato requerido por la DT.
            </span>
          </div>

          {/* Export buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button onClick={generateCSV} style={btnPrimary}>
              <Download size={14} /> Exportar CSV (DT)
            </button>
            <button onClick={generatePrintHTML} style={btnSecondary}>
              <FileText size={14} /> Vista Imprimible
            </button>
          </div>

          {/* Main table */}
          <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 2000 }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <th
                    style={{
                      ...thStyle,
                      position: 'sticky',
                      left: 0,
                      background: 'var(--bg-secondary)',
                      zIndex: 2,
                      minWidth: 100,
                    }}
                  >
                    RUT
                  </th>
                  <th
                    style={{
                      ...thStyle,
                      position: 'sticky',
                      left: 100,
                      background: 'var(--bg-secondary)',
                      zIndex: 2,
                      minWidth: 160,
                    }}
                  >
                    Nombre
                  </th>
                  <th style={{ ...thStyle, minWidth: 120 }}>Cargo</th>
                  <th style={thStyle}>Días</th>
                  <th style={{ ...thStyle, background: '#e0f2fe33' }}>Sueldo Base</th>
                  <th style={{ ...thStyle, background: '#e0f2fe33' }}>Gratificación</th>
                  <th style={{ ...thStyle, background: '#e0f2fe33' }}>HE Hrs</th>
                  <th style={{ ...thStyle, background: '#e0f2fe33' }}>HE Monto</th>
                  <th style={{ ...thStyle, background: '#e0f2fe33' }}>Bonos</th>
                  <th style={{ ...thStyle, background: '#d1fae544', fontWeight: 800 }}>
                    Total Imp.
                  </th>
                  <th style={thStyle}>Colación</th>
                  <th style={thStyle}>Moviliz.</th>
                  <th style={{ ...thStyle, fontWeight: 800 }}>Total No Imp.</th>
                  <th style={{ ...thStyle, background: '#fef3c733' }}>AFP</th>
                  <th style={{ ...thStyle, background: '#fef3c733' }}>% AFP</th>
                  <th style={{ ...thStyle, background: '#fef3c733' }}>Monto AFP</th>
                  <th style={{ ...thStyle, background: '#fef3c733' }}>Salud</th>
                  <th style={{ ...thStyle, background: '#fef3c733' }}>Mto. Salud</th>
                  <th style={{ ...thStyle, background: '#fef3c733' }}>AFC Trab.</th>
                  <th style={{ ...thStyle, background: '#fef3c733' }}>Impuesto</th>
                  <th style={{ ...thStyle, background: '#fee2e233', fontWeight: 800 }}>
                    Total Desc.
                  </th>
                  <th style={{ ...thStyle, background: '#d1fae577', fontWeight: 800 }}>Líquido</th>
                  <th style={{ ...thStyle, background: '#ede9fe44' }}>AFC Empl.</th>
                  <th style={{ ...thStyle, background: '#ede9fe44' }}>SIS</th>
                  <th style={{ ...thStyle, background: '#ede9fe44' }}>Mutual</th>
                  <th style={{ ...thStyle, background: '#ede9fe44', fontWeight: 800 }}>
                    Costo Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {lreRows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td
                      style={{
                        ...tdStyle,
                        position: 'sticky',
                        left: 0,
                        background: 'var(--bg-primary)',
                        zIndex: 1,
                        fontFamily: 'monospace',
                        fontSize: 11,
                      }}
                    >
                      {r.rut}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        position: 'sticky',
                        left: 100,
                        background: 'var(--bg-primary)',
                        zIndex: 1,
                        fontWeight: 600,
                      }}
                    >
                      {r.name}
                    </td>
                    <td style={{ ...tdStyle, fontSize: 11, color: 'var(--text-muted)' }}>
                      {r.position}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{r.daysWorked}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(r.baseSalary)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(r.gratificacion)}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{r.overtimeHours}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(r.overtimeAmount)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(r.bonuses)}</td>
                    <td
                      style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#10b981' }}
                    >
                      {fmt(r.totalImponible)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(r.colacion)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(r.movilizacion)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>
                      {fmt(r.totalNoImponible)}
                    </td>
                    <td style={{ ...tdStyle, fontSize: 11 }}>{r.afpName}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontSize: 11 }}>
                      {(r.afpRate * 100).toFixed(2)}%
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(r.afpAmount)}</td>
                    <td style={{ ...tdStyle, fontSize: 11 }}>{r.healthSystem}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(r.healthAmount)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(r.afcEmployee)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(r.taxAmount)}</td>
                    <td
                      style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#ef4444' }}
                    >
                      {fmt(r.totalDeductions)}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        textAlign: 'right',
                        fontWeight: 800,
                        color: '#3b82f6',
                        fontSize: 13,
                      }}
                    >
                      {fmt(r.netSalary)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(r.afcEmployer)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(r.sisAmount)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(r.mutualAmount)}</td>
                    <td
                      style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#8b5cf6' }}
                    >
                      {fmt(r.totalEmployerCost)}
                    </td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr
                  style={{
                    background: 'var(--bg-secondary)',
                    borderTop: '3px solid var(--border)',
                  }}
                >
                  <td
                    colSpan={4}
                    style={{
                      ...tdStyle,
                      fontWeight: 800,
                      fontSize: 13,
                      position: 'sticky',
                      left: 0,
                      background: 'var(--bg-secondary)',
                      zIndex: 1,
                    }}
                  >
                    TOTALES ({lreRows.length} trabajadores)
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>
                    {fmt(totals.baseSalary)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>
                    {fmt(totals.gratificacion)}
                  </td>
                  <td style={tdStyle}></td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>
                    {fmt(totals.overtimeAmount)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>
                    {fmt(totals.bonuses)}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: 'right',
                      fontWeight: 800,
                      color: '#10b981',
                      fontSize: 13,
                    }}
                  >
                    {fmt(totals.totalImponible)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>
                    {fmt(totals.colacion)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>
                    {fmt(totals.movilizacion)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>
                    {fmt(totals.totalNoImponible)}
                  </td>
                  <td colSpan={2} style={tdStyle}></td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>
                    {fmt(totals.afpAmount)}
                  </td>
                  <td style={tdStyle}></td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>
                    {fmt(totals.healthAmount)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>
                    {fmt(totals.afcEmployee)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>
                    {fmt(totals.taxAmount)}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: 'right',
                      fontWeight: 800,
                      color: '#ef4444',
                      fontSize: 13,
                    }}
                  >
                    {fmt(totals.totalDeductions)}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: 'right',
                      fontWeight: 800,
                      color: '#3b82f6',
                      fontSize: 14,
                    }}
                  >
                    {fmt(totals.netSalary)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>
                    {fmt(totals.afcEmployer)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>
                    {fmt(totals.sisAmount)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>
                    {fmt(totals.mutualAmount)}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: 'right',
                      fontWeight: 800,
                      color: '#8b5cf6',
                      fontSize: 13,
                    }}
                  >
                    {fmt(totals.totalEmployerCost)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* History Tab */}
      {activeView === 'historial' && (
        <div>
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              borderRadius: 14,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            <Calendar size={48} color="var(--text-muted)" style={{ marginBottom: 12 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>
              Historial de Períodos
            </h3>
            <p
              style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 400, margin: '0 auto' }}
            >
              Aquí podrás ver todos los libros de remuneraciones generados y cerrados por período.
              Los períodos cerrados no pueden ser modificados y quedan como respaldo legal.
            </p>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 12 }}>
              {['2026-03', '2026-02', '2026-01', '2025-12'].map((period) => (
                <div
                  key={period}
                  style={{
                    padding: '12px 20px',
                    borderRadius: 10,
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{period}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    <CheckCircle size={10} style={{ marginRight: 4, color: '#10b981' }} />
                    Cerrado
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Config Tab */}
      {activeView === 'config' && (
        <div style={{ maxWidth: 600 }}>
          <div
            style={{
              padding: 24,
              borderRadius: 14,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              marginBottom: 16,
            }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                margin: '0 0 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <FileText size={18} /> Datos de la Empresa
            </h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                { label: 'Razón Social', value: 'Conniku SpA' },
                { label: 'RUT Empresa', value: '77.XXX.XXX-X' },
                { label: 'Representante Legal', value: 'Cristian G.' },
                { label: 'Dirección', value: 'Santiago, Chile' },
                { label: 'Giro', value: 'Desarrollo de Software y Plataformas Educativas' },
                { label: 'Mutualidad', value: 'IST (Instituto de Seguridad del Trabajo)' },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: 24,
              borderRadius: 14,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>
              Formato de Exportación
            </h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <input type="radio" name="format" value="csv" defaultChecked /> CSV (Dirección del
                Trabajo)
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <input type="radio" name="format" value="xlsx" /> XLSX (Excel)
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <input type="radio" name="format" value="pdf" /> PDF (Impresión)
              </label>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
              El formato CSV con separador punto y coma (;) es el requerido por la Dirección del
              Trabajo para la carga del LRE.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
