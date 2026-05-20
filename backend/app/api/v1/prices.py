from fastapi import APIRouter, Depends
from supabase import AsyncClient

from app.db.supabase_client import get_supabase
from app.dependencies import get_current_user
from app.providers.yfinance_provider import YFinanceProvider
from app.services.pricing import refresh_prices

router = APIRouter(prefix="/prices", tags=["prices"])


@router.post("/refresh")
async def trigger_price_refresh(
    user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase),
) -> dict:
    provider = YFinanceProvider()
    statuses = await refresh_prices(db, provider)
    errors = {s: m for s, m in statuses.items() if m != "ok"}
    return {"total": len(statuses), "ok": len(statuses) - len(errors), "errors": errors}
