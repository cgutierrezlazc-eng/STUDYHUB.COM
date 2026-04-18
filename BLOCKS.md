# BLOCKS - Registro histórico de bloques cerrados

> **Definición de bloque:** unidad autocontenida de funcionalidad del proyecto
> que completó las 7 capas del protocolo de cierre definido en CLAUDE.md
> Sección 18. Un bloque cerrado está en producción, verificado por todos los
> agentes, inspeccionado personalmente por Cristian en la web online, y sus
> archivos principales están protegidos en FROZEN.md.

## Principios

- **Un bloque cerrado no se reabre por modificaciones normales.** Sus
  archivos están protegidos en FROZEN.md. Para modificar, se requiere
  /unfreeze con razón justificada.
- **Cada bloque tiene un solo responsable final: Cristian.** Ningún bloque
  se cierra sin su OK explícito después de inspeccionar en la web online.
- **Este archivo se actualiza automáticamente por `/cerrar-bloque`.** No
  editar manualmente. Si necesitas hacer ajustes, usa `/unfreeze` primero
  y después actualiza este archivo a través del comando apropiado.

## Formato de entrada

Cada bloque cerrado tiene una fila con:

| Bloque | Fecha cierre | Iteraciones | Archivos principales | Notas |

Donde:

- **Bloque**: nombre corto en kebab-case (ejemplo: `dashboard-profesor`)
- **Fecha cierre**: YYYY-MM-DD del día que se ejecutó Capa 7
- **Iteraciones**: cuántas veces cicló Capa 6 antes del OK final de Cristian
- **Archivos principales**: lista resumida de archivos del bloque
- **Notas**: información relevante (feature principal, dependencias, etc.)

## Bloques cerrados

| Bloque | Fecha cierre | Iteraciones | Archivos principales | Notas |
|--------|--------------|-------------|----------------------|-------|
| `bloque-1-auth-edad` | 2026-04-18 | 1 | `shared/legal_texts.{py,ts}`, `scripts/verify-legal-texts-sync.sh`, `backend/database.py` (UserAgreement), `backend/migrations/add_user_agreements_table.sql`, `backend/auth_routes.py` (helpers + integración register + google), `backend/server.py:1078` (fix política 18+), `src/pages/Register.tsx` (checkbox 5 puntos), `src/services/auth.tsx` (payload legal + handler OAuth 403), `vite.config.ts`/`vitest.config.ts`/`tsconfig.json` (alias shared), `.github/workflows/verify-build.yml` (steps vitest + legal-sync), `CLAUDE.md` §19.1 fix, `.gitignore`, `src/admin/shared/accountingData.ts:173` | Primer bloque del protocolo 7 capas. Componente legal (CLAUDE.md §Verificación de edad). 24/24 tests verdes (16 backend + 8 frontend). CI gate de sincronía hash Python↔TS. Cerrado en 1 iteración (OK de Cristian sin correcciones). PR #4 mergeado a main con 7 commits. Deuda documentada: `GoogleAgeDeclarationModal` frontend reemplazará el alert temporal en bloque futuro bloque-1-iter-2. |

## Historial de intentos de cierre fallidos

Cuando un intento de cierre falla en alguna capa, también queda registro
para aprendizaje futuro. Los intentos fallidos no bloquean futuros
intentos del mismo bloque.

| Bloque | Fecha intento | Capa que falló | Razón del fallo | Resuelto en |
|--------|---------------|----------------|-----------------|-------------|

_(Ningún intento fallido todavía.)_

## Estadísticas del proyecto

Actualizadas cada vez que se cierra un bloque:

- **Total de bloques cerrados:** 1
- **Promedio de iteraciones por bloque:** 1
- **Tiempo promedio de cierre (desde inicio hasta OK):** <24h (bloque-1 inaugural, 2026-04-17 a 2026-04-18)
- **Bloques con componente legal:** 1
- **Últimos 3 bloques cerrados:**
  - `bloque-1-auth-edad` (2026-04-18)

## Cómo consultar este archivo

- **Vista rápida:** `cat BLOCKS.md | head -50` para ver la cabecera y
  primeros bloques
- **Vista específica:** `grep "nombre-bloque" BLOCKS.md` para buscar un
  bloque específico
- **Desde Claude Code:** usar `/menu historial-bloques` (si existe esa
  opción en el menú)

## Relación con otros archivos

- **FROZEN.md:** cuando un bloque cierra, sus archivos se agregan aquí
  para protección. Cada entrada en BLOCKS.md tiene varias entradas
  correspondientes en FROZEN.md.
- **docs/inspecciones/*.md:** las iteraciones de Capa 6 quedan
  documentadas en `docs/inspecciones/{bloque}-iter-{N}.md` con lo que
  Cristian encontró y qué se corrigió.
- **registry_issues.md:** si algún bloque resolvió issues del registro,
  queda referencia cruzada aquí.
