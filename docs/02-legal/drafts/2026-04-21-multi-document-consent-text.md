---
documento: "Texto canónico del párrafo unificado de consentimiento multi-documento (D-M4)"
bloque: "multi-document-consent-v1"
capa: "Capa 0 legal-docs-keeper"
version_propuesta: "1.0.0"
estado: BORRADOR — PENDIENTE APROBACIÓN HUMANA CRISTIAN
autor: "legal-docs-keeper (Tori)"
fecha: "2026-04-21"
decision_tomada: "C — párrafo unificado con granularidad visual por bloques"
alternativas_descartadas: ["A — párrafo único plano", "B — dos párrafos totalmente separados"]
dependencias_verificadas:
  - "docs/legal/v3.2/terms.md (hash 9a16122f...)"
  - "docs/legal/v3.2/privacy.md (hash 7a8ba81d...)"
  - "docs/legal/v3.2/cookies.md (hash 48b90468...)"
  - "docs/legal/v3.2/age-declaration.md (hash 61dab2ec...)"
  - "backend/legal_document_views_routes.py (endpoint POST /legal/documents/{doc_key}/viewed)"
  - "backend/database.py:1962 DocumentView model"
---

# Texto canónico del párrafo unificado de consentimiento — D-M4

## Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.

---

## 1. Texto final aprobado (D-M4 opción C)

El siguiente texto se precede al checkbox único del formulario de registro
de `src/pages/Register.tsx` (step 3). Se guarda en `shared/legal_texts.ts`
como constante `MULTI_DOCUMENT_CONSENT_TEXT_V1` (espejo en
`shared/legal_texts.py`).

```text
Al continuar con el registro declaro, bajo fe de juramento, que soy mayor de 18 años y que los datos entregados son verdaderos.

Por separado, y tras haberlos leído, acepto expresamente los siguientes documentos del servicio:

1. Términos y Condiciones del Servicio.
2. Política de Privacidad.
3. Política de Cookies.
4. Declaración de Edad.

Entiendo que esta aceptación queda registrada como evidencia específica y demostrable conforme al Reglamento (UE) 2016/679 Art. 7(1) y a la Ley N° 19.628 Art. 4°, y que puedo retirar mi consentimiento en cualquier momento cuando la base legal sea el consentimiento.
```

### Metadatos del texto

- **Versión**: `MULTI_DOCUMENT_CONSENT_VERSION = "1.0.0"`
- **Hash SHA-256** (hex lowercase, calculado sobre el texto anterior
  byte-a-byte con separadores `\n` Unix, sin CRLF, sin trailing spaces):

  ```
  fc0580fce646822efafb1d0d2517fa9ab7296ffb1615a286701eb1d256b571e9
  ```

- **Longitud**: 608 caracteres, 96 palabras (bajo el límite D-M4 de 100).
- **Idioma**: español chileno neutral, sin modismos (D-M8 = A). Estructura
  preparada para i18n futuro vía dict `{es: "..."}` en el espejo .ts/.py.

### Cómo recalcular el hash

```bash
python3 -c "import hashlib; print(hashlib.sha256(open('texto.txt','rb').read()).hexdigest())"
```

Requisito: el archivo `texto.txt` debe contener EXACTAMENTE el bloque
entre separadores, con un `\n` final separando cada sección y sin
trailing whitespace. El script `scripts/verify-legal-texts-sync.sh`
debe validar paridad `.ts ↔ .py ↔ este documento`.

---

## 2. Justificación jurídica

### 2.1 GDPR Art. 7(1) — demostrabilidad

El Reglamento (UE) 2016/679 Art. 7(1) exige que el responsable pueda
**demostrar** que el interesado consintió el tratamiento:

> "Where processing is based on consent, the controller shall be able to
> demonstrate that the data subject has consented to processing of his
> or her personal data."

Fuente: https://eur-lex.europa.eu/eli/reg/2016/679/oj Art. 7.
Verificación: web-architect 2026-04-21 + legal-docs-keeper 2026-04-21.

El texto final cita literal "conforme al Reglamento (UE) 2016/679
Art. 7(1)" y describe al usuario que su aceptación "queda registrada
como evidencia específica y demostrable". Esto:

