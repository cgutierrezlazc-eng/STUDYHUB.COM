# LEGAL_VERSIONS.md — Registro de versiones de documentos legales Conniku

**Mantenido por**: legal-docs-keeper (agente Tori)
**Última actualización**: 2026-04-20
**Bloque**: bloque-legal-consolidation-v2 (Pieza 7)

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
| Privacy Policy | 2.3 | 0f7e0a3dc287 | 2026-04-20 | actual | `v3.1/privacy.md` |
| Terms of Service | previo (sin numeración) | — | 2026-04-08 | 2026-04-20 | `src/pages/TermsOfService.tsx` (rescatar de git si se necesita) |
| Terms of Service | 3.1 | e3780c975df9 | 2026-04-20 | actual | `v3.1/terms.md` |
| Cookies Policy | 1.0 | a00150297efa | 2026-04-20 (STUB) | [Pieza 5] | `v3.1/cookies.md` |
| Age Declaration | 1.0.0 | ca527535a0f3 | 2026-04-18 | actual | `v3.1/age-declaration.md` |

**Notas**:
- Hash de Privacy v2.1 calculado sobre el archivo `archive/2026-04-11-privacy-policy-v2.1.md`.
- Hash completo de cada versión v3.1 en `v3.1/METADATA.yaml`.
- La columna "Hash SHA-256 (primeros 12)" es solo orientativa; para verificación usar METADATA.yaml.
- "actual" en "Vigencia hasta" = sin fecha de cierre determinada todavía.
- Privacy v2.3 y Terms v3.1 son borradores aprobados por Cristian (2026-04-19) pendientes de
  validación de abogado antes de G3.5. Ver plan `docs/plans/bloque-legal-consolidation-v2/plan-maestro.md`.

## Versiones en user_agreements (mapeadas a archivos)

La tabla `user_agreements.text_version` usa los siguientes valores y cada uno
debe tener un archivo correspondiente en este registro:

| text_version | document_type | Archivo en disco |
|---|---|---|
| `1.0.0` | `age_declaration` | `v3.1/age-declaration.md` |
| `legacy` | `age_declaration_legacy` | (sin archivo; backfill legacy, no tiene texto canónico) |
| `legacy_no_hash_available` | `age_declaration_legacy` | (sin archivo; backfill legacy) |

## Procedimiento para nuevas versiones

1. Crear `docs/legal/v{lote}/` con los archivos del lote.
2. Calcular SHA-256 de cada archivo: `python3 -c "import hashlib; print(hashlib.sha256(open('<archivo>','rb').read()).hexdigest())"`
3. Agregar entrada a `v{lote}/METADATA.yaml`.
4. Agregar fila a esta tabla.
5. Commit con tipo `legal:` y aprobación humana de Cristian antes de merge.
6. Antes de merge a main: abogado revisa el texto (gate G3.5).
