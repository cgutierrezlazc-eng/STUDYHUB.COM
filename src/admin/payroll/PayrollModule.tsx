import React, { useState, useEffect } from 'react'
import { DollarSign } from 'lucide-react'
import { useAuth } from '../../services/auth'
import { api } from '../../services/api'
import { CHILE_LABOR } from '../shared/ChileLaborConstants'
import RemuneracionesTab from '../hr/RemuneracionesTab'
import PreviredTab from '../hr/PreviredTab'
import FiniquitosTab from '../hr/FiniquitosTab'
import HistorialPagosTab from '../hr/HistorialPagosTab'

const PAYROLL_SUBTABS = [
  { id: 'liquidaciones', label: 'Liquidaciones' },
  { id: 'previred', label: 'Previred' },
  { id: 'finiquitos', label: 'Finiquitos' },
  { id: 'historial', label: 'Historial de Pagos' },
]

interface PayrollModuleProps {
  onNavigate?: (path: string) => void
}

export default function PayrollModule({ onNavigate }: PayrollModuleProps) {
  const { user } = useAuth()
  const [activeSubTab, setActiveSubTab] = useState('liquidaciones')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [indicators, setIndicators] = useState<any>(null)
  const [indicatorsError, setIndicatorsError] = useState('')

  // Load Chilean economic indicators
  useEffect(() => {
    api.getChileIndicators()
      .then((data: any) => {
        setIndicators(data)
        if (data?.uf?.value) CHILE_LABOR.UF.value = Math.round(data.uf.value)
        if (data?.utm?.value) CHILE_LABOR.UTM.value = Math.round(data.utm.value)
        if (data?.imm?.value) CHILE_LABOR.IMM.current = data.imm.value
        if (data?.uf?.value) {
          CHILE_LABOR.UF.lastUpdate = new Date().toISOString().split('T')[0]
          CHILE_LABOR.UTM.lastUpdate = new Date().toISOString().split('T')[0]
        }
        setIndicatorsError('')
      })
      .catch(() => setIndicatorsError('No se pudieron cargar indicadores. Usando valores por defecto.'))
  }, [])

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <DollarSign size={28} /> PayRoll
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>
          Remuneraciones, Previred, finiquitos e historial de pagos — Legislacion Chilena
        </p>
      </div>

      {/* Indicators bar */}
      {indicators && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          <div style={{ padding: '8px 14px', background: 'var(--bg-secondary)', borderRadius: 10, fontSize: 12, whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--text-muted)' }}>UF</span> <strong>${indicators.uf?.value?.toLocaleString('es-CL', { maximumFractionDigits: 2 })}</strong>
          </div>
          <div style={{ padding: '8px 14px', background: 'var(--bg-secondary)', borderRadius: 10, fontSize: 12, whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--text-muted)' }}>UTM</span> <strong>${indicators.utm?.value?.toLocaleString('es-CL')}</strong>
          </div>
          <div style={{ padding: '8px 14px', background: 'var(--bg-secondary)', borderRadius: 10, fontSize: 12, whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--text-muted)' }}>IMM</span> <strong>${indicators.imm?.value?.toLocaleString('es-CL')}</strong>
          </div>
          <div style={{ padding: '8px 14px', background: 'var(--bg-secondary)', borderRadius: 10, fontSize: 12, whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--text-muted)' }}>Tope AFP</span> <strong>${indicators.topes?.afp_clp?.toLocaleString('es-CL')}</strong>
          </div>
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border)', paddingBottom: 8 }}>
        {PAYROLL_SUBTABS.map(st => (
          <button key={st.id} onClick={() => setActiveSubTab(st.id)} style={{
            padding: '8px 16px', borderRadius: '8px 8px 0 0', border: 'none',
            background: activeSubTab === st.id ? 'var(--accent)' : 'transparent',
            color: activeSubTab === st.id ? '#fff' : 'var(--text-muted)',
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>
            {st.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeSubTab === 'liquidaciones' && (
        <RemuneracionesTab month={selectedMonth} year={selectedYear} />
      )}
      {activeSubTab === 'previred' && (
        <PreviredTab month={selectedMonth} year={selectedYear} />
      )}
      {activeSubTab === 'finiquitos' && (
        <FiniquitosTab />
      )}
      {activeSubTab === 'historial' && (
        <HistorialPagosTab month={selectedMonth} year={selectedYear} />
      )}
    </div>
  )
}
