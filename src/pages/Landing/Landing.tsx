/**
 * Landing.tsx
 * Módulo 02 — Landing tab-based SPA dark theme.
 * Fuente de verdad visual: FINAL HTML/01-landing-20260419-1650.html
 * Especificación: Instrucciones/02-landing-20260419-1650.md §MODULE.02.02
 *
 * Props: onLogin / onRegister — mismo contrato que Landing legacy (Landing.tsx)
 * El legacy queda en src/pages/Landing.tsx como respaldo pero no se renderiza.
 *
 * Decisiones de copy aplicadas (ver también COPY NOTES en cada sección):
 * - "127" count pill → "comunidad activa" (no estadística inventada)
 * - "+70k títulos" / "+70k" → "biblioteca extensa" (regla §RULES.01.3 no inventar cifras)
 * - "+30 Días Pro" stat phone mock → "Activo" (no stat inventada)
 * - "Pía Ramírez" → "Estudiante" + iniciales "PR" (no nombre real)
 *
 * Decisiones de navegación (batch 2026-04-20):
 * - Brand logo → vuelve a tab "inicio" (SPA interna, sin ruta externa)
 * - "Ver demo" → cambia a tab "producto" (panel con los 7 stickers)
 * - "Explorar" en ProductSection → queda como `#` hasta tener destino real
 * - App Store / Google Play badges → `#` hasta publicación real
 * - Business panel 9 items → `#` hasta que exista bloque Conniku Business
 *
 * Page-transition overlay: POSTPUESTO — se implementa cuando se haga auth.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './Landing.module.css';
import HeroSection from './sections/HeroSection';
import ProductSection from './sections/ProductSection';
import HowSection from './sections/HowSection';
import PricingSection from './sections/PricingSection';
import AppSection from './sections/AppSection';
import BusinessPanel from './sections/BusinessPanel';

/* ─── Tipos ─────────────────────────────────────────────────── */
type TabKey = 'inicio' | 'producto' | 'como' | 'planes' | 'app';

interface LandingProps {
  onLogin: () => void;
  onRegister: () => void;
}

/* ─── Definición de tabs ─────────────────────────────────────── */
const TABS: { key: TabKey; label: string }[] = [
  { key: 'inicio', label: 'Inicio' },
  { key: 'producto', label: 'Producto' },
  { key: 'como', label: 'Cómo funciona' },
  { key: 'planes', label: 'Planes' },
  { key: 'app', label: 'Descarga' },
];

