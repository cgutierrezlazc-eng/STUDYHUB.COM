# Política de Privacidad — Versión 2.1 (archivada)

**Fecha de vigencia:** 11 de abril de 2026  
**Versión:** 2.1  
**Archivado:** 19 de abril de 2026  
**Motivo de archivo:** Reemplazada por versión 2.3 (borradores 2c-athena + 2d.7-export aplicados)  
**Fuente:** `src/pages/PrivacyPolicy.tsx` snapshot previo a commit `legal(privacy): v2.1→v2.3`

---

## Política de Privacidad

Última actualización: 11 de abril de 2026 · Versión 2.1

En Conniku SpA (en adelante, "Conniku", "nosotros" o "la empresa"), nos comprometemos a
proteger la privacidad y los datos personales de nuestros usuarios conforme a la normativa
vigente en cada jurisdicción donde operamos:

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
- **Domicilio:** Santiago, Chile
- **Sitio web:** conniku.com
- **Correo de privacidad:** privacidad@conniku.com
- **Correo de contacto:** contacto@conniku.com

Para consultas sobre privacidad, ejercicio de derechos y cualquier requerimiento relacionado
con el tratamiento de sus datos personales, diríjase a privacidad@conniku.com.

---

## 2. Datos Personales Recopilados

Recopilamos las siguientes categorías de datos personales:

### 2.1. Datos proporcionados por el usuario

- **Datos de identificación:** nombre completo, correo electrónico, foto de perfil.
- **Datos académicos:** universidad, carrera, año de ingreso.
- **Datos de perfil:** biografía, intereses académicos, idiomas.
- **Contenido del usuario:** documentos, apuntes y materiales subidos a la plataforma.

### 2.2. Datos recopilados automáticamente

- **Datos de uso:** actividad de estudio, tiempo en la plataforma, funcionalidades utilizadas, progreso en rutas de aprendizaje.
- **Datos de gamificación:** puntos, rachas de estudio, logros, nivel del usuario.
- **Datos técnicos:** dirección IP, tipo de navegador, sistema operativo, dispositivo utilizado.
- **Datos de comunicación:** mensajes enviados a través de la plataforma (entre usuarios y al soporte).

---

## 3. Finalidad del Tratamiento

Utilizamos sus datos personales para las siguientes finalidades:

- **Prestación del servicio:** crear y gestionar su cuenta, procesar sus materiales de estudio y generar contenido personalizado con tecnologia inteligente.
- **Personalización:** adaptar la experiencia de usuario según sus preferencias académicas, carrera e intereses.
- **Gamificación:** gestionar el sistema de puntos, logros, rachas de estudio y clasificaciones.
- **Notificaciones:** enviar alertas sobre actividad relevante, recordatorios de estudio, mensajes y actualizaciones del servicio.
- **Mejora del servicio:** analizar patrones de uso para mejorar las funcionalidades, corregir errores y desarrollar nuevas herramientas.
- **Comunicaciones:** responder consultas de soporte y enviar información sobre cambios en el servicio.
- **Seguridad:** prevenir fraude, uso indebido y garantizar la seguridad de la plataforma.

---

## 4. Base Legal del Tratamiento

### 4.1. Chile — Ley N° 19.628

- **Consentimiento del titular (Art. 4°):** al crear una cuenta y aceptar esta política, usted consiente expresamente el tratamiento de sus datos.
- **Ejecución de contrato:** el tratamiento es necesario para la prestación del servicio contratado.
- **Interés legítimo:** para mejora del servicio y prevención de fraude, siempre que no prevalezcan los derechos fundamentales del titular.

### 4.2. Unión Europea / EEE — GDPR Art. 6(1)

- **Consentimiento [Art. 6(1)(a)]:** para comunicaciones de marketing y cookies no esenciales.
- **Ejecución de contrato [Art. 6(1)(b)]:** para la prestación del servicio solicitado por el usuario.
- **Obligación legal [Art. 6(1)(c)]:** cuando el tratamiento es requerido por ley aplicable.
- **Interés legítimo [Art. 6(1)(f)]:** para seguridad de la plataforma, prevención de fraude y mejora del servicio, siempre que no prevalezcan los derechos del interesado.

### 4.3. Brasil — LGPD Art. 7°

- **Consentimiento [Art. 7°, I]:** para finalidades específicas informadas al titular.
- **Ejecución de contrato [Art. 7°, V]:** cuando sea necesario para el cumplimiento del contrato.
- **Interés legítimo [Art. 7°, IX]:** para finalidades legítimas, consideradas las expectativas del titular.

