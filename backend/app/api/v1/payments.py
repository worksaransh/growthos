"""
Payment Gateway Analytics -- Razorpay + Cashfree
"""

from fastapi import APIRouter, Request, HTTPException
from loguru import logger
import httpx, os, base64
from ...core.database import fetch, fetchrow

router = APIRouter(prefix="/payments", tags=["payments"])

RAZORPAY_KEY = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
RAZORPAY_BASE = "https://api.razorpay.com/v1"


def _rzp_auth():
    creds = base64.b64encode(f"{RAZORPAY_KEY}:{RAZORPAY_SECRET}".encode()).decode()
    return {"Authorization": f"Basic {creds}", "Content-Type": "application/json"}


@router.get("/summary")
async def payment_summary(request: Request, days: int = 30):
    """Get payment analytics -- COD vs prepaid, success rates, gateway fees."""
    workspace_id = request.state.workspace_id

    if RAZORPAY_KEY and RAZORPAY_SECRET:
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                from datetime import datetime, timedelta
                from_ts = int((datetime.now() - timedelta(days=days)).timestamp())
                r = await client.get(
                    f"{RAZORPAY_BASE}/payments",
                    headers=_rzp_auth(),
                    params={"from": from_ts, "count": 100}
                )
                if r.status_code == 200:
                    data = r.json().get("items", [])
                    total = len(data)
                    captured = [p for p in data if p.get("status") == "captured"]
                    failed = [p for p in data if p.get("status") == "failed"]
                    total_revenue = sum(p.get("amount", 0) / 100 for p in captured)
                    # Razorpay charges 2% + GST
                    gateway_fees = total_revenue * 0.0236
                    return {
                        "source": "razorpay_live",
                        "total_transactions": total,
                        "successful": len(captured),
                        "failed": len(failed),
                        "success_rate": round(len(captured) / total * 100, 1) if total else 0,
                        "total_revenue": round(total_revenue, 2),
                        "gateway_fees_estimated": round(gateway_fees, 2),
                        "avg_order_value": round(total_revenue / len(captured), 2) if captured else 0,
                    }
        except Exception as e:
            logger.warning(f"Razorpay API error: {e}")

    # Fall back to Shopify order data
    row = await fetchrow("""
        SELECT
            COUNT(*) AS total_orders,
            SUM(total_price)::float AS total_revenue,
            AVG(total_price)::float AS aov,
            COUNT(CASE WHEN financial_status = 'paid' THEN 1 END) AS paid,
            COUNT(CASE WHEN financial_status IN ('refunded','voided') THEN 1 END) AS refunded
        FROM shopify_orders
        WHERE workspace_id = $1
          AND created_at >= NOW() - ($2||' days')::INTERVAL
    """, workspace_id, str(days))

    revenue = float(row["total_revenue"] or 0)
    return {
        "source": "shopify_orders",
        "total_orders": row["total_orders"] or 0,
        "successful": row["paid"] or 0,
        "refunded": row["refunded"] or 0,
        "total_revenue": revenue,
        "gateway_fees_estimated": round(revenue * 0.0236, 2),
        "avg_order_value": float(row["aov"] or 0),
        "razorpay_connected": bool(RAZORPAY_KEY),
        "setup_message": "Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env for live gateway data"
    }


@router.get("/failed")
async def failed_payments(request: Request, days: int = 30):
    """Get failed payment details for recovery."""
    if not (RAZORPAY_KEY and RAZORPAY_SECRET):
        return {"payments": [], "connected": False, "message": "Connect Razorpay for failed payment data"}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            from datetime import datetime, timedelta
            from_ts = int((datetime.now() - timedelta(days=days)).timestamp())
            r = await client.get(
                f"{RAZORPAY_BASE}/payments",
                headers=_rzp_auth(),
                params={"from": from_ts, "count": 100}
            )
            if r.status_code == 200:
                failed = [p for p in r.json().get("items", []) if p.get("status") == "failed"]
                return {
                    "payments": failed[:50],
                    "total_failed": len(failed),
                    "estimated_lost_revenue": sum(p.get("amount", 0) / 100 for p in failed)
                }
    except Exception as e:
        return {"payments": [], "error": str(e)}
    return {"payments": [], "connected": False}
