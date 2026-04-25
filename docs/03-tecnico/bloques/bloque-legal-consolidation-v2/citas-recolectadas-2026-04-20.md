# Citas legales recolectadas — bloque-legal-consolidation-v2

**Fecha recolección**: 2026-04-20
**Recolector**: agente de investigación legal (Tori subagente)
**Destinatario**: legal-docs-keeper + abogado
**Estado**: BORRADOR PARCIAL — 13 de 14 citas NO ACCESIBLES desde esta sesión por limitaciones técnicas de fetch. Requiere re-recolección manual o desde otra red/navegador antes de validación profesional.

---

## Declaración

Los textos aquí transcritos provienen exclusivamente de las URLs oficiales listadas,
consultadas en la fecha indicada. No se parafrasea ni se rellena desde memoria.
Donde la fuente no fue accesible, se documenta el diagnóstico técnico exacto en vez
de rellenar. Las interpretaciones hacia el bloque quedan pendientes de revisión
profesional por abogado.

---

## Resumen de estado de recolección

| ID  | Norma                                  | Estado                | Motivo                                                  |
|-----|----------------------------------------|-----------------------|---------------------------------------------------------|
| L1  | Art. 3 bis Ley 19.496 (Chile)          | NO ACCESIBLE          | BCN SPA — sin HTML renderizado vía fetch                |
| L2  | Art. 12 Ley 19.496 (Chile)             | NO ACCESIBLE          | BCN SPA — sin HTML renderizado vía fetch                |
| L3  | Art. 17 y 71 B Ley 17.336 (Chile)      | NO ACCESIBLE          | BCN SPA — sin HTML renderizado vía fetch                |
| L4  | Art. 4 Ley 19.628 (Chile)              | NO ACCESIBLE          | BCN SPA — sin HTML renderizado vía fetch                |
| L5  | Art. 16 Ley 19.628 (Chile)             | NO ACCESIBLE          | BCN SPA — sin HTML renderizado vía fetch                |
| L6  | RGPD Art. 13 (UE)                      | NO ACCESIBLE          | EUR-Lex responde 202 async; WebFetch sólo devolvió preámbulo |
| L7  | RGPD Art. 6 (UE)                       | NO ACCESIBLE          | Igual que L6                                            |
| L8  | RGPD Art. 7 (UE)                       | NO ACCESIBLE          | Igual que L6                                            |
| L9  | RGPD Art. 28 (UE)                      | NO ACCESIBLE          | Igual que L6                                            |
| L10 | Directiva 2002/58/CE Art. 5            | OK (parcial útil)     | Artículo 5 completo disponible                          |
| L11 | Ley 19.799 (Chile)                     | NO ACCESIBLE          | BCN SPA — sin HTML renderizado vía fetch                |
| L12 | Código Penal Art. 210 (Chile)          | NO ACCESIBLE          | BCN SPA — sin HTML renderizado vía fetch                |
| L13 | Código Civil Art. 1447 (Chile)         | NO ACCESIBLE          | BCN SPA — sin HTML renderizado vía fetch                |
| L14 | Directiva 2011/83/UE (retracto UE)     | NO ACCESIBLE          | EUR-Lex 202 async; WebFetch sólo devolvió Art. 8 parcial y negó transcripción literal por política de copyright downstream |

**Diagnóstico técnico transversal**:

- **BCN (`www.bcn.cl/leychile/`)**: el portal es una Single Page Application que
  carga el contenido de los artículos mediante JavaScript después del primer render.
  `curl` con user-agent de navegador devuelve HTTP 200 pero sólo ~9.6 KB del shell
  HTML (sin el texto del artículo). `WebFetch` tampoco recupera el contenido
  dinámico. El endpoint JSON interno
  (`/leychile/servicios/consulta/buscarnorma`) devuelve HTTP 401. Para obtener
  el texto literal es necesario abrir la URL en navegador real o descargar el
  PDF oficial desde el botón "Descargar" del propio sitio.
