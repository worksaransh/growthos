"""
Shiprocket Integration -- Shipment tracking, RTO, NDR, courier performance.
"""

from fastapi import APIRouter, Request, HTTPException
from loguru import logger
import httpx, os
from ...core.database import fetch, fetchrow, execute
from datetime import datetime, timedelta

router = APIRouter(prefix="/shipping", tags=["shipping"])

SHIPROCKET_EMAIL = os.getenv("SHIPROCKET_EMAIL", "")
SHIPROCKET_PASSWORD = os.getenv("SHIPROCKET_PASSWORD", "")
SHIPROCKET_BASE = "https://apiv2.shiprocket.in/v1/external"

_shiprocket_token: dict = {"token": None, "expires": None}


async def _get_shiprocket_token() -> str | None:
    """Get Shiprocket auth token (cached)."""
    if not (SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD):
        return None
    now = datetime.now()
    if _shiprocket_token["token"] and _shiprocket_token["expires"] and now < _shiprocket_token["expires"]:
        return _shiprocket_token["token"]
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                f"{SHIPROCKET_BASE}/auth/login",
                json={"email": SHIPROCKET_EMAIL, "password": SHIPROCKET_PASSWORD}
            )
            if r.status_code == 200:
                token = r.json().get("token")
                _shiprocket_token["token"] = token
                _shiprocket_token["expires"] = now + timedelta(hours=8)
                return token
    except Exception as e:
        logger.warning(f"Shiprocket auth error: {e}")
    return None


def _sr_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@router.get("/summary")
async def shipping_summary(request: Request, days: int = 30):
    """Get shipping analytics -- delivery rates, RTO, NDR, courier performance."""
    workspace_id = request.state.workspace_id
    token = await _get_shiprocket_token()

    if token:
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.get(
                    f"{SHIPROCKET_BASE}/reports/shipments/index",
                    headers=_sr_headers(token),
                    params={"per_page": 200, "page": 1}
                )
                if r.status_code == 200:
                    shipments = r.json().get("data", {}).get("shipments", [])
                    total = len(shipments)
                    delivered = [s for s in shipments if s.get("status", "").lower() == "delivered"]
                    rto = [s for s in shipments if "rto" in s.get("status", "").lower()]
                    pending = [s for s in shipments if s.get("status", "").lower() in
                               ("pending", "in transit", "out for delivery")]

                    # Courier breakdown
                    courier_stats = {}
                    for s in shipments:
                        cn = s.get("courier_name", "Unknown")
                        if cn not in courier_stats:
                            courier_stats[cn] = {"total": 0, "delivered": 0, "rto": 0}
                        courier_stats[cn]["total"] += 1
                        if s.get("status", "").lower() == "delivered":
                            courier_stats[cn]["delivered"] += 1
                        if "rto" in s.get("status", "").lower():
                            courier_stats[cn]["rto"] += 1

                    return {
                        "source": "shiprocket_live",
                        "total_shipments": total,
                        "delivered": len(delivered),
                        "delivery_rate": round(len(delivered) / total * 100, 1) if total else 0,
                        "rto": len(rto),
                        "rto_rate": round(len(rto) / total * 100, 1) if total else 0,
                        "in_transit": len(pending),
                        "courier_performance": [
                            {
                                "courier": k,
                                **v,
                                "delivery_rate": round(v["delivered"] / v["total"] * 100, 1) if v["total"] else 0
                            }
                            for k, v in sorted(courier_stats.items(), key=lambda x: -x[1]["total"])
                        ][:10]
                    }
        except Exception as e:
            logger.warning(f"Shiprocket shipments error: {e}")

    # Fallback: Shopify fulfillment data
    row = await fetchrow("""
        SELECT
            COUNT(*) AS total,
            COUNT(CASE WHEN fulfillment_status='fulfilled' THEN 1 END) AS fulfilled,
            COUNT(CASE WHEN financial_status='refunded' THEN 1 END) AS returns
        FROM shopify_orders
        WHERE workspace_id=$1 AND created_at >= NOW()-($2||' days')::INTERVAL
    """, workspace_id, str(days))

    return {
        "source": "shopify_orders",
        "total_shipments": row["total"] or 0,
        "delivered": row["fulfilled"] or 0,
        "delivery_rate": round((row["fulfilled"] or 0) / (row["total"] or 1) * 100, 1),
        "rto": 0,
        "rto_rate": 0,
        "shiprocket_connected": bool(token),
        "setup_message": "Add SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD to .env for live courier data"
    }


@router.get("/orders")
async def get_shipment_orders(request: Request, page: int = 1, status: str = ""):
    """Get shipment order list from Shiprocket."""
    token = await _get_shiprocket_token()
    if not token:
        return {"orders": [], "connected": False, "message": "Connect Shiprocket via .env"}
    try:
        params = {"per_page": 50, "page": page}
        if status:
            params["filter_by"] = status
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(f"{SHIPROCKET_BASE}/orders", headers=_sr_headers(token), params=params)
            return r.json() if r.status_code == 200 else {"orders": [], "error": r.text[:200]}
    except Exception as e:
        return {"orders": [], "error": str(e)}


@router.get("/ndr")
async def get_ndr(request: Request):
    """Get NDR (Non-Delivery Report) list."""
    token = await _get_shiprocket_token()
    if not token:
        return {"ndr": [], "connected": False}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(f"{SHIPROCKET_BASE}/ndr/all", headers=_sr_headers(token))
            return r.json() if r.status_code == 200 else {"ndr": [], "error": r.text[:200]}
    except Exception as e:
        return {"ndr": [], "error": str(e)}


@router.get("/courier-performance")
async def courier_performance(request: Request):
    """Get courier-level performance comparison."""
    token = await _get_shiprocket_token()
    if not token:
        return {"couriers": [], "connected": False, "message": "Connect Shiprocket for courier analytics"}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f"{SHIPROCKET_BASE}/courier/courierListWithCounts",
                headers=_sr_headers(token)
            )
            return r.json() if r.status_code == 200 else {"couriers": []}
    except Exception as e:
        return {"couriers": [], "error": str(e)}
