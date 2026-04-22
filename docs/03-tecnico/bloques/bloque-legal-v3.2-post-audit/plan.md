# Plan — Bloque `bloque-legal-v3.2-post-audit`

**Autor**: web-architect (Tori)
**Fecha**: 2026-04-20
**Estado**: BORRADOR — requiere aprobación de Cristian antes de ejecutar Pieza 1.
**Componente legal**: SÍ (§CLAUDE.md 18.7). Requiere legal-docs-keeper en Pieza 1, gate humano antes de merge, abogado antes de habilitar `LEGAL_GATE_ENFORCE`.
**Reporte fuente**: `/Users/cristiang./Desktop/CONIKU LEGAL/Auditoria_Claude.md` (41 findings).

---

## Declaración obligatoria

Este plan no constituye asesoría legal profesional. Todas las
redacciones citadas provienen literalmente del reporte del auditor y
deben pasar por revisión humana del abogado contratado antes de
activar `LEGAL_GATE_ENFORCE=true` en Render. El gate humano es
obligatorio (§18.7 CLAUDE.md).

---

## 1. Contexto y trigger

### 1.1 Qué ocurrió

El 2026-04-20 Cristian encargó y recibió una auditoría legal externa
sobre el paquete generado por el bloque anterior
`bloque-legal-consolidation-v2` (PR #21). El auditor (otro Claude
coordinado con un abogado humano) produjo un reporte estructurado de
41 hallazgos (H-01..H-41), clasificados en CRITICAL / HIGH / MEDIUM /
LOW, con 8 findings bloqueantes de merge.

### 1.2 Qué corrige este bloque

Aplica las correcciones **auto-remediables** del reporte que tocan
**documentos legales dirigidos al usuario final** (páginas públicas,
modal de registro y canónicos `.md`). No toca HR/admin ni otros
dominios. El objetivo único de este bloque es dejar la carpeta
`docs/legal/v3.2/` con texto canónico real, hashes recalculados,
constants sincronizados, y un paquete `/Desktop/CONIKU LEGAL v3.2/`
listo para revisión del abogado.

### 1.3 Hallazgo estructural más grave (por qué este bloque existe)

`docs/legal/v3.1/terms.md` y `docs/legal/v3.1/privacy.md` son **DRAFTS**
que se autodeclaran "BORRADOR — NO publicar" en su frontmatter. Los
hashes registrados en `backend/constants/legal_versions.py` y
`shared/legal_constants.ts` apuntan a esos drafts, lo que rompe la
trazabilidad probatoria: `user_agreements.text_version_hash`
respaldaría un texto que el propio archivo declara no-publicable. Esto
corresponde a H-05 (terms) y H-06 (privacy) del reporte.

Evidencia confirmada por Tori:

- `docs/legal/v3.1/terms.md:8-22` frontmatter dice `estado: BORRADOR — NO publicar sin revisión de Cristian + validación de abogado`.
- `docs/legal/v3.1/privacy.md:13-14` idem.

Este bloque reemplaza ambos archivos por texto **autocontenido**
derivado de las fuentes reales (`src/components/TermsOfService.tsx`
para terms; `src/pages/PrivacyPolicy.tsx` para privacy), ya con las
correcciones del auditor aplicadas.

---

## 2. Findings aplicados en este bloque

Scope = documentos al usuario final (públicos, modal, canónicos .md) +
sincronización mecánica constants/metadata/paquete-abogado.

| Finding | Severidad | Tipo | Archivo(s) | Diff específico | Pieza |
|---|---|---|---|---|---|
| **H-01** | CRITICAL | REPLACE + REWRITE | `src/pages/TermsOfService.tsx:98` | `con domicilio en Santiago, Chile` → `con domicilio en Antofagasta, Chile` | P2 |
| H-01 | CRITICAL | REWRITE | `src/pages/TermsOfService.tsx:353-354` | Texto jurisdicción exclusiva Santiago → jurisdicción Antofagasta con salvedad Arts. 16.g + 50A Ley 19.496 | P2 |
| H-01 | CRITICAL | REPLACE | `src/components/TermsOfService.tsx:62` | `domicilio en Santiago de Chile` → `domicilio en Antofagasta, Chile` | P2 |
| H-01 | CRITICAL | REPLACE | `src/components/TermsOfService.tsx:125` | `con domicilio en Santiago de Chile` → `con domicilio en Antofagasta, Chile` | P2 |
| H-01 | CRITICAL | REPLACE | `src/components/TermsOfService.tsx:1468` | pie `Santiago, Chile` → `Antofagasta, Chile` | P2 |
| H-01 + Q-01 | CRITICAL | KEEP | `src/components/TermsOfService.tsx:1352-1353` | **MANTENER** `CAM Santiago` (institución arbitral; recomendación auditor confirmada por Cristian) | P2 |
| H-01 | CRITICAL | REPLACE | `src/pages/PrivacyPolicy.tsx:171` | `Domicilio: Santiago, Chile` → `Domicilio: Antofagasta, Chile` | P2 |
| H-01 | CRITICAL | REPLACE | `src/pages/DeleteAccount.tsx:408` | `· Santiago, Chile ·` → `· Antofagasta, Chile ·` | P2 |
| H-01 | CRITICAL | REWRITE | `docs/legal/v3.2/terms.md` y `docs/legal/v3.2/privacy.md` | Domicilio Antofagasta + jurisdicción no exclusiva en todos los puntos equivalentes | P1 |
| **H-02** | CRITICAL | REPLACE | `src/components/TermsOfService.tsx:27` | `Versión 2.0` → `Versión 3.2` + fecha "19 de abril de 2026" | P2 |
| **H-05** | CRITICAL | REWRITE completo | `docs/legal/v3.2/terms.md` (NUEVO, reemplaza `v3.1/terms.md`) | Documento autocontenido con 14 títulos + 49 artículos derivados de `src/components/TermsOfService.tsx`, ya aplicando H-01/H-02/H-08/H-09/H-10/H-11/H-16/H-17 | P1 |
| **H-06** | CRITICAL | REWRITE completo | `docs/legal/v3.2/privacy.md` (NUEVO, reemplaza `v3.1/privacy.md`) | Documento autocontenido 15 secciones derivadas de `src/pages/PrivacyPolicy.tsx`, ya aplicando H-01 + §5.3 del draft v2.3 (procesamiento al exportar) + H-12 | P1 |
| **H-08** | CRITICAL | REWRITE | `src/components/TermsOfService.tsx:1356-1360` (Art. 40.3) + `docs/legal/v3.2/terms.md` | Texto literal del reporte H-08.texto_final_recomendado (jurisdicción no exclusiva + salvedad Arts. 16 letra g y 50 A Ley 19.496) | P1 + P2 |
| H-08 | CRITICAL | REWRITE | `src/pages/TermsOfService.tsx:351-355` (Art. 11) | Jurisdicción Antofagasta con misma salvedad Ley 19.496 | P2 |
| **H-09** | HIGH | APPEND | `src/components/TermsOfService.tsx` Art. 41 + `docs/legal/v3.2/terms.md` | Salvedad acciones colectivas Ley 19.496 Arts. 51 y ss. (texto reporte H-09) | P1 + P2 |
| **H-10** | HIGH | APPEND | `src/components/TermsOfService.tsx` Art. 36.3 + `docs/legal/v3.2/terms.md` | Salvedad derechos irrenunciables consumidor + dolo/culpa grave (Art. 1465 CC). Texto reporte H-10 | P1 + P2 |
| **H-11** | HIGH | REWRITE | `src/components/TermsOfService.tsx` Art. 10.2 + `docs/legal/v3.2/terms.md` | IVA bajo DL 825 (NO Ley 21.713). Texto reporte H-11 | P1 + P2 |
| **H-12** | HIGH | REWRITE | `src/pages/PrivacyPolicy.tsx` (Sección 6 tabla Anthropic) + `docs/legal/v3.2/privacy.md` | Entrada Anthropic con jurisdicción USA + mecanismo transferencia. **Ver decisión D-H12 abajo.** | P1 + P2 |
| **H-16** | HIGH | REWRITE | `src/components/TermsOfService.tsx` Art. 4.3 + `docs/legal/v3.2/terms.md` | Acotar "modificaciones de clarificación" a: tipos, estilo, enlaces, datos de contacto. Texto reporte H-16 | P1 + P2 |
| **H-17** | HIGH | APPEND | `src/components/TermsOfService.tsx` tras Art. 1.4 + `docs/legal/v3.2/terms.md` | Cláusula 1.5 prevalencia del modal sobre editorial pública. Texto reporte H-17 | P1 + P2 |
| **H-37** | LOW | REWRITE nota | `docs/legal/v3.2/age-declaration.md` | Cerrar "Art 210 CP pendiente": declarar que NO aplica (tipo exige autoridad/agentes, checkbox online no configura). Mantener "legislación vigente" en texto visible | P1 |

