# lambda_api — DynamoDB Schema

Single-table design. All item types share the `lambda_api_applications` table and are distinguished by their `SK` prefix.

## Table

| Table | Item Types | Notes |
| ----- | ---------- | ----- |
| `lambda_api_applications` | Application, InterviewStage, History, Meta | DynamoDB; single-table design |

## Item Types

### Application (`PK=APP#<uuid>`, `SK=APP#<uuid>`)

| Attribute | Type | Notes |
| --------- | ---- | ----- |
| `PK` | String | `APP#<uuid>` |
| `SK` | String | `APP#<uuid>` (same as PK) |
| `id` | String (UUID) | |
| `companyName` | String | max 200 |
| `positionTitle` | String | max 200 |
| `status` | String | See [Enums](#enums) |
| `dateApplied` | String \| null | ISO date (YYYY-MM-DD) |
| `companyUrl` | String \| null | |
| `jobPostingUrl` | String \| null | |
| `companyCareerUrl` | String \| null | |
| `companyCategory` | String \| null | See [Enums](#enums) |
| `skillsMatch` | Number \| null | 1–5 |
| `jobSource` | String \| null | See [Enums](#enums) |
| `coverLetterRequired` | Boolean \| null | |
| `specialRequirements` | String \| null | max 5000 |
| `salaryMin` | Number \| null | integer ≥ 0 |
| `salaryMax` | Number \| null | integer ≥ 0 |
| `notes` | String \| null | max 5000 |
| `offerDueDate` | String \| null | ISO date |
| `isArchived` | Boolean | |
| `historySequence` | Number | atomic counter for history |
| `createdAt` | String | ISO datetime |
| `updatedAt` | String | ISO datetime |
| `GSI1PK` | String | `STATUS#<status>#ARCHIVED#<0\|1>` |
| `GSI1SK` | String | `UPDATED#<updatedAt>#<id>` |
| `GSI2PK` | String \| absent | `ACTIVE` — only present when not archived |
| `GSI2SK` | String \| absent | `UPDATED#<updatedAt>#<id>` |

### InterviewStage (`PK=APP#<uuid>`, `SK=STAGE#<uuid>`)

| Attribute | Type | Notes |
| --------- | ---- | ----- |
| `PK` | String | `APP#<uuid>` — parent application |
| `SK` | String | `STAGE#<uuid>` |
| `id` | String (UUID) | |
| `applicationId` | String (UUID) | |
| `name` | String | max 100 |
| `order` | Number | integer ≥ 0 |
| `isCompleted` | Boolean | |
| `completedDate` | String \| null | ISO date |
| `notes` | String \| null | max 2000 |
| `performanceRating` | Number \| null | 1–5 |

### History (`PK=APP#<uuid>`, `SK=HIST#<zero-padded-seq>`)

| Attribute | Type | Notes |
| --------- | ---- | ----- |
| `PK` | String | `APP#<uuid>` — parent application |
| `SK` | String | `HIST#00000001` (8-digit zero-padded sequence) |
| `id` | String (UUID) | |
| `applicationId` | String (UUID) | |
| `sequence` | Number | 1-based counter |
| `description` | String | human-readable change summary |
| `snapshot` | Map | full `ApplicationResponse` at time of change |
| `createdAt` | String | ISO datetime |

### Meta (`PK=META`, `SK=COUNT`)

| Attribute | Type | Notes |
| --------- | ---- | ----- |
| `PK` | String | `META` |
| `SK` | String | `COUNT` |
| `count` | Number | total non-archived application count |

## Global Secondary Indexes

| GSI | Partition Key | Sort Key | Purpose |
| --- | ------------- | -------- | ------- |
| `GSI1` | `GSI1PK` = `STATUS#<status>#ARCHIVED#<0\|1>` | `GSI1SK` = `UPDATED#<ts>#<id>` | Filter by status + archived flag, sorted by `updatedAt` desc |
| `GSI2` | `GSI2PK` = `ACTIVE` | `GSI2SK` = `UPDATED#<ts>#<id>` | All non-archived apps sorted by `updatedAt` desc |

## Enums

**ApplicationStatus**: `unsubmitted` · `applied` · `rejected` · `interviewing` · `given offer` · `accepted offer` · `declined offer` · `no offer`

**CompanyCategory**: `education` · `health` · `climate` · `ai` · `energy` · `finance` · `enterprise-software` · `consumer-tech` · `e-commerce` · `cybersecurity` · `gaming` · `media-entertainment` · `consulting` · `government` · `nonprofit` · `retail` · `restaurant` · `hospitality` · `other`

**JobSource**: `recruiter` · `linkedin` · `indeed` · `friend` · `colleague` · `company-website` · `other`

## Relations

```mermaid
erDiagram

APPLICATION ||--o{ INTERVIEW_STAGE : "has stages"
APPLICATION ||--o{ HISTORY : "has history"

APPLICATION {
  string pk "APP#uuid"
  string sk "APP#uuid"
  string id
  string companyName
  string positionTitle
  string status
  string dateApplied
  string companyUrl
  string jobPostingUrl
  string companyCareerUrl
  string companyCategory
  int skillsMatch
  string jobSource
  boolean coverLetterRequired
  string specialRequirements
  int salaryMin
  int salaryMax
  string notes
  string offerDueDate
  boolean isArchived
  int historySequence
  string createdAt
  string updatedAt
  string gsi1pk "STATUS#status#ARCHIVED#0or1"
  string gsi1sk "UPDATED#ts#id"
  string gsi2pk "ACTIVE"
  string gsi2sk "UPDATED#ts#id"
}

INTERVIEW_STAGE {
  string pk "APP#uuid"
  string sk "STAGE#uuid"
  string id
  string applicationId
  string name
  int order
  boolean isCompleted
  string completedDate
  string notes
  int performanceRating
}

HISTORY {
  string pk "APP#uuid"
  string sk "HIST#00000001"
  string id
  string applicationId
  int sequence
  string description
  string snapshot "full ApplicationResponse JSON"
  string createdAt
}
```

---

> Manually maintained — DynamoDB single-table design; not generated by tbls.
