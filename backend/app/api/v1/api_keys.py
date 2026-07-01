"""
API Credentials endpoints — /api/v1/settings/api-keys
Allows admins to save platform credentials (Shopify, Meta, Google) via the UI.
Credentials are stored in the api_credentials table (per workspace).
"""

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
from loguru import logger
from ...core.database import fetchrow, execute

router = APIRouter(prefix="/settings/api-keys", tags=["api-keys"])


# ── Pydantic models ──────────────────────────────────────────────────────────

class ShopifyCredentials(BaseModel):
    shopify_store_url: str           # e.g. mybrand.myshopify.com
    shopify_api_key: Optional[str] = None
    shopify_api_secret: Optional[str] = None
    shopify_access_token: Optional[str] = None  # Private App token


class MetaCredentials(BaseModel):
    meta_app_id: str
    meta_app_secret: str
    meta_pixel_id: Optional[str] = None
    meta_ad_account_id: Optional[str] = None    # act_XXXXXXXXXX


class GoogleCredentials(BaseModel):
    google_client_id: str
    google_client_secret: str
    google_developer_token: str
    google_customer_id: Optional[str] = None    # 10-digit account ID


# ── Helpers ───────────────────────────────────────────────────────────────────

def _mask(value: Optional[str]) -> Optional[str]:
    """Return masked version of a secret — shows last 4 chars only."""
    if not value:
        return None
    if len(value) <= 8:
        return "••••••••"
    return "••••••••" + value[-4:]


async def _get_row(workspace_id: str, platform: str):
    return await fetchrow(
        "SELECT * FROM api_credentials WHERE workspace_id = $1 AND platform = $2",
        workspace_id, platform,
    )


# ── GET — load all saved credentials (masked) ────────────────────────────────

@router.get("")
async def get_api_keys(request: Request):
    """
    Return saved API credentials for all platforms (secrets masked).
    Returns None for each platform that has no saved credentials.
    """
    workspace_id = request.state.workspace_id

    shopify = await _get_row(workspace_id, "shopify")
    meta    = await _get_row(workspace_id, "meta")
    google  = await _get_row(workspace_id, "google")

    return {
        "shopify": {
            "connected": bool(shopify and shopify["is_active"]),
            "store_url": shopify["shopify_store_url"] if shopify else None,
            "api_key":   _mask(shopify["shopify_api_key"]) if shopify else None,
            "api_secret": _mask(shopify["shopify_api_secret"]) if shopify else None,
            "access_token": _mask(shopify["shopify_access_token"]) if shopify else None,
        } if shopify else {"connected": False},
        "meta": {
            "connected": bool(meta and meta["is_active"]),
            "app_id": meta["meta_app_id"] if meta else None,
            "app_secret": _mask(meta["meta_app_secret"]) if meta else None,
            "pixel_id": meta["meta_pixel_id"] if meta else None,
            "ad_account_id": meta["meta_ad_account_id"] if meta else None,
        } if meta else {"connected": False},
        "google": {
            "connected": bool(google and google["is_active"]),
            "client_id": google["google_client_id"] if google else None,
            "client_secret": _mask(google["google_client_secret"]) if google else None,
            "developer_token": _mask(google["google_developer_token"]) if google else None,
            "customer_id": google["google_customer_id"] if google else None,
        } if google else {"connected": False},
    }


# ── POST Shopify ─────────────────────────────────────────────────────────────

@router.post("/shopify")
async def save_shopify_credentials(request: Request, body: ShopifyCredentials):
    """Save Shopify API credentials for the workspace."""
    workspace_id = request.state.workspace_id

    # Normalize store URL
    store_url = body.shopify_store_url.strip().replace("https://", "").replace("http://", "").rstrip("/")
    if not store_url.endswith(".myshopify.com"):
        store_url = f"{store_url}.myshopify.com"

    await execute(
        """
        INSERT INTO api_credentials (
            workspace_id, platform,
            shopify_store_url, shopify_api_key, shopify_api_secret, shopify_access_token,
            is_active
        )
        VALUES ($1, 'shopify', $2, $3, $4, $5, true)
        ON CONFLICT (workspace_id, platform) DO UPDATE SET
            shopify_store_url    = EXCLUDED.shopify_store_url,
            shopify_api_key      = COALESCE(NULLIF($3, ''), api_credentials.shopify_api_key),
            shopify_api_secret   = COALESCE(NULLIF($4, ''), api_credentials.shopify_api_secret),
            shopify_access_token = COALESCE(NULLIF($5, ''), api_credentials.shopify_access_token),
            is_active            = true,
            updated_at           = now()
        """,
        workspace_id,
        store_url,
        body.shopify_api_key or "",
        body.shopify_api_secret or "",
        body.shopify_access_token or "",
    )
    logger.info(f"Shopify credentials saved for workspace {workspace_id}")
    return {"success": True, "platform": "shopify", "store_url": store_url}


