"""Supabase JWT verification + password helpers.

Auth is owned by Supabase Auth (client-side). FastAPI no longer issues tokens; it
only verifies the Supabase-issued access token sent as a Bearer header. Modern
projects sign with asymmetric keys (ES256/RS256) discoverable via JWKS; older
projects use a shared HS256 secret. Both are supported.
"""
import time

import httpx
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

_ISSUER = f"{settings.SUPABASE_URL}/auth/v1"
_JWKS_URL = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
_AUDIENCE = "authenticated"
_JWKS_TTL = 3600

_jwks_cache: dict | None = None
_jwks_fetched_at: float = 0.0


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


async def _get_jwks(force: bool = False) -> dict:
    global _jwks_cache, _jwks_fetched_at
    now = time.time()
    if not force and _jwks_cache is not None and now - _jwks_fetched_at < _JWKS_TTL:
        return _jwks_cache
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.get(_JWKS_URL)
        resp.raise_for_status()
    _jwks_cache = resp.json()
    _jwks_fetched_at = now
    return _jwks_cache


async def _signing_key(kid: str | None) -> dict:
    """Return the JWK matching kid, refreshing the cache once if not found."""
    jwks = await _get_jwks()
    key = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
    if key is None:
        jwks = await _get_jwks(force=True)
        key = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
    if key is None:
        raise ValueError("no matching signing key")
    return key


async def verify_supabase_jwt(token: str) -> dict:
    """Verify a Supabase access token; return its claims or raise ValueError."""
    try:
        header = jwt.get_unverified_header(token)
    except JWTError as exc:
        raise ValueError("malformed token") from exc

    alg = header.get("alg", "")
    try:
        if alg == "HS256":
            if not settings.SUPABASE_JWT_SECRET:
                raise ValueError("HS256 token but SUPABASE_JWT_SECRET is not set")
            key: str | dict = settings.SUPABASE_JWT_SECRET
        else:
            key = await _signing_key(header.get("kid"))

        return jwt.decode(
            token,
            key,
            algorithms=[alg],
            audience=_AUDIENCE,
            issuer=_ISSUER,
        )
    except JWTError as exc:
        raise ValueError("invalid token") from exc
