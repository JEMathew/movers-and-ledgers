FROM cgr.dev/chainguard/python:latest-dev@sha256:96cb9c155159daf6b21e70555f244081909ff161c5589112ddf308624c1a1c77 AS build
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
    && python -m pip install --no-cache-dir '.[cloud,agents]'
RUN python -m pip check

FROM build AS test
COPY . .
RUN python -m pip install --no-cache-dir '.[dev,cloud]'
ENTRYPOINT []
CMD ["python", "-m", "pytest", "-q"]

FROM build AS packaged
RUN python -m pip uninstall -y pip

# Matching vendor-patched Python 3.14 runtime; no shell, pip or build tools.
FROM cgr.dev/chainguard/python:latest@sha256:1961420e5f93bd056d4b0b40eca12cdf01b3ed09177aa4d6ec71fab38cbf158f AS runtime-base
# Update only certificate data while retaining the validated Python runtime.
FROM cgr.dev/chainguard/wolfi-base@sha256:05d24163df148be377275af8374c16523a1dc7e19bf4f1c689784791553c5e45 AS runtime-trust
COPY --from=runtime-base / /runtime-root/
# The distroless root has no shell. This data-only package requires no hooks;
# application, interpreter and shared-library hashes are verified unchanged.
RUN apk --root /runtime-root --no-scripts add --no-cache ca-certificates-bundle=20260909-r3

FROM scratch AS runtime
COPY --from=runtime-trust /runtime-root/ /
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8080 PYTHONPATH=/app:/app/services/api/src \
    PATH=/opt/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/bin:/usr/sbin:/sbin:/bin \
    SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
WORKDIR /app
COPY --from=packaged /opt/venv /opt/venv
COPY --from=build /app /app
USER 65532:65532
EXPOSE 8080
ENTRYPOINT []
CMD ["python", "/app/services/api/start.py"]
