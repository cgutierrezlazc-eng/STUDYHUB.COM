-- Migración: tabla document_views — Bloque legal-viewer-v1 (D-L5)
--
-- Registra cada apertura de documento legal como evidencia probatoria.
--
-- Referencias legales:
-- - GDPR Art. 7(1) (Reglamento UE 2016/679): el responsable debe demostrar
--   que el interesado consintió el tratamiento de sus datos personales.
--   URL: https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679
-- - GDPR Art. 17(3)(e): conservación para ejercicio/defensa de reclamaciones.
-- - GDPR Art. 6(1)(f): interés legítimo como base del registro de apertura.
-- - GDPR Art. 5(1)(c): minimización — user_agent truncado a 512 chars por el
--   endpoint; ip_address se pseudonimiza a los 12 meses (pseudonymized_at_utc).
-- - Art. 2515 Código Civil Chile: prescripción ordinaria 5 años.
--   URL: https://www.bcn.cl/leychile/navegar?idNorma=172986
--
-- Fecha de creación: 2026-04-21
-- Verificador: backend-builder (Tori)
--
-- Esta migración es idempotente (IF NOT EXISTS en todas las sentencias).
-- No aplicar directamente a producción — requiere aprobación humana de Cristian.

CREATE TABLE IF NOT EXISTS document_views (
    -- Identificador interno (hex-16 como en el resto del schema Conniku)
    id VARCHAR(16) PRIMARY KEY,
    -- Usuario autenticado (nullable: anónimos pre-registro no tienen user_id)
    -- ON DELETE SET NULL: la fila se preserva como evidencia aunque el usuario
    -- sea eliminado (GDPR Art. 17(3)(e) retención para defensa legal).
    user_id VARCHAR(16) REFERENCES users(id) ON DELETE SET NULL,
    -- UUID4 generado por el cliente para rastrear sesión anónima pre-registro
    session_token VARCHAR(36),
    -- Documento abierto: 'terms' | 'privacy' | 'cookies' | 'age-declaration'
    doc_key VARCHAR(40) NOT NULL,
    -- Versión semántica del documento (tomada de METADATA.yaml)
    doc_version VARCHAR(20) NOT NULL,
    -- SHA-256 del archivo canónico .md tal como aparece en METADATA.yaml.
    -- Inmutable post-registro: permite cruzar qué versión exacta vio el usuario.
    doc_hash VARCHAR(64) NOT NULL,
    -- Timestamp UTC de la apertura (zona horaria del servidor, no del cliente)
    viewed_at_utc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- True si el usuario hizo scroll hasta el final del documento
    scrolled_to_end BOOLEAN NOT NULL DEFAULT FALSE,
    -- IP del cliente (cruda). Se pseudonimiza a los 12 meses (pseudonymized_at_utc).
    -- Base legal: GDPR Art. 6(1)(f) interés legítimo para evidencia probatoria.
    ip_address VARCHAR(64),
    -- User-Agent truncado a 512 chars (GDPR Art. 5(1)(c) minimización)
    user_agent VARCHAR(512),
    -- viewed_at_utc + 1825 días (GDPR Art. 17(3)(e) + Art. 2515 CC Chile)
    -- 1825 días = 5 años. Sobrevive a la eliminación del usuario.
    retained_until_utc TIMESTAMP NOT NULL,
    -- Seteado por el job de pseudonimización a 12 meses.
    -- Al correr: nullifica ip_address y user_agent de esta fila.
    -- NULL = aún no pseudonimizada.
    pseudonymized_at_utc TIMESTAMP
);

-- Índices para búsqueda eficiente por usuario, sesión y documento
CREATE INDEX IF NOT EXISTS idx_document_views_user_id
    ON document_views(user_id);

CREATE INDEX IF NOT EXISTS idx_document_views_session_token
    ON document_views(session_token);

CREATE INDEX IF NOT EXISTS idx_document_views_doc_key_version
    ON document_views(doc_key, doc_version);

CREATE INDEX IF NOT EXISTS idx_document_views_user_doc
    ON document_views(user_id, doc_key);
