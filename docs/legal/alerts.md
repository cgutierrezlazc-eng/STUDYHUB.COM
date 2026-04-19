# Alertas activas del legal-docs-keeper

Última actualización: **2026-04-19** (legal-docs-keeper, capa sub-sub-bloque 2d.7)

## Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere validación
de abogado antes de su aplicación al producto en producción.

## Clasificación de severidad

- **CRÍTICA**: requiere acción inmediata (bloqueante para producción o para
  el próximo deploy que toque el área afectada).
- **MODERADA**: actualización recomendada en próximas 2 semanas.
- **INFORMATIVA**: mejora sugerida sin urgencia.

---

## Alertas CRÍTICAS abiertas (2d.7)

### ALERTA-2D7-1 — Deuda C1 preexistente: xhtml2pdf SSRF en V1 (`backend/collab_routes.py`)

- **Origen**: backend-builder sub-sub-bloque 2d.7 (2026-04-18) + reporte
  `docs/reports/2026-04-18-capa-1-backend-builder-2d7-export.md` §3.
- **Impacto regulatorio**: mientras el código V1 (`collab_routes.py:455-503`
  con xhtml2pdf) siga desplegado en producción, el vector SSRF documentado
  (`<img src="http://169.254.169.254">` → AWS metadata leak) está activo en
  un camino alternativo del sistema, aun cuando el V2 (`workspaces_export.py`)
  sea seguro por diseño.
- **Régimen aplicable**: GDPR Art. 32 (seguridad del tratamiento —
  "medidas técnicas apropiadas"), Ley 19.628 Art. 11 (responsabilidad del
  responsable del tratamiento en la seguridad de los datos). Una brecha
  de credenciales cloud producida por este SSRF habilita fuga masiva de
  datos personales de la plataforma.
- **Mitigación parcial**: el flujo happy path ya usa V2. La vulnerabilidad
  se activaría sólo si un atacante puede invocar explícitamente el endpoint
  V1. Requiere verificar con gap-finder / code-reviewer si el endpoint V1
  sigue expuesto en el router de `server.py` o si ya está fuera de la API
  pública.
- **Acción recomendada**:
  (a) retirar el router de V1 de `server.py` antes del próximo deploy
      (decisión de producto).
  (b) dejar V1 en `collab_routes.py` con `@router.post` comentado o
      condicionado a flag, hasta una iteración de limpieza posterior.
  (c) actualizar `docs/pendientes.md` C1: "mitigado en el camino feliz,
      pendiente retirar endpoint V1".
- **Bloqueo**: sí, para el deploy del 2d.7 a producción. No tiene sentido
  publicar V2 seguro coexistiendo con V1 vulnerable.

## Alertas MODERADAS abiertas (2d.7)

### ALERTA-2D7-2 — Frontend promete "portada" y "rúbrica" que el backend no implementa (Art. 12 letra b Ley 19.496)

- **Origen**: análisis del legal-docs-keeper 2026-04-19 sobre
  `src/components/workspaces/Export/ExportModal.tsx:131-144` y
  `backend/workspaces_export.py:524-533`.
