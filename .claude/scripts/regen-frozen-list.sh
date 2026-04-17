#!/bin/bash
#
# Hook: PostToolUse (Edit, Write, MultiEdit sobre FROZEN.md)
# Propósito: Regenerar .claude/frozen-files.txt automáticamente cuando
#            FROZEN.md cambia. Extrae las rutas de archivo de la tabla
#            markdown y las escribe en formato plano consumible por
#            check-frozen.sh
#
# Exit codes:
#   0 = siempre, nunca bloquea
#
# Flujo:
#   Cristian edita FROZEN.md manualmente o con /freeze /unfreeze
#   -> este script se dispara
#   -> regenera .claude/frozen-files.txt
#   -> check-frozen.sh ahora protege la lista actualizada

set +e  # No abortar en errores

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

# Si no hay file_path, no aplica, salir
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$REPO_ROOT" ]; then
  exit 0
fi

# Solo actuar si se editó FROZEN.md
BASENAME=$(basename "$FILE_PATH")
if [ "$BASENAME" != "FROZEN.md" ]; then
  exit 0
fi

FROZEN_MD="$REPO_ROOT/FROZEN.md"
FROZEN_TXT="$REPO_ROOT/.claude/frozen-files.txt"

# Si no existe FROZEN.md, no hay nada que regenerar
if [ ! -f "$FROZEN_MD" ]; then
  exit 0
fi

# Asegurar que existe directorio .claude/
mkdir -p "$REPO_ROOT/.claude" 2>/dev/null

# Generar frozen-files.txt con encabezado explicativo
CURRENT_DATE=$(date +"%Y-%m-%d %H:%M:%S")

cat > "$FROZEN_TXT" << HEADER_EOF
# .claude/frozen-files.txt
#
# GENERADO AUTOMATICAMENTE - NO EDITAR DIRECTAMENTE
#
# Ultima regeneracion: $CURRENT_DATE
# Fuente: FROZEN.md (raiz del repo)
# Regenerado por: .claude/scripts/regen-frozen-list.sh
#
# Formato: una ruta relativa al root del repo por linea.
# Lineas que empiezan con # son comentarios.
# Soporta globs basicos (* y ?).
#
# Para modificar: editar FROZEN.md, este archivo se regenera
# automaticamente al guardar.
#
# Leido por: .claude/scripts/check-frozen.sh (hook PreToolUse)

HEADER_EOF

# Extraer rutas de archivo desde la tabla markdown de FROZEN.md
# Las rutas están entre backticks en la primera columna
# Ejemplo: | `src/pages/Messages.tsx` | ...
#
# Patrón regex:
#   - Empieza con | seguido de espacios
#   - Captura contenido entre backticks
#   - Excluye líneas de encabezado (---) y líneas vacías

grep -E '^\|[[:space:]]*`[^`]+`' "$FROZEN_MD" | \
  sed -E 's/^\|[[:space:]]*`([^`]+)`.*/\1/' | \
  grep -v '^$' | \
  sort -u >> "$FROZEN_TXT"

# Contar cuántos archivos se agregaron
COUNT=$(grep -v '^#' "$FROZEN_TXT" | grep -v '^$' | wc -l | xargs)

# Notificar resultado (no bloqueante)
echo "frozen-files.txt regenerado: $COUNT archivos protegidos" >&2

exit 0
