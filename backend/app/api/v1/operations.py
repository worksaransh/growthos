"""
Operations Module — /api/v1/operations
RTO tracking, COD vs prepaid analytics, returns management, shipping performance.
"""

from fastapi import APIRouter, Request, Query, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from loguru import logger
from ...core.database import fetch, fetchrow, execute

router = APIRouter(prefix="/operations", tags=["operations"])


# ── Models ────────────────────────────────────────────────────────────────────

class ReturnCreate(BaseModel):
    order_id: str
    shopify_order_id: Optional[int] = None
    return_type: str   # 'customer_return' | 'rto' | 'exchange'
    reason: Optional[str] = None
    amount: Optional[float] = None
    product_ids: Optional[List[str]] = None
    courier: Optional[str] = None
    awb_number: Optional[str] = None
    initiated_at: Optional[str] = None  # YYYY-MM-DD

class ReturnUpdate(BaseModel):
    status: str
    received_at: Optional[str] = None
    refunded_at: Optional[str] = None


# ── Overview Dashboard ────────────────────────────────────────────────────────

@router.get("/overview")
async def get_operations_overview(
    request: Request,
    days: int = Query(30, ge=7, le=365),
):
    """
    Operations health overview: RTO rate, COD breakdown,
    return rate, average delivery time, shipping costs.
    """
    workspace_id = request.state.workspace_id

    # Order volume & COD breakdown from Shopify
    order_stats = await fetchrow("""
        SELECT
            COUNT(*)                                                AS total_orders,
            COUNT(CASE WHEN payment_gateway = 'cash_on_delivery' OR
                            payment_gateway ILIKE '%cod%' THEN 1 END) AS cod_orders,
            COUNT(CASE WHEN payment_gateway != 'cash_on_delivery' AND
                            payment_gateway NOT ILIKE '%cod%' THEN 1 END) AS prepaid_orders,
            COALESCE(SUM(total_price), 0)::float                   AS total_gmv,
            COALESCE(SUM(total_shipping_cost), 0)::float           AS total_shipping_collected,
            COALESCE(AVG(total_price), 0)::float                   AS aov
        FROM shopify_orders
        WHERE workspace_id = $1
          AND created_at >= NOW() - ($2 || ' days')::INTERVAL
          AND financial_status NOT IN ('voided')
    """, workspace_id, str(days))

    # Returns & RTO breakdown
    return_stats = await fetchrow("""
        SELECT
            COUNT(*)                                                   AS total_returns,
            COUNT(CASE WHEN return_type = 'rto' THEN 1 END)           AS rto_count,
            COUNT(CASE WHEN return_type = 'customer_return' THEN 1 END) AS customer_returns,
            COUNT(CASE WHEN return_type = 'exchange' THEN 1 END)      AS exchanges,
            COALESCE(SUM(amount), 0)::float                           AS return_value,
            COUNT(CASE WHEN status = 'received' OR status = 'refunded' OR status = 'restocked'
                       THEN 1 END)                                     AS processed_returns
        FROM returns_tracking
        WHERE workspace_id = $1
          AND initiated_at >= CURRENT_DATE - $2
    """, workspace_id, days)

    total_orders = order_stats["total_orders"] or 0
    total_returns = return_stats["total_returns"] or 0
    rto_count = return_stats["rto_count"] or 0

    rto_rate = (rto_count / total_orders * 100) if total_orders else 0
    return_rate = (total_returns / total_orders * 100) if total_orders else 0
    cod_pct = (order_stats["cod_orders"] / total_orders * 100) if total_orders else 0

    return {
        "period_days": days,
        "orders": {
            "total": total_orders,
            "cod": order_stats["cod_orders"] or 0,
            "prepaid": order_stats["prepaid_orders"] or 0,
            "cod_pct": round(cod_pct, 1),
            "prepaid_pct": round(100 - cod_pct, 1),
            "gmv": round(order_stats["total_gmv"] or 0, 2),
            "aov": round(order_stats["aov"] or 0, 2),
            "shipping_collected": round(order_stats["total_shipping_collected"] or 0, 2),
        },
        "returns": {
            "total": total_returns,
            "rto": rto_count,
            "customer_returns": return_stats["customer_returns"] or 0,
            "exchanges": return_stats["exchanges"] or 0,
            "return_rate_pct": round(return_rate, 1),
            "rto_rate_pct": round(rto_rate, 1),
            "return_value": round(return_stats["return_value"] or 0, 2),
            "processed": return_stats["processed_returns"] or 0,
        },
    }


