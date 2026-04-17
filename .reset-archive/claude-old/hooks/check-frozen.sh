#!/bin/bash
# Hook: PreToolUse — Verifica que el archivo no este en FROZEN.md antes de editar
# Exit code 2 = BLOQUEAR la edicion

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null)

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

FROZEN_FILE="$(git rev-parse --show-toplevel 2>/dev/null)/FROZEN.md"

if [ ! -f "$FROZEN_FILE" ]; then
  exit 0
fi

# Extraer solo el nombre relativo del archivo para buscar en FROZEN.md
BASENAME=$(basename "$FILE_PATH")
RELATIVE=$(echo "$FILE_PATH" | sed "s|.*/CONNIKU/||")

# Match por ruta relativa exacta (evita falsos positivos por basename)
# Ej: extension/.gitignore NO matchea con .gitignore (raiz)
if grep -qF "$RELATIVE" "$FROZEN_FILE" 2>/dev/null; then
  echo "BLOQUEADO: '$RELATIVE' esta en FROZEN.md. Pide autorizacion a Cristian o usa /unfreeze primero." >&2
  exit 2
fi

exit 0
