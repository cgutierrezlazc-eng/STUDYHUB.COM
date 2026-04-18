#!/bin/bash
#
# Hook: SessionEnd
# Propósito: Limpiar estado de sesión al cerrar Claude Code.
#            Libera el lock, elimina UNFREEZE_ACTIVE si quedó activo,
#            registra cierre en log de auditoría.
#
# Exit codes:
#   0 = siempre, este script nunca bloquea
#
# Este script es best-effort: si algo falla, registra warning pero
# no impide el cierre de sesión. El propósito es higiene, no control.

set +e  # No abortar en errores, queremos ejecutar toda la limpieza

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$REPO_ROOT" ]; then
  exit 0
fi

LOCK_FILE="$REPO_ROOT/.claude/session.lock"
UNFREEZE_FLAG="$REPO_ROOT/.claude/UNFREEZE_ACTIVE"
LOG_DIR="$REPO_ROOT/.claude/logs"
LOG_FILE="$LOG_DIR/sessions.log"
CURRENT_PID=$$
CURRENT_TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S %Z")

# Asegurar que existe directorio de logs
mkdir -p "$LOG_DIR" 2>/dev/null

# Función helper para log
log_event() {
  echo "[$CURRENT_TIMESTAMP] $1" >> "$LOG_FILE" 2>/dev/null
}

# Liberar lock si pertenece a esta sesión
if [ -f "$LOCK_FILE" ]; then
  LOCK_CONTENT=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
  LOCK_PID=$(echo "$LOCK_CONTENT" | awk '{print $1}')

  if [ "$LOCK_PID" = "$CURRENT_PID" ]; then
    rm -f "$LOCK_FILE"
    log_event "Lock liberado (PID $CURRENT_PID)"
  else
    # Lock existe pero no es de esta sesión, raro pero no tocar
    log_event "Cierre de sesión: lock encontrado con PID $LOCK_PID (no es esta sesión), no se toca"
  fi
fi

# Eliminar UNFREEZE_ACTIVE si quedó activo
if [ -f "$UNFREEZE_FLAG" ]; then
  # Leer cuándo se activó si hay timestamp
  UNFREEZE_TIMESTAMP=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$UNFREEZE_FLAG" 2>/dev/null || echo "desconocido")
  rm -f "$UNFREEZE_FLAG"
  log_event "UNFREEZE_ACTIVE eliminado al cierre (estaba activo desde $UNFREEZE_TIMESTAMP)"
  echo "UNFREEZE_ACTIVE fue eliminado automáticamente al cerrar sesión" >&2
fi

# Log de cierre
log_event "Sesión cerrada (PID $CURRENT_PID)"

# Mantener el log bajo control: si crece a más de 1000 líneas, rotar
if [ -f "$LOG_FILE" ]; then
  LOG_LINES=$(wc -l < "$LOG_FILE" 2>/dev/null || echo "0")
  if [ "$LOG_LINES" -gt 1000 ]; then
    # Mantener solo las últimas 500 líneas
    tail -500 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
    log_event "Log rotado: se conservaron las últimas 500 entradas"
  fi
fi

# Siempre retornar 0
exit 0
