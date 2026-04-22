# Checkpoint de restauración — 2026-04-21 11:17

**Motivo:** Cristian pidió nuevo punto de restauración tras iterar sobre
landing-preview (wordmark nav +50%, H1 layout 5 líneas, icon size 1.0em
+ line-height 1.0, nowrap icon+niversidad, marker lime asimétrico con
clip-path y pseudo-elemento `::before`).

Checkpoint anterior (2026-04-21 sin hora): sigue disponible en
`docs/sessions/2026-04-21-checkpoint-restauracion.md` y en el backup
`CONNIKU-LANDING-MASTER-2026-checkpoint-2026-04-21/`.

---

## 1. Backup físico del sandbox Desktop

```
/Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-checkpoint-2026-04-21-1117/
```

Hash del archivo principal:
- `landing-preview.html` → `36e4351b1df502d0f8ed6741cef1f467ecb83e139fb751588127bcc844725277`
- `business.html` → `ab7d2d039d050ba121fe580debc13ad0da33079f66c8e4142e39d7799c8a0c97`

Restaurar sandbox:

```bash
rm -rf /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026
cp -R /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-checkpoint-2026-04-21-1117 /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026
```

---

## 2. Cambios respecto al checkpoint anterior (2026-04-21)

Solo se modificó `landing-preview.html`. Los otros 49 archivos HTML del
sandbox quedan idénticos al checkpoint anterior.

### landing-preview.html — diff acumulado

| Elemento | Antes | Ahora |
|---|---|---|
| `.wm` nav (desktop) | `font-size:26px` | `font-size:39px` (+50%) |
| `.wm` nav (mobile) | `font-size:22px` | `font-size:33px` (+50%) |
| `h1` | `line-height:.88` | `line-height:1.0` |
| `.h1-u-tile` desktop | `1.15em` | `1.0em` |
| `.h1-u-tile` mobile | `1.1em` | `1.0em` |
| `.h1-u-tile` `vertical-align` | `-0.28em` | `-0.29em` |
| Estructura H1 | `Tu <svg>...<mark>niversidad</mark> entera.<br>En una sola app.` | `Tu<br><span class="u-line"><svg>...<mark>niversidad</mark></span><br>entera.<br>En una sola<br>app.` |
| `.u-line` | no existía | `display:inline-block; white-space:nowrap` (nuevo) |
| `.mark` | gradient 55/92 simple, rotación -1deg | pseudo-elemento `::before` con gradient 6 stops + `clip-path` polígono irregular 10 puntos + rotación -1.2deg + padding asimétrico |

Reglas del logo respetadas (sigue LOGO-SPEC):
- Wordmark nav, footer, gate: sin rotación, sin filter, sin shadow.
- App icon en H1 hero: excepción EX-02 activa (rotación -4deg + drop-shadow 5px 5px 0 + z-index 5). Documentada en `docs/design-system/LOGO-SPEC.md`.
- SVG interno del app icon: geometría canónica LOGO.04 intacta (rect lime + u ink + dot naranja).

---

## 3. Estado del repo

**Rama:** `bloque-legal-consolidation-v2`
**Último commit:** `3ad731a` (sin cambios desde checkpoint anterior)

Cambios locales sin commitear (idénticos al checkpoint anterior, nada
del repo Conniku fue tocado en esta iteración — solo sandbox Desktop):

Ver `docs/sessions/2026-04-21-checkpoint-restauracion.md` sección 2
para lista completa.

---

## 4. Memorias

Sin cambios desde checkpoint anterior. Los ajustes visuales del landing
no requirieron actualización de memoria.

Spec del logo (`/docs/design-system/LOGO-SPEC.md`) sigue activo con
EX-01 y EX-02 como únicas excepciones autorizadas. Régimen de
excepciones puntual (no permanente) reforzado en
`reference_logo_spec_canonical.md`.

---

## 5. Pendientes (sin cambio respecto al checkpoint anterior)

- Legal v3.2 Pieza 2a backend y Pieza 3 paquete abogado.
- Auth CEO-only (plan acordado, no ejecutado).
- Business submódulos reales (actualmente "en construcción").
- Migración landing-preview → React del proyecto.

---

Fin del checkpoint.
