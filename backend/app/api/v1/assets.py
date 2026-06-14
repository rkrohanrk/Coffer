from fastapi import APIRouter, Depends, HTTPException, status
from supabase import AClient as AsyncClient

from app.db.supabase_client import get_supabase
from app.dependencies import get_current_user
from app.schemas.asset import AssetCreate, AssetRead

router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("", response_model=list[AssetRead])
async def list_assets(
    user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase),
) -> list[AssetRead]:
    result = await db.table("assets").select("*").eq("is_active", True).execute()
    return [AssetRead(**row) for row in result.data]


@router.post("", response_model=AssetRead, status_code=status.HTTP_201_CREATED)
async def create_asset(
    body: AssetCreate,
    user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase),
) -> AssetRead:
    symbol = body.symbol.upper()
    check = await db.table("assets").select("id").eq("symbol", symbol).maybe_single().execute()
    if check.data:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Asset {symbol} already exists")

    payload = {**body.model_dump(), "symbol": symbol}
    result = await db.table("assets").insert(payload).execute()
    return AssetRead(**result.data[0])
