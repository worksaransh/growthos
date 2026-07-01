from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
from loguru import logger
from ...core.config import settings
from ...core.vault import store_token
from ...repositories.integration_repo import upsert_integration

router = APIRouter(prefix="/oauth", tags=["oauth"])


@router.get("/shopify/callback")
async def shopify_oauth_callback(
    request: Request,
    code: str,
    state: str,
    shop: str,
):
    workspace_id = state
    logger.info(f"Shopify OAuth callback for workspace {workspace_id}, shop {shop}")

    import httpx

    token_url = f"https://{shop}/admin/oauth/access_token"
    async with httpx.AsyncClient() as client:
        resp = await client.post(token_url, json={
            "client_id": settings.shopify_api_key,
            "client_secret": settings.shopify_api_secret,
            "code": code,
        })
        resp.raise_for_status()
        token_data = resp.json()

    access_token = token_data["access_token"]
    vault_id = await store_token(workspace_id, "shopify", access_token)

    integration = await upsert_integration(
        workspace_id=workspace_id,
        platform="shopify",
        vault_token_id=vault_id,
        platform_account_id=shop,
        platform_account_name=shop,
    )

    return RedirectResponse(url=f"{settings.frontend_url}/onboarding?step=3")


@router.get("/meta/callback")
async def meta_oauth_callback(request: Request, code: str, state: str):
    workspace_id = state
    logger.info(f"Meta OAuth callback for workspace {workspace_id}")

    import httpx

    token_url = "https://graph.facebook.com/v19.0/oauth/access_token"
    async with httpx.AsyncClient() as client:
        resp = await client.get(token_url, params={
            "client_id": settings.meta_app_id,
            "client_secret": settings.meta_app_secret,
            "redirect_uri": settings.meta_redirect_uri,
            "code": code,
        })
        resp.raise_for_status()
        token_data = resp.json()

    access_token = token_data["access_token"]
    vault_id = await store_token(workspace_id, "meta", access_token)

    # Get ad accounts
    me_url = "https://graph.facebook.com/v19.0/me/adaccounts"
    async with httpx.AsyncClient() as client:
        resp = await client.get(me_url, params={"access_token": access_token})
        accounts = resp.json().get("data", [])
        account_id = accounts[0]["id"] if accounts else "unknown"
        account_name = accounts[0]["name"] if accounts else "Meta Ads"

    integration = await upsert_integration(
        workspace_id=workspace_id,
        platform="meta",
        vault_token_id=vault_id,
        platform_account_id=account_id,
        platform_account_name=account_name,
    )

    return RedirectResponse(url=f"{settings.frontend_url}/onboarding?step=4")


@router.get("/google/callback")
async def google_oauth_callback(request: Request, code: str, state: str):
    workspace_id = state
    logger.info(f"Google OAuth callback for workspace {workspace_id}")

    import httpx

    token_url = "https://oauth2.googleapis.com/token"
    async with httpx.AsyncClient() as client:
        resp = await client.post(token_url, data={
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": settings.google_redirect_uri,
            "code": code,
            "grant_type": "authorization_code",
        })
        resp.raise_for_status()
        token_data = resp.json()

    access_token = token_data["access_token"]
    refresh_token = token_data.get("refresh_token", "")
    combined = f"{access_token}|||{refresh_token}"
    vault_id = await store_token(workspace_id, "google", combined)

    integration = await upsert_integration(
        workspace_id=workspace_id,
        platform="google",
        vault_token_id=vault_id,
        platform_account_id=settings.google_client_customer_id or "unknown",
        platform_account_name="Google Ads",
    )

    return RedirectResponse(url=f"{settings.frontend_url}/onboarding?step=5")
