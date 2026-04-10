/**
 * ExecutiveShowcase — disponible para usuarios con plan MAX.
 * Permite mostrar publicaciones, libros, charlas, apariciones en medios,
 * logros, proyectos e insights al estilo ejecutivo de alto nivel.
 */
import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import type { ExecutiveShowcaseItem, ShowcaseItemType } from '../types'

// ─── Config ───────────────────────────────────────────────────────
const ITEM_TYPES: { id: ShowcaseItemType; label: string; icon: string; color: string; placeholder: string; tagLabel: string }[] = [
  { id: 'article',     label: 'Artículo / Publicación', icon: '📝', color: '#3b82f6', placeholder: 'ej. El futuro de la IA en Chile', tagLabel: 'Publicado en' },
  { id: 'book',        label: 'Libro',                  icon: '📖', color: '#8b5cf6', placeholder: 'ej. Liderazgo en la Era Digital', tagLabel: 'Autor / Editorial' },
  { id: 'talk',        label: 'Conferencia / Charla',   icon: '🎤', color: '#f59e0b', placeholder: 'ej. TED: La Innovación que viene', tagLabel: 'Evento' },
  { id: 'media',       label: 'Aparición en Medios',    icon: '📺', color: '#ef4444', placeholder: 'ej. Entrevista en CNN Chile', tagLabel: 'Medio' },
  { id: 'achievement', label: 'Logro / Reconocimiento', icon: '🏆', color: '#22c55e', placeholder: 'ej. Top 100 Líderes Innovadores 2024', tagLabel: 'Otorgado por' },
  { id: 'project',     label: 'Proyecto Destacado',     icon: '🚀', color: '#06b6d4', placeholder: 'ej. Transformación digital Banco XYZ', tagLabel: 'Organización' },
  { id: 'insight',     label: 'Insight / Visión',       icon: '💡', color: '#a855f7', placeholder: 'ej. Por qué las startups fallan en Chile', tagLabel: 'Categoría' },
]

const typeMap = Object.fromEntries(ITEM_TYPES.map(t => [t.id, t]))

function genId() { return Math.random().toString(36).slice(2, 10) }

// ─── Item card (read mode) ────────────────────────────────────────
function ShowcaseCard({ item, onEdit, onDelete, editable }: {
  item: ExecutiveShowcaseItem
  onEdit?: () => void
  onDelete?: () => void
  editable?: boolean
}) {
  const meta = typeMap[item.type] || typeMap.insight
  return (
    <div style={{
      padding: '16px 20px', borderRadius: 14, border: '1px solid var(--border)',
      background: 'var(--bg-secondary)', position: 'relative', transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = meta.color + '88')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{meta.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            {meta.label}
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: item.description ? 6 : 0, wordBreak: 'break-word' }}>
            {item.url
              ? <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = meta.color)} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-primary)')}>{item.title} ↗</a>
              : item.title
            }
          </div>
          {item.description && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 8 }}>{item.description}</div>
          )}
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            {item.tag && <span style={{ padding: '1px 8px', borderRadius: 10, background: meta.color + '15', color: meta.color, fontWeight: 600 }}>{item.tag}</span>}
            {item.date && <span>{new Date(item.date + 'T00:00:00').toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })}</span>}
          </div>
        </div>
      </div>
      {editable && (
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
          <button onClick={onEdit} style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-primary)', cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)' }}>Editar</button>
          <button onClick={onDelete} style={{ padding: '3px 8px', borderRadius: 6, border: 'none', background: '#ef444415', cursor: 'pointer', fontSize: 11, color: '#ef4444' }}>✕</button>
        </div>
      )}
    </div>
  )
}

