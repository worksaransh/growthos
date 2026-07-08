from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from loguru import logger
from ..core.security import verify_supabase_jwt
from ..core.database import fetchval, DB_AVAILABLE

# Paths that don't require authentication
_PUBLIC_PATHS = {"/health", "/api/v1/health", "/docs", "/openapi.json", "/redoc"}
_PUBLIC_PREFIXES = (
    "/api/v1/oauth",
    "/api/v1/webhooks",
    "/api/v1/auth",
    "/_next",
    "/static",
)

# Fallback workspace used when DB is unavailable (demo mode)
_DEMO_WORKSPACE_ID = "10000000-0000-0000-0000-000000000003"


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        if path in _PUBLIC_PATHS or any(path.startswith(p) for p in _PUBLIC_PREFIXES):
            return await call_next(request)

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

        token = auth_header[7:]
        payload = await verify_supabase_jwt(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        user_id = payload.get("sub")
        workspace_id: str | None = None

        if DB_AVAILABLE:
            try:
                requested_workspace = request.headers.get("X-Workspace-Id")
                if requested_workspace:
                    workspace_id = await fetchval(
                        "SELECT workspace_id::text FROM workspace_members "
                        "WHERE workspace_id = $1 AND user_id = $2 LIMIT 1",
                        requested_workspace,
                        user_id,
                    )

                if not workspace_id:
                    workspace_id = await fetchval(
                        "SELECT workspace_id::text FROM workspace_members "
                        "WHERE user_id=$1 ORDER BY created_at ASC LIMIT 1",
                        user_id,
                    )

                if not workspace_id:
                    workspace_id = await fetchval(
                        "SELECT id::text FROM workspaces "
                        "WHERE user_id=$1 AND deleted_at IS NULL LIMIT 1",
                        user_id,
                    )

                request.state.workspace_id = workspace_id or ""

            except HTTPException as exc:
                return JSONResponse(
                    status_code=exc.status_code, content={"detail": exc.detail}
                )
            except Exception as exc:
                logger.error("Auth middleware error: {}".format(exc))
                return JSONResponse(
                    status_code=500, content={"detail": "Internal server error"}
                )
        else:
            request.state.workspace_id = _DEMO_WORKSPACE_ID

        response = await call_next(request)
        return response
