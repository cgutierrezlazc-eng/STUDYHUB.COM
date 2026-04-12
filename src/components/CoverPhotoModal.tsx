import React, { useState, useRef } from 'react'
import { api, getApiBase } from '../services/api'

// ── Templates ────────────────────────────────────────────────
export const COVER_TEMPLATES = [
  // Universales
  { id: 'gradient-ocean',    name: 'Conniku',       gradient: 'linear-gradient(135deg, #1a3a6e 0%, #2D62C8 50%, #5B8DEF 100%)' },
  { id: 'gradient-midnight', name: 'Medianoche',    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' },
  { id: 'gradient-cosmic',   name: 'Cosmos',        gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #24243e 100%)' },
  { id: 'gradient-aurora',   name: 'Aurora',        gradient: 'linear-gradient(135deg, #0d0d2b 0%, #1d1b70 40%, #6b21a8 70%, #c026d3 100%)' },
  { id: 'gradient-steel',    name: 'Acero',         gradient: 'linear-gradient(135deg, #1c1917 0%, #44403c 50%, #78716c 100%)' },
  { id: 'gradient-rose',     name: 'Rosa',          gradient: 'linear-gradient(135deg, #4c0519 0%, #be123c 50%, #fb7185 100%)' },
  { id: 'gradient-sunset',   name: 'Atardecer',     gradient: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 40%, #f97316 70%, #fbbf24 100%)' },
  { id: 'gradient-forest',   name: 'Bosque',        gradient: 'linear-gradient(135deg, #052e16 0%, #166534 50%, #4ade80 100%)' },
  { id: 'gradient-emerald',  name: 'Esmeralda',     gradient: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #34d399 100%)' },
  { id: 'gradient-royal',    name: 'Real',          gradient: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #818cf8 100%)' },
  // Por carrera
  { id: 'med-1',   name: 'Medicina',      gradient: 'linear-gradient(135deg, #0d4e4e 0%, #1a8a8a 50%, #2dd4bf 100%)' },
  { id: 'eng-1',   name: 'Ingeniería',    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #6366f1 100%)' },
  { id: 'law-1',   name: 'Derecho',       gradient: 'linear-gradient(135deg, #44403c 0%, #78716c 50%, #a8a29e 100%)' },
  { id: 'biz-1',   name: 'Negocios',      gradient: 'linear-gradient(135deg, #172554 0%, #1e40af 50%, #3b82f6 100%)' },
  { id: 'biz-2',   name: 'Finanzas',      gradient: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #22c55e 100%)' },
  { id: 'art-1',   name: 'Arte',          gradient: 'linear-gradient(135deg, #831843 0%, #db2777 50%, #f472b6 100%)' },
  { id: 'sci-1',   name: 'Ciencias',      gradient: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 50%, #38bdf8 100%)' },
  { id: 'edu-1',   name: 'Educación',     gradient: 'linear-gradient(135deg, #581c87 0%, #9333ea 50%, #c084fc 100%)' },
  { id: 'arch-1',  name: 'Arquitectura',  gradient: 'linear-gradient(135deg, #27272a 0%, #52525b 50%, #a1a1aa 100%)' },
  { id: 'psy-1',   name: 'Psicología',    gradient: 'linear-gradient(135deg, #4a1d96 0%, #7c3aed 50%, #a78bfa 100%)' },
]

export function getTemplateById(id: string) {
  return COVER_TEMPLATES.find(t => t.id === id)
}

export function getCoverStyle(coverPhoto: string, coverType: string): React.CSSProperties {
  const API_BASE = getApiBase()
  if (coverType === 'custom' && coverPhoto) {
    const url = coverPhoto.startsWith('/uploads') ? `${API_BASE}${coverPhoto}` : coverPhoto
    return { backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  }
  if (coverType === 'template' && coverPhoto) {
    const tpl = getTemplateById(coverPhoto)
    if (tpl) return { background: tpl.gradient }
  }
  return { background: 'linear-gradient(135deg, #071e3d 0%, #0a2a5e 40%, #1a1050 100%)' }
}

// ── Component ────────────────────────────────────────────────
interface Props {
  isOpen: boolean
  onClose: () => void
  currentCover?: string
  currentCoverType?: string
  onSaved: (coverPhoto: string, coverType: string) => void
}

export default function CoverPhotoModal({ isOpen, onClose, currentCover, currentCoverType, onSaved }: Props) {
  const [tab, setTab] = useState<'templates' | 'upload'>('templates')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const uploadRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const previewStyle: React.CSSProperties =
    tab === 'upload' && previewFile
      ? { backgroundImage: `url(${previewFile})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : selectedTemplate
        ? { background: getTemplateById(selectedTemplate)?.gradient || 'var(--bg-hover)' }
        : getCoverStyle(currentCover || '', currentCoverType || 'template')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setPreviewFile(reader.result as string)
    reader.readAsDataURL(file)
    setSelectedTemplate(null)
    setTab('upload')
    if (e.target) e.target.value = ''
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const formData = new FormData()
      if (tab === 'upload' && coverFile) {
        formData.append('file', coverFile)
      } else if (selectedTemplate) {
        formData.append('template_id', selectedTemplate)
      } else {
        setSaving(false)
        return
      }
      const result = await api.updateCoverPhoto(formData)
      onSaved(result.coverPhoto, result.coverType)
      // reset internal state
      setSelectedTemplate(null)
      setPreviewFile(null)
      setCoverFile(null)
      setTab('templates')
      onClose()
    } catch (err: any) {
      alert(err.message || 'Error al guardar portada. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const canSave = !saving && (!!selectedTemplate || !!coverFile)

  return (
    <div className="modal-overlay cover-modal-overlay" onClick={onClose}>
      <div className="cover-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="cover-modal-header">
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Foto de portada</h3>
          <button
            className="cover-modal-close"
            onClick={onClose}
            aria-label="Cerrar"
            style={{ fontSize: 18, lineHeight: 1 }}
          >✕</button>
        </div>

        {/* Preview */}
        <div className="cover-modal-preview" style={previewStyle}>
          <span style={{ color: '#fff', fontSize: 12, textShadow: '0 1px 4px rgba(0,0,0,0.6)', opacity: 0.8 }}>
            Vista previa
          </span>
        </div>

        {/* Tabs */}
        <div className="cover-modal-tabs">
          <button
            className={`cover-modal-tab ${tab === 'templates' ? 'active' : ''}`}
            onClick={() => setTab('templates')}
          >
            Plantillas
          </button>
          <button
            className={`cover-modal-tab ${tab === 'upload' ? 'active' : ''}`}
            onClick={() => setTab('upload')}
          >
            Subir foto
          </button>
        </div>

        {/* Body */}
        <div className="cover-modal-body">
          {tab === 'templates' && (
            <div className="cover-templates-grid">
              {COVER_TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  className={`cover-template-card ${selectedTemplate === tpl.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedTemplate(tpl.id)
                    setPreviewFile(null)
                    setCoverFile(null)
                  }}
                  title={tpl.name}
                >
                  <div className="cover-template-swatch" style={{ background: tpl.gradient }} />
                  <span className="cover-template-name">{tpl.name}</span>
                </button>
              ))}
            </div>
          )}

          {tab === 'upload' && (
            <div className="cover-upload-area">
              <input
                ref={uploadRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              {previewFile ? (
                <div style={{ textAlign: 'center', width: '100%' }}>
                  <img
                    src={previewFile}
                    alt="Vista previa"
                    style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 8, marginBottom: 12, objectFit: 'cover' }}
                  />
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => uploadRef.current?.click()}
                  >
                    Cambiar imagen
                  </button>
                </div>
              ) : (
                <button className="cover-upload-btn" onClick={() => uploadRef.current?.click()}>
                  <span style={{ fontSize: 28 }}>📷</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Seleccionar desde dispositivo</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>JPG, PNG, WebP o GIF — máx. 5 MB</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="cover-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" disabled={!canSave} onClick={handleSave}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>

      </div>
    </div>
  )
}
