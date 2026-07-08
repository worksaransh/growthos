"""
Snapchat Ads Integration — Campaigns, Performance, Status
"""

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
from loguru import logger
import httpx, os

from ...core.database import fetchrow, execute, fetch

router = APIRouter(prefix="/snapchat-ads", tags=["snapchat_ads"])

SNAPCHAT_ADS_BASE = "https://adsapi.snapchat.com/v1"


def _snap_headers(access_token: str) -> dict:
    return {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }


async def _get_snap_creds(workspace_id) -> tuple[str, str]:
    """Fetch Snapchat access_token and ad_account_id from api_credentials."""
    row = await fetchrow(
        "SELECT snapchat_access_token, snapchat_ad_account_id FROM api_credentials WHERE workspace_id = $1 LIMIT 1",
        workspace_id,
    )
    access_token = (row or {}).get("snapchat_access_token") or ""
    ad_account_id = (row or {}).get("snapchat_ad_account_id") or ""
    return access_token, ad_account_id


# ---------------------------------------------------------------------------
# GET /snapchat-ads/campaigns
# ---------------------------------------------------------------------------
@router.get("/campaigns")
async def snapchat_campaigns(request: Request):
    """Fetch campaigns from Snapchat Marketing API."""
    workspace_id = request.state.workspace_id
    access_token, ad_account_id = await _get_snap_creds(workspace_id)

    if not (access_token and ad_account_id):
        logger.info(f"Snapchat Ads not configured for workspace {workspace_id}")
        return {"status": "not_configured", "message": "Snapchat Ads access_token and ad_account_id not set for this workspace"}

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get(
                f"{SNAPCHAT_ADS_BASE}/adaccounts/{ad_account_id}/campaigns",
                headers=_snap_headers(access_token),
            )
            if r.status_code == 401:
                logger.error(f"Snapchat Ads campaigns 401 for workspace {workspace_id}")
                raise HTTPException(status_code=401, detail="Snapchat Ads access token expired or invalid")
            if r.status_code != 200:
                logger.error(f"Snapchat Ads campaigns API error: {r.status_code} {r.text}")
                raise HTTPException(status_code=r.status_code, detail="Snapchat Ads API error")

            data = r.json()
            # Snapchat returns {"campaigns": [{"campaign": {...}}, ...]}
            raw_campaigns = data.get("campaigns", [])
            campaigns = [item.get("campaign", item) for item in raw_campaigns]

            logger.info(f"Snapchat Ads campaigns fetched for workspace {workspace_id}: {len(campaigns)} campaigns")
            return {"status": "ok", "campaigns": campaigns, "total": len(campaigns)}

    except httpx.RequestError as e:
        logger.error(f"Snapchat Ads campaigns request error: {e}")
        raise HTTPException(status_code=502, detail=f"Snapchat Ads API unreachable: {e}")


# ---------------------------------------------------------------------------
# GET /snapchat-ads/performance
# ---------------------------------------------------------------------------
@router.get("/performance")
async def snapchat_performance(
    request: Request,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    """Aggregate Snapchat Ads performance stats for the ad account."""
    workspace_id = request.state.workspace_id
    access_token, ad_account_id = await _get_snap_creds(workspace_id)

    if not (access_token and ad_account_id):
        logger.info(f"Snapchat Ads not configured for workspace {workspace_id}")
        return {"status": "not_configured", "message": "Snapchat Ads access_token and ad_account_id not set for this workspace"}

    from datetime import datetime, timedelta
    if not end_date:
        end_date = datetime.utcnow().strftime("%Y-%m-%d")
    if not start_date:
        start_date = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get(
                f"{SNAPCHAT_ADS_BASE}/adaccounts/{ad_account_id}/stats",
                headers=_snap_headers(access_token),
                params={
                    "fields": "impressions,swipes,spend,video_views,quartile_1,quartile_2,quartile_3,view_completion",
                    "granularity": "DAY",
                    "start_time": f"{start_date}T00:00:00.000Z",
                    "end_time": f"{end_date}T23:59:59.999Z",
                },
            )
            if r.status_code == 401:
                raise HTTPException(status_code=401, detail="Snapchat Ads access token expired or invalid")
            if r.status_code != 200:
                logger.error(f"Snapchat Ads performance API error: {r.status_code} {r.text}")
                raise HTTPException(status_code=r.status_code, detail="Snapchat Ads API error")

            data = r.json()
            timeseries = (data.get("total_stats") or [{}])[0].get("timeseries", []) if data.get("total_stats") else []

            total_impressions = 0
            total_swipes = 0
            total_spend_micro = 0  # Snapchat returns spend in micro-cents
            total_video_views = 0

            for ts in timeseries:
                stats = ts.get("stats", {})
                total_impressions += int(stats.get("impressions", 0) or 0)
                total_swipes += int(stats.get("swipes", 0) or 0)
                total_spend_micro += int(stats.get("spend", 0) or 0)
                total_video_views += int(stats.get("video_views", 0) or 0)

            total_spend = total_spend_micro / 1_000_000  # Convert micro-cents to dollars
            swipe_rate = round(total_swipes / total_impressions * 100, 4) if total_impressions else 0.0
            cps = round(total_spend / total_swipes, 4) if total_swipes else 0.0

            logger.info(
                f"Snapchat Ads performance for workspace {workspace_id}: "
                f"spend={total_spend}, impressions={total_impressions}, swipes={total_swipes}"
            )

            return {
                "status": "ok",
                "date_range": {"start_date": start_date, "end_date": end_date},
                "aggregated": {
                    "spend": round(total_spend, 2),
                    "impressions": total_impressions,
                    "swipes": total_swipes,
                    "swipe_rate_pct": swipe_rate,
                    "cost_per_swipe": cps,
                    "video_views": total_video_views,
                },
                "timeseries": timeseries,
            }

    except httpx.RequestError as e:
        logger.error(f"Snapchat Ads performance request error: {e}")
        raise HTTPException(status_code=502, detail=f"Snapchat Ads API unreachable: {e}")


# ---------------------------------------------------------------------------
# GET /snapchat-ads/status
# ---------------------------------------------------------------------------
@router.get("/status")
async def snapchat_status(request: Request):
    """Return Snapchat Ads connection status for the workspace."""
    workspace_id = request.state.workspace_id
    access_token, ad_account_id = await _get_snap_creds(workspace_id)

    configured = bool(access_token and ad_account_id)
    logger.info(f"Snapchat Ads status check for workspace {workspace_id}: configured={configured}")

    return {
        "configured": configured,
        "access_token_set": bool(access_token),
        "ad_account_id_set": bool(ad_account_id),
    }
