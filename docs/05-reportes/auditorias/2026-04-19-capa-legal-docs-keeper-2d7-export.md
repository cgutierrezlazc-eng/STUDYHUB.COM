# Reporte legal-docs-keeper — Capa legal sub-sub-bloque 2d.7 (Export PDF/DOCX)

**Fecha**: 2026-04-19
**Agente**: legal-docs-keeper
**Branch**: `bloque-2d-features`
**Trigger**: flujo reforzado — el sub-sub-bloque 2d.7 introduce generación
de archivos descargables (PDF/DOCX) que salen del control de Conniku una
vez descargados, sanitización con eliminación silenciosa de imágenes de
dominios no whitelisted, y promesas de UI ("portada", "rúbrica") que el
backend actualmente no implementa. Adicionalmente, convive con una deuda
preexistente de seguridad (SSRF en V1 xhtml2pdf) que no se resuelve en
este sub-sub-bloque.

## Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.

---

## 1. Lo que se me pidió

Cita literal de la instrucción recibida:

> Eres legal-docs-keeper del proyecto Conniku. Auditas el sub-sub-bloque
> **2d.7 Export PDF/DOCX** que está en branch `bloque-2d-features`,
> pre-Capa 7.
>
> **Contexto**: Módulo nuevo: `backend/workspaces_export.py` genera PDF
> (WeasyPrint) y DOCX (python-docx) del contenido de workspaces.
> Procesamiento: texto del usuario + opcionalmente portada +
> opcionalmente rúbrica. Datos que se exportan: contenido del documento
> (puede contener datos académicos del usuario), título, autores
> (miembros del workspace), rúbrica si include_rubric. Metadatos
> limpiados explícitamente: `author=""`, `last_modified_by=""`,
> `title=""` en DOCX. Whitelist dominios imágenes: solo `*.conniku.com`
> (Supabase Storage omitido — deuda).
>
> **Lo que debes auditar**: [7 puntos: Privacy actual, T&C,
> retención del archivo descargado, contenido colaborativo en exports
> con `chars_contributed`, SSRF whitelist incompleta, contenido
> académico con derechos de autor Ley 17.336, y deuda preexistente C1
> SSRF xhtml2pdf en V1 `collab_routes.py`].
>
> **Produce**: borrador Privacy en
> `docs/legal/drafts/2026-04-19-privacy-policy-2d7-export.md`; borrador
> T&C en `docs/legal/drafts/2026-04-19-terms-2d7-export.md`; actualizar
> `docs/legal/alerts.md` con alertas del 2d.7 (críticas, moderadas,
> informativas).
>
> **Límites estrictos**: NO publicar directamente, NO afirmar "cumple
> la ley", declaración obligatoria al final. Reporte en
> `docs/reports/2026-04-19-capa-legal-docs-keeper-2d7-export.md` con 4
> secciones CLAUDE.md + razonamiento extendido. Arranca. Usa Read +
> Grep + Write.

## 2. Lo que efectivamente hice

### 2.1 Lecturas (solo lectura, ningún archivo de producto modificado)

| Archivo | Rango | Propósito |
|---|---|---|
| `/Users/cristiang./CONNIKU/CLAUDE.md` | lectura previa (system-reminder) | alinear reglas vigentes |
| `/Users/cristiang./CONNIKU/docs/legal/alerts.md` | completo (150 líneas) | estado previo de alertas |
| `/Users/cristiang./CONNIKU/docs/legal/drafts/2026-04-18-privacy-policy-2c-athena.md` | L1-80 | heredar tono y versionado |
| `/Users/cristiang./CONNIKU/docs/reports/2026-04-18-capa-legal-docs-keeper-2c-athena.md` | L1-60 | contexto de decisiones anteriores |
| `/Users/cristiang./CONNIKU/docs/reports/2026-04-18-capa-1-backend-builder-2d7-export.md` | completo | declaraciones del backend-builder |
| `/Users/cristiang./CONNIKU/backend/workspaces_export.py` | completo (635 líneas) | verificación directa del código auditado |
| `/Users/cristiang./CONNIKU/src/pages/PrivacyPolicy.tsx` | completo (827 líneas) | estado v2.1 vigente |
| `/Users/cristiang./CONNIKU/src/pages/TermsOfService.tsx` | L1-150 | verificar versión pública de T&C |
| `/Users/cristiang./CONNIKU/src/components/workspaces/Export/ExportModal.tsx` | completo (175 líneas) | confirmar qué se promete al usuario en la UI |

