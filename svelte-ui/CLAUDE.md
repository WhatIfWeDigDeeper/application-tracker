# Svelte Patterns

- **SvelteKit SSR**: Add `export const ssr = false` in `src/routes/+layout.ts` for SPA mode with Playwright
- **Svelte 5 bind:value**: Doesn't propagate with callback `onchange` — use local `$state` + `$effect`, call callback in `oninput`
- **Svelte 5 event delegation**: `stopPropagation()` doesn't prevent parent `<a>` navigation — avoid wrapping interactive cards in `<a>` tags; use `onclick` with `goto()` instead
