/**
 * cookieTexts.ts — Textos legales del banner de consentimiento de cookies.
 *
 * Fuente de verdad para el UI en español chileno.
 * Espeja el contenido de shared/cookie_consent_texts.py::COOKIE_CATEGORIES_TEXT_V1.
 *
 * IMPORTANTE: cualquier cambio aquí debe reflejarse en el archivo Python y
 * requiere recalcular COOKIE_CONSENT_POLICY_HASH (Pieza 4 del bloque).
 * Los cambios requieren commit tipo "legal:" con aprobación humana.
 *
 * Referencia legal:
 * - GDPR Art. 7(1): demostrabilidad del consentimiento.
 * - GDPR Art. 4(11): consentimiento libre, específico, informado, inequívoco.
 * - Planet49 C-673/17 (TJUE 2019-10-01): toggles no esenciales OFF por defecto.
 * - Ley 19.628 Art. 4° (Chile): información al titular al recolectar datos.
 * - Ley 21.719 (Chile, vigencia 2026-12-01): consentimiento GDPR-like.
 *   Diario Oficial CVE 2583630, Art. 1° transitorio (día primero del mes
 *   vigésimo cuarto posterior a la publicación 2024-12-13).
 */

export const COOKIE_CONSENT_POLICY_VERSION = '1.1.0';

/** Hash SHA-256 del texto canónico de categorías.
 * Generado en backend/constants/legal_versions.py y en shared/cookie_consent_texts.py.
 * Pieza 4 valida coincidencia byte-a-byte entre Python y TypeScript.
 */
export const COOKIE_CONSENT_POLICY_HASH =
  'bba33024bae091584f975585fffd78198321ab2878680ec920103d828a27d316';

/** Textos del banner (primera capa). Plan §9.1. */
export const COOKIE_BANNER_TEXTS = {
  title: 'Usamos cookies para que Conniku funcione bien',
  body: 'Necesitamos tu permiso para algunas de ellas. Las cookies estrictamente necesarias mantienen tu sesión activa; las demás nos ayudan a recordar tus preferencias y a mejorar la plataforma. Puedes aceptar todas, rechazar las no esenciales, o personalizar qué permites.',
  /** D-04: aviso de retracto visible en primera capa (GDPR Art. 7(3), Ley 21.719 Art. 1°). */
  retractNotice:
    "Puedes cambiar o retirar tu decisión en cualquier momento desde el enlace 'Cookies' en el pie de la página.",
  btnAcceptAll: 'Aceptar todas',
  btnRejectAll: 'Rechazar todas',
  btnCustomize: 'Personalizar',
  linkPolicy: 'Más detalles en nuestra',
  linkPolicyText: 'Política de Cookies',
  linkPolicyPath: '/cookies',
} as const;

/** Textos del modal de personalización (segunda capa). Plan §9.2. */
export const COOKIE_SETTINGS_TEXTS = {
  title: 'Configurar cookies',
  subtitle:
    'Elige qué cookies permites. Puedes cambiar estas preferencias cuando quieras desde el pie de la página.',
  btnSave: 'Guardar preferencias',
  btnAcceptAll: 'Aceptar todas',
  btnRejectAll: 'Rechazar todas',
  btnRevokeAll: 'Retirar todo el consentimiento',
  reloadMessage: 'Para aplicar completamente los cambios debemos recargar la página.',
  reloadNow: 'Recargar ahora',
  reloadLater: 'Más tarde',
  gdprNote: 'Derecho de retiro: GDPR Art. 7(3)',
} as const;

/** Textos por categoría. Espeja COOKIE_CATEGORIES_TEXT_V1 del archivo Python. */
export const COOKIE_CATEGORY_TEXTS = {
  necessary: {
    name: 'Estrictamente necesarias',
    description:
      'Siempre activas. Permiten iniciar sesión, mantener tu sesión abierta y que Conniku funcione offline. Sin ellas, el servicio no puede prestarse.',
    legalBasis: 'Base legal: ejecución del contrato (Art. 6(1)(b) RGPD)',
    alwaysOn: true,
  },
  functional: {
    name: 'Funcionales',
    description:
      'Recuerdan tu idioma, tema visual, tour de bienvenida y progreso académico local entre visitas. No se comparten con terceros con fines publicitarios.',
    legalBasis: 'Base legal: consentimiento (Art. 6(1)(a) RGPD)',
    alwaysOn: false,
  },
  analytics: {
    name: 'Analíticas',
    description:
      'Nos permiten entender cómo se usa Conniku de forma anónima y agregada, para mejorar la plataforma. Hoy no tenemos integraciones externas activas; este toggle queda preparado para cuando las activemos.',
    legalBasis: 'Base legal: consentimiento (Art. 6(1)(a) RGPD)',
    alwaysOn: false,
  },
  marketing: {
    name: 'Marketing',
    description:
      'Medir el resultado de campañas y enviarte comunicaciones comerciales según tus intereses. Hoy Conniku no usa cookies de marketing y tus datos personales no se comparten con redes publicitarias. Este toggle queda preparado para futuras funcionalidades opcionales.',
    legalBasis: 'Base legal: consentimiento (Art. 6(1)(a) RGPD)',
    alwaysOn: false,
  },
} as const;

export type CookieCategoryKey = keyof typeof COOKIE_CATEGORY_TEXTS;
