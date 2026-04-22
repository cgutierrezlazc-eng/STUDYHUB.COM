# Auditoría legal semanal — 2026-04-21

**Agente**: legal-docs-keeper (Tori)
**Trigger**: solicitud manual de Cristian pre-commit Bloque 1 cookie consent
**Alcance**: transversal (13 áreas) ante Ley 21.719, constantes laborales y
tributarias chilenas 2026, GDPR/ePrivacy, Ley Karin, 40 horas, factura
electrónica, PCI-DSS, propiedad intelectual.

---

## 0. Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.

---

## 1. Lo que se me pidió

Cita literal del trigger:

> AUDITORÍA LEGAL TRANSVERSAL — barrido completo pre-commit Bloque 1
> cookies. Cristian pidió verificar "cualquier tipo de actualización legal
> en todo sentido antes de seguir" antes de commitear el Bloque 1 cookie
> consent. Hoy es 2026-04-21.

Las 13 áreas listadas en el trigger (Ley 21.719, 19.628, 19.496, 21.096,
GDPR, ePrivacy, constantes laborales, constantes tributarias, 21.121,
CMF, SII, 40 horas, Ley Karin).

---

## 2. Lo que efectivamente hice

### 2.1 Archivos leídos

Rutas absolutas:

- `/Users/cristiang./CONNIKU/docs/legal/LEGAL_VERSIONS.md`
- `/Users/cristiang./CONNIKU/docs/legal/alerts.md`
- `/Users/cristiang./CONNIKU/docs/legal/v3.2/METADATA.yaml`
- `/Users/cristiang./CONNIKU/docs/legal/v3.2/privacy.md`
- `/Users/cristiang./CONNIKU/docs/legal/v3.2/cookies.md`
- `/Users/cristiang./CONNIKU/backend/constants/consumer.py`
- `/Users/cristiang./CONNIKU/backend/constants/legal_versions.py`
- `/Users/cristiang./CONNIKU/backend/constants/__init__.py`
- `/Users/cristiang./CONNIKU/backend/payroll_calculator.py` (líneas 1–300)
- `/Users/cristiang./CONNIKU/src/admin/shared/ChileLaborConstants.ts`
- `/Users/cristiang./CONNIKU/docs/plans/bloque-legal-consolidation-v2/plan-maestro.md`
- `/Users/cristiang./CONNIKU/docs/plans/bloque-legal-consolidation-v2/citas-recolectadas-2026-04-20.md`

### 2.2 Grep transversales ejecutados

- `21\.719|21719` → 5 archivos de código (código cita la ley) + 2 docs + 1 plan.
- `2026-12-01|2026-12-13|diciembre.*2026` → confirma divergencia 01 vs 13.
- `21\.096|Art\. 19 N.*4` → presente en terms, privacy, HRDashboard, LegalTab.
- `21\.643|Ley Karin` → 8 archivos de código con referencias; 0 en docs/legal/v3.2.
- `21\.561|40 horas` → ContratosTab.tsx cita Ley 21.561; `payroll_calculator.py:57` sigue en 45 horas.
- `13\.75|boleta.*honorari` → retención 13.75% hardcoded etiquetada "(2025)" en OwnerGuideTab.tsx:118.
- `PPM` → 0.25% hardcoded régimen ProPyme, coherente entre HRDashboard y accountingData.
- `IVA|0\.19|iva_rate` → `shared/tier-limits.json:72` define `iva_rate: 0.19`, coherente.

### 2.3 Hashes recalculados

    $ shasum -a 256 docs/legal/v3.2/{privacy,terms,cookies,age-declaration}.md
    7a8ba81d0be22cc1deee7d92764baaac1a598a662b84d9ba90043b2a25f63f6c  privacy.md
    9a16122f985a1d252a5928c5fae518b5bd23ac6ee00996ee9e8293c4aaf08dce  terms.md
    a00150297efa288b53bbd9a0c655e046a292d3cdefb04254b0b33c079022efd9  cookies.md
    61dab2ecf1b27e3fb212efcf5a066784943c689de11611bb6d2b919e39441a9b  age-declaration.md

Los 4 hashes coinciden byte-a-byte con `backend/constants/legal_versions.py`
y con `docs/legal/v3.2/METADATA.yaml`. Integridad de la cadena hash
intacta.

### 2.4 Git log relevante

    $ git log --all --oneline --since="2026-04-20" -- docs/legal/v3.2/
    ec5c40b legal: bloque v3.2 post-audit con OK del abogado externo

Commit único. Cubre los 4 archivos canónicos.

---

## 3. Lo que no hice y por qué

### 3.1 Verificación externa bloqueada

Este turno NO verificó ninguna de las siguientes fuentes oficiales:

