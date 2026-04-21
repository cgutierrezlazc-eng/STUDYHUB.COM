-- Migración: crear tabla cookie_consents
--
-- Bloque: bloque-cookie-consent-banner-v1 — Pieza 1.
--
-- Registro probatorio de consentimiento granular de cookies por visitante
-- (anónimo o autenticado). A diferencia de user_agreements:
--
-- 1. Incluye visitor_uuid para usuarios ANÓNIMOS (pre-login).
-- 2. ON DELETE SET NULL en user_id: el registro SOBREVIVE al borrar el
--    usuario como evidencia legal bajo GDPR Art. 17(3)(e).
-- 3. Almacena categories_accepted como JSON array.
-- 4. Registra policy_hash para demostrabilidad (GDPR Art. 7(1) +
--    Orange Romania C-61/19, TJUE 2020-11-11).
--
-- Retención:
-- - retention_expires_at: el frontend re-pide consentimiento al vencer.
-- - Los registros se preservan 5 años como evidencia legal.
-- - IP y UA se NULLifican a los 12 meses por job de pseudonimización
--   (Pieza 5 del bloque).
--
-- Idempotente: usa IF NOT EXISTS para ejecutarse múltiples veces sin error.
--
-- Referencias legales:
-- - GDPR Art. 7(1): demostrabilidad del consentimiento.
-- - GDPR Art. 17(3)(e): retención para defensa legal.
-- - Directiva 2002/58/CE Art. 5(3) (ePrivacy): consentimiento previo.
-- - Ley 19.628 Art. 4° Chile: información al titular.

-- ──────────────────────────────────────────────────────────────
-- Creación de tabla
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cookie_consents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_uuid VARCHAR(36) NOT NULL,
    user_id VARCHAR(16) NULL,
    accepted_at_utc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_timezone VARCHAR(64) NULL,
    client_ip VARCHAR(64) NULL,
    user_agent TEXT NULL,
    policy_version VARCHAR(20) NOT NULL,
    policy_hash VARCHAR(64) NOT NULL,
    categories_accepted TEXT NOT NULL,
    origin VARCHAR(40) NOT NULL,
    retention_expires_at TIMESTAMP NOT NULL,
    revoked_at_utc TIMESTAMP NULL,
    revocation_reason VARCHAR(80) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_cookie_consents_visitor_uuid
    ON cookie_consents(visitor_uuid);

CREATE INDEX IF NOT EXISTS ix_cookie_consents_user_id
    ON cookie_consents(user_id);

CREATE INDEX IF NOT EXISTS ix_cookie_consents_policy_hash
    ON cookie_consents(policy_hash);

CREATE INDEX IF NOT EXISTS ix_cookie_consents_visitor_accepted
    ON cookie_consents(visitor_uuid, accepted_at_utc DESC);
