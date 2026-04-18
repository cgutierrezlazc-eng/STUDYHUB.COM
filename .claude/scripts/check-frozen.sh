#!/bin/bash
#
# Hook: PreToolUse (Edit, Write, MultiEdit)
# Propósito: Bloquear edición de archivos listados en .claude/frozen-files.txt
#            salvo que exista el flag .claude/UNFREEZE_ACTIVE
#
# Exit codes:
#   0 = permitir acción
#   2 = bloquear acción (comportamiento esperado para archivos frozen)
#
# Formato de .claude/frozen-files.txt:
#   Una ruta relativa por línea, relativa al root del repo.
#   Líneas que empiezan con # son comentarios y se ignoran.
#   Líneas vacías se ignoran.
#   Soporta globs básicos con * y ?
#
# Generado automáticamente por regen-frozen-list.sh desde FROZEN.md
# No editar .claude/frozen-files.txt directamente. Editar FROZEN.md.
#
# Versión 2.1 (2026-04-17):
#   - Agregado soporte case-insensitive para macOS (filesystem HFS+/APFS
#     puede reportar nombres con diferente capitalización que git).
#   - Normalización robusta de rutas relativas.

set -euo pipefail

# Activar matching case-insensitive para proteger contra diferencias
# de mayúsculas/minúsculas en nombres de ruta (típico de macOS).
shopt -s nocasematch 2>/dev/null || true

# Leer input JSON desde stdin (formato estándar de hooks de Claude Code)
INPUT=$(cat)

# Extraer el file_path del JSON
FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('file_path', ''))
except:
    print('')
" 2>/dev/null)

# Si no hay file_path, no aplica este hook, permitir
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Obtener root del repo
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$REPO_ROOT" ]; then
  # No estamos en un repo git, no aplicar hook
  exit 0
fi

FROZEN_LIST="$REPO_ROOT/.claude/frozen-files.txt"
UNFREEZE_FLAG="$REPO_ROOT/.claude/UNFREEZE_ACTIVE"

# Si no existe la lista, no hay nada que bloquear
if [ ! -f "$FROZEN_LIST" ]; then
  exit 0
fi

# Si existe flag de unfreeze, permitir todo
if [ -f "$UNFREEZE_FLAG" ]; then
  exit 0
fi

# Normalizar ruta del archivo a ruta relativa al repo.
# Usamos sustitución case-insensitive con Python para manejar
# diferencias de mayúsculas/minúsculas en el filesystem de macOS.
RELATIVE_PATH=$(python3 -c "
import sys, os
file_path = '''$FILE_PATH'''
repo_root = '''$REPO_ROOT'''
# Normalizar ambos a minúsculas para comparar
file_lower = file_path.lower()
repo_lower = repo_root.lower()
if file_lower.startswith(repo_lower + '/'):
    # Extraer la parte relativa preservando el case original del file_path
    relative = file_path[len(repo_root) + 1:]
    print(relative)
elif file_lower.startswith(repo_lower):
    relative = file_path[len(repo_root):].lstrip('/')
    print(relative)
else:
    # No está dentro del repo, imprimir la ruta original
    print(file_path)
" 2>/dev/null)

# Si por alguna razón falló, usar el path original
if [ -z "$RELATIVE_PATH" ]; then
  RELATIVE_PATH="$FILE_PATH"
fi

# Leer frozen-files.txt línea por línea y chequear match
while IFS= read -r pattern || [ -n "$pattern" ]; do
  # Saltar comentarios y líneas vacías
  [ -z "$pattern" ] && continue
  [[ "$pattern" =~ ^[[:space:]]*# ]] && continue

  # Limpiar espacios
  pattern=$(echo "$pattern" | xargs)

  # Comparación: match exacto o glob (case-insensitive por nocasematch)
  case "$RELATIVE_PATH" in
    $pattern)
      echo "" >&2
      echo "BLOQUEADO: '$RELATIVE_PATH' está en .claude/frozen-files.txt" >&2
      echo "" >&2
      echo "Razón: archivo confirmado como funcional por Cristian, no modificable sin autorización." >&2
      echo "" >&2
      echo "Opciones:" >&2
      echo "  1. Pedir autorización a Cristian" >&2
      echo "  2. Usar slash-command /unfreeze para activar flag UNFREEZE_ACTIVE" >&2
      echo "  3. Revisar FROZEN.md para ver por qué fue congelado y cuándo" >&2
      echo "" >&2
      exit 2
      ;;
  esac
done < "$FROZEN_LIST"

# No hay match, permitir
exit 0
