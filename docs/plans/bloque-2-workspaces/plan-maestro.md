# Plan maestro — Bloque 2: Workspaces

**Proyecto**: Conniku
**Autor del plan**: Tori (redactado el 2026-04-18 con las 21 decisiones tomadas por Cristian en el flujo de preguntas)
**Alcance**: módulo Workspaces v2 completo, aislado del v1 actual (Trabajos Grupales)
**Componente legal/seguridad**: sí (protección PCI/SSRF en export, datos académicos sensibles, costos IA Anthropic)
**Protocolo**: 7 capas completo en cada sub-bloque
**Sub-bloques**: 4 (2a Fundación, 2b Colaboración, 2c Athena IA, 2d Features avanzadas + diseño final + tests)

---

## 1. Visión

Workspaces es el módulo **estrella** de Conniku para redacción colaborativa de documentos académicos. Compite con Google Docs, Notion, Craft, Quip — pero enfocado en el caso universitario chileno-latinoamericano:

- **APA por defecto** (7 primero, extensible a 6, IEEE, Chicago, MLA a futuro)
- **Athena AI** como compañera de redacción experta en todas las áreas (humanidades, STEM, ingeniería, matemáticas, ciencias, etc.)
- **Rúbrica de evaluación** cargada al crear el doc + checklist automática de criterios
- **Tapas personalizables** con plantillas institucional/estándar
- **Índice automático** de contenidos
- **Matemáticas avanzadas** (KaTeX + LaTeX + SymPy + gráficos embebidos)
- **Tres zonas de comunicación** claras:
  1. Documento público real-time (Yjs, keystrokes visibles a todos)
  2. Borrador privado con Athena (staging, aplicar/modificar/rechazar, enviar al doc)
  3. Chat del grupo (informal, entre miembros)
- **Niveles de suscripción**: Free = demo (cupo limitado Athena), PRO = alto, MAX = ilimitado
- **Diseño híbrido**: respeta los 6 temas de Conniku con tipografía y espaciado propios (referencia: Google Docs + Notion + Linear + Figma + Craft + Coda + ClickUp)

## 2. Decisiones consolidadas

| # | Área | Decisión |
|---|---|---|
| A1 | Convivencia | V2 activa, V1 escondida (decisión final de borrar/restaurar después) |
| A2 | Nombre | **Workspaces** (sidebar, URL `/workspaces`) |
| A3 | Migración | V2 empieza vacío. Tablas BD nuevas, sin migrar docs V1 |
| B | Features | **Todas** las ~51 consolidadas (ver sección 3) |
| C1 | Identidad | Híbrido: temas light/dark Conniku + tipografía/espaciado premium propios |
| C3 | Mockups | Sí, HTML estáticos antes del código React (Frontend Design skill) |
| C4 | Mobile | Desktop-first con mobile decente (Electron, Capacitor heredan del web) |
| D1 | Motor editor | **Lexical** (Meta) + binding `@lexical/yjs` |
| D2 | Migraciones BD | SQL plano idempotente (patrón `inspector.has_table`) |
| D3 | URL namespace | `/workspaces/*` (sin `/api/v2/` prefijo) |
| APA | Formato | APA 7 por defecto, sistema extensible a IEEE/Chicago/MLA |
| Athena-1 | Prompt | Literal del doc de Konni, iterativo según feedback de usuarios |
| Athena-2 | Edición | Sugiere con botón "Aplicar" (métricas contables en `athena_usage`) |
| Athena-3 | Historial | Privado por usuario + flujo staging / aplicar-modificar-rechazar / enviar-al-doc |
| Athena-4 | Rate limits | Por plan: Free = demo limitada, PRO = alto, MAX = ilimitado. Tabla `athena_usage`. Rate limit técnico 20/min en todos. Modal upgrade al agotar. |
| Athena-5 | Biblioteca | **Sin integración**. Athena usa solo Claude Haiku. Chat Biblioteca = módulo separado futuro. |
| E1 | Ejecución | Sub-bloques 2a → 2b → 2c → 2d encadenados |
| E2 | Agentes | Subagentes habilitados (Bloque 0 permisos aplicado) + Frontend Design skill |
| E3 | Ritmo | Sin deadline. Jornadas + commits por hito. |
| E4 | Protocolo | 7 capas completo por sub-bloque |
| Aislamiento | NO tocar | MiUniversidad, Profile, StudyPaths, StudyRooms, Admin, HR, CEO, auth_routes, server.py, hr_routes, ai_engine, konni_engine. Solo archivos del módulo Workspaces. |

