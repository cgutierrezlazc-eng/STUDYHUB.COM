// ═══════════════════════════════════════════════════════════════
// INJECTOR — Script que se inyecta en el "main world" de la pagina
// Tiene acceso a las variables JS de la pagina (M.cfg en Moodle, ENV en Canvas)
// Se comunica con el content script via window.postMessage
// ═══════════════════════════════════════════════════════════════

// Este archivo se declara en web_accessible_resources del manifest
// y se inyecta por el detector cuando necesita leer variables del main world

(function conniku_injector() {
  // Prevenir doble inyeccion
  if ((window as any).__conniku_injected) return;
  (window as any).__conniku_injected = true;

  // ── Moodle: leer M.cfg ───────────────────────────────────────
  const M = (window as any).M;
  if (M?.cfg) {
    window.postMessage(
      {
        type: 'CONNIKU_MOODLE_CFG',
        sesskey: M.cfg.sesskey || null,
        userid: M.cfg.userid ? String(M.cfg.userid) : null,
        wwwroot: M.cfg.wwwroot || null,
        contextid: M.cfg.contextid || null,
        sitename: M.cfg.sitename || null,
      },
      window.location.origin,
    );
  }

  // ── Canvas: leer ENV ─────────────────────────────────────────
  const ENV = (window as any).ENV;
  if (ENV) {
    window.postMessage(
      {
        type: 'CONNIKU_CANVAS_ENV',
        userId: ENV.current_user_id ? String(ENV.current_user_id) : null,
        userName: ENV.current_user?.display_name || null,
        csrfToken:
          document.querySelector('meta[name="csrf_token"]')?.getAttribute('content') || null,
      },
      window.location.origin,
    );
  }
})();
