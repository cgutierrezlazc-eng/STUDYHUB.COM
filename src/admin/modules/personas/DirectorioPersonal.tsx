import React, { useState, useEffect, useCallback } from 'react'
import { api } from '../../../services/api'
import { Employee } from '../../shared/types'

// ─── Constantes laborales Chile ────────────────────────────────
const IMM = 510966
const AFP_LIST = [
  { value: 'modelo',   label: 'Modelo' },
  { value: 'capital',  label: 'Capital' },
  { value: 'cuprum',   label: 'Cuprum' },
  { value: 'habitat',  label: 'Habitat' },
  { value: 'planvital',label: 'PlanVital' },
  { value: 'provida',  label: 'ProVida' },
  { value: 'uno',      label: 'Uno' },
]
const HEALTH_OPTIONS = [
  { value: 'fonasa', label: 'FONASA' },
  { value: 'isapre', label: 'ISAPRE' },
]
const CONTRACT_TYPES = [
  { value: 'plazo_fijo', label: 'Plazo Fijo' },
  { value: 'indefinido', label: 'Indefinido' },
  { value: 'obra_faena', label: 'Obra o Faena' },
  { value: 'honorarios', label: 'Honorarios' },
  { value: 'aprendizaje', label: 'Aprendizaje' },
]
const DEPARTMENTS = ['Tecnologia','RRHH','Finanzas','Operaciones','Marketing','Legal','Gerencia','Diseño','Soporte']
const SCHEDULE_OPTIONS = [
  { value: 'full_time', label: 'Jornada Completa (45h)' },
  { value: 'part_time', label: 'Media Jornada' },
  { value: 'flexible', label: 'Horario Flexible' },
  { value: 'remoto', label: 'Teletrabajo' },
]
const BANKS = ['Banco Estado','BancoChile','Santander','BCI','Itaú','Scotiabank','Falabella','Ripley','Security','Consorcio']
const ACCOUNT_TYPES = [
  { value: 'cuenta_vista', label: 'Cuenta Vista' },
  { value: 'cuenta_corriente', label: 'Cuenta Corriente' },
  { value: 'cuenta_rut', label: 'Cuenta RUT' },
]
// ─── Tasas previsionales Chile 2025 ────────────────────────────
// Fuente: Superintendencia de Pensiones (www.spensiones.cl) — vigentes 2025
const AFP_RATES: Record<string, { commission: number; obligatory: number }> = {
  modelo:    { commission: 0.58, obligatory: 10.00 },
  capital:   { commission: 1.44, obligatory: 10.00 },
  cuprum:    { commission: 1.44, obligatory: 10.00 },
  habitat:   { commission: 1.27, obligatory: 10.00 },
  planvital: { commission: 1.16, obligatory: 10.00 },
  provida:   { commission: 1.45, obligatory: 10.00 },
  uno:       { commission: 0.49, obligatory: 10.00 },
}
// SIS (Seguro Invalidez y Sobrevivencia): 1.49% — costo del EMPLEADOR, no se descuenta del trabajador
const SIS_RATE = 1.49
const FONASA_RATE = 7.00   // % de remuneración imponible (Ley 18.469)
const AFC_WORKER = 0.60    // % trabajador (Ley 19.728)
const AFC_EMPLOYER_INDEFINIDO = 2.40  // % empleador contrato indefinido
const AFC_EMPLOYER_PLAZO_FIJO  = 3.00 // % empleador contrato plazo fijo/obra
// ISAPREs vigentes en Chile 2025 — cotización mínima legal 7% remuneración imponible
// (los planes tienen un costo adicional en UF según institución y cobertura)
const ISAPRE_LIST = [
  { value: 'banmedica',     label: 'Banmédica' },
  { value: 'colmena',       label: 'Colmena' },
  { value: 'cruz_blanca',   label: 'Cruz Blanca' },
  { value: 'nueva_masvida', label: 'Nueva MásVida' },
  { value: 'consalud',      label: 'Consalud' },
  { value: 'vida_tres',     label: 'Vida Tres' },
  { value: 'esencial',      label: 'Esencial' },
]
// Cálculo de descuentos legales sobre remuneración imponible
function calcDescuentos(grossSalary: number, afp: string, healthSystem: string, contractType: string) {
  const afpRate = AFP_RATES[afp] || AFP_RATES.modelo
  const afpObligatorio = Math.round(grossSalary * afpRate.obligatory / 100)
  const afpComision    = Math.round(grossSalary * afpRate.commission  / 100)
  const afpTotal       = afpObligatorio + afpComision
  const salud          = Math.round(grossSalary * FONASA_RATE / 100)
  const afcWorker      = Math.round(grossSalary * AFC_WORKER  / 100)
  const afcEmployer    = Math.round(grossSalary * (contractType === 'indefinido' ? AFC_EMPLOYER_INDEFINIDO : AFC_EMPLOYER_PLAZO_FIJO) / 100)
  const sisEmployer    = Math.round(grossSalary * SIS_RATE / 100)
  const totalWorker    = afpTotal + salud + afcWorker
  return { afpObligatorio, afpComision, afpTotal, salud, afcWorker, afcEmployer, sisEmployer, totalWorker }
}
// ─── APV y Descuentos Adicionales ──────────────────────────────
// Fuente: DL 3.500 Art.20 bis/ter, Ley 19.768, Ley 14.908, Art.58 CT
const APV_REGIMEN = [
  { value: 'B', label: 'Régimen B — Rebaja base imponible Imp. 2ª Categoría (rentas altas)' },
  { value: 'A', label: 'Régimen A — Crédito tributario 15%, tope 6 UTM/año (rentas bajas/medias)' },
]
const APV_INSTITUTIONS = [
  { value: 'afp_mismo',   label: 'Misma AFP del trabajador' },
  { value: 'fondo_mutuo', label: 'Administradora de Fondos Mutuos' },
  { value: 'banco',       label: 'Banco (depósito a plazo APV)' },
  { value: 'seguro_vida', label: 'Compañía de Seguros de Vida' },
  { value: 'otro',        label: 'Otra institución habilitada SP' },
]
const PENSION_TIPOS = [
  { value: 'fijo',       label: 'Monto fijo mensual ($)' },
  { value: 'porcentaje', label: 'Porcentaje del sueldo líquido (%)' },
]
const PENSION_DESTINO = [
  { value: 'transferencia', label: 'Transferencia bancaria al beneficiario' },
  { value: 'tribunal',      label: 'Depósito cuenta Tribunal de Familia' },
  { value: 'ojv',           label: 'Oficina Judicial Virtual (OJV) — Poder Judicial' },
]
const PENSION_CUENTA_TIPOS = [
  { value: 'cuenta_corriente', label: 'Cuenta Corriente' },
  { value: 'cuenta_vista',     label: 'Cuenta Vista' },
  { value: 'cuenta_rut',       label: 'Cuenta RUT' },
]
const PENSION_BANCOS = ['Banco Estado','BancoChile','Santander','BCI','Itaú','Scotiabank','Falabella','Ripley','Security','Consorcio','Tribunal de Familia']
const POSITIONS_LIST = [
  { value: 'gerente_general',      label: 'Gerente General / CEO' },
  { value: 'gerente_tecnologia',   label: 'Gerente de Tecnología / CTO' },
  { value: 'desarrollador_fullstack', label: 'Desarrollador/a Full Stack' },
  { value: 'disenador_ux',         label: 'Diseñador/a UX/UI' },
  { value: 'marketing_digital',    label: 'Responsable de Marketing Digital' },
  { value: 'rrhh_analista',        label: 'Analista de RRHH y Remuneraciones' },
  { value: 'ejecutivo_ventas',     label: 'Ejecutivo/a de Ventas' },
  { value: 'soporte_cliente',      label: 'Ejecutivo/a de Soporte al Cliente' },
  { value: 'contador',             label: 'Contador/a / Analista Financiero' },
  { value: 'coordinador_proyectos',label: 'Coordinador/a de Proyectos' },
  { value: 'otro',                 label: 'Otro (especificar)' },
]
const JOB_DESCRIPTIONS: Record<string, string> = {
  gerente_general: `• Dirigir y representar legalmente a Conniku SpA ante organismos públicos, privados y reguladores.
• Definir, comunicar y ejecutar la visión estratégica y objetivos corporativos de la empresa.
• Supervisar y coordinar todas las áreas funcionales: Tecnología, Ventas, Marketing, Finanzas y RRHH.
• Aprobar presupuestos anuales, estados financieros y planes de inversión.
• Gestionar relaciones con inversores, clientes clave, alianzas estratégicas y proveedores principales.
• Liderar procesos de fundraising, levantamiento de capital y expansión del negocio.
• Asegurar el cumplimiento de todas las obligaciones legales, tributarias y laborales de la empresa.
• Rendir cuentas periódicamente ante el directorio o junta de socios.
• Tomar decisiones ejecutivas críticas orientadas al crecimiento sostenible de la empresa.
• Fomentar la cultura organizacional, los valores y el bienestar de los colaboradores.
• Reporta a: Directorio / Junta de Socios.`,

  gerente_tecnologia: `• Definir y mantener la arquitectura tecnológica de la plataforma Conniku (frontend React/TypeScript, backend Python/FastAPI, nube Vercel/Render).
• Liderar, contratar y desarrollar al equipo de ingeniería de software.
• Establecer estándares de calidad de código: code reviews, CI/CD, testing automatizado.
• Gestionar la hoja de ruta técnica (roadmap) alineada con los objetivos de negocio.
• Garantizar la seguridad, escalabilidad y disponibilidad (99.9% uptime) de la plataforma.
• Evaluar, seleccionar e integrar nuevas tecnologías y herramientas.
• Gestionar infraestructura en la nube y relaciones con proveedores tecnológicos (Anthropic, Vercel, Render, etc.).
• Coordinar sprints, planificación ágil y retrospectivas del equipo técnico.
• Preparar informes técnicos y métricas de rendimiento para la gerencia general.
• Reporta a: Gerente General / CEO.`,

  desarrollador_fullstack: `• Desarrollar y mantener el frontend de la plataforma Conniku usando React 18, TypeScript y Vite.
• Desarrollar y mantener el backend con Python, FastAPI y SQLAlchemy.
• Implementar nuevas funcionalidades según el roadmap y requerimientos del producto.
• Participar activamente en code reviews y definición de arquitectura técnica.
• Corregir defectos (bugs), optimizar rendimiento y asegurar la calidad del código.
• Colaborar con el equipo de diseño UX/UI para implementar interfaces de usuario.
• Integrar APIs y servicios de terceros (pagos, email, notificaciones push, IA).
• Documentar el código, APIs y procesos técnicos.
• Asegurar la seguridad, escalabilidad y mantenibilidad del código producido.
• Reporta a: Gerente de Tecnología / CTO.`,

  disenador_ux: `• Diseñar interfaces de usuario para la plataforma Conniku (web y mobile) usando Figma u otras herramientas profesionales.
• Crear wireframes, prototipos interactivos y flujos de usuario para nuevas funcionalidades.
• Realizar investigación de usuarios (UX research), encuestas y pruebas de usabilidad.
• Mantener y evolucionar el sistema de diseño (design system) y componentes reutilizables.
• Colaborar con el equipo de desarrollo para asegurar fidelidad en la implementación del diseño.
• Diseñar materiales gráficos para marketing digital, redes sociales y comunicación institucional.
• Asegurar la accesibilidad (WCAG 2.1) y responsividad de todas las interfaces.
• Participar en la definición del roadmap de producto y estrategia de experiencia de usuario.
• Mantener actualizados los archivos de diseño y documentación visual de la empresa.
• Reporta a: Gerente de Tecnología / CTO y/o Gerente General.`,

  marketing_digital: `• Planificar, ejecutar y optimizar estrategias de marketing digital para Conniku.
• Gestionar y hacer crecer la presencia en redes sociales (Instagram, LinkedIn, TikTok, X).
• Crear y publicar contenido relevante, atractivo y alineado con la marca para el segmento estudiantil chileno.
• Gestionar campañas de publicidad pagada (Google Ads, Meta Ads) optimizando el CPA y ROAS.
• Ejecutar estrategias de SEO on-page y off-page para aumentar el tráfico orgánico.
• Gestionar campañas de email marketing (Zoho Campaigns) con segmentación y A/B testing.
• Analizar métricas de adquisición, retención y engagement usando Google Analytics y herramientas similares.
• Colaborar con el equipo de ventas para generar y nutrir leads calificados.
• Preparar reportes mensuales de performance de marketing con KPIs clave.
• Reporta a: Gerente General / CEO.`,

  rrhh_analista: `• Gestionar el ciclo completo del colaborador: reclutamiento, onboarding, desarrollo y offboarding.
• Procesar mensualmente las liquidaciones de sueldo de todos los colaboradores, incluyendo haberes, descuentos legales e impuesto de segunda categoría.
• Calcular y pagar cotizaciones previsionales (AFP, Salud, AFC) a través de Previred antes del 10° día hábil del mes siguiente.
• Calcular finiquitos, indemnizaciones por años de servicio y compensaciones legales al término de contratos.
• Gestionar anticipos de remuneración (máx. 40% del sueldo bruto, Art. 58 CT) y llevar el registro correspondiente.
• Elaborar contratos de trabajo, anexos, cartas de amonestación y documentos legales conforme al Código del Trabajo.
• Gestionar y mantener actualizada la plataforma ERC (Employee Records Center) de Conniku.
• Coordinar procesos de onboarding para nuevos colaboradores, incluyendo inducción y entrega de materiales.
• Administrar solicitudes de licencias médicas, vacaciones, permisos y ausentismo.
• Asegurar el cumplimiento de la normativa laboral chilena: Dirección del Trabajo (DT), Previred, SII y Mutual de Seguridad.
• Gestionar relaciones con organismos reguladores laborales y representar a la empresa en instancias de mediación.
• Desarrollar iniciativas de clima laboral, bienestar y cultura organizacional.
• Reporta a: Gerente General / CEO.`,

  ejecutivo_ventas: `• Prospectar, contactar y captar nuevos clientes (instituciones educativas, universidades, empresas).
• Gestionar el embudo de ventas completo en el CRM desde prospecto hasta cierre.
• Realizar demostraciones de la plataforma Conniku a potenciales clientes de forma presencial y virtual.
• Negociar condiciones comerciales, elaborar propuestas y cerrar contratos de servicio.
• Mantener relaciones con clientes actuales, asegurar renovaciones y detectar oportunidades de upsell.
• Alcanzar las cuotas mensuales y trimestrales de ventas establecidas por la gerencia.
• Participar en eventos, ferias y encuentros del sector educativo chileno.
• Reportar métricas de ventas y pipeline semanalmente a la gerencia.
• Colaborar con el equipo de marketing en estrategias de generación de demanda.
• Reporta a: Gerente General / CEO.`,

  soporte_cliente: `• Atender y resolver consultas, incidencias y requerimientos de usuarios vía email, chat y teléfono dentro de los SLAs definidos.
• Gestionar y dar seguimiento a tickets de soporte hasta su resolución completa.
• Documentar bugs, mejoras y requerimientos funcionales para el equipo de tecnología.
• Capacitar y acompañar a nuevos usuarios e instituciones en el uso de la plataforma Conniku.
• Elaborar y mantener actualizados FAQs, guías de usuario y materiales de autoservicio.
• Recopilar y sistematizar feedback de usuarios para el equipo de producto.
• Colaborar con el equipo de onboarding en la incorporación de nuevas instituciones.
• Identificar proactivamente usuarios en riesgo de churn y coordinar acciones de retención.
• Mantener indicadores de satisfacción del cliente (NPS, CSAT) dentro de los objetivos establecidos.
• Reporta a: Gerente General / CEO o Coordinador/a de Proyectos.`,

  contador: `• Llevar la contabilidad completa de Conniku SpA conforme al Código Tributario y normativas del SII.
• Preparar y presentar declaraciones mensuales de IVA (Formulario 29) y declaración anual de Renta (Formulario 22).
• Controlar y registrar ingresos, egresos, flujo de caja y conciliaciones bancarias.
• Elaborar estados financieros mensuales: balance general, estado de resultados y variación de capital.
• Gestionar la emisión de facturas electrónicas (DTE) y documentos tributarios a través del SII.
• Preparar y procesar la liquidación de sueldos, cotizaciones previsionales (AFP, Salud, AFC) y pago vía Previred.
• Gestionar cuentas por pagar y por cobrar, asegurando la oportuna recuperación de créditos.
• Coordinar y apoyar auditorías internas y externas.
• Mantener actualizada y ordenada la documentación contable y tributaria de la empresa.
• Reporta a: Gerente General / CEO.`,

  coordinador_proyectos: `• Planificar, coordinar y supervisar proyectos internos de Conniku desde su inicio hasta el cierre.
• Elaborar y mantener cronogramas de proyecto con hitos, entregables y responsables definidos.
• Facilitar la comunicación y alineación entre equipos: tecnología, marketing, ventas y RRHH.
• Aplicar metodologías ágiles (Scrum, Kanban) para gestión eficiente de proyectos.
• Identificar, analizar y gestionar riesgos y obstáculos que puedan afectar el avance de los proyectos.
• Preparar reportes periódicos de avance, estado de proyectos y KPIs para la gerencia.
• Coordinar con proveedores, partners y clientes externos para el cumplimiento de acuerdos.
• Asegurar que los proyectos se entreguen dentro del alcance, tiempo y presupuesto acordados.
• Documentar procesos, lecciones aprendidas y mejores prácticas del equipo.
• Reporta a: Gerente General / CEO.`,
}
// ─── Formateador RUT Chile ──────────────────────────────────────
function formatRUT(raw: string): string {
  // Limpia todo excepto dígitos y K
  const clean = raw.replace(/[^0-9kK]/g, '').toUpperCase()
  if (clean.length === 0) return ''
  if (clean.length === 1) return clean
  const verifier = clean.slice(-1)
  const numbers  = clean.slice(0, -1)
  // Puntos cada 3 dígitos de derecha a izquierda
  const dotted = numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${dotted}-${verifier}`
}

const STATUS_COLOR: Record<string, string> = {
  active: '#22c55e',
  terminated: '#ef4444',
  suspended: '#f59e0b',
  on_leave: '#3b82f6',
}
const STATUS_LABEL: Record<string, string> = {
  active: 'Activo',
  terminated: 'Terminado',
  suspended: 'Suspendido',
  on_leave: 'Con Permiso',
}

// ─── Helpers ────────────────────────────────────────────────────
function fmtDate(iso: string) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('es-CL') } catch { return iso }
}
function fmtMoney(n: number) {
  return `$${(n || 0).toLocaleString('es-CL')}`
}
function initials(e: Employee) {
  return `${e.firstName?.[0] || ''}${e.lastName?.[0] || ''}`.toUpperCase()
}
function fullName(e: Employee) {
  return `${e.firstName} ${e.lastName}`.trim()
}
function avatarColor(e: Employee) {
  const colors = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899']
  const idx = (e.firstName?.charCodeAt(0) || 0) % colors.length
  return colors[idx]
}

// ─── Sub-components ─────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text', disabled }: {
  value: string | number; onChange?: (v: string) => void
  placeholder?: string; type?: string; disabled?: boolean
}) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: '100%', padding: '8px 12px', borderRadius: 8,
        border: '1px solid var(--border)', background: disabled ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
        color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box',
        outline: 'none', fontFamily: 'inherit',
      }}
    />
  )
}

function Select({ value, onChange, options, disabled }: {
  value: string; onChange?: (v: string) => void
  options: { value: string; label: string }[] | string[]; disabled?: boolean
}) {
  const opts = options.map(o => typeof o === 'string' ? { value: o, label: o } : o)
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange?.(e.target.value)}
      disabled={disabled}
      style={{
        width: '100%', padding: '8px 12px', borderRadius: 8,
        border: '1px solid var(--border)', background: disabled ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
        color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box',
        outline: 'none', fontFamily: 'inherit', cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function RutInput({ value, onChange, disabled }: { value: string; onChange?: (v: string) => void; disabled?: boolean }) {
  return (
    <input
      type="text"
      value={value ?? ''}
      placeholder="12.345.678-9"
      disabled={disabled}
      maxLength={12}
      onChange={e => onChange?.(formatRUT(e.target.value))}
      style={{
        width: '100%', padding: '8px 12px', borderRadius: 8,
        border: '1px solid var(--border)', background: disabled ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
        color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box',
        outline: 'none', fontFamily: 'inherit',
      }}
    />
  )
}

function ErrMsg({ msg }: { msg?: string }) {
  if (!msg) return null
  return <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{msg}</div>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase',
      letterSpacing: '1px', margin: '20px 0 14px', paddingBottom: 6,
      borderBottom: '1px solid var(--border)',
    }}>
      {children}
    </div>
  )
}

// ─── Generador de contrato HTML imprimible (versión completa) ────
function buildContractHTML(form: any, jobDescription: string): string {
  const today = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
  const contractLabel = CONTRACT_TYPES.find(c => c.value === form.contractType)?.label || form.contractType
  const scheduleLabel = SCHEDULE_OPTIONS.find(s => s.value === form.workSchedule)?.label || form.workSchedule
  const afpLabel = AFP_LIST.find(a => a.value === form.afp)?.label || form.afp
  const healthLabel = form.healthSystem === 'fonasa' ? 'FONASA' : `ISAPRE ${form.isapreName || ''}`
  const duracionClause = form.contractType === 'indefinido'
    ? 'El presente contrato es de duración <strong>indefinida</strong>, en conformidad con el artículo 159 N°4 del Código del Trabajo.'
    : form.contractType === 'plazo_fijo'
    ? `El presente contrato es de <strong>plazo fijo</strong>, con fecha de inicio <strong>${fmtDate(form.hireDate)}</strong> y fecha de término <strong>${fmtDate(form.endDate || '')}</strong>, en conformidad con el artículo 159 N°4 del Código del Trabajo.`
    : `El presente contrato es por <strong>${contractLabel}</strong>, a partir del <strong>${fmtDate(form.hireDate)}</strong>.`

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Contrato Individual de Trabajo — ${form.firstName} ${form.lastName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 11.5pt; color: #000; background: #fff; padding: 36px 56px; line-height: 1.65; }
    .liq-wrap { border: 2px solid #334155; border-radius: 4px; margin: 10px 0 14px; overflow: hidden; font-family: Arial, sans-serif; font-size: 10pt; }
    .liq-header { background: #1e293b; color: #fff; padding: 7px 14px; font-weight: bold; font-size: 10.5pt; letter-spacing: 0.5px; }
    .liq-sub { background: #334155; color: #e2e8f0; padding: 4px 14px; font-size: 9.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; }
    .liq-table { width: 100%; border-collapse: collapse; }
    .liq-table td { padding: 4px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    .liq-table tr:last-child td { border-bottom: none; }
    .liq-label { width: 44%; font-size: 10pt; color: #1e293b; }
    .liq-detail { width: 30%; font-size: 9pt; color: #64748b; }
    .liq-amount { width: 26%; text-align: right; font-weight: 600; color: #1e293b; font-size: 10pt; }
    .liq-total td { background: #f1f5f9; font-weight: bold; font-size: 10.5pt; color: #0f172a; padding: 6px 10px; }
    .liq-net td { background: #0f172a; color: #fff; font-weight: bold; font-size: 12pt; padding: 9px 12px; border-bottom: none; }
    .liq-employer td { background: #fafafa; color: #64748b; font-size: 9.5pt; }
    .liq-employer-total td { background: #f1f5f9; font-size: 9.5pt; color: #475569; font-weight: bold; }
    .liq-note { background: #fffbeb; border-top: 2px solid #f59e0b; padding: 8px 14px; font-size: 9pt; color: #78350f; line-height: 1.55; font-family: Arial, sans-serif; }
    h1 { font-size: 15pt; text-align: center; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px; }
    .subtitle { text-align: center; font-size: 10.5pt; margin-bottom: 6px; color: #333; }
    .subtitle2 { text-align: center; font-size: 10pt; margin-bottom: 28px; color: #666; }
    .clause { margin-bottom: 14px; text-align: justify; }
    .clause-title { font-weight: bold; text-transform: uppercase; font-size: 10.5pt; margin-bottom: 5px; border-bottom: 1px solid #999; padding-bottom: 2px; margin-top: 18px; }
    table.data { width: 100%; border-collapse: collapse; margin: 8px 0 12px; }
    table.data td { padding: 5px 8px; border: 1px solid #bbb; font-size: 10.5pt; vertical-align: top; }
    table.data td:first-child { font-weight: bold; width: 38%; background: #f7f7f7; }
    .jd-box { background: #f5f5f5; border-left: 3px solid #555; padding: 8px 12px; margin: 6px 0 10px; font-size: 10.5pt; white-space: pre-wrap; line-height: 1.55; }
    .info-box { background: #f0f4ff; border: 1px solid #c7d2fe; border-radius: 4px; padding: 8px 12px; margin: 6px 0; font-size: 10pt; }
    .warn-box { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 4px; padding: 8px 12px; margin: 6px 0; font-size: 10pt; }
    .signatures { margin-top: 50px; display: flex; justify-content: space-between; gap: 40px; }
    .sig-block { flex: 1; text-align: center; }
    .sig-line { border-top: 1px solid #000; padding-top: 6px; margin-top: 55px; }
    .sig-name { font-weight: bold; font-size: 11pt; }
    .sig-role { font-size: 10pt; color: #444; }
    .fea-block { margin-top: 22px; text-align: center; font-size: 10pt; color: #555; }
    .fea-block a { color: #1a56db; }
    .footer-note { margin-top: 28px; font-size: 9pt; color: #666; border-top: 1px solid #ccc; padding-top: 8px; text-align: center; }
    @media print { body { padding: 18px 36px; } }
  </style>
</head>
<body>

  <h1>Contrato Individual de Trabajo</h1>
  <p class="subtitle">Conniku SpA · RUT 78.395.702-7</p>
  <p class="subtitle2">Antofagasta, Región de Antofagasta, Chile · contacto@conniku.com · conniku.com</p>

  <div class="clause">
    En Antofagasta, a ${today}, entre <strong>Conniku SpA</strong>, RUT 78.395.702-7 (en adelante «el Empleador»), representada por su Gerente General, y <strong>${form.firstName} ${form.lastName}</strong>, RUT ${form.rut} (en adelante «el Trabajador»), se suscribe el siguiente Contrato Individual de Trabajo, al amparo del Código del Trabajo de la República de Chile y demás normas legales vigentes.
  </div>

  <div class="section">
    <div class="clause-title">Antecedentes de las Partes</div>
    <strong>Empleador:</strong>
    <table class="data">
      <tr><td>Razón Social</td><td>Conniku SpA</td></tr>
      <tr><td>RUT</td><td>78.395.702-7</td></tr>
      <tr><td>Giro</td><td>Desarrollo y Comercialización de Software (631200)</td></tr>
      <tr><td>Domicilio</td><td>Antofagasta, Región de Antofagasta, Chile</td></tr>
      <tr><td>Email</td><td>contacto@conniku.com</td></tr>
      <tr><td>Representante Legal</td><td>Cristian Andrés Gutiérrez Lazcano — RUT 14.112.896-5</td></tr>
    </table>
    <strong>Trabajador:</strong>
    <table class="data">
      <tr><td>Nombre Completo</td><td>${form.firstName} ${form.lastName}</td></tr>
      <tr><td>RUT</td><td>${form.rut}</td></tr>
      <tr><td>Nacionalidad</td><td>${form.nationality || 'Chilena'}</td></tr>
      <tr><td>Estado Civil</td><td>${form.maritalStatus || '—'}</td></tr>
      <tr><td>Domicilio</td><td>${form.address || '—'}</td></tr>
      <tr><td>Email</td><td>${form.email}</td></tr>
      <tr><td>Teléfono</td><td>${form.phone || '—'}</td></tr>
    </table>
  </div>

  <div class="clause-title">Primero — Naturaleza de los Servicios y Descripción del Cargo</div>
  <div class="clause">
    El Trabajador se desempeñará en el cargo de <strong>${form.position}</strong>, perteneciente al área de <strong>${form.department}</strong> de Conniku SpA. Sus funciones, responsabilidades y atribuciones son las siguientes:
  </div>
  <div class="jd-box">${jobDescription || '(Sin descripción de cargo especificada)'}</div>
  <div class="clause">
    El Empleador podrá encomendar al Trabajador otras funciones afines a su cargo, sin que ello implique menoscabo ni disminución de la remuneración, en conformidad con el artículo 12 del Código del Trabajo.
  </div>

  <div class="clause-title">Segundo — Lugar de Trabajo</div>
  <div class="clause">
    El Trabajador prestará sus servicios en las dependencias de Conniku SpA, ubicadas en Antofagasta, Región de Antofagasta, Chile, o en el lugar que la empresa determine según las necesidades del negocio. Las partes podrán acordar modalidad de teletrabajo conforme a la Ley 21.220 sobre Trabajo a Distancia y Teletrabajo, lo que deberá constar en anexo escrito suscrito por ambas partes.
  </div>

  <div class="clause-title">Tercero — Duración del Contrato</div>
  <div class="clause">${duracionClause}</div>
  <div class="info-box">
    <strong>Art. 9 CT:</strong> El contrato deberá quedar firmado dentro de los 15 días corridos siguientes a la incorporación del Trabajador. Ante incumplimiento imputable al Empleador, el Trabajador podrá solicitar a la Inspección del Trabajo que requiera la firma correspondiente.
  </div>

  <div class="clause-title">Cuarto — Jornada de Trabajo</div>
  <div class="clause">
    La jornada de trabajo ordinaria será de <strong>${form.weeklyHours} horas semanales</strong> en modalidad <strong>${scheduleLabel}</strong>, distribuidas de lunes a viernes, en conformidad con el artículo 22 del Código del Trabajo. Los horarios de entrada, salida y colación serán coordinados con el Empleador y consignados en el Reglamento Interno de Orden, Higiene y Seguridad (RIOHS). El Empleador podrá modificar la distribución de la jornada conforme al artículo 12 del CT, con aviso previo de 30 días.
  </div>

  <div class="clause-title">Quinto — Horas Extraordinarias</div>
  <div class="clause">
    Las horas extraordinarias son aquellas que exceden la jornada ordinaria pactada. Solo se realizarán en situaciones temporales derivadas de necesidades o situaciones imprevistas de la empresa, de conformidad con los artículos 30 al 32 del Código del Trabajo. Deberán ser pactadas por escrito y el recargo mínimo será del 50% sobre el valor de la hora ordinaria. No se podrán pactar más de 2 horas extraordinarias por día. El registro y control de asistencia se llevará según lo establece el artículo 33 del CT.
  </div>

  <div class="clause-title">Sexto — Remuneración, Cotizaciones y Política de Pagos</div>
  <div class="clause">Las partes acuerdan la siguiente estructura remuneracional. Los montos indicados corresponden a la proyección de la primera liquidación mensual completa, calculada a la fecha de suscripción de este contrato como referencia. Los porcentajes de cotizaciones se actualizarán automáticamente conforme a las resoluciones de la Superintendencia de Pensiones, FONASA, ISAPREs y AFC, sin necesidad de modificar este instrumento.</div>
  ${(() => {
    const salary = Number(form.grossSalary)
    const colacion = Number(form.colacion) || 0
    const movilizacion = Number(form.movilizacion) || 0
    const totalHaberes = salary + colacion + movilizacion
    const d = calcDescuentos(salary, form.afp, form.healthSystem, form.contractType)
    const isapreLabel = form.healthSystem === 'isapre' ? (ISAPRE_LIST.find(i => i.value === form.isapreProvider)?.label || 'ISAPRE') : ''
    const afpR = AFP_RATES[form.afp] || AFP_RATES.modelo
    const afpLabel = AFP_LIST.find(a => a.value === form.afp)?.label || form.afp
    const netLiquido = salary - d.afpTotal - d.salud - d.afcWorker
    const afcEmployerRate = form.contractType === 'indefinido' ? AFC_EMPLOYER_INDEFINIDO : AFC_EMPLOYER_PLAZO_FIJO
    const totalCostoEmpresa = d.afcEmployer + d.sisEmployer
    return `
  <div class="liq-wrap">
    <div class="liq-header">📋 LIQUIDACIÓN DE REMUNERACIÓN — REFERENCIA CONTRATO</div>
    <div class="liq-sub">I. Haberes — Total imponible + no imponible</div>
    <table class="liq-table">
      <tr>
        <td class="liq-label">Sueldo Base</td>
        <td class="liq-detail">Imponible · Art. 41 y 44 CT</td>
        <td class="liq-amount">${fmtMoney(salary)}</td>
      </tr>
      ${colacion > 0 ? `<tr>
        <td class="liq-label">Asignación de Colación</td>
        <td class="liq-detail">No imponible · no afecta AFP/Salud</td>
        <td class="liq-amount">${fmtMoney(colacion)}</td>
      </tr>` : ''}
      ${movilizacion > 0 ? `<tr>
        <td class="liq-label">Asignación de Movilización</td>
        <td class="liq-detail">No imponible · no afecta AFP/Salud</td>
        <td class="liq-amount">${fmtMoney(movilizacion)}</td>
      </tr>` : ''}
      <tr class="liq-total">
        <td colspan="2">TOTAL HABERES</td>
        <td style="text-align:right;">${fmtMoney(totalHaberes)}</td>
      </tr>
    </table>

    <div class="liq-sub">II. Descuentos Legales — Cargo trabajador</div>
    <table class="liq-table">
      <tr>
        <td class="liq-label">AFP ${afpLabel} — Cotización obligatoria</td>
        <td class="liq-detail">${afpR.obligatory}% de ${fmtMoney(salary)} imponible · Ley 3.500</td>
        <td class="liq-amount">${fmtMoney(d.afpObligatorio)}</td>
      </tr>
      <tr>
        <td class="liq-label">AFP ${afpLabel} — Comisión administración</td>
        <td class="liq-detail">${afpR.commission}% de ${fmtMoney(salary)} imponible</td>
        <td class="liq-amount">${fmtMoney(d.afpComision)}</td>
      </tr>
      <tr>
        <td class="liq-label">${form.healthSystem === 'fonasa' ? 'FONASA' : `ISAPRE ${isapreLabel}`}</td>
        <td class="liq-detail">${FONASA_RATE}% de ${fmtMoney(salary)} imponible · ${form.healthSystem === 'fonasa' ? 'Ley 18.469' : 'DFL 1/2005 — mínimo legal; plan en UF puede ser mayor'}</td>
        <td class="liq-amount">${fmtMoney(d.salud)}</td>
      </tr>
      <tr>
        <td class="liq-label">AFC — Seguro de Cesantía trabajador</td>
        <td class="liq-detail">${AFC_WORKER}% de ${fmtMoney(salary)} imponible · Ley 19.728</td>
        <td class="liq-amount">${fmtMoney(d.afcWorker)}</td>
      </tr>
      ${form.apvActivo && form.apvMonto > 0 ? `<tr>
        <td class="liq-label">APV — Ahorro Previsional Voluntario (Régimen ${form.apvRegimen})</td>
        <td class="liq-detail">${form.apvInstitucion === 'afp_mismo' ? `Misma AFP ${afpLabel}` : (form.apvInstitucionNombre || 'Institución habilitada')} · DL 3.500 Art. 20 bis · Ley 19.768${form.apvRegimen === 'B' ? ' · Rebaja base imponible Imp. 2ª Cat.' : ' · Crédito trib. 15%'}</td>
        <td class="liq-amount">${fmtMoney(Number(form.apvMonto))}</td>
      </tr>` : ''}
      ${form.pensionActiva ? `<tr>
        <td class="liq-label">Pensión de Alimentos</td>
        <td class="liq-detail">RIT ${form.pensionRit || '—'} · ${form.pensionTribunal || 'Tribunal de Familia'} · Ley 14.908 · Art. 58 CT</td>
        <td class="liq-amount">${form.pensionTipo === 'fijo' ? fmtMoney(Number(form.pensionMonto)) : fmtMoney(Math.round(netLiquido * Number(form.pensionPorcentaje) / 100)) + ` (${form.pensionPorcentaje}% líquido)`}</td>
      </tr>` : ''}
      ${form.cuotaSindicalActiva && form.cuotaSindicalMonto > 0 ? `<tr>
        <td class="liq-label">Cuota Sindical</td>
        <td class="liq-detail">${form.cuotaSindicalSindicato || 'Sindicato'} · Art. 262 CT</td>
        <td class="liq-amount">${fmtMoney(Number(form.cuotaSindicalMonto))}</td>
      </tr>` : ''}
      ${form.prestamoActivo && form.prestamoCuota > 0 ? `<tr>
        <td class="liq-label">Cuota Préstamo Empresa</td>
        <td class="liq-detail">Saldo total: ${fmtMoney(Number(form.prestamoSaldo))} · Autorizado por el trabajador · Art. 58 CT</td>
        <td class="liq-amount">${fmtMoney(Number(form.prestamoCuota))}</td>
      </tr>` : ''}
      ${form.seguroColectivoActivo && form.seguroColectivoMonto > 0 ? `<tr>
        <td class="liq-label">Seguro Colectivo</td>
        <td class="liq-detail">${form.seguroColectivoAseguradora || 'Aseguradora'} · Prima mensual acordada con trabajador</td>
        <td class="liq-amount">${fmtMoney(Number(form.seguroColectivoMonto))}</td>
      </tr>` : ''}
      ${(() => {
        const apv = form.apvActivo ? Number(form.apvMonto) : 0
        const pension = form.pensionActiva ? (form.pensionTipo === 'fijo' ? Number(form.pensionMonto) : Math.round(netLiquido * Number(form.pensionPorcentaje) / 100)) : 0
        const sindical = form.cuotaSindicalActiva ? Number(form.cuotaSindicalMonto) : 0
        const prestamo = form.prestamoActivo ? Number(form.prestamoCuota) : 0
        const seguro = form.seguroColectivoActivo ? Number(form.seguroColectivoMonto) : 0
        const totalAdicional = apv + pension + sindical + prestamo + seguro
        if (totalAdicional === 0) return ''
        return `<tr style="background:#fff7ed;">
          <td class="liq-label" style="font-size:9.5pt;color:#92400e;">Subtotal descuentos adicionales</td>
          <td class="liq-detail" style="color:#92400e;">APV + Pensión + Sindical + Préstamo + Seguro</td>
          <td class="liq-amount" style="color:#92400e;">${fmtMoney(totalAdicional)}</td>
        </tr>`
      })()}
      ${(() => {
        const apv = form.apvActivo ? Number(form.apvMonto) : 0
        const pension = form.pensionActiva ? (form.pensionTipo === 'fijo' ? Number(form.pensionMonto) : Math.round(netLiquido * Number(form.pensionPorcentaje) / 100)) : 0
        const sindical = form.cuotaSindicalActiva ? Number(form.cuotaSindicalMonto) : 0
        const prestamo = form.prestamoActivo ? Number(form.prestamoCuota) : 0
        const seguro = form.seguroColectivoActivo ? Number(form.seguroColectivoMonto) : 0
        const totalDesc = d.totalWorker + apv + pension + sindical + prestamo + seguro
        return `<tr class="liq-total">
          <td colspan="2">TOTAL DESCUENTOS TRABAJADOR</td>
          <td style="text-align:right;">${fmtMoney(totalDesc)}</td>
        </tr>`
      })()}
    </table>

    <div class="liq-sub">III. Líquido a pagar al trabajador</div>
    <table class="liq-table">
      <tr>
        <td class="liq-label">Total Haberes</td>
        <td class="liq-detail"></td>
        <td class="liq-amount">${fmtMoney(totalHaberes)}</td>
      </tr>
      <tr>
        <td class="liq-label">(−) Descuentos previsionales obligatorios</td>
        <td class="liq-detail">AFP + Salud + AFC trabajador</td>
        <td class="liq-amount" style="color:#dc2626;">− ${fmtMoney(d.totalWorker)}</td>
      </tr>
      ${(() => {
        const apv = form.apvActivo ? Number(form.apvMonto) : 0
        const pension = form.pensionActiva ? (form.pensionTipo === 'fijo' ? Number(form.pensionMonto) : Math.round(netLiquido * Number(form.pensionPorcentaje) / 100)) : 0
        const sindical = form.cuotaSindicalActiva ? Number(form.cuotaSindicalMonto) : 0
        const prestamo = form.prestamoActivo ? Number(form.prestamoCuota) : 0
        const seguro = form.seguroColectivoActivo ? Number(form.seguroColectivoMonto) : 0
        const totalAdicional = apv + pension + sindical + prestamo + seguro
        if (totalAdicional === 0) return ''
        return `<tr>
          <td class="liq-label">(−) Descuentos adicionales</td>
          <td class="liq-detail">APV + Alimentos + Sindical + Otros</td>
          <td class="liq-amount" style="color:#dc2626;">− ${fmtMoney(totalAdicional)}</td>
        </tr>`
      })()}
      <tr class="liq-net">
        <td colspan="2">💰 TOTAL LÍQUIDO A RECIBIR *</td>
        <td style="text-align:right;">${(() => {
          const apv = form.apvActivo ? Number(form.apvMonto) : 0
          const pension = form.pensionActiva ? (form.pensionTipo === 'fijo' ? Number(form.pensionMonto) : Math.round(netLiquido * Number(form.pensionPorcentaje) / 100)) : 0
          const sindical = form.cuotaSindicalActiva ? Number(form.cuotaSindicalMonto) : 0
          const prestamo = form.prestamoActivo ? Number(form.prestamoCuota) : 0
          const seguro = form.seguroColectivoActivo ? Number(form.seguroColectivoMonto) : 0
          const totalDesc = d.totalWorker + apv + pension + sindical + prestamo + seguro
          return fmtMoney(totalHaberes - totalDesc)
        })()}</td>
      </tr>
    </table>

    <div class="liq-sub">IV. Costos adicionales empresa (no se descuentan del trabajador)</div>
    <table class="liq-table">
      <tr class="liq-employer">
        <td class="liq-label">AFC — Seguro Cesantía empleador</td>
        <td class="liq-detail">${afcEmployerRate}% · ${form.contractType === 'indefinido' ? 'contrato indefinido' : 'plazo fijo/obra'} · Ley 19.728</td>
        <td class="liq-amount">${fmtMoney(d.afcEmployer)}</td>
      </tr>
      <tr class="liq-employer">
        <td class="liq-label">SIS — Seguro Invalidez y Sobrevivencia</td>
        <td class="liq-detail">${SIS_RATE}% · íntegro cargo empleador · Ley 3.500</td>
        <td class="liq-amount">${fmtMoney(d.sisEmployer)}</td>
      </tr>
      <tr class="liq-employer-total">
        <td colspan="2">Total costo empresa adicional al sueldo</td>
        <td style="text-align:right;">${fmtMoney(totalCostoEmpresa)}</td>
      </tr>
    </table>

    <div class="liq-sub">V. Forma de pago</div>
    <table class="liq-table">
      <tr>
        <td class="liq-label">Institución bancaria</td>
        <td class="liq-detail">Depósito el último día hábil del mes · Art. 55 CT</td>
        <td class="liq-amount" style="font-size:9.5pt;">${form.bankName}</td>
      </tr>
      <tr>
        <td class="liq-label">${ACCOUNT_TYPES.find(a => a.value === form.bankAccountType)?.label || 'Cuenta'}</td>
        <td class="liq-detail">N° de cuenta</td>
        <td class="liq-amount" style="font-size:9.5pt;">${form.bankAccountNumber || '—'}</td>
      </tr>
    </table>

    <div class="liq-note">
      ⚠️ <strong>Nota legal:</strong> (*) El líquido indicado es referencial y no incluye el Impuesto Único de Segunda Categoría (Art. 42 N°1 Ley de Renta), que se calculará mensualmente según la escala progresiva vigente. Tampoco incluye descuentos por pensión alimenticia judicial ni otros autorizados por escrito.<br>
      Los porcentajes de cotización AFP, FONASA, ISAPRE y AFC corresponden a las tasas <strong>vigentes al ${new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>. Se actualizarán automáticamente conforme a las resoluciones de la <strong>Superintendencia de Pensiones</strong> (spensiones.cl), <strong>FONASA</strong> (fonasa.cl), las ISAPREs y el <strong>Fondo de Cesantía</strong> (afc.cl), sin que sea necesario modificar este contrato. El Empleador informará al Trabajador de cualquier cambio que afecte su liquidación mensual.
    </div>
  </div>`
  })()}
  <div class="clause">
    <strong>Cierre de mes:</strong> Las remuneraciones se calcularán considerando el cierre del período el <strong>día 22 de cada mes</strong>. Los días trabajados entre el 23 y el último día del mes se arrastrarán al período siguiente. <strong>Fecha de pago:</strong> El pago se realizará el <strong>último día hábil de cada mes</strong>, mediante depósito en la cuenta bancaria indicada (Art. 55 CT).
  </div>
  <div class="clause">
    <strong>Anticipo de remuneración (Art. 58 CT):</strong> El Trabajador podrá solicitar un anticipo de hasta el <strong>40% de su sueldo bruto</strong>, previa solicitud escrita al Empleador. Esta facultad estará disponible desde el <strong>segundo mes</strong> de contrato. El anticipo será descontado íntegramente en la liquidación del mes correspondiente.
  </div>
  <div class="clause">
    <strong>Cotizaciones previsionales y entrega de liquidación:</strong> El Empleador enterará las cotizaciones obligatorias de AFP, Salud y AFC a través de <strong>Previred</strong> (previred.com), dentro del plazo legal (hasta el 10° día hábil del mes siguiente al devengo). El Trabajador recibirá copia de su liquidación de sueldo mensual debidamente firmada el <strong>último día hábil del mes</strong>, junto con el pago de su remuneración, a través del medio que ambas partes acuerden (digital o físico).
    En caso de disconformidad con los montos liquidados, descuentos aplicados o cualquier aspecto de la liquidación, el Trabajador podrá presentar una apelación formal dentro de los <strong>7 días hábiles siguientes</strong> a la fecha de pago, enviando su reclamo con los antecedentes correspondientes directamente al Gerente General de Conniku SpA a la dirección: <strong>ceo@conniku.com</strong>. El Empleador deberá dar respuesta escrita dentro de los 5 días hábiles siguientes a la recepción del reclamo. Lo anterior es sin perjuicio del derecho del Trabajador a recurrir a la Inspección del Trabajo en cualquier momento (www.dt.gob.cl / 600 450 4000).
  </div>
  <div class="clause">
    <strong>Descuentos legales (Art. 58 CT):</strong> Solo se podrán efectuar descuentos para cotizaciones previsionales, impuesto de segunda categoría, pensión alimenticia judicial, cuotas sindicales y demás obligaciones legales. Cualquier otro descuento requiere autorización escrita del Trabajador.
  </div>

  <div class="clause-title">Séptimo — Vacaciones y Feriado Anual</div>
  <div class="clause">
    El Trabajador tendrá derecho a un feriado anual pagado de <strong>15 días hábiles</strong>, después de cada año de servicio continuo, según lo establece el artículo 67 del Código del Trabajo. Los feriados progresivos se aplicarán conforme al artículo 68 del CT (un día adicional por cada 3 años de servicio con el mismo empleador, desde el décimo año). El feriado deberá hacerse efectivo dentro de los 6 meses siguientes al período en que se generó, pudiendo acumularse hasta 2 períodos de común acuerdo. No podrá compensarse en dinero, salvo en caso de término de contrato.
  </div>

  <div class="clause-title">Octavo — Licencias Médicas y Permisos</div>
  <div class="clause">
    El Trabajador tendrá derecho a licencia médica por enfermedad común, maternidad/paternidad y demás causas contempladas en la legislación vigente. Las licencias médicas deberán presentarse al Empleador dentro de 2 días hábiles de emitidas y ser tramitadas conforme al procedimiento COMPIN/FONASA/ISAPRE. Durante la vigencia de la licencia médica, el Trabajador percibirá subsidio según las normas del DFL N°44 de 1978. Los permisos sin goce de sueldo podrán acordarse por escrito entre ambas partes.
  </div>

  <div class="clause-title">Noveno — Prevención y Sanción del Acoso Laboral y Sexual</div>
  <div class="clause">
    Conniku SpA declara su compromiso con el respeto a la dignidad de todos sus colaboradores. Se prohíbe expresamente toda conducta de acoso laboral (Ley 21.643, modificatoria del Art. 2 CT) y de acoso sexual (Ley 20.005). Ante cualquier denuncia, el Representante Legal de Conniku SpA, <strong>Cristian Andrés Gutiérrez Lazcano</strong>, en coordinación con el <strong>Director/a de Recursos Humanos</strong>, deberá iniciar el procedimiento de investigación interna dentro de 5 días corridos desde la recepción de la denuncia, guardar estricta confidencialidad, proteger al denunciante de cualquier represalia y adoptar las medidas correctivas que correspondan. El Representante Legal emitirá el veredicto final de la investigación. Las sanciones para el infractor podrán incluir desde amonestación escrita hasta la aplicación del artículo 160 N°1 del CT (despido sin indemnización). El canal de denuncia confidencial es: <strong>ceo@conniku.com</strong>. El Trabajador podrá, adicionalmente, presentar denuncia ante la Inspección del Trabajo (www.dt.gob.cl / 600 450 4000).
  </div>

  <div class="clause-title">Décimo — Seguridad y Salud Ocupacional</div>
  <div class="clause">
    El Empleador cumplirá con las obligaciones de seguridad y prevención de riesgos laborales establecidas en la Ley 16.744 sobre Accidentes del Trabajo y Enfermedades Profesionales, el Decreto Supremo N°40 (Reglamento sobre Prevención de Riesgos) y demás normas del Instituto de Seguridad Laboral (ISL) o Mutual de Seguridad correspondiente. El Trabajador deberá cumplir las instrucciones de seguridad, usar los elementos de protección personal (EPP) provistos, y reportar cualquier condición de riesgo en forma inmediata. En caso de accidente del trabajo, el Empleador deberá informar a la Mutual de Seguridad dentro de las 24 horas.
  </div>

  <div class="clause-title">Undécimo — Obligaciones del Trabajador</div>
  <div class="clause">
    El Trabajador se obliga a:
    (a) Desempeñar sus funciones con eficiencia, diligencia, honestidad y dedicación profesional;
    (b) Respetar y cumplir el Reglamento Interno de Orden, Higiene y Seguridad (RIOHS) de la empresa;
    (c) Guardar absoluta reserva y confidencialidad sobre información estratégica, técnica, comercial, financiera y de clientes de Conniku SpA, incluso con posterioridad al término del contrato;
    (d) Reportar al Empleador cualquier situación de conflicto de interés en forma inmediata y transparente;
    (e) Cuidar los bienes, equipos, sistemas e infraestructura tecnológica de la empresa;
    (f) No divulgar, reproducir ni compartir sin autorización información de la empresa;
    (g) Dar aviso oportuno de cualquier inasistencia y presentar los justificantes legales correspondientes;
    (h) No realizar actividades remuneradas que sean incompatibles o competan directamente con el giro de Conniku SpA durante la vigencia del presente contrato;
    (i) Cumplir con todas las disposiciones legales aplicables en el desempeño de sus funciones.
  </div>

  <div class="clause-title">Duodécimo — Propiedad Intelectual e Industrial</div>
  <div class="clause">
    Todo el software, código fuente, algoritmos, diseños, interfaces, documentación, bases de datos, procesos, metodologías, inventos, mejoras y creaciones intelectuales o industriales generados por el Trabajador en el ejercicio de sus funciones o con recursos de la empresa serán de propiedad exclusiva y permanente de <strong>Conniku SpA</strong>, en conformidad con la Ley 17.336 sobre Propiedad Intelectual y el artículo 19 N°25 de la Constitución Política de la República. El Trabajador cede desde ya, a título universal y gratuito, todos los derechos patrimoniales sobre dichas creaciones al Empleador. Esta cesión subsiste indefinidamente con posterioridad al término del contrato.
  </div>

  <div class="clause-title">Decimotercero — Confidencialidad y Protección de Datos Personales</div>
  <div class="clause">
    El Trabajador declara conocer y comprometerse a cumplir la Ley 19.628 sobre Protección de la Vida Privada (y su modificatoria Ley 21.096), el Reglamento General de Protección de Datos de la UE (GDPR — aplicable a operaciones internacionales) y la Política de Privacidad publicada en <strong>conniku.com/privacy</strong>. El Trabajador solo podrá acceder, tratar y utilizar datos personales de usuarios, clientes y colaboradores en la medida estrictamente necesaria para el cumplimiento de sus funciones. Queda prohibido transferir, copiar, exportar o divulgar datos personales sin autorización expresa del Empleador. El incumplimiento de esta cláusula podrá dar lugar a responsabilidad civil y penal, además de las consecuencias laborales aplicables.
  </div>

  <div class="clause-title">Decimocuarto — Uso de Tecnología, Sistemas y Redes Sociales</div>
  <div class="clause">
    Los equipos, sistemas, plataformas, correos electrónicos y cuentas corporativas provistas por el Empleador son de uso exclusivamente laboral. El Trabajador no deberá instalar software no autorizado, acceder a sistemas ajenos a sus funciones ni utilizar los recursos tecnológicos de la empresa para fines personales, ilícitos o contrarios a las políticas internas. Queda prohibido publicar información confidencial, crítica o denigratoria de Conniku SpA, sus productos, clientes o colaboradores en redes sociales u otros medios públicos, sin perjuicio del ejercicio legítimo del derecho a la libre expresión. El Empleador podrá monitorear el uso de los recursos tecnológicos corporativos en los términos autorizados por la legislación vigente, previa comunicación al Trabajador.
  </div>

  <div class="clause-title">Decimoquinto — No Competencia y Exclusividad</div>
  <div class="clause">
    Durante la vigencia del presente contrato, el Trabajador se compromete a no prestar servicios remunerados —ya sea como empleado, asesor, contratista o en cualquier otra calidad— a empresas que compitan directamente con el giro de Conniku SpA (plataformas de tecnología educativa, redes sociales estudiantiles o sistemas ERP/HRMS dirigidos al segmento educativo), salvo autorización escrita previa del Empleador. Esta restricción es razonable en su alcance y se sustenta en la necesidad de proteger el legítimo interés comercial de la empresa y la confidencialidad de su tecnología.
  </div>

  <div class="clause-title">Decimosexto — Término del Contrato</div>
  <div class="clause">
    El presente contrato podrá terminar por las causales establecidas en los artículos 159, 160 y 161 del Código del Trabajo:
    (a) <strong>Mutuo acuerdo</strong> (Art. 159 N°1): las partes pueden convenir el término en cualquier momento, debiendo constar por escrito (finiquito);
    (b) <strong>Renuncia voluntaria</strong> (Art. 159 N°2): el Trabajador deberá dar aviso con al menos 30 días de anticipación;
    (c) <strong>Vencimiento del plazo</strong> (Art. 159 N°4): aplica para contratos a plazo fijo;
    (d) <strong>Necesidades de la empresa</strong> (Art. 161): el Empleador deberá avisar con 30 días de anticipación o pagar indemnización sustitutiva, más la indemnización por años de servicio (Art. 163 CT);
    (e) <strong>Despido disciplinario</strong> (Art. 160): no genera derecho a indemnización en los casos taxativos señalados por la ley.
    En todos los casos, el Empleador suscribirá el finiquito correspondiente dentro de los plazos legales. Ante cualquier irregularidad, el Trabajador podrá concurrir a la Inspección del Trabajo de Antofagasta o interponer demanda ante el Juzgado de Letras del Trabajo.
  </div>

  <div class="clause-title">Decimoséptimo — Términos y Condiciones Generales</div>
  <div class="clause">
    Las partes declaran que el presente contrato recoge fielmente los acuerdos alcanzados y no existen otros pactos, verbales o escritos, que lo modifiquen, salvo los que puedan establecerse mediante anexos suscritos. Cualquier modificación al contrato deberá constar por escrito y ser firmada por ambas partes (Art. 11 CT). Las partes se obligan a comportarse de buena fe tanto en la ejecución como en la terminación de este contrato (Art. 1546 Código Civil). Los Términos y Condiciones de uso de la plataforma Conniku, publicados en <strong>conniku.com/terms</strong>, son parte integrante de las políticas de la empresa y el Trabajador declara haberlos leído y aceptado en lo que le aplica.
    El Trabajador declara haber tomado conocimiento del <strong>Reglamento Interno de Orden, Higiene y Seguridad (RIOHS)</strong>, del <strong>Código de Ética</strong> y de todas las políticas internas de Conniku SpA, comprometiéndose a su cumplimiento. Dichos documentos se encuentran disponibles de forma permanente y sin restricciones en la <strong>plataforma Conniku Admin</strong> (conniku.com/admin), accesible desde cualquier dispositivo con acceso autorizado, mediante accesos directos visibles en el panel principal. El Empleador garantiza que dichos documentos estarán siempre actualizados, accesibles y legibles en la plataforma.
    Adicionalmente, el Trabajador podrá consultar en cualquier momento el contenido de los reglamentos, políticas, procedimientos y documentos institucionales de la empresa a través de <strong>KONNI</strong>, el asistente de inteligencia artificial interactivo de Conniku SpA, disponible en la plataforma Admin. KONNI está habilitado para responder preguntas sobre RIOHS, Código de Ética, políticas de RRHH, procedimientos internos y normativa laboral aplicable, de manera inmediata y en cualquier horario. El uso de KONNI no reemplaza la asesoría legal formal ni las instancias oficiales de denuncia o consulta ante organismos del Estado.
  </div>

  <div class="clause-title">Decimoctavo — Dirección del Trabajo e Información Legal</div>
  <div class="info-box">
    El Trabajador tiene derecho a obtener información, asesoría y presentar denuncias ante la <strong>Dirección del Trabajo</strong>:<br>
    — Sitio web: <strong>www.dt.gob.cl</strong><br>
    — Call center: <strong>600 450 4000</strong><br>
    — Inspección Provincial del Trabajo de Antofagasta: Av. Argentina 2061, Antofagasta.<br>
    El Empleador está obligado a pagar las cotizaciones previsionales a través de <strong>Previred (previred.com)</strong> antes del 10° día hábil del mes siguiente. El Trabajador puede verificar el cumplimiento de sus cotizaciones en la AFP correspondiente y en la Superintendencia de Pensiones (spensiones.cl).
  </div>

  <div class="clause-title">Decimonoveno — Resolución de Conflictos y Jurisdicción</div>
  <div class="clause">
    Ante cualquier controversia derivada del presente contrato, las partes procurarán resolverla directamente o mediante mediación ante la Inspección del Trabajo de Antofagasta. En caso de no arribar a acuerdo, la controversia será resuelta por los <strong>Juzgados de Letras del Trabajo de Antofagasta</strong>, conforme al procedimiento establecido en el Código del Trabajo (Arts. 420 y ss.). La ley aplicable es la legislación laboral de la República de Chile.
  </div>

  <div class="warn-box" style="margin-top:20px;">
    <strong>Advertencia legal:</strong> Ambas partes declaran haber leído íntegramente el presente instrumento, comprendido su alcance y efectos jurídicos, y suscribirlo libre y voluntariamente, sin apremio ni coacción de ninguna especie. El trabajador tiene derecho a solicitar asesoría jurídica gratuita en la Corporación de Asistencia Judicial (www.cajantofagasta.cl).
  </div>

  <div class="clause" style="margin-top:22px; text-align:justify;">
    En prueba de conformidad con todo lo expresado, las partes suscriben el presente Contrato Individual de Trabajo en <strong>dos ejemplares físicos del mismo tenor</strong>, quedando un ejemplar en poder de cada parte. Adicionalmente, se dejará constancia de la firma mediante <strong>firma electrónica avanzada</strong> conforme a la Ley 19.799, y una copia digital del contrato firmado será almacenada de forma segura en la <strong>ficha digital del Trabajador</strong> dentro de la plataforma <strong>Conniku Admin</strong>, con acceso restringido al personal autorizado de RRHH y a la Representante Legal de la empresa. Dicha copia digital tendrá pleno valor legal como respaldo del instrumento original, estará disponible para ser presentada ante la <strong>Inspección del Trabajo</strong>, el <strong>Juzgado de Letras del Trabajo</strong> o cualquier organismo fiscalizador que así lo requiera, y será conservada durante el plazo mínimo legal de 5 años contados desde el término de la relación laboral, conforme a la normativa vigente. Todo lo anterior se suscribe en la ciudad de Antofagasta, a ${today}.
  </div>

  <div class="signatures">
    <div class="sig-block">
      <div class="sig-line">
        <div class="sig-name">Cristian Andrés Gutiérrez Lazcano</div>
        <div class="sig-role">RUT 14.112.896-5</div>
        <div class="sig-role">Representante Legal — Conniku SpA RUT 78.395.702-7</div>
        <div class="sig-role">Av. Argentina 1805, Depto. 502 · Antofagasta</div>
      </div>
    </div>
    <div class="sig-block">
      <div class="sig-line">
        <div class="sig-name">${form.firstName} ${form.lastName}</div>
        <div class="sig-role">RUT ${form.rut}</div>
        <div class="sig-role">Trabajador/a — ${form.position}</div>
        <div class="sig-role">${form.address || 'Antofagasta, Chile'}</div>
      </div>
    </div>
  </div>

  <div class="fea-block">
    ✍️ <strong>Firma Electrónica Avanzada (FEA) habilitada conforme a Ley 19.799:</strong><br>
    <a href="https://www.acepta.com" target="_blank">Acepta.com</a> &nbsp;·&nbsp;
    <a href="https://www.e-certchile.cl" target="_blank">E-CertChile</a> &nbsp;·&nbsp;
    <a href="https://www.signer.cl" target="_blank">Signer.cl</a> &nbsp;·&nbsp;
    <a href="https://www.docusign.com" target="_blank">DocuSign</a>
  </div>

  <div class="footer-note">
    Documento generado por Conniku SpA · RUT 78.395.702-7 · conniku.com · contacto@conniku.com<br>
    Art. 9 CT: Este contrato debe quedar firmado dentro de los 15 días corridos desde el inicio de labores.<br>
    Las cotizaciones se pagan vía Previred (previred.com) antes del 10° día hábil del mes siguiente.
  </div>

</body>
</html>`
}

// ─── Crear colaborador modal (2 pasos) ──────────────────────────
function NuevoColaboradorModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const emptyForm = {
    rut: '', firstName: '', lastName: '', email: '', phone: '', address: '',
    birthDate: '', nationality: 'Chilena', maritalStatus: 'soltero',
    emergencyContactName: '', emergencyContactPhone: '',
    positionKey: '', positionOther: '', department: 'Tecnologia', hireDate: '',
    contractType: 'plazo_fijo', endDate: '', workSchedule: 'full_time', weeklyHours: 45,
    grossSalary: IMM, colacion: 0, movilizacion: 0,
    afp: 'modelo', healthSystem: 'fonasa', isapreProvider: '', isapreName: '', isapreUf: 0,
    afcActive: true, bankName: 'Banco Estado', bankAccountType: 'cuenta_rut', bankAccountNumber: '',
    // APV — Ahorro Previsional Voluntario (DL 3.500 Art. 20 bis, Ley 19.768)
    apvActivo: false, apvRegimen: 'B', apvMonto: 0, apvInstitucion: 'afp_mismo', apvInstitucionNombre: '',
    // Pensión de Alimentos (Ley 14.908, Art. 58 CT)
    pensionActiva: false, pensionTipo: 'fijo', pensionMonto: 0, pensionPorcentaje: 0,
    pensionRit: '', pensionTribunal: 'Tribunal de Familia de Antofagasta', pensionBeneficiario: '',
    pensionDestino: 'transferencia', pensionCuentaBanco: 'Banco Estado', pensionCuentaTipo: 'cuenta_corriente', pensionCuentaNumero: '',
    // Cuota Sindical (Art. 262 CT) — solo si trabajador afiliado a sindicato
    cuotaSindicalActiva: false, cuotaSindicalMonto: 0, cuotaSindicalSindicato: '',
    // Préstamo empresa (Art. 58 CT — requiere autorización escrita del trabajador)
    prestamoActivo: false, prestamoCuota: 0, prestamoSaldo: 0,
    // Seguro colectivo (voluntario, acordado con trabajador)
    seguroColectivoActivo: false, seguroColectivoMonto: 0, seguroColectivoAseguradora: '',
  }
  const [step, setStep]   = useState<1 | 2>(1)
  const [form, setForm]   = useState<any>(emptyForm)
  const [jobDescription, setJobDescription] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // Derived: the actual position string for display / contract
  const resolvedPosition = form.positionKey === 'otro' ? form.positionOther : (POSITIONS_LIST.find(p => p.value === form.positionKey)?.label || '')

  const F = (k: string) => (v: string) => setForm((p: any) => ({ ...p, [k]: v }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.rut.trim()) e.rut = 'Obligatorio'
    if (!form.firstName.trim()) e.firstName = 'Obligatorio'
    if (!form.lastName.trim()) e.lastName = 'Obligatorio'
    if (!form.email.trim()) e.email = 'Obligatorio'
    if (!form.positionKey) e.positionKey = 'Obligatorio'
    if (form.positionKey === 'otro' && !form.positionOther.trim()) e.positionOther = 'Especifica el cargo'
    if (!form.hireDate) e.hireDate = 'Obligatorio'
    if (Number(form.grossSalary) < IMM) e.grossSalary = `Mínimo: ${fmtMoney(IMM)} (Art. 44 CT)`
    return e
  }

  const handleNext = () => {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return
    // Auto-populate JD from predefined list if not already customized
    if (!jobDescription && form.positionKey && form.positionKey !== 'otro') {
      setJobDescription(JOB_DESCRIPTIONS[form.positionKey] || '')
    }
    setStep(2)
  }

  const handlePrint = () => {
    const contractForm = { ...form, position: resolvedPosition }
    const html = buildContractHTML(contractForm, jobDescription)
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 500)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form, position: resolvedPosition }
      await api.createEmployee(payload)
      onCreated()
      onClose()
    } catch (err: any) {
      setErrors({ _general: err?.message || err?.detail || 'Error al guardar. Verifica los datos.' })
      setSaving(false)
    }
  }

  // ── Indicador de pasos ──────────────────────────────────────────
  const StepBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 4px' }}>
      {[{ n: 1, label: 'Datos' }, { n: 2, label: 'Contrato' }].map(({ n, label }) => (
        <React.Fragment key={n}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
              background: step >= n ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: step >= n ? '#fff' : 'var(--text-muted)',
            }}>{n}</div>
            <span style={{ fontSize: 12, fontWeight: step === n ? 600 : 400, color: step === n ? 'var(--text-primary)' : 'var(--text-muted)' }}>{label}</span>
          </div>
          {n < 2 && <div style={{ flex: 1, height: 1, background: step > n ? 'var(--accent)' : 'var(--border)', maxWidth: 40 }} />}
        </React.Fragment>
      ))}
    </div>
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg-primary)', borderRadius: 16, width: '100%',
        maxWidth: step === 2 ? 820 : 680, maxHeight: '92vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        transition: 'max-width 0.25s ease',
      }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <StepBar />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {step === 1 ? 'Art. 9 CT — contrato debe firmarse en 15 días corridos' : 'Revisa, edita la descripción de cargo e imprime el contrato'}
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>×</button>
        </div>

        {/* ── Body ── */}
        <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>

          {/* ── PASO 1: Formulario de datos ── */}
          {step === 1 && (
            <>
              {errors._general && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#ef4444' }}>
                  {errors._general}
                </div>
              )}
              <SectionTitle>Datos Personales</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <Field label="RUT *"><RutInput value={form.rut} onChange={F('rut')} /><ErrMsg msg={errors.rut} /></Field>
                <Field label="Fecha Nacimiento"><Input type="date" value={form.birthDate} onChange={F('birthDate')} /></Field>
                <Field label="Nombre *"><Input value={form.firstName} onChange={F('firstName')} /><ErrMsg msg={errors.firstName} /></Field>
                <Field label="Apellido *"><Input value={form.lastName} onChange={F('lastName')} /><ErrMsg msg={errors.lastName} /></Field>
                <Field label="Email *"><Input type="email" value={form.email} onChange={F('email')} /><ErrMsg msg={errors.email} /></Field>
                <Field label="Teléfono"><Input value={form.phone} onChange={F('phone')} placeholder="+56 9 xxxx xxxx" /></Field>
                <Field label="Dirección"><Input value={form.address} onChange={F('address')} /></Field>
                <Field label="Nacionalidad"><Input value={form.nationality} onChange={F('nationality')} /></Field>
                <Field label="Estado Civil">
                  <Select value={form.maritalStatus} onChange={F('maritalStatus')} options={[{value:'soltero',label:'Soltero/a'},{value:'casado',label:'Casado/a'},{value:'divorciado',label:'Divorciado/a'},{value:'viudo',label:'Viudo/a'}]} />
                </Field>
              </div>

              <SectionTitle>Contacto de Emergencia</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <Field label="Nombre Contacto"><Input value={form.emergencyContactName} onChange={F('emergencyContactName')} /></Field>
                <Field label="Teléfono Contacto"><Input value={form.emergencyContactPhone} onChange={F('emergencyContactPhone')} /></Field>
              </div>

              <SectionTitle>Contrato Laboral</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <Field label="Cargo *">
                  <Select
                    value={form.positionKey}
                    onChange={v => {
                      setForm((p: any) => ({ ...p, positionKey: v, positionOther: '' }))
                      // Reset JD when position changes so it auto-populates on Next
                      setJobDescription('')
                    }}
                    options={[{ value: '', label: '— Seleccionar cargo —' }, ...POSITIONS_LIST]}
                  />
                  <ErrMsg msg={errors.positionKey} />
                  {form.positionKey === 'otro' && (
                    <div style={{ marginTop: 8 }}>
                      <Input value={form.positionOther} onChange={F('positionOther')} placeholder="Especifica el nombre del cargo" />
                      <ErrMsg msg={errors.positionOther} />
                    </div>
                  )}
                </Field>
                <Field label="Departamento"><Select value={form.department} onChange={F('department')} options={DEPARTMENTS} /></Field>
                <Field label="Tipo Contrato"><Select value={form.contractType} onChange={F('contractType')} options={CONTRACT_TYPES} /></Field>
                <Field label="Fecha Ingreso *"><Input type="date" value={form.hireDate} onChange={F('hireDate')} /><ErrMsg msg={errors.hireDate} /></Field>
                {(form.contractType === 'plazo_fijo' || form.contractType === 'obra_faena') && (
                  <Field label="Fecha Término"><Input type="date" value={form.endDate} onChange={F('endDate')} /></Field>
                )}
                <Field label="Jornada"><Select value={form.workSchedule} onChange={F('workSchedule')} options={SCHEDULE_OPTIONS} /></Field>
                <Field label="Horas Semanales"><Input type="number" value={form.weeklyHours} onChange={v => setForm((p:any) => ({...p, weeklyHours: Number(v)}))} /></Field>
              </div>

              <SectionTitle>Remuneración</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <Field label={`Sueldo Bruto * (mín. ${fmtMoney(IMM)})`}>
                  <Input type="number" value={form.grossSalary} onChange={v => setForm((p:any) => ({...p, grossSalary: Number(v)}))} />
                  <ErrMsg msg={errors.grossSalary} />
                </Field>
                <Field label="Colación"><Input type="number" value={form.colacion} onChange={v => setForm((p:any) => ({...p, colacion: Number(v)}))} /></Field>
                <Field label="Movilización"><Input type="number" value={form.movilizacion} onChange={v => setForm((p:any) => ({...p, movilizacion: Number(v)}))} /></Field>
                <Field label="AFP">
                  <Select value={form.afp} onChange={F('afp')} options={AFP_LIST} />
                  {(() => {
                    const r = AFP_RATES[form.afp]
                    const total = r.obligatory + r.commission
                    const monto = Math.round(Number(form.grossSalary) * total / 100)
                    return (
                      <div style={{ marginTop: 5, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>10% obligatorio + {r.commission}% comisión = </span>
                        <strong style={{ color: 'var(--accent)' }}>{total.toFixed(2)}% → {fmtMoney(monto)}</strong>
                        <br /><span style={{ fontSize: 10, color: 'var(--text-muted)' }}>SIS {SIS_RATE}% lo paga el empleador — spensiones.cl 2025</span>
                      </div>
                    )
                  })()}
                </Field>
                <Field label="Salud">
                  <Select value={form.healthSystem} onChange={F('healthSystem')} options={HEALTH_OPTIONS} />
                  {form.healthSystem === 'fonasa' && (
                    <div style={{ marginTop: 5, fontSize: 11, color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>FONASA {FONASA_RATE}% remuneración imponible → </span>
                      <strong style={{ color: 'var(--accent)' }}>{fmtMoney(Math.round(Number(form.grossSalary) * FONASA_RATE / 100))}</strong>
                    </div>
                  )}
                  {form.healthSystem === 'isapre' && (
                    <div style={{ marginTop: 6 }}>
                      <Select
                        value={form.isapreProvider || ''}
                        onChange={F('isapreProvider')}
                        options={[{ value: '', label: '— Seleccionar ISAPRE —' }, ...ISAPRE_LIST]}
                      />
                      <div style={{ marginTop: 5, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Mínimo legal: {FONASA_RATE}% → </span>
                        <strong style={{ color: 'var(--accent)' }}>{fmtMoney(Math.round(Number(form.grossSalary) * FONASA_RATE / 100))}</strong>
                        <br /><span style={{ fontSize: 10 }}>El plan específico puede tener costo adicional en UF según cobertura.</span>
                      </div>
                    </div>
                  )}
                </Field>
                <Field label="AFC (Seguro Cesantía)">
                  <div style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-tertiary)', fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Trabajador {AFC_WORKER}%</span>
                      <strong>{fmtMoney(Math.round(Number(form.grossSalary) * AFC_WORKER / 100))}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Empleador {form.contractType === 'indefinido' ? AFC_EMPLOYER_INDEFINIDO : AFC_EMPLOYER_PLAZO_FIJO}%</span>
                      <span style={{ color: 'var(--text-muted)' }}>{fmtMoney(Math.round(Number(form.grossSalary) * (form.contractType === 'indefinido' ? AFC_EMPLOYER_INDEFINIDO : AFC_EMPLOYER_PLAZO_FIJO) / 100))} (cargo empresa)</span>
                    </div>
                  </div>
                </Field>
              </div>

              <SectionTitle>Datos Bancarios</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <Field label="Banco"><Select value={form.bankName} onChange={F('bankName')} options={BANKS} /></Field>
                <Field label="Tipo Cuenta"><Select value={form.bankAccountType} onChange={F('bankAccountType')} options={ACCOUNT_TYPES} /></Field>
                <Field label="N° Cuenta"><Input value={form.bankAccountNumber} onChange={F('bankAccountNumber')} /></Field>
              </div>

              <SectionTitle>Descuentos y Beneficios Adicionales</SectionTitle>

              {/* ── APV ── */}
              <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: form.apvActivo ? 12 : 0 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>📈 APV — Ahorro Previsional Voluntario</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>DL 3.500 Art. 20 bis · Ley 19.768 · máx. 50 UF/mes</div>
                  </div>
                  <select value={form.apvActivo ? 'si' : 'no'} onChange={e => setForm((p: any) => ({ ...p, apvActivo: e.target.value === 'si' }))}
                    style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: form.apvActivo ? 'var(--accent)' : 'var(--bg-tertiary)', color: form.apvActivo ? '#fff' : 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>
                    <option value="no">No aplica</option>
                    <option value="si">Sí, tiene APV</option>
                  </select>
                </div>
                {form.apvActivo && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    <Field label="Régimen"><Select value={form.apvRegimen} onChange={F('apvRegimen')} options={APV_REGIMEN} /></Field>
                    <Field label="Monto mensual APV ($)"><Input type="number" value={form.apvMonto} onChange={v => setForm((p: any) => ({ ...p, apvMonto: Number(v) }))} /></Field>
                    <Field label="Institución APV"><Select value={form.apvInstitucion} onChange={F('apvInstitucion')} options={APV_INSTITUTIONS} /></Field>
                    {form.apvInstitucion !== 'afp_mismo' && (
                      <Field label="Nombre institución"><Input value={form.apvInstitucionNombre} onChange={F('apvInstitucionNombre')} placeholder="Ej: Fondo Mutuo BCI" /></Field>
                    )}
                  </div>
                )}
              </div>

              {/* ── Pensión de alimentos ── */}
              <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: form.pensionActiva ? 12 : 0 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>⚖️ Pensión de Alimentos</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Ley 14.908 · Art. 58 CT · resolución judicial obligatoria</div>
                  </div>
                  <select value={form.pensionActiva ? 'si' : 'no'} onChange={e => setForm((p: any) => ({ ...p, pensionActiva: e.target.value === 'si' }))}
                    style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: form.pensionActiva ? '#dc2626' : 'var(--bg-tertiary)', color: form.pensionActiva ? '#fff' : 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>
                    <option value="no">Sin orden judicial</option>
                    <option value="si">Con orden judicial</option>
                  </select>
                </div>
                {form.pensionActiva && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    <Field label="Tipo de descuento"><Select value={form.pensionTipo} onChange={F('pensionTipo')} options={PENSION_TIPOS} /></Field>
                    {form.pensionTipo === 'fijo'
                      ? <Field label="Monto fijo mensual ($)"><Input type="number" value={form.pensionMonto} onChange={v => setForm((p: any) => ({ ...p, pensionMonto: Number(v) }))} /></Field>
                      : <Field label="Porcentaje del líquido (%)"><Input type="number" value={form.pensionPorcentaje} onChange={v => setForm((p: any) => ({ ...p, pensionPorcentaje: Number(v) }))} /></Field>
                    }
                    <Field label="RIT (N° causa)"><Input value={form.pensionRit} onChange={F('pensionRit')} placeholder="Ej: A-1234-2025" /></Field>
                    <Field label="Tribunal"><Input value={form.pensionTribunal} onChange={F('pensionTribunal')} /></Field>
                    <Field label="Nombre beneficiario"><Input value={form.pensionBeneficiario} onChange={F('pensionBeneficiario')} /></Field>
                    <Field label="Destino del pago"><Select value={form.pensionDestino} onChange={F('pensionDestino')} options={PENSION_DESTINO} /></Field>
                    {form.pensionDestino === 'transferencia' && (<>
                      <Field label="Banco beneficiario"><Select value={form.pensionCuentaBanco} onChange={F('pensionCuentaBanco')} options={PENSION_BANCOS} /></Field>
                      <Field label="Tipo cuenta"><Select value={form.pensionCuentaTipo} onChange={F('pensionCuentaTipo')} options={PENSION_CUENTA_TIPOS} /></Field>
                      <Field label="N° cuenta beneficiario"><Input value={form.pensionCuentaNumero} onChange={F('pensionCuentaNumero')} /></Field>
                    </>)}
                  </div>
                )}
              </div>

              {/* ── Cuota sindical ── */}
              <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: form.cuotaSindicalActiva ? 12 : 0 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>🤝 Cuota Sindical</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Art. 262 CT · solo si trabajador está afiliado a sindicato</div>
                  </div>
                  <select value={form.cuotaSindicalActiva ? 'si' : 'no'} onChange={e => setForm((p: any) => ({ ...p, cuotaSindicalActiva: e.target.value === 'si' }))}
                    style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: form.cuotaSindicalActiva ? 'var(--accent)' : 'var(--bg-tertiary)', color: form.cuotaSindicalActiva ? '#fff' : 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>
                    <option value="no">No afiliado</option>
                    <option value="si">Sí, afiliado</option>
                  </select>
                </div>
                {form.cuotaSindicalActiva && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    <Field label="Nombre del sindicato"><Input value={form.cuotaSindicalSindicato} onChange={F('cuotaSindicalSindicato')} /></Field>
                    <Field label="Cuota mensual ($)"><Input type="number" value={form.cuotaSindicalMonto} onChange={v => setForm((p: any) => ({ ...p, cuotaSindicalMonto: Number(v) }))} /></Field>
                  </div>
                )}
              </div>

              {/* ── Préstamo empresa ── */}
              <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: form.prestamoActivo ? 12 : 0 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>💳 Préstamo Empresa</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Art. 58 CT · requiere autorización escrita del trabajador</div>
                  </div>
                  <select value={form.prestamoActivo ? 'si' : 'no'} onChange={e => setForm((p: any) => ({ ...p, prestamoActivo: e.target.value === 'si' }))}
                    style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: form.prestamoActivo ? 'var(--accent)' : 'var(--bg-tertiary)', color: form.prestamoActivo ? '#fff' : 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>
                    <option value="no">Sin préstamo</option>
                    <option value="si">Con préstamo activo</option>
                  </select>
                </div>
                {form.prestamoActivo && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    <Field label="Cuota mensual a descontar ($)"><Input type="number" value={form.prestamoCuota} onChange={v => setForm((p: any) => ({ ...p, prestamoCuota: Number(v) }))} /></Field>
                    <Field label="Saldo total del préstamo ($)"><Input type="number" value={form.prestamoSaldo} onChange={v => setForm((p: any) => ({ ...p, prestamoSaldo: Number(v) }))} /></Field>
                  </div>
                )}
              </div>

              {/* ── Seguro colectivo ── */}
              <div style={{ marginBottom: 4, padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: form.seguroColectivoActivo ? 12 : 0 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>🛡️ Seguro Colectivo</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Prima mensual voluntaria · acordado con trabajador por escrito</div>
                  </div>
                  <select value={form.seguroColectivoActivo ? 'si' : 'no'} onChange={e => setForm((p: any) => ({ ...p, seguroColectivoActivo: e.target.value === 'si' }))}
                    style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: form.seguroColectivoActivo ? 'var(--accent)' : 'var(--bg-tertiary)', color: form.seguroColectivoActivo ? '#fff' : 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>
                    <option value="no">Sin seguro colectivo</option>
                    <option value="si">Con seguro colectivo</option>
                  </select>
                </div>
                {form.seguroColectivoActivo && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    <Field label="Aseguradora"><Input value={form.seguroColectivoAseguradora} onChange={F('seguroColectivoAseguradora')} placeholder="Ej: Metlife, Seguros Vida" /></Field>
                    <Field label="Prima mensual ($)"><Input type="number" value={form.seguroColectivoMonto} onChange={v => setForm((p: any) => ({ ...p, seguroColectivoMonto: Number(v) }))} /></Field>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── PASO 2: Vista previa del contrato ── */}
          {step === 2 && (
            <>
              {errors._general && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#ef4444' }}>
                  {errors._general}
                </div>
              )}

              {/* Job Description editable */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
                  Descripción del Cargo / Job Description
                </label>
                <textarea
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  placeholder={`Ej:\n• Desarrollar y mantener el frontend de la plataforma Conniku usando React y TypeScript\n• Participar en code reviews y definición de arquitectura\n• Colaborar con el equipo de diseño para implementar interfaces de usuario\n• Reportar al Gerente de Tecnología`}
                  rows={6}
                  style={{
                    width: '100%', padding: '10px 14px', border: '1px solid var(--border)',
                    borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                    fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                    lineHeight: 1.6, boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Preview del contrato */}
              <div style={{
                border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden',
                background: '#fff', color: '#000',
              }}>
                <div style={{ background: '#f3f4f6', padding: '10px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>📄 Vista previa del contrato</span>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>— Se generará con los datos ingresados</span>
                </div>
                <div style={{ padding: '24px 32px', fontFamily: 'Georgia, serif', fontSize: 12, lineHeight: 1.65, color: '#111', maxHeight: 420, overflowY: 'auto' }}>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>Contrato Individual de Trabajo</div>
                    <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>Conniku SpA · RUT 78.395.702-7 · Antofagasta, Chile</div>
                  </div>
                  <p style={{ marginBottom: 12 }}>En Antofagasta, a {new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}, entre <strong>Conniku SpA</strong>, RUT 78.395.702-7 (en adelante «el Empleador»), y <strong>{form.firstName} {form.lastName}</strong>, RUT {form.rut} (en adelante «el Trabajador»), se celebra el siguiente Contrato Individual de Trabajo:</p>

                  {[
                    { title: 'Primero — Cargo y Funciones', content: <><p>Cargo: <strong>{resolvedPosition}</strong> — Área: <strong>{form.department}</strong></p>{jobDescription && <div style={{ marginTop: 8, background: '#f9f9f9', borderLeft: '3px solid #555', padding: '6px 10px', fontSize: 11, whiteSpace: 'pre-wrap' }}>{jobDescription}</div>}</> },
                    { title: 'Segundo — Lugar de Trabajo', content: <p>Dependencias de Conniku SpA, Antofagasta, o modalidad de teletrabajo según lo coordinado.</p> },
                    { title: 'Tercero — Duración', content: <p dangerouslySetInnerHTML={{ __html: form.contractType === 'indefinido' ? 'Contrato de duración <strong>indefinida</strong> (Art. 159 N°4 CT).' : `Contrato a <strong>plazo fijo</strong> desde ${fmtDate(form.hireDate)}${form.endDate ? ` hasta ${fmtDate(form.endDate)}` : ''}.` }} /> },
                    { title: 'Cuarto — Jornada', content: <p><strong>{form.weeklyHours}h semanales</strong> — {SCHEDULE_OPTIONS.find(s => s.value === form.workSchedule)?.label}. (Art. 22 CT)</p> },
                    { title: 'Quinto — Remuneración', content: <p>Sueldo bruto: <strong>{fmtMoney(Number(form.grossSalary))}</strong>{Number(form.colacion) > 0 ? ` · Colación: ${fmtMoney(Number(form.colacion))}` : ''}{Number(form.movilizacion) > 0 ? ` · Movilización: ${fmtMoney(Number(form.movilizacion))}` : ''}. AFP: {AFP_LIST.find(a => a.value === form.afp)?.label}. Salud: {form.healthSystem === 'fonasa' ? 'FONASA' : `ISAPRE ${form.isapreName}`}. Pago: último día hábil del mes vía Previred.</p> },
                  ].map(({ title, content }) => (
                    <div key={title} style={{ marginBottom: 14 }}>
                      <div style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #ddd', paddingBottom: 3, marginBottom: 6 }}>{title}</div>
                      {content}
                    </div>
                  ))}

                  {/* Firmas preview */}
                  <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', gap: 40 }}>
                    {[
                      { name: 'Conniku SpA', sub: 'RUT 78.395.702-7 — Empleador' },
                      { name: `${form.firstName} ${form.lastName}`, sub: `RUT ${form.rut} — ${resolvedPosition || 'Trabajador'}` },
                    ].map(({ name, sub }) => (
                      <div key={name} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ borderTop: '1px solid #000', paddingTop: 6, marginTop: 40 }}>
                          <div style={{ fontWeight: 700, fontSize: 12 }}>{name}</div>
                          <div style={{ fontSize: 10, color: '#555' }}>{sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16, textAlign: 'center', fontSize: 10, color: '#777' }}>
                    ✍️ Firma electrónica avanzada disponible en:&nbsp;
                    <strong>Acepta.com</strong> · <strong>E-CertChile</strong> · <strong>Signer.cl</strong> · <strong>DocuSign</strong>
                    <br />Ley 19.799 — Firma Electrónica (Chile)
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          {/* Izquierda */}
          <button
            onClick={step === 1 ? onClose : () => setStep(1)}
            style={{ padding: '9px 20px', border: '1px solid var(--border)', borderRadius: 8, background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}
          >
            {step === 1 ? 'Cancelar' : '← Volver'}
          </button>

          {/* Derecha */}
          <div style={{ display: 'flex', gap: 10 }}>
            {step === 2 && (
              <button
                onClick={handlePrint}
                style={{ padding: '9px 20px', border: '1px solid var(--border)', borderRadius: 8, background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                🖨️ Imprimir / Guardar PDF
              </button>
            )}
            <button
              onClick={step === 1 ? handleNext : handleSave}
              disabled={saving}
              style={{ padding: '9px 22px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: saving ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, opacity: saving ? 0.7 : 1 }}
            >
              {step === 1 ? 'Siguiente →' : saving ? 'Creando…' : '✅ Crear Colaborador'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Tabs del perfil ─────────────────────────────────────────────
type ProfileTab = 'datos' | 'contrato' | 'remuneracion' | 'documentos' | 'historial'

function TabDatos({ emp, onChange, saving, onSave }: { emp: Employee; onChange: (k: string, v: any) => void; saving: boolean; onSave: () => void }) {
  return (
    <div>
      <SectionTitle>Identificación</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <Field label="RUT"><RutInput value={emp.rut} onChange={v => onChange('rut', v)} /></Field>
        <Field label="Fecha Nacimiento"><Input type="date" value={emp.birthDate} onChange={v => onChange('birthDate', v)} /></Field>
        <Field label="Nombre"><Input value={emp.firstName} onChange={v => onChange('firstName', v)} /></Field>
        <Field label="Apellido"><Input value={emp.lastName} onChange={v => onChange('lastName', v)} /></Field>
        <Field label="Email"><Input type="email" value={emp.email} onChange={v => onChange('email', v)} /></Field>
        <Field label="Teléfono"><Input value={emp.phone} onChange={v => onChange('phone', v)} /></Field>
        <Field label="Dirección"><Input value={emp.address} onChange={v => onChange('address', v)} /></Field>
        <Field label="Nacionalidad"><Input value={emp.nationality} onChange={v => onChange('nationality', v)} /></Field>
        <Field label="Estado Civil">
          <Select value={emp.maritalStatus} onChange={v => onChange('maritalStatus', v)} options={[{value:'soltero',label:'Soltero/a'},{value:'casado',label:'Casado/a'},{value:'divorciado',label:'Divorciado/a'},{value:'viudo',label:'Viudo/a'}]} />
        </Field>
      </div>
      <SectionTitle>Contacto de Emergencia</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <Field label="Nombre"><Input value={emp.emergencyContactName} onChange={v => onChange('emergencyContactName', v)} /></Field>
        <Field label="Teléfono"><Input value={emp.emergencyContactPhone} onChange={v => onChange('emergencyContactPhone', v)} /></Field>
      </div>
      <SaveBtn saving={saving} onSave={onSave} />
    </div>
  )
}

function TabContrato({ emp, onChange, saving, onSave }: { emp: Employee; onChange: (k: string, v: any) => void; saving: boolean; onSave: () => void }) {
  return (
    <div>
      <SectionTitle>Contrato Laboral — Código del Trabajo</SectionTitle>
      <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
        <strong>Art. 9 CT:</strong> El contrato debe quedar firmado dentro de 15 días corridos desde el inicio. Progresión: plazo fijo 30d → plazo fijo 60d → indefinido. CEO/RRHH puede contratar directamente a indefinido.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <Field label="Cargo"><Input value={emp.position} onChange={v => onChange('position', v)} /></Field>
        <Field label="Departamento"><Select value={emp.department} onChange={v => onChange('department', v)} options={DEPARTMENTS} /></Field>
        <Field label="Tipo Contrato"><Select value={emp.contractType} onChange={v => onChange('contractType', v)} options={CONTRACT_TYPES} /></Field>
        <Field label="Fecha Ingreso"><Input type="date" value={emp.hireDate} onChange={v => onChange('hireDate', v)} /></Field>
        {(emp.contractType === 'plazo_fijo' || emp.contractType === 'obra_faena') && (
          <Field label="Fecha Término">
            <Input type="date" value={emp.endDate || ''} onChange={v => onChange('endDate', v)} />
          </Field>
        )}
        <Field label="Jornada"><Select value={emp.workSchedule} onChange={v => onChange('workSchedule', v)} options={SCHEDULE_OPTIONS} /></Field>
        <Field label="Horas Semanales"><Input type="number" value={emp.weeklyHours} onChange={v => onChange('weeklyHours', Number(v))} /></Field>
        <Field label="Estado">
          <Select value={emp.status} onChange={v => onChange('status', v)} options={[{value:'active',label:'Activo'},{value:'suspended',label:'Suspendido'},{value:'on_leave',label:'Con Permiso'},{value:'terminated',label:'Terminado'}]} />
        </Field>
      </div>
      <SaveBtn saving={saving} onSave={onSave} />
    </div>
  )
}

function TabRemuneracion({ emp, onChange, saving, onSave }: { emp: Employee; onChange: (k: string, v: any) => void; saving: boolean; onSave: () => void }) {
  const netEstimate = Math.round(
    (emp.grossSalary || 0) * (1 - 0.1164 - 0.07 - 0.006) - 0
  )
  return (
    <div>
      <SectionTitle>Sueldo y Asignaciones</SectionTitle>
      <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
        Sueldo líquido estimado: <strong style={{ color: '#22c55e' }}>{fmtMoney(netEstimate)}</strong> (sin Impuesto 2ª Categoría, según retenciones AFP + Salud + AFC)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <Field label={`Sueldo Bruto (mín. ${fmtMoney(IMM)})`}><Input type="number" value={emp.grossSalary} onChange={v => onChange('grossSalary', Number(v))} /></Field>
        <Field label="Colación (no imponible)"><Input type="number" value={emp.colacion} onChange={v => onChange('colacion', Number(v))} /></Field>
        <Field label="Movilización (no imponible)"><Input type="number" value={emp.movilizacion} onChange={v => onChange('movilizacion', Number(v))} /></Field>
      </div>
      <SectionTitle>Previsión y Salud</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <Field label="AFP"><Select value={emp.afp} onChange={v => onChange('afp', v)} options={AFP_LIST} /></Field>
        <Field label="Sistema de Salud"><Select value={emp.healthSystem} onChange={v => onChange('healthSystem', v)} options={HEALTH_OPTIONS} /></Field>
        {emp.healthSystem === 'isapre' && (
          <>
            <Field label="Nombre ISAPRE"><Input value={emp.isapreName || ''} onChange={v => onChange('isapreName', v)} /></Field>
            <Field label="Cotización ISAPRE (UF)"><Input type="number" value={emp.isapreUf || 0} onChange={v => onChange('isapreUf', Number(v))} /></Field>
          </>
        )}
        <Field label="AFC (Seguro Desempleo)">
          <Select value={emp.afcActive ? 'si' : 'no'} onChange={v => onChange('afcActive', v === 'si')} options={[{value:'si',label:'Sí — Ley 19.728'},{value:'no',label:'No aplica'}]} />
        </Field>
      </div>
      <SectionTitle>Datos Bancarios</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <Field label="Banco"><Select value={emp.bankName} onChange={v => onChange('bankName', v)} options={BANKS} /></Field>
        <Field label="Tipo Cuenta"><Select value={emp.bankAccountType} onChange={v => onChange('bankAccountType', v)} options={ACCOUNT_TYPES} /></Field>
        <Field label="N° Cuenta"><Input value={emp.bankAccountNumber} onChange={v => onChange('bankAccountNumber', v)} /></Field>
      </div>
      <SaveBtn saving={saving} onSave={onSave} />
    </div>
  )
}

function TabDocumentos({ emp }: { emp: Employee }) {
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getEmployeeDocuments(emp.id)
      .then(d => setDocs(Array.isArray(d) ? d : []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false))
  }, [emp.id])

  const DOC_TYPE_LABEL: Record<string, string> = {
    contract: 'Contrato', fes: 'FES', memo: 'Memo', annex: 'Anexo',
    certificate: 'Certificado', other: 'Otro',
  }

  return (
    <div>
      <SectionTitle>Documentos del Colaborador</SectionTitle>
      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Cargando…</div>
      ) : docs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
          <div style={{ fontSize: 13 }}>Sin documentos registrados</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {docs.map((d: any) => (
            <div key={d.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
              border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-secondary)',
            }}>
              <span style={{ fontSize: 20 }}>📄</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{d.fileName || 'Documento'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {DOC_TYPE_LABEL[d.documentType] || d.documentType} · {fmtDate(d.uploadedAt || d.created_at)}
                </div>
              </div>
              {d.signed && <span style={{ fontSize: 11, background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>Firmado</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TabHistorial({ emp }: { emp: Employee }) {
  const changes = [
    { date: emp.createdAt, action: 'Registro creado', detail: `Ingreso como ${emp.position}` },
    ...(emp.contractType === 'indefinido' ? [{ date: emp.hireDate, action: 'Contrato indefinido', detail: 'Contrato vigente sin fecha de término' }] : []),
  ].filter(c => c.date).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div>
      <SectionTitle>Historial de Cambios</SectionTitle>
      {changes.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sin historial registrado.</div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 20 }}>
          <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, background: 'var(--border)' }} />
          {changes.map((c, i) => (
            <div key={i} style={{ position: 'relative', marginBottom: 20 }}>
              <div style={{ position: 'absolute', left: -17, top: 4, width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--bg-primary)' }} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{fmtDate(c.date)}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{c.action}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.detail}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SaveBtn({ saving, onSave }: { saving: boolean; onSave: () => void }) {
  return (
    <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
      <button
        onClick={onSave}
        disabled={saving}
        style={{ padding: '9px 24px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: saving ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, opacity: saving ? 0.7 : 1 }}
      >
        {saving ? 'Guardando…' : 'Guardar Cambios'}
      </button>
    </div>
  )
}

// ─── Panel derecho: Perfil completo ──────────────────────────────
function EmployeeProfile({ employee, onUpdated, onDelete }: {
  employee: Employee
  onUpdated: (e: Employee) => void
  onDelete: (id: string) => void
}) {
  const [form, setForm] = useState<Employee>({ ...employee })
  const [activeTab, setActiveTab] = useState<ProfileTab>('datos')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Reset form when employee changes
  useEffect(() => { setForm({ ...employee }); setActiveTab('datos'); setSaveMsg('') }, [employee.id])

  const handleChange = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setSaving(true); setSaveMsg('')
    try {
      const updated = await api.updateEmployee(form.id, form)
      onUpdated({ ...form, ...updated })
      setSaveMsg('✅ Guardado correctamente')
      setTimeout(() => setSaveMsg(''), 3000)
    } catch (err: any) {
      setSaveMsg(`❌ ${err?.message || 'Error al guardar'}`)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    try {
      await api.deleteEmployee(form.id)
      onDelete(form.id)
    } catch (err: any) {
      setSaveMsg(`❌ ${err?.message || 'Error al dar de baja'}`)
    }
    setConfirmDelete(false)
  }

  const TABS: { key: ProfileTab; label: string; emoji: string }[] = [
    { key: 'datos', label: 'Datos Personales', emoji: '👤' },
    { key: 'contrato', label: 'Contrato', emoji: '📋' },
    { key: 'remuneracion', label: 'Remuneración', emoji: '💰' },
    { key: 'documentos', label: 'Documentos', emoji: '📄' },
    { key: 'historial', label: 'Historial', emoji: '🕐' },
  ]

  const statusColor = STATUS_COLOR[form.status] || '#6b7280'
  const statusLabel = STATUS_LABEL[form.status] || form.status
  const contractLabel = CONTRACT_TYPES.find(c => c.value === form.contractType)?.label || form.contractType

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Header del perfil ── */}
      <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
          {/* Avatar */}
          <div style={{
            width: 64, height: 64, borderRadius: 14, background: avatarColor(form),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 22, fontWeight: 700, flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>
            {initials(form)}
          </div>

          {/* Info principal */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                {fullName(form)}
              </h2>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                background: `${statusColor}18`, color: statusColor,
              }}>
                {statusLabel}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
              {form.position} {form.department ? `· ${form.department}` : ''}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
              {[
                { icon: '🪪', val: form.rut },
                { icon: '📅', val: `Ingreso: ${fmtDate(form.hireDate)}` },
                { icon: '📋', val: contractLabel },
                ...(form.endDate ? [{ icon: '⏳', val: `Término: ${fmtDate(form.endDate)}` }] : []),
              ].map(({ icon, val }) => val ? (
                <span key={val} style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {icon} {val}
                </span>
              ) : null)}
            </div>
          </div>

          {/* Acción dar de baja */}
          <div style={{ flexShrink: 0 }}>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                style={{ fontSize: 12, padding: '6px 12px', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, background: 'none', color: '#ef4444', cursor: 'pointer' }}
              >
                Dar de Baja
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>¿Confirmar?</span>
                <button onClick={handleDelete} style={{ fontSize: 11, padding: '5px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Sí</button>
                <button onClick={() => setConfirmDelete(false)} style={{ fontSize: 11, padding: '5px 10px', border: '1px solid var(--border)', background: 'none', borderRadius: 6, cursor: 'pointer', color: 'var(--text-secondary)' }}>No</button>
              </div>
            )}
          </div>
        </div>

        {/* Pestañas */}
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '9px 14px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 400,
                color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-muted)',
                borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
                whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mensaje de guardado */}
      {saveMsg && (
        <div style={{ padding: '8px 24px', fontSize: 12, color: saveMsg.startsWith('✅') ? '#22c55e' : '#ef4444', background: saveMsg.startsWith('✅') ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)', borderBottom: '1px solid var(--border)' }}>
          {saveMsg}
        </div>
      )}

      {/* Contenido de la pestaña activa */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {activeTab === 'datos' && <TabDatos emp={form} onChange={handleChange} saving={saving} onSave={handleSave} />}
        {activeTab === 'contrato' && <TabContrato emp={form} onChange={handleChange} saving={saving} onSave={handleSave} />}
        {activeTab === 'remuneracion' && <TabRemuneracion emp={form} onChange={handleChange} saving={saving} onSave={handleSave} />}
        {activeTab === 'documentos' && <TabDocumentos emp={form} />}
        {activeTab === 'historial' && <TabHistorial emp={form} />}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════
export default function DirectorioPersonal() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Employee | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'terminated'>('active')

  const loadEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getEmployees()
      const list: Employee[] = Array.isArray(data) ? data : (data.employees || data.items || [])
      setEmployees(list)
      // Mantener selección si sigue existiendo
      if (selected) {
        const still = list.find(e => e.id === selected.id)
        if (still) setSelected(still)
      }
    } catch {
      setEmployees([])
    }
    setLoading(false)
  }, [selected?.id])

  useEffect(() => { loadEmployees() }, [])

  const filtered = employees.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = !q || fullName(e).toLowerCase().includes(q) || e.rut.includes(q) || e.position?.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'all' || e.status === filterStatus || (filterStatus === 'active' && !e.status)
    return matchSearch && matchStatus
  })

  const handleUpdated = (updated: Employee) => {
    setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e))
    setSelected(updated)
  }

  const handleDeleted = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id))
    setSelected(null)
  }

  const stats = {
    total: employees.length,
    activos: employees.filter(e => !e.status || e.status === 'active').length,
    plazoFijo: employees.filter(e => e.contractType === 'plazo_fijo').length,
    indefinido: employees.filter(e => e.contractType === 'indefinido').length,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

      {/* ── Barra superior ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0 16px', flexShrink: 0, flexWrap: 'wrap', gap: 10 }}>

        {/* Stats rápidas */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Total', value: stats.total, color: '#3b82f6' },
            { label: 'Activos', value: stats.activos, color: '#22c55e' },
            { label: 'Plazo Fijo', value: stats.plazoFijo, color: '#f59e0b' },
            { label: 'Indefinido', value: stats.indefinido, color: '#8b5cf6' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Botón nuevo colaborador */}
        <button
          onClick={() => setShowNew(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0 }}
        >
          + Nuevo Colaborador
        </button>
      </div>

      {/* ── Layout split-panel ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 0, flex: 1, minHeight: 0, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-primary)' }}>

        {/* ═══ PANEL IZQUIERDO — Lista de colaboradores ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', background: 'var(--bg-secondary)', minHeight: 0 }}>

          {/* Búsqueda + filtro */}
          <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <input
              type="text"
              placeholder="🔍 Buscar nombre, RUT, cargo…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 12, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
              {(['all','active','terminated'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  style={{
                    flex: 1, fontSize: 11, padding: '4px 0', borderRadius: 6, cursor: 'pointer', fontWeight: 500,
                    border: filterStatus === f ? 'none' : '1px solid var(--border)',
                    background: filterStatus === f ? 'var(--accent)' : 'none',
                    color: filterStatus === f ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Baja'}
                </button>
              ))}
            </div>
          </div>

          {/* Lista scrolleable */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 20 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', marginBottom: 4 }}>
                    <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton skeleton-text" style={{ width: '70%', marginBottom: 6 }} />
                      <div className="skeleton skeleton-text" style={{ width: '50%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                {search ? 'Sin resultados' : 'Sin colaboradores'}
              </div>
            ) : (
              filtered.map(emp => {
                const isSelected = selected?.id === emp.id
                const sc = STATUS_COLOR[emp.status] || '#22c55e'
                return (
                  <button
                    key={emp.id}
                    onClick={() => setSelected(emp)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      padding: '10px 12px', border: 'none', textAlign: 'left', cursor: 'pointer',
                      background: isSelected ? 'rgba(37,99,235,0.08)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)' }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                  >
                    {/* Avatar mini */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, background: avatarColor(emp),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0, position: 'relative',
                    }}>
                      {initials(emp)}
                      <span style={{
                        position: 'absolute', bottom: -2, right: -2,
                        width: 9, height: 9, borderRadius: '50%',
                        background: sc, border: '1.5px solid var(--bg-secondary)',
                      }} />
                    </div>

                    {/* Texto */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--accent)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {fullName(emp)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {emp.position || '—'} {emp.department ? `· ${emp.department}` : ''}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Contador */}
          <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
            {filtered.length} de {employees.length} colaboradores
          </div>
        </div>

        {/* ═══ PANEL DERECHO — Perfil ═══ */}
        <div style={{ minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {selected ? (
            <EmployeeProfile
              key={selected.id}
              employee={selected}
              onUpdated={handleUpdated}
              onDelete={handleDeleted}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: 12 }}>
              <div style={{ fontSize: 56 }}>👥</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>Selecciona un colaborador</div>
              <div style={{ fontSize: 13 }}>Haz clic en un nombre de la lista para ver su perfil</div>
              <button
                onClick={() => setShowNew(true)}
                style={{ marginTop: 8, padding: '9px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                + Crear primer colaborador
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal nuevo colaborador */}
      {showNew && (
        <NuevoColaboradorModal
          onClose={() => setShowNew(false)}
          onCreated={() => { loadEmployees(); setShowNew(false) }}
        />
      )}
    </div>
  )
}
