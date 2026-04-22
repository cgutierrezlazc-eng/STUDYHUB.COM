# Checkpoint de restauración — 2026-04-21 11:29

**Motivo:** Cristian pide checkpoint tras aplicar 2 cambios consolidados
al sandbox:

1. Fix mobile global aplicado a los 47 archivos restantes del sandbox
   (nav en 2 líneas con flex-column + hero align-items:start en los
   que aplique).
2. Landing-preview: hero redimensionado para caber en 1 pantalla
   desktop + destacador violet sobre "entera" del H1.

---

## 1. Backup físico del sandbox Desktop

```
/Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-checkpoint-2026-04-21-1129/
```

Hashes clave:
- `landing-preview.html` → `6d61d2b8f3cf55034dfcbe3979b84076fa91a3aad0cc48b307e7cd2e0e60b71b`
- `business.html` → `0a8d869b7a422733d9fdf22448f6ee747eda937850271b06ca8eb7dbe8175434`
- `producto.html` → `b70dc7e1df4dc4a1063f0d50819798de5951fee0ca952a0d796aa00fa49ec87c`

Restaurar:

```bash
rm -rf /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026
cp -R /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-checkpoint-2026-04-21-1129 /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026
```

---

## 2. Cambios respecto al checkpoint anterior (11:17)

### 2.1 Aplicación global del fix mobile (47 archivos tocados)

Se replicaron a los 47 archivos restantes las reglas mobile que ya
tenía `landing-preview.html`:

```css
@media (max-width:640px){
  nav{flex-direction:column;align-items:flex-start;padding:14px 16px;gap:14px}
  .wm{font-size:33px;flex-shrink:0}
  .nav-links{width:100%;display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:flex-start;overflow-x:unset;scrollbar-width:unset}
  .nav-cta-group{gap:10px;flex-shrink:0}
}
```

Archivos modificados: todos los `business-*.html`, `business.html`,
`como-funciona.html`, `planes.html`, `producto.html` (47 en total).

### 2.2 `landing-preview.html` — hero compacto + destacador violet

- `h1{font-size: clamp(60px,9vw,140px) → clamp(60px,7vw,110px)}`
- `h1{line-height: 1.0 → 0.95}`
- `h1{margin-bottom: 32px → 20px}`
- `.hero{padding: 80px 40px 60px → 48px 40px 40px}`
- `.hero{min-height:calc(100vh - 66px) → height:calc(100vh - 66px)}`
- Nueva regla `h1 .stamp-violet{background:var(--violet);color:#fff;padding:0 16px;border-radius:20px;display:inline-block;transform:rotate(-1.5deg)}`
- HTML H1: `entera.` → `<span class="stamp-violet">entera</span>.`

El destacador violet sigue el estilo del `UnderConstruction.tsx` sobre
la palabra "subiendo" (mismo color `#6B4EFF`, mismo rotation -1.5deg,
mismo radius ~20px, mismo padding 0 16px).

---

## 3. Reglas del logo (sin cambios desde checkpoint anterior)

Spec vigente en `/Users/cristiang./CONNIKU/docs/design-system/LOGO-SPEC.md`.

Excepciones puntuales activas:
- **EX-01** — app icon como letra en H1 hero del landing.
- **EX-02** — app icon del H1 hero con rotación `-4deg` + drop-shadow flat.

Resto de superficies mantienen las reglas inviolables sin excepción.

---

## 4. Estado del repo (sin cambios desde checkpoint anterior)

Rama `bloque-legal-consolidation-v2`, último commit `3ad731a`, mismos
cambios locales staged que en el checkpoint anterior. El repo no fue
tocado en esta iteración; solo sandbox Desktop.

---

## 5. Pendientes (sin cambios)

- Legal v3.2 Pieza 2a backend + Pieza 3 paquete abogado.
- Auth CEO-only.
- Business submódulos reales (actualmente "en construcción").
- Migración landing-preview → React del proyecto.

---

Fin del checkpoint.
