"""Real container gates; exits nonzero without Docker. Synthetic disposable resources only.

Run after building movebooks-api:validation and movebooks-web:validation.
No host mounts, cloud credentials, default Docker context changes or external writes.
"""

import argparse
import json
import os
import re
import subprocess
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4


class Gate:
    def __init__(self, docker):
        self.docker = docker
        self.prefix = f"movebooks-gate-{uuid4().hex[:10]}"
        self.containers = []
        self.network = self.prefix

    def cli(self, *args, timeout=120, check=True):
        result = subprocess.run(
            [self.docker, *args], capture_output=True, text=True, timeout=timeout
        )
        if check and result.returncode:
            raise RuntimeError(f"Docker {args[0]} failed: {result.stderr[-1500:]}")
        return result.stdout.strip()

    def start(self, suffix, image, port=None, env=(), extra=(), command=()):
        name = f"{self.prefix}-{suffix}"
        self.containers.append(name)
        args = [
            "run",
            "-d",
            "--name",
            name,
            "--network",
            self.network,
            "--cap-drop=ALL",
            "--security-opt=no-new-privileges",
            *extra,
        ]
        if port:
            args += ["-p", f"127.0.0.1::{port}"]
        for value in env:
            args += ["-e", value]
        self.cli(*args, image, *command)
        if port:
            binding = self.cli("port", name, str(port)).splitlines()[0]
            return name, f"http://127.0.0.1:{binding.rsplit(':', 1)[1]}"
        return name, None

    def stop(self, name, graceful=False):
        self.cli("stop", "--time", "12", name, timeout=20)
        state = json.loads(self.cli("inspect", "--format", "{{json .State}}", name))
        assert state["ExitCode"] == 0, (name, state["ExitCode"])
        assert not state["OOMKilled"]
        if graceful:
            assert "Application shutdown complete" in self.cli("logs", name) + self.logs(name)

    def logs(self, name):
        result = subprocess.run([self.docker, "logs", name], capture_output=True, text=True)
        return result.stdout + result.stderr

    def cleanup(self):
        for name in reversed(self.containers):
            self.cli("rm", "-f", "-v", name, check=False)
        self.cli("network", "rm", self.network, check=False)


def request(base, path, body=None, method="GET", owner=None, key=None, expected=200):
    headers = {"Content-Type": "application/json"}
    if owner:
        headers["Authorization"] = f"Bearer {owner}"
    if key:
        headers["Idempotency-Key"] = key
    req = urllib.request.Request(
        base + path,
        data=json.dumps(body).encode() if body is not None else None,
        headers=headers,
        method=method,
    )
    try:
        response = urllib.request.urlopen(req, timeout=15)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        content = response.read().decode()
        assert response.status == expected, (path, response.status, expected, content[:200])
        try:
            return json.loads(content)
        except ValueError:
            return content


def until(check, timeout=90):
    deadline = time.monotonic() + timeout
    while True:
        try:
            value = check()
            if value:
                return value
        except (OSError, AssertionError):
            pass
        if time.monotonic() >= deadline:
            raise TimeoutError("Runtime readiness condition not met")
        time.sleep(0.25)


