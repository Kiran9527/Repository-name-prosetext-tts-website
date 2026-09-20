from supabase import create_client, Client

from app.core.config import settings


if not settings.supabase_url:
    raise RuntimeError("SUPABASE_URL is not configured.")

if not settings.supabase_secret_key:
    raise RuntimeError("SUPABASE_SECRET_KEY is not configured.")


supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_secret_key,
)