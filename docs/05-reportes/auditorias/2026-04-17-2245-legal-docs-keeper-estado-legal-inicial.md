# Reporte legal-docs-keeper — Estado legal inicial Conniku

**Fecha**: 2026-04-17 · **Agente**: legal-docs-keeper · **Scope**: `/Users/cristiang./CONNIKU`
**Operación**: auditoría legal exhaustiva inicial. Descubrimiento total.

## Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere validación de abogado antes de su aplicación al producto en producción.

---

## 1. Existencia de documentos legales

**Estado general: AUSENTE COMO ESTRUCTURA FORMAL**

| Elemento | Estado | Ruta | Riesgo |
|---|---|---|---|
| `docs/legal/` (CLAUDE.md) | AUSENTE | — | CRÍTICO |
| `docs/legal/drafts/` | AUSENTE | — | CRÍTICO |
| `docs/legal/archive/` | AUSENTE | — | CRÍTICO |
| `docs/legal/alerts.md` | AUSENTE | — | MODERADO |
| `docs/legal/weekly-audit-*.md` | AUSENTE | nunca ejecutado | INFORMATIVO |
| `/legal/` (raíz) | EXISTE distinto fin | `/Users/cristiang./CONNIKU/legal/` | contiene PDF SII, no docs servicio |

**Documentos legales embebidos en frontend como páginas React (no archivos markdown versionados)**:

| Documento | Estado | Ruta | Versión declarada |
|---|---|---|---|
| Términos y Condiciones (página pública) | EXISTE | `src/pages/TermsOfService.tsx` | fecha "8 abril 2026", sin versión |
| Términos y Condiciones (modal Register) | EXISTE, DIFERENTE | `src/components/TermsOfService.tsx` | "Abril 2026 · Versión 2.0" |
| Política de Privacidad | EXISTE | `src/pages/PrivacyPolicy.tsx` | "11 abril 2026 · Versión 2.1" |
| Política Reembolso y Retracto | PARCIAL (embebido en T&C modal §9) | components/TermsOfService.tsx L380-489 | 2.0 |
| Política de Cookies | **AUSENTE** | solo aparece listada en admin tool BibliotecaDocumentos.tsx:350 | CRÍTICO |
| Política Uso Aceptable | PARCIAL (§6 de T&C pages) | sin doc independiente | MODERADO |
| Aviso Legal / LOPD / LSSICE | AUSENTE | — | MODERADO |
| DPA / GDPR | AUSENTE como documento | — | CRÍTICO (expansión UE) |
| Política Seguridad Información | AUSENTE | — | MODERADO |
| Política menores / verificación edad | AUSENTE como documento | — | CRÍTICO |
| Eliminación de cuenta | EXISTE como página | `src/pages/DeleteAccount.tsx` | — |

### 1.1 Hallazgo crítico: dos versiones divergentes de T&C

- `src/pages/TermsOfService.tsx` (página pública `/terminos`, linkeada desde Subscription)
- `src/components/TermsOfService.tsx` (modal Register paso 3)

**Son documentos distintos con contenido distinto**. Riesgo: usuario acepta un texto en registro y consulta otro en web pública. Si disputa legal, no hay forma de saber cuál se aceptó (sin hash almacenado).

---

## 2. Código con componente legal

### 2.1 Archivos con patrones legales detectados

