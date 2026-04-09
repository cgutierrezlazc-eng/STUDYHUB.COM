# CONNIKU — Project Rules

## Stack
- **Frontend**: React 18 + TypeScript + Vite, deployed on Vercel (conniku.com)
- **Backend**: Python FastAPI, deployed on Render (studyhub-api-bpco.onrender.com)
- **AI**: Claude API (Anthropic) — model: claude-haiku-4-5-20251001 for chatbot/support
- **Email**: Zoho Mail (smtp.zoho.com:587) — noreply@, contacto@, ceo@conniku.com
- **Domain**: conniku.com (Vercel)

## Architecture
- Frontend: SPA with React Router, lazy-loaded pages, Sidebar + TopBar + RightPanel layout
- Backend: FastAPI with modular route files (hr_routes.py, etc.), SQLAlchemy ORM
- Auth: JWT tokens stored in localStorage
- WebSocket: real-time messaging via wsService
- PWA: Service Worker for offline + push notifications

## Key Conventions
- All UI text in Spanish (Chilean context)
- CSS variables for theming (--bg-primary, --accent, --text-primary, etc.)
- Pages receive `onNavigate` prop for navigation
- Lazy imports for all pages in App.tsx
- Backend env vars on Render, frontend env vars on Vercel

## Chilean Labor Law (HR Module)
- Live indicators from mindicador.cl API (UF, UTM, USD, IMM) with 1hr cache
- Payroll: cierre dia 22, pago ultimo dia habil del mes
- Dias 23-31 se arrastran al mes siguiente
- Anticipo quincenal: solo por solicitud del trabajador, desde 2do mes, max 40% del sueldo al cierre 22
- Progresion contratos: 1ro plazo fijo 30 dias -> 2do 60 dias -> 3ro indefinido
- CEO/RRHH puede saltar directo a indefinido
- Retenciones: AFP, Salud, AFC, Impuesto Unico 2da Categoria, Pension Alimentos, APV

## Self-Verification Protocol (MANDATORY)

Before EVERY action, Claude MUST complete these checks silently. If any check fails, STOP and inform Cristian.

### Before editing a file:
1. READ the file first — no exceptions
2. Confirm the function/component/variable you plan to modify actually exists at the line you think
3. If importing something, GREP to confirm the export exists in the source file

### Before referencing an API endpoint:
1. GREP the backend for the route (e.g., `@router.get("/hr/indicators")`)
2. GREP api.ts for the corresponding frontend call
3. If either is missing, say "this endpoint doesn't exist yet" — never pretend it does

### Before claiming something about the codebase:
1. If it's about a file → Glob to confirm it exists
2. If it's about a function/variable → Grep for it
3. If it's about a dependency → check package.json or requirements.txt
4. If you can't verify it → say "I'm not sure, let me check" instead of guessing

### Before modifying legal/payroll logic:
1. Read the existing CHILE_LABOR constants in HRDashboard.tsx
2. Cross-check any legal value (tax brackets, AFP rates, IMM) against the code's own references
3. Never change a legal value without citing the source law or decree

### Red flags — STOP and tell Cristian:
- You're about to reference a file path from memory without checking
- You're about to write code that calls a function you haven't verified exists
- You're about to state a legal requirement you can't find in the existing code or a specific law
- You feel uncertain but are about to present something as fact
- You're adding code that goes beyond what was explicitly requested

## Workflow Protocol (MANDATORY)

### Planificar antes de ejecutar
- Tareas no-triviales: usar Plan Mode ANTES de escribir codigo
- Cuando el plan este solido, preguntar a Cristian si proceder con ejecucion
- No escribir codigo sin plan aprobado en tareas que toquen mas de 2 archivos

### Comunicacion
- Despues de cada instruccion: hacer preguntas con OPCIONES SELECCIONABLES
- Si la instruccion es vaga: preguntar hasta que sea concreta
- Un mensaje = un objetivo claro

### Contexto
- Usar /compact despues de completar cada tarea confirmada
- No tocar nada que no haya sido explicitamente solicitado
- Lo que funciona NO SE TOCA

### Errores
- Cada error se registra abajo con fecha y prevencion
- No repetir un error documentado

## Error Log
<!-- YYYY-MM-DD | Que paso | Como evitarlo -->

## General Rules
- Keep commits atomic and descriptive
- Do not add features not explicitly requested
- Prefer editing existing files over creating new ones
- All UI text in Spanish (Chilean)
- When in doubt, ASK — don't guess
