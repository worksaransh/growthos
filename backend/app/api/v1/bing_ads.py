"""
Bing / Microsoft Advertising Integration — Campaigns, Performance, Status
"""

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
from loguru import logger
import httpx, os

from ...core.database import fetchrow, execute, fetch

router = APIRouter(prefix="/bing-ads", tags=["bing_ads"])

# Microsoft Advertising REST API base (v13)
BING_ADS_BASE = "https://reporting.api.bingads.microsoft.com/Api/Advertiser/Reporting/V13"
BING_CAMPAIGN_MGMT_BASE = "https://campaign.api.bingads.microsoft.com/Api/Advertiser/CampaignManagement/V13"
BING_AUTH_BASE = "https://login.microsoftonline.com/common/oauth2/v2.0/token"


async def _get_bing_creds(workspace_id) -> tuple[str, str, str]:
    """Fetch bing_client_id, bing_client_secret, bing_developer_token from api_credentials."""
    row = await fetchrow(
        "SELECT bing_client_id, bing_client_secret, bing_developer_token FROM api_credentials WHERE workspace_id = $1 LIMIT 1",
        workspace_id,
    )
    client_id = (row or {}).get("bing_client_id") or ""
    client_secret = (row or {}).get("bing_client_secret") or ""
    developer_token = (row or {}).get("bing_developer_token") or ""
    return client_id, client_secret, developer_token


