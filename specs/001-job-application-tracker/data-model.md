# Data Model: Job Application Tracker

**Branch**: `001-job-application-tracker` | **Date**: 2026-01-16

## Overview

This document defines the data entities, their relationships, validation rules, and state transitions for the Job Application Tracker. All data is stored in browser localStorage as JSON.

---

## Entities

### 1. JobApplication

The core entity representing a single job application.

```typescript
interface JobApplication {
  // Identity
  id: string;                      // UUID v4, auto-generated

  // Required fields
  companyName: string;             // Non-empty, max 200 chars
  positionTitle: string;           // Non-empty, max 200 chars

  // Auto-set fields
  dateApplied: string;             // ISO 8601 date string, defaults to creation date
  status: ApplicationStatus;       // Enum, defaults to 'applied'
  createdAt: string;               // ISO 8601 datetime string
  updatedAt: string;               // ISO 8601 datetime string

  // Optional URL fields
  companyUrl?: string;             // Valid URL format or empty
  jobPostingUrl?: string;          // External job site URL (LinkedIn, Indeed, etc.)
  companyCareerUrl?: string;       // Company's own career page URL

  // Optional classification fields
  companyCategory?: CompanyCategory;   // Enum
  skillsMatch?: number;                // 1-5 integer scale
  jobSource?: JobSource;               // Enum

  // Optional application details
  coverLetterRequired?: boolean;       // true/false
  specialRequirements?: string;        // Free text, max 1000 chars
  salaryMin?: number;                  // Positive integer (user's currency)
  salaryMax?: number;                  // Positive integer, >= salaryMin
  notes?: string;                      // Free text, max 5000 chars

  // Related data (embedded)
  interviewStages: InterviewStage[];   // Ordered array
  offerDueDate?: string;               // ISO 8601 date string (when status = 'given offer')

  // Soft delete
  isArchived: boolean;                 // false by default
}
```

### 2. InterviewStage

Represents one step in the interview process, embedded within JobApplication.

```typescript
interface InterviewStage {
  // Identity
  id: string;                      // UUID v4, auto-generated

  // Stage definition
  name: string;                    // Non-empty, max 100 chars
  order: number;                   // 0-indexed position in checklist

  // Completion tracking
  isCompleted: boolean;            // false by default
  completedDate?: string;          // ISO 8601 date string (when completed)

  // User feedback
  notes?: string;                  // Free text, max 2000 chars
  performanceRating?: number;      // 1-5 integer scale
}
```

---

## Enumerations

### ApplicationStatus

```typescript
type ApplicationStatus =
  | 'applied'        // Initial state
  | 'rejected'       // Application rejected
  | 'interviewing'   // Active interview process
  | 'given offer'    // Received offer
  | 'accepted offer' // Offer accepted (terminal)
  | 'declined offer' // Offer declined (terminal)
  | 'no offer';      // No offer received
```

### CompanyCategory

```typescript
type CompanyCategory =
  | 'education'
  | 'health'
  | 'climate'
  | 'ai'
  | 'energy'
  | 'finance'
  | 'enterprise-software'
  | 'consumer-tech'
  | 'e-commerce'
  | 'cybersecurity'
  | 'gaming'
  | 'media-entertainment'
  | 'consulting'
  | 'government'
  | 'nonprofit'
  | 'retail'
  | 'restaurant'
  | 'hospitality'
  | 'other';
```

### JobSource

```typescript
type JobSource =
  | 'recruiter'
  | 'linkedin'
  | 'indeed'
  | 'friend'
  | 'colleague'
  | 'company-website'
  | 'other';
```

---

## Default Interview Stages

When a JobApplication transitions to `interviewing` status, the following default stages are populated:

```typescript
const DEFAULT_INTERVIEW_STAGES: Omit<InterviewStage, 'id'>[] = [
  { name: 'Contacted by Recruiter', order: 0, isCompleted: false },
  { name: 'Interview with Recruiter', order: 1, isCompleted: false },
  { name: 'Interview with Hiring Manager', order: 2, isCompleted: false },
  { name: 'Exercise', order: 3, isCompleted: false },
  { name: 'Technical Interview', order: 4, isCompleted: false },
  { name: 'Cross-functional Interviews', order: 5, isCompleted: false },
];
```

---

## Validation Rules

