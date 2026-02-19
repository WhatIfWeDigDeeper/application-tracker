# UI Components

This document defines reusable UI components and their behaviors, independent of any specific UI framework.

---

## Component Inventory

| Component | Purpose |
|-----------|---------|
| ApplicationCard | Display an application in the list |
| ApplicationForm | Create/edit application |
| FilterBar | Filter controls for the list |
| SortControls | Sort field and direction |
| InterviewStageList | List of interview stages |
| InterviewStageItem | Single interview stage |
| InterviewStageForm | Edit interview stage |
| StatusBadge | Visual status indicator |
| RatingDisplay | Star rating display |
| RatingInput | Star rating selector |
| ConfirmDialog | Confirmation modal |
| EmptyState | No data placeholder |
| Pagination | Page navigation |
| HistoryPanel | Sliding panel showing application change timeline |
| ImportModal | CSV file upload dialog with results display |

---

## Component: ApplicationCard

**Purpose**: Display a single application in the list view.

### Props/Inputs

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| application | Application | yes | The application data |
| onClick | function | yes | Handler for card click |
| onArchive | function | yes | Handler for archive action |
| onDelete | function | yes | Handler for delete action |

### Display Elements

- Company name (primary text)
- Position title (secondary text)
- Status badge
- Date applied (displays '—' when null)
- Company category (if set)
- Skills match rating (if set)
- Interview progress "X/Y stages" (if interviewing)
- Offer due date or "Overdue" (if given offer with due date)
- Archived indicator (if archived)

### Interactions

- Click card → navigate to detail view
- Actions menu (three dots) → show archive/delete options
- Hover state for desktop

### Variants

| State | Visual Treatment |
|-------|------------------|
| Default | Standard card |
| Archived | Muted/grayed styling |
| With urgent offer | Warning highlight on due date |
| With overdue offer | Alert/error highlight |

---

## Component: ApplicationForm

**Purpose**: Form for creating or editing an application.

### Props/Inputs

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| application | Application | no | Existing application for edit mode |
| onSubmit | function | yes | Handler for form submission |
| onCancel | function | yes | Handler for cancel |
| isLoading | boolean | no | Show loading state |

### Form Fields

See [screens.md](screens.md) for field layout.

### Behaviors

- **Validation on blur**: Validate individual fields when focus leaves
- **Validation on submit**: Validate all fields, show summary
- **Dirty tracking**: Track if form has unsaved changes
- **Cancel confirmation**: If dirty, confirm before discarding
- **Submit handling**: Disable button, show loading, handle success/error
- **Error display**: Inline errors below fields, summary at top

### Validation Rules

See [validation-rules.md](../domain/validation-rules.md).

### States

| State | Behavior |
|-------|----------|
| Pristine | No changes, cancel without confirm |
| Dirty | Has changes, confirm on cancel |
| Submitting | Form disabled, loading indicator |
| Error | Show validation errors, enable retry |
| Success | Close form, show success message |

---

## Component: FilterBar

**Purpose**: Controls for filtering the application list.

### Props/Inputs

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| filters | FilterState | yes | Current filter values |
| onChange | function | yes | Handler for filter changes |
| resultCount | number | yes | Number of matching results |
| totalCount | number | yes | Total number of applications |

### Filter Controls

| Filter | Control Type | Options |
|--------|--------------|---------|
| status | Multi-select dropdown | All ApplicationStatus values |
| companyCategory | Dropdown | All CompanyCategory values |
| jobSource | Dropdown | All JobSource values |
| skillsMatch | Dropdown or slider | "Any", "2+", "3+", "4+", "5" |
| includeArchived | Checkbox | Boolean |

### Behaviors

- Filter changes immediately update the list
- Show count of active filters
- "Clear all" button when filters active
- Show "X of Y applications" count
- Persist filters in URL or session (implementation choice)

### Responsive Behavior

- Desktop: Inline filter controls
- Mobile: Collapse to "Filters" button that opens drawer/modal

---

## Component: SortControls

**Purpose**: Controls for sorting the application list.

