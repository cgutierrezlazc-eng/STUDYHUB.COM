"""
Database migrations for Conniku.
Adds new columns to existing tables. Safe to run multiple times.
Uses SQLAlchemy so it works with both PostgreSQL and SQLite.
"""

import logging
import os

from sqlalchemy import inspect, text

logger = logging.getLogger("conniku.migrations")


def migrate():
    """Run safe additive migrations using SQLAlchemy engine."""
    from database import engine

    # All columns that may need to be added to the 'users' table
    new_columns = [
        # Theme & preferences
        ("theme", "VARCHAR(30) DEFAULT 'nocturno'"),
        # Subscription
        ("subscription_status", "VARCHAR(20) DEFAULT 'trial'"),
        ("trial_started_at", "TIMESTAMP"),
        ("subscription_expires_at", "TIMESTAMP"),
        ("stripe_customer_id", "VARCHAR(255)"),
        ("paypal_subscription_id", "VARCHAR(255)"),
        # Password recovery
        ("reset_code", "VARCHAR(10)"),
        ("reset_code_expires", "TIMESTAMP"),
        # Gamification
        ("xp", "INTEGER DEFAULT 0"),
        ("level", "INTEGER DEFAULT 1"),
        ("streak_days", "INTEGER DEFAULT 0"),
        ("last_active_date", "VARCHAR(10)"),
        ("badges", "TEXT DEFAULT '[]'"),
        # Role
        ("role", "VARCHAR(20) DEFAULT 'user'"),
        # Storage tracking
        ("storage_used_bytes", "FLOAT DEFAULT 0"),
        ("storage_limit_bytes", "FLOAT DEFAULT 524288000"),
        # TOS
        ("tos_accepted_at", "TIMESTAMP"),
        # Onboarding
        ("onboarding_completed", "BOOLEAN DEFAULT FALSE"),
        # Email verification
        ("email_verified", "BOOLEAN DEFAULT FALSE"),
        ("verification_code", "VARCHAR(10)"),
        # Ban
        ("is_banned", "BOOLEAN DEFAULT FALSE"),
        ("ban_reason", "VARCHAR(500)"),
        ("is_admin", "BOOLEAN DEFAULT FALSE"),
        # Tier system
        ("subscription_tier", "VARCHAR(10) DEFAULT 'free'"),
        ("referral_code", "VARCHAR(12)"),
        ("referred_by", "VARCHAR(16)"),
        ("referral_count", "INTEGER DEFAULT 0"),
        ("weekly_study_goal_hours", "FLOAT DEFAULT 10.0"),
        ("pomodoro_total_sessions", "INTEGER DEFAULT 0"),
        ("pomodoro_total_minutes", "INTEGER DEFAULT 0"),
        ("streak_freeze_count", "INTEGER DEFAULT 2"),
        # Country & currency
        ("country", "VARCHAR(5) DEFAULT 'CL'"),
        ("country_currency", "VARCHAR(5) DEFAULT 'CLP'"),
        # Profile fields
        ("language_skill", "VARCHAR(20) DEFAULT 'intermediate'"),
        ("secondary_languages", "TEXT DEFAULT '[]'"),
        ("platform_language", "VARCHAR(5) DEFAULT 'es'"),
        ("phone", "VARCHAR(50) DEFAULT ''"),
        ("birth_date", "VARCHAR(20) DEFAULT ''"),
        ("bio", "TEXT DEFAULT ''"),
        ("gender", "VARCHAR(20) DEFAULT 'unspecified'"),
        ("is_graduated", "BOOLEAN DEFAULT FALSE"),
        ("graduation_year", "INTEGER"),
        ("is_senior_year", "BOOLEAN DEFAULT FALSE"),
        ("total_semesters", "INTEGER DEFAULT 8"),
        ("provider", "VARCHAR(20) DEFAULT 'email'"),
        # Academic status & mentoring
        ("academic_status", "VARCHAR(20) DEFAULT 'estudiante'"),
        ("offers_mentoring", "BOOLEAN DEFAULT FALSE"),
        ("mentoring_services", "TEXT DEFAULT '[]'"),
        ("mentoring_subjects", "TEXT DEFAULT '[]'"),
        ("graduation_status_year", "INTEGER"),
        ("title_year", "INTEGER"),
        ("mentoring_description", "TEXT DEFAULT ''"),
        ("mentoring_price_type", "VARCHAR(10) DEFAULT 'free'"),
        ("mentoring_price_per_hour", "FLOAT"),
        ("mentoring_currency", "VARCHAR(5) DEFAULT 'USD'"),
        ("professional_title", "VARCHAR(255) DEFAULT ''"),
        # Study start date
        ("study_start_date", "VARCHAR(10) DEFAULT ''"),
        # Reward tracking (JSON array of granted rewards with dates)
        ("mood_data", "TEXT DEFAULT '[]'"),
        # CV / Resume fields
        ("cv_headline", "VARCHAR(255) DEFAULT ''"),
        ("cv_summary", "TEXT DEFAULT ''"),
        ("cv_experience", "TEXT DEFAULT ''"),
        ("cv_skills", "TEXT DEFAULT ''"),
        ("cv_certifications", "TEXT DEFAULT ''"),
        ("cv_languages", "TEXT DEFAULT ''"),
        ("cv_portfolio", "TEXT DEFAULT ''"),
        ("cv_visibility", "VARCHAR(20) DEFAULT 'private'"),
        ("cv_file_path", "VARCHAR(500) DEFAULT ''"),
        # Cover photo
        ("cover_photo", "VARCHAR(500) DEFAULT ''"),
        ("cover_type", "VARCHAR(20) DEFAULT 'template'"),
        ("cover_position_y", "INTEGER DEFAULT 50"),
        # Ghost / invisible profile (CEO only — not visible to other users)
        ("is_ghost", "BOOLEAN DEFAULT FALSE"),
        # Email notification preferences
        ("email_notif_enabled", "BOOLEAN DEFAULT TRUE"),
        ("email_notif_friend_posts", "BOOLEAN DEFAULT TRUE"),
        ("email_notif_friend_requests", "BOOLEAN DEFAULT TRUE"),
        ("email_notif_direct_messages", "BOOLEAN DEFAULT TRUE"),
    ]

    inspector = inspect(engine)

    # Check if users table exists
    if not inspector.has_table("users"):
        logger.info("Users table does not exist yet, skipping migrations.")
        return

    existing_columns = {col["name"] for col in inspector.get_columns("users")}

    with engine.begin() as conn:
        for col_name, col_type in new_columns:
            if col_name not in existing_columns:
                try:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                    logger.info(f"Added column users.{col_name}")
                except Exception as e:
                    # Column might already exist (race condition) - safe to ignore
                    logger.debug(f"Column users.{col_name} skipped: {e}")

    # Create tutoring_requests table if it doesn't exist (new mentoring system)
    if not inspector.has_table("tutoring_requests"):
        with engine.begin() as conn:
            conn.execute(
                text("""
                CREATE TABLE tutoring_requests (
                    id VARCHAR(16) PRIMARY KEY,
                    student_id VARCHAR(16) NOT NULL,
                    tutor_id VARCHAR(16) NOT NULL,
                    subject VARCHAR(255) NOT NULL,
                    message TEXT DEFAULT '',
                    status VARCHAR(20) DEFAULT 'pending',
                    created_at TIMESTAMP,
                    responded_at TIMESTAMP
                )
            """)
            )
            logger.info("Created tutoring_requests table.")

    # Create tutoring_listing_requests table if it doesn't exist (job listings system)
    if not inspector.has_table("tutoring_listing_requests"):
        with engine.begin() as conn:
            conn.execute(
                text("""
                CREATE TABLE tutoring_listing_requests (
                    id VARCHAR(16) PRIMARY KEY,
                    listing_id VARCHAR(16) NOT NULL,
                    student_id VARCHAR(16) NOT NULL,
                    tutor_id VARCHAR(16) NOT NULL,
                    message TEXT DEFAULT '',
                    status VARCHAR(20) DEFAULT 'pending',
                    scheduled_at TIMESTAMP,
                    rating INTEGER,
                    review TEXT,
                    created_at TIMESTAMP
                )
            """)
            )
            logger.info("Created tutoring_listing_requests table.")

    # Add new columns to wall_posts table (visibility & milestone support)
    if inspector.has_table("wall_posts"):
        existing_wp_columns = {col["name"] for col in inspector.get_columns("wall_posts")}
        wall_post_columns = [
            ("visibility", "VARCHAR(30) DEFAULT 'friends'"),
            ("visible_to", "TEXT DEFAULT '[]'"),
            ("is_milestone", "BOOLEAN DEFAULT FALSE"),
            ("milestone_type", "VARCHAR(50)"),
            ("visibility_list_id", "VARCHAR(16)"),
        ]
        with engine.begin() as conn:
            for col_name, col_type in wall_post_columns:
                if col_name not in existing_wp_columns:
                    try:
                        conn.execute(text(f"ALTER TABLE wall_posts ADD COLUMN {col_name} {col_type}"))
                        logger.info(f"Added column wall_posts.{col_name}")
                    except Exception as e:
                        logger.debug(f"Column wall_posts.{col_name} skipped: {e}")

    # Create friend_lists table
    if not inspector.has_table("friend_lists"):
        with engine.begin() as conn:
            conn.execute(
                text("""
                CREATE TABLE friend_lists (
                    id VARCHAR(16) PRIMARY KEY,
                    user_id VARCHAR(16) NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    created_at TIMESTAMP
                )
            """)
            )
            logger.info("Created friend_lists table.")

    # Create friend_list_members table
    if not inspector.has_table("friend_list_members"):
        with engine.begin() as conn:
            conn.execute(
                text("""
                CREATE TABLE friend_list_members (
                    id VARCHAR(16) PRIMARY KEY,
                    list_id VARCHAR(16) NOT NULL,
                    friend_id VARCHAR(16) NOT NULL,
                    UNIQUE(list_id, friend_id)
                )
            """)
            )
            logger.info("Created friend_list_members table.")

    # Add moderation_status and reply_to_* columns to messages table
    if inspector.has_table("messages"):
        existing_msg_columns = {col["name"] for col in inspector.get_columns("messages")}
        msg_new_cols = [
            ("moderation_status", "VARCHAR(20) DEFAULT 'approved'"),
            ("reply_to_id", "VARCHAR(16)"),
            ("reply_to_content", "TEXT"),
            ("reply_to_sender_name", "VARCHAR(255)"),
        ]
        for col_name, col_def in msg_new_cols:
            if col_name not in existing_msg_columns:
                with engine.begin() as conn:
                    try:
                        conn.execute(text(f"ALTER TABLE messages ADD COLUMN {col_name} {col_def}"))
                        logger.info(f"Added column messages.{col_name}")
                    except Exception as e:
                        logger.debug(f"Column messages.{col_name} skipped: {e}")

    # Add edited_at to post_comments table
    if inspector.has_table("post_comments"):
        existing_pc_columns = {col["name"] for col in inspector.get_columns("post_comments")}
        if "edited_at" not in existing_pc_columns:
            with engine.begin() as conn:
                try:
                    conn.execute(text("ALTER TABLE post_comments ADD COLUMN edited_at DATETIME"))
                    logger.info("Added column post_comments.edited_at")
                except Exception as e:
                    logger.debug(f"Column post_comments.edited_at skipped: {e}")

    # Add is_announcement to community_posts table
    if inspector.has_table("community_posts"):
        existing_cp_columns = {col["name"] for col in inspector.get_columns("community_posts")}
        if "is_announcement" not in existing_cp_columns:
            with engine.begin() as conn:
                try:
                    conn.execute(text("ALTER TABLE community_posts ADD COLUMN is_announcement BOOLEAN DEFAULT FALSE"))
                    logger.info("Added column community_posts.is_announcement")
                except Exception as e:
                    logger.debug(f"Column community_posts.is_announcement skipped: {e}")

    # Create moderation_queue table if it doesn't exist
    if not inspector.has_table("moderation_queue"):
        with engine.begin() as conn:
            conn.execute(
                text("""
                CREATE TABLE moderation_queue (
                    id VARCHAR(16) PRIMARY KEY,
                    content_type VARCHAR(20) NOT NULL,
                    original_content TEXT NOT NULL,
                    sender_id VARCHAR(16),
                    context_id VARCHAR(16),
                    category VARCHAR(50) DEFAULT 'unknown',
                    auto_reason TEXT,
                    status VARCHAR(20) DEFAULT 'pending',
                    ceo_note TEXT,
                    message_id VARCHAR(16),
                    created_at TIMESTAMP,
                    reviewed_at TIMESTAMP
                )
            """)
            )
            logger.info("Created moderation_queue table.")

    # ─── Set CEO as ghost (invisible profile) ────────────────────
    try:
        import json
        from pathlib import Path

        config_file = Path(os.environ.get("DATA_DIR", "/data")) / "config.json"
        admin_email = ""
        import contextlib

        if config_file.exists():
            with contextlib.suppress(Exception):
                admin_email = json.loads(config_file.read_text()).get("admin_email", "").lower()
        if not admin_email:
            admin_email = os.environ.get("ADMIN_EMAIL", "").lower()
        if admin_email:
            with engine.begin() as conn:
                conn.execute(text("UPDATE users SET is_ghost = FALSE WHERE email = :email"), {"email": admin_email})
                logger.info(f"CEO visible (is_ghost=FALSE) for {admin_email}")
    except Exception as e:
        logger.warning(f"Could not set CEO ghost flag: {e}")

    # Create blog_threads table if it doesn't exist
    if not inspector.has_table("blog_threads"):
        with engine.begin() as conn:
            conn.execute(
                text("""
                CREATE TABLE blog_threads (
                    id VARCHAR(16) PRIMARY KEY,
                    user_id VARCHAR(16) NOT NULL,
                    content TEXT NOT NULL,
                    likes INTEGER DEFAULT 0,
                    created_at TIMESTAMP
                )
            """)
            )
            logger.info("Created blog_threads table.")

    # ─── university_connections: add missing columns ──────────────
    if inspector.has_table("university_connections"):
        uc_cols = {c["name"] for c in inspector.get_columns("university_connections")}
        uc_new = [
            ("last_visited_at", "TIMESTAMP"),
            ("platform_name", "VARCHAR(255) DEFAULT ''"),
        ]
        for col_name, col_type in uc_new:
            if col_name not in uc_cols:
                try:
                    with engine.begin() as conn:
                        conn.execute(text(f"ALTER TABLE university_connections ADD COLUMN {col_name} {col_type}"))
                    logger.info(f"Added university_connections.{col_name}")
                except Exception as e:
                    logger.warning(f"Could not add university_connections.{col_name}: {e}")

    # ─── user_agreements (Bloque 1 auth+edad) ──────────────────────
    # Tabla probatoria de aceptación de textos legales por usuario.
    # CLAUDE.md §Verificación de edad - Componente 3.
    # SQLAlchemy create_all() ya creó la tabla si no existía. Aquí
    # ejecutamos el backfill retroactivo (SQL plano) para usuarios
    # registrados antes del Bloque 1.
    if inspector.has_table("user_agreements") and inspector.has_table("users"):
        try:
            with engine.begin() as conn:
                # Contar usuarios sin aceptación registrada
                result = conn.execute(
                    text("""
                    SELECT COUNT(*) FROM users u
                    WHERE NOT EXISTS (
                        SELECT 1 FROM user_agreements ua
                        WHERE ua.user_id = u.id
                        AND ua.document_type LIKE 'age_declaration%'
                    )
                """)
                )
                pending = result.scalar() or 0
                if pending > 0:
                    conn.execute(
                        text("""
                        INSERT INTO user_agreements (
                            user_id, document_type, text_version,
                            text_version_hash, accepted_at_utc, created_at
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
                        )
                    """)
                    )
                    logger.info(f"Backfilled {pending} legacy age_declaration rows in user_agreements")
        except Exception as e:
            logger.warning(f"Could not backfill user_agreements: {e}")

    # ─── Workspaces v2 (Bloque 2a Fundación) ─────────────────────────────────
    # Espejo de los modelos ORM definidos en database.py (WorkspaceDocument, etc.)
    # SQLAlchemy Base.metadata.create_all() crea estas tablas al inicio.
    # Este bloque actúa como fallback para entornos donde create_all no ejecuta
    # o para migraciones manuales en PostgreSQL de producción.
    # Ver docs/plans/bloque-2-workspaces/plan-maestro.md §4.

    # Refrescar inspector para detectar estado actual del schema
    inspector = inspect(engine)

    if not inspector.has_table("workspace_documents"):
        with engine.begin() as conn:
            conn.execute(
                text("""
                CREATE TABLE workspace_documents (
                    id VARCHAR(16) PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    owner_id VARCHAR(16) NOT NULL,
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
                )
            """)
            )
            logger.info("Created workspace_documents table.")

    if not inspector.has_table("workspace_members"):
        with engine.begin() as conn:
            conn.execute(
                text("""
                CREATE TABLE workspace_members (
                    id VARCHAR(16) PRIMARY KEY,
                    workspace_id VARCHAR(16) NOT NULL
                        REFERENCES workspace_documents(id) ON DELETE CASCADE,
                    user_id VARCHAR(16) NOT NULL,
                    role VARCHAR(20) DEFAULT 'viewer',
                    chars_contributed INTEGER DEFAULT 0,
                    invited_at TIMESTAMP,
                    joined_at TIMESTAMP
                )
            """)
            )
            logger.info("Created workspace_members table.")

    if not inspector.has_table("workspace_versions"):
        with engine.begin() as conn:
            conn.execute(
                text("""
                CREATE TABLE workspace_versions (
                    id VARCHAR(16) PRIMARY KEY,
                    workspace_id VARCHAR(16) NOT NULL
                        REFERENCES workspace_documents(id) ON DELETE CASCADE,
                    content_yjs TEXT NOT NULL,
                    created_by VARCHAR(16) NOT NULL,
                    created_at TIMESTAMP,
                    label VARCHAR(100)
                )
            """)
            )
            logger.info("Created workspace_versions table.")

    if not inspector.has_table("workspace_messages"):
        with engine.begin() as conn:
            conn.execute(
                text("""
                CREATE TABLE workspace_messages (
                    id VARCHAR(16) PRIMARY KEY,
                    workspace_id VARCHAR(16) NOT NULL
                        REFERENCES workspace_documents(id) ON DELETE CASCADE,
                    user_id VARCHAR(16) NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP
                )
            """)
            )
            logger.info("Created workspace_messages table.")

    if not inspector.has_table("workspace_athena_chats"):
        with engine.begin() as conn:
            conn.execute(
                text("""
                CREATE TABLE workspace_athena_chats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    workspace_id VARCHAR(16) NOT NULL
                        REFERENCES workspace_documents(id) ON DELETE CASCADE,
                    user_id VARCHAR(16) NOT NULL,
                    role VARCHAR(20) NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP
                )
            """)
            )
            logger.info("Created workspace_athena_chats table.")

    if not inspector.has_table("workspace_athena_suggestions"):
        with engine.begin() as conn:
            conn.execute(
                text("""
                CREATE TABLE workspace_athena_suggestions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    workspace_id VARCHAR(16) NOT NULL
                        REFERENCES workspace_documents(id) ON DELETE CASCADE,
                    user_id VARCHAR(16) NOT NULL,
                    staging_content TEXT NOT NULL,
                    suggestion_content TEXT NOT NULL,
                    status VARCHAR(20) DEFAULT 'pending',
                    created_at TIMESTAMP,
                    resolved_at TIMESTAMP
                )
            """)
            )
            logger.info("Created workspace_athena_suggestions table.")

    if not inspector.has_table("workspace_comments"):
        with engine.begin() as conn:
            conn.execute(
                text("""
                CREATE TABLE workspace_comments (
                    id VARCHAR(16) PRIMARY KEY,
                    workspace_id VARCHAR(16) NOT NULL
                        REFERENCES workspace_documents(id) ON DELETE CASCADE,
                    user_id VARCHAR(16) NOT NULL,
                    anchor_json TEXT NOT NULL,
                    content TEXT NOT NULL,
                    resolved BOOLEAN DEFAULT FALSE,
                    parent_id VARCHAR(16) REFERENCES workspace_comments(id),
                    created_at TIMESTAMP
                )
            """)
            )
            logger.info("Created workspace_comments table.")

    if not inspector.has_table("athena_usage"):
        with engine.begin() as conn:
            conn.execute(
                text("""
                CREATE TABLE athena_usage (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id VARCHAR(16) NOT NULL,
                    workspace_id VARCHAR(16)
                        REFERENCES workspace_documents(id) ON DELETE SET NULL,
                    action VARCHAR(20) NOT NULL,
                    tokens_input INTEGER DEFAULT 0,
                    tokens_output INTEGER DEFAULT 0,
                    created_at TIMESTAMP
                )
            """)
            )
            conn.execute(
                text("CREATE INDEX IF NOT EXISTS ix_athena_usage_user_month ON athena_usage (user_id, created_at)")
            )
            logger.info("Created athena_usage table with index.")

    # ─── cookie_consents (bloque-cookie-consent-banner-v1 Pieza 1) ──────────
    # Tabla probatoria de consentimiento granular de cookies por visitante.
    # ON DELETE SET NULL en user_id: el registro SOBREVIVE al borrar el usuario
    # como evidencia legal (GDPR Art. 17(3)(e)).
    # SQLAlchemy Base.metadata.create_all() ya crea la tabla si no existía.
    # Este bloque actúa como fallback para entornos con create_all manual.
    if not inspector.has_table("cookie_consents"):  # type: ignore[union-attr]
        with engine.begin() as conn:
            conn.execute(
                text("""
                CREATE TABLE cookie_consents (
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
                )
            """)
            )
            conn.execute(
                text("CREATE INDEX IF NOT EXISTS ix_cookie_consents_visitor_uuid ON cookie_consents(visitor_uuid)")
            )
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_cookie_consents_user_id ON cookie_consents(user_id)"))
            conn.execute(
                text("CREATE INDEX IF NOT EXISTS ix_cookie_consents_policy_hash ON cookie_consents(policy_hash)")
            )
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_cookie_consents_visitor_accepted "
                    "ON cookie_consents(visitor_uuid, accepted_at_utc DESC)"
                )
            )
            logger.info("Created cookie_consents table with indexes.")

    # ─── cookie_consents: columna pseudonymized_at_utc (D-08) ────────────
    # Decisión D-07/D-08 Capa 0 bloque-cookie-consent-banner-v1.
    # Registra cuándo el job de pseudonimización a 12 meses nullificó
    # client_ip y user_agent de cada fila.
    #
    # Referencia legal:
    # - GDPR Art. 5(1)(e): limitación del plazo de conservación de datos.
    # - Ley 21.719 Art. 14 vigente 2026-12-01 (Diario Oficial CVE 2583630,
    #   Art. 1° transitorio: día primero del mes vigésimo cuarto posterior
    #   a la publicación 2024-12-13).
    # - URL: https://www.bcn.cl/leychile/navegar?idNorma=1212270
    # - Fecha de verificación: 2026-04-21. Verificador: backend-builder (Tori).
    if inspector.has_table("cookie_consents"):
        existing_cols = {c["name"] for c in inspector.get_columns("cookie_consents")}
        if "pseudonymized_at_utc" not in existing_cols:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE cookie_consents ADD COLUMN pseudonymized_at_utc TIMESTAMP NULL"))
            logger.info("Added pseudonymized_at_utc column to cookie_consents.")

    # ─── document_views (bloque-legal-viewer-v1 D-L5) ───────────────────────
    # Tabla probatoria de apertura de documentos legales por visitante
    # (autenticado o anónimo). Evidencia GDPR Art. 7(1).
    # ON DELETE SET NULL en user_id: el registro SOBREVIVE al borrar el usuario
    # como evidencia legal (GDPR Art. 17(3)(e) + Art. 2515 CC Chile).
    # SQLAlchemy Base.metadata.create_all() ya crea la tabla si no existía.
    # Este bloque actúa como fallback para entornos con create_all manual.
    #
    # Referencia legal:
    # - GDPR Art. 7(1): demostrabilidad del consentimiento.
    # - GDPR Art. 17(3)(e): retención 5 años para defensa de reclamaciones.
    # - Art. 2515 Código Civil Chile: prescripción ordinaria 5 años.
    #   URL: https://www.bcn.cl/leychile/navegar?idNorma=172986
    # - Fecha de verificación: 2026-04-21. Verificador: backend-builder (Tori).
    if not inspector.has_table("document_views"):
        with engine.begin() as conn:
            conn.execute(
                text("""
                CREATE TABLE document_views (
                    id VARCHAR(16) PRIMARY KEY,
                    user_id VARCHAR(16) NULL,
                    session_token VARCHAR(36) NULL,
                    doc_key VARCHAR(40) NOT NULL,
                    doc_version VARCHAR(20) NOT NULL,
                    doc_hash VARCHAR(64) NOT NULL,
                    viewed_at_utc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    scrolled_to_end BOOLEAN NOT NULL DEFAULT FALSE,
                    ip_address VARCHAR(64) NULL,
                    user_agent VARCHAR(512) NULL,
                    retained_until_utc TIMESTAMP NOT NULL,
                    pseudonymized_at_utc TIMESTAMP NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
                )
            """)
            )
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_document_views_user_id ON document_views(user_id)"))
            conn.execute(
                text("CREATE INDEX IF NOT EXISTS idx_document_views_session_token ON document_views(session_token)")
            )
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS idx_document_views_doc_key_version "
                    "ON document_views(doc_key, doc_version)"
                )
            )
            conn.execute(
                text("CREATE INDEX IF NOT EXISTS idx_document_views_user_doc ON document_views(user_id, doc_key)")
            )
            logger.info("Created document_views table with indexes.")

    # ─── Contact Tickets — bloque-contact-tickets-v1 ─────────────────────────
    # Crea las tablas contact_tickets y contact_ticket_messages si no existen.
    # Idempotente: IF NOT EXISTS en todas las sentencias.
    # Referencia legal: GDPR Art. 17(3)(e) + Art. 2515 CC Chile (retención 5 años).
    if not inspector.has_table("contact_tickets"):
        with engine.begin() as conn:
            conn.execute(
                text("""
                CREATE TABLE IF NOT EXISTS contact_tickets (
                    id              VARCHAR(16)  NOT NULL PRIMARY KEY,
                    ticket_number   VARCHAR(20)  NOT NULL UNIQUE,
                    name            VARCHAR(120) NOT NULL,
                    email           VARCHAR(255) NOT NULL,
                    reason          VARCHAR(20)  NOT NULL,
                    org             VARCHAR(120) NULL,
                    message         TEXT         NOT NULL,
                    status          VARCHAR(20)  NOT NULL DEFAULT 'open',
                    assigned_to     VARCHAR(16)  NULL,
                    routed_to_email VARCHAR(255) NOT NULL,
                    routed_label    VARCHAR(80)  NOT NULL,
                    sla_hours       INTEGER      NOT NULL,
                    consent_version VARCHAR(20)  NOT NULL,
                    consent_hash    VARCHAR(64)  NOT NULL,
                    consent_accepted_at_utc TIMESTAMP NOT NULL,
                    client_ip       VARCHAR(64)  NULL,
                    user_agent      VARCHAR(512) NULL,
                    user_timezone   VARCHAR(64)  NULL,
                    first_response_at_utc TIMESTAMP NULL,
                    resolved_at_utc       TIMESTAMP NULL,
                    resolution_note       TEXT     NULL,
                    retained_until_utc    TIMESTAMP NOT NULL,
                    pseudonymized_at_utc  TIMESTAMP NULL,
                    created_at  TIMESTAMP NOT NULL,
                    updated_at  TIMESTAMP NOT NULL
                )
            """)
            )
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_contact_tickets_email ON contact_tickets(email)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_contact_tickets_reason ON contact_tickets(reason)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_contact_tickets_status ON contact_tickets(status)"))
            conn.execute(
                text("CREATE INDEX IF NOT EXISTS ix_contact_tickets_created_at ON contact_tickets(created_at)")
            )
            logger.info("Created contact_tickets table with indexes.")

    if not inspector.has_table("contact_ticket_messages"):
        with engine.begin() as conn:
            conn.execute(
                text("""
                CREATE TABLE IF NOT EXISTS contact_ticket_messages (
                    id              VARCHAR(16)  NOT NULL PRIMARY KEY,
                    ticket_id       VARCHAR(16)  NOT NULL,
                    direction       VARCHAR(10)  NOT NULL,
                    author_user_id  VARCHAR(16)  NULL,
                    author_email    VARCHAR(255) NOT NULL,
                    body            TEXT         NOT NULL,
                    created_at      TIMESTAMP    NOT NULL,
                    email_message_id VARCHAR(255) NULL,
                    FOREIGN KEY (ticket_id) REFERENCES contact_tickets(id) ON DELETE CASCADE
                )
            """)
            )
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_ctm_ticket_direction "
                    "ON contact_ticket_messages(ticket_id, direction)"
                )
            )
            logger.info("Created contact_ticket_messages table with indexes.")

    logger.info("Migrations complete.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate()
    print("Migrations complete.")
