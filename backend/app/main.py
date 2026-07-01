import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
import sentry_sdk

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .core.config import settings
from .core.database import create_pool, close_pool
from .core.audit_middleware import AuditMiddleware
from .midleware.auth_middleware import AuthMiddleware
from .midleware.logging_middleware import LoggingMiddleware
from .api.v1.router import router as v1_router
from .jobs.scheduler import start_scheduler, shutdown_scheduler


# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# Sentry init
if settings.sentry_dsn and settings.sentry_dsn.startswith("http"):
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        traces_sample_rate=0.1,
    )

# Logging config
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | {message}",
    level=settings.log_level,
    colorize=True,
)
logger.add(
    "logs/growthos_{time:YYYY-MM-DD}.log",
    rotation="1 day",
    retention="7 days",
    level="INFO",
    format="{time} | {level} | {message}",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting GrowthOS API - {settings.app_name}")
    try:
        await create_pool()
    except Exception as e:
        logger.error(f"Failed to create database connection pool: {e}. Running in degraded mode.")
    await start_scheduler()
    yield
    await shutdown_scheduler()
    try:
        await close_pool()
    except Exception as e:
        logger.error(f"Failed to close database connection pool: {e}")
    logger.info("GrowthOS API shut down")


app = FastAPI(
    title="GrowthOS API",
    description="AI-Powered D2C Operating System for Indian Ecommerce Brands",
    version="1.0.0",
    lifespan=lifespan,
)

# Slowapi rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware
app.add_middleware(LoggingMiddleware)
app.add_middleware(AuthMiddleware)
app.add_middleware(AuditMiddleware)

# Routes
app.include_router(v1_router)


@app.get("/health")
@app.get("/api/v1/health")
async def health():
    return {
        "status": "ok",
        "version": "1.0.0",
        "environment": settings.environment,
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )
