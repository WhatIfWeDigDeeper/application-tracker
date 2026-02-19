"""Tests for pure helper functions in services/shared.py and services/history.py."""

from datetime import date, datetime
from uuid import uuid4

import pytest

from src.services.history import build_description, compute_field_diffs
from src.services.shared import (
    format_date,
    format_datetime,
    parse_date,
    row_to_application_response,
)

# --- parse_date ---


class TestParseDate:
    def test_valid_date_string(self) -> None:
        result = parse_date("2026-02-18")
        assert result == date(2026, 2, 18)

    def test_none_returns_none(self) -> None:
        assert parse_date(None) is None

    def test_first_of_year(self) -> None:
        result = parse_date("2026-01-01")
        assert result == date(2026, 1, 1)

    def test_leap_day(self) -> None:
        result = parse_date("2024-02-29")
        assert result == date(2024, 2, 29)

    def test_invalid_format_raises(self) -> None:
        with pytest.raises(ValueError):
            parse_date("02/18/2026")

    def test_empty_string_raises(self) -> None:
        with pytest.raises(ValueError):
            parse_date("")


# --- format_date ---


class TestFormatDate:
    def test_date_object(self) -> None:
        assert format_date(date(2026, 2, 18)) == "2026-02-18"

    def test_none_returns_none(self) -> None:
        assert format_date(None) is None

    def test_string_passthrough(self) -> None:
        assert format_date("2026-02-18") == "2026-02-18"

    def test_date_object_leading_zeros(self) -> None:
        assert format_date(date(2026, 1, 5)) == "2026-01-05"


# --- format_datetime ---


class TestFormatDatetime:
    def test_datetime_object(self) -> None:
        dt = datetime(2026, 2, 18, 14, 30, 0)
        assert format_datetime(dt) == "2026-02-18T14:30:00"

    def test_none_raises_value_error(self) -> None:
        with pytest.raises(ValueError, match="Expected a datetime"):
            format_datetime(None)

    def test_datetime_with_microseconds(self) -> None:
        dt = datetime(2026, 2, 18, 14, 30, 0, 123456)
        result = format_datetime(dt)
        assert result == "2026-02-18T14:30:00.123456"


# --- build_description ---


class TestBuildDescription:
    def test_action_only(self) -> None:
        assert build_description("Created application") == "Created application"

    def test_action_with_details(self) -> None:
        assert build_description("Added interview stage", "Phone Screen") == "Added interview stage: Phone Screen"

    def test_empty_details_treated_as_no_details(self) -> None:
        assert build_description("Created", "") == "Created"

    def test_none_details_treated_as_no_details(self) -> None:
        assert build_description("Created", None) == "Created"


# --- compute_field_diffs ---


