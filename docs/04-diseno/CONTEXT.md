# CONTEXT · Archivo de trabajo personal de Tori

**Carpeta exclusiva**: `/Users/cristiang./Desktop/CONNIKU UPDATE DISENO/LEER/`
**Última actualización**: 2026-04-19 (cierre tras aplicar pase de personas + logo oficial corregido en los 36 HTMLs + fotos reales depositadas)
**Propósito**: No perder contexto entre sesiones. Reconstruir estado completo si esta sesión termina.

---

## 1 · Ubicación de trabajo (crítica)

| Carpeta | Ruta absoluta | Uso |
|---------|---------------|-----|
| Raíz de trabajo | `/Users/cristiang./Desktop/CONNIKU UPDATE DISENO/` | Única carpeta donde trabajo el diseño |
| `Diseno/` | `.../CONNIKU UPDATE DISENO/Diseno/` | HTMLs finales para Cristian (visualización + publicidad) |
| `Instrucciones/` | `.../CONNIKU UPDATE DISENO/Instrucciones/` | Archivos Claude Code estricto para el otro dev (handoff técnico) |
| `Referencia/` | `.../CONNIKU UPDATE DISENO/Referencia/` | Documentos que Cristian deposita · leer solo cuando él lo indique |
| `LEER/` | `.../CONNIKU UPDATE DISENO/LEER/` | Mi carpeta personal · contexto + logs iterativos por módulo |

**Regla absoluta**: JAMÁS trabajo en otra ubicación. Si abro sesión y el CWD no es esta ruta, detener y avisar antes de tocar nada.

**Primera acción de cada sesión**: `pwd` + leer este CONTEXT.md completo.

---

## 2 · Protocolo de trabajo acordado (5 fases)

### Fase 0 · Antes de comenzar cualquier módulo
- Confirmar que estoy en la carpeta correcta
- Leer `LEER/CONTEXT.md` completo para recuperar estado
- Crear `LEER/log-{slug-modulo}.md` para empezar bitácora iterativa (solo si es módulo nuevo)

### Fase 1 · Durante el trabajo iterativo
- Itero el módulo visualmente contigo (archivo temporal o espacio de trabajo · NO en `Diseno/` ni `Instrucciones/`)
- Documento cada cambio en `LEER/log-{slug-modulo}.md`
- Lenguaje Claude Code estricto solo aplica cuando el módulo cierra; durante iteración puedo usar comentarios humanos para tracking

### Fase 2 · Detección de producto final
- Cuando yo perciba que el módulo está listo, pregunto explícitamente:
  > "¿Este es el producto final del módulo [nombre]?"
- NO paso a carpetas oficiales por iniciativa propia

### Fase 3 · Al confirmar producto final
- Tomo SOLO la versión final, sin historia, sin "antes era X"
- HTML(s) limpios → `Diseno/NN-slug-YYYYMMDD-HHMM-device.html` (5 por módulo de pantalla) · o `00-slug.html` si es transversal
- MD Claude Code estricto → `Instrucciones/NN-slug-YYYYMMDD-HHMM.md` (1 por módulo)
- Actualizo `Instrucciones/00-CONNECTIONS-MAP.md` con entrada del módulo nuevo
- Registro cierre en este CONTEXT.md bajo § "Módulos cerrados"

### Fase 4 · Siguiente módulo
- Repetimos el ciclo

---

## 3 · Reglas de comportamiento (inviolables)

1. **Cero iniciativa propia** · tú instruyes, yo sigo · si quiero proponer algo, propongo · no ejecuto sin aprobación
2. Una pregunta a la vez cuando tú lo pidas · no paso a la siguiente hasta que cierre la actual
3. Nunca asumir · si es ambiguo, pregunto antes
4. Nunca mentir · si algo falla o no lo sé, lo digo directo
5. No tomo decisiones estructurales · solo ejecuto lo acordado
6. **No toco documentación del proyecto real** (CLAUDE.md, memoria, reglas, hooks · todo fuera de `CONNIKU UPDATE DISENO/`)
7. No creo caos · si una acción puede afectar algo que funciona, aviso antes
8. Recomendaciones se proponen, no se ejecutan sin OK
9. Todo lo que escribo en `Instrucciones/` va en formato Claude Code estricto
10. Conexiones (links, endpoints) solo se documentan si Cristian las indica · nunca invento
11. Personas en mockups solo desde `00-PEOPLE-AUTHORIZED.md` · nunca inventar