# ── RTO Analysis ──────────────────────────────────────────────────────────────

@router.get("/rto")
async def get_rto_analysis(
    request: Request,
    days: int = Query(30, ge=7, le=365),
):
    """RTO (Return to Origin) deep analysis: by state, courier, reason, time trend."""
    workspace_id = request.state.workspace_id

    # RTO trend over time
    trend = await fetch("""
        SELECT
            initiated_at AS date,
            COUNT(*)     AS rto_count,
            COALESCE(SUM(amount), 0)::float AS rto_value
        FROM returns_tracking
        WHERE workspace_id = $1
          AND return_type = 'rto'
          AND initiated_at >= CURRENT_DATE - $2
        GROUP BY initiated_at
        ORDER BY initiated_at
    """, workspace_id, days)

    # RTO by courier
    by_courier = await fetch("""
        SELECT
            COALESCE(courier, 'Unknown') AS courier,
            COUNT(*)                      AS count,
            COALESCE(SUM(amount), 0)::float AS value
        FROM returns_tracking
        WHERE workspace_id = $1
          AND return_type = 'rto'
          AND initiated_at >= CURRENT_DATE - $2
        GROUP BY courier
        ORDER BY count DESC
        LIMIT 10
    """, workspace_id, days)

    # RTO by reason
    by_reason = await fetch("""
        SELECT
            COALESCE(reason, 'Not specified') AS reason,
            COUNT(*) AS count
        FROM returns_tracking
        WHERE workspace_id = $1
          AND return_type = 'rto'
          AND initiated_at >= CURRENT_DATE - $2
        GROUP BY reason
        ORDER BY count DESC
        LIMIT 8
    """, workspace_id, days)

    # Status funnel
    funnel = await fetch("""
        SELECT status, COUNT(*) AS count
        FROM returns_tracking
        WHERE workspace_id = $1
          AND return_type = 'rto'
          AND initiated_at >= CURRENT_DATE - $2
        GROUP BY status
    """, workspace_id, days)

    return {
        "trend": [dict(r) for r in trend],
        "by_courier": [dict(r) for r in by_courier],
        "by_reason": [dict(r) for r in by_reason],
        "status_funnel": {r["status"]: r["count"] for r in funnel},
    }


# ── COD Performance ───────────────────────────────────────────────────────────

@router.get("/cod")
async def get_cod_performance(
    request: Request,
    days: int = Query(30, ge=7, le=365),
):
    """COD vs Prepaid performance: revenue, AOV, return rates, trend."""
    workspace_id = request.state.workspace_id

    breakdown = await fetch("""
        SELECT
            CASE WHEN payment_gateway ILIKE '%cod%' OR payment_gateway = 'cash_on_delivery'
                 THEN 'COD' ELSE 'Prepaid' END AS payment_type,
            COUNT(*)                            AS orders,
            COALESCE(SUM(total_price), 0)::float    AS revenue,
            COALESCE(AVG(total_price), 0)::float    AS aov,
            COALESCE(SUM(total_discounts), 0)::float AS discounts
        FROM shopify_orders
        WHERE workspace_id = $1
          AND created_at >= NOW() - ($2 || ' days')::INTERVAL
          AND financial_status NOT IN ('voided')
        GROUP BY payment_type
    """, workspace_id, str(days))

    # Monthly trend
    trend = await fetch("""
        SELECT
            DATE_TRUNC('month', created_at) AS month,
            CASE WHEN payment_gateway ILIKE '%cod%' OR payment_gateway = 'cash_on_delivery'
                 THEN 'cod' ELSE 'prepaid' END AS payment_type,
            COUNT(*) AS orders,
            COALESCE(SUM(total_price), 0)::float AS revenue
        FROM shopify_orders
        WHERE workspace_id = $1
          AND created_at >= NOW() - ($2 || ' days')::INTERVAL
          AND financial_status NOT IN ('voided')
        GROUP BY month, payment_type
        ORDER BY month
    """, workspace_id, str(days))

    return {
        "breakdown": [dict(r) for r in breakdown],
        "monthly_trend": [dict(r) for r in trend],
    }