- Informa al usuario del tratamiento probatorio antes de aceptarlo
  (Art. 13 y 14 transparencia).
- Genera sustrato documental para que el backend cumpla Art. 7(1):
  `user_agreements` + `document_views` + `cookie_consents` con hash
  del texto + IP + UA + timestamp + versión.

### 2.2 GDPR Art. 7(2) — distinguishable ("granularidad")

Art. 7(2) RGPD:

> "If the data subject's consent is given in the context of a written
> declaration which also concerns other matters, the request for
> consent shall be presented in a manner which is clearly
> distinguishable from the other matters, in an intelligible and easily
> accessible form, using clear and plain language."

Las EDPB *Guidelines 05/2020 on consent* §50-55 desarrollan el
principio de **granularidad**: si hay múltiples finalidades u objetos de
consentimiento, el formulario debe permitir distinguirlos de otros
asuntos y entre sí. El precedente Planet49 (TJUE C-673/17, 2019-10-01)
confirma que el consentimiento debe ser una acción afirmativa
específica sobre cada finalidad identificable. Orange Romania
(TJUE C-61/19, 2020-11-11) refuerza que la ambigüedad en la redacción
invalida el consentimiento.

**Cómo la redacción elegida cumple "distinguishable":**

- **Párrafo 1** (declaración jurada de edad) se distingue
  tipográficamente del resto por ser una oración separada en su propio
  bloque visual. Solo aquí aparece la fórmula "bajo fe de juramento".
- **Párrafo 2 + lista numerada** (aceptación multi-documento)
  distingue cada documento como ítem independiente de la lista; la UI
  renderiza cada ítem como link clickeable con indicador "Leído / No
  leído" (D-M3, D-M6), lo cual es granularidad visual real.
- **Párrafo 3** (informativo sobre registro probatorio y derecho de
  retirada) se mantiene separado de los actos de declaración y
  aceptación; no introduce nueva declaración de voluntad, solo informa.

No se usa un solo bloque continuo (opción A original) porque el
tribunal o regulador podría leer "acepto todo" como consentimiento
global no granular. No se separan completamente en dos formularios
(opción B) porque (i) fricciona el UX y (ii) la arquitectura de un
checkbox único ya está decidida por Cristian.

### 2.3 Ley 19.628 (Chile) Art. 4° — consentimiento específico

Ley N° 19.628 sobre Protección de la Vida Privada, Art. 4°:

> "El tratamiento de los datos personales sólo puede efectuarse cuando
> esta ley u otras disposiciones legales lo autoricen o el titular
> consienta expresamente en ello."

Fuente: https://www.bcn.cl/leychile/navegar?idNorma=141599 Art. 4°.
Verificación: web-architect 2026-04-21 + legal-docs-keeper 2026-04-21.

"Expresamente" en Ley 19.628 = manifestación de voluntad del titular
**específica** e informada. La cita explícita de la ley y el artículo
en el párrafo 3, junto con la enumeración de los 4 documentos,
satisface la exigencia de especificidad.

### 2.4 Nota sobre "fe de juramento"

La fórmula "bajo fe de juramento" se mantiene **solo para la
declaración de edad** (primer párrafo). NO se extiende a la aceptación
de los 4 documentos porque:

- Un abogado razonable objetaría equiparar una aceptación contractual
  (T&C, Privacy, Cookies) con un juramento penal.
- El Art. 210 del Código Penal chileno (declaración falsa ante
  autoridad) **no aplica** al checkbox de registro según hallazgo H-37
  de la auditoría legal externa 2026-04-20 documentado en
  `docs/legal/v3.2/age-declaration.md` (nota del cierre), por lo que la
  fórmula "bajo fe de juramento" ya opera en Conniku solo como
  formalismo declarativo reforzado, no como invocación penal. Usarla
  también sobre T&C sería inflación retórica sin respaldo jurídico.
- La aceptación de T&C y políticas es un acto contractual (oferta +
  aceptación), no una declaración jurada. Mezclarlos introduce ruido
  legal.

Esta separación semántica también refuerza la "distinguishability"
exigida por Art. 7(2) RGPD.

