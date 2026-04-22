---
documento: "Política de Privacidad"
version: "2.4.2"
vigencia_desde: "2026-04-23"
vigencia_hasta: "actual"
hash_texto_canonico: "se_calcula_al_final"
changelog:
  - "v2.4.2 (2026-04-23): agregado canal de sandbox público de vista previa (§2ter) con declaración de registro real en cookie_consents + document_views y origin='sandbox'; agregado sistema de feedback de ayuda (§2quater) con tabla support_feedback, retención 2 años y pseudonimización a 12 meses bajo GDPR Art. 6(1)(f) interés legítimo + Art. 5(1)(c) minimización; enumerado tratamiento document_views (Bloque legal-viewer-v1) en §2.2 y §9."
  - "v2.4.1 (2026-04-22): agregado sistema de tickets de contacto (/contacto) con routing por motivo, retención 5 años (Art. 17(3)(e) GDPR + Art. 2515 CC Chile + Ley 19.496 Art. 50), bidireccionalidad desde panel admin con remitente noreply@ y Reply-To contacto@. Confirmación y ampliación de Zoho Mail como encargado de tratamiento para el canal email."
  - "v2.4.0 (2026-04-20): documento canónico autocontenido post auditoría externa, edits H-01/H-12/§5.3."
---

# Política de Privacidad

Última actualización: 23 de abril de 2026 · Versión 2.4.2

En Conniku SpA (en adelante, "Conniku", "nosotros" o "la empresa"), nos comprometemos a proteger la privacidad y los datos personales de nuestros usuarios conforme a la normativa vigente en cada jurisdicción donde operamos:

**Normativa aplicable según jurisdicción:**

- **Chile:** Ley N° 19.628 sobre Protección de la Vida Privada · Ley N° 21.096
- **Unión Europea / EEE:** Reglamento General de Protección de Datos (RGPD / GDPR) — Reglamento UE 2016/679
- **Brasil:** Lei Geral de Proteção de Dados Pessoais (LGPD) — Lei N° 13.709/2018
- **California, EE.UU.:** California Consumer Privacy Act (CCPA) · California Privacy Rights Act (CPRA)
- **México:** Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)
- **Argentina:** Ley N° 25.326 de Protección de Datos Personales

---

## 1. Responsable del Tratamiento de Datos

El responsable del tratamiento de sus datos personales es:

