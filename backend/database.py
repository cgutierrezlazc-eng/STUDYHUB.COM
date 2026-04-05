"""
Database models and session management for Conniku.
Uses PostgreSQL in production, SQLite for local development.
"""
import os
import uuid
from datetime import datetime
from pathlib import Path

from sqlalchemy import (
    create_engine, Column, String, Integer, Boolean, DateTime, Text,
    ForeignKey, Float, UniqueConstraint, Index
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DATA_DIR = Path.home() / ".conniku"
DATA_DIR.mkdir(exist_ok=True)
DB_PATH = DATA_DIR / "conniku.db"

# Use PostgreSQL if DATABASE_URL is set (production), otherwise SQLite (local dev)
DATABASE_URL = os.environ.get("DATABASE_URL", "")

if DATABASE_URL:
    # Render uses postgres:// but SQLAlchemy needs postgresql://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True, pool_size=5, max_overflow=10)
    print(f"Using PostgreSQL database")
else:
    engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)
    print(f"Using SQLite database at {DB_PATH}")
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


def gen_id():
    return uuid.uuid4().hex[:16]


# ─── Users ───────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String(16), primary_key=True, default=gen_id)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # null for Google users
    username = Column(String(50), unique=True, nullable=False, index=True)
    user_number = Column(Integer, unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    avatar = Column(Text, nullable=True)
    gender = Column(String(20), default="unspecified")
    language = Column(String(5), default="es")
    language_skill = Column(String(20), default="intermediate")  # beginner, intermediate, advanced
    secondary_languages = Column(Text, default="[]")  # JSON array of up to 3 additional language codes
    platform_language = Column(String(5), default="es")  # Language the platform UI communicates in
    university = Column(String(255), default="")
    career = Column(String(255), default="")
    semester = Column(Integer, default=1)
    phone = Column(String(50), default="")
    country = Column(String(5), default="CL")  # ISO country code
    country_currency = Column(String(5), default="CLP")  # User's local currency
    birth_date = Column(String(20), default="")
    bio = Column(Text, default="")
    is_graduated = Column(Boolean, default=False)
    graduation_year = Column(Integer, nullable=True)
    is_senior_year = Column(Boolean, default=False)  # Last year of studies
    total_semesters = Column(Integer, default=8)  # Total semesters in their program
    academic_status = Column(String(20), default="estudiante")  # estudiante | egresado | titulado
    graduation_status_year = Column(Integer, nullable=True)  # Year of egreso
    title_year = Column(Integer, nullable=True)  # Year of titulo (for titulados)
    # Tutoring preferences (for titulados/egresados)
    offers_mentoring = Column(Boolean, default=False)
    mentoring_services = Column(Text, default="[]")  # JSON: ["ayudantias","clases_particulares"]
    mentoring_subjects = Column(Text, default="[]")  # JSON: subjects they can teach
    mentoring_description = Column(Text, default="")  # What they specifically offer
    mentoring_price_type = Column(String(10), default="free")  # free | paid
    mentoring_price_per_hour = Column(Float, nullable=True)  # Price per hour if paid
    mentoring_currency = Column(String(5), default="CLP")  # Currency for price
    professional_title = Column(String(255), default="")  # e.g. "Ingeniero Civil Industrial"
    provider = Column(String(20), default="email")  # email | google

    email_verified = Column(Boolean, nullable=False, default=False)
    verification_code = Column(String(10), nullable=True)
    is_banned = Column(Boolean, nullable=False, default=False)
    ban_reason = Column(String(500), nullable=True)
    is_admin = Column(Boolean, nullable=False, default=False)
    role = Column(String(20), nullable=False, default="user")  # user | admin | owner
    tos_accepted_at = Column(DateTime, nullable=True)
    onboarding_completed = Column(Boolean, nullable=False, default=False)

    # Theme & preferences
    theme = Column(String(30), default="nocturno")  # calido | profesional | vibrante | nocturno

    # Gamification
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    streak_days = Column(Integer, default=0)
    last_active_date = Column(String(10), nullable=True)  # YYYY-MM-DD
    streak_freeze_count = Column(Integer, default=2)  # free freezes available
    badges = Column(Text, default="[]")  # JSON array of badge IDs

    # Subscription
    subscription_status = Column(String(20), default="trial")  # trial | active | cancelled | expired
    trial_started_at = Column(DateTime, nullable=True)
    subscription_expires_at = Column(DateTime, nullable=True)
    stripe_customer_id = Column(String(255), nullable=True)
    paypal_subscription_id = Column(String(255), nullable=True)

    # Storage tracking
    storage_used_bytes = Column(Float, default=0)  # bytes used by uploaded documents
    storage_limit_bytes = Column(Float, default=524288000)  # 500 MB for basic, 5 GB for PRO

    subscription_tier = Column(String(10), default="free")  # free | pro | max
    referral_code = Column(String(12), unique=True, nullable=True)
    referred_by = Column(String(16), nullable=True)
    referral_count = Column(Integer, default=0)
    weekly_study_goal_hours = Column(Float, default=10.0)
    pomodoro_total_sessions = Column(Integer, default=0)
    pomodoro_total_minutes = Column(Integer, default=0)

    # Password recovery
    reset_code = Column(String(10), nullable=True)
    reset_code_expires = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sent_messages = relationship("Message", back_populates="sender", foreign_keys="Message.sender_id")
    participations = relationship("ConversationParticipant", back_populates="user")
    folders = relationship("ConversationFolder", back_populates="user")
    wall_posts = relationship("WallPost", back_populates="wall_owner", foreign_keys="WallPost.wall_owner_id")


# ─── Conversations & Messaging ──────────────────────────────────

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(16), primary_key=True, default=gen_id)
    type = Column(String(20), nullable=False)  # direct | group_study
    name = Column(String(255), nullable=True)  # null for direct, name for groups
    description = Column(Text, nullable=True)
    avatar = Column(Text, nullable=True)
    created_by = Column(String(16), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    participants = relationship("ConversationParticipant", back_populates="conversation", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])


