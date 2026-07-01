"""
Sync Tools
Trigger manual data syncs and check integration status via GrowthOS backend.
"""

import os
import json
import httpx
from typing import Optional
from mcp.app import mcp  # shared FastMCP singleton  # noqa: F401

BACKEND = os.getenv("BACKEND_URL", "http://localhost:8000")


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@mcp.tool(annotations={"readOnlyHint": True})
async def get_integration_status(token: str) -> str:
    """
    Get connection status for all integrations (Shopify, Meta Ads, Google Ads).

    Args:
        token: Supabase JWT access token.

    Returns:
        JSON with integration statuses, last sync times, and error states.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(f"{BACKEND}/api/v1/integrations", headers=_auth(token))
    return r.text


@mcp.tool(annotations={"readOnlyHint": False, "destructiveHint": False, "idempotentHint": False})
async def trigger_manual_sync(
    token: str,
    platform: str,
    days_back: int = 7,
) -> str:
    """
    Trigger a manual data sync for a specific platform.

    Args:
        token: Supabase JWT access token.
        platform: Platform to sync — 'shopify', 'meta', 'google', or 'all'.
        days_back: How many days of historical data to pull (1–90).

    Returns:
        JSON with sync job status (queued/running/completed/error) and job ID.
    """
    platform = platform.lower()
    if platform not in ("shopify", "meta", "google", "all"):
        return json.dumps({"error": "platform must be: shopify, meta, google, or all"})

    days_back = min(max(days_back, 1), 90)

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            f"{BACKEND}/api/v1/sync/trigger",
            json={"platform": platform, "days_back": days_back},
            headers=_auth(token),
        )
    return r.text


@mcp.tool(annotations={"readOnlyHint": True})
async def get_sync_logs(
    token: str,
    platform: Optional[str] = None,
    limit: int = 20,
) -> str:
    """
    Fetch recent sync job logs to inspect data pipeline health.

    Args:
        token: Supabase JWT access token.
        platform: Filter by platform — 'shopify', 'meta', 'google', or None for all.
        limit: Max log entries to return.

    Returns:
        JSON array of sync log entries with platform, status, duration, rows_synced, error_message.
    """
    params: dict = {"limit": limit}
    if platform:
        params["platform"] = platform

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            f"{BACKEND}/api/v1/sync/logs",
            params=params,
            headers=_auth(token),
        )
    return r.text


@mcp.tool(annotations={"readOnlyHint": True})
async def get_workspace_settings(token: str) -> str:
    """
    Get workspace configuration — brand name, timezone, currency, profit config.

    Args:
        token: Supabase JWT access token.

    Returns:
        JSON with workspace settings and profit configuration.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(f"{BACKEND}/api/v1/settings", headers=_auth(token))
    return r.text
