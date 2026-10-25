# Product demo publication prerequisite

These four MP4s are deliberately excluded from Git. The cards use the existing product domain
at `/media/product-demos/<id>.mp4`; these are **pending publication destinations**, not a claim
that new videos are already hosted. Captions, transcripts, chapters and authentic posters are tracked.

Before an owner-approved build, stage the exact approved files from the local collection:

```sh
node scripts/stage-product-demos.mjs /path/to/approved-video-collection
```

Run from the repository root. The script verifies all four sizes and SHA-256 values in
`manifest.json` before copying any file. It does not upload, call models or deploy.
The existing web delivery path must include these staged public assets in its build context.
No new hosting service, account, IAM change or new credentials are proposed. Existing serving
and bandwidth costs still apply; do not start paid hosting or upload without owner approval.

Publish the media and landing anchors before publishing the GitHub README watch links.
Confirm public HTTP 200/206, video MIME types, captions and actual playback after authorized
publication. Local HTTP checks cannot certify the future public destination.

The original video evidence manifest remains with the owner-held production package. Do not
publish that private provenance package or raw authenticated source screenshots.
