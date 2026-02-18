import json
from typing import Any
from uuid import UUID

import asyncpg

from ..schemas import (
    ApplicationResponse,
    FieldChange,
    HistoryEntryResponse,
    PaginatedHistoryResponse,
)
from .shared import parse_date, row_to_application_response

FIELD_LABELS = {
    "companyName": "Company Name",
    "positionTitle": "Position Title",
    "dateApplied": "Date Applied",
    "status": "Status",
    "companyUrl": "Company URL",
    "jobPostingUrl": "Job Posting URL",
    "companyCareerUrl": "Career Page URL",
    "companyCategory": "Company Category",
    "skillsMatch": "Skills Match",
    "jobSource": "Job Source",
    "coverLetterRequired": "Cover Letter Required",
    "specialRequirements": "Special Requirements",
    "salaryMin": "Min Salary",
    "salaryMax": "Max Salary",
    "notes": "Notes",
    "offerDueDate": "Offer Due Date",
    "isArchived": "Archived",
}


def build_description(action: str, details: str | None = None) -> str:
    """Build a human-readable history description."""
    if details:
        return f"{action}: {details}"
    return action


def compute_field_diffs(before_dict: dict[str, Any], after_dict: dict[str, Any]) -> list[FieldChange]:
    """Compute field-level diffs between two snapshot dicts (camelCase keys)."""
    changes: list[FieldChange] = []

    for field, label in FIELD_LABELS.items():
        old_value = before_dict.get(field)
        new_value = after_dict.get(field)
        if old_value != new_value:
            changes.append(FieldChange(field=field, label=label, old_value=old_value, new_value=new_value))

    # Compare interview stages as JSON strings
    old_stages = json.dumps(before_dict.get("interviewStages", []), sort_keys=True, default=str)
    new_stages = json.dumps(after_dict.get("interviewStages", []), sort_keys=True, default=str)
    if old_stages != new_stages:
        changes.append(
            FieldChange(
                field="interviewStages",
                label="Interview Stages",
                old_value=before_dict.get("interviewStages", []),
                new_value=after_dict.get("interviewStages", []),
            )
        )

    return changes


async def record_history(
    pool: asyncpg.Pool,
    application_id: UUID,
    description: str,
) -> None:
    """Capture current application state as a snapshot and record a history entry."""
    app_row = await pool.fetchrow("SELECT * FROM applications WHERE id = $1", application_id)
    if app_row is None:
        return

    stage_rows = await pool.fetch(
        'SELECT * FROM interview_stages WHERE application_id = $1 ORDER BY "order"',
        application_id,
    )

    response = row_to_application_response(app_row, stage_rows)
    snapshot_json = json.dumps(response.model_dump(by_alias=True), default=str)

    next_seq = await pool.fetchval(
        "SELECT coalesce(max(sequence), 0) + 1 FROM application_history WHERE application_id = $1",
        application_id,
    )

    await pool.execute(
        "INSERT INTO application_history (application_id, sequence, description, snapshot) "
        "VALUES ($1, $2, $3, $4::jsonb)",
        application_id,
        next_seq,
        description,
        snapshot_json,
    )


