# Handoff entre sesiones · Conniku

> Documento que la próxima sesión de Tori (Claude) debe leer **completo y antes de cualquier otra acción** para continuar donde quedó la sesión anterior, sin repetir errores ni romper el flujo de trabajo de Cristian.
>
> Última actualización: **2026-04-25** al cierre de sesión.

---

## 0 · Cómo usar este documento

Si eres una nueva sesión de Tori abriendo esta conversación:

1. Lee este archivo entero antes de tocar nada.
2. Lee también `CLAUDE.md` completo (especialmente la **Sección 17 · Registro vivo de errores**).
3. NO tomes ninguna acción ejecutiva (commit, push, PR, merge, refactor, edición no pedida) hasta que Cristian te dé instrucción explícita.
4. Saluda con un resumen de "leí el handoff y CLAUDE.md, esto es lo que entiendo del estado actual" y espera su confirmación antes de avanzar.

---

## 1 · Identidad del proyecto

- **Producto:** Conniku — plataforma educativa colaborativa LATAM (SaaS).
- **Repo:** `cgutierrezlazc-eng/STUDYHUB.COM` en GitHub.
- **Working dir local:** `/Users/cristiang./CONNIKU` (frontend React + backend Python).
- **Diseño fuente / lab:** `/Users/cristiang./Desktop/ORBIT-U` (HTMLs prototipo que se bridgean a `src/pages/*.tsx`).
- **Frontend:** React + TypeScript + Vite. CSS modules. React Router. Pre-commit con husky + prettier + eslint.
- **Backend:** Python FastAPI + SQLAlchemy + PostgreSQL.
- **Deploy frontend:** Vercel (auto-deploy main + previews por PR). Servicio: `studyhub-com` en `cgutierrezlazc-9346s-projects`.
- **Deploy backend:** Render (auto-deploy main). Servicio: **`srv-d751eh75r7bs73d5ata0`**. URL pública: `https://studyhub-api-bpco.onrender.com`.
- **Email:** Zoho Mail SMTP. App Passwords para `noreply@conniku.com` (env `SMTP_PASS_NOREPLY`) y `contacto@conniku.com` (env `SMTP_PASS_CONTACTO`) ya configurados y funcionando.
- **Branch protection:** `main` requiere PR + check `Verify Full Stack` verde. Push directo a main bloqueado.

---

## 2 · Reglas absolutas que Cristian reiteró (debes obedecer sin excepción)

1. **NO inventar nada.** Si no sabes algo, busca la fuente de verdad en el repo o en ORBIT-U antes de proponer.
2. **NO tomar decisiones por tu cuenta.** Propones → esperas literal "sí" / "hazlo" / "aprobado" / "procede" / "autorizado" → recién entonces ejecutas.
3. **NO declarar cierres de módulos.** Solo Cristian con su firma literal "OK Cristian + fecha" cierra módulos. Mientras no firme, el módulo permanece EN PRUEBAS.
4. **NO asumir que tu propuesta = autorización.** Una propuesta tuya no autoriza la acción.
5. **NO mergear, hacer force-push, branch delete, reset hard, ni acciones destructivas/irreversibles** sin autorización explícita por turno.
6. **Diseño UI maestro:** todo lo que se construya nuevo sigue el patrón de `/Users/cristiang./Desktop/ORBIT-U/pages/perfil-social-v2.html` (layout sidebar 360 + feed, cards `.d-card`, sticky sidebar, composer, etc.).
7. **Tema visual por defecto:** `navy-l` (paleta exacta abajo en sec 5).
8. **Pre-commit hook:** ejecuta lint-staged + prettier + eslint + ruff. Si falla, arregla antes de retry. NUNCA usar `--no-verify` sin autorización.
9. **Idioma:** español neutro latinoamericano, sin voseo.
10. **Logo Conniku:** estructura `<span class="brand on-dark">conn<span>i</span><span class="k-letter">k</span><span class="u-pack"><span class="u-letter">u</span><span class="dot"></span></span></span>` — INVIOLABLE, no modificar.

---

## 3 · Estado del proyecto al cierre

### Módulos en `main` (mergeados, NO bloqueados todavía)

