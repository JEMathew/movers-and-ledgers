# Migration tools

`execution.py` contains the deterministic, provider-neutral Beta execution boundary: batch extraction,
canonical transformation, validation, idempotent synthetic-target loading, checkpoints, progress,
pause/resume, and minimized audit events. Agents may invoke these tools but cannot bypass their
validation, idempotency, retry, or approval results. No production accounting-provider write exists.
