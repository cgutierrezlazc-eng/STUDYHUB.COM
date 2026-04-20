/**
 * HeroSection.tsx
 * Tab "Inicio" — hero + CTAs + visual icon.
 * Fuente: FINAL HTML/01-landing-20260419-1650.html líneas 872-902
 *
 * COPY NOTES:
 * - "127" (count en pill del HTML fuente) reemplazado por "comunidad activa"
 *   para no mostrar estadísticas de plataforma inventadas.
 * - "Entrar gratis" navega a /register (según MODULE.02.02 Connections)
 * - "Ver demo" es PENDING_USER_INSTRUCTION — mantiene estructura sin handler
 */
import React from 'react';
import styles from '../Landing.module.css';

interface HeroSectionProps {
  onRegister: () => void;
}

export default function HeroSection({ onRegister }: HeroSectionProps) {
  return (
    <div className={styles.heroInner}>
      {/* Columna izquierda: copy + CTAs */}
      <div>
        {/* COPY NOTE: "127" del HTML original reemplazado por "comunidad activa"
            para no publicar estadísticas inventadas (regla del proyecto) */}
        <div className={styles.labelPill}>
          <span className={styles.dot}></span>
          <span>comunidad activa</span>
        </div>

        <h1 className={styles.heroH1}>
          Tu <span className={styles.uBig}>U</span>niversidad
          <span className={styles.chipAccent}>entera</span>.<br />
          <span className={styles.outline}>En una sola app</span>
          <span className={styles.dotFinal}>.</span>
        </h1>

        <p className={styles.lead}>
          Calendario sincronizado, documentos con conversación, tutores verificados, biblioteca,
          empleo asistido y diploma propio. <strong>Todo en un lugar.</strong>
        </p>

        <div className={styles.heroMeta}>
          <span className={styles.item}>
            <span className={styles.d}></span>Gratis para empezar
          </span>
          <span className={styles.item}>
            <span className={styles.d}></span>Sin tarjeta
          </span>
          <span className={styles.item}>
            <span className={styles.d}></span>+18 años
          </span>
        </div>

        <div className={styles.heroCtas}>
          <button
            className={`${styles.btnHero} ${styles.btnHeroPrimary}`}
            onClick={onRegister}
            type="button"
          >
            Entrar gratis <span className={styles.ringBig}>→</span>
          </button>
          {/* TODO: PENDING destination — "Ver demo" — espera instrucción de Cristian */}
          <button
            className={`${styles.btnHero} ${styles.btnHeroSecondary}`}
            type="button"
            onClick={(e) => e.preventDefault()}
          >
            Ver demo
          </button>
        </div>
      </div>

      {/* Columna derecha: ícono de app */}
      <div className={styles.heroVisual}>
        <div className={styles.bigIcon}>
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }} aria-hidden="true">
            <rect width="100" height="100" rx="22" fill="#D9FF3A" />
            <text
              x="50"
              y="71"
              textAnchor="middle"
              fontFamily="Funnel Display, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="84"
              fill="#0D0F10"
              letterSpacing="-4"
            >
              u
            </text>
            <circle cx="77" cy="68" r="6" fill="#FF4A1C" />
          </svg>
        </div>
      </div>
    </div>
  );
}