- **EUR-Lex (`eur-lex.europa.eu`)**: todas las variantes probadas
  (`/legal-content/ES/TXT/?uri=...`, `/legal-content/ES/TXT/HTML/?uri=...` con
  CELEX consolidado, `/eli/reg/2016/679/oj/spa/html`) responden HTTP 202
  (Accepted, procesamiento asíncrono) sin body. `WebFetch` sobre la URL
  CELEX genérica devolvió sólo el preámbulo/considerandos, no los artículos
  numerados. Adicionalmente, el modelo downstream de WebFetch rehúsa
  transcribir textos literales extensos del RGPD y la Directiva 2011/83
  invocando políticas de copyright, aunque el Diario Oficial de la UE está
  en dominio público.
- **Acción recomendada**: re-ejecutar la recolección desde un navegador
  humano con acceso a PDFs oficiales, o usar un script con `playwright`/
  `puppeteer` capaz de esperar la hidratación JS de BCN. También sirve
  descargar los PDFs firmados desde la propia página de cada ley.

---

## L1 — Art. 3 bis letra b, Ley 19.496

**URL consultada**: https://www.bcn.cl/leychile/navegar?idNorma=61438
**Fecha consulta**: 2026-04-20
**Estado fuente**: NO ACCESIBLE

**Texto literal del artículo**:

> [FUENTE NO ACCESIBLE]

**Versión vigente al**: no verificable desde esta consulta

**Uso en el bloque**: Pieza 4 — retracto 10 días para servicios digitales.

**Pregunta al abogado** (pendiente, se transcribirá cuando haya texto):
1. ¿El Art. 3 bis letra b dice "10 días corridos" o "10 días hábiles"?
2. ¿Aplica explícitamente a suscripciones digitales como Conniku Pro, o
   requiere interpretación analógica desde "servicios prestados a distancia"?
3. ¿Qué excepciones al retracto aplican a servicios digitales ejecutados
   inmediatamente (ej: acceso a contenido Pro desde el minuto cero)?

**Observaciones técnicas**: WebFetch sobre
`https://www.bcn.cl/leychile/navegar?idNorma=61438` devolvió un mensaje del
propio BCN indicando "Este proceso demora demasiado, es probable que su
conexión esté muy lenta o que su navegador no sea compatible con nuestra
aplicación." Verificado con `curl` (HTTP 200, 9.6 KB) que la respuesta es
el shell HTML de la SPA, sin el contenido del artículo. La variante
`www.leychile.cl/Navegar?idNorma=61438` redirige 301 al mismo host BCN.

---

## L2 — Art. 12, Ley 19.496

**URL consultada**: https://www.bcn.cl/leychile/navegar?idNorma=61438
**Fecha consulta**: 2026-04-20
**Estado fuente**: NO ACCESIBLE

**Texto literal del artículo**:

> [FUENTE NO ACCESIBLE]

**Versión vigente al**: no verificable desde esta consulta

**Uso en el bloque**: Obligación de información veraz al consumidor.

**Pregunta al abogado** (pendiente):
1. ¿El Art. 12 cubre únicamente los "términos y condiciones ofrecidos" o
   abarca toda la información precontractual entregada al consumidor?
2. ¿Cómo se articula con el Art. 3 (derecho a información veraz y oportuna)
   a efectos de redacción de T&C y Policy de Conniku?

**Observaciones técnicas**: mismo comportamiento que L1. La URL sirve una
SPA cuyo contenido carga sólo en un navegador real con JavaScript.

---

## L3 — Art. 17 y Art. 71 B, Ley 17.336

**URL consultada**: https://www.bcn.cl/leychile/navegar?idNorma=28933
**Fecha consulta**: 2026-04-20
**Estado fuente**: NO ACCESIBLE

**Texto literal del artículo**:

> [FUENTE NO ACCESIBLE]

**Versión vigente al**: no verificable desde esta consulta

**Uso en el bloque**: Propiedad intelectual del usuario sobre documentos
exportados (Art. 17); excepciones al derecho de autor relevantes a uso
educativo / fair-use chileno (Art. 71 B).

**Pregunta al abogado** (pendiente):
1. ¿Art. 17 reconoce al autor-usuario derechos patrimoniales plenos sobre
   los documentos que genere en Conniku, o hay limitaciones contractuales
   permitidas?
