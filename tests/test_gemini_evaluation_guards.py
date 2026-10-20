"""Focused offline checks. All Google transports are replaced; no credentials/network."""

import asyncio
import importlib.util
import json
import os
import subprocess
import sys
from copy import deepcopy
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from google.auth.credentials import AnonymousCredentials
from google.genai import Client, types

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
from gemini_eval_guard import (  # noqa: E402
    GENERATION_URL,
    EvaluationGuard,
    GuardDenied,
)

spec = importlib.util.spec_from_file_location(
    "preflight", SCRIPTS / "gemini_cloud_shell_preflight.py"
)
preflight = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preflight)


@pytest.fixture
def guard(tmp_path, monkeypatch):
    monkeypatch.setenv("CLOUD_SHELL", "true")
    monkeypatch.setattr(Path, "home", lambda: tmp_path)
    value = EvaluationGuard()
    yield value
    value.close()


def wire(**changes):
    from google.genai._api_client import HttpRequest

    body = {
        "contents": [
            {"role": "user", "parts": [{"text": "Synthetic clearing account"}]},
            {"role": "model", "parts": [{"functionCall": {"name": "read_evidence", "args": {}}}]},
            {"role": "user", "parts": [{"functionResponse": {
                "name": "read_evidence", "response": {"purpose": "unknown"},
            }}]},
        ],
        "systemInstruction": {"parts": [{"text": "Review independently."}]},
        "tools": [{"functionDeclarations": [{
            "name": "read_evidence", "parameters": {"type": "OBJECT", "properties": {}},
        }]}],
        "generationConfig": {
            "maxOutputTokens": 2048, "thinkingConfig": {"thinkingLevel": "LOW"},
        },
    }
    body.update(changes)
    return HttpRequest(method="post", url=GENERATION_URL, data=body, headers={})


def transport_client(guard, tokens=50_000, error=None):
    calls = []

    async def transport(request, http_options=None, stream=False):
        calls.append(deepcopy(request))
        assert http_options.retry_options.attempts == 1
        assert stream is False
        if request.url.endswith(":countTokens"):
            if error:
                raise error
            return SimpleNamespace(response_stream=[json.dumps({"totalTokens": tokens})])
        return SimpleNamespace(response_stream=["{}"], headers={})

    api = SimpleNamespace(_async_request=transport)
    guard.install(SimpleNamespace(_api_client=api))
    return api, calls


@pytest.mark.parametrize("tokens", [50_001, None, -1, 0, True, "100"])
def test_invalid_or_over_limit_counts_never_dispatch_generation(guard, tokens):
    api, calls = transport_client(guard, tokens)
    with pytest.raises(GuardDenied):
        asyncio.run(api._async_request(wire()))
    assert len(calls) == 1 and calls[0].url.endswith(":countTokens")
    assert guard.calls == 0 and guard.blocked


def test_count_error_is_redacted_and_blocks_followup(guard):
    api, calls = transport_client(guard, error=RuntimeError("SECRET_CANARY"))
    for _ in range(2):
        with pytest.raises(GuardDenied) as failure:
            asyncio.run(api._async_request(wire()))
        assert "SECRET_CANARY" not in str(failure.value)
    assert len(calls) == 1
    assert "SECRET_CANARY" not in guard.path.read_text()


def test_all_prompt_fields_and_history_are_counted_at_boundary(guard):
    api, calls = transport_client(guard)
    request = wire()
    asyncio.run(api._async_request(request))
    assert calls[0].data == request.data == calls[1].data
    assert guard.calls == 1
    ledger = [json.loads(line) for line in guard.path.read_text().splitlines()]
    assert ledger[-2]["input_tokens"] == 50_000
    assert ledger[-1]["generation_attempts_reserved"] == 1


def test_concurrent_requests_share_four_attempt_budget(guard):
    api, calls = transport_client(guard)

    async def simultaneous():
        return await asyncio.gather(
            *(api._async_request(wire()) for _ in range(5)), return_exceptions=True
        )

    outcomes = asyncio.run(simultaneous())
    assert sum(isinstance(result, GuardDenied) for result in outcomes) == 1
    assert guard.calls == 4
    assert sum(c.url.endswith(":generateContent") for c in calls) == 4