// ─── Item form ────────────────────────────────────────────────────
function ItemForm({ initial, onSave, onCancel }: {
  initial?: Partial<ExecutiveShowcaseItem>
  onSave: (item: ExecutiveShowcaseItem) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<ExecutiveShowcaseItem>({
    id: initial?.id || genId(),
    type: initial?.type || 'article',
    title: initial?.title || '',
    description: initial?.description || '',
    url: initial?.url || '',
    date: initial?.date || '',
    tag: initial?.tag || '',
  })
  const meta = typeMap[form.type]
  const set = (k: keyof ExecutiveShowcaseItem, v: string) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="card" style={{ padding: 20, marginBottom: 16, borderLeft: `4px solid ${meta.color}` }}>
      <h4 style={{ margin: '0 0 16px', fontSize: 14, color: meta.color }}>{meta.icon} {initial?.id ? 'Editar item' : 'Agregar al Showcase'}</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Type */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Tipo</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ITEM_TYPES.map(t => (
              <button key={t.id} onClick={() => set('type', t.id)} style={{
                padding: '5px 12px', borderRadius: 20, border: `1px solid ${form.type === t.id ? t.color : 'var(--border)'}`,
                background: form.type === t.id ? t.color + '20' : 'transparent', cursor: 'pointer', fontSize: 12,
                fontWeight: form.type === t.id ? 700 : 400, color: form.type === t.id ? t.color : 'var(--text-muted)',
              }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
        {/* Title */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Título *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)}
            placeholder={meta.placeholder}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
        </div>
        {/* Description */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Descripción</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            rows={3} placeholder="Describe brevemente este logro, publicación o proyecto..."
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
        </div>
        {/* Tag */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{meta.tagLabel}</label>
          <input value={form.tag} onChange={e => set('tag', e.target.value)}
            placeholder={meta.tagLabel === 'Publicado en' ? 'Harvard Business Review, Medium...' : ''}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
        </div>
        {/* Date */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Fecha</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
        </div>
        {/* URL */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>URL (opcional)</label>
          <input value={form.url} onChange={e => set('url', e.target.value)}
            placeholder="https://..."
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
        <button onClick={() => form.title.trim() && onSave(form)} disabled={!form.title.trim()}
          style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: meta.color, color: '#fff', fontWeight: 700, fontSize: 13, cursor: form.title.trim() ? 'pointer' : 'not-allowed', opacity: form.title.trim() ? 1 : 0.5 }}>
          Guardar
        </button>
      </div>
    </div>
  )
}

// ─── Filter bar ───────────────────────────────────────────────────
function FilterBar({ active, onChange }: { active: string; onChange: (t: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
      <button onClick={() => onChange('')} style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid ${active === '' ? '#3b82f6' : 'var(--border)'}`, background: active === '' ? '#3b82f620' : 'none', cursor: 'pointer', fontSize: 12, fontWeight: active === '' ? 700 : 400, color: active === '' ? '#3b82f6' : 'var(--text-muted)' }}>
        Todo
      </button>
      {ITEM_TYPES.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding: '4px 12px', borderRadius: 20, border: `1px solid ${active === t.id ? t.color : 'var(--border)'}`,
          background: active === t.id ? t.color + '20' : 'none', cursor: 'pointer', fontSize: 12,
          fontWeight: active === t.id ? 700 : 400, color: active === t.id ? t.color : 'var(--text-muted)',
        }}>
          {t.icon} {t.label.split('/')[0].trim()}
        </button>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────
interface Props {
  userId: string
  isOwner: boolean        // true = viewing your own profile (edit mode available)
  isMaxUser: boolean      // true = this user is on MAX plan
}

export default function ExecutiveShowcase({ userId, isOwner, isMaxUser }: Props) {
  const [items, setItems] = useState<ExecutiveShowcaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<ExecutiveShowcaseItem | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [filterType, setFilterType] = useState('')

  useEffect(() => {
    if (!isMaxUser && !isOwner) { setLoading(false); return }
    const loader = isOwner
      ? api.getMyExecutiveShowcase()
      : api.getUserExecutiveShowcase(userId)
    loader
      .then((d: any) => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId, isOwner, isMaxUser])

  const saveItems = async (newItems: ExecutiveShowcaseItem[]) => {
    setSaving(true)
    try {
      await api.updateMyExecutiveShowcase(newItems)
      setItems(newItems)
    } catch (e: any) {
      alert(e?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveItem = (item: ExecutiveShowcaseItem) => {
    const existing = items.findIndex(i => i.id === item.id)
    const newItems = existing >= 0
      ? items.map(i => i.id === item.id ? item : i)
      : [...items, item]
    saveItems(newItems)
    setEditingItem(null)
    setAddingNew(false)
  }

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este item del showcase?')) return
    saveItems(items.filter(i => i.id !== id))
  }

  const visibleItems = filterType ? items.filter(i => i.type === filterType) : items

  if (!isMaxUser && !isOwner) return null
  if (loading) return <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>Cargando showcase...</div>

  return (
    <div style={{ marginTop: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22, fontWeight: 800 }}>Showcase Ejecutivo</span>
            <span style={{ padding: '2px 10px', borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '0.05em' }}>◆ MAX</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {items.length} publicación{items.length !== 1 ? 'es' : ''}, charla{items.length !== 1 ? 's' : ''} y logro{items.length !== 1 ? 's' : ''}
          </div>
        </div>
        {isOwner && !addingNew && !editingItem && (
          <button onClick={() => setAddingNew(true)}
            style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            + Agregar
          </button>
        )}
      </div>

      {/* Add / Edit form */}
      {(addingNew) && (
        <ItemForm onSave={handleSaveItem} onCancel={() => setAddingNew(false)} />
      )}
      {editingItem && (
        <ItemForm initial={editingItem} onSave={handleSaveItem} onCancel={() => setEditingItem(null)} />
      )}

      {/* Empty state */}
      {items.length === 0 && !addingNew && (
        <div style={{ padding: '40px 20px', textAlign: 'center', border: '2px dashed var(--border)', borderRadius: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
            {isOwner ? 'Tu Showcase Ejecutivo está vacío' : 'Sin publicaciones aún'}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 400, margin: '0 auto', lineHeight: 1.7 }}>
            {isOwner
              ? 'Agrega tus artículos, libros, charlas, apariciones en medios y logros. Demuestra tu trayectoria como profesional de alto nivel.'
              : 'Este usuario aún no ha publicado items en su showcase.'
            }
          </div>
          {isOwner && (
            <button onClick={() => setAddingNew(true)} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Agregar primer item
            </button>
          )}
        </div>
      )}

      {/* Filter */}
      {items.length > 0 && <FilterBar active={filterType} onChange={setFilterType} />}

      {/* Items grid */}
      {visibleItems.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {visibleItems.map(item => (
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

      {/* Executive tips for empty showcase (owner only) */}
      {items.length === 0 && isOwner && !addingNew && (
        <div style={{ marginTop: 24, padding: 20, background: 'rgba(124,58,237,0.06)', borderRadius: 14, border: '1px solid rgba(124,58,237,0.15)' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#7c3aed', marginBottom: 12 }}>💡 Qué suelen compartir los ejecutivos de alto nivel</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {[
              { icon: '📝', text: 'Artículos en medios especializados' },
              { icon: '📖', text: 'Libros escritos o recomendados' },
              { icon: '🎤', text: 'Charlas en conferencias y TEDs' },
              { icon: '📺', text: 'Apariciones en TV, podcasts y prensa' },
              { icon: '🏆', text: 'Premios y reconocimientos del sector' },
              { icon: '🚀', text: 'Proyectos o iniciativas lideradas' },
              { icon: '💡', text: 'Insights y visión sobre la industria' },
            ].map((tip, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                <span style={{ fontSize: 16 }}>{tip.icon}</span>
                {tip.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {saving && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, padding: '10px 16px', background: '#7c3aed', color: '#fff', borderRadius: 10, fontWeight: 600, fontSize: 13, zIndex: 1000 }}>
          Guardando...
        </div>
      )}
    </div>
  )
}
