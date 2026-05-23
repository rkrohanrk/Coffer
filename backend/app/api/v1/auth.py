from fastapi import APIRouter, Depends, HTTPException, Response, status
from supabase import AsyncClient

from app.auth import create_access_token, hash_password, verify_password
from app.config import settings
from app.db.supabase_client import get_supabase
from app.dependencies import get_current_user
from app.schemas.user import TokenResponse, UserCreate, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(
    body: UserCreate,
    response: Response,
    db: AsyncClient = Depends(get_supabase),
) -> TokenResponse:
    result = await db.table("users").select("*").eq("email", body.email).maybe_single().execute()
    user = result.data
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(user["email"])
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=settings.ENVIRONMENT == "production",
        max_age=60 * 60 * 24 * 7,
    )
    return TokenResponse(access_token=token)


@router.post("/logout")
async def logout(response: Response) -> dict:
    response.delete_cookie("access_token")
    return {"detail": "logged out"}


@router.get("/me", response_model=UserRead)
async def me(user: dict = Depends(get_current_user)) -> UserRead:
    return UserRead(**user)
