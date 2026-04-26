# Handoff entre sesiones · Conniku

> Documento que la próxima sesión de Tori (Claude) debe leer **completo y antes de cualquier otra acción** para continuar donde quedó la sesión anterior, sin repetir errores ni romper el flujo de trabajo de Cristian.
>
> Última actualización: **2026-04-26** al cierre del bloque "Cleanup pre-Fase 2.1" (SHA `b0d2153`, OK Cristian, Vercel preview ✅).

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
- **Diseño fuente / lab:** `/Users/cristiang./CONNIKU/docs/04-diseno/orbit-u` (HTMLs prototipo — ya dentro del repo desde PR #57).
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
11. **VER LA PINTURA COMPLETA ANTES DE CAMBIAR NADA.** Cristian fue explícito: leer el sistema completo (canonical docs, hashes, dependencias) antes de proponer cualquier edición. Incidente PR #54.

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
| M01.5 | Careers | `/careers` | EN PRUEBAS — PR #44 + PR #51 mergeados | — |
| M01.6 | Cookies | `/cookies` | EN PRUEBAS — PR #53 + PR #55 mergeados | — |

**Ningún módulo está APROBADO.** Cristian no ha firmado ninguno todavía.

### Plan de fases — estado al cierre

| Fase | Descripción | Estado |
|------|-------------|--------|
| Fase 0 | i18n base — 6 idiomas, selección real-time | ✅ COMPLETA (PR #52) |
| Fase 1 | Onboarding funcional — forms por rol, reveal | ✅ COMPLETA (en main) |
| Fase 2 | Perfil Social V2 — `/profile`, Mi U, Mi T, Mi Trabajo, Mi Empresa, Stories, Feed | ❌ NO INICIADA — **próximo objetivo** |
| Fase 3 | Módulos internos por rol | ❌ NO INICIADA |
| Fase 4 | Infraestructura transversal — Auth JWT, notificaciones, mensajería | ❌ NO INICIADA |

### Bloque cerrado al cierre de sesión

**"Cleanup pre-Fase 2.1"** — firmado OK Cristian 2026-04-26 + Vercel preview ✅.

- **Merge commit en `main`:** `b0d2153` (squash de PR #58)
- **Branch local borrada:** `chore/cleanup-pre-fase-2-1`
- **HEAD `main` al cierre:** `b0d2153`

#### Resumen de los 6 commits del bloque (squashados en `b0d2153`)

| # | SHA original | Mensaje |
|---|---|---|
| 1 | `00bc432` | chore: limpiar deps huérfanas i18next y archivos untracked pre-Fase 2.1 |
| 2 | `a90dacb` | docs: cerrar hallazgo #10 cleanup_production_db (resuelto en 5c548e5) |
| 3 | `9a734fc` | docs: corregir drift Supabase → PostgreSQL+SQLAlchemy en CLAUDE.md y backend-builder agent (#14) |
| 4 | `559df06` | docs: precisar hallazgo #9 (3 TODOs heterogéneos, no 3 endpoints login) |
| 5 | `7ec63e7` | feat(auth): cablear handleLogin a POST /auth/login con error inline (#9 TDD) |
| 6 | `87fcb26` | docs: sincronizar estado post-cleanup y cierre parcial #9 (login cabled) |

#### Hallazgos GRAVE atendidos en el bloque

- ✅ **#10** `cleanup_production_db.py` movido a `backend/scripts/dangerous/` con guards ENV (vía PR #57, commit `5c548e5`)
- ✅ **#14** Drift Supabase corregido en `CLAUDE.md` (líneas 60/250/757) + `.claude/agents/backend-builder.md` (líneas 3/105) — backend usa PostgreSQL+SQLAlchemy directo
- 🟡 **#9 parcial** `handleLogin` cabled a `POST /auth/login` con TDD (3 tests verdes en `src/pages/Start.test.tsx`). Derivados diferidos a bloques futuros (ver Sección 12).

### Próxima acción acordada
**Iniciar Fase 2.1** — Perfil Social V2 base. Pendiente autorización explícita de Cristian al abrir la nueva sesión.

---

## 4 · PRs y ramas al cierre

### PRs mergeados esta sesión

| PR | Squash SHA | Contenido |
|---|---|---|
| #43 | `ba31ff0` | docs: CLAUDE.md sec 17 lecciones A–G cierres + autorización |
| #51 | `466f428` | feat(careers): tema navy oscuro + fix layout |
| #55 | `5f04c7b` | fix(cookies): restaura Cookies.tsx al canónico cookies.md v1.0.0 |
| #56 | `698107f` | chore: cleanup imports i18n.tsx (useEffect, Gender) |
| #57 | `5c548e5` | chore: consolidar ORBIT-U dentro del repo + AUDITOR_BRIEFING.md (92 archivos) |
| #58 | `b0d2153` | chore: cleanup pre-Fase 2.1 + cierre hallazgos GRAVE #9/#10/#14 |

### Ramas abiertas
Ninguna. Todas las ramas de la sesión fueron mergeadas y eliminadas localmente.

### HEAD `main` al cierre
`b0d2153` — sincronizada con `origin/main` (verificado post-`git reset --hard origin/main`).

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
- **Tamaño:** ~275KB — todas las traducciones inline como objetos JS, cubre toda la plataforma.
- **Cómo funciona:** `setLang(code)` actualiza el Context → re-renderiza toda la UI en tiempo real.
- **Código muerto:** `src/i18n/` (directorio completo — react-i18next + 6 JSON de locales) — creado en PR #52 pero NUNCA importado en ningún archivo. **Cristian debe eliminar manualmente: `rm -rf src/i18n/`**
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

**SMTP:** Zoho Mail. Env vars en Render deben ser **App Specific Passwords**.

---

## 8 · Sistema legal — estado real

- **Cadena canónica:** `docs/02-legal/vigentes/cookies.md` (fuente de verdad) → hash en `backend/constants/legal_versions.py` → renderizado por `src/pages/Cookies.tsx`
- **NUNCA editar el TSX sin leer el MD y verificar el hash.** Incidente PR #54 documentado.
- **Hash activo:** `COOKIES_HASH = "80d41f71f075ae954a4e5f1763266b9830d38849bbe79a7bb931c2a4ee30e38c"`
- **Misma cadena aplica** a Terms, Privacy.

---

## 9 · Perfil Social — referencias de diseño

Todos los archivos de diseño ahora viven dentro del repo:

- **V1 "LinkedIn Navy" (elegido):** `docs/04-diseno/orbit-u/pages/perfil-v1-FINAL.html`
- **V2 (listo para integrar):** `docs/04-diseno/orbit-u/pages/perfil-v2-FINAL.html`
- **Fuente de verdad layout:** `docs/04-diseno/orbit-u/pages/perfil-social-v2.html`
- **Tema tokens:** `docs/04-diseno/orbit-u/shared/themes.css`

**Decisión:** Perfil Social V2 es la fuente de diseño para Fase 2.

---

## 10 · Fase 2 — lo que sigue (próxima sesión)

### Objetivo a declarar
```
OBJETIVO PRIMARIO SESIÓN: Fase 2.1 — componente base /profile
CRITERIO DE CIERRE: PR en producción con /profile renderizando avatar, header, módulo hero, stories bar y feed
FUERA DE SCOPE: Stories efímeras 24h (2.6), feed híbrido (2.7), módulos internos completos (Fase 3)
```

### Antes de planificar, verificar
1. ¿Existe algún `/profile` en `src/pages/` o `src/components/`? (Auditoría dice NO)
2. Confirmar con Cristian si usa V1 o V2 como base visual del perfil

### Fuente de diseño para Fase 2
- `docs/04-diseno/orbit-u/pages/perfil-social-v2.html` — sidebar 360px + feed, cards, sticky sidebar, composer, HexTide canvas
- Tema: navy-l

---

## 11 · Acciones pendientes para Cristian (manuales)

1. **`rm -rf /Users/cristiang./Desktop/ORBIT-U/`** — eliminar original del Desktop ahora que PR #57 está mergeado y la fuente vive en `docs/04-diseno/orbit-u/`
2. **`rm .claude/CURRENT_TASK.md`** — al inicio de la próxima sesión, cierra el contrato del auditor del bloque "Cleanup pre-Fase 2.1"

(Las acciones 1, 3 y 4 originales — eliminar `src/i18n/`, mergear PR #57, revisar AUDITOR_BRIEFING — quedaron resueltas durante el bloque "Cleanup pre-Fase 2.1".)

---

## 12 · Hallazgos 🚨 GRAVE del AUDITOR_BRIEFING.md — estado al cierre

| # | Descripción | Estado |
|---|---|---|
| 9 | `Start.tsx` líneas 452/481/507 + 513 — TODOs heterogéneos | 🟡 **Parcial** — login (línea 507) cabled `7ec63e7` con TDD. Derivados diferidos: ver "Trabajo diferido" abajo. |
| 10 | `cleanup_production_db.py` script destructivo en backend productivo | ✅ Cerrado — movido a `backend/scripts/dangerous/` con guards ENV (commit `5c548e5`, PR #57). |
| 14 | Drift `CLAUDE.md`: "Supabase" como BD/auth backend | ✅ Cerrado — corregido a PostgreSQL+SQLAlchemy en `CLAUDE.md` (líneas 60/250/757) + `.claude/agents/backend-builder.md` (líneas 3/105) (commit `9a734fc`, PR #58). |

### Trabajo diferido a bloques futuros

Pendientes documentados en `docs/01-proyecto/pendientes.md` sección 🔵 BAJO:

1. **Cablear `handleRegistro` en `Start.tsx:513` a `POST /auth/register`** — bloque futuro separado por requerir 30+ campos del schema `RegisterRequest` (legal_session_token, age_declaration_accepted, accepted_text_version_hash, user_timezone, etc.) e inputs adicionales en el modal de registro.
2. **Limpiar TODOs de navegación legacy en `Start.tsx:454,483`** — referencias a `conniku.html` / `pages/conniku.html` ya migrados a `docs/04-diseno/orbit-u/` con PR #57. Acción: remover comentarios `// TODO: cuando se bridgee...` y dejar la navegación final actual.
3. **Auditoría exhaustiva del drift Supabase** — la corrección del bloque tocó solo `CLAUDE.md` y `.claude/agents/backend-builder.md`. No se hizo grep cruzado en `.claude/agents/*.md` restantes, planes históricos en `docs/plans/`, ni READMEs de subdirectorios. Pueden quedar referencias residuales.
4. **Validación funcional Vercel preview del cableado de login** — los 3 tests TDD de `Start.test.tsx` usan mock de `fetch`. La inspección humana del bloque (Capa 6) declaró "todo bien" sin probar request real al backend con cuenta válida. La validación end-to-end real (login real → token → /) queda como verificación cruzada implícita en Fase 2.1 cuando el flujo de perfil requiera usuario autenticado.

### `seed_ceo_profile.py` (AUDITOR_BRIEFING #11, Moderado, fuera de scope GRAVE)

Aún en directorio productivo, sin guards. Pendiente en `pendientes.md` línea 194.

---

## 13 · Errores cometidos esta sesión · NO repetir

1. **PR #54 — editar Cookies.tsx sin leer el sistema legal completo primero.** Se cambió el TSX sin saber que existe `cookies.md` canónico con hash en `legal_versions.py`. Causa: leer archivos aislados sin ver la cadena completa. Prevención: antes de tocar cualquier página legal, leer MD canónico + `legal_versions.py` + TSX como sistema.
2. **Intentar push directo a main** (protected). Crear siempre rama + PR.
3. **Memoria leída del path incorrecto** al inicio — path correcto es `-Users-cristiang--Desktop--ARCHIVE-CONNIKU-2026`, NO `-Users-cristiang--CONNIKU`.

---

## 14 · Comandos / accesos útiles

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

---

## 15 · Ubicación de todos los documentos de contexto

| Documento | Ruta exacta |
|-----------|------------|
| Este handoff | `/Users/cristiang./CONNIKU/_SESSION_HANDOFF.md` |
| Estado actual | `/Users/cristiang./CONNIKU/docs/01-proyecto/estado-actual.md` |
| Pendientes | `/Users/cristiang./CONNIKU/docs/01-proyecto/pendientes.md` |
| AUDITOR_BRIEFING.md | `/Users/cristiang./CONNIKU/AUDITOR_BRIEFING.md` |
| CLAUDE.md (reglas) | `/Users/cristiang./CONNIKU/CLAUDE.md` |
| BLOCKS.md | `/Users/cristiang./CONNIKU/BLOCKS.md` |
| FROZEN.md | `/Users/cristiang./CONNIKU/FROZEN.md` |
| Memoria persistente (índice) | `/Users/cristiang./.claude/projects/-Users-cristiang--Desktop--ARCHIVE-CONNIKU-2026/memory/MEMORY.md` |
| Diseño V1 (elegido) | `/Users/cristiang./CONNIKU/docs/04-diseno/orbit-u/pages/perfil-v1-FINAL.html` |
| Diseño V2 (listo) | `/Users/cristiang./CONNIKU/docs/04-diseno/orbit-u/pages/perfil-v2-FINAL.html` |
| Layout fuente verdad | `/Users/cristiang./CONNIKU/docs/04-diseno/orbit-u/pages/perfil-social-v2.html` |
| Tema tokens | `/Users/cristiang./CONNIKU/docs/04-diseno/orbit-u/shared/themes.css` |

---

**Fin del handoff. Última actualización: 2026-04-26 — cierre sesión post-auditoría.**
