# Alertas activas del legal-docs-keeper

Última actualización: **2026-04-21** (legal-docs-keeper, Capa 0 bloque multi-document-consent-v1 — CONSENT-1 y CONSENT-2 agregadas; VIEWER-1/2/3 revisadas sin cerrar)

## Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere validación
de abogado antes de su aplicación al producto en producción.

## Clasificación de severidad

- **CRÍTICA**: requiere acción inmediata (bloqueante para producción o para
  el próximo deploy que toque el área afectada).
- **MODERADA**: actualización recomendada en próximas 2 semanas.
- **INFORMATIVA**: mejora sugerida sin urgencia.

---

## Alertas CRÍTICAS abiertas (auditoría transversal 2026-04-21 pre-commit Bloque 1)

### ALERTA-AUDIT-04-21-14 — Política de Cookies canónica es un stub firmado como "aprobado"

- **Origen**: legal-docs-keeper 2026-04-21, §5.1 del weekly-audit-2026-04-21.md.
- **Evidencia**:
  - `docs/legal/v3.2/cookies.md` contiene frontmatter `estado: STUB — NO PUBLICAR` + aviso "Este documento está pendiente de redacción".
  - `docs/legal/v3.2/METADATA.yaml` lo declara `version: "1.0.0"`, `vigencia_desde: "2026-04-20"`, `aprobacion_fecha: "2026-04-20"`, `autor_aprobacion: "Cristian Gutiérrez Lazcano"`.
  - `backend/constants/legal_versions.py::COOKIES_HASH = "a00150297efa..."` coincide con el hash del stub.
  - La tabla `cookie_consents` (Bloque 1) almacenará este hash como prueba irrefutable de aceptación.
- **Impacto**: GDPR Art. 7(1) exige demostrabilidad del consentimiento sobre texto específico. Hash de archivo vacío no cumple. Art. 12 letra b Ley 19.496 (información veraz). Privacy v2.4.0 §8 remite a "la Política de Cookies (conniku.com/cookies)" que en disco está vacía.
- **Acción requerida**: antes del commit del Bloque 1, publicar el texto canónico real de la Política de Cookies (sincronizar `src/pages/CookiesPolicy.tsx` con `docs/legal/v3.2/cookies.md`), recalcular hash, actualizar `COOKIES_HASH` y METADATA.yaml. O, alternativamente, diferir el campo `policy_hash` en cookie_consents hasta que exista el documento real.
- **Bloqueo**: SÍ, bloquea commit del Bloque 1.

### ALERTA-AUDIT-04-21-1 — Ley 21.719 no citada en Privacy v2.4.0

- **Origen**: legal-docs-keeper 2026-04-21, §4 Área 1.
- **Evidencia**: 5 archivos del código citan Ley 21.719 (`src/services/cookieConsentService.ts:13`, `src/legal/cookieTexts.ts:16`, `src/pages/HRDashboard.tsx:2652`, `src/admin/tools/BibliotecaDocumentos.tsx:210`, `src/admin/hr/ContratosTab.tsx:318`). `docs/legal/v3.2/privacy.md:16` solo menciona "Ley N° 19.628 · Ley N° 21.096" para Chile.
- **Impacto**: incoherencia entre código visible al usuario y documento canónico que firma hash en `user_agreements`. El usuario logueado que lea Privacy no verá mencionada la ley más reciente. GDPR Art. 13 (información completa sobre marco legal aplicable).
- **Acción**: bumpear Privacy a v2.5.0 agregando Ley 21.719 en §"Normativa aplicable" antes de que entre en vigor (diciembre 2026). No bloquea Bloque 1 porque 21.719 aún no vigente, pero sí exige preparación.
- **Bloqueo**: no bloquea commit Bloque 1. Planificar para próximo bloque legal.

### ALERTA-AUDIT-04-21-12 — Ley 21.561 (42 horas) entra en 5 días y `payroll_calculator.py` sigue en 45

- **Origen**: legal-docs-keeper 2026-04-21, §4 Área 12.
- **Evidencia**:
  - `backend/payroll_calculator.py:56-57`: `MONTHLY_HOURS: float = 180.0 # 45 hrs * 4 weeks` / `WEEKLY_HOURS: float = 45.0`.
  - `src/admin/hr/ContratosTab.tsx:116`, `:256`, `:1011` ya citan Ley 21.561 y 40 horas.
  - Ley 21.561: escalón 42h/semana desde 2026-04-26 (**PENDIENTE VERIFICACIÓN BCN**).
- **Impacto**: Art. 32 y 63 bis CT. `calculate_overtime` divide por 180; con jornada legal 42h, la base correcta sería 168. Cada hora extra calculada con divisor 180 resulta subremunerada en ~7.14%. Riesgo multa DT + reclamo trabajador.
- **Acción**: bloque dedicado `nomina-chile-v1` debe crear `backend/constants/labor_chile.py` con `WEEKLY_HOURS_LEGAL` indexado por fecha efectiva (44h desde 2024-04-26, 42h desde 2026-04-26, 40h desde 2028-04-26) y cita verificada de la ley.
- **Bloqueo**: no bloquea Bloque 1 (no hay empleados de Conniku SpA usando el módulo hoy), pero crítica para operación real de nómina a partir del 2026-04-26.

### ALERTA-AUDIT-04-21-6 — Divergencia UF/UTM/SIS backend vs frontend

- **Origen**: legal-docs-keeper 2026-04-21, §4 Área 7.
- **Evidencia**:
  - UF: backend `38_000.0` vs frontend `38700` (lastUpdate 2026-04-01).
  - UTM: backend `66_000.0` vs frontend `67294` (lastUpdate 2026-04-01).
  - SIS: backend `0.0153` vs frontend `0.0141`. Diferencia 0.12% sobre sueldo imponible.
- **Impacto**: liquidación de nómina doble (si se computara desde ambos lados) con resultados distintos. La SIS es fijada mensualmente por Superintendencia de Pensiones. Valor incorrecto = subcotización o sobrecotización real.
- **Acción**: crear `backend/constants/labor_chile.py` como única fuente de verdad. Implementar fetch mensual desde mindicadores.cl/bcentral.cl para UF/UTM. Citar Circular Superintendencia para SIS.
- **Bloqueo**: no bloquea Bloque 1, crítica para módulo HR operacional.

### ALERTA-AUDIT-04-21-7 — Último tramo impuesto 2ª categoría difiere backend vs frontend

- **Origen**: legal-docs-keeper 2026-04-21, §4 Área 8.
- **Evidencia**:
  - `backend/payroll_calculator.py:187-189`: `(120, 310, 0.35, 23.32)` + `(310, ∞, 0.40, 38.82)`.
  - `src/admin/shared/ChileLaborConstants.ts:67-68`: `(120, 150, 0.35, 23.32)` + `(150, ∞, 0.40, 30.82)`.
- **Impacto**: para sueldo imponible > 150 UTM (~$10M CLP/mes), el backend aplica tramo 35% mientras el frontend aplica 40%. Diferencia de 5 puntos porcentuales + diferentes deducibles = cálculos de impuesto muy distintos. Riesgo declaración incorrecta ante SII.
- **Acción**: verificar contra Art. 43 Ley de Renta (DL 824) vigente en 2026 cuál tabla es correcta. Una de las dos está desactualizada o errada. Consolidar en `backend/constants/tax_chile.py` con cita Art. 43.
- **Bloqueo**: no bloquea Bloque 1; crítica para módulo HR/liquidaciones.

### ALERTA-AUDIT-04-21-8 — Retención boleta honorarios 13.75% etiquetada "2025"

