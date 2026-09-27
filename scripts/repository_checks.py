"""Bounded tracked/new text scan and repository-relative Markdown link checks; no network."""

import re
import subprocess
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
paths = (
    subprocess.check_output(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"], cwd=ROOT
    )
    .decode()
    .split("\0")
)
patterns = [
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(r"\bgh[pousr]_[A-Za-z0-9]{30,}\b"),
    re.compile(r"\bAIza[A-Za-z0-9_-]{35}\b"),
    re.compile(r'"type"\s*:\s*"service_account"'),
]
errors, markdown, scanned = [], 0, 0
for name in sorted(set(paths) - {""}):
    path = ROOT / name
    if not path.is_file() or path.stat().st_size > 2_000_000:
        continue
    try:
        text = path.read_text()
    except UnicodeError:
        continue
    scanned += 1
    if any(pattern.search(text) for pattern in patterns):
        errors.append(f"Potential credential pattern: {name} (value suppressed)")
    if path.suffix != ".md":
        continue
    markdown += 1
    for target in re.findall(r"\]\(([^\s)]+)(?:\s+[^)]*)?\)", text):
        target = unquote(target.strip("<>").split("#")[0])
        if not target or re.match(r"[a-zA-Z][a-zA-Z0-9+.-]*:", target) or target.startswith("/"):
            continue
        if not (path.parent / target).exists():
            errors.append(f"Missing Markdown target: {name}: {target}")
for error in errors:
    print(error)
print(f"Checked {markdown} Markdown files and {scanned} text files; {len(errors)} findings.")
raise SystemExit(bool(errors))
