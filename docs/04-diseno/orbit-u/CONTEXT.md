# CONTEXT · CONNIKU · Orbit-U Design System

```yaml
DOCUMENT_ID:        CONNIKU.CONTEXT.ROOT
PROJECT:            Conniku · Red social universitaria chilena
DESIGN_SYSTEM:      Orbit-U (2026)
OWNER:              Cristian Gutiérrez Lazcano (cgutierrezlazc@gmail.com)
STATUS:             ACTIVO · proyecto principal
LOCATION:           /Users/cristiang./Desktop/CONNIKU/
LAST_UPDATE:        2026-04-24
```

---

## 0 · REGLA DE INDEPENDENCIA

**Este proyecto es independiente.** No hereda decisiones de diseño de carpetas archivadas.

```
CONSUMIR_DE_ARCHIVE_OK:      inventarios de módulos · APIs · endpoints · integración universitaria · copy conceptual
CONSUMIR_DE_ARCHIVE_PROHIBIDO: HTML viejo · CSS viejo · componentes · paletas · tipografías anteriores · layouts
RULE:                         si alguien dice "mira cómo estaba antes en X", no es un argumento válido — aquí partimos limpio
EXCEPCION_ÚNICA:              el concepto "Mi Universidad" (conector institucional) se preserva
```

Si una sesión empieza abriendo este CONTEXT, ya sabe qué puede y qué NO puede consultar de `~/Desktop/_ARCHIVE-CONNIKU-2026/`.

---

## 1 · QUÉ ES CONNIKU (esencia funcional)

Plataforma única para la vida universitaria en Chile. Tres caras del mismo producto:

1. **Para el estudiante** — todo lo necesario para estudiar, conectarse y trabajar en una sola app
2. **Para la universidad** — sistema operativo institucional completo (HR, payroll, finanzas, compliance)
3. **Para el ecosistema laboral** — diplomas verificables, CVs auto-generados, empleo verificado

**Promesa**: "Tu Universidad entera. En una sola app."

---



```html
<span class="brand">conn<span>i</span>k<span class="u-pack">u<span class="dot">.</span></span></span>
```

```css
.brand {
  display: inline-flex; align-items: baseline;
  font-family: 'Funnel Display', sans-serif; font-weight: 900;
  letter-spacing: -.055em; line-height: 1;
  color: var(--text);              /* ink en light, paper en dark */
}
.brand .u-pack {
  display: inline-flex; align-items: baseline;
  background: #D9FF3A;             /* lime · INVIOLABLE */
  color: #0D0F10;                  /* u ink · INVIOLABLE */
  padding: .07em .14em .07em .09em;
  border-radius: .2em;
  margin-left: .02em;
}
.brand .u-pack .dot { color: #FF4A1C; }   /* naranja · INVIOLABLE */
```


```xml
```

### Reglas inviolables

- `tile` = `#D9FF3A` · siempre lime · sin excepciones
- `u` = `#0D0F10` · siempre ink · sin excepciones
- `dot` = `#FF4A1C` · siempre naranja · sin excepciones
- `font` = Funnel Display 900 · sin sustitución
- **Excepción aprobada**: inclinación del tile (-12°) en contexto Mi U del perfil

---

## 3 · SISTEMA VISUAL · ORBIT-U

### Concepto

El hub del estudiante es un **sistema solar**: vos como sol central, los módulos como planetas orbitando alrededor con distintos tamaños y colores.

**Páginas que NO cambian de tema** (son constantes de producto):
- `pages/orbit-u.html` · el sistema solar (hub)
- `pages/landing.html` · marketing público (cuando se construya)

**Páginas que SÍ se adaptan al tema elegido por el usuario**: todas las demás (perfil, módulos, ajustes, etc.)

### Tokens de tema

```css
:root {
  /* Fondos */
  --bg --surface --surface-2 --surface-3
  /* Bordes */
  --border --border-2
  /* Texto */
  --text --text-2 --text-3 --text-4
  /* Marca */
  --green --green-2 --green-3    /* primary accent · tres variantes */
  --orange                        /* siempre #FF4A1C del dot */
  /* Color por módulo */
  --violet --cyan --cream --pink --paper
}
```

### 4 temas predefinidos (cada uno editable por usuario)

1. **Orbit Dark** · oscuro cosmos · verde primary
2. **Editorial Paper** · claro warm · Conniku editorial original
3. **Social Blue** · LinkedIn pro · azul corporate · blanco cards
4. **Cosmic Violet** · dark violet · gold + pink

### Signature icon system