### Props/Inputs

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| sortField | string | yes | Current sort field |
| sortDirection | 'asc' \| 'desc' | yes | Current direction |
| onChange | function | yes | Handler for sort changes |

### Sort Options

| Field | Label |
|-------|-------|
| dateApplied | Date Applied |
| companyName | Company Name |
| updatedAt | Last Updated |

### Behaviors

- Click field dropdown to change sort field
- Click direction toggle to flip asc/desc
- Visual indicator of current sort

---

## Component: InterviewStageList

**Purpose**: Display and manage interview stages for an application.

### Props/Inputs

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| stages | InterviewStage[] | yes | Array of stages |
| onAdd | function | yes | Handler for adding stage |
| onUpdate | function | yes | Handler for updating stage |
| onRemove | function | yes | Handler for removing stage |
| onReorder | function | yes | Handler for reordering |

### Display

- Ordered list of InterviewStageItem components
- "Add stage" button at bottom
- Progress summary "X of Y completed"

### Behaviors

- Stages displayed in order by `order` field
- Drag-and-drop or up/down buttons for reorder
- Click stage to expand/edit inline or in modal

---

## Component: InterviewStageItem

**Purpose**: Display a single interview stage in the checklist.

### Props/Inputs

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| stage | InterviewStage | yes | The stage data |
| onToggleComplete | function | yes | Handler for completion toggle |
| onEdit | function | yes | Handler for edit action |
| onDelete | function | yes | Handler for delete action |

### Display Elements

- Completion checkbox
- Stage name
- Completion date (if completed)
- Performance rating (if set)
- Notes indicator (if has notes)
- Edit/delete actions

### Variants

| State | Visual Treatment |
|-------|------------------|
| Pending | Unchecked, normal weight |
| Completed | Checked, possibly strikethrough or muted |
| With rating | Show stars inline |
| With notes | Show notes icon/indicator |

### Interactions

- Click checkbox → toggle completion (prompt for date if completing)
- Click stage → expand to show notes/details or open edit
- Click edit → open edit form
- Click delete → confirm then remove

---

## Component: StatusBadge

**Purpose**: Visual indicator for application status.

### Props/Inputs

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| status | ApplicationStatus | yes | The status value |
| size | 'small' \| 'medium' | no | Badge size |

### Color Mapping

| Status | Color Category |
|--------|----------------|
| unsubmitted | Draft (gray) |
| applied | Neutral (gray/blue) |
| interviewing | Active (blue/purple) |
| given offer | Warning (yellow/orange) |
| accepted offer | Success (green) |
| rejected | Error (red) |
| declined offer | Muted (gray) |
| no offer | Muted (gray) |

### Accessibility

- Color not sole indicator - include text label
- Sufficient contrast for text

---

## Component: RatingDisplay

**Purpose**: Display a 1-5 rating as stars.

### Props/Inputs

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| value | number | yes | Rating value 1-5 |
| max | number | no | Maximum rating (default 5) |
| showNumeric | boolean | no | Show "4/5" text |

### Display

- Filled stars for rating value
- Empty stars for remaining
- Optional numeric display

---

## Component: RatingInput

**Purpose**: Select a 1-5 rating value.

### Props/Inputs

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| value | number | no | Current rating |
| onChange | function | yes | Handler for change |
| allowClear | boolean | no | Allow clearing rating |

### Behaviors

- Click star to set rating
- Hover to preview selection
- Click same star to clear (if allowClear)
- Keyboard accessible (arrow keys to adjust)

---

## Component: ConfirmDialog

**Purpose**: Modal for confirming destructive actions.

### Props/Inputs

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| title | string | yes | Dialog title |
| message | string | yes | Confirmation message |
| confirmLabel | string | no | Confirm button text (default "Confirm") |
| cancelLabel | string | no | Cancel button text (default "Cancel") |
| isDestructive | boolean | no | Style as destructive action |
| onConfirm | function | yes | Handler for confirm |
| onCancel | function | yes | Handler for cancel |

### Behaviors

