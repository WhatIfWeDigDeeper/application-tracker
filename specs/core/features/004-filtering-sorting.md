# Feature: Filtering and Sorting

Find and organize applications in the list view.

**Priority**: P1 (Critical)

---

## Overview

As users accumulate job applications, they need efficient ways to find specific applications and organize their view. This feature provides filtering by multiple criteria and sorting by relevant fields.

---

## User Stories

### US-4.1: Filter by Status

**As a** job seeker
**I want to** filter applications by their status
**So that** I can focus on applications at a specific stage

#### Acceptance Criteria

1. **Given** I have applications with various statuses
   **When** I select a status filter (e.g., "Interviewing")
   **Then** I only see applications with that status

2. **Given** I have a status filter applied
   **When** I select multiple statuses
   **Then** I see applications matching any of the selected statuses

3. **Given** I have filters applied
   **When** I clear the status filter
   **Then** I see applications of all statuses again

---

### US-4.2: Filter by Company Category

**As a** job seeker
**I want to** filter applications by company category
**So that** I can focus on specific industries

#### Acceptance Criteria

1. **Given** I have applications with different company categories
   **When** I select a category filter (e.g., "AI")
   **Then** I only see applications in that category

2. **Given** some applications have no category set
   **When** I filter by category
   **Then** applications without a category are excluded

---

### US-4.3: Filter by Job Source

**As a** job seeker
**I want to** filter applications by how I found them
**So that** I can analyze which job sources are most effective

#### Acceptance Criteria

1. **Given** I have applications from different sources
   **When** I select a source filter (e.g., "LinkedIn")
   **Then** I only see applications from that source

2. **Given** I have a source filter applied
   **When** I view the filtered results
   **Then** I can see the count of matching applications

---

### US-4.4: Filter by Skills Match

**As a** job seeker
**I want to** filter applications by skills match rating
**So that** I can prioritize applications where I'm a strong fit

#### Acceptance Criteria

1. **Given** I have applications with different skills match ratings
   **When** I filter by minimum rating (e.g., 4+)
   **Then** I only see applications with that rating or higher

2. **Given** some applications have no skills match set
   **When** I filter by skills match
   **Then** applications without a rating are excluded

---

### US-4.5: Sort Applications

**As a** job seeker
**I want to** sort my applications list
**So that** I can view them in a meaningful order

#### Acceptance Criteria

1. **Given** I have multiple applications
   **When** I sort by date applied (newest first)
   **Then** the most recent applications appear at the top

2. **Given** I have multiple applications
   **When** I sort by date applied (oldest first)
   **Then** the oldest applications appear at the top

3. **Given** I have multiple applications
   **When** I sort by company name
   **Then** applications are ordered alphabetically

4. **Given** I have sorting applied
   **When** I change the sort direction
   **Then** the order reverses

---

### US-4.6: Combine Filters

**As a** job seeker
**I want to** apply multiple filters simultaneously
**So that** I can narrow down to exactly what I'm looking for

#### Acceptance Criteria

1. **Given** I have many applications
   **When** I filter by status AND category
   **Then** I see only applications matching both criteria

2. **Given** I have multiple filters applied
   **When** I view the results
   **Then** I can see which filters are active

3. **Given** I have multiple filters applied
   **When** I clear all filters
   **Then** I return to the full unfiltered list

---

## Filter Specifications

### Available Filters

| Filter | Type | Values | Default |
|--------|------|--------|---------|
| status | multi-select | All ApplicationStatus values | None (show all) |
| companyCategory | multi-select | All CompanyCategory values | None (show all) |
| jobSource | multi-select | All JobSource values | None (show all) |
| skillsMatch | minimum threshold | 1-5 | None (show all) |
| includeArchived | boolean | true/false | false |

### Filter Logic

- Multiple values within same filter: OR (e.g., status=applied OR status=interviewing)
- Different filters: AND (e.g., status=applied AND category=ai)
- Null/undefined values: Excluded when filter is active for that field

### Sort Options

| Field | Display Name | Ascending | Descending |
|-------|--------------|-----------|------------|
| dateApplied | Date Applied | Oldest first | Newest first (default) |
| companyName | Company | A-Z | Z-A |
| updatedAt | Last Updated | Oldest first | Newest first |

---

## Behaviors

### Apply Filter

```
Input: { filterName, filterValues }
Process:
  1. Validate filter name and values
  2. Add to active filters
  3. Re-query applications with all active filters
  4. Update displayed list
Output: Filtered list
```

### Clear Filter

```
Input: { filterName }
Process:
  1. Remove from active filters
  2. Re-query applications with remaining filters
  3. Update displayed list
Output: Updated list
```

### Apply Sort

```
Input: { sortField, sortDirection }
Process:
  1. Validate sort field and direction
  2. Update current sort
  3. Re-order displayed list
Output: Sorted list
```

### Query with Filters and Sort

```
Input: { filters, sort }
Process:
  1. Start with all applications
  2. If includeArchived=false (default), exclude archived
  3. Apply each filter:
     - status: WHERE status IN (values)
     - companyCategory: WHERE companyCategory IN (values)
     - jobSource: WHERE jobSource IN (values)
     - skillsMatch: WHERE skillsMatch >= minimum
  4. Apply sort ORDER BY field direction
  5. Return results
Output: Filtered and sorted list
```

---

## Display Requirements

### Filter Controls

- Dropdowns or checkbox groups for multi-select filters
- Slider or dropdown for skills match minimum
- Toggle for include archived
- Clear indication of active filters
- "Clear all" button when filters active

### Results Indication

- Show count of results: "Showing X of Y applications"
- Empty state message when no results match filters

### Sort Controls

- Dropdown for sort field selection
- Toggle/button for ascending/descending
- Visual indicator of current sort

### Filter Persistence

- Filters should persist during the session
- Consider persisting to storage for cross-session (optional enhancement)

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No applications match | Show empty state with message |
| Filter with no selections | Treat as "show all" for that filter |
| Sort with equal values | Secondary sort by createdAt desc |
| Null values in sort field | Sort nulls last |
| Very large result set | Implement pagination (see API) |

---

## API Support

### Query Parameters

| Parameter | Type | Example |
|-----------|------|---------|
| status | string (comma-separated) | `?status=applied,interviewing` |
| companyCategory | string (comma-separated) | `?companyCategory=ai,climate` |
| jobSource | string | `?jobSource=linkedin` |
| skillsMatchMin | integer | `?skillsMatchMin=4` |
| includeArchived | boolean | `?includeArchived=true` |
| sortBy | string | `?sortBy=dateApplied` |
| sortDir | string | `?sortDir=desc` |
| page | integer | `?page=1` |
| limit | integer | `?limit=20` |

### Response Envelope

```
{
  items: Application[],
  page: number,
  limit: number,
  total: number
}
```

See [openapi.yaml](../api/openapi.yaml) for full API specification.
