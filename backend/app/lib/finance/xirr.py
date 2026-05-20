"""XIRR via Newton-Raphson with bisection fallback."""
from datetime import date
from decimal import Decimal


def xirr(cash_flows: list[tuple[Decimal, date]], guess: float = 0.1) -> float:
    """
    Compute XIRR for a series of (amount, date) cash flows.
    Raises ValueError if no solution found or fewer than 2 flows.
    Cash flows: negative = outflow (investment), positive = inflow (return).
    """
    if len(cash_flows) < 2:
        raise ValueError("XIRR requires at least 2 cash flows")

    amounts = [float(cf[0]) for cf in cash_flows]
    dates = [cf[1] for cf in cash_flows]
    t0 = dates[0]
    days = [(d - t0).days / 365.0 for d in dates]

    def npv(rate: float) -> float:
        return sum(a / (1 + rate) ** t for a, t in zip(amounts, days))

    def dnpv(rate: float) -> float:
        return sum(-t * a / (1 + rate) ** (t + 1) for a, t in zip(amounts, days))

    # Newton-Raphson
    rate = guess
    for _ in range(100):
        f = npv(rate)
        df = dnpv(rate)
        if df == 0:
            break
        new_rate = rate - f / df
        if abs(new_rate - rate) < 1e-7:
            return new_rate
        rate = new_rate

    # Bisection fallback
    lo, hi = -0.999, 10.0
    for _ in range(200):
        mid = (lo + hi) / 2.0
        if npv(mid) > 0:
            lo = mid
        else:
            hi = mid
        if abs(hi - lo) < 1e-7:
            return mid

    raise ValueError("XIRR did not converge")
