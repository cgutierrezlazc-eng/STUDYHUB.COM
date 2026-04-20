# Plan · Rollout completo del diseño v3 a Conniku

```yaml
PLAN_ID:           rollout-design-v3-completo
AUTHOR:            Tori (Opus 4.7) — autorización extendida de Cristian 2026-04-19 noche
DATE_DRAFTED:      2026-04-19
TARGET:            aplicar el sistema visual v3 (tokens + tipografías + componentes) a TODAS las superficies del producto, no solo el piloto
DEPENDS_ON:        bloque-piloto-rediseno-v3 mergeado a main + en producción
STATUS:            BORRADOR — se ejecuta tras Fase 1 (piloto online)
PROTOCOL:          rollout incremental por página, un commit por página, push periódico
```

---

## 1. Contexto

Cristian autorizó (mensaje 2026-04-19 noche) aplicar el sistema visual v3 a la totalidad del proyecto, no solo a las 3 superficies piloto. Cita literal:

> "aplica el nuevo diseno completo, te autorizo a tomar desiciones y aceptar tu mismo lo que sea necesario"
> "si alguna parte del proyecto no puede quedar identico al proyecto nuevo de diseno, comenzar a crear para que quede como el diseno"
> "el fin es poner la plataforma con el nuevo diseno lo antes posible"
> "todo lo que es publicidad, perfiles inventados, nombres, fotos, y todo, mensajes, notas, comentarios, son creados solo para publicidad, crear un proyecto limpio, sin usuarios, solo EL PERFIL DE CEO"

## 2. Inventario actual

### 2.1 Páginas existentes (55 total)

```
src/pages/:
AIWorkflows.tsx          Admin.tsx                Biblioteca.tsx
CVProfile.tsx            Calendar.tsx             CeoDashboard.tsx
CeoMail.tsx              CertVerify.tsx           Checkout.tsx
ClassRoom.tsx            Communities.tsx (FROZEN) Conferences.tsx (FROZEN)
Courses.tsx              Dashboard.tsx (FROZEN)   DeleteAccount.tsx
Events.tsx               Feed.tsx                 Friends.tsx (FROZEN)
Gamification.tsx         GroupDocEditor.tsx (FRZ) GroupDocs.tsx
HRDashboard.tsx (FROZEN) InfoPages.tsx            Jobs.tsx (FROZEN)
Landing.tsx (legacy)     LandingProposals.tsx     Login.tsx (legacy)
Marketplace.tsx          Mentorship.tsx (FROZEN)  Messages.tsx (FROZEN)
MiUniversidad.tsx        MyTutorDashboard.tsx     NotFound.tsx
PrivacyPolicy.tsx        Profile.tsx              ProjectView.tsx
PublicTutorPage.tsx      Quizzes.tsx              Register.tsx (legacy)
Search.tsx               StudyPaths.tsx           StudyRooms.tsx
Subscription.tsx         Suggestions.tsx          SupportPage.tsx
TermsOfService.tsx       TutorDirectory.tsx       UserProfile.tsx (FROZEN)

src/pages/v3/ (creado por bloque piloto):
LandingV3.tsx  LoginV3.tsx  RegisterV3.tsx  DashboardV3.tsx

src/pages/Workspaces/:
WorkspaceEditor.tsx  WorkspaceInvite.tsx  WorkspaceSettings.tsx  WorkspacesList.tsx
```

### 2.2 Módulos del paquete de diseño (21)

```
02-landing            ← cubierto por bloque piloto
03-dashboard          ← cubierto por bloque piloto (paralelo)
04-biblioteca         ← prioridad 1
05-workspaces         ← prioridad 1 (Bloque 2 ya cerrado, refactor visual)
06-perfil-social      ← prioridad 2
07-chat               ← prioridad 2 (FROZEN: estrategia paralela)
08-configuracion      ← prioridad 2
09-cursos-diploma     ← prioridad 2
10-tutores            ← prioridad 3
11-classroom          ← prioridad 3
12-oferta-laboral     ← prioridad 3 (FROZEN: estrategia paralela)
13-cv-editor          ← prioridad 3
14-mi-universidad     ← prioridad 3
15-gamification       ← prioridad 3
16-study-rooms        ← prioridad 3
17-quizzes-flashcards ← prioridad 3
18-calendar           ← prioridad 3
19-workspace-athena   ← prioridad 4
20-movil              ← out of scope (Capacitor, no es web)
21-tienda-virtual     ← prioridad 4
```

