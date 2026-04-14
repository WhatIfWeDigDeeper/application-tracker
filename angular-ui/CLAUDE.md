# Angular Patterns

- **Confirm dialog `role="dialog"`**: Locators using `[role="dialog"] button:has-text(...)` require the inner dialog container div to have `role="dialog"` — Angular components don't add it automatically. Always include `role="dialog"` on the modal content div in `ConfirmDialogComponent`.
