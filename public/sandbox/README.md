# Sandbox Conniku — README

**Ruta pública**: `conniku.com/sandbox/` → redirige a `landing-preview.html`

El sandbox es el diseño interactivo del landing de Conniku, servido como HTML
vanilla por Vercel desde `public/sandbox/`. No requiere build de React.

---

## Estructura de archivos

```
public/sandbox/
  index.html              # Redirect a landing-preview.html
  landing-preview.html    # Landing principal con estilos editorizados
  landing.html            # Base CONGELADA (no modificar)
  soporte.html            # Página de soporte con FAQ + feedback 👍/👎
  legal-terms.html        # Términos y Condiciones (generado)
  legal-privacy.html      # Política de Privacidad (generado)
  legal-cookies.html      # Política de Cookies (generado)
  legal-age-declaration.html  # Declaración de Edad (generado)
  _gate.js                # Gate de acceso (lee window.SANDBOX_GATE_PASSWORD)
  CONTEXT.md              # Historia del proceso de diseño
  landing.md              # Spec L.01–L.21
  *.html                  # 55 páginas de producto
```

Los scripts de mantenimiento viven en `scripts/sandbox_maintenance/` (no en
`public/` para que Vercel no los sirva).

---

## Gate de acceso

El sandbox está protegido por un gate de contraseña (`_gate.js`).

**Cómo funciona**:
1. Cada HTML del sandbox tiene `<script>window.SANDBOX_GATE_PASSWORD='...';</script>`
   antes de cargar `_gate.js`.
2. En producción, el plugin Vite `sandboxGateInjectorPlugin` inyecta el valor
   de `VITE_SANDBOX_GATE_PASSWORD` en todos los HTML al hacer build.
3. En desarrollo local, agrega el password en `.env.local`:

```
VITE_SANDBOX_GATE_PASSWORD=tu-password-local
```

**Cómo rotar el password**:
1. Generar nuevo password (mínimo 16 caracteres, caracteres aleatorios).
2. Actualizar `VITE_SANDBOX_GATE_PASSWORD` en el panel de Vercel:
   Settings → Environment Variables → `VITE_SANDBOX_GATE_PASSWORD`.
3. Re-desplegar (automático en cada push a main, o manual "Redeploy" en Vercel).
4. Comunicar el nuevo password a quien corresponda.

**Nota**: el gate no es autenticación real. Es solo una barrera visual para
evitar que el sandbox quede accesible al público general antes de ser
aprobado como landing oficial.

---

## Scripts de mantenimiento

Todos los scripts están en `scripts/sandbox_maintenance/`. Se ejecutan
localmente, nunca en CI.

```bash
cd /Users/cristiang./CONNIKU

# Inyectar/actualizar banner de cookies (POST real al backend)
python3 scripts/sandbox_maintenance/_inject_cookie_banner.py

# Inyectar/actualizar modal legal (POST real al backend)
python3 scripts/sandbox_maintenance/_inject_legal_modal.py

# Inyectar widgets 👍/👎 en soporte.html
python3 scripts/sandbox_maintenance/_inject_faq_feedback.py

# Inyectar/actualizar script del gate en todos los HTML
python3 scripts/sandbox_maintenance/_inject_gate_script.py

# Reconstruir páginas legales (legal-*.html)
python3 scripts/sandbox_maintenance/_build_legal_pages.py

# Inyectar link de soporte en todos los HTML
python3 scripts/sandbox_maintenance/_inject_support_link.py
```

Todos los scripts son **idempotentes**: si el snippet ya está inyectado
(detectado por marker), no duplican.

---

## Consent de cookies

El banner de cookies en el sandbox hace un `POST /api/consent/cookies` real
con `origin="sandbox"` al backend de Conniku.

- `visitor_uuid`: generado en primer visit, persistido en
  `localStorage['conniku_visitor_uuid']` (misma clave que el producto React).
- Fallback: si el POST falla, se guarda en `localStorage['conniku_pending_consent_sync']`
  y se reintenta en la próxima visita.
- Política: `bba33024...` (versión 1.1.0).

---

## Modal legal

Al abrir documentos legales desde el footer, se registra una vista:

- `POST /legal/documents/{doc}/viewed` con `session_token` = visitor_uuid.
- Al hacer scroll ≥90% del documento, se envía un segundo POST con
  `scrolled_to_end=true`.
- Mismo fallback + retry de cookies.

---

## Feedback de soporte (👍/👎)

Cada pregunta FAQ en `soporte.html` tiene botones de feedback.

- Click 👍: `POST /support/feedback` con `useful=true`.
- Click 👎: expande textarea opcional, luego `POST /support/feedback` con
  `useful=false` y `comment`.
- Fallback + retry igual que consent.

Los `faq_id` estables están documentados en `docs/support/faq-catalog.md`.

---

## Deploy

El sandbox se despliega automáticamente con cada push a `main` via Vercel.
El plugin `sandboxGateInjectorPlugin` en `vite.config.ts` inyecta el
password del gate en los HTML del sandbox durante el build.

**URL de producción**: `https://conniku.com/sandbox/`
**URL de desarrollo**: `http://localhost:5173/sandbox/`
