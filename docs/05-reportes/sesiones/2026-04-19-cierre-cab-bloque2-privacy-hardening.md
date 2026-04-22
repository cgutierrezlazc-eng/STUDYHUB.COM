# Snapshot sesión 2026-04-19 — Secuencia CAB completa + Tori v2.1

**Branches mergeadas a main**: `hardening-c1-ssrf-v1` (PR #10), `hardening-quizzes-c3` (PR #11)
**Tags**: `v2.1-workspaces`, `v2.2-hardening`
**Commits totales en sesión**: ~15 atómicos

---

## Objetivo primario declarado

Secuencia CAB sin pausas del usuario:
- C: cerrar Bloque 2 Workspaces v1 formalmente
- A: publicación legal Privacy + T&C (con Athena + Export)
- B: hardening auth/quiz (C2 + C3 + C4 según pendientes.md)

## Resultado por fase

### C — bloque-2-workspaces-v1 ✅ CERRADO

- PR #10 mergeado en commit `de59165` tras fix de bloqueante CI
  (2 tests de spy C1 fallaban con AttributeError; eliminados por
  obsolescencia post-deprecado V1)
- Tag `v2.1-workspaces` pusheado a origin
- BLOCKS.md actualizado con fila completa
- 8 commits atómicos en el PR

### A — Privacy v2.3 publicada ✅ PARCIAL

Aplicado:
- 10 de 11 cambios al `src/pages/PrivacyPolicy.tsx`
- Bump v2.1 → v2.3
- Snapshot v2.1 archivado en `docs/legal/archive/`
- Commit `4a47be5`

Diferido (decisiones `1B 2C 3C` de Cristian):
- **Cambio H Privacy** (Anthropic no entrena con API data): requiere
  verificación de Cristian del contrato Anthropic vigente
- **T&C completo**: conflicto estructural entre `src/pages/TermsOfService.tsx`
  (corto, 13 secciones) y `src/components/TermsOfService.tsx` (largo,
  49 artículos). Diferido a bloque dedicado `legal-consolidation-v2`
- **v3.0 MAJOR re-aceptación**: requiere mecanismo técnico
  (modal + hash + backend) que no existe aún

### B — bloque-hardening-quizzes-c3 ✅ CERRADO

PR #11 mergeado en commit `489d12a`. Tag `v2.2-hardening`.

**Aplicación de §22 verificación de premisas redujo el bloque**:
- C2 (privilege escalation `update_me`): **FALSO POSITIVO** —
  Pydantic v2 descarta campos extras por default. Verificación
  empírica documentada en pendientes.md.
- C3 (trampa quiz): **CONFIRMADO**, fix Opción B aplicado con
  4 tests TDD. Servidor re-valida desde BD ignorando cliente.
- C4 (NameError línea 767): **SIN EVIDENCIA** — código actual no
  reproduce el bug. AST parsing OK.

**Sin §22, habría hecho 1-2h de fix innecesario para C2.**

---

## Meta — sistema operativo Tori v2 → v2.1

Auditoría del sistema en mitad de sesión detectó 4 fallas sistémicas.
Aplicadas 3 reglas nuevas + 2 implementaciones operativas:

### Nuevas reglas en CLAUDE.md

- **§22 Verificación de premisas** (OBLIGATORIO): antes de recomendar
  acción de alto blast-radius, ejecutar comandos de verificación y
  citar evidencia en la misma respuesta. Aplicado exitosamente en
  bloque B (ahorró tiempo en C2 falso positivo).

- **§23 Pre-flight CI local** (OBLIGATORIO): antes de `git push`
  ejecutar 6 gates (tsc + eslint + vitest + vite build + pytest + ruff).
  Implementado en `.claude/scripts/pre-flight.sh`. Aplicado exitosamente
  en B (detectó bug del propio script ANTES del push).

- **§24 Pre-commit prettier proactivo** (OPERATIVA): `npx prettier --write`
  antes de `git add` frontend. Regla de eficiencia, no de calidad.

### Refuerzo agentes

- `auditor-triple.md` reforzado con:
  - Criterio de activación explícito (5 condiciones AND)
  - Criterio anti-fraude con rechazos obligatorios
  - **Sunset 2026-05-03**: si uses < 3 → REMOVER como experimento fallido
  - Log de uso en `docs/metrics/auditor-triple-uses.log`

---

## Estado del proyecto post-sesión

### Commits en main (últimos 6)

```
0301d99 docs(blocks): cerrar bloque-hardening-quizzes-c3 (Capa 7)
489d12a Merge pull request #11 (security course C3)
9a12645 docs(pendientes): cerrar C2 (FP) + C3 (PR #11) + C4 (sin evidencia)
016f5ac fix(scripts): pre-flight con fallback ruff
d6d5303 security(course): prevenir trampa en submit_exercises (C3)
ca5707c feat(claude): pre-flight script + reforzar auditor-triple sunset
```

### Tags release

- `v2.0-bloque-1-auth-edad` (anterior)
- `v2.1-workspaces` (este día)
- `v2.2-hardening` (este día)

### FROZEN actualizado

19 archivos protegidos. Nuevos del día:
- `backend/workspaces_export.py` (SSRF defense)
- `backend/workspaces_athena.py` (rate-limit)
- `backend/collab_routes.py` (deprecated pero preservado)

### Pendientes resueltos

- C1 SSRF V1 → CERRADO (V1 deprecated + fix aplicado)
- C2 privilege escalation → CERRADO (falso positivo)
- C3 quiz trampa → CERRADO (fix Opción B)
- C4 NameError → CERRADO (sin evidencia)

### Pendientes activos

- C-3 publicación T&C v3.0 → bloque `legal-consolidation-v2`
- Privacy Cambio H Anthropic → requiere verificación Cristian
- C5 PCI-DSS Checkout → bloque monetización
- C6 RUT placeholder HR → bloque legal nómina (requiere /unfreeze)
- C7 UF/UTM/SIS divergencia → pendiente
- A-7 Alembic init → bloque infra dedicado
- `/quiz/submit` (línea 628 course_routes.py) auditar — derivado de C3
- 12 MEDIOS + 9 BAJOS de auditoría Workspaces

---

## Métricas operativas Tori v2.1

- **Bloques cerrados en sesión**: 2 (`bloque-2-workspaces-v1`, `bloque-hardening-quizzes-c3`)
- **PRs mergeados**: 2 (#10, #11)
- **CI failures preventivos detectados por §23**: 1 (bug ruff path en propio script)
- **Recomendaciones falsas evitadas por §22**: 1 (C2 fix no necesario)
- **Tiempo ahorrado estimado**: ~2-3h (vs hacer C2 fix + descubrir falsa premisa después)

---

## Próxima sesión — opciones

### Opción 1: completar publicación legal
- Verificar contrato Anthropic con Cristian → aplicar Cambio H Privacy
- Bloque `legal-consolidation-v2`: resolver divergencia T&C (pages/ vs components/) + aplicar 2 borradores T&C + mecanismo re-aceptación v3.0 MAJOR
- Esfuerzo: 2-3 sesiones

### Opción 2: continuar hardening backlog
- C5 PCI-DSS Checkout (`src/pages/Checkout.tsx`) — eliminar recolección tarjeta + redirigir a MercadoPago/PayPal
- Auditar `/quiz/submit` (vulnerabilidad análoga a C3 derivada)
- C6 RUT placeholder HR (requiere /unfreeze)

### Opción 3: rediseño UI con desarrollador externo
- Cristian mencionó que tiene rediseño en proceso con desarrollador
- Pendiente respuesta a 3 preguntas: qué entregó, qué cubre, mantiene estructura

### Opción 4: nuevo módulo construcción
- Chat Biblioteca (memoria `project_chat_biblioteca.md`)
- Sistema puntos + cursos + mentorship (memoria `project_puntos_y_suscripciones.md`)

---

## Comando para retomar próxima sesión

```
Lee docs/sessions/2026-04-19-cierre-cab-bloque2-privacy-hardening.md
Declara OBJETIVO PRIMARIO según §20.
Si retomas opción 3 (rediseño UI), pide a Cristian las 3 respuestas
documentadas en este snapshot.
```
