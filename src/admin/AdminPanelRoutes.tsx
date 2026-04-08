import React, { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import AdminShell from './AdminShell'

// ─── Lazy-loaded admin modules ─────────────────────────────────
const AdminPanel = lazy(() => import('./AdminPanel'))

// HR & People
const PersonalTab = lazy(() => import('./hr/PersonalTab'))
const ContratosTab = lazy(() => import('./hr/ContratosTab'))
const AsistenciaTab = lazy(() => import('./hr/AsistenciaTab'))
const VacacionesTab = lazy(() => import('./hr/VacacionesTab'))

// Payroll
const PayrollModule = lazy(() => import('./payroll/PayrollModule'))
const RemuneracionesTab = lazy(() => import('./hr/RemuneracionesTab'))
const PreviredTab = lazy(() => import('./hr/PreviredTab'))
const FiniquitosTab = lazy(() => import('./hr/FiniquitosTab'))
const HistorialPagosTab = lazy(() => import('./hr/HistorialPagosTab'))
const LibroRemuneracionesTab = lazy(() => import('./payroll/LibroRemuneracionesTab'))
const DJ1887Tab = lazy(() => import('./payroll/DJ1887Tab'))
const ImpuestosTab = lazy(() => import('./finance/ImpuestosTab'))
const InspeccionTrabajoTab = lazy(() => import('./hr/InspeccionTrabajoTab'))

// Finance
const CeoOverview = lazy(() => import('./finance/CeoOverview'))
const FinancialTab = lazy(() => import('./finance/FinancialTab'))
const GastosTab = lazy(() => import('./finance/GastosTab'))
const ContabilidadTab = lazy(() => import('./finance/ContabilidadTab'))
const FacturacionTab = lazy(() => import('./finance/FacturacionTab'))
const PresupuestosTab = lazy(() => import('./finance/PresupuestosTab'))

// Legal
const LegalTab = lazy(() => import('./legal/LegalTab'))
const FraudTab = lazy(() => import('./legal/FraudTab'))
const ComplianceTab = lazy(() => import('./legal/ComplianceTab'))

// Tools
const CeoEmailModule = lazy(() => import('./tools/CeoEmailModule'))
const ContactoEmailModule = lazy(() => import('./tools/ContactoEmailModule'))
const CertificationsModule = lazy(() => import('./tools/CertificationsModule'))
const TutoresExternosTab = lazy(() => import('./tools/TutoresExternosTab'))
const OwnerGuideTab = lazy(() => import('./tools/OwnerGuideTab'))
const AIWorkflowsModule = lazy(() => import('../pages/AIWorkflows'))

function Loader() {
  return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
      <div className="skeleton skeleton-text" style={{ width: '60%', margin: '0 auto' }} />
      <div className="skeleton skeleton-text" style={{ width: '40%', margin: '8px auto 0' }} />
    </div>
  )
}

function Wrap({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <AdminShell title={title}>
      <Suspense fallback={<Loader />}>
        {children}
      </Suspense>
    </AdminShell>
  )
}

interface Props {
  onNavigate: (path: string) => void
}

export default function AdminPanelRoutes({ onNavigate }: Props) {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Main grid launcher */}
        <Route index element={<AdminPanel onNavigate={onNavigate} />} />

        {/* HR & People */}
        <Route path="hr/personal" element={<Wrap title="Directorio de Personal"><PersonalTab /></Wrap>} />
        <Route path="hr/contratos" element={<Wrap title="Contratos y Vida Laboral"><ContratosTab /></Wrap>} />
        <Route path="hr/asistencia" element={<Wrap title="Asistencia y Jornada"><AsistenciaTab /></Wrap>} />
        <Route path="hr/vacaciones" element={<Wrap title="Vacaciones y Permisos"><VacacionesTab /></Wrap>} />

        {/* Payroll & Legal */}
        <Route path="payroll" element={<Wrap title="Remuneraciones"><PayrollModule /></Wrap>} />
        <Route path="payroll/liquidaciones" element={<Wrap title="Liquidaciones"><RemuneracionesTab /></Wrap>} />
        <Route path="payroll/previred" element={<Wrap title="Previred"><PreviredTab /></Wrap>} />
        <Route path="payroll/finiquitos" element={<Wrap title="Finiquitos"><FiniquitosTab /></Wrap>} />
        <Route path="payroll/historial" element={<Wrap title="Historial de Pagos"><HistorialPagosTab /></Wrap>} />
        <Route path="payroll/libro-rem" element={<Wrap title="Libro de Remuneraciones"><LibroRemuneracionesTab /></Wrap>} />
        <Route path="payroll/dj1887" element={<Wrap title="DJ1887"><DJ1887Tab /></Wrap>} />
        <Route path="payroll/impuestos" element={<Wrap title="Impuestos / F129"><ImpuestosTab /></Wrap>} />
        <Route path="payroll/inspeccion" element={<Wrap title="Inspección del Trabajo"><InspeccionTrabajoTab /></Wrap>} />

        {/* Finance & Admin */}
        <Route path="finance/dashboard" element={<Wrap title="Dashboard Ejecutivo"><CeoOverview onNavigate={onNavigate} /></Wrap>} />
        <Route path="finance/financiero" element={<Wrap title="Panel Financiero"><FinancialTab /></Wrap>} />
        <Route path="finance/gastos" element={<Wrap title="Gastos Operacionales"><GastosTab /></Wrap>} />
        <Route path="finance/contabilidad" element={<Wrap title="Contabilidad"><ContabilidadTab /></Wrap>} />
        <Route path="finance/facturacion" element={<Wrap title="Facturación / DTE"><FacturacionTab /></Wrap>} />
        <Route path="finance/presupuestos" element={<Wrap title="Presupuestos"><PresupuestosTab /></Wrap>} />

        {/* Legal & Compliance */}
        <Route path="legal/compliance" element={<Wrap title="Legal y Compliance"><LegalTab /></Wrap>} />
        <Route path="legal/fraude" element={<Wrap title="Anti-Fraude"><FraudTab /></Wrap>} />

        {/* Tools */}
        <Route path="tools/email-ceo" element={<Wrap title="Email CEO"><CeoEmailModule onNavigate={onNavigate} /></Wrap>} />
        <Route path="tools/email-contacto" element={<Wrap title="Email Contacto"><ContactoEmailModule onNavigate={onNavigate} /></Wrap>} />
        <Route path="tools/certificaciones" element={<Wrap title="Certificaciones"><CertificationsModule /></Wrap>} />
        <Route path="tools/ai-workflows" element={<Wrap title="IA Workflows"><AIWorkflowsModule onNavigate={onNavigate} /></Wrap>} />
        <Route path="tools/tutores" element={<Wrap title="Tutores Externos"><TutoresExternosTab /></Wrap>} />
        <Route path="tools/guia-owner" element={<Wrap title="Guía del Owner"><OwnerGuideTab /></Wrap>} />
      </Routes>
    </Suspense>
  )
}
