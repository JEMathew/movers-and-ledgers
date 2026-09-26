from fastapi.testclient import TestClient
from movebooks_api.main import app

client = TestClient(app)


def test_health_is_public() -> None:
    response = client.get("/healthz")
    assert response.status_code == 200


def test_workspace_requires_identity() -> None:
    assert client.post("/v1/workspaces").status_code == 401


def test_demo_identity_crosses_boundary() -> None:
    response = client.post("/v1/workspaces", headers={"Authorization": "Bearer demo-user"})
    assert response.status_code == 200
    assert response.json()["stage"] == "discover"
