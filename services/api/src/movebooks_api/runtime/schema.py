"""Explicit operator schema bootstrap; never called by the application runtime.

Run with a separate migration database principal; runtime requires SELECT/INSERT/UPDATE only.
Future incompatible changes require an explicit versioned migration, not automatic create_all.
"""
from movebooks_api.runtime.persistence import cloud_engine, metadata
from movebooks_api.settings import get_settings


def main():
    settings = get_settings()
    if not settings.cloud:
        raise SystemExit("Schema bootstrap requires explicit cloud configuration")
    engine, connector = cloud_engine(settings)
    try:
        metadata.create_all(engine)
    finally:
        engine.dispose()
        connector.close()


if __name__ == "__main__":
    main()
