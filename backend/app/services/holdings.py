"""Holdings engine: derives positions from Supabase transaction log."""
from collections import defaultdict
from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from supabase import AsyncClient

from app.lib.finance.fifo import apply_transactions
from app.schemas.holding import HoldingRead, PortfolioSummary

STALE_DAYS = 2


@dataclass
class _TxRow:
    type: str
    trade_date: date
    quantity: Decimal
    price: Decimal
    fees: Decimal


def _to_tx(row: dict) -> _TxRow:
    return _TxRow(
        type=row["type"],
        trade_date=date.fromisoformat(row["trade_date"]),
        quantity=Decimal(str(row["quantity"])),
        price=Decimal(str(row["price"])),
        fees=Decimal(str(row["fees"])),
    )


async def compute_holdings(
    db: AsyncClient,
    user_id: str,
    as_of: date,
) -> PortfolioSummary:
    # 1. Load accounts
    acct_result = await db.table("accounts").select("id,name").eq("user_id", user_id).execute()
    accounts = {row["id"]: row["name"] for row in acct_result.data}
    if not accounts:
        return _empty_summary(as_of)

    # 2. Load transactions up to as_of
    tx_result = (
        await db.table("transactions")
        .select("*")
        .in_("account_id", list(accounts.keys()))
        .lte("trade_date", as_of.isoformat())
        .order("trade_date")
        .execute()
    )
    transactions = tx_result.data

    # 3. Group by (account_id, asset_id) and compute cash
    asset_txs: dict[tuple, list] = defaultdict(list)
    cash_by_account: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))

    for row in transactions:
        tx = _to_tx(row)
        acct_id = row["account_id"]
        asset_id = row.get("asset_id")

        if tx.type == "DEPOSIT":
            cash_by_account[acct_id] += tx.quantity
        elif tx.type == "WITHDRAWAL":
            cash_by_account[acct_id] -= tx.quantity
        elif asset_id:
            asset_txs[(acct_id, asset_id)].append(tx)
            if tx.type == "BUY":
                cash_by_account[acct_id] -= tx.quantity * tx.price + tx.fees
            elif tx.type == "SELL":
                cash_by_account[acct_id] += tx.quantity * tx.price - tx.fees
            elif tx.type == "DIVIDEND":
                cash_by_account[acct_id] += tx.quantity * tx.price

    # 4. Fetch latest prices for all held assets
    asset_ids = list({k[1] for k in asset_txs.keys()})
    price_map: dict[str, tuple[Decimal, date, bool]] = {}

    if asset_ids:
        p_result = (
            await db.table("prices")
            .select("asset_id,date,close")
            .in_("asset_id", asset_ids)
            .lte("date", as_of.isoformat())
            .order("asset_id")
            .order("date", desc=True)
            .execute()
        )
        seen: set = set()
        for p in p_result.data:
            aid = p["asset_id"]
            if aid not in seen:
                seen.add(aid)
                price_date = date.fromisoformat(p["date"])
                is_stale = (as_of - price_date).days > STALE_DAYS
                price_map[aid] = (Decimal(str(p["close"])), price_date, is_stale)

    # 5. Fetch asset metadata
    asset_meta: dict[str, dict] = {}
    if asset_ids:
        a_result = await db.table("assets").select("id,symbol,name,asset_class,sector").in_("id", asset_ids).execute()
        asset_meta = {r["id"]: r for r in a_result.data}

    # 6. Build holdings
    holdings: list[HoldingRead] = []
    for (acct_id, asset_id), txs in asset_txs.items():
        state = apply_transactions(txs)
        if state.total_quantity == Decimal("0"):
            continue

        asset = asset_meta.get(asset_id)
        if not asset:
            continue

        price_info = price_map.get(asset_id)
        current_price = price_info[0] if price_info else None
        price_date = price_info[1] if price_info else None
        is_stale = price_info[2] if price_info else True

        market_value = current_price * state.total_quantity if current_price else None
        unrealized_pnl = market_value - state.cost_basis if market_value is not None else None
        unrealized_pnl_pct = (
            unrealized_pnl / state.cost_basis * Decimal("100")
            if unrealized_pnl is not None and state.cost_basis > Decimal("0")
            else None
        )

        holdings.append(HoldingRead(
            account_id=acct_id,
            account_name=accounts.get(acct_id, ""),
            asset_id=asset_id,
            symbol=asset["symbol"],
            name=asset["name"],
            asset_class=asset["asset_class"],
            sector=asset.get("sector"),
            quantity=state.total_quantity,
            avg_cost_per_share=state.avg_cost_per_share,
            cost_basis=state.cost_basis,
            realized_pnl=state.realized_pnl,
            current_price=current_price,
            market_value=market_value,
            unrealized_pnl=unrealized_pnl,
            unrealized_pnl_pct=unrealized_pnl_pct,
            price_date=price_date,
            price_is_stale=is_stale,
        ))

    total_mv = sum(h.market_value for h in holdings if h.market_value) or Decimal("0")
    total_cb = sum(h.cost_basis for h in holdings) or Decimal("0")
    total_upnl = total_mv - total_cb
    total_upnl_pct = total_upnl / total_cb * Decimal("100") if total_cb > Decimal("0") else Decimal("0")
    total_rpnl = sum(h.realized_pnl for h in holdings) or Decimal("0")
    total_cash = sum(cash_by_account.values()) or Decimal("0")

    return PortfolioSummary(
        total_market_value=total_mv,
        total_cost_basis=total_cb,
        total_unrealized_pnl=total_upnl,
        total_unrealized_pnl_pct=total_upnl_pct,
        total_realized_pnl=total_rpnl,
        total_cash=total_cash,
        holdings=holdings,
        price_stale=any(h.price_is_stale for h in holdings),
        as_of=as_of,
    )


def _empty_summary(as_of: date) -> PortfolioSummary:
    return PortfolioSummary(
        total_market_value=Decimal("0"), total_cost_basis=Decimal("0"),
        total_unrealized_pnl=Decimal("0"), total_unrealized_pnl_pct=Decimal("0"),
        total_realized_pnl=Decimal("0"), total_cash=Decimal("0"),
        holdings=[], price_stale=False, as_of=as_of,
    )
