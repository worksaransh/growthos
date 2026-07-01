"""
Finance Module — /api/v1/finance
P&L statement, cash flow, contribution margin, break-even, expense management.
"""

from fastapi import APIRouter, Request, Query, HTTPException
from pydantic import BaseModel
from typing import Optional
from loguru import logger
from ...core.database import fetch, fetchrow, execute

router = APIRouter(prefix="/finance", tags=["finance"])


# ── Models ────────────────────────────────────────────────────────────────────

class ExpenseCreate(BaseModel):
    date: str            # YYYY-MM-DD
    category: str
    subcategory: Optional[str] = None
    amount: float
    description: Optional[str] = None
    vendor: Optional[str] = None
    reference: Optional[str] = None

VALID_CATEGORIES = {
    'cogs', 'marketing', 'logistics', 'salaries', 'technology',
    'office', 'returns', 'payment_gateway', 'packaging', 'other'
}


# ── P&L Statement ─────────────────────────────────────────────────────────────

@router.get("/pnl")
async def get_pnl(
    request: Request,
    period: str = Query("month", enum=["week", "month", "quarter", "year"]),
    compare: bool = Query(False, description="Include previous period for comparison"),
):
    """
    Full Profit & Loss statement for the selected period.
    Returns revenue breakdown, expense breakdown, gross/net profit, margins.
    """
    workspace_id = request.state.workspace_id

    period_sql = {
        "week":    ("7 days",  "14 days"),
        "month":   ("30 days", "60 days"),
        "quarter": ("90 days", "180 days"),
        "year":    ("365 days","730 days"),
    }
    current_interval, compare_interval = period_sql[period]

    # Revenue metrics
    rev = await fetchrow("""
        SELECT
            COALESCE(SUM(total_price), 0)::float        AS gross_revenue,
            COALESCE(SUM(total_discounts), 0)::float    AS total_discounts,
            COALESCE(SUM(total_tax), 0)::float          AS total_tax,
            COALESCE(SUM(total_shipping_cost), 0)::float AS shipping_collected,
            COUNT(*)                                     AS order_count,
            COALESCE(AVG(total_price), 0)::float        AS aov,
            COUNT(DISTINCT customer_email)               AS unique_customers
        FROM shopify_orders
        WHERE workspace_id = $1
          AND created_at >= NOW() - $2::INTERVAL
          AND financial_status NOT IN ('refunded', 'voided')
    """, workspace_id, current_interval)

    # Expenses by category
    expenses = await fetch("""
        SELECT category, COALESCE(SUM(amount), 0)::float AS total
        FROM finance_expenses
        WHERE workspace_id = $1
          AND date >= CURRENT_DATE - $2::INTERVAL
        GROUP BY category
        ORDER BY total DESC
    """, workspace_id, current_interval)

    expense_map = {r["category"]: r["total"] for r in expenses}
    total_expenses = sum(expense_map.values())

    gross_rev = rev["gross_revenue"] or 0
    discounts = rev["total_discounts"] or 0
    net_rev = gross_rev - discounts

    cogs = expense_map.get("cogs", 0)
    gross_profit = net_rev - cogs
    gross_margin = (gross_profit / net_rev * 100) if net_rev else 0

    marketing = expense_map.get("marketing", 0)
    logistics = expense_map.get("logistics", 0)
    operating_expenses = total_expenses - cogs
    ebitda = gross_profit - operating_expenses
    ebitda_margin = (ebitda / net_rev * 100) if net_rev else 0

    result = {
        "period": period,
        "revenue": {
            "gross_revenue": round(gross_rev, 2),
            "discounts": round(discounts, 2),
            "net_revenue": round(net_rev, 2),
            "tax_collected": round(rev["total_tax"] or 0, 2),
            "shipping_collected": round(rev["shipping_collected"] or 0, 2),
            "order_count": rev["order_count"] or 0,
            "aov": round(rev["aov"] or 0, 2),
        },
        "cogs": round(cogs, 2),
        "gross_profit": round(gross_profit, 2),
        "gross_margin_pct": round(gross_margin, 1),
        "operating_expenses": {
            "marketing": round(marketing, 2),
            "logistics": round(logistics, 2),
            "salaries": round(expense_map.get("salaries", 0), 2),
            "technology": round(expense_map.get("technology", 0), 2),
            "payment_gateway": round(expense_map.get("payment_gateway", 0), 2),
            "packaging": round(expense_map.get("packaging", 0), 2),
            "returns": round(expense_map.get("returns", 0), 2),
            "other": round(expense_map.get("other", 0) + expense_map.get("office", 0), 2),
            "total": round(operating_expenses, 2),
        },
        "ebitda": round(ebitda, 2),
        "ebitda_margin_pct": round(ebitda_margin, 1),
        "net_profit": round(ebitda, 2),
        "net_margin_pct": round(ebitda_margin, 1),
    }

    # Compare with previous period
    if compare:
        prev_rev = await fetchrow("""
            SELECT
                COALESCE(SUM(total_price), 0)::float     AS gross_revenue,
                COALESCE(SUM(total_discounts), 0)::float AS total_discounts
            FROM shopify_orders
            WHERE workspace_id = $1
              AND created_at >= NOW() - $3::INTERVAL
              AND created_at <  NOW() - $2::INTERVAL
              AND financial_status NOT IN ('refunded', 'voided')
        """, workspace_id, current_interval, compare_interval)
        prev_net = (prev_rev["gross_revenue"] or 0) - (prev_rev["total_discounts"] or 0)
        result["comparison"] = {
            "prev_net_revenue": round(prev_net, 2),
            "revenue_change_pct": round(((net_rev - prev_net) / prev_net * 100) if prev_net else 0, 1),
        }

    return result


