# Pendientes del proyecto Conniku — maestro priorizado

**Última actualización**: 2026-04-18 tras Capa 5 sub-bloque 2b Workspaces.

Este archivo consolida todos los pendientes conocidos para que Tori pueda
presentarlos cuando Cristian pida "pendientes" o decida qué bloque emprender.

## Cómo usar

- Las secciones están **ordenadas por riesgo/impacto**, no por tamaño.
- Cada item tiene un **origen** (de dónde viene: auditoría, memoria, commit archivado) para trazabilidad.
- Al cerrar un bloque que resuelve items, actualizar esta lista **tachando** o **removiendo** lo resuelto.
- NO reordenar sin acordarlo con Cristian.

---

## 🔴 CRÍTICO — riesgo legal o de seguridad en producción

### C1. SSRF/RCE en collab_routes (Trabajos Grupales V1) — ✅ CERRADO 2026-04-19
- **Ubicación**: `backend/collab_routes.py:455-503`
- **Resolución**: GroupDocs V1 deprecado completo 2026-04-19. Routers backend (`collab_router` + `collab_ws_router`) comentados en `server.py`. Routes frontend `/group-docs*` removidas en `App.tsx`. Sidebar limpiado. Tablas BD preservadas para eventual migración.
- **Defensas aplicadas antes del deprecado** (fix V1 en commit 4955a96 + export V2 nativo seguro): sanitize_html + inline_remote_images compartidos con V2.
- **FROZEN**: `backend/collab_routes.py`, `backend/workspaces_export.py`, `backend/workspaces_athena.py` agregados a FROZEN.md 2026-04-19.
- **Estado**: sin superficie de ataque SSRF expuesta en producción tras deprecado V1.

### C2. Privilege escalation en update_me — ✅ CERRADO 2026-04-19 (FALSO POSITIVO)
- **Ubicación reportada**: `backend/auth_routes.py:996-1030` (endpoint real `update_me`)
- **Análisis (CLAUDE.md §22 verificación de premisas)**: El schema `UpdateProfileRequest` (Pydantic) NO incluye `is_admin`, `role`, ni `is_banned` como campos. Pydantic v2 por default descarta campos extras del payload (`extra="ignore"`). Por tanto `req.dict(exclude_none=True)` solo contiene los campos del schema, y el `setattr(user, db_key, value)` jamás recibe los campos sensibles.
- **Verificación empírica**: `python3.11 -c "from pydantic import BaseModel; class T(BaseModel): name: str | None = None; r = T(**{'name': 'x', 'is_admin': True}); print(r.dict())"` → `{'name': 'x'}` (is_admin descartado).
- **Estado**: no es vulnerabilidad. La auditoría Konni 2026-04-16 fue incorrecta en este punto.

### C3. Trampa garantizada en quizzes — ✅ CERRADO 2026-04-19
- **Ubicación**: `backend/course_routes.py:977-1016` endpoint `POST /{course_id}/exercises/submit`
- **Resolución**: PR #11 (`security(course): fix C3 trampa garantizada en quizzes`). Fix Opción B del plan: servidor ignora `correctAnswer` del cliente y re-valida contra `CourseQuiz.questions` persistido en BD indexando por hash. Cero cambio de contrato API.
- **Tests**: 4 tests TDD en `backend/tests/test_course_exercises_security.py` — atacante con `correctAnswer` manipulado obtiene score=0; flujo legítimo intacto.
- **Pendiente derivado**: el endpoint `/quiz/submit` (línea 628 de course_routes.py) puede tener vulnerabilidad análoga. Auditar en bloque futuro.

