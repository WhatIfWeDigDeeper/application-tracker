# Feature Specification: Rename "Rejected" Display Label to "Not a match"

**Feature Branch**: `018-not-a-match`
**Created**: 2026-03-01
**Status**: Complete

## Problem Statement

The status label "Rejected" is emotionally charged for job seekers who use this tracker to manage their job search. Changing the display text to "Not a match" provides a more neutral, kinder framing of the same outcome without altering the underlying data model.

## Scope

**Display-only change** — no data model changes, no database migrations.

- The underlying data value `"rejected"` remains unchanged in TypeScript types, Python enums, database schemas, and API payloads.
- Only the human-readable label shown in UI badges and dropdowns changes.

## Affected Implementations

All 7 UI implementations display this label:

| UI | File |
|----|------|
| `ui` (shared base) | `ui/src/lib/constants.ts` |
| `react-ui` | `react-ui/src/lib/constants.ts` |
| `tanstack-ui` | `tanstack-ui/src/lib/constants.ts` |
| `tanstack-start-ui` | `tanstack-start-ui/src/lib/constants.ts` |
| `svelte-ui` | `svelte-ui/src/lib/types/index.ts` |
| `vue-ui` | `vue-ui/src/components/StatusBadge.vue` |
| `angular-ui` | `angular-ui/src/app/core/models/application.model.ts` |

## What Does NOT Change

- TypeScript type union: `"rejected"` remains a valid `ApplicationStatus` value
- Python enum: `ApplicationStatus.REJECTED = "rejected"` unchanged
- All database schemas and migrations
- All API request/response payloads
- All test files asserting on the value `"rejected"` (not the label)

## Success Criteria

- Status badges display "Not a match" wherever the `rejected` status is shown
- Dropdown options include "Not a match" for the `rejected` value
- Saving an application with "Not a match" selected still sends `status: "rejected"` in the API payload
- E2E regression test passes across all stacks
- No compilation errors, lint failures, or test regressions
