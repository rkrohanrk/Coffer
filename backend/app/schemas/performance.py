from decimal import Decimal
from typing import Literal

from pydantic import BaseModel


Period = Literal["1M", "3M", "YTD", "1Y", "ALL"]


class PeriodReturn(BaseModel):
    period: str
    twr: Decimal | None
    xirr: Decimal | None


class PerformanceRead(BaseModel):
    returns: list[PeriodReturn]


class AllocationItem(BaseModel):
    label: str
    market_value: Decimal
    weight: Decimal


class AllocationRead(BaseModel):
    group_by: str
    items: list[AllocationItem]
    total_market_value: Decimal
