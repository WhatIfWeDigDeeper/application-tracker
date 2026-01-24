# Workflows and CI

- CI lives in `.github/workflows/` and runs lint/build/test; keep branches green.
- Do not break default scripts expected by CI (`build`, `lint`, `test`, Playwright where applicable`).
- Before opening PRs, run the validation chain locally; note any skipped steps with reasons.
- Dependabot is enabled; when it opens PRs, run audit and validation chain before merging.
- Keep Copilot and Claude guidance in sync; update links if files move, avoid duplicating skill content.
- If changing CI behavior, document the change in PR notes and update this file if expectations change.