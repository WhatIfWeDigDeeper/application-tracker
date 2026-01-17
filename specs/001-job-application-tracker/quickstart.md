# Quickstart Guide: Job Application Tracker

**Branch**: `001-job-application-tracker` | **Date**: 2026-01-16

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher (or pnpm/yarn)
- Modern browser (Chrome, Firefox, Safari, Edge - latest 2 versions)

## Project Setup

### 1. Initialize the Project

```bash
# Create Next.js project with TypeScript
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Or if project already exists, ensure dependencies are installed
npm install
```

### 2. Install Additional Dependencies

```bash
# Development dependencies
npm install -D jest @types/jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom

# UUID for generating unique IDs (lightweight)
npm install uuid
npm install -D @types/uuid
```

### 3. Configure Jest

Create `jest.config.js`:

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
  ],
};

module.exports = createJestConfig(customJestConfig);
```

Create `jest.setup.js`:

```javascript
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;
```

### 4. Configure TypeScript Strict Mode

Ensure `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 5. Configure ESLint

Update `.eslintrc.json`:

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### 6. Configure Tailwind

Ensure `tailwind.config.ts` includes:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors for status badges
        status: {
          applied: '#3B82F6',      // blue-500
          interviewing: '#F59E0B', // amber-500
          offered: '#10B981',      // emerald-500
          rejected: '#EF4444',     // red-500
          accepted: '#22C55E',     // green-500
          declined: '#6B7280',     // gray-500
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

## Directory Structure

Create the following directory structure:

```bash
mkdir -p src/components/ui
mkdir -p src/components/applications
mkdir -p src/components/interviews
mkdir -p src/components/common
mkdir -p src/hooks
mkdir -p src/services
mkdir -p src/types
mkdir -p src/lib
mkdir -p src/assets/icons
mkdir -p tests/unit/components
mkdir -p tests/unit/hooks
mkdir -p tests/unit/services
mkdir -p tests/integration/workflows
```

## Development Workflow

### Start Development Server

```bash
npm run dev
```

Access at http://localhost:3000

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Type Checking

```bash
# Run TypeScript compiler
npx tsc --noEmit
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### Build for Production

```bash
npm run build
```

### Docker Development (Optional)

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
```

Run with Docker:

```bash
docker-compose up --build
```

## Key Implementation Files

### Types (Create First)

`src/types/application.ts` - Core type definitions (see contracts/storage-service.ts)

### Services

`src/services/storage.ts` - localStorage CRUD operations

### Hooks

`src/hooks/useLocalStorage.ts` - localStorage sync hook
`src/hooks/useApplications.ts` - Application state management

### Components

Build in this order:
1. UI primitives (`src/components/ui/`)
2. Application components (`src/components/applications/`)
3. Interview components (`src/components/interviews/`)
4. Main page assembly (`src/app/page.tsx`)

## Verification Checklist

Before each commit, verify:

- [ ] `npm run build` succeeds
- [ ] `npm run lint` shows no errors
- [ ] `npm test` passes all tests
- [ ] `npx tsc --noEmit` shows no type errors
- [ ] Manual testing in browser works

## Troubleshooting

### localStorage Not Persisting

- Check browser privacy settings (not in incognito)
- Verify storage quota not exceeded (check DevTools > Application > Storage)

### Hydration Mismatch Errors

- Ensure components using localStorage have `'use client'` directive
- Consider using `useEffect` for initial localStorage read

### Jest DOM Not Found

- Ensure `jest.setup.js` is properly configured
- Run `npm install -D @testing-library/jest-dom`

### Tailwind Classes Not Applying

- Check `tailwind.config.ts` content paths include all source files
- Restart dev server after config changes
