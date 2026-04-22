# Plan maestro — Bloque `bloque-legal-consolidation-v2`

**Autor**: web-architect (Tori)
**Fecha**: 2026-04-20
**Estado**: APROBADO 2026-04-20 por Cristian — decisiones batch cerradas abajo.
**Componente legal**: SÍ (§CLAUDE.md 18.7). Requiere legal-docs-keeper
en Capa 3.5 y aprobación humana obligatoria antes de merge.

---

## Decisiones batch 2026-04-20 (Cristian)

| # | Decisión | Resolución |
|---|---|---|
| Orden | Orden de ejecución de las 7 piezas | **7 → 4 → 3 → 2 → 1 → 5 → 6** |
| 1 | Retracto "corridos vs hábiles" | **A — 10 días corridos** (Art. 3bis Ley 19.496, canon CLAUDE.md) |
| 2 | FK `user_agreements.user_id` ante borrado usuario | **C — CASCADE + tabla `legal_evidence_archive` separada** (preserva evidencia 5 años) |
| 3 | §22 Cookies en modal T&C Register | **A — Remover de T&C + link a `/cookies`** (una fuente única) |
| 4 | Verificación citas L1–L14 | **A — Tori investiga en fuentes oficiales (leychile.cl, eur-lex, bcn.cl) y produce borrador de cada cita; abogado revisa borrador final antes del merge, NO bloquea construcción del código** |
| 5 | Inventario cookies reales del sitio | **A — Builder audita en Pieza 5 cuando toque Cookies** |

**Estado operativo actual:** plan aprobado. Decisión 4A: Tori investiga
citas L1–L14 en fuentes oficiales antes de construir. Gate humano
(abogado) se mantiene obligatorio antes del merge (§18.7). Ver
`checklist-humano-abogado.md` con borradores cargados por Tori +
espacio para validación posterior del abogado.

---

## Declaración obligatoria

Este plan no constituye asesoría legal profesional. Toda cita legal
requerida por el bloque está marcada como `[VERIFICAR — ANTES DE
EJECUTAR]` hasta que Cristian (o el abogado que Cristian designe)
confirme el artículo, la URL oficial y la fecha. Ningún builder
ejecuta código de este plan hasta que la tabla de la §7 quede cerrada.

---

## 1. Contexto y motivación

### 1.1 Qué resuelve

Este bloque cierra el issue **C9** de `docs/pendientes.md` (líneas
76–82) más la deuda legal cosmética y estructural acumulada al
2026-04-20. Los síntomas concretos que se corrigen son:

- **Desfase de edad**: `src/pages/TermsOfService.tsx:135`,
  `src/pages/DeleteAccount.tsx:355-356`,
  `src/pages/PrivacyPolicy.tsx:638-644` declaran "16 años" como
  edad mínima, contradiciendo la regla operacional §CLAUDE.md
  Cumplimiento Legal "plataforma exclusiva para adultos" (18+). El
  texto ya está correcto en `shared/legal_texts.ts` (declaración
  edad checkbox) y en `docs/legal/alerts.md ALERTA-LEG-3`.
- **Divergencia T&C**: `src/pages/TermsOfService.tsx` (366 líneas,
  versión pública) y `src/components/TermsOfService.tsx` (modal en
  Register) son documentos distintos, con numeración de cláusulas y
  contenidos distintos. `ALERTA-LEG-2` documenta el conflicto.
- **Retracto incoherente**: CLAUDE.md dice "10 días corridos
  Art. 3bis Ley 19.496"; el código dice "10 días hábiles" en
  `src/pages/SupportPage.tsx:157`, `backend/notifications.py:1038`,
  `backend/paypal_routes.py:629`, `src/components/TermsOfService.tsx:385`.
  Diferencia real de hasta 4 días calendario. `ALERTA-LEG-5`.
- **Privacy omite encargados reales**: la v2.1 vigente
  (`src/pages/PrivacyPolicy.tsx`) no declara Supabase (auth+BD),
  Firebase Cloud Messaging (tokens push), Capacitor (datos
  locales dispositivo) ni Google OAuth como encargados/procesadores.
  Potencial incumplimiento GDPR Art. 13 y Ley 19.628 Art. 4°.
- **Política de Cookies**: no existe como documento separado.
  `src/pages/Register.tsx:415` y `src/pages/Login.tsx:74` linkean a
  `/cookies` — ruta inexistente hoy.
- **Sin re-aceptación**: al bumpar versiones legales (v3.0 / v2.3 /
  v1.0), los usuarios existentes seguirán usando la app sin
  re-aceptar. La tabla `user_agreements` existe
  (`backend/database.py:1848`) con soporte para `document_type`
  `age_declaration`, `tos`, `privacy`, y el backfill legacy quedó
  hecho por la migración `add_user_agreements_table.sql`. Falta el
  flujo de bump + modal bloqueante + escritura.
- **Sin versionado formal**: `docs/legal/v3.1/` no existe;
  `docs/legal/LEGAL_VERSIONS.md` no existe. Solo hay borradores en
  `docs/legal/drafts/` y un archive de v2.1 en `docs/legal/archive/`.

### 1.2 Borradores aprobados disponibles

Aprobados por Cristian 2026-04-19 (revisión visual de previews HTML):

- `docs/legal/drafts/2026-04-19-privacy-policy-2d7-export.md` — Privacy
  v2.3 (agrega §5.3 "Procesamiento al exportar documentos").
- `docs/legal/drafts/2026-04-19-terms-2d7-export.md` — T&C v3.1 (agrega
  §8 "Exportación de Documentos" con 7 sub-secciones).
- `docs/legal/drafts/2026-04-18-privacy-policy-2c-athena.md` — base v2.2
  pre-2d.7. Probable: sobrescrito por v2.3.
- `docs/legal/drafts/2026-04-18-terms-of-service-2c-athena.md` — base
  v3.0 pre-2d.7. Probable: sobrescrito por v3.1.

### 1.3 Infraestructura existente (NO re-crear)

- `shared/legal_texts.ts` y `shared/legal_texts.py` ya definen
  `AGE_DECLARATION_TEXT_V1`, `AGE_DECLARATION_VERSION = "1.0.0"`,
  `AGE_DECLARATION_HASH` hex 64, `computeHash()`.
- `backend/database.py:1848-1864` define el modelo `UserAgreement`
  con columnas: `user_id`, `document_type`, `text_version`,
  `text_version_hash`, `accepted_at_utc`, `user_timezone`,
  `client_ip`, `user_agent`, `created_at`.
- Migración `backend/migrations/add_user_agreements_table.sql` crea la
  tabla y hace backfill legacy.
- `scripts/verify-legal-texts-sync.sh` valida sync ts↔py del hash en CI.
- `src/services/auth.tsx:142` ya envía `accepted_text_version_hash`.
- Tests existentes: `backend/tests/test_user_agreement_model.py`,
  `backend/tests/test_legal_texts_hash.py`,
  `src/__tests__/legal_texts.test.ts`.
- `backend/constants/__init__.py` existe pero vacío. Los 4 módulos
  (`labor_chile.py`, `tax_chile.py`, `consumer.py`, `data_protection.py`)
  NO existen.

