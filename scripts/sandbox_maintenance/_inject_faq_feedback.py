"""Inyecta botones 👍/👎 de feedback por FAQ en soporte.html del sandbox.

Usa data-faq-id estables (catálogo en docs/support/faq-catalog.md).
Al click en 👎 se expande textarea + botón "Enviar".
JS vanilla hace POST /support/feedback con session_token del visitor_uuid.
Fallback D-S8=B: si POST falla, guarda en localStorage.

Idempotente: si el widget ya está inyectado (detectado por marker), no duplica.
Solo aplica a soporte.html.
"""

from __future__ import annotations

from pathlib import Path

SANDBOX = Path("/Users/cristiang./CONNIKU/public/sandbox")
SOPORTE_HTML = SANDBOX / "soporte.html"

MARKER_START = "<!-- CONNIKU-FAQ-FEEDBACK-INJECTED-START -->"
MARKER_END = "<!-- CONNIKU-FAQ-FEEDBACK-INJECTED-END -->"

# Mapeo: texto de la <summary> → faq_id estable
FAQ_ID_MAP: dict[str, str] = {
    "¿Cómo creo mi cuenta?": "account-create",
    "Olvidé mi contraseña, ¿cómo la recupero?": "account-password-recovery",
    "¿Puedo cambiar mi correo electrónico?": "account-change-email",
    "¿Cómo elimino mi cuenta?": "account-delete",
    "¿Conniku está disponible en otros idiomas?": "account-language",
    "¿Cuántas asignaturas puedo crear?": "subject-limit",
    "¿Cómo subo documentos a una asignatura?": "subject-upload-doc",
    "¿Qué formatos de archivo acepta Conniku?": "subject-formats",
    "¿Los quizzes se generan automáticamente?": "subject-quizzes-auto",
    "¿Cómo funciona el predictor de exámenes?": "subject-exam-predictor",
    "¿Qué son las flashcards y cómo se usan?": "subject-flashcards",
    "¿Qué hace la extensión de Chrome?": "ext-what-does",
    "¿Es segura? ¿Qué datos recopila?": "ext-security",
    "¿Por qué me sale error al sincronizar?": "ext-sync-error",
    "¿Funciona con mi universidad?": "ext-compatibility",
    "¿Cómo instalo la extensión?": "ext-install",
    "¿Cuánto cuesta Conniku Pro?": "billing-price",
    "¿Qué métodos de pago aceptan?": "billing-payment-methods",
    "¿Puedo cancelar en cualquier momento?": "billing-cancel",
    "¿Cómo solicito un reembolso?": "billing-refund",
    "¿Qué es el Sprint de 7 días?": "billing-sprint",
    "¿Hay descuento para grupos?": "billing-group-discount",
    "¿De dónde viene el contenido de la Biblioteca?": "library-sources",
    "¿Puedo descargar los libros?": "library-download",
    "¿Puedo clonar un libro a mi asignatura?": "library-clone",
    "¿Cómo funciona el chat de estudio?": "assistant-how-works",
    "¿Cuántos mensajes puedo enviar por día?": "assistant-message-limit",
    "¿Qué es un mapa conceptual?": "assistant-concept-map",
    "¿Puedo exportar mis resúmenes?": "assistant-export",
    "¿Cómo agrego amigos?": "community-add-friends",
    "¿Qué son las Comunidades?": "community-what-are",
    "¿El chat es privado?": "community-chat-private",
    "¿Conniku vende mis datos?": "privacy-sells-data",
    "¿Dónde se almacenan mis datos?": "privacy-data-storage",
    "¿Puedo eliminar todos mis datos?": "privacy-delete-data",
    "No puedo iniciar sesión": "tsh-login",
    "La página carga lento o no carga": "tsh-slow-load",
    "Error al subir un documento": "tsh-upload-error",
    "El chat no responde o da error": "tsh-chat-error",
    "Error al sincronizar la extensión Chrome": "tsh-ext-sync-error",
    "No puedo pagar o el pago falló": "tsh-payment-failed",
    "Los quizzes no se generan": "tsh-quizzes-not-generated",
}

