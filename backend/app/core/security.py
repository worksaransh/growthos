import base64
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from .config import settings


def _get_jwt_key() -> bytes | str:
    """
    Supabase JWT secrets are displayed as base64-encoded strings in the dashboard.
    GoTrue signs tokens with the raw decoded bytes. We try b64-decode first,
    then fall back to the raw string so both formats work.
    """
    secret = settings.supabase_jwt_secret
    if not secret:
        return secret
    try:
        # Add padding if needed, then decode
        padding = 4 - len(secret) % 4
        padded = secret + ("=" * (padding % 4))
        return base64.b64decode(padded)
    except Exception:
        return secret


async def verify_supabase_jwt(token: str) -> dict | None:
    # Try decoded-bytes key first (correct for Supabase)
    try:
        payload = jwt.decode(
            token,
            _get_jwt_key(),
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload
    except JWTError:
        pass
    # Fallback: raw string key (works for some Supabase project configs)
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload
    except JWTError:
        return None


def create_api_token(user_id: str, workspace_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "workspace_id": workspace_id,
        "iat": now,
        "exp": now + timedelta(hours=1),
    }
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")