### 1.4 Archivos FROZEN a considerar

No sé aún qué archivos están en `FROZEN.md`. El builder debe leer
`FROZEN.md` como primer paso y, si algún archivo del scope está
frozen, detener y pedir `/unfreeze` explícito a Cristian antes de
editar.

---

## 2. Invariantes del bloque (reglas que no se violan)

**I1 — Una sola fuente de verdad por documento legal.** El texto
canónico de cada documento (T&C, Privacy, Cookies, Age Declaration)
vive en **un único archivo** bajo `docs/legal/v3.1/`. Las páginas
`.tsx` importan o generan su contenido desde ese archivo, no duplican
el texto literal. (Implementación aceptable: script de build que
convierte markdown a TSX estático, o import directo del markdown).
Si el builder decide duplicar por restricción técnica, debe dejar un
test que haga `hash(markdown) == hash(tsx_plain_text)` para evitar
drift.

**I2 — Byte-exactitud entre borrador aprobado y código.** El texto
publicado en `src/pages/*.tsx` debe ser **byte-a-byte** igual al
texto en `docs/legal/v3.1/*.md` que Cristian apruebe. Cualquier
edición tipográfica post-aprobación (comas, acentos, mayúsculas)
requiere nueva aprobación — NO se arregla en el tsx sin actualizar
el md.

