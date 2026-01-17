# Research: Job Application Tracker

**Branch**: `001-job-application-tracker` | **Date**: 2026-01-16

## Overview

Research findings for technology choices and implementation patterns for the Job Application Tracker feature. All technical context was provided by the user; this document captures best practices and design decisions.

---

## 1. localStorage Persistence Strategy

### Decision
Use localStorage with a structured JSON schema, implementing a custom hook (`useLocalStorage`) with automatic serialization/deserialization.

### Rationale
- localStorage has 5-10MB limit per origin, sufficient for ~100 applications with full details
- Synchronous API simplifies state management (no async complexity)
- Data persists across browser sessions without server
- JSON.stringify/parse handles complex nested objects (interview stages)

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|-----------------|
| IndexedDB | Overkill for ~100 records; async API adds complexity |
| sessionStorage | Data lost on browser close; not suitable for persistent tracker |
| SQLite (WASM) | Significant bundle size increase; unnecessary for simple CRUD |

### Implementation Pattern
```typescript
// Storage key structure
const STORAGE_KEY = 'job-applications-v1';

// Data versioning for future migrations
interface StorageSchema {
  version: number;
  applications: JobApplication[];
  lastModified: string;
}
```

---

## 2. Next.js App Router Configuration

### Decision
Use Next.js 14 App Router with client-side only rendering for the main application page (no SSR for localStorage-dependent content).

### Rationale
- App Router is the modern Next.js standard with improved performance
- Client-side rendering required since localStorage is browser-only
- `'use client'` directive prevents SSR hydration mismatches
- File-based routing simplifies navigation (single page for MVP)

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|-----------------|
| Pages Router | Legacy pattern; App Router is recommended for new projects |
| Pure Vite + React | Loses Next.js benefits (optimized builds, future SSR capability) |

### Implementation Pattern
```typescript
// src/app/page.tsx
'use client';

import { ApplicationList } from '@/components/applications/ApplicationList';
// ... client-side only
```

---

## 3. State Management Approach

### Decision
Use React hooks with Context API for global state (applications list, filters, sort). No external state management library.

### Rationale
- Application scope is small (~100 items, single user)
- React 18 built-in features sufficient for this scale
- Avoids additional dependencies (Redux, Zustand, etc.)
- localStorage sync handled in custom hooks

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|-----------------|
| Redux | Excessive boilerplate for simple CRUD app |
| Zustand | Additional dependency; React Context sufficient |
| Jotai/Recoil | Atomic state unnecessary for document-based data |

### Implementation Pattern
```typescript
// Context for application state
const ApplicationContext = createContext<ApplicationContextType | null>(null);

// Custom hook combining localStorage + React state
function useApplications() {
  const [applications, setApplications] = useLocalStorage<JobApplication[]>('applications', []);
  // CRUD operations
}
```

---

## 4. Form Handling and Validation

### Decision
Use controlled components with custom validation. No form library (React Hook Form, Formik).

### Rationale
- Form complexity is moderate (15-20 fields per application)
- Custom validation allows precise control over error messages
- Reduces bundle size by avoiding form libraries
- TypeScript provides type safety for form data

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|-----------------|
| React Hook Form | Additional dependency; uncontrolled inputs complicate localStorage sync |
| Formik | Bundle size concern; simpler validation sufficient |
| Zod | Could add later if validation complexity increases |

### Implementation Pattern
```typescript
// Validation in services/validation.ts
interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

function validateApplication(data: Partial<JobApplication>): ValidationResult {
  const errors: Record<string, string> = {};
  if (!data.companyName?.trim()) errors.companyName = 'Company name is required';
  if (!data.positionTitle?.trim()) errors.positionTitle = 'Position title is required';
  // URL validation, salary range validation, etc.
  return { isValid: Object.keys(errors).length === 0, errors };
}
```

---

## 5. Tailwind CSS Component Patterns

### Decision
Build reusable UI primitives in `components/ui/` using Tailwind utility classes with consistent design tokens.

### Rationale
- Tailwind provides rapid prototyping with utility-first approach
- Component extraction ensures consistency (Button, Input, Select)
- Design tokens via Tailwind config for colors, spacing, typography
- Responsive utilities built-in (sm:, md:, lg: breakpoints)

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|-----------------|
| CSS Modules | More verbose; loses Tailwind's utility composition |
| Styled Components | Runtime overhead; conflicts with Tailwind approach |
| shadcn/ui | Could integrate, but custom components give more control |

### Implementation Pattern
```typescript
// components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variantClasses = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};
```

---

## 6. Testing Strategy

### Decision
Jest + React Testing Library for unit and integration tests. Focus on user interactions and component behavior.

### Rationale
- React Testing Library encourages testing user behavior over implementation
- Jest provides mocking capabilities for localStorage
- Integration tests verify complete user workflows
- Matches Constitution testing requirements

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|-----------------|
| Vitest | Jest more established with Next.js ecosystem |
| Cypress | E2E testing can be added later; unit tests priority for MVP |
| Playwright | Same as Cypress; defer to future enhancement |

### Implementation Pattern
```typescript
// tests/unit/hooks/useApplications.test.ts
describe('useApplications', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds a new application', () => {
    const { result } = renderHook(() => useApplications());
    act(() => {
      result.current.addApplication({ companyName: 'Acme', positionTitle: 'Engineer' });
    });
    expect(result.current.applications).toHaveLength(1);
  });
});
```

---

## 7. Accessibility Implementation

### Decision
Implement WCAG 2.1 AA compliance with semantic HTML, ARIA attributes, and keyboard navigation.

### Rationale
- Constitution requires WCAG 2.1 AA compliance
- Semantic HTML provides foundation (button, form, nav elements)
- ARIA labels for custom components (modals, dropdowns)
- Focus management for modal dialogs

### Key Accessibility Patterns
- All interactive elements keyboard accessible
- Focus trap in modal dialogs
- Screen reader announcements for status changes
- Color contrast minimum 4.5:1 for text
- Error messages associated with form fields via aria-describedby

---

## 8. SVG Icon Strategy

### Decision
Use inline SVG components for icons, organized in `assets/icons/` directory.

### Rationale
- Inline SVGs allow CSS styling (color, size via currentColor)
- Tree-shakeable when imported as React components
- No external icon library dependency
- Accessible with role="img" and aria-label

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|-----------------|
| Icon font | Accessibility issues; harder to style |
| react-icons | Large bundle if tree-shaking fails |
| Heroicons | Good option but inline SVGs give full control |

### Implementation Pattern
```typescript
// src/assets/icons/CheckIcon.tsx
export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
```

---

## 9. Date Handling

### Decision
Use native JavaScript Date API with ISO 8601 string format for storage.

### Rationale
- Native Date API sufficient for display and comparison
- ISO 8601 strings serialize cleanly to JSON/localStorage
- No timezone complexity (user's local time assumed)
- Avoids date library dependency (date-fns, dayjs)

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|-----------------|
| date-fns | Adds bundle size; native API sufficient for simple operations |
| dayjs | Same reason; formatting needs are minimal |
| Moment.js | Deprecated and large bundle size |

### Implementation Pattern
```typescript
// Store as ISO string
const dateApplied: string = new Date().toISOString();

// Display formatting
function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
```

---

## Summary

All technical decisions align with the specified tech stack (TypeScript, React, Next.js, Tailwind, Jest) and Constitution requirements. No external dependencies beyond the core stack are required for MVP. The architecture prioritizes simplicity, maintainability, and performance for a single-user application with ~100 records.