- **Razón social:** Conniku SpA
- **RUT:** 78.395.702-7
- **Domicilio:** Antofagasta, Chile
- **Sitio web:** [conniku.com](https://conniku.com)
- **Correo de privacidad:** [privacidad@conniku.com](mailto:privacidad@conniku.com)
- **Correo de contacto:** [contacto@conniku.com](mailto:contacto@conniku.com)

Para consultas sobre privacidad, ejercicio de derechos y cualquier requerimiento relacionado con el tratamiento de sus datos personales, diríjase a [privacidad@conniku.com](mailto:privacidad@conniku.com).

---

## 2. Datos Personales Recopilados

Recopilamos las siguientes categorías de datos personales:

### 2.1. Datos proporcionados por el usuario

- **Datos de identificación:** nombre completo, correo electrónico, foto de perfil.
- **Datos académicos:** universidad, carrera, año de ingreso.
- **Datos de perfil:** biografía, intereses académicos, idiomas.
- **Contenido del usuario:** documentos, apuntes y materiales subidos a la plataforma.
- **Interacciones con asistentes inteligentes:** mensajes que usted envía al chat privado de Athena dentro de sus documentos, selecciones de texto que solicita reescribir o analizar, y el historial de dichas interacciones asociado a cada documento. Estas interacciones son privadas por usuario: no son visibles para colaboradores del mismo documento.
- **Documentos exportados:** cuando usted solicita exportar un documento de Workspaces a PDF o DOCX, el contenido del documento es procesado por nuestros servidores para generar un archivo descargable. Ese archivo se entrega a su dispositivo y, una vez descargado, queda fuera del control de Conniku: usted es el único responsable de su almacenamiento, distribución, copias, respaldo y eliminación posterior.
- **Tickets de contacto:** cuando usted envía un mensaje a través del formulario público de contacto (`/contacto`), recopilamos su nombre, correo electrónico, motivo seleccionado, organización (opcional), el contenido de su mensaje y el hash de la versión de esta Política de Privacidad que usted marcó como aceptada en ese momento. El tratamiento específico de este canal se describe en la Sección 2bis.
- **Feedback de soporte:** cuando usted interactúa con el widget de ayuda 👍/👎 debajo de una pregunta frecuente del centro de soporte, o completa el comentario opcional asociado a un 👎, recopilamos su valoración (útil / no útil), el identificador estable de la pregunta (`faq_id`), el comentario textual si usted lo escribe, y los metadatos técnicos descritos en la Sección 2quater. El detalle específico de este tratamiento se describe en la Sección 2quater.

### 2.2. Datos recopilados automáticamente

- **Datos de uso:** actividad de estudio, tiempo en la plataforma, funcionalidades utilizadas, progreso en rutas de aprendizaje.
- **Datos de gamificación:** puntos, rachas de estudio, logros, nivel del usuario.
- **Datos técnicos:** dirección IP, tipo de navegador, sistema operativo, dispositivo utilizado.
- **Datos de comunicación:** mensajes enviados a través de la plataforma (entre usuarios y al soporte).
- **Registro de lectura de documentos legales:** cuando usted abre cualquiera de los documentos legales publicados (Términos, Política de Privacidad, Política de Cookies, Declaración de Mayoría de Edad) desde cualquier canal (producto logueado, landing público, sandbox de vista previa o modal in-app), registramos un evento `document_views` que captura el identificador del documento, el hash SHA-256 de la versión leída, un identificador pseudónimo de visitante (`session_token`, UUID v4 sin PII directa), un indicador booleano de "llegó al final del scroll" y la marca de tiempo UTC. Este registro existe para demostrar la trazabilidad de la lectura en caso de disputa (GDPR Art. 7(1)) y no se cruza con datos de marketing.

---

## 2bis. Sistema de tickets de contacto (canal `/contacto`)

El formulario público de contacto disponible en `conniku.com/contacto` permite a cualquier persona, sea o no titular de una cuenta, enviar un mensaje al equipo de Conniku SpA. Cada envío genera un ticket de contacto que es la unidad de registro y seguimiento de la conversación.

### 2bis.1. Datos recolectados por ticket

En el momento en que usted envía el formulario, recopilamos y almacenamos:

- **Datos declarados por usted:** nombre, correo electrónico, motivo seleccionado (comercial, universidad, prensa, legal, seguridad u otro), organización (campo opcional) y el contenido del mensaje.
- **Metadatos técnicos de envío:** dirección IP pública, User-Agent del navegador (truncado a 512 caracteres por minimización conforme al Art. 5(1)(c) GDPR) y zona horaria declarada por su navegador cuando la envía.
- **Evidencia de consentimiento:** versión vigente de esta Política de Privacidad, hash SHA-256 del texto aceptado, y timestamp UTC del momento en que usted marcó el checkbox de aceptación.
- **Identificador de ticket:** número correlativo con formato `CNT-{año}-{seq}` asignado por el sistema.

### 2bis.2. Base legal del tratamiento

- **Chile — Ley N° 19.628, Art. 4°:** consentimiento expreso del titular al marcar la casilla de aceptación de esta Política previo al envío del formulario.
- **Unión Europea / EEE — GDPR Art. 6(1)(a):** consentimiento específico e informado para la finalidad de responder su consulta. La demostrabilidad del consentimiento (GDPR Art. 7(1)) se garantiza mediante el registro del hash de la versión aceptada, la dirección IP, el User-Agent y el timestamp UTC en la propia ficha del ticket.
- **GDPR Art. 6(1)(f) — interés legítimo:** complementariamente, aplicamos interés legítimo para el registro de auditoría técnica (IP, User-Agent, detección de abuso vía rate-limit y honeypot), en los términos de la Sección 2bis.5. Este tratamiento es proporcional y no prevalece sobre los derechos del titular.

### 2bis.3. Finalidad del tratamiento

- Recibir, clasificar, responder y dejar trazabilidad de su mensaje.
- Hacer llegar el contenido al buzón interno apropiado según el motivo declarado.
- Mantener un registro probatorio de la comunicación en caso de reclamos posteriores, fiscalización por parte de autoridad competente o defensa ante reclamaciones judiciales o administrativas.

### 2bis.4. Enrutamiento interno por motivo

Los tickets se dirigen internamente a un buzón interno asociado al motivo que usted selecciona:

| Motivo | Etiqueta | Buzón interno asociado |
|---|---|---|
| Comercial | Consulta comercial | contacto@conniku.com |
| Universidad | Alianza con universidad | contacto@conniku.com |
| Prensa | Prensa y medios | contacto@conniku.com (con destino futuro prensa@conniku.com) |
| Legal | Asuntos legales o privacidad | contacto@conniku.com (con destino futuro legal@conniku.com) |
| Seguridad | Reporte de seguridad | contacto@conniku.com (con destino futuro seguridad@conniku.com) |
| Otro | Consulta general | contacto@conniku.com |

A la fecha de esta versión, todos los motivos se entregan al buzón `contacto@conniku.com`, administrado por el equipo de Conniku SpA en la infraestructura del encargado de tratamiento Zoho Mail (ver Sección 6). Los alias `prensa@conniku.com`, `legal@conniku.com` y `seguridad@conniku.com` se encuentran declarados como destino futuro y serán activados conforme se provisionen en el proveedor. El cambio de enrutamiento no altera los fines del tratamiento ni la base legal, y será notificado mediante una actualización posterior de esta Política.

### 2bis.5. Medidas técnicas específicas del canal

- **Rate-limit:** se aceptan hasta 5 tickets por hora desde una misma dirección IP. Los intentos adicionales son rechazados con una respuesta 429 sin persistir el contenido del mensaje.
- **Honeypot anti-bot:** el formulario incluye un campo oculto que los bots suelen llenar automáticamente. Si viene con valor, el sistema responde con un código de éxito silencioso sin persistir datos.
- **Re-validación del hash de consentimiento:** si la versión de esta Política de Privacidad cambia entre el momento en que usted cargó el formulario y el momento en que lo envía, el sistema rechaza el envío y le solicita recargar la página para revisar la versión actualizada antes de reintentar. Esto preserva la trazabilidad exigida por GDPR Art. 7(1).

### 2bis.6. Bidireccionalidad y respuestas

Conniku puede responder al ticket desde su panel administrativo interno. En tal caso:

- El correo de respuesta se envía desde la cuenta `noreply@conniku.com` (remitente técnico) con el encabezado `Reply-To: contacto@conniku.com`.
- La respuesta queda registrada como mensaje saliente asociado al mismo ticket, identificando al miembro del equipo autor de la respuesta.
- Usted puede continuar la conversación respondiendo ese correo o escribiendo a `contacto@conniku.com`; los mensajes sucesivos quedan vinculados al mismo ticket cuando son procesados manualmente por el equipo. A la fecha no existe aún procesamiento automatizado de respuestas entrantes por IMAP o webhook, por lo que la asociación al hilo requiere intervención del equipo.

### 2bis.7. Retención

Conservamos cada ticket y los metadatos asociados durante **5 años (1.825 días) contados desde la fecha de creación del ticket**. Este plazo se calcula y se almacena explícitamente en el campo `retained_until_utc` de cada ticket.

**Fundamento legal del plazo:**

- **GDPR Art. 17(3)(e):** el derecho de supresión no aplica cuando la conservación es necesaria para la formulación, el ejercicio o la defensa de reclamaciones. Reglamento (UE) 2016/679, texto consolidado: <https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679>. Fecha de verificación: 2026-04-22. Verificador: legal-docs-keeper (Tori).
- **Art. 2515 del Código Civil de Chile:** plazo ordinario de prescripción de las acciones personales (5 años). <https://www.bcn.cl/leychile/navegar?idNorma=172986>. Fecha de verificación: 2026-04-22. Verificador: legal-docs-keeper (Tori).
- **Ley N° 19.496, Art. 50:** ejercicio de acciones del consumidor y prescripción aplicable a servicios. <https://www.bcn.cl/leychile/navegar?idNorma=61438>. Fecha de verificación: 2026-04-22. Verificador: legal-docs-keeper (Tori).

Cumplido el plazo, los tickets se someten al procedimiento interno de eliminación o anonimización, salvo que subsista una obligación legal específica de conservarlos por más tiempo.

### 2bis.8. Derechos del titular sobre los tickets

Usted puede, en cualquier momento:

- Solicitar copia del o los tickets asociados a su correo electrónico (derecho de acceso).
- Solicitar la rectificación de datos inexactos o incompletos.
- Solicitar la supresión anticipada de sus tickets antes del plazo de 5 años, salvo que la conservación resulte necesaria conforme a lo señalado en la Sección 2bis.7 (defensa de reclamaciones, obligación legal).
- Retirar el consentimiento de tratamientos basados en Art. 6(1)(a) GDPR, sin que ello afecte la licitud de los tratamientos realizados antes del retiro.

Estas solicitudes se envían a [privacidad@conniku.com](mailto:privacidad@conniku.com) o, para asuntos específicamente legales, a `contacto@conniku.com` con el asunto "Asunto legal o privacidad".

---

## 2ter. Canal de sandbox de vista previa

Conniku publica, con propósito de iteración de diseño y revisión pública acotada, un entorno de vista previa navegable en la ruta `conniku.com/sandbox/` (y su equivalente en dominios de preview de Vercel). Este entorno reproduce visualmente las pantallas del producto y de los documentos legales, pero **no** es un entorno simulado: las interacciones que el visitante realiza en el banner de cookies y en los modales legales generan **filas reales** en las bases de datos de Conniku, con idéntica validez probatoria que las mismas acciones ejecutadas en el producto logueado.

### 2ter.1. Tratamientos que el sandbox activa

- **Consentimiento de cookies (`cookie_consents`):** al aceptar, rechazar o personalizar el banner en el sandbox, se crea una fila en la tabla `cookie_consents` con el valor `origin = "sandbox"`, el `visitor_uuid` pseudónimo persistido por localStorage, el hash de la versión de la Política de Cookies vigente, la IP pública, el User-Agent truncado a 512 caracteres y el timestamp UTC.
- **Registro de lectura (`document_views`):** al abrir un modal legal en el sandbox, se crea una fila en `document_views` con el `session_token` (mismo valor que `visitor_uuid` por diseño de coherencia), el hash canónico del documento leído y la marca de scroll.

### 2ter.2. Base legal

- **Consentimiento de cookies:** GDPR Art. 6(1)(a) + Directiva 2002/58/CE Art. 5(3) + Ley 19.628 Art. 4°.
- **`document_views`:** GDPR Art. 6(1)(f) — interés legítimo en demostrar la trazabilidad de la lectura de documentos legales (Art. 7(1)), proporcional y no prevaleciente sobre derechos del titular.

### 2ter.3. Retención

- Consentimientos `origin = "sandbox"`: idéntica a los consentimientos de los demás canales, **5 años** desde la fecha de creación, fundada en GDPR Art. 17(3)(e) y Art. 2515 del Código Civil de Chile (ver Política de Cookies §5).
- `document_views` desde sandbox: **5 años** desde la fecha del evento, bajo el mismo fundamento.

### 2ter.4. Vinculación posterior al registro de usuario

Si un visitante del sandbox posteriormente se registra como usuario autenticado de Conniku, el `visitor_uuid` persistido en localStorage permite vincular retrospectivamente el consentimiento anónimo y las lecturas registradas con el `user_id` creado. Esta vinculación se realiza con la sola finalidad de preservar la cadena probatoria del consentimiento (Art. 7(1) GDPR) y de evitar requerir al usuario una segunda aceptación inmediatamente después del registro. El usuario puede oponerse a esta vinculación escribiendo a `privacidad@conniku.com`.

---

## 2quater. Sistema de feedback de ayuda (`support_feedback`)

El centro de soporte de Conniku incluye, debajo de cada pregunta frecuente, un widget que permite al Usuario declarar si la respuesta le resultó útil (👍) o no (👎), y abrir opcionalmente un comentario textual adicional. Este sistema se denomina internamente `support_feedback` y se rige por las reglas siguientes.

### 2quater.1. Datos recolectados por evento

- **Valoración:** booleano `útil = true` o `útil = false`.
- **Identificador de la pregunta:** `faq_id` textual estable (slug), versionado en `docs/support/faq-catalog.md`.
- **Comentario:** opcional, de hasta 2.000 caracteres, únicamente cuando el Usuario lo escribe libremente. El sistema no pre-rellena este campo.
- **Identificador de sesión:** `session_token` (UUID v4, mismo que el `visitor_uuid` del consentimiento de cookies cuando existe) o `user_id` si el Usuario está autenticado.
- **Metadatos técnicos:** dirección IP pública al momento del envío, User-Agent truncado a 512 caracteres (GDPR Art. 5(1)(c) minimización) y marca de tiempo UTC.

### 2quater.2. Base legal

- **GDPR Art. 6(1)(f) — interés legítimo:** mejorar iterativamente el contenido del centro de soporte reduce el volumen de tickets y mejora la calidad del producto. La prueba del balance con derechos del titular (Art. 6(1)(f) segundo párrafo) se documenta en el registro interno de actividades de tratamiento (Art. 30 GDPR). El Usuario puede oponerse en cualquier momento (Art. 21 GDPR) sin afectar al servicio.
- **Ley 19.628 Art. 4°:** aplicable en Chile — el acto de hacer clic en el botón 👍 o 👎 con conocimiento del banner de cookies previamente aceptado constituye manifestación inequívoca de voluntad respecto de la finalidad declarada.
- **GDPR Art. 5(1)(c) minimización:** no se recolectan identificadores de producto, no se crea perfil cruzado con el comportamiento en otras pantallas; solo el `faq_id` y la valoración binaria viajan al backend.

### 2quater.3. Retención y pseudonimización

- **Retención total:** **2 años** (730 días) contados desde la fecha de creación de la fila, almacenada explícitamente en el campo `retained_until_utc`.
- **Pseudonimización a 12 meses:** a los 12 meses de cada fila, los campos `ip_address` y `user_agent` se reemplazan por sus respectivos hashes SHA-256 (o por el valor `NULL` según el procedimiento operativo descrito en `bloque-privacy-jobs-v1`). Subsisten únicamente `faq_id`, `útil`, `comment`, `session_token`, `created_at` y `retained_until_utc`. El campo `pseudonymized_at_utc` se registra al momento de la operación.
- **Eliminación definitiva:** cumplidos los 2 años, la fila se elimina por completo o se agrega de manera irreversible en métricas estadísticas sin identificadores.

**Fundamento del plazo de 2 años:**

- **GDPR Art. 5(1)(e) — limitación del plazo de conservación:** se conservan los datos durante el tiempo estrictamente necesario para las finalidades (análisis y-1 y y-2 del contenido de soporte). Dos años cubren dos ciclos anuales comparables.
- **GDPR Art. 5(1)(c) — minimización:** la pseudonimización a 12 meses asegura que los datos identificables existan solo durante el horizonte útil (detección de abuso y validación de rate-limit). Pasado ese plazo, el valor analítico del dato no requiere identificadores.
- **Artículo 2515 del Código Civil de Chile:** el plazo general de prescripción de acciones personales es de 5 años. Este plazo aplica a la conservación de datos cuya retención pueda ser necesaria para la defensa o el ejercicio de reclamaciones. El feedback anónimo no constituye acto jurídico ni prueba de contratación; por ello el plazo de 5 años del Código Civil **no impone** una retención obligatoria de 5 años sobre este tratamiento, y la elección de 2 años es defendible bajo el principio de proporcionalidad (Ley 19.628 Art. 9°; GDPR Art. 5(1)(c)).
- **Ley 19.628 Art. 6°:** los datos "deben ser eliminados o cancelados cuando su almacenamiento carezca de fundamento legal o cuando hubieren caducado". Pasados 2 años, el fundamento de interés legítimo ya no se sostiene porque los comentarios cubren iteraciones de producto ya completadas.

### 2quater.4. Derechos del Usuario sobre el feedback

- **Acceso:** solicitar copia de todos los registros `support_feedback` asociados a su `session_token` o `user_id` escribiendo a `privacidad@conniku.com` con el identificador.
- **Rectificación:** solicitar modificación del comentario textual si contiene datos inexactos.
- **Supresión:** solicitar eliminación anticipada (antes de cumplirse los 2 años). Conniku eliminará la fila en un plazo máximo de 30 días calendario.
- **Oposición al tratamiento por interés legítimo (Art. 21 GDPR):** el Usuario puede oponerse en cualquier momento; el sistema dejará de considerar sus envíos previos en análisis agregados y los eliminará.

### 2quater.5. Medidas técnicas

- **Rate-limit:** el endpoint `POST /support/feedback` aplica un límite de 60 solicitudes por hora por IP para prevenir abuso, mismo patrón que el canal de tickets (§2bis.5).
- **Sanitización del comentario:** el texto se almacena en crudo, sin renderizar HTML, y se sanitiza antes de mostrarse en el panel interno admin para evitar XSS.
- **No export:** el widget no exporta los comentarios fuera de Conniku; no hay integración con terceros analytics.

---

## 3. Finalidad del Tratamiento

Utilizamos sus datos personales para las siguientes finalidades:

- **Prestación del servicio:** crear y gestionar su cuenta, procesar sus materiales de estudio y generar contenido personalizado con tecnologia inteligente.
- **Asistencia inteligente sobre documentos (Athena):** procesar el contenido de los documentos y sus mensajes de chat privado cuando usted invoca deliberadamente al asistente Athena, con el fin de devolverle análisis, resúmenes, respuestas a preguntas y sugerencias de reescritura sobre fragmentos específicos que usted seleccione. El tratamiento se ejecuta únicamente cuando usted acciona la función; no opera automáticamente sobre documentos inactivos.
- **Personalización:** adaptar la experiencia de usuario según sus preferencias académicas, carrera e intereses.
- **Gamificación:** gestionar el sistema de puntos, logros, rachas de estudio y clasificaciones.
- **Notificaciones:** enviar alertas sobre actividad relevante, recordatorios de estudio, mensajes y actualizaciones del servicio.
- **Mejora del servicio:** analizar patrones de uso para mejorar las funcionalidades, corregir errores y desarrollar nuevas herramientas.
- **Comunicaciones:** responder consultas de soporte y enviar información sobre cambios en el servicio, incluyendo la gestión de tickets de contacto descrita en la Sección 2bis.
- **Seguridad:** prevenir fraude, uso indebido y garantizar la seguridad de la plataforma.

---

## 4. Base Legal del Tratamiento

### 4.1. Chile — Ley N° 19.628

- **Consentimiento del titular (Art. 4°):** al crear una cuenta y aceptar esta política, usted consiente expresamente el tratamiento de sus datos. Aplica también al envío de un ticket de contacto (Sección 2bis).
- **Ejecución de contrato:** el tratamiento es necesario para la prestación del servicio contratado.
- **Interés legítimo:** para mejora del servicio y prevención de fraude, siempre que no prevalezcan los derechos fundamentales del titular.

### 4.2. Unión Europea / EEE — GDPR Art. 6(1)

- **Consentimiento [Art. 6(1)(a)]:** para comunicaciones de marketing, cookies no esenciales y envío de tickets de contacto (Sección 2bis.2).
- **Ejecución de contrato [Art. 6(1)(b)]:** para la prestación del servicio solicitado por el usuario, incluido el procesamiento de los contenidos que usted envía explícitamente al asistente Athena (documento, chat privado, selecciones de texto para sugerencia) cuando dicha función forma parte del plan contratado.
- **Obligación legal [Art. 6(1)(c)]:** cuando el tratamiento es requerido por ley aplicable.
- **Interés legítimo [Art. 6(1)(f)]:** para seguridad de la plataforma, prevención de fraude y mejora del servicio, incluido el registro de metadatos técnicos y controles anti-abuso del canal de contacto (rate-limit, honeypot), siempre que no prevalezcan los derechos del interesado.

### 4.3. Brasil — LGPD Art. 7°

- **Consentimiento [Art. 7°, I]:** para finalidades específicas informadas al titular.
- **Ejecución de contrato [Art. 7°, V]:** cuando sea necesario para el cumplimiento del contrato.
- **Interés legítimo [Art. 7°, IX]:** para finalidades legítimas, consideradas las expectativas del titular.

### 4.4. California, EE.UU. — CCPA / CPRA

Conniku no vende ni comparte información personal con fines de publicidad conductual entre empresas. El tratamiento de datos de residentes de California se realiza para las finalidades de prestación del servicio y mejora de la experiencia del usuario.

---

## 5. Almacenamiento y Seguridad de los Datos

### 5.1. Ubicación de los servidores

Los datos personales son almacenados en servidores ubicados en Estados Unidos de América, a través de los siguientes proveedores de infraestructura:

- **Render:** alojamiento del servidor backend y base de datos.
- **Vercel:** alojamiento del frontend de la aplicación web.

Las transferencias internacionales de datos (incluyendo desde la UE/EEE) se realizan con las salvaguardias adecuadas conforme al GDPR Art. 46, mediante las Cláusulas Contractuales Tipo (Standard Contractual Clauses) aprobadas por la Comisión Europea, y en conformidad con el Art. 5° de la Ley N° 19.628 de Chile. Ver también la Sección 14 de esta política.

### 5.2. Medidas de seguridad

Implementamos medidas técnicas y organizativas apropiadas para proteger sus datos, incluyendo:

- Cifrado de datos en tránsito mediante protocolo HTTPS/TLS.
- Almacenamiento seguro de contraseñas mediante algoritmos de hashing (bcrypt).
- Autenticación mediante tokens JWT con expiración.
- Control de acceso basado en roles para datos sensibles.
- Monitoreo continuo de la infraestructura.
- Protección contra XSS, CSRF e inyección SQL.

### 5.3. Procesamiento al exportar documentos

Cuando usted solicita exportar un documento de Workspaces a formato PDF o DOCX:

- El contenido del documento se envía a nuestros servidores para ser procesado por bibliotecas de generación de archivos (WeasyPrint para PDF, python-docx para DOCX).
- El contenido es sanitizado por el servidor antes del render: se eliminan scripts, manejadores de eventos, iframes, y cualquier elemento ajeno al contenido textual y visual autorizado.
- Las imágenes referenciadas desde dominios externos a Conniku se eliminan del documento exportado por razones de seguridad. Las imágenes alojadas en los dominios de Conniku se incorporan al archivo como datos binarios (base64), quedando contenidas dentro del propio archivo.
- Los metadatos del archivo DOCX (autor, autor de la última modificación, título) se establecen como vacíos para no filtrar la identidad del usuario que exporta. Los archivos PDF generados tampoco incluyen metadatos de identidad del usuario.
- Conniku no conserva una copia del archivo exportado después de entregárselo. El archivo se genera en memoria, se envía a su navegador y se descarta.
- Una vez descargado el archivo en su dispositivo, queda fuera de nuestro control. Si lo comparte, lo envía por correo o lo sube a otro servicio, esa difusión y sus consecuencias son de su exclusiva responsabilidad.

---

## 6. Compartición de Datos con Terceros

Conniku puede compartir datos personales con los siguientes terceros, exclusivamente para las finalidades indicadas:

| Tercero | Finalidad | Datos compartidos |
|---|---|---|
| **Anthropic** | Procesamiento automatizado de lenguaje natural para las funciones de asistencia inteligente sobre documentos del usuario: generación de resúmenes, análisis de documentos, chat privado por documento, sugerencias de reescritura sobre fragmentos seleccionados, y otras funciones equivalentes que se incorporen al asistente Athena. Anthropic, PBC, con domicilio en San Francisco, California, Estados Unidos. Las transferencias internacionales se realizan, cuando corresponda, bajo mecanismos contractuales apropiados conforme al artículo 5 de la Ley N° 19.628 de Chile, incluyendo Cláusulas Contractuales Tipo aprobadas por la Comisión Europea cuando resulten aplicables según la jurisdicción del usuario. | Título y materia del documento, contenido completo del documento cuando usted lo envía a analizar, últimos mensajes del chat privado de Athena asociado al documento (enviados como contexto en cada consulta, con un máximo de los 10 mensajes más recientes), y el texto específico que usted seleccione para pedir una sugerencia de reescritura. No se envían contraseñas, tokens de sesión, datos de pago ni metadatos de cuenta. |
| **Supabase** | Autenticación de usuarios y almacenamiento primario de la base de datos relacional (PostgreSQL gestionado). Actúa como encargado de tratamiento conforme al artículo 28 del RGPD y equivalentes de la Ley 19.628. | Credenciales de acceso (contraseña almacenada como hash, nunca en texto plano), identificadores únicos de usuario, dirección de correo electrónico, metadatos de sesión, y todos los contenidos que la plataforma almacene en la base de datos (perfil, documentos, mensajes, registros de actividad, tickets de contacto y sus mensajes asociados). |
| **Firebase Cloud Messaging (Google)** | Entrega de notificaciones push al navegador y a las aplicaciones móviles, por ejemplo recordatorios de suscripción, avisos de mensajes nuevos y alertas operativas que usted haya habilitado. | Token único del dispositivo generado por el propio Firebase (identificador técnico de entrega), tipo de dispositivo y plataforma. No se envían contenidos sensibles dentro del payload de la notificación; los datos completos se consultan solo después de que usted abre la aplicación. |
| **Google OAuth** | Inicio de sesión federado "Entrar con Google" cuando usted decide utilizarlo. Permite autenticar sin crear una contraseña separada. | Dirección de correo electrónico asociada a la cuenta Google, nombre público y (si usted lo autoriza) foto de perfil. Los permisos solicitados se limitan a los scopes "openid", "email" y "profile". Usted puede revocar el acceso en cualquier momento desde https://myaccount.google.com/permissions. |
| **Capacitor (app móvil)** | Empaquetado de la aplicación para iOS y Android. Permite acceder a almacenamiento local del dispositivo (equivalente a localStorage del navegador) para funciones offline y recordatorios de sesión. | Datos locales del dispositivo: preferencias de interfaz, borradores no sincronizados, identificadores de sesión. Estos datos no se envían a terceros; residen en el dispositivo y se eliminan al desinstalar la aplicación o desde los ajustes del sistema operativo. |
| **MercadoPago / PayPal** | Procesamiento de pagos de suscripciones. | Datos necesarios para la transacción (no almacenamos datos de tarjetas). |
| **Zoho Mail (Zoho Corporation)** | Encargado de tratamiento para el canal de correo electrónico de Conniku. Transporta, almacena y entrega los correos transaccionales y de soporte enviados desde las cuentas `noreply@conniku.com`, `contacto@conniku.com`, `ceo@conniku.com` y `privacidad@conniku.com`, así como los correos generados por el sistema de tickets de contacto descrito en la Sección 2bis (confirmación al usuario, notificación interna al equipo y respuestas del equipo al usuario). Actúa como encargado de tratamiento en los términos del Art. 28 GDPR. Zoho Corporation opera infraestructura en varias regiones (India, Estados Unidos, Unión Europea) según la configuración del espacio y las políticas del proveedor. Política de tratamiento de datos y DPA disponibles en <https://www.zoho.com/privacy.html> y <https://www.zoho.com/gdpr.html>. | Dirección de correo electrónico del remitente y del destinatario, asunto y cuerpo de los mensajes, nombre declarado, identificador de ticket cuando corresponde, y encabezados técnicos estándar de SMTP. |
| **Render / Vercel** | Infraestructura de alojamiento (cloud hosting). | Todos los datos almacenados en la plataforma (bajo acuerdos de confidencialidad). |

**Conniku no vende, alquila ni comparte sus datos personales con terceros para fines de marketing.** Nunca transferimos datos a brokers de datos ni a redes publicitarias.

Adicionalmente, cuando usted exporta un documento a PDF o DOCX, el archivo generado es entregado directamente a su dispositivo y no compartido con ningún tercero por parte de Conniku.

---

## 7. Derechos del Titular de los Datos (Chile — ARCO)

De conformidad con el artículo 12 y siguientes de la Ley N° 19.628, usted tiene los siguientes derechos respecto a sus datos personales:

- **Acceso:** conocer los datos que mantenemos sobre usted, su origen y los destinatarios.
- **Rectificación:** corregir datos inexactos, erróneos o incompletos.
- **Cancelación:** solicitar la eliminación de sus datos cuando carezcan de fundamento legal.
- **Oposición:** oponerse al tratamiento de sus datos en los casos permitidos por la ley.

Para ejercer estos derechos, envíe su solicitud a [privacidad@conniku.com](mailto:privacidad@conniku.com). Responderemos en un plazo máximo de 2 días hábiles. También puede modificar o eliminar gran parte de sus datos directamente desde la configuración de su perfil en la plataforma.

### 7.1. Cómo eliminar tu cuenta y tus datos

Puedes solicitar la eliminación completa de tu cuenta de Conniku en cualquier momento, de forma gratuita, mediante cualquiera de estos métodos:

- **Desde la app:** Perfil → Configuración → "Zona de peligro" → "Eliminar cuenta" → confirma escribiendo "ELIMINAR".
- **Por correo:** Escribe a [privacidad@conniku.com](mailto:privacidad@conniku.com) con tu nombre completo y correo registrado.

Los datos identificables se eliminan dentro de los **30 días** siguientes a la solicitud. Ciertos datos anonimizados pueden conservarse hasta 2 años con fines estadísticos. Para ver las instrucciones completas y la tabla de retención de datos por tipo, visita conniku.com/delete-account.

La eliminación de la cuenta no elimina automáticamente los tickets de contacto enviados como parte de la Sección 2bis: esos tickets mantienen el plazo de retención de 5 años allí descrito, salvo que usted solicite expresamente su supresión anticipada y no subsista una obligación legal de conservarlos.

---

## 8. Cookies y Tecnologías Similares

Conniku utiliza cookies y tecnologías equivalentes (localStorage, sessionStorage, IndexedDB y caché del Service Worker de la PWA) exclusivamente para prestar el servicio contratado: mantener la sesión del Usuario, recordar sus preferencias y permitir el funcionamiento offline. Conniku no utiliza cookies de terceros con fines publicitarios ni realiza fingerprinting de dispositivos con fines comerciales.

El detalle íntegro de cada clave de almacenamiento, su categoría, su finalidad, su duración y la forma en que el Usuario puede gestionarlas se encuentra en la Política de Cookies (conniku.com/cookies), documento complementario y vinculante a la presente Política de Privacidad.

---

## 9. Retención de Datos

Conservamos sus datos personales de acuerdo con los siguientes criterios:

- **Cuenta activa:** mientras su cuenta permanezca activa, conservaremos sus datos para la prestación del servicio.
- **Post-eliminación:** tras la eliminación de su cuenta, conservaremos datos anonimizados o agregados por un período de 2 años para fines estadísticos. Los datos identificables serán eliminados dentro de los 30 días siguientes a la solicitud.
- **Historial de chat con Athena:** los mensajes del chat privado de Athena asociados a un documento se conservan mientras el documento exista en su cuenta. Al eliminar un documento, el historial de chat asociado se elimina en cascada de manera automática. Usted también puede borrar manualmente todo el historial de chat de un documento desde el propio panel de Athena, sin eliminar el documento. Las sugerencias de reescritura resueltas (aplicadas, modificadas o rechazadas) se conservan como registro histórico del documento bajo el mismo criterio.
- **Métricas de uso de Athena:** la tabla interna de cuotas (cantidad de consultas diarias al asistente) se conserva por tiempo indefinido en forma de contador agregado por usuario, sin el contenido procesado. Esta información se utiliza exclusivamente para aplicar los límites por plan descritos en los Términos y Condiciones.
- **Tickets de contacto:** 5 años (1.825 días) desde la fecha de creación del ticket, fundado en GDPR Art. 17(3)(e), Art. 2515 del Código Civil de Chile y Ley N° 19.496 Art. 50 (ver Sección 2bis.7).
- **Registro de lectura de documentos legales (`document_views`):** 5 años (1.825 días) desde la fecha del evento, fundado en GDPR Art. 17(3)(e) y Art. 2515 del Código Civil de Chile (evidencia probatoria del consentimiento informado). Los campos IP y User-Agent se pseudonimizan a los 12 meses conforme al procedimiento `bloque-privacy-jobs-v1`.
- **Feedback de soporte (`support_feedback`):** 2 años (730 días) desde la fecha del evento. A los 12 meses se pseudonimizan IP y User-Agent. Fundamento: GDPR Art. 5(1)(c) y 5(1)(e); Ley 19.628 Art. 6° y 9°. Art. 2515 CC no aplica por no tratarse de evidencia de acto jurídico.
- **Obligaciones legales:** ciertos datos podrán conservarse por períodos adicionales cuando sea requerido por ley (registros de facturación, normativa tributaria).

---

## 10. Menores de Edad

Conniku es una plataforma exclusiva para personas mayores de 18 años. No recopilamos intencionalmente datos personales de personas menores de 18 años. Si tomamos conocimiento de que hemos recopilado datos de una persona menor de 18 años sin el consentimiento adecuado, procederemos a eliminar dichos datos en un plazo máximo de 72 horas desde la confirmación del hecho.

Para usuarios de la Unión Europea: el GDPR Art. 8 permite que algunos Estados miembros fijen un umbral de edad mínima para el consentimiento digital inferior a 18 años. Conniku aplica 18 años como edad mínima uniforme en todas las jurisdicciones, adoptando la restricción más estricta de forma global, independientemente de lo que permita la legislación local aplicable.

---

## 11. Cambios a esta Política de Privacidad

Conniku se reserva el derecho de actualizar esta Política de Privacidad en cualquier momento. Las modificaciones sustanciales serán notificadas con al menos 15 días de anticipación a través de la plataforma y/o por correo electrónico.

Para usuarios en la UE/EEE: si los cambios implican una nueva finalidad de tratamiento o un nuevo fundamento legal distinto al consentimiento, solicitaremos su consentimiento expreso antes de aplicar dichos cambios.

### 11.1. Historial de versiones

| Versión | Fecha de vigencia | Cambios principales |
|---|---|---|
| 2.1 | 2026-04-11 | Versión previa a consolidación v3.2. |
| 2.3 | 2026-04-20 | Borrador v3.1 superseded (archivado). |
| 2.4.0 | 2026-04-20 | Documento canónico autocontenido derivado de `PrivacyPolicy.tsx` con edits H-01 (domicilio Antofagasta), §5.3 (procesamiento al exportar documentos) y H-12 opción B (Anthropic, redacción condicional). |
| 2.4.1 | 2026-04-22 | Agregado sistema de tickets de contacto (`/contacto`) con routing por motivo a buzones internos, retención 5 años fundada en Art. 17(3)(e) GDPR + Art. 2515 Código Civil de Chile + Ley 19.496 Art. 50, bidireccionalidad desde panel admin con remitente `noreply@conniku.com` y `Reply-To: contacto@conniku.com`. Confirmación y ampliación de Zoho Mail como encargado de tratamiento para el canal email. |
| 2.4.2 | 2026-04-23 | Agregado canal sandbox público (§2ter): consent real + document_views reales con `origin = "sandbox"`, retención 5 años alineada con canales principales. Agregado sistema de feedback de soporte (§2quater): tabla `support_feedback`, base legal Art. 6(1)(f), retención 2 años con pseudonimización a 12 meses, rate-limit 60/h/IP. Enumerado `document_views` como tratamiento automático (§2.2) y en §9 retención. |

---

## 12. Contacto y Reclamos

Para cualquier consulta, solicitud o reclamo relacionado con sus datos personales:

- Privacidad y datos: [privacidad@conniku.com](mailto:privacidad@conniku.com)
- Contacto general: [contacto@conniku.com](mailto:contacto@conniku.com)
- CEO / Responsable: [ceo@conniku.com](mailto:ceo@conniku.com)
- Sitio web: [conniku.com](https://conniku.com)

Si no queda satisfecho con nuestra respuesta, puede presentar un reclamo ante la autoridad de protección de datos competente en su jurisdicción (ver Sección 13).

---

## 13. Derechos Específicos por Jurisdicción

Según su lugar de residencia, usted puede tener derechos adicionales bajo la normativa local. En todos los casos, puede ejercerlos escribiendo a [privacidad@conniku.com](mailto:privacidad@conniku.com).

### 13.1. Usuarios de la Unión Europea y el EEE — GDPR

Si reside en la UE o el Espacio Económico Europeo, el Reglamento (UE) 2016/679 (GDPR) le otorga los siguientes derechos:

- **Acceso [Art. 15]:** obtener confirmación de si tratamos sus datos y una copia de los mismos.
- **Rectificación [Art. 16]:** rectificar datos inexactos o incompletos.
- **Supresión / "derecho al olvido" [Art. 17]:** solicitar la eliminación de sus datos cuando ya no sean necesarios para la finalidad original, revoque su consentimiento, o se opongan ilegítimamente al tratamiento.
- **Limitación del tratamiento [Art. 18]:** solicitar la restricción del tratamiento en determinadas circunstancias.
- **Portabilidad [Art. 20]:** recibir sus datos en formato estructurado, de uso común y legible por máquina, y transmitirlos a otro responsable.
- **Oposición [Art. 21]:** oponerse al tratamiento basado en interés legítimo o para fines de marketing directo.
- **Decisiones automatizadas [Art. 22]:** no ser objeto de una decisión basada únicamente en tratamiento automatizado que produzca efectos jurídicos significativos.

**Derecho a reclamar ante autoridad supervisora:** tiene derecho a presentar una reclamación ante la Autoridad de Control de su Estado miembro (p.ej., AEPD en España, CNIL en Francia, BfDI en Alemania).

**Plazo de respuesta:** responderemos sus solicitudes en un plazo máximo de 30 días calendario (prorrogable a 60 días en casos complejos, con notificación previa).

### 13.2. Usuarios de Brasil — LGPD

Si reside en Brasil, la Lei Geral de Proteção de Dados Pessoais (Lei N° 13.709/2018) le otorga los siguientes derechos (Art. 18):

- **Confirmação e acesso [Art. 18, I-II]:** confirmar la existencia del tratamiento y acceder a sus datos.
- **Correção [Art. 18, III]:** corregir datos incompletos, inexactos o desactualizados.
- **Anonimização, bloqueio ou eliminação [Art. 18, IV]:** anonimización, bloqueo o eliminación de datos innecesarios o tratados en incumplimiento de la LGPD.
- **Portabilidade [Art. 18, V]:** portabilidad de sus datos a otro proveedor, conforme a regulación de la ANPD.
- **Informação sobre compartilhamento [Art. 18, VI]:** información sobre entidades públicas y privadas con las que compartimos datos.
- **Revogação do consentimento [Art. 18, IX]:** revocar el consentimiento en cualquier momento, sin perjuicio del tratamiento previo.
- **Revisão de decisões automatizadas [Art. 20]:** solicitar revisión de decisiones tomadas únicamente con base en tratamiento automatizado.

**Autoridade Nacional:** puede presentar una petición ante la ANPD (Autoridade Nacional de Proteção de Dados). Plazo de respuesta: 15 días hábiles.

### 13.3. Residentes de California, EE.UU. — CCPA / CPRA

Si es residente del Estado de California, la California Consumer Privacy Act (CCPA), modificada por la California Privacy Rights Act (CPRA), le otorga los siguientes derechos:

- **Right to Know [§1798.100]:** derecho a saber qué categorías e información personal específica hemos recopilado, sus fuentes, finalidades y terceros con quienes se comparte.
- **Right to Delete [§1798.105]:** derecho a solicitar la eliminación de su información personal, con las excepciones previstas en la ley.
- **Right to Correct [§1798.106]:** derecho a solicitar la corrección de información personal inexacta.
- **Right to Opt-Out of Sale or Sharing [§1798.120]:** Conniku **no vende ni comparte** información personal con fines de publicidad conductual entre empresas. No aplica opt-out activo.
- **Right to Limit Use of Sensitive PI [§1798.121]:** derecho a limitar el uso y divulgación de información personal sensible a los fines autorizados.
- **Right to Non-Discrimination [§1798.125]:** Conniku no discriminará a los usuarios que ejerzan sus derechos CCPA. No se le denegarán servicios, se le cobrarán precios diferentes ni se le ofrecerá calidad de servicio inferior por ejercer sus derechos.

**Categorías de información personal recopilada (CCPA):** identificadores (nombre, correo, IP), información de actividad en internet, datos de geolocalización aproximada (a partir de IP), información educativa e historial de uso del servicio.

Para ejercer sus derechos CCPA, contacte a [privacidad@conniku.com](mailto:privacidad@conniku.com). Puede designar un agente autorizado. Responderemos en un plazo de 45 días (prorrogable otros 45 días con notificación). La verificación de identidad puede requerirse.

### 13.4. Usuarios de México — LFPDPPP

Si reside en México, la Ley Federal de Protección de Datos Personales en Posesión de los Particulares le otorga los derechos ARCO (Acceso, Rectificación, Cancelación y Oposición), ejercibles ante [privacidad@conniku.com](mailto:privacidad@conniku.com). En caso de inconformidad, puede acudir al INAI.

---

## 14. Transferencias Internacionales de Datos

Conniku transfiere datos personales a servidores ubicados en Estados Unidos (Render, Vercel, y Anthropic cuando usted invoca funciones de asistencia inteligente) y, en el caso del canal de correo electrónico, a la infraestructura global de Zoho Corporation (ver Sección 6). Para garantizar la protección de sus datos en estas transferencias:

- **Usuarios de la UE/EEE (GDPR Art. 46):** utilizamos las Cláusulas Contractuales Tipo (Standard Contractual Clauses — SCCs) aprobadas por la Comisión Europea (Decisión 2021/914) como salvaguardia adecuada. Puede solicitar una copia de estas cláusulas escribiendo a privacidad@conniku.com.
- **Usuarios de Brasil (LGPD Art. 33):** la transferencia internacional se realiza con garantías equivalentes de protección, conforme a los mecanismos aprobados por la ANPD.
- **Usuarios de Chile (Ley 19.628 Art. 5°):** la transferencia se realiza con medidas adecuadas de seguridad y confidencialidad.

Todos nuestros proveedores de infraestructura cuentan con certificaciones de seguridad reconocidas (SOC 2, ISO 27001) y acuerdos de procesamiento de datos (DPA) que les obligan a proteger sus datos personales con estándares equivalentes a los exigidos por las normativas aplicables.

---

Esta Política de Privacidad ha sido redactada en conformidad con la Ley N° 19.628 sobre Protección de la Vida Privada (Chile), el Reglamento General de Protección de Datos (GDPR, UE 2016/679), la Lei Geral de Proteção de Dados Pessoais (LGPD, Brasil) y la California Consumer Privacy Act (CCPA / CPRA, EE.UU.). Versión 2.4.1 — Abril 2026.
