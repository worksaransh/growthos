from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from loguru import logger
from ..services.sync_service import sync_all_for_platform
from ..core.database import execute


scheduler = AsyncIOScheduler()


async def start_scheduler():
    if scheduler.running:
        return

    # Shopfiy sync every hour at :00
    scheduler.add_job(
        sync_all_for_platform,
        CronTrigger(minute=0),
        args=["shopify"],
        id="sync_shopify",
        name="Sync all Shopify workspaces",
        replace_existing=True,
        misfire_grace_time=300,
    )

    # Meta Ads sync every hour at :20
    scheduler.add_job(
        sync_all_for_platform,
        CronTrigger(minute=20),
        args=["meta"],
        id="sync_meta",
        name="Sync all Meta Ads workspaces",
        replace_existing=True,
        misfire_grace_time=300,
    )

    # Google Ads sync every hour at :40
    scheduler.add_job(
        sync_all_for_platform,
        CronTrigger(minute=40),
        args=["google"],
        id="sync_google",
        name="Sync all Google Ads workspaces",
        replace_existing=True,
        misfire_grace_time=300,
    )

    # Daily maintenance tasks at 02:00 UTC
    scheduler.add_job(
        purge_old_sync_logs,
        CronTrigger(hour=2, minute=0),
        id="purge_sync_logs",
        name="Purge sync logs older than 90 days",
        replace_existing=True,
    )

    # Daily token refresh at 03:00 UTC
    scheduler.add_job(
        refresh_expiring_tokens,
        CronTrigger(hour=3, minute=0),
        id="refresh_tokens",
        name="Refresh expiring OAuth tokens",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("APScheduler started — hourly sync jobs registered")


async def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler shut down")


async def purge_old_sync_logs():
    try:
        deleted = await execute("SELECT purge_old_sync_logs()")
        logger.info(f"Purged old sync logs: {deleted}")
    except Exception as e:
        logger.error(f"Failed to purge sync logs: {e}")


async def refresh_expiring_tokens():
    # Meta tokens expire in 60 days — refresh logic placeholder
    logger.info("Token refresh job started (placeholder)")
