import React, { useState, useEffect } from 'react'
import {
  FileText, Users, Building, Clock, DollarSign, Shield, PenTool,
  Eye, X, AlertTriangle, ArrowRight, Download
} from 'lucide-react'
import { Employee } from '../shared/types'
import { api } from '../../services/api'
import { CHILE_LABOR, validateSalary, calculateTax } from '../shared/ChileLaborConstants'
import { AFP_OPTIONS, HEALTH_OPTIONS, CONTRACT_TYPES, DEPARTMENTS, COMPANY } from '../shared/constants'
import { btnPrimary, btnSecondary, btnSmall } from '../shared/styles'

// ─── Contract Form Types & Constants ────────────────────────────
interface ContractFormData {
  // Empresa
  companyName: string
  companyRut: string
  companyAddress: string
  companyCity: string
  companyGiro: string
  repName: string
  repRut: string
  // Trabajador
  firstName: string
  lastName: string
  rut: string
  nationality: string
  birthDate: string
  maritalStatus: string
  address: string
  commune: string
  city: string
  phone: string
  email: string
  // Contrato
  contractType: string
  startDate: string
  endDate: string
  trialDays: number
  position: string
  department: string
  functions: string
  workPlace: string
  workModality: string // presencial, remoto, hibrido
  // Jornada
  scheduleType: string // 'normal' | 'art22' | 'parcial'
  weeklyHours: number
  scheduleStart: string
  scheduleEnd: string
  lunchBreak: number // minutes
  workDays: string // 'lun-vie' | 'lun-sab' | 'turnos'
  // Remuneracion
  grossSalary: number
  gratificationType: string // 'art50' (25% tope 4.75 IMM) | 'mensual'
  colacion: number
  movilizacion: number
  otherBonuses: string
  payDay: string // 'ultimo_dia' | 'dia_15' | custom
  payMethod: string // 'transferencia' | 'cheque'
  // Previsional
  afp: string
  healthSystem: string
  isapreName: string
  isapreUf: number
  afcActive: boolean
  // Clausulas adicionales
  confidentiality: boolean
  nonCompete: boolean
  nonCompeteMonths: number
  intellectualProperty: boolean
  remoteWorkClause: boolean
  toolsProvided: string
  uniformRequired: boolean
  // Vacaciones
  extraVacationDays: number
  progressiveVacation: boolean
  // ─── Descuentos Legales / Voluntarios ───
  pensionAlimentos: boolean
  pensionAlimentosTipo: string // 'fijo' | 'porcentaje'
  pensionAlimentosMonto: number
  pensionAlimentosPct: number
  pensionAlimentosBeneficiarios: number
  apvActive: boolean
  apvRegime: string // 'A' | 'B'
  apvMonthlyAmount: number
  anticipoQuincenal: boolean
  anticipoPct: number
  // ─── Progresion contractual Conniku ───
  contractStage: number // 1, 2, 3
  directIndefinido: boolean
}

const WORK_MODALITIES = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'remoto', label: 'Teletrabajo (Ley 21.220)' },
  { value: 'hibrido', label: 'Hibrido' },
]

const SCHEDULE_TYPES = [
  { value: 'normal', label: 'Jornada Ordinaria (max 40 hrs - Ley 21.561)' },
  { value: 'art22', label: 'Excluido de Jornada (Art. 22 inc. 2)' },
  { value: 'parcial', label: 'Jornada Parcial (max 30 hrs)' },
]

const GRATIFICATION_TYPES = [
  { value: 'art50', label: 'Art. 50 — 25% remuneracion, tope 4.75 IMM' },
  { value: 'mensual', label: 'Pago mensual proporcional (Art. 50 inc. 2)' },
]

