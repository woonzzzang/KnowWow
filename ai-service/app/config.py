from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_ENV = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ROOT_ENV,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    model_provider: str = "openai"
    model_name: str = "gpt-4o-mini"
    openai_api_key: str = ""
    google_api_key: str = ""
    openai_embedding_model: str = "text-embedding-3-small"

    @property
    def is_configured(self) -> bool:
        if self.model_provider == "openai":
            return bool(self.openai_api_key.strip())
        if self.model_provider in {"google", "google_genai"}:
            return bool(self.google_api_key.strip())
        return False


@lru_cache
def get_settings() -> Settings:
    return Settings()

