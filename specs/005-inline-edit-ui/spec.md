# 005 - Inline Edit UI

## Overview
Replace the modal-based create/edit flow with a full-page inline editing experience that mirrors the detail view layout. The current implementation uses a dialog for creating and editing applications, and a separate read-only detail view. This change unifies them into a single always-editable page.

## Motivation
- Modal dialogs are spatially disconnected from the content they edit and feel cramped for 15+ form fields
- The read-only detail view and the edit form have duplicated layout logic with inconsistent field visibility
- Users cannot add interview stages during application creation — only after the application is saved
- Switching between read-only and edit mode adds unnecessary friction

## Design Decisions

### Always-editable detail page
When a user navigates to `/applications/:id`, the page is immediately editable. There is no separate read-only view or "Edit" button. All fields are displayed in grouped sections with form controls. This eliminates mode-switching and makes the workflow faster.

### Full-page creation at `/applications/new`
The "+ Add Application" button navigates to a full page (not a modal) that uses the same layout as the detail/edit page. This allows adding interview stages during creation and provides more space for the form.

### Local-first interview stages during creation
Since the API requires an `applicationId` to create stages, stages added during creation are stored in local reactive state. On save, the application is created first, then each stage is created via the existing individual stage CRUD endpoints. No backend API changes are required.

### Explicit Save with dirty tracking
Changes require an explicit "Save" click. Snapshot-based dirty tracking compares current form values against the last saved state. Navigation away with unsaved changes triggers a browser confirm dialog.

### URL fields with clickable links
URL input fields include an adjacent link icon that opens the URL in a new tab when the value is a valid URL. This preserves the read-only experience of having clickable links.

## User Flows

### Create application
1. User clicks "+ Add Application" in the header
2. Browser navigates to `/applications/new`
3. Full-page form shows all fields in grouped sections, defaulting to today's date and "Applied" status
4. User fills in required fields (company name, position title)
5. User optionally adds interview stages in the stages section
6. User clicks "Save"
7. Application is created via API, stages are created individually
8. Browser navigates to `/applications/:newId` (now in edit mode for the saved application)

### Edit application
1. User clicks an application card in the list
2. Browser navigates to `/applications/:id`
3. Full-page form loads with all fields populated from the saved state
4. User modifies fields
5. User clicks "Save" — changes are persisted via the detail store (event sourcing records the changes)
6. Undo/redo remains available via keyboard shortcuts and the UndoRedoBar

### Discard changes
1. User makes changes on the edit page
2. User clicks "Discard"
3. Confirm dialog appears
4. On confirm: form fields revert to last saved state (or navigates to list in create mode)

## Field Layout

### Header area
- Back to List link
- Save / Discard buttons (right side)
- Archive / Delete buttons (edit mode only)
- Undo/Redo bar + History button (edit mode only)

### Main card sections

**Header fields (top of card):**
- Company Name (text input, large)
- Position Title (text input)
- Date Applied (date input) | Status (select dropdown)

**Company Info (left column):**
- Company Category (select dropdown)
- Company Website (URL input with link icon)
- Career Page URL (URL input with link icon)
- Job Posting URL (URL input with link icon)

**Application Details (right column):**
- Job Source (select dropdown)
- Skills Match (1-5 star rating input)
- Salary Min / Max (number inputs, side by side)
- Cover Letter Required (checkbox)

**Special Requirements:** textarea
**Notes:** textarea
**Offer Due Date:** date input (shown when status is "given offer")

### Interview Stages card (below main card)
- "+ Add Stage" button
- Inline stage form (InterviewStageForm)
- Stage list (InterviewStageItem) with edit/delete/toggle-complete
- In create mode: stages managed in local state
- In edit mode: stages managed through store (same as before)

## Scope
- **In scope**: vue-ui + nuxt-api only (first implementation)
- **Out of scope**: Other implementations (will follow later), API changes, event sourcing model changes

## Technical notes
- Reuses existing components: InterviewStageForm, InterviewStageItem, RatingInput, ConfirmDialog, UndoRedoBar, HistoryPanel
- Replaces: ApplicationFormModal.vue (deleted), ApplicationDetail.vue (deleted)
- New components: ApplicationEdit.vue (view), UrlFieldInput.vue (component)
- E2e tests added for the new create/edit/discard/delete flows
