"""Auth routes.

Login/logout are handled entirely by Supabase Auth on the client. The backend
only exposes the identity of the current Supabase user, derived from the verified
access token. The former /auth/login and /auth/logout cookie endpoints have been
removed.
"""
from fastapi import APIRouter, Depends

from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me")
async def me(user: dict = Depends(get_current_user)) -> dict:
    return user
