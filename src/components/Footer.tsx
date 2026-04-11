import React from 'react'

interface Props {
  onNavigate: (path: string) => void
}

const COLS = [
  [
    { label: 'Sobre Conniku',       path: '/about' },
    { label: 'Comunidad',           path: '/communities' },
    { label: 'Privacidad y Términos', path: '/privacy' },
    { label: 'Soluciones Empresa',  path: '/enterprise' },
    { label: 'Centro de Seguridad', path: '/safety' },
  ],
  [
    { label: 'Accesibilidad',       path: '/accessibility' },
    { label: 'Trabaja con Nosotros', path: '/careers' },
    { label: 'Opciones de Anuncios', path: '/advertising' },
    { label: 'App Móvil',           path: '/mobile' },
  ],
  [
    { label: 'Para Tutores',        path: '/tutores' },
    { label: 'Para Universidades',  path: '/enterprise' },
    { label: 'Pymes',               path: '/enterprise' },
    { label: 'Blog',                path: '/blog' },
  ],
]

const QUICK_ACTIONS = [
  {
    icon: '❓',
    title: '¿Preguntas?',
    desc: 'Escríbenos a contacto@conniku.com',
    href: 'mailto:contacto@conniku.com',
    isEmail: true,
  },
  {
    icon: '⚙️',
    title: 'Cuenta y privacidad',
    desc: 'Ve a tu Configuración',
    path: '/profile',
    isEmail: false,
  },
  {
    icon: '🛡️',
    title: 'Transparencia de contenido',
    desc: 'Lee más sobre recomendaciones',
    path: '/about',
    isEmail: false,
  },
]

const LANGS = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English (English)' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文 (简体)' },
  { code: 'ar', label: 'العربية' },
  { code: 'ko', label: '한국어' },
  { code: 'ru', label: 'Русский' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'pl', label: 'Polski' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'sv', label: 'Svenska' },
]

export default function Footer({ onNavigate }: Props) {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer-inner">

        {/* Logo */}
        <div className="site-footer-brand">
          <span className="site-footer-logo">Conniku</span>
          <span className="site-footer-tagline">La plataforma de estudio universitario</span>
        </div>

        {/* Body: columns + actions + language */}
        <div className="site-footer-body">

          {/* Link columns */}
          <div className="site-footer-cols">
            {COLS.map((col, ci) => (
              <div key={ci} className="site-footer-col">
                {col.map(link => (
                  <button
                    key={link.path + link.label}
                    className="site-footer-link"
                    onClick={() => onNavigate(link.path)}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="site-footer-divider" />

          {/* Quick actions + language */}
          <div className="site-footer-right">
            <div className="site-footer-actions">
              {QUICK_ACTIONS.map((a, i) => (
                <div key={i} className="site-footer-action">
                  <span className="site-footer-action-icon" aria-hidden="true">{a.icon}</span>
                  <div>
                    <div className="site-footer-action-title">{a.title}</div>
                    {a.isEmail ? (
                      <a href={a.href} className="site-footer-action-link">{a.desc}</a>
                    ) : (
                      <button className="site-footer-action-link" onClick={() => onNavigate(a.path!)}>
                        {a.desc}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="site-footer-lang">
              <label className="site-footer-lang-label" htmlFor="footer-lang">
                Seleccionar idioma
              </label>
              <select
                id="footer-lang"
                className="site-footer-lang-select"
                defaultValue="es"
                onChange={e => {
                  // Hook into i18n when ready
                  localStorage.setItem('conniku_lang_pref', e.target.value)
                }}
              >
                {LANGS.map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="site-footer-bottom">
          <span>Conniku SpA © {year}</span>
          <div className="site-footer-bottom-links">
            <button className="site-footer-link" onClick={() => onNavigate('/privacy')}>
              Política de Privacidad
            </button>
            <span aria-hidden="true">·</span>
            <button className="site-footer-link" onClick={() => onNavigate('/terms')}>
              Términos de Uso
            </button>
            <span aria-hidden="true">·</span>
            <a href="mailto:contacto@conniku.com" className="site-footer-link">
              contacto@conniku.com
            </a>
          </div>
        </div>

      </div>
    </footer>
  )
}
