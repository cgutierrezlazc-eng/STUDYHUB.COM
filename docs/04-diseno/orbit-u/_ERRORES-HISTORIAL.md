# 📋 HISTORIAL DE ERRORES · Claude en este proyecto

> **Este archivo es de lectura obligatoria antes de ejecutar cualquier acción o escribir código.**
> Documenta los errores cometidos para no repetirlos. Cada error tiene un patrón que debo evitar.
> Última actualización: 2026-04-25

---

## ❌ ERROR 1 · INVENTAR / MENTIR / RELLENAR CON SUPOSICIONES

**Patrón general:** completar huecos con cosas que "parecen lógicas" en vez de preguntar o decir "no sé".

### Casos concretos

- **Logo en `conniku.html` ORBIT-U-V2.** El usuario pidió "logo oficial" + "halo". Inventé tamaño (78×78), posición del dot, valores de drop-shadow, animación `haloPulse` con duración 3.4s, gradient de halo con valores específicos. Nada de eso fue pedido — lo inventé yo.
- **Datos mock de onboarding.** Inventé "Universidad de Chile", "Ingeniería Civil Industrial", "Cristian García en leaderboard" etc. sin que se especifiquen. (Aunque el usuario autorizó datos mock, los puse sin confirmar plausibilidad.)
- **Lista de universidades chilenas.** Inventé los 20 nombres de universidades sin verificar que sean los correctos para autocomplete.
- **Lista de intereses (Diseño, Código, IA…).** Inventada por mí sin pedir.
- **THEMES array con 16 temas.** El usuario dijo "podemos usar 2 temas claro/oscuro navy" pero igual agregué 16.
- **Estructura de `ORBIT-U-V2/`.** Asumí que `pages/` y `shared/` son la estructura correcta sin preguntar.
- **Tarjetas de dispositivos** (Chrome, App Store, Google Play, QR placeholder) — todo el diseño visual lo inventé.
- **Mensajes de UI** (placeholders, hints, headings conversacionales): "¿Qué te apasiona estudiar?", "Cuéntanos tu vibe", "Lleva Conniku contigo", etc. Inventados.

### Cómo evitarlo

- Si no está especificado, **preguntar antes**.
- Si la respuesta es "lo que tú creas mejor", **proponer 2-3 opciones** en vez de elegir una sin avisar.
- Nunca afirmar que algo "es así" si no se vio en un archivo, comando o respuesta del usuario.

---

## ❌ ERROR 2 · AFIRMAR SIN VERIFICAR

**Patrón general:** decir "está hecho", "está cerrado", "ya no consume" sin haber comprobado.

### Casos concretos

- **"Los agentes están cerrados, no consumen tokens"** — lo dije varias veces cuando en realidad había procesos activos (`94807` corriendo con 68.7k tokens). El usuario tuvo que mandar captura de pantalla para que viera que mentí.
- **"Está limpio"** después de las primeras fases de borrado de logos — quedaba SVG residual y carpetas con "logo" en el nombre.
- **"Recarga con Cmd + Shift + R"** afirmando que el cambio iba a aplicarse, sin verificar primero que el archivo realmente tuviera el cambio que yo esperaba.

### Cómo evitarlo

- Antes de afirmar "X está hecho/cerrado/limpio", **ejecutar un comando que lo verifique** (`ps`, `grep`, `find`, `Read`).
- Si no se puede verificar, decir explícitamente: "no puedo confirmarlo desde aquí, ¿puedes verificarlo tú?".

---

## ❌ ERROR 3 · IDIOMA · USAR VOSEO ARGENTINO

**Patrón general:** usar "vos", "podés", "llevás", "contanos", "arrastrá", "elegí", "subí", "mirá", "estudiá", "capturá" cuando el usuario es chileno y pidió español neutral.

### Reincidencia 2026-04-25 · INACEPTABLE
- **"decime cuál"** usado en la propuesta de plan de bridging después de DOS reglas raíz explícitas en CLAUDE.md prohibiendo voseo. El usuario tuvo que recordármelo otra vez.
- Aprendizaje: agregada la **REGLA RAÍZ #3** en CLAUDE.md con lista negra explícita y protocolo de escaneo antes de enviar cualquier respuesta.

