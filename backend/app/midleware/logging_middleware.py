import time
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from loguru import logger


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        start = time.time()

        response = await call_next(request)

        duration_ms = int((time.time() - start) * 1000)
        user_id = getattr(request.state, "user_id", "anonymous")
        workspace_id = getattr(request.state, "workspace_id", "none")

        logger.bind(
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            status=response.status_code,
            duration_ms=duration_ms,
            user_id=user_id,
            workspace_id=workspace_id,
        ).info("request")

        response.headers["X-Request-ID"] = request_id
        return response
