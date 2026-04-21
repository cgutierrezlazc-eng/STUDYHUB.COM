---
documento: Política de Cookies
version: 1.0.0
vigencia_desde: "2026-04-21"
autor_aprobacion: "Cristian Gutiérrez Lazcano (CEO Conniku SpA)"
fecha_aprobacion: "2026-04-21"
estado: VIGENTE
---

# Política de Cookies — Conniku

**Última actualización: 21 de abril de 2026 · Versión 1.0.0**

Esta Política de Cookies describe de forma clara y veraz las tecnologías de
almacenamiento en el dispositivo del Usuario que Conniku SpA ("Conniku")
utiliza en su plataforma web y en sus aplicaciones móviles. Es un documento
complementario a la Política de Privacidad y a los Términos y Condiciones de
Conniku, y forma parte integrante de ellos.

Esta Política se aplica al dominio `conniku.com` y sus subdominios autorizados,
así como a las aplicaciones móviles nativas basadas en Capacitor (Android e iOS)
y a la extensión de navegador Conniku.

## 1. Qué son las cookies y otras tecnologías similares

Una "cookie" es un pequeño archivo de texto que un sitio web guarda en el
navegador del Usuario cuando lo visita. Junto con las cookies tradicionales,
los sitios modernos utilizan otras tecnologías equivalentes para conseguir el
mismo objetivo: recordar información entre visitas o entre sesiones del mismo
Usuario. Dichas tecnologías incluyen:

- `localStorage` (almacenamiento local persistente del navegador)
- `sessionStorage` (almacenamiento temporal que se borra al cerrar la pestaña)
- `IndexedDB` (base de datos estructurada en el navegador)
- Caché del Service Worker (usada en las Progressive Web Apps para soporte
  offline)

Esta Política cubre todas estas tecnologías de manera uniforme, entendiéndolas
como "cookies" en sentido amplio conforme al Art. 5(3) de la Directiva
ePrivacy (2002/58/CE) y a la doctrina de la AEPD española y el Comité Europeo
de Protección de Datos (EDPB Guidelines 05/2020).

## 2. Categorías de cookies que usamos

Conniku clasifica todas las tecnologías de almacenamiento en cuatro categorías,
siguiendo las directrices del EDPB (Opinion 04/2012 y Guidelines 05/2020) y
del Art. 5(3) de la Directiva ePrivacy:

### 2.1 Necesarias (esenciales)