Sincronización mecánica (P1 cierre):

- Recalcular SHA-256 de `docs/legal/v3.2/{terms,privacy,cookies,age-declaration}.md`.
- Actualizar `docs/legal/v3.2/METADATA.yaml` (nuevo directorio) con hashes + versiones:
  - terms: 3.1.0 → **3.2.0** (MINOR)
  - privacy: 2.3.0 → **2.4.0** (MINOR)
  - cookies: 1.0.0 (ESTABLE, sin cambio de texto; copiar tal cual desde v3.1 a v3.2)
  - age-declaration: 1.0.0 (ESTABLE; solo se cierra nota post-frontmatter del .md, el texto canónico NO cambia y su hash de texto sigue siendo `ca5275...`)
- Propagar hashes a `backend/constants/legal_versions.py` (TOS_VERSION, TOS_HASH, PRIVACY_VERSION, PRIVACY_HASH) y a `shared/legal_constants.ts` (TOS_DOCUMENT, PRIVACY_DOCUMENT).
- Actualizar `docs/legal/LEGAL_VERSIONS.md` con entrada v3.2.
- Archivar `docs/legal/v3.1/*` en `docs/legal/archive/v3.1/`.

---

## 3. Findings diferidos (NO en este bloque)

| Finding | Severidad | Razón de diferir | Tracking |
|---|---|---|---|
| **H-03** | CRITICAL | YA arreglado (`ExportModal.tsx:127-140` checkboxes `disabled aria-disabled="true"` con label "(próximamente)"). Evidencia confirmada en sesión 2026-04-20. | CERRADO fuera del bloque |
| **H-04** | CRITICAL | Requiere **redacción legal del abogado** (nueva Sección 15 Privacy para Ley 21.719). Tori no redacta texto legal sustantivo. | Q-ABG-1; deadline 2026-11-01 |
| **H-07** | CRITICAL | **Acción externa**: confirmación escrita del abogado sobre DPAs con los 10 encargados. | Q-ABG-2 |
| **H-13** | HIGH | Decisión de Cristian (DPO interno vs externo). | Q-CEO-1; deadline 2026-08-01 |
| **H-14** | HIGH | Acción abogado + arquitecto futuro (EIPD Athena). | Q-ABG-3; deadline 2026-09-01 |
| **H-15** | HIGH | Verificación abogado de L3 (Art 71 B Ley 17.336) y L14 (Directiva 2011/83/UE). | Q-ABG-4 |
| **H-18** | HIGH | Verificación CEO (comprobante INAPI). Cristian ya confirmó que la marca "está solicitada, pendiente de aprobación". La redacción actual "en proceso de registro" ES veraz. | Q-CEO-2 (obtener PDF del comprobante) |
| **H-19** | HIGH | Ampliación procedimiento eliminación menor. No tocado este bloque por mantener scope acotado a domicilio + jurisdicción + canónicos. | Próximo bloque legal 30d |
| **H-20** | HIGH | UI granular conferencias (cámara on/off + consentimiento grabación). Requiere frontend-builder sobre feature de videollamada. | Próximo bloque feature-conferencias |
| **H-21..H-30** | MEDIUM | 90d. No-blocker de merge. | Próximo bloque legal 90d |
| **H-31, H-32, H-33, H-34, H-35, H-36, H-38, H-39, H-40, H-41** | MEDIUM/LOW | Próxima revisión ordinaria o 30d (H-38 Zoho firma, H-39 Footer). Footer requiere inventario específico. | Bloque legal 30d separado |
| **HR/admin Santiago** | N/A | `src/admin/shared/ercData.ts`, `HRDashboard.tsx`, `ContratosTab.tsx`, `LibroRemuneracionesTab.tsx`, `LegalTab.tsx`, `BibliotecaDocumentos.tsx`, `InspeccionTrabajoTab.tsx`, `FiniquitosTab.tsx`, `PortalTrabajador.tsx`, `CeoMail.tsx`, `backend/server.py` templates. Scope HR/admin = bloque aparte. | Bloque `bloque-legal-hr-admin-antofagasta` |
| **LEGAL_GATE_ENFORCE=true** | N/A | Gate humano post-abogado. No se activa al cierre automático de este bloque. | Post-merge, decisión humana |

