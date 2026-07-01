from loguru import logger
from .database import fetchrow, execute

# Supabase Vault stores encrypted secrets.
# The vault schema is managed by Supabase and provides:
#   - vault.create_secret(name, secret, description) -> secret_id
#   - vault.decrypted_secrets view (id, name, decrypted_secret, description, created_at)


async def store_token(
    workspace_id: str,
    platform: str,
    access_token: str,
    refresh_token: str | None = None,
) -> str:
    secret_value = access_token
    if refresh_token:
        secret_value = f"{access_token}|||{refresh_token}"

    row = await fetchrow(
        """
        SELECT vault.create_secret(
            $1,
            $2,
            $3
        ) AS secret_id
        """,
        f"{platform}_token_{workspace_id}",
        secret_value,
        f"OAuth token for {platform} workspace {workspace_id}",
    )
    secret_id = row["secret_id"]
    logger.info(f"Stored {platform} token for workspace {workspace_id}")
    return secret_id


async def get_token(secret_id: str) -> str | None:
    row = await fetchrow(
        """
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE id = $1
        """,
        secret_id,
    )
    if row:
        return row["decrypted_secret"]
    return None


async def delete_token(secret_id: str) -> None:
    await execute("DELETE FROM vault.secrets WHERE id = $1", secret_id)
    logger.info(f"Deleted secret {secret_id}")
