"""Modified Dietz TWR acceptance tests."""
from datetime import date
from decimal import Decimal

from app.lib.finance.twr import chain_twr, modified_dietz


# Acceptance test 5: Modified Dietz with mid-period $500 deposit
def test_modified_dietz_excludes_deposit_contribution():
    start = date(2023, 1, 1)
    end = date(2023, 12, 31)
    # Portfolio: starts at $10,000, gets $500 deposit at mid-year, ends at $11,000
    mid = date(2023, 7, 1)
    cash_flows = [(Decimal("500"), mid)]
    result = modified_dietz(
        start_value=Decimal("10000"),
        end_value=Decimal("11000"),
        cash_flows=cash_flows,
        start_date=start,
        end_date=end,
    )
    # Return = (11000 - 10000 - 500) / (10000 + 500 * ~0.5) ≈ 500/10250 ≈ 4.88%
    assert Decimal("0.04") < result < Decimal("0.06"), f"Expected ~4.88%, got {result}"


def test_modified_dietz_no_cash_flows():
    result = modified_dietz(
        start_value=Decimal("10000"),
        end_value=Decimal("11000"),
        cash_flows=[],
        start_date=date(2023, 1, 1),
        end_date=date(2023, 12, 31),
    )
    assert result == Decimal("0.1"), f"Expected 10%, got {result}"


def test_chain_twr():
    # 10% then -5% = 4.5%
    result = chain_twr([Decimal("0.1"), Decimal("-0.05")])
    assert abs(result - Decimal("0.045")) < Decimal("0.001")


def test_modified_dietz_zero_period():
    result = modified_dietz(
        start_value=Decimal("10000"),
        end_value=Decimal("10000"),
        cash_flows=[],
        start_date=date(2023, 1, 1),
        end_date=date(2023, 1, 1),
    )
    assert result == Decimal("0")