- **Evidencia**: el modal muestra dos checkboxes ("Tapa/portada del
  documento", "Incluir rúbrica de evaluación como anexo") marcables por
  el usuario. El backend recibe los flags `include_cover` e
  `include_rubric` pero **no los renderiza** (los parámetros se declaran
  en Pydantic pero no se usan en `export_pdf` ni `export_docx`).
- **Impacto**: Ley 19.496 Art. 12 letra b (información veraz y oportuna
  sobre las condiciones del servicio); Art. 16 letra g (cláusulas que
  generen expectativa injustificada). Un usuario que marcó "incluir
  portada" y recibe un archivo sin portada tiene argumento de
  incumplimiento. En la fase actual el volumen es bajo, pero el riesgo
  escala con el uso.
- **Opciones de resolución**:
  (a) **Preferida**: desactivar los checkboxes en el frontend con
      mensaje "Disponible próximamente" hasta que el backend los
      implemente. Tarea del frontend-builder.
  (b) Implementar efectivamente portada y rúbrica en el backend antes
      del deploy del 2d.7. Tarea del backend-builder (alcance que no
      estaba en el plan original).
  (c) **Defensiva**: cubrirse con cláusula T&C §8.2 letra c del
      borrador de este mismo ciclo (ver
      `docs/legal/drafts/2026-04-19-terms-2d7-export.md`). Válida pero
      subóptima.
- **Bloqueo**: parcial. El deploy puede proceder si se aplica (a) o si
  (c) queda publicado antes del deploy.

### ALERTA-2D7-3 — Whitelist de imágenes no incluye Supabase Storage: pérdida de datos silenciosa

- **Origen**: backend-builder sub-sub-bloque 2d.7 (reporte §4) y análisis
  del legal-docs-keeper 2026-04-19.
- **Evidencia**: `backend/workspaces_export.py:78-87` — la whitelist
  `_ALLOWED_REMOTE_IMG_DOMAINS` sólo contiene `conniku.com`, `www.conniku.com`,
  `cdn.conniku.com`, `api.conniku.com`. Imágenes subidas al editor cuyo
  hostname sea `*.supabase.co` son eliminadas por `inline_remote_images`
  sin aviso al usuario.
- **Impacto**: consumidor (Art. 12 letra b Ley 19.496: información veraz);
  potencialmente propiedad intelectual si el usuario tenía una imagen
  propia en el documento que desaparece sin registro. No hay fuga de
  datos, es **pérdida silenciosa**.
- **Acción recomendada**:
  (a) Agregar el hostname real del bucket Supabase del proyecto a la
      whitelist. Requiere conocer el hostname
      (`xxxxxxxxxxxx.supabase.co`) y tratarlo como constante.
  (b) Cuando una imagen sea eliminada por estar fuera de la whitelist,
      registrar un warning **visible al usuario** (no sólo en logs del
      servidor) antes de entregar el archivo.
  (c) Actualizar Privacy §6 para declarar Supabase como encargado de
      tratamiento del que Conniku lee imágenes al exportar (cuando (a)
      se implemente). Ver también ALERTA-LEG-4 preexistente que ya
      listaba Supabase como no declarado.
- **Bloqueo**: recomendable antes del deploy, no bloqueante per se.

### ALERTA-2D7-4 — Nueva sub-sección 5.3 Privacy Policy requiere publicación

- **Origen**: legal-docs-keeper 2026-04-19, borrador
  `docs/legal/drafts/2026-04-19-privacy-policy-2d7-export.md`.
- **Impacto**: Ley 19.628 Art. 4° (información al titular sobre todos
  los tratamientos); GDPR Art. 13-14. Al introducir el tratamiento
  "envío de contenido del documento al backend para generar archivo
  descargable, con eliminación silenciosa de imágenes externas y
  limpieza de metadatos", corresponde declararlo.
- **Acción**: publicar v2.3 (o v2.2 si se publica antes del 2c) según
  borrador referenciado.
- **Bloqueo**: acompaña al deploy del 2d.7, no lo bloquea por sí sola
  si las ALERTA-2D7-1 y ALERTA-2D7-2 ya están resueltas.

### ALERTA-2D7-5 — Cláusula T&C "Exportación de documentos" pendiente

- **Origen**: legal-docs-keeper 2026-04-19, borrador
  `docs/legal/drafts/2026-04-19-terms-2d7-export.md`.
- **Impacto**: Ley 17.336 (propiedad intelectual: responsabilidad del
  usuario sobre contenido de terceros exportado); Ley 19.496 Art. 12
  (información sobre condiciones); Ley 19.799 (aclarar que el archivo
  exportado no es firma electrónica avanzada).
- **Acción**: publicar nueva §8 "Exportación de documentos" según
  borrador. MINOR, sin re-aceptación requerida.
- **Bloqueo**: acompaña al deploy del 2d.7. Idealmente se publica junto
  con la nueva sub-sección de Privacy.

## Alertas INFORMATIVAS abiertas (2d.7)

### ALERTA-2D7-6 — Futuro: render de portada con nombres de co-autores requiere consentimiento

- **Origen**: legal-docs-keeper 2026-04-19, análisis preventivo.
- **Impacto**: si en una iteración futura el backend renderiza
  efectivamente la portada con los nombres de los miembros del
  workspace que tengan `chars_contributed > 0`, esto constituye un
  tratamiento del nombre de cada co-autor que termina en un archivo
  fuera del control de Conniku. Legalmente:
  (a) La base legal preferida es la **ejecución del contrato de
      colaboración** (cada miembro sabe que co-edita un documento que
      puede exportarse).
  (b) Alternativamente, consentimiento explícito de cada co-autor
      sobre "mi nombre puede aparecer en la portada de cualquier
      export".
  (c) La práctica estándar en plataformas colaborativas (Google Docs,
      Notion) es (a): se asume que co-editar implica que tu nombre
      puede aparecer en el documento exportado.
- **Acción**: cuando la funcionalidad de portada se implemente,
  revisar este punto. Si se opta por (a), declararlo en Privacy y T&C
  como "al aceptar colaborar en un documento, usted consiente que su
  nombre aparezca en los archivos derivados que otros miembros
  exporten". Si se opta por (b), agregar flujo de consentimiento
  explícito en la UI.
- **Bloqueo**: ninguno hoy. Aplicable sólo cuando se implemente la
  funcionalidad.

### ALERTA-2D7-7 — Contenido académico exportado con citas de terceros: responsabilidad del usuario

- **Origen**: legal-docs-keeper 2026-04-19.
- **Impacto**: Ley 17.336 Chile, Convenio de Berna. El usuario puede
  incluir fragmentos de libros, imágenes con derechos de autor, o
  contenido no propio dentro de un documento que luego exporta y
  distribuye.
- **Mitigación**: cubierta por §8.3 del borrador T&C (responsabilidad
  del usuario + exención de Conniku + cita a Art. 71 B Ley 17.336
  sobre cita académica permitida).
- **Acción**: verificar con abogado que la cita a Art. 71 B es correcta
  y vigente. Si no, quitar la cita específica y dejar texto genérico
  "conforme a la legislación vigente sobre propiedad intelectual".
- **Bloqueo**: ninguno.

## Alertas CRÍTICAS abiertas (heredadas del 2c — sin resolver)

### ALERTA-2C-1 — Política de Privacidad v2.1 no declara procesamiento Athena

- **Origen**: gap-finder del sub-bloque 2c (2026-04-18), GAP-2.
- **Impacto**: obligación Art. 4° Ley 19.628 (Chile) y GDPR Art. 13-14
  (UE) de informar al titular sobre todos los tratamientos. La v2.1
  vigente solo menciona "resúmenes, asistente de estudio" como finalidad
  de Anthropic. Omite: chat privado Athena, sugerencias de reescritura
  sobre staging propio, retención del historial, transferencia
  internacional específica a Anthropic.
- **Acción**: publicar v2.2 según borrador
  `docs/legal/drafts/2026-04-18-privacy-policy-2c-athena.md` antes del
  deploy del 2c a producción.
- **Bloqueo**: sí. No desplegar 2c a usuarios reales sin resolver.

### ALERTA-2C-2 — T&C no declaran cuota Free de Athena (3/día) ni descargo sobre exactitud

- **Origen**: gap-finder del sub-bloque 2c (2026-04-18), GAP-2.
- **Impacto**: Art. 12 letra b Ley 19.496 Chile (información veraz y
  oportuna sobre condiciones del servicio); Art. 16 letra a-g sobre
  cláusulas abusivas. Un usuario Free que ve "asistente inteligente" sin
  mención de cuota podría reclamar "limitación no informada". Separado:
  sin descargo específico sobre exactitud, un estudiante que confía en
  respuesta errada de Athena podría imputar responsabilidad a Conniku.
- **Acción**: publicar v3.0 de T&C con nueva §4 bis según borrador
  `docs/legal/drafts/2026-04-18-terms-of-service-2c-athena.md`.
  Requiere mecanismo de re-aceptación por cambio MAJOR.
- **Bloqueo**: sí, doble. No publicar 2c sin cláusula Athena, y el
  mecanismo de re-aceptación requiere la tabla `user_agreements` que
  sigue pendiente (ver ALERTA-LEG-1 preexistente).

### ALERTA-2C-3 — Retención indefinida del chat privado Athena sin plazo máximo

- **Origen**: análisis del legal-docs-keeper 2026-04-18 sobre
  `backend/database.py:1945-1962` (WorkspaceAthenaChat) y
  `backend/workspaces_athena.py:574-592` (delete endpoint).
- **Impacto**: GDPR Art. 5(1)(e) limitación del plazo de conservación;
  Ley 19.628 Art. 6° (eliminación cuando datos pierden finalidad). El
  chat privado Athena persiste mientras el workspace exista (solo
  CASCADE en eliminación del workspace + borrado manual por usuario vía
  `DELETE /athena/chats`). No hay plazo máximo automático.
- **Mitigación parcial ya presente**: endpoint de borrado manual por
  usuario, cascade al eliminar workspace. Esto cumple con principio de
  control del titular pero no con principio de minimización automática.
- **Acción recomendada**: (a) decidir con abogado si el control manual
  actual es suficiente para la fase del producto; (b) si no, agregar
  campo `expires_at` o job periódico de purga tras N meses de
  inactividad. (c) declarar comportamiento real en Política de
  Privacidad v2.2 §9 (ya cubierto en borrador del cambio 7).
- **Bloqueo**: parcial. Se puede desplegar 2c con declaración honesta de
  "conserva mientras workspace exista" en v2.2, pero debe abrirse bloque
  posterior para definir plazo máximo si abogado lo exige.

### ALERTA-2C-4 — DPA con Anthropic: estado desconocido

- **Origen**: legal-docs-keeper 2026-04-18.
- **Impacto**: GDPR Art. 28 exige contrato escrito (DPA) con todo
  encargado de tratamiento. Si Conniku tiene expansión o usuarios UE
  activos, el envío de contenido del usuario a Anthropic sin DPA
  firmado es incumplimiento directo.
- **Acción**: Cristian debe confirmar si existe DPA firmado con
  Anthropic (o si los términos comerciales estándar de la Anthropic API
  incluyen cláusulas equivalentes). Si no existe, solicitar a Anthropic
  su DPA estándar y archivarlo. El borrador de Privacy v2.2 asume de
  buena fe que existen salvaguardias; si no existen, retirar esa
  afirmación antes de publicar.
- **Bloqueo**: bloquea expansión a UE con volumen significativo y
  bloquea contratos B2B con clientes que exijan evidencia de DPA.

## Alertas MODERADAS abiertas (2c)

### ALERTA-2C-5 — Afirmación "Anthropic no entrena con datos API" requiere verificación

- **Origen**: legal-docs-keeper 2026-04-18, decisión de redacción de
  borrador Privacy v2.2.
- **Impacto**: el borrador de Privacy v2.2 incluye la afirmación "el
  contenido enviado a través de la API no se utiliza para entrenar sus
  modelos de lenguaje". Esto refleja el compromiso público de Anthropic
  vigente al conocimiento del agente, pero debe verificarse literalmente
  contra el contrato actual de Anthropic antes de publicar. Si el
  contrato no lo garantiza, la afirmación se retira.
- **Acción**: Cristian verifica en https://www.anthropic.com/legal y
  confirma o retira.

## Alertas CRÍTICAS preexistentes (heredadas de reporte 2026-04-17)

Las siguientes ya estaban abiertas antes del 2c/2d.7 y siguen sin
resolverse. Se replican aquí como recordatorio, no porque los bloques
posteriores las hayan introducido:

### ALERTA-LEG-1 — Tabla `user_agreements` inexistente

- Impacto probatorio: no se puede demostrar qué versión de T&C aceptó
  cada usuario. Bloquea además el mecanismo de re-aceptación que exige
  el v3.0 propuesto por este borrador 2c.

### ALERTA-LEG-2 — Dos versiones divergentes de T&C (pages vs components)

- Riesgo: usuario acepta modal, consulta página pública, ven textos
  distintos.

### ALERTA-LEG-3 — "16 años" en lugar de "18 años"

- Contradice la regla operacional CLAUDE.md ("plataforma exclusiva para
  adultos"). Presente en Privacy §10, T&C §3, y prompt del chatbot
  Konni `backend/server.py:1078`.

### ALERTA-LEG-4 — Supabase, Firebase Cloud Messaging, Capacitor, Google OAuth no declarados en Privacy §6

- Faltan encargados de tratamiento. Incumple GDPR Art. 13.
- **Interacción con 2d.7**: ALERTA-2D7-3 refuerza esta alerta (Supabase
  como origen de imágenes leídas al exportar, cuando se agregue a la
  whitelist).

### ALERTA-LEG-5 — Plazo de retracto: "10 días hábiles" (código) vs "10 días corridos" (CLAUDE.md)

- Inconsistencia sin resolver, requiere verificar Art. 3bis Ley 19.496
  en leychile.cl.

---

## Alertas cerradas

Ninguna hasta la fecha (estructura nueva).

## Próxima revisión

- Auditoría semanal programada: lunes 2026-04-20 a las 09:00 UTC.
- Revisión manual cuando Cristian invoque `/legal-audit` o cuando un
  bloque con componente legal active trigger de detección.

## Declaración obligatoria (repetida al cierre)

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.