---

## 4. Decisiones ya tomadas (batch pre-plan)

| # | Decisión | Resolución | Fuente |
|---|---|---|---|
| D-Q01 | Institución arbitral en Art. 40.2 (H-01.edits) | **A — mantener CAM Santiago** | Recomendación auditor + confirmación Cristian 2026-04-20 |
| D-SCOPE | HR/admin templates con Santiago | **FUERA de este bloque**, bloque aparte | Instrucción de Cristian en prompt |
| D-H03 | Checkboxes exportación | **YA arreglado**, no re-hacer | Confirmación en prompt |
| D-REACCEPT | ¿Forzar re-aceptación del usuario al bumpear terms v3.2 / privacy v2.4? | **NO forzar**. Razonamiento: (a) H-01 rectifica error material (no reduce derechos); (b) H-08/H-09/H-10 aumentan derechos del consumidor (lo protegen más); (c) H-02 es etiqueta; (d) H-11 corrige cita tributaria sin cambio económico. El reporte H-01 dice `requires_user_reacceptance: NO`. El gate `LEGAL_GATE_ENFORCE` permanece apagado para este bump. | Razonamiento extendido Tori + reporte H-01 |
| D-AGE | ¿`age-declaration.md` bumpea? | **NO**. El texto canónico (entre separadores ---) no cambia. Solo se cierra la nota post-frontmatter (H-37). Hash del texto sigue siendo `ca527535a0f3f938b51d9a2e896e140233ecdd2286e13fdeecb7a32783d43706`. Hash del archivo .md sí cambia (porque la nota cambia); actualizar METADATA.yaml campo `sha256` del archivo solamente. | Razonamiento Tori |
| D-COOKIES | ¿`cookies.md` bumpea? | **NO**. Texto y hash idénticos a v3.1/cookies.md. Copiar tal cual a v3.2/. | Reporte cookies: "stable" |

### Decisión D-H12 pendiente de Cristian (batch, NO bloquea inicio de P1)

El reporte H-12 propone texto para la entrada Anthropic en la tabla
de terceros de Privacy que afirma:

> "La transferencia internacional se realiza bajo Acuerdo de Encargo
> del Tratamiento que incorpora las Cláusulas Contractuales Tipo
> aprobadas por la Comisión Europea conforme a la Decisión 2021/914"

**Problema**: esto afirma un hecho jurídico (DPA con SCCs firmado)
que depende de H-07 (acción del abogado, no confirmada aún).

**Alternativas (responder al presentar el plan):**

- **A**: incluir texto literal del reporte H-12 (afirma DPA + SCCs). **Riesgo**: si H-07 revela que no hay DPA firmado con Anthropic, la Política miente. **Beneficio**: cierra H-12 en un bloque.
- **B**: incluir texto suavizado: "La transferencia internacional a Anthropic se realiza bajo los mecanismos que establezca el Acuerdo de Encargo del Tratamiento correspondiente, incluyendo, cuando proceda, las Cláusulas Contractuales Tipo aprobadas por la Comisión Europea conforme a la Decisión 2021/914, y conforme al artículo 5 de la Ley N° 19.628 de Chile." **Riesgo**: menor, no afirma hecho inexistente. **Beneficio**: cierra H-12 parcialmente. **Recomendación Tori: B**.
- **C**: **diferir H-12** a un bloque legal post-abogado una vez confirmado H-07. **Riesgo**: extiende deuda. **Beneficio**: evita afirmar hechos no verificados. Sigue el canon §CLAUDE.md de no inventar info legal.

**Recomendación web-architect**: **B** (redacción condicional). Es la única opción que cierra H-12 sin violar §CLAUDE.md sobre afirmar hechos legales no verificados.

---

## 5. Piezas ejecutables

**Orden obligatorio: P1 → P2 → P3 → P4. NO paralelo.** Los hashes de P1 son input de P2 (constants) y P4 (paquete abogado).

### Pieza 1 — legal-docs-keeper: canónicos v3.2 + metadata + age-declaration

**Owner**: legal-docs-keeper
**Pre-requisitos**: Cristian resolvió D-H12 (A/B/C).
**Input**: `src/components/TermsOfService.tsx` (fuente terms), `src/pages/PrivacyPolicy.tsx` (fuente privacy), reporte H-01/H-02/H-05/H-06/H-08/H-09/H-10/H-11/H-12/H-16/H-17/H-37.

**Archivos a crear/modificar**:

1. `docs/legal/v3.2/terms.md` (NUEVO, autocontenido):
   - Frontmatter YAML con `documento: Términos y Condiciones de Conniku SpA`, `version: 3.2.0`, `vigencia_desde: 2026-04-[DIA DE MERGE]`, `estado: VIGENTE`, `derivado_de: src/components/TermsOfService.tsx con edits H-01/H-02/H-08/H-09/H-10/H-11/H-16/H-17 aplicados`.
   - Aviso legal importante (del modal, `src/components/TermsOfService.tsx:61-71`) con Santiago → Antofagasta aplicado.
   - Nota propiedad intelectual de marca (modal L82-92) sin cambios.
   - 14 títulos + 49 artículos extraídos secuencialmente del modal (`src/components/TermsOfService.tsx` L94-1491) **con los edits ya aplicados**:
     - Art. 1.4 domicilio → Antofagasta.
     - **Nuevo Art. 1.5** (H-17) prevalencia del modal sobre pública.
     - Art. 4.3 (H-16) acotar modificaciones de clarificación.
     - Art. 10.2 (H-11) IVA bajo DL 825.
     - Art. 36.3 (H-10) salvedad consumidor + dolo/culpa grave.
     - Art. 40.2 (CAM Santiago, sin cambio).
     - Art. 40.3 (H-08) jurisdicción no exclusiva Antofagasta + salvedad Ley 19.496.
     - Art. 41 (H-09) salvedad acciones colectivas.
     - Art. 49 contacto: pie Antofagasta, Chile.
   - Nota de protección marcaria (modal L1484-1490) sin cambios.
   - El frontmatter del .md NO contiene "Versión 2.0"; la etiqueta semántica es `version: 3.2.0` y el cuerpo dice "Versión 3.2".