### 4.4. California, EE.UU. — CCPA / CPRA

Conniku no vende ni comparte información personal con fines de publicidad conductual entre
empresas. El tratamiento de datos de residentes de California se realiza para las
finalidades de prestación del servicio y mejora de la experiencia del usuario.

---

## 5. Almacenamiento y Seguridad de los Datos

### 5.1. Ubicación de los servidores

Los datos personales son almacenados en servidores ubicados en Estados Unidos de América, a
través de los siguientes proveedores de infraestructura:

- **Render:** alojamiento del servidor backend y base de datos.
- **Vercel:** alojamiento del frontend de la aplicación web.

Las transferencias internacionales de datos (incluyendo desde la UE/EEE) se realizan con las
salvaguardias adecuadas conforme al GDPR Art. 46, mediante las Cláusulas Contractuales Tipo
(Standard Contractual Clauses) aprobadas por la Comisión Europea, y en conformidad con el
Art. 5° de la Ley N° 19.628 de Chile. Ver también la Sección 14 de esta política.

### 5.2. Medidas de seguridad

Implementamos medidas técnicas y organizativas apropiadas para proteger sus datos, incluyendo:

- Cifrado de datos en tránsito mediante protocolo HTTPS/TLS.
- Almacenamiento seguro de contraseñas mediante algoritmos de hashing (bcrypt).
- Autenticación mediante tokens JWT con expiración.
- Control de acceso basado en roles para datos sensibles.
- Monitoreo continuo de la infraestructura.
- Protección contra XSS, CSRF e inyección SQL.

---

## 6. Compartición de Datos con Terceros

Conniku puede compartir datos personales con los siguientes terceros, exclusivamente para
las finalidades indicadas:

| Tercero | Finalidad | Datos compartidos |
|---------|-----------|-------------------|
| **Anthropic** | Procesamiento automatizado de lenguaje natural (generación de resúmenes, asistente de estudio) | Contenido académico proporcionado por el usuario para su procesamiento |
| **MercadoPago / PayPal** | Procesamiento de pagos de suscripciones | Datos necesarios para la transacción (no almacenamos datos de tarjetas) |
| **Zoho Mail** | Envío de correos electrónicos transaccionales y de soporte | Nombre y correo electrónico |
| **Render / Vercel** | Infraestructura de alojamiento (cloud hosting) | Todos los datos almacenados en la plataforma (bajo acuerdos de confidencialidad) |

**Conniku no vende, alquila ni comparte sus datos personales con terceros para fines de
marketing.** Nunca transferimos datos a brokers de datos ni a redes publicitarias.

---

## 7. Derechos del Titular de los Datos (Chile — ARCO)

De conformidad con el artículo 12 y siguientes de la Ley N° 19.628, usted tiene los
siguientes derechos respecto a sus datos personales:

- **Acceso:** conocer los datos que mantenemos sobre usted, su origen y los destinatarios.
- **Rectificación:** corregir datos inexactos, erróneos o incompletos.
- **Cancelación:** solicitar la eliminación de sus datos cuando carezcan de fundamento legal.
- **Oposición:** oponerse al tratamiento de sus datos en los casos permitidos por la ley.

Para ejercer estos derechos, envíe su solicitud a privacidad@conniku.com. Responderemos en
un plazo máximo de 2 días hábiles. También puede modificar o eliminar gran parte de sus datos
directamente desde la configuración de su perfil en la plataforma.

### 7.1. Cómo eliminar tu cuenta y tus datos

Puedes solicitar la eliminación completa de tu cuenta de Conniku en cualquier momento, de
forma gratuita, mediante cualquiera de estos métodos:

- **Desde la app:** Perfil → Configuración → "Zona de peligro" → "Eliminar cuenta" → confirma escribiendo "ELIMINAR".
- **Por correo:** Escribe a privacidad@conniku.com con tu nombre completo y correo registrado.

Los datos identificables se eliminan dentro de los **30 días** siguientes a la solicitud.
Ciertos datos anonimizados pueden conservarse hasta 2 años con fines estadísticos. Para ver
las instrucciones completas y la tabla de retención de datos por tipo, visita:
conniku.com/delete-account.

---

## 8. Cookies y Tecnologías Similares

Conniku utiliza las siguientes tecnologías de almacenamiento local:

- **localStorage:** para almacenar el token de autenticación (JWT), preferencias de tema visual y estado de sesión del usuario.
- **Service Worker:** para habilitar funcionalidades offline y notificaciones push como parte de nuestra aplicación web progresiva (PWA).

