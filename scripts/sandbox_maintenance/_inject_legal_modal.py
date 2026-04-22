"""Inyecta modal flotante legal + actualiza footer popover en los 52 HTMLs.

Cambios por archivo (idempotente):
1. Popover "Legal": quita "Política de Reembolso" y "Eliminación de Cuenta",
   agrega "Declaración de Edad". Los 4 links abren modal flotante con iframe
   que carga legal-terms.html / legal-privacy.html / legal-cookies.html /
   legal-age-declaration.html (generados por _build_legal_pages.py).
2. Inyecta CSS + HTML + JS del modal antes del marcador de cookies o </body>.

Decisión Cristian 2026-04-21: Reembolso queda dentro de T&C (Art. 9), no
tiene link separado en footer. Eliminación de Cuenta no va al footer
(es formulario funcional en /delete-account del producto React, no
aplicable al landing público).

Uso: python3 _inject_legal_modal.py
"""

from __future__ import annotations

from pathlib import Path

SANDBOX = Path("/Users/cristiang./CONNIKU/public/sandbox")

MARKER_START = "<!-- CONNIKU-LEGAL-MODAL-INJECTED-START -->"
MARKER_END = "<!-- CONNIKU-LEGAL-MODAL-INJECTED-END -->"

# Popover actual con 5 links; reemplazar por 4
OLD_LEGAL_LIST = (
    '<li><a href="#">Términos y Condiciones</a></li>\n'
    '            <li><a href="#">Política de Privacidad</a></li>\n'
    '            <li><a href="#">Política de Cookies</a></li>\n'
    '            <li><a href="#">Política de Reembolso</a></li>\n'
    '            <li><a href="#">Eliminación de Cuenta</a></li>'
)

NEW_LEGAL_LIST = (
    '<li><a href="#" onclick="openLegalModal(\'terms\'); return false">Términos y Condiciones</a></li>\n'
    '            <li><a href="#" onclick="openLegalModal(\'privacy\'); return false">Política de Privacidad</a></li>\n'
    '            <li><a href="#" onclick="openLegalModal(\'cookies\'); return false">Política de Cookies</a></li>\n'
    '            <li><a href="#" onclick="openLegalModal(\'age-declaration\'); return false">Declaración de Edad</a></li>'
)

