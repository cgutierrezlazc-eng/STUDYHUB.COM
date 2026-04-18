---
description: Ejecuta verificación completa del proyecto Conniku. TypeScript, ESLint, Ruff, Mypy, Pytest, Vite build. Reporta errores consolidados.
allowed-tools: Bash
---

Ejecuta verificación completa del proyecto. A diferencia de
post-edit-verify.sh (que verifica solo el archivo editado), este
comando valida el proyecto completo. Es más lento pero más exhaustivo.

Usar antes de commit, antes de merge, o cuando se requiere sanity
check general del estado del código.

## Cuándo usar /verify

- Antes de hacer commit (validar que el diff es limpio)
- Antes de marcar una tarea como terminada (junto con /audit)
- Cuando sospechas que hay regresión en código que no tocaste
- Cuando el truth-auditor lo solicita
- Periódicamente si has hecho muchas ediciones sin verificación

## Verificaciones que se ejecutan

El comando ejecuta las siguientes validaciones en orden. Si alguna
falla, continuar con las demás y reportar todas al final (no detenerse
en el primer error).

### 1. TypeScript

```
npx tsc --noEmit 2>&1
```

Reportar:
- Cantidad de errores
- Archivos afectados (si son pocos)
- Si hay errores preexistentes (registrados en deuda técnica),
  distinguirlos de errores nuevos

### 2. ESLint

```
npx eslint src/ 2>&1
```

Reportar:
- Cantidad de errores
- Cantidad de warnings
- Warnings nuevos versus preexistentes

### 3. Ruff check (Python lint)

```
ruff check backend/ 2>&1
```

Reportar:
- Cantidad de errores
- Categorías principales de error (E, F, I, etc.)
- Si ruff no está instalado, warning y continuar

### 4. Ruff format (Python format)

```
ruff format --check backend/ 2>&1
```

Reportar:
- Archivos que necesitan reformateo
- Comando sugerido para corregir: `ruff format backend/`

### 5. Mypy (Python typecheck)

```
mypy backend/ 2>&1
```

Reportar:
- Cantidad de errores de tipo
- Módulos con más errores
- Si mypy no está instalado, warning y continuar

### 6. Pytest (Python tests)

```
pytest backend/ -q --no-header 2>&1
```

Reportar:
- Cantidad de tests pasados
- Cantidad de tests fallados
- Tests que retornan error (no solo assertion falsa, sino excepción)
- Tiempo total de ejecución

### 7. Vite build (frontend build de producción)

```
npx vite build 2>&1
```

Reportar:
- Build exitoso o fallido
- Tiempo de build
- Tamaño del bundle resultante (si build exitoso)
- Errores si build fallido

### 8. Frontend unit tests

```
npm test -- --run 2>&1
```

(El flag `--run` fuerza ejecución sin watch mode)

Reportar:
- Cantidad de tests pasados / fallados
- Tiempo de ejecución

## Formato del reporte consolidado

Al finalizar todas las verificaciones, presentar reporte en formato:

```
VERIFICACION CONNIKU - 2026-04-17 09:15
==========================================

TypeScript:     OK (0 errores)
ESLint:         OK (0 errores, 2 warnings preexistentes)
Ruff check:     OK (0 errores)
Ruff format:    OK
Mypy:           2 errores nuevos (ver detalle abajo)
Pytest:         142 pasados, 3 fallados
Vite build:     OK (3.2s, 1.4 MB)
Npm test:       87 pasados, 0 fallados

==========================================
RESULTADO: WARN (mypy + pytest con problemas)

DETALLES:

Mypy errores:
  backend/hr_routes.py:245: Incompatible return type ...
  backend/payment_service.py:89: Argument type ...

Pytest fallados:
  test_subscription.py::test_retract_within_10_days
  test_hr_compliance.py::test_afp_deduction
  test_auth.py::test_token_expiry

RECOMENDACIONES:
  1. Corregir errores de mypy antes de commit
  2. Investigar tests fallados (pueden indicar regresión)

==========================================
```

## Interpretación del resultado

Tres posibles resultados:

- **OK (0 errores nuevos)**: el proyecto pasa todas las verificaciones.
  Puede proceder a commit o merge.
- **WARN (errores menores)**: problemas en alguna verificación pero no
  crítica. Evaluar si corregir ahora o registrar como deuda técnica.
- **FAIL (errores críticos)**: build roto, tests fallados masivamente,
  typecheck con errores graves. No proceder a commit hasta resolver.

## Notas

- El comando puede tardar 30-90 segundos dependiendo del tamaño del
  proyecto. Es normal.
- Si alguna herramienta no está instalada (ruff, mypy), el comando
  continúa reportando "no disponible" para esa verificación pero
  ejecuta las demás.
- El truth-auditor ejecuta estas mismas verificaciones como parte
  de su protocolo. Si /verify pasa, el truth-auditor probablemente
  también pasará en esa dimensión.
