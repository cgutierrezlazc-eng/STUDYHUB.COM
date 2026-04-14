import React, { useState, useEffect } from 'react';
import { Employee } from '../shared/types';
import { CHILE_LABOR } from '../shared/ChileLaborConstants';
import { COMPANY } from '../shared/constants';
import { btnPrimary, btnSecondary, btnSmall, fmt } from '../shared/styles';
import {
  Shield,
  FileText,
  Globe,
  AlertTriangle,
  Download,
  CheckCircle,
  UserPlus,
} from 'lucide-react';
import { api } from '../../services/api';

// ─── Document generation helpers ───
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
<div class="header-info">CONNIKU SpA<br/>RUT: ${COMPANY.rut}<br/>${COMPANY.cityHeader}</div>
<h1>Finiquito de Contrato de Trabajo</h1>
<p class="legal-ref" style="text-align: center; margin-bottom: 24pt;">Conforme al Articulo 177 del Codigo del Trabajo</p>

<div class="clause">
<h2>PRIMERO: Partes</h2>
<p>En ${COMPANY.city}, a ${dateStr}, entre <strong>CONNIKU SpA</strong>, RUT ${COMPANY.rut}, representada legalmente para estos efectos, en adelante "el Empleador"; y don(a) <strong>${emp.firstName} ${emp.lastName}</strong>, RUT ${emp.rut}, de nacionalidad ${emp.nationality}, domiciliado(a) en ${emp.address}, en adelante "el Trabajador", se celebra el presente finiquito de contrato de trabajo.</p>
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
      RUT: ${COMPANY.rut}
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
<div class="header-info">CONNIKU SpA<br/>RUT: ${COMPANY.rut}<br/>${COMPANY.cityHeader}</div>

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
    RUT: ${COMPANY.rut}
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
<div class="header-info">CONNIKU SpA<br/>RUT: ${COMPANY.rut}<br/>${COMPANY.cityHeader}</div>
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
<p>Por medio del presente, <strong>CONNIKU SpA</strong>, RUT ${COMPANY.rut}, certifica que don(a) <strong>${emp.firstName} ${emp.lastName}</strong>, RUT ${emp.rut}, presta servicios para esta empresa desde el <strong>${hireDateStr}</strong>, desempenandose actualmente como <strong>${emp.position}</strong> en el departamento de <strong>${emp.department}</strong>.</p>
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
<p>Por medio del presente, <strong>CONNIKU SpA</strong>, RUT ${COMPANY.rut}, certifica que don(a) <strong>${emp.firstName} ${emp.lastName}</strong>, RUT ${emp.rut}, presta servicios para esta empresa como <strong>${emp.position}</strong> y ha percibido las siguientes remuneraciones en los ultimos tres meses:</p>
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
<p>Por medio del presente, <strong>CONNIKU SpA</strong>, RUT ${COMPANY.rut}, deja constancia del registro de feriado anual (vacaciones) de don(a) <strong>${emp.firstName} ${emp.lastName}</strong>, RUT ${emp.rut}, quien presta servicios desde el <strong>${hireDateStr}</strong>.</p>

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
<div class="header-info">CONNIKU SpA<br/>RUT: ${COMPANY.rut}<br/>${COMPANY.cityHeader}</div>
<h1>${titulo}</h1>

<p style="text-align: right;">Santiago, ${dateStr}</p>

${contenido}

<div style="margin-top: 80pt; width: 40%;">
  <div class="sig-line">
    <strong>CONNIKU SpA</strong><br/>
    Representante Legal<br/>
    RUT: ${COMPANY.rut}
  </div>
</div>
</body></html>`;
}

// ─── Main Component ───
export default function InspeccionTrabajoTab() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api
      .getEmployees()
      .then((data: any) => setEmployees(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);
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

      {/* Documentos Generables */}
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

        {/* Certificado Antiguedad */}
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

      {/* Links Directos */}
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

      {/* Ley Karin */}
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

      {/* Multas de referencia */}
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
