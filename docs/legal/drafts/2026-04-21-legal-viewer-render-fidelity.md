---
documento: Criterios de render fiel para legal-viewer-v1
autor: legal-docs-keeper (Capa 0 bloque legal-viewer-v1)
fecha: 2026-04-21
estado: BORRADOR — requiere revisión humana Cristian antes de aprobar builder
ambito:
  - src/components/Legal/LegalDocumentRenderer.tsx (a construir)
  - src/legal/documentRegistry.ts (a construir)
  - src/__tests__/Legal/legal-sync.test.ts (a construir)
documentos_afectados:
  - docs/legal/v3.2/terms.md (hash 9a16122f...)
  - docs/legal/v3.2/privacy.md (hash 7a8ba81d...)
  - docs/legal/v3.2/cookies.md (hash 48b90468...)
  - docs/legal/v3.2/age-declaration.md (file hash 61dab2ec..., text hash ca527535...)
---

## Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere validación
de abogado antes de su aplicación al producto en producción.

---

## 1. Problema regulatorio de fondo

GDPR Art. 7(1): "Cuando el tratamiento se base en el consentimiento del
interesado, el responsable deberá ser capaz de demostrar que aquel consintió
el tratamiento de sus datos personales."

Conniku almacena en `cookie_consents.policy_hash` y en
`user_agreements.text_version_hash` el hash SHA-256 del documento tal como
existe en disco (o del texto canónico en el caso de `age-declaration`). Si el
contenido renderizado al usuario difiere aunque sea en un byte del contenido
firmado por hash, la prueba probatoria queda impugnable ante CNIL, AEPD o la
autoridad equivalente.

Esto NO exige que el HTML renderizado sea textualmente idéntico al markdown
fuente (eso es imposible: el markdown es un formato de autoría, no un
formato visual). Exige que:

- el TEXTO semántico mostrado al usuario sea el TEXTO semántico del markdown
  firmado, sin pérdida ni adición de cláusulas ni reformulaciones;
- el proceso de render sea determinista y reproducible (mismo input
  markdown → mismo output HTML);
- sea posible, en auditoría, demostrar que el texto firmado (markdown hash)
  equivale íntegramente al texto mostrado (HTML en el navegador).

Este documento define los criterios mecánicos para lograr esa equivalencia
con `react-markdown` + `remark-gfm` en el contexto de Conniku.

---

## 2. Plugins y opciones obligatorias para `react-markdown`

### 2.1 Plugins que DEBEN estar activos

**`remark-gfm`** (GitHub Flavored Markdown). Motivo: los 4 documentos
canónicos usan extensivamente:

- Tablas GFM (`cookies.md` §2.1, §2.2, §2.3, §2.4 contienen inventario en
  tablas con separadores `|`).
- Listas anidadas con `-` (presentes en los 4 documentos).
- Enlaces con sintaxis `[texto](url)` (masiva presencia en `privacy.md`,
  `terms.md`, `cookies.md`).
- Código inline con backticks (ejemplo: `cookies.md` línea 20 con
  `conniku.com`, línea 32 con `localStorage`).

Sin `remark-gfm` las tablas se renderizan como texto plano con barras y las
secciones de inventario de cookies serían ilegibles — lo que el usuario
firma por hash no se correspondería con lo que lee visualmente.

**`rehype-raw`** — NO usar. Motivación negativa: permite HTML embebido en
markdown. Los 4 documentos canónicos NO contienen HTML embebido
(verificado con grep en Capa 0). Habilitarlo abriría superficie XSS
innecesaria.

### 2.2 Sanitización

**`rehype-sanitize` con schema default de rehype-sanitize (alias
`defaultSchema`)**. Motivo: react-markdown 9+ ya no sanitiza por defecto;
es responsabilidad del integrador aplicar sanitización explícita.

Allowlist de tags REQUERIDA (schema mínimo):

```
p, br, strong, em, code, pre,
h1, h2, h3, h4, h5, h6,
ul, ol, li,
a (con href, rel, target),
table, thead, tbody, tr, th, td,
blockquote, hr,
del (para tachados GFM)
```

