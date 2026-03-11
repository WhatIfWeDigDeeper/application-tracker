---
name: add-react-test
description: >-
  Add unit tests for a React component or utility function using
  @testing-library/react and Jest/Vitest.
  Use when: writing or improving tests for a React component, hook, or utility
  in a React or Next.js frontend. Only for React-based stacks — for other
  frameworks (Vue, Svelte, Angular, Python, Java, Go) read the existing test
  files and use that stack's testing framework instead.
---

# Add React Tests: $ARGUMENTS

Create comprehensive unit tests for the specified React component or function.

## Process

### 1. Locate Source File

Search in order:
- `components/$ARGUMENTS.tsx` (React component)
- `lib/$ARGUMENTS.ts` (utility function)
- `app/$ARGUMENTS.tsx` (page component)

### 2. Analyze Source

Read the file to identify:
- Exported functions/components
- Props interfaces
- State management
- Event handlers
- Key functionality to test

### 3. Create Test File

Place test adjacent to source: `[name].test.tsx` or `[name].test.ts`

### 4. Generate Tests

**For React components:**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import ComponentName from './ComponentName';

describe('ComponentName', () => {
  test('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByTestId('component-name')).toBeInTheDocument();
  });

  test('handles user interaction', () => {
    render(<ComponentName />);
    fireEvent.click(screen.getByRole('button'));
    // assert expected behavior
  });

  test('handles empty state', () => { /* ... */ });
  test('handles error state', () => { /* ... */ });
});
```

**For utility functions:**

```typescript
import { functionName } from './fileName';

describe('functionName', () => {
  test('returns expected output', () => {
    expect(functionName(input)).toBe(expected);
  });

  test('handles empty input', () => { /* ... */ });
  test('handles edge cases', () => { /* ... */ });
  test('throws on invalid input', () => {
    expect(() => functionName(invalid)).toThrow();
  });
});
```

### 5. Run Tests

```bash
npm test -- $ARGUMENTS.test
```

Fix any failures, then report results.

## Coverage Requirements

- Happy path scenarios
- Edge cases (empty, null, boundary values)
- Error states
- User interactions (for components)
- Accessibility (keyboard navigation)

## Best Practices

- Use `data-testid` for stable selectors
- Mock localStorage if needed
- Tests should be independent and deterministic
- Descriptive test names that explain the scenario
