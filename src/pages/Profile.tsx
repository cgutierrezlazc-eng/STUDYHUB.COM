import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useAuth } from '../services/auth';
import { useI18n, LANGUAGES } from '../services/i18n';
import { api } from '../services/api';
import pfStyles from './Profile.module.css';
import { LanguageSkill } from '../types';
import MilestonePopup from '../components/MilestonePopup';
import CoverPhotoModal, { getCoverStyle } from '../components/CoverPhotoModal';
import { searchUniversities, University, getInstitutionCode } from '../data/universities';
import {
  Bell,
  AlertTriangle,
  MessageSquare,
  CheckCircle,
  Hourglass,
  GraduationCap,
  Users,
  Pencil,
  Lock,
  Settings,
  ClipboardList,
} from '../components/Icons';

type Section =
  | 'profile'
  | 'academic'
  | 'appearance'
  | 'notifications'
  | 'security'
  | 'email'
  | 'cv'
  | 'projects'
  | 'publications'
  | 'universidad';

interface ProfileProps {
  onNavigate?: (path: string) => void;
  embedded?: boolean;
  initialSection?: string;
}

export default function Profile({
  onNavigate,
  embedded = false,
  initialSection,
}: ProfileProps = {}) {
  const { user, updateProfile, logout } = useAuth();
  const { t } = useI18n();
  const [activeSection, setActiveSection] = useState<Section>(
    (initialSection as Section) || (embedded ? 'profile' : 'appearance')
  );
  const [currentTheme, setCurrentTheme] = useState<string>(
    localStorage.getItem('conniku_theme') || 'equilibrado'
  );
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [milestonePopup, setMilestonePopup] = useState<any>(null);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverMsg, setCoverMsg] = useState('');
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [form, setForm] = useState({ ...user! });
  const [cvVisibility, setCvVisibility] = useState<'public' | 'recruiters' | 'private'>(
    (user as any).cvVisibility || 'private'
  );
  const [cvData, setCvData] = useState({
    headline: (user as any).cvHeadline || '',
    summary: (user as any).cvSummary || '',
    experience: (user as any).cvExperience || '',
    skills: (user as any).cvSkills || '',
    certifications: (user as any).cvCertifications || '',
    languages: (user as any).cvLanguages || '',
    portfolio: (user as any).cvPortfolio || '',
  });
  const [cvUploading, setCvUploading] = useState(false);
  const [cvUploadMsg, setCvUploadMsg] = useState('');
  const cvFileRef = useRef<HTMLInputElement>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [bioGenerating, setBioGenerating] = useState(false);
  const [bioPreview, setBioPreview] = useState<string | null>(null);
  const [bioAuto, setBioAuto] = useState<boolean>((user as any).bioAuto || false);
  const [bioTogglingAuto, setBioTogglingAuto] = useState(false);

  const [projects, setProjects] = useState<any[]>([]);
  const [publications, setPublications] = useState<any[]>([]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [publicationsLoaded, setPublicationsLoaded] = useState(false);
  const [newProj, setNewProj] = useState({
    title: '',
    description: '',
    projectUrl: '',
    techStack: '',
    category: 'personal',
    year: new Date().getFullYear(),
  });
  const [newPub, setNewPub] = useState({
    type: 'paper',
    title: '',
    description: '',
    year: new Date().getFullYear(),
    url: '',
    institution: '',
  });

  // CV Unificado — compact summary from StudentCV/CVProfile
  const [myCV, setMyCV] = useState<any>(null);
  const [myCVLoaded, setMyCVLoaded] = useState(false);

  // ─── LMS Universidad ──────────────────────────────────────
  const [lmsConnections, setLmsConnections] = useState<any[]>([]);
  const [lmsLoaded, setLmsLoaded] = useState(false);
  const [lmsShowConnect, setLmsShowConnect] = useState(false);
  const [lmsPlatformType, setLmsPlatformType] = useState('auto');
  const [lmsPlatformName, setLmsPlatformName] = useState('');
  const [lmsUrl, setLmsUrl] = useState('');
  const [lmsToken, setLmsToken] = useState('');
  const [lmsConnecting, setLmsConnecting] = useState(false);
  const [lmsConnectError, setLmsConnectError] = useState('');
  const [lmsPending, setLmsPending] = useState<any[]>([]);
  const [lmsScanning, setLmsScanning] = useState(false);
  const [lmsScanMsg, setLmsScanMsg] = useState('');
  const [lmsSyncingId, setLmsSyncingId] = useState('');
  const [lmsProjects, setLmsProjects] = useState<any[]>([]);
  const [lmsAuthMethod, setLmsAuthMethod] = useState<'token' | 'password'>('token');
  const [lmsUsername, setLmsUsername] = useState('');
  const [lmsPassword, setLmsPassword] = useState('');
  const [lmsSubjectModal, setLmsSubjectModal] = useState(false);
  const [lmsDetectedCourses, setLmsDetectedCourses] = useState<
    { id: string; name: string; short_name: string; semester: string; year: number | null }[]
  >([]);
  const [lmsSelectedCourses, setLmsSelectedCourses] = useState<Set<string>>(new Set());
  const [lmsConnectionId, setLmsConnectionId] = useState('');
  const [lmsActivating, setLmsActivating] = useState(false);

  // Institution picker state (for university edit)
  const [uniSearch, setUniSearch] = useState('');
  const [showUniDropdown, setShowUniDropdown] = useState(false);
  const uniResults = useMemo(() => {
    if (!uniSearch || uniSearch.length < 2) return [];
    return searchUniversities(uniSearch, (user as any)?.country || '').slice(0, 15);
  }, [uniSearch]);

  // Auto-load CV summary when user navigates to CV section
  useEffect(() => {
    if (activeSection === 'cv' && !myCVLoaded) {
      setMyCVLoaded(true);
      api
        .getMyCV()
        .then((d: any) => setMyCV(d))
        .catch(() => {});
    }
  }, [activeSection, myCVLoaded]);

  // Auto-load LMS connections when user navigates to universidad section
  useEffect(() => {
    if (activeSection === 'universidad' && !lmsLoaded) {
      setLmsLoaded(true);
      Promise.all([
        api.lmsGetConnections().catch(() => []),
        api.lmsGetPending().catch(() => []),
        api.getProjects().catch(() => []),
      ]).then(([conns, pending, projs]: any) => {
        setLmsConnections(Array.isArray(conns) ? conns : []);
        setLmsPending(Array.isArray(pending) ? pending : []);
        setLmsProjects(Array.isArray(projs) ? projs : []);
      });
    }
  }, [activeSection, lmsLoaded]);

  if (!user) return null;

  const handleCvUpload = async (file: File) => {
    setCvUploading(true);
    setCvUploadMsg('');
    try {
      const res = await api.uploadCV(file);
      if (res.draft) {
        setCvData({
          headline: res.draft.headline || cvData.headline,
          summary: res.draft.summary || cvData.summary,
          experience: res.draft.experience || cvData.experience,
          skills: res.draft.skills || cvData.skills,
          certifications: res.draft.certifications || cvData.certifications,
          languages: res.draft.languages || cvData.languages,
          portfolio: res.draft.portfolio || cvData.portfolio,
        });
      }
      setCvUploadMsg(res.message || t('profile.cvProcessed'));
      // Auto-generate bio after CV upload if user has bio-auto enabled, or show preview
      try {
        const bioRes = await api.generateBio();
        if (bioRes.bio) {
          if (bioAuto) {
            // Auto-accept and save via profile update
            await updateProfile({ bio: bioRes.bio });
          } else {
            // Show preview so user can decide
            setBioPreview(bioRes.bio);
          }
        }
      } catch (_) {}
    } catch (err: any) {
      setCvUploadMsg(err.message || t('profile.cvUploadError'));
    } finally {
      setCvUploading(false);
    }
  };

  const handleGenerateBio = async () => {
    setBioGenerating(true);
    setBioPreview(null);
    try {
      const res = await api.generateBio();
      if (res.bio) setBioPreview(res.bio);
    } catch (err: any) {
      setBioPreview(null);
    } finally {
      setBioGenerating(false);
    }
  };

  const handleAcceptBio = () => {
    if (!bioPreview) return;
    update('bio', bioPreview);
    setBioPreview(null);
  };

  const handleToggleBioAuto = async (enabled: boolean) => {
    setBioTogglingAuto(true);
    try {
      await api.toggleBioAuto(enabled);
      setBioAuto(enabled);
    } catch (_) {
    } finally {
      setBioTogglingAuto(false);
    }
  };

  const update = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const result: any = await updateProfile(form);
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // Check if profile update triggered any milestones
    if (result?.milestones?.length > 0) {
      const m = result.milestones[0];
      const milestoneMap: Record<string, { title: string; icon: string }> = {
        university_change: { title: t('profile.milestoneNewUni'), icon: '🎓' },
        academic_status: { title: t('profile.milestoneStatus'), icon: '📜' },
        tutoring_started: { title: t('profile.milestoneTutor'), icon: '👨‍🏫' },
      };
      const info = milestoneMap[m.type];
      if (info) {
        setMilestonePopup({
          type: m.type,
          title: info.title,
          description: m.university || m.status || t('profile.milestoneTutorDesc'),
          icon: info.icon,
        });
      }
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      update('avatar', reader.result as string);
      updateProfile({ avatar: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleChangeUsername = async () => {
    if (!newUsername || newUsername.length < 3) {
      setUsernameError(t('err.usernameShort'));
      return;
    }
    try {
      await api.changeUsername(newUsername);
      setEditingUsername(false);
      setUsernameError('');
      window.location.reload();
    } catch (err: any) {
      setUsernameError(err.message);
    }
  };

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  const SKILL_OPTIONS: { value: LanguageSkill; label: string; desc: string }[] = [
    { value: 'beginner', label: t('skill.beginner'), desc: t('skill.beginnerDesc') },
    { value: 'intermediate', label: t('skill.intermediate'), desc: t('skill.intermediateDesc') },
    { value: 'advanced', label: t('skill.advanced'), desc: t('skill.advancedDesc') },
  ];

  // Configuración solo muestra: Apariencia, Notificaciones, Seguridad
  // El resto (Mi Perfil, Académico, CV, etc.) son accesibles desde las pestañas del perfil social
  // Correo Corporativo: pendiente de mover al módulo CEO
  const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'appearance', label: t('profile.sectionAppearance'), icon: Settings({ size: 16 }) },
    { id: 'notifications', label: t('profile.sectionNotifications'), icon: Bell({ size: 16 }) },
    { id: 'security', label: t('profile.sectionSecurity'), icon: Lock({ size: 16 }) },
  ];

  const ToggleRow = ({
    label,
    desc,
    checked,
    onChange,
  }: {
    label: string;
    desc: string;
    checked?: boolean;
    onChange?: (v: boolean) => void;
  }) => (
    <label className="pf-toggle-row">
      <div>
        <div className="pf-toggle-label">{label}</div>
        <div className="pf-toggle-desc">{desc}</div>
      </div>
      <input
        type="checkbox"
        checked={checked ?? true}
        onChange={(e) => onChange?.(e.target.checked)}
        className="pf-checkbox"
      />
    </label>
  );

  return (
    <>
      {!embedded && (
        <>
          <div className={pfStyles.topProgress}>
            <div className={pfStyles.tpLeft}>
              <span className={pfStyles.pulse} aria-hidden="true" />
              <span>Mi perfil</span>
            </div>
            <span>{t('profile.settingsDesc')}</span>
          </div>
          <div className={pfStyles.heroWrap}>
            <h1 className={pfStyles.heroH1}>
              Tu <span className={pfStyles.hlViolet}>identidad</span>.
            </h1>
            <p className={pfStyles.heroLead}>
              Foto, ubicación, universidad, intereses, privacidad y cuenta. Todo lo que te define en
              Conniku.
            </p>
          </div>
        </>
      )}
      {!embedded && (
        <div className="page-header page-enter">
          <h2>{t('profile.settings')}</h2>
          <p>{t('profile.settingsDesc')}</p>
        </div>
      )}
      <div className={embedded ? undefined : 'page-body'}>
        {saved && <div className="profile-toast">{t('profile.saved')}</div>}

        {/* Header Card — Avatar + Identity */}
        {!embedded && (
          <div className="pf-header-card">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div className="pf-header-avatar" onClick={() => fileInputRef.current?.click()}>
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="pf-avatar-img" />
                ) : (
                  <div className="pf-avatar-initials">{initials || '?'}</div>
                )}
                <div className="pf-avatar-edit">{t('profile.editAvatar')}</div>
              </div>
              <span
                style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  maxWidth: 120,
                  lineHeight: 1.3,
                }}
              >
                {t('profile.avatarHint')}
              </span>
            </div>
            <div className="pf-header-info">
              <h2 className="pf-header-name">
                {user.firstName} {user.lastName}
              </h2>
              <div className="pf-header-meta">
                {editingUsername ? (
                  <div className="pf-username-edit">
                    <span>@</span>
                    <input
                      value={newUsername}
                      onChange={(e) =>
                        setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))
                      }
                      placeholder={user.username}
                    />
                    <button className="btn btn-primary btn-xs" onClick={handleChangeUsername}>
                      {t('profile.saveBtn')}
                    </button>
                    <button
                      className="btn btn-secondary btn-xs"
                      onClick={() => setEditingUsername(false)}
                    >
                      {t('profile.cancelBtn')}
                    </button>
                    {usernameError && (
                      <span style={{ color: 'var(--accent-red)', fontSize: 12 }}>
                        {usernameError}
                      </span>
                    )}
                  </div>
                ) : (
                  <span
                    className="pf-username"
                    onClick={() => {
                      setNewUsername(user.username);
                      setEditingUsername(true);
                    }}
                  >
                    @{user.username}{' '}
                    <span className="pf-user-number">
                      #{String(user.userNumber || 0).padStart(4, '0')}
                    </span>
                  </span>
                )}
                <span className="pf-header-dot">·</span>
                <span>{user.career || t('profile.student')}</span>
                <span className="pf-header-dot">·</span>
                <span>{user.university || t('profile.noUni')}</span>
              </div>
              <div className="pf-header-badges">
                {user.emailVerified ? (
                  <span className="pf-badge pf-badge-green">✓ {t('profile.emailVerified')}</span>
                ) : (
                  <span className="pf-badge pf-badge-orange">
                    {AlertTriangle({ size: 14 })} {t('profile.emailNotVerified')}
                  </span>
                )}
                {user.role === 'owner' && (
                  <span className="pf-badge pf-badge-blue">Owner / CEO</span>
                )}
                {user.isAdmin && user.role !== 'owner' && (
                  <span className="pf-badge pf-badge-purple">{t('profile.admin')}</span>
                )}
                <span className="pf-badge">
                  {t('reg.semester')} {user.semester}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Settings Layout — Sidebar + Content */}
        <div className={embedded ? undefined : 'pf-settings-layout'}>
          {/* Navigation Sidebar */}
          {!embedded && (
            <nav className="pf-settings-nav">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  className={`pf-nav-item ${activeSection === s.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(s.id)}
                >
                  <span className="pf-nav-icon">{s.icon}</span>
                  {s.label}
                </button>
              ))}
              <div className="pf-nav-divider" />
              <button className="pf-nav-item pf-nav-danger" onClick={logout}>
                {t('profile.logout')}
              </button>
            </nav>
          )}

          {/* Content Panel */}
          <div className="pf-settings-content">
            {/* ─── Mi Perfil ─── */}
            {activeSection === 'profile' && (
              <div className="pf-section">
                <div className="pf-section-header">
                  <h3>{t('profile.personalInfo')}</h3>
                  {!isEditing ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setForm({ ...user });
                        setIsEditing(true);
                      }}
                    >
                      {t('profile.editBtn')}
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancelar
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={handleSave}>
                        {t('profile.saveChanges')}
                      </button>
                    </div>
                  )}
                </div>
                <div className="pf-fields-grid">
                  <div className="pf-field">
                    <label>{t('reg.name')}</label>
                    {isEditing ? (
                      <input
                        className="form-input"
                        value={form.firstName}
                        onChange={(e) => update('firstName', e.target.value)}
                      />
                    ) : (
                      <p>{user.firstName || '—'}</p>
                    )}
                  </div>
                  <div className="pf-field">
                    <label>{t('reg.lastName')}</label>
                    {isEditing ? (
                      <input
                        className="form-input"
                        value={form.lastName}
                        onChange={(e) => update('lastName', e.target.value)}
                      />
                    ) : (
                      <p>{user.lastName || '—'}</p>
                    )}
                  </div>
                  <div className="pf-field">
                    <label>{t('auth.email')}</label>
                    <p>{user.email}</p>
                  </div>
                  <div className="pf-field">
                    <label>{t('reg.phone')}</label>
                    {isEditing ? (
                      <input
                        className="form-input"
                        value={form.phone || ''}
                        onChange={(e) => update('phone', e.target.value)}
                      />
                    ) : (
                      <p>{user.phone || '—'}</p>
                    )}
                  </div>
                  <div className="pf-field">
                    <label>{t('reg.birthDate')}</label>
                    <p>{user.birthDate ? new Date(user.birthDate).toLocaleDateString() : '—'}</p>
                  </div>
                  <div className="pf-field">
                    <label>{t('profile.method')}</label>
                    <p>{user.provider === 'google' ? 'Google' : t('profile.methodEmail')}</p>
                  </div>
                </div>

                <div className="pf-divider" />

                {/* ── Bio section ── */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <h3 style={{ margin: 0 }}>{t('profile.bio')}</h3>
                  {!isEditing && (
                    <button
                      className="btn btn-secondary btn-xs"
                      onClick={() => {
                        setForm({ ...user });
                        setIsEditing(true);
                      }}
                      style={{ fontSize: 12 }}
                    >
                      {t('profile.editBtn')}
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={form.bio || ''}
                      onChange={(e) => update('bio', e.target.value)}
                      placeholder={t('profile.bioPlaceholder')}
                    />

                    {/* Generate bio button */}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleGenerateBio}
                      disabled={bioGenerating}
                      style={{
                        alignSelf: 'flex-start',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {bioGenerating ? (
                        <>
                          <span
                            style={{
                              display: 'inline-block',
                              width: 12,
                              height: 12,
                              border: '2px solid var(--accent)',
                              borderTopColor: 'transparent',
                              borderRadius: '50%',
                              animation: 'spin 0.7s linear infinite',
                            }}
                          />
                          Generando...
                        </>
                      ) : (
                        <>✨ Generar bio con mi perfil</>
                      )}
                    </button>

                    {/* Preview card */}
                    {bioPreview && (
                      <div
                        style={{
                          background: 'rgba(45,98,200,0.06)',
                          border: '1px solid rgba(45,98,200,0.2)',
                          borderRadius: 10,
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: 'var(--accent)',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}
                        >
                          Vista previa — bio generada por Conniku
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 14,
                            color: 'var(--text-primary)',
                            lineHeight: 1.6,
                          }}
                        >
                          {bioPreview}
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-primary btn-xs" onClick={handleAcceptBio}>
                            ✓ Usar esta bio
                          </button>
                          <button
                            className="btn btn-secondary btn-xs"
                            onClick={() => setBioPreview(null)}
                          >
                            Mantener la mía
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Auto-update toggle */}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'var(--bg-secondary)',
                        borderRadius: 10,
                        cursor: 'pointer',
                        gap: 12,
                      }}
                    >
                      <div>
                        <div
                          style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}
                        >
                          Actualizar bio automáticamente con mis logros
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          Conniku actualizará tu bio cada vez que alcances un nuevo hito académico
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        className="pf-checkbox"
                        checked={bioAuto}
                        disabled={bioTogglingAuto}
                        onChange={(e) => handleToggleBioAuto(e.target.checked)}
                      />
                    </label>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
                      {user.bio || t('profile.bioEmpty')}
                    </p>
                    {bioAuto && (
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--accent)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        ✦ Bio se actualiza automáticamente con tus logros
                      </span>
                    )}
                  </div>
                )}

                <div className="pf-footer-meta">
                  <small>
                    {t('profile.accountCreated')}: {new Date(user.createdAt).toLocaleDateString()}
                  </small>
                  <small>
                    {t('profile.lastAccess')}: {new Date(user.lastLogin).toLocaleDateString()}
                  </small>
                </div>
              </div>
            )}

            {/* ─── Académico ─── */}
            {activeSection === 'academic' && (
              <div className="pf-section">
                <div className="pf-section-header">
                  <h3>{t('profile.academicInfo')}</h3>
                  {!isEditing ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setForm({ ...user });
                        setIsEditing(true);
                      }}
                    >
                      Editar
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancelar
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={handleSave}>
                        Guardar
                      </button>
                    </div>
                  )}
                </div>
                <div className="pf-fields-grid">
                  <div className="pf-field" style={{ position: 'relative' }}>
                    <label>{t('reg.university')}</label>
                    {isEditing ? (
                      <div style={{ position: 'relative' }}>
                        {form.university ? (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '8px 12px',
                              background: 'rgba(45,98,200,0.06)',
                              border: '1px solid rgba(45,98,200,0.2)',
                              borderRadius: 8,
                              fontSize: 13,
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600 }}>{form.university}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                update('university', '');
                                setUniSearch('');
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                fontSize: 15,
                                padding: '2px 4px',
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <input
                              className="form-input"
                              placeholder="Buscar institución..."
                              value={uniSearch}
                              onChange={(e) => {
                                setUniSearch(e.target.value);
                                setShowUniDropdown(true);
                              }}
                              onFocus={() => setShowUniDropdown(true)}
                            />
                            {showUniDropdown && uniSearch.length >= 2 && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '100%',
                                  left: 0,
                                  right: 0,
                                  zIndex: 200,
                                  background: 'var(--bg-card)',
                                  border: '1px solid var(--border)',
                                  borderRadius: 10,
                                  maxHeight: 240,
                                  overflowY: 'auto',
                                  boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                                  marginTop: 4,
                                }}
                              >
                                {uniResults.length === 0 ? (
                                  <div
                                    style={{
                                      padding: '12px 16px',
                                      color: 'var(--text-muted)',
                                      fontSize: 13,
                                    }}
                                  >
                                    Sin resultados
                                  </div>
                                ) : (
                                  uniResults.map((uni) => (
                                    <button
                                      key={uni.id}
                                      type="button"
                                      onClick={() => {
                                        const code = getInstitutionCode(uni);
                                        const currentPrefix =
                                          user.username?.match(/^[A-Z]{3}_/)?.[0] || '';
                                        const currentSuffix = currentPrefix
                                          ? user.username!.slice(currentPrefix.length)
                                          : user.username || '';
                                        const newUsername = code + '_' + currentSuffix;
                                        update('university', uni.name);
                                        update('username', newUsername);
                                        setUniSearch('');
                                        setShowUniDropdown(false);
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        width: '100%',
                                        padding: '8px 14px',
                                        border: 'none',
                                        borderBottom: '1px solid var(--border)',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        color: 'var(--text-primary)',
                                      }}
                                    >
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                          style={{
                                            fontSize: 13,
                                            fontWeight: 600,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                          }}
                                        >
                                          {uni.name}
                                        </div>
                                        <div
                                          style={{
                                            fontSize: 11,
                                            color: 'var(--text-muted)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                          }}
                                        >
                                          <span
                                            style={{
                                              background: 'rgba(45,98,200,0.1)',
                                              color: 'var(--accent)',
                                              padding: '0 4px',
                                              borderRadius: 3,
                                              fontWeight: 700,
                                            }}
                                          >
                                            {getInstitutionCode(uni)}
                                          </span>
                                          <span>
                                            {uni.type === 'cft'
                                              ? 'CFT'
                                              : uni.type === 'instituto'
                                                ? 'IP'
                                                : 'Universidad'}
                                          </span>
                                        </div>
                                      </div>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </>
                        )}
                        <small
                          style={{
                            color: 'var(--accent)',
                            fontSize: 11,
                            marginTop: 4,
                            display: 'block',
                          }}
                        >
                          Al cambiar institución, tu prefijo de usuario se actualizará
                          automáticamente
                        </small>
                      </div>
                    ) : (
                      <p>{user.university || '—'}</p>
                    )}
                  </div>
                  <div className="pf-field">
                    <label>{t('reg.career')}</label>
                    {isEditing ? (
                      <input
                        className="form-input"
                        value={form.career}
                        onChange={(e) => update('career', e.target.value)}
                      />
                    ) : (
                      <p>{user.career || '—'}</p>
                    )}
                  </div>
                  <div className="pf-field">
                    <label>{t('profile.studyStart')}</label>
                    {isEditing ? (
                      <input
                        type="date"
                        className="form-input"
                        value={form.studyStartDate || ''}
                        onChange={(e) => update('studyStartDate', e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        min="1950-01-01"
                      />
                    ) : (
                      <p>
                        {user.studyStartDate
                          ? `${user.studyStartDate} (${(user.studyDays || 0).toLocaleString()} días)`
                          : '—'}
                      </p>
                    )}
                  </div>
                  <div className="pf-field">
                    <label>{t('reg.semester')}</label>
                    {isEditing ? (
                      <select
                        className="form-input"
                        value={form.semester}
                        onChange={(e) => update('semester', parseInt(e.target.value))}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s) => (
                          <option key={s} value={s}>
                            {t('reg.semester')} {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p>
                        {t('reg.semester')} {user.semester}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pf-divider" />
                <h3>{t('profile.academicStatus')}</h3>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {(
                    [
                      { value: 'estudiante', label: t('profile.statusStudent') },
                      { value: 'egresado', label: t('profile.statusGraduate') },
                      { value: 'titulado', label: t('profile.statusTitled') },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      className={`pf-skill-btn ${((user as any).academicStatus || 'estudiante') === opt.value ? 'active' : ''}`}
                      onClick={() => {
                        const updates: any = { academicStatus: opt.value };
                        if (opt.value === 'estudiante') {
                          updates.offersMentoring = false;
                          updates.mentoringServices = [];
                          updates.professionalTitle = '';
                        }
                        updateProfile(updates);
                      }}
                    >
                      <strong>{opt.label}</strong>
                    </button>
                  ))}
                </div>

                {/* Professional Title for titulado */}
                {(user as any).academicStatus === 'titulado' && (
                  <div className="pf-field" style={{ marginBottom: 16 }}>
                    <label>{t('profile.professionalTitle')}</label>
                    {isEditing ? (
                      <input
                        className="form-input"
                        value={(form as any).professionalTitle || ''}
                        placeholder={t('profile.professionalTitlePlaceholder')}
                        onChange={(e) => update('professionalTitle' as any, e.target.value)}
                      />
                    ) : (
                      <p>{(user as any).professionalTitle || '—'}</p>
                    )}
                  </div>
                )}

                {/* Mentoring for titulado/egresado */}
                {((user as any).academicStatus === 'titulado' ||
                  (user as any).academicStatus === 'egresado') && (
                  <div
                    style={{
                      background: 'var(--bg-tertiary, #f0f4f8)',
                      borderRadius: 12,
                      padding: 16,
                      border: '1px solid var(--border)',
                    }}
                  >
                    <h4 style={{ margin: '0 0 8px 0', fontSize: 14 }}>
                      {Users({ size: 14 })} {t('profile.helpStudents')}
                    </h4>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                      {t('profile.helpStudentsDesc')}
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[
                        { id: 'ayudantias', label: t('profile.mentorAssistance') },
                        { id: 'cursos', label: t('profile.mentorCourses') },
                        { id: 'clases_particulares', label: t('profile.mentorPrivate') },
                      ].map((svc) => {
                        const services: string[] = (user as any).mentoringServices || [];
                        const selected = services.includes(svc.id);
                        return (
                          <button
                            key={svc.id}
                            style={{
                              flex: 1,
                              minWidth: 100,
                              padding: '10px 8px',
                              borderRadius: 10,
                              border: selected ? '2px solid #2D62C8' : '1px solid var(--border)',
                              background: selected ? 'rgba(45,98,200,0.08)' : 'var(--bg-secondary)',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              fontSize: 13,
                              fontWeight: 500,
                            }}
                            onClick={() => {
                              const updated = selected
                                ? services.filter((s) => s !== svc.id)
                                : [...services, svc.id];
                              updateProfile({
                                mentoringServices: updated,
                                offersMentoring: updated.length > 0,
                              } as any);
                            }}
                          >
                            {svc.label}
                          </button>
                        );
                      })}
                    </div>
                    {((user as any).mentoringServices || []).length > 0 && (
                      <div
                        style={{
                          marginTop: 12,
                          background: 'rgba(45,138,86,0.08)',
                          borderRadius: 8,
                          padding: '10px 12px',
                          border: '1px solid rgba(45,138,86,0.2)',
                        }}
                      >
                        <p style={{ fontSize: 12, color: '#2D8A56', margin: 0 }}>
                          {MessageSquare({ size: 14 })} {t('profile.mentorChatNote')}{' '}
                          <strong>{t('profile.mentorChatPlatform')}</strong>{' '}
                          {t('profile.mentorChatSecurity')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="pf-divider" />

                <h3>{t('skill.title')}</h3>
                <p className="pf-hint">{t('skill.hint')}</p>
                <div className="pf-skill-options">
                  {SKILL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={`pf-skill-btn ${(user.languageSkill || 'intermediate') === opt.value ? 'active' : ''}`}
                      onClick={() => updateProfile({ languageSkill: opt.value } as any)}
                    >
                      <strong>{opt.label}</strong>
                      <small>{opt.desc}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Curriculum Vitae (redirect to Jobs) ─── */}
            {/* ─── CV / Perfil Profesional ─── */}
            {activeSection === 'cv' && (
              <div className="pf-section">
                <div className="pf-section-header">
                  <h3>📄 Perfil Profesional</h3>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
                  Elige cómo quieres construir tu perfil profesional. Puedes llenarlo manualmente
                  con todo el detalle, o subir tu CV y Conniku se encargará de analizarlo y
                  construir tu perfil automáticamente.
                </p>

                {/* ─── CV actual (compact summary) ─── */}
                {myCV?.exists &&
                  myCV?.profile &&
                  (() => {
                    const p = myCV.profile;
                    // Extract top skills (flat list from nested structure)
                    let topSkills: string[] = [];
                    try {
                      const skillGroups = JSON.parse(p.skills || '[]');
                      skillGroups.forEach((g: any) => {
                        (g.items || []).forEach((item: any) => {
                          if (topSkills.length < 6)
                            topSkills.push(typeof item === 'string' ? item : item.name);
                        });
                      });
                      if (
                        topSkills.length === 0 &&
                        Array.isArray(skillGroups) &&
                        typeof skillGroups[0] === 'string'
                      ) {
                        topSkills = skillGroups.slice(0, 6);
                      }
                    } catch {}
                    const visibilityLabel: Record<string, string> = {
                      public: 'Público',
                      friends: 'Amigos',
                      recruiters: 'Reclutadores',
                      private: 'Privado',
                    };
                    const visColor: Record<string, string> = {
                      public: '#22c55e',
                      friends: '#3b82f6',
                      recruiters: '#8b5cf6',
                      private: '#6b7280',
                    };
                    const vis = p.visibility || 'public';
                    const expCount = (() => {
                      try {
                        return JSON.parse(p.experience || '[]').length;
                      } catch {
                        return 0;
                      }
                    })();
                    return (
                      <div
                        style={{
                          marginBottom: 24,
                          padding: 18,
                          borderRadius: 14,
                          background: 'var(--bg-card)',
                          border: '2px solid var(--accent)',
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 14,
                            flexWrap: 'wrap',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 180 }}>
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: 'var(--accent)',
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                                marginBottom: 6,
                              }}
                            >
                              ✦ Tu CV en Conniku
                            </div>
                            {p.headline && (
                              <div
                                style={{
                                  fontWeight: 700,
                                  fontSize: 15,
                                  color: 'var(--text-primary)',
                                  marginBottom: 6,
                                }}
                              >
                                {p.headline}
                              </div>
                            )}
                            {p.location && (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: 'var(--text-muted)',
                                  marginBottom: 8,
                                }}
                              >
                                📍 {p.location}
                              </div>
                            )}
                            <div
                              style={{
                                display: 'flex',
                                gap: 6,
                                flexWrap: 'wrap',
                                marginBottom: topSkills.length > 0 ? 10 : 0,
                              }}
                            >
                              {topSkills.map((sk: string) => (
                                <span
                                  key={sk}
                                  style={{
                                    fontSize: 11,
                                    padding: '2px 8px',
                                    borderRadius: 10,
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border)',
                                  }}
                                >
                                  {sk}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6,
                              alignItems: 'flex-end',
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '3px 10px',
                                borderRadius: 10,
                                background: visColor[vis] + '22',
                                color: visColor[vis],
                              }}
                            >
                              {visibilityLabel[vis] || vis}
                            </span>
                            {p.open_to_work && (
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '3px 10px',
                                  borderRadius: 10,
                                  background: '#22c55e22',
                                  color: '#22c55e',
                                }}
                              >
                                #OpenToWork
                              </span>
                            )}
                            {expCount > 0 && (
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {expCount} exp. laboral{expCount !== 1 ? 'es' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => onNavigate?.('/jobs')}
                          style={{
                            marginTop: 12,
                            padding: '7px 16px',
                            borderRadius: 8,
                            border: '1px solid var(--accent)',
                            background: 'transparent',
                            color: 'var(--accent)',
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: 'pointer',
                          }}
                        >
                          Ver y editar CV completo →
                        </button>
                      </div>
                    );
                  })()}

                {/* Two paths */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 16,
                    marginBottom: 28,
                  }}
                >
                  {/* Manual */}
                  <div
                    style={{
                      border: '1.5px solid var(--border)',
                      borderRadius: 14,
                      padding: 20,
                      background: 'var(--bg-card)',
                      cursor: 'pointer',
                      transition: 'border-color .2s',
                    }}
                    onClick={() => onNavigate?.('/jobs')}
                  >
                    <div style={{ fontSize: 30, marginBottom: 10 }}>✏️</div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                      Completar manualmente
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        color: 'var(--text-muted)',
                        margin: 0,
                        lineHeight: 1.4,
                      }}
                    >
                      Ingresa tu experiencia, habilidades y logros paso a paso desde tu perfil
                      laboral.
                    </p>
                    <div style={{ marginTop: 14 }}>
                      <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                        Ir a Perfil Laboral →
                      </span>
                    </div>
                  </div>

                  {/* Upload */}
                  <div
                    style={{
                      border: '1.5px solid var(--accent)',
                      borderRadius: 14,
                      padding: 20,
                      background: 'rgba(45,98,200,0.04)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: 30, marginBottom: 10 }}>📂</div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                      Subir mi CV
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        color: 'var(--text-muted)',
                        margin: 0,
                        lineHeight: 1.4,
                      }}
                    >
                      Conniku analiza tu CV en profundidad, llena tu perfil y genera tu bio
                      profesional automáticamente.
                    </p>
                    <div style={{ marginTop: 14 }}>
                      <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                        Recomendado ✦
                      </span>
                    </div>
                  </div>
                </div>

                {/* Upload zone */}
                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: 14,
                    padding: 28,
                    border: '2px dashed var(--border)',
                    textAlign: 'center',
                    transition: 'border-color .2s',
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = 'var(--accent)';
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = 'var(--border)';
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleCvUpload(f);
                  }}
                >
                  <input
                    ref={cvFileRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleCvUpload(f);
                    }}
                  />
                  {cvUploading ? (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          border: '3px solid var(--accent)',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                        }}
                      />
                      <div style={{ fontWeight: 600, fontSize: 15 }}>Analizando tu CV...</div>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                        Conniku está extrayendo tu experiencia, habilidades y formación académica
                      </p>
                    </div>
                  ) : cvUploadMsg ? (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <div style={{ fontSize: 36 }}>✅</div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent-green)' }}>
                        ¡CV analizado con éxito!
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                        {cvUploadMsg}
                      </p>
                      {bioPreview && (
                        <div
                          style={{
                            marginTop: 12,
                            width: '100%',
                            background: 'rgba(45,98,200,0.06)',
                            border: '1px solid rgba(45,98,200,0.2)',
                            borderRadius: 10,
                            padding: '14px 16px',
                            textAlign: 'left',
                          }}
                        >
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: 'var(--accent)',
                              textTransform: 'uppercase',
                              letterSpacing: 0.5,
                              marginBottom: 8,
                            }}
                          >
                            ✦ Bio profesional generada por Conniku
                          </div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 14,
                              color: 'var(--text-primary)',
                              lineHeight: 1.65,
                            }}
                          >
                            {bioPreview}
                          </p>
                          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button
                              className="btn btn-primary btn-xs"
                              onClick={() => {
                                handleAcceptBio();
                                setActiveSection('profile');
                              }}
                            >
                              ✓ Usar esta bio
                            </button>
                            <button
                              className="btn btn-secondary btn-xs"
                              onClick={() => setBioPreview(null)}
                            >
                              Descartar
                            </button>
                          </div>
                        </div>
                      )}
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginTop: 8 }}
                        onClick={() => {
                          setCvUploadMsg('');
                          cvFileRef.current?.click();
                        }}
                      >
                        Subir otro CV
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>
                        Arrastra tu CV aquí
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>
                        PDF, Word o texto plano · máx. 10MB
                      </p>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => cvFileRef.current?.click()}
                      >
                        Seleccionar archivo
                      </button>
                    </>
                  )}
                </div>

                {/* What gets filled */}
                <div
                  style={{
                    marginTop: 20,
                    padding: 16,
                    background: 'var(--bg-secondary)',
                    borderRadius: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      marginBottom: 10,
                      color: 'var(--text-primary)',
                    }}
                  >
                    Qué analiza Conniku en tu CV:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[
                      '✦ Experiencia laboral',
                      '✦ Habilidades técnicas',
                      '✦ Formación académica',
                      '✦ Certificaciones',
                      '✦ Idiomas',
                      '✦ Portfolio & proyectos',
                      '✦ Bio profesional contextual',
                      '✦ Titular de perfil',
                    ].map((item) => (
                      <div key={item} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── Proyectos ─── */}
            {activeSection === 'projects' && (
              <div className="pf-section">
                <div className="pf-section-header">
                  <h3>🗂 Proyectos &amp; Portfolio</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
                  Muestra tus proyectos académicos, personales y laborales en tu perfil público.
                </p>
                <div
                  style={{
                    background: 'var(--bg-hover)',
                    borderRadius: 'var(--radius)',
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
                  <h4 style={{ margin: '0 0 12px 0', fontSize: 14 }}>Agregar proyecto</h4>
                  <div className="pf-fields-grid" style={{ marginBottom: 10 }}>
                    <div className="pf-field">
                      <label>Título *</label>
                      <input
                        className="form-input"
                        value={newProj.title}
                        onChange={(e) => setNewProj((p) => ({ ...p, title: e.target.value }))}
                      />
                    </div>
                    <div className="pf-field">
                      <label>URL del proyecto</label>
                      <input
                        className="form-input"
                        value={newProj.projectUrl}
                        onChange={(e) => setNewProj((p) => ({ ...p, projectUrl: e.target.value }))}
                      />
                    </div>
                    <div className="pf-field">
                      <label>Tecnologías (separadas por coma)</label>
                      <input
                        className="form-input"
                        value={newProj.techStack}
                        onChange={(e) => setNewProj((p) => ({ ...p, techStack: e.target.value }))}
                        placeholder="React, Python, Node..."
                      />
                    </div>
                    <div className="pf-field">
                      <label>Categoría</label>
                      <select
                        className="form-input"
                        value={newProj.category}
                        onChange={(e) => setNewProj((p) => ({ ...p, category: e.target.value }))}
                      >
                        <option value="academic">Académico</option>
                        <option value="personal">Personal</option>
                        <option value="work">Laboral</option>
                      </select>
                    </div>
                    <div className="pf-field" style={{ gridColumn: '1/-1' }}>
                      <label>Descripción</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={newProj.description}
                        onChange={(e) => setNewProj((p) => ({ ...p, description: e.target.value }))}
                      />
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={async () => {
                      if (!newProj.title.trim() || !user) return;
                      try {
                        const tech = newProj.techStack
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean);
                        const res = await api.addPortfolioProject(user.id, {
                          ...newProj,
                          techStack: tech,
                        });
                        setProjects((prev) => [
                          {
                            ...res,
                            techStack: tech,
                            description: newProj.description,
                            projectUrl: newProj.projectUrl,
                            category: newProj.category,
                            year: newProj.year,
                          },
                          ...prev,
                        ]);
                        setNewProj({
                          title: '',
                          description: '',
                          projectUrl: '',
                          techStack: '',
                          category: 'personal',
                          year: new Date().getFullYear(),
                        });
                      } catch {}
                    }}
                  >
                    Agregar Proyecto
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {projects.map((p: any) => (
                    <div
                      key={p.id}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 10,
                        padding: '12px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {p.category} · {p.year}
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await api.deletePortfolioProject(p.id);
                            setProjects((prev) => prev.filter((x) => x.id !== p.id));
                          } catch {}
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#ef4444',
                          fontSize: 18,
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  ))}
                  {projects.length === 0 && !projectsLoaded && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={async () => {
                        if (!user) return;
                        try {
                          const data = await api.getUserProjects(user.id);
                          setProjects(data);
                          setProjectsLoaded(true);
                        } catch {}
                      }}
                    >
                      Cargar mis proyectos
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ─── Publicaciones ─── */}
            {activeSection === 'publications' && (
              <div className="pf-section">
                <div className="pf-section-header">
                  <h3>📚 Publicaciones &amp; Investigaciones</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
                  Libros, papers, tesis, investigaciones y artículos de tu autoría.
                </p>
                <div
                  style={{
                    background: 'var(--bg-hover)',
                    borderRadius: 'var(--radius)',
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
                  <h4 style={{ margin: '0 0 12px 0', fontSize: 14 }}>Agregar publicación</h4>
                  <div className="pf-fields-grid" style={{ marginBottom: 10 }}>
                    <div className="pf-field">
                      <label>Tipo</label>
                      <select
                        className="form-input"
                        value={newPub.type}
                        onChange={(e) => setNewPub((p) => ({ ...p, type: e.target.value }))}
                      >
                        <option value="paper">Artículo / Paper</option>
                        <option value="book">Libro</option>
                        <option value="thesis">Tesis</option>
                        <option value="research">Investigación</option>
                        <option value="article">Artículo de divulgación</option>
                      </select>
                    </div>
                    <div className="pf-field">
                      <label>Año</label>
                      <input
                        className="form-input"
                        type="number"
                        value={newPub.year}
                        onChange={(e) =>
                          setNewPub((p) => ({
                            ...p,
                            year: parseInt(e.target.value) || new Date().getFullYear(),
                          }))
                        }
                      />
                    </div>
                    <div className="pf-field" style={{ gridColumn: '1/-1' }}>
                      <label>Título *</label>
                      <input
                        className="form-input"
                        value={newPub.title}
                        onChange={(e) => setNewPub((p) => ({ ...p, title: e.target.value }))}
                      />
                    </div>
                    <div className="pf-field">
                      <label>Institución / Editorial</label>
                      <input
                        className="form-input"
                        value={newPub.institution}
                        onChange={(e) => setNewPub((p) => ({ ...p, institution: e.target.value }))}
                      />
                    </div>
                    <div className="pf-field">
                      <label>URL o DOI</label>
                      <input
                        className="form-input"
                        value={newPub.url}
                        onChange={(e) => setNewPub((p) => ({ ...p, url: e.target.value }))}
                      />
                    </div>
                    <div className="pf-field" style={{ gridColumn: '1/-1' }}>
                      <label>Resumen</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={newPub.description}
                        onChange={(e) => setNewPub((p) => ({ ...p, description: e.target.value }))}
                      />
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={async () => {
                      if (!newPub.title.trim() || !user) return;
                      try {
                        const res = await api.addPublication(user.id, newPub);
                        setPublications((prev) => [{ ...res, ...newPub }, ...prev]);
                        setNewPub({
                          type: 'paper',
                          title: '',
                          description: '',
                          year: new Date().getFullYear(),
                          url: '',
                          institution: '',
                        });
                      } catch {}
                    }}
                  >
                    Agregar Publicación
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {publications.map((p: any) => (
                    <div
                      key={p.id}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 10,
                        padding: '12px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {p.type} · {p.year}
                          {p.institution ? ` · ${p.institution}` : ''}
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await api.deletePublication(p.id);
                            setPublications((prev) => prev.filter((x) => x.id !== p.id));
                          } catch {}
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#ef4444',
                          fontSize: 18,
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  ))}
                  {publications.length === 0 && !publicationsLoaded && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={async () => {
                        if (!user) return;
                        try {
                          const data = await api.getUserPublications(user.id);
                          setPublications(data);
                          setPublicationsLoaded(true);
                        } catch {}
                      }}
                    >
                      Cargar mis publicaciones
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ─── Mi Universidad (LMS Integration) ─── */}
            {activeSection === 'universidad' && (
              <div className="pf-section">
                <h3>🎓 Mi Universidad</h3>
                <p className="pf-hint">
                  Conecta tu plataforma universitaria (Moodle, Canvas, Blackboard, Brightspace,
                  Sakai u otras) para importar automáticamente el material de tus ramos a Conniku.
                </p>

                {/* ── Conexiones activas ── */}
                {lmsConnections.length > 0 &&
                  lmsConnections.map((conn: any) => (
                    <div
                      key={conn.id}
                      className="u-card"
                      style={{
                        padding: 20,
                        marginBottom: 16,
                        borderLeft: `4px solid ${conn.status === 'connected' ? 'var(--accent-green)' : 'var(--accent-red)'}`,
                      }}
                    >
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}
                      >
                        <span style={{ fontSize: 28 }}>
                          {conn.platform_type === 'moodle'
                            ? '🟧'
                            : conn.platform_type === 'canvas'
                              ? '🟥'
                              : conn.platform_type === 'blackboard'
                                ? '⬛'
                                : conn.platform_type === 'brightspace'
                                  ? '🟦'
                                  : '🎓'}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{conn.platform_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {conn.api_url} · {conn.courses?.length || 0} asignatura
                            {conn.courses?.length !== 1 ? 's' : ''} detectada
                            {conn.courses?.length !== 1 ? 's' : ''}
                            {conn.last_scan &&
                              ` · Última revisión: ${new Date(conn.last_scan).toLocaleDateString('es-CL')}`}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={lmsScanning}
                            onClick={async () => {
                              setLmsScanning(true);
                              setLmsScanMsg('');
                              try {
                                const res: any = await api.lmsScan();
                                setLmsScanMsg(
                                  res.total_new > 0
                                    ? `✅ ${res.total_new} archivo${res.total_new !== 1 ? 's' : ''} nuevo${res.total_new !== 1 ? 's' : ''} encontrado${res.total_new !== 1 ? 's' : ''}`
                                    : '✓ Todo actualizado'
                                );
                                const pending: any = await api.lmsGetPending().catch(() => []);
                                setLmsPending(Array.isArray(pending) ? pending : []);
                                setLmsLoaded(false); // force reload connections for last_scan update
                              } catch {
                                setLmsScanMsg('Error al escanear');
                              } finally {
                                setLmsScanning(false);
                              }
                            }}
                          >
                            {lmsScanning ? '⏳ Revisando...' : '🔍 Revisar ahora'}
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={async () => {
                              if (!confirm('¿Desconectar esta plataforma?')) return;
                              await api.lmsDisconnect(conn.id).catch(() => {});
                              setLmsConnections((prev) =>
                                prev.filter((c: any) => c.id !== conn.id)
                              );
                            }}
                          >
                            Desconectar
                          </button>
                        </div>
                      </div>

                      {/* Scan result message */}
                      {lmsScanMsg && (
                        <div
                          style={{ fontSize: 13, color: 'var(--accent-green)', marginBottom: 8 }}
                        >
                          {lmsScanMsg}
                        </div>
                      )}

                      {/* Courses list */}
                      {conn.courses?.length > 0 && (
                        <div>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              marginBottom: 8,
                            }}
                          >
                            Asignaturas detectadas
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {conn.courses.map((c: any) => (
                              <div
                                key={c.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 10,
                                  padding: '8px 12px',
                                  background: 'var(--bg-secondary)',
                                  borderRadius: 8,
                                  fontSize: 13,
                                }}
                              >
                                <span>📚</span>
                                <span style={{ flex: 1, fontWeight: 500 }}>{c.name}</span>
                                {c.conniku_project_id ? (
                                  <span
                                    style={{
                                      fontSize: 11,
                                      color: 'var(--accent-green)',
                                      fontWeight: 600,
                                    }}
                                  >
                                    ✓ Vinculada
                                  </span>
                                ) : (
                                  <select
                                    style={{
                                      fontSize: 11,
                                      padding: '2px 6px',
                                      borderRadius: 6,
                                      border: '1px solid var(--border)',
                                      background: 'var(--bg-primary)',
                                      color: 'var(--text-primary)',
                                      cursor: 'pointer',
                                    }}
                                    defaultValue=""
                                    onChange={async (e) => {
                                      if (!e.target.value) return;
                                      await api.lmsLinkCourse(c.id, e.target.value).catch(() => {});
                                      setLmsLoaded(false);
                                    }}
                                  >
                                    <option value="">Vincular a proyecto...</option>
                                    {lmsProjects.map((p: any) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                {/* ── Items pendientes de sincronización ── */}
                {lmsPending.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 10,
                      }}
                    >
                      📥 Material nuevo detectado — {lmsPending.length} archivo
                      {lmsPending.length !== 1 ? 's' : ''}
                    </div>
                    {lmsPending.map((item: any) => (
                      <div
                        key={item.id}
                        className="u-card"
                        style={{
                          padding: 16,
                          marginBottom: 10,
                          borderLeft: '4px solid var(--accent)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <div style={{ fontSize: 24, flexShrink: 0 }}>
                          {item.mime_type?.includes('pdf')
                            ? '📄'
                            : item.mime_type?.includes('word')
                              ? '📝'
                              : item.mime_type?.includes('ppt')
                                ? '📊'
                                : '📎'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 14,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.item_name}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {item.course_name} ·{' '}
                            {item.file_size ? `${Math.round(item.file_size / 1024)} KB · ` : ''}
                            {new Date(item.detected_at).toLocaleDateString('es-CL')}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <select
                            style={{
                              fontSize: 12,
                              padding: '4px 8px',
                              borderRadius: 6,
                              border: '1px solid var(--border)',
                              background: 'var(--bg-primary)',
                              color: 'var(--text-primary)',
                            }}
                            defaultValue={item.conniku_project_id || ''}
                            id={`proj-sel-${item.id}`}
                          >
                            <option value="">Seleccionar proyecto...</option>
                            {lmsProjects.map((p: any) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={lmsSyncingId === item.id}
                            onClick={async () => {
                              const sel = (
                                document.getElementById(`proj-sel-${item.id}`) as HTMLSelectElement
                              )?.value;
                              if (!sel) {
                                alert('Selecciona un proyecto Conniku destino');
                                return;
                              }
                              setLmsSyncingId(item.id);
                              try {
                                const res: any = await api.lmsSyncItem(item.id, sel);
                                if (res.has_content && res.content_b64) {
                                  await api.importDocumentB64(
                                    sel,
                                    res.filename,
                                    res.content_b64,
                                    res.file_type
                                  );
                                }
                                setLmsPending((prev) => prev.filter((i: any) => i.id !== item.id));
                              } catch (e: any) {
                                alert(e.message || 'Error al sincronizar');
                              } finally {
                                setLmsSyncingId('');
                              }
                            }}
                          >
                            {lmsSyncingId === item.id ? '⏳' : '↓ Sincronizar'}
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={async () => {
                              await api.lmsDismissItem(item.id).catch(() => {});
                              setLmsPending((prev) => prev.filter((i: any) => i.id !== item.id));
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Sin conexiones → CTA ── */}
                {lmsConnections.length === 0 && !lmsShowConnect && (
                  <div className="u-card" style={{ padding: 32, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
                    <h3 style={{ margin: '0 0 8px' }}>Conecta tu plataforma universitaria</h3>
                    <p style={{ color: 'var(--text-muted)', margin: '0 0 20px', fontSize: 14 }}>
                      Importa el material de tus ramos automáticamente a tus asignaturas en Conniku.
                      <br />
                      Compatible con Moodle, Canvas, Blackboard, Brightspace, Sakai y más.
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        gap: 10,
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        marginBottom: 20,
                      }}
                    >
                      {['Moodle', 'Canvas', 'Blackboard', 'Brightspace', 'Sakai'].map((p) => (
                        <span
                          key={p}
                          style={{
                            fontSize: 12,
                            padding: '4px 10px',
                            borderRadius: 20,
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            fontWeight: 600,
                          }}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setLmsPlatformName(user?.university || '');
                        setLmsShowConnect(true);
                      }}
                    >
                      Conectar Universidad
                    </button>
                  </div>
                )}

                {/* ── Formulario de conexión ── */}
                {lmsShowConnect && (
                  <div className="u-card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Header con gradiente */}
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #1e3a5f 0%, #1a56db 100%)',
                        padding: '20px 24px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <h4 style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 700 }}>
                          Conectar plataforma universitaria
                        </h4>
                        <p
                          style={{
                            margin: '4px 0 0',
                            color: 'rgba(255,255,255,0.65)',
                            fontSize: 12,
                          }}
                        >
                          Importa tus cursos y material automáticamente
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setLmsShowConnect(false);
                          setLmsConnectError('');
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.15)',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 16,
                          color: '#fff',
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ padding: '24px' }}>
                      {/* Plataforma */}
                      <div style={{ marginBottom: 18 }}>
                        <label
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: 'var(--accent, #1a56db)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            display: 'block',
                            marginBottom: 6,
                          }}
                        >
                          Plataforma
                        </label>
                        <select
                          value={lmsPlatformType}
                          onChange={(e) => setLmsPlatformType(e.target.value)}
                          className="form-input"
                          style={{
                            padding: '11px 14px',
                            borderRadius: 10,
                            fontSize: 14,
                            cursor: 'pointer',
                          }}
                        >
                          <option value="auto">Detectar automáticamente</option>
                          <option value="moodle">Moodle</option>
                          <option value="canvas">Canvas LMS</option>
                          <option value="blackboard">Blackboard Learn</option>
                          <option value="brightspace">Brightspace (D2L)</option>
                          <option value="sakai">Sakai</option>
                          <option value="teams">Microsoft Teams Educativo</option>
                          <option value="classroom">Google Classroom</option>
                          <option value="other">Otra plataforma</option>
                        </select>
                      </div>

                      {/* Método de autenticación — solo Moodle / auto-detect */}
                      {(lmsPlatformType === 'auto' || lmsPlatformType === 'moodle') && (
                        <div style={{ marginBottom: 18 }}>
                          <label
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: 'var(--accent, #1a56db)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              display: 'block',
                              marginBottom: 8,
                            }}
                          >
                            Método de autenticación
                          </label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => setLmsAuthMethod('token')}
                              style={{
                                flex: 1,
                                padding: '9px 12px',
                                borderRadius: 10,
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                background:
                                  lmsAuthMethod === 'token'
                                    ? 'var(--accent, #1a56db)'
                                    : 'var(--bg-secondary)',
                                color: lmsAuthMethod === 'token' ? '#fff' : 'var(--text-secondary)',
                                border: `1px solid ${lmsAuthMethod === 'token' ? 'transparent' : 'var(--border)'}`,
                              }}
                            >
                              🔑 Token
                            </button>
                            <button
                              type="button"
                              onClick={() => setLmsAuthMethod('password')}
                              style={{
                                flex: 1,
                                padding: '9px 12px',
                                borderRadius: 10,
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                background:
                                  lmsAuthMethod === 'password'
                                    ? 'var(--accent, #1a56db)'
                                    : 'var(--bg-secondary)',
                                color:
                                  lmsAuthMethod === 'password' ? '#fff' : 'var(--text-secondary)',
                                border: `1px solid ${lmsAuthMethod === 'password' ? 'transparent' : 'var(--border)'}`,
                              }}
                            >
                              👤 Usuario y contraseña
                            </button>
                          </div>
                          {lmsAuthMethod === 'password' && (
                            <div
                              style={{
                                fontSize: 11,
                                color: 'var(--text-muted)',
                                marginTop: 8,
                                padding: '8px 12px',
                                background: 'rgba(26,86,219,0.06)',
                                borderRadius: 8,
                                border: '1px solid rgba(26,86,219,0.12)',
                              }}
                            >
                              ℹ Conniku obtiene un token automáticamente con tus credenciales vía el
                              servicio móvil de Moodle. Tu contraseña no se almacena en ningún
                              momento.
                            </div>
                          )}
                        </div>
                      )}

                      {/* Universidad + URL en fila */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 14,
                          marginBottom: 18,
                        }}
                      >
                        <div>
                          <label
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: 'var(--accent, #1a56db)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              display: 'block',
                              marginBottom: 6,
                            }}
                          >
                            Universidad
                          </label>
                          <input
                            type="text"
                            value={lmsPlatformName}
                            onChange={(e) => setLmsPlatformName(e.target.value)}
                            placeholder="Ej: Universidad del Alba"
                            className="form-input"
                            style={{ padding: '11px 14px', borderRadius: 10, fontSize: 14 }}
                          />
                        </div>
                        <div>
                          <label
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: 'var(--accent, #1a56db)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              display: 'block',
                              marginBottom: 6,
                            }}
                          >
                            URL del campus virtual
                          </label>
                          <input
                            type="url"
                            value={lmsUrl}
                            onChange={(e) => setLmsUrl(e.target.value)}
                            onBlur={(e) => {
                              // Auto-strip common login paths users copy from the browser
                              let v = e.target.value.trim().replace(/\/+$/, '');
                              const stripPaths = [
                                '/login/token.php',
                                '/login/index.php',
                                '/loginalt',
                                '/login',
                                '/my/courses',
                                '/my',
                                '/dashboard',
                              ];
                              const low = v.toLowerCase();
                              for (const p of stripPaths) {
                                if (low.endsWith(p)) {
                                  v = v.slice(0, -p.length).replace(/\/+$/, '');
                                  break;
                                }
                              }
                              setLmsUrl(v);
                            }}
                            placeholder="https://campusvirtual.udalba.cl"
                            className="form-input"
                            style={{ padding: '11px 14px', borderRadius: 10, fontSize: 14 }}
                          />
                          <p
                            style={{
                              fontSize: 11,
                              color: 'var(--text-muted)',
                              marginTop: 4,
                              lineHeight: 1.4,
                            }}
                          >
                            Solo la URL base — sin /login, /loginalt ni otras rutas
                          </p>
                        </div>
                      </div>

                      {/* Credenciales — token o usuario+contraseña */}
                      {lmsAuthMethod === 'token' ||
                      !(lmsPlatformType === 'auto' || lmsPlatformType === 'moodle') ? (
                        <div style={{ marginBottom: 8 }}>
                          <label
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: 'var(--accent, #1a56db)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              display: 'block',
                              marginBottom: 6,
                            }}
                          >
                            Token de acceso
                          </label>
                          <input
                            type="password"
                            value={lmsToken}
                            onChange={(e) => setLmsToken(e.target.value)}
                            placeholder="Pega aquí el token generado en tu campus virtual"
                            className="form-input"
                            style={{ padding: '11px 14px', borderRadius: 10, fontSize: 14 }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 14,
                            marginBottom: 8,
                          }}
                        >
                          <div>
                            <label
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: 'var(--accent, #1a56db)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                display: 'block',
                                marginBottom: 6,
                              }}
                            >
                              Usuario
                            </label>
                            <input
                              type="text"
                              value={lmsUsername}
                              onChange={(e) => setLmsUsername(e.target.value)}
                              placeholder="Tu usuario del campus"
                              className="form-input"
                              style={{ padding: '11px 14px', borderRadius: 10, fontSize: 14 }}
                              autoComplete="username"
                            />
                          </div>
                          <div>
                            <label
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: 'var(--accent, #1a56db)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                display: 'block',
                                marginBottom: 6,
                              }}
                            >
                              Contraseña
                            </label>
                            <input
                              type="password"
                              value={lmsPassword}
                              onChange={(e) => setLmsPassword(e.target.value)}
                              placeholder="Tu contraseña del campus"
                              className="form-input"
                              style={{ padding: '11px 14px', borderRadius: 10, fontSize: 14 }}
                              autoComplete="current-password"
                            />
                          </div>
                        </div>
                      )}

                      {/* Instrucciones según plataforma y método */}
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--text-muted)',
                          background: 'var(--bg-secondary)',
                          padding: '12px 16px',
                          borderRadius: 10,
                          marginBottom: 18,
                          lineHeight: 1.7,
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            marginBottom: 4,
                            color: 'var(--text-secondary)',
                            fontSize: 11,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {lmsAuthMethod === 'password' &&
                          (lmsPlatformType === 'auto' || lmsPlatformType === 'moodle')
                            ? 'Requisito'
                            : '¿Cómo obtener el token?'}
                        </div>
                        {lmsAuthMethod === 'password' &&
                        (lmsPlatformType === 'auto' || lmsPlatformType === 'moodle') ? (
                          <>
                            <strong>Moodle:</strong> El servicio móvil debe estar habilitado en tu
                            institución. Si recibes un error de autenticación, usa el método Token.
                          </>
                        ) : (
                          <>
                            {(lmsPlatformType === 'auto' || lmsPlatformType === 'moodle') && (
                              <>
                                <strong>Moodle:</strong> Inicia sesión en tu campus → Perfil →
                                Preferencias → Claves de seguridad → Crear token de servicio web.
                                <br />
                                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                                  Si no ves esta opción, prueba el método Usuario y contraseña.
                                </span>
                              </>
                            )}
                            {lmsPlatformType === 'canvas' && (
                              <>
                                <strong>Canvas:</strong> Configuración de cuenta → Tokens de acceso
                                aprobado → Generar nuevo token de acceso.
                              </>
                            )}
                            {lmsPlatformType === 'blackboard' && (
                              <>
                                <strong>Blackboard:</strong> Consulta al departamento de informática
                                de tu universidad para obtener un token de API.
                              </>
                            )}
                            {lmsPlatformType === 'brightspace' && (
                              <>
                                <strong>Brightspace:</strong> Mi cuenta → Conexiones de cuenta →
                                Gestionar tokens de API.
                              </>
                            )}
                            {lmsPlatformType === 'sakai' && (
                              <>
                                <strong>Sakai:</strong> Perfil → Preferencias → Clave de sesión
                                (Session Key).
                              </>
                            )}
                            {lmsPlatformType === 'teams' && (
                              <>
                                <strong>Teams Educativo:</strong> Requiere configuración
                                institucional. Contacta al centro de informática de tu universidad.
                              </>
                            )}
                            {lmsPlatformType === 'classroom' && (
                              <>
                                <strong>Google Classroom:</strong> Requiere autorización OAuth.
                                Disponible próximamente en Conniku.
                              </>
                            )}
                            {lmsPlatformType === 'other' && (
                              <>
                                Consulta la documentación de tu plataforma para obtener un token de
                                API REST.
                              </>
                            )}
                          </>
                        )}
                      </div>

                      {/* ── Requisitos previos ── */}
                      <div
                        style={{
                          background: 'rgba(245,158,11,0.07)',
                          border: '1px solid rgba(245,158,11,0.25)',
                          borderRadius: 10,
                          padding: '12px 14px',
                          marginBottom: 16,
                          fontSize: 12,
                          lineHeight: 1.7,
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            color: '#f59e0b',
                            fontSize: 11,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: 6,
                          }}
                        >
                          Antes de conectar — verifica que:
                        </div>
                        <div
                          style={{
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                          }}
                        >
                          <span>
                            ✔ Puedes abrir tu campus virtual normalmente en este navegador
                          </span>
                          <span>
                            ✔ Tu campus es accesible desde fuera de la red universitaria (sin VPN)
                          </span>
                          <span>
                            ✔ El servicio web de tu plataforma está habilitado por tu institución
                          </span>
                        </div>
                        <div style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 11 }}>
                          Si tu campus requiere VPN o solo funciona dentro de la red universitaria,
                          Conniku no podrá sincronizarse automáticamente.
                        </div>
                      </div>

                      {lmsConnectError && (
                        <div
                          style={{
                            fontSize: 13,
                            marginBottom: 14,
                            padding: '12px 14px',
                            background: 'rgba(239,68,68,0.08)',
                            borderRadius: 10,
                            border: '1px solid rgba(239,68,68,0.2)',
                            color: 'var(--accent-red)',
                          }}
                        >
                          {lmsConnectError.toLowerCase().includes('failed to fetch') ? (
                            <div>
                              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                                ⚠ No se pudo conectar con el servidor
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: 'var(--text-secondary)',
                                  lineHeight: 1.6,
                                }}
                              >
                                Posibles causas:
                                <br />• El servidor puede estar iniciando —{' '}
                                <strong>intenta nuevamente en 30 segundos</strong>
                                <br />• Tu campus virtual requiere estar en la red universitaria
                                (VPN)
                                <br />• La URL ingresada no es correcta o el campus está caído
                              </div>
                            </div>
                          ) : (
                            <span>⚠ {lmsConnectError}</span>
                          )}
                        </div>
                      )}

                      <button
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: 10,
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                        disabled={
                          lmsConnecting ||
                          !lmsUrl ||
                          (lmsAuthMethod === 'password' &&
                          (lmsPlatformType === 'auto' || lmsPlatformType === 'moodle')
                            ? !lmsUsername || !lmsPassword
                            : !lmsToken)
                        }
                        onClick={async () => {
                          const usePass =
                            lmsAuthMethod === 'password' &&
                            (lmsPlatformType === 'auto' || lmsPlatformType === 'moodle');
                          if (!lmsUrl || (usePass ? !lmsUsername || !lmsPassword : !lmsToken))
                            return;
                          setLmsConnecting(true);
                          setLmsConnectError('');
                          const payload = {
                            platform_type: lmsPlatformType,
                            platform_name: lmsPlatformName,
                            api_url: lmsUrl,
                            ...(usePass
                              ? {
                                  auth_method: 'password',
                                  username: lmsUsername,
                                  password: lmsPassword,
                                }
                              : { auth_method: 'token', api_token: lmsToken }),
                          };
                          try {
                            // Pre-wake: ping health to wake server before the real request
                            try {
                              setLmsConnectError('⏳ Conectando con el servidor...');
                              await fetch(
                                `${(await import('../services/api')).getApiBase()}/health`,
                                { method: 'GET' }
                              ).catch(() => {});
                              await new Promise((r) => setTimeout(r, 1000));
                            } catch {}
                            setLmsConnectError('');
                            let res: any;
                            const delays = [0, 5000, 10000];
                            for (let attempt = 0; attempt < delays.length; attempt++) {
                              try {
                                if (attempt > 0) {
                                  setLmsConnectError(`⏳ Reintentando conexión... (${attempt}/2)`);
                                  await new Promise((r) => setTimeout(r, delays[attempt]));
                                }
                                res = await api.lmsConnect(payload);
                                setLmsConnectError('');
                                break;
                              } catch (err: any) {
                                const isNetwork =
                                  err.message?.toLowerCase().includes('conectar') ||
                                  err.message?.toLowerCase().includes('failed to fetch') ||
                                  err.message?.toLowerCase().includes('conexión');
                                if (isNetwork && attempt < delays.length - 1) continue;
                                throw err;
                              }
                            }
                            setLmsShowConnect(false);
                            setLmsUrl('');
                            setLmsToken('');
                            setLmsPlatformName('');
                            setLmsUsername('');
                            setLmsPassword('');

                            // Courses load in background — poll until ready
                            if (res.syncing) {
                              setLmsScanMsg('⏳ Conectado — cargando asignaturas...');
                              const connId = res.id;
                              // Poll every 3s, up to 5 times (15s)
                              for (let poll = 0; poll < 5; poll++) {
                                await new Promise((r) => setTimeout(r, 3000));
                                try {
                                  const connsNow: any = await api
                                    .lmsGetConnections()
                                    .catch(() => []);
                                  const arr = Array.isArray(connsNow) ? connsNow : [];
                                  setLmsConnections(arr);
                                  const found = arr.find((c: any) => c.id === connId);
                                  if (found?.courses?.length > 0) {
                                    setLmsConnectionId(connId);
                                    setLmsDetectedCourses(found.courses);
                                    setLmsSelectedCourses(
                                      new Set(found.courses.map((c: any) => c.id))
                                    );
                                    setLmsSubjectModal(true);
                                    setLmsScanMsg('');
                                    break;
                                  }
                                } catch {}
                              }
                              if (!lmsSubjectModal)
                                setLmsScanMsg(
                                  '✅ Conectado — las asignaturas se cargarán en breve'
                                );
                            } else if (res.courses && res.courses.length > 0) {
                              setLmsConnectionId(res.id);
                              setLmsDetectedCourses(res.courses);
                              setLmsSelectedCourses(new Set(res.courses.map((c: any) => c.id)));
                              setLmsSubjectModal(true);
                            } else {
                              setLmsScanMsg('✅ Conectado — sin asignaturas detectadas aún');
                            }
                            const conns: any = await api.lmsGetConnections().catch(() => []);
                            setLmsConnections(Array.isArray(conns) ? conns : []);
                            const projs: any = await api.getProjects().catch(() => []);
                            setLmsProjects(Array.isArray(projs) ? projs : []);
                          } catch (e: any) {
                            setLmsConnectError(
                              e.message || 'No se pudo conectar. Verifica la URL y el token.'
                            );
                          } finally {
                            setLmsConnecting(false);
                          }
                        }}
                      >
                        {lmsConnecting ? '⏳ Conectando...' : 'Conectar y verificar'}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Modal selección de asignaturas ── */}
                {lmsSubjectModal && (
                  <div
                    style={{
                      position: 'fixed',
                      inset: 0,
                      background: 'rgba(0,0,0,0.65)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1100,
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        background: 'var(--bg-card)',
                        borderRadius: 16,
                        width: '100%',
                        maxWidth: 560,
                        maxHeight: '85vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
                      }}
                    >
                      {/* Header */}
                      <div
                        style={{
                          background: 'linear-gradient(135deg, #1e3a5f 0%, #1a56db 100%)',
                          padding: '22px 24px',
                        }}
                      >
                        <h3 style={{ margin: 0, color: '#fff', fontSize: 17, fontWeight: 700 }}>
                          ¿Qué asignaturas quieres agregar?
                        </h3>
                        <p
                          style={{
                            margin: '6px 0 0',
                            color: 'rgba(255,255,255,0.68)',
                            fontSize: 13,
                          }}
                        >
                          Selecciona las asignaturas que usarás en Conniku. Las no seleccionadas se
                          pueden agregar manualmente después.
                        </p>
                      </div>

                      {/* Toolbar */}
                      <div
                        style={{
                          padding: '12px 20px',
                          borderBottom: '1px solid var(--border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'var(--bg-secondary)',
                        }}
                      >
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>
                            {lmsSelectedCourses.size}
                          </strong>{' '}
                          de {lmsDetectedCourses.length} seleccionadas
                        </span>
                        <button
                          onClick={() => {
                            if (lmsSelectedCourses.size === lmsDetectedCourses.length) {
                              setLmsSelectedCourses(new Set());
                            } else {
                              setLmsSelectedCourses(new Set(lmsDetectedCourses.map((c) => c.id)));
                            }
                          }}
                          style={{
                            fontSize: 12,
                            color: 'var(--accent, #1a56db)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 700,
                            padding: '4px 8px',
                            borderRadius: 6,
                          }}
                        >
                          {lmsSelectedCourses.size === lmsDetectedCourses.length
                            ? 'Deseleccionar todas'
                            : 'Seleccionar todas'}
                        </button>
                      </div>

                      {/* Lista de asignaturas */}
                      <div style={{ overflowY: 'auto', flex: 1, padding: '6px 12px' }}>
                        {lmsDetectedCourses.length === 0 ? (
                          <div
                            style={{
                              padding: 32,
                              textAlign: 'center',
                              color: 'var(--text-muted)',
                              fontSize: 14,
                            }}
                          >
                            No se detectaron asignaturas en esta plataforma.
                          </div>
                        ) : (
                          lmsDetectedCourses.map((course) => (
                            <label
                              key={course.id}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 12,
                                padding: '11px 8px',
                                borderRadius: 8,
                                cursor: 'pointer',
                                borderBottom: '1px solid var(--border-subtle)',
                                background: lmsSelectedCourses.has(course.id)
                                  ? 'rgba(26,86,219,0.06)'
                                  : 'transparent',
                                transition: 'background 0.1s',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={lmsSelectedCourses.has(course.id)}
                                onChange={(e) => {
                                  const next = new Set(lmsSelectedCourses);
                                  if (e.target.checked) next.add(course.id);
                                  else next.delete(course.id);
                                  setLmsSelectedCourses(next);
                                }}
                                style={{
                                  marginTop: 3,
                                  accentColor: 'var(--accent)',
                                  width: 16,
                                  height: 16,
                                  flexShrink: 0,
                                  cursor: 'pointer',
                                }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    lineHeight: 1.3,
                                  }}
                                >
                                  {course.name}
                                </div>
                                {(course.short_name || course.semester) && (
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: 'var(--text-muted)',
                                      marginTop: 2,
                                    }}
                                  >
                                    {[course.short_name, course.semester]
                                      .filter(Boolean)
                                      .join(' · ')}
                                  </div>
                                )}
                              </div>
                            </label>
                          ))
                        )}
                      </div>

                      {/* Footer */}
                      <div
                        style={{
                          padding: '16px 20px',
                          borderTop: '1px solid var(--border)',
                          display: 'flex',
                          gap: 10,
                          justifyContent: 'flex-end',
                          background: 'var(--bg-secondary)',
                        }}
                      >
                        <button
                          onClick={() => {
                            setLmsSubjectModal(false);
                            setLmsScanMsg(
                              `✅ Conectado — ${lmsDetectedCourses.length} asignatura${lmsDetectedCourses.length !== 1 ? 's' : ''} agregada${lmsDetectedCourses.length !== 1 ? 's' : ''}`
                            );
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '10px 18px', borderRadius: 10, fontSize: 14 }}
                        >
                          Agregar todas
                        </button>
                        <button
                          disabled={lmsActivating || lmsSelectedCourses.size === 0}
                          onClick={async () => {
                            setLmsActivating(true);
                            try {
                              await api.lmsActivateCourses(
                                lmsConnectionId,
                                Array.from(lmsSelectedCourses)
                              );
                              setLmsSubjectModal(false);
                              const count = lmsSelectedCourses.size;
                              setLmsScanMsg(
                                `✅ Conectado — ${count} asignatura${count !== 1 ? 's' : ''} agregada${count !== 1 ? 's' : ''}`
                              );
                              const conns: any = await api.lmsGetConnections().catch(() => []);
                              setLmsConnections(Array.isArray(conns) ? conns : []);
                            } catch {
                              setLmsScanMsg('⚠ Error al guardar la selección de asignaturas');
                            } finally {
                              setLmsActivating(false);
                            }
                          }}
                          className="btn btn-primary"
                          style={{
                            padding: '10px 20px',
                            borderRadius: 10,
                            fontSize: 14,
                            fontWeight: 600,
                          }}
                        >
                          {lmsActivating
                            ? '⏳ Guardando...'
                            : `Agregar seleccionadas${lmsSelectedCourses.size > 0 ? ` (${lmsSelectedCourses.size})` : ''}`}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Botón agregar otra conexión ── */}
                {lmsConnections.length > 0 && !lmsShowConnect && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: 8 }}
                    onClick={() => {
                      setLmsPlatformName(user?.university || '');
                      setLmsShowConnect(true);
                    }}
                  >
                    + Conectar otra plataforma
                  </button>
                )}
              </div>
            )}

            {/* ─── Apariencia ─── */}
            {activeSection === 'appearance' && (
              <div className="pf-section">
                <h3>Tema de color</h3>
                <p className="pf-hint">Elige el aspecto visual de la plataforma</p>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                  {[
                    {
                      id: 'corporativo',
                      name: 'Corporativo',
                      colors: ['#F1F5F9', '#2D62C8', '#D97706'],
                      desc: 'Claro · azul nav + amber',
                      available: true,
                    },
                    {
                      id: 'conniku',
                      name: 'Conniku',
                      colors: ['#070D18', '#2D62C8', '#3b82f6'],
                      desc: 'Oscuro · azul marca',
                      available: true,
                    },
                  ].map((th) => {
                    const isActive = currentTheme === th.id;
                    return (
                      <button
                        key={th.id}
                        disabled={!th.available}
                        onClick={() => {
                          if (!th.available) return;
                          localStorage.setItem('conniku_theme', th.id);
                          document.documentElement.setAttribute('data-theme', th.id);
                          setCurrentTheme(th.id);
                        }}
                        style={{
                          flex: 1,
                          minWidth: 120,
                          padding: '14px 12px',
                          borderRadius: 12,
                          cursor: th.available ? 'pointer' : 'not-allowed',
                          opacity: th.available ? 1 : 0.38,
                          border: isActive
                            ? '2px solid var(--accent)'
                            : '1.5px solid var(--border)',
                          background: isActive ? 'rgba(56,189,248,0.06)' : 'var(--bg-secondary)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <div style={{ display: 'flex', gap: 6 }}>
                          {th.colors.map((c, i) => (
                            <div
                              key={i}
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: '50%',
                                background: c,
                                border: '2px solid rgba(255,255,255,0.1)',
                              }}
                            />
                          ))}
                        </div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 13,
                            color: th.available ? 'var(--text-primary)' : 'var(--text-muted)',
                          }}
                        >
                          {th.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{th.desc}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="pf-divider" />

                <h3>{t('profile.platformLanguage')}</h3>
                <p className="pf-hint">{t('profile.platformLanguageHint')}</p>
                <select
                  value={user.platformLanguage || user.language || 'es'}
                  onChange={(e) => updateProfile({ platformLanguage: e.target.value } as any)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    marginBottom: 16,
                  }}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.name}
                    </option>
                  ))}
                </select>

                <h3>{t('profile.additionalLanguages')}</h3>
                <p className="pf-hint">{t('profile.additionalLanguagesHint')}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {LANGUAGES.filter(
                    (l) => l.code !== (user.platformLanguage || user.language || 'es')
                  ).map((l) => {
                    const selected = (user.secondaryLanguages || []).includes(l.code);
                    return (
                      <button
                        key={l.code}
                        onClick={() => {
                          const current = user.secondaryLanguages || [];
                          let updated: string[];
                          if (selected) {
                            updated = current.filter((c: string) => c !== l.code);
                          } else if (current.length < 3) {
                            updated = [...current, l.code];
                          } else {
                            return;
                          }
                          updateProfile({ secondaryLanguages: updated } as any);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 20,
                          fontSize: 13,
                          cursor: 'pointer',
                          border: selected ? '2px solid var(--accent)' : '1px solid var(--border)',
                          background: selected ? 'rgba(37,99,235,0.08)' : 'var(--bg-secondary)',
                          color: selected ? 'var(--accent)' : 'var(--text-secondary)',
                          fontWeight: selected ? 600 : 400,
                        }}
                      >
                        {l.flag} {l.name} {selected && '✓'}
                      </button>
                    );
                  })}
                </div>
                {(user.secondaryLanguages || []).length >= 3 && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {t('profile.maxLanguages')}
                  </p>
                )}
              </div>
            )}

            {/* ─── Notificaciones & Privacidad ─── */}
            {activeSection === 'notifications' && (
              <div className="pf-section">
                <h3>{t('profile.privacy')}</h3>
                <div className="pf-toggles">
                  <ToggleRow
                    label={t('profile.privateProfile')}
                    desc={t('profile.privateProfileDesc')}
                  />
                  <ToggleRow label={t('profile.showOnline')} desc={t('profile.showOnlineDesc')} />
                  <ToggleRow
                    label={t('profile.showSuggestions')}
                    desc={t('profile.showSuggestionsDesc')}
                  />
                </div>

                <div className="pf-divider" />

                <h3>{t('profile.emailNotifications')}</h3>
                <div className="pf-toggles">
                  <ToggleRow
                    label={t('profile.emailNotifToggle')}
                    desc={t('profile.emailNotifDesc')}
                    checked={(user as any).emailNotifEnabled !== false}
                    onChange={(v) => updateProfile({ emailNotifEnabled: v } as any)}
                  />
                  <ToggleRow
                    label={t('profile.friendPosts')}
                    desc={t('profile.friendPostsDesc')}
                    checked={(user as any).emailNotifFriendPosts !== false}
                    onChange={(v) => updateProfile({ emailNotifFriendPosts: v } as any)}
                  />
                  <ToggleRow
                    label={t('profile.friendRequests')}
                    desc={t('profile.friendRequestsDesc')}
                    checked={(user as any).emailNotifFriendRequests !== false}
                    onChange={(v) => updateProfile({ emailNotifFriendRequests: v } as any)}
                  />
                  <ToggleRow
                    label={t('profile.directMessages')}
                    desc={t('profile.directMessagesDesc')}
                    checked={(user as any).emailNotifDirectMessages !== false}
                    onChange={(v) => updateProfile({ emailNotifDirectMessages: v } as any)}
                  />
                </div>
              </div>
            )}

            {/* ─── Seguridad ─── */}
            {activeSection === 'security' && (
              <div className="pf-section">
                <h3>{t('profile.changePassword')}</h3>
                {user.provider === 'email' ? (
                  !showPasswordChange ? (
                    <div>
                      <p className="pf-hint">{t('profile.changePasswordHint')}</p>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowPasswordChange(true)}
                      >
                        {t('profile.changePasswordBtn')}
                      </button>
                    </div>
                  ) : (
                    <div className="pf-password-form">
                      <div className="pf-field">
                        <label>{t('profile.currentPassword')}</label>
                        <input
                          className="form-input"
                          type="password"
                          value={currentPw}
                          onChange={(e) => setCurrentPw(e.target.value)}
                        />
                      </div>
                      <div className="pf-field">
                        <label>{t('profile.newPassword')}</label>
                        <input
                          className="form-input"
                          type="password"
                          value={newPw}
                          onChange={(e) => setNewPw(e.target.value)}
                        />
                      </div>
                      <div className="pf-field">
                        <label>{t('profile.confirmNewPassword')}</label>
                        <input
                          className="form-input"
                          type="password"
                          value={confirmPw}
                          onChange={(e) => setConfirmPw(e.target.value)}
                        />
                      </div>
                      {pwError && (
                        <p style={{ color: 'var(--accent-red)', fontSize: 13 }}>{pwError}</p>
                      )}
                      {pwSuccess && (
                        <p style={{ color: 'var(--accent-green)', fontSize: 13 }}>
                          {t('profile.passwordUpdated')}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={async () => {
                            setPwError('');
                            setPwSuccess(false);
                            if (newPw.length < 6) {
                              setPwError(t('profile.passwordMin'));
                              return;
                            }
                            if (newPw !== confirmPw) {
                              setPwError(t('profile.passwordMismatch'));
                              return;
                            }
                            try {
                              await api.changePassword(currentPw, newPw);
                              setPwSuccess(true);
                              setCurrentPw('');
                              setNewPw('');
                              setConfirmPw('');
                              setTimeout(() => setShowPasswordChange(false), 2000);
                            } catch (e: any) {
                              setPwError(e.message || 'Error al cambiar contraseña');
                            }
                          }}
                        >
                          {t('profile.savePassword')}
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setShowPasswordChange(false);
                            setPwError('');
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  <p className="pf-hint">{t('profile.googleSignIn')}</p>
                )}

                <div className="pf-divider" />

                <h3 style={{ color: 'var(--accent-red)' }}>{t('profile.deleteAccount')}</h3>
                <div className="pf-danger-zone">
                  <p>{t('profile.deleteAccountDesc')}</p>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    {t('profile.deleteAccountBtn')}
                  </button>
                </div>
                {showDeleteModal && (
                  <DeleteAccountModal
                    userName={user.firstName || user.username || ''}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirmDelete={() => {
                      api
                        .deleteAccount()
                        .then(() => {
                          logout();
                        })
                        .catch(() => {});
                    }}
                  />
                )}
              </div>
            )}

            {/* ─── Correo Corporativo (Owner) ─── */}
            {activeSection === 'email' && user.role === 'owner' && (
              <div className="pf-section">
                <h3>{t('profile.emailAccounts')}</h3>
                <p className="pf-hint" style={{ marginBottom: 20 }}>
                  {t('profile.emailAccountsHint')}
                </p>
                <div className="pf-toggles">
                  {[
                    {
                      email: 'ceo@conniku.com',
                      label: 'CEO / Principal',
                      desc: 'Cuenta consolidada — notificaciones, contacto y administración',
                      status: 'active',
                    },
                    {
                      email: 'contacto@conniku.com',
                      label: 'Contacto General',
                      desc: 'Soporte y consultas de usuarios',
                      status: 'pending',
                    },
                    {
                      email: 'soporte@conniku.com',
                      label: 'Soporte Técnico',
                      desc: 'Tickets de soporte y ayuda',
                      status: 'pending',
                    },
                    {
                      email: 'pagos@conniku.com',
                      label: 'Facturación',
                      desc: 'Recibos, facturas y pagos',
                      status: 'pending',
                    },
                  ].map((account) => (
                    <div key={account.email} className="pf-email-row">
                      <div className={`pf-email-icon ${account.status}`}>
                        {account.status === 'active'
                          ? CheckCircle({ size: 14 })
                          : Hourglass({ size: 14 })}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{account.label}</div>
                        <div
                          style={{
                            fontSize: 13,
                            color: 'var(--accent-blue)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {account.email}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {account.desc}
                        </div>
                      </div>
                      <span
                        className={`pf-badge ${account.status === 'active' ? 'pf-badge-green' : 'pf-badge-orange'}`}
                      >
                        {account.status === 'active' ? t('profile.active') : t('profile.pending')}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: 16 }}
                  onClick={() =>
                    window.open(
                      'https://mailadmin.zoho.com/cpanel/index.do',
                      '_blank',
                      'noopener,noreferrer'
                    )
                  }
                >
                  {t('profile.createEmail')}
                </button>

                <div className="pf-divider" />

                <h3>{t('profile.outlookConfig')}</h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 16,
                    marginTop: 12,
                  }}
                >
                  <div className="pf-config-box">
                    <h4 style={{ color: 'var(--accent-blue)' }}>{t('profile.incomingMail')}</h4>
                    <div>
                      Servidor:{' '}
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>mail.conniku.com</strong>
                    </div>
                    <div>
                      Puerto: <strong>993</strong> (SSL/TLS)
                    </div>
                    <div>
                      Usuario:{' '}
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>tu@conniku.com</strong>
                    </div>
                  </div>
                  <div className="pf-config-box">
                    <h4 style={{ color: 'var(--accent-green)' }}>{t('profile.outgoingMail')}</h4>
                    <div>
                      Servidor:{' '}
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>smtp.conniku.com</strong>
                    </div>
                    <div>
                      Puerto: <strong>587</strong> (STARTTLS)
                    </div>
                    <div>
                      Autenticación: <strong>{t('profile.authRequired')}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Milestone Popup */}
      {milestonePopup && (
        <MilestonePopup
          type={milestonePopup.type}
          title={milestonePopup.title}
          description={milestonePopup.description}
          icon={milestonePopup.icon}
          onClose={() => setMilestonePopup(null)}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// DELETE ACCOUNT MODAL — Retention flow with survey + offers
// ═══════════════════════════════════════════════════════════════
type DeleteStep = 'reason' | 'feedback' | 'offer_pro' | 'offer_max' | 'confirm';

const DELETE_REASONS = [
  { value: 'no_use', label: 'Ya no uso la plataforma' },
  { value: 'another_platform', label: 'Encontré otra plataforma mejor' },
  { value: 'too_complex', label: 'La plataforma es muy compleja' },
  { value: 'missing_features', label: 'Falta funcionalidad que necesito' },
  { value: 'bugs', label: 'Problemas técnicos o errores' },
  { value: 'privacy', label: 'Preocupaciones de privacidad' },
  { value: 'cost', label: 'El costo es muy alto' },
  { value: 'graduated', label: 'Ya me gradué / no estudio' },
  { value: 'other', label: 'Otra razón' },
];

function DeleteAccountModal({
  userName,
  onClose,
  onConfirmDelete,
}: {
  userName: string;
  onClose: () => void;
  onConfirmDelete: () => void;
}) {
  const [step, setStep] = useState<DeleteStep>('reason');
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [sending, setSending] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 10000,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  };
  const modalStyle: React.CSSProperties = {
    background: 'var(--bg-primary)',
    borderRadius: 16,
    width: '100%',
    maxWidth: 480,
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  };
  const headerStyle: React.CSSProperties = {
    padding: '20px 24px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };
  const bodyStyle: React.CSSProperties = { padding: '20px 24px' };
  const footerStyle: React.CSSProperties = {
    padding: '16px 24px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
  };
  const btnPrimary: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 10,
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };
  const btnDanger: React.CSSProperties = {
    ...btnPrimary,
    background: '#ef4444',
  };
  const btnSecondary: React.CSSProperties = {
    ...btnPrimary,
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
  };
  const radioStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
    cursor: 'pointer',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    transition: 'all 0.15s',
  };

  const sendFeedbackToEmail = async () => {
    const reasonLabel = DELETE_REASONS.find((r) => r.value === reason)?.label || reason;
    try {
      await api.sendClosureFeedback(reasonLabel, feedback);
    } catch {
      /* silent */
    }
  };

  const handleAcceptOffer = async (plan: string) => {
    setAccepted(true);
    setSending(true);
    await sendFeedbackToEmail();
    // In a real implementation, this would activate the trial
    // For now, just close the modal after a brief delay
    setTimeout(() => {
      setSending(false);
      onClose();
    }, 1500);
  };

  const handleFinalDelete = async () => {
    setSending(true);
    await sendFeedbackToEmail();
    onConfirmDelete();
  };

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h3 style={{ margin: 0, fontSize: 16 }}>
            {step === 'reason' && 'Antes de irte...'}
            {step === 'feedback' && 'Tu opinión nos importa'}
            {step === 'offer_pro' && '¡Espera! Tenemos algo para ti'}
            {step === 'offer_max' && 'Última oferta especial'}
            {step === 'confirm' && 'Confirmar eliminación'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: 18,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Step 1: Reason */}
        {step === 'reason' && (
          <>
            <div style={bodyStyle}>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
                {userName}, lamentamos que quieras irte. Nos ayudaría mucho saber por qué quieres
                cerrar tu cuenta.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {DELETE_REASONS.map((r) => (
                  <label
                    key={r.value}
                    style={{
                      ...radioStyle,
                      borderColor: reason === r.value ? 'var(--accent)' : 'var(--border)',
                      background:
                        reason === r.value ? 'rgba(45,98,200,0.08)' : 'var(--bg-secondary)',
                    }}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>
            <div style={footerStyle}>
              <button style={btnSecondary} onClick={onClose}>
                Cancelar
              </button>
              <button
                style={{ ...btnDanger, opacity: reason ? 1 : 0.5 }}
                disabled={!reason}
                onClick={() => setStep('feedback')}
              >
                Continuar
              </button>
            </div>
          </>
        )}

        {/* Step 2: Feedback */}
        {step === 'feedback' && (
          <>
            <div style={bodyStyle}>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
                ¿Hay algo más que quieras compartir? Tu feedback nos ayuda a mejorar.
              </p>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Cuéntanos qué podríamos mejorar... (opcional)"
                style={{
                  width: '100%',
                  minHeight: 120,
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>
            <div style={footerStyle}>
              <button style={btnSecondary} onClick={() => setStep('reason')}>
                Atrás
              </button>
              <button style={btnDanger} onClick={() => setStep('offer_pro')}>
                Continuar
              </button>
            </div>
          </>
        )}

        {/* Step 3: Offer PRO */}
        {step === 'offer_pro' && (
          <>
            <div style={bodyStyle}>
              <div
                style={{
                  padding: 24,
                  borderRadius: 12,
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #2D62C8, #4f8cff)',
                  color: '#fff',
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 8 }}>⭐</div>
                <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>1 Mes PRO Gratis</h3>
                <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>
                  Queremos que te quedes. Te regalamos un mes completo de Conniku PRO para que
                  explores todas las funcionalidades.
                </p>
              </div>
              <div
                style={{
                  padding: 14,
                  background: 'var(--bg-secondary)',
                  borderRadius: 10,
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                }}
              >
                <strong>Conniku PRO incluye:</strong>
                <div style={{ marginTop: 6 }}>
                  • Proyectos ilimitados y almacenamiento ampliado
                  <br />
                  • Asistente avanzado para estudio y tutoría
                  <br />
                  • Acceso a cursos exclusivos
                  <br />
                  • Soporte prioritario
                  <br />• Sin publicidad
                </div>
              </div>
            </div>
            <div style={footerStyle}>
              <button style={btnSecondary} onClick={() => setStep('offer_max')}>
                No, gracias
              </button>
              <button
                style={btnPrimary}
                onClick={() => handleAcceptOffer('pro')}
                disabled={sending}
              >
                {accepted ? 'Activando...' : 'Aceptar PRO Gratis'}
              </button>
            </div>
          </>
        )}

        {/* Step 4: Offer MAX */}
        {step === 'offer_max' && (
          <>
            <div style={bodyStyle}>
              <div
                style={{
                  padding: 24,
                  borderRadius: 12,
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                  color: '#fff',
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 8 }}>💎</div>
                <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>1 Mes MAX Gratis</h3>
                <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>
                  Nuestra mejor oferta. Te damos acceso completo a Conniku MAX, nuestro plan premium
                  con todo incluido.
                </p>
              </div>
              <div
                style={{
                  padding: 14,
                  background: 'var(--bg-secondary)',
                  borderRadius: 10,
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                }}
              >
                <strong>Conniku MAX incluye todo de PRO más:</strong>
                <div style={{ marginTop: 6 }}>
                  • Acceso completo al asistente sin límites
                  <br />
                  • Generación ilimitada de guías, quizzes y flashcards
                  <br />
                  • Acceso a todos los cursos y certificaciones
                  <br />
                  • Mentoría prioritaria
                  <br />• Badge exclusivo MAX en tu perfil
                </div>
              </div>
            </div>
            <div style={footerStyle}>
              <button style={{ ...btnDanger, fontSize: 12 }} onClick={() => setStep('confirm')}>
                No, eliminar mi cuenta
              </button>
              <button
                style={{ ...btnPrimary, background: '#7c3aed' }}
                onClick={() => handleAcceptOffer('max')}
                disabled={sending}
              >
                {accepted ? 'Activando...' : 'Aceptar MAX Gratis'}
              </button>
            </div>
          </>
        )}

        {/* Step 5: Final Confirmation */}
        {step === 'confirm' && (
          <>
            <div style={bodyStyle}>
              <div
                style={{
                  padding: 16,
                  background: 'rgba(239,68,68,0.08)',
                  borderRadius: 10,
                  border: '1px solid rgba(239,68,68,0.2)',
                  marginBottom: 16,
                }}
              >
                <p style={{ margin: 0, fontSize: 14, color: '#ef4444', fontWeight: 600 }}>
                  Esta acción es irreversible
                </p>
                <p
                  style={{
                    margin: '8px 0 0',
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                  }}
                >
                  Al confirmar, se eliminarán permanentemente todos tus datos: proyectos,
                  documentos, mensajes, publicaciones, progreso en cursos, y toda tu información
                  personal.
                </p>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Tu feedback será enviado al equipo de Conniku para ayudarnos a mejorar. Gracias por
                haber sido parte de la comunidad.
              </p>
            </div>
            <div style={footerStyle}>
              <button style={btnSecondary} onClick={onClose}>
                Cancelar, me quedo
              </button>
              <button style={btnDanger} onClick={handleFinalDelete} disabled={sending}>
                {sending ? 'Eliminando...' : 'Eliminar mi cuenta'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