---

## 4 · Decisiones cerradas del protocolo (2026-04-19)

Todas las decisiones de protocolo tomadas en la sesión "ordenar la casa":

### 4.1 Nomenclatura en `Diseno/`

```
Activo transversal:    00-[nombre].html                                 (sin fecha · sin device)
Módulo de pantalla:    NN-[slug]-YYYYMMDD-HHMM-[device].html            (5 archivos · uno por dispositivo)
```

Dispositivos (sufijos obligatorios para módulos de pantalla):
```
-web       Desktop browsers
-android   Android phone
-iphone    iPhone (con safe areas notch + home indicator)
-tablet    Android tablet
-ipad      iPad (iOS conventions)
```

### 4.2 Nomenclatura en `Instrucciones/`

```
Transversal doc:       00-[NAME].md                                    (convención libre · mi criterio Claude)
Módulo spec:           NN-[slug]-YYYYMMDD-HHMM.md                      (mismo slug y fecha que su HTML)
```

Archivos `00-*` existentes:
- `00-README.md` · puerta de entrada del paquete
- `00-STACK.md` · stack técnico completo (React 18 + Vite + TS + FastAPI + etc.)
- `00-RULES-GLOBAL.md` · reglas transversales del proyecto
- `00-BRAND-LOGO.md` · spec del logo oficial
- `00-PEOPLE-AUTHORIZED.md` · catálogo de 7 personas autorizadas
- `00-CONNECTIONS-MAP.md` · mapa de conexiones entre módulos

### 4.3 Formato de fecha/hora

```
YYYYMMDD-HHMM
Example: 20260419-1745  =  19 April 2026, 17:45
```

Ordenable alfabéticamente · sin ambigüedad locale · 24h.

### 4.4 Módulos multi-HTML

```
DECISIÓN RESUELTA (2026-04-19 · primer caso: módulo 02 landing):
  - Prefijo de módulo compartido ("02-") + slug + timestamp único compartido
  - Ejemplo: módulo 02 = 1 master + 11 sub-módulos con nombres "02-landing-...", "02-auth-...", etc.
  - Todos con el mismo timestamp de cierre
  - Bajo Opción A: 1 HTML por sub-módulo durante iteración · expansión a 5-device al cierre final
```

Primer caso aplicado al módulo 02 (landing + 11 sub-módulos):
- `02-landing-YYYYMMDD-HHMM.html` (master)
- `02-auth-YYYYMMDD-HHMM.html`
- `02-verificacion-YYYYMMDD-HHMM.html`
- `02-business-{personas|contabilidad|trabajo|...}-YYYYMMDD-HHMM.html` × 9

### 4.5 Updates a módulos cerrados

```
DECISIÓN: reemplazo directo · una sola versión viva
```

Si un módulo cerrado necesita actualización:
1. Borrar archivos HTML + MD con timestamp viejo
2. Crear nuevos con timestamp actualizado
3. Actualizar `00-CONNECTIONS-MAP.md` si cambia algo estructural
4. Registrar el update en este CONTEXT.md (sección "Módulos cerrados")
5. El historial detallado vive en `LEER/log-{slug}.md`, no en `Diseno/`

No existen carpetas `_archive`, `_deprecated`, `_drafts` en ningún lado.

### 4.6 HTML autocontenido

```
ALLOWED externally (1 excepción):
  - Google Fonts via <link rel="stylesheet">

INLINE obligatorio:
  - CSS en <style>
  - JS en <script>
  - SVG inline (incluido el logo)
  - Imágenes: base64 embedded O SVG placeholder (ver 00-PEOPLE-AUTHORIZED.md)

FORBIDDEN:
  - Archivos CSS externos
  - Archivos JS externos
  - Imágenes vía rutas relativas a carpetas externas
```

### 4.7 Assets de personas

```
Fotos reales: TODAS PENDING · Cristian deposita manualmente cuando tenga listas
Placeholder transitorio: SVG inline con iniciales + color del catálogo (ver 00-PEOPLE-AUTHORIZED.md PEOPLE.05)
```

