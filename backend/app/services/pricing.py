"""Pricing service: fetch and upsert latest prices via Supabase."""
import logging
from datetime import datetime, timezone

from supabase import AsyncClient

from app.providers.base import PriceProvider

logger = logging.getLogger(__name__)


async def refresh_prices(db: AsyncClient, provider: PriceProvider) -> dict[str, str]:
    result = await db.table("assets").select("id,symbol").eq("is_active", True).execute()
    assets = result.data
    statuses: dict[str, str] = {}

    for asset in assets:
        try:
            close, price_date = await provider.fetch_latest_close(asset["symbol"])
            await db.table("prices").upsert(
                {
                    "asset_id": asset["id"],
                    "date": price_date.isoformat(),
                    "close": str(close),
                    "source": "yfinance",
                    "fetched_at": datetime.now(timezone.utc).isoformat(),
                },
                on_conflict="asset_id,date",
            ).execute()
            statuses[asset["symbol"]] = "ok"
            logger.info("Fetched %s @ %s on %s", asset["symbol"], close, price_date)
        except Exception as exc:
            statuses[asset["symbol"]] = str(exc)
            logger.warning("Failed price fetch for %s: %s", asset["symbol"], exc)

    return statuses
