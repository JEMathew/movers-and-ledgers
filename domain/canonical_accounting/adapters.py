"""Ports for source and target accounting systems."""

from collections.abc import AsyncIterator
from typing import Any, Protocol

from .models import Entity


class SourceAdapter(Protocol):
    key: str

    async def discover(self) -> dict[str, Any]: ...

    async def extract(self, entity_type: str) -> AsyncIterator[dict[str, Any]]: ...


class TargetAdapter(Protocol):
    key: str

    async def capabilities(self) -> set[str]: ...

    async def load(self, records: list[Entity], idempotency_key: str) -> dict[str, Any]: ...

