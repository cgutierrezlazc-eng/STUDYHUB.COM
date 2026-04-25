#!/usr/bin/env bash
# verify-legal-texts-sync.sh
#
# Valida que shared/legal_texts.py y shared/legal_texts.ts tengan el mismo
# hash SHA-256 del texto canónico del checkbox declarativo de edad.
#
# Uso:
#   bash scripts/verify-legal-texts-sync.sh
#
# Exit codes:
#   0: sincronizado (o archivo .ts aún no existe - modo tolerante)
#   1: hashes divergen - bloquear merge
#   2: error de setup (python3 no disponible, etc.)
#
# Integración CI: invocado desde .github/workflows/verify-build.yml

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
PY_FILE="$REPO_ROOT/shared/legal_texts.py"
TS_FILE="$REPO_ROOT/shared/legal_texts.ts"

# Colores para logs (solo si TTY)
if [[ -t 1 ]]; then
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    RED='\033[0;31m'
    RESET='\033[0m'
else
    GREEN=''
    YELLOW=''
    RED=''
    RESET=''
fi

echo "══════════════════════════════════════════════════════════════"
echo "  Verificación sincronía de textos legales (Python ↔ TypeScript)"
echo "══════════════════════════════════════════════════════════════"

# Validaciones de setup
if ! command -v python3 >/dev/null 2>&1; then
    echo -e "${RED}ERROR: python3 no disponible${RESET}"
    exit 2
fi

if [[ ! -f "$PY_FILE" ]]; then
    echo -e "${RED}ERROR: no existe $PY_FILE${RESET}"
    exit 2
fi

# Extraer hash desde Python (fuente de verdad)
PY_HASH=$(cd "$REPO_ROOT" && python3 -c "from shared.legal_texts import AGE_DECLARATION_HASH; print(AGE_DECLARATION_HASH)" 2>/dev/null || echo "ERROR")

if [[ "$PY_HASH" == "ERROR" ]] || [[ -z "$PY_HASH" ]]; then
    echo -e "${RED}ERROR: no se pudo extraer hash desde Python${RESET}"
    exit 2
fi

echo "  Python:     $PY_HASH"

# Espejo TypeScript: modo tolerante si aún no existe
if [[ ! -f "$TS_FILE" ]]; then
    echo -e "${YELLOW}  TypeScript: archivo no existe todavía${RESET}"
    echo -e "${YELLOW}  Advertencia: shared/legal_texts.ts pendiente de crear${RESET}"
    echo -e "${YELLOW}  (OK en modo tolerante; el frontend-builder debe crearlo)${RESET}"
    exit 0
fi

# Extraer hash hardcoded del archivo .ts (busca la constante exportada)
TS_HASH=$(grep -oE '"[0-9a-f]{64}"' "$TS_FILE" | head -1 | tr -d '"' || echo "")

if [[ -z "$TS_HASH" ]]; then
    echo -e "${RED}ERROR: no se encontró hash de 64 caracteres hex en $TS_FILE${RESET}"
    echo -e "${RED}  Esperaba línea tipo: AGE_DECLARATION_HASH = \"<64-char-hex>\"${RESET}"
    exit 1
fi

echo "  TypeScript: $TS_HASH"

# Comparación
if [[ "$PY_HASH" == "$TS_HASH" ]]; then
    echo -e "${GREEN}  ✓ Hashes coinciden. Textos legales sincronizados.${RESET}"
    exit 0
else
    echo -e "${RED}  ✗ DIVERGENCIA detectada${RESET}"
    echo -e "${RED}  Los textos legales en Python y TypeScript no coinciden.${RESET}"
    echo -e "${RED}  Uno de los archivos fue editado sin el espejo correspondiente.${RESET}"
    echo ""
    echo "  Para corregir:"
    echo "  1. Identifica cuál es la versión correcta (la última aprobada por Cristian)"
    echo "  2. Actualiza el otro archivo con el mismo texto literal (newlines, acentos, espacios)"
    echo "  3. Si usas Python como fuente: ejecuta:"
    echo "       python3 -c 'from shared.legal_texts import AGE_DECLARATION_HASH; print(AGE_DECLARATION_HASH)'"
    echo "     y pega el resultado en la constante AGE_DECLARATION_HASH del .ts"
    echo "  4. Bumpa AGE_DECLARATION_VERSION en ambos archivos"
    echo ""
    exit 1
fi