# ── Monthly P&L Trend ─────────────────────────────────────────────────────────

@router.get("/pnl/trend")
async def get_pnl_trend(request: Request, months: int = Query(6, ge=1, le=24)):
    """Monthly P&L trend for charts — last N months."""
    workspace_id = request.state.workspace_id

    rev_rows = await fetch("""
        SELECT
            DATE_TRUNC('month', created_at)          AS month,
            COALESCE(SUM(total_price), 0)::float     AS gross_revenue,
            COALESCE(SUM(total_discounts), 0)::float AS discounts,
            COUNT(*)                                  AS orders
        FROM shopify_orders
        WHERE workspace_id = $1
          AND created_at >= NOW() - ($2 || ' months')::INTERVAL
          AND financial_status NOT IN ('refunded', 'voided')
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month
    """, workspace_id, str(months))

    exp_rows = await fetch("""
        SELECT
            DATE_TRUNC('month', date::TIMESTAMPTZ) AS month,
            COALESCE(SUM(amount), 0)::float        AS total_expenses
        FROM finance_expenses
        WHERE workspace_id = $1
          AND date >= CURRENT_DATE - ($2 * 30)
        GROUP BY DATE_TRUNC('month', date::TIMESTAMPTZ)
        ORDER BY month
    """, workspace_id, months)

    exp_map = {str(r["month"])[:7]: r["total_expenses"] for r in exp_rows}

    result = []
    for r in rev_rows:
        month_key = str(r["month"])[:7]
        net_rev = (r["gross_revenue"] or 0) - (r["discounts"] or 0)
        expenses = exp_map.get(month_key, 0)
        result.append({
            "month": month_key,
            "revenue": round(net_rev, 2),
            "expenses": round(expenses, 2),
            "profit": round(net_rev - expenses, 2),
            "orders": r["orders"] or 0,
        })

    return result


# ── Contribution Margin ───────────────────────────────────────────────────────

