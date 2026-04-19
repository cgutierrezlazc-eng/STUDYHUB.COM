---
documento: Términos y Condiciones de Uso — borrador de nueva cláusula
version_actual: sin numeración explícita (pages vs components divergentes,
                cubierto por ALERTA-LEG-2); "Última actualización: 8 de
                abril de 2026" en src/pages/TermsOfService.tsx.
version_propuesta_acumulada: v3.1 si se aplica tras v3.0 del borrador 2c;
                             v3.0 si no existe v3.0 previa publicada.
fecha_borrador: 2026-04-19
autor_borrador: legal-docs-keeper (agente)
disparador: Sub-sub-bloque 2d.7 "Export PDF/DOCX" agrega funcionalidad
            de generación de archivos descargables con implicaciones de
            propiedad intelectual, responsabilidad del contenido, límite
            del control de Conniku sobre el archivo una vez descargado,
            y promesas de producto ("tapa/portada", "rúbrica de
            evaluación") que el backend todavía no implementa.
estado: BORRADOR — NO publicar sin revisión de Cristian + validación de
        abogado.
prioridad: MODERADA — el desfase más serio es la promesa de "portada"
           y "rúbrica" en el frontend sin implementación backend, que
           toca Art. 12 Ley 19.496 (información veraz). Se puede
           publicar en paralelo a v3.0 del 2c o en iteración
           siguiente.
---

# Borrador de cláusula T&C — "Exportación de documentos" (sub-sub-bloque 2d.7)

## Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.

## Contexto del cambio

El sub-sub-bloque 2d.7 introduce en Workspaces la capacidad de
**exportar documentos a PDF y DOCX** mediante dos endpoints:

- `POST /workspaces/{id}/export/pdf`
- `POST /workspaces/{id}/export/docx`

La UI (`src/components/workspaces/Export/ExportModal.tsx`) ofrece al
usuario dos checkboxes: "Tapa/portada del documento" e "Incluir
rúbrica de evaluación como anexo". El backend recibe ambos flags pero
**no los implementa** actualmente (los parámetros se leen pero no se
renderiza ni portada ni rúbrica). Esta divergencia entre lo prometido
al usuario y lo entregado por el servidor es el hallazgo más serio
desde consumidor (Art. 12 letra b, Ley 19.496: información veraz y
oportuna).

Adicionalmente, el export implica cuestiones que los T&C vigentes no
cubren:

1. **Propiedad intelectual del contenido exportado**: si el documento
   contiene fragmentos, imágenes o citas de terceros, ¿quién es
   responsable cuando el archivo circula fuera de Conniku? (Ley 17.336
   Chile).
2. **Control del archivo descargado**: una vez que el PDF/DOCX está en
   el dispositivo del usuario, Conniku no puede revocarlo, actualizarlo
   ni eliminarlo. Esto debe declararse explícitamente.
3. **Límites técnicos y errores del export**: WeasyPrint puede fallar
   si las librerías nativas no están instaladas (retorna 501); el
   export puede perder formato complejo (HTML ↔ DOCX no es biyectivo);
   las imágenes fuera de la whitelist se eliminan silenciosamente. El
   usuario tiene derecho a una descarga de responsabilidad clara.
4. **Uso del archivo exportado para suplantación / fraude**: el archivo
   no tiene marca de agua ni firma digital. Un tercero podría modificar
   el PDF y alegar que es original de Conniku. Es responsabilidad del
   usuario validar la autenticidad.

## Versión propuesta

- Si se aplica en paralelo a v3.0 del borrador 2c: **v3.1**, fecha
  "19 de abril de 2026" o posterior, sin nueva re-aceptación (MINOR
  respecto de v3.0; sólo agrega una cláusula nueva que no restringe
  derechos).
- Si se aplica antes del v3.0 del 2c (poco probable dado que el 2c
  ya tiene borrador preparado): **v3.0**, con re-aceptación requerida
  sólo si el 2c se publica después (para evitar múltiples
  re-aceptaciones en días consecutivos).

El cambio se clasifica **MINOR** porque agrega información y limita
expectativas del usuario sin reducir sus derechos. No requiere
re-aceptación salvo que abogado indique lo contrario.

## Cambio propuesto — Nueva Sección 8 "Exportación de documentos"

Insertar una nueva sección después de la actual Sección 7
"Suscripciones y pagos" (o en la ubicación equivalente que la versión
vigente tenga, la numeración final se ajusta al renumerado secuencial
del documento).

**Texto propuesto (en español chileno, registro formal cotidiano)**:

```
8. Exportación de Documentos

8.1. Disponibilidad de la función

Conniku pone a disposición del usuario una funcionalidad para exportar
los documentos creados en Workspaces a formatos estándar (PDF y DOCX).
La disponibilidad concreta de cada formato puede depender de la
configuración del servidor en cada momento; si un formato no está
disponible transitoriamente, Conniku lo informará al usuario al
momento de intentar la descarga.

8.2. Contenido del archivo exportado

El archivo exportado contendrá el contenido textual del documento tal
como exista al momento de la exportación, procesado por los sistemas
de Conniku para adaptarlo al formato elegido. Conniku se reserva el
derecho de:

a) Sanitizar el contenido del documento durante la exportación,
   eliminando elementos técnicos potencialmente peligrosos (scripts,
   iframes, manejadores de eventos) por razones de seguridad.

b) Eliminar del archivo exportado aquellas imágenes cuya fuente de
   origen no sea un dominio autorizado por Conniku. Esto se realiza
   para proteger al usuario y a terceros frente a riesgos de seguridad.
   El usuario será informado cuando esto ocurra, o podrá verificarlo
   comparando el archivo exportado con el documento original en la
   plataforma.

c) No incluir en el archivo los elementos accesorios (como portada o
   rúbrica de evaluación) que el usuario haya seleccionado, cuando la
   funcionalidad de generación de dichos elementos aún no esté
   plenamente habilitada. Las opciones disponibles en la interfaz
   reflejan las capacidades del servicio en cada momento y podrán
   variar.

8.3. Propiedad intelectual del contenido exportado

El usuario es el único responsable del contenido que incluye en sus
documentos de Workspaces, incluyendo citas, extractos, imágenes, y
cualquier material de terceros. Al exportar un documento, el usuario
garantiza que:

a) Es titular de los derechos sobre el contenido que exporta, o
   cuenta con licencia, autorización o una excepción legal válida
   (como cita académica permitida por el Art. 71 B y siguientes de
   la Ley N° 17.336 sobre Propiedad Intelectual de Chile) para
   incluirlo en el documento y en el archivo resultante.

b) Exime a Conniku de toda responsabilidad derivada del uso,
   distribución o difusión que el usuario o cualquier tercero haga
   del archivo exportado.

c) En caso de reclamo de terceros por infracción de derechos de autor
   u otros derechos relativos al contenido exportado, el usuario será
   el único responsable de atender dicho reclamo.

8.4. Control del archivo descargado

Una vez que el archivo exportado se descarga al dispositivo del
usuario, queda fuera del control de Conniku. En particular:

a) Conniku no puede revocar, modificar, actualizar ni eliminar el
   archivo una vez descargado.

b) El usuario es el único responsable del almacenamiento seguro, la
   distribución, las copias, el respaldo y la eliminación del archivo.

c) Si el documento original en Workspaces se modifica o se elimina
   con posterioridad, el archivo previamente descargado no se
   actualizará automáticamente.

d) Conniku no se responsabiliza por la pérdida, corrupción o
   divulgación no autorizada del archivo una vez entregado al
   usuario.

8.5. Formato y fidelidad del archivo exportado

El usuario reconoce que la exportación a PDF o DOCX puede producir
diferencias respecto de la visualización del documento dentro de la
plataforma, incluyendo cambios menores en la tipografía, la
distribución de párrafos, el tratamiento de tablas o listas, y la
inclusión o ausencia de imágenes. Estas diferencias son inherentes a
la conversión entre formatos distintos y no constituyen defectos del
servicio.

8.6. Autenticidad del archivo exportado

Los archivos exportados no incorporan firma electrónica avanzada en
los términos de la Ley N° 19.799 sobre Documentos Electrónicos, Firma
Electrónica y Servicios de Certificación. Por lo tanto, los archivos
exportados desde Conniku no tienen valor probatorio de documento
electrónico firmado. Si el usuario requiere un documento con valor
probatorio pleno, debe recurrir a un prestador de servicios de
certificación acreditado por la autoridad competente.

8.7. Uso legítimo del archivo exportado

El archivo exportado se suministra para uso académico y personal del
usuario, en coherencia con la finalidad de la plataforma. El usuario
se obliga a no utilizar el archivo exportado para suplantar la
identidad de Conniku, de terceros, ni para fines fraudulentos.
```

## Observaciones sobre la cláusula

### Sobre §8.3 — cita al Art. 71 B Ley 17.336

La Ley N° 17.336 sobre Propiedad Intelectual de Chile establece
excepciones al derecho de autor. Antes de publicar, verificar en
https://www.bcn.cl/leychile/navegar?idNorma=28933 que el Art. 71 B
(cita) sigue vigente con el alcance que se le da en el texto. Si la
redacción final requiere citar un artículo distinto (p. ej., 71 C,
71 E), se ajusta. **Si no se puede verificar la numeración vigente
antes de publicar, eliminar la cita específica y dejar "la legislación
vigente sobre propiedad intelectual"**.

### Sobre §8.2 letra c — portada y rúbrica que todavía no se implementan

Esta es la cláusula más sensible. Protege a Conniku frente a Art. 12
letra b de Ley 19.496 si un usuario reclama que marcó el checkbox
"Incluir portada" y el archivo descargado no trae portada. Pero su
redacción es **defensiva**, no correctiva. La corrección real es del
producto:

- Opción A (preferida): el frontend **desactiva visualmente los
  checkboxes "portada" y "rúbrica"** con un mensaje del tipo
  "Disponible próximamente" hasta que el backend los implemente. Este
  cambio es del builder, no del legal-docs-keeper.
- Opción B (legal defensiva): mantener los checkboxes activos y
  cubrirse con esta cláusula. Válido pero subóptimo; el usuario
  merece saber que marca algo que no se cumple.

**Recomendación del legal-docs-keeper**: implementar Opción A en el
builder y dejar §8.2 letra c sólo como respaldo genérico para futuros
casos en que una opción de export no esté plenamente operativa.

### Sobre §8.6 — firma electrónica

Ley 19.799 distingue entre firma electrónica simple y firma
electrónica avanzada. Los archivos PDF/DOCX exportados por Conniku
**no son** firma electrónica en sentido técnico. Esta cláusula evita
malentendidos en caso de que un usuario intente usar el PDF como
respaldo legal. **Verificar con abogado** si la formulación es
apropiada o si es mejor remitir sin cita (por ejemplo, "los archivos
exportados no constituyen documentos con firma electrónica").

## Lo que este borrador **no** propone (y por qué)

### No cubre la deuda preexistente C1 (xhtml2pdf SSRF en V1)

El sistema V1 (`backend/collab_routes.py`) sigue con el código
vulnerable de xhtml2pdf marcado como deuda C1 en
`docs/pendientes.md`. El sub-sub-bloque 2d.7 introduce un V2 seguro
(`backend/workspaces_export.py`) pero no elimina V1. Mientras V1
siga expuesto en producción, la vulnerabilidad existe en un camino
alternativo del sistema.

Esta es una alerta crítica **de producto y de seguridad**, no una
modificación de T&C. Ver `alerts.md` ALERTA-2D7-1.

### No agrega cláusula de "marca de agua" ni "huella digital"

Algunos servicios educativos agregan marca de agua visible al
archivo exportado con el nombre del usuario, para trazar fugas de
material restringido. Conniku no lo implementa hoy. Si a futuro se
decide agregarlo, requerirá:

- Declaración en Política de Privacidad (tratamiento adicional del
  nombre del usuario en cada archivo exportado).
- Cláusula adicional de T&C declarando el propósito y alcance.

No corresponde incorporarlo ahora.

### No cubre la "deuda" de que la UI promete una portada que no existe

Esa corrección corresponde al builder, no al legal-docs-keeper. Ver
ALERTA-2D7-2 en `alerts.md`.

## Metadatos del borrador

- **Versión semántica**: MINOR (v3.0 → v3.1 si ya existe v3.0; v2 → v3
  si se publica junto al v3.0 del 2c).
- **Notificación al usuario**: informativa. No requiere aceptación
  explícita.
- **Fecha de vigencia propuesta**: la fecha del deploy efectivo del
  sub-sub-bloque 2d.7 a producción.
- **Archivos afectados (producción)**: `src/pages/TermsOfService.tsx`.
  La divergencia con `src/components/TermsOfService.tsx` (modal
  interno) queda cubierta por ALERTA-LEG-2 preexistente; idealmente
  ambos se consolidan antes de publicar.

## Declaración obligatoria (repetida al cierre)

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.
