"""
TikTok Ads Integration — Campaigns, Performance, Status
"""

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
from loguru import logger
import httpx, os

from ...core.database import fetchrow, execute, fetch

router = APIRouter(prefix="/tiktok-ads", tags=["tiktok_ads"])

TIKTOK_ADS_BASE = "https://business-api.tiktok.com/open_api/v1.3"


def _tiktok_headers(access_token: str) -> dict:
    return {
        "Access-Token": access_token,
        "Content-Type": "application/json",
    }


async def _get_tiktok_creds(workspace_id) -> tuple[str, str]:
    """Fetch TikTok access_token and advertiser_id from api_credentials."""
    row = await fetchrow(
        "SELECT tiktok_access_token, tiktok_advertiser_id FROM api_credentials WHERE workspace_id = $1 LIMIT 1",
        workspace_id,
    )
    access_token = (row or {}).get("tiktok_access_token") or ""
    advertiser_id = (row or {}).get("tiktok_advertiser_id") or ""
    return access_token, advertiser_id


# ---------------------------------------------------------------------------
# GET /tiktok-ads/campaigns
# ---------------------------------------------------------------------------
@router.get("/campaigns")
async def tiktok_campaigns(request: Request):
    """Fetch campaigns from TikTok Ads API."""
    workspace_id = request.state.workspace_id
    access_token, advertiser_id = await _get_tiktok_creds(workspace_id)

    if not (access_token and advertiser_id):
        logger.info(f"TikTok Ads not configured for workspace {workspace_id}")
        return {"status": "not_configured", "message": "TikTok Ads access_token and advertiser_id not set for this workspace"}

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get(
                f"{TIKTOK_ADS_BASE}/campaign/get/",
                headers=_tiktok_headers(access_token),
                params={
                    "advertiser_id": advertiser_id,
                    "fields": '["campaign_id","campaign_name","status","budget","objective_type","create_time"]',
                    "page_size": 100,
                },
            )
            if r.status_code != 200:
                logger.error(f"TikTok Ads campaigns API error: {r.status_code} {r.text}")
                raise HTTPException(status_code=r.status_code, detail="TikTok Ads API error")

            data = r.json()
            if data.get("code") != 0:
                msg = data.get("message", "Unknown TikTok Ads error")
                logger.error(f"TikTok Ads campaigns API non-zero code: {data.get('code')} — {msg}")
                return {"status": "error", "message": msg, "code": data.get("code")}

            campaigns = (data.get("data") or {}).get("list", [])
            logger.info(f"TikTok Ads campaigns fetched for workspace {workspace_id}: {len(campaigns)} campaigns")
            return {"status": "ok", "campaigns": campaigns, "total": len(campaigns)}

    except httpx.RequestError as e:
        logger.error(f"TikTok Ads campaigns request error: {e}")
        raise HTTPException(status_code=502, detail=f"TikTok Ads API unreachable: {e}")


# ---------------------------------------------------------------------------
# GET /tiktok-ads/performance
# ---------------------------------------------------------------------------
@router.get("/performance")
async def tiktok_performance(
    request: Request,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    """Aggregate TikTok Ads performance: spend, impressions, clicks, CTR."""
    workspace_id = request.state.workspace_id
    access_token, advertiser_id = await _get_tiktok_creds(workspace_id)

    if not (access_token and advertiser_id):
        logger.info(f"TikTok Ads not configured for workspace {workspace_id}")
        return {"status": "not_configured", "message": "TikTok Ads access_token and advertiser_id not set for this workspace"}

    from datetime import datetime, timedelta
    if not end_date:
        end_date = datetime.utcnow().strftime("%Y-%m-%d")
    if not start_date:
        start_date = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get(
                f"{TIKTOK_ADS_BASE}/report/integrated/get/",
                headers=_tiktok_headers(access_token),
                params={
                    "advertiser_id": advertiser_id,
                    "report_type": "BASIC",
                    "dimensions": '["stat_time_day"]',
                    "metrics": '["spend","impressions","clicks","ctr","cpc","cpm","reach"]',
                    "start_date": start_date,
                    "end_date": end_date,
                    "page_size": 100,
                },
            )
            if r.status_code != 200:
                logger.error(f"TikTok Ads performance API error: {r.status_code} {r.text}")
                raise HTTPException(status_code=r.status_code, detail="TikTok Ads API error")

            data = r.json()
            if data.get("code") != 0:
                msg = data.get("message", "Unknown TikTok Ads error")
                logger.error(f"TikTok Ads performance API non-zero code: {data.get('code')} — {msg}")
                return {"status": "error", "message": msg, "code": data.get("code")}

            rows = (data.get("data") or {}).get("list", [])

            total_spend = 0.0
            total_impressions = 0
            total_clicks = 0
            total_reach = 0

            for row_item in rows:
                metrics = row_item.get("metrics", {})
                total_spend += float(metrics.get("spend", 0) or 0)
                total_impressions += int(metrics.get("impressions", 0) or 0)
                total_clicks += int(metrics.get("clicks", 0) or 0)
                total_reach += int(metrics.get("reach", 0) or 0)

            ctr = round(total_clicks / total_impressions * 100, 4) if total_impressions else 0.0
            cpc = round(total_spend / total_clicks, 4) if total_clicks else 0.0

            logger.info(
                f"TikTok Ads performance for workspace {workspace_id}: "
                f"spend={total_spend}, impressions={total_impressions}, clicks={total_clicks}, CTR={ctr}%"
            )

            return {
                "status": "ok",
                "date_range": {"start_date": start_date, "end_date": end_date},
                "aggregated": {
                    "spend": round(total_spend, 2),
                    "impressions": total_impressions,
                    "clicks": total_clicks,
                    "ctr_pct": ctr,
                    "cpc": cpc,
                    "reach": total_reach,
                },
                "daily": rows,
            }

    except httpx.RequestError as e:
        logger.error(f"TikTok Ads performance request error: {e}")
        raise HTTPException(status_code=502, detail=f"TikTok Ads API unreachable: {e}")


# ---------------------------------------------------------------------------
# GET /tiktok-ads/status
# ---------------------------------------------------------------------------
@router.get("/status")
async def tiktok_status(request: Request):
    """Return TikTok Ads connection status for the workspace."""
    workspace_id = request.state.workspace_id
    access_token, advertiser_id = await _get_tiktok_creds(workspace_id)

    configured = bool(access_token and advertiser_id)
    logger.info(f"TikTok Ads status check for workspace {workspace_id}: configured={configured}")

    return {
        "configured": configured,
        "access_token_set": bool(access_token),
        "advertiser_id_set": bool(advertiser_id),
    }
