"""The test-export page documents the accepted package from one JSON file; keep it exact."""

import json
from pathlib import Path

from movebooks_api import intake

from tools.configuration.controls import AREAS

CONTRACT = Path(__file__).resolve().parents[1] / (
    "apps/web/components/try-your-data/package-contract.json"
)


def test_documented_package_contract_matches_the_validator():
    contract = json.loads(CONTRACT.read_text())
    assert contract["version"] == intake.VERSION
    files = {item["name"]: item for item in contract["files"]}
    assert set(files) == {f"{name}.csv" for name in intake.SCHEMAS}
    for name, columns in intake.SCHEMAS.items():
        assert files[f"{name}.csv"]["required"] == list(columns)
        assert set(files[f"{name}.csv"]["optional"]) == intake.OPTIONAL[name]
    names = set(files) | {contract["configuration"]["name"], *contract["optional_files"]}
    assert names == intake.NAMES
    assert set(contract["configuration"]["settings"]) == set(AREAS)
    limits = contract["limits"]
    assert limits["max_file_bytes"] == intake.MAX_FILE
    assert limits["max_total_bytes"] == intake.MAX_TOTAL
    assert limits["max_rows"] == intake.MAX_ROWS
    assert limits["max_files"] == intake.MAX_FILES == len(intake.NAMES)
    assert limits["max_columns"] == intake.MAX_COLUMNS
    assert limits["max_text_length"] == intake.MAX_TEXT
