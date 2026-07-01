"""
Google Ads Tools
Connects to the Google Ads REST API (v17).
Requires: OAuth2 refresh token + developer token + customer ID.
"""

import os
import json
import httpx
from typing import Optional
from mcp.app import mcp  # shared FastMCP singleton  # noqa: F401

GOOGLE_ADS_API_BASE = "https://googleads.googleapis.com/v17"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"


async def _refresh_google_token(refresh_token: str) -> str:
    """Exchange refresh token for a fresh access token."""
    client_id = os.getenv("GOOGLE_CLIENT_ID", "")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": client_id,
                "client_secret": client_secret,
            },
        )
        data = r.json()
        if "access_token" not in data:
            raise ValueError(f"Token refresh failed: {data}")
        return data["access_token"]


def _google_headers(access_token: str, developer_token: str, customer_id: str) -> dict:
    return {
        "Authorization": f"Bearer {access_token}",
        "developer-token": developer_token,
        "login-customer-id": customer_id,
        "Content-Type": "application/json",
    }


# ── Account / Campaign Overview ─────────────────────────────────────────────

@mcp.tool(annotations={"readOnlyHint": True})
async def google_list_campaigns(
    refresh_token: str,
    customer_id: str,
    developer_token: Optional[str] = None,
    status_filter: Optional[str] = None,
) -> str:
    """
    List Google Ads campaigns for a customer account.

    Args:
        refresh_token: Google OAuth2 refresh token (stored in GrowthOS integrations).
        customer_id: Google Ads customer/account ID (10-digit, no dashes).
        developer_token: Google Ads developer token. Falls back to env GOOGLE_DEVELOPER_TOKEN.
        status_filter: 'ENABLED', 'PAUSED', or None for all.

    Returns:
        JSON array of campaign objects with id, name, status, type, budget, bids.
    """
    dev_token = developer_token or os.getenv("GOOGLE_DEVELOPER_TOKEN", "")
    try:
        access_token = await _refresh_google_token(refresh_token)
    except ValueError as e:
        return json.dumps({"error": str(e)})

    where_clause = ""
    if status_filter:
        where_clause = f" WHERE campaign.status = '{status_filter}'"

    query = {
        "query": (
            "SELECT campaign.id, campaign.name, campaign.status, "
            "campaign.advertising_channel_type, campaign.bidding_strategy_type, "
            "campaign_budget.amount_micros, campaign_budget.delivery_method "
            f"FROM campaign{where_clause} ORDER BY campaign.name LIMIT 100"
        )
    }

    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(
            f"{GOOGLE_ADS_API_BASE}/customers/{customer_id}/googleAds:search",
            json=query,
            headers=_google_headers(access_token, dev_token, customer_id),
        )
    return r.text


@mcp.tool(annotations={"readOnlyHint": True})
async def google_get_campaign_performance(
    refresh_token: str,
    customer_id: str,
    date_range: str = "LAST_30_DAYS",
    developer_token: Optional[str] = None,
) -> str:
    """
    Get aggregated performance metrics for all Google Ads campaigns.

    Args:
        refresh_token: Google OAuth2 refresh token.
        customer_id: Google Ads customer ID.
        date_range: GAQL date range constant: TODAY, YESTERDAY, LAST_7_DAYS,
                    LAST_14_DAYS, LAST_30_DAYS, THIS_MONTH, LAST_MONTH.
        developer_token: Google Ads developer token (falls back to env).

    Returns:
        JSON with impressions, clicks, cost_micros, conversions, conversion_value,
        ctr, average_cpc, roas per campaign.
    """
    dev_token = developer_token or os.getenv("GOOGLE_DEVELOPER_TOKEN", "")
    try:
        access_token = await _refresh_google_token(refresh_token)
    except ValueError as e:
        return json.dumps({"error": str(e)})

    query = {
        "query": (
            "SELECT campaign.id, campaign.name, campaign.status, "
            "metrics.impressions, metrics.clicks, metrics.cost_micros, "
            "metrics.conversions, metrics.conversions_value, "
            "metrics.ctr, metrics.average_cpc, metrics.search_impression_share "
            f"FROM campaign WHERE segments.date DURING {date_range} "
            "ORDER BY metrics.cost_micros DESC LIMIT 100"
        )
    }

    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(
            f"{GOOGLE_ADS_API_BASE}/customers/{customer_id}/googleAds:search",
            json=query,
            headers=_google_headers(access_token, dev_token, customer_id),
        )
    return r.text


