# Feature: Archive and Delete

Manage old applications by archiving or permanently removing them.

**Priority**: P3 (Nice to Have)

---

## Overview

Over time, job seekers accumulate applications that are no longer relevant to their active search. This feature allows users to archive applications (hiding them from the default view while preserving data) or permanently delete them.

---

## User Stories

### US-5.1: Archive Application

**As a** job seeker
**I want to** archive old applications
**So that** my active list stays focused on current opportunities

#### Acceptance Criteria

1. **Given** I have an application I no longer need to see regularly
   **When** I archive it
   **Then** it no longer appears in my default applications list

2. **Given** I have archived an application
   **When** the archive completes
   **Then** I see confirmation that it was archived

3. **Given** I have archived applications
   **When** I search or filter
   **Then** archived applications are excluded by default

---

### US-5.2: View Archived Applications

**As a** job seeker
**I want to** view my archived applications
**So that** I can reference past applications or restore them

#### Acceptance Criteria

1. **Given** I have archived applications
   **When** I toggle to show archived
   **Then** I see all archived applications

2. **Given** I am viewing archived applications
   **When** I view one
   **Then** I see all its details including interview history

3. **Given** I am viewing archived applications
   **When** I toggle back to active
   **Then** I see only non-archived applications

---

### US-5.3: Restore Archived Application

**As a** job seeker
**I want to** restore an archived application
**So that** I can make it active again if circumstances change

#### Acceptance Criteria

1. **Given** I have an archived application
   **When** I restore it
   **Then** it appears in my active applications list

2. **Given** I have restored an application
   **When** I view it
   **Then** all data is intact (nothing lost from archive)

---

### US-5.4: Delete Application Permanently

**As a** job seeker
**I want to** permanently delete an application
**So that** I can remove data I no longer want

#### Acceptance Criteria

1. **Given** I have an application I want to delete
   **When** I choose to delete it
   **Then** I see a confirmation dialog warning it's permanent

2. **Given** I confirm deletion
   **When** the deletion completes
   **Then** the application is permanently removed

3. **Given** I have deleted an application
   **When** I search for it
   **Then** it cannot be found (truly deleted)

---

## Behaviors

### Archive Application

```
Input: { applicationId }
Process:
  1. Find application (error if not found)
  2. Set isArchived = true
  3. Update updatedAt timestamp
  4. Persist changes
Output: Updated application with isArchived=true
```

### Restore Application

```
Input: { applicationId }
Process:
  1. Find application (error if not found)
  2. Set isArchived = false
  3. Update updatedAt timestamp
  4. Persist changes
Output: Updated application with isArchived=false
```

### Delete Application

```
Input: { applicationId }
Process:
  1. Find application (error if not found)
  2. Delete all associated interview stages
  3. Delete the application
  4. Persist changes
Output: Success confirmation
```

---

## Archive vs Delete

| Aspect | Archive | Delete |
|--------|---------|--------|
| Reversible | Yes | No |
| Data preserved | All data kept | Data removed |
| Searchable | With includeArchived=true | Never |
| Use case | "Hide from view" | "Remove forever" |
| Confirmation | Optional | Required |

---

## Display Requirements

### Archive Controls

- Archive button/action on application (in list and detail)
- Restore button on archived applications
- Visual indicator for archived status

### Archived View Toggle

- Toggle or tab to switch between active/archived views
- Or filter control with "Include archived" option
- Count indicator: "X archived applications"

### Delete Confirmation

Modal dialog with:
- Warning message: "This cannot be undone"
- Application details (company, position) for verification
- Cancel and Confirm buttons
- Confirm button should require explicit action (not default)

### Empty States

- Active list empty: "No applications yet. Add your first application."
- Archive empty: "No archived applications."
- After delete: Return to list with success message

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Archive application in terminal status | Allowed |
| Restore then re-archive | Allowed |
| Delete archived application | Allowed (same flow) |
| Delete application with interviews | Delete stages too (cascade) |
| Bulk archive/delete | Out of scope (single item operations) |

---

## API Operations

### Archive

| Operation | Method | Endpoint | Request | Response |
|-----------|--------|----------|---------|----------|
| Archive | POST | /applications/{id}/archive | - | Updated application |
| Restore | POST | /applications/{id}/restore | - | Updated application |

Note: Could also be implemented as PATCH with `{ isArchived: true/false }`

### Delete

| Operation | Method | Endpoint | Request | Response |
|-----------|--------|----------|---------|----------|
| Delete | DELETE | /applications/{id} | - | 204 No Content |

### Query Archived

Use the includeArchived query parameter:
- `GET /applications` - Returns only active (isArchived=false)
- `GET /applications?includeArchived=true` - Returns all applications
- To see only archived: Filter client-side or add `?archivedOnly=true` parameter

See [openapi.yaml](../api/openapi.yaml) for full API specification.

---

## Data Integrity

### On Archive
- All data preserved exactly as-is
- Only isArchived flag changes
- Can still be queried with includeArchived=true

### On Delete
- Cascading delete of interview stages
- No soft-delete or trash (immediate permanent removal)
- No recovery possible after deletion

### Backup Consideration
- Implementations may offer data export before delete
- Not required by this specification
