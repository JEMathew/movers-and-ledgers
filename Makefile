.PHONY: setup dev-web dev-api test lint format

PYTHON ?= python3.11

setup:
	cd apps/web && npm install
	$(PYTHON) -m venv .venv && .venv/bin/pip install -e '.[dev]'

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
