from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    app_name: str = "GrowthOS API"
    environment: str = "development"
    debug: bool = False
    secret_key: str = "growthos-dev-secret-change-in-production"
    backend_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""  # Required for backend auth — get from Supabase → Settings → API
    supabase_jwt_secret: str = ""        # Required for JWT verification — get from Supabase → Settings → API

    # Database (asyncpg) — get from Supabase → Settings → Database → Connection string (Transaction mode)
    database_url: str = ""

    # Shopify
    shopify_api_key: str = ""
    shopify_api_secret: str = ""
    shopify_redirect_uri: str = ""

    # Meta Ads
    meta_app_id: str = ""
    meta_app_secret: str = ""
    meta_redirect_uri: str = ""

    # Google Ads
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = ""
    google_developer_token: str = ""
    google_client_customer_id: str = ""

    # Monitoring
    sentry_dsn: Optional[str] = None
    log_level: str = "INFO"

    # Sync
    sync_interval_minutes: int = 60
    manual_sync_throttle_minutes: int = 15
    max_sync_retries: int = 3
    initial_sync_days: int = 90

    model_config = {"env_file": ".env", "case_sensitive": False, "extra": "ignore"}


settings = Settings()
