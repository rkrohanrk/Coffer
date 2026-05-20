"""FIFO acceptance tests per requirement spec."""
from datetime import date
from decimal import Decimal
from dataclasses import dataclass

import pytest

from app.lib.finance.fifo import apply_transactions, validate_sell


@dataclass
class MockTx:
    type: str
    trade_date: date
    quantity: Decimal
    price: Decimal
    fees: Decimal = Decimal("0")


def d(s: str) -> Decimal:
    return Decimal(s)


# Acceptance test 1: Buy 100 SHOP @ $50, sell 40 @ $80
def test_buy_then_partial_sell_realized_pnl():
    txs = [
        MockTx("BUY",  date(2024, 1, 1), d("100"), d("50")),
        MockTx("SELL", date(2024, 2, 1), d("40"),  d("80")),
    ]
    state = apply_transactions(txs)
    assert state.realized_pnl == d("1200"), f"Expected 1200, got {state.realized_pnl}"
    assert state.total_quantity == d("60")
    # Cost basis of remaining 60 shares at $50 = $3000
    assert state.cost_basis == d("3000"), f"Expected 3000, got {state.cost_basis}"


# Acceptance test 2: 2:1 split on 100-share lot at $50
def test_split_adjusts_quantity_and_cost_no_pnl():
    txs = [
        MockTx("BUY",   date(2024, 1, 1), d("100"), d("50")),
        MockTx("SPLIT", date(2024, 6, 1), d("2"),   d("0")),
    ]
    state = apply_transactions(txs)
    assert state.total_quantity == d("200"), f"Expected 200, got {state.total_quantity}"
    assert state.avg_cost_per_share == d("25"), f"Expected 25, got {state.avg_cost_per_share}"
    assert state.realized_pnl == d("0")
    assert state.cost_basis == d("5000")  # 200 * 25


# Acceptance test 3: Two BUYs at different prices, partial SELL consumes oldest lot first
def test_two_buys_sell_consumes_oldest_lot_first():
    txs = [
        MockTx("BUY",  date(2024, 1, 1), d("100"), d("50")),   # Lot 1
        MockTx("BUY",  date(2024, 3, 1), d("100"), d("70")),   # Lot 2
        MockTx("SELL", date(2024, 6, 1), d("120"), d("90")),   # 100 from Lot 1, 20 from Lot 2
    ]
    state = apply_transactions(txs)
    # Sold 100 @ (90-50) = 4000, sold 20 @ (90-70) = 400, total = 4400
    expected_rpnl = d("100") * (d("90") - d("50")) + d("20") * (d("90") - d("70"))
    assert state.realized_pnl == expected_rpnl, f"Expected {expected_rpnl}, got {state.realized_pnl}"
    assert state.total_quantity == d("80")  # 80 remaining from Lot 2


# Acceptance test 6: SELL more shares than held → validate_sell returns error
def test_sell_more_than_held_returns_error():
    txs = [
        MockTx("BUY", date(2024, 1, 1), d("50"), d("100")),
    ]
    error = validate_sell(txs, d("51"), date(2024, 6, 1))
    assert error is not None
    assert "51" in error or "50" in error


def test_sell_exact_quantity_is_ok():
    txs = [
        MockTx("BUY", date(2024, 1, 1), d("50"), d("100")),
    ]
    error = validate_sell(txs, d("50"), date(2024, 6, 1))
    assert error is None


def test_split_then_sell():
    txs = [
        MockTx("BUY",   date(2024, 1, 1), d("100"), d("100")),
        MockTx("SPLIT", date(2024, 6, 1), d("2"),   d("0")),
        MockTx("SELL",  date(2024, 9, 1), d("50"),  d("60")),
    ]
    state = apply_transactions(txs)
    # Sell 50 post-split shares (cost basis $50 each) @ $60 = $500 PnL
    assert state.realized_pnl == d("500"), f"Expected 500, got {state.realized_pnl}"
    assert state.total_quantity == d("150")


def test_cash_flow_tracking():
    txs = [
        MockTx("DEPOSIT",    date(2024, 1, 1), d("10000"), d("1")),
        MockTx("BUY",        date(2024, 1, 5), d("100"),   d("50"), fees=d("5")),
        MockTx("SELL",       date(2024, 3, 1), d("50"),    d("70"), fees=d("5")),
        MockTx("WITHDRAWAL", date(2024, 4, 1), d("2000"),  d("1")),
    ]
    state = apply_transactions(txs)
    # DEPOSIT: +10000
    # BUY: -(100*50 + 5) = -5005
    # SELL: +(50*70 - 5) = +3495
    # WITHDRAWAL: -2000
    expected_cash = d("10000") - d("5005") + d("3495") - d("2000")
    assert state.cash_flow == expected_cash
