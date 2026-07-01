"""
Google Search Console API Integration.
Fetches real organic search data: impressions, clicks, CTR, position by query/page.
"""

from fastapi import APIRouter, Request, HTTPException
from loguru import logger
import httpx, os, json
from datetime import date, timedelta
from typing import Optional
from ...core.database import fetch, fetchrow
from ...core.vault import get_token

router = APIRouter(prefix="/seo", tags=["seo"])

GSC_BASE = "https://searchconsole.googleapis.com/webmasters/v3"


async def _get_gsc_access_token(workspace_id: str) -> Optional[str]:
    """Get Google OAuth access token from vault, refresh if needed."""
    try:
        token_data = await get_token(workspace_id, "google")
        if not token_data:
            return None
        
        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        expires_at = token_data.get("expires_at", 0)
        
        # Check if expired (with 5 min buffer)
        import time
        if expires_at and time.time() > expires_at - 300 and refresh_token:
            # Refresh the token
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.post("https://oauth2.googleapis.com/token", data={
                    "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                    "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                    "refresh_token": refresh_token,
                    "grant_type": "refresh_token",
                })
                if r.status_code == 200:
                    new_tokens = r.json()
                    access_token = new_tokens["access_token"]
                    # Update vault
                    from ...core.vault import store_token
                    await store_token(workspace_id, "google", {
                        **token_data,
                        "access_token": access_token,
                        "expires_at": time.time() + new_tokens.get("expires_in", 3600)
                    })
        
        return access_token
    except Exception as e:
        logger.warning(f"GSC token error: {e}")
        return None


async def _get_site_url(workspace_id: str) -> Optional[str]:
    """Get the verified site URL for this workspace."""
    row = await fetchrow("""
        SELECT platform_account_id FROM integrations
        WHERE workspace_id = $1 AND platform = 'google_search_console' AND status = 'active'
        LIMIT 1
    """, workspace_id)
    return row["platform_account_id"] if row else None


@router.get("/summary")
async def get_seo_summary(
    request: Request,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    """Get GSC performance summary: clicks, impressions, CTR, position."""
    workspace_id = request.state.workspace_id
    today = date.today()
    sd = start_date or (today - timedelta(days=28)).isoformat()
    ed = end_date or today.isoformat()

    access_token = await _get_gsc_access_token(workspace_id)
    site_url = await _get_site_url(workspace_id)

    if access_token and site_url:
        try:
            payload = {
                "startDate": sd,
                "endDate": ed,
                "dimensions": [],
                "rowLimit": 1
            }
            async with httpx.AsyncClient(timeout=20) as client:
                r = await client.post(
                    f"{GSC_BASE}/sites/{site_url}/searchAnalytics/query",
                    headers={"Authorization": f"Bearer {access_token}"},
                    json=payload
                )
                if r.status_code == 200:
                    data = r.json()
                    rows = data.get("rows", [{}])
                    summary = rows[0] if rows else {}
                    return {
                        "source": "google_search_console",
                        "clicks": summary.get("clicks", 0),
                        "impressions": summary.get("impressions", 0),
                        "ctr": round(summary.get("ctr", 0) * 100, 2),
                        "position": round(summary.get("position", 0), 1),
                        "period": {"start": sd, "end": ed},
                        "site_url": site_url,
                    }
        except Exception as e:
            logger.error(f"GSC summary error: {e}")

    return {
        "source": "not_connected",
        "clicks": 0, "impressions": 0, "ctr": 0.0, "position": 0.0,
        "setup_required": True,
        "message": "Connect Google Search Console via Settings → Integrations → Google",
        "setup_steps": [
            "1. Go to search.google.com/search-console and verify your domain",
            "2. Connect Google in Settings → Integrations",
            "3. SEO data will appear here automatically"
        ]
    }


@router.get("/queries")
async def get_top_queries(
    request: Request,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 25,
):
    """Get top search queries by clicks."""
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
                    return {
                        "queries": [{
                            "query": r["keys"][0],
                            "clicks": r["clicks"],
                            "impressions": r["impressions"],
                            "ctr": round(r["ctr"] * 100, 2),
                            "position": round(r["position"], 1)
                        } for r in rows],
                        "source": "google_search_console"
                    }
        except Exception as e:
            logger.error(f"GSC queries error: {e}")

    return {"queries": [], "source": "not_connected"}


@router.get("/pages")
async def get_top_pages(
    request: Request,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 25,
):
    """Get top pages by organic clicks."""
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
                    return {
                        "pages": [{
                            "page": r["keys"][0],
                            "clicks": r["clicks"],
                            "impressions": r["impressions"],
                            "ctr": round(r["ctr"] * 100, 2),
                            "position": round(r["position"], 1)
                        } for r in rows],
                        "source": "google_search_console"
                    }
        except Exception as e:
            logger.error(f"GSC pages error: {e}")

    return {"pages": [], "source": "not_connected"}


@router.get("/sites")
async def list_sites(request: Request):
    """List all verified GSC sites for this Google account."""
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