**I3 — `user_agreements` es append-only.** Nunca `UPDATE` ni `DELETE`
sobre filas existentes. Cada aceptación genera una fila nueva.
Retención 5 años mínimo (§CLAUDE.md Verificación de edad, Componente 3).
Los registros sobreviven a la eliminación del usuario (CASCADE solo
si Cristian confirma que es correcto; actualmente la FK tiene
`ON DELETE CASCADE` en la migración, lo que contradice "sobrevive a
eliminación del usuario" — ver **Riesgo R7**).

**I4 — Bump de versión requiere re-aceptación.** Si `TOS_VERSION` o
`PRIVACY_VERSION` o `COOKIES_VERSION` sube de MAJOR o MINOR en el
repositorio, el siguiente login de cualquier usuario cuyo último
`user_agreements` tenga versión anterior debe disparar modal
bloqueante. Solo PATCH (typo/espacio) omite re-aceptación, y aun
así requiere commit `legal:` con justificación explícita.

**I5 — Hash obligatorio en cada aceptación.** Toda fila en
`user_agreements` debe tener `text_version_hash` computado como
SHA-256 del texto **exacto** que se mostró al usuario. Si el hash
calculado client-side no coincide con el hardcoded en el bundle, el
backend rechaza el POST (prevención de tampering / bundle stale). La
verificación server-side ya existe conceptualmente para
`AGE_DECLARATION_HASH`; se extiende a `TOS_HASH`, `PRIVACY_HASH`,
`COOKIES_HASH`.

**I6 — "16" no aparece en ningún texto legal publicado ni en
checkbox.** Test mecánico: `grep -E "16[[:space:]]*años?" src/pages/
src/components/ docs/legal/v3.1/ shared/legal_texts.{ts,py}` debe
retornar 0 matches (excluyendo archivos archive y comentarios
explicativos).

**I7 — Valores legales hardcoded → constante con cita.** Todo valor
con base legal (plazo retracto, plazo ARCO, edad mínima, plazo
reembolso, etc.) vive en `backend/constants/*.py` con formato
obligatorio: cita de artículo, URL oficial, fecha de verificación,
verificador. La UI referencia esa constante (vía API si es necesario)
o usa una constante sincronizada en `shared/` validada en CI.

**I8 — Política de Cookies declara inventario real.** La política
enumera **cada cookie o storage key que el sitio efectivamente setea**
al momento de la publicación: nombre, propósito, duración, si es
esencial o no. Si se agrega una cookie nueva en el futuro, el
legal-docs-keeper lo detecta y genera borrador de update. Test:
comparar lista declarada vs `localStorage.setItem` / `document.cookie`
efectivos en el código.

**I9 — Evidencia de lectura, no solo aceptación.** La memoria del
usuario (`feedback_legal_reading_evidence.md`) exige evidencia de
**apertura** del documento, no solo checkbox. El modal de
re-aceptación debe contener: link al documento (que abre scroll o
nueva tab), registro de timestamp de apertura (ack event), y checkbox
final habilitado solo tras scroll-to-bottom o al menos 5 segundos de
apertura del link.

**I10 — Evidencia preservada intacta ante bump futuro.** Si hoy el
usuario acepta v3.1 y mañana publicamos v3.2, la fila de v3.1 en
`user_agreements` **no se toca**. Se agrega una nueva fila para v3.2.
La evidencia histórica de v3.1 (hash, texto hash-equivalente en
`docs/legal/v3.1/`) debe sobrevivir incluso si alguien borra el
directorio del repo: test de CI que verifica que `docs/legal/v{X}/`
de cualquier versión citada en `user_agreements` existe todavía.

**I11 — No se menciona "IA/AI/inteligencia artificial" en texto
visible al usuario.** §CLAUDE.md Convenciones. Alternativas:
"asistente inteligente", "herramientas inteligentes",
"procesamiento automático". El borrador 2d.7 usa "asistentes
inteligentes" correctamente — el builder debe verificar que los
documentos finales no introduzcan el término prohibido.

**I12 — Commits del bloque usan tipo `legal:`** (§CLAUDE.md
Conventional Commits). El CI debe reconocer el prefijo; Cristian
aprueba cada commit `legal:` explícitamente antes de merge.

---

## 3. Gates del bloque (mapeados a las 7 capas §18.3)

| Gate | Capa | Quién | Criterio para avanzar |
|---|---|---|---|
| G0 | Capa 0 legal | legal-docs-keeper | Tabla §7 completa (citas verificadas). Borradores v3.1 validados. Versionado definido. |
| G1 | Capa 1 técnica | frontend-builder + backend-builder + qa-tester | TDD completo. `npx tsc --noEmit`, `npx eslint src/`, `npx vitest run`, `npx vite build`, `pytest backend/`, `ruff check backend/` en verde. Modal re-aceptación probado con usuario sintético. |
| G2 | Capa 2 | code-reviewer | Quality score PASS ≥85 con sección "Cumplimiento legal" obligatoria (§18.7). |
| G3 | Capa 3 | truth-auditor | Quality score PASS ≥85. Sin bloqueantes críticos. Verifica I6, I8 mecánicamente. |
| **G3.5** | **Capa 3.5 legal** | **legal-docs-keeper + Cristian** | **Aprobación humana explícita obligatoria** (§18.7). Cristian revisa cada documento v3.1 en preview y declara OK. |
| G4 | Capa 4 | — | Deploy a preview de Vercel exitoso. URL de preview abierta. |
| G5 | Capa 5 | gap-finder | 0 gaps críticos. Verifica: rutas `/cookies` y `/privacidad` funcionan en preview, modal aparece con usuario pre-existente, escritura a `user_agreements` ocurre con evidencia completa. |
| G6 | Capa 6 | Cristian + (opcional) abogado | Inspección humana en preview. Itera si hay mejoras. OK final explícito. |
| G7 | Capa 7 | cierre | Merge a main con commit `legal:`. Deploy prod. FROZEN.md agrega archivos v3.1. BLOCKS.md actualiza. |

---

## 4. Orden de implementación de las 7 piezas

Razonamiento del orden (think deep): este orden **minimiza
regresión** y **respeta dependencias**. Principio: primero se
estabiliza la fuente de verdad, luego los consumidores.

### Orden recomendado

1. **Pieza 7** — Versionado formal (`docs/legal/v3.1/` + `LEGAL_VERSIONS.md`).
   *Razón*: todo lo demás importa desde ahí. Sin carpeta canónica,
   el resto del trabajo no tiene dónde apuntar.
2. **Pieza 4** — Retracto consolidado en `consumer.py` con cita.
   *Razón*: la constante es referenciada por T&C, Privacy, UI
   Subscription, SupportPage, notifications. Si se fija primero, los
   textos posteriores la citan directamente. Requiere decisión
   legal entre "corridos" vs "hábiles" (ver §7).
3. **Pieza 3** — Reemplazo sistemático "16 años" → "18+".
   *Razón*: textual, barato, sin dependencias. Se hace antes de
   redactar los documentos v3.1 para que ya arranquen con 18+.
   Incluye `DeleteAccount.tsx`, `TermsOfService.tsx` (página),
   `PrivacyPolicy.tsx`, y docs archivados anotados como "histórico
   no vigente".
4. **Pieza 2** — Privacy v2.3 publicada desde borrador a
   `src/pages/PrivacyPolicy.tsx` + declaraciones GDPR Art. 13 /
   Ley 19.628 Art. 4° de encargados (Supabase, FCM, Capacitor, OAuth).
   *Razón*: Privacy cita retracto (pieza 4) y edad 18+ (pieza 3).
5. **Pieza 1** — T&C v3.1 publicada sincronizada entre
   `src/pages/TermsOfService.tsx` **y** modal Register
   (`src/components/TermsOfService.tsx`).
   *Razón*: T&C referencia Privacy (pieza 2) y retracto (pieza 4).
6. **Pieza 5** — Política de Cookies nueva: `src/pages/CookiesPolicy.tsx`,
   ruta `/cookies` en `App.tsx`, inventario real de cookies del sitio.
   *Razón*: más chica; se apoya en Privacy v2.3 para contexto de bases
   legales (Art. 6 GDPR, Art. 4° Ley 19.628). Antes del mecanismo de
   re-aceptación porque la re-aceptación debe cubrir también Cookies.
7. **Pieza 6** — Mecanismo de re-aceptación (bump versiones + hash
   SHA-256 + modal bloqueante próximo login + escritura append-only
   a `user_agreements`).
   *Razón*: la última. Necesita que los textos v3.1 existan con
   hashes congelados para que el bump tenga destino real.

### Por qué este orden y no otro

- No empezar por el modal de re-aceptación (pieza 6): obligaría a
  iterar el mecanismo cuando los textos cambien en revisión.
- No empezar por T&C/Privacy antes de retracto: duplicaría cambios
  cuando se fije el plazo canónico.
- No dejar la Pieza 3 para el final: si el builder redacta
  documentos v3.1 con "16 años" heredado, cada hash se recomputa al
  corregir, duplicando el trabajo de sincronización de `shared/` y
  tests.

---

## 5. Desglose por pieza

Para cada pieza: archivos, citas requeridas, tests TDD (RED primero),
criterio de terminado, riesgos.

### Pieza 7 — Versionado formal

**Archivos a crear**:

- `/Users/cristiang./CONNIKU/docs/legal/v3.1/` (directorio)
  - `privacy.md` (v2.3 — usar "2.3" en el archivo; el naming
    `v3.1/` agrupa por lote de publicación, no por versión
    individual de cada documento)
  - `terms.md` (v3.1)
  - `cookies.md` (v1.0)
  - `age-declaration.md` (v1.0 — snapshot del texto canónico ya
    existente, movido aquí para centralizar)
- `/Users/cristiang./CONNIKU/docs/legal/LEGAL_VERSIONS.md` (registro)
- `/Users/cristiang./CONNIKU/docs/legal/v3.1/METADATA.yaml` (hashes
  individuales + fechas de vigencia + autor aprobador)

**Formato de `LEGAL_VERSIONS.md`** (sugerido):

```
| Documento | Versión | Hash SHA-256 (primeros 12) | Vigencia desde | Vigencia hasta | Archivo |
|---|---|---|---|---|---|
| Privacy Policy | 2.1 | ... | 2026-04-11 | 2026-04-XX | archive/2026-04-11-privacy-policy-v2.1.md |
| Privacy Policy | 2.3 | ... | 2026-04-XX | actual | v3.1/privacy.md |
| Terms of Service | previo sin numeración | — | 2026-04-08 | 2026-04-XX | archive/... (a rescatar del git) |
| Terms of Service | 3.1 | ... | 2026-04-XX | actual | v3.1/terms.md |
| Cookies Policy | 1.0 | ... | 2026-04-XX | actual | v3.1/cookies.md |
| Age Declaration | 1.0.0 | ca527535a0f3 | 2026-04-11 | actual | v3.1/age-declaration.md |
```

**Citas legales requeridas**: ninguna directa (es metadata).

**Tests TDD** (RED primero):

- `backend/tests/test_legal_versions_registry.py::test_all_versions_in_user_agreements_exist_on_disk`
  — por cada `text_version` distinta en la BD, verificar que existe
  un archivo correspondiente en `docs/legal/` (actual o archive).
- `backend/tests/test_legal_versions_registry.py::test_metadata_yaml_schema`
  — valida campos obligatorios y hex del hash.
- `scripts/verify-legal-texts-sync.sh` — extender para validar que
  el hash en `METADATA.yaml` coincide con `sha256(archivo)`.

**Criterio de terminado**:
- [ ] Directorio `docs/legal/v3.1/` existe con los 4 archivos.
- [ ] `LEGAL_VERSIONS.md` lista las versiones previas y nuevas.
- [ ] Script de verificación pasa (hashes de archivos coinciden
  con `METADATA.yaml`).

**Riesgos**: bajo. Es plumbing documental.

---

### Pieza 4 — Retracto consolidado

**Archivos a crear / tocar**:

- **Crear**: `/Users/cristiang./CONNIKU/backend/constants/consumer.py`.
- **Tocar**: `src/pages/SupportPage.tsx:157`,
  `backend/notifications.py:1038-1039`,
  `backend/paypal_routes.py:629`,
  `src/pages/Subscription.tsx:599` (según reporte legal 2026-04-17),
  `src/components/TermsOfService.tsx:381-385`,
  `docs/plans/bloque-1-auth-edad/plan.md:914` (doc histórica, solo
  nota de actualización).
- **Espejar en frontend**: `shared/legal_constants.ts` (nuevo) con
  `RETRACT_DAYS_VALUE` y `RETRACT_DAYS_TYPE`. Validar sync ts↔py via
  script similar a `verify-legal-texts-sync.sh`.

**Contenido de `consumer.py`** (formato CLAUDE.md §Constantes legales):

```python
# Art. 3 bis letra b, Ley N° 19.496 sobre Protección de los Derechos
# de los Consumidores (Chile). Servicios prestados a distancia
# (internet). El consumidor puede retractar sin expresión de causa
# dentro del plazo indicado desde el cumplimiento del contrato o
# desde la recepción del producto/servicio, según corresponda.
# URL oficial: https://www.bcn.cl/leychile/navegar?idNorma=61438
# [VERIFICAR — ANTES DE EJECUTAR] Cristian/abogado confirma texto
# exacto del Art. 3 bis letra b vigente y resuelve "corridos vs
# hábiles" al 2026-04-20.
# Verificado por: [PENDIENTE]
# Fecha verificación: [PENDIENTE]
RETRACT_DAYS_VALUE = 10
RETRACT_DAYS_TYPE = "corridos"  # o "hábiles" según verificación
```

**Citas legales requeridas**:
- **Art. 3 bis letra b, Ley 19.496** (Chile). URL oficial:
  `https://www.bcn.cl/leychile/navegar?idNorma=61438` (Biblioteca
  del Congreso Nacional). `[VERIFICAR — ANTES DE EJECUTAR]` texto
  exacto y resolución corridos vs hábiles.

**Tests TDD** (RED primero):

- `backend/tests/test_consumer_constants.py::test_retract_days_value_and_type_exist`
- `backend/tests/test_consumer_constants.py::test_retract_fuente_y_url_en_docstring`
- `backend/tests/test_consumer_constants.py::test_no_otros_valores_hardcoded`
  — `grep -rn "10[[:space:]]*días[[:space:]]*hábiles"` en `backend/`
  y `src/` retorna solo `consumer.py` + tests + archive docs.

**Criterio de terminado**:
- [ ] `consumer.py` existe con constante + cita + URL.
- [ ] 0 strings "10 días hábiles" o "10 días corridos" hardcoded en
  código o UI fuera de `consumer.py` + mirror `shared/`.
- [ ] `SupportPage.tsx`, `notifications.py`, `paypal_routes.py`,
  `Subscription.tsx`, `components/TermsOfService.tsx` referencian
  la constante o usan el mismo texto canónico.
- [ ] Tests en verde.

**Riesgos**:
- **R4.1 ALTO**: si Cristian/abogado resuelve "corridos" pero
  producción histórica informó "hábiles", usuarios que pagaron antes
  del cambio podrían reclamar el plazo más favorable. Mitigación:
  política de transición: para cobros anteriores a la fecha de
  publicación de v3.1, aplicar el plazo más largo entre los dos.
- **R4.2 MEDIO**: UE y otros países tienen 14 días (Directiva
  2011/83/UE) — ya mencionado en `components/TermsOfService.tsx:385`.
  Fuera de scope para v3.1 (ver §11).

---

### Pieza 3 — "16" → "18+"

**Archivos a tocar**:

- `src/pages/TermsOfService.tsx:135` — cambiar "mayor de 16 años"
  → "mayor de 18 años" (y el resto del párrafo alineado con la
  declaración canónica).
- `src/pages/DeleteAccount.tsx:355-356` — cambiar "mayores de 16
  años" y "menor de 16 años" → "18".
- `src/pages/PrivacyPolicy.tsx:638-644` — reemplazar párrafo
  completo con política 18+ absoluta, citando que Conniku aplica la
  restricción más estricta aunque GDPR permita 13-16 según Estado
  miembro (consistente con CLAUDE.md).
- `docs/legal/drafts/2026-04-18-privacy-policy-2c-athena.md:239` y
  `docs/legal/drafts/2026-04-18-terms-of-service-2c-athena.md:211` —
  son borradores obsoletos, quedan como histórico en `docs/legal/drafts/archive/`.
- `docs/legal/archive/2026-04-11-privacy-policy-v2.1.md` — NO se
  modifica (es archivo histórico). `LEGAL_VERSIONS.md` anota que
  v2.1 tenía "16" como dato histórico.

**Citas requeridas**:
- Regla operacional Conniku (§CLAUDE.md Cumplimiento Legal — "plataforma
  exclusiva para adultos"). No es cita de ley; es decisión de
  producto documentada.
- `[VERIFICAR — ANTES DE EJECUTAR]` si existe fuente chilena que
  obligue a 18+ en servicios digitales con pago, para citarla en
  la Privacy (posiblemente Ley 19.628 + Código Civil Art. 1447).

**Tests TDD**:

- `src/__tests__/no_sixteen_years.test.ts` — regex `16[[:space:]]*años?`
  sobre `src/pages/` y `src/components/` retorna 0 matches
  (excluyendo tests y archive).
- Se replicaría en pytest: `backend/tests/test_no_sixteen_years.py`
  sobre `shared/legal_texts.py` y `backend/`.

**Criterio de terminado**:
- [ ] Grep mecánico 0 hits.
- [ ] Tests en verde.
- [ ] Archivos histórico/archive intactos con nota "contiene
  referencias a 16 años — histórico, no vigente".

**Riesgos**:
- **R3.1 BAJO**: olvidar algún string oculto en tooltips / placeholders /
  email templates / descripción de la app en stores. Mitigación:
  extender grep también a `backend/email_templates/`, `capacitor.config*`,
  `public/` manifestos, Play Store descripción (manual).

---

### Pieza 2 — Privacy v2.3 publicada

**Archivos a tocar / crear**:

- **Crear**: `docs/legal/v3.1/privacy.md` — texto canónico final v2.3.
- **Modificar**: `src/pages/PrivacyPolicy.tsx` — contenido completo
  de secciones reemplazado para alinear con v2.3.
- **Integrar cambios del borrador 2d.7**: §5.3 "Procesamiento al
  exportar documentos" (líneas 141–182 del borrador).
- **Agregar declaraciones faltantes** (GDPR Art. 13 / Ley 19.628 Art. 4°):
  - **Supabase**: auth + BD PostgreSQL, localización de servidores,
  rol de encargado de tratamiento.
  - **Firebase Cloud Messaging**: token push, propósito
  (notificaciones), retención.
  - **Capacitor**: cuando apps móviles; datos locales del
  dispositivo (localStorage wrap, no datos nuevos pero visible al
  usuario).
  - **Google OAuth** (si aplica al proyecto actual): scopes
  solicitados, cómo se desvincula.
  - **Zoho Mail SMTP**: envío de email transaccional.
  - **MercadoPago / PayPal**: procesadores de pago, qué datos se
  les envían.
  - **Claude API (Anthropic)**: chatbot/soporte. Referir como
  "asistente inteligente" (I11).
  - **Vercel**: frontend hosting (no procesa datos personales
  típicamente, pero logs de acceso).
  - **Render**: backend hosting.

**Citas legales requeridas** (tabla §7):
- **GDPR Art. 13** (Reglamento UE 2016/679) — información que debe
  facilitarse cuando los datos personales se obtienen del
  interesado. URL: `https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679` `[VERIFICAR]` artículo y texto vigente.
- **Ley 19.628 Art. 4°** (Chile) — información al titular al
  momento del tratamiento. URL:
  `https://www.bcn.cl/leychile/navegar?idNorma=141599` `[VERIFICAR]`.
- **GDPR Art. 28** — relación con encargados del tratamiento.
  Informativa (contratos ya firmados con Supabase, etc. quedan
  fuera de scope pero se menciona).

**Tests TDD**:

- `src/__tests__/privacy_policy_encargados.test.tsx` — assertions:
  "Supabase", "Firebase Cloud Messaging", "Capacitor", "Google",
  "Zoho", "MercadoPago", "PayPal", "Claude" (o
  "asistente inteligente"), "Vercel", "Render" aparecen en el HTML
  renderizado. Verifica que la lista no está silenciada.
- `src/__tests__/privacy_policy_no_16.test.tsx` — "16 años" NO
  aparece (solapa con test de Pieza 3).
- `backend/tests/test_privacy_hash_matches_canonical.py` — el texto
  en `docs/legal/v3.1/privacy.md` hashea igual que lo que el bundle
  frontend le muestra al usuario (extraer texto con un test que lea
  el tsx como string y compare).

**Criterio de terminado**:
- [ ] `docs/legal/v3.1/privacy.md` existe con el texto final
  aprobado.
- [ ] `src/pages/PrivacyPolicy.tsx` render coincide byte-a-byte
  con el md (o vía import directo).
- [ ] Los 9 encargados/servicios mencionados arriba aparecen
  declarados.
- [ ] "16" no aparece.
- [ ] Hash del documento escrito en `METADATA.yaml` de v3.1.

**Riesgos**:
- **R2.1 ALTO**: GDPR Art. 13 puede exigir más declaraciones de
  las que el borrador 2d.7 cubre. Mitigación: `[VERIFICAR —
  abogado]` revisa la lista completa antes de G3.5.
- **R2.2 MEDIO**: al declarar Supabase se compromete a mantener DPA
  firmado y actualizado con Supabase. Verificar si el DPA existe
  hoy (Cristian decide si está vigente).
- **R2.3 BAJO**: Claude API: §CLAUDE.md prohíbe decir "IA" al
  usuario. En la Privacy se debe decir "asistente inteligente" o
  "procesamiento automático", no "modelo de lenguaje"/"IA"
  (I11).

---

### Pieza 1 — T&C v3.1 sincronizada

**Archivos a tocar / crear**:

- **Crear**: `docs/legal/v3.1/terms.md` — texto canónico v3.1.
- **Modificar**: `src/pages/TermsOfService.tsx` — reemplazar
  contenido.
- **Modificar**: `src/components/TermsOfService.tsx` — reemplazar
  contenido (ya se usa en modal Register vía
  `Register.tsx:7, 1883`).
- **Objetivo**: `pages/TermsOfService.tsx` y `components/TermsOfService.tsx`
  muestran el **mismo texto**. Preferencia: el componente en
  `components/` pasa a ser un wrapper que renderiza el mismo
  contenido que la página (vía import del mismo
  `docs/legal/v3.1/terms.md`). Alternativa si técnicamente pesado:
  dos tsx pero test que verifica igualdad byte-a-byte del texto
  visible (ignorando wrapper).

**Citas legales requeridas** (ya integradas en borrador 2d.7):
- **Art. 12 Ley 19.496** (información veraz y oportuna).
- **Art. 17-19 Ley 17.336** (propiedad intelectual y citas
  académicas).
- **Art. 71 B Ley 17.336** (excepción citación académica).
- **Art. 3 bis letra b Ley 19.496** (retracto, piezas 4).
- `[VERIFICAR]` cada artículo con URL oficial de leychile.cl.

**Tests TDD**:

- `src/__tests__/terms_of_service_sync.test.tsx` — renderiza
  `pages/TermsOfService` y `components/TermsOfService`, extrae
  texto visible, compara.
- `src/__tests__/terms_of_service_no_16.test.tsx` (solapa Pieza 3).
- `src/__tests__/terms_of_service_section_8_export.test.tsx` —
  verifica que §8 "Exportación de Documentos" existe con las
  sub-secciones 8.1–8.7 del borrador 2d.7.

**Criterio de terminado**:
- [ ] T&C pública y modal Register son equivalentes.
- [ ] §8 Exportación presente con las 7 sub-secciones.
- [ ] "16" no aparece.
- [ ] Hash registrado en `METADATA.yaml`.

**Riesgos**:
- **R1.1 MEDIO**: `components/TermsOfService.tsx` hoy tiene §22
  Cookies — al consolidar con la nueva Cookies Policy separada
  (Pieza 5), decidir si la sección queda en T&C también (duplicada,
  riesgo drift) o si se remueve con link a `/cookies`. Recomendación
  arquitecto: **remover §22 de T&C y poner link** para evitar drift
  (I1).
- **R1.2 MEDIO**: cambio de numeración de secciones → impacto en
  referencias internas ("ver §X") dentro del mismo documento. El
  builder debe re-corregir referencias cruzadas.

---

### Pieza 5 — Política de Cookies nueva

**Archivos a crear / tocar**:

- **Crear**: `docs/legal/v3.1/cookies.md` (texto canónico v1.0).
- **Crear**: `src/pages/CookiesPolicy.tsx`.
- **Crear**: `src/pages/CookiesPolicy.module.css` (siguiendo estilo de
  `PrivacyPolicy.module.css`).
- **Modificar**: `src/App.tsx` — agregar ruta `/cookies` o
  `/politica-cookies` con `React.lazy(() => import('./pages/CookiesPolicy'))`.
  Decidir una y ser consistente. Los links actuales en
  `Register.tsx:415` y `Login.tsx:74` apuntan a `/cookies` — usar
  esa ruta.
- **Modificar**: `src/pages/PrivacyPolicy.tsx` §8 "Cookies" →
  reducir a resumen + link a `/cookies`.
- **Modificar**: `src/components/TermsOfService.tsx` §22 Cookies →
  remover o reducir con link (ver R1.1).

**Contenido mínimo de Cookies Policy**:
1. Qué es una cookie / storage.
2. Qué cookies/keys usa Conniku **hoy** (inventario real auditado —
   grep `localStorage.setItem`, `sessionStorage.setItem`,
   `document.cookie`, Service Worker cache). Tabla nombre / propósito
   / duración / esencial sí-no / titular (primera o tercera parte).
3. Base legal (consentimiento para no esenciales; contrato para
   esenciales).
4. Cómo desactivar (navegador + config Conniku si aplica).
5. Derechos del usuario (retiro consentimiento, etc.).
6. Contacto DPO / email privacidad.

**Inventario auditable**:
- El builder debe grep en `src/` buscando `localStorage.setItem(`,
  `localStorage.getItem(`, `document.cookie =`, y documentar cada
  una. Al día 2026-04-20 se sabe que JWT vive en localStorage (§CLAUDE.md).
- Si Conniku no usa cookies third-party publicitarias (declarado en
  PrivacyPolicy.tsx:592), la política lo afirma y cierra — no hay
  consentimiento no-esencial pendiente.

**Citas legales requeridas**:
- **Directiva ePrivacy 2002/58/CE Art. 5(3)** (cookie consent UE, si
  aplica a usuarios UE). `[VERIFICAR]`.
- **GDPR Art. 6(1)(a) consentimiento** y **Art. 7** (condiciones del
  consentimiento). `[VERIFICAR]`.
- **Ley 19.628 Art. 4°** (información al titular). `[VERIFICAR]`.
- **LSSICE Art. 22.2** (España, si Conniku opera en UE). `[VERIFICAR]`
  — posiblemente fuera de scope; confirmar con Cristian.

**Tests TDD**:

- `src/__tests__/cookies_policy_route.test.tsx` — `/cookies` renderiza
  `CookiesPolicy` sin crash.
- `src/__tests__/cookies_policy_inventory.test.tsx` — cada
  `localStorage.setItem('K', ...)` encontrado por grep tiene su
  entry `K` declarada en el documento.

**Criterio de terminado**:
- [ ] Ruta `/cookies` responde 200 con contenido.
- [ ] Inventario real de storage/cookies auditado y listado.
- [ ] Links desde Login, Register y footer funcionan.
- [ ] Hash registrado en `METADATA.yaml`.

**Riesgos**:
- **R5.1 MEDIO**: Conniku PWA + Service Worker cache → el inventario
  debe incluir caches SW. `sw.js` / `workbox` / manifest entries.
- **R5.2 MEDIO**: si se agrega Google Analytics / plausible / posthog
  en el futuro, la política queda desactualizada. `alerts.md` debe
  recordar al legal-docs-keeper re-auditar.

---

### Pieza 6 — Mecanismo de re-aceptación

**Archivos a crear / tocar**:

- **Modificar**: `shared/legal_texts.ts` y `shared/legal_texts.py` —
  agregar:
  - `TOS_VERSION = "3.1.0"`, `TOS_HASH = "<sha256>"`, `TOS_DOCUMENT_TYPE = "tos"`.
  - `PRIVACY_VERSION = "2.3.0"`, `PRIVACY_HASH = "<sha256>"`, `PRIVACY_DOCUMENT_TYPE = "privacy"`.
  - `COOKIES_VERSION = "1.0.0"`, `COOKIES_HASH = "<sha256>"`, `COOKIES_DOCUMENT_TYPE = "cookies"`.
- **Modificar**: `scripts/verify-legal-texts-sync.sh` — extender
  para validar los 3 hashes nuevos.
- **Crear**: `src/components/LegalReacceptanceModal.tsx` — modal
  bloqueante que:
  - Lista los documentos pendientes de re-aceptar con diff-highlight
    "novedades" opcional.
  - Link a cada documento (abre en nueva tab o panel lateral).
  - Registra timestamp de apertura por documento (evento `ack_opened`).
  - Checkbox final **habilitado solo tras** confirmación de lectura
    de cada documento (I9).
  - Al aceptar: POST a `/auth/reaccept-legal` con lista de
    `{document_type, text_version, text_version_hash}` + timezone.
- **Crear**: endpoint `POST /auth/reaccept-legal` en
  `backend/auth_routes.py` — valida hash coincide, escribe filas
  append-only en `user_agreements`, retorna OK.
- **Crear middleware**: backend chequea al login / al refresh
  token si el usuario tiene filas actuales para `tos`, `privacy`,
  `cookies` con versión vigente. Si falta alguna, responde
  `403 requires_reacceptance` con lista de faltantes.
- **Modificar**: `src/services/auth.tsx` — interpretar el 403 y
  montar el modal.
- **Opcional**: `src/pages/App.tsx` wrap `<Router>` con un
  `<LegalGate />` que re-chequea al montar.

**Citas legales requeridas**:
- **GDPR Art. 7(1)** — demonstrate consent. `[VERIFICAR]`.
- **Ley 19.628 Art. 4°** — información al titular. `[VERIFICAR]`.
- **Ley 19.799 Chile** (firma electrónica simple). `[VERIFICAR]` si
  se puede invocar para fundar el valor probatorio de la aceptación
  por checkbox + hash.
- **Código Civil Art. 1477-1489** (consentimiento). `[VERIFICAR]` si
  aplica.

**Tests TDD**:

- `backend/tests/test_reaccept_flow.py::test_existing_user_without_tos_v31_gets_403`
- `backend/tests/test_reaccept_flow.py::test_post_reaccept_writes_append_only_row`
- `backend/tests/test_reaccept_flow.py::test_post_reaccept_rejects_wrong_hash`
- `backend/tests/test_reaccept_flow.py::test_legacy_user_age_declaration_legacy_still_counts_for_age_but_needs_tos`
- `src/__tests__/LegalReacceptanceModal.test.tsx` — renderiza, el
  checkbox final está disabled hasta que todos los links fueron
  abiertos (I9).

**Criterio de terminado**:
- [ ] Usuario legacy logea → modal bloqueante aparece.
- [ ] Usuario acepta → fila nueva en `user_agreements` por cada
  `document_type`, con hash correcto, IP, UA, timezone.
- [ ] Usuario intenta bypass del modal → login no avanza.
- [ ] Tests en verde.

**Riesgos**:
- **R6.1 ALTO bloqueante**: si el middleware tiene bug, usuarios
  quedan bloqueados en producción sin poder acceder. Mitigación:
  (a) smoke test obligatorio en preview G5 con usuario real; (b)
  feature flag `LEGAL_GATE_ENFORCE=true/false` con valor `false`
  inicial tras deploy y flip a `true` tras 24h de monitoring; (c)
  endpoint `/auth/reaccept-status` queriable para auditoría.
- **R6.2 MEDIO**: modal ignorado por usuario que cierra tab y vuelve
  → queda sin aceptar. Mitigación: middleware valida en cada request
  autenticado, no solo al login.
- **R6.3 MEDIO**: escribir IP crudo puede caer bajo Ley 19.628 (IP
  es dato personal en Chile y GDPR). Mitigación: declararlo en Privacy
  Policy §2.1 y §5.3, base legal "interés legítimo para evidencia
  probatoria" (Art. 6(1)(f) GDPR) + retención 5 años.

---

## 6. Schema `user_agreements` — verificación

**Estado actual** (`backend/database.py:1848-1864` + migración):

| Campo | Tipo | Nullable | Comentario |
|---|---|---|---|
| `id` | INT PK | NO | autoincrement |
| `user_id` | VARCHAR(16) FK | NO | `users.id` ON DELETE CASCADE |
| `document_type` | VARCHAR(40) | NO | 'age_declaration' / 'tos' / 'privacy' / 'cookies' / 'age_declaration_legacy' |
| `text_version` | VARCHAR(20) | NO | ej "3.1.0" |
| `text_version_hash` | VARCHAR(64) | NO | hex SHA-256 64 chars |
| `accepted_at_utc` | TIMESTAMP | NO | default CURRENT_TIMESTAMP |
| `user_timezone` | VARCHAR(64) | YES | |
| `client_ip` | VARCHAR(64) | YES | suficiente para IPv6 (45 chars) |
| `user_agent` | TEXT | YES | |
| `created_at` | TIMESTAMP | YES | default CURRENT_TIMESTAMP |

**Veredicto**: schema **cubre** todos los requisitos del bloque para
las piezas 1–6. **No se requiere migración adicional** en esta
fase, con una excepción:

- **Conflicto con I3**: la FK `ON DELETE CASCADE` **borra** filas
  de `user_agreements` cuando se elimina el usuario. Esto contradice
  el requisito "sobrevive a la eliminación del usuario" (§CLAUDE.md
  Verificación de edad, Componente 3). **Decisión pendiente**:
  - **Opción A**: cambiar a `ON DELETE RESTRICT` + flow de borrado
    soft del usuario (user.deleted_at) manteniendo agreement.
  - **Opción B**: cambiar a `ON DELETE SET NULL` (pero `user_id` es
    NOT NULL, requeriría migración para permitir NULL).
  - **Opción C**: mantener CASCADE y documentar que solo se retiene
    el hash + timestamp en tabla de auditoría separada
    `legal_audit_log` al momento del delete del usuario.

La **decisión de schema** la toma Cristian en §7 antes de G0.
Recomendación del arquitecto: **Opción C** — nueva tabla
`legal_audit_log` (append-only, sin FK) que recibe copia del
`user_agreements` al borrar usuario. Esto preserva evidencia legal
sin romper el modelo de datos.

Si Cristian elige B o C, **sí hay migración Alembic** nueva requerida
(o `backend/migrations/add_legal_audit_log.sql`).

---

## 7. Citas legales pendientes de verificación

Antes de que cualquier builder ejecute Pieza 1–6, Cristian (o el
abogado) debe confirmar cada fila. El legal-docs-keeper asiste, pero
no reemplaza validación profesional.

| # | Cita | Uso en bloque | URL oficial sugerida | Estado |
|---|---|---|---|---|
| L1 | Art. 3 bis letra b, Ley 19.496 | Retracto (pieza 4) | `https://www.bcn.cl/leychile/navegar?idNorma=61438` | `[VERIFICAR]` texto + "corridos vs hábiles" |
| L2 | Art. 12 Ley 19.496 | T&C §8 info veraz | `https://www.bcn.cl/leychile/navegar?idNorma=61438` | `[VERIFICAR]` texto |
| L3 | Art. 17, 71 B Ley 17.336 | T&C §8.3 propiedad intelectual | `https://www.bcn.cl/leychile/navegar?idNorma=28933` | `[VERIFICAR]` |
| L4 | Art. 4° Ley 19.628 | Privacy art. 13 info al titular | `https://www.bcn.cl/leychile/navegar?idNorma=141599` | `[VERIFICAR]` texto |
| L5 | Art. 16 Ley 19.628 | Privacy plazos ARCO (2 días hábiles) | idem L4 | `[VERIFICAR]` |
| L6 | GDPR Art. 13 | Privacy info obligatoria | `https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679` | `[VERIFICAR]` |
| L7 | GDPR Art. 6(1)(a),(b),(f) | Privacy + re-aceptación | idem L6 | `[VERIFICAR]` |
| L8 | GDPR Art. 7 consentimiento | Pieza 6 | idem L6 | `[VERIFICAR]` |
| L9 | GDPR Art. 28 encargados | Privacy Supabase/FCM/Google/MP/PayPal | idem L6 | `[VERIFICAR]` |
| L10 | Directiva ePrivacy 2002/58/CE Art. 5(3) | Cookies consent UE | `https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32002L0058` | `[VERIFICAR]` + si aplica a usuarios UE de Conniku hoy |
| L11 | Ley 19.799 firma electrónica simple | Pieza 6 valor probatorio checkbox | `https://www.bcn.cl/leychile/navegar?idNorma=196640` | `[VERIFICAR]` si fundamenta |
| L12 | Código Penal Chile Art. 210 (falsedad declaración) | Checkbox edad (ya vigente) | `https://www.bcn.cl/leychile/navegar?idNorma=1984` | `[VERIFICAR]` — nota pre-existente en CLAUDE.md ("sin abogado aún") |
| L13 | Código Civil Art. 1447 (capacidad) | Fundamentar 18+ | `https://www.bcn.cl/leychile/navegar?idNorma=172986` | `[VERIFICAR]` — si se cita en Privacy |
| L14 | Directiva 2011/83/UE 14 días retracto | Referencia en T&C §retracto multi-jurisdicción | `https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32011L0083` | `[VERIFICAR]` + decidir si se declara o se remueve |

**Bloqueante**: mientras alguna fila tenga `[VERIFICAR]`, el gate G0
no pasa. El builder no inicia.

---

## 8. Criterio de terminado del bloque completo

Lista de condiciones binarias verificables:

- [ ] `docs/legal/v3.1/` existe con `privacy.md`, `terms.md`,
  `cookies.md`, `age-declaration.md`, `METADATA.yaml`.
- [ ] `docs/legal/LEGAL_VERSIONS.md` lista v2.1 archivada, v2.3
  Privacy actual, v3.1 Terms actual, v1.0 Cookies actual, v1.0.0
  Age Declaration actual — cada una con hash y fecha vigencia.
- [ ] `backend/constants/consumer.py` existe con `RETRACT_DAYS_VALUE`
  + `RETRACT_DAYS_TYPE` + cita + URL + fecha + verificador.
- [ ] `shared/legal_texts.{ts,py}` agrega `TOS_VERSION/HASH`,
  `PRIVACY_VERSION/HASH`, `COOKIES_VERSION/HASH`.
- [ ] `scripts/verify-legal-texts-sync.sh` valida los 3 nuevos hashes
  + el del age declaration existente.
- [ ] `src/pages/TermsOfService.tsx` y `src/components/TermsOfService.tsx`
  muestran el mismo texto v3.1 (assertion por test).
- [ ] `src/pages/PrivacyPolicy.tsx` muestra texto v2.3 con §5.3
  export + declaraciones de Supabase, FCM, Capacitor, Google OAuth,
  Zoho, MercadoPago, PayPal, Claude (como "asistente inteligente"),
  Vercel, Render.
- [ ] `src/pages/CookiesPolicy.tsx` existe; ruta `/cookies` responde
  200 con inventario real.
- [ ] `src/App.tsx` incluye la ruta lazy.
- [ ] "16 años" no aparece en ningún tsx o py publicado (solo en
  `docs/legal/archive/` con nota histórica).
- [ ] Retracto aparece citado con el mismo plazo canónico en
  `SupportPage.tsx`, `notifications.py`, `paypal_routes.py`,
  `Subscription.tsx`, `components/TermsOfService.tsx`.
- [ ] Modal de re-aceptación `LegalReacceptanceModal.tsx` existe;
  smoke test en preview con usuario sintético demuestra que:
  aparece al login, bloquea la app hasta aceptar, escribe filas
  `user_agreements` con hash correcto.
- [ ] Endpoint `POST /auth/reaccept-legal` + middleware de gate
  funcionan.
- [ ] Tests en verde: `npx tsc --noEmit`, `npx eslint src/`,
  `npx vitest run`, `npx vite build`, `pytest backend/`,
  `ruff check backend/`.
- [ ] legal-docs-keeper emite reporte Capa 3.5 sin bloqueantes.
- [ ] Cristian aprueba humanamente cada documento en preview
  (Capa 6 — iteración hasta OK final).
- [ ] Commit `legal:` con todos los archivos listados, hooks en
  verde, CI en verde.
- [ ] BLOCKS.md actualizado; FROZEN.md agrega los 4 archivos
  `docs/legal/v3.1/*.md` + `backend/constants/consumer.py` +
  `shared/legal_texts.{ts,py}` + `src/pages/CookiesPolicy.tsx` y
  sus espejos.

---

## 9. Riesgos del bloque entero

### ALTOS

- **R-A1 Modal re-aceptación bloquea producción**: bug en middleware
  → usuarios no pueden entrar. Mitigación §5 Pieza 6 R6.1 (feature
  flag + monitoring 24h + endpoint de status).
- **R-A2 Versionado desalineado frontend ↔ backend**: el bundle
  cliente trae `TOS_HASH = X`, el backend espera `Y`. Deploy no
  atómico. Mitigación: `scripts/verify-legal-texts-sync.sh` ya
  corre en CI; bloquea merge si los hashes divergen. Validar que el
  script se ejecuta antes del deploy (no solo en pre-commit).
- **R-A3 GDPR Art. 13 incompleto**: encargados reales no están
  todos declarados → riesgo sanción UE. Mitigación: auditoría
  explícita del builder listando TODOS los `import` que tocan
  servicios externos + revisión del abogado en G3.5.
- **R-A4 Inventario Cookies desalineado**: la política declara X
  cookies pero el código setea Y. Mitigación: test mecánico
  Pieza 5.

### MEDIOS

- **R-M1 Retracto: "corridos" penaliza a Conniku** (plazo más
  largo). Si Cristian/abogado resuelve "corridos" y producción
  declaró "hábiles" hasta hoy → contingencia legal para contratos
  previos. Ver R4.1.
- **R-M2 Re-aceptación cansa usuarios**: si bumpeamos muchas veces
  en poco tiempo. Mitigación: agrupar cambios en lotes grandes
  (este bloque ya es un lote grande consolidado).
- **R-M3 DPA Supabase/Firebase**: declarar el encargado en Privacy
  sin tener DPA firmado vigente es exponerse. Confirmar con
  Cristian que existe DPA activo con cada encargado. Si no,
  tarea derivada fuera de scope.
- **R-M4 Migración ON DELETE CASCADE**: la decisión del §6 tiene
  impacto en retención de evidencia. Si se elige Opción C,
  aparece nueva tabla + migración.

### BAJOS

- **R-B1 Typos** al copiar borradores a tsx. Mitigación: test
  hash igualdad byte a byte.
- **R-B2 Email templates** con textos legales stale. Auditar
  `backend/email_templates/` en pieza 3 y pieza 1.
- **R-B3 Copy de stores** (Play Store, App Store) con "16" o con
  retracto viejo. Fuera del repo — Cristian actualiza manual.

---

## 10. Gate humano explícito antes de merge (G3.5 + G6)

Cristian (y, donde aplique, abogado) debe revisar y declarar OK
explícito sobre:

1. **Texto final de `docs/legal/v3.1/privacy.md`** — lectura
   completa, verificación de que los encargados declarados existen
   y están bajo DPA.
2. **Texto final de `docs/legal/v3.1/terms.md`** — lectura completa,
   verificación de que §8 export refleja la realidad del producto
   hoy (incluso si 2d.7 está en beta).
3. **Texto final de `docs/legal/v3.1/cookies.md`** — verificación de
   que el inventario corresponde a lo que el sitio setea realmente.
4. **Resolución de la tabla §7** — cada cita confirmada con URL
   oficial real, no aproximada.
5. **Decisión §6 sobre FK `user_agreements`** — A, B o C.
6. **Decisión retracto "corridos vs hábiles"** — con cita directa
   del BCN.
7. **Feature flag `LEGAL_GATE_ENFORCE`** — Cristian aprueba
   rollout gradual y calendario del flip a `true`.
8. **Lista de encargados Privacy** — Cristian confirma que cada
   uno tiene relación contractual vigente.
9. **Preview** — Cristian navega el preview, abre cada documento,
   dispara el modal, completa el flujo, verifica escritura en
   `user_agreements` del preview.

Sin esos 9 OK, G3.5 y G6 no pasan. Merge a main bloqueado.

---

## 11. Fuera de scope reafirmado

- **Auditoría profesional de abogado** del texto final. Cristian
  puede consultar abogado; el bloque avanza con `[VERIFICAR]`
  resuelto internamente, pero aprobación legal externa es gate
  propio de Cristian, no del bloque técnico.
- **Deploy a producción** de los textos v3.1. El bloque cierra en
  preview mergeado tras G7. El push a main con despliegue
  automático a prod lo autoriza Cristian explícitamente.
- **Cláusula "suscripción MAX vigente" en `backend/tutor_contract.py:78`**
  (ver `docs/pendientes.md` línea 227). Es un contrato con tutores,
  requiere su propio flujo de addendum. Bloque separado.
- **Expansion a i18n legal** (M7 pendientes) — cuando Conniku se
  expanda a otros países, abogado local valida. Fuera de hoy.
- **Link compartible Workspaces (2d.9)** — tiene su propio
  componente legal, va al Bloque 2.5.
- **DPA con Supabase / Firebase / etc.**: firmar contratos
  DPA actualizados es tarea operacional de Cristian, no código.
- **Registro del tratamiento ante autoridad** (CNIL / AEPD / ANPD
  Chile futura) — no scope.
- **Política de seguridad de la información interna** — documento
  separado en backlog legal-docs-keeper.
- **Revisión de términos de MercadoPago/PayPal/Zoho** hacia abajo
  — fuera de scope de Conniku; ellos tienen sus propios T&C.
- **Copy de Play Store / App Store / marketing** — actualizado por
  Cristian manualmente tras merge del bloque.
- **Rediseño visual** de las páginas legales. Se mantiene el
  estilo actual (`PrivacyPolicy.module.css`, `TermsOfService.module.css`).

---

## 12. Notas finales para el builder

- Leer FROZEN.md primero. Si algún archivo del scope está
  congelado, detener y pedir `/unfreeze`.
- Cada commit del bloque va con prefijo `legal:` (§Conventional
  Commits CLAUDE.md). Ejemplos:
  - `legal: crear backend/constants/consumer.py con retracto citado`
  - `legal: reemplazar "16 años" por "18+" en tsx legales`
  - `legal: Privacy v2.3 publicada con encargados GDPR Art. 13`
  - `legal: T&C v3.1 sincronizada page ↔ modal con export §8`
  - `legal: Política de Cookies v1.0 nueva con inventario real`
  - `legal: mecanismo de re-aceptación + user_agreements flow`
- Cada commit `legal:` requiere aprobación humana de Cristian antes
  de merge (§18.7 + §Conventional Commits).
- TDD estricto (§TDD CLAUDE.md): RED → GREEN → REFACTOR.
- Prettier proactivo (§24) + pre-flight CI local (§23) antes de
  push.
- No inventar cita legal. Si aparece `[VERIFICAR]` en código del
  builder, detener y preguntar a Cristian.

---

**FIN PLAN MAESTRO — esperando aprobación explícita de Cristian
antes de ejecutar Capa 0 (legal-docs-keeper) y resolver tabla §7.**
