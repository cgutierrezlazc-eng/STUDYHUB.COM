/**
 * ExecutiveShowcase — plan MAX
 * Diseño: LinkedIn Executive (Opción A)
 * Tarjeta con borde izquierdo grueso del color del tipo + banner premium
 */
import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import type { ExecutiveShowcaseItem, ShowcaseItemType } from '../types'

// ── Tipos ──────────────────────────────────────────────────────
const ITEM_TYPES = [
  { id: 'article'    as const, label: 'Artículo / Publicación', icon: '📝', color: '#3b82f6', placeholder: 'ej. El futuro de la IA en Chile',         tagLabel: 'Publicado en'      },
  { id: 'book'       as const, label: 'Libro',                  icon: '📖', color: '#8b5cf6', placeholder: 'ej. Liderazgo en la Era Digital',           tagLabel: 'Autor / Editorial' },
  { id: 'talk'       as const, label: 'Conferencia / Charla',   icon: '🎤', color: '#f59e0b', placeholder: 'ej. TED: La Innovación que viene',          tagLabel: 'Evento'            },
  { id: 'media'      as const, label: 'Aparición en Medios',    icon: '📺', color: '#ef4444', placeholder: 'ej. Entrevista en CNN Chile',               tagLabel: 'Medio'             },
  { id: 'achievement'as const, label: 'Logro / Reconocimiento', icon: '🏆', color: '#22c55e', placeholder: 'ej. Top 100 Líderes Innovadores 2024',      tagLabel: 'Otorgado por'      },
  { id: 'project'    as const, label: 'Proyecto Destacado',     icon: '🚀', color: '#06b6d4', placeholder: 'ej. Transformación digital Banco XYZ',      tagLabel: 'Organización'      },
  { id: 'insight'    as const, label: 'Insight / Visión',       icon: '💡', color: '#a855f7', placeholder: 'ej. Por qué las startups fallan en Chile',  tagLabel: 'Categoría'         },
]

type TypeId = typeof ITEM_TYPES[number]['id']
const typeMap = Object.fromEntries(ITEM_TYPES.map(t => [t.id, t])) as Record<TypeId, typeof ITEM_TYPES[number]>

function genId() { return Math.random().toString(36).slice(2, 10) }

function formatDate(d: string) {
  try { return new Date(d + 'T00:00:00').toLocaleDateString('es-CL', { year: 'numeric', month: 'long' }) }
  catch { return d }
}

// ── ShowcaseCard — LinkedIn style ──────────────────────────────
function ShowcaseCard({ item, onEdit, onDelete, editable }: {
  item: ExecutiveShowcaseItem
  onEdit?: () => void
  onDelete?: () => void
  editable?: boolean
}) {
  const meta = typeMap[item.type as TypeId] || typeMap.insight

  return (
    <div
      className="sc-card"
      style={{ '--sc-accent': meta.color } as React.CSSProperties}
    >
      {/* Large icon spot — top right */}
      <div
        className="sc-icon-spot"
        style={{ background: meta.color + '18' }}
      >
        {meta.icon}
      </div>

      {/* Type label */}
      <div className="sc-type-pill">
        {meta.label}
      </div>

      {/* Title */}
      <div className="sc-title">
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="sc-title-link"
          >
            {item.title}<span className="sc-link-arrow"> ↗</span>
          </a>
        ) : item.title}
      </div>

      {/* Description */}
      {item.description && <p className="sc-desc">{item.description}</p>}

      {/* Footer: tag + date */}
      {(item.tag || item.date) && (
        <div className="sc-footer">
          {item.tag && (
            <span
              className="sc-tag"
              style={{ color: meta.color, background: meta.color + '14', borderColor: meta.color + '25' }}
            >
              {item.tag}
            </span>
          )}
          {item.date && <span className="sc-date">{formatDate(item.date)}</span>}
        </div>
      )}

      {/* Edit / Delete — visible on hover */}
      {editable && (
        <div className="sc-actions">
          <button className="sc-btn-edit" onClick={onEdit}>Editar</button>
          <button className="sc-btn-delete" onClick={onDelete}>✕</button>
        </div>
      )}
    </div>
  )
}

