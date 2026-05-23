"""Supabase async client — single shared instance per process."""
import asyncio

from supabase import AsyncClient, create_async_client

from app.config import settings

_client: AsyncClient | None = None
_lock: asyncio.Lock | None = None


async def get_supabase() -> AsyncClient:
    global _client, _lock
    if _client is not None:
        return _client
    if _lock is None:
        _lock = asyncio.Lock()
    async with _lock:
        if _client is None:
            _client = await create_async_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_KEY,
            )
    return _client
