# docs/legal/

Documentos legales del producto Conniku bajo mantenimiento del agente
**legal-docs-keeper** (CLAUDE.md §Operación del legal-docs-keeper).

## Estructura (pendiente de llenar)

```
docs/legal/
├── drafts/                  # Borradores en revisión (pre-aprobación Cristian)
├── archive/                 # Versiones anteriores publicadas con fecha de vigencia
├── alerts.md                # Lista de alertas activas con severidad
├── weekly-audit-*.md        # Auditorías semanales del legal-docs-keeper
├── terminos-servicio/       # T&C (requiere desde bloque futuro)
├── politica-privacidad/     # Privacidad (requiere desde bloque futuro)
├── politica-cookies/        # Cookies (requiere)
├── politica-reembolso/      # Reembolso y retracto (requiere)
├── politica-uso-aceptable/
├── aviso-legal/             # LOPD / LSSICE (expansión UE)
├── dpa-gdpr/                # Data Processing Agreement (B2B + UE)
└── politica-seguridad/      # Documento interno
```

## Convención de versionado

Versionado semántico `v{major}.{minor}.{patch}` por documento.

- `major` → cambio que requiere re-aceptación forzada del usuario
- `minor` → cambio que afecta interpretación pero mantiene aceptación anterior
- `patch` → corrección de typos, referencias legales actualizadas

Cada archivo incluye encabezado con:

```
---
version: 1.0.0
effective_from: YYYY-MM-DD
supersedes: v0.0.0 (o none)
reviewed_by: [nombre del abogado o "pendiente"]
---
```

## Relación con shared/legal_texts

El texto del checkbox declarativo de edad vive en `shared/legal_texts.py` (fuente
de verdad del backend) y `shared/legal_texts.ts` (espejo frontend) porque se
necesita calcular su hash SHA-256 para la tabla `user_agreements`. Los demás
documentos legales viven aquí como markdown.

## Estado al 2026-04-18

Estructura vacía (solo scaffolding). Los documentos específicos se crean a
medida que el legal-docs-keeper + Cristian aprueban cada uno en bloque propio
del protocolo de 7 capas.

La legal-docs-keeper agent detectó en auditoría 2026-04-17 múltiples gaps
críticos (ver `docs/reports/2026-04-17-2245-legal-docs-keeper-estado-legal-inicial.md`).

## Declaración importante

Los documentos de esta carpeta son borradores preparados por el agente
`legal-docs-keeper` y requieren **revisión de abogado profesional** antes
de publicarse al usuario final. Ningún agente puede afirmar cumplimiento
legal sin esa revisión.
