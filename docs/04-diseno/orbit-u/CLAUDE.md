# Conniku · ORBIT-U

## 🚨 REGLA RAÍZ · NUNCA INVENTAR

**Esta es la regla más importante del proyecto. Está por encima de todo lo demás.**

1. **Si no existe, preguntar.** No asumir, no completar con suposiciones, no rellenar huecos con cosas que parecen lógicas.
2. **Si no se sabe, decir "no sé".** No fabricar respuestas, no buscar parecer competente. Decir "no sé" es la respuesta correcta cuando no se sabe.
3. **No mentir.** No exagerar logros, no inventar archivos, valores, configuraciones, IDs, rutas, contenidos. Si una afirmación no se puede verificar con evidencia directa (un Read, un grep, un ls, un tool result), no se afirma.
4. **Verificar antes de afirmar.** Antes de decir "ya está hecho", "el archivo tiene X", "el botón hace Y" — leer/probar para confirmar.
5. **Cuando hay duda, preguntar al usuario.** Una pregunta clara es mejor que una invención silenciosa.

**Esta regla aplica a:** archivos, rutas, IDs, configuración, valores numéricos, comportamiento de código, intenciones del usuario, contenido de zips/imágenes que no he abierto, decisiones de diseño, contenido borrado, y cualquier otra cosa.

---

## 🚨 REGLA RAÍZ #2 · LEER HISTORIAL DE ERRORES ANTES DE ACTUAR

**Antes de ejecutar cualquier acción** (escribir código, modificar archivo, borrar, mover, ejecutar bash, lanzar agente, responder con afirmación técnica):

**Leer obligatoriamente** `_ERRORES-HISTORIAL.md` (en la raíz del proyecto).

Ese archivo contiene el registro de **todos los errores cometidos** en este proyecto: invenciones, mentiras, afirmaciones sin verificar, argentinismos, destrucciones sin confirmación, confusiones de archivos, etc.

**No saltarse este paso.** No es opcional, no es "si me acuerdo". Es la primera operación antes de cualquier otra. Si la sesión es nueva, leerlo es el primer Read de la sesión.

**Cuando se cometa un error nuevo:** agregarlo al final del archivo con su categoría, contexto, cómo evitarlo. Nunca eliminar entradas antiguas — la memoria del proyecto las necesita.

**El protocolo completo está al final del archivo `_ERRORES-HISTORIAL.md`.**

---

## ⚠️ LOGO OFICIAL · INVIOLABLE

**El único logo válido del proyecto vive en:**
```
shared/logo-oficial/handoff/
├── ConnikuWordmark.css    ← drop-in CSS del wordmark
├── ConnikuWordmark.html   ← preview de referencia
├── INSTRUCCIONES.md       ← reglas obligatorias (leerlas antes de tocar)
├── app-icon.svg           ← app icon color
├── app-icon-mono-dark.svg ← variante mono oscuro
└── app-icon-mono-light.svg ← variante mono claro
```

**Uso del wordmark** (estructura HTML única, no modificar):
```html
<span class="brand">
  conn<span>i</span><span class="k-letter">k</span><span class="u-pack">
    <span class="u-letter">u</span>
    <span class="dot"></span>
  </span>
</span>
```
Sobre fondo oscuro: `<span class="brand on-dark">…</span>`

**Uso del app icon**: usar `<img>` o `<object>` apuntando al SVG. Nunca redibujarlo inline en otros archivos.

**Paleta inviolable:**
- `#D9FF3A` — verde tile
- `#FF4A1C` — dot naranja
- `#0D0F10` — ink (texto sobre fondo claro)
- `#F5F4EF` — paper (texto sobre fondo oscuro)

**Tipografía inviolable:**
- Funnel Display weight 900
- letter-spacing `-0.055em`
- line-height `1`

**Lo que NO se hace:**
- ❌ No dibujar el wordmark/icon manualmente en HTMLs (siempre referenciar los archivos del paquete)
- ❌ No tile recto (siempre rotado −8°)
- ❌ No mayúsculas, no italic, no opacidad reducida en la `i`
- ❌ No fallback de fuente: solo Funnel Display 900
- ❌ No sombras, gradientes, efectos sobre el wordmark
- ❌ No `scaleX/scaleY`, no rotar el wordmark completo (solo el tile)