### JobApplication Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| companyName | Required, non-empty after trim, max 200 chars | "Company name is required" / "Company name is too long" |
| positionTitle | Required, non-empty after trim, max 200 chars | "Position title is required" / "Position title is too long" |
| companyUrl | If provided, must be valid URL format | "Invalid company URL format" |
| jobPostingUrl | If provided, must be valid URL format | "Invalid job posting URL format" |
| companyCareerUrl | If provided, must be valid URL format | "Invalid company career page URL format" |
| skillsMatch | If provided, integer 1-5 | "Skills match must be between 1 and 5" |
| salaryMin | If provided, positive integer | "Minimum salary must be a positive number" |
| salaryMax | If provided, positive integer >= salaryMin | "Maximum salary must be greater than or equal to minimum" |
| specialRequirements | Max 1000 chars | "Special requirements text is too long" |
| notes | Max 5000 chars | "Notes text is too long" |

### InterviewStage Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| name | Required, non-empty after trim, max 100 chars | "Stage name is required" / "Stage name is too long" |
| performanceRating | If provided, integer 1-5 | "Performance rating must be between 1 and 5" |
| notes | Max 2000 chars | "Stage notes text is too long" |

### URL Validation Pattern

```typescript
const URL_PATTERN = /^https?:\/\/.+/;

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return URL_PATTERN.test(url);
  } catch {
    return false;
  }
}
```

---

## State Transitions

### ApplicationStatus State Machine

```
                    ┌─────────────┐
                    │   applied   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌────────────┐ ┌──────────┐ ┌──────────┐
       │interviewing│ │ rejected │ │ archived │
       └──────┬─────┘ └──────────┘ └──────────┘
              │
      ┌───────┼────────────┐
      ▼       ▼            ▼
┌─────────────┐ ┌──────────┐ ┌────────┐
│ given offer │ │ no offer │ │applied │ (revert)
└────┬────────┘ └──────────┘ └────────┘
     │
     ├──────────────┬────────────┐
     ▼              ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌────────────┐
│accepted offer│ │declined offer│ │interviewing│ (if more rounds)
└──────────────┘ └──────────────┘ └────────────┘
```

### Transition Rules

| From | To | Conditions | Side Effects |
|------|-----|------------|--------------|
| applied | rejected | None | None |
| applied | interviewing | None | Populate default interview stages |
| interviewing | given offer | None | None |
| interviewing | no offer | None | Preserve interview data |
| interviewing | applied | User action (revert) | Preserve interview data |
| given offer | accepted offer | None | Terminal state |
| given offer | declined offer | None | Terminal state |
| given offer | interviewing | User action (more rounds) | None |
| any | archived | User action | Set isArchived = true |
| archived | any | User action (restore) | Set isArchived = false |

---

## Storage Schema

### localStorage Key

```typescript
const STORAGE_KEY = 'job-tracker-data-v1';
```

### Root Schema

```typescript
interface StorageSchema {
  version: 1;
  applications: JobApplication[];
  lastModified: string;  // ISO 8601 datetime
}
```

### Migration Strategy

Version number in schema enables future migrations:

```typescript
function migrateStorage(data: unknown): StorageSchema {
  if (!data || typeof data !== 'object') {
    return { version: 1, applications: [], lastModified: new Date().toISOString() };
  }

  const schema = data as StorageSchema;

  // Future: Add migration logic for version upgrades
  // if (schema.version === 1) { migrate to v2 }

  return schema;
}
```

---

## Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                      StorageSchema                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   JobApplication[]                     │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │                 JobApplication                   │  │  │
│  │  │  - companyName, positionTitle (required)        │  │  │
│  │  │  - status: ApplicationStatus                    │  │  │
│  │  │  - companyCategory?: CompanyCategory            │  │  │
│  │  │  - jobSource?: JobSource                        │  │  │
│  │  │  ┌───────────────────────────────────────────┐  │  │  │
│  │  │  │          interviewStages[]                 │  │  │  │
│  │  │  │  ┌─────────────────────────────────────┐  │  │  │  │
│  │  │  │  │         InterviewStage              │  │  │  │  │
│  │  │  │  │  - name, order, isCompleted         │  │  │  │  │
│  │  │  │  │  - completedDate?, notes?, rating?  │  │  │  │  │
│  │  │  │  └─────────────────────────────────────┘  │  │  │  │
│  │  │  └───────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Key Points:**
- One-to-many: JobApplication → InterviewStage (embedded array)
- No separate Offer entity; offerDueDate is embedded in JobApplication
- All data stored as single JSON document in localStorage
- Enums stored as string values for JSON compatibility
