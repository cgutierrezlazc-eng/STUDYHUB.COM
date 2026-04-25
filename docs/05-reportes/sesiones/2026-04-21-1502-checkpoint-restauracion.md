# Checkpoint — 2026-04-21 15:02

**Motivo:** Cristian aprueba el halftone del H1 extendido hacia la
izquierda sobrepasando el límite del texto, con kicker "Conniku ·
Edición 2026 · Chile" eliminado.

---

## Backup

```
/Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-checkpoint-2026-04-21-1502/
```

Hash `landing-preview.html`: `1f62d080db07ec5acbf14a2f070c5967ef271016a6d30d2edd404f6dd80d6cd5`

Restaurar:
```bash
mv /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026 /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-trash-$(date +%H%M)
cp -R /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026-checkpoint-2026-04-21-1502 /Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026
```

---

## Diferencias vs checkpoint 1459

En `landing-preview.html` únicamente:

1. **Kicker eliminado:** `<span class="kicker">Conniku · Edición 2026 · Chile</span>` removido del hero.

2. **Halftone H1 extendido a la izquierda:**
   - `h1::before` con `top:-40px; right:-20px; bottom:-40px; left:-500px` (antes `inset:-20px`)
   - Mask reposicionada a `70% 50%` para que el centro de densidad quede donde está el texto
   - `h1::after` igual con mask en `75% 55%`
   - Los puntos azul `#2540C8` y lime se extienden hacia la izquierda sobrepasando el H1 hasta el borde del viewport (recortado por `overflow-x:hidden` del body)

El resto del sandbox idéntico al checkpoint 1459.

---

## Estado consolidado del landing-preview.html

- Nav: wordmark + links modernos editoriales + CTAs pill (Entrar outline, Crear cuenta solid ink, Business pill navy).
- Hero sin kicker, H1 con 5 líneas (`Tu / [icon]niversidad / entera / En una sola / app.`) con halftone azul+lime detrás extendido hacia la izquierda.
- Preview-card en columna derecha clickable a plataforma.html.
- Flecha grafito apuntando al botón Plataforma.
- Footer compacto con popovers.
- Gate de password funcional.

---

## Pendientes

1. Legal v3.2 Pieza 2a backend + Pieza 3 paquete abogado.
2. Auth CEO-only.
3. Migración landing-preview → React del proyecto.
4. 38 submódulos Business conectar con `src/admin/` real.

Fin.
