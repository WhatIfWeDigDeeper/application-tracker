import os
from pathlib import Path

from dotenv import load_dotenv

# Only load .env from the fastapi/ directory, not parent directories
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path, override=False)

DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5432/app_tracker"


def get_database_url() -> str:
    return os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)


def get_api_port() -> int:
    return int(os.getenv("API_PORT", "5160"))