class ConversationParticipant(Base):
    __tablename__ = "conversation_participants"

    id = Column(String(16), primary_key=True, default=gen_id)
    conversation_id = Column(String(16), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    role = Column(String(20), default="member")  # member | admin
    joined_at = Column(DateTime, default=datetime.utcnow)
    last_read_at = Column(DateTime, nullable=True)

    conversation = relationship("Conversation", back_populates="participants")
    user = relationship("User", back_populates="participations")

    __table_args__ = (
        UniqueConstraint("conversation_id", "user_id", name="uq_conv_user"),
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(String(16), primary_key=True, default=gen_id)
    conversation_id = Column(String(16), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(String(20), default="text")  # text | document | system
    document_name = Column(String(255), nullable=True)
    document_path = Column(Text, nullable=True)
    is_deleted = Column(Boolean, default=False)
    is_flagged = Column(Boolean, default=False)
    flag_reason = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    edited_at = Column(DateTime, nullable=True)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", back_populates="sent_messages", foreign_keys=[sender_id])


class ConversationFolder(Base):
    __tablename__ = "conversation_folders"

    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="folders")
    items = relationship("ConversationFolderItem", back_populates="folder", cascade="all, delete-orphan")


class ConversationFolderItem(Base):
    __tablename__ = "conversation_folder_items"

    id = Column(String(16), primary_key=True, default=gen_id)
    folder_id = Column(String(16), ForeignKey("conversation_folders.id", ondelete="CASCADE"), nullable=False)
    conversation_id = Column(String(16), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)

    folder = relationship("ConversationFolder", back_populates="items")

    __table_args__ = (
        UniqueConstraint("folder_id", "conversation_id", name="uq_folder_conv"),
    )


# ─── Content Moderation Log ─────────────────────────────────────

class ModerationLog(Base):
    __tablename__ = "moderation_logs"

    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    message_id = Column(String(16), ForeignKey("messages.id"), nullable=True)
    action = Column(String(50), nullable=False)  # warning | ban | unban | delete_message
    reason = Column(Text, nullable=True)
    admin_id = Column(String(16), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─── Friendships / Social ──────────────────────────────────────

class Friendship(Base):
    __tablename__ = "friendships"

    id = Column(String(16), primary_key=True, default=gen_id)
    requester_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    addressee_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String(20), default="pending")  # pending | accepted | rejected | blocked
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    requester = relationship("User", foreign_keys=[requester_id])
    addressee = relationship("User", foreign_keys=[addressee_id])

    __table_args__ = (
        UniqueConstraint("requester_id", "addressee_id", name="uq_friendship"),
    )


class WallPost(Base):
    __tablename__ = "wall_posts"

    id = Column(String(16), primary_key=True, default=gen_id)
    author_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    wall_owner_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    image_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    author = relationship("User", foreign_keys=[author_id])
    wall_owner = relationship("User", back_populates="wall_posts", foreign_keys=[wall_owner_id])
    likes = relationship("PostLike", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("PostComment", back_populates="post", cascade="all, delete-orphan")


class PostLike(Base):
    __tablename__ = "post_likes"

    id = Column(String(16), primary_key=True, default=gen_id)
    post_id = Column(String(16), ForeignKey("wall_posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("WallPost", back_populates="likes")
    user = relationship("User")

    __table_args__ = (
        UniqueConstraint("post_id", "user_id", name="uq_post_like"),
    )


class PostReaction(Base):
    __tablename__ = "post_reactions"
    id = Column(String(16), primary_key=True, default=gen_id)
    post_id = Column(String(16), ForeignKey("wall_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    reaction_type = Column(String(20), default="like")
    created_at = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint("post_id", "user_id", name="uq_post_reaction"),)


class PostComment(Base):
    __tablename__ = "post_comments"

    id = Column(String(16), primary_key=True, default=gen_id)
    post_id = Column(String(16), ForeignKey("wall_posts.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("WallPost", back_populates="comments")
    author = relationship("User")


# ─── Blocked Users ────────────────────────────────────────

class BlockedUser(Base):
    __tablename__ = "blocked_users"

    id = Column(String(16), primary_key=True, default=gen_id)
    blocker_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    blocked_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    blocker = relationship("User", foreign_keys=[blocker_id])
    blocked = relationship("User", foreign_keys=[blocked_id])

    __table_args__ = (
        UniqueConstraint("blocker_id", "blocked_id", name="uq_blocked_user"),
    )


class UserReport(Base):
    __tablename__ = "user_reports"

    id = Column(String(16), primary_key=True, default=gen_id)
    reporter_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    reported_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    reason = Column(Text, nullable=False)
    status = Column(String(20), default="pending")  # pending | reviewed | dismissed
    created_at = Column(DateTime, default=datetime.utcnow)

    reporter = relationship("User", foreign_keys=[reporter_id])
    reported = relationship("User", foreign_keys=[reported_id])


# ─── Video Documents ───────────────────────────────────────────

class VideoDocument(Base):
    __tablename__ = "video_documents"

    id = Column(String(16), primary_key=True, default=gen_id)
    project_id = Column(String(255), nullable=False, index=True)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    source_type = Column(String(20), nullable=False)  # youtube | file
    source_url = Column(Text, nullable=True)
    title = Column(String(500), default="")
    transcription = Column(Text, nullable=True)
    status = Column(String(20), default="pending")  # pending | processing | done | error
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


# ─── Payment Logs ──────────────────────────────────────────────

class PaymentLog(Base):
    __tablename__ = "payment_logs"

    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    provider = Column(String(20), nullable=False)  # stripe | paypal
    transaction_id = Column(String(255), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    status = Column(String(20), default="completed")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


# ─── Study Sessions (time tracking) ────────────────────────────

class StudySession(Base):
    __tablename__ = "study_sessions"
    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    project_id = Column(String(255), nullable=True)
    duration_seconds = Column(Integer, default=0)
    activity_type = Column(String(30), default="study")  # study | quiz | flashcards | chat | guide
    created_at = Column(DateTime, default=datetime.utcnow)


# ─── Shared Documents (marketplace) ────────────────────────────

class SharedDocument(Base):
    __tablename__ = "shared_documents"
    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, default="")
    file_path = Column(Text, nullable=False)
    file_type = Column(String(20), default="pdf")
    university = Column(String(255), default="")
    career = Column(String(255), default="")
    course_name = Column(String(255), default="")
    downloads = Column(Integer, default=0)
    rating_sum = Column(Float, default=0)
    rating_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    author = relationship("User", foreign_keys=[user_id])


class DocumentRating(Base):
    __tablename__ = "document_ratings"
    id = Column(String(16), primary_key=True, default=gen_id)
    document_id = Column(String(16), ForeignKey("shared_documents.id"), nullable=False)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    created_at = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint("document_id", "user_id"),)


# ─── Calendar Events / Tasks ───────────────────────────────────

class CalendarEvent(Base):
    __tablename__ = "calendar_events"
    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    project_id = Column(String(255), nullable=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, default="")
    event_type = Column(String(30), default="task")  # task | exam | deadline | study_session
    due_date = Column(DateTime, nullable=False)
    completed = Column(Boolean, default=False)
    color = Column(String(20), default="#4f8cff")
    created_at = Column(DateTime, default=datetime.utcnow)


# ─── Leagues ───────────────────────────────────────────────────

class LeagueMembership(Base):
    __tablename__ = "league_memberships"
    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    league_tier = Column(String(20), default="bronce")  # bronce | plata | oro | diamante
    weekly_xp = Column(Integer, default=0)
    week_start = Column(String(10), nullable=False)  # YYYY-MM-DD (Monday)
    created_at = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint("user_id", "week_start"),)


# ─── In-App Notifications ──────────────────────────────────

class InAppNotification(Base):
    __tablename__ = "in_app_notifications"
    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(30), nullable=False)
    title = Column(String(255), nullable=False)
    body = Column(Text, default="")
    link = Column(String(255), default="")
    actor_id = Column(String(16), ForeignKey("users.id"), nullable=True)
    reference_id = Column(String(16), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─── Communities ────────────────────────────────────────────

class Community(Base):
    __tablename__ = "communities"
    id = Column(String(16), primary_key=True, default=gen_id)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    avatar = Column(Text, nullable=True)
    cover_image = Column(Text, nullable=True)
    type = Column(String(20), default="public")  # public, private
    category = Column(String(50), default="general")  # materia, carrera, hobby, estudio, universidad
    university = Column(String(255), default="")
    rules = Column(Text, default="")
    created_by = Column(String(16), ForeignKey("users.id"), nullable=False)
    member_count = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class CommunityMember(Base):
    __tablename__ = "community_members"
    id = Column(String(16), primary_key=True, default=gen_id)
    community_id = Column(String(16), ForeignKey("communities.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String(20), default="member")  # admin, moderator, member
    joined_at = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint("community_id", "user_id", name="uq_community_member"),)

class CommunityPost(Base):
    __tablename__ = "community_posts"
    id = Column(String(16), primary_key=True, default=gen_id)
    community_id = Column(String(16), ForeignKey("communities.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(Text, nullable=True)
    is_pinned = Column(Boolean, default=False)
    like_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class CommunityPostLike(Base):
    __tablename__ = "community_post_likes"
    id = Column(String(16), primary_key=True, default=gen_id)
    post_id = Column(String(16), ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    reaction_type = Column(String(20), default="like")
    created_at = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint("post_id", "user_id", name="uq_community_post_like"),)

class CommunityPostComment(Base):
    __tablename__ = "community_post_comments"
    id = Column(String(16), primary_key=True, default=gen_id)
    post_id = Column(String(16), ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─── Polls / Encuestas ─────────────────────────────────────

class Poll(Base):
    __tablename__ = "polls"
    id = Column(String(16), primary_key=True, default=gen_id)
    author_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    wall_post_id = Column(String(16), nullable=True)
    community_post_id = Column(String(16), nullable=True)
    question = Column(String(500), nullable=False)
    expires_at = Column(DateTime, nullable=True)
    is_anonymous = Column(Boolean, default=False)
    total_votes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class PollOption(Base):
    __tablename__ = "poll_options"
    id = Column(String(16), primary_key=True, default=gen_id)
    poll_id = Column(String(16), ForeignKey("polls.id", ondelete="CASCADE"), nullable=False)
    text = Column(String(255), nullable=False)
    position = Column(Integer, default=0)
    vote_count = Column(Integer, default=0)

class PollVote(Base):
    __tablename__ = "poll_votes"
    id = Column(String(16), primary_key=True, default=gen_id)
    poll_id = Column(String(16), ForeignKey("polls.id", ondelete="CASCADE"), nullable=False)
    option_id = Column(String(16), ForeignKey("poll_options.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint("poll_id", "user_id", name="uq_poll_vote"),)


# ─── Hashtags ──────────────────────────────────────────────

class Hashtag(Base):
    __tablename__ = "hashtags"
    id = Column(String(16), primary_key=True, default=gen_id)
    tag = Column(String(100), unique=True, nullable=False, index=True)
    usage_count = Column(Integer, default=0)
    last_used_at = Column(DateTime, default=datetime.utcnow)

class PostHashtag(Base):
    __tablename__ = "post_hashtags"
    id = Column(String(16), primary_key=True, default=gen_id)
    post_id = Column(String(16), nullable=False, index=True)
    post_type = Column(String(20), default="wall")
    hashtag_id = Column(String(16), ForeignKey("hashtags.id"), nullable=False)


# ─── Academic Milestones ────────────────────────────────────

class AcademicMilestone(Base):
    __tablename__ = "academic_milestones"
    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    milestone_type = Column(String(30), nullable=False)  # new_subject, new_semester, new_year, preparing_thesis, graduated, licensed
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    auto_posted = Column(Boolean, default=False)  # Whether it was shared to wall
    wall_post_id = Column(String(16), nullable=True)  # Link to wall post if shared
    created_at = Column(DateTime, default=datetime.utcnow)


# ─── Job Board / Bolsa de Empleo ────────────────────────────

class JobListing(Base):
    __tablename__ = "job_listings"
    id = Column(String(16), primary_key=True, default=gen_id)
    posted_by = Column(String(16), ForeignKey("users.id"), nullable=False)
    company_name = Column(String(255), nullable=False)
    company_logo = Column(Text, nullable=True)
    job_title = Column(String(255), nullable=False)
    job_type = Column(String(30), default="full_time")  # full_time, part_time, internship, freelance, remote, hybrid
    location = Column(String(255), default="")
    is_remote = Column(Boolean, default=False)
    salary_min = Column(Float, nullable=True)
    salary_max = Column(Float, nullable=True)
    salary_currency = Column(String(10), default="USD")
    description = Column(Text, nullable=False)
    requirements = Column(Text, default="")  # What they need
    benefits = Column(Text, default="")  # What they offer
    career_field = Column(String(255), default="")  # Related career/industry
    experience_level = Column(String(30), default="entry")  # entry, mid, senior, any
    education_level = Column(String(30), default="any")  # any, bachelor, master, phd
    application_deadline = Column(DateTime, nullable=True)
    contact_email = Column(String(255), default="")
    external_url = Column(String(500), default="")  # External application link
    is_active = Column(Boolean, default=True)
    view_count = Column(Integer, default=0)
    application_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class JobApplication(Base):
    __tablename__ = "job_applications"
    id = Column(String(16), primary_key=True, default=gen_id)
    job_id = Column(String(16), ForeignKey("job_listings.id", ondelete="CASCADE"), nullable=False, index=True)
    applicant_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    resume_url = Column(Text, nullable=True)  # Base64 or URL
    cover_letter = Column(Text, default="")
    status = Column(String(20), default="pending")  # pending, reviewed, interview, accepted, rejected
    notes = Column(Text, default="")  # Employer notes
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint("job_id", "applicant_id", name="uq_job_application"),)


class UserCareerStatus(Base):
    __tablename__ = "user_career_status"
    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False, unique=True)
    status = Column(String(30), default="studying")  # studying, preparing_thesis, graduated, licensed
    is_open_to_opportunities = Column(Boolean, default=False)  # "Explorando Oportunidades"
    resume_url = Column(Text, nullable=True)
    headline = Column(String(255), default="")  # "Ingeniero en Sistemas | Buscando primera experiencia"
    preferred_job_types = Column(Text, default="[]")  # JSON array
    preferred_locations = Column(Text, default="[]")  # JSON array
    updated_at = Column(DateTime, default=datetime.utcnow)


# ─── Student CV / Professional Profile ─────────────────────

class StudentCV(Base):
    __tablename__ = "student_cvs"
    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False, unique=True)
    headline = Column(String(255), default="")  # "Estudiante de Ing. en Sistemas | Apasionado por IA"
    about_me = Column(Text, default="")  # 2-4 sentences personal story
    skills = Column(Text, default="[]")  # JSON array of skills
    tools = Column(Text, default="[]")  # JSON array of tools/technologies
    languages_spoken = Column(Text, default="[]")  # JSON array: [{language, level}]
    experience = Column(Text, default="[]")  # JSON array: [{title, company, dates, description}]
    projects_portfolio = Column(Text, default="[]")  # JSON: [{title, role, description, tools, link, impact}]
    volunteering = Column(Text, default="[]")  # JSON: [{org, role, dates, description}]
    interests = Column(Text, default="[]")  # JSON array of interests
    testimonials = Column(Text, default="[]")  # JSON: [{name, role, text}]
    visibility = Column(String(20), default="public")  # public, friends, recruiters_only, private
    updated_at = Column(DateTime, default=datetime.utcnow)


# ─── Courses / Desarrollo Integral ─────────────────────────

class Course(Base):
    __tablename__ = "courses"
    id = Column(String(16), primary_key=True, default=gen_id)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    category = Column(String(50), default="soft_skills")  # soft_skills, leadership, emotional, productivity, ethics, career, communication, thinking
    emoji = Column(String(10), default="📚")
    difficulty = Column(String(20), default="beginner")  # beginner, intermediate
    estimated_minutes = Column(Integer, default=30)
    lesson_count = Column(Integer, default=5)
    is_featured = Column(Boolean, default=False)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class CourseLesson(Base):
    __tablename__ = "course_lessons"
    id = Column(String(16), primary_key=True, default=gen_id)
    course_id = Column(String(16), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, default="")  # HTML content generated by AI
    order_index = Column(Integer, default=0)
    estimated_minutes = Column(Integer, default=5)


class CourseQuiz(Base):
    __tablename__ = "course_quizzes"
    id = Column(String(16), primary_key=True, default=gen_id)
    course_id = Column(String(16), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    questions = Column(Text, default="[]")  # JSON: [{question, options[], correctAnswer, explanation}]


# ─── Tutoring Requests ──────────────────────────────────────

class TutoringRequest(Base):
    __tablename__ = "tutoring_requests"
    id = Column(String(16), primary_key=True, default=gen_id)
    student_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    tutor_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    subject = Column(String(255), nullable=False)
    message = Column(Text, default="")
    status = Column(String(20), default="pending")  # pending | accepted | rejected | completed
    created_at = Column(DateTime, default=datetime.utcnow)
    responded_at = Column(DateTime, nullable=True)


class UserCourseProgress(Base):
    __tablename__ = "user_course_progress"
    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    course_id = Column(String(16), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    completed_lessons = Column(Text, default="[]")  # JSON array of lesson IDs
    quiz_score = Column(Integer, nullable=True)  # Score out of 100
    quiz_passed = Column(Boolean, default=False)
    completed = Column(Boolean, default=False)
    certificate_id = Column(String(16), nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    __table_args__ = (UniqueConstraint("user_id", "course_id", name="uq_user_course"),)


# ─── Recruiter Profiles ────────────────────────────────────

class RecruiterProfile(Base):
    __tablename__ = "recruiter_profiles"
    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False, unique=True)
    company_name = Column(String(255), nullable=False)
    company_logo = Column(Text, nullable=True)
    company_website = Column(String(500), default="")
    company_size = Column(String(30), default="")  # 1-10, 11-50, 51-200, 201-500, 500+
    industry = Column(String(255), default="")
    tax_id = Column(String(100), default="")  # RUC/NIT/CIF
    corporate_email = Column(String(255), default="")
    recruiter_title = Column(String(255), default="")  # "HR Manager", "Talent Acquisition"
    phone = Column(String(50), default="")
    country = Column(String(100), default="")
    city = Column(String(100), default="")
    company_description = Column(Text, default="")
    linkedin_url = Column(String(500), default="")
    verification_status = Column(String(20), default="pending")  # pending, verified, rejected
    verification_document = Column(Text, nullable=True)  # Uploaded document
    verified_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─── Tutoring Listings ─────────────────────────────────────

class TutoringListing(Base):
    __tablename__ = "tutoring_listings"
    id = Column(String(16), primary_key=True, default=gen_id)
    tutor_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    subject = Column(String(255), nullable=False)
    category = Column(String(100), default="")  # Ciencias, Humanidades, Tecnología, Idiomas, etc.
    level = Column(String(30), default="university")  # basic, intermediate, advanced, university
    modality = Column(String(20), default="online")  # online, presencial, hybrid
    price_per_hour = Column(Float, nullable=True)
    currency = Column(String(10), default="USD")
    is_free = Column(Boolean, default=False)  # Free trial or always free
    free_trial = Column(Boolean, default=False)
    session_duration = Column(Integer, default=60)  # minutes: 30, 45, 60, 90
    language = Column(String(50), default="es")
    description = Column(Text, default="")  # Methodology, what students will learn
    experience_years = Column(Integer, default=0)
    availability = Column(Text, default="[]")  # JSON: ["Lunes 10-12", "Miércoles 14-16"]
    location = Column(String(255), default="")  # For presencial
    tags = Column(Text, default="[]")  # JSON: ["Cálculo", "Álgebra Lineal", "Parcial 2"]
    max_students = Column(Integer, default=1)  # 1 = individual, >1 = group
    rating_sum = Column(Float, default=0)
    rating_count = Column(Integer, default=0)
    total_sessions = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class TutoringRequest(Base):
    __tablename__ = "tutoring_requests"
    id = Column(String(16), primary_key=True, default=gen_id)
    listing_id = Column(String(16), ForeignKey("tutoring_listings.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    tutor_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    message = Column(Text, default="")  # Student's message to tutor
    status = Column(String(20), default="pending")  # pending, accepted, rejected, completed
    scheduled_at = Column(DateTime, nullable=True)
    rating = Column(Integer, nullable=True)  # 1-5 from student
    review = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint("listing_id", "student_id", name="uq_tutoring_request"),)


# ─── Study Events ──────────────────────────────────────────

class StudyEvent(Base):
    __tablename__ = "study_events"
    id = Column(String(16), primary_key=True, default=gen_id)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    organizer_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    community_id = Column(String(16), nullable=True)
    event_type = Column(String(30), default="study_session")  # study_session, exam_prep, tutoring, social
    location = Column(String(255), default="")
    meeting_link = Column(String(500), default="")
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    max_attendees = Column(Integer, nullable=True)
    cover_image = Column(Text, nullable=True)
    attendee_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class EventRSVP(Base):
    __tablename__ = "event_rsvps"
    id = Column(String(16), primary_key=True, default=gen_id)
    event_id = Column(String(16), ForeignKey("study_events.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="going")  # going, maybe, not_going
    created_at = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint("event_id", "user_id", name="uq_event_rsvp"),)


# ─── Skills & Endorsements ─────────────────────────────────

class UserSkill(Base):
    __tablename__ = "user_skills"
    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    skill_name = Column(String(100), nullable=False)
    endorsement_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint("user_id", "skill_name", name="uq_user_skill"),)

class SkillEndorsement(Base):
    __tablename__ = "skill_endorsements"
    id = Column(String(16), primary_key=True, default=gen_id)
    skill_id = Column(String(16), ForeignKey("user_skills.id", ondelete="CASCADE"), nullable=False)
    endorser_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint("skill_id", "endorser_id", name="uq_skill_endorsement"),)


# ─── Post Bookmarks ───────────────────────────────────────

class PostBookmark(Base):
    __tablename__ = "post_bookmarks"
    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    post_id = Column(String(16), nullable=False)
    post_type = Column(String(20), default="wall")  # wall, community
    created_at = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint("user_id", "post_id", name="uq_post_bookmark"),)


# ─── Mentorship ────────────────────────────────────────────

class MentorProfile(Base):
    __tablename__ = "mentor_profiles"
    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False, unique=True)
    is_active = Column(Boolean, default=True)
    subjects = Column(Text, default="[]")  # JSON array
    availability = Column(String(255), default="")
    bio = Column(Text, default="")
    max_mentees = Column(Integer, default=3)
    current_mentees = Column(Integer, default=0)
    rating_sum = Column(Float, default=0)
    rating_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class MentorshipRelation(Base):
    __tablename__ = "mentorship_relations"
    id = Column(String(16), primary_key=True, default=gen_id)
    mentor_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    mentee_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="pending")  # pending, active, completed, cancelled
    subject = Column(String(255), default="")
    message = Column(Text, default="")
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    mentee_rating = Column(Integer, nullable=True)
    mentee_review = Column(Text, nullable=True)


# ─── Post Shares ───────────────────────────────────────────

class PostShare(Base):
    __tablename__ = "post_shares"
    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    original_post_id = Column(String(16), ForeignKey("wall_posts.id"), nullable=False)
    comment = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


# ─── Study Plans ───────────────────────────────────────────

class StudyPlan(Base):
    __tablename__ = "study_plans"
    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    project_id = Column(String(255), nullable=True)
    title = Column(String(255), default="Plan de Estudio")
    weak_topics = Column(Text, default="[]")  # JSON: identified weak areas
    strong_topics = Column(Text, default="[]")  # JSON: strong areas
    recommendations = Column(Text, default="")  # AI-generated study recommendations
    daily_goals = Column(Text, default="[]")  # JSON: [{day, tasks[], completed}]
    overall_score = Column(Integer, default=0)  # 0-100 knowledge level
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


# ─── Study Rooms ───────────────────────────────────────────

class StudyRoom(Base):
    __tablename__ = "study_rooms"
    id = Column(String(16), primary_key=True, default=gen_id)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    host_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    room_type = Column(String(20), default="focus")  # focus, pomodoro, free
    max_participants = Column(Integer, default=10)
    current_participants = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    pomodoro_work_min = Column(Integer, default=25)
    pomodoro_break_min = Column(Integer, default=5)
    subject = Column(String(255), default="")
    meeting_url = Column(String(500), default="")  # External video link or Jitsi room ID
    created_at = Column(DateTime, default=datetime.utcnow)


class StudyRoomParticipant(Base):
    __tablename__ = "study_room_participants"
    id = Column(String(16), primary_key=True, default=gen_id)
    room_id = Column(String(16), ForeignKey("study_rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    left_at = Column(DateTime, nullable=True)
    study_minutes = Column(Integer, default=0)
    __table_args__ = (UniqueConstraint("room_id", "user_id", name="uq_room_participant"),)


# ─── Quiz History & Scheduled Quizzes ──────────────────────

class QuizHistory(Base):
    __tablename__ = "quiz_history"
    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    project_id = Column(String(255), nullable=False, index=True)
    quiz_type = Column(String(20), default="practice")  # diagnostic, scheduled, practice
    quiz_number = Column(Integer, nullable=True)  # 0=diagnostic, 1-4=scheduled
    score_1_to_10 = Column(Float, default=0)
    score_percentage = Column(Integer, default=0)
    topics_scores = Column(Text, default="{}")  # JSON: {"tema": score}
    questions_count = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class ScheduledQuiz(Base):
    __tablename__ = "scheduled_quizzes"
    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    project_id = Column(String(255), nullable=False, index=True)
    quiz_number = Column(Integer, nullable=False)  # 1-4
    scheduled_date = Column(DateTime, nullable=False)
    status = Column(String(20), default="pending")  # pending, available, completed, overdue
    notified = Column(Boolean, default=False)
    notified_reminder = Column(Boolean, default=False)
    calendar_event_id = Column(String(16), nullable=True)
    quiz_history_id = Column(String(16), nullable=True)  # Link to completed quiz
    created_at = Column(DateTime, default=datetime.utcnow)


class FlashcardReview(Base):
    __tablename__ = "flashcard_reviews"
    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    project_id = Column(String(255), nullable=False)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    ease_factor = Column(Float, default=2.5)
    interval_days = Column(Integer, default=1)
    repetitions = Column(Integer, default=0)
    quality = Column(Integer, default=0)
    next_review = Column(DateTime, nullable=False)
    last_reviewed = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class MoodCheckIn(Base):
    __tablename__ = "mood_checkins"
    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    mood = Column(Integer, nullable=False)  # 1-5
    energy = Column(Integer, default=3)  # 1-5
    note = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─── Class Attendance ──────────────────────────────────────

class ClassAttendance(Base):
    __tablename__ = "class_attendance"
    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    project_id = Column(String(255), nullable=False)
    class_title = Column(String(255), default="")
    attended_at = Column(DateTime, default=datetime.utcnow)
    duration_minutes = Column(Integer, default=0)
    recorded = Column(Boolean, default=False)
    transcribed = Column(Boolean, default=False)


# ─── User Downloads (cloud storage) ───────────────────────

class UserDownload(Base):
    __tablename__ = "user_downloads"
    id = Column(String(16), primary_key=True, default=gen_id)
    user_id = Column(String(16), ForeignKey("users.id"), nullable=False, index=True)
    filename = Column(String(500), nullable=False)
    file_path = Column(Text, nullable=False)
    file_size = Column(Integer, default=0)  # bytes
    source_url = Column(Text, default="")  # original URL
    mime_type = Column(String(100), default="")
    created_at = Column(DateTime, default=datetime.utcnow)


# ─── Init ────────────────────────────────────────────────────────

def init_db():
    Base.metadata.create_all(engine)
    # Create owner account if not exists and OWNER_PASSWORD env var is set
    owner_password = os.environ.get("OWNER_PASSWORD")
    if not owner_password:
        return  # Skip owner creation if no password configured

    db = SessionLocal()
    try:
        owner = db.query(User).filter(User.email == "ceo@conniku.com").first()
        import bcrypt
        if not owner:
            from sqlalchemy import func
            max_num = db.query(func.max(User.user_number)).scalar() or 0
            owner = User(
                id=gen_id(),
                email="ceo@conniku.com",
                password_hash=bcrypt.hashpw(owner_password.encode(), bcrypt.gensalt()).decode(),
                username="owner",
                user_number=max_num + 1,
                first_name="Conniku",
                last_name="CEO",
                avatar=None,
                gender="unspecified",
                language="es",
                language_skill="advanced",
                university="Conniku Corp",
                career="CEO & Founder",
                semester=1,
                phone="",
                birth_date="",
                bio="Fundador de Conniku",
                provider="email",
                email_verified=True,
                verification_code=None,
                is_banned=False,
                ban_reason=None,
                is_admin=True,
                role="owner",
                tos_accepted_at=datetime.utcnow(),
                onboarding_completed=True,
                theme="nocturno",
                xp=0,
                level=1,
                streak_days=0,
                last_active_date=None,
                badges="[]",
                subscription_status="owner",
                trial_started_at=datetime.utcnow(),
                subscription_expires_at=None,
                stripe_customer_id=None,
                paypal_subscription_id=None,
                storage_used_bytes=0,
                storage_limit_bytes=1099511627776,  # 1 TB for owner
                reset_code=None,
                reset_code_expires=None,
            )
            db.add(owner)
            db.commit()
            print("Owner account created: ceo@conniku.com")
        else:
            # Update existing owner password to match OWNER_PASSWORD env var
            new_hash = bcrypt.hashpw(owner_password.encode(), bcrypt.gensalt()).decode()
            owner.password_hash = new_hash
            owner.is_admin = True
            owner.role = "owner"
            owner.email_verified = True
            owner.subscription_status = "owner"
            db.commit()
            print("Owner account password updated: ceo@conniku.com")
    except Exception as e:
        db.rollback()
        print(f"Owner creation: {e}")
    finally:
        db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Auto-init on import
init_db()
