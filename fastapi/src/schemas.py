from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from .enums import ApplicationStatus, CompanyCategory, JobSource


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


# --- Interview Stage ---


class InterviewStageResponse(CamelModel):
    id: UUID
    name: str
    order: int
    is_completed: bool
    completed_date: str | None
    notes: str | None
    performance_rating: int | None


class CreateInterviewStageRequest(CamelModel):
    name: str = Field(min_length=1, max_length=100)
    order: int = Field(ge=0)
    is_completed: bool = False
    completed_date: str | None = None
    notes: str | None = Field(default=None, max_length=2000)
    performance_rating: int | None = Field(default=None, ge=1, le=5)


class UpdateInterviewStageRequest(CamelModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    order: int | None = Field(default=None, ge=0)
    is_completed: bool | None = None
    completed_date: str | None = None
    notes: str | None = Field(default=None, max_length=2000)
    performance_rating: int | None = Field(default=None, ge=1, le=5)


# --- Application ---


class ApplicationResponse(CamelModel):
    id: UUID
    company_name: str
    position_title: str
    date_applied: str | None
    status: ApplicationStatus
    created_at: str
    updated_at: str
    company_url: str | None
    job_posting_url: str | None
    company_career_url: str | None
    company_category: CompanyCategory | None
    skills_match: int | None
    job_source: JobSource | None
    cover_letter_required: bool | None
    special_requirements: str | None
    salary_min: int | None
    salary_max: int | None
    notes: str | None
    offer_due_date: str | None
    is_archived: bool
    interview_stages: list[InterviewStageResponse]


class CreateApplicationRequest(CamelModel):
    company_name: str = Field(min_length=1, max_length=200)
    position_title: str = Field(min_length=1, max_length=200)
    date_applied: str | None = None
    company_url: str | None = None
    job_posting_url: str | None = None
    company_career_url: str | None = None
    company_category: CompanyCategory | None = None
    skills_match: int | None = Field(default=None, ge=1, le=5)
    job_source: JobSource | None = None
    cover_letter_required: bool | None = None
    special_requirements: str | None = Field(default=None, max_length=5000)
    salary_min: int | None = Field(default=None, ge=0)
    salary_max: int | None = Field(default=None, ge=0)
    notes: str | None = Field(default=None, max_length=5000)


class UpdateApplicationRequest(CamelModel):
    company_name: str | None = Field(default=None, min_length=1, max_length=200)
    position_title: str | None = Field(default=None, min_length=1, max_length=200)
    date_applied: str | None = None
    status: ApplicationStatus | None = None
    company_url: str | None = None
    job_posting_url: str | None = None
    company_career_url: str | None = None
    company_category: CompanyCategory | None = None
    skills_match: int | None = Field(default=None, ge=1, le=5)
    job_source: JobSource | None = None
    cover_letter_required: bool | None = None
    special_requirements: str | None = Field(default=None, max_length=5000)
    salary_min: int | None = Field(default=None, ge=0)
    salary_max: int | None = Field(default=None, ge=0)
    notes: str | None = Field(default=None, max_length=5000)
    offer_due_date: str | None = None


# --- Pagination ---


class PaginatedApplicationsResponse(CamelModel):
    items: list[ApplicationResponse]
    page: int
    limit: int
    total: int


# --- History ---


class FieldChange(CamelModel):
    field: str
    label: str
    old_value: Any
    new_value: Any


class HistoryEntryResponse(CamelModel):
    id: UUID
    sequence: int
    description: str
    changes: list[FieldChange]
    created_at: str


class PaginatedHistoryResponse(CamelModel):
    entries: list[HistoryEntryResponse]
    total: int
    page: int
    limit: int


class RestoreRequest(CamelModel):
    sequence: int = Field(ge=1)


# --- Errors ---


class ErrorDetail(CamelModel):
    field: str
    message: str


class ErrorResponse(CamelModel):
    code: str
    message: str
    details: list[ErrorDetail] | None = None
