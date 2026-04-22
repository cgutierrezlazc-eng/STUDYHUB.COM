# Paquete Legal — Conniku SpA
## Auditoría y Correcciones 22 de abril de 2026

**Preparado por:** Tori (Asistente de Auditoría Interna, Conniku)
**Fecha:** 22 de abril de 2026 · 13:34 hora Chile
**Destinatario:** Abogado externo de Conniku SpA
**Ref. interna:** bloque-sandbox-integrity-v1 · commits f2ac9fb → 4a4d9eb
**Rama Git:** `bloque-sandbox-integrity-v1`

---

## 1. Resumen Ejecutivo

Durante la auditoría del 22 de abril de 2026 se identificaron y corrigieron
**4 tipos de discrepancias** entre la normativa chilena vigente y el estado del
sistema CONNIKU:

| # | Área | Tipo | Estado |
|---|---|---|---|
| A | Módulo de nómina (`hr_routes.py`) | Constantes desactualizadas | ✅ Corregido |
| B | Términos de Servicio (`terms.md`) | Ley Karin no referenciada | ✅ Corregido |
| C | Registros de versiones (`documentRegistry.ts`, `legal_versions.py`) | Versiones/hashes no sincronizados | ✅ Corregido |
| E | Jornada laboral (frontend + backend) | Valores hardcodeados (45h) sin reflejo de escalones Ley 21.561 | ✅ Corregido |

---

## 2. Cambios en Documentos Legales Publicados

### 2.1 Términos de Servicio — `docs/legal/v3.2/terms.md`

| Campo | Antes | Después |
|---|---|---|
| Versión | 3.2.0 | **3.2.2** |
| Fecha vigencia | 2026-04-20 | **2026-04-22** |
| SHA-256 | `9a16122f...` | **`b2b834b6...`** |

**Cambios incluidos en v3.2.2:**

#### Art. 29.4 — Retención de honorarios (corrección anterior, v3.2.1)
- Tasa actualizada a **15,25%** para el año 2026 conforme a la escala
  transitoria de la **Ley N° 21.133** (previamente se citaba una tasa incorrecta).
- Fuente: www.sii.cl · vigente desde 2026-01-01.

#### Art. 33.4 y 33.5 — Ley Karin (nuevo en v3.2.2)
- Se agrega cláusula de conducta conforme a **Ley N° 21.643 ("Ley Karin")**,
  vigente desde el 01 de agosto de 2024.
- Art. 33.4: los tutores declaran conocer y aceptar la política de prevención
  de acoso laboral y sexual al firmar el Contrato de Prestación de Servicios.
- Art. 33.5: Conniku SpA declara tener un Protocolo de Prevención del Acoso
  Laboral y Sexual conforme al Art. 211-A y siguientes del Código del Trabajo,
  con aclaración expresa de que los tutores son prestadores independientes y no
  trabajadores dependientes de Conniku SpA.

#### Art. 33bis — Política de Ambiente Seguro (nuevo en v3.2.2)
- Conductas prohibidas en la plataforma: acoso, acoso sexual, violencia.
- Canal de denuncia: seguridad@conniku.com · formulario en conniku.com/contacto
- Medidas disciplinarias: advertencia → suspensión temporal → eliminación definitiva.
- Referencia expresa a la Dirección del Trabajo (dt.gob.cl) como autoridad competente.

> ⚠️ **Acción requerida del abogado (B-1):**
> Revisar la redacción del Art. 33bis y confirmar que los términos "acoso laboral",
> "acoso sexual" y "violencia en el trabajo" están empleados en concordancia exacta
> con los Arts. 2° y 211-A del Código del Trabajo modificados por Ley 21.643.
> El artículo aplica a relaciones entre usuarios (no laborales), por lo que el
> fundamento legal es analógico — confirmar que esto no genera confusión con la
> responsabilidad de empleador de Conniku SpA.

---

### 2.2 Política de Privacidad — `docs/legal/v3.2/privacy.md`

| Campo | Antes | Después |
|---|---|---|
| Versión | 2.4.2 | 2.4.2 (sin cambio) |
| SHA-256 | `a09d799c...` | **`cc933274...`** |

**Cambios incluidos (sesión anterior):**
- Referencia a **Ley 21.719** (Ley de Protección de Datos Personales de Chile,
  publicada 13/12/2024, vacancia legal: entra en vigor en 2026-12-01).
- Eliminación de todas las referencias a "Inteligencia Artificial" — reemplazadas
  por "Asistente Virtual Athena" / "Asistente Virtual Konni" conforme a directriz
  interna de comunicación.
- Actualización de referencias normativas GDPR y Ley 19.628.

> ℹ️ **Nota para el abogado (C-1):**
> La Ley 21.719 entra en vigor el 2026-12-01. La privacy.md ya referencia su
> vacancia y el régimen transitorio. Se recomienda una revisión completa del
> documento en noviembre de 2026 para adecuación final.

---

## 3. Correcciones en el Módulo de Nómina

Estos cambios afectan los cálculos internos del sistema de RRHH. No son
documentos legales públicos, pero tienen efecto directo sobre la liquidación
de remuneraciones.

| Constante | Archivo | Antes | Después | Fuente |
|---|---|---|---|---|
| IMM 2026 | `backend/hr_routes.py` | Sin entrada 2026 → usaba $500.000 | **$539.000** desde 2026-01-01 | Ley 21.751 · mintrab.gob.cl |
| AFC — Tope imponible | `backend/hr_routes.py` | 122,6 UF | **135,2 UF** | Superintendencia Pensiones · feb-2026 |
| SIS — Tasa empleador | `backend/hr_routes.py` | 1,41% | **1,54%** | Superintendencia Pensiones · ene-2026 |
| Default jornada (BD) | `backend/hr_routes.py` | 45 horas | **42 horas** | Ley 21.561 Art. 1° escalón 2 (26/04/2026) |

