# Conniku

**La plataforma universitaria todo-en-uno.** Estudio inteligente, comunidad académica y desarrollo profesional para estudiantes universitarios de América Latina.

> **Estado:** En construcción activa — no disponible públicamente aún.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Backend | FastAPI (Python 3.11) |
| Base de datos | PostgreSQL (producción) / SQLite (desarrollo local) |
| Deploy frontend | Vercel |
| Deploy backend | Render |
| Colaboración | Yjs + WebSockets |
| IA / Asistente Virtual | Anthropic Claude (Athena) |
| Pagos | MercadoPago (CLP) + PayPal (USD) |
| Autenticación | JWT + Google OAuth |

---

## Estructura del proyecto

```
CONNIKU/
├── backend/              # FastAPI — 40+ routers, lógica de negocio
│   ├── migrations/       # Migraciones SQL (ejecutar en orden documentado)
│   ├── constants/        # Constantes laborales chilenas (UF, UTM, AFP...)
│   └── server.py         # Punto de entrada + registro de routers
├── src/                  # React frontend (TypeScript)
│   ├── pages/            # Páginas principales
│   ├── components/       # Componentes reutilizables
│   ├── services/         # API client, auth, WebSockets
│   └── admin/            # Módulos de administración (HR, payroll, CEO)
├── shared/               # Código compartido Python ↔ TypeScript (textos legales)
├── docs/
│   ├── 01-proyecto/      # Estado actual, pendientes, decisiones
│   ├── 02-legal/         # Documentos legales vigentes y borradores
│   ├── 03-tecnico/       # Arquitectura, registry de issues
│   ├── 04-diseno/        # Pantallas v3 y guías de diseño
│   └── 05-reportes/      # Sesiones de trabajo y auditorías
├── FROZEN.md             # Archivos protegidos contra edición directa
├── BLOCKS.md             # Historial de bloques de desarrollo cerrados
├── render.yaml           # Configuración de deploy en Render (backend)
└── vercel.json           # Configuración de deploy en Vercel (frontend)
```

---

## Levantar el proyecto localmente

### Requisitos
- Node.js 20+
- Python 3.11+
- Git

### Frontend

```bash
npm install
npm run dev
# → http://localhost:5173
```

### Backend

```bash
cd backend
pip install -r requirements.txt
cp ../.env.example ../.env.local
# Editar .env.local con tus credenciales locales
python server.py
# → http://localhost:8899
```

### Variables de entorno

Copia `.env.example` y completa los valores. Las variables marcadas `sync: false` en `render.yaml` deben configurarse manualmente en el dashboard de Render.

Variables mínimas para desarrollo local:
```
DATABASE_URL=          # vacío = SQLite automático
JWT_SECRET=dev-secret-local
ANTHROPIC_API_KEY=sk-ant-...
FRONTEND_URL=http://localhost:5173
```

### Migraciones de base de datos

```bash
# Las migraciones se ejecutan automáticamente en cada startup via migrations.py
# Si es una BD nueva, el orden correcto es:
# 1. add_user_agreements_table.sql
# 2. add_cookie_consents_table.sql
# 3. add_document_views_table.sql
# 4. add_workspaces_tables.sql
# 5. add_contact_tickets_table.sql
# 6. add_expense_fields.sql
# 7. add_pseudonymized_at_utc_to_cookie_consents.sql
```

---

## Tests

```bash
# Frontend
npm test

# Backend
cd backend && pytest

# Verificar sincronía de textos legales
bash scripts/verify-legal-texts-sync.sh
```

---

## Módulos principales

| Módulo | Estado | Descripción |
|---|---|---|
| Autenticación | ✅ Producción | JWT + Google OAuth + verificación de edad |
| Workspaces | ✅ Producción | Editor colaborativo Lexical + Yjs + Athena IA |
| Biblioteca | ✅ Producción | PDF reader + búsqueda + integración Gutenberg |
| HR Dashboard | ✅ Producción | Gestión empleados, liquidaciones, documentos legales |
| Cursos / Diplomas | ✅ Producción | LMS completo con quizzes y certificados |
| Comunidades | ✅ Producción | Grupos académicos + eventos |
| Checkout | ✅ Producción | PCI-DSS compliant — redirige a MercadoPago / PayPal |
| Configuración | 🔨 En desarrollo | Pantalla de ajustes de cuenta (diseño v3 listo) |
| CEO Business | 🔨 En desarrollo | CRM, Contabilidad, Inventario, Ventas (diseños listos) |
| GeoGebra | 📋 Backlog | Calculadora matemática interactiva |

---

## Flujo de desarrollo

El proyecto usa un sistema de **bloques de desarrollo** documentado en `BLOCKS.md`.

```
1. Crear rama: git checkout -b bloque-nombre-v1
2. Desarrollar en la rama
3. TypeScript 0 errores: npx tsc --noEmit
4. ESLint + Prettier: npx prettier --write src/...
5. Tests pasan: npm test
6. Revisión
7. Merge a main
```

Los archivos críticos están protegidos en `FROZEN.md`. Cualquier modificación a un archivo frozen requiere autorización explícita.

---

## Cumplimiento legal (Chile)

- **Ley 19.628** — Protección de datos personales
- **Ley 21.561** — Reducción jornada laboral (42h vigente desde 26/04/2026)
- **Ley Karin** — Protocolo de prevención del acoso
- **PCI-DSS** — Checkout no almacena ni procesa datos de tarjeta
- **Reglamento de Menores** — Verificación de edad ≥ 18 en registro

Los documentos legales viven en `docs/02-legal/vigentes/` con hashes SHA-256 sincronizados automáticamente.

---

## Contacto

- Soporte: soporte@conniku.com
- CEO: ceo@conniku.com
