"""PayPal payment integration for Conniku subscriptions (International).
Uses PayPal Orders API v2 for one-time payments and Subscriptions API for recurring.
Docs: https://developer.paypal.com/docs/api/orders/v2/
"""
import os
import json
import httpx
import base64
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from database import get_db, User, PaymentLog, gen_id
from middleware import get_current_user

router = APIRouter(prefix="/payments/paypal", tags=["paypal"])

# ─── Config ────────────────────────────────────────────────────
PAYPAL_CLIENT_ID = os.environ.get("PAYPAL_CLIENT_ID", "")
PAYPAL_CLIENT_SECRET = os.environ.get("PAYPAL_CLIENT_SECRET", "")
PAYPAL_WEBHOOK_ID = os.environ.get("PAYPAL_WEBHOOK_ID", "")
PAYPAL_MODE = os.environ.get("PAYPAL_MODE", "live")  # "sandbox" or "live"
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://conniku.com")
BACKEND_URL = os.environ.get("BACKEND_URL", "https://studyhub-api-bpco.onrender.com")

PAYPAL_API = (
    "https://api-m.paypal.com"
    if PAYPAL_MODE == "live"
    else "https://api-m.sandbox.paypal.com"
)

# Plan prices (USD — international)
PLANS = {
    "pro_monthly": {
        "name": "Conniku PRO - Mensual",
        "price": "3.99",
        "currency": "USD",
        "tier": "pro",
        "interval_unit": "MONTH",
        "interval_count": 1,
        "storage_bytes": 1073741824,  # 1 GB
    },
    "pro_yearly": {
        "name": "Conniku PRO - Anual",
        "price": "39.99",
        "currency": "USD",
        "tier": "pro",
        "interval_unit": "YEAR",
        "interval_count": 1,
        "storage_bytes": 1073741824,
    },
    "max_monthly": {
        "name": "Conniku MAX - Mensual",
        "price": "7.99",
        "currency": "USD",
        "tier": "max",
        "interval_unit": "MONTH",
        "interval_count": 1,
        "storage_bytes": 3221225472,  # 3 GB
    },
    "max_yearly": {
        "name": "Conniku MAX - Anual",
        "price": "79.99",
        "currency": "USD",
        "tier": "max",
        "interval_unit": "YEAR",
        "interval_count": 1,
        "storage_bytes": 3221225472,
    },
}


async def _get_access_token() -> str:
    """Get PayPal OAuth2 access token."""
    if not PAYPAL_CLIENT_ID or not PAYPAL_CLIENT_SECRET:
        raise HTTPException(status_code=503, detail="PayPal not configured")

    auth = base64.b64encode(
        f"{PAYPAL_CLIENT_ID}:{PAYPAL_CLIENT_SECRET}".encode()
    ).decode()

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{PAYPAL_API}/v1/oauth2/token",
            headers={
                "Authorization": f"Basic {auth}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={"grant_type": "client_credentials"},
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=503, detail="PayPal auth failed")
        return resp.json()["access_token"]


def _pp_headers(token: str):
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


# ─── Health Check ──────────────────────────────────────────────

@router.get("/health")
def paypal_health():
    return {
        "provider": "paypal",
        "mode": PAYPAL_MODE,
        "configured": bool(PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET),
        "client_id_set": bool(PAYPAL_CLIENT_ID),
        "secret_set": bool(PAYPAL_CLIENT_SECRET),
        "webhook_id_set": bool(PAYPAL_WEBHOOK_ID),
    }


# ─── Plans ─────────────────────────────────────────────────────

@router.get("/plans")
def paypal_plans():
    return {
        key: {
            "name": p["name"],
            "price": p["price"],
            "currency": p["currency"],
            "tier": p["tier"],
            "interval": p["interval_unit"].lower(),
        }
        for key, p in PLANS.items()
    }


# ─── Create Order (One-time payment) ──────────────────────────

