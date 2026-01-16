# Claude Config Template

Claude Code configuration (skills, commands, settings) for Node.js and React/Next.js projects written in Typescript.

## Usage

Create a new repository and use this template as the starting point

Or copy the `.claude/` folder and `CLAUDE.md` into your existing project:

```bash
cp -r .claude/ /path/to/your-project/
cp CLAUDE.md /path/to/your-project/
```

## What's Included

### Commands (User-Initiated)

Type these in Claude Code to trigger them:

| Command | Purpose |
|---------|---------|
| `/commit` | Stage changes and create commit with generated message |
| `/pr` | Create pull request with generated description |
| `/review` | Review code changes before committing |
| `/parallel-work` | Set up git worktrees for parallel feature development |
| `/integrate-parallel-work` | Merge parallel features into integration branch |
| `/parallel-agents` | Spawn subagents for parallel work |

More details in [CLAUDE.md](CLAUDE.md#commands-user-initiated)

### Skills (Claude Suggests)

Claude will proactively suggest these when appropriate:

| Purpose | Skills |
|---------|--------|
| **Building & Fixing:** | `/fix-build`, `/debug` |
| **Code Generation:** | `/add-feature`, `/add-component`, `/add-hook`, `/add-api-route`, `/add-test` |
| **Maintenance:** | `/refactor`, `/update-deps`, `/audit-and-fix`, `/perf-audit` |
| **Documentation:** | `/e2e-test`, `/document-feature` |

More details in [CLAUDE.md](CLAUDE.md#skills-claude-can-suggest)

## Customization

- **settings.json**: Configure plugins and permissions
- **CLAUDE.md**: Add project-specific instructions
- **skills/**: Add or modify skill definitions
- **commands/**: Add or modify slash commands

## Assumptions

These configurations assume:

- npm for package management
- TypeScript
- Jest + React Testing Library for unit tests
- Playwright for e2e tests
- ESLint for linting

Modify the skills if your project uses different tools.

## License

MIT
