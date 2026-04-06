import React, { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../services/api'

interface Props {
  onNavigate: (path: string) => void
}

interface Tutor {
  id: string
  firstName: string
  lastName: string
  profilePhoto?: string
  title?: string
  institution?: string
  bio?: string
  experience?: string
  education?: string
  specialties: string[]
  rating: number
  totalReviews: number
  totalClasses: number
  pricePerHour: number
  groupPrice?: number
  availability?: { day: string; slots: string[] }[]
  reviews?: { id: string; authorName: string; rating: number; comment: string; date: string }[]
}

interface TutorClass {
  id: string
  title: string
  description?: string
  tutor_name: string
  tutor_user_id: string
  tutor_avatar?: string
  price: number
  date: string
  time?: string
  duration_minutes?: number
  spots_available?: number
  spots_total?: number
  category?: string
  is_program?: boolean
  program_sessions?: number
  is_enrolled?: boolean
}

interface ChatMessage {
  id: string
  sender_name: string
  sender_id: string
  is_tutor: boolean
  message: string
  created_at: string
}

const SUBJECT_AREAS = [
  'Todas', 'Matematicas', 'Fisica', 'Quimica', 'Biologia', 'Programacion',
  'Ingles', 'Historia', 'Derecho', 'Economia', 'Medicina', 'Ingenieria',
  'Contabilidad', 'Psicologia', 'Diseno', 'Musica',
]

const PRICE_RANGES = [
  { label: 'Todos', min: 0, max: Infinity },
  { label: 'Hasta $10.000', min: 0, max: 10000 },
  { label: '$10.000 - $20.000', min: 10000, max: 20000 },
  { label: '$20.000 - $35.000', min: 20000, max: 35000 },
  { label: '$35.000+', min: 35000, max: Infinity },
]

const RATING_OPTIONS = [
  { label: 'Todas', value: 0 },
  { label: '4+ estrellas', value: 4 },
  { label: '4.5+ estrellas', value: 4.5 },
]

const COMMISSION_RATE = 0.10

function getLevelBadge(totalClasses: number): { label: string; color: string; bg: string } {
  if (totalClasses >= 50) return { label: 'Premium', color: '#92400e', bg: '#fef3c7' }
  if (totalClasses >= 10) return { label: 'Regular', color: '#1e40af', bg: '#dbeafe' }
  return { label: 'Nuevo', color: '#047857', bg: '#d1fae5' }
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    const fill = rating >= i ? '#f59e0b' : rating >= i - 0.5 ? 'url(#half)' : '#d1d5db'
    stars.push(
      <svg key={i} width={size} height={size} viewBox="0 0 20 20">
        <defs>
          <linearGradient id="half">
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#d1d5db" />
          </linearGradient>
        </defs>
        <path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.33L10 13.27l-4.77 2.51.91-5.33L2.27 6.68l5.34-.78L10 1z" fill={fill} />
      </svg>
    )
  }
  return <span style={{ display: 'inline-flex', gap: 1, alignItems: 'center' }}>{stars}</span>
}

