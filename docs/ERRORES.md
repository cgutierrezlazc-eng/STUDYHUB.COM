# Lista de errores · Postmortems

> Registro de errores en producción y su causa raíz, para no repetirlos.
> Formato: cada entrada con fecha, síntoma, causa raíz, fix, lección.

---

## 2026-04-25 · Backend caído en Render por imports asumiendo cwd=raíz del repo

**Síntomas observados (en este orden):**
1. `POST /contact` devuelve `404 Not Found` después del merge de PR #34.
2. Verificación con `/openapi.json` muestra que `/contact` no está registrado.
3. Logs de Render revelan: el server **nunca arranca** — crashea con `ModuleNotFoundError: No module named 'shared'` en `auth_routes.py:30`.
4. Hotfix #36 arregla `shared.legal_texts` → destapa segundo error: `ModuleNotFoundError: No module named 'backend'` en `constants/__init__.py:26`.

**Causa raíz (compartida entre ambos):**
El backend tenía imports escritos asumiendo que el cwd es la **raíz del repo** (donde sí existen los paquetes `shared/` y `backend/` como subdirectorios). En Render, el cwd es `backend/` mismo, así que `from shared.X` y `from backend.X` no resuelven.

**Por qué nadie lo notó antes:**
- En la máquina del dev, todo se corre desde la raíz del repo (`python backend/server.py` desde `/CONNIKU/`). En esa configuración los imports funcionan.
- Render NUNCA arrancó correctamente con estos imports — el backend llevaba caído desde que se introdujeron, pero nadie probaba endpoints en producción hasta `/contact`.

**Imports rotos (2 commits, 3 archivos):**
- `backend/auth_routes.py:30` → `from shared.legal_texts import ...` (introducido en bloque legal v3.2)
- `backend/constants/__init__.py:26,49` → `from backend.constants.X` (commit `6b1c123`, 2026-04-21)
- `backend/payroll_calculator.py:40,58` → `from backend.constants.X` (commit `7e3ec5b`, 2026-04-05)

**Fixes:**
- PR #36 (`hotfix-backend-shared-import`): cambia `shared.legal_texts.AGE_DECLARATION_HASH` → `constants.legal_versions.AGE_DECLARATION_TEXT_HASH` (hash idéntico verificado).
- PR #37 (`hotfix-backend-imports-cwd`): cambia `from backend.constants.X` → `from .X` (en `__init__`) y `from constants.X` (en `payroll_calculator`).

**Lección / regla de oro:**
> Todo import en `backend/**/*.py` debe ser **relativo al cwd `backend/`**. Nunca `from backend.X` ni `from shared.X`. Si necesitas algo de `shared/`, cópialo o muévelo dentro de `backend/`.

**Verificación recomendada antes de mergear cualquier cambio en backend:**
```bash
cd backend
python3 -c "
import sys
sys.path = [p for p in sys.path if not p.endswith('/CONNIKU')]
sys.path.insert(0, '.')
import server  # debe importar sin ModuleNotFoundError
"
```

**Pendiente:**
- Agregar el check anterior al pre-commit hook o a `Verify Full Stack` (CI), para que un import roto bloquee el push automáticamente.
