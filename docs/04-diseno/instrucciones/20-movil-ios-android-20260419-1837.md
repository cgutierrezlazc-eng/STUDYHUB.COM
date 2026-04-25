# 20-movil-ios-android · Mockups específicos para móvil (iOS + Android)

```yaml
DOCUMENT_ID:      MODULE.20.MOVIL_IOS_ANDROID
AUDIENCE:         Claude Code implementing this module
PURPOSE:          Mockups de la experiencia móvil · iPhone (iOS) y Android
                  Posible referencia para la expansión 5-device del resto de módulos
STATUS:           NOT_ITERATED · HTML depositado · iteración pendiente
CONSUMES:         00-STACK · 00-RULES-GLOBAL · 00-BRAND-LOGO · 00-PEOPLE-AUTHORIZED
                  Capacitor (Android + iOS) según 00-STACK
FILE_HTML:        Diseno/20-movil-ios-android-20260419-1837.html
SOURCE:           Referencia/30-movil-ios-android.html
DATE_DEPOSITED:   2026-04-19
TIMESTAMP:        20260419-1837
```

---

## MODULE.20.00 · PURPOSE

Mockups de pantallas clave en móvil · referencia visual para la expansión a
dispositivos móviles (iphone + android) del resto de módulos (§RULES.07).

Puede usarse como base para decidir convenciones específicas:
- iOS safe-area-inset-top/bottom (notch + home indicator)
- Android material back button + ripple
- Tap targets 44x44 iOS · 48x48dp Android

---

## MODULE.20.01 · ROUTE & SCAFFOLD

```
Route:         N/A (no es una pantalla · es una referencia de diseño)
Consumption:   usado como guía al expandir cada módulo a variantes iphone/android
Related:       todos los módulos que deban tener variantes móviles
```

---

## MODULE.20.02 · STATUS

```
STATUS: NOT_ITERATED
HTML copia 1:1 de Referencia/.
```

---

## MODULE.20.03 · PENDING (sin iterar)

```
- Revisar qué pantallas del producto están mockeadas aquí
- Definir si este archivo queda como "guía de referencia" o se descompone
  en mockups por módulo-dispositivo
- Componentes nativos mobile (bottom nav, sheets, pull-to-refresh, etc.)
- Personas del catálogo en avatares · pase pendiente
```

---

## MODULE.20.04 · VALIDATION CHECKLIST (al iterar)

- [ ] HTML autocontenido (§RULES.04)
- [ ] Convenciones iOS respetadas (safe areas, tap 44x44)
- [ ] Convenciones Android respetadas (ripple, tap 48x48dp)
- [ ] Personas solo del catálogo (§RULES.05)

---

**END. Reference module · base for 5-device expansion of other modules.**