### Casos concretos (12 instancias corregidas iniciales)

| Argentino | Neutro |
|---|---|
| arrastrala / hacé click | arrástrala / haz clic |
| Buscá tu universidad | Busca tu universidad |
| Contanos tu vibe | Cuéntanos sobre ti |
| Podés cambiarlo | Puedes cambiarlo |
| Llevá Conniku | Lleva Conniku |
| estudiá donde quieras | estudia donde quieras |
| Capturá apuntes | Captura apuntes |
| Mirá cómo te van a ver | Así te verán |
| llevás | llevas |
| arrastrá o tocá | arrastra o toca |
| Elegí / subí | Elige / sube |
| seleccioná una imagen | selecciona una imagen |

### Cómo evitarlo

- Antes de escribir UI o respuestas, conjugar en **tercera persona del singular formal/informal latinoamericano** (`tú` no `vos`).
- Nunca usar imperativos terminados en `-á / -é / -í` (`mirá, comé, escribí`).
- Nunca anglicismos cuando hay equivalente: skip → omitir, click → clic, upload → subir.

---

## ❌ ERROR 4 · DESTRUIR SIN CONFIRMACIÓN EXPLÍCITA

**Patrón:** ejecutar acciones destructivas (borrado, mover archivos) cuando hay duda.

### Casos concretos

- **Borré `LOGO CONNIKU FINAL 25 ABRIL 26.zip`** después de yo mismo haber preguntado "¿lo borro o lo dejo?" sin esperar respuesta. El usuario después dijo que era el único que debía permanecer. No se pudo recuperar.
- **Reorganización inicial** de `_ARCHIVE/` — moví `perfil.html`, `perfil-social.html`, RESTORES sin pedir confirmación archivo por archivo.

### Cómo evitarlo

- **Listar lo que se va a borrar/mover** y esperar "sí, ejecuta" textual.
- Para acciones destructivas (`rm`, `mv` a archivo), preferir mover a `_TRASH-PROVISIONAL/` durante la sesión y eliminar definitivamente solo cuando el usuario confirme el día siguiente.
- Frases como "borrado hard" no autorizan saltarse confirmaciones individuales sobre archivos específicos que ya tenían advertencia.

---

## ❌ ERROR 5 · CAMBIOS VISUALES SIN VERIFICAR EFECTO

**Patrón:** aplicar `mix-blend-mode`, `opacity`, `position` sin probar y sin entender el sistema visual existente.

### Casos concretos

- **Index Nebula:** apliqué `mix-blend-mode: screen` al `#cvs` y rompió visualmente todo (sobreexposición). Tuve que retroceder dos veces.
- **`opacity: 0.55` en `#cvs`:** otra vuelta sin entender que el canvas ya acumulaba alpha y la mezcla daba colores raros.
- **SYS.READY position fixed bottom:14px:** el cambio en CSS sí se aplicó al archivo pero el usuario veía la versión cacheada — yo no había anticipado la cache y dije "está bien" antes de que recargara.

### Cómo evitarlo

- Antes de tocar visuales: **leer el sistema completo** (CSS + JS que pinta el canvas, no solo el selector que voy a tocar).
- Cambios pequeños y verificables, no múltiples a la vez.
- Anticipar problemas de cache y avisar de antemano: "Cmd+Shift+R obligatorio".

---

## ❌ ERROR 6 · CONFUSIÓN ENTRE ARCHIVOS

**Patrón:** trabajar sobre el archivo equivocado o asumir cuál es "el actual".

### Casos concretos

- **`pages/orbit-u.html`** — modifiqué este archivo asumiendo que era el "sistema solar" actual, pero era el formato antiguo phone-frame 480×940. El usuario tuvo que aclararlo.
- **`index.html` vs `landing.html`** — asumí cuál era cuál sin preguntar.
- **`perfil.html` vs `perfil-social.html` vs `perfil-social-v2.html`** — asumí v2 como el final cuando aún no estaba acordado oficialmente.

