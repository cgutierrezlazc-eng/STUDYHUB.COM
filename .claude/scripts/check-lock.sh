#!/bin/bash
#
# Hook: SessionStart
# Propósito: Prevenir sesiones concurrentes de Claude Code sobre el mismo repo.
#            Dos sesiones simultáneas causan ediciones superpuestas, conflictos
#            de git, y estado inconsistente. Este script lo bloquea
#            mecánicamente.
#
# Exit codes:
#   0 = permitir inicio de sesión (no hay otra activa)
#   2 = bloquear inicio (hay sesión activa con PID vivo)
#
# Archivo lock: .claude/session.lock
# Formato del lock: <PID> <TIMESTAMP_UNIX> <USER>
#
# Limpieza: el lock se elimina automáticamente por session-cleanup.sh
# al cerrar la sesión. Si el script de cleanup falla (cierre forzado,
# crash, kill -9), este script detecta el lock stale por PID muerto y
# lo reemplaza.

set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$REPO_ROOT" ]; then
  # No estamos en un repo git, no aplicar lock
  exit 0
fi

LOCK_FILE="$REPO_ROOT/.claude/session.lock"
CURRENT_PID=$$
CURRENT_USER=$(whoami)
CURRENT_TIMESTAMP=$(date +%s)

# Si no existe lock, crear uno y permitir
if [ ! -f "$LOCK_FILE" ]; then
  echo "$CURRENT_PID $CURRENT_TIMESTAMP $CURRENT_USER" > "$LOCK_FILE"
  exit 0
fi

# Lock existe, leer contenido
LOCK_CONTENT=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
if [ -z "$LOCK_CONTENT" ]; then
  # Lock vacío o corrupto, reemplazar
  echo "$CURRENT_PID $CURRENT_TIMESTAMP $CURRENT_USER" > "$LOCK_FILE"
  exit 0
fi

# Parsear PID, timestamp, user del lock existente
LOCK_PID=$(echo "$LOCK_CONTENT" | awk '{print $1}')
LOCK_TIMESTAMP=$(echo "$LOCK_CONTENT" | awk '{print $2}')
LOCK_USER=$(echo "$LOCK_CONTENT" | awk '{print $3}')

# Validar que parsing funcionó
if ! [[ "$LOCK_PID" =~ ^[0-9]+$ ]]; then
  # Lock corrupto, reemplazar
  echo "$CURRENT_PID $CURRENT_TIMESTAMP $CURRENT_USER" > "$LOCK_FILE"
  exit 0
fi

# Chequear si el PID del lock sigue activo
if kill -0 "$LOCK_PID" 2>/dev/null; then
  # Proceso vivo, lock válido, bloquear
  LOCK_AGE_SECONDS=$((CURRENT_TIMESTAMP - LOCK_TIMESTAMP))
  LOCK_AGE_MINUTES=$((LOCK_AGE_SECONDS / 60))

  echo "" >&2
  echo "BLOQUEADO: Ya existe una sesión activa de Claude Code sobre este repo." >&2
  echo "" >&2
  echo "Detalles de la sesión activa:" >&2
  echo "  PID: $LOCK_PID" >&2
  echo "  Usuario: $LOCK_USER" >&2
  echo "  Antigüedad: ${LOCK_AGE_MINUTES} minutos" >&2
  echo "" >&2
  echo "Razón: dos sesiones simultáneas causan ediciones superpuestas." >&2
  echo "" >&2
  echo "Opciones:" >&2
  echo "  1. Cerrar la otra sesión y reintentar" >&2
  echo "  2. Si la otra sesión está colgada, terminarla con: kill $LOCK_PID" >&2
  echo "  3. Si estás seguro de que no hay otra sesión real," >&2
  echo "     eliminar el lock: rm $LOCK_FILE" >&2
  echo "" >&2
  exit 2
fi

# PID muerto, lock stale, reemplazar con uno nuevo
echo "$CURRENT_PID $CURRENT_TIMESTAMP $CURRENT_USER" > "$LOCK_FILE"
exit 0
