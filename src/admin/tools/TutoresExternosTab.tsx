import React, { useState, useEffect } from 'react'
import {
  BookOpen, UserPlus, Users, CreditCard
} from 'lucide-react'
import { api } from '../../services/api'

export default function TutoresExternosTab() {
  const now = new Date()
  const [month] = useState(now.getMonth() + 1)
  const [year] = useState(now.getFullYear())
  const [tutorSubTab, setTutorSubTab] = useState<'overview' | 'applications' | 'payments' | 'directory'>('overview')
  const [tutors, setTutors] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])

  useEffect(() => {
    api.getEmployees().catch(() => {}) // placeholder - will use tutor endpoints
  }, [])

  return (
    <div>
      {/* Header with distinct color */}
      <div className="card" style={{ padding: 20, marginBottom: 20, background: 'linear-gradient(135deg, #92400e, #f59e0b)', color: '#fff', borderRadius: 16 }}>
        <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={20} /> Tutores Externos — Prestadores de Servicios
        </h3>
        <p style={{ fontSize: 13, opacity: 0.9, margin: 0 }}>
          Gestion de tutores con boleta de honorarios. Comision Conniku: 10%. El tutor recibe 90% bruto y es responsable de pagar su retencion al SII (13.75%).
        </p>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[
          { id: 'overview', label: 'Resumen' },
          { id: 'applications', label: 'Postulaciones' },
          { id: 'payments', label: 'Pagos a Tutores' },
          { id: 'directory', label: 'Directorio' },
        ].map(st => (
          <button key={st.id} onClick={() => setTutorSubTab(st.id as any)} style={{
            padding: '8px 14px', borderRadius: 8, border: tutorSubTab === st.id ? 'none' : '1px solid #f59e0b33',
            background: tutorSubTab === st.id ? '#f59e0b' : 'rgba(245,158,11,0.05)',
            color: tutorSubTab === st.id ? '#fff' : '#f59e0b',
            fontWeight: 600, fontSize: 12, cursor: 'pointer',
          }}>
            {st.label}
          </button>
        ))}
      </div>

      {tutorSubTab === 'overview' && (
        <div>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Tutores Activos</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>0</div>
            </div>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Postulaciones Pendientes</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#3b82f6' }}>0</div>
            </div>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #22c55e' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Clases Este Mes</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#22c55e' }}>0</div>
            </div>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Comisiones Conniku</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#8b5cf6' }}>$0</div>
            </div>
          </div>

          {/* How it works */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Como Funciona el Sistema de Tutores</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {[
                { step: 1, title: 'Estudiante Paga', desc: 'El estudiante selecciona un tutor, elige la clase y paga a traves de Conniku. Conniku retiene el 100% hasta confirmar la clase.' },
                { step: 2, title: 'Clase via Zoom', desc: 'El tutor crea el link de Zoom, levanta la clase en la plataforma. El estudiante recibe la invitacion una vez confirmado el pago.' },
                { step: 3, title: 'Pago al Tutor', desc: 'Confirmada la clase, el tutor sube su boleta de honorarios. Conniku paga el 90% en max 7 dias habiles. Conniku retiene 10% comision.' },
              ].map(s => (
                <div key={s.step} style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, margin: '0 auto 12px' }}>{s.step}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tutor levels */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Niveles de Tutor</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div style={{ padding: 12, background: 'rgba(245,158,11,0.05)', borderRadius: 8, border: '1px solid #f59e0b33' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#f59e0b' }}>Tutor Nuevo</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>0-10 clases • Tarifa limitada • Badge amarillo</div>
              </div>
              <div style={{ padding: 12, background: 'rgba(59,130,246,0.05)', borderRadius: 8, border: '1px solid #3b82f633' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#3b82f6' }}>Tutor Regular</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>11-50 clases • Tarifa libre • Badge azul</div>
              </div>
              <div style={{ padding: 12, background: 'rgba(168,85,247,0.05)', borderRadius: 8, border: '1px solid #a855f733' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#a855f7' }}>Tutor Premium</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>51+ clases • Rating 4.5+ • Prioridad busqueda</div>
              </div>
            </div>
          </div>

          {/* Pricing model */}
          <div className="card" style={{ padding: 20, borderLeft: '4px solid #f59e0b' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Modelo de Precios y Comisiones</h4>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 2 }}>
              <p><strong>Tarifa individual:</strong> El tutor define su precio/hora libremente.</p>
              <p><strong>Tarifas grupales:</strong> El tutor fija precio para 2, 3, 4 y 5 estudiantes (maximo 5 por clase).</p>
              <p><strong>Comision Conniku:</strong> 10% fijo sobre el monto pagado por el estudiante.</p>
              <p><strong>Ejemplo:</strong> Estudiante paga $20,000 → Conniku retiene $2,000 (10%) → Tutor recibe $18,000 bruto.</p>
              <p><strong>Boleta:</strong> El tutor emite boleta de honorarios por $18,000 a nombre de Conniku SpA.</p>
              <p><strong>Retencion SII:</strong> El tutor paga 13.75% al SII ($2,475). Neto tutor: $15,525.</p>
              <p><strong>Frecuencia de pago:</strong> Por clase, quincenal o mensual (a eleccion del tutor).</p>
              <p><strong>Plazo de pago:</strong> Maximo 7 dias habiles desde recepcion de boleta validada.</p>
            </div>
          </div>
        </div>
      )}

      {tutorSubTab === 'applications' && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <UserPlus size={48} style={{ color: '#f59e0b', marginBottom: 12 }} />
          <h3>Sin postulaciones pendientes</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Cuando un profesional solicite ser tutor, aparecera aqui para revision y aprobacion.
          </p>
          <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-tertiary)', borderRadius: 12, textAlign: 'left', maxWidth: 500, margin: '16px auto 0' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 13 }}>Documentos requeridos para aprobacion:</h4>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 2 }}>
              <p>• Cedula de identidad (ambos lados)</p>
              <p>• Titulo profesional o certificado alumno regular ultimo ano</p>
              <p>• Certificado de antecedentes (vigente, menos de 30 dias)</p>
              <p>• Curriculum vitae</p>
              <p>• Contrato de prestacion de servicios firmado digitalmente</p>
            </div>
          </div>
        </div>
      )}

      {tutorSubTab === 'payments' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Boletas Pendientes</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>0</div>
            </div>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>En Proceso</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>0</div>
            </div>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #22c55e' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pagados Este Mes</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>$0</div>
            </div>
          </div>

          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <CreditCard size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <h3>Sin pagos a tutores este periodo</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Los pagos aparecen cuando un tutor sube su boleta de honorarios despues de una clase confirmada.
            </p>
          </div>
        </div>
      )}

      {tutorSubTab === 'directory' && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <Users size={48} style={{ color: '#f59e0b', marginBottom: 12 }} />
          <h3>Directorio de Tutores</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 500, margin: '8px auto' }}>
            Aqui veras todos los tutores aprobados con su perfil, rating, clases dadas y estado.
            En poco estara lista la plataforma para que los tutores se inscriban.
          </p>
        </div>
      )}
    </div>
  )
}
