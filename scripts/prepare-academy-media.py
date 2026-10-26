#!/usr/bin/env python3
"""Validate existing recordings; derive posters/VTT, never generate audio or video.

Input JSON maps lesson IDs to {"video": "/absolute/source.mp4", "captions": "/absolute/source.srt"}.
Output must be a new directory outside the repository. Preview and publication flags stay false until validation. Exact hash-pinned corrected Gemini cuts are accepted; original review cuts remain excluded.
Requires ffprobe and ffmpeg already installed. No network, uploads, or spending.
"""
import argparse
import hashlib
import json
import pathlib
import re
import shutil
import subprocess

EXPECTED = {"01": 88, "02": 70, "03": 94, "04": 106, "05": 103, "06": 91, "07": 90, "08": 90, "09": 178}
REVIEW = {"04", "05", "09"}


def run(*args):
    return subprocess.run(args, check=True, capture_output=True, text=True)


def digest(file):
    checksum = hashlib.sha256()
    with file.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            checksum.update(chunk)
    return checksum.hexdigest()


def seconds(value):
    h, m, rest = value.replace(",", ".").split(":")
    return int(h) * 3600 + int(m) * 60 + float(rest)


def convert_captions(source, duration):
    text = source.read_text(encoding="utf-8-sig").replace("\r\n", "\n").strip()
    cues = []
    previous_end = 0.0
    for block in re.split(r"\n\s*\n", text):
        lines = block.splitlines()
        if lines and lines[0].strip().isdigit():
            lines = lines[1:]
        if len(lines) < 2:
            raise ValueError("Empty or malformed subtitle cue")
        match = re.fullmatch(r"(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})", lines[0].strip())
        if not match:
            raise ValueError("Unsupported SRT timestamp")
        start, end = map(seconds, match.groups())
        if not 0 <= previous_end <= start < end <= duration + .1:
            raise ValueError("Out-of-order, overlapping, or out-of-duration captions")
        previous_end = end
        cues.append(lines[0].replace(",", ".") + "\n" + "\n".join(lines[1:]))
    if not cues:
        raise ValueError("No captions")
    return "WEBVTT\n\n" + "\n\n".join(cues) + "\n", len(cues)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_map", type=pathlib.Path)
    parser.add_argument("output", type=pathlib.Path)
    args = parser.parse_args()
    repo = pathlib.Path(__file__).resolve().parents[1]
    output = args.output.resolve()
    if output.is_relative_to(repo) or output.exists():
        parser.error("Use a new media directory outside the repository")
    reviewed = json.loads((repo / "apps/web/lib/academy/reviewed-media.json").read_text())
    inputs = json.loads(args.source_map.read_text())
    if not inputs or set(inputs) - set(EXPECTED):
        parser.error("Input must contain known lesson IDs only")
    for binary in ("ffprobe", "ffmpeg"):
        if not shutil.which(binary):
            parser.error(f"{binary} must already be installed")
    output.mkdir(parents=True)
    manifest = {}
    for lesson, entry in inputs.items():
        source, captions = pathlib.Path(entry["video"]), pathlib.Path(entry["captions"])
        if not source.is_absolute() or not captions.is_absolute():
            raise ValueError("Source paths must be absolute")
        probe = json.loads(run("ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(source)).stdout)
        video = next(stream for stream in probe["streams"] if stream["codec_type"] == "video")
        audio = next(stream for stream in probe["streams"] if stream["codec_type"] == "audio")
        duration = float(probe["format"]["duration"])
        if "mp4" not in probe["format"]["format_name"] or video["codec_name"] != "h264" or audio["codec_name"] != "aac" or (video["width"], video["height"]) != (1920, 1080):
            raise ValueError(f"{lesson}: expected MP4, H.264, AAC, 1920x1080")
        corrected = lesson in REVIEW and digest(source) == reviewed.get(lesson)
        if not corrected and abs(duration - EXPECTED[lesson]) > 2:
            raise ValueError(f"{lesson}: duration differs from inventory; verify lesson identity")
        run("ffmpeg", "-v", "error", "-xerror", "-i", str(source), "-f", "null", "-")
        vtt, count = convert_captions(captions, duration)
        entry = {"durationSeconds": duration, "sourceSha256": digest(source), "srtSha256": digest(captions), "captionCueCount": count,
                 "technicalChecksPassed": True, "previewApproved": False, "publicationApproved": False, "captionsVerified": False,
                 "sourceStatus": "review-cut" if lesson in REVIEW and not corrected else "completed", "humanChecks": "pending narration, sync, UI fidelity, sensitive-content review"}
        if lesson not in REVIEW or corrected:
            shutil.copyfile(source, output / f"{lesson}.mp4")
            (output / f"{lesson}.vtt").write_text(vtt)
            shutil.copyfile(captions, output / f"{lesson}.srt")
            transcript = " ".join(line for line in vtt.splitlines() if line and line != "WEBVTT" and " --> " not in line) + "\n"
            (output / f"{lesson}.txt").write_text(transcript)
            run("ffmpeg", "-v", "error", "-ss", "3", "-i", str(source), "-frames:v", "1", "-vf", "scale=960:-1", str(output / f"{lesson}.jpg"))
            entry["vttSha256"] = digest(output / f"{lesson}.vtt")
            entry["posterSha256"] = digest(output / f"{lesson}.jpg")
        manifest[lesson] = entry
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print("Technical validation complete. Only original approved or hash-pinned corrected binaries were copied. Caption/content and publication gates remain closed.")


if __name__ == "__main__":
    main()
