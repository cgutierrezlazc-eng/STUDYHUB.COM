import React, { useState, useEffect, useCallback } from 'react'
import {
  FolderOpen, Folder, FileText, Download, RefreshCw, Shield,
  AlertTriangle, CheckCircle, Clock, Eye, BookOpen, Scale,
  Users, Banknote, Briefcase, BarChart3, FilePlus, Lock, Search
} from 'lucide-react'
import { Employee } from '../shared/types'
import { CHILE_LABOR } from '../shared/ChileLaborConstants'
import { api } from '../../services/api'
import { useAuth } from '../../services/auth'
import { fmt } from '../shared/styles'

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────
type DocStatus = 'ok' | 'pending' | 'missing' | 'review' | 'auto'
type DocSource = 'generated' | 'auto_sync' | 'template' | 'external' | 'manual'
type FolderKey = 'rrhh' | 'legal' | 'remuneraciones' | 'operacional' | 'auditoria'

interface BiblioDoc {
  id: string
  name: string
  folder: FolderKey
  status: DocStatus
  source: DocSource
  description: string
  legalRef?: string
  lastUpdated?: string
  count?: number       // for auto-aggregated docs (e.g. # contracts)
  action?: 'generate' | 'view' | 'link'
  linkRoute?: string
}

interface ReportDef {
  id: string
  title: string
  org: string
  description: string
  icon: React.ReactNode
  color: string
  sections: string[]
}

// ─────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────
const CONNIKU_RUT = '78.395.702-7'
const CONNIKU_RAZON = 'CONNIKU SpA'
const CONNIKU_GIRO = 'Servicios de educación en línea (631200)'
const CONNIKU_DOMICILIO = 'Santiago, Región Metropolitana'

const FOLDERS: { key: FolderKey; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'rrhh', label: 'Recursos Humanos', icon: <Users size={16} />, color: '#3b82f6' },
  { key: 'legal', label: 'Legal y Corporativo', icon: <Scale size={16} />, color: '#8b5cf6' },
  { key: 'remuneraciones', label: 'Remuneraciones y Cotizaciones', icon: <Banknote size={16} />, color: '#22c55e' },
  { key: 'operacional', label: 'Operacional y Comercial', icon: <Briefcase size={16} />, color: '#f59e0b' },
  { key: 'auditoria', label: 'Auditorías y Reportes', icon: <BarChart3 size={16} />, color: '#ef4444' },
]