2. ¿Art. 71 B cubre la copia privada / uso educativo de materiales de
   terceros que los usuarios suban a la plataforma?

**Observaciones técnicas**: mismo patrón BCN SPA. Sin HTML del artículo.

---

## L4 — Art. 4°, Ley 19.628

**URL consultada**: https://www.bcn.cl/leychile/navegar?idNorma=141599
**Fecha consulta**: 2026-04-20
**Estado fuente**: NO ACCESIBLE

**Texto literal del artículo**:

> [FUENTE NO ACCESIBLE]

**Versión vigente al**: no verificable desde esta consulta

**Uso en el bloque**: Deber de información al titular de datos; base
chilena para la Política de Privacidad.

**Pregunta al abogado** (pendiente):
1. ¿El Art. 4 exige autorización expresa del titular, y en qué forma?
2. ¿Cómo se compara la exigencia chilena con el Art. 13 RGPD para efectos
   de convergencia de cláusulas?

**Observaciones técnicas**: BCN SPA. Recomendación: usar
`leychile.cl/Consulta/m/norma_plana?idNorma=141599` en navegador humano
o descargar el PDF oficial desde el propio BCN.

---

## L5 — Art. 16, Ley 19.628

**URL consultada**: https://www.bcn.cl/leychile/navegar?idNorma=141599
**Fecha consulta**: 2026-04-20
**Estado fuente**: NO ACCESIBLE

**Texto literal del artículo**:

> [FUENTE NO ACCESIBLE]

**Versión vigente al**: no verificable desde esta consulta

**Uso en el bloque**: Plazos para ejercicio de derechos ARCO (acceso,
rectificación, cancelación, oposición / habeas data).

**Pregunta al abogado** (pendiente):
1. ¿El Art. 16 establece un plazo específico en días hábiles o corridos
   para que el responsable de la base responda a una solicitud ARCO?
2. ¿El plazo chileno (si existe uno) es más corto o más largo que el plazo
   de "un mes prorrogable" del Art. 12 RGPD? (regla §Cumplimiento Legal:
   prevalece el más restrictivo).

**Observaciones técnicas**: BCN SPA. Pendiente re-consulta.

---

## L6 — RGPD Art. 13 (Reglamento UE 2016/679)

**URL consultada**: https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679
**Fecha consulta**: 2026-04-20
**Estado fuente**: NO ACCESIBLE

**Texto literal del artículo**:

> [FUENTE NO ACCESIBLE]

**Versión vigente al**: consolidación 2016-05-04 según metadato parcialmente
visible; no confirmado a nivel de articulado.

**Uso en el bloque**: Información obligatoria al recolectar datos personales
del interesado; base para el aviso de privacidad mostrado en registro.

**Pregunta al abogado** (pendiente):
1. ¿Qué datos del Art. 13 son obligatorios incluir en el formulario de
   registro de Conniku y cuáles pueden ir en la Política de Privacidad
   vinculada?
2. ¿Cómo se cumple el deber de información cuando la base legal es
   "ejecución de contrato" (Art. 6.1.b)?

**Observaciones técnicas**: la URL devuelve HTTP 202 al fetch directo con
`curl`. WebFetch sí obtuvo contenido pero sólo el preámbulo/considerandos
(se corta antes del articulado). La variante ELI
`https://eur-lex.europa.eu/eli/reg/2016/679/oj/spa/html` también responde
202. Además el modelo downstream declinó transcribir texto literal extenso
invocando política de copyright, aun tratándose de Diario Oficial UE.

---

## L7 — RGPD Art. 6, apartados 1(a), 1(b), 1(f)

**URL consultada**: https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679
**Fecha consulta**: 2026-04-20
**Estado fuente**: NO ACCESIBLE

**Texto literal del artículo**:

> [FUENTE NO ACCESIBLE]

**Uso en el bloque**: Bases legales del tratamiento (consentimiento,
ejecución de contrato, interés legítimo) — necesarias para mapear cada
flujo de datos de Conniku a una base lícita.

