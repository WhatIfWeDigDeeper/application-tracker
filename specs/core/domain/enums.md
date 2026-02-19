# Domain Enumerations

This document defines the enumerated types used throughout the Job Application Tracker.

---

## ApplicationStatus

The current state of a job application in the hiring pipeline.

| Value | Display Name | Description |
|-------|--------------|-------------|
| `unsubmitted` | Unsubmitted | Application saved as draft, not yet submitted |
| `applied` | Applied | Application submitted, awaiting response |
| `rejected` | Rejected | Application was rejected |
| `interviewing` | Interviewing | Active interview process |
| `given offer` | Given Offer | Received an offer, pending decision |
| `accepted offer` | Accepted Offer | Offer accepted (terminal state) |
| `declined offer` | Declined Offer | Offer declined (terminal state) |
| `no offer` | No Offer | Completed interviews but no offer received |

### Status Categories

For filtering and display purposes, statuses can be grouped:

| Category | Statuses |
|----------|----------|
| Active | applied, interviewing, given offer |
| Closed - Positive | accepted offer |
| Closed - Negative | rejected, declined offer, no offer |
| Draft | unsubmitted |
| Terminal | accepted offer, declined offer |

---

## CompanyCategory

Industry classification for the company.

| Value | Display Name |
|-------|--------------|
| `education` | Education |
| `health` | Health |
| `climate` | Climate |
| `ai` | AI |
| `energy` | Energy |
| `finance` | Finance |
| `enterprise-software` | Enterprise Software |
| `consumer-tech` | Consumer Tech |
| `e-commerce` | E-commerce |
| `cybersecurity` | Cybersecurity |
| `gaming` | Gaming |
| `media-entertainment` | Media/Entertainment |
| `consulting` | Consulting |
| `government` | Government |
| `nonprofit` | Nonprofit |
| `retail` | Retail |
| `restaurant` | Restaurant |
| `hospitality` | Hospitality |
| `other` | Other |

### Display Order

Categories should be displayed alphabetically by display name, with "Other" always last.

---

## JobSource

How the user discovered the job opportunity.

| Value | Display Name |
|-------|--------------|
| `recruiter` | Recruiter |
| `linkedin` | LinkedIn |
| `indeed` | Indeed |
| `friend` | Friend |
| `colleague` | Colleague |
| `company-website` | Company Website |
| `other` | Other |

### Display Order

Sources should be displayed in the order listed above (most common sources first), with "Other" always last.

---

## SkillsMatch (Rating Scale)

A 1-5 integer scale for self-assessing skills match to a position.

| Value | Label | Description |
|-------|-------|-------------|
| 1 | Poor Match | Skills significantly below requirements |
| 2 | Below Average | Missing several key requirements |
| 3 | Average | Meets most basic requirements |
| 4 | Good Match | Meets requirements with some extras |
| 5 | Excellent Match | Exceeds requirements |

---

## PerformanceRating (Rating Scale)

A 1-5 integer scale for self-assessing interview performance.

| Value | Label | Description |
|-------|-------|-------------|
| 1 | Poor | Significant issues during interview |
| 2 | Below Average | Some struggles, missed opportunities |
| 3 | Average | Adequate performance |
| 4 | Good | Strong performance |
| 5 | Excellent | Outstanding performance |

---

## Sort Fields

Available fields for sorting application lists.

| Value | Display Name | Description |
|-------|--------------|-------------|
| `dateApplied` | Date Applied | When the application was submitted |
| `companyName` | Company Name | Alphabetical by company |
| `status` | Status | Grouped by application status |
| `updatedAt` | Last Updated | Most recently modified |

**Default sort**: `updatedAt` descending. When sorting by `dateApplied`, null values sort last regardless of direction.

## Sort Directions

| Value | Display Name |
|-------|--------------|
| `asc` | Ascending (A-Z, oldest first) |
| `desc` | Descending (Z-A, newest first) |