// ─── Contract HTML Generator ────────────────────────────────────
function generateContractHTML(f: ContractFormData) {
  const today = new Date()
  const dateStr = today.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
  const contractTypeLabel = CONTRACT_TYPES.find(c => c.value === f.contractType)?.label || f.contractType
  const salary = f.grossSalary.toLocaleString('es-CL')
  const colacion = f.colacion.toLocaleString('es-CL')
  const movilizacion = f.movilizacion.toLocaleString('es-CL')
  const afpLabel = AFP_OPTIONS.find(a => a.value === f.afp)?.label || f.afp
  const afpRate = AFP_OPTIONS.find(a => a.value === f.afp)?.rate || 0
  const healthLabel = f.healthSystem === 'fonasa' ? 'Fonasa' : `Isapre ${f.isapreName || ''}`
  const healthDetail = f.healthSystem === 'fonasa' ? '7% de la remuneracion imponible' : `${f.isapreUf || 0} UF mensuales`

  // Jornada
  let scheduleText = ''
  if (f.scheduleType === 'art22') {
    scheduleText = 'El Trabajador queda excluido de la limitacion de jornada de trabajo, conforme al articulo 22 inciso 2 del Codigo del Trabajo, por tratarse de un trabajador que presta sus servicios sin fiscalizacion superior inmediata o que, por su naturaleza, no requiere de supervigilancia directa. En consecuencia, no tendra derecho al pago de horas extraordinarias.'
  } else if (f.scheduleType === 'parcial') {
    scheduleText = `La jornada de trabajo sera parcial, de ${f.weeklyHours} horas semanales, distribuidas de ${f.workDays === 'lun-vie' ? 'lunes a viernes' : 'lunes a sabado'}, en horario de ${f.scheduleStart} a ${f.scheduleEnd} horas, con un descanso de ${f.lunchBreak} minutos para colacion${f.lunchBreak > 0 ? ', no imputable a la jornada' : ''}. Se aplicaran las normas del articulo 40 bis y siguientes del Codigo del Trabajo.`
  } else {
    scheduleText = `La jornada ordinaria de trabajo sera de ${f.weeklyHours} horas semanales, distribuidas de ${f.workDays === 'lun-vie' ? 'lunes a viernes' : f.workDays === 'lun-sab' ? 'lunes a sabado' : 'acuerdo a turnos rotativos'}, en horario de ${f.scheduleStart} a ${f.scheduleEnd} horas, con un descanso de ${f.lunchBreak} minutos para colacion, no imputable a la jornada de trabajo. Conforme a la Ley 21.561, la jornada ordinaria maxima es de 40 horas semanales. El Trabajador no podra laborar horas extraordinarias sin autorizacion previa y por escrito del Empleador, y estas no podran exceder de 2 horas diarias (Art. 31).`
  }

  // Duracion
  let durationClause = ''
  if (f.contractType === 'indefinido') {
    durationClause = 'El presente contrato tendra una duracion indefinida, pudiendo cualquiera de las partes ponerle termino conforme a las causales establecidas en la ley.'
  } else if (f.contractType === 'plazo_fijo') {
    durationClause = `El presente contrato tendra una duracion determinada, desde el ${new Date(f.startDate).toLocaleDateString('es-CL')} hasta el ${f.endDate ? new Date(f.endDate).toLocaleDateString('es-CL') : '[fecha termino]'}. Si el Trabajador continua prestando servicios con conocimiento del Empleador despues de expirado el plazo, el contrato se transformara en indefinido. La duracion maxima del contrato a plazo fijo es de 1 ano, salvo gerentes o personas con titulo profesional o tecnico (2 anos). La segunda renovacion lo convierte en indefinido (Art. 159 N°4).`
  } else if (f.contractType === 'por_obra') {
    durationClause = 'El presente contrato durara mientras subsista la obra o faena que le dio origen, conforme al articulo 159 N°5 del Codigo del Trabajo. La obra o faena consiste en: [descripcion de la obra]. Una vez concluida la obra, el contrato terminara sin derecho a indemnizacion por anos de servicio, salvo pacto en contrario.'
  }

  // Gratificacion
  const gratText = f.gratificationType === 'art50'
    ? 'El Empleador pagara al Trabajador gratificacion legal conforme al articulo 50 del Codigo del Trabajo, equivalente al 25% de las remuneraciones devengadas en el ano, con un tope de 4,75 Ingresos Minimos Mensuales (IMM). Este pago se realizara en forma mensual y proporcional, liberando al empleador de toda otra obligacion por concepto de gratificaciones.'
    : 'El Empleador pagara al Trabajador una gratificacion legal mensual proporcional, conforme al articulo 50 inciso 2 del Codigo del Trabajo, equivalente a la doceava parte del 25% del total de remuneraciones anuales, con tope de 4,75/12 IMM mensuales.'

  // Teletrabajo
  const remoteClause = f.remoteWorkClause || f.workModality !== 'presencial' ? `
<div class="clause">
<h2>CLAUSULA ESPECIAL: TELETRABAJO (Ley 21.220)</h2>
<p>Las partes acuerdan que el Trabajador prestara servicios bajo la modalidad de ${f.workModality === 'remoto' ? 'teletrabajo' : 'trabajo hibrido'}, conforme a la Ley 21.220 que regula el trabajo a distancia y teletrabajo.</p>
<p>El Empleador proporcionara al Trabajador los equipos, herramientas y materiales necesarios para el desempe&ntilde;o de sus funciones${f.toolsProvided ? `, incluyendo: ${f.toolsProvided}` : ''}. Los costos de operacion, funcionamiento, mantencion y reparacion de los equipos seran de cargo del Empleador.</p>
<p>El Trabajador debera mantener un lugar de trabajo adecuado y cumplir con las normas de seguridad y salud en el trabajo. El Empleador tendra derecho a verificar las condiciones del lugar de trabajo, previo aviso.</p>
<p>El derecho a desconexion digital sera de al menos 12 horas continuas en un periodo de 24 horas, conforme al articulo 152 quater J del Codigo del Trabajo.</p>
</div>` : ''

  // Confidencialidad
  const confClause = f.confidentiality ? `
<div class="clause">
<h2>CLAUSULA DE CONFIDENCIALIDAD</h2>
<p>El Trabajador se obliga a mantener estricta reserva y confidencialidad respecto de toda informacion, datos, documentos, procedimientos, metodologias, software, codigos fuente, bases de datos, estrategias comerciales, listado de clientes y proveedores, y en general, todo antecedente o informacion de caracter reservado que llegue a su conocimiento con motivo o con ocasion de la prestacion de sus servicios.</p>
<p>Esta obligacion se mantendra vigente durante la relacion laboral y por un periodo de 2 anos contados desde la terminacion del contrato, cualquiera sea la causa. La infraccion a esta obligacion constituira causal de terminacion del contrato por incumplimiento grave de las obligaciones (Art. 160 N°7), sin perjuicio de las acciones civiles y penales que procedan.</p>
</div>` : ''

  // No competencia
  const nonCompClause = f.nonCompete ? `
<div class="clause">
<h2>CLAUSULA DE NO COMPETENCIA</h2>
<p>El Trabajador se obliga, durante la vigencia del contrato y por un periodo de ${f.nonCompeteMonths} meses contados desde su terminacion, a no prestar servicios, directa o indirectamente, a empresas competidoras del Empleador, ni a desarrollar actividades comerciales que compitan con el giro del Empleador. Como compensacion por esta restriccion, el Empleador pagara al Trabajador una indemnizacion equivalente al 50% de la remuneracion mensual por cada mes de vigencia de la restriccion, conforme al articulo 160 bis del Codigo del Trabajo.</p>
</div>` : ''

  // Propiedad intelectual
  const ipClause = f.intellectualProperty ? `
<div class="clause">
<h2>CLAUSULA DE PROPIEDAD INTELECTUAL</h2>
<p>Todo invento, creacion, desarrollo, programa computacional, base de datos, obra intelectual, dise&ntilde;o, marca u otro resultado del trabajo intelectual que el Trabajador realice en el desempe&ntilde;o de sus funciones, o utilizando medios proporcionados por el Empleador, sera de propiedad exclusiva del Empleador, conforme a la Ley 19.039 sobre Propiedad Industrial y la Ley 17.336 sobre Propiedad Intelectual. El Trabajador se obliga a suscribir los documentos necesarios para formalizar la cesion de derechos.</p>
</div>` : ''

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
</body></html>`
}

// ─── Contract Modal ─────────────────────────────────────────────
function ContractModal({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'empresa' | 'trabajador' | 'contrato' | 'jornada' | 'remuneracion' | 'previsional' | 'clausulas' | 'preview'>('empresa')

  const [form, setForm] = useState<ContractFormData>({
    companyName: COMPANY.name,
    companyRut: COMPANY.rut,
    companyAddress: COMPANY.address,
    companyCity: COMPANY.city,
    companyGiro: COMPANY.giro,
    repName: COMPANY.repName,
    repRut: COMPANY.repRut,
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
  })

  const u = (key: keyof ContractFormData, val: any) => setForm(prev => ({ ...prev, [key]: val }))

  const handlePrint = () => {
    const html = generateContractHTML(form)
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500) }
  }

  const handleDownload = () => {
    const html = generateContractHTML(form)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `Contrato_${form.firstName}_${form.lastName}.html`; a.click()
    URL.revokeObjectURL(url)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit',
  }
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }
  const fieldStyle: React.CSSProperties = { marginBottom: 12 }
  const checkboxRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, cursor: 'pointer' }

  const tabs: { id: typeof activeTab; label: string; icon: React.ReactNode }[] = [
    { id: 'empresa', label: 'Empresa', icon: <Building size={14} /> },
    { id: 'trabajador', label: 'Trabajador', icon: <Users size={14} /> },
    { id: 'contrato', label: 'Contrato', icon: <FileText size={14} /> },
    { id: 'jornada', label: 'Jornada', icon: <Clock size={14} /> },
    { id: 'remuneracion', label: 'Remuneracion', icon: <DollarSign size={14} /> },
    { id: 'previsional', label: 'Previsional', icon: <Shield size={14} /> },
    { id: 'clausulas', label: 'Clausulas', icon: <PenTool size={14} /> },
    { id: 'preview', label: 'Vista Previa', icon: <Eye size={14} /> },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: 'var(--bg-primary)', borderRadius: 16, width: '95%', maxWidth: 820, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
              <FileText size={20} /> Generar Contrato de Trabajo
            </h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
              <X size={20} />
            </button>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto', marginBottom: -1 }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', border: 'none', cursor: 'pointer',
                background: activeTab === tab.id ? 'var(--bg-primary)' : 'transparent',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 12, fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}>
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
              <div style={{ padding: 12, background: 'linear-gradient(135deg, #3B82F620, #6366F120)', borderRadius: 8, marginBottom: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                <strong>Art. 10 N°1 y N°2 — Codigo del Trabajo:</strong> El contrato debe contener la individualizacion de las partes con indicacion de la nacionalidad, domicilio y direccion del empleador.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={fieldStyle}><label style={labelStyle}>Razon Social</label><input style={inputStyle} value={form.companyName} onChange={e => u('companyName', e.target.value)} /></div>
                <div style={fieldStyle}><label style={labelStyle}>RUT Empresa</label><input style={inputStyle} value={form.companyRut} onChange={e => u('companyRut', e.target.value)} placeholder="78.395.702-7" /></div>
                <div style={fieldStyle}><label style={labelStyle}>Giro / Actividad Economica</label><input style={inputStyle} value={form.companyGiro} onChange={e => u('companyGiro', e.target.value)} /></div>
                <div style={fieldStyle}><label style={labelStyle}>Ciudad</label><input style={inputStyle} value={form.companyCity} onChange={e => u('companyCity', e.target.value)} /></div>
                <div style={{ ...fieldStyle, gridColumn: 'span 2' }}><label style={labelStyle}>Direccion Empresa</label><input style={inputStyle} value={form.companyAddress} onChange={e => u('companyAddress', e.target.value)} /></div>
                <div style={fieldStyle}><label style={labelStyle}>Representante Legal</label><input style={inputStyle} value={form.repName} onChange={e => u('repName', e.target.value)} /></div>
                <div style={fieldStyle}><label style={labelStyle}>RUT Representante</label><input style={inputStyle} value={form.repRut} onChange={e => u('repRut', e.target.value)} placeholder="XX.XXX.XXX-X" /></div>
              </div>
            </div>
          )}

          {/* TRABAJADOR */}
          {activeTab === 'trabajador' && (
            <div>
              <div style={{ padding: 12, background: 'linear-gradient(135deg, #10B98120, #06B6D420)', borderRadius: 8, marginBottom: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                <strong>Art. 10 N°1 — Codigo del Trabajo:</strong> Individualizacion del trabajador con indicacion de nacionalidad, fecha de nacimiento, domicilio e ingreso.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={fieldStyle}><label style={labelStyle}>Nombres</label><input style={inputStyle} value={form.firstName} onChange={e => u('firstName', e.target.value)} /></div>
                <div style={fieldStyle}><label style={labelStyle}>Apellidos</label><input style={inputStyle} value={form.lastName} onChange={e => u('lastName', e.target.value)} /></div>
                <div style={fieldStyle}><label style={labelStyle}>RUT</label><input style={inputStyle} value={form.rut} onChange={e => u('rut', e.target.value)} /></div>
                <div style={fieldStyle}><label style={labelStyle}>Nacionalidad</label><input style={inputStyle} value={form.nationality} onChange={e => u('nationality', e.target.value)} /></div>
                <div style={fieldStyle}><label style={labelStyle}>Fecha de Nacimiento</label><input style={inputStyle} type="date" value={form.birthDate} onChange={e => u('birthDate', e.target.value)} /></div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Estado Civil</label>
                  <select style={selectStyle} value={form.maritalStatus} onChange={e => u('maritalStatus', e.target.value)}>
                    <option value="Soltero/a">Soltero/a</option>
                    <option value="Casado/a">Casado/a</option>
                    <option value="Divorciado/a">Divorciado/a</option>
                    <option value="Viudo/a">Viudo/a</option>
                    <option value="Conviviente Civil">Conviviente Civil</option>
                  </select>
                </div>
                <div style={{ ...fieldStyle, gridColumn: 'span 2' }}><label style={labelStyle}>Direccion</label><input style={inputStyle} value={form.address} onChange={e => u('address', e.target.value)} /></div>
                <div style={fieldStyle}><label style={labelStyle}>Comuna</label><input style={inputStyle} value={form.commune} onChange={e => u('commune', e.target.value)} /></div>
                <div style={fieldStyle}><label style={labelStyle}>Ciudad</label><input style={inputStyle} value={form.city} onChange={e => u('city', e.target.value)} /></div>
                <div style={fieldStyle}><label style={labelStyle}>Telefono</label><input style={inputStyle} value={form.phone} onChange={e => u('phone', e.target.value)} /></div>
                <div style={fieldStyle}><label style={labelStyle}>Email</label><input style={inputStyle} value={form.email} onChange={e => u('email', e.target.value)} /></div>
              </div>
            </div>
          )}

          {/* CONTRATO */}
          {activeTab === 'contrato' && (
            <div>
              <div style={{ padding: 12, background: 'linear-gradient(135deg, #F59E0B20, #F9731620)', borderRadius: 8, marginBottom: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                <strong>Art. 10 N°3, N°4, N°6 — Codigo del Trabajo:</strong> Determinacion de la naturaleza de los servicios, lugar de trabajo y plazo del contrato. Art. 159 N°4: plazo fijo max 1 ano (2 anos profesionales). Segunda renovacion lo convierte en indefinido.
              </div>
              {/* Progresion contractual Conniku */}
              <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>Progresion Contractual Conniku</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Politica interna: 1er contrato plazo fijo 30 dias → 2do contrato 60 dias → 3er contrato indefinido (Art. 159 N°4: segunda renovacion = indefinido).
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  {CHILE_LABOR.CONTRACT_PROGRESSION.stages.map(stage => (
                    <button key={stage.stage} onClick={() => {
                      u('contractStage', stage.stage)
                      u('contractType', stage.type)
                      if (stage.type === 'plazo_fijo' && form.startDate) {
                        const end = new Date(form.startDate)
                        end.setDate(end.getDate() + stage.days)
                        u('endDate', end.toISOString().split('T')[0])
                      }
                      u('directIndefinido', false)
                    }} style={{
                      ...btnSmall, flex: 1, textAlign: 'center',
                      background: form.contractStage === stage.stage && !form.directIndefinido ? 'var(--accent)' : undefined,
                      color: form.contractStage === stage.stage && !form.directIndefinido ? '#fff' : undefined,
                    }}>
                      {stage.label}
                    </button>
                  ))}
                </div>
                <label style={{ ...checkboxRow, padding: 8, background: 'var(--bg-tertiary)', borderRadius: 6 }}>
                  <input type="checkbox" checked={form.directIndefinido} onChange={e => {
                    u('directIndefinido', e.target.checked)
                    if (e.target.checked) u('contractType', 'indefinido')
                  }} />
                  <div><strong>Contratacion directa a Indefinido</strong> (decision CEO/RRHH)<br/><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Omite la progresion y genera contrato indefinido desde el inicio.</span></div>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Tipo de Contrato</label>
                  <select style={selectStyle} value={form.contractType} onChange={e => u('contractType', e.target.value)}>
                    {CONTRACT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div style={fieldStyle}><label style={labelStyle}>Dias de Prueba</label><input style={inputStyle} type="number" value={form.trialDays} onChange={e => u('trialDays', parseInt(e.target.value) || 0)} /></div>
                <div style={fieldStyle}><label style={labelStyle}>Fecha Inicio</label><input style={inputStyle} type="date" value={form.startDate} onChange={e => u('startDate', e.target.value)} /></div>
                {form.contractType === 'plazo_fijo' && (
                  <div style={fieldStyle}><label style={labelStyle}>Fecha Termino</label><input style={inputStyle} type="date" value={form.endDate} onChange={e => u('endDate', e.target.value)} /></div>
                )}
                <div style={fieldStyle}><label style={labelStyle}>Cargo / Posicion</label><input style={inputStyle} value={form.position} onChange={e => u('position', e.target.value)} /></div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Departamento</label>
                  <select style={selectStyle} value={form.department} onChange={e => u('department', e.target.value)}>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div style={{ ...fieldStyle, gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Funciones Principales (descripcion)</label>
                  <textarea style={{ ...inputStyle, height: 70, resize: 'vertical' }} value={form.functions} onChange={e => u('functions', e.target.value)} placeholder="Desarrollo de software, mantencion de plataformas, soporte tecnico..." />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Modalidad de Trabajo</label>
                  <select style={selectStyle} value={form.workModality} onChange={e => u('workModality', e.target.value)}>
                    {WORK_MODALITIES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div style={fieldStyle}><label style={labelStyle}>Lugar de Trabajo</label><input style={inputStyle} value={form.workPlace} onChange={e => u('workPlace', e.target.value)} placeholder="Direccion o 'Domicilio del trabajador'" /></div>
              </div>
            </div>
          )}

          {/* JORNADA */}
          {activeTab === 'jornada' && (
            <div>
              <div style={{ padding: 12, background: 'linear-gradient(135deg, #EC489920, #F4385E20)', borderRadius: 8, marginBottom: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                <strong>Art. 10 N°5, Art. 22-40 bis — Codigo del Trabajo:</strong> Duracion y distribucion de la jornada. Ley 21.561: reduccion gradual a 40 hrs semanales. Art. 22 inc. 2: excluye de limitacion a gerentes, teletrabajadores que distribuyen libremente su jornada, y otros.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ ...fieldStyle, gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Tipo de Jornada</label>
                  <select style={selectStyle} value={form.scheduleType} onChange={e => u('scheduleType', e.target.value)}>
                    {SCHEDULE_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                {form.scheduleType !== 'art22' && (<>
                  <div style={fieldStyle}><label style={labelStyle}>Horas Semanales</label><input style={inputStyle} type="number" value={form.weeklyHours} onChange={e => u('weeklyHours', parseInt(e.target.value) || 0)} /></div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Distribucion</label>
                    <select style={selectStyle} value={form.workDays} onChange={e => u('workDays', e.target.value)}>
                      <option value="lun-vie">Lunes a Viernes</option>
                      <option value="lun-sab">Lunes a Sabado</option>
                      <option value="turnos">Turnos Rotativos</option>
                    </select>
                  </div>
                  <div style={fieldStyle}><label style={labelStyle}>Hora Entrada</label><input style={inputStyle} type="time" value={form.scheduleStart} onChange={e => u('scheduleStart', e.target.value)} /></div>
                  <div style={fieldStyle}><label style={labelStyle}>Hora Salida</label><input style={inputStyle} type="time" value={form.scheduleEnd} onChange={e => u('scheduleEnd', e.target.value)} /></div>
                  <div style={fieldStyle}><label style={labelStyle}>Colacion (minutos)</label><input style={inputStyle} type="number" value={form.lunchBreak} onChange={e => u('lunchBreak', parseInt(e.target.value) || 0)} /></div>
                </>)}
                {form.scheduleType === 'art22' && (
                  <div style={{ gridColumn: 'span 2', padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                    <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> El trabajador excluido de jornada (Art. 22 inc. 2) no tiene derecho a horas extraordinarias. Aplica para: gerentes, administradores, apoderados con facultades de administracion, teletrabajadores que distribuyen libremente su jornada, y trabajadores sin fiscalizacion superior inmediata.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REMUNERACION */}
          {activeTab === 'remuneracion' && (() => {
            const salaryCheck = validateSalary(form.grossSalary, form.weeklyHours)
            const gratMensual = CHILE_LABOR.GRATIFICACION.topeMensual
            return (
            <div>
              <div style={{ padding: 12, background: 'linear-gradient(135deg, #10B98120, #14B8A620)', borderRadius: 8, marginBottom: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                <strong>Art. 10 N°5, Art. 41-52 — Codigo del Trabajo:</strong> Monto, forma y periodo de pago. Art. 42: constituyen remuneracion el sueldo, sobresueldo, comision, participacion y gratificacion. Art. 44: sueldo no puede ser inferior al IMM (${CHILE_LABOR.IMM.current.toLocaleString('es-CL')}). Art. 50: gratificacion legal obligatoria.
              </div>

              {/* Salary validation */}
              {!salaryCheck.valid && (
                <div style={{ padding: 12, background: '#FEF2F220', border: '2px solid #EF4444', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={18} /> <strong>ALERTA LEGAL:</strong> {salaryCheck.message}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Sueldo Bruto Mensual ($CLP)</label>
                  <input style={{ ...inputStyle, borderColor: !salaryCheck.valid ? '#EF4444' : undefined }} type="number" value={form.grossSalary} onChange={e => u('grossSalary', parseInt(e.target.value) || 0)} />
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Minimo legal: ${salaryCheck.min.toLocaleString('es-CL')} ({form.weeklyHours}h/sem)</div>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Gratificacion Legal</label>
                  <select style={selectStyle} value={form.gratificationType} onChange={e => u('gratificationType', e.target.value)}>
                    {GRATIFICATION_TYPES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Tope mensual: ${gratMensual.toLocaleString('es-CL')}</div>
                </div>
                <div style={fieldStyle}><label style={labelStyle}>Colacion ($CLP, no imponible)</label><input style={inputStyle} type="number" value={form.colacion} onChange={e => u('colacion', parseInt(e.target.value) || 0)} /></div>
                <div style={fieldStyle}><label style={labelStyle}>Movilizacion ($CLP, no imponible)</label><input style={inputStyle} type="number" value={form.movilizacion} onChange={e => u('movilizacion', parseInt(e.target.value) || 0)} /></div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Dia de Pago de Remuneracion</label>
                  <select style={selectStyle} value={form.payDay} onChange={e => u('payDay', e.target.value)}>
                    <option value="ultimo_dia">Ultimo dia habil del mes</option>
                    <option value="dia_30">Dia 30 de cada mes</option>
                  </select>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Cierre de calculo: dia {CHILE_LABOR.CONNIKU_PAYROLL.cierreDia} de cada mes</div>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Forma de Pago</label>
                  <select style={selectStyle} value={form.payMethod} onChange={e => u('payMethod', e.target.value)}>
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="cheque">Cheque Nominativo</option>
                  </select>
                </div>
                <div style={{ ...fieldStyle, gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Otros Bonos / Asignaciones (opcional)</label>
                  <input style={inputStyle} value={form.otherBonuses} onChange={e => u('otherBonuses', e.target.value)} placeholder="Ej: Bono de productividad $50.000, asignacion de herramientas $30.000" />
                </div>
              </div>

              {/* Anticipo Quincenal */}
              <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, marginTop: 12 }}>
                <label style={checkboxRow}>
                  <input type="checkbox" checked={form.anticipoQuincenal} onChange={e => u('anticipoQuincenal', e.target.checked)} />
                  <div><strong>Anticipo Quincenal (dia {CHILE_LABOR.CONNIKU_PAYROLL.anticipoDia})</strong><br/><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Art. 55 CT: Pago fraccionado por acuerdo de partes. Max 40% del salario devengado al cierre del dia 22 (100% ganado). Disponible desde el 2do mes de trabajo.</span></div>
                </label>
                {form.anticipoQuincenal && (
                  <div style={{ marginTop: 8, marginLeft: 24 }}>
                    <label style={labelStyle}>% del Sueldo Liquido (calculado al cierre dia 22)</label>
                    <input style={{ ...inputStyle, width: 120 }} type="number" value={form.anticipoPct} onChange={e => u('anticipoPct', Math.min(parseInt(e.target.value) || 0, 40))} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>Max 40%</span>
                    <div style={{ marginTop: 8, padding: 8, background: 'var(--bg-tertiary)', borderRadius: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                      <strong>Como funciona:</strong> El sueldo devengado al cierre del dia 22 del mes anterior se considera el 100% ganado. El anticipo es hasta el {form.anticipoPct}% del liquido estimado sobre ese monto. Se paga el dia 15 y se descuenta de la liquidacion de fin de mes. Solo aplica desde el 2do mes (requiere 1 ciclo completo como base).
                    </div>
                  </div>
                )}
              </div>

              {/* Resumen */}
              <div style={{ padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
                <strong>Resumen Haberes:</strong><br/>
                Sueldo bruto: ${form.grossSalary.toLocaleString('es-CL')} | Gratificacion (tope): ${gratMensual.toLocaleString('es-CL')} | Colacion: ${form.colacion.toLocaleString('es-CL')} | Movilizacion: ${form.movilizacion.toLocaleString('es-CL')}<br/>
                <strong>Total haberes imponibles:</strong> ${(form.grossSalary + gratMensual).toLocaleString('es-CL')} | <strong>Total no imponibles:</strong> ${(form.colacion + form.movilizacion).toLocaleString('es-CL')}<br/>
                <strong>Total bruto:</strong> ${(form.grossSalary + gratMensual + form.colacion + form.movilizacion).toLocaleString('es-CL')}
                {form.anticipoQuincenal && <><br/><strong>Anticipo dia 15:</strong> ~${Math.round((form.grossSalary * 0.7) * form.anticipoPct / 100).toLocaleString('es-CL')} ({form.anticipoPct}% del liquido estimado)</>}
              </div>
            </div>
            )
          })()}

          {/* PREVISIONAL */}
          {activeTab === 'previsional' && (() => {
            const afpRate = AFP_OPTIONS.find(a => a.value === form.afp)?.rate || 0
            const afpAmount = Math.round(Math.min(form.grossSalary, CHILE_LABOR.TOPES.afpCLP) * afpRate / 100)
            const healthAmount = Math.round(Math.min(form.grossSalary, CHILE_LABOR.TOPES.saludCLP) * 0.07)
            const afcEmpAmount = form.afcActive ? Math.round(Math.min(form.grossSalary, CHILE_LABOR.TOPES.afcCLP) * (form.contractType === 'indefinido' ? CHILE_LABOR.AFC.employeeRate : 0)) : 0
            const afcErAmount = form.afcActive ? Math.round(Math.min(form.grossSalary, CHILE_LABOR.TOPES.afcCLP) * (form.contractType === 'indefinido' ? CHILE_LABOR.AFC.employerIndefinido : CHILE_LABOR.AFC.employerPlazoFijo)) : 0
            const sisAmount = Math.round(form.grossSalary * CHILE_LABOR.SIS.rate)
            const mutualAmount = Math.round(form.grossSalary * (CHILE_LABOR.MUTUAL.baseRate + CHILE_LABOR.MUTUAL.additionalRate))
            const totalDescOblig = afpAmount + healthAmount + afcEmpAmount
            const taxableIncome = form.grossSalary - afpAmount - healthAmount - afcEmpAmount
            const taxAmount = calculateTax(Math.max(taxableIncome, 0))
            const pensionAmt = form.pensionAlimentos ? (form.pensionAlimentosTipo === 'fijo' ? form.pensionAlimentosMonto : Math.round(form.grossSalary * form.pensionAlimentosPct / 100)) : 0
            const apvAmt = form.apvActive ? form.apvMonthlyAmount : 0
            const netEstimate = form.grossSalary - totalDescOblig - taxAmount - pensionAmt - apvAmt + form.colacion + form.movilizacion

            return (
            <div>
              <div style={{ padding: 12, background: 'linear-gradient(135deg, #6366F120, #8B5CF620)', borderRadius: 8, marginBottom: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                <strong>DL 3.500 (AFP), Ley 18.469/18.933 (Salud), Ley 19.728 (AFC):</strong> Cotizaciones obligatorias. Tope imponible: {CHILE_LABOR.TOPES.afpUF} UF = ${CHILE_LABOR.TOPES.afpCLP.toLocaleString('es-CL')}. SIS ({(CHILE_LABOR.SIS.rate * 100).toFixed(2)}%) y Mutual ({((CHILE_LABOR.MUTUAL.baseRate + CHILE_LABOR.MUTUAL.additionalRate) * 100).toFixed(2)}%): cargo del empleador.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>AFP</label>
                  <select style={selectStyle} value={form.afp} onChange={e => u('afp', e.target.value)}>
                    <option value="">Seleccionar AFP</option>
                    {AFP_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label} ({a.rate}%)</option>)}
                  </select>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Sistema de Salud</label>
                  <select style={selectStyle} value={form.healthSystem} onChange={e => u('healthSystem', e.target.value)}>
                    {HEALTH_OPTIONS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
                {form.healthSystem === 'isapre' && (<>
                  <div style={fieldStyle}><label style={labelStyle}>Nombre Isapre</label><input style={inputStyle} value={form.isapreName} onChange={e => u('isapreName', e.target.value)} /></div>
                  <div style={fieldStyle}><label style={labelStyle}>Plan Isapre (UF mensuales)</label><input style={inputStyle} type="number" step="0.1" value={form.isapreUf} onChange={e => u('isapreUf', parseFloat(e.target.value) || 0)} /></div>
                </>)}
                <div style={{ ...fieldStyle, gridColumn: 'span 2' }}>
                  <label style={checkboxRow}>
                    <input type="checkbox" checked={form.afcActive} onChange={e => u('afcActive', e.target.checked)} />
                    <span><strong>Seguro de Cesantia (AFC)</strong> — Obligatorio para contratos desde Oct 2002. Tope: {CHILE_LABOR.TOPES.afcUF} UF</span>
                  </label>
                </div>
              </div>

              {/* APV */}
              <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, marginTop: 12 }}>
                <label style={checkboxRow}>
                  <input type="checkbox" checked={form.apvActive} onChange={e => u('apvActive', e.target.checked)} />
                  <div><strong>APV — Ahorro Previsional Voluntario (Art. 20 DL 3.500)</strong><br/><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Descuento voluntario del trabajador. Regimen A: bonificacion fiscal 15%. Regimen B: rebaja base tributable.</span></div>
                </label>
                {form.apvActive && (
                  <div style={{ marginTop: 8, marginLeft: 24, display: 'flex', gap: 12, alignItems: 'end' }}>
                    <div>
                      <label style={labelStyle}>Regimen</label>
                      <select style={{ ...selectStyle, width: 280 }} value={form.apvRegime} onChange={e => u('apvRegime', e.target.value)}>
                        {CHILE_LABOR.APV.regimes.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Monto Mensual ($CLP)</label>
                      <input style={{ ...inputStyle, width: 150 }} type="number" value={form.apvMonthlyAmount} onChange={e => u('apvMonthlyAmount', parseInt(e.target.value) || 0)} />
                    </div>
                  </div>
                )}
              </div>

              {/* Pension de Alimentos */}
              <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, marginTop: 12 }}>
                <label style={checkboxRow}>
                  <input type="checkbox" checked={form.pensionAlimentos} onChange={e => u('pensionAlimentos', e.target.checked)} />
                  <div><strong>Pension de Alimentos (Ley 14.908)</strong><br/><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Retencion judicial obligatoria. El empleador DEBE retener y depositar directamente (Art. 8). Incumplimiento = arresto (Art. 14). Max retencion: 50% de la remuneracion.</span></div>
                </label>
                {form.pensionAlimentos && (
                  <div style={{ marginTop: 8, marginLeft: 24, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Tipo</label>
                      <select style={selectStyle} value={form.pensionAlimentosTipo} onChange={e => u('pensionAlimentosTipo', e.target.value)}>
                        <option value="fijo">Monto Fijo</option>
                        <option value="porcentaje">% del Sueldo</option>
                      </select>
                    </div>
                    {form.pensionAlimentosTipo === 'fijo' ? (
                      <div><label style={labelStyle}>Monto Mensual ($CLP)</label><input style={inputStyle} type="number" value={form.pensionAlimentosMonto} onChange={e => u('pensionAlimentosMonto', parseInt(e.target.value) || 0)} /></div>
                    ) : (
                      <div><label style={labelStyle}>% del Sueldo Bruto</label><input style={inputStyle} type="number" value={form.pensionAlimentosPct} onChange={e => u('pensionAlimentosPct', Math.min(parseInt(e.target.value) || 0, 50))} /></div>
                    )}
                    <div><label style={labelStyle}>N° Beneficiarios</label><input style={inputStyle} type="number" value={form.pensionAlimentosBeneficiarios} onChange={e => u('pensionAlimentosBeneficiarios', parseInt(e.target.value) || 1)} /></div>
                  </div>
                )}
              </div>

              {/* Desglose completo */}
              {form.afp && (
                <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 8, fontSize: 12, marginTop: 16 }}>
                  <strong style={{ fontSize: 13 }}>Simulacion de Liquidacion — Sueldo ${form.grossSalary.toLocaleString('es-CL')}</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 6, textTransform: 'uppercase', fontSize: 11 }}>Haberes</div>
                      <div>Sueldo Base: ${form.grossSalary.toLocaleString('es-CL')}</div>
                      <div>Gratificacion: ${CHILE_LABOR.GRATIFICACION.topeMensual.toLocaleString('es-CL')}</div>
                      <div>Colacion: ${form.colacion.toLocaleString('es-CL')}</div>
                      <div>Movilizacion: ${form.movilizacion.toLocaleString('es-CL')}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#EF4444', marginBottom: 6, textTransform: 'uppercase', fontSize: 11 }}>Descuentos Obligatorios</div>
                      <div>AFP {AFP_OPTIONS.find(a => a.value === form.afp)?.label} ({afpRate}%): -${afpAmount.toLocaleString('es-CL')}</div>
                      <div>Salud (7%): -${healthAmount.toLocaleString('es-CL')}</div>
                      {form.afcActive && <div>AFC Trabajador ({(CHILE_LABOR.AFC.employeeRate * 100).toFixed(1)}%): -${afcEmpAmount.toLocaleString('es-CL')}</div>}
                      <div>Impuesto 2da Cat.: -${taxAmount.toLocaleString('es-CL')}</div>
                      {form.pensionAlimentos && <div style={{ color: '#DC2626' }}>Pension Alimentos: -${pensionAmt.toLocaleString('es-CL')}</div>}
                      {form.apvActive && <div>APV Reg. {form.apvRegime}: -${apvAmt.toLocaleString('es-CL')}</div>}
                    </div>
                  </div>
                  <div style={{ borderTop: '2px solid var(--border)', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                    <div><strong style={{ fontSize: 15, color: 'var(--accent-green)' }}>Liquido Estimado: ${netEstimate.toLocaleString('es-CL')}</strong></div>
                    <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}>
                      Costo empleador: SIS ${sisAmount.toLocaleString('es-CL')} + AFC ${afcErAmount.toLocaleString('es-CL')} + Mutual ${mutualAmount.toLocaleString('es-CL')} = <strong>${(sisAmount + afcErAmount + mutualAmount).toLocaleString('es-CL')}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
            )
          })()}

          {/* CLAUSULAS ADICIONALES */}
          {activeTab === 'clausulas' && (
            <div>
              <div style={{ padding: 12, background: 'linear-gradient(135deg, #F43F5E20, #EF444420)', borderRadius: 8, marginBottom: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                <strong>Art. 10 N°7 — Codigo del Trabajo:</strong> Demas pactos que acordaren las partes. Estas clausulas son opcionales pero altamente recomendadas para proteger los intereses de la empresa.
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                <label style={{ ...checkboxRow, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <input type="checkbox" checked={form.confidentiality} onChange={e => u('confidentiality', e.target.checked)} />
                  <div><strong>Clausula de Confidencialidad</strong><br/><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Protege informacion reservada durante y despues del contrato (2 anos). Infraccion = causal Art. 160 N°7.</span></div>
                </label>

                <label style={{ ...checkboxRow, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <input type="checkbox" checked={form.intellectualProperty} onChange={e => u('intellectualProperty', e.target.checked)} />
                  <div><strong>Propiedad Intelectual</strong><br/><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cesion de inventos, software, obras creadas en el ejercicio del cargo. Ref: Ley 19.039 y Ley 17.336.</span></div>
                </label>

                <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <label style={checkboxRow}>
                    <input type="checkbox" checked={form.nonCompete} onChange={e => u('nonCompete', e.target.checked)} />
                    <div><strong>No Competencia Post-Contractual</strong><br/><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Restriccion temporal post-termino. Requiere compensacion economica (Art. 160 bis).</span></div>
                  </label>
                  {form.nonCompete && (
                    <div style={{ marginTop: 8, marginLeft: 24 }}>
                      <label style={labelStyle}>Meses de Restriccion</label>
                      <input style={{ ...inputStyle, width: 120 }} type="number" value={form.nonCompeteMonths} onChange={e => u('nonCompeteMonths', parseInt(e.target.value) || 0)} />
                    </div>
                  )}
                </div>

                <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <label style={checkboxRow}>
                    <input type="checkbox" checked={form.remoteWorkClause || form.workModality !== 'presencial'} onChange={e => u('remoteWorkClause', e.target.checked)} />
                    <div><strong>Clausula de Teletrabajo (Ley 21.220)</strong><br/><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Obligatoria si la modalidad es remota o hibrida. Incluye derecho a desconexion digital (12 hrs).</span></div>
                  </label>
                  {(form.remoteWorkClause || form.workModality !== 'presencial') && (
                    <div style={{ marginTop: 8, marginLeft: 24 }}>
                      <label style={labelStyle}>Herramientas Proporcionadas</label>
                      <input style={inputStyle} value={form.toolsProvided} onChange={e => u('toolsProvided', e.target.value)} />
                    </div>
                  )}
                </div>

                <label style={{ ...checkboxRow, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <input type="checkbox" checked={form.uniformRequired} onChange={e => u('uniformRequired', e.target.checked)} />
                  <div><strong>Uso de Uniforme</strong><br/><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Obliga al uso de uniforme/EPP proporcionado por el empleador.</span></div>
                </label>

                <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>Vacaciones</div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'end' }}>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Dias Adicionales Pactados</label>
                      <input style={{ ...inputStyle, width: 120 }} type="number" value={form.extraVacationDays} onChange={e => u('extraVacationDays', parseInt(e.target.value) || 0)} />
                    </div>
                    <label style={{ ...checkboxRow, marginBottom: 12 }}>
                      <input type="checkbox" checked={form.progressiveVacation} onChange={e => u('progressiveVacation', e.target.checked)} />
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
              <div style={{ padding: 12, background: 'linear-gradient(135deg, #3B82F620, #10B98120)', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                <strong>Vista previa del contrato.</strong> Revisa todos los datos antes de generar el PDF.
              </div>

              <div style={{ background: '#fff', color: '#000', padding: 32, borderRadius: 8, border: '1px solid #ddd', fontSize: 12, lineHeight: 1.6, maxHeight: 500, overflow: 'auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <strong style={{ fontSize: 15, letterSpacing: 2 }}>CONTRATO INDIVIDUAL DE TRABAJO</strong>
                </div>
                <p><strong>Empleador:</strong> {form.companyName} — RUT: {form.companyRut || '[pendiente]'}</p>
                <p><strong>Representante:</strong> {form.repName} — RUT: {form.repRut || '[pendiente]'}</p>
                <p><strong>Trabajador:</strong> {form.firstName} {form.lastName} — RUT: {form.rut}</p>
                <p><strong>Cargo:</strong> {form.position} — Depto: {form.department}</p>
                <p><strong>Tipo:</strong> {CONTRACT_TYPES.find(c => c.value === form.contractType)?.label} — Inicio: {form.startDate ? new Date(form.startDate).toLocaleDateString('es-CL') : '[pendiente]'}</p>
                <p><strong>Jornada:</strong> {SCHEDULE_TYPES.find(s => s.value === form.scheduleType)?.label}{form.scheduleType !== 'art22' ? ` — ${form.weeklyHours} hrs/sem` : ''}</p>
                <p><strong>Modalidad:</strong> {WORK_MODALITIES.find(m => m.value === form.workModality)?.label}</p>
                <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #ddd' }} />
                <p><strong>Sueldo Bruto:</strong> ${form.grossSalary.toLocaleString('es-CL')}</p>
                <p><strong>Colacion:</strong> ${form.colacion.toLocaleString('es-CL')} | <strong>Movilizacion:</strong> ${form.movilizacion.toLocaleString('es-CL')}</p>
                <p><strong>AFP:</strong> {AFP_OPTIONS.find(a => a.value === form.afp)?.label || '[pendiente]'} | <strong>Salud:</strong> {form.healthSystem === 'fonasa' ? 'Fonasa' : `Isapre ${form.isapreName}`}</p>
                <p><strong>AFC:</strong> {form.afcActive ? 'Si' : 'No'}{form.apvActive ? ` | APV Reg. ${form.apvRegime}: $${form.apvMonthlyAmount.toLocaleString('es-CL')}` : ''}</p>
                {form.pensionAlimentos && <p style={{ color: '#DC2626' }}><strong>Pension Alimentos:</strong> {form.pensionAlimentosTipo === 'fijo' ? `$${form.pensionAlimentosMonto.toLocaleString('es-CL')}` : `${form.pensionAlimentosPct}%`} — {form.pensionAlimentosBeneficiarios} beneficiario(s)</p>}
                {form.anticipoQuincenal && <p><strong>Anticipo Quincenal:</strong> {form.anticipoPct}% el dia 15</p>}
                <p><strong>Cierre Payroll:</strong> Dia 22 | <strong>Pago:</strong> Ultimo dia habil</p>
                {!form.directIndefinido && form.contractType === 'plazo_fijo' && <p><strong>Progresion:</strong> Etapa {form.contractStage} de 3 (30d → 60d → Indefinido)</p>}
                {form.directIndefinido && <p><strong>Contratacion directa a Indefinido</strong> (decision CEO/RRHH)</p>}
                <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #ddd' }} />
                <p><strong>Clausulas adicionales:</strong></p>
                <ul style={{ paddingLeft: 20 }}>
                  {form.confidentiality && <li>Confidencialidad</li>}
                  {form.intellectualProperty && <li>Propiedad Intelectual</li>}
                  {form.nonCompete && <li>No Competencia ({form.nonCompeteMonths} meses)</li>}
                  {(form.remoteWorkClause || form.workModality !== 'presencial') && <li>Teletrabajo (Ley 21.220)</li>}
                  {form.uniformRequired && <li>Uso de Uniforme</li>}
                  {form.extraVacationDays > 0 && <li>{form.extraVacationDays} dias adicionales de vacaciones</li>}
                  {form.progressiveVacation && <li>Feriado Progresivo (Art. 68)</li>}
                </ul>
              </div>

              {/* Validation warnings */}
              {(!form.companyRut || !form.repRut || !form.rut || !form.startDate) && (
                <div style={{ padding: 12, background: '#FEF3C720', border: '1px solid #F59E0B40', borderRadius: 8, marginTop: 12, fontSize: 12, color: '#92400E' }}>
                  <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> <strong>Campos pendientes:</strong>
                  {!form.companyRut && ' RUT Empresa,'} {!form.repRut && ' RUT Representante,'} {!form.rut && ' RUT Trabajador,'} {!form.startDate && ' Fecha inicio'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
          {activeTab !== 'preview' ? (
            <>
              <div style={{ flex: 1, fontSize: 11, color: 'var(--text-muted)' }}>
                Completa todas las pestanas y revisa en "Vista Previa" antes de generar.
              </div>
              <button onClick={() => {
                const tabOrder: ('empresa' | 'trabajador' | 'contrato' | 'jornada' | 'remuneracion' | 'previsional' | 'clausulas' | 'preview')[] = ['empresa', 'trabajador', 'contrato', 'jornada', 'remuneracion', 'previsional', 'clausulas', 'preview']
                const idx = tabOrder.indexOf(activeTab)
                if (idx < tabOrder.length - 1) setActiveTab(tabOrder[idx + 1])
              }} style={btnPrimary}>
                Siguiente <ArrowRight size={14} />
              </button>
            </>
          ) : (
            <>
              <button onClick={handlePrint} style={{ ...btnPrimary, flex: 1 }}><Download size={16} /> Imprimir / Guardar PDF</button>
              <button onClick={handleDownload} style={{ ...btnSecondary, flex: 1 }}><FileText size={16} /> Descargar HTML</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Contratos Tab (Main) ───────────────────────────────────────
export default function ContratosTab() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [contractEmployee, setContractEmployee] = useState<Employee | null>(null)

  useEffect(() => {
    api.getEmployees().then((data: any) => setEmployees(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  return (
    <div>
      <div className="card" style={{ padding: 20, marginBottom: 16, background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary))' }}>
        <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={20} /> Gestion de Contratos
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
          Segun el Codigo del Trabajo de Chile, el contrato debe firmarse dentro de los primeros 15 dias (indefinido) o 5 dias (plazo fijo) desde el inicio de la relacion laboral.
        </p>
      </div>

      {/* Contract status for each employee */}
      <div style={{ display: 'grid', gap: 12 }}>
        {employees.filter(e => e.status === 'active').map(emp => {
          const daysSinceHire = Math.floor((Date.now() - new Date(emp.hireDate).getTime()) / (1000 * 60 * 60 * 24))
          const contractDeadline = emp.contractType === 'plazo_fijo' ? 5 : 15

          return (
            <div key={emp.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{emp.firstName} {emp.lastName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {CONTRACT_TYPES.find(c => c.value === emp.contractType)?.label} • Ingreso: {new Date(emp.hireDate).toLocaleDateString('es-CL')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={btnSmall} onClick={() => setContractEmployee(emp)}><FileText size={14} /> Generar Contrato</button>
                  <button style={btnSmall}><PenTool size={14} /> Firmar</button>
                  <button style={btnSmall}><FileText size={14} /> Anexo</button>
                </div>
              </div>

              {/* Contract clauses reminder */}
              <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, fontSize: 12 }}>
                <strong>Clausulas obligatorias (Art. 10 Codigo del Trabajo):</strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 6, color: 'var(--text-muted)' }}>
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
          )
        })}
      </div>

      {/* Legal notes */}
      <div className="card" style={{ padding: 20, marginTop: 20, borderLeft: '4px solid var(--accent)' }}>
        <h4 style={{ margin: '0 0 12px' }}>Normativa Aplicable</h4>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <p><strong>Art. 9:</strong> El contrato de trabajo es consensual; debera constar por escrito en los plazos legales.</p>
          <p><strong>Art. 10:</strong> Clausulas minimas obligatorias del contrato.</p>
          <p><strong>Art. 159-160:</strong> Causales de terminacion del contrato (necesidades de la empresa, mutuo acuerdo, renuncia, despido).</p>
          <p><strong>Art. 162:</strong> Obligacion de pago de cotizaciones al dia para validez del despido (Ley Bustos).</p>
          <p><strong>Art. 163:</strong> Indemnizacion por anos de servicio: 30 dias de ultima remuneracion por cada ano, tope 330 dias (11 anos). Tope mensual: 90 UF.</p>
          <p><strong>Art. 168:</strong> Recargo indemnizatorio por despido injustificado: 30% (art. 161), 50% (art. 159 N°4-5-6), 80% (art. 160).</p>
        </div>
      </div>

      {contractEmployee && (
        <ContractModal employee={contractEmployee} onClose={() => setContractEmployee(null)} />
      )}
    </div>
  )
}
