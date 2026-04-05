import React from 'react'

interface Props {
  onNavigate: (path: string) => void
}

export default function Conferences({ onNavigate }: Props) {
  return (
    <div className="page-body">
      <div className="page-header">
        <h2>Conferencias</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Crea y unete a videoconferencias, conecta tus clases y graba tus sesiones de estudio.
        </p>
      </div>
      <div style={{
        textAlign: 'center', padding: 40, color: 'var(--text-muted)',
        background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)',
      }}>
        <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Preparando todo...</p>
        <p style={{ fontSize: 13 }}>Las videoconferencias estaran disponibles muy pronto.</p>
      </div>
    </div>
  )
}
