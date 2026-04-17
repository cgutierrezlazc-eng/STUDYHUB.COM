---
description: Panel de control del proyecto Conniku. Muestra todas las opciones disponibles (agentes, flujos, auditorías, chequeos, saneamiento, documentación). Acepta búsqueda por descripción en lenguaje natural.
allowed-tools: Task, Read, Grep, Glob, Bash, Edit, Write
---

Panel de control principal de Conniku. Sirve como acceso unificado a
todas las capacidades del sistema sin necesidad de recordar nombres
específicos de comandos o agentes.

## Filosofía del menú

Este comando tiene tres principios que lo distinguen de un simple
listado de opciones:

1. **Verificación experta antes de ejecutar.** Cuando eliges una
   opción, el asistente analiza si tu selección es la más adecuada
   para lo que describas. Si hay mejor opción o si falta combinar
   varias, te lo señala antes de proceder.

2. **Nunca avanzar con duda.** Si después de hacer las preguntas
   necesarias todavía hay ambigüedad sobre cómo proceder, el
   asistente consulta a un agente especializado (típicamente
   web-architect para decisiones de alcance, o legal-docs-keeper
   para aspectos legales) en lugar de adivinar.

3. **Preferir preguntar de más que construir mal.** El costo de
   una pregunta adicional es pocos segundos. El costo de construir
   algo mal y tener que rehacerlo es horas. Ante la duda: pregunta.

## Cómo se invoca este comando

Hay tres formas de usar /menu según tu situación:

### Forma 1: ver el panel completo

Escribe solo:
```
/menu
```

El asistente muestra el panel con todas las opciones organizadas en
6 grupos. Útil cuando no sabes qué necesitas y quieres explorar.

### Forma 2: describir lo que quieres hacer

Escribe /menu seguido de tu idea en lenguaje natural, como le dirías
a un colega:
```
/menu quiero agregar un botón nuevo a la página de login
/menu necesito ver el estado del proyecto antes de trabajar
/menu algo se rompió y no sé qué, ayúdame a diagnosticar
/menu tengo que actualizar la política de privacidad
```

El asistente analiza tu descripción, identifica qué grupo y opción
aplica, y te propone un plan. Tú decides si aceptas su propuesta o
si prefieres otra alternativa.

### Forma 3: invocar una opción específica directamente

Si ya sabes exactamente qué opción quieres, usa el número o el nombre:
```
/menu 1.3                 (número de la opción)
/menu backend-builder     (nombre del agente)
/menu auditoria-integral  (nombre del flujo)
```

El asistente invoca esa opción específica, pero antes de ejecutar
pasa por la verificación experta (ver protocolo más abajo).

## Cuándo usar cada forma

- **Forma 1 (panel)**: cuando estás explorando o quieres ver qué
  hay disponible. Útil al empezar el día o al comenzar una tarea
  grande.

- **Forma 2 (descripción natural)**: cuando tienes claro qué
  resultado buscas pero no sabes qué agente o flujo usar. Es la
  forma recomendada si dudas entre varias opciones.

- **Forma 3 (invocación directa)**: cuando eres experto en el
  sistema y ya sabes qué necesitas. Eficiente pero requiere
  conocer las opciones.

## El panel de control (lo que verás al escribir /menu)

Cuando invocas /menu sin argumentos, el asistente presenta este
panel. Cópialo tal cual lo ves aquí; es lo que aparecerá en tu
pantalla.

