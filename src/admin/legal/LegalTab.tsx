import React, { useState, useEffect } from 'react';
import {
  Shield,
  Star,
  Globe,
  CheckCircle,
  AlertTriangle,
  Minus,
  ChevronDown,
  ChevronRight,
  FileText,
  Download,
  Clock,
  Info,
  X,
} from 'lucide-react';
import { api } from '../../services/api';

// ─── Types ──────────────────────────────────────────────────────
type ObligationStatus = 'pendiente' | 'completo' | 'na';

interface Obligation {
  id: string;
  title: string;
  description: string;
  defaultStatus: ObligationStatus;
  guide: string[]; // Steps to complete
  documents?: string[]; // Documents to generate
  legalRef?: string; // Legal reference
  links?: { label: string; url: string }[];
}

interface StatusRecord {
  status: ObligationStatus;
  completedAt?: string;
  notes?: string;
}

// ─── Obligations Data ───────────────────────────────────────────
const OBLIGATIONS: Obligation[] = [
  {
    id: 'reglamento_interno',
    title: 'Reglamento Interno de Orden, Higiene y Seguridad',
    description:
      'Obligatorio con 10+ trabajadores (Art. 153 CT). Debe ser registrado en la Direccion del Trabajo e Inspeccion del Trabajo.',
    defaultStatus: 'pendiente',
    legalRef: 'Art. 153-157 Codigo del Trabajo',
    guide: [
      'Redactar el Reglamento Interno conforme al Art. 154 del CT (condiciones de trabajo, obligaciones, prohibiciones, sanciones)',
      'Incluir normas de higiene y seguridad segun DS 40',
      'Incluir protocolo Ley Karin (Ley 21.643) de prevencion de acoso',
      'Poner en conocimiento de los trabajadores 30 dias antes de su vigencia',
      'Entregar copia gratuita a cada trabajador',
      'Registrar en la Direccion del Trabajo (dt.gob.cl → Tramites en Linea → Reglamento Interno)',
      'Registrar en la Inspeccion del Trabajo correspondiente al domicilio',
      'Fijar texto en al menos 2 lugares visibles del lugar de trabajo',
      'Marcar como COMPLETO una vez registrado en ambas instituciones',
    ],
    documents: ['Reglamento Interno de Orden, Higiene y Seguridad'],
    links: [
      { label: 'DT — Registro de Reglamento', url: 'dt.gob.cl' },
      { label: 'Modelo DT (ejemplo)', url: 'dt.gob.cl/legislacion/1624/w3-article-59096.html' },
    ],
  },
  {
    id: 'registro_dt',
    title: 'Registro en Direccion del Trabajo',
    description:
      'Inscripcion como empleador en dt.gob.cl. Necesario para inicio de actividades laborales.',
    defaultStatus: 'pendiente',
    legalRef: 'Codigo del Trabajo, Titulo Preliminar',
    guide: [
      'Ingresar a dt.gob.cl con ClaveUnica del representante legal',
      'Ir a "Mi DT" → "Registrar Empresa"',
      'Completar datos de la empresa: RUT 78.395.702-7, razon social Conniku SpA',
      'Indicar actividad economica (631200 — Portales web)',
      'Registrar domicilio del empleador',
      'Indicar numero de trabajadores actuales',
      'Confirmar y obtener constancia de registro',
      'Guardar comprobante PDF como respaldo',
      'Marcar como COMPLETO una vez obtenida la constancia',
    ],
    links: [{ label: 'Portal Mi DT', url: 'dt.gob.cl' }],
  },
  {
    id: 'mutual_seguridad',
    title: 'Mutual de Seguridad',
    description:
      'Afiliacion a una mutual (ACHS, Mutual de Seguridad, IST) para seguro de accidentes laborales. Tasa base: 0.93%.',
    defaultStatus: 'pendiente',
    legalRef: 'Ley 16.744 — Seguro Social contra Riesgos de Accidentes del Trabajo',
    guide: [
      'Elegir mutual: ACHS (achs.cl), Mutual de Seguridad (mutual.cl), o IST (ist.cl)',
      'Solicitar afiliacion online o presencial con los siguientes documentos:',
      '  — RUT empresa (78.395.702-7)',
      '  — Cedula representante legal',
      '  — Inicio de actividades SII',
      '  — Nomina de trabajadores con RUT',
      'Completar formulario de adhesion',
      'Recibir certificado de afiliacion',
      'La tasa base es 0.93% del sueldo imponible (cotizacion basica)',
      'Puede aumentar segun siniestralidad de la actividad (tasa adicional)',
      'Configurar en sistema de remuneraciones la tasa correspondiente',
      'Marcar como COMPLETO una vez recibido certificado de afiliacion',
    ],
    documents: ['Certificado de Afiliacion Mutual'],
    links: [
      { label: 'ACHS', url: 'achs.cl' },
      { label: 'Mutual de Seguridad', url: 'mutual.cl' },
      { label: 'IST', url: 'ist.cl' },
    ],
  },
  {
    id: 'comite_paritario',
    title: 'Comite Paritario de Higiene y Seguridad',
    description:
      'Obligatorio con 25+ trabajadores. 3 representantes del empleador y 3 de los trabajadores.',
    defaultStatus: 'na',
    legalRef: 'DS 54 — Reglamento para la Constitucion de Comites Paritarios',
    guide: [
      'NOTA: Solo obligatorio cuando la empresa tenga 25+ trabajadores',
      'Cuando corresponda:',
      'Elegir 3 representantes del empleador (designados por la empresa)',
      'Realizar votacion secreta para elegir 3 representantes de los trabajadores',
      'Constituir el comite formalmente con acta',
      'Registrar en la Inspeccion del Trabajo dentro de 15 dias',
      'El comite debe reunirse al menos 1 vez al mes',
      'Llevar libro de actas de reuniones',
      'Marcar como COMPLETO una vez constituido y registrado',
    ],
  },
  {
    id: 'odi',
    title: 'Obligacion de Informar (ODI)',
    description: 'Informar riesgos laborales al trabajador. DS 40 Art. 21. Debe quedar firmado.',
    defaultStatus: 'pendiente',
    legalRef: 'DS 40, Art. 21 — Reglamento sobre Prevencion de Riesgos Profesionales',
    guide: [
      'Identificar los riesgos presentes en el puesto de trabajo de cada empleado',
      'Para trabajo de oficina/remoto: riesgos ergonomicos, fatiga visual, riesgos electricos',
      'Redactar documento ODI con:',
      '  — Descripcion del puesto y actividades',
      '  — Riesgos identificados por actividad',
      '  — Medidas preventivas para cada riesgo',
      '  — Elementos de proteccion personal (si aplica)',
      '  — Metodos de trabajo correcto',
      'El trabajador debe firmar una copia al momento de su contratacion',
      'Guardar copia firmada en carpeta del trabajador',
      'Actualizar el documento ante cambios en el puesto o nuevos riesgos',
      'Marcar como COMPLETO una vez firmado por todos los trabajadores activos',
    ],
    documents: ['Obligacion de Informar (ODI)'],
  },
  {
    id: 'libro_rem_electronico',
    title: 'Libro de Remuneraciones Electronico',
    description: 'Obligatorio via DT desde 2021 para empresas con 5+ trabajadores. Envio mensual.',
    defaultStatus: 'pendiente',
    legalRef: 'Art. 62 bis CT — Ley 21.327 Modernizacion DT',
    guide: [
      'Ingresar a dt.gob.cl con ClaveUnica',
      'Ir a "Libro de Remuneraciones Electronico" (LRE)',
      'Registrar la empresa si es primera vez',
      'Configurar formato de envio (archivo CSV o integracion API)',
      'Enviar mensualmente la informacion de remuneraciones de todos los trabajadores:',
      '  — Haberes imponibles y no imponibles',
      '  — Descuentos legales (AFP, Salud, AFC)',
      '  — Horas extras, bonos, gratificacion',
      '  — Sueldo liquido',
      'Plazo: dentro de los primeros 15 dias del mes siguiente',
      'Puedes usar el modulo "Libro de Remuneraciones" del panel admin para generar el archivo',
      'Marcar como COMPLETO una vez realizado el primer envio exitoso',
    ],
    links: [
      { label: 'DT — LRE', url: 'dt.gob.cl' },
      { label: 'Modulo LRE en Admin', url: '/admin-panel/payroll/libro-rem' },
    ],
  },
  {
    id: 'asistencia_jornada',
    title: 'Asistencia y Control de Jornada',
    description:
      'Art. 33 CT. Registro de asistencia obligatorio (reloj control, libro, sistema electronico).',
    defaultStatus: 'pendiente',
    legalRef: 'Art. 33 Codigo del Trabajo',
    guide: [
      'Elegir sistema de registro: reloj control, libro de asistencia, o sistema electronico',
      'El sistema de Conniku tiene modulo de Asistencia que puede servir como registro electronico',
      'Importante: Los trabajadores excluidos de jornada (Art. 22 inc. 2) no requieren registro',
      '  — Gerentes, administradores, apoderados con facultades de administracion',
      '  — Trabajadores sin fiscalizacion superior inmediata',
      '  — Teletrabajadores (Art. 152 quater J)',
      'Para los demas, registrar diariamente:',
      '  — Hora de entrada',
      '  — Hora de salida',
      '  — Horas extras (con pacto escrito)',
      'Conservar registros por al menos 5 anos',
      'Si usa sistema electronico, debe estar autorizado por la DT',
      'Marcar como COMPLETO una vez implementado el sistema de registro',
    ],
    links: [{ label: 'Modulo Asistencia en Admin', url: '/admin-panel/hr/asistencia' }],
  },
  {
    id: 'certificado_cumplimiento',
    title: 'Certificado de Cumplimiento Laboral',
    description: 'Obtener en dt.gob.cl. Necesario para licitaciones y contratos publicos.',
    defaultStatus: 'pendiente',
    legalRef: 'Art. 183-C Codigo del Trabajo',
    guide: [
      'Ingresar a dt.gob.cl con ClaveUnica',
      'Ir a "Certificados" → "Certificado de Cumplimiento de Obligaciones Laborales y Previsionales"',
      'El sistema verifica automaticamente:',
      '  — Contratos de trabajo registrados',
      '  — Cotizaciones previsionales al dia',
      '  — Remuneraciones pagadas',
      '  — No tener multas pendientes',
      'Si todo esta en orden, se genera automaticamente',
      'Si hay observaciones, corregir y volver a solicitar',
      'El certificado tiene vigencia de 60 dias',
      'Renovar cuando sea necesario para licitaciones',
      'Marcar como COMPLETO cuando se obtenga el primer certificado sin observaciones',
    ],
    links: [{ label: 'DT — Certificados', url: 'dt.gob.cl' }],
  },
  {
    id: 'ley_karin',
    title: 'Ley Karin (Ley 21.643)',
    description:
      'Protocolo de prevencion del acoso laboral, sexual y violencia en el trabajo. Obligatorio desde agosto 2024.',
    defaultStatus: 'pendiente',
    legalRef:
      'Ley 21.643 — Modifica CT en materia de prevencion, investigacion y sancion del acoso laboral, sexual y violencia',
    guide: [
      'Elaborar Protocolo de Prevencion del Acoso Laboral, Sexual y Violencia en el Trabajo',
      'El protocolo debe incluir:',
      '  — Definiciones de acoso laboral, sexual y violencia',
      '  — Medidas de prevencion (capacitaciones, difusion)',
      '  — Canal de denuncia seguro y confidencial',
      '  — Procedimiento de investigacion (plazo: 30 dias)',
      '  — Medidas de resguardo para la victima',
      '  — Sanciones aplicables',
      'Incorporar el protocolo al Reglamento Interno',
      'Capacitar a todos los trabajadores sobre el protocolo',
      'Designar persona encargada de recibir denuncias',
      'Informar a cada trabajador al momento de la contratacion',
      'Dejar constancia firmada de la entrega del protocolo',
      'Marcar como COMPLETO una vez incorporado al Reglamento y socializado con el equipo',
    ],
    documents: ['Protocolo Ley Karin — Prevencion del Acoso'],
  },
  {
    id: 'ley_inclusion',
    title: 'Ley de Inclusion (Ley 21.015)',
    description:
      'Empresas con 100+ trabajadores deben tener al menos 1% personas con discapacidad.',
    defaultStatus: 'na',
    legalRef: 'Ley 21.015 — Incentiva la inclusion de personas con discapacidad al mundo laboral',
    guide: [
      'NOTA: Solo obligatorio cuando la empresa tenga 100+ trabajadores',
      'Cuando corresponda:',
      'Reservar al menos 1% de la dotacion para personas con discapacidad',
      'Alternativa: donaciones a fundaciones o contratos de prestacion de servicios',
      'Registrar cumplimiento en dt.gob.cl',
      'Comunicar anualmente al Ministerio del Trabajo',
      'Marcar como COMPLETO cuando corresponda y se haya implementado',
    ],
  },
];

