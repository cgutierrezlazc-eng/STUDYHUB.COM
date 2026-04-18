#!/bin/bash
# Hook: PostToolUse — Verifica sintaxis Python despues de editar archivos .py
# Solo reporta (exit 0), no bloquea

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null)

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Solo verificar archivos Python
case "$FILE_PATH" in
  *.py)
    RESULT=$(python3 -m py_compile "$FILE_PATH" 2>&1)
    if [ $? -ne 0 ]; then
      echo "ERROR SINTAXIS PYTHON en $FILE_PATH: $RESULT" >&2
    fi
    ;;
esac

exit 0
