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
 * - App Store / Google Play → PENDING_USER_INSTRUCTION (href="#" + preventDefault)
 * - Ver demo, Explorar, Brand logo → PENDING_USER_INSTRUCTION
 * - Business panel items → PENDING (apuntarán a /business/{slug})
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
const TABS: { key: TabKey; num: string; label: string }[] = [
  { key: 'inicio', num: '01', label: 'Inicio' },
  { key: 'producto', num: '02', label: 'Producto' },
  { key: 'como', num: '03', label: 'Cómo funciona' },
  { key: 'planes', num: '04', label: 'Planes' },
  { key: 'app', num: '05', label: 'Descarga' },
];

/* ─── Componente principal ───────────────────────────────────── */
export default function Landing({ onLogin, onRegister }: LandingProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('inicio');
  const [businessOpen, setBusinessOpen] = useState(false);

  const businessPanelRef = useRef<HTMLDivElement>(null);
  const businessBtnRef = useRef<HTMLButtonElement>(null);

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
      {/* Partículas globales — blobs blur + splatter dots */}
      <div className={styles.panelFx} aria-hidden="true">
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
        {/* Brand logo
            TODO: PENDING destination — destino del logo — espera instrucción de Cristian
            Por ahora href="#" con preventDefault */}
        <a
          className={styles.brand}
          href="#"
          aria-label="Conniku"
          onClick={(e) => e.preventDefault()}
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
              <span className={styles.tabNum}>{tab.num}</span>
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
          <HeroSection onRegister={onRegister} />
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
