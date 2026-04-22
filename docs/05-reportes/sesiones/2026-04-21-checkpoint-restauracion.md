# Checkpoint de restauración — 2026-04-21

**Motivo:** Cristian solicitó guardar el estado actual como punto de
restauración antes de seguir iterando sobre el landing sandbox. Este
documento captura el estado EXACTO del proyecto y del sandbox en el
momento del checkpoint, de modo que se pueda volver a este punto si una
iteración futura rompe algo.

---

## 1. Backup físico del sandbox Desktop

Se copió la carpeta completa a un checkpoint paralelo:

```
/Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-checkpoint-2026-04-21/
```

Contenido idéntico a `/Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026/`
en el momento del checkpoint. Para restaurar:

```bash
rm -rf /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026
cp -R /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-checkpoint-2026-04-21 /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026
```

### Inventario sandbox (50 archivos HTML)

- 1 master congelado: `landing.html` (SHA-256 `445d3e08b5f637189ed6f3c3df0b50890b246edb72b9f28785fe57c3a6569b74`)
- 1 preview sandbox: `landing-preview.html` (SHA-256 `ece5f1e2ac4c4d5608e93515e9347b9ccc3ffe1339f8648033f462717561b0c2`)
- 1 devices preview: `devices-preview.html`
- 3 páginas nav (producto, como-funciona, planes)
- 1 hub Business: `business.html` (SHA-256 `ab7d2d039d050ba121fe580debc13ad0da33079f66c8e4142e39d7799c8a0c97`)
- 5 hubs categorías: `business-hr.html`, `business-payroll.html`, `business-finance.html`, `business-legal.html`, `business-tools.html`
- 38 páginas submódulo: `business-<id>.html` (lista en snapshot previo)

Estado del H1 del landing en el checkpoint:
- 5 líneas forzadas con `<br>`: `Tu` / `[icon]niversidad` / `entera.` / `En una sola` / `app.`
- App icon con EX-02 aplicada: `rotate(-4deg)`, `drop-shadow(5px 5px 0 rgba(13,15,16,0.22))`, `z-index:5`, `width/height: 1.15em` desktop / `1.1em` mobile, `vertical-align:-0.28em`
- Wordmark del nav con clase oficial `.wm`, sin rotación, sin sombra (cumple LOGO-SPEC general)
- SVG app icon interno canónico LOGO.04 (rect lime + u ink + dot naranja)

Password del gate (sin cambio): `conniku-preview-2026`

---

## 2. Estado del repo git

**Rama:** `bloque-legal-consolidation-v2`

**Último commit en esta rama:** `3ad731a docs(session): snapshot de cierre bloque-legal-consolidation-v2 2026-04-20`

**Cambios locales no commiteados al momento del checkpoint:**

Modificados:
- `docs/legal/LEGAL_VERSIONS.md` (entrada v3.2 agregada)
- `shared/legal_constants.ts` (hashes v3.2)
- `src/components/TermsOfService.tsx` (H-01/H-02/H-08/H-09/H-10/H-11/H-12/H-16/H-17)
- `src/pages/DeleteAccount.tsx` (H-01)
- `src/pages/PrivacyPolicy.tsx` (H-01, H-12)
- `src/pages/TermsOfService.tsx` (H-01, H-08)

Eliminados (archivados a `docs/legal/archive/2026-04-20-v3.1-superseded/`):
- `docs/legal/v3.1/METADATA.yaml`
- `docs/legal/v3.1/age-declaration.md`
- `docs/legal/v3.1/cookies.md`
- `docs/legal/v3.1/privacy.md`
- `docs/legal/v3.1/terms.md`

Nuevos (sin trackear):
- `backend/tests/test_legal_versions_v3_2_invariants.py`
- `docs/design-system/LOGO-SPEC.md`
- `docs/legal/archive/2026-04-20-v3.1-superseded/` (5 archivos + README)
- `docs/legal/v3.2/` (4 canónicos + METADATA.yaml)
- `docs/plans/bloque-legal-v3.2-post-audit/plan.md`
- `docs/sessions/2026-04-20-snapshot-landing-v2-legal-pausa.md`
- `docs/sessions/2026-04-21-checkpoint-restauracion.md` (este archivo)
- `public/design-previews/classroom.html`

**Stash guardada (no tocar):**
- `stash@{0}: WIP on main: a07f3f0 feat(jobs+konni): broadcast de ofertas laborales vía Konni + mejoras SupportChat`

**Para restaurar el repo a este checkpoint (opción conservadora):**
Volver a `3ad731a` y re-aplicar los cambios pendientes manualmente.

```bash
# Solo si Cristian autoriza destruir trabajo actual
cd /Users/cristiang./CONNIKU
git reset --hard 3ad731a          # atención: destruye cambios locales
git clean -fd                      # atención: elimina archivos no trackeados
```

**Para restaurar a este checkpoint conservando el trabajo (recomendado):**

```bash
cd /Users/cristiang./CONNIKU
# Crear una rama de respaldo en el punto actual
git checkout -b checkpoint-2026-04-21-backup
git add -A
git commit -m "checkpoint: estado proyecto 2026-04-21 antes de iteraciones siguientes"
git checkout bloque-legal-consolidation-v2
```

Esto deja una rama `checkpoint-2026-04-21-backup` con todo el estado
actual, sin perder el trabajo en curso.

---

## 3. Estado de las memorias

Memorias tocadas hoy:
- `reference_app_icon_design.md` (regla uso tipográfico)
- `reference_logo_spec_canonical.md` (régimen de excepciones puntual, EX-01, EX-02)
- `MEMORY.md` (pointers nuevos)

Memoria nueva: `session_2026-04-20_landing_legal_pausa.md` (snapshot previo)

---

## 4. Próximas iteraciones pendientes (al momento del checkpoint)

Según snapshot del 2026-04-20 + estado actual:

### Landing sandbox (en progreso)
- Ajustes visuales del landing-preview (tamaño wordmark, feedback de Cristian en curso)
- Migración eventual a React en `src/pages/Landing/` cuando el HTML esté aprobado
- Las 38 páginas "en construcción" de Business quedan como placeholder hasta conectar con módulos reales del admin panel

### Legal v3.2
- **Pieza 2a backend-builder:** todavía pendiente cerrar. Cortado ayer, requiere agente nuevo para propagar hashes a `backend/constants/legal_versions.py` y escribir test de invariante.
- **Pieza 3 paquete abogado:** generar `/Users/cristiang./Desktop/CONIKU LEGAL v3.2/` con PDFs regenerados + `_CAMBIOS_v3.1_A_v3.2.md`.
- **Capa auditoría:** auditor-triple pendiente.
- **Pre-flight CI local:** pendiente.

### Auth CEO-only
- Plan opción C acordado, no ejecutado. Pendiente: seed Supabase (bcrypt hash inline) + flag `PUBLIC_REGISTRATION_ENABLED=false` + pre-fill email en Login.

### Otros
- Bloque `bloque-legal-consolidation-v2` (PR #21) sigue abierto, bloqueado hasta OK del abogado.
- Stash en main (jobs+konni broadcast) pendiente de revisión.

---

## 5. Reglas activas al momento del checkpoint

- Registro chileno (tuteo, no voseo) — reforzado ayer.
- Logo spec canónico `/docs/design-system/LOGO-SPEC.md` — vinculante.
- Régimen de excepciones puntual (no permanente): confirmado hoy.
- Auto Mode OFF — política firme.
- Objetivo único por sesión + decisiones batch: §20, §21.

---

Fin del checkpoint.
