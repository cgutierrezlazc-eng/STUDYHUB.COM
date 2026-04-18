---
description: Ejecuta el protocolo formal de cierre de un bloque/módulo con las 7 capas de verificación. Solo cierra cuando todas las capas pasan y Cristian da OK final en la web.
allowed-tools: Task, Read, Grep, Glob, Edit, Write, Bash
---

Comando de cierre formal para un bloque del proyecto. Ejecuta el
protocolo de 7 capas definido en CLAUDE.md Sección 18. Es el único
mecanismo autorizado para cerrar un módulo y marcarlo como terminado.

## Argumento recibido

El nombre del bloque/módulo que se quiere cerrar.
Ejemplo: `/cerrar-bloque dashboard-profesor`

El argumento está disponible como: $ARGUMENTS

## Filosofía

Este comando NUNCA debe saltar capas ni acelerar el proceso. Si alguna
capa falla, el comando se detiene y reporta qué falta. No existe "modo
rápido" ni "saltar verificación". El precio del rigor es tiempo; el
precio de saltárselo es construir mal.

El cierre de bloque NO es una verificación formal rápida. Es un proceso
que puede ciclarse múltiples veces durante la Capa 6 (inspección de
Cristian) antes de llegar a Capa 7 (cierre real). Ciclar es normal y
esperado.

## Prerequisitos antes de invocar

Antes de ejecutar /cerrar-bloque, debe cumplirse:

- El bloque está terminado desde el punto de vista del builder
- Todos los tests del bloque pasan localmente
- El código está commiteado y pusheado a la rama de trabajo
- Existe URL de preview de Vercel disponible para la rama

Si alguno no se cumple, el comando se detendrá en la capa respectiva.

## Protocolo de 7 capas

### Capa 1: Trabajo técnico de agentes

Verificar que el builder (frontend-builder o backend-builder) y el
qa-tester completaron su trabajo sobre los archivos del bloque.

Ejecutar:

```
git log main..HEAD --name-only
```

Verificar que los archivos tocados pertenecen al bloque declarado.
Si hay archivos tocados que no pertenecen al bloque, detener y
reportar contaminación de scope.

Verificar reportes de builder y qa-tester en la sesión:
- Builder emitió reporte con 4 secciones obligatorias
- qa-tester confirmó funcionamiento end-to-end básico
- qa-tester verificó estados interactivos si aplica
- qa-tester verificó referencias legales si aplica

Si alguno de los reportes no existe o está incompleto, detener y
reportar "Capa 1 no completa: falta [reporte X]".

### Capa 2: Revisión adversarial

Invocar al agente `code-reviewer` para auditar el diff completo de
la rama contra main.

El code-reviewer debe emitir quality score con banda.

Resultado requerido: **PASS (85+)**.

Si el resultado es WARN (65-84): detener y reportar los
recomendados que deben abordarse antes de continuar con Capa 3.
Después de corregir, volver a ejecutar /cerrar-bloque desde el inicio.

Si el resultado es FAIL (menor 65): detener y reportar los
bloqueantes. El bloque no puede avanzar hasta corregir.

### Capa 3: Verificación cruzada

Invocar al agente `truth-auditor` para verificar que los reportes
de agentes anteriores son ciertos.

El truth-auditor re-ejecuta comandos reales y compara contra las
afirmaciones de los reportes. Debe emitir quality score final.

Resultado requerido: **PASS (85+)** sin bloqueantes críticos.

Si detecta discrepancia entre reporte y realidad, detener y
reportar qué reporte fue mentira o incompleto. Rechazar el cierre
y regresar el bloque al agente responsable.

### Capa 4: Deploy a preview

Merge de la rama de trabajo a una rama de preview de Vercel.

Ejecutar:

```
git checkout preview-$BLOCK_NAME
git merge --no-ff $CURRENT_BRANCH
git push origin preview-$BLOCK_NAME
```

Si no existe la rama preview, crearla antes del merge.

Esperar 2-3 minutos para que Vercel procese el deployment.

Verificar que el deployment fue exitoso consultando la API de
Vercel o revisando el dashboard.

Obtener la URL del preview deployment. Típicamente:
`https://conniku-git-preview-{block-name}.vercel.app`

Si el deployment falla, detener y reportar el error de build.
No proceder a Capa 5 hasta que el preview esté accesible.

### Capa 5: Auditoría estructural

Invocar al agente `gap-finder` con scope específico sobre el bloque
cerrado.

El gap-finder debe verificar:
- No hay archivos huérfanos en el bloque
- Tests cubren la lógica crítica del bloque
- Variables de entorno nuevas están documentadas
- No hay dependencias no declaradas
- Logs no tienen información sensible expuesta
- Documentación del módulo existe si es feature grande

Resultado requerido: **0 gaps críticos**. Se aceptan gaps de
severidad media o baja, pero quedan registrados para atención
posterior.

Si hay gap crítico, detener y regresar el bloque para corrección.

### Transición automática a Capa 6

Al llegar aquí, todas las capas automáticas están completas. El
comando debe:

