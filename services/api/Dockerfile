FROM cgr.dev/chainguard/python:latest-dev@sha256:87729167739190d9309588120a8ac0ffbf2eb95dd895abb9bada6bb9ecbf5a04 AS build
USER root
# Build-time download timeout only; preserve TLS verification and resolver failures.
ENV PATH=/opt/venv/bin:$PATH PIP_DEFAULT_TIMEOUT=60
RUN python -m venv /opt/venv
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8080 PYTHONPATH=/app:/app/services/api/src
WORKDIR /app
COPY pyproject.toml README.md ./
COPY domain ./domain
COPY agents ./agents
COPY tools ./tools
COPY synthetic-data ./synthetic-data
COPY services/api ./services/api
RUN python -m pip install --no-cache-dir --upgrade pip==26.2.1 \
    && python -m pip install --no-cache-dir '.[cloud]'
RUN python -m pip check

FROM build AS test
COPY . .
RUN python -m pip install --no-cache-dir '.[dev,cloud]'
ENTRYPOINT []
CMD ["python", "-m", "pytest", "-q"]

FROM build AS packaged
RUN python -m pip uninstall -y pip

# Matching vendor-patched Python 3.14 runtime; no shell, pip or build tools.
FROM cgr.dev/chainguard/python:latest@sha256:be59f7abb600892c78e6ff0fe1a8f39549da13302dc003c8a5eb1c14b03d995c AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8080 PYTHONPATH=/app:/app/services/api/src PATH=/opt/venv/bin:$PATH
WORKDIR /app
COPY --from=packaged /opt/venv /opt/venv
COPY --from=build /app /app
USER 65532:65532
EXPOSE 8080
ENTRYPOINT []
CMD ["python", "/app/services/api/start.py"]
