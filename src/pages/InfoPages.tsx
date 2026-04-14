import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Props {
  onNavigate: (path: string) => void;
}

/* ─── Shared layout wrapper ─────────────────────────────────── */
function InfoLayout({
  title,
  subtitle,
  children,
  onNavigate,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onNavigate: (path: string) => void;
}) {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px 60px' }}>
      {/* Back */}
      <button
        onClick={() => onNavigate('/dashboard')}
        style={{
          border: 'none',
          background: 'none',
          color: 'var(--accent)',
          fontSize: 13,
          cursor: 'pointer',
          padding: '0 0 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          fontWeight: 500,
        }}
      >
        ← Volver
      </button>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0 }}>{subtitle}</p>
        )}
      </div>

      {children}
    </div>
  );
}

/* ─── Card helper ───────────────────────────────────────────── */
function Card({
  title,
  children,
  accent,
}: {
  title?: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: `1px solid var(--border)`,
        borderRadius: 12,
        padding: '20px 24px',
        marginBottom: 16,
        ...(accent ? { borderLeft: `4px solid ${accent}` } : {}),
      }}
    >
      {title && (
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 10,
            marginTop: 0,
          }}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, margin: '0 0 8px' }}
    >
      {children}
    </p>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   1. SOBRE CONNIKU  /about