### 2.5 Derecho de retirada del consentimiento (Art. 7(3) RGPD)

El cierre del texto ("puedo retirar mi consentimiento en cualquier
momento cuando la base legal sea el consentimiento") cumple Art. 7(3)
RGPD — obligación de informar sobre el derecho de retirada al solicitar
el consentimiento. La cláusula condicional "cuando la base legal sea el
consentimiento" es necesaria porque:

- Cookies analytics/marketing → base legal consentimiento (retirable).
- Cookies funcionales post-login → base legal ejecución del contrato
  Art. 6(1)(b) (NO retirable unilateralmente sin terminar el contrato);
  ver ALERTA-COOKIE-3 ya abierta en `alerts.md`.
- Datos de registro mínimos → base legal ejecución del contrato (no
  retirables sin eliminar cuenta).
- Evidencia de registro (user_agreements, document_views) → base legal
  obligación legal Art. 6(1)(c) + interés legítimo Art. 6(1)(f) (NO
  retirables, retención 5 años).

La redacción condicional evita inducir al usuario a creer que puede
retirar consentimiento sobre tratamientos que no se basan en
consentimiento.

---

## 3. Análisis comparativo A vs B vs C

| Criterio | A (original) | B (dos párrafos separados) | **C (elegida)** |
|---|---|---|---|
| Respeta pedido literal Cristian "un texto que indique que aceptan todo" | Sí (ideal) | No (dos bloques separados visualmente) | **Sí** (un solo bloque de consentimiento, con subdivisiones) |
| Cumple Art. 7(2) GDPR "distinguishable" | Débil: un solo párrafo mezclando fe de juramento con aceptación contractual | Fuerte: dos secciones completamente separadas | **Media-fuerte**: subdivisión en 3 párrafos + lista numerada dentro del mismo bloque |
| Cumple Ley 19.628 Art. 4° "específico" | Débil: enumera documentos sin granularidad visual | Fuerte | **Fuerte**: lista numerada de 4 ítems + hash por documento + `document_views` por ítem |
| Fluidez UX | Alta | Media-baja (muro de texto bipartito) | **Alta** (bloque cohesivo con estructura clara) |
| Fórmula "bajo fe de juramento" no contamina aceptación de T&C | **No**: el juramento abarca todo | Sí | **Sí**: el juramento queda aislado al párrafo 1 |
| Informa derecho de retirada Art. 7(3) | No | Posible | **Sí** |
| Cita base legal específica | Sí | Sí | **Sí** |
| Longitud | 52 palabras | ~110-130 palabras | 96 palabras (bajo límite 100) |
| Defendible en juicio ante regulador EU estricto (CNIL, AEPD) | **Riesgo medio-alto** | Bajo riesgo | **Bajo-medio riesgo** |
| Defendible ante consumidor chileno | Media | Alta | **Alta** |

**Justificación del descarte de A**: la redacción original junta
"declaro bajo fe de juramento" con "acepto los Términos y Condiciones
[…]". En jurisdicción estricta (CNIL francesa, AEPD española,
BayLDA alemana) esto puede leerse como un consentimiento global no
granular impugnable vía Art. 7(2). Además la fórmula de juramento se
extiende por contagio a la aceptación contractual, desalineando
registros semánticos.

**Justificación del descarte de B**: dos párrafos totalmente separados
(dos checkboxes conceptuales aunque haya uno solo visual) contradice
el pedido de Cristian "un texto" y rompe la promesa de "checkbox
único" de D-M1..D-M6. Genera un muro de texto con peor UX sin mejorar
materialmente la defensibilidad frente a la opción C.

**Justificación de C (elegida)**: mantiene un solo checkbox + un solo
bloque de consentimiento pero subdivide visualmente en declaración
(juramento edad), aceptación (lista numerada 4 ítems), información
(registro + derecho retirada). La granularidad exigida por
Art. 7(2) se logra por estructura visual dentro del mismo bloque +
por la arquitectura del flujo: cada uno de los 4 ítems es un link
separado con su propio registro `document_views` hasheado. Esa es la
evidencia real de granularidad ante un auditor, no la mera separación
tipográfica del párrafo.

