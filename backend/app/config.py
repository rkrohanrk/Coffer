from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_ENV_FILE, env_file_encoding="utf-8")

    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    # Optional HS256 fallback. Modern Supabase projects sign tokens with
    # asymmetric keys served via JWKS (verified from SUPABASE_URL); set this only
    # if your project still issues legacy HS256 access tokens.
    SUPABASE_JWT_SECRET: str | None = None
    ENVIRONMENT: str = "development"
    # Retained for the optional Python seed script; no longer used for auth.
    ADMIN_EMAIL: str | None = None
    ADMIN_PASSWORD: str | None = None


settings = Settings()
