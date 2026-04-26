# Handoff entre sesiones · Conniku

> Documento que la próxima sesión de Tori (Claude) debe leer **completo y antes de cualquier otra acción** para continuar donde quedó la sesión anterior, sin repetir errores ni romper el flujo de trabajo de Cristian.
>
> Última actualización: **2026-04-26** al cierre de sesión.

---

## 0 · Cómo usar este documento

Si eres una nueva sesión de Tori abriendo esta conversación:

1. Lee este archivo entero antes de tocar nada.
2. Lee también `CLAUDE.md` completo (especialmente la **Sección 17 · Registro vivo de errores**).
3. NO tomes ninguna acción ejecutiva (commit, push, PR, merge, refactor, edición no pedida) hasta que Cristian te dé instrucción explícita.
4. Declara el OBJETIVO PRIMARIO DE SESIÓN en tu primer mensaje (Sección 20 de CLAUDE.md).
5. Espera confirmación de Cristian antes de avanzar.

---

## 1 · Identidad del proyecto

- **Producto:** Conniku — plataforma educativa colaborativa LATAM (SaaS).
- **Repo:** `cgutierrezlazc-eng/STUDYHUB.COM` en GitHub.
- **Working dir local:** `/Users/cristiang./CONNIKU` (frontend React + backend Python).
- **Diseño fuente / lab:** `/Users/cristiang./CONNIKU/docs/04-diseno/orbit-u` (HTMLs prototipo que se bridgean a `src/pages/*.tsx`).
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
3. **NO declarar cierres de módulos.** Solo Cristian con su firma literal "OK Cristian + fecha" cierra módulos.
4. **NO asumir que tu propuesta = autorización.** Una propuesta tuya no autoriza la acción.
5. **NO mergear, hacer force-push, branch delete, reset hard, ni acciones destructivas/irreversibles** sin autorización explícita por turno.
6. **Diseño UI maestro:** todo lo nuevo sigue el patrón de `/Users/cristiang./CONNIKU/docs/04-diseno/orbit-u/pages/perfil-social-v2.html`.
7. **Tema visual por defecto:** `navy-l` (paleta exacta en sec 5).
8. **Pre-commit hook:** ejecuta lint-staged + prettier + eslint + ruff. Si falla, arregla antes de retry. NUNCA usar `--no-verify`.
9. **Idioma:** español neutro latinoamericano, sin voseo.
10. **Declarar OBJETIVO PRIMARIO** al inicio de cada sesión (CLAUDE.md sec 20).

---

## 3 · Estado del proyecto al cierre — 2026-04-26

### Módulos en `main`

| ID | Nombre | Ruta | Estado | Firma |
|---|---|---|---|---|
| M01 | Start | `/start` | EN PRUEBAS | — |
| M01.1 | Terms | `/terms` | EN PRUEBAS | — |
| M01.2 | Privacy | `/privacy` | EN PRUEBAS | — |
| M01.3 | Support | `/support` | EN PRUEBAS | — |
| M01.4 | Contact | `/contact` | EN PRUEBAS (funcional end-to-end con SMTP real) | — |
| M01.5 | Careers | `/careers` | EN PRUEBAS — mergeado PR #44 | — |
| M01.6 | Cookies | `/cookies` | EN PRUEBAS — mergeado PR #53 hoy | — |

**Ningún módulo está APROBADO.** Cristian no ha firmado ninguno todavía.

### Plan de fases — estado al cierre

