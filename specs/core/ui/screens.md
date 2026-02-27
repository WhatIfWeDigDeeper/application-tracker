# UI Screens

This document defines the screens (pages/views) of the Job Application Tracker, independent of any specific UI framework.

---

## Screen Inventory

| Screen | Route | Purpose |
|--------|-------|---------|
| Application List | `/` or `/applications` | Main view showing all applications |
| Application Detail | `/applications/{id}` | View and edit a single application |
| Add Application | Modal or `/applications/new` | Create a new application |

Note: This is a single-page application with most interactions via modals. Alternative implementations may use separate pages.

---

## Screen: Application List

**Purpose**: Primary view for browsing and managing job applications.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER                                                          │
│ ┌─────────────────────────────────┐  ┌───────────────────────┐ │
│ │ Job Application Tracker         │  │ [Theme] [Import] [Export] [+ Add]│ │
│ └─────────────────────────────────┘  └───────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ FILTERS & SORT BAR                                              │
│ ┌────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐ ┌────────────┐ │
│ │Status ▼│ │Category ▼│ │Source ▼│ │Skills ▼ │ │Sort: Date ▼│ │
│ └────────┘ └──────────┘ └────────┘ └──────────┘ └────────────┘ │
│ ☐ Include archived                     Showing 15 of 42        │
├─────────────────────────────────────────────────────────────────┤
│ APPLICATION LIST                                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Acme Corp - Software Engineer                    [Applied] │ │
│ │ Applied: Jan 15, 2024  |  AI  |  Skills: ★★★★☆            │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ TechCo - Senior Developer                    [Interviewing] │ │
│ │ Applied: Jan 10, 2024  |  Enterprise  |  2/6 stages        │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ StartupX - Full Stack                        [Given Offer] │ │
│ │ Applied: Jan 5, 2024  |  Consumer Tech  |  Due: Jan 25    │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ PAGINATION                                                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │              ← Previous    1  2  3  ...  10    Next →       │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Elements

#### Header
- Application title/logo
- Theme toggle (dark/light mode)
- "Add Application" button (primary action)

#### Filter Bar
- Status filter (multi-select dropdown)
- Company category filter (dropdown)
- Job source filter (dropdown)
- Skills match minimum (dropdown or slider)
- Include archived toggle
- Active filter count/clear all
- Results count indicator

#### Sort Controls
- Sort field selector
- Sort direction toggle

#### Application List
- Each row shows:
  - Company name and position title
  - Current status (with visual indicator)
  - Date applied
  - Company category (if set)
  - Skills match rating (if set)
  - Interview progress (if interviewing)
  - Offer due date (if applicable)
- Click row to view details
- Actions menu (edit, archive, delete)

#### Pagination
- Page numbers
- Previous/Next buttons
- Items per page selector (optional)

#### Empty States
- No applications: "No applications yet. Click '+ Add' to track your first application."
- No matches: "No applications match your filters. Try adjusting the filters."

---

## Screen: Application Detail

**Purpose**: View and edit all details of a single application.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER                                                          │
│ ← Back to List                     [History] [Edit] [Archive]   │
├─────────────────────────────────────────────────────────────────┤
│ APPLICATION HEADER                                              │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Acme Corp                                                   │ │
│ │ Software Engineer                              [Interviewing]│ │
│ │ Applied: January 15, 2024                                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ DETAILS SECTION                                                 │
│ ┌───────────────────────────┐ ┌───────────────────────────────┐ │
│ │ Company Info              │ │ Application Info              │ │
│ │ • Website: acme.com       │ │ • Source: LinkedIn            │ │
│ │ • Category: AI            │ │ • Skills Match: ★★★★☆        │ │
│ │ • Career Page: link       │ │ • Cover Letter: Required      │ │
│ │ • Job Posting: link       │ │ • Salary: $120k - $150k       │ │
│ └───────────────────────────┘ └───────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ INTERVIEW STAGES (if status = interviewing)                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ✓ Contacted by Recruiter     Jan 16  ★★★★☆  [notes icon]  │ │
│ │ ✓ Interview with Recruiter   Jan 18  ★★★★★  [notes icon]  │ │
│ │ ○ Interview with Hiring Manager                            │ │
│ │ ○ Exercise                                                 │ │
│ │ ○ Technical Interview                                      │ │
│ │ ○ Cross-functional Interviews                              │ │
│ │                                           [+ Add Stage]    │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ OFFER SECTION (if status = given offer)                         │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Offer Due: March 15, 2024 (5 days remaining)               │ │
│ │ [Accept Offer]  [Decline Offer]                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ NOTES SECTION                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Referred by John from the AI team. Great culture fit...    │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ SPECIAL REQUIREMENTS                                            │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Portfolio required. Code sample in Python or TypeScript.   │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ HISTORY PANEL (slides from right when History clicked)           │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Change History                                    [X Close] │ │
│ │                                                             │ │
│ │ ● Status changed to "interviewing"         2 hours ago     │ │
│ │   ▸ Click to expand diffs                                  │ │
│ │                                                             │ │
│ │ ● Application created                          yesterday   │ │
│ │   status: — → applied                                      │ │
│ │   companyName: — → Acme Corp                               │ │
│ │   [Restore to this point]                                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ FOOTER                                                          │
│ Created: Jan 15, 2024  |  Last updated: Jan 20, 2024           │
│                                              [Delete Application]│
└─────────────────────────────────────────────────────────────────┘
```

### Sections

#### Application Header
- Company name (large)
- Position title
- Status badge (with color coding)
- Date applied

#### Company Information
- Company website (clickable link)
- Company category
- Job posting URL (clickable)
- Company career page URL (clickable)

#### Application Information
- Job source
- Skills match rating (visual stars)
- Cover letter required indicator
- Salary range

#### Interview Stages
- Only shown when status = "interviewing"
- Ordered checklist of stages
- Each stage shows: completion status, name, date, rating, notes indicator
- Click stage to expand/edit
- Add new stage button
- Reorder capability (drag or buttons)

#### Offer Section
- Only shown when status = "given offer"
- Due date with days remaining/overdue
- Accept and Decline buttons

#### Notes Section
- Free-form notes display
- Expandable if long

#### Special Requirements
- Special requirements text

#### Footer
- Timestamps (created, updated)
- Delete button (destructive action)

---

## Modal: Add/Edit Application

**Purpose**: Form for creating or editing an application.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Add New Application                                    [X Close]│
├─────────────────────────────────────────────────────────────────┤
│ REQUIRED FIELDS                                                 │
│ Company Name*     [________________________]                    │
│ Position Title*   [________________________]                    │
│ Date Applied      [____/____/____] (empty by default)          │
│ Status            [Unsubmitted ▼]                               │
├─────────────────────────────────────────────────────────────────┤
│ COMPANY DETAILS                                                 │
│ Company Website   [________________________]                    │
│ Career Page URL   [________________________]                    │
│ Job Posting URL   [________________________]                    │
│ Company Category  [Select... ▼]                                 │
├─────────────────────────────────────────────────────────────────┤
│ APPLICATION DETAILS                                             │
│ Job Source        [Select... ▼]                                 │
│ Skills Match      ○ 1  ○ 2  ○ 3  ○ 4  ○ 5                      │
│ Cover Letter      ☐ Required                                    │
│ Salary Range      [______] to [______]                          │
├─────────────────────────────────────────────────────────────────┤
│ ADDITIONAL INFO                                                 │
│ Special Requirements                                            │
│ [________________________________________________]             │
│ Notes                                                           │
│ [________________________________________________]             │
│ [________________________________________________]             │
│ [________________________________________________]             │
├─────────────────────────────────────────────────────────────────┤
│                                    [Cancel]  [Save Application] │
└─────────────────────────────────────────────────────────────────┘
```

