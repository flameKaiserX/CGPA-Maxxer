from __future__ import annotations

import os
from dotenv import load_dotenv

load_dotenv()


def _parse_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in ("1", "true", "yes", "on")


def _parse_list(value: str | None, separator: str = ",") -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(separator) if item.strip()]


ALLOWED_ORIGINS = _parse_list(os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000"))
EXAMWEB_BASE_URL = os.environ.get("EXAMWEB_BASE_URL", "https://examweb.ggsipu.ac.in").rstrip("/")
LOGIN_URL = f"{EXAMWEB_BASE_URL}/web/login.jsp"
SESSION_TTL_MINUTES = int(os.environ.get("SESSION_TTL_MINUTES", "10"))
MAX_AUTO_RETRIES = int(os.environ.get("MAX_AUTO_RETRIES", "1"))
SESSION_CLEANUP_INTERVAL_SECONDS = int(os.environ.get("SESSION_CLEANUP_INTERVAL_SECONDS", "60"))
CHROME_DRIVER_PATH = os.environ.get("CHROME_DRIVER_PATH", "")
TESSERACT_CMD = os.environ.get("TESSERACT_CMD", "")
HEADLESS = _parse_bool(os.environ.get("HEADLESS", "true"))

GOOGLE_GEMINI_API_KEY = os.environ.get("GOOGLE_GEMINI_API_KEY", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")


def validate_backend_config() -> None:
    if not GOOGLE_GEMINI_API_KEY:
        raise RuntimeError("GOOGLE_GEMINI_API_KEY is required for backend operations.")
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY are required for backend operations.")
