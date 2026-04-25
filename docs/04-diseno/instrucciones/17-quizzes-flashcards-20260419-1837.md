# 17-quizzes-flashcards · Repaso con quizzes y flashcards

```yaml
DOCUMENT_ID:      MODULE.17.QUIZZES_FLASHCARDS
AUDIENCE:         Claude Code implementing this module
PURPOSE:          Herramienta de repaso · quizzes + flashcards con spaced repetition
STATUS:           NOT_ITERATED · HTML depositado · iteración pendiente
CONSUMES:         00-STACK · 00-RULES-GLOBAL · 00-BRAND-LOGO · 00-PEOPLE-AUTHORIZED
FILE_HTML:        Diseno/17-quizzes-flashcards-20260419-1837.html
SOURCE:           Referencia/22-quizzes-flashcards.html
DATE_DEPOSITED:   2026-04-19
TIMESTAMP:        20260419-1837
```

---

## MODULE.17.00 · PURPOSE

Herramientas de repaso:
- Quizzes con preguntas tipo múltiple, verdadero/falso, completar
- Flashcards con repetición espaciada (SM-2 o similar)
- Scoring + progreso
- Integración con módulos 09 (cursos) y 14 (mi-universidad)

Alternativas a "IA" en copy: "estudio inteligente", "asistente inteligente" (§RULES.01.1).

---

## MODULE.17.01 · ROUTE & SCAFFOLD

```
Route:         /repaso  (sub: /repaso/quizzes, /repaso/flashcards)
Component:     src/pages/Repaso/Repaso.tsx
Protected:     requires user
Lazy:          sí
```

---

## MODULE.17.02 · STATUS

```
STATUS: NOT_ITERATED
HTML copia 1:1 de Referencia/.
```

---

## MODULE.17.03 · PENDING (sin iterar)

```
- Cross-links internos → mapear
- Algoritmo de repetición espaciada · implementar SM-2 o simplificación
- Personas del catálogo en testimonios · pase pendiente
- Integración con cursos (quizzes por curso) y mi-universidad (flashcards por asignatura)
- Expansión 5-device (clave en móvil para repaso on-the-go)
```

---

## MODULE.17.04 · VALIDATION CHECKLIST (al iterar)

- [ ] HTML autocontenido (§RULES.04)
- [ ] Personas solo del catálogo (§RULES.05)
- [ ] 0 "IA" / "AI" en copy · usar "estudio inteligente" o "Athena"
- [ ] Sin inventar estadísticas de acierto/retención (§RULES.01.3)

---

**END. Study module · integra con cursos y mi-universidad.**
