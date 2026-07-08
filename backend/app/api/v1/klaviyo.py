"""
Klaviyo Integration — Connect, Email Metrics, Flows, Status
"""

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
from loguru import logger
import httpx, os

from ...core.database import fetchrow, execute, fetch

router = APIRouter(prefix="/klaviyo", tags=["klaviyo"])

KLAVIYO_BASE = "https://a.klaviyo.com/api"


class KlaviyoConnectRequest(BaseModel):
    api_key: str


def _klaviyo_headers(api_key: str) -> dict:
    return {
        "Authorization": f"Klaviyo-API-Key {api_key}",
        "Accept": "application/json",
        "revision": "2024-02-15",
    }


async def _get_klaviyo_key(workspace_id) -> str:
    """Fetch klaviyo_api_key from api_credentials."""
    row = await fetchrow(
        "SELECT klaviyo_api_key FROM api_credentials WHERE workspace_id = $1 LIMIT 1",
        workspace_id,
    )
    return (row or {}).get("klaviyo_api_key") or ""


# ---------------------------------------------------------------------------
# POST /klaviyo/connect
# ---------------------------------------------------------------------------
@router.post("/connect")
async def klaviyo_connect(request: Request, body: KlaviyoConnectRequest):
    """Save Klaviyo API key to api_credentials (upsert)."""
    workspace_id = request.state.workspace_id

    # Validate the key by hitting the Klaviyo API
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f"{KLAVIYO_BASE}/metrics/",
                headers=_klaviyo_headers(body.api_key),
                params={"page[size]": 1},
            )
            if r.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid Klaviyo API key")
            if r.status_code not in (200, 201):
                logger.warning(f"Klaviyo connect pre-check returned {r.status_code} for workspace {workspace_id}")
    except httpx.RequestError as e:
        logger.error(f"Klaviyo connect request error: {e}")
        raise HTTPException(status_code=502, detail=f"Could not reach Klaviyo API: {e}")

    try:
        await execute(
            """
            INSERT INTO api_credentials (workspace_id, klaviyo_api_key, is_active, updated_at)
            VALUES ($1, $2, TRUE, NOW())
            ON CONFLICT (workspace_id)
            DO UPDATE SET
                klaviyo_api_key = EXCLUDED.klaviyo_api_key,
                is_active = TRUE,
                updated_at = NOW()
            """,
            workspace_id,
            body.api_key,
        )
        logger.info(f"Klaviyo API key saved for workspace {workspace_id}")
    except Exception as e:
        logger.error(f"Failed to save Klaviyo API key for workspace {workspace_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to save Klaviyo API key")

    return {"status": "connected"}


