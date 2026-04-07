import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'
import { BookOpen, Search, Star, Download, Clock, CheckCircle, Globe, Lock } from '../components/Icons'

interface Props {
  onNavigate: (path: string) => void
}

interface Book {
  id: string
  title: string
  author: string
  category: string
  description: string
  coverUrl?: string
  pages?: number
  year?: number
  language?: string
  rating?: number
  downloadUrl?: string
  isFree: boolean
  addedAt?: string
}

const CATEGORIES = [
  { value: '', label: 'Todas', icon: '📚' },
  { value: 'matematicas', label: 'Matematicas', icon: '📐' },
  { value: 'ciencias', label: 'Ciencias', icon: '🔬' },
  { value: 'programacion', label: 'Programacion', icon: '💻' },
  { value: 'ingenieria', label: 'Ingenieria', icon: '⚙️' },
  { value: 'medicina', label: 'Medicina', icon: '🏥' },
  { value: 'derecho', label: 'Derecho', icon: '⚖️' },
  { value: 'negocios', label: 'Negocios', icon: '📊' },
  { value: 'humanidades', label: 'Humanidades', icon: '📜' },
  { value: 'idiomas', label: 'Idiomas', icon: '🌍' },
  { value: 'arte', label: 'Arte y Diseno', icon: '🎨' },
  { value: 'psicologia', label: 'Psicologia', icon: '🧠' },
]

// Placeholder books until backend API is ready
const SAMPLE_BOOKS: Book[] = [
  { id: '1', title: 'Calculo de una variable', author: 'James Stewart', category: 'matematicas', description: 'Texto clasico de calculo diferencial e integral para estudiantes universitarios.', pages: 1200, year: 2021, language: 'Espanol', rating: 4.8, isFree: false },
  { id: '2', title: 'Fundamentos de Programacion con Python', author: 'Allen Downey', category: 'programacion', description: 'Introduccion a la programacion usando Python. Ideal para principiantes.', pages: 320, year: 2023, language: 'Espanol', rating: 4.5, isFree: true },
  { id: '3', title: 'Fisica Universitaria Vol. 1', author: 'Sears & Zemansky', category: 'ciencias', description: 'Mecanica, ondas y termodinamica para cursos introductorios de fisica.', pages: 900, year: 2020, language: 'Espanol', rating: 4.7, isFree: false },
  { id: '4', title: 'Anatomia Humana', author: 'Netter', category: 'medicina', description: 'Atlas de anatomia humana con ilustraciones detalladas.', pages: 640, year: 2022, language: 'Espanol', rating: 4.9, isFree: false },
  { id: '5', title: 'Introduccion al Derecho', author: 'Garcia Maynez', category: 'derecho', description: 'Conceptos fundamentales del derecho para estudiantes de primer ano.', pages: 450, year: 2019, language: 'Espanol', rating: 4.3, isFree: true },
  { id: '6', title: 'Administracion Estrategica', author: 'Fred David', category: 'negocios', description: 'Conceptos y casos de administracion estrategica empresarial.', pages: 680, year: 2021, language: 'Espanol', rating: 4.4, isFree: false },
  { id: '7', title: 'Algebra Lineal', author: 'Grossman', category: 'matematicas', description: 'Curso completo de algebra lineal con aplicaciones.', pages: 750, year: 2020, language: 'Espanol', rating: 4.6, isFree: true },
  { id: '8', title: 'Psicologia General', author: 'Charles Morris', category: 'psicologia', description: 'Introduccion a los principales temas de la psicologia moderna.', pages: 580, year: 2022, language: 'Espanol', rating: 4.5, isFree: false },
  { id: '9', title: 'Estructuras de Datos en Java', author: 'Mark Allen Weiss', category: 'programacion', description: 'Implementacion de estructuras de datos y algoritmos en Java.', pages: 520, year: 2023, language: 'Espanol', rating: 4.7, isFree: true },
  { id: '10', title: 'Resistencia de Materiales', author: 'Ferdinand Beer', category: 'ingenieria', description: 'Mecanica de materiales para ingenieria civil y mecanica.', pages: 800, year: 2021, language: 'Espanol', rating: 4.6, isFree: false },
  { id: '11', title: 'Historia del Arte', author: 'H.W. Janson', category: 'arte', description: 'Panorama completo de la historia del arte occidental.', pages: 960, year: 2020, language: 'Espanol', rating: 4.4, isFree: false },
  { id: '12', title: 'English Grammar in Use', author: 'Raymond Murphy', category: 'idiomas', description: 'Gramatica inglesa de nivel intermedio con ejercicios practicos.', pages: 380, year: 2022, language: 'Ingles', rating: 4.8, isFree: true },
]

