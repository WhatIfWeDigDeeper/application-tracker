---
command: review
description: Review code changes before committing
arguments: optional file path to focus on
---

# Code Review

Review staged or unstaged changes for issues before committing.

## Process

### 1. Gather Changes

```bash
# Check what's staged
git diff --cached

# Check unstaged changes
git diff

# If nothing staged, review all changes
git diff HEAD
```

### 2. Review Checklist

For each changed file, check:

**Code Quality:**
- [ ] No console.log or debug code left in
- [ ] No commented-out code
- [ ] No hardcoded values that should be config
- [ ] No TODO comments without ticket reference

**TypeScript:**
- [ ] No `any` types (use `unknown` or proper type)
- [ ] No type assertions without justification
- [ ] Interfaces/types exported if needed elsewhere

**React:**
- [ ] No missing dependencies in useEffect
- [ ] No inline object/function creation causing re-renders
- [ ] Keys used for list items
- [ ] Proper cleanup in useEffect

**Security:**
- [ ] No secrets or API keys
- [ ] User input sanitized
- [ ] No SQL/XSS injection vulnerabilities

**Testing:**
- [ ] New code has tests (or explain why not)
- [ ] Existing tests still pass

### 3. Report Findings

**Format:**

```
## Review Summary

### Issues Found
🔴 Critical: [must fix before commit]
🟡 Warning: [should fix]
🔵 Suggestion: [nice to have]

### Files Reviewed
- file1.tsx: ✅ OK
- file2.tsx: 🟡 2 warnings
- file3.tsx: 🔴 1 critical issue

### Details
[Specific issues with file paths and line numbers]
```

### 4. Offer Fixes

For each issue found, offer to:
- Fix automatically (if straightforward)
- Show how to fix manually
- Skip (with acknowledgment)

## Quick Mode

If `/review quick`:
- Only check for critical issues
- Skip style suggestions
- Faster review
