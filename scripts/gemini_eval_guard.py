"""Harness-only wire-request guard. No credentials, approximation, or retry fallback."""

import asyncio
import hashlib
import json
import os
import re
import time
from contextlib import contextmanager
from contextvars import ContextVar
from copy import deepcopy
from dataclasses import replace
from datetime import UTC, datetime
from importlib.metadata import version
from pathlib import Path
from unittest.mock import patch
from uuid import uuid4

MODEL_PATH = (
    "projects/movebooks-ai/locations/global/publishers/google/models/gemini-3.5-flash-lite"
)
GENERATION_URL = "https://aiplatform.googleapis.com/v1beta1/" + MODEL_PATH + ":generateContent"
COUNT_FIELDS = {"contents", "systemInstruction", "tools", "generationConfig"}
STATE_NAME = "gemini-v2-4b71b28-single-evaluation.jsonl"
ROLE = ContextVar("evaluation_role", default="unassigned")
MAX_PLANNED_USD = (50_000 * 0.30 + 2048 * 2.50) * 4 / 1_000_000


class GuardDenied(RuntimeError):
    pass


class EvaluationGuard:
    """One persistent claim per approved Cloud Shell home, across output paths/worktrees.

    Failed/interrupted runs burn the claim, even with zero generation attempts.
    Deleting state, changing accounts/homes or running on another host is outside
    this single-environment authorization; no local file can police those actions.
    """

    def __init__(self):
        if os.environ.get("CLOUD_SHELL", "").lower() != "true":
            raise GuardDenied("Approved Cloud Shell required")
        directory = Path.home() / ".local/state/movebooks"
        directory.mkdir(mode=0o700, parents=True, exist_ok=True)
        self.path = directory / STATE_NAME  # Fixed; never configurable per run.
        try:
            fd = os.open(self.path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        except OSError:
            raise GuardDenied("Evaluation already claimed or ledger unavailable") from None
        self.file = os.fdopen(fd, "w")
        self.calls = 0
        self.counts = 0
        self.blocked = False
        self.lock = asyncio.Lock()
        self.traces = []
        self.role_runs = []
        self.record("claimed")
        # Persist the directory entry before any network work.
        directory_fd = os.open(directory, os.O_RDONLY)
        try:
            os.fsync(directory_fd)
        finally:
            os.close(directory_fd)

    def record(self, event, **details):
        self.file.write(json.dumps({
            "timestamp_utc": datetime.now(UTC).isoformat(),
            "event": event, "generation_attempts_reserved": self.calls, **details,
        }) + "\n")
        self.file.flush()
        os.fsync(self.file.fileno())

    def install(self, client):
        # Intercept after SDK serialization, ADK preprocessing, HTTP extra-body
        # merging and URL selection. Count exactly the token-bearing wire fields.
        if version("google-genai") != "2.28.0" or version("google-adk") != "1.39.1":
            self.blocked = True
            self.record("unsupported_sdk_version")
            raise GuardDenied("SDK versions differ from the validated transport guard")
        api = client._api_client
        original = api._async_request
        role = ROLE.get()

        async def guarded(http_request, http_options=None, stream=False):
            from google.genai import types

            async with self.lock:
                if self.blocked or self.calls >= 4 or MAX_PLANNED_USD > 0.20:
                    raise GuardDenied("Evaluation allowance exhausted or blocked")
                try:
                    url = http_request.url
                    valid_urls = {
                        GENERATION_URL,
                        GENERATION_URL.replace("/v1beta1/", "/v1/"),
                    }
                    if stream or http_request.method.lower() != "post" or url not in valid_urls:
                        raise GuardDenied("Unexpected transport operation")
                    wire = deepcopy(http_request.data)
                    # Labels are billing metadata; toolConfig controls function choice.
                    # Neither is an input field in Google's CountTokensRequest schema.
                    if (
                        not isinstance(wire, dict)
                        or set(wire) - COUNT_FIELDS - {"toolConfig", "labels"}
                    ):
                        raise GuardDenied("Uncounted request fields")
                    config = wire.get("generationConfig", {})
                    if (
                        config.get("maxOutputTokens") != 2048
                        or config.get("thinkingConfig", {}).get(
                            "thinkingLevel", config.get("thinkingConfig", {}).get("thinking_level")
                        ) != "LOW"
                        or config.get("candidateCount", 1) != 1
                    ):
                        raise GuardDenied("Generation bounds changed")
                    for tool in wire.get("tools", []):
                        if set(tool) != {"functionDeclarations"}:
                            raise GuardDenied("External tools forbidden")
                    for content in wire.get("contents", []) + [wire.get("systemInstruction", {})]:
                        for part in content.get("parts", []):
                            if set(part) - {
                                "text", "functionCall", "functionResponse", "thoughtSignature",
                                "thought",
                            }:
                                raise GuardDenied("Only synthetic text/function context allowed")
                    counted_body = {k: wire[k] for k in COUNT_FIELDS if k in wire}
                    count_request = replace(
                        http_request, url=url.replace(":generateContent", ":countTokens"),
                        data=deepcopy(counted_body),
                    )
                    # Force one attempt on BOTH counting and generation, regardless
                    # of caller/client retry settings.
                    options = types.HttpOptions(
                        retry_options=types.HttpRetryOptions(attempts=1)
                    )
                    self.counts += 1
                    response = await original(count_request, http_options=options, stream=False)
                    total = json.loads(response.response_stream[0]).get("totalTokens")
                    if type(total) is not int or total <= 0 or total > 50_000:
                        raise GuardDenied("Input token allowance not established")
                    self.calls += 1
                    request_id = str(uuid4())
                    # Reservation is durable BEFORE dispatch; errors/timeouts do not refund.
                    self.record(
                        "generation_reserved", input_tokens=total, role=role,
                        local_request_id=request_id,
                        request_sha256=hashlib.sha256(
                            json.dumps(wire, sort_keys=True).encode()
                        ).hexdigest(),
                    )
                    request = replace(http_request, data=wire)
                    started = time.monotonic()
                    try:
                        response = await original(request, http_options=options, stream=False)
                    except BaseException:
                        trace = {
                            "role": role, "local_request_id": request_id,
                            "counted_input_tokens": total, "response_received": False,
                            "latency_ms": round((time.monotonic() - started) * 1000),
                            "estimated_cost_usd": None,
                        }
                        self.traces.append(trace)
                        self.record("generation_failed", **trace)
                        raise
                    trace = response_trace(response, role, request_id, total, started)
                    self.traces.append(trace)
                    self.record("generation_response", **trace)
                    return response
                except BaseException as error:
                    self.blocked = True
                    # Only our own guard messages are allowlisted; provider errors stay opaque.
                    reason = str(error) if isinstance(error, GuardDenied) else "transport_or_count"
                    self.record("blocked", reason=reason)
                    raise GuardDenied("Evaluation guard stopped; inspect ledger") from None

        def forbidden(*args, **kwargs):
            raise GuardDenied("Synchronous transport forbidden in evaluation")

        api._async_request = guarded
        api._request = forbidden
        return client

    def close(self):
        self.file.close()


@contextmanager
def guarded_clients(guard):
    from agents.reasoning import adk

    original = adk.vertex_client
    run_original = adk.run_advisor

    async def measured_role(context, model, settings, **kwargs):
        role = "reviewer" if kwargs.get("role_name") else "advisor"
        token = ROLE.set(role)
        guard.role_runs.append({
            "role": role, "run_id": str(uuid4()),
            "source_facts_sha256": hashlib.sha256(
                json.dumps([f.model_dump() for f in context.facts], sort_keys=True).encode()
            ).hexdigest(),
            "advisor_claim_supplied_separately": hasattr(context, "advisor_recommendation"),
        })
        try:
            return await run_original(context, model, settings, **kwargs)
        finally:
            ROLE.reset(token)

    with (
        patch.object(adk, "vertex_client", lambda settings: guard.install(original(settings))),
        patch.object(adk, "run_advisor", measured_role),
    ):
        yield


def response_trace(response, role, request_id, counted, started):
    """Allowlisted metadata only; never retain headers, raw bodies or thought text."""
    payload = json.loads(response.response_stream[0])
    usage = payload.get("usageMetadata") or {}

    def integer(key):
        value = usage.get(key)
        return value if type(value) is int and value >= 0 else None

    prompt, output, thinking = (
        integer("promptTokenCount"), integer("candidatesTokenCount"), integer("thoughtsTokenCount")
    )
    # An absent thinking count is not sufficient evidence of zero thinking usage.
    estimate = (
        (prompt * 0.30 + (output + thinking) * 2.50) / 1_000_000
        if all(value is not None for value in (prompt, output, thinking)) else None
    )
    model = payload.get("modelVersion")
    if not isinstance(model, str) or not re.fullmatch(
        r"gemini-3\.5-flash-lite[A-Za-z0-9._-]{0,80}", model
    ):
        model = None
    response_id = payload.get("responseId")
    return {
        "role": role, "local_request_id": request_id,
        "response_id_sha256": (
            hashlib.sha256(response_id.encode()).hexdigest()
            if isinstance(response_id, str) else None
        ),
        "model_version": model, "counted_input_tokens": counted,
        "response_received": True,
        "latency_ms": round((time.monotonic() - started) * 1000),
        "input_tokens": prompt, "output_tokens": output, "thinking_tokens": thinking,
        "estimated_cost_usd": estimate,
    }
