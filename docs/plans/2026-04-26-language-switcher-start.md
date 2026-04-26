# Plan — LanguageSwitcher persistente en `/start`

Fecha: 2026-04-26
Bloque: `language-switcher-start`
Agente planificador: web-architect (Tori)
Estado: BORRADOR — esperando aprobación de Cristian antes de invocar
frontend-builder.

---

## 1. Contexto

### 1.1 Petición original (cita literal)

> "Planifica un bloque pequeño: añadir un componente
> `LanguageSwitcher` persistente en la página `/start` de Conniku, para
> resolver el problema de que el usuario que selecciona el idioma
> equivocado durante el onboarding queda atrapado sin poder cambiarlo."

Cristian adjuntó en el mismo mensaje el contexto del código actual ya
verificado, las decisiones tomadas (visibilidad, idiomas, forma del
control, política TDD), los archivos a tocar, el criterio de terminado
con checklist, y los riesgos a abordar. Este plan respeta esos inputs
sin replantearlos.

### 1.2 Problema concreto

En `Start.tsx` el flujo de onboarding obliga a:

1. Click en engine (Start.tsx:440-456) → si no hay
   `conniku_language` ni `conniku_role` en localStorage, se entra al
   step `'language'`.
2. `handleSelectLang(code)` (Start.tsx:458-461) llama `setLang(code)` y
   acto seguido `setOnboarding('role')` — sin posibilidad de revisión.
3. Step `'role'` tiene botón "← Cambiar idioma" (Start.tsx:1273) que
   regresa a `'language'`. Bien.
4. Una vez que `handleSelectRole` corre (Start.tsx:463+), salta a
   `setModal('entrar' | 'student' | 'tutor' | 'general' | 'business')`
   y desde ahí YA NO HAY ningún control para volver al selector de
   idioma. El usuario que se equivocó al elegir idioma queda atrapado
   con la UI en otro idioma, sin recurso visible.

### 1.3 Archivos relevantes leídos

| Archivo | Líneas | Hallazgos clave |
|---|---|---|
| `src/pages/Start.tsx` | 2213 | Estados `onboarding` y `modal`. Array local `LANGUAGES` (es, en, pt, it, fr, de). Hook `useI18n()` provee `lang` y `setLang`. Wizard legal usa state `rfNombre`, `rfBirthDate`, `legalViewed`, `legalSessionToken` declarado en scope del componente Start. |
| `src/pages/Start.module.css` | 1342+ | `.modalOverlay` z-index **100** (línea 874), `.onboardOverlay` z-index **200** (línea 1189). El máximo z-index actual del archivo es 200. |
| `src/pages/Start.test.tsx` | 124 | 3 tests vigentes sobre POST /auth/login. Setup hace `localStorage.setItem('conniku_language', 'es')` + `'conniku_role', 'student'`, lo que evita el onboarding. Tests no asumen ausencia de switcher; basta que el switcher no rompa el modal `entrar` ni el botón "Entrar →". |
| `src/services/i18n.tsx` | 5669 | `useI18n()` expone `{ lang, setLang, t }`. Persistencia ya implementada (línea 5610): `localStorage.setItem('conniku_language', newLang)`. Las 6 traducciones existen en bloques separados (es @1880, en @3700, pt @4444, it @5286, fr @4777, de @5024). Patrón de keys: `'start.onboard.lang_title'` etc. Hay también un `LANGUAGES` exportado al final (línea 5628) con 40 idiomas que NO se usa aquí (decisión de Cristian). |

### 1.4 Componente legal

NO aplica trigger legal en este bloque. El switcher:
- No toca constantes legales (`backend/constants/*`)
- No modifica el wizard legal ni los hashes de docs
- No cambia la política de retención del campo `conniku_language`
- El localStorage `conniku_language` ya existe y ya se usa con el mismo
  `setLang` que invoca el step `'language'` del onboarding actual

Capa 0 legal-docs-keeper: no se invoca.

---

## 2. Decisiones (las pre-tomadas por Cristian, registradas como input;
las restantes resueltas con razonamiento)

### 2.1 Decisiones pre-tomadas por Cristian (input del bloque)

Estas se ejecutan tal cual, sin replanteo:

| # | Decisión | Valor |
|---|---|---|
| D1 | Visibilidad: VISIBLE en | step `'role'`, modal `entrar`, modal `student`, modal `tutor`, modal `general`, modal `business`, wizard legal embebido en modales de registro |
| D2 | Visibilidad: OCULTO en | step `'language'` (redundante con grid), pre-onboarding (engine pristine), post-reveal landing |
| D3 | Idiomas: 6 (`es`, `en`, `pt`, `it`, `fr`, `de`) con `label`/`sub`/`flags` reusados del array local de Start.tsx:26-38, pasados al componente por prop |
| D4 | Trigger pill `[🇮🇹 IT ▾]` ~64px ancho, `position: fixed; top: 16px; right: 16px` desktop / `top: 12px; right: 12px` móvil, fondo semi-transparente |
| D5 | Popup ~280px alineado derecha, grid 2×3 con cards estilo step `'language'` escalado |
| D6 | Cierre: click fuera, ESC, selección |
| D7 | Animación: fade+scale 120ms |
| D8 | Aria: `aria-label`, `aria-expanded`, `aria-haspopup="dialog"`, `role="dialog"` en popup |
| D9 | Keyboard nav: Tab/Shift+Tab cicla 6 cards, Enter/Space aplica selección, focus inicial en card del idioma actual, focus regresa al pill al cerrar |
| D10 | TDD: tests vitest jsdom de selección + open/close. NO testear keyboard nav ni focus management en jsdom (frágil) — verificación humana en Capa 6 |

### 2.2 Decisiones que resuelve el web-architect

#### D11 — z-index del switcher

**Alternativas consideradas:**

- (A) z-index 250: por encima de `.onboardOverlay` (200) y
  `.modalOverlay` (100), valor "redondo".
- (B) z-index 1000: valor "muy alto, no se va a chocar nunca".
- (C) z-index 300: margen mayor por si aparece otro overlay
  intermedio entre 200 y nuestro switcher.

**Decisión: (C) z-index 300.**

Razonamiento: el archivo actual usa escala 0/1/2/5/10/15/20/30/100/200.
La escala es escalonada, no continua. Un valor 250 estaría
inmediatamente sobre el 200 sin margen para futuros overlays
intermedios (ej: tooltip global, banner GDPR). 300 deja un colchón
limpio. Evitar 1000 porque rompe la convención de la escala usada en
el archivo y es señal de hack ("no sé qué z-index poner").

#### D12 — Naming de keys i18n

**Alternativas consideradas:**

- (A) Prefijo `start.langswitch.*` (queda agrupado con `start.*`,
  pero solo se usa en /start)
- (B) Prefijo `langswitch.*` (genérico, reutilizable si el componente
  se montara fuera de Start algún día)
- (C) Prefijo `common.langswitch.*` (familia "common")

**Decisión: (A) `start.langswitch.*`.**

Razonamiento: el componente nace ligado a /start y agrupar bajo
`start.*` mantiene coherencia con el resto de keys del módulo
(`start.onboard.*`, `start.modal.*`, `start.footer.*`). Si en el
futuro se reutiliza fuera de Start, refactorizar las keys es trivial
con find/replace. No anticipar reuso prematuro. Keys concretas:

- `start.langswitch.aria` → "Cambiar idioma"
- `start.langswitch.current` → "Idioma actual: {label}" (para
  `aria-label` extendido del trigger; opcional, si no se usa se omite
  pero se documenta en commit)
- `start.langswitch.title` → "Cambiar idioma" (heading visualmente
  oculto del popup `role="dialog"`)

Estas 3 keys deben existir EN LAS 6 TRADUCCIONES (`es`, `en`, `pt`,
`it`, `fr`, `de`). El fallback de `t()` cae a inglés y luego español,
pero D12.bis prohíbe depender de fallback: las 6 deben tener valor.

#### D13 — Acoplamiento del array LANGUAGES

**Alternativas consideradas:**

- (A) Pasar `LANGUAGES` por prop desde `Start.tsx` (decisión D3)
- (B) Importar el array directamente en `LanguageSwitcher.tsx`
  desde un módulo compartido
- (C) Hardcodear el array dentro del componente

**Decisión: (A) por prop.** Esta es la decisión de Cristian (D3), se
documenta acá solo para registrar el por qué arquitectónico: el
componente queda agnóstico de la lista, fácilmente testeable con un
array mock más corto en jsdom (ej: 2 idiomas), y si el día de mañana
otra página usa LanguageSwitcher con un set diferente (ej: solo
idiomas de UI, sin `de` ni `it`) no requiere refactor.

#### D14 — Estrategia de cierre del popup

