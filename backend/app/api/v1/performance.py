from datetime import date

from fastapi import APIRouter, Depends, Query
from supabase import AClient as AsyncClient

from app.db.supabase_client import get_supabase
from app.dependencies import get_current_user
from app.schemas.performance import AllocationRead, PerformanceRead
from app.services.performance import get_allocation, get_performance

router = APIRouter(tags=["performance"])


@router.get("/performance", response_model=PerformanceRead)
async def performance(
    as_of: date = Query(default_factory=date.today),
    user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase),
) -> PerformanceRead:
    return await get_performance(db, user["id"], as_of)


@router.get("/allocation", response_model=AllocationRead)
async def allocation(
    group_by: str = Query(default="asset_class", pattern="^(asset_class|sector)$"),
    as_of: date = Query(default_factory=date.today),
    user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase),
) -> AllocationRead:
    return await get_allocation(db, user["id"], group_by, as_of)
