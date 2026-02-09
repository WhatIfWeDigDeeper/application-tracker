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
Changes require an explicit "Save" click. Snapshot-based dirty tracking compares current form values against the last saved state via JSON serialization. The save button label reflects the mode: "Create Application" (create) or "Save Changes" (edit). In edit mode, the save button is disabled when no changes are detected.

Navigation away with unsaved changes triggers a `window.confirm()` dialog via `onBeforeRouteLeave`. Programmatic navigations (save, delete, discard in create mode) use a `skipNavGuard` ref to bypass the guard.

### Vue Router component reuse
When navigating from `/applications/new` to `/applications/:id` after creation, Vue Router reuses the `ApplicationEdit` component instance (`onMounted` does not re-fire). A `watch` on the `id` prop detects the route change and reloads the application data from the store.

### URL fields with clickable links
URL input fields (`UrlFieldInput.vue`) include an adjacent link icon that opens the URL in a new tab when the value starts with `http://` or `https://`. This preserves the read-only experience of having clickable links.

## User Flows

### Create application
1. User clicks "+ Add Application" in the header
2. Browser navigates to `/applications/new`
3. Full-page form shows all fields in grouped sections, defaulting to today's date and "Applied" status
4. User fills in required fields (company name, position title)
5. User optionally adds interview stages in the stages section
6. User clicks "Create Application"
7. Application is created via `listStore.createApplication()`, then each local stage is created via individual `POST /api/applications/:id/interview-stages` calls
8. Browser navigates to `/applications/:newId` (component reuses, `watch(props.id)` triggers reload)

### Edit application
1. User clicks an application card in the list
2. Browser navigates to `/applications/:id`
3. Full-page form loads with all fields populated from the saved state
4. User modifies fields
5. User clicks "Save Changes" (only enabled when dirty) — changes are persisted via `detailStore.updateApplication()` (event sourcing records the changes)
6. Undo/redo available via Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z (or Y) and the UndoRedoBar

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
- Undo/Redo bar + History button (edit mode only, separate row below)

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

### Components
- Reuses existing: InterviewStageForm, InterviewStageItem, RatingInput, ConfirmDialog, UndoRedoBar, HistoryPanel
- Replaces: ApplicationFormModal.vue (deleted), ApplicationDetail.vue (deleted)
- New: ApplicationEdit.vue (view), UrlFieldInput.vue (component)

### Form state management
- Individual `ref()` per field (not a single reactive object) for straightforward v-model binding
- Snapshot-based dirty tracking: `captureSnapshot()` serializes all form fields to JSON; `isDirty` compares current snapshot to the saved one
- `populateFromApplication()` fills form refs from an `Application` object
- `buildInput()` constructs the API payload from form refs

### Navigation patterns
- `skipNavGuard` ref bypasses `onBeforeRouteLeave` for programmatic navigation after save, delete, and discard-in-create-mode
- `watch(() => props.id)` handles Vue Router component reuse when navigating from `/applications/new` to `/applications/:id`
- `loadApplication()` is the shared entry point for both `onMounted` and the id watcher

### Undo/redo integration
- Keyboard shortcuts (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z/Y) registered via `window.addEventListener('keydown')` in `onMounted`
- `watch(detailStore.application)` detects undo/redo state changes (`isUndoRedoInProgress`) and repopulates form + recaptures snapshot

### Validation
- Required: company name, position title (max 200 chars each)
- Optional URL fields validated with `new URL()` constructor
- Salary min/max validated as numbers; min must not exceed max
- Errors displayed inline below each field; general errors in a banner

### E2e tests
- `application-crud.spec.ts` covers: navigation, validation errors, create + redirect, edit + persist, discard, create with stages, delete, back-to-list, default values, conditional offer due date
