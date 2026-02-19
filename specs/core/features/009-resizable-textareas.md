# Feature: Resizable Textareas

Allow users to vertically resize textarea fields with persisted height across page reloads.

**Priority**: P3 (Nice to Have)

---

## Overview

Textarea fields vary in how much content users write. Some users write detailed notes while others keep them brief. This feature lets users drag a resize handle to adjust textarea height, and remembers their preference via localStorage so the height is restored on subsequent visits.

---

## User Stories

### US-9.1: Resize Textarea

**As a** job seeker
**I want to** resize textarea fields by dragging a handle
**So that** I can see more or less content as needed

#### Acceptance Criteria

1. **Given** I am viewing a textarea field
   **When** I drag the resize handle
   **Then** the textarea height changes accordingly

2. **Given** I am resizing a textarea
   **When** I drag
   **Then** only the vertical dimension changes (horizontal width stays fixed)

3. **Given** I am on an application form or detail page
   **When** I look at the specialRequirements, notes, and interview stage notes fields
   **Then** each has a visible resize handle

---

### US-9.2: Persist Height

**As a** job seeker
**I want to** have my resized textarea heights remembered
**So that** I don't have to resize every time I visit the page

#### Acceptance Criteria

1. **Given** I have resized a textarea
   **When** I reload the page
   **Then** the textarea returns to my previously set height

2. **Given** the height is persisted
   **When** I check storage
   **Then** it is saved to localStorage keyed by field identifier (e.g., `textarea-height-notes`)

3. **Given** no saved height exists for a field
   **When** the textarea renders
   **Then** the default height is used

---

## Behaviors

### Resize Textarea

```
Input: { fieldId, newHeight (from resize event) }
Process:
  1. User drags the native browser resize handle
  2. On resize event (or ResizeObserver callback):
     a. Read the new height of the textarea element
     b. Construct storage key: "textarea-height-{fieldId}"
     c. Save height to localStorage: localStorage.setItem(key, newHeight)
Output: Height saved to localStorage
```

### Restore Height on Mount

```
Input: { fieldId }
Process:
  1. On component mount, construct storage key: "textarea-height-{fieldId}"
  2. Read saved height: localStorage.getItem(key)
  3. If saved height exists:
     a. Validate it is a positive number
     b. Cap at viewport height if larger
     c. Apply as inline style: element.style.height = savedHeight + "px"
  4. If no saved height, use CSS default height
Output: Textarea rendered at saved or default height
```

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| localStorage unavailable (private browsing, disabled) | Use default height; resize still works but is not persisted |
| Saved height larger than viewport | Cap at viewport height minus reasonable margin |
| Saved height is zero or negative | Ignore saved value; use default height |
| Clearing browser data | Heights reset to defaults (expected behavior) |
| Multiple textareas on same page | Each has independent key (e.g., `textarea-height-notes`, `textarea-height-specialRequirements`) |
| Interview stage notes (multiple stages) | Key includes stage identifier (e.g., `textarea-height-stage-{stageId}-notes`) |
| Window resize makes saved height too large | No automatic adjustment; user can re-resize |

---

## Display Requirements

### Resize Handle

- Use the browser's native textarea resize handle (`resize: vertical` CSS)
- No custom drag handle needed
- Cursor changes to resize cursor on hover over handle

### Textarea Styling

- Consistent minimum height across all textareas (e.g., 80px)
- No maximum height constraint (user controls size)
- Smooth visual feedback during resize

---

## API Operations

No API operations required. This feature is entirely client-side using localStorage for persistence.

| Aspect | Details |
|--------|---------|
| Storage mechanism | localStorage |
| Key format | `textarea-height-{fieldId}` |
| Value format | Height in pixels (number as string) |
| Fallback | CSS default height when no stored value |
