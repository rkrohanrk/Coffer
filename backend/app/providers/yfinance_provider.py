import asyncio
from datetime import date
from decimal import Decimal

import yfinance as yf

from app.providers.base import PriceProvider


class YFinanceProvider(PriceProvider):
    async def fetch_latest_close(self, symbol: str) -> tuple[Decimal, date]:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._sync_latest_close, symbol)

    def _sync_latest_close(self, symbol: str) -> tuple[Decimal, date]:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="5d")
        if hist.empty:
            raise ValueError(f"No price data for {symbol}")
        last_row = hist.iloc[-1]
        price_date = hist.index[-1].date()
        return Decimal(str(round(float(last_row["Close"]), 4))), price_date

    async def fetch_history(self, symbol: str, start: date, end: date) -> list[tuple[date, Decimal]]:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._sync_history, symbol, start, end)

    def _sync_history(self, symbol: str, start: date, end: date) -> list[tuple[date, Decimal]]:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(start=start.isoformat(), end=end.isoformat())
        return [
            (row_date.date(), Decimal(str(round(float(close), 4))))
            for row_date, close in zip(hist.index, hist["Close"])
        ]
