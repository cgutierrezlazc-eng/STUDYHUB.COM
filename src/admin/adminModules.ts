import type { AdminModule } from './shared/types'

export const ADMIN_MODULES: AdminModule[] = [
  // ─── HR & People ─────────────────────────────────────
  { id: 'personal', label: 'Directorio de Personal', description: 'Gestiona colaboradores, datos personales y contratos', icon: '👥', category: 'hr', route: '/admin-panel/hr/personal', status: 'active' },
  { id: 'contratos', label: 'Contratos y Vida Laboral', description: 'Ciclo de vida del contrato, renovaciones y progresión', icon: '📋', category: 'hr', route: '/admin-panel/hr/contratos', status: 'active' },
  { id: 'asistencia', label: 'Asistencia y Jornada', description: 'Control horario, horas extra, Art. 22', icon: '⏱️', category: 'hr', route: '/admin-panel/hr/asistencia', status: 'active', isNew: true },
  { id: 'vacaciones', label: 'Vacaciones y Permisos', description: 'Saldos, solicitudes, permisos legales', icon: '🏖️', category: 'hr', route: '/admin-panel/hr/vacaciones', status: 'active', isNew: true },
  { id: 'onboarding-hr', label: 'Onboarding / Offboarding', description: 'Checklists de ingreso y salida', icon: '🚀', category: 'hr', route: '/admin-panel/hr/onboarding', status: 'coming-soon', isNew: true },
  { id: 'documentos', label: 'Documentos del Trabajador', description: 'Bóveda digital de documentos laborales', icon: '📁', category: 'hr', route: '/admin-panel/hr/documentos', status: 'coming-soon', isNew: true },
  { id: 'desempeno', label: 'Evaluación de Desempeño', description: 'Metas, KRAs y ciclos de evaluación', icon: '⭐', category: 'hr', route: '/admin-panel/hr/desempeno', status: 'coming-soon', isNew: true },
  { id: 'reclutamiento', label: 'Reclutamiento', description: 'Pipeline de contratación y postulaciones', icon: '🎯', category: 'hr', route: '/admin-panel/hr/reclutamiento', status: 'coming-soon', isNew: true },
  { id: 'capacitacion', label: 'Capacitación / SENCE', description: 'Registro de capacitaciones y franquicia SENCE', icon: '📚', category: 'hr', route: '/admin-panel/hr/capacitacion', status: 'coming-soon', isNew: true },

  // ─── Payroll & Legal ──────────────────────────────────
  { id: 'liquidaciones', label: 'Liquidaciones', description: 'Cálculo y emisión de liquidaciones de sueldo', icon: '💰', category: 'payroll', route: '/admin-panel/payroll/liquidaciones', status: 'active' },
  { id: 'previred', label: 'Previred', description: 'Declaración de cotizaciones previsionales', icon: '🏦', category: 'payroll', route: '/admin-panel/payroll/previred', status: 'active' },
  { id: 'finiquitos', label: 'Finiquitos', description: 'Cálculo de finiquitos y desvinculación', icon: '📄', category: 'payroll', route: '/admin-panel/payroll/finiquitos', status: 'active' },
  { id: 'historial-pagos', label: 'Historial de Pagos', description: 'Registro histórico de todas las remuneraciones', icon: '📊', category: 'payroll', route: '/admin-panel/payroll/historial', status: 'active' },
  { id: 'libro-rem', label: 'Libro de Remuneraciones', description: 'Libro de Remuneraciones Electrónico (DT)', icon: '📒', category: 'payroll', route: '/admin-panel/payroll/libro-rem', status: 'active', isNew: true },
  { id: 'dj1887', label: 'DJ1887', description: 'Declaración Jurada 1887 anual (SII)', icon: '📑', category: 'payroll', route: '/admin-panel/payroll/dj1887', status: 'active', isNew: true },
  { id: 'impuestos', label: 'Impuestos / F129', description: 'Formulario 129 y reportes tributarios', icon: '🧾', category: 'payroll', route: '/admin-panel/payroll/impuestos', status: 'active' },
  { id: 'inspeccion', label: 'Inspección del Trabajo', description: 'Compliance laboral y checklist inspección', icon: '🛡️', category: 'payroll', route: '/admin-panel/payroll/inspeccion', status: 'active' },

  // ─── Finance & Admin ──────────────────────────────────
  { id: 'dashboard-ceo', label: 'Dashboard Ejecutivo', description: 'Resumen semanal, métricas clave y KPIs', icon: '📈', category: 'finance', route: '/admin-panel/finance/dashboard', status: 'active' },
  { id: 'gastos', label: 'Gastos Operacionales', description: 'Control de gastos, proveedores y categorías', icon: '💳', category: 'finance', route: '/admin-panel/finance/gastos', status: 'active' },
  { id: 'financiero', label: 'Panel Financiero', description: 'Ingresos, suscripciones y métricas financieras', icon: '💹', category: 'finance', route: '/admin-panel/finance/financiero', status: 'active' },
  { id: 'contabilidad', label: 'Contabilidad', description: 'Plan de cuentas, asientos y conciliación', icon: '📗', category: 'finance', route: '/admin-panel/finance/contabilidad', status: 'active', isNew: true },
  { id: 'facturacion', label: 'Facturación / DTE', description: 'Emisión de facturas electrónicas (SII)', icon: '🧾', category: 'finance', route: '/admin-panel/finance/facturacion', status: 'active', isNew: true },
  { id: 'presupuestos', label: 'Presupuestos', description: 'Presupuesto por centro de costo y varianzas', icon: '📐', category: 'finance', route: '/admin-panel/finance/presupuestos', status: 'active', isNew: true },

  // ─── Legal & Compliance ───────────────────────────────
  { id: 'legal', label: 'Legal y Compliance', description: 'Estado de cumplimiento normativo', icon: '⚖️', category: 'legal', route: '/admin-panel/legal/compliance', status: 'active' },
  { id: 'fraude', label: 'Anti-Fraude', description: 'Detección de fraude y referidos sospechosos', icon: '🔍', category: 'legal', route: '/admin-panel/legal/fraude', status: 'active' },

  // ─── Tools & Config ───────────────────────────────────
  { id: 'email-ceo', label: 'Email CEO', description: 'Correo ceo@conniku.com — Comunicaciones ejecutivas', icon: '✉️', category: 'tools', route: '/admin-panel/tools/email-ceo', status: 'active', windowSize: { width: 1400, height: 900 } },
  { id: 'email-contacto', label: 'Email Contacto', description: 'Correo contacto@conniku.com — Soporte y consultas', icon: '📧', category: 'tools', route: '/admin-panel/tools/email-contacto', status: 'active', windowSize: { width: 1400, height: 900 } },
  { id: 'certificaciones', label: 'Certificaciones', description: 'Gestión de certificados y acreditaciones', icon: '🎓', category: 'tools', route: '/admin-panel/tools/certificaciones', status: 'active' },
  { id: 'ai-workflows', label: 'IA Workflows', description: 'Marketing, QA, diseño y comunidad con IA', icon: '🤖', category: 'tools', route: '/admin-panel/tools/ai-workflows', status: 'active' },
  { id: 'tutores', label: 'Tutores Externos', description: 'Directorio y gestión de tutores contratados', icon: '👨‍🏫', category: 'tools', route: '/admin-panel/tools/tutores', status: 'active' },
  { id: 'guia-owner', label: 'Guía del Owner', description: 'Guía legal y administrativa para el dueño', icon: '📖', category: 'tools', route: '/admin-panel/tools/guia-owner', status: 'active' },
]

export const CATEGORY_LABELS: Record<string, { label: string; description: string }> = {
  hr: { label: 'Gestión de Personas', description: 'Empleados, contratos, asistencia y desarrollo' },
  payroll: { label: 'Remuneraciones y Legal', description: 'Liquidaciones, cotizaciones, impuestos y compliance laboral' },
  finance: { label: 'Finanzas y Administración', description: 'Dashboard ejecutivo, gastos, contabilidad y facturación' },
  legal: { label: 'Legal y Compliance', description: 'Cumplimiento normativo y detección de fraude' },
  tools: { label: 'Herramientas', description: 'Email, certificaciones, IA y configuración' },
}
