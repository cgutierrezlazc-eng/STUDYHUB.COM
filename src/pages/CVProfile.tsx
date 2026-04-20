import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { api } from '../services/api';
import cvStyles from './CVProfile.module.css';
import {
  Pencil,
  Download,
  Share2,
  Upload,
  Save,
  Plus,
  Trash2,
  X,
  ChevronRight,
} from '../components/Icons';

interface Props {
  onNavigate: (path: string) => void;
}

interface Experience {
  id: string;
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
  description: string;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url: string;
}

interface SkillGroup {
  category: string;
  skills: { name: string; level: number }[];
}

interface CVData {
  headline: string;
  summary: string;
  location: string;
  email: string;
  phone: string;
  availableWorldwide: boolean;
  openToOffers: boolean;
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  skillGroups: SkillGroup[];
  differentiators: string[];
  languages: { name: string; level: string }[];
  links: { label: string; url: string }[];
  competencies: string[];
  visibility: 'public' | 'private' | 'connections';
}

const EMPTY_CV: CVData = {
  headline: '',
  summary: '',
  location: '',
  email: '',
  phone: '',
  availableWorldwide: false,
  openToOffers: false,
  experience: [],
  education: [],
  certifications: [],
  skillGroups: [],
  differentiators: [],
  languages: [],
  links: [],
  competencies: [],
  visibility: 'private',
};

const LANG_LEVELS = ['Básico', 'Intermedio', 'Avanzado', 'Nativo/Bilingüe'];

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

