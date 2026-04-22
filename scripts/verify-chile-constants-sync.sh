#!/usr/bin/env bash
# verify-chile-constants-sync.sh
#
# Verifica que shared/chile_constants.ts tenga los mismos valores numéricos
# que backend/constants/labor_chile.py y backend/constants/tax_chile.py.
#
# Cada constante numérica del espejo TypeScript se compara valor a valor
# contra su equivalente Python. Si alguno difiere, el script falla con
# mensaje claro indicando qué constante está desincronizada.
#
# Uso:
#   bash scripts/verify-chile-constants-sync.sh
#
# Exit codes:
#   0: todos los valores sincronizados (o TS aún no existe — modo tolerante)
#   1: al menos un valor difiere — bloquear merge
#   2: error de setup (python3 no disponible, archivos faltantes, etc.)
#
# Integración CI: invocado desde .github/workflows/verify-build.yml
#
# Patrón análogo a verify-legal-texts-sync.sh.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
LABOR_PY="$REPO_ROOT/backend/constants/labor_chile.py"
TAX_PY="$REPO_ROOT/backend/constants/tax_chile.py"
TS_FILE="$REPO_ROOT/shared/chile_constants.ts"

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
echo "  Verificación sincronía de constantes Chile (Python ↔ TypeScript)"
echo "══════════════════════════════════════════════════════════════"

# ─── Validaciones de setup ────────────────────────────────────────────────────

if ! command -v python3 >/dev/null 2>&1; then
    echo -e "${RED}ERROR: python3 no disponible${RESET}"
    exit 2
fi

if [[ ! -f "$LABOR_PY" ]]; then
    echo -e "${RED}ERROR: no existe $LABOR_PY${RESET}"
    exit 2
fi

if [[ ! -f "$TAX_PY" ]]; then
    echo -e "${RED}ERROR: no existe $TAX_PY${RESET}"
    exit 2
fi

# Modo tolerante: si el .ts aún no existe, advertencia sin bloqueo
if [[ ! -f "$TS_FILE" ]]; then
    echo -e "${YELLOW}  TypeScript: archivo $TS_FILE no existe todavía${RESET}"
    echo -e "${YELLOW}  Advertencia: shared/chile_constants.ts pendiente de crear${RESET}"
    echo -e "${YELLOW}  (OK en modo tolerante; el frontend-builder debe crearlo)${RESET}"
    exit 0
fi

# ─── Extracción de valores Python ─────────────────────────────────────────────
# Ejecuta un pequeño script Python que importa los módulos y serializa
# los valores numéricos comparables a JSON para contrastar con TS.
#
# Solo comparamos constantes escalares (int/float/Decimal).
# Las constantes de tipo date, lista (tramos de impuesto) y funciones
# se excluyen de la comparación automática — tienen tests propios en pytest.

PY_VALUES=$(cd "$REPO_ROOT" && python3 - <<'PYEOF'
import sys, json
from decimal import Decimal

# Agregar el repo al path para importar shared/
sys.path.insert(0, '.')

try:
    from backend.constants.labor_chile import (
        UF_ABRIL_2026,
        UTM_ABRIL_2026,
        SUELDO_MINIMO_2026,
        AFP_OBLIGATORIA_PCT,
        AFP_UNO_COMMISSION_PCT,
        AFC_TRABAJADOR_INDEFINIDO_PCT,
        AFC_EMPLEADOR_INDEFINIDO_PCT,
        AFC_EMPLEADOR_PLAZO_FIJO_PCT,
        SIS_PCT,
        TOPE_IMPONIBLE_AFP_UF,
        TOPE_IMPONIBLE_AFC_UF,
        WEEKLY_HOURS_PRE_42H,
        WEEKLY_HOURS_POST_42H,
    )
    from backend.constants.tax_chile import (
        IVA_PCT,
        RETENCION_HONORARIOS_2026_PCT,
        PPM_PROPYME_14D3_PCT,
    )
except ImportError as e:
    print(f"ERROR_IMPORT: {e}", file=sys.stderr)
    sys.exit(2)

values = {
    "UF_ABRIL_2026": float(UF_ABRIL_2026),
    "UTM_ABRIL_2026": float(UTM_ABRIL_2026),
    "SUELDO_MINIMO_2026": int(SUELDO_MINIMO_2026),
    "AFP_OBLIGATORIA_PCT": float(AFP_OBLIGATORIA_PCT),
    "AFP_UNO_COMMISSION_PCT": float(AFP_UNO_COMMISSION_PCT),
    "AFC_TRABAJADOR_INDEFINIDO_PCT": float(AFC_TRABAJADOR_INDEFINIDO_PCT),
    "AFC_EMPLEADOR_INDEFINIDO_PCT": float(AFC_EMPLEADOR_INDEFINIDO_PCT),
    "AFC_EMPLEADOR_PLAZO_FIJO_PCT": float(AFC_EMPLEADOR_PLAZO_FIJO_PCT),
    "SIS_PCT": float(SIS_PCT),
    "TOPE_IMPONIBLE_AFP_UF": float(TOPE_IMPONIBLE_AFP_UF),
    "TOPE_IMPONIBLE_AFC_UF": float(TOPE_IMPONIBLE_AFC_UF),
    "WEEKLY_HOURS_PRE_42H": int(WEEKLY_HOURS_PRE_42H),
    "WEEKLY_HOURS_POST_42H": int(WEEKLY_HOURS_POST_42H),
    "IVA_PCT": float(IVA_PCT),
    "RETENCION_HONORARIOS_2026_PCT": float(RETENCION_HONORARIOS_2026_PCT),
    "PPM_PROPYME_14D3_PCT": float(PPM_PROPYME_14D3_PCT),
}

print(json.dumps(values))
PYEOF
) || {
    echo -e "${RED}ERROR: no se pudieron extraer valores desde Python${RESET}"
    echo "  Verifica que backend/constants/labor_chile.py y tax_chile.py sean importables"
    exit 2
}

