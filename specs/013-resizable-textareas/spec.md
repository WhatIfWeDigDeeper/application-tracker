# Feature Specification: Resizable Textareas

**Created**: 2026-02-18
**Status**: Complete
**Input**: User requirement: "Special Requirements and Notes textareas should be expandable with the usual draggable right corner."

## User Scenarios

### User Story 1 - Resize textarea vertically (Priority: P1)

As a user editing an application, I want to drag the bottom-right corner of the Special Requirements and Notes textareas to make them taller, so I can see more of my content while editing.

**Acceptance Scenarios**:

1. **Given** I navigate to the application edit/create form, **When** I hover over the bottom-right corner of a textarea, **Then** I see a resize cursor.
2. **Given** I drag the resize handle downward, **When** I release, **Then** the textarea is taller and shows more content.
3. **Given** I try to resize horizontally, **When** I drag sideways, **Then** the width does not change (vertical only).

## Requirements

- All 5 UI implementations must use `resize: vertical` (Tailwind `resize-y`) on Special Requirements and Notes textareas
- No horizontal resize (textareas are full-width)

## Success Criteria

- E2E test confirms `getComputedStyle(textarea).resize === 'vertical'` for `#specialRequirements` and `#notes` across all 5 stacks