## 3. Features consolidadas (~51)

### CORE (B1)
1. Editor rico estilo Google Docs (Lexical)
2. Colaboración en tiempo real multi-usuario (Yjs)
3. Auto-save + indicador de estado ("Guardado"/"Guardando..."/"Sin guardar")
4. Author colors (paleta 20 colores accesibles, determinístico por user.id)
5. Contribution metrics (% caracteres escritos por autor, barra de progreso)
6. Chat integrado al doc (del grupo, informal)
7. Export PDF/DOCX con SSRF fix (blacklist img http/https/ftp, solo data: permitido)
8. Versiones / historial con restore
9. Miembros + permisos (owner, editor, viewer)
10. Athena AI panel lateral (análisis + chat + sugerencias)
11. Mobile-responsive
12. Accesibilidad WCAG AA

### OPCIONALES (B2 — todas)
13. Comentarios inline (anotar sobre texto seleccionado con thread)
14. Plantillas predefinidas (actas, informes, contratos, apuntes)
15. Carpetas / organización jerárquica
16. Compartir por link público (read-only sin login)
17. Menciones @usuario (notifican al mencionado)
18. Task lists sincronizadas con calendario Conniku
19. Emojis / reacciones inline
20. Dictado por voz (STT — Web Speech API)
21. TTS (leer doc en voz alta — Web Speech API es-CL)
22. Ortografía/gramática (Athena lo cubre; opcional native navegador)
23. Modo enfoque (pantalla limpia, solo doc y toolbar mínima)

### IDEAS ADICIONALES (B3 — todas)
24. Atajos de teclado completos (Linear-style) + overlay `?` de ayuda
25. Modo presentación (doc → slides)
26. Integración con Biblioteca (arrastrar libro/paper → cita automática en formato APA) — **NOTA**: decidido Athena-5 = sin integración. Se mantiene esta feature pero implementada como "arrastrar manual con botón de sugerencia" no como integración Athena en su prompt.
27. Arrastrar archivos (imágenes, PDFs) al doc
28. Collaborative whiteboard al lado del doc
29. Voice notes embebidas
30. Imprimir
31. Duplicar doc
32. Star / favorito
33. Búsqueda global en todos los workspaces del usuario
34. Permisos granulares por sección del doc (owner bloquea secciones)

### APA + tapas + índice
35. APA 7 por defecto (márgenes 2.54cm, interlineado 2.0, sangría 1.27cm, Times New Roman 12pt, encabezados APA, numeración)
36. Sistema extensible a IEEE/Chicago/MLA (arquitectura plug-and-play, no implementados en 2d pero sí el scaffolding)
37. Índice automático (TOC auto-generado desde H1/H2/H3 con links clickables)
38. Tapa personalizable (cover page) editable aparte del cuerpo
39. Plantillas de tapa institucional/estándar + guardables por usuario
40. Figuras y tablas numeradas APA con leyendas automáticas
41. Sistema de citas APA (`(Autor, año)`) y referencias alfabéticas con sangría francesa
42. Validación APA en tiempo real (márgenes, espaciado, formato citas)

### Rúbrica
43. Upload de rúbrica (PDF, DOCX, texto pegado, formulario)
44. Athena parsea rúbrica y genera checklist lateral
45. Evaluación automática de criterios cumplidos/pendientes
46. Alerta al "Declarar doc terminado" si quedan criterios pendientes
47. Athena usa rúbrica como contexto permanente para sus sugerencias

### Compartir URL con invitación
48. Link único por doc con invitación embebida al workspace
49. Al abrir el link: el usuario se une al workspace (rol configurable por owner)

### 3 vías de comunicación
50. Documento público (Yjs, real-time, keystroke-por-keystroke)
51. Borrador privado con Athena (staging local, flujo aplicar/modificar/rechazar/enviar)

