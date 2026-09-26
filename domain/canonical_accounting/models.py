"""Canonical accounting contracts. No provider-specific fields belong here."""

from datetime import UTC, date, datetime
from decimal import Decimal
from enum import StrEnum
from typing import Annotated, Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, model_validator

Money = Annotated[Decimal, Field(max_digits=19, decimal_places=4)]


class Currency(BaseModel):
    code: str = Field(pattern=r"^[A-Z]{3}$")


class Address(BaseModel):
    line1: str
    line2: str | None = None
    city: str
    region: str | None = None
    postal_code: str | None = None
    country_code: str = Field(min_length=2, max_length=2)


class Entity(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    external_id: str | None = None
    source_system: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    metadata: dict[str, Any] = Field(default_factory=dict)


class Company(Entity):
    legal_name: str
    display_name: str
    base_currency: Currency
    fiscal_year_start_month: int = Field(ge=1, le=12)
    tax_identifier: str | None = None
    address: Address | None = None


class Party(Entity):
    display_name: str
    email: str | None = None
    phone: str | None = None
    billing_address: Address | None = None


class Customer(Party):
    receivable_account_id: UUID | None = None


class Vendor(Party):
    payable_account_id: UUID | None = None


class AccountType(StrEnum):
    ASSET = "asset"
    LIABILITY = "liability"
    EQUITY = "equity"
    INCOME = "income"
    EXPENSE = "expense"


class Account(Entity):
    code: str
    name: str
    account_type: AccountType
    parent_id: UUID | None = None
    currency: Currency | None = None
    active: bool = True


class Product(Entity):
    sku: str
    name: str
    description: str | None = None
    unit_price: Money
    income_account_id: UUID | None = None
    expense_account_id: UUID | None = None


class Tax(Entity):
    code: str
    name: str
    rate: Decimal = Field(ge=0, le=1)
    payable_account_id: UUID | None = None


class LineItem(BaseModel):
    description: str
    quantity: Decimal = Field(gt=0)
    unit_amount: Money
    account_id: UUID
    product_id: UUID | None = None
    tax_id: UUID | None = None

    @property
    def amount(self) -> Decimal:
        return self.quantity * self.unit_amount


class DocumentStatus(StrEnum):
    DRAFT = "draft"
    OPEN = "open"
    PARTIAL = "partial"
    PAID = "paid"
    VOID = "void"


class Invoice(Entity):
    company_id: UUID
    customer_id: UUID
    document_number: str
    issue_date: date
    due_date: date
    currency: Currency
    lines: list[LineItem] = Field(min_length=1)
    status: DocumentStatus = DocumentStatus.OPEN


class Bill(Entity):
    company_id: UUID
    vendor_id: UUID
    document_number: str
    issue_date: date
    due_date: date
    currency: Currency
    lines: list[LineItem] = Field(min_length=1)
    status: DocumentStatus = DocumentStatus.OPEN


class PaymentDirection(StrEnum):
    RECEIVED = "received"
    SENT = "sent"


class Payment(Entity):
    company_id: UUID
    party_id: UUID
    account_id: UUID
    amount: Money = Field(gt=0)
    currency: Currency
    payment_date: date
    direction: PaymentDirection
    applied_document_ids: list[UUID] = Field(default_factory=list)


class Entry(BaseModel):
    account_id: UUID
    debit: Money = Decimal("0")
    credit: Money = Decimal("0")
    memo: str | None = None

    @model_validator(mode="after")
    def exactly_one_side(self) -> "Entry":
        if (self.debit > 0) == (self.credit > 0):
            raise ValueError("entry must have exactly one positive debit or credit")
        return self


class Transaction(Entity):
    company_id: UUID
    transaction_date: date
    currency: Currency
    reference: str | None = None
    entries: list[Entry] = Field(min_length=2)

    @model_validator(mode="after")
    def balanced(self) -> "Transaction":
        debits = sum((entry.debit for entry in self.entries), Decimal("0"))
        credits = sum((entry.credit for entry in self.entries), Decimal("0"))
        if debits != credits:
            raise ValueError(f"transaction is unbalanced: debits={debits}, credits={credits}")
        return self


class User(Entity):
    subject: str
    email: str
    display_name: str
    roles: set[str] = Field(default_factory=set)


class Configuration(Entity):
    company_id: UUID
    key: str
    value: Any
    version: int = Field(default=1, ge=1)


class IntegrationStatus(StrEnum):
    DRAFT = "draft"
    CONNECTED = "connected"
    SUSPENDED = "suspended"
    REVOKED = "revoked"


class Integration(Entity):
    company_id: UUID
    adapter_key: str
    display_name: str
    status: IntegrationStatus = IntegrationStatus.DRAFT
    capabilities: set[str] = Field(default_factory=set)
    secret_reference: str | None = None
