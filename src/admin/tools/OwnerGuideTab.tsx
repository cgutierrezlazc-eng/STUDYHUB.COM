import React from 'react'
import { Star, Check } from 'lucide-react'

export default function OwnerGuideTab() {
  return (
    <div>
      <div className="card" style={{ padding: 20, marginBottom: 20, background: 'linear-gradient(135deg, #1a2332, #c8872d)', color: '#fff', borderRadius: 16 }}>
        <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Star size={20} /> Guia para el Owner — Conniku SpA
        </h3>
        <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>
          Recomendaciones legales y tributarias para tu situacion como dueno-fundador de una SpA en Chile.
        </p>
      </div>

      {/* Compensation modalities */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Modalidades de Sueldo del Owner</h3>

        <div style={{ display: 'grid', gap: 16 }}>
          {/* Option 1 */}
          <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12, borderLeft: '4px solid #22c55e' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ padding: '3px 10px', borderRadius: 12, background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: 11, fontWeight: 700 }}>RECOMENDADA</span>
              <h4 style={{ margin: 0, fontSize: 15 }}>Opcion 1: Sueldo como Trabajador Dependiente</h4>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
              <p><strong>Como funciona:</strong> Te contratas a ti mismo como trabajador de tu SpA con contrato de trabajo y liquidacion de sueldo.</p>
              <p><strong>Ventajas:</strong></p>
              <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                <li>Cotizas AFP, salud y AFC (acceso a prestaciones sociales completas)</li>
                <li>El sueldo es gasto deducible para la empresa (reduce base imponible)</li>
                <li>Acceso a licencias medicas y seguro de cesantia</li>
                <li>Genera antiguedad laboral y ahorro previsional</li>
                <li>Compatible con retiros de utilidades adicionales</li>
              </ul>
              <p><strong>Desventajas:</strong></p>
              <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                <li>Mayor carga de cotizaciones (~20% del sueldo entre empleado y empleador)</li>
                <li>Impuesto Unico de 2da Categoria sobre el sueldo</li>
                <li>Costo empresa adicional (SIS, mutual, AFC empleador)</li>
              </ul>
              <div style={{ marginTop: 8, padding: 10, background: 'rgba(34,197,94,0.1)', borderRadius: 8 }}>
                <strong>Ejemplo con sueldo bruto $1,500,000:</strong><br />
                AFP Modelo: -$158,700 | Fonasa: -$105,000 | AFC: -$9,000 | Impuesto: ~$0<br />
                <strong>Liquido estimado: ~$1,227,300</strong><br />
                Costo empresa adicional: ~$73,000 (SIS + AFC emp + Mutual)
              </div>
            </div>
          </div>

          {/* Option 2 */}
          <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12, borderLeft: '4px solid #3b82f6' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 15 }}>Opcion 2: Boleta de Honorarios</h4>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
              <p><strong>Como funciona:</strong> Emites boleta de honorarios a tu propia SpA como trabajador independiente.</p>
              <p><strong>Ventajas:</strong></p>
              <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                <li>Retencion de 13.75% (2025) como PPM (puede recuperarse en renta anual)</li>
                <li>Menor carga administrativa mensual</li>
                <li>Flexibility en montos y frecuencia</li>
              </ul>
              <p><strong>Desventajas:</strong></p>
              <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                <li>Debes cotizar como independiente en la declaracion anual (Ley 21.133)</li>
                <li>Menor proteccion social (sin seguro de cesantia, licencias limitadas)</li>
                <li>El SII puede objetar si es tu unica fuente de ingreso (relacion laboral encubierta)</li>
              </ul>
            </div>
          </div>

          {/* Option 3 */}
          <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12, borderLeft: '4px solid #8b5cf6' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 15 }}>Opcion 3: Retiro de Utilidades</h4>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
              <p><strong>Como funciona:</strong> La empresa genera utilidades y las retiras como dividendos/retiros.</p>
              <p><strong>Ventajas:</strong></p>
              <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                <li>No pagas cotizaciones previsionales sobre retiros</li>
                <li>Puedes diferir los retiros (dejar utilidades en la empresa)</li>
                <li>Impuesto pagado por la empresa (25%) se usa como credito</li>
              </ul>
              <p><strong>Desventajas:</strong></p>
              <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                <li>Sin proteccion social (AFP, salud, cesantia) si no cotizas por otro medio</li>
                <li>Tributa con Impuesto Global Complementario (hasta 40%)</li>
                <li>No aplica si la empresa no tiene utilidades</li>
              </ul>
            </div>
          </div>

          {/* Recommendation */}
          <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12, border: '2px solid var(--accent)' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 15, color: 'var(--accent)' }}>Recomendacion para tu caso (Conniku SpA, etapa early-stage):</h4>
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>
              <p><strong>Estrategia mixta recomendada:</strong></p>
              <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
                <li><strong>Sueldo base como dependiente:</strong> Fijate un sueldo minimo razonable ($500,000 - $1,000,000 CLP) para cubrir cotizaciones y tener proteccion social.</li>
                <li><strong>Complementar con retiros de utilidades:</strong> Cuando la empresa genere ganancias, puedes retirar utilidades adicionales.</li>
                <li><strong>Nunca dejes de cotizar:</strong> Aunque sea el minimo, cotiza AFP y salud para no perder cobertura previsional.</li>
                <li><strong>Consulta un contador:</strong> Un contador puede optimizar la estructura tributaria segun los ingresos reales de Conniku.</li>
              </ol>
              <p style={{ marginTop: 8, padding: 8, background: 'rgba(45,98,200,0.1)', borderRadius: 8 }}>
                <strong>Dato clave:</strong> En una SpA, el sueldo del socio-trabajador es gasto deducible, lo que reduce la base imponible de la empresa. Si tu sueldo + gastos superan los ingresos, la empresa queda con perdida tributaria (arrastrable a anos futuros).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Business Creation Checklist */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Checklist de Creacion de Empresa en Chile</h3>
        {[
          { step: 1, title: 'Constitucion de la SpA', description: 'En tuempresaenundia.cl o con abogado. Escritura publica con estatutos, capital, administracion.', status: 'done' },
          { step: 2, title: 'Inscripcion en el Registro de Comercio', description: 'Conservador de Bienes Raices. Extracto publicado en el Diario Oficial.', status: 'done' },
          { step: 3, title: 'Obtener RUT de la empresa', description: 'Se obtiene automaticamente con la constitucion o en el SII.', status: 'done' },
          { step: 4, title: 'Inicio de Actividades en SII', description: 'sii.cl → Inicio de Actividades. Codigos de actividad economica: 620200 (desarrollo software), 855900 (educacion).', status: 'done' },
          { step: 5, title: 'Timbraje de documentos / DTE', description: 'Activar facturacion electronica en sii.cl. Emision de boletas y facturas.', status: 'pending' },
          { step: 6, title: 'Cuenta bancaria empresa', description: 'Abrir cuenta corriente a nombre de la SpA. Requiere: RUT, carpeta tributaria, escritura.', status: 'pending' },
          { step: 7, title: 'Registro de marca INAPI', description: 'Registrar "Conniku" en clases 9, 41, 42. Ver guia en pestana Legal.', status: 'pending' },
          { step: 8, title: 'Registro como empleador', description: 'dt.gob.cl para inscripcion laboral. Necesario antes de contratar.', status: 'pending' },
          { step: 9, title: 'Afiliacion a Mutual de Seguridad', description: 'ACHS, Mutual de Seguridad o IST. Obligatorio para accidentes laborales.', status: 'pending' },
          { step: 10, title: 'Politica de Privacidad y ToS', description: 'Documentos legales para la plataforma. Cumplimiento Ley 19.628.', status: 'done' },
          { step: 11, title: 'Contratar Contador', description: 'Para declaraciones mensuales (F29) y anuales (F22). Costo estimado: $50,000-$150,000/mes.', status: 'pending' },
          { step: 12, title: 'Patente Municipal', description: 'Patente comercial en la municipalidad donde opera la empresa. Costo: 0.25-0.5% del capital.', status: 'pending' },
        ].map(item => (
          <div key={item.step} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: item.status === 'done' ? '#22c55e' : 'var(--bg-tertiary)',
              color: item.status === 'done' ? '#fff' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
            }}>
              {item.status === 'done' ? <Check size={14} /> : item.step}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.description}</div>
            </div>
            <span style={{
              padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600,
              background: item.status === 'done' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
              color: item.status === 'done' ? '#22c55e' : '#f59e0b',
            }}>
              {item.status === 'done' ? 'LISTO' : 'PENDIENTE'}
            </span>
          </div>
        ))}
      </div>

      {/* Key Advice */}
      <div className="card" style={{ padding: 20, borderLeft: '4px solid #22c55e' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Consejos Clave para tu Etapa</h3>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 2 }}>
          <p><strong>1. Formaliza todo:</strong> Aunque seas el unico, ten contrato de trabajo, liquidaciones y cotizaciones al dia. Te protege legalmente y genera historial.</p>
          <p><strong>2. Separa finanzas:</strong> Nunca mezcles gastos personales con los de la empresa. Ten una cuenta bancaria exclusiva para Conniku SpA.</p>
          <p><strong>3. Documenta gastos:</strong> Guarda TODAS las facturas. El IVA credito fiscal es dinero que recuperas. Un computador de $1M tiene $190,000 de IVA recuperable.</p>
          <p><strong>4. Aprovecha la depreciacion:</strong> En regimen Pro Pyme, los activos fijos se deprecian al 100% el primer ano (depreciacion instantanea). Compra equipos y registralos como activo.</p>
          <p><strong>5. PPM minimo:</strong> El Pago Provisional Mensual es solo 0.25% de ventas en Pro Pyme. Si no hay ventas, no hay PPM.</p>
          <p><strong>6. Perdidas tributarias:</strong> Si gastas mas de lo que ingresas, la perdida se arrastra y reduce impuestos futuros cuando haya utilidades.</p>
          <p><strong>7. Primer empleado:</strong> Cuando contrates, la Ley Bustos (Art. 162 CT) te obliga a tener TODAS las cotizaciones al dia para poder despedir validamente.</p>
          <p><strong>8. Registro de marca:</strong> Hazlo lo antes posible. Si alguien registra "Conniku" antes, perderas el nombre. Cuesta ~$200,000 CLP y toma 4-8 meses.</p>
        </div>
      </div>
    </div>
  )
}
