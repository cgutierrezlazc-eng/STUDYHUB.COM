import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, getApiBase } from '../services/api';

// ── Templates ────────────────────────────────────────────────
export const COVER_TEMPLATES = [
  // Universales
  {
    id: 'gradient-ocean',
    name: 'Conniku',
    gradient: 'linear-gradient(135deg, #1a3a6e 0%, #2D62C8 50%, #5B8DEF 100%)',
  },
  {
    id: 'gradient-midnight',
    name: 'Medianoche',
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  },
  {
    id: 'gradient-cosmic',
    name: 'Cosmos',
    gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #24243e 100%)',
  },
  {
    id: 'gradient-aurora',
    name: 'Aurora',
    gradient: 'linear-gradient(135deg, #0d0d2b 0%, #1d1b70 40%, #6b21a8 70%, #c026d3 100%)',
  },
  {
    id: 'gradient-steel',
    name: 'Acero',
    gradient: 'linear-gradient(135deg, #1c1917 0%, #44403c 50%, #78716c 100%)',
  },
  {
    id: 'gradient-rose',
    name: 'Rosa',
    gradient: 'linear-gradient(135deg, #4c0519 0%, #be123c 50%, #fb7185 100%)',
  },
  {
    id: 'gradient-sunset',
    name: 'Atardecer',
    gradient: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 40%, #f97316 70%, #fbbf24 100%)',
  },
  {
    id: 'gradient-forest',
    name: 'Bosque',
    gradient: 'linear-gradient(135deg, #052e16 0%, #166534 50%, #4ade80 100%)',
  },
  {
    id: 'gradient-emerald',
    name: 'Esmeralda',
    gradient: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #34d399 100%)',
  },
  {
    id: 'gradient-royal',
    name: 'Real',
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #818cf8 100%)',
  },
  // Por carrera
  {
    id: 'med-1',
    name: 'Medicina',
    gradient: 'linear-gradient(135deg, #0d4e4e 0%, #1a8a8a 50%, #2dd4bf 100%)',
  },
  {
    id: 'eng-1',
    name: 'Ingeniería',
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #6366f1 100%)',
  },
  {
    id: 'law-1',
    name: 'Derecho',
    gradient: 'linear-gradient(135deg, #44403c 0%, #78716c 50%, #a8a29e 100%)',
  },
  {
    id: 'biz-1',
    name: 'Negocios',
    gradient: 'linear-gradient(135deg, #172554 0%, #1e40af 50%, #3b82f6 100%)',
  },
  {
    id: 'biz-2',
    name: 'Finanzas',
    gradient: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #22c55e 100%)',
  },
  {
    id: 'art-1',
    name: 'Arte',
    gradient: 'linear-gradient(135deg, #831843 0%, #db2777 50%, #f472b6 100%)',
  },
  {
    id: 'sci-1',
    name: 'Ciencias',
    gradient: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 50%, #38bdf8 100%)',
  },
  {
    id: 'edu-1',
    name: 'Educación',
    gradient: 'linear-gradient(135deg, #581c87 0%, #9333ea 50%, #c084fc 100%)',
  },
  {
    id: 'arch-1',
    name: 'Arquitectura',
    gradient: 'linear-gradient(135deg, #27272a 0%, #52525b 50%, #a1a1aa 100%)',
  },
  {
    id: 'psy-1',
    name: 'Psicología',
    gradient: 'linear-gradient(135deg, #4a1d96 0%, #7c3aed 50%, #a78bfa 100%)',
  },
];

export function getTemplateById(id: string) {
  return COVER_TEMPLATES.find((t) => t.id === id);
}

export function getCoverStyle(
  coverPhoto: string,
  coverType: string,
  positionY = 50
): React.CSSProperties {
  const API_BASE = getApiBase();
  if (coverType === 'custom' && coverPhoto) {
    const url = coverPhoto.startsWith('/uploads') ? `${API_BASE}${coverPhoto}` : coverPhoto;
    return {
      backgroundImage: `url(${url})`,
      backgroundSize: 'cover',
      backgroundPosition: `center ${positionY}%`,
    };
  }
  if (coverType === 'template' && coverPhoto) {
    const tpl = getTemplateById(coverPhoto);
    if (tpl) return { background: tpl.gradient };
  }
  return { background: 'linear-gradient(135deg, #071e3d 0%, #0a2a5e 40%, #1a1050 100%)' };
}

// ── Component ────────────────────────────────────────────────
interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentCover?: string;
  currentCoverType?: string;
  currentPositionY?: number;
  onSaved: (coverPhoto: string, coverType: string, positionY: number) => void;
  onDelete?: () => void;
}

