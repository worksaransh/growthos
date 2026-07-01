from ..core.database import fetch, fetchrow, execute


async def get_sync_logs(
    workspace_id: str, limit: int = 10
) -> list[dict]:
    return await fetch(
        """
        SELECT id, platform, sync_type, status, records_fetched,
               records_inserted, records_updated, error_message,
               retry_attempt, duration_ms, started_at, completed_at
        FROM sync_logs
        WHERE workspace_id = $1
        ORDER BY started_at DESC
        LIMIT $2
        """,
        workspace_id,
        limit,
    )


async def create_sync_log(
    workspace_id: str,
    integration_id: str | None,
    platform: str,
    sync_type: str,
    trigger_source: str = "scheduler",
) -> str:
    row = await fetchrow(
        """
        INSERT INTO sync_logs
            (workspace_id, integration_id, platform, sync_type, trigger_source, status)
        VALUES ($1, $2, $3, $4, $5, 'running')
        RETURNING id
        """,
        workspace_id,
        integration_id,
        platform,
        sync_type,
        trigger_source,
    )
    return row["id"]


async def complete_sync_log(
    log_id: str,
    status: str,
    records_fetched: int = 0,
    records_inserted: int = 0,
    records_updated: int = 0,
    duration_ms: int = 0,
    error_message: str | None = None,
) -> None:
    await execute(
        """
        UPDATE sync_logs
        SET status = $2, records_fetched = $3, records_inserted = $4,
            records_updated = $5, duration_ms = $6,
            error_message = $7, completed_at = now()
        WHERE id = $1
        """,
        log_id,
        status,
        records_fetched,
        records_inserted,
        records_updated,
        duration_ms,
        error_message,
    )


async def get_throttle(workspace_id: str, platform: str) -> dict | None:
    return await fetchrow(
        """
        SELECT last_manual_sync_at
        FROM sync_throttle
        WHERE workspace_id = $1 AND platform = $2
        """,
        workspace_id,
        platform,
    )


async def update_throttle(workspace_id: str, platform: str) -> None:
    await execute(
        """
        INSERT INTO sync_throttle (workspace_id, platform, last_manual_sync_at)
        VALUES ($1, $2, now())
        ON CONFLICT (workspace_id, platform)
        DO UPDATE SET last_manual_sync_at = now(), updated_at = now()
        """,
        workspace_id,
        platform,
    )