2. `docs/legal/v3.2/privacy.md` (NUEVO, autocontenido):
   - Frontmatter YAML `version: 2.4.0`, `derivado_de: src/pages/PrivacyPolicy.tsx con edits H-01/H-12 + §5.3 Procesamiento al exportar documentos (del draft privacy v2.3)`.
   - 15 secciones extraídas de `src/pages/PrivacyPolicy.tsx` con:
     - Sección 1: Domicilio → Antofagasta.
     - Sección 5.3: "Procesamiento al exportar documentos" (incorporar texto del draft `docs/legal/v3.1/privacy.md` cambios 3 y 4).
     - Sección 2.1: nuevo bullet "Documentos exportados" (cambio 2 del draft).
     - Sección 6: tabla Anthropic con redacción de D-H12 (según decisión A/B/C).

3. `docs/legal/v3.2/cookies.md`: copiar byte a byte desde `docs/legal/v3.1/cookies.md` (hash estable).

4. `docs/legal/v3.2/age-declaration.md`:
   - Copiar desde v3.1.
   - Modificar **solo** la sección `## Notas de cumplimiento` para cerrar el punto "Art 210 CP pendiente":
     > "Referencia penal: el texto menciona 'responsabilidad civil y penal según la legislación vigente'. Durante la auditoría externa 2026-04-20 se verificó que el Art. 210 del Código Penal chileno **no aplica** al checkbox declarativo de Conniku, por cuanto el tipo penal exige que la declaración falsa se preste 'ante la autoridad o sus agentes' y Conniku SpA no tiene carácter de autoridad ni de agente público. Por esta razón, se mantiene la fórmula genérica 'legislación vigente' en el texto visible al usuario, sin cita de artículo específico."
   - El texto canónico (entre separadores ---) NO cambia.
   - Frontmatter: `version: 1.0.0` permanece. Se actualiza `hash_sha256` del archivo (cambia porque la nota cambió) en METADATA.yaml, pero el hash de texto `ca527535a0f3f938b51d9a2e896e140233ecdd2286e13fdeecb7a32783d43706` **NO cambia** (el texto no se tocó).

5. `docs/legal/v3.2/METADATA.yaml` (NUEVO, espejo de la estructura v3.1):
   - privacy: version "2.4", sha256 calculado, vigencia_desde fecha merge.
   - terms: version "3.2", sha256 calculado, vigencia_desde fecha merge.
   - cookies: version "1.0", sha256 idéntico a v3.1.
   - age-declaration: version "1.0.0", sha256 archivo recalculado, hash de texto canónico sin cambio (declarado en nota del yaml).

6. `docs/legal/archive/v3.1/` (NUEVO): copiar `docs/legal/v3.1/*` intactos acá como archivo histórico. Dejar `docs/legal/v3.1/` con un `README.md` que apunte a `../archive/v3.1/` y a `../v3.2/` como vigente. Alternativa: borrar `v3.1/` y dejar solo el archivo. **Decisión a confirmar por Cristian en P1 cierre: mantener v3.1/README.md redirect vs borrar.**

7. `docs/legal/LEGAL_VERSIONS.md`: agregar entrada v3.2.0 con resumen del bump y lista de findings aplicados.

8. `docs/legal/alerts.md`: cerrar ALERTA-LEG-2 (divergencia pages↔components) si H-17 cláusula de prevalencia lo resuelve; si no, actualizar estado.

**Tests a escribir (Pieza 1):**

```python
# backend/tests/test_legal_v3_2_invariants.py
def test_terms_v3_2_contains_all_14_titulos():
    text = read("docs/legal/v3.2/terms.md")
    for n in range(1, 15):
        roman = ROMAN[n]
        assert f"TÍTULO {roman}" in text

def test_terms_v3_2_contains_all_49_articulos():
    text = read("docs/legal/v3.2/terms.md")
    for n in range(1, 50):
        assert f"Artículo {n}." in text

def test_terms_v3_2_no_santiago_except_cam():
    text = read("docs/legal/v3.2/terms.md")
    # Toda aparición de "Santiago" debe estar en contexto CAM Santiago.
    for line in text.splitlines():
        if "Santiago" in line:
            assert "CAM Santiago" in line or "Cámara de Comercio de Santiago" in line

def test_terms_v3_2_jurisdiccion_no_exclusiva():
    text = read("docs/legal/v3.2/terms.md")
    assert "Antofagasta" in text
    assert "16 letra g" in text
    assert "50 A" in text
    assert "Ley N° 19.496" in text
    assert "jurisdicción exclusiva" not in text

def test_terms_v3_2_iva_dl_825_not_21713():
    text = read("docs/legal/v3.2/terms.md")
    assert "Decreto Ley N° 825" in text
    assert "Ley N° 21.713" not in text  # no en el contexto IVA

def test_privacy_v2_4_domicilio_antofagasta():
    text = read("docs/legal/v3.2/privacy.md")
    assert "Antofagasta" in text
    assert "Santiago, Chile" not in text  # privacy no tiene CAM

def test_age_declaration_canonical_text_unchanged():
    text = read("docs/legal/v3.2/age-declaration.md")
    import hashlib
    canonical = extract_between_separators(text, "---\n\nAl marcar", "---\n\n## Notas")
    assert hashlib.sha256(canonical.encode()).hexdigest() == \
        "ca527535a0f3f938b51d9a2e896e140233ecdd2286e13fdeecb7a32783d43706"
```

**Criterio de paso P1:**

- Los 7 tests de invariantes anteriores pasan.
- `sha256sum docs/legal/v3.2/terms.md` produce valor X; este valor queda registrado en METADATA.yaml y es input literal para Pieza 2.
- `sha256sum docs/legal/v3.2/privacy.md` idem.
- Commit dedicado tipo `legal:` con mensaje que cite H-01/H-02/H-05/H-06/H-08/H-09/H-10/H-11/H-12/H-16/H-17/H-37.