CSS_SNIPPET = """
<style>
  .faq-feedback {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 18px 12px 18px;
    border-top: 1px dashed var(--ink-3, #696C6F);
    margin-top: 8px;
    font-family: var(--fm, 'Geist Mono', monospace);
    font-size: 12px;
    color: var(--ink-3, #696C6F);
    flex-wrap: wrap;
  }
  .faq-feedback .faq-fb-label { flex-shrink: 0; }
  .faq-feedback .faq-fb-btn {
    font-family: var(--fm, 'Geist Mono', monospace);
    font-size: 13px;
    background: transparent;
    border: 1.5px solid var(--ink-3, #696C6F);
    color: var(--ink, #0D0F10);
    padding: 4px 10px;
    cursor: pointer;
    transition: all 0.1s ease;
    line-height: 1;
  }
  .faq-feedback .faq-fb-btn:hover {
    border-color: var(--ink, #0D0F10);
    box-shadow: 2px 2px 0 var(--ink, #0D0F10);
    transform: translate(-1px, -1px);
  }
  .faq-feedback .faq-fb-btn.voted {
    background: var(--lime, #D9FF3A);
    border-color: var(--ink, #0D0F10);
    cursor: default;
  }
  .faq-feedback .faq-fb-btn.voted:hover {
    transform: none;
    box-shadow: none;
  }
  .faq-feedback .faq-fb-comment {
    display: none;
    width: 100%;
    margin-top: 8px;
    flex-direction: column;
    gap: 6px;
  }
  .faq-feedback .faq-fb-comment.is-visible { display: flex; }
  .faq-feedback .faq-fb-textarea {
    font-family: var(--fm, 'Geist Mono', monospace);
    font-size: 12px;
    padding: 8px 10px;
    border: 1.5px solid var(--ink-3, #696C6F);
    background: var(--paper, #F5F4EF);
    color: var(--ink, #0D0F10);
    resize: vertical;
    min-height: 60px;
    max-height: 140px;
    width: 100%;
  }
  .faq-feedback .faq-fb-textarea:focus {
    outline: none;
    border-color: var(--ink, #0D0F10);
  }
  .faq-feedback .faq-fb-send {
    font-family: var(--fd, 'Funnel Display', sans-serif);
    font-weight: 700;
    font-size: 12px;
    background: var(--orange, #FF4A1C);
    color: var(--paper, #F5F4EF);
    border: 1.5px solid var(--ink, #0D0F10);
    padding: 6px 14px;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    align-self: flex-end;
    transition: all 0.1s ease;
  }
  .faq-feedback .faq-fb-send:hover {
    box-shadow: 3px 3px 0 var(--ink, #0D0F10);
    transform: translate(-1px, -1px);
  }
  .faq-feedback .faq-fb-thanks {
    display: none;
    color: var(--ink-2, #2B2E30);
    font-size: 12px;
  }
  .faq-feedback .faq-fb-thanks.is-visible { display: block; }
</style>
"""

JS_SNIPPET = """
<script>
  (function () {
    const API_BASE = 'https://studyhub-api-bpco.onrender.com';
    const VISITOR_UUID_KEY = 'conniku_visitor_uuid';
    const LS_PENDING_FEEDBACK_KEY = 'conniku_pending_feedback_sync';

    function getVisitorUuid() {
      try { return localStorage.getItem(VISITOR_UUID_KEY) || 'anon'; } catch (_) { return 'anon'; }
    }

    async function postFeedback(faqId, useful, comment) {
      const payload = {
        faq_id: faqId,
        useful: useful,
        comment: comment || null,
        session_token: getVisitorUuid(),
      };
      const response = await fetch(API_BASE + '/support/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
    }

    function queuePendingFeedback(faqId, useful, comment) {
      try {
        const pending = JSON.parse(localStorage.getItem(LS_PENDING_FEEDBACK_KEY) || '[]');
        pending.push({ faqId, useful, comment, ts: Date.now() });
        localStorage.setItem(LS_PENDING_FEEDBACK_KEY, JSON.stringify(pending));
      } catch (_) {}
    }

    async function safePostFeedback(faqId, useful, comment) {
      try {
        await postFeedback(faqId, useful, comment);
      } catch (err) {
        console.warn('[sandbox] feedback POST falló, retry en próxima visita', err);
        queuePendingFeedback(faqId, useful, comment);
      }
    }

    async function retryPendingFeedback() {
      try {
        const pending = JSON.parse(localStorage.getItem(LS_PENDING_FEEDBACK_KEY) || '[]');
        if (!pending.length) return;
        const remaining = [];
        for (const item of pending) {
          try {
            await postFeedback(item.faqId, item.useful, item.comment);
          } catch (_) {
            remaining.push(item);
          }
        }
        localStorage.setItem(LS_PENDING_FEEDBACK_KEY, JSON.stringify(remaining));
      } catch (_) {}
    }

    // Inicializar todos los widgets de feedback
    document.querySelectorAll('.faq-feedback').forEach(function (widget) {
      const faqId = widget.dataset.faqId;
      if (!faqId) return;

      const btnYes = widget.querySelector('[data-useful="true"]');
      const btnNo = widget.querySelector('[data-useful="false"]');
      const commentArea = widget.querySelector('.faq-fb-comment');
      const textarea = widget.querySelector('.faq-fb-textarea');
      const sendBtn = widget.querySelector('.faq-fb-send');
      const thanks = widget.querySelector('.faq-fb-thanks');

      function markVoted() {
        if (btnYes) { btnYes.classList.add('voted'); btnYes.disabled = true; }
        if (btnNo) { btnNo.classList.add('voted'); btnNo.disabled = true; }
        if (sendBtn) { sendBtn.disabled = true; }
      }

      function showThanks() {
        if (thanks) thanks.classList.add('is-visible');
        if (commentArea) commentArea.classList.remove('is-visible');
      }

      if (btnYes) {
        btnYes.addEventListener('click', function () {
          markVoted();
          showThanks();
          safePostFeedback(faqId, true, null);
        });
      }

      if (btnNo) {
        btnNo.addEventListener('click', function () {
          if (commentArea) commentArea.classList.add('is-visible');
          if (textarea) textarea.focus();
        });
      }

      if (sendBtn) {
        sendBtn.addEventListener('click', function () {
          const comment = textarea ? textarea.value.trim() : '';
          markVoted();
          showThanks();
          safePostFeedback(faqId, false, comment || null);
        });
      }
    });

    // Retry pendientes al cargar
    document.addEventListener('DOMContentLoaded', function () {
      retryPendingFeedback();
    });
  })();
</script>
"""