### Form Behavior

- Required field indicators (*)
- Inline validation on blur
- Validation summary on submit
- Save button disabled while saving
- Close/Cancel discards changes (with confirmation if dirty)
- Success closes modal and updates list

---

## Modal: Edit Interview Stage

**Purpose**: Edit details of a single interview stage.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Edit Interview Stage                                   [X Close]│
├─────────────────────────────────────────────────────────────────┤
│ Stage Name        [Interview with Recruiter________]            │
│                                                                 │
│ ☑ Completed                                                     │
│ Completion Date   [01/18/2024]                                  │
│                                                                 │
│ Performance Rating                                              │
│ ★ ★ ★ ★ ☆  (4/5)                                               │
│                                                                 │
│ Notes                                                           │
│ [Great conversation about team culture and growth___]           │
│ [opportunities. They mentioned next steps would be__]           │
│ [meeting with the hiring manager.___________________]           │
├─────────────────────────────────────────────────────────────────┤
│ [Delete Stage]                         [Cancel]  [Save Changes] │
└─────────────────────────────────────────────────────────────────┘
```

---

## Modal: Confirm Delete

**Purpose**: Confirmation before permanent deletion.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Delete Application                                              │
├─────────────────────────────────────────────────────────────────┤
│ ⚠ Are you sure you want to delete this application?            │
│                                                                 │
│   Acme Corp - Software Engineer                                 │
│                                                                 │
│ This action cannot be undone. All interview stages and          │
│ notes will be permanently removed.                              │
├─────────────────────────────────────────────────────────────────┤
│                                         [Cancel]  [Delete]      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Modal: Import CSV

**Purpose**: Upload a CSV file to bulk-create applications.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Import Applications from CSV                             [X Close]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Upload a CSV file to create multiple applications at once.      │
│ [Download Template] to see the expected format.                 │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  📂 Choose CSV file...                          [Browse]   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ RESULTS (shown after upload)                                    │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ✓ 8 imported  |  ⊘ 2 skipped (duplicates)  |  ✗ 1 error  │ │
│ │                                                             │ │
│ │ Errors:                                                     │ │
│ │ • Row 5: Invalid status "pending"                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                                                      [Close]    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Responsive Behavior

### Desktop (1024px+)
- Full layout as shown
- Side-by-side sections where appropriate
- Hover states on interactive elements

### Tablet (768px - 1023px)
- Stacked layout for detail sections
- Filters may collapse to a filter button/drawer
- Full-width cards

### Mobile (< 768px)
- Single column layout
- Bottom sheet modals instead of centered
- Swipe actions on list items (optional)
- Floating action button for "Add"
- Filters in slide-out drawer
- Condensed list items

---

## App Shell

Browser-level UI that frames the application.

### Page Title
- `<title>` should be `"Application Tracker"` or include the implementation technology (e.g., `"Application Tracker - Angular"`).

### Favicon
- Each implementation should provide a technology-inspired SVG favicon (`favicon.svg`).
- The icon should be visually recognizable as the UI framework or language used (e.g., Angular shield, React atom, Vue "V" chevron, Svelte flame, Python snake).
- Served from the `public/` (or equivalent static assets) directory.
- Referenced in `<head>` as `<link rel="icon" type="image/svg+xml" href="favicon.svg">`.

---

## Accessibility Requirements

- All interactive elements keyboard accessible
- Focus management in modals (trap focus, return on close)
- ARIA labels for icon-only buttons
- Color not sole indicator of status (use icons/text too)
- Sufficient color contrast (WCAG AA minimum)
- Screen reader announcements for dynamic updates
- Skip link to main content