### Pieza 2 — frontend-builder: sync TSX + constants + archivos producto

**Owner**: frontend-builder
**Pre-requisitos**: P1 commitado con hashes finales.
**Input**: hashes SHA-256 calculados en P1 (terms 3.2.0 y privacy 2.4.0).

**Archivos a modificar**:

1. `src/components/TermsOfService.tsx` — aplicar los edits H-01/H-02/H-08/H-09/H-10/H-11/H-16/H-17 con texto idéntico al .md canónico. El render debe coincidir textualmente con `docs/legal/v3.2/terms.md` módulo formatting HTML.
2. `src/pages/TermsOfService.tsx` — aplicar H-01 línea 98 (domicilio) y L353-354 (jurisdicción). Este es el "resumen editorial público" divergente del modal (ALERTA-LEG-2). La cláusula 1.5 de prevalencia (H-17) declara que el modal prevalece sobre esta página, lo que legalmente legitima la divergencia.
3. `src/pages/PrivacyPolicy.tsx` — aplicar H-01 L171 (Domicilio Antofagasta), H-12 (redacción Anthropic en Sección 6), bump de versión visible ("Versión 2.4 · 19 de abril de 2026"). Si el draft §5.3 y el bullet §2.1 no están en producción aún (verificar), incorporarlos también.
4. `src/pages/DeleteAccount.tsx:408` — `Santiago, Chile` → `Antofagasta, Chile`.
5. `backend/constants/legal_versions.py` — actualizar `TOS_VERSION = "3.2.0"`, `TOS_HASH = "<hash P1>"`, `PRIVACY_VERSION = "2.4.0"`, `PRIVACY_HASH = "<hash P1>"`. Agregar comentario con cita del reporte de auditoría.
6. `shared/legal_constants.ts` — idem sobre `TOS_DOCUMENT.version/hash` y `PRIVACY_DOCUMENT.version/hash`.

**Tests a escribir (Pieza 2):**

```python
# backend/tests/test_legal_constants_sync.py
def test_legal_versions_sync_py_ts():
    py = read("backend/constants/legal_versions.py")
    ts = read("shared/legal_constants.ts")
    assert 'TOS_VERSION: str = "3.2.0"' in py
    assert "version: '3.2.0'" in ts
    assert 'PRIVACY_VERSION: str = "2.4.0"' in py
    assert "version: '2.4.0'" in ts

def test_tos_hash_matches_file():
    import hashlib
    with open("docs/legal/v3.2/terms.md", "rb") as f:
        actual = hashlib.sha256(f.read()).hexdigest()
    py = read("backend/constants/legal_versions.py")
    assert f'TOS_HASH: str = "{actual}"' in py
    ts = read("shared/legal_constants.ts")
    assert f"hash: '{actual}'" in ts  # contextual; ajustar regex

def test_privacy_hash_matches_file():
    # idéntico para privacy.md
    ...
```

```tsx
// src/__tests__/legal/TermsOfService.component.test.tsx
it('renders version 3.2 not 2.0', () => {
  const { getByText } = render(<TermsOfService onClose={() => {}} />);
  expect(getByText(/Versión 3\.2/)).toBeInTheDocument();
});

it('renders Antofagasta as domicilio in aviso legal', () => {
  const { getByText } = render(<TermsOfService onClose={() => {}} />);
  expect(getByText(/domicilio en Antofagasta/i)).toBeInTheDocument();
});

it('does not render Santiago as domicilio jurisdiccional', () => {
  const { container } = render(<TermsOfService onClose={() => {}} />);
  const body = container.textContent || '';
  // CAM Santiago sí aparece; Santiago de Chile como domicilio no.
  expect(body).not.toMatch(/domicilio en Santiago/i);
  expect(body).toMatch(/CAM Santiago/);
});
```

**Criterio de paso P2:**

- Tests P1 y P2 pasan.
- `npx tsc --noEmit && npx eslint src/ && npx vitest run && npx vite build && python3.11 -m pytest backend/ -q && python3.11 -m ruff check backend/` verdes (§23 pre-flight CI local).
- Hashes en constants coinciden exactamente con los .md producidos en P1 (verificar manualmente + test automatizado).
- Grep final sobre `src/` NO retorna "domicilio en Santiago" (salvo `CAM Santiago` y referencias HR/admin fuera de scope).

### Pieza 3 — qa-tester: validación renderizada

**Owner**: qa-tester
**Pre-requisitos**: P2 commitado, build local verde.
**Qué probar:**

1. Abrir modal de Términos en `/register` o desde botón "Términos y Condiciones" del formulario. Verificar visualmente:
   - Header dice "Versión 3.2".
   - Aviso legal dice Antofagasta.
   - Art. 1.4 y Art. 1.5 (nuevo) presentes.
   - Art. 10.2 cita DL 825.
   - Art. 40.3 dice Antofagasta + "sin perjuicio del derecho irrenunciable del consumidor".
   - Art. 41 menciona Arts. 51 y ss. Ley 19.496.
   - Pie dice "Antofagasta, Chile".
2. Abrir página pública `/terms`:
   - Sección 1 dice Antofagasta.
   - Sección 11 jurisdicción no exclusiva + salvedad Ley 19.496.
3. Abrir `/privacy`:
   - Sección 1 Domicilio Antofagasta.
   - Sección 5.3 Procesamiento al exportar documentos (si se agregó).
   - Sección 6 entrada Anthropic con redacción D-H12 elegida.
4. Abrir `/delete-account` pie — Antofagasta, Chile.
5. Abrir `/cookies` — sin cambios, debe seguir funcionando.
6. Responsive: probar en móvil (390px), tablet (768px), escritorio (1440px).
7. Consola del navegador SIN errores.
8. Smoke test CI — confirmar que tests pasan en pipeline.

**Criterio de paso P3:** 4 secciones del reporte QA cubren los 8 puntos. Evidencia (screenshots de las 4 páginas).

### Pieza 4 — paquete para abogado

**Owner**: legal-docs-keeper (genera) + Tori ejecuta (runs scripts).
**Pre-requisitos**: P2 mergeable (no requiere merge). Los PDFs se generan del código actual en la rama del bloque.

**Estructura a crear en `/Users/cristiang./Desktop/CONIKU LEGAL v3.2/`:**