function InitialsAvatar({ name, size = 56 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

export default function TutorDirectory({ onNavigate }: Props) {
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('Todas')
  const [selectedPriceRange, setSelectedPriceRange] = useState(0)
  const [selectedRating, setSelectedRating] = useState(0)
  const [showAvailableOnly, setShowAvailableOnly] = useState(false)
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingTutor, setBookingTutor] = useState<Tutor | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Tab state
  const [activeTab, setActiveTab] = useState<'tutores' | 'clases'>('tutores')

  // Classes tab state
  const [classes, setClasses] = useState<TutorClass[]>([])
  const [classesLoading, setClassesLoading] = useState(false)
  const [activeCategories, setActiveCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [classSearchQuery, setClassSearchQuery] = useState('')

  // Chat modal state
  const [chatClassId, setChatClassId] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Booking form state
  const [bookingType, setBookingType] = useState<'individual' | 'group'>('individual')
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [bookingTopic, setBookingTopic] = useState('')
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)

  const fetchTutors = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (selectedSubject !== 'Todas') params.set('subject', selectedSubject)
      if (showAvailableOnly) params.set('available', 'true')
      const paramStr = params.toString()
      const data = await api.getTutorDirectory(paramStr || undefined)
      setTutors(Array.isArray(data) ? data : data.tutors || [])
    } catch (err) {
      console.error('Error loading tutors:', err)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedSubject, showAvailableOnly])

  useEffect(() => {
    fetchTutors()
  }, [fetchTutors])

  // Fetch classes when switching to classes tab
  const fetchClasses = useCallback(async () => {
    setClassesLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'Todas') params.set('category', selectedCategory)
      if (classSearchQuery) params.set('search', classSearchQuery)
      const paramStr = params.toString()
      const data = await api.getTutorClasses(paramStr || undefined)
      setClasses(Array.isArray(data) ? data : data.classes || [])
      if (data.active_categories) {
        setActiveCategories(data.active_categories)
      }
    } catch (err) {
      console.error('Error loading classes:', err)
    } finally {
      setClassesLoading(false)
    }
  }, [selectedCategory, classSearchQuery])

  useEffect(() => {
    if (activeTab === 'clases') {
      fetchClasses()
    }
  }, [activeTab, fetchClasses])

  // Chat functions
  const openChat = async (classId: string) => {
    setChatClassId(classId)
    setChatLoading(true)
    setChatMessages([])
    setChatInput('')
    try {
      const data = await api.getClassMessages(classId)
      setChatMessages(data.messages || [])
    } catch (err) {
      console.error('Error loading messages:', err)
    } finally {
      setChatLoading(false)
    }
  }

  const sendChatMessage = async () => {
    if (!chatClassId || !chatInput.trim() || chatSending) return
    setChatSending(true)
    try {
      const data = await api.sendClassMessage(chatClassId, chatInput.trim())
      if (data.ok && data.message) {
        setChatMessages(prev => [...prev, data.message])
      }
      setChatInput('')
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setChatSending(false)
    }
  }

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Format date in Spanish
  const formatClassDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  // Filter classes by search
  const filteredClasses = classes.filter(c => {
    if (!classSearchQuery) return true
    const q = classSearchQuery.toLowerCase()
    return (
      c.title.toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q) ||
      c.tutor_name.toLowerCase().includes(q) ||
      (c.category || '').toLowerCase().includes(q)
    )
  })

  const handleViewProfile = async (tutor: Tutor) => {
    setShowProfileModal(true)
    setProfileLoading(true)
    try {
      const full = await api.getTutorPublicProfile(tutor.id)
      setSelectedTutor({ ...tutor, ...full })
    } catch {
      setSelectedTutor(tutor)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleOpenBooking = (tutor: Tutor) => {
    setBookingTutor(tutor)
    setBookingType('individual')
    setBookingDate('')
    setBookingTime('')
    setBookingTopic('')
    setBookingSuccess(false)
    setShowBookingModal(true)
  }

  const handleSubmitBooking = async () => {
    if (!bookingTutor || !bookingDate || !bookingTime || !bookingTopic) return
    setBookingSubmitting(true)
    try {
      await api.enrollInClass(bookingTutor.id, {
        type: bookingType,
        date: bookingDate,
        time: bookingTime,
        topic: bookingTopic,
      })
      setBookingSuccess(true)
    } catch (err) {
      console.error('Error booking class:', err)
      alert('Error al agendar la clase. Intenta nuevamente.')
    } finally {
      setBookingSubmitting(false)
    }
  }

  const getBookingPrice = () => {
    if (!bookingTutor) return 0
    return bookingType === 'group' && bookingTutor.groupPrice
      ? bookingTutor.groupPrice
      : bookingTutor.pricePerHour
  }

  const filteredTutors = tutors.filter(t => {
    const priceRange = PRICE_RANGES[selectedPriceRange]
    if (t.pricePerHour < priceRange.min || t.pricePerHour > priceRange.max) return false
    if (selectedRating > 0 && t.rating < selectedRating) return false
    return true
  })

  const formatPrice = (price: number) => {
    return '$' + price.toLocaleString('es-CL')
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
            </svg>
          </span>
          Tutores Verificados
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: '6px 0 0 50px', fontSize: 15 }}>
          Aprende con profesionales verificados por Conniku
        </p>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid var(--border-color)' }}>
        {([
          { key: 'tutores' as const, label: 'Tutores' },
          { key: 'clases' as const, label: 'Clases Disponibles' },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
              border: 'none', background: 'transparent',
              color: activeTab === tab.key ? '#d97706' : 'var(--text-tertiary)',
              borderBottom: activeTab === tab.key ? '2.5px solid #f59e0b' : '2.5px solid transparent',
              marginBottom: -2, transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Tutores Tab ─── */}
      {activeTab === 'tutores' && <>

      {/* Search & Filters */}
      <div style={{
        background: 'var(--bg-secondary)', borderRadius: 14, padding: '18px 20px',
        marginBottom: 24, border: '1px solid var(--border-color)',
      }}>
        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre o especialidad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px 10px 40px', borderRadius: 10,
              border: '1px solid var(--border-color)', background: 'var(--bg-primary)',
              color: 'var(--text-primary)', fontSize: 14, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          {/* Subject */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Materia</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={{
                padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer',
              }}
            >
              {SUBJECT_AREAS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Price range */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Precio</label>
            <select
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(Number(e.target.value))}
              style={{
                padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer',
              }}
            >
              {PRICE_RANGES.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
            </select>
          </div>

          {/* Rating */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Valoracion</label>
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(Number(e.target.value))}
              style={{
                padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer',
              }}
            >
              {RATING_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {/* Availability toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Disponibilidad</label>
            <button
              onClick={() => setShowAvailableOnly(!showAvailableOnly)}
              style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500,
                border: showAvailableOnly ? '1.5px solid #f59e0b' : '1px solid var(--border-color)',
                background: showAvailableOnly ? '#fef3c7' : 'var(--bg-primary)',
                color: showAvailableOnly ? '#92400e' : 'var(--text-secondary)',
              }}
            >
              {showAvailableOnly ? 'Disponibles ahora' : 'Todos'}
            </button>
          </div>

          {/* Results count */}
          <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-tertiary)' }}>
            {filteredTutors.length} tutor{filteredTutors.length !== 1 ? 'es' : ''} encontrado{filteredTutors.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="loading-dots"><span /><span /><span /></div>
          <p style={{ color: 'var(--text-tertiary)', marginTop: 12, fontSize: 14 }}>Cargando tutores...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredTutors.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 20px', background: 'var(--bg-secondary)',
          borderRadius: 14, border: '1px solid var(--border-color)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            No se encontraron tutores
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', margin: 0 }}>
            Intenta ajustar los filtros o buscar con otros terminos
          </p>
        </div>
      )}

      {/* Tutor Cards Grid */}
      {!loading && filteredTutors.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 18,
        }}>
          {filteredTutors.map(tutor => {
            const level = getLevelBadge(tutor.totalClasses)
            const fullName = `${tutor.firstName} ${tutor.lastName}`
            return (
              <div key={tutor.id} style={{
                background: 'var(--bg-secondary)', borderRadius: 14,
                border: '1px solid var(--border-color)', overflow: 'hidden',
                transition: 'box-shadow 0.2s, transform 0.2s',
                cursor: 'default',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(245,158,11,0.12)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'none' }}
              >
                {/* Card top accent */}
                <div style={{ height: 4, background: 'linear-gradient(90deg, #f59e0b, #d97706)' }} />

                <div style={{ padding: '18px 20px' }}>
                  {/* Top row: avatar + info */}
                  <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                    {tutor.profilePhoto ? (
                      <img src={tutor.profilePhoto} alt={fullName}
                        style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <InitialsAvatar name={fullName} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {fullName}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                          background: level.bg, color: level.color, whiteSpace: 'nowrap',
                        }}>
                          {level.label}
                        </span>
                      </div>
                      {tutor.title && (
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tutor.title}
                        </p>
                      )}
                      {tutor.institution && (
                        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>
                          {tutor.institution}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <StarRating rating={tutor.rating} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#f59e0b' }}>{tutor.rating.toFixed(1)}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>({tutor.totalReviews} resena{tutor.totalReviews !== 1 ? 's' : ''})</span>
                  </div>

                  {/* Specialties */}
                  {tutor.specialties && tutor.specialties.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                      {tutor.specialties.slice(0, 4).map((s, i) => (
                        <span key={i} style={{
                          fontSize: 11, padding: '3px 10px', borderRadius: 20,
                          background: 'var(--bg-tertiary, rgba(245,158,11,0.08))',
                          color: 'var(--text-secondary)', fontWeight: 500,
                          border: '1px solid var(--border-color)',
                        }}>
                          {s}
                        </span>
                      ))}
                      {tutor.specialties.length > 4 && (
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', alignSelf: 'center' }}>
                          +{tutor.specialties.length - 4} mas
                        </span>
                      )}
                    </div>
                  )}

                  {/* Price */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16 }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: '#d97706' }}>
                      {formatPrice(tutor.pricePerHour)}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>/hora individual</span>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => handleViewProfile(tutor)}
                      style={{
                        flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
                        border: '1.5px solid #f59e0b', background: 'transparent', color: '#d97706',
                        cursor: 'pointer', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      Ver Perfil
                    </button>
                    <button
                      onClick={() => handleOpenBooking(tutor)}
                      style={{
                        flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
                        border: 'none', background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: '#fff', cursor: 'pointer', transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      Agendar Clase
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      </>}

      {/* ─── Clases Disponibles Tab ─── */}
      {activeTab === 'clases' && (
        <>
          {/* Search bar for classes */}
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: 14, padding: '18px 20px',
            marginBottom: 20, border: '1px solid var(--border-color)',
          }}>
            <div style={{ position: 'relative' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Buscar clases por nombre, tutor o categoria..."
                value={classSearchQuery}
                onChange={(e) => setClassSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px 10px 40px', borderRadius: 10,
                  border: '1px solid var(--border-color)', background: 'var(--bg-primary)',
                  color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {['Todas', ...activeCategories].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                  border: selectedCategory === cat ? '1.5px solid #f59e0b' : '1px solid var(--border-color)',
                  background: selectedCategory === cat ? '#fef3c7' : 'var(--bg-secondary)',
                  color: selectedCategory === cat ? '#92400e' : 'var(--text-secondary)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Loading */}
          {classesLoading && (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div className="loading-dots"><span /><span /><span /></div>
              <p style={{ color: 'var(--text-tertiary)', marginTop: 12, fontSize: 14 }}>Cargando clases...</p>
            </div>
          )}

          {/* Empty state */}
          {!classesLoading && filteredClasses.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '60px 20px', background: 'var(--bg-secondary)',
              borderRadius: 14, border: '1px solid var(--border-color)',
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                No hay clases disponibles
              </p>
              <p style={{ fontSize: 14, color: 'var(--text-tertiary)', margin: 0 }}>
                Intenta ajustar los filtros o vuelve mas tarde
              </p>
            </div>
          )}

          {/* Class Cards Grid */}
          {!classesLoading && filteredClasses.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 18,
            }}>
              {filteredClasses.map(cls => (
                <div key={cls.id} style={{
                  background: 'var(--bg-secondary)', borderRadius: 14,
                  border: '1px solid var(--border-color)', overflow: 'hidden',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  cursor: 'pointer',
                }}
                  onClick={() => onNavigate('/user/' + cls.tutor_user_id)}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(245,158,11,0.12)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'none' }}
                >
                  {/* Card top accent */}
                  <div style={{ height: 4, background: 'linear-gradient(90deg, #f59e0b, #d97706)' }} />

                  <div style={{ padding: '18px 20px' }}>
                    {/* Category badge + program badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      {cls.category && (
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                          background: 'rgba(245,158,11,0.1)', color: '#92400e',
                        }}>
                          {cls.category}
                        </span>
                      )}
                      {cls.is_program && (
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                          background: '#dbeafe', color: '#1e40af',
                        }}>
                          Programa ({cls.program_sessions} sesiones)
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 style={{
                      fontSize: 16, fontWeight: 700, color: 'var(--text-primary)',
                      margin: '0 0 8px', lineHeight: 1.3,
                    }}>
                      {cls.title}
                    </h3>

                    {/* Description */}
                    {cls.description && (
                      <p style={{
                        fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 14px',
                        lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {cls.description}
                      </p>
                    )}

                    {/* Tutor info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      {cls.tutor_avatar ? (
                        <img src={cls.tutor_avatar} alt={cls.tutor_name}
                          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <InitialsAvatar name={cls.tutor_name} size={32} />
                      )}
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {cls.tutor_name}
                      </span>
                    </div>

                    {/* Date, duration, spots */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 14, fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {cls.date && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          {formatClassDate(cls.date)}{cls.time ? ` - ${cls.time}` : ''}
                        </span>
                      )}
                      {cls.duration_minutes && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                          </svg>
                          {cls.duration_minutes} min
                        </span>
                      )}
                      {cls.spots_available != null && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          {cls.spots_available}{cls.spots_total ? `/${cls.spots_total}` : ''} cupos
                        </span>
                      )}
                    </div>

                    {/* Price + Chat button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 22, fontWeight: 700, color: '#d97706' }}>
                        {formatPrice(cls.price)}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); openChat(cls.id) }}
                        title="Chat de la clase"
                        style={{
                          width: 36, height: 36, borderRadius: 10, border: '1.5px solid #f59e0b',
                          background: 'transparent', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.06)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── Class Chat Modal ─── */}
      {chatClassId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', padding: 20,
        }} onClick={() => setChatClassId(null)}>
          <div style={{
            background: 'var(--bg-primary)', borderRadius: 16, width: '100%', maxWidth: 520,
            height: '70vh', display: 'flex', flexDirection: 'column', position: 'relative',
          }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Chat de la Clase</h3>
              <button onClick={() => setChatClassId(null)} style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', fontSize: 18,
              }}>x</button>
            </div>

            {/* Messages area */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '16px 20px',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              {chatLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div className="loading-dots"><span /><span /><span /></div>
                  <p style={{ color: 'var(--text-tertiary)', marginTop: 12, fontSize: 13 }}>Cargando mensajes...</p>
                </div>
              ) : chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>No hay mensajes aun. Envia el primero.</p>
                </div>
              ) : (
                chatMessages.map(msg => (
                  <div key={msg.id} style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: msg.is_tutor ? 'flex-start' : 'flex-end',
                  }}>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 3, paddingLeft: 4, paddingRight: 4 }}>
                      {msg.sender_name}
                    </span>
                    <div style={{
                      maxWidth: '75%', padding: '10px 14px', borderRadius: 14,
                      background: msg.is_tutor ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: msg.is_tutor ? 'var(--text-primary)' : '#fff',
                      border: msg.is_tutor ? '1px solid var(--border-color)' : 'none',
                      fontSize: 14, lineHeight: 1.5,
                    }}>
                      {msg.message}
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3, paddingLeft: 4, paddingRight: 4 }}>
                      {new Date(msg.created_at).toLocaleString('es-CL', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <div style={{
              padding: '12px 20px', borderTop: '1px solid var(--border-color)',
              display: 'flex', gap: 10, flexShrink: 0,
            }}>
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage() } }}
                placeholder="Escribe un mensaje..."
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 10,
                  border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                }}
              />
              <button
                onClick={sendChatMessage}
                disabled={chatSending || !chatInput.trim()}
                style={{
                  padding: '10px 18px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                  border: 'none', cursor: chatSending || !chatInput.trim() ? 'not-allowed' : 'pointer',
                  background: chatSending || !chatInput.trim() ? 'var(--border-color)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: chatSending || !chatInput.trim() ? 'var(--text-tertiary)' : '#fff',
                  transition: 'opacity 0.15s',
                }}
              >
                {chatSending ? '...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tutor Profile Modal ─── */}
      {showProfileModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', padding: 20,
        }} onClick={() => setShowProfileModal(false)}>
          <div style={{
            background: 'var(--bg-primary)', borderRadius: 16, width: '100%', maxWidth: 640,
            maxHeight: '85vh', overflow: 'auto', position: 'relative',
          }} onClick={e => e.stopPropagation()}>
            {/* Modal close */}
            <button onClick={() => setShowProfileModal(false)} style={{
              position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 8,
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)', fontSize: 18, zIndex: 2,
            }}>
              x
            </button>

            {/* Accent bar */}
            <div style={{ height: 5, background: 'linear-gradient(90deg, #f59e0b, #d97706)', borderRadius: '16px 16px 0 0' }} />

            {profileLoading ? (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <div className="loading-dots"><span /><span /><span /></div>
              </div>
            ) : selectedTutor && (
              <div style={{ padding: '24px 28px' }}>
                {/* Header */}
                <div style={{ display: 'flex', gap: 18, marginBottom: 20 }}>
                  {selectedTutor.profilePhoto ? (
                    <img src={selectedTutor.profilePhoto} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <InitialsAvatar name={`${selectedTutor.firstName} ${selectedTutor.lastName}`} size={80} />
                  )}
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                      {selectedTutor.firstName} {selectedTutor.lastName}
                    </h2>
                    {selectedTutor.title && <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 2px' }}>{selectedTutor.title}</p>}
                    {selectedTutor.institution && <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '0 0 8px' }}>{selectedTutor.institution}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <StarRating rating={selectedTutor.rating} size={16} />
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#f59e0b' }}>{selectedTutor.rating.toFixed(1)}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>({selectedTutor.totalReviews} resenas)</span>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, marginLeft: 6,
                        ...(() => { const l = getLevelBadge(selectedTutor.totalClasses); return { background: l.bg, color: l.color } })(),
                      }}>
                        {getLevelBadge(selectedTutor.totalClasses).label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {selectedTutor.bio && (
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Acerca de</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{selectedTutor.bio}</p>
                  </div>
                )}

                {/* Experience */}
                {selectedTutor.experience && (
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Experiencia</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{selectedTutor.experience}</p>
                  </div>
                )}

                {/* Education */}
                {selectedTutor.education && (
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Formacion</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{selectedTutor.education}</p>
                  </div>
                )}

                {/* Specialties */}
                {selectedTutor.specialties && selectedTutor.specialties.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Especialidades</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {selectedTutor.specialties.map((s, i) => (
                        <span key={i} style={{
                          fontSize: 12, padding: '4px 12px', borderRadius: 20,
                          background: 'rgba(245,158,11,0.1)', color: '#92400e', fontWeight: 500,
                        }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing */}
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Precios</h3>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{
                      flex: 1, padding: '14px 16px', borderRadius: 12, background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)', textAlign: 'center',
                    }}>
                      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '0 0 4px' }}>Individual</p>
                      <p style={{ fontSize: 20, fontWeight: 700, color: '#d97706', margin: 0 }}>{formatPrice(selectedTutor.pricePerHour)}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '2px 0 0' }}>por hora</p>
                    </div>
                    {selectedTutor.groupPrice && (
                      <div style={{
                        flex: 1, padding: '14px 16px', borderRadius: 12, background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)', textAlign: 'center',
                      }}>
                        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '0 0 4px' }}>Grupal (2-5 personas)</p>
                        <p style={{ fontSize: 20, fontWeight: 700, color: '#d97706', margin: 0 }}>{formatPrice(selectedTutor.groupPrice)}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '2px 0 0' }}>por hora / por persona</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Availability */}
                {selectedTutor.availability && selectedTutor.availability.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Horarios Disponibles</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {selectedTutor.availability.map((slot, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px',
                          borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                        }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', minWidth: 80 }}>{slot.day}</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {slot.slots.map((time, j) => (
                              <span key={j} style={{
                                fontSize: 12, padding: '2px 10px', borderRadius: 6,
                                background: 'rgba(245,158,11,0.08)', color: '#92400e', fontWeight: 500,
                              }}>{time}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviews */}
                {selectedTutor.reviews && selectedTutor.reviews.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Resenas</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {selectedTutor.reviews.slice(0, 5).map(review => (
                        <div key={review.id} style={{
                          padding: '12px 16px', borderRadius: 10, background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{review.authorName}</span>
                            <StarRating rating={review.rating} size={12} />
                          </div>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 4px', lineHeight: 1.5 }}>{review.comment}</p>
                          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                            {new Date(review.date).toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <button
                  onClick={() => { setShowProfileModal(false); handleOpenBooking(selectedTutor) }}
                  style={{
                    width: '100%', padding: '13px 0', borderRadius: 12, fontSize: 15, fontWeight: 700,
                    border: 'none', background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#fff', cursor: 'pointer', transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  Solicitar Clase
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Booking Modal ─── */}
      {showBookingModal && bookingTutor && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', padding: 20,
        }} onClick={() => setShowBookingModal(false)}>
          <div style={{
            background: 'var(--bg-primary)', borderRadius: 16, width: '100%', maxWidth: 480,
            maxHeight: '85vh', overflow: 'auto', position: 'relative',
          }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowBookingModal(false)} style={{
              position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 8,
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)', fontSize: 18, zIndex: 2,
            }}>x</button>

            <div style={{ height: 5, background: 'linear-gradient(90deg, #f59e0b, #d97706)', borderRadius: '16px 16px 0 0' }} />

            <div style={{ padding: '24px 28px' }}>
              {bookingSuccess ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%', background: '#d1fae5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                  }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>Clase agendada</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 20px' }}>
                    Tu solicitud fue enviada a {bookingTutor.firstName}. Recibiras una confirmacion pronto.
                  </p>
                  <button onClick={() => setShowBookingModal(false)} style={{
                    padding: '10px 32px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                    border: 'none', background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#fff', cursor: 'pointer',
                  }}>Cerrar</button>
                </div>
              ) : (
                <>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Agendar Clase</h2>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 20px' }}>
                    con {bookingTutor.firstName} {bookingTutor.lastName}
                  </p>

                  {/* Type selector */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Tipo de clase
                    </label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {(['individual', 'group'] as const).map(type => (
                        <button key={type}
                          onClick={() => setBookingType(type)}
                          style={{
                            flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.15s',
                            border: bookingType === type ? '1.5px solid #f59e0b' : '1px solid var(--border-color)',
                            background: bookingType === type ? '#fef3c7' : 'var(--bg-secondary)',
                            color: bookingType === type ? '#92400e' : 'var(--text-secondary)',
                          }}
                        >
                          {type === 'individual' ? 'Individual' : 'Grupal (2-5)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Fecha
                    </label>
                    <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: 14,
                        border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)', boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Time */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Hora
                    </label>
                    <input type="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: 14,
                        border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)', boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Topic */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Tema o materia
                    </label>
                    <textarea
                      value={bookingTopic}
                      onChange={e => setBookingTopic(e.target.value)}
                      placeholder="Describe el tema que necesitas repasar..."
                      rows={3}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: 14,
                        border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)', resize: 'vertical', fontFamily: 'inherit',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Price breakdown */}
                  <div style={{
                    padding: '14px 16px', borderRadius: 12, background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)', marginBottom: 18,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Clase ({bookingType === 'individual' ? 'individual' : 'grupal'}) - 1 hora</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{formatPrice(getBookingPrice())}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Tarifa del servicio</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{formatPrice(Math.round(getBookingPrice() * COMMISSION_RATE))}</span>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Total</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#d97706' }}>
                        {formatPrice(getBookingPrice() + Math.round(getBookingPrice() * COMMISSION_RATE))}
                      </span>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSubmitBooking}
                    disabled={bookingSubmitting || !bookingDate || !bookingTime || !bookingTopic}
                    style={{
                      width: '100%', padding: '13px 0', borderRadius: 12, fontSize: 15, fontWeight: 700,
                      border: 'none', cursor: bookingSubmitting || !bookingDate || !bookingTime || !bookingTopic ? 'not-allowed' : 'pointer',
                      background: bookingSubmitting || !bookingDate || !bookingTime || !bookingTopic
                        ? 'var(--border-color)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: bookingSubmitting || !bookingDate || !bookingTime || !bookingTopic
                        ? 'var(--text-tertiary)' : '#fff',
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {bookingSubmitting ? 'Agendando...' : 'Confirmar Clase'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