```
================================================================
PANEL DE CONTROL CONNIKU
================================================================
Para elegir: escribe /menu seguido del número o del nombre.
Para describir: escribe /menu seguido de tu idea en palabras.
================================================================


GRUPO 1: TRABAJAR CON AGENTES (uno a la vez)
Son los 8 asistentes especializados. Cada uno hace una cosa.
----------------------------------------------------------------

  1.1  web-architect
       Piensa y planifica antes de construir. No escribe código,
       solo hace el plan detallado de qué hay que hacer y en qué
       orden.
       Ejemplo: cuando quieres una funcionalidad nueva y no sabes
       por dónde empezar, este agente hace el plan.

  1.2  frontend-builder
       Construye las pantallas que ve el usuario: botones, formas,
       páginas, lo que se muestra en el navegador.
       Ejemplo: agregar un botón nuevo, cambiar el diseño de una
       página, hacer que el login funcione distinto.

  1.3  backend-builder
       Construye el servidor invisible que procesa datos: guarda
       en base de datos, hace cálculos, manda correos, integra con
       otros servicios.
       Ejemplo: agregar un endpoint para exportar reportes, crear
       la tabla de usuarios, hacer el cálculo de facturación.

  1.4  qa-tester
       Prueba que todo funcione de verdad. No basta con que el
       código compile, este agente verifica que el usuario pueda
       hacer lo que necesita en la interfaz real.
       Ejemplo: confirmar que después de construir algo nuevo,
       el formulario realmente guarda los datos correctamente.

  1.5  code-reviewer
       Revisa el código con mirada crítica como si fuera un
       evaluador externo. Busca errores, problemas de seguridad,
       código mal hecho. Da nota del 0 al 100.
       Ejemplo: antes de hacer commit, revisar si hay problemas
       que se te escaparon.

  1.6  truth-auditor
       Verifica si lo que los otros agentes dijeron que hicieron
       es cierto. Es la capa de control final antes de cerrar
       una tarea.
       Ejemplo: después de que varios agentes trabajaron en una
       tarea, confirmar que todo está realmente bien antes de
       dar por terminado.

  1.7  gap-finder
       Busca lo que falta o se rompió en todo el proyecto.
       Encuentra cosas que nadie más notaría: archivos huérfanos,
       tests faltantes, backups que no se hicieron.
       Ejemplo: revisión periódica general para ver qué hay que
       mantener.

  1.8  legal-docs-keeper
       Revisa si los documentos legales (términos, privacidad,
       cookies) están al día con lo que el producto realmente
       hace. No reemplaza a un abogado.
       Ejemplo: agregaste una integración nueva y no sabes si la
       política de privacidad lo refleja.


GRUPO 2: FLUJOS PREDEFINIDOS (varios agentes en orden)
Son combinaciones probadas de agentes que se ejecutan en secuencia.
----------------------------------------------------------------

  2.1  flujo-tdd-completo
       Encadena los 5 pasos principales: planificar, construir,
       probar, revisar, auditar. Es el flujo robusto recomendado
       para tareas nuevas de tamaño mediano o grande.
       Ejemplo: agregar una pantalla completa con su backend.

  2.2  flujo-rapido
       Saltea los pasos de revisión formal. Va directo: construir
       y verificar. Úsalo solo para cambios pequeños y seguros.
       Ejemplo: corregir un texto mal escrito en una pantalla.

  2.3  flujo-legal
       Como el flujo-tdd-completo pero con el agente legal activo
       desde el inicio. Incluye aprobación humana obligatoria
       antes de cerrar.
       Ejemplo: cualquier cambio que toque términos y condiciones,
       precios, o manejo de datos de usuarios.

  2.4  flujo-refactor
       Para cambios en código que ya funciona pero está mal
       hecho. Incluye análisis estructural antes de modificar.
       Ejemplo: reorganizar archivos, cambiar nombres de
       funciones, simplificar lógica complicada.

  2.5  flujo-hotfix
       Modo emergencia. Va rápido sin todas las verificaciones.
       Solo para cuando algo está roto en producción y no puede
       esperar.
       Ejemplo: el pago no está funcionando y los usuarios no
       pueden suscribirse. Arreglar ya.

  2.6  cerrar-bloque
       Ejecuta el protocolo formal de 7 capas para cerrar un módulo
       completamente. Incluye verificación con todos los agentes,
       deploy a preview, inspección tuya en la web online, y cierre
       final con protección en FROZEN.md.
       Ejemplo: después de construir un módulo completo que ya
       funciona y quieres marcarlo como terminado para siempre.


GRUPO 3: AUDITORÍAS (revisar cómo está el sistema)
Son distintos tipos de revisión enfocada.
----------------------------------------------------------------

  3.1  auditoria-codigo
       Revisa el código de los cambios recientes de la rama
       actual. Da nota numérica.
       Ejemplo: antes de hacer merge a la rama principal.

  3.2  auditoria-estructural
       Revisa todo el sistema de una vez: archivos huérfanos,
       cobertura de tests, configuración, dependencias. Es más
       amplia que auditoria-codigo.
       Ejemplo: revisión mensual general.

  3.3  auditoria-legal
       Revisa si los documentos legales están sincronizados
       con lo que el código hace.
       Ejemplo: antes de lanzar una feature nueva al público.

  3.4  auditoria-seguridad
       Revisión enfocada solo en aspectos de seguridad:
       credenciales, validaciones, permisos, exposición de datos.
       Ejemplo: antes de un lanzamiento público.

  3.5  auditoria-tests
       Revisa cuánto código está cubierto por tests y dónde faltan
       pruebas.
       Ejemplo: para saber si la suite de pruebas es confiable.

  3.6  auditoria-integral
       Ejecuta auditoria-codigo + auditoria-estructural +
       auditoria-legal en secuencia. Es la revisión más completa.
       Ejemplo: antes de un hito mayor del proyecto.


GRUPO 4: CHEQUEOS RÁPIDOS (ver estado sin ejecutar tareas)
Son consultas que no modifican nada, solo informan.
----------------------------------------------------------------

  4.1  estado-proyecto
       Muestra un resumen completo: rama actual, últimos cambios,
       agentes instalados, archivos protegidos, salud del sistema.
       Ejemplo: al inicio del día para orientarse.

  4.2  salud-dependencias
       Verifica que las herramientas críticas (TypeScript, Ruff,
       Mypy, etc.) estén instaladas y en versiones compatibles.
       Ejemplo: cuando algo no funciona y no sabes si falta una
       herramienta.

  4.3  archivos-frozen
       Lista los archivos protegidos con su fecha y razón.
       Ejemplo: para decidir si un archivo ya se puede descongelar.

  4.4  historial-commits
       Muestra los últimos 20 cambios del proyecto con quién los
       hizo y qué cambió.
       Ejemplo: para ver qué se modificó recientemente.

  4.5  tareas-pendientes
       Lista los planes hechos pero no implementados y los issues
       abiertos del registro.
       Ejemplo: para decidir qué trabajar en la sesión de hoy.

  4.6  bloques-cerrados
       Lista los módulos ya terminados del proyecto (desde BLOCKS.md).
       Muestra cuándo se cerraron, cuántas iteraciones tomaron, y
       qué incluyen.
       Ejemplo: para ver el historial de logros del proyecto.

  4.7  bloque-en-progreso
       Detecta si hay un bloque/módulo actualmente en construcción
       y muestra su estado: en qué capa está, cuánto falta, qué
       iteraciones lleva.
       Ejemplo: al inicio del día para retomar donde quedaste.


GRUPO 5: SANEAMIENTO (limpiar o arreglar cosas)
Acciones que modifican el sistema. Piden confirmación antes de
ejecutar porque pueden ser irreversibles.
----------------------------------------------------------------

  5.1  limpiar-lock
       Elimina el archivo que marca la sesión activa. Solo usar
       si sabes que no hay otra sesión real trabajando.
       Ejemplo: cuando abriste una nueva sesión y dice que hay
       otra activa, pero cerraste todo.

  5.2  regenerar-frozen
       Fuerza la actualización de la lista de archivos protegidos
       desde FROZEN.md. Útil si algo quedó desincronizado.
       Ejemplo: después de editar FROZEN.md manualmente sin pasar
       por el asistente.

  5.3  rotar-logs
       Achica los archivos de registro si se han hecho muy grandes.
       Ejemplo: si notas que el directorio de logs está ocupando
       mucho espacio.

  5.4  validar-config
       Revisa que el archivo de configuración principal
       (settings.json) esté bien formado y los scripts tengan
       permisos correctos.
       Ejemplo: si los hooks no se están ejecutando y sospechas
       un problema de configuración.

  5.5  reinstalar-permisos
       Vuelve a aplicar permisos de ejecución a los scripts de
       la capa mecánica. Útil después de restaurar un backup.
       Ejemplo: si los scripts aparecen pero no se ejecutan.


GRUPO 6: DOCUMENTACIÓN Y REGISTRO (consultar información)
Son consultas a documentos del proyecto.
----------------------------------------------------------------

  6.1  ver-claude-md
       Muestra el archivo CLAUDE.md completo o una sección
       específica. Es el documento maestro del sistema.
       Ejemplo: para consultar la filosofía, convenciones, o
       las matrices de puntuación.

  6.2  deuda-tecnica
       Lista los problemas conocidos que están documentados pero
       aún no se arreglaron. Muestra contexto de cada uno.
       Ejemplo: para decidir qué deuda vale la pena atender.

  6.3  log-sesiones
       Muestra el historial reciente de sesiones de trabajo:
       cuándo se abrieron, cuándo se cerraron, si hubo flags
       activos.
       Ejemplo: para diagnosticar problemas con locks o flags
       que no se limpiaron.

  6.4  historial-frozen
       Muestra la historia de cambios del archivo FROZEN.md
       con fechas. Útil para auditoría.
       Ejemplo: para ver cuándo se protegió cada archivo y quién
       decidió protegerlo.

  6.5  historial-inspecciones
       Muestra las iteraciones de inspección humana de todos los
       bloques. Útil para ver qué tipo de problemas se detectan
       típicamente en Capa 6.
       Ejemplo: aprender patrones de mejora para futuros bloques.

  6.6  estadisticas-bloques
       Calcula métricas del sistema modular: promedio de iteraciones
       por bloque, tiempo promedio de cierre, ratio de bloques
       cerrados a la primera, frecuencia de hotfixes.
       Ejemplo: evaluar salud general del proceso de desarrollo.

================================================================
```

