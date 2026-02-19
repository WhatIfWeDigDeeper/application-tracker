"""Run SQL migrations in order against the database."""

import asyncio
import glob
import os
from pathlib import Path

import asyncpg
from dotenv import load_dotenv

# Only load .env from the fastapi/ directory, not parent directories
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path, override=False)


async def run_migrations() -> None:
    url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@127.0.0.1:5432/app_tracker")
    conn = await asyncpg.connect(url, ssl=False)
    try:
        await conn.execute("CREATE SCHEMA IF NOT EXISTS python_fastapi")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS python_fastapi.schema_migrations (
                migration_name TEXT PRIMARY KEY,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
        """)
        migration_dir = os.path.dirname(os.path.abspath(__file__))
        files = sorted(glob.glob(os.path.join(migration_dir, "*.sql")))
        for f in files:
            name = os.path.basename(f)
            already_applied = await conn.fetchval(
                "SELECT 1 FROM python_fastapi.schema_migrations WHERE migration_name = $1",
                name,
            )
            if already_applied:
                print(f"Skipping {name} (already applied).")
                continue
            print(f"Running {name}...")
            with open(f) as fh:
                sql = fh.read()
            await conn.execute(sql)
            await conn.execute(
                "INSERT INTO python_fastapi.schema_migrations (migration_name) VALUES ($1)",
                name,
            )
            print(f"  Done.")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run_migrations())
