"""Local-only intake tickets, owner-scoped handoff and payload-free Trust projection."""

import base64
import binascii
import csv
import io
import json
import time
import zipfile
from copy import deepcopy
from datetime import UTC, datetime
from threading import RLock
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, Request, Response

from agents.orchestrator.audit import record_decision
from domain.discovery_assessment.models import MigrationSession
from movebooks_api.discover_assess.api import AuthenticatedPrincipal
from movebooks_api.discover_assess.fixtures import load_sample_company
from movebooks_api.discover_assess.service import discover_assess_service as service
from movebooks_api.intake import MAX_TOTAL, SCHEMAS, strict_json, validate_package
from tools.migration import stable_checksum

router = APIRouter(prefix="/v1", tags=["controlled-intake"])
tickets = {}
lock = RLock()
TTL = 1800


def purge():
    for key in list(tickets):
        if tickets[key]["expires"] <= time.monotonic():
            del tickets[key]


async def bounded_body(request):
    body = bytearray()
    async for chunk in request.stream():
        if len(body) + len(chunk) > 3 * 1024 * 1024:
            raise HTTPException(413, "Package request exceeds 3 MiB encoded limit.")
        body.extend(chunk)
    return bytes(body)


@router.post("/intake/validate")
async def validate(request: Request, principal: AuthenticatedPrincipal):
    body = await bounded_body(request)
    try:
        if request.headers.get("content-type", "").split(";")[0] == "application/zip":
            files = [("package.zip", body)]
        else:
            payload = strict_json(body.decode("utf-8"))
            if not isinstance(payload, dict) or set(payload) != {"files"}:
                raise ValueError("Shape")
            values = payload["files"]
            if not isinstance(values, list) or not 1 <= len(values) <= 9:
                raise ValueError("Count")
            files = []
            for item in values:
                if (
                    not isinstance(item, dict)
                    or set(item) != {"name", "content"}
                    or not isinstance(item["name"], str)
                    or len(item["name"]) > 100
                    or not isinstance(item["content"], str)
                ):
                    raise ValueError("File envelope")
                files.append((item["name"], base64.b64decode(item["content"], validate=True)))
        if sum(len(data) for _, data in files) > MAX_TOTAL:
            raise HTTPException(413, "Package exceeds 2 MiB.")
        report, source = validate_package(files)
        report["validated_at"] = datetime.now(UTC).isoformat()
    except (ValueError, TypeError, UnicodeError, RecursionError, binascii.Error) as error:
        raise HTTPException(
            400, "Malformed package envelope; use supported files or one ZIP."
        ) from error
    with lock:
        purge()
        if (
            len(tickets) >= 32
            or sum(t["owner"] == principal.subject for t in tickets.values()) >= 8
        ):
            raise HTTPException(
                429, "Local intake capacity reached. Discard a package or restart the local API."
            )
        key = uuid4()
        tickets[key] = {
            "owner": principal.subject,
            "source": source,
            "report": report,
            "expires": time.monotonic() + TTL,
            "session": None,
        }
    return {**report, "package_id": key, "expires_in_seconds": TTL}


def ticket(key, owner):
    purge()
    value = tickets.get(key)
    if value is None or value["owner"] != owner:
        raise HTTPException(404, "Package unavailable or expired. Validate again.")
    return value


@router.post("/intake/{package_id}/discard")
def discard(package_id: UUID, principal: AuthenticatedPrincipal):
    with lock:
        ticket(package_id, principal.subject)
        del tickets[package_id]
    return {"discarded": True, "note": "Existing workspaces are unchanged."}


@router.post("/intake/{package_id}/workspace", status_code=201)
async def workspace(package_id: UUID, request: Request, principal: AuthenticatedPrincipal):
    body = await bounded_body(request)
    try:
        consent = strict_json(body.decode("utf-8"))
    except (ValueError, UnicodeError, RecursionError) as error:
        raise HTTPException(400, "Review confirmation is required.") from error
    if (
        not isinstance(consent, dict)
        or set(consent) != {"reviewed"}
        or consent["reviewed"] is not True
    ):
        raise HTTPException(400, "Only explicit package review confirmation is accepted.")
    with lock:
        value = ticket(package_id, principal.subject)
        if value["source"] is None:
            raise HTTPException(409, "Resolve package blockers and validate again.")
        if value["session"] is None:
            session = MigrationSession(
                owner_subject=principal.subject,
                sample_company_id="user-upload",
                company_name=value["source"]["company"]["display_name"],
                source_kind="user_upload",
                uploaded_source=deepcopy(value["source"]),
                intake_report=deepcopy(value["report"]),
                source_checksum=stable_checksum(value["source"]["datasets"]),
            )
            # Same repository; cap local uploaded workspaces instead of unbounded sensitive storage.
            record_decision(
                session,
                principal.subject,
                "APPROVED",
                "intake",
                "package",
                [
                    "controlled-package-v1",
                    f"package:{package_id}",
                    f"source:{session.source_checksum}",
                    f"review:{stable_checksum(value['report'])}",
                ],
                "Reviewed package and disclosed exclusions",
            )
            try:
                service.repository.put_uploaded(session, limit=16)
            except ValueError as error:
                raise HTTPException(429, str(error)) from error
            value["session"] = session.id
        session_id = value["session"]
        try:
            service.discover(principal.subject, session_id)
            session = service.assess(principal.subject, session_id)
        except ValueError as error:
            raise HTTPException(
                409, "Workspace changed concurrently. Retry the same ticket."
            ) from error
        return {
            "session_id": session.id,
            "workflow_status": session.workflow_status,
            "source_kind": "user_upload",
            "target_kind": "synthetic",
            "activity": ["Human package review recorded", "Workspace created", "Discover started"],
        }


