"""Read-only identity display uses the same Firebase verifier as protected workspaces."""

from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient
from movebooks_api import auth
from movebooks_api.auth import Principal
from movebooks_api.main import app
from movebooks_api.settings import Settings
from test_google_runtime import CLOUD


@pytest.fixture
def identity_client(monkeypatch):
    monkeypatch.setattr(auth, "get_settings", lambda: Settings(**CLOUD, _env_file=None))
    verifier = Mock()
    verifier.verify.side_effect = lambda token: {
        "synthetic-a": Principal("firebase:a", "a@example.test"),
        "synthetic-b": Principal("firebase:b", "b@example.test"),
    }[token]
    monkeypatch.setattr(auth, "firebase_identity", lambda project: verifier)
    return TestClient(app), verifier


@pytest.mark.parametrize("account", ["a", "b"])
def test_identity_is_verified_not_client_supplied(identity_client, account):
    client, verifier = identity_client
    response = client.get("/v1/identity", headers={
        "Authorization": f"Bearer synthetic-{account}",
        "X-Owner": "firebase:spoof", "X-Actor": "firebase:spoof", "X-Email": "spoof@test",
    })
    assert response.status_code == 200
    assert response.json() == {"subject": f"firebase:{account}", "email": f"{account}@example.test"}
    assert response.headers["cache-control"] == "no-store, private"
    verifier.verify.assert_called_once_with(f"synthetic-{account}")


@pytest.mark.parametrize("token", [None, "demo-user", "revoked", "expired", "wrong-audience"])
def test_identity_denies_missing_invalid_or_demo_tokens(identity_client, token):
    client, _ = identity_client
    response = client.get(
        "/v1/identity", headers={"Authorization": f"Bearer {token}"} if token else {}
    )
    assert response.status_code == 401
    assert "email" not in response.json() and "subject" not in response.json()


def test_identity_is_read_only(identity_client):
    client, _ = identity_client
    response = client.post("/v1/identity", headers={"Authorization": "Bearer synthetic-a"})
    assert response.status_code == 405
