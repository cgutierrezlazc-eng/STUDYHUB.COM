# Hex Nebula · Fondo metálico animado (Conniku)

Variante **N3 · NÉBULA** del experimento `Hex Armor v6`. Manchas orgánicas no lineales con los 5 colores Conniku mezclados, movimiento muy lento (no invasivo). Pensado para áreas académicas: biblioteca, workspaces, perfil.

## 📦 Archivos

```
handoff/hex-nebula/
├── hex-nebula.js     ← motor vanilla (sin dependencias)
├── HexNebula.jsx     ← wrapper React
└── demo.html         ← demo standalone
```

---

## 🔧 Instalación

### Vanilla JS / HTML

```html
<canvas id="bg"></canvas>
<script src="/handoff/hex-nebula/hex-nebula.js"></script>
<script>
  HexNebula.mount(document.getElementById('bg'));
</script>
```

### React

```jsx
import { HexNebulaCanvas } from './handoff/hex-nebula/HexNebula.jsx';

export default function Layout({ children }) {
  return (
    <>
      <HexNebulaCanvas intensity={0.9} hexSize={30} />
      <main style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </main>
    </>
  );
}
```

> ⚠️ El canvas se posiciona `fixed; inset:0; z-index:0`. Tu contenido debe ir con `position:relative; z-index:1` (o superior) para verse encima.

---

## ⚙️ Opciones

| Opción           | Tipo    | Default        | Descripción |
|------------------|---------|----------------|-------------|
| `hexSize`        | number  | `30`           | Tamaño del hexágono en px. Más chico = más densidad. |
| `bgColor`        | string  | `'#050608'`    | Color de fondo (negro casi puro por defecto). |
| `intensity`      | number  | `0.9`          | Multiplicador de brillo `0–1`. Bajalo a `0.5` para áreas con mucho texto. |
| `pauseOnHidden`  | boolean | `true`         | Pausa el render cuando la pestaña pierde visibilidad. |
| `reducedMotion`  | boolean | auto-detect    | Si `true`, congela la animación (escena estática). Auto-detecta `prefers-reduced-motion`. |

### Ejemplo con tweaks

```js
HexNebula.mount(canvas, {
  hexSize: 26,
  intensity: 0.7,
  bgColor: '#0A0C12'
});
```

---

## 🎨 Paleta usada

Los 5 acentos de marca cíclicos (mezclados orgánicamente):

- 🟢 `#00C27A` green
- 🟡 `#C49A3A` gold
- 🔵 `#0096CC` cyan
- 🟣 `#6B4EFF` violet
- 🔴 `#FF4A1C` orange

---

## 🚀 Performance

- **CPU canvas 2D** (sin WebGL) → corre en cualquier dispositivo
- **DPR cap a 2x** para evitar render 4K innecesario
- **Pausa automática** en pestaña oculta
- **Respeta `prefers-reduced-motion`** → escena estática para usuarios sensibles
- En laptops modernas: ~3-6% CPU. En móviles: bajá `intensity` a `0.6` y `hexSize` a `34`.

---

## 🧹 Cleanup

```js
const inst = HexNebula.mount(canvas);
// Cuando ya no lo necesitás:
inst.stop();
```

El wrapper React lo hace automáticamente al desmontar.

---

## 💡 Recomendación

- **Biblioteca / Workspaces / Perfil:** `intensity: 0.7-0.9` ← este fondo
- **Chat / Social:** usar `hex-tide` (variante WHISPER) en su lugar
- **CTAs / Formularios encima:** asegurar contraste subiendo `bgColor` a `#0A0C12` y bajando `intensity` a `0.5`
