#!/bin/bash
#
# Hook: PostToolUse (Edit, Write, MultiEdit)
# Propósito: Verificar lint y typecheck del archivo editado inmediatamente
#            después de la edición. Bloquea siguiente acción si falla.
#
# Exit codes:
#   0 = verificación OK, permitir continuar
#   2 = verificación falló, bloquear siguiente acción
#
# Alcance: solo el archivo editado, no todo el proyecto. La verificación
# completa se ejecuta al final de la tarea por el builder.

set -euo pipefail

# Leer input JSON desde stdin
INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('file_path', ''))
except:
    print('')
" 2>/dev/null)

# Si no hay file_path, no aplica, permitir
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$REPO_ROOT" ]; then
  exit 0
fi

cd "$REPO_ROOT"

# Función para reportar error y bloquear
report_error() {
  local kind="$1"
  local output="$2"
  echo "" >&2
  echo "VERIFICACIÓN FALLÓ ($kind) en $FILE_PATH" >&2
  echo "" >&2
  echo "$output" >&2
  echo "" >&2
  echo "Corrige el error antes de continuar. Verificación completa:" >&2
  case "$kind" in
    typescript) echo "  npx tsc --noEmit" >&2 ;;
    eslint)     echo "  npx eslint '$FILE_PATH'" >&2 ;;
    ruff)       echo "  ruff check '$FILE_PATH'" >&2 ;;
    mypy)       echo "  mypy '$FILE_PATH'" >&2 ;;
  esac
  echo "" >&2
  exit 2
}

# Determinar tipo de archivo y verificar apropiadamente
case "$FILE_PATH" in

  *.ts|*.tsx)
    # TypeScript: typecheck completo + eslint del archivo
    # Typecheck completo porque .ts/.tsx pueden afectar tipos en otros archivos

    TSC_OUTPUT=$(npx tsc --noEmit 2>&1) || {
      # Filtrar solo errores relacionados al archivo editado
      RELATED_ERRORS=$(echo "$TSC_OUTPUT" | grep -E "$(basename $FILE_PATH)" || true)
      if [ -n "$RELATED_ERRORS" ]; then
        report_error "typescript" "$RELATED_ERRORS"
      fi
      # Si hay errores pero no en este archivo, son preexistentes, no bloquear
    }

    ESLINT_OUTPUT=$(npx eslint "$FILE_PATH" 2>&1) || {
      report_error "eslint" "$ESLINT_OUTPUT"
    }
    ;;

  *.py)
    # Python: ruff check del archivo + mypy si disponible
    if ! command -v ruff &> /dev/null; then
      # Ruff no instalado, warning pero no bloquear
      echo "WARNING: ruff no instalado, saltando verificación Python de $FILE_PATH" >&2
      exit 0
    fi

    RUFF_OUTPUT=$(ruff check "$FILE_PATH" 2>&1) || {
      report_error "ruff" "$RUFF_OUTPUT"
    }

    # Mypy es opcional, solo corre si está disponible
    if command -v mypy &> /dev/null; then
      MYPY_OUTPUT=$(mypy "$FILE_PATH" 2>&1) || {
        report_error "mypy" "$MYPY_OUTPUT"
      }
    fi
    ;;

  *.json)
    # JSON: validación sintáctica con python3
    if ! python3 -m json.tool "$FILE_PATH" > /dev/null 2>&1; then
      ERROR_OUTPUT=$(python3 -m json.tool "$FILE_PATH" 2>&1 || true)
      report_error "json" "$ERROR_OUTPUT"
    fi
    ;;

  *.yml|*.yaml)
    # YAML: validación sintáctica si python3-yaml disponible
    if python3 -c "import yaml" 2>/dev/null; then
      if ! python3 -c "import yaml; yaml.safe_load(open('$FILE_PATH'))" 2>/dev/null; then
        ERROR_OUTPUT=$(python3 -c "import yaml; yaml.safe_load(open('$FILE_PATH'))" 2>&1 || true)
        report_error "yaml" "$ERROR_OUTPUT"
      fi
    fi
    ;;

  *)
    # Otros archivos (.css, .md, .txt, etc.): no aplica verificación
    exit 0
    ;;

esac

# Todo OK
exit 0
