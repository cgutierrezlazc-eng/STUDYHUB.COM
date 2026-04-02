"""Community/group system for students."""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_

from database import (get_db, User, Community, CommunityMember, CommunityPost,
                      CommunityPostLike, CommunityPostComment, gen_id)
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
    if not content and not image_url:
        raise HTTPException(400, "El post no puede estar vacío")

    mod_result = check_content(content)
    if not mod_result["allowed"]:
        raise HTTPException(400, mod_result["reason"])

    post = CommunityPost(
        id=gen_id(), community_id=community_id, author_id=user.id,
        content=content, image_url=image_url,
    )
    db.add(post)

    from gamification import award_xp
    award_xp(user, 5, db)
    db.commit()

    return {
        "id": post.id, "communityId": post.community_id,
        "content": post.content, "imageUrl": post.image_url,
        "isPinned": post.is_pinned, "likeCount": 0, "commentCount": 0,
        "author": user_brief(user),
        "createdAt": post.created_at.isoformat() if post.created_at else "",
        "reactions": {}, "userReaction": None,
    }


@router.get("/{community_id}/posts")
def get_community_posts(community_id: str, page: int = 1,
                        user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(CommunityPost).filter(CommunityPost.community_id == community_id)
    posts = q.order_by(desc(CommunityPost.is_pinned), desc(CommunityPost.created_at)).offset(
        (page - 1) * 20).limit(20).all()

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
            "likeCount": sum(reactions.values()) if reactions else 0,
            "commentCount": p.comment_count or 0,
            "author": user_brief(authors.get(p.author_id)),
            "createdAt": p.created_at.isoformat() if p.created_at else "",
            "reactions": reactions, "userReaction": user_reaction,
        })
    return result


@router.post("/posts/{post_id}/like")
def like_community_post(post_id: str, data: dict = {},
                        user: User = Depends(get_current_user), db: Session = Depends(get_db)):
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
