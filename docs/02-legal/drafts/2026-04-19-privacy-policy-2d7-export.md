---
documento: Política de Privacidad — borrador de modificaciones
version_actual: 2.1 (vigente, "Última actualización: 11 de abril de 2026")
version_propuesta_acumulada: 2.3 (si se aplica tras la v2.2 del borrador 2c)
                              2.2 (si se aplica antes / en paralelo al 2c)
fecha_borrador: 2026-04-19
autor_borrador: legal-docs-keeper (agente)
disparador: Sub-sub-bloque 2d.7 "Export PDF/DOCX" introduce la generación
            de archivos descargables (PDF vía WeasyPrint, DOCX vía
            python-docx) del contenido de Workspaces, con bajada al
            dispositivo del usuario (fuera del control de Conniku) y
            procesamiento de imágenes remotas pre-descargadas a base64.
estado: BORRADOR — NO publicar sin revisión de Cristian + validación de
        abogado.
prioridad: MODERADA — el desfase existe pero no es sangrante. Se publica
           en la próxima versión consolidada de la política (junto con
           v2.2 del 2c, o inmediatamente después).
---

# Borrador de modificaciones — Política de Privacidad (sub-sub-bloque 2d.7, Export PDF/DOCX)

## Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.

## Contexto del cambio

El sub-sub-bloque 2d.7 agrega dos endpoints:

- `POST /workspaces/{id}/export/pdf` — genera un PDF vía WeasyPrint.
- `POST /workspaces/{id}/export/docx` — genera un DOCX vía python-docx.

Ambos devuelven un `Response` con `Content-Disposition: attachment`, lo
que fuerza la descarga del archivo al dispositivo del usuario. Una vez
descargado, el archivo queda **fuera del control de Conniku**: el
usuario lo puede compartir, imprimir, enviar por correo, subir a otro
servicio, etc.

Elementos relevantes del flujo 2d.7 desde la perspectiva de protección
de datos:

1. **Contenido procesado**: el HTML del documento del usuario es enviado
   al backend, sanitizado con `bleach` (whitelist estricta de tags y
   atributos) y transformado a PDF/DOCX.
2. **Imágenes remotas**: la función `inline_remote_images` descarga
   imágenes cuyo hostname esté en la whitelist `_ALLOWED_REMOTE_IMG_DOMAINS`
   (`conniku.com`, `www.conniku.com`, `cdn.conniku.com`, `api.conniku.com`)
   y las inlinea como `data:image/...;base64,...` dentro del HTML antes
   de renderizar. Cualquier imagen con hostname fuera de la whitelist
   (incluyendo Supabase Storage del proyecto) **se elimina silenciosamente
   del documento exportado** sin avisar al usuario.
3. **Metadatos DOCX limpiados**: el código asigna explícitamente
   `core_props.author = ""`, `core_props.last_modified_by = ""`,
   `core_props.title = ""` para que el archivo descargado no filtre
   identidad del usuario que exporta.
4. **Metadatos PDF**: WeasyPrint **no** recibe metadatos de identidad
   desde el HTML generado por el frontend actual; el caller del endpoint
   pasa el `html` directamente y no incluye `<meta name="author">` ni
   `<title>` con identidad. Riesgo residual: si en el futuro un caller
   agrega esos tags, se filtran al PDF. Esto es una advertencia
   operacional, no un hallazgo legal directo.
5. **Portada y rúbrica** (desfase documentado): los parámetros
   `include_cover` e `include_rubric` son aceptados por los endpoints
   pero **no se renderizan** en la implementación backend actual (sólo
   se leen los campos Pydantic; ningún bloque de portada ni rúbrica es
   inyectado en el HTML/DOCX de salida). Mientras el backend no
   implemente efectivamente esas secciones, no hay inclusión de
   "nombres de miembros" ni de "rúbrica" en los exports. Este borrador
   **no** declara inclusión de esas secciones; las menciona como
   funcionalidad potencial a cubrir cuando el render se implemente.

