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
    university = Column(String(255), default="")
    career = Column(String(255), default="")
    semester = Column(Integer, default=1)
    phone = Column(String(50), default="")
    birth_date = Column(String(20), default="")
    bio = Column(Text, default="")
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
    badges = Column(Text, default="[]")  # JSON array of badge IDs

    # Subscription
    subscription_status = Column(String(20), default="trial")  # trial | active | cancelled | expired
    trial_started_at = Column(DateTime, nullable=True)
    subscription_expires_at = Column(DateTime, nullable=True)
    stripe_customer_id = Column(String(255), nullable=True)
    paypal_subscription_id = Column(String(255), nullable=True)

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
        if not owner:
            import bcrypt
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
                reset_code=None,
                reset_code_expires=None,
            )
            db.add(owner)
            db.commit()
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