@mcp.tool(annotations={"readOnlyHint": True})
async def google_get_keyword_performance(
    refresh_token: str,
    customer_id: str,
    campaign_id: Optional[str] = None,
    date_range: str = "LAST_30_DAYS",
    developer_token: Optional[str] = None,
    limit: int = 50,
) -> str:
    """
    Get keyword-level performance metrics.

    Args:
        refresh_token: Google OAuth2 refresh token.
        customer_id: Google Ads customer ID.
        campaign_id: Filter to specific campaign ID, or None for all campaigns.
        date_range: GAQL date range constant.
        developer_token: Google Ads developer token.
        limit: Max keywords to return.

    Returns:
        JSON array of keywords with text, match type, impressions, clicks,
        CTR, avg CPC, conversions, Quality Score.
    """
    dev_token = developer_token or os.getenv("GOOGLE_DEVELOPER_TOKEN", "")
    try:
        access_token = await _refresh_google_token(refresh_token)
    except ValueError as e:
        return json.dumps({"error": str(e)})

    where_parts = [f"segments.date DURING {date_range}"]
    if campaign_id:
        where_parts.append(f"campaign.id = {campaign_id}")

    query = {
        "query": (
            "SELECT ad_group_criterion.keyword.text, "
            "ad_group_criterion.keyword.match_type, "
            "ad_group_criterion.quality_info.quality_score, "
            "metrics.impressions, metrics.clicks, metrics.cost_micros, "
            "metrics.ctr, metrics.average_cpc, metrics.conversions "
            "FROM keyword_view "
            f"WHERE {' AND '.join(where_parts)} "
            "ORDER BY metrics.impressions DESC "
            f"LIMIT {limit}"
        )
    }

    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(
            f"{GOOGLE_ADS_API_BASE}/customers/{customer_id}/googleAds:search",
            json=query,
            headers=_google_headers(access_token, dev_token, customer_id),
        )
    return r.text


@mcp.tool(annotations={"readOnlyHint": True})
async def google_get_search_terms(
    refresh_token: str,
    customer_id: str,
    date_range: str = "LAST_30_DAYS",
    developer_token: Optional[str] = None,
    limit: int = 50,
) -> str:
    """
    Get actual search terms that triggered your ads (search term report).
    Useful for finding negative keyword candidates or new keyword opportunities.

    Args:
        refresh_token: Google OAuth2 refresh token.
        customer_id: Google Ads customer ID.
        date_range: GAQL date range constant.
        developer_token: Google Ads developer token.
        limit: Max terms to return (sorted by impressions desc).

    Returns:
        JSON array of search term rows with impressions, clicks, conversions, CTR.
    """
    dev_token = developer_token or os.getenv("GOOGLE_DEVELOPER_TOKEN", "")
    try:
        access_token = await _refresh_google_token(refresh_token)
    except ValueError as e:
        return json.dumps({"error": str(e)})

    query = {
        "query": (
            "SELECT search_term_view.search_term, search_term_view.status, "
            "metrics.impressions, metrics.clicks, metrics.cost_micros, "
            "metrics.conversions, metrics.ctr "
            "FROM search_term_view "
            f"WHERE segments.date DURING {date_range} "
            "ORDER BY metrics.impressions DESC "
            f"LIMIT {limit}"
        )
    }

    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(
            f"{GOOGLE_ADS_API_BASE}/customers/{customer_id}/googleAds:search",
            json=query,
            headers=_google_headers(access_token, dev_token, customer_id),
        )
    return r.text


@mcp.tool(annotations={"readOnlyHint": False, "destructiveHint": False})
async def google_update_campaign_budget(
    refresh_token: str,
    customer_id: str,
    campaign_budget_resource_name: str,
    daily_budget_inr: int,
    developer_token: Optional[str] = None,
) -> str:
    """
    Update the daily budget of a Google Ads campaign budget.

    Note: Google Ads API uses micros (1 INR = 1,000,000 micros).
    This tool accepts whole INR values and converts automatically.

    Args:
        refresh_token: Google OAuth2 refresh token.
        customer_id: Google Ads customer ID.
        campaign_budget_resource_name: Resource name like customers/XXX/campaignBudgets/YYY.
        daily_budget_inr: New daily budget in INR (e.g., 5000 = ₹5,000/day).
        developer_token: Google Ads developer token.

    Returns:
        JSON confirming the mutation result.
    """
    dev_token = developer_token or os.getenv("GOOGLE_DEVELOPER_TOKEN", "")
    try:
        access_token = await _refresh_google_token(refresh_token)
    except ValueError as e:
        return json.dumps({"error": str(e)})

    payload = {
        "operations": [
            {
                "updateMask": "amountMicros",
                "update": {
                    "resourceName": campaign_budget_resource_name,
                    "amountMicros": daily_budget_inr * 1_000_000,
                },
            }
        ]
    }

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            f"{GOOGLE_ADS_API_BASE}/customers/{customer_id}/campaignBudgets:mutate",
            json=payload,
            headers=_google_headers(access_token, dev_token, customer_id),
        )
    return r.text
