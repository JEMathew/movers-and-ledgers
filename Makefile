.PHONY: setup dev dev-web dev-api test lint format

PYTHON ?= python3.11

setup:
	cd apps/web && npm install
	$(PYTHON) -m venv .venv && .venv/bin/pip install -e '.[dev]'

# Local API and web together. The web port is pinned to 3000: the API's local CORS allows only
# that port, and a silently moved dev server makes every API call fail with "Failed to fetch".
dev:
	@trap 'kill 0' INT TERM EXIT; $(MAKE) dev-api & $(MAKE) dev-web & wait

dev-web:
	cd apps/web && npm run dev

dev-api:
	.venv/bin/uvicorn movebooks_api.main:app --app-dir services/api/src --reload

test:
	.venv/bin/pytest
	cd apps/web && npm run typecheck
	cd apps/web && npm run test

lint:
	.venv/bin/ruff check .
	cd apps/web && npm run lint

format:
	.venv/bin/ruff format .
