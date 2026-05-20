from fastapi import Cookie, Depends, HTTPException, status
from supabase import AsyncClient

from app.auth import decode_token
from app.db.supabase_client import get_supabase


async def get_current_user(
    access_token: str | None = Cookie(default=None),
    db: AsyncClient = Depends(get_supabase),
) -> dict:
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        email = decode_token(access_token)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    result = await db.table("users").select("*").eq("email", email).maybe_single().execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return result.data
