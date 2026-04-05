import { useEffect } from 'react'

interface SEOProps {
  title?: string
  description?: string
  path?: string
}

const DEFAULT_TITLE = 'Conniku — Plataforma de estudio para universitarios'
const DEFAULT_DESC = 'Cursos, comunidad, bolsa de trabajo y herramientas de estudio para universitarios en Latinoamerica.'
const BASE_URL = 'https://conniku.com'

/**
 * Lightweight SEO head manager — updates document title and meta tags per page.
 * No external dependencies needed.
 */
export default function SEOHead({ title, description, path }: SEOProps) {
  useEffect(() => {
    // Title
    const fullTitle = title ? `${title} — Conniku` : DEFAULT_TITLE
    document.title = fullTitle

    // Description
    const desc = description || DEFAULT_DESC
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) metaDesc.setAttribute('content', desc)

    // Open Graph
    const setOG = (prop: string, value: string) => {
      let el = document.querySelector(`meta[property="og:${prop}"]`)
      if (el) el.setAttribute('content', value)
    }
    setOG('title', fullTitle)
    setOG('description', desc)
    if (path) setOG('url', `${BASE_URL}${path}`)

    // Twitter
    const setTW = (name: string, value: string) => {
      let el = document.querySelector(`meta[name="twitter:${name}"]`)
      if (el) el.setAttribute('content', value)
    }
    setTW('title', fullTitle)
    setTW('description', desc)
    if (path) setTW('url', `${BASE_URL}${path}`)

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    if (canonical && path) canonical.href = `${BASE_URL}${path}`

    // Cleanup: restore defaults on unmount
    return () => {
      document.title = DEFAULT_TITLE
      const metaDesc = document.querySelector('meta[name="description"]')
      if (metaDesc) metaDesc.setAttribute('content', DEFAULT_DESC)
    }
  }, [title, description, path])

  return null
}

/** Page SEO presets */
export const PAGE_SEO: Record<string, SEOProps> = {
  landing: {
    title: undefined, // Uses default
    description: 'Conniku es la plataforma integral para estudiantes universitarios en Latinoamerica. Cursos, comunidad, bolsa de trabajo y desarrollo profesional.',
    path: '/',
  },
  login: {
    title: 'Iniciar Sesion',
    description: 'Inicia sesion en Conniku para acceder a tus cursos, comunidad y herramientas de estudio.',
    path: '/login',
  },
  register: {
    title: 'Crear Cuenta',
    description: 'Registrate gratis en Conniku. Accede a cursos, comunidad universitaria, bolsa de trabajo y mas.',
    path: '/register',
  },
  dashboard: {
    title: 'Dashboard',
    description: 'Tu panel de estudio en Conniku. Progreso, racha, cursos y actividad.',
    path: '/dashboard',
  },
  courses: {
    title: 'Cursos',
    description: 'Cursos gratuitos de habilidades blandas y desarrollo profesional para universitarios.',
    path: '/courses',
  },
  jobs: {
    title: 'Bolsa de Trabajo',
    description: 'Oportunidades laborales y curriculums de estudiantes universitarios en Latinoamerica.',
    path: '/jobs',
  },
  communities: {
    title: 'Comunidades',
    description: 'Comunidades de estudio universitario. Conecta con companeros de tu carrera.',
    path: '/communities',
  },
  events: {
    title: 'Eventos',
    description: 'Eventos academicos, conferencias y actividades para universitarios.',
    path: '/events',
  },
  messages: {
    title: 'Mensajes',
    path: '/messages',
  },
  friends: {
    title: 'Amigos',
    description: 'Conecta con otros estudiantes universitarios en Conniku.',
    path: '/friends',
  },
  mentoring: {
    title: 'Tutorias',
    description: 'Encuentra tutores universitarios o ofrece tus servicios de tutoria.',
    path: '/mentoring',
  },
  marketplace: {
    title: 'Marketplace',
    description: 'Recursos academicos compartidos por la comunidad universitaria.',
    path: '/marketplace',
  },
  search: {
    title: 'Buscar',
    path: '/search',
  },
  calendar: {
    title: 'Calendario',
    description: 'Organiza tus evaluaciones, entregas y eventos academicos.',
    path: '/calendar',
  },
  profile: {
    title: 'Mi Perfil',
    path: '/profile',
  },
  subscription: {
    title: 'Suscripcion',
    description: 'Planes de Conniku: Basico, Pro y Max. Elige el que mejor se adapte a ti.',
    path: '/subscription',
  },
  admin: {
    title: 'Administracion',
    path: '/admin',
  },
  ceo: {
    title: 'Panel CEO',
    path: '/ceo',
  },
}