- Hover del padre → dot se enciende con glow
- Cada icono lleva un color sutil de su categoría

### Cover tint

Cuando el usuario elige un template de portada, el color principal se propaga (muy sutil, 16% opacity) a:
- Bordes de posts · composer · bio · side cards
- Left accent del composer
- Top accent band del bio
- Halo sombra de cards

Esto **NO afecta** landing ni orbit-u. El usuario siente que el espacio es suyo.

---

## 4 · INVENTARIO DE MÓDULOS (esencia, no diseño)

Ver `docs/INVENTARIO-MODULOS.md` para detalles completos. Resumen:

**Públicos / Marketing**: landing · producto · planes · acerca · como-funciona · contacto · soporte · kiosko · plataforma
**Auth**: registro · verificación · onboarding · bienvenida
**Estudiante** (24 módulos): dashboard · perfil · biblioteca · workspaces · chat · comunidades · cursos+diploma · tutores · classroom · empleo · cv-editor · **mi-universidad** · gamification · study-rooms · quizzes · calendar · athena(IA) · móvil · tienda
**Business** (44 módulos en 5 áreas): Finanzas · HR · Payroll · Legal · Herramientas
**Legal**: terms · privacy · cookies · age-declaration

---

## 5 · MI UNIVERSIDAD · conector institucional (preservado)

**Propósito**: integración bidireccional con sistemas oficiales de la universidad del estudiante.

**Lo que consume**:
- Notas reales del semestre
- Asistencia oficial
- Ramos inscritos
- Calendario académico
- Certificados institucionales

**Lo que entrega**:
- Verificación institucional del perfil
- Diploma Conniku validado cruzadamente
- CV oficial con notas reales

**Arquitectura lógica** (no visual):
- OAuth institucional por universidad (acuerdo por institución)
- APIs de lectura (portal U → Conniku)
- Almacenamiento de tokens seguros
- Sync periódico + on-demand

**Estado**: stub en UI · endpoints por definir con cada institución partner.


---

## 6 · STACK & ARQUITECTURA

```yaml
STACK_FRONTEND:     HTML + CSS + vanilla JS (por ahora · mockup-first)
FUTURO_STACK:       por definir (Next.js + Tailwind · propuesto)
DESIGN_SYSTEM:      tokens CSS + signature icons + 4 presets
PERSISTENCIA:       localStorage (conniku-theme-v1 · conniku-bio-v1 · conniku-cover-v1)
FIREWALL_VISUAL:    orbit-u.html IGNORA theme editor (tokens hardcoded)
```

---

## 7 · WORKFLOW

```
RULE_FLUJO:             una acción, una revisión · detenerse cuando el owner dice "detente"
RULE_COMUNICACION:      directa, español neutro (LATAM), sin argentinismos (vos/arrancá/dale)
RULE_CHECKPOINT:        antes de cambios grandes (refactors, moves, destructive) crear copia
```

---

## 8 · PUNTOS DE ENTRADA

- `pages/orbit-u.html` · **HUB** · sistema solar (entrada principal post-login · nunca cambia)
- `pages/perfil.html` · perfil público estudiante (se adapta al tema + cover tint)

Al hacer click en el sol de orbit-u → va al perfil.
Al hacer click en Orbit·U pill del perfil → vuelve a orbit-u.

---

## 9 · PENDIENTES / PRÓXIMOS PASOS

- [ ] Refactor CSS a archivos compartidos (`shared/theme.css` · `shared/signature-icons.css` · `shared/theme-loader.js`)
- [ ] Construir páginas de módulos (Workspaces · Mensajes · Biblioteca · Cursos · Chat · Calendar · Tutores · Empleo · Athena)
- [ ] Construir Dashboard estudiante (entrada post-login alternativa al orbit-u)
- [ ] Extensión Chrome Conniku (captura de apuntes/citas desde web)
- [ ] Endpoint "Conectar mi universidad" (OAuth institucional)
- [ ] Landing pública con Orbit-U visual identity
- [ ] Stack definitivo (Next.js + Tailwind o framework elegido)

---

## 10 · PARA RETOMAR EN UNA SESIÓN NUEVA

1. Leer este CONTEXT completo
2. Abrir `pages/orbit-u.html` + `pages/perfil.html` en navegador
3. Consultar `docs/INVENTARIO-MODULOS.md` para lógica de cada módulo
5. **NO** leer nada de `~/Desktop/_ARCHIVE-CONNIKU-2026/` para decisiones visuales

---

**Fin del contexto raíz. Proyecto independiente. Identidad propia: Orbit-U.**