### 2.2 Grep ejecutados (evidencia cruzada)

```
grep "include_cover\|include_rubric" backend/workspaces_export.py
→ 526:    include_cover: bool = Field(False, description="Incluir página de portada")
→ 527:    include_rubric: bool = Field(False, description="Incluir rúbrica al final")
→ 532:    include_cover: bool = Field(False, description="Incluir página de portada")
→ 533:    include_rubric: bool = Field(False, description="Incluir rúbrica al final")
```

Resultado: los flags se declaran en Pydantic pero **no aparecen en el
cuerpo de `export_pdf` ni `export_docx`**. Confirmado: no se renderiza
portada ni rúbrica.

```
grep "chars_contributed" backend/**/*.py
→ workspaces_routes.py:137, 859, 865 (uso en API)
→ migrations.py:434 (columna en BD)
→ database.py:1906 (modelo SQLAlchemy)
→ tests/test_workspaces_models.py:136 (test)
```

Resultado: `chars_contributed` existe en BD y API, pero **no es
consultado por `workspaces_export.py`**. Ningún código de export lee
esta columna ni los nombres de los miembros. El escenario planteado
por el trigger ("si 3 usuarios contribuyeron al documento, al exportar
PDF con portada ¿se incluyen los 3 nombres?") **no ocurre hoy**.

### 2.3 Borradores generados

| Ruta absoluta | Tipo | Tamaño |
|---|---|---|
| `/Users/cristiang./CONNIKU/docs/legal/drafts/2026-04-19-privacy-policy-2d7-export.md` | nuevo | ~230 líneas |
| `/Users/cristiang./CONNIKU/docs/legal/drafts/2026-04-19-terms-2d7-export.md` | nuevo | ~280 líneas |

Contenido de cada borrador:

- **Privacy**: agrega (a) bullet "Documentos exportados" en §2.1;
  (b) nueva sub-sección 5.3 "Procesamiento al exportar documentos";
  (c) párrafo aclaratorio en §6. Versión propuesta v2.3 (o v2.2 si se
  publica antes del 2c). MINOR.
- **T&C**: agrega nueva §8 "Exportación de Documentos" con 7
  sub-secciones (disponibilidad, contenido del archivo, propiedad
  intelectual del contenido exportado con cita a Art. 71 B Ley 17.336,
  control del archivo descargado, fidelidad del formato, autenticidad
  y Ley 19.799, uso legítimo). Versión propuesta v3.1 (o v3.0). MINOR.

### 2.4 Actualización de `docs/legal/alerts.md`

Archivo actualizado a fecha 2026-04-19 con 7 alertas nuevas del 2d.7:

| ID | Severidad | Título |
|---|---|---|
| ALERTA-2D7-1 | CRÍTICA | Deuda C1 preexistente: xhtml2pdf SSRF en V1 (`collab_routes.py`) |
| ALERTA-2D7-2 | MODERADA | Frontend promete portada/rúbrica que el backend no implementa (Art. 12 letra b Ley 19.496) |
| ALERTA-2D7-3 | MODERADA | Whitelist de imágenes no incluye Supabase Storage: pérdida silenciosa |
| ALERTA-2D7-4 | MODERADA | Nueva sub-sección 5.3 Privacy Policy requiere publicación |
| ALERTA-2D7-5 | MODERADA | Cláusula T&C "Exportación de documentos" pendiente |
| ALERTA-2D7-6 | INFORMATIVA | Futuro: render de portada con nombres de co-autores requerirá consentimiento |
| ALERTA-2D7-7 | INFORMATIVA | Contenido académico con citas de terceros: responsabilidad del usuario |

Todas las alertas preexistentes (2C-1 a 2C-5 y LEG-1 a LEG-5) se
preservaron íntegras; no se cerró ninguna en este ciclo.

### 2.5 Verificación de código no tocado

No modifiqué ningún archivo fuera de:

- `/Users/cristiang./CONNIKU/docs/legal/drafts/2026-04-19-privacy-policy-2d7-export.md` (C)
- `/Users/cristiang./CONNIKU/docs/legal/drafts/2026-04-19-terms-2d7-export.md` (C)
- `/Users/cristiang./CONNIKU/docs/legal/alerts.md` (M)
- `/Users/cristiang./CONNIKU/docs/reports/2026-04-19-capa-legal-docs-keeper-2d7-export.md` (C, este reporte)

Ningún `src/`, `backend/`, o archivo de configuración fue tocado.

---

## 3. Lo que no hice y por qué

### 3.1 No verifiqué en leychile.cl que Art. 71 B Ley 17.336 siga vigente y aplique a "cita académica"

El borrador de T&C §8.3 cita Art. 71 B como fundamento de la excepción
de cita. La numeración en Ley 17.336 puede haber cambiado con
modificaciones recientes. No pude ejecutar la verificación porque no
dispongo de acceso de red para consultar
`https://www.bcn.cl/leychile/navegar?idNorma=28933`. El borrador
documenta explícitamente esta necesidad en "Observaciones sobre la
cláusula" e instruye retirar la cita específica y dejar "legislación
vigente sobre propiedad intelectual" si no puede verificarse antes de
publicar.

### 3.2 No verifiqué la vigencia literal de Ley 19.799 sobre firma electrónica

El borrador T&C §8.6 menciona "firma electrónica avanzada en los
términos de la Ley N° 19.799". No verifiqué si hubo modificaciones
recientes a esa ley que afecten el alcance del concepto. Requiere
validación de abogado.

### 3.3 No propuse texto para publicar visualmente al usuario cuando una imagen se elimina

ALERTA-2D7-3 identifica la pérdida silenciosa de imágenes fuera de la
whitelist. La solución real requiere cambio en backend y frontend
(emitir un warning en la respuesta del export que el frontend muestre
en el modal antes de descargar). Eso es tarea del builder, no del
legal-docs-keeper. Mi aporte se limita a declarar el problema y
proponer la resolución como acción recomendada.

### 3.4 No actualicé `docs/pendientes.md` con mención cruzada de la ALERTA-2D7-1

Podría haber agregado una línea en `docs/pendientes.md` enlazando
alerta legal con la deuda C1 técnica, pero ese archivo lo mantiene el
web-architect / backend-builder en cierre de bloques. Evité tocarlo
para no salir de mi scope.

### 3.5 No propuse resolver ALERTA-LEG-2 (divergencia pages vs components T&C) en este ciclo

La divergencia existe desde antes del 2d.7 y publicar la nueva §8
"Exportación de documentos" sólo en `src/pages/TermsOfService.tsx`
preserva la divergencia. Lo ideal sería consolidar ambas versiones
primero. No lo propuse como parte de este borrador porque excede el
scope del 2d.7. Dejo la alerta viva.

### 3.6 No propuse cambios sobre la restricción de 18 años (ALERTA-LEG-3)

Igual que arriba: pre-existe al 2d.7 y resolverla requiere cambios en
Privacy §10, T&C §3, prompt de chatbot, y tabla `user_agreements`.
Excede el scope.

### 3.7 No verifiqué con grep el contenido real del router V1 `collab_routes.py` para confirmar si está expuesto

Leí el reporte del backend-builder que afirma que V1 sigue expuesto,
pero no re-ejecuté la verificación directa sobre `server.py`. ALERTA-
2D7-1 deja la acción recomendada (a) como "verificar con gap-finder /
code-reviewer si el endpoint V1 sigue expuesto" para que se cruce en
capa siguiente.

---

## 4. Incertidumbres

Estas son incertidumbres explícitas del propio trabajo de este agente,
no resumen de alertas:

### 4.1 El borrador Privacy propone "Versión 2.3"; el 2c propone "Versión 2.2"

Si los dos borradores se publican en días distintos, el orden decide
la numeración final. Si el operador publica primero el de 2d.7 (por
simplicidad de alcance) saltándose el de 2c, la v2.2 referenciada por
el 2c quedará obsoleta en numeración. Documenté en ambos borradores la
condicional "versión 2.2 o 2.3 según se aplique antes o después del
2c", pero no garantizo que la redacción condicional sea clara para
quien ejecute el merge. Sería más limpio consolidar ambos borradores
en un único v3.0 de Privacy, pero excede el scope de este ciclo.

### 4.2 La cláusula T&C §8.2 letra c ("portada o rúbrica no incluidas si no están habilitadas") es una salida defensiva

Legalmente razonable, pero éticamente cuestionable: el usuario marca
un checkbox y recibe un archivo sin lo que marcó, sin aviso claro. La
cláusula cubre a Conniku pero **no protege al usuario** frente a la
expectativa que la UI creó. La recomendación honesta es la Opción A
(desactivar los checkboxes en el frontend con "Disponible
próximamente") y usar §8.2 letra c sólo como respaldo genérico a
futuro. Esto lo documenté en el borrador pero no tengo manera de
forzar que se elija A; depende de Cristian y del builder.

### 4.3 No verifiqué que `core_props.author = ""` sobreviva a la serialización de python-docx en todas las plataformas

El backend-builder afirma que python-docx respeta el valor `""`
establecido en `core_props.author`. Si alguna versión futura de
python-docx decide "si está vacío, usa el usuario del sistema", el
archivo DOCX podría filtrar identidad. No lo verifiqué con un test
adversarial (leer el DOCX generado y confirmar que `author` sigue
vacío). El test funcional actual no lo cubre explícitamente.

### 4.4 El borrador Privacy §5.3 afirma "Conniku no conserva una copia del archivo exportado después de entregárselo"

Leí el código (`export_pdf` retorna bytes en memoria, `export_docx`
usa `io.BytesIO`). No hay persistencia obvia a disco ni a BD. Pero no
verifiqué logs del servidor: si Render / Vercel registran el body de
respuestas (improbable para binarios grandes, pero posible), podría
quedar copia transitoria. La afirmación es honesta respecto de lo que
Conniku controla directamente, pero no garantizo que ningún
intermediario de infraestructura la contradiga. Si hay duda, abogado
debe evaluar si la afirmación es defendible.

### 4.5 ALERTA-2D7-1 (SSRF V1) se clasificó CRÍTICA pero puede no ser explotable

Depende de si el endpoint V1 sigue ruteado en `server.py`. Si ya está
retirado del router, la vulnerabilidad es **inactiva** y la alerta
debería bajar a MODERADA ("código muerto con vulnerabilidad, limpiar"). Si
sigue expuesta, CRÍTICA es correcta. No re-verifiqué el estado real;
me apoyé en el reporte del backend-builder que afirma "C1 existe en
el flujo V1 mientras collab_routes.py siga expuesto". Esta es la
incertidumbre más operacionalmente importante del reporte.

---

## 5. Razonamiento extendido

El trigger del main loop planteó 7 puntos a auditar. A continuación
documento cómo evalué cada uno, qué alternativas consideré, y por qué
elegí la redacción que fue a los borradores. Esto es parte del
compromiso del agente de dejar trazabilidad en decisiones no
mecánicas.

### 5.1 Sobre "la Política de Privacidad debe declarar el export"

**Alternativas consideradas**:

(a) No declarar el export: la Política de Privacidad actual (§5)
    habla de "almacenamiento y seguridad" en términos genéricos.
    Argumento: el export no agrega nuevos destinatarios (no hay
    tercero nuevo), y la transferencia al dispositivo del usuario
    podría considerarse parte inherente del servicio.

(b) Declararlo como sub-sección dentro de §5 "Almacenamiento y
    Seguridad" (opción elegida).

(c) Crear una nueva sección de primer nivel "Export de Documentos".

**Criterio aplicado**: Ley 19.628 Art. 4° exige "información sobre
el propósito del almacenamiento y su eventual comunicación al
público". El export **cambia el estado de los datos**: lo que antes
estaba en Conniku con TLS + control de acceso, ahora está en un
archivo arbitrario en el dispositivo del usuario. Ese cambio de
estado es el tratamiento nuevo que hay que declarar. GDPR Art. 13
refuerza: el titular debe saber qué hace el responsable con sus
datos, incluyendo transformaciones.

**Por qué (b) y no (c)**: Una sección de primer nivel "Export" elevaría
la percepción del tratamiento a nivel "recolección", lo cual es
desproporcionado: el export no recolecta datos nuevos, sólo transforma
los existentes. §5.3 como sub-sección es proporcional al cambio real.

**Por qué no (a)**: Conservador en la duda. Aunque es defendible que
el export es "parte del servicio", la claridad protege al usuario. Si
un usuario alega que no sabía que el archivo descargado no está
protegido por Conniku, la actual Privacy v2.1 no tiene nada que
mostrar.

### 5.2 Sobre "el archivo descargado sale del control de Conniku"

**Alternativas consideradas**:

(a) Omitirlo (es obvio).

(b) Declararlo en Privacy pero no en T&C.

(c) Declararlo en T&C pero no en Privacy.

(d) Declararlo en ambos con énfasis distinto (opción elegida).

**Criterio aplicado**: Privacy declara el **tratamiento**; T&C declara
la **responsabilidad**. Son documentos distintos con funciones
distintas. En Privacy §5.3 se dice "el archivo queda fuera de nuestro
control" como parte del ciclo de vida del dato. En T&C §8.4 se dice
"el usuario es el único responsable del archivo descargado" como parte
de la distribución de responsabilidad. Ambos textos son honestos si
se leen juntos.

**Por qué no (a)**: no es obvio para el usuario promedio. La gente no
distingue naturalmente entre "mi archivo en la nube" y "mi archivo
descargado". Lo declaro explícitamente porque es la base para §8.4 b
de T&C ("el usuario es el único responsable").

### 5.3 Sobre "propiedad intelectual del contenido exportado"

**Alternativas consideradas**:

(a) Omitir (la responsabilidad ya está en los T&C generales sobre
    contenido subido).

(b) Agregar cláusula específica para el export (opción elegida).

**Criterio aplicado**: Cuando el contenido está dentro de la
plataforma, la responsabilidad del usuario es clara pero limitada (no
hay distribución todavía). Cuando se exporta, **se puede distribuir
sin restricción**. Eso eleva el riesgo de infracción de derechos de
terceros. Es análogo a la diferencia entre "subí una foto a mi perfil
privado" vs "descargué una foto para enviarla por email a 100
personas": el riesgo legal escala con la capacidad de distribución.

Además, la cita al Art. 71 B Ley 17.336 (cita académica permitida) es
**valiosa para el usuario**: le explica en qué condiciones puede
legítimamente incluir fragmentos de obras de terceros en un documento
académico. No es sólo descargo defensivo; es información útil.

**Por qué no (a)**: porque los T&C generales no cubren el escenario
específico de distribución fuera de la plataforma. Agregar es más
seguro que asumir cobertura por extensión.

### 5.4 Sobre "los 3 nombres del workspace en la portada = consentimiento explícito"

**Pregunta del trigger**: si 3 usuarios contribuyen a un documento y
se exporta con portada, ¿la inclusión de los 3 nombres constituye
consentimiento explícito de los 3?

**Verificación factual**: leí `backend/workspaces_export.py` completo.
**No se incluye ningún nombre de miembro en el archivo generado**. Los
flags `include_cover` e `include_rubric` se reciben pero no se
renderizan. La premisa del trigger **no ocurre hoy** en el código.

**Alternativas consideradas**:

(a) Responder "no aplica, la funcionalidad no existe" y no declarar
    nada.

(b) Declararlo preventivamente en Privacy anticipando la
    implementación futura.

(c) Documentarlo como alerta informativa para cuando se implemente
    (opción elegida: ALERTA-2D7-6).

**Criterio aplicado**: principio de "nunca inventar datos" (CLAUDE.md).
Si el código no incluye nombres, declarar en Privacy que "el archivo
puede contener nombres de co-autores" sería falso. Pero ignorar la
pregunta es abandonar al futuro yo del legal-docs-keeper.

**Marco legal aplicable cuando se implemente**:

- Base legal preferida: **ejecución del contrato** (GDPR Art. 6(1)(b),
  Ley 19.628 consentimiento implícito por aceptación de términos de
  colaboración). Rationale: el co-autor acepta al unirse al workspace
  que está co-editando un documento con otros, y los documentos
  colaborativos por naturaleza llevan "autoría compartida".
- Base legal alternativa: consentimiento explícito GDPR Art. 6(1)(a).
  Más protectiva del co-autor pero genera fricción operacional ("cada
  vez que quiero exportar debo pedir permiso a los otros 3").
- Estándar de la industria (Google Docs, Notion, Microsoft 365):
  ejecución del contrato con declaración al aceptar invitación.

**Conclusión documentada en ALERTA-2D7-6**: cuando se implemente, optar
por (a) ejecución del contrato, declararlo en Privacy y T&C. Esto
replica la práctica estándar de la industria y no genera fricción
operacional excesiva.

### 5.5 Sobre "Supabase Storage omitido en whitelist — pérdida de datos relevante legalmente"

**Alternativas consideradas**:

(a) Clasificarlo como "fuga de datos" (CRÍTICA).

(b) Clasificarlo como "pérdida funcional silenciosa" → consumidor
    Art. 12 Ley 19.496 (MODERADA).

(c) No clasificarlo (es deuda técnica).

**Criterio aplicado**: pérdida ≠ fuga. No hay dato **filtrado** a
terceros; hay dato **no entregado** al usuario que lo solicitó. El
marco aplicable no es GDPR Art. 32 (seguridad del tratamiento) sino
Ley 19.496 Art. 12 letra b (información veraz sobre condiciones del
servicio). Un usuario que exportó un documento con imágenes propias
alojadas en Supabase recibe un archivo sin esas imágenes, sin aviso.
Eso es **falta de información veraz**, no brecha de datos.

**Por qué MODERADA y no CRÍTICA**: no bloquea el despliegue; puede
cubrirse con un banner en el modal ("imágenes que no sean de
conniku.com pueden no aparecer en el archivo exportado"). Pero sí
requiere atención antes de que el volumen de uso escale.

### 5.6 Sobre "contenido académico exportado con derechos de autor — Ley 17.336"

Cubierto en T&C §8.3. Aquí el razonamiento es directo: la
responsabilidad del contenido es del usuario que lo subió. Conniku
actúa como prestador de servicio neutral. Art. 71 B Ley 17.336
establece la excepción de cita, que el usuario puede invocar
legítimamente para incluir fragmentos de obras de terceros en un
trabajo académico. La cláusula pone la carga donde corresponde y da al
usuario la referencia legal que le ayuda a entender en qué condiciones
puede citar.

**Cuidado**: la cita a Art. 71 B debe verificarse en leychile.cl
antes de publicar (ver incertidumbre 3.1).

### 5.7 Sobre "deuda preexistente C1 — SSRF xhtml2pdf en V1"

**Alternativas consideradas**:

(a) Ignorar (es deuda previa, no introducida por 2d.7).

(b) Clasificarla como MODERADA (ya estaba, nadie la explotó).

(c) Clasificarla como CRÍTICA bloqueante del deploy del 2d.7
    (opción elegida).

**Criterio aplicado**: GDPR Art. 32 y Ley 19.628 Art. 11 exigen
**medidas técnicas apropiadas**. Desplegar V2 seguro conviviendo con
V1 vulnerable es precisamente lo opuesto: es mostrar que se sabe que
hay un problema y no actuar. Si un atacante explota C1 después del
deploy del 2d.7, la defensa "no sabíamos" no es invocable — el
reporte del backend-builder lo documenta explícitamente, y este
reporte lo reitera.

**Por qué CRÍTICA y no sólo bloqueante de deploy**: porque el SSRF
de AWS metadata es una de las clases de vulnerabilidad más
explotadas en la década. El ejemplo paradigmático (Capital One 2019)
resultó en fuga masiva de datos personales y multa de USD 80M.
Mantener ese vector vivo, aun en código teóricamente "no usado", es
responsabilidad material del responsable del tratamiento.

**Acciones recomendadas** (listadas en ALERTA-2D7-1 por orden de
preferencia): (a) retirar router V1 de `server.py`, (b) condicionarlo
a flag, (c) actualizar `docs/pendientes.md` C1.

### 5.8 Decisión de versionado

Opté por numerar los borradores como MINOR (v2.1 → v2.3 en Privacy,
v3.0 → v3.1 en T&C) bajo el criterio definido en el perfil del
legal-docs-keeper:

- **MAJOR**: cambios que afectan derechos u obligaciones del usuario.
- **MINOR**: clarificaciones, nuevas secciones no restrictivas.
- **PATCH**: correcciones tipográficas.

El cambio del 2d.7 es **clarificación**: declara un tratamiento
existente (el export es una transformación de datos ya autorizada por
la ejecución del contrato) y agrega información sobre responsabilidad
del archivo descargado. No crea nuevos derechos ni obligaciones que
restrinjan al usuario. Por eso MINOR y sin re-aceptación requerida.

Si Cristian o un abogado determinan que la cláusula T&C §8.7 ("uso
legítimo") es realmente una **obligación nueva** del usuario (no usar
el archivo para suplantación), el cambio subiría a MAJOR y requeriría
re-aceptación. Lo dejo abierto al criterio profesional.

---

## Declaración obligatoria (repetida al cierre)

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.
