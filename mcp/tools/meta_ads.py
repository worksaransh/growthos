"""
Meta Ads Tools (Facebook/Instagram Ads)
Connects directly to the Meta Marketing API v19.0.
"""

import os
import json
import httpx
from typing import Optional
from mcp.app import mcp  # shared FastMCP singleton  # noqa: F401

META_API_BASE = "https://graph.facebook.com/v19.0"


def _meta_get(path: str, params: dict) -> dict:
    """Synchronous helper for simple GET calls to Meta API."""
    import urllib.request, urllib.parse  # noqa: E401
    qs = urllib.parse.urlencode(params)
    url = f"{META_API_BASE}/{path}?{qs}"
    with urllib.request.urlopen(url, timeout=15) as resp:
        return json.loads(resp.read())


# ── Ad Account Info ─────────────────────────────────────────────────────────

@mcp.tool(annotations={"readOnlyHint": True})
async def meta_get_ad_accounts(access_token: str) -> str:
    """
    List all Meta Ad Accounts accessible with the given access token.

    Args:
        access_token: Meta User Access Token (from GrowthOS OAuth).

    Returns:
        JSON array of ad account objects with id, name, currency, account_status.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            f"{META_API_BASE}/me/adaccounts",
            params={
                "access_token": access_token,
                "fields": "id,name,currency,account_status,amount_spent,balance",
            },
        )
    return r.text


@mcp.tool(annotations={"readOnlyHint": True})
async def meta_get_campaigns(
    ad_account_id: str,
    access_token: str,
    status_filter: Optional[str] = None,
    limit: int = 25,
) -> str:
    """
    List campaigns in a Meta Ad Account.

    Args:
        ad_account_id: Meta Ad Account ID — format: act_XXXXXXXXXX.
        access_token: Meta access token.
        status_filter: 'ACTIVE', 'PAUSED', 'ARCHIVED', or None for all.
        limit: Max results (default 25).

    Returns:
        JSON array of campaigns with id, name, status, objective, daily_budget, lifetime_budget.
    """
    params: dict = {
        "access_token": access_token,
        "fields": "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,created_time",
        "limit": limit,
    }
    if status_filter:
        params["effective_status"] = f'["{status_filter}"]'

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            f"{META_API_BASE}/{ad_account_id}/campaigns",
            params=params,
        )
    return r.text


@mcp.tool(annotations={"readOnlyHint": True})
async def meta_get_campaign_insights(
    campaign_id: str,
    access_token: str,
    date_preset: str = "last_30d",
    breakdown: Optional[str] = None,
) -> str:
    """
    Get performance insights for a specific Meta campaign.

    Args:
        campaign_id: Meta Campaign ID.
        access_token: Meta access token.
        date_preset: One of: today, yesterday, last_7d, last_14d, last_30d,
                     this_month, last_month. Default: last_30d.
        breakdown: Optional breakdown dimension — 'age', 'gender', 'country',
                   'placement', or None for totals only.

    Returns:
        JSON with spend, impressions, clicks, ctr, cpm, cpc, reach, frequency,
        purchases, purchase_roas, cost_per_purchase.
    """
    fields = (
        "spend,impressions,clicks,ctr,cpm,cpc,reach,frequency,"
        "actions,action_values,cost_per_action_type,purchase_roas"
    )
    params: dict = {
        "access_token": access_token,
        "fields": fields,
        "date_preset": date_preset,
        "level": "campaign",
    }
    if breakdown:
        params["breakdowns"] = breakdown

    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(
            f"{META_API_BASE}/{campaign_id}/insights",
            params=params,
        )
    return r.text


@mcp.tool(annotations={"readOnlyHint": True})
async def meta_get_adsets(
    campaign_id: str,
    access_token: str,
    limit: int = 25,
) -> str:
    """
    List ad sets within a campaign with targeting and budget info.

    Args:
        campaign_id: Meta Campaign ID.
        access_token: Meta access token.
        limit: Max results.

    Returns:
        JSON array of ad sets with targeting, bid strategy, budget, status.
    """
    params = {
        "access_token": access_token,
        "fields": (
            "id,name,status,daily_budget,lifetime_budget,bid_amount,bid_strategy,"
            "targeting,optimization_goal,billing_event,start_time,end_time"
        ),
        "limit": limit,
    }
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            f"{META_API_BASE}/{campaign_id}/adsets",
            params=params,
        )
    return r.text


@mcp.tool(annotations={"readOnlyHint": True})
async def meta_get_ads(
    adset_id: str,
    access_token: str,
    limit: int = 25,
) -> str:
    """
    List individual ads within an ad set.

    Args:
        adset_id: Meta Ad Set ID.
        access_token: Meta access token.
        limit: Max results.

    Returns:
        JSON array of ad objects with creative details, status, preview link.
    """
    params = {
        "access_token": access_token,
        "fields": "id,name,status,creative{id,name,thumbnail_url,body,title},created_time",
        "limit": limit,
    }
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            f"{META_API_BASE}/{adset_id}/ads",
            params=params,
        )
    return r.text


@mcp.tool(annotations={"readOnlyHint": True})
async def meta_get_account_insights(
    ad_account_id: str,
    access_token: str,
    date_preset: str = "last_30d",
) -> str:
    """
    Get top-level account-wide insights for a Meta Ad Account.

    Args:
        ad_account_id: Meta Ad Account ID — format: act_XXXXXXXXXX.
        access_token: Meta access token.
        date_preset: Date range preset (last_7d, last_30d, this_month, etc.).

    Returns:
        JSON with total spend, impressions, clicks, ROAS, purchases, CPP across all campaigns.
    """
    params = {
        "access_token": access_token,
        "fields": (
            "spend,impressions,clicks,ctr,cpm,cpc,reach,"
            "actions,action_values,purchase_roas,cost_per_action_type"
        ),
        "date_preset": date_preset,
        "level": "account",
    }
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(
            f"{META_API_BASE}/{ad_account_id}/insights",
            params=params,
        )
    return r.text


@mcp.tool(annotations={"readOnlyHint": False, "destructiveHint": False, "idempotentHint": False})
async def meta_update_campaign_status(
    campaign_id: str,
    access_token: str,
    status: str,
) -> str:
    """
    Pause or activate a Meta campaign.

    Args:
        campaign_id: Meta Campaign ID.
        access_token: Meta access token.
        status: 'ACTIVE' to activate, 'PAUSED' to pause.

    Returns:
        JSON confirming the update or error details.
    """
    if status not in ("ACTIVE", "PAUSED"):
        return json.dumps({"error": "status must be 'ACTIVE' or 'PAUSED'"})

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            f"{META_API_BASE}/{campaign_id}",
            params={"access_token": access_token},
            data={"status": status},
        )
    return r.text


@mcp.tool(annotations={"readOnlyHint": False, "destructiveHint": False})
async def meta_update_campaign_budget(
    campaign_id: str,
    access_token: str,
    daily_budget_inr: Optional[int] = None,
    lifetime_budget_inr: Optional[int] = None,
) -> str:
    """
    Update the daily or lifetime budget of a Meta campaign.

    Note: Meta API expects budget in the smallest currency unit.
    For INR this means paise (1 INR = 100 paise). This tool accepts
    whole INR values and converts automatically.

    Args:
        campaign_id: Meta Campaign ID.
        access_token: Meta access token.
        daily_budget_inr: New daily budget in INR (e.g., 5000 = ₹5,000/day).
        lifetime_budget_inr: New lifetime budget in INR.

    Returns:
        JSON confirming the budget update.
    """
    data = {}
    if daily_budget_inr is not None:
        data["daily_budget"] = str(daily_budget_inr * 100)  # convert to paise
    if lifetime_budget_inr is not None:
        data["lifetime_budget"] = str(lifetime_budget_inr * 100)

    if not data:
        return json.dumps({"error": "Provide at least one of daily_budget_inr or lifetime_budget_inr"})

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            f"{META_API_BASE}/{campaign_id}",
            params={"access_token": access_token},
            data=data,
        )
    return r.text


@mcp.tool(annotations={"readOnlyHint": True})
async def meta_get_pixel_events(
    pixel_id: str,
    access_token: str,
    date_preset: str = "last_7d",
) -> str:
    """
    Fetch Meta Pixel event statistics (PageView, AddToCart, Purchase, etc.).

    Args:
        pixel_id: Meta Pixel ID.
        access_token: Meta access token.
        date_preset: Date range preset.

    Returns:
        JSON with event counts grouped by event name.
    """
    params = {
        "access_token": access_token,
        "fields": "name,last_fired_time,stats",
        "date_preset": date_preset,
    }
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            f"{META_API_BASE}/{pixel_id}",
            params=params,
        )
    return r.text