@router.post("/create-order")
async def create_order(request: Request, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Create a PayPal order for one-time payment."""
    body = await request.json()
    plan_id = body.get("plan_id", "pro_monthly")

    plan = PLANS.get(plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail=f"Plan '{plan_id}' no encontrado")

    token = await _get_access_token()

    order_data = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "reference_id": f"conniku_{plan_id}_{user.id}",
                "description": plan["name"],
                "amount": {
                    "currency_code": plan["currency"],
                    "value": plan["price"],
                },
                "custom_id": json.dumps({"user_id": user.id, "plan_id": plan_id, "tier": plan["tier"]}),
            }
        ],
        "payment_source": {
            "paypal": {
                "experience_context": {
                    "payment_method_preference": "IMMEDIATE_PAYMENT_REQUIRED",
                    "brand_name": "Conniku",
                    "locale": "es-CL",
                    "landing_page": "LOGIN",
                    "user_action": "PAY_NOW",
                    "return_url": f"{FRONTEND_URL}/suscripcion?paypal_status=approved",
                    "cancel_url": f"{FRONTEND_URL}/suscripcion?paypal_status=cancelled",
                }
            }
        },
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{PAYPAL_API}/v2/checkout/orders",
            headers=_pp_headers(token),
            json=order_data,
        )

    if resp.status_code not in (200, 201):
        print(f"[PayPal] Error creating order: {resp.text}")
        raise HTTPException(status_code=502, detail="Error al crear orden PayPal")

    order = resp.json()
    approve_link = next(
        (link["href"] for link in order.get("links", []) if link["rel"] == "payer-action"),
        None,
    )

    return {
        "order_id": order["id"],
        "status": order["status"],
        "approve_url": approve_link,
    }


# ─── Capture Order ─────────────────────────────────────────────

@router.post("/capture-order/{order_id}")
async def capture_order(order_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Capture an approved PayPal order."""
    token = await _get_access_token()

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{PAYPAL_API}/v2/checkout/orders/{order_id}/capture",
            headers=_pp_headers(token),
        )

    if resp.status_code not in (200, 201):
        print(f"[PayPal] Capture error: {resp.text}")
        raise HTTPException(status_code=502, detail="Error al capturar pago PayPal")

    capture_data = resp.json()
    status = capture_data.get("status", "")

    if status == "COMPLETED":
        # Extract payment details
        purchase_unit = capture_data.get("purchase_units", [{}])[0]
        custom_id = purchase_unit.get("payments", {}).get("captures", [{}])[0].get("custom_id", "{}")
        try:
            meta = json.loads(custom_id)
        except Exception:
            meta = {}

        tier = meta.get("tier", "pro")
        plan_id = meta.get("plan_id", "pro_monthly")
        plan = PLANS.get(plan_id, PLANS["pro_monthly"])
        amount = purchase_unit.get("payments", {}).get("captures", [{}])[0].get("amount", {})

        # Update user subscription
        user.subscription_tier = tier
        user.subscription_status = "active"
        user.storage_limit = plan["storage_bytes"]

        # Set expiry based on plan
        if "yearly" in plan_id:
            user.subscription_expires = datetime.utcnow() + timedelta(days=365)
        else:
            user.subscription_expires = datetime.utcnow() + timedelta(days=30)

        db.commit()

        # Log payment
        try:
            log = PaymentLog(
                id=gen_id(),
                user_id=user.id,
                provider="paypal",
                event_type="payment.captured",
                amount=float(amount.get("value", 0)),
                currency=amount.get("currency_code", "USD"),
                status="completed",
                metadata_json=json.dumps(capture_data),
            )
            db.add(log)
            db.commit()
        except Exception as e:
            print(f"[PayPal] Log error: {e}")

        # Notify CEO
        _notify_ceo_paypal(user, float(amount.get("value", 0)), amount.get("currency_code", "USD"), tier, "Pago completado")

        return {"status": "completed", "tier": tier}

    return {"status": status}


# ─── Create Subscription ──────────────────────────────────────

