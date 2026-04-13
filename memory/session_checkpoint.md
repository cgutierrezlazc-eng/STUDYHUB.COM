# Session Checkpoint — 2026-04-13

## Estado actual
- Branch: main
- Último commit: `2e8eed2` — feat: mail→contabilidad (Feature C)
- Backend: Render (studyhub-api-bpco.onrender.com)
- Frontend: Vercel (conniku.com)

## Features completadas esta sesión
1. ✅ Boleta de Honorarios (botón en clases, base64 DB, email CEO, tab Mis Boletas)
2. ✅ Política de reembolsos completa (T&C gate, RefundRequest model, admin panel, TermsOfService expandido)
3. ✅ Online Users Widget (Admin stats tab, last_seen middleware)
4. ✅ CV Unificado compact summary (Profile.tsx)
5. ✅ Mail → Contabilidad (IMAP polling 30 min, pdfplumber, EmailDocument model, Admin tab Correo)

## Pendiente inmediato
- Quizzes dentro de asignatura (ALTA PRIORIDAD)
- Play Store: agregar 12+ testers, esperar 14 días, solicitar producción
- LMS universitario (diferido)

## Env vars nuevas requeridas en Render
- SMTP_PASS_CEO — ya debe existir para SMTP, se reutiliza para IMAP Zoho
