"""Community/group system for students."""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_

from database import (get_db, User, Community, CommunityMember, CommunityPost,
                      CommunityPostLike, CommunityPostComment, CommunityResource,
                      CommunityEvent, CommunityEventRSVP, UserReport, gen_id)
from middleware import get_current_user
from moderation import check_content

router = APIRouter(prefix="/communities", tags=["communities"])


def user_brief(u):
    if not u: return None
    return {"id": u.id, "username": u.username, "firstName": u.first_name,
            "lastName": u.last_name, "avatar": u.avatar}


def community_brief(c, member_role=None):
    return {
        "id": c.id, "name": c.name, "description": c.description or "",
        "avatar": c.avatar, "coverImage": c.cover_image,
        "type": c.type, "category": c.category or "general",
        "university": c.university or "", "memberCount": c.member_count or 0,
        "createdAt": c.created_at.isoformat() if c.created_at else "",
        "memberRole": member_role,
    }


class CreateCommunityRequest(BaseModel):
    name: str
    description: str = ""
    type: str = "public"
    category: str = "general"
    university: str = ""
    rules: str = ""
    avatar: Optional[str] = None


class UpdateCommunityRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    category: Optional[str] = None
    rules: Optional[str] = None
    avatar: Optional[str] = None
    cover_image: Optional[str] = None


# ─── CRUD ───────────────────────────────────────────────────

