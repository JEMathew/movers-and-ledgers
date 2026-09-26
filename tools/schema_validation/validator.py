from typing import Any

from pydantic import BaseModel, ValidationError


class ValidationIssue(BaseModel):
    row: int
    path: str
    code: str
    message: str


def validate_records(
    records: list[dict[str, Any]], model: type[BaseModel]
) -> list[ValidationIssue]:
    """Validate every input row without allowing an LLM to reinterpret errors."""
    issues: list[ValidationIssue] = []
    for row, record in enumerate(records):
        try:
            model.model_validate(record)
        except ValidationError as error:
            for item in error.errors():
                issues.append(
                    ValidationIssue(
                        row=row,
                        path=".".join(str(part) for part in item["loc"]),
                        code=item["type"],
                        message=item["msg"],
                    )
                )
    return issues
