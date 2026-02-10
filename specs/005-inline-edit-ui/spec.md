# 005 - Inline Edit UI

## Overview
Replace the modal-based create/edit flow with a full-page inline editing experience. The current implementations use a dialog or sidebar for creating and editing applications, and a separate read-only detail view. This change unifies them into a single always-editable page.

This is the **generic UX spec**. Each implementation has a framework-specific spec:
- [005a - Vue + Nuxt](../005a-inline-edit-vue/spec.md) (implemented)
- [005b - Next.js + Express](../005b-inline-edit-nextjs/spec.md)
- [005c - React + Koa](../005c-inline-edit-react-koa/spec.md)
- [005d - Svelte + Hono](../005d-inline-edit-svelte/spec.md)

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
Since the API requires an `applicationId` to create stages, stages added during creation are stored in local component state. On save, the application is created first, then each stage is created via the existing individual stage CRUD endpoints. No backend API changes are required.

### Explicit Save with dirty tracking
Changes require an explicit "Save" click. Snapshot-based dirty tracking compares current form values against the last saved state via JSON serialization. The save button label reflects the mode: "Create Application" (create) or "Save Changes" (edit). In edit mode, the save button is disabled when no changes are detected.

### Navigation guard for unsaved changes
Navigation away with unsaved changes triggers a confirmation dialog. Programmatic navigations (save, delete, discard in create mode) bypass the guard so the user is not prompted unnecessarily.

### Route param change handling
When navigating from `/applications/new` to `/applications/:id` after creation, the framework may reuse the same component instance. Each implementation must handle this case — detecting the param change and reloading data — using the appropriate framework mechanism.

### URL fields with clickable links
URL input fields include an adjacent link icon that opens the URL in a new tab when the value starts with `http://` or `https://`. This preserves the quick-access experience of having clickable links alongside editable fields.

## User Flows

### Create application
1. User clicks "+ Add Application" in the header
2. Browser navigates to `/applications/new`
3. Full-page form shows all fields in grouped sections, defaulting to today's date and "Applied" status
4. User fills in required fields (company name, position title)
5. User optionally adds interview stages in the stages section
6. User clicks "Create Application"
7. Application is created via the store/hook, then each local stage is created via individual `POST /api/applications/:id/interview-stages` calls
8. Browser navigates to `/applications/:newId`

### Edit application
1. User clicks an application card in the list
2. Browser navigates to `/applications/:id`
3. Full-page form loads with all fields populated from the saved state
4. User modifies fields
5. User clicks "Save Changes" (only enabled when dirty) — changes are persisted via the store/hook

### Discard changes
1. User makes changes on the edit page
2. "Discard" button appears (only visible when form is dirty)
3. User clicks "Discard" — confirm dialog appears
4. On confirm: form fields revert to last saved state (edit mode) or navigates to list (create mode)

## Field Layout

### Header area
- Back to List link (left side)
- Save button: "Create Application" (create) or "Save Changes" (edit, disabled when clean)
- Discard button (only visible when dirty)
- Archive / Restore / Delete buttons (edit mode only)

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
- Inline stage form with name, date, notes
- Stage list with edit/delete/toggle-complete
- In create mode: stages managed in local state
- In edit mode: stages managed through store/API

## Validation
- Required: company name, position title (max 200 chars each)
- Optional URL fields validated with `new URL()` constructor
- Salary min/max validated as numbers; min must not exceed max
- Errors displayed inline below each field; general errors in a banner

## E2E test scenarios
Each implementation should cover: navigation to create/edit pages, validation errors, create + redirect, edit + persist, discard changes, create with stages, delete, back-to-list link, default field values, conditional offer due date visibility.
