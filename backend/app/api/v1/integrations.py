from fastapi import APIRouter, Request, HTTPException
from loguru import logger
from ...repositories.integration_repo import (
    get_integrations,
    get_integration,
    delete_integration,
)
from ...models.integration import (
    IntegrationStatus,
    ShopifyConnectRequest,
)
from ...core.vault import delete_token

router = APIRouter(prefix="/integrations", tags=["integrations"])


@router.get("")
async def list_integrations(request: Request):
    workspace_id = request.state.workspace_id
    rows = await get_integrations(workspace_id)
    return [
        IntegrationStatus(
            id=r["id"],
            platform=r["platform"],
            status=r["status"],
            account_name=r.get("platform_account_name"),
            last_synced_at=r.get("last_synced_at"),
            sync_cursor=r.get("sync_cursor"),
        )
        for r in rows
    ]


@router.post("/shopify/connect")
async def connect_shopify(request: Request, body: ShopifyConnectRequest):
    workspace_id = request.state.workspace_id
    store_url = body.store_url.strip().replace("https://", "").replace("http://", "")

    if not store_url.endswith(".myshopify.com"):
        raise HTTPException(status_code=400, detail="Invalid Shopify store URL")

    from ...core.config import settings

    auth_url = (
        f"https://{store_url}/admin/oauth/authorize"
        f"?client_id={settings.shopify_api_key}"
        f"&scope=read_orders,read_products"
        f"&redirect_uri={settings.shopify_redirect_uri}"
        f"&state={workspace_id}"
    )

    return {"auth_url": auth_url}


@router.post("/meta/connect")
async def connect_meta(request: Request):
    workspace_id = request.state.workspace_id
    from ...core.config import settings

    auth_url = (
        f"https://www.facebook.com/v19.0/dialog/oauth"
        f"?client_id={settings.meta_app_id}"
        f"&redirect_uri={settings.meta_redirect_uri}"
        f"&state={workspace_id}"
        f"&scope=ads_read,read_insights"
    )

    return {"auth_url": auth_url}


@router.post("/google/connect")
async def connect_google(request: Request):
    workspace_id = request.state.workspace_id
    from ...core.config import settings

    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.google_client_id}"
        f"&redirect_uri={settings.google_redirect_uri}"
        f"&response_type=code"
        f"&scope=https://www.googleapis.com/auth/adwords"
        f"&access_type=offline"
        f"&prompt=consent"
        f"&state={workspace_id}"
    )

    return {"auth_url": auth_url}


@router.delete("/{platform}")
async def disconnect_integration(request: Request, platform: str):
    workspace_id = request.state.workspace_id
    if platform not in ("shopify", "meta", "google"):
        raise HTTPException(status_code=400, detail="Invalid platform")

    integration = await get_integration(workspace_id, platform)
    if integration and integration.get("vault_token_id"):
        try:
            await delete_token(integration["vault_token_id"])
        except Exception as e:
            logger.warning(f"Failed to delete vault secret for {platform}: {e}")

    await delete_integration(workspace_id, platform)
    return {"message": f"{platform} disconnected successfully"}
