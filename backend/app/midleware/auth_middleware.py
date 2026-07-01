from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from ..core.security import verify_supabase_jwt
from ..core.database import fetchval


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path in ("/health", "/api/v1/health") or request.url.path.startswith("/api/v1/oauth"):
            return await call_next(request)

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

        token = auth_header[7:]
        payload = await verify_supabase_jwt(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        user_id = payload.get("sub")
        try:
            workspace_id = await fetchval(
                "SELECT id FROM workspaces WHERE user_id = $1 AND deleted_at IS NULL",
                user_id,
            )
        except RuntimeError:
            # Database offline/uninitialized: run in degraded mode with mock workspace
            workspace_id = "d3b07384-d113-495d-9c3f-76a524256884"

        if not workspace_id and request.url.path != "/api/v1/auth/workspace/init":
            raise HTTPException(status_code=404, detail="Workspace not found")

        request.state.user_id = user_id
        request.state.workspace_id = workspace_id
        return await call_next(request)
