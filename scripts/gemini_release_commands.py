"""Validate a reviewed release manifest and PRINT commands. Never execute cloud operations."""

import argparse
import json
import re
import shlex


def commands(manifest):
    if not isinstance(manifest, dict):
        raise ValueError("Release manifest must be an object")
    gates = (
        "ux_accepted",
        "security_accepted",
        "synthetic_data_boundary_accepted",
        "hosted_candidate_approved",
        "artifact_source_verified",
    )
    missing = [name for name in gates if manifest.get(name) is not True]
    if missing:
        raise ValueError("BLOCKED: " + ", ".join(missing))
    if manifest.get("project") != "movebooks-ai" or manifest.get("region") != "asia-southeast1":
        raise ValueError("Unapproved project or region")
    if manifest.get("artifact_analysis_enabled") is not False:
        raise ValueError("This runbook permits only an analysis-disabled web artifact")
    if not re.fullmatch(r"[0-9a-f]{40}", manifest.get("source_commit", "")):
        raise ValueError("Immutable combined source required")
    tag = manifest.get("candidate_tag", "")
    suffix = manifest.get("revision_suffix", "")
    if not re.fullmatch(r"tb-[0-9a-f]{7}", tag) or not re.fullmatch(
        re.escape(tag) + r"-[0-9]{4}", suffix
    ):
        raise ValueError("Distinct Track B candidate tag and revision suffix required")
    if tag != "tb-" + manifest["source_commit"][:7]:
        raise ValueError("Candidate tag must identify the reviewed source")
    if not isinstance(manifest.get("approval_reference"), str) or not re.fullmatch(
        r"[A-Za-z0-9_./:-]{1,120}", manifest["approval_reference"]
    ):
        raise ValueError("Separate approval reference required; manifest booleans are not approval")
    common = [
        "gcloud", "--project=movebooks-ai", "--account=jeasom@gmail.com", "--quiet",
        "run",
    ]
    output = {"preflight": [], "deploy_no_traffic": [], "rollback": []}
    for role in ("api", "web"):
        service = f"movebooks-beta-{role}"
        digest = manifest.get(f"{role}_image", "")
        if not re.fullmatch(
            rf"asia-southeast1-docker\.pkg\.dev/movebooks-ai/movebooks-beta/{role}"
            r"@sha256:[0-9a-f]{64}", digest
        ):
            raise ValueError(f"Published immutable {role} image required")
        revision = manifest.get(f"{role}_rollback_revision", "")
        if not re.fullmatch(re.escape(service) + r"-[a-z0-9-]+", revision):
            raise ValueError("Verified existing rollback revision required")
        generation = manifest.get(f"{role}_expected_generation")
        if type(generation) is not int or generation < 1:
            raise ValueError("Fresh service generation required")
        base = common + ["services", "describe", service, "--region=asia-southeast1"]
        output["preflight"].append(
            "test \"$(" + shlex.join(base + ["--format=value(metadata.generation)"])
            + f')\" = "{generation}"'
        )
        deploy = common + [
            "deploy", service, "--region=asia-southeast1", "--image=" + digest,
            "--revision-suffix=" + suffix, "--tag=" + tag, "--no-traffic",
        ]
        if role == "api":
            deploy += [
                "--update-env-vars=MOVEBOOKS_MODEL_PROVIDER_MODE=deterministic-only,"
                "MOVEBOOKS_SYNTHETIC_ANALYSIS_ENABLED=false,"
                "MOVEBOOKS_SYNTHETIC_BETA_AUTHORIZED=false,"
                "MOVEBOOKS_MODEL_CONTROLS_BACKEND=disabled"
            ]
        output["deploy_no_traffic"].append(shlex.join(deploy))
        output["rollback"].append(shlex.join(common + [
            "services", "update-traffic", service, "--region=asia-southeast1",
            "--to-revisions=" + revision + "=100", "--remove-tags=" + tag,
        ]))
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest")
    args = parser.parse_args()
    try:
        with open(args.manifest) as file:
            result = commands(json.load(file))
    except (OSError, ValueError, TypeError) as error:
        parser.exit(2, f"{error}\n")
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