@router.get("/contribution-margin")
async def get_contribution_margin(
    request: Request,
    days: int = Query(30, ge=7, le=365),
):
    """
    Contribution margin per product — Revenue minus variable costs.
    CM = Revenue - COGS - Shipping - Marketing (attributed) - Payment fees
    """
    workspace_id = request.state.workspace_id

    rows = await fetch("""
        SELECT
            oi.product_title,
            SUM(oi.quantity)                              AS units_sold,
            SUM(oi.price * oi.quantity)::float            AS revenue,
            SUM(oi.price * oi.quantity * 0.35)::float     AS est_cogs,   -- 35% COGS estimate
            SUM(oi.price * oi.quantity * 0.08)::float     AS est_shipping,-- 8% shipping estimate
            SUM(oi.price * oi.quantity * 0.02)::float     AS est_payment  -- 2% payment fees
        FROM shopify_order_items oi
        JOIN shopify_orders o ON o.id = oi.order_id
        WHERE o.workspace_id = $1
          AND o.created_at >= NOW() - ($2 || ' days')::INTERVAL
          AND o.financial_status NOT IN ('refunded', 'voided')
        GROUP BY oi.product_title
        ORDER BY revenue DESC
        LIMIT 20
    """, workspace_id, str(days))

    result = []
    for r in rows:
        rev = r["revenue"] or 0
        cogs = r["est_cogs"] or 0
        ship = r["est_shipping"] or 0
        pay = r["est_payment"] or 0
        cm = rev - cogs - ship - pay
        cm_pct = (cm / rev * 100) if rev else 0
        result.append({
            "product": r["product_title"],
            "units_sold": r["units_sold"] or 0,
            "revenue": round(rev, 2),
            "variable_costs": round(cogs + ship + pay, 2),
            "contribution_margin": round(cm, 2),
            "cm_pct": round(cm_pct, 1),
        })

    return result


# ── Break-Even Analysis ───────────────────────────────────────────────────────

@router.get("/breakeven")
async def get_breakeven(request: Request):
    """Break-even analysis based on fixed costs vs contribution margin."""
    workspace_id = request.state.workspace_id

    # Get fixed monthly costs (salaries, technology, office)
    fixed = await fetchrow("""
        SELECT COALESCE(SUM(amount), 0)::float AS total
        FROM finance_expenses
        WHERE workspace_id = $1
          AND date >= CURRENT_DATE - 30
          AND category IN ('salaries', 'technology', 'office')
    """, workspace_id)

    # Get average contribution margin (estimate)
    rev_row = await fetchrow("""
        SELECT
            COALESCE(SUM(total_price), 0)::float     AS revenue,
            COALESCE(AVG(total_price), 0)::float     AS aov
        FROM shopify_orders
        WHERE workspace_id = $1
          AND created_at >= NOW() - INTERVAL '30 days'
          AND financial_status NOT IN ('refunded', 'voided')
    """, workspace_id)

    fixed_costs = fixed["total"] or 0
    revenue = rev_row["revenue"] or 0
    aov = rev_row["aov"] or 0

    # Estimate variable cost ratio (COGS + shipping + payment = ~45%)
    variable_ratio = 0.45
    cm_per_order = aov * (1 - variable_ratio)
    breakeven_orders = (fixed_costs / cm_per_order) if cm_per_order > 0 else 0
    breakeven_revenue = breakeven_orders * aov
    current_margin = (revenue - revenue * variable_ratio - fixed_costs) / revenue * 100 if revenue else 0

    return {
        "fixed_costs_monthly": round(fixed_costs, 2),
        "variable_cost_ratio": variable_ratio,
        "avg_order_value": round(aov, 2),
        "contribution_per_order": round(cm_per_order, 2),
        "breakeven_orders": round(breakeven_orders),
        "breakeven_revenue": round(breakeven_revenue, 2),
        "current_revenue": round(revenue, 2),
        "above_breakeven": revenue > breakeven_revenue,
        "safety_margin_pct": round(current_margin, 1),
        "note": "Variable cost ratio uses 45% estimate (COGS 35% + shipping 8% + payment 2%). Update finance_expenses for accurate analysis.",
    }


# ── Expense Management ────────────────────────────────────────────────────────

