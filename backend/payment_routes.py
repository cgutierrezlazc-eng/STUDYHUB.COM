"""Stripe payment integration for Conniku subscriptions."""
import os
import json
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from database import get_db, User, PaymentLog, gen_id
from middleware import get_current_user

router = APIRouter(prefix="/payments", tags=["payments"])

# Stripe setup — uses env vars
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
STRIPE_PRICE_MONTHLY = os.environ.get("STRIPE_PRICE_MONTHLY", "")  # price_xxx for monthly plan
STRIPE_PRICE_YEARLY = os.environ.get("STRIPE_PRICE_YEARLY", "")    # price_xxx for yearly plan
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://conniku.com")

stripe = None
try:
    import stripe as stripe_lib
    if STRIPE_SECRET_KEY:
        stripe_lib.api_key = STRIPE_SECRET_KEY
        stripe = stripe_lib
except ImportError:
    pass


@router.post("/create-checkout-session")
def create_checkout_session(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a Stripe Checkout Session for subscription."""
    if not stripe:
        raise HTTPException(503, "Stripe no está configurado. Contacta al administrador.")

    plan = data.get("plan", "monthly")  # monthly or yearly
    price_id = STRIPE_PRICE_MONTHLY if plan == "monthly" else STRIPE_PRICE_YEARLY

    if not price_id:
        raise HTTPException(503, "Plan de precios no configurado en Stripe")

    # Create or get Stripe customer
    customer_id = user.stripe_customer_id
    if not customer_id:
        try:
            customer = stripe.Customer.create(
                email=user.email,
                name=f"{user.first_name} {user.last_name}",
                metadata={"conniku_user_id": user.id},
            )
            customer_id = customer.id
            user.stripe_customer_id = customer_id
            db.commit()
        except Exception as e:
            raise HTTPException(500, f"Error creando cliente: {str(e)}")

    try:
        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=f"{FRONTEND_URL}/subscription?success=true",
            cancel_url=f"{FRONTEND_URL}/subscription?cancelled=true",
            metadata={"conniku_user_id": user.id, "plan": plan},
            subscription_data={
                "metadata": {"conniku_user_id": user.id},
            },
            allow_promotion_codes=True,
        )
        return {"sessionId": session.id, "url": session.url}
    except Exception as e:
        raise HTTPException(500, f"Error creando sesión de pago: {str(e)}")


@router.post("/create-portal-session")
def create_portal_session(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create Stripe Customer Portal session for managing subscription."""
    if not stripe or not user.stripe_customer_id:
        raise HTTPException(400, "No tienes una suscripción activa")

    try:
        session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=f"{FRONTEND_URL}/subscription",
        )
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(500, f"Error: {str(e)}")


