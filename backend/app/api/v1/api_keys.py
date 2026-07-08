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
    meta_app_secret: Optional[str] = None       # optional — blank = keep existing
    meta_pixel_id: Optional[str] = None
    meta_ad_account_id: Optional[str] = None    # act_XXXXXXXXXX


class GoogleCredentials(BaseModel):
    google_client_id: str
    google_client_secret: Optional[str] = None  # optional — blank = keep existing
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

    shopify    = await _get_row(workspace_id, "shopify")
    meta       = await _get_row(workspace_id, "meta")
    google     = await _get_row(workspace_id, "google")
    razorpay   = await _get_row(workspace_id, "razorpay")
    whatsapp   = await _get_row(workspace_id, "whatsapp")
    shiprocket = await _get_row(workspace_id, "shiprocket")
    klaviyo    = await _get_row(workspace_id, "klaviyo")
    woocommerce= await _get_row(workspace_id, "woocommerce")

    return {
        "shopify": {
            "connected": bool(shopify and shopify["is_active"]),
            "store_url": shopify["shopify_store_url"] if shopify else None,
            "access_token": _mask(shopify["shopify_access_token"]) if shopify else None,
        } if shopify else {"connected": False},
        "meta": {
            "connected": bool(meta and meta["is_active"]),
            "app_id": meta["meta_app_id"] if meta else None,
            "pixel_id": meta["meta_pixel_id"] if meta else None,
            "ad_account_id": meta["meta_ad_account_id"] if meta else None,
        } if meta else {"connected": False},
        "google": {
            "connected": bool(google and google["is_active"]),
            "client_id": google["google_client_id"] if google else None,
            "customer_id": google["google_customer_id"] if google else None,
        } if google else {"connected": False},
        "razorpay": {
            "connected": bool(razorpay and razorpay["is_active"]),
            "key_id": razorpay["razorpay_key_id"] if razorpay else None,
        } if razorpay else {"connected": False},
        "whatsapp": {
            "connected": bool(whatsapp and whatsapp["is_active"]),
            "phone_number_id": whatsapp["whatsapp_phone_number_id"] if whatsapp else None,
        } if whatsapp else {"connected": False},
        "shiprocket": {
            "connected": bool(shiprocket and shiprocket["is_active"]),
            "email": shiprocket["shiprocket_email"] if shiprocket else None,
        } if shiprocket else {"connected": False},
        "klaviyo": {
            "connected": bool(klaviyo and klaviyo["is_active"]),
            "api_key": _mask(klaviyo["klaviyo_api_key"]) if klaviyo else None,
        } if klaviyo else {"connected": False},
        "woocommerce": {
            "connected": bool(woocommerce and woocommerce["is_active"]),
            "site_url": woocommerce["woo_site_url"] if woocommerce else None,
        } if woocommerce else {"connected": False},
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


# ── POST Razorpay ─────────────────────────────────────────────────────────────

class RazorpayCredentials(BaseModel):
    razorpay_key_id: str
    razorpay_key_secret: Optional[str] = None
    razorpay_webhook_secret: Optional[str] = None


@router.post("/razorpay")
async def save_razorpay_credentials(request: Request, body: RazorpayCredentials):
    """Save Razorpay credentials for the workspace."""
    workspace_id = request.state.workspace_id
    await execute(
        """
        INSERT INTO api_credentials (workspace_id, platform, razorpay_key_id, razorpay_key_secret, razorpay_webhook_secret, is_active)
        VALUES ($1, 'razorpay', $2, $3, $4, true)
        ON CONFLICT (workspace_id, platform) DO UPDATE SET
            razorpay_key_id        = EXCLUDED.razorpay_key_id,
            razorpay_key_secret    = COALESCE(NULLIF($3,''), api_credentials.razorpay_key_secret),
            razorpay_webhook_secret= COALESCE(NULLIF($4,''), api_credentials.razorpay_webhook_secret),
            is_active = true, updated_at = now()
        """,
        workspace_id, body.razorpay_key_id, body.razorpay_key_secret or "", body.razorpay_webhook_secret or "",
    )
    logger.info(f"Razorpay credentials saved for workspace {workspace_id}")
    return {"success": True, "platform": "razorpay"}


# ── POST WhatsApp ─────────────────────────────────────────────────────────────

class WhatsAppCredentials(BaseModel):
    whatsapp_phone_number_id: str
    whatsapp_access_token: Optional[str] = None
    whatsapp_verify_token: Optional[str] = None


@router.post("/whatsapp")
async def save_whatsapp_credentials(request: Request, body: WhatsAppCredentials):
    """Save WhatsApp Business API credentials for the workspace."""
    workspace_id = request.state.workspace_id
    await execute(
        """
        INSERT INTO api_credentials (workspace_id, platform, whatsapp_phone_number_id, whatsapp_access_token, whatsapp_verify_token, is_active)
        VALUES ($1, 'whatsapp', $2, $3, $4, true)
        ON CONFLICT (workspace_id, platform) DO UPDATE SET
            whatsapp_phone_number_id = EXCLUDED.whatsapp_phone_number_id,
            whatsapp_access_token    = COALESCE(NULLIF($3,''), api_credentials.whatsapp_access_token),
            whatsapp_verify_token    = COALESCE(NULLIF($4,''), api_credentials.whatsapp_verify_token),
            is_active = true, updated_at = now()
        """,
        workspace_id, body.whatsapp_phone_number_id, body.whatsapp_access_token or "", body.whatsapp_verify_token or "",
    )
    logger.info(f"WhatsApp credentials saved for workspace {workspace_id}")
    return {"success": True, "platform": "whatsapp"}


# ── POST Shiprocket ───────────────────────────────────────────────────────────

class ShiprocketCredentials(BaseModel):
    shiprocket_email: str
    shiprocket_password: Optional[str] = None


@router.post("/shiprocket")
async def save_shiprocket_credentials(request: Request, body: ShiprocketCredentials):
    """Save Shiprocket credentials for the workspace."""
    workspace_id = request.state.workspace_id
    await execute(
        """
        INSERT INTO api_credentials (workspace_id, platform, shiprocket_email, shiprocket_password, is_active)
        VALUES ($1, 'shiprocket', $2, $3, true)
        ON CONFLICT (workspace_id, platform) DO UPDATE SET
            shiprocket_email    = EXCLUDED.shiprocket_email,
            shiprocket_password = COALESCE(NULLIF($3,''), api_credentials.shiprocket_password),
            is_active = true, updated_at = now()
        """,
        workspace_id, body.shiprocket_email, body.shiprocket_password or "",
    )
    logger.info(f"Shiprocket credentials saved for workspace {workspace_id}")
    return {"success": True, "platform": "shiprocket"}


# ── POST Klaviyo ──────────────────────────────────────────────────────────────

class KlaviyoCredentials(BaseModel):
    klaviyo_api_key: str


@router.post("/klaviyo")
async def save_klaviyo_credentials(request: Request, body: KlaviyoCredentials):
    """Save Klaviyo API key for the workspace."""
    workspace_id = request.state.workspace_id
    await execute(
        """
        INSERT INTO api_credentials (workspace_id, platform, klaviyo_api_key, is_active)
        VALUES ($1, 'klaviyo', $2, true)
        ON CONFLICT (workspace_id, platform) DO UPDATE SET
            klaviyo_api_key = EXCLUDED.klaviyo_api_key,
            is_active = true, updated_at = now()
        """,
        workspace_id, body.klaviyo_api_key,
    )
    logger.info(f"Klaviyo credentials saved for workspace {workspace_id}")
    return {"success": True, "platform": "klaviyo"}


# ── DELETE — disconnect a platform ───────────────────────────────────────────

VALID_PLATFORMS = ("shopify", "meta", "google", "razorpay", "whatsapp", "shiprocket", "klaviyo", "woocommerce")

@router.delete("/{platform}")
async def disconnect_platform(request: Request, platform: str):
    """Disconnect a platform by marking credentials as inactive."""
    if platform not in VALID_PLATFORMS:
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
