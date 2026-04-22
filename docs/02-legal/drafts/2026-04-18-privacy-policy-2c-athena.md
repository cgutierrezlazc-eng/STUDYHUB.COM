---
documento: Política de Privacidad — borrador de modificaciones
version_actual: 2.1 (vigente, "Última actualización: 11 de abril de 2026")
version_propuesta: 2.2 (MINOR — aclaraciones y nueva sub-finalidad explícita)
fecha_borrador: 2026-04-18
autor_borrador: legal-docs-keeper (agente)
disparador: Sub-bloque 2c "Athena IA" introduce procesamiento automatizado
            adicional de contenido del usuario con Anthropic como encargado.
estado: BORRADOR — NO publicar sin revisión de Cristian + validación de abogado.
---

# Borrador de modificaciones — Política de Privacidad v2.1 → v2.2 (Athena IA)

## Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere validación
de abogado antes de su aplicación al producto en producción.

## Contexto del cambio

El sub-bloque 2c implementa "Athena IA", un asistente dentro del panel de
workspaces que procesa:

- Título del documento y materia/curso (ya declarados por el usuario)
- Contenido del documento (texto académico libre escrito por el usuario)
- Mensajes del chat privado Athena (hasta 10 últimos mensajes del historial
  recortado, enviados como contexto en cada request)
- Staging text de sugerencias (texto que el usuario escribió y sobre el cual
  pide una propuesta de mejora)

Todos esos datos viajan a **Anthropic (Claude API)** en Estados Unidos. No
se envían explícitamente PII estructurada, contraseñas ni datos financieros,
pero el **contenido libre del usuario puede incluir datos personales
inadvertidos** (ej: el usuario escribe su nombre en sus apuntes, menciona a
terceros, incluye información sensible en un resumen).

La versión 2.1 vigente declara en §6 que Anthropic procesa "contenido
académico" para "generación de resúmenes, asistente de estudio". El
gap-finder del 2c detectó que esto es **insuficiente** para cubrir:

- Interacciones de chat privado (conversación persistente)
- Sugerencias de reescritura sobre staging propio del usuario
- Rate limits del servicio (Free vs Pro)
- Retención del historial de chat
- Base legal GDPR Art. 6(1)(b) y transferencia internacional Art. 46 con
  Anthropic como encargado distinto de Render/Vercel

## Cambios propuestos (diff-style)

### Cambio 1 — Encabezado / versión

**Archivo**: `src/pages/PrivacyPolicy.tsx` línea 115

```diff
- <p style={styles.date}>Última actualización: 11 de abril de 2026 · Versión 2.1</p>
+ <p style={styles.date}>Última actualización: 18 de abril de 2026 · Versión 2.2</p>
```

Al pie del documento (`src/pages/PrivacyPolicy.tsx` línea 821):

```diff
- Versión 2.1 — Abril 2026.
+ Versión 2.2 — Abril 2026.
```

### Cambio 2 — Sección 2.1 "Datos proporcionados por el usuario"

