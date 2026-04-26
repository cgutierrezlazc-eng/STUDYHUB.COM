
## 📦 Contenido

```
handoff/
├── conniku-themes/
│   ├── themes.css        ← 12 temas como variables CSS
│   ├── themes.js         ← Registry + switcher + React hook
│   └── ThemeSwitcher.jsx ← Componente UI listo para usar
    ├── ConnikuLogo.tsx
    ├── ConnikuLogo.jsx
```

---

## 🎨 Themes · 12 paletas

**6 familias × 2 modos (dark/light):**

| Familia  | Dark         | Light          | Signature | Vibe |
|----------|--------------|----------------|-----------|------|
| ember    | ember-dark   | ember-light    | Orange    | Cálido, memorable |
| cosmos   | cosmos-dark  | cosmos-light   | Violet    | Espacial, cósmico |
| forest   | forest-dark  | forest-light   | Green     | Natural, marca |
| **punk** ⭐ | punk-dark    | punk-light     | Lime      | Joven, signature |
| ocean    | ocean-dark   | ocean-light    | Cyan      | Productivo, aire |
| amber    | amber-dark   | amber-light    | Cream     | Biblioteca, cálido |

### Instalación

```jsx
// 1. En tu entry point (main.jsx / App.jsx), antes de montar React:
import './handoff/conniku-themes/themes.css';
import { initTheme } from './handoff/conniku-themes/themes.js';
initTheme();

// 2. Usar en cualquier componente:
import { useTheme } from './handoff/conniku-themes/themes.js';

function MyComponent() {
  const { theme, setTheme, toggle, themes } = useTheme();
  return (
    <button onClick={toggle}>Toggle dark/light</button>
  );
}
```

### Uso en CSS

```css
body { background: var(--bg); color: var(--text); }
.card {
  background: var(--surface);
  border: 1px solid var(--border);
}
.card-muted { color: var(--text-2); }
.btn-primary {
  background: var(--signature);
  color: var(--ink);
}
```

### Tokens disponibles

**Por tema (cambian):**
- `--bg` `--surface` `--surface-2` `--surface-3` — fondos escalonados
- `--border` `--border-2` — bordes teñidos
- `--text` `--text-2` `--text-3` `--text-4` — textos (principal → muy muted)
- `--signature` — color principal del tema
- `--banner-g1` `--banner-g2` — colores para banners radiales

**Acentos de marca (constantes en TODOS los temas):**
- `--green` `--green-2` `--green-3`
- `--lime` `--orange` `--orange-2`
- `--violet` `--violet-2` `--cyan` `--cyan-2`
- `--cream` `--cream-2` `--pink`
- `--paper` `--ink`

### Cambiar tema programáticamente

```js
import { applyTheme } from './handoff/conniku-themes/themes.js';

applyTheme('ember-dark');   // un tema específico
applyTheme('punk-light');
// o en HTML:
// <html data-theme="cosmos-dark">
```

---


Variante oficial: tile lima rotado -8°, "u" recta agrandada (108pt), dot naranja.

### React
```tsx

<ConnikuLogo size={48} />
<ConnikuLogo size={32} variant="mono-dark" />
<ConnikuLogo size={32} variant="mono-light" />
```

### HTML/SVG
```html
```

### Especificaciones
- Tile: `#D9FF3A` rotado -8° · radius 22%
- U: `#0D0F10` · Funnel Display 900 · siempre a 0°
- Dot: `#FF4A1C` · radius 9 · posición (83, 74)

---

## 💡 Recomendación

- **Alternativa cálida:** `ember-dark` / `ember-light` — naranja protagonista
- **Más sobrio:** `forest-dark` / `forest-light` — verde de marca

El `ThemeSwitcher` incluido permite al usuario elegir entre los 12.
