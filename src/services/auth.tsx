import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../types'
import { api } from './api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  loginWithGoogle: () => Promise<void>
  register: (data: any) => Promise<{ success: boolean; error?: string; verificationCode?: string }>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<any>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_KEY = 'conniku_token'
const REFRESH_TOKEN_KEY = 'conniku_refresh_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = async () => {
    // Retry up to 2 times to handle Render cold starts (~30s spin-up)
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const data = await api.getMe()
        setUser(data)
        return
      } catch {
        // If request() already cleared tokens (401 + refresh failed), stop
        if (!localStorage.getItem(TOKEN_KEY)) {
          setUser(null)
          return
        }
        // Network error — wait 3s before retry (backend waking up)
        if (attempt === 0) {
          await new Promise(r => setTimeout(r, 3000))
        }
      }
    }
    // Retries exhausted, still network error — keep tokens for next reload
    setUser(null)
  }

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      refreshUser().finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const data = await api.login(email, password)
      localStorage.setItem(TOKEN_KEY, data.token)
      if (data.refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token)
      setUser(data.user)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al iniciar sesión' }
    }
  }

  const loginWithGoogle = async () => {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

    if (!GOOGLE_CLIENT_ID) {
      console.error('Google Client ID not configured. Set VITE_GOOGLE_CLIENT_ID env var.')
      return
    }

    // Load Google Identity Services script if not loaded
    if (!(window as any).google?.accounts) {
      await new Promise<void>((resolve) => {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.onload = () => resolve()
        document.head.appendChild(script)
      })
    }

    // Use Google One Tap / popup to get credential
    return new Promise<void>((resolve) => {
      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          try {
            // Send Google credential to our backend for verification
            const data = await api.googleAuth(response.credential)
            localStorage.setItem(TOKEN_KEY, data.token)
            if (data.refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token)
            setUser(data.user)
          } catch (err) {
            console.error('Google login error:', err)
          }
          resolve()
        },
      })
      ;(window as any).google.accounts.id.prompt()
    })
  }

  const register = async (formData: any) => {
    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        gender: formData.gender || 'unspecified',
        language: formData.language || 'es',
        university: formData.university || '',
        career: formData.career || '',
        semester: formData.semester || 1,
        phone: formData.phone || '',
        birth_date: formData.birthDate || '',
        bio: formData.bio || '',
        avatar: formData.avatar || '',
        username: formData.username || null,
        tos_accepted: formData.tosAccepted || false,
        academic_status: formData.academicStatus || 'estudiante',
        offers_mentoring: formData.offersMentoring || false,
        mentoring_services: formData.mentoringServices || [],
        professional_title: formData.professionalTitle || '',
        mentoring_subjects: formData.mentoringSubjects || [],
        mentoring_description: formData.mentoringDescription || '',
        mentoring_price_type: formData.mentoringPriceType || 'free',
        mentoring_price_per_hour: formData.mentoringPricePerHour || null,
        graduation_status_year: formData.graduationStatusYear || null,
        title_year: formData.titleYear || null,
        study_start_date: formData.studyStartDate || '',
      }
      const data = await api.register(payload)
      localStorage.setItem(TOKEN_KEY, data.token)
      if (data.refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token)
      setUser(data.user)
      return { success: true, verificationCode: data.verificationCode }
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al crear la cuenta' }
    }
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    setUser(null)
  }

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return
    try {
      // Map frontend keys to backend snake_case
      const payload: any = {}
      if (data.firstName !== undefined) payload.first_name = data.firstName
      if (data.lastName !== undefined) payload.last_name = data.lastName
      if (data.gender !== undefined) payload.gender = data.gender
      if (data.language !== undefined) payload.language = data.language
      if ((data as any).languageSkill !== undefined) payload.language_skill = (data as any).languageSkill
      if (data.university !== undefined) payload.university = data.university
      if (data.career !== undefined) payload.career = data.career
      if (data.semester !== undefined) payload.semester = data.semester
      if (data.phone !== undefined) payload.phone = data.phone
      if (data.birthDate !== undefined) payload.birth_date = data.birthDate
      if (data.bio !== undefined) payload.bio = data.bio
      if (data.avatar !== undefined) payload.avatar = data.avatar
      if ((data as any).academicStatus !== undefined) payload.academic_status = (data as any).academicStatus
      if ((data as any).offersMentoring !== undefined) payload.offers_mentoring = (data as any).offersMentoring
      if ((data as any).mentoringServices !== undefined) payload.mentoring_services = (data as any).mentoringServices
      if ((data as any).mentoringSubjects !== undefined) payload.mentoring_subjects = (data as any).mentoringSubjects
      if ((data as any).professionalTitle !== undefined) payload.professional_title = (data as any).professionalTitle
      if ((data as any).mentoringDescription !== undefined) payload.mentoring_description = (data as any).mentoringDescription
      if ((data as any).mentoringPriceType !== undefined) payload.mentoring_price_type = (data as any).mentoringPriceType
      if ((data as any).mentoringPricePerHour !== undefined) payload.mentoring_price_per_hour = (data as any).mentoringPricePerHour
      if ((data as any).graduationStatusYear !== undefined) payload.graduation_status_year = (data as any).graduationStatusYear
      if ((data as any).titleYear !== undefined) payload.title_year = (data as any).titleYear
      if ((data as any).studyStartDate !== undefined) payload.study_start_date = (data as any).studyStartDate
      if ((data as any).coverPhoto !== undefined) payload.cover_photo = (data as any).coverPhoto
      if ((data as any).coverType !== undefined) payload.cover_type = (data as any).coverType
      if ((data as any).platformLanguage !== undefined) payload.platform_language = (data as any).platformLanguage
      if ((data as any).secondaryLanguages !== undefined) payload.secondary_languages = (data as any).secondaryLanguages

      const updated = await api.updateMe(payload)
      setUser(updated)
      return updated
    } catch (err) {
      // No actualizar estado local si el backend falló
      throw err  // propagar para que el caller maneje el error
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithGoogle, register, logout, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
