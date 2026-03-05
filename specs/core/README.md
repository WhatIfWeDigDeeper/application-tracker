# Core Specifications

Technology-agnostic specifications for the Job Application Tracker.

These specifications define **what** the application does without prescribing **how** it should be implemented. Use these to build the application with any technology stack.

---

## Quick Links

### Domain Model
- [entities.md](domain/entities.md) - Core data entities (JobApplication, InterviewStage)
- [enums.md](domain/enums.md) - Enumerated types (Status, Category, Source)
- [validation-rules.md](domain/validation-rules.md) - Field validation requirements
- [state-transitions.md](domain/state-transitions.md) - Status state machine

### Feature Specifications
- [001-application-management.md](features/001-application-management.md) - Create, view, edit applications
- [002-interview-tracking.md](features/002-interview-tracking.md) - Track interview progress
- [003-offer-management.md](features/003-offer-management.md) - Manage offers and deadlines
- [004-filtering-sorting.md](features/004-filtering-sorting.md) - Filter and sort the list
- [005-archive-delete.md](features/005-archive-delete.md) - Archive and delete applications
- [006-history.md](features/006-history.md) - Application change history and restore
- [007-csv-import-export.md](features/007-csv-import-export.md) - CSV import and export
- [008-inline-editing.md](features/008-inline-editing.md) - Inline field editing
- [009-resizable-textareas.md](features/009-resizable-textareas.md) - Resizable textarea fields

### API Contract
- [openapi.yaml](api/openapi.yaml) - RESTful API specification (OpenAPI 3.0)

### UI Specifications
- [screens.md](ui/screens.md) - Screen layouts and wireframes
- [components.md](ui/components.md) - Reusable component behaviors
- [user-flows.md](ui/user-flows.md) - User journey diagrams

---

## Using These Specs

### For New Implementations

To implement the Job Application Tracker with a different technology stack:

1. **Copy [`implementation-template.md`](implementation-template.md)** to `specs/<NNN>-<name>/spec.md` and fill in every section — especially the Feature Scope table (see below). Do not leave feature rows blank; every feature must be marked in scope, deferred, or out of scope with a reason.
2. **Read the domain model** to understand entities, validation rules, and state transitions
3. **Review feature specs** for the features declared in scope
4. **Implement the API** following the OpenAPI contract
5. **Build the UI** following screens and component specs
6. **Validate** against the user flows and the conformance checklist below

### Conformance Requirements

An implementation is **conformant** when all P1 features and the declared P2/P3 features are complete.

| Feature | Priority | Required for conformance | What the implementation spec must declare |
|---------|----------|--------------------------|-------------------------------------------|
| [001 Application Management](features/001-application-management.md) | P1 | Yes | Edit flow (separate form / modal / inline); unsaved-changes guard approach |
| [002 Interview Tracking](features/002-interview-tracking.md) | P1 | Yes | Default stage creation behavior; whether reorder is supported |
| [003 Offer Management](features/003-offer-management.md) | P2 | Recommended | Overdue/urgency UI indicators; whether due-date prompt appears on status change |
| [004 Filtering & Sorting](features/004-filtering-sorting.md) | P1 | Yes | Which filters are supported; sort fields; pagination approach |
| [005 Archive & Delete](features/005-archive-delete.md) | P2 | Recommended | Archive/restore UI placement; delete confirmation approach |
| [006 History](features/006-history.md) | P2 | Recommended | Snapshot strategy; `data` column type (JSONB vs TEXT); history panel placement |
| [007 CSV Import/Export](features/007-csv-import-export.md) | P2 | Recommended | Confirm 16-column format; duplicate detection by `jobPostingUrl` |
| [008 Inline Editing](features/008-inline-editing.md) | P3 | Optional | Must be explicitly declared in scope or deferred; if in scope, state save trigger |
| [009 Resizable Textareas](features/009-resizable-textareas.md) | P3 | Optional | Must be explicitly declared in scope or deferred; if in scope, state which fields |

