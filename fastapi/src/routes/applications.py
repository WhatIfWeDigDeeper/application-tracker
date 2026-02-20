from datetime import date
from typing import Any
from uuid import UUID

from fastapi import APIRouter, File, Query, UploadFile
from fastapi.responses import JSONResponse, Response

from ..db import get_pool
from ..schemas import (
    CreateApplicationRequest,
    CreateInterviewStageRequest,
    RestoreRequest,
    UpdateApplicationRequest,
    UpdateInterviewStageRequest,
)
from ..services import application as app_service
from ..services import history as history_service
from ..services import interview_stage as stage_service
from ..services.csv import export_to_csv, get_sample_csv, import_from_csv

router = APIRouter()

NOT_FOUND_APP: dict[str, str] = {"code": "not_found", "message": "Application not found"}
NOT_FOUND_STAGE: dict[str, str] = {"code": "not_found", "message": "Interview stage not found"}
NOT_FOUND_HISTORY: dict[str, str] = {"code": "not_found", "message": "History entry not found"}


@router.get("/sample-csv")
async def sample_csv() -> Response:
    content = get_sample_csv()
    return Response(
        content,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="applications-template.csv"'},
    )


@router.get("/export")
async def export_csv() -> Response:
    pool = get_pool()
    content = await export_to_csv(pool)
    today = date.today().isoformat()
    return Response(
        content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="applications-{today}.csv"'},
    )


@router.post("/import")
async def import_csv(file: UploadFile = File(...)) -> dict[str, object]:
    content = await file.read()
    pool = get_pool()
    result = await import_from_csv(pool, content)
    return result.model_dump()


@router.get("/")
async def list_applications(
    status: str | None = None,
    company_category: str | None = Query(None, alias="companyCategory"),
    job_source: str | None = Query(None, alias="jobSource"),
    skills_match_min: int | None = Query(None, alias="skillsMatchMin", ge=1, le=5),
    include_archived_raw: str = Query("false", alias="includeArchived"),
    sort_by: str = Query("updatedAt", alias="sortBy"),
    sort_dir: str = Query("desc", alias="sortDir"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    pool = get_pool()
    include_archived = include_archived_raw.lower() == "true"
    result = await app_service.list_applications(
        pool,
        status=status,
        company_category=company_category,
        job_source=job_source,
        skills_match_min=skills_match_min,
        include_archived=include_archived,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        limit=limit,
    )
    return result.model_dump(by_alias=True)


@router.get("/{app_id}", response_model=None)
async def get_application(app_id: UUID) -> dict[str, Any] | JSONResponse:
    pool = get_pool()
    result = await app_service.get_application(pool, app_id)
    if result is None:
        return JSONResponse(status_code=404, content=NOT_FOUND_APP)
    return result.model_dump(by_alias=True)


@router.post("/", status_code=201)
async def create_application(data: CreateApplicationRequest) -> dict[str, Any]:
    pool = get_pool()
    result = await app_service.create_application(pool, data)
    return result.model_dump(by_alias=True)


@router.patch("/{app_id}", response_model=None)
async def update_application(app_id: UUID, data: UpdateApplicationRequest) -> dict[str, Any] | JSONResponse:
    pool = get_pool()
    result = await app_service.update_application(pool, app_id, data)
    if result is None:
        return JSONResponse(status_code=404, content=NOT_FOUND_APP)
    return result.model_dump(by_alias=True)


@router.delete("/{app_id}", status_code=204, response_model=None)
async def delete_application(app_id: UUID) -> Response | JSONResponse:
    pool = get_pool()
    deleted = await app_service.delete_application(pool, app_id)
    if not deleted:
        return JSONResponse(status_code=404, content=NOT_FOUND_APP)
    return Response(status_code=204)


@router.post("/{app_id}/archive", response_model=None)
async def archive_application(app_id: UUID) -> dict[str, Any] | JSONResponse:
    pool = get_pool()
    result = await app_service.archive_application(pool, app_id)
    if result is None:
        return JSONResponse(status_code=404, content=NOT_FOUND_APP)
    return result.model_dump(by_alias=True)


@router.post("/{app_id}/restore", response_model=None)
async def restore_application(app_id: UUID) -> dict[str, Any] | JSONResponse:
    pool = get_pool()
    result = await app_service.restore_application(pool, app_id)
    if result is None:
        return JSONResponse(status_code=404, content=NOT_FOUND_APP)
    return result.model_dump(by_alias=True)


@router.get("/{app_id}/history")
async def get_history(
    app_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
) -> dict[str, Any]:
    pool = get_pool()
    result = await history_service.list_history(pool, app_id, page=page, limit=limit)
    return result.model_dump(by_alias=True)


@router.post("/{app_id}/history/restore", response_model=None)
async def restore_history(app_id: UUID, data: RestoreRequest) -> dict[str, Any] | JSONResponse:
    pool = get_pool()
    result = await history_service.restore_to_version(pool, app_id, data.sequence)
    if result is None:
        return JSONResponse(status_code=404, content=NOT_FOUND_HISTORY)
    return result.model_dump(by_alias=True)


@router.post("/{app_id}/interview-stages", status_code=201, response_model=None)
async def create_stage(app_id: UUID, data: CreateInterviewStageRequest) -> dict[str, Any] | JSONResponse:
    pool = get_pool()
    result = await stage_service.create_interview_stage(pool, app_id, data)
    if result is None:
        return JSONResponse(status_code=404, content=NOT_FOUND_APP)
    return result.model_dump(by_alias=True)


@router.patch("/{app_id}/interview-stages/{stage_id}", response_model=None)
async def update_stage(
    app_id: UUID, stage_id: UUID, data: UpdateInterviewStageRequest
) -> dict[str, Any] | JSONResponse:
    pool = get_pool()
    result = await stage_service.update_interview_stage(pool, app_id, stage_id, data)
    if result is None:
        return JSONResponse(status_code=404, content=NOT_FOUND_STAGE)
    return result.model_dump(by_alias=True)


@router.delete("/{app_id}/interview-stages/{stage_id}", status_code=204, response_model=None)
async def delete_stage(app_id: UUID, stage_id: UUID) -> Response | JSONResponse:
    pool = get_pool()
    deleted = await stage_service.delete_interview_stage(pool, app_id, stage_id)
    if not deleted:
        return JSONResponse(status_code=404, content=NOT_FOUND_STAGE)
    return Response(status_code=204)