Son aquellas sin las cuales el servicio solicitado por el Usuario no puede
entregarse. No requieren consentimiento previo, sino que se instalan sobre la
base del Art. 6(1)(b) GDPR (ejecución del contrato) o del Art. 5(3) in fine
de la Directiva ePrivacy ("cuando sea estrictamente necesario para la
prestación de un servicio de la sociedad de la información expresamente
solicitado por el abonado o usuario").

Ejemplos en Conniku:

| Clave / nombre | Finalidad | Duración |
|---|---|---|
| `conniku_token`, `conniku_refresh_token` | Mantiene la sesión autenticada del Usuario tras el inicio de sesión. Sin ellas el servicio no puede prestarse. | Hasta cierre de sesión o expiración del token (máx. 30 días) |
| Caché del Service Worker (PWA) | Permite el funcionamiento offline y acelera la carga de la interfaz almacenando recursos estáticos (HTML, CSS, JS, imágenes) autorizados. | Hasta la próxima actualización de la plataforma |
| `cc_visitor_uuid` | Identificador pseudónimo del registro de consentimiento de cookies del visitante. Clasificación detallada en §3. | Máximo 13 meses (ver §3) |

### 2.2 Funcionales

Son aquellas que no son estrictamente necesarias pero permiten al Usuario una
experiencia consistente (idioma, tema, progreso académico local). Se instalan
sobre la base del Art. 6(1)(b) GDPR (ejecución del contrato) una vez que el
Usuario ha iniciado sesión, conforme al §4 de esta Política.

Ejemplos en Conniku:

| Clave / nombre | Finalidad | Duración |
|---|---|---|
| `conniku_language`, `conniku_theme` | Recuerda las preferencias de idioma (es, en) y tema visual (claro, oscuro) del Usuario entre visitas. | Persistente hasta que el Usuario la cambie |
| `conniku_welcomed`, `conniku_apps_banner_v3`, `pwa-install-dismissed`, `ob_visited` | Evita mostrar nuevamente el tour de bienvenida, el banner de apps móviles o la invitación a instalar la PWA una vez que el Usuario ya los ha visto o descartado. | Persistente |
| `conniku_feed_sort`, `conniku_course_progress_*`, `conniku_course_quiz_*`, `conniku_quiz_history`, `conniku_enrollment_id`, `conniku_ceo_signature` | Guarda el progreso académico local (orden del feed, lecciones completadas, historial de cuestionarios), datos de inscripción y firmas del módulo CEO en el propio dispositivo para funcionamiento offline básico y rendimiento. | Persistente hasta borrado manual |

### 2.3 Analíticas

Son aquellas que permiten al responsable medir y analizar el uso del servicio
para mejorar su funcionamiento. Requieren consentimiento previo e informado
conforme al Art. 6(1)(a) GDPR y al Art. 5(3) de la Directiva ePrivacy.

**Estado actual en Conniku: ninguna.** Conniku no utiliza actualmente cookies
ni scripts de analítica de terceros (Google Analytics, Mixpanel, Amplitude,
Hotjar u otros). Si en el futuro Conniku incorporase herramientas de análisis,
se implementará un mecanismo de consentimiento previo granular y esta
Política se actualizará con notificación al Usuario.

### 2.4 Marketing

Son aquellas que permiten el seguimiento del Usuario con fines publicitarios,
retargeting, medición de campañas o elaboración de perfiles comerciales.
Requieren consentimiento previo, informado, libre y específico conforme al
Art. 6(1)(a) y Art. 7 GDPR y al Art. 5(3) de la Directiva ePrivacy.

**Estado actual en Conniku: ninguna.** Conniku no utiliza cookies de terceros
con fines publicitarios, no integra scripts de redes publicitarias, pixels de
seguimiento, brokers de datos ni plataformas de retargeting. Cualquier cambio
futuro a este punto requerirá una actualización pública de esta Política y
el consentimiento previo del Usuario recogido mediante el banner de cookies.

## 3. Cookie `cc_visitor_uuid` — clasificación como esencial

La cookie `cc_visitor_uuid` es un identificador pseudónimo UUID v4 generado
del lado cliente la primera vez que un visitante interactúa con el banner de
cookies. Se utiliza exclusivamente para asociar el registro de consentimiento
almacenado en el servidor (tabla `cookie_consents`) con el dispositivo del
visitante, sin necesidad de recolectar datos identificables adicionales antes
del login.

Conniku clasifica `cc_visitor_uuid` como **cookie estrictamente necesaria**
(no analítica, no marketing) porque su única función es permitirle a Conniku
cumplir su obligación de demostrar el consentimiento conforme al Art. 7(1)
GDPR ("cuando el tratamiento se base en el consentimiento del interesado,
el responsable deberá ser capaz de demostrar que aquel consintió el
tratamiento de sus datos personales"). Sin esta cookie, Conniku no puede
vincular el registro de consentimiento con el visitante que lo emitió, lo
que dejaría el consentimiento sin trazabilidad probatoria.

Esta clasificación se sustenta en las cuatro condiciones siguientes, que
Conniku asume como obligaciones públicas:

1. **Plazo máximo 13 meses en dispositivo.** La cookie expira 13 meses
   después de su creación. Esto alinea su duración con el criterio
   recomendado por la CNIL francesa (Délibération 2020-091) y la AEPD
   española (Guía sobre uso de cookies, julio 2023) para cookies técnicas
   de consentimiento.
2. **Uso restringido a identificar el registro de consentimiento.** El UUID
   no se utiliza para ningún otro propósito: no se combina con datos
   analíticos, no se envía a terceros, no participa en decisiones
   automatizadas, no se usa para personalización de contenido ni para
   publicidad. Su único consumo es como clave foránea del registro en
   `cookie_consents`.
3. **Regeneración al retirar consentimiento.** Cuando el Usuario retira el
   consentimiento otorgado, la cookie `cc_visitor_uuid` existente se elimina
   y, si el Usuario vuelve a interactuar con el banner, se genera un UUID
   nuevo. Esto evita que un identificador pseudónimo pueda persistir más
   allá del alcance del consentimiento activo.
4. **Declaración explícita en esta Política.** Esta cláusula §3 de la
   Política de Cookies constituye la declaración expresa de la existencia,
   finalidad, duración y base legal de `cc_visitor_uuid`, conforme a la
   obligación de información del Art. 13 GDPR y al Art. 4° de la Ley
   chilena 19.628.

Base legal aplicable: Art. 6(1)(f) GDPR (interés legítimo de Conniku en
demostrar el consentimiento y cumplir con el principio de responsabilidad
proactiva del Art. 5(2) GDPR), en concordancia con la excepción del Art. 5(3)
in fine de la Directiva ePrivacy ("estrictamente necesaria para la
prestación de un servicio de la sociedad de la información expresamente
solicitado"). El tratamiento supera el test de ponderación porque el
interés del Usuario en la privacidad no se ve afectado materialmente: la
cookie contiene un identificador pseudónimo sin datos personales directos,
su duración está acotada, y su finalidad es precisamente proteger los
derechos del Usuario (trazabilidad del consentimiento otorgado o retirado).

## 4. Funcionales post-login — base legal Art. 6(1)(b) GDPR (ejecución de contrato)

Las cookies y tecnologías de almacenamiento clasificadas como **funcionales**
en el §2.2 se instalan sobre la base del **Art. 6(1)(b) GDPR** (ejecución del
contrato de prestación de servicios entre el Usuario y Conniku), una vez que
el Usuario ha iniciado sesión y ha aceptado los Términos y Condiciones.

La justificación es la siguiente:

- El Usuario celebra con Conniku un contrato de prestación de servicios
  educativos al aceptar los Términos y Condiciones en el momento del registro.
- Ese contrato incluye la entrega de un servicio personalizado: el Usuario
  espera que la plataforma recuerde su idioma preferido, su tema visual, su
  progreso académico, su lugar en los cursos, los banners que ya descartó,
  entre otros.
- Sin esas cookies funcionales, Conniku no puede ejecutar el contrato
  conforme a la expectativa razonable del Usuario: el servicio se degradaría
  a una experiencia no personalizada que no corresponde al servicio
  contratado.

Por esa razón, Conniku no solicita un consentimiento adicional específico
para estas cookies funcionales post-login: la base legal es la ejecución del
contrato, no el consentimiento. El Usuario puede en cualquier momento
eliminarlas manualmente desde su navegador o desinstalando la aplicación
móvil, conforme al §8 de esta Política, aceptando que con ello la
experiencia se degradará.

Esta clasificación se apoya en:

- **EDPB Guidelines 2/2019** sobre el tratamiento de datos personales en el
  contexto de la prestación de servicios en línea conforme al Art. 6(1)(b)
  GDPR, §§ 32-36 (personalización como parte integrante del servicio).
- **Ley 19.496 Art. 3 letra b** sobre información veraz y oportuna al
  consumidor sobre las condiciones de funcionamiento del servicio.

## 5. Retención de registros de consentimiento

Conniku conserva los registros de consentimiento otorgados a través del banner
de cookies (tabla `cookie_consents` y tablas relacionadas) durante un plazo
mínimo de **5 años contados desde la fecha en que el Usuario eliminó su
cuenta o desde la fecha en que el consentimiento fue retirado**, el que sea
posterior.

Este plazo se fundamenta en:

- **Art. 17(3)(e) GDPR**: la obligación de supresión (derecho al olvido) no
  aplica cuando el tratamiento es necesario para la formulación, el
  ejercicio o la defensa de reclamaciones. Los registros de consentimiento
  son precisamente la prueba que Conniku necesita conservar para defenderse
  frente a una eventual reclamación posterior del Usuario o de una
  autoridad de protección de datos sobre la licitud del tratamiento.
- **Art. 2515 del Código Civil chileno**: el plazo general de prescripción
  de las acciones personales es de 5 años contados desde que la obligación
  se hizo exigible. Conservar los registros por ese plazo asegura que
  Conniku pueda aportar prueba durante toda la ventana en que una acción
  judicial civil podría iniciarse.
- **Art. 5(1)(e) GDPR** (principio de limitación del plazo de conservación):
  la conservación por 5 años es proporcional al fin probatorio y no
  excesiva.

Durante ese plazo, los registros de consentimiento se mantienen en un sistema
de acceso restringido al equipo legal y de cumplimiento, desvinculados de la
cuenta eliminada. Transcurridos los 5 años, los registros se eliminan de forma
irreversible.

## 6. Pseudonimización de IP y User-Agent a los 12 meses

Como medida adicional de minimización de datos conforme al Art. 5(1)(c) GDPR
y al Art. 32 GDPR (seguridad del tratamiento), Conniku aplica una
pseudonimización automática a dos campos del registro de consentimiento
transcurridos **12 meses** desde la fecha de emisión del consentimiento:

- **Dirección IP**: se reemplaza por un hash SHA-256 de la IP original más un
  salt propio de Conniku. El hash resultante no permite recuperar la IP de
  origen pero sí verificar, en caso de disputa, si una IP concreta coincide
  con un registro concreto.
- **User-Agent**: se reemplaza por una descripción canónica reducida
  (navegador y sistema operativo principales, sin versión menor, sin
  identificadores únicos de dispositivo).

La finalidad del registro de consentimiento (demostrabilidad ante una
eventual reclamación) se preserva con los datos pseudonimizados, y al mismo
tiempo se reduce el riesgo de identificación individual transcurrido el
periodo razonable de utilidad probatoria plena.

Esta medida se apoya en:

- **Art. 4(5) GDPR** (definición de pseudonimización).
- **Considerando 28 GDPR** (la pseudonimización reduce los riesgos).
- **Art. 25 GDPR** (protección de datos por diseño y por defecto).

## 7. Tus derechos y cómo ejercerlos

Conforme a la Ley chilena N° 19.628, al Reglamento General de Protección de
Datos (GDPR) y a la legislación aplicable a cada jurisdicción, tú tienes
derecho a:

- **Retirar tu consentimiento** en cualquier momento, con el mismo
  procedimiento con que lo otorgaste. El retiro no afecta la licitud del
  tratamiento realizado antes del retiro (Art. 7(3) GDPR).
- **Acceder** a los registros de consentimiento que Conniku tiene sobre ti,
  incluyendo qué categorías aceptaste, cuándo y desde qué dispositivo (Art.
  15 GDPR; Art. 12 Ley 19.628).
- **Rectificar** información errónea o desactualizada en tu registro (Art.
  16 GDPR; Art. 12 Ley 19.628).
- **Suprimir** tu registro, con las limitaciones del §5 anterior y del Art.
  17(3)(e) GDPR.
- **Portabilidad**: recibir una copia estructurada en formato legible por
  máquina de los registros de consentimiento asociados a tu cuenta (Art. 20
  GDPR). Esta portabilidad se entrega en formato JSON o CSV según tu
  elección.
- **Oponerte** al tratamiento fundado en interés legítimo (Art. 21 GDPR),
  salvo cuando Conniku demuestre motivos legítimos imperiosos o la necesidad
  de defensa frente a reclamaciones.
- **Presentar un reclamo** ante la autoridad de control competente de tu
  jurisdicción. En Chile: el Consejo para la Transparencia (mientras rija
  la Ley 19.628, hasta el 30 de noviembre de 2026) y la Agencia de
  Protección de Datos Personales (desde el 1 de diciembre de 2026, conforme
  a la Ley 21.719). En la Unión Europea: la autoridad de control del Estado
  miembro donde resides.

Para ejercer cualquiera de estos derechos, escribe a
`legal@conniku.com` o `dpo@conniku.com`. Conniku
responderá en un plazo máximo de 30 días calendario conforme al Art. 12(3)
GDPR, prorrogable por 60 días adicionales en casos de especial complejidad
con notificación previa al solicitante.

## 8. Cómo cambiar tus preferencias de cookies

Tienes tres mecanismos para gestionar o eliminar cookies y almacenamiento
local:

**A. Banner de preferencias de Conniku.** El banner de cookies accesible
desde el pie de página permite revisar y modificar, en cualquier momento y
de forma granular, el consentimiento otorgado a cada categoría (necesarias,
funcionales, analíticas, marketing). Los cambios surten efecto inmediato.

**B. Configuración del navegador.** Puedes gestionar o eliminar cookies y
almacenamiento local directamente desde tu navegador:

- **Chrome**: <https://support.google.com/chrome/answer/95647>
- **Firefox**: <https://support.mozilla.org/es/kb/Borrar%20cookies>
- **Safari**: <https://support.apple.com/es-cl/guide/safari/sfri11471/mac>
- **Edge**: <https://support.microsoft.com/es-es/microsoft-edge>

**C. Ajustes del sistema operativo móvil.** En las aplicaciones móviles
basadas en Capacitor, puedes limpiar los datos locales desde los ajustes del
sistema operativo (Ajustes → Aplicaciones → Conniku → Almacenamiento →
Borrar datos) o desinstalando la aplicación.

**Advertencia.** Si desactivas las cookies estrictamente necesarias (por
ejemplo, las de autenticación o `cc_visitor_uuid`), la plataforma dejará de
funcionar correctamente: no podrás iniciar sesión, acceder a contenido que
requiera identificación, ni interactuar con el banner de consentimiento.

## 9. Marco legal aplicable

Esta Política se fundamenta en la siguiente normativa, con indicación expresa
de los artículos aplicables:

- **Reglamento (UE) 2016/679 (GDPR)**: Art. 5(3) (principios), Art. 6(1)(a),
  (b), (f) (bases legales), Art. 7 (condiciones del consentimiento), Art.
  13-14 (información al interesado), Art. 15-22 (derechos del interesado),
  Art. 17(3)(e) (excepción a la supresión por defensa de reclamaciones),
  Art. 25 (protección por diseño), Art. 32 (seguridad del tratamiento).
  Fuente: <https://eur-lex.europa.eu/eli/reg/2016/679/oj>.

- **Directiva 2002/58/CE (ePrivacy)**: Art. 5(3) (almacenamiento de
  información en el equipo terminal del usuario, consentimiento e
  información previa). Fuente:
  <https://eur-lex.europa.eu/eli/dir/2002/58/oj>.

- **Ley chilena 19.628 sobre Protección de la Vida Privada** (vigente hasta
  el 30 de noviembre de 2026): Art. 4° (información al titular al momento
  de recolectar), Art. 12 (derechos ARCO del titular), Art. 16 (procedimiento
  de habeas data). Fuente: <https://www.bcn.cl/leychile/navegar?idNorma=141599>.

- **Ley chilena 21.719 que regula la protección y el tratamiento de los datos
  personales** (vigente desde el **1 de diciembre de 2026** conforme a su
  Artículo 1° transitorio: "La presente ley entrará en vigencia el día
  primero del mes vigésimo cuarto posterior a su publicación en el Diario
  Oficial", publicada en el Diario Oficial con CVE-2583630 el 13 de diciembre
  de 2024). Esta ley moderniza el régimen chileno de protección de datos y
  crea la Agencia de Protección de Datos Personales. Cuando entre en
  vigencia, supersede a la Ley 19.628 y alinea el estándar chileno al nivel
  de protección del GDPR. Fuente:
  <https://www.bcn.cl/leychile/navegar?idNorma=1208720>.

- **Ley chilena 19.496 sobre Protección de los Derechos de los Consumidores**:
  Art. 3 letra b (derecho a información veraz y oportuna sobre condiciones
  de funcionamiento del servicio), Art. 3 bis (derecho de retracto de 10
  días corridos para servicios digitales). Fuente:
  <https://www.bcn.cl/leychile/navegar?idNorma=61438>.

- **EDPB Guidelines 05/2020** sobre consentimiento conforme al Reglamento
  2016/679. Fuente: <https://edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_es>.

- **AEPD Guía sobre uso de cookies** (julio 2023). Fuente:
  <https://www.aepd.es/guias/guia-cookies.pdf>.

En caso de conflicto entre regímenes aplicables, Conniku aplica el estándar
más protector para el Usuario.

## 10. Vigencia y cambios a esta Política

Esta Política de Cookies está vigente desde el **21 de abril de 2026**,
corresponde a la **versión 1.0.0** y supersede todas las versiones
anteriores.

Conniku podrá actualizar esta Política cuando cambien las tecnologías
utilizadas, se incorporen nuevos proveedores o evolucione el marco
regulatorio. Cada actualización:

- Se publicará en este mismo documento con nueva fecha y número de versión.
- Quedará registrada en `docs/legal/LEGAL_VERSIONS.md` con hash SHA-256 del
  archivo.
- Cuando el cambio sea material (por ejemplo, nueva categoría de cookies,
  nuevos proveedores terceros, cambio de base legal), se notificará al
  Usuario mediante el mecanismo de re-aceptación descrito en la Política de
  Privacidad, y el Usuario deberá otorgar nuevamente su consentimiento antes
  de continuar usando el servicio.
- Cuando el cambio sea menor (corrección tipográfica, aclaración sin cambio
  sustantivo), se notificará por correo electrónico a los Usuarios
  registrados sin requerir re-aceptación.

## 11. Contacto

Para cualquier consulta, solicitud de ejercicio de derechos o reclamación
relacionada con esta Política de Cookies, puedes escribir a:

- **Asuntos legales y consultas de privacidad**: `legal@conniku.com`
- **Delegado de Protección de Datos (DPO)**: `dpo@conniku.com`
- **Contacto general**: `contacto@conniku.com`

Conniku SpA
RUT: 78.395.702-7
Domicilio: Antofagasta, Chile

## 12. Historial de versiones

| Versión | Fecha de vigencia | Resumen de cambios |
|---|---|---|
| 1.0.0 | 2026-04-21 | Primera versión pública y canónica. Supersede al stub `v3.2/cookies.md` anterior (que compartía hash con `v3.1/cookies.md`). Documenta explícitamente: inventario real de cookies y localStorage de la plataforma; clasificación de `cc_visitor_uuid` como cookie esencial con cuatro condiciones (plazo 13 meses, uso restringido, regeneración al retirar consentimiento, declaración explícita); base legal Art. 6(1)(b) GDPR para cookies funcionales post-login; retención 5 años post-delete con fundamento Art. 17(3)(e) GDPR + Art. 2515 Código Civil chileno; pseudonimización de IP y User-Agent a los 12 meses; referencia a vigencia de Ley 21.719 a partir del 1 de diciembre de 2026. |

---

**Declaración legal.** Este documento no constituye asesoría legal
profesional. El Usuario que requiera asesoramiento jurídico específico sobre
su situación particular debe consultar con un abogado de su confianza.
Conniku ha elaborado esta Política con base en la normativa vigente a la
fecha de su publicación y se reserva el derecho de actualizarla conforme a
los cambios regulatorios que correspondan.
