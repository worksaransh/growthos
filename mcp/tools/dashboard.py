"""
GrowthOS Dashboard Tools
Fetch metrics, profit, customers, notifications from GrowthOS backend API.
"""

import os
import json
import httpx
from typing import Optional
from datetime import date, timedelta
from mcp.app import mcp  # shared FastMCP singleton  # noqa: F401

# Share the app instance from parent

BACKEND = os.getenv("BACKEND_URL", "http://localhost:8000")
_HEADERS_CACHE: dict = {}


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ── Dashboard Metrics ───────────────────────────────────────────────────────

@mcp.tool(
    annotations={"readOnlyHint": True, "destructiveHint": False},
)
async def get_dashboard_metrics(
    token: str,
    days: int = 30,
) -> str:
    """
    Fetch GrowthOS dashboard summary metrics for the authenticated workspace.

    Args:
        token: Supabase JWT access token for the authenticated user.
        days: Number of trailing days to aggregate (default 30, max 90).

    Returns:
        JSON with: gross_revenue, net_revenue, total_orders, aov, total_ad_spend,
        blended_roas, meta_roas, google_roas, cac, gross_profit, mer,
        meta_spend, google_spend — all aggregated over the requested period.
    """
    days = min(max(days, 1), 90)
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            f"{BACKEND}/api/v1/dashboard/metrics",
            params={"days": days},
            headers=_auth_headers(token),
        )
    if r.status_code != 200:
        return json.dumps({"error": r.text, "status": r.status_code})
    return r.text


@mcp.tool(annotations={"readOnlyHint": True})
async def get_daily_metrics(
    token: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> str:
    """
    Fetch day-by-day metric rows for charting and trend analysis.

    Args:
        token: Supabase JWT access token.
        start_date: ISO date string (YYYY-MM-DD). Defaults to 30 days ago.
        end_date: ISO date string (YYYY-MM-DD). Defaults to today.

    Returns:
        JSON array of daily metric objects sorted by date ascending.
    """
    if not start_date:
        start_date = (date.today() - timedelta(days=30)).isoformat()
    if not end_date:
        end_date = date.today().isoformat()

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            f"{BACKEND}/api/v1/dashboard/daily",
            params={"start_date": start_date, "end_date": end_date},
            headers=_auth_headers(token),
        )
    if r.status_code != 200:
        return json.dumps({"error": r.text, "status": r.status_code})
    return r.text


@mcp.tool(annotations={"readOnlyHint": True})
async def get_profit_summary(token: str, days: int = 30) -> str:
    """
    Fetch profit breakdown including gross profit, net profit, contribution margin,
    COGS, shipping costs, and payment gateway fees.

    Args:
        token: Supabase JWT access token.
        days: Trailing days (default 30).

    Returns:
        JSON with profit P&L breakdown.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            f"{BACKEND}/api/v1/profit/summary",
            params={"days": days},
            headers=_auth_headers(token),
        )
    if r.status_code != 200:
        return json.dumps({"error": r.text, "status": r.status_code})
    return r.text


@mcp.tool(annotations={"readOnlyHint": True})
async def get_customers(
    token: str,
    segment: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> str:
    """
    List customers with LTV, segment, and order history.

    Args:
        token: Supabase JWT access token.
        segment: Filter by segment — 'vip', 'loyal', 'one_time', 'at_risk', 'dormant'.
        limit: Max records (default 50, max 200).
        offset: Pagination offset.

    Returns:
        JSON array of customer objects.
    """
    params: dict = {"limit": min(limit, 200), "offset": offset}
    if segment:
        params["segment"] = segment

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            f"{BACKEND}/api/v1/customers",
            params=params,
            headers=_auth_headers(token),
        )
    if r.status_code != 200:
        return json.dumps({"error": r.text, "status": r.status_code})
    return r.text


@mcp.tool(annotations={"readOnlyHint": True})
async def get_notifications(
    token: str,
    unread_only: bool = False,
    limit: int = 20,
) -> str:
    """
    Fetch workspace notifications (alerts, sync statuses, milestones).

    Args:
        token: Supabase JWT access token.
        unread_only: Only return unread notifications.
        limit: Max to return.

    Returns:
        JSON array of notification objects.
    """
    params = {"limit": limit}
    if unread_only:
        params["unread_only"] = "true"

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            f"{BACKEND}/api/v1/notifications",
            params=params,
            headers=_auth_headers(token),
        )
    if r.status_code != 200:
        return json.dumps({"error": r.text, "status": r.status_code})
    return r.text


@mcp.tool(annotations={"readOnlyHint": True})
async def get_forecast(token: str, days_ahead: int = 30) -> str:
    """
    Fetch AI-generated revenue and profit forecast.

    Args:
        token: Supabase JWT access token.
        days_ahead: How many days forward to forecast (7, 14, or 30).

    Returns:
        JSON with forecasted revenue, orders, profit by day.
    """
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(
            f"{BACKEND}/api/v1/forecast",
            params={"days": days_ahead},
            headers=_auth_headers(token),
        )
    if r.status_code != 200:
        return json.dumps({"error": r.text, "status": r.status_code})
    return r.text