MODAL_BLOCK = f"""
{MARKER_START}
<style>
  .legal-modal-overlay {{
    position: fixed;
    inset: 0;
    background: rgba(13, 15, 16, 0.7);
    z-index: 10001;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }}
  .legal-modal-overlay.is-visible {{ display: flex; }}
  .legal-modal-panel {{
    background: var(--paper, #F5F4EF);
    border: 2px solid var(--ink, #0D0F10);
    box-shadow: 12px 12px 0 var(--ink, #0D0F10);
    width: 100%;
    max-width: 860px;
    height: 90vh;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    font-family: var(--fd, 'Funnel Display', sans-serif);
    color: var(--ink, #0D0F10);
  }}
  .legal-modal-head {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 2px solid var(--ink, #0D0F10);
    background: var(--paper, #F5F4EF);
    flex-shrink: 0;
  }}
  .legal-modal-title {{
    font-weight: 800;
    font-size: 18px;
    letter-spacing: -0.01em;
    margin: 0;
  }}
  .legal-modal-close {{
    background: transparent;
    border: 2px solid var(--ink, #0D0F10);
    font-family: var(--fd, 'Funnel Display', sans-serif);
    font-weight: 700;
    font-size: 14px;
    padding: 6px 14px;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--ink, #0D0F10);
    transition: all 0.1s ease;
  }}
  .legal-modal-close:hover {{
    box-shadow: 3px 3px 0 var(--ink, #0D0F10);
    transform: translate(-1px, -1px);
    background: var(--orange, #FF4A1C);
    color: var(--paper, #F5F4EF);
  }}
  .legal-modal-body {{
    flex: 1;
    overflow: hidden;
    background: var(--paper, #F5F4EF);
  }}
  .legal-modal-iframe {{
    width: 100%;
    height: 100%;
    border: none;
    background: var(--paper, #F5F4EF);
  }}
  @media (max-width: 640px) {{
    .legal-modal-overlay {{ padding: 8px; }}
    .legal-modal-panel {{ height: 95vh; max-height: 95vh; }}
    .legal-modal-head {{ padding: 12px 16px; }}
    .legal-modal-title {{ font-size: 15px; }}
  }}
</style>

<div id="legalModalOverlay" class="legal-modal-overlay" onclick="legalModalBgClick(event)" role="dialog" aria-modal="true" aria-labelledby="legalModalTitle">
  <div class="legal-modal-panel">
    <div class="legal-modal-head">
      <h2 id="legalModalTitle" class="legal-modal-title">Documento legal</h2>
      <button class="legal-modal-close" onclick="closeLegalModal()" aria-label="Cerrar documento legal">Cerrar</button>
    </div>
    <div class="legal-modal-body">
      <iframe id="legalModalIframe" class="legal-modal-iframe" src="about:blank" title="Documento legal"></iframe>
    </div>
  </div>
</div>

<script>
  (function () {{
    const LEGAL_DOCS = {{
      'terms': {{ file: 'legal-terms.html', title: 'Términos y Condiciones' }},
      'privacy': {{ file: 'legal-privacy.html', title: 'Política de Privacidad' }},
      'cookies': {{ file: 'legal-cookies.html', title: 'Política de Cookies' }},
      'age-declaration': {{ file: 'legal-age-declaration.html', title: 'Declaración de Edad' }}
    }};
    // Hashes canónicos v2.4.2 (sincronizados con CANONICAL_HASHES del backend
    // en backend/legal_document_views_routes.py — si aquí quedan stale, el
    // endpoint POST /legal/documents/:doc/viewed devuelve 409).
    const DOC_HASHES = {{
      'terms': '9a16122f985a1d252a5928c5fae518b5bd23ac6ee00996ee9e8293c4aaf08dce',
      'privacy': 'a09d799c7f34d7100b9393ad7c55c54931ab7e396d0f03b559a59545638e6962',
      'cookies': '80d41f71f075ae954a4e5f1763266b9830d38849bbe79a7bb931c2a4ee30e38c',
      'age-declaration': '61dab2ecf1b27e3fb212efcf5a066784943c689de11611bb6d2b919e39441a9b'
    }};
    const VISITOR_UUID_KEY = 'conniku_visitor_uuid';
    const API_BASE = 'https://studyhub-api-bpco.onrender.com';
    const LS_PENDING_VIEWS_KEY = 'conniku_pending_views_sync';

    let previousFocus = null;
    let currentDocKey = null;
    let scrolledToEnd = false;

    function getVisitorUuid() {{
      try {{ return localStorage.getItem(VISITOR_UUID_KEY) || 'anon'; }} catch (_) {{ return 'anon'; }}
    }}

    // ─── POST /legal/documents/{{doc}}/viewed (D-S4=A + D-S8=B) ─────
    async function postDocumentViewed(docKey, didScrollToEnd) {{
      const sessionToken = getVisitorUuid();
      const docHash = DOC_HASHES[docKey];
      const payload = {{
        session_token: sessionToken,
        doc_hash: docHash,
        scrolled_to_end: didScrollToEnd,
      }};
      const response = await fetch(API_BASE + '/legal/documents/' + docKey + '/viewed', {{
        method: 'POST',
        headers: {{ 'Content-Type': 'application/json' }},
        body: JSON.stringify(payload),
      }});
      if (!response.ok) throw new Error('HTTP ' + response.status);
    }}

    function queuePendingView(docKey, scrolledToEnd) {{
      try {{
        const pending = JSON.parse(localStorage.getItem(LS_PENDING_VIEWS_KEY) || '[]');
        pending.push({{ docKey, scrolledToEnd, ts: Date.now() }});
        localStorage.setItem(LS_PENDING_VIEWS_KEY, JSON.stringify(pending));
      }} catch (_) {{}}
    }}

    async function retryPendingViews() {{
      try {{
        const pending = JSON.parse(localStorage.getItem(LS_PENDING_VIEWS_KEY) || '[]');
        if (!pending.length) return;
        const remaining = [];
        for (const item of pending) {{
          try {{
            await postDocumentViewed(item.docKey, item.scrolledToEnd);
          }} catch (_) {{
            remaining.push(item);
          }}
        }}
        localStorage.setItem(LS_PENDING_VIEWS_KEY, JSON.stringify(remaining));
      }} catch (_) {{}}
    }}

    async function safePostView(docKey, didScrollToEnd) {{
      try {{
        await postDocumentViewed(docKey, didScrollToEnd);
      }} catch (err) {{
        console.warn('[sandbox] document view POST falló, retry en próxima visita', err);
        queuePendingView(docKey, didScrollToEnd);
      }}
    }}

    // Detectar scroll ≥90% en el iframe
    function setupScrollDetection(iframeEl, docKey) {{
      scrolledToEnd = false;
      try {{
        iframeEl.addEventListener('load', function () {{
          try {{
            const doc = iframeEl.contentDocument || iframeEl.contentWindow.document;
            if (!doc || !doc.documentElement) return;
            iframeEl.contentWindow.addEventListener('scroll', function () {{
              if (scrolledToEnd) return;
              const el = doc.documentElement;
              const scrollPct = (el.scrollTop + el.clientHeight) / el.scrollHeight;
              if (scrollPct >= 0.9) {{
                scrolledToEnd = true;
                safePostView(docKey, true);
              }}
            }});
          }} catch (_) {{ /* cross-origin o iframe sin doc */ }}
        }});
      }} catch (_) {{}}
    }}

    window.openLegalModal = function (docKey) {{
      const doc = LEGAL_DOCS[docKey];
      if (!doc) return;
      currentDocKey = docKey;
      scrolledToEnd = false;
      previousFocus = document.activeElement;
      document.getElementById('legalModalTitle').textContent = doc.title;
      const iframeEl = document.getElementById('legalModalIframe');
      setupScrollDetection(iframeEl, docKey);
      iframeEl.src = doc.file;
      document.getElementById('legalModalOverlay').classList.add('is-visible');
      document.body.style.overflow = 'hidden';
      document.querySelectorAll('.footer-popover.is-open').forEach(function (el) {{
        el.classList.remove('is-open');
      }});
      // POST apertura (scrolled_to_end=false inicial)
      safePostView(docKey, false);
    }};

    window.closeLegalModal = function () {{
      document.getElementById('legalModalOverlay').classList.remove('is-visible');
      document.getElementById('legalModalIframe').src = 'about:blank';
      document.body.style.overflow = '';
      currentDocKey = null;
      if (previousFocus && typeof previousFocus.focus === 'function') {{
        previousFocus.focus();
      }}
    }};

    window.legalModalBgClick = function (e) {{
      if (e.target && e.target.id === 'legalModalOverlay') {{
        window.closeLegalModal();
      }}
    }};

    document.addEventListener('keydown', function (e) {{
      if (e.key === 'Escape') {{
        const ov = document.getElementById('legalModalOverlay');
        if (ov && ov.classList.contains('is-visible')) {{
          e.preventDefault();
          window.closeLegalModal();
        }}
      }}
    }});

    // Retry views pendientes al cargar
    document.addEventListener('DOMContentLoaded', function () {{
      retryPendingViews();
    }});
  }})();
</script>
{MARKER_END}
"""


