"""APScheduler nightly price fetch — 21:33 IST weekdays (16:03 UTC)."""
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.db.supabase_client import get_supabase
from app.providers.yfinance_provider import YFinanceProvider
from app.services.pricing import refresh_prices

logger = logging.getLogger(__name__)
_scheduler: AsyncIOScheduler | None = None


async def _run_price_fetch() -> None:
    logger.info("Starting nightly price fetch")
    db = await get_supabase()
    provider = YFinanceProvider()
    statuses = await refresh_prices(db, provider)
    errors = {s: m for s, m in statuses.items() if m != "ok"}
    logger.info("Price fetch done: %d ok, %d errors", len(statuses) - len(errors), len(errors))
    if errors:
        logger.warning("Errors: %s", errors)


def start_scheduler() -> None:
    global _scheduler
    _scheduler = AsyncIOScheduler()
    # 16:03 UTC = 21:33 IST, Mon-Fri, 3 min after NSE close
    _scheduler.add_job(
        _run_price_fetch,
        CronTrigger(hour=16, minute=3, day_of_week="mon-fri", timezone="UTC"),
        id="nightly_price_fetch",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("Price fetch scheduler started (16:03 UTC weekdays)")


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler:
        _scheduler.shutdown()
        _scheduler = None