// ─── Document Generator ─────────────────────────────────────────
const DOC_STYLES = `
  @page { size: letter; margin: 2.5cm 3cm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.8; color: #000; }
  h1 { text-align: center; font-size: 16pt; margin-bottom: 24pt; text-transform: uppercase; letter-spacing: 2px; }
  h2 { font-size: 13pt; margin: 18pt 0 6pt; text-transform: uppercase; }
  p { text-align: justify; margin-bottom: 12pt; }
  .header { text-align: center; margin-bottom: 30pt; font-size: 10pt; color: #555; }
  .section { margin-bottom: 16pt; page-break-inside: avoid; }
  ol { padding-left: 24pt; margin-bottom: 12pt; }
  li { margin-bottom: 6pt; }
  .signatures { margin-top: 60pt; display: flex; justify-content: space-between; }
  .sig-block { text-align: center; width: 40%; }
  .sig-line { border-top: 1px solid #000; margin-top: 60pt; padding-top: 6pt; }
  .note { background: #f5f5f0; padding: 12pt; border-left: 3pt solid #333; margin: 16pt 0; font-size: 11pt; }
  @media print { body { -webkit-print-color-adjust: exact; } }
`;

function generateODI(): string {
  const today = new Date().toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Obligacion de Informar — Conniku SpA</title>
<style>${DOC_STYLES}</style></head><body>
<div class="header">CONNIKU SpA — RUT: 78.395.702-7<br/>Santiago, Chile</div>
<h1>Obligacion de Informar (ODI)</h1>
<p style="text-align:center;font-style:italic;margin-bottom:24pt;">Conforme al Decreto Supremo N° 40, Articulo 21</p>

<div class="section">
<h2>1. Identificacion del Puesto</h2>
<p><strong>Empresa:</strong> Conniku SpA<br/>
<strong>Actividad:</strong> Desarrollo de plataformas tecnologicas y servicios educativos<br/>
<strong>Puesto:</strong> ________________________________________<br/>
<strong>Trabajador:</strong> ________________________________________<br/>
<strong>RUT:</strong> ________________________________________</p>
</div>

<div class="section">
<h2>2. Riesgos Identificados</h2>
<p>De acuerdo a la actividad desarrollada, se identifican los siguientes riesgos:</p>
<ol>
<li><strong>Riesgo Ergonomico:</strong> Postura inadecuada frente al computador, movimientos repetitivos de manos y munecas, uso prolongado de pantalla.</li>
<li><strong>Fatiga Visual:</strong> Exposicion prolongada a pantallas de computador.</li>
<li><strong>Riesgo Electrico:</strong> Uso de equipos electricos y electronicos (computador, cargadores, etc.).</li>
<li><strong>Estres Laboral:</strong> Carga mental asociada al trabajo con plazos y objetivos.</li>
<li><strong>Riesgos de Teletrabajo:</strong> Aislamiento, difuminacion de limites trabajo/vida personal, condiciones del espacio de trabajo en el hogar.</li>
</ol>
</div>

<div class="section">
<h2>3. Medidas Preventivas</h2>
<ol>
<li>Mantener postura ergonomica: espalda apoyada, pies en el suelo, pantalla a la altura de los ojos.</li>
<li>Realizar pausas activas cada 2 horas de trabajo frente al computador (5-10 minutos).</li>
<li>Aplicar la regla 20-20-20: cada 20 minutos, mirar a 20 pies (6m) de distancia por 20 segundos.</li>
<li>No manipular equipos electricos con las manos mojadas.</li>
<li>Informar inmediatamente al empleador cualquier condicion insegura detectada.</li>
<li>En teletrabajo: disponer de un espacio adecuado, con iluminacion natural y ventilacion.</li>
<li>Respetar los horarios de desconexion digital (Art. 152 quater J CT).</li>
</ol>
</div>

<div class="section">
<h2>4. Elementos de Proteccion Personal</h2>
<p>Dado que la actividad principal es de tipo administrativa/tecnologica, no se requieren EPP especificos. Sin embargo, la empresa proporcionara:</p>
<ol>
<li>Soporte ergonomico para laptop (si trabaja con portatil)</li>
<li>Silla ergonomica adecuada (o aporte para su adquisicion en caso de teletrabajo)</li>
</ol>
</div>

<div class="note">
<strong>IMPORTANTE:</strong> El trabajador declara haber sido informado de los riesgos inherentes a su puesto de trabajo, las medidas preventivas y los metodos de trabajo correcto, conforme al DS 40, Art. 21.
</div>

<div class="signatures">
<div class="sig-block">
<div class="sig-line">EMPLEADOR<br/>Conniku SpA<br/>RUT: 78.395.702-7</div>
</div>
<div class="sig-block">
<div class="sig-line">TRABAJADOR<br/>Nombre: ________________<br/>RUT: ________________</div>
</div>
</div>

<p style="text-align:center;margin-top:40pt;font-size:10pt;color:#666;">Santiago, ${today}</p>
</body></html>`;
}

function generateLeyKarinProtocol(): string {
  const today = new Date().toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Protocolo Ley Karin — Conniku SpA</title>
<style>${DOC_STYLES}</style></head><body>
<div class="header">CONNIKU SpA — RUT: 78.395.702-7<br/>Santiago, Chile</div>
<h1>Protocolo de Prevencion del Acoso Laboral, Sexual y Violencia en el Trabajo</h1>
<p style="text-align:center;font-style:italic;margin-bottom:24pt;">Conforme a la Ley 21.643 (Ley Karin)</p>

<div class="section">
<h2>1. Objetivo</h2>
<p>El presente protocolo tiene por objeto establecer medidas de prevencion, los procedimientos de investigacion y sancion del acoso laboral, sexual y la violencia en el trabajo al interior de Conniku SpA, en cumplimiento de la Ley 21.643.</p>
</div>

<div class="section">
<h2>2. Definiciones</h2>
<p><strong>Acoso Laboral:</strong> Toda conducta que constituya agresion u hostigamiento ejercida por el empleador o por uno o mas trabajadores, en contra de otro u otros trabajadores, por cualquier medio, y que tenga como resultado para el o los afectados su menoscabo, maltrato o humillacion, o bien que amenace o perjudique su situacion laboral o sus oportunidades en el empleo (Art. 2 CT).</p>
<p><strong>Acoso Sexual:</strong> El que una persona realice, en forma indebida, por cualquier medio, requerimientos de caracter sexual, no consentidos por quien los recibe y que amenacen o perjudiquen su situacion laboral o sus oportunidades en el empleo (Art. 2 CT).</p>
<p><strong>Violencia en el Trabajo:</strong> Toda conducta ejercida por terceros ajenos a la relacion laboral, como clientes, proveedores u otros, que afecten a las y los trabajadores durante la prestacion de servicios.</p>
</div>

<div class="section">
<h2>3. Medidas de Prevencion</h2>
<ol>
<li>Capacitacion anual a todos los trabajadores sobre este protocolo.</li>
<li>Difusion permanente a traves de canales internos de comunicacion.</li>
<li>Entrega de copia a cada trabajador al momento de la contratacion.</li>
<li>Promocion de un ambiente de respeto mutuo y dignidad.</li>
<li>Evaluacion periodica del ambiente laboral.</li>
</ol>
</div>

<div class="section">
<h2>4. Canal de Denuncia</h2>
<p>Toda denuncia debera realizarse a traves de:</p>
<ol>
<li><strong>Correo electronico:</strong> ceo@conniku.com (confidencial)</li>
<li><strong>Escrito:</strong> Carta dirigida al representante legal en sobre cerrado marcado "CONFIDENCIAL"</li>
<li><strong>Verbal:</strong> Solicitar reunion privada con el CEO</li>
</ol>
<p>Toda denuncia sera tratada con estricta confidencialidad y no podra significar represalia alguna contra el denunciante.</p>
</div>

<div class="section">
<h2>5. Procedimiento de Investigacion</h2>
<ol>
<li>Recibida la denuncia, se designara un investigador dentro de los 3 dias siguientes.</li>
<li>Se adoptaran medidas de resguardo inmediatas (separacion de espacios, modificacion de jornada, etc.).</li>
<li>La investigacion tendra un plazo maximo de 30 dias corridos.</li>
<li>Se entrevistara al denunciante, al denunciado y a testigos.</li>
<li>Se emitira informe con conclusiones y propuestas de sancion.</li>
<li>La empresa debera aplicar las medidas dentro de 15 dias de recibido el informe.</li>
</ol>
</div>

<div class="section">
<h2>6. Sanciones</h2>
<p>Dependiendo de la gravedad, podran aplicarse:</p>
<ol>
<li>Amonestacion verbal</li>
<li>Amonestacion escrita con copia a la Inspeccion del Trabajo</li>
<li>Multa de hasta 25% de la remuneracion diaria</li>
<li>Desvinculacion por causal Art. 160 N°1 del Codigo del Trabajo</li>
</ol>
</div>

<div class="section">
<h2>7. Medidas de Resguardo</h2>
<p>La empresa garantiza que el trabajador denunciante:</p>
<ol>
<li>No sufrira represalias por realizar la denuncia.</li>
<li>Podra solicitar separacion inmediata del presunto agresor.</li>
<li>Tendra acceso a apoyo psicologico si lo requiere.</li>
<li>Su denuncia sera tramitada con absoluta reserva.</li>
</ol>
</div>

<div class="note">
<strong>VIGENCIA:</strong> Este protocolo entra en vigencia a la fecha de su publicacion y forma parte integrante del Reglamento Interno de Orden, Higiene y Seguridad de Conniku SpA.
</div>

<div class="signatures">
<div class="sig-block">
<div class="sig-line">EMPLEADOR<br/>Conniku SpA<br/>RUT: 78.395.702-7</div>
</div>
<div class="sig-block">
<div class="sig-line">TRABAJADOR<br/>Nombre: ________________<br/>RUT: ________________<br/><em>Recibe copia</em></div>
</div>
</div>

<p style="text-align:center;margin-top:40pt;font-size:10pt;color:#666;">Santiago, ${today}</p>
</body></html>`;
}

