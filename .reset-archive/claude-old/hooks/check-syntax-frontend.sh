#!/bin/bash
# Hook: PostToolUse — Verifica sintaxis TypeScript despues de editar archivos .ts/.tsx
# Solo reporta (exit 0), no bloquea

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null)

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Solo verificar archivos TypeScript/TSX
case "$FILE_PATH" in
  *.ts|*.tsx)
    PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
    if [ -n "$PROJECT_ROOT" ] && [ -f "$PROJECT_ROOT/tsconfig.json" ]; then
      ERRORS=$(cd "$PROJECT_ROOT" && npx tsc --noEmit 2>&1 | grep -c "error TS" 2>/dev/null)
      if [ "$ERRORS" -gt 0 ]; then
        echo "ALERTA: $ERRORS errores TypeScript detectados despues de editar $FILE_PATH. Correr 'npx tsc --noEmit' para ver detalles." >&2
      fi
    fi
    ;;
esac

exit 0
