"""Mercado Pago payment integration for Conniku subscriptions (Chile).
Uses Checkout Pro for one-time payments and Preapproval API for subscriptions.
Docs: https://www.mercadopago.cl/developers/es/docs
"""
import hashlib
import hmac
import json
import os
from datetime import datetime, timedelta

import httpx
from database import PaymentLog, TermsAcceptance, User, gen_id, get_db
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from middleware import get_current_user
from sqlalchemy.orm import Session
from tutor_routes import CONNIKU_COMMISSION_RATE, TutorClass, TutorClassEnrollment, TutorPayment, TutorProfile

router = APIRouter(prefix="/payments/mp", tags=["mercadopago"])

# ─── Config ────────────────────────────────────────────────────
MP_ACCESS_TOKEN = os.environ.get("MP_ACCESS_TOKEN", "")
MP_PUBLIC_KEY = os.environ.get("MP_PUBLIC_KEY", "")
MP_WEBHOOK_SECRET = os.environ.get("MP_WEBHOOK_SECRET", "")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://conniku.com")
BACKEND_URL = os.environ.get("BACKEND_URL", "https://studyhub-api-bpco.onrender.com")
MP_API = "https://api.mercadopago.com"

# Plan prices (CLP)
PLANS = {
    "pro_monthly": {
        "title": "Conniku PRO — Mensual",
        "price": 8990,
        "currency": "CLP",
        "tier": "pro",
        "frequency": 1,
        "frequency_type": "months",
        "storage_bytes": 2147483648,  # 2 GB
    },
    "pro_semester": {
        "title": "Conniku PRO — Semestral (5 meses)",
        "price": 39990,
        "currency": "CLP",
        "tier": "pro",
        "frequency": 5,
        "frequency_type": "months",
        "storage_bytes": 2147483648,  # 2 GB
    },
    "pro_yearly": {
        "title": "Conniku PRO — Anual",
        "price": 79990,
        "currency": "CLP",
        "tier": "pro",
        "frequency": 12,
        "frequency_type": "months",
        "storage_bytes": 2147483648,  # 2 GB
    },
    "pro_sprint": {
        "title": "Conniku PRO — Sprint Exámenes (1 semana)",
        "price": 3490,
        "currency": "CLP",
        "tier": "pro",
        "frequency": 7,
        "frequency_type": "days",
        "storage_bytes": 2147483648,  # 2 GB
        "auto_renew": False,
    },
}


