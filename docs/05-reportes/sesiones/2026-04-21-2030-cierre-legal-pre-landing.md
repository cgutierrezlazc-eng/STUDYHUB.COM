# Cierre sesión 2026-04-21 20:30 · Pre-Landing React

## Motivo del snapshot

Cristian cerró el ciclo de 4 bloques legales/nómina secuenciales y pidió
dedicar toda la atención al Bloque 3 Landing sandbox → React en la
próxima sesión. Este documento es el punto de continuación.

## Bloques cerrados hoy 2026-04-21 (4 PRs mergeados a main)

| PR | Bloque | Merge commit | Qué cierra |
|----|--------|--------------|------------|
| #21 | `bloque-legal-consolidation-v2` | `e110cda` | Legal v3.2 + Cookie consent banner + re-aceptación gate |
| #22 | `bloque-nomina-chile-v1` | `5434cd8c` | Constantes labor/tax 2026 + motor payroll unificado |
| #23 | `bloque-legal-viewer-v1` | `25adb816` | Modal + /legal/:doc + age-declaration pública + fix BUG GDPR Art. 7(1) |
| #24 | `bloque-multi-document-consent-v1` | `9f2a286b` | Checkbox unificado + evidencia de lectura + registro atómico |

Main está en commit `9f2a286b`. Branch protection activa con Verify
Full Stack obligatorio.

## Estado actual del producto en producción

- Banner de cookies con 4 categorías operativo en el producto React
  (hash canónico `bba33024...`, vigencia Ley 21.719 2026-12-01).
- Política de Cookies canónica v1.0.0 publicada en `/legal/cookies` con
  inventario real de localStorage + declaración explícita de
  `cc_visitor_uuid` esencial con 4 condiciones.
- Sidebar /legal con 4 documentos navegables (terms, privacy, cookies,
  age-declaration) + modal flotante desde footer.
- Registro con evidencia de lectura: usuario debe abrir los 4 docs +
  scroll 90% antes de habilitar checkbox. Submit crea user +
  4 user_agreements + 1 cookie_consent atómicamente.
- Constantes laborales/tributarias Chile 2026 verificadas contra
  fuentes oficiales (UF $39.842, UTM $69.889, SMI $539.000,
  retención honorarios 15.25%, SIS 1.54%, Tope AFC 135.2 UF,
  jornada 42h desde 2026-04-26).

## Pendientes humanos post-sesión (acciones en paneles externos)

1. **Flip `LEGAL_GATE_ENFORCE=true` en Render** tras 24h de monitoreo
   del preview post-PR #21. Activa el modal de re-aceptación para
   usuarios legacy.
2. **Verificar backup Supabase apunta a instancia de producción**
   (GAP-A1 del gap-finder 2026-04-21).
3. **Entregar comprobante INAPI al abogado** (H-18 del audit legal).

## Landing — punto de partida para próxima sesión

### Contexto acumulado

El landing tiene 3 capas:

1. **Sandbox Desktop** (`/Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026/`):
   - 52 archivos HTML editorial-halftone con Funnel Display.
   - Hoy se agregó banner de cookies vanilla en los 52 archivos (commit local,
     no commiteado al repo porque vive fuera del repo).
   - Archivo principal: `landing-preview.html`.
   - CONTEXT.md y landing.md tienen historial de decisiones de diseño.
   - 11 checkpoints de restauración en `docs/sessions/2026-04-21-*.md`.

2. **React repo actual** (`src/pages/`):
   - `UnderConstruction.tsx` es la landing pública actual en
     `conniku.com/` (editorial compacto, 1 página).
   - `Landing.tsx` existe pero NO está ruteada a `/` (decisión
     explícita: solo renderiza UnderConstruction).
   - `Landing/sections/` tiene 7 secciones modulares (Hero, Product,
     How, Pricing, App, BusinessPanel) del bloque-rollout-v3-ola-1.
   - `FROZEN.md` protege todos los archivos de Landing/ y
     UnderConstruction.

3. **Bloque 3 Landing sandbox → React (siguiente bloque)**:
   - Objetivo: migrar el sandbox Desktop al `src/pages/Landing/` del
     repo con Funnel Display self-hosted (no Google Fonts 800 limit).
   - 58 archivos HTML del sandbox (6 páginas principales + 38 business +
     5 hubs + 9 auxiliares) → componentes React equivalentes.
   - Mantener estética editorial-halftone con los tokens CSS actuales.
   - Preservar tipografía Funnel Display, Geist Mono, paleta ink/paper/
     lime/orange/violet.
   - Decidir ruteo: `/` sigue siendo UnderConstruction hasta launch
     formal; las páginas landing viven en `/producto`, `/planes`,
     `/business`, etc., accesibles vía nav interna sin indexar aún.
   - Business REHACER: 38 submódulos business-* son provisional,
     necesitan diseño definitivo antes de migrar.

### Pendientes específicos del landing (de memorias)

- **Kiosko contenido real** — Cristian aún no definió qué apps mostrar.
- **38 submódulos Business conectar con src/admin/ real** tras
  migración.
- **Foto founder pendiente** — Cristian dijo "la entregaré después"
  cuando aprobó opción 4.1=A.

### Reglas inviolables para el landing

Desde memorias del proyecto:

1. **LOGO SPEC canónico** (`docs/design-system/LOGO-SPEC.md`):
   u=#0D0F10, dot=#FF4A1C, tile=#D9FF3A. Sin rotación, sin filtros,
   sin variantes sin aprobación.
2. **App icon oficial**: SIEMPRE rect lime + u + dot naranja juntos.
   NO existe variante sin dot.
3. **Funnel Display**: Google Fonts solo sirve 400-800. Self-host si se
   requiere 900 literal del spec.
4. **No alterar sin pedido**: si Cristian pide un cambio, ejecutar SOLO
   eso. No tocar z-index/layout/posicionamiento de elementos no
   mencionados.
5. **Verificar causa antes fix visual**: bug visual → primero
   curl/DevTools los recursos del `<head>`, después código.

## Planes en cola sin ejecutar

- `docs/plans/bloque-auth-ceo-only-v1/plan.md` — cerrar registro
  público hasta launch formal (diferido, activar solo si Cristian
  decide).

## Siguiente sesión

Cuando Cristian vuelva a trabajar el landing, la acción es:

1. Leer este snapshot + memoria `project_orden_bloques_post_20260421.md`.
2. Lanzar web-architect para plan detallado del Bloque 3 Landing
   sandbox → React.
3. Cristian responde decisiones batch del plan.
4. Ejecutar builders con toda la atención (no paralelo con otros
   bloques legales).

Fin.
