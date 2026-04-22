# Decisiones pendientes — Conniku

Archivo de acumulación de decisiones de producto / técnicas / legales que
surgen durante ejecución y requieren resolución posterior.

Formato por entrada:

- Fecha
- Contexto (qué estaba en curso)
- Pregunta o decisión pendiente
- Alternativas con pros/contras
- Recomendación
- Estado (pendiente / resuelta / diferida)

---

## 2026-04-20 — Deuda legal cosmética del rollout v3

**Contexto**: durante el rollout editorial v3 (PR #16), 3 commits tocaron
archivos con patrón legal sin pasar por el flujo reforzado exigido por
CLAUDE.md §Cumplimiento legal.

**Commits afectados**:

- `0d7004a` feat(terms-of-service): top editorial bar
- `f999082` feat(delete-account): top progress bar editorial
- `900487d` feat(privacy-policy): top editorial bar

**Verificación del diff**: revisión manual confirmó que los cambios son
cosméticos (reindentación + clases CSS + import de módulo CSS + top
editorial bar). No hubo alteración de texto legal sustantivo:

- `DeleteAccount.tsx`: texto "6 años según normativa tributaria chilena"
  preservado intacto; advertencia de permanencia y listado de datos
  eliminados preservados.
- `TermsOfService.tsx`: cuerpo del documento preservado.
- `PrivacyPolicy.tsx`: cuerpo del documento preservado.
- `shared/legal_texts.py` y `shared/legal_texts.ts`: NO modificados. El
  hash SHA-256 sigue igual (gate CI lo verifica).

**Pendiente**: auditoría legal profesional antes de publicar cualquier
cambio legal real que modifique texto sustantivo. La auditoría profesional
está fuera del scope de Tori y requiere abogado.

**Riesgo actual**: bajo. Los diffs son cosméticos. Sin embargo, el patrón
de saltar el flujo reforzado por diffs "cosméticos" es frágil y se debe
evitar a futuro.

**Acción recomendada a futuro**:

- Cualquier commit que toque `TermsOfService.tsx`, `PrivacyPolicy.tsx`,
  `DeleteAccount.tsx`, `Register.tsx`, `Login.tsx`, `shared/legal_texts.*`,
  `backend/constants/labor_*.py`, `backend/constants/tax_*.py`,
  `backend/constants/consumer.py`, `backend/hr_*.py` debe activar el
  flujo reforzado: plan del web-architect con citas, legal-docs-keeper
  en paralelo, aprobación humana explícita antes de merge.
- Esto aplica incluso a cambios "cosméticos", porque la clasificación de
  "cosmético vs sustantivo" es subjetiva y debe hacerla el
  legal-docs-keeper, no el builder.

**Estado**: DIFERIDA — registrar para auditoría profesional futura cuando
se planifique el bloque legal-consolidation-v2.