/* ─── Componente principal ───────────────────────────────────── */
export default function Landing({ onLogin, onRegister }: LandingProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('inicio');
  const [businessOpen, setBusinessOpen] = useState(false);

  const businessPanelRef = useRef<HTMLDivElement>(null);
  const businessBtnRef = useRef<HTMLButtonElement>(null);
  const panelFxRef = useRef<HTMLDivElement>(null);

  /* Cerrar business panel al hacer click fuera */
  const handleDocumentClick = useCallback(
    (e: MouseEvent) => {
      if (!businessOpen) return;
      const target = e.target as Node;
      if (businessPanelRef.current?.contains(target) || businessBtnRef.current?.contains(target)) {
        return;
      }
      setBusinessOpen(false);
    },
    [businessOpen]
  );

  /* Cerrar business panel con Escape */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setBusinessOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleDocumentClick, handleKeyDown]);

  /* Bouncing motor — port directo del código oficial del FINAL HTML
   * (líneas 1210-1268) con extensión: colisión también con botones
   * "Entrar gratis", "Ver demo" y app icon (efecto DVD).
   *
   * Cada partícula tiene velocidad + dirección INDEPENDIENTE (random angle).
   * Rebote en bordes con variación aleatoria (0.92 + random*0.16) para
   * sensación no robótica. minSpeed por tipo: nunca se detienen.
   * Opacidad y blur únicos por partícula aplicados al inicio.
   * Pausa en visibilitychange. Respeta prefers-reduced-motion. */
  useEffect(() => {
    const container = panelFxRef.current;
    if (!container) return;
    if (typeof window.matchMedia === 'function') {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    }
    if (typeof requestAnimationFrame !== 'function') return;

    type Body = {
      el: HTMLElement;
      isFar: boolean;
      isMid: boolean;
      initLeft: number;
      initTop: number;
      w: number;
      h: number;
      tx: number;
      ty: number;
      vx: number;
      vy: number;
      minSpeed: number;
    };

    const bodies: Body[] = [];
    const containerRect = container.getBoundingClientRect();
    const allChildren = Array.from(container.children) as HTMLElement[];

    for (const el of allChildren) {
      const cls = el.className;
      const isFar = cls.includes(styles.lightFar);
      const isMid = cls.includes(styles.lightMid);
      const isSp = cls.includes(styles.sp);
      if (!isFar && !isMid && !isSp) continue;

      const rect = el.getBoundingClientRect();
      const initLeft = rect.left - containerRect.left;
      const initTop = rect.top - containerRect.top;
      const w = rect.width;
      const h = rect.height;

      // Velocidad base por tipo (px/frame a 60fps)
      let base: number;
      if (isFar) base = 0.15 + Math.random() * 0.3;
      else if (isMid) base = 0.25 + Math.random() * 0.45;
      else base = 0.6 + Math.random() * 1.6;

      const angle = Math.random() * Math.PI * 2;

      // Opacidad única por partícula
      let opacity: number;
      if (isFar) opacity = 0.22 + Math.random() * 0.38;
      else if (isMid) opacity = 0.28 + Math.random() * 0.42;
      else opacity = 0.7 + Math.random() * 0.3;

      // Blur único por partícula
      let blur: number;
      if (isFar) blur = 40 + Math.random() * 60;
      else if (isMid) blur = 14 + Math.random() * 34;
      else blur = Math.random() * 5;

      el.style.opacity = opacity.toFixed(3);
      el.style.filter = `blur(${blur.toFixed(2)}px)`;

      bodies.push({
        el,
        isFar,
        isMid,
        initLeft,
        initTop,
        w,
        h,
        tx: 0,
        ty: 0,
        vx: Math.cos(angle) * base,
        vy: Math.sin(angle) * base,
        minSpeed: isFar ? 0.12 : isMid ? 0.22 : 0.5,
      });
    }

    let containerW = container.clientWidth;
    let containerH = container.clientHeight;
    const onResize = () => {
      containerW = container.clientWidth;
      containerH = container.clientHeight;
    };
    window.addEventListener('resize', onResize);

    // Obstáculos: solo botones del hero (Entrar gratis, Ver demo) + app icon.
    // Refresca cada 1s para adaptarse al cambio de tab.
    type Obstacle = { left: number; top: number; right: number; bottom: number };
    let obstacles: Obstacle[] = [];

    const refreshObstacles = () => {
      const root = container.parentElement;
      if (!root) return;
      const targets: Element[] = [];
      // App icon
      const appIcon = root.querySelector('#hero-app-icon');
      if (appIcon) targets.push(appIcon);
      // Botones del hero (Entrar gratis + Ver demo) — solo en tab "inicio"
      root.querySelectorAll('button').forEach((b) => {
        const txt = b.textContent || '';
        if (txt.includes('Entrar gratis') || txt.includes('Ver demo')) targets.push(b);
      });
      const cRect = container.getBoundingClientRect();
      obstacles = targets
        .map((n) => {
          const r = (n as HTMLElement).getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return null;
          return {
            left: r.left - cRect.left,
            top: r.top - cRect.top,
            right: r.right - cRect.left,
            bottom: r.bottom - cRect.top,
          };
        })
        .filter((x): x is Obstacle => x !== null);
    };
    refreshObstacles();
    const obstaclesInterval = window.setInterval(refreshObstacles, 1000);

    let raf = 0;
    const step = () => {
      for (const s of bodies) {
        const prevTx = s.tx;
        const prevTy = s.ty;
        s.tx += s.vx;
        s.ty += s.vy;

        const left = s.initLeft + s.tx;
        const top = s.initTop + s.ty;
        const right = left + s.w;
        const bottom = top + s.h;

        // Rebote bordes pantalla (efecto DVD) con variación aleatoria
        if (left < 0 && s.vx < 0) {
          s.vx = -s.vx * (0.92 + Math.random() * 0.16);
          s.vy += (Math.random() - 0.5) * 0.4;
        } else if (right > containerW && s.vx > 0) {
          s.vx = -s.vx * (0.92 + Math.random() * 0.16);
          s.vy += (Math.random() - 0.5) * 0.4;
        }
        if (top < 0 && s.vy < 0) {
          s.vy = -s.vy * (0.92 + Math.random() * 0.16);
          s.vx += (Math.random() - 0.5) * 0.4;
        } else if (bottom > containerH && s.vy > 0) {
          s.vy = -s.vy * (0.92 + Math.random() * 0.16);
          s.vx += (Math.random() - 0.5) * 0.4;
        }

        // Rebote contra obstáculos (solo splatter dots — far/mid son blur
        // grandes, rebotar contra cada botón haría caos visual)
        if (!s.isFar && !s.isMid) {
          const cl = s.initLeft + s.tx;
          const ct = s.initTop + s.ty;
          const cr = cl + s.w;
          const cb = ct + s.h;
          for (const o of obstacles) {
            if (cr > o.left && cl < o.right && cb > o.top && ct < o.bottom) {
              const prevLeft = s.initLeft + prevTx;
              const prevRight = prevLeft + s.w;
              const prevTop = s.initTop + prevTy;
              const prevBottom = prevTop + s.h;
              const fromLeft = prevRight <= o.left;
              const fromRight = prevLeft >= o.right;
              const fromTop = prevBottom <= o.top;
              const fromBottom = prevTop >= o.bottom;
              if (fromLeft || fromRight) {
                s.vx = -s.vx * (0.92 + Math.random() * 0.16);
                s.vy += (Math.random() - 0.5) * 0.4;
                s.tx = prevTx;
              } else if (fromTop || fromBottom) {
                s.vy = -s.vy * (0.92 + Math.random() * 0.16);
                s.vx += (Math.random() - 0.5) * 0.4;
                s.ty = prevTy;
              } else {
                s.vx = -s.vx;
                s.vy = -s.vy;
                s.tx = prevTx;
                s.ty = prevTy;
              }
              break;
            }
          }
        }

        // Mantener velocidad mínima (nunca se detiene)
        const sp = Math.hypot(s.vx, s.vy);
        if (sp < s.minSpeed) {
          const ang = Math.atan2(s.vy, s.vx) || Math.random() * Math.PI * 2;
          s.vx = Math.cos(ang) * s.minSpeed;
          s.vy = Math.sin(ang) * s.minSpeed;
        }

        s.el.style.transform = `translate3d(${s.tx}px,${s.ty}px,0)`;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(step);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(obstaclesInterval);
      cancelAnimationFrame(raf);
    };
  }, []);

  const handleTabClick = (key: TabKey) => {
    setActiveTab(key);
    // Cerrar business panel al cambiar de tab
    setBusinessOpen(false);
  };

  const handleBusinessToggle = () => {
    setBusinessOpen((prev) => !prev);
  };

  return (
    <div
      className={styles.landing}
      style={{ flex: 1, height: '100vh', overflow: 'hidden', background: '#0d0f10' }}
    >
      {/* Partículas globales — blobs blur + splatter dots + tipografía editorial.
          Animación JS bouncing tipo DVD: cada partícula con vector independiente,
          rebote en bordes + colisión con botones hero (Entrar gratis, Ver demo)
          y app icon. Opacidad y blur únicos por partícula. */}
      <div ref={panelFxRef} className={styles.panelFx} aria-hidden="true">
        {/* Capa 1: tipografía editorial gigante de fondo (palabras académicas
            con outline + paleta lime/pink/cream — sello magazine cover Conniku) */}
        <span className={`${styles.bgTypo} ${styles.bgTypo1}`}>WORKSPACES</span>
        <span className={`${styles.bgTypo} ${styles.bgTypo2}`}>ATHENA</span>
        <span className={`${styles.bgTypo} ${styles.bgTypo3}`}>TUTORÍAS</span>
        <span className={`${styles.bgTypo} ${styles.bgTypo4}`}>COMUNIDAD</span>
        <span className={`${styles.bgTypo} ${styles.bgTypo5}`}>DIPLOMA</span>

        {/* Blobs large (light-far) */}
        <span
          className={`${styles.lightFar} ${styles.lfLime}`}
          style={{ top: '-80px', right: '-60px', width: '420px', height: '420px' }}
        />
        <span
          className={`${styles.lightFar} ${styles.lfPink}`}
          style={{ top: '40%', left: '-100px', width: '360px', height: '360px' }}
        />
        <span
          className={`${styles.lightFar} ${styles.lfViolet}`}
          style={{ top: '30%', right: '-120px', width: '300px', height: '300px' }}
        />
        <span
          className={`${styles.lightFar} ${styles.lfCyan}`}
          style={{ bottom: '-80px', left: '40%', width: '280px', height: '280px' }}
        />
        <span
          className={`${styles.lightFar} ${styles.lfCream}`}
          style={{ top: '60%', right: '20%', width: '240px', height: '240px' }}
        />
        {/* Blobs medium (light-mid) */}
        <span
          className={`${styles.lightMid} ${styles.lfPink}`}
          style={{ top: '8%', left: '6%', width: '100px', height: '100px' }}
        />
        <span
          className={`${styles.lightMid} ${styles.lfLime}`}
          style={{ top: '50%', left: '42%', width: '90px', height: '90px' }}
        />
        <span
          className={`${styles.lightMid} ${styles.lfCyan}`}
          style={{ top: '72%', right: '8%', width: '100px', height: '100px' }}
        />
        <span
          className={`${styles.lightMid} ${styles.lfViolet}`}
          style={{ bottom: '18%', left: '14%', width: '110px', height: '110px' }}
        />
        {/* Splatter dots (sp) */}
        <span
          className={`${styles.sp} ${styles.spPink}`}
          style={{ top: '5%', left: '18%', width: '8px', height: '8px' }}
        />
        <span
          className={`${styles.sp} ${styles.spLime}`}
          style={{ top: '8%', left: '52%', width: '12px', height: '12px' }}
        />
        <span
          className={`${styles.sp} ${styles.spCyan}`}
          style={{ top: '3%', left: '74%', width: '5px', height: '5px' }}
        />
        <span
          className={`${styles.sp} ${styles.spViolet}`}
          style={{ top: '12%', left: '28%', width: '6px', height: '6px' }}
        />
        <span
          className={`${styles.sp} ${styles.spCream}`}
          style={{ top: '14%', left: '86%', width: '14px', height: '14px' }}
        />
        <span
          className={`${styles.sp} ${styles.spPink}`}
          style={{ top: '22%', left: '8%', width: '18px', height: '18px' }}
        />
        <span
          className={`${styles.sp} ${styles.spCyan}`}
          style={{ top: '28%', left: '62%', width: '10px', height: '10px' }}
        />
        <span
          className={`${styles.sp} ${styles.spViolet}`}
          style={{ top: '32%', left: '90%', width: '8px', height: '8px' }}
        />
        <span
          className={`${styles.sp} ${styles.spLime}`}
          style={{ top: '38%', left: '24%', width: '7px', height: '7px' }}
        />
        <span
          className={`${styles.sp} ${styles.spPink}`}
          style={{ top: '42%', left: '48%', width: '6px', height: '6px' }}
        />
        <span
          className={`${styles.sp} ${styles.spCream}`}
          style={{ top: '48%', left: '72%', width: '12px', height: '12px' }}
        />
        <span
          className={`${styles.sp} ${styles.spCyan}`}
          style={{ top: '52%', left: '12%', width: '4px', height: '4px' }}
        />
        <span
          className={`${styles.sp} ${styles.spLime}`}
          style={{ top: '56%', left: '38%', width: '9px', height: '9px' }}
        />
        <span
          className={`${styles.sp} ${styles.spViolet}`}
          style={{ top: '60%', left: '82%', width: '11px', height: '11px' }}
        />
        <span
          className={`${styles.sp} ${styles.spPink}`}
          style={{ top: '66%', left: '22%', width: '5px', height: '5px' }}
        />
        <span
          className={`${styles.sp} ${styles.spCream}`}
          style={{ top: '70%', left: '54%', width: '7px', height: '7px' }}
        />
        <span
          className={`${styles.sp} ${styles.spCyan}`}
          style={{ top: '74%', left: '14%', width: '14px', height: '14px' }}
        />
        <span
          className={`${styles.sp} ${styles.spViolet}`}
          style={{ top: '78%', left: '66%', width: '6px', height: '6px' }}
        />
        <span
          className={`${styles.sp} ${styles.spLime}`}
          style={{ top: '82%', left: '40%', width: '8px', height: '8px' }}
        />
        <span
          className={`${styles.sp} ${styles.spPink}`}
          style={{ top: '86%', left: '8%', width: '10px', height: '10px' }}
        />
        <span
          className={`${styles.sp} ${styles.spCream}`}
          style={{ top: '90%', left: '78%', width: '6px', height: '6px' }}
        />
        <span
          className={`${styles.sp} ${styles.spCyan}`}
          style={{ top: '94%', left: '32%', width: '9px', height: '9px' }}
        />
        <span
          className={`${styles.sp} ${styles.spViolet}`}
          style={{ top: '16%', left: '44%', width: '5px', height: '5px' }}
        />
        <span
          className={`${styles.sp} ${styles.spPink}`}
          style={{ top: '45%', left: '92%', width: '7px', height: '7px' }}
        />
      </div>

      {/* ═══ NAV + TABS ═══ */}
      <nav className={styles.nav} aria-label="Navegación principal">
        {/* Brand logo · destino: tab "inicio" (SPA)
            Estructura canónica del wordmark según LOGO.SPEC §LOGO.03:
            conn<span>i</span>k<span class="u-pack">u<span class="dot">.</span></span> */}
        <a
          className={styles.brand}
          href="#inicio"
          aria-label="Conniku"
          onClick={(e) => {
            e.preventDefault();
            handleTabClick('inicio');
          }}
        >
          conn<span>i</span>k
          <span className={styles.uPack}>
            u<span className={styles.brandDot}>.</span>
          </span>
        </a>

        {/* Tabs internas (no cambian URL) */}
        <div className={styles.tabs} role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              className={`${styles.tabBtn}${activeTab === tab.key ? ` ${styles.active}` : ''}`}
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`panel-${tab.key}`}
              tabIndex={activeTab === tab.key ? 0 : -1}
              onClick={() => handleTabClick(tab.key)}
              type="button"
            >
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Conniku Business dropdown */}
        <BusinessPanel
          isOpen={businessOpen}
          onToggle={handleBusinessToggle}
          panelRef={businessPanelRef}
          btnRef={businessBtnRef}
        />

        {/* CTAs de autenticación */}
        <div className={styles.ctaRow}>
          <button className={styles.btnGhost} onClick={onLogin} type="button">
            Entrar
          </button>
          <button className={styles.btnPrimary} onClick={onRegister} type="button">
            Crear cuenta <span className={styles.ring}>→</span>
          </button>
        </div>
      </nav>

      {/* ═══ CONTENEDOR DE TABS ═══ */}
      <main className={styles.tabContainer}>
        {/* Tab 1: Inicio */}
        <section
          className={`${styles.tabPanel}${activeTab === 'inicio' ? ` ${styles.active}` : ''}`}
          id="panel-inicio"
          role="tabpanel"
          aria-labelledby="tab-inicio"
        >
          <HeroSection onRegister={onRegister} onGoToProducto={() => handleTabClick('producto')} />
        </section>

        {/* Tab 2: Producto */}
        <section
          className={`${styles.tabPanel}${activeTab === 'producto' ? ` ${styles.active}` : ''}`}
          id="panel-producto"
          role="tabpanel"
          aria-labelledby="tab-producto"
        >
          <ProductSection />
        </section>

        {/* Tab 3: Cómo funciona */}
        <section
          className={`${styles.tabPanel}${activeTab === 'como' ? ` ${styles.active}` : ''}`}
          id="panel-como"
          role="tabpanel"
          aria-labelledby="tab-como"
        >
          <HowSection onRegister={onRegister} />
        </section>

        {/* Tab 4: Planes */}
        <section
          className={`${styles.tabPanel}${activeTab === 'planes' ? ` ${styles.active}` : ''}`}
          id="panel-planes"
          role="tabpanel"
          aria-labelledby="tab-planes"
        >
          <PricingSection onRegister={onRegister} />
        </section>

        {/* Tab 5: Descarga */}
        <section
          className={`${styles.tabPanel}${activeTab === 'app' ? ` ${styles.active}` : ''}`}
          id="panel-app"
          role="tabpanel"
          aria-labelledby="tab-app"
        >
          <AppSection />
        </section>
      </main>
    </div>
  );
}
