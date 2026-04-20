/**
 * HowSection.tsx
 * Tab "Cómo funciona" — 3 step cards + CTA.
 * Fuente: FINAL HTML/01-landing-20260419-1650.html líneas 956-991
 */
import React from 'react';
import styles from '../Landing.module.css';

interface HowSectionProps {
  onRegister: () => void;
}

export default function HowSection({ onRegister }: HowSectionProps) {
  return (
    <div className={styles.panelInner}>
      <div className={styles.howGrid}>
        {/* Columna izquierda: headline + CTA */}
        <div>
          <span className={styles.kicker}>cómo funciona</span>
          <h2 className={styles.howH1}>
            Tres pasos.
            <br />
            <span className={styles.hl}>Dos minutos</span>.
          </h2>
          <p className={styles.howSubtitle}>
            Sin instalación compleja. Sin papeleo. Tu cuenta queda lista antes de que termines el
            café.
          </p>
          <button
            className={`${styles.btnHero} ${styles.btnHeroPrimary}`}
            onClick={onRegister}
            type="button"
            style={{ marginTop: '24px' }}
          >
            Empezar ahora <span className={styles.ringBig}>→</span>
          </button>
        </div>

        {/* Columna derecha: step cards */}
        <div className={styles.stepsList}>
          <div className={styles.stepCard}>
            <div className={styles.stepNum}>1</div>
            <div>
              <h4>Crea tu cuenta</h4>
              <p>Regístrate con tu correo o Google. Datos esenciales únicamente.</p>
            </div>
          </div>

          <div className={styles.stepCard}>
            <div className={`${styles.stepNum} ${styles.n2}`}>2</div>
            <div>
              <h4>Verifica tu universidad</h4>
              <p>
                Vinculamos tu cuenta a tu institución para sincronizar carrera, asignaturas y
                calendario.
              </p>
            </div>
          </div>

          <div className={styles.stepCard}>
            <div className={`${styles.stepNum} ${styles.n3}`}>3</div>
            <div>
              <h4>Entra a tu nuevo hogar académico</h4>
              <p>Dashboard personalizado, workspaces listos, tutores a un clic. Estás dentro.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
