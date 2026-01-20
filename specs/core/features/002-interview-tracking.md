# Feature: Interview Tracking

Track progress through multiple interview rounds with notes and self-assessments.

**Priority**: P2 (Important)

---

## Overview

Job seekers in active interview processes need to track their progress through multiple rounds, remember key details from each conversation, and assess their own performance. This feature provides a checklist-style interface for managing interview stages.

---

## User Stories

### US-2.1: View Interview Checklist

**As a** job seeker in the interview process
**I want to** see a checklist of interview stages
**So that** I can track my progress through the hiring process

#### Acceptance Criteria

1. **Given** I have an application with status "interviewing"
   **When** I view that application
   **Then** I see an ordered list of interview stages

2. **Given** I am viewing interview stages
   **When** some stages are completed
   **Then** I can visually distinguish completed vs pending stages

3. **Given** I am viewing interview stages
   **When** a stage has notes or ratings
   **Then** I can see this information with the stage

---

### US-2.2: Mark Stage Complete

**As a** job seeker
**I want to** mark interview stages as complete
**So that** I can track which rounds I've finished

#### Acceptance Criteria

1. **Given** I am viewing an interview stage
   **When** I mark it as complete
   **Then** I can set a completion date (defaults to today)

2. **Given** I am completing a stage
   **When** I submit the completion
   **Then** the stage shows as completed with the date

3. **Given** I have a completed stage
   **When** I need to undo completion
   **Then** I can mark it as pending again

---

### US-2.3: Add Notes and Ratings

**As a** job seeker
**I want to** add notes and self-ratings to interview stages
**So that** I can remember how each round went

#### Acceptance Criteria

1. **Given** I am viewing an interview stage
   **When** I add notes
   **Then** the notes are saved with that stage

2. **Given** I am viewing an interview stage
   **When** I rate my performance (1-5)
   **Then** the rating is saved and displayed

3. **Given** I have notes and ratings on a stage
   **When** I view the application later
   **Then** I can see all my recorded information

---

### US-2.4: Customize Interview Stages

**As a** job seeker
**I want to** customize the interview stages for an application
**So that** I can match the actual interview process for that company

#### Acceptance Criteria

1. **Given** I am viewing interview stages
   **When** I add a new stage
   **Then** it appears in the list at the specified position

2. **Given** I am viewing interview stages
   **When** I remove a stage
   **Then** it is deleted (with confirmation if completed)

3. **Given** I am viewing interview stages
   **When** I reorder stages
   **Then** the new order is saved

4. **Given** I am viewing interview stages
   **When** I rename a stage
   **Then** the new name is saved

---

## Behaviors

### Initialize Default Stages

Triggered when application status changes to "interviewing" and no stages exist:

```
Process:
  1. Check if interviewStages array is empty
  2. If empty, create 6 default stages:
     - Contacted by Recruiter (order: 0)
     - Interview with Recruiter (order: 1)
     - Interview with Hiring Manager (order: 2)
     - Exercise (order: 3)
     - Technical Interview (order: 4)
     - Cross-functional Interviews (order: 5)
  3. Each stage initialized with:
     - Generated unique ID
     - isCompleted: false
     - Other fields: null/undefined
```

### Create Interview Stage

```
Input: { applicationId, name, order? }
Process:
  1. Find application (error if not found)
  2. Validate stage name
  3. Generate unique ID
  4. If order not specified, append to end
  5. If order specified, insert and reorder others
  6. Initialize isCompleted: false
  7. Persist stage
Output: Created stage
```

### Update Interview Stage

```
Input: { applicationId, stageId, ...fieldsToUpdate }
Process:
  1. Find application (error if not found)
  2. Find stage within application (error if not found)
  3. Validate updated fields
  4. If marking complete and no completedDate, set to today
  5. Merge updates
  6. Persist changes
Output: Updated stage
```

### Delete Interview Stage

```
Input: { applicationId, stageId }
Process:
  1. Find application (error if not found)
  2. Find stage (error if not found)
  3. Remove stage from array
  4. Reorder remaining stages (close gaps)
  5. Persist changes
Output: Success
```

### Reorder Interview Stages

```
Input: { applicationId, stageIds[] }
Process:
  1. Find application (error if not found)
  2. Validate all stageIds exist in application
  3. Validate count matches (no missing/extra)
  4. Update order field for each stage based on array position
  5. Persist changes
Output: Reordered stages array
```

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Complete stage without date | Auto-set to today |
| Delete completed stage | Show confirmation dialog |
| Revert completion | Keep notes and rating (don't delete) |
| Empty stage name | Validation error |
| Duplicate stage names | Allowed (same type of interview may happen twice) |
| Reorder to same position | No-op |
| Delete all stages | Allowed (user may not need checklist) |

---

## Display Requirements

### Stage List

- Show stages in order (by `order` field)
- Completed stages: checkbox checked, completion date visible
- Pending stages: checkbox unchecked
- Show notes preview (truncated) if present
- Show rating as stars/number if present

### Stage Detail/Edit

- Editable name field
- Completion checkbox with date picker
- Notes textarea
- Rating selector (1-5)
- Delete button with confirmation

### Progress Indicator

- Show "X of Y completed" summary
- Optional: progress bar visualization

---

## API Operations

| Operation | Method | Endpoint | Request | Response |
|-----------|--------|----------|---------|----------|
| Create | POST | /applications/{id}/interview-stages | Stage data | Created stage |
| Update | PATCH | /applications/{id}/interview-stages/{stageId} | Partial data | Updated stage |
| Delete | DELETE | /applications/{id}/interview-stages/{stageId} | - | 204 No Content |

Note: Stages are returned embedded in the application response, not as a separate list endpoint.

See [openapi.yaml](../api/openapi.yaml) for full API specification.
