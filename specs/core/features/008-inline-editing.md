# Feature: Inline Editing

Edit application fields directly on the detail page without a separate modal or form.

**Priority**: P3 (Nice to Have)

---

## Overview

Instead of navigating to a separate edit form or opening a modal, the application detail page is always in edit mode. All fields are directly editable in place, with changes saved on blur or via an explicit save button. This reduces friction for quick updates and keeps the user in context.

> **Conformance**: This is a **P3 (Optional)** feature. Implementations are not required to include it. Stacks without inline editing use a separate edit form/modal (see [001-application-management](001-application-management.md)), which is the default approach. **Every implementation spec must explicitly declare this feature as in scope or deferred** — it must not be silently omitted. If included, the spec must state the save trigger (blur, explicit button, or both).

---

## User Stories

### US-8.1: Edit Fields In-Place

**As a** job seeker
**I want to** edit any field directly on the application detail page
**So that** I can make quick updates without navigating to a separate form

#### Acceptance Criteria

1. **Given** I am viewing an application detail page
   **When** I look at text fields (company name, position, notes, etc.)
   **Then** they are rendered as editable input or textarea elements

2. **Given** I am viewing an application detail page
   **When** I look at enum fields (status, cover letter required, etc.)
   **Then** they are rendered as dropdown/select elements

3. **Given** I have modified a field
   **When** I blur the field or click save
   **Then** the change is persisted to the server

4. **Given** I enter an invalid value
   **When** validation runs
   **Then** I see an inline error message next to the field

---

### US-8.2: Unsaved Changes Warning

**As a** job seeker
**I want to** be warned before losing unsaved changes
**So that** I don't accidentally discard edits

#### Acceptance Criteria

1. **Given** I have unsaved changes on the detail page
   **When** I attempt to navigate away (browser back, link click, route change)
   **Then** a confirmation dialog appears

2. **Given** the confirmation dialog is showing
   **When** I choose to discard
   **Then** navigation proceeds and changes are lost

3. **Given** the confirmation dialog is showing
   **When** I choose to save
   **Then** changes are saved and navigation proceeds

4. **Given** I have no unsaved changes
   **When** I navigate away
   **Then** no dialog appears

---

## Behaviors

### Field Edit

```
Input: { applicationId, fieldName, newValue }
Process:
  1. Validate new value against field constraints
  2. If invalid, show inline error and stop
  3. Mark form as dirty (unsaved changes exist)
  4. On blur or explicit save:
     a. Send PATCH request with changed fields
     b. On success, mark form as clean
     c. On failure, show error notification and keep dirty state
Output: Updated application (on save)
```

### Navigation Guard

```
Input: { isDirty, navigationTarget }
Process:
  1. Check if form has unsaved changes (isDirty)
  2. If clean, allow navigation immediately
  3. If dirty, show confirmation dialog:
     - "You have unsaved changes. Save before leaving?"
     - Options: Save, Discard, Cancel
  4. On Save: persist changes, then navigate
  5. On Discard: reset form, then navigate
  6. On Cancel: stay on current page
Output: Navigation allowed or blocked
```

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Concurrent edits (another user/tab) | Last write wins; no conflict detection required |
| Network error during save | Show error notification; keep dirty state so user can retry |
| Rapid field changes (typing fast) | Debounce saves; only send after user stops typing or blurs |
| Navigate during in-flight save | Wait for save to complete before navigating |
| Browser refresh with unsaved changes | Browser's native beforeunload dialog shown |
| Save with no actual changes | No-op; do not send request if values unchanged |
| Read-only fields (id, createdAt) | Not editable; displayed as plain text |

---

## Display Requirements

### Field Rendering

- Text fields: `<input>` elements with subtle border/underline styling
- Long text fields (notes, specialRequirements): `<textarea>` elements
- Enum fields (status): `<select>` dropdowns
- Date fields: date picker inputs
- Boolean fields (coverLetterRequired): checkbox or toggle
- Number fields (salaryMin, salaryMax): number inputs

### Validation Display

- Inline error messages below the invalid field
- Red border or highlight on invalid fields
- Errors clear when the field is corrected

### Save Controls

- Optional explicit "Save" button for users who prefer manual save
- Visual indicator showing unsaved changes exist (e.g., dot or badge)
- Success feedback on save (brief notification or check mark)

---

## API Operations

Uses the existing application update endpoint:

| Operation | Method | Endpoint | Request | Response |
|-----------|--------|----------|---------|----------|
| Update Fields | PATCH | /applications/{id} | Partial application data | Updated application |

No new endpoints required. Inline editing uses the same PATCH endpoint as the modal-based edit flow.

See [openapi.yaml](../api/openapi.yaml) for full API specification.
