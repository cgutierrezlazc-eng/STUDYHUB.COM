/**
 * PricingSection.tsx
 * Tab "Planes" — Free/Pro + unlock strip.
 * Fuente: FINAL HTML/01-landing-20260419-1650.html líneas 993-1056
 */
import React from 'react';
import styles from '../Landing.module.css';

interface PricingSectionProps {
  onRegister: () => void;
}

export default function PricingSection({ onRegister }: PricingSectionProps) {
  return (
    <div className={styles.panelInner}>
      <div className={styles.plansHead}>
        <span className={styles.kicker}>planes</span>
        <h2 className={styles.sectionH2}>
          Empieza gratis. <span className={styles.hl}>Crece</span> cuando quieras.
        </h2>
      </div>

      <div className={styles.plansGrid}>
        {/* Plan Free */}
        <div className={`${styles.planCard} ${styles.planFree}`}>
          <span className={styles.planBadge}>★ Free · siempre gratis</span>
          <h3 className={styles.planTitle}>Conniku Free</h3>
          <p className={styles.planSubtitle}>
            Todo lo esencial. Sin tarjeta, sin límite de tiempo.
          </p>
          <ul className={styles.planFeatures}>
            <li className={styles.pfItem}>
              <div className={styles.pfCheck}>✓</div>
              <div>
                <strong>Calendario</strong> sincronizado
              </div>
            </li>
            <li className={styles.pfItem}>
              <div className={styles.pfCheck}>✓</div>
              <div>
                <strong>3 workspaces</strong> grupales activos
              </div>
            </li>
            <li className={styles.pfItem}>
              <div className={styles.pfCheck}>✓</div>
              <div>
                <strong>100 consultas</strong> mensuales a biblioteca
              </div>
            </li>
            <li className={styles.pfItem}>
              <div className={styles.pfCheck}>✓</div>
              <div>
                <strong>CV y perfil</strong> editable
              </div>
            </li>
            <li className={styles.pfItem}>
              <div className={styles.pfCheck}>✓</div>
              <div>
                <strong>3 postulaciones</strong> mensuales a ofertas
              </div>
            </li>
            <li className={styles.pfItem}>
              <div className={styles.pfCheck}>✓</div>
              <div>
                <strong>Quizzes</strong> ilimitados
              </div>
            </li>
          </ul>
          <button className={styles.planCtaBtn} onClick={onRegister} type="button">
            Entrar gratis <span className={styles.ringPc}>→</span>
          </button>
        </div>

        {/* Plan Pro */}
        <div className={`${styles.planCard} ${styles.planPro}`}>
          <span className={styles.planBadge}>★ Pro · experiencia completa</span>
          <h3 className={styles.planTitle}>Conniku Pro</h3>
          <p className={styles.planSubtitle}>Todo sin límites. Para estudiar en serio.</p>
          <ul className={styles.planFeatures}>
            <li className={styles.pfItem}>
              <div className={styles.pfCheck}>✓</div>
              <div>
                Todo lo del Free, <strong>sin topes</strong>
              </div>
            </li>
            <li className={styles.pfItem}>
              <div className={styles.pfCheck}>✓</div>
              <div>
                <strong>Biblioteca +70k</strong> con chat por libro
              </div>
            </li>
            <li className={styles.pfItem}>
              <div className={styles.pfCheck}>✓</div>
              <div>
                <strong>Workspaces ilimitados</strong> + Athena
              </div>
            </li>
            <li className={styles.pfItem}>
              <div className={styles.pfCheck}>✓</div>
              <div>
                <strong>Ofertas ilimitadas</strong> + CV asistido
              </div>
            </li>
            <li className={styles.pfItem}>
              <div className={styles.pfCheck}>✓</div>
              <div>
                <strong>Cursos + Diploma</strong> Conniku
              </div>
            </li>
            <li className={styles.pfItem}>
              <div className={styles.pfCheck}>✓</div>
              <div>
                <strong>Descuento</strong> en tutores + prioridad
              </div>
            </li>
          </ul>
          <button className={styles.planCtaBtn} onClick={onRegister} type="button">
            Probar Pro <span className={styles.ringPc}>→</span>
          </button>
        </div>
      </div>

      {/* Unlock strip */}
      <div className={styles.unlockStrip}>
        <div className={styles.unlockMini}>
          <div className={styles.umNum}>1</div>
          <div>
            <div className={styles.umTitle}>Completa 6 cursos</div>
            <div className={styles.umDesc}>→ 30 días Pro gratis</div>
          </div>
        </div>
        <div className={styles.unlockMini}>
          <div className={styles.umNum}>2</div>
          <div>
            <div className={styles.umTitle}>Acumula puntos estudiando</div>
            <div className={styles.umDesc}>Canjéalos por Pro o tutorías</div>
          </div>
        </div>
        <div className={styles.unlockMini}>
          <div className={styles.umNum}>3</div>
          <div>
            <div className={styles.umTitle}>Refiere compañeros</div>
            <div className={styles.umDesc}>Días Pro sin tope</div>
          </div>
        </div>
      </div>
    </div>
  );
}