def patch(html: str) -> tuple[str, bool, bool]:
    """Retorna (nuevo_html, footer_actualizado, modal_inyectado)."""
    new_html = html
    footer_updated = False
    modal_injected = False

    # 1. Update footer popover si tiene la lista vieja
    if OLD_LEGAL_LIST in new_html:
        new_html = new_html.replace(OLD_LEGAL_LIST, NEW_LEGAL_LIST, 1)
        footer_updated = True
    elif "Política de Reembolso" in new_html and "Declaración de Edad" not in new_html:
        # Variante diferente del popover — lo intentamos igualmente
        # (algunos archivos pueden tener whitespace distinto)
        pass

    # 2. Inject modal block antes de </body>
    if MARKER_START not in new_html and "</body>" in new_html:
        new_html = new_html.replace("</body>", MODAL_BLOCK + "</body>", 1)
        modal_injected = True

    return new_html, footer_updated, modal_injected


def main() -> None:
    files = sorted(SANDBOX.glob("*.html"))
    # Excluir los 4 legal-*.html generados por _build_legal_pages.py
    files = [f for f in files if not f.name.startswith("legal-")]

    stats = {"total": len(files), "footer_updated": 0, "modal_injected": 0, "no_change": 0}
    for path in files:
        try:
            content = path.read_text(encoding="utf-8")
        except Exception as e:
            print(f"SKIP read error {path.name}: {e}")
            continue
        new_content, footer_updated, modal_injected = patch(content)
        if footer_updated or modal_injected:
            path.write_text(new_content, encoding="utf-8")
            marks = []
            if footer_updated:
                marks.append("footer")
                stats["footer_updated"] += 1
            if modal_injected:
                marks.append("modal")
                stats["modal_injected"] += 1
            print(f"OK {path.name} [{', '.join(marks)}]")
        else:
            stats["no_change"] += 1

    print()
    print(f"Total HTMLs (excluyendo legal-*.html): {stats['total']}")
    print(f"Footer actualizado: {stats['footer_updated']}")
    print(f"Modal inyectado: {stats['modal_injected']}")
    print(f"Sin cambios: {stats['no_change']}")


if __name__ == "__main__":
    main()
