from decimal import Decimal

from tools.profiling.checksum import canonical_checksum
from tools.reconciliation import reconcile


def test_checksum_is_order_independent_for_object_keys() -> None:
    assert canonical_checksum({"a": 1, "b": 2}) == canonical_checksum({"b": 2, "a": 1})


def test_reconciliation_fails_on_balance_difference() -> None:
    result = reconcile(
        source_count=2,
        target_count=2,
        source_balance=Decimal("100.00"),
        target_balance=Decimal("99.99"),
    )
    assert result.count_matches
    assert not result.passed