- `bcn.cl/leychile/` (no accesible desde este entorno; además el informe
  `citas-recolectadas-2026-04-20.md` ya documentó que el portal es SPA y
  no rinde contenido vía `curl`/WebFetch)
- `sii.cl` (tablas UF/UTM 2026, tabla impuesto 2ª categoría vigente)
- `dt.gob.cl` (sueldo mínimo 2026, Ley Karin y Ley 21.561 aplicación)
- `cmf.cl` (circulares 2024–2026 sobre medios de pago)
- `minjusticia.gob.cl` (Ley 21.719 disposiciones transitorias)
- `eur-lex.europa.eu` (GDPR consolidado, ePrivacy Directive y eventual
  Regulation)

En consecuencia, cada una de las 13 áreas del trigger queda marcada
"PENDIENTE VERIFICACIÓN CRISTIAN / ABOGADO" con la URL oficial indicada.

### 3.2 Auditorías no ejecutadas

- No ejecuté auditoría semanal completa prevista para lunes 2026-04-20.
  Este reporte la sustituye parcialmente por ser el primer barrido tras
  ese hito.
- No exploré `migrations/**` para detectar campos nuevos que recolecten
  datos personales desde 2026-04-18 (última auditoría).
- No ejecuté `grep` de `indexedDB\|sessionStorage` sobre `src/` (heredado
  como ALERTA-COOKIE-5 abierta).

### 3.3 Decisiones que NO tomé

- No propuse borrador para `docs/legal/v3.2/cookies.md` (la Pieza 5 del
  bloque legal-consolidation-v2 tiene ese alcance; no lo adelanto aquí
  para no duplicar trabajo).
- No propuse reconciliación de UF/UTM entre `backend/payroll_calculator.py`
  y `src/admin/shared/ChileLaborConstants.ts`; esto es bloque dedicado
  (nomina-chile-v1) y cambia constantes legales con fuente obligatoria.

---

## 4. Auditoría por área

### Área 1 — Ley 21.719 (Chile, protección de datos personales reformada)

**Estado en el repositorio**:
- Citada en 5 archivos de código: `src/services/cookieConsentService.ts:13`,
  `src/legal/cookieTexts.ts:16`, `src/pages/HRDashboard.tsx:2652`,
  `src/admin/tools/BibliotecaDocumentos.tsx:210` y `:492`,
  `src/admin/hr/ContratosTab.tsx:318`.
- NO aparece en `docs/legal/v3.2/privacy.md` (el documento canónico
  vigente solo cita Ley 19.628 y Ley 21.096 para Chile).
- NO aparece en `docs/legal/v3.2/terms.md`.

**Conflicto de fechas**:
- Trigger 2026-04-21: "vigencia 2026-12-01"
- Plan `bloque-cookie-consent-banner-v1/plan.md:74`: "promulgada
  2024-11-28, publicada 2024-12-13, vigencia diferida a 2 años tras
  publicación, es decir 2026-12-13 no 2026-12-01"
- `src/services/cookieConsentService.ts:13`: "vigencia 2026-12-13"
- `src/legal/cookieTexts.ts:16`: "vigencia 2026-12-13"

**Fuente a consultar**: https://www.bcn.cl/leychile/navegar?idNorma=1212270

**Estado**: PENDIENTE VERIFICACIÓN CRISTIAN/ABOGADO (fecha exacta y
disposiciones transitorias).

**Impacto para Conniku**:
- Privacy v2.4.0 debe actualizarse a v2.5.0 para listar Ley 21.719 en
  §"Normativa aplicable" antes de la vigencia.
- Terms v3.2.0 no requiere cambio por ahora (Ley 21.719 es materia de
  privacy, no T&C).
- Banner de cookies ya la cita correctamente en código, pero el texto
  que se muestra al usuario está pendiente de confirmar fecha.

**Alerta**: CRÍTICA (ALERTA-AUDIT-04-21-1, nueva).

---

### Área 2 — Ley 19.628 (Chile, Protección de la Vida Privada, VIGENTE actual)

**Estado en el repositorio**:
- Citada correctamente en `docs/legal/v3.2/privacy.md` §4.1 (Art. 4°
  consentimiento) y §7 (derechos ARCO Art. 12 y ss).
- Citada en `backend/constants/consumer.py` y `backend/cookie_consent_routes.py`.

**Fuente a consultar**: https://www.bcn.cl/leychile/navegar?idNorma=141599

**Estado**: PENDIENTE VERIFICACIÓN CRISTIAN/ABOGADO sobre:
1. ¿Ley 19.628 sigue vigente íntegramente hasta 2026-12-XX (fecha
   efectiva de 21.719)?
