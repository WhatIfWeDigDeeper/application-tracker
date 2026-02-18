from uuid import UUID

import asyncpg

from ..schemas import (
    CreateInterviewStageRequest,
    InterviewStageResponse,
    UpdateInterviewStageRequest,
)
from .history import build_description, record_history
from .shared import format_date, parse_date


async def create_interview_stage(
    pool: asyncpg.Pool,
    application_id: UUID,
    data: CreateInterviewStageRequest,
) -> InterviewStageResponse | None:
    """Create a new interview stage for an application."""
    # Check application exists
    app_row = await pool.fetchrow("SELECT id FROM applications WHERE id = $1", application_id)
    if app_row is None:
        return None

    row = await pool.fetchrow(
        """
        INSERT INTO interview_stages
            (application_id, name, "order", is_completed, completed_date, notes, performance_rating)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        """,
        application_id,
        data.name,
        data.order,
        data.is_completed,
        parse_date(data.completed_date),
        data.notes,
        data.performance_rating,
    )

    # Update parent application's updated_at
    await pool.execute(
        "UPDATE applications SET updated_at = now() WHERE id = $1",
        application_id,
    )

    await record_history(pool, application_id, build_description("Added interview stage", data.name))

    return InterviewStageResponse(
        id=row["id"],
        name=row["name"],
        order=row["order"],
        is_completed=row["is_completed"],
        completed_date=format_date(row["completed_date"]),
        notes=row["notes"],
        performance_rating=row["performance_rating"],
    )


async def update_interview_stage(
    pool: asyncpg.Pool,
    application_id: UUID,
    stage_id: UUID,
    data: UpdateInterviewStageRequest,
) -> InterviewStageResponse | None:
    """Update an existing interview stage."""
    # Check application and stage exist
    stage_row = await pool.fetchrow(
        "SELECT * FROM interview_stages WHERE id = $1 AND application_id = $2",
        stage_id,
        application_id,
    )
    if stage_row is None:
        return None

    field_set = data.model_fields_set
    set_clauses: list[str] = []
    params: list[object] = [stage_id]  # $1 is stage_id
    param_idx = 2

    field_column_map = {
        "name": "name",
        "order": '"order"',
        "is_completed": "is_completed",
        "completed_date": "completed_date",
        "notes": "notes",
        "performance_rating": "performance_rating",
    }

    for field_name, column_name in field_column_map.items():
        if field_name in field_set:
            value = getattr(data, field_name)
            if field_name == "completed_date":
                value = parse_date(value)
            set_clauses.append(f"{column_name} = ${param_idx}")
            params.append(value)
            param_idx += 1

    if not set_clauses:
        return InterviewStageResponse(
            id=stage_row["id"],
            name=stage_row["name"],
            order=stage_row["order"],
            is_completed=stage_row["is_completed"],
            completed_date=format_date(stage_row["completed_date"]),
            notes=stage_row["notes"],
            performance_rating=stage_row["performance_rating"],
        )

    set_sql = ", ".join(set_clauses)
    row = await pool.fetchrow(
        f"UPDATE interview_stages SET {set_sql} WHERE id = $1 RETURNING *",
        *params,
    )

    # Update parent application's updated_at
    await pool.execute(
        "UPDATE applications SET updated_at = now() WHERE id = $1",
        application_id,
    )

    await record_history(pool, application_id, build_description("Updated interview stage", row["name"]))

    return InterviewStageResponse(
        id=row["id"],
        name=row["name"],
        order=row["order"],
        is_completed=row["is_completed"],
        completed_date=format_date(row["completed_date"]),
        notes=row["notes"],
        performance_rating=row["performance_rating"],
    )


async def delete_interview_stage(
    pool: asyncpg.Pool,
    application_id: UUID,
    stage_id: UUID,
) -> bool:
    """Delete an interview stage."""
    stage_row = await pool.fetchrow(
        "SELECT * FROM interview_stages WHERE id = $1 AND application_id = $2",
        stage_id,
        application_id,
    )
    if stage_row is None:
        return False

    stage_name = stage_row["name"]

    await pool.execute("DELETE FROM interview_stages WHERE id = $1", stage_id)

    # Update parent application's updated_at
    await pool.execute(
        "UPDATE applications SET updated_at = now() WHERE id = $1",
        application_id,
    )

    await record_history(pool, application_id, build_description("Removed interview stage", stage_name))

    return True