### Cómo evitarlo

- Antes de modificar un archivo, **verificar con el usuario que ese sea el correcto**.
- Cuando hay múltiples archivos con nombres similares, listar todos y pedir confirmación.

---

## ❌ ERROR 7 · GASTAR TOKENS DEL USUARIO POR PRISA

**Patrón:** lanzar agentes / hacer múltiples ediciones sin plan claro, generando re-trabajo.

### Casos concretos

- **2 agentes en paralelo** intentando crear `perfil-social-v2.html` (no paré uno y dejé al otro).
- **Múltiples ediciones del Nebula** (intensity 0.7 → 0.35, opacity 0.55 → 0.85, blend-mode → no, blend-mode → sí, etc.).
- **Crear archivos en V2 sin antes confirmar la estructura.**

### Cómo evitarlo

- Antes de delegar: ¿es realmente necesario un agente? ¿el usuario lo pidió o yo lo asumí?
- Si hay un agente corriendo y el usuario no respondió, no lanzar otro paralelo.
- Cambios visuales: **uno a la vez**, esperar feedback antes del siguiente.

---

## ❌ ERROR 8 · INTERPRETAR INSTRUCCIONES AMBIGUAS SIN PREGUNTAR

**Patrón:** dado un mensaje corto del usuario, asumir significado y ejecutar.

### Casos concretos

- **"borrado hard, todo todo eliminar"** — interpreté que incluía el zip `LOGO CONNIKU FINAL 25 ABRIL 26.zip` aunque YO mismo lo había marcado como excepción minutos antes. No esperé respuesta a mi propia pregunta.
- **"Conoce el universo Conniku, esta bien, pero - el logo esta mal"** — leí "el logo está mal" y empecé a inventar el reemplazo (78×78, halo verde, drop-shadow triple) sin pedir referencias visuales.
- **"haz que sea coherente con facegram"** — interpreté libremente cuáles elementos visuales replicar.

### Cómo evitarlo

- Preferir **una pregunta corta** a una ejecución larga sobre suposiciones.
- Nunca actuar sobre una pregunta que YO mismo hice si no la respondieron.

---

## 🛡️ PROTOCOLO OBLIGATORIO ANTES DE CADA ACCIÓN

Antes de ejecutar **cualquier** acción (escribir código, borrar archivo, ejecutar bash, lanzar agente):

1. **Leer este archivo completo** (`_ERRORES-HISTORIAL.md`).
2. **Revisar `CLAUDE.md`** para reglas raíz.
3. **Pregunta de chequeo silencioso a mí mismo:**
   - ¿Voy a inventar algo? → no lo hagas, pregunta.
   - ¿Voy a afirmar algo sin verificar? → verifica primero.
   - ¿Estoy usando español neutro? → revisa la conjugación.
   - ¿La acción es destructiva? → confirma con el usuario en línea separada antes.
   - ¿El archivo correcto es este? → confirma con el usuario.

Si en cualquier paso hay duda, **decir "no sé" o "necesito confirmar X"** en vez de proceder.

---

## 📚 REGISTROS PREVIOS DEL PROYECTO

Búsqueda exhaustiva en todo el proyecto para hallar errores documentados antes de esta sesión.
**Resultado:** No existían archivos de error consolidados previos. Lo que sí se encontró:

### Bug ya arreglado (sesión 24 abril 2026)

Fuente: `_CHECKPOINT-2026-04-24-SESSION.md`

> **Bug del click en `pages/conniku.html`:** el handler de click estaba en `engFace` (96px) y no se podía clickear bien por el área pequeña.
> **Fix aplicado:** handler movido a `engineBtn` (320px) y se agregó `pointer-events:none` a todos los decorativos del engine.

Lección: **antes de poner handlers de click, verificar que el área clickeable sea suficiente** y que elementos decorativos no roben el evento.

### TODOs pendientes (backend)

