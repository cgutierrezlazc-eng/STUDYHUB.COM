# MÓDULOS · Conniku ORBIT-U

> Registro maestro de módulos del proyecto. Un módulo = una página o conjunto cohesivo.
> **Estados:** `PENDIENTE` → `EN PROGRESO` → `EN PRUEBAS` → `APROBADO` → `BLOQUEADO`
> **Bloqueado** = aprobado por Cristian. No se modifica sin autorización explícita.

---

## Numeración

- **M01** · raíz del flujo (`index.html`)
  - **M01.x** · páginas accesibles desde el index (footer, modales, etc.)
- **M02** · Tour del universo (`pages/conniku.html`)
- **M03** · Onboarding (registro → onboarding completo)
- **M04** · Producto post-login (orbit-u + perfil)
- **M05** · Módulos del producto (workspaces, mensajes, etc.)

---

## Checklist genérica · todo módulo debe cumplir antes de bloquear

1. ☐ Logo oficial aplicado donde corresponda (estructura HTML exacta de `INSTRUCCIONES.md`)
2. ☐ `ConnikuWordmark.css` linkeada si usa el wordmark
3. ☐ Funnel Display 900 cargada
4. ☐ Enlaces verificados (sin 404)
5. ☐ Sin código dev en producción (`alert()`, `console.warn`, botón "Dev: skip")
6. ☐ Idioma · español neutro latinoamericano (sin voseo)
7. ☐ Verificado por el usuario en el navegador
8. ☐ Firma "OK Cristian" + fecha

---

## Registro

| ID | Nombre | Archivo | Estado | Fecha aprobación | Notas |
|---|---|---|---|---|---|
| **M01** | Start | `index.html` | EN PRUEBAS | — | Pendiente confirmar OK final |
| **M01.1** | Términos de servicio | `pages/terminos.html` | EN PRUEBAS | — | Nebula + wordmark oficial aplicados 2026-04-25 |
| **M01.2** | Política de privacidad | `pages/privacidad.html` | EN PRUEBAS | — | Nebula + wordmark oficial aplicados 2026-04-25 |
| **M01.3** | Soporte | `pages/soporte.html` | EN PRUEBAS | — | Nebula + wordmark oficial aplicados 2026-04-25 |
| **M01.4** | Contacto | `pages/contacto.html` | EN PRUEBAS | — | Nebula + wordmark oficial aplicados 2026-04-25 |
| **M01.5** | Trabaja con nosotros | `pages/empleo-conniku.html` | EN PRUEBAS | — | Nebula + wordmark oficial aplicados 2026-04-25 |

---

## Bloques bloqueados

*(módulos pendientes de bloquear)*

---

## 🏁 Hitos del repo CONNIKU (producción)

### bloque-reset-frontend-from-orbit-v1 · MERGEADO · 2026-04-25
- PR #29 mergeada a `main` · commit `eb77520`
- 6 commits del barrido (260+ archivos eliminados, ~182k líneas borradas)
- Frontend resetado · backend intacto · sistema legal retirado para reconstrucción limpia

### bloque-bridge-m01-start · MERGEADO · 2026-04-25
- PR #30 mergeada a `main` · commit `a4cbc1c`
- `ORBIT-U/index.html` (734 líneas) → `CONNIKU/src/pages/Start.tsx` (638) + `Start.module.css` (552)
- Ruta `/start` activa en producción
- Canvas hex animado, 7 dots orbitando con estela, 45 estrellas distribuidas
- 3 botones planeta activos (conniku, entrar, crear) + 4 decorativos
- Logo oficial Conniku aplicado en panel A y los 2 modales
- Wordmark CSS oficial cargado globalmente desde `src/styles/ConnikuWordmark.css`

**M01 estado:** EN PRODUCCIÓN en `/start`. Pendiente promover a `/` cuando se decida.

**Próximo:** M01.1 Términos · bridging `ORBIT-U/pages/terminos.html` → `CONNIKU/src/pages/Terms.tsx`