### Matemáticas
52. KaTeX para render LaTeX inline `$...$` y block `$$...$$`
53. Editor visual de ecuaciones (MathLive — MIT) con UI de menús (fracciones, raíces, integrales, matrices, griegas, operadores)
54. Paleta de símbolos matemáticos (∑ ∫ √ π ∞ ≤ ≥ ± × ÷ ∂ ∇ etc.)
55. Integración SymPy (backend) para verificación matemática (Athena puede pedir simplify/solve/integrate)
56. Gráficos matemáticos embebidos (matplotlib backend o Plotly client)
57. Fórmulas químicas con subíndices auto (`H_2O`, reacciones `2H_2 + O_2 → 2H_2O`)

### Diálogo de opciones al crear doc
58. Modal al crear doc con checkboxes para activar/desactivar features por doc
59. Owner es el único que configura; otros miembros heredan la config
60. Config cambiable después desde settings del doc

### Suscripciones / planes
61. TierGate integrado (reutilizando sistema existente en `shared/tier-limits.json`)
62. Tabla `athena_usage` para registrar cada acción IA (apply/suggest/analyze/chat)
63. Cupos mensuales por plan (Free/PRO/MAX) evaluados con cron diario
64. Modal "agotaste tu cupo → upgrade" al superar límite
65. Rate limit técnico 20 req/min en todos los tiers

**Total real ~65 features cuando desagrego en componentes atómicos**. El conteo de "~51" era del flujo de preguntas. En implementación son más piezas pequeñas.

## 4. Arquitectura técnica

### Backend

```
backend/
├── workspaces_routes.py         (nuevo - REST endpoints /workspaces/*)
├── workspaces_ws.py             (nuevo - WebSocket relay para Yjs)
├── workspaces_athena.py         (nuevo - endpoint POST /workspaces/{id}/athena con rate limit + usage)
├── workspaces_rubric.py         (nuevo - parser de rúbrica + evaluador de criterios)
├── workspaces_export.py         (nuevo - export PDF/DOCX con SSRF fix)
├── workspaces_math.py           (nuevo - endpoint para validar fórmulas con SymPy)
├── database.py                  (modificado - 8 modelos nuevos)
├── migrations/add_workspaces_*.sql (nuevas migraciones)
├── migrations.py                (modificado - invocar nuevas)
└── tests/test_workspaces_*.py   (tests nuevos)
```

### Frontend

```
src/
├── pages/Workspaces/
│   ├── index.tsx                (página /workspaces - lista)
│   ├── WorkspaceEditor.tsx      (página /workspaces/{id} - editor principal)
│   ├── WorkspaceSettings.tsx    (página /workspaces/{id}/settings)
│   └── __tests__/
├── components/workspaces/
│   ├── Editor/
│   │   ├── LexicalEditor.tsx    (editor principal con Lexical + Yjs)
│   │   ├── Toolbar.tsx          (toolbar flotante + fija)
│   │   ├── MathPlugin.tsx       (KaTeX + MathLive)
│   │   ├── APAPlugin.tsx        (validación APA)
│   │   ├── TOCPlugin.tsx        (índice automático)
│   │   ├── CoverPlugin.tsx      (tapa editable)
│   │   └── nodes/               (custom nodes: Math, Equation, Cover, TOC, Citation, Reference, Figure, Table, Chart)
│   ├── Athena/
│   │   ├── AthenaPanel.tsx      (panel lateral 360px)
│   │   ├── AthenaChat.tsx       (chat privado)
│   │   ├── StagingBuffer.tsx    (borrador privado)
│   │   └── SuggestionCard.tsx   (apply/modify/reject)
│   ├── Chat/
│   │   ├── GroupChat.tsx        (chat del grupo)
│   │   └── MessageList.tsx
│   ├── Rubric/
│   │   ├── RubricUploader.tsx
│   │   └── RubricChecklist.tsx
│   ├── Share/
│   │   ├── InviteDialog.tsx
│   │   └── ShareLinkGenerator.tsx
│   ├── Layout/
│   │   ├── ThreeZoneLayout.tsx  (documento + borrador + chat)
│   │   └── FocusMode.tsx
│   └── authorColors.ts
├── services/
│   ├── workspacesApi.ts         (cliente HTTP)
│   └── yjsProvider.ts           (provider Yjs compartido)
└── __tests__/
```

### Modelos BD nuevos

