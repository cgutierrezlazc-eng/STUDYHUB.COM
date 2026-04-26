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
import styles from './Start.module.css';

type ModalKind = null | 'entrar' | 'crear';

const RADII = [85, 140, 195, 250, 305];
const ARM_IDS = ['arm-conniku', 'arm-tutores', 'arm-empleos', 'arm-entrar', 'arm-crear'];

const PCONF = [
  { armId: 'arm-conniku', visId: 'vis-conniku', btnKey: 'pb-conniku', target: 0, triggerAt: 1000 },
  { armId: 'arm-entrar', visId: 'vis-entrar', btnKey: 'pb-entrar', target: 180, triggerAt: 2200 },
  { armId: 'arm-crear', visId: 'vis-crear', btnKey: 'pb-crear', target: 180, triggerAt: 3400 },
];

export default function Start() {
  const navigate = useNavigate();
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
      startReveal();
      return;
    }
    // Durante la animación del reveal (~6 s) el click no responde.
    // El original hacía wrap.onclick=null y reasignaba al final.
    if (!revealedRef.current) return;
    // TODO: cuando se bridgee conniku.html en CONNIKU, navegar ahí.
    go('/');
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
    // TODO: cuando se cablee el backend, llamar al endpoint de registro.
    alert('Registro pendiente · backend por cablear');
    setModal(null);
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
        <span>Conoce el Universo Conniku</span>
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
        <span>entrar</span>
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
        <span>crear cuenta gratis</span>
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
        <div className={styles.paBadge}>ORBIT-U · CONNIKU</div>
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
        <div className={styles.paProduct}>ORBIT · U</div>
        <div className={styles.paSep} />
        <div className={styles.paTagline}>
          El <em>sistema operativo</em> de tu vida universitaria.
        </div>
        <div className={styles.paSub}>
          MENSAJES · WORKSPACE · BIBLIOTECA
          <br />
          TUTORES · EMPLEOS · COMUNIDAD
        </div>
        <div className={styles.paSep2} />
        <div className={styles.paDesc}>
          Todo lo que necesitas para tu carrera universitaria,{' '}
          <strong>integrado en una sola plataforma.</strong> Hecha para la realidad latinoamericana.
        </div>
        <div className={styles.paStats}>
          <div className={styles.paStat}>
            <div className={styles.paStatN}>9</div>
            <div className={styles.paStatL}>MÓDULOS</div>
          </div>
          <div className={styles.paStat}>
            <div className={styles.paStatN}>1</div>
            <div className={styles.paStatL}>PLATAFORMA</div>
          </div>
          <div className={styles.paStat}>
            <div className={styles.paStatN}>∞</div>
            <div className={styles.paStatL}>POSIBILIDADES</div>
          </div>
          <div className={styles.paStat}>
            <div className={styles.paStatN}>CL</div>
            <div className={styles.paStatL}>LATINOAMÉRICA</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.siteFooter}>
        <span className={styles.footerCopy}>
          © 2026 Conniku SpA · Todos los derechos reservados
        </span>
        <nav className={styles.footerLinks}>
          <Link to="/terms">Términos de servicio</Link>
          <div className={styles.footerSep} />
          <Link to="/privacy">Política de privacidad</Link>
          <div className={styles.footerSep} />
          <Link to="/support">Soporte</Link>
          <div className={styles.footerSep} />
          <Link to="/contact">Contacto</Link>
          <div className={styles.footerSep} />
          <Link to="/careers">Trabaja con nosotros</Link>
        </nav>
      </footer>

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
            <div className={styles.modalTitle}>Bienvenido de vuelta</div>
            <div className={styles.modalSub}>Accede a tu cuenta Conniku</div>
            <div className={styles.modalSep} />
            <div className={styles.mfGroup}>
              <label className={styles.mfLabel}>Correo electrónico</label>
              <input
                className={styles.mfInput}
                type="email"
                placeholder="tu@universidad.cl"
                id="loginEmail"
                autoComplete="email"
              />
            </div>
            <div className={styles.mfGroup}>
              <label className={styles.mfLabel}>
                Contraseña
                <a className={styles.mfLink} href="#" onClick={handleForgot}>
                  ¿Olvidaste tu contraseña?
                </a>
              </label>
              <input
                className={styles.mfInput}
                type="password"
                placeholder="••••••••"
                id="loginPass"
                autoComplete="current-password"
              />
            </div>
            <button type="button" className={styles.modalBtn} onClick={handleLogin}>
              Entrar →
            </button>
            <div className={styles.modalSwitch}>
              ¿No tienes cuenta?{' '}
              <button type="button" onClick={() => setModal('crear')}>
                Crear cuenta gratis
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
            <div className={styles.modalTitle}>Crea tu cuenta</div>
            <div className={styles.modalSub}>Empieza gratis · Sin tarjeta de crédito</div>
            <div className={styles.modalSep} />
            <div className={styles.mfRow}>
              <div className={styles.mfGroup}>
                <label className={styles.mfLabel}>Nombre</label>
                <input
                  className={styles.mfInput}
                  type="text"
                  placeholder="Tu nombre"
                  id="regNombre"
                  autoComplete="given-name"
                />
              </div>
              <div className={styles.mfGroup}>
                <label className={styles.mfLabel}>Apellido</label>
                <input
                  className={styles.mfInput}
                  type="text"
                  placeholder="Tu apellido"
                  id="regApellido"
                  autoComplete="family-name"
                />
              </div>
            </div>
            <div className={styles.mfGroup}>
              <label className={styles.mfLabel}>Correo electrónico</label>
              <input
                className={styles.mfInput}
                type="email"
                placeholder="tu@universidad.cl"
                id="regEmail"
                autoComplete="email"
              />
            </div>
            <div className={styles.mfGroup}>
              <label className={styles.mfLabel}>Contraseña</label>
              <input
                className={styles.mfInput}
                type="password"
                placeholder="Mínimo 8 caracteres"
                id="regPass"
                autoComplete="new-password"
              />
              <div className={styles.mfHint}>Usa letras, números y símbolos</div>
            </div>
            <div className={styles.mfGroup}>
              <label className={styles.mfLabel}>Universidad</label>
              <select className={styles.mfSelect} id="regUniv" defaultValue="">
                <option value="" disabled>
                  Selecciona tu universidad
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
              Crear cuenta gratis →
            </button>
            <div className={styles.modalSwitch}>
              ¿Ya tienes cuenta?{' '}
              <button type="button" onClick={() => setModal('entrar')}>
                Entrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