class TestComputeFieldDiffs:
    def test_no_changes(self) -> None:
        snapshot = {"companyName": "Acme", "status": "applied"}
        changes = compute_field_diffs(snapshot, snapshot)
        assert changes == []

    def test_single_field_change(self) -> None:
        before = {"companyName": "Acme", "status": "applied"}
        after = {"companyName": "Acme", "status": "interviewing"}
        changes = compute_field_diffs(before, after)
        assert len(changes) == 1
        assert changes[0].field == "status"
        assert changes[0].label == "Status"
        assert changes[0].old_value == "applied"
        assert changes[0].new_value == "interviewing"

    def test_multiple_field_changes(self) -> None:
        before = {"companyName": "Acme", "positionTitle": "Engineer", "status": "applied"}
        after = {"companyName": "Beta Corp", "positionTitle": "Senior Engineer", "status": "applied"}
        changes = compute_field_diffs(before, after)
        fields = {c.field for c in changes}
        assert fields == {"companyName", "positionTitle"}

    def test_null_to_value(self) -> None:
        before = {"salaryMin": None}
        after = {"salaryMin": 100000}
        changes = compute_field_diffs(before, after)
        assert len(changes) == 1
        assert changes[0].field == "salaryMin"
        assert changes[0].old_value is None
        assert changes[0].new_value == 100000

    def test_value_to_null(self) -> None:
        before = {"dateApplied": "2026-01-15"}
        after = {"dateApplied": None}
        changes = compute_field_diffs(before, after)
        assert len(changes) == 1
        assert changes[0].field == "dateApplied"

    def test_interview_stages_change(self) -> None:
        before = {"interviewStages": [{"name": "Phone", "order": 0}]}
        after = {"interviewStages": [{"name": "Phone", "order": 0}, {"name": "Onsite", "order": 1}]}
        changes = compute_field_diffs(before, after)
        stage_changes = [c for c in changes if c.field == "interviewStages"]
        assert len(stage_changes) == 1
        assert stage_changes[0].label == "Interview Stages"

    def test_interview_stages_no_change(self) -> None:
        stages = [{"name": "Phone", "order": 0}]
        before = {"interviewStages": stages}
        after = {"interviewStages": stages}
        changes = compute_field_diffs(before, after)
        stage_changes = [c for c in changes if c.field == "interviewStages"]
        assert len(stage_changes) == 0

    def test_missing_fields_treated_as_none(self) -> None:
        before: dict[str, object] = {}
        after = {"companyName": "Acme"}
        changes = compute_field_diffs(before, after)
        name_changes = [c for c in changes if c.field == "companyName"]
        assert len(name_changes) == 1
        assert name_changes[0].old_value is None
        assert name_changes[0].new_value == "Acme"


# --- row_to_application_response ---


class TestRowToApplicationResponse:
    def _make_app_row(self, **overrides: object) -> dict[str, object]:
        defaults: dict[str, object] = {
            "id": uuid4(),
            "company_name": "Test Co",
            "position_title": "Engineer",
            "date_applied": date(2026, 2, 18),
            "status": "applied",
            "created_at": datetime(2026, 2, 18, 10, 0, 0),
            "updated_at": datetime(2026, 2, 18, 10, 0, 0),
            "company_url": None,
            "job_posting_url": None,
            "company_career_url": None,
            "company_category": None,
            "skills_match": None,
            "job_source": None,
            "cover_letter_required": None,
            "special_requirements": None,
            "salary_min": None,
            "salary_max": None,
            "notes": None,
            "offer_due_date": None,
            "is_archived": False,
        }
        defaults.update(overrides)
        return defaults

    def _make_stage_row(self, **overrides: object) -> dict[str, object]:
        defaults: dict[str, object] = {
            "id": uuid4(),
            "name": "Phone Screen",
            "order": 0,
            "is_completed": False,
            "completed_date": None,
            "notes": None,
            "performance_rating": None,
        }
        defaults.update(overrides)
        return defaults

    def test_basic_response(self) -> None:
        row = self._make_app_row()
        response = row_to_application_response(row, [])
        assert response.company_name == "Test Co"
        assert response.position_title == "Engineer"
        assert response.date_applied == "2026-02-18"
        assert response.interview_stages == []

    def test_with_stages_sorted_by_order(self) -> None:
        row = self._make_app_row()
        stage2 = self._make_stage_row(name="Onsite", order=2)
        stage0 = self._make_stage_row(name="Phone", order=0)
        stage1 = self._make_stage_row(name="Technical", order=1)
        response = row_to_application_response(row, [stage2, stage0, stage1])
        assert len(response.interview_stages) == 3
        assert [s.name for s in response.interview_stages] == ["Phone", "Technical", "Onsite"]

    def test_null_date_applied(self) -> None:
        row = self._make_app_row(date_applied=None)
        response = row_to_application_response(row, [])
        assert response.date_applied is None

    def test_camel_case_serialization(self) -> None:
        row = self._make_app_row()
        response = row_to_application_response(row, [])
        dumped = response.model_dump(by_alias=True)
        assert "companyName" in dumped
        assert "positionTitle" in dumped
        assert "dateApplied" in dumped
        assert "interviewStages" in dumped
        # snake_case keys should NOT be present when using aliases
        assert "company_name" not in dumped
        assert "position_title" not in dumped
