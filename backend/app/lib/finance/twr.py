"""Modified Dietz TWR for portfolio performance measurement."""
from datetime import date
from decimal import Decimal


def modified_dietz(
    start_value: Decimal,
    end_value: Decimal,
    cash_flows: list[tuple[Decimal, date]],
    start_date: date,
    end_date: date,
) -> Decimal:
    """
    Modified Dietz return for one period.
    cash_flows: list of (amount, date) — positive = inflow (deposit), negative = outflow (withdrawal).
    Returns the period return as a decimal (0.10 = 10%).
    """
    total_days = (end_date - start_date).days
    if total_days == 0:
        return Decimal("0")

    total_cf = sum(cf[0] for cf in cash_flows)

    weighted_cf = sum(
        cf[0] * Decimal(str((total_days - (cf[1] - start_date).days) / total_days))
        for cf in cash_flows
    )

    denominator = start_value + weighted_cf
    if denominator == Decimal("0"):
        return Decimal("0")

    return (end_value - start_value - total_cf) / denominator


def chain_twr(sub_period_returns: list[Decimal]) -> Decimal:
    """Chain-link sub-period Modified Dietz returns into a total return."""
    result = Decimal("1")
    for r in sub_period_returns:
        result *= Decimal("1") + r
    return result - Decimal("1")