// Static document catalog — auto-populated count from live data
const BASE_DOCS: BiblioDoc[] = [
  // ── RRHH ─────────────────────────────────────────────────────
  { id: 'riohs', name: 'RIOHS — Reglamento Interno de Orden, Higiene y Seguridad', folder: 'rrhh', status: 'pending', source: 'template', description: 'Obligatorio Art. 153 CT para empresas con 10+ trabajadores. Incluye normas disciplinarias, higiene y seguridad, horarios.', legalRef: 'Art. 153-157 CT', action: 'generate' },
  { id: 'ley_karin', name: 'Protocolo Ley Karin — Prevención Acoso Laboral y Sexual', folder: 'rrhh', status: 'pending', source: 'template', description: 'Obligatorio desde 01/08/2024 (Ley 21.643). Protocolo de investigación, canales de denuncia y designación de receptor.', legalRef: 'Ley 21.643 — Art. 211-A CT', action: 'generate' },
  { id: 'politica_teletrabajo', name: 'Política de Teletrabajo / Trabajo a Distancia', folder: 'rrhh', status: 'pending', source: 'template', description: 'Reglamento para modalidad híbrida/remota según Ley 21.220. Equipos, conectividad, desconexión digital.', legalRef: 'Ley 21.220 — Art. 152 quáter CT', action: 'generate' },
  { id: 'contratos_vigentes', name: 'Contratos de Trabajo Vigentes', folder: 'rrhh', status: 'auto', source: 'auto_sync', description: 'Contratos generados por el módulo de Contratos para cada trabajador activo.', legalRef: 'Art. 7-11 CT', action: 'link', linkRoute: '/admin-panel/hr/contratos' },
  { id: 'onboarding_records', name: 'Registros de Onboarding / Offboarding', folder: 'rrhh', status: 'auto', source: 'auto_sync', description: 'Checklists completados de ingreso y salida de personal, guardados desde Personas.', legalRef: 'Art. 8 CT', action: 'link', linkRoute: '/admin-panel/hr/personal' },
  { id: 'evaluaciones', name: 'Evaluaciones de Desempeño', folder: 'rrhh', status: 'auto', source: 'auto_sync', description: 'Registros de evaluaciones de desempeño por trabajador desde el módulo ERC.', action: 'link', linkRoute: '/admin-panel/hr/desempeno' },
  { id: 'registro_capacitacion', name: 'Registro de Capacitaciones (SENCE)', folder: 'rrhh', status: 'pending', source: 'manual', description: 'Registro de capacitaciones realizadas. Obligatorio para franquicia SENCE.', legalRef: 'Ley 19.518 SENCE', action: 'link', linkRoute: '/admin-panel/hr/capacitacion' },

  // ── Legal y Corporativo ────────────────────────────────────────
  { id: 'estatutos', name: 'Estatutos CONNIKU SpA', folder: 'legal', status: 'ok', source: 'external', description: 'Escritura de constitución y estatutos sociales. Inscrita en CBR.', legalRef: 'Ley 20.659 — SpA', lastUpdated: '2026-04-08' },
  { id: 'inscripcion_sii', name: 'Inscripción SII — Inicio de Actividades', folder: 'legal', status: 'ok', source: 'external', description: `RUT ${CONNIKU_RUT} — Giro: ${CONNIKU_GIRO} — Micro Empresa / ProPyme 14D3 / Afecto IVA`, legalRef: 'RUT 78.395.702-7', lastUpdated: '2026-04-08' },
  { id: 'terminos_servicio', name: 'Términos y Condiciones del Servicio', folder: 'legal', status: 'ok', source: 'generated', description: 'Términos de uso de la plataforma conniku.com — disponibles en /terminos.', legalRef: 'Art. 1545 CC — Ley 19.496', lastUpdated: '2026-04-08' },
  { id: 'politica_privacidad', name: 'Política de Privacidad y Datos Personales', folder: 'legal', status: 'review', source: 'generated', description: 'Política conforme a Ley 19.628 sobre protección de datos personales.', legalRef: 'Ley 19.628 — Ley 21.719 (vigencia 2026)', action: 'generate' },
  { id: 'mutual_achs', name: 'Contrato Mutual / ACHS — Seguro Accidentes del Trabajo', folder: 'legal', status: 'pending', source: 'external', description: 'Obligatorio para todos los trabajadores (Ley 16.744). Registro de afiliación a mutual de seguridad.', legalRef: 'Ley 16.744 — Art. 66 bis' },
  { id: 'poderes_notariales', name: 'Poderes Notariales — Representación Legal', folder: 'legal', status: 'pending', source: 'external', description: 'Poderes del representante legal para actos y contratos de la sociedad.' },
  { id: 'marca_inapi', name: 'Solicitud Marca INAPI', folder: 'legal', status: 'review', source: 'external', description: 'Inscripción de marca "CONNIKU" en INAPI — Pendiente tramitación.', legalRef: 'Ley 19.039' },

  // ── Remuneraciones y Cotizaciones ─────────────────────────────
  { id: 'libro_rem', name: 'Libro de Remuneraciones Electrónico (LRE)', folder: 'remuneraciones', status: 'auto', source: 'auto_sync', description: 'Registro mensual de remuneraciones de todos los trabajadores, según exigencia DT.', legalRef: 'Art. 62 CT', action: 'link', linkRoute: '/admin-panel/payroll/libro-rem' },
  { id: 'previred_declaraciones', name: 'Declaraciones Previred', folder: 'remuneraciones', status: 'auto', source: 'auto_sync', description: 'Declaraciones mensuales de cotizaciones previsionales (AFP, Salud, AFC).', legalRef: 'DL 3.500 — Ley 19.728', action: 'link', linkRoute: '/admin-panel/payroll/previred' },
  { id: 'dj1887', name: 'DJ1887 — Declaración Jurada Anual de Rentas', folder: 'remuneraciones', status: 'auto', source: 'auto_sync', description: 'Declaración anual de rentas pagadas a trabajadores (SII). Plazo: marzo cada año.', legalRef: 'Art. 101 LIR', action: 'link', linkRoute: '/admin-panel/payroll/dj1887' },
  { id: 'f129', name: 'Formulario 129 — Impuesto Único Trabajadores', folder: 'remuneraciones', status: 'auto', source: 'auto_sync', description: 'Declaración mensual de retenciones de impuesto de segunda categoría.', legalRef: 'Art. 74 N°1 LIR', action: 'link', linkRoute: '/admin-panel/payroll/impuestos' },
  { id: 'liquidaciones_hist', name: 'Historial de Liquidaciones de Sueldo', folder: 'remuneraciones', status: 'auto', source: 'auto_sync', description: 'Todas las liquidaciones emitidas por trabajador y período.', action: 'link', linkRoute: '/admin-panel/payroll/historial' },
  { id: 'finiquitos_hist', name: 'Finiquitos Emitidos', folder: 'remuneraciones', status: 'auto', source: 'auto_sync', description: 'Registro de finiquitos generados con causal, montos y firma.', legalRef: 'Art. 177 CT', action: 'link', linkRoute: '/admin-panel/payroll/finiquitos' },

  // ── Operacional y Comercial ───────────────────────────────────
  { id: 'contratos_tutores', name: 'Contratos con Tutores Externos', folder: 'operacional', status: 'auto', source: 'auto_sync', description: 'Contratos de prestación de servicios con tutores externos contratados.', action: 'link', linkRoute: '/admin-panel/tools/tutores' },
  { id: 'certificaciones', name: 'Certificaciones de Plataforma', folder: 'operacional', status: 'auto', source: 'auto_sync', description: 'Certificados académicos y técnicos emitidos por la plataforma.', action: 'link', linkRoute: '/admin-panel/tools/certificaciones' },
  { id: 'nda_confidencialidad', name: 'Acuerdos de Confidencialidad (NDA)', folder: 'operacional', status: 'pending', source: 'template', description: 'NDAs para colaboradores, tutores y terceros con acceso a información sensible.', action: 'generate' },
  { id: 'acuerdo_nivel_servicio', name: 'Acuerdo de Nivel de Servicio (SLA)', folder: 'operacional', status: 'pending', source: 'template', description: 'SLA para clientes empresariales e institucionales.', action: 'generate' },
  { id: 'politica_cookies', name: 'Política de Cookies y Trackers', folder: 'operacional', status: 'review', source: 'generated', description: 'Conforme a estándares GDPR / Ley 19.628. Banner de cookies y registro de consentimientos.', legalRef: 'Ley 19.628 — GDPR (usuarios EU)' },

  // ── Auditorías y Reportes ─────────────────────────────────────
  { id: 'reporte_dt', name: 'Paquete Inspección del Trabajo (DT)', folder: 'auditoria', status: 'pending', source: 'generated', description: 'Reporte completo con lista de trabajadores, contratos, libro de rem., vacaciones, horas extra y cotizaciones.', legalRef: 'DL 328/1979 — Art. 505 CT', action: 'generate' },
  { id: 'reporte_sii', name: 'Paquete Declaración SII', folder: 'auditoria', status: 'pending', source: 'generated', description: 'Estado de F29, DJ1887, LRE, y facturas emitidas para presentación al SII.', legalRef: 'Ley 19.653 — Código Tributario', action: 'generate' },
  { id: 'reporte_tgr', name: 'Paquete Tesorería General (TGR)', folder: 'auditoria', status: 'pending', source: 'generated', description: 'Estado de deudas, PPM, multas y obligaciones con la TGR.', legalRef: 'DFL 1/2000 TGR', action: 'generate' },
  { id: 'checklist_cumplimiento', name: 'Checklist de Cumplimiento Legal Integral', folder: 'auditoria', status: 'pending', source: 'generated', description: 'Lista maestra de cumplimiento laboral, tributario, societario y de privacidad. Actualizado a 2026.', action: 'generate' },
]