def test_rerun_and_concurrent_launch_cannot_claim_another_budget(guard):
    with pytest.raises(GuardDenied):
        EvaluationGuard()
    guard.close()
    with pytest.raises(GuardDenied):
        EvaluationGuard()


def test_claim_fails_before_network_outside_cloud_shell(monkeypatch):
    monkeypatch.delenv("CLOUD_SHELL", raising=False)
    with pytest.raises(GuardDenied):
        EvaluationGuard()


def test_generation_failure_does_not_refund_reservation(guard):
    dispatches = []

    async def transport(request, **kwargs):
        dispatches.append(request.url)
        if request.url.endswith(":countTokens"):
            return SimpleNamespace(response_stream=['{"totalTokens": 10}'])
        persisted = json.loads(guard.path.read_text().splitlines()[-1])
        assert persisted["generation_attempts_reserved"] == 1
        raise RuntimeError("SECRET_CANARY")

    api = SimpleNamespace(_async_request=transport)
    guard.install(SimpleNamespace(_api_client=api))
    with pytest.raises(GuardDenied):
        asyncio.run(api._async_request(wire()))
    assert guard.calls == 1 and guard.blocked and len(dispatches) == 2
    assert "SECRET_CANARY" not in guard.path.read_text()


@pytest.mark.parametrize("change", [
    {"cachedContent": "cache/ref"},
    {"tools": [{"googleSearch": {}}]},
    {"generationConfig": {"maxOutputTokens": 2049, "thinkingConfig": {"thinkingLevel": "LOW"}}},
    {"generationConfig": {"maxOutputTokens": 2048, "thinkingConfig": {"thinkingLevel": "HIGH"}}},
])
def test_unapproved_fields_tools_and_generation_config_fail_before_count(guard, change):
    api, calls = transport_client(guard)
    with pytest.raises(GuardDenied):
        asyncio.run(api._async_request(wire(**change)))
    assert calls == []


def test_real_sdk_serialization_is_intercepted_without_network(guard):
    client = Client(
        vertexai=True, project="movebooks-ai", location="global",
        credentials=AnonymousCredentials(),
        http_options=types.HttpOptions(
            base_url="https://aiplatform.googleapis.com",
            retry_options=types.HttpRetryOptions(attempts=1),
        ),
    )
    observed = []

    async def fake_transport(request, **kwargs):
        observed.append(deepcopy(request))
        payload = (
            {"totalTokens": 42} if request.url.endswith(":countTokens") else
            {"candidates": [{"content": {"role": "model", "parts": [{"text": "Synthetic"}]}}]}
        )
        return SimpleNamespace(response_stream=[json.dumps(payload)], headers={})

    client._api_client._async_request = fake_transport
    guard.install(client)

    async def send():
        try:
            return await client.aio.models.generate_content(
                model="gemini-3.5-flash-lite",
                contents=[types.Content(role="user", parts=[types.Part(text="Synthetic")])],
                config=types.GenerateContentConfig(
                    system_instruction="Read synthetic evidence",
                    tools=[types.Tool(function_declarations=[types.FunctionDeclaration(
                        name="read_evidence",
                        parameters_json_schema={"type": "object", "properties": {}},
                    )])],
                    max_output_tokens=2048,
                    thinking_config=types.ThinkingConfig(thinking_level="LOW"),
                    automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
                ),
            )
        finally:
            await client.aio.aclose()

    try:
        asyncio.run(send())
    finally:
        client.close()
    assert len(observed) == 2
    assert observed[0].data == observed[1].data
    assert "systemInstruction" in observed[0].data
    declaration = observed[0].data["tools"][0]["functionDeclarations"][0]
    assert declaration.get("parametersJsonSchema", declaration.get("parameters_json_schema")) == {
        "type": "object", "properties": {},
    }


def tokeninfo(monkeypatch, metadata, status=200):
    response = Mock(status_code=status)
    response.json.return_value = metadata
    transport = Mock()
    transport.__enter__ = Mock(return_value=transport)
    transport.__exit__ = Mock(return_value=None)
    transport.get.return_value = response
    monkeypatch.setattr("requests.Session", lambda: transport)
    return transport


def metadata(**changes):
    value = {
        "email": "approved@example.invalid", "email_verified": "true", "expires_in": "1200",
        "scope": "https://www.googleapis.com/auth/cloud-platform "
        "https://www.googleapis.com/auth/userinfo.email",
    }
    value.update(changes)
    return value


