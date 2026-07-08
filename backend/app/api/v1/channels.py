"""
channels.py — Channels API.

A channel = one connected platform account (Shopify store, Meta ad account, etc.)
under a Commerce Account. Replaces the old per-workspace integration assumptions.

Endpoints:
    POST   /channels                    create channel under a commerce account
    GET    /channels                    list channels (filter ?account_id=)
    GET    /channels/{channel_id}       get channel detail + health
    PATCH  /channels/{channel_id}       update channel settings
    DELETE /channels/{channel_id}       soft-delete (disconnect)

    POST   /channels/{channel_id}/connect/shopify   start Shopify OAuth
    POST   /channels/{channel_id}/connect/meta       start Meta OAuth
    POST   /channels/{channel_id}/connect/google     start Google OAuth
    POST   /channels/{channel_id}/health-check       trigger health check
    POST   /channels/{channel_id}/sync               enqueue a sync job
    GET    /channels/{channel_id}/sync-history       list sync history
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from ...core.auth import get_current_user, get_current_workspace
from ...core.config import settings as app_settings
from ...core.database import execute, fetch, fetchrow, fetchval, DB_AVAILABLE

router = APIRouter(prefix="/channels", tags=["channels"])

VALID_CHANNEL_TYPES = {
    "shopify", "woocommerce", "amazon",
    "meta_ads", "google_ads", "tiktok_ads",
    "google_analytics", "stripe", "razorpay",
    "whatsapp", "klaviyo", "mailchimp", "custom",
}


def _require_db():
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")


async def _get_channel_workspace(channel_id: str, workspace_id: str):
    """Verify channel belongs to workspace; returns channel row."""
    row = await fetchrow(
        """
        SELECT ch.*, ca.bu_id, bu.workspace_id
        FROM channels ch
        JOIN commerce_accounts ca ON ca.id = ch.commerce_account_id
        JOIN business_units bu ON bu.id = ca.bu_id
        WHERE ch.id = $1 AND bu.workspace_id = $2 AND ch.deleted_at IS NULL
        """,
        channel_id, workspace_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Channel not found or access denied")
    return row


async def _require_workspace_admin(workspace_id: str, user_id: str):
    role = await fetchval(
        "SELECT role FROM workspace_members WHERE workspace_id=$1 AND user_id=$2",
        workspace_id, user_id,
    )
    if role not in ("owner", "super_admin", "admin"):
        raise HTTPException(status_code=403, detail="Workspace admin access required")
    return role


# ── Models ────────────────────────────────────────────────────────────────────

class CreateChannelRequest(BaseModel):
    commerce_account_id: str
    channel_type: str
    display_name: str = Field(..., min_length=1, max_length=120)
    settings: dict = {}


class UpdateChannelRequest(BaseModel):
    display_name: Optional[str] = None
    settings: Optional[dict] = None


class ShopifyConnectRequest(BaseModel):
    store_url: str  # e.g. mystore.myshopify.com


class SyncRequest(BaseModel):
    data_types: List[str] = ["orders", "products", "customers"]
    date_from: Optional[str] = None


# ── Channel CRUD ──────────────────────────────────────────────────────────────

@router.post("", status_code=201)
async def create_channel(
    body: CreateChannelRequest,
    user_id: str = Depends(get_current_user),
    workspace_id: str = Depends(get_current_workspace),
):
    _require_db()
    await _require_workspace_admin(workspace_id, user_id)

    if body.channel_type not in VALID_CHANNEL_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid channel type. Valid: {sorted(VALID_CHANNEL_TYPES)}")

    # Verify commerce account belongs to workspace
    ca = await fetchrow(
        """
        SELECT ca.id FROM commerce_accounts ca
        JOIN business_units bu ON bu.id = ca.bu_id
        WHERE ca.id = $1 AND bu.workspace_id = $2 AND ca.deleted_at IS NULL
        """,
        body.commerce_account_id, workspace_id,
    )
    if not ca:
        raise HTTPException(status_code=404, detail="Commerce account not found")

    channel_id = await fetchval(
        """
        INSERT INTO channels
            (commerce_account_id, channel_type, display_name, status, settings, created_by)
        VALUES ($1, $2::channel_type, $3, 'pending', $4, $5)
        RETURNING id::text
        """,
        body.commerce_account_id, body.channel_type, body.display_name,
        body.settings or {}, user_id,
    )
    return {"id": channel_id, "channel_type": body.channel_type, "display_name": body.display_name}


@router.get("")
async def list_channels(
    account_id: Optional[str] = Query(None),
    channel_type: Optional[str] = Query(None),
    user_id: str = Depends(get_current_user),
    workspace_id: str = Depends(get_current_workspace),
):
    _require_db()

    base_where = "bu.workspace_id = $1 AND ch.deleted_at IS NULL"
    params: list = [workspace_id]
    idx = 2

    if account_id:
        base_where += f" AND ch.commerce_account_id = ${idx}"
        params.append(account_id)
        idx += 1
    if channel_type:
        base_where += f" AND ch.channel_type = ${idx}::channel_type"
        params.append(channel_type)
        idx += 1

    rows = await fetch(
        f"""
        SELECT ch.*, ca.name AS account_name, bu.name AS bu_name
        FROM channels ch
        JOIN commerce_accounts ca ON ca.id = ch.commerce_account_id
        JOIN business_units bu ON bu.id = ca.bu_id
        WHERE {base_where}
        ORDER BY ch.created_at ASC
        """,
        *params,
    )
    return [dict(r) for r in rows]


@router.get("/{channel_id}")
async def get_channel(
    channel_id: str,
    user_id: str = Depends(get_current_user),
    workspace_id: str = Depends(get_current_workspace),
):
    _require_db()
    row = await _get_channel_workspace(channel_id, workspace_id)
    return dict(row)


@router.patch("/{channel_id}")
async def update_channel(
    channel_id: str,
    body: UpdateChannelRequest,
    user_id: str = Depends(get_current_user),
    workspace_id: str = Depends(get_current_workspace),
):
    _require_db()
    await _require_workspace_admin(workspace_id, user_id)
    await _get_channel_workspace(channel_id, workspace_id)

    updates = body.model_dump(exclude_none=True)
    if not updates:
        return {"message": "Nothing to update"}

    set_clauses = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates))
    values = [channel_id] + list(updates.values())
    await execute(
        f"UPDATE channels SET {set_clauses}, updated_at=now() WHERE id=$1", *values
    )
    return {"message": "Channel updated"}


@router.delete("/{channel_id}")
async def disconnect_channel(
    channel_id: str,
    user_id: str = Depends(get_current_user),
    workspace_id: str = Depends(get_current_workspace),
):
    _require_db()
    await _require_workspace_admin(workspace_id, user_id)
    await _get_channel_workspace(channel_id, workspace_id)

    await execute(
        "UPDATE channels SET status='disconnected', deleted_at=now(), updated_at=now() WHERE id=$1",
        channel_id,
    )
    # Revoke stored tokens
    await execute(
        "UPDATE oauth_connections SET encrypted_access_token=NULL, encrypted_refresh_token=NULL, updated_at=now() WHERE channel_id=$1",
        channel_id,
    )
    return {"message": "Channel disconnected"}


# ── OAuth Connect Flows ───────────────────────────────────────────────────────

@router.post("/{channel_id}/connect/shopify")
async def connect_shopify(
    channel_id: str,
    body: ShopifyConnectRequest,
    user_id: str = Depends(get_current_user),
    workspace_id: str = Depends(get_current_workspace),
):
    _require_db()
    await _require_workspace_admin(workspace_id, user_id)
    await _get_channel_workspace(channel_id, workspace_id)

    store_url = body.store_url.strip().replace("https://", "").replace("http://", "")
    if not store_url.endswith(".myshopify.com"):
        raise HTTPException(status_code=400, detail="Invalid Shopify store URL")

    if not app_settings.shopify_api_key:
        raise HTTPException(status_code=400, detail="Shopify API key not configured. Add SHOPIFY_API_KEY to backend/.env")

    state = f"{workspace_id}:{channel_id}"  # include channel_id in state for callback
    auth_url = (
        f"https://{store_url}/admin/oauth/authorize"
        f"?client_id={app_settings.shopify_api_key}"
        f"&scope=read_orders,read_products,read_customers,read_inventory,read_analytics"
        f"&redirect_uri={app_settings.shopify_redirect_uri}"
        f"&state={state}"
    )
    return {"authUrl": auth_url, "channelId": channel_id}


@router.post("/{channel_id}/connect/meta")
async def connect_meta(
    channel_id: str,
    user_id: str = Depends(get_current_user),
    workspace_id: str = Depends(get_current_workspace),
):
    _require_db()
    await _require_workspace_admin(workspace_id, user_id)
    await _get_channel_workspace(channel_id, workspace_id)

    if not app_settings.meta_app_id:
        raise HTTPException(status_code=400, detail="Meta App ID not configured. Add META_APP_ID to backend/.env")

    state = f"{workspace_id}:{channel_id}"
    auth_url = (
        f"https://www.facebook.com/v19.0/dialog/oauth"
        f"?client_id={app_settings.meta_app_id}"
        f"&redirect_uri={app_settings.meta_redirect_uri}"
        f"&state={state}"
        f"&scope=ads_read,read_insights"
    )
    return {"authUrl": auth_url, "channelId": channel_id}


@router.post("/{channel_id}/connect/google")
async def connect_google(
    channel_id: str,
    user_id: str = Depends(get_current_user),
    workspace_id: str = Depends(get_current_workspace),
):
    _require_db()
    await _require_workspace_admin(workspace_id, user_id)
    await _get_channel_workspace(channel_id, workspace_id)

    if not app_settings.google_client_id:
        raise HTTPException(status_code=400, detail="Google Client ID not configured. Add GOOGLE_CLIENT_ID to backend/.env")

    state = f"{workspace_id}:{channel_id}"
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={app_settings.google_client_id}"
        f"&redirect_uri={app_settings.google_redirect_uri}"
        f"&response_type=code"
        f"&scope=https://www.googleapis.com/auth/adwords"
        f" https://www.googleapis.com/auth/webmasters.readonly"
        f" https://www.googleapis.com/auth/analytics.readonly"
        f"&access_type=offline"
        f"&prompt=consent"
        f"&state={state}"
    )
    return {"authUrl": auth_url, "channelId": channel_id}


# ── Health Check ──────────────────────────────────────────────────────────────

@router.post("/{channel_id}/health-check")
async def trigger_health_check(
    channel_id: str,
    user_id: str = Depends(get_current_user),
    workspace_id: str = Depends(get_current_workspace),
):
    _require_db()
    ch = await _get_channel_workspace(channel_id, workspace_id)

    # Determine health based on token expiry + last sync
    from datetime import datetime, timezone

    token_expires = ch.get("token_expires_at")
    last_synced = ch.get("last_synced_at")
    status = ch.get("status")

    if status == "disconnected":
        health = "down"
        error = "Channel is disconnected"
    elif token_expires and token_expires < datetime.now(timezone.utc):
        health = "degraded"
        error = "OAuth token has expired — reconnect required"
    elif not last_synced:
        health = "unknown"
        error = "No sync has completed yet"
    else:
        from datetime import timedelta
        age = datetime.now(timezone.utc) - last_synced
        health = "healthy" if age < timedelta(hours=6) else "degraded"
        error = None if health == "healthy" else f"Last sync was {age.seconds // 3600}h ago"

    await execute(
        "UPDATE channels SET health_status=$2, health_checked_at=now(), health_error_message=$3, updated_at=now() WHERE id=$1",
        channel_id, health, error,
    )
    return {"health_status": health, "error": error, "checked_at": "now"}


# ── Sync ──────────────────────────────────────────────────────────────────────

@router.post("/{channel_id}/sync")
async def enqueue_sync(
    channel_id: str,
    body: SyncRequest,
    user_id: str = Depends(get_current_user),
    workspace_id: str = Depends(get_current_workspace),
):
    _require_db()
    await _get_channel_workspace(channel_id, workspace_id)

    job_id = await fetchval(
        """
        INSERT INTO sync_jobs (channel_id, trigger, status, data_types, queued_by)
        VALUES ($1, 'manual', 'queued', $2, $3)
        RETURNING id::text
        """,
        channel_id, body.data_types, user_id,
    )
    return {"job_id": job_id, "status": "queued", "data_types": body.data_types}


@router.get("/{channel_id}/sync-history")
async def get_sync_history(
    channel_id: str,
    limit: int = Query(20, le=100),
    user_id: str = Depends(get_current_user),
    workspace_id: str = Depends(get_current_workspace),
):
    _require_db()
    await _get_channel_workspace(channel_id, workspace_id)

    rows = await fetch(
        """
        SELECT * FROM sync_history
        WHERE channel_id = $1
        ORDER BY completed_at DESC
        LIMIT $2
        """,
        channel_id, limit,
    )
    return [dict(r) for r in rows]


@router.get("/{channel_id}/sync-jobs")
async def get_sync_jobs(
    channel_id: str,
    limit: int = Query(10, le=50),
    user_id: str = Depends(get_current_user),
    workspace_id: str = Depends(get_current_workspace),
):
    _require_db()
    await _get_channel_workspace(channel_id, workspace_id)

    rows = await fetch(
        """
        SELECT id, trigger, status, data_types, records_fetched, records_saved,
               error_message, started_at, completed_at, duration_ms, created_at
        FROM sync_jobs
        WHERE channel_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        """,
        channel_id, limit,
    )
    return [dict(r) for r in rows]
