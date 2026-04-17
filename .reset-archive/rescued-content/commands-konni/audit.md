Audita todos los archivos modificados en la sesion actual. No modifica nada — solo reporta.

## Instrucciones:
1. Correr `git diff --name-only` para ver archivos modificados (no commiteados)
2. Correr `git diff --cached --name-only` para ver archivos staged
3. Para CADA archivo modificado:
   a. Verificar si esta en FROZEN.md → si esta, ALERTAR como critico
   b. Leer el archivo completo
   c. Verificar que compila/parsea sin errores
   d. Listar que funciones/componentes fueron tocados
   e. Verificar que imports existen en los archivos fuente
4. Leer `git diff` completo y analizar:
   - Hay codigo eliminado que podria causar errores en otro lugar?
   - Hay imports nuevos a modulos que no existen?
   - Hay funciones llamadas que no estan definidas?

## Formato del reporte:
```
AUDITORIA — [fecha]
========================
Archivos modificados: [N]
Archivos frozen tocados: [N] (ALERTA si > 0)

[Para cada archivo:]
- archivo.tsx: [OK / PROBLEMAS]
  - Funciones tocadas: [lista]
  - Imports verificados: [si/no]
  - Compila: [si/no]

RIESGO GENERAL: [BAJO / MEDIO / ALTO]
```
