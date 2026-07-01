import asyncio
from datetime import datetime, timezone
from loguru import logger
from typing import Optional
from ..core.database import execute, fetchrow
from ..core.config import settings
from ..core.vault import get_token
from ..repositories.integration_repo import (
    get_active_integrations_by_platform,
    update_integration_status,
)
from ..repositories.sync_repo import (
    create_sync_log,
    complete_sync_log,
)
from .shopify_service import sync_shopify_orders
from .meta_service import sync_meta_ads
from .google_service import sync_google_ads, refresh_google_token


async def sync_workspace_platform(
    workspace_id: str,
    platform: str,
    sync_type: str = "delta",
    trigger_source: str = "scheduler",
    integration_id: Optional[str] = None,
    vault_token_id: Optional[str] = None,
    last_synced_at: Optional[datetime] = None,
    platform_account_id: Optional[str] = None,
) -> dict:
    log_id = await create_sync_log(
        workspace_id=workspace_id,
        integration_id=integration_id,
        platform=platform,
        sync_type=sync_type,
        trigger_source=trigger_source,
    )

    start_time = datetime.now(timezone.utc)

    try:
        token_data = await get_token(vault_token_id)
        if not token_data:
            raise ValueError(f"No token found for {platform} integration")

        result = {}
        if platform == "shopify":
            result = await sync_shopify_orders(
                access_token=token_data,
                store_url=platform_account_id,
                workspace_id=workspace_id,
                last_synced_at=last_synced_at,
                initial_days=settings.initial_sync_days,
            )
        elif platform == "meta":
            result = await sync_meta_ads(
                access_token=token_data,
                ad_account_id=platform_account_id,
                workspace_id=workspace_id,
                last_synced_at=last_synced_at,
            )
        elif platform == "google":
            # Split token if it contains refresh token
            parts = token_data.split("|||")
            access_token = parts[0]
            refresh_tok = parts[1] if len(parts) > 1 else None

            result = await sync_google_ads(
                access_token=access_token,
                refresh_token=refresh_tok,
                customer_id=platform_account_id,
                client_id=settings.google_client_id,
                client_secret=settings.google_client_secret,
                developer_token=settings.google_developer_token,
                workspace_id=workspace_id,
                last_synced_at=last_synced_at,
            )

        duration = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)

        await complete_sync_log(
            log_id=log_id,
            status="success",
            records_fetched=result.get("records_fetched", 0),
            records_inserted=result.get("records_inserted", 0),
            records_updated=result.get("records_updated", 0),
            duration_ms=duration,
        )

        # Recompute metrics cache
        date_start = (last_synced_at or datetime.now(timezone.utc)).strftime("%Y-%m-%d")
        date_end = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        await _recompute_metrics(workspace_id, date_start, date_end)

        return {"status": "success", "records_synced": result.get("records_fetched", 0)}

    except Exception as e:
        logger.error(f"Sync failed for workspace {workspace_id}, platform {platform}: {e}")
        duration = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)

        await complete_sync_log(
            log_id=log_id,
            status="failed",
            duration_ms=duration,
            error_message=str(e)[:500],
        )
        raise


async def _recompute_metrics(workspace_id: str, date_start: str, date_end: str) -> None:
    try:
        await execute(
            "SELECT recompute_metrics_cache($1, $2, $3)",
            workspace_id,
            date_start,
            date_end,
        )
    except Exception as e:
        logger.warning(f"Metrics recomputation failed for {workspace_id}: {e}")


async def sync_all_for_platform(platform: str):
    integrations = await get_active_integrations_by_platform(platform)
    logger.info(f"Starting {platform} sync for {len(integrations)} workspaces")

    semaphore = asyncio.Semaphore(10)
    tasks = []

    for intg in integrations:
        task = _sync_with_semaphore(
            semaphore=semaphore,
            workspace_id=intg["workspace_id"],
            platform=platform,
            integration_id=intg["id"],
            vault_token_id=intg["vault_token_id"],
            last_synced_at=intg["last_synced_at"],
            platform_account_id=intg.get("platform_account_id"),
        )
        tasks.append(task)

    results = await asyncio.gather(*tasks, return_exceptions=True)
    success_count = sum(1 for r in results if not isinstance(r, Exception))
    fail_count = sum(1 for r in results if isinstance(r, Exception))

    logger.info(
        f"{platform} sync complete: {success_count} succeeded, {fail_count} failed"
    )


async def _sync_with_semaphore(
    semaphore: asyncio.Semaphore,
    workspace_id: str,
    platform: str,
    integration_id: str,
    vault_token_id: str,
    last_synced_at: Optional[datetime],
    platform_account_id: Optional[str],
):
    async with semaphore:
        try:
            await sync_workspace_platform(
                workspace_id=workspace_id,
                platform=platform,
                integration_id=integration_id,
                vault_token_id=vault_token_id,
                last_synced_at=last_synced_at,
                platform_account_id=platform_account_id,
            )
            await update_integration_status(
                integration_id=integration_id,
                status="active",
                last_synced_at=datetime.now(timezone.utc).isoformat(),
            )
        except Exception as e:
            logger.error(f"Sync failed for workspace {workspace_id}: {e}")
            await update_integration_status(
                integration_id=integration_id,
                status="error",
            )
            raise
