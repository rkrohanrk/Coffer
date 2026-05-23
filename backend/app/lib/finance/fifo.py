"""FIFO cost basis engine. Pure functions, no I/O."""
from collections import deque
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import Protocol


class TxRecord(Protocol):
    type: str
    trade_date: date
    quantity: Decimal
    price: Decimal
    fees: Decimal


@dataclass
class Lot:
    quantity: Decimal
    cost_per_share: Decimal
    acquired_date: date


@dataclass
class FIFOState:
    lots: list[Lot] = field(default_factory=list)
    realized_pnl: Decimal = field(default_factory=lambda: Decimal("0"))
    cash_flow: Decimal = field(default_factory=lambda: Decimal("0"))

    @property
    def total_quantity(self) -> Decimal:
        return sum(lot.quantity for lot in self.lots)

    @property
    def cost_basis(self) -> Decimal:
        return sum(lot.quantity * lot.cost_per_share for lot in self.lots)

    @property
    def avg_cost_per_share(self) -> Decimal:
        total_qty = self.total_quantity
        if total_qty == Decimal("0"):
            return Decimal("0")
        return self.cost_basis / total_qty


def apply_transactions(transactions: list[TxRecord]) -> FIFOState:
    """
    Process transactions chronologically and return FIFO state.
    SPLIT transactions: quantity = split ratio (new shares per old share), price = 0.
    """
    sorted_txs = sorted(transactions, key=lambda t: t.trade_date)
    lot_deque: deque[Lot] = deque()
    realized_pnl = Decimal("0")
    cash_flow = Decimal("0")

    for tx in sorted_txs:
        qty = Decimal(str(tx.quantity))
        price = Decimal(str(tx.price))
        fees = Decimal(str(tx.fees))

        if tx.type == "BUY":
            # fees are part of cost basis (fully-loaded cost per share)
            cost_per_share = (price * qty + fees) / qty if qty > Decimal("0") else price
            lot_deque.append(Lot(quantity=qty, cost_per_share=cost_per_share, acquired_date=tx.trade_date))
            cash_flow -= qty * price + fees

        elif tx.type == "SELL":
            remaining_sell = qty
            while remaining_sell > Decimal("0") and lot_deque:
                lot = lot_deque[0]
                consumed = min(lot.quantity, remaining_sell)
                realized_pnl += (price - lot.cost_per_share) * consumed
                lot.quantity -= consumed
                remaining_sell -= consumed
                if lot.quantity == Decimal("0"):
                    lot_deque.popleft()
            realized_pnl -= fees  # sell-side fees reduce realized gain
            cash_flow += qty * price - fees

        elif tx.type == "SPLIT":
            ratio = qty
            for lot in lot_deque:
                lot.cost_per_share = lot.cost_per_share / ratio
                lot.quantity = lot.quantity * ratio

        elif tx.type == "DIVIDEND":
            cash_flow += qty * price

        elif tx.type == "DEPOSIT":
            cash_flow += qty

        elif tx.type == "WITHDRAWAL":
            cash_flow -= qty

    return FIFOState(
        lots=list(lot_deque),
        realized_pnl=realized_pnl,
        cash_flow=cash_flow,
    )


def validate_sell(transactions: list[TxRecord], sell_qty: Decimal, sell_date: date) -> str | None:
    """Return error message if selling sell_qty on sell_date would overdraw, else None.
    transactions is the existing list (new sell not yet included).
    """
    prior = [t for t in transactions if t.trade_date <= sell_date]
    state = apply_transactions(prior)
    if state.total_quantity < sell_qty:
        return f"Cannot sell {sell_qty}: only {state.total_quantity} shares held as of {sell_date}"
    return None
