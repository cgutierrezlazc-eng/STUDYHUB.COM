"""
Database migrations for Conniku.
Adds new columns to existing tables. Safe to run multiple times.
Uses SQLAlchemy so it works with both PostgreSQL and SQLite.
"""
import os
import logging
from sqlalchemy import text, inspect

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
        # Ghost / invisible profile (CEO only — not visible to other users)
        ("is_ghost", "BOOLEAN DEFAULT FALSE"),
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
                    conn.execute(text(
                        f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"
                    ))
                    logger.info(f"Added column users.{col_name}")
                except Exception as e:
                    # Column might already exist (race condition) - safe to ignore
                    logger.debug(f"Column users.{col_name} skipped: {e}")

    # Create tutoring_requests table if it doesn't exist (new mentoring system)
    if not inspector.has_table("tutoring_requests"):
        with engine.begin() as conn:
            conn.execute(text("""
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
            """))
            logger.info("Created tutoring_requests table.")

    # Create tutoring_listing_requests table if it doesn't exist (job listings system)
    if not inspector.has_table("tutoring_listing_requests"):
        with engine.begin() as conn:
            conn.execute(text("""
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
            """))
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
                        conn.execute(text(
                            f"ALTER TABLE wall_posts ADD COLUMN {col_name} {col_type}"
                        ))
                        logger.info(f"Added column wall_posts.{col_name}")
                    except Exception as e:
                        logger.debug(f"Column wall_posts.{col_name} skipped: {e}")

    # Create friend_lists table
    if not inspector.has_table("friend_lists"):
        with engine.begin() as conn:
            conn.execute(text("""
                CREATE TABLE friend_lists (
                    id VARCHAR(16) PRIMARY KEY,
                    user_id VARCHAR(16) NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    created_at TIMESTAMP
                )
            """))
            logger.info("Created friend_lists table.")

    # Create friend_list_members table
    if not inspector.has_table("friend_list_members"):
        with engine.begin() as conn:
            conn.execute(text("""
                CREATE TABLE friend_list_members (
                    id VARCHAR(16) PRIMARY KEY,
                    list_id VARCHAR(16) NOT NULL,
                    friend_id VARCHAR(16) NOT NULL,
                    UNIQUE(list_id, friend_id)
                )
            """))
            logger.info("Created friend_list_members table.")

    # Add moderation_status to messages table
    if inspector.has_table("messages"):
        existing_msg_columns = {col["name"] for col in inspector.get_columns("messages")}
        if "moderation_status" not in existing_msg_columns:
            with engine.begin() as conn:
                try:
                    conn.execute(text(
                        "ALTER TABLE messages ADD COLUMN moderation_status VARCHAR(20) DEFAULT 'approved'"
                    ))
                    logger.info("Added column messages.moderation_status")
                except Exception as e:
                    logger.debug(f"Column messages.moderation_status skipped: {e}")

    # Add is_announcement to community_posts table
    if inspector.has_table("community_posts"):
        existing_cp_columns = {col["name"] for col in inspector.get_columns("community_posts")}
        if "is_announcement" not in existing_cp_columns:
            with engine.begin() as conn:
                try:
                    conn.execute(text(
                        "ALTER TABLE community_posts ADD COLUMN is_announcement BOOLEAN DEFAULT FALSE"
                    ))
                    logger.info("Added column community_posts.is_announcement")
                except Exception as e:
                    logger.debug(f"Column community_posts.is_announcement skipped: {e}")

    # Create moderation_queue table if it doesn't exist
    if not inspector.has_table("moderation_queue"):
        with engine.begin() as conn:
            conn.execute(text("""
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
            """))
            logger.info("Created moderation_queue table.")

    # ─── Set CEO as ghost (invisible profile) ────────────────────
    try:
        import json
        from pathlib import Path
        config_file = Path(os.environ.get("DATA_DIR", "/data")) / "config.json"
        admin_email = ""
        if config_file.exists():
            try:
                admin_email = json.loads(config_file.read_text()).get("admin_email", "").lower()
            except Exception:
                pass
        if not admin_email:
            admin_email = os.environ.get("ADMIN_EMAIL", "").lower()
        if admin_email:
            with engine.begin() as conn:
                conn.execute(text(
                    "UPDATE users SET is_ghost = TRUE WHERE email = :email"
                ), {"email": admin_email})
                logger.info(f"CEO ghost flag set for {admin_email}")
    except Exception as e:
        logger.warning(f"Could not set CEO ghost flag: {e}")

    # Create blog_threads table if it doesn't exist
    if not inspector.has_table("blog_threads"):
        with engine.begin() as conn:
            conn.execute(text("""
                CREATE TABLE blog_threads (
                    id VARCHAR(16) PRIMARY KEY,
                    user_id VARCHAR(16) NOT NULL,
                    content TEXT NOT NULL,
                    likes INTEGER DEFAULT 0,
                    created_at TIMESTAMP
                )
            """))
            logger.info("Created blog_threads table.")

    logger.info("Migrations complete.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate()
    print("Migrations complete.")
