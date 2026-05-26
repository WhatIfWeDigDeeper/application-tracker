# Domain Entities

This document defines the core data entities for the Job Application Tracker, independent of any specific technology or storage mechanism.

---

## JobApplication

A record representing a single job application submitted by the user.

### Properties

| Property | Type | Required | Default | Constraints |
|----------|------|----------|---------|-------------|
| id | UUID | auto-generated | - | Unique identifier |
| companyName | string | yes | - | 1-200 characters, non-empty |
| positionTitle | string | yes | - | 1-200 characters, non-empty |
| dateApplied | date | no | null | Any valid date, or null |
| status | ApplicationStatus | yes | "unsubmitted" | See [enums.md](enums.md) |
| createdAt | datetime | auto-generated | creation time | Immutable after creation |
| updatedAt | datetime | auto-generated | creation time | Updated on any change |
| companyUrl | URL | no | - | Valid URL format |
| jobPostingUrl | URL | no | - | Valid URL format (external job site) |
| companyCareerUrl | URL | no | - | Valid URL format (company career page) |
| companyCategory | CompanyCategory | no | - | See [enums.md](enums.md) |
| skillsMatch | integer | no | - | 1-5 scale |
| jobSource | JobSource | no | - | See [enums.md](enums.md) |
| coverLetterRequired | boolean | no | - | true/false |
| specialRequirements | string | no | - | Max 5000 characters |
| salaryMin | integer | no | - | Positive number |
| salaryMax | integer | no | - | Positive number, >= salaryMin |
| notes | string | no | - | Max 5000 characters |
| offerDueDate | date | no | - | Relevant when status="given offer" |
| isArchived | boolean | yes | false | Soft delete flag |
| interviewStages | InterviewStage[] | yes | [] | Ordered collection |

### Computed Properties

| Property | Derivation |
|----------|------------|
| daysUntilOfferDue | offerDueDate - today (when status="given offer" and offerDueDate is set) |
| isOverdue | offerDueDate < today |
| completedStageCount | Count of interviewStages where isCompleted=true |
| totalStageCount | Length of interviewStages array |

### Relationships

- **Has many** InterviewStage (embedded, ordered)

---

## InterviewStage

Represents one step in the interview process for a job application.

### Properties

| Property | Type | Required | Default | Constraints |
|----------|------|----------|---------|-------------|
| id | UUID | auto-generated | - | Unique identifier |
| name | string | yes | - | 1-100 characters, non-empty |
| order | integer | yes | - | 0-indexed position in sequence |
| isCompleted | boolean | yes | false | Completion status |
| completedDate | date | no | - | Date stage was completed |
| notes | string | no | - | Max 2000 characters |
| performanceRating | integer | no | - | 1-5 scale (self-assessment) |

### Relationships

- **Belongs to** JobApplication

---

## ApplicationSnapshot

Represents a point-in-time capture of an application's state, used for history tracking.

### Properties

| Property | Type | Required | Default | Constraints |
|----------|------|----------|---------|-------------|
| id | UUID | auto-generated | - | Unique identifier |
| applicationId | UUID | yes | - | References JobApplication |
| sequenceNumber | integer | auto-generated | - | Monotonically increasing per application |
| snapshot | object | yes | - | Full JobApplication state at this point in time |
| description | string | yes | - | Human-readable change summary (e.g., "Status changed from applied to interviewing") |
| createdAt | datetime | auto-generated | creation time | Immutable after creation |

### Relationships

- **Belongs to** JobApplication

---

## Default Interview Stages

When a JobApplication transitions to "interviewing" status, the following default stages are created (if no stages exist):

| Order | Name |
|-------|------|
| 0 | Contacted by Recruiter |
| 1 | Interview with Recruiter |
| 2 | Interview with Hiring Manager |
| 3 | Exercise |
| 4 | Technical Interview |
| 5 | Cross-functional Interviews |

Users may customize these stages (add, remove, reorder) for individual applications.

---

## Entity Lifecycle

### JobApplication

1. **Created** with required fields (companyName, positionTitle); defaults to unsubmitted status with null dateApplied
2. **Updated** as user adds details, changes status
3. **Archived** (soft delete) - hidden from default views but retrievable
4. **Restored** from archive to active state
5. **Deleted** (hard delete) - permanently removed

### InterviewStage

1. **Created** either from defaults (on status transition) or manually by user
2. **Updated** to mark completion, add notes/ratings
3. **Reordered** within the parent application
4. **Deleted** when no longer relevant

### ApplicationSnapshot

1. **Created** automatically on every application mutation (create, update, status change)
2. **Read** to display history timeline and field-level diffs
3. **Used for restore** - snapshot data written back to parent application
4. **Deleted** when parent application is deleted (cascade)
