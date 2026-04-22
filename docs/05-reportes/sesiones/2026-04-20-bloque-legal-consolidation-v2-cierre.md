# Snapshot de sesión — 2026-04-20 — Bloque `bloque-legal-consolidation-v2`

## Estado al cierre

- Rama activa: `bloque-legal-consolidation-v2`
- Último commit: `74961e9 fix(legal): envolver páginas legales públicas en scroll wrapper`
- Remoto sincronizado: sí (`git push` ejecutado).
- PR abierto: **#21** → https://github.com/cgutierrezlazc-eng/STUDYHUB.COM/pull/21
- Gate §18.7 pendiente: revisión del abogado humano designado por Cristian.

## Commits del bloque (en orden cronológico)

| Commit | Pieza | Resumen |
|---|---|---|
| `7c89c86` | 7 | Versionado formal v3.1 + `LEGAL_VERSIONS.md` |
| `ececc21` | 3 | Consolidación 18+ en T&C, Privacy, DeleteAccount |
| `8332247` | 4 | Retracto 10 días corridos canónico + mirror ts↔py |
| `587828c` | 2 | Privacy v2.3 declara Supabase, FCM, Capacitor, Google OAuth |
| `b527027` | 1 | T&C página ↔ modal sincronizadas en invariantes legales |
| `e972e4d` | 5 | Política de Cookies separada en `/cookies` + inventario real |
| `2d85c0f` | 6 | Mecanismo de re-aceptación (backend + modal + feature flag) |
| `74961e9` | — | Fix scroll en páginas legales públicas (detectado en revisión) |

## Verificaciones pasadas al cierre

- `npx tsc --noEmit` → EXIT 0
- `npx eslint src/` → 0 errors (445 warnings pre-existentes)
- `npx vitest run` → 339 tests passed
- `npx vite build` → OK
- `python3.11 -m pytest backend/ --tb=no -q` → 254 passed, 2 skipped (deps CI-only)
- `python3.11 -m ruff check backend/` → all checks passed
- `python3.11 -m mypy backend/notifications.py backend/auth_routes.py` → clean

## Artefactos entregados al abogado

Carpeta `~/Desktop/CONIKU LEGAL/` con:

- `_LEER_PRIMERO.pdf` — hoja de ruta y checklist.
- 5 PDFs renderizados (lo que el usuario ve en la plataforma).
- 4 PDFs canónicos desde `docs/legal/v3.1/*.md` (fuente de verdad).
- Carpeta `referencia_abogado/`: checklist + citas L1–L14 + plan maestro.
- Carpeta `fuentes_markdown_raw/`: los `.md` originales + `METADATA.yaml`.

Hashes SHA-256 oficiales canónicos (coinciden con
`backend/constants/legal_versions.py` y `shared/legal_constants.ts`):

- terms v3.1.0 → `e3780c975df95ef48b07147940b406e6b3fa8d374aa466d2dd86a3dd8a85a98f`
- privacy v2.3.0 → `0f7e0a3dc287da20bbbeede903622e005782cb4d927c4d01ebe35d22c3fd591f`
- cookies v1.0.0 → `a00150297efa288b53bbd9a0c655e046a292d3cdefb04254b0b33c079022efd9`
- age-declaration v1.0.0 → `90a0fc5887dab32463dcbdefda5ad501626b67e7a7525ffdae95c06ac57e1815`

## Lo que queda pendiente para la próxima sesión

### Bloqueante (gate §18.7)

1. **Revisión del abogado.** Cristian está en proceso con su abogado.
   Hasta recibir el correo formal con visto bueno (o la lista de
   cambios requeridos), el PR #21 NO se mergea a `main`.

### Dependiente del OK del abogado

2. **Flip de feature flag** `LEGAL_GATE_ENFORCE=true` en Render,
   después del merge y tras 24h de monitoreo sin incidentes. Mitiga
   riesgo R6.1 ALTO (lockout masivo).
3. **Recalcular hash `cookies.md`** si el abogado pide que el
   markdown canónico se alinee byte a byte con el contenido actual de
   `src/pages/CookiesPolicy.tsx`. Hoy el md es un STUB previo y el
   texto real vive en el TSX. Al actualizar, bumpear a v1.1.0 y
   actualizar METADATA.yaml + `backend/constants/legal_versions.py` +
   `shared/legal_constants.ts`.
4. **Capa 3.5 legal-docs-keeper.** Ejecutar el agente
   `legal-docs-keeper` para sellar el bloque con reporte en
   `docs/legal/weekly-audit-2026-04-20.md`.

### Decisiones pendientes acumuladas (batch)

5. **Tier "Max" legacy** en `src/pages/TermsOfService.tsx:154`
   menciona un plan que ya no existe. Decisión pendiente: limpiar
   aquí o en bloque separado de "tier cleanup". Ver memoria
   `project_tier_max_cleanup.md`.
6. **§8 del modal de registro** sobre edad menciona "dieciocho (18)
   años" — coherente con la regla operacional, pero el texto del
   checkbox de declaración jurada menciona "legislación vigente" de
   forma genérica. El abogado puede pedir cita específica
   (presumiblemente Art. 210 Código Penal chileno — ver nota en
   CLAUDE.md §Cumplimiento Legal).

### No-bloqueantes

7. Archivo huérfano `public/design-previews/classroom.html` — no
   pertenece a este bloque. Decidir si se suma a otro bloque o se
   descarta.
8. 445 warnings de ESLint pre-existentes — deuda técnica, no crítica
   para el merge de este bloque.

## Cómo retomar en la próxima sesión

1. Abrir el PR #21 en GitHub y revisar:
   - CI actions: que quedaron verdes en el último push.
   - Comentarios nuevos: especialmente de Cristian sobre la respuesta
     del abogado.
2. Si el abogado aprobó sin cambios:
   - Merge del PR a `main` (via GitHub UI con squash-merge).
   - Activar `LEGAL_GATE_ENFORCE=true` en Render (variable de
     entorno del backend).
   - Correr `/cerrar-bloque bloque-legal-consolidation-v2` para
     sellar el bloque en BLOCKS.md y pasar los archivos a FROZEN.
3. Si el abogado pidió cambios:
   - Leer el detalle y crear una pieza 8/9/etc. en el plan maestro.
   - Trabajar en la misma rama hasta nueva iteración en Capa 6.
   - Re-commit y re-push al PR #21.

## Entorno al cierre

- Servidor Vite local: **detenido**.
- Carpeta `~/Desktop/CONIKU LEGAL/`: **entregada al abogado** y
  persistente entre sesiones.
- Working tree: limpio salvo el archivo huérfano
  `public/design-previews/classroom.html` (no del bloque).
