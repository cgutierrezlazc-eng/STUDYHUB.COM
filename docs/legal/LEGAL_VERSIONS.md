# LEGAL_VERSIONS.md — Registro de versiones de documentos legales Conniku

**Mantenido por**: legal-docs-keeper (agente Tori)
**Última actualización**: 2026-04-21
**Bloque activo**: bloque-legal-consolidation-v2 (Pieza 5)

Este registro lista cada versión publicada o archivada de los documentos legales de Conniku,
con su hash SHA-256 (primeros 12 caracteres para lectura humana; hash completo en METADATA.yaml),
fecha de vigencia y ruta de archivo.

## Declaración obligatoria

Este registro no constituye asesoría legal profesional y requiere
validación de abogado antes de publicar cambios a producción.

---

## Tabla de versiones

| Documento | Versión | Hash SHA-256 (primeros 12) | Vigencia desde | Vigencia hasta | Archivo |
|---|---|---|---|---|---|
| Privacy Policy | 2.1 | d117fe50fa99 | 2026-04-11 | 2026-04-20 | `archive/2026-04-11-privacy-policy-v2.1.md` |
| Privacy Policy | 2.3 | 0f7e0a3dc287 | 2026-04-20 | 2026-04-20 | `archive/2026-04-20-v3.1-superseded/privacy.md` |
| Privacy Policy | 2.4.0 | 7a8ba81d0be2 | 2026-04-20 | actual | `v3.2/privacy.md` |
| Terms of Service | previo (sin numeración) | — | 2026-04-08 | 2026-04-20 | `src/pages/TermsOfService.tsx` (rescatar de git si se necesita) |
| Terms of Service | 3.1 | e3780c975df9 | 2026-04-20 | 2026-04-20 | `archive/2026-04-20-v3.1-superseded/terms.md` |
| Terms of Service | 3.2.0 | 9a16122f985a | 2026-04-20 | actual | `v3.2/terms.md` |
| Cookies Policy (stub v3.1) | 1.0.0 | a00150297efa | 2026-04-20 | 2026-04-21 | `archive/2026-04-20-v3.1-superseded/cookies.md` (idéntico byte a byte al stub v3.2 anterior) |
| Cookies Policy | 1.0.0 | 48b90468822f | 2026-04-21 | actual | `v3.2/cookies.md` |
| Age Declaration (archivo .md, v3.1 cierre nota) | 1.0.0 | 90a0fc5887da | 2026-04-18 | 2026-04-20 | `archive/2026-04-20-v3.1-superseded/age-declaration.md` |
| Age Declaration (archivo .md, v3.2 nota cerrada) | 1.0.0 | 61dab2ecf1b2 | 2026-04-20 | actual | `v3.2/age-declaration.md` |
| Age Declaration (TEXTO canónico, inmutable) | 1.0.0 | ca527535a0f3 | 2026-04-18 | actual | hash del texto entre separadores, `user_agreements.text_version_hash` |
| Age Declaration (vista pública) | 1.0.0 | d08689443d6a | 2026-04-21 | actual | `v3.2/age-declaration-public.md` — ruta pública `/legal/age-declaration` (D-L8 Bloque 5), preserva texto firmado byte-a-byte |