```
CONIKU LEGAL v3.2/
├── _LEER_PRIMERO.md
├── _LEER_PRIMERO.pdf
├── _CAMBIOS_v3.1_A_v3.2.md          (NUEVO)
├── _CAMBIOS_v3.1_A_v3.2.pdf
├── 00_Terminos_MODAL_Register_v3.2.0.pdf
├── 01_Terminos_y_Condiciones_v3.2.0.pdf
├── 02_Politica_de_Privacidad_v2.4.0.pdf
├── 03_Politica_de_Cookies_v1.0.0.pdf
├── 04_Eliminacion_de_Cuenta.pdf
├── canonicos_markdown/
│   ├── 05_Canonico_Terminos_v3.2.0.pdf
│   ├── 06_Canonico_Privacidad_v2.4.0.pdf
│   ├── 07_Canonico_Cookies_v1.0.0.pdf
│   └── 08_Canonico_Declaracion_Edad_v1.0.0.pdf
└── referencia_abogado/
    ├── CHECKLIST_para_abogado_v3.2.pdf   (actualizado)
    ├── CITAS_LEGALES_L1-L14_v3.2.pdf     (actualizado)
    └── PLAN_MAESTRO_contexto_v3.2.pdf    (este plan)
```

**Contenido mínimo de `_CAMBIOS_v3.1_A_v3.2.md`:**

1. Introducción: "Este documento explica al abogado qué cambió desde v3.1 a v3.2 y por qué, diff por diff, con referencia al reporte de auditoría externa del 2026-04-20."
2. Tabla resumen: columnas `Finding | Severidad | Archivo | Diff | Acción del abogado`.
3. Sección por finding aplicado (H-01, H-02, H-05, H-06, H-08, H-09, H-10, H-11, H-12, H-16, H-17, H-37) con:
   - Texto original citado literalmente.
   - Texto nuevo citado literalmente.
   - Base legal invocada (art + ley + URL oficial).
   - Qué debe validar el abogado.
4. Sección "Findings diferidos y pendientes para usted":
   - H-04 (redacción cláusula Ley 21.719): el abogado redacta.
   - H-07 (DPAs): el abogado confirma o identifica faltantes.
   - H-15 (citas L3, L14): el abogado verifica contra BCN y EUR-Lex.
   - H-18 (comprobante INAPI): Cristian entrega PDF.
   - Q-02, Q-03, Q-04 del reporte.
5. Sección "Lo que NO cambió y por qué":
   - Cookies (estable).
   - Texto canónico del checkbox de edad (estable; solo se cerró la nota).
   - HR/admin templates con Santiago (bloque separado).
6. Nueva tabla de hashes:

| Documento | Versión | Hash |
|---|---|---|
| terms.md | 3.2.0 | `<hash P1>` |
| privacy.md | 2.4.0 | `<hash P1>` |
| cookies.md | 1.0.0 | `a00150297efa288b53bbd9a0c655e046a292d3cdefb04254b0b33c079022efd9` (sin cambio) |
| age-declaration.md (archivo) | 1.0.0 | `<recalculado>` (nota cerrada) |
| age-declaration TEXTO canónico | 1.0.0 | `ca527535a0f3f938b51d9a2e896e140233ecdd2286e13fdeecb7a32783d43706` (sin cambio) |

7. Firma: "Este análisis no constituye asesoría legal profesional. Requiere validación de abogado antes de activar `LEGAL_GATE_ENFORCE=true` en Render."

**Contenido mínimo actualizado de `_LEER_PRIMERO.md`:**

- Recorte la intro del _LEER_PRIMERO v3.1 actualizando fechas, versiones, hashes.
- Agregar sección "Qué cambió desde v3.1" apuntando a `_CAMBIOS_v3.1_A_v3.2.md`.
- Mantener "Qué validar con prioridad" con los 5 puntos, agregar 6° punto: "Revisar que la cláusula 1.5 de prevalencia (H-17) sea adecuada y que la redacción Anthropic (D-H12) sea aceptable."

**Contenido mínimo de `CHECKLIST_para_abogado_v3.2.pdf`:**

Replicar estructura del checklist v3.1 agregando:

- 12 nuevas filas (una por finding aplicado) con checkbox "Aprobado sin observaciones" / "Requiere cambio" / "Necesito más contexto".
- 5 filas de findings diferidos que requieren acción del abogado (H-04, H-07, H-15, Q-02/03/04).
- Firma y fecha al pie.

**Criterio de paso P4:** carpeta `/Users/cristiang./Desktop/CONIKU LEGAL v3.2/` creada con la estructura exacta, 11 PDFs generados, 3 .md adicionales, todo listo para que Cristian se la pase al abogado.

---

## 6. Invariantes (verificables post-ejecución)

1. `sha256(docs/legal/v3.2/terms.md) == TOS_HASH en backend/constants/legal_versions.py == TOS_DOCUMENT.hash en shared/legal_constants.ts`.
2. `sha256(docs/legal/v3.2/privacy.md) == PRIVACY_HASH en backend/constants/legal_versions.py == PRIVACY_DOCUMENT.hash en shared/legal_constants.ts`.
3. `sha256(docs/legal/v3.2/cookies.md) == sha256(docs/legal/v3.1/cookies.md)` (cookies estable).
4. `sha256 del TEXTO canónico (entre separadores ---) de docs/legal/v3.2/age-declaration.md == ca527535a0f3f938b51d9a2e896e140233ecdd2286e13fdeecb7a32783d43706` (texto estable).
5. `docs/legal/v3.2/terms.md` contiene los 14 strings "TÍTULO I" ... "TÍTULO XIV" y los 49 strings "Artículo 1." ... "Artículo 49.".
6. `grep -n "domicilio en Santiago" src/` retorna 0 ocurrencias (excepto HR/admin fuera de scope).
7. `grep -n "Versión 2.0" src/components/TermsOfService.tsx` retorna 0 ocurrencias.
8. `grep -n "jurisdicción exclusiva" docs/legal/v3.2/terms.md` retorna 0 ocurrencias.
9. `grep -n "Ley N° 21.713" docs/legal/v3.2/terms.md` retorna 0 ocurrencias en contexto IVA.
10. El frontmatter de `docs/legal/v3.2/terms.md` y `privacy.md` **no** contiene la cadena "BORRADOR — NO publicar" (invariante que valida el fix estructural H-05/H-06).
11. `LEGAL_GATE_ENFORCE` sigue apagado en configuración de Render al cierre del bloque (D-REACCEPT).

