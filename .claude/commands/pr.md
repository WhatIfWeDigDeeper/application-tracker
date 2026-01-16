---
command: pr
description: Create a pull request with generated description
arguments: optional PR title
---

# Create Pull Request

Create a GitHub pull request with an auto-generated description based on commits.

## Process

### 1. Check Prerequisites

```bash
# Ensure we're not on main
git branch --show-current

# Ensure branch is pushed
git status
```

### 2. Gather Information

```bash
# Get commits not in main
git log main..HEAD --oneline

# Get changed files
git diff main..HEAD --stat

# Get full diff for context
git diff main..HEAD
```

### 3. Generate PR Description

Based on commits and changes, generate:

```markdown
## Summary
[2-3 bullet points describing the changes]

## Changes
- [List of significant changes]

## Test Plan
- [ ] [How to test these changes]

---
🤖 Generated with [Claude Code](https://claude.ai/code)
```

### 4. Create PR

```bash
gh pr create --title "[title]" --body "[generated body]"
```

If no title provided, generate from branch name or commits.

### 5. Report

Output the PR URL and summary.

## Options

- If branch not pushed, offer to push first
- If PR already exists, show link to existing PR
- If conflicts with main, warn user
