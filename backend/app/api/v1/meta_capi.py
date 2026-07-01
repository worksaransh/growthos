"""
Meta Conversions API (CAPI) - Server-side event tracking.
Sends purchase, checkout, and lead events directly from server to Meta.
Bypasses iOS14+ tracking restrictions.
Requires: Meta Pixel ID + Conversions API Access Token.
"""

from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
from loguru import logger
import httpx, os, hashlib, time
from ...core.database import fetch, fetchrow

router = APIRouter(prefix="/meta-capi", tags=["meta_capi"])

CAPI_BASE = "https://graph.facebook.com/v19.0"
META_PIXEL_ID = os.getenv("META_PIXEL_ID", "")
META_CAPI_TOKEN = os.getenv("META_CAPI_ACCESS_TOKEN", "")


def _hash_pii(value: Optional[str]) -> Optional[str]:
    """SHA256 hash PII for Meta CAPI (required by Meta)."""
    if not value:
        return None
    return hashlib.sha256(value.strip().lower().encode()).hexdigest()


class CAPIEvent(BaseModel):
    event_name: str  # Purchase | InitiateCheckout | AddToCart | Lead | ViewContent
    event_time: Optional[int] = None  # Unix timestamp
    event_source_url: Optional[str] = None
    # Order data
    order_id: Optional[str] = None
    value: Optional[float] = None
    currency: str = "INR"
    content_ids: Optional[List[str]] = None
    num_items: Optional[int] = None
    # User data (will be hashed)
    email: Optional[str] = None
    phone: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = "IN"
    # Deduplication
    event_id: Optional[str] = None
    fbp: Optional[str] = None  # _fbp cookie
    fbc: Optional[str] = None  # _fbc cookie


async def _send_capi_event(pixel_id: str, token: str, events: list) -> dict:
    """Send events to Meta CAPI."""
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            f"{CAPI_BASE}/{pixel_id}/events",
            params={"access_token": token},
            json={"data": events, "test_event_code": os.getenv("META_CAPI_TEST_CODE", "")}
        )
        return r.json() if r.status_code == 200 else {"error": r.text[:200]}


def _build_capi_payload(event: CAPIEvent) -> dict:
    """Build CAPI event payload with hashed user data."""
    payload = {
        "event_name": event.event_name,
        "event_time": event.event_time or int(time.time()),
        "action_source": "website",
        "user_data": {
            "em": [_hash_pii(event.email)] if event.email else [],
            "ph": [_hash_pii(event.phone)] if event.phone else [],
            "fn": [_hash_pii(event.first_name)] if event.first_name else [],
            "ln": [_hash_pii(event.last_name)] if event.last_name else [],
            "ct": [_hash_pii(event.city)] if event.city else [],
            "st": [_hash_pii(event.state)] if event.state else [],
            "country": [_hash_pii(event.country)],
            "client_ip_address": None,
            "client_user_agent": None,
            "fbp": event.fbp,
            "fbc": event.fbc,
        },
    }

    if event.event_source_url:
        payload["event_source_url"] = event.event_source_url
    
    if event.event_id:
        payload["event_id"] = event.event_id

    if event.event_name in ("Purchase", "InitiateCheckout", "AddToCart"):
        payload["custom_data"] = {
            "currency": event.currency,
            "value": event.value or 0,
            "order_id": event.order_id,
            "content_ids": event.content_ids or [],
            "content_type": "product",
            "num_items": event.num_items or 1,
        }

    return payload


@router.post("/event")
async def send_capi_event(
    request: Request,
    event: CAPIEvent,
    background_tasks: BackgroundTasks,
):
    """Send a single conversion event to Meta CAPI."""
    workspace_id = request.state.workspace_id

    pixel_id = META_PIXEL_ID
    token = META_CAPI_TOKEN

    if not (pixel_id and token):
        # Try workspace-specific credentials
        row = await fetchrow("""
            SELECT credentials FROM integrations
            WHERE workspace_id = $1 AND platform = 'meta' AND status = 'active'
            LIMIT 1
        """, workspace_id)
        if row and row["credentials"]:
            import json as _json
            creds = _json.loads(row["credentials"]) if isinstance(row["credentials"], str) else row["credentials"]
            pixel_id = creds.get("pixel_id", "")
            token = creds.get("capi_token", "")

    if not (pixel_id and token):
        return {
            "status": "not_configured",
            "message": "Add META_PIXEL_ID and META_CAPI_ACCESS_TOKEN to .env for server-side event tracking",
            "importance": "Meta CAPI bypasses iOS14+ restrictions — critical for accurate attribution"
        }

    payload = _build_capi_payload(event)

    # Send in background to not block the response
    async def _send():
        result = await _send_capi_event(pixel_id, token, [payload])
        logger.info(f"CAPI {event.event_name} → {result.get('events_received', 0)} received")

    background_tasks.add_task(_send)
    return {"status": "queued", "event_name": event.event_name}


@router.post("/shopify-purchase")
async def shopify_order_to_capi(
    request: Request,
    order_id: str,
    background_tasks: BackgroundTasks,
):
    """Automatically send Purchase event to CAPI for a Shopify order."""
    workspace_id = request.state.workspace_id

    row = await fetchrow("""
        SELECT o.*, c.email, c.phone, c.city, c.state
        FROM shopify_orders o
        LEFT JOIN customers c ON c.shopify_customer_id = o.customer_id AND c.workspace_id = o.workspace_id
        WHERE o.workspace_id = $1 AND o.shopify_order_id = $2
        LIMIT 1
    """, workspace_id, order_id)

    if not row:
        raise HTTPException(status_code=404, detail="Order not found")

    row = dict(row)
    event = CAPIEvent(
        event_name="Purchase",
        event_id=f"order_{order_id}",
        order_id=order_id,
        value=float(row.get("total_price", 0)),
        currency=row.get("currency", "INR"),
        email=row.get("email"),
        phone=row.get("phone"),
        city=row.get("city"),
        state=row.get("state"),
        country="IN",
    )

    return await send_capi_event(request, event, background_tasks)


@router.get("/test")
async def test_capi_connection(request: Request):
    """Test Meta CAPI connection with a test event."""
    if not (META_PIXEL_ID and META_CAPI_TOKEN):
        return {"connected": False, "message": "META_PIXEL_ID and META_CAPI_ACCESS_TOKEN not configured"}
    
    test_event = {
        "event_name": "PageView",
        "event_time": int(time.time()),
        "action_source": "website",
        "user_data": {"client_ip_address": "127.0.0.1", "client_user_agent": "test"},
        "event_id": f"test_{int(time.time())}"
    }
    
    result = await _send_capi_event(META_PIXEL_ID, META_CAPI_TOKEN, [test_event])
    return {
        "connected": "events_received" in result,
        "result": result,
        "pixel_id": META_PIXEL_ID[:8] + "..." if META_PIXEL_ID else None
    }


@router.get("/status")
async def capi_status(request: Request):
    """Get CAPI integration status and configuration."""
    return {
        "configured": bool(META_PIXEL_ID and META_CAPI_TOKEN),
        "pixel_id_set": bool(META_PIXEL_ID),
        "token_set": bool(META_CAPI_TOKEN),
        "env_vars_needed": ["META_PIXEL_ID", "META_CAPI_ACCESS_TOKEN"],
        "benefits": [
            "Bypasses iOS14+ ATT tracking restrictions",
            "Improves Meta attribution accuracy by 30-50%",
            "Enables server-side deduplication",
            "Required for Meta Advantage+ Shopping campaigns"
        ]
    }
