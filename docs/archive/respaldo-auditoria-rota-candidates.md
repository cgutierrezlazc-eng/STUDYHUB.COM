# Rama `respaldo-auditoria-rota` — candidatos para migración selectiva

**Decisión de Cristian (2026-04-18)**: archivar la rama sin tocar. Presentarla como **pendiente** cuando Cristian pida "pendientes" o cuando toquemos alguna área relacionada.

**Advertencia crítica**: esta rama tiene **275 archivos cambiados, +13.837 / -68.420 líneas**. La mayor parte es eliminación masiva de páginas que actualmente viven en main. **Merge directo DESTRUIRÍA páginas activas.**

## Estado de la rama

- Nombre: `respaldo-auditoria-rota`
- Commits únicos vs main: 10+
- Existe como rama local y remota en origin.
- **NO borrar** — es respaldo de código potencialmente valioso pre-reset del 2026-04-17.

## Página afectadas si se mergea

Estas páginas actualmente viven en main pero la rama las elimina:

| Archivo | Líneas eliminadas en la rama |
|---|---|
| `src/pages/MiUniversidad.tsx` | -5039 |
| `src/pages/Profile.tsx` | -4031 |
| `src/pages/StudyPaths.tsx` | -1520 |
| `src/pages/StudyRooms.tsx` | -1169 |
| `src/pages/SupportPage.tsx` | -1064 |

## Commits con valor potencial (extractables con cherry-pick o como referencia)

### Alta prioridad (valor directo, verificar si ya está aplicado)

| Hash | Título | Cuándo revisar |
|---|---|---|
| `1695426` | fix: optimize social feed endpoints — batch queries eliminate N+1 problem | Bloque futuro de **social** o **performance** |
| `4d6a8ac` | feat(security): Sprint 1 — rate limiting IA, guest mode, body size limit | Bloque futuro de **seguridad** |
| `d0a2a89` | fix(security): restrict admin modules to authorized roles only | Bloque futuro de **admin** / **hardening roles** |
| `6cfe2bb` | fix(biblioteca): documentos no cargaban después de cache expire o restart (5 adapters implementan get_document) | Bloque futuro de **biblioteca** |
| `b3a6d33` | fix: 7 reparaciones auditoría + btn:disabled global (UserProfile fixes, Privacy toggles, theme persist, password min length) | Bloque futuro de **perfil** o **settings** |

### Media prioridad (fixes pequeños, verificar si aplica)

| Hash | Título | Cuándo revisar |
|---|---|---|
| `c5690cd` | fix: show login button on mobile landing page | Bloque futuro de **landing / responsive** |
| `542d4be` | fix: auto-recovery para chunks stale post-deploy (Biblioteca crash) | Bloque futuro de **PWA / service worker** |
| `945d6ea` | fix(deps): upgrade tiptap collaboration-cursor v2→v3 | Verificar en `package.json` actual si ya está. Bloque futuro de **colaboración / Tiptap** |
| `e68971c` | docs: registro completo de errores de auditoría para reparación | Bloque de **arqueología / documentación histórica** |

### ⚠ NO aplicar (destructivos para estado actual)

| Hash | Título | Razón |
|---|---|---|
| `d0c0e49` | feat: Athena AI + Landing v2 + TTS + Sala de Estudio + limpieza módulos (**+1400/-5529**) | Elimina MiUniversidad, Profile, StudyPaths, StudyRooms que hoy existen en main |
| `36468e2` | feat: rediseño editor Trabajos Grupales estilo Google Docs | Verificar, pero probablemente incompatible con el editor Yjs/Tiptap actual |
| `9bab5b3` | fix: remover CollaborationCursor incompatible | Ya resuelto post-reset probablemente |

## Instrucciones para el futuro Tori

Cuando Cristian pida "pendientes" o toquemos uno de los bloques futuros listados arriba:

1. Leer este archivo.
2. Identificar los commits candidatos relevantes al bloque en curso.
3. Por cada candidato: `git show <hash>` para inspeccionar el diff.
4. Verificar si el cambio sigue siendo aplicable al estado actual de main.
5. Cherry-pick selectivo: `git cherry-pick <hash>`. Resolver conflicts como parte del bloque formal.
6. Si el diff ya está aplicado en main (evolución posterior), marcar en este archivo como "ya resuelto" y no aplicar.

## Cuándo eliminar esta rama

Cuando todos los commits relevantes hayan sido cherry-pickeados o descartados explícitamente, Cristian puede autorizar borrar la rama. Hasta entonces **NO tocar**.

---

**Última revisión**: 2026-04-18 por Tori. Ningún cherry-pick aplicado todavía.