// ── ItemForm ───────────────────────────────────────────────────
function ItemForm({ initial, onSave, onCancel }: {
  initial?: Partial<ExecutiveShowcaseItem>
  onSave: (item: ExecutiveShowcaseItem) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<ExecutiveShowcaseItem>({
    id:          initial?.id          || genId(),
    type:        initial?.type        || 'article',
    title:       initial?.title       || '',
    description: initial?.description || '',
    url:         initial?.url         || '',
    date:        initial?.date        || '',
    tag:         initial?.tag         || '',
  })
  const meta   = typeMap[form.type as TypeId] || typeMap.article
  const set    = (k: keyof ExecutiveShowcaseItem, v: string) => setForm(p => ({ ...p, [k]: v }))
  const canSave = form.title.trim().length > 0

  return (
    <div className="sc-form" style={{ borderLeft: `4px solid ${meta.color}` }}>
      <h4 className="sc-form-title" style={{ color: meta.color }}>
        {meta.icon} {initial?.id ? 'Editar item' : 'Agregar al Showcase'}
      </h4>

      {/* Tipo */}
      <div className="sc-form-field">
        <label className="sc-form-label">Tipo</label>
        <div className="sc-type-selector">
          {ITEM_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => set('type', t.id)}
              className={`sc-type-btn${form.type === t.id ? ' active' : ''}`}
              style={form.type === t.id
                ? { borderColor: t.color, background: t.color + '15', color: t.color }
                : {}}
            >
              {t.icon} {t.label.split('/')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Campos */}
      <div className="sc-form-grid">
        <div className="sc-form-field" style={{ gridColumn: '1 / -1' }}>
          <label className="sc-form-label">Título *</label>
          <input
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder={meta.placeholder}
            className="sc-input"
          />
        </div>

        <div className="sc-form-field" style={{ gridColumn: '1 / -1' }}>
          <label className="sc-form-label">Descripción</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={3}
            placeholder="Describe brevemente este logro, publicación o proyecto..."
            className="sc-input sc-textarea"
          />
        </div>

        <div className="sc-form-field">
          <label className="sc-form-label">{meta.tagLabel}</label>
          <input
            value={form.tag}
            onChange={e => set('tag', e.target.value)}
            placeholder={meta.tagLabel === 'Publicado en' ? 'Harvard Business Review, Medium...' : meta.tagLabel}
            className="sc-input"
          />
        </div>

        <div className="sc-form-field">
          <label className="sc-form-label">Fecha</label>
          <input
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            className="sc-input"
          />
        </div>

        <div className="sc-form-field" style={{ gridColumn: '1 / -1' }}>
          <label className="sc-form-label">URL (opcional)</label>
          <input
            value={form.url}
            onChange={e => set('url', e.target.value)}
            placeholder="https://..."
            className="sc-input"
          />
        </div>
      </div>

      <div className="sc-form-actions">
        <button onClick={onCancel} className="sc-btn-cancel">Cancelar</button>
        <button
          onClick={() => canSave && onSave(form)}
          disabled={!canSave}
          className="sc-btn-save"
          style={{ background: meta.color, opacity: canSave ? 1 : 0.5 }}
        >
          Guardar
        </button>
      </div>
    </div>
  )
}

// ── FilterBar ─────────────────────────────────────────────────
function FilterBar({ active, onChange }: { active: string; onChange: (t: string) => void }) {
  return (
    <div className="sc-filter-bar">
      <button
        onClick={() => onChange('')}
        className={`sc-filter-pill${active === '' ? ' active' : ''}`}
        style={active === '' ? { borderColor: '#64748b', background: '#64748b15', color: '#64748b' } : {}}
      >
        Todos
      </button>
      {ITEM_TYPES.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`sc-filter-pill${active === t.id ? ' active' : ''}`}
          style={active === t.id ? { borderColor: t.color, background: t.color + '15', color: t.color } : {}}
        >
          {t.icon} {t.label.split('/')[0].trim()}
        </button>
      ))}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
interface Props {
  userId:    string
  isOwner:   boolean
  isMaxUser: boolean
}

