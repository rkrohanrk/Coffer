"""XIRR acceptance tests."""
from datetime import date
from decimal import Decimal

import pytest

from app.lib.finance.xirr import xirr


# Acceptance test 4: XIRR of [(-1000, day 0), (1100, day 365)] → 10.00% ± 0.01%
def test_xirr_simple_one_year():
    flows = [
        (Decimal("-1000"), date(2023, 1, 1)),
        (Decimal("1100"),  date(2024, 1, 1)),
    ]
    result = xirr(flows)
    assert abs(result - 0.10) < 0.0001, f"Expected ~10%, got {result:.4%}"


def test_xirr_requires_two_flows():
    with pytest.raises(ValueError, match="at least 2"):
        xirr([(Decimal("-1000"), date(2023, 1, 1))])


def test_xirr_known_return():
    # Monthly investment: -100/month for 12 months, +1300 at end
    from datetime import timedelta
    start = date(2023, 1, 1)
    flows = [(Decimal("-100"), start + timedelta(days=30 * i)) for i in range(12)]
    flows.append((Decimal("1300"), start + timedelta(days=365)))
    result = xirr(flows)
    assert result > 0, "Expected positive XIRR for profitable investment"