**Pregunta al abogado** (pendiente):
1. ¿Qué tratamientos de Conniku deben apoyarse en 6.1.a (consentimiento),
   6.1.b (contrato) y 6.1.f (interés legítimo), y dónde hay solapamiento?
2. Para cookies de analítica propia, ¿6.1.f es defendible o siempre se
   requiere consentimiento por Art. 5(3) ePrivacy?

**Observaciones técnicas**: mismo 202 async de EUR-Lex. Mismo rechazo a
transcripción literal extensa por WebFetch downstream.

---

## L8 — RGPD Art. 7

**URL consultada**: https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679
**Fecha consulta**: 2026-04-20
**Estado fuente**: NO ACCESIBLE

**Texto literal del artículo**:

> [FUENTE NO ACCESIBLE]

**Uso en el bloque**: Condiciones del consentimiento y obligación del
responsable de demostrar que se otorgó.

**Pregunta al abogado** (pendiente):
1. ¿La evidencia que Conniku almacena en `user_agreements` (IP, UA,
   timestamp UTC, zona horaria, hash SHA-256 del texto) cumple la carga
   de la prueba del Art. 7.1?
2. ¿Qué adicionales requiere Art. 7.3 para asegurar la facilidad de
   retirar el consentimiento?

**Observaciones técnicas**: idem L6/L7.

---

## L9 — RGPD Art. 28

**URL consultada**: https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679
**Fecha consulta**: 2026-04-20
**Estado fuente**: NO ACCESIBLE

**Texto literal del artículo**:

> [FUENTE NO ACCESIBLE]

**Uso en el bloque**: Obligaciones que deben constar en los DPA firmados
con cada proveedor (Supabase, Render, Vercel, Anthropic, Zoho, Firebase,
MercadoPago, PayPal).

**Pregunta al abogado** (pendiente):
1. Para cada proveedor anterior, ¿el DPA estándar que publican en sus
   portales basta para cumplir los incisos 3 letras a)-h) del Art. 28, o
   hay lagunas que requieren addendum?
2. Sub-encargados (Art. 28.2 y 28.4): ¿basta la autorización genérica del
   DPA o Conniku debe notificar a usuarios cada vez que un proveedor cambie
   sub-encargados?

**Observaciones técnicas**: idem L6. Probable necesidad de leer Art. 28
completo (apartados 1-10) en el PDF oficial consolidado.

---

## L10 — Directiva 2002/58/CE Art. 5(3) (ePrivacy)

**URL consultada**: https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32002L0058
**Fecha consulta**: 2026-04-20
**Estado fuente**: OK

**Texto literal del artículo** (Artículo 5, apartados 1 a 3, versión
consolidada en español; el apartado 3 es el referido al consentimiento
para cookies):

> **Artículo 5 — Confidencialidad de las comunicaciones**
>
> **1.** Los Estados miembros garantizarán, a través de la legislación
> nacional, la confidencialidad de las comunicaciones, y de los datos de
> tráfico asociados a ellas, realizadas a través de las redes públicas de
> comunicaciones y de los servicios de comunicaciones electrónicas
> disponibles al público. En particular, prohibirán la escucha, la
> grabación, el almacenamiento u otros tipos de intervención o vigilancia
> de las comunicaciones y los datos de tráfico asociados a ellas por
> personas distintas de los usuarios, sin el consentimiento de los usuarios
> interesados, salvo cuando dichas personas estén autorizadas legalmente a
> hacerlo de conformidad con el apartado 1 del artículo 15. El presente
> apartado no impedirá el almacenamiento técnico necesario para la
> conducción de una comunicación, sin perjuicio del principio de
> confidencialidad.
>
> **2.** El apartado 1 no se aplicará a las grabaciones legalmente
> autorizadas de comunicaciones y de los datos de tráfico asociados a
> ellas cuando se lleven a cabo en el marco de una práctica comercial
> lícita con el fin de aportar pruebas de una transacción comercial o de
> cualquier otra comunicación comercial.
>
> **3.** Los Estados miembros velarán por que únicamente se permita el uso
> de las redes de comunicaciones electrónicas con fines de almacenamiento
> de información o de obtención de acceso a la información almacenada en
> el equipo terminal de un abonado o usuario a condición de que se facilite
> a dicho abonado o usuario información clara y completa, en particular
> sobre los fines del tratamiento de los datos, con arreglo a lo dispuesto
> en la Directiva 95/46/CE y de que el responsable del tratamiento de los
> datos le ofrezca el derecho de negarse a dicho tratamiento. La presente
> disposición no impedirá el posible almacenamiento o acceso de índole
> técnica al solo fin de efectuar o facilitar la transmisión de una
> comunicación a través de una red de comunicaciones electrónicas, o en
> la medida de lo estrictamente necesario a fin de proporcionar a una
> empresa de información un servicio expresamente solicitado por el
> usuario o el abonado.