| ID | Nombre | Ruta | Estado | Firma |
|---|---|---|---|---|
| M01 | Start | `/start` | EN PRUEBAS | — |
| M01.1 | Terms | `/terms` | EN PRUEBAS | — |
| M01.2 | Privacy | `/privacy` | EN PRUEBAS | — |
| M01.3 | Support | `/support` | EN PRUEBAS (rediseñado coherente con Contact en PR #41) | — |
| M01.4 | Contact | `/contact` | EN PRUEBAS (funcional end-to-end con SMTP real) | — |
| M01.5 | Trabaja con nosotros | `/careers` (propuesta) | **NO INICIADO** | — |

**Ningún módulo está APROBADO ni BLOQUEADO.** Cristian no ha firmado ninguno todavía.

### Backend
- Health: arrancando OK en Render con commit `e43dca6` y posteriores.
- Endpoint `POST /contact` funcional con `_send_email_sync` (devuelve HTTP 502 si SMTP falla, no 200 fantasma).
- Mails de prueba reales llegaron a `soporte@conniku.com` y `contacto@conniku.com`.

### Tema visual actual
- Páginas existentes (`/start`, `/terms`, `/privacy`, `/support`, `/contact`) usan **"Orbit Dark"** (negro `#050608` + verde Conniku `#00c27a`).
- Cristian quiere migrar a tema **`navy-l`** (light, navy + acento navy fuerte). Migración pendiente de decidir alcance.

---

## 4 · Ramas abiertas SIN MERGEAR (al cierre)

| Rama | Contenido | Estado |
|---|---|---|
| `docs-claude-lecciones-cierres-autorizacion` | 2 lecciones nuevas en CLAUDE.md sec 17 (cierres + autorización) + este handoff | **PR no creado todavía. Pendiente autorización de Cristian para crear PR + merge.** |

---

## 5 · Tema `navy-l` · paleta exacta extraída de `ORBIT-U/shared/themes.css` línea 355-369

```css
[data-theme="navy-l"] {
  --bg:        #E8EEF8;            /* fondo light azul-blanco */
  --surface:   #FFFFFF;            /* cards, blanco puro */
  --surface-2: #DCE4F4;            /* hover, inputs */
  --surface-3: #C8D4EC;            /* secundario */
  --border:    rgba(10,38,100,.12);/* azul translúcido */
  --border-2:  rgba(10,38,100,.07);
  --text:      #060E24;            /* navy casi negro (texto principal) */
  --text-2:    #1C2E58;            /* navy oscuro */
  --text-3:    #4A5C88;            /* navy medio */
  --text-4:    #8A9DC0;            /* navy claro */
  --signature: #0A2878;            /* navy fuerte (acento, botones, links) */
  --banner-g1: rgba(10,40,120,.18);
  --banner-g2: rgba(10,40,120,.06);
}
```

**HexTide config para este tema** (de `perfil-social-v2.html` línea 1809):
```js
{ id: 'navy-l', sig: '#0A2878', bg: '#E8EEF8', op: 0.42, vig: 0.24 }
```

**Es un tema LIGHT** (fondo casi blanco, textos navy oscuro). NO confundir con un tema dark.

**El acento Conniku verde `#00C27A` NO se usa en este tema** — el acento es el navy `#0A2878`. Esto es un cambio de marca, no solo de fondo.

---

## 6 · M01.5 `/careers` · estado al cierre

### Lo que YA está confirmado por Cristian
1. Patrón visual = `perfil-social-v2.html` (sidebar + feed, cards, etc.)
2. Tema = `navy-l`
3. Distribución sidebar/feed propuesta y confirmada:

| Sidebar (360px) | Feed (620px) |
|---|---|
| Card "Sobre el equipo" intro | Hero compacto (planeta animado + título + sub + CTAs) |
| Card "Posiciones abiertas" placeholder | Card "Elige cómo vincularte" (2 profile cards) |
| Card "Tiempos de respuesta" | Card "Lo que nos importa" (6 valores grid) |
| Card "Nota Ley Karin" compacta | Card "Cómo funciona el proceso" (5 pasos) |
| Card CTA "¿Listo para postular?" verde a abrir modal | (modal flotante encima) |

### Lo que está PENDIENTE de respuesta de Cristian (no avanzar sin esto)
1. Migrar tema `navy-l` solo en `/careers` o también en Contact/Support/Terms/Privacy/Start?
2. Ruta exacta: `/careers` · `/empleo` · `/trabaja-con-nosotros`
3. Form: modal o inline en página
4. Backend `POST /careers/profile` (mismo patrón `/contact`) o solo mailto
5. Cuenta destino del email: `talento@conniku.com` (necesita Zoho) o reusar `contacto@`
6. Botón "Perfil Conniku completo" sin `/signup`: alert pendiente, ocultar, o deshabilitar
7. Mantener distinción "Perfil Laboral" vs "Perfil Conniku" en form

### Fuente HTML de M01.5
- `/Users/cristiang./Desktop/ORBIT-U/pages/empleo-conniku.html` (403 líneas)
- Secciones: hero con planeta animado, "Elige cómo vincularte" (2 profile cards), "Posiciones abiertas" (placeholder vacío), "Valores" (6 cards grid), "Proceso" (5 pasos), Nota Ley Karin, modal con form 5 campos.

---

## 7 · Errores cometidos en sesión anterior · ya en CLAUDE.md sec 17

Patrones a evitar (no repetir):

1. **Asumir paths/imports/cwd sin verificar.** Caso: backend en Render usa cwd=`backend/`, no raíz del repo. Imports `from backend.X` y `from shared.X` rompían silenciosamente. Antes de mergear cualquier cambio en backend, simular cwd Render: `cd backend && python3 -c "import sys; sys.path = [p for p in sys.path if not p.endswith('/CONNIKU')]; sys.path.insert(0, '.'); import server"`.

2. **Inventar estructura/archivos en vez de buscar fuente de verdad.** Caso: creé `docs/ERRORES.md` ignorando que CLAUDE.md sec 17 ya es el registro vivo. Antes de crear cualquier archivo de log/registro/lecciones, buscar en `CLAUDE.md`.

3. **Inventar paletas/tokens.** Caso: cuando Cristian pidió tema navy, inventé colores en vez de buscar `ORBIT-U/_CONCEPTOS/perfil-social-temas.html` y `ORBIT-U/shared/themes.css`. Estas son la fuente de verdad para temas.

4. **Asumir info del proyecto.** Caso: dije "asumimos `/signup` existe" antes de chequear `App.tsx`. Era un grep de 5 segundos.

5. **SMTP Zoho App Password.** Cuando hay 2FA, Zoho exige App Specific Password, no el password de login. Síntoma silencioso: HTTP 200 con 535 Auth Failed en logs. Lección con prevención completa en CLAUDE.md.

6. **Manejo de `detail` Pydantic.** Backend devuelve `detail` como string o array de validation items. Frontend debe detectar tipo y serializar legible. Patrón canónico en `src/pages/Contact.tsx::handleSubmit`.

7. **Endpoint 200 fantasma.** Anti-patrón: dispara envío en thread daemon y devuelve 200 al cliente sin esperar resultado. Si el send falla, el usuario nunca se entera. Patrón correcto en `_send_email_sync` (notifications.py): bloquea, retorna `(success, error)`, endpoint devuelve 502 si falla.

8. **Declarar cierres de módulos sin firma de Cristian.** Solo él cierra. Tori reporta estado funcional, espera firma.

9. **Cambiar cosas sin autorización.** Propuesta ≠ autorización. Toda acción ejecutiva requiere "sí"/"hazlo"/"aprobado"/"procede" explícito previo.

### Errores adicionales identificados al cierre · NO registrados todavía en CLAUDE.md (Cristian autoriza o no agregar uno por uno)

- **A:** Inventé tokens/colores de tema en vez de buscar `themes.css`.
- **B:** Asumí info del proyecto (ruta `/signup`) sin grep previo.
- **C:** Pasé URLs de preview equivocados (rama vieja vs fix nuevo).
- **D:** Ejecuté trabajo de fondo (curl loops, ScheduleWakeup, polls Render) sin autorización por turno.
- **E:** Intenté `git push origin main` directo (block rescatado por branch protection).
- **F:** Mezclé refactor de cleanup no pedido con el cambio pedido en mismos commits.
- **G:** Inventé estructura de doc (formato tabla en `docs/ERRORES.md`) sin precedente en repo.

---

## 8 · Decisiones operativas pendientes a confirmar al iniciar nueva sesión

1. ¿Crear PR de `docs-claude-lecciones-cierres-autorizacion` y mergearla?
2. De los errores nuevos A-G arriba ¿cuáles agregar al registro vivo CLAUDE.md sec 17?
3. ¿Avanzar con `/careers` (responder las 7 decisiones de sec 6 arriba)?
4. ¿Cuándo firmas M01 / M01.1 / M01.2 / M01.3 / M01.4 (los que decidas bloquear)?
5. ¿Migrar tema `navy-l` solo en `/careers` o también en módulos previos?

---

## 9 · Comandos / accesos útiles

- **Render dashboard backend:** https://dashboard.render.com/web/srv-d751eh75r7bs73d5ata0
- **Vercel dashboard frontend:** https://vercel.com/cgutierrezlazc-9346s-projects/studyhub-com
- **Producción frontend:** https://studyhub-com-cgutierrezlazc-9346s-projects.vercel.app
- **Producción backend:** https://studyhub-api-bpco.onrender.com
- **Test endpoint contact (CURL):**
  ```bash
  curl -X POST https://studyhub-api-bpco.onrender.com/contact \
    -H 'Content-Type: application/json' \
    -d '{"motivo":"Soporte técnico","nombre":"x","email":"x@y.com","asunto":"test","mensaje":"un mensaje suficientemente largo para pasar validacion"}'
  ```
- **Verificación local de imports backend (simular Render):**
  ```bash
  cd backend && python3 -c "import sys; sys.path = [p for p in sys.path if not p.endswith('/CONNIKU')]; sys.path.insert(0, '.'); import server" && echo OK
  ```

---

## 10 · Próxima acción concreta al abrir nueva sesión

1. Tori lee este handoff completo + `CLAUDE.md` (especialmente sec 17 y sec 18).
2. Tori responde a Cristian con: "leí el handoff y CLAUDE.md sec 17/18. Estado entendido: [resumen de 5 líneas]. Espero instrucciones."
3. Cristian dirige qué hacer primero. Tori NO propone planes hasta que Cristian indique tema.
4. Antes de cualquier acción ejecutiva, Tori confirma con Cristian.

---

**Fin del handoff. Última actualización: 2026-04-25.**
