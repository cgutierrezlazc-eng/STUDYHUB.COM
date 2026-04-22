# Checkpoint — 2026-04-21 15:27

**Motivo:** Cristian aprueba el estado tras resolver:
- Línea naranja al fondo del viewport (causada por `<nav class="footer-nav">` heredando reglas del `nav{}` genérico).
- Líneas divisorias nav/footer cambiadas a naranja `var(--orange)`.
- Cuadro "app" en el H1 cambió de `var(--pink)` a `#C72A18` (más rojizo).
- Kicker "Conniku · Edición 2026 · Chile" eliminado del hero.
- Halftone detrás del H1 extendido hacia la izquierda sobrepasando el borde.
- Body flex-column + footer con `margin-top:auto` para pegarse al final.
- `.site-footer` y `footer{}` genérico sin border-top, padding compactado.

---

## Backup

```
/Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-checkpoint-2026-04-21-1527/
```

Hash `landing-preview.html`: `674f3edc3726a4d38ab0c50cf44c687fe76c97bb98b3889f491334b4a2efabc0`

Restaurar:
```bash
mv /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026 /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-trash-$(date +%H%M)
cp -R /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-checkpoint-2026-04-21-1527 /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026
```

---

## Cambios vs checkpoint 1504

En 49 archivos:
- `nav{border-bottom:1.5px solid var(--ink)}` → `var(--orange)` (ya aplicado antes)
- `.site-footer{border-top}` → eliminado
- `footer{}` genérico: `border-top:1.5px solid var(--orange)` eliminado
- Padding footer: `6px 32px 6px 40px` → `2px 32px 2px 40px`
- `.nav-divider`, `.nav-link-divider`, `.footer-divider` background → `var(--orange)`
- `.footer-nav{}` con overrides para no heredar del `nav{}` genérico: `padding:0; border-bottom:none; position:static; background:transparent; backdrop-filter:none; z-index:auto`

En `landing-preview.html` adicional:
- Kicker "Conniku · Edición 2026 · Chile" eliminado
- `h1::before` y `h1::after` halftone con `left:-500px` para extender puntos hacia la izquierda
- `body{display:flex; flex-direction:column}`, `.shell{flex:1}`, `.site-footer{flex-shrink:0; margin-top:auto}`
- `.hero` sin `height:calc(100vh - 116px)`, con `flex:1; min-height:0`
- `h1 .stamp{background:var(--pink)}` → `#C72A18`
- `.nav-links .nav-cta-link:hover{box-shadow:4px 4px 0 var(--lime)}` (era ink)

---

## Pendientes (sin cambios)

1. Legal v3.2 Pieza 2a backend + Pieza 3 paquete abogado.
2. Auth CEO-only.
3. Migración landing-preview → React del proyecto.
4. 38 submódulos Business conectar con `src/admin/` real.

Fin.
