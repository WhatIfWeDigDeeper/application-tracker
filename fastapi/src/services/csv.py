import csv
import io
from uuid import UUID

import asyncpg

from ..schemas import CsvRow, ImportError, ImportResult
from .history import build_description, record_history
from .shared import parse_date

CSV_COLUMNS = [
    "companyName",
    "positionTitle",
    "dateApplied",
    "status",
    "companyUrl",
    "jobPostingUrl",
    "companyCareerUrl",
    "companyCategory",
    "skillsMatch",
    "jobSource",
    "coverLetterRequired",
    "specialRequirements",
    "salaryMin",
    "salaryMax",
    "notes",
    "offerDueDate",
    "isArchived",
]


def get_sample_csv() -> str:
    header = ",".join(CSV_COLUMNS)
    example = (
        "Acme Corp,Software Engineer,2026-01-15,applied,"
        "https://acme.com,https://acme.com/jobs/123,https://acme.com/careers,"
        "ai,4,linkedin,false,Must have 3+ years React experience,80000,120000,Great company culture,,false"
    )
    return f"{header}\n{example}\n"


async def export_to_csv(pool: asyncpg.Pool) -> str:
    rows = await pool.fetch(
        "SELECT * FROM applications ORDER BY date_applied NULLS LAST"
    )

    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=CSV_COLUMNS)
    writer.writeheader()

    for row in rows:
        writer.writerow(
            {
                "companyName": row["company_name"],
                "positionTitle": row["position_title"],
                "dateApplied": row["date_applied"].isoformat() if row["date_applied"] else "",
                "status": row["status"],
                "companyUrl": row["company_url"] or "",
                "jobPostingUrl": row["job_posting_url"] or "",
                "companyCareerUrl": row["company_career_url"] or "",
                "companyCategory": row["company_category"] or "",
                "skillsMatch": str(row["skills_match"]) if row["skills_match"] is not None else "",
                "jobSource": row["job_source"] or "",
                "coverLetterRequired": str(row["cover_letter_required"]).lower()
                if row["cover_letter_required"] is not None
                else "",
                "specialRequirements": row["special_requirements"] or "",
                "salaryMin": str(row["salary_min"]) if row["salary_min"] is not None else "",
                "salaryMax": str(row["salary_max"]) if row["salary_max"] is not None else "",
                "notes": row["notes"] or "",
                "offerDueDate": row["offer_due_date"].isoformat() if row["offer_due_date"] else "",
                "isArchived": str(row["is_archived"]).lower(),
            }
        )

    return buf.getvalue()


async def _get_existing_job_posting_urls(pool: asyncpg.Pool) -> set[str]:
    rows = await pool.fetch(
        "SELECT job_posting_url FROM applications WHERE job_posting_url IS NOT NULL"
    )
    return {row["job_posting_url"] for row in rows}


async def import_from_csv(pool: asyncpg.Pool, content: bytes) -> ImportResult:
    text = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))

    if reader.fieldnames is None:
        return ImportResult(
            imported=0,
            skipped=0,
            errors=[ImportError(row=1, message="Failed to parse CSV file")],
        )

    existing_urls = await _get_existing_job_posting_urls(pool)
    seen_urls: set[str] = set()
    imported = 0
    skipped = 0
    errors: list[ImportError] = []

    for i, raw_row in enumerate(reader):
        row_num = i + 2  # 1-based, +1 for header

        # Convert empty strings to None
        cleaned = {k: (v if v != "" else None) for k, v in raw_row.items()}

        try:
            row = CsvRow.model_validate(cleaned, by_alias=True)
        except Exception as exc:
            errors.append(ImportError(row=row_num, message=str(exc)))
            continue

        # Duplicate detection
        if row.job_posting_url:
            if row.job_posting_url in existing_urls or row.job_posting_url in seen_urls:
                skipped += 1
                continue
            seen_urls.add(row.job_posting_url)

        try:
            app_row = await pool.fetchrow(
                """
                INSERT INTO applications (
                    company_name, position_title, date_applied, status,
                    company_url, job_posting_url, company_career_url,
                    company_category, skills_match, job_source,
                    cover_letter_required, special_requirements,
                    salary_min, salary_max, notes, offer_due_date,
                    is_archived
                ) VALUES (
                    $1, $2, $3, $4::python_fastapi.application_status,
                    $5, $6, $7,
                    $8::python_fastapi.company_category, $9, $10::python_fastapi.job_source,
                    $11, $12,
                    $13, $14, $15, $16,
                    $17
                )
                RETURNING id
                """,
                row.company_name,
                row.position_title,
                parse_date(row.date_applied),
                row.status.value if row.status else "unsubmitted",
                row.company_url,
                row.job_posting_url,
                row.company_career_url,
                row.company_category.value if row.company_category else None,
                row.skills_match,
                row.job_source.value if row.job_source else None,
                row.cover_letter_required,
                row.special_requirements,
                row.salary_min,
                row.salary_max,
                row.notes,
                parse_date(row.offer_due_date),
                row.is_archived if row.is_archived is not None else False,
            )
            assert app_row is not None
            app_id: UUID = app_row["id"]
            await record_history(pool, app_id, build_description("Imported from CSV"))
            imported += 1
        except Exception as exc:
            errors.append(ImportError(row=row_num, message=f"Database error: {exc}"))

    return ImportResult(imported=imported, skipped=skipped, errors=errors)