const SECTIONS = [
  { id: 'sobre', label: 'Resumen profesional', group: 'Datos básicos' },
  { id: 'educacion', label: 'Educación', group: 'Académico' },
  { id: 'experiencia', label: 'Experiencia', group: 'Experiencia' },
  { id: 'certificaciones', label: 'Certificaciones', group: 'Experiencia' },
  { id: 'habilidades', label: 'Habilidades', group: 'Habilidades' },
  { id: 'idiomas', label: 'Idiomas', group: 'Habilidades' },
  { id: 'diferenciadores', label: 'Lo que me diferencia', group: 'Habilidades' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

export default function CVProfile({ onNavigate }: Props) {
  const { user } = useAuth();
  const { username } = useParams<{ username?: string }>();
  const isPublicView = !!username;
  const isOwnProfile = !isPublicView;

  const [cv, setCv] = useState<CVData>({ ...EMPTY_CV });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>('sobre');
  const [uploadMsg, setUploadMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Load data ── */
  useEffect(() => {
    loadCV();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  async function loadCV() {
    setLoading(true);
    try {
      if (isPublicView) {
        const res = await api.getUserCV(username!);
        if (res) hydrateCV(res);
      } else {
        const cvRes = await api.getMyCV().catch(() => null);
        if (cvRes) hydrateCV(cvRes?.profile || cvRes);
      }
    } catch (e) {
      console.error('Error loading CV:', e);
    }
    setLoading(false);
  }

  function hydrateCV(raw: any) {
    if (!raw) return;
    setCv({
      headline: raw.headline || raw.cv_headline || '',
      summary: raw.summary || raw.cv_summary || '',
      location: raw.location || '',
      email: raw.email || user?.email || '',
      phone: raw.phone || '',
      availableWorldwide: raw.available_worldwide ?? false,
      openToOffers: raw.open_to_offers ?? raw.open_to_work ?? raw.is_open_to_opportunities ?? false,
      experience: normalizeExperience(parseJsonField(raw.experience || raw.cv_experience, [])),
      education: normalizeEducation(parseJsonField(raw.education, [])),
      certifications: parseJsonField(raw.certifications || raw.cv_certifications, []),
      skillGroups: normalizeSkillGroups(
        parseJsonField(raw.skill_groups || raw.skills || raw.cv_skills, [])
      ),
      differentiators: normalizeDifferentiators(parseJsonField(raw.differentiators, [])),
      languages: normalizeLanguages(parseJsonField(raw.languages || raw.cv_languages, [])),
      links: parseJsonField(raw.links || raw.cv_portfolio, []),
      competencies: parseJsonField(raw.competencies, []),
      visibility: raw.visibility || raw.cv_visibility || 'private',
    });
  }

  function parseJsonField(val: any, fallback: any) {
    if (!val) return fallback;
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return fallback;
      }
    }
    return fallback;
  }

  function normalizeExperience(arr: any[]): Experience[] {
    return arr.map((exp) => ({
      id: exp.id || genId(),
      company: exp.company || '',
      title: exp.title || '',
      location: exp.location || '',
      startDate: exp.startDate || exp.start_date || '',
      endDate: exp.endDate || exp.end_date || '',
      current: exp.current ?? false,
      description:
        exp.description ||
        (Array.isArray(exp.bullets) ? exp.bullets.join('\n') : exp.bullets || ''),
    }));
  }

  function normalizeEducation(arr: any[]): Education[] {
    return arr.map((edu) => ({
      id: edu.id || genId(),
      institution: edu.institution || '',
      degree: edu.degree || '',
      field: edu.field || '',
      startYear: edu.startYear || edu.start_date || edu.startDate || '',
      endYear: edu.endYear || edu.end_date || edu.endDate || '',
      description: edu.description || '',
    }));
  }

  function normalizeSkillGroups(arr: any[]): SkillGroup[] {
    return arr.map((group) => ({
      category: group.category || '',
      skills: (group.skills || group.items || []).map((s: any) => ({
        name: s.name || '',
        level:
          typeof s.level === 'number' ? s.level : proficiencyToNumber(s.proficiency || s.level),
      })),
    }));
  }

  function proficiencyToNumber(p: any): number {
    if (typeof p === 'number') return p;
    const map: Record<string, number> = {
      beginner: 25,
      básico: 25,
      basico: 25,
      basic: 25,
      intermediate: 50,
      intermedio: 50,
      advanced: 75,
      avanzado: 75,
      expert: 95,
      experto: 95,
      nativo: 95,
      native: 95,
      bilingüe: 95,
      bilingual: 95,
    };
    return map[(p || '').toLowerCase()] ?? 50;
  }

  function normalizeLanguages(arr: any[]): { name: string; level: string }[] {
    return arr.map((lang) => ({
      name: lang.name || lang.language || '',
      level: lang.level || lang.proficiency || '',
    }));
  }

  function normalizeDifferentiators(arr: any[]): string[] {
    return arr
      .map((d) => {
        if (typeof d === 'string') return d;
        if (d && d.title) return d.description ? `${d.title}: ${d.description}` : d.title;
        return String(d);
      })
      .filter(Boolean);
  }

  /* ── Save ── */
  async function handleSave() {
    setSaveError(null);
    setSaving(true);
    try {
      await api.updateCV({
        headline: cv.headline,
        summary: cv.summary,
        location: cv.location,
        phone: cv.phone,
        available_worldwide: cv.availableWorldwide,
        open_to_work: cv.openToOffers,
        experience: cv.experience,
        education: cv.education,
        certifications: cv.certifications,
        skills: cv.skillGroups,
        differentiators: cv.differentiators,
        languages: cv.languages,
        visibility: cv.visibility,
      });
      setEditMode(false);
    } catch (e) {
      console.error('Error saving CV:', e);
      setSaveError('Error al guardar. Intenta de nuevo.');
    }
    setSaving(false);
  }

  /* ── Upload ── */
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploadMsg('Analizando tu CV…');
    try {
      const res = await api.uploadCV(file);
      if (res.success === false && !res.draft) {
        setUploadMsg(res.message || 'No se pudo extraer texto del archivo.');
        setTimeout(() => setUploadMsg(''), 4000);
        return;
      }
      const source = res.profile || res.draft;
      if (source) {
        hydrateCV(source);
        setUploadMsg(res.message || 'CV analizado. Revisa y ajusta los campos.');
        setEditMode(true);
        setTimeout(() => setUploadMsg(''), 4000);
      }
    } catch (err: any) {
      setUploadMsg(err.message || 'Error al procesar el archivo');
      setTimeout(() => setUploadMsg(''), 4000);
    }
  }

  /* ── PDF Download ── */
  function handleDownloadPDF() {
    window.print();
  }

  /* ── Share ── */
  function handleShare() {
    const url = `${window.location.origin}/cv/${user?.username || user?.id || ''}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setUploadMsg('Enlace copiado al portapapeles');
        setTimeout(() => setUploadMsg(''), 3000);
      })
      .catch(() => {
        prompt('Copia este enlace:', url);
      });
  }

  /* ── Helpers for editing ── */
  function updateField<K extends keyof CVData>(field: K, value: CVData[K]) {
    setCv((prev) => ({ ...prev, [field]: value }));
  }

  function addExperience() {
    updateField('experience', [
      ...cv.experience,
      {
        id: genId(),
        company: '',
        title: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
      },
    ]);
  }

  function removeExperience(id: string) {
    updateField(
      'experience',
      cv.experience.filter((e) => e.id !== id)
    );
  }

  function updateExperience(id: string, field: keyof Experience, value: any) {
    updateField(
      'experience',
      cv.experience.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  }

  function addEducation() {
    updateField('education', [
      ...cv.education,
      {
        id: genId(),
        institution: '',
        degree: '',
        field: '',
        startYear: '',
        endYear: '',
        description: '',
      },
    ]);
  }

  function removeEducation(id: string) {
    updateField(
      'education',
      cv.education.filter((e) => e.id !== id)
    );
  }

  function updateEducation(id: string, field: keyof Education, value: any) {
    updateField(
      'education',
      cv.education.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  }

  function addCertification() {
    updateField('certifications', [
      ...cv.certifications,
      { id: genId(), name: '', issuer: '', date: '', url: '' },
    ]);
  }

  function removeCertification(id: string) {
    updateField(
      'certifications',
      cv.certifications.filter((c) => c.id !== id)
    );
  }

  function updateCertification(id: string, field: keyof Certification, value: string) {
    updateField(
      'certifications',
      cv.certifications.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  }

  function addSkillGroup() {
    updateField('skillGroups', [...cv.skillGroups, { category: '', skills: [] }]);
  }

  function removeSkillGroup(idx: number) {
    updateField(
      'skillGroups',
      cv.skillGroups.filter((_, i) => i !== idx)
    );
  }

  function addSkillToGroup(groupIdx: number) {
    const groups = [...cv.skillGroups];
    groups[groupIdx] = {
      ...groups[groupIdx],
      skills: [...groups[groupIdx].skills, { name: '', level: 70 }],
    };
    updateField('skillGroups', groups);
  }

  function removeSkillFromGroup(groupIdx: number, skillIdx: number) {
    const groups = [...cv.skillGroups];
    groups[groupIdx] = {
      ...groups[groupIdx],
      skills: groups[groupIdx].skills.filter((_, i) => i !== skillIdx),
    };
    updateField('skillGroups', groups);
  }

  function updateSkillInGroup(groupIdx: number, skillIdx: number, field: string, value: any) {
    const groups = [...cv.skillGroups];
    const skills = [...groups[groupIdx].skills];
    skills[skillIdx] = { ...skills[skillIdx], [field]: value };
    groups[groupIdx] = { ...groups[groupIdx], skills };
    updateField('skillGroups', groups);
  }

  function updateSkillGroupCategory(groupIdx: number, value: string) {
    const groups = [...cv.skillGroups];
    groups[groupIdx] = { ...groups[groupIdx], category: value };
    updateField('skillGroups', groups);
  }

  function addLanguage() {
    updateField('languages', [...cv.languages, { name: '', level: 'Intermedio' }]);
  }

  function removeLanguage(idx: number) {
    updateField(
      'languages',
      cv.languages.filter((_, i) => i !== idx)
    );
  }

  function updateLanguage(idx: number, field: 'name' | 'level', value: string) {
    const langs = [...cv.languages];
    langs[idx] = { ...langs[idx], [field]: value };
    updateField('languages', langs);
  }

  function addDifferentiator() {
    updateField('differentiators', [...cv.differentiators, '']);
  }

  function removeDifferentiator(idx: number) {
    updateField(
      'differentiators',
      cv.differentiators.filter((_, i) => i !== idx)
    );
  }

  function updateDifferentiator(idx: number, value: string) {
    const items = [...cv.differentiators];
    items[idx] = value;
    updateField('differentiators', items);
  }

  /* ── Completitud real ── */
  function isSectionComplete(id: SectionId): boolean {
    switch (id) {
      case 'sobre':
        return cv.summary.trim().length > 30;
      case 'educacion':
        return cv.education.length > 0;
      case 'experiencia':
        return cv.experience.length > 0;
      case 'certificaciones':
        return cv.certifications.length > 0;
      case 'habilidades':
        return cv.skillGroups.length > 0 && cv.skillGroups.some((g) => g.skills.length > 0);
      case 'idiomas':
        return cv.languages.length > 0;
      case 'diferenciadores':
        return cv.differentiators.filter((d) => d.trim()).length > 0;
      default:
        return false;
    }
  }

  const completedCount = SECTIONS.filter((s) => isSectionComplete(s.id)).length;
  const basicsComplete =
    cv.headline.trim().length > 0 &&
    (cv.email || '').trim().length > 0 &&
    cv.location.trim().length > 0;
  const totalPoints = SECTIONS.length + 1; // +1 por datos básicos
  const completeness = Math.round(
    ((completedCount + (basicsComplete ? 1 : 0)) / totalPoints) * 100
  );

  const displayName =
    (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username) ||
    'Profesional';
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  /* Tip dinámico según estado */
  const firstIncomplete = SECTIONS.find((s) => !isSectionComplete(s.id));
  const tipLabel = firstIncomplete
    ? `Completa ${firstIncomplete.label.toLowerCase()}`
    : '¡Perfil completo!';
  const tipDesc = firstIncomplete
    ? `Agregarlo sube tu completitud y mejora el match con ofertas laborales.`
    : 'Tu CV está completo. Revisa las ofertas que matchean con tu perfil en la sección Empleo.';

  /* Scroll a sección al cambiar activeSection */
  useEffect(() => {
    const el = document.getElementById(`cv-${activeSection}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeSection]);

  if (loading) {
    return (
      <div className={cvStyles.cvRoot}>
        <div className={cvStyles.topBar}>
          <div className={cvStyles.breadcrumb}>
            <span>Empleo</span>
            <span>/</span>
            <span className={cvStyles.current}>Cargando CV…</span>
          </div>
        </div>
        <div className={cvStyles.cvStage}>
          <div
            className={cvStyles.cvPaper}
            style={{ padding: 60, textAlign: 'center', color: '#696c6f' }}
          >
            Cargando tu CV…
          </div>
        </div>
      </div>
    );
  }

  /* Agrupa secciones por group */
  const groupedSections: Record<string, (typeof SECTIONS)[number][]> = {};
  SECTIONS.forEach((s) => {
    if (!groupedSections[s.group]) groupedSections[s.group] = [];
    groupedSections[s.group].push(s);
  });

  return (
    <div className={cvStyles.cvRoot}>
      {/* ── Top bar ── */}
      <div className={cvStyles.topBar}>
        <div className={cvStyles.breadcrumb}>
          <span>Empleo</span>
          <span>/</span>
          <span className={cvStyles.current}>
            {isPublicView ? `CV de ${displayName}` : 'Mi CV Conniku'}
          </span>
        </div>

        <div className={cvStyles.topRight}>
          {isOwnProfile && (
            <div className={cvStyles.completeness}>
              <span>Completitud</span>
              <div className={cvStyles.complBar}>
                <div className={cvStyles.complFill} style={{ width: `${completeness}%` }} />
              </div>
              <span className={cvStyles.complPct}>{completeness}%</span>
            </div>
          )}

          {uploadMsg && (
            <span className={`${cvStyles.topAlert} ${cvStyles.success}`}>{uploadMsg}</span>
          )}
          {saveError && (
            <span className={`${cvStyles.topAlert} ${cvStyles.error}`}>{saveError}</span>
          )}

          {isOwnProfile && !editMode && (
            <>
              <button
                className={cvStyles.topBtn}
                onClick={() => fileRef.current?.click()}
                type="button"
              >
                {Upload({ size: 14 })} Subir CV
              </button>
              <button className={cvStyles.topBtn} onClick={handleDownloadPDF} type="button">
                {Download({ size: 14 })} PDF
              </button>
              <button className={cvStyles.topBtn} onClick={handleShare} type="button">
                {Share2({ size: 14 })} Compartir
              </button>
              <button
                className={`${cvStyles.topBtn} ${cvStyles.primary}`}
                onClick={() => setEditMode(true)}
                type="button"
              >
                {Pencil({ size: 14 })} Editar
                <span className="ring">→</span>
              </button>
            </>
          )}

          {isOwnProfile && editMode && (
            <>
              <button
                className={cvStyles.topBtn}
                onClick={() => {
                  setEditMode(false);
                  loadCV();
                }}
                type="button"
              >
                <X size={14} /> Cancelar
              </button>
              <button
                className={`${cvStyles.topBtn} ${cvStyles.primary}`}
                onClick={handleSave}
                disabled={saving}
                type="button"
              >
                <Save size={14} /> {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* ── Shell 3 col ── */}
      <div className={cvStyles.shell}>
        {/* Left nav */}
        <aside className={cvStyles.leftNav}>
          {Object.entries(groupedSections).map(([groupName, items]) => (
            <React.Fragment key={groupName}>
              <div className={cvStyles.sectionHeader}>{groupName}</div>
              {items.map((s) => {
                const complete = isSectionComplete(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`${cvStyles.secItem} ${activeSection === s.id ? cvStyles.active : ''} ${complete ? cvStyles.complete : ''}`}
                    type="button"
                  >
                    <span className={cvStyles.secNum}>{complete ? '✓' : '○'}</span>
                    {s.label}
                    <span className={cvStyles.secCount}>
                      {s.id === 'experiencia' && cv.experience.length}
                      {s.id === 'educacion' && cv.education.length}
                      {s.id === 'certificaciones' && cv.certifications.length}
                      {s.id === 'idiomas' && cv.languages.length}
                      {s.id === 'habilidades' &&
                        cv.skillGroups.reduce((a, g) => a + g.skills.length, 0)}
                      {s.id === 'diferenciadores' &&
                        cv.differentiators.filter((d) => d.trim()).length}
                    </span>
                  </button>
                );
              })}
            </React.Fragment>
          ))}

          {isOwnProfile && (
            <div className={cvStyles.tipBox}>
              <div className={cvStyles.tipLabel}>Tip del asistente</div>
              <h4>{tipLabel}</h4>
              <p>{tipDesc}</p>
            </div>
          )}
        </aside>

        {/* Center cv paper */}
        <main className={cvStyles.cvStage}>
          {editMode && (
            <div
              className={cvStyles.uploadZone}
              onClick={() => fileRef.current?.click()}
              style={{ maxWidth: 820, margin: '0 auto 20px' }}
            >
              {Upload({ size: 16 })} Sube un PDF/DOCX existente y lo rellenamos automáticamente
            </div>
          )}

          {cv.visibility === 'private' && isOwnProfile && (
            <div
              className={cvStyles.visibilityBanner}
              style={{ maxWidth: 820, margin: '0 auto 18px' }}
            >
              <strong>🔒 CV privado</strong>
              <span>Solo tú puedes verlo. Cambia a público para aparecer en ofertas.</span>
            </div>
          )}

          <div className={cvStyles.cvPaper}>
            {/* Header */}
            <header className={cvStyles.cvHeader}>
              <div>
                <h1 className={cvStyles.cvName}>{displayName}</h1>
                {editMode ? (
                  <input
                    className={cvStyles.inlineInput}
                    value={cv.headline}
                    onChange={(e) => updateField('headline', e.target.value)}
                    placeholder="Tu título profesional"
                    style={{ fontSize: 12, marginTop: 8 }}
                  />
                ) : (
                  cv.headline && <div className={cvStyles.cvTitle}>{cv.headline}</div>
                )}
                <div className={cvStyles.cvMeta}>
                  {editMode ? (
                    <>
                      <input
                        className={cvStyles.inlineInput}
                        value={cv.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="email"
                      />
                      <input
                        className={cvStyles.inlineInput}
                        value={cv.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder="teléfono"
                      />
                      <input
                        className={cvStyles.inlineInput}
                        value={cv.location}
                        onChange={(e) => updateField('location', e.target.value)}
                        placeholder="ciudad"
                      />
                    </>
                  ) : (
                    <>
                      {cv.email && <span>{cv.email}</span>}
                      {cv.phone && <span>{cv.phone}</span>}
                      {cv.location && <span>{cv.location}</span>}
                      {user?.username && <span>conniku.com/cv/{user.username}</span>}
                    </>
                  )}
                </div>
              </div>
              <div className={cvStyles.cvPhoto}>
                {(user as any)?.avatar ? <img src={(user as any).avatar} alt="" /> : initials}
              </div>
            </header>

            {/* Badges (solo si hay datos) */}
            {(cv.openToOffers ||
              cv.availableWorldwide ||
              cv.certifications.length > 0 ||
              completedCount >= 4) && (
              <div className={cvStyles.cvBadges}>
                {cv.openToOffers && (
                  <span className={`${cvStyles.cvBadge} ${cvStyles.lime}`}>
                    ★ Abierto a ofertas
                  </span>
                )}
                {cv.availableWorldwide && (
                  <span className={`${cvStyles.cvBadge} ${cvStyles.cream}`}>🌎 Remoto global</span>
                )}
                {cv.certifications.length > 0 && (
                  <span className={`${cvStyles.cvBadge} ${cvStyles.ghost}`}>
                    {cv.certifications.length} certificaci
                    {cv.certifications.length !== 1 ? 'ones' : 'ón'}
                  </span>
                )}
                {completedCount >= 4 && (
                  <span className={`${cvStyles.cvBadge} ${cvStyles.ghost}`}>
                    Perfil {completeness}% completo
                  </span>
                )}
              </div>
            )}

            {/* Body */}
            <div className={cvStyles.cvBody}>
              {/* Resumen */}
              <section id="cv-sobre" className={cvStyles.cvSection}>
                <div className={cvStyles.cvSecHead}>
                  <h3>Resumen profesional</h3>
                </div>
                {editMode ? (
                  <textarea
                    className={cvStyles.inlineTextarea}
                    value={cv.summary}
                    onChange={(e) => updateField('summary', e.target.value)}
                    placeholder="Describe tu perfil en 2-4 líneas: qué estudias, tu enfoque, qué buscas."
                  />
                ) : (
                  <p className={cvStyles.cvSummary}>
                    {cv.summary || (
                      <em style={{ color: '#696c6f' }}>Aún no has agregado tu resumen.</em>
                    )}
                  </p>
                )}
              </section>

              {/* Educación */}
              <section id="cv-educacion" className={cvStyles.cvSection}>
                <div className={cvStyles.cvSecHead}>
                  <h3>Educación</h3>
                  {editMode ? (
                    <button className={cvStyles.addBtn} onClick={addEducation} type="button">
                      {Plus({ size: 12 })} Agregar
                    </button>
                  ) : (
                    <div className={cvStyles.cvSecMeta}>
                      {cv.education.length} entrada{cv.education.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                {cv.education.length === 0 && !editMode ? (
                  <div className={cvStyles.sectionEmpty}>Sin entradas de educación.</div>
                ) : (
                  cv.education.map((edu) => (
                    <div key={edu.id} className={cvStyles.cvEntry}>
                      <div className={cvStyles.cvEntryTop}>
                        {editMode ? (
                          <input
                            className={cvStyles.inlineInput}
                            value={edu.degree}
                            onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                            placeholder="Título / carrera"
                          />
                        ) : (
                          <div className={cvStyles.cvEntryTitle}>
                            {edu.degree} {edu.field ? `· ${edu.field}` : ''}
                          </div>
                        )}
                        {editMode ? (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input
                              className={cvStyles.inlineInput}
                              value={edu.startYear}
                              onChange={(e) => updateEducation(edu.id, 'startYear', e.target.value)}
                              placeholder="inicio"
                              style={{ width: 80 }}
                            />
                            <span>—</span>
                            <input
                              className={cvStyles.inlineInput}
                              value={edu.endYear}
                              onChange={(e) => updateEducation(edu.id, 'endYear', e.target.value)}
                              placeholder="fin"
                              style={{ width: 80 }}
                            />
                            <button
                              className={cvStyles.removeBtn}
                              onClick={() => removeEducation(edu.id)}
                              type="button"
                            >
                              {Trash2({ size: 10 })}
                            </button>
                          </div>
                        ) : (
                          <div className={cvStyles.cvEntryDate}>
                            {edu.startYear} {edu.endYear ? `— ${edu.endYear}` : '· cursando'}
                          </div>
                        )}
                      </div>
                      {editMode ? (
                        <input
                          className={cvStyles.inlineInput}
                          value={edu.institution}
                          onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                          placeholder="Institución"
                          style={{ marginTop: 4 }}
                        />
                      ) : (
                        <div className={cvStyles.cvEntryOrg}>{edu.institution}</div>
                      )}
                      {editMode ? (
                        <textarea
                          className={cvStyles.inlineTextarea}
                          value={edu.description}
                          onChange={(e) => updateEducation(edu.id, 'description', e.target.value)}
                          placeholder="Logros, proyectos destacados, promedio (opcional)"
                          style={{ marginTop: 6 }}
                        />
                      ) : (
                        edu.description && (
                          <div className={cvStyles.cvEntryBody}>{edu.description}</div>
                        )
                      )}
                    </div>
                  ))
                )}
              </section>

              {/* Experiencia */}
              <section id="cv-experiencia" className={cvStyles.cvSection}>
                <div className={cvStyles.cvSecHead}>
                  <h3>Experiencia</h3>
                  {editMode ? (
                    <button className={cvStyles.addBtn} onClick={addExperience} type="button">
                      {Plus({ size: 12 })} Agregar
                    </button>
                  ) : (
                    <div className={cvStyles.cvSecMeta}>
                      {cv.experience.length} entrada{cv.experience.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                {cv.experience.length === 0 && !editMode ? (
                  <div className={cvStyles.sectionEmpty}>
                    Sin experiencia profesional. Agrega prácticas, pasantías o voluntariados.
                  </div>
                ) : (
                  cv.experience.map((exp) => (
                    <div key={exp.id} className={cvStyles.cvEntry}>
                      <div className={cvStyles.cvEntryTop}>
                        {editMode ? (
                          <input
                            className={cvStyles.inlineInput}
                            value={exp.title}
                            onChange={(e) => updateExperience(exp.id, 'title', e.target.value)}
                            placeholder="Cargo"
                          />
                        ) : (
                          <div className={cvStyles.cvEntryTitle}>{exp.title}</div>
                        )}
                        {editMode ? (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input
                              className={cvStyles.inlineInput}
                              value={exp.startDate}
                              onChange={(e) =>
                                updateExperience(exp.id, 'startDate', e.target.value)
                              }
                              placeholder="inicio"
                              style={{ width: 80 }}
                            />
                            <span>—</span>
                            {exp.current ? (
                              <span style={{ fontSize: 11 }}>actual</span>
                            ) : (
                              <input
                                className={cvStyles.inlineInput}
                                value={exp.endDate}
                                onChange={(e) =>
                                  updateExperience(exp.id, 'endDate', e.target.value)
                                }
                                placeholder="fin"
                                style={{ width: 80 }}
                              />
                            )}
                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 11,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={exp.current}
                                onChange={(e) =>
                                  updateExperience(exp.id, 'current', e.target.checked)
                                }
                              />
                              Actual
                            </label>
                            <button
                              className={cvStyles.removeBtn}
                              onClick={() => removeExperience(exp.id)}
                              type="button"
                            >
                              {Trash2({ size: 10 })}
                            </button>
                          </div>
                        ) : (
                          <div className={cvStyles.cvEntryDate}>
                            {exp.startDate} — {exp.current ? 'actual' : exp.endDate || 'sin fecha'}
                          </div>
                        )}
                      </div>
                      {editMode ? (
                        <input
                          className={cvStyles.inlineInput}
                          value={exp.company}
                          onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                          placeholder="Empresa"
                          style={{ marginTop: 4 }}
                        />
                      ) : (
                        <div className={cvStyles.cvEntryOrg}>
                          {exp.company} {exp.location ? `· ${exp.location}` : ''}
                        </div>
                      )}
                      {editMode ? (
                        <textarea
                          className={cvStyles.inlineTextarea}
                          value={exp.description}
                          onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                          placeholder="Qué hiciste, qué logros (usa bullets con • al inicio de línea)"
                          style={{ marginTop: 6 }}
                        />
                      ) : (
                        exp.description && (
                          <div className={cvStyles.cvEntryBody}>{exp.description}</div>
                        )
                      )}
                    </div>
                  ))
                )}
              </section>

              {/* Certificaciones */}
              <section id="cv-certificaciones" className={cvStyles.cvSection}>
                <div className={cvStyles.cvSecHead}>
                  <h3>Certificaciones</h3>
                  {editMode ? (
                    <button className={cvStyles.addBtn} onClick={addCertification} type="button">
                      {Plus({ size: 12 })} Agregar
                    </button>
                  ) : (
                    <div className={cvStyles.cvSecMeta}>
                      {cv.certifications.length} entrada
                      {cv.certifications.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                {cv.certifications.length === 0 && !editMode ? (
                  <div className={cvStyles.sectionEmpty}>Sin certificaciones.</div>
                ) : (
                  cv.certifications.map((cert) => (
                    <div key={cert.id} className={cvStyles.cvEntry}>
                      <div className={cvStyles.cvEntryTop}>
                        {editMode ? (
                          <input
                            className={cvStyles.inlineInput}
                            value={cert.name}
                            onChange={(e) => updateCertification(cert.id, 'name', e.target.value)}
                            placeholder="Nombre certificación"
                          />
                        ) : (
                          <div className={cvStyles.cvEntryTitle}>{cert.name}</div>
                        )}
                        {editMode ? (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input
                              className={cvStyles.inlineInput}
                              value={cert.date}
                              onChange={(e) => updateCertification(cert.id, 'date', e.target.value)}
                              placeholder="fecha"
                              style={{ width: 100 }}
                            />
                            <button
                              className={cvStyles.removeBtn}
                              onClick={() => removeCertification(cert.id)}
                              type="button"
                            >
                              {Trash2({ size: 10 })}
                            </button>
                          </div>
                        ) : (
                          <div className={cvStyles.cvEntryDate}>{cert.date}</div>
                        )}
                      </div>
                      {editMode ? (
                        <input
                          className={cvStyles.inlineInput}
                          value={cert.issuer}
                          onChange={(e) => updateCertification(cert.id, 'issuer', e.target.value)}
                          placeholder="Emisor"
                          style={{ marginTop: 4 }}
                        />
                      ) : (
                        <div className={cvStyles.cvEntryOrg}>{cert.issuer}</div>
                      )}
                    </div>
                  ))
                )}
              </section>

              {/* Habilidades */}
              <section id="cv-habilidades" className={cvStyles.cvSection}>
                <div className={cvStyles.cvSecHead}>
                  <h3>Habilidades</h3>
                  {editMode && (
                    <button className={cvStyles.addBtn} onClick={addSkillGroup} type="button">
                      {Plus({ size: 12 })} Grupo
                    </button>
                  )}
                </div>
                {cv.skillGroups.length === 0 && !editMode ? (
                  <div className={cvStyles.sectionEmpty}>Sin habilidades agregadas.</div>
                ) : (
                  <div className={cvStyles.cvGridRow}>
                    {cv.skillGroups.map((group, gIdx) => (
                      <div key={gIdx}>
                        {editMode ? (
                          <div
                            style={{
                              display: 'flex',
                              gap: 8,
                              alignItems: 'center',
                              marginBottom: 10,
                            }}
                          >
                            <input
                              className={cvStyles.inlineInput}
                              value={group.category}
                              onChange={(e) => updateSkillGroupCategory(gIdx, e.target.value)}
                              placeholder="Categoría"
                              style={{ fontSize: 11, textTransform: 'uppercase' }}
                            />
                            <button
                              className={cvStyles.removeBtn}
                              onClick={() => removeSkillGroup(gIdx)}
                              type="button"
                            >
                              {Trash2({ size: 10 })}
                            </button>
                          </div>
                        ) : (
                          <div className={cvStyles.skillCategoryLabel}>{group.category}</div>
                        )}
                        <div className={cvStyles.skillChipGroup}>
                          {group.skills.map((skill, sIdx) => (
                            <div
                              key={sIdx}
                              className={`${cvStyles.skillChip} ${skill.level >= 75 ? cvStyles.hl : ''}`}
                            >
                              {editMode ? (
                                <input
                                  value={skill.name}
                                  onChange={(e) =>
                                    updateSkillInGroup(gIdx, sIdx, 'name', e.target.value)
                                  }
                                  placeholder="skill"
                                  style={{
                                    border: 0,
                                    background: 'transparent',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    outline: 'none',
                                    width: 80,
                                  }}
                                />
                              ) : (
                                skill.name
                              )}
                              {editMode ? (
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={skill.level}
                                  onChange={(e) =>
                                    updateSkillInGroup(
                                      gIdx,
                                      sIdx,
                                      'level',
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  style={{
                                    border: 0,
                                    background: 'transparent',
                                    fontSize: 10,
                                    width: 36,
                                    outline: 'none',
                                  }}
                                />
                              ) : (
                                <span className={cvStyles.skillLevel}>
                                  {'★'.repeat(Math.ceil(skill.level / 20))}
                                </span>
                              )}
                              {editMode && (
                                <button
                                  onClick={() => removeSkillFromGroup(gIdx, sIdx)}
                                  style={{
                                    border: 0,
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    color: '#ff4d3a',
                                    padding: 0,
                                    marginLeft: 2,
                                  }}
                                  type="button"
                                  aria-label="Quitar"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                          {editMode && (
                            <button
                              className={cvStyles.skillChip}
                              onClick={() => addSkillToGroup(gIdx)}
                              style={{ cursor: 'pointer', color: '#696c6f' }}
                              type="button"
                            >
                              + Skill
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Idiomas */}
              <section id="cv-idiomas" className={cvStyles.cvSection}>
                <div className={cvStyles.cvSecHead}>
                  <h3>Idiomas</h3>
                  {editMode && (
                    <button className={cvStyles.addBtn} onClick={addLanguage} type="button">
                      {Plus({ size: 12 })} Agregar
                    </button>
                  )}
                </div>
                {cv.languages.length === 0 && !editMode ? (
                  <div className={cvStyles.sectionEmpty}>Sin idiomas agregados.</div>
                ) : (
                  <div className={cvStyles.cvLangRow}>
                    {cv.languages.map((lang, idx) => (
                      <div key={idx} className={cvStyles.cvLang}>
                        <div className={cvStyles.cvLangCode}>
                          {(lang.name || '—').slice(0, 2).toUpperCase()}
                        </div>
                        {editMode ? (
                          <>
                            <input
                              className={cvStyles.inlineInput}
                              value={lang.name}
                              onChange={(e) => updateLanguage(idx, 'name', e.target.value)}
                              placeholder="Idioma"
                              style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}
                            />
                            <select
                              className={cvStyles.inlineInput}
                              value={lang.level}
                              onChange={(e) => updateLanguage(idx, 'level', e.target.value)}
                              style={{ fontSize: 11, marginTop: 4 }}
                            >
                              {LANG_LEVELS.map((lv) => (
                                <option key={lv} value={lv}>
                                  {lv}
                                </option>
                              ))}
                            </select>
                            <button
                              className={cvStyles.removeBtn}
                              onClick={() => removeLanguage(idx)}
                              type="button"
                              style={{ marginTop: 6 }}
                            >
                              {Trash2({ size: 10 })}
                            </button>
                          </>
                        ) : (
                          <>
                            <div className={cvStyles.cvLangName}>{lang.name}</div>
                            <div className={cvStyles.cvLangLevel}>{lang.level}</div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Diferenciadores */}
              <section id="cv-diferenciadores" className={cvStyles.cvSection}>
                <div className={cvStyles.cvSecHead}>
                  <h3>Lo que me diferencia</h3>
                  {editMode && (
                    <button className={cvStyles.addBtn} onClick={addDifferentiator} type="button">
                      {Plus({ size: 12 })} Agregar
                    </button>
                  )}
                </div>
                {cv.differentiators.filter((d) => d.trim()).length === 0 && !editMode ? (
                  <div className={cvStyles.sectionEmpty}>Sin diferenciadores agregados.</div>
                ) : (
                  <div className={cvStyles.diffList}>
                    {cv.differentiators.map((d, idx) => (
                      <div key={idx} className={cvStyles.diffItem}>
                        {editMode ? (
                          <div
                            style={{
                              display: 'flex',
                              gap: 8,
                              alignItems: 'center',
                            }}
                          >
                            <input
                              className={cvStyles.inlineInput}
                              value={d}
                              onChange={(e) => updateDifferentiator(idx, e.target.value)}
                              placeholder="Qué te hace único"
                            />
                            <button
                              className={cvStyles.removeBtn}
                              onClick={() => removeDifferentiator(idx)}
                              type="button"
                            >
                              {Trash2({ size: 10 })}
                            </button>
                          </div>
                        ) : (
                          d
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Footer */}
            <div className={cvStyles.cvFooterVerify}>
              <span>
                CV Conniku · <strong>Hash SHA-256 al guardar</strong>
              </span>
              <span>
                {user?.username ? `conniku.com/cv/${user.username} · ` : ''}
                <strong>{completeness}% completo</strong>
              </span>
            </div>
          </div>
        </main>

        {/* Right aside */}
        <aside className={cvStyles.rightAside}>
          <div className={cvStyles.assistantBox}>
            <h3>
              <span className={cvStyles.assIco}>C</span> Sugerencias
            </h3>
            <div className="sub">Basadas en tu CV</div>

            {firstIncomplete && (
              <div className={cvStyles.assistSuggestion}>
                <div className={cvStyles.asLabel}>★ Falta</div>
                <div className={cvStyles.asText}>
                  Agrega <strong>{firstIncomplete.label.toLowerCase()}</strong> para subir tu
                  completitud.
                </div>
              </div>
            )}

            {cv.summary && cv.summary.length < 80 && (
              <div className={cvStyles.assistSuggestion}>
                <div className={cvStyles.asLabel}>★ Mejora</div>
                <div className={cvStyles.asText}>
                  Tu <strong>resumen profesional</strong> es corto. Agrega detalles sobre tu
                  enfoque, herramientas y qué buscas.
                </div>
              </div>
            )}

            {completedCount === SECTIONS.length && (
              <div className={cvStyles.assistSuggestion}>
                <div className={cvStyles.asLabel}>✓ Completo</div>
                <div className={cvStyles.asText}>
                  Tu CV está <strong>100% completo</strong>. Revisa las ofertas que matchean.
                </div>
              </div>
            )}
          </div>

          <div className={cvStyles.matchesBox}>
            <div className={cvStyles.matchesHead}>Siguiente paso</div>
            <button
              className={cvStyles.matchesCTA}
              onClick={() => onNavigate('/jobs')}
              type="button"
            >
              <h4>Explora ofertas laborales</h4>
              <p>
                {completeness >= 70
                  ? `Tu CV está ${completeness}% listo. Mira ofertas que matchean con tu perfil.`
                  : `Completa más secciones para mejorar tu match con ofertas.`}
              </p>
              <span className={cvStyles.matchesCTAArrow}>
                Ver ofertas <ChevronRight size={12} />
              </span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
