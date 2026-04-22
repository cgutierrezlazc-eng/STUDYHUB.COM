# Snapshot de sesión — 2026-04-20

**Motivo del snapshot:** cierre de sesión para retomar mañana. Cristian
pidió guardar contexto porque hay trabajo en landing sandbox (Desktop)
y legal v3.2 (repo) simultáneamente pausados.

---

## 1. Estado del landing sandbox (Desktop)

Carpeta: `/Users/cristiang./Desktop/CONNIKU-LANDING-MASTER-2026/`

### Archivos

| Archivo | Estado |
|---|---|
| `landing.html` | CONGELADO. NO tocar. Snapshot histórico del master aprobado. |
| `CONTEXT.md` | Documento maestro. Leer al retomar. |
| `landing.md` | Spec L.01-L.21. Referencia. |
| `devices-preview.html` | Preview multi-dispositivo. Intacto. |
| `landing-preview.html` | SANDBOX de trabajo. Modificado hoy. 1 sola pantalla, hero 100vh. Gate password `conniku-preview-2026`. H1 con u-tile SIN dot reemplazando la U de Universidad (fuera del `.mark`, al inicio de la palabra). Nav con link "Entrar" grande rotado (tipo sticker) + pill "Crear cuenta". Links del nav cableados a `./producto.html`, `./como-funciona.html`, `./planes.html`, `./business.html`. |
| `producto.html` | Creado hoy. 1 sola pantalla, grid 3×2 de 6 features. Sin dots naranjas decorativos. U del H1 reemplazada por u-tile sin dot. Gate compartido. |
| `como-funciona.html` | Creado hoy. Dots naranjas eliminados. Gate compartido. |
| `planes.html` | Creado hoy. 2 planes (Free + Conniku Pro). Sin "MAX", sin "IA/AI". Cita Ley 19.496 retracto 10 días. Gate compartido. |
| `business.html` | Creado hoy con 6 módulos PROVISIONALES (HR, Finanzas, Contabilidad, Nómina, Legal, Administración). **REHACER MAÑANA** con 7 módulos reales. |
| `hr.html`, `finanzas.html`, `contabilidad.html`, `nomina.html`, `legal-modulo.html`, `administracion.html` | Páginas "en construcción" creadas hoy con colores sistema halftone. **ELIMINAR/RENOMBRAR MAÑANA** según lista real de módulos. |

### Password del gate
- `conniku-preview-2026` (JS inline, sessionStorage, solo preview local; NO es el password real de Supabase).

### Regla del dot naranja
El `<circle fill="#FF4A1C">` solo puede aparecer dentro del wordmark
oficial (`.brand .u-tile`, `.f-brand .u-tile`, `.gate-brand .u-tile`).
En cualquier otro uso del u-tile (H1 del hero, H1 de subpáginas), usar
variante SIN el circle. Aplicado hoy. Verificado.

---

## 2. Tareas pendientes para mañana (landing)

### 2.1 Rehacer Business con 7 módulos reales

Lista confirmada por Cristian:

1. **Personas** (reemplaza "HR")
2. **PayRoll** (reemplaza "Nómina")
3. **Finanzas**
4. **Reclutamiento** (nuevo)
5. **Bolsa del Trabajo** (nuevo)
6. **Contabilidad**
7. **Legal**

Colores propuestos (pendiente de confirmación de Cristian):

- Personas → lime
- PayRoll → cyan
- Finanzas → orange
- Reclutamiento → violet
- Bolsa del Trabajo → pink
- Contabilidad → cream
- Legal → ink

Acciones para mañana:
- Rehacer `business.html` con grid 3×3 (7 módulos + 2 huecos) o 4+3 o diseño asimétrico editorial.
- Borrar `hr.html`, `nomina.html`, `administracion.html` (módulos descartados).
- Crear nuevos: `personas.html`, `payroll.html`, `reclutamiento.html`, `bolsa-trabajo.html`.
- Mantener con posible cambio de color: `finanzas.html`, `contabilidad.html`, `legal-modulo.html`.
- Cada página "en construcción" mantiene formato formal con color principal del módulo.

### 2.2 Verificación visual del landing tras reversa

Cristian debe confirmar que el H1 ahora se ve bien (u-tile al inicio
de "niversidad" sin highlight encima). Si el margin-right negativo del
tile (`-0.05em`) no pega lo suficiente, ajustar a `-0.08em` o `-0.02em`.

### 2.3 Decisiones aún abiertas del landing

- Copy de cada página (producto, como-funciona, planes): hoy es borrador.
  Cristian dará copy definitivo en futuras iteraciones.
- CTAs "Entrar gratis" y "Ver demo": aún `href="#"`. Cablear cuando haya
  decisión de cómo llevan a React del proyecto.
- Migración del landing-preview al React del proyecto (`src/pages/Landing/`):
  pendiente, es Paso B posterior a la aprobación visual completa del HTML.
- Secciones 6 del LandingNew actual (Hero/How/App/Product/Pricing/BusinessPanel):
  decisión de Cristian fue re-estilizar sección por sección según sus
  instrucciones. Aún no se inició esa fase.

---

## 3. Estado del bloque legal v3.2 post-audit

Rama: `bloque-legal-consolidation-v2` (no creamos rama nueva para v3.2,
se está trabajando encima).

### Progreso

- **Pieza 1 (legal-docs-keeper):** COMPLETA. Canónicos v3.2 creados en
  `docs/legal/v3.2/` (terms 3.2.0, privacy 2.4.0, cookies 1.0.0,
  age-declaration 1.0.0). Hashes calculados. v3.1 archivada en
  `docs/legal/archive/2026-04-20-v3.1-superseded/`.