Fuente: `pages/onboarding.html` líneas 11-15 y 467

```
- Validar device fingerprint server-side
- Enforce 2-device max in DB
- Real upload of profile photo to storage
- University autocomplete from API
```

Estos NO son errores, son funcionalidad pendiente. No se ejecutan localmente; quedan para cuando exista backend (Supabase u otro).

### Búsquedas que NO dieron resultado

- No existen archivos `ERRORES.md`, `BUGS.md`, `FIXES.md`, `ISSUES.md` o equivalentes previos.
- No hay comentarios `FIXME`, `HACK`, `XXX`, `BUG` en el código.
- Los matches de la palabra "TODO" en `_CONCEPTOS/perfil-hex-brillo.html` y `CLAUDE DESIGN NEW/temas update/handoff/README.md` corresponden a la palabra "TODOS" en oraciones, no a marcadores de tareas.

**Si en el futuro aparecen registros de errores en otras carpetas/archivos, este documento debe ser actualizado.**

---

---

# 📚 REGISTROS DEL PROYECTO PRINCIPAL — `/Users/cristiang./CONNIKU/`

> **Nota de método.** Esta sección NO es un dump literal de los archivos originales.
> Es un índice estructurado con título, ruta, fecha y resumen de cada hallazgo encontrado.
> Los archivos originales siguen siendo la **fuente de verdad** y deben leerse cuando se necesite el detalle completo.
> No se inventa contenido aquí — todo lo que se afirma proviene de archivos verificados con `cat`, `grep`, `head`.

---

## A · REGISTRY DE ISSUES TÉCNICOS

Fuente: `/Users/cristiang./CONNIKU/docs/03-tecnico/registry-issues.md`

### Issues abiertos (deuda técnica pendiente)

| ID | Severidad | Archivo / componente | Resumen |
|---|---|---|---|
| RIS-001 | Media | `backend/auth_routes.py` | Rate limiting en memoria no persiste entre reinicios; no escala multi-instancia. Migrar a tabla `rate_limits` o Redis. |
| RIS-002 | Baja | `backend/migrations/` | 7 archivos `.sql` sin orden documentado, sin registro de cuáles ya corrieron por entorno. Adoptar Alembic. |
| RIS-003 | Media | múltiples páginas | 0 tests en Dashboard, Login, Register, Checkout, Subscription, Biblioteca, Messages, Courses, Jobs, Gamification, Calendar y 30+ más. |
| RIS-004 | Baja/Media | `@lexical/react` 0.21.0 → 0.43.0 | 22 versiones desactualizado. API drift y bugs no parchados. |
| RIS-005 | Baja/Alta | `HRDashboard.tsx` (9244 líneas), `UserProfile.tsx` (6099), `MiUniversidad.tsx` (5091) | Imposible testear/escalar/paralelizar. Bloque F refactorización post-lanzamiento. |
| RIS-006 | — | `backend/referral_routes.py:188`, `backend/social_routes.py:1312` | TODO/FIXME reales: IP blocking fraud detection + merge academic activity en feed. |

### Issues cerrados (con fix aplicado)

| ID | Cerrado | Fix |
|---|---|---|
| RIC-001 | 2026-04-22 | URL StudyHub hardcodeada en `yjsProvider.ts` → reemplazada por `VITE_API_URL` + fallback. |
| RIC-002 | 2026-04-22 | CORS de producción incluía `localhost` → `render.yaml` limpiado. |
| RIC-003 | 2026-04-22 | RUT empresa placeholder `77.XXX.XXX-X` → reemplazado por `78.395.702-7` en 15 ocurrencias. |
| RIC-004 | 2026-04-22 | Checkout recolectaba datos de tarjeta (violación PCI-DSS) → eliminado, redirige a MercadoPago/PayPal. |
| RIC-005 | 2026-04-22 | `PDFReader.tsx` bloqueaba tests de Biblioteca → `GlobalWorkerOptions.workerSrc` movido a `useEffect` (M8). |

---

## B · ARCHIVOS CONGELADOS (fixes ya aplicados, protegidos)

