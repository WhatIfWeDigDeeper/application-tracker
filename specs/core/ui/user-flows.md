# User Flows

This document defines the key user journeys through the application using flow diagrams.

---

## Flow 1: Add New Application

**Goal**: User records a new job application they've submitted.

```mermaid
flowchart TD
    A[View Application List] --> B[Click 'Add Application']
    B --> C[Form Modal Opens]
    C --> D{Fill Required Fields}
    D -->|Company + Position| E[Optionally Fill Other Fields]
    E --> F[Click Save]
    F --> G{Validation}
    G -->|Pass| H[Application Created]
    G -->|Fail| I[Show Errors]
    I --> D
    H --> J[Modal Closes]
    J --> K[New Application in List]
    K --> L[Success Toast]
```

### Steps

1. User is on the Application List screen
2. User clicks "Add Application" button
3. Modal opens with empty form (status defaults to Unsubmitted, date applied is empty)
4. User enters required fields (company name, position title); date applied and status can be changed from defaults
5. User optionally fills additional fields
6. User clicks "Save"
7. System validates input
   - If valid: Creates application, closes modal, shows in list
   - If invalid: Shows validation errors, user corrects
8. User sees success confirmation

---

## Flow 2: Update Application Status

**Goal**: User moves an application through the hiring pipeline.

```mermaid
flowchart TD
    A[View Application] --> B[Click Status Selector]
    B --> C[Select New Status]
    C --> D{Status Change Type}
    D -->|To Interviewing| E[Check for Existing Stages]
    E -->|None| F[Create Default Stages]
    E -->|Exist| G[Keep Existing]
    D -->|To Given Offer| H[Prompt for Due Date]
    D -->|To Terminal| I[Show Confirmation]
    D -->|Other| J[Simple Update]
    F --> K[Save & Update UI]
    G --> K
    H --> K
    I -->|Confirm| K
    I -->|Cancel| A
    J --> K
    K --> L[Status Updated]
```

### Steps

1. User views an application
2. User clicks on status to change it
3. User selects new status from dropdown
4. System handles status-specific logic:
   - **→ Interviewing**: Create default interview stages if none exist
   - **→ Given Offer**: Optionally prompt for offer due date
   - **→ Terminal (Accepted/Declined)**: Show confirmation warning
5. System saves the change
6. UI updates to reflect new status

---

## Flow 3: Track Interview Progress

**Goal**: User marks interview stages as complete and adds notes.

```mermaid
flowchart TD
    A[View Application<br/>Status: Interviewing] --> B[See Interview Checklist]
    B --> C[Click on Stage]
    C --> D[Stage Expands/Opens]
    D --> E{Action}
    E -->|Mark Complete| F[Set Completion Date]
    F --> G[Optionally Add Rating]
    E -->|Add Notes| H[Enter Notes Text]
    E -->|Edit Name| I[Change Stage Name]
    G --> J[Save Changes]
    H --> J
    I --> J
    J --> K[Stage Updated]
    K --> L[Progress Indicator Updates]
```

### Steps

1. User views application in "Interviewing" status
2. User sees checklist of interview stages
3. User clicks on a stage to interact
4. User can:
   - Mark stage as complete (with date)
   - Add performance rating (1-5)
   - Add notes about the interview
   - Rename the stage
5. Changes are saved
6. Progress indicator updates (e.g., "3/6 complete")

---

## Flow 4: Manage Interview Stages

**Goal**: User customizes the interview process for a specific application.

```mermaid
flowchart TD
    A[View Interview Stages] --> B{Action}
    B -->|Add| C[Click 'Add Stage']
    C --> D[Enter Stage Name]
    D --> E[Choose Position]
    E --> F[Save New Stage]
    B -->|Remove| G[Click Delete on Stage]
    G --> H{Has Data?}
    H -->|Yes| I[Confirm Delete]
    H -->|No| J[Delete Immediately]
    I -->|Confirm| J
    B -->|Reorder| K[Drag Stage or Use Arrows]
    K --> L[Drop in New Position]
    F --> M[Stages Updated]
    J --> M
    L --> M
```

### Steps

**Add Stage:**
1. User clicks "Add Stage"
2. User enters stage name
3. User chooses where to insert (beginning, end, or specific position)
4. Stage is added to the list