══════════════════════════════════════════════════════════════ */
export function AboutPage({ onNavigate }: Props) {
  return (
    <InfoLayout
      title="Sobre Conniku"
      subtitle="La plataforma de estudio universitario"
      onNavigate={onNavigate}
    >
      <Grid>
        <Card accent="var(--accent-blue)">
          <div style={{ fontSize: 32, marginBottom: 10 }}>🎓</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700 }}>Nuestra misión</h3>
          <P>
            Conectar y potenciar a los estudiantes universitarios de Chile y Latinoamérica con
            herramientas de estudio colaborativo, tecnología inteligente y oportunidades laborales.
          </P>
        </Card>
        <Card accent="var(--accent-green)">
          <div style={{ fontSize: 32, marginBottom: 10 }}>🤝</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700 }}>Nuestra visión</h3>
          <P>
            Ser la red universitaria de referencia en habla hispana, donde cada estudiante encuentra
            su comunidad, sus recursos y su primer empleo.
          </P>
        </Card>
      </Grid>

      <Card title="¿Qué es Conniku?">
        <P>
          Conniku es una plataforma SaaS diseñada para el ecosistema universitario. Integramos redes
          sociales académicas, gestión de asignaturas, tutorías, bolsa de empleo, comunidades y
          herramientas inteligentes.
        </P>
        <P>
          Nació para resolver un problema real: los estudiantes universitarios chilenos no tenían un
          espacio unificado para estudiar, colaborar y proyectarse laboralmente.
        </P>
      </Card>

      <Card title="Información legal">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            ['Razón social', 'Conniku SpA'],
            ['RUT', '78.395.702-7'],
            ['Giro', 'Desarrollo y Comercialización de Software (631200)'],
            ['Tipo empresa', 'Micro Empresa — Régimen ProPyme (Art. 14D3)'],
            ['País', 'Chile'],
            ['Dominio', 'conniku.com'],
          ].map(([k, v]) => (
            <div key={k} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: 3,
                }}
              >
                {k}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{v}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Contacto">
        <P>
          Para consultas generales:{' '}
          <a href="mailto:contacto@conniku.com" style={{ color: 'var(--accent)' }}>
            contacto@conniku.com
          </a>
        </P>
        <P>
          Dirección ejecutiva:{' '}
          <a href="mailto:ceo@conniku.com" style={{ color: 'var(--accent)' }}>
            ceo@conniku.com
          </a>
        </P>
        <P>
          Privacidad y datos:{' '}
          <a href="mailto:privacidad@conniku.com" style={{ color: 'var(--accent)' }}>
            privacidad@conniku.com
          </a>
        </P>
        <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
          <button
            onClick={() => onNavigate('/privacy')}
            style={{
              fontSize: 13,
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 16px',
              background: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            Política de Privacidad
          </button>
          <button
            onClick={() => onNavigate('/terms')}
            style={{
              fontSize: 13,
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 16px',
              background: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            Términos de Uso
          </button>
        </div>
      </Card>
    </InfoLayout>
  );
}

/* ══════════════════════════════════════════════════════════════
   2. SOLUCIONES EMPRESA  /enterprise
══════════════════════════════════════════════════════════════ */
export function EnterprisePage({ onNavigate }: Props) {
  return (
    <InfoLayout
      title="Soluciones para Empresas y Universidades"
      subtitle="Potencia tu organización con tecnología educativa y de RRHH"
      onNavigate={onNavigate}
    >
      <Grid>
        {[
          {
            emoji: '🏛️',
            title: 'Para Universidades',
            text: 'Integra Conniku con tu institución: gestión de asignaturas, comunidades por carrera, bolsa de empleo y seguimiento de egresados.',
          },
          {
            emoji: '🏢',
            title: 'Para Empresas',
            text: 'Publica vacantes, accede a talento universitario calificado y gestiona procesos de selección desde una sola plataforma.',
          },
          {
            emoji: '🔧',
            title: 'Para Pymes',
            text: 'Planes accesibles para pequeñas y medianas empresas que necesitan digitalizar su RRHH y conectarse con talento joven.',
          },
        ].map(({ emoji, title, text }) => (
          <Card key={title} accent="var(--accent-blue)">
            <div style={{ fontSize: 28, marginBottom: 10 }}>{emoji}</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700 }}>{title}</h3>
            <P>{text}</P>
          </Card>
        ))}
      </Grid>

      <Card title="¿Qué incluye?">
        {[
          '✅ Panel de administración para RRHH',
          '✅ Módulo de contratación con cumplimiento Código del Trabajo',
          '✅ Publicación de vacantes en Bolsa de Empleo Conniku',
          '✅ Acceso a perfiles y currículums verificados',
          '✅ Herramientas de estudio y capacitación para colaboradores',
          '✅ Soporte dedicado y onboarding personalizado',
        ].map((item) => (
          <div
            key={item}
            style={{ fontSize: 14, color: 'var(--text-secondary)', padding: '5px 0' }}
          >
            {item}
          </div>
        ))}
      </Card>

      <Card title="Contacta a nuestro equipo comercial">
        <P>
          Escríbenos para una demostración personalizada y conocer los planes disponibles para tu
          organización.
        </P>
        <a
          href="mailto:contacto@conniku.com?subject=Consulta%20Soluciones%20Empresa"
          style={{
            display: 'inline-block',
            marginTop: 8,
            padding: '10px 20px',
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Contactar equipo comercial
        </a>
      </Card>
    </InfoLayout>
  );
}

/* ══════════════════════════════════════════════════════════════
   3. CENTRO DE SEGURIDAD  /safety
══════════════════════════════════════════════════════════════ */
export function SafetyPage({ onNavigate }: Props) {
  return (
    <InfoLayout
      title="Centro de Seguridad"
      subtitle="Tu seguridad y privacidad son nuestra prioridad"
      onNavigate={onNavigate}
    >
      <Grid>
        {[
          {
            emoji: '🔒',
            title: 'Protección de datos',
            text: 'Cumplimos con la Ley 19.628 (Chile), GDPR (UE), LGPD (Brasil) y CCPA (EE.UU.). Tus datos nunca se venden a terceros.',
          },
          {
            emoji: '🛡️',
            title: 'Autenticación segura',
            text: 'JWT con expiración, contraseñas encriptadas (bcrypt). Sesiones protegidas con validación en cada petición.',
          },
          {
            emoji: '📡',
            title: 'Comunicaciones cifradas',
            text: 'Todo el tráfico usa HTTPS/TLS. WebSockets protegidos con tokens de sesión verificados.',
          },
        ].map(({ emoji, title, text }) => (
          <Card key={title} accent="var(--accent-green)">
            <div style={{ fontSize: 28, marginBottom: 10 }}>{emoji}</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700 }}>{title}</h3>
            <P>{text}</P>
          </Card>
        ))}
      </Grid>

      <Card title="Normas de la comunidad">
        <P>Conniku es un espacio de aprendizaje y colaboración. Está estrictamente prohibido:</P>
        {[
          '🚫 Publicar contenido ofensivo, discriminatorio o de odio',
          '🚫 Compartir material con derechos de autor sin autorización',
          '🚫 Suplantar identidad de otros usuarios o de la plataforma',
          '🚫 Usar la plataforma para actividades ilegales o fraudulentas',
          '🚫 Enviar spam o contenido publicitario no autorizado',
        ].map((r) => (
          <div key={r} style={{ fontSize: 14, color: 'var(--text-secondary)', padding: '4px 0' }}>
            {r}
          </div>
        ))}
      </Card>

      <Card title="Reportar un problema de seguridad">
        <P>
          Si detectas una vulnerabilidad o contenido inapropiado, repórtalo inmediatamente.
          Respondemos en menos de 48 horas hábiles.
        </P>
        <a
          href="mailto:privacidad@conniku.com?subject=Reporte%20de%20Seguridad"
          style={{
            display: 'inline-block',
            marginTop: 8,
            padding: '10px 20px',
            background: '#ef4444',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Reportar problema de seguridad
        </a>
        <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
          <button
            onClick={() => onNavigate('/privacy')}
            style={{
              fontSize: 13,
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 16px',
              background: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            Ver Política de Privacidad
          </button>
        </div>
      </Card>
    </InfoLayout>
  );
}

/* ══════════════════════════════════════════════════════════════
   4. ACCESIBILIDAD  /accessibility
══════════════════════════════════════════════════════════════ */
export function AccessibilityPage({ onNavigate }: Props) {
  return (
    <InfoLayout
      title="Accesibilidad"
      subtitle="Conniku está comprometido con la accesibilidad digital para todos"
      onNavigate={onNavigate}
    >
      <Card title="Nuestro compromiso" accent="var(--accent-purple)">
        <P>
          Trabajamos continuamente para que Conniku sea usable por todas las personas,
          independientemente de sus capacidades. Seguimos las pautas WCAG 2.1 como referencia de
          diseño.
        </P>
      </Card>

      <Grid>
        {[
          {
            emoji: '⌨️',
            title: 'Navegación por teclado',
            text: 'Todos los elementos interactivos son accesibles vía teclado (Tab, Enter, Escape).',
          },
          {
            emoji: '🔍',
            title: 'Contraste de color',
            text: 'Paleta de colores diseñada para un contraste adecuado en todos los temas disponibles.',
          },
          {
            emoji: '📱',
            title: 'Diseño responsivo',
            text: 'Funciona correctamente en pantallas pequeñas, tablets y escritorio.',
          },
          {
            emoji: '🌐',
            title: 'Múltiples idiomas',
            text: 'Disponible en más de 15 idiomas para usuarios de distintas regiones.',
          },
        ].map(({ emoji, title, text }) => (
          <Card key={title}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{emoji}</div>
            <h3 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700 }}>{title}</h3>
            <P>{text}</P>
          </Card>
        ))}
      </Grid>

      <Card title="¿Encontraste un problema de accesibilidad?">
        <P>
          Nos importa tu experiencia. Si algo no funciona correctamente o tienes sugerencias para
          mejorar la accesibilidad de Conniku, escríbenos.
        </P>
        <a
          href="mailto:contacto@conniku.com?subject=Accesibilidad%20Conniku"
          style={{
            display: 'inline-block',
            marginTop: 8,
            padding: '10px 20px',
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Enviar comentario
        </a>
      </Card>
    </InfoLayout>
  );
}

/* ══════════════════════════════════════════════════════════════
   5. TRABAJA CON NOSOTROS  /careers
══════════════════════════════════════════════════════════════ */
export function CareersPage({ onNavigate }: Props) {
  return (
    <InfoLayout
      title="Trabaja con Nosotros"
      subtitle="Únete al equipo que está transformando la educación universitaria"
      onNavigate={onNavigate}
    >
      <Card accent="var(--accent-blue)">
        <div style={{ fontSize: 32, marginBottom: 12 }}>🚀</div>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>¿Por qué Conniku?</h3>
        <P>
          Somos una startup en crecimiento, con impacto real en la vida de miles de estudiantes.
          Trabajamos de forma 100% remota, con autonomía y enfoque en resultados.
        </P>
        <P>
          Si te apasiona la educación, la tecnología y construir productos que la gente usa de
          verdad, este es tu lugar.
        </P>
      </Card>

      <Card title="Perfil que buscamos">
        {[
          '💻 Desarrolladores Frontend (React / TypeScript)',
          '⚙️ Desarrolladores Backend (Python / FastAPI)',
          '🎨 Diseñadores UX/UI con enfoque en productos SaaS',
          '📊 Analistas de datos y crecimiento',
          '📣 Marketing y comunidades digitales',
        ].map((item) => (
          <div
            key={item}
            style={{ fontSize: 14, color: 'var(--text-secondary)', padding: '5px 0' }}
          >
            {item}
          </div>
        ))}
      </Card>

      <Card title="¿Cómo postular?">
        <P>
          Envía tu CV y cuéntanos por qué quieres ser parte de Conniku. No hay formularios
          complicados: un email es suficiente.
        </P>
        <a
          href="mailto:ceo@conniku.com?subject=Postulaci%C3%B3n%20Conniku"
          style={{
            display: 'inline-block',
            marginTop: 8,
            padding: '10px 20px',
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Enviar mi postulación
        </a>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            margin: '12px 0 0',
          }}
        >
          📧 ceo@conniku.com — Asunto: "Postulación [tu área]"
        </p>
      </Card>
    </InfoLayout>
  );
}

/* ══════════════════════════════════════════════════════════════
   6. OPCIONES DE ANUNCIOS  /advertising
══════════════════════════════════════════════════════════════ */
export function AdvertisingPage({ onNavigate }: Props) {
  return (
    <InfoLayout
      title="Opciones de Anuncios"
      subtitle="Llega a miles de estudiantes universitarios"
      onNavigate={onNavigate}
    >
      <div
        style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: 'var(--bg-secondary)',
          borderRadius: 12,
          border: '1px solid var(--border)',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>📢</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Próximamente</h2>
        <P>
          Estamos desarrollando opciones de publicidad para empresas y universidades que quieran
          conectar con estudiantes universitarios en Conniku.
        </P>
        <P>
          Si tienes interés en ser uno de nuestros primeros anunciantes, escríbenos y te contactamos
          con las opciones disponibles.
        </P>
        <a
          href="mailto:contacto@conniku.com?subject=Publicidad%20en%20Conniku"
          style={{
            display: 'inline-block',
            marginTop: 16,
            padding: '10px 24px',
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Quiero anunciarme
        </a>
      </div>

      <Card title="¿Por qué anunciarte en Conniku?">
        {[
          '🎯 Audiencia universitaria segmentada por carrera, región e intereses',
          '📱 Plataforma web + app móvil (PWA)',
          '🤝 Formatos nativos no intrusivos: posts patrocinados, banners y menciones',
          '📊 Métricas de alcance e interacción en tiempo real',
        ].map((item) => (
          <div
            key={item}
            style={{ fontSize: 14, color: 'var(--text-secondary)', padding: '5px 0' }}
          >
            {item}
          </div>
        ))}
      </Card>
    </InfoLayout>
  );
}

/* ══════════════════════════════════════════════════════════════
   7. APP MÓVIL  /mobile
══════════════════════════════════════════════════════════════ */
export function MobilePage({ onNavigate }: Props) {
  return (
    <InfoLayout
      title="Conniku en tu móvil"
      subtitle="Accede a toda la plataforma desde tu smartphone"
      onNavigate={onNavigate}
    >
      <div
        style={{
          textAlign: 'center',
          padding: '40px 24px',
          background: 'var(--bg-secondary)',
          borderRadius: 12,
          border: '1px solid var(--border)',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Progressive Web App</h2>
        <P>
          Conniku funciona como una <strong>Progressive Web App (PWA)</strong>. No necesitas
          descargar nada desde una tienda: instala Conniku directamente desde tu navegador con un
          solo toque.
        </P>
      </div>

      <Grid>
        {[
          {
            emoji: '📲',
            title: 'Instalar en iOS (iPhone)',
            steps: [
              'Abre conniku.com en Safari',
              'Toca el ícono de compartir ↑',
              'Selecciona "Agregar a pantalla de inicio"',
              '¡Listo! Ya tienes Conniku en tu iPhone',
            ],
          },
          {
            emoji: '🤖',
            title: 'Instalar en Android',
            steps: [
              'Abre conniku.com en Chrome',
              'Toca el menú ⋮ (tres puntos)',
              'Selecciona "Instalar aplicación"',
              '¡Listo! Ya tienes Conniku en tu Android',
            ],
          },
        ].map(({ emoji, title, steps }) => (
          <Card key={title} accent="var(--accent-blue)">
            <div style={{ fontSize: 28, marginBottom: 10 }}>{emoji}</div>
            <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700 }}>{title}</h3>
            {steps.map((s, i) => (
              <div
                key={i}
                style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '4px 0' }}
              >
                <span
                  style={{ minWidth: 20, fontWeight: 700, color: 'var(--accent)', fontSize: 12 }}
                >
                  {i + 1}.
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s}</span>
              </div>
            ))}
          </Card>
        ))}
      </Grid>

      <Card title="Ventajas de la PWA">
        {[
          '✅ Sin instalación desde tienda de aplicaciones',
          '✅ Funciona sin conexión (contenido en caché)',
          '✅ Notificaciones push en tiempo real',
          '✅ Actualización automática, siempre la última versión',
          '✅ Mismo rendimiento que una app nativa',
        ].map((item) => (
          <div
            key={item}
            style={{ fontSize: 14, color: 'var(--text-secondary)', padding: '4px 0' }}
          >
            {item}
          </div>
        ))}
      </Card>
    </InfoLayout>
  );
}

/* ══════════════════════════════════════════════════════════════
   8. BLOG  /blog  — Hilo abierto de opiniones
══════════════════════════════════════════════════════════════ */
export function BlogPage({ onNavigate }: Props) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    document.title = 'Blog — Conniku';
    api
      .getBlogPosts(50)
      .then((data: any) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!newPost.trim()) return;
    setPosting(true);
    setPostError('');
    try {
      const created = await api.createBlogPost(newPost.trim());
      setPosts((prev) => [created, ...prev]);
      setNewPost('');
    } catch (err: any) {
      setPostError(err?.message || 'No se pudo publicar. ¿Estás conectado?');
    } finally {
      setPosting(false);
    }
  }

  async function handleLike(postId: string) {
    if (likedIds.has(postId)) return;
    try {
      const res = await api.likeBlogPost(postId);
      setLikedIds((prev) => new Set([...prev, postId]));
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes: res.likes } : p)));
    } catch {}
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString('es-CL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  const charCount = newPost.length;
  const charLimit = 2000;

  return (
    <InfoLayout
      title="Blog Conniku"
      subtitle="Un hilo abierto para estudiantes, tutores y curiosos — opina, comenta y conecta"
      onNavigate={onNavigate}
    >
      {/* ── Formulario nueva publicación ── */}
      <Card accent="var(--accent-blue)">
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, marginTop: 0 }}>
          ✍️ Comparte tu opinión
        </h3>
        <form onSubmit={handlePost}>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value.slice(0, charLimit))}
            placeholder="¿Qué opinas sobre la vida universitaria, el estudio o Conniku? Escribe aquí..."
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: 14,
              resize: 'vertical',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              lineHeight: 1.6,
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 10,
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: charCount > charLimit * 0.9 ? '#ef4444' : 'var(--text-muted)',
              }}
            >
              {charCount} / {charLimit}
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {postError && <span style={{ fontSize: 12, color: '#ef4444' }}>{postError}</span>}
              <button
                type="submit"
                disabled={posting || !newPost.trim()}
                style={{
                  padding: '8px 20px',
                  background: posting || !newPost.trim() ? 'var(--text-muted)' : 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: posting || !newPost.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {posting ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>
        </form>
      </Card>

      {/* ── Hilo de posts ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 14 }}>
          Cargando publicaciones...
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 24px',
            background: 'var(--bg-secondary)',
            borderRadius: 12,
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
          <P>
            <strong>Sé el primero en publicar.</strong> Comparte algo interesante sobre la vida
            universitaria, tips de estudio o lo que piensas de Conniku.
          </P>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {posts.map((post) => (
          <div
            key={post.id}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px 18px',
            }}
          >
            {/* Author row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: post.author?.avatar
                    ? `url(${post.author.avatar}) center/cover`
                    : 'linear-gradient(135deg, #2D62C8, #5B8DEF)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {!post.author?.avatar && (post.author?.name?.[0] || '?')}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {post.author?.name || 'Anónimo'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {post.created_at ? formatDate(post.created_at) : ''}
                </div>
              </div>
            </div>

            {/* Content */}
            <p
              style={{
                fontSize: 14,
                color: 'var(--text-primary)',
                lineHeight: 1.65,
                margin: '0 0 12px',
                whiteSpace: 'pre-wrap',
              }}
            >
              {post.content}
            </p>

            {/* Like button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => handleLike(post.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  background: likedIds.has(post.id)
                    ? 'rgba(var(--accent-rgb, 45,98,200), 0.12)'
                    : 'none',
                  border: `1px solid ${likedIds.has(post.id) ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 20,
                  padding: '4px 12px',
                  cursor: likedIds.has(post.id) ? 'default' : 'pointer',
                  fontSize: 12,
                  color: likedIds.has(post.id) ? 'var(--accent)' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                👍 {post.likes || 0}
              </button>
            </div>
          </div>
        ))}
      </div>
    </InfoLayout>
  );
}