### 2.3 Páginas sin equivalente en paquete de diseño

Estas requieren propuesta visual interna respetando el sistema v3:
- AIWorkflows, Admin, CeoDashboard, CeoMail, Checkout, DeleteAccount,
  Events, Feed, GroupDocs, InfoPages, LandingProposals, MyTutorDashboard,
  NotFound, PrivacyPolicy, ProjectView, PublicTutorPage, Search,
  StudyPaths, Subscription, Suggestions, SupportPage, TermsOfService,
  CertVerify, CVProfile (parcial, hay 13-cv-editor)

## 3. Decisiones de arquitectura

### 3.1 D-01 · Cómo aplicar v3 a páginas existentes

**Pregunta**: ¿editamos in-place o creamos `*V3.tsx` paralelo como hicimos en el piloto?

**Decisión**: **mixto basado en estado FROZEN**:

- **Página NO frozen**: edición in-place. Reemplazo el JSX manteniendo lógica/handlers. El archivo legacy queda en git history; rollback por revert.
- **Página FROZEN**: estrategia paralela `*V3.tsx` con feature flag, igual que DashboardV3.

**Razón**: edición in-place reduce duplicación masiva (tener LandingV2 + LandingV3 + LandingV4 algún día es deuda). FROZEN existe por razones legítimas (null-safety, hardening) y se respeta.

### 3.2 D-02 · Tokens v3 — namespace o global

El bloque piloto usa `.v3-surface` namespace para no romper los 8 temas. Para rollout completo necesitamos:

**Decisión**: **expandir namespace al shell autenticado**. Aplicar `.v3-surface` al wrapper raíz del App autenticado (post-login). Las páginas legacy que aún no migré seguirán renderizando con sus selectores propios; las migradas heredarán los tokens v3 del wrapper.

**Cuándo migrar a `:root` global**: cuando el 80% de las páginas estén migradas. Bloque dedicado.

### 3.3 D-03 · Sidebar y TopBar

Sidebar y TopBar son globales y altamente acoplados a las páginas. **Decisión**: rediseñarlos como `SidebarV3` y `TopBarV3` después de migrar 5 páginas (suficiente test de tokens en práctica). Activar con flag adicional `SHELL_V3_ENABLED`.

Mientras tanto, las páginas v3 conviven con Sidebar/TopBar legacy. Inconsistencia visual aceptada (Cristian aprobó este trade-off en P-6 del bloque piloto).

### 3.4 D-04 · Limpieza de contenido fake

**Scope**: solo CÓDIGO. NO base de datos.

- Testimonios fake en LandingV3 → ya están con iniciales anónimas (P-2 cerrado en B)
- Datos demo en archivos seed/fixture → eliminar
- Mocks de demo en componentes → eliminar
- Strings hardcoded de "Juan Pérez", "María García" → eliminar
- Perfil CEO en código (CeoDashboard, CeoMail, configuración admin) → INTACTO

**NO scope** (queda como ticket separado para Cristian):
- Borrar usuarios de auth.users en Supabase
- Limpiar tablas de actividad/progreso
- Cualquier `DELETE FROM ...`

Razón: borrado de BD es irreversible y de alto blast-radius. Cristian lo ejecuta él en el panel de Supabase con SQL directo cuando decida.

## 4. Orden de ejecución

Por prioridad y riesgo, no por número de módulo del paquete.

### Fase A · Estabilización del piloto (PRE-rollout)

1. Mergear `bloque-piloto-rediseno-v3` a main
2. Verificar Vercel deploy producción verde
3. Crear branch `rollout-design-v3-completo` desde main actualizada

### Fase B · Páginas alta prioridad (NO frozen)

Una página = un commit = potencial push si todo verde.