**Remove Stage:**
1. User clicks delete on a stage
2. If stage has notes/ratings, confirm deletion
3. Stage is removed, others reorder

**Reorder Stages:**
1. User drags a stage to a new position (or uses up/down arrows)
2. Stage order updates
3. Order numbers are recalculated

---

## Flow 5: Filter and Sort Applications

**Goal**: User finds specific applications in their list.

```mermaid
flowchart TD
    A[View Application List] --> B{Apply Filters}
    B -->|Status| C[Select Status Values]
    B -->|Category| D[Select Category]
    B -->|Source| E[Select Job Source]
    B -->|Skills| F[Set Minimum Rating]
    C --> G[List Updates]
    D --> G
    E --> G
    F --> G
    G --> H{Results?}
    H -->|Yes| I[Show Filtered Results]
    H -->|No| J[Show Empty State]
    I --> K{Change Sort}
    K -->|Field| L[Select Sort Field]
    K -->|Direction| M[Toggle Asc/Desc]
    L --> N[List Reorders]
    M --> N
    J --> O[Clear Filters Option]
    O --> A
```

### Steps

1. User is on Application List
2. User applies one or more filters:
   - Status: Select one or more statuses
   - Category: Select a company category
   - Source: Select a job source
   - Skills: Set minimum skills match
3. List immediately updates to show matches
4. If no results, show empty state with "Clear Filters"
5. User can change sort order (field and direction)
6. List reorders accordingly

---

## Flow 6: Archive and Restore Application

**Goal**: User hides old applications and optionally retrieves them.

```mermaid
flowchart TD
    A[View Application] --> B[Click Archive]
    B --> C[Application Archived]
    C --> D[Removed from Default List]
    D --> E[User Wants to See Archived]
    E --> F[Toggle 'Include Archived']
    F --> G[Archived Apps Visible]
    G --> H[Find Archived Application]
    H --> I[Click Restore]
    I --> J[Application Active Again]
    J --> K[Visible in Default List]
```

### Steps

**Archive:**
1. User views or selects an application
2. User clicks "Archive"
3. Application is marked as archived
4. Application disappears from default list view

**Restore:**
1. User toggles "Include Archived" filter
2. User sees archived applications (visually distinct)
3. User clicks "Restore" on archived application
4. Application becomes active again
5. Application appears in default list

---

## Flow 7: Delete Application

**Goal**: User permanently removes an application.

```mermaid
flowchart TD
    A[View Application] --> B[Click Delete]
    B --> C[Confirmation Dialog]
    C --> D{User Decision}
    D -->|Cancel| E[Dialog Closes]
    E --> A
    D -->|Confirm| F[Application Deleted]
    F --> G[Redirect to List]
    G --> H[Success Message]
```

### Steps

1. User views an application
2. User clicks "Delete"
3. Confirmation dialog appears with warning
4. User confirms deletion
5. Application and all stages are permanently removed
6. User is redirected to list
7. Success message displayed

---

## Flow 8: Respond to Offer

**Goal**: User accepts or declines a job offer.

```mermaid
flowchart TD
    A[Application with<br/>Status: Given Offer] --> B[View Offer Details]
    B --> C[See Due Date & Days Remaining]
    C --> D{Decision}
    D -->|Accept| E[Click Accept Offer]
    E --> F[Confirmation Dialog]
    F -->|Confirm| G[Status → Accepted Offer]
    D -->|Decline| H[Click Decline Offer]
    H --> I[Confirmation Dialog]
    I -->|Confirm| J[Status → Declined Offer]
    G --> K[Terminal State - No More Changes]
    J --> K
```

### Steps

1. User views application with "Given Offer" status
2. User sees offer due date and days remaining
3. User decides to accept or decline
4. User clicks appropriate button
5. Confirmation dialog warns of terminal state
6. User confirms
7. Status changes to terminal state
8. No further status changes possible

---

## Flow 9: First-Time User Experience

**Goal**: New user understands and starts using the tracker.

```mermaid
flowchart TD
    A[Open Application] --> B[See Empty State]
    B --> C[Helpful Message +<br/>Add Application CTA]
    C --> D[User Clicks Add]
    D --> E[Form Opens]
    E --> F[User Fills Minimum Fields]
    F --> G[Saves First Application]
    G --> H[Application Appears in List]
    H --> I[User Understands the System]
```

