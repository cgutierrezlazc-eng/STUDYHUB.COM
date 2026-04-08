import React, { useState, useRef, useMemo } from 'react'
import { useAuth } from '../services/auth'
import { useI18n, LANGUAGES } from '../services/i18n'
import { Gender, Language } from '../types'
import { api } from '../services/api'
import TermsOfService from '../components/TermsOfService'
import { getCurrencyForCountry, formatUsdToLocal } from '../utils/currency'
import { searchUniversities, getUniversitiesForCountry, University } from '../data/universities'
import { Brain, Users, BookOpen, Camera, Eye, EyeOff, Inbox } from '../components/Icons'

interface Props {
  onSwitchToLogin: () => void
  onBack?: () => void
}

export default function Register({ onSwitchToLogin, onBack }: Props) {
  const { register, loginWithGoogle } = useAuth()
  const { t, lang, setLang } = useI18n()
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showTOS, setShowTOS] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [expectedCode, setExpectedCode] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const usernameTimer = useRef<any>(null)
  const [uniSearch, setUniSearch] = useState('')
  const [showUniDropdown, setShowUniDropdown] = useState(false)
  const [selectedUni, setSelectedUni] = useState<University | null>(null)
  const uniInputRef = useRef<HTMLInputElement>(null)

  const STEP_TITLES = [t('reg.step1'), t('reg.step2'), t('reg.step3'), t('reg.stepFinal')]
  const STEP_SUBTITLES = [t('reg.subtitle1'), t('reg.subtitle2'), t('reg.subtitle3'), t('reg.subtitleFinal')]

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: '',
    avatar: '',
    gender: 'unspecified' as Gender,
    language: lang as Language,
    university: '',
    career: '',
    semester: 1,
    academicRegime: 'semestral',
    entryYear: new Date().getFullYear(),
    careerDuration: 5,
    bio: '',
    username: '',
    country: 'CL',
    tosAccepted: false,
    academicStatus: 'estudiante' as 'estudiante' | 'egresado' | 'titulado',
    offersMentoring: false,
    mentoringServices: [] as string[],
    mentoringSubjects: [] as string[],
    mentoringDescription: '',
    mentoringPriceType: 'free' as 'free' | 'paid',
    mentoringPricePerHour: null as number | null,
    graduationStatusYear: null as number | null,
    titleYear: null as number | null,
    professionalTitle: '',
    studyStartDate: '',
  })

  const update = (field: string, value: string | number | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
    if (field === 'language') setLang(value as Language)
    if (field === 'username') checkUsernameAvailability(value as string)
  }

  const checkUsernameAvailability = (username: string) => {
    if (usernameTimer.current) clearTimeout(usernameTimer.current)
    if (!username || username.length < 3) {
      setUsernameAvailable(null)
      return
    }
    setCheckingUsername(true)
    usernameTimer.current = setTimeout(async () => {
      try {
        const result = await api.checkUsername(username)
        setUsernameAvailable(result.available)
      } catch {
        setUsernameAvailable(null)
      }
      setCheckingUsername(false)
    }, 500)
  }

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError(t('err.imgSize')); return }
    const reader = new FileReader()
    reader.onloadend = () => update('avatar', reader.result as string)
    reader.readAsDataURL(file)
  }

  const calculateAge = (birthDate: string): number => {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  const validateStep = (): boolean => {
    setError('')
    if (step === 0) {
      if (!form.email.trim()) { setError(t('err.invalidEmail')); return false }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError(t('err.invalidEmail')); return false }
      if (form.password.length < 8) { setError(t('err.pwdMin8')); return false }
      if (!/[A-Z]/.test(form.password)) { setError(t('err.pwdUppercase')); return false }
      if (!/[0-9]/.test(form.password)) { setError(t('err.pwdNumber')); return false }
      if (form.password !== form.confirmPassword) { setError(t('err.passwordMismatch')); return false }
    }
    if (step === 1) {
      if (!form.firstName.trim()) { setError(t('err.enterName')); return false }
      if (!form.lastName.trim()) { setError(t('err.enterLastName')); return false }
      if (!form.birthDate) { setError(t('err.enterBirthDate')); return false }
      if (calculateAge(form.birthDate) < 18) { setError(t('err.under18')); return false }
    }
    if (step === 2) {
      if (!form.username.trim()) { setError(t('err.usernameRequired')); return false }
      if (form.username.length < 3 || form.username.length > 30) { setError(t('err.usernameLength')); return false }
      if (!/^[a-z0-9._]+$/.test(form.username)) { setError(t('err.usernameChars')); return false }
      if (usernameAvailable === false) { setError(t('err.usernameTaken')); return false }
      if (!form.university.trim()) { setError(t('err.enterUniversity')); return false }
      if (!form.career.trim()) { setError(t('err.enterCareer')); return false }
      if (form.academicStatus === 'titulado' && !form.professionalTitle.trim()) { setError(t('err.enterProfTitle')); return false }
      if ((form.academicStatus === 'egresado' || form.academicStatus === 'titulado') && !form.graduationStatusYear) { setError(t('err.selectGradYear')); return false }
      if (form.academicStatus === 'titulado' && !form.titleYear) { setError(t('err.selectTitleYear')); return false }
      if (form.mentoringServices.length > 0 && form.mentoringPriceType === 'paid' && !form.mentoringPricePerHour) { setError(t('err.enterMentoringPrice')); return false }
      if (!form.tosAccepted) { setError(t('err.acceptTOS')); return false }
    }
    return true
  }

  const handleNext = () => { if (validateStep()) setStep(s => s + 1) }
  const handleBack = () => setStep(s => s - 1)

  const handleSubmit = async () => {
    if (!validateStep()) return
    setIsLoading(true)
    const result = await register(form)
    setIsLoading(false)
    if (!result.success) {
      setError(result.error || t('err.registerError'))
    } else if (result.verificationCode) {
      setExpectedCode(result.verificationCode)
      setVerificationSent(true)
      setStep(3) // Go to verification step
    }
  }

  const handleVerify = async () => {
    if (verificationCode === expectedCode) {
      try {
        await api.verifyEmail(verificationCode)
      } catch (err: any) { console.error('Email verification failed:', err) }
      // Already logged in from register, just close
      window.location.reload()
    } else {
      setError(t('err.invalidCode'))
    }
  }

  const handleGoogle = async () => {
    setIsLoading(true)
    await loginWithGoogle()
    setIsLoading(false)
  }

  const passwordStrength = () => {
    const p = form.password
    if (p.length === 0) return { level: 0, label: '', color: 'transparent' }
    let score = 0
    if (p.length >= 6) score++
    if (p.length >= 10) score++
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++
    if (/\d/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    if (score <= 1) return { level: 1, label: t('pwd.weak'), color: '#ef4444' }
    if (score <= 3) return { level: 2, label: t('pwd.medium'), color: '#f97316' }
    return { level: 3, label: t('pwd.strong'), color: '#22c55e' }
  }
  const strength = passwordStrength()

  const uniResults = useMemo(() => {
    if (!uniSearch || uniSearch.length < 2) return []
    return searchUniversities(uniSearch, form.country).slice(0, 15)
  }, [uniSearch, form.country])

  const localCurrency = getCurrencyForCountry(form.country)

  const GENDER_OPTIONS: { value: Gender; label: string; icon: string }[] = [
    { value: 'male', label: t('reg.genderMale'), icon: '♂' },
    { value: 'female', label: t('reg.genderFemale'), icon: '♀' },
    { value: 'unspecified', label: t('reg.genderUnspecified'), icon: '~' },
  ]

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#2D62C8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg viewBox="0 0 40 40" width={22} height={22}><circle cx="20" cy="20" r="12" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray="56 19" /></svg>
            </div>
            <span style={{ fontFamily: "'Outfit', -apple-system, sans-serif", fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
              conni<span style={{ color: '#2D62C8' }}>ku</span>
            </span>
          </div>
        </div>
        <div className="auth-free-badge">
          {t('reg.freeTrial')}
        </div>
        <div className="auth-features">
          <div className="auth-feature">
            <span className="auth-feature-icon">{Brain({ size: 20 })}</span>
            <div><strong>{t('reg.featStudy')}</strong><p>{t('reg.featStudyDesc')}</p></div>
          </div>
          <div className="auth-feature">
            <span className="auth-feature-icon">{Users({ size: 20 })}</span>
            <div><strong>{t('feat.community')}</strong><p>{t('feat.communityDesc')}</p></div>
          </div>
          <div className="auth-feature">
            <span className="auth-feature-icon">{BookOpen({ size: 20 })}</span>
            <div><strong>{t('reg.featGuides')}</strong><p>{t('reg.featGuidesDesc')}</p></div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          {onBack && (
            <button onClick={onBack} style={{ position: 'absolute', top: 16, left: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14 }}>
              {t('auth.backBtn')}
            </button>
          )}
          {/* Language selector at top */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <select value={form.language} onChange={e => update('language', e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
              {LANGUAGES.slice(0, 10).map(l => (
                <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
              ))}
            </select>
          </div>

          {/* Progress Steps */}
          <div className="auth-steps">
            {STEP_TITLES.map((title, i) => (
              <div key={i} className={`auth-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                <div className="auth-step-dot">{i < step ? '✓' : i + 1}</div>
                <span>{title}</span>
              </div>
            ))}
          </div>
          <div className="auth-progress-bar">
            <div className="auth-progress-fill" style={{ width: `${((step + 1) / 4) * 100}%` }} />
          </div>

          <h2>{STEP_SUBTITLES[step]}</h2>

          {step === 0 && (
            <>
              <button className="btn-google" onClick={handleGoogle} disabled={isLoading}>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t('auth.googleRegister')}
              </button>
              <div className="auth-divider"><span>{t('auth.orEmailRegister')}</span></div>

              <div className="auth-field">
                <label>{t('auth.email')}</label>
                <input type="email" placeholder={t('auth.emailPlaceholder')} value={form.email} onChange={e => update('email', e.target.value)} autoFocus />
              </div>
              <div className="auth-field">
                <label>{t('auth.password')}</label>
                <div className="auth-password-wrap">
                  <input type={showPassword ? 'text' : 'password'} placeholder={t('pwd.min')} value={form.password} onChange={e => update('password', e.target.value)} />
                  <button type="button" className="auth-eye" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>{showPassword ? EyeOff({ size: 16 }) : Eye({ size: 16 })}</button>
                </div>
                {form.password.length > 0 && (
                  <div className="auth-strength">
                    <div className="auth-strength-bar"><div style={{ width: `${(strength.level / 3) * 100}%`, background: strength.color }} /></div>
                    <span style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                )}
              </div>
              <div className="auth-field">
                <label>{t('auth.confirmPassword')}</label>
                <input type="password" placeholder={t('auth.confirmPlaceholder')} value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="auth-avatar-section" onClick={handleAvatarClick}>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                {form.avatar ? (
                  <img src={form.avatar} alt="Avatar" className="auth-avatar-img" />
                ) : (
                  <div className="auth-avatar-placeholder"><span>{Camera({ size: 20 })}</span><small>{t('reg.uploadPhoto')}</small></div>
                )}
              </div>

              <div className="auth-row">
                <div className="auth-field"><label>{t('reg.name')}</label><input placeholder={t('reg.name')} value={form.firstName} onChange={e => update('firstName', e.target.value)} autoFocus /></div>
                <div className="auth-field"><label>{t('reg.lastName')}</label><input placeholder={t('reg.lastName')} value={form.lastName} onChange={e => update('lastName', e.target.value)} /></div>
              </div>

              {/* Username */}
              <div className="auth-field">
                <label>{t('reg.username')} <span className="auth-optional">({t('reg.usernameHint')})</span></label>
                <div className="auth-username-wrap">
                  <span className="auth-username-at">@</span>
                  <input
                    placeholder={t('reg.usernamePlaceholder')}
                    value={form.username}
                    onChange={e => update('username', e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                  />
                  {checkingUsername && <span className="auth-username-status">...</span>}
                  {!checkingUsername && usernameAvailable === true && <span className="auth-username-status" style={{ color: '#22c55e' }}>✓</span>}
                  {!checkingUsername && usernameAvailable === false && <span className="auth-username-status" style={{ color: '#ef4444' }}>✗</span>}
                </div>
              </div>

              {/* Gender */}
              <div className="auth-field">
                <label>{t('reg.gender')}</label>
                <div className="auth-gender-options">
                  {GENDER_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`auth-gender-btn ${form.gender === opt.value ? 'active' : ''}`}
                      onClick={() => update('gender', opt.value)}
                    >
                      <span>{opt.icon}</span> {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="auth-row">
                <div className="auth-field"><label>{t('reg.phone')} <span className="auth-optional">{t('reg.optional')}</span></label><input type="tel" placeholder="+56 9 1234 5678" value={form.phone} onChange={e => update('phone', e.target.value)} /></div>
                <div className="auth-field">
                  <label>{t('reg.birthDate')} <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="date" value={form.birthDate} onChange={e => update('birthDate', e.target.value)} max={new Date(new Date().getFullYear() - 18, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0]} />
                  {form.birthDate && calculateAge(form.birthDate) < 18 && (
                    <small style={{ color: '#ef4444', marginTop: 4, display: 'block' }}>{t('err.under18')}</small>
                  )}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="auth-field">
                <label>{t('reg.usernameLabel')}</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600, fontSize: 15 }}>@</span>
                  <input
                    placeholder={t('reg.usernamePlaceholderShort')}
                    value={form.username}
                    onChange={e => update('username', e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                    style={{ paddingLeft: 32 }}
                    autoFocus
                    maxLength={30}
                  />
                  {form.username.length >= 3 && (
                    <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13 }}>
                      {checkingUsername ? '...' : usernameAvailable === true ? '✓' : usernameAvailable === false ? `✗ ${t('reg.usernameInUse')}` : ''}
                    </span>
                  )}
                </div>
                <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4, display: 'block' }}>
                  {t('reg.usernameHelp')}
                </small>
              </div>
              <div className="auth-field">
                <label>{t('reg.country')}</label>
                <select value={form.country || 'CL'} onChange={e => update('country', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  {[
                    ['CL','Chile'],['MX','México'],['CO','Colombia'],['PE','Perú'],
                    ['AR','Argentina'],['BR','Brasil'],['EC','Ecuador'],['UY','Uruguay'],
                    ['PY','Paraguay'],['BO','Bolivia'],['VE','Venezuela'],['CR','Costa Rica'],
                    ['PA','Panamá'],['DO','Rep. Dominicana'],['GT','Guatemala'],['HN','Honduras'],
                    ['SV','El Salvador'],['NI','Nicaragua'],
                    ['US','Estados Unidos'],['CA','Canadá'],['GB','Reino Unido'],['ES','España'],
                    ['DE','Alemania'],['FR','Francia'],['IT','Italia'],['PT','Portugal'],
                    ['JP','Japón'],['KR','Corea del Sur'],['AU','Australia'],['IN','India'],
                  ].map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="auth-field" style={{ position: 'relative' }}>
                <label>{t('reg.university')} *</label>
                <div style={{ position: 'relative' }}>
                  {selectedUni && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                      background: 'rgba(45,98,200,0.06)', border: '1px solid rgba(45,98,200,0.2)',
                      borderRadius: 8, marginBottom: 6,
                    }}>
                      {selectedUni.logoUrl && (
                        <img src={selectedUni.logoUrl} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'contain' }}
                          onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedUni.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selectedUni.shortName} · {selectedUni.type === 'cft' ? 'CFT' : selectedUni.type === 'instituto' ? 'Instituto' : 'Universidad'}</div>
                      </div>
                      <button type="button" onClick={() => { setSelectedUni(null); setUniSearch(''); update('university', '') }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: '2px 6px' }}>✕</button>
                    </div>
                  )}
                  {!selectedUni && (
                    <>
                      <input
                        ref={uniInputRef}
                        placeholder={t('reg.uniSearchPlaceholder')}
                        value={uniSearch}
                        onChange={e => { setUniSearch(e.target.value); setShowUniDropdown(true) }}
                        onFocus={() => setShowUniDropdown(true)}
                        style={{ width: '100%' }}
                      />
                      {showUniDropdown && uniSearch.length >= 2 && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                          background: 'var(--bg-card)', border: '1px solid var(--border)',
                          borderRadius: 10, maxHeight: 260, overflowY: 'auto',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.18)', marginTop: 4,
                        }}>
                          {uniResults.length === 0 ? (
                            <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 13 }}>
                              {t('reg.uniNoResults')}
                              <button type="button" onClick={() => { update('university', uniSearch); setShowUniDropdown(false) }}
                                style={{ display: 'block', marginTop: 6, color: '#2D62C8', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                                {t('reg.uniUseCustom').replace('{name}', uniSearch)}
                              </button>
                            </div>
                          ) : (
                            uniResults.map(uni => (
                              <button key={uni.id} type="button"
                                onClick={() => {
                                  setSelectedUni(uni)
                                  update('university', uni.name)
                                  setUniSearch('')
                                  setShowUniDropdown(false)
                                }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                  padding: '8px 14px', border: 'none', borderBottom: '1px solid var(--border)',
                                  background: 'transparent', cursor: 'pointer', textAlign: 'left',
                                  color: 'var(--text-primary)',
                                }}>
                                {uni.logoUrl ? (
                                  <img src={uni.logoUrl} alt="" style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'contain', flexShrink: 0 }}
                                    onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
                                ) : (
                                  <div style={{ width: 28, height: 28, borderRadius: 4, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>
                                    {uni.shortName.slice(0, 2)}
                                  </div>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uni.name}</div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                    {uni.shortName} · {uni.type === 'cft' ? 'CFT' : uni.type === 'instituto' ? 'IP' : uni.type === 'university' ? 'University' : 'Universidad'}
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="auth-field">
                <label>{t('reg.career')}</label>
                <input placeholder={t('reg.careerPlaceholder')} value={form.career} onChange={e => update('career', e.target.value)} />
              </div>

              {/* Study Start Date */}
              <div className="auth-field">
                <label>{t('reg.studyStartDate')}</label>
                <input
                  type="date"
                  value={form.studyStartDate}
                  onChange={e => update('studyStartDate', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  min="1950-01-01"
                />
                <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4, display: 'block' }}>
                  {form.studyStartDate
                    ? `${Math.max(0, Math.floor((Date.now() - new Date(form.studyStartDate).getTime()) / 86400000))} ${t('reg.studyingDays')}`
                    : t('reg.studyStartHint')
                  }
                </small>
              </div>

              {/* Academic Status */}
              <div className="auth-field">
                <label>{t('reg.academicStatus')}</label>
                <div className="auth-semester-picker">
                  {([
                    { value: 'estudiante', label: t('reg.statusStudent'), desc: t('reg.statusStudentDesc') },
                    { value: 'egresado', label: t('reg.statusGraduate'), desc: t('reg.statusGraduateDesc') },
                    { value: 'titulado', label: t('reg.statusTitled'), desc: t('reg.statusTitledDesc') },
                  ] as const).map(opt => (
                    <button key={opt.value} type="button"
                      className={`auth-semester-btn ${form.academicStatus === opt.value ? 'active' : ''}`}
                      style={{ flex: 1, flexDirection: 'column', padding: '10px 8px', lineHeight: 1.3 }}
                      onClick={() => {
                        update('academicStatus', opt.value)
                        if (opt.value === 'estudiante') {
                          setForm(prev => ({ ...prev, academicStatus: 'estudiante', offersMentoring: false, mentoringServices: [], mentoringSubjects: [], mentoringDescription: '', mentoringPriceType: 'free' as const, mentoringPricePerHour: null, graduationStatusYear: null, titleYear: null, professionalTitle: '' }))
                        }
                      }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{opt.label}</span>
                      <span style={{ fontSize: 10, opacity: 0.7 }}>{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Egresado/Titulado year fields */}
              {(form.academicStatus === 'egresado' || form.academicStatus === 'titulado') && (
                <div className="auth-row">
                  <div className="auth-field">
                    <label>{t('reg.graduationYear')}</label>
                    <select value={form.graduationStatusYear || ''} onChange={e => setForm(prev => ({ ...prev, graduationStatusYear: parseInt(e.target.value) || null }))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      <option value="">{t('reg.selectOption')}</option>
                      {Array.from({ length: new Date().getFullYear() - 1950 + 1 }, (_, i) => new Date().getFullYear() - i).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  {form.academicStatus === 'titulado' && (
                    <div className="auth-field">
                      <label>{t('reg.titleYear')}</label>
                      <select value={form.titleYear || ''} onChange={e => setForm(prev => ({ ...prev, titleYear: parseInt(e.target.value) || null }))}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                        <option value="">{t('reg.selectOption')}</option>
                        {Array.from({ length: new Date().getFullYear() - 1950 + 1 }, (_, i) => new Date().getFullYear() - i).map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Professional Title - for titulado */}
              {form.academicStatus === 'titulado' && (
                <div className="auth-field">
                  <label>{t('reg.professionalTitle')}</label>
                  <input placeholder={t('reg.professionalTitlePlaceholder')}
                    value={form.professionalTitle}
                    onChange={e => update('professionalTitle', e.target.value)} />
                </div>
              )}

              {/* Tutoring options - for titulado or egresado */}
              {(form.academicStatus === 'titulado' || form.academicStatus === 'egresado') && (
                <div className="auth-field" style={{ background: 'var(--bg-tertiary, rgba(45,98,200,0.04))', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontWeight: 600, fontSize: 15 }}>
                    {t('reg.offerTutoring')}
                  </label>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                    {t('reg.tutoringDesc').replace('{status}', form.academicStatus)}
                  </p>

                  {/* Service type selection */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    {[
                      { id: 'ayudantias', label: t('reg.svcTutoring'), desc: t('reg.svcTutoringDesc') },
                      { id: 'cursos', label: t('reg.svcCourses'), desc: t('reg.svcCoursesDesc') },
                      { id: 'clases_particulares', label: t('reg.svcPrivate'), desc: t('reg.svcPrivateDesc') },
                    ].map(svc => {
                      const selected = form.mentoringServices.includes(svc.id)
                      return (
                        <button key={svc.id} type="button"
                          style={{
                            flex: 1, minWidth: 110, padding: '10px 8px', borderRadius: 10,
                            border: selected ? '2px solid #2D62C8' : '1px solid var(--border)',
                            background: selected ? 'rgba(45,98,200,0.08)' : 'var(--bg-secondary)',
                            color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'center',
                            transition: 'all 0.2s',
                          }}
                          onClick={() => {
                            const services = selected
                              ? form.mentoringServices.filter(s => s !== svc.id)
                              : [...form.mentoringServices, svc.id]
                            setForm(prev => ({ ...prev, mentoringServices: services, offersMentoring: services.length > 0 }))
                          }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{svc.label}</div>
                          <div style={{ fontSize: 10, opacity: 0.7 }}>{svc.desc}</div>
                        </button>
                      )
                    })}
                  </div>

                  {form.mentoringServices.length > 0 && (
                    <>
                      {/* PRO plan requirement warning */}
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.15))',
                        borderRadius: 10, padding: '14px 16px', marginBottom: 14,
                        border: '2px solid rgba(245,158,11,0.4)',
                        position: 'relative', overflow: 'hidden',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <div style={{
                            background: 'linear-gradient(135deg, #F59E0B, #D97706)', borderRadius: 8,
                            padding: '6px 10px', fontWeight: 800, fontSize: 12, color: '#fff',
                            letterSpacing: 0.5, flexShrink: 0, marginTop: 1,
                          }}>PRO</div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#92400E', margin: '0 0 4px' }}>
                              {t('reg.proRequired')}
                            </p>
                            <p style={{ fontSize: 12, color: '#A16207', margin: 0, lineHeight: 1.5 }}>
                              {t('reg.proRequiredDesc')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Subjects */}
                      <div className="auth-field" style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 13, fontWeight: 600 }}>{t('reg.subjectsLabel')}</label>
                        <input
                          placeholder={t('reg.subjectsPlaceholder')}
                          value={form.mentoringSubjects.join(', ')}
                          onChange={e => setForm(prev => ({ ...prev, mentoringSubjects: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                          style={{ fontSize: 13 }}
                        />
                      </div>

                      {/* Description */}
                      <div className="auth-field" style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 13, fontWeight: 600 }}>{t('reg.offerDescription')}</label>
                        <textarea
                          placeholder={t('reg.offerDescPlaceholder')}
                          value={form.mentoringDescription}
                          onChange={e => setForm(prev => ({ ...prev, mentoringDescription: e.target.value }))}
                          rows={2}
                          style={{ fontSize: 13 }}
                        />
                      </div>

                      {/* Pricing */}
                      <div className="auth-field" style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 13, fontWeight: 600 }}>{t('reg.pricingMode')}</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="button"
                            style={{
                              flex: 1, padding: '10px', borderRadius: 10,
                              border: form.mentoringPriceType === 'free' ? '2px solid #22c55e' : '1px solid var(--border)',
                              background: form.mentoringPriceType === 'free' ? 'rgba(34,197,94,0.08)' : 'var(--bg-secondary)',
                              color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'center',
                            }}
                            onClick={() => setForm(prev => ({ ...prev, mentoringPriceType: 'free' as const, mentoringPricePerHour: null }))}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>{t('reg.priceFree')}</div>
                            <div style={{ fontSize: 10, opacity: 0.7 }}>{t('reg.priceFreeDesc')}</div>
                          </button>
                          <button type="button"
                            style={{
                              flex: 1, padding: '10px', borderRadius: 10,
                              border: form.mentoringPriceType === 'paid' ? '2px solid #2D62C8' : '1px solid var(--border)',
                              background: form.mentoringPriceType === 'paid' ? 'rgba(45,98,200,0.08)' : 'var(--bg-secondary)',
                              color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'center',
                            }}
                            onClick={() => setForm(prev => ({ ...prev, mentoringPriceType: 'paid' as const }))}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#2D62C8' }}>{t('reg.pricePaid')}</div>
                            <div style={{ fontSize: 10, opacity: 0.7 }}>{t('reg.pricePaidDesc')}</div>
                          </button>
                        </div>
                      </div>

                      {form.mentoringPriceType === 'paid' && (
                        <div className="auth-field" style={{ marginBottom: 12 }}>
                          <label style={{ fontSize: 13, fontWeight: 600 }}>{t('reg.pricePerHour')}</label>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>$</span>
                            <input
                              type="number"
                              placeholder="Ej: 10"
                              value={form.mentoringPricePerHour || ''}
                              onChange={e => setForm(prev => ({ ...prev, mentoringPricePerHour: parseFloat(e.target.value) || null }))}
                              min={1}
                              step={0.5}
                              style={{ fontSize: 13, paddingLeft: 28 }}
                            />
                          </div>
                          {form.mentoringPricePerHour && localCurrency.code !== 'USD' && (
                            <div style={{ background: 'rgba(45,98,200,0.05)', borderRadius: 6, padding: '6px 10px', marginTop: 6, border: '1px solid rgba(45,98,200,0.1)' }}>
                              <span style={{ fontSize: 12, color: '#2D62C8', fontWeight: 600 }}>
                                ≈ {formatUsdToLocal(form.mentoringPricePerHour, form.country)} /hora
                              </span>
                              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 6 }}>{t('reg.approxConversion')}</span>
                            </div>
                          )}
                          <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4, display: 'block' }}>
                            {t('reg.priceTransparency')}
                          </small>
                        </div>
                      )}

                      {/* Chat platform notice */}
                      <div style={{ background: 'rgba(45,98,200,0.06)', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(45,98,200,0.15)' }}>
                        <p style={{ fontSize: 12, color: '#2D62C8', margin: 0, fontWeight: 500 }}>
                          {t('reg.tutoringChatNotice')}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="auth-field">
                <label>{t('reg.academicRegime')}</label>
                <div className="auth-semester-picker">
                  {[
                    { value: 'semestral', label: t('reg.regimeSemester') },
                    { value: 'trimestral', label: t('reg.regimeTrimester') },
                    { value: 'cuatrimestral', label: t('reg.regimeQuarter') },
                    { value: 'anual', label: t('reg.regimeAnnual') },
                  ].map(r => (
                    <button key={r.value} type="button" className={`auth-semester-btn ${form.academicRegime === r.value ? 'active' : ''}`}
                      style={{ flex: 1 }}
                      onClick={() => { update('academicRegime', r.value); update('semester', 1) }}>{r.label}</button>
                  ))}
                </div>
              </div>
              <div className="auth-field">
                <label>{form.academicRegime === 'semestral' ? t('reg.currentSemester') : form.academicRegime === 'trimestral' ? t('reg.currentTrimester') : form.academicRegime === 'cuatrimestral' ? t('reg.currentQuarter') : t('reg.currentYear')}</label>
                <div className="auth-semester-picker">
                  {Array.from({ length: form.academicRegime === 'semestral' ? 10 : form.academicRegime === 'trimestral' ? 12 : form.academicRegime === 'cuatrimestral' ? 9 : 8 }, (_, i) => i + 1).map(s => (
                    <button key={s} type="button" className={`auth-semester-btn ${form.semester === s ? 'active' : ''}`} onClick={() => update('semester', s)}>
                      {s === (form.academicRegime === 'semestral' ? 10 : form.academicRegime === 'trimestral' ? 12 : form.academicRegime === 'cuatrimestral' ? 9 : 8) ? `${s}+` : s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="auth-row">
                <div className="auth-field">
                  <label>{t('reg.entryYear')}</label>
                  <select value={form.entryYear} onChange={e => update('entryYear', parseInt(e.target.value))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    {Array.from({ length: new Date().getFullYear() - 1950 + 1 }, (_, i) => new Date().getFullYear() - i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="auth-field">
                  <label>{t('reg.careerDuration')}</label>
                  <select value={form.careerDuration} onChange={e => update('careerDuration', parseInt(e.target.value))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    {[2,3,4,5,6,7,8].map(y => (
                      <option key={y} value={y}>{y} {t('reg.years')}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="auth-field">
                <label>{t('reg.bio')} <span className="auth-optional">{t('reg.optional')}</span></label>
                <textarea placeholder={t('reg.bioPlaceholder')} value={form.bio} onChange={e => update('bio', e.target.value)} rows={3} />
              </div>

              {/* TOS Checkbox */}
              <div className="auth-tos-check">
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.tosAccepted}
                    onChange={e => update('tosAccepted', e.target.checked)}
                  />
                  <span>
                    {t('tos.iAccept')}{' '}
                    <button type="button" className="auth-tos-link" onClick={() => setShowTOS(true)}>
                      {t('tos.termsLink')}
                    </button>
                  </span>
                </label>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="auth-verification">
              <div className="auth-verification-icon">{Inbox({ size: 48 })}</div>
              <p>{t('reg.verificationSent')}</p>
              <p className="auth-verification-hint">{t('reg.verificationHint')}</p>
              <div className="auth-field">
                <label>{t('reg.verificationCode')}</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="auth-code-input"
                  autoFocus
                />
              </div>
              {expectedCode && (
                <p className="auth-verification-demo">
                  Demo: {t('reg.yourCode')} <strong>{expectedCode}</strong>
                </p>
              )}
              <button className="btn-auth-primary" onClick={handleVerify} disabled={verificationCode.length !== 6}>
                {t('reg.verify')}
              </button>
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          {step < 3 && (
            <div className="auth-actions">
              {step > 0 && <button className="btn-auth-secondary" onClick={handleBack}>{t('auth.back')}</button>}
              {step < 2 ? (
                <button className="btn-auth-primary" onClick={handleNext}>{t('auth.next')}</button>
              ) : (
                <button className="btn-auth-primary" onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? t('auth.creating') : t('auth.createAccount')}
                </button>
              )}
            </div>
          )}

          {step < 3 && (
            <p className="auth-switch">
              {t('auth.hasAccount')}{' '}
              <button onClick={onSwitchToLogin}>{t('auth.loginLink')}</button>
            </p>
          )}
        </div>
      </div>

      {showTOS && <TermsOfService onClose={() => setShowTOS(false)} />}
    </div>
  )
}