4. **Biblioteca.tsx** ← módulo 04
5. **WorkspacesList.tsx** ← módulo 05 (refactor visual del Bloque 2)
6. **WorkspaceEditor.tsx, WorkspaceInvite.tsx, WorkspaceSettings.tsx**
7. **Profile.tsx** ← módulo 06
8. **Courses.tsx** ← módulo 09
9. **TutorDirectory.tsx** ← módulo 10
10. **ClassRoom.tsx** ← módulo 11
11. **CVProfile.tsx** ← módulo 13
12. **MiUniversidad.tsx** ← módulo 14
13. **Gamification.tsx** ← módulo 15
14. **StudyRooms.tsx** ← módulo 16
15. **Quizzes.tsx** ← módulo 17
16. **Calendar.tsx** ← módulo 18

Push intermedio cada 5 páginas (CI debe estar verde antes).

### Fase C · Páginas FROZEN (estrategia paralela)

17. **MessagesV3.tsx** ← módulo 07 (Messages.tsx FROZEN)
18. **JobsV3.tsx** ← módulo 12 (Jobs.tsx FROZEN)
19. **MentorshipV3.tsx** ← módulo 10 alt (Mentorship.tsx FROZEN)
20. **UserProfileV3.tsx** ← módulo 06 alt
21. **CommunitiesV3.tsx, ConferencesV3.tsx, FriendsV3.tsx**

Push intermedio.

### Fase D · Shell global

22. **SidebarV3.tsx, TopBarV3.tsx** + flag `SHELL_V3_ENABLED`
23. Verificar interacción con todas las páginas migradas
24. Push.

### Fase E · Páginas sin spec en paquete (propuestas internas v3)

25. Settings, Subscription, Search, Feed, Notifications, etc.
26. Páginas auxiliares (NotFound, Privacy, Terms, Support)

### Fase F · Limpieza fake content

27. Grep por nombres ficticios comunes y remover
28. Limpiar mocks en `src/__mocks__/` o equivalente
29. Auditoría final de strings demo

### Fase G · Migración tokens v3 a `:root` global

30. Cuando todas las páginas estén migradas, mover tokens v3 fuera del namespace `.v3-surface`
31. Eliminar los 8 temas legacy (decidir con Cristian si guardar `nocturno` como dark mode)

## 5. Criterio de terminado

Por fase. La sesión termina cuando:

- Fase A completa (piloto en producción) — ESTE ES EL CHECKPOINT MÍNIMO de esta sesión
- Tantas fases B-F como el tiempo permita, cada una con su commit + push verificado
- Documentación de lo que falta en `docs/sessions/2026-04-19-rollout-v3-checkpoint.md`

## 6. Riesgos

| ID | Riesgo | Probabilidad | Severidad | Mitigación |
|---|--------|-------------|----------|------------|
| R-01 | Migrar 50+ páginas en una sesión es inviable | ALTA | BAJA | Trabajar por prioridad, push intermedio cada 5 páginas, documentar pendientes |
| R-02 | Romper funcionalidad existente al cambiar JSX in-place | MEDIA | ALTA | Mantener handlers/state intactos; solo cambiar presentación; tests existentes deben seguir verdes |
| R-03 | Inconsistencia visual mientras hay páginas migradas y no migradas | ALTA | BAJA | Aceptado por Cristian (P-6 del bloque piloto) |
| R-04 | FROZEN files tocados accidentalmente | BAJA | ALTA | Hook `check-frozen.sh` bloquea; estrategia paralela |
| R-05 | Pre-flight CI rojo en algún push | MEDIA | MEDIA | Pre-flight local antes de cada push (§23 CLAUDE.md) |
| R-06 | Hash legal desincronizado al tocar Register/Privacy | BAJA | ALTA | `verify-legal-texts-sync.sh` en cada commit que toque legal |
| R-07 | Borrado accidental de feature crítica | BAJA | ALTA | Convención: NO eliminar archivos sin entender qué hacen |

## 7. Fuera de scope

- Borrado de usuarios en Supabase (ticket para Cristian)
- Migración de mobile/Capacitor (módulo 20 out of scope)
- Refactor de backend
- Cambios de schema BD
- Eliminación de los 8 temas existentes (Fase G dedicada, decidir con Cristian)
- Tests E2E con Playwright (infraestructura no existe)

## 8. Checkpoint humano

Cristian inspeccionará al despertar (Capa 6 del protocolo):
- URL de producción Vercel
- Lista commits + páginas migradas
- Lista pendientes
- Decide si seguir rollout o ajustar dirección visual

Tori NO declara "100% terminado" hasta que Cristian dé OK explícito.
