import ssl as ssl_module

import asyncpg

from .config import get_database_url

_pool: asyncpg.Pool | None = None


async def create_pool() -> asyncpg.Pool:
    global _pool
    url = get_database_url()
    # Disable SSL for local development (asyncpg defaults to SSL which fails with local Docker postgres)
    use_ssl: bool | ssl_module.SSLContext = False
    if "sslmode=require" in url or "sslmode=verify" in url:
        use_ssl = True
    _pool = await asyncpg.create_pool(
        url,
        min_size=2,
        max_size=10,
        server_settings={"search_path": "python_fastapi"},
        ssl=use_ssl,
    )
    assert _pool is not None
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


def get_pool() -> asyncpg.Pool:
    assert _pool is not None, "Database pool not initialized"
    return _pool