Fuente: `/Users/cristiang./CONNIKU/FROZEN.md`

Lista de **22 archivos** confirmados como funcionales por Cristian, cada uno con su fix documentado:

### Null-safety (2026-04-14)
- `Messages.tsx`, `Friends.tsx`, `Mentorship.tsx`, `GroupDocEditor.tsx`, `Dashboard.tsx`, `Communities.tsx`, `Conferences.tsx`, `UserProfile.tsx`, `Jobs.tsx`, `BibliotecaDocumentos.tsx` (rules-of-hooks fix).

### Pre-commit / CI (2026-04-14)
- `.husky/pre-commit` — fix lint-staged: ruff separado del stash.
- `package.json` — removido `backend/**/*.py` de lint-staged.
- `.gitignore` — regla para ignorar duplicados iCloud.

### Legal sync (2026-04-18)
- `shared/legal_texts.py`, `shared/legal_texts.ts` — fuente de verdad + espejo TS, hash SHA-256 sincronizado.
- `scripts/verify-legal-texts-sync.sh` — gate CI que bloquea merge si hashes divergen.

### Hardening (2026-04-19)
- `backend/workspaces_export.py` — whitelist dominios + blacklist RFC1918/link-local/loopback + HTTPS-only + timeout 5s + cap 5MB (anti-SSRF).
- `backend/workspaces_athena.py` — rate-limit + cuotas Free/Pro + integración Anthropic.

### Landing v3 (2026-04-20)
- `Landing.tsx`, `Landing.module.css`, `HeroSection.tsx`, `ProductSection.tsx`, `HowSection.tsx`, `PricingSection.tsx`, `AppSection.tsx`, `BusinessPanel.tsx`, `UnderConstruction.tsx`.
- `public/favicon.svg`, `docs/brand/LOGO-SPEC.md`.

### HR (2026-04-22)
- `HRDashboard.tsx` — 9 botones + rules-of-hooks + RUT corregido `78.395.702-7`.

---

## C · BLOQUES CERRADOS CON SUS HALLAZGOS RESUELTOS

Fuente: `/Users/cristiang./CONNIKU/BLOCKS.md`

| Bloque | Cierre | Hallazgos resueltos / errores arreglados |
|---|---|---|
| `bloque-1-auth-edad` | 2026-04-18 | Verificación de edad legal · 24/24 tests · CI gate hash sync Python↔TS · PR #4 |
| `bloque-2a-workspaces-fundacion` | 2026-04-18 | Workspaces fundación · WARN 83/100 code-reviewer · 7/14 gaps resueltos · PR #5 |
| `bloque-2b-workspaces-colaboracion` | 2026-04-18 | Yjs CRDT + chat + presence · 162/162 tests · 7 moderados fixeados · 3 CRÍTICOS gap-finder fixeados (docId prefix, userId guest, freeze collab_ws) |
| `bloque-2-workspaces-v1` | 2026-04-19 | Auditoría 68/100 → 85+/100 tras hardening · resueltos: C-1 V1 expuesto, C-2 FROZEN coverage, A-2 rubric upload MAX_SIZE+MIME, A-8 tests ExportModal+Toolbar, A-10 apiFetch timeout/401 · PR #10 |
| `bloque-hardening-quizzes-c3` | 2026-04-19 | Fix vulnerabilidad C3: cliente manipulaba `correctAnswer` y obtenía 100% · servidor ahora re-valida contra BD · PR #11 |
| `bloque-rollout-v3-ola-1` | 2026-04-20 | 30 páginas migradas a shell v3 · PCI-DSS C5 detectado · RUT placeholder C6 · UF/UTM/SIS divergencia C7 · documentos legales divergentes C9 |
| `bloque-legal-consolidation-v2` | 2026-04-21 | Legal v3.2 completo · cookie consent banner · re-aceptación gate · 18 datos legales verificados contra bcn.cl/sii.cl/dt.gob.cl · PR #21 |
| `bloque-legal-viewer-v1` | 2026-04-21 | LegalDocumentRenderer · resolvió BUG GDPR Art. 7(1) divergencia markdown↔render · fix BUG-02: rutas `/terminos`/`/privacidad` daban 404 · PR #23 |
| `bloque-multi-document-consent-v1` | 2026-04-21 | 4 modales legales + scroll 90% + checkbox WCAG AA · BUG integración scroll detectado y resuelto en misma sesión |