**Notas**:
- Hash de Privacy v2.1 calculado sobre `archive/2026-04-11-privacy-policy-v2.1.md`.
- Hashes completos de cada versión v3.2 en `v3.2/METADATA.yaml`.
- La columna "Hash SHA-256 (primeros 12)" es solo orientativa; para verificación usar METADATA.yaml.
- "actual" en "Vigencia hasta" = sin fecha de cierre determinada todavía.
- **v3.1 archivado**: Privacy v2.3 y Terms v3.1 eran borradores que se autodeclaraban "BORRADOR — NO publicar". La auditoría legal externa del 2026-04-20 (findings H-05, H-06) identificó que los hashes registrados en `backend/constants/legal_versions.py` apuntaban a esos drafts, rompiendo la trazabilidad probatoria de `user_agreements.text_version_hash`. El bloque `bloque-legal-v3.2-post-audit` reemplaza ambos por texto canónico autocontenido (v3.2) derivado de las fuentes reales del producto (`src/components/TermsOfService.tsx` y `src/pages/PrivacyPolicy.tsx`), con las correcciones del auditor aplicadas (H-01 domicilio Antofagasta, H-02 versión 3.2, H-08 jurisdicción no exclusiva, H-09 acciones colectivas, H-10 dolo/culpa grave, H-11 IVA DL 825, H-12 Anthropic opción B, H-16 modificaciones de clarificación, H-17 cláusula prevalencia, H-37 cierre nota Art. 210 CP).
- **Age Declaration**: el archivo .md cambió de hash porque se actualizó la sección "Notas de cumplimiento" (cierre H-37), pero el TEXTO canónico entre separadores `---` permanece inmutable (hash `ca527535a0f3f938b51d9a2e896e140233ecdd2286e13fdeecb7a32783d43706`). Ese es el hash que respalda `user_agreements.text_version_hash` históricamente.
- **Cookies v1.0.0 (2026-04-21)**: primera versión pública y canónica de la Política de Cookies, publicada como Pieza 5 del bloque `bloque-legal-consolidation-v2`. Supersede al stub anterior de `v3.2/cookies.md` (que compartía hash con `v3.1/cookies.md` y se autodeclaraba "estado: STUB — NO PUBLICAR"). Corrige violación de GDPR Art. 7(1): cada usuario que aceptaba cookies estaba firmando implícitamente un stub vacío. El nuevo documento incorpora inventario real de cookies y localStorage extraído de `src/pages/CookiesPolicy.tsx`, clasificación de `cc_visitor_uuid` como cookie esencial (decisión Capa 0 D-01 Opción A, con 4 condiciones: plazo 13 meses, uso restringido, regeneración al retirar consentimiento, declaración explícita), base legal Art. 6(1)(b) GDPR para cookies funcionales post-login, retención de registros de consentimiento 5 años post-delete (Art. 17(3)(e) GDPR + Art. 2515 Código Civil chileno), pseudonimización de IP y User-Agent a los 12 meses, y referencia a la vigencia de la Ley 21.719 chilena a partir del 1 de diciembre de 2026 (CVE-2583630, Art. 1° transitorio). Aprobado por Cristian Gutiérrez Lazcano (CEO Conniku SpA).
- **Aprobación pendiente**: Privacy v2.4.0 y Terms v3.2.0 están redactados pero pendientes de validación por abogado externo antes de marcar `aprobacion_fecha` en `v3.2/METADATA.yaml`. Gate humano §18.7 CLAUDE.md.

## Versiones en user_agreements (mapeadas a archivos)

La tabla `user_agreements.text_version` usa los siguientes valores y cada uno
debe tener un archivo correspondiente en este registro:

| text_version | document_type | Archivo en disco |
|---|---|---|
| `1.0.0` | `age_declaration` | `v3.2/age-declaration.md` (texto canónico inmutable; hash `ca527535...`) |
| `legacy` | `age_declaration_legacy` | (sin archivo; backfill legacy, no tiene texto canónico) |
| `legacy_no_hash_available` | `age_declaration_legacy` | (sin archivo; backfill legacy) |

## Procedimiento para nuevas versiones

1. Crear `docs/legal/v{lote}/` con los archivos del lote.
2. Calcular SHA-256 de cada archivo: `shasum -a 256 docs/legal/v{lote}/<archivo>` o `python3 -c "import hashlib; print(hashlib.sha256(open('<archivo>','rb').read()).hexdigest())"`
3. Agregar entrada a `v{lote}/METADATA.yaml`.
4. Agregar fila a esta tabla.
5. Commit con tipo `legal:` y aprobación humana de Cristian antes de merge.
6. Antes de merge a main: abogado revisa el texto (gate G3.5).
7. Archivar versión anterior en `docs/legal/archive/YYYY-MM-DD-v{anterior}-superseded/` con README.md apuntando a la versión vigente y al plan.

## Referencias

- Plan del bloque v3.2: `docs/plans/bloque-legal-v3.2-post-audit/plan.md`
- Plan del bloque de consolidación: `docs/plans/bloque-legal-consolidation-v2/plan.md`
- Reporte de auditoría legal externa (2026-04-20): `/Users/cristiang./Desktop/CONIKU LEGAL/Auditoria_Claude.md` (41 hallazgos H-01..H-41)
- Archivo histórico v3.1: `docs/legal/archive/2026-04-20-v3.1-superseded/`
