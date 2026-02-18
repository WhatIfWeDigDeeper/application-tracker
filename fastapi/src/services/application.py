from uuid import UUID

import asyncpg

from ..schemas import (
    ApplicationResponse,
    CreateApplicationRequest,
    PaginatedApplicationsResponse,
    UpdateApplicationRequest,
)
from .history import build_description, record_history
from .shared import parse_date, row_to_application_response

FIELD_LABELS_MAP = {
    "company_name": "Company Name",
    "position_title": "Position Title",
    "date_applied": "Date Applied",
    "status": "Status",
    "company_url": "Company URL",
    "job_posting_url": "Job Posting URL",
    "company_career_url": "Career Page URL",
    "company_category": "Company Category",
    "skills_match": "Skills Match",
    "job_source": "Job Source",
    "cover_letter_required": "Cover Letter Required",
    "special_requirements": "Special Requirements",
    "salary_min": "Min Salary",
    "salary_max": "Max Salary",
    "notes": "Notes",
    "offer_due_date": "Offer Due Date",
}

SORT_COLUMN_MAP = {
    "dateApplied": "date_applied",
    "companyName": "company_name",
    "updatedAt": "updated_at",
}


async def list_applications(
    pool: asyncpg.Pool,
    *,
    status: str | None = None,
    company_category: str | None = None,
    job_source: str | None = None,
    skills_match_min: int | None = None,
    include_archived: bool = False,
    sort_by: str = "updatedAt",
    sort_dir: str = "desc",
    page: int = 1,
    limit: int = 50,
) -> PaginatedApplicationsResponse:
    """List applications with filtering, sorting, and pagination."""
    conditions: list[str] = []
    params: list[object] = []
    param_idx = 1

    if not include_archived:
        conditions.append(f"is_archived = ${param_idx}")
        params.append(False)
        param_idx += 1

    if status:
        statuses = [s.strip() for s in status.split(",")]
        placeholders = ", ".join(f"${param_idx + i}" for i in range(len(statuses)))
        conditions.append(f"status::text IN ({placeholders})")
        params.extend(statuses)
        param_idx += len(statuses)

    if company_category:
        conditions.append(f"company_category::text = ${param_idx}")
        params.append(company_category)
        param_idx += 1

    if job_source:
        conditions.append(f"job_source::text = ${param_idx}")
        params.append(job_source)
        param_idx += 1

    if skills_match_min is not None:
        conditions.append(f"skills_match >= ${param_idx}")
        params.append(skills_match_min)
        param_idx += 1

    where_clause = " AND ".join(conditions) if conditions else "TRUE"

    # Count total
    total = await pool.fetchval(
        f"SELECT count(*) FROM applications WHERE {where_clause}",
        *params,
    )

    # Sort
    sort_column = SORT_COLUMN_MAP.get(sort_by, "updated_at")
    direction = "ASC" if sort_dir.lower() == "asc" else "DESC"
    nulls = " NULLS LAST" if sort_column == "date_applied" else ""
    order_clause = f"{sort_column} {direction}{nulls}"

    offset = (page - 1) * limit
    query = (
        f"SELECT * FROM applications WHERE {where_clause} "
        f"ORDER BY {order_clause} LIMIT ${param_idx} OFFSET ${param_idx + 1}"
    )
    rows = await pool.fetch(
        query,
        *params,
        limit,
        offset,
    )

    items: list[ApplicationResponse] = []
    for app_row in rows:
        stage_rows = await pool.fetch(
            'SELECT * FROM interview_stages WHERE application_id = $1 ORDER BY "order"',
            app_row["id"],
        )
        items.append(row_to_application_response(app_row, stage_rows))

    return PaginatedApplicationsResponse(
        items=items,
        page=page,
        limit=limit,
        total=total,
    )


async def get_application(pool: asyncpg.Pool, app_id: UUID) -> ApplicationResponse | None:
    """Get a single application by ID."""
    app_row = await pool.fetchrow("SELECT * FROM applications WHERE id = $1", app_id)
    if app_row is None:
        return None

    stage_rows = await pool.fetch(
        'SELECT * FROM interview_stages WHERE application_id = $1 ORDER BY "order"',
        app_id,
    )
    return row_to_application_response(app_row, stage_rows)


async def create_application(
    pool: asyncpg.Pool,
    data: CreateApplicationRequest,
) -> ApplicationResponse:
    """Create a new application (always unsubmitted, no date_applied)."""
    app_row = await pool.fetchrow(
        """
        INSERT INTO applications (
            company_name, position_title, date_applied, status,
            company_url, job_posting_url, company_career_url,
            company_category, skills_match, job_source,
            cover_letter_required, special_requirements,
            salary_min, salary_max, notes
        ) VALUES (
            $1, $2, NULL, 'unsubmitted'::python_fastapi.application_status,
            $3, $4, $5,
            $6::python_fastapi.company_category, $7, $8::python_fastapi.job_source,
            $9, $10,
            $11, $12, $13
        )
        RETURNING *
        """,
        data.company_name,
        data.position_title,
        data.company_url,
        data.job_posting_url,
        data.company_career_url,
        data.company_category.value if data.company_category else None,
        data.skills_match,
        data.job_source.value if data.job_source else None,
        data.cover_letter_required,
        data.special_requirements,
        data.salary_min,
        data.salary_max,
        data.notes,
    )

    await record_history(pool, app_row["id"], build_description("Created application"))

    return row_to_application_response(app_row, [])


