# Avance nocturno — Bloque 2 Workspaces

**Fecha inicio**: 2026-04-18 ~05:00 CLT
**Autor**: Tori (trabajando en autónomo mientras Cristian duerme)
**Autorización**: Cristian 2026-04-18 "autorizado para comenzar... cuando termines bloque 2a, comienza en automático con 2b... reporte al regreso"

## Restricciones autoimpuestas

- **NO mergeo a main** sin inspección de Cristian (Capa 6).
- Cada sub-bloque termina en su rama con PR abierto listo para revisión humana.
- Si aparece decisión fuera del scope de las 21 respuestas previas de Cristian → **pauso y dejo nota**, no asumo.
- Si se toca un archivo FROZEN sin autorización previa → **pauso y dejo nota**.
- Commits atómicos. Snapshots al cierre de cada sub-bloque.

## Progreso en vivo

(Este archivo se actualiza durante la noche. Cristian lo lee al volver.)

### 2026-04-18 05:00 — INICIO
- Cristian autorizó trabajo nocturno.
- 21 decisiones consolidadas del flujo de preguntas completo.
- Subagentes habilitados (permisos ajustados en Bloque 0).
- Arranco escribiendo plan maestro.

### 2026-04-18 ~05:30 — UPDATE

**Progreso**:
- ✅ Plan maestro Bloque 2 escrito (`docs/plans/bloque-2-workspaces/plan-maestro.md`, 477 líneas, commiteado `a98368f`)
- ✅ Plan detallado 2a Fundación escrito por web-architect subagente (`docs/plans/bloque-2-workspaces/2a-fundacion.md`)
- ✅ Mockups HTML en curso: index + 01-lista + 02-editor-principal + 03-crear-documento + 04-tapa-editable escritos
- ⏳ Mockups pendientes: 05-athena-panel, 06-modo-enfoque, 07-vista-mobile, 08-compartir-dialog

**Hallazgo crítico del web-architect**:
- `backend/migrations/*.sql` son DOCUMENTACIÓN HISTÓRICA, no se invocan desde `migrations.py`
- Patrón real = DDL Python inline con `inspector.has_table + engine.begin()`
- Los builders deben usar Python inline, no SQL archivos. Mantendremos archivos .sql como espejo de trazabilidad.

**Unfreeze aplicado**:
- `/unfreeze package.json temp` activado con razón documentada en `.claude/UNFREEZE_ACTIVE`
- Justificación: Cristian autorizó Bloque 2 completo, Lexical es dependencia obligatoria del editor (decisión D1 consolidada)
- Se revierte al cierre de sesión

**Bloqueadores pendientes** (no críticos):
- Ninguno por ahora

### 2026-04-18 ~06:15 — UPDATE

**Mockups**: 9/9 completos (index + 01-08).
- 01 lista de workspaces · grid de docs + sidebar + favoritos + filtros
- 02 editor principal 3 zonas · documento + Athena staging + TOC + rúbrica + chat fab
- 03 crear documento · diálogo con título, APA, template, rúbrica, features
- 04 tapa editable · 7 plantillas institucionales + editor visual + campos + save template
- 05 panel Athena detallado · análisis 3 secciones + usage meter + rate banner + chat
- 06 modo enfoque · typewriter mode + mini toolbar + word counter + quote
- 07 vista mobile · 2 phones (lista + editor con Athena bottom sheet)
- 08 compartir dialog · personas + enlace público + invitaciones + social share

**Ubicación**: `docs/plans/bloque-2-workspaces/mockups/*.html`
**Revisable al despertar**: abrir `index.html` en navegador → navegación entre los 8.

**Builders backend + frontend**: corriendo en background (agentId backend: aa556adb... , frontend: ac7e5e55...)