async def _get_bing_access_token(client_id: str, client_secret: str) -> Optional[str]:
    """Obtain a client-credentials access token for Microsoft Advertising API."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                BING_AUTH_BASE,
                data={
                    "grant_type": "client_credentials",
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "scope": "https://ads.microsoft.com/.default",
                },
            )
            if r.status_code == 200:
                return r.json().get("access_token")
            logger.error(f"Bing Ads token fetch failed: {r.status_code} {r.text}")
            return None
    except httpx.RequestError as e:
        logger.error(f"Bing Ads token request error: {e}")
        return None


def _bing_headers(access_token: str, developer_token: str) -> dict:
    return {
        "Authorization": f"Bearer {access_token}",
        "DeveloperToken": developer_token,
        "Content-Type": "application/json",
    }


# ---------------------------------------------------------------------------
# GET /bing-ads/campaigns
# ---------------------------------------------------------------------------
@router.get("/campaigns")
async def bing_campaigns(request: Request, customer_id: Optional[str] = None, account_id: Optional[str] = None):
    """Fetch Microsoft Advertising campaigns via Campaign Management API."""
    workspace_id = request.state.workspace_id
    client_id, client_secret, developer_token = await _get_bing_creds(workspace_id)

    if not (client_id and client_secret and developer_token):
        logger.info(f"Bing Ads not configured for workspace {workspace_id}")
        return {"status": "not_configured", "message": "Bing Ads client_id, client_secret, and developer_token not set for this workspace"}

    access_token = await _get_bing_access_token(client_id, client_secret)
    if not access_token:
        return {"status": "error", "message": "Failed to obtain Bing Ads access token — check client credentials"}

    headers = _bing_headers(access_token, developer_token)
    if customer_id:
        headers["CustomerId"] = customer_id
    if account_id:
        headers["CustomerAccountId"] = account_id

    # Use the REST-style JSON endpoint available in Bing Ads API v13
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(
                f"{BING_CAMPAIGN_MGMT_BASE}/GetCampaignsByAccountId",
                headers=headers,
                json={"AccountId": account_id or 0, "CampaignType": "Search Shopping DynamicSearchAds"},
            )
            if r.status_code == 401:
                raise HTTPException(status_code=401, detail="Bing Ads access token invalid or expired")
            if r.status_code != 200:
                logger.error(f"Bing Ads campaigns API error: {r.status_code} {r.text}")
                raise HTTPException(status_code=r.status_code, detail="Bing Ads API error")

            data = r.json()
            campaigns = data.get("Campaigns", [])
            logger.info(f"Bing Ads campaigns fetched for workspace {workspace_id}: {len(campaigns)} campaigns")
            return {"status": "ok", "campaigns": campaigns, "total": len(campaigns)}

    except httpx.RequestError as e:
        logger.error(f"Bing Ads campaigns request error: {e}")
        raise HTTPException(status_code=502, detail=f"Bing Ads API unreachable: {e}")


# ---------------------------------------------------------------------------
# GET /bing-ads/performance
# ---------------------------------------------------------------------------
@router.get("/performance")
async def bing_performance(
    request: Request,
    account_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    """Aggregate Microsoft Advertising performance stats: spend, impressions, clicks, CTR."""
    workspace_id = request.state.workspace_id
    client_id, client_secret, developer_token = await _get_bing_creds(workspace_id)

    if not (client_id and client_secret and developer_token):
        logger.info(f"Bing Ads not configured for workspace {workspace_id}")
        return {"status": "not_configured", "message": "Bing Ads credentials not set for this workspace"}

    access_token = await _get_bing_access_token(client_id, client_secret)
    if not access_token:
        return {"status": "error", "message": "Failed to obtain Bing Ads access token — check client credentials"}

    from datetime import datetime, timedelta
    if not end_date:
        end_date = datetime.utcnow().strftime("%Y-%m-%d")
    if not start_date:
        start_date = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")

    # Parse dates for Bing date format
    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="start_date and end_date must be in YYYY-MM-DD format")

    headers = _bing_headers(access_token, developer_token)

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            # Submit a reporting job
            submit_r = await client.post(
                f"{BING_ADS_BASE}/SubmitGenerateReport",
                headers=headers,
                json={
                    "ReportRequest": {
                        "__type": "AccountPerformanceReportRequest#https://bingads.microsoft.com/Reporting/v13",
                        "Format": "Csv",
                        "ReportName": "GrowthOS Performance Report",
                        "ReturnOnlyCompleteData": False,
                        "Aggregation": "Daily",
                        "Columns": ["AccountId", "TimePeriod", "Impressions", "Clicks", "Spend", "Ctr", "AverageCpc"],
                        "Scope": {"AccountIds": [account_id] if account_id else []},
                        "Time": {
                            "CustomDateRangeStart": {
                                "Day": start_dt.day,
                                "Month": start_dt.month,
                                "Year": start_dt.year,
                            },
                            "CustomDateRangeEnd": {
                                "Day": end_dt.day,
                                "Month": end_dt.month,
                                "Year": end_dt.year,
                            },
                        },
                    }
                },
            )

            if submit_r.status_code != 200:
                logger.error(f"Bing Ads SubmitGenerateReport error: {submit_r.status_code} {submit_r.text}")
                raise HTTPException(status_code=submit_r.status_code, detail="Bing Ads reporting API error")

            report_id = submit_r.json().get("ReportRequestId")
            logger.info(f"Bing Ads reporting job submitted for workspace {workspace_id}: report_id={report_id}")

            # Return the report_id so the client can poll for results
            return {
                "status": "pending",
                "report_request_id": report_id,
                "date_range": {"start_date": start_date, "end_date": end_date},
                "message": "Report job submitted. Poll GET /bing-ads/performance?report_id={report_id} to retrieve results.",
            }

    except httpx.RequestError as e:
        logger.error(f"Bing Ads performance request error: {e}")
        raise HTTPException(status_code=502, detail=f"Bing Ads API unreachable: {e}")


# ---------------------------------------------------------------------------
# GET /bing-ads/status
# ---------------------------------------------------------------------------
@router.get("/status")
async def bing_status(request: Request):
    """Return Bing Ads connection status for the workspace."""
    workspace_id = request.state.workspace_id
    client_id, client_secret, developer_token = await _get_bing_creds(workspace_id)

    configured = bool(client_id and client_secret and developer_token)
    logger.info(f"Bing Ads status check for workspace {workspace_id}: configured={configured}")

    return {
        "configured": configured,
        "client_id_set": bool(client_id),
        "client_secret_set": bool(client_secret),
        "developer_token_set": bool(developer_token),
    }