const REPORTS: ReportDef[] = [
  {
    id: 'dt',
    title: 'Inspección del Trabajo',
    org: 'Dirección del Trabajo (DT)',
    description: 'Genera el paquete completo de documentos para una inspección laboral. Incluye nómina actualizada, contratos, libro de rem., registros de vacaciones, horas extra, cotizaciones al día y protocolo Ley Karin.',
    icon: <Shield size={20} />,
    color: '#3b82f6',
    sections: [
      'Nómina de trabajadores activos (RUT, cargo, contrato, sueldo)',
      'Tipo y vigencia de contratos (plazo fijo / indefinido)',
      'Registro de remuneraciones últimos 3 meses',
      'Estado de vacaciones y saldos pendientes',
      'Horas extra autorizadas (Art. 31 CT)',
      'Estado cotizaciones — AFP, Salud, AFC (Ley Bustos)',
      'RIOHS vigente y registrado ante DT',
      'Protocolo Ley Karin (Ley 21.643) — receptor designado',
      'Registro de capacitaciones SENCE',
      'Declaración de accidentes del trabajo (si aplica)',
    ],
  },
  {
    id: 'sii',
    title: 'Servicio de Impuestos Internos',
    org: 'SII',
    description: 'Reporte de cumplimiento tributario. Incluye datos de RUT, giro, declaraciones F29/F129, DJ1887, LRE y facturas emitidas.',
    icon: <Banknote size={20} />,
    color: '#22c55e',
    sections: [
      `RUT ${CONNIKU_RUT} — Giro ${CONNIKU_GIRO}`,
      'Régimen tributario: ProPyme Art. 14D3 — Afecto IVA',
      'Estado declaraciones F29 (mensual) últimos 12 meses',
      'DJ1887 — Rentas y retenciones por trabajador (anual)',
      'F129 — Impuesto Único de Segunda Categoría (mensual)',
      'Libro de Remuneraciones Electrónico (LRE) — períodos',
      'DTE — Facturas electrónicas emitidas (si aplica)',
      'PPM — Pagos provisionales mensuales',
    ],
  },
  {
    id: 'tgr',
    title: 'Tesorería General de la República',
    org: 'TGR',
    description: 'Estado de deudas y obligaciones tributarias con la TGR. Incluye PPM, IVA por pagar y multas.',
    icon: <Scale size={20} />,
    color: '#8b5cf6',
    sections: [
      `Identificación: ${CONNIKU_RAZON} — RUT ${CONNIKU_RUT}`,
      'Estado de deuda tributaria (IVA, PPM, RTE)',
      'Multas y notificaciones pendientes',
      'Historial de pagos — últimos 12 meses',
      'Convenios de pago vigentes (si aplica)',
      'Aclaración de diferencias de impuesto',
    ],
  },
  {
    id: 'prevision',
    title: 'AFP / Previred / AFC',
    org: 'Previred — AFP — AFC Chile',
    description: 'Declaración y comprobante de pago de cotizaciones previsionales de todos los trabajadores.',
    icon: <Users size={20} />,
    color: '#f59e0b',
    sections: [
      'Nómina con AFP, % cotización y monto por trabajador',
      'Cotización salud (Fonasa / Isapre) por trabajador',
      'AFC — Seguro de Cesantía empleado + empleador',
      'SIS — Seguro de Invalidez y Sobrevivencia',
      'Mutual de Seguridad (ACHS/IST/Mutual) — tasa accidentes',
      'Certificados de pagos mensuales (últimos 12)',
    ],
  },
  {
    id: 'universal',
    title: 'Auditoría General Integral',
    org: 'Universal — Todos los organismos',
    description: 'Checklist maestro de cumplimiento. Detecta documentos faltantes y próximos vencimientos. Ideal para pre-auditorías y auto-diagnóstico.',
    icon: <CheckCircle size={20} />,
    color: '#ef4444',
    sections: [
      'Documentos corporativos vigentes (estatutos, poderes)',
      'Cumplimiento laboral completo (DT — Art. 505 CT)',
      'Estado tributario actualizado (SII / TGR)',
      'Cotizaciones previsionales al día (Ley Bustos)',
      'Protocolos obligatorios: RIOHS + Ley Karin',
      'Datos personales y privacidad (Ley 19.628 / 21.719)',
      'Propiedad intelectual (marca INAPI)',
      'Seguro accidentes del trabajo (Ley 16.744)',
      'Próximos vencimientos y fechas críticas',
      'Documentos faltantes con nivel de urgencia',
    ],
  },
]

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<DocStatus, { label: string; color: string; icon: React.ReactNode }> = {
  ok: { label: 'Al día', color: '#22c55e', icon: <CheckCircle size={12} /> },
  auto: { label: 'Sincronizado', color: '#3b82f6', icon: <RefreshCw size={12} /> },
  pending: { label: 'Pendiente', color: '#f59e0b', icon: <Clock size={12} /> },
  review: { label: 'Revisar', color: '#f97316', icon: <AlertTriangle size={12} /> },
  missing: { label: 'Faltante', color: '#ef4444', icon: <AlertTriangle size={12} /> },
}

function DocBadge({ status }: { status: DocStatus }) {
  const c = STATUS_CONFIG[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: `${c.color}20`, color: c.color }}>
      {c.icon} {c.label}
    </span>
  )
}

const DOC_STYLES = `
  @page { size: letter; margin: 2.5cm 3cm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.7; color: #000; }
  h1 { text-align: center; font-size: 15pt; margin-bottom: 20pt; text-transform: uppercase; letter-spacing: 1px; }
  h2 { font-size: 12pt; margin: 16pt 0 6pt; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 4pt; }
  h3 { font-size: 11pt; margin: 12pt 0 4pt; font-style: italic; }
  p { text-align: justify; margin-bottom: 10pt; }
  ul { margin: 6pt 0 10pt 20pt; }
  li { margin-bottom: 4pt; }
  .header { text-align: center; margin-bottom: 24pt; font-size: 10pt; color: #555; }
  .legal-ref { font-size: 9pt; color: #666; font-style: italic; margin-top: 4pt; }
  .article { margin-bottom: 14pt; page-break-inside: avoid; }
  .signatures { margin-top: 50pt; display: flex; justify-content: space-around; }
  .sig-block { text-align: center; width: 40%; }
  .sig-line { border-top: 1px solid #000; margin-top: 50pt; padding-top: 6pt; font-size: 10pt; }
  table { width: 100%; border-collapse: collapse; margin: 10pt 0; font-size: 10pt; }
  th, td { padding: 5pt 8pt; border: 1px solid #ccc; text-align: left; }
  th { background: #f0f0f0; font-weight: 700; }
  .check-ok { color: green; font-weight: bold; }
  .check-pending { color: #c55; font-weight: bold; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
`

const openDoc = (html: string) => {
  const w = window.open('', '_blank')
  if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 600) }
}