Ninguno de estos elementos está cubierto hoy en la v2.1 de la Política
de Privacidad. El cambio que se propone es **MINOR** (versión 2.2 o
2.3 según se aplique antes o después del borrador 2c): agrega una
sub-sección que declara honestamente el comportamiento del export,
los derechos del usuario sobre los archivos descargados, y el límite
del control de Conniku.

## Versión propuesta

- Si se aplica antes del borrador 2c (poco probable): **v2.2** — fecha
  "19 de abril de 2026".
- Si se aplica después de publicar v2.2 del 2c (probable): **v2.3** —
  fecha "19 de abril de 2026" o posterior.

Este borrador escribe los diffs contra **v2.1** (estado actual vigente)
para que no dependan del orden de publicación. Si se aplica encima del
borrador 2c, el merge de ambos diffs no produce colisión (tocan
secciones distintas).

## Cambios propuestos (diff-style)

### Cambio 1 — Encabezado / versión

**Archivo**: `src/pages/PrivacyPolicy.tsx` línea 115.

```diff
- <p style={styles.date}>Última actualización: 11 de abril de 2026 · Versión 2.1</p>
+ <p style={styles.date}>Última actualización: 19 de abril de 2026 · Versión 2.3</p>
```

Al pie del documento (`src/pages/PrivacyPolicy.tsx` línea 821):

```diff
- Versión 2.1 — Abril 2026.
+ Versión 2.3 — Abril 2026.
```

(Ajustar el número de versión si se aplica antes del 2c.)

### Cambio 2 — Sección 2.1 "Datos proporcionados por el usuario"

Agregar un bullet al final de la lista existente (después de "Contenido
del usuario" y, si ya se aplicó el cambio 2 del borrador 2c, después
de "Interacciones con asistentes inteligentes"):

```diff
  <li>
    <strong>Contenido del usuario:</strong> documentos, apuntes y materiales subidos a la
    plataforma.
  </li>
+ <li>
+   <strong>Documentos exportados:</strong> cuando usted solicita
+   exportar un documento de Workspaces a PDF o DOCX, el contenido
+   del documento es procesado por nuestros servidores para generar
+   un archivo descargable. Ese archivo se entrega a su dispositivo
+   y, una vez descargado, queda fuera del control de Conniku: usted
+   es el único responsable de su almacenamiento, distribución,
+   copias, respaldo y eliminación posterior.
+ </li>
```

### Cambio 3 — Nueva Sección 5.3 "Procesamiento al exportar documentos"

Insertar una nueva sub-sección dentro de la Sección 5 "Almacenamiento
y Seguridad", después de §5.2 "Medidas de seguridad" (es decir, tras
la línea 365 aproximadamente, antes del inicio de `{/* 6. Terceros */}`):

```diff
+ <h3 style={styles.h3}>5.3. Procesamiento al exportar documentos</h3>
+ <p style={styles.p}>
+   Cuando usted solicita exportar un documento de Workspaces a formato
+   PDF o DOCX:
+ </p>
+ <ul style={styles.ul}>
+   <li>
+     El contenido del documento se envía a nuestros servidores para
+     ser procesado por bibliotecas de generación de archivos
+     (WeasyPrint para PDF, python-docx para DOCX).
+   </li>
+   <li>
+     El contenido es sanitizado por el servidor antes del render:
+     se eliminan scripts, manejadores de eventos, iframes, y
+     cualquier elemento ajeno al contenido textual y visual
+     autorizado.
+   </li>
+   <li>
+     Las imágenes referenciadas desde dominios externos a Conniku
+     se eliminan del documento exportado por razones de seguridad.
+     Las imágenes alojadas en los dominios de Conniku se incorporan
+     al archivo como datos binarios (base64), quedando contenidas
+     dentro del propio archivo.
+   </li>
+   <li>
+     Los metadatos del archivo DOCX (autor, autor de la última
+     modificación, título) se establecen como vacíos para no filtrar
+     la identidad del usuario que exporta. Los archivos PDF generados
+     tampoco incluyen metadatos de identidad del usuario.
+   </li>
+   <li>
+     Conniku no conserva una copia del archivo exportado después de
+     entregárselo. El archivo se genera en memoria, se envía a su
+     navegador y se descarta.
+   </li>
+   <li>
+     Una vez descargado el archivo en su dispositivo, queda fuera
+     de nuestro control. Si lo comparte, lo envía por correo o lo
+     sube a otro servicio, esa difusión y sus consecuencias son de
+     su exclusiva responsabilidad.
+   </li>
+ </ul>
```

