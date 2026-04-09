#!/bin/bash
# Script para compilar CONNIKU Android App Bundle para Google Play Store
# Ejecutar desde la raiz del proyecto CONNIKU

set -e

echo "=== CONNIKU - Build para Google Play Store ==="
echo ""

# Paso 1: Build web
echo "[1/4] Compilando build web..."
npm run build
echo "Build web completado."

# Paso 2: Sync Capacitor
echo ""
echo "[2/4] Sincronizando con Capacitor..."
npx cap sync android
echo "Sync completado."

# Paso 3: Limpiar build anterior
echo ""
echo "[3/4] Limpiando build anterior..."
cd android
./gradlew clean
echo "Limpieza completada."

# Paso 4: Compilar AAB release
echo ""
echo "[4/4] Compilando AAB release firmado..."
./gradlew bundleRelease
cd ..

# Resultado
AAB_PATH="android/app/build/outputs/bundle/release/app-release.aab"
if [ -f "$AAB_PATH" ]; then
    echo ""
    echo "=== BUILD EXITOSO ==="
    echo "AAB generado en: $AAB_PATH"
    echo "Tamano: $(du -h "$AAB_PATH" | cut -f1)"
    echo ""
    echo "Siguiente paso: Subir este archivo a Google Play Console"
    echo "  https://play.google.com/console"
    echo "  > Crear app > Subir AAB en seccion 'Release'"
else
    echo ""
    echo "ERROR: No se genero el AAB. Revisa los errores arriba."
    exit 1
fi
