# Reporte Explore — Inventario exhaustivo del código Conniku

**Fecha**: 2026-04-17 · **Agente**: Explore (very thorough) · **Scope**: `/Users/cristiang./CONNIKU`
**Operación**: descubrimiento total, solicitada por Cristian para tener referencia real del estado del proyecto.

---

## 1. FRONTEND

### 1.1 Estructura `/src`

```
src/
├── pages/                  # Componentes de página (lazy-loaded vía React Router)
├── components/             # Componentes reutilizables
├── admin/                  # Panel administrativo + módulos HR/Finance/Legal
├── services/               # APIs, autenticación, WebSocket, i18n
├── hooks/                  # Custom React hooks
├── types/                  # Definiciones de tipos TypeScript
├── styles/                 # CSS global y temas
├── data/                   # Datos estáticos (universidades)
└── utils/                  # Utilidades varias
```

### 1.2 Páginas en `/src/pages/` (48 totales)

| Página | Archivo | Funcionalidad |
|--------|---------|---------------|
| Dashboard | `Dashboard.tsx` | Hub central: proyectos, actividad, calendario, onboarding, stats |
| Biblioteca | `Biblioteca.tsx` | Repositorio con búsqueda, lectura, caché prefetch múltiples fuentes |
| ProjectView | `ProjectView.tsx` | Proyecto individual, documentos, chat IA, análisis |
| Courses | `Courses.tsx` | Catálogo cursos estáticos, lecciones, quizzes, certificados |
| Quizzes | `Quizzes.tsx` | Preguntas generadas IA, evaluación, historial |
| StudyPaths | `StudyPaths.tsx` | Roadmaps académicos personalizados |
| StudyRooms | `StudyRooms.tsx` | Espacios colaborativos con WebSocket |
| GroupDocs + GroupDocEditor | Editor Yjs + Tiptap, colaboración en vivo |
| Calendar | `Calendar.tsx` | Eventos, tareas, integraciones |
| Messages | `Messages.tsx` | Chat directo con WebSocket, historial |
| Friends | `Friends.tsx` | Amistades, solicitudes, bloques |
| Communities + CommunityView | Grupos por carrera/interés, feed, moderación |
| Mentorship | `Mentorship.tsx` | Conexión estudiante-mentor |
| Jobs | `Jobs.tsx` | Bolsa de trabajo, reclutamiento |
| TutorDirectory | Catálogo tutores titulados |
| MyTutorDashboard | Panel tutores: clases, ingresos, horario |
| Conferences | `Conferences.tsx` | Eventos en vivo, transcripción |
| Events | `Events.tsx` | Calendario de eventos, RSVP |
| Suggestions | `Suggestions.tsx` | Sugerencias personalizadas IA |
| Gamification | `Gamification.tsx` | XP, ligas, badges, streaks |
| Profile + UserProfile | Perfil propio/ajeno, stats, showcase |
| CVProfile | CV interactivo con plantillas, descarga PDF |
| Search | `Search.tsx` | Búsqueda global, resumen IA, descarga biblioteca |
| MiUniversidad | Panel específico universidad |
| Marketplace | Venta/compra apuntes |
| Subscription | Planes FREE/PRO/MAX |
| Checkout | Integración MercadoPago/PayPal |
| CertVerify | Validación certificados |
| AIWorkflows | Acceso a Konni admin |
| Admin + AdminPanelRoutes | Dashboard admin raíz |
| CeoDashboard | Financiero, KPIs, moderación |
| CeoMail | Gestor inbox CEO (3 cuentas Zoho) |
| HRDashboard | Empleados, nómina, contratos, SII |
| Landing + LandingProposals | Home público |
| Login + Register | Autenticación |
| DeleteAccount | Borrado GDPR |
| SupportPage | Chat Konni + FAQ |
| InfoPages | About, Enterprise, Safety, Accessibility, Careers |
| TermsOfService + PrivacyPolicy | Legal binding |
| NotFound | 404 fallback |

### 1.3 Componentes reutilizables (36)

Sidebar, SidebarIcons, TopBar, MobileBottomNav, RightPanel, CommandBar, NotificationBell, Onboarding, OnboardingWizard, WelcomeModal, ErrorBoundary, PWAInstallPrompt, AppAvailableBanner, StreakBanner, MilestonePopup, CelebrationModal, FocusMode, RitualScreen, UpgradeModal, TierGate, NewProjectModal, CoverPhotoModal, ForgotPassword, SEOHead, TermsOfService (modal), SupportChat, PDFReader, CollabEditor, ChatMessageRenderer, ExecutiveShowcase, EmployeeDocumentsDrawer, PostClassExam, Icons, AdSlot.

### 1.4 Dependencias principales

