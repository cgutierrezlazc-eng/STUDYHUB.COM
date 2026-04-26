/**
 * Support.tsx
 *
 * Traducción de ORBIT-U/pages/soporte.html a un componente React funcional.
 * Bridging del módulo M01.3 · Centro de soporte.
 *
 * Reglas observadas:
 * - Contenido vigente · NO modificar texto.
 * - Idioma: español neutro latinoamericano (sin voseo).
 * - Logo oficial: estructura inviolable de `<span class="brand on-dark">`
 *   con className global · CSS vive en `src/styles/ConnikuWordmark.css`
 *   cargado globalmente desde main.tsx.
 * - Filtros y collapsibles vía estado React · sin querySelector ni
 *   addEventListener directos al DOM.
 *
 * Pendientes (futuras sesiones):
 * - Bridging del motor Hex Nebula (`src/lib/hex-nebula`).
 * - Bridging de la página Contacto (M01.4) · por ahora el CTA muestra
 *   alert('Pendiente · Contacto'). Ídem para Cookies, Prensa, Empleo.
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HexNebulaCanvas from '../lib/hex-nebula/HexNebulaCanvas';
import styles from './Support.module.css';
import { useI18n } from '../services/i18n';

type Category = 'all' | 'cuenta' | 'pagos' | 'plataforma' | 'privacidad' | 'tutores';

interface FaqItem {
  q: string;
  a: React.ReactNode;
}

interface FaqSection {
  cat: Exclude<Category, 'all'>;
  title: string;
  items: FaqItem[];
}

const SECTIONS: FaqSection[] = [
  {
    cat: 'cuenta',
    title: 'Cuenta y acceso',
    items: [
      {
        q: '¿Cómo creo mi cuenta?',
        a: (
          <>
            Visita <a href="/">conniku.com/registro</a> e ingresa tu nombre, correo institucional
            (recomendado) o personal, y una contraseña de al menos 8 caracteres. También puedes
            registrarte con tu cuenta Google. El registro es completamente gratuito.
          </>
        ),
      },
      {
        q: '¿Qué edad mínima se requiere?',
        a: (
          <>
            Conniku está dirigido exclusivamente a personas <strong>mayores de 18 años</strong>. Si
            eres menor de edad, no puedes crear una cuenta. Las cuentas de menores serán eliminadas
            de forma inmediata al ser detectadas.
          </>
        ),
      },
      {
        q: 'Olvidé mi contraseña. ¿Cómo la recupero?',
        a: (
          <>
            En la pantalla de inicio de sesión, haz clic en "¿Olvidaste tu contraseña?". Recibirás
            un correo con un enlace para restablecer tu contraseña. El enlace expira en 30 minutos.
            Si no recibes el correo, revisa tu carpeta de spam o escribe a{' '}
            <a href="mailto:soporte@conniku.com">soporte@conniku.com</a>.
          </>
        ),
      },
      {
        q: '¿Cómo cambio mi correo electrónico?',
        a: (
          <>
            Puedes modificar tu correo desde Configuración → Perfil → Editar correo. Se enviará un
            correo de verificación a la nueva dirección. Si tienes problemas, escribe a{' '}
            <a href="mailto:soporte@conniku.com">soporte@conniku.com</a> desde el correo actualmente
            registrado.
          </>
        ),
      },
      {
        q: '¿Cómo elimino mi cuenta?',
        a: (
          <>
            Ve a Configuración → Cuenta → Eliminar cuenta. La eliminación es{' '}
            <strong>irreversible</strong>. Se borrarán todos tus datos personales, excepto aquellos
            que Conniku esté obligada a retener por ley (registros de consentimiento por 5 años,
            datos de facturación por 6 años). Si tienes una suscripción activa, primero cáncela para
            evitar cobros.
          </>
        ),
      },
    ],
  },
  {
    cat: 'pagos',
    title: 'Planes y pagos',
    items: [
      {
        q: '¿Conniku es gratis?',
        a: (
          <>
            Sí. Conniku tiene un plan gratuito permanente con acceso a las funcionalidades
            esenciales de la plataforma. Algunos módulos avanzados pueden requerir un plan de pago,
            que se informará de forma clara antes de la contratación.
          </>
        ),
      },
      {
        q: '¿Tengo derecho a retracto si pago un plan?',
        a: (
          <>
            Sí. Conforme al Art. 3 bis de la Ley 19.496 (Chile), tienes derecho a retractarte dentro
            de los <strong>10 días corridos</strong> desde la contratación, siempre que no hayas
            comenzado a utilizar el servicio contratado. Para ejercerlo, escribe a{' '}
            <a href="mailto:soporte@conniku.com">soporte@conniku.com</a>.
          </>
        ),
      },
      {
        q: '¿Cómo cancelo mi suscripción?',
        a: (
          <>
            Ve a Configuración → Facturación → Cancelar plan. Si cancelas antes del vencimiento del
            período actual, mantendrás acceso hasta que este finalice. No se realizan cobros
            adicionales. Para asistencia, escribe a{' '}
            <a href="mailto:soporte@conniku.com">soporte@conniku.com</a>.
          </>
        ),
      },
      {
        q: '¿Conniku guarda los datos de mi tarjeta?',
        a: (
          <>
            No. Conniku no almacena datos de tarjetas de crédito ni débito. Los pagos se procesan de
            forma segura a través de MercadoPago o PayPal, quienes son responsables del tratamiento
            de esa información conforme a sus propias políticas de seguridad.
          </>
        ),
      },
    ],
  },
  {
    cat: 'plataforma',
    title: 'Plataforma y módulos',
    items: [
      {
        q: '¿La plataforma funciona en el teléfono?',
        a: (
          <>
            Sí. Conniku está disponible como Progressive Web App (PWA) instalable desde el navegador
            en Android e iOS, y como aplicación nativa. La interfaz es completamente responsiva y
            adaptada para uso móvil.
          </>
        ),
      },
      {
        q: '¿Qué es el módulo Athena?',
        a: (
          <>
            Athena es el asistente académico integrado en Conniku. Puede ayudarte con resúmenes,
            explicaciones de conceptos, revisión de textos y apoyo en tareas académicas. Utiliza
            tecnología de Anthropic (Claude) bajo los términos de uso correspondientes.
          </>
        ),
      },
      {
        q: '¿Cómo reporto un contenido inapropiado?',
        a: (
          <>
            Puedes usar el botón "Reportar" disponible en cualquier publicación, comentario o
            perfil. También puedes escribir a{' '}
            <a href="mailto:soporte@conniku.com">soporte@conniku.com</a> con el enlace al contenido
            y una descripción del motivo del reporte. Revisamos todos los reportes.
          </>
        ),
      },
      {
        q: 'Apelé una suspensión. ¿Cómo procedo?',
        a: (
          <>
            Las apelaciones a decisiones de moderación deben enviarse a{' '}
            <a href="mailto:moderacion@conniku.com">moderacion@conniku.com</a> dentro de los 14 días
            corridos siguientes a la notificación. Incluye tu nombre, correo registrado y los
            argumentos por los que impugnas la decisión. Recibirás respuesta dentro de 5 días
            hábiles.
          </>
        ),
      },
    ],
  },
  {
    cat: 'privacidad',
    title: 'Privacidad y datos',
    items: [
      {
        q: '¿Cómo solicito una copia de mis datos?',
        a: (
          <>
            Escribe a <a href="mailto:privacidad@conniku.com">privacidad@conniku.com</a> indicando
            tu nombre, correo registrado y que deseas ejercer el derecho de acceso/portabilidad.
            Recibirás una copia de tus datos en formato JSON o CSV. Respondemos en máximo 15 días
            hábiles (Chile) o 30 días calendario (GDPR).
          </>
        ),
      },
      {
        q: '¿Conniku vende mis datos?',
        a: (
          <>
            No. Conniku no vende, alquila ni cede datos personales de usuarios a terceros con fines
            comerciales propios de esos terceros. Puedes consultar los proveedores con los que
            compartimos datos necesarios para operar el servicio en nuestra{' '}
            <Link to="/privacy">Política de Privacidad §4</Link>.
          </>
        ),
      },
      {
        q: '¿Conniku usa Google Analytics u otras herramientas de análisis?',
        a: (
          <>
            No actualmente. Conniku no utiliza cookies ni scripts de analítica de terceros (Google
            Analytics, Mixpanel, Hotjar u otros). Si en el futuro incorporamos herramientas de
            análisis, lo notificaremos y actualizaremos nuestra{' '}
            {/* TODO: cuando se bridgee cookies.html → ruta /cookies */}
            <a href="/">Política de Cookies</a>.
          </>
        ),
      },
    ],
  },
  {
    cat: 'tutores',
    title: 'Tutorías',
    items: [
      {
        q: '¿Cómo me convierto en tutor?',
        a: (
          <>
            En el módulo de Tutores encontrarás la opción "Ofrecer tutorías". Completa tu perfil
            académico, las materias que puedes enseñar y tu disponibilidad horaria. Tu perfil será
            revisado por el equipo de Conniku antes de activarse. Para consultas, escribe a{' '}
            <a href="mailto:tutores@conniku.com">tutores@conniku.com</a>.
          </>
        ),
      },
      {
        q: '¿Los tutores son empleados de Conniku?',
        a: (
          <>
            No. Los tutores que prestan servicios en la plataforma son usuarios independientes.
            Conniku actúa como intermediario tecnológico. La evaluación de la idoneidad de cada
            tutor es responsabilidad del usuario que contrata la tutoría, aunque Conniku establece
            requisitos de acceso al módulo.
          </>
        ),
      },
      {
        q: 'Tuve un problema con un tutor. ¿Qué hago?',
        a: (
          <>
            Repórtalo a <a href="mailto:tutores@conniku.com">tutores@conniku.com</a> con el nombre
            del tutor, fecha de la sesión y descripción del incidente. Para casos de acoso o
            conducta inapropiada, escribe a{' '}
            <a href="mailto:seguridad@conniku.com">seguridad@conniku.com</a>. Investigamos todos los
            reportes con confidencialidad.
          </>
        ),
      },
    ],
  },
];

