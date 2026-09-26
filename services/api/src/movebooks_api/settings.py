from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="MOVEBOOKS_", env_file=".env", extra="ignore")

    env: Literal["development", "test", "production"] = "development"
    cors_origins: list[str] = ["http://localhost:3000"]
    demo_identity_enabled: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()