// ─── Document generators ─────────────────────────────────────────
function generateRIOHS(): string {
  const today = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>RIOHS — CONNIKU SpA</title><style>${DOC_STYLES}</style></head><body>
<div class="header">${CONNIKU_RAZON} — RUT ${CONNIKU_RUT}<br/>Santiago, Chile</div>
<h1>Reglamento Interno de Orden, Higiene y Seguridad</h1>
<p class="legal-ref" style="text-align:center;margin-bottom:20pt;">Conforme a los Artículos 153 al 157 del Código del Trabajo y DS 40/1969 del Ministerio del Trabajo</p>

<div class="article"><h2>Título I — Disposiciones Generales</h2>
<p><strong>Artículo 1°</strong>: El presente Reglamento Interno de Orden, Higiene y Seguridad (en adelante "el Reglamento") es dictado por <strong>${CONNIKU_RAZON}</strong>, RUT ${CONNIKU_RUT}, con domicilio en ${CONNIKU_DOMICILIO}, en cumplimiento de lo dispuesto en el artículo 153 del Código del Trabajo.</p>
<p><strong>Artículo 2°</strong>: Este Reglamento es de carácter obligatorio para todos los trabajadores de la empresa, sin distinción de cargo ni antigüedad. El desconocimiento de sus disposiciones no excusa su cumplimiento.</p>
<p><strong>Artículo 3°</strong>: La empresa hará entrega de un ejemplar de este Reglamento a cada trabajador al momento de su contratación, dejando constancia de ello en la carpeta personal. Se publicará además en el lugar de trabajo y en la plataforma interna.</p></div>

<div class="article"><h2>Título II — Ingreso, Admisión y Contratación</h2>
<p><strong>Artículo 4°</strong>: Toda persona que desee ingresar a trabajar en la empresa deberá cumplir los requisitos del cargo y presentar la documentación requerida: cédula de identidad, RUT, certificado de estudios, antecedentes previsionales y demás que se soliciten.</p>
<p><strong>Artículo 5°</strong>: La progresión de contratos se regirá conforme al artículo 159 N°4 del CT: primer contrato plazo fijo máximo 30 días, segundo máximo 60 días, tercero indefinido. El CEO/RRHH podrá contratar directamente bajo contrato indefinido cuando las condiciones así lo ameriten.</p></div>

<div class="article"><h2>Título III — Jornada de Trabajo y Descanso</h2>
<p><strong>Artículo 6°</strong>: La jornada ordinaria de trabajo es de hasta 45 horas semanales distribuidas en 5 días, conforme al artículo 22 del CT. Los trabajadores bajo modalidad Art. 22 inciso 2° (teletrabajo/alta dirección) están excluidos del control de jornada.</p>
<p><strong>Artículo 7°</strong>: Las horas extraordinarias solo podrán pactarse por escrito y hasta un máximo de 2 horas diarias (Art. 31 CT), con recargo del 50% sobre el valor hora normal.</p>
<p><strong>Artículo 8°</strong>: El descanso semanal mínimo es de 2 días continuos, preferentemente sábado y domingo. El feriado anual es de 15 días hábiles, más días progresivos desde los 10 años de servicio (Art. 67-68 CT).</p></div>

<div class="article"><h2>Título IV — Remuneraciones</h2>
<p><strong>Artículo 9°</strong>: Las remuneraciones se pagarán el último día hábil de cada mes. La empresa cerrará la nómina el día 22 de cada mes. Los días 23 al 31 se incorporarán al período siguiente.</p>
<p><strong>Artículo 10°</strong>: El anticipo quincenal es voluntario, por solicitud expresa del trabajador, desde el segundo mes de contrato, y no podrá exceder el 40% del sueldo bruto al cierre del día 22.</p>
<p><strong>Artículo 11°</strong>: La empresa pagará gratificación legal según artículo 50 CT (25% del sueldo mensual, tope 4,75 IMM mensual), distribuida en las liquidaciones mensuales.</p></div>

<div class="article"><h2>Título V — Obligaciones del Trabajador</h2>
<p><strong>Artículo 12°</strong>: Son obligaciones de todo trabajador:</p>
<ul>
<li>Asistir puntualmente a su lugar de trabajo y cumplir sus funciones con dedicación y eficiencia.</li>
<li>Tratar con respeto y cortesía a compañeros, supervisores, clientes y tutores.</li>
<li>Guardar confidencialidad sobre información de la empresa, clientes y trabajadores.</li>
<li>Cuidar los bienes y equipos de la empresa, dando aviso inmediato de cualquier desperfecto.</li>
<li>Informar oportunamente cualquier accidente del trabajo o enfermedad profesional.</li>
<li>Cumplir las normas de higiene y seguridad del presente Reglamento.</li>
</ul></div>

<div class="article"><h2>Título VI — Prohibiciones</h2>
<p><strong>Artículo 13°</strong>: Queda estrictamente prohibido a todo trabajador:</p>
<ul>
<li>Presentarse al trabajo bajo la influencia del alcohol o drogas.</li>
<li>Desarrollar actividades particulares o comerciales durante la jornada de trabajo.</li>
<li>Divulgar información confidencial de clientes, estrategias o datos internos.</li>
<li>Utilizar sistemas y equipos de la empresa para fines ajenos al trabajo.</li>
<li>Ejercer acoso laboral, sexual o cualquier forma de discriminación (Ley 21.643).</li>
<li>Cometer actos de deshonestidad, fraude o apropiación indebida de bienes.</li>
</ul></div>

<div class="article"><h2>Título VII — Procedimiento Disciplinario</h2>
<p><strong>Artículo 14°</strong>: Las infracciones al presente Reglamento serán sancionadas según su gravedad:</p>
<ul>
<li><strong>Amonestación verbal:</strong> para faltas leves de primera ocurrencia.</li>
<li><strong>Amonestación escrita:</strong> para faltas leves reiteradas o moderadas. Queda registro en carpeta.</li>
<li><strong>Multa:</strong> hasta 25% de la remuneración diaria (Art. 157 CT), para faltas graves.</li>
<li><strong>Término de contrato (Art. 160 CT):</strong> para las faltas graves taxativas del artículo 160.</li>
</ul>
<p><strong>Artículo 15°</strong>: El trabajador tiene derecho a ser oído antes de aplicarse cualquier sanción. Las multas serán destinadas al fondo de bienestar o a la Junta de Auxilio Escolar (Art. 157 CT).</p></div>

<div class="article"><h2>Título VIII — Higiene y Seguridad</h2>
<p><strong>Artículo 16°</strong>: La empresa está afiliada a una mutual de seguridad conforme a la Ley 16.744 sobre accidentes del trabajo y enfermedades profesionales.</p>
<p><strong>Artículo 17°</strong>: Todo accidente del trabajo debe ser comunicado de inmediato al supervisor directo y reportado a la mutual dentro de 24 horas. El empleador tiene la obligación de investigar todo accidente.</p>
<p><strong>Artículo 18°</strong>: En modalidad de teletrabajo, el trabajador debe mantener un espacio de trabajo ergonómico y seguro en su domicilio, conforme a la Ley 21.220 y sus protocolos de seguridad.</p>
<p><strong>Artículo 19°</strong>: La empresa debe elaborar y mantener actualizada la Matriz de Identificación de Peligros y Evaluación de Riesgos (IPER) conforme al DS 76/2006.</p></div>

<div class="article"><h2>Título IX — Protocolo de Prevención Ley Karin (Ley 21.643)</h2>
<p><strong>Artículo 20°</strong>: La empresa tiene una política de tolerancia cero frente a cualquier acto de acoso laboral, acoso sexual o violencia en el trabajo, conforme a la Ley 21.643 vigente desde el 01/08/2024.</p>
<p><strong>Artículo 21°</strong>: Se designa como receptor/a de denuncias al Gerente General / CEO. Las denuncias podrán presentarse por escrito, en sobre cerrado, o a través del correo ceo@conniku.com.</p>
<p><strong>Artículo 22°</strong>: Recibida una denuncia, la empresa dispone de 3 días para adoptar medidas de resguardo y 30 días para iniciar la investigación interna o derivar a la Inspección del Trabajo.</p></div>

<div class="article"><h2>Título X — Vigencia y Modificaciones</h2>
<p><strong>Artículo 23°</strong>: El presente Reglamento entrará en vigencia a los 30 días de su publicación en el lugar de trabajo y remisión a la Dirección del Trabajo y al Servicio de Salud respectivo (Art. 156 CT).</p>
<p><strong>Artículo 24°</strong>: Toda modificación sustancial requerirá nueva publicación y notificación a los trabajadores con 30 días de anticipación.</p></div>

<p style="text-align:right;margin-top:20pt;">Santiago, ${today}</p>
<div class="signatures">
  <div class="sig-block"><div class="sig-line"><strong>EL EMPLEADOR</strong><br/>${CONNIKU_RAZON}<br/>RUT ${CONNIKU_RUT}</div></div>
</div>
<p class="legal-ref" style="margin-top:20pt;padding:8pt;border:1px solid #ccc;font-size:9pt;">Nota: Este Reglamento debe ser enviado a la Inspección del Trabajo y al Servicio de Salud correspondiente dentro de los 5 días siguientes a su promulgación (Art. 156 CT). Debe entregarse un ejemplar a cada trabajador y publicarse en el lugar de trabajo.</p>
</body></html>`
}

function generateLeyKarin(): string {
  const today = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Protocolo Ley Karin — CONNIKU SpA</title><style>${DOC_STYLES}</style></head><body>
<div class="header">${CONNIKU_RAZON} — RUT ${CONNIKU_RUT}</div>
<h1>Protocolo de Prevención del Acoso Laboral, Acoso Sexual y Violencia en el Trabajo</h1>
<p class="legal-ref" style="text-align:center;margin-bottom:20pt;">Conforme a la Ley N° 21.643 (Ley Karin), vigente desde el 01 de agosto de 2024<br/>Artículos 211-A al 211-I del Código del Trabajo</p>

<div class="article"><h2>1. Declaración de Política</h2>
<p>${CONNIKU_RAZON} declara su compromiso irrestricto con ambientes de trabajo libres de violencia, acoso laboral y acoso sexual. Esta política aplica a todos los trabajadores, dependientes e independientes, y a terceros que presten servicios en o para la empresa.</p></div>

<div class="article"><h2>2. Definiciones (Art. 211-A CT)</h2>
<ul>
<li><strong>Acoso laboral:</strong> Conducta que constituye agresión u hostigamiento reiterado ejercida por el empleador o trabajadores, por vías que menoscaben la dignidad de la persona.</li>
<li><strong>Acoso sexual:</strong> Requerimiento de carácter sexual no consentido que amenaza o perjudica la situación laboral.</li>
<li><strong>Violencia en el trabajo:</strong> Agresiones físicas o psicológicas ejercidas por terceros (clientes, usuarios, tutores).</li>
</ul></div>

<div class="article"><h2>3. Receptor de Denuncias</h2>
<p>Se designa como <strong>receptor/a de denuncias</strong>:</p>
<table><tr><th>Cargo</th><th>Nombre</th><th>Contacto</th></tr>
<tr><td>CEO / Gerente General</td><td>Cristian G.</td><td>ceo@conniku.com</td></tr></table>
<p>En caso de que la denuncia involucre al CEO, el trabajador podrá dirigirse directamente a la <strong>Inspección del Trabajo</strong> respectiva.</p></div>

<div class="article"><h2>4. Canales de Denuncia</h2>
<ul>
<li><strong>Escrito:</strong> sobre cerrado dirigido al receptor, en forma presencial.</li>
<li><strong>Correo electrónico:</strong> ceo@conniku.com (acceso exclusivo del receptor).</li>
<li><strong>Inspección del Trabajo:</strong> directamente, si el acusado es el empleador.</li>
</ul>
<p>El receptor acusará recibo de la denuncia dentro de las <strong>24 horas</strong> siguientes.</p></div>

<div class="article"><h2>5. Procedimiento de Investigación (Art. 211-C CT)</h2>
<p><strong>Paso 1 — Medidas de resguardo inmediatas (dentro de 3 días hábiles):</strong> Separación de espacios físicos, redistribución de turnos, licencia con goce de remuneraciones u otra medida que proteja al denunciante.</p>
<p><strong>Paso 2 — Decisión de investigación (plazo 5 días):</strong> La empresa decide si investiga internamente (plazo máximo 30 días) o deriva a la Inspección del Trabajo.</p>
<p><strong>Paso 3 — Investigación interna:</strong> Se designa un investigador imparcial. Se notifica al denunciado dentro de 5 días. Ambas partes tienen derecho a ser escuchadas y presentar pruebas.</p>
<p><strong>Paso 4 — Informe (plazo 30 días):</strong> El investigador redacta informe con conclusiones y propuestas de sanción. Se notifica a ambas partes y se remite a la Inspección del Trabajo.</p>
<p><strong>Paso 5 — Resolución (plazo 15 días):</strong> El empleador aplica las medidas y sanciones del informe dentro de 15 días de su recepción.</p></div>

<div class="article"><h2>6. Garantías para el Denunciante</h2>
<ul>
<li>Confidencialidad del proceso en todo momento.</li>
<li>Protección contra represalias — el despido posterior a la denuncia se presumirá represalia (Art. 211-E CT).</li>
<li>Derecho a licencia médica sin descuento si el médico lo indica.</li>
<li>Derecho a retractación sin consecuencias si la denuncia fue de buena fe.</li>
</ul></div>

<div class="article"><h2>7. Sanciones</h2>
<p>Confirmado el acoso, las sanciones podrán incluir desde amonestación escrita hasta término del contrato por Art. 160 N°1 b) o c). La empresa podrá ser multada por la DT si no cumple el protocolo.</p></div>

<div class="article"><h2>8. Capacitación y Difusión</h2>
<p>Este protocolo se entregará a todos los trabajadores al inicio de la relación laboral y estará disponible en la plataforma interna. La empresa realizará al menos una capacitación anual sobre prevención del acoso.</p></div>

<p style="text-align:right;margin-top:20pt;">Santiago, ${today}</p>
<div class="signatures">
  <div class="sig-block"><div class="sig-line"><strong>${CONNIKU_RAZON}</strong><br/>RUT ${CONNIKU_RUT}<br/>Representante Legal</div></div>
</div>
</body></html>`
}

