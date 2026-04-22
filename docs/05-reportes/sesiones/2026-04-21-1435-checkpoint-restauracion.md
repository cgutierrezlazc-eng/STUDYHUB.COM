# Checkpoint de restauración — 2026-04-21 14:35

**Motivo:** Cristian aprueba el estado con CTAs modernos editorial + dot
verde en hover + gate restaurado. Pide checkpoint antes de seguir.

---

## Backup físico

```
/Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-checkpoint-2026-04-21-1435/
```

Hash `landing-preview.html`: `e1e2b5f28981f51103b7aea4290c238275ffa05093cc0ceaef57c8a632c1d3a8`

Restaurar:

```bash
mv /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026 /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-trash-$(date +%H%M)
cp -R /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-checkpoint-2026-04-21-1435 /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026
```

---

## Estado consolidado

### Nav superior (49 archivos)
- Wordmark `.wm` 39px desktop / 33px mobile, intacto.
- Separador vertical entre wordmark y nav-links.
- Nav-links modernos editoriales:
  - Producto, Cómo funciona, Planes: **Funnel Display 500 uppercase** 13px, letter-spacing .06em, dividers entre cada uno.
  - Business: **Funnel Display 700 uppercase** pill navy outline con fondo `rgba(15,30,58,.04)`.
- CTAs pill moderno:
  - **Entrar** (`.nav-links .nav-cta-link`): outline pill 2px ink, Funnel Display 700, rotate `-0.5deg`. Hover: invierte colores + box-shadow.
  - **Crear cuenta** (`.nav-links .nav-cta`): solid ink pill, texto paper, Funnel Display 700, rotate `0.5deg`. Hover: box-shadow lime.
- **Dot verde** lime 7×7px con borde ink en `::after` de nav-links y btn-plataforma. Animación `scale(0)→scale(1)` en hover/focus/active.
- Óvalo móvil **eliminado** completo (CSS + SVG + JS + clases oval-target/oval-active).
- Gate de password **restaurado** con `conniku-preview-2026` y sessionStorage.

### Hero (solo landing-preview.html)
- H1 5 líneas forzadas: "Tu / [icon]niversidad / entera / En una sola / app.". Sin punto después de "entera", punto naranja en "app."
- App icon en H1: rotate `-6deg`, drop-shadow flat, `width:1.3em`, `vertical-align:-0.38em`, z-index 20. `.u-line` con z-index 5 para ganar stacking sobre stamp-violet.
- Stamp-violet "entera": `background:var(--violet)`, `transform:rotate(1.5deg) translateX(-60px)`.
- Lead con destacadores: `.lh-violet` (azul `#1A4DB3`), `.lh-lime`, `.lh-pink`.
- CTA row: "Entrar gratis" + botón **Plataforma** (pill lime, box-shadow 4px 4px 0 ink, rotate `-0.8deg`).
- Columna derecha `.hero-right` con `align-items:flex-end` + `overflow:visible`.
- Preview-card mini-grid 4×3 con `translateX(3cm)` + `padding:calc(22px + 3cm) 22px 22px`.
- Flecha grafito 400px trazo humano irregular, apunta del card hacia el botón Plataforma.
- Hero con `flex:1 min-height:0 overflow:visible`.

### Layout global (49 archivos)
- `body` como flex column, `height:100vh`, `overflow:hidden`. Nav + contenido + footer visibles en 1 pantalla desktop.
- `.shell` pegado a la izquierda con `margin:0 auto 0 40px`.
- En mobile (`@media max-width:640px`): `body{height:auto;overflow-y:auto;display:block}` + nav flex-column + preview-card visible apilado.

### Footer compacto (49 archivos)
- Padding `6px 32px 6px 40px`.
- Alineado a la izquierda (sin centrar).
- Sin app icon.
- 4 botones con popovers JS (Plataforma, Legal, Empresa, Soporte).
- 2 links directos (Contacto, Trabaja con nosotros).
- Dividers verticales finos entre cada item.
- Copy "© 2026 Conniku SpA · Antofagasta, Chile" con `margin-right:0` pegado al borde derecho.
- Fuente `var(--fm)` (Geist Mono) uppercase 9-9.5px.

### Páginas
- `landing.html` (CONGELADO), `devices-preview.html` (intacto).
- `landing-preview.html` (sandbox principal).
- `plataforma.html` (hub con 12 cards editoriales).
- `producto.html`, `como-funciona.html`, `planes.html`.
- `business.html` (hub 5 categorías) + 5 hubs + 38 submódulos.

---

## Logo spec (inviolable salvo excepciones)

En `/Users/cristiang./CONNIKU/docs/design-system/LOGO-SPEC.md`.

Excepciones activas:
- EX-01: app icon como letra en H1 hero.
- EX-02: rotación asimétrica `-6deg` + drop-shadow flat en H1 hero.

---

## Pendientes acumulados (fuera del sandbox visual)

1. Legal v3.2 Pieza 2a backend + Pieza 3 paquete abogado.
2. Auth CEO-only (seed Supabase + flag registro + pre-fill email).
3. Migración landing-preview → React del proyecto.
4. Conectar 38 páginas submódulo Business con `src/admin/` real.

---

Fin del checkpoint.
