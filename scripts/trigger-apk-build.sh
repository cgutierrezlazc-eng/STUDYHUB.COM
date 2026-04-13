#!/bin/bash
# ─── Trigger Android APK/AAB build via GitHub Actions API ─────────────────────
# Uso: ./scripts/trigger-apk-build.sh
# Requiere: GITHUB_TOKEN en el entorno o en .env.local
# ─────────────────────────────────────────────────────────────────────────────

REPO="cgutierrezlazc-eng/STUDYHUB.COM"
WORKFLOW="android-build.yml"
BRANCH="main"

# Cargar token desde .env.local si existe
if [ -f "$(dirname "$0")/../.env.local" ]; then
  export $(grep GITHUB_TOKEN "$(dirname "$0")/../.env.local" | xargs)
fi

if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ Error: GITHUB_TOKEN no está configurado."
  echo ""
  echo "Configúralo de una de estas formas:"
  echo "  1. Agrega GITHUB_TOKEN=ghp_tutoken en el archivo .env.local"
  echo "  2. Exporta: export GITHUB_TOKEN=ghp_tutoken"
  exit 1
fi

echo "🚀 Disparando build Android para $REPO..."

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/$REPO/actions/workflows/$WORKFLOW/dispatches" \
  -d "{\"ref\":\"$BRANCH\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -1)

if [ "$HTTP_CODE" = "204" ]; then
  echo "✅ Build disparado exitosamente!"
  echo "🔗 Ver progreso: https://github.com/$REPO/actions/workflows/$WORKFLOW"
else
  echo "❌ Error HTTP $HTTP_CODE"
  echo "$BODY"
  exit 1
fi
