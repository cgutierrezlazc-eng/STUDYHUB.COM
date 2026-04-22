# Checkpoint de restauración — 2026-04-21 13:39

**Motivo:** Cristian pide nuevo punto de retorno antes de seguir iterando,
por si los siguientes cambios rompen algo.

---

## Backup físico

```
/Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-checkpoint-2026-04-21-1339/
```

Hash `landing-preview.html`: `6a98c28831778b6eb467473fc24497d7149819aaf335ed5930211416988e600f`

Restaurar:

```bash
rm -rf /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026
cp -R /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-checkpoint-2026-04-21-1339 /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026
```

---

## Estado consolidado del sandbox

**Layout revertido a versión estable:**
- `body` como bloque normal (sin flex-column), `min-height:100vh`, `overflow-x:hidden`.
- `.shell` con `margin:0 auto 0 40px` (alineado a la izquierda con 40px padding).
- `.hero` con `height:calc(100vh - 116px)` (deja espacio al footer delgado).
- `.hero-right` sin `align-self:stretch`.
- `.preview-card` con `margin-top:0` y `translateX(3cm)` (sin márgenes extremos).

**Nav superior (49 archivos):**
- Wordmark `.wm` a 39px desktop / 33px mobile.
- Separador vertical entre wordmark y nav-links.
- Nav-links capitalización normal: "Producto", "Cómo funciona", "Planes", "Business".
- "Business" con tratamiento profesional: Funnel Display 700 uppercase 12px, color `#0F1E3A` navy, pill outline con fondo `rgba(15,30,58,.04)`.
- Dividers verticales entre cada nav-link.
- "Entrar" handwritten Patrick Hand azul `#1A4DB3` MAYÚSCULAS + rotaciones por letra.
- "Crear cuenta" Permanent Marker negro + subrayado verde marker `#32E875`.
- Óvalo móvil `#moving-oval` compartido: viaja a los 6 targets (Producto, Cómo funciona, Planes, Business, Entrar, Crear cuenta) con `preserveAspectRatio="none"` + `vector-effect="non-scaling-stroke"` + padding fijo 34×18.

**Hero del landing:**
- H1 5 líneas con `<br>` forzados: "Tu / [icon]niversidad / entera / En una sola / app."
- App icon en H1: rotado `-6deg`, drop-shadow flat 5px 5px 0 rgba(13,15,16,.22), `width:1.3em`, `vertical-align:-0.38em`, `z-index:10`. Incluye rect lime + u ink + dot naranja (LOGO.04 canónico).
- "entera" con stamp-violet `background:var(--violet)` (aunque se cambió a `#1A4DB3` en el lead, el H1 conserva el violet original según último revert).
- "app" con `.stamp` pink y `.h1-dot-orange` al final.
- Lead con destacadores: `.lh-violet` (azul lapicero), `.lh-lime`, `.lh-pink`.
- CTA row: "Entrar gratis" + "Plataforma" (este último con pill solid ink).
- Columna derecha: preview-card con mini-grid 4×3 de cuadritos numerados 01-12.
- Flecha grafito trazo humano (path irregular) apuntando de card hacia botón Plataforma (width 400px, top 80%, left 36%, rotate 10deg).

**Hero responsive:**
- Breakpoint 1080px: hero min-height calc(100vh - 108px).
- Breakpoint 900px: hero min-height calc(100vh - 104px).
- Breakpoint 640px: hero min-height calc(100vh - 150px).

**Footer (49 archivos):**
- Delgado: padding `6px 32px 6px 40px`.
- Estructura horizontal izquierda: 4 botones (Plataforma, Legal, Empresa, Soporte) con popovers JS al click + 2 links directos (Contacto, Trabaja con nosotros).
- Dividers verticales finos entre botones.
- Copy "© 2026 Conniku SpA · Antofagasta, Chile" al borde derecho con `margin-right:0`.
- Sin app icon en footer.
- Sin tagline.

**Páginas del sandbox:**
- landing.html (CONGELADO)
- devices-preview.html (intacto)
- landing-preview.html (sandbox principal)
- plataforma.html (hub con 12 cards editoriales)
- producto.html, como-funciona.html, planes.html (subpáginas)
- business.html (hub 5 categorías)
- 5 hubs business-<cat>.html
- 38 submódulos business-<id>.html

---

## Spec del logo (inviolable salvo EX documentadas)

Vigente en `/Users/cristiang./CONNIKU/docs/design-system/LOGO-SPEC.md`.
Excepciones autorizadas:
- EX-01: app icon como letra en H1 hero.
- EX-02: rotación asimétrica + drop-shadow en H1 hero.

---

## Pendientes acumulados (fuera del sandbox visual)

1. Legal v3.2 Pieza 2a backend + Pieza 3 paquete abogado.
2. Auth CEO-only (seed Supabase + flag registro + pre-fill email).
3. Migración landing-preview → React del proyecto.
4. Conectar 38 páginas submódulo Business con `src/admin/` real.

---

Fin del checkpoint.