**Antes de implementar el logo en cualquier archivo, leer `shared/logo-oficial/handoff/INSTRUCCIONES.md`.**

---

## 🚨 REGLA RAÍZ #3 · IDIOMA · ESPAÑOL NEUTRO LATINOAMERICANO

**Cero tolerancia al voseo argentino.** El usuario es chileno y lo ha pedido múltiples veces.

### Lista negra (NUNCA usar)

- Pronombres: `vos`, `vosotros` → usar `tú`
- Verbos terminados en `-ás / -és / -ís`: `llevás, podés, querés, sabés, decís, tenés, hacés` → usar `llevas, puedes, quieres, sabes, dices, tienes, haces`
- Imperativos terminados en `-á / -é / -í`: `mirá, escribí, leé, andá, contame, decime, vení, pasame, dale` → usar `mira, escribe, lee, ve, cuéntame, dime, ven, pásame, ok`
- Subjuntivos voseados: `quieras, hagas` están OK; pero `mirés, hagás` NO.
- Diminutivos rioplatenses: `un poquitito` está OK pero evitar `chiquito` con doble entonación argentina.
- Anglicismos cuando hay equivalente: `skip → omitir`, `click → clic`, `upload → subir`, `drag/drop → arrastrar y soltar`, `default → predeterminado`, `commit → confirmar` (en context git: dejar `commit`).

### Antes de enviar cualquier respuesta

Hacer un escaneo mental de:
1. Verbos en 2ª persona: ¿están en `tú` (`puedes, quieres, dices`) y NO en `vos` (`podés, querés, decís`)?
2. Imperativos: ¿terminan en `-a / -e / -i` neutro y NO en `-á / -é / -í` voseado?
3. Anglicismos sin necesidad.

Si hay duda, leer la lista negra antes de presionar enviar.

---

## Idioma · resumen

- Comunicación con el usuario: **español latinoamericano neutro**.
- Tono claro y directo, sin jerga regional.

## Estructura

- `landing.html` — landing pública de marketing
- `pages/` — páginas reales del producto
- `_CONCEPTOS/` — prototipos visuales y exploraciones (no producción)
- `_ARCHIVE/` — backups y versiones antiguas (no tocar, no borrar)
- `shared/` — CSS, JS, assets compartidos
- `docs/` — documentación interna
- `CLAUDE DESIGN NEW/` — assets de diseño nuevos (zips, prototipos)

## Flujo de usuario

```
landing.html (marketing público)
      ↓
index.html (start)
      ↓
registro.html → verificacion.html → onboarding.html (6 pasos)
                                          ↓
                                    orbit-u.html ⇄ perfil-social-v2.html
                                          ↓
                                    módulos: workspaces, mensajes, biblioteca,
                                             cursos, tutores, calendario, athena,
                                             chat, empleo
```

## Páginas activas (`pages/`)

### Flujo de cuenta
- `bienvenida.html`, `registro.html`, `login.html`, `verificacion.html`, `onboarding.html`

### Producto
- `orbit-u.html` (sistema solar)
- `perfil-social-v2.html` ⭐ (perfil del usuario)
- `conniku.html` (tour del universo)

### Módulos
- `athena.html`, `biblioteca.html`, `calendario.html`, `chat.html`, `cursos.html`, `mensajes.html`, `tutores.html`, `workspaces.html`, `empleo.html`

### Soporte y legales
- `contacto.html`, `soporte.html`, `prensa.html`
- `terminos.html`, `privacidad.html`, `cookies.html`
- `empleo-conniku.html` (carreras en Conniku)

## LocalStorage keys

- `conniku-user-v1` — perfil del usuario (nombre, universidad, bio, etc.)
- `conniku-bio-v1` — bio (separado para el editor)
- `conniku-cover-v1` — portada
- `conniku-theme` — tema activo
- `conniku-device-fp` — huella del dispositivo

## Credenciales de desarrollo

- Email: `dev@conniku.test`
- Password: `dev2025`
- Atajo para saltar formulario: `Ctrl + Shift + D`

## Servidor local

```bash
cd /Users/cristiang./Desktop/ORBIT-U
python3 -m http.server 8765
```

Abrir: `http://localhost:8765/index.html`
