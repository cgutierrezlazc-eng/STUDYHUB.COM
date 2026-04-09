"""
Admin routes: user management, moderation, stats.
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from database import (
    get_db, User, Message, Conversation, ModerationLog,
    Friendship, WallPost, BlockedUser, UserReport, PaymentLog, gen_id
)
from middleware import require_admin, require_owner
from auth_routes import user_to_dict

router = APIRouter(prefix="/admin", tags=["admin"])


class BanRequest(BaseModel):
    reason: str = ""


# ─── Users ───────────────────────────────────────────────────────

@router.get("/users")
def list_users(
    page: int = 1,
    per_page: int = 50,
    search: Optional[str] = None,
    filter: Optional[str] = None,  # all | banned | unverified | admin
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(User)

    if search:
        query = query.filter(
            User.first_name.ilike(f"%{search}%") |
            User.last_name.ilike(f"%{search}%") |
            User.email.ilike(f"%{search}%") |
            User.username.ilike(f"%{search}%")
        )

    if filter == "banned":
        query = query.filter(User.is_banned == True)
    elif filter == "unverified":
        query = query.filter(User.email_verified == False)
    elif filter == "admin":
        query = query.filter(User.is_admin == True)

    total = query.count()
    users = query.order_by(desc(User.created_at)).offset((page - 1) * per_page).limit(per_page).all()

    return {
        "users": [user_to_dict(u) for u in users],
        "total": total,
        "page": page,
        "pages": (total + per_page - 1) // per_page,
    }


@router.get("/users/{user_id}")
def get_user(user_id: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Usuario no encontrado")

    data = user_to_dict(user)
    # Add message count
    data["messageCount"] = db.query(Message).filter(Message.sender_id == user_id).count()
    return data


@router.post("/users/{user_id}/ban")
def ban_user(user_id: str, req: BanRequest, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    if user.is_admin:
        raise HTTPException(400, "No se puede banear a un administrador")

    user.is_banned = True
    user.ban_reason = req.reason or "Violación de términos de servicio"

    db.add(ModerationLog(
        id=gen_id(),
        user_id=user_id,
        action="ban",
        reason=req.reason,
        admin_id=admin.id,
    ))

    db.commit()
    return {"banned": True}


@router.post("/users/{user_id}/unban")
def unban_user(user_id: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Usuario no encontrado")

    user.is_banned = False
    user.ban_reason = None

    db.add(ModerationLog(
        id=gen_id(),
        user_id=user_id,
        action="unban",
        admin_id=admin.id,
    ))

    db.commit()
    return {"unbanned": True}


@router.delete("/users/{user_id}")
def delete_user(user_id: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Permanently delete a user account. Owner only."""
    if admin.role != "owner":
        raise HTTPException(403, "Solo el propietario puede eliminar cuentas")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "Usuario no encontrado")

    if target.role == "owner":
        raise HTTPException(400, "No se puede eliminar la cuenta del propietario")

    username = target.username
    email = target.email

    # Delete related data
    from database import (
        WallPost, PostLike, PostComment, Friendship, FriendRequest,
        ConversationParticipant, Message, UserCourseProgress,
        StudentCV, PushSubscription, UserExerciseHistory,
    )
    db.query(PostLike).filter(PostLike.user_id == user_id).delete()
    db.query(PostComment).filter(PostComment.user_id == user_id).delete()
    db.query(WallPost).filter(WallPost.author_id == user_id).delete()
    db.query(WallPost).filter(WallPost.wall_owner_id == user_id).delete()
    db.query(Friendship).filter(
        (Friendship.user_id == user_id) | (Friendship.friend_id == user_id)
    ).delete(synchronize_session=False)
    db.query(FriendRequest).filter(
        (FriendRequest.sender_id == user_id) | (FriendRequest.receiver_id == user_id)
    ).delete(synchronize_session=False)
    db.query(ConversationParticipant).filter(
        ConversationParticipant.user_id == user_id
    ).delete()
    db.query(Message).filter(Message.sender_id == user_id).delete()
    db.query(UserCourseProgress).filter(UserCourseProgress.user_id == user_id).delete()
    db.query(StudentCV).filter(StudentCV.user_id == user_id).delete()
    db.query(PushSubscription).filter(PushSubscription.user_id == user_id).delete()
    db.query(UserExerciseHistory).filter(UserExerciseHistory.user_id == user_id).delete()

    db.add(ModerationLog(
        id=gen_id(),
        user_id=user_id,
        action="delete_account",
        reason=f"Cuenta eliminada: {username} ({email})",
        admin_id=admin.id,
    ))

    db.delete(target)
    db.commit()
    return {"deleted": True, "username": username}


