from functools import lru_cache
from typing import Literal
from urllib.parse import urlparse

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="MOVEBOOKS_", env_file=".env", extra="ignore")

    env: Literal["development", "local", "test", "cloud-dev", "staging", "production"] = "local"
    cors_origins: list[str] = ["http://localhost:3000"]
    demo_identity_enabled: bool = True
    persistence_backend: Literal["memory", "cloud-sql"] = "memory"
    storage_backend: Literal["memory", "gcs"] = "memory"
    identity_mode: Literal["demo", "firebase"] = "demo"
    model_provider_mode: Literal["deterministic-only", "gemini-ready", "fallback"] = (
        "deterministic-only"
    )
    logging_mode: Literal["structured", "off"] = "structured"
    analytics_mode: Literal["disabled", "contracts-only"] = "contracts-only"
    google_project: str = ""
    sql_instance: str = ""
    sql_database: str = ""
    sql_iam_user: str = ""
    storage_bucket: str = ""

    @property
    def cloud(self) -> bool:
        return self.env in {"cloud-dev", "staging", "production"}

    @model_validator(mode="after")
    def safe_modes(self):
        import os

        if os.environ.get("DATABASE_URL"):
            raise ValueError(
                "DATABASE_URL is unsupported; configure the explicit Cloud SQL settings instead"
            )
        if os.environ.get("K_SERVICE") and not self.cloud:
            raise ValueError("Cloud Run requires explicit cloud configuration; demo is forbidden")
        if self.cloud:
            if (
                (self.persistence_backend, self.storage_backend, self.identity_mode)
                != ("cloud-sql", "gcs", "firebase")
                or self.demo_identity_enabled
                or self.logging_mode != "structured"
            ):
                raise ValueError(
                    "Cloud mode requires durable state, GCS, Firebase, logs and no demo identity"
                )
            if not all(
                (
                    self.google_project,
                    self.sql_instance,
                    self.sql_database,
                    self.sql_iam_user,
                    self.storage_bucket,
                )
            ):
                raise ValueError("Cloud configuration is incomplete")
            if not self.cors_origins or any(
                urlparse(o).scheme != "https"
                or not urlparse(o).netloc
                or "*" in o
                or urlparse(o).path not in {"", "/"}
                for o in self.cors_origins
            ):
                raise ValueError("Cloud CORS requires explicit HTTPS frontend origins")
            if os.environ.get("FIREBASE_AUTH_EMULATOR_HOST"):
                raise ValueError("Identity emulators are forbidden in cloud mode")
        elif (self.persistence_backend, self.storage_backend, self.identity_mode) != (
            "memory",
            "memory",
            "demo",
        ):
            raise ValueError("Local/test modes must remain credential-free")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
