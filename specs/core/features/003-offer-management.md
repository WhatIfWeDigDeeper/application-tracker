# Feature: Offer Management

Track job offers and their decision deadlines.

**Priority**: P2 (Important)

---

## Overview

When a job seeker receives an offer, they need to track the decision deadline to avoid missing it. This feature provides visibility into offer due dates and helps users manage multiple simultaneous offers.

---

## User Stories

### US-3.1: Set Offer Due Date

**As a** job seeker who received an offer
**I want to** record the deadline for my decision
**So that** I don't miss the response date

#### Acceptance Criteria

1. **Given** I have an application
   **When** I change its status to "given offer"
   **Then** I can optionally set an offer due date

2. **Given** I am setting an offer due date
   **When** I select a date
   **Then** the date is saved with the application

3. **Given** I have an offer with a due date
   **When** I need to update it
   **Then** I can change or remove the due date

---

### US-3.2: View Offer Deadlines

**As a** job seeker with pending offers
**I want to** see which offers have upcoming deadlines
**So that** I can prioritize my decisions

#### Acceptance Criteria

1. **Given** I have offers with due dates
   **When** I view my applications list
   **Then** I can see which applications have offer deadlines

2. **Given** I have an offer with an upcoming deadline
   **When** I view that application
   **Then** I see the due date prominently displayed

3. **Given** I have an offer with a due date
   **When** I view that application
   **Then** I see how many days remain until the deadline

---

### US-3.3: Track Overdue Offers

**As a** job seeker
**I want to** see when offer deadlines have passed
**So that** I can take action on expired offers

#### Acceptance Criteria

1. **Given** I have an offer with a past due date
   **When** I view the application
   **Then** I see a clear indication that it is overdue

2. **Given** I have an overdue offer
   **When** I view my applications list
   **Then** the overdue status is visible

3. **Given** I have an overdue offer
   **When** I update the status (accept/decline/extend)
   **Then** the overdue indicator is removed

---

### US-3.4: Accept or Decline Offer

**As a** job seeker
**I want to** record my decision on an offer
**So that** I have a complete record of the outcome

#### Acceptance Criteria

1. **Given** I have an application with status "given offer"
   **When** I accept the offer
   **Then** the status changes to "accepted offer" (terminal)

2. **Given** I have an application with status "given offer"
   **When** I decline the offer
   **Then** the status changes to "declined offer" (terminal)

3. **Given** I am about to accept or decline
   **When** I confirm my choice
   **Then** I see a warning that this cannot be undone

---

## Behaviors

### Set Offer Due Date

```
Input: { applicationId, offerDueDate }
Process:
  1. Find application (error if not found)
  2. Validate date format
  3. Update offerDueDate field
  4. Update updatedAt timestamp
  5. Persist changes
Output: Updated application
```

### Calculate Days Remaining

```
Input: { offerDueDate }
Process:
  1. Parse offerDueDate
  2. Calculate difference from today
  3. Return signed integer (negative = overdue)
Output: Number of days (positive = future, negative = past, 0 = today)
```

### Check Overdue Status

```
Input: { application }
Process:
  1. Check if status is "given offer"
  2. Check if offerDueDate is set
  3. Check if offerDueDate < today
Output: Boolean isOverdue
```

---

## Display Requirements

### In Application List

When an application has status "given offer" and offerDueDate is set:

| Condition | Display |
|-----------|---------|
| Due in 7+ days | Due date shown normally |
| Due in 1-6 days | Due date with warning color |
| Due today | "Due today" with urgent styling |
| Overdue | "Overdue" with alert styling |

### In Application Detail

- Due date displayed prominently
- Days remaining/overdue shown
- Quick actions to accept/decline

### Sorting Relevance

Offers with due dates should be sortable by:
- Due date (soonest first for prioritization)

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Due date in the past when set | Allowed (may be entering historical data) |
| Remove due date | Allowed - clears the field |
| Due date after accepting | Due date becomes irrelevant but preserved |
| Multiple offers at once | All tracked independently |
| Timezone considerations | Use local date only (no time component) |

---

## Computed Fields

These fields are derived, not stored:

| Field | Calculation |
|-------|-------------|
| daysUntilDue | offerDueDate - today (in days) |
| isOverdue | offerDueDate < today AND status = "given offer" |
| isUrgent | 0 <= daysUntilDue <= 3 AND status = "given offer" |

---

## Integration with Status

The offerDueDate field is only relevant when:
- Status is "given offer"

The field is preserved when:
- Status changes to "accepted offer" or "declined offer" (for historical record)

The field becomes irrelevant (but preserved) when:
- Status reverts to "interviewing" (more rounds)
- Status changes to "rejected" (offer rescinded)

---

## API Operations

Offer management uses the standard application update endpoint:

| Operation | Method | Endpoint | Request | Response |
|-----------|--------|----------|---------|----------|
| Set due date | PATCH | /applications/{id} | `{ offerDueDate: "2024-03-15" }` | Updated application |
| Clear due date | PATCH | /applications/{id} | `{ offerDueDate: null }` | Updated application |
| Accept offer | PATCH | /applications/{id} | `{ status: "accepted offer" }` | Updated application |
| Decline offer | PATCH | /applications/{id} | `{ status: "declined offer" }` | Updated application |

See [openapi.yaml](../api/openapi.yaml) for full API specification.