def test_tokeninfo_verifies_adc_bearer_not_cli(monkeypatch):
    transport = tokeninfo(monkeypatch, metadata())
    evidence = {}
    assert preflight.verify_adc_identity(
        SimpleNamespace(token="SECRET_CANARY"), "approved@example.invalid", evidence
    )
    assert transport.get.call_args.kwargs["params"] == {"access_token": "SECRET_CANARY"}
    assert transport.get.call_args.kwargs["allow_redirects"] is False
    assert transport.trust_env is False
    assert "SECRET_CANARY" not in json.dumps(evidence)


@pytest.mark.parametrize("change", [
    {"email": None}, {"email_verified": False}, {"expires_in": "-1"},
    {"scope": "https://www.googleapis.com/auth/userinfo.email"},
])
def test_missing_identity_or_scope_stays_closed(monkeypatch, change):
    tokeninfo(monkeypatch, metadata(**change))
    with pytest.raises(preflight.StopPreflight):
        preflight.verify_adc_identity(
            SimpleNamespace(token="SECRET_CANARY"), "approved@example.invalid", {}
        )


def test_mismatched_adc_is_rejected_even_if_cli_matches(monkeypatch):
    tokeninfo(monkeypatch, metadata(email="other@example.invalid"))
    assert not preflight.verify_adc_identity(
        SimpleNamespace(token="SECRET_CANARY"), "approved@example.invalid", {}
    )


@pytest.mark.parametrize("failure", ["identity", "quota"])
def test_downstream_checks_never_run_without_identity_and_quota(monkeypatch, failure):
    monkeypatch.setenv("CLOUD_SHELL", "true")
    for key in (
        "GOOGLE_APPLICATION_CREDENTIALS", "GOOGLE_API_KEY", "GEMINI_API_KEY",
        "CLOUDSDK_AUTH_ACCESS_TOKEN", "CLOUDSDK_AUTH_ACCESS_TOKEN_FILE",
        "CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE", "CLOUDSDK_AUTH_IMPERSONATE_SERVICE_ACCOUNT",
    ):
        monkeypatch.delenv(key, raising=False)

    def cli(*args):
        if args[0] == "config":
            return "movebooks-ai" if args[2] == "project" else "(unset)"
        if args[0] == "auth":
            return '[{"account":"approved@example.invalid"}]'
        if args[0] == "projects":
            return '{"projectId":"movebooks-ai","lifecycleState":"ACTIVE"}'
        if args[0] == "billing":
            return '{"projectId":"movebooks-ai","billingEnabled":true}'
        if args[0] == "services":
            return "aiplatform.googleapis.com"
        raise AssertionError("Unexpected CLI command")

    creds = SimpleNamespace(
        valid=True, quota_project_id="wrong-project" if failure == "quota" else None,
        refresh=Mock(),
    )
    session = Mock()
    session.__enter__ = Mock(return_value=session)
    session.__exit__ = Mock(return_value=None)
    monkeypatch.setattr(preflight, "gcloud", cli)
    monkeypatch.setattr("google.auth.default", lambda **kwargs: (creds, "movebooks-ai"))
    monkeypatch.setattr("google.auth.transport.requests.AuthorizedSession", lambda *a, **k: session)
    monkeypatch.setattr(preflight, "verify_adc_identity", lambda *args: failure != "identity")
    result = preflight.collect("approved@example.invalid")
    assert result["gates"]["vertex_permissions"]["result"] == "UNVERIFIED"
    assert result["gates"]["model_metadata"]["result"] == "UNVERIFIED"
    assert result["count_tokens_requests"] == 0
    session.get.assert_not_called()
    session.post.assert_not_called()


def test_separate_processes_cannot_extend_authorization(tmp_path):
    code = (
        "import sys; sys.path.insert(0, sys.argv[1]); "
        "from gemini_eval_guard import EvaluationGuard, GuardDenied\n"
        "try:\n g=EvaluationGuard(); g.close()\n"
        "except GuardDenied:\n sys.exit(3)\n"
    )
    env = dict(os.environ, HOME=str(tmp_path), CLOUD_SHELL="true")
    processes = [
        subprocess.Popen([sys.executable, "-c", code, str(SCRIPTS)], env=env)
        for _ in range(2)
    ]
    assert sorted(p.wait(timeout=10) for p in processes) == [0, 3]


