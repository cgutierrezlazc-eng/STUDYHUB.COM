---
description: Descongela un archivo de FROZEN.md. Dos modos: permanente (remueve fila) o temporal (activa flag UNFREEZE_ACTIVE para sesión actual).
allowed-tools: Read, Edit, Bash
---

Descongela un archivo congelado en FROZEN.md. Tiene dos modos
distintos según la intención de Cristian.

## Argumentos recibidos

$ARGUMENTS puede tener dos formas:

1. Solo ruta de archivo (modo permanente):
   `/unfreeze src/pages/Login.tsx`
   → Remueve la fila del archivo de FROZEN.md permanentemente

2. Ruta de archivo seguida de "temp" (modo temporal):
   `/unfreeze src/pages/Login.tsx temp`
   → Crea flag .claude/UNFREEZE_ACTIVE sin modificar FROZEN.md.
     Permite editar cualquier archivo frozen durante la sesión actual.
     El flag se elimina automáticamente al cerrar sesión.

Si el argumento es solo "temp" sin ruta:
   `/unfreeze temp`
   → Activa UNFREEZE_ACTIVE sin archivo específico. Desbloquea TODOS
     los archivos frozen durante la sesión actual. Usar con precaución.

## Instrucciones para ejecutar el comando

### Paso 1: Interpretar $ARGUMENTS

Parsear el argumento:
- Si contiene "temp": modo temporal
- Si solo hay ruta: modo permanente
- Si vacío: detener y pedir aclaración

### Paso 2 A: Modo permanente

Cuando el argumento es solo una ruta de archivo:

1. Leer FROZEN.md
2. Buscar la ruta en la primera columna de la tabla
3. Si no está: informar "Este archivo no está congelado"
4. Si está: remover la fila completa usando Edit
5. Confirmar a Cristian mostrando qué fila se removió
6. Advertir: "Este archivo ahora puede ser modificado.
   Considera usar /freeze nuevamente cuando termines los cambios."

### Paso 2 B: Modo temporal

Cuando el argumento incluye "temp":

1. Localizar la ruta del repo: `git rev-parse --show-toplevel`
2. Verificar si .claude/UNFREEZE_ACTIVE ya existe:
   - Si existe: informar "Flag UNFREEZE_ACTIVE ya está activo.
     Se eliminará automáticamente al cerrar la sesión."
   - Si no existe: crear con `touch .claude/UNFREEZE_ACTIVE`
3. Si la ruta de archivo también se proporcionó (no solo "temp"),
   verificar que el archivo esté efectivamente en FROZEN.md
   y mencionarlo en la confirmación
4. Advertir explícitamente:
   - "Flag UNFREEZE_ACTIVE creado. TODOS los archivos frozen
     pueden editarse durante esta sesión."
   - "El flag se eliminará automáticamente al cerrar la sesión
     por session-cleanup.sh."
   - "Si necesitas protección completa antes del cierre, eliminar
     manualmente: rm .claude/UNFREEZE_ACTIVE"

## Criterio de elección entre modos

Modo permanente cuando:
- El archivo ya no necesita protección a largo plazo
- El código se va a refactorizar extensivamente
- El archivo será reemplazado por otro

Modo temporal cuando:
- Solo necesitas editar puntualmente (pocos minutos)
- El archivo seguirá necesitando protección después
- Múltiples archivos frozen deben editarse en la misma sesión

## Validaciones

- Nunca crear el flag UNFREEZE_ACTIVE si ya existe (solo confirmar)
- Nunca remover una fila de FROZEN.md sin confirmación de Cristian
  si el archivo fue congelado hace menos de 7 días (código reciente
  puede tener razón importante para estar frozen)
- Si modo temporal, recordar que session-cleanup.sh limpia
  automáticamente, no es necesario acordarse manualmente
