"""Start a disposable loopback-only emulator and run only local Phase B tests.

No downloads, ADC, gcloud, cloud endpoint, existing emulator or export/import is used.
Supply an already installed portable Java and the existing Firestore emulator JAR.
The emulator's single demo project and ephemeral named databases die with the process.
Firebase web SDK checks enforce the supplied deny-all rules only in this emulator.
This does not validate IAM, deployed Security Rules/indexes, or deployed services.
"""

import argparse
import os
import socket
import subprocess
import sys
import tempfile
import time
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--java", type=Path, required=True)
    parser.add_argument("--jar", type=Path, required=True)
    parser.add_argument(
        "--node",
        type=Path,
        required=True,
        help="Existing Node runtime for direct-client rules tests",
    )
    args = parser.parse_args()
    if not all(path.is_file() for path in (args.java, args.jar, args.node)):
        parser.error("Existing Java, emulator JAR and Node required; no auto-install")
    root = Path(__file__).resolve().parents[1]
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]
    env = {
        k: v
        for k, v in os.environ.items()
        if not k.startswith(
            (
                "GOOGLE_",
                "GCLOUD_",
                "GCP_",
                "FIREBASE_",
                "FIRESTORE_",
                "MOVEBOOKS_",
                "OTEL_",
            )
        )
        and k not in {"DATABASE_URL", "K_SERVICE"}
    }
    env.update(
        {
            "FIRESTORE_EMULATOR_HOST": f"127.0.0.1:{port}",
            "GCLOUD_PROJECT": "demo-movebooks-local",
            "MOVEBOOKS_LOCAL_FIRESTORE_TESTS": "1",
        }
    )
    command = [
        str(args.java.resolve()),
        "-jar",
        str(args.jar.resolve()),
        "--host",
        "127.0.0.1",
        "--port",
        str(port),
        "--project_id",
        "demo-movebooks-local",
        "--single_project_mode",
        "--single_project_mode_error",
        "--rules",
        str(root / "infra/firestore/firestore.rules"),
    ]
    with tempfile.TemporaryDirectory(prefix="movebooks-local-firestore-") as temporary:
        with (Path(temporary) / "emulator.log").open("w+") as log:
            process = subprocess.Popen(command, cwd=temporary, env=env, stdout=log, stderr=log)
            try:
                deadline = time.monotonic() + 30
                while time.monotonic() < deadline:
                    if process.poll() is not None:
                        log.seek(0)
                        raise RuntimeError("Local emulator failed: " + log.read()[-4000:])
                    try:
                        with socket.create_connection(("127.0.0.1", port), timeout=0.1):
                            break
                    except OSError:
                        time.sleep(0.1)
                else:
                    raise RuntimeError("Local emulator did not become ready; no cloud fallback")
                print(
                    f"Local emulator only: {env['FIRESTORE_EMULATOR_HOST']}; demo project; no ADC",
                    flush=True,
                )
                status = subprocess.run(
                    [
                        sys.executable,
                        "-m",
                        "pytest",
                        "-q",
                        "-p",
                        "no:cacheprovider",
                        "tests/test_firestore_emulator_integration.py",
                        "tests/test_migration_activity_emulator.py",
                    ],
                    cwd=root,
                    env=env,
                    timeout=120,
                    check=False,
                ).returncode
                if status:
                    return status
                return subprocess.run(
                    [str(args.node.resolve()), "scripts/test_firestore_emulator_rules.cjs"],
                    cwd=root,
                    env=env,
                    timeout=60,
                    check=False,
                ).returncode
            finally:
                process.terminate()
                try:
                    process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait(timeout=5)


if __name__ == "__main__":
    raise SystemExit(main())