@router.post("")
def create_community(req: CreateCommunityRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    community = Community(
        id=gen_id(), name=req.name, description=req.description,
        type=req.type, category=req.category, university=req.university or user.university or "",
        rules=req.rules, avatar=req.avatar, created_by=user.id, member_count=1,
    )
    db.add(community)
    member = CommunityMember(id=gen_id(), community_id=community.id, user_id=user.id, role="admin")
    db.add(member)

    from gamification import award_xp
    award_xp(user, 15, db)
    db.commit()
    return community_brief(community, "admin")


@router.get("")
def list_communities(search: str = "", category: str = "", university: str = "",
                     my: bool = False, page: int = 1,
                     user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(Community)
    if my:
        member_ids = [m.community_id for m in db.query(CommunityMember.community_id).filter(
            CommunityMember.user_id == user.id).all()]
        q = q.filter(Community.id.in_(member_ids))
    if search:
        q = q.filter(or_(Community.name.ilike(f"%{search}%"), Community.description.ilike(f"%{search}%")))
    if category:
        q = q.filter(Community.category == category)
    if university:
        q = q.filter(Community.university.ilike(f"%{university}%"))

    total = q.count()
    communities = q.order_by(desc(Community.member_count)).offset((page - 1) * 20).limit(20).all()

    # Get user memberships
    my_memberships = {m.community_id: m.role for m in db.query(CommunityMember).filter(
        CommunityMember.user_id == user.id,
        CommunityMember.community_id.in_([c.id for c in communities])
    ).all()}

    return {
        "total": total,
        "communities": [community_brief(c, my_memberships.get(c.id)) for c in communities],
    }


@router.get("/{community_id}")
def get_community(community_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c = db.query(Community).filter(Community.id == community_id).first()
    if not c:
        raise HTTPException(404, "Comunidad no encontrada")
    member = db.query(CommunityMember).filter(
        CommunityMember.community_id == community_id, CommunityMember.user_id == user.id
    ).first()
    creator = db.query(User).filter(User.id == c.created_by).first()
    result = community_brief(c, member.role if member else None)
    result["rules"] = c.rules or ""
    result["creator"] = user_brief(creator)
    result["isMember"] = member is not None
    return result


@router.put("/{community_id}")
def update_community(community_id: str, req: UpdateCommunityRequest,
                     user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    member = db.query(CommunityMember).filter(
        CommunityMember.community_id == community_id, CommunityMember.user_id == user.id,
        CommunityMember.role == "admin"
    ).first()
    if not member:
        raise HTTPException(403, "Solo admins pueden editar")
    c = db.query(Community).filter(Community.id == community_id).first()
    if req.name is not None: c.name = req.name
    if req.description is not None: c.description = req.description
    if req.type is not None: c.type = req.type
    if req.category is not None: c.category = req.category
    if req.rules is not None: c.rules = req.rules
    if req.avatar is not None: c.avatar = req.avatar
    if req.cover_image is not None: c.cover_image = req.cover_image
    c.updated_at = datetime.utcnow()
    db.commit()
    return community_brief(c, "admin")


@router.delete("/{community_id}")
def delete_community(community_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c = db.query(Community).filter(Community.id == community_id).first()
    if not c or c.created_by != user.id:
        raise HTTPException(403, "Solo el creador puede eliminar")
    db.query(CommunityPostComment).filter(CommunityPostComment.post_id.in_(
        db.query(CommunityPost.id).filter(CommunityPost.community_id == community_id)
    )).delete(synchronize_session=False)
    db.query(CommunityPostLike).filter(CommunityPostLike.post_id.in_(
        db.query(CommunityPost.id).filter(CommunityPost.community_id == community_id)
    )).delete(synchronize_session=False)
    db.query(CommunityPost).filter(CommunityPost.community_id == community_id).delete(synchronize_session=False)
    db.query(CommunityMember).filter(CommunityMember.community_id == community_id).delete(synchronize_session=False)
    db.delete(c)
    db.commit()
    return {"status": "deleted"}


# ─── Membership ─────────────────────────────────────────────

@router.post("/{community_id}/join")
def join_community(community_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c = db.query(Community).filter(Community.id == community_id).first()
    if not c:
        raise HTTPException(404, "Comunidad no encontrada")
    existing = db.query(CommunityMember).filter(
        CommunityMember.community_id == community_id, CommunityMember.user_id == user.id
    ).first()
    if existing:
        raise HTTPException(400, "Ya eres miembro")
    if c.type == "private":
        raise HTTPException(403, "Esta comunidad es privada")
    member = CommunityMember(id=gen_id(), community_id=community_id, user_id=user.id, role="member")
    db.add(member)
    c.member_count = (c.member_count or 0) + 1

    from gamification import award_xp
    award_xp(user, 5, db)
    db.commit()
    return {"status": "joined", "memberCount": c.member_count}


@router.post("/{community_id}/leave")
def leave_community(community_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    member = db.query(CommunityMember).filter(
        CommunityMember.community_id == community_id, CommunityMember.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(400, "No eres miembro")
    c = db.query(Community).filter(Community.id == community_id).first()
    if c and c.created_by == user.id:
        raise HTTPException(400, "El creador no puede salir. Elimina la comunidad.")
    db.delete(member)
    if c:
        c.member_count = max(0, (c.member_count or 1) - 1)
    db.commit()
    return {"status": "left"}


@router.get("/{community_id}/members")
def get_members(community_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    members = db.query(CommunityMember, User).join(
        User, User.id == CommunityMember.user_id
    ).filter(CommunityMember.community_id == community_id).order_by(
        CommunityMember.role, CommunityMember.joined_at
    ).all()
    return [{
        "id": m.id, "role": m.role, "joinedAt": m.joined_at.isoformat() if m.joined_at else "",
        "user": user_brief(u),
    } for m, u in members]


@router.post("/{community_id}/members/{user_id}/role")
def change_role(community_id: str, user_id: str, data: dict,
                user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    admin = db.query(CommunityMember).filter(
        CommunityMember.community_id == community_id, CommunityMember.user_id == user.id,
        CommunityMember.role == "admin"
    ).first()
    if not admin:
        raise HTTPException(403, "Solo admins")
    target = db.query(CommunityMember).filter(
        CommunityMember.community_id == community_id, CommunityMember.user_id == user_id
    ).first()
    if not target:
        raise HTTPException(404, "Miembro no encontrado")
    new_role = data.get("role", "member")
    if new_role not in ("admin", "moderator", "member"):
        new_role = "member"
    target.role = new_role
    db.commit()
    return {"status": "updated", "role": new_role}


@router.post("/{community_id}/members/{user_id}/remove")
def remove_member(community_id: str, user_id: str,
                  user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    mod = db.query(CommunityMember).filter(
        CommunityMember.community_id == community_id, CommunityMember.user_id == user.id,
        CommunityMember.role.in_(["admin", "moderator"])
    ).first()
    if not mod:
        raise HTTPException(403, "Solo admins/mods")
    target = db.query(CommunityMember).filter(
        CommunityMember.community_id == community_id, CommunityMember.user_id == user_id
    ).first()
    if not target:
        raise HTTPException(404, "Miembro no encontrado")
    c = db.query(Community).filter(Community.id == community_id).first()
    if c and c.created_by == user_id:
        raise HTTPException(400, "No puedes expulsar al creador")
    db.delete(target)
    if c:
        c.member_count = max(0, (c.member_count or 1) - 1)
    db.commit()
    return {"status": "removed"}


# ─── Posts ──────────────────────────────────────────────────

@router.post("/{community_id}/posts")
def create_community_post(community_id: str, data: dict,
                          user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    member = db.query(CommunityMember).filter(
        CommunityMember.community_id == community_id, CommunityMember.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(403, "Debes ser miembro para publicar")
    content = data.get("content", "").strip()
    image_url = data.get("image_url")
    is_announcement = data.get("is_announcement", False)
    if not content and not image_url:
        raise HTTPException(400, "El post no puede estar vacío")

    mod_result = check_content(content)
    if not mod_result["allowed"]:
        raise HTTPException(400, mod_result["reason"])

    post = CommunityPost(
        id=gen_id(), community_id=community_id, author_id=user.id,
        content=content, image_url=image_url,
        is_announcement=is_announcement if member.role in ("admin", "moderator") else False,
    )
    db.add(post)

    from gamification import award_xp
    award_xp(user, 5, db)
    db.commit()

    return {
        "id": post.id, "communityId": post.community_id,
        "content": post.content, "imageUrl": post.image_url,
        "isPinned": post.is_pinned,
        "isAnnouncement": post.is_announcement or False,
        "likeCount": 0, "commentCount": 0,
        "author": user_brief(user),
        "createdAt": post.created_at.isoformat() if post.created_at else "",
        "reactions": {}, "userReaction": None,
    }


@router.get("/{community_id}/posts")
def get_community_posts(community_id: str, page: int = 1,
                        user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(CommunityPost).filter(CommunityPost.community_id == community_id)
    posts = q.order_by(
        desc(CommunityPost.is_announcement),
        desc(CommunityPost.is_pinned),
        desc(CommunityPost.created_at)
    ).offset((page - 1) * 20).limit(20).all()

    author_ids = list(set(p.author_id for p in posts))
    authors = {u.id: u for u in db.query(User).filter(User.id.in_(author_ids)).all()} if author_ids else {}

    result = []
    for p in posts:
        # Get reactions
        from sqlalchemy import func as sqlfunc
        reactions_q = db.query(CommunityPostLike.reaction_type, sqlfunc.count(CommunityPostLike.id)).filter(
            CommunityPostLike.post_id == p.id
        ).group_by(CommunityPostLike.reaction_type).all()
        reactions = {r: c for r, c in reactions_q}

        user_reaction = db.query(CommunityPostLike.reaction_type).filter(
            CommunityPostLike.post_id == p.id, CommunityPostLike.user_id == user.id
        ).scalar()

        result.append({
            "id": p.id, "communityId": p.community_id,
            "content": p.content, "imageUrl": p.image_url,
            "isPinned": p.is_pinned,
            "isAnnouncement": p.is_announcement or False,
            "likeCount": sum(reactions.values()) if reactions else 0,
            "commentCount": p.comment_count or 0,
            "author": user_brief(authors.get(p.author_id)),
            "createdAt": p.created_at.isoformat() if p.created_at else "",
            "reactions": reactions, "userReaction": user_reaction,
        })
    return result


@router.post("/posts/{post_id}/like")
def like_community_post(post_id: str, data: dict = None,
                        user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data is None:
        data = {}
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post no encontrado")
    reaction_type = data.get("reaction_type", "like")
    existing = db.query(CommunityPostLike).filter(
        CommunityPostLike.post_id == post_id, CommunityPostLike.user_id == user.id
    ).first()
    if existing:
        if existing.reaction_type == reaction_type:
            db.delete(existing)
            post.like_count = max(0, (post.like_count or 1) - 1)
        else:
            existing.reaction_type = reaction_type
    else:
        like = CommunityPostLike(id=gen_id(), post_id=post_id, user_id=user.id, reaction_type=reaction_type)
        db.add(like)
        post.like_count = (post.like_count or 0) + 1
    db.commit()
    return {"likeCount": post.like_count, "liked": existing is None or existing.reaction_type != reaction_type}


@router.post("/posts/{post_id}/comments")
def comment_community_post(post_id: str, data: dict,
                           user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post no encontrado")
    content = data.get("content", "").strip()
    if not content:
        raise HTTPException(400, "Comentario vacío")
    mod_result = check_content(content)
    if not mod_result["allowed"]:
        raise HTTPException(400, mod_result["reason"])
    comment = CommunityPostComment(id=gen_id(), post_id=post_id, author_id=user.id, content=content)
    db.add(comment)
    post.comment_count = (post.comment_count or 0) + 1
    db.commit()
    return {"id": comment.id, "content": comment.content, "author": user_brief(user),
            "createdAt": comment.created_at.isoformat() if comment.created_at else ""}


@router.get("/posts/{post_id}/comments")
def get_community_comments(post_id: str, db: Session = Depends(get_db)):
    comments = db.query(CommunityPostComment, User).join(
        User, User.id == CommunityPostComment.author_id
    ).filter(CommunityPostComment.post_id == post_id).order_by(
        CommunityPostComment.created_at
    ).all()
    return [{"id": c.id, "content": c.content, "author": user_brief(u),
             "createdAt": c.created_at.isoformat() if c.created_at else ""} for c, u in comments]


@router.post("/posts/{post_id}/pin")
def pin_post(post_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post no encontrado")
    mod = db.query(CommunityMember).filter(
        CommunityMember.community_id == post.community_id, CommunityMember.user_id == user.id,
        CommunityMember.role.in_(["admin", "moderator"])
    ).first()
    if not mod:
        raise HTTPException(403, "Solo admins/mods")
    post.is_pinned = not post.is_pinned
    db.commit()
    return {"isPinned": post.is_pinned}


@router.delete("/posts/{post_id}")
def delete_community_post(post_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post no encontrado")
    is_author = post.author_id == user.id
    is_mod = db.query(CommunityMember).filter(
        CommunityMember.community_id == post.community_id, CommunityMember.user_id == user.id,
        CommunityMember.role.in_(["admin", "moderator"])
    ).first()
    if not is_author and not is_mod:
        raise HTTPException(403, "Sin permisos")
    db.query(CommunityPostComment).filter(CommunityPostComment.post_id == post_id).delete(synchronize_session=False)
    db.query(CommunityPostLike).filter(CommunityPostLike.post_id == post_id).delete(synchronize_session=False)
    db.delete(post)
    db.commit()
    return {"status": "deleted"}


@router.post("/posts/{post_id}/report")
def report_post(post_id: str, data: dict,
                user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post no encontrado")
    reason = data.get("reason", "").strip()
    if not reason:
        raise HTTPException(400, "Debes indicar un motivo")
    # Store as a UserReport (reporter → post author)
    report = UserReport(
        id=gen_id(), reporter_id=user.id, reported_id=post.author_id,
        reason=f"[Post {post_id}] {reason}",
    )
    db.add(report)
    db.commit()
    return {"status": "reported"}


@router.get("/suggestions")
def community_suggestions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    my_ids = [m.community_id for m in db.query(CommunityMember.community_id).filter(
        CommunityMember.user_id == user.id).all()]
    q = db.query(Community).filter(Community.type == "public")
    if my_ids:
        q = q.filter(~Community.id.in_(my_ids))
    # Prioritize same university
    suggestions = q.order_by(
        desc(Community.university == (user.university or "")),
        desc(Community.member_count)
    ).limit(10).all()
    return [community_brief(c) for c in suggestions]


@router.get("/trending")
def get_trending_communities(
    limit: int = 6,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Communities with most activity in the last 7 days."""
    from datetime import timedelta

    week_ago = datetime.utcnow() - timedelta(days=7)

    # Count posts per community in last 7 days
    activity = db.query(
        CommunityPost.community_id,
        func.count(CommunityPost.id).label("post_count")
    ).filter(
        CommunityPost.created_at >= week_ago
    ).group_by(CommunityPost.community_id).subquery()

    communities = db.query(Community).join(
        activity, Community.id == activity.c.community_id, isouter=True
    ).filter(
        Community.type == "public"
    ).order_by(
        func.coalesce(activity.c.post_count, 0).desc(),
        Community.member_count.desc()
    ).limit(limit).all()

    result = []
    for c in communities:
        my_membership = db.query(CommunityMember).filter(
            CommunityMember.community_id == c.id,
            CommunityMember.user_id == user.id
        ).first()
        result.append({
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "avatar": c.avatar,
            "coverImage": c.cover_image,
            "category": c.category,
            "memberCount": c.member_count,
            "isMember": my_membership is not None,
        })
    return result


# ─── Community Resources ─────────────────────────────────────────────────────

class CreateResourceRequest(BaseModel):
    resource_type: str = "link"
    title: str
    url: Optional[str] = None
    description: str = ""


@router.get("/{community_id}/resources")
def get_community_resources(
    community_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = db.query(CommunityMember).filter(
        CommunityMember.community_id == community_id,
        CommunityMember.user_id == user.id
    ).first()
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(404, "Comunidad no encontrada")
    if community.type == "private" and not member:
        raise HTTPException(403, "Comunidad privada")

    resources = db.query(CommunityResource).filter(
        CommunityResource.community_id == community_id
    ).order_by(CommunityResource.created_at.desc()).all()

    result = []
    for r in resources:
        uploader = db.query(User).filter(User.id == r.uploader_id).first()
        result.append({
            "id": r.id,
            "resourceType": r.resource_type,
            "title": r.title,
            "url": r.url,
            "description": r.description,
            "downloadCount": r.download_count,
            "uploaderId": r.uploader_id,
            "uploaderName": f"{uploader.first_name} {uploader.last_name}" if uploader else "Usuario",
            "uploaderUsername": uploader.username if uploader else "",
            "createdAt": r.created_at.isoformat() if r.created_at else "",
        })
    return result


@router.post("/{community_id}/resources")
def add_community_resource(
    community_id: str,
    req: CreateResourceRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = db.query(CommunityMember).filter(
        CommunityMember.community_id == community_id,
        CommunityMember.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(403, "No eres miembro de esta comunidad")

    resource = CommunityResource(
        id=gen_id(),
        community_id=community_id,
        uploader_id=user.id,
        resource_type=req.resource_type,
        title=req.title,
        url=req.url,
        description=req.description,
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return {"id": resource.id, "title": resource.title, "resourceType": resource.resource_type, "createdAt": resource.created_at.isoformat()}


@router.delete("/{community_id}/resources/{resource_id}")
def delete_community_resource(
    community_id: str,
    resource_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resource = db.query(CommunityResource).filter(
        CommunityResource.id == resource_id,
        CommunityResource.community_id == community_id
    ).first()
    if not resource:
        raise HTTPException(404, "Recurso no encontrado")
    member = db.query(CommunityMember).filter(
        CommunityMember.community_id == community_id,
        CommunityMember.user_id == user.id
    ).first()
    # Only uploader or admin/mod can delete
    if resource.uploader_id != user.id and (not member or member.role not in ("admin", "moderator")):
        raise HTTPException(403, "Sin permisos")
    db.delete(resource)
    db.commit()
    return {"success": True}


# ─── Community Events ─────────────────────────────────────────────────────────

class CreateEventRequest(BaseModel):
    title: str
    description: str = ""
    event_date: str  # ISO format
    location: str = ""
    meet_url: Optional[str] = None


@router.get("/{community_id}/events")
def get_community_events(
    community_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    events = db.query(CommunityEvent).filter(
        CommunityEvent.community_id == community_id
    ).order_by(CommunityEvent.event_date.asc()).all()

    result = []
    for e in events:
        creator = db.query(User).filter(User.id == e.creator_id).first()
        my_rsvp = db.query(CommunityEventRSVP).filter(
            CommunityEventRSVP.event_id == e.id,
            CommunityEventRSVP.user_id == user.id
        ).first()
        result.append({
            "id": e.id,
            "title": e.title,
            "description": e.description,
            "eventDate": e.event_date.isoformat() if e.event_date else "",
            "location": e.location,
            "meetUrl": e.meet_url,
            "rsvpCount": e.rsvp_count,
            "myRsvp": my_rsvp.status if my_rsvp else None,
            "creatorName": f"{creator.first_name}" if creator else "Usuario",
            "createdAt": e.created_at.isoformat() if e.created_at else "",
        })
    return result


@router.post("/{community_id}/events")
def create_community_event(
    community_id: str,
    req: CreateEventRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = db.query(CommunityMember).filter(
        CommunityMember.community_id == community_id,
        CommunityMember.user_id == user.id
    ).first()
    if not member or member.role not in ("admin", "moderator"):
        raise HTTPException(403, "Solo administradores pueden crear eventos")

    try:
        event_dt = datetime.fromisoformat(req.event_date.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(400, "Formato de fecha inválido")

    event = CommunityEvent(
        id=gen_id(),
        community_id=community_id,
        creator_id=user.id,
        title=req.title,
        description=req.description,
        event_date=event_dt,
        location=req.location,
        meet_url=req.meet_url,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return {"id": event.id, "title": event.title, "eventDate": event.event_date.isoformat()}


@router.post("/{community_id}/events/{event_id}/rsvp")
def rsvp_event(
    community_id: str,
    event_id: str,
    status: str = "going",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if status not in ("going", "maybe", "not_going"):
        raise HTTPException(400, "Estado inválido")

    event = db.query(CommunityEvent).filter(
        CommunityEvent.id == event_id,
        CommunityEvent.community_id == community_id
    ).first()
    if not event:
        raise HTTPException(404, "Evento no encontrado")

    existing = db.query(CommunityEventRSVP).filter(
        CommunityEventRSVP.event_id == event_id,
        CommunityEventRSVP.user_id == user.id
    ).first()

    if existing:
        old_status = existing.status
        existing.status = status
        # Update count
        if old_status == "going" and status != "going":
            event.rsvp_count = max(0, event.rsvp_count - 1)
        elif old_status != "going" and status == "going":
            event.rsvp_count += 1
    else:
        rsvp = CommunityEventRSVP(id=gen_id(), event_id=event_id, user_id=user.id, status=status)
        db.add(rsvp)
        if status == "going":
            event.rsvp_count += 1

    db.commit()
    return {"success": True, "status": status, "rsvpCount": event.rsvp_count}


@router.delete("/{community_id}/events/{event_id}")
def delete_community_event(
    community_id: str,
    event_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = db.query(CommunityEvent).filter(
        CommunityEvent.id == event_id,
        CommunityEvent.community_id == community_id
    ).first()
    if not event:
        raise HTTPException(404, "Evento no encontrado")
    member = db.query(CommunityMember).filter(
        CommunityMember.community_id == community_id,
        CommunityMember.user_id == user.id
    ).first()
    if event.creator_id != user.id and (not member or member.role not in ("admin", "moderator")):
        raise HTTPException(403, "Sin permisos")
    db.delete(event)
    db.commit()
    return {"success": True}


# ─── Community Cover Upload ───────────────────────────────────────────────────

@router.post("/{community_id}/cover")
async def upload_community_cover(
    community_id: str,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload community cover image. Admin only."""
    member = db.query(CommunityMember).filter(
        CommunityMember.community_id == community_id,
        CommunityMember.user_id == user.id,
        CommunityMember.role == "admin"
    ).first()
    if not member:
        raise HTTPException(403, "Solo administradores pueden cambiar la portada")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(413, "Imagen demasiado grande (máx 5 MB)")

    import uuid as _uuid
    from database import DATA_DIR
    covers_dir = DATA_DIR / "uploads" / "community_covers"
    covers_dir.mkdir(parents=True, exist_ok=True)

    ext = "jpg"
    if file.filename and "." in file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower()

    # Validar tipo de archivo — solo imágenes permitidas
    allowed_image_exts = {"jpg", "jpeg", "png", "gif", "webp"}
    if ext not in allowed_image_exts:
        raise HTTPException(400, f"Tipo de archivo no permitido. Solo: {', '.join(allowed_image_exts)}")

    filename = f"{community_id}_{_uuid.uuid4().hex[:8]}.{ext}"
    with open(covers_dir / filename, "wb") as f:
        f.write(content)

    url = f"/uploads/community_covers/{filename}"
    community = db.query(Community).filter(Community.id == community_id).first()
    if community:
        community.cover_image = url
        db.commit()
    return {"url": url}