**Capacitor**: core 8.3.0 + android + ios + 10 plugins nativos
**UI**: Radix UI (9 primitivos), lucide-react 1.7, framer-motion 12.38
**Editor colaborativo**: Tiptap 3.22 + Yjs 13.6 + y-websocket 3.0 + y-prosemirror 1.3
**Docs**: pdfjs-dist 5.4, katex 0.16, lowlight 3.3, dompurify 3.4
**Core**: react 18.2, react-dom 18.2, react-router-dom 6.21, typescript 5.3, vite 5.0

### 1.5 Servicios (`/src/services/`)

- `api.ts` — Cliente HTTP fetch, JWT, reintentos
- `auth.tsx` — Context React, login, registro, sesión
- `capacitor.ts` — Abstracción native APIs
- `i18n.tsx` — Internacionalización (30+ idiomas)
- `websocket.ts` — Gestor WebSocket
- `useOnlineCount.ts` — Hook usuarios online

### 1.6 Hooks (`/src/hooks/`)

- `useDevice.ts` — Detección tipo dispositivo
- `useFocusMode.ts` — Estado Focus Mode
- `useTier.ts` — Subscription tier usuario actual

### 1.7 Temas (6 variantes en `global.css`)

1. **Sereno** (default light) — #2563EB, beige cálido
2. **Nocturno** (dark) — GitHub dark, #58A6FF
3. **Cálido** — Warm dark, tonos naranja, #60A5FA
4. **Profesional** — Green forest, #16A34A
5. **Océano** — Deep blue, #38BDF8
6. **Conniku** (brand) — #070D18 dark, #2D62C8

Variables CSS semánticas: `--bg-primary`, `--text-primary`, `--accent`, etc.

### 1.8 Admin modules (`/src/admin/`)

- `finance/` — 8 tabs: Analytics, CEO Overview, Financial, Gastos, Impuestos, Presupuestos, Contabilidad, Facturación
- `hr/` — 13 tabs: Personal, Remuneraciones, Asistencia, Vacaciones, Contratos, Previred, Desempeño, Capacitación, Documentos, Finiquitos, HistorialPagos, InspeccionTrabajo, Onboarding, ReclutamientoTalento, AccessControl
- `legal/` — 3 tabs: Legal, Compliance, Fraud
- `payroll/` — DJ1887, Libro Remuneraciones
- `tools/` — Certifications, PushNotifications, TutoresExternos, BibliotecaDocumentos, OwnerGuide, CeoEmailModule, ContactoEmailModule
- `modules/personas/` — DirectorioPersonal, GestionUsuarios, PersonasHub, PortalTrabajador
- `shared/` — Constants (ChileLaborConstants.ts, accountingData.ts), tipos, estilos

---

## 2. BACKEND

### 2.1 Estructura `/backend`

70 archivos Python, ~54.700 líneas totales.

### 2.2 Archivos `*_routes.py` (41)

admin, ai_detection, ai_workflow, auth, biblioteca, calendar, certificate, chile_tax, collab, community, conference, course, cv, email_doc, event, exam_predictor, extension_sync, hr, job, lms, marketplace, mentorship, mercadopago, messaging, moderation_queue, news, notification, payment, paypal, pomodoro, push, quiz_system, referral, rewards, search, social, study_room, tutor, video, wellness, ws.

### 2.3 Totales estimados de endpoints por dominio

- auth_routes: 45 endpoints
- admin_routes: 38
- social_routes: 70+
- course_routes: 18
- job_routes: 32+
- mercadopago_routes: 7
- paypal_routes: similar
- biblioteca_routes: 20+
- hr_routes: 53 (FROZEN)
- chile_tax_routes: 7
- **Total estimado: 300+ endpoints activos**

### 2.4 Modelos SQLAlchemy (~90 tablas)

**Auth**: User (70+ campos), UserSession, ChatUsage
**Social**: Conversation, Message, ConversationFolder, Friendship, FriendList, WallPost, PostLike, PostReaction, PostComment, BlockedUser
**Moderación**: UserReport, ModerationLog, ModerationQueueItem
**Educativo**: Course, CourseLesson, LessonCompletion, CourseQuiz, QuizQuestion, UserQuizAttempt, Certificate
**Docs**: Project, ProjectDocument, SharedDocument, VideoDocument, DocumentEmbedding
**Estudio**: StudySession, StudyGuide, Flashcard, UserFlashcardProgress, Badge, UserBadge, League, UserLeague
**Salas**: StudyRoom, StudyRoomParticipant
**Eventos**: Event, EventAttendee, Conference, ConferenceParticipant
**Empleo**: JobListing, JobApplication, MentorshipRequest, MentorshipRelation, TutoringRequest, TuteContract
**Comunidad**: Community, CommunityMember, CommunityPost
**Marketplace**: MarketplaceItem, MarketplaceTransaction
**Pagos**: PaymentLog, Subscription, RefundRequest
**Otros**: News, NewsCategory, Notification, PushSubscription, ReferralCode, ReferralReward, ExamPrediction, Skill, SkillEndorsement, Bookmark, Poll, PollVote