export default function Biblioteca({ onNavigate }: Props) {
  const { user } = useAuth()
  const [books, setBooks] = useState<Book[]>(SAMPLE_BOOKS)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [savedBooks, setSavedBooks] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('conniku_saved_books')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch { return new Set() }
  })

  const toggleSave = (bookId: string) => {
    setSavedBooks(prev => {
      const next = new Set(prev)
      if (next.has(bookId)) next.delete(bookId); else next.add(bookId)
      localStorage.setItem('conniku_saved_books', JSON.stringify([...next]))
      return next
    })
  }

  const filtered = books.filter(b => {
    if (category && b.category !== category) return false
    if (search) {
      const q = search.toLowerCase()
      return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.description.toLowerCase().includes(q)
    }
    return true
  })

  const stars = (rating: number) => {
    const full = Math.floor(rating)
    return '★'.repeat(full) + (rating % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.ceil(rating))
  }

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{BookOpen({ size: 22 })} Biblioteca</h2>
            <p>Recursos academicos y libros de texto para tu carrera</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn btn-sm ${view === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setView('grid')}
              title="Vista cuadricula"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            </button>
            <button
              className={`btn btn-sm ${view === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setView('list')}
              title="Vista lista"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por titulo, autor o tema..."
              style={{
                width: '100%', padding: '10px 14px 10px 36px', borderRadius: 8,
                border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                color: 'var(--text-primary)', fontSize: 14,
              }}
            />
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
              {Search({ size: 16 })}
            </span>
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: '1px solid',
                borderColor: category === c.value ? 'var(--accent)' : 'var(--border-color)',
                background: category === c.value ? 'rgba(37,99,235,0.08)' : 'transparent',
                color: category === c.value ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <span style={{ fontSize: 14 }}>{c.icon}</span> {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-body">
        {/* Results count */}
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          {filtered.length} {filtered.length === 1 ? 'recurso encontrado' : 'recursos encontrados'}
          {category && ` en ${CATEGORIES.find(c => c.value === category)?.label}`}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{BookOpen({ size: 48 })}</div>
            <h3>No se encontraron recursos</h3>
            <p>Intenta con otros terminos de busqueda o categoria</p>
            {(search || category) && (
              <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={() => { setSearch(''); setCategory('') }}>
                Limpiar filtros
              </button>
            )}
          </div>
        ) : view === 'grid' ? (
          /* Grid View */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {filtered.map(book => (
              <div
                key={book.id}
                className="card"
                style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                onClick={() => setSelectedBook(book)}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
              >
                {/* Book cover placeholder */}
                <div style={{
                  height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `linear-gradient(135deg, ${getCategoryColor(book.category)}15, ${getCategoryColor(book.category)}30)`,
                  borderBottom: '1px solid var(--border-color)',
                }}>
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt="" style={{ height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: 36 }}>{CATEGORIES.find(c => c.value === book.category)?.icon || '📖'}</span>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{book.pages} paginas</div>
                    </div>
                  )}
                </div>

                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.3, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {book.title}
                    </h4>
                    <button
                      onClick={e => { e.stopPropagation(); toggleSave(book.id) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}
                      title={savedBooks.has(book.id) ? 'Quitar de guardados' : 'Guardar'}
                    >
                      <Star size={16} fill={savedBooks.has(book.id) ? '#F59E0B' : 'none'} color={savedBooks.has(book.id) ? '#F59E0B' : 'var(--text-muted)'} />
                    </button>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{book.author}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    {book.rating && (
                      <span style={{ fontSize: 12, color: '#F59E0B', letterSpacing: -1 }}>
                        {stars(book.rating)}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{book.rating}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                      background: book.isFree ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: book.isFree ? '#10B981' : '#EF4444',
                    }}>
                      {book.isFree ? 'Gratis' : 'Pro'}
                    </span>
                    {book.year && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{book.year}</span>}
                    {book.language && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{book.language}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(book => (
              <div
                key={book.id}
                className="card"
                style={{ padding: 16, cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'center' }}
                onClick={() => setSelectedBook(book)}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 8, flexShrink: 0,
                  background: `${getCategoryColor(book.category)}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                }}>
                  {CATEGORIES.find(c => c.value === book.category)?.icon || '📖'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{book.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{book.author} · {book.year} · {book.pages} pag.</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  {book.rating && <span style={{ fontSize: 12, color: '#F59E0B' }}>★ {book.rating}</span>}
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10,
                    background: book.isFree ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    color: book.isFree ? '#10B981' : '#EF4444',
                  }}>
                    {book.isFree ? 'Gratis' : 'Pro'}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); toggleSave(book.id) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                  >
                    <Star size={16} fill={savedBooks.has(book.id) ? '#F59E0B' : 'none'} color={savedBooks.has(book.id) ? '#F59E0B' : 'var(--text-muted)'} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Book Detail Modal */}
      {selectedBook && (
        <div className="modal-overlay" onClick={() => setSelectedBook(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div style={{ display: 'flex', gap: 20 }}>
              {/* Cover */}
              <div style={{
                width: 120, height: 160, borderRadius: 8, flexShrink: 0,
                background: `linear-gradient(135deg, ${getCategoryColor(selectedBook.category)}20, ${getCategoryColor(selectedBook.category)}40)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--border-color)',
              }}>
                <span style={{ fontSize: 48 }}>{CATEGORIES.find(c => c.value === selectedBook.category)?.icon || '📖'}</span>
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>{selectedBook.title}</h3>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>{selectedBook.author}</div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 10,
                    background: selectedBook.isFree ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    color: selectedBook.isFree ? '#10B981' : '#EF4444',
                  }}>
                    {selectedBook.isFree ? 'Acceso gratuito' : 'Requiere Pro'}
                  </span>
                  <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                    {CATEGORIES.find(c => c.value === selectedBook.category)?.label}
                  </span>
                </div>

                {selectedBook.rating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ color: '#F59E0B', fontSize: 14 }}>{stars(selectedBook.rating)}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{selectedBook.rating}</span>
                  </div>
                )}

                <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {selectedBook.pages && <span>{selectedBook.pages} paginas</span>}
                  {selectedBook.year && <span>{selectedBook.year}</span>}
                  {selectedBook.language && <span>{selectedBook.language}</span>}
                </div>
              </div>
            </div>

            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 16 }}>
              {selectedBook.description}
            </p>

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  if (!selectedBook.isFree && user?.subscriptionStatus !== 'active' && user?.subscriptionStatus !== 'owner') {
                    onNavigate('/subscription')
                  } else {
                    alert('Recurso disponible proximamente. Estamos trabajando en la integracion.')
                  }
                }}
              >
                {selectedBook.isFree || user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'owner'
                  ? <>{BookOpen({ size: 14 })} Leer</>
                  : <>{Lock({ size: 14 })} Desbloquear con Pro</>
                }
              </button>
              <button
                className={`btn ${savedBooks.has(selectedBook.id) ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => toggleSave(selectedBook.id)}
              >
                {Star({ size: 14 })} {savedBooks.has(selectedBook.id) ? 'Guardado' : 'Guardar'}
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedBook(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    matematicas: '#2D62C8', ciencias: '#0891B2', programacion: '#7C3AED',
    ingenieria: '#D97706', medicina: '#DC2626', derecho: '#4338CA',
    negocios: '#059669', humanidades: '#92400E', idiomas: '#0284C7',
    arte: '#DB2777', psicologia: '#7C3AED',
  }
  return colors[category] || '#64748B'
}
