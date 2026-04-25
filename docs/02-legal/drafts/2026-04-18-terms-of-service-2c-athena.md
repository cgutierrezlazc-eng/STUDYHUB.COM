---
documento: Términos y Condiciones — borrador de modificaciones
archivos_afectados:
  - src/pages/TermsOfService.tsx (página pública /terminos)
  - src/components/TermsOfService.tsx (modal de registro)
version_paginas_actual: sin versión numerada, "Última actualización: 8 de abril de 2026"
version_modal_actual: "Abril 2026 · Versión 2.0"
version_propuesta_unificada: v3.0 (MAJOR — clausula nueva que define
                            funcionalidad paga con límites, requiere
                            re-aceptación en próxima sesión del usuario)
fecha_borrador: 2026-04-18
autor_borrador: legal-docs-keeper (agente)
disparador: Sub-bloque 2c "Athena IA" — funcionalidad nueva con rate
            limits, sin cláusula en T&C vigentes.
estado: BORRADOR — NO publicar sin revisión de Cristian + validación de abogado.
---

# Borrador de cláusula "Funcionalidades Athena" para Términos y Condiciones

## Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere validación
de abogado antes de su aplicación al producto en producción.

## Alcance de este borrador

Sub-bloque 2c introduce "Athena IA" como funcionalidad del panel de
workspaces con cuotas diferenciadas por plan de suscripción:

- **Free**: 3 interacciones con Athena por día (`athena_workspace.limit: 3,
  window: daily` según `shared/tier-limits.json:44`)
- **Pro / Max**: ilimitado (`limit: -1`)
- Reset diario: las 06:00 hora Chile (constante `RESET_HOUR` del backend)

El gap-finder del 2c confirmó que **ninguna versión actual de T&C** menciona:

- La existencia del asistente Athena como funcionalidad contratada
- La cuota de 3/día en Free (potencial reclamo bajo Ley 19.496 Art. 12 letra
  b por "limitación no informada" si un usuario Free pretende uso ilimitado)
- El descargo de responsabilidad sobre exactitud de respuestas del asistente
  (riesgo particular cuando un estudiante toma una respuesta de Athena como
  correcta sin verificar)
- La persistencia del chat privado Athena y su eliminación por cascade
- La relación con Anthropic como proveedor tecnológico (referencia cruzada
  a la Política de Privacidad)

## Riesgo adicional identificado: doble versión de T&C

El reporte legal-docs-keeper del 2026-04-17 (§1.1) confirmó que Conniku
tiene **dos documentos distintos de T&C**:

- `src/pages/TermsOfService.tsx` — página pública `/terminos`, sin versión
  numerada, fechada "8 de abril de 2026"
- `src/components/TermsOfService.tsx` — modal del flujo de registro,
  identificado como "Versión 2.0 · Abril 2026"

**Ambos requieren el mismo cambio de cláusula** para evitar divergencia
mayor. Este borrador propone el texto único que debe aplicarse a ambos
archivos. La resolución de la divergencia estructural (fusionar o
mantener dos archivos sincronizados) es un bloque legal aparte.

## Cláusula nueva propuesta — "Funcionalidades Athena"

Ubicación sugerida dentro del documento: **nueva Sección 5.4** (dentro de
"Propiedad Intelectual") o alternativamente sección nueva numerada **"4
bis. Asistente inteligente Athena"** entre §4 Planes y Pagos y §5 Propiedad
Intelectual.

Recomendación: crear sección dedicada **"4 bis"** para dar visibilidad
propia y no sepultarlo dentro de otra cláusula. La numeración "4 bis"
respeta la estructura existente sin romper los enlaces internos a §5
"Propiedad Intelectual" y §6 "Uso Aceptable".

### Texto propuesto