# ---------------------------------------------------------------------------
# GET /klaviyo/metrics
# ---------------------------------------------------------------------------
@router.get("/metrics")
async def klaviyo_metrics(request: Request, days: int = 30):
    """Fetch email metrics from Klaviyo API: open rate, click rate, revenue."""
    workspace_id = request.state.workspace_id
    api_key = await _get_klaviyo_key(workspace_id)

    if not api_key:
        logger.info(f"Klaviyo not configured for workspace {workspace_id}")
        return {"status": "not_configured", "message": "Klaviyo API key not set for this workspace"}

    from datetime import datetime, timedelta, timezone

    start_dt = datetime.now(timezone.utc) - timedelta(days=days)
    start_iso = start_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            # Fetch campaigns sent in the period
            r = await client.get(
                f"{KLAVIYO_BASE}/campaigns/",
                headers=_klaviyo_headers(api_key),
                params={
                    "filter": f"greater-or-equal(send_time,{start_iso})",
                    "fields[campaign]": "name,send_time,status",
                    "page[size]": 50,
                },
            )
            if r.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid Klaviyo API key")
            if r.status_code != 200:
                logger.error(f"Klaviyo campaigns API error: {r.status_code} {r.text}")
                raise HTTPException(status_code=r.status_code, detail="Klaviyo API error")

            campaigns_data = r.json().get("data", [])
            campaign_count = len(campaigns_data)

            # Fetch aggregate metrics
            metrics_r = await client.get(
                f"{KLAVIYO_BASE}/metrics/",
                headers=_klaviyo_headers(api_key),
                params={"page[size]": 100},
            )
            all_metrics = []
            if metrics_r.status_code == 200:
                all_metrics = metrics_r.json().get("data", [])

            # Filter for email-related metrics by name
            email_metric_names = {"Opened Email", "Clicked Email", "Received Email", "Revenue"}
            email_metrics = [
                m for m in all_metrics
                if m.get("attributes", {}).get("name") in email_metric_names
            ]

            logger.info(
                f"Klaviyo metrics fetched for workspace {workspace_id}: "
                f"{campaign_count} campaigns, {len(email_metrics)} email metrics"
            )

            return {
                "status": "ok",
                "period_days": days,
                "campaigns_sent": campaign_count,
                "campaigns": [
                    {
                        "id": c.get("id"),
                        "name": c.get("attributes", {}).get("name"),
                        "send_time": c.get("attributes", {}).get("send_time"),
                        "status": c.get("attributes", {}).get("status"),
                    }
                    for c in campaigns_data
                ],
                "available_metrics": [
                    {
                        "id": m.get("id"),
                        "name": m.get("attributes", {}).get("name"),
                        "integration": m.get("attributes", {}).get("integration", {}).get("name"),
                    }
                    for m in email_metrics
                ],
                "note": "Use /klaviyo/metrics?days=N to adjust the reporting window",
            }

    except httpx.RequestError as e:
        logger.error(f"Klaviyo metrics request error: {e}")
        raise HTTPException(status_code=502, detail=f"Klaviyo API unreachable: {e}")


# ---------------------------------------------------------------------------
# GET /klaviyo/flows
# ---------------------------------------------------------------------------
@router.get("/flows")
async def klaviyo_flows(request: Request):
    """List active Klaviyo automation flows."""
    workspace_id = request.state.workspace_id
    api_key = await _get_klaviyo_key(workspace_id)

    if not api_key:
        logger.info(f"Klaviyo not configured for workspace {workspace_id}")
        return {"status": "not_configured", "message": "Klaviyo API key not set for this workspace"}

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get(
                f"{KLAVIYO_BASE}/flows/",
                headers=_klaviyo_headers(api_key),
                params={
                    "filter": "equals(status,'active')",
                    "fields[flow]": "name,status,trigger_type,created,updated",
                    "page[size]": 50,
                },
            )
            if r.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid Klaviyo API key")
            if r.status_code != 200:
                logger.error(f"Klaviyo flows API error: {r.status_code} {r.text}")
                raise HTTPException(status_code=r.status_code, detail="Klaviyo API error")

            flows_data = r.json().get("data", [])
            flows = [
                {
                    "id": f.get("id"),
                    "name": f.get("attributes", {}).get("name"),
                    "status": f.get("attributes", {}).get("status"),
                    "trigger_type": f.get("attributes", {}).get("trigger_type"),
                    "created": f.get("attributes", {}).get("created"),
                    "updated": f.get("attributes", {}).get("updated"),
                }
                for f in flows_data
            ]

            logger.info(f"Klaviyo flows fetched for workspace {workspace_id}: {len(flows)} active flows")
            return {"status": "ok", "flows": flows, "total": len(flows)}

    except httpx.RequestError as e:
        logger.error(f"Klaviyo flows request error: {e}")
        raise HTTPException(status_code=502, detail=f"Klaviyo API unreachable: {e}")


# ---------------------------------------------------------------------------
# GET /klaviyo/status
# ---------------------------------------------------------------------------
@router.get("/status")
async def klaviyo_status(request: Request):
    """Return Klaviyo connection status for the workspace."""
    workspace_id = request.state.workspace_id
    api_key = await _get_klaviyo_key(workspace_id)

    configured = bool(api_key)
    logger.info(f"Klaviyo status check for workspace {workspace_id}: configured={configured}")

    return {
        "configured": configured,
        "api_key_set": configured,
    }