---

## D · AUDITORÍAS TÉCNICAS (34 archivos)

Carpeta: `/Users/cristiang./CONNIKU/docs/05-reportes/auditorias/`

Cada archivo es una auditoría completa. **Para detalle leer el archivo original.**

### 2026-04-17 (descubrimiento inicial)
| Archivo | Líneas | Tipo |
|---|---|---|
| `2026-04-17-2245-explore-inventario-total.md` | 301 | Inventario exhaustivo del código |
| `2026-04-17-2245-gap-finder-auditoria-estructural.md` | 168 | Auditoría estructural exhaustiva |
| `2026-04-17-2245-legal-docs-keeper-estado-legal-inicial.md` | 357 | Estado legal inicial (más extenso del lote) |
| `2026-04-17-2245-truth-auditor-cruce-declarado-vs-real.md` | 250 | Cruce CLAUDE.md declarado vs lo que existe en repo |

### 2026-04-18 (sub-bloques 2a/2b/2c/2d Workspaces — 5 capas por sub-bloque)
| Capa | 2a Workspaces | 2b Colaboración | 2c Athena | 2d Sub-features |
|---|---|---|---|---|
| 1 (backend) | — | `2b-colaboracion.md` 182 | `2c-athena.md` 89 | `2d7-export.md` 180 |
| 1 (frontend) | — | `2b-colaboracion.md` 152 | `2c-athena.md` 120 | `2d1-apa.md` 110, `2d3-katex.md` 135, `2d6-rubric.md` 137, `2d8-comments.md` 122 |
| 2 (code-reviewer adversarial) | `2a-workspaces.md` 150 | `2b-colaboracion.md` 110 | `2c-athena.md` 98 | — |
| 3 (truth-auditor) | `2a-workspaces.md` 119 | `2b-colaboracion.md` 180 | `2c-athena.md` 101 | — |
| 5 (gap-finder) | `2a-workspaces.md` 99 | `2b-colaboracion.md` 108 | `2c-athena.md` 73 (**3 CRÍTICOS bloqueantes**) | — |
| Legal docs keeper | — | — | `2c-athena.md` 232 | — |

Otros del 2026-04-18:
- `2026-04-18-analisis-design-handoff-landing.md` (583 líneas) — análisis viabilidad design handoff
- `2026-04-18-higiene-acciones-tori.md` (172 líneas) — log de acciones de higiene del agente Tori

### 2026-04-19 (Workspaces completo + hardening C1)
| Archivo | Líneas | Resumen |
|---|---|---|
| `2026-04-19-auditoria-workspaces-completa.md` | 192 | Auditoría completa post sub-bloques |
| `2026-04-19-capa-1-backend-builder-c1-hardening.md` | 175 | Hardening SSRF V1 |
| `2026-04-19-capa-2-code-reviewer-bloque2-v1.md` | 92 | Code review adversarial |
| `2026-04-19-capa-3-truth-auditor-bloque2-v1.md` | 112 | Truth audit |
| `2026-04-19-capa-3-truth-auditor-c1-hardening.md` | 103 | Truth audit hardening |
| `2026-04-19-capa-5-gap-finder-bloque2-v1.md` | 108 | Gap finder |
| `2026-04-19-capa-5-gap-finder-c1-hardening.md` | 1 | placeholder vacío |
| `2026-04-19-capa-legal-docs-keeper-2d7-export.md` | 503 | Capa legal sub-bloque 2d.7 export |

### 2026-04-21
| Archivo | Líneas | Resumen |
|---|---|---|
| `2026-04-21-capa-0-legal-cookies-v1.md` | 703 | Capa 0 legal del cookie-consent-banner-v1 |

