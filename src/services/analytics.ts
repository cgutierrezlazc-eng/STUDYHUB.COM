/**
 * analytics.ts — Servicio de carga condicional de scripts de analítica.
 *
 * Implementa el gating de scripts según consentimiento (plan §7).
 * Invariante I-10: scripts con data-consent="analytics" NO se inyectan
 * en el DOM si consent.analytics === false.
 *
 * HOY no hay integraciones activas (GA, Plausible, PostHog, Mixpanel).
 * Este módulo provisiona la infraestructura para cuando se integren.
 * Ver plan §3.3 y §7.4.
 *
 * Pieza 3 del bloque bloque-cookie-consent-banner-v1.
 */

/** Carga un script externo de analytics en el DOM si aún no está presente.
 * El script se etiqueta con data-consent="analytics" para identificación.
 * Solo se llama si isAnalyticsAllowed() === true.
 */
function injectScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.setAttribute('data-consent', 'analytics');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load analytics script: ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Carga scripts de analytics si el consentimiento está activo.
 *
 * @param analyticsAllowed - resultado de isAnalyticsAllowed() del contexto.
 *
 * Llamada desde CookieConsentProvider en useEffect cada vez que
 * consent.analytics cambia a true.
 *
 * Si cambia de true a false en la sesión, los scripts ya cargados NO se
 * desinstalan dinámicamente (imposible sin recargar). El provider avisa
 * al usuario que recargue (plan §6.4).
 */
export async function loadAnalyticsIfConsented(analyticsAllowed: boolean): Promise<void> {
  if (!analyticsAllowed) return;

  // Placeholder: aquí se cargarán los scripts reales cuando se integren.
  // Ejemplo futuro (bloque analytics-v1):
  //   await injectScript('https://www.googletagmanager.com/gtag/js?id=GA_ID', 'ga-script');
  //
  // Por ahora no hay scripts externos activos (plan §3.3 verificado con Grep).
  void injectScript; // evitar "declared but never read" hasta que se use
}

/**
 * Carga scripts de marketing si el consentimiento está activo.
 *
 * @param marketingAllowed - resultado de isMarketingAllowed() del contexto.
 *
 * Placeholder para Meta Pixel, TikTok Pixel, etc. (plan §3.4).
 */
export async function loadMarketingScriptsIfConsented(marketingAllowed: boolean): Promise<void> {
  if (!marketingAllowed) return;

  // Placeholder: no hay integraciones activas de marketing hoy.
  // Ejemplo futuro: await injectScript('https://connect.facebook.net/...', 'meta-pixel');
}

/**
 * Registra un evento de producto en el backend propio (sin third-party).
 * Clasificado como "analítica de funcionamiento interno, base legal interés
 * legítimo Art. 6(1)(f) RGPD" — sin PII, solo nombre del evento y timestamp
 * bucketizado por hora. No requiere gate de consentimiento de cookies.
 *
 * Placeholder: implementación real en bloque analytics-v1.
 */
export async function logServerSideEvent(
  _eventName: string,
  _metadata?: Record<string, unknown>
): Promise<void> {
  // Placeholder: sin implementación activa en v1.
  // La función existe para que el gating infrastructure esté disponible.
}
