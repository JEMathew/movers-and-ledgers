from datetime import date
from decimal import Decimal
from uuid import uuid4

import pytest
from pydantic import ValidationError

from domain.canonical_accounting.models import Currency, Entry, Transaction


def test_balanced_transaction_is_accepted() -> None:
    transaction = Transaction(
        company_id=uuid4(),
        transaction_date=date(2026, 1, 1),
        currency=Currency(code="USD"),
        entries=[
            Entry(account_id=uuid4(), debit=Decimal("10.00")),
            Entry(account_id=uuid4(), credit=Decimal("10.00")),
        ],
    )
    assert transaction.entries[0].debit == Decimal("10.00")


def test_unbalanced_transaction_is_rejected() -> None:
    with pytest.raises(ValidationError, match="unbalanced"):
        Transaction(
            company_id=uuid4(),
            transaction_date=date(2026, 1, 1),
            currency=Currency(code="USD"),
            entries=[
                Entry(account_id=uuid4(), debit=Decimal("10.00")),
                Entry(account_id=uuid4(), credit=Decimal("9.99")),
            ],
        )

