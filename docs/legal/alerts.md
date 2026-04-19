# Alertas activas del legal-docs-keeper

Última actualización: **2026-04-18** (legal-docs-keeper, capa sub-bloque 2c)

## Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere validación
de abogado antes de su aplicación al producto en producción.

## Clasificación de severidad

- **CRÍTICA**: requiere acción inmediata (bloqueante para producción o para
  el próximo deploy que toque el área afectada).
- **MODERADA**: actualización recomendada en próximas 2 semanas.
- **INFORMATIVA**: mejora sugerida sin urgencia.

---

## Alertas CRÍTICAS abiertas

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

Las siguientes ya estaban abiertas antes del 2c y siguen sin resolverse.
Se replican aquí como recordatorio, no porque el 2c las haya introducido:

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