- **Origen**: legal-docs-keeper 2026-04-21, §4 Área 8.
- **Evidencia**:
  - `src/admin/tools/OwnerGuideTab.tsx:118`: "Retencion de 13.75% (2025) como PPM".
  - `src/admin/tools/TutoresExternosTab.tsx:597`, `:760`.
  - `src/admin/finance/GastosTab.tsx:754`: `amountCLP * 0.1375`.
- **Impacto**: la Ley 21.133 escalona la retención anualmente. A 2025 era 13.75%; para 2026 podría haber aumentado (ruta hacia 17% en 2028). Si efectivamente subió, todos los cálculos de gastos a contadora, pagos a tutores externos y honorarios a dueño de SpA están desfasados.
- **Acción**: verificar SII Circular vigente 2026. Mover constante a `backend/constants/tax_chile.py::BOLETA_HONORARIOS_RATE_2026` con cita.
- **Bloqueo**: no bloquea Bloque 1; crítica para TutoresExternosTab y finanzas internas.

## Alertas MODERADAS abiertas (auditoría transversal 2026-04-21)

### ALERTA-AUDIT-04-21-2 — Disposiciones transitorias Ley 19.628 ↔ 21.719

- **Origen**: legal-docs-keeper 2026-04-21, §4 Área 2.
- **Evidencia**: Privacy v2.4 cita 19.628 como base íntegra; no se verificó si 21.719 deroga parcialmente algún artículo de 19.628 antes de su vigencia total.
- **Acción**: Cristian/abogado verifica en bcn.cl las disposiciones transitorias de 21.719.

### ALERTA-AUDIT-04-21-3 — "10 días hábiles" hardcoded en 4 archivos tras decisión 1A

- **Origen**: legal-docs-keeper 2026-04-21, §4 Área 3 + ALERTA-LEG-5 preexistente.
- **Evidencia**: la decisión batch 2026-04-20 resolvió "10 días corridos" pero `src/pages/SupportPage.tsx:157`, `backend/notifications.py:1038`, `backend/paypal_routes.py:629`, `src/components/TermsOfService.tsx:385` seguían con "hábiles" al 2026-04-20. Verificar si el bloque legal-consolidation-v2 Pieza 4 ya los corrigió.
- **Acción**: re-grep post-commit Bloque 1 para confirmar resolución.

### ALERTA-AUDIT-04-21-5 — Estado ePrivacy Directive vs Regulation

- **Origen**: legal-docs-keeper 2026-04-21, §4 Área 6.
- **Evidencia**: el plan del banner asume ePrivacy Directive 2002/58 vigente. La Regulation ha estado bloqueada en el Consejo UE por años. A 2026-04 requiere confirmación externa.
- **Acción**: consultar eur-lex. Si entró en vigor la Regulation, revisar base legal del banner.

## Alertas INFORMATIVAS abiertas (auditoría transversal 2026-04-21)

### ALERTA-AUDIT-04-21-4 — Cita precisa de Ley 21.096 como modificación Art. 19 N°4 CPR

- **Origen**: legal-docs-keeper 2026-04-21, §4 Área 4.
- **Acción**: Privacy v2.5 debe clarificar que 21.096 modifica el Art. 19 N°4 CPR (no es norma autónoma).

### ALERTA-AUDIT-04-21-9 — Datos sensibles y Ley 21.121

- **Origen**: legal-docs-keeper 2026-04-21, §4 Área 9.
- **Acción**: evaluar en próximo bloque legal si Privacy requiere sección de datos sensibles.

### ALERTA-AUDIT-04-21-10 — Circulares CMF 2024-2026

- **Origen**: legal-docs-keeper 2026-04-21, §4 Área 10.
- **Acción**: revisar antes del bloque checkout-pci-dss.

### ALERTA-AUDIT-04-21-11 — Factura electrónica SII 2024-2026

- **Origen**: legal-docs-keeper 2026-04-21, §4 Área 11.
- **Acción**: revisar si Conniku planea emitir DTE vía API.

### ALERTA-AUDIT-04-21-13 — Protocolo Ley Karin firmado y archivado

- **Origen**: legal-docs-keeper 2026-04-21, §4 Área 13.
- **Acción**: confirmar con Cristian que el Protocolo Ley Karin de Conniku SpA está aprobado, firmado y archivado conforme Art. 211-A CT (obligación del empleador, no del software).

---


## Alertas CRÍTICAS abiertas (bloque-cookie-consent-banner-v1)

### ALERTA-COOKIE-1 — Fecha de vigencia Ley 21.719 no verificada ante fuente oficial

- **Origen**: legal-docs-keeper Capa 0 2026-04-21 (reporte
  `docs/reports/2026-04-21-capa-0-legal-cookies-v1.md`).
- **Evidencia**: el trigger del usuario indica 2026-12-01. El plan en §2.2
  indica 2026-12-13. El código en `src/services/cookieConsentService.ts:13`
  y `src/legal/cookieTexts.ts:16` ambos citan 2026-12-13. Ninguna fecha fue
  verificada ante `bcn.cl` o el Diario Oficial en este turno.
- **Impacto**: CLAUDE.md §Prohibición de inventar información legal prohíbe
  citar fecha específica sin fuente verificable. Publicar Política de
  Cookies v1.1.0 y Política de Privacidad actualizada con fecha incorrecta
  = riesgo reputacional y potencial Art. 12 letra b Ley 19.496
  (información veraz).
- **Acción requerida**: Cristian verifica en
  `https://www.bcn.cl/leychile/navegar?idNorma=1212270` o Diario Oficial.
  Mientras no se verifique: usar redacción "vigencia prevista en diciembre
  de 2026" sin día específico en todos los documentos legales.
- **Bloqueo**: sí, bloquea Pieza 6 del bloque (publicación de Política de
  Cookies v1.1.0 y Privacy actualizada) si estas mencionan la fecha exacta.

---

## Alertas MODERADAS abiertas (bloque-cookie-consent-banner-v1)

### ALERTA-COOKIE-2 — Texto canónico "marketing" potencialmente ambiguo

- **Origen**: legal-docs-keeper Capa 0 2026-04-21 §4.1 del reporte.
- **Evidencia**: el texto canónico en `shared/cookie_consent_texts.py`
  (hash `766ee8e1...`) para la categoría marketing dice "Permitirían medir
  campañas y mostrarte contenido relevante". La frase "mostrarte contenido
  relevante" es ambigua y podría interpretarse como perfilado Art. 22 GDPR
  (decisiones automatizadas con efectos significativos).
- **Impacto**: GDPR Art. 4(11), Art. 13-14 (información clara e
  inequívoca). Una redacción ambigua puede invalidar el consentimiento.
- **Acción**: Cristian decide (D-02 del reporte): mantener texto actual o
  reformular a versión propuesta en §4.1. Reformular obliga a bump de hash
  y re-ejecución de Pieza 1 Backend.

### ALERTA-COOKIE-3 — Falta aviso "funcionales post-login por ejecución de contrato" en modal

- **Origen**: legal-docs-keeper Capa 0 2026-04-21 §3.3 y §4.3 del reporte.
- **Evidencia**: el plan §3.2 declara que las claves funcionales
  post-login (progreso académico, admin HR) se almacenan bajo Art. 6(1)(b)
  RGPD (ejecución contrato) y NO se gatean por consentimiento. El modal de
  personalización del plan §9.2 no explica esta distinción al usuario
  logueado.
- **Impacto**: GDPR Art. 13 (información al titular). Un usuario logueado
  que rechaza "funcionales" espera que TODO lo funcional se bloquee, pero
  el sistema seguirá escribiendo sus datos de progreso. Sin aviso, hay
  expectativa frustrada.
