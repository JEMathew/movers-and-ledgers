"""Read-only Cloud Shell preflight; never imports or invokes an inference client.

Requires an already approved Google account and Cloud Shell's managed authentication.
Writes sanitized JSON exclusively to a new file. Exit 1 means NOT READY.
Also checks the free countTokens endpoint after identity/configuration verification.
No login, credential export, installation, IAM mutation, or resource changes.
"""

import argparse
import contextlib
import hashlib
import json
import logging
import os
import re
import subprocess
from datetime import UTC, datetime
from decimal import Decimal
from importlib.metadata import version
from pathlib import Path

PROJECT = "movebooks-ai"
MODEL = "gemini-3.5-flash-lite"
ENDPOINT = "https://aiplatform.googleapis.com"
BASELINE = "4b71b28c763a69ad50a433ef7962a6d5fff62e44"
HARNESS_HASHES = {
    "scripts/gemini_analysis_eval.py": (
        "e0c4d687f8532fa84434fc77e1d72eb3abaca8975138f564363738b83f5f439b"
    ),
    "scripts/gemini_eval_guard.py": (
        "f24a0428862bba599e5923c95431b7ad2bbe691ffccf5595bbeb06b739312977"
    ),
}
PERMISSIONS = {"aiplatform.endpoints.predict", "serviceusage.services.use"}
CLOUD_GATES = (
    "cloud_shell", "credential_overrides", "cli_identity", "selected_project",
    "project_state", "billing", "vertex_api", "python_adc", "adc_identity",
    "adc_project_quota", "vertex_permissions", "model_metadata", "count_tokens",
)


class StopPreflight(Exception):
    pass


def verify_adc_identity(credentials, approved_identity, evidence):
    """Diagnostic introspection of this ADC token, never the CLI credential.

    Google's documented tokeninfo GET endpoint receives the token in memory over
    TLS. Do not log URLs, request objects, responses or exception text. There is no
    shell interpolation, browser navigation, credential file or token export.
    """
    import requests

    with requests.Session() as transport:
        transport.trust_env = False  # Do not send token-bearing URLs via env proxies.
        try:
            response = transport.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"access_token": credentials.token},
                timeout=20, allow_redirects=False,
            )
            if response.status_code != 200:
                raise StopPreflight("token_metadata_unavailable")
            metadata = response.json()
        except Exception:
            raise StopPreflight("token_metadata_unavailable") from None
    if not isinstance(metadata, dict):
        raise StopPreflight("token_metadata_invalid")
    scopes = set(str(metadata.get("scope", "")).split())
    evidence["adc_token_metadata"] = {
        "email_scope_present": "https://www.googleapis.com/auth/userinfo.email" in scopes,
        "cloud_platform_scope_present": "https://www.googleapis.com/auth/cloud-platform" in scopes,
        "verified_email_present": metadata.get("email_verified") in (True, "true"),
    }
    if not metadata.get("email") or metadata.get("email_verified") not in (True, "true"):
        raise StopPreflight("adc_principal_unverified_no_verified_email_in_token_metadata")
    try:
        valid = int(metadata.get("expires_in", 0)) > 0
    except (TypeError, ValueError):
        valid = False
    if not valid:
        raise StopPreflight("token_metadata_expired_or_invalid")
    if "https://www.googleapis.com/auth/cloud-platform" not in scopes:
        raise StopPreflight("adc_cloud_platform_scope_unverified")
    return metadata["email"] == approved_identity


def gcloud(*args):
    result = subprocess.run(
        ["gcloud", *args, "--quiet"], capture_output=True, text=True, timeout=30,
        check=False,
    )
    if result.returncode:
        raise StopPreflight("gcloud_failed")  # Never expose command/error output.
    return result.stdout.strip()


