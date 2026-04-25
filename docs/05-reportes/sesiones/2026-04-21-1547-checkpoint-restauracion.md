# Checkpoint — 2026-04-21 15:47

**Motivo:** Cristian aprueba el estado con:
- Kiosko agregado al top bar.
- Plataforma eliminada del footer.
- Alturas de separadores del nav normalizadas a 18px.
- `.nav-divider` movido dentro del `.nav-links`.
- Stamp-violet "entera" vuelve a posición original con z-index corregido: el icon del H1 queda visualmente delante del violet al solaparse (`.u-line{position:relative; z-index:5}`).

---

## Backup

```
/Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-checkpoint-2026-04-21-1547/
```

Hash `landing-preview.html`: `d00fc2d9d8616f6abecaf461a914134935ec4c3a8fc8ec7ea2f2028d9c34992e`

Restaurar:
```bash
mv /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026 /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-trash-$(date +%H%M)
cp -R /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-checkpoint-2026-04-21-1547 /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026
```

---

## Cambios vs checkpoint 1536

- Todos los archivos (50): `.nav-divider` movido dentro del `<div class="nav-links">` como primer hijo.
- Todos los archivos (50): alturas de separadores unificadas a `height:18px`.
- Todos los archivos (50): "Plataforma" eliminada del `.footer-nav` (botón + popover + divider).
- `landing-preview.html` adicional:
  - `h1 .u-line{overflow:visible; position:relative; z-index:5}` para crear stacking context que eleve el icon sobre el stamp-violet.
  - `h1 .stamp-violet` sin `translateY` (posición original respetada).

---

## Pendientes (sin cambios)

1. Configurar contenido real de `kiosko.html`.
2. Legal v3.2 Pieza 2a backend + Pieza 3 paquete abogado.
3. Auth CEO-only.
4. Migración landing-preview → React del proyecto.
5. 38 submódulos Business conectar con `src/admin/` real.

Fin.
