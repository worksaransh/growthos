"""
Analytics Module — /api/v1/analytics
RFM segmentation, cohort retention, LTV analysis, customer lifecycle.
"""

from fastapi import APIRouter, Request, Query
from loguru import logger
from ...core.database import fetch, fetchrow

router = APIRouter(prefix="/analytics", tags=["analytics"])


# ── RFM Segmentation ──────────────────────────────────────────────────────────

@router.get("/rfm")
async def get_rfm_segments(request: Request):
    """
    RFM customer segmentation.
    Returns segment distribution and per-customer scores.
    """
    workspace_id = request.state.workspace_id

    # Segment summary
    summary = await fetch("""
        SELECT
            segment,
            COUNT(*)                          AS customer_count,
            ROUND(AVG(total_spent)::numeric, 2) AS avg_ltv,
            ROUND(AVG(order_count)::numeric, 1) AS avg_orders,
            ROUND(AVG(days_since_last_order)::numeric) AS avg_recency_days
        FROM rfm_segments
        WHERE workspace_id = $1
        GROUP BY segment
        ORDER BY avg_ltv DESC
    """, workspace_id)

    # Top customers per segment (sample)
    customers = await fetch("""
        SELECT
            customer_email, customer_name, segment,
            r_score, f_score, m_score,
            order_count,
            total_spent::float AS total_spent,
            days_since_last_order,
            last_order_date
        FROM rfm_segments
        WHERE workspace_id = $1
        ORDER BY total_spent DESC
        LIMIT 100
    """, workspace_id)

    # Segment → color mapping for UI
    segment_colors = {
        "Champions":        "#00E5A0",
        "Loyal Customers":  "#3B82F6",
        "Recent Customers": "#8B5CF6",
        "Potential Loyalists": "#F59E0B",
        "Promising":        "#06B6D4",
        "Needs Attention":  "#F97316",
        "At Risk":          "#EF4444",
        "Cannot Lose Them": "#DC2626",
        "Lost":             "#6B7280",
    }

    return {
        "summary": [{**dict(r), "color": segment_colors.get(r["segment"], "#6B7280")} for r in summary],
        "customers": [dict(r) for r in customers],
    }


# ── Cohort Retention ──────────────────────────────────────────────────────────

@router.get("/cohorts")
async def get_cohort_retention(
    request: Request,
    months: int = Query(6, ge=3, le=12),
):
    """
    Customer cohort retention analysis.
    Shows what % of each acquisition cohort returns to buy in subsequent months.
    """
    workspace_id = request.state.workspace_id

    # Cohort sizes (initial orders per month)
    cohort_sizes = await fetch("""
        SELECT
            DATE_TRUNC('month', first_order)::date AS cohort_month,
            COUNT(DISTINCT customer_email)          AS cohort_size
        FROM (
            SELECT customer_email,
                   MIN(created_at) AS first_order
            FROM shopify_orders
            WHERE workspace_id = $1
              AND created_at >= NOW() - ($2 || ' months')::INTERVAL
              AND financial_status NOT IN ('refunded', 'voided')
            GROUP BY customer_email
        ) t
        GROUP BY cohort_month
        ORDER BY cohort_month
    """, workspace_id, str(months + 1))

    # Retention data from view
    retention = await fetch("""
        SELECT
            cohort_month::date AS cohort_month,
            months_since_first_order,
            retained_customers
        FROM cohort_retention
        WHERE workspace_id = $1
          AND cohort_month >= NOW() - ($2 || ' months')::INTERVAL
        ORDER BY cohort_month, months_since_first_order
    """, workspace_id, str(months + 1))

    size_map = {str(r["cohort_month"]): r["cohort_size"] for r in cohort_sizes}

    # Build grid
    grid = {}
    for r in retention:
        cm = str(r["cohort_month"])
        mn = r["months_since_first_order"]
        retained = r["retained_customers"]
        size = size_map.get(cm, 1)
        pct = round(retained / size * 100, 1) if size else 0
        if cm not in grid:
            grid[cm] = {"cohort_month": cm, "size": size, "retention": {}}
        grid[cm]["retention"][mn] = {"count": retained, "pct": pct}

    return {
        "cohorts": list(grid.values()),
        "max_months": months,
    }


