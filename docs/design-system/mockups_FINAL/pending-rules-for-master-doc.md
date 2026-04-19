# Reglas pendientes para el documento maestro

Archivo donde se acumulan reglas específicas que Cristian define durante las
conversaciones previas al documento maestro. Cuando se produzca el documento
maestro del sistema de diseño y protocolo del rediseño, estas reglas deben
integrarse en la sección correspondiente.

No editar reglas existentes sin consentimiento explícito de Cristian.
Solo se agregan nuevas reglas al final.

---

## Regla 01 — Evidencia registrada de lectura de textos legales (no solo aceptación)

**Fecha registro**: 2026-04-18
**Fuente**: conversación sobre mockup `05-auth-editorial.html`

**Regla**:
En todo punto del sistema donde el usuario acepta un documento legal
(Términos y Condiciones, Política de Privacidad, Política de Cookies,
declaración jurada de edad, Política de Reembolso, DPA, cualquier otro),
la aceptación NO puede ser solo un checkbox marcado. Debe quedar
evidencia registrada y auditable de que el usuario tuvo acceso real
al texto antes de aceptar.

**Implementación esperada** (a detallar en el documento maestro):

1. **Link visible y funcional al documento completo** adyacente al checkbox.
2. **Registro en backend** de cada vez que el usuario abre el documento:
   - Timestamp UTC de apertura
   - Versión del documento abierto (hash SHA-256 del texto canónico)
   - Tiempo permanecido en el documento (scroll depth o tiempo de
     lectura mínimo antes de cerrar)
   - IP y User-Agent
3. **Checkbox con estado dual**:
   - Estado inicial: deshabilitado con leyenda tipo "Debes abrir y leer
     los términos antes de aceptar"
   - Estado habilitado: solo después de que el usuario haya abierto el
     documento en el modal o ventana (evento de apertura registrado)
4. **Texto de la declaración en el checkbox**:
   - NO: "Acepto los Términos"
   - SÍ: "He leído y acepto los Términos" — la palabra "leído" es
     elemento legal clave
5. **Ticket/comprobante de aceptación**:
   - Al aceptar, se genera un registro permanente en `user_agreements`
     con: user_id, tipo de documento, versión (hash), timestamp de
     lectura, timestamp de aceptación, IP, User-Agent.
   - Este ticket sobrevive a la eliminación de cuenta del usuario
     por 5 años (evidencia legal).
6. **Acceso posterior del usuario al ticket**:
   - En `/my-profile/legal` el usuario puede ver el histórico de
     documentos legales aceptados con fechas y versiones.
   - Puede descargar PDF de cada documento tal como lo vio al aceptar.
   - Esto protege tanto a Conniku como al usuario.

**Por qué esta regla existe**:
Sin evidencia de lectura, ante una disputa legal el usuario podría
argumentar que "aceptó sin haber visto el texto". Con evidencia de
apertura, lectura mínima y aceptación con versión específica, la defensa
de Conniku es sólida: "usted accedió al texto versión X el día Y a las
Z horas, y aceptó Z+5 minutos después".

**Aplicación**:

- Formulario de registro (declaración jurada de edad + Términos +
  Política de Privacidad): versión principal de esta regla.
- Cualquier cambio futuro a Términos o Política de Privacidad: el
  usuario debe re-aceptar con la nueva versión, registrando lectura.
- Aceptación de nuevas políticas agregadas (ej: cambios a DPA por
  nuevos procesadores de datos).
- Política de Reembolso al momento de pagar suscripción.
- Cualquier módulo futuro que requiera consentimiento explícito.

**Componente sugerido a crear en el design system**:

`<LegalAcceptance>` con props:
- `document`: 'terms' | 'privacy' | 'age_declaration' | 'refund' | 'dpa' | etc.
- `version`: string (hash SHA-256 del documento canónico)
- `onAccept`: (ticket: AcceptanceTicket) => void

Internamente gestiona:
- Modal con documento completo
- Evento `onOpen` → POST /api/legal/reading-log
- Checkbox habilitado solo post-apertura
- Evento `onAccept` → POST /api/legal/acceptance con ticket completo
- Confirmación visual de ticket emitido

**Cuándo integrar en el documento maestro**:
En la sección de "playbooks" bajo "auth-flow" y "cualquier punto de
aceptación legal", como componente obligatorio. También en la sección
"protocolo de conexiones preservadas" como uno de los flujos que NO
cambian aunque cambie el visual.