# ─── Purge Demo Data ──────────────────────────────────────────

KEEP_EMAILS = {
    "ceo@conniku.com",          # CEO
    "vanesa",                    # partial match
    "jose leiva", "joseleiva",   # partial match
    "margarita",                 # partial match
    "jennifer",                  # partial match
}

def _should_keep(user) -> bool:
    """Check if user should be kept during purge."""
    if user.role == "owner":
        return True
    email = (user.email or "").lower()
    fname = (user.first_name or "").lower()
    lname = (user.last_name or "").lower()
    full = f"{fname} {lname}"
    for k in KEEP_EMAILS:
        if k in email or k in fname or k in lname or k in full:
            return True
    return False


@router.post("/purge-demo-data")
def purge_demo_data(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Delete ALL users except CEO, Vanesa, Jose Leiva, Margarita, Jennifer. Owner only."""
    if admin.role != "owner":
        raise HTTPException(403, "Solo el propietario puede purgar datos")

    from database import (
        WallPost, PostLike, PostComment, Friendship,
        ConversationParticipant, Message, UserCourseProgress,
        StudentCV, PushSubscription, UserExerciseHistory,
    )
    from hr_routes import Employee as HREmployee, EmployeeDocument as HREmployeeDocument, PayrollRecord as HRPayrollRecord

    all_users = db.query(User).all()
    deleted = []
    kept = []

    for user in all_users:
        if _should_keep(user):
            kept.append({"id": user.id, "email": user.email, "name": f"{user.first_name} {user.last_name}"})
            continue

        uid = user.id
        # Clean related data
        try:
            db.query(PostLike).filter(PostLike.user_id == uid).delete()
            db.query(PostComment).filter(PostComment.user_id == uid).delete()
            db.query(WallPost).filter((WallPost.author_id == uid) | (WallPost.wall_owner_id == uid)).delete(synchronize_session=False)
            db.query(Friendship).filter((Friendship.user_id == uid) | (Friendship.friend_id == uid)).delete(synchronize_session=False)
            db.query(ConversationParticipant).filter(ConversationParticipant.user_id == uid).delete()
            db.query(Message).filter(Message.sender_id == uid).delete()
            db.query(UserCourseProgress).filter(UserCourseProgress.user_id == uid).delete()
            db.query(StudentCV).filter(StudentCV.user_id == uid).delete()
            db.query(PushSubscription).filter(PushSubscription.user_id == uid).delete()
            db.query(UserExerciseHistory).filter(UserExerciseHistory.user_id == uid).delete()
        except Exception:
            pass

        deleted.append({"id": uid, "email": user.email, "name": f"{user.first_name} {user.last_name}"})
        db.delete(user)

    # Also clean orphan HR employees not linked to kept users
    kept_ids = {u["id"] for u in kept}
    all_hr = db.query(HREmployee).all()
    deleted_employees = []
    for emp in all_hr:
        # Check if employee name matches kept list
        fname = (emp.first_name or "").lower()
        lname = (emp.last_name or "").lower()
        full = f"{fname} {lname}"
        keep_emp = emp.user_id in kept_ids
        if not keep_emp:
            for k in KEEP_EMAILS:
                if k in fname or k in lname or k in full:
                    keep_emp = True
                    break
        if not keep_emp:
            db.query(HREmployeeDocument).filter(HREmployeeDocument.employee_id == emp.id).delete()
            db.query(HRPayrollRecord).filter(HRPayrollRecord.employee_id == emp.id).delete()
            deleted_employees.append(f"{emp.first_name} {emp.last_name}")
            db.delete(emp)

    # Clean moderation logs for deleted users
    try:
        db.query(ModerationLog).filter(
            ModerationLog.user_id.in_([d["id"] for d in deleted])
        ).delete(synchronize_session=False)
    except Exception:
        pass

    db.commit()

    return {
        "purged": True,
        "deleted_users": len(deleted),
        "deleted_employees": len(deleted_employees),
        "kept_users": kept,
        "deleted_list": deleted,
        "deleted_employee_names": deleted_employees,
    }


# ─── Flagged Messages ───────────────────────────────────────────

@router.get("/messages/flagged")
def flagged_messages(
    page: int = 1,
    per_page: int = 50,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Message).filter(Message.is_flagged == True, Message.is_deleted == False)
    total = query.count()
    messages = query.order_by(desc(Message.created_at)).offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        result.append({
            "id": msg.id,
            "content": msg.content,
            "sender": user_to_dict(sender) if sender else None,
            "conversationId": msg.conversation_id,
            "flagReason": msg.flag_reason,
            "createdAt": msg.created_at.isoformat() if msg.created_at else "",
        })

    return {"messages": result, "total": total, "page": page}


@router.delete("/messages/{msg_id}")
def admin_delete_message(msg_id: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    msg = db.query(Message).filter(Message.id == msg_id).first()
    if not msg:
        raise HTTPException(404, "Mensaje no encontrado")

    msg.is_deleted = True

    db.add(ModerationLog(
        id=gen_id(),
        user_id=msg.sender_id,
        message_id=msg.id,
        action="delete_message",
        admin_id=admin.id,
    ))

    db.commit()
    return {"deleted": True}


# ─── Stats ───────────────────────────────────────────────────────

@router.get("/stats")
def admin_stats(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return {
        "totalUsers": db.query(User).count(),
        "activeUsers": db.query(User).filter(User.is_banned == False).count(),
        "bannedUsers": db.query(User).filter(User.is_banned == True).count(),
        "unverifiedUsers": db.query(User).filter(User.email_verified == False).count(),
        "totalMessages": db.query(Message).count(),
        "flaggedMessages": db.query(Message).filter(Message.is_flagged == True, Message.is_deleted == False).count(),
        "totalConversations": db.query(Conversation).count(),
        "totalFriendships": db.query(Friendship).filter(Friendship.status == "accepted").count(),
        "totalWallPosts": db.query(WallPost).count(),
        "totalReports": db.query(UserReport).count(),
        "pendingReports": db.query(UserReport).filter(UserReport.status == "pending").count(),
        "totalBlocks": db.query(BlockedUser).count(),
    }


# ─── Moderation Logs ────────────────────────────────────────────

@router.get("/moderation-logs")
def moderation_logs(
    page: int = 1,
    per_page: int = 50,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(ModerationLog)
    total = query.count()
    logs = query.order_by(desc(ModerationLog.created_at)).offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for log in logs:
        target = db.query(User).filter(User.id == log.user_id).first()
        admin_user = db.query(User).filter(User.id == log.admin_id).first() if log.admin_id else None
        result.append({
            "id": log.id,
            "action": log.action,
            "reason": log.reason,
            "targetUser": user_to_dict(target) if target else None,
            "adminUser": user_to_dict(admin_user) if admin_user else None,
            "createdAt": log.created_at.isoformat() if log.created_at else "",
        })

    return {"logs": result, "total": total, "page": page}


# ─── User Reports ──────────────────────────────────────────────

@router.get("/reports")
def list_reports(
    page: int = 1,
    per_page: int = 50,
    status: Optional[str] = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(UserReport)
    if status:
        query = query.filter(UserReport.status == status)

    total = query.count()
    reports = query.order_by(desc(UserReport.created_at)).offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for r in reports:
        reporter = db.query(User).filter(User.id == r.reporter_id).first()
        reported = db.query(User).filter(User.id == r.reported_id).first()
        result.append({
            "id": r.id,
            "reporter": user_to_dict(reporter) if reporter else None,
            "reported": user_to_dict(reported) if reported else None,
            "reason": r.reason,
            "status": r.status,
            "createdAt": r.created_at.isoformat() if r.created_at else "",
        })

    return {"reports": result, "total": total, "page": page, "pages": (total + per_page - 1) // per_page}


@router.post("/reports/{report_id}/review")
def review_report(
    report_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    report = db.query(UserReport).filter(UserReport.id == report_id).first()
    if not report:
        raise HTTPException(404, "Reporte no encontrado")

    report.status = "reviewed"
    db.commit()
    return {"status": "reviewed"}


@router.post("/reports/{report_id}/dismiss")
def dismiss_report(
    report_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    report = db.query(UserReport).filter(UserReport.id == report_id).first()
    if not report:
        raise HTTPException(404, "Reporte no encontrado")

    report.status = "dismissed"
    db.commit()
    return {"status": "dismissed"}


# ─── Blocked Users Overview ────────────────────────────────────

@router.get("/blocked-users")
def admin_blocked_users(
    page: int = 1,
    per_page: int = 50,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(BlockedUser)
    total = query.count()
    blocks = query.order_by(desc(BlockedUser.created_at)).offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for b in blocks:
        blocker = db.query(User).filter(User.id == b.blocker_id).first()
        blocked = db.query(User).filter(User.id == b.blocked_id).first()
        result.append({
            "id": b.id,
            "blocker": user_to_dict(blocker) if blocker else None,
            "blocked": user_to_dict(blocked) if blocked else None,
            "createdAt": b.created_at.isoformat() if b.created_at else "",
        })

    return {"blocks": result, "total": total, "page": page}


# ─── Admin Promote / Demote ───────────────────────────────────

@router.post("/users/{user_id}/make-admin")
def make_admin(user_id: str, owner: User = Depends(require_owner), db: Session = Depends(get_db)):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "Usuario no encontrado")

    target.is_admin = True
    target.role = "admin"
    db.add(ModerationLog(
        id=gen_id(), user_id=user_id, action="make_admin", admin_id=owner.id,
    ))
    db.commit()
    return {"isAdmin": True}


@router.post("/users/{user_id}/remove-admin")
def remove_admin(user_id: str, owner: User = Depends(require_owner), db: Session = Depends(get_db)):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "Usuario no encontrado")
    if target.role == "owner":
        raise HTTPException(400, "No se puede remover al propietario")

    target.is_admin = False
    target.role = "user"
    db.add(ModerationLog(
        id=gen_id(), user_id=user_id, action="remove_admin", admin_id=owner.id,
    ))
    db.commit()
    return {"isAdmin": False}


# ─── Admin Force Unblock ───────────────────────────────────────

@router.delete("/blocked-users/{block_id}")
def admin_force_unblock(block_id: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    block = db.query(BlockedUser).filter(BlockedUser.id == block_id).first()
    if not block:
        raise HTTPException(404, "Bloqueo no encontrado")

    db.delete(block)
    db.commit()
    return {"unblocked": True}


# ─── Subscription Management (Owner only) ─────────────────────

@router.post("/users/{user_id}/grant-premium")
def grant_premium(user_id: str, owner: User = Depends(require_owner), db: Session = Depends(get_db)):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "Usuario no encontrado")

    target.subscription_status = "active"
    db.commit()
    return {"status": "ok", "subscriptionStatus": "active"}


@router.post("/users/{user_id}/revoke-premium")
def revoke_premium(user_id: str, owner: User = Depends(require_owner), db: Session = Depends(get_db)):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "Usuario no encontrado")

    target.subscription_status = "trial"
    db.commit()
    return {"status": "ok", "subscriptionStatus": "trial"}


@router.get("/financial-summary")
def financial_summary(owner: User = Depends(require_owner), db: Session = Depends(get_db)):
    """Financial overview for the owner: revenue, taxes, subscriber counts."""
    from sqlalchemy import extract
    from datetime import datetime, timedelta

    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    # Revenue calculations
    total_revenue = db.query(func.sum(PaymentLog.amount)).filter(PaymentLog.status == "completed").scalar() or 0
    monthly_revenue = db.query(func.sum(PaymentLog.amount)).filter(
        PaymentLog.status == "completed", PaymentLog.created_at >= month_start
    ).scalar() or 0
    yearly_revenue = db.query(func.sum(PaymentLog.amount)).filter(
        PaymentLog.status == "completed", PaymentLog.created_at >= year_start
    ).scalar() or 0

    # Transaction counts
    total_transactions = db.query(PaymentLog).filter(PaymentLog.status == "completed").count()
    monthly_transactions = db.query(PaymentLog).filter(
        PaymentLog.status == "completed", PaymentLog.created_at >= month_start
    ).count()

    # Subscriber counts by status
    active_subs = db.query(User).filter(User.subscription_status == "active").count()
    trial_subs = db.query(User).filter(User.subscription_status == "trial").count()
    cancelled_subs = db.query(User).filter(User.subscription_status == "cancelled").count()
    expired_subs = db.query(User).filter(User.subscription_status == "expired").count()
    owner_subs = db.query(User).filter(User.subscription_status == "owner").count()

    # Stripe/PayPal fee estimates (approximate)
    stripe_fee_rate = 0.029  # 2.9%
    stripe_fixed_fee = 0.30
    estimated_fees = total_transactions * stripe_fixed_fee + total_revenue * stripe_fee_rate

    # Tax estimate (placeholder — 16% IVA for Mexico, configurable)
    tax_rate = 0.16
    estimated_taxes = total_revenue * tax_rate

    # Monthly revenue for last 6 months
    monthly_breakdown = []
    for i in range(5, -1, -1):
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1
        m_start = datetime(y, m, 1)
        if m == 12:
            m_end = datetime(y + 1, 1, 1)
        else:
            m_end = datetime(y, m + 1, 1)
        rev = db.query(func.sum(PaymentLog.amount)).filter(
            PaymentLog.status == "completed",
            PaymentLog.created_at >= m_start,
            PaymentLog.created_at < m_end,
        ).scalar() or 0
        monthly_breakdown.append({
            "month": m_start.strftime("%Y-%m"),
            "label": m_start.strftime("%b %Y"),
            "revenue": round(rev, 2),
        })

    return {
        "totalRevenue": round(total_revenue, 2),
        "monthlyRevenue": round(monthly_revenue, 2),
        "yearlyRevenue": round(yearly_revenue, 2),
        "totalTransactions": total_transactions,
        "monthlyTransactions": monthly_transactions,
        "estimatedFees": round(estimated_fees, 2),
        "estimatedTaxes": round(estimated_taxes, 2),
        "netRevenue": round(total_revenue - estimated_fees - estimated_taxes, 2),
        "subscribers": {
            "active": active_subs,
            "trial": trial_subs,
            "cancelled": cancelled_subs,
            "expired": expired_subs,
            "owner": owner_subs,
        },
        "monthlyBreakdown": monthly_breakdown,
    }


@router.get("/payments")
def list_payments(
    page: int = 1,
    per_page: int = 50,
    owner: User = Depends(require_owner),
    db: Session = Depends(get_db),
):
    query = db.query(PaymentLog)
    total = query.count()
    payments = query.order_by(desc(PaymentLog.created_at)).offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for p in payments:
        payer = db.query(User).filter(User.id == p.user_id).first()
        result.append({
            "id": p.id,
            "user": user_to_dict(payer) if payer else None,
            "provider": p.provider,
            "transactionId": p.transaction_id,
            "amount": p.amount,
            "currency": p.currency,
            "status": p.status,
            "createdAt": p.created_at.isoformat() if p.created_at else "",
        })

    return {"payments": result, "total": total, "page": page, "pages": (total + per_page - 1) // per_page}
