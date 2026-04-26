/**
 * Start.tsx
 *
 * Traducción de ORBIT-U/index.html (vanilla HTML/CSS/JS, 734 líneas) a un
 * componente React funcional. Mantiene literal el contenido del original:
 * canvas hex, animación de reveal, planetas orbitando, modales de login y
 * registro. No agrega contenido nuevo — solo se reorganiza para React.
 *
 * Backend pendiente: handleLogin/handleRegistro disparan alert provisorio.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../services/i18n';
import {
  AGE_DECLARATION_TEXT_HASH,
  CANONICAL_DOC_HASHES,
  LEGAL_DOC_KEYS,
  type LegalDocKey,
} from '../services/legalConstants';
import styles from './Start.module.css';

type ModalKind = null | 'entrar' | 'crear' | 'student' | 'tutor' | 'general' | 'business';
type OnboardStep = null | 'language' | 'role';

const LANGUAGES = [
  {
    code: 'es',
    label: 'Español',
    sub: 'Latinoamérica',
    flags: ['🇲🇽', '🇦🇷', '🇨🇱', '🇨🇴', '🇵🇪', '🇻🇪'],
  },
  { code: 'en', label: 'English', sub: 'United Kingdom', flags: ['🇬🇧'] },
  { code: 'pt', label: 'Português', sub: 'Brasil · Portugal', flags: ['🇧🇷', '🇵🇹'] },
  { code: 'it', label: 'Italiano', sub: 'Italia', flags: ['🇮🇹'] },
  { code: 'fr', label: 'Français', sub: 'France', flags: ['🇫🇷'] },
  { code: 'de', label: 'Deutsch', sub: 'Deutschland', flags: ['🇩🇪'] },
];

const ROLE_DEFS = [
  {
    code: 'student',
    labelKey: 'start.roles.student_label',
    icon: '🎓',
    subKey: 'start.roles.student_sub',
    accent: '#00c27a',
  },
  {
    code: 'tutor',
    labelKey: 'start.roles.tutor_label',
    icon: '📚',
    subKey: 'start.roles.tutor_sub',
    accent: '#4a88ff',
  },
  {
    code: 'general',
    labelKey: 'start.roles.general_label',
    icon: '💬',
    subKey: 'start.roles.general_sub',
    accent: '#a855f7',
  },
  {
    code: 'business',
    labelKey: 'start.roles.business_label',
    icon: '◈',
    subKey: 'start.roles.business_sub',
    accent: '#f59e0b',
  },
];

const RADII = [85, 140, 195, 250, 305];
const ARM_IDS = ['arm-conniku', 'arm-tutores', 'arm-empleos', 'arm-entrar', 'arm-crear'];

const PCONF = [
  { armId: 'arm-conniku', visId: 'vis-conniku', btnKey: 'pb-conniku', target: 0, triggerAt: 1000 },
  { armId: 'arm-entrar', visId: 'vis-entrar', btnKey: 'pb-entrar', target: 180, triggerAt: 2200 },
  { armId: 'arm-crear', visId: 'vis-crear', btnKey: 'pb-crear', target: 180, triggerAt: 3400 },
];

export default function Start() {
  const navigate = useNavigate();
  const { t, setLang, lang } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line no-undef
  const tickSvgRef = useRef<SVGSVGElement | null>(null);
  const engineWrapRef = useRef<HTMLDivElement>(null);
  const panelARef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);

  const [revealed, setRevealed] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [modal, setModal] = useState<ModalKind>(null);
  const [visibleBtns, setVisibleBtns] = useState<Record<string, boolean>>({});
  const [landingVis, setLandingVis] = useState<Record<string, boolean>>({});
  const [hiddenVis, setHiddenVis] = useState<Record<string, boolean>>({});
  const [onboarding, setOnboarding] = useState<OnboardStep>(null);
  const [onboardClosing, setOnboardClosing] = useState(false);

  // Role-specific form state
  const [rfNombre, setRfNombre] = useState('');
  const [rfApellido, setRfApellido] = useState('');
  const [rfEmail, setRfEmail] = useState('');
  const [rfPass, setRfPass] = useState('');
  const [rfUniv, setRfUniv] = useState('');
  const [rfMaterias, setRfMaterias] = useState('');
  const [rfBio, setRfBio] = useState('');
  const [rfObjetivo, setRfObjetivo] = useState('');
  const [rfEmpresa, setRfEmpresa] = useState('');
  const [rfCargo, setRfCargo] = useState('');
  const [rfBizTab, setRfBizTab] = useState<'login' | 'contact'>('login');
  const [rfSending, setRfSending] = useState(false);
  const [rfSent, setRfSent] = useState(false);
  const [rfError, setRfError] = useState('');
  // Legal consent wizard state
  const [legalSessionToken, setLegalSessionToken] = useState('');
  const [legalViewed, setLegalViewed] = useState<Partial<Record<LegalDocKey, boolean>>>({});
  const [legalLoading, setLegalLoading] = useState<Partial<Record<LegalDocKey, boolean>>>({});
  const [legalDone, setLegalDone] = useState(false);
  // Registration extra fields
  const [rfBirthDate, setRfBirthDate] = useState('');
  const [rfTosAccepted, setRfTosAccepted] = useState(false);
  const [rfAgeAccepted, setRfAgeAccepted] = useState(false);

  function resetRoleForm() {
    setRfNombre('');
    setRfApellido('');
    setRfEmail('');
    setRfPass('');
    setRfUniv('');
    setRfMaterias('');
    setRfBio('');
    setRfObjetivo('');
    setRfEmpresa('');
    setRfCargo('');
    setRfBizTab('login');
    setRfSending(false);
    setRfSent(false);
    setRfError('');
    setLegalSessionToken('');
    setLegalViewed({});
    setLegalLoading({});
    setLegalDone(false);
    setRfBirthDate('');
    setRfTosAccepted(false);
    setRfAgeAccepted(false);
  }

  const startedRef = useRef(false);
  const revealedRef = useRef(false);
  const timeoutsRef = useRef<number[]>([]);

  // Tick marks SVG generation (líneas 396-408 del original)
  useEffect(() => {
    const svg = tickSvgRef.current;
    if (!svg) return;
    const cx = 84,
      cy = 84,
      total = 72,
      major = 6,
      oR = 82,
      iMaj = 73,
      iMin = 77;
    for (let i = 0; i < total; i++) {
      const ang = (i / total) * 360 - 90;
      const rad = (ang * Math.PI) / 180;
      const maj = i % major === 0;
      const iR = maj ? iMaj : iMin;
      const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      ln.setAttribute('x1', (cx + oR * Math.cos(rad)).toFixed(2));
      ln.setAttribute('y1', (cy + oR * Math.sin(rad)).toFixed(2));
      ln.setAttribute('x2', (cx + iR * Math.cos(rad)).toFixed(2));
      ln.setAttribute('y2', (cy + iR * Math.sin(rad)).toFixed(2));
      ln.setAttribute('stroke', maj ? 'rgba(168,85,247,.55)' : 'rgba(168,85,247,.20)');
      ln.setAttribute('stroke-width', maj ? '1.5' : '0.8');
      svg.appendChild(ln);
    }
    return () => {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
    };
  }, []);

  // HEX canvas (líneas 410-475 del original)
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    let W = 0,
      H = 0,
      tick = 0;
    let hexes: { cx: number; cy: number; glow: number; cr: number; cg: number; cb: number }[] = [];
    const S = 28;
    const SQ3 = Math.sqrt(3);
    const I = 0.85;
    const PCOLS: number[][] = [
      [0, 194, 122],
      [196, 154, 58],
      [0, 150, 204],
      [107, 78, 255],
      [255, 74, 28],
    ];

    function buildHexes() {
      hexes = [];
      const cols = Math.ceil(W / (S * SQ3)) + 3;
      const rows = Math.ceil(H / (S * 1.5)) + 3;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ox = (r % 2) * S * SQ3 * 0.5;
          hexes.push({
            cx: c * S * SQ3 + ox - S * SQ3,
            cy: r * S * 1.5 - S * 1.5,
            glow: 0,
            cr: 0,
            cg: 194,
            cb: 122,
          });
        }
      }
    }

    function resize() {
      if (!cvs) return;
      W = cvs.width = window.innerWidth;
      H = cvs.height = window.innerHeight;
      buildHexes();
    }

    function getPlanetPos(i: number) {
      if (revealedRef.current) {
        return { x: W / 2, y: i === 0 ? H / 2 - RADII[0] : H / 2 + RADII[i] };
      }
      const arm = document.getElementById(ARM_IDS[i]);
      if (!arm) return { x: W / 2, y: H / 2 };
      const vis = arm.firstElementChild as HTMLElement | null;
      if (!vis) return { x: W / 2, y: H / 2 };
      const r = vis.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }

    function hexPath(cx: number, cy: number, s: number) {
      if (!ctx) return;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 180) * (60 * i - 30);
        if (i === 0) ctx.moveTo(cx + s * Math.cos(a), cy + s * Math.sin(a));
        else ctx.lineTo(cx + s * Math.cos(a), cy + s * Math.sin(a));
      }
      ctx.closePath();
    }

    let rafId = 0;

    function frame() {
      rafId = requestAnimationFrame(frame);
      if (!ctx) return;
      ctx.fillStyle = 'rgba(5,6,8,0.18)';
      ctx.fillRect(0, 0, W, H);
      tick++;
      for (let h = 0; h < hexes.length; h++) {
        const hx = hexes[h];
        hx.glow = Math.max(0, hx.glow - 0.011);
        for (let i = 0; i < 5; i++) {
          const p = getPlanetPos(i);
          const d = Math.hypot(hx.cx - p.x, hx.cy - p.y);
          const rng = S * 4.2;
          const pulse = 1 + Math.sin(tick * 0.03 + i * 0.9) * 0.12;
          if (d < rng) {
            const s = (1 - d / rng) * pulse * 0.9;
            if (s > hx.glow) {
              hx.glow = s;
              hx.cr = PCOLS[i][0];
              hx.cg = PCOLS[i][1];
              hx.cb = PCOLS[i][2];
            }
          }
        }
        hexPath(hx.cx, hx.cy, S * 0.88);
        ctx.fillStyle =
          'rgba(' + hx.cr + ',' + hx.cg + ',' + hx.cb + ',' + hx.glow * 0.06 * I + ')';
        ctx.fill();
        ctx.strokeStyle =
          'rgba(' + hx.cr + ',' + hx.cg + ',' + hx.cb + ',' + (0.032 + hx.glow * 0.2) * I + ')';
        ctx.lineWidth = 0.65;
        ctx.stroke();
        if (hx.glow > 0.18) {
          ctx.beginPath();
          ctx.arc(hx.cx, hx.cy, 0.8 + hx.glow * 1.5, 0, Math.PI * 2);
          ctx.fillStyle =
            'rgba(' + hx.cr + ',' + hx.cg + ',' + hx.cb + ',' + hx.glow * 0.5 * I + ')';
          ctx.fill();
        }
      }
      const cg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 90);
      cg.addColorStop(0, 'rgba(0,194,122,' + (0.08 + Math.sin(tick * 0.025) * 0.025) * I + ')');
      cg.addColorStop(1, 'rgba(0,194,122,0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(245,244,239,0.025)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.moveTo(W / 2, H / 2 - 350);
      ctx.lineTo(W / 2, H / 2 + 350);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    resize();
    window.addEventListener('resize', resize);
    frame();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Cleanup de timeouts del reveal
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((id) => clearTimeout(id));
      timeoutsRef.current = [];
    };
  }, []);

  function getArmAngle(el: HTMLElement) {
    const mat = window.getComputedStyle(el).transform;
    if (!mat || mat === 'none') return 0;
    const m = mat.match(/matrix\(([^)]+)\)/);
    if (!m) return 0;
    const v = m[1].split(',').map(Number);
    return ((((Math.atan2(v[1], v[0]) * 180) / Math.PI) % 360) + 360) % 360;
  }

  function stopArmAt(armEl: HTMLElement, targetDeg: number, dur: number) {
    const cur = getArmAngle(armEl);
    const delta = ((((targetDeg - cur) % 360) + 360) % 360) + 720;
    const final = cur + delta;
    armEl.style.animation = 'none';
    armEl.style.transition = 'none';
    armEl.style.transform = 'rotate(' + cur + 'deg)';
    // reflow
    void armEl.offsetHeight;
    armEl.style.transition = 'transform ' + dur + 'ms cubic-bezier(0.08,1,0.18,1)';
    armEl.style.transform = 'rotate(' + final + 'deg)';
  }

  /**
   * Sincroniza la estela del trail con el arm que se está deteniendo.
   * Usa la misma curva y duración que stopArmAt, así la estela viaja
   * pegada al planeta hasta su posición final.
   */
  function stopTrailAt(trailEl: HTMLElement, targetDeg: number, dur: number) {
    const cur = getArmAngle(trailEl);
    const delta = ((((targetDeg - cur) % 360) + 360) % 360) + 720;
    const final = cur + delta;
    trailEl.style.animation = 'none';
    trailEl.style.transition = 'none';
    trailEl.style.transform = 'rotate(' + cur + 'deg)';
    void trailEl.offsetHeight;
    // Mantenemos transition de transform + opacity (heredada del CSS) en una sola regla.
    trailEl.style.transition =
      'transform ' + dur + 'ms cubic-bezier(0.08,1,0.18,1), opacity 1.2s ease 0.2s';
    trailEl.style.transform = 'rotate(' + final + 'deg)';
  }

  function pushTimeout(fn: () => void, ms: number) {
    const id = window.setTimeout(fn, ms);
    timeoutsRef.current.push(id);
    return id;
  }

  function startReveal() {
    if (startedRef.current) return;
    startedRef.current = true;

    const wrap = engineWrapRef.current;
    if (wrap) wrap.classList.add(styles.igniting);

    pushTimeout(() => {
      setRevealing(true);
      pushTimeout(() => {
        setRevealed(true);
      }, 200);
    }, 350);

    PCONF.forEach((p) => {
      pushTimeout(() => {
        const arm = document.getElementById(p.armId);
        if (arm) stopArmAt(arm, p.target, 2600);
        // Trail viaja pegado al planeta (id="trail-conniku|trail-entrar|trail-crear")
        const trailId = p.armId.replace('arm-', 'trail-');
        const trail = document.getElementById(trailId);
        if (trail) stopTrailAt(trail, p.target, 2600);
        setLandingVis((prev) => ({ ...prev, [p.visId]: true }));
        pushTimeout(() => {
          setHiddenVis((prev) => ({ ...prev, [p.visId]: true }));
          setVisibleBtns((prev) => ({ ...prev, [p.btnKey]: true }));
          // Estela "penetra" el planeta y desaparece
          if (trail) trail.style.opacity = '0';
        }, 2700);
      }, p.triggerAt);
    });

    const allDone = 3400 + 2700; // ~6100ms

    pushTimeout(() => {
      const panel = panelARef.current;
      if (panel) panel.classList.add(styles.visible);
      revealedRef.current = true;
    }, allDone + 200);

    pushTimeout(() => {
      const c = centerRef.current;
      if (c) {
        c.style.transition = 'opacity 1.2s ease,transform 1.2s ease';
        c.style.opacity = '1';
        c.style.transform = 'translate(-50%,-50%) scale(1)';
        c.style.pointerEvents = 'auto';
      }
    }, allDone + 400);
  }

  function go(href: string) {
    if (!startedRef.current) return;
    setLeaving(true);
    pushTimeout(() => {
      // Si la ruta empieza con / es interna; si no, dejar tal cual.
      if (href.startsWith('/')) navigate(href);
      else window.location.href = href;
    }, 1000);
  }

  function handleEngineClick() {
    if (!startedRef.current) {
      const hasConfig =
        localStorage.getItem('conniku_language') && localStorage.getItem('conniku_role');
      if (hasConfig) {
        startReveal();
      } else {
        setOnboarding('language');
      }
      return;
    }
    // Durante la animación del reveal (~6 s) el click no responde.
    // El original hacía wrap.onclick=null y reasignaba al final.
    if (!revealedRef.current) return;
    // TODO: cuando se bridgee conniku.html en CONNIKU, navegar ahí.
    go('/');
  }

  function handleSelectLang(code: string) {
    setLang(code as Parameters<typeof setLang>[0]);
    setOnboarding('role');
  }

  function handleSelectRole(code: string) {
    localStorage.setItem('conniku_role', code);
    setOnboardClosing(true);
    window.setTimeout(() => {
      setOnboarding(null);
      setOnboardClosing(false);
      setLegalSessionToken(crypto.randomUUID());
      setLegalViewed({});
      setLegalDone(false);
      setModal(code as ModalKind);
    }, 320);
  }

  function handleRoleFormDone() {
    setModal(null);
    startReveal();
  }

  function handleConnikuBtn(e: React.MouseEvent) {
    e.preventDefault();
    // TODO: cuando se bridgee pages/conniku.html en CONNIKU
    go('/');
  }

  function handleDecoClick(visId: string) {
    // Burst decorativo en planetas tutores/empleos (líneas 487-497 del original)
    const el = document.getElementById(visId);
    if (!el) return;
    el.classList.remove(styles.decoClick);
    void el.offsetWidth;
    el.classList.add(styles.decoClick);
    window.setTimeout(() => {
      el.classList.remove(styles.decoClick);
    }, 700);
  }

  // Cierre con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setModal(null);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function handleLogin() {
    // TODO: cuando se cablee el backend, llamar al endpoint de login.
    alert('Login pendiente · backend por cablear');
    setModal(null);
  }

  function handleRegistro() {
    alert('Registro pendiente · backend por cablear');
    setModal(null);
  }

  async function handleLegalCheck(docKey: LegalDocKey, checked: boolean) {
    if (!checked || legalViewed[docKey]) return;
    setLegalLoading((prev) => ({ ...prev, [docKey]: true }));
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://studyhub-api-bpco.onrender.com';
      await fetch(`${baseUrl}/legal/documents/${docKey}/viewed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: legalSessionToken, scrolled_to_end: true }),
      });
      setLegalViewed((prev) => ({ ...prev, [docKey]: true }));
    } finally {
      setLegalLoading((prev) => ({ ...prev, [docKey]: false }));
    }
  }

  const allLegalViewed = LEGAL_DOC_KEYS.every((k) => legalViewed[k]);

  function renderLegalWizard() {
    const docs: { key: LegalDocKey; label: string; href: string | null; desc?: string }[] = [
      { key: 'terms', label: t('register.legal.terms'), href: '/terms' },
      { key: 'privacy', label: t('register.legal.privacy'), href: '/privacy' },
      { key: 'cookies', label: t('register.legal.cookies'), href: null },
      {
        key: 'age-declaration',
        label: t('register.legal.age'),
        href: null,
        desc: t('register.legal.age_desc'),
      },
    ];
    return (
      <div className={styles.legalWizard}>
        <div className={styles.legalWizardTitle}>{t('register.legal.title')}</div>
        <div className={styles.legalWizardSub}>{t('register.legal.subtitle')}</div>
        {docs.map(({ key, label, href, desc }) => (
          <label
            key={key}
            className={`${styles.legalItem} ${legalViewed[key] ? styles.legalItemDone : ''}`}
          >
            <input
              type="checkbox"
              className={styles.legalCheck}
              checked={!!legalViewed[key]}
              onChange={(e) => handleLegalCheck(key, e.target.checked)}
              disabled={!!legalViewed[key] || !!legalLoading[key]}
            />
            <span className={styles.legalItemBody}>
              <span className={styles.legalItemLabel}>{label}</span>
              {desc && <span className={styles.legalItemDesc}>{desc}</span>}
            </span>
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className={styles.legalViewLink}
                onClick={(e) => e.stopPropagation()}
              >
                {t('register.legal.view')} ↗
              </a>
            ) : legalLoading[key] ? (
              <span className={styles.legalSpinner}>…</span>
            ) : legalViewed[key] ? (
              <span className={styles.legalCheckDone}>✓</span>
            ) : null}
          </label>
        ))}
        {!allLegalViewed && (
          <div className={styles.legalHint}>{t('register.legal.all_required')}</div>
        )}
        <button
          type="button"
          className={styles.modalBtn}
          disabled={!allLegalViewed}
          onClick={() => setLegalDone(true)}
        >
          {t('register.legal.continue')}
        </button>
      </div>
    );
  }

  async function handleRoleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRfError('');
    setRfSending(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://studyhub-api-bpco.onrender.com';
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: rfEmail,
          password: rfPass,
          first_name: rfNombre,
          last_name: rfApellido,
          birth_date: rfBirthDate,
          university: rfUniv,
          bio: rfBio,
          language: lang,
          offers_mentoring: modal === 'tutor',
          mentoring_subjects: rfMaterias
            ? rfMaterias
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          academic_status: rfObjetivo || 'estudiante',
          tos_accepted: rfTosAccepted,
          age_declaration_accepted: rfAgeAccepted,
          accepted_text_version_hash: AGE_DECLARATION_TEXT_HASH,
          legal_session_token: legalSessionToken,
        }),
      });
      if (!res.ok) {
        type ValidationItem = { loc?: (string | number)[]; msg?: string };
        const err = (await res.json().catch(() => ({}))) as {
          detail?: string | ValidationItem[];
        };
        let msg = 'Error al registrarse';
        if (typeof err.detail === 'string') {
          msg = err.detail;
        } else if (Array.isArray(err.detail)) {
          msg = err.detail
            .map((item) => {
              const field = (item.loc || []).filter((p) => p !== 'body').join('.');
              return field ? `${field}: ${item.msg}` : item.msg;
            })
            .filter(Boolean)
            .join(' · ');
        }
        throw new Error(msg);
      }
      setRfSent(true);
    } catch (err) {
      setRfError(err instanceof Error ? err.message : 'error desconocido');
    } finally {
      setRfSending(false);
    }
  }

  async function handleBizContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRfError('');
    setRfSending(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://studyhub-api-bpco.onrender.com';
      const res = await fetch(`${baseUrl}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motivo: 'Conniku Business',
          nombre: rfNombre,
          email: rfEmail,
          asunto: `Demo Conniku Business — ${rfEmpresa}`,
          mensaje: `Empresa: ${rfEmpresa}\nCargo: ${rfCargo}\n\nSolicitó contacto con ventas desde el formulario Business.`,
        }),
      });
      if (!res.ok) {
        type ValidationItem = { loc?: (string | number)[]; msg?: string };
        const err = (await res.json().catch(() => ({}))) as { detail?: string | ValidationItem[] };
        let msg = 'Error al enviar';
        if (typeof err.detail === 'string') {
          msg = err.detail;
        } else if (Array.isArray(err.detail)) {
          msg = err.detail
            .map((item) => {
              const field = (item.loc || []).filter((p) => p !== 'body').join('.');
              return field ? `${field}: ${item.msg}` : item.msg;
            })
            .filter(Boolean)
            .join(' · ');
        }
        throw new Error(msg);
      }
      setRfSent(true);
    } catch (err) {
      setRfError(err instanceof Error ? err.message : 'error desconocido');
    } finally {
      setRfSending(false);
    }
  }

  function handleForgot(e: React.MouseEvent) {
    e.preventDefault();
    alert('Función pendiente');
  }

  function handlePending(e: React.MouseEvent) {
    e.preventDefault();
    alert('Página pendiente');
  }

  const rootClass = [
    styles.root,
    revealing ? styles.revealing : '',
    revealed ? styles.revealed : '',
    leaving ? styles.leaving : '',
  ]
    .filter(Boolean)
    .join(' ');

  function visClass(visId: string, baseColorClass: string) {
    const cls = [styles.orbVis, baseColorClass];
    if (landingVis[visId]) cls.push(styles.landing);
    return cls.join(' ');
  }

  function visStyle(visId: string): React.CSSProperties {
    return hiddenVis[visId] ? { opacity: 0 } : {};
  }

  return (
    <div className={rootClass}>
      <canvas ref={canvasRef} className={styles.canvas} />

      {/* Stars */}
      <div className={styles.universe}>
        <span
          className={`${styles.star} ${styles.xl}`}
          style={
            { top: '6%', left: '18%', '--dur': '3.4s', '--delay': '0s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.l} ${styles.green}`}
          style={
            { top: '14%', left: '55%', '--dur': '2.8s', '--delay': '.6s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.m}`}
          style={
            { top: '9%', left: '72%', '--dur': '3.2s', '--delay': '1.2s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.l} ${styles.orange}`}
          style={
            { top: '11%', left: '84%', '--dur': '3.2s', '--delay': '.4s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.s}`}
          style={
            { top: '5%', left: '5%', '--dur': '2.2s', '--delay': '1.8s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.m}`}
          style={{ top: '8%', left: '93%', '--dur': '4s', '--delay': '.2s' } as React.CSSProperties}
        />
        <span
          className={`${styles.star} ${styles.l}`}
          style={
            { top: '28%', left: '7%', '--dur': '3.6s', '--delay': '.3s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.s} ${styles.green}`}
          style={
            { top: '22%', left: '96%', '--dur': '2.4s', '--delay': '1.4s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.xl}`}
          style={
            { top: '42%', left: '2%', '--dur': '3.8s', '--delay': '.8s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.m} ${styles.orange}`}
          style={
            { top: '58%', left: '97%', '--dur': '2.9s', '--delay': '.1s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.s}`}
          style={
            { top: '72%', left: '12%', '--dur': '3.1s', '--delay': '2s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.l} ${styles.cyan}`}
          style={
            { top: '80%', left: '78%', '--dur': '4.2s', '--delay': '.5s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.m}`}
          style={
            { top: '88%', left: '44%', '--dur': '2.7s', '--delay': '1.1s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.xl} ${styles.green}`}
          style={
            { top: '38%', left: '88%', '--dur': '4.8s', '--delay': '1.6s' } as React.CSSProperties
          }
        />
        {/* Estrellas extra · distribuidas por toda la pantalla */}
        <span
          className={`${styles.star} ${styles.s}`}
          style={
            { top: '3%', left: '32%', '--dur': '2.6s', '--delay': '0.3s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.m} ${styles.green}`}
          style={
            { top: '17%', left: '8%', '--dur': '3.6s', '--delay': '1.1s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.s} ${styles.cyan}`}
          style={
            { top: '4%', left: '47%', '--dur': '2.9s', '--delay': '0.5s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.m}`}
          style={
            { top: '7%', left: '64%', '--dur': '3.3s', '--delay': '1.9s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.l}`}
          style={
            { top: '19%', left: '38%', '--dur': '4.1s', '--delay': '0.7s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.s}`}
          style={
            { top: '24%', left: '78%', '--dur': '2.4s', '--delay': '0.2s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.m} ${styles.orange}`}
          style={
            { top: '32%', left: '15%', '--dur': '3.7s', '--delay': '1.5s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.xl} ${styles.green}`}
          style={
            { top: '34%', left: '64%', '--dur': '4s', '--delay': '0.9s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.s}`}
          style={
            { top: '41%', left: '24%', '--dur': '2.5s', '--delay': '1.3s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.m}`}
          style={
            { top: '47%', left: '50%', '--dur': '3.4s', '--delay': '0.4s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.l} ${styles.cyan}`}
          style={
            { top: '49%', left: '90%', '--dur': '4.3s', '--delay': '1.8s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.s}`}
          style={
            { top: '53%', left: '7%', '--dur': '2.2s', '--delay': '0.6s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.m}`}
          style={
            { top: '56%', left: '35%', '--dur': '3.5s', '--delay': '1.0s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.s} ${styles.green}`}
          style={
            { top: '62%', left: '67%', '--dur': '2.7s', '--delay': '0.8s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.l} ${styles.orange}`}
          style={
            { top: '64%', left: '4%', '--dur': '3.9s', '--delay': '1.7s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.m}`}
          style={
            { top: '67%', left: '50%', '--dur': '3.1s', '--delay': '0.1s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.s}`}
          style={
            { top: '70%', left: '28%', '--dur': '2.3s', '--delay': '1.4s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.xl}`}
          style={
            { top: '74%', left: '92%', '--dur': '4.5s', '--delay': '0.9s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.m} ${styles.cyan}`}
          style={
            { top: '78%', left: '40%', '--dur': '3.8s', '--delay': '1.2s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.s}`}
          style={
            { top: '83%', left: '18%', '--dur': '2.6s', '--delay': '0.3s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.m}`}
          style={
            { top: '85%', left: '55%', '--dur': '3.2s', '--delay': '1.6s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.l} ${styles.green}`}
          style={
            { top: '88%', left: '85%', '--dur': '4s', '--delay': '0.5s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.s}`}
          style={
            { top: '92%', left: '32%', '--dur': '2.8s', '--delay': '1.1s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.s} ${styles.orange}`}
          style={
            { top: '94%', left: '70%', '--dur': '2.4s', '--delay': '0.7s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.m}`}
          style={
            { top: '96%', left: '12%', '--dur': '3.6s', '--delay': '1.4s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.s}`}
          style={
            { top: '13%', left: '52%', '--dur': '2.9s', '--delay': '0.4s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.m} ${styles.green}`}
          style={
            { top: '21%', left: '20%', '--dur': '3.4s', '--delay': '1.8s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.s}`}
          style={
            { top: '27%', left: '60%', '--dur': '2.5s', '--delay': '0.6s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.l}`}
          style={
            { top: '45%', left: '70%', '--dur': '4.2s', '--delay': '1.0s' } as React.CSSProperties
          }
        />
        <span
          className={`${styles.star} ${styles.s} ${styles.cyan}`}
          style={
            { top: '60%', left: '21%', '--dur': '2.7s', '--delay': '0.2s' } as React.CSSProperties
          }
        />
      </div>

      <div className={styles.pulseWave} />

      {/* Orbit ring 1 — conniku (activo · estela se detiene + fade) */}
      <div className={`${styles.orbRing} ${styles.orbR1}`}>
        <div className={styles.orbTrail} id="trail-conniku" />
        <div className={`${styles.orbArm} ${styles.armConniku}`} id="arm-conniku">
          <div
            className={visClass('vis-conniku', styles.visConniku)}
            id="vis-conniku"
            style={visStyle('vis-conniku')}
          />
        </div>
      </div>
      {/* Orbit ring 2 — tutores (decorativo · estela infinita) */}
      <div className={`${styles.orbRing} ${styles.orbR2}`}>
        <div className={styles.orbTrail} />
        <div className={`${styles.orbArm} ${styles.armTutores}`} id="arm-tutores">
          <div
            className={visClass('vis-tutores', styles.visTutores)}
            id="vis-tutores"
            style={{ ...visStyle('vis-tutores'), cursor: 'pointer', pointerEvents: 'auto' }}
            onClick={() => handleDecoClick('vis-tutores')}
          />
        </div>
      </div>
      {/* Orbit ring 3 — empleos (decorativo · estela infinita) */}
      <div className={`${styles.orbRing} ${styles.orbR3}`}>
        <div className={styles.orbTrail} />
        <div className={`${styles.orbArm} ${styles.armEmpleos}`} id="arm-empleos">
          <div
            className={visClass('vis-empleos', styles.visEmpleos)}
            id="vis-empleos"
            style={{ ...visStyle('vis-empleos'), cursor: 'pointer', pointerEvents: 'auto' }}
            onClick={() => handleDecoClick('vis-empleos')}
          />
        </div>
      </div>
      {/* Orbit ring 4 — entrar (activo) */}
      <div className={`${styles.orbRing} ${styles.orbR4}`}>
        <div className={styles.orbTrail} id="trail-entrar" />
        <div className={`${styles.orbArm} ${styles.armEntrar}`} id="arm-entrar">
          <div
            className={visClass('vis-entrar', styles.visEntrar)}
            id="vis-entrar"
            style={visStyle('vis-entrar')}
          />
        </div>
      </div>
      {/* Orbit ring 5 — crear (activo) */}
      <div className={`${styles.orbRing} ${styles.orbR5}`}>
        <div className={styles.orbTrail} id="trail-crear" />
        <div className={`${styles.orbArm} ${styles.armCrear}`} id="arm-crear">
          <div
            className={visClass('vis-crear', styles.visCrear)}
            id="vis-crear"
            style={visStyle('vis-crear')}
          />
        </div>
      </div>
      {/* Orbit ring 6 — decorativo extra (pink · siempre orbita) */}
      <div className={`${styles.orbRing} ${styles.orbR6}`}>
        <div className={styles.orbTrail} />
        <div className={`${styles.orbArm} ${styles.armDecoA}`}>
          <div className={`${styles.orbVis} ${styles.visDecoA}`} />
        </div>
      </div>
      {/* Orbit ring 7 — decorativo extra (teal · siempre orbita) */}
      <div className={`${styles.orbRing} ${styles.orbR7}`}>
        <div className={styles.orbTrail} />
        <div className={`${styles.orbArm} ${styles.armDecoB}`}>
          <div className={`${styles.orbVis} ${styles.visDecoB}`} />
        </div>
      </div>

      {/* Planet buttons */}
      <a
        className={`${styles.planetBtn} ${styles.pbConniku} ${visibleBtns['pb-conniku'] ? styles.visible : ''}`}
        href="#"
        onClick={handleConnikuBtn}
      >
        <div className={styles.pbDot} style={{ background: '#00C27A' }} />
        <span>{t('start.planets.conniku')}</span>
        <span className={styles.pbArr}>→</span>
      </a>
      <a
        className={`${styles.planetBtn} ${styles.pbEntrar} ${visibleBtns['pb-entrar'] ? styles.visible : ''}`}
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setModal('entrar');
        }}
      >
        <div className={styles.pbDot} style={{ background: '#6B4EFF' }} />
        <span>{t('start.planets.entrar')}</span>
        <span className={styles.pbArr}>→</span>
      </a>
      <a
        className={`${styles.planetBtn} ${styles.pbCrear} ${visibleBtns['pb-crear'] ? styles.visible : ''}`}
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setModal('crear');
        }}
      >
        <div className={styles.pbDot} style={{ background: '#FF4A1C' }} />
        <span>{t('start.planets.crear')}</span>
        <span className={styles.pbArr}>→</span>
      </a>

      {/* Center engine */}
      <div className={styles.center} ref={centerRef}>
        <div className={styles.engineWrap} ref={engineWrapRef} onClick={handleEngineClick}>
          <div className={styles.engineBtn}>
            <div className={styles.engOrbit} />
            <div className={styles.engOrbit2} />
            <svg className={styles.engTicks} viewBox="0 0 168 168" ref={tickSvgRef} />
            <div className={styles.engRadar} />
            <div className={styles.engPrecision} />
            <div className={styles.engFace}>
              <div className={styles.engPowerRing} />
              <svg
                className={styles.engPowerIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M12 2v6" />
                <path d="M19.07 4.93a10 10 0 1 1-14.14 0" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Panel A */}
      <div className={styles.panelA} ref={panelARef}>
        <div className={styles.paBadge}>{t('start.panel.badge')}</div>
        <div className={styles.paLogo}>
          <span className="brand on-dark" aria-label="Conniku">
            conn<span>i</span>
            <span className="k-letter">k</span>
            <span className="u-pack">
              <span className="u-letter">u</span>
              <span className="dot"></span>
            </span>
          </span>
        </div>
        <div className={styles.paProduct}>{t('start.panel.product')}</div>
        <div className={styles.paSep} />
        <div className={styles.paTagline}>{t('start.panel.tagline')}</div>
        <div className={styles.paSub}>
          {t('start.panel.modules_1')}
          <br />
          {t('start.panel.modules_2')}
        </div>
        <div className={styles.paSep2} />
        <div className={styles.paDesc}>{t('start.panel.desc')}</div>
        <div className={styles.paStats}>
          <div className={styles.paStat}>
            <div className={styles.paStatN}>9</div>
            <div className={styles.paStatL}>{t('start.panel.stat_modules')}</div>
          </div>
          <div className={styles.paStat}>
            <div className={styles.paStatN}>1</div>
            <div className={styles.paStatL}>{t('start.panel.stat_platform')}</div>
          </div>
          <div className={styles.paStat}>
            <div className={styles.paStatN}>∞</div>
            <div className={styles.paStatL}>{t('start.panel.stat_posib')}</div>
          </div>
          <div className={styles.paStat}>
            <div className={styles.paStatN}>CL</div>
            <div className={styles.paStatL}>{t('start.panel.stat_region')}</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.siteFooter}>
        <span className={styles.footerCopy}>{t('start.footer.copy')}</span>
        <nav className={styles.footerLinks}>
          <Link to="/terms">{t('start.footer.terms')}</Link>
          <div className={styles.footerSep} />
          <Link to="/privacy">{t('start.footer.privacy')}</Link>
          <div className={styles.footerSep} />
          <Link to="/support">{t('start.footer.support')}</Link>
          <div className={styles.footerSep} />
          <Link to="/contact">{t('start.footer.contact')}</Link>
          <div className={styles.footerSep} />
          <Link to="/careers">{t('start.footer.careers')}</Link>
        </nav>
      </footer>

      {/* Onboarding · Selector de idioma */}
      {onboarding === 'language' && (
        <div className={`${styles.onboardOverlay} ${onboardClosing ? styles.onboardClosing : ''}`}>
          <div className={styles.onboardPanel}>
            <div className={styles.onboardEyebrow}>{t('start.onboard.eyebrow')}</div>
            <h2 className={styles.onboardTitle}>{t('start.onboard.lang_title')}</h2>
            <p className={styles.onboardSub}>{t('start.onboard.lang_sub')}</p>
            <div className={styles.langGrid}>
              {LANGUAGES.map((lng) => (
                <button
                  key={lng.code}
                  className={`${styles.langBtn} ${lang === lng.code ? styles.langBtnActive : ''}`}
                  onClick={() => handleSelectLang(lng.code)}
                >
                  <div className={styles.langFlagBg} aria-hidden="true">
                    {lng.flags.map((f) => (
                      <span key={f}>{f}</span>
                    ))}
                  </div>
                  <div className={styles.langContent}>
                    <span className={styles.langName}>{lng.label}</span>
                    <span className={styles.langSub}>{lng.sub}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Onboarding · Selector de rol */}
      {onboarding === 'role' && (
        <div className={`${styles.onboardOverlay} ${onboardClosing ? styles.onboardClosing : ''}`}>
          <div className={styles.onboardPanel}>
            <div className={styles.onboardEyebrow}>{t('start.onboard.eyebrow')}</div>
            <h2 className={styles.onboardTitle}>{t('start.onboard.role_title')}</h2>
            <p className={styles.onboardSub}>{t('start.onboard.role_sub')}</p>
            <div className={styles.roleGrid}>
              {ROLE_DEFS.map((role) => (
                <button
                  key={role.code}
                  className={styles.roleBtn}
                  style={{ '--role-accent': role.accent } as React.CSSProperties}
                  onClick={() => handleSelectRole(role.code)}
                >
                  <span className={styles.roleIcon}>{role.icon}</span>
                  <span className={styles.roleLabel}>{t(role.labelKey)}</span>
                  <span className={styles.roleSub}>{t(role.subKey)}</span>
                </button>
              ))}
            </div>
            <button className={styles.onboardBack} onClick={() => setOnboarding('language')}>
              {t('start.onboard.back_lang')}
            </button>
          </div>
        </div>
      )}

      {/* Modal · Entrar */}
      {modal === 'entrar' && (
        <div
          className={`${styles.modalOverlay} ${styles.open}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div className={styles.modalCard}>
            <button type="button" className={styles.modalClose} onClick={() => setModal(null)}>
              ✕
            </button>
            <div className={styles.modalLogo}>
              <span className="brand on-dark" aria-label="Conniku">
                conn<span>i</span>
                <span className="k-letter">k</span>
                <span className="u-pack">
                  <span className="u-letter">u</span>
                  <span className="dot"></span>
                </span>
              </span>
            </div>
            <div className={styles.modalTitle}>{t('start.modal.login_title')}</div>
            <div className={styles.modalSub}>{t('start.modal.login_sub')}</div>
            <div className={styles.modalSep} />
            <div className={styles.mfGroup}>
              <label className={styles.mfLabel}>{t('start.modal.email')}</label>
              <input
                className={styles.mfInput}
                type="email"
                placeholder={t('start.modal.email_ph')}
                id="loginEmail"
                autoComplete="email"
              />
            </div>
            <div className={styles.mfGroup}>
              <label className={styles.mfLabel}>
                {t('start.modal.password')}
                <a className={styles.mfLink} href="#" onClick={handleForgot}>
                  {t('start.modal.forgot')}
                </a>
              </label>
              <input
                className={styles.mfInput}
                type="password"
                placeholder={t('start.modal.pass_ph')}
                id="loginPass"
                autoComplete="current-password"
              />
            </div>
            <button type="button" className={styles.modalBtn} onClick={handleLogin}>
              {t('start.modal.btn_login')}
            </button>
            <div className={styles.modalSwitch}>
              {t('start.modal.no_account')}{' '}
              <button type="button" onClick={() => setModal('crear')}>
                {t('start.modal.create_free')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal · Crear cuenta */}
      {modal === 'crear' && (
        <div
          className={`${styles.modalOverlay} ${styles.open}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div className={styles.modalCard}>
            <button type="button" className={styles.modalClose} onClick={() => setModal(null)}>
              ✕
            </button>
            <div className={styles.modalLogo}>
              <span className="brand on-dark" aria-label="Conniku">
                conn<span>i</span>
                <span className="k-letter">k</span>
                <span className="u-pack">
                  <span className="u-letter">u</span>
                  <span className="dot"></span>
                </span>
              </span>
            </div>
            <div className={styles.modalTitle}>{t('start.modal.register_title')}</div>
            <div className={styles.modalSub}>{t('start.modal.register_sub')}</div>
            <div className={styles.modalSep} />
            <div className={styles.mfRow}>
              <div className={styles.mfGroup}>
                <label className={styles.mfLabel}>{t('start.modal.nombre')}</label>
                <input
                  className={styles.mfInput}
                  type="text"
                  placeholder={t('start.modal.nombre_ph')}
                  id="regNombre"
                  autoComplete="given-name"
                />
              </div>
              <div className={styles.mfGroup}>
                <label className={styles.mfLabel}>{t('start.modal.apellido')}</label>
                <input
                  className={styles.mfInput}
                  type="text"
                  placeholder={t('start.modal.apellido_ph')}
                  id="regApellido"
                  autoComplete="family-name"
                />
              </div>
            </div>
            <div className={styles.mfGroup}>
              <label className={styles.mfLabel}>{t('start.modal.email')}</label>
              <input
                className={styles.mfInput}
                type="email"
                placeholder={t('start.modal.email_ph')}
                id="regEmail"
                autoComplete="email"
              />
            </div>
            <div className={styles.mfGroup}>
              <label className={styles.mfLabel}>{t('start.modal.password')}</label>
              <input
                className={styles.mfInput}
                type="password"
                placeholder={t('start.modal.pass_new_ph')}
                id="regPass"
                autoComplete="new-password"
              />
              <div className={styles.mfHint}>{t('start.modal.pass_hint')}</div>
            </div>
            <div className={styles.mfGroup}>
              <label className={styles.mfLabel}>{t('start.modal.universidad')}</label>
              <select className={styles.mfSelect} id="regUniv" defaultValue="">
                <option value="" disabled>
                  {t('start.modal.univ_ph')}
                </option>
                <option>Universidad de Chile</option>
                <option>Pontificia Universidad Católica de Chile</option>
                <option>Universidad de Concepción</option>
                <option>Universidad de Santiago de Chile</option>
                <option>Universidad Austral de Chile</option>
                <option>Universidad Técnica Federico Santa María</option>
                <option>Universidad Adolfo Ibáñez</option>
                <option>Universidad Diego Portales</option>
                <option>Universidad Andrés Bello</option>
                <option>Otra universidad</option>
              </select>
            </div>
            <button type="button" className={styles.modalBtn} onClick={handleRegistro}>
              {t('start.modal.btn_register')}
            </button>
            <div className={styles.modalSwitch}>
              {t('start.modal.have_account')}{' '}
              <button type="button" onClick={() => setModal('entrar')}>
                {t('start.modal.login_link')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal · Estudiante */}
      {modal === 'student' && (
        <div
          className={`${styles.modalOverlay} ${styles.open}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              resetRoleForm();
              handleRoleFormDone();
            }
          }}
        >
          <div className={styles.modalCard}>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => {
                resetRoleForm();
                handleRoleFormDone();
              }}
            >
              ✕
            </button>
            <div className={styles.modalLogo}>
              <span className="brand on-dark" aria-label="Conniku">
                conn<span>i</span>
                <span className="k-letter">k</span>
                <span className="u-pack">
                  <span className="u-letter">u</span>
                  <span className="dot"></span>
                </span>
              </span>
            </div>
            <div className={styles.modalBadge}>{t('register.student.badge')}</div>
            <div className={styles.modalTitle}>{t('register.student.title')}</div>
            <div className={styles.modalSub}>{t('register.student.sub')}</div>
            <div className={styles.modalSep} />
            {rfSent ? (
              <div className={styles.modalSentBox}>
                <div className={styles.modalSentIcon}>✓</div>
                <div className={styles.modalSentTitle}>{t('start.modal.register_title')}</div>
                <div className={styles.modalSentText}>{t('register.student.sub')}</div>
                <button
                  className={styles.modalBtn}
                  onClick={() => {
                    resetRoleForm();
                    handleRoleFormDone();
                  }}
                >
                  {t('start.planets.entrar')} →
                </button>
              </div>
            ) : !legalDone ? (
              renderLegalWizard()
            ) : (
              <form onSubmit={handleRoleSubmit}>
                <div className={styles.mfRow}>
                  <div className={styles.mfGroup}>
                    <label className={styles.mfLabel}>{t('start.modal.nombre')}</label>
                    <input
                      className={styles.mfInput}
                      type="text"
                      placeholder={t('start.modal.nombre_ph')}
                      value={rfNombre}
                      onChange={(e) => setRfNombre(e.target.value)}
                      required
                      minLength={2}
                      maxLength={60}
                      autoComplete="given-name"
                    />
                  </div>
                  <div className={styles.mfGroup}>
                    <label className={styles.mfLabel}>{t('start.modal.apellido')}</label>
                    <input
                      className={styles.mfInput}
                      type="text"
                      placeholder={t('start.modal.apellido_ph')}
                      value={rfApellido}
                      onChange={(e) => setRfApellido(e.target.value)}
                      required
                      minLength={2}
                      maxLength={60}
                      autoComplete="family-name"
                    />
                  </div>
                </div>
                <div className={styles.mfGroup}>
                  <label className={styles.mfLabel}>{t('start.modal.email')}</label>
                  <input
                    className={styles.mfInput}
                    type="email"
                    placeholder={t('start.modal.email_ph')}
                    value={rfEmail}
                    onChange={(e) => setRfEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className={styles.mfGroup}>
                  <label className={styles.mfLabel}>{t('start.modal.password')}</label>
                  <input
                    className={styles.mfInput}
                    type="password"
                    placeholder={t('start.modal.pass_new_ph')}
                    value={rfPass}
                    onChange={(e) => setRfPass(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <div className={styles.mfHint}>{t('start.modal.pass_hint')}</div>
                </div>
                <div className={styles.mfGroup}>
                  <label className={styles.mfLabel}>{t('start.modal.universidad')}</label>
                  <select
                    className={styles.mfSelect}
                    value={rfUniv}
                    onChange={(e) => setRfUniv(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      {t('start.modal.univ_ph')}
                    </option>
                    <option>Universidad de Chile</option>
                    <option>Pontificia Universidad Católica de Chile</option>
                    <option>Universidad de Concepción</option>
                    <option>Universidad de Santiago de Chile</option>
                    <option>Universidad Austral de Chile</option>
                    <option>Universidad Técnica Federico Santa María</option>
                    <option>Universidad Adolfo Ibáñez</option>
                    <option>Universidad Diego Portales</option>
                    <option>Universidad Andrés Bello</option>
                    <option>Otra universidad</option>
                  </select>
                </div>
                <div className={styles.mfGroup}>
                  <label className={styles.mfLabel}>{t('register.form.birth_date')}</label>
                  <input
                    className={styles.mfInput}
                    type="date"
                    value={rfBirthDate}
                    onChange={(e) => setRfBirthDate(e.target.value)}
                    required
                    max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split('T')[0]}
                  />
                  <div className={styles.mfHint}>{t('register.form.birth_date_hint')}</div>
                </div>
                <label className={styles.mfCheckRow}>
                  <input
                    type="checkbox"
                    checked={rfTosAccepted}
                    onChange={(e) => setRfTosAccepted(e.target.checked)}
                    required
                  />
                  <span className={styles.mfCheckLabel}>
                    {t('start.modal.tos_prefix')}{' '}
                    <Link to="/terms" target="_blank" className={styles.mfLink}>
                      {t('register.legal.terms')}
                    </Link>{' '}
                    {t('start.modal.tos_and')}{' '}
                    <Link to="/privacy" target="_blank" className={styles.mfLink}>
                      {t('register.legal.privacy')}
                    </Link>
                  </span>
                </label>
                <label className={styles.mfCheckRow}>
                  <input
                    type="checkbox"
                    checked={rfAgeAccepted}
                    onChange={(e) => setRfAgeAccepted(e.target.checked)}
                    required
                  />
                  <span className={styles.mfCheckLabel}>{t('register.legal.age_desc')}</span>
                </label>
                {rfError && <p className={styles.mfError}>{rfError}</p>}
                <button type="submit" className={styles.modalBtn} disabled={rfSending}>
                  {rfSending ? '…' : t('start.modal.btn_register')}
                </button>
                <div className={styles.modalSwitch}>
                  {t('start.modal.have_account')}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      resetRoleForm();
                      setModal('entrar');
                    }}
                  >
                    {t('start.modal.login_link')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal · Tutor */}
      {modal === 'tutor' && (
        <div
          className={`${styles.modalOverlay} ${styles.open}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              resetRoleForm();
              handleRoleFormDone();
            }
          }}
        >
          <div className={styles.modalCard}>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => {
                resetRoleForm();
                handleRoleFormDone();
              }}
            >
              ✕
            </button>
            <div className={styles.modalLogo}>
              <span className="brand on-dark" aria-label="Conniku">
                conn<span>i</span>
                <span className="k-letter">k</span>
                <span className="u-pack">
                  <span className="u-letter">u</span>
                  <span className="dot"></span>
                </span>
              </span>
            </div>
            <div className={styles.modalBadge}>{t('register.tutor.badge')}</div>
            <div className={styles.modalTitle}>{t('register.tutor.title')}</div>
            <div className={styles.modalSub}>{t('register.tutor.sub')}</div>
            <div className={styles.modalSep} />
            {rfSent ? (
              <div className={styles.modalSentBox}>
                <div className={styles.modalSentIcon}>✓</div>
                <div className={styles.modalSentTitle}>{t('careers.modal.sent_title')}</div>
                <div className={styles.modalSentText}>{t('register.tutor.sub')}</div>
                <button
                  className={styles.modalBtn}
                  onClick={() => {
                    resetRoleForm();
                    handleRoleFormDone();
                  }}
                >
                  {t('start.planets.entrar')} →
                </button>
              </div>
            ) : !legalDone ? (
              renderLegalWizard()
            ) : (
              <form onSubmit={handleRoleSubmit}>
                <div className={styles.mfRow}>
                  <div className={styles.mfGroup}>
                    <label className={styles.mfLabel}>{t('start.modal.nombre')}</label>
                    <input
                      className={styles.mfInput}
                      type="text"
                      placeholder={t('start.modal.nombre_ph')}
                      value={rfNombre}
                      onChange={(e) => setRfNombre(e.target.value)}
                      required
                      minLength={2}
                      autoComplete="given-name"
                    />
                  </div>
                  <div className={styles.mfGroup}>
                    <label className={styles.mfLabel}>{t('start.modal.apellido')}</label>
                    <input
                      className={styles.mfInput}
                      type="text"
                      placeholder={t('start.modal.apellido_ph')}
                      value={rfApellido}
                      onChange={(e) => setRfApellido(e.target.value)}
                      required
                      minLength={2}
                      autoComplete="family-name"
                    />
                  </div>
                </div>
                <div className={styles.mfGroup}>
                  <label className={styles.mfLabel}>{t('start.modal.email')}</label>
                  <input
                    className={styles.mfInput}
                    type="email"
                    placeholder={t('start.modal.email_ph')}
                    value={rfEmail}
                    onChange={(e) => setRfEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className={styles.mfGroup}>
                  <label className={styles.mfLabel}>{t('start.modal.password')}</label>
                  <input
                    className={styles.mfInput}
                    type="password"
                    placeholder={t('start.modal.pass_new_ph')}
                    value={rfPass}
                    onChange={(e) => setRfPass(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <div className={styles.mfGroup}>
                  <label className={styles.mfLabel}>{t('register.tutor.materias')}</label>
                  <input
                    className={styles.mfInput}
                    type="text"
                    placeholder={t('register.tutor.materias_ph')}
                    value={rfMaterias}
                    onChange={(e) => setRfMaterias(e.target.value)}
                    required
                    maxLength={200}
                  />
                </div>
                <div className={styles.mfGroup}>
                  <label className={styles.mfLabel}>{t('register.tutor.bio')}</label>
                  <textarea
                    className={styles.mfTextarea}
                    placeholder={t('register.tutor.bio_ph')}
                    value={rfBio}
                    onChange={(e) => setRfBio(e.target.value)}
                    maxLength={500}
                    rows={3}
                  />
                </div>
                <div className={styles.mfGroup}>
                  <label className={styles.mfLabel}>{t('register.form.birth_date')}</label>
                  <input
                    className={styles.mfInput}
                    type="date"
                    value={rfBirthDate}
                    onChange={(e) => setRfBirthDate(e.target.value)}
                    required
                    max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split('T')[0]}
                  />
                  <div className={styles.mfHint}>{t('register.form.birth_date_hint')}</div>
                </div>
                <label className={styles.mfCheckRow}>
                  <input
                    type="checkbox"
                    checked={rfTosAccepted}
                    onChange={(e) => setRfTosAccepted(e.target.checked)}
                    required
                  />
                  <span className={styles.mfCheckLabel}>
                    {t('start.modal.tos_prefix')}{' '}
                    <Link to="/terms" target="_blank" className={styles.mfLink}>
                      {t('register.legal.terms')}
                    </Link>{' '}
                    {t('start.modal.tos_and')}{' '}
                    <Link to="/privacy" target="_blank" className={styles.mfLink}>
                      {t('register.legal.privacy')}
                    </Link>
                  </span>
                </label>
                <label className={styles.mfCheckRow}>
                  <input
                    type="checkbox"
                    checked={rfAgeAccepted}
                    onChange={(e) => setRfAgeAccepted(e.target.checked)}
                    required
                  />
                  <span className={styles.mfCheckLabel}>{t('register.legal.age_desc')}</span>
                </label>
                {rfError && <p className={styles.mfError}>{rfError}</p>}
                <button type="submit" className={styles.modalBtn} disabled={rfSending}>
                  {rfSending ? '…' : t('start.modal.btn_register')}
                </button>
                <div className={styles.modalSwitch}>
                  {t('start.modal.have_account')}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      resetRoleForm();
                      setModal('entrar');
                    }}
                  >
                    {t('start.modal.login_link')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal · General / Laboral */}
      {modal === 'general' && (
        <div
          className={`${styles.modalOverlay} ${styles.open}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              resetRoleForm();
              handleRoleFormDone();
            }
          }}
        >
          <div className={styles.modalCard}>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => {
                resetRoleForm();
                handleRoleFormDone();
              }}
            >
              ✕
            </button>
            <div className={styles.modalLogo}>
              <span className="brand on-dark" aria-label="Conniku">
                conn<span>i</span>
                <span className="k-letter">k</span>
                <span className="u-pack">
                  <span className="u-letter">u</span>
                  <span className="dot"></span>
                </span>
              </span>
            </div>
            <div className={styles.modalBadge}>{t('register.general.badge')}</div>
            <div className={styles.modalTitle}>{t('register.general.title')}</div>
            <div className={styles.modalSub}>{t('register.general.sub')}</div>
            <div className={styles.modalSep} />
            {rfSent ? (
              <div className={styles.modalSentBox}>
                <div className={styles.modalSentIcon}>✓</div>
                <div className={styles.modalSentTitle}>{t('careers.modal.sent_title')}</div>
                <div className={styles.modalSentText}>{t('register.general.sub')}</div>
                <button
                  className={styles.modalBtn}
                  onClick={() => {
                    resetRoleForm();
                    handleRoleFormDone();
                  }}
                >
                  {t('start.planets.entrar')} →
                </button>
              </div>
            ) : !legalDone ? (
              renderLegalWizard()
            ) : (
              <form onSubmit={handleRoleSubmit}>
                <div className={styles.mfRow}>
                  <div className={styles.mfGroup}>
                    <label className={styles.mfLabel}>{t('start.modal.nombre')}</label>
                    <input
                      className={styles.mfInput}
                      type="text"
                      placeholder={t('start.modal.nombre_ph')}
                      value={rfNombre}
                      onChange={(e) => setRfNombre(e.target.value)}
                      required
                      minLength={2}
                      autoComplete="given-name"
                    />
                  </div>
                  <div className={styles.mfGroup}>
                    <label className={styles.mfLabel}>{t('start.modal.apellido')}</label>
                    <input
                      className={styles.mfInput}
                      type="text"
                      placeholder={t('start.modal.apellido_ph')}
                      value={rfApellido}
                      onChange={(e) => setRfApellido(e.target.value)}
                      required
                      minLength={2}
                      autoComplete="family-name"
                    />
                  </div>
                </div>
                <div className={styles.mfGroup}>
                  <label className={styles.mfLabel}>{t('start.modal.email')}</label>
                  <input
                    className={styles.mfInput}
                    type="email"
                    placeholder={t('start.modal.email_ph')}
                    value={rfEmail}
                    onChange={(e) => setRfEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className={styles.mfGroup}>
                  <label className={styles.mfLabel}>{t('start.modal.password')}</label>
                  <input
                    className={styles.mfInput}
                    type="password"
                    placeholder={t('start.modal.pass_new_ph')}
                    value={rfPass}
                    onChange={(e) => setRfPass(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <div className={styles.mfGroup}>
                  <label className={styles.mfLabel}>{t('register.general.objetivo')}</label>
                  <select
                    className={styles.mfSelect}
                    value={rfObjetivo}
                    onChange={(e) => setRfObjetivo(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      {t('register.general.objetivo_ph')}
                    </option>
                    <option value="networking">{t('register.general.obj_network')}</option>
                    <option value="jobs">{t('register.general.obj_jobs')}</option>
                    <option value="community">{t('register.general.obj_community')}</option>
                    <option value="other">{t('register.general.obj_other')}</option>
                  </select>
                </div>
                <div className={styles.mfGroup}>
                  <label className={styles.mfLabel}>{t('register.form.birth_date')}</label>
                  <input
                    className={styles.mfInput}
                    type="date"
                    value={rfBirthDate}
                    onChange={(e) => setRfBirthDate(e.target.value)}
                    required
                    max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split('T')[0]}
                  />
                  <div className={styles.mfHint}>{t('register.form.birth_date_hint')}</div>
                </div>
                <label className={styles.mfCheckRow}>
                  <input
                    type="checkbox"
                    checked={rfTosAccepted}
                    onChange={(e) => setRfTosAccepted(e.target.checked)}
                    required
                  />
                  <span className={styles.mfCheckLabel}>
                    {t('start.modal.tos_prefix')}{' '}
                    <Link to="/terms" target="_blank" className={styles.mfLink}>
                      {t('register.legal.terms')}
                    </Link>{' '}
                    {t('start.modal.tos_and')}{' '}
                    <Link to="/privacy" target="_blank" className={styles.mfLink}>
                      {t('register.legal.privacy')}
                    </Link>
                  </span>
                </label>
                <label className={styles.mfCheckRow}>
                  <input
                    type="checkbox"
                    checked={rfAgeAccepted}
                    onChange={(e) => setRfAgeAccepted(e.target.checked)}
                    required
                  />
                  <span className={styles.mfCheckLabel}>{t('register.legal.age_desc')}</span>
                </label>
                {rfError && <p className={styles.mfError}>{rfError}</p>}
                <button type="submit" className={styles.modalBtn} disabled={rfSending}>
                  {rfSending ? '…' : t('start.modal.btn_register')}
                </button>
                <div className={styles.modalSwitch}>
                  {t('start.modal.have_account')}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      resetRoleForm();
                      setModal('entrar');
                    }}
                  >
                    {t('start.modal.login_link')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal · Business */}
      {modal === 'business' && (
        <div
          className={`${styles.modalOverlay} ${styles.open}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              resetRoleForm();
              handleRoleFormDone();
            }
          }}
        >
          <div className={`${styles.modalCard} ${styles.modalCardBiz}`}>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => {
                resetRoleForm();
                handleRoleFormDone();
              }}
            >
              ✕
            </button>
            <div className={styles.modalLogo}>
              <span className="brand on-dark" aria-label="Conniku">
                conn<span>i</span>
                <span className="k-letter">k</span>
                <span className="u-pack">
                  <span className="u-letter">u</span>
                  <span className="dot"></span>
                </span>
              </span>
            </div>
            <div className={styles.modalBadge}>{t('register.business.badge')}</div>
            <div className={styles.modalSep} />
            {/* Tab switcher */}
            <div className={styles.bizTabs}>
              <button
                type="button"
                className={`${styles.bizTab} ${rfBizTab === 'login' ? styles.bizTabActive : ''}`}
                onClick={() => {
                  setRfSent(false);
                  setRfBizTab('login');
                }}
              >
                {t('register.business.tab_login')}
              </button>
              <button
                type="button"
                className={`${styles.bizTab} ${rfBizTab === 'contact' ? styles.bizTabActive : ''}`}
                onClick={() => {
                  setRfSent(false);
                  setRfBizTab('contact');
                }}
              >
                {t('register.business.tab_contact')}
              </button>
            </div>

            {rfBizTab === 'login' ? (
              <>
                <div className={styles.modalTitle}>{t('register.business.login_title')}</div>
                <div className={styles.modalSub}>{t('register.business.login_sub')}</div>
                <div className={styles.modalSep} />
                <div className={styles.mfGroup}>
                  <label className={styles.mfLabel}>{t('start.modal.email')}</label>
                  <input
                    className={styles.mfInput}
                    type="email"
                    placeholder={t('start.modal.email_ph')}
                    value={rfEmail}
                    onChange={(e) => setRfEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div className={styles.mfGroup}>
                  <label className={styles.mfLabel}>
                    {t('start.modal.password')}
                    <a className={styles.mfLink} href="#" onClick={handleForgot}>
                      {t('start.modal.forgot')}
                    </a>
                  </label>
                  <input
                    className={styles.mfInput}
                    type="password"
                    placeholder={t('start.modal.pass_ph')}
                    value={rfPass}
                    onChange={(e) => setRfPass(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
                <button type="button" className={styles.modalBtn} onClick={handleLogin}>
                  {t('start.modal.btn_login')}
                </button>
              </>
            ) : rfSent ? (
              <div className={styles.modalSentBox}>
                <div className={styles.modalSentIcon}>✓</div>
                <div className={styles.modalSentTitle}>{t('register.business.sent_title')}</div>
                <div className={styles.modalSentText}>{t('register.business.sent_text')}</div>
                <button
                  className={styles.modalBtn}
                  onClick={() => {
                    resetRoleForm();
                    handleRoleFormDone();
                  }}
                >
                  {t('careers.modal.close')}
                </button>
              </div>
            ) : (
              <>
                <div className={styles.modalTitle}>{t('register.business.contact_title')}</div>
                <div className={styles.modalSub}>{t('register.business.contact_sub')}</div>
                <div className={styles.modalSep} />
                {/* Modules info */}
                <div className={styles.bizModulesWrap}>
                  <div className={styles.bizModulesLabel}>
                    {t('register.business.modules_title')}
                  </div>
                  <ul className={styles.bizModulesList}>
                    <li>◈ {t('register.business.module_mi_empresa')}</li>
                    <li>◈ {t('register.business.module_workspace')}</li>
                    <li>◈ {t('register.business.module_analytics')}</li>
                    <li>◈ {t('register.business.module_hr')}</li>
                  </ul>
                </div>
                <form onSubmit={handleBizContactSubmit}>
                  <div className={styles.mfRow}>
                    <div className={styles.mfGroup}>
                      <label className={styles.mfLabel}>{t('start.modal.nombre')}</label>
                      <input
                        className={styles.mfInput}
                        type="text"
                        placeholder={t('start.modal.nombre_ph')}
                        value={rfNombre}
                        onChange={(e) => setRfNombre(e.target.value)}
                        required
                        minLength={2}
                        autoComplete="given-name"
                      />
                    </div>
                    <div className={styles.mfGroup}>
                      <label className={styles.mfLabel}>{t('start.modal.email')}</label>
                      <input
                        className={styles.mfInput}
                        type="email"
                        placeholder={t('start.modal.email_ph')}
                        value={rfEmail}
                        onChange={(e) => setRfEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>
                  <div className={styles.mfRow}>
                    <div className={styles.mfGroup}>
                      <label className={styles.mfLabel}>{t('register.business.empresa')}</label>
                      <input
                        className={styles.mfInput}
                        type="text"
                        placeholder={t('register.business.empresa_ph')}
                        value={rfEmpresa}
                        onChange={(e) => setRfEmpresa(e.target.value)}
                        required
                        maxLength={100}
                      />
                    </div>
                    <div className={styles.mfGroup}>
                      <label className={styles.mfLabel}>{t('register.business.cargo')}</label>
                      <input
                        className={styles.mfInput}
                        type="text"
                        placeholder={t('register.business.cargo_ph')}
                        value={rfCargo}
                        onChange={(e) => setRfCargo(e.target.value)}
                        required
                        maxLength={80}
                      />
                    </div>
                  </div>
                  {rfError && <p className={styles.mfError}>{rfError}</p>}
                  <button
                    type="submit"
                    className={`${styles.modalBtn} ${styles.modalBtnAmber}`}
                    disabled={rfSending}
                  >
                    {rfSending ? t('register.business.sending') : t('register.business.send')}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
