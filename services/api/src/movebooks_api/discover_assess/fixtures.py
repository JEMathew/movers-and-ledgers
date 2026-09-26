"""Read-only access to versioned synthetic sample-company fixtures."""

import json
from functools import lru_cache
from pathlib import Path
from typing import Any


@lru_cache(maxsize=1)
def load_northstar_supplies() -> dict[str, Any]:
    fixture_path = Path(__file__).resolve().parents[5] / "synthetic-data" / "sample-company.json"
    return json.loads(fixture_path.read_text(encoding="utf-8"))


def sample_company_catalog() -> list[dict[str, str | bool]]:
    fixture = load_northstar_supplies()
    return [
        {
            "id": str(fixture["sample_company_id"]),
            "label": str(fixture["label"]),
            "scenario": str(fixture["scenario"]),
            "fixture_version": str(fixture["fixture_version"]),
            "synthetic": True,
        }
    ]


def load_sample_company(sample_company_id: str) -> dict[str, Any] | None:
    fixture = load_northstar_supplies()
    if fixture["sample_company_id"] != sample_company_id:
        return None
    return fixture
