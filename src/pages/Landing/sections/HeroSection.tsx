/**
 * HeroSection.tsx
 * Tab "Inicio" — hero + CTAs + visual icon.
 * Fuente: FINAL HTML/01-landing-20260419-1650.html líneas 872-902
 *
 * COPY NOTES:
 * - "127" (count en pill del HTML fuente) reemplazado por "comunidad activa"
 *   para no mostrar estadísticas de plataforma inventadas.
 * - "Entrar gratis" navega a /register (según MODULE.02.02 Connections)
 * - "Ver demo" cambia a la tab "producto" vía onGoToProducto (decisión
 *   2026-04-20: reutilizar el panel producto como demo del producto).
 */
import React from 'react';
import styles from '../Landing.module.css';

interface HeroSectionProps {
  onRegister: () => void;
  onGoToProducto: () => void;
}

export default function HeroSection({ onRegister, onGoToProducto }: HeroSectionProps) {
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

        {/* Lead — copy aprobado por Cristian (variante G5 + cierre entusiasta).
         * Workspaces como protagonista (editor academico colaborativo + Athena),
         * tutorias validadas por Conniku con tests reales, sin "IA". Cierre
         * "y muchisimo mas por venir" en strong (highlight lime) sigue el patron
         * editorial de la pagina. */}
        <p className={styles.lead}>
          Te sincroniza con tu universidad y te abre Workspaces, los espacios académicos
          colaborativos donde escribes, conversas con Athena y mejoras tus documentos junto a tus
          compañeros. Tutorías validadas por Conniku con tests reales, métricas de tu avance, chat,
          grupos de estudio, comunidad.
          <br />
          <strong>Y muchísimo más por venir.</strong>
        </p>
        <p className={styles.leadFinal}>Todo lo que tú y tu carrera necesitan, en un solo lugar.</p>

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
          {/* "Ver demo" → abre la tab Producto (panel con los 7 stickers
              que describen el producto). Decidido 2026-04-20. */}
          <button
            className={`${styles.btnHero} ${styles.btnHeroSecondary}`}
            type="button"
            onClick={onGoToProducto}
          >
            Ver demo
          </button>
        </div>
      </div>

      {/* Columna derecha: ícono de app
          id="hero-app-icon" usado por Landing.tsx para colision con particles */}
      <div className={styles.heroVisual}>
        <div id="hero-app-icon" className={styles.bigIcon}>
          <svg
            viewBox="0 0 100 100"
            style={{ width: '100%', height: '100%' }}
            aria-label="Conniku"
            role="img"
          >
            <rect width="100" height="100" rx="22" fill="#D9FF3A" />
            <text
              x="50"
              y="71"
              textAnchor="middle"
              fontFamily="Funnel Display, -apple-system, sans-serif"
              fontWeight="800"
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