| Archivo | Componente legal | Estado |
|---|---|---|
| `backend/hr_routes.py` (146 KB, 53 rutas) | Laboral chileno completo | EXISTE, FROZEN |
| `backend/payroll_calculator.py` (33 KB) | Liquidaciones Chile (AFP, FONASA, Isapre, AFC, SIS, Mutual, impuesto renta) | EXISTE |
| `backend/chile_tax_routes.py` (25 KB) | Tributaria chilena | EXISTE |
| `backend/tutor_contract.py` | Contratos tutor | EXISTE |
| `backend/mercadopago_routes.py` | Pagos + webhooks | EXISTE |
| `backend/paypal_routes.py` | Pagos + webhooks + retracto | EXISTE |
| `backend/payment_routes.py` | Pagos | EXISTE |
| `backend/notifications.py:1038-1039` | Notifica retracto Ley 19.496 Art. 3 bis | EXISTE |
| `src/pages/Subscription.tsx` | Cobros, retracto, reembolsos | EXISTE |
| `src/pages/HRDashboard.tsx` | RRHH, contratos, cotizaciones | EXISTE, FROZEN |
| `src/admin/hr/*Tab.tsx` | ContratosTab, FiniquitosTab, VacacionesTab, InspeccionTrabajoTab | EXISTE |
| `src/admin/payroll/DJ1887Tab.tsx` | Declaración jurada tributaria | EXISTE |
| `src/admin/tools/BibliotecaDocumentos.tsx` | Refs Ley 19.496 | EXISTE |

### 2.2 Constantes legales centralizadas

**Estado: AUSENTE la estructura exigida por CLAUDE.md**

| Archivo | Estado |
|---|---|
| `backend/constants/labor_chile.py` | **AUSENTE** |
| `backend/constants/tax_chile.py` | **AUSENTE** |
| `backend/constants/consumer.py` | **AUSENTE** |
| `backend/constants/data_protection.py` | **AUSENTE** |
| Directorio `backend/constants/` | **AUSENTE por completo** |

**En su lugar, constantes hardcoded en `backend/payroll_calculator.py:44-57`** sin formato estándar exigido (cita artículo + URL + fecha + verificador):

- `UF_VALUE: float = 38_000.0` — "representative mid-range value" → valor no verificado, sin fecha
- `UTM_VALUE: float = 66_000.0` — sin cita SII, sin fecha
- `SUELDO_MINIMO: int = 500_000` — "as of 2025" → desactualizado si reajuste 2026
- `MONTHLY_HOURS: float = 180.0` — ref "45 hrs * 4 weeks" sin cita Art. 22 Código Trabajo
- `AFP_RATES` (dict 7 AFPs) — sin URL SP, sin fecha
- `TOPE_AFP_UF = 81.6`, `TOPE_SALUD_UF = 81.6`, `TOPE_AFC_UF = 122.6` — sin cita Superintendencia Pensiones

**Riesgo**: CRÍTICO. Constantes económicas (UF, UTM, tope imponible) se actualizan mensualmente. Sin verificación periódica ni fuente, liquidaciones pueden estar erradas → responsabilidad laboral empleador.

### 2.3 Páginas frontend

| Página | Estado | Notas |
|---|---|---|
| `src/pages/TermsOfService.tsx` | EXISTE | **dice "16 años"** (desfase crítico) |
| `src/pages/PrivacyPolicy.tsx` | EXISTE | v2.1 completa pero omite Supabase, Firebase, Capacitor |
| `src/pages/Subscription.tsx` | EXISTE | retracto declarado "10 días **hábiles**" |
| `src/pages/HRDashboard.tsx` | EXISTE (FROZEN) | 370 KB |
| `src/pages/Admin.tsx` | EXISTE | 87 KB |
| `src/pages/CeoDashboard.tsx` | EXISTE | 77 KB |
| `src/pages/CeoMail.tsx` | EXISTE | |
| `src/pages/DeleteAccount.tsx` | EXISTE | |
| `src/pages/Register.tsx` | EXISTE | valida 18+ pero no tiene checkbox declarativo 5 puntos |
| Página Política de Cookies | AUSENTE | |
| Página Política Uso Aceptable separada | AUSENTE | |
| Página Aviso Legal separada | AUSENTE | |

---

## 3. Verificación de edad

### 3.1 Campo fecha nacimiento

**Estado: EXISTE Y VALIDA**

- Frontend: `src/pages/Register.tsx:180-186, 226-231, 646-666` — calcula edad, rechaza <18, input date con `max=` 18 años atrás
- Backend: `backend/auth_routes.py:412-422` — valida 18+ y obligatoriedad, lanza HTTP 403 si menor
- Mensaje error: `'err.under18'` en i18n

**Riesgo: INFORMATIVO**. Implementación correcta alineada CLAUDE.md.

### 3.2 Checkbox declarativo con texto legal fe de juramento

**Estado: AUSENTE EN FORMA EXIGIDA**

- Existe checkbox TOS (`src/pages/Register.tsx:1753-1772`) pero dice únicamente `t('tos.iAccept')` + link "Términos"
- **NO está** el texto de 5 puntos exigido por CLAUDE.md "Componente 2":
  1. "Soy mayor de 18 años a la fecha de este registro"
  2. "Los datos proporcionados son verdaderos..."
  3. "Declarar información falsa constituye causal..."
  4. "Eximo a Conniku SpA de toda responsabilidad..."
  5. "Acepto T&C y Política de Privacidad"
- `grep "declaro bajo fe de juramento"` en src/ → **0 coincidencias**

**Riesgo: CRÍTICO**. Si menor se registra mintiendo fecha, Conniku sin declaración jurada documentada con formulación legal robusta → debilita eximente responsabilidad.

### 3.3 Tabla `user_agreements` con hash SHA-256

**Estado: AUSENTE**

- `grep "user_agreements|UserAgreement"` backend → **0 coincidencias** (solo en CLAUDE.md y legal-docs-keeper.md)
- Existe: `User.tos_accepted_at` en `backend/database.py:129` — solo timestamp, sin hash, sin IP, sin user-agent, sin versión texto, sin zona horaria
- Migración `backend/migrations.py:43` agrega solo `tos_accepted_at TIMESTAMP`
- **No existe migración** que cree tabla `user_agreements` con los 7 campos exigidos

**Riesgo: CRÍTICO**. En disputa legal, Conniku no puede probar qué texto específico aceptó usuario (T&C pages v1 "8 abril" vs T&C components v2.0). Tampoco IP/UA. Vulnerabilidad probatoria grave.

### 3.4 Política detección posterior y eliminación 72 horas

**Estado: AUSENTE**
- No existe endpoint ni job que ejecute las 7 acciones (bloqueo, suspensión, eliminación 72h, retención 5 años, notificación, notif apoderado, log `incidents/legal/`)
- `incidents/legal/` no existe

**Riesgo: MODERADO**. Sin proceso automatizado, manejo ad-hoc si detectan menor.

### 3.5 Contradicción explícita con política adultos

**`backend/server.py:1078`** (prompt chatbot Konni al usuario):

> "ELEGIBILIDAD: Debes ser mayor de 18 anos **(o tener autorizacion del representante legal)**. Una sola cuenta por persona."

Esto **contradice directamente** CLAUDE.md §Regla operacional: "No se permiten usuarios menores de 18 años como cuentas directas. La plataforma no ofrece, bajo ninguna circunstancia, modalidad alternativa para menores."

**Riesgo: CRÍTICO**. Chatbot puede indicar a menor que basta autorización apoderado. Falso según política producto.

---

## 4. Regla "no mencionar IA/AI/Inteligencia Artificial"

**Estado: INCUMPLIMIENTO LIMITADO (3 archivos)**

| Archivo:línea | Contexto | Visible usuario | Riesgo |
|---|---|---|---|
| `src/pages/Biblioteca.tsx:350` | comentario código | NO | INFORMATIVO |
| `src/hooks/useTier.ts:16, 41` | comentario y código interno | NO | INFORMATIVO |
| `src/admin/shared/accountingData.ts:173` | `name: 'APIs de Inteligencia Artificial'` (key `api_ia`, codigoSII `5.1.02`) | **SÍ en panel CEO** | MODERADO |

T&C y Privacy ya usan "tecnología inteligente", "asistente", "generación contenido asistido", "procesamiento automatizado lenguaje natural".

**Riesgo global: MODERADO**. Solo 1 string visible usuario (panel CEO). Recomendación: reemplazar por "APIs de Asistentes Inteligentes" o "Servicios de Procesamiento Inteligente".

---

## 5. Integraciones legales declaradas vs reales

