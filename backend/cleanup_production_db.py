"""
cleanup_production_db.py — Limpieza total de datos de prueba
=========================================================
Ejecutar en el shell de Render:
  python cleanup_production_db.py

QUÉ HACE:
  - Conserva SOLO el usuario owner (ceo@conniku.com / role='owner')
  - Elimina todos los demás usuarios y sus datos
  - Elimina posts, mensajes, comunidades, eventos, grupos, etc.
  - Elimina asignaturas (VideoDocuments), sesiones, etc.
  - Deja la plataforma completamente limpia excepto por el perfil del CEO
"""

import sys
from sqlalchemy import text
from database import engine, SessionLocal, User, Base

# ─── Safety check ────────────────────────────────────────────────
def confirm(prompt: str) -> bool:
    resp = input(f"\n{prompt} (escribe 'SI' para confirmar): ").strip()
    return resp == "SI"

print("\n" + "="*60)
print("  LIMPIEZA DE BASE DE DATOS DE PRODUCCIÓN — CONNIKU")
print("="*60)

db = SessionLocal()

# Find owner user
owner = db.query(User).filter(User.role == "owner").first()
if not owner:
    print("ERROR: No se encontró usuario owner. Abortando.")
    sys.exit(1)

print(f"\n✓ Usuario owner encontrado: {owner.email} (ID: {owner.id})")
print(f"  Nombre: {owner.first_name} {owner.last_name}")

other_users = db.query(User).filter(User.id != owner.id).all()
print(f"\n⚠  Se eliminarán {len(other_users)} usuarios:")
for u in other_users[:10]:
    print(f"   - {u.email} ({u.first_name} {u.last_name})")
if len(other_users) > 10:
    print(f"   ... y {len(other_users) - 10} más")

if not confirm("¿Confirmas la eliminación completa de todos los datos de prueba?"):
    print("\nCancelado.")
    sys.exit(0)

print("\nEjecutando limpieza...")

with engine.connect() as conn:
    # Use raw SQL with CASCADE to handle FK constraints efficiently
    # Tables to truncate entirely (no owner-specific data to keep)
    truncate_tables = [
        # Social content
        "community_post_comments",
        "community_post_likes",
        "community_posts",
        "community_members",
        "communities",
        # Wall posts and interactions
        "post_bookmarks",
        "post_shares",
        "post_reactions",
        "post_likes",
        "post_comments",
        "wall_posts",
        # Messages
        "conversation_folder_items",
        "conversation_folders",
        "messages",
        "conversation_participants",
        "conversations",
        # Events
        "event_rsvps",
        "study_events",
        "calendar_events",
        # Study material
        "quiz_history",
        "scheduled_quizzes",
        "flashcard_reviews",
        "study_sessions",
        "study_rooms",
        "study_room_participants",
        "study_plans",
        "shared_documents",
        "document_ratings",
        "video_documents",
        "user_exercise_history",
        "user_course_progress",
        # Social graph
        "skill_endorsements",
        "user_skills",
        "friendships",
        "friend_list_members",
        "friend_lists",
        "blocked_users",
        "user_reports",
        # Notifications
        "in_app_notifications",
        # Polls
        "polls",
        # Misc
        "mood_checkins",
        "class_attendance",
        "user_downloads",
        "user_sessions",
        "league_memberships",
        # Tutoring & jobs
        "tutoring_listing_requests",
        "tutoring_listings",
        "recruiter_profiles",
        # Cross-posts & social media
        "cross_posts",
        "social_media_accounts",
        # Certificates
        "certificates",
        # Moderation
        "moderation_logs",
        # HR data (test data)
        "hr_attendance_records",
        "hr_leave_requests",
        "hr_employee_warnings",
    ]

    for table in truncate_tables:
        try:
            conn.execute(text(f"DELETE FROM {table}"))
            print(f"  ✓ {table}")
        except Exception as e:
            print(f"  ⚠ {table}: {e}")

    # Delete all users except owner
    try:
        conn.execute(
            text("DELETE FROM users WHERE id != :owner_id"),
            {"owner_id": owner.id}
        )
        print(f"  ✓ users (kept owner: {owner.email})")
    except Exception as e:
        print(f"  ⚠ users: {e}")

    # Clean owner's own content (posts, messages) but keep profile
    try:
        conn.execute(text("DELETE FROM wall_posts WHERE user_id = :uid"), {"uid": owner.id})
        conn.execute(text("DELETE FROM in_app_notifications WHERE user_id = :uid"), {"uid": owner.id})
        conn.execute(text("DELETE FROM email_logs"))
        print("  ✓ owner's own posts and notifications cleared")
    except Exception as e:
        print(f"  ⚠ owner content cleanup: {e}")

    conn.commit()

# Verify
remaining_users = db.query(User).count()
print(f"\n✅ Limpieza completada.")
print(f"   Usuarios restantes: {remaining_users}")
remaining_owner = db.query(User).filter(User.role == "owner").first()
if remaining_owner:
    print(f"   Owner: {remaining_owner.email} ✓")

db.close()
print("\nBase de datos lista para uso real.\n")
