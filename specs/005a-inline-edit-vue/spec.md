# 005a - Inline Edit UI: Vue + Nuxt

**Status:** Implemented (see [PR #51](https://github.com/gregrickaby/application-tracker/pull/51))

**Parent spec:** [005 - Inline Edit UI](../005-inline-edit-ui/spec.md)

This spec covers Vue + Nuxt specific implementation details. All UX decisions, user flows, field layout, and validation rules are defined in the parent spec.

## Scope
- **Frontend:** vue-ui (Vue 3 + Vue Router)
- **Backend:** nuxt-api (Nuxt 4.2.2 + Drizzle ORM)
- **Schema:** `vue_nuxt`
- **Ports:** UI 3020, API 5040

## Routing
- `/applications/new` — create mode
- `/applications/:id` — edit mode
- Both routes render `ApplicationEdit.vue` with an `id` prop (`'new'` or a UUID)

## Route param change handling
Vue Router reuses the `ApplicationEdit` component instance when navigating from `/applications/new` to `/applications/:id` — `onMounted` does not re-fire. A `watch(() => props.id)` detects the route change and calls `loadApplication()` to reload data from the store.

## Navigation guard
`onBeforeRouteLeave` triggers a `window.confirm()` when the form is dirty. A `skipNavGuard` ref is set to `true` before programmatic `router.push()` calls (save, delete, discard-in-create-mode) to bypass the guard.

## Components
- **Reused:** InterviewStageForm, InterviewStageItem, RatingInput, ConfirmDialog, UndoRedoBar, HistoryPanel
- **Replaced:** ApplicationFormModal.vue (deleted), ApplicationDetail.vue (deleted)
- **New:** ApplicationEdit.vue (view), UrlFieldInput.vue (component)

## Form state management
- Individual `ref()` per field for straightforward `v-model` binding
- `captureSnapshot()` serializes all form fields to JSON; `isDirty` computed compares current snapshot to the saved one
- `populateFromApplication()` fills form refs from an `Application` object
- `buildInput()` constructs the API payload from form refs

## State management
- `useApplicationsListStore()` — list, filtering, pagination, create
- `useApplicationDetailStore()` — detail/edit with event sourcing via Immer `produceWithPatches`
- `useHistoryStore()` — undo/redo with Immer patches

## Undo/redo integration
- Keyboard shortcuts (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z/Y) registered via `window.addEventListener('keydown')` in `onMounted`
- `watch(detailStore.application)` detects undo/redo state changes (`isUndoRedoInProgress`) and repopulates form + recaptures snapshot
- UndoRedoBar and HistoryPanel shown in edit mode only (below header area)

## E2E tests
- `application-crud.spec.ts` covers: navigation, validation errors, create + redirect, edit + persist, discard, create with stages, delete, back-to-list, default values, conditional offer due date
