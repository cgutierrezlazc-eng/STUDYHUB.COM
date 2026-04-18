-- Workspaces v2 — Bloque 2a Fundación
-- Archivo de documentación histórica (espejo del DDL ejecutado por migrations.py).
-- NO se invoca directamente desde Python. El código real está en migrations.py.
-- Para referencia de formato, ver add_user_agreements_table.sql en este directorio.
-- Creado: 2026-04-18
-- Autor: backend-builder (Tori)

-- Tabla principal de workspaces/documentos colaborativos
CREATE TABLE IF NOT EXISTS workspace_documents (
    id VARCHAR(16) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    owner_id VARCHAR(16) NOT NULL REFERENCES users(id),
    course_name VARCHAR(255),
    rubric_raw TEXT,
    rubric_criteria TEXT,
    apa_edition VARCHAR(10) DEFAULT '7',
    options TEXT DEFAULT '{}',
    cover_data TEXT,
    cover_template VARCHAR(50),
    content_yjs TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    share_link_token VARCHAR(32) UNIQUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Miembros del workspace con rol (owner, editor, viewer)
CREATE TABLE IF NOT EXISTS workspace_members (
    id VARCHAR(16) PRIMARY KEY,
    workspace_id VARCHAR(16) NOT NULL
        REFERENCES workspace_documents(id) ON DELETE CASCADE,
    user_id VARCHAR(16) NOT NULL REFERENCES users(id),
    role VARCHAR(20) DEFAULT 'viewer',
    chars_contributed INTEGER DEFAULT 0,
    invited_at TIMESTAMP,
    joined_at TIMESTAMP
);

-- Versiones / snapshots del contenido Yjs
CREATE TABLE IF NOT EXISTS workspace_versions (
    id VARCHAR(16) PRIMARY KEY,
    workspace_id VARCHAR(16) NOT NULL
        REFERENCES workspace_documents(id) ON DELETE CASCADE,
    content_yjs TEXT NOT NULL,
    created_by VARCHAR(16) NOT NULL REFERENCES users(id),
    created_at TIMESTAMP,
    label VARCHAR(100)
);

-- Chat del grupo (no Athena), entre miembros del workspace
-- Endpoints de chat implementados en bloque 2b
CREATE TABLE IF NOT EXISTS workspace_messages (
    id VARCHAR(16) PRIMARY KEY,
    workspace_id VARCHAR(16) NOT NULL
        REFERENCES workspace_documents(id) ON DELETE CASCADE,
    user_id VARCHAR(16) NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP
);

-- Historial de chat privado con Athena por usuario
-- Consumido desde bloque 2c (Athena IA)
CREATE TABLE IF NOT EXISTS workspace_athena_chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id VARCHAR(16) NOT NULL
        REFERENCES workspace_documents(id) ON DELETE CASCADE,
    user_id VARCHAR(16) NOT NULL REFERENCES users(id),
    role VARCHAR(20) NOT NULL,  -- 'user' or 'athena'
    content TEXT NOT NULL,
    created_at TIMESTAMP
);

-- Sugerencias de Athena con flujo apply/modify/reject
-- Consumido desde bloque 2c (Athena IA)
CREATE TABLE IF NOT EXISTS workspace_athena_suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id VARCHAR(16) NOT NULL
        REFERENCES workspace_documents(id) ON DELETE CASCADE,
    user_id VARCHAR(16) NOT NULL REFERENCES users(id),
    staging_content TEXT NOT NULL,
    suggestion_content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',  -- pending, applied, modified, rejected
    created_at TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Comentarios inline con soporte de threads (self-FK parent_id)
CREATE TABLE IF NOT EXISTS workspace_comments (
    id VARCHAR(16) PRIMARY KEY,
    workspace_id VARCHAR(16) NOT NULL
        REFERENCES workspace_documents(id) ON DELETE CASCADE,
    user_id VARCHAR(16) NOT NULL REFERENCES users(id),
    anchor_json TEXT NOT NULL,  -- posición en el doc (nodeKey, offset, selection)
    content TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    parent_id VARCHAR(16) REFERENCES workspace_comments(id),  -- thread
    created_at TIMESTAMP
);

-- Métricas de uso de Athena para rate limiting por plan (Free/PRO/MAX)
-- Consumido desde bloque 2c. Ver plan-maestro.md §4 Athena-4.
CREATE TABLE IF NOT EXISTS athena_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(16) NOT NULL REFERENCES users(id),
    workspace_id VARCHAR(16) REFERENCES workspace_documents(id) ON DELETE SET NULL,
    action VARCHAR(20) NOT NULL,  -- analyze, chat, apply, suggest
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    created_at TIMESTAMP
);

-- Índice compuesto para consultas de cuota mensual por usuario
CREATE INDEX IF NOT EXISTS ix_athena_usage_user_month ON athena_usage (user_id, created_at);
