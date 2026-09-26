from decimal import Decimal

from pydantic import BaseModel


class ReconciliationResult(BaseModel):
    source_count: int
    target_count: int
    source_balance: Decimal
    target_balance: Decimal
    count_matches: bool
    balance_matches: bool
    passed: bool


def reconcile(
    *, source_count: int, target_count: int, source_balance: Decimal, target_balance: Decimal
) -> ReconciliationResult:
    count_matches = source_count == target_count
    balance_matches = source_balance == target_balance
    return ReconciliationResult(
        source_count=source_count,
        target_count=target_count,
        source_balance=source_balance,
        target_balance=target_balance,
        count_matches=count_matches,
        balance_matches=balance_matches,
        passed=count_matches and balance_matches,
    )