2. ¿Hay disposiciones transitorias que deroguen parcialmente desde ya
   ciertos artículos de 19.628?
3. Plazo respuesta ARCO: Privacy v2.4 §7 dice "2 días hábiles"; el
   reporte 2026-04-17 legal-docs-keeper registró que coincide con
   "Ley 19.628 Art. 16" pero sin cita literal verificada.

**Alerta**: MODERADA (ALERTA-AUDIT-04-21-2, nueva) — verificación de
disposiciones transitorias 19.628 ↔ 21.719.

---

### Área 3 — Ley 19.496 (Chile, protección del consumidor)

**Estado en el repositorio**:
- `backend/constants/consumer.py:30`: `RETRACT_DAYS_VALUE = 10` +
  `RETRACT_DAYS_TYPE = "corridos"`. Cita Art. 3 bis letra b.
- Terms v3.2.0 §sección aplicable: cita Art. 3 bis con 10 días.
- `src/pages/SupportPage.tsx:157`, `backend/notifications.py:1038`,
  `backend/paypal_routes.py:629`, `src/components/TermsOfService.tsx:385`:
  ALERTA-LEG-5 preexistente declara "10 días hábiles" (hardcoded) en
  conflicto con la canónica "10 días corridos".

**Fuente a consultar**: https://www.bcn.cl/leychile/navegar?idNorma=61438

**Estado**: PENDIENTE VERIFICACIÓN — ALERTA-LEG-5 preexistente NO se
resolvió con la decisión batch 2026-04-20 "1A: 10 días corridos". La
constante central se fijó pero los strings literales en los 4 archivos
mencionados no se han reconciliado. Grep debe confirmar si estas
referencias ya fueron reemplazadas en commits posteriores.

**Sub-áreas**:
- Art. 12 letra b (información veraz): ALERTA-2D7-2 abierta sobre
  portada/rúbrica prometida y no implementada.
- Art. 16 (cláusulas abusivas): revisado en auditoría externa 2026-04-20.
- Reformas 2024-2026 de Ley 19.496: no verificadas en este turno.

**Alerta**: MODERADA (ALERTA-AUDIT-04-21-3, nueva) — verificar que las
4 referencias hardcoded "10 días hábiles" fueron efectivamente
corregidas tras la decisión 1A del 2026-04-20.

---

### Área 4 — Ley 21.096 (reforma constitucional Art. 19 N°4, datos personales como garantía)

**Estado en el repositorio**:
- Citada en `docs/legal/v3.2/privacy.md:16`: "Chile: Ley N° 19.628 ·
  Ley N° 21.096".
- Citada en `docs/legal/v3.2/terms.md:817` (salvo confirmación, la línea
  817 aparece truncada en Grep).
- Citada en `src/pages/PrivacyPolicy.tsx:136`, `src/pages/HRDashboard.tsx:7635`,
  `src/admin/legal/LegalTab.tsx:1184`.

**Fuente a consultar**: https://www.bcn.cl/leychile/navegar?idNorma=1118825

**Estado**: PENDIENTE VERIFICACIÓN — la Ley 21.096 tiene rango
constitucional; su vigencia no requiere revisión anual, pero sí se debe
confirmar que se cita correctamente como "modificación Art. 19 N°4 CPR"
y no como "derecho autónomo". Esta precisión importa frente a
regulador.

**Alerta**: INFORMATIVA (ALERTA-AUDIT-04-21-4, nueva).

---

### Área 5 — GDPR (UE 2016/679)

**Estado en el repositorio**:
- Privacy v2.4.0 §4.2 cita Art. 6(1)(a)/(b)/(c)/(f). §5.1 cita Art. 46
  (transferencias internacionales, Cláusulas Contractuales Tipo). §6
  declara encargados (Anthropic, Supabase, FCM, Google OAuth, Capacitor,
  MercadoPago, PayPal, Zoho, Render, Vercel).
- DPA con Anthropic: ALERTA-2C-4 preexistente (estado desconocido).

**Fuente a consultar**: https://eur-lex.europa.eu/eli/reg/2016/679/oj
(preferentemente descargar PDF consolidado).

**Estado**: PENDIENTE VERIFICACIÓN CRISTIAN/ABOGADO sobre:
1. Decisiones EDPB 2024-2026 relevantes (cookies, consent mode,
   transferencias a EE.UU. post-Schrems II y Data Privacy Framework).
2. Sanciones relevantes 2024-2026 que cambien interpretación de
   "consentimiento inequívoco" Art. 4(11).
3. DPA firmado con Anthropic (ALERTA-2C-4).

**Alerta**: CRÍTICA (ALERTA-2C-4 preexistente se mantiene y se eleva a
bloqueante de expansión UE).

---

