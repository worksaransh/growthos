from fastapi import APIRouter, Request, HTTPException
from datetime import datetime, timezone
from ...core.config import settings
from ...repositories.sync_repo import get_throttle, update_throttle, get_sync_logs
from ...repositories.integration_repo import get_integration
from ...services.sync_service import sync_workspace_platform
from ...models.integration import SyncTriggerResponse, SyncStatus

router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("/trigger/{platform}")
async def trigger_manual_sync(request: Request, platform: str):
    workspace_id = request.state.workspace_id

    if platform not in ("shopify", "meta", "google"):
        raise HTTPException(status_code=400, detail="Invalid platform")

    # Rate limit check
    throttle = await get_throttle(workspace_id, platform)
    if throttle:
        last_sync = throttle["last_manual_sync_at"]
        if last_sync:
            elapsed = (datetime.now(timezone.utc) - last_sync).total_seconds()
            if elapsed < settings.manual_sync_throttle_minutes * 60:
                wait = int(settings.manual_sync_throttle_minutes * 60 - elapsed)
                raise HTTPException(
                    status_code=429,
                    detail=f"Please wait {wait} seconds before syncing again",
                )

    integration = await get_integration(workspace_id, platform)
    if not integration:
        raise HTTPException(status_code=404, detail=f"{platform} not connected")

    await update_throttle(workspace_id, platform)

    # Run sync in background (simple approach for MVP - run inline with timeout)
    # In production, this would be queued to APScheduler
    import asyncio
    asyncio.create_task(
        sync_workspace_platform(
            workspace_id=workspace_id,
            platform=platform,
            sync_type="manual",
            trigger_source="manual",
            integration_id=integration["id"],
            vault_token_id=integration["vault_token_id"],
            last_synced_at=integration["last_synced_at"],
            platform_account_id=integration.get("platform_account_id"),
        )
    )

    return SyncTriggerResponse(
        message=f"{platform} sync started",
        job_id=f"manual_{platform}_{workspace_id[:8]}",
    )


@router.get("/status")
async def get_sync_status(request: Request):
    workspace_id = request.state.workspace_id
    logs = await get_sync_logs(workspace_id, limit=15)
    return logs