@router.get("/migration-sessions/{session_id}/intake-trust")
def intake_trust(session_id: UUID, principal: AuthenticatedPrincipal):
    try:
        session = service.get_session(principal.subject, session_id)
    except LookupError as error:
        raise HTTPException(404, "Session unavailable") from error
    # No names, IDs from records, source fields, event attributes or financial values.
    return {
        "id": session.id,
        "workflow_status": session.workflow_status,
        "source_kind": session.source_kind,
        "synthetic": session.synthetic,
        "intake_status": (session.intake_report or {}).get("status"),
        "activity": [
            {
                "id": f"{session.id}-intake-{i}",
                "action": action,
                "agent": "User-provided data · deterministic intake",
                "tool": "validate_package",
                "status": "COMPLETED",
                "occurred_at": (session.intake_report or {}).get("validated_at"),
                "provenance": "DETERMINISTIC",
                "evidence_references": [],
            }
            for i, action in enumerate((session.intake_report or {}).get("activity", []))
        ]
        + [
            {
                "id": a.id,
                "action": f"{a.agent}: {a.tool}",
                "agent": a.agent,
                "tool": a.tool,
                "status": a.status,
                "occurred_at": a.occurred_at,
                "provenance": a.provenance,
                "evidence_references": [],
            }
            for a in session.activity
        ],
        "human_decisions": [
            {
                "id": d.id,
                "stage": d.stage,
                "decision": d.decision,
                "occurred_at": d.occurred_at,
                "actor": "Workspace owner",
                "evidence": [],
            }
            for d in session.human_decisions
        ],
        "events": [
            {"id": e.id, "name": e.name, "occurred_at": e.occurred_at} for e in session.events
        ],
        "validation_reports": [
            {
                "created_at": r.created_at,
                "checks": [
                    {"id": c.id, "label": c.label, "status": c.status, "evidence": []}
                    for c in r.checks
                ],
            }
            for r in session.validation_reports[-1:]
        ],
        "discovery": {
            "findings": [
                {"category": "BLOCKER", "title": "Readiness blocker: review Assessment"}
                for f in (session.discovery.findings if session.discovery else [])
                if f.category == "BLOCKER"
            ]
        },
        "intake_activity": (session.intake_report or {}).get("activity", []),
        "execution": {
            "failures": [
                {
                    "code": f.code,
                    "summary": "Migration paused; review in the governed workflow.",
                    "resolved": f.resolved,
                }
                for f in (session.execution.failures if session.execution else [])
            ]
        },
        "configuration": {
            "proposals": [
                {"state": p.state, "label": p.label}
                for p in (session.configuration.proposals if session.configuration else [])
            ]
        },
        "onboarding": {
            "tasks": [
                {"status": t.status, "label": t.label}
                for t in (session.onboarding.tasks if session.onboarding else [])
            ],
            "fpu": {
                "verified_at": session.onboarding.fpu.verified_at,
                "checks": [
                    {"id": c.id, "passed": c.passed, "evidence": []}
                    for c in session.onboarding.fpu.checks
                ],
            }
            if session.onboarding and session.onboarding.fpu
            else {},
        },
    }


@router.get("/intake/template")
def template(principal: AuthenticatedPrincipal):
    del principal
    fixture = deepcopy(load_sample_company("harbor-light-migrate-demo"))
    datasets = fixture["datasets"]
    datasets["bills"] = [
        {
            "id": "bill-001",
            "vendor_id": "vendor-001",
            "payable_account_id": "account-ap",
            "document_number": "B-1",
            "total": "125.00",
        }
    ]
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_STORED) as archive:
        for entity, columns in SCHEMAS.items():
            output = io.StringIO(newline="")
            writer = csv.DictWriter(output, fieldnames=columns, extrasaction="ignore")
            writer.writeheader()
            for row in datasets[entity]:
                writer.writerow(
                    {k: json.dumps(v) if isinstance(v, list) else v for k, v in row.items()}
                )
            archive.writestr(f"{entity}.csv", output.getvalue())
        archive.writestr(
            "configuration.json",
            json.dumps(
                {
                    "company": fixture["company"],
                    "settings": fixture["configuration_profile"],
                    "taxes": datasets["taxes"],
                },
                indent=2,
            ),
        )
    return Response(
        buffer.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="controlled-package.zip"'},
    )