Tags BLOQUEADOS explícitamente:

```
script, style, iframe, object, embed, form, input, button,
svg (no hay SVG en markdown canónico),
img (no hay imágenes en markdown canónico; si en el futuro aparecen,
  requiere re-evaluación con dominios whitelisted)
```

Atributos BLOQUEADOS:

```
on* (handlers JS inline: onclick, onerror, etc.)
style (evita inyección visual)
id y class libres (solo `id` generado por remark en headings para anchors)
```

Atributos PERMITIDOS sólo en `<a>`:

```
href (sólo http://, https://, mailto:)
rel
target (el builder debe forzar target="_blank" rel="noopener noreferrer"
        para enlaces externos en componente custom)
```

### 2.3 Opciones de `react-markdown` (parser remark)

- `skipHtml={false}` NO es válido. Usar sanitización vía plugin, no vía
  skip.
- `linkTarget` NO usar. Manejar target en componente custom `a` del mapping
  `components={}`.
- `disallowedElements` NO es suficiente por sí solo; combina con rehype-sanitize.

### 2.4 Componentes custom recomendados

El builder debe mapear al menos estos componentes en `<ReactMarkdown components={{...}}>`:

- `a`: forzar `rel="noopener noreferrer"` y `target="_blank"` si href es
  externo (hostname ≠ conniku.com). Si href es interno (empieza con `/`)
  interceptar con `onNavigate` prop para SPA routing.
- `table`, `thead`, `tbody`, `tr`, `th`, `td`: aplicar clases CSS propias.
- `h1`-`h6`: generar id slug para ancla (ayuda a Bloque 7 scroll-evidence).
- `code`: preservar fuente monoespaciada.

---

## 3. Transformaciones NO aceptables (bloquean equivalencia semántica)

Las siguientes transformaciones, si están activas, ROMPEN la equivalencia
texto-firmado ↔ texto-mostrado y DEBEN bloquearse:

### 3.1 Normalización tipográfica

**Prohibido**: convertir comillas rectas `"` a comillas tipográficas `"` `"`,
apóstrofe `'` a `'`, `--` a em-dash `—`, `...` a elipsis `…`.

Motivo: el markdown firmado contiene comillas rectas (ASCII). Si el render
convierte a tipográficas, el HTML muestra caracteres Unicode distintos. Si
un auditor compara byte-a-byte tras copy-paste, difiere.

Plugin culpable típico: `remark-smartypants`. **NO instalar, NO usar.**

### 3.2 Normalización de whitespace

**Prohibido**: colapsar múltiples saltos de línea a uno solo, trim de
trailing spaces, normalización de tabs vs espacios.

Motivo: si `cookies.md` tiene doble salto como separador de párrafos y el
render lo colapsa, visualmente dos párrafos se funden; el usuario no ve la
separación semántica que está firmada.

Plugin culpable típico: ninguno por defecto en remark, pero precaución con
`remark-squeeze-paragraphs` o similares.

### 3.3 Conversión de emails y URLs en autolinks implícitos

**Prohibido**: que texto plano como `contacto@conniku.com` en medio de un
párrafo se convierta automáticamente en `<a href="mailto:...">`.

Motivo: el markdown canónico de `terms.md` y `privacy.md` menciona emails
como texto. Algunos (ej. `contacto@conniku.com` en §Contacto) están
formateados ya como `[contacto@conniku.com](mailto:contacto@conniku.com)`;
otros aparecen como texto plano en cláusulas. Forzar autolink cambia el
árbol HTML aunque el texto visible sea igual — pero además puede abrir
mailto:// no deseado en ciertos contextos.

Plugin culpable: `remark-gfm` tiene GFM autolinks que detectan
`www.example.com` sin sintaxis explícita. Esto SÍ es parte de GFM estándar
y los markdowns actuales no disparan esta conversión porque todos los
enlaces están escritos con sintaxis `[](url)`. Verificar en Capa 1 que
NINGÚN documento tenga URL "suelta" (sin sintaxis explícita) que pueda
auto-linkearse.