```python
class WorkspaceDocument(Base):
    __tablename__ = "workspace_documents"
    id = Column(String(16), primary_key=True, default=gen_id)
    title = Column(String(255), nullable=False)
    owner_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    course_name = Column(String(255), nullable=True)
    rubric_raw = Column(Text, nullable=True)  # rúbrica como texto/JSON
    rubric_criteria = Column(Text, nullable=True)  # JSON con criterios parseados
    apa_edition = Column(String(10), default="7")  # 7, 6, ieee, chicago, mla
    options = Column(Text, default="{}")  # JSON con features habilitadas/deshabilitadas por el owner
    cover_data = Column(Text, nullable=True)  # JSON con datos de tapa
    cover_template = Column(String(50), nullable=True)
    content_yjs = Column(Text, nullable=True)  # snapshot Yjs en base64
    is_completed = Column(Boolean, default=False)
    share_link_token = Column(String(32), unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class WorkspaceMember(Base):
    __tablename__ = "workspace_members"
    id = Column(String(16), primary_key=True, default=gen_id)
    workspace_id = Column(String(16), ForeignKey("workspace_documents.id"), nullable=False)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    role = Column(String(20), default="viewer")  # owner, editor, viewer
    chars_contributed = Column(Integer, default=0)
    invited_at = Column(DateTime, default=datetime.utcnow)
    joined_at = Column(DateTime, nullable=True)

class WorkspaceVersion(Base):
    __tablename__ = "workspace_versions"
    id = Column(String(16), primary_key=True, default=gen_id)
    workspace_id = Column(String(16), ForeignKey("workspace_documents.id"), nullable=False)
    content_yjs = Column(Text, nullable=False)
    created_by = Column(String(16), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    label = Column(String(100), nullable=True)

class WorkspaceMessage(Base):
    """Chat del grupo (no Athena) — entre miembros, privado al workspace."""
    __tablename__ = "workspace_messages"
    id = Column(String(16), primary_key=True, default=gen_id)
    workspace_id = Column(String(16), ForeignKey("workspace_documents.id"), nullable=False)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class WorkspaceAthenaChat(Base):
    """Historial de chat con Athena, privado por usuario."""
    __tablename__ = "workspace_athena_chats"
    id = Column(Integer, primary_key=True, autoincrement=True)
    workspace_id = Column(String(16), ForeignKey("workspace_documents.id"), nullable=False)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    role = Column(String(20), nullable=False)  # 'user' or 'athena'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class WorkspaceAthenaSuggestion(Base):
    """Sugerencias de Athena sobre staging del usuario, con estado apply/modify/reject."""
    __tablename__ = "workspace_athena_suggestions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    workspace_id = Column(String(16), ForeignKey("workspace_documents.id"), nullable=False)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    staging_content = Column(Text, nullable=False)  # lo que el usuario escribió
    suggestion_content = Column(Text, nullable=False)  # lo que Athena propuso
    status = Column(String(20), default="pending")  # pending, applied, modified, rejected
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

class WorkspaceComment(Base):
    __tablename__ = "workspace_comments"
    id = Column(String(16), primary_key=True, default=gen_id)
    workspace_id = Column(String(16), ForeignKey("workspace_documents.id"), nullable=False)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    anchor_json = Column(Text, nullable=False)  # posición en el doc (nodeKey, offset, selection)
    content = Column(Text, nullable=False)
    resolved = Column(Boolean, default=False)
    parent_id = Column(String(16), ForeignKey("workspace_comments.id"), nullable=True)  # para threads
    created_at = Column(DateTime, default=datetime.utcnow)

class AthenaUsage(Base):
    """Métricas de uso para aplicar límites por plan."""
    __tablename__ = "athena_usage"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    workspace_id = Column(String(16), ForeignKey("workspace_documents.id"), nullable=True)
    action = Column(String(20), nullable=False)  # analyze, chat, apply, suggest
    tokens_input = Column(Integer, default=0)
    tokens_output = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    __table_args__ = (
        Index("ix_athena_usage_user_month", "user_id", "created_at"),
    )
```

## 5. Sub-bloques

