import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'
import { formatPriceDisplay } from '../utils/currency'
import { Camera, Hourglass, MessageSquare, AlertTriangle, BookOpen, Calendar, Pencil, Image, Lock, Users, FileText, Heart, CheckCircle, GraduationCap, Globe, Zap, XCircle, EyeOff, Award, Medal, Trophy } from '../components/Icons'

const COVER_TEMPLATES = [
  // General
  { id: 'default-blue', name: 'Conniku Azul', gradient: 'linear-gradient(135deg, #1a3a6e 0%, #2D62C8 50%, #5B8DEF 100%)', career: '' },
  { id: 'default-dark', name: 'Noche de Estudio', gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', career: '' },
  { id: 'default-sunset', name: 'Atardecer', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', career: '' },
  // Medicina / Salud
  { id: 'med-1', name: 'Medicina', gradient: 'linear-gradient(135deg, #0d4e4e 0%, #1a8a8a 50%, #2dd4bf 100%)', career: 'medicina' },
  { id: 'med-2', name: 'Salud', gradient: 'linear-gradient(135deg, #065f46 0%, #059669 100%)', career: 'medicina' },
  // Ingenieria
  { id: 'eng-1', name: 'Ingenieria', gradient: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #6366f1 100%)', career: 'ingenieria' },
  { id: 'eng-2', name: 'Tecnologia', gradient: 'linear-gradient(135deg, #042f2e 0%, #0d9488 100%)', career: 'ingenieria' },
  // Derecho
  { id: 'law-1', name: 'Derecho', gradient: 'linear-gradient(135deg, #44403c 0%, #78716c 50%, #a8a29e 100%)', career: 'derecho' },
  { id: 'law-2', name: 'Justicia', gradient: 'linear-gradient(135deg, #1c1917 0%, #57534e 100%)', career: 'derecho' },
  // Negocios / Economia
  { id: 'biz-1', name: 'Negocios', gradient: 'linear-gradient(135deg, #172554 0%, #1e40af 50%, #3b82f6 100%)', career: 'negocios' },
  { id: 'biz-2', name: 'Finanzas', gradient: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #22c55e 100%)', career: 'negocios' },
  // Arte / Diseno
  { id: 'art-1', name: 'Arte', gradient: 'linear-gradient(135deg, #831843 0%, #db2777 50%, #f472b6 100%)', career: 'arte' },
  { id: 'art-2', name: 'Diseno', gradient: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 50%, #fb923c 100%)', career: 'arte' },
  // Ciencias
  { id: 'sci-1', name: 'Ciencias', gradient: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 50%, #38bdf8 100%)', career: 'ciencias' },
  { id: 'sci-2', name: 'Laboratorio', gradient: 'linear-gradient(135deg, #365314 0%, #65a30d 50%, #a3e635 100%)', career: 'ciencias' },
  // Educacion
  { id: 'edu-1', name: 'Educacion', gradient: 'linear-gradient(135deg, #581c87 0%, #9333ea 50%, #c084fc 100%)', career: 'educacion' },
  // Arquitectura
  { id: 'arch-1', name: 'Arquitectura', gradient: 'linear-gradient(135deg, #27272a 0%, #52525b 50%, #a1a1aa 100%)', career: 'arquitectura' },
  // Psicologia
  { id: 'psy-1', name: 'Psicologia', gradient: 'linear-gradient(135deg, #4a1d96 0%, #7c3aed 50%, #a78bfa 100%)', career: 'psicologia' },
]

function getTemplateById(id: string) {
  return COVER_TEMPLATES.find(t => t.id === id)
}

function getCoverStyle(coverPhoto: string, coverType: string): React.CSSProperties {
  if (coverType === 'custom' && coverPhoto) {
    return { backgroundImage: `url(${coverPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  }
  if (coverType === 'template' && coverPhoto) {
    const tpl = getTemplateById(coverPhoto)
    if (tpl) return { background: tpl.gradient }
  }
  return { background: 'linear-gradient(135deg, #071e3d 0%, #0a2a5e 40%, #1a1050 100%)' }
}

interface Props {
  userId: string
  onNavigate: (path: string) => void
}

export default function UserProfile({ userId, onNavigate }: Props) {
  const { user, updateProfile } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [newPost, setNewPost] = useState('')
  const [postImage, setPostImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [comments, setComments] = useState<Record<string, any[]>>({})
  const [activeTab, setActiveTab] = useState<'wall' | 'photos' | 'friends' | 'about' | 'cv' | 'courses' | 'servicios' | 'tutorias'>('wall')
  const [cvData, setCvData] = useState<any>(null)
  const [cvLoading, setCvLoading] = useState(false)
  const [completedCourses, setCompletedCourses] = useState<any[]>([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [selectedCert, setSelectedCert] = useState<any>(null)
  const [friendsList, setFriendsList] = useState<any[]>([])
  const [activityFeed, setActivityFeed] = useState<any[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [editingBio, setEditingBio] = useState(false)
  const [bioText, setBioText] = useState('')
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [showReportModal, setShowReportModal] = useState(false)
  const [postVisibility, setPostVisibility] = useState<'friends' | 'university' | 'private' | 'specific'>('friends')
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false)
  const [showTutoringModal, setShowTutoringModal] = useState(false)
  const [tutoringSubject, setTutoringSubject] = useState('')
  const [tutoringMessage, setTutoringMessage] = useState('')
  const [tutoringLoading, setTutoringLoading] = useState(false)
  const [tutoringSuccess, setTutoringSuccess] = useState(false)
  const [universityNews, setUniversityNews] = useState<any[]>([])
  const [newsLoading, setNewsLoading] = useState(false)
  const [showCoverModal, setShowCoverModal] = useState(false)
  const [coverModalTab, setCoverModalTab] = useState<'templates' | 'upload'>('templates')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [coverPreviewFile, setCoverPreviewFile] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverSaving, setCoverSaving] = useState(false)
  const [coverFilter, setCoverFilter] = useState<string>('all')
  const [tutorProfile, setTutorProfile] = useState<any>(null)
  const [tutorClasses, setTutorClasses] = useState<any[]>([])
  const [tutorPayments, setTutorPayments] = useState<any>(null)
  const [tutorLoading, setTutorLoading] = useState(false)
  // Create class form state
  const [showCreateClass, setShowCreateClass] = useState(false)
  const [ccTitle, setCcTitle] = useState('')
  const [ccDescription, setCcDescription] = useState('')
  const [ccCategory, setCcCategory] = useState('')
  const [ccMaterials, setCcMaterials] = useState('')
  const [ccZoom, setCcZoom] = useState('')
  const [ccDate, setCcDate] = useState('')
  const [ccTime, setCcTime] = useState('')
  const [ccDuration, setCcDuration] = useState(60)
  const [ccMaxStudents, setCcMaxStudents] = useState(1)
  const [ccPrice, setCcPrice] = useState('')
  const [ccMode, setCcMode] = useState<'individual' | 'program'>('individual')
  const [ccProgramTitle, setCcProgramTitle] = useState('')
  const [ccProgramDesc, setCcProgramDesc] = useState('')
  const [ccProgramSessions, setCcProgramSessions] = useState(1)
  const [ccSessionNumber, setCcSessionNumber] = useState(1)
  const [ccProgramId, setCcProgramId] = useState('')
  const [ccSubmitting, setCcSubmitting] = useState(false)
  const [ccSuccess, setCcSuccess] = useState(false)
  const [tutorCategories, setTutorCategories] = useState<string[]>([])
  // Student tutorias tab state
  const [studentClasses, setStudentClasses] = useState<any[]>([])
  const [studentClassesLoading, setStudentClassesLoading] = useState(false)
  const [studentPayments, setStudentPayments] = useState<any[]>([])
  const [studentPaymentsLoading, setStudentPaymentsLoading] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [bookingTutorId, setBookingTutorId] = useState('')
  const [bookingSubject, setBookingSubject] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [bookingType, setBookingType] = useState<'individual' | 'group'>('individual')
  const [bookingNotes, setBookingNotes] = useState('')
  const [bookingSaving, setBookingSaving] = useState(false)
  const [tutorDirectoryList, setTutorDirectoryList] = useState<any[]>([])
  const [availableTutorClasses, setAvailableTutorClasses] = useState<any[]>([])
  const [tutorClassCategories, setTutorClassCategories] = useState<string[]>([])
  const [showExamModal, setShowExamModal] = useState(false)
  const [examClassId, setExamClassId] = useState<string | null>(null)
  const [examData, setExamData] = useState<any>(null)
  const [examAnswers, setExamAnswers] = useState<Record<string, any>>({})
  const [examTimeLeft, setExamTimeLeft] = useState(3600)
  const [examSubmitting, setExamSubmitting] = useState(false)
  const [examResult, setExamResult] = useState<any>(null)
  const [examLoading, setExamLoading] = useState(false)
  const [studentClassFilter, setStudentClassFilter] = useState<'upcoming' | 'past' | 'all'>('all')
  const postImageRef = useRef<HTMLInputElement>(null)
  const coverPhotoRef = useRef<HTMLInputElement>(null)
  const coverUploadRef = useRef<HTMLInputElement>(null)
  const profilePhotoRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadProfile(); loadPosts(); loadFriends() }, [userId])
  useEffect(() => { if (user && userId === user.id) { loadActivityFeed(); loadUniversityNews() } }, [userId, user])
  useEffect(() => {
    if (user && userId === user.id) {
      api.getMyTutorProfile().then(tp => setTutorProfile(tp)).catch(() => setTutorProfile(null))
    }
  }, [userId, user])

  const loadUniversityNews = async () => {
    if (localStorage.getItem('conniku_university_news') === 'false') return
    try {
      setNewsLoading(true)
      const data = await api.getUniversityNews()
      setUniversityNews(data.items || [])
    } catch (err) { console.error('Failed to load news:', err) }
    finally { setNewsLoading(false) }
  }

  const loadCV = async () => {
    try {
      setCvLoading(true)
      const targetId = userId || user?.id
      if (!targetId) return
      const isOwn = user && userId === user.id
      const data = isOwn ? await api.getMyCV() : await api.getUserCV(targetId)
      setCvData(data)
    } catch (err) { console.error('Failed to load CV:', err) }
    finally { setCvLoading(false) }
  }

  const loadCompletedCourses = async () => {
    try {
      setCoursesLoading(true)
      const targetId = userId || user?.id
      if (!targetId) return
      const isOwn = user && userId === user.id
      const data = isOwn ? await api.getMyCertificates() : await api.getUserCertificates(targetId)
      setCompletedCourses(data || [])
    } catch (err) { console.error('Failed to load courses:', err) }
    finally { setCoursesLoading(false) }
  }

  const loadProfile = async () => {
    try {
      const data = await api.getUserProfile(userId)
      setProfile(data)
    } catch (err: any) { console.error('Failed to load profile:', err) }
    setLoading(false)
  }

  const loadPosts = async () => {
    try { setPosts(await api.getWallPosts(userId)) } catch (err: any) { console.error('Failed to load posts:', err) }
  }

  const loadFriends = async () => {
    try { setFriendsList(await api.getUserFriends(userId)) } catch (err: any) { console.error('Failed to load friends:', err) }
  }

  const loadActivityFeed = async () => {
    setActivityLoading(true)
    try { setActivityFeed(await api.getActivityFeed()) } catch (err: any) { console.error('Failed to load activity feed:', err) }
    setActivityLoading(false)
  }

  const loadTutorData = async () => {
    setTutorLoading(true)
    try {
      const [tp, classes, payments, cats] = await Promise.all([
        api.getMyTutorProfile(),
        api.getTutorClasses('role=tutor&status=upcoming'),
        api.getMyTutorPayments(),
        api.getTutorCategories().catch(() => ({ categories: [] })),
      ])
      setTutorProfile(tp)
      setTutorClasses(classes?.classes || classes?.items || classes || [])
      setTutorPayments(payments)
      setTutorCategories(cats?.categories || [])
    } catch (err) { console.error('Failed to load tutor data:', err) }
    setTutorLoading(false)
  }

  const loadStudentTutoringData = async () => {
    setStudentClassesLoading(true)
    setStudentPaymentsLoading(true)
    try {
      const [classes, payments, directory, availClasses] = await Promise.all([
        api.getMyTutoringClasses().catch(() => []),
        api.getMyTutoringPayments().catch(() => []),
        api.getTutorDirectory().catch(() => ({ items: [] })),
        api.getTutorClasses().catch(() => ({ classes: [], active_categories: [] })),
      ])
      setStudentClasses(classes?.items || classes || [])
      setStudentPayments(payments?.items || payments || [])
      setTutorDirectoryList(directory?.items || directory || [])
      setAvailableTutorClasses(availClasses?.classes || [])
      setTutorClassCategories(availClasses?.active_categories || [])
    } catch (err) { console.error('Failed to load student tutoring data:', err) }
    setStudentClassesLoading(false)
    setStudentPaymentsLoading(false)
  }

  const handleBookSession = async () => {
    if (!bookingTutorId || !bookingSubject.trim() || !bookingDate) return
    setBookingSaving(true)
    try {
      await api.bookTutoringSession({
        tutor_id: bookingTutorId,
        subject: bookingSubject,
        preferred_date: bookingDate,
        class_type: bookingType,
        notes: bookingNotes || undefined,
      })
      setShowBookingForm(false)
      setBookingTutorId('')
      setBookingSubject('')
      setBookingDate('')
      setBookingType('individual')
      setBookingNotes('')
      loadStudentTutoringData()
      // Add to calendar
      try {
        await api.createCalendarEvent({
          title: `Tutoria: ${bookingSubject}`,
          description: `Clase de tutoria - ${bookingType === 'individual' ? 'Individual' : 'Grupal'}`,
          event_type: 'tutoring',
          due_date: bookingDate,
          color: '#7c3aed',
        })
      } catch (e) { /* calendar integration optional */ }
      // Schedule notification reminders
      scheduleClassReminders(bookingSubject, bookingDate)
    } catch (err: any) { alert(err.message || 'Error al reservar sesion') }
    setBookingSaving(false)
  }

  const scheduleClassReminders = (subject: string, dateStr: string) => {
    const classTime = new Date(dateStr).getTime()
    const now = Date.now()
    const oneHourBefore = classTime - 60 * 60 * 1000
    const fifteenMinBefore = classTime - 15 * 60 * 1000
    if (oneHourBefore > now) {
      setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Tutoria en 1 hora', { body: `Tu clase de ${subject} comienza en 1 hora`, icon: '/logo.png' })
        }
      }, oneHourBefore - now)
    }
    if (fifteenMinBefore > now) {
      setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Tutoria en 15 minutos', { body: `Tu clase de ${subject} comienza en 15 minutos`, icon: '/logo.png' })
        }
      }, fifteenMinBefore - now)
    }
  }

  const handleStartExam = async (classId: string) => {
    setExamClassId(classId)
    setExamLoading(true)
    setShowExamModal(true)
    setExamResult(null)
    setExamAnswers({})
    setExamTimeLeft(3600)
    try {
      const data = await api.getTutoringExam(classId)
      setExamData(data)
    } catch (err: any) {
      alert(err.message || 'Error al cargar examen')
      setShowExamModal(false)
    }
    setExamLoading(false)
  }

  const handleSubmitExam = async () => {
    if (!examClassId) return
    setExamSubmitting(true)
    try {
      const result = await api.submitTutoringExam(examClassId, examAnswers)
      setExamResult(result)
      loadStudentTutoringData()
    } catch (err: any) { alert(err.message || 'Error al enviar examen') }
    setExamSubmitting(false)
  }

  // Exam timer effect
  useEffect(() => {
    if (!showExamModal || examResult || examLoading || !examData) return
    if (examTimeLeft <= 0) {
      handleSubmitExam()
      return
    }
    const timer = setInterval(() => {
      setExamTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [showExamModal, examResult, examLoading, examData, examTimeLeft])

  // Schedule reminders for upcoming classes on load
  useEffect(() => {
    if (studentClasses.length > 0) {
      studentClasses.forEach((cls: any) => {
        if (cls.scheduledAt && cls.status !== 'completed' && cls.status !== 'cancelled') {
          scheduleClassReminders(cls.subject || cls.topic || 'Tutoria', cls.scheduledAt)
        }
      })
    }
  }, [studentClasses])

  const handleCreateClass = async () => {
    if (!ccTitle.trim() || !ccDate || !ccTime) return
    setCcSubmitting(true)
    try {
      const scheduled_at = `${ccDate}T${ccTime}:00`
      const data: any = {
        title: ccTitle, description: ccDescription, category: ccCategory,
        materials_description: ccMaterials, zoom_link: ccZoom,
        scheduled_at, duration_minutes: ccDuration, max_students: ccMaxStudents,
        class_mode: ccMode,
      }
      if (ccPrice) data.price_per_student = parseFloat(ccPrice)
      if (ccMode === 'program') {
        data.program_title = ccProgramTitle || ccTitle
        data.program_description = ccProgramDesc
        data.program_total_sessions = ccProgramSessions
        data.program_session_number = ccSessionNumber
        if (ccProgramId) data.program_id = ccProgramId
      }
      const result = await api.createTutorClass(data)
      setCcSuccess(true)
      // Store program_id for subsequent sessions
      if (ccMode === 'program' && result?.class?.program_id) {
        setCcProgramId(result.class.program_id)
        setCcSessionNumber(prev => prev + 1)
      }
      // Reset if individual, keep program context if program
      if (ccMode === 'individual') {
        setTimeout(() => { setShowCreateClass(false); setCcSuccess(false) }, 1500)
        setCcTitle(''); setCcDescription(''); setCcCategory(''); setCcMaterials('')
        setCcZoom(''); setCcDate(''); setCcTime(''); setCcDuration(60)
        setCcMaxStudents(1); setCcPrice('')
      } else {
        setCcTitle(''); setCcDescription(''); setCcZoom(''); setCcDate(''); setCcTime('')
        setTimeout(() => setCcSuccess(false), 2000)
      }
      loadTutorData()
    } catch (err: any) { alert(err.message || 'Error al crear clase') }
    setCcSubmitting(false)
  }

  const handleSendTutoringRequest = async () => {
    if (!tutoringSubject.trim()) return
    setTutoringLoading(true)
    try {
      await api.sendMentoringRequest({ tutor_id: userId, subject: tutoringSubject, message: tutoringMessage })
      setTutoringSuccess(true)
      setTimeout(() => { setShowTutoringModal(false); setTutoringSuccess(false); setTutoringSubject(''); setTutoringMessage('') }, 2000)
    } catch (err: any) { alert(err.message || 'Error al enviar solicitud') }
    setTutoringLoading(false)
  }

  const handlePost = async () => {
    if (!newPost.trim() && !postImage) return
    try {
      await api.createWallPost(userId, newPost, postImage || undefined, postVisibility)
      setNewPost('')
      setPostImage(null)
      setPostVisibility('friends')
      loadPosts()
    } catch (err: any) {
      alert(err.message || 'Error al publicar')
    }
  }

  const handleLike = async (postId: string) => {
    try {
      const result = await api.toggleLike(postId)
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p, liked: result.liked, likes: result.liked ? p.likes + 1 : p.likes - 1
      } : p))
    } catch (err: any) {
      console.error('Error toggling like:', err)
    }
  }

  const handleComment = async (postId: string) => {
    const text = commentText[postId]
    if (!text?.trim()) return
    try {
      const comment = await api.addComment(postId, text)
      setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), comment] }))
      setCommentText(prev => ({ ...prev, [postId]: '' }))
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p))
    } catch (err: any) {
      alert(err.message || 'Error al comentar')
    }
  }

  const toggleComments = async (postId: string) => {
    if (expandedComments.has(postId)) {
      setExpandedComments(prev => { const s = new Set(prev); s.delete(postId); return s })
    } else {
      if (!comments[postId]) {
        try {
          const data = await api.getComments(postId)
          setComments(prev => ({ ...prev, [postId]: data }))
        } catch (err: any) { console.error('Failed to load comments:', err) }
      }
      setExpandedComments(prev => new Set(prev).add(postId))
    }
  }

  const handleFriendAction = async () => {
    if (!profile) return
    if (profile.friendshipStatus === 'none') {
      await api.sendFriendRequest(userId)
    } else if (profile.friendshipStatus === 'pending' && profile.friendshipId) {
      await api.acceptFriendRequest(profile.friendshipId)
    }
    loadProfile()
  }

  const handleUnfriend = async () => {
    if (!confirm('¿Eliminar a este amigo?')) return
    await api.unfriend(userId)
    loadProfile()
  }

  const handleBlock = async () => {
    if (!confirm(`¿Bloquear a ${profile?.firstName}? No podrá ver tu perfil ni contactarte.`)) return
    try {
      await api.blockUser(userId)
      setShowMoreMenu(false)
      onNavigate('/friends')
    } catch (err: any) {
      alert(err.message || 'Error al bloquear usuario')
    }
  }

  const handleReport = async () => {
    if (!reportReason.trim()) return
    try {
      await api.reportUser(userId, reportReason)
      setShowReportModal(false)
      setReportReason('')
      alert('Reporte enviado. Nuestro equipo lo revisará.')
    } catch (err: any) {
      alert(err.message || 'Error al enviar reporte')
    }
  }

  const handlePostImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setPostImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setCoverPreviewFile(reader.result as string)
    reader.readAsDataURL(file)
    setSelectedTemplate(null)
    setCoverModalTab('upload')
  }

  const handleSaveCover = async () => {
    setCoverSaving(true)
    try {
      const formData = new FormData()
      if (coverModalTab === 'upload' && coverFile) {
        formData.append('file', coverFile)
      } else if (selectedTemplate) {
        formData.append('template_id', selectedTemplate)
      } else {
        setCoverSaving(false)
        return
      }
      const result = await api.updateCoverPhoto(formData)
      setProfile((prev: any) => ({ ...prev, coverPhoto: result.coverPhoto, coverType: result.coverType }))
      updateProfile({ coverPhoto: result.coverPhoto, coverType: result.coverType } as any)
      setShowCoverModal(false)
      setSelectedTemplate(null)
      setCoverPreviewFile(null)
      setCoverFile(null)
    } catch (err: any) {
      alert(err.message || 'Error al guardar portada')
    }
    setCoverSaving(false)
  }

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      updateProfile({ avatar: reader.result as string } as any)
      setProfile((prev: any) => ({ ...prev, avatar: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const handleDeletePost = async (postId: string) => {
    try {
      await api.deleteWallPost(postId)
      setPosts(prev => prev.filter(p => p.id !== postId))
    } catch (err: any) {
      alert(err.message || 'Error al eliminar publicación')
    }
  }

  const handleSaveBio = async () => {
    try {
      await updateProfile({ bio: bioText } as any)
      setProfile((prev: any) => ({ ...prev, bio: bioText }))
      setEditingBio(false)
    } catch (err: any) {
      alert(err.message || 'Error al guardar biografía')
    }
  }

  if (loading) return <div className="page-body"><div className="loading-dots"><span /><span /><span /></div></div>
  if (!profile) return <div className="page-body"><div className="empty-state"><h3>Usuario no encontrado</h3></div></div>

  const isOwn = profile.isOwnProfile
  const isOtherUser = !isOwn
  const canPost = isOwn || profile.isFriend
  const initials = `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase()

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'ahora'
    if (mins < 60) return `hace ${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `hace ${hrs}h`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `hace ${days}d`
    return new Date(dateStr).toLocaleDateString('es')
  }

  const allPhotos = posts.filter(p => p.imageUrl).map(p => p.imageUrl)

  return (
    <div className="fb-profile-page">
      {/* LinkedIn-style Header Card */}
      <div className="li-profile-card card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
        {/* Cover */}
        <div className="fb-cover-photo" style={{
          ...getCoverStyle(profile.coverPhoto || '', profile.coverType || 'template'),
          height: 200,
        }}>
          {isOwn && (
            <button className="fb-cover-edit-btn" onClick={() => setShowCoverModal(true)}>
              {Camera({ size: 14 })} {profile.coverPhoto ? 'Cambiar portada' : 'Agregar foto de portada'}
            </button>
          )}
        </div>

        {/* Identity section inside card */}
        <div style={{ padding: '0 32px 24px', position: 'relative' }}>
          {/* Avatar overlapping cover */}
          <div className="fb-profile-photo" onClick={() => isOwn && profilePhotoRef.current?.click()} style={{ marginTop: -70, border: '5px solid var(--bg-card)', width: 140, height: 140 }}>
            {profile.avatar ? (
              <img src={profile.avatar} alt="" />
            ) : (
              <div className="fb-profile-initials">{initials}</div>
            )}
            {isOwn && (
              <>
                <input ref={profilePhotoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProfilePhotoChange} />
                <div className="fb-photo-overlay">{Camera({ size: 14 })}</div>
              </>
            )}
          </div>
          {isOwn && !profile.avatar && (
            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Sube una foto profesional tipo CV
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 12 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Sora', var(--font-sans)", letterSpacing: '-0.02em', margin: 0 }}>
                {profile.firstName} {profile.lastName}
              </h1>
              <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 4 }}>
                {profile.career || 'Estudiante'} | Semestre {profile.semester}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                {profile.university || 'Sin universidad'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--accent-blue)', marginTop: 6, cursor: 'pointer', fontWeight: 500 }}>
                {profile.friendCount > 0 ? `${profile.friendCount} conexiones` : '0 conexiones'}
              </div>

              {/* Action buttons */}
              {!isOwn && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  {profile.isFriend ? (
                    <>
                      <button className="btn btn-primary btn-sm" style={{ borderRadius: 24, background: 'var(--accent-green)', borderColor: 'var(--accent-green)' }}>✓ Amigos</button>
                      <button className="btn btn-secondary btn-sm" style={{ borderRadius: 24 }} onClick={handleUnfriend}>Eliminar</button>
                    </>
                  ) : profile.friendshipStatus === 'pending' && profile.friendshipId ? (
                    <>
                      <button className="btn btn-primary btn-sm" style={{ borderRadius: 24 }} onClick={handleFriendAction}>
                        ✓ Aceptar Solicitud
                      </button>
                      <button className="btn btn-secondary btn-sm" style={{ borderRadius: 24 }} onClick={() => { api.rejectFriendRequest(profile.friendshipId); loadProfile() }}>
                        Rechazar
                      </button>
                    </>
                  ) : profile.friendshipStatus === 'pending' ? (
                    <button className="btn btn-secondary btn-sm" style={{ borderRadius: 24, cursor: 'default', opacity: 0.8 }} disabled>
                      {Hourglass({ size: 14 })} Invitación Enviada
                    </button>
                  ) : profile.friendshipStatus === 'rejected' ? (
                    <button className="btn btn-primary btn-sm" style={{ borderRadius: 24 }} onClick={handleFriendAction}>+ Agregar Amigo</button>
                  ) : (
                    <button className="btn btn-primary btn-sm" style={{ borderRadius: 24 }} onClick={handleFriendAction}>+ Agregar Amigo</button>
                  )}
                  <button className="btn btn-secondary btn-sm" style={{ borderRadius: 24 }} onClick={() => onNavigate(`/messages?new=${userId}`)}>{MessageSquare({ size: 14 })} Mensaje</button>
                  <div style={{ position: 'relative' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowMoreMenu(!showMoreMenu)} style={{ borderRadius: 24, padding: '6px 14px' }}>Más ···</button>
                    {showMoreMenu && (
                      <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, minWidth: 220, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
                        <button onClick={handleBlock} style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>{XCircle({ size: 14 })} Bloquear usuario</button>
                        <button onClick={() => { setShowReportModal(true); setShowMoreMenu(false) }} style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>{AlertTriangle({ size: 14 })} Reportar usuario</button>
                        <button onClick={() => { alert('Usuario silenciado.'); setShowMoreMenu(false) }} style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>{EyeOff({ size: 14 })} Silenciar publicaciones</button>
                        <div style={{ height: 1, background: 'var(--border)' }} />
                        <button onClick={() => { alert('Reporte enviado.'); setShowMoreMenu(false) }} style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', textAlign: 'left', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>{AlertTriangle({ size: 14 })} No colabora en grupo</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isOwn && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn btn-secondary btn-sm" style={{ borderRadius: 24 }} onClick={() => onNavigate('/friends')}>Encuentra amigos</button>
                </div>
              )}
            </div>

            {/* Right side info */}
            <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--text-muted)', paddingTop: 4 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{profile.university || ''}</div>
              <div>Semestre {profile.semester}</div>
              <div style={{ marginTop: 2 }}>@{profile.username} #{String(profile.userNumber || 0).padStart(4, '0')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Tabs — outside header card, LinkedIn style */}
      <div className="fb-profile-tabs" style={{ marginBottom: 16, borderRadius: 'var(--radius)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
        <button className={`fb-tab ${activeTab === 'wall' ? 'active' : ''}`} onClick={() => setActiveTab('wall')}>
          Publicaciones
        </button>
        <button className={`fb-tab ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>
          Información
        </button>
        <button className={`fb-tab ${activeTab === 'photos' ? 'active' : ''}`} onClick={() => setActiveTab('photos')}>
          Fotos
        </button>
        <button className={`fb-tab ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => { setActiveTab('friends'); loadFriends() }}>
          Amigos
        </button>
        <button className={`fb-tab ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => { setActiveTab('courses'); loadCompletedCourses() }}>
          Cursos
        </button>
        <button className={`fb-tab ${activeTab === 'cv' ? 'active' : ''}`} onClick={() => { setActiveTab('cv'); loadCV() }}>
          Curriculum
        </button>
        {isOwn && tutorProfile && (
          <button
            className={`fb-tab ${activeTab === 'servicios' ? 'active' : ''}`}
            onClick={() => { setActiveTab('servicios'); loadTutorData() }}
            style={activeTab === 'servicios' ? { borderColor: '#d97706', color: '#d97706' } : {}}
          >
            Servicios
          </button>
        )}
        {isOwn && (
          <button
            className={`fb-tab ${activeTab === 'tutorias' ? 'active' : ''}`}
            onClick={() => { setActiveTab('tutorias'); loadStudentTutoringData() }}
            style={activeTab === 'tutorias' ? { borderColor: '#7c3aed', color: '#7c3aed' } : {}}
          >
            {GraduationCap({ size: 14 })} Tutorias
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="fb-profile-content">
        {activeTab === 'wall' && (
          <div className="fb-wall-layout">
            {/* Right sidebar — Academic Info + Friends */}
            <div className="fb-wall-sidebar">
              <div className="card fb-info-card">
                <h4>Información Académica</h4>
                <div className="fb-info-item"><span className="fb-info-icon">{GraduationCap({ size: 14 })}</span><span>Estudia <strong>{profile.career}</strong></span></div>
                <div className="fb-info-item"><span className="fb-info-icon">{GraduationCap({ size: 14 })}</span><span>{profile.university}</span></div>
                <div className="fb-info-item"><span className="fb-info-icon">{BookOpen({ size: 14 })}</span><span>Semestre {profile.semester}</span></div>
                {profile.studyDays > 0 && (
                  <div className="fb-info-item"><span className="fb-info-icon">{Calendar({ size: 14 })}</span><span><strong>{profile.studyDays.toLocaleString()}</strong> días estudiando</span></div>
                )}
              </div>

              {/* Tutoring card */}
              {profile.offersMentoring && (
                <div className="card fb-info-card">
                  <h4>Ofrece Tutorías</h4>
                  {profile.mentoringServices && profile.mentoringServices.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                      {profile.mentoringServices.map((s: string) => (
                        <span key={s} style={{ padding: '3px 8px', background: 'rgba(45,98,200,0.1)', color: '#2D62C8', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                          {s === 'ayudantias' ? 'Ayudantías' : s === 'cursos' ? 'Cursos' : s === 'clases_particulares' ? 'Clases particulares' : s}
                        </span>
                      ))}
                    </div>
                  )}
                  {profile.mentoringSubjects && profile.mentoringSubjects.length > 0 && (
                    <div className="fb-info-item" style={{ flexWrap: 'wrap' }}>
                      <span className="fb-info-icon">{BookOpen({ size: 14 })}</span>
                      <span style={{ fontSize: 12 }}>{profile.mentoringSubjects.join(', ')}</span>
                    </div>
                  )}
                  <div className="fb-info-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="fb-info-icon">{profile.mentoringPriceType === 'free' ? 'Gratis' : 'Precio'}</span>
                      <span style={{ fontWeight: 600, color: profile.mentoringPriceType === 'free' ? '#22c55e' : '#2D62C8' }}>
                        {profile.mentoringPriceType === 'free' ? 'Gratis' : `$${profile.mentoringPricePerHour || 0} USD/hora`}
                      </span>
                    </div>
                    {profile.mentoringPriceType === 'paid' && profile.mentoringPricePerHour && user?.country && (() => {
                      const prices = formatPriceDisplay(profile.mentoringPricePerHour, user.country)
                      return prices.localText ? (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 24 }}>≈ {prices.localText}/hora</span>
                      ) : null
                    })()}
                  </div>
                  {isOtherUser && user && profile.academicStatus !== 'estudiante' && (
                    <button onClick={() => setShowTutoringModal(true)}
                      style={{
                        width: '100%', marginTop: 8, padding: '8px 12px', background: '#2D62C8', color: '#fff',
                        border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                      }}>
                      Solicitar Tutoría
                    </button>
                  )}
                </div>
              )}

              {/* Photos card */}
              {allPhotos.length > 0 && (
                <div className="card fb-info-card">
                  <h4>Fotos</h4>
                  <div className="fb-photos-mini-grid">
                    {allPhotos.slice(0, 9).map((url, i) => (
                      <div key={i} className="fb-photo-thumb" style={{ backgroundImage: `url(${url})` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Friends mini */}
              {profile.friendCount > 0 && (
                <div className="card fb-info-card">
                  <h4>Amigos ({profile.friendCount})</h4>
                  <div className="fb-photos-mini-grid">
                    {friendsList.slice(0, 9).map(f => (
                      <div key={f.id} style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => onNavigate(`/user/${f.id}`)}>
                        <div style={{ width: '100%', aspectRatio: '1', borderRadius: 6, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', overflow: 'hidden' }}>
                          {f.avatar ? <img src={f.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : `${f.firstName?.[0] || ''}${f.lastName?.[0] || ''}`}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.firstName}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Main wall — Presentación + Posts */}
            <div className="fb-wall-main">
              {/* Presentación card — LinkedIn "About" section */}
              <div className="card fb-info-card">
                <h4>Presentación</h4>
                {editingBio ? (
                  <div style={{ marginBottom: 12 }}>
                    <textarea className="form-input" value={bioText} onChange={e => setBioText(e.target.value)} rows={3} placeholder="Escribe algo sobre ti..." maxLength={300} />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                      <button className="btn btn-secondary btn-xs" onClick={() => setEditingBio(false)}>Cancelar</button>
                      <button className="btn btn-primary btn-xs" onClick={handleSaveBio}>Guardar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {profile.bio ? (
                      <p className="fb-bio">{profile.bio}</p>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Sin presentación todavía.</p>
                    )}
                    {isOwn && (
                      <button className="btn btn-secondary btn-sm" style={{ width: '100%', borderRadius: 24, marginTop: 8 }}
                        onClick={() => { setBioText(profile.bio || ''); setEditingBio(true) }}>
                        {profile.bio ? <>{Pencil({ size: 14 })} Editar bio</> : '+ Agregar bio'}
                      </button>
                    )}
                  </>
                )}
              </div>
              {/* Post composer */}
              {canPost && (
                <div className="card fb-post-composer">
                  <div className="fb-composer-header">
                    <div className="fb-composer-avatar">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="" />
                      ) : (
                        <div className="fb-composer-initials">
                          {(user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')}
                        </div>
                      )}
                    </div>
                    <textarea
                      className="fb-composer-input"
                      placeholder={isOwn ? '¿Qué estás pensando?' : `Escribe en el muro de ${profile.firstName}...`}
                      value={newPost}
                      onChange={e => setNewPost(e.target.value)}
                      rows={2}
                    />
                  </div>
                  {postImage && (
                    <div className="fb-composer-preview">
                      <img src={postImage} alt="Preview" />
                      <button className="fb-remove-image" onClick={() => setPostImage(null)}>✕</button>
                    </div>
                  )}
                  <div className="fb-composer-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <input ref={postImageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePostImageSelect} />
                    <button className="fb-composer-action-btn" onClick={() => postImageRef.current?.click()}>
                      {Image({ size: 14 })} Foto
                    </button>
                    {/* Visibility selector */}
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
                          borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                        }}>
                        {postVisibility === 'friends' ? <>{Globe({ size: 14 })} Amigos</> :
                         postVisibility === 'university' ? <>{GraduationCap({ size: 14 })} Mi universidad</> :
                         postVisibility === 'private' ? <>{Lock({ size: 14 })} Solo yo</> : <>{Users({ size: 14 })} Específicos</>}
                        <span style={{ fontSize: 10, marginLeft: 2 }}>▼</span>
                      </button>
                      {showVisibilityMenu && (
                        <div style={{
                          position: 'absolute', bottom: '100%', left: 0, marginBottom: 4,
                          background: 'var(--bg-card)', border: '1px solid var(--border)',
                          borderRadius: 10, padding: 4, minWidth: 200, zIndex: 100,
                          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                        }}>
                          {[
                            { value: 'friends', icon: Globe({ size: 16 }), label: 'Todos mis amigos', desc: 'Visible para todos tus contactos' },
                            { value: 'university', icon: GraduationCap({ size: 16 }), label: 'Mi universidad', desc: 'Solo amigos de tu universidad' },
                            { value: 'private', icon: Lock({ size: 16 }), label: 'Solo mi muro', desc: 'Solo visible en tu perfil' },
                          ].map(opt => (
                            <button key={opt.value} type="button"
                              onClick={() => { setPostVisibility(opt.value as any); setShowVisibilityMenu(false) }}
                              style={{
                                display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%',
                                padding: '8px 10px', border: 'none', borderRadius: 8, cursor: 'pointer',
                                background: postVisibility === opt.value ? 'rgba(45,98,200,0.08)' : 'transparent',
                                color: 'var(--text-primary)', textAlign: 'left',
                              }}>
                              <span style={{ fontSize: 16 }}>{opt.icon}</span>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{opt.desc}</div>
                              </div>
                              {postVisibility === opt.value && <span style={{ marginLeft: 'auto', color: '#2D62C8', fontWeight: 700 }}>✓</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ marginLeft: 'auto' }}
                      onClick={handlePost}
                      disabled={!newPost.trim() && !postImage}
                    >
                      Publicar
                    </button>
                  </div>
                </div>
              )}

              {/* Actividad Reciente - mixed feed for own profile */}
              {isOwn && activityFeed.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: 18, fontWeight: 600 }}>Actividad Reciente</h3>
                  {activityLoading ? (
                    <div className="card" style={{ textAlign: 'center', padding: 20 }}>
                      <div className="loading-dots"><span /><span /><span /></div>
                    </div>
                  ) : (
                    activityFeed.slice(0, 5).map(item => {
                      if (item.type === 'activity') {
                        return (
                          <div key={item.id} className="card" style={{ padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 20 }}>
                              {item.activityType === 'quiz_generated' ? FileText({ size: 20 }) :
                               item.activityType === 'guide_generated' ? BookOpen({ size: 20 }) :
                               item.activityType === 'document_uploaded' ? FileText({ size: 20 }) :
                               item.activityType === 'friend_added' ? Users({ size: 20 }) : Zap({ size: 20 })}
                            </span>
                            <div>
                              <span style={{ fontSize: 14 }}>{item.content}</span>
                              <small style={{ display: 'block', color: 'var(--text-muted)', marginTop: 2 }}>{timeAgo(item.createdAt)}</small>
                            </div>
                          </div>
                        )
                      }
                      // type === "post" - friend's post
                      const isFriendPost = item.author?.id !== user?.id
                      const isOnOtherWall = item.wallOwner && item.author && item.wallOwner.id !== item.author.id
                      return (
                        <div key={item.id} className="card fb-post" style={{ marginBottom: 8 }}>
                          <div className="fb-post-header">
                            <div className="fb-post-author" onClick={() => item.author && onNavigate(`/user/${item.author.id}`)}>
                              {item.author?.avatar ? (
                                <img src={item.author.avatar} alt="" className="fb-post-avatar" />
                              ) : (
                                <div className="fb-post-avatar-initials">
                                  {(item.author?.firstName?.[0] || '') + (item.author?.lastName?.[0] || '')}
                                </div>
                              )}
                              <div>
                                <strong>{item.author?.firstName} {item.author?.lastName}</strong>
                                {isOnOtherWall && (
                                  <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>
                                    {' '}public\u00f3 en el muro de{' '}
                                    <strong
                                      style={{ cursor: 'pointer', color: 'var(--text-primary)' }}
                                      onClick={e => { e.stopPropagation(); onNavigate(`/user/${item.wallOwner.id}`) }}
                                    >
                                      {item.wallOwner.firstName} {item.wallOwner.lastName}
                                    </strong>
                                  </span>
                                )}
                                <span className="fb-post-time">{timeAgo(item.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <p className="fb-post-content">{item.content}</p>
                          {item.imageUrl && (
                            <div className="fb-post-image"><img src={item.imageUrl} alt="" /></div>
                          )}
                          <div className="fb-post-stats">
                            {item.likes > 0 && <span>{Heart({ size: 14, color: '#ef4444' })} {item.likes}</span>}
                            {item.commentCount > 0 && (
                              <span className="fb-comment-count" onClick={() => toggleComments(item.id)}>
                                {item.commentCount} comentario{item.commentCount !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <div className="fb-post-actions">
                            <button
                              className={`fb-action-btn ${item.liked ? 'liked' : ''}`}
                              onClick={() => handleLike(item.id)}
                            >
                              {Heart({ size: 14, color: item.liked ? '#ef4444' : undefined })} Me gusta
                            </button>
                            <button className="fb-action-btn" onClick={() => toggleComments(item.id)}>
                              {MessageSquare({ size: 14 })} Comentar
                            </button>
                          </div>
                          {expandedComments.has(item.id) && (
                            <div className="fb-comments-section">
                              {(comments[item.id] || []).map(c => (
                                <div key={c.id} className="fb-comment">
                                  <div className="fb-comment-avatar" onClick={() => c.author && onNavigate(`/user/${c.author.id}`)}>
                                    {c.author?.avatar ? (
                                      <img src={c.author.avatar} alt="" />
                                    ) : (
                                      <div className="fb-comment-avatar-initials">
                                        {(c.author?.firstName?.[0] || '')}
                                      </div>
                                    )}
                                  </div>
                                  <div className="fb-comment-body">
                                    <strong onClick={() => c.author && onNavigate(`/user/${c.author.id}`)}>
                                      {c.author?.firstName} {c.author?.lastName}
                                    </strong>
                                    <span>{c.content}</span>
                                    <small>{timeAgo(c.createdAt)}</small>
                                  </div>
                                </div>
                              ))}
                              <div className="fb-comment-input-row">
                                <input
                                  placeholder="Escribe un comentario..."
                                  value={commentText[item.id] || ''}
                                  onChange={e => setCommentText(prev => ({ ...prev, [item.id]: e.target.value }))}
                                  onKeyDown={e => e.key === 'Enter' && handleComment(item.id)}
                                />
                                <button className="btn btn-primary btn-xs" onClick={() => handleComment(item.id)}>
                                  Enviar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {/* University News Section - only on own profile */}
              {isOwn && localStorage.getItem('conniku_university_news') !== 'false' && (
                <div style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden', background: 'var(--bg-card, #1E252A)', border: '1px solid var(--border, #2a3038)' }}>
                  {/* Header */}
                  <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border, #2a3038)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D62C8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary, #F5F7F8)' }}>
                        Noticias de {profile.university || 'tu universidad'}
                      </h4>
                    </div>
                    {universityNews.length > 0 && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted, #8a9bae)', background: 'var(--bg-tertiary, #151B1E)', padding: '3px 8px', borderRadius: 10 }}>
                        {universityNews.length} {universityNews.length === 1 ? 'noticia' : 'noticias'}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ padding: '12px 16px' }}>
                    {newsLoading ? (
                      <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted, #8a9bae)', fontSize: 13 }}>
                        Cargando noticias...
                      </div>
                    ) : universityNews.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted, #8a9bae)', fontSize: 13, lineHeight: 1.5 }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, marginBottom: 8 }}><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/></svg>
                        <div>Las noticias de tu universidad se actualizan cada 3 horas</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {universityNews.map((item: any, idx: number) => (
                          <a
                            key={idx}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex', gap: 12, padding: 12, borderRadius: 10,
                              background: 'var(--bg-tertiary, #151B1E)', textDecoration: 'none',
                              border: '1px solid transparent', transition: 'border-color 0.2s, background 0.2s',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2D62C8'; e.currentTarget.style.background = 'rgba(45,98,200,0.06)' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'var(--bg-tertiary, #151B1E)' }}
                          >
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt=""
                                style={{ width: 72, height: 54, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                                onError={e => (e.currentTarget.style.display = 'none')}
                              />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #F5F7F8)', lineHeight: 1.4, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                {item.title}
                              </div>
                              {item.summary && (
                                <div style={{ fontSize: 12, color: 'var(--text-muted, #8a9bae)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                  {item.summary}
                                </div>
                              )}
                              {item.published && (
                                <div style={{ fontSize: 11, color: 'var(--text-muted, #6b7a8d)', marginTop: 4 }}>
                                  {item.published}
                                </div>
                              )}
                            </div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted, #6b7a8d)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                            </svg>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Posts */}
              {posts.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>{FileText({ size: 48 })}</div>
                  <p style={{ color: 'var(--text-muted)' }}>No hay publicaciones todavía</p>
                  {isOwn && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Comparte algo con tus compañeros</p>}
                </div>
              ) : (
                posts.map(post => (
                  <div key={post.id} className="card fb-post">
                    <div className="fb-post-header">
                      <div className="fb-post-author" onClick={() => post.author && onNavigate(`/user/${post.author.id}`)}>
                        {post.author?.avatar ? (
                          <img src={post.author.avatar} alt="" className="fb-post-avatar" />
                        ) : (
                          <div className="fb-post-avatar-initials">
                            {(post.author?.firstName?.[0] || '') + (post.author?.lastName?.[0] || '')}
                          </div>
                        )}
                        <div>
                          <strong>{post.author?.firstName} {post.author?.lastName}</strong>
                          <span className="fb-post-time">{timeAgo(post.createdAt)}</span>
                        </div>
                      </div>
                      {(post.author?.id === user?.id || isOwn) && (
                        <button className="fb-post-menu" onClick={() => handleDeletePost(post.id)} title="Eliminar">
                          ✕
                        </button>
                      )}
                    </div>

                    <p className="fb-post-content">{post.content}</p>

                    {post.imageUrl && (
                      <div className="fb-post-image">
                        <img src={post.imageUrl} alt="" />
                      </div>
                    )}

                    <div className="fb-post-stats">
                      {post.likes > 0 && <span>{Heart({ size: 14, color: '#ef4444' })} {post.likes}</span>}
                      {post.commentCount > 0 && (
                        <span className="fb-comment-count" onClick={() => toggleComments(post.id)}>
                          {post.commentCount} comentario{post.commentCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <div className="fb-post-actions">
                      <button
                        className={`fb-action-btn ${post.liked ? 'liked' : ''}`}
                        onClick={() => handleLike(post.id)}
                      >
                        {Heart({ size: 14, color: post.liked ? '#ef4444' : undefined })} Me gusta
                      </button>
                      <button className="fb-action-btn" onClick={() => toggleComments(post.id)}>
                        {MessageSquare({ size: 14 })} Comentar
                      </button>
                    </div>

                    {expandedComments.has(post.id) && (
                      <div className="fb-comments-section">
                        {(comments[post.id] || []).map(c => (
                          <div key={c.id} className="fb-comment">
                            <div className="fb-comment-avatar" onClick={() => c.author && onNavigate(`/user/${c.author.id}`)}>
                              {c.author?.avatar ? (
                                <img src={c.author.avatar} alt="" />
                              ) : (
                                <div className="fb-comment-avatar-initials">
                                  {(c.author?.firstName?.[0] || '')}
                                </div>
                              )}
                            </div>
                            <div className="fb-comment-body">
                              <strong onClick={() => c.author && onNavigate(`/user/${c.author.id}`)}>
                                {c.author?.firstName} {c.author?.lastName}
                              </strong>
                              <span>{c.content}</span>
                              <small>{timeAgo(c.createdAt)}</small>
                            </div>
                          </div>
                        ))}
                        <div className="fb-comment-input-row">
                          <input
                            placeholder="Escribe un comentario..."
                            value={commentText[post.id] || ''}
                            onChange={e => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
                          />
                          <button className="btn btn-primary btn-xs" onClick={() => handleComment(post.id)}>
                            Enviar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="fb-about-section">
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginTop: 0 }}>Información Personal</h3>
              <div className="fb-about-grid">
                <div className="fb-about-item">
                  <span className="fb-about-label">Nombre completo</span>
                  <span>{profile.firstName} {profile.lastName}</span>
                </div>
                <div className="fb-about-item">
                  <span className="fb-about-label">Usuario</span>
                  <span>@{profile.username} #{String(profile.userNumber || 0).padStart(4, '0')}</span>
                </div>
                <div className="fb-about-item">
                  <span className="fb-about-label">Carrera</span>
                  <span>{profile.career || 'No especificada'}</span>
                </div>
                <div className="fb-about-item">
                  <span className="fb-about-label">Universidad</span>
                  <span>{profile.university || 'No especificada'}</span>
                </div>
                <div className="fb-about-item">
                  <span className="fb-about-label">Semestre</span>
                  <span>Semestre {profile.semester}</span>
                </div>
                {profile.studyDays > 0 && (
                  <div className="fb-about-item">
                    <span className="fb-about-label">Días estudiando</span>
                    <span style={{ fontWeight: 600, color: '#2D62C8' }}>{profile.studyDays.toLocaleString()} días</span>
                  </div>
                )}
                {profile.bio && (
                  <div className="fb-about-item">
                    <span className="fb-about-label">Bio</span>
                    <span>{profile.bio}</span>
                  </div>
                )}
                <div className="fb-about-item">
                  <span className="fb-about-label">Amigos</span>
                  <span>{profile.friendCount} conexiones</span>
                </div>
                {profile.academicStatus && profile.academicStatus !== 'estudiante' && (
                  <div className="fb-about-item">
                    <span className="fb-about-label">Estado académico</span>
                    <span style={{ textTransform: 'capitalize' }}>{profile.academicStatus}</span>
                  </div>
                )}
                {profile.professionalTitle && (
                  <div className="fb-about-item">
                    <span className="fb-about-label">Título</span>
                    <span>{profile.professionalTitle}</span>
                  </div>
                )}
              </div>

              {/* Tutoring section in about */}
              {profile.offersMentoring && (
                <>
                  <h3 style={{ marginTop: 24 }}>Servicios de Tutoría</h3>
                  <div className="fb-about-grid">
                    {profile.mentoringServices && profile.mentoringServices.length > 0 && (
                      <div className="fb-about-item">
                        <span className="fb-about-label">Servicios</span>
                        <span>{profile.mentoringServices.map((s: string) => s === 'ayudantias' ? 'Ayudantías' : s === 'cursos' ? 'Cursos' : s === 'clases_particulares' ? 'Clases particulares' : s).join(', ')}</span>
                      </div>
                    )}
                    {profile.mentoringSubjects && profile.mentoringSubjects.length > 0 && (
                      <div className="fb-about-item">
                        <span className="fb-about-label">Materias</span>
                        <span>{profile.mentoringSubjects.join(', ')}</span>
                      </div>
                    )}
                    {profile.mentoringDescription && (
                      <div className="fb-about-item">
                        <span className="fb-about-label">Descripción</span>
                        <span>{profile.mentoringDescription}</span>
                      </div>
                    )}
                    <div className="fb-about-item">
                      <span className="fb-about-label">Precio</span>
                      <div>
                        <span style={{ fontWeight: 600, color: profile.mentoringPriceType === 'free' ? '#22c55e' : '#2D62C8' }}>
                          {profile.mentoringPriceType === 'free' ? 'Gratis (voluntariado)' : `$${profile.mentoringPricePerHour || 0} USD por hora`}
                        </span>
                        {profile.mentoringPriceType === 'paid' && profile.mentoringPricePerHour && user?.country && (() => {
                          const prices = formatPriceDisplay(profile.mentoringPricePerHour, user.country)
                          return prices.localText ? (
                            <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>≈ {prices.localText} (conversión aprox.)</span>
                          ) : null
                        })()}
                      </div>
                    </div>
                  </div>
                  {isOtherUser && user && (
                    <button onClick={() => setShowTutoringModal(true)}
                      style={{
                        marginTop: 12, padding: '10px 20px', background: '#2D62C8', color: '#fff',
                        border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14,
                      }}>
                      Solicitar Tutoría
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div>
            {coursesLoading ? (
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <div className="loading-dots"><span /><span /><span /></div>
                <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>Cargando cursos...</p>
              </div>
            ) : completedCourses.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ marginBottom: 12 }}>{GraduationCap({ size: 48, color: 'var(--text-muted)' })}</div>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  {isOwn ? 'Aun no has completado ningun curso. Comienza uno en la seccion de Cursos.' : 'Este usuario aun no ha completado cursos.'}
                </p>
              </div>
            ) : (
              <>
                <div className="card" style={{ padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  {Trophy({ size: 22, color: '#f59e0b' })}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{completedCourses.length} cursos completados</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Haz clic en un curso para ver el certificado</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                  {completedCourses.map((cert: any) => {
                    const catColors: Record<string, string> = {
                      comunicacion: '#0891b2', liderazgo: '#4f46e5', emocional: '#db2777',
                      pensamiento: '#0284c7', productividad: '#16a34a', carrera: '#1e40af',
                      etica: '#78716c', soft_skills: '#9333ea',
                    }
                    const accentColor = catColors[cert.courseCategory] || '#2D62C8'
                    return (
                      <div
                        key={cert.certificateId || cert.courseId}
                        onClick={() => setSelectedCert({ ...cert, accentColor })}
                        className="card"
                        style={{
                          padding: 0, cursor: 'pointer', overflow: 'hidden',
                          transition: 'transform 0.15s, box-shadow 0.15s',
                          border: '1px solid var(--border-subtle)',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                      >
                        {/* Color bar top */}
                        <div style={{ height: 4, background: accentColor }} />
                        <div style={{ padding: '16px 16px 14px' }}>
                          <div style={{ fontSize: 28, marginBottom: 8 }}>{cert.courseEmoji || '📚'}</div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 6, minHeight: 34 }}>
                            {cert.courseTitle}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                            {CheckCircle({ size: 12, color: '#22c55e' })}
                            <span>Nota: {cert.score}%</span>
                            <span style={{ margin: '0 2px' }}>·</span>
                            <span>{cert.completedAt ? new Date(cert.completedAt).toLocaleDateString('es', { month: 'short', year: 'numeric' }) : ''}</span>
                          </div>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
                            color: accentColor, fontWeight: 600,
                          }}>
                            {Award({ size: 12 })} Ver certificado
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'cv' && (
          <div>
            {cvLoading ? (
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <div className="loading-dots"><span /><span /><span /></div>
                <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>Cargando curriculum...</p>
              </div>
            ) : !cvData || (!cvData.headline && !cvData.aboutMe && (!cvData.skills || cvData.skills.length === 0) && (!cvData.experience || cvData.experience.length === 0)) ? (
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ marginBottom: 12 }}>{FileText({ size: 48, color: 'var(--text-muted)' })}</div>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  {isOwn ? 'Aun no has completado tu curriculum. Ve a Cursos > tu CV para llenarlo.' : 'Este usuario aun no ha completado su curriculum.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Headline */}
                {cvData.headline && (
                  <div className="card" style={{ padding: 20 }}>
                    <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)' }}>{cvData.headline}</h3>
                    {cvData.aboutMe && (
                      <p style={{ margin: '12px 0 0', fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{cvData.aboutMe}</p>
                    )}
                  </div>
                )}

                {/* Experience */}
                {cvData.experience && cvData.experience.length > 0 && (
                  <div className="card" style={{ padding: 20 }}>
                    <h4 style={{ margin: '0 0 14px', fontSize: 15, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {Zap({ size: 16, color: '#2D62C8' })} Experiencia
                    </h4>
                    {cvData.experience.map((exp: any, i: number) => (
                      <div key={i} style={{ marginBottom: i < cvData.experience.length - 1 ? 16 : 0, paddingBottom: i < cvData.experience.length - 1 ? 16 : 0, borderBottom: i < cvData.experience.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{exp.title}</div>
                        <div style={{ fontSize: 13, color: '#2D62C8', marginTop: 2 }}>{exp.company}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{exp.dates}</div>
                        {exp.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Projects / Portfolio */}
                {cvData.projectsPortfolio && cvData.projectsPortfolio.length > 0 && (
                  <div className="card" style={{ padding: 20 }}>
                    <h4 style={{ margin: '0 0 14px', fontSize: 15, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {BookOpen({ size: 16, color: '#2D62C8' })} Proyectos
                    </h4>
                    {cvData.projectsPortfolio.map((proj: any, i: number) => (
                      <div key={i} style={{ marginBottom: i < cvData.projectsPortfolio.length - 1 ? 16 : 0, paddingBottom: i < cvData.projectsPortfolio.length - 1 ? 16 : 0, borderBottom: i < cvData.projectsPortfolio.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{proj.title}</div>
                        {proj.role && <div style={{ fontSize: 13, color: '#2D62C8', marginTop: 2 }}>{proj.role}</div>}
                        {proj.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>{proj.description}</p>}
                        {proj.tools && proj.tools.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                            {proj.tools.map((t: string, j: number) => (
                              <span key={j} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>{t}</span>
                            ))}
                          </div>
                        )}
                        {proj.link && <a href={proj.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#2D62C8', marginTop: 6, display: 'inline-block' }}>{proj.link}</a>}
                        {proj.impact && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>{proj.impact}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Skills & Tools */}
                {((cvData.skills && cvData.skills.length > 0) || (cvData.tools && cvData.tools.length > 0)) && (
                  <div className="card" style={{ padding: 20 }}>
                    {cvData.skills && cvData.skills.length > 0 && (
                      <>
                        <h4 style={{ margin: '0 0 10px', fontSize: 15, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {CheckCircle({ size: 16, color: '#22c55e' })} Habilidades
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: cvData.tools?.length ? 18 : 0 }}>
                          {cvData.skills.map((s: string, i: number) => (
                            <span key={i} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, background: 'rgba(45,98,200,0.1)', color: '#2D62C8', fontWeight: 500, border: '1px solid rgba(45,98,200,0.2)' }}>{s}</span>
                          ))}
                        </div>
                      </>
                    )}
                    {cvData.tools && cvData.tools.length > 0 && (
                      <>
                        <h4 style={{ margin: '0 0 10px', fontSize: 15, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {Pencil({ size: 16, color: '#f59e0b' })} Herramientas
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {cvData.tools.map((t: string, i: number) => (
                            <span key={i} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontWeight: 500, border: '1px solid rgba(245,158,11,0.2)' }}>{t}</span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Languages */}
                {cvData.languagesSpoken && cvData.languagesSpoken.length > 0 && (
                  <div className="card" style={{ padding: 20 }}>
                    <h4 style={{ margin: '0 0 14px', fontSize: 15, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {Globe({ size: 16, color: '#2D62C8' })} Idiomas
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {cvData.languagesSpoken.map((l: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{l.language}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '3px 10px', borderRadius: 12 }}>{l.level}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Volunteering */}
                {cvData.volunteering && cvData.volunteering.length > 0 && (
                  <div className="card" style={{ padding: 20 }}>
                    <h4 style={{ margin: '0 0 14px', fontSize: 15, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {Heart({ size: 16, color: '#ef4444' })} Voluntariado
                    </h4>
                    {cvData.volunteering.map((v: any, i: number) => (
                      <div key={i} style={{ marginBottom: i < cvData.volunteering.length - 1 ? 12 : 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{v.role}</div>
                        <div style={{ fontSize: 13, color: '#2D62C8', marginTop: 2 }}>{v.org}</div>
                        {v.dates && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{v.dates}</div>}
                        {v.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>{v.description}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Interests */}
                {cvData.interests && cvData.interests.length > 0 && (
                  <div className="card" style={{ padding: 20 }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: 15, color: 'var(--text-primary)' }}>Intereses</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {cvData.interests.map((interest: string, i: number) => (
                        <span key={i} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>{interest}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Testimonials */}
                {cvData.testimonials && cvData.testimonials.length > 0 && (
                  <div className="card" style={{ padding: 20 }}>
                    <h4 style={{ margin: '0 0 14px', fontSize: 15, color: 'var(--text-primary)' }}>Recomendaciones</h4>
                    {cvData.testimonials.map((t: any, i: number) => (
                      <div key={i} style={{ marginBottom: i < cvData.testimonials.length - 1 ? 14 : 0, padding: 14, background: 'var(--bg-secondary)', borderRadius: 10, borderLeft: '3px solid #2D62C8' }}>
                        <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>"{t.text}"</p>
                        <div style={{ marginTop: 8, fontSize: 12 }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</span>
                          {t.role && <span style={{ color: 'var(--text-muted)' }}> — {t.role}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="fb-photos-section">
            <h3>Fotos</h3>
            {allPhotos.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{Camera({ size: 48 })}</div>
                <p style={{ color: 'var(--text-muted)' }}>No hay fotos todavía</p>
              </div>
            ) : (
              <div className="fb-photos-grid">
                {allPhotos.map((url, i) => (
                  <div key={i} className="fb-photo-item">
                    <img src={url} alt="" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="fb-friends-section">
            <h3>Amigos ({profile.friendCount})</h3>
            <div className="friends-grid">
              {friendsList.map(friend => (
                <div key={friend.id} className="friend-card card" onClick={() => onNavigate(`/user/${friend.id}`)}>
                  <div className="friend-avatar">
                    {friend.avatar ? (
                      <img src={friend.avatar} alt="" />
                    ) : (
                      <div className="friend-initials">{(friend.firstName?.[0] || '') + (friend.lastName?.[0] || '')}</div>
                    )}
                  </div>
                  <div className="friend-info">
                    <h4>{friend.firstName} {friend.lastName}</h4>
                    <span className="friend-username">@{friend.username}</span>
                    <p className="friend-meta">{friend.career}</p>
                  </div>
                </div>
              ))}
              {friendsList.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: 40, gridColumn: '1 / -1' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No hay amigos para mostrar</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'servicios' && tutorProfile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header con rol y estado */}
            <div className="card" style={{ padding: 20, borderLeft: '4px solid #d97706', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0, color: '#92400e', fontSize: 18 }}>
                    {Award({ size: 20 })} Prestador de Servicios
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#a16207' }}>
                    Rol N° {String(tutorProfile.roleNumber || tutorProfile.id || 0).padStart(4, '0')}
                  </p>
                </div>
                <span style={{
                  padding: '4px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  background: tutorProfile.status === 'approved' ? '#dcfce7' : tutorProfile.status === 'suspended' ? '#fee2e2' : '#fef9c3',
                  color: tutorProfile.status === 'approved' ? '#166534' : tutorProfile.status === 'suspended' ? '#991b1b' : '#854d0e',
                  border: `1px solid ${tutorProfile.status === 'approved' ? '#86efac' : tutorProfile.status === 'suspended' ? '#fca5a5' : '#fde047'}`
                }}>
                  {tutorProfile.status === 'approved' ? 'Aprobado' : tutorProfile.status === 'suspended' ? 'Suspendido' : 'Pendiente'}
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              <div className="card" style={{ padding: 16, textAlign: 'center', borderTop: '3px solid #d97706' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>{tutorProfile.totalStudents || 0}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Estudiantes Totales</div>
              </div>
              <div className="card" style={{ padding: 16, textAlign: 'center', borderTop: '3px solid #d97706' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>
                  {tutorProfile.averageRating ? Number(tutorProfile.averageRating).toFixed(1) : '—'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Calificación Promedio</div>
              </div>
              <div className="card" style={{ padding: 16, textAlign: 'center', borderTop: '3px solid #d97706' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>{tutorProfile.totalHours || 0}h</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Horas Impartidas</div>
              </div>
            </div>

            {/* Rating y clases */}
            <div className="card" style={{ padding: 20 }}>
              <h4 style={{ margin: '0 0 12px', color: '#92400e' }}>{Medal({ size: 16 })} Calificación y Clases</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span key={star} style={{ color: star <= Math.round(tutorProfile.averageRating || 0) ? '#f59e0b' : '#d1d5db', fontSize: 20 }}>★</span>
                  ))}
                </div>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{tutorProfile.averageRating ? Number(tutorProfile.averageRating).toFixed(1) : 'Sin calificaciones'}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>({tutorProfile.totalRatings || 0} evaluaciones)</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                Total de clases impartidas: <strong>{tutorProfile.totalClasses || 0}</strong>
              </p>
            </div>

            {/* Crear Clase / Programa */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showCreateClass ? 16 : 0 }}>
                <h4 style={{ margin: 0, color: '#92400e' }}>Crear Clase o Programa</h4>
                <button onClick={() => { setShowCreateClass(!showCreateClass); setCcSuccess(false) }}
                  style={{ padding: '6px 16px', background: showCreateClass ? 'var(--bg-secondary)' : '#d97706', color: showCreateClass ? 'var(--text-primary)' : '#fff', border: '1px solid ' + (showCreateClass ? 'var(--border)' : '#d97706'), borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  {showCreateClass ? 'Cerrar' : '+ Nueva Clase'}
                </button>
              </div>
              {showCreateClass && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {ccSuccess && <div style={{ padding: 12, background: '#dcfce7', borderRadius: 8, color: '#166534', fontWeight: 600, fontSize: 13 }}>✓ Clase creada exitosamente{ccMode === 'program' ? ` (Sesion ${ccSessionNumber - 1} de ${ccProgramSessions})` : ''}</div>}
                  {/* Mode selector */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setCcMode('individual'); setCcProgramId(''); setCcSessionNumber(1) }}
                      style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: '2px solid', borderColor: ccMode === 'individual' ? '#d97706' : 'var(--border)', background: ccMode === 'individual' ? '#fffbeb' : 'var(--bg-card)', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: ccMode === 'individual' ? '#92400e' : 'var(--text-secondary)' }}>
                      Clase Individual
                    </button>
                    <button onClick={() => setCcMode('program')}
                      style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: '2px solid', borderColor: ccMode === 'program' ? '#d97706' : 'var(--border)', background: ccMode === 'program' ? '#fffbeb' : 'var(--bg-card)', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: ccMode === 'program' ? '#92400e' : 'var(--text-secondary)' }}>
                      Programa (Multi-sesion)
                    </button>
                  </div>
                  {ccMode === 'program' && (
                    <div style={{ padding: 12, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#92400e' }}>Nombre del Programa *</label>
                          <input value={ccProgramTitle} onChange={e => setCcProgramTitle(e.target.value)} placeholder="Ej: Curso de Calculo I"
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#92400e' }}>Total de Sesiones *</label>
                          <input type="number" min={2} max={30} value={ccProgramSessions} onChange={e => setCcProgramSessions(parseInt(e.target.value) || 2)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#92400e' }}>Descripcion del Programa</label>
                        <textarea value={ccProgramDesc} onChange={e => setCcProgramDesc(e.target.value)} placeholder="Describe el programa completo..."
                          rows={2} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, resize: 'vertical', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
                      </div>
                      {ccProgramId && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#d97706', fontWeight: 600 }}>Creando sesion {ccSessionNumber} de {ccProgramSessions} — Programa ID: {ccProgramId.slice(0, 8)}...</p>}
                    </div>
                  )}
                  {/* Category */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Categoria *</label>
                    <select value={ccCategory} onChange={e => setCcCategory(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                      <option value="">Seleccionar categoria...</option>
                      {tutorCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  {/* Title & Description */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{ccMode === 'program' ? `Titulo Sesion ${ccSessionNumber}` : 'Titulo de la Clase'} *</label>
                    <input value={ccTitle} onChange={e => setCcTitle(e.target.value)} placeholder={ccMode === 'program' ? `Sesion ${ccSessionNumber}: Tema` : 'Ej: Introduccion a Derivadas'}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Descripcion detallada *</label>
                    <textarea value={ccDescription} onChange={e => setCcDescription(e.target.value)}
                      placeholder="Describe en detalle: contenidos, objetivos, requisitos previos, que aprendera el estudiante..."
                      rows={4} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, resize: 'vertical', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
                    <p style={{ fontSize: 11, color: '#d97706', margin: '4px 0 0' }}>⚠️ Eres responsable de proporcionar informacion completa. Cualquier malentendido por informacion insuficiente sera tu responsabilidad.</p>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Materiales requeridos</label>
                    <input value={ccMaterials} onChange={e => setCcMaterials(e.target.value)} placeholder="Ej: Calculadora, cuaderno, libro de texto..."
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
                  </div>
                  {/* Schedule */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Fecha *</label>
                      <input type="date" value={ccDate} onChange={e => setCcDate(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Hora *</label>
                      <input type="time" value={ccTime} onChange={e => setCcTime(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Duracion (min)</label>
                      <select value={ccDuration} onChange={e => setCcDuration(parseInt(e.target.value))}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                        {[30, 45, 60, 90, 120, 180, 240].map(m => <option key={m} value={m}>{m} min ({(m/60).toFixed(1)}h)</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Max Estudiantes</label>
                      <select value={ccMaxStudents} onChange={e => setCcMaxStudents(parseInt(e.target.value))}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} {n === 1 ? '(Individual)' : `(Grupal)`}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Precio por estudiante (CLP)</label>
                      <input type="number" value={ccPrice} onChange={e => setCcPrice(e.target.value)} placeholder="Auto (segun tarifas)"
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Link Zoom</label>
                      <input value={ccZoom} onChange={e => setCcZoom(e.target.value)} placeholder="https://zoom.us/j/..."
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <button onClick={handleCreateClass}
                    disabled={ccSubmitting || !ccTitle.trim() || !ccDate || !ccTime || !ccCategory}
                    style={{ padding: '10px 24px', background: '#d97706', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14, opacity: (ccSubmitting || !ccTitle.trim() || !ccDate || !ccTime || !ccCategory) ? 0.5 : 1 }}>
                    {ccSubmitting ? 'Creando...' : ccMode === 'program' ? `Crear Sesion ${ccSessionNumber}` : 'Publicar Clase'}
                  </button>
                </div>
              )}
            </div>

            {/* Próximas clases */}
            <div className="card" style={{ padding: 20 }}>
              <h4 style={{ margin: '0 0 12px', color: '#92400e' }}>{Calendar({ size: 16 })} Próximas Clases</h4>
              {tutorLoading ? (
                <div className="loading-dots"><span /><span /><span /></div>
              ) : tutorClasses.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tutorClasses.slice(0, 10).map((cls: any) => (
                    <div key={cls.id} style={{ padding: 12, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{cls.subject || cls.topic || 'Clase'}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            {cls.studentName || cls.student?.firstName || 'Estudiante'} — {cls.scheduledAt ? new Date(cls.scheduledAt).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha'}
                          </div>
                        </div>
                        {cls.zoomLink && (
                          <a href={cls.zoomLink} target="_blank" rel="noopener noreferrer"
                            style={{ padding: '4px 12px', background: '#2563eb', color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                            Zoom
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>No tienes clases programadas próximamente.</p>
              )}
            </div>

            {/* Resumen de pagos */}
            <div className="card" style={{ padding: 20 }}>
              <h4 style={{ margin: '0 0 12px', color: '#92400e' }}>{FileText({ size: 16 })} Resumen de Pagos</h4>
              {tutorPayments ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
                    <div style={{ padding: 12, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>Total Ganado</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#15803d' }}>
                        ${(tutorPayments.totalEarned || tutorPayments.total || 0).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ padding: 12, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                      <div style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>Pagos Pendientes</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#d97706' }}>
                        ${(tutorPayments.pendingAmount || 0).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Último Pago</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {tutorPayments.lastPaymentDate
                          ? new Date(tutorPayments.lastPaymentDate).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'Sin pagos aún'}
                      </div>
                    </div>
                  </div>
                  {(tutorPayments.pendingAmount > 0 || tutorPayments.pendingPayments?.length > 0) && (
                    <button
                      onClick={() => onNavigate('/tutor/pagos/boleta')}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', background: '#d97706', color: '#fff',
                        border: 'none', borderRadius: 8, cursor: 'pointer',
                        fontWeight: 600, fontSize: 13
                      }}
                    >
                      {FileText({ size: 14 })} Subir Boleta de Honorarios
                    </button>
                  )}
                </>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>No hay información de pagos disponible.</p>
              )}
            </div>
          </div>
        )}
        {activeTab === 'tutorias' && isOwn && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header */}
            <div className="card" style={{ padding: 20, borderLeft: '4px solid #7c3aed', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0, color: '#5b21b6', fontSize: 18 }}>
                    {GraduationCap({ size: 20 })} Mis Tutorias
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#7c3aed' }}>
                    Gestiona las clases en las que estas inscrito como estudiante
                  </p>
                </div>
                <button
                  onClick={() => setShowBookingForm(true)}
                  style={{
                    padding: '8px 18px', background: '#7c3aed', color: '#fff',
                    border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {Calendar({ size: 14 })} Reservar Clase
                </button>
              </div>
            </div>

            {/* Class Filter */}
            <div style={{ display: 'flex', gap: 8 }}>
              {(['all', 'upcoming', 'past'] as const).map(f => (
                <button key={f} onClick={() => setStudentClassFilter(f)}
                  style={{
                    padding: '6px 16px', borderRadius: 20, border: '1px solid',
                    borderColor: studentClassFilter === f ? '#7c3aed' : 'var(--border)',
                    background: studentClassFilter === f ? '#7c3aed' : 'var(--bg-card)',
                    color: studentClassFilter === f ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  }}
                >
                  {f === 'all' ? 'Todas' : f === 'upcoming' ? 'Proximas' : 'Pasadas'}
                </button>
              ))}
            </div>

            {/* Enrolled Classes */}
            <div className="card" style={{ padding: 20 }}>
              <h4 style={{ margin: '0 0 14px', color: '#5b21b6' }}>{Calendar({ size: 16 })} Clases Inscritas</h4>
              {studentClassesLoading ? (
                <div className="loading-dots"><span /><span /><span /></div>
              ) : (() => {
                const now = new Date()
                const filtered = studentClasses.filter((cls: any) => {
                  if (studentClassFilter === 'all') return true
                  const clsDate = new Date(cls.scheduledAt || cls.created_at)
                  if (studentClassFilter === 'upcoming') return clsDate >= now || cls.status === 'upcoming' || cls.status === 'scheduled'
                  return clsDate < now || cls.status === 'completed' || cls.status === 'past'
                })
                return filtered.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filtered.map((cls: any) => {
                      const clsDate = cls.scheduledAt ? new Date(cls.scheduledAt) : null
                      const isUpcoming = clsDate && clsDate > now
                      const countdown = isUpcoming ? Math.max(0, clsDate.getTime() - now.getTime()) : 0
                      const cdHours = Math.floor(countdown / 3600000)
                      const cdMins = Math.floor((countdown % 3600000) / 60000)
                      const hasExam = cls.examAvailable || cls.exam_status === 'pending'
                      const examCompleted = cls.exam_status === 'completed' || cls.examScore !== undefined
                      return (
                        <div key={cls.id} style={{
                          padding: 16, borderRadius: 10, border: '1px solid',
                          borderColor: isUpcoming ? '#c4b5fd' : 'var(--border-subtle)',
                          background: isUpcoming ? 'rgba(124,58,237,0.04)' : 'var(--bg-secondary)',
                          position: 'relative',
                        }}>
                          {/* Exam badge */}
                          {hasExam && !examCompleted && (
                            <div style={{
                              position: 'absolute', top: -8, right: 12, background: '#ef4444', color: '#fff',
                              padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                              animation: 'pulse 2s infinite',
                            }}>
                              Examen Pendiente
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1 }}>
                              {/* Tutor avatar */}
                              <div style={{
                                width: 44, height: 44, borderRadius: '50%', background: '#7c3aed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0, overflow: 'hidden',
                              }}>
                                {cls.tutor?.avatar
                                  ? <img src={cls.tutor.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  : (cls.tutor?.firstName?.[0] || cls.tutorName?.[0] || 'T')}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
                                  {cls.subject || cls.topic || 'Clase de Tutoria'}
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                                  Tutor: {cls.tutor?.firstName ? `${cls.tutor.firstName} ${cls.tutor.lastName || ''}` : cls.tutorName || 'Sin asignar'}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                  {clsDate && (
                                    <span>{Calendar({ size: 12 })} {clsDate.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                  )}
                                  <span style={{ textTransform: 'capitalize' }}>{cls.classType || cls.class_type || 'individual'}</span>
                                </div>
                                {/* Countdown for upcoming */}
                                {isUpcoming && countdown > 0 && (
                                  <div style={{
                                    marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4,
                                    padding: '3px 10px', background: 'rgba(124,58,237,0.1)', borderRadius: 12,
                                    fontSize: 12, fontWeight: 600, color: '#7c3aed',
                                  }}>
                                    {Hourglass({ size: 12 })} Faltan {cdHours > 0 ? `${cdHours}h ` : ''}{cdMins}min
                                  </div>
                                )}
                                {/* Exam result in history */}
                                {examCompleted && (
                                  <div style={{
                                    marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4,
                                    padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                                    background: (cls.examScore || 0) >= 60 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                                    color: (cls.examScore || 0) >= 60 ? '#15803d' : '#dc2626',
                                  }}>
                                    {(cls.examScore || 0) >= 60 ? CheckCircle({ size: 12 }) : XCircle({ size: 12 })} Examen: {cls.examScore || 0}% — {(cls.examScore || 0) >= 60 ? 'Aprobado' : 'Reprobado'}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                              <span style={{
                                padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                                background: cls.status === 'completed' ? '#dcfce7' : cls.status === 'cancelled' ? '#fee2e2' : '#f5f3ff',
                                color: cls.status === 'completed' ? '#166534' : cls.status === 'cancelled' ? '#991b1b' : '#5b21b6',
                              }}>
                                {cls.status === 'completed' ? 'Completada' : cls.status === 'cancelled' ? 'Cancelada' : cls.status === 'confirmed' ? 'Confirmada' : 'Programada'}
                              </span>
                              {cls.zoomLink && isUpcoming && (
                                <a href={cls.zoomLink} target="_blank" rel="noopener noreferrer"
                                  style={{ padding: '4px 12px', background: '#2563eb', color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                                  Unirse
                                </a>
                              )}
                              {hasExam && !examCompleted && (
                                <button onClick={() => handleStartExam(cls.id)}
                                  style={{
                                    padding: '5px 14px', background: '#ef4444', color: '#fff',
                                    border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                  }}>
                                  Dar Examen
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                    <div style={{ marginBottom: 8 }}>{BookOpen({ size: 36, color: 'var(--text-muted)' })}</div>
                    <p style={{ fontSize: 14 }}>No tienes clases inscritas</p>
                    <p style={{ fontSize: 12 }}>Reserva una clase con un tutor del directorio</p>
                  </div>
                )
              })()}
            </div>

            {/* Available Classes from Tutors */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h4 style={{ margin: 0, color: '#5b21b6' }}>Clases Disponibles</h4>
                <button onClick={() => onNavigate('/tutores')} style={{ fontSize: 12, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  Ver todas →
                </button>
              </div>
              {tutorClassCategories.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {tutorClassCategories.slice(0, 8).map(cat => (
                    <span key={cat} style={{ padding: '4px 12px', borderRadius: 16, fontSize: 11, fontWeight: 600, background: '#ede9fe', color: '#5b21b6', border: '1px solid #c4b5fd' }}>
                      {cat}
                    </span>
                  ))}
                  {tutorClassCategories.length > 8 && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>+{tutorClassCategories.length - 8} mas</span>
                  )}
                </div>
              )}
              {availableTutorClasses.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {availableTutorClasses.slice(0, 6).map((cls: any) => (
                    <div key={cls.id} onClick={() => cls.tutor_user_id ? onNavigate(`/user/${cls.tutor_user_id}`) : null}
                      style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.15s', background: 'var(--bg-card)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#7c3aed'; (e.currentTarget as HTMLElement).style.background = '#f5f3ff' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{cls.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            {cls.tutor_name || 'Tutor'} • {cls.category || 'General'}
                            {cls.class_mode === 'program' && <span style={{ color: '#7c3aed', fontWeight: 600 }}> • Programa ({cls.program_total_sessions} sesiones)</span>}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {cls.scheduled_at ? new Date(cls.scheduled_at).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''} • {cls.duration_minutes} min • {cls.spots_available} cupos
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 15, color: '#5b21b6' }}>
                            {cls.price_per_student === 0 ? 'Gratis' : `$${(cls.price_per_student || 0).toLocaleString()}`}
                          </div>
                          {cls.tutor_rating > 0 && (
                            <div style={{ fontSize: 11, color: '#f59e0b' }}>★ {Number(cls.tutor_rating).toFixed(1)}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {availableTutorClasses.length > 6 && (
                    <button onClick={() => onNavigate('/tutores')} style={{ padding: '8px 16px', background: '#ede9fe', color: '#5b21b6', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, textAlign: 'center' }}>
                      Ver {availableTutorClasses.length - 6} clases mas
                    </button>
                  )}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, textAlign: 'center', padding: 20 }}>
                  No hay clases disponibles en este momento
                </p>
              )}
            </div>

            {/* Payment History */}
            <div className="card" style={{ padding: 20 }}>
              <h4 style={{ margin: '0 0 14px', color: '#5b21b6' }}>{FileText({ size: 16 })} Historial de Pagos</h4>
              {studentPaymentsLoading ? (
                <div className="loading-dots"><span /><span /><span /></div>
              ) : studentPayments.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)' }}>
                        <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Tutor</th>
                        <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Materia</th>
                        <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Monto</th>
                        <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Fecha</th>
                        <th style={{ textAlign: 'center', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentPayments.map((p: any, idx: number) => (
                        <tr key={p.id || idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%', background: '#7c3aed',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0, overflow: 'hidden',
                            }}>
                              {p.tutor?.avatar
                                ? <img src={p.tutor.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : (p.tutor?.firstName?.[0] || p.tutorName?.[0] || 'T')}
                            </div>
                            {p.tutor?.firstName ? `${p.tutor.firstName} ${p.tutor.lastName || ''}` : p.tutorName || 'Tutor'}
                          </td>
                          <td style={{ padding: '10px 12px' }}>{p.subject || p.topic || '—'}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#5b21b6' }}>
                            ${(p.amount || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                            {p.paidAt || p.created_at ? new Date(p.paidAt || p.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                              background: p.status === 'paid' || p.status === 'completed' ? '#dcfce7' : '#fef9c3',
                              color: p.status === 'paid' || p.status === 'completed' ? '#166534' : '#854d0e',
                            }}>
                              {p.status === 'paid' || p.status === 'completed' ? 'Pagado' : 'Pendiente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, textAlign: 'center', padding: 20 }}>
                  No tienes pagos registrados
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="modal-overlay" onClick={() => setShowBookingForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <h3 style={{ margin: '0 0 4px', color: '#5b21b6' }}>{Calendar({ size: 20 })} Reservar Clase de Tutoria</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Completa los datos para solicitar una sesion con un tutor
            </p>

            {/* Tutor select */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Tutor *</label>
              <select value={bookingTutorId} onChange={e => setBookingTutorId(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                <option value="">Seleccionar tutor</option>
                {tutorDirectoryList.map((t: any) => (
                  <option key={t.id || t.userId} value={t.id || t.userId}>
                    {t.firstName || t.name || 'Tutor'} {t.lastName || ''} — {(t.subjects || t.mentoringSubjects || []).join(', ') || 'General'}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Materia / Tema *</label>
              <input
                placeholder="Ej: Calculo Diferencial, Fisica Mecanica..."
                value={bookingSubject}
                onChange={e => setBookingSubject(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Date & Time */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Fecha y hora preferida *</label>
              <input
                type="datetime-local"
                value={bookingDate}
                onChange={e => setBookingDate(e.target.value)}
                className="form-input"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            {/* Class type */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Tipo de clase</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {(['individual', 'group'] as const).map(type => (
                  <button key={type} onClick={() => setBookingType(type)}
                    style={{
                      flex: 1, padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                      border: '2px solid', fontWeight: 600, fontSize: 13,
                      borderColor: bookingType === type ? '#7c3aed' : 'var(--border)',
                      background: bookingType === type ? 'rgba(124,58,237,0.08)' : 'var(--bg-secondary)',
                      color: bookingType === type ? '#7c3aed' : 'var(--text-secondary)',
                    }}
                  >
                    {type === 'individual' ? 'Individual' : 'Grupal'}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Notas para el tutor (opcional)</label>
              <textarea
                placeholder="Describe en que necesitas ayuda, dudas especificas, etc."
                value={bookingNotes}
                onChange={e => setBookingNotes(e.target.value)}
                rows={3}
                className="form-input"
              />
            </div>

            <div style={{ background: 'rgba(124,58,237,0.06)', borderRadius: 8, padding: '10px 12px', marginBottom: 16, border: '1px solid rgba(124,58,237,0.15)' }}>
              <p style={{ fontSize: 11, color: '#7c3aed', margin: 0 }}>
                La clase se agregara automaticamente a tu calendario con alertas 1 hora y 15 minutos antes.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowBookingForm(false)}>Cancelar</button>
              <button
                onClick={handleBookSession}
                disabled={bookingSaving || !bookingTutorId || !bookingSubject.trim() || !bookingDate}
                style={{
                  padding: '8px 20px', background: '#7c3aed', color: '#fff',
                  border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                  opacity: bookingSaving || !bookingTutorId || !bookingSubject.trim() || !bookingDate ? 0.6 : 1,
                }}
              >
                {bookingSaving ? 'Reservando...' : 'Confirmar Reserva'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exam Modal */}
      {showExamModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => {}}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{
            maxWidth: 680, maxHeight: '90vh', overflow: 'auto',
            background: 'var(--bg-card)', borderRadius: 14,
          }}>
            {examLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div className="loading-dots"><span /><span /><span /></div>
                <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>Cargando examen...</p>
              </div>
            ) : examResult ? (
              /* Exam Result */
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: (examResult.score || 0) >= 60 ? '#dcfce7' : '#fee2e2',
                  border: `3px solid ${(examResult.score || 0) >= 60 ? '#22c55e' : '#ef4444'}`,
                }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: (examResult.score || 0) >= 60 ? '#15803d' : '#dc2626' }}>
                    {examResult.score || 0}%
                  </span>
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: 22, color: (examResult.score || 0) >= 60 ? '#15803d' : '#dc2626' }}>
                  {(examResult.score || 0) >= 60 ? 'Aprobado' : 'Reprobado'}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>
                  {(examResult.score || 0) >= 60
                    ? 'Felicitaciones, has aprobado el examen.'
                    : 'No alcanzaste el puntaje minimo (60%). Puedes intentar de nuevo si el tutor lo permite.'}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  Respuestas correctas: {examResult.correct || 0} de {examResult.total || 0}
                </p>
                <button onClick={() => { setShowExamModal(false); setExamResult(null); setExamData(null); setExamAnswers({}) }}
                  className="btn btn-primary" style={{ marginTop: 16 }}>
                  Cerrar
                </button>
              </div>
            ) : examData ? (
              /* Exam Questions */
              <div>
                {/* Header with timer */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 20, paddingBottom: 14, borderBottom: '2px solid var(--border)',
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18 }}>Examen de Tutoria</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                      {examData.questions?.length || 0} preguntas
                    </p>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 8, fontWeight: 700, fontSize: 16,
                    background: examTimeLeft < 300 ? '#fee2e2' : examTimeLeft < 600 ? '#fef9c3' : 'var(--bg-secondary)',
                    color: examTimeLeft < 300 ? '#dc2626' : examTimeLeft < 600 ? '#d97706' : 'var(--text-primary)',
                    border: `1px solid ${examTimeLeft < 300 ? '#fca5a5' : examTimeLeft < 600 ? '#fde047' : 'var(--border)'}`,
                    fontFamily: 'monospace',
                  }}>
                    {Hourglass({ size: 16 })}
                    {String(Math.floor(examTimeLeft / 60)).padStart(2, '0')}:{String(examTimeLeft % 60).padStart(2, '0')}
                  </div>
                </div>

                {/* Questions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {(examData.questions || []).map((q: any, idx: number) => (
                    <div key={q.id || idx} style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10, color: 'var(--text-primary)' }}>
                        <span style={{ color: '#7c3aed', marginRight: 6 }}>{idx + 1}.</span>
                        {q.question || q.text}
                      </div>
                      {q.type === 'multiple_choice' || q.options ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {(q.options || []).map((opt: any, oi: number) => {
                            const optValue = typeof opt === 'string' ? opt : opt.text || opt.label
                            const optKey = typeof opt === 'string' ? opt : opt.id || String(oi)
                            const isSelected = examAnswers[q.id || idx] === optKey
                            return (
                              <button key={oi} onClick={() => setExamAnswers(prev => ({ ...prev, [q.id || idx]: optKey }))}
                                style={{
                                  padding: '10px 14px', borderRadius: 8, textAlign: 'left', cursor: 'pointer',
                                  border: '2px solid',
                                  borderColor: isSelected ? '#7c3aed' : 'var(--border)',
                                  background: isSelected ? 'rgba(124,58,237,0.08)' : 'transparent',
                                  color: 'var(--text-primary)', fontSize: 13,
                                }}
                              >
                                <span style={{ fontWeight: 600, marginRight: 8, color: isSelected ? '#7c3aed' : 'var(--text-muted)' }}>
                                  {String.fromCharCode(65 + oi)}.
                                </span>
                                {optValue}
                              </button>
                            )
                          })}
                        </div>
                      ) : (
                        /* Short answer */
                        <textarea
                          placeholder="Escribe tu respuesta..."
                          value={examAnswers[q.id || idx] || ''}
                          onChange={e => setExamAnswers(prev => ({ ...prev, [q.id || idx]: e.target.value }))}
                          rows={3}
                          className="form-input"
                          style={{ fontSize: 13 }}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Submit */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginTop: 20, paddingTop: 14, borderTop: '2px solid var(--border)',
                }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {Object.keys(examAnswers).length} de {examData.questions?.length || 0} respondidas
                  </span>
                  <button onClick={handleSubmitExam}
                    disabled={examSubmitting}
                    style={{
                      padding: '10px 24px', background: '#7c3aed', color: '#fff',
                      border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14,
                      opacity: examSubmitting ? 0.6 : 1,
                    }}
                  >
                    {examSubmitting ? 'Enviando...' : 'Entregar Examen'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Tutoring Request Modal */}
      {showTutoringModal && (
        <div className="modal-overlay" onClick={() => setShowTutoringModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            {tutoringSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{CheckCircle({ size: 48 })}</div>
                <h3 style={{ margin: '0 0 8px' }}>Solicitud enviada</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  {profile?.firstName} recibirá tu solicitud y podrá aceptarla o rechazarla.
                </p>
              </div>
            ) : (
              <>
                <h3 style={{ margin: '0 0 4px' }}>Solicitar tutoría a {profile?.firstName} {profile?.lastName}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  {profile?.mentoringPriceType === 'free'
                    ? 'Este tutor ofrece sus servicios de forma gratuita.'
                    : (() => {
                        const priceText = `Precio: $${profile?.mentoringPricePerHour || 0} USD/hora`
                        if (user?.country && profile?.mentoringPricePerHour) {
                          const prices = formatPriceDisplay(profile.mentoringPricePerHour, user.country)
                          return prices.localText ? `${priceText} (≈ ${prices.localText})` : priceText
                        }
                        return priceText
                      })()
                  }
                </p>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Materia o tema *</label>
                  {profile?.mentoringSubjects && profile.mentoringSubjects.length > 0 ? (
                    <select value={tutoringSubject} onChange={e => setTutoringSubject(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      <option value="">Seleccionar materia</option>
                      {profile.mentoringSubjects.map((s: string) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      <option value="__other">Otro tema</option>
                    </select>
                  ) : (
                    <input
                      placeholder="Ej: Cálculo, Física, etc."
                      value={tutoringSubject}
                      onChange={e => setTutoringSubject(e.target.value)}
                      className="form-input"
                    />
                  )}
                  {tutoringSubject === '__other' && (
                    <input
                      placeholder="Especifica el tema"
                      value=""
                      onChange={e => setTutoringSubject(e.target.value)}
                      className="form-input"
                      style={{ marginTop: 8 }}
                    />
                  )}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Mensaje (opcional)</label>
                  <textarea
                    placeholder="Describe brevemente en qué necesitas ayuda..."
                    value={tutoringMessage}
                    onChange={e => setTutoringMessage(e.target.value)}
                    rows={3}
                    className="form-input"
                  />
                </div>
                <div style={{ background: 'rgba(45,98,200,0.06)', borderRadius: 8, padding: '10px 12px', marginBottom: 16, border: '1px solid rgba(45,98,200,0.15)' }}>
                  <p style={{ fontSize: 11, color: '#2D62C8', margin: 0 }}>
                    Una vez aceptada tu solicitud, podrán coordinar todo a través del chat de Conniku.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowTutoringModal(false)}>Cancelar</button>
                  <button
                    style={{ padding: '8px 20px', background: '#2D62C8', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, opacity: tutoringLoading || !tutoringSubject.trim() ? 0.6 : 1 }}
                    onClick={handleSendTutoringRequest}
                    disabled={tutoringLoading || !tutoringSubject.trim()}>
                    {tutoringLoading ? 'Enviando...' : 'Enviar Solicitud'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3>Reportar a {profile?.firstName} {profile?.lastName}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
              Describe el motivo de tu reporte. Nuestro equipo lo revisará.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {['Contenido inapropiado', 'Acoso o bullying', 'Spam o publicidad', 'Cuenta falsa', 'No colabora en grupos de estudio'].map(reason => (
                <button key={reason} onClick={() => setReportReason(reason)}
                  style={{
                    padding: '10px 14px', background: reportReason === reason ? 'var(--accent-blue)' : 'var(--bg-primary)',
                    border: '1px solid var(--border-color)', borderRadius: 8, color: reportReason === reason ? '#fff' : 'var(--text-primary)',
                    cursor: 'pointer', textAlign: 'left', fontSize: 13,
                  }}>
                  {reason}
                </button>
              ))}
            </div>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Detalles adicionales (opcional)..."
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowReportModal(false)}>Cancelar</button>
              <button className="btn btn-danger btn-sm" onClick={handleReport} disabled={!reportReason.trim()}>Enviar Reporte</button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal — matches official PDF layout (landscape A4 style) */}
      {selectedCert && (
        <div className="modal-overlay" onClick={() => setSelectedCert(null)} style={{ zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '92%', maxWidth: 780, background: '#fff', overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative',
            aspectRatio: '1.414 / 1',
          }}>
            {/* Close button */}
            <button onClick={() => setSelectedCert(null)} style={{
              position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.1)',
              border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
              color: '#666', fontSize: 16, fontWeight: 700,
            }}>×</button>

            {/* Certificate — official model */}
            <div style={{
              width: '100%', height: '100%', background: '#FFFFFF',
              display: 'flex', flexDirection: 'column', position: 'relative',
            }}>
              {/* Top accent bar */}
              <div style={{ height: 8, background: selectedCert.accentColor, flexShrink: 0 }} />

              {/* Outer border */}
              <div style={{
                flex: 1, margin: '20px 24px 20px', border: '1px solid #E0E4E7',
                position: 'relative', display: 'flex', flexDirection: 'column',
              }}>
                {/* Inner accent border */}
                <div style={{
                  position: 'absolute', inset: 8, border: `2px solid ${selectedCert.accentColor}`,
                  pointerEvents: 'none',
                }} />

                {/* Content */}
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '28px 32px', textAlign: 'center',
                }}>
                  {/* Title */}
                  <div style={{
                    fontFamily: "'Inter', Helvetica, sans-serif", fontSize: 28, fontWeight: 700,
                    color: '#151B1E', letterSpacing: 1.5, marginBottom: 6,
                  }}>
                    CERTIFICADO DE COMPLETACION
                  </div>
                  <div style={{ fontSize: 13, color: '#4A5568', marginBottom: 28 }}>
                    Conniku — Plataforma de Aprendizaje
                  </div>

                  {/* Certifies */}
                  <div style={{ fontSize: 13, color: '#4A5568', marginBottom: 8 }}>Se certifica que</div>

                  {/* Student name */}
                  <div style={{
                    fontSize: 26, fontWeight: 700, color: selectedCert.accentColor,
                    marginBottom: 12,
                  }}>
                    {selectedCert.userName || ((profile?.firstName || '') + ' ' + (profile?.lastName || '')).trim()}
                  </div>

                  {/* Course text */}
                  <div style={{ fontSize: 13, color: '#4A5568', marginBottom: 10 }}>
                    ha completado satisfactoriamente el curso
                  </div>

                  {/* Course name */}
                  <div style={{
                    fontSize: 20, fontWeight: 700, color: '#151B1E', marginBottom: 16,
                  }}>
                    {selectedCert.courseTitle}
                  </div>

                  {/* Details */}
                  <div style={{ fontSize: 11, color: '#8E99A4', marginBottom: 24 }}>
                    {selectedCert.estimatedMinutes ? `Horas: ${Math.round(selectedCert.estimatedMinutes / 60)} · ` : ''}
                    Nota: {selectedCert.score} · Fecha: {selectedCert.completedAt ? new Date(selectedCert.completedAt).toLocaleDateString('es-CL') : ''}
                  </div>

                  {/* Signature line */}
                  <div style={{ marginTop: 'auto' }}>
                    <div style={{ width: 180, margin: '0 auto', borderBottom: '1px solid #E0E4E7', marginBottom: 6 }} />
                    <div style={{ fontSize: 10, color: '#4A5568' }}>Cristian — Fundador de Conniku</div>
                  </div>

                  {/* Verification code */}
                  {selectedCert.certificateId && (
                    <div style={{ marginTop: 16, fontSize: 9, color: '#8E99A4' }}>
                      Codigo de verificacion: {selectedCert.certificateId}<br />
                      Verificar en: conniku.com/cert/{selectedCert.certificateId}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cover Photo Modal */}
      {showCoverModal && (
        <div className="modal-overlay" onClick={() => setShowCoverModal(false)}>
          <div className="cover-modal" onClick={e => e.stopPropagation()}>
            <div className="cover-modal-header">
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Foto de Portada</h3>
              <button className="cover-modal-close" onClick={() => setShowCoverModal(false)}>{XCircle({ size: 20 })}</button>
            </div>

            {/* Preview */}
            <div className="cover-modal-preview" style={
              coverModalTab === 'upload' && coverPreviewFile
                ? { backgroundImage: `url(${coverPreviewFile})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : selectedTemplate
                  ? { background: getTemplateById(selectedTemplate)?.gradient || 'var(--bg-hover)' }
                  : getCoverStyle(profile.coverPhoto || '', profile.coverType || 'template')
            }>
              <span style={{ color: '#fff', fontSize: 13, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>Vista previa</span>
            </div>

            {/* Tabs */}
            <div className="cover-modal-tabs">
              <button
                className={`cover-modal-tab ${coverModalTab === 'templates' ? 'active' : ''}`}
                onClick={() => setCoverModalTab('templates')}
              >Plantillas</button>
              <button
                className={`cover-modal-tab ${coverModalTab === 'upload' ? 'active' : ''}`}
                onClick={() => setCoverModalTab('upload')}
              >Subir foto</button>
            </div>

            {/* Tab Content */}
            <div className="cover-modal-body">
              {coverModalTab === 'templates' && (
                <>
                  {/* Career filter */}
                  <div className="cover-filter-bar">
                    {[
                      { id: 'all', label: 'Todas' },
                      { id: 'medicina', label: 'Medicina' },
                      { id: 'ingenieria', label: 'Ingenieria' },
                      { id: 'derecho', label: 'Derecho' },
                      { id: 'negocios', label: 'Negocios' },
                      { id: 'arte', label: 'Arte' },
                      { id: 'ciencias', label: 'Ciencias' },
                      { id: 'educacion', label: 'Educacion' },
                      { id: 'arquitectura', label: 'Arquitectura' },
                      { id: 'psicologia', label: 'Psicologia' },
                    ].map(f => (
                      <button
                        key={f.id}
                        className={`cover-filter-chip ${coverFilter === f.id ? 'active' : ''}`}
                        onClick={() => setCoverFilter(f.id)}
                      >{f.label}</button>
                    ))}
                  </div>
                  <div className="cover-templates-grid">
                    {COVER_TEMPLATES
                      .filter(t => coverFilter === 'all' || t.career === coverFilter || (!t.career && coverFilter === 'all'))
                      .map(t => (
                        <button
                          key={t.id}
                          className={`cover-template-card ${selectedTemplate === t.id ? 'selected' : ''}`}
                          onClick={() => { setSelectedTemplate(t.id); setCoverPreviewFile(null); setCoverFile(null) }}
                        >
                          <div className="cover-template-swatch" style={{ background: t.gradient }} />
                          <span className="cover-template-name">{t.name}</span>
                        </button>
                      ))}
                  </div>
                </>
              )}

              {coverModalTab === 'upload' && (
                <div className="cover-upload-area">
                  <input
                    ref={coverUploadRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    style={{ display: 'none' }}
                    onChange={handleCoverChange}
                  />
                  {coverPreviewFile ? (
                    <div style={{ textAlign: 'center' }}>
                      <img src={coverPreviewFile} alt="" style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 8, marginBottom: 12 }} />
                      <div>
                        <button className="btn btn-secondary btn-sm" onClick={() => coverUploadRef.current?.click()}>
                          Cambiar imagen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className="cover-upload-btn" onClick={() => coverUploadRef.current?.click()}>
                      {Image({ size: 32 })}
                      <span style={{ fontWeight: 600, fontSize: 15 }}>Seleccionar imagen</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>JPG, PNG, WebP o GIF (max. 5MB)</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="cover-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCoverModal(false)}>Cancelar</button>
              <button
                className="btn btn-primary"
                disabled={coverSaving || (!selectedTemplate && !coverFile)}
                onClick={handleSaveCover}
              >
                {coverSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
