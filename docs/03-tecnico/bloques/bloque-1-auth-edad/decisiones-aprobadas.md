# Decisiones aprobadas — Bloque 1 auth + edad

Fecha: 2026-04-17
Aprobado por: Cristian Gutiérrez Lazcano

Respuesta a las 4 decisiones planteadas por el web-architect en `plan.md`:

| # | Tema | Decisión | Implicación |
|---|------|----------|-------------|
| 1 | Google OAuth dentro del bloque | **A** | Incluir gate edad + checkbox declarativo post-Google OAuth. Bloque más grande pero sin grieta 18+ |
| 2 | Frameworks de test | **A** | Instalar pytest (backend) + vitest (frontend) dentro de este bloque. Requiere `/unfreeze package.json` autorizado explícitamente |
| 3 | Retrocompatibilidad usuarios existentes | **A** | Migración retroactiva con `document_type='age_declaration_legacy'` + hash `legacy_no_hash_available`. Evidencia débil documentada |
| 4 | Sincronía texto legal frontend ↔ backend | **B** | Archivo compartido `shared/legal_texts.ts` + constante Python espejo + test CI que valida hash cruzado |

## Consecuencias

- Bloque requiere tocar `package.json` (FROZEN desde 2026-04-14). `/unfreeze package.json` autorizado por Cristian antes de Capa 1.
- Bloque incluye 2 sub-flujos de registro: email+password (Register.tsx) y Google OAuth (modal de declaración post-OAuth).
- Tipo de commit final: `legal:` (no `feat:`).
- Aprobación humana obligatoria en Capa 6 (componente legal).
- Si tras la ejecución el bloque resulta imposible de cerrar en una iteración razonable, se divide en Bloque 1 (email+password) y Bloque 1.5 (Google OAuth) sin renegociar las demás decisiones.

## Validación de scope

- Fuera de scope confirmado: T&C v3.0, Privacy v3.0, detección posterior + eliminación 72h, retracto corridos/hábiles, `accountingData.ts:173`, `server.py:1088` "inteligencia artificial".
- Dentro de scope: corregir `server.py:1078` (quitar excepción representante legal).