Agregar al final de la lista existente (después del bullet "Contenido del
usuario" actual en línea 209-211):

```diff
  <li>
    <strong>Contenido del usuario:</strong> documentos, apuntes y materiales subidos a la
    plataforma.
  </li>
+ <li>
+   <strong>Interacciones con asistentes inteligentes:</strong> mensajes
+   que usted envía al chat privado de Athena dentro de sus documentos,
+   selecciones de texto que solicita reescribir o analizar, y el historial
+   de dichas interacciones asociado a cada documento. Estas interacciones
+   son privadas por usuario: no son visibles para colaboradores del mismo
+   documento.
+ </li>
```

### Cambio 3 — Sección 3 "Finalidad del Tratamiento"

Agregar un bullet nuevo después del bullet "Prestación del servicio"
(línea 237-241):

```diff
  <li>
    <strong>Prestación del servicio:</strong> crear y gestionar su cuenta, procesar sus
    materiales de estudio y generar contenido personalizado con tecnologia inteligente.
  </li>
+ <li>
+   <strong>Asistencia inteligente sobre documentos (Athena):</strong>
+   procesar el contenido de los documentos y sus mensajes de chat privado
+   cuando usted invoca deliberadamente al asistente Athena, con el fin de
+   devolverle análisis, resúmenes, respuestas a preguntas y sugerencias
+   de reescritura sobre fragmentos específicos que usted seleccione. El
+   tratamiento se ejecuta únicamente cuando usted acciona la función; no
+   opera automáticamente sobre documentos inactivos.
+ </li>
```

### Cambio 4 — Sección 4.2 GDPR Art. 6 (base legal para Athena)

Este cambio no crea bullet nuevo: complementa el bullet existente
"Ejecución de contrato [Art. 6(1)(b)]" (línea 293-296). Propuesta:

```diff
  <li>
    <strong>Ejecución de contrato [Art. 6(1)(b)]:</strong> para la prestación del servicio
-   solicitado por el usuario.
+   solicitado por el usuario, incluido el procesamiento de los contenidos
+   que usted envía explícitamente al asistente Athena (documento, chat
+   privado, selecciones de texto para sugerencia) cuando dicha función
+   forma parte del plan contratado.
  </li>
```

Nota del borrador: se elige **6(1)(b) ejecución de contrato** y no 6(1)(a)
consentimiento, porque Athena es parte del servicio contratado y el
usuario lo invoca deliberadamente (no es tratamiento pasivo). **Abogado
debe confirmar este encuadre**, porque un regulador europeo podría sostener
que el envío a un subprocesador en EEUU requiere consentimiento explícito
adicional bajo ciertas condiciones. Incertidumbre abierta.

### Cambio 5 — Sección 6 "Compartición de Datos con Terceros" (Anthropic)

Reemplazar fila actual de Anthropic en la tabla (líneas 382-393):

```diff
  <tr>
    <td style={styles.td}>
      <strong>Anthropic</strong>
    </td>
    <td style={styles.td}>
-     Procesamiento automatizado de lenguaje natural (generación de resúmenes, asistente de
-     estudio)
+     Procesamiento automatizado de lenguaje natural para las funciones de
+     asistencia inteligente sobre documentos del usuario: generación de
+     resúmenes, análisis de documentos, chat privado por documento,
+     sugerencias de reescritura sobre fragmentos seleccionados, y otras
+     funciones equivalentes que se incorporen al asistente Athena.
    </td>
    <td style={styles.td}>
-     Contenido académico proporcionado por el usuario para su procesamiento
+     Título y materia del documento, contenido completo del documento
+     cuando usted lo envía a analizar, últimos mensajes del chat privado
+     de Athena asociado al documento (enviados como contexto en cada
+     consulta, con un máximo de los 10 mensajes más recientes), y el
+     texto específico que usted seleccione para pedir una sugerencia de
+     reescritura. No se envían contraseñas, tokens de sesión, datos de
+     pago ni metadatos de cuenta.
    </td>
  </tr>
```

### Cambio 6 — Sección 6 nota nueva sobre Anthropic y no-entrenamiento

Agregar inmediatamente después de la tabla (antes del párrafo "Conniku no
vende, alquila ni comparte..." en línea 421):

```diff
+ <p style={styles.p}>
+   <strong>Sobre Anthropic como encargado de tratamiento:</strong>
+   Anthropic (Anthropic PBC, con sede en San Francisco, Estados Unidos)
+   actúa como encargado de tratamiento de Conniku para las funciones de
+   asistencia inteligente. Conforme a los compromisos públicos de
+   Anthropic aplicables a sus API comerciales, el contenido enviado a
+   través de la API <strong>no se utiliza para entrenar sus modelos de
+   lenguaje</strong>. La transferencia internacional a Estados Unidos se
+   ampara en las salvaguardias descritas en la sección 14 de esta
+   política (Cláusulas Contractuales Tipo para usuarios UE/EEE,
+   medidas adecuadas para usuarios de Chile según Art. 5° Ley 19.628).
+ </p>
```

**Nota del borrador**: la afirmación "no se utiliza para entrenar" debe
ser verificada por Cristian contra el contrato de Anthropic vigente
(https://www.anthropic.com/legal) antes de publicar. Si el contrato
actual no lo garantiza, este párrafo se retira o se reformula.

### Cambio 7 — Sección 9 "Retención de Datos" (chat Athena)

Agregar un bullet nuevo después de "Post-eliminación" (línea 525-529):

```diff
  <li>
    <strong>Post-eliminación:</strong> tras la eliminación de su cuenta, conservaremos datos
    anonimizados o agregados por un período de 2 años para fines estadísticos. Los datos
    identificables serán eliminados dentro de los 30 días siguientes a la solicitud.
  </li>
+ <li>
+   <strong>Historial de chat con Athena:</strong> los mensajes del chat
+   privado de Athena asociados a un documento se conservan mientras el
+   documento exista en su cuenta. Al eliminar un documento, el historial
+   de chat asociado se elimina en cascada de manera automática. Usted
+   también puede borrar manualmente todo el historial de chat de un
+   documento desde el propio panel de Athena, sin eliminar el documento.
+   Las sugerencias de reescritura resueltas (aplicadas, modificadas o
+   rechazadas) se conservan como registro histórico del documento bajo
+   el mismo criterio.
+ </li>
+ <li>
+   <strong>Métricas de uso de Athena:</strong> la tabla interna de
+   cuotas (cantidad de consultas diarias al asistente) se conserva por
+   tiempo indefinido en forma de contador agregado por usuario, sin el
+   contenido procesado. Esta información se utiliza exclusivamente para
+   aplicar los límites por plan descritos en los Términos y Condiciones.
+ </li>
```

**Nota del borrador**: el plan original de 2c **no define un plazo máximo
de retención** automática del chat (solo cascade vía eliminación del
workspace o borrado manual por el usuario). El texto propuesto es honesto
sobre ese hecho, no inventa un plazo que el código no implementa. Si
Cristian quiere comprometerse a un plazo (p.ej. "máximo 24 meses"), se
requiere **cambio de código** (job periódico, campo `expires_at`) antes
de que este borrador pueda declararlo.

### Cambio 8 — Sección 14 "Transferencias Internacionales" (Anthropic)

Modificar el párrafo introductorio de §14 (línea 788-791):

```diff
- Conniku transfiere datos personales a servidores ubicados en Estados Unidos (Render,
- Vercel). Para garantizar la protección de sus datos en estas transferencias:
+ Conniku transfiere datos personales a servidores ubicados en Estados
+ Unidos (Render, Vercel, y Anthropic cuando usted invoca funciones de
+ asistencia inteligente). Para garantizar la protección de sus datos en
+ estas transferencias:
```

## Cambios NO propuestos (y por qué)

- **No se modifica §10 "Menores de Edad"** (16 años). Es un desfase
  preexistente al 2c (ya señalado en el reporte legal-docs-keeper inicial
  del 2026-04-17) y debe resolverse en su propio borrador, no mezclado
  con el cambio de Athena. CLAUDE.md exige "un commit, una intención".

- **No se modifica §8 "Cookies"**. El 2c no introduce cookies nuevas ni
  almacenamiento local nuevo (el chat persiste en backend Supabase, no en
  localStorage).

- **No se declara plazo fijo de retención del chat Athena**. Declararlo
  mentiría: el código actual no lo impone. Solo se declara el
  comportamiento real (cascade + borrado manual usuario).

## Siguiente versionado propuesto

v2.1 → **v2.2** (MINOR). No cambia derechos del usuario, solo:

- Aclara finalidades (Athena no es categoría nueva de dato; es uso más
  específico del contenido del usuario)
- Declara explícitamente un encargado ya existente (Anthropic) en sus
  nuevos casos de uso
- Declara retención real del chat (cascade + borrado manual)
- Declara transferencia internacional a Anthropic (ya existía a Render y
  Vercel)

**Notificación al usuario sugerida**: banner in-app + envío por Zoho a
usuarios activos, 15 días antes de vigencia, según §11 de la política
vigente. No requiere re-aceptación forzada porque es MINOR.

## Trazabilidad

- Versión anterior (v2.1) queda archivada en
  `docs/legal/archive/privacy-policy-v2.1-2026-04-11.md` una vez que
  Cristian publique v2.2. La captura del archivo archivado es tarea de
  un bloque posterior (scaffolding `docs/legal/archive/` aún no existe).

- Hash SHA-256 del texto v2.2 debe recalcularse y guardarse para efectos
  de la tabla `user_agreements` (tabla que sigue pendiente según reporte
  inicial legal-docs-keeper 2026-04-17, §7).

## Declaración obligatoria (repetida al cierre)

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.
