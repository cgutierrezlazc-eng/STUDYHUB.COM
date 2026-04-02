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
        return JSONResponse({"error": str(e)}, status_code=400)

    event_type = event.get("type", "")
    data_object = event.get("data", {}).get("object", {})

    if event_type == "checkout.session.completed":
        # Payment successful
        user_id = data_object.get("metadata", {}).get("conniku_user_id")
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.subscription_status = "active"
                user.subscription_expires_at = datetime.utcnow() + timedelta(days=30)
                user.storage_limit_bytes = 5 * 1024 * 1024 * 1024  # 5 GB for PRO

                # Log payment
                payment = PaymentLog(
                    id=gen_id(), user_id=user_id, provider="stripe",
                    transaction_id=data_object.get("id", ""),
                    amount=data_object.get("amount_total", 0) / 100,
                    currency=data_object.get("currency", "usd"),
                    status="completed",
                )
                db.add(payment)
                db.commit()

    elif event_type == "customer.subscription.deleted":
        # Subscription cancelled
        customer_id = data_object.get("customer")
        if customer_id:
            user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
            if user:
                user.subscription_status = "cancelled"
                user.storage_limit_bytes = 500 * 1024 * 1024  # Back to 500 MB
                db.commit()

    elif event_type == "customer.subscription.updated":
        # Subscription renewed/updated
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
                elif status in ("past_due", "unpaid"):
                    user.subscription_status = "expired"
                db.commit()

    elif event_type == "invoice.payment_failed":
        customer_id = data_object.get("customer")
        if customer_id:
            user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
            if user:
                from notification_routes import create_notification
                create_notification(db, user.id, "payment_failed",
                    "Tu pago falló. Actualiza tu método de pago para mantener tu suscripción PRO.",
                    link="/subscription")
                db.commit()

    return {"received": True}