### 2.5 Migraciones Alembic

**Realidad**: Alembic declarado en CLAUDE.md §88 pero NO instalado.
Solo existe 1 migración SQL plano: `backend/migrations/add_expense_fields.sql`. Resto de tablas se crean on-boot con `database.py` vía SQLAlchemy + `migrations.py` orquestador.

### 2.6 Servicios internos

- `ai_engine.py` — RAG ChromaDB + OpenAI GPT-4o-mini
- `konni_engine.py` — Claude Haiku 4.5 para chatbot
- `konni_tools.py` — Tools ejecutables por Konni (permisos 600)
- `document_processor.py` — OCR, PDF/DOCX/XLSX/PPTX parsing, embeddings
- `docx_generator.py` — Generador Word docs (nómina, contratos)
- `payroll_calculator.py` — Cálculo nómina Chile (AFP, salud, impuesto, bonos, descuentos, Pacto HE, Descuento Voluntario)
- `math_engine.py` — SymPy + Claude para explicaciones
- `moderation.py` — Claude Haiku para detección contenido
- `notifications.py` — SMTP Zoho Mail (3 cuentas)

### 2.7 Integraciones externas

| Servicio | Uso | Variables env |
|---|---|---|
| Anthropic Claude | Konni, moderación, math | `ANTHROPIC_API_KEY` |
| OpenAI GPT-4o-mini | AI Engine RAG, quizzes, guides | `OPENAI_API_KEY` |
| Zoho Mail SMTP | Email transaccional | `SMTP_HOST/PORT/PASS*` |
| Zoho IMAP | Inbox CEO→docs | `IMAP_HOST/PORT` |
| Google Search API | Búsqueda web | `GOOGLE_SEARCH_API_KEY/CX` |
| Bing Search API | Alternativa búsqueda | `BING_SEARCH_API_KEY` |
| MercadoPago | Pagos | `MP_ACCESS_TOKEN/PUBLIC_KEY/WEBHOOK_SECRET` |
| PayPal | Pagos alternativo | `PAYPAL_CLIENT_ID/SECRET/WEBHOOK_ID` |
| Chile SII | Boleta electrónica | `SII_RUT_EMISOR`, `SII_CERT_PATH` |
| ChromaDB | Vector store RAG | Local persistent |
| PostgreSQL | Producción | `DATABASE_URL` (Render) |
| Google OAuth | Login social | `GOOGLE_CLIENT_ID` (frontend + backend) |

### 2.8 Requirements.txt principales

FastAPI 0.128+, uvicorn 0.27+, SQLAlchemy 2.0.25, psycopg2-binary 2.9+, python-jose, bcrypt 4.0+, pydantic 2.0+, anthropic 0.40+, openai 1.0+, pdfplumber 0.10+, python-docx 1.1+, openpyxl 3.1+, python-pptx 0.6.23+, PyPDF2 3.0+, reportlab 4.1+, xhtml2pdf 0.2.11+, chromadb 0.4.22+, sympy 1.12+, mercadopago 2.2+, youtube-transcript-api 0.6+, feedparser 6.0+, beautifulsoup4 4.12+, apscheduler 3.10+, pywebpush 2.0+, google-auth 2.29+, matplotlib 3.8+.

---

## 3. INFRA Y TOOLING

### 3.1 GitHub Actions (`.github/workflows/`)

1. **verify-build.yml** — gate main branch, 6 capas: TS check, ESLint, Vite build, Ruff+Mypy, frozen protection, npm audit
2. **android-build.yml** — JDK 21 + Android SDK 36 → APK + AAB Play Store
3. **ios-build.yml** — Xcode + Swift → IPA App Store
4. **keep-alive.yml** — ping backend Render (evita sleep free tier)
5. **supabase-backup.yml** — backup diario a Backblaze B2 (3 AM Chile / 07:00 UTC)

### 3.2 Husky (`.husky/pre-commit`, 256 líneas)

3 verificaciones:
1. lint-staged (eslint + prettier frontend, ruff backend)
2. archivos FROZEN
3. sintaxis archivos críticos (JSON, bash, yaml)

### 3.3 Capacitor (`capacitor.config.ts`)

appId: `com.conniku.app`, webDir: `dist/renderer`
Plugins: SplashScreen, StatusBar, Keyboard, PushNotifications, Camera

### 3.4 Render (`render.yaml`)

Servicio `conniku-backend`, plan standard. DB `conniku-db` plan **free** (Render elimina DBs gratuitas inactivas).

