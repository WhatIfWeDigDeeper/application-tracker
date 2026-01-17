---
description: "Task list for Dark Mode feature implementation"
---

# Tasks: Dark Mode

**Input**: Design documents from `/specs/001-dark-mode/`
**Specification**: [spec.md](../001-dark-mode/spec.md) (4 user stories, P1-P3 priorities)
**Project**: Next.js with Tailwind CSS, dark mode via Tailwind's `dark:` utilities

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Dependencies & Execution Order

**User Stories in Priority Order**:
1. **User Story 1 (P1)**: Enable Dark Mode Toggle - Core toggle functionality
2. **User Story 2 (P1)**: Apply Dark Mode Styles - Complete UI styling
3. **User Story 3 (P2)**: Persist Theme Preference - localStorage persistence
4. **User Story 4 (P3)**: System Dark Mode Detection - System preference detection

**Phase 1 and 2 are blocking** - all foundational setup must complete before any user story work begins.

**Parallel Execution Examples**:
- US1 toggle + US2 styling can run in parallel after Phase 2 (they're independent files/components)
- US3 persistence and US4 system detection can run in parallel after Phase 2

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and configuration for dark mode support

- [x] T001 Configure Tailwind CSS dark mode in `tailwind.config.ts` with `darkMode: 'class'`
- [x] T002 Review and document color schemes for light/dark modes in `CLAUDE.md`
- [x] T003 [P] Create type definitions for theme context in `src/types/theme.ts`
- [x] T004 [P] Setup theme context provider structure plan (no implementation yet)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create ThemeContext in `src/hooks/useTheme.ts` with state management (theme, setTheme)
- [x] T006 Create ThemeProvider component in `src/components/ThemeProvider.tsx` to wrap app
- [x] T007 Update root layout in `src/app/layout.tsx` to include ThemeProvider
- [x] T008 [P] Create theme utilities in `src/lib/theme.ts` (getSystemTheme, validateTheme, etc.)
- [x] T009 [P] Add CSS transition utilities in `src/app/globals.css` for smooth theme switching
- [ ] T010 Configure `next.config.mjs` to support required dark mode features if needed

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Enable Dark Mode Toggle (Priority: P1) 🎯 MVP

**Goal**: Provide a visible, working theme toggle control that switches between light and dark modes

**Independent Test**: Click theme toggle button and verify UI switches between light and dark modes with all elements updating

### Implementation for User Story 1

- [x] T011 [P] [US1] Create ThemeToggle component in `src/components/ThemeToggle.tsx` with button/switch UI
- [x] T012 [US1] Implement click handler in ThemeToggle to toggle theme state from context
- [x] T013 [US1] Add visual indicator in ThemeToggle showing current theme (icon/text)
- [x] T014 [US1] Add ThemeToggle to header/navigation in `src/components/Header.tsx` or similar
- [x] T015 [US1] Ensure toggle is visible on all pages and persists visual state
- [ ] T016 [US1] Test toggle responsiveness on mobile and desktop layouts

**Checkpoint**: User Story 1 complete - theme toggle functional on all pages

---

## Phase 4: User Story 2 - Apply Dark Mode Styles (Priority: P1)

**Goal**: Apply comprehensive dark mode styling to all components and pages for readability and visual consistency

**Independent Test**: Switch to dark mode and verify all components (buttons, cards, inputs, modals, text) have appropriate dark styling with sufficient contrast

### Implementation for User Story 2

- [ ] T017 [P] [US2] Update global styles in `src/app/globals.css` with dark mode classes for body, text, backgrounds
- [ ] T018 [P] [US2] Add dark mode styles to page layout in `src/app/layout.tsx` (dark bg, light text)
- [ ] T019 [P] [US2] Style main page in `src/app/page.tsx` with dark mode utilities (dark:bg-*, dark:text-*)
- [ ] T020 [P] [US2] Update ApplicationList component in `src/components/ApplicationList.tsx` with dark styles
- [ ] T021 [P] [US2] Update ApplicationCard component in `src/components/ApplicationCard.tsx` with dark styles
- [ ] T022 [P] [US2] Update Modal component in `src/components/Modal.tsx` with dark styles (dark backgrounds, focus states)
- [ ] T023 [P] [US2] Update form components (inputs, selects, textareas) in `src/components/` with dark styles
- [ ] T024 [P] [US2] Update Button component in `src/components/Button.tsx` with dark mode variants
- [ ] T025 [P] [US2] Update all other components in `src/components/` with dark mode utilities
- [ ] T026 [US2] Verify contrast ratios meet WCAG AA standards for all text elements in dark mode
- [ ] T027 [US2] Test dark mode on all pages and user flows (add application, view list, filter, edit)
- [ ] T028 [US2] Verify tables/lists have sufficient row contrast in dark mode

**Checkpoint**: User Story 2 complete - all UI properly styled for dark mode with good contrast

---

## Phase 5: User Story 3 - Persist Theme Preference (Priority: P2)

**Goal**: Save user's theme choice to localStorage so preference persists across sessions and page reloads

**Independent Test**: Set dark mode preference, refresh page, and verify application loads in dark mode; repeat for light mode

### Implementation for User Story 3

- [x] T029 [P] [US3] Update ThemeProvider in `src/components/ThemeProvider.tsx` to load theme from localStorage on mount
- [x] T030 [P] [US3] Add localStorage write functionality when theme state changes in `src/hooks/useTheme.ts`
- [x] T031 [US3] Add localStorage key constant in `src/lib/theme.ts` (e.g., 'app-theme')
- [x] T032 [US3] Handle invalid/corrupted localStorage values with fallback logic
- [x] T033 [US3] Ensure theme loads before first render to prevent flashing (use SSR-safe approach)
- [ ] T034 [US3] Test persistence by setting theme, refreshing page, and verifying it loads
- [ ] T035 [US3] Test persistence by closing browser and reopening application
- [ ] T036 [US3] Test that clearing localStorage reverts to system default

**Checkpoint**: User Story 3 complete - theme preference persists across sessions

---

## Phase 6: User Story 4 - System Dark Mode Detection (Priority: P3)

**Goal**: Detect and respect user's system dark mode preference as fallback when no explicit preference is set

**Independent Test**: Clear theme preference, verify app respects system dark mode setting; change system setting and verify app responds

### Implementation for User Story 4

- [x] T037 [P] [US4] Implement `getSystemTheme()` function in `src/lib/theme.ts` using `prefers-color-scheme` media query
- [x] T038 [P] [US4] Add system preference detection to ThemeProvider initialization logic
- [x] T039 [US4] Listen for `prefers-color-scheme` media query changes using `matchMedia()` listener
- [x] T040 [US4] Update theme automatically when system preference changes (if no explicit preference set)
- [ ] T041 [US4] Test with system in light mode (verify app loads in light mode when no preference set)
- [ ] T042 [US4] Test with system in dark mode (verify app loads in dark mode when no preference set)
- [ ] T043 [US4] Test that explicit user preference overrides system preference
- [ ] T044 [US4] Cleanup media query listener on component unmount to prevent memory leaks

**Checkpoint**: User Story 4 complete - system dark mode preference is respected

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Finalize, test, and optimize the complete dark mode feature

- [ ] T045 [P] Run complete UI test suite to ensure all components work in both light and dark modes
- [ ] T046 [P] Verify theme switching performance (< 100ms, no layout shift)
- [ ] T047 [P] Add smooth CSS transitions to theme switching in `src/app/globals.css`
- [ ] T048 Test on multiple browsers (Chrome, Firefox, Safari) for consistent dark mode support
- [ ] T049 Verify accessibility: WCAG AA contrast in both light and dark on all pages
- [ ] T050 Create user documentation for theme toggle in `README.md`
- [ ] T051 Run full E2E test suite (Playwright) to verify dark mode works across all user flows
- [ ] T052 Verify no console errors or warnings in either theme
- [ ] T053 Performance check: Verify theme switching doesn't cause unnecessary re-renders

---

## Summary

**Total Tasks**: 53
**Tasks per User Story**:
- US1 (Enable Toggle): 6 tasks
- US2 (Apply Styles): 12 tasks
- US3 (Persist Preference): 8 tasks
- US4 (System Detection): 8 tasks
- Phase 1-2 (Setup + Foundation): 10 tasks
- Phase 7 (Polish): 9 tasks

**Parallel Opportunities**:
- Phase 1: All 4 tasks can run in parallel (different files)
- Phase 2: T008 and T009 can run in parallel
- Phase 3: T011 can run in parallel with Phase 2 work
- Phase 4: T017-T025 can run in parallel (different components/files)
- Phase 5: T029 and T030 can run in parallel
- Phase 6: T037 and T038 can run in parallel
- Phase 7: T045-T047 can run in parallel

**Recommended MVP Scope**: Phase 1 + Phase 2 + Phase 3 + Phase 4
- This delivers a complete, working dark mode with toggle and full styling
- US3 (persistence) and US4 (system detection) are valuable enhancements but not critical for MVP

**Implementation Strategy**:
1. Start with Phase 1-2 to establish foundation (2-3 tasks)
2. Implement US1 and US2 in parallel or sequence (18 tasks total)
3. Add US3 persistence as next feature (8 tasks)
4. Add US4 system detection as final enhancement (8 tasks)
5. Polish and test (9 tasks)
