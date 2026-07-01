from ..core.database import fetch, fetchrow, execute


async def get_notifications(
    workspace_id: str,
    unread_only: bool = False,
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    if unread_only:
        return await fetch(
            """
            SELECT id, workspace_id, type, category, title, message,
                   is_read, action_url, metadata, created_at
            FROM notifications
            WHERE workspace_id = $1 AND is_read = FALSE
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            """,
            workspace_id, limit, offset,
        )
    return await fetch(
        """
        SELECT id, workspace_id, type, category, title, message,
               is_read, action_url, metadata, created_at
        FROM notifications
        WHERE workspace_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        """,
        workspace_id, limit, offset,
    )


async def create_notification(
    workspace_id: str,
    type: str,
    category: str,
    title: str,
    message: str,
    action_url: str | None = None,
    metadata: dict | None = None,
) -> dict | None:
    import json
    return await fetchrow(
        """
        INSERT INTO notifications
            (workspace_id, type, category, title, message, action_url, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, workspace_id, type, category, title, message, is_read, action_url, metadata, created_at
        """,
        workspace_id, type, category, title, message, action_url,
        json.dumps(metadata) if metadata else None,
    )


async def mark_read(workspace_id: str, notification_id: str) -> None:
    await execute(
        """
        UPDATE notifications
        SET is_read = TRUE
        WHERE workspace_id = $1 AND id = $2
        """,
        workspace_id, notification_id,
    )


async def mark_all_read(workspace_id: str) -> None:
    await execute(
        "UPDATE notifications SET is_read = TRUE WHERE workspace_id = $1",
        workspace_id,
    )
