from ..core.database import fetch, fetchrow, execute


async def get_integrations(workspace_id: str) -> list[dict]:
    return await fetch(
        """
        SELECT id, workspace_id, platform, status, platform_account_id,
               platform_account_name, last_synced_at, sync_cursor
        FROM integrations
        WHERE workspace_id = $1
        ORDER BY platform
        """,
        workspace_id,
    )


async def get_integration(workspace_id: str, platform: str) -> dict | None:
    return await fetchrow(
        """
        SELECT id, workspace_id, platform, status, vault_token_id,
               platform_account_id, platform_account_name,
               last_synced_at, sync_cursor
        FROM integrations
        WHERE workspace_id = $1 AND platform = $2
        """,
        workspace_id,
        platform,
    )


async def upsert_integration(
    workspace_id: str,
    platform: str,
    vault_token_id: str,
    platform_account_id: str | None = None,
    platform_account_name: str | None = None,
) -> dict:
    return await fetchrow(
        """
        INSERT INTO integrations
            (workspace_id, platform, status, vault_token_id,
             platform_account_id, platform_account_name)
        VALUES ($1, $2, 'syncing', $3, $4, $5)
        ON CONFLICT (workspace_id, platform)
        DO UPDATE SET
            status = 'syncing',
            vault_token_id = EXCLUDED.vault_token_id,
            platform_account_id = EXCLUDED.platform_account_id,
            platform_account_name = EXCLUDED.platform_account_name,
            updated_at = now()
        RETURNING id, platform, status
        """,
        workspace_id,
        platform,
        vault_token_id,
        platform_account_id,
        platform_account_name,
    )


async def update_integration_status(
    integration_id: str, status: str, last_synced_at: str | None = None
) -> None:
    if last_synced_at:
        await execute(
            """
            UPDATE integrations
            SET status = $2, last_synced_at = $3, updated_at = now()
            WHERE id = $1
            """,
            integration_id,
            status,
            last_synced_at,
        )
    else:
        await execute(
            """
            UPDATE integrations
            SET status = $2, updated_at = now()
            WHERE id = $1
            """,
            integration_id,
            status,
        )


async def get_active_integrations_by_platform(platform: str) -> list[dict]:
    return await fetch(
        """
        SELECT i.id, i.workspace_id, i.platform, i.vault_token_id,
               i.last_synced_at, i.sync_cursor, w.timezone
        FROM integrations i
        JOIN workspaces w ON w.id = i.workspace_id
        WHERE i.platform = $1 AND i.status = 'active'
          AND w.status = 'active' AND w.deleted_at IS NULL
        """,
        platform,
    )


async def delete_integration(workspace_id: str, platform: str) -> None:
    await execute(
        """
        DELETE FROM integrations
        WHERE workspace_id = $1 AND platform = $2
        """,
        workspace_id,
        platform,
    )