const CATEGORY_IDS: Category[] = ['all', 'cuenta', 'pagos', 'plataforma', 'privacidad', 'tutores'];

function extractText(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(' ');
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return extractText(props.children);
  }
  return '';
}

const pendingAlert = (label: string) => () => {
  window.alert(`Pendiente · ${label}`);
};

export default function Support() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [activeCat, setActiveCat] = useState<Category>('all');
  const [search, setSearch] = useState('');
  const [openKey, setOpenKey] = useState<string | null>(null);

  const term = search.trim().toLowerCase();

  return (
    <div className={styles.page}>
      <HexNebulaCanvas
        options={{ hexSize: 34, intensity: 0.5, bgColor: '#0A0C12' }}
        className={styles.nebulaBg}
      />

      <div className={styles.topbar}>
        <button type="button" onClick={() => navigate(-1)} className={styles.backLink}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {t('chrome.back') || 'Volver'}
        </button>
        <div className={styles.topbarSep} />
        <Link to="/" className={`brand on-dark ${styles.topbarBrand}`} aria-label="Conniku">
          conn<span>i</span>
          <span className="k-letter">k</span>
          <span className="u-pack">
            <span className="u-letter">u</span>
            <span className="dot"></span>
          </span>
        </Link>
        <div className={styles.topbarSep} />
        <span className={styles.topbarTitle}>
          {t('support.topbar_title') || 'CENTRO DE SOPORTE'}
        </span>
      </div>

      <div className={styles.layout}>
        {/* SIDEBAR · 360px */}
        <aside className={styles.sidebar}>
          <section className={styles.dCard}>
            <h2 className={styles.dCardTitle}>Centro de ayuda</h2>
            <p className={styles.dCardText}>
              Aquí encuentras respuestas a las preguntas más frecuentes sobre Conniku: cuenta,
              pagos, plataforma, privacidad y tutores.
            </p>
            <p className={styles.dCardText}>
              Usa la búsqueda o filtra por categoría para llegar más rápido a tu respuesta.
            </p>
          </section>

          <section className={styles.dCard}>
            <h2 className={styles.dCardTitle}>Categorías</h2>
            <div className={styles.catChipList}>
              {CATEGORY_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`${styles.catChip} ${activeCat === id ? styles.active : ''}`}
                  onClick={() => setActiveCat(id)}
                >
                  {t(`support.filter.${id}`) || id}
                </button>
              ))}
            </div>
          </section>

          <section className={styles.dCard}>
            <h2 className={styles.dCardTitle}>Tiempos de respuesta</h2>
            <ul className={styles.infoList}>
              <li>
                <span className={styles.infoKey}>Soporte técnico</span>
                <span className={styles.infoVal}>24 h hábiles</span>
              </li>
              <li>
                <span className={styles.infoKey}>Contacto general</span>
                <span className={styles.infoVal}>48 h hábiles</span>
              </li>
              <li>
                <span className={styles.infoKey}>Privacidad</span>
                <span className={styles.infoVal}>24 h hábiles</span>
              </li>
              <li>
                <span className={styles.infoKey}>Legal</span>
                <span className={styles.infoVal}>48 h hábiles</span>
              </li>
            </ul>
          </section>

          <section className={styles.dCard}>
            <h2 className={styles.dCardTitle}>¿No encuentras tu respuesta?</h2>
            <p className={styles.dCardText}>
              Escríbenos al canal correspondiente desde el formulario de contacto. Te respondemos
              dentro de 24–48 horas hábiles.
            </p>
            <Link to="/contact" className={styles.helpLinkBtn}>
              Ir al formulario de contacto →
            </Link>
          </section>
        </aside>

        {/* COLUMNA DERECHA · feed */}
        <main className={styles.feed}>
          <section className={styles.pageHead}>
            <div className={styles.pageBadge}>{t('support.head.badge') || 'CENTRO DE SOPORTE'}</div>
            <h1 className={styles.pageTitle}>
              {t('support.head.title') || '¿En qué podemos ayudarte?'}
            </h1>
            <p className={styles.pageSub}>
              {t('support.head.sub') || 'Encuentra respuestas rápidas o escríbenos directamente.'}
            </p>
          </section>

          {/* Search · vive en una dCard del feed para coherencia visual */}
          <section className={styles.dCard}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </span>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Busca tu pregunta…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </section>

          {/* FAQ sections · cada sección como su propia dCard */}
          {SECTIONS.map((section) => {
            if (activeCat !== 'all' && activeCat !== section.cat) return null;

            const visibleItems = section.items.filter((item) => {
              if (!term) return true;
              const haystack = (item.q + ' ' + extractText(item.a)).toLowerCase();
              return haystack.includes(term);
            });

            if (visibleItems.length === 0 && term) return null;

            return (
              <section key={section.cat} className={styles.dCard}>
                <div className={styles.faqSection}>
                  <div className={styles.faqSectionTitle}>{section.title}</div>
                  {visibleItems.map((item, i) => {
                    const key = `${section.cat}-${i}`;
                    const isOpen = openKey === key;
                    return (
                      <div key={key} className={styles.faqItem}>
                        <button
                          type="button"
                          className={`${styles.faqQ} ${isOpen ? styles.open : ''}`}
                          onClick={() => setOpenKey(isOpen ? null : key)}
                          aria-expanded={isOpen}
                        >
                          {item.q}
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </button>
                        <div className={`${styles.faqA} ${isOpen ? styles.open : ''}`}>
                          {item.a}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* CTA final */}
          <div className={styles.ctaBox}>
            <h2>{t('support.cta.title') || '¿No encontraste lo que buscabas?'}</h2>
            <p>
              {t('support.cta.sub') ||
                'Escríbenos directamente y te respondemos en 24–48 h hábiles.'}
            </p>
            <Link to="/contact" className={styles.ctaBtn}>
              {t('support.cta.btn') || 'Ir a Contacto →'}
            </Link>
          </div>
        </main>
      </div>

      {/* Footer · igualado al de Contact */}
      <footer className={styles.pageFooter}>
        <span className={styles.footerCopy}>
          {t('chrome.footer_copy_antof') || '© 2026 Conniku SpA · Antofagasta, Chile'}
        </span>
        <nav className={styles.footerLinks}>
          <Link to="/terms">{t('chrome.footer_terms') || 'Términos'}</Link>
          <Link to="/privacy">{t('chrome.footer_privacy') || 'Privacidad'}</Link>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              pendingAlert('Cookies')();
            }}
          >
            {t('chrome.footer_cookies') || 'Cookies'}
          </a>
          <Link to="/support" className={styles.active}>
            {t('chrome.footer_support') || 'Soporte'}
          </Link>
          <Link to="/contact">{t('chrome.footer_contact') || 'Contacto'}</Link>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              pendingAlert('Prensa')();
            }}
          >
            {t('chrome.footer_press') || 'Prensa'}
          </a>
          <Link to="/careers">{t('chrome.footer_careers') || 'Trabaja con nosotros'}</Link>
        </nav>
      </footer>
    </div>
  );
}
