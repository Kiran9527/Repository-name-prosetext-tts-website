from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ============================================================
    # Razorpay
    # ============================================================

    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    cleanup_secret: str = ""

    # ============================================================
    # Supabase
    # ============================================================

    supabase_url: str = ""
    supabase_secret_key: str = ""

    # ============================================================
    # Application
    # ============================================================

    app_env: str = "development"

    frontend_url: str = "https://prosetext.online"

    max_characters: int = 50000

    # ============================================================
    # Admin
    # ============================================================

    admin_username: str = ""
    admin_password: str = ""

    # ============================================================
    # Configuration
    # ============================================================

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()