| Fase | Descripción | Estado |
|------|-------------|--------|
| Fase 0 | i18n base — 6 idiomas, selección real-time | ✅ COMPLETA (PR #52) |
| Fase 1 | Onboarding funcional — forms por rol, reveal | ✅ COMPLETA (en main) |
| Fase 2 | Perfil Social V2 — `/profile`, Mi U, Mi T, Mi Trabajo, Mi Empresa, Stories, Feed | ❌ NO INICIADA — **próximo objetivo** |
| Fase 3 | Módulos internos por rol | ❌ NO INICIADA |
| Fase 4 | Infraestructura transversal — Auth JWT, notificaciones, mensajería | ❌ NO INICIADA |

### Próxima acción acordada
**Iniciar Fase 2** — Perfil Social V2 base. Pendiente autorización explícita de Cristian al abrir la nueva sesión.

---

## 4 · Ramas abiertas SIN MERGEAR

| Rama | Contenido | Estado |
|---|---|---|
| `feat/careers-m01.5` | M01.5 Careers completo | PR #44 mergeado ✅ — en main |
| `feat/careers-dark-theme` | Careers tema navy oscuro + fix width | PR #51 **ABIERTO** — pendiente decisión de Cristian |
| `docs-claude-lecciones-cierres-autorizacion` | CLAUDE.md sec 17 lecciones A–G + handoff | PR #43 **ABIERTO** — pendiente merge, solo docs |

---

## 5 · Tema `navy-l` · paleta exacta

```css
[data-theme="navy-l"] {
  --bg:        #E8EEF8;
  --surface:   #FFFFFF;
  --surface-2: #DCE4F4;
  --surface-3: #C8D4EC;
  --border:    rgba(10,38,100,.12);
  --border-2:  rgba(10,38,100,.07);
  --text:      #060E24;
  --text-2:    #1C2E58;
  --text-3:    #4A5C88;
  --text-4:    #8A9DC0;
  --signature: #0A2878;
  --banner-g1: rgba(10,40,120,.18);
  --banner-g2: rgba(10,40,120,.06);
}
```

**HexTide config:** `{ id: 'navy-l', sig: '#0A2878', bg: '#E8EEF8', op: 0.42, vig: 0.24 }`

**Es un tema LIGHT.** El acento verde `#00C27A` NO se usa aquí — el acento es navy `#0A2878`.

---

## 6 · Sistema i18n — estado real

- **Sistema activo:** `src/services/i18n.tsx` — custom Context con `I18nProvider` + `useI18n()` → `{t, setLang, lang}`.
- **Tamaño:** 275KB — todas las traducciones inline como objetos JS, cubre toda la plataforma.
- **Cómo funciona:** `setLang(code)` actualiza el Context → re-renderiza toda la UI en tiempo real.
- **Código muerto:** `src/i18n/index.ts` (react-i18next configurado con JSON locales) — creado en PR #52 pero NO importado en ningún archivo. No eliminar sin decisión de Cristian.
- **Patrón para páginas nuevas:** `import { useI18n } from '../services/i18n';` → `const { t } = useI18n();`

---

## 7 · Sistema de email — estado real

**Archivo:** `backend/contact_routes.py`
**Envío:** `_send_email_sync` — bloquea, confirma, retorna `(bool, error)`. Devuelve HTTP 502 si falla.

```python
MOTIVO_TO_EMAIL = {
    "Soporte técnico":       ("soporte@conniku.com",    "noreply"),
    "Contacto general":      ("contacto@conniku.com",   "contacto"),
    "Privacidad":            ("privacidad@conniku.com",  "noreply"),
    "Legal":                 ("legal@conniku.com",       "noreply"),
    "Seguridad y Ley Karin": ("seguridad@conniku.com",   "noreply"),
    "Prensa y medios":       ("prensa@conniku.com",      "noreply"),
    "Conniku Business":      ("contacto@conniku.com",   "contacto"),
}
```

**SMTP:** Zoho Mail. Env vars en Render deben ser **App Specific Passwords** (no el password de login). Con 2FA activo, el password normal da `535 Authentication Failed`.

---

## 8 · Perfil Social — referencias de diseño

- **V1 "LinkedIn Navy" (elegido):** `/Users/cristiang./CONNIKU/docs/04-diseno/orbit-u/pages/perfil-v1-FINAL.html`
  - Layout: `280px | 1fr | 280px`, gap 20px, max-width 1200px
  - Tema: navy-l, fondo `#E8EEF8`, acento `#0A2878`
- **V2 (listo para integrar):** `/Users/cristiang./CONNIKU/docs/04-diseno/orbit-u/pages/perfil-v2-FINAL.html`
  - Layout: sidebar 360px + feed 1fr, gap 96px, max 1180px
  - Componentes: `<TopNav>`, `<HexTideCanvas>`, `<ProfileCoverSection>`, `<ProfileMain>`, `<SettingsDrawer>`, `<CoverModal>`

**Decisión de Cristian:** Perfil Social V2 es la fuente de diseño para Fase 2. `perfil-social-v2.html` es el patrón maestro de UI (sidebar + feed, cards `.d-card`, sticky sidebar, composer).

---

## 9 · Fase 2 — lo que sigue (próxima sesión)

### Objetivo a declarar
```
OBJETIVO PRIMARIO SESIÓN: Fase 2.1 — componente base /profile
CRITERIO DE CIERRE: PR en producción con /profile renderizando avatar, header, módulo hero, stories bar y feed
FUERA DE SCOPE: Stories efímeras 24h (2.6), feed híbrido (2.7), módulos internos completos (Fase 3)
```

### Antes de planificar, verificar
1. ¿Existe algún `/profile` en `src/pages/` o `src/components/`?
2. Confirmar con Cristian si usa V1 o V2 como base visual del perfil

### Fuente de diseño para Fase 2
- `perfil-social-v2.html` en ORBIT-U — sidebar 360px + feed, cards, sticky sidebar, composer, HexTide canvas
- Tema: navy-l
- Patrón de layout: ya documentado en perfil-v2-FINAL.html

---

## 10 · Errores cometidos en sesión anterior · NO repetir

1. **Mergear PR entre sesiones sin re-leer handoff.** PR #53 fue mergeado al inicio sin leer CLAUDE.md — autorización de sesión anterior no vale en sesión nueva.
2. **No declarar OBJETIVO PRIMARIO al inicio.** CLAUDE.md sec 20 lo exige en el primer mensaje.
3. **No verificar estado real antes de reportar.** Siempre grep/read antes de afirmar algo sobre el código.

---

## 11 · Comandos / accesos útiles

- **Render dashboard backend:** https://dashboard.render.com/web/srv-d751eh75r7bs73d5ata0
- **Vercel dashboard frontend:** https://vercel.com/cgutierrezlazc-9346s-projects/studyhub-com
- **Producción frontend:** https://studyhub-com-cgutierrezlazc-9346s-projects.vercel.app
- **Producción backend:** https://studyhub-api-bpco.onrender.com
- **Test endpoint contact:**
  ```bash
  curl -X POST https://studyhub-api-bpco.onrender.com/contact \
    -H 'Content-Type: application/json' \
    -d '{"motivo":"Soporte técnico","nombre":"x","email":"x@y.com","asunto":"test","mensaje":"mensaje suficientemente largo para validacion"}'
  ```
- **Verificación imports backend (simular Render):**
  ```bash
  cd backend && python3 -c "import sys; sys.path = [p for p in sys.path if not p.endswith('/CONNIKU')]; sys.path.insert(0, '.'); import server" && echo OK
  ```

---

## 12 · Ubicación de todos los documentos de contexto

| Documento | Ruta exacta |
|-----------|------------|
| Este handoff | `/Users/cristiang./CONNIKU/_SESSION_HANDOFF.md` |
| Estado actual | `/Users/cristiang./CONNIKU/docs/01-proyecto/estado-actual.md` |
| Pendientes | `/Users/cristiang./CONNIKU/docs/01-proyecto/pendientes.md` |
| Reporte sesión 2026-04-26 | `/Users/cristiang./CONNIKU/docs/05-reportes/sesiones/2026-04-26-cierre-sesion.md` |
| CLAUDE.md (reglas) | `/Users/cristiang./CONNIKU/CLAUDE.md` |
| BLOCKS.md | `/Users/cristiang./CONNIKU/BLOCKS.md` |
| FROZEN.md | `/Users/cristiang./CONNIKU/FROZEN.md` |
| Memoria persistente (índice) | `/Users/cristiang./.claude/projects/-Users-cristiang--Desktop--ARCHIVE-CONNIKU-2026/memory/MEMORY.md` |
| Memoria — módulos | `/Users/cristiang./.claude/projects/-Users-cristiang--Desktop--ARCHIVE-CONNIKU-2026/memory/project_modulos.md` |
| Memoria — fases | `/Users/cristiang./.claude/projects/-Users-cristiang--Desktop--ARCHIVE-CONNIKU-2026/memory/project_fases.md` |
| Memoria — email routing | `/Users/cristiang./.claude/projects/-Users-cristiang--Desktop--ARCHIVE-CONNIKU-2026/memory/project_email_routing.md` |
| Memoria — proyecto | `/Users/cristiang./.claude/projects/-Users-cristiang--Desktop--ARCHIVE-CONNIKU-2026/memory/project_conniku.md` |
| Memoria — reset legal | `/Users/cristiang./.claude/projects/-Users-cristiang--Desktop--ARCHIVE-CONNIKU-2026/memory/project_reset_legal.md` |
| Memoria — autorización | `/Users/cristiang./.claude/projects/-Users-cristiang--Desktop--ARCHIVE-CONNIKU-2026/memory/feedback_autorizacion.md` |
| Memoria — errores frecuentes | `/Users/cristiang./.claude/projects/-Users-cristiang--Desktop--ARCHIVE-CONNIKU-2026/memory/feedback_errores_frecuentes.md` |
| Diseño V1 (elegido) | `/Users/cristiang./CONNIKU/docs/04-diseno/orbit-u/pages/perfil-v1-FINAL.html` |
| Diseño V2 (listo) | `/Users/cristiang./CONNIKU/docs/04-diseno/orbit-u/pages/perfil-v2-FINAL.html` |
| Layout fuente verdad | `/Users/cristiang./CONNIKU/docs/04-diseno/orbit-u/pages/perfil-social-v2.html` |
| Variantes light (descartadas) | `/Users/cristiang./CONNIKU/docs/04-diseno/orbit-u/pages/start-perfil-v1-light.html` |

---

## 13 · Próxima acción concreta al abrir nueva sesión

1. Tori lee este handoff completo + `CLAUDE.md` secciones 17 y 20.
2. Tori declara: `OBJETIVO PRIMARIO SESIÓN: Fase 2.1 — componente base /profile` + criterio de cierre + fuera de scope.
3. Tori verifica si existe `/profile` en el codebase actual.
4. Tori presenta plan al architect antes de construir.
5. Cristian autoriza → recién entonces ejecuta.

---

**Fin del handoff. Última actualización: 2026-04-26.**
