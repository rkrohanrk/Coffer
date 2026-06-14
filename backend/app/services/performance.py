"""Performance: TWR (Modified Dietz) + XIRR via Supabase."""
from datetime import date, timedelta
from decimal import Decimal

from supabase import AClient as AsyncClient

from app.lib.finance.twr import modified_dietz
from app.lib.finance.xirr import xirr as calc_xirr
from app.schemas.performance import AllocationItem, AllocationRead, PeriodReturn, PerformanceRead
from app.services.holdings import compute_holdings


def _period_start(period: str, as_of: date) -> date:
    if period == "1M":
        return as_of - timedelta(days=30)
    if period == "3M":
        return as_of - timedelta(days=91)
    if period == "YTD":
        # Indian FY: Apr 1
        fy_start = date(as_of.year, 4, 1)
        return fy_start if as_of >= fy_start else date(as_of.year - 1, 4, 1)
    if period == "1Y":
        return as_of - timedelta(days=365)
    return date(2000, 1, 1)


async def get_performance(db: AsyncClient, user_id: str, as_of: date) -> PerformanceRead:
    acct_result = await db.table("accounts").select("id").eq("user_id", user_id).execute()
    account_ids = [r["id"] for r in acct_result.data]
    if not account_ids:
        return PerformanceRead(returns=[PeriodReturn(period=p, twr=None, xirr=None) for p in ["1M","3M","YTD","1Y","ALL"]])

    tx_result = (
        await db.table("transactions")
        .select("type,trade_date,quantity")
        .in_("account_id", account_ids)
        .lte("trade_date", as_of.isoformat())
        .in_("type", ["DEPOSIT", "WITHDRAWAL"])
        .execute()
    )
    all_flows = tx_result.data

    current_summary = await compute_holdings(db, user_id, as_of)
    end_val = current_summary.total_market_value + current_summary.total_cash

    results: list[PeriodReturn] = []
    for period in ["1M", "3M", "YTD", "1Y", "ALL"]:
        start = _period_start(period, as_of)
        twr_val: Decimal | None = None
        xirr_val: Decimal | None = None

        try:
            start_summary = await compute_holdings(db, user_id, start)
            start_val = start_summary.total_market_value + start_summary.total_cash

            cf_for_dietz = [
                (
                    Decimal(str(r["quantity"])) * (1 if r["type"] == "DEPOSIT" else -1),
                    date.fromisoformat(r["trade_date"]),
                )
                for r in all_flows
                if start <= date.fromisoformat(r["trade_date"]) <= as_of
            ]
            twr_val = modified_dietz(start_val, end_val, cf_for_dietz, start, as_of)
        except Exception:
            pass

        try:
            xirr_flows = [
                (
                    Decimal(str(r["quantity"])) * (-1 if r["type"] == "DEPOSIT" else 1),
                    date.fromisoformat(r["trade_date"]),
                )
                for r in all_flows
                if date.fromisoformat(r["trade_date"]) >= start
            ]
            xirr_flows.append((end_val, as_of))
            if len(xirr_flows) >= 2 and any(f[0] < 0 for f in xirr_flows):
                xirr_val = Decimal(str(round(calc_xirr(xirr_flows), 6)))
        except Exception:
            pass

        results.append(PeriodReturn(period=period, twr=twr_val, xirr=xirr_val))

    return PerformanceRead(returns=results)


async def get_allocation(db: AsyncClient, user_id: str, group_by: str, as_of: date) -> AllocationRead:
    summary = await compute_holdings(db, user_id, as_of)
    total = summary.total_market_value or Decimal("1")
    buckets: dict[str, Decimal] = {}
    for h in summary.holdings:
        mv = h.market_value or Decimal("0")
        key = (h.sector or "Unknown") if group_by == "sector" else h.asset_class
        buckets[key] = buckets.get(key, Decimal("0")) + mv

    items = [
        AllocationItem(
            label=label,
            market_value=mv,
            weight=(mv / total * Decimal("100")).quantize(Decimal("0.01")),
        )
        for label, mv in sorted(buckets.items(), key=lambda x: x[1], reverse=True)
    ]
    return AllocationRead(group_by=group_by, items=items, total_market_value=summary.total_market_value)
