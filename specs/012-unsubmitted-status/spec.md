# Feature Specification: Unsubmitted Default Status

**Created**: 2026-02-17
**Status**: Draft
**Depends on**: [011-csv-import-export](../011-csv-import-export/spec.md)
**Input**: User requirement: "Add a new 'unsubmitted' status as the default. When unsubmitted, dateApplied should be null and disabled."

- [Clarifications](#clarifications)
- [User Scenarios & Testing *(mandatory)*](#user-scenarios--testing-mandatory)
- [Requirements *(mandatory)*](#requirements-mandatory)
- [Success Criteria *(mandatory)*](#success-criteria-mandatory)

## Clarifications

- Q: Which stacks? → A: All 5 implementation stacks. express_prisma already has 'unsubmitted' in types but needs Tailwind color fix and date logic.
- Q: What color for the badge? → A: Gray (neutral, indicating draft/pending state).
- Q: Should dateApplied auto-fill when changing from unsubmitted? → A: Yes, auto-populate with today's date when status changes away from 'unsubmitted'.
- Q: Should the backend enforce the constraint? → A: Yes, if status is 'unsubmitted', force dateApplied to null on create/update.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New Application Defaults to Unsubmitted (Priority: P1)

As a user, I want new applications to default to "Unsubmitted" status with no date applied, so I can draft applications before submitting them.

**Acceptance Scenarios**:

1. **Given** I navigate to the create application form, **When** the form loads, **Then** the status dropdown shows "Unsubmitted" and the date applied field is empty and disabled.
2. **Given** I create an application without changing the status, **When** the application is saved, **Then** it has status "unsubmitted" and dateApplied is null.
3. **Given** I view the application list, **When** I see an unsubmitted application, **Then** it displays a gray "Unsubmitted" badge.

### User Story 2 - Date Applied Tied to Status (Priority: P1)

As a user, I want the date applied field to be automatically managed based on status, so I don't accidentally set a date before submitting.

**Acceptance Scenarios**:

1. **Given** I'm editing an application with "Unsubmitted" status, **When** I change the status to "Applied", **Then** the date applied field becomes enabled and auto-fills with today's date.
2. **Given** I'm editing an application with "Applied" status, **When** I change the status back to "Unsubmitted", **Then** the date applied field is cleared and disabled.
3. **Given** I try to set dateApplied via the API while status is "unsubmitted", **When** the request is processed, **Then** the dateApplied is forced to null (silently cleared).

## Requirements *(mandatory)*

### Functional Requirements

1. **Default Status**: New applications default to "unsubmitted" in all 5 stacks
2. **Date Constraint**: When status is "unsubmitted", dateApplied must be null
3. **UI Disabled State**: Date applied input is disabled when status is "unsubmitted"
4. **Auto-fill Date**: When status changes from "unsubmitted" to any other value, auto-populate dateApplied with today's date
5. **Clear Date**: When status changes to "unsubmitted", clear dateApplied
6. **Badge Color**: Gray for "Unsubmitted" status badge across all UIs
7. **Backend Enforcement**: All 5 backends enforce the date↔status constraint

### Technical Requirements

1. **Database**: Add 'unsubmitted' to PostgreSQL ENUMs in 4 schemas (express_prisma already has it)
2. **Zod Schemas**: Add 'unsubmitted' to all backend validation schemas
3. **Frontend Types**: Add 'unsubmitted' to all frontend type unions and constants
4. **Tailwind Fix**: Add missing `unsubmitted` color token in ui/tailwind.config.ts
5. **CSV Import**: Update nest-api CSV service default from 'applied' to 'unsubmitted'

## Success Criteria *(mandatory)*

- [ ] All 5 backends default new applications to 'unsubmitted' status
- [ ] All 5 backends enforce dateApplied=null when status='unsubmitted'
- [ ] All 5 UIs show disabled date field when status is 'unsubmitted'
- [ ] All 5 UIs auto-fill today's date when changing from 'unsubmitted'
- [ ] All 5 UIs display gray "Unsubmitted" badge
- [ ] Unit tests verify the date↔status constraint in each backend
- [ ] E2E tests verify the UI behavior
- [ ] Build, lint, and all tests pass across all stacks
