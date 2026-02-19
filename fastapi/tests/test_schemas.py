"""Tests for Pydantic schema validation and serialization behavior."""

import pytest
from pydantic import ValidationError

from src.enums import ApplicationStatus, CompanyCategory, JobSource
from src.schemas import (
    CreateApplicationRequest,
    CreateInterviewStageRequest,
    RestoreRequest,
    UpdateApplicationRequest,
    UpdateInterviewStageRequest,
)

# --- CamelCase alias support ---


class TestCamelCaseAliases:
    def test_create_app_accepts_camel_case(self) -> None:
        data = CreateApplicationRequest.model_validate({
            "companyName": "Acme",
            "positionTitle": "Engineer",
        })
        assert data.company_name == "Acme"
        assert data.position_title == "Engineer"

    def test_create_app_accepts_snake_case(self) -> None:
        data = CreateApplicationRequest(company_name="Acme", position_title="Engineer")
        assert data.company_name == "Acme"

    def test_create_app_serializes_to_camel(self) -> None:
        data = CreateApplicationRequest(company_name="Acme", position_title="Engineer")
        dumped = data.model_dump(by_alias=True)
        assert "companyName" in dumped
        assert "positionTitle" in dumped

    def test_stage_request_camel_case(self) -> None:
        data = CreateInterviewStageRequest.model_validate({
            "name": "Phone Screen",
            "order": 0,
            "isCompleted": True,
            "completedDate": "2026-02-18",
            "performanceRating": 4,
        })
        assert data.is_completed is True
        assert data.completed_date == "2026-02-18"
        assert data.performance_rating == 4


# --- CreateApplicationRequest validation ---


class TestCreateApplicationRequest:
    def test_minimal_valid(self) -> None:
        data = CreateApplicationRequest(company_name="Acme", position_title="SWE")
        assert data.company_name == "Acme"
        assert data.date_applied is None
        assert data.company_category is None

    def test_all_fields(self) -> None:
        data = CreateApplicationRequest(
            company_name="Acme",
            position_title="Engineer",
            date_applied="2026-01-15",
            company_url="https://acme.com",
            job_posting_url="https://acme.com/jobs/1",
            company_career_url="https://acme.com/careers",
            company_category=CompanyCategory.AI,
            skills_match=4,
            job_source=JobSource.LINKEDIN,
            cover_letter_required=True,
            special_requirements="Must have PhD",
            salary_min=100000,
            salary_max=150000,
            notes="Great company",
        )
        assert data.company_category == CompanyCategory.AI
        assert data.skills_match == 4

    def test_empty_company_name_rejected(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            CreateApplicationRequest(company_name="", position_title="Engineer")
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("company_name",) for e in errors)

    def test_company_name_too_long(self) -> None:
        with pytest.raises(ValidationError):
            CreateApplicationRequest(company_name="x" * 201, position_title="Engineer")

    def test_skills_match_below_range(self) -> None:
        with pytest.raises(ValidationError):
            CreateApplicationRequest(company_name="Acme", position_title="SWE", skills_match=0)

    def test_skills_match_above_range(self) -> None:
        with pytest.raises(ValidationError):
            CreateApplicationRequest(company_name="Acme", position_title="SWE", skills_match=6)

    def test_salary_negative_rejected(self) -> None:
        with pytest.raises(ValidationError):
            CreateApplicationRequest(company_name="Acme", position_title="SWE", salary_min=-1)

    def test_invalid_company_category_rejected(self) -> None:
        with pytest.raises(ValidationError):
            CreateApplicationRequest.model_validate({
                "companyName": "Acme",
                "positionTitle": "SWE",
                "companyCategory": "not-a-category",
            })

    def test_invalid_job_source_rejected(self) -> None:
        with pytest.raises(ValidationError):
            CreateApplicationRequest.model_validate({
                "companyName": "Acme",
                "positionTitle": "SWE",
                "jobSource": "carrier-pigeon",
            })


# --- UpdateApplicationRequest: model_fields_set behavior ---


class TestUpdateApplicationRequest:
    def test_empty_update_has_no_fields_set(self) -> None:
        data = UpdateApplicationRequest()
        assert len(data.model_fields_set) == 0

    def test_only_sent_fields_in_fields_set(self) -> None:
        data = UpdateApplicationRequest.model_validate({"status": "applied"})
        assert "status" in data.model_fields_set
        assert "company_name" not in data.model_fields_set
        assert "notes" not in data.model_fields_set

    def test_explicit_null_tracked_in_fields_set(self) -> None:
        data = UpdateApplicationRequest.model_validate({"dateApplied": None})
        assert "date_applied" in data.model_fields_set
        assert data.date_applied is None

    def test_multiple_fields_tracked(self) -> None:
        data = UpdateApplicationRequest.model_validate({
            "companyName": "New Co",
            "status": "interviewing",
            "salaryMin": 90000,
        })
        assert data.model_fields_set == {"company_name", "status", "salary_min"}

    def test_status_enum_validation(self) -> None:
        data = UpdateApplicationRequest.model_validate({"status": "given offer"})
        assert data.status == ApplicationStatus.GIVEN_OFFER

    def test_invalid_status_rejected(self) -> None:
        with pytest.raises(ValidationError):
            UpdateApplicationRequest.model_validate({"status": "promoted"})


# --- CreateInterviewStageRequest ---


class TestCreateInterviewStageRequest:
    def test_defaults(self) -> None:
        data = CreateInterviewStageRequest(name="Phone Screen", order=0)
        assert data.is_completed is False
        assert data.completed_date is None
        assert data.notes is None
        assert data.performance_rating is None

    def test_empty_name_rejected(self) -> None:
        with pytest.raises(ValidationError):
            CreateInterviewStageRequest(name="", order=0)

    def test_name_too_long(self) -> None:
        with pytest.raises(ValidationError):
            CreateInterviewStageRequest(name="x" * 101, order=0)

    def test_negative_order_rejected(self) -> None:
        with pytest.raises(ValidationError):
            CreateInterviewStageRequest(name="Phone", order=-1)

    def test_performance_rating_range(self) -> None:
        data = CreateInterviewStageRequest(name="Phone", order=0, performance_rating=5)
        assert data.performance_rating == 5

        with pytest.raises(ValidationError):
            CreateInterviewStageRequest(name="Phone", order=0, performance_rating=0)

        with pytest.raises(ValidationError):
            CreateInterviewStageRequest(name="Phone", order=0, performance_rating=6)


# --- UpdateInterviewStageRequest: model_fields_set ---


class TestUpdateInterviewStageRequest:
    def test_empty_update(self) -> None:
        data = UpdateInterviewStageRequest()
        assert len(data.model_fields_set) == 0

    def test_partial_fields_tracked(self) -> None:
        data = UpdateInterviewStageRequest.model_validate({"name": "Onsite", "isCompleted": True})
        assert data.model_fields_set == {"name", "is_completed"}
        assert data.name == "Onsite"
        assert data.is_completed is True

    def test_explicit_null_notes(self) -> None:
        data = UpdateInterviewStageRequest.model_validate({"notes": None})
        assert "notes" in data.model_fields_set
        assert data.notes is None


# --- RestoreRequest ---


class TestRestoreRequest:
    def test_valid_sequence(self) -> None:
        data = RestoreRequest(sequence=1)
        assert data.sequence == 1

    def test_zero_sequence_rejected(self) -> None:
        with pytest.raises(ValidationError):
            RestoreRequest(sequence=0)

    def test_negative_sequence_rejected(self) -> None:
        with pytest.raises(ValidationError):
            RestoreRequest(sequence=-1)