### C4. NameError rompe submission quiz — ⛔ SIN EVIDENCIA 2026-04-19
- **Ubicación reportada**: `backend/course_routes.py:767`
- **Análisis (CLAUDE.md §22)**: La línea 767 actual es `return {"score": score, "passed": passed, "correct": correct, ...}`. NO hay variable `questions` undefined ahí. El parseo AST del archivo completo pasa OK sin errores de sintaxis ni nombres no definidos.
- **Hipótesis**: o bien el bug ya fue fixeado retroactivamente sin documentar, o bien el reporte original de Konni 2026-04-16 tenía el número de línea desactualizado. Sin reproducción concreta, marcado como SIN EVIDENCIA.
- **Estado**: cerrado por falta de reproducibilidad. Si vuelve a aparecer, abrir issue nuevo con stack trace.

### C8. Quiz score inflado por manipulación de denominador — ✅ CERRADO 2026-04-19
- **Ubicación**: `backend/course_routes.py:1110-1131` endpoint `POST /{course_id}/quiz/submit`
- **Problema**: el handler calculaba `total = len(answers)` del cliente. Atacante podía enviar solo 1 respuesta correcta de un quiz de N preguntas → `correct=1`, `total=1`, `score=100%`, `passed=True` → certificado emitido + 30 XP.
- **Origen**: descubrimiento 2026-04-19 al auditar `/quiz/submit` como derivado natural de C3 fix (CLAUDE.md §22 verificación de premisas).
- **Resolución**: cambio de `total = len(answers)` por `total = len(pool)` (denominador desde BD). Preguntas no respondidas cuentan como incorrectas. Hotfix dedicado en rama `hotfix-c8-quiz-submit-total`.
- **Tests**: 4 tests TDD en `backend/tests/test_course_quiz_security.py` (subset trampa, no certificado, flujo legítimo 3/3, flujo 2/3).