**Versión vigente al**: consolidación declarada por EUR-Lex **19 de
diciembre de 2009** (tras modificación por Directiva 2009/136/CE).

**Uso en el bloque**: Consentimiento previo para cookies y tecnologías
equivalentes no estrictamente necesarias (UE).

**Pregunta al abogado**:
1. ¿El banner de cookies de Conniku (opt-in explícito para analítica y
   marketing, con opt-out por categoría) cumple el estándar del Art. 5(3)
   en su lectura actualizada por RGPD (consentimiento informado, libre,
   específico y demostrable)?
2. ¿Qué cookies de Conniku califican como "estrictamente necesarias" y
   por tanto exentas del apartado 3 (p. ej. sesión JWT en localStorage,
   service worker, CSRF)?

**Observaciones técnicas**: único artículo recuperado íntegro en esta
sesión. El texto proviene de la versión consolidada EUR-Lex 2009-12-19;
no pude validar contra el Diario Oficial exacto por el mismo problema
202 async. El abogado debería cotejar contra el PDF del DOUE antes de
citar en documentos legales del producto.

---

## L11 — Ley 19.799 (firma electrónica)

**URL consultada**: https://www.bcn.cl/leychile/navegar?idNorma=196640
**Fecha consulta**: 2026-04-20
**Estado fuente**: NO ACCESIBLE

**Texto literal del artículo**:

> [FUENTE NO ACCESIBLE]

**Uso en el bloque**: Valor probatorio de la "firma electrónica simple"
(checkbox con evidencia de contexto) bajo la ley chilena, como soporte
de la aceptación de T&C y de la declaración jurada de mayoría de edad.

**Pregunta al abogado** (pendiente):
1. ¿Qué artículo específico de la Ley 19.799 define "firma electrónica"
   simple vs avanzada, y cuál establece el valor probatorio de la simple?
   (Recordatorio: típicamente art. 2 letra f y arts. 3-5, por verificar).
2. ¿El checkbox de registro, acompañado de IP + UA + timestamp + hash del
   texto, cumple los requisitos mínimos de firma electrónica simple?
3. ¿Cuándo es obligatoria la firma electrónica avanzada en lugar de la
   simple para los contratos que Conniku hace con usuarios?

**Observaciones técnicas**: BCN SPA. Pendiente re-consulta.

---

## L12 — Código Penal Art. 210 (falsedad en declaración jurada)

**URL consultada**: https://www.bcn.cl/leychile/navegar?idNorma=1984
**Fecha consulta**: 2026-04-20
**Estado fuente**: NO ACCESIBLE

**Texto literal del artículo**:

> [FUENTE NO ACCESIBLE]