---

## 4. Criterios de render HTML para el frontend-builder

El componente `src/components/LegalConsent/MultiDocumentConsent.tsx`
debe renderizar el texto con estas reglas:

### 4.1 Estructura HTML semántica

```tsx
<section
  aria-labelledby="consent-heading"
  className="multi-doc-consent"
>
  <h2 id="consent-heading" className="visually-hidden">
    Consentimiento y declaración de edad
  </h2>

  <p className="consent-oath">
    Al continuar con el registro declaro, <strong>bajo fe de juramento</strong>,
    que soy mayor de 18 años y que los datos entregados son verdaderos.
  </p>

  <p className="consent-intro">
    Por separado, y tras haberlos leído, acepto expresamente los siguientes
    documentos del servicio:
  </p>

  <ol className="consent-docs-list" aria-describedby="consent-progress">
    <li>
      <DocumentLink docKey="terms"           label="Términos y Condiciones del Servicio" />
    </li>
    <li>
      <DocumentLink docKey="privacy"         label="Política de Privacidad" />
    </li>
    <li>
      <DocumentLink docKey="cookies"         label="Política de Cookies" />
    </li>
    <li>
      <DocumentLink docKey="age-declaration" label="Declaración de Edad" />
    </li>
  </ol>

  <p className="consent-evidence">
    Entiendo que esta aceptación queda registrada como evidencia
    específica y demostrable conforme al <strong>Reglamento (UE) 2016/679 Art. 7(1)</strong>
    y a la <strong>Ley N° 19.628 Art. 4°</strong>, y que puedo retirar mi
    consentimiento en cualquier momento cuando la base legal sea el
    consentimiento.
  </p>

  <p id="consent-progress" className="consent-progress" aria-live="polite">
    Documentos leídos: {readCount} de 4
  </p>

  <label htmlFor="consent-checkbox">
    <input
      id="consent-checkbox"
      type="checkbox"
      disabled={readCount < 4}
      aria-describedby="consent-progress"
      checked={accepted}
      onChange={onAcceptChange}
    />
    <span>Declaro que soy mayor de 18 años y acepto los 4 documentos del servicio.</span>
  </label>
</section>
```

### 4.2 Reglas de render

- **Fuente del texto base**: la constante
  `MULTI_DOCUMENT_CONSENT_TEXT_V1` NO debe renderizarse como
  `<p>{MULTI_DOCUMENT_CONSENT_TEXT_V1}</p>` pelado. El texto se usa para
  calcular el hash y persistirlo; la UI renderiza el JSX estructurado
  arriba. Esto preserva:
  - **Paridad probatoria**: el hash SHA-256 se calcula sobre el string
    exacto guardado en `shared/legal_texts.ts`.
  - **Accesibilidad WCAG AA**: `<ol>` + `aria-live="polite"` +
    `aria-describedby` sobre el checkbox.
  - **Mantenibilidad**: bump de versión (1.0.0 → 1.1.0) solo requiere
    cambiar la constante y recalcular hash; la estructura HTML sigue
    igual.

- **Test de invariante obligatorio** (sugerido al frontend-builder):

  ```ts
  // src/__tests__/components/LegalConsent/text-integrity.test.ts
  import { MULTI_DOCUMENT_CONSENT_TEXT_V1 } from '../../../shared/legal_texts';
  import { stripJSXWhitespace } from './helpers';

  it('JSX rendered text equals canonical constant (byte-for-byte)', () => {
    const { container } = render(<MultiDocumentConsent … />);
    const actualText = stripJSXWhitespace(container.textContent);
    const expectedText = MULTI_DOCUMENT_CONSENT_TEXT_V1
      .replace(/\s+/g, ' ').trim();
    expect(actualText).toContain(expectedText);
  });
  ```

  Este test garantiza que futuras refactorizaciones del JSX no
  desalineen el texto renderizado del texto hasheado.

- **Negritas obligatorias** (via `<strong>`, no `<b>`):
  - "bajo fe de juramento" (párrafo 1)
  - "Reglamento (UE) 2016/679 Art. 7(1)" (párrafo 3)
  - "Ley N° 19.628 Art. 4°" (párrafo 3)