def test_actual_harness_adk_request_is_counted_before_any_generation(tmp_path, monkeypatch):
    import gemini_analysis_eval
    from movebooks_api.settings import Settings

    from agents.reasoning import adk
    from domain.reasoning.models import Capability

    monkeypatch.setattr(Path, "home", lambda: tmp_path)
    monkeypatch.setenv("CLOUD_SHELL", "true")
    observed = []
    assembled = []

    def factory(settings):
        client = Client(
            vertexai=True, project="movebooks-ai", location="global",
            credentials=AnonymousCredentials(),
            http_options=types.HttpOptions(base_url="https://aiplatform.googleapis.com"),
        )

        async def fake_transport(request, **kwargs):
            observed.append(deepcopy(request))
            assert request.url.endswith(":countTokens"), "Generation must not dispatch"
            return SimpleNamespace(response_stream=['{"totalTokens":50001}'], headers={})

        client._api_client._async_request = fake_transport
        build = client._api_client._build_request

        def capture(*args, **kwargs):
            request = build(*args, **kwargs)
            assembled.append(deepcopy(request.data))
            return request

        client._api_client._build_request = capture
        return client

    monkeypatch.setattr(adk, "vertex_client", factory)
    settings = Settings(
        _env_file=None, env="local", model_provider_mode="gemini-adk",
        reasoning_project="movebooks-ai", reasoning_location="global",
        reasoning_models={c.value: "gemini-3.5-flash-lite" for c in Capability},
        synthetic_analysis_enabled=True, synthetic_beta_authorized=True,
    )
    result = asyncio.run(gemini_analysis_eval.run(settings, live=True))
    assert result["status"] == "guard-blocked"
    assert result["pre_inference_guard"]["generation_attempts_reserved"] == 0
    assert len(observed) == 1, [list(body) for body in assembled]
    assert observed[0].data == {
        key: value for key, value in assembled[0].items() if key not in {"labels", "toolConfig"}
    }
    assert {"contents", "systemInstruction", "tools", "generationConfig"} <= observed[0].data.keys()
    assert result["business_state_unchanged"]


def test_packaged_harness_hashes_and_versions_are_required(tmp_path, monkeypatch):
    # Historical preflight pins stay frozen. Test that contract in an isolated
    # fixture instead of requiring the developer's HEAD to remain at the old SHA.
    for name in preflight.HARNESS_HASHES:
        target = tmp_path / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes((SCRIPTS.parent / name).read_bytes())

    def git_result(args, **kwargs):
        output = {
            "rev-parse": preflight.BASELINE,
            "branch": "feature/gemini-advisor-v2",
            "diff": "\n".join(preflight.HARNESS_HASHES),
        }[args[3]]
        return SimpleNamespace(returncode=0, stdout=output)

    monkeypatch.setattr(preflight.subprocess, "run", git_result)
    assert preflight.harness_verified(tmp_path)
    assert not preflight.harness_verified(None)
    monkeypatch.setattr(
        preflight.subprocess, "run",
        lambda *a, **k: SimpleNamespace(returncode=0, stdout="unapproved-revision"),
    )
    assert not preflight.harness_verified(tmp_path)
    monkeypatch.setattr(preflight.subprocess, "run", git_result)
    monkeypatch.setattr(preflight, "HARNESS_HASHES", {"scripts/gemini_eval_guard.py": "bad"})
    assert not preflight.harness_verified(tmp_path)


def test_sdk_version_mismatch_prevents_client_installation(guard, monkeypatch):
    monkeypatch.setattr("gemini_eval_guard.version", lambda name: "unverified")
    with pytest.raises(GuardDenied):
        guard.install(SimpleNamespace())
    assert guard.blocked and guard.calls == 0


def test_token_metadata_http_failure_never_exports_request_or_error(monkeypatch):
    transport = tokeninfo(monkeypatch, {})
    transport.get.side_effect = RuntimeError("https://tokeninfo?access_token=SECRET_CANARY")
    with pytest.raises(preflight.StopPreflight) as failure:
        preflight.verify_adc_identity(
            SimpleNamespace(token="SECRET_CANARY"), "approved@example.invalid", {}
        )
    assert "SECRET_CANARY" not in str(failure.value)
