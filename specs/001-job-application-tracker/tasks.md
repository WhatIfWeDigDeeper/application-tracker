# Tasks: Job Application Tracker

**Input**: Design documents from `/specs/001-job-application-tracker/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: Included per Constitution Principle II (Testing Standards)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization with Next.js, TypeScript, Tailwind CSS, Jest

- [x] T001 Initialize Next.js 14 project with TypeScript, Tailwind CSS, and App Router in repository root
- [x] T002 [P] Configure TypeScript strict mode in tsconfig.json per quickstart.md
- [x] T003 [P] Configure ESLint with @typescript-eslint rules in .eslintrc.json
- [x] T004 [P] Configure Jest with React Testing Library per quickstart.md (jest.config.js, jest.setup.js)
- [x] T005 [P] Configure Tailwind CSS with status colors in tailwind.config.ts
- [x] T006 Create directory structure per plan.md (src/components/ui, src/components/applications, src/components/interviews, src/components/common, src/hooks, src/services, src/types, src/lib, src/assets/icons, tests/unit, tests/integration)

**Checkpoint**: Project structure ready, all dev tooling configured

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, services, and hooks that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Create TypeScript type definitions from data-model.md in src/types/application.ts (JobApplication, InterviewStage, ApplicationStatus, CompanyCategory, JobSource)
- [x] T008 [P] Create enum constants and default values in src/lib/constants.ts (DEFAULT_INTERVIEW_STAGES, status colors, category lists)
- [x] T009 [P] Create utility functions in src/lib/utils.ts (formatDate, generateId, isValidUrl)
- [x] T010 [P] Create validation service in src/services/validation.ts per contracts/storage-service.ts (validateApplication, validateInterviewStage)
- [x] T011 Implement localStorage storage service in src/services/storage.ts per contracts/storage-service.ts interface
- [x] T012 Create useLocalStorage hook in src/hooks/useLocalStorage.ts for localStorage sync with React state
- [x] T013 Create useApplications hook in src/hooks/useApplications.ts implementing UseApplicationsReturn interface from contracts
- [x] T014 [P] Create base UI components: Button in src/components/ui/Button.tsx
- [x] T015 [P] Create base UI components: Input in src/components/ui/Input.tsx
- [x] T016 [P] Create base UI components: Select in src/components/ui/Select.tsx
- [x] T017 [P] Create base UI components: Modal in src/components/ui/Modal.tsx
- [x] T018 [P] Create base UI components: Badge in src/components/ui/Badge.tsx
- [x] T019 [P] Create base UI components: Card in src/components/ui/Card.tsx
- [x] T020 Create Next.js root layout in src/app/layout.tsx with global styles
- [x] T021 Create global CSS with Tailwind imports in src/app/globals.css
- [x] T022 [P] Create EmptyState component in src/components/common/EmptyState.tsx
- [x] T023 [P] Create ConfirmDialog component in src/components/common/ConfirmDialog.tsx
- [x] T024 [P] Create Header component in src/components/common/Header.tsx

### Foundational Tests

- [x] T025 [P] Unit tests for storage service in tests/unit/services/storage.test.ts
- [x] T026 [P] Unit tests for validation service in tests/unit/services/validation.test.ts
- [x] T027 [P] Unit tests for useLocalStorage hook in tests/unit/hooks/useLocalStorage.test.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Add New Job Application (Priority: P1) 🎯 MVP

**Goal**: Users can add new job applications with all fields (required: company name, position title; optional: URLs, category, skills match, salary range, job source, notes)

**Independent Test**: Add a new application with all fields, verify it appears in list and persists after refresh

### Tests for User Story 1

- [ ] T028 [P] [US1] Unit tests for ApplicationForm component in tests/unit/components/ApplicationForm.test.tsx
- [ ] T029 [P] [US1] Integration test for add application workflow in tests/integration/workflows/addApplication.test.tsx

### Implementation for User Story 1

- [x] T030 [P] [US1] Create SVG icons for add button in src/assets/icons/PlusIcon.tsx
- [x] T031 [US1] Create ApplicationForm component in src/components/applications/ApplicationForm.tsx (handles create with all fields from FR-001 through FR-028)
- [x] T032 [US1] Create ApplicationCard component in src/components/applications/ApplicationCard.tsx (displays application summary)
- [x] T033 [US1] Create ApplicationList component in src/components/applications/ApplicationList.tsx (renders list of ApplicationCards)
- [x] T034 [US1] Create main page in src/app/page.tsx with 'use client' directive, ApplicationList, and add application button

**Checkpoint**: User Story 1 complete - users can add and view job applications

---

## Phase 4: User Story 2 - View and Filter Applications List (Priority: P1)

**Goal**: Users can view all applications in a list and filter by status, category, skills match, and job source; sort by date or company name

**Independent Test**: Create multiple applications with different statuses/categories, verify filtering and sorting work correctly

### Tests for User Story 2

- [ ] T035 [P] [US2] Unit tests for FilterBar component in tests/unit/components/FilterBar.test.tsx
- [ ] T036 [P] [US2] Unit tests for SortControls component in tests/unit/components/SortControls.test.tsx
- [ ] T037 [P] [US2] Unit tests for useFilters hook in tests/unit/hooks/useFilters.test.ts
- [ ] T038 [P] [US2] Unit tests for useSorting hook in tests/unit/hooks/useSorting.test.ts

### Implementation for User Story 2

- [x] T039 [P] [US2] Create SVG icons for filter/sort in src/assets/icons/FilterIcon.tsx and src/assets/icons/SortIcon.tsx
- [x] T040 [US2] Create useFilters hook in src/hooks/useFilters.ts (status, category, skillsMatch, jobSource filters per FR-006, FR-026, FR-027, FR-029)
- [x] T041 [US2] Create useSorting hook in src/hooks/useSorting.ts (dateApplied, companyName sorting per FR-007)
- [x] T042 [US2] Create FilterBar component in src/components/applications/FilterBar.tsx
- [x] T043 [US2] Create SortControls component in src/components/applications/SortControls.tsx
- [x] T044 [US2] Integrate FilterBar and SortControls into ApplicationList in src/components/applications/ApplicationList.tsx
- [x] T045 [US2] Update main page to show filter/sort controls in src/app/page.tsx

**Checkpoint**: User Stories 1 & 2 complete - core MVP functionality (add, view, filter, sort)

---

## Phase 5: User Story 3 - Track Interview Progress (Priority: P2)

**Goal**: Users can track interview progress with a checklist of stages, marking completion with dates, notes, and ratings

**Independent Test**: Set application to "Interviewing", verify default stages appear, mark stages complete with notes and ratings

### Tests for User Story 3

- [ ] T046 [P] [US3] Unit tests for InterviewChecklist component in tests/unit/components/InterviewChecklist.test.tsx
- [ ] T047 [P] [US3] Unit tests for InterviewStage component in tests/unit/components/InterviewStage.test.tsx
- [ ] T048 [P] [US3] Unit tests for StageForm component in tests/unit/components/StageForm.test.tsx

### Implementation for User Story 3

- [x] T049 [P] [US3] Create SVG icons for interview tracking in src/assets/icons/CheckIcon.tsx, src/assets/icons/EditIcon.tsx, src/assets/icons/DragIcon.tsx
- [x] T050 [US3] Create InterviewStage component in src/components/interviews/InterviewStage.tsx (displays single stage with completion, notes, rating)
- [x] T051 [US3] Create StageForm component in src/components/interviews/StageForm.tsx (edit stage details, mark complete with date/notes/rating per FR-009, FR-010, FR-011)
- [x] T052 [US3] Create InterviewChecklist component in src/components/interviews/InterviewChecklist.tsx (renders ordered list of stages with add/remove/reorder per FR-008, FR-012)
- [x] T053 [US3] Create ApplicationDetail component in src/components/applications/ApplicationDetail.tsx (shows full application with interview checklist)
- [x] T054 [US3] Add detail view modal/page integration in src/app/page.tsx for viewing application details with interview progress

**Checkpoint**: User Story 3 complete - interview tracking fully functional

---

## Phase 6: User Story 4 - Manage Offers with Due Dates (Priority: P2)

**Goal**: Users can set offer due dates when status is "Offered" and see deadline countdown

**Independent Test**: Change application status to "Offered", set due date, verify deadline displays correctly

### Tests for User Story 4

- [ ] T055 [P] [US4] Unit tests for offer due date functionality in tests/unit/components/ApplicationDetail.test.tsx

### Implementation for User Story 4

- [x] T056 [P] [US4] Create SVG icon for calendar/deadline in src/assets/icons/CalendarIcon.tsx
- [x] T057 [US4] Add offerDueDate field handling to ApplicationDetail (status-based editing when "Offered" per FR-013)
- [x] T058 [US4] Add deadline display with days remaining to ApplicationCard in src/components/applications/ApplicationCard.tsx
- [x] T059 [US4] Add deadline display with countdown to ApplicationDetail in src/components/applications/ApplicationDetail.tsx

**Checkpoint**: User Story 4 complete - offer management with deadlines functional

---

## Phase 7: User Story 5 - Archive and Delete Applications (Priority: P3)

**Goal**: Users can archive applications (hide from default view) and permanently delete with confirmation

**Independent Test**: Archive an application and verify it's hidden; toggle archived view to see it; delete an application with confirmation

### Tests for User Story 5

- [ ] T060 [P] [US5] Unit tests for archive/restore functionality in tests/unit/hooks/useApplications.test.ts
- [ ] T061 [P] [US5] Integration test for archive/delete workflow in tests/integration/workflows/archiveDelete.test.tsx

### Implementation for User Story 5

- [x] T062 [P] [US5] Create SVG icons for archive/delete in src/assets/icons/ArchiveIcon.tsx, src/assets/icons/TrashIcon.tsx, src/assets/icons/RestoreIcon.tsx
- [x] T063 [US5] Add archive/delete buttons to ApplicationCard in src/components/applications/ApplicationCard.tsx per FR-014, FR-015
- [x] T064 [US5] Add confirmation dialog for delete action using ConfirmDialog component
- [x] T065 [US5] Add "Show Archived" toggle to FilterBar in src/components/applications/FilterBar.tsx per FR-016
- [x] T066 [US5] Add restore button for archived applications in ApplicationCard

**Checkpoint**: User Story 5 complete - data management (archive/delete) functional

---

## Phase 8: User Story 6 - Responsive Mobile and Desktop Experience (Priority: P3)

**Goal**: Interface works on mobile (320px+) and desktop (up to 1920px) with touch-friendly UI on mobile

**Independent Test**: Test all features on mobile viewport (320px) and desktop viewport (1920px), verify usability

### Tests for User Story 6

- [ ] T067 [P] [US6] Visual/layout tests for responsive design in tests/integration/workflows/responsive.test.tsx

### Implementation for User Story 6

- [x] T068 [US6] Add responsive Tailwind classes to ApplicationList for mobile/desktop layouts in src/components/applications/ApplicationList.tsx
- [x] T069 [US6] Add responsive Tailwind classes to ApplicationForm for mobile/desktop in src/components/applications/ApplicationForm.tsx
- [x] T070 [US6] Add responsive Tailwind classes to ApplicationDetail for mobile/desktop in src/components/applications/ApplicationDetail.tsx
- [x] T071 [US6] Add responsive Tailwind classes to FilterBar and SortControls for mobile collapse/expand
- [x] T072 [US6] Add touch-friendly button sizes and spacing throughout UI components (min 44px touch targets)
- [x] T073 [US6] Add mobile navigation/menu pattern in Header component in src/components/common/Header.tsx

**Checkpoint**: User Story 6 complete - fully responsive experience

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final polish, performance optimization, accessibility compliance

- [x] T074 [P] Add ARIA labels and roles for accessibility compliance (WCAG 2.1 AA) across all components
- [x] T075 [P] Add keyboard navigation support to all interactive elements
- [x] T076 [P] Add focus trap to Modal component for accessibility
- [x] T077 Add error boundary for graceful error handling in src/app/layout.tsx
- [x] T078 [P] Add loading states for async operations (localStorage read on initial load)
- [x] T079 Run ESLint and fix any linting errors
- [x] T080 Run TypeScript compiler and fix any type errors
- [x] T081 Run all tests and ensure 100% pass rate
- [ ] T082 Manual testing following quickstart.md verification checklist
- [ ] T083 Performance audit: verify page load <2s, filter/sort <100ms for 100 applications

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - US1 & US2 can proceed in parallel (both P1 priority)
  - US3 & US4 can proceed in parallel after US1 (both P2 priority)
  - US5 & US6 can proceed in parallel after US1 (both P3 priority)
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Priority | Dependencies | Can Start After |
|-------|----------|--------------|-----------------|
| US1 - Add Application | P1 | Foundational | Phase 2 |
| US2 - View & Filter | P1 | Foundational, US1 (for list) | T033 |
| US3 - Interview Tracking | P2 | US1 (needs applications) | T034 |
| US4 - Offer Management | P2 | US1 (needs applications) | T034 |
| US5 - Archive/Delete | P3 | US1 (needs applications) | T034 |
| US6 - Responsive | P3 | US1-US5 (needs all components) | T066 |

### Parallel Opportunities

**Phase 1 (Setup)**: T002, T003, T004, T005 can run in parallel

**Phase 2 (Foundational)**:
- T008, T009, T010 can run in parallel
- T014-T019 (UI components) can all run in parallel
- T022-T024 (common components) can run in parallel
- T025-T027 (tests) can run in parallel

**Phase 3-8 (User Stories)**:
- All test tasks marked [P] within a story can run in parallel
- US1 and US2 implementation tasks can start as soon as Foundational is complete
- US3 and US4 can run in parallel once US1 is complete
- US5 and US6 can run in parallel once their dependencies are met

---

## Parallel Example: Foundational Phase

```bash
# Launch all parallelizable foundational tasks together:
Task: "Create enum constants in src/lib/constants.ts"
Task: "Create utility functions in src/lib/utils.ts"
Task: "Create validation service in src/services/validation.ts"