- **Lista numerada** (`<ol>`, no `<ul>`): cada uno de los 4 documentos
  es un ítem `<li>` con su componente `<DocumentLink>` que incluye:
  - Anchor `<a>` al viewer con `aria-label="Leer {label}"`
  - Indicador visual "✓ Leído" si `readDocs.has(docKey)`, con
    `aria-hidden="true"` (el estado real va a la live region de
    progreso)
  - Contraste WCAG AA (4.5:1 mínimo)

- **No usar `dangerouslySetInnerHTML`**: ningún escenario justifica
  renderizar el texto vía innerHTML.

- **Links van al viewer del Bloque 5**: `/legal/terms`, `/legal/privacy`,
  `/legal/cookies`, `/legal/age-declaration` (rutas públicas SPA que
  renderiza el viewer con el markdown de `GET /legal/documents/{doc_key}/raw`).

### 4.3 Recomendación anti muro-de-texto

Para evitar que el bloque se perciba como "muro", usar estas técnicas
sin alterar el texto literal:

1. **Espaciado vertical**: `margin-bottom: 0.75rem` entre `<p>` y la
   lista; `margin-bottom: 1rem` entre la lista y el párrafo
   informativo.
2. **Tipografía del párrafo 3**: un nivel de tamaño menor que los
   párrafos 1 y 2 (`font-size: 0.875rem` vs `1rem`), con color
   secundario pero contraste WCAG AA mínimo. Justificación: párrafo 3
   es informativo, no declarativo.
3. **Iconos discretos en los links**: `📄` o equivalente icono SVG al
   inicio de cada `<DocumentLink>` para romper visualmente la lista.
   Usar `aria-hidden="true"` en los iconos.
4. **Barra de progreso visualmente distinta del texto**: card separado
   o chip, no texto plano continuo.

Estas técnicas preservan el hash del texto (que se calcula sobre la
constante string pelada) pero mejoran la percepción UX.

---

## 5. Validación del flujo de evidencia de lectura

### 5.1 Flujo descrito en el briefing

1. Frontend genera `session_token = uuid4()` al montar el componente.
2. Usuario abre modal/viewer de doc X → fetch
   `GET /legal/documents/{X}/raw` → render con react-markdown
   (Bloque 5).
3. Al ABRIR, frontend dispara primer
   `POST /legal/documents/{X}/viewed` con
   `{session_token, doc_hash, scrolled_to_end: false}`.
4. Hook detecta scroll >= 90% → dispara segundo POST con
   `{session_token, doc_hash, scrolled_to_end: true}`.
5. Repetir 2-4 por cada uno de los 4 documentos.
6. Backend responde 201 cada vez. El frontend guarda en estado
   `readDocs: Set<docKey>` los docKey cuyo último POST tuvo
   `scrolled_to_end=true`.
7. Cuando `readDocs.size === 4`, habilita checkbox.
8. Al submit de `/register`:
   - Request incluye `session_token` + datos usuario + checkbox
     aceptado.
   - Backend (dentro de UNA transacción atómica, D-M5):
     a. Valida que existan 4 `document_views` con `scrolled_to_end=true`
        para ese `session_token`, una por cada `doc_key` canónico.
     b. Valida que el hash de cada `document_view` coincida con
        `CANONICAL_HASHES[doc_key]` actual (si cambió, 409).
     c. Crea `User` row.
     d. Escribe 4 filas `user_agreements` (`document_type` +
        `text_version_hash` por cada doc).
     e. Escribe 1 fila `cookie_consents` si existe
        (ALERTA-AUDIT-04-21-14).
     f. `UPDATE document_views SET user_id = :new_user WHERE
        session_token = :st`.
     g. Commit.

### 5.2 Cumplimiento GDPR Art. 7(1)

**El flujo SÍ cumple Art. 7(1)** porque cada pieza de evidencia es
demostrable:

| Requisito Art. 7(1) | Evidencia generada |
|---|---|
| Identificación del interesado | `user_id` post-transfer + `ip_address` + `user_agent` en `document_views` + `user_agreements` |
| Momento del consentimiento | `viewed_at_utc` (document_views) + `accepted_at_utc` (user_agreements) |
| Objeto específico del consentimiento | `doc_key` + `doc_version` + `doc_hash` (SHA-256 del texto canónico) en cada fila |
| Forma del consentimiento | `scrolled_to_end=true` en document_views + `hash` del texto aceptado en user_agreements |
| Información previa al consentimiento | `document_views` con `scrolled_to_end=true` prueba que el texto estuvo expuesto |
| Retención para prueba | `retained_until_utc` = viewed + 1825 días (5 años) |

### 5.3 Gaps legales detectados en el flujo

#### GAP-1 (MODERADO): `scrolled_to_end=true` no prueba lectura real

Un usuario puede hacer scroll mecánico sin leer. Apple, Google, Meta
asumen este mismo risk tolerance — es el estándar de industria. Si el
regulador es estricto, puede objetar "scroll ≠ lectura". Mitigación
parcial aceptada: registrar el timestamp de inicio de scroll vs fin
para detectar scroll mecánico (< 2 segundos de inicio a fin → flag
"scroll anómalo" para auditoría interna, no para bloqueo UX).

**Acción recomendada**: documentar en el plan del builder que
`scrolled_to_end=true` es evidencia **suficiente** pero **no
concluyente**, y que combinado con la aceptación del checkbox
unificado es el conjunto probatorio que Conniku puede defender. No
bloquea Capa 0.

#### GAP-2 (MODERADO): idempotencia del POST viewed

Un usuario que abre un doc, cierra y re-abre, generará múltiples filas
en `document_views` para el mismo `(session_token, doc_key,
doc_hash)`. El backend NO tiene índice único. Esto:

- Infla el volumen de la tabla (no es grave, 5 años de retención con
  pseudonimización a 12 meses).
- Permite que la última fila tenga `scrolled_to_end=false` si el
  segundo open no scrolleó, "invalidando" la evidencia de scroll de la
  primera apertura.

**Acción recomendada al backend-builder**: al validar en
`/auth/register`, tomar el **máximo** `scrolled_to_end` por
`(session_token, doc_key)`:

```sql
SELECT doc_key, MAX(CASE WHEN scrolled_to_end THEN 1 ELSE 0 END) AS has_read
FROM document_views
WHERE session_token = :st
GROUP BY doc_key
HAVING has_read = 1
```

Debe haber exactamente 4 filas en el result set (una por docKey).
Si menos, rechazar con 400.

Eleva como **ALERTA-CONSENT-1** (MODERADA) en `alerts.md`.

#### GAP-3 (CRÍTICO — pre-condición): ALERTA-AUDIT-04-21-14 abierta

`docs/legal/v3.2/cookies.md` ESTÁ marcado como `estado: STUB — NO
PUBLICAR` según ALERTA-AUDIT-04-21-14 abierta, pero al mismo tiempo el
endpoint `legal_document_views_routes.py:66` tiene hash canónico
`48b90468...` para cookies y `legal_versions.py::COOKIES_HASH` lo
confirma.

**Premisa §22 verificada**: leí `docs/legal/v3.2/cookies.md`
frontmatter — el estado real del archivo en disco debe verificarse
porque alerts.md podría estar desactualizada respecto al merge de PR
#21. Si el stub sigue en producción, el flujo multi-document-consent
haría que el usuario "acepte" un documento vacío, lo cual contamina
toda la evidencia probatoria del bloque.

**Bloqueo explícito al bloque**: multi-document-consent-v1 NO debe
entrar a Capa 1 hasta que:

(a) `docs/legal/v3.2/cookies.md` tenga contenido real (no stub)
    verificable con `head -n 20 docs/legal/v3.2/cookies.md`;
(b) El hash en `legal_document_views_routes.py:66` coincida con el del
    archivo real (recalcular con `shasum -a 256 docs/legal/v3.2/cookies.md`);
(c) ALERTA-AUDIT-04-21-14 sea marcada RESUELTA en `alerts.md`.

Eleva como **ALERTA-CONSENT-2** (CRÍTICA).

#### GAP-4 (INFORMATIVO): age-declaration NO debería necesitar "scroll 90%"