Opción del builder: desactivar GFM autolink literal con
`remark-gfm@plugin([{singleTilde: false, autolink: false}])` si la versión
del plugin lo permite. Alternativa: añadir test de regresión que detecte
URL-like strings sin sintaxis en el fuente y falle CI.

### 3.4 Reformateo de énfasis

**Prohibido**: cambiar `_italic_` a `*italic*` o viceversa en el árbol AST.

Motivo: el markdown firmado usa `**bold**` (verificado: `cookies.md` líneas
varias). Si el parser reescribe la sintaxis al serializar, aunque el HTML
resultante sea visualmente idéntico, cualquier pipeline que re-serialice
markdown rompería el hash.

Aplica sólo si el builder re-serializa markdown (no debería: el render es
terminal, no vuelve a markdown). Dejarlo declarado como no-hacer para
prevenir que un refactor futuro introduzca round-trip markdown ↔ AST ↔
markdown.

### 3.5 Remoción de frontmatter vs inclusión de frontmatter

**Regla**: el hash SHA-256 en `METADATA.yaml` se calcula sobre el ARCHIVO
ENTERO (incluyendo frontmatter YAML). El render al usuario NO debe mostrar
el frontmatter.

Por lo tanto:

- El hash se verifica sobre el contenido RAW del archivo (con frontmatter).
- El render extrae cuerpo sin frontmatter y lo muestra.
- El test `legal-sync.test.ts` debe hashear el archivo completo (con
  frontmatter) para comparar contra `METADATA.yaml`.
- La extracción de cuerpo (strip frontmatter) es una operación
  determinista: regex `/^---\n[\s\S]*?\n---\n/` removida al inicio, resto
  pasa a react-markdown.

Caso especial `age-declaration.md`: el archivo tiene hash
`61dab2ec...` (file). El texto legal firmado por los usuarios tiene hash
`ca527535...` (text_version_hash en `user_agreements`). El texto firmado
es el string exacto entre los dos separadores `---` del body, que coincide
byte-a-byte con `AGE_DECLARATION_TEXT_V1` en `shared/legal_texts.py`.

El render debe:

- Mostrar el contenido del body completo (incluye encabezado "Texto
  canónico del checkbox declarativo de edad (v1.0.0)", sección
  "Declaración obligatoria", sección "Texto canónico", las 5 cláusulas,
  y las "Notas de cumplimiento").
- NO mostrar el frontmatter.
- El hash para Bloque 7 evidencia de lectura debe ser el FILE HASH
  (`61dab2ec...`), porque eso es lo que el usuario "abrió" en el sentido
  de visualización de documento canónico. El text_version_hash
  (`ca527535...`) sigue siendo lo que se almacena en `user_agreements` al
  registrarse — eso es independiente y no cambia.

Esta distinción FILE_HASH vs TEXT_HASH debe quedar clarísima en
`documentRegistry.ts`: dos campos separados, documentados en JSDoc, sin
mezclar.

---

## 4. Recomendación al builder: test de equivalencia semántica

El test `legal-sync.test.ts` propuesto en el plan §3.4 verifica que el
SHA-256 del markdown en disco coincida con `METADATA.yaml`. Eso cubre el
flanco "alguien editó el .md pero no bumpeó el hash".

Recomiendo AGREGAR un segundo test `legal-render-fidelity.test.tsx` que:

1. Para cada `docKey` en {terms, privacy, cookies, age-declaration}:
   a. Cargar el markdown raw (con frontmatter).
   b. Calcular SHA-256 del raw.
   c. Verificar = hash en `METADATA.yaml`.
2. Renderizar `<LegalDocumentRenderer documentKey={docKey} />` con
   react-testing-library.
3. Extraer el texto visible (`container.textContent`).
4. Comparar con el markdown RAW sin frontmatter, aplicando una normalización
   mínima para el comparador (eliminar sintaxis markdown pura: `#`, `**`,
   `|`, `---`, backticks):
   - Normalizar: `markdownToPlainText(markdownBody)` vs
     `container.textContent.replace(/\s+/g, ' ').trim()`.
   - Ambos deben tener el mismo conjunto de oraciones (no necesariamente
     mismo whitespace).