@router.get("/expenses")
async def list_expenses(
    request: Request,
    days: int = Query(30, ge=1, le=365),
    category: Optional[str] = Query(None),
):
    """List expenses with optional category filter."""
    workspace_id = request.state.workspace_id
    if category and category not in VALID_CATEGORIES:
        raise HTTPException(400, f"Invalid category. Valid: {sorted(VALID_CATEGORIES)}")

    query = """
        SELECT id, date, category, subcategory, amount::float,
               description, vendor, reference, created_at
        FROM finance_expenses
        WHERE workspace_id = $1
          AND date >= CURRENT_DATE - $2
    """
    params = [workspace_id, days]
    if category:
        query += " AND category = $3"
        params.append(category)
    query += " ORDER BY date DESC LIMIT 200"

    rows = await fetch(query, *params)
    return [dict(r) for r in rows]


@router.post("/expenses")
async def create_expense(request: Request, body: ExpenseCreate):
    """Add a new expense entry."""
    workspace_id = request.state.workspace_id
    if body.category not in VALID_CATEGORIES:
        raise HTTPException(400, f"Invalid category")

    row = await fetchrow("""
        INSERT INTO finance_expenses
            (workspace_id, date, category, subcategory, amount, description, vendor, reference)
        VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8)
        RETURNING id, date, category, amount::float
    """, workspace_id, body.date, body.category, body.subcategory,
        body.amount, body.description, body.vendor, body.reference)
    return dict(row)


@router.delete("/expenses/{expense_id}")
async def delete_expense(request: Request, expense_id: str):
    """Delete an expense entry."""
    workspace_id = request.state.workspace_id
    await execute(
        "DELETE FROM finance_expenses WHERE id = $1 AND workspace_id = $2",
        expense_id, workspace_id
    )
    return {"success": True}


# ── Cash Flow Projection ──────────────────────────────────────────────────────

@router.get("/cashflow")
async def get_cashflow(request: Request, months: int = Query(3, ge=1, le=6)):
    """
    Simple cash flow projection based on trailing 30-day run rate.
    Projects revenue and expenses forward N months.
    """
    workspace_id = request.state.workspace_id

    # Last 30 days actuals
    rev = await fetchrow("""
        SELECT COALESCE(SUM(total_price - total_discounts), 0)::float AS net_revenue
        FROM shopify_orders
        WHERE workspace_id = $1
          AND created_at >= NOW() - INTERVAL '30 days'
          AND financial_status NOT IN ('refunded', 'voided')
    """, workspace_id)

    exp = await fetchrow("""
        SELECT COALESCE(SUM(amount), 0)::float AS total_expenses
        FROM finance_expenses
        WHERE workspace_id = $1
          AND date >= CURRENT_DATE - 30
    """, workspace_id)

    monthly_revenue = rev["net_revenue"] or 0
    monthly_expenses = exp["total_expenses"] or 0
    monthly_net = monthly_revenue - monthly_expenses

    projections = []
    cumulative = 0
    from datetime import date, timedelta
    import calendar

    for i in range(1, months + 1):
        # Add slight growth assumption (3% MoM)
        projected_rev = monthly_revenue * (1.03 ** i)
        projected_exp = monthly_expenses * (1.02 ** i)
        net = projected_rev - projected_exp
        cumulative += net

        future_date = date.today() + timedelta(days=30 * i)
        projections.append({
            "month": future_date.strftime("%Y-%m"),
            "projected_revenue": round(projected_rev, 2),
            "projected_expenses": round(projected_exp, 2),
            "projected_net": round(net, 2),
            "cumulative_net": round(cumulative, 2),
        })

    return {
        "base_monthly_revenue": round(monthly_revenue, 2),
        "base_monthly_expenses": round(monthly_expenses, 2),
        "base_monthly_net": round(monthly_net, 2),
        "projections": projections,
        "assumptions": "3% MoM revenue growth, 2% MoM expense growth based on trailing 30 days.",
    }
