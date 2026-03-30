import React, { useState } from 'react'

const COLORS = ['#4f8cff', '#a855f7', '#22c55e', '#f97316', '#ef4444', '#06b6d4', '#ec4899', '#eab308']

interface Props {
  onClose: () => void
  onCreate: (name: string, description: string, color: string) => void
}

export default function NewProjectModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLORS[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onCreate(name.trim(), description.trim(), color)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Nueva Asignatura</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre de la asignatura</label>
            <input
              className="form-input"
              placeholder="Ej: Cálculo II, Física III, Historia..."
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Descripción (opcional)</label>
            <input
              className="form-input"
              placeholder="Ej: Semestre 2025-1, Prof. García"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Color</label>
            <div className="color-options">
              {COLORS.map(c => (
                <div
                  key={c}
                  className={`color-option ${color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
              Crear Asignatura
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
