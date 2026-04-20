/**
 * ProductSection.tsx
 * Tab "Producto" — 7 sticker cards + CTA card.
 * Fuente: FINAL HTML/01-landing-20260419-1650.html líneas 904-954
 *
 * COPY NOTES:
 * - "Biblioteca +70k" → "Biblioteca extensa" (regla §RULES.01.3 no inventar
 *   cifras; el número exacto del catálogo no está respaldado verificable).
 * - "Garantía antifraude real" → "Pago intermediado por Conniku" (no promesa
 *   comercial no verificable, regla §RULES.01.3).
 * - "Explorar" en ci-btn es PENDING_USER_INSTRUCTION — mantiene estructura
 *   visual con button sin handler real.
 */
import React from 'react';
import styles from '../Landing.module.css';

export default function ProductSection() {
  return (
    <div className={styles.panelInner}>
      <div className={styles.productHead}>
        <span className={styles.kicker}>lo que hace Conniku</span>
        <h2 className={styles.sectionH2}>
          Todo lo que necesitas, <span className={styles.hl}>en un solo lugar</span>.
        </h2>
      </div>

      <div className={styles.stickersGrid}>
        <div className={`${styles.stk} ${styles.stkLime}`}>
          <span className={styles.stkNum}>01</span>
          <h3>Calendario sincronizado</h3>
          <p>Tu semestre al día. Asignaturas, entregas, clases en tiempo real.</p>
        </div>

        <div className={`${styles.stk} ${styles.stkPink}`}>
          <span className={styles.stkNum}>02</span>
          <h3>Documentos con conversación</h3>
          <p>Chatea con tu material y con cada libro de la biblioteca.</p>
        </div>

        <div className={`${styles.stk} ${styles.stkCream}`}>
          <span className={styles.stkNum}>03</span>
          <h3>Escritura académica asistida</h3>
          <p>Athena revisa tus informes con sugerencias concretas. Citas, fuentes, coherencia.</p>
        </div>

        <div className={`${styles.stk} ${styles.stkInk}`}>
          <span className={styles.stkNum}>04</span>
          <h3>Biblioteca extensa</h3>
          <p>Académicos y generales. Por tu carrera. Offline disponible.</p>
        </div>

        <div className={`${styles.stk} ${styles.stkViolet}`}>
          <span className={styles.stkNum}>05</span>
          <h3>Tutorías verificadas</h3>
          <p>Titulados verificados. Pago intermediado por Conniku.</p>
        </div>

        <div className={`${styles.stk} ${styles.stkCyan}`}>
          <span className={styles.stkNum}>06</span>
          <h3>CV asistido + empleo</h3>
          <p>Editor de CV y ofertas filtradas por carrera con porcentaje de match.</p>
        </div>

        <div className={`${styles.stk} ${styles.stkWhite}`}>
          <span className={styles.stkNum}>07</span>
          <h3>Cursos + Diploma Conniku</h3>
          <p>Formación certificable con hash verificable. Suma a tu perfil profesional.</p>
        </div>

        <div className={styles.ctaInlineCard}>
          <span className={styles.cicLabel}>+ próximamente</span>
          <h4>Comunidades por carrera, quizzes colaborativos y más.</h4>
          {/* TODO: PENDING destination — "Explorar" — espera instrucción de Cristian */}
          <button className={styles.ciBtn} type="button" onClick={(e) => e.preventDefault()}>
            Explorar <span className={styles.ringMini}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
