"""Pure command rendering: no gcloud, credentials, model, network or deployment."""

from copy import deepcopy

import pytest

from scripts.gemini_release_commands import commands


def approved_fixture():
    return {
        "project": "movebooks-ai", "region": "asia-southeast1",
        "source_commit": "a" * 40, "candidate_tag": "tb-aaaaaaa",
        "revision_suffix": "tb-aaaaaaa-1200", "approval_reference": "test-only",
        "ux_accepted": True, "security_accepted": True,
        "synthetic_data_boundary_accepted": True, "hosted_candidate_approved": True,
        "artifact_source_verified": True, "artifact_analysis_enabled": False,
        **{
            f"{role}_image": f"asia-southeast1-docker.pkg.dev/movebooks-ai/"
            f"movebooks-beta/{role}@sha256:" + "b" * 64
            for role in ("api", "web")
        },
        **{f"{role}_rollback_revision": f"movebooks-beta-{role}-old" for role in ("api", "web")},
        "api_expected_generation": 48, "web_expected_generation": 60,
    }


@pytest.mark.parametrize("field,value", [
    ("ux_accepted", False), ("security_accepted", "true"),
    ("hosted_candidate_approved", None), ("synthetic_data_boundary_accepted", False),
    ("artifact_source_verified", False), ("artifact_analysis_enabled", True),
    ("project", "other"), ("region", "global"), ("api_image", "image:latest"),
    ("web_image", "image:latest"), ("source_commit", "main"),
    ("candidate_tag", "cand"), ("revision_suffix", "tb-aaaaaaa;echo bad"),
    ("approval_reference", "$(unsafe)"), ("api_expected_generation", True),
    ("web_rollback_revision", "other-service-old"),
    ("source_commit", "c" * 40),
])
def test_unapproved_incomplete_or_injected_manifest_produces_no_commands(field, value):
    manifest = approved_fixture()
    manifest[field] = value
    with pytest.raises(ValueError):
        commands(manifest)


@pytest.mark.parametrize("manifest", [None, [], "not-a-manifest"])
def test_nonobject_manifests_fail_closed(manifest):
    with pytest.raises(ValueError):
        commands(manifest)


def test_candidate_commands_never_enable_models_change_iam_or_shift_live_traffic():
    manifest = approved_fixture()
    original = deepcopy(manifest)
    result = commands(manifest)
    assert manifest == original
    deploy = result["deploy_no_traffic"]
    assert len(deploy) == 2 and all("--no-traffic" in c for c in deploy)
    assert "deterministic-only" in deploy[0]
    assert "SYNTHETIC_BETA_AUTHORIZED=false" in deploy[0]
    assert "SYNTHETIC_ANALYSIS_ENABLED=false" in deploy[0]
    assert all("iam" not in c and "allow-unauthenticated" not in c for c in deploy)
    assert all("--to-revisions" not in c for c in deploy)
    assert len(result["preflight"]) == len(result["rollback"]) == 2
    assert all("--remove-tags=tb-aaaaaaa" in c for c in result["rollback"])