- **Acción**: agregar texto dinámico bajo toggle "Funcionales" visible
  solo a logueados (D-06 del reporte).

### ALERTA-COOKIE-4 — Clasificación `cc_visitor_uuid` requiere decisión humana

- **Origen**: legal-docs-keeper Capa 0 2026-04-21 §3.1 del reporte.
- **Evidencia**: el plan §3.5 clasifica `cc_visitor_uuid` como esencial
  con duda documentada. Jurisprudencia EDPB y decisiones CNIL interpretan
  la excepción Art. 5(3) ePrivacy restrictivamente.
- **Impacto**: si un regulador europeo estricto audita, puede reclasificar
  la cookie como no esencial y exigir que se gatée por consentimiento. El
  UUID con vida de 5 años sería especialmente atacable.
- **Acción**: Cristian decide (D-01 del reporte): (a) mantener como
  esencial con las 4 condiciones de §3.1 (plazo 13 meses, uso restringido,
  regeneración al retirar, declaración explícita); o (b) mover a funcional
  y renombrar `cc_visitor_uuid_optional`.

---

## Alertas INFORMATIVAS abiertas (bloque-cookie-consent-banner-v1)

### ALERTA-COOKIE-5 — Inventario IndexedDB/sessionStorage no verificado

- **Origen**: legal-docs-keeper Capa 0 2026-04-21 §3.4.
- **Evidencia**: el plan solo inventaria `localStorage` y cookies HTTP.
  No se ejecutó Grep de `indexedDB` o `sessionStorage` en este turno.
- **Acción**: ejecutar en auditoría semanal próxima o durante Pieza 2:
  `grep -rn "indexedDB\|sessionStorage" src/`. Si hay usos, categorizar
  y añadir a la política.

### ALERTA-COOKIE-6 — Política de Cookies actual no desagrega pre/post-login

- **Origen**: legal-docs-keeper Capa 0 2026-04-21 §3.3 del reporte.
- **Evidencia**: `src/pages/CookiesPolicy.tsx` líneas 206-242 lista todas
  las claves funcionales juntas sin distinguir "funcional por
  consentimiento (pre-login)" de "funcional por ejecución de contrato
  (post-login)".
- **Acción**: Pieza 6 del bloque debe reestructurar la tabla del
  inventario con 2 secciones. Bump `COOKIES_VERSION` a `1.1.0`.

### ALERTA-COOKIE-7 — Falta campo `pseudonymized_at_utc` en schema cookie_consents

- **Origen**: legal-docs-keeper Capa 0 2026-04-21 §5.1 del reporte.
- **Evidencia**: el plan §5.1 propone pseudonimización a 12 meses pero no
  define campo de auditoría en el schema. El job (Pieza 5) modifica IP y
  UA a NULL sin dejar rastro de cuándo.
- **Acción**: agregar columna opcional `pseudonymized_at_utc TIMESTAMP NULL`
  al schema antes de que Pieza 1 se dé por cerrada. Decisión D-08 del
  reporte.

### ALERTA-COOKIE-8 — "Retirar todo el consentimiento" sin paridad visual

- **Origen**: legal-docs-keeper Capa 0 2026-04-21 §4.3 del reporte.
- **Evidencia**: el plan §9.2 propone mostrar el botón de retirar como
  link text al costado de los 3 botones principales.
- **Impacto**: GDPR Art. 7(3): retirar consentimiento debe ser "tan fácil
  como otorgarlo". Un link discreto frente a botones grandes puede
  considerarse dark pattern.
- **Acción**: elevar a botón con contraste igual a los otros. Decisión
  D-05 del reporte.

---

## Alertas CRÍTICAS abiertas (2d.7)

### ALERTA-2D7-1 — Deuda C1 preexistente: xhtml2pdf SSRF en V1 (`backend/collab_routes.py`)

- **Origen**: backend-builder sub-sub-bloque 2d.7 (2026-04-18) + reporte
  `docs/reports/2026-04-18-capa-1-backend-builder-2d7-export.md` §3.
- **Impacto regulatorio**: mientras el código V1 (`collab_routes.py:455-503`
  con xhtml2pdf) siga desplegado en producción, el vector SSRF documentado
  (`<img src="http://169.254.169.254">` → AWS metadata leak) está activo en
  un camino alternativo del sistema, aun cuando el V2 (`workspaces_export.py`)
  sea seguro por diseño.
- **Régimen aplicable**: GDPR Art. 32 (seguridad del tratamiento —
  "medidas técnicas apropiadas"), Ley 19.628 Art. 11 (responsabilidad del
  responsable del tratamiento en la seguridad de los datos). Una brecha
  de credenciales cloud producida por este SSRF habilita fuga masiva de
  datos personales de la plataforma.
- **Mitigación parcial**: el flujo happy path ya usa V2. La vulnerabilidad
  se activaría sólo si un atacante puede invocar explícitamente el endpoint
  V1. Requiere verificar con gap-finder / code-reviewer si el endpoint V1
  sigue expuesto en el router de `server.py` o si ya está fuera de la API
  pública.
- **Acción recomendada**:
  (a) retirar el router de V1 de `server.py` antes del próximo deploy
      (decisión de producto).
  (b) dejar V1 en `collab_routes.py` con `@router.post` comentado o
      condicionado a flag, hasta una iteración de limpieza posterior.
  (c) actualizar `docs/pendientes.md` C1: "mitigado en el camino feliz,
      pendiente retirar endpoint V1".
- **Bloqueo**: sí, para el deploy del 2d.7 a producción. No tiene sentido
  publicar V2 seguro coexistiendo con V1 vulnerable.

## Alertas MODERADAS abiertas (2d.7)

### ALERTA-2D7-2 — Frontend promete "portada" y "rúbrica" que el backend no implementa (Art. 12 letra b Ley 19.496)

- **Origen**: análisis del legal-docs-keeper 2026-04-19 sobre
  `src/components/workspaces/Export/ExportModal.tsx:131-144` y
  `backend/workspaces_export.py:524-533`.