**Alternativas consideradas:**

- (A) `useEffect` con listener `mousedown` en `document` que cierra
  si el target no está dentro del popup ni en el trigger (patrón
  estándar React)
- (B) Backdrop transparente full-screen que captura clicks (como hace
  `.modalOverlay`)
- (C) Capturar `onBlur` del popup

**Decisión: (A) listener document mousedown + ref check.**

Razonamiento: (B) backdrop bloquea visualmente toda la pantalla y rompe
la interacción con el modal de rol que está debajo (el usuario no podría
hacer click en otro botón del modal "para descartar el switcher"). (C)
`onBlur` es frágil con focus trampling de elementos hijos. (A) es el
patrón canónico, no introduce overlay visual, y es testeable en jsdom
con `fireEvent.mouseDown(document.body)`. Para el listener ESC: igual,
`useEffect` con `keydown` global filtrado por `event.key === 'Escape'`.

---

## 3. Archivos a tocar

### 3.1 Archivos nuevos

| Ruta | Propósito |
|---|---|
| `src/components/LanguageSwitcher.tsx` | Componente funcional. Props: `languages: Array<{code,label,sub,flags}>`, `currentLang: string`, `onChange: (code:string)=>void`, `className?: string`. Estado interno: `open: boolean`. Hooks: refs para trigger y popup, `useEffect` para listeners ESC y click-outside, `useEffect` para focus management al abrir/cerrar. |
| `src/components/LanguageSwitcher.module.css` | Estilos del trigger pill, popup, grid 2×3 de cards, animación fade+scale 120ms, media query móvil ≤ 480px que reduce el offset (12px) y reduce ancho del popup. z-index 300. |
| `src/components/LanguageSwitcher.test.tsx` | Tests vitest jsdom: (1) click trigger abre popup; (2) click en card llama `onChange(code)` y cierra popup; (3) ESC cierra sin llamar `onChange`; (4) click fuera cierra sin llamar `onChange`; (5) render inicial NO muestra popup; (6) trigger muestra el código del idioma actual en mayúsculas (ej "ES", "IT"). |

### 3.2 Archivos modificados

| Ruta | Cambio |
|---|---|
| `src/pages/Start.tsx` | (a) `import LanguageSwitcher from '../components/LanguageSwitcher'` (b) calcular flag boolean `showLangSwitcher = onboarding === 'role' \|\| modal !== null` (c) renderizar `{showLangSwitcher && <LanguageSwitcher languages={LANGUAGES} currentLang={lang} onChange={setLang} />}` ANTES del cierre `</div>` raíz (línea ~2213) — para que quede en el DOM al final y el `position: fixed` no compita con stacking de overlays. NO modificar el array `LANGUAGES` ni `handleSelectLang`. |
| `src/services/i18n.tsx` | Agregar las 3 keys `start.langswitch.aria`, `start.langswitch.current`, `start.langswitch.title` en CADA UNA de las 6 traducciones (es, en, pt, it, fr, de). Insertar contiguas a las keys `start.onboard.*` existentes para mantener orden lógico. NO crear traducciones para los otros 34 idiomas del array `ALL_LANG_CODES` porque el switcher solo expone 6 (decisión D3). |

### 3.3 Archivos NO tocados (declaración explícita)

- `src/pages/Start.module.css`: el switcher trae su propio module
  CSS, no se modifica el de Start.
- `src/types.ts`: el tipo `Language` ya existe y se sigue usando.
- `App.tsx`: el switcher se monta DENTRO de `Start.tsx`, no a nivel
  de routing global.
- Backend: ningún archivo backend.

---

## 4. Orden de implementación

1. **RED 1 — test componente aislado.** Crear
   `LanguageSwitcher.test.tsx` con los 6 tests de §3.1 fila 3.
   Ejecutar `npx vitest run LanguageSwitcher`. Debe fallar con
   "module not found" (componente aún no existe). Esa es la falla
   correcta.
2. **GREEN 1 — implementación mínima.** Crear
   `LanguageSwitcher.tsx` con la API mínima para que pasen los 6
   tests. No optimizar aún.
3. **REFACTOR 1.** Limpiar el componente: extraer constantes de
   timings, asegurar tipado estricto de props (no `any`), agregar
   comentario JSDoc del componente.
4. **GREEN 1.bis — estilos.** Crear
   `LanguageSwitcher.module.css` con los tokens visuales (D4–D7).
   Verificar visualmente con `npx vite` (no parte del TDD pero
   indispensable antes de continuar).
