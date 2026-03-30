"""
Social routes: friendships, wall posts, likes, comments, public profiles.
"""
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from database import (
    get_db, User, Friendship, WallPost, PostLike, PostComment, BlockedUser, UserReport, gen_id
)
from middleware import get_current_user
try:
    from notifications import notify_friend_request, notify_friend_accepted, notify_wall_post
except ImportError:
    notify_friend_request = notify_friend_accepted = notify_wall_post = None

router = APIRouter(prefix="/social", tags=["social"])


# ─── Request Models ────────────────────────────────────────────

class FriendRequestBody(BaseModel):
    addressee_id: str


class WallPostBody(BaseModel):
    content: str
    image_url: Optional[str] = None


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

    friends = []
    for f in friendships:
        friend_id = f.addressee_id if f.requester_id == user.id else f.requester_id
        friend = db.query(User).filter(User.id == friend_id).first()
        if friend:
            friends.append({**user_brief(friend), "friendshipId": f.id, "since": f.updated_at.isoformat()})
    return friends


@router.get("/friend-requests")
def get_incoming_requests(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    requests = db.query(Friendship).filter(
        Friendship.addressee_id == user.id,
        Friendship.status == "pending",
    ).all()

    result = []
    for r in requests:
        requester = db.query(User).filter(User.id == r.requester_id).first()
        if requester:
            result.append({"id": r.id, "user": user_brief(requester), "createdAt": r.created_at.isoformat()})
    return result


@router.get("/friend-requests/sent")
def get_sent_requests(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    requests = db.query(Friendship).filter(
        Friendship.requester_id == user.id,
        Friendship.status == "pending",
    ).all()

    result = []
    for r in requests:
        addressee = db.query(User).filter(User.id == r.addressee_id).first()
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
        User.is_banned == False,
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

    # Non-friends get limited info only
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

        return {
            "id": target.id,
            "username": target.username,
            "userNumber": target.user_number,
            "firstName": target.first_name,
            "lastName": target.last_name,
            "avatar": target.avatar or "",
            "university": target.university,
            "career": target.career,
            "isFriend": False,
            "friendshipStatus": friendship_status,
            "friendshipId": friendship_id,
            "friendCount": 0,
            "isOwnProfile": False,
            "restricted": True,
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

    return {
        **user_brief(target),
        "isFriend": is_friend,
        "friendshipStatus": friendship_status,
        "friendshipId": friendship_id,
        "friendCount": friend_count,
        "isOwnProfile": is_own,
        "restricted": False,
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

    if not body.content.strip():
        raise HTTPException(400, "El contenido no puede estar vacío")

    # Basic moderation
    from moderation import check_content
    mod = check_content(body.content)
    if not mod["allowed"]:
        raise HTTPException(400, f"Contenido bloqueado: {mod['reason']}")

    post = WallPost(
        author_id=user.id,
        wall_owner_id=wall_owner_id,
        content=body.content.strip(),
        image_url=body.image_url,
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    # Notify wall owner if someone else posted on their wall
    if wall_owner_id != user.id and notify_wall_post:
        wall_owner = db.query(User).filter(User.id == wall_owner_id).first()
        if wall_owner:
            notify_wall_post(db, wall_owner, user, body.content[:100])

    author = db.query(User).filter(User.id == post.author_id).first()
    return {
        "id": post.id,
        "author": user_brief(author) if author else None,
        "wallOwnerId": post.wall_owner_id,
        "content": post.content,
        "imageUrl": post.image_url,
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
    # Only friends and self can see wall posts
    if wall_owner_id != user.id and not are_friends(db, user.id, wall_owner_id):
        return []

    per_page = 20
    posts = db.query(WallPost).filter(
        WallPost.wall_owner_id == wall_owner_id
    ).order_by(WallPost.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for post in posts:
        author = db.query(User).filter(User.id == post.author_id).first()
        like_count = db.query(PostLike).filter(PostLike.post_id == post.id).count()
        liked = db.query(PostLike).filter(PostLike.post_id == post.id, PostLike.user_id == user.id).first() is not None
        comment_count = db.query(PostComment).filter(PostComment.post_id == post.id).count()

        result.append({
            "id": post.id,
            "author": user_brief(author) if author else None,
            "wallOwnerId": post.wall_owner_id,
            "content": post.content,
            "imageUrl": post.image_url,
            "likes": like_count,
            "liked": liked,
            "commentCount": comment_count,
            "createdAt": post.created_at.isoformat(),
        })
    return result


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
        return {"liked": True}


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

    author = db.query(User).filter(User.id == comment.author_id).first()
    return {
        "id": comment.id,
        "author": user_brief(author) if author else None,
        "content": comment.content,
        "createdAt": comment.created_at.isoformat(),
    }


@router.get("/posts/{post_id}/comments")
def get_comments(
    post_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    comments = db.query(PostComment).filter(
        PostComment.post_id == post_id
    ).order_by(PostComment.created_at.asc()).all()

    result = []
    for c in comments:
        author = db.query(User).filter(User.id == c.author_id).first()
        result.append({
            "id": c.id,
            "author": user_brief(author) if author else None,
            "content": c.content,
            "createdAt": c.created_at.isoformat(),
        })
    return result


# ─── Feed (friends' recent posts) ─────────────────────────────

@router.get("/feed")
def get_feed(
    page: int = Query(1, ge=1),
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

    per_page = 20
    posts = db.query(WallPost).filter(
        WallPost.author_id.in_(friend_ids)
    ).order_by(WallPost.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for post in posts:
        author = db.query(User).filter(User.id == post.author_id).first()
        wall_owner = db.query(User).filter(User.id == post.wall_owner_id).first()
        like_count = db.query(PostLike).filter(PostLike.post_id == post.id).count()
        liked = db.query(PostLike).filter(PostLike.post_id == post.id, PostLike.user_id == user.id).first() is not None
        comment_count = db.query(PostComment).filter(PostComment.post_id == post.id).count()

        result.append({
            "id": post.id,
            "author": user_brief(author) if author else None,
            "wallOwner": user_brief(wall_owner) if wall_owner else None,
            "content": post.content,
            "imageUrl": post.image_url,
            "likes": like_count,
            "liked": liked,
            "commentCount": comment_count,
            "createdAt": post.created_at.isoformat(),
        })
    return result


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

    result = []
    for post in posts:
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
            "likes": like_count,
            "liked": liked,
            "commentCount": comment_count,
            "createdAt": post.created_at.isoformat(),
        })

    # TODO: Merge academic activity items (quiz_generated, guide_generated,
    #       document_uploaded, friend_added) and sort by createdAt.
    return result


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

    # Get candidate users
    candidates = db.query(User).filter(
        User.id.notin_(exclude_ids),
        User.is_banned == False,
    ).limit(100).all()

    # Build friend sets for mutual friend calculation
    def get_friend_set(uid: str) -> set:
        fs = db.query(Friendship).filter(
            Friendship.status == "accepted",
            or_(Friendship.requester_id == uid, Friendship.addressee_id == uid),
        ).all()
        s = set()
        for f in fs:
            s.add(f.addressee_id if f.requester_id == uid else f.requester_id)
        return s

    my_friends = friend_ids

    suggestions = []
    for candidate in candidates:
        score = 0
        reasons = []

        # Same university
        if user.university and candidate.university and user.university.lower() == candidate.university.lower():
            score += 30
            reasons.append(f"Misma universidad: {candidate.university}")

        # Same career
        if user.career and candidate.career and user.career.lower() == candidate.career.lower():
            score += 25
            reasons.append(f"Misma carrera: {candidate.career}")

        # Similar semester
        if user.semester and candidate.semester:
            diff = abs(user.semester - candidate.semester)
            if diff <= 2:
                score += 10
                if diff == 0:
                    reasons.append("Mismo semestre")

        # Mutual friends
        candidate_friends = get_friend_set(candidate.id)
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

        if score > 0:
            suggestions.append({
                **user_brief(candidate),
                "score": score,
                "reasons": reasons,
                "mutualFriends": mutual_count,
            })

    # Sort by score descending, take top 20
    suggestions.sort(key=lambda x: x["score"], reverse=True)
    return suggestions[:20]