### 4.8 Stack técnico (para Instrucciones/)

```
Stack recibido completo de Cristian · guardado en Instrucciones/00-STACK.md
Opción A aplicada: código específico React 18 + TypeScript + Vite + CSS variables
                   en los MDs · listo para copiar-pegar por el otro Claude
```

### 4.9 Referencia/

```
Ignorar por defecto · solo leer archivos específicos que Cristian indique
antes de arrancar un módulo ("antes de arrancar módulo X, revisa archivos A, B, C")
```

### 4.10 Precedencia de reglas

```
00-RULES-GLOBAL  >  00-BRAND-LOGO  >  NN-módulo-específico
```

Si una regla específica de módulo contradice una regla global, la global gana.

---

## 5 · Formato Claude Code estricto (resumen)

Para archivos `Instrucciones/*.md`:

- **Paths absolutos** · no relativos ambiguos
- **Coordenadas exactas** (`x=50, y=71`) · no descripciones
- **Tablas con valores**, no prosa
- **Bloques de código** con lenguaje marcado (```svg, ```html, ```css, ```tsx, ```sql, ```bash, ```yaml)
- **Schemas** TypeScript / JSON / SQL / Pydantic
- **Reglas explícitas** `IF condition THEN action`
- **Checklists** `- [ ]` y `- [!]` (crítico)
- **Sin adjetivos decorativos** · sin storytelling · sin "aproximadamente" · sin "debería"
- **Sin referencias** a versiones anteriores, legacy, deprecado

---

## 6 · Logo oficial único (inviolable · resumen)

Paleta de 4 colores:
- `--ink` `#0D0F10` · texto principal · "u" del logo · texto sobre paper
- `--lime` `#D9FF3A` · tile del u-pack (exclusivo del logo)
- `--orange` `#FF4A1C` · punto final "." (exclusivo del logo)
- `--paper` `#F5F4EF` · fondo warm paper · texto sobre ink

App icon geometría exacta:
- Canvas 100×100, rx=22 (22%)
- `u`: x=50, y=71, font-size=84, fill=#0D0F10
- Punto: cx=77, cy=68, r=6, fill=#FF4A1C

**Regla inviolable**: la `u` es SIEMPRE `#0D0F10` (ink), sin excepción, en cualquier fondo.

Spec completo en `Instrucciones/00-BRAND-LOGO.md`.

---

## 7 · Personas autorizadas (7)

| # | Nombre real | Perfil ficticio (para mockups) | Foto status |
|---|-------------|--------------------------------|-------------|
| 01 | Jennifer Ruiz Babin | USS · Ing. Gestión Logística | pendiente |
| 02 | Victoria Navarro Pacheco | U del Alba · Ing. Comercial | pendiente |
| 03 | Daniela Maturana | U del Alba · Ing. Comercial | pendiente |
| 04 | Felipe Gatica | U del Alba · Ing. Comercial (foto B&N) | pendiente |
| 05 | Cristian Gutiérrez | U del Alba · Ing. Comercial (NO CEO en mockups) | pendiente |
| 06 | Pia Cisterna | U del Alba · Ing. Comercial | pendiente |
| 07 | Barbara Escalona | U del Alba · Ing. Comercial | pendiente |

Catálogo completo con colores de placeholder SVG en `Instrucciones/00-PEOPLE-AUTHORIZED.md`.

---

## 8 · Errores pasados reconocidos (lecciones)

### Error 1 · Trabajé en worktree sin detectarlo
- Claude Code me inició en `.claude/worktrees/...` y no noté que no era el proyecto principal
- **Lección**: primera acción de cada sesión es `pwd` + confirmar

### Error 2 · Inventé nomenclatura propia (`-v2`)
- El proyecto principal usaba `_FINAL.html`, yo inventé `-v2.html`
- **Lección**: respetar convención del usuario, no inventar

### Error 3 · Ejecuté sin autorización explícita
- Después de acordar un flujo nuevo, reescribí un archivo en el mismo turno sin permiso
- **Lección**: cero acción sin autorización directa, aunque el contexto parezca autorizar

### Error 4 · Propuse cambios a documentación del proyecto
- Sugerí modificar CLAUDE.md, memoria, hooks del proyecto principal
- **Lección**: no toco nada fuera de `CONNIKU UPDATE DISENO/`

### Error 5 · Mezclé rol real con rol ficticio
- Cristian me dijo "ponme como estudiante también" · yo interpreté que quería cambiar su rol REAL
- Lo correcto: separar rol real (CEO, en CLAUDE.md) de rol ficticio (avatar estudiante, en PEOPLE-AUTHORIZED)
- **Lección**: separación estricta entre dato biográfico real y contenido de mockup

### Error 6 · Perdí contexto entre sesiones
- Cristian me daba información y la olvidaba minutos después
- **Lección**: mantener CONTEXT.md actualizado · leer al inicio de cada sesión

### Error 7 · Tomé iniciativa de "siguiente paso lógico"
- Tras aprobar una decisión, ejecuté el paso siguiente asumido sin preguntar
- **Lección**: aprobar una cosa no autoriza ejecutar la siguiente · pedir OK de cada paso explícito

---

## 9 · Módulos cerrados

### Módulo 01 · Logo oficial (transversal)

```yaml
id: 01
type: transversal_asset
closed_at: 2026-04-19
files:
  - Diseno/00-logo-oficial.html
  - Instrucciones/00-BRAND-LOGO.md
log: (no log iterativo · el logo se trabajó en sesión previa al protocolo actual)
connections_status: 2 PENDING_USER_INSTRUCTION (nav brand · footer logo)
notes:
  - Activo transversal consumido por todos los módulos futuros
  - No lleva sufijo de dispositivo ni timestamp (regla para assets transversales)
  - Geometría v2.0 centrada: u en (50, 71) · punto en (77, 68)
```

## 9.1 · Módulos en progreso

### Módulo 02 · Landing (master + 15 sub-módulos) · CERRADO (iter-05 · MD emitido)

```yaml
id: 02
type: screen_module_bundle
opened_at: 2026-04-19
closed_at: 2026-04-19
status: CERRADO · MD emitido en Instrucciones/02-landing-20260419-1650.md
       · 5-device expansion pending (§RULES.07)
timestamp_batch: 20260419-1650
files_in_Diseno: 16 HTMLs
  master: 02-landing-20260419-1650.html
  sub_auth: 02-auth-20260419-1650.html
  sub_verificacion: 02-verificacion-20260419-1650.html
  sub_carrera: 02-carrera-20260419-1650.html          # agregado en iter-03 · fuente: worktree/07-carrera-v2.html
  sub_intereses: 02-intereses-20260419-1650.html      # agregado en iter-04 · fuente: worktree/08-intereses-v2.html
  sub_comunidades: 02-comunidades-20260419-1650.html  # agregado en iter-04 · fuente: Referencia/09-comunidades-v2.html
  sub_bienvenida: 02-bienvenida-20260419-1650.html    # agregado en iter-04 · rediseñado iter-05 (4 hojas)
  sub_business:
    - 02-business-personas-20260419-1650.html
    - 02-business-contabilidad-20260419-1650.html
    - 02-business-trabajo-20260419-1650.html
    - 02-business-reclutamiento-20260419-1650.html
    - 02-business-payroll-20260419-1650.html
    - 02-business-crm-20260419-1650.html
    - 02-business-operaciones-20260419-1650.html
    - 02-business-ventas-20260419-1650.html
    - 02-business-inventario-20260419-1650.html
log: LEER/log-02-landing.md (iter-01 a iter-05 documentadas)
iter-01_done:
  - 12 HTMLs copiados desde Referencia/ a Diseno/ con nombres nuevos
  - 46 cross-links reescritos (landing ↔ auth ↔ verificación · landing → 9 business)
iter-02_done:
  google_button_B:
    file: 02-auth-20260419-1650.html
    status: COMPLETO
    changes: CSS banner + id btn-google-social + clases flow-email-only + JS toggle
    behavior: click Google → oculta nombre/correo/claves · muestra banner · queda fecha+declaración+submit
  verificacion_otp:
    file: 02-verificacion-20260419-1650.html
    status: COMPLETO
    changes:
      - CSS OTP + email-row + send-code-btn + otp-section + otp-boxes + otp-input + otp-actions
      - HTML email-row con input + botón "Enviar código" · hint "código de 6 dígitos"
      - HTML bloque OTP con 6 casillas deshabilitadas por default
      - CTA text "Verificar y continuar" → "Verificar y aceptar" (línea 561)
      - JS: toggle envío (valida @) · timer 10min · auto-focus · paste · reenviar · Backspace/Arrows
    behavior: email+send → OTP activa + timer · casillas 1-dígito con auto-focus al siguiente · reenviar reinicia
iter-03_done:
  - Agregado paso 3 carrera desde worktree (respeto límite worktree solo lectura)
  - CTA verificación "Verificar y aceptar" → 02-carrera
iter-04_done:
  - Agregados pasos 4 intereses, 5 comunidades, 6 bienvenida
  - Cross-links entre pasos resueltos (3+4+5 navegables)
iter-05_done:
  - Bienvenida rediseñada en 4 hojas verticales con botón Siguiente
  - Indicador vertical de progreso (dots laterales) con IntersectionObserver
  - MD cierre emitido en Instrucciones/02-landing-20260419-1650.md (~600 líneas · Claude Code estricto)

pending_connections:
  - 02-verificacion línea 569: skip-link (PENDING)
  - 02-carrera skip-link + JS ahora apunta a 02-intereses OK
  - 02-intereses skip-link (PENDING)
  - 02-bienvenida sheet-4: btn_primary "Entrar a mi dashboard" → 03-dashboard (probable · PENDING)
  - 02-bienvenida sheet-4: btn_ghost "Hacer un tour guiado" (PENDING)
  - 02-bienvenida sugg_cards: CV → 13-cv-editor · tutor → 10-tutores · comunidad → PENDING
  - 02-landing: "Ver demo", "Explorar", App Store, Google Play, footer_links (PENDING)
  - "Entrar" navbar: hoy → /auth · semánticamente /login (decisión postpuesta)

pending_5device_expansion:
  - 15 HTMLs de pantalla × 5 dispositivos = 75 archivos
  - Decisión: Opción A aplicada (1 HTML ahora · expansión post-review)
```

---

## 9.2 · Módulos 03 a 21 · Depositados NOT_ITERATED (batch 20260419-1837)

Cristian depositó 19 HTMLs adicionales desde Referencia/ + worktree. Cada uno con MD en
Instrucciones/ (breve · status NOT_ITERATED · pendiente de iteración con Cristian).

```yaml
batch_timestamp: 20260419-1837
files_in_Diseno: 19 HTMLs (módulos 03-21)
files_in_Instrucciones: 19 MDs breves (mismo timestamp)
registrados_en: Instrucciones/00-CONNECTIONS-MAP.md §CONN.02

modules:
  03-dashboard-estudiante    · home post-onboarding            · route /dashboard
  04-biblioteca              · catálogo +70k títulos           · route /biblioteca
  05-workspaces              · Yjs + Lexical                   · route /workspace/:id
  06-perfil-social           · perfil público                  · route /perfil/:userId
  07-chat                    · mensajería 1v1                  · route /chat/:peerId
  08-configuracion           · settings + legal                · route /configuracion
  09-cursos-diploma          · cursos con diploma + puntos     · route /cursos
  10-tutores                 · directorio pago custodia        · route /tutores
  11-classroom               · clase en vivo                   · REDESIGNED + PENDING_UPDATE
  12-oferta-laboral          · bolsa de empleo                 · route /empleo
  13-cv-editor               · editor CV                       · route /cv
  14-mi-universidad          · portal U                        · route /mi-universidad
  15-gamification            · puntos + logros                 · route /logros
  16-study-rooms             · salas virtuales                 · route /salas
  17-quizzes-flashcards      · repaso                          · route /repaso
  18-calendar                · calendario agregador            · route /calendario
  19-workspace-athena        · workspace + Athena              · route /workspace/:id (overlay)
  20-movil-ios-android       · mockup referencia móvil         · route N/A (guía)
  21-tienda-virtual          · e-commerce                      · route /tienda

descartados (redundantes con módulo 02):
  - 25-landing-unificada.html    (variante de landing · redundante)
  - 29-flujo-onboarding.html     (onboarding single-file · redundante con pasos 2-6)

modulo_11_classroom_detalle:
  status_especial: "REDISEÑADO + PENDING_UPDATE"
  reason: "el archivo fuente original tenía nombre 'no me gusta, mucha carga cognitiva actualizar'"
  redesign_applied:
    - 2 columnas en lugar de 3 (pizarra foco + sidebar derecho)
    - Plan de clase como barra horizontal superior (eliminada columna izquierda)
    - Bottom bar eliminado · estado en controles
    - Tipografía unificada (sin Times serif)
    - Overlays minimizados (tutor sup izq + self-PIP · ejercicio anclado a pizarra)
  personas_aplicadas:
    - tutor: PEOPLE.03 Daniela Maturana · Ing. Comercial · U del Alba
    - student: PEOPLE.06 Pía Cisterna · Ing. Comercial · U del Alba
  materia: Contabilidad Financiera I (coherente con carrera de ambas)
```

---

---

## 10 · Estado actual de las carpetas de trabajo

```
CONNIKU UPDATE DISENO/
├── Diseno/
│   └── 00-logo-oficial.html                ← activo transversal (módulo 01)
├── Instrucciones/
│   ├── 00-README.md                        ← puerta de entrada del paquete
│   ├── 00-STACK.md                         ← stack técnico completo
│   ├── 00-RULES-GLOBAL.md                  ← reglas transversales
│   ├── 00-BRAND-LOGO.md                    ← spec del logo oficial
│   ├── 00-PEOPLE-AUTHORIZED.md             ← catálogo 7 personas
│   └── 00-CONNECTIONS-MAP.md               ← mapa de conexiones (solo módulo 01)
├── Referencia/                             ← intacta · 28 items depositados por Cristian · ignorar hasta instrucción
└── LEER/
    └── CONTEXT.md                          ← este archivo · bitácora de Tori
```

---

## 11 · Próximo paso esperado

Cristian cerró la sesión del 2026-04-19 a mitad de iter-02 del módulo 02 (pidió "detente · me canse").

**Estado al cierre de esta sesión 2026-04-19 (segunda tanda)**:

Trabajo adicional completado en esta tanda (post-documentación):
- **Logo oficial wordmark** aplicado en los 36 HTMLs (100%)
  - Antes: logo SVG cuadrado con u-mask (incorrecto)
  - Ahora: wordmark integrado `conn` + `i` + u-pack lime con dot naranja (§00-BRAND-LOGO.md)
  - Ejecutado con 2 scripts Python que cubrieron 5 patrones distintos + edits manuales para variantes
- **7 fotos del catálogo depositadas** en `/Users/cristiang./Desktop/CONNIKU UPDATE DISENO/assets/people/`:
  - jennifer-ruiz-babin.png · victoria-navarro-pacheco.jpg · daniela-maturana.jpg
  - felipe-gatica.png · cristian-gutierrez.jpg · pia-cisternas.jpg · barbara-escalona.jpg
  - Fuente: `/Users/cristiang./Desktop/IMAGENES PARA PUBLICIDAD/`
  - **Apellido corregido**: PEOPLE.06 es "Pía Cisternas" (con S) · no "Cisterna"
- **Catálogo 00-PEOPLE-AUTHORIZED.md** actualizado:
  - `foto_status: PENDING_DEPOSIT_BY_CRISTIAN` → `DEPOSITED (2026-04-19)`
  - `foto_path` ajustado a extensiones reales (png/jpg)
  - Apellido Cisterna → Cisternas
- **Pase de personas** aplicado en 18 archivos con contenido:
  - 03-dashboard · 06-perfil-social · 07-chat · 10-tutores (detallado manual)
  - 11-classroom (personas ya aplicadas en el rediseño)
  - 14-mi-universidad · 15-gamification (detallado manual)
  - 10 archivos vía script bulk Python: 04-biblioteca · 05-workspaces · 08-configuracion ·
    09-cursos-diploma · 12-oferta-laboral · 13-cv-editor · 16-study-rooms ·
    17-quizzes-flashcards · 18-calendar · 19-workspace-athena · 20-movil-ios-android
  - 21-tienda-virtual no tiene personas (solo productos)
- **Fotos reales** embebidas como `<img src="../assets/people/...jpg">` en 6 archivos
  - 03-dashboard (sin avatares · solo iconos abstractos)
  - 06-perfil-social (11 avatares)
  - 07-chat (14+ avatares)
  - 10-tutores (13 avatares)
  - 14-mi-universidad (4 profesores)
  - 15-gamification (5 ranks)
  - + 10 archivos vía script bulk con img tags
- **Avatares circulares + cara centrada**:
  - CSS universal con `aspect-ratio: 1/1 !important`, `border-radius: 50%`, `overflow: hidden`
  - `object-position: center 25%` para centrar caras en selfies (tercio superior)
  - Aplicado en cada archivo que tiene fotos

Decisiones de diseño:
- **Ruta relativa** (`../assets/people/*.jpg`) en vez de base64 embed
  - Violación consciente de §RULES.04 (HTML autocontenido) por velocidad de entrega
  - Reversible a base64 en una pasada posterior si Cristian lo requiere
- **Materias de los mockups** adaptadas a las carreras del catálogo:
  - Ing. Comercial: Contabilidad, Marketing, Microeconomía, Finanzas, Derecho Comercial
  - Ing. Gestión Logística (Jennifer): Logística, Operaciones, Supply Chain
  - Termodinámica/Cálculo/Derecho Const. → reemplazados por coherencia con catálogo
- **Universidades** unificadas: U. del Alba (6 personas) + USS (Jennifer)

**Pendientes al retomar** (no bloqueantes):
- Base64 embebido en lugar de rutas relativas (si se prioriza §RULES.04 estrictamente)
- Iteración detallada de cada módulo 03-21 cuando Cristian lo defina
- Expansión 5-device de todos los módulos (post-iteración)
- Revisión del 11-classroom (marcado PENDING_UPDATE por decisión de Cristian)
- Inspección de archivos del bulk Python (pueden haber patrones de nombres no cubiertos)

---

**Estado previo · primera tanda de la sesión** (para contexto histórico):
- Módulo 02 CERRADO (iter-05 · MD emitido)
- 19 módulos (03-21) depositados NOT_ITERATED (batch 20260419-1837)
- Módulo 11 classroom rediseñado + marcado PENDING_UPDATE
- Instrucciones/ tiene: 6 archivos 00-* + 1 MD módulo 02 + 19 MDs módulos 03-21 = 27 MDs
- Diseno/ tiene: 1 logo + 16 archivos módulo 02 + 19 archivos módulos 03-21 = 36 HTMLs
- CONNECTIONS-MAP actualizado con 22 módulos registrados (01 a 21)

---

## 12 · Cómo actualizar este archivo

Este `CONTEXT.md` se actualiza:
- **Al final de cada sesión activa**
- **Cuando un módulo cierra** (agregar entrada en § "Módulos cerrados")
- **Cuando se acuerda nueva regla** (agregar en § "Decisiones cerradas")
- **Cuando cometo un error nuevo** (agregar en § "Errores pasados")
- **Cuando cambia estructura de carpetas** (actualizar § "Estado actual")

**Responsable**: Tori (al final de cada sesión).
**Aprobador**: Cristian (cambios a reglas o protocolo requieren confirmación explícita).

---

## 13 · Archivos complementarios en LEER/

A medida que trabajemos módulos, esta carpeta también contendrá:

- `log-{slug-modulo}.md` · bitácora iterativa por módulo en curso · se archiva (no se borra) al cerrar el módulo
- Este `CONTEXT.md` · bitácora general del estado del proyecto

No hay subcarpetas por ahora. Si crecen los logs, se puede agrupar en una subcarpeta `logs/` en el futuro (con aprobación de Cristian).

---

**Fin del archivo. Releer completo al iniciar cada sesión nueva.**

**Última decisión tomada antes de esta actualización**: updates a módulos cerrados → reemplazo directo (opción A · 2026-04-19).

**Siguiente acción esperada**: retomar módulo 02 iter-02 · decidir qué hacer con la verificación OTP incompleta (opciones en § 11).