No utilizamos cookies de seguimiento de terceros ni tecnologías de rastreo publicitario. No
realizamos fingerprinting de dispositivos con fines comerciales.

---

## 9. Retención de Datos

Conservamos sus datos personales de acuerdo con los siguientes criterios:

- **Cuenta activa:** mientras su cuenta permanezca activa, conservaremos sus datos para la prestación del servicio.
- **Post-eliminación:** tras la eliminación de su cuenta, conservaremos datos anonimizados o agregados por un período de 2 años para fines estadísticos. Los datos identificables serán eliminados dentro de los 30 días siguientes a la solicitud.
- **Obligaciones legales:** ciertos datos podrán conservarse por períodos adicionales cuando sea requerido por ley (registros de facturación, normativa tributaria).

---

## 10. Menores de Edad

Conniku es un servicio destinado a estudiantes universitarios y está diseñado para personas
mayores de 16 años. No recopilamos intencionalmente datos de menores de 16 años. Si tomamos
conocimiento de que hemos recopilado datos de un menor de 16 años sin el consentimiento
adecuado, procederemos a eliminar dichos datos a la brevedad.

Para usuarios de la Unión Europea: el umbral de edad para el tratamiento de datos basado en
consentimiento puede ser de 13 a 16 años según el Estado miembro. Conniku aplica 16 años
como edad mínima uniforme a nivel global.

---

## 11. Cambios a esta Política de Privacidad

Conniku se reserva el derecho de actualizar esta Política de Privacidad en cualquier
momento. Las modificaciones sustanciales serán notificadas con al menos 15 días de
anticipación a través de la plataforma y/o por correo electrónico.

Para usuarios en la UE/EEE: si los cambios implican una nueva finalidad de tratamiento o un
nuevo fundamento legal distinto al consentimiento, solicitaremos su consentimiento expreso
antes de aplicar dichos cambios.

---

## 12. Contacto y Reclamos

Para cualquier consulta, solicitud o reclamo relacionado con sus datos personales:

- Privacidad y datos: privacidad@conniku.com
- Contacto general: contacto@conniku.com
- CEO / Responsable: ceo@conniku.com
- Sitio web: conniku.com

Si no queda satisfecho con nuestra respuesta, puede presentar un reclamo ante la autoridad
de protección de datos competente en su jurisdicción (ver Sección 13).

---

## 13. Derechos Específicos por Jurisdicción

Según su lugar de residencia, usted puede tener derechos adicionales bajo la normativa local.
En todos los casos, puede ejercerlos escribiendo a privacidad@conniku.com.

### 13.1. Usuarios de la Unión Europea y el EEE — GDPR

Si reside en la UE o el Espacio Económico Europeo, el Reglamento (UE) 2016/679 (GDPR) le
otorga los siguientes derechos:

- **Acceso [Art. 15]:** obtener confirmación de si tratamos sus datos y una copia de los mismos.
- **Rectificación [Art. 16]:** rectificar datos inexactos o incompletos.
- **Supresión / "derecho al olvido" [Art. 17]:** solicitar la eliminación de sus datos cuando ya no sean necesarios para la finalidad original, revoque su consentimiento, o se opongan ilegítimamente al tratamiento.
- **Limitación del tratamiento [Art. 18]:** solicitar la restricción del tratamiento en determinadas circunstancias.
- **Portabilidad [Art. 20]:** recibir sus datos en formato estructurado, de uso común y legible por máquina, y transmitirlos a otro responsable.
- **Oposición [Art. 21]:** oponerse al tratamiento basado en interés legítimo o para fines de marketing directo.
- **Decisiones automatizadas [Art. 22]:** no ser objeto de una decisión basada únicamente en tratamiento automatizado que produzca efectos jurídicos significativos.

**Derecho a reclamar ante autoridad supervisora:** tiene derecho a presentar una reclamación
ante la Autoridad de Control de su Estado miembro (p.ej., AEPD en España, CNIL en Francia,
BfDI en Alemania).

**Plazo de respuesta:** responderemos sus solicitudes en un plazo máximo de 30 días calendario
(prorrogable a 60 días en casos complejos, con notificación previa).

### 13.2. Usuarios de Brasil — LGPD

Si reside en Brasil, la Lei Geral de Proteção de Dados Pessoais (Lei N° 13.709/2018) le
otorga los siguientes derechos (Art. 18):