### Steps

1. New user opens the application
2. Empty state shows welcoming message
3. Clear call-to-action to add first application
4. User adds their first application
5. Application appears in list
6. User understands the basic workflow

---

## Flow 10: View and Restore Application History

**Goal**: User reviews past changes to an application and optionally restores a previous version.

```mermaid
flowchart TD
    A[View Application Detail] --> B[Click History Button]
    B --> C[History Panel Slides Open]
    C --> D[See Timeline of Changes]
    D --> E[Click Entry to Expand]
    E --> F[See Field-Level Diffs]
    F --> G{Want to Restore?}
    G -->|No| H[Close Panel]
    G -->|Yes| I[Click Restore to This Point]
    I --> J[Confirmation Dialog]
    J -->|Confirm| K[Application Restored]
    K --> L[New History Entry Created]
    J -->|Cancel| D
```

### Steps

1. User views an application detail page
2. User clicks "History" button in the header
3. Side panel slides open showing change timeline (newest first)
4. User clicks an entry to expand field-level diffs
5. User sees old values (struck-through) and new values
6. User optionally clicks "Restore to this point"
7. Confirmation dialog appears
8. On confirm: application reverts to that snapshot's state
9. New "Restored to version N" entry appears in history
10. History panel updates to show the restore entry

---

## Flow 11: Import Applications from CSV

**Goal**: User bulk-creates applications by uploading a CSV file.

```mermaid
flowchart TD
    A[View Application List] --> B[Click Import]
    B --> C[Import Modal Opens]
    C --> D{Has Template?}
    D -->|No| E[Download Template]
    E --> F[Fill in CSV Data]
    D -->|Yes| F
    F --> G[Select CSV File]
    G --> H[Click Upload]
    H --> I[Processing...]
    I --> J[Results Displayed]
    J --> K[Close Modal]
    K --> L[List Refreshes with New Apps]
```

### Steps

1. User clicks "Import" button on the application list
2. Import modal opens with file picker
3. Optionally: user downloads template CSV for reference
4. User selects a CSV file from their computer
5. System uploads and processes the file row-by-row
6. Modal displays results: N imported, N skipped (duplicates), N errors
7. Errors show row number and description
8. User closes modal
9. Application list refreshes to include newly imported applications

---

## Flow 12: Export Applications to CSV

**Goal**: User downloads all applications as a CSV file.

```mermaid
flowchart TD
    A[View Application List] --> B[Click Export]
    B --> C[Browser Downloads CSV]
    C --> D[File: applications-YYYY-MM-DD.csv]
```

### Steps

1. User clicks "Export" button on the application list
2. Browser downloads a CSV file named `applications-YYYY-MM-DD.csv`
3. CSV contains all applications (active and archived) with 16 columns
4. Interview stages are excluded from the export (too complex for flat CSV)

---

## Error Flows

### Network Error During Save

```mermaid
flowchart TD
    A[User Submits Form] --> B[API Call]
    B --> C{Network OK?}
    C -->|No| D[Show Error Message]
    D --> E[Retry Button]
    E --> B
    C -->|Yes| F[Success]
```

### Validation Error

```mermaid
flowchart TD
    A[User Submits Form] --> B{Valid?}
    B -->|No| C[Highlight Invalid Fields]
    C --> D[Show Error Messages]
    D --> E[User Corrects Input]
    E --> A
    B -->|Yes| F[Proceed with Save]
```

### Not Found Error

```mermaid
flowchart TD
    A[User Navigates to Application] --> B{Exists?}
    B -->|No| C[Show 404 Message]
    C --> D[Link Back to List]
    B -->|Yes| E[Show Application]
```

---

## Keyboard Navigation

### Global Shortcuts (Optional)

| Key | Action |
|-----|--------|
| `n` | New application (when list focused) |
| `/` | Focus search/filter |
| `Esc` | Close modal/dialog |

### Modal Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move to next field |
| `Shift+Tab` | Move to previous field |
| `Enter` | Submit form (when button focused) |
| `Esc` | Cancel/close modal |

### List Navigation

| Key | Action |
|-----|--------|
| `↑/↓` | Move selection |
| `Enter` | Open selected |
| `Delete` | Delete selected (with confirm) |