- **Pieza 2a (backend-builder):** INCOMPLETA. El agent quedó cortado en
  medio con la frase "Corrijo los dos restantes en un solo edit". AgentId
  para continuar: `af6b96999849a72d4`. Mañana: lanzar nuevo backend-builder
  (no confiar en el hilo cortado, puede estar fuera de ventana) para
  terminar de propagar hashes a `backend/constants/legal_versions.py` y
  escribir test de invariante.
- **Pieza 2b (frontend-builder):** COMPLETA. 32/32 tests pasando. Hashes
  propagados a `shared/legal_constants.ts`, edits H-01/H-02/H-08/H-09/
  H-10/H-11/H-12/H-16/H-17 aplicados en TSX.
- **Pieza 3 (paquete abogado):** PENDIENTE. Crear
  `/Users/cristiang./Desktop/CONIKU LEGAL v3.2/` con PDFs regenerados +
  `_CAMBIOS_v3.1_A_v3.2.md`.
- **Capa auditoría (auditor-triple):** PENDIENTE.
- **Pre-flight local (§23 CLAUDE.md):** PENDIENTE.

### Defaults adoptados

- D-H12 Anthropic jurisdicción = Opción B (redacción condicional).
- Archivar v3.1 = sí, movida a `archive/2026-04-20-v3.1-superseded/`.
- PDF INAPI en paquete abogado = placeholder (Cristian entrega por
  separado).

### Falso positivo conocido

El invariante del plan `grep -c borrador privacy.md == 0` da 1 por la
palabra "borradores" (sustantivo común) en la fila Capacitor §6. Es
falso positivo del grep, no violación del intent. Aceptado como OK.

### Bloque anterior pendiente

`bloque-legal-consolidation-v2` (Piezas 1-7 del legal v2) está en PR #21
abierto, sin merge. Bloqueado hasta OK del abogado sobre paquete v3.1 o
v3.2 (depende de decisión de Cristian sobre qué versión envía al abogado).

---

## 4. Auth CEO-only (plan acordado, no ejecutado)

Cristian eligió Opción C del plan:

1. Cuenta única `ceo@conniku.com` con password `7yvKU7xxVjy2QOjw8rtKbyBBBqLMGR84`
   (guardado SOLO en el gestor de Cristian + hash bcrypt en Supabase,
   NO en repo).
2. Deshabilitar registro público (`PUBLIC_REGISTRATION_ENABLED=false`
   en Render env vars).
3. En `src/pages/Login.tsx`, si `hostname !== 'conniku.com'`, pre-rellenar
   email `ceo@conniku.com`. Password se pega desde gestor (1 paste).
4. Inserciones en `user_agreements` con hashes legales v3.2 actuales para
   que la cuenta quede en compliance desde el minuto cero.

Pasos pendientes para mañana (o cuando Cristian lo pida):

- Generar bcrypt hash del password con Python inline (sin persistir en
  disco ni repo).
- Entregar SQL a Cristian para ejecutar en Supabase SQL Editor.
- Flag `PUBLIC_REGISTRATION_ENABLED` + validación en backend.
- Pre-fill de email en frontend Login.tsx.

**Crítico:** NO escribir el password textual en ningún archivo trackeado
por git. Pre-commit hook lo bloquearía pero aunque no lo bloqueara, no
cometer esa violación.

---

## 5. Memorias tocadas en esta sesión

- `feedback_chilean_register.md` actualizada con reincidencia segunda
  (voseo indicativo/subjuntivo: "presionás", "avisás", "entrás").
- `project_sii_marca.md` corregida (marca INAPI SOLICITADA pendiente de
  aprobación, NO inscrita. Fui corregido por Cristian).

---

## 6. Agents con hilos abiertos (por si hace falta SendMessage)

- `af6b96999849a72d4` — backend-builder cortado en Pieza 2a legal.
- `a8185b3eba17dee18` — frontend-builder que cerró Pieza 2b legal.
- `a22d30c24e3b4ea7b` — frontend-builder del landing gate + header original.
- `a59c592c9d19f4baf` — frontend-builder del link editorial "Entrar".
- `a79c1371c32f5f06e` — frontend-builder de las 3 páginas nav iniciales.
- `aabad7a1d726f2183` — frontend-builder del "Entrar" grande + u-tile en H1.
- `a71c30f173a4a2baa` — frontend-builder del Business provisional + 6 páginas.
- `a8fda57643f333299` — frontend-builder de la reversa H1 u-tile fuera de `.mark`.

En general: mejor lanzar agents nuevos en lugar de continuar (fuera de
ventana probable). Usar agentIds solo si el SendMessage tool está
disponible y la última respuesta del agent fue reciente.

---

## 7. Cómo retomar mañana

1. Leer este snapshot completo.
2. Verificar estado del repo con `git status` y `git log --oneline -10`.
3. Preguntar a Cristian: ¿qué prioriza primero, legal v3.2 pendiente o
   continuar landing con Business real de 7 módulos?
4. Según su respuesta, retomar:
   - Legal: backend-builder nuevo para Pieza 2a → Pieza 3 paquete → auditor-triple → pre-flight → PR / paquete abogado.
   - Landing: rehacer `business.html` + borrar 3 archivos descartados + crear 4 nuevos.
5. Auth CEO-only: ejecutar cuando Cristian dé orden explícita (hoy no se
   ejecutó nada).

Fin del snapshot.
