"""Inyecta banner de cookies + modal de personalización en los 52 archivos HTML
del sandbox Conniku. Adaptado del componente CookieBanner/CookieSettings de React
al estilo editorial-halftone del landing (Funnel Display + paper/ink).

Decisiones Capa 0 (Cristian 2026-04-21):
- D-01 cc_visitor_uuid esencial con 4 condiciones
- D-02 marketing reformulado (declara no uso actual)
- D-03 functional precisa no compartido con fines publicitarios
- D-04 aviso de retracto en primera capa (GDPR Art. 7(3))
- D-05 botón "Retirar todo" con paridad visual
- D-06 aviso post-login (no aplica al sandbox porque no hay login)
- D-09 fecha Ley 21.719 = 2026-12-01 (Diario Oficial CVE 2583630)

Idempotente: si el snippet ya está insertado (detectado por marker), no duplica.
"""

from __future__ import annotations

import re
from pathlib import Path

SANDBOX_DIR = Path("/Users/cristiang./CONNIKU/public/sandbox")

MARKER_START = "<!-- CONNIKU-COOKIE-BANNER-INJECTED-START -->"
MARKER_END = "<!-- CONNIKU-COOKIE-BANNER-INJECTED-END -->"

BANNER_HTML = """
""" + MARKER_START + """
<style>
  .ck-banner {
    position: fixed;
    left: 16px;
    right: 16px;
    bottom: 16px;
    background: var(--paper, #F5F4EF);
    border: 2px solid var(--ink, #0D0F10);
    box-shadow: 8px 8px 0 var(--ink, #0D0F10);
    padding: 20px 24px;
    z-index: 9999;
    font-family: var(--fd, 'Funnel Display', sans-serif);
    color: var(--ink, #0D0F10);
    max-width: 720px;
    margin: 0 auto;
    display: none;
  }
  .ck-banner.is-visible { display: block; }
  .ck-banner h3 {
    font-size: 18px;
    font-weight: 800;
    margin-bottom: 8px;
    letter-spacing: -0.01em;
  }
  .ck-banner p { font-size: 14px; line-height: 1.4; margin-bottom: 6px; }
  .ck-banner .ck-retract-notice {
    font-size: 12px;
    color: var(--ink-3, #696C6F);
    margin-top: 10px;
    margin-bottom: 14px;
    font-style: italic;
  }
  .ck-banner .ck-btns { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
  .ck-banner button, .ck-modal button {
    font-family: var(--fd, 'Funnel Display', sans-serif);
    font-size: 13px;
    font-weight: 700;
    padding: 10px 16px;
    border: 2px solid var(--ink, #0D0F10);
    background: var(--paper, #F5F4EF);
    color: var(--ink, #0D0F10);
    cursor: pointer;
    transition: all 0.1s ease;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  .ck-banner button:hover, .ck-modal button:hover {
    box-shadow: 3px 3px 0 var(--ink, #0D0F10);
    transform: translate(-1px, -1px);
  }
  .ck-banner .ck-btn-accept { background: var(--lime, #D9FF3A); }
  .ck-banner .ck-btn-reject { background: var(--paper, #F5F4EF); }
  .ck-banner .ck-btn-customize { background: var(--cream, #FFE9B8); }
  .ck-banner a { color: var(--ink, #0D0F10); text-decoration: underline; font-weight: 700; }

  .ck-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(13, 15, 16, 0.6);
    z-index: 10000;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .ck-modal-overlay.is-visible { display: flex; }
  .ck-modal {
    background: var(--paper, #F5F4EF);
    border: 2px solid var(--ink, #0D0F10);
    box-shadow: 12px 12px 0 var(--ink, #0D0F10);
    max-width: 640px;
    width: 100%;
    max-height: 85vh;
    overflow-y: auto;
    padding: 28px;
    font-family: var(--fd, 'Funnel Display', sans-serif);
    color: var(--ink, #0D0F10);
  }
  .ck-modal h2 {
    font-size: 24px;
    font-weight: 800;
    margin-bottom: 6px;
    letter-spacing: -0.02em;
  }
  .ck-modal .ck-subtitle { font-size: 13px; color: var(--ink-3, #696C6F); margin-bottom: 20px; }
  .ck-cat {
    border-top: 1px solid var(--ink, #0D0F10);
    padding: 16px 0;
  }
  .ck-cat:last-of-type { border-bottom: 1px solid var(--ink, #0D0F10); margin-bottom: 16px; }
  .ck-cat-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 6px; }
  .ck-cat-name { font-weight: 800; font-size: 15px; }
  .ck-cat-desc { font-size: 13px; line-height: 1.4; color: var(--ink-2, #2B2E30); margin-bottom: 4px; }
  .ck-cat-legal { font-size: 11px; color: var(--ink-3, #696C6F); font-family: var(--fm, 'Geist Mono', monospace); }
  .ck-toggle {
    position: relative;
    width: 44px;
    height: 24px;
    background: var(--ink-3, #696C6F);
    border: 2px solid var(--ink, #0D0F10);
    cursor: pointer;
    transition: background 0.15s ease;
    flex-shrink: 0;
  }
  .ck-toggle.on { background: var(--lime, #D9FF3A); }
  .ck-toggle.locked { cursor: not-allowed; opacity: 0.6; }
  .ck-toggle::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    background: var(--ink, #0D0F10);
    transition: left 0.15s ease;
  }
  .ck-toggle.on::after { left: 22px; }
  .ck-modal-btns { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
  .ck-modal-btns button { flex: 1 1 auto; min-width: 140px; }
  .ck-modal-btns .ck-btn-save { background: var(--lime, #D9FF3A); }
  .ck-modal-btns .ck-btn-accept-all { background: var(--cream, #FFE9B8); }
  .ck-modal-btns .ck-btn-reject-all { background: var(--paper, #F5F4EF); }
  .ck-modal-btns .ck-btn-revoke { background: var(--pink, #FF4D3A); color: var(--paper, #F5F4EF); }
  .ck-modal .ck-footer { font-size: 11px; color: var(--ink-3, #696C6F); margin-top: 12px; font-family: var(--fm, 'Geist Mono', monospace); }
  .ck-modal .ck-close { position: absolute; top: 16px; right: 16px; background: transparent; border: none; font-size: 24px; cursor: pointer; font-weight: 800; padding: 4px 12px; box-shadow: none !important; }

  @media (max-width: 640px) {
    .ck-banner { left: 8px; right: 8px; bottom: 8px; padding: 16px; }
    .ck-modal { padding: 20px; }
    .ck-modal h2 { font-size: 20px; }
  }
</style>

<div id="ckBanner" class="ck-banner" role="dialog" aria-labelledby="ckBannerTitle" aria-describedby="ckBannerBody">
  <h3 id="ckBannerTitle">Usamos cookies para que Conniku funcione bien</h3>
  <p id="ckBannerBody">Necesitamos tu permiso para algunas de ellas. Las cookies estrictamente necesarias mantienen tu sesión activa; las demás nos ayudan a recordar tus preferencias y a mejorar la plataforma.</p>
  <p class="ck-retract-notice">Puedes cambiar o retirar tu decisión en cualquier momento desde el enlace "Cookies" en el pie de la página.</p>
  <div class="ck-btns">
    <button class="ck-btn-accept" onclick="ckAcceptAll()">Aceptar todas</button>
    <button class="ck-btn-reject" onclick="ckRejectAll()">Rechazar todas</button>
    <button class="ck-btn-customize" onclick="ckOpenModal()">Personalizar</button>
  </div>
</div>

<div id="ckModalOverlay" class="ck-modal-overlay" onclick="ckModalBgClick(event)">
  <div class="ck-modal" role="dialog" aria-labelledby="ckModalTitle">
    <button class="ck-close" aria-label="Cerrar" onclick="ckCloseModal()">×</button>
    <h2 id="ckModalTitle">Configurar cookies</h2>
    <p class="ck-subtitle">Elige qué cookies permites. Puedes cambiar estas preferencias cuando quieras desde el pie de la página.</p>

    <div class="ck-cat">
      <div class="ck-cat-head">
        <span class="ck-cat-name">Estrictamente necesarias</span>
        <div class="ck-toggle on locked" aria-label="Siempre activas" title="Obligatorias"></div>
      </div>
      <p class="ck-cat-desc">Siempre activas. Permiten iniciar sesión, mantener tu sesión abierta y que Conniku funcione offline. Sin ellas, el servicio no puede prestarse.</p>
      <p class="ck-cat-legal">Base legal: ejecución del contrato (Art. 6(1)(b) RGPD)</p>
    </div>

    <div class="ck-cat">
      <div class="ck-cat-head">
        <span class="ck-cat-name">Funcionales</span>
        <div id="ckTogFunctional" class="ck-toggle" onclick="ckToggle('functional')"></div>
      </div>
      <p class="ck-cat-desc">Recuerdan tu idioma, tema visual, tour de bienvenida y progreso académico local entre visitas. No se comparten con terceros con fines publicitarios.</p>
      <p class="ck-cat-legal">Base legal: consentimiento (Art. 6(1)(a) RGPD)</p>
    </div>

    <div class="ck-cat">
      <div class="ck-cat-head">
        <span class="ck-cat-name">Analíticas</span>
        <div id="ckTogAnalytics" class="ck-toggle" onclick="ckToggle('analytics')"></div>
      </div>
      <p class="ck-cat-desc">Nos permiten entender cómo se usa Conniku de forma anónima y agregada, para mejorar la plataforma. Hoy no tenemos integraciones externas activas; este toggle queda preparado para cuando las activemos.</p>
      <p class="ck-cat-legal">Base legal: consentimiento (Art. 6(1)(a) RGPD)</p>
    </div>

    <div class="ck-cat">
      <div class="ck-cat-head">
        <span class="ck-cat-name">Marketing</span>
        <div id="ckTogMarketing" class="ck-toggle" onclick="ckToggle('marketing')"></div>
      </div>
      <p class="ck-cat-desc">Medir el resultado de campañas y enviarte comunicaciones comerciales según tus intereses. Hoy Conniku no usa cookies de marketing y tus datos personales no se comparten con redes publicitarias. Este toggle queda preparado para futuras funcionalidades opcionales.</p>
      <p class="ck-cat-legal">Base legal: consentimiento (Art. 6(1)(a) RGPD)</p>
    </div>

    <div class="ck-modal-btns">
      <button class="ck-btn-accept-all" onclick="ckAcceptAll()">Aceptar todas</button>
      <button class="ck-btn-reject-all" onclick="ckRejectAll()">Rechazar todas</button>
      <button class="ck-btn-save" onclick="ckSavePrefs()">Guardar preferencias</button>
      <button class="ck-btn-revoke" onclick="ckRevokeAll()">Retirar todo el consentimiento</button>
    </div>
    <p class="ck-footer">Derecho de retiro: GDPR Art. 7(3) · Ley 21.719 vigente desde 2026-12-01 (Diario Oficial CVE 2583630, Art. 1° transitorio)</p>
  </div>
</div>

<script>
  (function () {
    const LS_KEY = 'conniku_cookie_consent_v1';
    const LS_PENDING_KEY = 'conniku_pending_consent_sync';
    const VISITOR_UUID_KEY = 'conniku_visitor_uuid';
    const POLICY_VERSION = '1.1.0';
    const POLICY_HASH = 'bba33024bae091584f975585fffd78198321ab2878680ec920103d828a27d316';
    const API_BASE = 'https://studyhub-api-bpco.onrender.com';
    const state = { functional: false, analytics: false, marketing: false };

    // ─── visitor_uuid persistente (D-S4=A) ──────────────────────────
    // UUID generado en primer visit, compartido entre consent + views.
    // Clave: conniku_visitor_uuid (misma que usa el producto React).
    function getOrCreateVisitorUuid() {
      try {
        let uuid = localStorage.getItem(VISITOR_UUID_KEY);
        if (!uuid) {
          uuid = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
              });
          localStorage.setItem(VISITOR_UUID_KEY, uuid);
        }
        return uuid;
      } catch (_) { return 'anon'; }
    }

    // ─── POST real al backend (D-S3=A: origin="sandbox") ────────────
    // D-S8=B: best-effort + localStorage fallback con retry en próxima visita.
    async function postConsentToBackend(consent) {
      const visitorUuid = getOrCreateVisitorUuid();
      const payload = {
        visitor_uuid: visitorUuid,
        categories_accepted: Object.keys(consent).filter((k) => consent[k]),
        policy_version: POLICY_VERSION,
        policy_hash: POLICY_HASH,
        origin: 'sandbox',
      };
      const response = await fetch(API_BASE + '/api/consent/cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
    }

    function markSynced() {
      try { localStorage.removeItem(LS_PENDING_KEY); } catch (_) {}
    }
    function markPendingSync() {
      try { localStorage.setItem(LS_PENDING_KEY, '1'); } catch (_) {}
    }
    function isPendingSync() {
      try { return localStorage.getItem(LS_PENDING_KEY) === '1'; } catch (_) { return false; }
    }

    async function retryPendingSync() {
      const existing = load();
      if (!existing) return;
      try {
        await postConsentToBackend(existing);
        markSynced();
      } catch (_) {
        // silencioso — se reintenta en la siguiente visita
      }
    }

    function load() {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (_) { return null; }
    }
    function save(consent) {
      localStorage.setItem(LS_KEY, JSON.stringify({
        ...consent,
        acceptedAt: new Date().toISOString(),
        policyHash: POLICY_HASH,
        policyVersion: POLICY_VERSION
      }));
    }
    function showBanner() { document.getElementById('ckBanner').classList.add('is-visible'); }
    function hideBanner() { document.getElementById('ckBanner').classList.remove('is-visible'); }
    function openModal() { document.getElementById('ckModalOverlay').classList.add('is-visible'); }
    function closeModal() { document.getElementById('ckModalOverlay').classList.remove('is-visible'); }

    function renderToggles() {
      ['functional', 'analytics', 'marketing'].forEach((k) => {
        const el = document.getElementById('ckTog' + k.charAt(0).toUpperCase() + k.slice(1));
        if (el) el.classList.toggle('on', !!state[k]);
      });
    }

    async function saveAndSync(consent) {
      // 1. Guardar local siempre (UX instantánea)
      save(consent);
      // 2. Intentar POST real (D-S8=B: best-effort)
      try {
        await postConsentToBackend(consent);
        markSynced();
      } catch (err) {
        console.warn('[sandbox] consent POST falló, retry en próxima visita', err);
        markPendingSync();
      }
    }

    window.ckToggle = function (k) {
      state[k] = !state[k];
      renderToggles();
    };
    window.ckAcceptAll = function () {
      state.functional = state.analytics = state.marketing = true;
      renderToggles();
      hideBanner();
      closeModal();
      saveAndSync(state);
    };
    window.ckRejectAll = function () {
      state.functional = state.analytics = state.marketing = false;
      renderToggles();
      hideBanner();
      closeModal();
      saveAndSync(state);
    };
    window.ckSavePrefs = function () {
      hideBanner();
      closeModal();
      saveAndSync(state);
    };
    window.ckRevokeAll = function () {
      localStorage.removeItem(LS_KEY);
      markPendingSync();
      state.functional = state.analytics = state.marketing = false;
      renderToggles();
      closeModal();
      showBanner();
      // POST revocación
      postConsentToBackend({ functional: false, analytics: false, marketing: false })
        .then(markSynced)
        .catch(() => {});
    };
    window.ckOpenModal = function () {
      const existing = load();
      if (existing) {
        state.functional = !!existing.functional;
        state.analytics = !!existing.analytics;
        state.marketing = !!existing.marketing;
      }
      renderToggles();
      openModal();
    };
    window.ckCloseModal = closeModal;
    window.ckModalBgClick = function (e) {
      if (e.target && e.target.id === 'ckModalOverlay') closeModal();
    };

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });

    // Al cargar la página: retry pendiente si aplica, luego mostrar banner si no hay consent
    document.addEventListener('DOMContentLoaded', function () {
      if (isPendingSync()) retryPendingSync();
      const existing = load();
      if (!existing) showBanner();
    });
  })();
</script>
""" + MARKER_END + """
"""


def inject(html: str) -> tuple[str, bool]:
    """Retorna (nuevo_html, fue_modificado). Idempotente."""
    if MARKER_START in html:
        return html, False  # ya inyectado
    # Insertar antes de </body>
    if "</body>" not in html:
        return html, False  # sin </body>, no tocar
    new_html = html.replace("</body>", BANNER_HTML + "</body>", 1)
    return new_html, True


def main() -> None:
    files = sorted(SANDBOX_DIR.glob("*.html"))
    modified = 0
    skipped = 0
    no_body = 0
    for path in files:
        try:
            content = path.read_text(encoding="utf-8")
        except Exception as e:
            print(f"SKIP (read error) {path.name}: {e}")
            skipped += 1
            continue
        new_content, changed = inject(content)
        if not changed:
            if MARKER_START in content:
                skipped += 1
            else:
                no_body += 1
            continue
        path.write_text(new_content, encoding="utf-8")
        modified += 1
    print(f"Total archivos HTML: {len(files)}")
    print(f"Modificados: {modified}")
    print(f"Ya inyectados (skip): {skipped}")
    print(f"Sin </body> (skip): {no_body}")


if __name__ == "__main__":
    main()
