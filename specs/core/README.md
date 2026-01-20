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

1. **Read the domain model** to understand entities and their relationships
2. **Review feature specs** for user stories and acceptance criteria
3. **Implement the API** following the OpenAPI contract
4. **Build the UI** following screens and component specs
5. **Validate** against the user flows

### Example Implementation Prompts

**Vue + Parse Server:**
```
Implement the Job Application Tracker using Vue 3 + Parse Server.
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
- `001-job-application-tracker/` - React + Next.js + localStorage implementation
- `002-dark-mode/` - Tailwind CSS dark mode implementation
- `003-express-api-prisma/` - Express + Prisma + PostgreSQL backend

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
2. API conforms to the OpenAPI specification
3. Validation rules are enforced (client and server)
4. State transitions follow the state machine
5. UI supports the documented user flows

Optional for full completion:
- P2 and P3 features implemented
- Responsive design works on mobile
- Dark mode supported
- Accessibility requirements met