> **P1 (Critical)** — Required for the implementation to be usable.
> **P2 (Recommended)** — Required for the implementation to match the current feature set of other stacks in the monorepo. May be deferred with a reason.
> **P3 (Optional)** — Enhancements. Must be explicitly declared in scope or deferred — never silently omitted.

### Behaviors Enforced Across All Implementations

These behaviors are defined in the domain specs and must be consistent regardless of technology:

- **Default interview stages**: 6 stages created automatically when status transitions to "interviewing" and no stages exist (see [state-transitions.md](domain/state-transitions.md))
- **`dateApplied` auto-populate**: Set to today when status transitions away from "unsubmitted" and `dateApplied` is null; cleared to null when reverting to "unsubmitted"
- **Terminal status lock**: `accepted offer` and `declined offer` — no further transitions allowed
- **Default sort**: `updatedAt` descending
- **Archive default**: `includeArchived=false` on list queries
- **Snapshot on every mutation**: History snapshot created on every create, update, archive, restore, and stage change
- **Validation rules**: All constraints in [validation-rules.md](domain/validation-rules.md) enforced both client-side and server-side

### Example Implementation Prompts

**Vue + Nuxt:**
```
Implement the Job Application Tracker using Vue 3 + Nuxt + Drizzle ORM.
Reference specs in specs/core/ for requirements.
API contract: specs/core/api/openapi.yaml
```

**Svelte + Supabase:**
```
Implement the Job Application Tracker using SvelteKit + Supabase.
Reference specs in specs/core/ for requirements.
Domain model: specs/core/domain/
UI specs: specs/core/ui/
```

**React Native + Firebase:**
```
Implement the Job Application Tracker as a React Native mobile app with Firebase.
Reference specs in specs/core/ for requirements.
Adapt UI specs for mobile patterns.
```

---

## Relationship to Implementation Specs

This `core/` directory contains technology-agnostic specifications.

The sibling directories contain technology-specific implementation details:
- `001-job-application-tracker/` - React + Next.js initial implementation
- `002-dark-mode/` - Dark mode theme support
- `003-express-api-prisma/` - Express + Prisma + PostgreSQL backend
- `004-event-sourcing-undo-redo/` - Vue + Nuxt event sourcing
- `005-inline-edit-*` - Inline editing implementations
- `006-008-history-*` - History implementations per stack
- `009-react-nestjs/` - React + TanStack + NestJS implementation
- `010-nullable-date-applied/` - Nullable dateApplied
- `011-csv-import-export/` - CSV import/export for NestJS
- `012-unsubmitted-status/` - Unsubmitted default status
- `013-resizable-textareas/` - Resizable textareas
- `014-python-fastapi/` - Python FastAPI backend

The core specs were extracted from these implementation specs to enable alternative implementations.

---

## Spec Conventions

### Priority Levels
- **P1 (Critical)**: Core functionality required for MVP
- **P2 (Important)**: Valuable features for a complete product
- **P3 (Nice to Have)**: Enhancements that improve UX

### User Story Format
```
As a [role]
I want to [action]
So that [benefit]
```

### Acceptance Criteria Format
```
Given [precondition]
When [action]
Then [expected result]
```

### Behavior Pseudocode
```
Input: { parameters }
Process:
  1. Step one
  2. Step two
Output: Result
```

---

## Validation

An implementation is complete when:

1. All P1 user stories pass their acceptance criteria
2. All declared P2/P3 features pass their acceptance criteria
3. API conforms to the OpenAPI specification
4. Validation rules from [validation-rules.md](domain/validation-rules.md) are enforced client-side and server-side
5. State transitions follow the state machine in [state-transitions.md](domain/state-transitions.md)
6. UI supports the documented user flows
7. Shared Playwright E2E tests pass (all 13 tests)
8. No regression across other stacks (`bash scripts/run-e2e.sh`)

Optional enhancements (not required for conformance):
- Responsive design on mobile
- Dark mode
- Accessibility (ARIA, keyboard navigation)
- Inline editing (feature 008) — if not declared in scope
- Resizable textareas (feature 009) — if not declared in scope