# Launch all UI components in parallel:
Task: "Create Button in src/components/ui/Button.tsx"
Task: "Create Input in src/components/ui/Input.tsx"
Task: "Create Select in src/components/ui/Select.tsx"
Task: "Create Modal in src/components/ui/Modal.tsx"
Task: "Create Badge in src/components/ui/Badge.tsx"
Task: "Create Card in src/components/ui/Card.tsx"
```

## Parallel Example: User Story 1

```bash
# Launch User Story 1 tests together:
Task: "Unit tests for ApplicationForm in tests/unit/components/ApplicationForm.test.tsx"
Task: "Integration test for add workflow in tests/integration/workflows/addApplication.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Add Applications)
4. Complete Phase 4: User Story 2 (View & Filter)
5. **STOP and VALIDATE**: Test US1 + US2 independently
6. Deploy/demo MVP: Users can add, view, filter, sort applications

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Add Application) → Test → Deploy (Minimal MVP!)
3. Add US2 (Filter/Sort) → Test → Deploy (Full MVP)
4. Add US3 (Interviews) → Test → Deploy
5. Add US4 (Offers) → Test → Deploy
6. Add US5 (Archive/Delete) → Test → Deploy
7. Add US6 (Responsive) → Test → Deploy (Feature Complete)
8. Polish → Final validation → Production ready

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in same phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD approach per Constitution)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All file paths are relative to repository root
