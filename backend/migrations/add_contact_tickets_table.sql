-- Migración idempotente: sistema de tickets de contacto.
-- Bloque: bloque-contact-tickets-v1
-- Fecha: 2026-04-22
--
-- Referencia legal:
-- - GDPR Art. 6(1)(a), Art. 7(1), Art. 17(3)(e), Art. 5(1)(c), Art. 5(1)(e)
--   URL: https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679
-- - Ley 19.628 (Chile) Art. 4°
--   URL: https://www.bcn.cl/leychile/navegar?idNorma=141599
-- - Art. 2515 Código Civil Chile (prescripción ordinaria 5 años)
--   URL: https://www.bcn.cl/leychile/navegar?idNorma=172986
-- - Ley 21.719 (Chile) Art. 14 vigente 2026-12-01 (pseudonimización)
--   URL: https://www.bcn.cl/leychile/navegar?idNorma=1212270
--
-- NOTA: Esta migración es para PostgreSQL en producción.
-- En tests se usa SQLite vía Base.metadata.create_all() que crea las tablas
-- directamente desde los modelos SQLAlchemy en database.py.
-- Ejecutar este archivo solo en staging/producción.
--
-- Idempotencia garantizada por IF NOT EXISTS en todas las sentencias.
--
-- Cómo ejecutar en producción:
--   psql $DATABASE_URL -f backend/migrations/add_contact_tickets_table.sql

-- Secuencia para ticket_number legible (CNT-{año}-{seq:06d}).
-- No reinicia por año (el año va solo en el formato, no en la secuencia).
-- Decisión D-T3-A con matiz: contador global sin reinicio, año en formato.
CREATE SEQUENCE IF NOT EXISTS contact_ticket_seq
    START 1
    INCREMENT 1
    MINVALUE 1
    NO MAXVALUE
    CACHE 1;

-- Tabla principal de tickets de contacto.
CREATE TABLE IF NOT EXISTS contact_tickets (
    id              VARCHAR(16)   PRIMARY KEY,
    ticket_number   VARCHAR(20)   NOT NULL UNIQUE,
    name            VARCHAR(120)  NOT NULL,
    email           VARCHAR(255)  NOT NULL,
    reason          VARCHAR(20)   NOT NULL,
    org             VARCHAR(120),
    message         TEXT          NOT NULL,
    status          VARCHAR(20)   NOT NULL DEFAULT 'open',
    assigned_to     VARCHAR(16)   REFERENCES users(id) ON DELETE SET NULL,
    routed_to_email VARCHAR(255)  NOT NULL,
    routed_label    VARCHAR(80)   NOT NULL,
    sla_hours       INTEGER       NOT NULL,
    -- Evidencia de consentimiento (GDPR Art. 7(1))
    consent_version VARCHAR(20)   NOT NULL,
    consent_hash    VARCHAR(64)   NOT NULL,
    consent_accepted_at_utc TIMESTAMP WITH TIME ZONE NOT NULL,
    -- IP y UA (GDPR Art. 6(1)(f) interés legítimo; se pseudonimizan a 12 meses)
    client_ip       VARCHAR(64),
    user_agent      VARCHAR(512),
    user_timezone   VARCHAR(64),
    -- Métricas SLA
    first_response_at_utc   TIMESTAMP WITH TIME ZONE,
    resolved_at_utc         TIMESTAMP WITH TIME ZONE,
    resolution_note         TEXT,
    -- Retención legal (Art. 17(3)(e) GDPR + Art. 2515 CC Chile = 5 años)
    retained_until_utc      TIMESTAMP WITH TIME ZONE NOT NULL,
    pseudonymized_at_utc    TIMESTAMP WITH TIME ZONE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla de mensajes del hilo (threading bidireccional)
CREATE TABLE IF NOT EXISTS contact_ticket_messages (
    id              VARCHAR(16)   PRIMARY KEY,
    ticket_id       VARCHAR(16)   NOT NULL REFERENCES contact_tickets(id) ON DELETE CASCADE,
    direction       VARCHAR(10)   NOT NULL,  -- 'inbound' | 'outbound'
    author_user_id  VARCHAR(16)   REFERENCES users(id) ON DELETE SET NULL,
    author_email    VARCHAR(255)  NOT NULL,
    body            TEXT          NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    email_message_id VARCHAR(255)
);

-- Índices contact_tickets
CREATE INDEX IF NOT EXISTS ix_contact_tickets_ticket_number  ON contact_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS ix_contact_tickets_email          ON contact_tickets(email);
CREATE INDEX IF NOT EXISTS ix_contact_tickets_reason         ON contact_tickets(reason);
CREATE INDEX IF NOT EXISTS ix_contact_tickets_status         ON contact_tickets(status);
CREATE INDEX IF NOT EXISTS ix_contact_tickets_created_at     ON contact_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS ix_contact_tickets_email_created  ON contact_tickets(email, created_at);
CREATE INDEX IF NOT EXISTS ix_contact_tickets_status_created ON contact_tickets(status, created_at);
CREATE INDEX IF NOT EXISTS ix_contact_tickets_ip_created     ON contact_tickets(client_ip, created_at);

-- Índices contact_ticket_messages
CREATE INDEX IF NOT EXISTS ix_ctm_ticket_id        ON contact_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS ix_ctm_ticket_direction ON contact_ticket_messages(ticket_id, direction);
