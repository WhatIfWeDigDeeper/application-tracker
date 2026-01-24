# Dependencies and Security

- Version pins: use exact versions (no ^ or ~). Add @types packages when needed.
- Audits: root `npm run audit:ci`; api/ui each have audit configs. Run after dep changes.
- Updates: prefer the `update-deps` skill (see skills-index) to apply updates in a worktree with full validation.
- New deps: check compatibility with Node and existing tooling; document constraints in code comments if pinning is required.
- Security fixes: use `audit-and-fix` skill; rerun validation chain after applying.
- Do not commit vulnerable packages without justification; capture exceptions in PR notes.