"""
Auto-audit middleware: logs all mutating API calls to audit_logs table.
Fires async after response — never blocks the request.
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time
from loguru import logger


AUDIT_METHODS = {"POST", "PUT", "PATCH", "DELETE"}
SKIP_PATHS = {"/health", "/docs", "/openapi.json", "/redoc", "/webhooks"}


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        start = time.time()
        response = await call_next(request)
        duration_ms = int((time.time() - start) * 1000)

        # Only audit mutating calls that are authenticated
        if (request.method in AUDIT_METHODS and
                not any(request.url.path.startswith(p) for p in SKIP_PATHS) and
                hasattr(request.state, "workspace_id")):

            try:
                from ..core.database import execute
                workspace_id = getattr(request.state, "workspace_id", None)
                user_id = getattr(request.state, "user_id", None)

                await execute("""
                    INSERT INTO audit_logs (
                        workspace_id, user_id, action, resource,
                        method, path, status_code, duration_ms, ip_address
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                """,
                    workspace_id,
                    user_id,
                    f"{request.method} {request.url.path}",
                    request.url.path.split("/")[3] if len(request.url.path.split("/")) > 3 else "api",
                    request.method,
                    request.url.path,
                    response.status_code,
                    duration_ms,
                    request.client.host if request.client else None,
                )
            except Exception as e:
                logger.warning(f"Audit log failed (non-fatal): {e}")

        return response