def make_feedback_widget(faq_id: str) -> str:
    return (
        f'<div class="faq-feedback" data-faq-id="{faq_id}">'
        '<span class="faq-fb-label">¿Te resultó útil?</span>'
        '<button class="faq-fb-btn" data-useful="true" aria-label="Sí, fue útil">👍 Sí</button>'
        '<button class="faq-fb-btn" data-useful="false" aria-label="No, no fue útil">👎 No</button>'
        '<div class="faq-fb-comment">'
        '<textarea class="faq-fb-textarea" placeholder="¿Qué mejorarías? (opcional, máx. 500 caracteres)" maxlength="500"></textarea>'
        '<button class="faq-fb-send">Enviar</button>'
        '</div>'
        '<span class="faq-fb-thanks">Gracias por tu respuesta.</span>'
        '</div>'
    )


def inject_feedback(html: str) -> tuple[str, int]:
    """
    Agrega data-faq-id y widget de feedback a cada <details> de soporte.html.
    Idempotente: no duplica si faq-feedback ya está presente en ese <details>.
    Retorna (nuevo_html, cantidad_inyectados).
    """
    import re

    injected_count = 0
    result = html

    for summary_text, faq_id in FAQ_ID_MAP.items():
        # Buscar el <details> que contiene este summary_text
        # Patrón: <details... > hasta el </details> que le corresponde
        pattern = rf'(<details(?:[^>]*)>)\s*(<summary>[^<]*{re.escape(summary_text)}[^<]*</summary>)'
        match = re.search(pattern, result)
        if not match:
            continue

        details_open_tag = match.group(1)

        # Si ya tiene data-faq-id, skip
        if f'data-faq-id="{faq_id}"' in result[max(0, match.start() - 10):match.end() + 200]:
            continue

        # Agregar data-faq-id al <details> si no lo tiene
        if 'data-faq-id' not in details_open_tag:
            new_details_tag = details_open_tag.replace('<details', f'<details data-faq-id="{faq_id}"', 1)
            result = result[:match.start(1)] + new_details_tag + result[match.end(1):]
            # Re-buscar el match para insertar el widget después del contenido
            match = re.search(pattern, result)
            if not match:
                continue

        widget = make_feedback_widget(faq_id)

        # Insertar el widget antes del </details> correspondiente
        # Buscamos el final del bloque de este <details>
        start_pos = match.start()
        # Encontrar el </details> después del match
        close_pos = result.find('</details>', start_pos + len(match.group(0)))
        if close_pos == -1:
            continue

        # Verificar que no hay ya un widget de feedback
        fragment = result[start_pos:close_pos]
        if 'faq-feedback' in fragment:
            continue

        result = result[:close_pos] + widget + result[close_pos:]
        injected_count += 1

    return result, injected_count


def inject_css_js(html: str) -> tuple[str, bool]:
    """Inyecta CSS + JS del widget antes de </body>. Idempotente."""
    if MARKER_START in html:
        return html, False
    if "</body>" not in html:
        return html, False

    block = f"\n{MARKER_START}\n{CSS_SNIPPET}\n{JS_SNIPPET}\n{MARKER_END}\n"
    new_html = html.replace("</body>", block + "</body>", 1)
    return new_html, True


def main() -> None:
    if not SOPORTE_HTML.exists():
        print(f"ERROR: No se encuentra {SOPORTE_HTML}")
        return

    content = SOPORTE_HTML.read_text(encoding="utf-8")

    # 1. Inyectar widgets por FAQ
    new_content, count = inject_feedback(content)
    if count > 0:
        print(f"Widgets inyectados: {count}")
    else:
        print("Sin nuevos widgets (ya inyectados o no encontrados)")

    # 2. Inyectar CSS + JS
    new_content, css_injected = inject_css_js(new_content)
    if css_injected:
        print("CSS + JS del widget inyectados")
    else:
        print("CSS + JS ya presentes (skip)")

    if count > 0 or css_injected:
        SOPORTE_HTML.write_text(new_content, encoding="utf-8")
        print(f"Archivo actualizado: {SOPORTE_HTML}")
    else:
        print("Sin cambios necesarios en soporte.html")


if __name__ == "__main__":
    main()
