# 005d - Inline Edit UI: Svelte + Hono

**Status:** Not started

**Parent spec:** [005 - Inline Edit UI](../005-inline-edit-ui/spec.md)

This spec covers Svelte + Hono specific implementation details. All UX decisions, user flows, field layout, and validation rules are defined in the parent spec.

## Scope
- **Frontend:** svelte-ui (Svelte 5 + SvelteKit)
- **Backend:** hono-api (Hono + Drizzle ORM)
- **Schema:** `svelte_hono`
- **Ports:** UI 3030, API 5030

## Current state
The app is a single-page SvelteKit app at `/` (`routes/+page.svelte`). Application create uses a modal with `ApplicationForm`. The detail view is a right-slide sidebar panel with `ApplicationDetail` that supports inline editing. Interview stages are managed in the detail panel after creation. Pagination is built in (20 per page).

## Routing changes
SvelteKit uses filesystem-based routing. Add new route segments:
- `src/routes/applications/new/+page.svelte` — create mode
- `src/routes/applications/[id]/+page.svelte` — edit mode
- The list remains at `src/routes/+page.svelte`

SvelteKit's `$page.params` is reactive — when the route param changes (e.g., from `/applications/new` to `/applications/:id`), reactive statements using `$page.params.id` automatically re-run. No special handling is needed for component reuse.

### Navigation from list
- "+ Add Application" button uses `<a href="/applications/new">` (SvelteKit handles client-side)
- Application card click uses `<a href="/applications/{id}">` (replaces sidebar open)

## Navigation guard
- **In-app navigation:** `beforeNavigate` from `$app/navigation` cancels navigation when the form is dirty and shows a confirm dialog
- **Browser navigation:** `beforeunload` event listener as a fallback for tab close / URL bar changes

Programmatic navigations after save/delete call `goto()` after resetting the dirty flag or use a skip flag checked in `beforeNavigate`.

## Components
- **Reused:** InterviewStageForm, InterviewStageItem (interview stage CRUD), RatingInput
- **Replaced:** ApplicationForm (modal usage removed), ApplicationDetail (sidebar removed)
- **New:** ApplicationEdit.svelte (shared component for create/edit), UrlFieldInput.svelte (URL input with link icon)

The right-slide sidebar pattern is removed entirely — detail is now always a full page.

## Form state management
- Svelte 5 `$state` rune for each field or a single `$state` object
- Snapshot-based dirty tracking: `JSON.stringify($state.fields)` vs. saved snapshot
- `$derived` rune for `isDirty` computed value
- `populateFromApplication(app)` fills state from an `Application` object
- `buildInput()` constructs the API payload from reactive state

## State management
- Existing `applicationStore` (Svelte 5 rune-based) handles CRUD operations with pagination
- The store is designed for the list page — add a `loadApplication(id)` method or a separate detail store for single-application fetch/update/delete
- Pagination is preserved on the list page
- Svelte 5 `$effect` handles reactive side effects (e.g., reload on param change)

## Undo/redo
Not applicable — the Hono + Drizzle backend does not have event sourcing. The header area omits the Undo/Redo bar and History button.

## E2E tests
- New test file: `application-inline-edit.spec.ts` (or extend existing test files)
- Covers all scenarios from the parent spec's E2E test scenarios section
