"""Allowlisted JSON to stdout. Never serialize request bodies, headers or exceptions."""

import asyncio
import json
import logging
import time
from uuid import UUID, uuid4

logger = logging.getLogger("movebooks.runtime")


def safe_fields(fields):
    clean = {}
    for key in ("request_id", "session_id", "workspace_id", "audit_reference"):
        try:
            if key in fields:
                clean[key] = str(UUID(str(fields[key])))
        except (ValueError, TypeError):
            pass
    for key in ("status", "latency_ms"):
        if isinstance(fields.get(key), (int, float)):
            clean[key] = max(0, min(fields[key], 1_000_000))
    enums = {
        "action": {
            "request",
            "persistence",
            "storage",
            "auth",
            "lifecycle",
            "retry",
            "idempotency",
            "validation",
            "model",
        },
        "stage": {
            "discover",
            "assess",
            "plan",
            "map",
            "migrate",
            "resolve",
            "validate",
            "configure",
            "onboard",
            "fpu",
        },
        "error_code": {"UNAVAILABLE", "UNAUTHORIZED", "CONFLICT", "INVALID", "TOO_LARGE"},
    }
    for key, allowed in enums.items():
        if isinstance(fields.get(key), str) and fields[key] in allowed:
            clean[key] = fields[key]
    return clean


def emit(**fields):
    logger.warning(json.dumps({"severity": "INFO", **safe_fields(fields)}, allow_nan=False))


class SafeRequestMiddleware:
    """Bound bodies before parsing, including chunked requests; redact path/query entirely."""

    def __init__(self, app, enabled=True):
        self.app, self.enabled = app, enabled

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        start, request_id, status = time.monotonic(), str(uuid4()), 500
        started = False
        payload, size = bytearray(), 0
        while True:
            try:
                message = await asyncio.wait_for(
                    receive(), timeout=max(0.001, 10 - (time.monotonic() - start))
                )
            except TimeoutError:
                await send({"type": "http.response.start", "status": 408, "headers": []})
                await send({"type": "http.response.body", "body": b"Request body timeout"})
                return
            if message["type"] == "http.disconnect":
                return
            size += len(message.get("body", b""))
            if size > 3 * 1024 * 1024:
                await send({"type": "http.response.start", "status": 413, "headers": []})
                await send({"type": "http.response.body", "body": b"Request too large"})
                if self.enabled:
                    emit(
                        action="request", status=413, request_id=request_id, error_code="TOO_LARGE"
                    )
                return
            payload.extend(message.get("body", b""))
            if not message.get("more_body", False):
                break
        delivered = False

        async def body():
            nonlocal delivered
            if not delivered:
                delivered = True
                return {"type": "http.request", "body": bytes(payload), "more_body": False}
            return await receive()

        async def response(message):
            nonlocal status, started
            if message["type"] == "http.response.start":
                status = message["status"]
                started = True
                message["headers"] = [
                    *message.get("headers", []),
                    (b"x-request-id", request_id.encode()),
                ]
            await send(message)

        try:
            await self.app(scope, body, response)
        except Exception:
            # Avoid default server tracebacks containing SDK URLs or SQL parameters.
            if not started:
                await response(
                    {
                        "type": "http.response.start",
                        "status": 503,
                        "headers": [(b"content-type", b"application/json")],
                    }
                )
                await response(
                    {
                        "type": "http.response.body",
                        "body": b'{"detail":"Runtime unavailable; retry safely after recovery."}',
                    }
                )
        finally:
            if self.enabled:
                emit(
                    action="request",
                    request_id=request_id,
                    status=status,
                    latency_ms=round((time.monotonic() - start) * 1000),
                )