**Citas legales relevantes**:
- Ley 19.628 (Chile) sobre Protección de la Vida Privada
- Ley 19.496 (Chile) sobre Protección de los Derechos de los Consumidores
- GDPR Art. 7 (principio de consentimiento demostrable)

---

## Regla 03 — Versiones responsivas obligatorias por plataforma

**Fecha registro**: 2026-04-18
**Fuente**: conversación sobre landing principal.

**Regla**:
Cada pantalla del producto (cada mockup, cada ruta, cada vista) debe
existir en **cuatro versiones responsivas mínimas** antes de considerarse
terminada:

1. **Desktop** (>= 1280px) — versión canónica de los mockups editoriales
2. **Tablet / iPad** (768px – 1280px) — layout adaptado con márgenes y
   columnas reducidas
3. **Android / phone landscape** (480px – 768px) — navegación compacta,
   elementos apilados, gestos nativos considerados
4. **iPhone / phone portrait** (< 480px) — layout vertical puro,
   tab-bar inferior, safe areas iOS respetadas

**Implementación esperada**:

- Cada mockup HTML debe tener al menos estos 4 breakpoints con comportamientos
  específicos, no solo un `@media` genérico que escale proporcionalmente.
- Los componentes que en desktop son cards flotantes con rotación editorial
  (ej: `.form-card` en 05, `.access-card` en landing) en mobile pueden quedar
  como cards planas sin rotación para no romper usabilidad táctil.
- Las animaciones de partículas (panel-fx) deben respetar `prefers-reduced-motion`
  siempre, y en mobile limitarse a menor cantidad para no degradar rendimiento.
- Los tabs horizontales (como los de landing: Inicio / Producto / Cómo funciona
  / Planes / Descarga) en mobile deben scrollearse horizontalmente sin romper
  layout, o transformarse en drawer/hamburger si son más de 4.
- Interacciones específicas por plataforma:
  - **iOS Capacitor**: gestos de back swipe, haptic feedback, safe areas
  - **Android Capacitor**: back button del sistema, material ripples en
    touch, navigation bar
  - **iPad**: layouts de 2 columnas aprovechando el espacio (split view)
  - **Tablet Android**: similar a iPad pero con convenciones Material
- Tipografía debe escalar con `clamp()` o breakpoints explícitos — evitar
  que el hero de 108px en desktop se vea proporcionalmente desmedido en
  mobile.

**Verificación antes de cerrar cualquier pantalla**:

- Pixel diff / visual review en los 4 breakpoints
- Lighthouse mobile >= desktop (rendimiento no debe degradarse)
- Accesibilidad WCAG AA en tap targets (mínimo 44×44px en mobile)
- No scroll horizontal accidental en ningún breakpoint

**Cuándo integrar en el documento maestro**:
En la sección "checklist de entrega por pantalla". Ninguna pantalla puede
considerarse terminada si no existe en los 4 layouts responsivos.

**Aplicación transversal**:
Esta regla aplica a los 33 mockups existentes y a todas las pantallas
futuras (dashboard, workspace, classroom, biblioteca, landing, auth,
onboarding, verificación, etc.) y a los módulos de expansión (Conniku
Personas, Conniku Finanzas, Conniku Trabajo).

**Componente sugerido a crear en el design system**:

Un sistema de `breakpoints.ts` con tokens exportados:
```ts
export const bp = {
  mobile: 480,
  tablet: 768,
  desktop: 1080,
  wide: 1280,
};
```

Y utilities de estilo que garanticen que cada componente declare explícitamente
qué pasa en cada breakpoint, no solo "mobile-first media queries genéricas".

---

## Regla 02 — Workspace: modo foco + notificaciones borde + tema reducido

**Fecha registro**: 2026-04-18
**Fuente**: conversación sobre mockup `11-workspace-completo.html` y
`24-workspace-athena-popups.html`.

**Regla**:
El módulo Workspace (editor de documentos con asistente Athena integrado)
debe incluir tres opciones extra de control de atención que el usuario
puede combinar libremente. Son controles visibles en la toolbar del
documento, no ajustes ocultos.

### 02.1 Modo foco (Full screen del documento)

Botón que agranda el documento a full screen y oculta todo salvo la barra
lateral derecha del chat (el canal de conversación con Athena y con
pares). La idea es darle al usuario una zona de escritura muy limpia,
sin sidebar izquierda, sin topbar del producto, sin otros paneles.

