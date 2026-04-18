# Plan de Fase 2: limpieza selectiva

Basado en inventario de Fase 1 completado el 17 de abril de 2026.

## A RESCATAR (se mueve a carpeta de referencia del sistema nuevo)

### Contexto del proyecto
- Del CLAUDE.md viejo: stack, URLs, convenciones chilenas, Ley Laboral Chilena,
  registro histórico de errores, prohibición de mencionar IA en UI
- memory/project_pending_tasks.md íntegro
- memory/session_checkpoint.md íntegro

### Slash-commands de .claude/commands/
- audit.md (ampliar con salida cruda de comandos)
- freeze.md (mantener íntegro)
- unfreeze.md (mantener íntegro)
- status.md (mantener íntegro)
- verify.md (ampliar con ruff format, mypy, tests)

### Hook reutilizable
- .claude/hooks/check-frozen.sh (funcional, se mantiene)

## A ARCHIVAR SIN REVISAR (basura inofensiva)

### Archivos sueltos en raíz
- code-reviewer.md (superado por nuevo sistema)
- debugger.md (superado por nuevo sistema)

### HTML de preview sueltos en .claude/
- cert-preview.html
- collab-editor-preview.html
- profile-preview.html

### Scripts sueltos en .claude/
- serve.js
- start-backend.js
- launch.json

### Hooks incompletos
- check-syntax-backend.sh (reemplazar por post-edit-verify.sh)
- check-syntax-frontend.sh (reemplazar por post-edit-verify.sh)

## A BORRAR DESPUÉS DE BACKUP (peso muerto estructural)

### Worktrees de Claude
- .claude/worktrees/elastic-goodall (peso combinado: 693 MB)
- .claude/worktrees/kind-fermat-e17480
- .claude/worktrees/trusting-bouman

Razón: cada worktree es una copia completa del proyecto con su propio
node_modules. Fueron la causa raíz del "drift entre dos Konni". Se eliminan
con git worktree remove para no romper índice de git.

## A REEMPLAZAR

### CLAUDE.md
Se reescribe limpio preservando solo contexto del proyecto, sin sección de
agentes ficticios. El nuevo CLAUDE.md va a ser la mitad del tamaño actual.

### .claude/settings.json
Reemplazar por el del paquete nuevo con hooks activos que bloquean, no solo
reportan.

### settings.local.json
Investigar por qué pesa 50 KB y limpiar. No es versión del sistema.

## A MANTENER INTOCABLE

### Código de producto
- src/ completo
- backend/ completo
- public/
- android/ (Capacitor)
- electron/
- extension/
- supabase/ (si existe)

### Archivos de configuración del proyecto
- package.json (solo se agrega sección husky/lint-staged)
- package-lock.json
- tsconfig.json
- vite.config.ts
- vercel.json
- render.yaml
- ruff.toml
- eslint.config.mjs
- capacitor.config.ts

### Documentación legítima
- README.md
- MOBILE_RELEASE_GUIDE.md
- FROZEN.md

### Directorios útiles
- docs/
- scripts/
- shared/

## A INVESTIGAR ANTES DE DECIDIR

### --version (archivo suelto en raíz)
Aparece en el listado inicial pero no sabemos qué es. Leerlo antes de decidir.

### make_videos.py y los tres .mp4 de promo
Podrían ser assets legítimos de marketing. Confirmar antes de archivar.

### escrito.pdf
Archivo PDF suelto en raíz. Confirmar qué es.

### Capturas de pantalla del 5 y 6 de abril
Pueden ser evidencia útil o basura. Decidir caso por caso.