### 2a — Fundación
- Modelos BD (8 nuevos)
- Migraciones SQL idempotentes
- Rutas base REST (`/workspaces` CRUD, miembros, versiones básicas)
- Editor Lexical mínimo (sin Yjs aún, sin Athena, sin features avanzadas)
- Layout 3 zonas scaffolding (documento central + placeholders para borrador y chat)
- Routing `/workspaces` y `/workspaces/{id}` en App.tsx
- Sidebar integration (link "Workspaces", V1 oculto)
- Tests básicos: models, endpoints CRUD, routing

### 2b — Colaboración real-time + chat grupal
- Yjs + `@lexical/yjs` binding
- WebSocket relay backend (`workspaces_ws.py`)
- Auto-save cada 2s con indicador
- Author colors con paleta determinística
- Contribution metrics + UI sidebar
- Chat del grupo (backend + frontend)
- CursoresPresencia (Lexical tiene su propio cursor plugin)
- Tests: concurrent edits, WS reconnection, chat delivery

### 2c — Athena IA
- Backend: prompt literal del doc Konni
- Endpoint `POST /workspaces/{id}/athena` (analyze + chat + suggest + apply)
- Tabla `athena_usage` + rate limiting por plan
- Tabla `workspace_athena_chats` historial privado
- Tabla `workspace_athena_suggestions` estado apply/modify/reject
- Frontend: panel Athena 360px
- Staging privado del usuario (localStorage + sync opcional)
- Flujo Apply/Modify/Reject
- "Enviar a documento"
- Integración con TierGate para límites
- Modal upgrade al agotar cupo
- Tests: rate limits, usage accounting, flujo completo

### 2d — Features avanzadas + APA + rúbrica + math + diseño final + tests e2e
- APA 7 completo (validación, formateo, citas, referencias, figuras, tablas)
- Sistema extensible para IEEE/Chicago/MLA (arquitectura)
- Índice automático (TOC plugin)
- Tapa personalizable (Cover plugin + plantillas)
- Matemáticas (KaTeX + MathLive + SymPy backend + gráficos)
- Rúbrica (upload + parser + checklist)
- Compartir URL con invitación
- Comentarios inline
- Plantillas de documento
- Export PDF/DOCX con SSRF fix
- Modo enfoque
- Atajos de teclado completos + overlay `?` ayuda
- Modo presentación
- Dictado por voz (STT)
- TTS
- Arrastrar archivos
- Voice notes
- Imprimir / Duplicar / Star / Búsqueda global
- Diseño final con mockups de Frontend Design skill
- Tests e2e del flujo completo

## 6. Protocolo por sub-bloque

Cada sub-bloque pasa 7 capas:

| Capa | Quién | Qué |
|---|---|---|
| 0 | web-architect (subagente ya habilitado) | Plan detallado del sub-bloque |
| 1 | backend-builder + frontend-builder en paralelo | TDD RED→GREEN→REFACTOR |
| 2 | code-reviewer | Revisión adversarial diff, quality score |
| 3 | truth-auditor | Cruce reportes vs realidad, quality score |
| 4 | merge a rama `bloque-2{a/b/c/d}-*` + Vercel preview auto | Preview vivo |
| 5 | gap-finder | Auditoría estructural del sub-bloque |
| 6 | **Cristian al despertar** | Inspección en preview, OK/correcciones |
| 7 | merge a main | BLOCKS.md + FROZEN.md + snapshot |

**Nota nocturna**: Tori ejecuta Capas 0-5 de cada sub-bloque. Las Capas 6 y 7 esperan a Cristian. Si todos los sub-bloques cierran Capa 5, hay 4 PRs abiertos para revisión al despertar.

## 7. Snapshot al cerrar cada sub-bloque

Por política acordada, cada cierre Capa 5 del sub-bloque genera:
- `docs/sessions/2026-04-18-XXX-snapshot-bloque-2{a/b/c/d}.md`
- Entrada en `docs/pendientes.md` si hay deuda
- Actualización de `docs/sessions/2026-04-18-avance-nocturno.md` (reporte en vivo)

## 8. Aislamiento estricto (archivos que NO se tocan)