@router.post("/create-subscription")
async def create_subscription(request: Request, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Create a PayPal subscription (recurring payments)."""
    body = await request.json()
    plan_id = body.get("plan_id", "pro_monthly")

    plan = PLANS.get(plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail=f"Plan '{plan_id}' no encontrado")

    token = await _get_access_token()

    # First, create a product if not exists
    product_id = await _ensure_product(token)

    # Create a billing plan
    billing_plan_id = await _ensure_billing_plan(token, product_id, plan, plan_id)

    # Create subscription
    sub_data = {
        "plan_id": billing_plan_id,
        "subscriber": {
            "name": {"given_name": user.first_name or "Usuario", "surname": user.last_name or "Conniku"},
            "email_address": user.email,
        },
        "custom_id": json.dumps({"user_id": user.id, "plan_id": plan_id, "tier": plan["tier"]}),
        "application_context": {
            "brand_name": "Conniku",
            "locale": "es-CL",
            "user_action": "SUBSCRIBE_NOW",
            "payment_method": {
                "payer_selected": "PAYPAL",
                "payee_preferred": "IMMEDIATE_PAYMENT_REQUIRED",
            },
            "return_url": f"{FRONTEND_URL}/suscripcion?paypal_status=approved",
            "cancel_url": f"{FRONTEND_URL}/suscripcion?paypal_status=cancelled",
        },
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{PAYPAL_API}/v1/billing/subscriptions",
            headers=_pp_headers(token),
            json=sub_data,
        )

    if resp.status_code not in (200, 201):
        print(f"[PayPal] Subscription error: {resp.text}")
        raise HTTPException(status_code=502, detail="Error al crear suscripcion PayPal")

    sub = resp.json()
    approve_link = next(
        (link["href"] for link in sub.get("links", []) if link["rel"] == "approve"),
        None,
    )

    return {
        "subscription_id": sub["id"],
        "status": sub["status"],
        "approve_url": approve_link,
    }


# ─── Cancel Subscription ──────────────────────────────────────

@router.post("/cancel-subscription")
async def cancel_subscription(request: Request, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Cancel a PayPal subscription."""
    body = await request.json()
    subscription_id = body.get("subscription_id", "")

    if not subscription_id:
        raise HTTPException(status_code=400, detail="subscription_id requerido")

    token = await _get_access_token()

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{PAYPAL_API}/v1/billing/subscriptions/{subscription_id}/cancel",
            headers=_pp_headers(token),
            json={"reason": "Cancelado por el usuario"},
        )

    if resp.status_code not in (200, 204):
        print(f"[PayPal] Cancel error: {resp.text}")
        raise HTTPException(status_code=502, detail="Error al cancelar suscripcion")

    user.subscription_status = "cancelled"
    db.commit()

    return {"status": "cancelled"}


# ─── Webhook ──────────────────────────────────────────────────

