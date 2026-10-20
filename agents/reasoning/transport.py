"""Count the assembled Vertex request and reserve each attempt before dispatch.

The authority is supplied only by the authenticated paired application action.
No credential, prompt, response text or chain of thought is logged here.
"""

import asyncio
import hashlib
import json
import re
import time
from contextlib import contextmanager
from contextvars import ContextVar
from copy import deepcopy
from dataclasses import replace
from importlib.metadata import version

MODEL = "gemini-3.5-flash-lite"
MODEL_PATH = f"projects/movebooks-ai/locations/global/publishers/google/models/{MODEL}"
FIELDS = {"contents", "systemInstruction", "tools", "generationConfig"}
ACTIVE = ContextVar("hosted_pair_transport", default=None)


class TransportDenied(ValueError):
    pass


@contextmanager
def paired_transport(guard):
    token = ACTIVE.set(guard)
    try:
        yield
    finally:
        ACTIVE.reset(token)


def cloud_guard(settings):
    guard = ACTIVE.get()
    if settings.cloud and guard is None:
        raise TransportDenied("hosted_pair_authorization_required")
    return guard if settings.cloud else None


class CountedTransport:
    def __init__(self, authority):
        self.authority = authority
        self.lock = asyncio.Lock()
        self.prepared = False
        self.blocked = False

    async def prepare(self):
        if self.blocked:
            raise TransportDenied("hosted_authorization_stopped")
        if not self.prepared:
            await self.authority.claim()
            self.prepared = True

    def install(self, client, role):
        if not self.prepared or role not in {"advisor", "reviewer"}:
            raise TransportDenied("hosted_authorization_required")
        if version("google-genai") != "2.28.0" or version("google-adk") != "1.39.1":
            raise TransportDenied("unverified_sdk_version")
        api = client._api_client
        original = api._async_request

        async def guarded(request, http_options=None, stream=False):
            from google.genai import types

            async with self.lock:
                if self.blocked:
                    raise TransportDenied("hosted_authorization_stopped")
                try:
                    urls = {
                        f"https://aiplatform.googleapis.com/{v}/{MODEL_PATH}:generateContent"
                        for v in ("v1", "v1beta1")
                    }
                    if stream or request.method.lower() != "post" or request.url not in urls:
                        raise TransportDenied("unexpected_model_operation")
                    wire = deepcopy(request.data)
                    if not isinstance(wire, dict) or set(wire) - FIELDS - {"labels", "toolConfig"}:
                        raise TransportDenied("uncounted_request_fields")
                    config = wire.get("generationConfig", {})
                    if (
                        config.get("maxOutputTokens") != 2048
                        or config.get("candidateCount", 1) != 1
                        or config.get("thinkingConfig", {}).get(
                            "thinkingLevel", config.get("thinkingConfig", {}).get("thinking_level")
                        )
                        != "LOW"
                    ):
                        raise TransportDenied("generation_bounds_changed")
                    if any(set(t) != {"functionDeclarations"} for t in wire.get("tools", [])):
                        raise TransportDenied("external_tools_forbidden")
                    for content in wire.get("contents", []) + [wire.get("systemInstruction", {})]:
                        for part in content.get("parts", []):
                            if set(part) - {
                                "text",
                                "functionCall",
                                "functionResponse",
                                "thoughtSignature",
                                "thought",
                            }:
                                raise TransportDenied("non_text_context_forbidden")
                    options = types.HttpOptions(retry_options=types.HttpRetryOptions(attempts=1))
                    count_request = replace(
                        request,
                        url=request.url.replace(":generateContent", ":countTokens"),
                        data={k: wire[k] for k in FIELDS if k in wire},
                    )
                    counted = await original(count_request, http_options=options, stream=False)
                    tokens = json.loads(counted.response_stream[0]).get("totalTokens")
                    if type(tokens) is not int or not 0 < tokens <= 50_000:
                        raise TransportDenied("input_token_limit_unverified")
                    fingerprint = hashlib.sha256(
                        json.dumps(wire, sort_keys=True).encode()
                    ).hexdigest()
                    # This transaction also rereads the kill switch after token counting.
                    attempt = await self.authority.reserve(role, tokens, fingerprint)
                    started = time.monotonic()
                    response = await original(
                        replace(request, data=wire), http_options=options, stream=False
                    )
                    data = json.loads(response.response_stream[0])
                    usage = data.get("usageMetadata", {})
                    fields = ("promptTokenCount", "candidatesTokenCount", "thoughtsTokenCount")
                    available = {
                        k: usage[k] for k in fields if type(usage.get(k)) is int and usage[k] >= 0
                    }
                    output = sum(available.get(k, 0) for k in fields[1:])
                    complete = len(available) == 3
                    model_version = data.get("modelVersion")
                    response_id = data.get("responseId")
                    # Absence never means zero. These are reported usage, not billing proof.
                    await self.authority.finish(
                        attempt,
                        {
                            "latency_ms": round((time.monotonic() - started) * 1000),
                            "usage": available,
                            "usage_status": (
                                "complete" if complete else "partial" if available else "unknown"
                            ),
                            "reported_estimated_cost_usd": (
                                (3 * available[fields[0]] + 25 * output) / 10_000_000
                                if fields[0] in available
                                else None
                            ),
                            "billable_cost_status": "UNVERIFIED",
                            "response_sha256": hashlib.sha256(
                                response.response_stream[0].encode()
                            ).hexdigest(),
                            "model_version": model_version
                            if isinstance(model_version, str)
                            and re.fullmatch(r"gemini-[a-z0-9.-]{1,80}", model_version)
                            else None,
                            "response_id": response_id
                            if isinstance(response_id, str)
                            and re.fullmatch(r"[A-Za-z0-9_-]{1,100}", response_id)
                            else None,
                        },
                    )
                    if available.get(fields[0], 0) > 50_000 or output > 2048:
                        raise TransportDenied("reported_usage_exceeds_verified_bounds")
                    return response
                except BaseException:
                    self.blocked = True
                    # A failed/ambiguous operation is never refunded or retried. If this
                    # write fails, the persisted in-flight marker still blocks later calls.
                    try:
                        await self.authority.halt()
                    except BaseException:
                        pass
                    raise TransportDenied("hosted_transport_stopped") from None

        def forbidden(*args, **kwargs):
            raise TransportDenied("synchronous_generation_forbidden")

        api._async_request = guarded
        api._request = forbidden
        return client
