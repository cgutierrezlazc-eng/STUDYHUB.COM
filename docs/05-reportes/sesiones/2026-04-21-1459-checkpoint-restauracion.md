# Checkpoint — 2026-04-21 14:59

**Motivo:** Cristian aprueba el halftone detrás del H1 con formato `.d1/.d4`.
Nuevo punto seguro después del incidente "ARRUINASTE LA HOJA COMPLETA"
y restore al checkpoint 1435.

---

## Backup

```
/Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-checkpoint-2026-04-21-1459/
```

Hash `landing-preview.html`: `6d49216b3c22fb177917742e015a09026bcdd3ed4b6ffcf132e0e21a8efdc9c9`

Restaurar:
```bash
mv /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026 /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-trash-$(date +%H%M)
cp -R /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-checkpoint-2026-04-21-1459 /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026
```

---

## Diferencia vs checkpoint 1435

Único cambio: en `landing-preview.html`, agregado halftone detrás del H1
usando el mismo formato que `.d1/.d4`:

```css
h1{ /* reglas previas */; position:relative }
h1::before{
  content:""; position:absolute; inset:-20px; z-index:-1; pointer-events:none;
  background:radial-gradient(circle,#2540C8 14%,transparent 16%);
  background-size:18px 18px;
  mask:radial-gradient(ellipse at 35% 50%,#000 0%,transparent 65%);
  mix-blend-mode:multiply; opacity:.6;
}
h1::after{
  /* mismo formato, color lime, otra posición de mask */
}
```

Capa azul profundo `#2540C8` + capa lime, ambas con `mix-blend-mode:multiply`
masked radial que desvanece hacia los bordes. Dots detrás del texto sin
mover el H1.

---

## Memoria nueva en esta sesión

- `feedback_no_alterar_sin_pedido.md`: regla inviolable para no tocar
  z-index/layout/position de elementos no mencionados explícitamente.

---

## Estado del resto del sandbox

Idéntico al checkpoint 1435. Sin cambios en los 48 archivos restantes
(nav, footer, preview-card, módulos, gate, popovers).

---

## Pendientes (sin cambios)

1. Legal v3.2 Pieza 2a backend + Pieza 3 paquete abogado.
2. Auth CEO-only (seed Supabase + flag registro + pre-fill email).
3. Migración landing-preview → React del proyecto.
4. Conectar 38 páginas submódulo Business con `src/admin/` real.

Fin.
