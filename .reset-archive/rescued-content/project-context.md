# Contexto del Proyecto Conniku

Documento de referencia con la información valiosa rescatada del sistema viejo
durante el reset del 17 de abril de 2026. Base para construir el CLAUDE.md
nuevo en Fase 3.

## Stack técnico

Frontend React 18 con TypeScript y Vite, desplegado en Vercel bajo el dominio
conniku.com. Backend Python con FastAPI, desplegado en Render bajo la URL
studyhub-api-bpco.onrender.com. Base de datos y autenticación con Supabase.
Asistente conversacional usando Claude API (Anthropic), modelo principal
claude-haiku-4-5-20251001 para chatbot y soporte. Email transaccional vía
Zoho Mail (smtp.zoho.com puerto 587) con cuentas noreply@, contacto@ y
ceo@conniku.com. Calidad: ESLint 9 con Prettier, Husky con lint-staged en
frontend; Ruff en backend.

La aplicación también tiene presencia móvil vía Capacitor para Android e iOS,
y aplicación de escritorio con Electron, además de una extensión de navegador.

## Arquitectura

Frontend SPA con React Router, páginas lazy-loaded, layout Sidebar más TopBar
más RightPanel. Backend FastAPI con archivos de rutas modulares (patrón
*_routes.py) y SQLAlchemy como ORM. Autenticación por JWT tokens almacenados
en localStorage. Mensajería en tiempo real vía WebSocket a través de
wsService. PWA con Service Worker para offline y push notifications. Móvil
con Capacitor compilando desde el mismo código web.

## Convenciones del proyecto

Todo texto de UI en español chileno (contexto de mercado principal: Chile).
Variables CSS para temas, usando tokens como --bg-primary, --accent,
--text-primary. Las páginas reciben prop onNavigate para navegación
declarativa. Imports lazy para todas las páginas en App.tsx. Variables de
entorno del backend viven en Render, las del frontend en Vercel.

**Regla crítica de producto:** nunca mencionar "IA", "AI" ni "inteligencia
artificial" en texto visible al usuario final. Reemplazar por "asistente
inteligente", "herramientas inteligentes", "automáticamente", "estudio
inteligente" según contexto. Esta decisión de producto aplica a interfaces,
copy de marketing y toda comunicación dirigida al usuario.

## Ley Laboral Chilena en el módulo RRHH

El módulo de Recursos Humanos de Conniku implementa la normativa chilena
específica. Indicadores económicos vivos (UF, UTM, USD, IMM) consumidos desde
mindicador.cl con caché de una hora. Nómina con cierre mensual el día 22 y
pago el último día hábil del mes; los días 23 a 31 se arrastran al periodo
siguiente. Anticipo quincenal solo bajo solicitud explícita del trabajador,
disponible desde el segundo mes de contrato, con máximo del 40 por ciento del
sueldo al cierre del día 22.

Progresión contractual estándar: primer contrato a plazo fijo por 30 días,
segundo contrato a plazo fijo por 60 días, tercer contrato indefinido. El
CEO o Recursos Humanos pueden saltar directo a indefinido con autorización
explícita.

Retenciones obligatorias calculadas: AFP, Salud, AFC (Seguro de Cesantía),
Impuesto Único de Segunda Categoría, Pensión de Alimentos cuando corresponda,
y APV (Ahorro Previsional Voluntario).

## Principios de trabajo rescatados del sistema viejo

Estas son reglas que el sistema viejo enunciaba como "obligatorias" pero que
fallaban por falta de mecanismos. En el sistema nuevo pasan a ser verificadas
mecánicamente por hooks y agentes, no por buena fe.

Leer archivos completos antes de editarlos. Verificar que funciones y
variables referenciadas existan antes de usarlas. Preferir ediciones aditivas
sobre reescribir código existente. Nunca afirmar "debería funcionar"; o se
probó y funciona, o se declara incertidumbre. Un cambio a la vez, verificar,
pasar al siguiente. Cero refactoring no solicitado: no renombrar variables,
no mover funciones, no "mejorar" código que funciona. Ante la duda,
preguntar en lugar de adivinar.

## Modelo por tipo de tarea

Opus para escribir o modificar código de lógica compleja, debug complejo,
lógica legal chilena, diseño UI detallado y decisiones de arquitectura.
Sonnet para exploración del codebase, planificación, code review,
investigación y documentación. Haiku para verificaciones rápidas: existencia
de archivos, grep simple, compilación, checks de bajo esfuerzo cognitivo.
Ya existe el skill model-router que automatiza esta selección.

## Registro histórico de errores

Errores documentados del sistema viejo, conservados como evidencia y como
lecciones aprendidas que el sistema nuevo debe prevenir.

9 de abril de 2026: Konni inventó un RUT personal de ejemplo en una
respuesta. Prevención: nunca inventar datos; si un dato es desconocido,
dejarlo vacío y pedir el dato real.

12 de abril de 2026: Konni subió un icono incorrecto a Play Console sin
verificar visualmente. Prevención: siempre mostrar visualmente cualquier
asset antes de subirlo, confirmar con el usuario.

12 de abril de 2026: Konni subió feature graphic de baja calidad sin
preguntar. Prevención: no tomar decisiones de diseño sin aprobación
explícita.

12 de abril de 2026: Konni buscó logos antiguos cuando el usuario ya había
adjuntado el correcto. Prevención: usar solo lo que el usuario proporciona,
no buscar alternativas por iniciativa propia.

## Lo que queda explícitamente fuera del sistema nuevo

La sección "Agentes Fiscalizadores" del CLAUDE.md viejo listaba ocho agentes
permanentes supuestamente activos (Ruff, Auditoría Python, Auditoría TS/React,
Legal, Prevención, Registro Issues, Usuario, Fiscalizador). Konni confesó
durante la auditoría que eran instrucciones markdown que dependían de su
propia disciplina, no procesos reales. En el sistema nuevo no se reproduce
esa ficción. Los controles reales viven en hooks de Claude Code que bloquean
físicamente, en pipeline de CI con gate de merge, en pre-commit de husky
efectivo, y en siete agentes especializados con protocolo de reporte
verificable.

La sección "Protocolo de Agentes" del CLAUDE.md viejo también queda
descartada porque se apoyaba en supuestos (el agente debe recibir tal cosa,
el agente no debe hacer tal otra) que no tenían mecanismo de aplicación. El
sistema nuevo encapsula estos principios en los prompts específicos de cada
uno de los siete agentes del paquete.

