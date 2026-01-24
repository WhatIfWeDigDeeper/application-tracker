# Validation Chain

- Standard chain: build → lint → test → test:e2e after meaningful code changes.
- Skip rules: trivial/docs-only (skip all); test-only (skip add-tests step, still run lint/build); minor non-code (skip tests/e2e if no code touched).
- Add/update tests with feature or bugfix changes; prefer colocated tests and cover happy/edge/error paths.
- Use implementation-specific scripts when working in subpackages; see `running-and-testing.md` for commands.
- Record what you ran in PR summaries; call out anything intentionally skipped with justification.
- For dependency updates, run audit and the full chain before shipping.