---

## E · AUDITORÍAS LEGALES (7 archivos)

Carpeta: `/Users/cristiang./CONNIKU/docs/02-legal/auditorias/`

Todas del **2026-04-21 / 2026-04-22**, rama `bloque-sandbox-integrity-v1`.

| Archivo | Líneas | Hallazgos clave |
|---|---|---|
| `weekly-audit-2026-04-21.md` | 691 | Auditoría legal semanal · transversal 13 áreas (Ley 21.719, constantes laborales/tributarias 2026, GDPR/ePrivacy, Ley Karin, 40 horas, factura electrónica, PCI-DSS, propiedad intelectual) |
| `2026-04-22-claude-md-and-legal-docs-review.md` | 1075 | **21 hallazgos** (5 críticos, 10 moderados, 6 menores) en CLAUDE.md + docs/legal/v3.2/. Trigger: hallazgo C3 web-architect (Art. 55 CT mal citado en CLAUDE.md) |
| `2026-04-22-chile-labor-structural-check.md` | 925 | Audit estructural + citas jurídicas literales (divisores jornada parcial, indemnizaciones, gratificación, feriado, horas extra, APV, pensión alimentos) |
| `2026-04-22-chile-labor-constants-triple-check.md` | 607 | Triple-check de **15 constantes numéricas** laborales Chile con decimales exactos |
| `2026-04-22-gap-finder-nomina-transversal.md` | 715 | Inventario transversal de constantes nómina · 11 categorías |
| `2026-04-22-meta-process-conniku-params.md` | 628 | Meta-proceso y parámetros Conniku · items 28-35 · 4 hallazgos CRÍTICOS (incluye `HRDashboard.tsx usa 39842` viola regla "sin redondeos") |
| `2026-04-22-temporal-precision-bcn-alternative.md` | 590 | Auditoría temporal + precisión + rutas alternativas a bcn.cl + crons/tasks |

---

## F · AUDITORÍA EXTERNA · `_ARCHIVE-CONNIKU-2026/`

Fuente: `/Users/cristiang./Desktop/_ARCHIVE-CONNIKU-2026/CONIKU LEGAL/Auditoria_Claude.md`

Reporte estructurado machine-readable de **41 hallazgos** (`H-01` a `H-41`):
- **8 hallazgos CRITICAL** (`H-01` a `H-08`) — bloquean merge del PR #21
- **7 hallazgos HIGH** (`H-09` a `H-15`)
- **5 hallazgos** (`H-16` a `H-20`) — agrupados
- **15 hallazgos MEDIUM** (`H-21` a `H-35`)
- **6 hallazgos LOW** (`H-36` a `H-41`)

### CRITICAL ejemplificados

- **H-01 · DOMICILIO_RECTIFICATION** — 9 ocurrencias declaran "Santiago" como domicilio. Real: Antofagasta. Error de transcripción inicial. **Rectificación de error material**, no cambio de domicilio. Edits aplicados a `00_Terminos_MODAL` (líneas 4-5, 30, etc.) reemplazando `domicilio en Santiago de Chile` → `domicilio en Antofagasta, Chile`.
- **H-02** — Inconsistencia de versionado entre filename `3.1.0`, metadata `3.1.0` y texto interno declarado como `2.0`.
- **H-05** — `Canonico_Terminos_v3.1.0` solo contiene borrador de nueva cláusula §8 (exportación). NO es texto completo. Hash inválido.
- **H-06** — `Canonico_Privacidad_v2.3.0` es un diff incremental contra v2.1, no autocontenido.
- (H-03, H-04, H-07, H-08 documentados en el archivo original)

### Archivos auditados
- `00_Terminos_MODAL_Register_v3_1_0` — 22 págs, 49 artículos, 14 títulos
- `01_Terminos_y_Condiciones_v3_1_0` — términos públicos /terms (divergente del modal · ver H-17)
- `02_Politica_de_Privacidad_v2_3_0` — Privacy multijurisdiccional, 14 págs
- `03_Politica_de_Cookies_v1_0_0`
- `04_Eliminacion_de_Cuenta`
- `05_Canonico_Terminos_v3_1_0` (estructural issue H-05)
- `06_Canonico_Privacidad_v2_3_0` (estructural issue H-06)
- `07_Canonico_Cookies_v1_0_0` (autocontenido OK)
- `08_Canonico_Declaracion_Edad_v1_0_0` (OK)