@router.post("/webhook")
async def paypal_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle PayPal webhook notifications."""
    try:
        body = await request.json()
    except Exception:
        return {"received": True, "processed": False}

    event_type = body.get("event_type", "")
    resource = body.get("resource", {})

    print(f"[PayPal Webhook] event_type={event_type}")

    if not PAYPAL_CLIENT_ID:
        return {"received": True, "processed": False}

    try:
        if event_type == "CHECKOUT.ORDER.APPROVED":
            # Order approved — will be captured by frontend
            print(f"[PayPal] Order approved: {resource.get('id')}")

        elif event_type == "PAYMENT.CAPTURE.COMPLETED":
            custom_id = resource.get("custom_id", "{}")
            try:
                meta = json.loads(custom_id)
            except Exception:
                meta = {}

            user_id = meta.get("user_id")
            tier = meta.get("tier", "pro")
            plan_id = meta.get("plan_id", "pro_monthly")

            if user_id:
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    plan = PLANS.get(plan_id, PLANS["pro_monthly"])
                    user.subscription_tier = tier
                    user.subscription_status = "active"
                    user.storage_limit = plan["storage_bytes"]
                    if "yearly" in plan_id:
                        user.subscription_expires = datetime.utcnow() + timedelta(days=365)
                    else:
                        user.subscription_expires = datetime.utcnow() + timedelta(days=30)
                    db.commit()

                    amount = float(resource.get("amount", {}).get("value", 0))
                    currency = resource.get("amount", {}).get("currency_code", "USD")
                    _notify_ceo_paypal(user, amount, currency, tier, "Pago capturado via webhook")

        elif event_type == "BILLING.SUBSCRIPTION.ACTIVATED":
            custom_id = resource.get("custom_id", "{}")
            try:
                meta = json.loads(custom_id)
            except Exception:
                meta = {}

            user_id = meta.get("user_id")
            tier = meta.get("tier", "pro")
            plan_id = meta.get("plan_id", "pro_monthly")

            if user_id:
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    plan = PLANS.get(plan_id, PLANS["pro_monthly"])
                    user.subscription_tier = tier
                    user.subscription_status = "active"
                    user.storage_limit = plan["storage_bytes"]
                    if "yearly" in plan_id:
                        user.subscription_expires = datetime.utcnow() + timedelta(days=365)
                    else:
                        user.subscription_expires = datetime.utcnow() + timedelta(days=30)
                    db.commit()

        elif event_type == "BILLING.SUBSCRIPTION.CANCELLED":
            sub_id = resource.get("id", "")
            custom_id = resource.get("custom_id", "{}")
            try:
                meta = json.loads(custom_id)
            except Exception:
                meta = {}
            user_id = meta.get("user_id")
            if user_id:
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    user.subscription_status = "cancelled"
                    db.commit()

        elif event_type == "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
            custom_id = resource.get("custom_id", "{}")
            try:
                meta = json.loads(custom_id)
            except Exception:
                meta = {}
            user_id = meta.get("user_id")
            if user_id:
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    _notify_ceo_paypal(user, 0, "USD", user.subscription_tier or "pro", "Pago fallido")

    except Exception as e:
        import traceback
        print(f"[PayPal Webhook] Error: {e}\n{traceback.format_exc()}")

    return {"received": True}


# ─── Helpers ──────────────────────────────────────────────────

async def _ensure_product(token: str) -> str:
    """Get or create the Conniku product in PayPal."""
    async with httpx.AsyncClient() as client:
        # Check for existing product
        resp = await client.get(
            f"{PAYPAL_API}/v1/catalogs/products?page_size=10",
            headers=_pp_headers(token),
        )
        if resp.status_code == 200:
            products = resp.json().get("products", [])
            for p in products:
                if p.get("name") == "Conniku Suscripcion":
                    return p["id"]

        # Create product
        resp = await client.post(
            f"{PAYPAL_API}/v1/catalogs/products",
            headers=_pp_headers(token),
            json={
                "name": "Conniku Suscripcion",
                "description": "Plataforma de Desarrollo Universitario",
                "type": "SERVICE",
                "category": "EDUCATIONAL_AND_TEXTBOOKS",
                "home_url": "https://conniku.com",
            },
        )
        if resp.status_code in (200, 201):
            return resp.json()["id"]
        raise HTTPException(status_code=502, detail="Error al crear producto PayPal")


_billing_plan_cache: dict = {}

async def _ensure_billing_plan(token: str, product_id: str, plan: dict, plan_id: str) -> str:
    """Get or create a billing plan for a specific tier."""
    cache_key = f"{product_id}_{plan_id}"
    if cache_key in _billing_plan_cache:
        return _billing_plan_cache[cache_key]

    plan_data = {
        "product_id": product_id,
        "name": plan["name"],
        "description": f"Suscripcion {plan['name']}",
        "status": "ACTIVE",
        "billing_cycles": [
            {
                "frequency": {
                    "interval_unit": plan["interval_unit"],
                    "interval_count": plan["interval_count"],
                },
                "tenure_type": "REGULAR",
                "sequence": 1,
                "total_cycles": 0,  # infinite
                "pricing_scheme": {
                    "fixed_price": {
                        "value": plan["price"],
                        "currency_code": plan["currency"],
                    }
                },
            }
        ],
        "payment_preferences": {
            "auto_bill_outstanding": True,
            "payment_failure_threshold": 3,
        },
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{PAYPAL_API}/v1/billing/plans",
            headers=_pp_headers(token),
            json=plan_data,
        )

    if resp.status_code in (200, 201):
        bp_id = resp.json()["id"]
        _billing_plan_cache[cache_key] = bp_id
        return bp_id

    print(f"[PayPal] Plan creation error: {resp.text}")
    raise HTTPException(status_code=502, detail="Error al crear plan de suscripcion PayPal")


def _notify_ceo_paypal(user, amount: float, currency: str, tier: str, event: str):
    """Send CEO notification for PayPal payment events."""
    try:
        from notifications import _send_email_async, CEO_EMAIL
        html = f"""
        <div style="font-family:system-ui;padding:20px">
            <h2 style="color:#003087">PayPal — {event}</h2>
            <table style="border-collapse:collapse;width:100%">
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Usuario</td>
                    <td style="padding:8px;border:1px solid #ddd">{user.first_name} {user.last_name}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email</td>
                    <td style="padding:8px;border:1px solid #ddd">{user.email}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Plan</td>
                    <td style="padding:8px;border:1px solid #ddd">{tier.upper()}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Monto</td>
                    <td style="padding:8px;border:1px solid #ddd">${amount:,.2f} {currency}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Proveedor</td>
                    <td style="padding:8px;border:1px solid #ddd">PayPal</td></tr>
            </table>
        </div>
        """
        _send_email_async(CEO_EMAIL, f"PayPal: {user.first_name} — ${amount:,.2f} {currency}", html, email_type="payment_webhook")
    except Exception as e:
        print(f"[PayPal] CEO notification error: {e}")
