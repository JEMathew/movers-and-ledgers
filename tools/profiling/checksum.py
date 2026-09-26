import hashlib
import json
from typing import Any


def canonical_checksum(value: Any) -> str:
    """Stable checksum for evidence and migration manifests."""
    canonical = json.dumps(value, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(canonical.encode()).hexdigest()

