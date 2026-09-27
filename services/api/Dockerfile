FROM python:3.12-slim AS runtime
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
USER 65532:65532
EXPOSE 8080
CMD ["sh", "-c", "exec uvicorn movebooks_api.main:app --app-dir services/api/src --host 0.0.0.0 --port ${PORT} --no-access-log --timeout-graceful-shutdown 8 --timeout-keep-alive 5"]