| Integración | Detectada código | Mencionada Política Privacidad |
|---|---|---|
| Anthropic (Claude API) | backend ai_engine, prompts | **SÍ** (sección 6, tabla) |
| MercadoPago | mercadopago_routes | **SÍ** |
| PayPal | paypal_routes | **SÍ** |
| Zoho Mail SMTP | notifications (ref CLAUDE.md) | **SÍ** |
| Render (backend hosting) | render.yaml | **SÍ** |
| Vercel (frontend hosting) | vercel.json | **SÍ** |
| **Supabase** (BD + auth) | CLAUDE.md stack, 14 refs src/ | **AUSENTE** |
| **Firebase Cloud Messaging** | push_routes, CLAUDE.md | **AUSENTE** |
| **Capacitor** (datos locales dispositivo) | capacitor.config.ts, services/capacitor.ts | **AUSENTE** |
| **Electron** (desktop) | electron/ | **AUSENTE** |
| **Google OAuth** (botón visible Register.tsx:504) | detectado | **AUSENTE** explícita |
| **SII API** (`.env.example:47 SII_API_BASE`) | — | n/a usuario final, sí marco tributario |

**Riesgo: CRÍTICO**. GDPR Art. 13 y Ley 19.628 Art. 4° obligan informar todos encargados tratamiento. Omisión Supabase (contraseñas, tokens, datos identificables TODOS usuarios), Firebase (tokens FCM), Google OAuth (correo en login) es falta material.

---

## 6. Constantes legales hardcoded fuera `/constants/`

Ya enumerado §2.2. Resumen adicional:

| Constante/dato | Ubicación | Problema |
|---|---|---|
| UF = 38.000 CLP | payroll_calculator.py:47 | fijo, sin actualización automática, sin fecha |
| UTM = 66.000 CLP | payroll_calculator.py:50 | igual |
| Sueldo mínimo = 500.000 CLP | payroll_calculator.py:53 | "as of 2025", desactualizable |
| Retracto **10 días hábiles** | Subscription.tsx:599, SupportPage.tsx:156, components/TermsOfService.tsx:385 | **conflicto con CLAUDE.md que dice "10 días corridos"** — requiere verificación Art. 3bis Ley 19.496 |
| Reembolso 30 días corridos | Subscription.tsx:603 | sin cita específica |
| Plazo eliminación datos 30 días | PrivacyPolicy.tsx:480, TermsOfService.tsx:300 | sin cita Ley 19.628 |
| Plazo respuesta ARCO 2 días hábiles | PrivacyPolicy.tsx:457 | sin cita. Ley 19.628 Art. 16 da 2 días hábiles — consistente pero sin cita explícita |

### 6.1 Hallazgo crítico: plazo retracto

CLAUDE.md línea 603-604 dice textualmente: "derecho de retracto de **10 días corridos**".

Código+UI: "10 días **hábiles**" (Subscription.tsx, components/TermsOfService.tsx, SupportPage.tsx, notifications.py). Hábiles excluye fines de semana y festivos; diferencia puede llegar a 4 días.

**No tengo fuente verificable sobre cuál es el plazo correcto bajo Art. 3bis letra b Ley 19.496**. Requiere verificación leychile.cl. Si correcto es "corridos", UI promete más tiempo del exigido por ley (favorece usuario). Si "hábiles", CLAUDE.md errado.

**Riesgo: MODERADO**. Inconsistencia interna que abogado debe resolver.

---

## 7. Términos aceptación con hash SHA-256

Cubierto §3.3. **AUSENTE**. Solo `tos_accepted_at` timestamp.

---

## 8. PR #2 / webhooks MP y PayPal

### 8.1 MercadoPago webhook — `backend/mercadopago_routes.py:371-434`

**Cumplimiento parcial**:
- Valida HMAC SHA-256 con manifest oficial `id:[data.id];request-id:[x-request-id];ts:[ts];` (correcto docs MP)
- Compara hash `v1` extraído header `x-signature`

