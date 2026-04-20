# Tabla de auditoría de copy — LandingV3

Bloque piloto rediseño v3 · Paso 3  
Fecha: 2026-04-19  
Builder: frontend-builder (Sonnet)

Cada fila documenta un cambio al copy original del handoff `design_handoff_conniku_landing/README.md`.

| # | Original handoff | Categoría | Traducción aplicada |
|---|---|---|---|
| 1 | `"Documentos con chat IA"` (sección 4 sticker 02) | IA | `"Documentos con Athena"` |
| 2 | `"Asesor virtual para informes y trabajos"` (sticker 03) | IA implícita | `"Asistente inteligente para informes y trabajos"` |
| 3 | `"Métricas de colaboración en vivo"` (sticker 03) | copy ambiguo | `"Retroalimentación en tiempo real"` |
| 4 | `"Biblioteca +70k"` (sticker 04, estadística) | estadística inventada | `"Biblioteca extensa"` |
| 5 | `"Chat interactivo con cada libro"` (sticker 04) | IA implícita | `"Athena integrada en cada libro para leer contigo"` |
| 6 | `"Todo lo que necesitás en tu U"` (h2 sección 4) | voseo | `"Todo lo que necesitas en tu universidad"` |
| 7 | `"en un solo lugar"` (h2 sección 4) — mantener | neutro | Conservado exacto |
| 8 | Matrix de comparación con: Moodle, Crehana, Udemy, LinkedIn Learning, Notion, WhatsApp (sección 5) | competencia + IA en celdas | Eliminada completa (decisión P-1=C). Reemplazada por sección positiva "Lo único que entrega Conniku" con 7 capacidades |
| 9 | `"Siete capacidades. Una sola app."` (h2 sección 5) | conservado | Conservado exacto |
| 10 | `"El resto tiene una o dos."` (h2 sección 5) | referencia competencia genérica | Reemplazado por `"Ninguna otra plataforma te da todo esto integrado."` en párrafo lead |
| 11 | `"Documentos con chat IA propio"` (columna en matrix) | IA | Eliminado con la matrix (ver fila 8) |
| 12 | `"127 estudiando ahora mismo"` + chip con número en hero | estadística inventada | `"comunidad activa"` (texto, sin número) |
| 13 | `"+70k títulos en biblioteca"` (Big Stats sección 7) | estadística inventada | `"biblioteca extensa"` (sin número) |
| 14 | `"4.9★ 2.1k reseñas"` (Big Stats sección 7) | estadística inventada + formato prohibido `★` | Reemplazado por stat descriptivo: `"pagos protegidos"` / `"garantía antifraude"` |
| 15 | `"14 universidades sincronizadas"` (Big Stats sección 7) | estadística potencialmente real pero no verificada | `"universidades sincronizadas"` + `"piloto en Chile"` (sin número específico) |
| 16 | `"De 7 AM a medianoche, con vos."` (h2 sección 10) | voseo | `"De las 7 AM a medianoche, contigo."` |
| 17 | `"2.8M universitarios México"` (sección 11 Multi-país) | estadística inventada + formato `M` prohibido | `"millones de universitarios esperando"` (sin número) |
| 18 | `"19.6M universitarios USA"` (sección 11 Multi-país) | estadística inventada + formato `M` prohibido | `"crecimiento hispano global"` (sin número) |
| 19 | `"14 universidades sincronizadas"` (card Chile sección 11) | estadística no verificada | `"activo"` + `"universidades sincronizadas"` (sin número) |
| 20 | `"Conversá con tu propio material"` (sticker 02) | voseo | `"Conversa con tus documentos"` (en texto descriptivo del testimonio) |
| 21 | Avatares de personas con nombres en Notification Ticker y Chat Testimonials | personas inventadas (R-04) | Avatares anónimos con iniciales (`MR`, `CP`, `FV`) — decisión P-2=B |
| 22 | Chips negativos anti-manifiesto con nombres de competidores: `"Moodle modernizado"`, `"Notion con menos libertad"`, `"LinkedIn light"`, `"Udemy en español"` | competencia por nombre | Reemplazados por genéricos: `"una plataforma de videos más"`, `"un aula virtual genérica"`, `"una app de mensajería académica"`, `"una plataforma de cursos masivos"` |
| 23 | `"34% · día 41 de 120"` (barra de progreso superior) | estadística inventada + formato `%` + número | `"comunidad activa"` en la barra derecha; la barra de progreso se conserva como elemento visual sin número en texto principal |
| 24 | Testimonio en Hero description: `"Sync con tu U, documentos con IA, tutores verificados, biblioteca de +70k títulos"` | IA + estadística | `"Sincroniza con tu universidad, conversa con tus documentos, accede a una biblioteca extensa"` |
| 25 | `"+70k títulos` wrapeado en `<strong>` con highlight lime (hero description) | estadística inventada | `"biblioteca extensa"` con highlight lime |

## Notas de auditoría

- **Competidores eliminados del anti-manifiesto**: el handoff original incluía chips con `"Moodle modernizado"`, `"Notion con menos libertad"`, `"LinkedIn light"`, `"Udemy en español"`, `"grupos de Discord"`. Todos reemplazados por descripciones genéricas del tipo de app que Conniku NO es, sin nombres de marca.
- **IA eliminada completamente**: búsqueda exhaustiva por "IA", "AI", "inteligencia artificial" en el copy implementado: 0 ocurrencias en texto visible al usuario.
- **Voseo eliminado completamente**: revisión de todas las frases del handoff que usaban `necesitás`, `Conversá`, `con vos`. Todas convertidas a tuteo chileno.
- **Estadísticas**: ningún número seguido de `k`, `M`, o `★` aparece en el componente. Los valores descriptivos son semánticamente equivalentes y no inventan datos.
- **Matrix competitiva**: eliminada en su totalidad (7 filas, 8 columnas con Moodle/Crehana/Udemy/LinkedIn/Notion/WhatsApp). Sustituida por sección positiva con 7 capacidades detalladas de Conniku (decisión P-1=C).