- Shortcut sugerido: `F` o `Cmd+Shift+F`
- Al activar: sidebar izquierda (navegación) y topbar se colapsan, el
  documento ocupa el viewport completo menos la barra del chat.
- Barra del chat mantiene ancho normal (320-360 px aprox), pegada a la
  derecha, sin cerrar. El usuario puede seguir conversando sin salir.
- Botón de salir del modo foco visible siempre en la esquina superior
  izquierda del documento (con icono sutil, no invasivo).
- Se persiste la preferencia: si el usuario activa modo foco, al volver
  al mismo documento sigue en modo foco hasta que lo apague.

### 02.2 Notificaciones de Athena como color en el borde

Athena no interrumpe con popups automáticos mientras el usuario escribe.
Cuando tiene una sugerencia, una observación o un hallazgo, cambia el
color del borde del documento (o el chat widget) de forma sutil y
constante (no parpadeante agresivo).

- Por defecto: borde del documento transparente / neutro del tema.
- Cuando Athena tiene algo que decir:
  - Borde se tiñe de color semántico según tipo:
    - Naranja (`--orange` / `--spark`) → sugerencia editorial
    - Violeta (`--violet`) → observación contextual (datos, fuente)
    - Cian (`--cyan`) → feedback positivo / confirmación
    - Lima (`--lime`) → acción disponible (insertar, expandir)
  - Animación de entrada muy suave (200-300 ms, easing out)
  - Se mantiene ese color hasta que el usuario lo atiende o lo descarta
- El usuario presiona el borde (o hace clic en un punto cualquiera del
  borde teñido) y se abre el popup con la asistencia completa de Athena.
- Si el usuario ignora N sugerencias consecutivas, Athena entra en modo
  silencio durante la sesión (no más borders) hasta que el usuario
  active "Pedir ayuda" manualmente.
- Criterio de diseño: la interfaz no grita; sugiere. El borde es
  periférico, el usuario decide si lo atiende o sigue escribiendo.

### 02.3 Tema reducido del módulo

Opción para disminuir la saturación del esquema de color del módulo
Workspace cuando el usuario quiere una experiencia más sobria para
concentrarse.

- Toggle en la toolbar del documento: `Tema editorial` ↔ `Tema calma`
- En tema editorial (default): paleta completa warm paper + splatter +
  stickers + accents coloridos.
- En tema calma:
  - Fondo igual warm paper pero sin splatter decorativos
  - Stickers ocultos / muy atenuados
  - Accents reducidos a grises y uno o dos acentos funcionales
  - Tipografía y jerarquía iguales (no se cambia estructura)
  - Borders de Athena aún activos pero con menor saturación (opacity
    60% aprox)
- Se persiste la preferencia por usuario: si elige "Tema calma" una
  vez, se recuerda hasta que lo cambie.

### Relación con preferencias de accesibilidad

Estas tres opciones son independientes entre sí pero se combinan:

- Modo foco + tema editorial = escribir con inmersión visual plena
- Modo foco + tema calma = escribir con máxima concentración sin
  distracciones
- Sin modo foco + tema calma = sesión de revisión tranquila en el
  layout estándar

**Cuándo integrar en el documento maestro**:
En la sección de playbooks del módulo Workspace, bajo "controles de
atención del usuario". También mencionar en protocolo de diseño como
ejemplo del patrón "la interfaz sugiere, el usuario decide".

**Componentes sugeridos a crear en el design system**:

- `<WorkspaceFocusToggle>` con props `isFocused` y `onToggle`
- `<AthenaEdgeIndicator>` que renderiza el borde teñido con props
  `severity` (`suggest` | `observe` | `confirm` | `action`) y
  `onActivate` que dispara el popup.
- `<WorkspaceThemeToggle>` con props `theme` (`editorial` | `calm`) y
  `onChange`.

**Por qué esta regla existe**:
Athena es un asistente, no un notificador. Si interrumpe al usuario con
popups automáticos, se siente invasiva y pierde credibilidad. La
metáfora del borde tintado es visual, periférica, y respeta el momento
de escritura. El tema calma existe porque hay estudiantes que funcionan
mejor con menos estímulo visual, y el producto tiene que acomodar
ambos modos sin convertirse en dos productos distintos.

---
