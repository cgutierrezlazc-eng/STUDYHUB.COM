---
description: Invoca al code-reviewer para revisión adversarial del diff actual de la rama. Produce quality score numérico con banda PASS/WARN/FAIL y clasificación de hallazgos.
allowed-tools: Task
---

Invoca al agente `code-reviewer` para auditar el diff actual de la rama
de trabajo contra `main`. El agente revisa de forma adversarial ciega
(sin leer el plan original) y emite quality score con las 7 categorías
definidas en CLAUDE.md.

## Contexto

Esta revisión es útil:
- Antes de hacer commit para detectar problemas tempranamente
- Después de varios ciclos de builder para consolidar calidad
- Cuando hay duda sobre si el código está listo para pasar al
  truth-auditor
- Cuando se sospecha que un builder pudo haber introducido regresión

Esta revisión NO reemplaza al truth-auditor. El truth-auditor es capa
posterior que verifica las afirmaciones del code-reviewer con comandos
reales.

## Qué hace el agente code-reviewer

1. Ejecuta `git diff main...HEAD` para obtener el diff completo
2. Revisa por 7 categorías:
   - Seguridad (0-25 puntos)
   - Manejo de errores (0-15 puntos)
   - Null safety (0-15 puntos)
   - Convenciones (0-10 puntos)
   - Accesibilidad (0-10 puntos, solo si toca UI)
   - Tests (0-15 puntos)
   - Impacto sobre código existente (0-10 puntos)
3. Si el diff toca componente legal, aplica revisión legal extra
   (cualquier hallazgo ahí es bloqueante crítico)
4. Clasifica cada hallazgo: bloqueante, recomendado, nota
5. Calcula quality score total sobre 100
6. Emite banda: PASS (85+), WARN (65-84), FAIL (menor 65)
7. Lista al menos 3 confirmaciones positivas obligatorias
8. Emite reporte completo con 5 secciones

## Interpretación del resultado

- **PASS (85-100)**: diff puede proceder al truth-auditor
- **WARN (65-84)**: diff procede con observaciones. Abordar los
  recomendados dentro de 1 semana.
- **FAIL (menor 65)**: diff regresa al builder. Bloqueantes deben
  corregirse antes de volver a revisión.

Bloqueante crítico fuerza FAIL independiente del score numérico.

## Nota importante

Si el diff está vacío (rama sin cambios respecto a main), el agente
retornará indicando que no hay nada que revisar. Esto no es error; es
información válida.