# ── LTV Analysis ──────────────────────────────────────────────────────────────

@router.get("/ltv")
async def get_ltv_analysis(request: Request):
    """
    Customer Lifetime Value distribution and curves.
    Average LTV by acquisition month, LTV percentiles.
    """
    workspace_id = request.state.workspace_id

    # LTV distribution by acquisition month
    ltv_by_month = await fetch("""
        SELECT
            DATE_TRUNC('month', first_order)::date AS cohort_month,
            COUNT(DISTINCT customer_email)          AS customers,
            ROUND(AVG(ltv)::numeric, 2)             AS avg_ltv,
            ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ltv)::numeric, 2) AS median_ltv,
            ROUND(MAX(ltv)::numeric, 2)             AS max_ltv
        FROM (
            SELECT
                customer_email,
                MIN(created_at) AS first_order,
                SUM(total_price) AS ltv
            FROM shopify_orders
            WHERE workspace_id = $1
              AND financial_status NOT IN ('refunded', 'voided')
            GROUP BY customer_email
        ) t
        GROUP BY cohort_month
        ORDER BY cohort_month DESC
        LIMIT 12
    """, workspace_id)

    # LTV percentiles overall
    percentiles = await fetchrow("""
        SELECT
            ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY ltv)::numeric, 2) AS p25,
            ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY ltv)::numeric, 2) AS p50,
            ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY ltv)::numeric, 2) AS p75,
            ROUND(PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY ltv)::numeric, 2) AS p90,
            ROUND(AVG(ltv)::numeric, 2) AS avg_ltv,
            COUNT(*) AS total_customers
        FROM (
            SELECT customer_email, SUM(total_price) AS ltv
            FROM shopify_orders
            WHERE workspace_id = $1
              AND financial_status NOT IN ('refunded', 'voided')
            GROUP BY customer_email
        ) t
    """, workspace_id)

    return {
        "by_cohort": [dict(r) for r in ltv_by_month],
        "percentiles": dict(percentiles) if percentiles else {},
    }


# ── Customer Lifecycle ────────────────────────────────────────────────────────

@router.get("/lifecycle")
async def get_customer_lifecycle(request: Request):
    """
    Customer lifecycle funnel: New → Active → At Risk → Churned.
    Based on recency of last purchase.
    """
    workspace_id = request.state.workspace_id

    counts = await fetchrow("""
        SELECT
            COUNT(CASE WHEN order_count = 1 AND days_since <= 30  THEN 1 END) AS new_customers,
            COUNT(CASE WHEN order_count > 1  AND days_since <= 60  THEN 1 END) AS active_customers,
            COUNT(CASE WHEN days_since BETWEEN 61 AND 120            THEN 1 END) AS at_risk,
            COUNT(CASE WHEN days_since > 120                         THEN 1 END) AS churned,
            COUNT(*) AS total
        FROM (
            SELECT
                customer_email,
                COUNT(*) AS order_count,
                CURRENT_DATE - MAX(created_at::date) AS days_since
            FROM shopify_orders
            WHERE workspace_id = $1
              AND financial_status NOT IN ('refunded', 'voided')
            GROUP BY customer_email
        ) t
    """, workspace_id)

    if not counts:
        return {}

    total = counts["total"] or 1
    return {
        "new_customers":    {"count": counts["new_customers"] or 0,    "pct": round((counts["new_customers"] or 0) / total * 100, 1)},
        "active_customers": {"count": counts["active_customers"] or 0, "pct": round((counts["active_customers"] or 0) / total * 100, 1)},
        "at_risk":          {"count": counts["at_risk"] or 0,          "pct": round((counts["at_risk"] or 0) / total * 100, 1)},
        "churned":          {"count": counts["churned"] or 0,          "pct": round((counts["churned"] or 0) / total * 100, 1)},
        "total":            total,
    }