### Cambio 4 — Sección 6, referencia informativa al export

Al final de la Sección 6 "Compartición de Datos con Terceros", agregar
un párrafo aclaratorio para evitar confusión (nota: este párrafo es
**informativo** y se puede omitir si la redacción final queda larga):

```diff
  <p style={styles.p}>
    <strong>
      Conniku no vende, alquila ni comparte sus datos personales con terceros para fines de
      marketing.
    </strong>{' '}
    Nunca transferimos datos a brokers de datos ni a redes publicitarias.
  </p>
+ <p style={styles.p}>
+   Adicionalmente, cuando usted exporta un documento a PDF o DOCX, el
+   archivo generado es entregado directamente a su dispositivo y no
+   compartido con ningún tercero por parte de Conniku.
+ </p>
```

## Lo que este borrador **no** propone (y por qué)

### No propone declarar inclusión de "nombres de miembros" en portada

La implementación actual del backend (`backend/workspaces_export.py`)
acepta los parámetros `include_cover` e `include_rubric` pero **no los
renderiza**. No existe código que inyecte una portada con los nombres
de los miembros del workspace (dato conceptualmente `WorkspaceMember`
+ `chars_contributed`). Por lo tanto, este borrador no declara un
tratamiento que hoy no ocurre.

Cuando el render de portada se implemente en una iteración futura,
será necesario revisar este punto y, si los nombres de los miembros
son incluidos en el archivo de salida, declararlo en la Política de
Privacidad con un texto como:

> "Si usted incluye la portada en el export, el archivo descargado
> contendrá los nombres de los miembros del workspace que hayan
> contribuido al documento."

Y, en paralelo, considerar si eso constituye un tratamiento con base
legal en el contrato (6(1)(b) GDPR) o si requiere mecanismo de
consentimiento explícito entre co-autores (ver ALERTA-2D7-3 abajo en
`alerts.md`).

### No propone enumerar "Supabase Storage" como destino adicional

La whitelist de dominios no incluye actualmente Supabase Storage. Las
imágenes que el usuario haya subido desde Supabase al editor **se
eliminan silenciosamente del export**. Desde protección de datos, no
hay tratamiento adicional: lo que ocurre es **pérdida funcional
silenciosa**, no fuga de datos. Esto es un problema de consumidor (Ley
19.496 Art. 12: información veraz sobre condiciones del servicio), no
de privacidad. Se cubre en el borrador de T&C.

Cuando Supabase Storage se agregue a la whitelist y pase a ser un
origen válido desde el cual Conniku descarga imágenes al export, habrá
que declararlo en §6 de la Privacy Policy (Supabase como encargado de
tratamiento alojando imágenes del usuario que Conniku lee al exportar).

### No propone cláusula de "consentimiento sobre contenido de terceros incluido en el documento"

Si el documento contiene citas de libros con derechos de autor,
fragmentos de otros trabajos, imágenes de terceros, etc., la
responsabilidad es del usuario que subió el contenido (ver borrador
T&C). Esto es propiedad intelectual (Ley 17.336), no protección de
datos. No pertenece a este documento.

## Metadatos del borrador

- **Versión semántica**: MINOR. No cambia derechos del usuario ni
  bases legales; sólo clarifica un tratamiento nuevo.
- **Notificación al usuario**: informativa. No requiere aceptación
  explícita.
- **Fecha de vigencia propuesta**: la fecha del deploy efectivo del
  sub-sub-bloque 2d.7 a producción (no antes).
- **Archivos afectados (producción)**: `src/pages/PrivacyPolicy.tsx`
  únicamente. No toca la versión del componente
  `src/components/TermsOfService.tsx` (ese componente no contiene
  Política de Privacidad; y la divergencia entre `pages` y
  `components` sigue cubierta por ALERTA-LEG-2).

## Declaración obligatoria (repetida al cierre)

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.