# ─── Extracción de valores TypeScript ────────────────────────────────────────
# Usamos node para evaluar el módulo TS (requiere ts-node o esbuild, pero
# para evitar dependencias, hacemos grep directo de las líneas `export const`.
# Formato esperado: export const NOMBRE = VALOR;
# Esto es robusto porque el archivo sigue un formato estricto.

TS_VALUES=$(cd "$REPO_ROOT" && python3 - <<'PYEOF'
import re
import sys
import json

ts_file = "shared/chile_constants.ts"

try:
    content = open(ts_file, encoding="utf-8").read()
except OSError as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(2)

# Extraer líneas: export const NOMBRE = VALOR;
# Valor puede ser integer o float. Ignorar arrays, Date, funciones.
pattern = re.compile(
    r"^export\s+const\s+(\w+)\s*=\s*([0-9]+(?:\.[0-9]+)?);\s*$",
    re.MULTILINE,
)

values = {}
for match in pattern.finditer(content):
    name = match.group(1)
    raw = match.group(2)
    values[name] = float(raw) if "." in raw else int(raw)

print(json.dumps(values))
PYEOF
) || {
    echo -e "${RED}ERROR: no se pudieron extraer valores desde TypeScript${RESET}"
    exit 2
}

# ─── Comparación valor a valor ────────────────────────────────────────────────

COMPARISON_RESULT=$(cd "$REPO_ROOT" && python3 - "$PY_VALUES" "$TS_VALUES" <<'PYEOF'
import sys
import json

py_values = json.loads(sys.argv[1])
ts_values = json.loads(sys.argv[2])

divergences = []
missing_in_ts = []

for name, py_val in py_values.items():
    if name not in ts_values:
        missing_in_ts.append(name)
        continue
    ts_val = ts_values[name]
    # Comparación tolerante a float: diff relativo < 1e-9
    if isinstance(py_val, float) or isinstance(ts_val, float):
        py_f = float(py_val)
        ts_f = float(ts_val)
        if py_f == 0.0 and ts_f == 0.0:
            continue
        rel_diff = abs(py_f - ts_f) / max(abs(py_f), abs(ts_f))
        if rel_diff > 1e-9:
            divergences.append({
                "name": name,
                "python": py_val,
                "typescript": ts_val,
            })
    else:
        if py_val != ts_val:
            divergences.append({
                "name": name,
                "python": py_val,
                "typescript": ts_val,
            })

result = {
    "divergences": divergences,
    "missing_in_ts": missing_in_ts,
    "total_checked": len(py_values),
}
print(json.dumps(result))
PYEOF
)

DIVERGENCES=$(echo "$COMPARISON_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d['divergences']))")
MISSING=$(echo "$COMPARISON_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d['missing_in_ts']))")
TOTAL=$(echo "$COMPARISON_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['total_checked'])")

echo "  Constantes verificadas: $TOTAL"
echo ""

# Mostrar resultado
DIV_COUNT=$(echo "$DIVERGENCES" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
MISS_COUNT=$(echo "$MISSING" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")

FAIL=0

if [[ "$MISS_COUNT" -gt 0 ]]; then
    echo -e "${YELLOW}  Advertencia: constantes Python sin espejo en TypeScript:${RESET}"
    echo "$MISSING" | python3 -c "
import sys, json
for name in json.load(sys.stdin):
    print(f'    - {name}')
"
    echo ""
    # Missing en TS es warning, no bloqueante (pueden ser constantes nuevas)
fi

if [[ "$DIV_COUNT" -gt 0 ]]; then
    echo -e "${RED}  ✗ DIVERGENCIAS DETECTADAS ($DIV_COUNT constante(s))${RESET}"
    echo ""
    echo "$DIVERGENCES" | python3 -c "
import sys, json
for d in json.load(sys.stdin):
    print(f'  Constante: {d[\"name\"]}')
    print(f'    Python:     {d[\"python\"]}')
    print(f'    TypeScript: {d[\"typescript\"]}')
    print()
"
    echo "  Para corregir:"
    echo "  1. Identifica cuál es el valor oficial (la fuente legal verificada)"
    echo "  2. Actualiza el archivo que tiene el valor incorrecto"
    echo "  3. Si cambias Python, actualiza también shared/chile_constants.ts"
    echo "  4. Si cambias TypeScript, actualiza también el .py correspondiente"
    echo "  5. Ejecuta este script nuevamente para confirmar sincronía"
    echo ""
    FAIL=1
fi

if [[ "$FAIL" -eq 0 ]]; then
    echo -e "${GREEN}  ✓ Todos los valores sincronizados. Python ↔ TypeScript coherentes.${RESET}"
    exit 0
else
    exit 1
fi