function generateReglamentoInterno(): string {
  const today = new Date().toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Reglamento Interno — Conniku SpA</title>
<style>${DOC_STYLES} h3 { font-size: 12pt; margin: 12pt 0 6pt; }</style></head><body>
<div class="header">CONNIKU SpA — RUT: 78.395.702-7<br/>Santiago, Chile</div>
<h1>Reglamento Interno de Orden, Higiene y Seguridad</h1>
<p style="text-align:center;font-style:italic;margin-bottom:24pt;">Conforme a los Articulos 153 a 157 del Codigo del Trabajo</p>

<div class="section">
<h2>Titulo I — Disposiciones Generales</h2>
<p><strong>Articulo 1°:</strong> El presente Reglamento Interno regula las condiciones, requisitos, derechos, beneficios, obligaciones, prohibiciones y, en general, las formas y condiciones de trabajo, higiene y seguridad de todos los trabajadores de Conniku SpA.</p>
<p><strong>Articulo 2°:</strong> Este reglamento es obligatorio para todos los trabajadores de la empresa, sin excepcion, desde el momento de su contratacion.</p>
</div>

<div class="section">
<h2>Titulo II — Condiciones de Ingreso</h2>
<p><strong>Articulo 3°:</strong> Todo trabajador que ingrese a la empresa debera presentar los siguientes documentos: cedula de identidad, certificado de antecedentes, certificado de AFP e Isapre/Fonasa, curriculum vitae y certificados de estudio cuando corresponda.</p>
<p><strong>Articulo 4°:</strong> La empresa podra verificar la autenticidad de los documentos presentados.</p>
</div>

<div class="section">
<h2>Titulo III — Jornada de Trabajo</h2>
<p><strong>Articulo 5°:</strong> La jornada ordinaria de trabajo sera de 42 horas semanales (Art. 22 CT mod. Ley 21.561, vigente desde el 26/04/2026), distribuidas de lunes a viernes.</p>
<p><strong>Articulo 6°:</strong> Los trabajadores deberan registrar su asistencia conforme al sistema establecido (Art. 33 CT).</p>
<p><strong>Articulo 7°:</strong> Las horas extraordinarias solo podran pactarse en situaciones temporales y se pagaran con un recargo del 50% sobre la hora ordinaria (Art. 32 CT).</p>
</div>

<div class="section">
<h2>Titulo IV — Obligaciones de los Trabajadores</h2>
<p><strong>Articulo 8°:</strong> Son obligaciones del trabajador:</p>
<ol>
<li>Cumplir el contrato de trabajo y el presente reglamento.</li>
<li>Realizar el trabajo con el debido cuidado y diligencia.</li>
<li>Guardar la debida lealtad y confidencialidad respecto de la informacion de la empresa.</li>
<li>Mantener el orden y aseo en su lugar de trabajo.</li>
<li>Dar aviso oportuno de las ausencias y atrasos.</li>
<li>Cumplir las normas de higiene y seguridad.</li>
</ol>
</div>

<div class="section">
<h2>Titulo V — Prohibiciones</h2>
<p><strong>Articulo 9°:</strong> Queda prohibido a los trabajadores:</p>
<ol>
<li>Presentarse al trabajo bajo la influencia del alcohol o drogas.</li>
<li>Revelar informacion confidencial de la empresa, clientes o companeros.</li>
<li>Utilizar recursos de la empresa para fines personales sin autorizacion.</li>
<li>Ejercer cualquier forma de acoso laboral, sexual o violencia.</li>
<li>Faltar al trabajo sin justificacion legal.</li>
</ol>
</div>

<div class="section">
<h2>Titulo VI — Sanciones</h2>
<p><strong>Articulo 10°:</strong> Las infracciones se sancionaran segun su gravedad:</p>
<ol>
<li>Amonestacion verbal (primer incumplimiento leve).</li>
<li>Amonestacion escrita con copia a la Inspeccion del Trabajo.</li>
<li>Multa de hasta el 25% de la remuneracion diaria del infractor.</li>
<li>Desvinculacion conforme a las causales del Art. 160 del CT.</li>
</ol>
</div>

<div class="section">
<h2>Titulo VII — Normas de Higiene y Seguridad</h2>
<p><strong>Articulo 11°:</strong> La empresa mantendra condiciones adecuadas de higiene y seguridad en el trabajo conforme a la Ley 16.744 y el DS 594.</p>
<p><strong>Articulo 12°:</strong> Todo accidente del trabajo, por leve que sea, debe ser informado inmediatamente al empleador.</p>
</div>

<div class="section">
<h2>Titulo VIII — Protocolo Ley Karin</h2>
<p><strong>Articulo 13°:</strong> Conforme a la Ley 21.643, la empresa cuenta con un Protocolo de Prevencion del Acoso Laboral, Sexual y Violencia en el Trabajo, el cual forma parte integrante de este reglamento.</p>
</div>

<div class="note">
<strong>VIGENCIA:</strong> El presente reglamento entrara en vigencia 30 dias despues de su entrega a los trabajadores y su registro en la Direccion del Trabajo e Inspeccion del Trabajo.
</div>

<p style="text-align:center;margin-top:40pt;font-size:10pt;color:#666;">Santiago, ${today}</p>
</body></html>`;
}

// ─── Main Component ─────────────────────────────────────────────
export default function LegalTab() {
  const [statuses, setStatuses] = useState<Record<string, StatusRecord>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');

  useEffect(() => {
    api
      .getLegalObligations()
      .then((res: any) => {
        const mapped: Record<string, StatusRecord> = {};
        if (res.statuses) {
          for (const [id, data] of Object.entries(res.statuses) as any) {
            mapped[id] = {
              status: data.status as ObligationStatus,
              notes: data.notes,
              completedAt: data.completed_at,
            };
          }
        }
        setStatuses(mapped);
      })
      .catch(console.error);
  }, []);

  const saveToBackend = async (newStatuses: Record<string, StatusRecord>) => {
    try {
      const payload = Object.entries(newStatuses).map(([id, st]) => ({
        id,
        status: st.status,
        notes: st.notes,
        completed_at: st.completedAt,
      }));
      await api.saveLegalObligations(payload);
    } catch (e) {
      console.error(e);
    }
  };

  const getStatus = (ob: Obligation): ObligationStatus => {
    return statuses[ob.id]?.status ?? ob.defaultStatus;
  };

  const setObStatus = (id: string, status: ObligationStatus) => {
    setStatuses((prev) => {
      const next = {
        ...prev,
        [id]: {
          ...prev[id],
          status,
          completedAt: status === 'completo' ? new Date().toISOString() : undefined,
        },
      };
      saveToBackend(next);
      return next;
    });
  };

  const setNote = (id: string, notes: string) => {
    setStatuses((prev) => {
      const next = {
        ...prev,
        [id]: { ...prev[id], status: prev[id]?.status ?? 'pendiente', notes },
      };
      saveToBackend(next);
      return next;
    });
  };

  const openDoc = (html: string) => {
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 500);
    }
  };

  // Stats
  const total = OBLIGATIONS.length;
  const completos = OBLIGATIONS.filter((o) => getStatus(o) === 'completo').length;
  const pendientes = OBLIGATIONS.filter((o) => getStatus(o) === 'pendiente').length;
  const naCount = OBLIGATIONS.filter((o) => getStatus(o) === 'na').length;

  const statusColor = (s: ObligationStatus) =>
    s === 'completo' ? '#22c55e' : s === 'na' ? 'var(--text-muted)' : '#f59e0b';
  const statusBg = (s: ObligationStatus) =>
    s === 'completo'
      ? 'rgba(34,197,94,0.12)'
      : s === 'na'
        ? 'rgba(150,150,150,0.1)'
        : 'rgba(245,158,11,0.12)';
  const statusLabel = (s: ObligationStatus) =>
    s === 'completo' ? 'COMPLETO' : s === 'na' ? 'N/A' : 'PENDIENTE';
  const StatusIcon = ({ s }: { s: ObligationStatus }) =>
    s === 'completo' ? (
      <CheckCircle size={18} style={{ color: '#22c55e' }} />
    ) : s === 'na' ? (
      <Minus size={18} style={{ color: 'var(--text-muted)' }} />
    ) : (
      <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
    );

  return (
    <div>
      {/* Header */}
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
          Checklist de obligaciones legales como empleador. Click en cada obligacion para ver la
          guia paso a paso.
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          { label: 'Total', value: total, color: 'var(--accent)' },
          { label: 'Completos', value: completos, color: '#22c55e' },
          { label: 'Pendientes', value: pendientes, color: '#f59e0b' },
          { label: 'N/A', value: naCount, color: 'var(--text-muted)' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* How to use guide */}
      <div
        className="card"
        style={{
          padding: 16,
          marginBottom: 20,
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Info size={16} style={{ color: 'var(--accent)' }} />
          <strong style={{ fontSize: 14 }}>Como cambiar de PENDIENTE a COMPLETO</strong>
        </div>
        <ol
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            lineHeight: 2,
            paddingLeft: 20,
            margin: 0,
          }}
        >
          <li>Haz click en una obligacion para expandir los detalles</li>
          <li>
            Lee la <strong>guia paso a paso</strong> y completa cada paso en la vida real
          </li>
          <li>
            Si hay documentos disponibles, haz click en <strong>"Generar Documento"</strong> para
            imprimir/PDF
          </li>
          <li>
            Una vez completados todos los pasos, haz click en el boton{' '}
            <strong>"Marcar como Completo"</strong>
          </li>
          <li>Opcionalmente agrega notas (ej: numero de registro, fecha de tramite, etc.)</li>
        </ol>
      </div>

      {/* Obligations List */}
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
          <FileText size={18} /> Obligaciones como Empleador
        </h3>

        {OBLIGATIONS.map((ob) => {
          const st = getStatus(ob);
          const isExpanded = expandedId === ob.id;
          const record = statuses[ob.id];

          return (
            <div
              key={ob.id}
              style={{ borderBottom: '1px solid var(--border)', marginBottom: isExpanded ? 16 : 0 }}
            >
              {/* Header row */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : ob.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '14px 0',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ marginTop: 2, flexShrink: 0 }}>
                  {isExpanded ? (
                    <ChevronDown size={16} style={{ color: 'var(--accent)' }} />
                  ) : (
                    <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>
                <StatusIcon s={st} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{ob.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {ob.description}
                  </div>
                  {record?.completedAt && st === 'completo' && (
                    <div
                      style={{
                        fontSize: 11,
                        color: '#22c55e',
                        marginTop: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Clock size={11} /> Completado el{' '}
                      {new Date(record.completedAt).toLocaleDateString('es-CL')}
                    </div>
                  )}
                  {record?.notes && (
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-secondary)',
                        marginTop: 2,
                        fontStyle: 'italic',
                      }}
                    >
                      Nota: {record.notes}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: 12,
                    fontSize: 10,
                    fontWeight: 700,
                    flexShrink: 0,
                    background: statusBg(st),
                    color: statusColor(st),
                  }}
                >
                  {statusLabel(st)}
                </span>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{ padding: '0 0 16px 40px' }}>
                  {ob.legalRef && (
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--accent)',
                        marginBottom: 12,
                        fontStyle: 'italic',
                      }}
                    >
                      Ref: {ob.legalRef}
                    </div>
                  )}

                  {/* Step-by-step guide */}
                  <div
                    style={{
                      background: 'var(--bg-tertiary)',
                      borderRadius: 10,
                      padding: 16,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        marginBottom: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <FileText size={14} /> Guia paso a paso
                    </div>
                    <ol
                      style={{
                        paddingLeft: 20,
                        margin: 0,
                        fontSize: 13,
                        lineHeight: 2,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {ob.guide.map((step, i) => (
                        <li
                          key={i}
                          style={{
                            paddingLeft: step.startsWith('  —') ? 16 : 0,
                            listStyleType: step.startsWith('  —') ? 'none' : undefined,
                          }}
                        >
                          {step.startsWith('  —') ? step : step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Documents */}
                  {ob.documents && ob.documents.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 12,
                          marginBottom: 8,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Documentos
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {ob.id === 'odi' && (
                          <button
                            onClick={() => openDoc(generateODI())}
                            style={{
                              padding: '8px 14px',
                              borderRadius: 8,
                              border: '1px solid var(--border)',
                              background: 'var(--bg-secondary)',
                              color: 'var(--text-primary)',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <Download size={13} /> Generar ODI
                          </button>
                        )}
                        {ob.id === 'ley_karin' && (
                          <button
                            onClick={() => openDoc(generateLeyKarinProtocol())}
                            style={{
                              padding: '8px 14px',
                              borderRadius: 8,
                              border: '1px solid var(--border)',
                              background: 'var(--bg-secondary)',
                              color: 'var(--text-primary)',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <Download size={13} /> Generar Protocolo Ley Karin
                          </button>
                        )}
                        {ob.id === 'reglamento_interno' && (
                          <button
                            onClick={() => openDoc(generateReglamentoInterno())}
                            style={{
                              padding: '8px 14px',
                              borderRadius: 8,
                              border: '1px solid var(--border)',
                              background: 'var(--bg-secondary)',
                              color: 'var(--text-primary)',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <Download size={13} /> Generar Reglamento Interno
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Links */}
                  {ob.links && ob.links.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 12,
                          marginBottom: 8,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Enlaces
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {ob.links.map((link, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '6px 12px',
                              background: 'var(--bg-tertiary)',
                              borderRadius: 8,
                              fontSize: 12,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <Globe size={12} style={{ color: 'var(--accent)' }} />
                            <span>{link.label}</span>
                            <span style={{ color: 'var(--accent)', fontSize: 11 }}>{link.url}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div style={{ marginBottom: 12 }}>
                    <input
                      type="text"
                      placeholder="Agregar nota (ej: N° registro, fecha tramite...)"
                      value={record?.notes ?? noteInput}
                      onChange={(e) => {
                        if (record) setNote(ob.id, e.target.value);
                        else setNoteInput(e.target.value);
                      }}
                      onBlur={() => {
                        if (!record && noteInput) {
                          setNote(ob.id, noteInput);
                          setNoteInput('');
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: 12,
                      }}
                    />
                  </div>

                  {/* Status buttons */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {st !== 'completo' && (
                      <button
                        onClick={() => setObStatus(ob.id, 'completo')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          border: 'none',
                          background: '#22c55e',
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <CheckCircle size={14} /> Marcar como Completo
                      </button>
                    )}
                    {st === 'completo' && (
                      <button
                        onClick={() => setObStatus(ob.id, 'pendiente')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <X size={14} /> Revertir a Pendiente
                      </button>
                    )}
                    {st !== 'na' && ob.defaultStatus !== 'na' && (
                      <button
                        onClick={() => setObStatus(ob.id, 'na')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-muted)',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Marcar N/A
                      </button>
                    )}
                    {st === 'na' && ob.defaultStatus !== 'na' && (
                      <button
                        onClick={() => setObStatus(ob.id, 'pendiente')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--bg-secondary)',
                          color: '#f59e0b',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Revertir a Pendiente
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
              <strong>inapi.cl</strong> → Busqueda de Marcas.
            </li>
            <li>
              <strong>Definir clases Niza:</strong> Clase 9 (Software), Clase 41 (Educacion), Clase
              42 (SaaS)
            </li>
            <li>
              <strong>Presentar solicitud:</strong> Portal online INAPI con RUT empresa y logo
            </li>
            <li>
              <strong>Pago:</strong> ~1 UTM por clase (~$66,000 CLP)
            </li>
            <li>
              <strong>Publicacion:</strong> 30 dias en Diario Oficial para oposiciones
            </li>
            <li>
              <strong>Resolucion:</strong> 4-8 meses. Registro por 10 anos (renovable)
            </li>
          </ol>
          <div
            style={{
              marginTop: 12,
              padding: 12,
              background: 'var(--bg-tertiary)',
              borderRadius: 8,
            }}
          >
            <strong>Costo estimado:</strong> ~3 UTM (~$198,000 CLP) por Clases 9, 41 y 42.
          </div>
        </div>
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
