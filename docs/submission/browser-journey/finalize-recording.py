"""Copy the authentic screencast unchanged, probe it, export QA stills and finalize captions."""

import argparse
import hashlib
import json
import re
import shutil
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument(
    "--accept-visual-qa",
    action="store_true",
    help="Set only after inspecting the exported representative frames.",
)
args = parser.parse_args()
folder = Path(__file__).resolve().parent
root = folder.parents[2]
recording = folder / "recording"
evidence = json.loads((recording / "browser-evidence.json").read_text())
assert evidence["status"] == "PASSED"
target = root / "docs/submission/assets/working-product-demo.webm"
shutil.copyfile(evidence["raw_video"], target)
ffmpeg = "/Users/jincenmathew/Library/Caches/ms-playwright/ffmpeg-1011/ffmpeg-mac"
probe = subprocess.run([ffmpeg, "-hide_banner", "-i", str(target)], capture_output=True, text=True)
(recording / "video-metadata.txt").write_text(probe.stderr)
match = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", probe.stderr)
assert match, probe.stderr
duration = int(match[1]) * 3600 + int(match[2]) * 60 + float(match[3])
assert 180 <= duration <= 240, duration
qa = recording / "qa-frames"
qa.mkdir(exist_ok=True)
for second in [5, 15, 24, 40, 55, 73, 94, 104, 122, 133, 155, 164, 183, 198, 213, 229]:
    subprocess.run(
        [
            ffmpeg,
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-ss",
            str(second),
            "-i",
            str(target),
            "-frames:v",
            "1",
            str(qa / f"frame-{second:03}.png"),
        ],
        check=True,
    )


def stamp(second):
    ms = round(second * 1000)
    return f"{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}"


narration = [event for event in evidence["events"] if event["event"] == "Narration"]
srt = "\n".join(
    f"{index + 1}\n{stamp(event['at_seconds'])} --> "
    f"{stamp(narration[index + 1]['at_seconds'] if index + 1 < len(narration) else duration)}\n"
    f"{event['caption']}\n"
    for index, event in enumerate(narration)
)
(recording / "working-product-demo.srt").write_text(srt)
(root / "docs/submission/assets/working-product-demo.srt").write_text(srt)
manifest = {
    "status": "PASSED" if args.accept_visual_qa else "PENDING_VISUAL_QA",
    "recording_git_head": evidence["candidate"],
    "api_runtime_commit": "fffd14c246dcec58347ac2b3155e2cf51b2b9662",
    "later_source_note": (
        "Read-only advisory operations changes were accepted separately against API 1a24a2c; "
        "they were not loaded into the API during this video."
    ),
    "local_origin": "http://localhost:3000",
    "api_origin": "http://127.0.0.1:8000",
    "runtime": (
        "Explicit local demo identity; deterministic advice and independent review; "
        "no live Gemini or production provider writes."
    ),
    "synthetic_session_id": evidence["session_id"],
    "acceptance_checks_passed": len(evidence["checks"]),
    "timed_ui_run_seconds": evidence["finished_seconds"],
    "encoded_video_duration_seconds": duration,
    "official_duration_requirement_seconds": [180, 240],
    "duration_note": (
        "The encoded screencast retains the final architecture frame "
        "beyond the 222-second UI clock. "
        "The final sidecar caption covers this observed tail."
    ),
    "video_file": "docs/submission/assets/working-product-demo.webm",
    "video_bytes": target.stat().st_size,
    "video_sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
    "srt_file": "docs/submission/assets/working-product-demo.srt",
    "caption_method": (
        "Narration layer visible during authentic UI capture. Sidecar timing follows observed "
        "narration events and covers the encoded final hold. No financial results were inserted."
    ),
    "capture_method": (
        "Fixed 1440x1000 viewport; 25 fps VP8; viewport-only screenshots during recording. "
        "The Next.js development indicator was hidden."
    ),
    "qa": (
        "Representative frames were inspected for readable actual UI, approvals, fallback labels, "
        "final accounting evidence and architecture boundaries."
        if args.accept_visual_qa
        else "Inspect the exported frames before accepting."
    ),
    "qa_frames": [str(item.relative_to(root)) for item in sorted(qa.iterdir())],
}
(recording / "video-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
print(
    json.dumps(
        {
            key: manifest[key]
            for key in ["status", "encoded_video_duration_seconds", "video_bytes", "video_sha256"]
        },
        indent=2,
    )
)
