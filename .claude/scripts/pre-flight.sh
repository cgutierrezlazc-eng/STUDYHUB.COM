#!/usr/bin/env bash
#
# Pre-flight CI local — implementación operativa de CLAUDE.md §23.
#
# Ejecuta la misma suite de verificación que el gate de CI
# (.github/workflows/verify-build.yml) antes de permitir push a PR.
#
# Uso:
#   bash .claude/scripts/pre-flight.sh
#
# Exit codes:
#   0 — todos los gates pasaron, push autorizado
#   1 — typecheck falló
#   2 — eslint falló
#   3 — vitest falló
#   4 — vite build falló
#   5 — pytest falló
#   6 — ruff check falló
#   7 — git status sucio con cambios sin commitear
#
# Por diseño: es strict-fail. Si CUALQUIER gate falla, aborta.

set -u  # error en variable no definida; NO -e porque queremos reportar exit code específico

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

BOLD=$'\033[1m'
RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[1;33m'
RESET=$'\033[0m'

print_header() {
  echo
  echo "${BOLD}════════════════════════════════════════════════════════════${RESET}"
  echo "${BOLD}  Pre-flight CI local — CLAUDE.md §23${RESET}"
  echo "${BOLD}════════════════════════════════════════════════════════════${RESET}"
  echo
}

print_step() {
  echo "${BOLD}[$1/$2] $3${RESET}"
}

pass() {
  echo "${GREEN}    OK${RESET}: $1"
  echo
}

fail() {
  echo "${RED}    FALLO${RESET}: $1"
  echo
}

warn() {
  echo "${YELLOW}    WARN${RESET}: $1"
  echo
}

print_header

# ─── Gate 0: working tree limpio ─────────────────────────────────

print_step 0 6 "Working tree limpio"

if [ -n "$(git status --porcelain)" ]; then
  warn "hay cambios sin commitear (no bloquea push, pero puede indicar trabajo incompleto)"
  git status --short | head -10
  echo
else
  pass "working tree limpio"
fi

# ─── Gate 1: TypeScript typecheck ────────────────────────────────

print_step 1 6 "TypeScript typecheck (npx tsc --noEmit)"

if npx tsc --noEmit 2>&1; then
  pass "typecheck exit 0"
else
  fail "typecheck rompió. Arregla antes de push."
  exit 1
fi

# ─── Gate 2: ESLint ──────────────────────────────────────────────

print_step 2 6 "ESLint (npx eslint src/)"

if npx eslint src/ 2>&1; then
  pass "eslint exit 0"
else
  fail "eslint detectó problemas. Arregla antes de push."
  exit 2
fi

# ─── Gate 3: Vitest suite completa ───────────────────────────────

print_step 3 6 "Vitest suite completa (npx vitest run)"

if npx vitest run 2>&1 | tail -20; then
  pass "vitest exit 0"
else
  fail "tests vitest fallaron. Arregla antes de push."
  exit 3
fi

# ─── Gate 4: Vite build ──────────────────────────────────────────

print_step 4 6 "Vite build (npx vite build)"

if npx vite build 2>&1 | tail -10; then
  pass "build exit 0"
else
  fail "build rompió. Arregla antes de push."
  exit 4
fi

# ─── Gate 5: pytest backend ──────────────────────────────────────

print_step 5 6 "pytest backend (python3.11 -m pytest backend/)"

if python3.11 -m pytest backend/ --tb=no -q 2>&1 | tail -10; then
  pass "pytest exit 0"
else
  fail "tests pytest fallaron. Arregla antes de push."
  exit 5
fi

# ─── Gate 6: ruff backend ────────────────────────────────────────

print_step 6 6 "Ruff backend (ruff check backend/ con fallback)"

# Anti-abort: probar alternativas en orden
if command -v ruff >/dev/null 2>&1 && ruff check backend/ 2>&1; then
  pass "ruff exit 0"
elif python3.11 -m ruff check backend/ 2>&1; then
  pass "ruff (via python3.11 -m) exit 0"
elif python3 -m ruff check backend/ 2>&1; then
  pass "ruff (via python3 -m) exit 0"
else
  fail "ruff no disponible o detectó problemas. Verifica instalación o arregla errores."
  exit 6
fi

# ─── Resumen final ───────────────────────────────────────────────

echo
echo "${BOLD}════════════════════════════════════════════════════════════${RESET}"
echo "${GREEN}${BOLD}  PRE-FLIGHT OK — push autorizado${RESET}"
echo "${BOLD}════════════════════════════════════════════════════════════${RESET}"
echo
echo "  Siguiente paso: ${BOLD}git push${RESET}"
echo "  Si hay gaps marcados por truth-auditor/code-reviewer/gap-finder"
echo "  en docs/reports/ de la rama actual, verifica que estén resueltos"
echo "  antes de abrir PR (CLAUDE.md §23.2)."
echo

exit 0