5. Si la normalización detecta cláusulas faltantes (split por puntos:
   ninguna oración del markdown debe estar ausente en el render, y
   viceversa), fallar el test.

Esto NO es equivalencia byte-a-byte (imposible: markdown → HTML → texto
visible normaliza inevitablemente); es equivalencia SEMÁNTICA a nivel de
"todas las cláusulas firmadas están presentes en el render".

Criterio de PASS del test:

- Conjunto de oraciones del render = conjunto de oraciones del markdown
  (sin frontmatter), módulo whitespace.
- Sin cláusulas adicionales introducidas por el render.
- Sin cláusulas perdidas por sanitización o parsing.

Si el test detecta divergencia: bloquea CI. El builder debe diagnosticar
si es (a) un bug del markdown, (b) un bug del parser, (c) un plugin que
removió contenido, (d) un problema de sanitización demasiado agresiva.

### 4.1 Test adicional: hash stability

Segundo test `legal-hash-stability.test.ts`:

```
test('FILE_HASH constants en documentRegistry.ts coinciden con METADATA.yaml', () => {
  const registry = getRegistry();
  const metadata = parseYaml(readFile('docs/legal/v3.2/METADATA.yaml'));
  for (const docKey of ['terms', 'privacy', 'cookies', 'age-declaration']) {
    expect(registry[docKey].fileHash).toBe(metadata.documents[docKey].sha256);
  }
});

test('AGE_DECLARATION text_hash en documentRegistry coincide con shared/legal_texts', () => {
  expect(registry['age-declaration'].textHash).toBe(AGE_DECLARATION_HASH);
});
```

---

## 5. Resumen de criterios (checklist para builder)

El builder de `frontend-builder` debe confirmar ANTES de abrir PR:

- [ ] `react-markdown` v9+ instalado.
- [ ] `remark-gfm` instalado y activo (con GFM autolink deshabilitado si el
      plugin lo permite).
- [ ] `rehype-sanitize` instalado y activo con schema restrictivo descrito
      en §2.2.
- [ ] NO usar `rehype-raw`.
- [ ] NO usar `remark-smartypants` ni similares.
- [ ] NO usar `remark-squeeze-paragraphs` ni similares.
- [ ] Componente custom `a` intercepta enlaces externos con target=_blank
      rel=noopener noreferrer.
- [ ] Componente custom `a` intercepta enlaces internos con `onNavigate`.
- [ ] Frontmatter se extrae con regex determinista y NO se muestra al
      usuario.
- [ ] Para `age-declaration`: se expone FILE_HASH y TEXT_HASH por
      separado en registry; la evidencia de apertura del Bloque 7 usa
      FILE_HASH; el `user_agreements.text_version_hash` sigue usando
      TEXT_HASH (intocado por este bloque).
- [ ] Test `legal-sync.test.ts` pasa (hash raw markdown = METADATA.yaml).
- [ ] Test `legal-render-fidelity.test.tsx` pasa (cláusulas semánticamente
      equivalentes renderizadas).
- [ ] Test `legal-hash-stability.test.ts` pasa (registry = metadata).

---

## 6. Riesgos no cubiertos por este documento

- **R-X1** — Si el usuario tiene una extensión de navegador que modifica el
  DOM (ej. traductor automático Google Translate), el texto mostrado al
  usuario divergirá del firmado. Mitigación: no es problema del producto,
  pero Privacy §x debería mencionar "el contenido debe leerse en su idioma
  original". Fuera de scope de este bloque.
- **R-X2** — Si Vite falla importando `.md?raw` en build de Vercel (ver
  R-A3 del plan), el render queda vacío. Mitigación: Capa 1 builder debe
  verificar en `npx vite build` local antes de PR.
- **R-X3** — Si `METADATA.yaml` se edita pero no los archivos, los tests
  actuales pasan (hash coincide). Mitigación: ya cubierto por el pre-commit
  hook que debería recalcular hash cuando el archivo `.md` cambia. Si no
  existe tal hook, se recomienda agregarlo en iteración post-merge.

---

## 7. Declaración legal obligatoria

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.
