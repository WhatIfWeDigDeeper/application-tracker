# Feature: Application Management

Core functionality for creating, viewing, and editing job applications.

**Priority**: P1 (Critical)

---

## Overview

Users need to record job applications they submit, capturing essential details like company name, position, and optional metadata. This is the foundational feature that all other functionality builds upon.

---

## User Stories

### US-1.1: Create New Application

**As a** job seeker
**I want to** add a new job application to my tracker
**So that** I can keep a record of positions I've applied for

#### Acceptance Criteria

1. **Given** I am on the application tracker
   **When** I initiate creating a new application
   **Then** I see a form with required fields (company name, position title) and optional fields

2. **Given** I am filling out the new application form
   **When** I enter a company name and position title and submit
   **Then** the application is created with status "unsubmitted" and no date applied

3. **Given** I am filling out the new application form
   **When** I leave required fields empty and submit
   **Then** I see validation errors indicating which fields are required

4. **Given** I am filling out the new application form
   **When** I fill in optional fields (URLs, category, skills match, salary, etc.)
   **Then** all provided details are saved with the application

5. **Given** I have created an application
   **When** I view the applications list
   **Then** the new application appears in the list

#### Optional Fields Available

- Company URL
- Job posting URL (external site like LinkedIn)
- Company career page URL
- Company category (dropdown)
- Skills match rating (1-5)
- Job source (dropdown)
- Cover letter required (checkbox)
- Special requirements (text)
- Salary range (min/max)
- Notes (text area)

---

### US-1.2: View Application Details

**As a** job seeker
**I want to** view the full details of an application
**So that** I can review all information I've recorded

#### Acceptance Criteria

1. **Given** I have applications in my tracker
   **When** I select an application from the list
   **Then** I see all details including optional fields that were provided

2. **Given** I am viewing an application with a company URL
   **When** I click the URL
   **Then** it opens in a new tab

3. **Given** I am viewing an application
   **When** the application has interview stages
   **Then** I see the interview progress (covered in interview feature)

---

### US-1.3: Edit Application

**As a** job seeker
**I want to** edit an existing application
**So that** I can update information as things change

#### Acceptance Criteria

1. **Given** I am viewing an application
   **When** I choose to edit it
   **Then** I see an edit form pre-filled with current values

2. **Given** I am editing an application
   **When** I modify fields and save
   **Then** the changes are persisted and I see the updated application

3. **Given** I am editing an application
   **When** I change the status
   **Then** appropriate side effects occur (see state transitions)

4. **Given** I am editing an application
   **When** I clear an optional field
   **Then** the field is removed from the application

5. **Given** I am editing an application
   **When** I enter invalid data
   **Then** I see validation errors and changes are not saved

---

### US-1.4: Update Application Status

**As a** job seeker
**I want to** change the status of an application
**So that** I can track where each application is in the process

#### Acceptance Criteria

1. **Given** I have an application with status "applied"
   **When** I change the status to "interviewing"
   **Then** default interview stages are created (if none exist)

2. **Given** I have an application with status "interviewing"
   **When** I change the status to "given offer"
   **Then** I am prompted to optionally set an offer due date

3. **Given** I have an application with any non-terminal status
   **When** I change to a terminal status (accepted/declined offer)
   **Then** I see a confirmation warning that this cannot be undone

4. **Given** I have an application in a terminal status
   **When** I try to change the status
   **Then** I cannot change it (status selection is disabled)

---

## Behaviors

### Create Application

```
Input: { companyName, positionTitle, ...optionalFields }
Process:
  1. Validate required fields present and valid
  2. Validate optional fields if provided
  3. Generate unique ID
  4. Leave dateApplied as null if not provided
  5. Set status to "unsubmitted"
  6. Set createdAt and updatedAt to now
  7. Set isArchived to false
  8. Initialize interviewStages to empty array
  9. Persist application
Output: Created application with all fields
```

### Update Application

```
Input: { id, ...fieldsToUpdate }
Process:
  1. Find application by ID (error if not found)
  2. Validate updated fields
  3. Check status transition validity if status changing
  4. Execute side effects if status changing
  5. Merge updates with existing application
  6. Update updatedAt timestamp
  7. Persist changes
Output: Updated application
```

### Delete Application

```
Input: { id }
Process:
  1. Find application by ID (error if not found)
  2. Request user confirmation
  3. Permanently remove application and all interview stages
Output: Success confirmation
```

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Duplicate company name | Allowed - same company may have multiple positions |
| Very long company/position name | Enforce max length (200 chars), truncate display with tooltip |
| Invalid URL format | Show validation error, don't save |
| Salary min > max | Show validation error, don't save |
| Edit during offline | Queue changes, sync when online (if applicable) |
| Concurrent edits | Last write wins (single user assumption) |

---

## Data Requirements

See [entities.md](../domain/entities.md) for JobApplication entity definition.

---

## API Operations

| Operation | Method | Endpoint | Request | Response |
|-----------|--------|----------|---------|----------|
| List | GET | /applications | Query params | Paginated list |
| Create | POST | /applications | Application data | Created application |
| Read | GET | /applications/{id} | - | Application |
| Update | PATCH | /applications/{id} | Partial data | Updated application |
| Delete | DELETE | /applications/{id} | - | 204 No Content |

See [openapi.yaml](../api/openapi.yaml) for full API specification.
