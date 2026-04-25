# 19-workspace-athena · Workspace con asistente Athena (popups)

```yaml
DOCUMENT_ID:      MODULE.19.WORKSPACE_ATHENA
AUDIENCE:         Claude Code implementing this module
PURPOSE:          Variante del workspace (módulo 05) con popups del asistente Athena
                  Athena es experta académica humana · NUNCA referirse como IA/AI
STATUS:           NOT_ITERATED · HTML depositado · iteración pendiente
CONSUMES:         00-STACK · 00-RULES-GLOBAL · 00-BRAND-LOGO · 00-PEOPLE-AUTHORIZED
                  Extensión del módulo 05 workspaces · comparte arquitectura Yjs
FILE_HTML:        Diseno/19-workspace-athena-20260419-1837.html
SOURCE:           Referencia/24-workspace-athena-popups.html
DATE_DEPOSITED:   2026-04-19
TIMESTAMP:        20260419-1837
```

---

## MODULE.19.00 · PURPOSE

Workspace colaborativo (como módulo 05) con overlays/popups de asistente Athena:
- Sugerencias de escritura
- Validación de fuentes
- Resumen automático
- Chat con Athena en contexto del documento

Backend: Claude API Haiku 4.5 (ver 00-STACK.md § AI). Código usa ai_engine.py / konni_engine.py
(legacy) · stack expuesto al usuario es "Athena · experta académica humana".

---

## MODULE.19.01 · ROUTE & SCAFFOLD

```
Route:         /workspace/:id  (misma que módulo 05) · Athena como overlay
Component:     src/pages/Workspace/Workspace.tsx + AthenaOverlay.tsx
Protected:     requires user
Related:       módulo 05-workspaces
```

---

## MODULE.19.02 · STATUS

```
STATUS: NOT_ITERATED
HTML copia 1:1 de Referencia/.
```

---

## MODULE.19.03 · PENDING (sin iterar)

```
- Cross-links internos → mapear
- Arquitectura Athena: stream responses · context management · prompt library
- Guardas §RULES.12: konni_engine.py está frozen (V1 legacy), usar ai_engine.py (backend)
- UX de popups · momentos de aparición · opt-in del usuario
- Personas del catálogo en avatares de compañeros del workspace · pase pendiente
- Expansión 5-device
```

---

## MODULE.19.04 · VALIDATION CHECKLIST (al iterar)

- [ ] HTML autocontenido (§RULES.04)
- [ ] 0 "IA" / "AI" / "inteligencia artificial" en copy (§RULES.01.1 inviolable)
- [ ] Athena presentada como "experta académica humana" (§RULES.01.1)
- [ ] Código puede usar "ai_" prefix internamente · nunca expone al usuario
- [ ] Personas solo del catálogo (§RULES.05)
- [ ] konni_engine.py NO tocado (frozen · §RULES.12)

---

**END. Athena overlay · rule §RULES.01.1 más estricto aquí.**