async def list_history(
    pool: asyncpg.Pool,
    application_id: UUID,
    page: int,
    limit: int,
) -> PaginatedHistoryResponse:
    """Get paginated history entries with computed diffs between sequential snapshots."""
    total = await pool.fetchval(
        "SELECT count(*) FROM application_history WHERE application_id = $1",
        application_id,
    )

    offset = (page - 1) * limit
    rows = await pool.fetch(
        "SELECT * FROM application_history WHERE application_id = $1 ORDER BY sequence DESC LIMIT $2 OFFSET $3",
        application_id,
        limit,
        offset,
    )

    entries: list[HistoryEntryResponse] = []
    for i, row in enumerate(rows):
        snapshot = row["snapshot"] if isinstance(row["snapshot"], dict) else json.loads(row["snapshot"])

        changes: list[FieldChange] = []
        if row["sequence"] > 1:
            # Find the previous snapshot (sequence - 1)
            prev_row = await pool.fetchrow(
                "SELECT snapshot FROM application_history WHERE application_id = $1 AND sequence = $2",
                application_id,
                row["sequence"] - 1,
            )
            if prev_row is not None:
                prev_snapshot = (
                    prev_row["snapshot"]
                    if isinstance(prev_row["snapshot"], dict)
                    else json.loads(prev_row["snapshot"])
                )
                changes = compute_field_diffs(prev_snapshot, snapshot)

        entries.append(
            HistoryEntryResponse(
                id=row["id"],
                sequence=row["sequence"],
                description=row["description"],
                changes=changes,
                created_at=row["created_at"].isoformat() if row["created_at"] else "",
            )
        )

    return PaginatedHistoryResponse(
        entries=entries,
        total=total,
        page=page,
        limit=limit,
    )


async def restore_to_version(
    pool: asyncpg.Pool,
    application_id: UUID,
    target_sequence: int,
) -> ApplicationResponse | None:
    """Restore an application to a previous version by sequence number."""
    history_row = await pool.fetchrow(
        "SELECT * FROM application_history WHERE application_id = $1 AND sequence = $2",
        application_id,
        target_sequence,
    )
    if history_row is None:
        return None

    snapshot = (
        history_row["snapshot"]
        if isinstance(history_row["snapshot"], dict)
        else json.loads(history_row["snapshot"])
    )

    # Update the applications row from the snapshot
    await pool.execute(
        """
        UPDATE applications SET
            company_name = $2,
            position_title = $3,
            date_applied = $4,
            status = $5::python_fastapi.application_status,
            company_url = $6,
            job_posting_url = $7,
            company_career_url = $8,
            company_category = $9::python_fastapi.company_category,
            skills_match = $10,
            job_source = $11::python_fastapi.job_source,
            cover_letter_required = $12,
            special_requirements = $13,
            salary_min = $14,
            salary_max = $15,
            notes = $16,
            offer_due_date = $17,
            is_archived = $18,
            updated_at = now()
        WHERE id = $1
        """,
        application_id,
        snapshot.get("companyName"),
        snapshot.get("positionTitle"),
        parse_date(snapshot.get("dateApplied")),
        snapshot.get("status"),
        snapshot.get("companyUrl"),
        snapshot.get("jobPostingUrl"),
        snapshot.get("companyCareerUrl"),
        snapshot.get("companyCategory"),
        snapshot.get("skillsMatch"),
        snapshot.get("jobSource"),
        snapshot.get("coverLetterRequired"),
        snapshot.get("specialRequirements"),
        snapshot.get("salaryMin"),
        snapshot.get("salaryMax"),
        snapshot.get("notes"),
        parse_date(snapshot.get("offerDueDate")),
        snapshot.get("isArchived"),
    )

    # Delete existing stages and re-insert from snapshot
    await pool.execute(
        "DELETE FROM interview_stages WHERE application_id = $1",
        application_id,
    )

    for stage in snapshot.get("interviewStages", []):
        await pool.execute(
            """
            INSERT INTO interview_stages
                (application_id, name, "order", is_completed, completed_date, notes, performance_rating)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            """,
            application_id,
            stage["name"],
            stage["order"],
            stage["isCompleted"],
            parse_date(stage.get("completedDate")),
            stage.get("notes"),
            stage.get("performanceRating"),
        )

    # Record history for the restore action
    description = f"Restored to version {target_sequence}"
    await record_history(pool, application_id, description)

    # Fetch and return the updated application
    app_row = await pool.fetchrow("SELECT * FROM applications WHERE id = $1", application_id)
    stage_rows = await pool.fetch(
        'SELECT * FROM interview_stages WHERE application_id = $1 ORDER BY "order"',
        application_id,
    )
    return row_to_application_response(app_row, stage_rows)