```
═══════════════════════════════════════════════════════════════════════
4 bis. Asistente inteligente Athena

4 bis.1. Descripción del servicio

Athena es un asistente inteligente integrado en el panel de workspaces
de Conniku. Permite al usuario, sobre los documentos que él mismo crea
en la plataforma, solicitar análisis del contenido, generar resúmenes,
conversar en un chat privado asociado al documento, y recibir sugerencias
de reescritura sobre fragmentos de texto que el propio usuario seleccione.

Athena opera únicamente cuando el usuario la invoca deliberadamente
mediante el panel correspondiente. No procesa documentos en segundo
plano ni sin acción directa del usuario.

4 bis.2. Proveedor tecnológico

El procesamiento de lenguaje natural que hace posible Athena se apoya en
modelos de lenguaje operados por Anthropic PBC, actuando como encargado
de tratamiento de Conniku. Los datos enviados a Anthropic, su finalidad
y las salvaguardias aplicables están descritos en la Política de
Privacidad, secciones 6 y 14, que forma parte integrante de estos
Términos.

4 bis.3. Límites por plan

El uso de Athena está sujeto a límites en función del plan contratado
por el usuario:

- Plan Free: hasta 3 interacciones con Athena por día, contadas como la
  suma de análisis de documento, mensajes enviados al chat privado y
  solicitudes de sugerencia. La cuota se reinicia a las 06:00 hora de
  Chile de cada día.
- Plan Pro y plan Max: uso sin límite diario, sujeto a uso razonable y
  a las políticas técnicas de prevención de abuso descritas en §6 "Uso
  Aceptable".

El contador de uso se muestra al usuario en el propio panel de Athena.
Conniku se reserva el derecho de ajustar estos límites con notificación
previa de al menos 15 días, conforme a §10 de los presentes Términos.
El ajuste no afectará consumos ya realizados.

4 bis.4. Exactitud y responsabilidad sobre el contenido generado

Las respuestas, análisis, resúmenes y sugerencias que Athena devuelve al
usuario son herramientas de apoyo al estudio generadas mediante
procesamiento automatizado de lenguaje. Conniku no garantiza que dichos
contenidos sean exactos, completos, actualizados, ni adecuados para un
propósito académico específico.

El usuario es responsable de verificar la información entregada por
Athena antes de utilizarla en trabajos académicos, evaluaciones, tesis,
publicaciones o cualquier uso que tenga consecuencias. El usuario
reconoce que los modelos de lenguaje pueden producir respuestas
incorrectas, omisiones o afirmaciones imprecisas, y acepta que el uso
de Athena no lo releva de la obligación de verificar fuentes, revisar
contenido y aplicar su propio criterio académico.

Athena no reemplaza la consulta a profesores, tutores, manuales oficiales
ni literatura verificada. Conniku no será responsable de consecuencias
académicas, laborales, económicas o de cualquier otra naturaleza
derivadas del uso de contenido generado por Athena sin verificación
independiente del usuario.

4 bis.5. Privacidad del chat con Athena

El historial de chat con Athena asociado a un documento es privado del
usuario: no es visible para otros usuarios, aunque el documento se
comparta en modo colaborativo. El historial se conserva mientras el
documento exista en la cuenta del usuario. El usuario puede eliminar
manualmente el historial del chat en cualquier momento desde el propio
panel de Athena. La eliminación del documento borra automáticamente el
historial de chat asociado.

Las condiciones detalladas sobre el tratamiento, conservación y
eliminación de los datos enviados a Athena se describen en la Política
de Privacidad, que forma parte integrante de estos Términos.

4 bis.6. Uso aceptable de Athena

Además de las reglas de uso aceptable establecidas en §6, el usuario se
compromete a no utilizar Athena para:

- Generar contenido que se presente como obra propia del usuario con la
  intención de eludir normas de integridad académica de su institución.
  La responsabilidad por dicho uso recae exclusivamente en el usuario.
- Generar contenido ilegal, ofensivo, difamatorio o que vulnere derechos
  de terceros.
- Extraer datos de la plataforma mediante automatización del asistente.
- Intentar inducir al asistente a producir contenido que transgreda las
  políticas de uso de su proveedor tecnológico.

El incumplimiento podrá resultar en la suspensión de la funcionalidad
Athena o de la cuenta del usuario, sin derecho a reembolso, conforme a
§6 y §9.1.
═══════════════════════════════════════════════════════════════════════
```

## Cambios complementarios en cláusulas existentes

### Complemento en §2 "Objeto del Servicio"

Agregar mención explícita para que el objeto contratado incluya Athena:

```diff
  Conniku es una plataforma digital de estudio diseñada para estudiantes universitarios. El
  servicio permite organizar materias y proyectos académicos, generar resúmenes y material de
- estudio asistido por tecnologia inteligente, participar en comunidades académicas, conectar
+ estudio asistido por tecnologia inteligente (incluido el asistente Athena
+ descrito en la sección 4 bis), participar en comunidades académicas, conectar
  con tutores y compañeros, y acceder a herramientas de productividad académica, entre otras
  funcionalidades.
```

### Complemento en §5.2 "Contenido Generado Automaticamente"

El texto actual (líneas 166-172 de `src/pages/TermsOfService.tsx`) ya
contiene un descargo de responsabilidad genérico sobre contenido generado
automáticamente. El descargo específico de Athena (§4 bis.4 propuesto) es
más fuerte y específico; la §5.2 existente puede mantenerse como cláusula
general, pero se recomienda agregar una referencia cruzada:

```diff
  Los resúmenes, cuestionarios y demás contenido generado automaticamente a través de la
  plataforma son herramientas de apoyo al estudio. Conniku no garantiza la exactitud,
  completitud o idoneidad de dicho contenido. El usuario es responsable de verificar la
- información generada antes de utilizarla con fines académicos.
+ información generada antes de utilizarla con fines académicos. Para el
+ caso específico del asistente Athena, se aplican además las reglas de
+ §4 bis.4.
```

## Cambios NO propuestos (y por qué)

- **No se propone cambiar la edad mínima en §3** ("16 años" a "18 años").
  Es un desfase preexistente al 2c (también señalado en reporte legal
  2026-04-17) y pertenece a su propio borrador.

- **No se propone resolver la divergencia pages vs components**. Es
  scope mayor que requiere decisión arquitectónica previa de Cristian
  (¿se fusiona en una única fuente de verdad? ¿se mantiene doble con
  sincronización manual?). Este borrador ofrece el texto de la cláusula
  pero no decide por Cristian cómo propagarlo.

- **No se modifica §4 "Planes y Pagos"** para listar cuota Athena. Se
  deja en §4 bis.3 para no duplicar información que puede desincronizarse.

## Siguiente versionado propuesto

De "Versión 2.0" (actual del modal) a **"Versión 3.0"** (MAJOR) porque:

- Se incorpora cláusula de servicio con limitaciones cuantitativas
  (3 usos/día en Free)
- Se incorpora descargo de responsabilidad específico sobre exactitud
  del asistente inteligente, que podría afectar el derecho de reclamo
  de un usuario insatisfecho con una respuesta de Athena
- Por ambos puntos, se considera cambio que afecta la interpretación del
  contrato de servicio por parte del usuario, y por ende requiere
  **re-aceptación activa** en la próxima sesión del usuario

**Mecanismo de re-aceptación sugerido**:

- Detectar al login que el hash SHA-256 del T&C aceptado por el usuario
  es distinto del hash v3.0
- Mostrar modal no-descartable con diff resumido ("qué cambió") y botón
  "Acepto los nuevos términos"
- Registrar nueva fila en la tabla `user_agreements` (tabla pendiente de
  creación según reporte 2026-04-17 §3.3)
- Bloquear uso del panel Athena hasta re-aceptación

El mecanismo de re-aceptación es requisito de código a implementar como
bloque aparte (NO parte de este borrador). Sin él, el cambio v3.0 no
puede publicarse de forma jurídicamente sólida.

## Trazabilidad

- Texto exacto aceptado por cada usuario debe quedar registrado con hash
  SHA-256 para defensa probatoria en caso de disputa sobre qué versión
  aceptó cada usuario.
- Versión anterior (v2.0) queda archivada en
  `docs/legal/archive/tos-v2.0-2026-04.md` cuando Cristian publique v3.0.

## Declaración obligatoria (repetida al cierre)

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.
El descargo de responsabilidad de §4 bis.4 en particular debe ser
revisado por abogado especializado en Ley 19.496 (Chile) y — si aplica
a usuarios UE — en Directiva 2011/83/UE sobre derechos del consumidor,
para confirmar que la limitación de responsabilidad es exigible y no
abusiva.