**Gaps**:
- **Falla abierta**: si `MP_WEBHOOK_SECRET` no configurado, acepta cualquier payload sin validar firma (L374-396). En producción debería fallar cerrado.
- **Sin verificación timestamp**: no compara `ts` manifest contra tiempo actual → vulnerable replay attack.
- No valida rango IP MercadoPago.
- No guarda log persistente webhooks recibidos/rechazados (solo `print`).

### 8.2 PayPal webhook — `backend/paypal_routes.py:660-721`

**Cumplimiento parcial**:
- Llama endpoint oficial `/v1/notifications/verify-webhook-signature` con `webhook_id`, `transmission_id`, `transmission_sig`, `transmission_time`, `auth_algo`, `cert_url`, `webhook_event` (correcto PayPal docs)
- Rechaza si faltan headers `transmission_id` o `transmission_sig`

**Gaps**:
- **Falla abierta igual**: si `PAYPAL_WEBHOOK_ID` no configurado, L663-664 retorna `True` ("Skip si no hay webhook ID configurado (dev)").
- Timeout 15s puede ser demasiado; lentitud PayPal → webhook válido rechazado silenciosamente (L705-707 returns False sin reintento).
- No idempotencia documentada: PayPal reintenta mismo `event_id` → procesable dos veces.

### 8.3 Cumplimiento PCI-DSS

- Ninguno de los dos archivos toca datos tarjeta: usan redirect/checkout externo (correcto, SAQ A)
- Política Privacidad declara "no almacenamos datos tarjetas" (PrivacyPolicy.tsx:401) — consistente
- No hay detección cardholder data en código (grep rápido `card_number`, `cvv`, `cvc` no ejecutado → incertidumbre)

**Riesgo webhooks: MODERADO**. Funcionan correctamente con secretos configurados pero ambos fallan abiertos en dev. Producción debe garantizar secretos seteados y forzar fail-closed.

---

## 9. Registro histórico sistema viejo

### 9.1 `.reset-archive/`

**EXISTE** en `/Users/cristiang./CONNIKU/.reset-archive/`:
- `claude-old/` (settings, commands, hooks sistema viejo)
- `rescued-content/` (CLAUDE.md.old, CLAUDE.md.pre-seccion18, project-context.md, etc.)
- `root-orphans/`, `previews/`, `scripts/`, `investigation-results/`
- README documenta propósito y plan eliminación final Fase 5

### 9.2 Incidentes documentados

**Estado: DOCUMENTADOS** en CLAUDE.md:965-982:
- 2026-04-09: RUT inventado → lección "no inventar datos"
- 2026-04-12: icono incorrecto Play Console → "verificar visualmente"
- 2026-04-12: feature graphic baja calidad → "no tomar decisiones diseño"
- 2026-04-12: logos antiguos buscados → "usar solo lo que Cristian provee"

**Riesgo: INFORMATIVO**. Bien documentado. Sin embargo no existe directorio `incidents/legal/` formal según CLAUDE.md §766 para futuros casos.

---

## Lista priorizada de borradores legales a generar

### Prioridad CRÍTICA (bloqueantes producción o expansión)

1. **Borrador: tabla `user_agreements` (schema + migración + endpoint)** — Creación tabla con 7 campos exigidos. Migración SQL en `backend/migrations/`. Hook en `auth_routes.py` al registro.

2. **Borrador v3.0: T&C unificados** — Resolver divergencia pages/TermsOfService vs components/TermsOfService. Cambiar "16 años" → "18 años". Alinear con CLAUDE.md. Versionado v3.0.0, vigencia declarada.

3. **Borrador v3.0: Política Privacidad** — Agregar Supabase (auth + BD), Firebase Cloud Messaging (tokens FCM), Capacitor (datos locales dispositivo), Google OAuth. Cambiar "16 años" → "18 años".

4. **Borrador: texto legal checkbox declarativo Register** — 5 puntos obligatorios CLAUDE.md. Implementación frontend `Register.tsx` + captura hash SHA-256. Guía versionado texto.

5. **Borrador: corrección prompt `backend/server.py:1078`** — Remover frase "(o tener autorizacion del representante legal)". Tarea backend-builder.

