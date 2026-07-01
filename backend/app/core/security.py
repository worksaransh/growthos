from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from .config import settings


async def verify_supabase_jwt(token: str) -> dict | None:
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