### Hashes canónicos declarados (parcial)
```
terms_v3.1.0:        e3780c975df95ef48b07147940b406e6b3fa8d374aa466d2dd86a3dd8a85a98f
privacy_v2.3.0:      0f7e0a3dc287da20bbbeede903622e005782cb4d927c4d01ebe35d22c3fd591f
cookies_v1.0.0:      a00150297efa288b53bbd9a0c655e046a292d3cdefb04254b0b33c079022efd9
age_declaration_file: 90a0fc5887dab32463dcbdefda5ad501626b67e7a7525ffdae95c06ac57e1815
```

Post-remediación: `terms` y `privacy` quedan INVALID (van a cambiar por H-01, H-02, H-04, H-05, H-06). `cookies` y `age_declaration` siguen estables.

---

## G · TESTS ESPECÍFICOS DE BUG

Archivo: `/Users/cristiang./CONNIKU/src/__tests__/Legal/BUG-02-no-broken-links.test.ts`

Test creado para prevenir regresión de **BUG-02**: links a `/terminos` y `/privacidad` en `Login.tsx` y `Register.tsx` daban 404 — fix aplicado en `bloque-legal-viewer-v1`, rutas correctas son `/terms` y `/privacy`.

---

## H · OTROS REGISTROS DEL PROYECTO

| Archivo | Ruta | Contenido |
|---|---|---|
| `inventario-reset.txt` | raíz `/Users/cristiang./CONNIKU/` | Inventario del reset 2026-04-17 03:23 UTC: archivos `agent_*.md`, `*_agent.md`, markdowns en raíz tipo agente, contenido de `.claude/` |
| `MOBILE_RELEASE_GUIDE.md` | raíz | Guía de release móvil (no es registro de error) |
| `BLOCKS.md` | raíz | Registro histórico de bloques cerrados (ya catalogado en sección C) |
| `FROZEN.md` | raíz | Lista de archivos protegidos con sus fixes (ya catalogado en sección B) |
| `docs/03-tecnico/bloques/bloque-legal-v3.2-post-audit/` | dir | Documentos del bloque legal post-auditoría |
| `docs/05-reportes/sesiones/` | dir | Múltiples checkpoints de sesión y restauración (2026-04-18 a 2026-04-22) |
| `docs/archive/respaldo-auditoria-rota-candidates.md` | — | Rama `respaldo-auditoria-rota`: 275 archivos cambiados, +13.837/-68.420 líneas. **Merge directo destruiría páginas activas.** Lista de commits cherry-pick candidatos por área. |
| `.claude/agents/truth-auditor.md`, `auditor-triple.md`, `commands/audit.md` | dir | Configuración de los agentes auditores que generaron los reportes anteriores |
| `docs/05-reportes/metricas/auditor-triple-uses.log` | log | Métricas de uso del agente auditor-triple |

---

## I · MEMORIA LEGACY (`_ARCHIVE-CONNIKU-2026/memory/`)

| Archivo | Contenido |
|---|---|
| `MEMORY.md` | Índice de memoria — apunta a project_geogebra_workspaces |
| `project_geogebra_workspaces.md` | Recordatorio: implementar editor GeoGebra en módulo Workspaces con opción "Aplicar al documento" |

---

## 📌 NOTAS DE ACTUALIZACIÓN

Cuando se cometa un error nuevo, agregarlo en una sección numerada al final.
Nunca eliminar errores antiguos: la memoria del proyecto los necesita.

**Para ver el detalle completo de cualquier hallazgo arriba**, abrir el archivo original en su ruta. Esta tabla es solo el catálogo navegable; los archivos fuente son la única fuente de verdad.
