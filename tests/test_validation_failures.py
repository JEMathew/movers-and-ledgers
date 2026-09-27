"""Negative configuration/reference contracts: no secret values and no silent fallback."""

from unittest.mock import Mock
from uuid import uuid4

import pytest
from movebooks_api.runtime.secrets import GoogleSecrets, SecretUnavailable
from movebooks_api.runtime.storage import ArtifactService, MemoryArtifacts
from movebooks_api.settings import Settings
from pydantic import ValidationError
from test_google_runtime import CLOUD


@pytest.mark.parametrize(
    "value",
    [
        "malformed-credential-marker",
        "sqlite:///tmp/wrong.db",
        "postgresql://test:password-marker@localhost/db",
    ],
)
def test_unsupported_database_url_cannot_silently_select_memory(monkeypatch, value):
    monkeypatch.setenv("DATABASE_URL", value)
    for config in ({}, CLOUD):
        with pytest.raises(ValidationError) as error:
            Settings(**config, _env_file=None)
        assert value not in str(error.value)


@pytest.mark.parametrize(
    "reference",
    [
        "../secret",
        "projects/other/secrets/private/versions/latest",
        "model/versions/1",
        "",
        "a" * 101,
    ],
)
def test_invalid_secret_reference_never_calls_sdk(reference):
    client = Mock()
    provider = GoogleSecrets("synthetic", [reference], client)
    with pytest.raises(SecretUnavailable):
        provider.get(reference)
    client.access_secret_version.assert_not_called()


@pytest.mark.parametrize(
    "workspace,artifact,kind",
    [
        ("../../other", uuid4(), "report"),
        (uuid4(), "../private", "report"),
        (uuid4(), uuid4(), "public"),
        (uuid4(), "https://other/object", "safe-summary"),
    ],
)
def test_malformed_artifact_reference_cannot_touch_storage(workspace, artifact, kind):
    repository = Mock()
    storage = MemoryArtifacts()
    service = ArtifactService(repository, storage)
    with pytest.raises(ValueError):
        service.put("owner", workspace, artifact, kind, b"synthetic", consent=True)
    assert storage.objects == {}