- **Evidencia**: el modal muestra dos checkboxes ("Tapa/portada del
  documento", "Incluir rúbrica de evaluación como anexo") marcables por
  el usuario. El backend recibe los flags `include_cover` e
  `include_rubric` pero **no los renderiza** (los parámetros se declaran
  en Pydantic pero no se usan en `export_pdf` ni `export_docx`).
- **Impacto**: Ley 19.496 Art. 12 letra b (información veraz y oportuna
  sobre las condiciones del servicio); Art. 16 letra g (cláusulas que
  generen expectativa injustificada). Un usuario que marcó "incluir
  portada" y recibe un archivo sin portada tiene argumento de
  incumplimiento. En la fase actual el volumen es bajo, pero el riesgo
  escala con el uso.
- **Opciones de resolución**:
  (a) **Preferida**: desactivar los checkboxes en el frontend con
      mensaje "Disponible próximamente" hasta que el backend los
      implemente. Tarea del frontend-builder.
  (b) Implementar efectivamente portada y rúbrica en el backend antes
      del deploy del 2d.7. Tarea del backend-builder (alcance que no
      estaba en el plan original).
  (c) **Defensiva**: cubrirse con cláusula T&C §8.2 letra c del
      borrador de este mismo ciclo (ver
      `docs/legal/drafts/2026-04-19-terms-2d7-export.md`). Válida pero
      subóptima.
- **Bloqueo**: parcial. El deploy puede proceder si se aplica (a) o si
  (c) queda publicado antes del deploy.

### ALERTA-2D7-3 — Whitelist de imágenes no incluye Supabase Storage: pérdida de datos silenciosa

- **Origen**: backend-builder sub-sub-bloque 2d.7 (reporte §4) y análisis
  del legal-docs-keeper 2026-04-19.
- **Evidencia**: `backend/workspaces_export.py:78-87` — la whitelist
  `_ALLOWED_REMOTE_IMG_DOMAINS` sólo contiene `conniku.com`, `www.conniku.com`,
  `cdn.conniku.com`, `api.conniku.com`. Imágenes subidas al editor cuyo
  hostname sea `*.supabase.co` son eliminadas por `inline_remote_images`
  sin aviso al usuario.
- **Impacto**: consumidor (Art. 12 letra b Ley 19.496: información veraz);
  potencialmente propiedad intelectual si el usuario tenía una imagen
  propia en el documento que desaparece sin registro. No hay fuga de
  datos, es **pérdida silenciosa**.
- **Acción recomendada**:
  (a) Agregar el hostname real del bucket Supabase del proyecto a la
      whitelist. Requiere conocer el hostname
      (`xxxxxxxxxxxx.supabase.co`) y tratarlo como constante.
  (b) Cuando una imagen sea eliminada por estar fuera de la whitelist,
      registrar un warning **visible al usuario** (no sólo en logs del
      servidor) antes de entregar el archivo.
  (c) Actualizar Privacy §6 para declarar Supabase como encargado de
      tratamiento del que Conniku lee imágenes al exportar (cuando (a)
      se implemente). Ver también ALERTA-LEG-4 preexistente que ya
      listaba Supabase como no declarado.
- **Bloqueo**: recomendable antes del deploy, no bloqueante per se.

### ALERTA-2D7-4 — Nueva sub-sección 5.3 Privacy Policy requiere publicación

- **Origen**: legal-docs-keeper 2026-04-19, borrador
  `docs/legal/drafts/2026-04-19-privacy-policy-2d7-export.md`.
- **Impacto**: Ley 19.628 Art. 4° (información al titular sobre todos
  los tratamientos); GDPR Art. 13-14. Al introducir el tratamiento
  "envío de contenido del documento al backend para generar archivo
  descargable, con eliminación silenciosa de imágenes externas y
  limpieza de metadatos", corresponde declararlo.
- **Acción**: publicar v2.3 (o v2.2 si se publica antes del 2c) según
  borrador referenciado.
- **Bloqueo**: acompaña al deploy del 2d.7, no lo bloquea por sí sola
  si las ALERTA-2D7-1 y ALERTA-2D7-2 ya están resueltas.

### ALERTA-2D7-5 — Cláusula T&C "Exportación de documentos" pendiente

- **Origen**: legal-docs-keeper 2026-04-19, borrador
  `docs/legal/drafts/2026-04-19-terms-2d7-export.md`.
- **Impacto**: Ley 17.336 (propiedad intelectual: responsabilidad del
  usuario sobre contenido de terceros exportado); Ley 19.496 Art. 12
  (información sobre condiciones); Ley 19.799 (aclarar que el archivo
  exportado no es firma electrónica avanzada).
- **Acción**: publicar nueva §8 "Exportación de documentos" según
  borrador. MINOR, sin re-aceptación requerida.
- **Bloqueo**: acompaña al deploy del 2d.7. Idealmente se publica junto
  con la nueva sub-sección de Privacy.

## Alertas INFORMATIVAS abiertas (2d.7)

### ALERTA-2D7-6 — Futuro: render de portada con nombres de co-autores requiere consentimiento

- **Origen**: legal-docs-keeper 2026-04-19, análisis preventivo.
- **Impacto**: si en una iteración futura el backend renderiza
  efectivamente la portada con los nombres de los miembros del
  workspace que tengan `chars_contributed > 0`, esto constituye un
  tratamiento del nombre de cada co-autor que termina en un archivo
  fuera del control de Conniku. Legalmente:
  (a) La base legal preferida es la **ejecución del contrato de
      colaboración** (cada miembro sabe que co-edita un documento que
      puede exportarse).
  (b) Alternativamente, consentimiento explícito de cada co-autor
      sobre "mi nombre puede aparecer en la portada de cualquier
      export".
  (c) La práctica estándar en plataformas colaborativas (Google Docs,
      Notion) es (a): se asume que co-editar implica que tu nombre
      puede aparecer en el documento exportado.
- **Acción**: cuando la funcionalidad de portada se implemente,
  revisar este punto. Si se opta por (a), declararlo en Privacy y T&C
  como "al aceptar colaborar en un documento, usted consiente que su
  nombre aparezca en los archivos derivados que otros miembros
  exporten". Si se opta por (b), agregar flujo de consentimiento
  explícito en la UI.
- **Bloqueo**: ninguno hoy. Aplicable sólo cuando se implemente la
  funcionalidad.

### ALERTA-2D7-7 — Contenido académico exportado con citas de terceros: responsabilidad del usuario

- **Origen**: legal-docs-keeper 2026-04-19.
- **Impacto**: Ley 17.336 Chile, Convenio de Berna. El usuario puede
  incluir fragmentos de libros, imágenes con derechos de autor, o
  contenido no propio dentro de un documento que luego exporta y
  distribuye.
- **Mitigación**: cubierta por §8.3 del borrador T&C (responsabilidad
  del usuario + exención de Conniku + cita a Art. 71 B Ley 17.336
  sobre cita académica permitida).
- **Acción**: verificar con abogado que la cita a Art. 71 B es correcta
  y vigente. Si no, quitar la cita específica y dejar texto genérico
  "conforme a la legislación vigente sobre propiedad intelectual".
- **Bloqueo**: ninguno.

## Alertas CRÍTICAS abiertas (heredadas del 2c — sin resolver)

### ALERTA-2C-1 — Política de Privacidad v2.1 no declara procesamiento Athena

- **Origen**: gap-finder del sub-bloque 2c (2026-04-18), GAP-2.
- **Impacto**: obligación Art. 4° Ley 19.628 (Chile) y GDPR Art. 13-14
  (UE) de informar al titular sobre todos los tratamientos. La v2.1
  vigente solo menciona "resúmenes, asistente de estudio" como finalidad
  de Anthropic. Omite: chat privado Athena, sugerencias de reescritura
  sobre staging propio, retención del historial, transferencia
  internacional específica a Anthropic.
- **Acción**: publicar v2.2 según borrador
  `docs/legal/drafts/2026-04-18-privacy-policy-2c-athena.md` antes del
  deploy del 2c a producción.
- **Bloqueo**: sí. No desplegar 2c a usuarios reales sin resolver.

### ALERTA-2C-2 — T&C no declaran cuota Free de Athena (3/día) ni descargo sobre exactitud

- **Origen**: gap-finder del sub-bloque 2c (2026-04-18), GAP-2.
- **Impacto**: Art. 12 letra b Ley 19.496 Chile (información veraz y
  oportuna sobre condiciones del servicio); Art. 16 letra a-g sobre
  cláusulas abusivas. Un usuario Free que ve "asistente inteligente" sin
  mención de cuota podría reclamar "limitación no informada". Separado:
  sin descargo específico sobre exactitud, un estudiante que confía en
  respuesta errada de Athena podría imputar responsabilidad a Conniku.
- **Acción**: publicar v3.0 de T&C con nueva §4 bis según borrador
  `docs/legal/drafts/2026-04-18-terms-of-service-2c-athena.md`.
  Requiere mecanismo de re-aceptación por cambio MAJOR.
- **Bloqueo**: sí, doble. No publicar 2c sin cláusula Athena, y el
  mecanismo de re-aceptación requiere la tabla `user_agreements` que
  sigue pendiente (ver ALERTA-LEG-1 preexistente).

### ALERTA-2C-3 — Retención indefinida del chat privado Athena sin plazo máximo

- **Origen**: análisis del legal-docs-keeper 2026-04-18 sobre
  `backend/database.py:1945-1962` (WorkspaceAthenaChat) y
  `backend/workspaces_athena.py:574-592` (delete endpoint).
- **Impacto**: GDPR Art. 5(1)(e) limitación del plazo de conservación;
  Ley 19.628 Art. 6° (eliminación cuando datos pierden finalidad). El
  chat privado Athena persiste mientras el workspace exista (solo
  CASCADE en eliminación del workspace + borrado manual por usuario vía
  `DELETE /athena/chats`). No hay plazo máximo automático.
- **Mitigación parcial ya presente**: endpoint de borrado manual por
  usuario, cascade al eliminar workspace. Esto cumple con principio de
  control del titular pero no con principio de minimización automática.
- **Acción recomendada**: (a) decidir con abogado si el control manual
  actual es suficiente para la fase del producto; (b) si no, agregar
  campo `expires_at` o job periódico de purga tras N meses de
  inactividad. (c) declarar comportamiento real en Política de
  Privacidad v2.2 §9 (ya cubierto en borrador del cambio 7).
- **Bloqueo**: parcial. Se puede desplegar 2c con declaración honesta de
  "conserva mientras workspace exista" en v2.2, pero debe abrirse bloque
  posterior para definir plazo máximo si abogado lo exige.

### ALERTA-2C-4 — DPA con Anthropic: estado desconocido

- **Origen**: legal-docs-keeper 2026-04-18.
- **Impacto**: GDPR Art. 28 exige contrato escrito (DPA) con todo
  encargado de tratamiento. Si Conniku tiene expansión o usuarios UE
  activos, el envío de contenido del usuario a Anthropic sin DPA
  firmado es incumplimiento directo.
- **Acción**: Cristian debe confirmar si existe DPA firmado con
  Anthropic (o si los términos comerciales estándar de la Anthropic API
  incluyen cláusulas equivalentes). Si no existe, solicitar a Anthropic
  su DPA estándar y archivarlo. El borrador de Privacy v2.2 asume de
  buena fe que existen salvaguardias; si no existen, retirar esa
  afirmación antes de publicar.
- **Bloqueo**: bloquea expansión a UE con volumen significativo y
  bloquea contratos B2B con clientes que exijan evidencia de DPA.

## Alertas MODERADAS abiertas (2c)

### ALERTA-2C-5 — Afirmación "Anthropic no entrena con datos API" requiere verificación

- **Origen**: legal-docs-keeper 2026-04-18, decisión de redacción de
  borrador Privacy v2.2.
- **Impacto**: el borrador de Privacy v2.2 incluye la afirmación "el
  contenido enviado a través de la API no se utiliza para entrenar sus
  modelos de lenguaje". Esto refleja el compromiso público de Anthropic
  vigente al conocimiento del agente, pero debe verificarse literalmente
  contra el contrato actual de Anthropic antes de publicar. Si el
  contrato no lo garantiza, la afirmación se retira.
- **Acción**: Cristian verifica en https://www.anthropic.com/legal y
  confirma o retira.

## Alertas CRÍTICAS preexistentes (heredadas de reporte 2026-04-17)

Las siguientes ya estaban abiertas antes del 2c/2d.7 y siguen sin
resolverse. Se replican aquí como recordatorio, no porque los bloques
posteriores las hayan introducido:

### ALERTA-LEG-1 — Tabla `user_agreements` inexistente

- Impacto probatorio: no se puede demostrar qué versión de T&C aceptó
  cada usuario. Bloquea además el mecanismo de re-aceptación que exige
  el v3.0 propuesto por este borrador 2c.

### ALERTA-LEG-2 — Dos versiones divergentes de T&C (pages vs components)

- Riesgo: usuario acepta modal, consulta página pública, ven textos
  distintos.

### ALERTA-LEG-3 — "16 años" en lugar de "18 años"

- Contradice la regla operacional CLAUDE.md ("plataforma exclusiva para
  adultos"). Presente en Privacy §10, T&C §3, y prompt del chatbot
  Konni `backend/server.py:1078`.

### ALERTA-LEG-4 — Supabase, Firebase Cloud Messaging, Capacitor, Google OAuth no declarados en Privacy §6

- Faltan encargados de tratamiento. Incumple GDPR Art. 13.
- **Interacción con 2d.7**: ALERTA-2D7-3 refuerza esta alerta (Supabase
  como origen de imágenes leídas al exportar, cuando se agregue a la
  whitelist).

### ALERTA-LEG-5 — Plazo de retracto: "10 días hábiles" (código) vs "10 días corridos" (CLAUDE.md)

- Inconsistencia sin resolver, requiere verificar Art. 3bis Ley 19.496
  en leychile.cl.

## Alertas abiertas (Capa 0 nomina-chile-v1, 2026-04-21)

### ALERTA-NOM-1 — TOPE_IMPONIBLE_AFP_UF = 81,6 UF sin verificar para 2026 (CRÍTICA)

- **Origen**: legal-docs-keeper 2026-04-21, Capa 0 bloque
  `nomina-chile-v1`, borrador
  `docs/legal/drafts/2026-04-21-labor-chile-py.md`.
- **Evidencia**: el valor 81,6 UF proviene de
  `backend/payroll_calculator.py:149` y
  `src/admin/shared/ChileLaborConstants.ts:26`. Es el valor histórico
  2024-2025. La Superintendencia de Pensiones reajusta topes
  anualmente por IPC (DL 3500 Art. 16). El brief verificado 2026-04-21
  de Cristian NO trajo evidencia fresca del valor 2026.
- **Impacto**: DL 3500 Art. 16. Si el tope oficial 2026 es superior
  a 81,6 UF, Conniku calcularía base AFP sobre un tope menor al legal
  y subaportaría. Liquidación incorrecta con riesgo de reliquidación
  Art. 63 bis CT.
- **Acción recomendada**: Cristian o contador verifica en
  https://www.spensiones.cl/portal/institucional/594/w3-propertyvalue-9911.html
  el tope AFP vigente 2026 antes de que el builder integre
  `labor_chile.py` en producción. Si hay diferencia, actualizar la
  constante + test de invariante + ejecutar paridad py↔ts.
- **Bloqueo**: sí, para el merge del bloque `nomina-chile-v1`.

### ALERTA-NOM-2 — MUTUAL_BASE_PCT = 0,93% sin verificar para 2026 (MODERADA)

- **Origen**: legal-docs-keeper 2026-04-21, Capa 0 bloque
  `nomina-chile-v1`, borrador
  `docs/legal/drafts/2026-04-21-labor-chile-py.md`.
- **Evidencia**: 0,93% proviene de
  `backend/payroll_calculator.py:141` y
  `src/admin/shared/ChileLaborConstants.ts:56`. Es la tasa base
  Ley 16.744 Art. 15 histórica.
- **Impacto**: Ley 16.744. La tasa puede variar por DS anual del
  Ministerio del Trabajo. Si el giro de Conniku SpA (631200) tiene
  tasa de siniestralidad específica por resolución de la Mutual, el
  cálculo puede quedar bajo lo legalmente exigido.
- **Acción recomendada**: Cristian verifica con la Mutual adherida
  (ACHS, Mutual de Seguridad o IST) cuál es la tasa efectiva 2026
  aplicable al giro 631200. Si hay recargo por siniestralidad,
  agregar constante `MUTUAL_SINIESTRALIDAD_PCT` separada.
- **Bloqueo**: no bloqueante para merge (Conniku SpA sin empleados
  activos según D-A batch), pero debe resolverse antes del primer
  empleado dependiente.

### ALERTA-NOM-3 — Factores de rebaja tramos impuesto 2ª categoría 2026 sin verificar literalmente (MODERADA)

- **Origen**: legal-docs-keeper 2026-04-21, Capa 0 bloque
  `nomina-chile-v1`, borrador
  `docs/legal/drafts/2026-04-21-tax-chile-py.md`.
- **Evidencia**: los factores 0.54, 1.74, 4.49, 11.14, 17.80, 23.32,
  38.82 se heredan de `backend/payroll_calculator.py:180-189`. El
  SII reajusta anualmente estos factores cuando reajusta la UTM. El
  brief 2026-04-21 confirmó "último tramo ~310 UTM / 40%" pero no
  verificó literalmente cada factor contra la circular SII 2026.
- **Impacto**: DL 824 Art. 43. Si los factores 2026 reajustados son
  ligeramente distintos (centésimas de UTM por IPC), el impuesto
  calculado por Conniku tendría un sesgo pequeño pero sistemático
  en toda liquidación. Riesgo legal bajo en monto, alto en auditoría
  fiscal agregada.
- **Acción recomendada**: cotejar contra
  https://www.sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto2026.htm
  los 8 factores vigentes enero 2026 antes de commit. Dejar cita
  de circular SII específica de 2026 en el comentario.
- **Bloqueo**: no bloquea merge (último tramo 310 UTM está correcto
  que es el que más importa para empleados de sueldo alto); sí
  corregir en iteración post-merge.

### ALERTA-NOM-4 — PPM_PROPYME_14D3_PCT sin verificar para Conniku SpA primer año (MODERADA)

- **Origen**: legal-docs-keeper 2026-04-21, Capa 0 bloque
  `nomina-chile-v1`, borrador
  `docs/legal/drafts/2026-04-21-tax-chile-py.md`.
- **Evidencia**: el valor 0,25% proviene de
  `src/admin/shared/accountingData.ts:989`. Conniku SpA inició
  actividades 2026-04-08 bajo régimen ProPyme Transparente 14 D3.
  Para el primer año de actividad, la tasa PPM puede estar fijada
  por resolución SII específica y no ser 0,25%.
- **Impacto**: DL 824 Art. 14 D3. PPM mal calculado genera diferencia
  de declaración F29 mensual con ajuste anual en F22. Impacto es de
  flujo de caja, no de monto final del impuesto, pero riesgo de
  multa por mal cálculo.
- **Acción recomendada**: Cristian confirma con contador la tasa PPM
  efectiva aplicable a Conniku SpA en 2026. Actualizar constante +
  test antes del merge.
- **Bloqueo**: no bloquea merge (constante existirá con valor legacy
  + `[VERIFICAR]`), pero debe resolverse antes de primera declaración
  F29 afectada.

### ALERTA-NOM-5 — Retención honorarios 13,75% hardcoded en 8 ubicaciones frontend (CRÍTICA) — **RESUELTA 2026-04-21**

- **Origen**: legal-docs-keeper 2026-04-21 cross-check con plan
  `docs/plans/bloque-nomina-chile-v1/plan.md` §1.6.
- **Evidencia**: el plan lista 8 ubicaciones frontend con `0.1375`
  hardcoded:
  - `src/admin/tools/OwnerGuideTab.tsx:118`
  - `src/admin/tools/TutoresExternosTab.tsx:597, 760`
  - `src/admin/finance/GastosTab.tsx:754, 1157`
  - `src/admin/shared/accountingData.ts:69`
  - `src/components/TermsOfService.tsx:1087`
  - `src/pages/HRDashboard.tsx:7804, 8689, 8883`
- **Impacto**: Ley 21.133. La tasa correcta vigente 2026-01-01 es
  15,25% (D-C batch confirmado). Cada UI que muestre 13,75% induce
  al usuario a cálculo erróneo (Ley 19.496 Art. 12 letra b —
  información veraz).
- **Acción recomendada**: builder reemplaza todos los literales por
  import de `RETENCION_HONORARIOS_2026_PCT` o equivalente del
  espejo `shared/chile_tax.ts`. Ya está en el plan §3.2. El gap es
  legal hasta que el builder lo resuelva.
- **Bloqueo**: sí, hasta merge del bloque `nomina-chile-v1`.
- **Resolución 2026-04-21**: PR #22 (`nomina-chile-v1`) mergeado 23:08 UTC. `backend/constants/tax_chile.py:33` define `RETENCION_HONORARIOS_2026_PCT = Decimal("0.1525")` con cita Ley 21.133. `shared/chile_constants.ts:117` espejo TS con el mismo valor. GAP RESIDUAL no bloqueante: `src/pages/HRDashboard.tsx` aún contiene `TAX_BRACKETS` con tramo viejo (verificado con Grep línea 266-267). Se eleva como ALERTA-VIEWER-2 porque es UI informativa, no motor de cálculo.

### ALERTA-NOM-6 — Último tramo impuesto 2ª categoría frontend desfasado 150 UTM vs 310 UTM (CRÍTICA) — **RESUELTA 2026-04-21**

- **Origen**: legal-docs-keeper 2026-04-21 cross-check con plan §1.5.
- **Evidencia**: `src/admin/shared/ChileLaborConstants.ts:68`
  define `{ from: 150, to: Infinity, rate: 0.4, deduction: 30.82 }`.
  El valor correcto según SII 2026 y según backend
  `payroll_calculator.py:188` es `(310.0, math.inf, 0.40, 38.82)`.
  Divergencia de 160 UTM en el corte + factor de rebaja distinto.
- **Impacto**: DL 824 Art. 43. Empleado con renta entre 150 UTM
  (~$10,5M) y 310 UTM (~$21,9M) ve en la UI del admin un impuesto
  distinto al que realmente se le retiene. Transparencia informativa
  violada (Art. 12 letra b Ley 19.496); también afecta herramientas
  de simulación para clientes del módulo HR.
- **Acción recomendada**: builder corrige frontend importando desde
  `shared/chile_tax.ts` los tramos 2026 correctos. Plan §3.2
  renglón `ChileLaborConstants.ts` lo cubre.
- **Bloqueo**: sí, hasta merge del bloque `nomina-chile-v1`.
- **Resolución 2026-04-21**: PR #22 mergeado. `backend/constants/tax_chile.py:59` define `IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM` con tramo `(310, ∞, 0.40, 38.82)` cita DL 824 Art. 43 + circular SII 2026. `shared/chile_constants.ts:149-150` espejo TS `[120, 310, 0.35, 23.32]` y `[310, null, 0.4, 38.82]`. GAP RESIDUAL no bloqueante: `src/pages/HRDashboard.tsx:266-267` mantiene tramo viejo.

### ALERTA-NOM-7 — Divergencia TOPE_AFC entre motores duales (CRÍTICA) — **RESUELTA 2026-04-21**

- **Origen**: legal-docs-keeper 2026-04-21 cross-check con plan §1.5.
- **Evidencia**:
  - `backend/payroll_calculator.py:155` → `TOPE_AFC_UF = 122.6`
  - `backend/hr_routes.py` (según plan §1.5) → `TOPE_AFC_UF = 126.6`
  - `src/admin/shared/ChileLaborConstants.ts:27` → `afcUF: 122.6`
  - Valor verificado batch D-B = **135,2 UF** (spensiones.cl 2026-02).
- **Impacto**: Ley 19.728. Los tres archivos están desfasados respecto
  al valor oficial 2026 (135,2 UF). Cualquier empleado con sueldo
  sobre 122,6 UF subaporta a AFC. Sobre 126,6 UF el desfase es mayor
  en el motor de `hr_routes.py`. Riesgo laboral directo en
  reliquidación.
- **Acción recomendada**: builder unifica los tres archivos al valor
  135,2 UF importando desde `backend/constants/labor_chile.py`
  (constante `TOPE_IMPONIBLE_AFC_UF`). Eliminar los literales
  divergentes.
- **Bloqueo**: sí, hasta merge del bloque `nomina-chile-v1`.
- **Resolución 2026-04-21**: PR #22 mergeado. `backend/constants/labor_chile.py:111` define `TOPE_IMPONIBLE_AFC_UF: Decimal = Decimal("135.2")` con cita Ley 19.728 Art. 6°. Test `src/admin/shared/__tests__/ChileLaborConstants.test.ts:34` verifica invariante "TOPES.afcUF es 135.2 (no 122.6 desfasado)". Alertas ALERTA-NOM-5/6/7 en conjunto se consideran RESUELTAS en el core (backend + shared).

### ALERTA-NOM-8 — Tope imponible AFC sin referencia histórica previa a 2026-02 (INFORMATIVA)

- **Origen**: legal-docs-keeper 2026-04-21.
- **Evidencia**: el borrador `labor_chile.py` solo trae el valor
  vigente 2026-02-01 (135,2 UF). Si Conniku necesita reliquidar
  períodos anteriores a 2026-02-01, no tiene tabla histórica.
- **Impacto**: Art. 63 bis CT (reliquidación por error). Bajo volumen
  dado que Conniku SpA recién inició actividades 2026-04-08, pero
  aplica al módulo HR que sirve a clientes externos con empleados
  previos.
- **Acción recomendada**: considerar agregar
  `TOPE_IMPONIBLE_AFC_UF_HISTORICO: dict[date, float]` en bloque
  futuro. Por ahora fuera de scope. Documentar en
  `registry_issues.md` como id `afc-tope-historial`.
- **Bloqueo**: ninguno.

## Alertas abiertas (Capa 0 legal-viewer-v1, 2026-04-21)

### ALERTA-VIEWER-1 — Rate-limit propuesto 60/h puede ser muy agresivo para uso legítimo (MODERADA)

- **Origen**: legal-docs-keeper 2026-04-21, Capa 0 bloque `legal-viewer-v1`,
  cross-check con plan §3.3 (60 POST/h por IP-pseudo) y recomendación
  gap-finder (subir a 300/h).
- **Evidencia**:
  - Plan §3.3 bullet de backend: "Rate-limit: máx 60 POST/hora por IP-pseudo".
  - Plan §6.R-M2: idempotencia client-side con flag localStorage por
    `<docKey>_<hash>` ya cubre el caso del F5 compulsivo de UN usuario.
  - Caso real de usuario legítimo: un Usuario que lee Privacy, vuelve al
    modal desde otra página (re-open), lee Cookies, re-open Privacy,
    lee Terms, re-open Cookies = 4-6 aperturas en < 10 minutos sin ser
    abuso. Si además Cristian abre internamente para revisión = +5 en
    la misma IP NAT corporativa.
  - Caso de red NAT (coworking, universidad, oficina): decenas de
    usuarios legítimos comparten IP pública. 60/h por IP significa ~1
    apertura cada minuto para TODA la red. Insuficiente.
- **Análisis 300/h**:
  - Pro: cubre uso legítimo NAT grande. Idempotencia client-side ya
    absorbe el scroll-re-open.
  - Contra: un bot que use solo 5/min puede igualmente inflar el log
    hasta 7200/día por IP. Mitigación: pseudonimización IP a 12 meses,
    + logs de `document_views` no se usan para consent (se usan sólo
    como evidencia probatoria de "se ofreció la lectura").
  - Contra adicional: si el atacante rota IP (proxy, VPN), el rate-limit
    por IP es bypasseable de todos modos. 60 vs 300 no mueve la aguja
    defensiva.
- **Recomendación**: **subir a 300/h por IP-pseudo**, pero combinar con:
  1. Idempotencia client-side con localStorage flag
     `conniku_legal_viewed_<docKey>_<hash>_<sessionStart>` (una sola POST
     por sesión del navegador por docKey por versión). Esto es lo más
     efectivo contra el F5 compulsivo.
  2. Rate-limit MÁS permisivo (300/h) para no frustrar NAT legítimos.
  3. Middleware detecta burst anómalo (> 10 POST/min sostenido por 5
     min) y responde 429 temporal con backoff, sin rechazar permanente.
  4. Logs de burst se registran aparte (tabla o metric) para análisis
     post-mortem, sin bloquear usuario.
- **Alternativa considerada y descartada**: rate-limit por IP+session
  (sessionStorage token). Descartada porque sessionStorage se resetea en
  cada pestaña nueva, inflando el contador legítimo sin aportar defensa
  adicional.
- **Bloqueo**: no bloquea Capa 0 (es criterio de implementación). El
  backend-builder debe implementar 300/h + idempotencia client-side en
  Capa 1. Si Cristian prefiere 60/h por conservadurismo, respetar esa
  decisión y documentarla aquí.
- **Revisión 2026-04-21 post-merge PR #23 (Capa 0 multi-document-consent-v1)**:
  `backend/legal_document_views_routes.py:33` documenta en comentario
  "Rate limit: 300 POST/hora por IP (aprobado por legal-docs-keeper D-L5)".
  Queda PENDIENTE verificar en merge PR #23 que el decorador
  `@limiter.limit("300/hour")` esté aplicado efectivamente al endpoint
  POST. Si no lo está, abrir ALERTA-VIEWER-1-REAL. Truth-auditor de
  bloque multi-document-consent-v1 debe ejecutar esa verificación.
  Estado: ABIERTA (verificación pendiente).

### ALERTA-VIEWER-2 — HRDashboard.tsx con tramos impuesto 2024 tras merge PR #22 (MODERADA)

- **Origen**: legal-docs-keeper 2026-04-21, Capa 0 bloque `legal-viewer-v1`,
  cross-check con resolución de ALERTA-NOM-5/6/7.
- **Evidencia**:
  - `src/pages/HRDashboard.tsx:259-268` (verificado con Read 2026-04-21):
    `TAX_BRACKETS` contiene 8 tramos con `{ from: 150, to: Infinity,
    rate: 0.4, deduction: 30.82 }` como último tramo + comentario
    "Tramos 2024 — en UTM. Actualizar anualmente."
  - `backend/constants/tax_chile.py:59` (valores oficiales 2026):
    último tramo `(310, ∞, 0.40, 38.82)`.
  - `shared/chile_constants.ts:149-150`: espejo TS correcto `[120, 310,
    0.35, 23.32]` y `[310, null, 0.4, 38.82]`.
  - PR #22 no tocó `HRDashboard.tsx` (cross-check: `git log --oneline`
    3ad731a mergeado no menciona HRDashboard en diff).
- **Impacto**: Ley 19.496 Art. 12 letra b (información veraz). La UI del
  módulo HR muestra cálculo de impuesto 2024 desfasado. Empleado simulado
  con renta entre 150 UTM y 310 UTM ve un impuesto incorrecto en la
  pantalla mientras que el motor real calcula según backend. Riesgo
  reputacional bajo (es simulador, no afecta retención real) pero viola
  principio de información consistente.
- **Acción recomendada**:
  (a) fuera de scope del bloque `legal-viewer-v1` actual. Este bloque toca
      documentos legales, no simulador HR.
  (b) abrir bloque correlativo `nomina-chile-v1.1` (hotfix residual) o
      incluir en `bloque-nomina-chile-v2` posterior que migre frontend
      HR a `shared/chile_constants.ts` como única fuente.
  (c) alternativa rápida: reemplazar `TAX_BRACKETS` literal en
      HRDashboard.tsx por import desde `shared/chile_constants.ts`.
      Cambio de 10 líneas, no requiere bloque completo.
- **Bloqueo**: no bloquea `legal-viewer-v1`. Se deja registrado para que
  Cristian decida si (b) o (c) se ejecuta antes o después del
  legal-viewer-v1.
- **Revisión 2026-04-21 post-merge PR #23**: sigue ABIERTA. Fuera de scope
  de multi-document-consent-v1. Se mantiene como deuda residual de
  nomina-chile-v1 para hotfix separado o inclusión en nomina-chile-v2.

### ALERTA-VIEWER-3 — Riesgo GFM autolink implícito sin verificación exhaustiva (MODERADA)

- **Origen**: legal-docs-keeper 2026-04-21, Capa 0 bloque `legal-viewer-v1`,
  §3.3 del borrador
  `docs/legal/drafts/2026-04-21-legal-viewer-render-fidelity.md`.
- **Evidencia**: `remark-gfm` (plugin requerido para tablas) puede aplicar
  GFM autolink literal, que convierte URLs "sueltas" sin sintaxis
  `[](url)` en enlaces automáticamente. Si un documento canónico tiene
  una URL suelta (ej. "visita conniku.com/soporte" sin corchetes), el
  render tendría un `<a>` que el markdown no declara explícitamente. El
  texto visible no cambia, pero el árbol HTML sí.
- **Impacto**: Art. 7(1) GDPR demostrabilidad. No rompe equivalencia
  semántica (el texto sigue diciendo lo mismo) pero introduce ambigüedad
  en cualquier auditoría que compare DOM firmado ↔ DOM renderizado.
- **Mitigación**:
  1. Configurar `remark-gfm` con opción `{singleTilde: false}` y
     deshabilitar autolink si el plugin lo permite.
  2. Agregar test de regresión que grep los 4 markdowns canónicos
     buscando patrones URL-like sin sintaxis explícita (regex
     `(?<!\]\()https?://` o `(?<!\]\()www\.`). Si detecta: falla CI.
  3. Si se detectan URLs sueltas en los markdown actuales: corregirlos a
     sintaxis explícita antes del builder.
- **Verificación realizada**: grep rápido en Capa 0 NO ejecutado por
  tiempo. Queda como tarea del `frontend-builder` en Capa 1 antes de
  instalar `react-markdown`.
- **Bloqueo**: no bloquea Capa 0 legal. Es criterio de calidad de render.
- **Revisión 2026-04-21 post-merge PR #23**: sigue ABIERTA. El render
  fidelity es responsabilidad del bloque legal-viewer-v1 (ya mergeado).
  Si el merge PR #23 no incluyó test de regresión de autolink, abrir
  tarea de deuda técnica. No bloquea multi-document-consent-v1 porque
  este bloque CONSUME el viewer, no lo construye.

---

## Alertas abiertas (Capa 0 multi-document-consent-v1, 2026-04-21)

### ALERTA-CONSENT-1 — Idempotencia de document_views sin índice único (MODERADA)

- **Origen**: legal-docs-keeper 2026-04-21, Capa 0 bloque
  `multi-document-consent-v1`, GAP-2 del borrador
  `docs/legal/drafts/2026-04-21-multi-document-consent-text.md`.
- **Evidencia**:
  - `backend/database.py:1972-2009` modelo `DocumentView`: tiene 3
    índices (`ix_document_views_user_doc`, `ix_document_views_session_doc`,
    `ix_document_views_doc_key_version`) pero NINGUNO es UNIQUE sobre
    `(session_token, doc_key, doc_hash)`.
  - `backend/legal_document_views_routes.py:238-253`: el endpoint hace
    `db.add(row)` sin `ON CONFLICT` ni check previo de duplicado.
  - Un usuario que abre un doc, cierra y re-abre crea N filas en
    `document_views` para el mismo `(session_token, doc_key)`.
- **Impacto**: GDPR Art. 7(1) demostrabilidad. Si la última fila tiene
  `scrolled_to_end=false` pero una fila anterior tenía `true`, una
  query naive podría leer la última fila y declarar "no leído"
  invalidando la evidencia real. También infla volumen de tabla con
  retención de 5 años (no crítico pero subóptimo).
- **Acción requerida al backend-builder de multi-document-consent-v1**:
  al validar en `POST /auth/register` que existen los 4
  `document_views` con `scrolled_to_end=true` para el `session_token`,
  usar agregación con `MAX(scrolled_to_end)` por `(session_token,
  doc_key)`. Consulta sugerida en §5.3 GAP-2 del borrador.
- **Bloqueo**: no bloquea Capa 0 legal. Sí bloquea Capa 3 truth-auditor
  del bloque multi-document-consent-v1 si el backend-builder no usa
  agregación correcta.

### ALERTA-CONSENT-2 — Stub de cookies.md contamina evidencia probatoria (CRÍTICA)

- **Origen**: legal-docs-keeper 2026-04-21, Capa 0 bloque
  `multi-document-consent-v1`, GAP-3 del borrador
  `docs/legal/drafts/2026-04-21-multi-document-consent-text.md`.
- **Evidencia**:
  - ALERTA-AUDIT-04-21-14 (CRÍTICA, abierta) indica:
    `docs/legal/v3.2/cookies.md` tiene frontmatter
    `estado: STUB — NO PUBLICAR`.
  - `backend/legal_document_views_routes.py:66` declara
    `CANONICAL_HASHES["cookies"] = "48b90468822fda6b0470acb30d4707f037f1dd636eac7ebd967ab293c2a3a513"`.
  - Premisa §22 NO verificada en este turno: el estado real de
    `docs/legal/v3.2/cookies.md` frente al texto vigente en producción
    requiere `head -n 20` del archivo + `shasum -a 256`.
- **Impacto**: si el stub sigue en disco y el bloque
  multi-document-consent-v1 se implementa:
  - Usuario "acepta" Política de Cookies leyendo un documento vacío.
  - Hash hasheado `48b90468...` apunta a contenido stub "NO PUBLICAR".
  - Evidencia probatoria en `user_agreements` + `document_views`
    queda invalidada ante regulador que pida "probar qué leyó el
    usuario". Contradice GDPR Art. 7(1) y Ley 19.496 Art. 12 letra b
    (información veraz).
- **Acción requerida ANTES de Capa 1 del bloque multi-document-consent-v1**:
  1. Verificar estado real del archivo:
     `head -n 5 docs/legal/v3.2/cookies.md` → frontmatter debe decir
     `estado: VIGENTE`, no `STUB`.
  2. Recalcular hash: `shasum -a 256 docs/legal/v3.2/cookies.md` debe
     coincidir con `CANONICAL_HASHES["cookies"]` en
     `legal_document_views_routes.py:66`.
  3. Si contenido es stub: BLOQUEAR Capa 1 del bloque
     multi-document-consent-v1. Resolver ALERTA-AUDIT-04-21-14 primero
     publicando Cookies v1.1.0 canónico con texto real.
- **Bloqueo**: SÍ, BLOQUEA Capa 1 del bloque multi-document-consent-v1.

---

## Alertas cerradas

Ninguna hasta la fecha (estructura nueva).

## Próxima revisión

- Auditoría semanal programada: lunes 2026-04-27 a las 09:00 UTC.
- Revisión manual cuando Cristian invoque `/legal-audit` o cuando un
  bloque con componente legal active trigger de detección.

## Declaración obligatoria (repetida al cierre)

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.