def run(gate):
    gate.cli("info", timeout=20)
    gate.cli("network", "create", gate.network)
    gate.cli(
        "build",
        "-f",
        "tests/runtime_harness/Dockerfile",
        "-t",
        "movebooks-harness:validation",
        ".",
        timeout=180,
    )
    api, api_url = gate.start(
        "api",
        "movebooks-api:validation",
        18761,
        env=["PORT=18761", "MOVEBOOKS_ENV=test"],
        extra=["--read-only", "--tmpfs", "/tmp"],
    )
    web, web_url = gate.start(
        "web",
        "movebooks-web:validation",
        18762,
        env=["PORT=18762"],
        extra=["--read-only", "--tmpfs", "/tmp"],
    )
    for name, base in [(api, api_url), (web, web_url)]:
        until(lambda base=base: request(base, "/healthz"))
        assert gate.cli("exec", name, "id", "-u") != "0"
    assert request(api_url, "/readyz")["status"] == "ready"
    request(
        api_url,
        "/v1/migration-sessions",
        {"sample_company_id": "harbor-light-migrate-demo"},
        method="POST",
        owner="demo-user",
        expected=201,
    )
    request(api_url, "/v1/migration-sessions", {}, method="POST", expected=401)
    html = request(web_url, "/")
    assets = re.findall(r'(?:src|href)="(/_next/static/[^"?]+)', html)
    assert assets, "Production HTML must reference bundled assets"
    request(web_url, assets[0])
    request(web_url, "/api/auth/demo", expected=404)
    gate.cli(
        "exec",
        web,
        "node",
        "-e",
        "const fs=require('fs'); for(const p of ['/app/tests','/app/.env','/app/.git']) "
        "{if(fs.existsSync(p)) process.exit(1)}",
    )
    assert (
        gate.cli(
            "exec",
            api,
            "python",
            "-c",
            "from pathlib import Path; assert not Path('/validation').exists(); "
            "assert not Path('/app/tests').exists(); assert not Path('/app/.env').exists(); "
            "assert Path('/app/synthetic-data').is_dir(); print('runtime-files-ok')",
        )
        == "runtime-files-ok"
    )
    for suffix, env in [
        ("missing-config", ["MOVEBOOKS_ENV=cloud-dev"]),
        ("cloud-default", ["K_SERVICE=test-cloud-run"]),
        ("legacy-url", ["DATABASE_URL=credential-marker-invalid-url"]),
    ]:
        name, _ = gate.start(suffix, "movebooks-api:validation", env=env)
        code = gate.cli("wait", name, timeout=30)
        assert code != "0"
        assert "credential-marker" not in gate.logs(name)
    gate.stop(api, graceful=True)
    gate.stop(web)
    print(
        "PASS production images: supplied PORT, health, readiness, non-root, "
        "read-only, assets, config, SIGTERM",
        flush=True,
    )

    db, _ = gate.start(
        "postgres",
        "postgres:17-alpine",
        env=[
            "POSTGRES_USER=contract",
            "POSTGRES_PASSWORD=ephemeral-ci-only",
            "POSTGRES_DB=contract",
        ],
        # The official PostgreSQL entrypoint must initialize/chown its test volume.
        extra=["--cap-add=CHOWN", "--cap-add=SETUID", "--cap-add=SETGID", "--cap-add=DAC_OVERRIDE"],
    )
    until(
        lambda: (
            "accepting connections"
            in gate.cli("exec", db, "pg_isready", "-U", "contract", check=False)
        )
    )
    env = [
        "MOVEBOOKS_ENV=test",
        "PORT=18763",
        f"MOVEBOOKS_TEST_DATABASE_URL=postgresql+pg8000://contract:ephemeral-ci-only@{db}:5432/contract",
    ]
    malformed, _ = gate.start(
        "malformed-test-url",
        "movebooks-harness:validation",
        env=["MOVEBOOKS_ENV=test", "MOVEBOOKS_TEST_DATABASE_URL=credential-marker-invalid"],
    )
    assert gate.cli("wait", malformed, timeout=30) != "0"
    assert "credential-marker" not in gate.logs(malformed)
    for index in range(2):
        schema, _ = gate.start(
            f"schema-{index}",
            "movebooks-harness:validation",
            env=env,
            command=["python", "/validation/app.py", "--schema"],
        )
        assert gate.cli("wait", schema, timeout=30) == "0", gate.logs(schema)
    active, base = gate.start("journey-1", "movebooks-harness:validation", 18763, env=env)
    until(lambda: request(base, "/readyz"))
    session = request(
        base,
        "/v1/migration-sessions",
        {"sample_company_id": "harbor-light-migrate-demo"},
        method="POST",
        owner="runtime-owner-a",
        expected=201,
    )
    root = f"/v1/migration-sessions/{session['id']}"

    def get(owner="runtime-owner-a", expected=200):
        return request(base, root, owner=owner, expected=expected)

    def post(path, body=None, key=None, expected=200):
        return request(
            base,
            root + path,
            body,
            method="POST",
            owner="runtime-owner-a",
            key=key,
            expected=expected,
        )

    for stage in ["discovery", "assessment", "plan", "mappings"]:
        post(f"/{stage}")
    for mapping in get()["mappings"]:
        post(f"/mappings/{mapping['id']}/approve", {"comment": "Synthetic governed review"})
    before = get()
    assert before["human_decisions"] and before["events"] and before["plan"]
    gate.stop(active, graceful=True)
    active, base = gate.start("journey-2", "movebooks-harness:validation", 18763, env=env)
    until(lambda: request(base, "/readyz"))
    assert get() == before
    get("runtime-owner-b", expected=404)
    request(base, root, expected=401)
    execution = post("/migration/start", key="persisted-migration")
    assert execution["status"] == "RESOLVING" and execution["checkpoints"]
    checkpoint = execution["checkpoints"][0]
    before = get()
    gate.stop(active, graceful=True)
    active, base = gate.start("journey-3", "movebooks-harness:validation", 18763, env=env)
    until(lambda: request(base, "/readyz"))
    assert get() == before
    assert post("/migration/start", key="persisted-migration") == execution
    post("/migration/start", key="changed-key", expected=409)
    post("/migration/retry", expected=409)
    post(f"/migration/resolutions/{execution['resolutions'][-1]['id']}/decision", {"approve": True})
    completed = post("/migration/resume")
    assert completed["status"] == "MIGRATION_COMPLETE"
    assert completed["checkpoints"][0] == checkpoint
    assert len(completed["loaded_idempotency_keys"]) == 8
    assert post("/validation")["report"]["status"] == "VERIFIED"
    config = post("/configuration")["configuration"]
    for proposal in config["proposals"]:
        if proposal["state"] != "APPLIED":
            post(f"/configuration/{proposal['id']}/decision", {"action": "approve"})
    assert post("/configuration/apply")["ready_for_onboarding"]
    onboard = post("/onboarding")
    for task in onboard["tasks"]:
        if task["approval_required"]:
            post(f"/onboarding/tasks/{task['id']}/decision", {"action": "approve"})
    post("/fpu/task", {"customer_id": "customer-001", "product_id": "product-001"})
    post("/fpu/decision", {"action": "approve"})
    assert post("/fpu/execute", key="persisted-invoice")["verified_fpu"]
    final = get()
    assert final["onboarding"]["fpu"]["invoice"]["total"] == "107.25"
    for decision in final["human_decisions"]:
        assert decision["actor"] == "runtime-owner-a"
        assert all(
            decision[k]
            for k in ("role", "stage", "decision", "evidence", "occurred_at", "affected_entity")
        )

    gate.cli("stop", "--time", "10", db)
    assert request(base, "/healthz")["status"] == "ok"
    request(base, "/readyz", expected=503)
    get(expected=503)
    request(
        base,
        "/v1/migration-sessions",
        {"sample_company_id": "harbor-light-migrate-demo"},
        method="POST",
        owner="runtime-owner-a",
        expected=503,
    )
    gate.cli("start", db)
    until(lambda: request(base, "/readyz"))
    assert get() == final, "DB outage must not recreate or rewind state"

    with ThreadPoolExecutor(max_workers=1) as pool:
        operation = pool.submit(request, base, "/test/bounded-operation")
        until(lambda: "BOUNDED_OPERATION_STARTED" in gate.logs(active), timeout=10)
        gate.stop(active, graceful=True)
        assert operation.result()["completed"]
    active, base = gate.start("journey-4", "movebooks-harness:validation", 18763, env=env)
    until(lambda: request(base, "/readyz"))
    assert get() == final
    post("/fpu/execute", key="persisted-invoice")
    assert get() == final
    assert len(final["onboarding"]["invoices"]) == len(final["onboarding"]["journals"]) == 1
    get("runtime-owner-b", expected=404)
    gate.stop(active, graceful=True)
    print(
        "PASS PostgreSQL container journey: exact restart/resume, checkpoints, decisions, "
        "audit, FPU, owner isolation, replay, outage/recovery, in-flight SIGTERM",
        flush=True,
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--docker", default=os.environ.get("DOCKER_BIN", "docker"))
    args = parser.parse_args()
    gate = Gate(args.docker)
    try:
        run(gate)
    finally:
        gate.cleanup()


if __name__ == "__main__":
    main()