> ⚠️ **Acción requerida del abogado (A-1):**
> Confirmar que el IMM de $539.000 corresponde a la Ley 21.751 vigente desde
> el 01 de enero de 2026. Si Conniku SpA tiene trabajadores con remuneración
> pactada sobre el IMM anterior ($500.000) en contratos ya firmados, verificar
> si el ajuste es automático por ley o requiere addendum al contrato.

---

## 4. Jornada Laboral — Ley 21.561 (40 horas)

La **Ley 21.561** establece una reducción gradual de la jornada laboral máxima:

| Fecha | Horas | Estado |
|---|---|---|
| Desde 2024-04-26 | 44 h/semana | Histórico |
| **Desde 2026-04-26** | **42 h/semana** | **⚠️ Activo en 4 días** |
| Desde 2028-04-26 | 40 h/semana | Preparado en código |

**Acciones completadas:**
- El backend calcula la jornada vigente en tiempo real mediante
  `get_weekly_hours_at_date(date.today())` — no requiere intervención manual.
- El endpoint `/hr/indicators` ya devuelve la jornada vigente y el próximo escalón.
- El formulario de creación de empleados usa 42h como valor por defecto.

> ⚠️ **Acción requerida del abogado (E-1):**
> Verificar que los contratos de trabajo de los empleados actuales de Conniku SpA
> tienen cláusula de jornada referenciando el Art. 22 CT con la escala de la
> Ley 21.561, de manera que el escalón del 26 de abril de 2026 (42h) se aplique
> automáticamente sin necesidad de addendum.

---

## 5. Protocolo Ley Karin — Estado (Alerta Crítica)

La **Ley 21.643** obliga a todo empleador chileno a contar con un
**Protocolo de Prevención del Acoso Laboral y Sexual** aprobado y archivado.

| Item | Estado |
|---|---|
| Sistema genera la plantilla del protocolo | ✅ Funcional (BibliotecaDocumentos.tsx) |
| Protocolo firmado y archivado por Conniku SpA | ❓ **NO VERIFICADO** |

> 🚨 **Acción requerida del abogado (B-2) — CRÍTICA:**
> Confirmar si el **Protocolo de Prevención del Acoso Laboral y Sexual de
> Conniku SpA** ha sido:
> a) Redactado (el sistema genera la plantilla, pero no registra si fue firmada).
> b) Revisado y aprobado por el empleador (Cristian Gárnica, en su calidad de representante legal).
> c) Puesto en conocimiento de todos los trabajadores (obligación del Art. 211-B CT).
> d) Archivado en la empresa y disponible para fiscalización de la Dirección del Trabajo.
>
> **Plazo:** La obligación es vigente desde el 01/08/2024. Si aún no está aprobado,
> Conniku SpA está en infracción susceptible de multa por la Inspección del Trabajo.

---

## 6. Hashes para Certificación

Los siguientes valores son los identificadores criptográficos de los documentos
legales publicados a la fecha:

```
Documento               Versión   SHA-256 (primeros 16 chars)
───────────────────────────────────────────────────────────────
terms.md                3.2.2     b2b834b61e19db6b...
privacy.md              2.4.2     cc9332741bea7ad4...
cookies.md              1.0.0     80d41f71f075ae95...
age-declaration.md      1.0.0     61dab2ecf1b27e3f...
```

Hashes completos disponibles en:
- `backend/constants/legal_versions.py`
- `src/legal/documentRegistry.ts`
- `docs/legal/v3.2/METADATA.yaml`

---

## 7. Acciones Requeridas — Resumen para el Abogado

| ID | Prioridad | Acción | Plazo |
|---|---|---|---|
| **B-2** | 🚨 Crítica | Verificar y archivar Protocolo Ley Karin firmado por Conniku SpA | **Inmediato** |
| **E-1** | 🔴 Alta | Confirmar que contratos empleados cubren escalón 42h del 26/04/2026 | **Antes del 26/04** |
| **A-1** | 🟡 Media | Confirmar IMM $539.000 y efectos sobre contratos existentes | Esta semana |
| **B-1** | 🟡 Media | Revisar redacción Art. 33bis (ambiente seguro / Ley Karin en plataforma) | Esta semana |
| **C-1** | 🟢 Informativa | Revisión completa privacy.md por entrada en vigor Ley 21.719 | Noviembre 2026 |

---

## 8. Contexto Técnico para el Abogado

Conniku es una plataforma SaaS de educación y tutorías operada por **Conniku SpA**,
RUT: (pendiente confirmar), con domicilio en Antofagasta, Chile.

El sistema usa un registro de versiones y hashes SHA-256 para garantizar que los
usuarios han leído la versión vigente de cada documento legal antes de registrarse
o usar la plataforma (Art. 3 bis letra b) Ley 19.496 y GDPR Art. 7).

Cuando se actualiza un documento legal (como ocurrió hoy con terms.md v3.2.2),
el sistema automáticamente solicita a los usuarios existentes que re-acepten los
nuevos términos antes de continuar usando la plataforma.

---

*Documento generado por el sistema de auditoría interna de Conniku SpA.*
*Para consultas técnicas: ingeniería@conniku.com*
*Para consultas legales: contacto@conniku.com*