## Protocolo de conversación guiada

Este protocolo define cómo el asistente debe comportarse cuando
recibe cualquier invocación de /menu. Es el núcleo del comando y
lo que lo distingue de un listado simple.

### Flujo de 4 pasos

Cada vez que se invoca /menu, el asistente pasa por estos 4 pasos
en orden estricto.

#### Paso 1: Interpretar la invocación

Identificar cuál de los 3 casos de uso aplica:

- **Caso A (panel completo):** invocación es solo `/menu` sin
  argumentos adicionales. Mostrar el panel tal cual está arriba.
  Después del panel, terminar la respuesta y esperar la siguiente
  interacción.

- **Caso B (descripción natural):** invocación tiene argumentos
  que no son un número ni un nombre de opción. Es una frase en
  lenguaje natural. Por ejemplo: `/menu quiero agregar un botón
  nuevo`. Pasar al Paso 2 (análisis de descripción).

- **Caso C (invocación directa):** invocación tiene un número
  (ejemplo: `/menu 1.3`) o un nombre reconocible de opción
  (ejemplo: `/menu backend-builder`). Pasar al Paso 2
  (verificación de selección).

#### Paso 2: Analizar y pedir contexto

Según el caso identificado:

**Para Caso B (descripción natural):**
- Leer la descripción del usuario
- Identificar qué grupo(s) del panel podrían aplicar
- Identificar qué opción(es) específica(s) parecen más relevantes
- Determinar nivel de confianza (alta, media, baja)