5. **GREEN 2 — i18n keys.** Agregar las 3 keys en las 6
   traducciones de `i18n.tsx`. Verificar con grep que las 18 entradas
   nuevas (3 × 6) están todas presentes.
6. **GREEN 3 — montaje en Start.tsx.** Importar y renderizar el
   componente con el flag `showLangSwitcher`. NO tocar ningún otro
   handler de Start.
7. **VERIFY — tests Start vigentes.** Ejecutar `npx vitest run
   Start.test`. Los 3 tests existentes deben seguir verdes (el
   switcher se monta cuando `modal === 'entrar'`, pero no
   intercepta los selectors `loginEmail` ni `Entrar →`).
8. **PRE-FLIGHT CI (§23).** Ejecutar la suite completa en orden:

   ```
   npx tsc --noEmit
   npx eslint src/
   npx vitest run
   npx vite build
   python3.11 -m pytest backend/ --tb=no -q
   python3.11 -m ruff check backend/
   ```

   Todos exit 0. Backend incluido aunque no se toca (regla §23.1).

9. **PRETTIER (§24).** `npx prettier --write` sobre los 3 archivos
   nuevos + Start.tsx + i18n.tsx antes de `git add`.

10. **Commit.** Mensaje: `feat(frontend): añadir LanguageSwitcher
    persistente en /start (#bloque-language-switcher-start)`.

11. **Capas 2–5 del protocolo de cierre de bloque.**
    - Capa 2 code-reviewer
    - Capa 3 truth-auditor
    - Capa 4 deploy a preview
    - Capa 5 gap-finder
    - Apertura de URL preview a Cristian para Capa 6.

---

## 5. Criterio de terminado (Capa 6 manual obligatoria)

Cristian verifica en URL de preview cada uno de los siguientes puntos
y marca el checkbox. La tarea NO se considera cerrada hasta que los
12 estén marcados.

- [ ] Tab cicla por las 6 cards en orden visual (es, en, pt, it, fr, de)
- [ ] Shift+Tab cicla en orden inverso
- [ ] Enter sobre card aplica `setLang` + cierra popup
- [ ] Space sobre card hace lo mismo
- [ ] Al abrir popup, el focus visible está en la card del idioma
      actualmente activo
- [ ] Al cerrar (ya sea por selección o por ESC), el focus vuelve al
      trigger pill
- [ ] ESC cierra el popup sin aplicar cambio
- [ ] Click fuera cierra sin aplicar cambio
- [ ] Switcher visible en: step `role` + modal `entrar` + modal
      `student` + modal `tutor` + modal `general` + modal `business`
      + wizard legal embebido
- [ ] Switcher OCULTO en: step `language` (redundante) + pre-onboarding
      (engine pristine, sin clicks aún)
- [ ] Cambio de idioma persiste tras refresh del navegador
      (verificar `localStorage.getItem('conniku_language')` en DevTools)
- [ ] Cambio de idioma mid-flow del wizard legal NO resetea
      `rfNombre`, `rfBirthDate`, ni `legalViewed` (probar: rellenar
      nombre y fecha de nacimiento, abrir 1 documento legal, cambiar
      idioma con el switcher, verificar que el nombre/fecha siguen
      escritos y el doc abierto sigue marcado como `legalViewed`)

---

## 6. Riesgos

### 6.1 Alto

Ninguno identificado. Bloque acotado, sin componente legal, sin
backend, sin migración.

### 6.2 Medio

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| **Re-render mid-wizard legal pierde state** | Baja | El state del wizard (`rfNombre`, `rfBirthDate`, `legalViewed`, `legalSessionToken`) vive en el scope de `Start.tsx`, NO en el subtree del modal. Cambiar `lang` provoca re-render por nuevo valor del context, pero los `useState` de Start no se reinicializan porque la identidad del componente Start no cambia. Verificación humana obligatoria en Capa 6 (último checkbox de §5). |
| **z-index del switcher tapa el modal de rol cuando este abre dropdown nativo (ej: `<select>` de universidad)** | Media | Los `<select>` nativos del navegador siempre se renderizan en una capa propia del navegador (popup nativo), por encima de cualquier z-index CSS. No hay conflicto. Verificación: abrir modal `student`, hacer click en select de universidad, confirmar que el dropdown nativo aparece encima del switcher. |
| **Mobile viewport <360px corta el popup** | Media | Decisión: en `@media (max-width: 480px)` el popup baja a `width: calc(100vw - 24px)` y `right: 12px`. Cabrá en 320px (iPhone SE legacy). Verificación humana en Capa 6 con DevTools responsive 320px. |
| **Tests Start.tsx fallan** | Baja | El switcher se monta cuando `modal === 'entrar'`. El tests usa `screen.getByText(/Entrar →/)` que es ÚNICO en el modal. El trigger del switcher muestra `IT`, `ES`, etc. — no colisiona con el botón. Verificación: paso 7 del orden de implementación. |