### Prioridad ALTA (riesgo probatorio/regulatorio 1-2 meses)

6. **Borrador: `backend/constants/` estructura completa** — 4 archivos: labor_chile.py, tax_chile.py, consumer.py, data_protection.py. Cada constante con formato cita+URL+fecha+verificador. Mover 10 constantes hardcoded payroll_calculator.py.

7. **Borrador v1.0: Política Cookies** — Documento nuevo. localStorage (JWT, tema, preferencias), sessionStorage, Service Worker. Clasificación esenciales/funcionales.

8. **Borrador v1.0: Política Reembolso independiente** — Extraer §9 components/TermsOfService.tsx. Resolver conflicto "hábiles" vs "corridos" con fuente oficial.

9. **Borrador: DPA para GDPR** — Si expansión UE y contratos con colegios/universidades europeas. Plantilla base anexar contratos B2B.

### Prioridad MEDIA (fortalece compliance no bloquea)

10. Borrador v1.0: Política Uso Aceptable independiente
11. Borrador v1.0: Aviso Legal / LSSICE (mercado español, expansión UE)
12. Borrador: endurecer webhooks (fail-closed prod, timestamp anti-replay, idempotencia, log persistente)
13. Borrador: proceso automatizado detección menores posterior (endpoint admin, job eliminación 72h, retención 5 años evidencia, directorio `incidents/legal/`)

### Prioridad BAJA (mejora sin urgencia)

14. Borrador: Política Seguridad Información interna (marco interno, SOC 2 futuro)
15. Borrador: reemplazo `'APIs de Inteligencia Artificial'` en `accountingData.ts:173`
16. Borrador: estructura `docs/legal/` con versionado, drafts/, archive/, alerts.md (scaffolding vacío)

---

## Lo que no hice y por qué

- No verifiqué fuentes legales leychile.cl / bcn.cl (sin acceso internet confirmado; regla "no inventar información legal" prevalece)
- No abrí Capacitor plugins ni `src/services/capacitor.ts` en detalle (requiere revisar archivo + AndroidManifest.xml + Info.plist para auditoría exhaustiva datos wrapper móvil)
- No revisé `src/services/i18n.tsx` completo (3800+ líneas). Solo grep patrones clave
- No validé cardholder data (`card_number`, `cvv`) para PCI-DSS pleno
- No generé borradores (explícitamente pedido por Cristian)
- No audité HRDashboard.tsx (370 KB) ni Admin.tsx (87 KB) ni CeoDashboard.tsx (77 KB) línea por línea para citas legales adyacentes
- No revisé migración `backend/migrations.py` completa
- No confirmé si Subscription.tsx muestra solo retracto Chile o también UE (components/TermsOfService.tsx §9.5 menciona Directiva 2011/83/UE 14 días)

## Incertidumbres

- Plazo retracto "corridos" vs "hábiles": CLAUDE.md dice corridos, código dice hábiles. Uno errado. Sin fuente verificable. Abogado debe resolver consultando Art. 3bis letra b Ley 19.496.
- Cita "Art. 3bis Ley 19.496" en código: no verifiqué si Art. 3bis inciso 2 o letra b correcto para servicios digitales. CLAUDE.md menciona ambas.
- Tratamiento Anthropic (Claude API) con datos académicos: Política Privacidad declara que comparte "contenido académico". No revisé si contrato Anthropic tiene cláusula no-entrenamiento.
- Edad mínima GDPR variable por Estado miembro (13-16 años): Política Privacidad §10 aplica 16 global. Conflicto con nuevo requisito CLAUDE.md 18+ absoluto. Leftover pre-fijación "plataforma solo adultos".
- SUELDO_MINIMO 500.000 CLP "as of 2025": no sé si reajustado para 2026. Liquidaciones desde 1 enero 2026 podrían estar erradas.
- Si existe responsabilidad por archivos en `.reset-archive/` con datos personales históricos. Si hay PII, debería eliminarse o aislarse.

## Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere validación de abogado antes de su aplicación al producto en producción.
