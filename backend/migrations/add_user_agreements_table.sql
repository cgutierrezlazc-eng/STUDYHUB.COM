-- Migración: crear tabla user_agreements
--
-- Requerido por CLAUDE.md §Verificación de edad - Componente 3.
-- Registro probatorio de aceptación de textos legales por usuario.
--
-- Incluye backfill retroactivo para usuarios existentes (document_type =
-- 'age_declaration_legacy') para garantizar que todo usuario tenga al menos
-- una fila de aceptación, aunque con evidencia débil (hash placeholder,
-- campos IP/UA/timezone NULL por ser imposibles de reconstruir).
--
-- Idempotente: usa IF NOT EXISTS y NOT EXISTS para poder ejecutarse múltiples
-- veces sin error.

-- ──────────────────────────────────────────────────────────────
-- Creación de tabla
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_agreements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(16) NOT NULL,
    document_type VARCHAR(40) NOT NULL,
    text_version VARCHAR(20) NOT NULL,
    text_version_hash VARCHAR(64) NOT NULL,
    accepted_at_utc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_timezone VARCHAR(64),
    client_ip VARCHAR(64),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_user_agreements_user_id ON user_agreements(user_id);
CREATE INDEX IF NOT EXISTS ix_user_agreements_document_type ON user_agreements(document_type);
CREATE INDEX IF NOT EXISTS ix_user_agreements_text_version_hash ON user_agreements(text_version_hash);
CREATE INDEX IF NOT EXISTS ix_user_agreements_user_doc ON user_agreements(user_id, document_type);

-- ──────────────────────────────────────────────────────────────
-- Backfill retroactivo para usuarios legacy
-- ──────────────────────────────────────────────────────────────
-- Usuarios registrados ANTES del Bloque 1 (auth+edad) no tienen fila.
-- Se les crea una fila con:
--   - document_type = 'age_declaration_legacy'
--   - text_version  = 'legacy'
--   - text_version_hash = 'legacy_no_hash_available'
--   - accepted_at_utc = COALESCE(tos_accepted_at, created_at)
--   - user_timezone, client_ip, user_agent = NULL (irreconstruibles)
--
-- Evidencia débil pero existente. Si el legal-docs-keeper o abogado pide
-- fortalecer, se abre bloque de re-aceptación forzada en próximo login.

INSERT INTO user_agreements (
    user_id,
    document_type,
    text_version,
    text_version_hash,
    accepted_at_utc,
    created_at
)
SELECT
    u.id,
    'age_declaration_legacy',
    'legacy',
    'legacy_no_hash_available',
    COALESCE(u.tos_accepted_at, u.created_at),
    CURRENT_TIMESTAMP
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_agreements ua
    WHERE ua.user_id = u.id
    AND ua.document_type LIKE 'age_declaration%'
);