- Modal overlay blocks background interaction
- Focus trapped within modal
- Escape key cancels
- Clicking outside cancels (optional)
- Destructive variant: confirm button in red/warning color

---

## Component: EmptyState

**Purpose**: Placeholder when no data to display.

### Props/Inputs

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| icon | element | no | Illustration or icon |
| title | string | yes | Primary message |
| description | string | no | Secondary message |
| action | element | no | Call-to-action button |

### Common Uses

| Context | Title | Action |
|---------|-------|--------|
| No applications | "No applications yet" | "Add Application" |
| No filter matches | "No applications match your filters" | "Clear Filters" |
| No archived | "No archived applications" | None |

---

## Component: Pagination

**Purpose**: Navigate through paginated results.

### Props/Inputs

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| currentPage | number | yes | Current page (1-indexed) |
| totalPages | number | yes | Total number of pages |
| onPageChange | function | yes | Handler for page change |

### Display

- Previous/Next buttons
- Page numbers (with ellipsis for large ranges)
- Current page highlighted
- Disabled state for first/last page buttons

### Behaviors

- Click page number → go to page
- Click Previous → go to previous page (disabled on page 1)
- Click Next → go to next page (disabled on last page)
- Show subset of pages with ellipsis for large page counts

---

## Component: HistoryPanel

**Purpose**: Sliding side panel showing the history of changes to an application.

### Props/Inputs

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| applicationId | UUID | yes | Application to show history for |
| isOpen | boolean | yes | Whether the panel is visible |
| onClose | function | yes | Handler for closing the panel |
| onRestore | function | yes | Handler for restoring to a version |

### Display Elements

- Panel title "Change History" with close button
- Timeline list of history entries, newest first
- Each entry shows:
  - Human-readable description (e.g., "Status changed to interviewing")
  - Relative timestamp (e.g., "2 hours ago")
  - Expand/collapse toggle for field-level diffs
- Expanded entry shows:
  - List of changed fields
  - Old value (struck-through, red/muted)
  - New value (green/highlighted)
  - "Restore to this point" button (except on most recent entry)

### Interactions

- Click entry → expand/collapse field diffs
- Click "Restore to this point" → confirm dialog → restore application
- Click close or click outside → panel closes
- Escape key → panel closes

### Variants

| State | Visual Treatment |
|-------|------------------|
| Loading | Skeleton placeholder entries |
| Empty | "No history available" message |
| Entry expanded | Diffs visible below description |
| Current version | Marked "(current)" with no restore button |

---

## Component: ImportModal

**Purpose**: Dialog for uploading a CSV file and viewing import results.

### Props/Inputs

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| isOpen | boolean | yes | Whether the modal is visible |
| onClose | function | yes | Handler for closing |
| onImportComplete | function | yes | Handler called after successful import |

### Display Elements

- Modal title "Import Applications from CSV"
- Download template link
- File input accepting .csv files only
- Upload/import button
- Results section (shown after upload):
  - Imported count (success)
  - Skipped count (duplicates)
  - Error count with per-row details

### Interactions

- Select file → enable upload button
- Click upload → show loading, process file, show results
- Click "Download Template" → browser downloads template CSV
- Click close → dismiss modal, refresh application list if imports occurred

### States

| State | Behavior |
|-------|----------|
| Initial | File picker shown, no results |
| Uploading | Loading indicator, controls disabled |
| Results | Counts shown, file picker reset for another import |
| Error | Upload-level error message (e.g., not a CSV file) |

---

## State Management Patterns

### Loading States

Components should handle:
- Initial loading (skeleton or spinner)
- Refresh loading (subtle indicator, keep existing data)
- Action loading (disable controls, show progress)

### Error States

Components should handle:
- Validation errors (inline, field-level)
- API errors (toast or inline message)
- Network errors (retry option)

### Optimistic Updates

For better UX, consider:
- Immediately update UI on action
- Revert if API call fails
- Show subtle loading indicator

---

## Theme Support

Components should support theming:
- Light mode (default)
- Dark mode
- Respect system preference
- Manual toggle override

See [002-dark-mode spec](../../002-dark-mode/spec.md) for details.
