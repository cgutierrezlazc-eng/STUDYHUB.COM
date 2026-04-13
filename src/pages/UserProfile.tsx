import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../services/auth'
import { useI18n } from '../services/i18n'
import { api } from '../services/api'
import { formatPriceDisplay } from '../utils/currency'
import CoverPhotoModal, { getCoverStyle, getTemplateById, COVER_TEMPLATES } from '../components/CoverPhotoModal'
import { Camera, Hourglass, MessageSquare, AlertTriangle, BookOpen, Calendar, Pencil, Image, Lock, Users, FileText, Heart, CheckCircle, GraduationCap, Globe, Zap, XCircle, EyeOff, Award, Medal, Trophy, Upload, FileUp } from '../components/Icons'
import ExecutiveShowcase from '../components/ExecutiveShowcase'
import Profile from './Profile'

interface Props {
  userId: string
  onNavigate: (path: string) => void
}

export default function UserProfile({ userId, onNavigate }: Props) {
  const { user, updateProfile } = useAuth()
  const { t } = useI18n()
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [newPost, setNewPost] = useState('')
  const [postImage, setPostImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [comments, setComments] = useState<Record<string, any[]>>({})
  const [activeTab, setActiveTab] = useState<'wall' | 'photos' | 'friends' | 'about' | 'cv' | 'courses' | 'servicios' | 'tutorias' | 'showcase'>('wall')
  // showMoreTabs eliminado — todos los tabs son visibles directamente
  const [cvData, setCvData] = useState<any>(null)
  const [cvLoading, setCvLoading] = useState(false)
  const [cvUploading, setCvUploading] = useState(false)
  const [cvUploadMsg, setCvUploadMsg] = useState('')
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
  const [mutualFriends, setMutualFriends] = useState<any[]>([])
  const [showMutualList, setShowMutualList] = useState(false)
  const [showEditInfoModal, setShowEditInfoModal] = useState(false)
  const [editInfoForm, setEditInfoForm] = useState({ career: '', university: '', semester: 1, academicStatus: 'estudiante', professionalTitle: '', bio: '' })
  const [editInfoSaving, setEditInfoSaving] = useState(false)
  // Config section embedded in social profile (null = show social tabs content)
  const [configSection, setConfigSection] = useState<string | null>(null)
  // LMS connection indicator (own profile only)
  const [lmsConnections, setLmsConnections] = useState<any[]>([])
  const postImageRef = useRef<HTMLInputElement>(null)
  const coverPhotoRef = useRef<HTMLInputElement>(null)
  const coverUploadRef = useRef<HTMLInputElement>(null)
  const profilePhotoRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadProfile(); loadPosts(); loadFriends() }, [userId])
  useEffect(() => { if (userId) { loadActivityFeed() } }, [userId])
  useEffect(() => {
    if (user && userId === user.id) {
      api.getMyTutorProfile().then(tp => setTutorProfile(tp)).catch(() => setTutorProfile(null))
    }
  }, [userId, user])

  // Load LMS connections for own profile indicator
  useEffect(() => {
    if (!user || userId !== user.id) return
    api.lmsGetConnections().then((d: any) => setLmsConnections(d?.connections || d || [])).catch(() => {})
  }, [userId, user])

  // Compute mutual friends for other users' profiles
  useEffect(() => {
    if (!user || userId === user.id) { setMutualFriends([]); return }
    Promise.all([api.getFriends(), api.getUserFriends(userId)])
      .then(([myFriends, theirFriends]) => {
        const myIds = new Set((myFriends || []).map((f: any) => f.id || f.userId))
        const mutual = (theirFriends || []).filter((f: any) => myIds.has(f.id || f.userId))
        setMutualFriends(mutual)
      })
      .catch(() => setMutualFriends([]))
  }, [userId, user])

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

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCvUploading(true)
    setCvUploadMsg('⏳ Analizando tu CV con IA...')
    try {
      await api.uploadCV(file)
      setCvUploadMsg('✅ CV importado. Redirigiendo para que ajustes los detalles...')
      setTimeout(() => onNavigate('/cv'), 1200)
    } catch (err: any) {
      setCvUploadMsg(`❌ ${err.message || 'No se pudo importar. Asegúrate de subir un PDF o Word válido.'}`)
      setCvUploading(false)
    }
    e.target.value = ''
  }

  const handleCVVisibility = async (vis: string) => {
    try {
      await api.updateCV({ ...cvData, visibility: vis })
      setCvData((prev: any) => ({ ...prev, visibility: vis }))
    } catch (err) { console.error('Failed to update CV visibility:', err) }
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
    try {
      if (user?.id === userId) {
        // Perfil propio → feed consolidado (amigos + carrera + universidad + propios)
        const data: any = await api.getFeed(1, 'recent', 'all')
        setPosts(data?.posts ?? (Array.isArray(data) ? data : []))
      } else {
        // Perfil ajeno → solo los posts de ese usuario
        const data: any = await api.getWallPosts(userId)
        setPosts(data?.posts ?? (Array.isArray(data) ? data : []))
      }
    } catch (err: any) { console.error('Failed to load posts:', err) }
  }

  const loadFriends = async () => {
    try { setFriendsList(await api.getUserFriends(userId)) } catch (err: any) { console.error('Failed to load friends:', err) }
  }

  const loadActivityFeed = async () => {
    setActivityLoading(true)
    try { setActivityFeed(await api.getActivityFeed(1, userId)) } catch (err: any) { console.error('Failed to load activity feed:', err) }
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
    const timer = setInterval(() => {
      setExamTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmitExam()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [showExamModal, examResult, examLoading, examData]) // examTimeLeft removido — se usa prev en el callback

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
    if (!confirm(t('userprofile.confirmRemoveFriend'))) return
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
      alert(t('userprofile.reportSent'))
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

  const openEditInfoModal = () => {
    setEditInfoForm({
      career: profile.career || '',
      university: profile.university || '',
      semester: profile.semester || 1,
      academicStatus: profile.academicStatus || 'estudiante',
      professionalTitle: profile.professionalTitle || '',
      bio: profile.bio || '',
    })
    setShowEditInfoModal(true)
  }

  const handleSaveInfo = async () => {
    setEditInfoSaving(true)
    try {
      await updateProfile({
        career: editInfoForm.career,
        university: editInfoForm.university,
        semester: Number(editInfoForm.semester),
        academicStatus: editInfoForm.academicStatus,
        professionalTitle: editInfoForm.professionalTitle,
        bio: editInfoForm.bio,
      } as any)
      setProfile((prev: any) => ({ ...prev, ...editInfoForm }))
      setShowEditInfoModal(false)
    } catch (err: any) {
      alert(err.message || 'Error al guardar')
    } finally {
      setEditInfoSaving(false)
    }
  }

  if (loading) return <div className="page-body"><div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" />)}</div></div>
  if (!profile) return <div className="page-body"><div className="empty-state"><h3>{t('userprofile.notFound')}</h3></div></div>

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
          ...getCoverStyle(profile.coverPhoto || '', profile.coverType || 'template', profile.coverPositionY ?? 50),
          height: 150,
        }}>
          {isOwn && (
            <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="fb-cover-edit-btn" style={{ position: 'static' }} onClick={() => setShowCoverModal(true)}>
                {Camera({ size: 14 })} {profile.coverPhoto ? t('userprofile.changeCover') : t('userprofile.addCover')}
              </button>
              {profile.coverPhoto && (
                <button
                  onClick={async () => {
                    try {
                      await api.updateMe({ cover_photo: '', cover_type: '' })
                      setProfile((prev: any) => ({ ...prev, coverPhoto: '', coverType: '' }))
                    } catch { /* ignorar */ }
                  }}
                  style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(220,38,38,0.82)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  🗑 Eliminar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Photo + Identity */}
        <div className="fb-profile-photo-section">
          <div className="fb-profile-photo" onClick={() => isOwn && profilePhotoRef.current?.click()}>
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

          <div className="fb-profile-name-section">
            <div>
              {/* Name + role badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 className="fb-profile-identity-name" style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Sora', var(--font-sans)", letterSpacing: '-0.03em', margin: 0, lineHeight: 1.15 }}>
                  {profile.firstName} {profile.lastName}
                </h1>
                {profile.role === 'owner' && (
                  <span style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)', color: 'var(--accent)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.06em' }}>CEO</span>
                )}
              </div>
              <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>
                {profile.career || t('userprofile.student')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span>{profile.university || t('userprofile.noUni')}</span>
                {profile.semester && (
                  <>
                    <span style={{ opacity: 0.35 }}>·</span>
                    <span>Semestre {profile.semester}</span>
                  </>
                )}
              </div>

              {/* Divider + Bio/Presentación */}
              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '10px 0 8px' }} />
              {editingBio ? (
                <div style={{ marginBottom: 8 }}>
                  <textarea className="form-input" value={bioText} onChange={e => setBioText(e.target.value)} rows={2} placeholder="Escribe tu presentación..." maxLength={300} style={{ fontSize: 13, resize: 'none' }} />
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 6 }}>
                    <button className="btn btn-secondary btn-xs" onClick={() => setEditingBio(false)}>Cancelar</button>
                    <button className="btn btn-primary btn-xs" onClick={handleSaveBio}>Guardar</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <p style={{ fontSize: 13, color: profile.bio ? 'var(--text-secondary)' : 'var(--text-muted)', lineHeight: 1.55, margin: 0, flex: 1, fontStyle: profile.bio ? 'normal' : 'italic' }}>
                    {profile.bio || (isOwn ? 'Agrega una presentación sobre ti...' : '')}
                  </p>
                  {isOwn && (
                    <button onClick={() => { setBioText(profile.bio || ''); setEditingBio(true) }} style={{ background: 'none', border: 'none', padding: '1px 4px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 11, flexShrink: 0, opacity: 0.7, display: 'flex', alignItems: 'center', gap: 3 }} title="Editar presentación">
                      {Pencil({ size: 11 })}
                    </button>
                  )}
                </div>
              )}

              {/* Ofrece Tutorías — compacto en header */}
              {profile.offersMentoring && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 2 }}>🎓 Tutorías</span>
                  {(profile.mentoringServices || []).slice(0, 3).map((s: string) => (
                    <span key={s} style={{ padding: '2px 8px', background: 'rgba(45,98,200,0.1)', color: '#2D62C8', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                      {s === 'ayudantias' ? 'Ayudantías' : s === 'cursos' ? 'Cursos' : s === 'clases_particulares' ? 'Clases particulares' : s}
                    </span>
                  ))}
                  <span style={{ fontSize: 11, fontWeight: 700, color: profile.mentoringPriceType === 'free' ? '#22c55e' : '#2D62C8', background: profile.mentoringPriceType === 'free' ? 'rgba(34,197,94,0.1)' : 'rgba(45,98,200,0.08)', padding: '2px 8px', borderRadius: 6 }}>
                    {profile.mentoringPriceType === 'free' ? 'Gratis' : `$${profile.mentoringPricePerHour || 0}/hr`}
                  </span>
                </div>
              )}

              {/* Stats strip */}
              <div style={{ display: 'flex', gap: 14, marginTop: 10, alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{(profile.friendCount || 0).toLocaleString()}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>conexiones</span>
                </div>
                <div style={{ width: 1, height: 26, background: 'var(--border)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{posts.length}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>posts</span>
                </div>
                <div style={{ width: 1, height: 26, background: 'var(--border)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{((profile as any).xp || 0).toLocaleString()}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>XP</span>
                </div>

                {/* LMS connection indicator — only on own profile */}
                {isOwn && (
                  <>
                    <div style={{ width: 1, height: 26, background: 'var(--border)' }} />
                    {lmsConnections.length > 0 ? (
                      <button
                        onClick={() => onNavigate('/mi-universidad')}
                        title="Ver conexión universitaria"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.25)', borderRadius: 20, padding: '4px 10px', cursor: 'pointer' }}
                      >
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0d9488', flexShrink: 0, boxShadow: '0 0 0 2px rgba(13,148,136,0.2)' }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#0d9488', whiteSpace: 'nowrap' }}>
                          {lmsConnections[0]?.university_name || lmsConnections[0]?.base_url?.replace(/https?:\/\//, '').split('/')[0] || 'Universidad conectada'}
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onNavigate('/mi-universidad')}
                        title="Conectar tu universidad"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(100,116,139,0.06)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 20, padding: '4px 10px', cursor: 'pointer' }}
                      >
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#94a3b8', flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Sin universidad</span>
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Action buttons */}
              {!isOwn && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  {profile.isFriend ? (
                    <>
                      <button className="btn btn-primary btn-sm" style={{ borderRadius: 24, background: 'var(--accent-green)', borderColor: 'var(--accent-green)' }}>✓ Amigos</button>
                      <button className="btn btn-secondary btn-sm" style={{ borderRadius: 24 }} onClick={handleUnfriend}>{t('userprofile.removeFriend')}</button>
                    </>
                  ) : profile.friendshipStatus === 'pending' && profile.friendshipId ? (
                    <>
                      <button className="btn btn-primary btn-sm" style={{ borderRadius: 24 }} onClick={handleFriendAction}>
                        {`✓ ${t('userprofile.acceptRequest')}`}
                      </button>
                      <button className="btn btn-secondary btn-sm" style={{ borderRadius: 24 }} onClick={() => { api.rejectFriendRequest(profile.friendshipId); loadProfile() }}>
                        {t('userprofile.reject')}
                      </button>
                    </>
                  ) : profile.friendshipStatus === 'pending' ? (
                    <button className="btn btn-secondary btn-sm" style={{ borderRadius: 24, cursor: 'default', opacity: 0.8 }} disabled>
                      {Hourglass({ size: 14 })} {t('userprofile.inviteSent')}
                    </button>
                  ) : profile.friendshipStatus === 'rejected' ? (
                    <button className="btn btn-primary btn-sm" style={{ borderRadius: 24 }} onClick={handleFriendAction}>{t('userprofile.addFriend')}</button>
                  ) : (
                    <button className="btn btn-primary btn-sm" style={{ borderRadius: 24 }} onClick={handleFriendAction}>{t('userprofile.addFriend')}</button>
                  )}
                  <button className="btn btn-secondary btn-sm" style={{ borderRadius: 24 }} onClick={() => onNavigate(`/messages?new=${userId}`)}>{MessageSquare({ size: 14 })} {t('userprofile.message')}</button>
                  <div style={{ position: 'relative' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowMoreMenu(!showMoreMenu)} style={{ borderRadius: 24, padding: '6px 14px' }}>{t('userprofile.more')} ···</button>
                    {showMoreMenu && (
                      <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, minWidth: 220, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
                        <button onClick={handleBlock} style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>{XCircle({ size: 14 })} {t('userprofile.blockUser')}</button>
                        <button onClick={() => { setShowReportModal(true); setShowMoreMenu(false) }} style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>{AlertTriangle({ size: 14 })} {t('userprofile.reportUser')}</button>
                        <button onClick={() => { alert(t('userprofile.userMuted')); setShowMoreMenu(false) }} style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>{EyeOff({ size: 14 })} {t('userprofile.muteUser')}</button>
                        <div style={{ height: 1, background: 'var(--border)' }} />
                        <button onClick={() => { alert(t('userprofile.reportSentShort')); setShowMoreMenu(false) }} style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', textAlign: 'left', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>{AlertTriangle({ size: 14 })} {t('userprofile.noCollaborate')}</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isOwn && (
                <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary btn-sm" style={{ borderRadius: 24, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setConfigSection('profile')}>
                    {Pencil({ size: 13 })} Editar perfil
                  </button>
                  <button className="btn btn-secondary btn-sm" style={{ borderRadius: 24, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => onNavigate('/friends')}>
                    {Users({ size: 13 })} Encontrar amigos
                  </button>
                </div>
              )}

              {/* Social context — only on other users' profiles */}
              {!isOwn && profile && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, alignItems: 'center' }}>
                  {mutualFriends.length > 0 && (
                    <div style={{ position: 'relative' }}>
                      <button onClick={() => setShowMutualList(!showMutualList)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: '4px 12px 4px 4px', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex' }}>
                          {mutualFriends.slice(0, 3).map((f: any, i: number) => (
                            <div key={f.id || i} style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i > 0 ? -6 : 0, border: '2px solid var(--bg-card)', overflow: 'hidden' }}>
                              {f.avatar ? <img src={f.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (f.firstName?.[0] || '?')}
                            </div>
                          ))}
                        </div>
                        👥 {mutualFriends.length} amigo{mutualFriends.length !== 1 ? 's' : ''} en común
                      </button>
                      {showMutualList && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 8, minWidth: 200, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 200, overflowY: 'auto' }}>
                          {mutualFriends.map((f: any) => (
                            <div key={f.id} onClick={() => { setShowMutualList(false); onNavigate(`/profile/${f.id}`) }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {f.avatar ? <img src={f.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (f.firstName?.[0] || '?')}
                              </div>
                              <span>{f.firstName} {f.lastName}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {user?.university && profile.university && user.university === profile.university && (
                    <span style={{ background: 'rgba(45,98,200,0.1)', color: 'var(--accent-blue)', borderRadius: 16, padding: '4px 12px', fontSize: 12, fontWeight: 500 }}>🏛️ Estudia en {profile.university}</span>
                  )}
                  {user?.career && profile.career && user.career === profile.career && (
                    <span style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--accent-green)', borderRadius: 16, padding: '4px 12px', fontSize: 12, fontWeight: 500 }}>📚 Misma carrera: {profile.career}</span>
                  )}
                  {profile.lastLogin && (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>⏰ Activo {(() => {
                      const diff = Date.now() - new Date(profile.lastLogin).getTime()
                      const mins = Math.floor(diff / 60000)
                      if (mins < 1) return 'ahora'
                      if (mins < 60) return `hace ${mins}m`
                      const hrs = Math.floor(mins / 60)
                      if (hrs < 24) return `hace ${hrs}h`
                      return `hace ${Math.floor(hrs / 24)}d`
                    })()}</span>
                  )}
                  {/* Quick actions */}
                  <button className="btn btn-sm" style={{ borderRadius: 20, background: 'var(--accent)', color: '#fff', border: 'none', fontSize: 12, padding: '4px 14px', cursor: 'pointer' }} onClick={() => onNavigate(`/messages?new=${userId}`)}>💬 Enviar mensaje</button>
                  <button className="btn btn-sm" style={{ borderRadius: 20, background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: '#fff', border: 'none', fontSize: 12, padding: '4px 14px', cursor: 'pointer' }} onClick={() => onNavigate(`/study-room?invite=${userId}`)}>📚 Estudiar juntos</button>
                </div>
              )}
            </div>

            {/* Right side — identifiers únicos, sin repetir carrera/universidad */}
            <div className="fb-profile-identifiers" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, paddingTop: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                @{profile.username}
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 2 }}>
                  #{String(profile.userNumber || 0).padStart(4, '0')}
                </span>
              </div>
              {(profile as any).xp > 0 && (
                <div style={{ background: 'rgba(45,98,200,0.1)', color: 'var(--accent)', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
                  ⚡ {(profile as any).xp} XP
                </div>
              )}
              {(profile as any).streak > 1 && (
                <div style={{ fontSize: 12, color: 'var(--accent-orange, #f97316)' }}>
                  🔥 {(profile as any).streak} días
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Fila 1: Social Tabs — todos visibles, sin "Más" ─── */}
      <div className="fb-profile-tabs" style={{ marginBottom: isOwn ? 0 : 16, borderRadius: isOwn ? 'var(--radius) var(--radius) 0 0' : 'var(--radius)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderBottom: isOwn ? 'none' : undefined, position: 'relative', flexWrap: 'wrap' }}>
        <button className={`fb-tab ${!configSection && activeTab === 'wall' ? 'active' : ''}`} onClick={() => { setActiveTab('wall'); setConfigSection(null) }}>
          Publicaciones
        </button>
        <button className={`fb-tab ${!configSection && activeTab === 'tutorias' ? 'active' : ''}`} onClick={() => { setActiveTab('tutorias'); loadStudentTutoringData(); loadTutorData(); setConfigSection(null) }}>
          Tutorías
        </button>
        <button className={`fb-tab ${!configSection && activeTab === 'courses' ? 'active' : ''}`} onClick={() => { setActiveTab('courses'); loadCompletedCourses(); setConfigSection(null) }}>
          Cursos Realizados
        </button>
        <button className={`fb-tab ${!configSection && activeTab === 'cv' ? 'active' : ''}`} onClick={() => { setActiveTab('cv'); loadCV(); setConfigSection(null) }}>
          Curriculum Vitae
        </button>
        <button className={`fb-tab ${!configSection && activeTab === 'friends' ? 'active' : ''}`} onClick={() => { setActiveTab('friends'); loadFriends(); setConfigSection(null) }}>
          Amigos
        </button>
        <button className={`fb-tab ${!configSection && activeTab === 'photos' ? 'active' : ''}`} onClick={() => { setActiveTab('photos'); setConfigSection(null) }}>
          Fotos
        </button>
      </div>

      {/* ─── Fila 2: Config Tabs (solo propietario del perfil) ─── */}
      {isOwn && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 12px',
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderTop: '1px solid var(--border)', borderRadius: '0 0 var(--radius) var(--radius)',
          marginBottom: 16,
        }}>
          {([
            { id: 'profile',      label: 'Mi Perfil',          color: '#1a3a6e' },
            { id: 'academic',     label: 'Académico',           color: '#1e40af' },
            { id: 'cv',           label: 'CV Profesional',      color: '#6d28d9' },
            { id: 'projects',     label: 'Proyectos',           color: '#0369a1' },
            { id: 'publications', label: 'Publicaciones',       color: '#0891b2' },
            { id: 'appearance',   label: 'Apariencia',          color: '#b45309' },
            { id: 'notifications',label: 'Notificaciones',      color: '#374151' },
          ] as { id: string; label: string; color: string }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setConfigSection(configSection === tab.id ? null : tab.id)}
              style={{
                padding: '5px 12px',
                borderRadius: 20,
                border: '2px solid',
                borderColor: configSection === tab.id ? tab.color : 'transparent',
                background: configSection === tab.id ? tab.color : `${tab.color}22`,
                color: configSection === tab.id ? '#fff' : tab.color,
                fontSize: 12,
                fontWeight: configSection === tab.id ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                letterSpacing: 0.3,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ─── Módulo de Configuración embebido ─── */}
      {configSection && isOwn && (
        <div style={{ marginBottom: 16 }}>
          <Profile key={configSection} embedded initialSection={configSection} onNavigate={onNavigate} />
        </div>
      )}

      {/* Tab Content */}
      <div className="fb-profile-content" style={{ display: configSection ? 'none' : undefined }}>
        <div>
            {/* Contenido de tabs — full width */}
            <div>
              {activeTab === 'wall' && (
                <>
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
                      placeholder={isOwn ? t('userprofile.thinking') : `${t('userprofile.writeOnProfile')} ${profile.firstName}...`}
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
                      {Image({ size: 14 })} {t('userprofile.photo')}
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
                        {postVisibility === 'friends' ? <>{Globe({ size: 14 })} {t('userprofile.visibilityFriends')}</> :
                         postVisibility === 'university' ? <>{GraduationCap({ size: 14 })} {t('userprofile.visibilityUniversity')}</> :
                         postVisibility === 'private' ? <>{Lock({ size: 14 })} {t('userprofile.visibilityPrivate')}</> : <>{Users({ size: 14 })} {t('userprofile.visibilitySpecific')}</>}
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
                            { value: 'friends', icon: Globe({ size: 16 }), label: t('userprofile.allFriends'), desc: t('userprofile.allFriendsDesc') },
                            { value: 'university', icon: GraduationCap({ size: 16 }), label: t('userprofile.myUniversity'), desc: t('userprofile.myUniversityDesc') },
                            { value: 'private', icon: Lock({ size: 16 }), label: t('userprofile.onlyProfile'), desc: t('userprofile.onlyProfileDesc') },
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
                      {t('userprofile.publish')}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Timeline unificado: posts + actividad ── */}
              {(() => {
                // Merge posts (type='post') + activity feed items sorted by date
                const activityItems = activityFeed
                  .filter(item => item.type === 'activity' && (isOwn || true))
                  .map(item => ({ ...item, _kind: 'activity' as const }))
                const postItems = posts.map(p => ({ ...p, _kind: 'post' as const }))
                const merged = [...postItems, ...activityItems].sort((a, b) => {
                  const ta = new Date(a.createdAt || 0).getTime()
                  const tb = new Date(b.createdAt || 0).getTime()
                  return tb - ta
                })

                if (activityLoading && posts.length === 0) {
                  return (
                    <div className="u-card" style={{ textAlign: 'center', padding: 20 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>
                    </div>
                  )
                }

                if (merged.length === 0) {
                  return (
                    <div className="u-card" style={{ textAlign: 'center', padding: 40 }}>
                      <div className="empty-state-icon">{FileText({ size: 48 })}</div>
                      <p style={{ color: 'var(--text-muted)' }}>{t('userprofile.noPosts')}</p>
                      {isOwn && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t('userprofile.shareWithPeers')}</p>}
                    </div>
                  )
                }

                return merged.map(item => {
                  // Activity row
                  if (item._kind === 'activity') {
                    return (
                      <div key={item.id} className="u-card" style={{ padding: '11px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {item.activityType === 'quiz_generated' ? FileText({ size: 16 }) :
                           item.activityType === 'guide_generated' ? BookOpen({ size: 16 }) :
                           item.activityType === 'document_uploaded' ? FileText({ size: 16 }) :
                           item.activityType === 'friend_added' ? Users({ size: 16 }) : Zap({ size: 16 })}
                        </span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 13 }}>{item.content}</span>
                          <small style={{ display: 'block', color: 'var(--text-muted)', marginTop: 1, fontSize: 11 }}>{timeAgo(item.createdAt)}</small>
                        </div>
                      </div>
                    )
                  }

                  // Post card
                  const post = item as any

                  // ── Milestone config ────────────────────────────
                  const milestoneConfig: Record<string, { emoji: string; color: string; bg: string; label: string }> = {
                    course_completed:    { emoji: '🎓', color: '#2D62C8', bg: 'rgba(45,98,200,0.08)',  label: 'Logro académico' },
                    certificate:         { emoji: '📜', color: '#059669', bg: 'rgba(5,150,105,0.08)',   label: 'Certificado' },
                    badge:               { emoji: '🏅', color: '#D97706', bg: 'rgba(217,119,6,0.08)',   label: 'Insignia' },
                    level_up:            { emoji: '⭐', color: '#7C3AED', bg: 'rgba(124,58,237,0.08)',  label: 'Nivel' },
                    streak:              { emoji: '🔥', color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   label: 'Racha' },
                    university_change:   { emoji: '🏛', color: '#0891B2', bg: 'rgba(8,145,178,0.08)',   label: 'Nueva institución' },
                    tutoring_milestone:  { emoji: '👨‍🏫', color: '#D97706', bg: 'rgba(217,119,6,0.08)',  label: 'Mentoría' },
                    graduated:           { emoji: '🎉', color: '#059669', bg: 'rgba(5,150,105,0.08)',   label: 'Titulación' },
                  }
                  const mc = post.isMilestone ? (milestoneConfig[post.milestoneType] || { emoji: '✨', color: 'var(--accent)', bg: 'rgba(99,102,241,0.08)', label: 'Logro' }) : null

                  return (
                    <div key={post.id} className="card fb-post" style={mc ? { border: `1.5px solid ${mc.color}30`, overflow: 'hidden' } : {}}>

                      {/* Milestone banner */}
                      {mc && (
                        <div style={{ background: mc.bg, borderBottom: `1px solid ${mc.color}20`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 20 }}>{mc.emoji}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: mc.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{mc.label}</span>
                          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(post.createdAt)}</span>
                        </div>
                      )}

                      <div className="fb-post-header" style={mc ? { paddingTop: 12 } : {}}>
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
                            {!mc && <span className="fb-post-time">{timeAgo(post.createdAt)}</span>}
                          </div>
                        </div>
                        {(post.author?.id === user?.id || isOwn) && (
                          <button className="fb-post-menu" onClick={() => handleDeletePost(post.id)} title="Eliminar">✕</button>
                        )}
                      </div>

                      <p className="fb-post-content" style={mc ? { fontSize: 15, fontWeight: 600, color: mc.color } : {}}>{post.content}</p>

                      {post.imageUrl && (
                        <div className="fb-post-image"><img src={post.imageUrl} alt="" /></div>
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
                          {Heart({ size: 14, color: post.liked ? '#ef4444' : undefined })} {t('userprofile.like')}
                        </button>
                        <button className="fb-action-btn" onClick={() => toggleComments(post.id)}>
                          {MessageSquare({ size: 14 })} {t('userprofile.comment')}
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
                                  <div className="fb-comment-avatar-initials">{(c.author?.firstName?.[0] || '')}</div>
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
                              placeholder={t('userprofile.writeComment')}
                              value={commentText[post.id] || ''}
                              onChange={e => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
                            />
                            <button className="btn btn-primary btn-xs" onClick={() => handleComment(post.id)}>
                              {t('userprofile.send')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              })()}
                </>
              )}

        {activeTab === 'about' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Card 1: Información Personal */}
            <div className="card fb-info-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h4 style={{ margin: 0 }}>{t('userprofile.personalInfo')}</h4>
                {isOwn && (
                  <button className="btn btn-secondary btn-sm" onClick={openEditInfoModal} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {Pencil({ size: 14 })} Editar
                  </button>
                )}
              </div>
              <div className="fb-about-grid">
                <div className="fb-about-item">
                  <span className="fb-about-label">{t('userprofile.fullName')}</span>
                  <span style={{ fontWeight: 600 }}>{profile.firstName} {profile.lastName}</span>
                </div>
                <div className="fb-about-item">
                  <span className="fb-about-label">{t('userprofile.user')}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>@{profile.username} <span style={{ opacity: 0.6 }}>#{String(profile.userNumber || 0).padStart(4, '0')}</span></span>
                </div>
                <div className="fb-about-item">
                  <span className="fb-about-label">{t('userprofile.career')}</span>
                  <span>{profile.career || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{t('userprofile.notSpecified')}</span>}</span>
                </div>
                <div className="fb-about-item">
                  <span className="fb-about-label">{t('userprofile.universityLabel')}</span>
                  <span>{profile.university || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{t('userprofile.notSpecified')}</span>}</span>
                </div>
                <div className="fb-about-item">
                  <span className="fb-about-label">{t('userprofile.semesterLabel')}</span>
                  <span>{t('userprofile.semester')} {profile.semester}</span>
                </div>
                {profile.academicStatus && profile.academicStatus !== 'estudiante' && (
                  <div className="fb-about-item">
                    <span className="fb-about-label">{t('userprofile.academicStatusLabel')}</span>
                    <span style={{ textTransform: 'capitalize', color: '#7c3aed', fontWeight: 600 }}>{profile.academicStatus}</span>
                  </div>
                )}
                {profile.professionalTitle && (
                  <div className="fb-about-item">
                    <span className="fb-about-label">{t('userprofile.titleLabel')}</span>
                    <span style={{ fontWeight: 500 }}>{profile.professionalTitle}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Descripción / Bio */}
            <div className="card fb-info-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h4 style={{ margin: 0 }}>Descripción</h4>
                {isOwn && !editingBio && (
                  <button className="btn btn-secondary btn-sm" onClick={() => { setBioText(profile.bio || ''); setEditingBio(true) }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {Pencil({ size: 14 })} {profile.bio ? 'Editar' : 'Agregar'}
                  </button>
                )}
              </div>
              {editingBio ? (
                <div>
                  <textarea className="form-input" value={bioText} onChange={e => setBioText(e.target.value)} rows={3} placeholder="Escribe sobre ti..." maxLength={300} />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                    <button className="btn btn-secondary btn-xs" onClick={() => setEditingBio(false)}>{t('userprofile.cancelBtn')}</button>
                    <button className="btn btn-primary btn-xs" onClick={handleSaveBio}>{t('userprofile.saveBtn')}</button>
                  </div>
                </div>
              ) : (
                <p style={{ color: profile.bio ? 'var(--text-secondary)' : 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, margin: 0, fontStyle: profile.bio ? 'normal' : 'italic' }}>
                  {profile.bio || 'Sin descripción aún.'}
                </p>
              )}
            </div>

            {/* Card 3: Actividad & Conexiones */}
            <div className="card fb-info-card">
              <h4 style={{ marginTop: 0, marginBottom: 14 }}>Actividad</h4>
              <div className="fb-about-grid">
                <div className="fb-about-item">
                  <span className="fb-about-label">{t('userprofile.friendsLabel')}</span>
                  <span style={{ fontWeight: 600, color: '#2D62C8' }}>{profile.friendCount} {t('userprofile.connections')}</span>
                </div>
                {profile.studyDays > 0 && (
                  <div className="fb-about-item">
                    <span className="fb-about-label">{t('userprofile.daysStudyingLabel')}</span>
                    <span style={{ fontWeight: 600, color: '#059669' }}>{profile.studyDays.toLocaleString()} días</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card 4: Calificación como Estudiante */}
            {(profile.studentRatingCount > 0 || isOwn) && (
              <div className="card fb-info-card">
                <h4 style={{ marginTop: 0, marginBottom: 14 }}>Calificación como Estudiante</h4>
                {profile.studentRatingCount > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {[1,2,3,4,5].map(s => (
                        <svg key={s} width="20" height="20" viewBox="0 0 24 24" fill={s <= Math.round(profile.studentRatingAvg || 0) ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <div>
                      <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{(profile.studentRatingAvg || 0).toFixed(1)}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 6 }}>({profile.studentRatingCount} {profile.studentRatingCount === 1 ? 'evaluación' : 'evaluaciones'} de tutores)</span>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, fontStyle: 'italic' }}>
                    Aún no tienes evaluaciones de tutores. Aparecerán luego de completar sesiones de tutoría.
                  </p>
                )}
              </div>
            )}

            {/* Card 5: Servicios de Tutoría */}
            {profile.offersMentoring && (
              <div className="card fb-info-card">
                <h4 style={{ marginTop: 0, marginBottom: 14 }}>{t('userprofile.tutoringServices')}</h4>
                <div className="fb-about-grid">
                  {profile.mentoringServices && profile.mentoringServices.length > 0 && (
                    <div className="fb-about-item">
                      <span className="fb-about-label">{t('userprofile.servicesLabel')}</span>
                      <span>{profile.mentoringServices.map((s: string) => s === 'ayudantias' ? 'Ayudantías' : s === 'cursos' ? 'Cursos' : s === 'clases_particulares' ? 'Clases particulares' : s).join(', ')}</span>
                    </div>
                  )}
                  {profile.mentoringSubjects && profile.mentoringSubjects.length > 0 && (
                    <div className="fb-about-item">
                      <span className="fb-about-label">{t('userprofile.subjectsLabel')}</span>
                      <span>{profile.mentoringSubjects.join(', ')}</span>
                    </div>
                  )}
                  {profile.mentoringDescription && (
                    <div className="fb-about-item">
                      <span className="fb-about-label">{t('userprofile.descriptionLabel')}</span>
                      <span>{profile.mentoringDescription}</span>
                    </div>
                  )}
                  <div className="fb-about-item">
                    <span className="fb-about-label">{t('userprofile.priceLabel')}</span>
                    <div>
                      <span style={{ fontWeight: 600, color: profile.mentoringPriceType === 'free' ? '#22c55e' : '#2D62C8' }}>
                        {profile.mentoringPriceType === 'free' ? t('userprofile.freeVolunteer') : `$${profile.mentoringPricePerHour || 0} USD por hora`}
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
                    style={{ marginTop: 16, padding: '10px 20px', background: '#2D62C8', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                    {t('userprofile.requestTutoring')}
                  </button>
                )}
              </div>
            )}

            {/* Executive Showcase — MAX plan users */}
            {((profile as any).subscriptionTier === 'max' || isOwn) && (
              <div className="card fb-info-card">
                <ExecutiveShowcase
                  userId={profile.id}
                  isOwner={!!isOwn}
                  isMaxUser={(profile as any).subscriptionTier === 'max' || profile.role === 'owner'}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'courses' && (
          <div>
            {coursesLoading ? (
              <div className="u-card" style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>
                <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>{t('userprofile.loadingCourses')}</p>
              </div>
            ) : completedCourses.length === 0 ? (
              <div className="u-card" style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ marginBottom: 12 }}>{GraduationCap({ size: 48, color: 'var(--text-muted)' })}</div>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  {isOwn ? t('userprofile.noCoursesOwn') : t('userprofile.noCoursesOther')}
                </p>
              </div>
            ) : (
              <>
                <div className="u-card" style={{ padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  {Trophy({ size: 22, color: '#f59e0b' })}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{completedCourses.length} {t('userprofile.coursesCompleted')}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('userprofile.clickToSeeCert')}</div>
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
                        className="u-card"
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
                            <span>{t('userprofile.score')}: {cert.score}%</span>
                            <span style={{ margin: '0 2px' }}>·</span>
                            <span>{cert.completedAt ? new Date(cert.completedAt).toLocaleDateString('es', { month: 'short', year: 'numeric' }) : ''}</span>
                          </div>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
                            color: accentColor, fontWeight: 600,
                          }}>
                            {Award({ size: 12 })} {t('userprofile.viewCert')}
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
              <div className="u-card" style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>
                <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>{t('userprofile.loadingCV')}</p>
              </div>
            ) : !cvData || (!cvData.headline && !cvData.aboutMe && (!cvData.skills || cvData.skills.length === 0) && (!cvData.experience || cvData.experience.length === 0)) ? (
              isOwn ? (
                /* ── Owner: Upload + Manual options ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="u-card" style={{ padding: '36px 32px', textAlign: 'center' }}>
                    <div style={{ marginBottom: 16 }}>{FileUp({ size: 52, color: 'var(--accent)' })}</div>
                    <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>Tu Curriculum Vitae</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 460, margin: '0 auto 8px', lineHeight: 1.6 }}>
                      Sube tu CV en PDF y la IA extrae automáticamente experiencias, habilidades y formación.
                      También puedes completarlo manualmente.
                    </p>
                    {cvUploadMsg && (
                      <p style={{ fontSize: 13, marginBottom: 16, marginTop: 12, fontWeight: 500, color: cvUploadMsg.startsWith('✅') ? '#22c55e' : cvUploadMsg.startsWith('❌') ? '#ef4444' : 'var(--text-muted)' }}>
                        {cvUploadMsg}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24 }}>
                      <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {Upload({ size: 16 })} {cvUploading ? 'Analizando...' : 'Subir CV en PDF'}
                        <input type="file" accept=".pdf,.doc,.docx" onChange={handleCVUpload} disabled={cvUploading} style={{ display: 'none' }} />
                      </label>
                      <button className="btn btn-secondary" onClick={() => onNavigate('/cv')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {Pencil({ size: 16 })} Completar manualmente
                      </button>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 20 }}>
                      Formatos aceptados: PDF, DOC, DOCX · La IA extrae los datos automáticamente con Claude
                    </p>
                  </div>

                  {/* Visibility info card */}
                  <div className="u-card" style={{ padding: 20 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {EyeOff({ size: 15, color: 'var(--accent)' })} Visibilidad del CV
                    </h4>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                      Cuando tengas tu CV listo, elige quién puede verlo:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { val: 'public', icon: '🌐', label: 'Todos', desc: 'Visible en Bolsa de Empleo para cualquier usuario' },
                        { val: 'recruiters', icon: '💼', label: 'Solo Reclutadores', desc: 'Visible únicamente para reclutadores verificados' },
                        { val: 'private', icon: '🔒', label: 'Solo yo', desc: 'Privado — nadie más puede verlo' },
                      ].map(opt => (
                        <div key={opt.val} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center', background: 'var(--bg-secondary)' }}>
                          <span style={{ fontSize: 20 }}>{opt.icon}</span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{opt.label}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{opt.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Non-owner empty state ── */
                <div className="u-card" style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ marginBottom: 12 }}>{FileText({ size: 48, color: 'var(--text-muted)' })}</div>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                    {t('userprofile.noCVOther')}
                  </p>
                </div>
              )
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* ── CV Management Header (owner only) ── */}
                {isOwn && (
                  <div className="u-card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                      {EyeOff({ size: 14, color: 'var(--text-muted)' })}
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Visibilidad:</span>
                      <select
                        value={cvData?.visibility || 'public'}
                        onChange={e => handleCVVisibility(e.target.value)}
                        style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer' }}
                      >
                        <option value="public">🌐 Todos — visible en Bolsa de Empleo</option>
                        <option value="recruiters">💼 Solo Reclutadores</option>
                        <option value="private">🔒 Solo yo</option>
                      </select>
                    </div>
                    <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '6px 12px' }}>
                      {Upload({ size: 13 })} {cvUploading ? 'Analizando...' : 'Actualizar PDF'}
                      <input type="file" accept=".pdf,.doc,.docx" onChange={handleCVUpload} disabled={cvUploading} style={{ display: 'none' }} />
                    </label>
                    <button className="btn btn-primary btn-sm" onClick={() => onNavigate('/cv')} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '6px 12px' }}>
                      {Pencil({ size: 13 })} Editar CV
                    </button>
                  </div>
                )}
                {cvUploadMsg && isOwn && (
                  <div style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, background: cvUploadMsg.startsWith('✅') ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${cvUploadMsg.startsWith('✅') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, color: cvUploadMsg.startsWith('✅') ? '#22c55e' : '#ef4444' }}>
                    {cvUploadMsg}
                  </div>
                )}
                {/* Headline */}
                {cvData.headline && (
                  <div className="u-card" style={{ padding: 20 }}>
                    <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)' }}>{cvData.headline}</h3>
                    {cvData.aboutMe && (
                      <p style={{ margin: '12px 0 0', fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{cvData.aboutMe}</p>
                    )}
                  </div>
                )}

                {/* Experience */}
                {cvData.experience && cvData.experience.length > 0 && (
                  <div className="u-card" style={{ padding: 20 }}>
                    <h4 style={{ margin: '0 0 14px', fontSize: 15, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {Zap({ size: 16, color: '#2D62C8' })} {t('userprofile.experience')}
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
                  <div className="u-card" style={{ padding: 20 }}>
                    <h4 style={{ margin: '0 0 14px', fontSize: 15, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {BookOpen({ size: 16, color: '#2D62C8' })} {t('userprofile.projects')}
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
                  <div className="u-card" style={{ padding: 20 }}>
                    {cvData.skills && cvData.skills.length > 0 && (
                      <>
                        <h4 style={{ margin: '0 0 10px', fontSize: 15, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {CheckCircle({ size: 16, color: '#22c55e' })} {t('userprofile.skills')}
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
                          {Pencil({ size: 16, color: '#f59e0b' })} {t('userprofile.tools')}
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
                  <div className="u-card" style={{ padding: 20 }}>
                    <h4 style={{ margin: '0 0 14px', fontSize: 15, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {Globe({ size: 16, color: '#2D62C8' })} {t('userprofile.languages')}
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
                  <div className="u-card" style={{ padding: 20 }}>
                    <h4 style={{ margin: '0 0 14px', fontSize: 15, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {Heart({ size: 16, color: '#ef4444' })} {t('userprofile.volunteering')}
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
                  <div className="u-card" style={{ padding: 20 }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: 15, color: 'var(--text-primary)' }}>{t('userprofile.interests')}</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {cvData.interests.map((interest: string, i: number) => (
                        <span key={i} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>{interest}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Testimonials */}
                {cvData.testimonials && cvData.testimonials.length > 0 && (
                  <div className="u-card" style={{ padding: 20 }}>
                    <h4 style={{ margin: '0 0 14px', fontSize: 15, color: 'var(--text-primary)' }}>{t('userprofile.recommendations')}</h4>
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
            <h3>{t('userprofile.photos')}</h3>
            {allPhotos.length === 0 ? (
              <div className="u-card" style={{ textAlign: 'center', padding: 40 }}>
                <div className="empty-state-icon">{Camera({ size: 48 })}</div>
                <p style={{ color: 'var(--text-muted)' }}>{t('userprofile.noPhotos')}</p>
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
            <h3>{t('userprofile.friends')} ({profile.friendCount})</h3>
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
                <div className="u-card" style={{ textAlign: 'center', padding: 40, gridColumn: '1 / -1' }}>
                  <p style={{ color: 'var(--text-muted)' }}>{t('userprofile.noFriends')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'servicios' && tutorProfile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header con rol y estado */}
            <div className="u-card" style={{ padding: 20, borderLeft: '4px solid #d97706', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0, color: '#92400e', fontSize: 18 }}>
                    {Award({ size: 20 })} {t('userprofile.serviceProvider')}
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#a16207' }}>
                    {t('userprofile.roleNumber')} {String(tutorProfile.roleNumber || tutorProfile.id || 0).padStart(4, '0')}
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
                  {tutorProfile.status === 'approved' ? t('userprofile.approved') : tutorProfile.status === 'suspended' ? t('userprofile.suspended') : t('userprofile.pendingStatus')}
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              <div className="u-card" style={{ padding: 16, textAlign: 'center', borderTop: '3px solid #d97706' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>{tutorProfile.totalStudents || 0}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{t('userprofile.totalStudents')}</div>
              </div>
              <div className="u-card" style={{ padding: 16, textAlign: 'center', borderTop: '3px solid #d97706' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>
                  {tutorProfile.averageRating ? Number(tutorProfile.averageRating).toFixed(1) : '—'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{t('userprofile.avgRating')}</div>
              </div>
              <div className="u-card" style={{ padding: 16, textAlign: 'center', borderTop: '3px solid #d97706' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>{tutorProfile.totalHours || 0}h</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{t('userprofile.hoursGiven')}</div>
              </div>
            </div>

            {/* Rating y clases */}
            <div className="u-card" style={{ padding: 20 }}>
              <h4 style={{ margin: '0 0 12px', color: '#92400e' }}>{Medal({ size: 16 })} {t('userprofile.ratingAndClasses')}</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span key={star} style={{ color: star <= Math.round(tutorProfile.averageRating || 0) ? '#f59e0b' : '#d1d5db', fontSize: 20 }}>★</span>
                  ))}
                </div>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{tutorProfile.averageRating ? Number(tutorProfile.averageRating).toFixed(1) : t('userprofile.noRatings')}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>({tutorProfile.totalRatings || 0} evaluaciones)</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                {t('userprofile.totalClasses')}: <strong>{tutorProfile.totalClasses || 0}</strong>
              </p>
            </div>

            {/* Crear Clase / Programa */}
            <div className="u-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showCreateClass ? 16 : 0 }}>
                <h4 style={{ margin: 0, color: '#92400e' }}>{t('userprofile.createClassOrProgram')}</h4>
                <button onClick={() => { setShowCreateClass(!showCreateClass); setCcSuccess(false) }}
                  style={{ padding: '6px 16px', background: showCreateClass ? 'var(--bg-secondary)' : '#d97706', color: showCreateClass ? 'var(--text-primary)' : '#fff', border: '1px solid ' + (showCreateClass ? 'var(--border)' : '#d97706'), borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  {showCreateClass ? t('userprofile.close') : t('userprofile.newClass')}
                </button>
              </div>
              {showCreateClass && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {ccSuccess && <div style={{ padding: 12, background: '#dcfce7', borderRadius: 8, color: '#166534', fontWeight: 600, fontSize: 13 }}>{`✓ ${t('userprofile.classCreated')}`}{ccMode === 'program' ? ` (Sesion ${ccSessionNumber - 1} de ${ccProgramSessions})` : ''}</div>}
                  {/* Mode selector */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setCcMode('individual'); setCcProgramId(''); setCcSessionNumber(1) }}
                      style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: '2px solid', borderColor: ccMode === 'individual' ? '#d97706' : 'var(--border)', background: ccMode === 'individual' ? '#fffbeb' : 'var(--bg-card)', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: ccMode === 'individual' ? '#92400e' : 'var(--text-secondary)' }}>
                      {t('userprofile.individualClass')}
                    </button>
                    <button onClick={() => setCcMode('program')}
                      style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: '2px solid', borderColor: ccMode === 'program' ? '#d97706' : 'var(--border)', background: ccMode === 'program' ? '#fffbeb' : 'var(--bg-card)', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: ccMode === 'program' ? '#92400e' : 'var(--text-secondary)' }}>
                      {t('userprofile.programMulti')}
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
            <div className="u-card" style={{ padding: 20 }}>
              <h4 style={{ margin: '0 0 12px', color: '#92400e' }}>{Calendar({ size: 16 })} {t('userprofile.upcomingClasses')}</h4>
              {tutorLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>
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
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>{t('userprofile.noUpcomingClasses')}</p>
              )}
            </div>

            {/* Resumen de pagos */}
            <div className="u-card" style={{ padding: 20 }}>
              <h4 style={{ margin: '0 0 12px', color: '#92400e' }}>{FileText({ size: 16 })} {t('userprofile.paymentSummary')}</h4>
              {tutorPayments ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
                    <div style={{ padding: 12, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>{t('userprofile.totalEarned')}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#15803d' }}>
                        ${(tutorPayments.totalEarned || tutorPayments.total || 0).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ padding: 12, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                      <div style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>{t('userprofile.pendingPayments')}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#d97706' }}>
                        ${(tutorPayments.pendingAmount || 0).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{t('userprofile.lastPayment')}</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {tutorPayments.lastPaymentDate
                          ? new Date(tutorPayments.lastPaymentDate).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
                          : t('userprofile.noPaymentsYet')}
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
                      {FileText({ size: 14 })} {t('userprofile.uploadReceipt')}
                    </button>
                  )}
                </>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>{t('userprofile.noPaymentInfo')}</p>
              )}
            </div>
          </div>
        )}
        {activeTab === 'tutorias' && isOwn && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header */}
            <div className="u-card" style={{ padding: 20, borderLeft: '4px solid #7c3aed', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0, color: '#5b21b6', fontSize: 18 }}>
                    {GraduationCap({ size: 20 })} {t('userprofile.myTutoring')}
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#7c3aed' }}>
                    {t('userprofile.myTutoringDesc')}
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
                  {Calendar({ size: 14 })} {t('userprofile.bookClass')}
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
                  {f === 'all' ? t('userprofile.filterAll') : f === 'upcoming' ? t('userprofile.filterUpcoming') : t('userprofile.filterPast')}
                </button>
              ))}
            </div>

            {/* Enrolled Classes */}
            <div className="u-card" style={{ padding: 20 }}>
              <h4 style={{ margin: '0 0 14px', color: '#5b21b6' }}>{Calendar({ size: 16 })} {t('userprofile.enrolledClasses')}</h4>
              {studentClassesLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>
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
                    <p style={{ fontSize: 14 }}>{t('userprofile.noEnrolledClasses')}</p>
                    <p style={{ fontSize: 12 }}>{t('userprofile.bookFromDirectory')}</p>
                  </div>
                )
              })()}
            </div>

            {/* Available Classes from Tutors */}
            <div className="u-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h4 style={{ margin: 0, color: '#5b21b6' }}>{t('userprofile.availableClasses')}</h4>
                <button onClick={() => onNavigate('/tutores')} style={{ fontSize: 12, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  {t('userprofile.viewAll')}
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
                  {t('userprofile.noClassesAvailable')}
                </p>
              )}
            </div>

            {/* Payment History */}
            <div className="u-card" style={{ padding: 20 }}>
              <h4 style={{ margin: '0 0 14px', color: '#5b21b6' }}>{FileText({ size: 16 })} {t('userprofile.paymentHistory')}</h4>
              {studentPaymentsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>
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
                  {t('userprofile.noPaymentsRegistered')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ─── Showcase Tab ─── */}
        {activeTab === 'showcase' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <ExecutiveShowcase
              userId={profile.id}
              isOwner={!!isOwn}
              isMaxUser={(profile as any).subscriptionTier === 'max' || profile.role === 'owner'}
            />
          </div>
        )}

        </div>
      </div>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>
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

      {/* Edit Info Modal */}
      {showEditInfoModal && (
        <div className="modal-overlay" onClick={() => setShowEditInfoModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>Editar Información</h3>
              <button className="modal-close" onClick={() => setShowEditInfoModal(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 0 8px' }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Carrera</label>
                <input className="form-input" style={{ marginTop: 4 }} value={editInfoForm.career} onChange={e => setEditInfoForm(f => ({ ...f, career: e.target.value }))} placeholder="Ej: Ingeniería Civil" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Universidad</label>
                <input className="form-input" style={{ marginTop: 4 }} value={editInfoForm.university} onChange={e => setEditInfoForm(f => ({ ...f, university: e.target.value }))} placeholder="Ej: Universidad de Chile" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Semestre</label>
                <input className="form-input" style={{ marginTop: 4 }} type="number" min={1} max={20} value={editInfoForm.semester} onChange={e => setEditInfoForm(f => ({ ...f, semester: Number(e.target.value) }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Estado académico</label>
                <select className="form-input" style={{ marginTop: 4 }} value={editInfoForm.academicStatus} onChange={e => setEditInfoForm(f => ({ ...f, academicStatus: e.target.value }))}>
                  <option value="estudiante">Estudiante</option>
                  <option value="egresado">Egresado</option>
                  <option value="titulado">Titulado</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Título profesional</label>
                <input className="form-input" style={{ marginTop: 4 }} value={editInfoForm.professionalTitle} onChange={e => setEditInfoForm(f => ({ ...f, professionalTitle: e.target.value }))} placeholder="Ej: Ingeniero Civil Industrial" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Descripción</label>
                <textarea className="form-input" style={{ marginTop: 4 }} rows={3} value={editInfoForm.bio} onChange={e => setEditInfoForm(f => ({ ...f, bio: e.target.value }))} placeholder="Cuéntanos sobre ti..." maxLength={300} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => setShowEditInfoModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveInfo} disabled={editInfoSaving}>
                {editInfoSaving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tutoring Request Modal */}
      {showTutoringModal && (
        <div className="modal-overlay" onClick={() => setShowTutoringModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            {tutoringSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div className="empty-state-icon">{CheckCircle({ size: 48 })}</div>
                <h3 style={{ margin: '0 0 8px' }}>{t('userprofile.requestSent')}</h3>
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
            <h3>{t('userprofile.reportTitle')} {profile?.firstName} {profile?.lastName}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
              {t('userprofile.reportDesc')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {[t('userprofile.reportInappropriate'), t('userprofile.reportHarassment'), t('userprofile.reportSpam'), t('userprofile.reportFakeAccount'), t('userprofile.reportNoCollab')].map(reason => (
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
              placeholder={t('userprofile.additionalDetails')}
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowReportModal(false)}>Cancelar</button>
              <button className="btn btn-danger btn-sm" onClick={handleReport} disabled={!reportReason.trim()}>{t('userprofile.sendReport')}</button>
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
      <CoverPhotoModal
        isOpen={showCoverModal}
        onClose={() => setShowCoverModal(false)}
        currentCover={profile?.coverPhoto || ''}
        currentCoverType={profile?.coverType || 'template'}
        currentPositionY={profile?.coverPositionY ?? 50}
        onSaved={(coverPhoto, coverType, positionY) => {
          // api.updateCoverPhoto ya guardó en backend — solo actualizar estado local
          setProfile((prev: any) => ({ ...prev, coverPhoto, coverType, coverPositionY: positionY }))
        }}
      />

    </div>
  )
}
