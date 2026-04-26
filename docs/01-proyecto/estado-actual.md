# Estado Actual del Proyecto — Conniku SpA
## Punto de referencia: 26 de abril de 2026

**Mantenido por:** Tori (Asistente Interno)
**Última actualización:** 2026-04-26 — post-auditoría pre-Fase 2.1 (PRs #43 #51 #54 #55 mergeados)
**Rama de producción:** `main` — 5 PRs mergeados desde el cierre anterior
**HEAD actual:** `466f428` (#51 feat/careers navy oscuro — mergeado después de #53 #54 #55)
**HEAD al cierre anterior:** `8458eef` (#53 feat/M01.6 cookies)

---

## ¿Qué está construido y en producción?

### Páginas públicas (M01.x) — en `main`, EN PRUEBAS

| ID | Ruta | Descripción | Estado |
|----|------|-------------|--------|
| M01 | `/start` | Landing + onboarding idioma/rol + forms registro + reveal | EN PRUEBAS |
| M01.1 | `/terms` | Términos de servicio v1.0.0 | EN PRUEBAS |
| M01.2 | `/privacy` | Política de privacidad v1.0.0 | EN PRUEBAS |
| M01.3 | `/support` | Centro de soporte | EN PRUEBAS |
| M01.4 | `/contact` | Formulario de contacto — SMTP real funcional | EN PRUEBAS |
| M01.5 | `/careers` | Trabaja con nosotros — tema navy oscuro + fix layout (PR #44 + PR #51) | EN PRUEBAS |
| M01.6 | `/cookies` | Política de cookies v1.0.0 — canónico restaurado (PR #53 + PR #54 + PR #55) | EN PRUEBAS |

**Ningún módulo firmado por Cristian.** Solo él cierra con "OK Cristian + fecha".

### Flujo de inicio completo (Start page)
1. START presionado → selector de idioma (6 idiomas: ES/EN/PT/IT/FR/DE)
2. Selección → UI se traduce en tiempo real (`setLang()` → Context re-render)
3. Selector de tipo de usuario (ya en el idioma elegido)
4. Estudiante → form crear cuenta
5. Tutor → form tutor
6. General/Laboral → form perfil laboral + redes
7. Business → tab A (login) ó tab B (panel módulos + form ventas)
8. Form completado → animación reveal órbita → plataforma

### Sistema i18n
- **Sistema activo:** `src/services/i18n.tsx` — custom Context 275KB, cubre toda la plataforma
- **Hook:** `useI18n()` → `{t, setLang, lang}` — importar desde `../services/i18n`
- **Idiomas:** ES, EN, PT, IT, FR, DE
- **Nota:** `src/i18n/index.ts` (react-i18next) existe pero es código muerto — no importado

### Sistema de email (Contact form)
- **Backend:** `backend/contact_routes.py` — `_send_email_sync`, HTTP 502 si falla
- **SMTP:** Zoho Mail con App Specific Passwords
- **Routing:**

| Motivo | Destino | Cuenta SMTP |
|--------|---------|-------------|
| Soporte técnico | soporte@conniku.com | noreply |
| Contacto general | contacto@conniku.com | contacto |
| Privacidad | privacidad@conniku.com | noreply |
| Legal | legal@conniku.com | noreply |
| Seguridad y Ley Karin | seguridad@conniku.com | noreply |
| Prensa y medios | prensa@conniku.com | noreply |
| Conniku Business | contacto@conniku.com | contacto |

---

## Plan de fases — estado de avance

| Fase | Descripción | Estado |
|------|-------------|--------|
| **Fase 0** | i18n base — 6 idiomas, selección real-time | ✅ COMPLETA (PR #52) |
| **Fase 1** | Onboarding — forms por rol, reveal → plataforma | ✅ COMPLETA (en main) |
| **Fase 2** | Perfil Social V2 — `/profile` base + perfiles por rol + stories + feed | ❌ **PRÓXIMO OBJETIVO** |
| **Fase 3** | Módulos internos por rol (Mi U, Mi T, Mi Trabajo, Panel CEO) | ❌ NO INICIADA |
| **Fase 4** | Infraestructura transversal — Auth JWT, notificaciones, mensajería, hardening | ❌ NO INICIADA |

---

## Referencias de diseño

| Archivo | Descripción | Ruta |
|---------|-------------|------|
| perfil-v1-FINAL.html | Perfil Social V1 "LinkedIn Navy" — diseño definitivo | `/Users/cristiang./CONNIKU/docs/04-diseno/orbit-u/pages/perfil-v1-FINAL.html` |
| perfil-v2-FINAL.html | Perfil Social V2 — listo para integrar | `/Users/cristiang./CONNIKU/docs/04-diseno/orbit-u/pages/perfil-v2-FINAL.html` |
| perfil-social-v2.html | Fuente de verdad layout V2 (sidebar 360px + feed 1fr) | `/Users/cristiang./CONNIKU/docs/04-diseno/orbit-u/pages/perfil-social-v2.html` |
| start-perfil-v1-light.html | 6 variantes light (descartadas por ahora) | `/Users/cristiang./CONNIKU/docs/04-diseno/orbit-u/pages/start-perfil-v1-light.html` |

**Tema visual activo:** `navy-l`
```
--bg: #E8EEF8  |  --signature: #0A2878  |  --surface: #FFFFFF
--text: #060E24  |  --text-3: #4A5C88  |  --text-4: #8A9DC0
```

---

## Stack técnico activo

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Estilos | CSS Modules — tema navy-l |
| Router | React Router v6 — lazy imports |
| i18n | Custom Context `services/i18n.tsx` |
| Backend | Python FastAPI + SQLAlchemy + PostgreSQL |
| Email | Zoho Mail SMTP — `_send_email_sync` |
| CI/CD | Husky + lint-staged + Prettier + ESLint + Ruff |
| Deploy frontend | Vercel — `studyhub-com` |
| Deploy backend | Render — `srv-d751eh75r7bs73d5ata0` |

---

## PRs mergeados hoy — 2026-04-26

| PR | Commit | Contenido |
|----|--------|-----------|
| #43 | `ba31ff0` | docs: CLAUDE.md sec 17 lecciones A–G cierres + autorización |
| #51 | `466f428` | feat(careers): tema navy oscuro + fix layout ancho completo |
| #53 | `8458eef` | feat(M01.6): página /cookies + footer links + wizard legal activo |
| #54 | `a7ad8c4` | fix(cookies): intento de corrección — revertido por PR #55 |
| #55 | `5f04c7b` | fix(cookies): restaura Cookies.tsx a cookies.md v1.0.0 canónico |

## Ramas abiertas

Ninguna — todas las ramas de la sesión fueron mergeadas y eliminadas.

---

## URLs de producción

- **Frontend:** https://studyhub-com-cgutierrezlazc-9346s-projects.vercel.app
- **Backend:** https://studyhub-api-bpco.onrender.com
- **Render dashboard:** https://dashboard.render.com/web/srv-d751eh75r7bs73d5ata0
- **Vercel dashboard:** https://vercel.com/cgutierrezlazc-9346s-projects/studyhub-com
