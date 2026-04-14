# FastAPI Patterns

- Stack: Python 3.14 + FastAPI + asyncpg (raw SQL) + Pydantic v2, managed by `uv`; port 5160 (5060 reserved by macOS SIP), DB schema `python_fastapi`
- **Functional style**: Service functions take `asyncpg.Pool` as first arg — no service classes, only Pydantic model classes
- **Pydantic CamelModel**: Base class uses `alias_generator=to_camel`; use `model_dump(by_alias=True)` for API responses
- **Partial PATCH via `model_fields_set`**: Distinguishes explicitly-set fields from absent ones — required for correct partial update behavior
- **asyncpg DATE columns**: Require `datetime.date` objects, not strings — use the `parse_date()` helper in `src/services/shared.py`
- **asyncpg SSL**: Pass `ssl=False` for local Docker PostgreSQL — asyncpg defaults to SSL which fails locally
- **python-dotenv scope**: `load_dotenv()` walks up the directory tree — restrict it to `fastapi/.env` explicitly to avoid picking up a root `.env`
- **PostgreSQL enum casts**: Need explicit schema-qualified casts, e.g. `$1::python_fastapi.application_status`
- **Dev deps**: `uv sync --extra dev`; run server via `uv run python -m src`