### 3.5 Vercel (`vercel.json`)

buildCommand npm run build, outputDir dist/renderer, env VITE_API_URL.

---

## 4. ASSETS Y MOCKUPS

### 4.1 Mockups HTML principales en `/docs/`

- conniku-landing-proposal.html
- extension-popup-mockups.html
- konni-nav-mockup.html
- sidebar-design-mockup.html
- `mockups/` — 6 mockups numerados (01-command-bar hasta 06-focus-mode)
- `design-previews/` — 42 previews (admin, certificates, clases, design-alternatives, icons, landing, login, logo-drafts, mi-universidad, mobile, palettes, profile-layouts, sage-serenity, sidebar variants, signature, themes, video-storyboard)

### 4.2 Assets `/public/`

- Iconografía: icon-{16..1024}.png, apple-touch-icon, favicon
- Manifiestos: manifest.json PWA, robots.txt, sitemap.xml
- Service Workers: sw.js, sw-push.js (legacy, marcado para eliminar)
- Docs: manual-conniku.html, marketing-kit-conniku.html, offline.html

---

## 5. FEATURES IDENTIFICADAS

### 5.1 Estado madurez

**COMPLETAS (C)**: proyectos, biblioteca v2 (5 fases), chat IA proyecto, guías IA, quizzes, ejercicios, flashcards, cursos estáticos, certificados, rutas aprendizaje, chat directo, salas estudio, docs colaborativos Yjs, feed personalizado, muro, amistades, comentarios, reacciones, bookmarks, polls, hitos automáticos, listas amigos, hashtags, skills/endorsement, comunidades, XP+badges+ligas, racha, pomodoro, bolsa trabajo, reclutamiento, directorio tutores, dashboard tutores, contratos tutores, perfil universitario, CV interactivo, executive showcase (MAX), foto portada, autobio IA, visibilidad CV, búsqueda global, búsqueda web, descarga a biblioteca, resumen IA URLs, planes FREE/PRO/MAX, MercadoPago, PayPal, checkout clases, referrals, histórico pagos, reembolsos, Konni assistant, moderación IA, math solver, panel admin, gestión usuarios, CEO Dashboard, CEO Mail, HR Dashboard, cálculo nómina, docs legales HR, 6 temas, focus mode, onboarding, ritual matutino, celebraciones, command bar, SEO, pagination, i18n context, selección idioma, marketplace docs, transactions, Electron, Android APK, iOS, PWA, bottom nav, camera, push, storage local.

**PARCIALES (P)**: conferencias en vivo (WebRTC básico, transcripción async), tutoría peer, SII integración (requiere certificado PFX), predictor desempeño, transcripción video, detección IA Copyleaks, mood tracking (schema existe, UI incompleta), extension popup (mockup + backend parcial), wellness goals (tracking básico).

**SKELETON (S)**: meditation timers (endpoints ready, UI ausente), traducción documentos (backend ready, no integrado UI).

### 5.2 Deuda técnica detectada

- `payment_routes.py` Stripe legacy comentado pero presente (peso muerto)
- Migración SQL: solo 1, resto on-boot (sin versionado schema)
- Worktrees abandonados `.claude/worktrees/` (693 MB en inventario-reset.txt)
- `settings.local.json` pesado (50KB)
- Scripts husky legacy `check-syntax-*.sh` reemplazados por `verify-build.yml`
- API Base URL hardcoded en varios lugares

---

## 6. ESTADÍSTICAS CONSOLIDADAS

| Métrica | Valor |
|---|---|
| Páginas React | 48 |
| Componentes reutilizables | 36 |
| Endpoints API | 300+ |
| Tablas BD | 90+ |
| Archivos backend .py | 70 |
| Líneas backend | ~54.700 |
| Hooks custom | 3 |
| Temas visuales | 6 |
| Idiomas soportados | 30+ |
| Módulos admin | 6 |
| Workflows CI | 5 |
| Dependencias npm | 40+ |
| Dependencias Python | 34 |

---

## 7. APÉNDICE — Archivos FROZEN

- `.husky/pre-commit` (2026-04-14)
- `package.json` lint-staged section (2026-04-14)
- 9 páginas con null-safety fixes (Messages, Friends, Mentorship, GroupDocEditor, Dashboard, Communities, Conferences, UserProfile, Jobs) (2026-04-14)
- `.gitignore` iCloud rules (2026-04-14)
- `src/admin/tools/BibliotecaDocumentos.tsx` hooks order (2026-04-16)
- `src/pages/HRDashboard.tsx` completo (2026-04-16, 370 KB, 9 botones HR)
- `backend/hr_routes.py` completo (2026-04-16, 53 rutas + 3 generadores PDF legales)
