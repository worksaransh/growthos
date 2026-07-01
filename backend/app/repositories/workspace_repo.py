from ..core.database import fetchrow, execute


async def get_workspace(workspace_id: str) -> dict | None:
    return await fetchrow(
        """
        SELECT id, user_id, brand_name, timezone, currency, created_at
        FROM workspaces
        WHERE id = $1 AND deleted_at IS NULL
        """,
        workspace_id,
    )


async def update_workspace(workspace_id: str, **kwargs) -> dict | None:
    sets = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(kwargs))
    values = list(kwargs.values())
    return await fetchrow(
        f"""
        UPDATE workspaces
        SET {sets}, updated_at = now()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING id, brand_name, timezone, currency
        """,
        workspace_id,
        *values,
    )


async def create_workspace(user_id: str, brand_name: str) -> dict | None:
    return await fetchrow(
        """
        INSERT INTO workspaces (user_id, brand_name)
        VALUES ($1, $2)
        RETURNING id, brand_name, timezone, currency
        """,
        user_id,
        brand_name,
    )
