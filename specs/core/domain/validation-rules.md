# Validation Rules

This document defines validation rules for domain entities, independent of any validation library or framework.

---

## JobApplication Validation

### Required Fields

| Field | Rule | Error Message |
|-------|------|---------------|
| companyName | Must be present and non-empty after trimming whitespace | "Company name is required" |
| positionTitle | Must be present and non-empty after trimming whitespace | "Position title is required" |

### String Length Constraints

| Field | Min | Max | Error Message |
|-------|-----|-----|---------------|
| companyName | 1 | 200 | "Company name must be between 1 and 200 characters" |
| positionTitle | 1 | 200 | "Position title must be between 1 and 200 characters" |
| specialRequirements | - | 5000 | "Special requirements must not exceed 5000 characters" |
| notes | - | 5000 | "Notes must not exceed 5000 characters" |

### URL Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| companyUrl | If provided, must be valid HTTP/HTTPS URL | "Invalid company URL format" |
| jobPostingUrl | If provided, must be valid HTTP/HTTPS URL | "Invalid job posting URL format" |
| companyCareerUrl | If provided, must be valid HTTP/HTTPS URL | "Invalid company career page URL format" |

**URL Format**: Must start with `http://` or `https://` and be parseable as a valid URL.

### Numeric Constraints

| Field | Rule | Error Message |
|-------|------|---------------|
| skillsMatch | If provided, must be integer 1-5 | "Skills match must be between 1 and 5" |
| salaryMin | If provided, must be positive integer | "Minimum salary must be a positive number" |
| salaryMax | If provided, must be positive integer | "Maximum salary must be a positive number" |

### Cross-Field Validation

| Rule | Error Message |
|------|---------------|
| If both salaryMin and salaryMax provided, salaryMin <= salaryMax | "Minimum salary cannot exceed maximum salary" |
| If status is "unsubmitted", dateApplied must be null | "Date applied must be empty when status is unsubmitted" |
| If status is not "unsubmitted" and dateApplied transitions from null, auto-populate with today | (Auto-correction, not error) |

### Enum Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| status | Must be valid ApplicationStatus value | "Invalid application status" |
| companyCategory | If provided, must be valid CompanyCategory value | "Invalid company category" |
| jobSource | If provided, must be valid JobSource value | "Invalid job source" |

### Date Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| dateApplied | If provided, must be valid date format. May be null. | "Invalid date format" |
| offerDueDate | If provided, must be valid date format | "Invalid offer due date format" |

---

## InterviewStage Validation

### Required Fields

| Field | Rule | Error Message |
|-------|------|---------------|
| name | Must be present and non-empty after trimming whitespace | "Stage name is required" |

### String Length Constraints

| Field | Min | Max | Error Message |
|-------|-----|-----|---------------|
| name | 1 | 100 | "Stage name must be between 1 and 100 characters" |
| notes | - | 2000 | "Stage notes must not exceed 2000 characters" |

### Numeric Constraints

| Field | Rule | Error Message |
|-------|------|---------------|
| performanceRating | If provided, must be integer 1-5 | "Performance rating must be between 1 and 5" |
| order | Must be non-negative integer | "Order must be a non-negative integer" |

### Date Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| completedDate | If provided, must be valid date format | "Invalid completion date format" |

### Logical Validation

| Rule | Error Message |
|------|---------------|
| If isCompleted=true, completedDate should be set | (Warning, not error - can auto-set to today) |

---

## Validation Behavior

### On Create

- All required field validations apply
- Default values are applied before validation where specified
- Status defaults to `unsubmitted` if not provided; `dateApplied` defaults to null
- If a non-unsubmitted status is provided at creation and `dateApplied` is omitted, it is auto-populated with today's date
- If status is `unsubmitted` (or defaulted), `dateApplied` is forced to null regardless of input
- Invalid input prevents creation and returns validation errors

### On Update (Partial)

- Only validate fields that are being updated
- Required fields only checked if explicitly set to empty/null
- Cross-field validation applies if relevant fields are in the update

### Error Response Format

Validation errors should be returned as a collection:

```
{
  errors: [
    { field: "companyName", message: "Company name is required" },
    { field: "salaryMax", message: "Minimum salary cannot exceed maximum salary" }
  ]
}
```

### Whitespace Handling

- Leading and trailing whitespace should be trimmed from string inputs
- Empty string after trimming is treated as "not provided" for optional fields
- Empty string after trimming is invalid for required fields

---

## Client-Side vs Server-Side Validation

All validation rules should be enforced on both client and server:

- **Client-side**: Immediate feedback, better UX
- **Server-side**: Security, data integrity

Never trust client-side validation alone for data integrity.
