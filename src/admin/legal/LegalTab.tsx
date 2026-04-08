import React from 'react'
import {
  Shield, Star, Globe, CheckCircle, AlertTriangle, Minus
} from 'lucide-react'

export default function LegalTab() {
  return (
    <div>
      <div className="card" style={{ padding: 20, marginBottom: 20, background: 'linear-gradient(135deg, #1a2332, #2d62c8)', color: '#fff', borderRadius: 16 }}>
        <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={20} /> Compliance Legal — Chile
        </h3>
        <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>
          Checklist completo de cumplimiento legal para Conniku SpA como empleador en Chile.
        </p>
      </div>

      {/* Brand Registration Guide */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Star size={18} /> Registro de Marca — INAPI
        </h3>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: 14 }}>Pasos para registrar "Conniku" en Chile:</h4>
          <ol style={{ paddingLeft: 20, lineHeight: 2.2 }}>
            <li><strong>Busqueda previa:</strong> Verificar disponibilidad en <strong>inapi.cl</strong> → Busqueda de Marcas. Buscar "Conniku" en todas las clases.</li>
            <li><strong>Definir clases Niza:</strong>
              <ul style={{ marginTop: 4, lineHeight: 1.8 }}>
                <li><strong>Clase 9:</strong> Software, aplicaciones moviles, plataformas digitales</li>
                <li><strong>Clase 41:</strong> Servicios de educacion, formacion, ensenanza</li>
                <li><strong>Clase 42:</strong> SaaS, diseno y desarrollo de software, plataformas cloud</li>
                <li><strong>Clase 35:</strong> Publicidad, gestion de negocios (si aplica marketplace)</li>
              </ul>
            </li>
            <li><strong>Presentar solicitud:</strong> Portal online INAPI. Necesitas:
              <ul style={{ marginTop: 4, lineHeight: 1.8 }}>
                <li>RUT de la empresa (Conniku SpA)</li>
                <li>Representante legal</li>
                <li>Logo en formato digital (JPEG/PNG min 300 DPI)</li>
                <li>Descripcion detallada de productos/servicios por clase</li>
              </ul>
            </li>
            <li><strong>Pago:</strong> ~1 UTM (~$66,000 CLP) por cada clase solicitada</li>
            <li><strong>Publicacion:</strong> Se publica en el Diario Oficial por 30 dias para oposiciones</li>
            <li><strong>Examen de fondo:</strong> INAPI revisa distintividad y posibles conflictos (2-4 meses)</li>
            <li><strong>Resolucion:</strong> Si no hay oposiciones, se concede el registro por 10 anos (renovable)</li>
          </ol>

          <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
            <strong>Recomendacion:</strong> Registrar minimo en Clases 9, 41 y 42. Costo estimado: ~3 UTM (~$198,000 CLP).
            Considerar tambien registro de dominio .cl si no lo tienes (NIC Chile).
            El proceso toma aproximadamente 4-8 meses en total.
          </div>
        </div>
      </div>

      {/* Labor Law Compliance */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Obligaciones como Empleador</h3>
        {[
          { title: 'Reglamento Interno de Orden, Higiene y Seguridad', description: 'Obligatorio con 10+ trabajadores (Art. 153 CT). Debe ser registrado en la Direccion del Trabajo e Inspeccion del Trabajo.', status: 'pending' },
          { title: 'Registro en Direccion del Trabajo', description: 'Inscripcion como empleador en dt.gob.cl. Necesario para inicio de actividades laborales.', status: 'pending' },
          { title: 'Mutual de Seguridad', description: 'Afiliacion a una mutual (ACHS, Mutual de Seguridad, IST) para seguro de accidentes laborales. Tasa base: 0.93%.', status: 'pending' },
          { title: 'Comite Paritario de Higiene y Seguridad', description: 'Obligatorio con 25+ trabajadores. 3 representantes del empleador y 3 de los trabajadores.', status: 'na' },
          { title: 'Obligacion de Informar (ODI)', description: 'Informar riesgos laborales al trabajador. DS 40 Art. 21. Debe quedar firmado.', status: 'pending' },
          { title: 'Libro de Remuneraciones Electronico', description: 'Obligatorio via DT desde 2021 para empresas con 5+ trabajadores. Envio mensual.', status: 'pending' },
          { title: 'Asistencia y Control de Jornada', description: 'Art. 33 CT. Registro de asistencia obligatorio (reloj control, libro, sistema electronico).', status: 'pending' },
          { title: 'Certificado de Cumplimiento Laboral', description: 'Obtener en dt.gob.cl. Necesario para licitaciones y contratos publicos.', status: 'pending' },
          { title: 'Ley Karin (Ley 21.643)', description: 'Protocolo de prevencion del acoso laboral, sexual y violencia en el trabajo. Obligatorio desde agosto 2024.', status: 'pending' },
          { title: 'Ley de Inclusion (Ley 21.015)', description: 'Empresas con 100+ trabajadores deben tener al menos 1% personas con discapacidad.', status: 'na' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            {item.status === 'done' ? <CheckCircle size={18} style={{ color: '#22c55e', flexShrink: 0, marginTop: 2 }} /> :
             item.status === 'na' ? <Minus size={18} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} /> :
             <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />}
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.description}</div>
            </div>
            <span style={{
              padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600, flexShrink: 0, marginLeft: 'auto',
              background: item.status === 'done' ? 'rgba(34,197,94,0.15)' : item.status === 'na' ? 'rgba(150,150,150,0.15)' : 'rgba(245,158,11,0.15)',
              color: item.status === 'done' ? '#22c55e' : item.status === 'na' ? 'var(--text-muted)' : '#f59e0b',
            }}>
              {item.status === 'done' ? 'CUMPLE' : item.status === 'na' ? 'N/A' : 'PENDIENTE'}
            </span>
          </div>
        ))}
      </div>

      {/* Data Protection */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Proteccion de Datos Personales</h3>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <p><strong>Ley 19.628:</strong> Proteccion de la vida privada. Obligacion de informar al trabajador sobre datos recopilados.</p>
          <p><strong>Ley 21.096:</strong> Proteccion de datos como garantia constitucional.</p>
          <p><strong>Recomendaciones:</strong></p>
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
            <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <Globe size={14} style={{ color: 'var(--accent)' }} />
              <span style={{ flex: 1 }}>{link.label}</span>
              <span style={{ fontSize: 11, color: 'var(--accent)' }}>{link.url}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
