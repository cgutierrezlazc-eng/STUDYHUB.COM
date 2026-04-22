# Catálogo de FAQ IDs — sandbox soporte.html

**Versión**: 1.0.0
**Fecha**: 2026-04-21
**Bloque**: sandbox-integrity-v1

Los `faq_id` son slugs estables que identifican cada pregunta del FAQ
en `public/sandbox/soporte.html`. Se usan en `POST /support/feedback`
para agregar métricas de utilidad por pregunta.

**Regla de estabilidad**: un `faq_id` asignado nunca se renombra. Si
una pregunta se elimina, su ID se retira del HTML pero queda registrado
aquí como "deprecado". Si se agrega una pregunta nueva, recibe un ID
nuevo al final de su sección.

---

## Sección: Cuenta y Configuración

| faq_id | Pregunta |
|---|---|
| `account-create` | ¿Cómo creo mi cuenta? |
| `account-password-recovery` | Olvidé mi contraseña, ¿cómo la recupero? |
| `account-change-email` | ¿Puedo cambiar mi correo electrónico? |
| `account-delete` | ¿Cómo elimino mi cuenta? |
| `account-language` | ¿Conniku está disponible en otros idiomas? |

## Sección: Asignaturas y Documentos

| faq_id | Pregunta |
|---|---|
| `subject-limit` | ¿Cuántas asignaturas puedo crear? |
| `subject-upload-doc` | ¿Cómo subo documentos a una asignatura? |
| `subject-formats` | ¿Qué formatos de archivo acepta Conniku? |
| `subject-quizzes-auto` | ¿Los quizzes se generan automáticamente? |
| `subject-exam-predictor` | ¿Cómo funciona el predictor de exámenes? |
| `subject-flashcards` | ¿Qué son las flashcards y cómo se usan? |

## Sección: Extensión Chrome

| faq_id | Pregunta |
|---|---|
| `ext-what-does` | ¿Qué hace la extensión de Chrome? |
| `ext-security` | ¿Es segura? ¿Qué datos recopila? |
| `ext-sync-error` | ¿Por qué me sale error al sincronizar? |
| `ext-compatibility` | ¿Funciona con mi universidad? |
| `ext-install` | ¿Cómo instalo la extensión? |

## Sección: Planes y Pagos

| faq_id | Pregunta |
|---|---|
| `billing-price` | ¿Cuánto cuesta Conniku Pro? |
| `billing-payment-methods` | ¿Qué métodos de pago aceptan? |
| `billing-cancel` | ¿Puedo cancelar en cualquier momento? |
| `billing-refund` | ¿Cómo solicito un reembolso? |
| `billing-sprint` | ¿Qué es el Sprint de 7 días? |
| `billing-group-discount` | ¿Hay descuento para grupos? |

## Sección: Biblioteca

| faq_id | Pregunta |
|---|---|
| `library-sources` | ¿De dónde viene el contenido de la Biblioteca? |
| `library-download` | ¿Puedo descargar los libros? |
| `library-clone` | ¿Puedo clonar un libro a mi asignatura? |

## Sección: Asistente y Herramientas

| faq_id | Pregunta |
|---|---|
| `assistant-how-works` | ¿Cómo funciona el chat de estudio? |
| `assistant-message-limit` | ¿Cuántos mensajes puedo enviar por día? |
| `assistant-concept-map` | ¿Qué es un mapa conceptual? |
| `assistant-export` | ¿Puedo exportar mis resúmenes? |

## Sección: Comunidad

| faq_id | Pregunta |
|---|---|
| `community-add-friends` | ¿Cómo agrego amigos? |
| `community-what-are` | ¿Qué son las Comunidades? |
| `community-chat-private` | ¿El chat es privado? |

## Sección: Privacidad y Seguridad

| faq_id | Pregunta |
|---|---|
| `privacy-sells-data` | ¿Conniku vende mis datos? |
| `privacy-data-storage` | ¿Dónde se almacenan mis datos? |
| `privacy-delete-data` | ¿Puedo eliminar todos mis datos? |

## Sección: Solución de Problemas

| faq_id | Pregunta |
|---|---|
| `tsh-login` | No puedo iniciar sesión |
| `tsh-slow-load` | La página carga lento o no carga |
| `tsh-upload-error` | Error al subir un documento |
| `tsh-chat-error` | El chat no responde o da error |
| `tsh-ext-sync-error` | Error al sincronizar la extensión Chrome |
| `tsh-payment-failed` | No puedo pagar o el pago falló |
| `tsh-quizzes-not-generated` | Los quizzes no se generan |

---

## Historial de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 2026-04-21 | Creación inicial — 37 FAQ IDs de soporte.html |
