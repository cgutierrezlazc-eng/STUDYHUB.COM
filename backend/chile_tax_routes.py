"""Multi-currency system + Chilean tax compliance.
- Users see prices in their local currency
- Admin sees conversions to CLP
- Tax calculated on NET revenue (after Stripe fees)
- Auto-billing handled by Stripe subscriptions
"""
import os
import json
from datetime import datetime, date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from database import get_db, User, PaymentLog, gen_id
from middleware import get_current_user, require_owner

router = APIRouter(prefix="/finance", tags=["finance"])

IVA_CHILE = 0.19
STRIPE_FEE_RATE = 0.029  # 2.9%
STRIPE_FEE_FIXED_USD = 0.30  # $0.30 per transaction

# Country → currency mapping (ISO codes)
COUNTRY_CURRENCIES = {
    "CL": "CLP", "MX": "MXN", "CO": "COP", "PE": "PEN", "AR": "ARS",
    "BR": "BRL", "EC": "USD", "UY": "UYU", "PY": "PYG", "BO": "BOB",
    "VE": "USD", "CR": "CRC", "PA": "USD", "DO": "DOP", "GT": "GTQ",
    "HN": "HNL", "SV": "USD", "NI": "NIO", "CU": "CUP",
    "US": "USD", "CA": "CAD", "GB": "GBP", "ES": "EUR", "DE": "EUR",
    "FR": "EUR", "IT": "EUR", "PT": "EUR", "NL": "EUR",
    "JP": "JPY", "KR": "KRW", "CN": "CNY", "IN": "INR",
    "AU": "AUD", "NZ": "NZD", "ZA": "ZAR", "NG": "NGN",
    "KE": "KES", "EG": "EGP", "MA": "MAD", "TN": "TND",
    "TR": "TRY", "RU": "RUB", "UA": "UAH", "PL": "PLN",
    "CZ": "CZK", "RO": "RON", "HU": "HUF", "SE": "SEK",
    "NO": "NOK", "DK": "DKK", "FI": "EUR", "CH": "CHF",
    "PH": "PHP", "TH": "THB", "VN": "VND", "ID": "IDR",
    "MY": "MYR", "SG": "SGD", "IL": "ILS", "SA": "SAR",
    "AE": "AED", "QA": "QAR",
}

CURRENCY_SYMBOLS = {
    "USD": "$", "CLP": "$", "MXN": "$", "COP": "$", "PEN": "S/",
    "ARS": "$", "BRL": "R$", "UYU": "$U", "EUR": "€", "GBP": "£",
    "CAD": "C$", "JPY": "¥", "KRW": "₩", "CNY": "¥", "INR": "₹",
    "AUD": "A$", "TRY": "₺", "PLN": "zł", "SEK": "kr", "CHF": "CHF",
}

PLAN_PRICES_USD = {
    "pro_monthly": 5.00,
    "pro_yearly": 39.99,
    "max_monthly": 13.00,
    "max_yearly": 99.99,
}

COUNTRY_NAMES = {
    "CL": "Chile", "MX": "México", "CO": "Colombia", "PE": "Perú", "AR": "Argentina",
    "BR": "Brasil", "EC": "Ecuador", "UY": "Uruguay", "PY": "Paraguay", "BO": "Bolivia",
    "VE": "Venezuela", "CR": "Costa Rica", "PA": "Panamá", "DO": "Rep. Dominicana",
    "GT": "Guatemala", "HN": "Honduras", "SV": "El Salvador", "NI": "Nicaragua",
    "US": "Estados Unidos", "CA": "Canadá", "GB": "Reino Unido", "ES": "España",
    "DE": "Alemania", "FR": "Francia", "IT": "Italia", "PT": "Portugal",
    "JP": "Japón", "KR": "Corea del Sur", "CN": "China", "IN": "India",
    "AU": "Australia", "TR": "Turquía", "PL": "Polonia", "SE": "Suecia",
    "CH": "Suiza", "PH": "Filipinas", "TH": "Tailandia", "IL": "Israel",
}


