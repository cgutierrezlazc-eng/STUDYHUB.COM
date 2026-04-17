Ejecuta verificacion completa del proyecto CONNIKU. No modifica nada — solo reporta errores.

## Instrucciones:
1. **TypeScript** — Correr `npx tsc --noEmit` y reportar errores
2. **Vite Build** — Correr `npx vite build` en modo dry-run y reportar errores
3. **Python Syntax** — Correr `python3 -m py_compile` en CADA archivo .py del backend/
4. **Ruff** — Si ruff esta instalado, correr `ruff check backend/` y reportar
5. **ESLint** — Si eslint esta instalado, correr `npx eslint src/` y reportar
6. **FROZEN.md** — Leer y mostrar cuantos archivos estan congelados

## Formato del reporte:
```
VERIFICACION CONNIKU — [fecha]
================================
TypeScript:  [OK / X errores]
Vite Build:  [OK / X errores]
Python:      [OK / X errores]
Ruff:        [OK / X warnings]
ESLint:      [OK / X warnings]
Frozen:      [X archivos protegidos]
================================
RESULTADO:   [LIMPIO / X PROBLEMAS]
```

Si hay errores, listar cada uno con archivo y linea.
