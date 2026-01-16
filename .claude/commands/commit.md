---
command: commit
description: Stage changes and create commit with generated message
arguments: optional commit message override
---

# Smart Commit

Stage changes and create a well-formatted commit message.

## Process

### 1. Check Status

```bash
git status
git diff --stat
```

### 2. Analyze Changes

Review the diff to understand:
- What files changed
- What type of change (feature, fix, refactor, docs, test, chore)
- The purpose of the changes

### 3. Stage Changes

```bash
# Stage all changes (or prompt user for selective staging)
git add -A
```

If there are unrelated changes, offer to stage selectively.

### 4. Generate Commit Message

Format: `type: concise description`

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring
- `docs`: Documentation
- `test`: Tests
- `chore`: Maintenance

**Examples:**
- `feat: add user authentication`
- `fix: handle null response in API call`
- `refactor: extract validation logic to hook`

### 5. Create Commit

```bash
git commit -m "type: description

Co-Authored-By: Claude <noreply@anthropic.com>"
```

If user provided message override, use that instead (still include Co-Authored-By).

### 6. Report

Show:
- Commit hash
- Files changed
- Commit message

## Rules

- Keep subject line under 50 characters
- Use imperative mood ("add" not "added")
- Don't end with period
- Be specific but concise
