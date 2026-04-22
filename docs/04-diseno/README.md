# 04 · Diseño — Conniku

**Última actualización:** 22 de abril de 2026  
**Versión del sistema visual:** v3 (rediseño editorial 19/04/2026)

---

## Estructura de carpetas

```
04-diseno/
├── brand/               → Especificación oficial del logo (LOGO-SPEC.md)
├── pantallas-v3/        → Pantallas HTML finales aprobadas (40 archivos)
├── instrucciones/       → Guías por módulo + reglas globales (27 archivos)
├── referencia/          → Diseños de referencia y módulos business (35 archivos)
├── propuestas-landing/  → Exploraciones de estilo de landing (13 archivos)
├── assets-personas/     → Avatares del cast de usuarios (7 personas)
├── mockups/             → Sistema de mockups (antiguo docs/design-system/)
├── previews/            → Prototipos exploratorios (antiguo docs/design-previews/)
└── CONTEXT.md           → Contexto general del proyecto de diseño
```

---

## Pantallas v3 finales (`pantallas-v3/`)

| Pantalla | Archivo |
|---|---|
| Logo oficial | `00-logo-oficial.html` |
| Landing pública | `02-landing-20260419-1650.html` |
| Auth / Login | `02-auth-20260419-1650.html` |
| Onboarding — Bienvenida | `02-bienvenida-20260419-1650.html` |
| Onboarding — Carrera | `02-carrera-20260419-1650.html` |
| Onboarding — Intereses | `02-intereses-20260419-1650.html` |
| Onboarding — Comunidades | `02-comunidades-20260419-1650.html` |
| Onboarding — Verificación | `02-verificacion-20260419-1650.html` |
| Dashboard estudiante | `03-dashboard-estudiante-20260419-1837.html` |
| Biblioteca | `04-biblioteca-20260419-1837.html` |
| Workspaces colaborativos | `05-workspaces-20260419-1837.html` |
| Perfil social | `06-perfil-social-20260419-1837.html` |
| Chat | `07-chat-20260419-1837.html` |
| Configuración | `08-configuracion-20260419-1837.html` |
| Cursos y diploma | `09-cursos-diploma-20260419-1837.html` |
| Tutores | `10-tutores-20260419-1837.html` |
| Classroom | `11-classroom-20260419-1837.html` |
| Oferta laboral | `12-oferta-laboral-20260419-1837.html` |
| Mi Universidad | `14-mi-universidad-20260419-1837.html` |
| Study Rooms | `16-study-rooms-20260419-1837.html` |
| Calendar | `18-calendar-20260419-1837.html` |

---

## Logo — Tokens oficiales

Especificación completa: [`brand/LOGO-SPEC.md`](./brand/brand/LOGO-SPEC.md)

| Token | Hex | Uso |
|---|---|---|
| `--ink` | `#0D0F10` | Texto "connik" · "u" inside tile |
| `--lime` | `#D9FF3A` | Fondo del u-pack tile |
| `--orange` | `#FF4A1C` | Punto final `.` |
| `--paper` | `#F5F4EF` | Texto sobre fondo oscuro |

**INVARIABLES:** Solo estos 4 colores · Sin gradientes · Sin filtros · Sin shadows

Assets SVG listos en `assets/branding/svg/`:
- `logo-tile.svg` — ícono de app (color)
- `logo-full.svg` — wordmark completo (sobre fondo claro)
- `logo-full-white.svg` — wordmark completo (sobre fondo oscuro)
- `logo-tile-mono-dark.svg` / `logo-tile-mono-light.svg` — versiones mono

---

## Instrucciones globales clave (`instrucciones/`)

| Archivo | Contenido |
|---|---|
| `00-BRAND-LOGO.md` | Especificación de marca y logo |
| `00-RULES-GLOBAL.md` | Reglas de diseño globales |
| `00-STACK.md` | Stack tecnológico del diseño |
| `00-CONNECTIONS-MAP.md` | Mapa de conexiones entre pantallas |
| `00-PEOPLE-AUTHORIZED.md` | Personas autorizadas a modificar |
| `00-README.md` | Introducción general |
| `02-landing-*.md` | Instrucciones módulo landing |
| `03-dashboard-*.md` … | Instrucciones por módulo |

---

## Cast de usuarios (`assets-personas/`)

Personajes consistentes para mockups y demos:

| Persona | Archivo |
|---|---|
| Felipe Gatica | `felipe-gatica.png` |
| Victoria Navarro | `victoria-navarro-pacheco.jpg` |
| Daniela Maturana | `daniela-maturana.jpg` |
| Pía Cisternas | `pia-cisternas.jpg` |
| Bárbara Escalona | `barbara-escalona.jpg` |
| Jennifer Ruiz | `jennifer-ruiz-babin.png` |
| Cristian Gutiérrez | `cristian-gutierrez.jpg` |