### 6.3 Bajo

| Riesgo | Mitigación |
|---|---|
| Animación fade+scale 120ms se siente abrupta | Tweak puramente visual en Capa 6 si Cristian lo señala. No bloqueante. |
| Pill desktop 16/16 vs móvil 12/12 colisiona con notch en iOS | El switcher está en `top` no `bottom`; el notch está en top pero `top: 16px` ya deja margen. Capa 6 con simulador iOS si Cristian lo solicita. |
| Falta key `start.langswitch.*` en alguno de los 6 idiomas → fallback inglés | Riesgo 4 explícito de la petición. Mitigación: paso 5 del orden incluye verificación con grep de las 18 entradas nuevas (3 × 6). Test adicional sugerido: snapshot de las 6 traducciones con grep en pre-flight. |

---

## 7. Fuera de scope

Estas cosas NO se hacen en este bloque y se difieren explícitamente:

- **LanguageSwitcher fuera de /start.** Si en el futuro se quiere
  exponer en la app autenticada (CEO, HR, etc.), eso es bloque
  separado. El componente queda preparado (props agnósticas) pero no
  se monta en otras páginas.
- **Expandir a 40 idiomas.** Sólo los 6 del array local de Start. El
  array completo de `i18n.tsx` (40 idiomas) sigue siendo el set
  global, pero el switcher no los expone.
- **Detección automática de idioma del navegador en mid-flow.** Solo
  selección manual. La detección automática ya ocurre en
  `detectBrowserLanguage` (i18n.tsx:5595) al primer load.
- **Persistencia server-side del idioma seleccionado.** localStorage
  basta. Si el usuario logueado quiere idioma sincronizado entre
  dispositivos, eso requiere endpoint backend `PATCH /me/preferences`
  que es otro bloque.
- **Refactor del array `LANGUAGES` exportado de `i18n.tsx`** (el de
  40 idiomas con flags 🇪🇸 🇺🇸 etc.). Está acoplado a otras pantallas;
  no se toca.
- **Cambiar el step `'language'` del onboarding** para reusar el
  componente nuevo. Sería una refactorización tentadora pero rompe
  el flow visual del onboarding (grid grande full-screen vs pill
  compacta). Se mantiene tal cual.
- **Animación de transición de strings al cambiar idioma** (ej: fade
  out / fade in del texto). Cambio instantáneo. Mejora visual
  diferida.

---

## 8. Componente legal

NO aplica. Este bloque no toca:

- Constantes en `backend/constants/*`
- Hashes de documentos legales (`AGE_DECLARATION_TEXT_HASH`,
  `CANONICAL_DOC_HASHES`)
- Wizard legal en sí (sólo se monta el switcher EN PARALELO al
  wizard, sin modificar su lógica)
- Política de retención de `conniku_language`
- Texto legal mostrado al usuario

`legal-docs-keeper` no se invoca. Capa 0 legal omitida.

---

## 9. Notas operativas para frontend-builder

- Modelo recomendado: Sonnet (no requiere razonamiento extendido).
- TDD obligatorio (§ TDD del CLAUDE.md). Ciclo RED → GREEN → REFACTOR
  por cada test. NO escribir el componente entero antes del primer
  test.
- Pre-flight CI completo antes del push (§23). Backend incluido
  aunque no se toca.
- Prettier proactivo antes de `git add` (§24).
- Cita literal en commit body del bloque y del PR.
- Si durante la implementación surge decisión de producto no prevista,
  registrar en `docs/decisiones-pendientes.md` (§21) y continuar con
  alternativa más reversible. NO interrumpir a Cristian mid-flow.

---

## 10. Estado del plan

- Versión: 1.0 (borrador)
- Esperando: aprobación explícita de Cristian para invocar
  frontend-builder.
- Próximo paso si aprobado: builder ejecuta orden de §4 paso por paso.
