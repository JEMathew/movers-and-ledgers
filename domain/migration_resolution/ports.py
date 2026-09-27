"""Persistence boundary for replacing Beta in-memory checkpoint storage."""

from typing import Protocol
from uuid import UUID

from .models import ExecutionCheckpoint


class CheckpointStore(Protocol):
    def append(self, execution_id: UUID, checkpoint: ExecutionCheckpoint) -> None: ...

    def list(self, execution_id: UUID) -> list[ExecutionCheckpoint]: ...
