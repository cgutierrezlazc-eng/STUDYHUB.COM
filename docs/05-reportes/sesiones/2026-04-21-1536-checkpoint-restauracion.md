# Checkpoint — 2026-04-21 15:36

**Motivo:** Cristian aprueba "Kiosko" agregado al top bar + página
placeholder creada. Pendiente configurar contenido real después.

---

## Backup

```
/Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-checkpoint-2026-04-21-1536/
```

Hashes:
- `landing-preview.html`: `75b3da194971f905c501ccd60987c996d45f0f90ca3f140836d146456ff19529`
- `kiosko.html`: `4645f00a81ed7bc6e4215d4374f5dd08047b689a5bd916780e099aef775075fe`

Restaurar:
```bash
mv /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026 /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-trash-$(date +%H%M)
cp -R /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-checkpoint-2026-04-21-1536 /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026
```

---

## Diferencias vs checkpoint 1527

1. **Nav-links** en los 49 archivos: agregado "Kiosko" con separadores entre "Planes" y "BUSINESS".
2. **Footer popover "Plataforma"** en los 49 archivos: agregado `<li>Kiosko</li>` entre Planes y Business.
3. **Archivo nuevo:** `kiosko.html` placeholder con hero compacto:
   - Kicker: "Conniku · Kiosko"
   - H1: "Kiosko." con punto naranja
   - Subtítulo: "El espacio donde viven las apps de Conniku. Pronto."
   - Nav, footer, gate funcional con password `conniku-preview-2026`

Total archivos sandbox: 58 (57 + kiosko.html nuevo).

---

## Nombre confirmado

**Kiosko** es el nombre oficial del "app store" interno de Conniku.
Razón: editorial-universitario chileno, diferenciable, coherente con
la estética del master.

---

## Pendientes (sin cambios)

1. Configurar contenido real de Kiosko (pendiente de instrucciones).
2. Legal v3.2 Pieza 2a backend + Pieza 3 paquete abogado.
3. Auth CEO-only.
4. Migración landing-preview → React del proyecto.
5. 38 submódulos Business conectar con `src/admin/` real.

Fin.
