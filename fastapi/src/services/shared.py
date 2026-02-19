import json
from datetime import date, datetime
from typing import Any

from ..schemas import ApplicationResponse, InterviewStageResponse


def parse_date(d: str | None) -> date | None:
    """Parse a YYYY-MM-DD string to a datetime.date for asyncpg."""
    if d is None:
        return None
    return date.fromisoformat(d)


def format_date(d: date | str | None) -> str | None:
    """Format a date value to YYYY-MM-DD string."""
    if d is None:
        return None
    if isinstance(d, str):
        return d
    return d.isoformat()


def format_datetime(dt: datetime | None) -> str:
    """Format a datetime to ISO 8601 string.

    Raises ValueError if dt is None, since created_at/updated_at are NOT NULL columns.
    """
    if dt is None:
        raise ValueError("Expected a datetime value but got None")
    return dt.isoformat()


def row_to_application_response(app_row: Any, stage_rows: list[Any]) -> ApplicationResponse:
    """Transform raw asyncpg rows into an ApplicationResponse."""
    stages = sorted(stage_rows, key=lambda s: s["order"])
    return ApplicationResponse(
        id=app_row["id"],
        company_name=app_row["company_name"],
        position_title=app_row["position_title"],
        date_applied=format_date(app_row["date_applied"]),
        status=app_row["status"],
        created_at=format_datetime(app_row["created_at"]),
        updated_at=format_datetime(app_row["updated_at"]),
        company_url=app_row["company_url"],
        job_posting_url=app_row["job_posting_url"],
        company_career_url=app_row["company_career_url"],
        company_category=app_row["company_category"],
        skills_match=app_row["skills_match"],
        job_source=app_row["job_source"],
        cover_letter_required=app_row["cover_letter_required"],
        special_requirements=app_row["special_requirements"],
        salary_min=app_row["salary_min"],
        salary_max=app_row["salary_max"],
        notes=app_row["notes"],
        offer_due_date=format_date(app_row["offer_due_date"]),
        is_archived=app_row["is_archived"],
        interview_stages=[
            InterviewStageResponse(
                id=s["id"],
                name=s["name"],
                order=s["order"],
                is_completed=s["is_completed"],
                completed_date=format_date(s["completed_date"]),
                notes=s["notes"],
                performance_rating=s["performance_rating"],
            )
            for s in stages
        ],
    )


def application_response_to_json(response: ApplicationResponse) -> str:
    """Serialize ApplicationResponse to JSON string for JSONB storage."""
    return json.dumps(response.model_dump(by_alias=True), default=str)