def _mp_headers():
    return {
        "Authorization": f"Bearer {MP_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }


# ─── Health Check ──────────────────────────────────────────────

@router.get("/health")
def mp_health():
    """Check Mercado Pago configuration status."""
    return {
        "configured": bool(MP_ACCESS_TOKEN),
        "hasAccessToken": bool(MP_ACCESS_TOKEN),
        "hasPublicKey": bool(MP_PUBLIC_KEY),
        "provider": "mercadopago",
        "country": "CL",
        "currency": "CLP",
        "plans": {k: {"title": v["title"], "price": v["price"]} for k, v in PLANS.items()},
        "webhookUrl": f"{BACKEND_URL}/payments/mp/webhook",
        "status": "ready" if MP_ACCESS_TOKEN else "not_configured",
    }


# ─── Create Subscription (Preapproval) ────────────────────────

@router.post("/create-subscription")
async def create_mp_subscription(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a Mercado Pago subscription (preapproval) for the user."""
    if not MP_ACCESS_TOKEN:
        raise HTTPException(503, "Mercado Pago no configurado")

    plan_key = data.get("plan", "pro_monthly")
    plan = PLANS.get(plan_key)
    if not plan:
        raise HTTPException(400, f"Plan no valido: {plan_key}")

    # Build preapproval request
    preapproval_data = {
        "reason": plan["title"],
        "auto_recurring": {
            "frequency": plan["frequency"],
            "frequency_type": plan["frequency_type"],
            "transaction_amount": plan["price"],
            "currency_id": plan["currency"],
        },
        "back_url": f"{FRONTEND_URL}/subscription?mp_status=approved",
        "payer_email": user.email,
        "external_reference": json.dumps({
            "user_id": user.id,
            "plan": plan_key,
            "tier": plan["tier"],
        }),
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{MP_API}/preapproval",
                headers=_mp_headers(),
                json=preapproval_data,
                timeout=30,
            )
            result = resp.json()

            if resp.status_code not in (200, 201):
                print(f"[MP Error] {resp.status_code}: {result}")
                raise HTTPException(resp.status_code, result.get("message", "Error de Mercado Pago"))

            # Save preapproval ID for tracking
            mp_sub_id = result.get("id", "")
            init_point = result.get("init_point", "")

            # Store MP customer reference
            if not user.stripe_customer_id or not user.stripe_customer_id.startswith("mp_"):
                user.stripe_customer_id = f"mp_{mp_sub_id}"
                db.commit()

            print(f"[MP] Subscription created: {mp_sub_id} for user {user.id} plan={plan_key}")

            return {
                "subscriptionId": mp_sub_id,
                "initPoint": init_point,
                "url": init_point,
                "plan": plan_key,
            }
    except httpx.HTTPError as e:
        raise HTTPException(500, f"Error de conexion con Mercado Pago: {str(e)}") from e


# ─── Create Checkout (one-time payment) ───────────────────────

@router.post("/create-checkout")
async def create_mp_checkout(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a Mercado Pago Checkout Pro preference (for one-time payments)."""
    if not MP_ACCESS_TOKEN:
        raise HTTPException(503, "Mercado Pago no configurado")

    plan_key = data.get("plan", "pro_monthly")
    plan = PLANS.get(plan_key)
    if not plan:
        raise HTTPException(400, f"Plan no valido: {plan_key}")

    preference_data = {
        "items": [{
            "title": plan["title"],
            "description": f"Suscripcion {plan['tier'].upper()} de Conniku",
            "quantity": 1,
            "currency_id": plan["currency"],
            "unit_price": plan["price"],
        }],
        "payer": {
            "email": user.email,
            "name": user.first_name,
            "surname": user.last_name or "",
        },
        "back_urls": {
            "success": f"{FRONTEND_URL}/subscription?mp_status=approved&plan={plan_key}",
            "failure": f"{FRONTEND_URL}/subscription?mp_status=failed",
            "pending": f"{FRONTEND_URL}/subscription?mp_status=pending",
        },
        "auto_return": "approved",
        "external_reference": json.dumps({
            "user_id": user.id,
            "plan": plan_key,
            "tier": plan["tier"],
        }),
        "notification_url": f"{BACKEND_URL}/payments/mp/webhook",
        "statement_descriptor": "CONNIKU",
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{MP_API}/checkout/preferences",
                headers=_mp_headers(),
                json=preference_data,
                timeout=30,
            )
            result = resp.json()

            if resp.status_code not in (200, 201):
                print(f"[MP Error] {resp.status_code}: {result}")
                raise HTTPException(resp.status_code, result.get("message", "Error de Mercado Pago"))

            return {
                "preferenceId": result.get("id", ""),
                "initPoint": result.get("init_point", ""),
                "url": result.get("init_point", ""),
                "sandboxUrl": result.get("sandbox_init_point", ""),
                "plan": plan_key,
            }
    except httpx.HTTPError as e:
        raise HTTPException(500, f"Error de conexion con Mercado Pago: {str(e)}") from e


# ─── Create Class Checkout ────────────────────────────────────

@router.post("/create-class-checkout")
async def create_mp_class_checkout(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a Mercado Pago Checkout Pro preference for enrolling in a tutor class."""
    if not MP_ACCESS_TOKEN:
        raise HTTPException(503, "Mercado Pago no configurado")

    class_id = data.get("class_id", "")
    apply_max_discount = bool(data.get("apply_max_discount", False))

    if not class_id:
        raise HTTPException(400, "class_id requerido")

    cls = db.query(TutorClass).filter(TutorClass.id == class_id).first()
    if not cls:
        raise HTTPException(404, "Clase no encontrada")

    if cls.status != "published":
        raise HTTPException(400, "Esta clase no esta disponible para inscripcion")

    if cls.current_students >= cls.max_students:
        raise HTTPException(400, "No hay cupos disponibles")

    # Verify no paid duplicate enrollment
    existing = db.query(TutorClassEnrollment).filter(
        TutorClassEnrollment.class_id == class_id,
        TutorClassEnrollment.student_id == user.id,
        TutorClassEnrollment.payment_status == "paid",
    ).first()
    if existing:
        raise HTTPException(400, "Ya estas inscrito en esta clase")

    # Calculate price with possible MAX discount
    original_gross = cls.price_per_student
    discount_type = ""
    discount_amount = 0.0

    if apply_max_discount:
        user_tier = getattr(user, "subscription_tier", "free") or "free"
        if user_tier != "max":
            raise HTTPException(400, "Solo usuarios MAX pueden aplicar el descuento del 50%")
        discount_amount = round(original_gross * 0.5)
        discount_type = "max_subscriber"

    gross = original_gross - discount_amount
    commission = round(gross * CONNIKU_COMMISSION_RATE)
    tutor_amount = gross - commission

    # Get tutor profile
    tutor = db.query(TutorProfile).filter(TutorProfile.id == cls.tutor_id).first()
    if not tutor or tutor.status != "approved":
        raise HTTPException(400, "El tutor de esta clase no esta disponible")

    # Create TutorPayment with payment_status pending
    payment = TutorPayment(
        id=gen_id(),
        tutor_id=tutor.id,
        enrollment_id=None,
        gross_amount=original_gross,
        conniku_commission=commission,
        tutor_amount=tutor_amount,
        discount_type=discount_type,
        discount_amount=discount_amount,
        payment_status="pending",
        payment_method="mercadopago",
    )
    db.add(payment)
    db.flush()

    # Create TutorClassEnrollment with payment_status pending
    enrollment = TutorClassEnrollment(
        id=gen_id(),
        class_id=class_id,
        student_id=user.id,
        payment_id=payment.id,
        payment_status="pending",
    )
    db.add(enrollment)
    db.flush()

    # Link payment to enrollment
    payment.enrollment_id = enrollment.id
    db.commit()
    db.refresh(enrollment)

    # Build MP preference
    external_ref = json.dumps({
        "type": "class_enrollment",
        "enrollment_id": enrollment.id,
        "class_id": class_id,
        "user_id": user.id,
    })

    preference_data = {
        "items": [{
            "title": cls.title,
            "description": f"Clase de {cls.category or 'tutoria'} — Conniku",
            "quantity": 1,
            "currency_id": "CLP",
            "unit_price": int(gross),
        }],
        "payer": {
            "email": user.email,
            "name": user.first_name,
            "surname": user.last_name or "",
        },
        "back_urls": {
            "success": f"{FRONTEND_URL}/tutores?enrollment_status=success&enrollment_id={enrollment.id}",
            "failure": f"{FRONTEND_URL}/tutores?enrollment_status=failed",
            "pending": f"{FRONTEND_URL}/tutores?enrollment_status=pending",
        },
        "auto_return": "approved",
        "external_reference": external_ref,
        "notification_url": f"{BACKEND_URL}/payments/mp/webhook",
        "statement_descriptor": "CONNIKU",
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{MP_API}/checkout/preferences",
                headers=_mp_headers(),
                json=preference_data,
                timeout=30,
            )
            result = resp.json()

            if resp.status_code not in (200, 201):
                print(f"[MP Error] Class checkout {resp.status_code}: {result}")
                raise HTTPException(resp.status_code, result.get("message", "Error de Mercado Pago"))

            print(f"[MP] Class checkout created: enrollment={enrollment.id} class={class_id} gross={gross}")
            return {
                "init_point": result.get("init_point", ""),
                "enrollment_id": enrollment.id,
            }
    except httpx.HTTPError as e:
        raise HTTPException(500, f"Error de conexion con Mercado Pago: {str(e)}") from e


# ─── Webhook ──────────────────────────────────────────────────

@router.post("/webhook")
async def mp_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Mercado Pago webhook notifications (IPN)."""
    # Validate webhook signature if secret is configured
    if MP_WEBHOOK_SECRET:
        x_signature = request.headers.get("x-signature", "")
        x_request_id = request.headers.get("x-request-id", "")
        params = dict(request.query_params)
        data_id_param = params.get("data.id", "")

        # Build manifest for HMAC validation
        # Format: id:[data.id];request-id:[x-request-id];ts:[ts]
        ts = ""
        if x_signature:
            parts = {p.split("=")[0].strip(): p.split("=")[1].strip() for p in x_signature.split(",") if "=" in p}
            ts = parts.get("ts", "")
            received_hash = parts.get("v1", "")

            manifest = f"id:{data_id_param};request-id:{x_request_id};ts:{ts};"
            computed = hmac.new(
                MP_WEBHOOK_SECRET.encode(), manifest.encode(), hashlib.sha256
            ).hexdigest()

            if received_hash and computed != received_hash:
                print(f"[MP Webhook] ⚠️ Signature mismatch - received={received_hash[:16]}... computed={computed[:16]}...")
                return {"status": "rejected", "reason": "signature_mismatch"}

    try:
        body = await request.json()
    except Exception:
        body = {}

    # MP sends query params for some notification types
    params = dict(request.query_params)
    action = body.get("action", "") or params.get("type", "")
    data_id = body.get("data", {}).get("id", "") or params.get("data.id", "")

    print(f"[MP Webhook] action={action} data_id={data_id}")

    if not MP_ACCESS_TOKEN:
        return {"received": True, "processed": False}

    try:
        if action in ("payment.created", "payment.updated", "payment"):
            # Fetch payment details from MP API
            await _process_payment(data_id, db)

        elif action in ("subscription_preapproval", "preapproval.updated"):
            # Fetch subscription details
            await _process_preapproval(data_id, db)

        elif action == "subscription_authorized_payment":
            # Recurring payment authorized
            await _process_authorized_payment(data_id, db)

        else:
            print(f"[MP Webhook] Unhandled action: {action}")

    except Exception as e:
        print(f"[MP Webhook Error] {e}")
        import traceback
        traceback.print_exc()

    return {"received": True}


async def _process_payment(payment_id: str, db: Session):
    """Process a payment notification from Mercado Pago."""
    if not payment_id:
        return

    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{MP_API}/v1/payments/{payment_id}", headers=_mp_headers(), timeout=15)
        if resp.status_code != 200:
            print(f"[MP] Failed to fetch payment {payment_id}: {resp.status_code}")
            return
        payment = resp.json()

    status = payment.get("status", "")
    external_ref = payment.get("external_reference", "")
    amount = payment.get("transaction_amount", 0)
    currency = payment.get("currency_id", "CLP")

    # Parse external reference
    try:
        ref = json.loads(external_ref) if external_ref else {}
    except (json.JSONDecodeError, TypeError):
        ref = {}

    user_id = ref.get("user_id", "")
    plan_key = ref.get("plan", "")
    tier = ref.get("tier", "pro")

    # ── Class enrollment payment handling ──────────────────────
    if ref.get("type") == "class_enrollment":
        enrollment_id = ref.get("enrollment_id")
        if not enrollment_id:
            print(f"[MP] Class enrollment payment {payment_id}: no enrollment_id in ref")
            return
        enrollment = db.query(TutorClassEnrollment).filter(TutorClassEnrollment.id == enrollment_id).first()
        if not enrollment:
            print(f"[MP] Enrollment {enrollment_id} not found for payment {payment_id}")
            return
        if status == "approved" and enrollment.payment_status != "paid":
            enrollment.payment_status = "paid"
            # Update TutorPayment
            if enrollment.payment_id:
                tp = db.query(TutorPayment).filter(TutorPayment.id == enrollment.payment_id).first()
                if tp:
                    tp.payment_status = "pending_boleta"
                    tp.payment_reference = str(payment_id)
            # Increment current_students
            cls = db.query(TutorClass).filter(TutorClass.id == enrollment.class_id).first()
            if cls:
                cls.current_students = (cls.current_students or 0) + 1
            db.commit()
            print(f"[MP] Class enrollment confirmed: enrollment={enrollment_id} payment={payment_id}")
        elif status in ("rejected", "cancelled"):
            enrollment.payment_status = "pending"
            db.commit()
            print(f"[MP] Class enrollment payment {status}: enrollment={enrollment_id}")
        return
    # ── End class enrollment handling ──────────────────────────

    if not user_id:
        # Try to find user by payer email
        payer_email = payment.get("payer", {}).get("email", "")
        if payer_email:
            user = db.query(User).filter(User.email == payer_email).first()
            if user:
                user_id = user.id

    if not user_id:
        print(f"[MP] Payment {payment_id}: no user_id found")
        return

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        print(f"[MP] User {user_id} not found")
        return

    if status == "approved":
        # Payment successful — activate subscription
        plan = PLANS.get(plan_key, {})
        user.subscription_status = "active"
        user.subscription_tier = tier
        user.storage_limit_bytes = plan.get("storage_bytes", 1073741824)
        freq = plan.get("frequency", 1)
        user.subscription_expires_at = datetime.utcnow() + timedelta(days=30 * freq)

        # Log payment
        existing = db.query(PaymentLog).filter(PaymentLog.transaction_id == str(payment_id)).first()
        if not existing:
            log = PaymentLog(
                id=gen_id(), user_id=user_id, provider="mercadopago",
                transaction_id=str(payment_id), amount=amount,
                currency=currency, status="completed",
            )
            db.add(log)

        db.commit()

        # Notifications
        from notification_routes import create_notification
        create_notification(db, user.id, "subscription_activated",
            f"Tu plan {tier.upper()} esta activo",
            body="Disfruta de todas las funciones de tu suscripcion Conniku.",
            link="/subscription")
        db.commit()

        from notifications import CEO_EMAIL, _email_template, _send_email_async, send_subscription_email
        send_subscription_email(user, tier.upper(), "activated")

        # Notify CEO
        ceo_body = f"""
        <p><strong>💰 Nuevo pago recibido</strong></p>
        <p><strong>Usuario:</strong> {user.first_name} {user.last_name} (@{user.username})</p>
        <p><strong>Plan:</strong> {plan_key} → {tier.upper()}</p>
        <p><strong>Monto:</strong> ${amount:,.0f} {currency}</p>
        <p><strong>Proveedor:</strong> Mercado Pago</p>
        <p style="color:#6B7280;font-size:12px">{datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")}</p>
        """
        html = _email_template("💰 Nuevo pago — Mercado Pago", ceo_body, "Ver Dashboard", f"{FRONTEND_URL}/ceo", sender="ceo")
        _send_email_async(CEO_EMAIL, f"💰 Pago: {user.first_name} — ${amount:,.0f} {currency}", html, email_type="payment_webhook")

        print(f"[MP] Payment approved: user={user_id} plan={plan_key} amount={amount} {currency}")

    elif status in ("rejected", "cancelled"):
        # Log failed payment
        existing = db.query(PaymentLog).filter(PaymentLog.transaction_id == str(payment_id)).first()
        if not existing:
            log = PaymentLog(
                id=gen_id(), user_id=user_id, provider="mercadopago",
                transaction_id=str(payment_id), amount=amount,
                currency=currency, status="failed",
            )
            db.add(log)
            db.commit()

        from notification_routes import create_notification
        create_notification(db, user.id, "payment_failed",
            "Tu pago no fue procesado",
            body="Intenta nuevamente o utiliza otro metodo de pago.",
            link="/subscription")
        db.commit()

        print(f"[MP] Payment {status}: user={user_id} payment={payment_id}")

    elif status == "pending":
        print(f"[MP] Payment pending: user={user_id} payment={payment_id}")


async def _process_preapproval(preapproval_id: str, db: Session):
    """Process a preapproval (subscription) update."""
    if not preapproval_id:
        return

    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{MP_API}/preapproval/{preapproval_id}", headers=_mp_headers(), timeout=15)
        if resp.status_code != 200:
            print(f"[MP] Failed to fetch preapproval {preapproval_id}: {resp.status_code}")
            return
        preapproval = resp.json()

    status = preapproval.get("status", "")
    external_ref = preapproval.get("external_reference", "")
    payer_email = preapproval.get("payer_email", "")

    try:
        ref = json.loads(external_ref) if external_ref else {}
    except (json.JSONDecodeError, TypeError):
        ref = {}

    user_id = ref.get("user_id", "")
    if not user_id and payer_email:
        user = db.query(User).filter(User.email == payer_email).first()
        if user:
            user_id = user.id

    if not user_id:
        return

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return

    if status == "authorized":
        # Subscription active
        tier = ref.get("tier", "pro")
        plan_key = ref.get("plan", "pro_monthly")
        plan = PLANS.get(plan_key, {})
        user.subscription_status = "active"
        user.subscription_tier = tier
        user.storage_limit_bytes = plan.get("storage_bytes", 1073741824)
        user.stripe_customer_id = f"mp_{preapproval_id}"
        freq = plan.get("frequency", 1)
        user.subscription_expires_at = datetime.utcnow() + timedelta(days=30 * freq)
        db.commit()
        print(f"[MP] Preapproval authorized: user={user_id} tier={tier}")

    elif status in ("cancelled", "paused"):
        user.subscription_status = "cancelled"
        user.subscription_tier = "free"
        user.storage_limit_bytes = 314572800
        db.commit()

        from notifications import send_subscription_email
        send_subscription_email(user, user.subscription_tier.upper(), "expired")
        print(f"[MP] Preapproval {status}: user={user_id}")


async def _process_authorized_payment(payment_id: str, db: Session):
    """Process a recurring subscription payment."""
    # This reuses the same payment processing logic
    await _process_payment(payment_id, db)


# ─── Subscription Status ──────────────────────────────────────

@router.get("/subscription-status")
async def mp_subscription_status(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user's Mercado Pago subscription status."""
    mp_ref = user.stripe_customer_id or ""
    has_mp = mp_ref.startswith("mp_")

    is_trial = user.subscription_status == "trial"
    trial_days_left = 0
    if is_trial and user.trial_started_at:
        trial_end = user.trial_started_at + timedelta(days=7)
        trial_days_left = max(0, (trial_end - datetime.utcnow()).days)

    # Get recent payments
    recent_payments = db.query(PaymentLog).filter(
        PaymentLog.user_id == user.id,
        PaymentLog.provider == "mercadopago",
    ).order_by(PaymentLog.created_at.desc()).limit(5).all()

    return {
        "status": user.subscription_status or "trial",
        "tier": user.subscription_tier or "free",
        "isActive": user.subscription_status in ("active", "trial"),
        "isTrial": is_trial,
        "trialDaysLeft": trial_days_left,
        "expiresAt": user.subscription_expires_at.isoformat() if user.subscription_expires_at else None,
        "provider": "mercadopago" if has_mp else "none",
        "hasMercadoPago": has_mp,
        "recentPayments": [{
            "id": p.id,
            "amount": p.amount,
            "currency": p.currency,
            "status": p.status,
            "date": p.created_at.isoformat() if p.created_at else "",
        } for p in recent_payments],
    }


# ─── Cancel Subscription ─────────────────────────────────────

@router.post("/cancel-subscription")
async def cancel_mp_subscription(request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Cancel user's Mercado Pago subscription."""
    try:
        body = await request.json()
    except Exception:
        body = {}
    terms_accepted = body.get("terms_accepted", False)

    if not terms_accepted:
        raise HTTPException(400, "Debes aceptar los Términos y Condiciones para continuar")

    if not MP_ACCESS_TOKEN:
        raise HTTPException(503, "Mercado Pago no configurado")

    mp_ref = user.stripe_customer_id or ""
    if not mp_ref.startswith("mp_"):
        raise HTTPException(400, "No tienes una suscripcion activa de Mercado Pago")

    # Record T&C acceptance
    acceptance = TermsAcceptance(user_id=user.id, terms_version="2.1", context="cancel_subscription")
    db.add(acceptance)

    preapproval_id = mp_ref.replace("mp_", "")

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.put(
                f"{MP_API}/preapproval/{preapproval_id}",
                headers=_mp_headers(),
                json={"status": "cancelled"},
                timeout=15,
            )

            if resp.status_code == 200:
                user.subscription_status = "cancelled"
                user.subscription_tier = "free"
                user.storage_limit_bytes = 314572800
                db.commit()

                from notifications import send_subscription_email
                send_subscription_email(user, "PRO", "expired")

                return {"status": "cancelled", "message": "Suscripcion cancelada exitosamente"}
            else:
                result = resp.json()
                raise HTTPException(resp.status_code, result.get("message", "Error al cancelar"))
    except httpx.HTTPError as e:
        raise HTTPException(500, f"Error de conexion: {str(e)}") from e


# ─── Plans & Prices ──────────────────────────────────────────

@router.get("/plans")
def get_mp_plans():
    """Get available Mercado Pago subscription plans."""
    return {
        "provider": "mercadopago",
        "currency": "CLP",
        "plans": {
            k: {
                "title": v["title"],
                "price": v["price"],
                "tier": v["tier"],
                "frequency": v["frequency"],
                "frequencyType": v["frequency_type"],
                "priceFormatted": f"${v['price']:,}".replace(",", "."),
            }
            for k, v in PLANS.items()
        },
    }
