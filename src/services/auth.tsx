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
  updateProfile: (data: Partial<User>) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_KEY = 'conniku_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const data = await api.getMe()
      setUser(data)
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      setUser(null)
    }
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
      setUser(data.user)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al iniciar sesión' }
    }
  }

  const loginWithGoogle = async () => {
    const GOOGLE_CLIENT_ID = '179321527751-mvuuabn6uakngeksv5q22mda2uqhv3t3.apps.googleusercontent.com'

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
            // Decode JWT token from Google to get user info
            const payload = JSON.parse(atob(response.credential.split('.')[1]))
            const googleEmail = payload.email
            const firstName = payload.given_name || 'Usuario'
            const lastName = payload.family_name || ''
            const avatar = payload.picture || ''

            // Try to register with Google info
            try {
              const data = await api.register({
                email: googleEmail,
                password: `google_${payload.sub}`,
                first_name: firstName,
                last_name: lastName,
                avatar: avatar,
                gender: 'unspecified',
                language: 'es',
                birth_date: '1995-01-01',
                tos_accepted: true,
              })
              localStorage.setItem(TOKEN_KEY, data.token)
              setUser(data.user)
            } catch {
              // Already registered — login
              try {
                const data = await api.login(googleEmail, `google_${payload.sub}`)
                localStorage.setItem(TOKEN_KEY, data.token)
                setUser(data.user)
              } catch {}
            }
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
      }
      const data = await api.register(payload)
      localStorage.setItem(TOKEN_KEY, data.token)
      setUser(data.user)
      return { success: true, verificationCode: data.verificationCode }
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al crear la cuenta' }
    }
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
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

      const updated = await api.updateMe(payload)
      setUser(updated)
    } catch {
      // Fallback: update locally
      setUser(prev => prev ? { ...prev, ...data } : null)
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