def harness_verified(root):
    """Read only: compare the packaged guard/harness and baseline; import neither."""
    if root is None:
        return False
    try:
        revision = subprocess.run(
            ["git", "-C", str(root), "rev-parse", "HEAD"], capture_output=True,
            text=True, timeout=10, check=False,
        )
        branch = subprocess.run(
            ["git", "-C", str(root), "branch", "--show-current"], capture_output=True,
            text=True, timeout=10, check=False,
        )
        changed = subprocess.run(
            ["git", "-C", str(root), "diff", "HEAD", "--name-only"],
            capture_output=True, text=True, timeout=10, check=False,
        )
        return (
            revision.returncode == branch.returncode == changed.returncode == 0
            and revision.stdout.strip() == BASELINE
            and branch.stdout.strip() == "feature/gemini-advisor-v2"
            and set(changed.stdout.splitlines()) <= set(HARNESS_HASHES)
            and all(
                hashlib.sha256((root / path).read_bytes()).hexdigest() == digest
                for path, digest in HARNESS_HASHES.items()
            )
            and version("google-genai") == "2.28.0"
            and version("google-adk") == "1.39.1"
        )
    except Exception:
        return False


def collect(approved_identity, harness_root=None):
    evidence = {
        "started_at_utc": datetime.now(UTC).isoformat(),
        "scope": "Cloud Shell authentication/metadata and free countTokens; no generation",
        "expected_baseline": BASELINE,
        "baseline_verified_in_cloud_shell": False,
        "approved_identity_supplied_by_operator": approved_identity,
        "project": PROJECT,
        "model": MODEL,
        "location": "global",
        "endpoint": ENDPOINT,
        "actual_serving_version": None,
        "inference_calls": 0,
        "inference_tokens": 0,
        "inference_spend_usd": 0,
        "count_tokens_requests": 0,
        "gates": {
            gate: {"result": "UNVERIFIED", "reason": "not_run"}
            for gate in CLOUD_GATES
        },
    }
    active = "cloud_shell"

    def gate(name, passed, reason, **details):
        evidence["gates"][name] = {
            "result": "PASS" if passed else "FAIL", "reason": reason, **details,
        }
        if not passed:
            raise StopPreflight(reason)

    def body(response):
        if response.status_code != 200:
            raise StopPreflight("http_" + str(response.status_code))
        data = response.json()
        if not isinstance(data, dict):
            raise StopPreflight("unexpected_response_shape")
        return data

    try:
        gate(active, os.environ.get("CLOUD_SHELL", "").lower() == "true",
             "requires_existing_authorized_cloud_shell")
        active = "credential_overrides"
        override_names = (
            "GOOGLE_APPLICATION_CREDENTIALS", "GOOGLE_API_KEY", "GEMINI_API_KEY",
            "CLOUDSDK_AUTH_ACCESS_TOKEN", "CLOUDSDK_AUTH_ACCESS_TOKEN_FILE",
            "CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE",
            "CLOUDSDK_AUTH_IMPERSONATE_SERVICE_ACCOUNT",
        )
        overrides = any(os.environ.get(name) for name in override_names)
        # Only presence is retained; never save authentication property values.
        for prop in ("auth/impersonate_service_account", "auth/access_token_file",
                     "auth/credential_file_override"):
            overrides |= gcloud("config", "get-value", prop) not in ("", "(unset)")
        gate(active, not overrides, "managed_authentication_without_overrides")
        active = "cli_identity"
        identities = json.loads(gcloud(
            "auth", "list", "--filter=status:ACTIVE", "--format=json(account)"
        ))
        matched = (
            len(identities) == 1
            and identities[0].get("account") == approved_identity
        )
        gate(active, matched, "active_cli_identity_matches_approved_identity")
        active = "selected_project"
        gate(active, gcloud("config", "get-value", "project") == PROJECT,
             "selected_project_matches")
        active = "project_state"
        project = json.loads(gcloud(
            "projects", "describe", PROJECT, "--format=json(projectId,lifecycleState)"
        ))
        gate(active, project.get("projectId") == PROJECT
             and project.get("lifecycleState") == "ACTIVE", "approved_project_active")
        active = "billing"
        billing = json.loads(gcloud(
            "billing", "projects", "describe", PROJECT,
            "--format=json(projectId,billingEnabled)"
        ))
        gate(active, billing.get("projectId") == PROJECT
             and billing.get("billingEnabled") is True, "project_billing_enabled")
        active = "vertex_api"
        services = gcloud(
            "services", "list", "--enabled", "--project=" + PROJECT,
            "--filter=config.name=aiplatform.googleapis.com",
            "--format=value(config.name)"
        )
        gate(active, services == "aiplatform.googleapis.com", "vertex_api_enabled")
        active = "python_adc"
        import google.auth
        from google.auth.transport.requests import AuthorizedSession, Request

        credentials, detected_project = google.auth.default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        transport = Request()

        def bounded_request(*args, **kwargs):
            kwargs["timeout"] = 20
            return transport(*args, **kwargs)

        credentials.refresh(bounded_request)
        gate(active, credentials.valid, "adc_resolved_and_refreshed")
        with AuthorizedSession(credentials, max_refresh_attempts=0) as session:
            active = "adc_identity"
            gate(active, verify_adc_identity(credentials, approved_identity, evidence),
                 "independently_verified_adc_identity_matches_approved_identity")
            active = "adc_project_quota"
            quota_project = getattr(credentials, "quota_project_id", None)
            gate(active, detected_project in (None, PROJECT)
                 and quota_project in (None, PROJECT),
                 "no_conflicting_adc_project_or_quota_project",
                 adc_project_matches=detected_project == PROJECT,
                 adc_project_unspecified=detected_project is None,
                 quota_project_matches=quota_project == PROJECT,
                 quota_project_unspecified=quota_project is None,
                 explicit_request_project=PROJECT)
            # Pin quota attribution in memory only; never rewrite ADC or gcloud config.
            headers = {"x-goog-user-project": PROJECT}
            active = "vertex_permissions"
            permissions = body(session.post(
                "https://cloudresourcemanager.googleapis.com/v1/projects/"
                + PROJECT + ":testIamPermissions",
                json={"permissions": sorted(PERMISSIONS)}, headers=headers,
                timeout=20, allow_redirects=False,
            ))
            granted = set(permissions.get("permissions", []))
            gate(active, PERMISSIONS <= granted,
                 "required_project_permissions_present",
                 required_permissions=sorted(PERMISSIONS))
            active = "model_metadata"
            metadata = body(session.get(
                ENDPOINT + "/v1/publishers/google/models/" + MODEL,
                headers=headers, timeout=20, allow_redirects=False,
            ))
            name = metadata.get("name", "")
            gate(active, isinstance(name, str)
                 and name.split("@")[0] == "publishers/google/models/" + MODEL,
                 "authenticated_model_catalog_metadata_accessible",
                 note="Catalog access is not inference availability or quota capacity")
            version = metadata.get("versionId")
            if isinstance(version, str) and re.fullmatch(r"[A-Za-z0-9._-]{1,80}", version):
                evidence["catalog_version_id"] = version
            active = "count_tokens"
            evidence["count_tokens_requests"] += 1
            counted = body(session.post(
                ENDPOINT + "/v1/projects/" + PROJECT
                + "/locations/global/publishers/google/models/" + MODEL + ":countTokens",
                headers=headers, timeout=20, allow_redirects=False,
                json={
                    "contents": [{"role": "user", "parts": [{"text": "Synthetic preflight."}]}],
                    "systemInstruction": {"parts": [{"text": "Read-only synthetic validation."}]},
                    "tools": [{"functionDeclarations": [{
                        "name": "read_evidence", "description": "Read synthetic evidence.",
                        "parameters": {"type": "OBJECT", "properties": {}},
                    }]}],
                    "generationConfig": {
                        "maxOutputTokens": 2048, "thinkingConfig": {"thinkingLevel": "LOW"},
                    },
                },
            ))
            tokens = counted.get("totalTokens")
            gate(active, type(tokens) is int and 0 < tokens <= 50_000,
                 "free_count_tokens_available_for_model_and_project",
                 synthetic_probe_tokens=tokens if type(tokens) is int else None)
    except Exception as error:
        if evidence["gates"][active]["result"] == "UNVERIFIED":
            # Missing identity evidence must remain explicitly UNVERIFIED.
            evidence["gates"][active] = {
                "result": "UNVERIFIED" if active == "adc_identity" else "FAIL",
                "reason": str(error) if isinstance(error, StopPreflight)
                else "check_failed_details_suppressed",
            }
        evidence["stopped_at"] = active

    estimate = (
        Decimal(4 * 50_000) * Decimal("0.30")
        + Decimal(4 * 2_048) * Decimal("2.50")
    ) / Decimal(1_000_000)
    evidence["planning"] = {
        "pricing_verified_date": "2026-10-20",
        "pricing_source": "https://cloud.google.com/gemini-enterprise-agent-platform/"
        "generative-ai/pricing",
        "pricing_tier": "Standard global text",
        "usd_per_million_input": "0.30",
        "usd_per_million_output_including_thinking": "2.50",
        "input_tokens_per_call": 50_000,
        "output_tokens_per_call": 2_048,
        "calls_including_retries": 4,
        "thinking_level": "LOW",
        "planned_estimate_usd": str(estimate),
        "allowance_usd": "0.20",
        "estimate_below_allowance": estimate < Decimal("0.20"),
        "input_token_allowance_enforced": "requires uploaded harness verification",
    }
    verified = harness_verified(harness_root)
    evidence["harness_package_verified"] = verified
    evidence["baseline_verified_in_cloud_shell"] = verified
    evidence["planning"]["input_token_allowance_enforced"] = verified
    cost_ready = verified and evidence["gates"]["count_tokens"]["result"] == "PASS"
    evidence["gates"]["cost_readiness"] = {
        "result": "PASS" if cost_ready else "UNVERIFIED",
        "reason": (
            "Packaged guard and free token counter verified; estimate is not a hard billing cap"
            if cost_ready else "Requires matching harness/SDKs and successful cloud countTokens"
        ),
    }
    evidence["cloud_checks_pass"] = all(
        evidence["gates"][name]["result"] == "PASS" for name in CLOUD_GATES
    )
    evidence["decision"] = (
        "READY FOR BOUNDED GEMINI EVALUATION"
        if evidence["cloud_checks_pass"] and cost_ready else "NOT READY — BLOCKERS LISTED"
    )
    evidence["completed_at_utc"] = datetime.now(UTC).isoformat()
    return evidence


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--approved-identity", required=True,
                        help="Previously explicitly approved Google account email")
    parser.add_argument("--out", type=Path, required=True,
                        help="New sanitized JSON evidence file; never overwrite")
    parser.add_argument("--harness-root", type=Path,
                        help="Existing Gemini v2 checkout for read-only package verification")
    args = parser.parse_args()
    if not re.fullmatch(r"[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", args.approved_identity):
        parser.error("An explicitly approved email is required")
    # Reserve a private, non-overwriting evidence file before any cloud reads.
    try:
        descriptor = os.open(args.out, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    except OSError:
        parser.error("Evidence path must be new, writable, and in an existing directory")
    logging.disable(logging.CRITICAL)
    with os.fdopen(descriptor, "w") as output:
        with open(os.devnull, "w") as quiet:
            with contextlib.redirect_stdout(quiet), contextlib.redirect_stderr(quiet):
                evidence = collect(args.approved_identity, args.harness_root)
        json.dump(evidence, output, indent=2, ensure_ascii=False)
        output.write("\n")
    for name, result in evidence["gates"].items():
        print(f"{name}: {result['result']} — {result['reason']}")
    print(evidence["decision"])
    return 0 if evidence["decision"] == "READY FOR BOUNDED GEMINI EVALUATION" else 1


if __name__ == "__main__":
    raise SystemExit(main())