1. Abrir automáticamente la URL de preview en el navegador
   predeterminado ejecutando:

   ```
   open [URL_DEL_PREVIEW]
   ```

2. Mostrar mensaje claro a Cristian:

```
================================================================
BLOQUE LISTO PARA TU INSPECCIÓN: [NOMBRE_DEL_BLOQUE]
================================================================

URL abierta en tu navegador: [URL_DEL_PREVIEW]

Capas automáticas completadas:
  Capa 1 (trabajo técnico): OK
  Capa 2 (revisión adversarial): PASS con score [X]/100
  Capa 3 (verificación cruzada): PASS con score [X]/100
  Capa 4 (deploy a preview): OK
  Capa 5 (auditoría estructural): 0 gaps críticos

Tu rol ahora (Capa 6):
  1. Usa la aplicación como usuario real en la URL abierta
  2. Prueba todos los flujos del módulo
  3. Verifica en móvil y escritorio si aplica
  4. Identifica mejoras necesarias si las hay

Respuestas posibles cuando termines:
  - "OK, cerrar" → procede a Capa 7
  - "Necesita correcciones: [lista]" → regresa a agentes
  - "Necesita más información sobre X" → consulta específica
================================================================
```

### Capa 6: Inspección humana en web online

Esperar input de Cristian.

Si Cristian indica correcciones necesarias:
1. Documentar cada corrección solicitada en
   `docs/inspecciones/$BLOCK_NAME-iter-$N.md`
2. Crear nueva iteración del bloque (iter-2, iter-3, etc.)
3. Delegar las correcciones al agente apropiado:
   - Ajustes visuales → frontend-builder
   - Bugs de lógica → backend-builder o frontend-builder según dónde esté
   - Reorganización → web-architect primero, después builder
4. Después de las correcciones, volver al inicio del protocolo
   (Capa 1) para re-verificar todo
5. La iteración se repite tantas veces como Cristian considere
   necesario

Si Cristian indica "OK, cerrar": proceder a Capa 7.

Si Cristian pide información: responder la consulta específica y
esperar nueva decisión.

### Capa 7: Cierre y bloqueo

Esta es la capa final e irreversible. Ejecutar en orden:

**Paso 7.1: Merge a main**

```
git checkout main
git merge --no-ff preview-$BLOCK_NAME
git push origin main
```

Vercel detectará el push a main y desplegará automáticamente a
producción.

**Paso 7.2: Registrar en BLOCKS.md**

Agregar entrada en BLOCKS.md con formato:

```
| nombre-del-bloque | YYYY-MM-DD | N iteraciones | archivos-incluidos | notas |
```

Incluir:
- Nombre del bloque
- Fecha de cierre
- Número de iteraciones que tomó (Capa 6 cicló N veces)
- Lista de archivos principales del bloque
- Notas breves sobre qué incluye

**Paso 7.3: Proteger archivos en FROZEN.md**

Agregar los archivos principales del bloque a FROZEN.md con
sección = nombre del bloque, fecha = hoy, nota = "Bloque cerrado
por /cerrar-bloque el [fecha]".

Esto dispara automáticamente la regeneración de
`.claude/frozen-files.txt` por el hook regen-frozen-list.sh.

**Paso 7.4: Limpieza de ramas de preview**

```
git branch -d preview-$BLOCK_NAME
git push origin --delete preview-$BLOCK_NAME
```

**Paso 7.5: Mensaje final de cierre**

```
================================================================
BLOQUE CERRADO EXITOSAMENTE: [NOMBRE_DEL_BLOQUE]
================================================================

Fecha de cierre: [YYYY-MM-DD HH:MM]
Iteraciones necesarias: [N]
Archivos bloqueados: [cantidad]

Acciones realizadas:
  - Merge a main completado
  - Deploy a producción iniciado por Vercel
  - Registro en BLOCKS.md
  - Archivos protegidos en FROZEN.md
  - Ramas de preview eliminadas

Próximos pasos recomendados:
  - Verificar deploy a producción en dashboard de Vercel
  - Si el próximo bloque está planificado, iniciar con /menu
================================================================
```

## Validaciones críticas

**Nunca cerrar un bloque si:**
- Alguna capa automática falla
- Cristian no dio OK explícito en Capa 6
- Hay bloqueantes críticos pendientes
- El deployment a preview no fue exitoso
- Hay tests fallando

**Siempre cerrar un bloque solo cuando:**
- Las 5 capas automáticas pasaron (1-5)
- Cristian inspeccionó en la URL online y dio OK
- No hay iteraciones pendientes de correcciones
- Todo está verificado con evidencia reproducible

## Uso del comando

Ejemplo de invocación completa:

```
/cerrar-bloque dashboard-profesor
```

El comando inicia Capa 1, pasa secuencialmente por cada capa, abre
el navegador al llegar a Capa 6, espera tu inspección, y solo
ejecuta Capa 7 cuando tú das OK explícito.

Puede tomar entre 10 minutos (bloque simple sin iteraciones) y
varios días (bloque complejo con múltiples iteraciones). No hay
presión de tiempo: el principio es "cerrar cuando esté realmente
terminado".