# ── Shipping Analytics ────────────────────────────────────────────────────────

@router.get("/shipping")
async def get_shipping_analytics(
    request: Request,
    days: int = Query(30, ge=7, le=365),
):
    """Shipping performance: zone breakdown, courier split, cost analysis."""
    workspace_id = request.state.workspace_id

    # Shipping by state/province
    by_state = await fetch("""
        SELECT
            COALESCE(shipping_state, 'Unknown')     AS state,
            COUNT(*)                                 AS orders,
            COALESCE(SUM(total_price), 0)::float     AS revenue,
            COALESCE(SUM(total_shipping_cost), 0)::float AS shipping_cost,
            COALESCE(AVG(total_price), 0)::float     AS aov
        FROM shopify_orders
        WHERE workspace_id = $1
          AND created_at >= NOW() - ($2 || ' days')::INTERVAL
          AND financial_status NOT IN ('voided', 'refunded')
        GROUP BY shipping_state
        ORDER BY orders DESC
        LIMIT 15
    """, workspace_id, str(days))

    # Fulfillment status breakdown
    fulfillment = await fetch("""
        SELECT
            COALESCE(fulfillment_status, 'unfulfilled') AS status,
            COUNT(*) AS orders
        FROM shopify_orders
        WHERE workspace_id = $1
          AND created_at >= NOW() - ($2 || ' days')::INTERVAL
        GROUP BY fulfillment_status
        ORDER BY orders DESC
    """, workspace_id, str(days))

    return {
        "by_state": [dict(r) for r in by_state],
        "fulfillment_status": [dict(r) for r in fulfillment],
    }


# ── Returns Management ────────────────────────────────────────────────────────

@router.get("/returns")
async def list_returns(
    request: Request,
    days: int = Query(30, ge=1, le=365),
    return_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
):
    """List returns and RTOs with optional filters."""
    workspace_id = request.state.workspace_id

    query = """
        SELECT id, order_id, return_type, status, reason,
               amount::float, courier, awb_number,
               initiated_at, received_at, refunded_at
        FROM returns_tracking
        WHERE workspace_id = $1
          AND initiated_at >= CURRENT_DATE - $2
    """
    params = [workspace_id, days]

    if return_type:
        query += f" AND return_type = ${len(params)+1}"
        params.append(return_type)
    if status:
        query += f" AND status = ${len(params)+1}"
        params.append(status)

    query += " ORDER BY initiated_at DESC LIMIT 200"
    rows = await fetch(query, *params)
    return [dict(r) for r in rows]


@router.post("/returns")
async def create_return(request: Request, body: ReturnCreate):
    """Log a new return or RTO."""
    workspace_id = request.state.workspace_id
    if body.return_type not in ('customer_return', 'rto', 'exchange'):
        raise HTTPException(400, "Invalid return_type")

    row = await fetchrow("""
        INSERT INTO returns_tracking
            (workspace_id, order_id, shopify_order_id, return_type,
             reason, amount, product_ids, courier, awb_number, initiated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,
                COALESCE($10::date, CURRENT_DATE))
        RETURNING id, order_id, return_type, status, initiated_at
    """,
        workspace_id, body.order_id, body.shopify_order_id, body.return_type,
        body.reason, body.amount, body.product_ids, body.courier, body.awb_number,
        body.initiated_at,
    )
    return dict(row)


@router.patch("/returns/{return_id}")
async def update_return(request: Request, return_id: str, body: ReturnUpdate):
    """Update return status."""
    workspace_id = request.state.workspace_id
    valid_statuses = ('initiated', 'in_transit', 'received', 'refunded', 'restocked', 'closed')
    if body.status not in valid_statuses:
        raise HTTPException(400, f"Invalid status")

    await execute("""
        UPDATE returns_tracking
        SET status = $3,
            received_at = COALESCE($4::date, received_at),
            refunded_at = COALESCE($5::date, refunded_at),
            updated_at  = now()
        WHERE id = $1 AND workspace_id = $2
    """, return_id, workspace_id, body.status, body.received_at, body.refunded_at)
    return {"success": True, "id": return_id, "status": body.status}
