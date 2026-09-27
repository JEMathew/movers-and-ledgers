"""Read-only access to versioned synthetic sample-company fixtures."""

import json
from functools import lru_cache
from pathlib import Path
from typing import Any


@lru_cache(maxsize=1)
def load_sample_companies() -> tuple[dict[str, Any], ...]:
    fixture_directory = Path(__file__).resolve().parents[5] / "synthetic-data"
    return tuple(
        json.loads(path.read_text(encoding="utf-8"))
        for path in sorted(fixture_directory.glob("*.json"))
    )


def load_northstar_supplies() -> dict[str, Any]:
    fixture = load_sample_company("northstar-supplies")
    if fixture is None:  # pragma: no cover - repository fixture invariant
        raise RuntimeError("Northstar Supplies fixture is unavailable.")
    return fixture


def sample_company_catalog() -> list[dict[str, str | bool]]:
    return [
        {
            "id": str(fixture["sample_company_id"]),
            "label": str(fixture["label"]),
            "scenario": str(fixture["scenario"]),
            "fixture_version": str(fixture["fixture_version"]),
            "synthetic": True,
        }
        for fixture in load_sample_companies()
    ]


def load_sample_company(sample_company_id: str) -> dict[str, Any] | None:
    return next(
        (
            fixture
            for fixture in load_sample_companies()
            if fixture["sample_company_id"] == sample_company_id
        ),
        None,
    )
