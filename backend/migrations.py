"""
Database migrations for StudyHub.
Adds new columns to existing tables. Safe to run multiple times.
"""
import sqlite3
from pathlib import Path

DB_PATH = Path.home() / ".studyhub" / "studyhub.db"


def migrate():
    if not DB_PATH.exists():
        return

    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()

    # New columns on users table
    new_columns = [
        ("theme", "VARCHAR(30) DEFAULT 'nocturno'"),
        ("subscription_status", "VARCHAR(20) DEFAULT 'trial'"),
        ("trial_started_at", "DATETIME"),
        ("subscription_expires_at", "DATETIME"),
        ("stripe_customer_id", "VARCHAR(255)"),
        ("paypal_subscription_id", "VARCHAR(255)"),
        ("reset_code", "VARCHAR(10)"),
        ("reset_code_expires", "DATETIME"),
        # Gamification
        ("xp", "INTEGER DEFAULT 0"),
        ("level", "INTEGER DEFAULT 1"),
        ("streak_days", "INTEGER DEFAULT 0"),
        ("last_active_date", "VARCHAR(10)"),
        ("badges", "TEXT DEFAULT '[]'"),
        # Role
        ("role", "VARCHAR(20) DEFAULT 'user'"),
    ]

    for col_name, col_type in new_columns:
        try:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
        except sqlite3.OperationalError:
            pass  # Column already exists

    conn.commit()
    conn.close()


if __name__ == "__main__":
    migrate()
    print("Migrations complete.")
