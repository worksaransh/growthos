from datetime import date, timedelta
from typing import Optional
from ..repositories.metrics_repo import get_metrics_summary
from ..repositories.integration_repo import get_integrations
from ..repositories.profit_repo import get_profit_config
from ..core.database import fetchval


async def compute_dashboard_metrics(
    workspace_id: str,
    start_date: date,
    end_date: date,
    compare: bool = False,
) -> dict:
    current = await get_metrics_summary(
        workspace_id, start_date.isoformat(), end_date.isoformat()
    )
    if not current:
        return _empty_response()

    prior_data = None
    if compare:
        period_days = (end_date - start_date).days
        prior_end = start_date - timedelta(days=1)
        prior_start = prior_end - timedelta(days=period_days)
        prior_data = await get_metrics_summary(
            workspace_id, prior_start.isoformat(), prior_end.isoformat()
        )

    # Last synced timestamps
    integrations = await get_integrations(workspace_id)
    last_synced = {}
    for intg in integrations:
        last_synced[intg["platform"]] = (
            intg["last_synced_at"].isoformat() if intg["last_synced_at"] else None
        )

    # Load profit config for accurate gross_profit computation
    profit_config = await get_profit_config(workspace_id)
    cogs_pct = float(profit_config["cogs_pct"]) if profit_config else 0.35
    shipping_cpo = float(profit_config["shipping_cost_per_order"]) if profit_config else 60.0
    packaging_cpo = float(profit_config["packaging_cost_per_order"]) if profit_config else 15.0
    payment_pct = float(profit_config["payment_gateway_pct"]) if profit_config else 0.02

    def get_val(row, key):
        return float(row[key]) if row and row[key] is not None else 0.0

    def delta_pct(current_val: float, prior_val: float) -> Optional[float]:
        if prior_val == 0:
            return None
        return round(((current_val - prior_val) / prior_val) * 100, 1)

    def compute_gross_profit(metrics: dict) -> float:
        net_revenue = get_val(metrics, "net_revenue")
        total_orders = get_val(metrics, "total_orders")
        total_ad_spend = get_val(metrics, "total_ad_spend")
        cogs = net_revenue * cogs_pct
        shipping = total_orders * shipping_cpo
        packaging = total_orders * packaging_cpo
        payment_fee = net_revenue * payment_pct
        return net_revenue - cogs - shipping - packaging - payment_fee

    def compute_net_profit(metrics: dict) -> float:
        return compute_gross_profit(metrics) - get_val(metrics, "total_ad_spend")

    def compute_contribution_margin(metrics: dict) -> float:
        net_revenue = get_val(metrics, "net_revenue")
        if net_revenue == 0:
            return 0.0
        return (compute_gross_profit(metrics) - get_val(metrics, "total_ad_spend")) / net_revenue

    # RTO and refund metrics from shopify_orders
    rto_data = await _get_rto_metrics(workspace_id, start_date.isoformat(), end_date.isoformat())

    cv = current
    pv = prior_data or {}

    gross_profit_current = compute_gross_profit(cv)
    gross_profit_prior = compute_gross_profit(pv) if prior_data else 0.0
    net_profit_current = compute_net_profit(cv)
    net_profit_prior = compute_net_profit(pv) if prior_data else 0.0
    cm_current = compute_contribution_margin(cv)
    cm_prior = compute_contribution_margin(pv) if prior_data else 0.0

    return {
        "revenue": {
            "value": round(get_val(cv, "net_revenue"), 2),
            "delta_pct": delta_pct(get_val(cv, "net_revenue"), get_val(pv, "net_revenue")),
        },
        "orders": {
            "value": int(get_val(cv, "total_orders")),
            "delta_pct": delta_pct(get_val(cv, "total_orders"), get_val(pv, "total_orders")),
        },
        "ad_spend": {
            "value": round(get_val(cv, "total_ad_spend"), 2),
            "delta_pct": delta_pct(get_val(cv, "total_ad_spend"), get_val(pv, "total_ad_spend")),
        },
        "blended_roas": {
            "value": round(get_val(cv, "blended_roas"), 4),
            "delta_pct": delta_pct(get_val(cv, "blended_roas"), get_val(pv, "blended_roas")),
        },
        "cac": {
            "value": round(get_val(cv, "cac"), 2),
            "delta_pct": delta_pct(get_val(cv, "cac"), get_val(pv, "cac")),
        },
        "aov": {
            "value": round(get_val(cv, "aov"), 2),
            "delta_pct": delta_pct(get_val(cv, "aov"), get_val(pv, "aov")),
        },
        "gross_profit": {
            "value": round(gross_profit_current, 2),
            "delta_pct": delta_pct(gross_profit_current, gross_profit_prior),
        },
        "net_profit": {
            "value": round(net_profit_current, 2),
            "delta_pct": delta_pct(net_profit_current, net_profit_prior),
        },
        "contribution_margin": {
            "value": round(cm_current, 4),
            "delta_pct": delta_pct(cm_current, cm_prior),
        },
        "mer": {
            "value": round(get_val(cv, "mer"), 4),
            "delta_pct": delta_pct(get_val(cv, "mer"), get_val(pv, "mer")),
        },
        "rto_pct": rto_data.get("rto_pct"),
        "refund_pct": rto_data.get("refund_pct"),
        "rto_orders": rto_data.get("rto_orders"),
        "last_synced": last_synced,
    }


async def _get_rto_metrics(workspace_id: str, start_date: str, end_date: str) -> dict:
    from ..core.database import fetchrow
    row = await fetchrow(
        """
        SELECT
            COUNT(*) AS total_orders,
            COUNT(*) FILTER (WHERE rto_status IN ('rto', 'rto_initiated')) AS rto_orders,
            COALESCE(SUM(refund_amount), 0) AS total_refunds,
            COALESCE(SUM(gross_revenue), 0) AS gross_revenue
        FROM shopify_orders
        WHERE workspace_id = $1
          AND DATE(order_created_at) BETWEEN $2 AND $3
        """,
        workspace_id, start_date, end_date,
    )
    if not row:
        return {"rto_pct": None, "refund_pct": None, "rto_orders": 0}

    total_orders = int(row["total_orders"] or 0)
    rto_orders = int(row["rto_orders"] or 0)
    total_refunds = float(row["total_refunds"] or 0)
    gross_revenue = float(row["gross_revenue"] or 0)

    rto_pct = round(rto_orders / total_orders, 4) if total_orders > 0 else None
    refund_pct = round(total_refunds / gross_revenue, 4) if gross_revenue > 0 else None

    return {
        "rto_pct": rto_pct,
        "refund_pct": refund_pct,
        "rto_orders": rto_orders,
    }


def _empty_response() -> dict:
    return {
        "revenue": {"value": 0, "delta_pct": None},
        "orders": {"value": 0, "delta_pct": None},
        "ad_spend": {"value": 0, "delta_pct": None},
        "blended_roas": {"value": 0, "delta_pct": None},
        "cac": {"value": 0, "delta_pct": None},
        "aov": {"value": 0, "delta_pct": None},
        "gross_profit": {"value": 0, "delta_pct": None},
        "net_profit": {"value": 0, "delta_pct": None},
        "contribution_margin": {"value": 0, "delta_pct": None},
        "mer": {"value": 0, "delta_pct": None},
        "rto_pct": None,
        "refund_pct": None,
        "rto_orders": 0,
        "last_synced": {},
    }