### Área 6 — ePrivacy Directive 2002/58/CE y posible Regulation

**Estado en el repositorio**:
- `shared/cookie_consent_texts.py` cita GDPR Art. 5(3) ePrivacy en
  comentarios.
- `backend/constants/legal_versions.py:77-79` cita Orange Romania
  C-61/19 TJUE 2020-11-11.
- Plan `bloque-cookie-consent-banner-v1/plan.md` cita ePrivacy
  Directive como base.

**Fuente a consultar**: https://eur-lex.europa.eu/eli/dir/2002/58/oj

**Estado**: PENDIENTE VERIFICACIÓN — la propuesta de ePrivacy
Regulation llevaba bloqueada varios años en el Consejo UE. A 2026-04
requiere confirmación externa si: (a) sigue siendo Directiva vigente
con transposición nacional, o (b) fue reemplazada por Regulation
directamente aplicable. El plan del banner asume (a).

**Alerta**: MODERADA (ALERTA-AUDIT-04-21-5, nueva) — si entró en vigor
ePrivacy Regulation entre 2024 y 2026, cambia la base legal del banner
de cookies.

---

### Área 7 — Constantes laborales chilenas 2026

**Estado en el repositorio (divergencias backend vs frontend)**:

| Constante | `backend/payroll_calculator.py` | `src/admin/shared/ChileLaborConstants.ts` | Valor oficial 2026 |
|---|---|---|---|
| UF | 38.000 | 38.700 (etiquetado 2026-04-01) | PENDIENTE |
| UTM | 66.000 | 67.294 (etiquetado 2026-04-01) | PENDIENTE |
| Sueldo mínimo | 500.000 | 500.000 (etiquetado 2024-07-01) | PENDIENTE 2026 |
| AFP mandatoria | 0.10 | — (implícito 0.10) | PENDIENTE |
| AFC trab. indef. | 0.006 | 0.006 | PENDIENTE |
| AFC emp. indef. | 0.024 | 0.024 | PENDIENTE |
| SIS | 0.0153 | 0.0141 | PENDIENTE |
| Mutual base | 0.0093 | 0.0093 | PENDIENTE |
| Tope AFP | 81.6 UF | 81.6 UF | PENDIENTE |
| Tope AFC | 122.6 UF | 122.6 UF | PENDIENTE |
| Weekly hours | 45.0 | 40 (via validateSalary) | PENDIENTE 21.561 |

**Divergencia crítica**: UF, UTM y SIS tienen valores distintos en
backend y frontend. La comisión SIS es legal (Superintendencia de
Pensiones, circular mensual); la divergencia 1.53% vs 1.41% = 0.12% de
brecha sobre el sueldo imponible → afecta liquidación de nómina y
reporte contable.

**Estado**: PENDIENTE VERIFICACIÓN CRISTIAN/ABOGADO sobre:
- Valores oficiales UF y UTM al 2026-04-21 (fuente: bcentral.cl,
  sii.cl).
- SIS vigente 2026 (Superintendencia de Pensiones, circular mensual).
- Sueldo mínimo 2026 (Ley 21.578 + reajustes posteriores).
- Gratificación legal tope IMM: el código usa 4.75 IMM; consistente con
  Art. 50 CT.

**Fuentes**:
- UF/UTM: https://www.sii.cl/valores_y_fechas/
- Sueldo mínimo: https://www.dt.gob.cl/portal/1626/w3-propertyvalue-22509.html
- SIS: https://www.spensiones.cl/

**Alerta**: CRÍTICA (ALERTA-AUDIT-04-21-6, nueva) — divergencia UF/UTM/SIS
backend vs frontend afecta cálculos de nómina en producción. Bloqueada
operativamente hasta que exista `backend/constants/labor_chile.py`
canónico con fuente citada.

---

### Área 8 — Constantes tributarias chilenas 2026

**Estado en el repositorio**:
- IVA 19%: `shared/tier-limits.json:72` declara `iva_rate: 0.19` de
  forma coherente. Cita DL 825 de 1974 en Terms v3.2.0 (H-11 corregido
  2026-04-20).
- Impuesto 2ª categoría: `backend/payroll_calculator.py:180-189`
  define 8 tramos en UTM. `ChileLaborConstants.ts:60-69` define 8
  tramos con valores casi idénticos pero con una diferencia: el
  backend tiene `(120, 310, 0.35, 23.32)` y `(310, ∞, 0.40, 38.82)`;
  el frontend tiene `(120, 150, 0.35, 23.32)` y `(150, ∞, 0.40, 30.82)`.
  **Divergencia en el último tramo**: backend dice 310 UTM, frontend
  dice 150 UTM. Solo una puede ser correcta.
- Global complementario: no implementado en este módulo (es anual,
  no mensual).
- PPM: 0.25% hardcoded para régimen ProPyme (`src/pages/HRDashboard.tsx:5851`).
  Consistente con régimen 14D N°3 Transparente declarado en
  `accountingData.ts:13`.
- Retención boleta honorarios: 13.75% hardcoded en
  `src/admin/tools/OwnerGuideTab.tsx:118` (etiquetado "2025"),
  `src/admin/tools/TutoresExternosTab.tsx:597`,
  `src/admin/finance/GastosTab.tsx:754`. A 2025 la tasa era 13.75%;
  para 2026 podría haber subido (la tasa escalona anualmente hasta
  17%). **PENDIENTE VERIFICACIÓN**.

**Fuentes**:
- UF/UTM/UTA: https://www.sii.cl/valores_y_fechas/
- Tabla impuesto 2ª categoría: https://www.sii.cl/ayudas/aprenda_sobre_impuestos/impuestos/impuesto_unico_segunda_categoria.htm
- Retención honorarios: circular SII anual.

**Alerta**:
- **CRÍTICA** (ALERTA-AUDIT-04-21-7, nueva): divergencia último tramo
  impuesto 2ª categoría (310 vs 150 UTM) backend vs frontend.
- **CRÍTICA** (ALERTA-AUDIT-04-21-8, nueva): retención boleta honorarios
  13.75% etiquetada "2025"; verificar si cambió para 2026. Afecta
  cálculos de gastos a contadora y a tutores externos.

---

### Área 9 — Ley 21.121 (discriminación) y datos sensibles

**Estado en el repositorio**:
- `src/admin/hr/InspeccionTrabajoTab.tsx:611` cita "Ley 20.607, Ley
  21.643 (Ley Karin)". Ley 20.607 es de 2012 (acoso laboral); la
  21.643 la complementa.
- Ley 21.121 (aumenta protección contra discriminación arbitraria):
  NO citada en el repositorio.
- Privacy v2.4.0 NO menciona datos sensibles (salud, orientación
  sexual, afiliación política). Sección 2.1 de Privacy solo lista
  datos de identificación y académicos.

**Estado**: PENDIENTE VERIFICACIÓN — si Conniku en algún momento
procesa datos académicos que puedan inferir discapacidad (ej:
adecuaciones curriculares) o datos que puedan inferir afiliación
política, la base legal y protección reforzada aplicará.

**Alerta**: INFORMATIVA (ALERTA-AUDIT-04-21-9, nueva) — evaluar si
Privacy v2.5 debe incluir sección sobre datos sensibles y Ley 21.121.

---

### Área 10 — Normativa CMF para medios de pago

**Estado en el repositorio**:
- Integraciones de pago: MercadoPago, PayPal, Stripe (grep pendiente
  confirmar Stripe real).
- Privacy v2.4.0 §6 declara MercadoPago y PayPal como encargados.
- No hay referencia explícita a circulares CMF en código ni docs.

**Fuente**: https://www.cmfchile.cl/portal/principal/613/w3-channel.html

**Estado**: PENDIENTE VERIFICACIÓN — circulares CMF 2024-2026 sobre
medios de pago, tarjetas de prepago, stablecoins, open banking. Puede
afectar obligaciones para Conniku como comercio receptor.

**Alerta**: INFORMATIVA (ALERTA-AUDIT-04-21-10, nueva).

---

### Área 11 — SII sobre factura electrónica

**Estado en el repositorio**:
- `src/admin/shared/accountingData.ts:13` declara "régimen 14D N°3
  ProPyme Transparente — Contabilidad Simplificada".
- F29 mensual mencionado en `HRDashboard.tsx:5893`.
- No hay código de emisión de DTE (facturación electrónica) en el
  repositorio; se asume emisión manual externa o vía SII.

**Fuente**: https://www.sii.cl/normativa_legislacion/

**Estado**: PENDIENTE VERIFICACIÓN — si Conniku planea emitir boletas
electrónicas vía API SII, requiere revisar la Resolución Exenta vigente
sobre obligatoriedad de boleta electrónica (era 2022 para empresas
masivas, puede haber evolucionado).

**Alerta**: INFORMATIVA (ALERTA-AUDIT-04-21-11, nueva).

---

### Área 12 — Ley 21.561 (40 horas semanales)

**Estado en el repositorio**:
- `src/admin/hr/ContratosTab.tsx:116` y `:256` citan Ley 21.561
  explícitamente en plantillas de contrato.
- `src/admin/hr/ContratosTab.tsx:1011` menciona "reducción gradual a
  40 hrs semanales".
- `src/admin/shared/ChileLaborConstants.ts:131`: `validateSalary`
  asume 40 horas como default.
- `backend/payroll_calculator.py:57`: `WEEKLY_HOURS: float = 45.0`
  (DESFASADO respecto a Ley 21.561).
- `backend/payroll_calculator.py:56`: `MONTHLY_HOURS: float = 180.0`
  (180 = 45×4; si es 40 horas, debería ser 160).

**Fuente**: https://www.bcn.cl/leychile/navegar?idNorma=1192413

**Estado**: PENDIENTE VERIFICACIÓN — la Ley 21.561 reduce la jornada
gradualmente: 44h desde 2024-04-26, 42h desde 2026-04-26, 40h desde
2028-04-26. **A 2026-04-21 (hoy) faltan 5 días para que entre en
vigencia el tramo de 42h/semana**. Requiere confirmación externa de la
fecha exacta del escalón 42 horas.

**Impacto**: `backend/payroll_calculator.py` calcula overtime dividiendo
por 180 (45×4). Si la jornada legal es 42h desde 2026-04-26, la base
del cálculo de horas extras debe actualizarse a 168 horas (42×4) en
esa fecha. Desfase de 12 horas/mes sobre la base significa que cualquier
hora extra calculada con la base 180 resulta en remuneración INFERIOR
a la legal correspondiente → riesgo Art. 32 CT + Art. 63 bis CT +
eventual multa DT.

**Alerta**: CRÍTICA (ALERTA-AUDIT-04-21-12, nueva) — `backend/payroll_calculator.py:56-57`
debe actualizarse a 42h/semana antes del 2026-04-26 (inminente).

---

### Área 13 — Ley 21.643 "Ley Karin" (acoso laboral y sexual)

**Estado en el repositorio**:
- Ampliamente citada en código: `src/admin/legal/LegalTab.tsx:51`,
  `:227`, `:232`, `:369`, `:373`, `:377`, `:535`, `:536`, `:947`;
  `src/admin/tools/BibliotecaDocumentos.tsx:107`, `:112`, `:113`,
  `:409`, `:420`, `:491`, `:615`, `:635`, `:636`, `:661`, `:758`;
  `src/admin/modules/adminModules.ts:370`; `src/admin/hr/ContratosTab.tsx`;
  `src/admin/hr/InspeccionTrabajoTab.tsx:611`.
- Plantillas de Protocolo Ley Karin generadas desde
  `BibliotecaDocumentos.tsx:615-661`.
- Estado marcado "Pendiente" en checklist interno (`:758`).
- NO citada en `docs/legal/v3.2/privacy.md` ni en `docs/legal/v3.2/terms.md`
  (correctamente: Ley Karin es laboral, no de privacidad ni consumidor).

**Fuente**: https://www.bcn.cl/leychile/navegar?idNorma=1205188

**Estado**: PENDIENTE VERIFICACIÓN — fecha efectiva declarada en el
código (`01/08/2024`) y artículos citados (211-A al 211-I CT) requieren
confirmación. Conniku como empleador chileno está obligado a tener
Protocolo Ley Karin vigente. El código genera la plantilla pero no
registra si está firmada/aprobada.

**Alerta**: INFORMATIVA (ALERTA-AUDIT-04-21-13, nueva) — verificar con
Cristian si el Protocolo Ley Karin de Conniku SpA está efectivamente
aprobado y archivado. El sistema lo genera como template pero la
obligación legal es tener la versión firmada.

---

## 5. Hallazgo adicional crítico (fuera de las 13 áreas listadas)

### 5.1 `docs/legal/v3.2/cookies.md` es un stub etiquetado como "aprobado"

**Evidencia**:

    $ cat docs/legal/v3.2/cookies.md
    ---
    documento: Política de Cookies
    version: "1.0"
    vigencia_desde: "[PENDIENTE — se completa en Pieza 5 del bloque bloque-legal-consolidation-v2]"
    estado: STUB — NO PUBLICAR
    ---
    # Política de Cookies — v1.0
    ## Aviso
    Este documento está pendiente de redacción.

    $ shasum -a 256 docs/legal/v3.2/cookies.md
    a00150297efa288b53bbd9a0c655e046a292d3cdefb04254b0b33c079022efd9

    $ grep COOKIES_HASH backend/constants/legal_versions.py
    COOKIES_HASH: str = "a00150297efa288b53bbd9a0c655e046a292d3cdefb04254b0b33c079022efd9"

    $ grep -A2 "cookies:" docs/legal/v3.2/METADATA.yaml
      cookies:
        version: "1.0.0"
        sha256: "a00150297efa288b53bbd9a0c655e046a292d3cdefb04254b0b33c079022efd9"
        vigencia_desde: "2026-04-20"
        autor_aprobacion: "Cristian Gutiérrez Lazcano (cgutierrezlazc-eng)"
        aprobacion_fecha: "2026-04-20"

**Problema**: METADATA.yaml declara cookies v1.0.0 con
`aprobacion_fecha: "2026-04-20"` y `vigencia_desde: "2026-04-20"`, pero
el contenido del archivo canónico es literal "STUB — NO PUBLICAR". El
hash coincide y la cadena de integridad está intacta, pero se está
firmando como "aprobado" un texto que el propio archivo declara "no
publicar".

**Impacto**: cualquier usuario que acepte consentimiento de cookies en
el banner del Bloque 1 almacenará el hash `a00150297efa...` en
`cookie_consents.policy_hash` como prueba irrefutable de haber aceptado
un documento vacío. Esto contradice GDPR Art. 7(1) (demostrabilidad del
consentimiento sobre un texto específico y verificable).

**Alerta**: CRÍTICA (ALERTA-AUDIT-04-21-14, nueva) — BLOQUEANTE para el
commit del Bloque 1 cookie consent hasta que la Pieza 5 de
legal-consolidation-v2 (o una pieza equivalente del Bloque 1) publique
el texto real de la Política de Cookies.

---

## 6. Cruces transversales

### 6.1 Coherencia Privacy v2.4.0 ↔ banner de cookies del Bloque 1

- Privacy v2.4.0 §8 dice: "El detalle íntegro de cada clave de
  almacenamiento … se encuentra en la Política de Cookies
  (conniku.com/cookies)".
- La ruta `/cookies` sirve el archivo `src/pages/CookiesPolicy.tsx`
  (según ALERTA-COOKIE-6 preexistente, este archivo ya existe y tiene
  contenido entre líneas 206 y 242).
- El markdown canónico v3.2/cookies.md está vacío (stub).

**Inconsistencia**: la Privacy remite a un documento que en la práctica
existe como HTML en `/cookies` pero NO existe como texto canónico
versionado con hash probatorio. El usuario lee un HTML, pero lo que se
almacena como hash en la tabla `cookie_consents` es el hash del stub.

**Acción**: antes del commit del Bloque 1, la Pieza 6 prevista debe
sincronizar `src/pages/CookiesPolicy.tsx` → `docs/legal/v3.2/cookies.md`
→ hash en `legal_versions.py` → METADATA.yaml.

---

## 7. Fuentes legales verificadas este turno

| Fuente | URL | Estado |
|---|---|---|
| Ley 21.719 (fecha vigencia) | bcn.cl/leychile/navegar?idNorma=1212270 | NO VERIFICABLE desde este turno |
| Ley 19.628 | bcn.cl/leychile/navegar?idNorma=141599 | NO VERIFICABLE |
| Ley 19.496 Art. 3bis | bcn.cl/leychile/navegar?idNorma=61438 | NO VERIFICABLE (ya documentado en citas-recolectadas) |
| Ley 21.096 | bcn.cl/leychile/navegar?idNorma=1118825 | NO VERIFICABLE |
| Ley 21.643 | bcn.cl/leychile/navegar?idNorma=1205188 | NO VERIFICABLE |
| Ley 21.561 | bcn.cl/leychile/navegar?idNorma=1192413 | NO VERIFICABLE |
| GDPR | eur-lex.europa.eu/eli/reg/2016/679/oj | NO VERIFICABLE |
| ePrivacy Directive | eur-lex.europa.eu/eli/dir/2002/58/oj | NO VERIFICABLE (L10 parcial en citas-recolectadas) |
| UF/UTM 2026 | sii.cl/valores_y_fechas/ | NO VERIFICABLE |
| Sueldo mínimo 2026 | dt.gob.cl | NO VERIFICABLE |
| SIS 2026 | spensiones.cl | NO VERIFICABLE |
| Retención boletas honorarios 2026 | sii.cl | NO VERIFICABLE |
| Circulares CMF 2024-2026 | cmfchile.cl | NO VERIFICABLE |

Motivo común: este entorno de ejecución de Tori no tiene acceso
saliente a internet; adicionalmente, el portal BCN (leychile) no
rinde contenido a `curl`/`WebFetch` (documentado en
`citas-recolectadas-2026-04-20.md`).

---

## 8. Borradores generados

Ninguno en este turno. Justificación:
- La Pieza 5 del bloque legal-consolidation-v2 tiene asignada la
  redacción del texto canónico de Cookies (ya aprobado como plan).
  Duplicar aquí violaría §CLAUDE.md 18.1 (un bloque a la vez).
- Las actualizaciones de Privacy v2.5 para incluir Ley 21.719
  requieren decisión de Cristian sobre fecha exacta (2026-12-01 vs
  2026-12-13).
