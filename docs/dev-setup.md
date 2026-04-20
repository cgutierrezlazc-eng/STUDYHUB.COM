# Setup de desarrollo local — Conniku

Este documento cubre la instalación mínima para poder ejecutar todos los
gates de verificación localmente, sin depender de CI para detectar errores.

## Prerrequisitos

- Node.js 20.x o superior
- Python 3.11 (no 3.12, por compatibilidad con dependencias actuales)
- Git con acceso al repositorio
- macOS, Linux o WSL2 en Windows

## Frontend (Node + Vite + Electron + Capacitor)

```bash
npm install
```

Esto instala todas las dependencias del frontend declaradas en
`package.json`, incluyendo Vite, React, Electron, Capacitor, Vitest,
ESLint y Prettier.

## Backend (Python + FastAPI + SQLAlchemy)

Se recomienda fuertemente usar entorno virtual para evitar que las
dependencias del proyecto se mezclen con las del sistema:

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate   # Linux/macOS
# .venv\Scripts\activate    # Windows

pip install -r requirements.txt
```

Si prefieres instalar sin venv (no recomendado, pero funcional):

```bash
python3.11 -m pip install -r backend/requirements.txt
```

## Comandos de verificación local

Antes de cada `git push`, ejecutar todos los gates que también corre el
CI. Si alguno falla local, también fallará en CI.

### Frontend

```bash
npm run typecheck   # TypeScript: tsc --noEmit
npm run lint        # ESLint: eslint src/
npm run test        # Vitest: vitest run
npm run build       # Vite build (chequea que produce output válido)
```

### Backend

```bash
npm run lint:backend                        # Ruff (lint Python)
python3.11 -m ruff format backend/ --check  # Ruff formato (opcional)
python3.11 -m pytest backend/ --tb=no -q    # Tests
```

### Atajo: todo de una vez

```bash
npm run verify   # typecheck + lint + test + ruff backend
```

Nota: `verify` no incluye `pytest` actualmente. Para cobertura completa
correr también el `pytest` manualmente.

## Tests que requieren dependencias opcionales

Algunos tests están marcados con `@pytest.mark.skipif` cuando su
dependencia no está disponible local. Por ejemplo:

- `test_collab_export_security.py` requiere `xhtml2pdf` y `weasyprint`.
- Otros pueden requerir `PostgreSQL` o `Redis`.

Si ves `SKIPPED` en el output de pytest, revisa la razón. CI ejecuta
todo con dependencias completas, así que tests skipeados en local **sí**
corren en CI.

Para ejecutarlos local, instalar manualmente:

```bash
pip install xhtml2pdf weasyprint
```

## Pre-commit hook (husky)

El repositorio usa Husky con `lint-staged`. Al hacer `git commit`, se
ejecutan automáticamente sobre los archivos staged:

- `eslint --no-warn-ignored` sobre `.ts / .tsx`
- `prettier --check` sobre `.ts / .tsx`
- `python3 -m ruff check` sobre `.py` del backend

Si alguno falla, el commit se aborta. Hay que arreglar la causa y
volver a commitear. **Nunca usar `--no-verify`** para saltarse el hook.

## Actualización de dependencias

Al actualizar `requirements.txt` o `package.json`:

1. Correr `npm run verify` (frontend) o `pytest` (backend) localmente.
2. Commitear el cambio con scope claro:
   - `chore(deps): bump react to 18.3`
   - `chore(deps-backend): bump ruff to 0.15.11`
3. CI debe pasar verde antes de merge.

## Verificación de que ruff está disponible local

```bash
python3.11 -m ruff --version
```

Debe imprimir la versión instalada (ej: `ruff 0.15.11`). Si imprime
`No module named ruff`, instalar con `pip install -r backend/requirements.txt`
o directamente `pip install ruff`.

## Troubleshooting

### "No module named ruff" / "No module named pytest"

Faltan dependencias de testing/linting. Ejecutar:

```bash
python3.11 -m pip install -r backend/requirements.txt
```

### Pre-commit falla con "ruff not found"

Lo mismo. Instalar dependencias backend.

### `vite build` supera warning de chunk size

Ver `docs/plans/rollout-design-v3-completo/plan.md` sección de
optimización de bundle, y verificar configuración de `manualChunks` en
`vite.config.ts`.

### Tests que solo fallan en CI pero no local

Puede ser por:
- Dependencias opcionales no instaladas local (ver arriba).
- Variable de entorno que existe en CI pero no local (revisar
  `.github/workflows/*.yml` y `.env.example`).
- Zona horaria distinta (CI usa UTC).
