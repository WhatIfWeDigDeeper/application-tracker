# Vue.js Patterns

- **Router component reuse**: `onMounted` won't re-fire on param change — use `watch(() => props.id)` to reload data
- **Nav guard bypass**: `onBeforeRouteLeave` fires on `router.push()` — use a `skipNavGuard` ref, set `true` before push
- **Pinia setup stores**: vue-ui uses setup stores (not options API) with Immer `produceWithPatches` for event sourcing — do not convert to composable style
- **Event sourcing schema**: `vue_nuxt` has `application_events` + `application_snapshots` tables; history is event-sourced
- **Validation limit sync**: Frontend and backend validation limits (e.g. max events list) must stay in sync
- **`@shared` alias**: Shared types live in `nuxt-api/shared/`; both `tsconfig.json` and `vite.config.ts` need the alias configured
