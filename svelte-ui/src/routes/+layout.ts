// Disable SSR: this app is a pure SPA that depends on API calls.
// Client-side rendering avoids hydration timing issues where
// event handlers (onclick, etc.) aren't wired until hydration completes.
export const ssr = false;