---

## 7. Riesgos y mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| **Extracción del TSX al .md canónico pierde o desordena un artículo** | Media | Crítico (ruptura trazabilidad) | Tests de invariantes (test_all_49_articulos + test_all_14_titulos) en P1 obligatorios. Revisión manual comparando estructura `<h3>Artículo N.</h3>` del TSX con `## Artículo N.` del md. Diff line-by-line entre modal render y canónico durante P3. |
| **Hashes en constants divergen de hashes reales del .md** | Media | Crítico (re-aceptaciones fallidas a futuro) | Test `test_tos_hash_matches_file` automatizado. CI bloquea merge si diverge. Script `scripts/verify-legal-constants-sync.sh` se ejecuta en pre-commit. |
| **Incluir H-12 con afirmación de DPA firmado cuando H-07 no está confirmado** | Media | Alto (Privacy afirma hecho falso) | Decisión D-H12 = B (recomendado): redacción condicional. Si Cristian elige A, registrar como riesgo aceptado por Cristian. |
| **Cambio de `age-declaration.md` inadvertidamente muta el TEXTO canónico y rompe hash** | Baja | Crítico (invalida `user_agreements.text_version_hash` de todos los usuarios actuales) | Test `test_age_declaration_canonical_text_unchanged` obligatorio. Solo tocar sección `## Notas de cumplimiento`, nunca el bloque entre `---`. |
| **Bump de terms v3.2 / privacy v2.4 termina siendo interpretado como "cambio sustancial" y requiere re-aceptación** | Baja | Medio (fricción UX) | Decisión D-REACCEPT documenta razonamiento. Abogado valida en revisión. Si abogado dice "sí requiere re-aceptación", se abre bloque de re-aceptación separado. |
| **H-01 en `src/pages/TermsOfService.tsx` y H-01 en `src/components/TermsOfService.tsx` quedan inconsistentes entre sí** | Media | Medio (divergencia que ya es ALERTA-LEG-2) | Cláusula 1.5 H-17 declara prevalencia del modal. Además, en P3, QA verifica que ambos digan Antofagasta. |
| **Paquete de abogado v3.2 se genera con hashes obsoletos si se genera antes de P2 commit final** | Media | Alto (abogado revisa PDFs desactualizados) | P4 se ejecuta después de P2 commit final. `_CAMBIOS_v3.1_A_v3.2.md` incluye los hashes exactos del commit. |
| **Cristian activa `LEGAL_GATE_ENFORCE=true` antes de revisión del abogado** | Baja | Alto | Este plan documenta D-REACCEPT = NO y explícitamente deja gate apagado. Cristian tiene registro escrito de la decisión. |
| **Otros archivos con "Santiago" aparecen fuera del scope declarado** | Media | Bajo (cosmético) | Grep explícito en P2 pre-commit; cualquier nuevo hit fuera de HR/admin conocidos se reporta como gap para próximo bloque, NO se parcha en éste. |

---

## 8. Criterio de cierre del bloque (binario)

El bloque se considera CERRADO cuando todos estos ítems son `true`:

- [ ] P1 commit mergeable con los 4 archivos `docs/legal/v3.2/*.md` + `METADATA.yaml` + archivo histórico en `docs/legal/archive/v3.1/` + tests de invariantes verdes.
- [ ] P2 commit mergeable con `src/components/TermsOfService.tsx`, `src/pages/TermsOfService.tsx`, `src/pages/PrivacyPolicy.tsx`, `src/pages/DeleteAccount.tsx`, `backend/constants/legal_versions.py`, `shared/legal_constants.ts` sincronizados; tests verdes.
- [ ] P3 reporte del qa-tester (4 secciones obligatorias) con evidencia de las 4 páginas renderizadas + screenshots responsive.
- [ ] P4 carpeta `/Users/cristiang./Desktop/CONIKU LEGAL v3.2/` creada con 11 PDFs + 3 .md auxiliares + `_CAMBIOS_v3.1_A_v3.2.md` listo.
- [ ] `npx tsc --noEmit && npx eslint src/ && npx vitest run && npx vite build && python3.11 -m pytest backend/ -q && python3.11 -m ruff check backend/` verdes localmente (§23).
- [ ] code-reviewer quality score ≥ 85 PASS con sección "Cumplimiento legal" presente.
- [ ] truth-auditor quality score ≥ 85 PASS, gate humano de Cristian explícito + confirmación de que no habilitó `LEGAL_GATE_ENFORCE`.
- [ ] Registro en BLOCKS.md con nota "cierre de v3.2 post-auditoría, revisión de abogado pendiente antes de activar gate".
- [ ] Archivos `docs/legal/v3.2/terms.md` y `privacy.md` agregados a FROZEN.md.

NO se exige como cierre:

- Revisión del abogado completada (es gate humano post-merge).
- Activación de `LEGAL_GATE_ENFORCE`.
- Findings H-04, H-07, H-13..H-35 resueltos (diferidos).

---

## 9. Paquete para abogado — estructura exacta

Ver §5 Pieza 4. Resumen:

- Carpeta raíz: `/Users/cristiang./Desktop/CONIKU LEGAL v3.2/`.
- 11 PDFs (5 de páginas render + 4 canónicos + checklist + citas + plan maestro).
- 4 archivos auxiliares: `_LEER_PRIMERO.md`, `_LEER_PRIMERO.pdf`, `_CAMBIOS_v3.1_A_v3.2.md`, `_CAMBIOS_v3.1_A_v3.2.pdf`.
- Subcarpetas: `canonicos_markdown/` y `referencia_abogado/`.

El documento `_CAMBIOS_v3.1_A_v3.2.md` es el artefacto principal para el abogado: explica diff por diff qué cambió, cita el finding H-0X original, y lista qué queda pendiente para él.

---

## 10. Preguntas pendientes

### Al abogado (entregar junto con el paquete P4)

