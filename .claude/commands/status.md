---
description: Muestra estado completo del proyecto Conniku en un reporte estructurado. Git, agentes, hooks, archivos protegidos, salud del sistema.
allowed-tools: Read, Grep, Glob, Bash
---

Ejecuta un chequeo rápido de estado del proyecto Conniku. No modifica
nada, solo reporta. Útil para orientarse al inicio de una sesión o
antes de decidir qué tarea emprender.

## Secciones del reporte

El reporte tiene 5 secciones fijas. Cada una se ejecuta con comandos
específicos y se presenta con formato consistente.

### Sección 1: Estado de git

Ejecutar:
```
git status --short
git log --oneline -5
git branch --show-current
```

Reportar:
- Rama actual
- Últimos 5 commits (hash corto + mensaje)
- Archivos modificados sin commitear (conteo + lista resumida si son
  pocos, solo conteo si son muchos)
- Archivos untracked (conteo)
- Indicar si hay divergencia con main (si la rama actual no es main)

### Sección 2: Sistema de agentes

Ejecutar:
```
ls .claude/agents/*.md 2>/dev/null | wc -l
ls .claude/agents/
```

Reportar:
- Cantidad total de agentes instalados
- Lista de agentes por nombre (sin el sufijo .md)
- Si hay menos de 8, alerta de sistema incompleto

### Sección 3: Capa mecánica

Ejecutar:
```
ls .claude/scripts/*.sh 2>/dev/null | wc -l
ls .claude/scripts/
cat .claude/settings.json | python3 -c "import sys, json; d=json.load(sys.stdin); print('hooks:', list(d.get('hooks', {}).keys()))"
```

Reportar:
- Cantidad de scripts en .claude/scripts/
- Lista de scripts
- Tipos de hook activos en settings.json (SessionStart, SessionEnd,
  PreToolUse, PostToolUse)
- Estado del lock de sesión: si existe .claude/session.lock, mostrar
  PID, usuario, antigüedad

### Sección 4: Archivos protegidos

Ejecutar:
```
# Contar archivos frozen
if [ -f .claude/frozen-files.txt ]; then
  grep -v '^#' .claude/frozen-files.txt | grep -v '^$' | wc -l
fi

# Verificar si UNFREEZE_ACTIVE está activo
if [ -f .claude/UNFREEZE_ACTIVE ]; then
  echo "UNFREEZE_ACTIVE: SÍ activo"
else
  echo "UNFREEZE_ACTIVE: no"
fi

# Fecha de última regeneración
ls -la .claude/frozen-files.txt 2>/dev/null | awk '{print $6, $7, $8}'
```

Reportar:
- Cantidad de archivos protegidos en .claude/frozen-files.txt
- Estado del flag UNFREEZE_ACTIVE (activo o no)
- Si está activo, advertir que protección está desactivada
- Última fecha de regeneración de frozen-files.txt

### Sección 5: Salud del sistema

Ejecutar validaciones rápidas sin bloquear:

```
# TypeScript disponible
command -v npx && npx tsc --version 2>&1 | head -1

# Ruff disponible
command -v ruff && ruff --version

# Mypy disponible
command -v mypy && mypy --version

# Git limpio
git config user.name && git config user.email

# Hooks pre-commit de Husky
ls -la .husky/pre-commit 2>/dev/null
```

Reportar:
- Herramientas disponibles con sus versiones
- Herramientas faltantes (warning si alguna crítica falta)
- Identidad de git configurada
- Pre-commit de Husky instalado o no

## Formato del reporte final

Presentar en bloque estructurado con encabezados claros. Ejemplo:

```
ESTADO CONNIKU - 2026-04-17 08:30
===================================

GIT:
  Rama: reset-agents-system
  Último commit: feeea07 fase 2 limpieza
  Cambios pendientes: 2 archivos
  Untracked: 1 archivo

AGENTES: 8 instalados
  backend-builder, code-reviewer, frontend-builder, gap-finder,
  legal-docs-keeper, qa-tester, truth-auditor, web-architect

CAPA MECÁNICA: 5 scripts activos
  check-frozen, check-lock, post-edit-verify, regen-frozen-list,
  session-cleanup
  Hooks activos: SessionStart, SessionEnd, PreToolUse, PostToolUse
  Lock de sesión: activo (PID 12345, usuario cristiang., 15 min)

ARCHIVOS PROTEGIDOS: 15
  UNFREEZE_ACTIVE: no
  Última regeneración: Apr 17 04:19

SALUD DEL SISTEMA:
  TypeScript: 5.3.3
  Ruff: 0.4.0 (PATH: ~/.local/bin)
  Mypy: 1.8.0
  Git identity: Cristian Gutierrez <cgutierrezlazc@gmail.com>
  Husky pre-commit: instalado

ESTADO GENERAL: OK
===================================
```

## Interpretación

- **Estado general OK**: todo funciona, puedes emprender tareas con
  confianza.
- **Advertencias en alguna sección**: revisar la sección específica.
  Advertencias comunes: UNFREEZE_ACTIVE activo (archivos
  desprotegidos), lock stale (sesión anterior no cerró limpiamente),
  herramienta faltante.
- **Error en alguna sección**: problema estructural. Puede requerir
  diagnóstico antes de seguir trabajando.