async def update_application(
    pool: asyncpg.Pool,
    app_id: UUID,
    data: UpdateApplicationRequest,
) -> ApplicationResponse | None:
    """Update an existing application. Only updates explicitly sent fields."""
    app_row = await pool.fetchrow("SELECT * FROM applications WHERE id = $1", app_id)
    if app_row is None:
        return None

    set_clauses: list[str] = []
    params: list[object] = [app_id]  # $1 is always the app_id
    param_idx = 2
    changed_labels: list[str] = []

    field_set = data.model_fields_set

    # Enum columns need explicit casts
    enum_casts = {
        "status": "::python_fastapi.application_status",
        "company_category": "::python_fastapi.company_category",
        "job_source": "::python_fastapi.job_source",
    }

    field_column_map = {
        "company_name": "company_name",
        "position_title": "position_title",
        "date_applied": "date_applied",
        "status": "status",
        "company_url": "company_url",
        "job_posting_url": "job_posting_url",
        "company_career_url": "company_career_url",
        "company_category": "company_category",
        "skills_match": "skills_match",
        "job_source": "job_source",
        "cover_letter_required": "cover_letter_required",
        "special_requirements": "special_requirements",
        "salary_min": "salary_min",
        "salary_max": "salary_max",
        "notes": "notes",
        "offer_due_date": "offer_due_date",
    }

    date_fields = {"date_applied", "offer_due_date"}

    for field_name, column_name in field_column_map.items():
        if field_name in field_set:
            value = getattr(data, field_name)
            # Extract enum values
            if hasattr(value, "value"):
                value = value.value
            # Convert date strings to datetime.date for asyncpg
            if field_name in date_fields:
                value = parse_date(value)
            cast = enum_casts.get(field_name, "")
            set_clauses.append(f"{column_name} = ${param_idx}{cast}")
            params.append(value)
            param_idx += 1
            if field_name in FIELD_LABELS_MAP:
                changed_labels.append(FIELD_LABELS_MAP[field_name])

    if not set_clauses:
        # Nothing to update
        stage_rows = await pool.fetch(
            'SELECT * FROM interview_stages WHERE application_id = $1 ORDER BY "order"',
            app_id,
        )
        return row_to_application_response(app_row, stage_rows)

    # If status is unsubmitted, force date_applied to null
    if "status" in field_set and data.status and data.status.value == "unsubmitted":
        if "date_applied" in field_set:
            # Overwrite the already-added date_applied param with None
            for i, clause in enumerate(set_clauses):
                if clause.startswith("date_applied = "):
                    params[i + 1] = None  # +1 because params[0] is app_id
                    break
        else:
            set_clauses.append(f"date_applied = ${param_idx}")
            params.append(None)
            param_idx += 1

    set_clauses.append("updated_at = now()")
    set_sql = ", ".join(set_clauses)

    updated_row = await pool.fetchrow(
        f"UPDATE applications SET {set_sql} WHERE id = $1 RETURNING *",
        *params,
    )

    stage_rows = await pool.fetch(
        'SELECT * FROM interview_stages WHERE application_id = $1 ORDER BY "order"',
        app_id,
    )

    description = build_description("Updated", ", ".join(changed_labels)) if changed_labels else "Updated application"
    await record_history(pool, app_id, description)

    return row_to_application_response(updated_row, stage_rows)


async def delete_application(pool: asyncpg.Pool, app_id: UUID) -> bool:
    """Delete an application. Records history BEFORE deletion."""
    app_row = await pool.fetchrow("SELECT * FROM applications WHERE id = $1", app_id)
    if app_row is None:
        return False

    # Record history before the delete so the snapshot captures the pre-delete state
    await record_history(pool, app_id, build_description("Deleted application"))

    await pool.execute("DELETE FROM applications WHERE id = $1", app_id)
    return True


async def archive_application(pool: asyncpg.Pool, app_id: UUID) -> ApplicationResponse | None:
    """Archive an application."""
    app_row = await pool.fetchrow("SELECT * FROM applications WHERE id = $1", app_id)
    if app_row is None:
        return None

    updated_row = await pool.fetchrow(
        "UPDATE applications SET is_archived = TRUE, updated_at = now() WHERE id = $1 RETURNING *",
        app_id,
    )

    stage_rows = await pool.fetch(
        'SELECT * FROM interview_stages WHERE application_id = $1 ORDER BY "order"',
        app_id,
    )

    await record_history(pool, app_id, build_description("Archived application"))

    return row_to_application_response(updated_row, stage_rows)


async def restore_application(pool: asyncpg.Pool, app_id: UUID) -> ApplicationResponse | None:
    """Restore (unarchive) an application."""
    app_row = await pool.fetchrow("SELECT * FROM applications WHERE id = $1", app_id)
    if app_row is None:
        return None

    updated_row = await pool.fetchrow(
        "UPDATE applications SET is_archived = FALSE, updated_at = now() WHERE id = $1 RETURNING *",
        app_id,
    )

    stage_rows = await pool.fetch(
        'SELECT * FROM interview_stages WHERE application_id = $1 ORDER BY "order"',
        app_id,
    )

    await record_history(pool, app_id, build_description("Restored application"))

    return row_to_application_response(updated_row, stage_rows)