export default function ExecutiveShowcase({ userId, isOwner, isMaxUser }: Props) {
  const [items,       setItems]       = useState<ExecutiveShowcaseItem[]>([])
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [editingItem, setEditingItem] = useState<ExecutiveShowcaseItem | null>(null)
  const [addingNew,   setAddingNew]   = useState(false)
  const [filterType,  setFilterType]  = useState('')

  useEffect(() => {
    if (!isMaxUser && !isOwner) { setLoading(false); return }
    const req = isOwner
      ? api.getMyExecutiveShowcase()
      : api.getUserExecutiveShowcase(userId)
    req
      .then((d: any) => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId, isOwner, isMaxUser])

  const saveItems = async (next: ExecutiveShowcaseItem[]) => {
    setSaving(true)
    try   { await api.updateMyExecutiveShowcase(next); setItems(next) }
    catch (e: any) { alert(e?.message || 'Error al guardar') }
    finally { setSaving(false) }
  }

  const handleSave = (item: ExecutiveShowcaseItem) => {
    const idx = items.findIndex(i => i.id === item.id)
    saveItems(idx >= 0 ? items.map(i => i.id === item.id ? item : i) : [...items, item])
    setEditingItem(null)
    setAddingNew(false)
  }

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este item del showcase?')) return
    saveItems(items.filter(i => i.id !== id))
  }

  const visible = filterType ? items.filter(i => i.type === filterType) : items

  if (!isMaxUser && !isOwner) return null
  if (loading) return (
    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
      Cargando showcase...
    </div>
  )

  return (
    <div className="sc-root">

      {/* ── Banner premium ── */}
      <div className="sc-banner">
        <div className="sc-banner-left">
          <div className="sc-banner-title">
            Showcase Ejecutivo
            <span className="sc-max-badge">◆ MAX</span>
          </div>
          <div className="sc-banner-sub">
            {items.length > 0
              ? `${items.length} publicación${items.length !== 1 ? 'es' : ''} · charla${items.length !== 1 ? 's' : ''} · logro${items.length !== 1 ? 's' : ''}`
              : 'Tu espacio profesional de alto nivel'}
          </div>
        </div>
        {isOwner && !addingNew && !editingItem && (
          <button className="sc-btn-add" onClick={() => setAddingNew(true)}>
            + Agregar
          </button>
        )}
      </div>

      {/* ── Formulario ── */}
      {addingNew   && <ItemForm onSave={handleSave} onCancel={() => setAddingNew(false)} />}
      {editingItem && <ItemForm initial={editingItem} onSave={handleSave} onCancel={() => setEditingItem(null)} />}

      {/* ── Empty state ── */}
      {items.length === 0 && !addingNew && (
        <div className="sc-empty">
          <div className="sc-empty-icon">✨</div>
          <div className="sc-empty-title">
            {isOwner ? 'Tu Showcase Ejecutivo está vacío' : 'Sin publicaciones aún'}
          </div>
          <div className="sc-empty-sub">
            {isOwner
              ? 'Agrega artículos, libros, charlas, apariciones en medios y logros. Demuestra tu trayectoria profesional de alto nivel.'
              : 'Este usuario aún no ha publicado items en su showcase.'}
          </div>
          {isOwner && (
            <button className="sc-btn-add sc-btn-add--hero" onClick={() => setAddingNew(true)}>
              Agregar primer item
            </button>
          )}

          {isOwner && (
            <div className="sc-tips">
              <div className="sc-tips-title">💡 Qué suelen publicar los ejecutivos de alto nivel</div>
              <div className="sc-tips-grid">
                {ITEM_TYPES.map(t => (
                  <div key={t.id} className="sc-tips-item">
                    <span style={{ fontSize: 16 }}>{t.icon}</span>
                    <span>{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Filtros + Grid ── */}
      {items.length > 0 && (
        <>
          <FilterBar active={filterType} onChange={setFilterType} />

          {visible.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>
              No hay items de ese tipo aún.
            </div>
          ) : (
            <div className="sc-grid">
              {visible.map(item => (
                <ShowcaseCard
                  key={item.id}
                  item={item}
                  editable={isOwner && !saving}
                  onEdit={() => setEditingItem(item)}
                  onDelete={() => handleDelete(item.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Saving toast ── */}
      {saving && <div className="sc-saving-toast">Guardando...</div>}

    </div>
  )
}