**Uso en el bloque**: Soporte penal de la declaración jurada de mayoría
de edad firmada por el usuario al registrarse (§CLAUDE.md "Componente 2:
Checkbox declarativo" menciona el Art. 210 como verificación pendiente).

**Pregunta al abogado** (pendiente — CRÍTICO):
1. ¿El Art. 210 del Código Penal es efectivamente el aplicable a la
   falsedad en declaración jurada extrajudicial firmada digitalmente en
   un formulario de registro? ¿O la tipificación corresponde a otro
   artículo (ej. Art. 206, 208, 212)?
2. ¿Es válido citar "Art. 210 CP" en el checkbox mostrado al usuario, o
   se debe mantener la fórmula genérica "responsabilidad civil y penal
   según la legislación vigente" hasta validación profesional?

**Observaciones técnicas**: BCN SPA. Este punto bloquea la finalización
del texto del checkbox de registro según nota de verificación ya
existente en CLAUDE.md §Flujo de verificación de edad.

---

## L13 — Código Civil Art. 1447 (capacidad)

**URL consultada**: https://www.bcn.cl/leychile/navegar?idNorma=172986
**Fecha consulta**: 2026-04-20
**Estado fuente**: NO ACCESIBLE

**Texto literal del artículo**:

> [FUENTE NO ACCESIBLE]

**Uso en el bloque**: Incapacidad absoluta y relativa de menores de edad,
base civil de la restricción "plataforma exclusiva para mayores de 18
años" y de la nulidad de registros de menores aunque hayan marcado el
checkbox.

**Pregunta al abogado** (pendiente):
1. ¿Art. 1447 distingue entre incapacidad absoluta (impúber) y relativa
   (menor adulto entre 14 y 18)? ¿Cómo afecta a la validez del contrato
   de suscripción si un menor se registra mintiendo?
2. ¿La declaración jurada falsa del usuario menor exime a Conniku de
   responsabilidad, o subsiste la obligación de restituir lo pagado
   (art. 1688 u otro)?

**Observaciones técnicas**: BCN SPA. Pendiente re-consulta.

---

## L14 — Directiva 2011/83/UE, Art. 9 (retracto UE 14 días)

**URL consultada**: https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32011L0083
**Fecha consulta**: 2026-04-20
**Estado fuente**: NO ACCESIBLE

**Texto literal del artículo**:

> [FUENTE NO ACCESIBLE]

**Uso en el bloque**: Retracto 14 días consumidor UE — contraste con los
10 días del Art. 3 bis Ley 19.496 chilena (regla: prevalece el más
restrictivo cuando un usuario UE usa Conniku).

**Pregunta al abogado** (pendiente):
1. ¿Art. 9(1) fija efectivamente 14 días naturales desde la celebración
   del contrato para servicios, incluidos los digitales?
2. Art. 16 letra m) (contenido digital no soportado en material físico):
   ¿qué condiciones exactas debe cumplir Conniku para que el usuario
   renuncie válidamente al retracto al empezar a usar el servicio Pro
   antes del plazo de 14 días?
3. Art. 10: ¿cuál es la consecuencia de no informar correctamente del
   derecho de desistimiento (extensión del plazo a 12 meses)?

**Observaciones técnicas**: EUR-Lex 202 async. WebFetch devolvió sólo
Art. 8 parcial en la primera consulta; al pedir la versión consolidada
por URL alternativa, el modelo downstream rechazó transcribir
literalmente invocando política de copyright. Recomendación: abrir en
navegador humano
`https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:02011L0083-20220528`
y copiar los apartados desde ahí, o descargar el PDF consolidado.

---

## Acciones recomendadas para completar la recolección

1. **Abrir cada URL BCN en navegador humano** y copiar/pegar el articulado
   completo en este mismo archivo, reemplazando cada bloque
   `[FUENTE NO ACCESIBLE]`. Alternativamente, descargar el PDF oficial
   firmado que ofrece BCN en cada ley y citar el archivo descargado.
2. **Abrir EUR-Lex en navegador humano** con la URL consolidada de cada
   norma (CELEX `02016R0679-YYYYMMDD` para RGPD y
   `02011L0083-20220528` para Directiva 2011/83). Los PDFs están en
   dominio público del DOUE.
3. **Registrar fecha de última modificación visible** en el sitio BCN
   (aparece al pie de cada norma) y la fecha de consolidación en EUR-Lex.
4. **No proceder con el bloque `bloque-legal-consolidation-v2`** hasta que
   este archivo contenga los 14 textos literales y esté firmado por
   legal-docs-keeper + abogado. Regla §CLAUDE.md "Prohibición de inventar
   información legal" + §22 "Verificación de premisas".
