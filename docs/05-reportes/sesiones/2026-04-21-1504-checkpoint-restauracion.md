# Checkpoint — 2026-04-21 15:04

**Motivo:** Cristian aprueba sombra verde en hover de "Entrar" (igual
que "Crear cuenta") y confirma "Crear cuenta" con letras blancas.

---

## Backup

```
/Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-checkpoint-2026-04-21-1504/
```

Hash `landing-preview.html`: `76a62a0ccb1b5eab66593a0b9a5b2eed2fe51bf848fb5a1ebe50fc0a127f837e`

Restaurar:
```bash
mv /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026 /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-trash-$(date +%H%M)
cp -R /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-checkpoint-2026-04-21-1504 /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026
```

---

## Diferencia vs checkpoint 1502

Único cambio en `landing-preview.html`:
- `.nav-links .nav-cta-link:hover { box-shadow: 4px 4px 0 var(--ink) }` → `var(--lime)`

Ahora "Entrar" al hover tiene sombra verde lime como "Crear cuenta".

"Crear cuenta" conserva `color:var(--paper)` (letras blancas sobre fondo ink), sin cambios.

---

## Pendientes (sin cambio)

1. Legal v3.2 Pieza 2a backend + Pieza 3 paquete abogado.
2. Auth CEO-only.
3. Migración landing-preview → React del proyecto.
4. 38 submódulos Business conectar con `src/admin/` real.

Fin.