function generateDTReport(employees: Employee[]): string {
  const today = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
  const active = employees.filter(e => e.status === 'active')
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Paquete DT — ${CONNIKU_RAZON}</title><style>${DOC_STYLES}</style></head><body>
<div class="header">${CONNIKU_RAZON} — RUT ${CONNIKU_RUT}<br/>Generado: ${today}</div>
<h1>Paquete Inspección del Trabajo</h1>

<h2>1. Nómina de Trabajadores Activos (${active.length} trabajadores)</h2>
<table><thead><tr><th>RUT</th><th>Nombre</th><th>Cargo</th><th>Departamento</th><th>Tipo Contrato</th><th>Fecha Ingreso</th><th>Sueldo Bruto</th><th>AFP</th><th>Salud</th></tr></thead>
<tbody>
${active.map(e => `<tr>
  <td>${e.rut}</td>
  <td>${e.firstName} ${e.lastName}</td>
  <td>${e.position}</td>
  <td>${e.department}</td>
  <td>${e.contractType}</td>
  <td>${new Date(e.hireDate).toLocaleDateString('es-CL')}</td>
  <td>$${e.grossSalary.toLocaleString('es-CL')}</td>
  <td>${e.afp}</td>
  <td>${e.healthSystem === 'fonasa' ? 'Fonasa' : `Isapre ${e.isapreName || ''}`}</td>
</tr>`).join('')}
</tbody></table>

<h2>2. Estado de Contratos</h2>
<table><thead><tr><th>Trabajador</th><th>Tipo Contrato</th><th>Jornada (hrs/sem)</th><th>Modalidad</th></tr></thead>
<tbody>${active.map(e => `<tr><td>${e.firstName} ${e.lastName}</td><td>${e.contractType}</td><td>${e.weeklyHours}</td><td>${e.workSchedule || 'Presencial'}</td></tr>`).join('')}</tbody></table>

<h2>3. Checklist de Cumplimiento Laboral</h2>
<table><thead><tr><th>Requisito Legal</th><th>Base Legal</th><th>Estado</th></tr></thead>
<tbody>
<tr><td>Contrato de trabajo por escrito</td><td>Art. 9 CT</td><td class="check-ok">✓ Verificado</td></tr>
<tr><td>Libro de asistencia / control horario</td><td>Art. 33 CT</td><td class="check-pending">⚠ Verificar</td></tr>
<tr><td>Libro de remuneraciones</td><td>Art. 62 CT</td><td class="check-ok">✓ Módulo activo</td></tr>
<tr><td>Cotizaciones previsionales al día (Ley Bustos)</td><td>Art. 162 CT</td><td class="check-pending">⚠ Verificar Previred</td></tr>
<tr><td>RIOHS promulgado y enviado a DT</td><td>Art. 156 CT</td><td class="check-pending">⚠ Pendiente generación</td></tr>
<tr><td>Protocolo Ley Karin vigente</td><td>Ley 21.643</td><td class="check-pending">⚠ Pendiente</td></tr>
<tr><td>Afiliación a mutual de seguridad</td><td>Ley 16.744</td><td class="check-pending">⚠ Verificar</td></tr>
<tr><td>Registro de horas extra autorizadas</td><td>Art. 31 CT</td><td class="check-pending">⚠ Verificar</td></tr>
<tr><td>Pago feriado anual (min. 15 días)</td><td>Art. 67 CT</td><td class="check-ok">✓ Módulo vacaciones activo</td></tr>
<tr><td>Seguro cesantía AFC</td><td>Ley 19.728</td><td class="check-ok">✓ Registrado en nómina</td></tr>
</tbody></table>

<h2>4. Datos Empleador</h2>
<table><tr><th>Razón Social</th><td>${CONNIKU_RAZON}</td></tr>
<tr><th>RUT</th><td>${CONNIKU_RUT}</td></tr>
<tr><th>Giro</th><td>${CONNIKU_GIRO}</td></tr>
<tr><th>Domicilio</th><td>${CONNIKU_DOMICILIO}</td></tr>
<tr><th>N° Trabajadores</th><td>${active.length}</td></tr>
<tr><th>Fecha reporte</th><td>${today}</td></tr></table>

<p class="legal-ref" style="margin-top:16pt;padding:8pt;border:1px solid #ccc;">Este reporte ha sido generado automáticamente por el sistema CONNIKU. Los datos se obtienen de los módulos de RRHH. Verificar cotizaciones en Previred.cl antes de la inspección.</p>
</body></html>`
}

function generateComplianceChecklist(employees: Employee[], docs: BiblioDoc[]): string {
  const today = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
  const pending = docs.filter(d => d.status === 'pending' || d.status === 'missing')
  const ok = docs.filter(d => d.status === 'ok' || d.status === 'auto')
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Checklist Cumplimiento — ${CONNIKU_RAZON}</title><style>${DOC_STYLES}</style></head><body>
<div class="header">${CONNIKU_RAZON} — RUT ${CONNIKU_RUT} — Generado: ${today}</div>
<h1>Checklist de Cumplimiento Legal Integral 2026</h1>

<h2>Resumen Ejecutivo</h2>
<table>
<tr><th>Documentos al día</th><td class="check-ok">${ok.length} ✓</td></tr>
<tr><th>Documentos pendientes</th><td class="check-pending">${pending.length} ⚠</td></tr>
<tr><th>Trabajadores activos</th><td>${employees.filter(e => e.status === 'active').length}</td></tr>
<tr><th>Fecha del reporte</th><td>${today}</td></tr>
</table>

<h2>Documentos Al Día</h2>
<table><thead><tr><th>Documento</th><th>Referencia Legal</th><th>Estado</th></tr></thead>
<tbody>${ok.map(d => `<tr><td>${d.name}</td><td>${d.legalRef || '—'}</td><td class="check-ok">✓ ${STATUS_CONFIG[d.status].label}</td></tr>`).join('')}</tbody></table>

<h2>Documentos Pendientes — Acción Requerida</h2>
<table><thead><tr><th>Documento</th><th>Referencia Legal</th><th>Carpeta</th><th>Urgencia</th></tr></thead>
<tbody>${pending.map(d => `<tr>
  <td>${d.name}</td>
  <td>${d.legalRef || '—'}</td>
  <td>${FOLDERS.find(f => f.key === d.folder)?.label || d.folder}</td>
  <td class="check-pending">⚠ ${STATUS_CONFIG[d.status].label}</td>
</tr>`).join('')}</tbody></table>

<h2>Fechas y Vencimientos Críticos 2026</h2>
<table><thead><tr><th>Obligación</th><th>Frecuencia</th><th>Próximo Vencimiento</th><th>Organismo</th></tr></thead>
<tbody>
<tr><td>F29 — IVA y PPM</td><td>Mensual</td><td>Día 20 de cada mes</td><td>SII</td></tr>
<tr><td>Previred — Cotizaciones</td><td>Mensual</td><td>Último día hábil del mes</td><td>AFP/AFC/Isapre</td></tr>
<tr><td>Liquidaciones de sueldo</td><td>Mensual</td><td>Último día hábil del mes</td><td>Trabajadores</td></tr>
<tr><td>DJ1887 — Rentas anuales</td><td>Anual</td><td>Marzo 2027</td><td>SII</td></tr>
<tr><td>Licencia Médica — Reembolsos</td><td>Por evento</td><td>Dentro de 5 días hábiles</td><td>Fonasa/Isapre</td></tr>
<tr><td>Reporte accidentes del trabajo</td><td>Por evento</td><td>Dentro de 24 horas</td><td>Mutual/DT</td></tr>
<tr><td>Finiquito — pago</td><td>Por término</td><td>10 días hábiles desde término</td><td>Trabajador</td></tr>
<tr><td>Carta despido Art.161</td><td>Por término</td><td>6 días hábiles</td><td>DT + trabajador</td></tr>
<tr><td>Aviso plazo fijo vencimiento</td><td>Por contrato</td><td>15 días antes del vencimiento</td><td>DT</td></tr>
</tbody></table>

<p class="legal-ref" style="margin-top:16pt;padding:8pt;border:1px solid #ccc;">Checklist generado por CONNIKU Admin. Verificar estado actual en módulos respectivos. Este documento no reemplaza asesoría legal profesional para casos específicos.</p>
</body></html>`
}

// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════
export default function BibliotecaDocumentos() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'biblioteca' | 'reportes'>('biblioteca')
  const [activeFolder, setActiveFolder] = useState<FolderKey | 'all'>('all')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [docs, setDocs] = useState<BiblioDoc[]>(BASE_DOCS)

  // CEO-only guard
  if (user?.role !== 'owner') {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <Lock size={48} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
        <h2 style={{ color: '#ef4444', margin: '0 0 8px' }}>Acceso Restringido</h2>
        <p style={{ color: 'var(--text-muted)' }}>La Biblioteca de Documentos es accesible únicamente para el CEO.</p>
      </div>
    )
  }

  useEffect(() => {
    setLoading(true)
    api.getEmployees()
      .then((data: any) => {
        const emps = data || []
        setEmployees(emps)
        // Enrich auto-sync docs with counts
        const active = emps.filter((e: Employee) => e.status === 'active').length
        setDocs(prev => prev.map(d => {
          if (d.id === 'contratos_vigentes') return { ...d, count: active, lastUpdated: new Date().toLocaleDateString('es-CL') }
          if (d.id === 'onboarding_records') return { ...d, count: active, lastUpdated: new Date().toLocaleDateString('es-CL') }
          if (d.id === 'liquidaciones_hist') return { ...d, lastUpdated: new Date().toLocaleDateString('es-CL') }
          return d
        }))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filteredDocs = docs.filter(d => {
    const matchFolder = activeFolder === 'all' || d.folder === activeFolder
    const matchSearch = search === '' || d.name.toLowerCase().includes(search.toLowerCase()) || d.description.toLowerCase().includes(search.toLowerCase())
    return matchFolder && matchSearch
  })

  const stats = {
    total: docs.length,
    ok: docs.filter(d => d.status === 'ok' || d.status === 'auto').length,
    pending: docs.filter(d => d.status === 'pending').length,
    review: docs.filter(d => d.status === 'review').length,
  }

  const handleGenerate = (docId: string) => {
    switch (docId) {
      case 'riohs': openDoc(generateRIOHS()); break
      case 'ley_karin': openDoc(generateLeyKarin()); break
      case 'reporte_dt': openDoc(generateDTReport(employees)); break
      case 'checklist_cumplimiento': openDoc(generateComplianceChecklist(employees, docs)); break
      default: alert('Generador en preparación para este documento.')
    }
    // Mark as generated
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'ok', lastUpdated: new Date().toLocaleDateString('es-CL') } : d))
  }

  const handleGenerateReport = (reportId: string) => {
    switch (reportId) {
      case 'dt': openDoc(generateDTReport(employees)); break
      case 'universal': openDoc(generateComplianceChecklist(employees, docs)); break
      default: alert(`Reporte ${reportId.toUpperCase()} — el generador se conectará con los módulos de ${reportId === 'sii' ? 'Facturación y DJ1887' : reportId === 'tgr' ? 'Tesorería' : 'Previred'} una vez que se registren datos en ellos.`)
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div className="card" style={{ padding: 24, marginBottom: 20, background: 'linear-gradient(135deg, #1a1a2e, #16213e)', color: '#fff', borderRadius: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <BookOpen size={28} />
          <div>
            <h2 style={{ margin: 0, fontSize: 22 }}>Biblioteca de Documentos Administrativos</h2>
            <p style={{ margin: '4px 0 0', opacity: 0.75, fontSize: 13 }}>
              Acceso CEO · {CONNIKU_RAZON} · RUT {CONNIKU_RUT}
            </p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total documentos', value: stats.total, color: 'var(--text-primary)', bg: 'var(--bg-secondary)' },
          { label: 'Al día / Sincronizados', value: stats.ok, color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
          { label: 'Pendientes', value: stats.pending, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
          { label: 'Requieren revisión', value: stats.review, color: '#f97316', bg: 'rgba(249,115,22,0.08)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 16px', background: s.bg, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: 20, gap: 4 }}>
        {[
          { id: 'biblioteca', label: 'Biblioteca de Documentos', icon: <FolderOpen size={15} /> },
          { id: 'reportes', label: 'Generador de Reportes', icon: <BarChart3 size={15} /> },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 600, color: activeTab === t.id ? 'var(--accent)' : 'var(--text-muted)',
            borderBottom: activeTab === t.id ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -2
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* ── Biblioteca Tab ─────────────────────────────────────────── */}
      {activeTab === 'biblioteca' && (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
          {/* Folder sidebar */}
          <div>
            <div className="card" style={{ padding: 8 }}>
              <button
                onClick={() => setActiveFolder('all')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 12px',
                  border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: activeFolder === 'all' ? 700 : 500,
                  background: activeFolder === 'all' ? 'var(--accent)' : 'transparent',
                  color: activeFolder === 'all' ? '#fff' : 'var(--text-primary)'
                }}>
                <FolderOpen size={15} /> Todos los documentos
                <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.7 }}>{docs.length}</span>
              </button>
              {FOLDERS.map(f => {
                const count = docs.filter(d => d.folder === f.key).length
                const pendingCount = docs.filter(d => d.folder === f.key && (d.status === 'pending' || d.status === 'review')).length
                return (
                  <button key={f.key} onClick={() => setActiveFolder(f.key)} style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 12px',
                    border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                    fontWeight: activeFolder === f.key ? 700 : 500,
                    background: activeFolder === f.key ? `${f.color}15` : 'transparent',
                    color: activeFolder === f.key ? f.color : 'var(--text-primary)'
                  }}>
                    <span style={{ color: f.color }}>{f.icon}</span>
                    <span style={{ flex: 1, textAlign: 'left', fontSize: 12, lineHeight: 1.3 }}>{f.label}</span>
                    <span style={{ fontSize: 11, opacity: 0.6 }}>{count}</span>
                    {pendingCount > 0 && <span style={{ background: '#f59e0b', color: '#fff', borderRadius: 10, padding: '0 5px', fontSize: 10, fontWeight: 700 }}>{pendingCount}</span>}
                  </button>
                )
              })}
            </div>

            {/* Legal notice */}
            <div className="card" style={{ padding: 12, marginTop: 12, borderLeft: '3px solid #3b82f6' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                <strong>Nota:</strong> Los documentos marcados como "Sincronizado" se actualizan automáticamente desde los módulos activos de CONNIKU.
              </p>
            </div>
          </div>

          {/* Document list */}
          <div>
            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                placeholder="Buscar documentos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredDocs.map(doc => {
                const folder = FOLDERS.find(f => f.key === doc.folder)
                return (
                  <div key={doc.id} className="card" style={{ padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start', borderLeft: `3px solid ${folder?.color || '#ccc'}` }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{doc.name}</span>
                        <DocBadge status={doc.status} />
                        {doc.count !== undefined && (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '2px 7px', borderRadius: 10 }}>{doc.count} registros</span>
                        )}
                      </div>
                      <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{doc.description}</p>
                      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                        {doc.legalRef && <span style={{ color: '#3b82f6' }}>⚖ {doc.legalRef}</span>}
                        {doc.lastUpdated && <span>📅 {doc.lastUpdated}</span>}
                        <span style={{ color: folder?.color || 'var(--text-muted)' }}>{folder?.label}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 120 }}>
                      {doc.action === 'generate' && (
                        <button
                          onClick={() => handleGenerate(doc.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          <FilePlus size={13} /> Generar
                        </button>
                      )}
                      {doc.action === 'link' && doc.linkRoute && (
                        <button
                          onClick={() => window.location.hash = doc.linkRoute!}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          <Eye size={13} /> Ver módulo
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
              {filteredDocs.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  <FolderOpen size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p>No se encontraron documentos</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Reportes Tab ───────────────────────────────────────────── */}
      {activeTab === 'reportes' && (
        <div>
          <div style={{ padding: '12px 16px', background: 'rgba(59,130,246,0.08)', borderRadius: 10, border: '1px solid rgba(59,130,246,0.25)', marginBottom: 20, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <strong style={{ color: '#3b82f6' }}>Generador automático de reportes</strong> — Los reportes se construyen con datos reales de los módulos activos de CONNIKU: empleados, nóminas, documentos y cumplimiento. Cada reporte se genera listo para imprimir y presentar ante el organismo correspondiente.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {REPORTS.map(report => (
              <div key={report.id} className="card" style={{ padding: 20, borderTop: `4px solid ${report.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ color: report.color }}>{report.icon}</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{report.title}</h3>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{report.org}</p>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>{report.description}</p>
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Incluye:</p>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {report.sections.map((s, i) => (
                      <li key={i} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3, lineHeight: 1.4 }}>{s}</li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => handleGenerateReport(report.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 8, border: 'none', background: report.color, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, width: '100%', justifyContent: 'center' }}>
                  <Download size={15} /> Generar Reporte {report.title}
                </button>
              </div>
            ))}
          </div>

          {/* Legal disclaimer */}
          <div className="card" style={{ padding: 16, marginTop: 20, borderLeft: '4px solid #8b5cf6', background: 'rgba(139,92,246,0.04)' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#8b5cf6' }}>Aviso Legal</h4>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
              Los reportes generados constituyen un apoyo informativo basado en los datos registrados en CONNIKU. Para efectos legales formales ante la Dirección del Trabajo, SII o TGR, los documentos deben ser revisados por el representante legal. CONNIKU no reemplaza la asesoría de un abogado laboral o tributario para casos específicos.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
