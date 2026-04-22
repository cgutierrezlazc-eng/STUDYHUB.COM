# Estado Actual del Proyecto — Conniku SpA
## Punto de referencia: 22 de abril de 2026

**Mantenido por:** Tori (Asistente Interno)  
**Próxima actualización recomendada:** Después del merge a `main`  
**Rama activa de desarrollo:** `bloque-sandbox-integrity-v1`  
**Rama de producción:** `main` (último PR mergeado: #27 · bloque-contact-tickets-v1)

---

## 🟢 ¿Qué está funcionando hoy?

### Plataforma web — Frontend

| Módulo | Estado | Notas |
|---|---|---|
| Autenticación (login, registro, OAuth Google) | ✅ Activo | Gate de aceptación T&C activo |
| Dashboard estudiante | ✅ Activo | — |
| Dashboard tutor | ✅ Activo | Incluye boletas de honorarios |
| Biblioteca de recursos | ✅ Activo | — |
| Sistema de workspaces colaborativos | ✅ Activo | Lexical + Yjs |
| Salas de estudio (Study Rooms) | ✅ Activo | — |
| Tutorías (búsqueda, reserva, pago) | ✅ Activo | — |
| Cursos y diploma | ✅ Activo | — |
| Comunidades | ✅ Activo | — |
| Calendario | ✅ Activo | — |
| Chat / Mensajería | ✅ Activo | — |
| Videoconferencias | ✅ Activo | — |
| Sistema de quizzes | ✅ Activo | Hardening c3 aplicado |
| Perfil CV | ✅ Activo | — |
| Ofertas laborales | ✅ Activo | — |
| Pomodoro | ✅ Activo | — |
| Certificados | ✅ Activo | Verificación con hash |
| Notificaciones push | ✅ Activo | FCM |
| Bienestar (Wellness) | ✅ Activo | — |
| Extensión del navegador (sync) | ✅ Activo | — |
| Examen predictor (Asistente Virtual Athena) | ✅ Activo | Sin referencias a "IA" |
| AI Workflows internos | ✅ Activo | Solo uso interno/CEO |
| Mentoría | ✅ Activo | — |
| Landing page pública | ✅ Activo | Rediseño v3 aplicado |
| Suscripción (Free / Pro) | ✅ Activo | — |
| Checkout / Pagos | ✅ Activo | MercadoPago (CLP) + PayPal (USD) |
| Términos de Servicio (viewer) | ✅ Activo | v3.2.2 — actualizado hoy |
| Política de Privacidad (viewer) | ✅ Activo | v2.4.2 |
| Cookies (banner + policy) | ✅ Activo | v1.1.0 |
| Panel Admin (CEO) | ✅ Activo | Acceso restringido por rol |
| Panel RRHH | ✅ Activo | Nómina, contratos, FES |
| **Total páginas TSX** | **218 archivos** | — |

### Backend

| Área | Estado | Notas |
|---|---|---|
| API FastAPI | ✅ Activo | ~**594 endpoints** |
| Base de datos (PostgreSQL) | ✅ Activo | SQLAlchemy + migraciones auto |
| Autenticación JWT | ✅ Activo | Middleware activo |
| **Total módulos de rutas** | **~47 archivos `*_routes.py`** | — |
| Tests backend | ✅ Activo | **36 archivos de test** |
| Constantes legales Chile (labor_chile.py) | ✅ Activo | IMM, jornada, AFP, AFC, SIS |
| Registro legal de versiones | ✅ Activo | Hashes SHA-256, gate de re-aceptación |

### Integraciones externas

| Servicio | Función | Estado |
|---|---|---|
| MercadoPago | Pagos CLP (Chile) | ✅ Activo |
| PayPal | Pagos USD (internacional) | ✅ Activo |
| Supabase | Storage de archivos | ✅ Activo |
| Google OAuth | Login social | ✅ Activo |
| FCM (Firebase) | Notificaciones push | ✅ Activo |
| Anthropic (Claude) | Asistente Virtual Athena | ✅ Activo |
| Zoho | Email corporativo | ✅ Activo |
| Vercel | Hosting frontend | ✅ Activo |
| Render | Hosting backend | ✅ Activo |

---

## 🟡 ¿Qué está en progreso?

| Ítem | Rama | Estado |
|---|---|---|
| Auditoría de integridad y compliance 2026 | `bloque-sandbox-integrity-v1` | 🔄 **Activa hoy** |
| RIOHS — promulgación y envío a DT | — | ⚠️ Pendiente |
| Protocolo Ley Karin — firma del empleador | — | ⚠️ **Urgente (desde ago-2024)** |
| Contratos empleados — cláusula 42h Ley 21.561 | — | ⚠️ Urgente (antes 26/04) |
| Feature GeoGebra / calculadora matemática | — | 📋 En backlog |

---

## 🔴 ¿Qué está bloqueado o pendiente crítico?

| # | Urgencia | Ítem | Responsable |
|---|---|---|---|
| 1 | 🚨 **Inmediato** | Protocolo Ley Karin firmado por Conniku SpA (infracción desde 01/08/2024) | Cristian + Abogado |
| 2 | 🔴 **Antes 26/04/2026** | Verificar contratos de empleados vs escalón 42h | Cristian + Abogado |
| 3 | 🟡 **Esta semana** | Abogado aprueba Arts. 33bis, 33.4-33.5 (T&C v3.2.2) | Abogado |
| 4 | 🟡 **Esta semana** | RIOHS promulgar y enviar a Inspección del Trabajo | Cristian + Abogado |
| 5 | 🟡 **Esta semana** | Confirmar IMM $539.000 no requiere addendum contratos | Abogado |
| 6 | 🟢 **Noviembre 2026** | Adecuación completa Ley 21.719 (protección datos) | Abogado |
| 7 | 🟢 **Antes del lanzamiento** | Push al repositorio y merge `bloque-sandbox-integrity-v1` → `main` | Cristian |

---

## 📋 Correcciones aplicadas hoy (22/04/2026)

### Bloque A — Nómina · commit `f2ac9fb`
- IMM corregido: ~~$500.000~~ → **$539.000** (Ley 21.751 · vigente desde 01/01/2026)
- AFC tope imponible: ~~122,6 UF~~ → **135,2 UF** (Sup. Pensiones · feb-2026)
- SIS tasa empleador: ~~1,41%~~ → **1,54%** (Sup. Pensiones · ene-2026)

### Bloque B — Ley Karin · commit `bd4d939`
- T&C v3.2.2: Art. 33.4, 33.5 y nuevo Art. 33bis (Política de Ambiente Seguro)
- Referencia expresa a Ley 21.643 en contrato de tutores
- Canal de denuncias: seguridad@conniku.com

### Bloque E — Jornada automática · commit `3e5d74a`
- Jornada laboral: ~~"45 horas" hardcodeado~~ → calculada en tiempo real
- Backend devuelve escalón vigente según fecha del sistema
- Próximo escalón automático: **42h desde 26/04/2026 · 40h desde 26/04/2028**

### Bloque C — Registros de versión · commit `4a4d9eb`
- `legal_versions.py`: TOS_VERSION `3.2.0` → `3.2.2`, hash actualizado
- `documentRegistry.ts`: terms version + sha256, privacy sha256
- `terms.md` frontmatter: version `3.2.0` → `3.2.2`, hash real calculado

### Bloque D — Paquete abogado · commit `7cb5e69`
- Documento resumen para el abogado: `02-legal/para-abogado/2026-04-22-paquete-abogado.md`

### Reorganización docs · commit `34caae2`
- 231 archivos reorganizados en estructura numerada `01-` a `05-`
- Índice maestro `docs/README.md` creado
- Rutas backend actualizadas (`docs/legal/v3.2/` → `docs/02-legal/vigentes/`)

---

## 🏗️ Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Estilos | CSS Modules (sin Tailwind) |
| Editor colaborativo | Lexical + Yjs |
| Backend | Python 3.11 + FastAPI + SQLAlchemy |
| Base de datos | PostgreSQL |
| Mobile | Capacitor (iOS + Android) |
| CI/CD | Husky + lint-staged + Prettier + ESLint + Ruff |

---

## 📁 Estructura del repositorio (nivel alto)

```
CONNIKU/
├── src/            → Frontend React (218 archivos TSX)
├── backend/        → API Python FastAPI (47 módulos de rutas)
├── docs/           → ← TODA LA DOCUMENTACIÓN (reorganizada hoy)
├── assets/         → Logo, íconos, branding
├── CLAUDE.md       → Instrucciones para el asistente
├── FROZEN.md       → Archivos protegidos (no modificar)
├── BLOCKS.md       → Historial de bloques de desarrollo
└── MOBILE_RELEASE_GUIDE.md → Guía de publicación móvil
```

---

## 🔐 Estado legal (documentos públicos vigentes)

| Documento | Versión | SHA-256 (parcial) | Vigente desde |
|---|---|---|---|
| Términos de Servicio | **3.2.2** | `b2b834b6...` | 22/04/2026 |
| Política de Privacidad | **2.4.2** | `cc933274...` | 23/04/2026 |
| Política de Cookies | **1.0.0** | `80d41f71...` | 21/04/2026 |
| Declaración de Edad | **1.0.0** | `61dab2ec...` | 21/04/2026 |

---

## 📅 Próximos hitos

| Fecha | Hito |
|---|---|
| **26/04/2026** | Escalón 42h/semana Ley 21.561 — **automático en el sistema** |
| **ASAP** | Merge `bloque-sandbox-integrity-v1` → `main` |
| **Semana del 28/04** | Envío documentos al abogado para revisión |
| **Mayo 2026** | Lanzamiento público (~3 semanas desde hoy) |
| **01/12/2026** | Entra en vigor Ley 21.719 (nueva ley de datos personales) |
| **26/04/2028** | Escalón 40h/semana Ley 21.561 — **automático en el sistema** |