- **Q-ABG-1 (H-04)**: redactar cláusula transitoria Ley 21.719 para Privacy Sección 15. Propuesta del auditor está en reporte H-04; validar o reescribir.
- **Q-ABG-2 (H-07)**: ¿existen DPAs firmados con los 10 encargados (Supabase, FCM/Google, Google OAuth, Capacitor, MercadoPago, PayPal, Zoho, Render, Vercel, Anthropic)? Confirmación escrita. Bloquea `LEGAL_GATE_ENFORCE`.
- **Q-ABG-3 (H-14)**: EIPD de Athena (perfilamiento alto riesgo). Pendiente previa a 2026-09-01.
- **Q-ABG-4 (H-15 + Q-03 + Q-04)**: verificar contra BCN PDF oficial el texto literal del Art. 71 B Ley 17.336; verificar contra EUR-Lex el Art. 16 letra m Directiva 2011/83/UE.
- **Q-ABG-5 (D-REACCEPT)**: ¿confirma usted que el bump terms v3.2 / privacy v2.4 NO requiere re-aceptación del usuario actual? Razonamiento en §4.
- **Q-ABG-6 (D-H12)**: revisar redacción elegida (A/B/C) para la entrada Anthropic de la tabla de terceros Privacy §6.

### A Cristian (antes de ejecutar P1)

- **Q-CEO-BATCH-1 (D-H12)**: decidir A / B / C para la redacción Anthropic. Recomendación Tori: **B**.
- **Q-CEO-BATCH-2 (D-ARCHIVE)**: al archivar v3.1, ¿mantener `docs/legal/v3.1/README.md` con redirect a `v3.2/`, o borrar `v3.1/` dejando solo `docs/legal/archive/v3.1/`? Recomendación Tori: **mantener README redirect** (no rompe enlaces externos si los hay).
- **Q-CEO-BATCH-3 (H-18)**: entregar PDF del comprobante de solicitud INAPI con número de expediente, para poder anexarlo al paquete del abogado (Q-06 del reporte). Si no está disponible aún, seguir con la redacción actual "en proceso de registro" sin cambio.

### A Cristian (post-merge, decisión humana)

- **Q-CEO-POST-1**: una vez que el abogado devuelva Q-ABG-1..Q-ABG-6 con OK, ¿activar `LEGAL_GATE_ENFORCE=true` en Render? Recomendación Tori: **solo si todos los Q-ABG están cerrados** (especialmente Q-ABG-2 DPAs y Q-ABG-5 re-aceptación).

---

## Apéndice A — Inventario completo de ocurrencias "Santiago" en scope

Verificado por Tori con `Grep` el 2026-04-20:

```
src/pages/TermsOfService.tsx:98   domicilio en Santiago, Chile
src/pages/TermsOfService.tsx:353  Tribunales Ordinarios de Justicia de la ciudad de Santiago de Chile
src/components/TermsOfService.tsx:62    domicilio en Santiago de Chile
src/components/TermsOfService.tsx:125   con domicilio en Santiago de Chile
src/components/TermsOfService.tsx:1352  Cámara de Comercio de Santiago           [KEEP — CAM Santiago]
src/components/TermsOfService.tsx:1353  (CAM Santiago), conforme a su Reglamento [KEEP]
src/components/TermsOfService.tsx:1358  Tribunales Ordinarios de Justicia de Santiago de Chile
src/components/TermsOfService.tsx:1468  Santiago, Chile                          [pie → Antofagasta]
src/pages/PrivacyPolicy.tsx:171         Domicilio: Santiago, Chile
src/pages/DeleteAccount.tsx:408         · Santiago, Chile ·
docs/legal/v3.1/terms.md                [será reemplazado por v3.2/terms.md]
docs/legal/v3.1/privacy.md              [será reemplazado por v3.2/privacy.md]
```

Fuera de scope (HR/admin, bloque separado), documentado para referencia futura:

```
src/admin/shared/ercData.ts  (8 ocurrencias)
src/admin/legal/LegalTab.tsx (7 ocurrencias)
src/admin/tools/BibliotecaDocumentos.tsx (3)
src/admin/hr/ContratosTab.tsx, FiniquitosTab.tsx, InspeccionTrabajoTab.tsx
src/admin/payroll/LibroRemuneracionesTab.tsx
src/admin/modules/personas/PortalTrabajador.tsx   (timezone America/Santiago — NO tocar)
src/pages/HRDashboard.tsx (varias)
src/pages/CeoMail.tsx:63  location: 'Santiago, Chile'
src/data/universities.ts  (nombres de universidades con Santiago — NO tocar)
src/__tests__/workspaces/apaFormat.test.ts  (test fixture — NO tocar)
```

---

## Apéndice B — Comandos de verificación pre-cierre

```bash
# Desde raíz del repo, tras P1 y P2 commiteados:

# Invariante 1-4: hashes sincronizados
python3 -c "import hashlib; print('terms:', hashlib.sha256(open('docs/legal/v3.2/terms.md','rb').read()).hexdigest())"
python3 -c "import hashlib; print('privacy:', hashlib.sha256(open('docs/legal/v3.2/privacy.md','rb').read()).hexdigest())"
grep -E 'TOS_HASH|PRIVACY_HASH' backend/constants/legal_versions.py
grep -E "hash:" shared/legal_constants.ts

# Invariante 5: todos los títulos y artículos presentes
for n in I II III IV V VI VII VIII IX X XI XII XIII XIV; do
  grep -q "TÍTULO $n" docs/legal/v3.2/terms.md && echo "OK TÍTULO $n" || echo "FAIL TÍTULO $n"
done
for n in $(seq 1 49); do
  grep -q "Artículo $n\." docs/legal/v3.2/terms.md && echo "OK Art $n" || echo "FAIL Art $n"
done

# Invariante 6-9
grep -n "domicilio en Santiago" src/pages/ src/components/ | grep -v CAM
grep -n "Versión 2.0" src/components/TermsOfService.tsx
grep -n "jurisdicción exclusiva" docs/legal/v3.2/terms.md
grep -n "Ley N° 21.713" docs/legal/v3.2/terms.md

# Invariante 10: no draft
grep -n "BORRADOR — NO publicar" docs/legal/v3.2/

# §23 pre-flight CI local
npx tsc --noEmit
npx eslint src/
npx vitest run
npx vite build
python3.11 -m pytest backend/ --tb=no -q
python3.11 -m ruff check backend/
```

---

## Declaración obligatoria (repetida al cierre)

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en
producción. El gate humano (§18.7 CLAUDE.md) es obligatorio antes de
activar `LEGAL_GATE_ENFORCE=true` en Render.
