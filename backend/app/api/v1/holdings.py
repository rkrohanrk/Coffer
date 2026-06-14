from datetime import date

from fastapi import APIRouter, Depends, Query
from supabase import AClient as AsyncClient

from app.db.supabase_client import get_supabase
from app.dependencies import get_current_user
from app.schemas.holding import PortfolioSummary
from app.services.holdings import compute_holdings

router = APIRouter(prefix="/holdings", tags=["holdings"])


@router.get("", response_model=PortfolioSummary)
async def get_holdings(
    as_of: date = Query(default_factory=date.today),
    user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase),
) -> PortfolioSummary:
    return await compute_holdings(db, user["id"], as_of)
