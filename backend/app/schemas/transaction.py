import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, field_validator


TransactionType = Literal["BUY", "SELL", "DIVIDEND", "SPLIT", "DEPOSIT", "WITHDRAWAL"]


class TransactionCreate(BaseModel):
    account_id: uuid.UUID
    asset_id: uuid.UUID | None = None
    type: TransactionType
    trade_date: date
    quantity: Decimal
    price: Decimal = Decimal("0")
    fees: Decimal = Decimal("0")
    notes: str | None = None

    @field_validator("quantity", "price", "fees")
    @classmethod
    def non_negative(cls, v: Decimal) -> Decimal:
        if v < Decimal("0"):
            raise ValueError("must be non-negative")
        return v


class TransactionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    account_id: uuid.UUID
    asset_id: uuid.UUID | None
    type: str
    trade_date: date
    quantity: Decimal
    price: Decimal
    fees: Decimal
    notes: str | None
    created_at: datetime
    symbol: str | None = None
    account_name: str | None = None


class TransactionPage(BaseModel):
    items: list[TransactionRead]
    total: int
    page: int
    size: int
