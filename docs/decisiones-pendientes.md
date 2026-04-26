# Decisiones pendientes de batch (§21 CLAUDE.md)

## 2026-04-26 — z-index LanguageSwitcher

**Contexto:** Checkpoint B del bloque `language-switcher-start`. La instrucción de Cristian
dice: "si el máximo encontrado en src/ es mayor a 200, usa `max(found) + 1`".

**Premisa del plan (D11):** el máximo en `Start.module.css` era 200, por lo que el plan
proponía z-index 300.

**Evidencia del grep real:** `grep -rn "z-index" src/` encontró en `src/styles/global.css`:

- `z-index: 10001` (modal-overlay y cover-modal-overlay — modales globales del sistema)
- `z-index: 9998` (mobile-more-overlay)

**Decisión provisional tomada en Checkpoint B:** z-index **10002** (max(found=10001) + 1),
siguiendo la regla literal de Cristian.

**RESUELTA — Checkpoint B→C (2026-04-26):**
**z-index 300 confirmado por Cristian.** Los modales globales (10001) viven en la app
autenticada y nunca se montan sobre /start. Aplicar 10002 sería taparlos por error si en
el futuro algún sistema decide mostrar un error global durante onboarding — peor UX. 300
deja margen sobre el máximo real del scope (Start.module.css max = 200) sin invadir capas
que no tocan a /start.

**Alternativas evaluadas:**

- A) z-index 10002 (regla literal: max(src/) + 1) — DESCARTADA
- B) z-index 300 (plan original D11: scope local /start) — **APLICADA**

**Estado:** CERRADO. LanguageSwitcher.module.css actualizado a z-index 300.