- Cualquier archivo de MiUniversidad, Profile, UserProfile, StudyPaths, StudyRooms
- Dashboard, Friends, Communities, Messages, Mentorship, Conferences, Jobs
- `src/admin/**`, páginas Admin/HR/CEO
- `backend/auth_routes.py`, `backend/server.py`, `backend/hr_routes.py`
- `backend/ai_engine.py`, `backend/konni_engine.py` (reutilizar `call_konni` pero NO modificar)
- `src/admin/shared/ChileLaborConstants.ts`, `src/admin/shared/accountingData.ts`
- CLAUDE.md (regla acordada: no modificar instrucciones)
- `backend/collab_*.py` y `src/pages/GroupDocs.tsx`, `src/pages/GroupDocEditor.tsx`, `src/components/CollabEditor.tsx` (V1 escondido pero intacto)

## 9. Archivos donde sí se opera (lista blanca)

Backend:
- `backend/workspaces_routes.py` (nuevo)
- `backend/workspaces_ws.py` (nuevo)
- `backend/workspaces_athena.py` (nuevo)
- `backend/workspaces_rubric.py` (nuevo)
- `backend/workspaces_export.py` (nuevo)
- `backend/workspaces_math.py` (nuevo)
- `backend/database.py` (modificar: agregar los 8 modelos nuevos al final)
- `backend/migrations/add_workspaces_*.sql` (nuevos)
- `backend/migrations.py` (modificar: invocar migraciones nuevas en boot)
- `backend/server.py` — **PROHIBIDO modificar**. Si es estrictamente necesario registrar el router nuevo, se hace con `include_router` en una línea. Si requiere más cambios, PAUSA y se pide autorización.
- `backend/tests/test_workspaces_*.py` (nuevos)

Frontend:
- `src/pages/Workspaces/` (directorio nuevo)
- `src/components/workspaces/` (directorio nuevo)
- `src/services/workspacesApi.ts` (nuevo)
- `src/services/yjsProvider.ts` (nuevo, compartible)
- `src/App.tsx` — **modificar mínimamente**: agregar ruta `/workspaces` y `/workspaces/:id`. Si esto requiere más de 10 líneas o toca lógica compleja, PAUSA.
- `src/components/Sidebar.tsx` — **modificar mínimamente**: agregar link "Workspaces", ocultar link V1. Si requiere más de 10 líneas, PAUSA.
- `package.json` (si requiere agregar deps: lexical, mathlive, etc. — requiere `/unfreeze` ya autorizado al inicio del bloque)
- `src/__tests__/workspaces/` (nuevos)

Shared:
- `shared/workspaces-types.ts` (si fuera necesario para shared types backend/frontend)

## 10. Protocolo ante bloqueos

Si Tori encuentra durante la noche:
- **Archivo FROZEN no autorizado**: pausa hilo, nota en reporte nocturno, continúa otros hilos
- **Dependencia nueva no contemplada** (ej: Lexical requiere peer dep que colisiona): pausa hilo, nota, busca alternativa o documenta workaround
- **Error de subagente en background**: reintenta 1 vez, si falla ejecuta el paso en modo directo (Tori desde sesión principal)
- **Vercel preview rompe**: guarda log, continúa. El preview se arregla al despertar.
- **Test flakey**: marca como "skipped pero no bloqueante", documenta en snapshot
- **Commit bloqueado por pre-commit hook (lint/frozen/sintaxis)**: lee el error, arregla, reintenta. Si es hook de frozen sobre archivo que NO está en lista blanca (imprevisto): pausa.

## 11. Métricas de éxito nocturno

Mínimo aceptable cuando Cristian despierte:
- ✓ Plan maestro escrito y commiteado
- ✓ Plan 2a detallado escrito y commiteado
- ✓ Mockups HTML de pantallas principales generados por Frontend Design
- ✓ Modelos BD del 2a implementados y testeados
- ✓ Rutas base del 2a funcionales

Ideal:
- ✓✓ 2a completo cerrado Capa 5, PR abierto
- ✓✓ 2b iniciado con plan + modelos Yjs

Ambicioso:
- ✓✓✓ 2a + 2b + 2c cerrados Capa 5, 3 PRs abiertos
- ✓✓✓ Solo falta 2d para inspección

Realista: probablemente entre "mínimo" e "ideal". 2d completo es improbable en una noche.

---

**Siguiente paso**: arrancar 2a con plan detallado + mockups Frontend Design + implementación paralela backend+frontend con subagentes.
