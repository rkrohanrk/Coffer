from abc import ABC, abstractmethod
from datetime import date
from decimal import Decimal


class PriceProvider(ABC):
    @abstractmethod
    async def fetch_latest_close(self, symbol: str) -> tuple[Decimal, date]:
        """Return (close_price, price_date) for the most recent trading day."""
        ...

    @abstractmethod
    async def fetch_history(self, symbol: str, start: date, end: date) -> list[tuple[date, Decimal]]:
        """Return list of (date, close_price) sorted ascending."""
        ...
