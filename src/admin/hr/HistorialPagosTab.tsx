import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { PayrollRecord } from '../shared/types';
import { api } from '../../services/api';
import { useAuth } from '../../services/auth';
import { thStyle, tdStyle, fmt } from '../shared/styles';

// ═════════════════════════════════════════════════════════════════
// HISTORIAL DE PAGOS TAB
// ═════════════════════════════════════════════════════════════════
interface HistorialPagosTabProps {
  month?: number;
  year?: number;
}

export default function HistorialPagosTab({
  month: propMonth,
  year: propYear,
}: HistorialPagosTabProps) {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(propMonth ?? new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(propYear ?? new Date().getFullYear());
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(false);

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

  const loadPayroll = async () => {
    setLoading(true);
    try {
      const data = await api.getPayroll(selectedYear, selectedMonth);
      setPayroll(data || []);
    } catch {
      setPayroll([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPayroll();
  }, [selectedMonth, selectedYear]);

  // Sync with prop changes
  useEffect(() => {
    if (propMonth !== undefined) setSelectedMonth(propMonth);
  }, [propMonth]);
  useEffect(() => {
    if (propYear !== undefined) setSelectedYear(propYear);
  }, [propYear]);

  return (
    <div>
      {/* Period Selector */}
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
          <Clock size={18} /> Historial de Pagos — {months[selectedMonth]} {selectedYear}
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
                    <td style={tdStyle}>{'\u2014'}</td>
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
