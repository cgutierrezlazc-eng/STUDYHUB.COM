# Registry de Issues Técnicos — Conniku

> Referenciado desde CLAUDE.md. Este archivo vive en el repo y es la fuente de verdad
> para issues de deuda técnica y decisiones de arquitectura pendientes.

## Issues abiertos

### RIS-001 — Rate limiting en memoria (no persiste entre reinicios)
- **Origen:** Auditoría 2026-04-22
- **Severidad:** Media
- **Archivo:** `backend/auth_routes.py` — `_rate_limits: dict`
- **Problema:** El diccionario en memoria se resetea en cada reinicio y no escala con múltiples instancias
- **Fix sugerido:** Migrar a tabla `rate_limits` en BD o Redis
- **Bloque sugerido:** Bloque Infraestructura (post-lanzamiento)

### RIS-002 — Sistema de migraciones BD sin herramienta formal
- **Origen:** Auditoría 2026-04-22
- **Severidad:** Baja
- **Directorio:** `backend/migrations/` — 7 archivos `.sql` sin orden documentado
- **Problema:** No hay registro de qué migraciones ya corrieron en cada entorno. Orden de ejecución no documentado.
- **Fix sugerido:** Adoptar Alembic o documentar orden en `migrations/README.md`
- **Bloque sugerido:** Bloque Infraestructura (post-lanzamiento)

### RIS-003 — 0 tests en páginas principales
- **Origen:** Auditoría 2026-04-22
- **Severidad:** Media
- **Páginas sin test:** Dashboard, Login, Register, Checkout, Subscription, Biblioteca, Messages, Courses, Jobs, Gamification, Calendar y 30+ más
- **Fix sugerido:** Smoke tests mínimos para las 5 páginas más críticas al lanzamiento
- **Bloque sugerido:** Bloque B (Settings) y Bloque C (v3 rollout)

### RIS-004 — Lexical 22 versiones desactualizado
- **Origen:** Auditoría 2026-04-22
- **Severidad:** Baja (funcional) / Media (mantenibilidad)
- **Paquete:** `@lexical/react` 0.21.0 → última 0.43.0
- **Riesgo:** Cambios de API acumulados, bugs de seguridad no parchados
- **Bloque sugerido:** Antes de construir nuevas features sobre Workspaces

### RIS-005 — Archivos gigantes (deuda arquitectural)
- **Origen:** Auditoría 2026-04-22
- **Severidad:** Baja (urgencia) / Alta (mantenibilidad a futuro)
- **Archivos:** HRDashboard.tsx (9,244 líneas), UserProfile.tsx (6,099), MiUniversidad.tsx (5,091)
- **Problema:** Imposible testear, escalar o trabajar en paralelo
- **Bloque sugerido:** Bloque F — Refactorización Arquitectural (post-lanzamiento)

### RIS-006 — TODO/FIXME reales pendientes
- **Origen:** Auditoría 2026-04-22
- **Items con acción real:**
  - `backend/referral_routes.py:188` — IP blocking para fraud detection (blockedIps: 0)
  - `backend/social_routes.py:1312` — Merge academic activity items en feed

## Issues cerrados

### RIC-001 — URL StudyHub hardcodeada en yjsProvider.ts
- **Cerrado:** 2026-04-22 — commit bloque-saneamiento-rut-infra-v1
- **Fix:** Reemplazado con `VITE_API_URL` + fallback `conniku-api.onrender.com`

### RIC-002 — CORS de producción incluía localhost
- **Cerrado:** 2026-04-22 — commit bloque-saneamiento-rut-infra-v1
- **Fix:** render.yaml limpiado, localhost removido de CORS producción

### RIC-003 — RUT empresa placeholder 77.XXX.XXX-X
- **Cerrado:** 2026-04-22 — commits bloque-prioridades-lanzamiento-v1 y bloque-saneamiento-rut-infra-v1
- **Fix:** Reemplazado por 78.395.702-7 en todos los archivos (15 ocurrencias)

### RIC-004 — Checkout recolectaba datos de tarjeta (PCI-DSS violation)
- **Cerrado:** 2026-04-22 — commit bloque-prioridades-lanzamiento-v1
- **Fix:** Eliminado formulario de tarjeta, redirige a MercadoPago y PayPal

### RIC-005 — PDFReader.tsx bloqueaba tests de Biblioteca
- **Cerrado:** 2026-04-22 — commit bloque-saneamiento-rut-infra-v1
- **Fix:** GlobalWorkerOptions.workerSrc movido a useEffect (M8)
