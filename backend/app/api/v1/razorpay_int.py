"""
Razorpay Integration — Webhooks, Order Creation, Payment Verification
"""

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
from loguru import logger
import httpx, os, hmac, hashlib, base64, json

from ...core.database import fetchrow, execute, fetch

router = APIRouter(prefix="/razorpay", tags=["razorpay"])

RAZORPAY_BASE = "https://api.razorpay.com/v1"


def _get_creds_from_row(row: dict) -> tuple[str, str, str]:
    """Extract key_id, key_secret, webhook_secret from api_credentials row."""
    key_id = (row or {}).get("razorpay_key_id") or ""
    key_secret = (row or {}).get("razorpay_key_secret") or ""
    webhook_secret = (row or {}).get("razorpay_webhook_secret") or ""
    return key_id, key_secret, webhook_secret


def _rzp_auth(key_id: str, key_secret: str) -> dict:
    creds = base64.b64encode(f"{key_id}:{key_secret}".encode()).decode()
    return {"Authorization": f"Basic {creds}", "Content-Type": "application/json"}


class CreateOrderRequest(BaseModel):
    amount: int
    currency: str = "INR"
    receipt: str


class VerifyPaymentRequest(BaseModel):
    payment_id: str
    order_id: str


# ---------------------------------------------------------------------------
# POST /razorpay/webhook
# ---------------------------------------------------------------------------
@router.post("/webhook")
async def razorpay_webhook(request: Request):
    """Handle Razorpay webhook events: payment.captured, payment.failed, refund.created."""
    workspace_id = getattr(request.state, "workspace_id", None)

    raw_body = await request.body()
    signature = request.headers.get("x-razorpay-signature", "")

    # Fetch webhook secret from DB (workspace_id may be None for unauthenticated webhooks)
    webhook_secret = ""
    if workspace_id:
        row = await fetchrow(
            "SELECT razorpay_webhook_secret FROM api_credentials WHERE workspace_id = $1 LIMIT 1",
            workspace_id,
        )
        if row:
            webhook_secret = row.get("razorpay_webhook_secret") or ""

    # Fallback to env var
    if not webhook_secret:
        webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")

    # Verify signature when secret is configured
    if webhook_secret and signature:
        expected = hmac.new(webhook_secret.encode(), raw_body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            logger.error("Razorpay webhook signature mismatch")
            raise HTTPException(status_code=400, detail="Invalid signature")
    elif webhook_secret and not signature:
        logger.error("Razorpay webhook missing signature header")
        raise HTTPException(status_code=400, detail="Missing signature")

    try:
        payload = json.loads(raw_body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    event = payload.get("event", "unknown")
    entity = payload.get("payload", {}).get("payment", {}).get("entity", {})

    logger.info(f"Razorpay webhook received: event={event}, payment_id={entity.get('id')}")

    # Persist event to payments table
    try:
        await execute(
            """
            INSERT INTO payments (workspace_id, gateway, event_type, gateway_payment_id, amount,
                                  currency, status, raw_payload, created_at)
            VALUES ($1, 'razorpay', $2, $3, $4, $5, $6, $7::jsonb, NOW())
            ON CONFLICT DO NOTHING
            """,
            workspace_id,
            event,
            entity.get("id"),
            entity.get("amount"),
            entity.get("currency", "INR"),
            entity.get("status"),
            json.dumps(payload),
        )
    except Exception as e:
        logger.error(f"Failed to persist Razorpay webhook event: {e}")

    return {"received": True, "event": event}


# ---------------------------------------------------------------------------
# GET /razorpay/status
# ---------------------------------------------------------------------------
@router.get("/status")
async def razorpay_status(request: Request):
    """Return Razorpay configuration status for the workspace."""
    workspace_id = request.state.workspace_id

    row = await fetchrow(
        "SELECT razorpay_key_id, razorpay_key_secret, razorpay_webhook_secret FROM api_credentials WHERE workspace_id = $1 LIMIT 1",
        workspace_id,
    )

    key_id = bool((row or {}).get("razorpay_key_id"))
    key_secret = bool((row or {}).get("razorpay_key_secret"))
    webhook_secret = bool((row or {}).get("razorpay_webhook_secret"))

    configured = key_id and key_secret

    logger.info(f"Razorpay status check for workspace {workspace_id}: configured={configured}")

    return {
        "configured": configured,
        "key_id_set": key_id,
        "key_secret_set": key_secret,
        "webhook_secret_set": webhook_secret,
    }


# ---------------------------------------------------------------------------
# POST /razorpay/verify-payment
# ---------------------------------------------------------------------------
@router.post("/verify-payment")
async def verify_payment(request: Request, body: VerifyPaymentRequest):
    """Fetch and verify a payment from Razorpay API by payment_id and order_id."""
    workspace_id = request.state.workspace_id

    row = await fetchrow(
        "SELECT razorpay_key_id, razorpay_key_secret FROM api_credentials WHERE workspace_id = $1 LIMIT 1",
        workspace_id,
    )
    key_id, key_secret, _ = _get_creds_from_row(row)

    if not (key_id and key_secret):
        logger.info(f"Razorpay not configured for workspace {workspace_id}")
        return {"status": "not_configured", "message": "Razorpay API credentials not set for this workspace"}

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f"{RAZORPAY_BASE}/payments/{body.payment_id}",
                headers=_rzp_auth(key_id, key_secret),
            )
            if r.status_code == 200:
                data = r.json()
                # Basic order_id cross-check
                if data.get("order_id") and data.get("order_id") != body.order_id:
                    logger.error(
                        f"Razorpay payment {body.payment_id} order_id mismatch: "
                        f"expected {body.order_id}, got {data.get('order_id')}"
                    )
                    return {"verified": False, "reason": "order_id mismatch", "payment": data}
                logger.info(f"Razorpay payment verified: {body.payment_id} status={data.get('status')}")
                return {"verified": data.get("status") == "captured", "payment": data}
            else:
                logger.error(f"Razorpay verify-payment API error: {r.status_code} {r.text}")
                raise HTTPException(status_code=r.status_code, detail=r.text)
    except httpx.RequestError as e:
        logger.error(f"Razorpay verify-payment request error: {e}")
        raise HTTPException(status_code=502, detail=f"Razorpay API unreachable: {e}")


# ---------------------------------------------------------------------------
# POST /razorpay/create-order
# ---------------------------------------------------------------------------
@router.post("/create-order")
async def create_order(request: Request, body: CreateOrderRequest):
    """Create a Razorpay order."""
    workspace_id = request.state.workspace_id

    row = await fetchrow(
        "SELECT razorpay_key_id, razorpay_key_secret FROM api_credentials WHERE workspace_id = $1 LIMIT 1",
        workspace_id,
    )
    key_id, key_secret, _ = _get_creds_from_row(row)

    if not (key_id and key_secret):
        logger.info(f"Razorpay not configured for workspace {workspace_id}")
        return {"status": "not_configured", "message": "Razorpay API credentials not set for this workspace"}

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                f"{RAZORPAY_BASE}/orders",
                headers=_rzp_auth(key_id, key_secret),
                json={
                    "amount": body.amount,
                    "currency": body.currency,
                    "receipt": body.receipt,
                },
            )
            if r.status_code in (200, 201):
                data = r.json()
                logger.info(f"Razorpay order created: {data.get('id')} amount={body.amount} {body.currency}")
                return {"order": data}
            else:
                logger.error(f"Razorpay create-order API error: {r.status_code} {r.text}")
                raise HTTPException(status_code=r.status_code, detail=r.text)
    except httpx.RequestError as e:
        logger.error(f"Razorpay create-order request error: {e}")
        raise HTTPException(status_code=502, detail=f"Razorpay API unreachable: {e}")