- Las divergencias de constantes laborales/tributarias requieren
  creación de `backend/constants/labor_chile.py` y `tax_chile.py`
  como bloque dedicado (nomina-chile-v1).

---

## 9. Incertidumbres propias

Declaraciones obligatorias de gaps que podrían haber pasado
desapercibidos:

1. **No exploré `migrations/**` de las últimas 2 semanas**. Podría
   haber campos nuevos que recolectan datos personales y que
   requieren actualización de Privacy v2.4 → v2.5.
2. **No leí el archivo completo `src/pages/CookiesPolicy.tsx`**. Solo
   confirmé su existencia por grep. Si tiene texto legal específico que
   no está en ningún otro documento, ese texto no tiene hash versionado
   y puede estar incumpliendo GDPR Art. 7(1).
3. **No verifiqué si el Régimen 14D N°3 ProPyme aplicable a Conniku
   SpA sigue vigente**. Podría haber cambiado por la Ley 21.713 o
   normas posteriores.
4. **No revisé si hay integraciones nuevas (analytics, CDN, fonts)
   agregadas entre 2026-04-18 y 2026-04-21 que deban declararse como
   encargados**. El bloque landing-sandbox del 2026-04-20 pudo
   introducir Google Fonts u otros servicios.
5. **Extranjeros matriculados**: la Privacy v2.4 no diferencia derechos
   de usuarios extranjeros residentes en Chile vs no residentes. Si
   Conniku recibe estudiantes internacionales, la base jurisdiccional
   puede variar.

---

## 10. Declaración obligatoria (repetida al cierre)

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.

---

## 11. Métricas

- Documentos legales vigentes v3.2: 4 (privacy, terms, cookies STUB,
  age-declaration).
- Edad promedio de documentos (desde 2026-04-20): 1 día.
- Borradores pendientes de aprobación: 4 (2 de 2c, 2 de 2d.7), más el
  texto canónico real de cookies (Pieza 5).
- Alertas críticas abiertas tras este barrido: 9 nuevas +
  preexistentes abiertas (ALERTA-COOKIE-1, ALERTA-2D7-1, ALERTA-2C-1,
  ALERTA-2C-2, ALERTA-2C-4, ALERTA-LEG-1, ALERTA-LEG-3, ALERTA-LEG-4,
  ALERTA-LEG-5).
- Fuentes legales verificadas este turno: 0 de 13 externas. 13 áreas
  marcadas PENDIENTE VERIFICACIÓN CRISTIAN/ABOGADO.

---

## 12. Top 5 alertas más urgentes para la decisión pre-commit

Ordenadas por bloqueo inmediato al commit del Bloque 1 cookie consent:

1. **ALERTA-AUDIT-04-21-14** (CRÍTICA) — `docs/legal/v3.2/cookies.md`
   es un stub etiquetado como "aprobado 2026-04-20" en METADATA.yaml.
   Bloquea el commit porque todo usuario que acepte cookies firma un
   hash de texto vacío.
2. **ALERTA-COOKIE-1** (CRÍTICA, preexistente) — Fecha vigencia Ley
   21.719 no verificada. El código cita 2026-12-13; Cristian indicó
   2026-12-01. Bloquea publicación del texto final del banner.
3. **ALERTA-AUDIT-04-21-12** (CRÍTICA) — `backend/payroll_calculator.py:57`
   sigue en 45 horas semanales. Ley 21.561 activa escalón de 42 horas
   el 2026-04-26 (en 5 días). Afecta cálculo de overtime.
4. **ALERTA-AUDIT-04-21-6** (CRÍTICA) — UF/UTM/SIS divergen entre
   backend y frontend. Afecta liquidación de nómina real.
5. **ALERTA-AUDIT-04-21-7** (CRÍTICA) — Último tramo de impuesto 2ª
   categoría difiere: backend (310 UTM, deducible 38.82) vs frontend
   (150 UTM, deducible 30.82). Solo una puede ser correcta.

---

## 13. Referencias

- `docs/legal/alerts.md`
- `docs/legal/LEGAL_VERSIONS.md`
- `docs/legal/v3.2/METADATA.yaml`
- `docs/plans/bloque-legal-consolidation-v2/plan-maestro.md`
- `docs/plans/bloque-legal-consolidation-v2/citas-recolectadas-2026-04-20.md`
- `docs/plans/bloque-cookie-consent-banner-v1/plan.md`
- `docs/reports/2026-04-21-capa-0-legal-cookies-v1.md`
- `backend/constants/legal_versions.py`
- `backend/constants/consumer.py`
- `backend/payroll_calculator.py`
- `src/admin/shared/ChileLaborConstants.ts`
