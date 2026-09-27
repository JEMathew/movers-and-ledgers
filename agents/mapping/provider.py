"""Replaceable recommendation provider; Gemini may implement this contract later."""

from typing import Any, Protocol

from domain.planning_mapping.models import MappingArea
from tools.mapping import lookup_mapping_rule


class MappingRecommendationProvider(Protocol):
    name: str

    def recommend(self, area: MappingArea, record: dict[str, Any]) -> dict[str, Any]: ...


class DeterministicMappingRecommendationProvider:
    """Controlled fallback using only versioned repository mapping knowledge."""

    name = "deterministic-mapping-rules-v1"

    def recommend(self, area: MappingArea, record: dict[str, Any]) -> dict[str, Any]:
        return lookup_mapping_rule(area, record)
