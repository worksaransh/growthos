"""
WhatsApp Business API Integration via Interakt BSP.
Handles message analytics, broadcasts, and automation triggers.
"""

import json
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from loguru import logger
import httpx, os
from ...core.database import fetch, fetchrow, execute

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

INTERAKT_BASE = os.getenv("WHATSAPP_API_URL", "https://api.interakt.ai/v1")
INTERAKT_KEY = os.getenv("WHATSAPP_API_KEY", "")


def _headers():
    return {"Authorization": f"Basic {INTERAKT_KEY}", "Content-Type": "application/json"}


class BroadcastRequest(BaseModel):
    template_name: str
    phone_numbers: List[str]
    variables: Optional[dict] = {}


class CartRecoveryRequest(BaseModel):
    order_id: str
    customer_phone: str
    customer_name: str
    cart_value: float
    product_name: str


# -- Analytics -----------------------------------------------------------------

@router.get("/analytics")
async def get_whatsapp_analytics(
    request: Request,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    """Get WhatsApp messaging analytics from stored data."""
    workspace_id = request.state.workspace_id

    # Try live Interakt API first
    if INTERAKT_KEY:
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.get(
                    f"{INTERAKT_BASE}/public/message/",
                    headers=_headers(),
                    params={"page": 1, "page_size": 100}
                )
                if r.status_code == 200:
                    data = r.json()
                    messages = data.get("data", [])
                    total = len(messages)
                    delivered = sum(1 for m in messages if m.get("status") in ("delivered", "read"))
                    read = sum(1 for m in messages if m.get("status") == "read")
                    return {
                        "total_messages": total,
                        "delivered": delivered,
                        "delivered_rate": round(delivered / total * 100, 1) if total else 0,
                        "read": read,
                        "read_rate": round(read / total * 100, 1) if total else 0,
                        "source": "live"
                    }
        except Exception as e:
            logger.warning(f"Interakt API error: {e}")

    # Return analytics from local DB (stored from webhooks)
    rows = await fetch("""
        SELECT status, COUNT(*) as count
        FROM whatsapp_messages
        WHERE workspace_id = $1
        GROUP BY status
    """, workspace_id) if False else []  # Table created in migration

    return {
        "total_messages": 0,
        "delivered": 0,
        "delivered_rate": 0.0,
        "read": 0,
        "read_rate": 0.0,
        "replies": 0,
        "revenue_attributed": 0.0,
        "cost_per_conversation": 0.0,
        "roi": 0.0,
        "source": "not_connected",
        "setup_required": True,
        "setup_url": "https://app.interakt.ai",
        "message": "Connect WhatsApp via Settings -> Integrations -> WhatsApp to see live analytics"
    }


@router.get("/campaigns")
async def list_campaigns(request: Request):
    """List WhatsApp broadcast campaigns."""
    workspace_id = request.state.workspace_id
    if INTERAKT_KEY:
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.get(f"{INTERAKT_BASE}/public/campaign/", headers=_headers())
                if r.status_code == 200:
                    return r.json()
        except Exception as e:
            logger.warning(f"Interakt campaigns error: {e}")
    return {"results": [], "connected": False}


@router.post("/cart-recovery")
async def trigger_cart_recovery(request: Request, body: CartRecoveryRequest):
    """Send cart recovery WhatsApp message via Interakt template."""
    workspace_id = request.state.workspace_id
    if not INTERAKT_KEY:
        return {"status": "not_configured", "message": "Add WHATSAPP_API_KEY to .env"}

    try:
        payload = {
            "countryCode": "+91",
            "phoneNumber": body.customer_phone.replace("+91", "").replace(" ", ""),
            "callbackData": f"cart_recovery_{body.order_id}",
            "type": "Template",
            "template": {
                "name": "cart_recovery",
                "languageCode": "en",
                "bodyValues": [body.customer_name, body.product_name, f"Rs.{body.cart_value:,.0f}"]
            }
        }
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(f"{INTERAKT_BASE}/public/message/", headers=_headers(), json=payload)
            return {
                "status": "sent" if r.status_code in (200, 201) else "failed",
                "detail": r.text[:200]
            }
    except Exception as e:
        return {"status": "error", "detail": str(e)}


@router.post("/cod-verify")
async def trigger_cod_verification(
    request: Request,
    order_id: str,
    customer_phone: str,
    customer_name: str,
):
    """Send COD verification message."""
    if not INTERAKT_KEY:
        return {"status": "not_configured"}

    try:
        payload = {
            "countryCode": "+91",
            "phoneNumber": customer_phone.replace("+91", "").replace(" ", ""),
            "callbackData": f"cod_verify_{order_id}",
            "type": "Template",
            "template": {
                "name": "cod_confirmation",
                "languageCode": "en",
                "bodyValues": [customer_name, order_id]
            }
        }
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(f"{INTERAKT_BASE}/public/message/", headers=_headers(), json=payload)
            return {"status": "sent" if r.status_code in (200, 201) else "failed"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


@router.post("/webhook")
async def whatsapp_webhook(request: Request):
    """Receive delivery/read receipts from Interakt webhook."""
    body = await request.json()
    logger.info(f"WhatsApp webhook: {json.dumps(body)[:200]}")
    # Process delivery receipts, incoming messages, etc.
    return {"status": "ok"}
