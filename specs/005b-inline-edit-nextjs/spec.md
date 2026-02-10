# 005b - Inline Edit UI: Next.js + Express

**Status:** Not started

**Parent spec:** [005 - Inline Edit UI](../005-inline-edit-ui/spec.md)

This spec covers Next.js + Express specific implementation details. All UX decisions, user flows, field layout, and validation rules are defined in the parent spec.

## Scope
- **Frontend:** ui (Next.js 16 + React 19)
- **Backend:** api (Express + Prisma)
- **Schema:** `express_prisma`
- **Ports:** UI 3000, API 3001

## Current state
The app is a single-page design at `/` using Next.js App Router. Application create and edit both use `ApplicationForm` rendered inside a modal. A separate `ApplicationDetail` modal shows the read-only view. There are no client-side routes for individual applications.

## Routing changes
Next.js App Router requires new route segments:
- `src/app/applications/new/page.tsx` — create mode
- `src/app/applications/[id]/page.tsx` — edit mode
- The list remains at `src/app/page.tsx`

Since App Router renders each route as a distinct page component, there is no component-reuse problem — navigating from `/applications/new` to `/applications/:id` mounts a fresh page component.

### Navigation from list
- "+ Add Application" button uses `next/link` or `router.push('/applications/new')`
- Application card click uses `next/link` to `/applications/:id`

## Navigation guard
App Router does not provide a built-in navigation guard. Two mechanisms are needed:
- **Browser navigation** (back button, URL bar, tab close): `beforeunload` event listener when the form is dirty
- **In-app navigation** (link clicks, `router.push`): Intercept via a custom `useUnsavedChanges` hook that wraps `router.push` and shows a confirm dialog before navigating. Alternatively, use Next.js [route intercepting](https://nextjs.org/docs/app/building-your-application/routing/intercepting-routes) if a cleaner pattern emerges.

Programmatic navigations after save/delete set a flag to skip the guard.

## Components
- **Reused:** InterviewStageForm, InterviewStageItem (interview stage CRUD), RatingInput
- **Replaced:** ApplicationForm (modal wrapper removed), ApplicationDetail (modal removed)
- **New:** ApplicationEdit (shared page component for create/edit), UrlFieldInput (URL input with link icon)

## Form state management
- `useState` per field group or a single `useReducer` for form state
- Snapshot-based dirty tracking: `JSON.stringify` current state vs. saved state
- `populateFromApplication(app)` fills state from an `Application` object
- `buildInput()` constructs the API payload from form state

## State management
- Existing `useApplications()` hook handles CRUD operations
- The hook is currently designed for the list page — it may need to be split or extended:
  - List page: fetching with filters/sorting
  - Edit page: single-application fetch, update, delete
- Interview stages use the existing individual CRUD callbacks (`onAddStage`, `onUpdateStage`, `onRemoveStage`)

## Undo/redo
Not applicable — the Express + Prisma backend does not have event sourcing. The header area omits the Undo/Redo bar and History button.

## E2E tests
- New test file: `application-inline-edit.spec.ts` (or extend existing test files)
- Covers all scenarios from the parent spec's E2E test scenarios section
