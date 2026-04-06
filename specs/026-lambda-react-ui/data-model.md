# Data Model: Lambda React UI (Phase 1)

## Frontend Type Definitions

These mirror the lambda-api `src/types/api.ts` types exactly. The frontend types file (`src/types/application.ts`) should import nothing from the backend — it re-declares the same shapes independently.

### Core Domain Types

```typescript
type ApplicationStatus =
  | 'unsubmitted' | 'applied' | 'rejected' | 'interviewing'
  | 'given offer' | 'accepted offer' | 'declined offer' | 'no offer';

type CompanyCategory =
  | 'education' | 'health' | 'climate' | 'ai' | 'energy' | 'finance'
  | 'enterprise-software' | 'consumer-tech' | 'e-commerce' | 'cybersecurity'
  | 'gaming' | 'media-entertainment' | 'consulting' | 'government'
  | 'nonprofit' | 'retail' | 'restaurant' | 'hospitality' | 'other';

type JobSource =
  | 'recruiter' | 'linkedin' | 'indeed' | 'friend' | 'colleague'
  | 'company-website' | 'other';

interface InterviewStage {
  id: string;
  name: string;
  order: number;
  isCompleted: boolean;
  completedDate: string | null;
  notes: string | null;
  performanceRating: number | null;  // 1–5
}

interface Application {
  id: string;
  companyName: string;
  positionTitle: string;
  dateApplied: string | null;        // YYYY-MM-DD
  status: ApplicationStatus;
  createdAt: string;                 // ISO datetime
  updatedAt: string;                 // ISO datetime
  companyUrl: string | null;
  jobPostingUrl: string | null;
  companyCareerUrl: string | null;
  companyCategory: CompanyCategory | null;
  skillsMatch: number | null;        // 1–5
  jobSource: JobSource | null;
  coverLetterRequired: boolean | null;
  specialRequirements: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  notes: string | null;
  offerDueDate: string | null;       // YYYY-MM-DD
  isArchived: boolean;
  interviewStages: InterviewStage[];
}
```

### Pagination Types

```typescript
// Offset-based (existing API default)
interface PaginatedApplicationsResponse {
  items: Application[];
  page: number;
  limit: number;
  total: number;
}

// Cursor-based (new, opt-in via cursor query param)
interface CursorPaginatedApplicationsResponse {
  items: Application[];
  limit: number;
  nextCursor: string | null;    // base64 JSON { page, limit } or null if last page
  hasMore: boolean;
}
```

### History Types

```typescript
interface FieldChange {
  field: string;
  label: string;
  oldValue: unknown;
  newValue: unknown;
}

interface HistoryEntry {
  id: string;
  sequence: number;
  description: string;
  changes: FieldChange[];
  createdAt: string;
}

interface PaginatedHistoryResponse {
  entries: HistoryEntry[];
  total: number;
  page: number;
  limit: number;
}
```

### Filter & Sort State

```typescript
interface FilterState {
  status: ApplicationStatus[];    // multi-select (empty = no filter)
  companyCategory: CompanyCategory | undefined;
  jobSource: JobSource | undefined;
  skillsMatchMin: number | undefined;   // 1–5
  includeArchived: boolean;
}

interface SortState {
  sortBy: 'dateApplied' | 'companyName' | 'updatedAt';
  sortDir: 'asc' | 'desc';
}
```

### CSV Import Result

```typescript
interface ImportResult {
  imported: number;
  skipped: number;    // duplicates detected by jobPostingUrl
  failed: number;
  errors: string[];   // row-level error descriptions
}
```

---

## Zustand Store Shapes

### `applicationStore`

Primary store for server-sourced data. Actions trigger API calls and update state.

```typescript
interface ApplicationStore {
  // State
  applications: Application[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  selectedApplication: Application | null;
  selectedLoading: boolean;
  
  // List actions
  fetchApplications: (filters: FilterState, sort: SortState, page: number) => Promise<void>;
  
  // CRUD actions
  createApplication: (data: CreateApplicationInput) => Promise<Application>;
  updateApplication: (id: string, data: UpdateApplicationInput) => Promise<Application>;
  deleteApplication: (id: string) => Promise<void>;
  archiveApplication: (id: string) => Promise<void>;
  restoreApplication: (id: string) => Promise<void>;
  
  // Selection
  selectApplication: (id: string | null) => void;
  loadSelectedApplication: (id: string) => Promise<void>;
  refreshSelected: () => Promise<void>;
  
  // Interview stages
  addStage: (appId: string, data: CreateStageInput) => Promise<void>;
  updateStage: (appId: string, stageId: string, data: UpdateStageInput) => Promise<void>;
  removeStage: (appId: string, stageId: string) => Promise<void>;
}
```

### `filterStore`

Persists filter/sort state. Changing filters resets page to 1.

```typescript
interface FilterStore extends FilterState, SortState {
  setStatusFilter: (statuses: ApplicationStatus[]) => void;
  setCategoryFilter: (category: CompanyCategory | undefined) => void;
  setSourceFilter: (source: JobSource | undefined) => void;
  setSkillsMatchMin: (min: number | undefined) => void;
  setIncludeArchived: (include: boolean) => void;
  setSortBy: (field: SortState['sortBy']) => void;
  setSortDir: (dir: SortState['sortDir']) => void;
  clearFilters: () => void;
  activeFilterCount: () => number;  // computed
}
```

### `uiStore`

Client-only state with localStorage persistence for relevant fields.

```typescript
interface UiStore {
  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  
  // Context panel
  panelOpen: boolean;
  panelTab: 'details' | 'interview' | 'history';
  openPanel: (tab?: 'details' | 'interview' | 'history') => void;
  closePanel: () => void;
  setPanelTab: (tab: 'details' | 'interview' | 'history') => void;
  
  // Theme (persisted to localStorage key: 'app-theme')
  darkMode: boolean;
  toggleDarkMode: () => void;
  
  // View mode (persisted to localStorage key: 'app-view-mode')
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
}
```

---

## State Machine: Application Status Transitions

Terminal states (no further transitions allowed):
- `accepted offer`
- `declined offer`

Side effects on transition:
- `unsubmitted` → any non-unsubmitted: auto-populate `dateApplied` with today's date
- any → `unsubmitted`: clear `dateApplied`
- any → `interviewing` (and `interviewStages.length === 0`): create 6 default stages

Default interview stages (in order):
1. Recruiter Screen
2. Hiring Manager
3. Technical Interview
4. System Design
5. Team Fit
6. Final Round

---

## DynamoDB Schema Reference

(Existing — no schema changes; lambda-react-ui uses the same DynamoDB table)

| Item Type | PK | SK | Description |
|-----------|----|----|-------------|
| Application | `APP#<uuid>` | `APP#<uuid>` | Core application record |
| Interview Stage | `APP#<uuid>` | `STAGE#<uuid>` | Stage record for an application |
| History Entry | `APP#<uuid>` | `HIST#<zero-padded-seq>` | Snapshot + field diffs |

GSI1: `GSI1PK = STATUS#<status>#ARCHIVED#<0\|1>` / `GSI1SK = UPDATED#<ts>#<id>`  
GSI2: `GSI2PK = ACTIVE` / `GSI2SK = UPDATED#<ts>#<id>`