Si la confianza es alta o media, pasar al Paso 3.

Si la confianza es baja, antes del Paso 3 hacer preguntas de
clarificación al usuario. Ejemplos de preguntas útiles:
- "¿Es un cambio visible al usuario o algo del servidor?"
- "¿El cambio toca datos de usuarios o procesamiento de pagos?"
- "¿Es una funcionalidad nueva o arreglar algo que ya existe?"
- "¿Tiene urgencia (producción rota) o puede seguir flujo normal?"

Hacer hasta 3 preguntas por vez. Si después de 3 preguntas sigue
habiendo ambigüedad, invocar al web-architect para consulta
experta (ver sección "Escalamiento con agentes" más abajo).

**Para Caso C (invocación directa):**
- Confirmar la opción elegida
- Preguntar al usuario: "Elegiste [opción X]. Antes de proceder,
  cuéntame brevemente qué quieres hacer para verificar que esta
  opción es la más adecuada para tu caso."
- Esperar respuesta del usuario
- Cuando responda, analizar si la opción elegida es la correcta
  para lo que describe

#### Paso 3: Verificación experta y recomendación

Con el análisis del Paso 2, emitir recomendación al usuario.

La recomendación debe incluir:

1. **Confianza del análisis** (alta, media, baja)
2. **Lo que se requiere según descripción del usuario**
3. **Si la opción seleccionada (Caso C) cubre lo requerido o no**
4. **Propuesta concreta**: ejecutar opción original, cambiar por
   otra, combinar varias, o hacer más preguntas primero

Ejemplo de recomendación con confianza media:

```
Análisis de tu descripción:
Confianza: media

Lo que describes requiere:
  - Una pantalla nueva (frontend)
  - Un endpoint que traiga los datos (backend)
  - Un plan de cómo integrarlos

Tu selección original (1.3 backend-builder) cubre solo el
segundo punto. Faltan los otros dos.

Mi recomendación: usar la opción 2.1 (flujo-tdd-completo) que
encadena los tres agentes en orden correcto. Así garantizamos
que las partes se integren bien desde el inicio y no tengas que
rehacer.

Alternativas válidas:
  A) Opción 2.1 (flujo-tdd-completo) - mi recomendación
  B) Opción 1.1 (web-architect) primero, para ver el plan antes
     de decidir si usar 1.2 y 1.3 por separado
  C) Mantener tu selección original 1.3 y tú te encargas del
     frontend después

¿Cuál prefieres? Si tienes duda, puedo explicarte más sobre
alguna alternativa.
```

**Detección de "módulo terminado":** si en la descripción del usuario
aparecen frases como "ya está listo", "terminé el módulo", "todo
funciona", "quiero cerrar X", el asistente debe recomendar invocar
/cerrar-bloque en lugar de continuar construyendo. La recomendación
específica es:

"Parece que el módulo '$NOMBRE' está listo para cierre formal. Te
recomiendo invocar /cerrar-bloque $NOMBRE que ejecuta el protocolo
completo de 7 capas: revisión, verificación, deploy a preview, y
tu inspección en la web online antes del cierre final."

#### Paso 4: Confirmación y ejecución

Recibir la decisión del usuario sobre la recomendación.

Tres comportamientos posibles:

1. **Si acepta la recomendación:** proceder a ejecutar la opción
   recomendada. Antes de llamar al agente, hacer un resumen final:
   "Voy a proceder con [opción X] para [descripción]. Empezando
   ahora."

2. **Si elige una alternativa:** aceptar la elección, siempre que
   no tenga problemas obvios. Si la elección del usuario tiene
   problemas previsibles (por ejemplo, elegir un flujo-rapido
   para algo complejo que requiere revisión formal), explicar el
   riesgo y pedir confirmación explícita.

3. **Si pide más información o clarificación:** dar la información
   y volver al Paso 3 con recomendación refinada.

Solo después de confirmación explícita del usuario, proceder a
ejecutar la opción.

### Niveles de confianza

El asistente debe declarar explícitamente su nivel de confianza
en cada recomendación. Tres niveles:

- **Confianza alta:** la descripción del usuario apunta claramente
  a una opción específica sin ambigüedad. El asistente puede
  recomendar con seguridad.
  Ejemplo: usuario dice "quiero ver el estado del proyecto" →
  opción 4.1 (estado-proyecto), confianza alta.

- **Confianza media:** la descripción apunta a un grupo pero hay
  varias opciones viables dentro. O la descripción requiere
  combinar opciones y el asistente tiene claro cuáles.
  Ejemplo: usuario dice "quiero agregar una pantalla con datos
  del servidor" → flujo que combine 1.1 + 1.2 + 1.3, confianza
  media.

- **Confianza baja:** la descripción es ambigua, vaga, o podría
  interpretarse de varias formas con implicaciones distintas.
  Ejemplo: usuario dice "arregla lo que está mal" sin especificar
  qué está mal → confianza baja, requiere preguntar.

Cuando confianza es baja, el asistente NUNCA procede directo a
ejecución. Siempre hace preguntas de clarificación o invoca a
otro agente.

### Escalamiento con agentes

Cuando el asistente no puede alcanzar claridad por sí solo,
invoca a un agente especializado para consulta. Los casos
típicos de escalamiento son:

- **Consultar a web-architect** cuando:
  * Hay duda entre varias opciones de agentes o flujos
  * El requerimiento requiere arquitectura no trivial
  * Hay trade-offs entre alternativas (performance vs simplicidad)
  * El alcance del cambio no está claro

- **Consultar a legal-docs-keeper** cuando:
  * El requerimiento menciona términos, precios, datos personales,
    cookies, reembolsos, menores de edad, publicidad, o cualquier
    tema legal
  * No está claro si algún cambio afecta documentos legales

