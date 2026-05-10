import uuid
from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class HoldingRead(BaseModel):
    account_id: uuid.UUID
    account_name: str
    asset_id: uuid.UUID
    symbol: str
    name: str
    asset_class: str
    sector: str | None
    quantity: Decimal
    avg_cost_per_share: Decimal
    cost_basis: Decimal
    realized_pnl: Decimal
    current_price: Decimal | None
    market_value: Decimal | None
    unrealized_pnl: Decimal | None
    unrealized_pnl_pct: Decimal | None
    price_date: date | None
    price_is_stale: bool


class PortfolioSummary(BaseModel):
    total_market_value: Decimal
    total_cost_basis: Decimal
    total_unrealized_pnl: Decimal
    total_unrealized_pnl_pct: Decimal
    total_realized_pnl: Decimal
    total_cash: Decimal
    holdings: list[HoldingRead]
    price_stale: bool
    as_of: date
