---
description: Congela un archivo o función en FROZEN.md para proteger contra modificaciones sin autorización. Recibe ruta del archivo como argumento.
allowed-tools: Read, Edit
---

Congela un archivo en FROZEN.md para proteger contra modificaciones
automáticas. Solo modificable con `/unfreeze` o con flag temporal
UNFREEZE_ACTIVE.

## Argumento recibido

La ruta del archivo a congelar, relativa al root del repo.
Ejemplo: `/freeze src/pages/Login.tsx`

El argumento está disponible como: $ARGUMENTS

## Instrucciones para ejecutar el comando

Paso 1: Validar argumento
- Si $ARGUMENTS está vacío, detener y pedir a Cristian la ruta
- Si la ruta no existe en el filesystem, detener y alertar
- Si la ruta es absoluta, convertir a relativa respecto al repo

Paso 2: Leer FROZEN.md
- Localizar FROZEN.md en la raíz del repo
- Si no existe, detener y reportar (esto indica problema estructural)
- Leer la tabla de archivos congelados

Paso 3: Verificar que no esté ya congelado
- Buscar la ruta en la primera columna de la tabla
- Si ya está: informar "Este archivo ya está congelado desde [fecha]"
  y mostrar la fila existente
- Si no está: proceder al paso 4

Paso 4: Agregar fila nueva
Recopilar información adicional:
- Sección: por defecto "completo". Si Cristian especifica sección
  específica (por ejemplo "null-safety" o "autenticación"), usar esa.
- Fecha: YYYY-MM-DD de hoy
- Nota: pedir a Cristian una nota breve explicando por qué se congela.
  Si no proporciona, dejar vacío (no recomendado pero permitido).

Formato de fila a agregar:
```
| `ruta/del/archivo.ext` | seccion | 2026-MM-DD | Nota breve |
```

Paso 5: Escribir FROZEN.md actualizado
Usa Edit para agregar la fila al final de la tabla (antes del cierre
de sección si hay). Mantén alineación de columnas con filas existentes.

Paso 6: Confirmar a Cristian
Muestra la fila nueva agregada. Menciona que el hook
regen-frozen-list.sh se ejecutará automáticamente al guardar y
actualizará .claude/frozen-files.txt.

## Validaciones importantes

- Nunca congelar archivos que no existen físicamente
- Nunca congelar carpetas enteras (solo archivos o globs específicos)
- Nunca duplicar filas en FROZEN.md
- Mantener orden: agregar al final de la tabla, no insertar en medio
