import uuid
from typing import Literal

from pydantic import BaseModel


class AssetCreate(BaseModel):
    symbol: str
    name: str
    asset_class: Literal["EQUITY", "ETF"]
    sector: str | None = None


class AssetRead(BaseModel):
    id: uuid.UUID
    symbol: str
    name: str
    asset_class: str
    sector: str | None
    is_active: bool