- **Confirmação e acesso [Art. 18, I-II]:** confirmar la existencia del tratamiento y acceder a sus datos.
- **Correção [Art. 18, III]:** corregir datos incompletos, inexactos o desactualizados.
- **Anonimização, bloqueio ou eliminação [Art. 18, IV]:** anonimización, bloqueo o eliminación de datos innecesarios o tratados en incumplimiento de la LGPD.
- **Portabilidade [Art. 18, V]:** portabilidad de sus datos a otro proveedor, conforme a regulación de la ANPD.
- **Informação sobre compartilhamento [Art. 18, VI]:** información sobre entidades públicas y privadas con las que compartimos datos.
- **Revogação do consentimento [Art. 18, IX]:** revocar el consentimiento en cualquier momento, sin perjuicio del tratamiento previo.
- **Revisão de decisões automatizadas [Art. 20]:** solicitar revisión de decisiones tomadas únicamente con base en tratamiento automatizado.

**Autoridade Nacional:** puede presentar una petición ante la ANPD (Autoridade Nacional de
Proteção de Dados). Plazo de respuesta: 15 días hábiles.

### 13.3. Residentes de California, EE.UU. — CCPA / CPRA

Si es residente del Estado de California, la California Consumer Privacy Act (CCPA),
modificada por la California Privacy Rights Act (CPRA), le otorga los siguientes derechos:

- **Right to Know [§1798.100]:** derecho a saber qué categorías e información personal específica hemos recopilado, sus fuentes, finalidades y terceros con quienes se comparte.
- **Right to Delete [§1798.105]:** derecho a solicitar la eliminación de su información personal, con las excepciones previstas en la ley.
- **Right to Correct [§1798.106]:** derecho a solicitar la corrección de información personal inexacta.
- **Right to Opt-Out of Sale or Sharing [§1798.120]:** Conniku **no vende ni comparte** información personal con fines de publicidad conductual entre empresas. No aplica opt-out activo.
- **Right to Limit Use of Sensitive PI [§1798.121]:** derecho a limitar el uso y divulgación de información personal sensible a los fines autorizados.
- **Right to Non-Discrimination [§1798.125]:** Conniku no discriminará a los usuarios que ejerzan sus derechos CCPA. No se le denegarán servicios, se le cobrarán precios diferentes ni se le ofrecerá calidad de servicio inferior por ejercer sus derechos.

**Categorías de información personal recopilada (CCPA):** identificadores (nombre, correo, IP),
información de actividad en internet, datos de geolocalización aproximada (a partir de IP),
información educativa e historial de uso del servicio.

Para ejercer sus derechos CCPA, contacte a privacidad@conniku.com. Puede designar un agente
autorizado. Responderemos en un plazo de 45 días (prorrogable otros 45 días con notificación).
La verificación de identidad puede requerirse.

### 13.4. Usuarios de México — LFPDPPP

Si reside en México, la Ley Federal de Protección de Datos Personales en Posesión de los
Particulares le otorga los derechos ARCO (Acceso, Rectificación, Cancelación y Oposición),
ejercibles ante privacidad@conniku.com. En caso de inconformidad, puede acudir al INAI.

---

## 14. Transferencias Internacionales de Datos

Conniku transfiere datos personales a servidores ubicados en Estados Unidos (Render,
Vercel). Para garantizar la protección de sus datos en estas transferencias:

- **Usuarios de la UE/EEE (GDPR Art. 46):** utilizamos las Cláusulas Contractuales Tipo (Standard Contractual Clauses — SCCs) aprobadas por la Comisión Europea (Decisión 2021/914) como salvaguardia adecuada. Puede solicitar una copia de estas cláusulas escribiendo a privacidad@conniku.com.
- **Usuarios de Brasil (LGPD Art. 33):** la transferencia internacional se realiza con garantías equivalentes de protección, conforme a los mecanismos aprobados por la ANPD.
- **Usuarios de Chile (Ley 19.628 Art. 5°):** la transferencia se realiza con medidas adecuadas de seguridad y confidencialidad.

Todos nuestros proveedores de infraestructura cuentan con certificaciones de seguridad
reconocidas (SOC 2, ISO 27001) y acuerdos de procesamiento de datos (DPA) que les obligan a
proteger sus datos personales con estándares equivalentes a los exigidos por las normativas
aplicables.

---

*Esta Política de Privacidad ha sido redactada en conformidad con la Ley N° 19.628 sobre
Protección de la Vida Privada (Chile), el Reglamento General de Protección de Datos (GDPR,
UE 2016/679), la Lei Geral de Proteção de Dados Pessoais (LGPD, Brasil) y la California
Consumer Privacy Act (CCPA / CPRA, EE.UU.). Versión 2.1 — Abril 2026.*
