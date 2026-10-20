#!/bin/bash
# Restart the isolated QA API (port 8100) so the in-memory demo state is clean.
pkill -f "port 8100" ; sleep 1
cd /Users/jincenmathew/Downloads/Intuit/movebooks-v2-phase1-closure
MOVEBOOKS_CORS_ORIGINS='["http://127.0.0.1:3100","http://localhost:3100","http://127.0.0.1:3101","http://localhost:3101"]' \
  nohup .venv/bin/uvicorn movebooks_api.main:app --app-dir services/api/src --host 127.0.0.1 --port 8100 --log-level warning > "$(dirname "$0")/api.log" 2>&1 &
for i in $(seq 30); do curl -sf 127.0.0.1:8100/healthz >/dev/null && exit 0; sleep 0.5; done; echo "API did not start"; exit 1
