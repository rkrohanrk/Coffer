from fastapi import Header, HTTPException, status

from app.auth import verify_supabase_jwt


async def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    """Resolve the caller from a Supabase `Authorization: Bearer <jwt>` header.

    The user id (`sub`) and email come straight from the verified token, so no
    database round-trip is needed. Downstream queries scope on `user["id"]`,
    which equals the Supabase auth user id (= accounts.user_id).
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    token = authorization.split(" ", 1)[1].strip()
    try:
        claims = await verify_supabase_jwt(token)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    sub = claims.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    return {"id": sub, "email": claims.get("email")}
