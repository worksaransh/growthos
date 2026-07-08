import asyncpg
from loguru import logger
from .config import settings

pool: asyncpg.Pool | None = None
DB_AVAILABLE: bool = False

_PLACEHOLDER_MARKERS = ("", "PASTE_DATABASE_URL_HERE", "YOUR_DB_PASSWORD")


def _is_placeholder_url(url: str) -> bool:
    """Return True if the DATABASE_URL is unset or still contains a placeholder."""
    if not url:
        return True
    for marker in _PLACEHOLDER_MARKERS:
        if marker and marker in url:
            return True
    return False


async def create_pool() -> asyncpg.Pool | None:
    global pool, DB_AVAILABLE
    if _is_placeholder_url(settings.database_url):
        logger.warning("⚠️  DATABASE_URL not set — running in demo mode (no DB). Set it in backend/.env to enable full functionality.")
        DB_AVAILABLE = False
        return None
    try:
        logger.info("Creating database connection pool...")
        pool = await asyncpg.create_pool(
            dsn=settings.database_url,
            min_size=2,
            max_size=10,
            command_timeout=30,
        )
        DB_AVAILABLE = True
        logger.info("✅ Database pool created: min=2, max=10")
        return pool
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        logger.warning("Running in demo mode — DB queries will return empty results.")
        DB_AVAILABLE = False
        return None


async def close_pool():
    global pool
    if pool:
        await pool.close()
        logger.info("Database pool closed")


async def get_pool() -> asyncpg.Pool | None:
    return pool


async def execute(query: str, *args) -> str:
    if not DB_AVAILABLE or pool is None:
        return "DEMO_MODE"
    async with pool.acquire() as conn:
        return await conn.execute(query, *args)


async def fetch(query: str, *args) -> list[dict]:
    if not DB_AVAILABLE or pool is None:
        return []
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *args)
        return [dict(row) for row in rows]


async def fetchrow(query: str, *args) -> dict | None:
    if not DB_AVAILABLE or pool is None:
        return None
    async with pool.acquire() as conn:
        row = await conn.fetchrow(query, *args)
        return dict(row) if row else None


async def fetchval(query: str, *args):
    if not DB_AVAILABLE or pool is None:
        return None
    async with pool.acquire() as conn:
        return await conn.fetchval(query, *args)