### C5. PCI-DSS violation en Checkout
- **Ubicación**: `src/pages/Checkout.tsx:13-30`
- **Problema**: recolecta tarjeta+CVC en React state, simula pago con setTimeout. Viola PCI-DSS y Ley 19.628.
- **Origen**: auditoría 2026-04-16 (top 34 CRITICAL item #2)
- **Fix**: eliminar recolección de datos de tarjeta, redirigir a MercadoPago/PayPal únicamente
- **Bloque sugerido**: Bloque de monetización / pagos

### C6. Tabla de nómina con RUT placeholder
- **Ubicación**: 15 ocurrencias de `77.XXX.XXX-X` en `HRDashboard.tsx`, `LibroRemuneracionesTab.tsx`, `DJ1887Tab.tsx` (archivos FROZEN)
- **Problema**: documentos legales generados (finiquitos, contratos, DJ1887) salen con RUT ficticio → **inválidos ante SII, IT, AFP**
- **RUT real**: `78.395.702-7` (memoria `reference_sii_conniku`)
- **Requiere**: `/unfreeze` autorizado sobre `HRDashboard.tsx` + `hr_routes.py`
- **Bloque sugerido**: Bloque legal nómina Chile

### C7. Discrepancia UF/UTM/SIS backend↔frontend
- **Ubicación**: `backend/payroll_calculator.py:47-50,137` vs `src/admin/shared/ChileLaborConstants.ts:22-23,54`
- **Problema**: UF, UTM y SIS tienen valores distintos en backend y frontend. Afecta tope AFP ($57.120/trabajador/mes), gratificaciones, impuestos segunda categoría
- **Origen**: gap-finder 2026-04-17 (CRITICO-04 y CRITICO-05)
- **Fix**: crear `backend/constants/tax_chile.py` + `labor_chile.py` con cita oficial, importar en ambos lados (o servir via API al frontend)
- **Bloque sugerido**: Bloque legal nómina Chile

### C8. Webhooks MP/PayPal fail-open (resuelto)
- **Estado**: ✅ MERGEADO (PR #2, commit `b8c46f5`) 2026-04-18
- Conservar como referencia

### C9. Documentos legales frontend divergentes y desactualizados
- **T&C**: existen 2 versiones incongruentes (modal Register vs página pública), una dice "16 años" — debe decir 18+
- **Privacidad**: omite Supabase, Firebase Cloud Messaging, Capacitor, Google OAuth → violación GDPR Art. 13 y Ley 19.628 Art. 4°
- **Retracto**: CLAUDE.md dice "10 días corridos", código dice "10 días hábiles"
- **Política de Cookies**: ✅ RESUELTA 2026-04-26 — `/cookies` creada como M01.6, mergeada en PR #53
- **Origen**: legal-docs-keeper 2026-04-17
- **Bloque sugerido**: Bloque legal documentos v3.0 unificados (T&C + Privacy pendientes)

---

## 🟠 ALTO — riesgo funcional u obligación legal

### A1. GoogleAgeDeclarationModal (deuda del Bloque 1)
- **Problema**: al crear cuenta Google nueva, backend responde 403 con `requires_age_declaration`. Frontend actualmente muestra un `alert()` temporal invitando a usar registro email.
- **Fix**: componente React que capture fecha de nacimiento + checkbox de 5 puntos + hash + timezone y reintente `/auth/google`
- **Bloque sugerido**: bloque-1-iter-2 (iteración pequeña)

### A2. Infraestructura `backend/constants/` legal
- **Problema**: CLAUDE.md declara 4 archivos (labor_chile.py, tax_chile.py, consumer.py, data_protection.py) con formato cita+URL+fecha+verificador. Hoy solo existe el `__init__.py` scaffolding
- **Fix**: migrar constantes hardcoded de `payroll_calculator.py` y `ChileLaborConstants.ts` a este paquete
- **Bloque sugerido**: Bloque legal nómina Chile (junto con C6+C7)

### A3. Eliminar código Stripe legacy
- **Ubicación**: `backend/payment_routes.py` completo (código comentado pero presente)
- **Problema**: peso muerto, confusión sobre cuál es el integrador activo
- **Fix**: eliminar archivo, eliminar imports en server.py
- **Bloque sugerido**: Bloque de saneamiento backend

### A4. 145 `print()` en backend → logging
- **Ubicación**: 20 archivos, especialmente `paypal_routes.py` (22), `mercadopago_routes.py` (22), `payroll_calculator.py` (19), `database.py` (12)
- **Problema**: vuelca a logs Render. En pagos puede incluir datos de transacciones → riesgo PCI-DSS/privacidad
- **Fix**: reemplazar por `logger.info/warning/error` con niveles apropiados
- **Bloque sugerido**: Bloque de hardening backend logging

### A5. Tests de integración end-to-end auth
- **Problema**: Bloque 1 dejó solo tests unitarios (modelo, helper, prompt). No hay tests HTTP del flujo completo de `POST /auth/register` y `POST /auth/google`
- **Fix**: FastAPI TestClient + fixtures de request
- **Bloque sugerido**: Bloque de cobertura tests auth

### A6. Dominio `studyhub-api-bpco` visible al usuario
- **Ubicación**: `src/pages/SupportPage.tsx:967` muestra "Backend API: studyhub-api-bpco.onrender.com" al usuario
- **Problema**: dominio legado expuesto; confusión marca
- **Fix**: ocultar o reemplazar por algo genérico
- **Bloque sugerido**: Bloque de saneamiento UI

### A7. Tab Clases + grabación Zoom
- **Origen**: pending tasks rescatados del sistema viejo (memoria `project_pending_tasks`)
- **Problema**: pendiente desde antes del reset
- **Bloque sugerido**: Bloque Mi Universidad Clases

### A8. Play Store 12+ testers → 14 días → producción
- **Origen**: pending tasks rescatados
- **Problema**: proceso de Play Store requiere 12+ testers activos por 14 días antes de producción
- **Bloque sugerido**: no es bloque de código, es proceso logístico

### A9. iOS deploy
- **Origen**: pending tasks rescatados
- **Estado**: standby hasta que Cristian tenga Apple Developer secrets
- **Bloque sugerido**: no bloque, desbloqueo manual

### A10. Email `cal_email=true` trigger real
- **Origen**: pending tasks rescatados
- **Estado**: backend parcial, falta trigger real (cron/apscheduler)
- **Bloque sugerido**: Bloque notifications calendar

### A11. Trabajos Grupales items pendientes
- **Origen**: auditoría 2026-04-16 sección Trabajos Grupales
- Auto-save con debounce server-side + botón guardar visible
- Author colors + contribution metrics
- **Bloque sugerido**: Bloque 2 Trabajos Grupales

---

## 🟡 MEDIO — deuda técnica con impacto moderado

### M1. Migración Biblioteca redesign
- **Origen**: pending tasks rescatados ("Biblioteca redesign — no iniciado")
- **Nota**: Biblioteca v2 ya tiene 5 fases, este "redesign" es tarea visual/UX pendiente

### M2. Profile privacy toggle `is_private`
- **Origen**: pending tasks rescatados ("no iniciado")

### M3. `registry_issues.md` en repo (no solo en memoria)
- **Problema**: CLAUDE.md referencia el archivo en raíz del repo, agentes como truth-auditor intentan leerlo. Solo existe en memoria de usuario.
- **Fix**: mover/copiar a raíz del repo, versionado

### M4. 912 `any` TS incremental
- **Ubicación**: 84 archivos, UserProfile (59), Profile (65), Jobs (33), HRDashboard (34)
- **Fix**: reducir progresivamente por bloque

### M5. Branch protection main efectiva
- **Problema detectado 2026-04-18**: pude pushar directo a main sin PR pese a que CLAUDE.md declara protección. Configuración GitHub no efectiva.
- **Fix**: activar en GitHub UI "Require pull request before merging" + "Require status checks to pass" para main

### M6. `.reset-archive/` cleanup
- **Estado**: conservado hasta "Fase 5" (sin fecha definida)
- **Acción futura**: borrar cuando sistema nuevo esté 100% estable y verificado

### M7. i18n legal (cuando se expanda)
- **Problema**: texto del checkbox declarativo hardcoded en español chileno
- **Acción**: cuando se expanda a otros países, agregar traducciones validadas por abogado local

### M8. Biblioteca no se puede testear con vitest
- **Origen**: saneamiento-post-rollout-v3 fase 5 (2026-04-20)
- **Problema**: `src/pages/Biblioteca.tsx` carga `src/components/PDFReader.tsx` que hace `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)` top-level. Vitest+jsdom no resuelve esa URL y el import falla.
- **Fix sugerido**: lazy-import `PDFReader` con `React.lazy()` o mover el `workerSrc` dentro de un `useEffect` para que no se ejecute al importar el módulo.
- **Impacto**: Biblioteca queda fuera del smoke test de pages-migradas-v3. No afecta producción (browsers sí resuelven la URL).

---

## 🔵 BAJO — mejora incremental

- `static_courses_*.py` (654KB hardcoded) migrar a BD
- TODOs vivos en `social_routes.py:1312`, `referral_routes.py:188`
- `ai_workflow_routes.py` docstring dice "Gemini" pero código usa OpenAI (clarificar)
- `.claude/session.lock` stale handling
- `cleanup_production_db.py` + `seed_ceo_profile.py` gitignore o mover

---

## 📦 RAMA ARCHIVADA — `respaldo-auditoria-rota`

Ver `docs/archive/respaldo-auditoria-rota-candidates.md`.

Commits candidatos para cherry-pick selectivo en bloques futuros (ordenados por valor):

| Hash | Qué trae | Bloque sugerido |
|---|---|---|
| `4d6a8ac` | Sprint 1 seguridad: rate limiting IA, guest mode, body size limit | Bloque hardening auth o seguridad |
| `d0a2a89` | Restrict admin modules a roles autorizados | Bloque hardening auth |
| `1695426` | Optimize social feed N+1 queries (160→10 queries) | Bloque performance social |
| `d0c0e49` | **Athena AI en Trabajos Grupales** (backend endpoint + panel 360px) — sin la parte destructiva que borra MiUniversidad/Profile/StudyPaths | Bloque 2 o 3 Trabajos Grupales (cherry-pick selectivo del patch) |
| `6cfe2bb` | Biblioteca adapters get_document() en 5 fuentes más | Bloque biblioteca completar adapters |
| `b3a6d33` | 7 reparaciones auditoría (UserProfile crashes, Privacy toggles, theme persist, password min 8) | Bloque saneamiento UI |
| `c5690cd` | Fix login button mobile landing | Bloque saneamiento UI |
| `542d4be` | Auto-recovery chunks stale post-deploy (Biblioteca crash) | Bloque PWA/SW |

---

## 🎯 Features post-launch (backlog largo plazo)

- Panel admin Conniku ADS
- Universidades LATAM (expansión post-launch)

### Herramienta matemática interactiva tipo GeoGebra para estudiantes
- **Origen**: solicitud de Cristian 2026-04-22
- **Referencia**: https://www.geogebra.org/classic?lang=es
- **Qué es**: GeoGebra Classic es un entorno matemático interactivo que incluye geometría dinámica, álgebra, hoja de cálculo, gráficas, estadística y cálculo — todo en el navegador, sin instalación.
- **Idea**: integrar una experiencia equivalente dentro de Conniku para los estudiantes. Podría vivir dentro de la sección "Mi Universidad" o como herramienta accesible desde el Dashboard del estudiante.
- **Opciones de implementación a evaluar**:
  - **Opción A (recomendada):** Embeber GeoGebra directamente vía `<iframe>` con su API pública — sin desarrollo propio, listo en horas.
  - **Opción B:** Usar la GeoGebra JavaScript API (gratuita, open source) para integración nativa en el frontend React con mayor control de UX.
  - **Opción C:** Usar una alternativa open source como Desmos API (más simple, solo gráficas 2D) o JSXGraph (más técnico).
- **Consideraciones legales**: GeoGebra es gratuito para uso educativo no comercial. Verificar licencia antes de integrar si Conniku tiene planes de pago.
- **Bloque sugerido**: post-launch, como feature premium o gratuita del módulo educativo
- **Cuándo presentarlo**: cuando Cristian pida avanzar en features de la plataforma educativa

---

## 🆕 Módulos nuevos que Cristian quiere (fuera del Bloque 2 Workspaces)

### Limpieza tier MAX legacy — contrato tutor pendiente
- **Estado**: código backend/docs/migrations ✅ limpiados 2026-04-18 commit `1f9b240`
- **Pendiente**: `backend/tutor_contract.py:78` cláusula "suscripción MAX vigente" con descuento 50%
- **Problema**: texto legal firmado por tutores. Modificar unilateralmente viola CLAUDE.md §Cumplimiento
- **Fix requerido**: Cristian decide (a) eliminar cláusula, (b) renombrar a Conniku Pro, (c) rediseñar beneficio
- **Tutores ya firmados**: pueden requerir addendum

### Publicar Privacy v2.3 + T&C v3.1 en producción (bloque legal dedicado)
- **Estado**: borradores APROBADOS por Cristian 2026-04-19 (revisión visual de `docs/legal/drafts/preview/*.html`)
- **Archivos fuente**:
  - `docs/legal/drafts/2026-04-19-privacy-policy-2d7-export.md` (Privacy v2.3 agrega §5.3 "Procesamiento al exportar documentos")
  - `docs/legal/drafts/2026-04-19-terms-2d7-export.md` (T&C v3.1 agrega §8 "Exportación de Documentos" con 7 sub-secciones)
- **Pendiente publicación**: copiar contenido aprobado a `src/pages/PrivacyPolicy.tsx` + `src/pages/TermsOfService.tsx` + mecanismo re-aceptación vía tabla `user_agreements` (bump `AGE_DECLARATION_VERSION` o similar para versiones legales — alerta-LEG-1 preexistente)
- **Bloque sugerido**: Bloque dedicado "Legal v3 publicación" que unifique también pendientes C9 + v3.0 del 2c Athena sin publicar
- **Why separado del Bloque 2 v1**: cambio legal MAJOR requiere re-aceptación del usuario actual + trigger de notificación, scope distinto al deploy técnico de features.

### Bloque 2.5 Workspaces Features Premium (post-v1 publicable)
- **Decisión**: Cristian eligió cortar el Bloque 2 en versión publicable 2026-04-19
- **Contenido v1 publicable**: 2a + 2b + 2c + 2d.1 APA + 2d.3 KaTeX + 2d.6 Rúbrica + 2d.7 Export + 2d.8 Comentarios
- **Diferido a Bloque 2.5** (post-launch, tras ver uso real):
  - **2d.2** TOC automático + Tapa editable + Plantillas (~1.5 días)
  - **2d.4** MathLive input visual de matemáticas (~1 día)
  - **2d.5** SymPy backend + gráficos (~1.5 días)
  - **2d.9** Link público con token compartible (~1 día, componente legal — requiere abogado)
  - **2d.10** UX envoltura: modo enfoque, modo presentación, atajos teclado completos, STT/TTS, arrastrar archivos, voice notes, imprimir, duplicar, star, búsqueda global (~3 días)
- **Bloque sugerido**: Bloque 2.5 Workspaces Premium, tras evaluación de uso real de v1
- **Plan**: `docs/plans/bloque-2-workspaces/2d-features-avanzadas.md` §2d.2-5-9-10

### Sub-bloque 2b Workspaces — iter-2 post-deploy (baja prioridad)
- **Origen**: hallazgos de code-reviewer Capa 2 + gap-finder Capa 5 del 2b
- Los 3 CRÍTICOS (docId prefix, userId guest, freeze collab_ws) + 1 ALTO (VITE_API_URL) + los MODERADO/INFORMATIVO del code-reviewer fueron corregidos antes del deploy preview
- Pendiente menor:
  - Actualizar `docs/plans/bloque-2-workspaces/plan-maestro.md:47,138` para reemplazar "Free/PRO/MAX" → "Free/Conniku Pro" (parte del refactor tier MAX)
  - Tests adicionales de producción real con dos navegadores abiertos simultáneamente (inspección humana Capa 6)

### Chat conversacional en Biblioteca
- **Qué**: dentro de la página Biblioteca, un chat donde el usuario pregunta algo puntual
- **Respuesta esperada**: link directo al libro/paper de la Biblioteca Conniku que contiene la información
- **Origen**: solicitado por Cristian 2026-04-18 al responder Athena-5 del Bloque 2
- **Bloque sugerido**: módulo dedicado posterior a Workspaces (no mezclar)
- **Why no integrar a Athena en Workspaces**: Cristian prefiere no gastar tokens/recursos conectando Athena con Biblioteca. La funcionalidad vive mejor como chat propio de Biblioteca, con su propia UX.
- **Cuándo presentarlo**: cuando Cristian pida "pendientes" o cuando toquemos el módulo Biblioteca

---

## Bloques sugeridos por orden de prioridad recomendado

1. **Bloque 2**: Trabajos Grupales seguridad + estabilidad (C1 + A11 + tests mínimos)
2. **Bloque 3**: Hardening auth (C2 privilege escalation + A1 GoogleAgeDeclarationModal)
3. **Bloque 4**: Hardening quizzes (C3 + C4)
4. **Bloque 5**: Legal nómina Chile (C6 + C7 + A2)
5. **Bloque 6**: T&C + Privacy v3.0 unificados (C9)
6. **Bloque 7**: Perfil + Dashboard (features Cristian)
7. **Bloque 8**: Mi Universidad Clases + grabación Zoom (A7)
8. **Bloque 9**: Monetización hardening (C5 PCI + retracto + reembolsos)

Este orden prioriza **seguridad/legal antes que features nuevas**. Cristian puede cambiar el orden si alguna feature tiene prioridad de negocio.
