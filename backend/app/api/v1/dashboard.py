from fastapi import APIRouter, Request, Query
from datetime import date, timedelta
from ...services.metrics_service import compute_dashboard_metrics
from ...repositories.metrics_repo import get_metrics
from ...models.dashboard import DashboardMetricsResponse, TrendResponse, TrendPoint

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/metrics")
async def get_dashboard_metrics(
    request: Request,
    start_date: str = Query(default=None),
    end_date: str = Query(default=None),
    compare: bool = Query(default=False),
):
    workspace_id = request.state.workspace_id

    # Default to last 30 days
    if not start_date or not end_date:
        end = date.today()
        start = end - timedelta(days=30)
    else:
        start = date.fromisoformat(start_date)
        end = date.fromisoformat(end_date)

    metrics = await compute_dashboard_metrics(workspace_id, start, end, compare)
    return metrics


@router.get("/trends/revenue")
async def get_revenue_trends(
    request: Request,
    start_date: str = Query(default=None),
    end_date: str = Query(default=None),
):
    workspace_id = request.state.workspace_id

    if not start_date or not end_date:
        end = date.today()
        start = end - timedelta(days=30)
    else:
        start = date.fromisoformat(start_date)
        end = date.fromisoformat(end_date)

    rows = await get_metrics(
        workspace_id, start.isoformat(), end.isoformat()
    )

    trends = [
        TrendPoint(
            date=r["metric_date"].isoformat() if hasattr(r["metric_date"], "isoformat") else str(r["metric_date"]),
            revenue=float(r.get("net_revenue", 0)),
            spend=float(r.get("total_ad_spend", 0)),
        )
        for r in rows
    ]

    return TrendResponse(data=trends)


@router.get("/trends/spend")
async def get_spend_trends(
    request: Request,
    start_date: str = Query(default=None),
    end_date: str = Query(default=None),
):
    workspace_id = request.state.workspace_id

    if not start_date or not end_date:
        end = date.today()
        start = end - timedelta(days=30)
    else:
        start = date.fromisoformat(start_date)
        end = date.fromisoformat(end_date)

    rows = await get_metrics(
        workspace_id, start.isoformat(), end.isoformat()
    )

    trends = [
        TrendPoint(
            date=r["metric_date"].isoformat() if hasattr(r["metric_date"], "isoformat") else str(r["metric_date"]),
            revenue=float(r.get("meta_spend", 0)),
            spend=float(r.get("google_spend", 0)),
        )
        for r in rows
    ]

    return TrendResponse(data=trends)


@router.get("/orders")
async def get_recent_orders(request: Request, limit: int = Query(default=10)):
    workspace_id = request.state.workspace_id
    from ...core.database import fetch
    rows = await fetch(
        """
        SELECT shopify_order_id, net_revenue, financial_status, order_created_at
        FROM shopify_orders
        WHERE workspace_id = $1 AND deleted_at IS NULL
        ORDER BY order_created_at DESC
        LIMIT $2
        """,
        workspace_id,
        limit,
    )
    return [
        {
            "id": f"#{r['shopify_order_id'][-4:] if len(r['shopify_order_id']) > 4 else r['shopify_order_id']}",
            "customer": "Customer",
            "amount": float(r["net_revenue"]),
            "status": "fulfilled" if r["financial_status"] in ("paid", "fulfilled") else "pending",
            "channel": "Shopify",
            "time": r["order_created_at"].isoformat() if hasattr(r["order_created_at"], "isoformat") else str(r["order_created_at"]),
        }
        for r in rows
    ]
