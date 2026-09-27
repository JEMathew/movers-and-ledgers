"""Fail-closed SDK, runtime and authenticated lifecycle boundaries."""

import asyncio
from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient
from movebooks_api.auth import Principal, require_principal
from movebooks_api.discover_assess.service import discover_assess_service as service
from movebooks_api.main import app
from movebooks_api.runtime.observability import SafeRequestMiddleware
from movebooks_api.settings import Settings
from test_beta_v1_integration import Journey
from test_google_runtime import CLOUD


def test_cloud_run_without_cloud_configuration_rejected(monkeypatch):
    monkeypatch.setenv("K_SERVICE", "cloud-run-service")
    with pytest.raises(ValueError):
        Settings(_env_file=None)
    assert Settings(**CLOUD, _env_file=None).cloud


def test_verified_identity_is_attributed_and_owner_isolated():
    app.dependency_overrides[require_principal] = lambda: Principal("firebase:owner-a", "")
    try:
        journey = Journey()
        journey.prepare()
        mapping = journey.get()["mappings"][0]
        journey.post(f"/mappings/{mapping['id']}/approve", {})
        decision = journey.get()["human_decisions"][-1]
        assert decision["actor"] == "firebase:owner-a"
        assert decision["role"] == "WORKSPACE_OWNER"
        assert decision["evidence"] and decision["occurred_at"]
        app.dependency_overrides[require_principal] = lambda: Principal("firebase:owner-b", "")
        response = TestClient(app).get(journey.root)
        assert response.status_code == 404
        response = TestClient(app).post(
            journey.root + f"/mappings/{mapping['id']}/approve", json={}
        )
        assert response.status_code == 404
    finally:
        app.dependency_overrides.pop(require_principal, None)


def test_database_outage_does_not_leak_details_or_fallback(monkeypatch, caplog):
    repository = Mock()
    repository.put.side_effect = RuntimeError("connection-secret-and-record-marker")
    monkeypatch.setattr(service, "repository", repository)
    response = TestClient(app).post(
        "/v1/migration-sessions",
        headers={"Authorization": "Bearer demo-user"},
        json={"sample_company_id": "harbor-light-migrate-demo"},
    )
    assert response.status_code == 503
    assert "connection-secret" not in response.text + caplog.text
    repository.put.assert_called_once()


def test_chunked_body_limit_before_handler():
    async def run():
        messages = iter(
            [
                {"type": "http.request", "body": b"x" * (2 * 1024 * 1024), "more_body": True},
                {"type": "http.request", "body": b"x" * (2 * 1024 * 1024), "more_body": False},
            ]
        )
        sent = []

        async def receive():
            return next(messages)

        async def send(message):
            sent.append(message)

        async def handler(scope, receive, send):
            pytest.fail("Oversized chunked data reached handler")

        await SafeRequestMiddleware(handler)({"type": "http"}, receive, send)
        assert sent[0]["status"] == 413

    asyncio.run(run())