@router.get("/subscription-status")
def get_subscription_status(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user's subscription status."""
    is_trial = user.subscription_status == "trial"
    trial_days_left = 0
    if is_trial and user.trial_started_at:
        trial_end = user.trial_started_at + timedelta(days=7)
        trial_days_left = max(0, (trial_end - datetime.utcnow()).days)

    return {
        "status": user.subscription_status or "trial",
        "isActive": user.subscription_status in ("active", "trial"),
        "isTrial": is_trial,
        "trialDaysLeft": trial_days_left,
        "expiresAt": user.subscription_expires_at.isoformat() if user.subscription_expires_at else None,
        "stripeCustomerId": user.stripe_customer_id,
        "hasPaymentMethod": user.stripe_customer_id is not None,
    }


@router.get("/health")
def stripe_health():
    """Check Stripe configuration status."""
    return {
        "stripeConfigured": stripe is not None,
        "hasSecretKey": bool(STRIPE_SECRET_KEY),
        "hasWebhookSecret": bool(STRIPE_WEBHOOK_SECRET),
        "hasPriceMonthly": bool(STRIPE_PRICE_MONTHLY),
        "hasPriceYearly": bool(STRIPE_PRICE_YEARLY),
        "webhookUrl": f"{FRONTEND_URL.replace('conniku.com', 'studyhub-api-bpco.onrender.com')}/payments/webhook",
        "status": "ready" if stripe and STRIPE_WEBHOOK_SECRET else "not_configured",
    }


def _log_webhook_event(db: Session, event_type: str, stripe_id: str, user_id: str = None, status: str = "processed", details: str = ""):
    """Log webhook event for CEO visibility."""
    try:
        log = PaymentLog(
            id=gen_id(), user_id=user_id or "system",
            provider="stripe_webhook", transaction_id=stripe_id,
            amount=0, currency="usd", status=status,
        )
        db.add(log)
        print(f"[Stripe Webhook] {event_type} | user={user_id} | {details}")
    except Exception as e:
        print(f"[Stripe Webhook Log Error] {e}")


def _notify_ceo_payment(event_type: str, user, amount: float = 0, currency: str = "usd", details: str = ""):
    """Send CEO email notification for payment events."""
    try:
        from notifications import _send_email_async, _email_template, CEO_EMAIL
        emoji_map = {
            "checkout.session.completed": "💰",
            "customer.subscription.deleted": "🚫",
            "customer.subscription.updated": "🔄",
            "invoice.payment_failed": "⚠️",
        }
        emoji = emoji_map.get(event_type, "📩")
        user_info = f"{user.first_name} {user.last_name} (@{user.username})" if user else "Usuario desconocido"

        body = f"""
        <p><strong>Evento:</strong> {emoji} {event_type}</p>
        <p><strong>Usuario:</strong> {user_info}</p>
        <p><strong>Email:</strong> {user.email if user else 'N/A'}</p>
        {f'<p><strong>Monto:</strong> ${amount:.2f} {currency.upper()}</p>' if amount else ''}
        {f'<p><strong>Detalle:</strong> {details}</p>' if details else ''}
        <p style="color:#6B7280;font-size:12px">Evento recibido: {datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")}</p>
        """
        html = _email_template(f"{emoji} Pago: {event_type}", body, "Ver Dashboard", f"{FRONTEND_URL}/ceo", sender="ceo")
        _send_email_async(CEO_EMAIL, f"{emoji} Stripe: {event_type} — {user_info}", html, email_type="payment_webhook")
    except Exception as e:
        print(f"[CEO Payment Notify Error] {e}")


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhook events."""
    if not stripe:
        return JSONResponse({"error": "Stripe not configured"}, status_code=503)

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        if STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
        else:
            event = json.loads(payload)
    except Exception as e:
        print(f"[Stripe Webhook] Signature verification failed: {e}")
        return JSONResponse({"error": str(e)}, status_code=400)

    event_type = event.get("type", "")
    data_object = event.get("data", {}).get("object", {})
    print(f"[Stripe Webhook] Received: {event_type}")

    try:
        if event_type == "checkout.session.completed":
            # Payment successful — activate subscription
            user_id = data_object.get("metadata", {}).get("conniku_user_id")
            plan = data_object.get("metadata", {}).get("plan", "monthly")
            amount = (data_object.get("amount_total", 0) or 0) / 100
            currency = data_object.get("currency", "usd")

            if user_id:
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    user.subscription_status = "active"
                    if plan in ("max_monthly", "max_yearly", "max"):
                        user.subscription_tier = "max"
                        user.storage_limit_bytes = 3221225472  # 3 GB
                        user.subscription_expires_at = datetime.utcnow() + timedelta(days=365 if "yearly" in plan else 30)
                    else:
                        user.subscription_tier = "pro"
                        user.storage_limit_bytes = 1073741824  # 1 GB
                        user.subscription_expires_at = datetime.utcnow() + timedelta(days=365 if "yearly" in plan else 30)

                    payment = PaymentLog(
                        id=gen_id(), user_id=user_id, provider="stripe",
                        transaction_id=data_object.get("id", ""),
                        amount=amount, currency=currency, status="completed",
                    )
                    db.add(payment)

                    # In-app notification
                    from notification_routes import create_notification
                    create_notification(db, user.id, "subscription_activated",
                        f"Tu plan {user.subscription_tier.upper()} esta activo",
                        body="Disfruta de todas las funciones de tu suscripcion.",
                        link="/subscription")

                    db.commit()

                    # Email notifications
                    from notifications import send_subscription_email
                    send_subscription_email(user, user.subscription_tier.upper(), "activated")
                    _notify_ceo_payment(event_type, user, amount, currency, f"Plan: {plan} → {user.subscription_tier}")
                    _log_webhook_event(db, event_type, data_object.get("id", ""), user_id, "processed", f"Activated {user.subscription_tier}")
                    db.commit()

        elif event_type == "customer.subscription.deleted":
            # Subscription cancelled
            customer_id = data_object.get("customer")
            if customer_id:
                user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
                if user:
                    old_tier = user.subscription_tier
                    user.subscription_status = "cancelled"
                    user.subscription_tier = "free"
                    user.storage_limit_bytes = 314572800  # 300 MB

                    from notification_routes import create_notification
                    create_notification(db, user.id, "subscription_cancelled",
                        "Tu suscripcion fue cancelada",
                        body="Tu cuenta volvio al plan basico. Puedes reactivar cuando quieras.",
                        link="/subscription")
                    db.commit()

                    from notifications import send_subscription_email
                    send_subscription_email(user, old_tier.upper(), "expired")
                    _notify_ceo_payment(event_type, user, details=f"Cancelado: {old_tier} → free")
                    _log_webhook_event(db, event_type, data_object.get("id", ""), user.id, "processed", f"Cancelled {old_tier}")
                    db.commit()

        elif event_type == "customer.subscription.updated":
            # Subscription renewed or updated
            customer_id = data_object.get("customer")
            status = data_object.get("status")
            if customer_id:
                user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
                if user:
                    if status == "active":
                        user.subscription_status = "active"
                        current_period_end = data_object.get("current_period_end")
                        if current_period_end:
                            user.subscription_expires_at = datetime.utcfromtimestamp(current_period_end)

                        amount = (data_object.get("plan", {}).get("amount", 0) or 0) / 100
                        currency = data_object.get("plan", {}).get("currency", "usd")
                        if amount > 0:
                            payment = PaymentLog(
                                id=gen_id(), user_id=user.id, provider="stripe",
                                transaction_id=data_object.get("id", ""),
                                amount=amount, currency=currency, status="completed",
                            )
                            db.add(payment)
                            from notifications import send_subscription_email
                            send_subscription_email(user, user.subscription_tier.upper(), "renewed")
                            _notify_ceo_payment(event_type, user, amount, currency, "Renovacion automatica")

                    elif status in ("past_due", "unpaid"):
                        user.subscription_status = "active"  # Keep active during 3-day grace
                        from notification_routes import create_notification
                        create_notification(db, user.id, "payment_overdue",
                            "No pudimos procesar tu pago",
                            body="Tienes 3 dias para actualizar tu metodo de pago antes de perder tu suscripcion.",
                            link="/subscription")
                        from notifications import notify_payment_failed
                        notify_payment_failed(user)
                        _notify_ceo_payment(event_type, user, details=f"Pago pendiente — status: {status}")

                    elif status == "canceled":
                        user.subscription_status = "cancelled"
                        user.subscription_tier = "free"
                        user.storage_limit_bytes = 314572800
                        _notify_ceo_payment(event_type, user, details="Cancelado por Stripe")

                    db.commit()
                    _log_webhook_event(db, event_type, data_object.get("id", ""), user.id, "processed", f"Status: {status}")
                    db.commit()

        elif event_type == "invoice.payment_failed":
            customer_id = data_object.get("customer")
            if customer_id:
                user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
                if user:
                    from notification_routes import create_notification
                    create_notification(db, user.id, "payment_failed",
                        "Tu pago fallo",
                        body="Actualiza tu metodo de pago para mantener tu suscripcion activa.",
                        link="/subscription")
                    db.commit()
                    from notifications import notify_payment_failed
                    notify_payment_failed(user)
                    _notify_ceo_payment(event_type, user, details="Pago de factura fallido")
                    _log_webhook_event(db, event_type, data_object.get("id", ""), user.id, "processed", "Invoice payment failed")
                    db.commit()

        elif event_type == "invoice.payment_succeeded":
            # Track successful invoice payments
            customer_id = data_object.get("customer")
            amount = (data_object.get("amount_paid", 0) or 0) / 100
            if customer_id and amount > 0:
                user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
                if user:
                    _log_webhook_event(db, event_type, data_object.get("id", ""), user.id, "processed", f"${amount}")
                    _notify_ceo_payment(event_type, user, amount, data_object.get("currency", "usd"), "Factura pagada exitosamente")
                    db.commit()

        else:
            # Log unhandled events
            print(f"[Stripe Webhook] Unhandled event type: {event_type}")

    except Exception as e:
        print(f"[Stripe Webhook Error] {event_type}: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": "Internal processing error"}, status_code=500)

    return {"received": True}


@router.post("/upgrade-prorate")
def calculate_upgrade_proration(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Calculate prorated price for upgrading from Pro to Max mid-cycle."""
    from middleware import get_tier
    current_tier = get_tier(user)
    target_tier = data.get("target_tier", "max")

    if current_tier != "pro" or target_tier != "max":
        raise HTTPException(400, "Solo se puede prorratear de Pro a Max")

    if not user.subscription_expires_at:
        raise HTTPException(400, "No tienes una suscripción activa")

    from calendar import monthrange
    now = datetime.utcnow()

    # Calculate days remaining in current billing period
    expires = user.subscription_expires_at
    if expires <= now:
        raise HTTPException(400, "Tu suscripción ya expiró. Suscríbete directamente a Max.")

    days_remaining = (expires - now).days

    # Get the total days in the billing month
    _, days_in_month = monthrange(now.year, now.month)

    # Monthly prices
    pro_monthly = 5.00
    max_monthly = 13.00
    price_diff = max_monthly - pro_monthly  # $8 per month

    # Prorated amount: difference × (remaining days / total days)
    prorated_amount = round(price_diff * (days_remaining / days_in_month), 2)

    return {
        "currentTier": "pro",
        "targetTier": "max",
        "daysRemaining": days_remaining,
        "daysInMonth": days_in_month,
        "proMonthly": pro_monthly,
        "maxMonthly": max_monthly,
        "priceDifference": price_diff,
        "proratedAmount": prorated_amount,
        "currency": "USD",
        "message": f"Pago prorrateado: ${prorated_amount} USD por {days_remaining} días restantes de tu ciclo actual.",
    }


@router.post("/execute-upgrade")
def execute_upgrade(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Execute the upgrade from Pro to Max with prorated payment via Stripe."""
    if not stripe:
        raise HTTPException(503, "Stripe no configurado")

    from middleware import get_tier
    if get_tier(user) != "pro":
        raise HTTPException(400, "Solo usuarios Pro pueden hacer upgrade a Max")

    try:
        # Get current Stripe subscription
        if not user.stripe_customer_id:
            raise HTTPException(400, "No tienes método de pago registrado")

        subscriptions = stripe.Subscription.list(customer=user.stripe_customer_id, status="active", limit=1)
        if not subscriptions.data:
            raise HTTPException(400, "No se encontró suscripción activa en Stripe")

        current_sub = subscriptions.data[0]

        STRIPE_PRICE_MAX_MONTHLY = os.environ.get("STRIPE_PRICE_MAX_MONTHLY", "")
        if not STRIPE_PRICE_MAX_MONTHLY:
            raise HTTPException(503, "Precio Max no configurado")

        # Update subscription with proration
        updated = stripe.Subscription.modify(
            current_sub.id,
            items=[{
                "id": current_sub["items"]["data"][0]["id"],
                "price": STRIPE_PRICE_MAX_MONTHLY,
            }],
            proration_behavior="always_invoice",  # Stripe handles proration automatically
        )

        # Update user
        user.subscription_tier = "max"
        user.storage_limit_bytes = 3221225472  # 3 GB
        db.commit()

        from notification_routes import create_notification
        create_notification(db, user.id, "upgrade",
            "🎉 ¡Bienvenido a Conniku MAX!",
            body="Tu plan fue actualizado. Disfruta de todas las funciones ilimitadas.",
            link="/subscription")
        db.commit()

        return {
            "status": "upgraded",
            "newTier": "max",
            "message": "¡Upgrade exitoso! Ahora tienes Conniku MAX.",
        }
    except Exception as e:
        raise HTTPException(500, f"Error al procesar upgrade: {str(e)}")
