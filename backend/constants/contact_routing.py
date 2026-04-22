"""Routing de tickets de contacto por motivo.

Tabla canónica que mapea cada motivo de contacto a:
- email: buzón interno de destino. Los alias (prensa@, legal@, seguridad@,
  etc.) están provisionados en Zoho como alias del buzón operativo
  contacto@conniku.com (administrado por Jennifer Ruiz, asistente del
  CEO). Ver memoria reference_email_accounts.md.
- label: etiqueta legible para asunto del email y registro del ticket.
- sla_hours: SLA declarado en landing (snapshot por ticket en BD).

Referencia legal: los SLA declarados aparecen en contacto.html líneas 288-294.
El snapshot se guarda en contact_tickets.sla_hours para que futuros cambios
no alteren la promesa hecha al usuario en el momento de crear el ticket.

El SLA de seguridad (48h) está respaldado operativamente por
docs/legal/security-response-protocol.md v1.0.0 (2026-04-22) con
escalamiento a Cristian y métricas de cumplimiento mensuales.

Cambios a este archivo requieren commit con tipo chore(backend) si solo
cambia routing, o legal: si cambia sla_hours declarados al usuario.

Verificador: Cristian (Capa 0 batch §21 D-T2=A), 2026-04-22.
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
        "email": "prensa@conniku.com",
        "label": "prensa y medios",
        "sla_hours": 120,
    },
    "legal": {
        # SLA 720 h (30 días calendario) coherente con plazos administrativos
        # frente a reclamos Ley 19.496 + derechos ARCO GDPR Art. 12.
        "email": "legal@conniku.com",
        "label": "asuntos legales o privacidad",
        "sla_hours": 720,
    },
    "seguridad": {
        # SLA reducido 48h por criticidad reportes de vulnerabilidades.
        # Protocolo operativo: docs/legal/security-response-protocol.md
        "email": "seguridad@conniku.com",
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