# ── POST Meta ────────────────────────────────────────────────────────────────

@router.post("/meta")
async def save_meta_credentials(request: Request, body: MetaCredentials):
    """Save Meta Ads API credentials for the workspace."""
    workspace_id = request.state.workspace_id

    await execute(
        """
        INSERT INTO api_credentials (
            workspace_id, platform,
            meta_app_id, meta_app_secret, meta_pixel_id, meta_ad_account_id,
            is_active
        )
        VALUES ($1, 'meta', $2, $3, $4, $5, true)
        ON CONFLICT (workspace_id, platform) DO UPDATE SET
            meta_app_id        = EXCLUDED.meta_app_id,
            meta_app_secret    = COALESCE(NULLIF($3, ''), api_credentials.meta_app_secret),
            meta_pixel_id      = COALESCE(NULLIF($4, ''), api_credentials.meta_pixel_id),
            meta_ad_account_id = COALESCE(NULLIF($5, ''), api_credentials.meta_ad_account_id),
            is_active          = true,
            updated_at         = now()
        """,
        workspace_id,
        body.meta_app_id,
        body.meta_app_secret or "",
        body.meta_pixel_id or "",
        body.meta_ad_account_id or "",
    )
    logger.info(f"Meta credentials saved for workspace {workspace_id}")
    return {"success": True, "platform": "meta"}


# ── POST Google ──────────────────────────────────────────────────────────────

@router.post("/google")
async def save_google_credentials(request: Request, body: GoogleCredentials):
    """Save Google Ads API credentials for the workspace."""
    workspace_id = request.state.workspace_id

    await execute(
        """
        INSERT INTO api_credentials (
            workspace_id, platform,
            google_client_id, google_client_secret, google_developer_token, google_customer_id,
            is_active
        )
        VALUES ($1, 'google', $2, $3, $4, $5, true)
        ON CONFLICT (workspace_id, platform) DO UPDATE SET
            google_client_id       = EXCLUDED.google_client_id,
            google_client_secret   = COALESCE(NULLIF($3, ''), api_credentials.google_client_secret),
            google_developer_token = COALESCE(NULLIF($4, ''), api_credentials.google_developer_token),
            google_customer_id     = COALESCE(NULLIF($5, ''), api_credentials.google_customer_id),
            is_active              = true,
            updated_at             = now()
        """,
        workspace_id,
        body.google_client_id,
        body.google_client_secret or "",
        body.google_developer_token or "",
        body.google_customer_id or "",
    )
    logger.info(f"Google credentials saved for workspace {workspace_id}")
    return {"success": True, "platform": "google"}


# ── DELETE — disconnect a platform ───────────────────────────────────────────

@router.delete("/{platform}")
async def disconnect_platform(request: Request, platform: str):
    """Disconnect a platform by marking credentials as inactive."""
    if platform not in ("shopify", "meta", "google"):
        raise HTTPException(status_code=400, detail="Invalid platform")

    workspace_id = request.state.workspace_id
    await execute(
        "UPDATE api_credentials SET is_active = false, updated_at = now() WHERE workspace_id = $1 AND platform = $2",
        workspace_id, platform,
    )
    logger.info(f"{platform} disconnected for workspace {workspace_id}")
    return {"success": True, "platform": platform, "connected": False}


# ── GET raw credentials (for backend use, not exposed in UI) ─────────────────

async def get_platform_credentials(workspace_id: str, platform: str) -> dict:
    """
    Internal helper — returns unmasked credentials for backend use.
    Used by integrations/oauth endpoints to read stored API keys.
    """
    row = await _get_row(workspace_id, platform)
    if not row or not row["is_active"]:
        return {}
    return dict(row)
