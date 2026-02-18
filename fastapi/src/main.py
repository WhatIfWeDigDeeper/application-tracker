import re
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .db import close_pool, create_pool
from .routes.applications import router as applications_router
from .routes.health import router as health_router


def _to_camel_case(name: str) -> str:
    """Convert a dot-separated field path to camelCase."""
    components = name.split(".")
    camel_parts: list[str] = []
    for part in components:
        words = re.split(r"[_\-]+", part)
        if not words:
            camel_parts.append(part)
            continue
        camel = words[0].lower() + "".join(w.capitalize() for w in words[1:])
        camel_parts.append(camel)
    return ".".join(camel_parts)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    await create_pool()
    yield
    await close_pool()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:3010",
        "http://localhost:3020",
        "http://localhost:3030",
        "http://localhost:3050",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    details = []
    for error in exc.errors():
        loc = error.get("loc", ())
        # Skip the first element if it's "body", "query", etc.
        field_parts = [str(part) for part in loc if part not in ("body", "query", "path")]
        field_name = _to_camel_case(".".join(field_parts)) if field_parts else "unknown"
        details.append({"field": field_name, "message": error.get("msg", "Invalid value")})
    return JSONResponse(
        status_code=422,
        content={
            "code": "validation_error",
            "message": "Validation failed",
            "details": details,
        },
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={
            "code": "internal_error",
            "message": "An unexpected error occurred",
        },
    )


app.include_router(health_router, prefix="/health")
app.include_router(applications_router, prefix="/applications")
