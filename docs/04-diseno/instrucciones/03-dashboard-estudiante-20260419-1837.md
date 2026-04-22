# 03-dashboard-estudiante · Pantalla principal del estudiante (home post-onboarding)

```yaml
DOCUMENT_ID:      MODULE.03.DASHBOARD_ESTUDIANTE
AUDIENCE:         Claude Code implementing this module
PURPOSE:          Dashboard principal del estudiante · home tras completar onboarding
                  Consumido por todo usuario autenticado con onboarding_step='complete'
STATUS:           NOT_ITERATED · HTML depositado en Diseno/ · iteración con Cristian pendiente
CONSUMES:         00-STACK · 00-RULES-GLOBAL · 00-BRAND-LOGO · 00-PEOPLE-AUTHORIZED
                  Depende de módulo 02 (login/auth) y módulo 04 (biblioteca) · resto TBD
FILE_HTML:        Diseno/03-dashboard-estudiante-20260419-1837.html
SOURCE:           Referencia/01-dashboard-estudiante.html
DATE_DEPOSITED:   2026-04-19
TIMESTAMP:        20260419-1837
```

---

## MODULE.03.00 · PURPOSE

Pantalla hogar tras completar onboarding. Punto central de acceso al producto:
asignaturas del semestre, agenda de la semana, progreso académico, mensajes,
tutores sugeridos, oportunidades laborales, acceso rápido a workspaces.

Equivalente funcional al "home" de las apps de universidades, adaptado al ecosistema Conniku.

---

## MODULE.03.01 · ROUTE & SCAFFOLD

```
Route:         /dashboard
Component:     src/pages/Dashboard/Dashboard.tsx
Protected:     requires user && onboardingStep === 'complete'
Lazy:          React.lazy(() => import('./pages/Dashboard/Dashboard'))
```

---

## MODULE.03.02 · STATUS

```
STATUS: NOT_ITERATED

HTML en Diseno/ es copia 1:1 de Referencia/ · sin ajustes de cross-link, personas, ni comportamiento.
Se iterará con Cristian cuando se arranque el módulo.
```

---

## MODULE.03.03 · PENDING (sin iterar)

```
- Cross-links internos del HTML → pendientes de mapear y reescribir
- Nombres inventados en avatares → reemplazar por catálogo 00-PEOPLE-AUTHORIZED
- Estadísticas hardcoded (si existen) → validar contra regla §RULES.01.3
- Rutas de navegación a otros módulos → mapear en iteración
- Endpoints backend → declarar en iteración
- Componentes del design system a extraer → identificar
- Expansión 5-device (web/android/iphone/tablet/ipad) → pendiente
- Pase de personas reales (instrucción pendiente 2026-04-19) → pendiente
```

---

## MODULE.03.04 · VALIDATION CHECKLIST (al iterar)

- [ ] HTML autocontenido verificado (§RULES.04)
- [ ] 0 menciones "IA" / "AI" (§RULES.01.1)
- [ ] Tuteo chileno (§RULES.01.2)
- [ ] Personas sólo del catálogo 00-PEOPLE-AUTHORIZED
- [ ] Datos legales (si aplica) con cita visible (§RULES.02)
- [ ] Contrast WCAG AA (§RULES.08)
- [ ] Cross-links declarados en 00-CONNECTIONS-MAP

---

**END. This module is placeholder · iterate with Cristian to expand.**