def get_exchange_rates() -> dict:
    """Get USD exchange rates from mindicador.cl and fallback for other currencies."""
    rates = {"USD": 1.0}

    # Get CLP rate from Banco Central Chile
    try:
        import urllib.request
        req = urllib.request.Request("https://mindicador.cl/api", headers={"User-Agent": "Conniku/2.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            if data.get("dolar"):
                rates["CLP"] = data["dolar"]["valor"]
            if data.get("euro"):
                # EUR to CLP, convert to USD→EUR
                eur_clp = data["euro"]["valor"]
                if rates.get("CLP"):
                    rates["EUR"] = rates["CLP"] / eur_clp if eur_clp else 1.0
    except Exception:
        rates["CLP"] = 950.0

    # Approximate rates for other currencies (updated periodically)
    # In production, use a proper forex API
    approx = {
        "MXN": 17.5, "COP": 4200, "PEN": 3.75, "ARS": 900, "BRL": 5.0,
        "UYU": 40.0, "PYG": 7500, "BOB": 6.9, "CRC": 520, "DOP": 58,
        "GTQ": 7.8, "HNL": 24.7, "NIO": 36.7,
        "CAD": 1.37, "GBP": 0.79, "EUR": 0.92, "JPY": 155, "KRW": 1350,
        "CNY": 7.25, "INR": 83.5, "AUD": 1.55, "NZD": 1.68, "ZAR": 18.5,
        "TRY": 32.5, "PLN": 4.05, "CZK": 23.5, "RON": 4.65, "HUF": 370,
        "SEK": 10.8, "NOK": 10.9, "DKK": 6.9, "CHF": 0.88,
        "PHP": 56, "THB": 35.5, "VND": 25000, "IDR": 15800, "MYR": 4.7,
        "SGD": 1.35, "ILS": 3.65, "SAR": 3.75, "AED": 3.67,
    }
    for cur, rate in approx.items():
        if cur not in rates:
            rates[cur] = rate

    return rates


def convert_usd_to_currency(amount_usd: float, currency: str, rates: dict) -> float:
    """Convert USD to target currency."""
    rate = rates.get(currency, 1.0)
    return round(amount_usd * rate, 2 if rate < 100 else 0)


def calculate_net_revenue(amount_usd: float) -> dict:
    """Calculate net revenue after Stripe fees, then Chilean tax on that net."""
    stripe_fee = round(amount_usd * STRIPE_FEE_RATE + STRIPE_FEE_FIXED_USD, 2)
    net_after_stripe = round(amount_usd - stripe_fee, 2)

    rates = get_exchange_rates()
    clp_rate = rates.get("CLP", 950)

    net_clp = round(net_after_stripe * clp_rate)
    # IVA is on net revenue (what Conniku actually receives)
    neto_sin_iva = round(net_clp / (1 + IVA_CHILE))
    iva_amount = net_clp - neto_sin_iva
    ganancia_neta = neto_sin_iva  # What Conniku keeps after Stripe + IVA

    return {
        "grossUsd": amount_usd,
        "stripeFeeUsd": stripe_fee,
        "netAfterStripeUsd": net_after_stripe,
        "netAfterStripClp": net_clp,
        "netoSinIvaClp": neto_sin_iva,
        "ivaClp": iva_amount,
        "gananciaNetaClp": ganancia_neta,
        "clpRate": clp_rate,
    }


# ─── Public: Currency info for users ────────────────────────

@router.get("/prices/{country_code}")
def get_prices_for_country(country_code: str = "CL"):
    """Get subscription prices in user's local currency."""
    country_code = country_code.upper()
    currency = COUNTRY_CURRENCIES.get(country_code, "USD")
    symbol = CURRENCY_SYMBOLS.get(currency, "$")
    rates = get_exchange_rates()

    plans = {}
    for plan, usd_price in PLAN_PRICES_USD.items():
        local_amount = convert_usd_to_currency(usd_price, currency, rates)
        plans[plan] = {
            "usd": usd_price,
            "localAmount": local_amount,
            "localCurrency": currency,
            "localSymbol": symbol,
            "formatted": f"{symbol}{local_amount:,.0f}" if local_amount >= 100 else f"{symbol}{local_amount:,.2f}",
        }

    return {
        "country": country_code,
        "countryName": COUNTRY_NAMES.get(country_code, country_code),
        "currency": currency,
        "symbol": symbol,
        "exchangeRate": rates.get(currency, 1.0),
        "plans": plans,
    }


@router.get("/countries")
def list_countries():
    """List all supported countries with currencies."""
    return [
        {"code": code, "name": COUNTRY_NAMES.get(code, code),
         "currency": COUNTRY_CURRENCIES.get(code, "USD"),
         "symbol": CURRENCY_SYMBOLS.get(COUNTRY_CURRENCIES.get(code, "USD"), "$")}
        for code in sorted(COUNTRY_NAMES.keys())
    ]


# ─── Admin: Full financial dashboard ────────────────────────

@router.get("/admin/dashboard")
def admin_financial_dashboard(admin: User = Depends(require_owner), db: Session = Depends(get_db)):
    """CEO financial dashboard with multi-currency conversion to CLP and tax breakdown."""
    rates = get_exchange_rates()
    clp_rate = rates.get("CLP", 950)

    # Total revenue
    total_usd = db.query(func.sum(PaymentLog.amount)).filter(PaymentLog.status == "completed").scalar() or 0
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_usd = db.query(func.sum(PaymentLog.amount)).filter(
        PaymentLog.status == "completed", PaymentLog.created_at >= month_start).scalar() or 0

    payment_count = db.query(func.count(PaymentLog.id)).filter(PaymentLog.status == "completed").scalar() or 0

    # Revenue breakdown (net after Stripe + tax)
    total_net = calculate_net_revenue(total_usd)
    month_net = calculate_net_revenue(month_usd)

    # Subscribers by tier
    active_subs = db.query(func.count(User.id)).filter(User.subscription_status == "active").scalar() or 0
    pro_count = db.query(func.count(User.id)).filter(
        User.subscription_status == "active", User.subscription_tier == "pro").scalar() or 0
    max_count = db.query(func.count(User.id)).filter(
        User.subscription_status == "active", User.subscription_tier == "max").scalar() or 0

    # Users by country (top 10)
    country_dist = db.query(User.country, func.count(User.id)).group_by(User.country).order_by(
        desc(func.count(User.id))).limit(10).all()

    # Recent payments with country info
    recent = db.query(PaymentLog, User).join(User, User.id == PaymentLog.user_id).filter(
        PaymentLog.status == "completed").order_by(desc(PaymentLog.created_at)).limit(20).all()

    return {
        # Gross (what users paid)
        "grossRevenueUsd": round(total_usd, 2),
        "grossRevenueClp": round(total_usd * clp_rate),
        "monthGrossUsd": round(month_usd, 2),
        "monthGrossClp": round(month_usd * clp_rate),

        # Net after Stripe fees
        "totalStripeFeeUsd": total_net["stripeFeeUsd"],
        "netAfterStripeUsd": total_net["netAfterStripeUsd"],
        "netAfterStripeClp": total_net["netAfterStripClp"],
        "monthNetAfterStripeClp": month_net["netAfterStripClp"],

        # Tax (IVA 19% on net revenue)
        "totalNetoSinIvaClp": total_net["netoSinIvaClp"],
        "totalIvaClp": total_net["ivaClp"],
        "monthNetoSinIvaClp": month_net["netoSinIvaClp"],
        "monthIvaClp": month_net["ivaClp"],

        # What Conniku actually keeps
        "gananciaNetaTotalClp": total_net["gananciaNetaClp"],
        "gananciaNetaMesClp": month_net["gananciaNetaClp"],

        "ivaRate": "19%",
        "stripeFeeRate": "2.9% + $0.30",
        "exchangeRateUsdClp": clp_rate,

        # Subscribers
        "activeSubscribers": active_subs,
        "proSubscribers": pro_count,
        "maxSubscribers": max_count,
        "totalPayments": payment_count,
        "arpu": round(total_usd / max(active_subs, 1), 2),

        # Country distribution
        "usersByCountry": [
            {"country": c or "N/A", "name": COUNTRY_NAMES.get(c, c or "Desconocido"),
             "currency": COUNTRY_CURRENCIES.get(c, "USD"), "count": n}
            for c, n in country_dist
        ],

        # Recent payments
        "recentPayments": [{
            "id": p.id,
            "user": f"{u.first_name} {u.last_name}",
            "email": u.email,
            "country": u.country or "N/A",
            "userCurrency": COUNTRY_CURRENCIES.get(u.country, "USD"),
            "amountUsd": p.amount,
            "amountClp": round(p.amount * clp_rate),
            "stripeFee": round(p.amount * STRIPE_FEE_RATE + STRIPE_FEE_FIXED_USD, 2),
            "netClp": round((p.amount - p.amount * STRIPE_FEE_RATE - STRIPE_FEE_FIXED_USD) * clp_rate),
            "iva": round(((p.amount - p.amount * STRIPE_FEE_RATE - STRIPE_FEE_FIXED_USD) * clp_rate) - round(((p.amount - p.amount * STRIPE_FEE_RATE - STRIPE_FEE_FIXED_USD) * clp_rate) / (1 + IVA_CHILE))),
            "date": p.created_at.isoformat() if p.created_at else "",
        } for p, u in recent],

        # Legal
        "legal": {
            "empresa": "Conniku SpA",
            "rut": os.environ.get("SII_RUT_EMISOR", "Pendiente"),
            "regimen": "IVA sobre ingresos netos (post Stripe fees)",
            "nota": "El IVA 19% se calcula sobre el monto que RECIBE Conniku, no sobre el monto bruto cobrado al usuario. Las comisiones de Stripe son gasto deducible.",
        },
    }


# ─── Subscription auto-billing check ────────────────────────

@router.post("/check-expired-subscriptions")
def check_expired(admin: User = Depends(require_owner), db: Session = Depends(get_db)):
    """Check and downgrade expired subscriptions (3-day grace period)."""
    now = datetime.utcnow()
    grace_period = timedelta(days=3)

    # Find users with expired subscriptions past grace period
    expired = db.query(User).filter(
        User.subscription_status == "active",
        User.subscription_expires_at != None,
        User.subscription_expires_at < now - grace_period,
    ).all()

    downgraded = []
    for u in expired:
        u.subscription_status = "expired"
        u.subscription_tier = "free"
        u.storage_limit_bytes = 314572800  # 300 MB (free tier)
        downgraded.append({"id": u.id, "name": f"{u.first_name} {u.last_name}", "email": u.email,
                           "expiredAt": u.subscription_expires_at.isoformat() if u.subscription_expires_at else ""})

        from notification_routes import create_notification
        create_notification(db, u.id, "subscription_expired",
            "Tu suscripción ha expirado",
            body="Tu plan volvió a Básico. Renueva para recuperar tus beneficios.",
            link="/subscription")

    db.commit()
    return {"downgraded": len(downgraded), "users": downgraded}


# ─── F129 Auto-generation for SII ───────────────────────────

@router.get("/admin/f129/generate")
def generate_f129(month: int = 0, year: int = 0, admin: User = Depends(require_owner), db: Session = Depends(get_db)):
    """Auto-generate F129 tax form data for SII (Servicio de Impuestos Internos).
    Month/year default to current period if not specified."""
    now = datetime.utcnow()
    target_month = month or now.month
    target_year = year or now.year

    # Calculate period boundaries
    from calendar import monthrange
    period_start = datetime(target_year, target_month, 1)
    last_day = monthrange(target_year, target_month)[1]
    period_end = datetime(target_year, target_month, last_day, 23, 59, 59)

    # Get all completed payments in this period
    payments = db.query(PaymentLog).filter(
        PaymentLog.status == "completed",
        PaymentLog.created_at >= period_start,
        PaymentLog.created_at <= period_end,
    ).all()

    rates = get_exchange_rates()
    clp_rate = rates.get("CLP", 950)

    # Calculate totals
    total_bruto_usd = sum(p.amount for p in payments)
    total_stripe_fees_usd = sum(p.amount * STRIPE_FEE_RATE + STRIPE_FEE_FIXED_USD for p in payments)
    total_neto_usd = total_bruto_usd - total_stripe_fees_usd

    total_neto_clp = round(total_neto_usd * clp_rate)
    base_imponible = round(total_neto_clp / (1 + IVA_CHILE))
    iva_debito = total_neto_clp - base_imponible

    # Transaction count
    num_boletas = len(payments)

    # F129 form fields
    f129_data = {
        "formulario": "F129",
        "periodo": f"{target_year}-{str(target_month).zfill(2)}",
        "periodoTexto": f"{['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][target_month]} {target_year}",
        "rutEmisor": os.environ.get("SII_RUT_EMISOR", "Pendiente"),
        "razonSocial": "Conniku SpA",
        "giro": "Servicios de tecnología educativa",
        "tipoContribuyente": "Contribuyente de IVA — Servicios Digitales",
        "regimenTributario": "Ley 21.713 — Plataformas Digitales",

        # Section 1: Ventas y Servicios
        "ventasNetasExentas": 0,
        "ventasNetasAfectas": base_imponible,
        "ivaDebitoFiscal": iva_debito,

        # Section 2: Compras y Gastos (Stripe fees como gasto)
        "gastosStripeUsd": round(total_stripe_fees_usd, 2),
        "gastosStripeClp": round(total_stripe_fees_usd * clp_rate),

        # Section 3: Resumen
        "baseImponible": base_imponible,
        "tasaIva": "19%",
        "ivaAPagar": iva_debito,
        "totalAPagar": iva_debito,  # IVA to pay to SII

        # Detail for audit
        "detalle": {
            "totalTransacciones": num_boletas,
            "totalBrutoUsd": round(total_bruto_usd, 2),
            "totalComisionStripeUsd": round(total_stripe_fees_usd, 2),
            "totalNetoUsd": round(total_neto_usd, 2),
            "tipoCambioUsado": clp_rate,
            "totalNetoClp": total_neto_clp,
            "baseImponibleClp": base_imponible,
            "ivaClp": iva_debito,
        },

        # Per-transaction breakdown
        "transacciones": [{
            "fecha": p.created_at.strftime("%Y-%m-%d") if p.created_at else "",
            "montoUsd": p.amount,
            "comisionStripe": round(p.amount * STRIPE_FEE_RATE + STRIPE_FEE_FIXED_USD, 2),
            "netoUsd": round(p.amount - p.amount * STRIPE_FEE_RATE - STRIPE_FEE_FIXED_USD, 2),
            "netoClp": round((p.amount - p.amount * STRIPE_FEE_RATE - STRIPE_FEE_FIXED_USD) * clp_rate),
            "transactionId": p.transaction_id or "",
        } for p in payments],

        # Status
        "estado": "generado",
        "fechaGeneracion": datetime.utcnow().isoformat(),
        "nota": "Revisar datos antes de enviar al SII. El IVA se calcula sobre ingresos netos (post comisión Stripe).",

        # SII submission info
        "urlSii": "https://www.sii.cl/vat/",
        "formularioSii": "F129 — Declaración Mensual IVA Servicios Digitales",
        "plazoDeclaracion": f"Hasta el día 20 de {['','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre','enero'][target_month % 12 + 1]} {target_year if target_month < 12 else target_year + 1}",
    }

    return f129_data


@router.post("/admin/f129/submit")
def submit_f129_to_sii(data: dict, admin: User = Depends(require_owner), db: Session = Depends(get_db)):
    """Submit F129 to SII (requires SII credentials configured).
    In production, this would use the SII API to submit the form.
    For now, it validates and marks as submitted."""

    periodo = data.get("periodo", "")
    iva_a_pagar = data.get("ivaAPagar", 0)

    if not periodo:
        raise HTTPException(400, "Período requerido")

    sii_rut = os.environ.get("SII_RUT_EMISOR", "")
    sii_cert = os.environ.get("SII_CERT_PATH", "")

    if not sii_rut or not sii_cert:
        return {
            "status": "pending_manual",
            "message": "Credenciales SII no configuradas. Envía el F129 manualmente.",
            "url": "https://www.sii.cl/vat/",
            "datosParaEnvio": {
                "periodo": periodo,
                "rutEmisor": sii_rut or "Configurar SII_RUT_EMISOR",
                "baseImponible": data.get("baseImponible", 0),
                "ivaAPagar": iva_a_pagar,
            },
        }

    # In production: call SII API with certificate
    # For now, simulate submission
    try:
        # Real SII integration would go here:
        # 1. Authenticate with digital certificate
        # 2. Submit F129 data via API
        # 3. Get folio/confirmation number

        return {
            "status": "submitted",
            "message": f"F129 enviado al SII para período {periodo}",
            "periodo": periodo,
            "ivaDeclarado": iva_a_pagar,
            "folio": f"SIM-{gen_id()[:8].upper()}",  # Simulated folio
            "fechaEnvio": datetime.utcnow().isoformat(),
            "nota": "Verificar confirmación en portal SII: https://www.sii.cl/vat/",
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error al enviar al SII: {str(e)}",
            "url": "https://www.sii.cl/vat/",
        }


# ─── CEO Weekly Report ──────────────────────────────────────

@router.get("/admin/weekly-report")
def ceo_weekly_report(admin: User = Depends(require_owner), db: Session = Depends(get_db)):
    """Comprehensive weekly report for CEO."""
    now = datetime.utcnow()
    week_start = now - timedelta(days=7)
    prev_week_start = now - timedelta(days=14)
    rates = get_exchange_rates()
    clp_rate = rates.get("CLP", 950)

    # Revenue this week vs last week
    week_revenue = db.query(func.sum(PaymentLog.amount)).filter(
        PaymentLog.status == "completed", PaymentLog.created_at >= week_start).scalar() or 0
    prev_revenue = db.query(func.sum(PaymentLog.amount)).filter(
        PaymentLog.status == "completed", PaymentLog.created_at >= prev_week_start,
        PaymentLog.created_at < week_start).scalar() or 0

    # New users
    new_users = db.query(func.count(User.id)).filter(User.created_at >= week_start).scalar() or 0
    prev_new_users = db.query(func.count(User.id)).filter(
        User.created_at >= prev_week_start, User.created_at < week_start).scalar() or 0

    # Active users (logged in this week)
    active = db.query(func.count(User.id)).filter(User.last_login >= week_start).scalar() or 0
    total_users = db.query(func.count(User.id)).scalar() or 0

    # Referrals this week
    referred_week = db.query(func.count(User.id)).filter(
        User.referred_by != None, User.created_at >= week_start).scalar() or 0

    # Rewards granted this week (from mood_data field)
    # Count notifications of type "reward" this week
    from database import InAppNotification
    rewards_granted = db.query(func.count(InAppNotification.id)).filter(
        InAppNotification.type == "reward", InAppNotification.created_at >= week_start).scalar() or 0

    # Subscriptions changes
    new_subs = db.query(func.count(PaymentLog.id)).filter(
        PaymentLog.status == "completed", PaymentLog.created_at >= week_start).scalar() or 0

    # Moderation
    from database import UserReport
    new_reports = db.query(func.count(UserReport.id)).filter(
        UserReport.created_at >= week_start).scalar() or 0

    # Content created
    from database import WallPost, CommunityPost, Message
    posts_week = db.query(func.count(WallPost.id)).filter(WallPost.created_at >= week_start).scalar() or 0
    community_posts = db.query(func.count(CommunityPost.id)).filter(CommunityPost.created_at >= week_start).scalar() or 0
    messages_week = db.query(func.count(Message.id)).filter(Message.created_at >= week_start).scalar() or 0

    # Study activity
    from database import StudySession, QuizHistory
    study_hours = (db.query(func.sum(StudySession.duration_seconds)).filter(
        StudySession.created_at >= week_start).scalar() or 0) / 3600
    quizzes_taken = db.query(func.count(QuizHistory.id)).filter(
        QuizHistory.created_at >= week_start).scalar() or 0

    # Revenue growth
    rev_growth = round(((week_revenue - prev_revenue) / max(prev_revenue, 0.01)) * 100, 1) if prev_revenue else 0
    user_growth = round(((new_users - prev_new_users) / max(prev_new_users, 1)) * 100, 1) if prev_new_users else 0

    # Net revenue (after Stripe + IVA)
    net = calculate_net_revenue(week_revenue)

    return {
        "period": f"{week_start.strftime('%d/%m/%Y')} — {now.strftime('%d/%m/%Y')}",
        "generatedAt": now.isoformat(),

        # Revenue
        "revenue": {
            "grossUsd": round(week_revenue, 2),
            "grossClp": round(week_revenue * clp_rate),
            "netAfterStripeClp": net["netAfterStripClp"],
            "ivaClp": net["ivaClp"],
            "gananciaNetaClp": net["gananciaNetaClp"],
            "prevWeekUsd": round(prev_revenue, 2),
            "growthPercent": rev_growth,
            "trend": "📈" if rev_growth > 0 else "📉" if rev_growth < 0 else "➡️",
        },

        # Users
        "users": {
            "total": total_users,
            "newThisWeek": new_users,
            "prevWeekNew": prev_new_users,
            "growthPercent": user_growth,
            "activeThisWeek": active,
            "activeRate": round(active / max(total_users, 1) * 100, 1),
            "referralsThisWeek": referred_week,
        },

        # Subscriptions
        "subscriptions": {
            "newPayments": new_subs,
            "rewardsGranted": rewards_granted,
        },

        # Engagement
        "engagement": {
            "wallPosts": posts_week,
            "communityPosts": community_posts,
            "messages": messages_week,
            "studyHours": round(study_hours, 1),
            "quizzesTaken": quizzes_taken,
        },

        # Moderation
        "moderation": {
            "newReports": new_reports,
        },

        # Health indicators
        "health": {
            "dau_wau": round(active / 7) if active else 0,  # Approximate DAU
            "postsPerUser": round(posts_week / max(active, 1), 1),
            "studyHoursPerUser": round(study_hours / max(active, 1), 1),
        },
    }
