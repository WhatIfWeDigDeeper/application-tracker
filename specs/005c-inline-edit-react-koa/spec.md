# 005c - Inline Edit UI: React + Koa

**Status:** Not started

**Parent spec:** [005 - Inline Edit UI](../005-inline-edit-ui/spec.md)

This spec covers React + Koa specific implementation details. All UX decisions, user flows, field layout, and validation rules are defined in the parent spec.

## Scope
- **Frontend:** react-ui (React 19 + React Router)
- **Backend:** koa-api (Koa + raw SQL)
- **Schema:** `react_koa`
- **Ports:** UI 3010, API 5010

## Current state
The app uses React Router as a SPA. Application create uses a modal with `ApplicationForm`. The detail view is a responsive sidebar panel (desktop) or modal (mobile) with `ApplicationDetail`. Interview stages are managed in the detail view after creation.

## Routing changes
React Router already provides client-side routing. Add new routes:
- `/applications/new` — create mode
- `/applications/:id` — edit mode
- The list remains at `/`

React Router unmounts and remounts components on route changes by default, so there is no component-reuse problem when navigating from `/applications/new` to `/applications/:id`.

### Navigation from list
- "+ Add Application" button uses `<Link to="/applications/new">`
- Application card click uses `<Link to="/applications/:id">` (replaces sidebar open)

## Navigation guard
- **In-app navigation:** `useBlocker()` from React Router blocks navigation when the form is dirty and shows a confirm dialog
- **Browser navigation:** `beforeunload` event listener as a fallback for tab close / URL bar changes

Programmatic navigations after save/delete call `blocker.proceed()` or use `navigate()` after resetting the dirty flag.

## Components
- **Reused:** InterviewStageForm, InterviewStageItem (interview stage CRUD), RatingInput
- **Replaced:** ApplicationForm (modal usage removed), ApplicationDetail (sidebar/modal removed)
- **New:** ApplicationEdit (route component for create/edit), UrlFieldInput (URL input with link icon)

The responsive sidebar/modal detail pattern is removed entirely — detail is now always a full page.

## Form state management
- `useState` per field group or a single `useReducer` for form state
- Snapshot-based dirty tracking: `JSON.stringify` current state vs. saved state
- `populateFromApplication(app)` fills state from an `Application` object
- `buildInput()` constructs the API payload from form state

## State management
- Existing `useApplications()` hook handles CRUD operations with pagination (20 per page)
- The hook is currently designed for the list page — it may need a companion `useApplication(id)` hook for single-application fetch/update/delete on the edit page
- Pagination is preserved on the list page

## Undo/redo
Not applicable — the Koa + raw SQL backend does not have event sourcing. The header area omits the Undo/Redo bar and History button.

## E2E tests
- New test file: `application-inline-edit.spec.ts` (or extend existing test files)
- Covers all scenarios from the parent spec's E2E test scenarios section
