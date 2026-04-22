"""Routing de tickets de contacto por motivo.

Tabla canónica que mapea cada motivo de contacto a:
- email: buzón interno de destino (hoy todos a contacto@conniku.com;
  prensa@, legal@ y seguridad@ se provisionen en Zoho antes de cambiar).
- label: etiqueta legible para asunto del email y registro del ticket.
- sla_hours: SLA declarado en landing (snapshot por ticket en BD).

Referencia legal: los SLA declarados aparecen en contacto.html líneas 288-294.
El snapshot se guarda en contact_tickets.sla_hours para que futuros cambios
no alteren la promesa hecha al usuario en el momento de crear el ticket.

Cambios a este archivo requieren commit con tipo chore(backend) si solo
cambia routing, o legal: si cambia sla_hours declarados al usuario.

Verificador: web-architect (Tori), 2026-04-22.

TODO (post-provisión Zoho): cuando existan prensa@conniku.com,
legal@conniku.com y seguridad@conniku.com, actualizar los campos 'email'
de los motivos correspondientes con commit chore(backend) y entrada en
docs/legal/alerts.md.
"""

from __future__ import annotations

# Dict canónico: motivo → configuración de routing.
# Fuente de verdad para backend; espejado en shared/contact_ticket_types.ts.
CONTACT_ROUTES: dict[str, dict[str, str | int]] = {
    "comercial": {
        "email": "contacto@conniku.com",
        "label": "consulta comercial",
        "sla_hours": 48,
    },
    "universidad": {
        "email": "contacto@conniku.com",
        "label": "alianza con universidad",
        "sla_hours": 72,
    },
    "prensa": {
        # PENDIENTE: provisionar prensa@conniku.com en Zoho antes de cambiar.
        # Ver docs/legal/alerts.md — alerta de buzones no provisionados.
        "email": "contacto@conniku.com",
        "label": "prensa y medios",
        "sla_hours": 120,
    },
    "legal": {
        # PENDIENTE: provisionar legal@conniku.com en Zoho antes de cambiar.
        # SLA de 720 h (30 días calendario) es coherente con el plazo de
        # respuesta administrativa razonable frente a reclamos Ley 19.496.
        "email": "contacto@conniku.com",
        "label": "asuntos legales o privacidad",
        "sla_hours": 720,
    },
    "seguridad": {
        # PENDIENTE: provisionar seguridad@conniku.com en Zoho antes de cambiar.
        # SLA reducido 48 h por criticidad de reportes de vulnerabilidades.
        "email": "contacto@conniku.com",
        "label": "reporte de seguridad",
        "sla_hours": 48,
    },
    "otro": {
        "email": "contacto@conniku.com",
        "label": "consulta general",
        "sla_hours": 72,
    },
}

# Set de motivos válidos (derivado de CONTACT_ROUTES para única fuente de verdad).
CONTACT_REASONS: frozenset[str] = frozenset(CONTACT_ROUTES.keys())
