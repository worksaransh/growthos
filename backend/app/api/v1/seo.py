"""
Google Search Console API Integration.
"""
from fastapi import APIRouter, Request
from loguru import logger
import httpx, os
from datetime import date, timedelta
from typing import Optional
from ...core.database import fetch, fetchrow
from ...core.vault import get_token

router = APIRouter(prefix="/seo", tags=["seo"])
GSC_BASE = "https://searchconsole.googleapis.com/webmasters/v3"


async def _get_gsc_access_token(workspace_id: str) -> Optional[str]:
    try:
        row = await fetchrow(
            "SELECT vault_token_id FROM integrations WHERE workspace_id=$1 AND platform='google_search_console' AND status='active' LIMIT 1",
            workspace_id
        )
        if not row or not row["vault_token_id"]:
            return None
        raw = await get_token(row["vault_token_id"])
        if not raw:
            return None
        parts = raw.split("|||")
        access_token = parts[0]
        refresh_token = parts[1] if len(parts) > 1 else None
        if refresh_token:
            try:
                async with httpx.AsyncClient(timeout=15) as client:
                    r = await client.post("https://oauth2.googleapis.com/token", data={
                        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                        "refresh_token": refresh_token,
                        "grant_type": "refresh_token",
                    })
                    if r.status_code == 200:
                        access_token = r.json()["access_token"]
            except Exception as e:
                logger.warning(f"GSC refresh skipped: {e}")
        return access_token
    except Exception as e:
        logger.warning(f"GSC token error: {e}")
        return None


async def _get_site_url(workspace_id: str) -> Optional[str]:
    row = await fetchrow(
        "SELECT platform_account_id FROM integrations WHERE workspace_id=$1 AND platform='google_search_console' AND status='active' LIMIT 1",
        workspace_id
    )
    return row["platform_account_id"] if row else None


@router.get("/summary")
async def get_seo_summary(request: Request, start_date: Optional[str] = None, end_date: Optional[str] = None):
    workspace_id = request.state.workspace_id
    today = date.today()
    sd = start_date or (today - timedelta(days=28)).isoformat()
    ed = end_date or today.isoformat()
    access_token = await _get_gsc_access_token(workspace_id)
    site_url = await _get_site_url(workspace_id)
    if access_token and site_url:
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                r = await client.post(
                    f"{GSC_BASE}/sites/{site_url}/searchAnalytics/query",
                    headers={"Authorization": f"Bearer {access_token}"},
                    json={"startDate": sd, "endDate": ed, "dimensions": [], "rowLimit": 1}
                )
                if r.status_code == 200:
                    rows = r.json().get("rows", [{}])
                    s = rows[0] if rows else {}
                    return {
                        "source": "google_search_console",
                        "clicks": s.get("clicks", 0),
                        "impressions": s.get("impressions", 0),
                        "ctr": round(s.get("ctr", 0) * 100, 2),
                        "position": round(s.get("position", 0), 1),
                        "period": {"start": sd, "end": ed},
                        "site_url": site_url,
                    }
        except Exception as e:
            logger.error(f"GSC summary error: {e}")
    return {"source": "not_connected", "clicks": 0, "impressions": 0, "ctr": 0.0, "position": 0.0, "setup_required": True}


@router.get("/queries")
async def get_top_queries(request: Request, start_date: Optional[str] = None, end_date: Optional[str] = None, limit: int = 25):
    workspace_id = request.state.workspace_id
    today = date.today()
    sd = start_date or (today - timedelta(days=28)).isoformat()
    ed = end_date or today.isoformat()
    access_token = await _get_gsc_access_token(workspace_id)
    site_url = await _get_site_url(workspace_id)
    if access_token and site_url:
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                r = await client.post(
                    f"{GSC_BASE}/sites/{site_url}/searchAnalytics/query",
                    headers={"Authorization": f"Bearer {access_token}"},
                    json={"startDate": sd, "endDate": ed, "dimensions": ["query"], "rowLimit": limit, "orderBy": [{"fieldName": "clicks", "sortOrder": "DESCENDING"}]}
                )
                if r.status_code == 200:
                    rows = r.json().get("rows", [])
                    return {"queries": [{"query": row["keys"][0], "clicks": row["clicks"], "impressions": row["impressions"], "ctr": round(row["ctr"]*100, 2), "position": round(row["position"], 1)} for row in rows], "source": "google_search_console"}
        except Exception as e:
            logger.error(f"GSC queries error: {e}")
    return {"queries": [], "source": "not_connected"}


@router.get("/pages")
async def get_top_pages(request: Request, start_date: Optional[str] = None, end_date: Optional[str] = None, limit: int = 25):
    workspace_id = request.state.workspace_id
    today = date.today()
    sd = start_date or (today - timedelta(days=28)).isoformat()
    ed = end_date or today.isoformat()
    access_token = await _get_gsc_access_token(workspace_id)
    site_url = await _get_site_url(workspace_id)
    if access_token and site_url:
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                r = await client.post(
                    f"{GSC_BASE}/sites/{site_url}/searchAnalytics/query",
                    headers={"Authorization": f"Bearer {access_token}"},
                    json={"startDate": sd, "endDate": ed, "dimensions": ["page"], "rowLimit": limit, "orderBy": [{"fieldName": "clicks", "sortOrder": "DESCENDING"}]}
                )
                if r.status_code == 200:
                    rows = r.json().get("rows", [])
                    return {"pages": [{"page": row["keys"][0], "clicks": row["clicks"], "impressions": row["impressions"], "ctr": round(row["ctr"]*100, 2), "position": round(row["position"], 1)} for row in rows], "source": "google_search_console"}
        except Exception as e:
            logger.error(f"GSC pages error: {e}")
    return {"pages": [], "source": "not_connected"}


@router.get("/sites")
async def list_sites(request: Request):
    workspace_id = request.state.workspace_id
    access_token = await _get_gsc_access_token(workspace_id)
    if not access_token:
        return {"sites": [], "connected": False}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f"{GSC_BASE}/sites",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if r.status_code == 200:
                sites = [s["siteUrl"] for s in r.json().get("siteEntry", [])]
                return {"sites": sites, "connected": True, "count": len(sites)}
    except Exception as e:
        logger.error(f"GSC sites error: {e}")
    return {"sites": [], "connected": False}
