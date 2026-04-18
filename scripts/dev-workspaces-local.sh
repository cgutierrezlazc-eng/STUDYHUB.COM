#!/usr/bin/env bash
# dev-workspaces-local.sh — levanta backend + frontend local aislados para
# inspeccionar el módulo Workspaces v2 sin tocar producción.
#
# Uso:
#   bash scripts/dev-workspaces-local.sh
#
# Resultado:
#   - Backend FastAPI en http://localhost:8899 (SQLite local en ~/.conniku/)
#   - Frontend Vite en http://localhost:5173
#   - Usuario owner pre-creado: ceo@conniku.local / password: testlocal123
#
# Para detener: Ctrl+C (detiene frontend). Backend queda en background;
# matalo con: pkill -f "python3.11.*server.py"

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "══════════════════════════════════════════════════════════════"
echo "  Workspaces v2 · Dev local aislado"
echo "══════════════════════════════════════════════════════════════"

# Variables de entorno para backend local
export JWT_SECRET="local-dev-secret-not-for-production"
export OWNER_PASSWORD="testlocal123"
export CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
export BCRYPT_ROUNDS="4"
export PORT="8899"
# Sin DATABASE_URL → usa SQLite local en ~/.conniku/conniku.db
unset DATABASE_URL || true
# SMTP falso para no intentar mandar emails
export SMTP_HOST="localhost"
export SMTP_PORT="25"
export SMTP_PASS=""
export NOREPLY_EMAIL="noreply@localhost"
export CONTACT_EMAIL="contacto@localhost"
export CEO_EMAIL="ceo@conniku.local"

# Sin API keys reales — Athena/AI fallarán con error claro, no es crítico en 2a
export ANTHROPIC_API_KEY=""
export OPENAI_API_KEY=""

# Kill backend previo si existe
pkill -f "python3.11.*backend/server.py" 2>/dev/null || true
sleep 1

echo ""
echo "▶  Levantando backend (http://localhost:8899)…"
# Agregar repo root al PYTHONPATH para que imports `from shared.legal_texts` funcionen.
export PYTHONPATH="$REPO_ROOT:${PYTHONPATH:-}"
cd "$REPO_ROOT/backend"
python3.11 server.py > /tmp/conniku-backend-local.log 2>&1 &
BACKEND_PID=$!
cd "$REPO_ROOT"

# Esperar que el backend responda
echo -n "   Esperando backend listo"
for i in {1..30}; do
    if curl -s -o /dev/null http://localhost:8899/health 2>/dev/null || curl -s -o /dev/null http://localhost:8899/docs 2>/dev/null; then
        echo " ✓"
        break
    fi
    echo -n "."
    sleep 1
done

echo ""
echo "══════════════════════════════════════════════════════════════"
echo "  Backend corriendo · PID $BACKEND_PID"
echo "  Logs: tail -f /tmp/conniku-backend-local.log"
echo "  URL backend: http://localhost:8899"
echo "  API docs: http://localhost:8899/docs"
echo ""
echo "  Credenciales owner:"
echo "    Email: ceo@conniku.local"
echo "    Password: testlocal123"
echo ""
echo "  Si prefieres crear cuenta nueva, usa /register en el frontend."
echo "══════════════════════════════════════════════════════════════"
echo ""
echo "▶  Levantando frontend Vite (http://localhost:5173)…"
echo "   Ctrl+C detiene frontend. Backend sigue. Mátalo con:"
echo "   pkill -f 'python3.11.*backend/server.py'"
echo ""

# VITE_API_URL apunta al backend local
export VITE_API_URL="http://localhost:8899"

# Arrancar Vite en foreground
npx vite --host 0.0.0.0 --port 5173
