"""
Social routes: friendships, wall posts, likes, comments, public profiles.
"""
import json
from datetime import UTC, datetime
from typing import List, Optional

from database import (
    BlockedUser,
    FriendList,
    FriendListMember,
    Friendship,
    PostComment,
    PostLike,
    PostReaction,
    User,
    UserReport,
    WallPost,
    gen_id,
    get_db,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from middleware import get_current_user
from notification_routes import create_notification
from pydantic import BaseModel
from sqlalchemy import and_, desc, func, or_
from sqlalchemy.orm import Session

try:
    from notifications import (
        notify_comment,
        notify_friend_accepted,
        notify_friend_request,
        notify_mention,
        notify_wall_post,
    )
except ImportError:
    notify_friend_request = notify_friend_accepted = notify_wall_post = notify_mention = notify_comment = None

router = APIRouter(prefix="/social", tags=["social"])

import contextlib
import re


def extract_hashtags(content: str) -> list[str]:
    return [tag.lower() for tag in re.findall(r'#(\w+)', content)]

def extract_mentions(content: str) -> list[str]:
    return re.findall(r'@(\w+)', content)

def process_hashtags(db, content: str, post_id: str, post_type: str = "wall"):
    from database import Hashtag, PostHashtag
    tags = extract_hashtags(content)
    for tag_text in tags:
        hashtag = db.query(Hashtag).filter(Hashtag.tag == tag_text).first()
        if not hashtag:
            hashtag = Hashtag(id=gen_id(), tag=tag_text, usage_count=0)
            db.add(hashtag)
        hashtag.usage_count = (hashtag.usage_count or 0) + 1
        hashtag.last_used_at = datetime.utcnow()
        link = PostHashtag(id=gen_id(), post_id=post_id, post_type=post_type, hashtag_id=hashtag.id)
        db.add(link)

def process_mentions(db, content: str, actor_id: str, link: str = ""):
    usernames = extract_mentions(content)
    actor = db.query(User).filter(User.id == actor_id).first()
    for username in usernames:
        mentioned = db.query(User).filter(User.username == username).first()
        if mentioned and mentioned.id != actor_id:
            from notification_routes import create_notification
            create_notification(db, mentioned.id, "mention",
                "Te mencionaron en una publicación",
                body=content[:100], link=link, actor_id=actor_id)
            if notify_mention and actor:
                with contextlib.suppress(Exception):
                    notify_mention(db, mentioned, actor, content[:150])


# ─── Request Models ────────────────────────────────────────────

class FriendRequestBody(BaseModel):
    addressee_id: str


class WallPostBody(BaseModel):
    content: str
    image_url: Optional[str] = None
    visibility: str = "friends"  # public | friends | university | private | specific | list
    visible_to: Optional[list[str]] = None  # user IDs for "specific" visibility
    visibility_list_id: Optional[str] = None  # friend list ID for "list" visibility


class CommentBody(BaseModel):
    content: str


class ReportBody(BaseModel):
    reason: str


# ─── Helpers ───────────────────────────────────────────────────

def user_brief(u: User) -> dict:
    return {
        "id": u.id,
        "username": u.username,
        "userNumber": u.user_number,
        "firstName": u.first_name,
        "lastName": u.last_name,
        "avatar": u.avatar or "",
        "university": u.university,
        "career": u.career,
        "semester": u.semester,
        "bio": u.bio or "",
        "coverPhoto": getattr(u, 'cover_photo', '') or "",
        "coverType": getattr(u, 'cover_type', 'template') or "template",
    }


def are_friends(db: Session, user_a: str, user_b: str) -> bool:
    return db.query(Friendship).filter(
        Friendship.status == "accepted",
        or_(
            and_(Friendship.requester_id == user_a, Friendship.addressee_id == user_b),
            and_(Friendship.requester_id == user_b, Friendship.addressee_id == user_a),
        )
    ).first() is not None


# ─── Friend Requests ──────────────────────────────────────────

@router.post("/friend-request")
def send_friend_request(
    body: FriendRequestBody,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.addressee_id == user.id:
        raise HTTPException(400, "No puedes enviarte una solicitud a ti mismo")

    target = db.query(User).filter(User.id == body.addressee_id).first()
    if not target:
        raise HTTPException(404, "Usuario no encontrado")

    existing = db.query(Friendship).filter(
        or_(
            and_(Friendship.requester_id == user.id, Friendship.addressee_id == body.addressee_id),
            and_(Friendship.requester_id == body.addressee_id, Friendship.addressee_id == user.id),
        )
    ).first()

    if existing:
        if existing.status == "accepted":
            raise HTTPException(400, "Ya son amigos")
        if existing.status == "pending":
            # If the other person already sent a request, auto-accept
            if existing.requester_id == body.addressee_id:
                existing.status = "accepted"
                existing.updated_at = datetime.utcnow()
                db.commit()
                return {"status": "accepted", "message": "Solicitud aceptada"}
            raise HTTPException(400, "Ya enviaste una solicitud")
        if existing.status == "rejected":
            existing.status = "pending"
            existing.requester_id = user.id
            existing.addressee_id = body.addressee_id
            existing.updated_at = datetime.utcnow()
            db.commit()
            return {"status": "pending"}

    friendship = Friendship(
        requester_id=user.id,
        addressee_id=body.addressee_id,
    )
    db.add(friendship)
    db.commit()

    # Email notification
    if notify_friend_request:
        notify_friend_request(db, target, user)

    # In-app notification
    create_notification(db, body.addressee_id, "friend_request",
        f"{user.first_name} {user.last_name} te envió una solicitud de amistad",
        link=f"/user/{user.id}", actor_id=user.id, reference_id=friendship.id)
    db.commit()

    return {"status": "pending"}


@router.post("/friend-request/{request_id}/accept")
def accept_friend_request(
    request_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    fr = db.query(Friendship).filter(
        Friendship.id == request_id,
        Friendship.addressee_id == user.id,
        Friendship.status == "pending",
    ).first()
    if not fr:
        raise HTTPException(404, "Solicitud no encontrada")

    fr.status = "accepted"
    fr.updated_at = datetime.utcnow()
    db.commit()

    # Notify the requester that their request was accepted
    if notify_friend_accepted:
        requester = db.query(User).filter(User.id == fr.requester_id).first()
        if requester:
            notify_friend_accepted(db, requester, user)

    # In-app notification
    create_notification(db, fr.requester_id, "friend_accepted",
        f"{user.first_name} {user.last_name} aceptó tu solicitud de amistad",
        link=f"/user/{user.id}", actor_id=user.id, reference_id=fr.id)
    db.commit()

    return {"status": "accepted"}


@router.post("/friend-request/{request_id}/reject")
def reject_friend_request(
    request_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    fr = db.query(Friendship).filter(
        Friendship.id == request_id,
        Friendship.addressee_id == user.id,
        Friendship.status == "pending",
    ).first()
    if not fr:
        raise HTTPException(404, "Solicitud no encontrada")

    fr.status = "rejected"
    fr.updated_at = datetime.utcnow()
    db.commit()

    # Notify the requester
    create_notification(
        db, fr.requester_id, "comment",
        f"{user.first_name} rechazó tu solicitud de amistad",
        "", f"/user/{user.id}", actor_id=user.id, reference_id=request_id
    )
    db.commit()

    return {"status": "rejected"}


@router.delete("/friend/{user_id}")
def unfriend(
    user_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    fr = db.query(Friendship).filter(
        Friendship.status == "accepted",
        or_(
            and_(Friendship.requester_id == user.id, Friendship.addressee_id == user_id),
            and_(Friendship.requester_id == user_id, Friendship.addressee_id == user.id),
        )
    ).first()
    if fr:
        db.delete(fr)
        db.commit()
    return {"status": "removed"}


@router.get("/friends")
def get_friends(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    friendships = db.query(Friendship).filter(
        Friendship.status == "accepted",
        or_(Friendship.requester_id == user.id, Friendship.addressee_id == user.id),
    ).all()

    # Batch query: recolectar IDs y cargar todos los users de una vez (evitar N+1)
    friend_map = {}
    for f in friendships:
        fid = f.addressee_id if f.requester_id == user.id else f.requester_id
        friend_map[fid] = f

    users = db.query(User).filter(User.id.in_(list(friend_map.keys()))).all() if friend_map else []
    user_dict = {u.id: u for u in users}

    friends = []
    for fid, f in friend_map.items():
        friend = user_dict.get(fid)
        if friend and not getattr(friend, 'is_ghost', False):
            friends.append({**user_brief(friend), "friendshipId": f.id, "since": f.updated_at.isoformat()})
    return friends


@router.get("/users/{user_id}/friends")
def get_user_friends(user_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get any user's friend list (public). Used on profile pages."""
    # Check not blocked
    is_blocked = db.query(BlockedUser).filter(
        or_(
            and_(BlockedUser.blocker_id == user.id, BlockedUser.blocked_id == user_id),
            and_(BlockedUser.blocker_id == user_id, BlockedUser.blocked_id == user.id),
        )
    ).first()
    if is_blocked:
        raise HTTPException(403, "No puedes ver este perfil")

    friendships = db.query(Friendship).filter(
        Friendship.status == "accepted",
        or_(Friendship.requester_id == user_id, Friendship.addressee_id == user_id),
    ).all()

    friends = []
    for f in friendships:
        friend_id = f.addressee_id if f.requester_id == user_id else f.requester_id
        friend = db.query(User).filter(User.id == friend_id).first()
        if friend and not getattr(friend, 'is_ghost', False):
            friends.append({**user_brief(friend), "since": f.updated_at.isoformat()})
    return friends


@router.get("/friend-requests")
def get_incoming_requests(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    requests = db.query(Friendship).filter(
        Friendship.addressee_id == user.id,
        Friendship.status == "pending",
    ).all()

    # Batch query para evitar N+1
    requester_ids = [r.requester_id for r in requests]
    users = db.query(User).filter(User.id.in_(requester_ids)).all() if requester_ids else []
    user_dict = {u.id: u for u in users}

    result = []
    for r in requests:
        requester = user_dict.get(r.requester_id)
        if requester:
            result.append({"id": r.id, "user": user_brief(requester), "createdAt": r.created_at.isoformat()})
    return result


@router.get("/friend-requests/sent")
def get_sent_requests(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    requests = db.query(Friendship).filter(
        Friendship.requester_id == user.id,
        Friendship.status == "pending",
    ).all()

    # Batch query para evitar N+1
    addressee_ids = [r.addressee_id for r in requests]
    users = db.query(User).filter(User.id.in_(addressee_ids)).all() if addressee_ids else []
    user_dict = {u.id: u for u in users}

    result = []
    for r in requests:
        addressee = user_dict.get(r.addressee_id)
        if addressee:
            result.append({"id": r.id, "user": user_brief(addressee), "createdAt": r.created_at.isoformat()})
    return result


# ─── User Profiles ─────────────────────────────────────────────

@router.get("/users/search")
def search_users(
    q: str = Query("", min_length=1),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = f"%{q.lower()}%"
    users = db.query(User).filter(
        User.id != user.id,
        User.is_banned.is_(False),
        User.is_ghost.is_(False),
        or_(
            User.username.ilike(query),
            User.first_name.ilike(query),
            User.last_name.ilike(query),
            User.email.ilike(query),
        )
    ).limit(20).all()
    return [user_brief(u) for u in users]


@router.get("/users/{user_id}/profile")
def get_user_profile(
    user_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "Usuario no encontrado")

    # Ghost profiles are invisible to non-admin users
    is_admin_viewer = getattr(user, 'is_admin', False) or getattr(user, 'role', '') in ('owner', 'admin')
    if getattr(target, 'is_ghost', False) and not is_admin_viewer and user.id != target.id:
        raise HTTPException(404, "Usuario no encontrado")

    is_own = user.id == user_id
    is_friend = are_friends(db, user.id, user_id)

    # Check if blocked
    is_blocked = db.query(BlockedUser).filter(
        or_(
            and_(BlockedUser.blocker_id == user.id, BlockedUser.blocked_id == user_id),
            and_(BlockedUser.blocker_id == user_id, BlockedUser.blocked_id == user.id),
        )
    ).first() is not None

    if is_blocked:
        raise HTTPException(403, "No puedes ver este perfil")

    # Non-friends: show public profile with real friend count (not restricted)
    if not is_own and not is_friend:
        # Check friendship status for pending requests
        friendship_status = "none"
        friendship_id = None
        fr = db.query(Friendship).filter(
            or_(
                and_(Friendship.requester_id == user.id, Friendship.addressee_id == user_id),
                and_(Friendship.requester_id == user_id, Friendship.addressee_id == user.id),
            )
        ).first()
        if fr:
            friendship_status = fr.status
            friendship_id = fr.id

        friend_count = db.query(Friendship).filter(
            Friendship.status == "accepted",
            or_(Friendship.requester_id == user_id, Friendship.addressee_id == user_id),
        ).count()

        import json as _json
        return {
            "id": target.id,
            "username": target.username,
            "userNumber": target.user_number,
            "firstName": target.first_name,
            "lastName": target.last_name,
            "avatar": target.avatar or "",
            "university": target.university,
            "career": target.career,
            "semester": target.semester,
            "bio": target.bio or "",
            "isFriend": False,
            "friendshipStatus": friendship_status,
            "friendshipId": friendship_id,
            "friendCount": friend_count,
            "isOwnProfile": False,
            "restricted": False,
            "academicStatus": getattr(target, 'academic_status', 'estudiante') or "estudiante",
            "offersMentoring": getattr(target, 'offers_mentoring', False) or False,
            "mentoringServices": _json.loads(getattr(target, 'mentoring_services', None) or "[]"),
            "mentoringSubjects": _json.loads(getattr(target, 'mentoring_subjects', None) or "[]"),
            "mentoringDescription": getattr(target, 'mentoring_description', '') or "",
            "mentoringPriceType": getattr(target, 'mentoring_price_type', 'free') or "free",
            "mentoringPricePerHour": getattr(target, 'mentoring_price_per_hour', None),
            "mentoringCurrency": getattr(target, 'mentoring_currency', 'USD') or "USD",
            "professionalTitle": getattr(target, 'professional_title', '') or "",
            "coverPhoto": getattr(target, 'cover_photo', '') or "",
            "coverType": getattr(target, 'cover_type', 'template') or "template",
            "studentRatingAvg": round(getattr(target, 'student_rating_sum', 0) / getattr(target, 'student_rating_count', 1), 2) if getattr(target, 'student_rating_count', 0) else None,
            "studentRatingCount": getattr(target, 'student_rating_count', 0) or 0,
        }

    # Full profile for friends and own profile
    friendship_status = "none"
    friendship_id = None
    fr = db.query(Friendship).filter(
        or_(
            and_(Friendship.requester_id == user.id, Friendship.addressee_id == user_id),
            and_(Friendship.requester_id == user_id, Friendship.addressee_id == user.id),
        )
    ).first()
    if fr:
        friendship_status = fr.status
        friendship_id = fr.id

    friend_count = db.query(Friendship).filter(
        Friendship.status == "accepted",
        or_(Friendship.requester_id == user_id, Friendship.addressee_id == user_id),
    ).count()

    import json as _json
    return {
        **user_brief(target),
        "isFriend": is_friend,
        "friendshipStatus": friendship_status,
        "friendshipId": friendship_id,
        "friendCount": friend_count,
        "isOwnProfile": is_own,
        "restricted": False,
        "academicStatus": getattr(target, 'academic_status', 'estudiante') or "estudiante",
        "offersMentoring": getattr(target, 'offers_mentoring', False) or False,
        "mentoringServices": _json.loads(getattr(target, 'mentoring_services', None) or "[]"),
        "mentoringSubjects": _json.loads(getattr(target, 'mentoring_subjects', None) or "[]"),
        "mentoringDescription": getattr(target, 'mentoring_description', '') or "",
        "mentoringPriceType": getattr(target, 'mentoring_price_type', 'free') or "free",
        "mentoringPricePerHour": getattr(target, 'mentoring_price_per_hour', None),
        "mentoringCurrency": getattr(target, 'mentoring_currency', 'USD') or "USD",
        "professionalTitle": getattr(target, 'professional_title', '') or "",
        "studentRatingAvg": round(getattr(target, 'student_rating_sum', 0) / getattr(target, 'student_rating_count', 1), 2) if getattr(target, 'student_rating_count', 0) else None,
        "studentRatingCount": getattr(target, 'student_rating_count', 0) or 0,
    }


# ─── Wall Posts ────────────────────────────────────────────────

@router.post("/wall/{wall_owner_id}/posts")
def create_wall_post(
    wall_owner_id: str,
    body: WallPostBody,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if wall_owner_id != user.id and not are_friends(db, user.id, wall_owner_id):
        raise HTTPException(403, "Solo puedes publicar en muros de amigos")

    if not body.content.strip() and not body.image_url:
        raise HTTPException(400, "El contenido no puede estar vacío")

    # Basic moderation
    from moderation import check_content
    mod = check_content(body.content)
    if not mod["allowed"]:
        raise HTTPException(400, f"Contenido bloqueado: {mod['reason']}")

    # Track image storage usage (base64 images count against user storage)
    if body.image_url and body.image_url.startswith("data:"):
        image_size = len(body.image_url.encode('utf-8'))
        current_used = getattr(user, 'storage_used_bytes', 0) or 0
        storage_limit = getattr(user, 'storage_limit_bytes', 524288000) or 524288000
        if current_used + image_size > storage_limit:
            used_mb = round(current_used / 1048576, 1)
            limit_mb = round(storage_limit / 1048576, 1)
            raise HTTPException(
                413,
                f"Almacenamiento lleno ({used_mb}/{limit_mb} MB). "
                "Actualiza a PRO para obtener más espacio."
            )
        user.storage_used_bytes = current_used + image_size

    valid_visibilities = ("public", "friends", "university", "private", "specific", "list")
    vis = body.visibility if body.visibility in valid_visibilities else "friends"
    post = WallPost(
        author_id=user.id,
        wall_owner_id=wall_owner_id,
        content=body.content.strip(),
        image_url=body.image_url,
        visibility=vis,
        visible_to=json.dumps(body.visible_to or []),
        visibility_list_id=body.visibility_list_id if vis == "list" else None,
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    # Notify wall owner if someone else posted on their wall
    if wall_owner_id != user.id and notify_wall_post:
        wall_owner = db.query(User).filter(User.id == wall_owner_id).first()
        if wall_owner:
            notify_wall_post(db, wall_owner, user, body.content[:100])

    # In-app notification
    if post.author_id != post.wall_owner_id:
        create_notification(db, wall_owner_id, "wall_post",
            f"{user.first_name} publicó en tu muro",
            body=body.content[:100], link=f"/user/{wall_owner_id}", actor_id=user.id, reference_id=post.id)
        db.commit()

    process_hashtags(db, body.content, post.id, "wall")
    process_mentions(db, body.content, user.id, f"/user/{wall_owner_id}")
    db.commit()

    author = db.query(User).filter(User.id == post.author_id).first()
    return {
        "id": post.id,
        "author": user_brief(author) if author else None,
        "wallOwnerId": post.wall_owner_id,
        "content": post.content,
        "imageUrl": post.image_url,
        "visibility": post.visibility,
        "visibleTo": json.loads(post.visible_to or "[]"),
        "isMilestone": post.is_milestone,
        "milestoneType": post.milestone_type,
        "likes": 0,
        "liked": False,
        "comments": [],
        "commentCount": 0,
        "createdAt": post.created_at.isoformat(),
    }


@router.get("/wall/{wall_owner_id}/posts")
def get_wall_posts(
    wall_owner_id: str,
    page: int = Query(1, ge=1),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    is_self = wall_owner_id == user.id
    is_friend = are_friends(db, user.id, wall_owner_id)

    per_page = 20
    query = db.query(WallPost).filter(WallPost.wall_owner_id == wall_owner_id)

    if not is_self and not is_friend:
        # Visitante: solo posts públicos + hitos automáticos
        from sqlalchemy import or_
        query = query.filter(
            or_(WallPost.visibility == "public", WallPost.is_milestone)
        )

    posts = query.order_by(WallPost.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    if not posts:
        return []

    # ── Batch-optimized: same pattern as /feed ────────────────
    from sqlalchemy import func as sqlfunc

    pids = [p.id for p in posts]
    author_ids = list({p.author_id for p in posts})

    # 1) Authors — 1 query
    authors_map = {u.id: u for u in db.query(User).filter(User.id.in_(author_ids)).all()}

    # 2) Like counts — 1 query
    like_counts = dict(db.query(PostLike.post_id, sqlfunc.count(PostLike.id)).filter(
        PostLike.post_id.in_(pids)).group_by(PostLike.post_id).all())

    # 3) User's likes — 1 query
    user_liked = {r[0] for r in db.query(PostLike.post_id).filter(
        PostLike.post_id.in_(pids), PostLike.user_id == user.id).all()}

    # 4) Comment counts — 1 query
    comment_counts = dict(db.query(PostComment.post_id, sqlfunc.count(PostComment.id)).filter(
        PostComment.post_id.in_(pids)).group_by(PostComment.post_id).all())

    # 5) Reactions grouped by post + type — 1 query
    reactions_map: dict = {}
    for pid, rtype, cnt in db.query(
        PostReaction.post_id, PostReaction.reaction_type, sqlfunc.count(PostReaction.id)
    ).filter(PostReaction.post_id.in_(pids)).group_by(
        PostReaction.post_id, PostReaction.reaction_type
    ).all():
        reactions_map.setdefault(pid, {})[rtype] = cnt

    # 6) User's reactions — 1 query
    user_reactions = dict(db.query(PostReaction.post_id, PostReaction.reaction_type).filter(
        PostReaction.post_id.in_(pids), PostReaction.user_id == user.id).all())

    result = []
    for post in posts:
        author = authors_map.get(post.author_id)
        result.append({
            "id": post.id,
            "author": user_brief(author) if author else None,
            "wallOwnerId": post.wall_owner_id,
            "content": post.content,
            "imageUrl": post.image_url,
            "visibility": getattr(post, "visibility", "friends"),
            "visibleTo": json.loads(getattr(post, "visible_to", None) or "[]"),
            "isMilestone": getattr(post, "is_milestone", False),
            "milestoneType": getattr(post, "milestone_type", None),
            "likes": like_counts.get(post.id, 0),
            "liked": post.id in user_liked,
            "commentCount": comment_counts.get(post.id, 0),
            "reactions": reactions_map.get(post.id, {}),
            "userReaction": user_reactions.get(post.id),
            "createdAt": post.created_at.isoformat(),
        })
    return result


@router.put("/posts/{post_id}")
def update_post(
    post_id: str,
    body: WallPostBody,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(WallPost).filter(WallPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post no encontrado")
    if post.author_id != user.id:
        raise HTTPException(403, "Solo puedes editar tus propios posts")
    if body.content:
        from moderation import check_content
        mod = check_content(body.content)
        if not mod["allowed"]:
            raise HTTPException(400, f"Contenido bloqueado: {mod['reason']}")
        post.content = body.content.strip()
    if body.image_url is not None:
        post.image_url = body.image_url
    post.updated_at = datetime.utcnow()
    db.commit()
    return {"status": "updated", "id": post.id}


@router.delete("/posts/{post_id}")
def delete_post(
    post_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(WallPost).filter(WallPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Publicación no encontrada")
    if post.author_id != user.id and post.wall_owner_id != user.id and not user.is_admin:
        raise HTTPException(403, "No puedes eliminar esta publicación")

    db.delete(post)
    db.commit()
    return {"deleted": True}


# ─── Likes ─────────────────────────────────────────────────────

@router.post("/posts/{post_id}/like")
def toggle_like(
    post_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(WallPost).filter(WallPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Publicación no encontrada")

    existing = db.query(PostLike).filter(
        PostLike.post_id == post_id,
        PostLike.user_id == user.id,
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"liked": False}
    else:
        like = PostLike(post_id=post_id, user_id=user.id)
        db.add(like)
        db.commit()
        # In-app notification
        if post.author_id != user.id:
            create_notification(db, post.author_id, "like",
                f"{user.first_name} le dio me gusta a tu publicación",
                body=post.content[:80] if post.content else "", link=f"/user/{post.wall_owner_id}",
                actor_id=user.id, reference_id=post.id)
            db.commit()
        return {"liked": True}


# ─── Reactions ────────────────────────────────────────────────

def _get_reactions(db, post_id: str) -> dict:
    """Get reaction counts grouped by type."""
    from sqlalchemy import func as sqlfunc
    results = db.query(PostReaction.reaction_type, sqlfunc.count(PostReaction.id)).filter(
        PostReaction.post_id == post_id
    ).group_by(PostReaction.reaction_type).all()
    return {r_type: count for r_type, count in results}


@router.post("/posts/{post_id}/react")
def react_to_post(post_id: str, data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """React to a post with different reaction types."""
    reaction_type = data.get("reaction_type", "like")
    valid_types = {"like", "love", "useful", "brilliant", "funny", "thinking"}
    if reaction_type not in valid_types:
        reaction_type = "like"

    post = db.query(WallPost).filter(WallPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post no encontrado")

    existing = db.query(PostReaction).filter(
        PostReaction.post_id == post_id, PostReaction.user_id == user.id
    ).first()

    if existing:
        if existing.reaction_type == reaction_type:
            db.delete(existing)
            db.commit()
            reactions = _get_reactions(db, post_id)
            return {"reacted": False, "reactions": reactions, "userReaction": None}
        else:
            existing.reaction_type = reaction_type
            db.commit()
            reactions = _get_reactions(db, post_id)
            return {"reacted": True, "reactions": reactions, "userReaction": reaction_type}
    else:
        reaction = PostReaction(id=gen_id(), post_id=post_id, user_id=user.id, reaction_type=reaction_type)
        db.add(reaction)
        db.commit()
        reactions = _get_reactions(db, post_id)
        return {"reacted": True, "reactions": reactions, "userReaction": reaction_type}


# ─── Comments ──────────────────────────────────────────────────

@router.post("/posts/{post_id}/comments")
def add_comment(
    post_id: str,
    body: CommentBody,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(WallPost).filter(WallPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Publicación no encontrada")

    if not body.content.strip():
        raise HTTPException(400, "El comentario no puede estar vacío")

    from moderation import check_content
    mod = check_content(body.content)
    if not mod["allowed"]:
        raise HTTPException(400, f"Contenido bloqueado: {mod['reason']}")

    comment = PostComment(
        post_id=post_id,
        author_id=user.id,
        content=body.content.strip(),
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    # In-app notification + email
    if post.author_id != user.id:
        content = body.content.strip()
        create_notification(db, post.author_id, "comment",
            f"{user.first_name} comentó en tu publicación",
            body=content[:100], link=f"/user/{post.wall_owner_id}",
            actor_id=user.id, reference_id=post.id)
        if notify_comment:
            try:
                post_author = db.query(User).filter(User.id == post.author_id).first()
                if post_author:
                    notify_comment(db, post_author, user, content[:150])
            except Exception:
                pass
        db.commit()

    author = db.query(User).filter(User.id == comment.author_id).first()
    return {
        "id": comment.id,
        "author": user_brief(author) if author else None,
        "content": comment.content,
        "createdAt": comment.created_at.isoformat(),
    }


@router.put("/comments/{comment_id}")
def edit_comment(
    comment_id: str,
    body: CommentBody,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    comment = db.query(PostComment).filter(PostComment.id == comment_id).first()
    if not comment:
        raise HTTPException(404, "Comentario no encontrado")
    if comment.author_id != user.id:
        raise HTTPException(403, "Solo puedes editar tus propios comentarios")
    if not body.content.strip():
        raise HTTPException(400, "El comentario no puede estar vacío")

    from moderation import check_content
    mod = check_content(body.content)
    if not mod["allowed"]:
        raise HTTPException(400, f"Contenido bloqueado: {mod['reason']}")

    comment.content = body.content.strip()
    comment.edited_at = datetime.utcnow()
    db.commit()

    author = db.query(User).filter(User.id == comment.author_id).first()
    return {
        "id": comment.id,
        "author": user_brief(author) if author else None,
        "content": comment.content,
        "createdAt": comment.created_at.isoformat(),
        "editedAt": comment.edited_at.isoformat() if comment.edited_at else None,
    }


@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    comment = db.query(PostComment).filter(PostComment.id == comment_id).first()
    if not comment:
        raise HTTPException(404, "Comentario no encontrado")
    # El autor o el dueño del post pueden eliminar
    post = db.query(WallPost).filter(WallPost.id == comment.post_id).first()
    if comment.author_id != user.id and (not post or post.author_id != user.id):
        raise HTTPException(403, "Sin permiso para eliminar este comentario")

    db.delete(comment)
    db.commit()
    return {"success": True}


@router.get("/posts/{post_id}/comments")
def get_comments(
    post_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    comments = db.query(PostComment).filter(
        PostComment.post_id == post_id
    ).order_by(PostComment.created_at.asc()).all()

    if not comments:
        return []

    # Batch fetch authors — 1 query instead of N
    author_ids = list({c.author_id for c in comments})
    authors_map = {u.id: u for u in db.query(User).filter(User.id.in_(author_ids)).all()}

    return [
        {
            "id": c.id,
            "author": user_brief(authors_map[c.author_id]) if c.author_id in authors_map else None,
            "content": c.content,
            "createdAt": c.created_at.isoformat(),
            "editedAt": c.edited_at.isoformat() if getattr(c, 'edited_at', None) else None,
        }
        for c in comments
    ]


# ─── Feed (friends' recent posts) ─────────────────────────────

@router.get("/feed")
def get_feed(
    page: int = Query(1, ge=1),
    sort: str = Query("recent", pattern="^(recent|smart)$"),
    filter: str = Query("all", pattern="^(all|career|university|friends)$"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Get friend IDs
    friendships = db.query(Friendship).filter(
        Friendship.status == "accepted",
        or_(Friendship.requester_id == user.id, Friendship.addressee_id == user.id),
    ).all()

    friend_ids = set()
    for f in friendships:
        friend_ids.add(f.addressee_id if f.requester_id == user.id else f.requester_id)
    friend_ids.add(user.id)  # Include own posts

    # Build base query depending on filter
    per_page = 20
    if filter == "friends":
        # Only posts from friends (not own)
        query = db.query(WallPost).filter(WallPost.author_id.in_(friend_ids))
    elif filter == "career":
        # Posts from anyone with the same career
        if user.career:
            career_user_ids = [u.id for u in db.query(User.id).filter(User.career == user.career).all()]
            query = db.query(WallPost).filter(WallPost.author_id.in_(career_user_ids))
        else:
            query = db.query(WallPost).filter(WallPost.author_id.in_(friend_ids))
    elif filter == "university":
        # Posts from anyone at the same university
        if user.university:
            uni_user_ids = [u.id for u in db.query(User.id).filter(User.university == user.university).all()]
            query = db.query(WallPost).filter(WallPost.author_id.in_(uni_user_ids))
        else:
            query = db.query(WallPost).filter(WallPost.author_id.in_(friend_ids))
    else:
        query = db.query(WallPost).filter(WallPost.author_id.in_(friend_ids))

    # For smart sorting, fetch more posts to score; for recent, paginate normally
    if sort == "smart" and page == 1:
        posts = query.order_by(WallPost.created_at.desc()).limit(50).all()
    else:
        posts = query.order_by(WallPost.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    # Get current user's university for "university" visibility filtering
    user_university = getattr(user, "university", None)

    if not posts:
        return []

    # ── Batch-optimized: ~10 queries total instead of ~160+ ───
    from database import Poll
    from sqlalchemy import func as sqlfunc

    # Pre-fetch authors needed for "university" visibility check
    univ_author_ids = {
        p.author_id for p in posts
        if p.author_id != user.id
        and (getattr(p, "visibility", "friends") or "friends") == "university"
    }
    univ_authors: dict = {}
    if univ_author_ids:
        univ_authors = {u.id: u for u in db.query(User).filter(User.id.in_(univ_author_ids)).all()}

    # Visibility filtering (only "list" visibility needs per-post query)
    filtered_posts = []
    for post in posts:
        visibility = getattr(post, "visibility", "friends") or "friends"
        if post.author_id != user.id:
            if visibility == "private":
                continue
            if visibility == "university":
                post_author = univ_authors.get(post.author_id)
                if not user_university or not post_author or getattr(post_author, "university", None) != user_university:
                    continue
            if visibility == "specific":
                visible_ids = json.loads(getattr(post, "visible_to", None) or "[]")
                if user.id not in visible_ids:
                    continue
            if visibility == "list":
                list_id = getattr(post, "visibility_list_id", None)
                if list_id:
                    is_member = db.query(FriendListMember).filter(
                        FriendListMember.list_id == list_id,
                        FriendListMember.friend_id == user.id,
                    ).first()
                    if not is_member:
                        continue
                else:
                    continue
        filtered_posts.append(post)

    if not filtered_posts:
        return []

    fpost_ids = [p.id for p in filtered_posts]
    all_user_ids = list({p.author_id for p in filtered_posts} | {p.wall_owner_id for p in filtered_posts})

    # 1) All users (authors + wall owners) — 1 query
    users_map = {u.id: u for u in db.query(User).filter(User.id.in_(all_user_ids)).all()}

    # 2) Like counts per post — 1 query
    like_counts = dict(db.query(PostLike.post_id, sqlfunc.count(PostLike.id)).filter(
        PostLike.post_id.in_(fpost_ids)).group_by(PostLike.post_id).all())

    # 3) Current user's likes — 1 query
    user_liked = {r[0] for r in db.query(PostLike.post_id).filter(
        PostLike.post_id.in_(fpost_ids), PostLike.user_id == user.id).all()}

    # 4) Comment counts per post — 1 query
    comment_counts = dict(db.query(PostComment.post_id, sqlfunc.count(PostComment.id)).filter(
        PostComment.post_id.in_(fpost_ids)).group_by(PostComment.post_id).all())

    # 5) Polls by wall_post_id — 1 query
    polls_map = {p.wall_post_id: p for p in db.query(Poll).filter(Poll.wall_post_id.in_(fpost_ids)).all()}

    # 6) Reactions grouped by post + type — 1 query
    reactions_map: dict = {}
    for pid, rtype, cnt in db.query(
        PostReaction.post_id, PostReaction.reaction_type, sqlfunc.count(PostReaction.id)
    ).filter(PostReaction.post_id.in_(fpost_ids)).group_by(
        PostReaction.post_id, PostReaction.reaction_type
    ).all():
        reactions_map.setdefault(pid, {})[rtype] = cnt

    # 7) Current user's reactions — 1 query
    user_reactions = dict(db.query(PostReaction.post_id, PostReaction.reaction_type).filter(
        PostReaction.post_id.in_(fpost_ids), PostReaction.user_id == user.id).all())

    # ── Build result from pre-fetched data (0 extra queries) ──
    result = []
    for post in filtered_posts:
        author = users_map.get(post.author_id)
        wall_owner = users_map.get(post.wall_owner_id)
        visibility = getattr(post, "visibility", "friends") or "friends"
        poll = polls_map.get(post.id)

        result.append({
            "id": post.id,
            "authorId": post.author_id,
            "author": user_brief(author) if author else None,
            "wallOwner": user_brief(wall_owner) if wall_owner else None,
            "content": post.content,
            "imageUrl": post.image_url,
            "visibility": visibility,
            "visibleTo": json.loads(getattr(post, "visible_to", None) or "[]"),
            "isMilestone": getattr(post, "is_milestone", False),
            "milestoneType": getattr(post, "milestone_type", None),
            "likes": like_counts.get(post.id, 0),
            "liked": post.id in user_liked,
            "commentCount": comment_counts.get(post.id, 0),
            "reactions": reactions_map.get(post.id, {}),
            "userReaction": user_reactions.get(post.id),
            "createdAt": post.created_at.isoformat(),
            "updatedAt": post.updated_at.isoformat() if post.updated_at else None,
            "pollId": poll.id if poll else None,
        })

    # Smart sorting: personalized ranking (uses pre-fetched users_map — 0 extra queries)
    if sort == "smart" and result:
        from datetime import datetime, timezone
        now = datetime.now(UTC)

        for item in result:
            score = 0.0
            created = datetime.fromisoformat(item["createdAt"].replace("Z", "+00:00")) if "+" not in item["createdAt"] and "Z" not in item["createdAt"] else datetime.fromisoformat(item["createdAt"].replace("Z", "+00:00"))
            age_hours = max((now - created).total_seconds() / 3600, 0.5)

            # Recency decay (newer = higher score)
            score += max(0, 100 - age_hours * 2)

            # Engagement boost
            score += item["likes"] * 3
            score += item["commentCount"] * 5

            # Friend boost (posts from friends rank higher)
            if item["authorId"] in friend_ids and item["authorId"] != user.id:
                score += 50

            # Same career/university boost
            author = users_map.get(item["authorId"])
            if author:
                if author.career and author.career == user.career:
                    score += 30
                if author.university and author.university == user.university:
                    score += 20

            # Poll boost (polls get more visibility)
            if item.get("pollId"):
                score += 15

            # Image boost
            if item.get("imageUrl"):
                score += 10

            # Milestone bonus
            if item.get("isMilestone"):
                score += 10

            item["_score"] = score

        result.sort(key=lambda x: x.get("_score", 0), reverse=True)
        for item in result:
            item.pop("_score", None)

    return result


@router.get("/feed/trending")
def get_trending_posts(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return top 3 trending posts from the user's career field (last 72h)."""
    from datetime import datetime, timedelta, timezone

    if not user.career:
        return []

    cutoff = datetime.now(UTC) - timedelta(hours=72)

    # Get users in the same career
    career_user_ids = [u.id for u in db.query(User.id).filter(User.career == user.career).all()]
    if not career_user_ids:
        return []

    posts = db.query(WallPost).filter(
        WallPost.author_id.in_(career_user_ids),
        WallPost.created_at >= cutoff,
    ).order_by(WallPost.created_at.desc()).limit(30).all()

    # Visibility filter: remove private posts not authored by user
    visible_posts = [
        p for p in posts
        if p.author_id == user.id or (getattr(p, "visibility", "friends") or "friends") != "private"
    ]
    if not visible_posts:
        return []

    # ── Batch-optimized (same pattern as /feed) ───────────────
    from database import Poll
    from sqlalchemy import func as sqlfunc

    vpost_ids = [p.id for p in visible_posts]
    author_ids = list({p.author_id for p in visible_posts})

    authors_map = {u.id: u for u in db.query(User).filter(User.id.in_(author_ids)).all()}
    like_counts = dict(db.query(PostLike.post_id, sqlfunc.count(PostLike.id)).filter(
        PostLike.post_id.in_(vpost_ids)).group_by(PostLike.post_id).all())
    comment_counts = dict(db.query(PostComment.post_id, sqlfunc.count(PostComment.id)).filter(
        PostComment.post_id.in_(vpost_ids)).group_by(PostComment.post_id).all())
    polls_map = {p.wall_post_id: p for p in db.query(Poll).filter(Poll.wall_post_id.in_(vpost_ids)).all()}

    scored = []
    now = datetime.now(UTC)
    for post in visible_posts:
        lc = like_counts.get(post.id, 0)
        cc = comment_counts.get(post.id, 0)
        age_hours = max((now - post.created_at.replace(tzinfo=UTC)).total_seconds() / 3600, 0.5)
        score = (lc * 3 + cc * 5) / (age_hours ** 0.5)

        author = authors_map.get(post.author_id)
        poll = polls_map.get(post.id)

        scored.append({
            "id": post.id,
            "authorId": post.author_id,
            "author": user_brief(author) if author else None,
            "content": post.content,
            "imageUrl": post.image_url,
            "likes": lc,
            "commentCount": cc,
            "createdAt": post.created_at.isoformat(),
            "pollId": poll.id if poll else None,
            "_score": score,
        })

    scored.sort(key=lambda x: x["_score"], reverse=True)
    for item in scored:
        item.pop("_score", None)

    return scored[:3]


# ─── Activity Feed (mixed posts + academic activity) ─────────

@router.get("/activity-feed")
def get_activity_feed(
    page: int = Query(1, ge=1),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns a unified feed mixing friends' wall posts (type="post")
    and academic activity items (type="activity") for the current user.
    Activity items will be generated in a future iteration.
    """
    # Get friend IDs
    friendships = db.query(Friendship).filter(
        Friendship.status == "accepted",
        or_(Friendship.requester_id == user.id, Friendship.addressee_id == user.id),
    ).all()

    friend_ids = set()
    for f in friendships:
        friend_ids.add(f.addressee_id if f.requester_id == user.id else f.requester_id)
    friend_ids.add(user.id)  # Include own posts

    per_page = 20
    posts = db.query(WallPost).filter(
        WallPost.author_id.in_(friend_ids)
    ).order_by(WallPost.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    # Get current user's university for "university" visibility filtering
    user_university = getattr(user, "university", None)

    result = []
    for post in posts:
        # Visibility filtering
        visibility = getattr(post, "visibility", "friends") or "friends"
        if post.author_id != user.id:
            if visibility == "private":
                continue
            if visibility == "university":
                post_author = db.query(User).filter(User.id == post.author_id).first()
                if not user_university or not post_author or getattr(post_author, "university", None) != user_university:
                    continue
            if visibility == "specific":
                visible_ids = json.loads(getattr(post, "visible_to", None) or "[]")
                if user.id not in visible_ids:
                    continue
            if visibility == "list":
                list_id = getattr(post, "visibility_list_id", None)
                if list_id:
                    is_member = db.query(FriendListMember).filter(
                        FriendListMember.list_id == list_id,
                        FriendListMember.friend_id == user.id,
                    ).first()
                    if not is_member:
                        continue
                else:
                    continue

        author = db.query(User).filter(User.id == post.author_id).first()
        wall_owner = db.query(User).filter(User.id == post.wall_owner_id).first()
        like_count = db.query(PostLike).filter(PostLike.post_id == post.id).count()
        liked = db.query(PostLike).filter(PostLike.post_id == post.id, PostLike.user_id == user.id).first() is not None
        comment_count = db.query(PostComment).filter(PostComment.post_id == post.id).count()

        result.append({
            "id": post.id,
            "type": "post",
            "author": user_brief(author) if author else None,
            "wallOwner": user_brief(wall_owner) if wall_owner else None,
            "content": post.content,
            "imageUrl": post.image_url,
            "visibility": visibility,
            "visibleTo": json.loads(getattr(post, "visible_to", None) or "[]"),
            "isMilestone": getattr(post, "is_milestone", False),
            "milestoneType": getattr(post, "milestone_type", None),
            "likes": like_count,
            "liked": liked,
            "commentCount": comment_count,
            "reactions": _get_reactions(db, post.id),
            "userReaction": db.query(PostReaction.reaction_type).filter(PostReaction.post_id == post.id, PostReaction.user_id == user.id).scalar(),
            "createdAt": post.created_at.isoformat(),
        })

    # TODO: Merge academic activity items (quiz_generated, guide_generated,
    #       document_uploaded, friend_added) and sort by createdAt.
    return result


# ─── Milestone Posts ─────────────────────────────────────────

def create_milestone_post(db, user_id, milestone_type, content, visibility="friends"):
    """Auto-create a milestone post on user's wall."""
    post = WallPost(
        id=gen_id(),
        wall_owner_id=user_id,
        author_id=user_id,
        content=content,
        visibility=visibility,
        is_milestone=True,
        milestone_type=milestone_type,
    )
    db.add(post)
    db.commit()

    # Auto-update bio if user has bio_auto enabled
    try:
        user_obj = db.query(User).filter(User.id == user_id).first()
        if user_obj and getattr(user_obj, "bio_auto", False):
            from auth_routes import _generate_bio_text
            new_bio = _generate_bio_text(user_obj, db)
            if new_bio:
                user_obj.bio = new_bio
                db.commit()
    except Exception:
        pass  # Never block milestone creation
    return post


@router.post("/milestone")
def post_milestone(data: dict, user=Depends(get_current_user), db=Depends(get_db)):
    milestone_type = data.get("type", "")
    content = data.get("content", "")
    visibility = data.get("visibility", "friends")
    visible_to = data.get("visible_to", [])

    if not content.strip():
        raise HTTPException(400, "El contenido no puede estar vacío")

    if visibility not in ("friends", "university", "private", "specific"):
        visibility = "friends"

    post = WallPost(
        id=gen_id(),
        wall_owner_id=user.id,
        author_id=user.id,
        content=content.strip(),
        visibility=visibility,
        visible_to=json.dumps(visible_to),
        is_milestone=True,
        milestone_type=milestone_type,
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    author = db.query(User).filter(User.id == user.id).first()
    return {
        "id": post.id,
        "author": user_brief(author) if author else None,
        "wallOwnerId": post.wall_owner_id,
        "content": post.content,
        "imageUrl": post.image_url,
        "visibility": post.visibility,
        "visibleTo": json.loads(post.visible_to or "[]"),
        "isMilestone": post.is_milestone,
        "milestoneType": post.milestone_type,
        "likes": 0,
        "liked": False,
        "comments": [],
        "commentCount": 0,
        "createdAt": post.created_at.isoformat(),
    }


# ─── Block / Unblock ──────────────────────────────────────────

@router.post("/users/{user_id}/block")
def block_user(
    user_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user_id == user.id:
        raise HTTPException(400, "No puedes bloquearte a ti mismo")

    existing = db.query(BlockedUser).filter(
        BlockedUser.blocker_id == user.id,
        BlockedUser.blocked_id == user_id,
    ).first()
    if existing:
        raise HTTPException(400, "Usuario ya bloqueado")

    block = BlockedUser(blocker_id=user.id, blocked_id=user_id)
    db.add(block)

    # Also remove friendship if exists
    fr = db.query(Friendship).filter(
        Friendship.status == "accepted",
        or_(
            and_(Friendship.requester_id == user.id, Friendship.addressee_id == user_id),
            and_(Friendship.requester_id == user_id, Friendship.addressee_id == user.id),
        )
    ).first()
    if fr:
        db.delete(fr)

    db.commit()
    return {"blocked": True}


@router.post("/users/{user_id}/unblock")
def unblock_user(
    user_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    block = db.query(BlockedUser).filter(
        BlockedUser.blocker_id == user.id,
        BlockedUser.blocked_id == user_id,
    ).first()
    if not block:
        raise HTTPException(404, "Usuario no está bloqueado")

    db.delete(block)
    db.commit()
    return {"unblocked": True}


@router.get("/blocked-users")
def get_blocked_users(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    blocks = db.query(BlockedUser).filter(BlockedUser.blocker_id == user.id).all()
    result = []
    for b in blocks:
        blocked = db.query(User).filter(User.id == b.blocked_id).first()
        if blocked:
            result.append({**user_brief(blocked), "blockedAt": b.created_at.isoformat()})
    return result


# ─── Report User ──────────────────────────────────────────────

@router.post("/users/{user_id}/report")
def report_user(
    user_id: str,
    body: ReportBody,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user_id == user.id:
        raise HTTPException(400, "No puedes denunciarte a ti mismo")

    if not body.reason.strip():
        raise HTTPException(400, "Debes proporcionar una razón")

    report = UserReport(
        reporter_id=user.id,
        reported_id=user_id,
        reason=body.reason.strip(),
    )
    db.add(report)
    db.commit()
    return {"reported": True}


# ─── Friend Suggestions (Algorithm) ──────────────────────────

@router.get("/friend-suggestions")
def get_friend_suggestions(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Suggestion algorithm scores users based on:
    - Same university: +30 pts
    - Same career: +25 pts
    - Similar semester (within 2): +10 pts
    - Mutual friends: +15 pts each
    - Has profile photo: +5 pts
    - Has bio: +3 pts
    """
    # Get current friend IDs
    friendships = db.query(Friendship).filter(
        Friendship.status == "accepted",
        or_(Friendship.requester_id == user.id, Friendship.addressee_id == user.id),
    ).all()

    friend_ids = set()
    for f in friendships:
        friend_ids.add(f.addressee_id if f.requester_id == user.id else f.requester_id)

    # Get blocked user IDs (both directions)
    blocked_ids = set()
    blocks = db.query(BlockedUser).filter(
        or_(BlockedUser.blocker_id == user.id, BlockedUser.blocked_id == user.id)
    ).all()
    for b in blocks:
        blocked_ids.add(b.blocker_id if b.blocked_id == user.id else b.blocked_id)

    # Get pending request IDs
    pending = db.query(Friendship).filter(
        Friendship.status == "pending",
        or_(Friendship.requester_id == user.id, Friendship.addressee_id == user.id),
    ).all()
    pending_ids = set()
    for p in pending:
        pending_ids.add(p.addressee_id if p.requester_id == user.id else p.requester_id)

    # Exclude self, friends, blocked, and pending
    exclude_ids = friend_ids | blocked_ids | pending_ids | {user.id}

    # Get candidate users — prioritize same university, then others
    same_uni_candidates = []
    other_candidates = []

    if user.university:
        same_uni_candidates = db.query(User).filter(
            User.id.notin_(exclude_ids),
            User.is_banned.is_(False),
            User.is_ghost.is_(False),
            func.lower(User.university) == user.university.lower(),
        ).limit(50).all()

    other_candidates = db.query(User).filter(
        User.id.notin_(exclude_ids | {c.id for c in same_uni_candidates}),
        User.is_banned.is_(False),
        User.is_ghost.is_(False),
    ).limit(50).all()

    candidates = same_uni_candidates + other_candidates

    # Preload all friendships for candidates in one query (avoid N+1)
    candidate_ids = [c.id for c in candidates]
    all_candidate_friendships = db.query(Friendship).filter(
        Friendship.status == "accepted",
        or_(
            Friendship.requester_id.in_(candidate_ids),
            Friendship.addressee_id.in_(candidate_ids),
        ),
    ).all()

    # Build friend sets from preloaded data
    candidate_friend_map: dict[str, set] = {cid: set() for cid in candidate_ids}
    for f in all_candidate_friendships:
        if f.requester_id in candidate_friend_map:
            candidate_friend_map[f.requester_id].add(f.addressee_id)
        if f.addressee_id in candidate_friend_map:
            candidate_friend_map[f.addressee_id].add(f.requester_id)

    my_friends = friend_ids

    suggestions = []
    for candidate in candidates:
        score = 0
        reasons = []

        # Same university (+30)
        if user.university and candidate.university and user.university.lower() == candidate.university.lower():
            score += 30
            reasons.append(f"Misma universidad: {candidate.university}")

        # Same career (+25)
        if user.career and candidate.career and user.career.lower() == candidate.career.lower():
            score += 25
            reasons.append(f"Misma carrera: {candidate.career}")

        # Similar semester — within 2 (+10), same semester (+15)
        if user.semester and candidate.semester:
            diff = abs(user.semester - candidate.semester)
            if diff == 0:
                score += 15
                reasons.append("Mismo semestre")
            elif diff <= 2:
                score += 10

        # Mutual friends (+15 each)
        candidate_friends = candidate_friend_map.get(candidate.id, set())
        mutual = my_friends & candidate_friends
        mutual_count = len(mutual)
        if mutual_count > 0:
            score += mutual_count * 15
            reasons.append(f"{mutual_count} amigo{'s' if mutual_count > 1 else ''} en común")

        # Profile completeness bonus
        if candidate.avatar:
            score += 5
        if candidate.bio:
            score += 3

        # Include everyone from same university even if score is low
        if score > 0 or (user.university and candidate.university and user.university.lower() == candidate.university.lower()):
            if score == 0:
                score = 1  # Minimum score for same university with no other matches
                reasons.append(f"Estudia en {candidate.university}")
            suggestions.append({
                **user_brief(candidate),
                "score": score,
                "reasons": reasons,
                "mutualFriends": mutual_count,
            })

    # Sort by score descending, take top 30
    suggestions.sort(key=lambda x: x["score"], reverse=True)
    return suggestions[:30]


# ─── Polls ──────────────────────────────────────────────────

@router.post("/polls")
def create_poll(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    question = data.get("question", "").strip()
    options = data.get("options", [])
    is_anonymous = data.get("is_anonymous", False)
    expires_in_hours = data.get("expires_in_hours")
    wall_post_id = data.get("wall_post_id")
    community_post_id = data.get("community_post_id")

    if not question or len(options) < 2:
        raise HTTPException(400, "Se necesitan al menos 2 opciones")
    if len(options) > 6:
        raise HTTPException(400, "Máximo 6 opciones")

    expires_at = None
    if expires_in_hours:
        from datetime import timedelta
        expires_at = datetime.utcnow() + timedelta(hours=int(expires_in_hours))

    from database import Poll, PollOption
    poll = Poll(
        id=gen_id(), author_id=user.id, question=question,
        is_anonymous=is_anonymous, expires_at=expires_at,
        wall_post_id=wall_post_id, community_post_id=community_post_id,
    )
    db.add(poll)

    poll_options = []
    for i, opt_text in enumerate(options):
        opt = PollOption(id=gen_id(), poll_id=poll.id, text=opt_text.strip(), position=i)
        db.add(opt)
        poll_options.append(opt)

    from gamification import award_xp
    award_xp(user, 5, db)
    db.commit()

    return {
        "id": poll.id, "question": poll.question,
        "isAnonymous": poll.is_anonymous,
        "expiresAt": poll.expires_at.isoformat() if poll.expires_at else None,
        "totalVotes": 0,
        "options": [{"id": o.id, "text": o.text, "voteCount": 0, "percentage": 0} for o in poll_options],
        "userVoted": None,
        "author": user_brief(user),
        "createdAt": poll.created_at.isoformat(),
    }


@router.post("/polls/{poll_id}/vote")
def vote_poll(poll_id: str, data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from database import Poll, PollOption, PollVote
    poll = db.query(Poll).filter(Poll.id == poll_id).first()
    if not poll:
        raise HTTPException(404, "Encuesta no encontrada")
    if poll.expires_at and datetime.utcnow() > poll.expires_at:
        raise HTTPException(400, "La encuesta ha expirado")

    existing = db.query(PollVote).filter(PollVote.poll_id == poll_id, PollVote.user_id == user.id).first()
    if existing:
        raise HTTPException(400, "Ya votaste en esta encuesta")

    option_id = data.get("option_id")
    option = db.query(PollOption).filter(PollOption.id == option_id, PollOption.poll_id == poll_id).first()
    if not option:
        raise HTTPException(400, "Opción inválida")

    vote = PollVote(id=gen_id(), poll_id=poll_id, option_id=option_id, user_id=user.id)
    db.add(vote)
    option.vote_count = (option.vote_count or 0) + 1
    poll.total_votes = (poll.total_votes or 0) + 1

    from gamification import award_xp
    award_xp(user, 3, db)
    db.commit()

    # Return updated poll with results
    options = db.query(PollOption).filter(PollOption.poll_id == poll_id).order_by(PollOption.position).all()
    total = poll.total_votes or 1
    return {
        "id": poll.id, "totalVotes": poll.total_votes,
        "options": [{"id": o.id, "text": o.text, "voteCount": o.vote_count or 0,
                      "percentage": round(((o.vote_count or 0) / total) * 100)} for o in options],
        "userVoted": option_id,
    }


@router.get("/polls/{poll_id}")
def get_poll(poll_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from database import Poll, PollOption, PollVote
    poll = db.query(Poll).filter(Poll.id == poll_id).first()
    if not poll:
        raise HTTPException(404, "Encuesta no encontrada")

    options = db.query(PollOption).filter(PollOption.poll_id == poll_id).order_by(PollOption.position).all()
    user_vote = db.query(PollVote).filter(PollVote.poll_id == poll_id, PollVote.user_id == user.id).first()
    total = poll.total_votes or 1
    author = db.query(User).filter(User.id == poll.author_id).first()

    show_results = user_vote is not None or (poll.expires_at and datetime.utcnow() > poll.expires_at)

    return {
        "id": poll.id, "question": poll.question,
        "isAnonymous": poll.is_anonymous,
        "expiresAt": poll.expires_at.isoformat() if poll.expires_at else None,
        "totalVotes": poll.total_votes or 0,
        "options": [{
            "id": o.id, "text": o.text,
            "voteCount": (o.vote_count or 0) if show_results else None,
            "percentage": round(((o.vote_count or 0) / total) * 100) if show_results else None,
        } for o in options],
        "userVoted": user_vote.option_id if user_vote else None,
        "author": user_brief(author),
        "createdAt": poll.created_at.isoformat() if poll.created_at else "",
    }


# ─── Hashtags ──────────────────────────────────────────────

@router.get("/hashtags/trending")
def trending_hashtags(db: Session = Depends(get_db)):
    from datetime import timedelta

    from database import Hashtag
    week_ago = datetime.utcnow() - timedelta(days=7)
    tags = db.query(Hashtag).filter(
        Hashtag.last_used_at >= week_ago
    ).order_by(desc(Hashtag.usage_count)).limit(10).all()
    return [{"tag": t.tag, "count": t.usage_count or 0} for t in tags]


@router.get("/hashtags/{tag}/posts")
def posts_by_hashtag(tag: str, page: int = 1, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from database import Hashtag, PostHashtag
    hashtag = db.query(Hashtag).filter(Hashtag.tag == tag.lower()).first()
    if not hashtag:
        return []

    post_links = db.query(PostHashtag).filter(
        PostHashtag.hashtag_id == hashtag.id, PostHashtag.post_type == "wall"
    ).offset((page - 1) * 20).limit(20).all()

    post_ids = [pl.post_id for pl in post_links]
    if not post_ids:
        return []

    posts = db.query(WallPost).filter(WallPost.id.in_(post_ids)).order_by(desc(WallPost.created_at)).all()
    authors = {u.id: u for u in db.query(User).filter(User.id.in_([p.author_id for p in posts])).all()}

    return [{
        "id": p.id, "content": p.content, "imageUrl": p.image_url,
        "author": user_brief(authors.get(p.author_id)),
        "createdAt": p.created_at.isoformat() if p.created_at else "",
    } for p in posts]


@router.get("/users/autocomplete")
def autocomplete_users(q: str = "", db: Session = Depends(get_db)):
    if len(q) < 1:
        return []
    users = db.query(User).filter(
        User.username.ilike(f"{q}%")
    ).limit(5).all()
    return [user_brief(u) for u in users]


# ─── Skills & Endorsements ──────────────────────────────────

@router.post("/users/{user_id}/skills")
def add_skill(user_id: str, data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_id != user.id:
        raise HTTPException(403, "Solo puedes agregar skills a tu perfil")
    from database import UserSkill
    skill_name = data.get("skill_name", "").strip()
    if not skill_name:
        raise HTTPException(400, "Nombre de habilidad requerido")
    existing = db.query(UserSkill).filter(UserSkill.user_id == user.id, UserSkill.skill_name == skill_name).first()
    if existing:
        raise HTTPException(400, "Ya tienes esta habilidad")
    skill = UserSkill(id=gen_id(), user_id=user.id, skill_name=skill_name)
    db.add(skill)
    db.commit()
    return {"id": skill.id, "skillName": skill.skill_name, "endorsementCount": 0}


@router.delete("/skills/{skill_id}")
def remove_skill(skill_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from database import SkillEndorsement, UserSkill
    skill = db.query(UserSkill).filter(UserSkill.id == skill_id, UserSkill.user_id == user.id).first()
    if not skill:
        raise HTTPException(404, "Habilidad no encontrada")
    db.query(SkillEndorsement).filter(SkillEndorsement.skill_id == skill_id).delete(synchronize_session=False)
    db.delete(skill)
    db.commit()
    return {"status": "deleted"}


@router.get("/users/{user_id}/skills")
def get_skills(user_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from database import SkillEndorsement, UserSkill
    skills = db.query(UserSkill).filter(UserSkill.user_id == user_id).order_by(desc(UserSkill.endorsement_count)).all()
    result = []
    for s in skills:
        endorsed = db.query(SkillEndorsement).filter(
            SkillEndorsement.skill_id == s.id, SkillEndorsement.endorser_id == user.id
        ).first() is not None
        result.append({
            "id": s.id, "skillName": s.skill_name,
            "endorsementCount": s.endorsement_count or 0,
            "endorsed": endorsed,
        })
    return result


@router.post("/skills/{skill_id}/endorse")
def toggle_endorsement(skill_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from database import SkillEndorsement, UserSkill
    skill = db.query(UserSkill).filter(UserSkill.id == skill_id).first()
    if not skill:
        raise HTTPException(404, "Habilidad no encontrada")
    if skill.user_id == user.id:
        raise HTTPException(400, "No puedes validar tus propias habilidades")

    existing = db.query(SkillEndorsement).filter(
        SkillEndorsement.skill_id == skill_id, SkillEndorsement.endorser_id == user.id
    ).first()
    if existing:
        db.delete(existing)
        skill.endorsement_count = max(0, (skill.endorsement_count or 1) - 1)
    else:
        endorsement = SkillEndorsement(id=gen_id(), skill_id=skill_id, endorser_id=user.id)
        db.add(endorsement)
        skill.endorsement_count = (skill.endorsement_count or 0) + 1
        from gamification import award_xp
        award_xp(user, 5, db)
        from notification_routes import create_notification
        create_notification(db, skill.user_id, "endorsement",
            f"{user.first_name} validó tu habilidad: {skill.skill_name}",
            link=f"/user/{skill.user_id}", actor_id=user.id)
    db.commit()
    return {"endorsed": existing is None, "endorsementCount": skill.endorsement_count}


# ─── Bookmarks ──────────────────────────────────────────────

@router.post("/posts/{post_id}/bookmark")
def toggle_bookmark(post_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from database import PostBookmark
    existing = db.query(PostBookmark).filter(
        PostBookmark.user_id == user.id, PostBookmark.post_id == post_id
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"bookmarked": False}
    else:
        bookmark = PostBookmark(id=gen_id(), user_id=user.id, post_id=post_id, post_type="wall")
        db.add(bookmark)
        db.commit()
        return {"bookmarked": True}


@router.get("/bookmarks")
def get_bookmarks(page: int = 1, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from database import PostBookmark, WallPost
    bookmarks = db.query(PostBookmark).filter(
        PostBookmark.user_id == user.id
    ).order_by(desc(PostBookmark.created_at)).offset((page-1)*20).limit(20).all()

    post_ids = [b.post_id for b in bookmarks]
    if not post_ids:
        return []

    posts = db.query(WallPost).filter(WallPost.id.in_(post_ids)).all()
    authors = {u.id: u for u in db.query(User).filter(User.id.in_([p.author_id for p in posts])).all()}
    posts_map = {p.id: p for p in posts}

    result = []
    for b in bookmarks:
        p = posts_map.get(b.post_id)
        if not p:
            continue
        author = authors.get(p.author_id)
        result.append({
            "id": p.id, "content": p.content, "imageUrl": p.image_url,
            "author": user_brief(author) if author else None,
            "createdAt": p.created_at.isoformat() if p.created_at else "",
            "bookmarkedAt": b.created_at.isoformat() if b.created_at else "",
        })
    return result


# ─── Share / Repost ─────────────────────────────────────────

@router.post("/posts/{post_id}/share")
def share_post(post_id: str, data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from database import PostShare
    original = db.query(WallPost).filter(WallPost.id == post_id).first()
    if not original:
        raise HTTPException(404, "Post no encontrado")

    comment = data.get("comment", "").strip()

    # Create share record
    share = PostShare(id=gen_id(), user_id=user.id, original_post_id=post_id, comment=comment)
    db.add(share)

    # Create wall post with reference
    content = f"\U0001f4e2 Compartido\n\n{comment}" if comment else "\U0001f4e2 Compartido"
    shared_post = WallPost(
        id=gen_id(), author_id=user.id, wall_owner_id=user.id, content=content,
    )
    db.add(shared_post)

    # Notify original author
    if original.author_id != user.id:
        from notification_routes import create_notification
        create_notification(db, original.author_id, "share",
            f"{user.first_name} compartió tu publicación",
            link=f"/user/{user.id}", actor_id=user.id, reference_id=post_id)

    from gamification import award_xp
    award_xp(user, 3, db)
    db.commit()
    return {"status": "shared", "postId": shared_post.id}


# ─── Friend Lists ─────────────────────────────────────────────

@router.post("/friend-lists")
def create_friend_list(
    data: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    name = (data.get("name") or "").strip()
    if not name:
        raise HTTPException(400, "Nombre requerido")
    fl = FriendList(id=gen_id(), user_id=user.id, name=name)
    db.add(fl)
    db.commit()
    return {"id": fl.id, "name": fl.name}


@router.get("/friend-lists")
def get_friend_lists(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lists = db.query(FriendList).filter(FriendList.user_id == user.id).all()
    result = []
    for fl in lists:
        members = db.query(FriendListMember).filter(FriendListMember.list_id == fl.id).all()
        result.append({
            "id": fl.id,
            "name": fl.name,
            "memberCount": len(members),
            "members": [m.friend_id for m in members],
        })
    return result


@router.post("/friend-lists/{list_id}/members")
def add_to_friend_list(
    list_id: str,
    data: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    fl = db.query(FriendList).filter(FriendList.id == list_id, FriendList.user_id == user.id).first()
    if not fl:
        raise HTTPException(404, "Lista no encontrada")
    friend_id = data.get("friendId")
    existing = db.query(FriendListMember).filter(
        FriendListMember.list_id == list_id, FriendListMember.friend_id == friend_id
    ).first()
    if not existing:
        db.add(FriendListMember(id=gen_id(), list_id=list_id, friend_id=friend_id))
        db.commit()
    return {"status": "added"}


@router.delete("/friend-lists/{list_id}/members/{friend_id}")
def remove_from_friend_list(
    list_id: str,
    friend_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    fl = db.query(FriendList).filter(FriendList.id == list_id, FriendList.user_id == user.id).first()
    if not fl:
        raise HTTPException(404, "Lista no encontrada")
    member = db.query(FriendListMember).filter(
        FriendListMember.list_id == list_id, FriendListMember.friend_id == friend_id
    ).first()
    if member:
        db.delete(member)
        db.commit()
    return {"status": "removed"}


@router.delete("/friend-lists/{list_id}")
def delete_friend_list(
    list_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    fl = db.query(FriendList).filter(FriendList.id == list_id, FriendList.user_id == user.id).first()
    if fl:
        db.query(FriendListMember).filter(FriendListMember.list_id == list_id).delete()
        db.delete(fl)
        db.commit()
    return {"status": "deleted"}


# ─── Projects (Portfolio) ─────────────────────────────────
@router.get("/users/{user_id}/projects")
def get_projects(user_id: str, db: Session = Depends(get_db)):
    import json

    from database import UserProject
    projects = db.query(UserProject).filter(UserProject.user_id == user_id).order_by(UserProject.order_index, desc(UserProject.created_at)).all()
    return [{"id": p.id, "title": p.title, "description": p.description,
             "imageUrl": p.image_url, "projectUrl": p.project_url,
             "techStack": json.loads(p.tech_stack or "[]"),
             "category": p.category, "year": p.year,
             "createdAt": p.created_at.isoformat() if p.created_at else ""} for p in projects]

@router.post("/users/{user_id}/projects")
def add_project(user_id: str, data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    import json

    from database import UserProject
    if user.id != user_id:
        raise HTTPException(403, "Solo puedes agregar proyectos a tu perfil")
    p = UserProject(
        id=gen_id(), user_id=user.id,
        title=data.get("title","")[:200],
        description=data.get("description",""),
        image_url=data.get("imageUrl",""),
        project_url=data.get("projectUrl",""),
        tech_stack=json.dumps(data.get("techStack",[])),
        category=data.get("category","personal"),
        year=data.get("year"),
        order_index=data.get("orderIndex",0)
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return {"id": p.id, "title": p.title, "techStack": json.loads(p.tech_stack or "[]")}

@router.delete("/projects/{project_id}")
def delete_project(project_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from database import UserProject
    p = db.query(UserProject).filter(UserProject.id == project_id, UserProject.user_id == user.id).first()
    if not p:
        raise HTTPException(404, "Proyecto no encontrado")
    db.delete(p)
    db.commit()
    return {"deleted": True}

# ─── Publications ──────────────────────────────────────────
@router.get("/users/{user_id}/publications")
def get_publications(user_id: str, db: Session = Depends(get_db)):
    import json

    from database import UserPublication
    pubs = db.query(UserPublication).filter(UserPublication.user_id == user_id).order_by(desc(UserPublication.year), desc(UserPublication.created_at)).all()
    return [{"id": p.id, "type": p.pub_type, "title": p.title, "description": p.description,
             "year": p.year, "url": p.url, "institution": p.institution,
             "authors": json.loads(p.authors or "[]"), "doi": p.doi,
             "createdAt": p.created_at.isoformat() if p.created_at else ""} for p in pubs]

@router.post("/users/{user_id}/publications")
def add_publication(user_id: str, data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    import json

    from database import UserPublication
    if user.id != user_id:
        raise HTTPException(403, "Solo puedes agregar publicaciones a tu perfil")
    p = UserPublication(
        id=gen_id(), user_id=user.id,
        pub_type=data.get("type","paper"),
        title=data.get("title","")[:300],
        description=data.get("description",""),
        year=data.get("year"),
        url=data.get("url",""),
        institution=data.get("institution",""),
        authors=json.dumps(data.get("authors",[])),
        doi=data.get("doi","")
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return {"id": p.id, "title": p.title, "type": p.pub_type}

@router.delete("/publications/{pub_id}")
def delete_publication(pub_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from database import UserPublication
    p = db.query(UserPublication).filter(UserPublication.id == pub_id, UserPublication.user_id == user.id).first()
    if not p:
        raise HTTPException(404, "Publicación no encontrada")
    db.delete(p)
    db.commit()
    return {"deleted": True}