- **Consultar a gap-finder** cuando:
  * El requerimiento menciona "arreglar algo que está mal" sin
    especificar qué
  * Hay síntomas pero no causa raíz identificada
  * Se sospecha problema estructural del sistema

- **Consultar a truth-auditor** cuando:
  * Un agente anterior reportó resultado pero Cristian no está
    convencido de que sea correcto
  * Hay inconsistencia entre lo que el código hace y lo que se
    afirmó en un reporte

El flujo de escalamiento es:

1. Asistente declara al usuario: "Voy a consultar al [agente]
   para obtener mejor claridad antes de recomendar."
2. Invoca al agente pasándole la descripción del usuario y el
   contexto relevante
3. Recibe el análisis del agente
4. Refina la recomendación con esa información
5. Vuelve al Paso 3 del flujo principal

### Memoria de decisiones

El asistente mantiene un registro de las decisiones pasadas en
`.claude/logs/menu-decisions.log`. El formato es:

```
[YYYY-MM-DD HH:MM:SS] Descripción del usuario | Recomendación |
                       Elección final | Resultado
```

Antes de cada nueva recomendación, el asistente consulta este
log buscando decisiones similares previas para:

- Identificar patrones de decisión del usuario
- Ajustar recomendaciones según preferencias observadas
- Reducir repetición de preguntas sobre temas ya discutidos

El log se rota automáticamente si supera 1000 líneas.

### Filosofía: nunca avanzar con duda

Este es el principio rector del comando. Se aplica en los
siguientes casos:

**Si Cristian insiste en una opción que el asistente considera
incorrecta:**
- Respetar la decisión final de Cristian (él tiene autoridad)
- Antes de ejecutar, hacer explícitos los riesgos previsibles
- Pedir confirmación explícita: "Entiendo que prefieres la
  opción X aunque recomendé Y. Antes de proceder, confirmo que
  los riesgos Z son aceptables para ti"
- Registrar la decisión en el log con nota de divergencia

**Si el asistente detecta ambigüedad irreducible:**
- Explicar al usuario qué específicamente no está claro
- Proponer preguntas concretas que ayudarían a resolver
- Si después de todas las preguntas sigue habiendo ambigüedad,
  invocar al agente especializado

**Si el usuario parece impaciente:**
- No ceder a la impaciencia. Es mejor retrasar 5 minutos que
  construir mal.
- Explicar brevemente por qué la pregunta vale la pena: "Sé que
  estamos ahondando, pero esto evita que después tengamos que
  rehacer X"
- Si la impaciencia es extrema, ofrecer salida segura: "Si
  prefieres, puedo usar la opción que me diste sin más
  verificaciones, pero sería bajo tu responsabilidad."

### Casos especiales

**Invocación /menu sin argumentos:** mostrar solo el panel.
No hacer preguntas adicionales. El usuario está explorando.

**Invocación a opciones del Grupo 5 (saneamiento):** siempre
preguntar confirmación explícita antes de ejecutar, sin
excepciones. Son acciones destructivas o irreversibles.

**Invocación a opciones del Grupo 4 (chequeos rápidos):** no
requieren tarea específica. Ejecutar directamente sin preguntar
"qué quieres hacer". Solo para estos casos se puede saltar el
Paso 2.

**Invocación ambigua o malformada:** si el usuario escribe algo
como `/menu asdf` o `/menu 99.99`, no adivinar. Responder: "No
reconozco esa opción. ¿Quieres ver el panel completo con /menu
sin argumentos? ¿O describir qué quieres hacer en lenguaje
natural?"

**Detección de bloque en progreso:** al invocar /menu o cualquier
opción de construcción (Grupos 1 o 2), el asistente debe verificar
si hay un bloque actualmente en progreso (rama preview- existe, o
declaración en sesión). Si existe:

1. Preguntar: "Hay un bloque '$NOMBRE' en progreso desde $FECHA.
   ¿Quieres cerrarlo primero con /cerrar-bloque antes de empezar
   algo nuevo?"
2. Esperar decisión explícita
3. Si decide cerrar: invocar /cerrar-bloque $NOMBRE
4. Si decide continuar con algo nuevo: advertir que el bloque
   anterior queda como "en progreso" y debe cerrarse después
5. No proceder sin decisión clara

Esto implementa el Principio 1 de CLAUDE.md Sección 18 (un bloque
a la vez).
