/**
 * AppSection.tsx
 * Tab "Descarga" — badges App Store / Google Play + phone mockup.
 * Fuente: FINAL HTML/01-landing-20260419-1650.html líneas 1058-1169
 *
 * COPY NOTES (decisiones de privacidad aplicadas):
 * - "Pía Ramírez" del HTML fuente ELIMINADO. Reemplazado por iniciales "PR"
 *   sin nombre real, afiliación genérica "Medicina · 2º año" sin universidad
 *   específica (opción a del plan: no implicar partnership con UChile ni otra U).
 * - Stat "+30 Días Pro" reemplazado por "Activo" (no estadística inventada).
 * - "127" (count pill en hero) ya eliminado en HeroSection.
 * - App Store y Google Play son PENDING_USER_INSTRUCTION — estructura visual
 *   con <a> sin href real, onClick preventDefault.
 * - "comunidad activa" reemplaza "+70k títulos" en labelPill del hero.
 */
import React from 'react';
import styles from '../Landing.module.css';

export default function AppSection() {
  return (
    <div className={styles.panelInner}>
      <div className={styles.appGrid}>
        {/* Columna izquierda: copy + badges */}
        <div>
          <span className={styles.kicker}>descarga la app</span>
          <h2 className={styles.appH1}>
            Llévatelo <span className={styles.hl}>en el bolsillo</span>.
          </h2>
          <p className={styles.appDesc}>
            Conniku en iOS, Android, web y escritorio. Todo sincronizado. Todo offline-first. Tu
            universidad, siempre contigo.
          </p>

          <div className={styles.appBadges}>
            {/* TODO: PENDING destination — App Store URL — espera instrucción de Cristian */}
            <a
              className={styles.appBadge}
              href="#"
              aria-label="Descargar en App Store"
              onClick={(e) => e.preventDefault()}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              <span className={styles.appBadgeLines}>
                <span className={styles.appBadgeSmall}>Descárgalo en</span>
                <span className={styles.appBadgeBig}>App Store</span>
              </span>
            </a>

            {/* TODO: PENDING destination — Google Play URL — espera instrucción de Cristian */}
            <a
              className={styles.appBadge}
              href="#"
              aria-label="Descargar en Google Play"
              onClick={(e) => e.preventDefault()}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M3.6 2.3c-.3.3-.5.7-.5 1.3v16.8c0 .6.2 1 .5 1.3l.1.1L13.2 12v-.1L3.6 2.3z"
                  fill="#00D9FF"
                />
                <path
                  d="M16.2 15.1l-3-3v-.1l3-3 .1.1 3.6 2c1 .6 1 1.5 0 2.1l-3.6 2-.1-.1z"
                  fill="#FFCE00"
                />
                <path d="M16.3 15l-3.1-3L3.6 21.7c.3.4.9.4 1.6.1L16.3 15" fill="#FF3B3B" />
                <path d="M16.3 9L4.9 2.3c-.7-.4-1.3-.3-1.6.1l9.6 9.5 3.4-3z" fill="#00D25B" />
              </svg>
              <span className={styles.appBadgeLines}>
                <span className={styles.appBadgeSmall}>Consíguelo en</span>
                <span className={styles.appBadgeBig}>Google Play</span>
              </span>
            </a>
          </div>

          <div className={styles.appPlatforms}>
            <span className={styles.pl}>iOS</span>
            <span className={styles.pl}>Android</span>
            <span className={styles.pl}>Web</span>
            <span className={styles.pl}>macOS</span>
            <span className={styles.pl}>Windows</span>
            <span className={styles.pl}>Extensión Chrome</span>
          </div>
        </div>

        {/* Columna derecha: phone mock */}
        <div>
          <div className={styles.phoneMock}>
            <div className={styles.phoneScreen}>
              {/* Top bar */}
              <div className={styles.phTopbar}>
                <span className={styles.phBack}>←</span>
                <span className={styles.phTitleSm}>Perfil</span>
                <span className={styles.phAction}>⋯</span>
              </div>

              {/* Cover + avatar */}
              <div className={styles.phCover}></div>
              {/* COPY NOTE: Iniciales "PR" genéricas — nombre real eliminado por
                  política del proyecto (no inventar personas).
                  Ver AppSection.tsx comentario de cabecera. */}
              <div className={styles.phAvatarWrap} aria-hidden="true">
                PR
              </div>

              {/* Info usuario — SIN nombre real */}
              <div className={styles.phProfileInfo}>
                <div className={styles.phNameRow}>
                  {/* COPY NOTE: sin nombre real. "Estudiante" es genérico */}
                  <span className={styles.phName}>Estudiante</span>
                  <span className={styles.phProBadge}>★ PRO</span>
                </div>
                {/* COPY NOTE: sin universidad específica para no implicar partnership */}
                <div className={styles.phUCareer}>Medicina · 2º año</div>
              </div>

              {/* Stats */}
              <div className={styles.phStats}>
                <div className={styles.phStat}>
                  <div className={styles.phStatV}>12</div>
                  <div className={styles.phStatL}>Workspaces</div>
                </div>
                <div className={styles.phStat}>
                  <div className={styles.phStatV}>47</div>
                  <div className={styles.phStatL}>Logros</div>
                </div>
                <div className={styles.phStat}>
                  {/* COPY NOTE: "+30 Días Pro" del HTML original reemplazado
                      por "Activo" para no mostrar estadística inventada */}
                  <div className={styles.phStatV}>Activo</div>
                  <div className={styles.phStatL}>Estado Pro</div>
                </div>
              </div>

              {/* CTAs */}
              <div className={styles.phCtaRow}>
                <div className={`${styles.phBtn} ${styles.phBtnPrimary}`}>Seguir</div>
                <div className={`${styles.phBtn} ${styles.phBtnGhost}`}>Mensaje</div>
              </div>

              {/* Workspaces recientes */}
              <div className={styles.phSectionLabel}>Workspaces recientes</div>
              <div className={styles.phWsList}>
                <div className={styles.phWs}>
                  <div className={`${styles.phWsThumb} ${styles.c1}`}>Aᴬ</div>
                  <div className={styles.phWsBody}>
                    <div className={styles.phWsTitle}>Anatomía · Sist. nervioso</div>
                    <div className={styles.phWsSub}>5 miembros · hace 2h</div>
                  </div>
                  <div className={styles.phWsStatus}>LIVE</div>
                </div>
                <div className={styles.phWs}>
                  <div className={`${styles.phWsThumb} ${styles.c2}`}>Fᴾ</div>
                  <div className={styles.phWsBody}>
                    <div className={styles.phWsTitle}>Farmacología clínica I</div>
                    <div className={styles.phWsSub}>Individual · hoy</div>
                  </div>
                </div>
                <div className={styles.phWs}>
                  <div className={`${styles.phWsThumb} ${styles.c3}`}>Pᴾ</div>
                  <div className={styles.phWsBody}>
                    <div className={styles.phWsTitle}>Patología informe</div>
                    <div className={styles.phWsSub}>3 miembros · ayer</div>
                  </div>
                </div>
              </div>

              {/* Tab bar inferior */}
              <div className={styles.phTabbar}>
                <span className={styles.phTab}>⌂</span>
                <span className={styles.phTab}>⌕</span>
                <span className={styles.phTab}>✉</span>
                <span className={`${styles.phTab} ${styles.phTabActive}`}>◉</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