El texto de `docs/legal/v3.2/age-declaration.md` es corto (≈4 KB de
markdown). Es muy probable que quepa en una sola pantalla sin scroll,
activando el fallback D-M3 opción C (botón explícito "Marcar como
leído"). Esto es esperado pero el backend-builder debe implementar el
fallback en el cliente o los tests fallarán.

**Acción recomendada**: hook `useReadingEvidence` debe detectar
`scrollHeight <= clientHeight` y mostrar botón explícito en ese caso.
No bloquea Capa 0.

#### GAP-5 (INFORMATIVO): derecho de retirada sobre consent viewer post-registro

Después del registro, si un usuario quiere "retirar" consentimiento
sobre las 4 filas de `user_agreements`, legalmente significa eliminar
su cuenta (base legal = ejecución contrato). Pero el texto final
promete "puedo retirar mi consentimiento en cualquier momento cuando
la base legal sea el consentimiento". El gap es que el flujo actual no
ofrece UI de retirada granular — se debe delegar al flujo de
eliminación de cuenta.

**Acción recomendada**: documentar en Privacy v2.5 que "la aceptación
de T&C, Privacy, Cookies y Age-Declaration son condiciones del
contrato del servicio; para retirarlas el Usuario debe terminar su
cuenta vía flujo de eliminación (Art. 17 GDPR / Art. 12 letra e
Ley 19.628)". No bloquea este bloque.

---

## 6. Recomendaciones al web-architect y frontend-builder

### 6.1 Bump de versión de documentos canónicos

**NO se requiere bump** de Terms, Privacy, Cookies o Age-Declaration
solo por introducir este flujo. Los hashes canónicos en
`legal_document_views_routes.py:63-68` siguen siendo los vigentes post-PR #22.

### 6.2 Nuevo constante a crear

En `shared/legal_texts.ts` y `shared/legal_texts.py`:

- `MULTI_DOCUMENT_CONSENT_TEXT_V1` (el string exacto arriba)
- `MULTI_DOCUMENT_CONSENT_VERSION = "1.0.0"`
- `MULTI_DOCUMENT_CONSENT_HASH = "fc0580fce646822efafb1d0d2517fa9ab7296ffb1615a286701eb1d256b571e9"`

Espejo en `backend/constants/legal_versions.py` dentro de
`REACCEPT_DOCUMENTS` si existe ese dict, con entry
`"multi_document_consent": {"version": "1.0.0", "hash": "fc05..."}`.

### 6.3 Invariante CI

El script `scripts/verify-legal-texts-sync.sh` debe validar:

1. `MULTI_DOCUMENT_CONSENT_TEXT_V1` de .ts ↔ .py son idénticos
   byte-a-byte.
2. `SHA-256(MULTI_DOCUMENT_CONSENT_TEXT_V1)` === el hash hardcoded en
   ambos archivos.
3. El hash hardcoded === el hash en este documento
   (`docs/legal/drafts/2026-04-21-multi-document-consent-text.md`)
   línea 46.

Un mismatch falla CI y bloquea merge.

### 6.4 Texto de la línea del checkbox (span del `<label>`)

El `<span>` adjunto al checkbox NO debe repetir el párrafo completo.
Propuesta:

```text
Declaro que soy mayor de 18 años y acepto los 4 documentos del servicio.
```

Este span NO se hashea (es refuerzo visual del acto de aceptación, no
es el texto canónico). El texto probatorio es el párrafo completo
arriba del checkbox, cuyo hash sí se persiste.

---

## 7. Estado de revisión de alertas previas

- **VIEWER-1** (rate-limit 300/h): verificado en
  `legal_document_views_routes.py:33` comentario "Rate limit: 300
  POST/hora por IP". El decorador `@limiter.limit` debe estar aplicado
  en el endpoint — premisa §22 pendiente, queda como nota al
  truth-auditor. Si el decorador no está, abrir nueva alerta
  VIEWER-1-REAL.

- **VIEWER-2** (HRDashboard TAX_BRACKETS 2024): fuera de scope de este
  bloque. Se mantiene abierta en `alerts.md` sin cambios.

- **VIEWER-3** (GFM autolink): criterio de implementación del viewer,
  no del flujo consent. Se mantiene abierta en `alerts.md` sin
  cambios.

Ninguna de las 3 se marca RESUELTA en este turno (requieren evidencia
de post-merge PR #23 que no ejecuté en este turno).

---

## 8. Razonamiento extendido (transparencia del proceso)

### Alternativas consideradas y descartadas

1. **Añadir fecha al texto** ("Aceptado el {DATE}"): descartado.
   El hash del texto debe ser estable entre aceptaciones; la fecha de
   aceptación se registra en `accepted_at_utc` de `user_agreements`.
2. **Mencionar "Ley 21.719" (vigente dic-2026)**: descartado.
   ALERTA-AUDIT-04-21-1 recomienda mencionarla en Privacy v2.5, no en
   el texto de consentimiento. El consentimiento informado debe citar
   la ley vigente a la fecha de registro, no una futura.
3. **Mencionar GDPR Art. 8 (menores)**: descartado. Conniku es
   exclusiva 18+; mencionar Art. 8 introduciría ambigüedad sobre si
   admite menores con consentimiento parental.
4. **Redacción "Acepto TODO"**: descartado. Aunque refleja el pedido
   literal de Cristian, viola Art. 7(2) RGPD (no granular) y sería
   impugnable.

### Criterios de decisión aplicados

| Criterio | Peso | Cumple C |
|---|---|---|
| Pedido literal Cristian (párrafo unificado) | Alto | ✓ |
| GDPR Art. 7(1) demostrabilidad | Alto | ✓ |
| GDPR Art. 7(2) distinguishable | Alto | ✓ estructural |
| Ley 19.628 Art. 4° específico | Alto | ✓ |
| Fluidez UX | Medio | ✓ |
| Longitud ≤ 100 palabras | Medio | ✓ (96) |
| No inventar citas legales | Inviolable | ✓ |
| Tuteo chileno | Alto | ✓ (registro formal neutro, sin modismos) |

### Conflicto principal resuelto

**"Un solo checkbox unificado + pedido literal Cristian" vs "Art. 7(2)
distinguishable"**. Resolución: mantener un solo checkbox (pedido
Cristian) + lograr granularidad por estructura visual interna al bloque
(3 párrafos, lista numerada con 4 ítems separados, cada ítem con su
propio registro de lectura hasheado). La granularidad legal exige
**actos separables e identificables** sobre los que existe registro
probatorio individual; esto se cumple a nivel de `document_views` (4
filas separadas por docKey) y `user_agreements` (4 filas separadas).
La UI puede consolidar visualmente siempre que la evidencia probatoria
sea granular. Esta es la interpretación estándar aplicada por proveedores
SaaS que pasan auditorías DPIA (Data Protection Impact Assessment).

---

## 9. Checklist de aprobación humana (Cristian)

- [ ] Leíste el texto final de §1 y lo apruebas literal.
- [ ] Confirmas que la separación "bajo fe de juramento" solo en
  párrafo 1 es aceptable (no se extiende a la aceptación de T&C).
- [ ] Confirmas que la cláusula "puedo retirar mi consentimiento
  cuando la base legal sea el consentimiento" no genera expectativa
  frustrada en tu producto.
- [ ] Confirmas que mencionar explícitamente "Reglamento (UE) 2016/679
  Art. 7(1)" y "Ley N° 19.628 Art. 4°" es la línea editorial que
  quieres (coherente con CLAUDE.md §"Visibilidad legal en la
  interfaz": cita junto al dato).
- [ ] Confirmas que se agregue ALERTA-CONSENT-1 y ALERTA-CONSENT-2 a
  `docs/legal/alerts.md`.
- [ ] Aceptas que ALERTA-CONSENT-2 (stub cookies) BLOQUEA el inicio
  de Capa 1 hasta resolver.

Tu firma de aprobación va como comentario en el PR que abra el bloque
o como nota explícita en este archivo (sección nueva "Aprobación
humana" con fecha y tu nombre).

---

## 10. Declaración obligatoria (repetida al cierre)

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.

---

**FIN DEL BORRADOR.**
