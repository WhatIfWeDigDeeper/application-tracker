# Feature Specification: Nullable Date Applied

**Created**: 2026-02-16
**Status**: Draft
**Input**: User requirement: "Make dateApplied nullable — I frequently create application records before actually applying, so the date field shouldn't auto-fill with today's date"

- [Clarifications](#clarifications)
- [User Scenarios & Testing *(mandatory)*](#user-scenarios--testing-mandatory)
  - [User Story 1 - Create Application Without Date Applied (Priority: P1)](#user-story-1---create-application-without-date-applied-priority-p1)
  - [User Story 2 - Display Null Date Applied (Priority: P1)](#user-story-2---display-null-date-applied-priority-p1)
  - [User Story 3 - Set Date Applied Later (Priority: P1)](#user-story-3---set-date-applied-later-priority-p1)
  - [User Story 4 - Sort and Filter with Null Dates (Priority: P2)](#user-story-4---sort-and-filter-with-null-dates-priority-p2)
- [Requirements *(mandatory)*](#requirements-mandatory)
  - [Functional Requirements](#functional-requirements)
  - [Technical Requirements](#technical-requirements)
- [Success Criteria *(mandatory)*](#success-criteria-mandatory)

## Clarifications

- Q: Should dateApplied auto-fill with today's date on the create form? → A: No, leave it empty by default
- Q: What should the UI show when dateApplied is null? → A: Display "—" in list views and detail views
- Q: Should status also become nullable? → A: No, status keeps its DB default of `applied` — null status would require broader UI changes
- Q: Does this affect all 5 implementations? → A: Yes, all schemas, backends, and frontends need updating
- Q: Should existing records with dates be affected? → A: No, existing data is unchanged. Only the constraint and default behavior change.
- Q: How should sorting by dateApplied handle null values? → A: Null dates sort last (after all dated records) regardless of sort direction

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Application Without Date Applied (Priority: P1)

As a user, I want to create a job application record without specifying a date applied, so that I can track opportunities I'm preparing for before I actually submit my application.

**Why this priority**: Core behavior change — this is the primary motivation for the feature.

**Independent Test**: Create a new application with only company name and position title (leave date blank), verify it saves successfully.

**Acceptance Scenarios**:

1. **Given** I am on the "Add Application" form, **When** I leave the Date Applied field empty and fill in company name and position title, **Then** the application is created successfully with a null date applied.
2. **Given** I am creating a new application via the API, **When** I omit `dateApplied` from the request body, **Then** the application is created with `dateApplied: null` (not today's date).
3. **Given** I am on the "Add Application" form, **When** the form loads, **Then** the Date Applied field is empty (not pre-filled with today's date).

---

### User Story 2 - Display Null Date Applied (Priority: P1)

As a user, I want to clearly see which applications don't have a date applied, so I can distinguish between submitted and pending applications at a glance.

**Why this priority**: Without proper display handling, null dates would show as errors or blank space.

**Independent Test**: Create an application without a date, verify it displays "—" in the application list and detail view.

**Acceptance Scenarios**:

1. **Given** an application exists with no date applied, **When** I view the application list, **Then** the date column shows "—" for that application.
2. **Given** an application exists with no date applied, **When** I view the application detail page, **Then** the Date Applied field shows "—" (not an empty or broken date).
3. **Given** an application has a date applied set, **When** I view it in the list or detail view, **Then** the date displays normally (no regression).

---

### User Story 3 - Set Date Applied Later (Priority: P1)

As a user, I want to be able to add or update the date applied on an existing application, so I can record when I actually submit my application.

**Why this priority**: Users need the full workflow — create without date, then fill it in when they apply.

**Independent Test**: Create an application without a date, then edit it to add a date. Verify the date persists.

**Acceptance Scenarios**:

1. **Given** I have an application with no date applied, **When** I edit the application and set a date, **Then** the date is saved and displayed correctly.
2. **Given** I have an application with a date applied, **When** I edit the application and clear the date field, **Then** the date is set back to null and displays as "—".
3. **Given** I update the date applied via the API, **When** I send a PATCH with `dateApplied: "2026-03-01"`, **Then** the date is updated and the history records the change.

---

### User Story 4 - Sort and Filter with Null Dates (Priority: P2)

As a user, I want sorting by date applied to handle null dates sensibly, so that my list view remains useful.

**Why this priority**: Sorting is a secondary concern but important for usability.

**Independent Test**: Create applications with and without dates, sort by date applied, verify null dates appear last.

**Acceptance Scenarios**:

1. **Given** I have applications with and without dates applied, **When** I sort by Date Applied descending, **Then** applications with null dates appear at the bottom of the list.
2. **Given** I have applications with and without dates applied, **When** I sort by Date Applied ascending, **Then** applications with null dates appear at the bottom of the list.
3. **Given** all my applications have dates applied, **When** I sort by Date Applied, **Then** the sort behavior is unchanged from before this feature.

---

## Requirements *(mandatory)*

### Functional Requirements

1. **Nullable Date Applied**: The `dateApplied` field must accept null/empty values in all create and update operations
2. **No Auto-Default**: The create form and API must NOT auto-fill dateApplied with today's date when omitted
3. **Null Display**: Null dateApplied displays as "—" in all list views, card components, and detail views
4. **Edit Capability**: Users can add, change, or clear dateApplied on existing applications
5. **Sort Handling**: Null dates sort last regardless of sort direction when sorting by dateApplied
6. **History Tracking**: Changes to dateApplied (including setting from null or clearing to null) are recorded in application history
7. **All Implementations**: This change applies to all 5 frontend+backend implementation pairs

### Technical Requirements

1. **Database Migration**: `ALTER COLUMN date_applied DROP NOT NULL` across all 5 schemas (express_prisma, react_koa, svelte_hono, vue_nuxt, react_nestjs)
2. **Backward Compatibility**: Existing records with dates are unaffected
3. **API Compatibility**: The API accepts both `dateApplied: "2026-02-16"` and omitted/null dateApplied
4. **Validation**: Zod schemas remain with dateApplied as optional (already the case in most implementations)
5. **E2E Tests**: Update shared e2e tests to cover creating applications without dateApplied

## Success Criteria *(mandatory)*

### Measurable Outcomes

- [ ] dateApplied column is nullable in all 5 database schemas
- [ ] Creating an application without dateApplied succeeds in all 5 implementations
- [ ] The create form does NOT pre-fill dateApplied with today's date in any implementation
- [ ] Null dateApplied displays as "—" in all list views and detail views across all 5 UIs
- [ ] Sorting by dateApplied places null-date records last in all implementations
- [ ] Editing an application to add/remove dateApplied works correctly
- [ ] Application history records dateApplied changes (including to/from null)
- [ ] All existing e2e tests continue to pass
- [ ] Build, lint, and test pass for all 5 implementations
