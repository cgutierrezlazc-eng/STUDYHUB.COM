# Security Response Protocol — Conniku SpA

**Versión:** 1.0.0
**Vigencia desde:** 2026-04-22
**Responsable:** Cristian Gutiérrez Lazcano · Fundador & CEO
**Propósito:** respaldar operacionalmente el SLA público de **"reporte de seguridad < 48 horas"** declarado en `/contacto` y en la Política de Privacidad.

## 1. Canal de recepción

- Correo dedicado: `seguridad@conniku.com` (alias del buzón `contacto@conniku.com` administrado por Jennifer Ruiz, asistente del CEO).
- Ruta alternativa: formulario público en `conniku.com/contacto` con motivo "Reporte de seguridad".
- Ambos caminos ingresan a la tabla `contact_tickets` con `reason="seguridad"` cuando el usuario usa el form; los correos directos ingresan via `seguridad@conniku.com` y son triados manualmente.

## 2. Roles y responsabilidades

| Rol | Responsabilidad | Titular |
|-----|----------------|---------|
| **Primera respuesta** | Confirmar recepción al reportante dentro de 48h | Jennifer Ruiz (asistente CEO) |
| **Triage técnico** | Clasificar severidad (Crítico / Alto / Medio / Bajo) | Cristian Gutiérrez Lazcano (CEO) |
| **Remediación** | Diseñar y ejecutar fix | Cristian Gutiérrez Lazcano + agentes técnicos (Tori) |
| **Comunicación pública** | Si aplica: CVE, nota de seguridad, notificación usuarios | Cristian Gutiérrez Lazcano |

## 3. SLA y severidades

| Severidad | Tipo de reporte | Tiempo primera respuesta | Tiempo remediación |
|-----------|-----------------|--------------------------|--------------------|
| Crítico | RCE, data breach activo, exposición masiva de credenciales | < 4h | < 72h |
| Alto | Bypass autenticación, IDOR explotable, SSRF, XSS stored | < 12h | < 7 días |
| Medio | XSS reflejado, CSRF sin impacto económico, info disclosure | < 24h | < 30 días |
| Bajo | Configuración subóptima, info leak sin riesgo, mejora | < 48h | Evaluación caso a caso |

**SLA público prometido en `/contacto`: primera respuesta < 48h** (cubre el peor caso: severidad Bajo). Casos Crítico/Alto/Medio se atienden más rápido.

## 4. Flujo operativo

### 4.1 Recepción
1. Reporte ingresa por form `/contacto` o directamente a `seguridad@conniku.com`.
2. Jennifer recibe notificación en su buzón (administra `contacto@conniku.com` que es el destino de todos los alias).
3. Jennifer deriva a Cristian dentro de las 2h hábiles siguientes.

### 4.2 Triage (dentro de 12h hábiles)
4. Cristian clasifica severidad según tabla §3.
5. Se crea entrada en `docs/legal/incidents/YYYY-MM-DD-HHMM-<slug>.md` con:
   - Ticket number (si vino por form)
   - Severidad asignada
   - Descripción del reporte
   - Componentes afectados
   - Plan de remediación inicial

### 4.3 Primera respuesta (< 48h SLA público)
6. Jennifer o Cristian responden al reportante confirmando:
   - Recibimos tu reporte
   - Número de ticket (si aplica)
   - Severidad inicial asignada
   - Próximos pasos + fecha estimada de resolución

### 4.4 Remediación
7. Fix diseñado y ejecutado siguiendo flujo de trabajo estándar (plan → backend/frontend builder → tests → PR → merge).
8. Si la severidad es Crítico/Alto, se puede saltar algunos pasos del flujo normal (hotfix) pero siempre con test de regresión.

### 4.5 Disclosure responsable
9. Una vez remediado, Cristian decide si hay que:
   - Publicar nota de seguridad (`/legal/security-notices/YYYY-NN.md`)
   - Notificar a usuarios afectados (email vía `noreply@conniku.com`)
   - Publicar CVE si aplica (vía MITRE)
   - Actualizar changelog público

### 4.6 Reconocimiento al reportante
10. Si el reportante es externo y quiere reconocimiento público, se lista en `docs/legal/security-acknowledgments.md` (con permiso explícito del reportante).

## 5. Escalamiento si Cristian no responde

Si Jennifer detecta que un reporte de severidad Crítica/Alta lleva más de:
- **4h sin triage** en horas hábiles
- **12h sin triage** en fin de semana / feriado

Escalar por:
1. Llamada telefónica directa a Cristian (canales privados internos).
2. Notificación por canal de emergencia definido (WhatsApp, Signal, etc.).

## 6. Métricas de cumplimiento

Revisión mensual (primer lunes de cada mes) de:
- Número total de reportes recibidos
- % que cumplieron SLA de primera respuesta
- Tiempo promedio de remediación por severidad
- Reportes escalados

Si el cumplimiento cae < 90% en cualquier métrica, revisión de este protocolo para ajustar capacidad (agregar on-call, contratar, automatizar).

## 7. Herramientas

- **BD de tickets**: tabla `contact_tickets` en Supabase (Bloque `contact-tickets-v1`)
- **Panel admin**: `conniku.com/admin/contact-tickets` (Bloque 4 CEO dashboard)
- **Email**: Zoho Mail (`seguridad@conniku.com` + `contacto@conniku.com`)
- **Logging**: `docs/legal/incidents/` en el repo (privado a staff) con historial completo
- **Auditoría**: cada ticket retiene IP + UA + timestamp + consent_hash por 5 años (Art. 17(3)(e) GDPR)

## 8. Marco legal aplicable

- **GDPR** Art. 33 (notificación brechas a autoridad de control UE en 72h)
- **Ley 19.628** Chile (protección datos)
- **Ley 21.719** Chile (vigente 2026-12-01, introduce obligaciones notificación brechas)
- **Ley 19.496** Chile Art. 30 (consumidor: derecho a información sobre seguridad del servicio)

## 9. Historial de versiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0.0 | 2026-04-22 | Primera versión. Creada como respaldo operativo del SLA "seguridad < 48h" publicado en `/contacto` dentro del bloque `contact-tickets-v1`. |

## 10. Declaración legal

Este protocolo es política interna operativa de Conniku SpA. Complementa pero no reemplaza la Política de Privacidad pública, los Términos y Condiciones, ni la legislación chilena/europea aplicable. Cambios futuros a este protocolo requieren commit con tipo `chore(security):` y aprobación explícita del CEO.