export default function CoverPhotoModal({
  isOpen,
  onClose,
  currentCover,
  currentCoverType,
  currentPositionY = 50,
  onSaved,
  onDelete,
}: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [positionY, setPositionY] = useState(currentPositionY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startY: number; startPos: number } | null>(null);

  // Reset state each time modal opens
  React.useEffect(() => {
    if (isOpen) {
      setPositionY(currentPositionY);
      setSelectedTemplate(null);
      setPreviewFile(null);
      setCoverFile(null);
      setConfirmDelete(false);
    }
  }, [isOpen, currentPositionY]);

  const isCustomPreview = !!previewFile;
  const canDrag = isCustomPreview || currentCoverType === 'custom';

  const previewStyle: React.CSSProperties = isCustomPreview
    ? {
        backgroundImage: `url(${previewFile})`,
        backgroundSize: 'cover',
        backgroundPosition: `center ${positionY}%`,
      }
    : selectedTemplate
      ? { background: getTemplateById(selectedTemplate)?.gradient || 'var(--bg-hover)' }
      : getCoverStyle(currentCover || '', currentCoverType || 'template', positionY);

  // ── Drag-to-reposition ──────────────────────────────────────
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canDrag) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragState.current = { startY: clientY, startPos: positionY };
    e.preventDefault();
  };

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragState.current || !previewRef.current) return;
    const clientY =
      'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
    const rect = previewRef.current.getBoundingClientRect();
    const dy = clientY - dragState.current.startY;
    const pctChange = (dy / rect.height) * 100;
    const newPos = Math.max(0, Math.min(100, dragState.current.startPos + pctChange));
    setPositionY(Math.round(newPos));
  }, []);

  const handleDragEnd = useCallback(() => {
    dragState.current = null;
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove);
    window.addEventListener('touchend', handleDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isOpen, handleDragMove, handleDragEnd]);

  // ── File upload ─────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewFile(reader.result as string);
    reader.readAsDataURL(file);
    setSelectedTemplate(null);
    setPositionY(50);
    setConfirmDelete(false);
    if (e.target) e.target.value = '';
  };

  // ── Save ────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      if (coverFile) {
        formData.append('file', coverFile);
        formData.append('position_y', String(positionY));
      } else if (selectedTemplate) {
        formData.append('template_id', selectedTemplate);
        formData.append('position_y', '50');
      } else {
        setSaving(false);
        return;
      }
      const result = await api.updateCoverPhoto(formData);
      onSaved(result.coverPhoto, result.coverType, result.coverPositionY ?? positionY);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al guardar portada. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete (two-click: arm → confirm) ───────────────────────
  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete?.();
    onClose();
  };

  const canSave = !saving && (!!selectedTemplate || !!coverFile);
  const hasCover = !!currentCover && !!onDelete;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay cover-modal-overlay"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="cover-modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Header */}
            <div className="cover-modal-header">
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Foto de portada</h3>
              <button className="cover-modal-close" onClick={onClose} aria-label="Cerrar">
                ✕
              </button>
            </div>

            {/* Large Preview */}
            <div
              ref={previewRef}
              className="cover-modal-preview"
              style={{
                ...previewStyle,
                cursor: canDrag ? 'ns-resize' : 'default',
                userSelect: 'none',
              }}
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
            >
              {canDrag ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      color: '#fff',
                      fontSize: 12,
                      textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                      background: 'rgba(0,0,0,0.45)',
                      padding: '4px 14px',
                      borderRadius: 14,
                    }}
                  >
                    Arrastra para ajustar posición
                  </span>
                  <span style={{ color: '#fff', fontSize: 10, opacity: 0.7 }}>↕ {positionY}%</span>
                </div>
              ) : (
                <span
                  style={{
                    color: '#fff',
                    fontSize: 12,
                    textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                    opacity: 0.8,
                  }}
                >
                  Vista previa
                </span>
              )}
            </div>

            {/* Unified Grid — upload card + templates */}
            <div className="cover-modal-body">
              <div className="cover-templates-grid">
                {/* Upload card as first item */}
                <button
                  className={`cover-template-card cover-upload-card ${previewFile ? 'selected' : ''}`}
                  onClick={() => uploadRef.current?.click()}
                  title="Subir foto"
                >
                  <div className="cover-template-swatch cover-upload-swatch">
                    <span style={{ fontSize: 20 }}>📷</span>
                    <span style={{ fontSize: 10, fontWeight: 600 }}>Subir foto</span>
                  </div>
                  <span className="cover-template-name">
                    {previewFile ? 'Cambiar' : 'Dispositivo'}
                  </span>
                </button>

                {/* Template cards */}
                {COVER_TEMPLATES.map((tpl) => (
                  <motion.button
                    key={tpl.id}
                    className={`cover-template-card ${selectedTemplate === tpl.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedTemplate(tpl.id);
                      setPreviewFile(null);
                      setCoverFile(null);
                      setConfirmDelete(false);
                    }}
                    title={tpl.name}
                    whileTap={{ scale: 0.96 }}
                    transition={{ duration: 0.1 }}
                  >
                    <div className="cover-template-swatch" style={{ background: tpl.gradient }} />
                    <span className="cover-template-name">{tpl.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={uploadRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {/* Footer */}
            <div className="cover-modal-footer">
              {hasCover && (
                <button
                  onClick={handleDelete}
                  style={{
                    marginRight: 'auto',
                    padding: '6px 14px',
                    background: confirmDelete ? 'rgba(220,38,38,0.1)' : 'none',
                    border: confirmDelete
                      ? '1px solid rgba(220,38,38,0.3)'
                      : '1px solid transparent',
                    borderRadius: 'var(--radius-sm)',
                    color: confirmDelete ? '#dc2626' : 'var(--text-muted)',
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {confirmDelete ? 'Confirmar eliminación' : 'Eliminar portada'}
                </button>
              )}
              <button className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button className="btn btn-primary" disabled={!canSave} onClick={handleSave}>
                {saving ? 'Aplicando...' : 'Aplicar'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
