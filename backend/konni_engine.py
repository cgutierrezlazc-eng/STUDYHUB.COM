"""
Konni Engine — Claude Haiku-powered conversational AI for Conniku.
Handles both the user-facing Konni assistant and the admin Konni.
All other AI features (quizzes, guides, flashcards) remain on Gemini.
"""
import os
import json
from pathlib import Path
from database import DATA_DIR

# ── API key resolution ─────────────────────────────────────────────────────
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

CONFIG_FILE = DATA_DIR / "config.json"
if not ANTHROPIC_API_KEY and CONFIG_FILE.exists():
    try:
        config = json.loads(CONFIG_FILE.read_text())
        ANTHROPIC_API_KEY = config.get("anthropic_api_key", "")
    except Exception:
        pass

# Model — Haiku is fast, cheap, and follows instructions precisely
KONNI_MODEL = "claude-haiku-4-5-20251001"
MAX_TOKENS = 1024   # Concise responses; saves cost, matches Konni's direct style


def _build_client():
    """Lazy-build the Anthropic client so import never fails if key is absent."""
    if not ANTHROPIC_API_KEY:
        return None
    try:
        import anthropic
        return anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    except ImportError:
        return None


def call_konni(system: str, messages: list, db=None) -> str:
    """
    Call Claude Haiku for Konni chat.

    Args:
        system:   Full system prompt (Konni persona + user/admin context).
        messages: List of {"role": "user"|"assistant", "content": str}.
                  Must already include the current user message as the last item.
        db:       Optional SQLAlchemy session. When provided, Konni Admin tools
                  (listar_empleados, obtener_payroll_mes, etc.) are enabled.

    Returns:
        str — Konni's reply, or a friendly error message.
    """
    client = _build_client()

    if client is None:
        return (
            "Lo siento, Konni no está disponible en este momento. "
            "Escribe a contacto@conniku.com y te ayudamos. 🙏"
        )

    # Enforce alternating user/assistant — Claude requires this
    cleaned: list = []
    last_role = None
    for msg in messages:
        role = msg.get("role", "user")
        content = str(msg.get("content", "")).strip()
        if not content:
            continue
        # Map "assistant" → correct role; skip consecutive same-role
        if role not in ("user", "assistant"):
            role = "user"
        if role == last_role:
            # Merge with previous message instead of creating invalid sequence
            cleaned[-1]["content"] += f"\n{content}"
        else:
            cleaned.append({"role": role, "content": content})
            last_role = role

    # Must start with "user"
    if not cleaned or cleaned[0]["role"] != "user":
        cleaned.insert(0, {"role": "user", "content": "Hola"})

    # Must end with "user" (last message is always the current user prompt)
    if cleaned[-1]["role"] != "user":
        cleaned.append({"role": "user", "content": "Continúa"})

    try:
        import anthropic
        from konni_tools import KONNI_TOOLS, execute_tool

        # ── Tool-use path (admin only, when db session is provided) ──────────
        if db is not None:
            response = client.messages.create(
                model=KONNI_MODEL,
                max_tokens=MAX_TOKENS,
                system=system,
                messages=cleaned,
                tools=KONNI_TOOLS,
            )

            # Handle tool_use stop reason — run tool, send result, get final reply
            if response.stop_reason == "tool_use":
                tool_uses = [b for b in response.content if b.type == "tool_use"]
                tool_results = []
                for tu in tool_uses:
                    result_json = execute_tool(tu.name, tu.input, db)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": tu.id,
                        "content": result_json,
                    })

                # Append assistant turn (with tool_use blocks) + tool results
                cleaned.append({"role": "assistant", "content": response.content})
                cleaned.append({"role": "user", "content": tool_results})

                # Get final text response from Claude
                final = client.messages.create(
                    model=KONNI_MODEL,
                    max_tokens=MAX_TOKENS,
                    system=system,
                    messages=cleaned,
                    tools=KONNI_TOOLS,
                )
                return final.content[0].text

            # No tool call — return text directly
            return response.content[0].text

        # ── No-tool path (regular user chat) ─────────────────────────────────
        response = client.messages.create(
            model=KONNI_MODEL,
            max_tokens=MAX_TOKENS,
            system=system,
            messages=cleaned,
        )
        return response.content[0].text

    except anthropic.RateLimitError:
        return (
            "Estoy recibiendo muchas consultas ahora mismo. "
            "Intenta de nuevo en un minuto 🙏"
        )
    except anthropic.AuthenticationError:
        return (
            "Konni no puede responder en este momento. "
            "Escribe a contacto@conniku.com para soporte."
        )
    except Exception as e:
        # Log raw error server-side, show friendly message to user
        print(f"[Konni] Claude API error: {e}")
        return (
            "Lo siento, tuve un problema al responder. "
            "Puedes escribir a contacto@conniku.com. 🙏"
        )
