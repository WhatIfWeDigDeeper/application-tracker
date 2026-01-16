# Feature Specification: Job Application Tracker

**Feature Branch**: `001-job-application-tracker`
**Created**: 2026-01-16
**Status**: Draft
**Input**: User description: "Build an application that can help track a user's job applications with details, interview stages, offer tracking, and filtering/sorting capabilities"

## Clarifications

### Session 2026-01-16

- Q: What additional fields should each job application support? → A: Company URL, position URLs (job site and company posting), company category (Education/Health/Climate/AI/FinTech), skills match indicator (High/Medium/Low), cover letter required flag, special requirements field, optional salary range (min/max)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add New Job Application (Priority: P1)

As a job seeker, I want to add a new job application to my tracker so that I can keep a record of all positions I've applied for.

**Why this priority**: This is the core functionality - without the ability to add applications, the entire system has no purpose. Users need to capture job applications as they submit them.

**Independent Test**: Can be fully tested by adding a new job application with all required fields (company name, position) and optional fields (URLs, category, skills match, salary range, etc.) and verifying it appears in the applications list.

**Acceptance Scenarios**:

1. **Given** I am on the application tracker, **When** I create a new job application with company name "Acme Corp", position "Software Engineer", date applied "2026-01-15", status "Applied", and notes "Found on LinkedIn", **Then** the application is saved and visible in my list of applications.
2. **Given** I am adding a new application, **When** I leave required fields empty (company name or position), **Then** I receive validation feedback indicating which fields are required.
3. **Given** I am adding a new application, **When** I select the date applied, **Then** I can choose any date (past, present, or future) to account for scheduled applications.
4. **Given** I am adding a new application, **When** I enter optional fields like company URL, job posting URLs, company category, skills match level, cover letter requirement, special requirements, and salary range, **Then** all these details are saved with the application.

---

### User Story 2 - View and Filter Applications List (Priority: P1)

As a job seeker, I want to view all my job applications in a list and filter/sort them so that I can quickly find specific applications and understand my job search progress.

**Why this priority**: Equally critical as adding applications - users need to see and navigate their data effectively. A tracker without visibility is not useful.

**Independent Test**: Can be fully tested by viewing a list of applications, applying status filters, and sorting by date or company name.

**Acceptance Scenarios**:

1. **Given** I have multiple job applications, **When** I view the applications list, **Then** I see all non-archived applications displayed with their key details (company, position, status, date applied).
2. **Given** I have applications with various statuses, **When** I filter by "Interviewing" status, **Then** I only see applications currently in the interviewing stage.
3. **Given** I have multiple applications, **When** I sort by date applied (newest first), **Then** applications are ordered with most recent applications at the top.
4. **Given** I have multiple applications, **When** I sort by company name, **Then** applications are ordered alphabetically by company.
5. **Given** I have applications with different company categories, **When** I filter by category (e.g., "AI"), **Then** I only see applications for companies in that category.
6. **Given** I have applications with different skills match levels, **When** I filter by skills match (e.g., "High"), **Then** I only see applications with that skills match level.

---

### User Story 3 - Track Interview Progress (Priority: P2)

As a job seeker in the interview process, I want to track my progress through multiple interview rounds so that I can stay organized and remember how each round went.

**Why this priority**: Interview tracking is essential for active job seekers but depends on first having applications in the system. It adds significant value by helping users manage complex interview processes.

**Independent Test**: Can be fully tested by setting an application to "Interviewing" status and tracking progress through interview rounds with completion dates, notes, and self-ratings.

**Acceptance Scenarios**:

1. **Given** I have an application in "Interviewing" status, **When** I view that application, **Then** I see a checklist of interview stages (Contacted by Recruiter, Interview with Recruiter, Interview with Hiring Manager, Exercise, Technical Interview, Cross-functional interviews) in order.
2. **Given** I am viewing an interview checklist, **When** I complete the "Interview with Recruiter" stage, **Then** I can mark it complete with a completion date, add notes about the conversation, and rate my performance from 1-5.
3. **Given** I have completed some interview stages, **When** I view the application, **Then** I can see which stages are completed vs pending, along with my notes and ratings for completed stages.
4. **Given** I am tracking interviews, **When** I need a custom interview process, **Then** I can add, remove, or reorder interview stages for that specific application.

---

### User Story 4 - Manage Offers with Due Dates (Priority: P2)

As a job seeker who has received an offer, I want to track offer details including the decision deadline so that I don't miss important deadlines.

**Why this priority**: Offer management is time-sensitive and critical for users who reach this stage. Missing an offer deadline could have significant consequences.

**Independent Test**: Can be fully tested by changing an application status to "Offered", setting a due date, and verifying the deadline is visible.

**Acceptance Scenarios**:

1. **Given** I have an application, **When** I change its status to "Offered", **Then** I can optionally set an offer due date for when I need to respond.
2. **Given** I have an offer with a due date, **When** I view my applications list, **Then** I can see which offers have upcoming deadlines.
3. **Given** I have an offer with a due date approaching, **When** I view that application, **Then** I can clearly see the deadline and how many days remain.

---

### User Story 5 - Archive and Delete Applications (Priority: P3)

As a job seeker, I want to archive or delete old applications so that I can keep my active list focused while preserving history if needed.

**Why this priority**: Data management is important but secondary to core tracking functionality. Users need to manage clutter but this is less urgent than tracking active applications.

**Independent Test**: Can be fully tested by archiving an application (hiding from default view but retrievable) and deleting an application (permanent removal).

**Acceptance Scenarios**:

1. **Given** I have an old application, **When** I archive it, **Then** it no longer appears in my default applications list but can be viewed by toggling archived items.
2. **Given** I want to permanently remove an application, **When** I delete it, **Then** I am asked to confirm the permanent deletion and the application is removed from the system.
3. **Given** I have archived applications, **When** I choose to view archived items, **Then** I can see all archived applications and optionally restore them to the active list.

---

### User Story 6 - Responsive Mobile and Desktop Experience (Priority: P3)

As a job seeker, I want to access my job tracker on both my phone and computer so that I can update applications from anywhere.

**Why this priority**: Accessibility across devices enhances usability but is secondary to core functionality working correctly on any device first.

**Independent Test**: Can be fully tested by accessing all features on both a mobile device and desktop browser, verifying usability on each.

**Acceptance Scenarios**:

1. **Given** I am using a mobile device, **When** I access the application tracker, **Then** all features are usable with a touch-friendly interface and appropriate layout for smaller screens.
2. **Given** I am using a desktop computer, **When** I access the application tracker, **Then** the interface takes advantage of larger screen space with efficient navigation.

---

### Edge Cases

- What happens when a user tries to add a job application with a company name that already exists? (Allow duplicates - same company may have multiple positions)
- How does the system handle very long company names or position titles? (Truncate display with full text on hover/detail view)
- What happens when a user changes status from "Interviewing" to "Applied"? (Preserve interview data in case status changes back)
- How does the system handle offer due dates that have passed? (Display as overdue, keep visible until user takes action)
- What happens when filtering results in zero applications? (Display helpful empty state message)
- How does the system behave offline? (Graceful degradation with clear offline indicator)
- What happens when a URL field contains an invalid URL? (Validate URL format, show error for malformed URLs)
- What happens when salary range has min greater than max? (Validate that min <= max, show error if invalid)

## Requirements *(mandatory)*

### Functional Requirements

**Core Application Fields:**
- **FR-001**: System MUST allow users to create job applications with required fields: company name and position title
- **FR-002**: System MUST allow users to set application date (defaults to current date)
- **FR-003**: System MUST support these application statuses: Applied, Interviewing, Offered, Rejected, Archived
- **FR-004**: System MUST allow users to add free-form notes to any application
- **FR-019**: System MUST allow users to add an optional company website URL
- **FR-020**: System MUST allow users to add optional job posting URLs (job site URL such as LinkedIn, and company career page URL)
- **FR-021**: System MUST allow users to select a company category from a predefined list: Education, Health, Climate, AI, FinTech, or Other
- **FR-022**: System MUST allow users to indicate skills match level: High, Medium, or Low
- **FR-023**: System MUST allow users to mark whether a cover letter is required (yes/no)
- **FR-024**: System MUST allow users to add special requirements notes (e.g., portfolio samples, code samples, assessments)
- **FR-025**: System MUST allow users to enter an optional salary range with minimum and/or maximum values

**List View & Navigation:**
- **FR-005**: System MUST display all non-archived applications in a list view by default
- **FR-006**: System MUST allow filtering applications by status
- **FR-026**: System MUST allow filtering applications by company category
- **FR-027**: System MUST allow filtering applications by skills match level
- **FR-007**: System MUST allow sorting applications by date applied (ascending/descending) and company name (alphabetical)

**Interview Tracking:**
- **FR-008**: System MUST provide a default interview checklist with these stages in order: Contacted by Recruiter, Interview with Recruiter, Interview with Hiring Manager, Exercise, Technical Interview, Cross-functional interviews
- **FR-009**: System MUST allow users to mark interview stages as complete with a completion date
- **FR-010**: System MUST allow users to add notes to each interview stage
- **FR-011**: System MUST allow users to rate their performance for each interview stage on a scale of 1-5
- **FR-012**: System MUST allow users to customize interview stages (add, remove, reorder) for individual applications

**Offer Management:**
- **FR-013**: System MUST allow users to set an optional due date when status is "Offered"

**Data Management:**
- **FR-014**: System MUST allow users to archive applications (soft delete - hidden from default view)
- **FR-015**: System MUST allow users to permanently delete applications with confirmation
- **FR-016**: System MUST allow users to view and restore archived applications

**Platform & Persistence:**
- **FR-017**: System MUST provide a responsive interface that works on mobile devices (viewport 320px and up) and desktop
- **FR-018**: System MUST persist all application data locally so users don't lose their information

### Key Entities

- **Job Application**: Represents a single job application. Contains:
  - Required: company name, position title
  - Auto-set: date applied (defaults to current date), current status
  - Optional: company website URL, job posting URL (external job site), company career page URL, company category, skills match level, cover letter required flag, special requirements notes, salary range (min/max), general notes
  - Related: interview stages (when applicable), offer details (when applicable)
  - State: active or archived

- **Interview Stage**: Represents one step in the interview process. Contains stage name/title, order position, completion status, completion date (when complete), optional notes, and optional performance rating (1-5). Belongs to a single Job Application.

- **Offer Details**: Contains offer due date (optional). Associated with Job Applications in "Offered" status.

- **Company Category**: Enumeration of industry categories: Education, Health, Climate, AI, FinTech, Other.

- **Skills Match Level**: Enumeration of match indicators: High, Medium, Low.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can add a new job application in under 30 seconds (with required fields only) or under 60 seconds (with all optional fields)
- **SC-002**: Users can find a specific application using filters and sorting in under 10 seconds when tracking up to 100 applications
- **SC-003**: Users can update an interview stage (mark complete, add notes, add rating) in under 20 seconds
- **SC-004**: 95% of users can successfully complete core tasks (add application, update status, filter list) on first attempt without assistance
- **SC-005**: Application interface is fully functional on devices ranging from 320px to 1920px viewport width
- **SC-006**: All user data persists across browser sessions with no data loss
- **SC-007**: Page load time is under 2 seconds on standard connections

## Assumptions

- This is a single-user application (no authentication/multi-user support required)
- Data is stored locally in the browser (no server-side persistence)
- Users are tracking their own job applications (not a recruiter/HR tool)
- The default interview stages are appropriate for most tech industry roles but can be customized
- Users may track up to approximately 100 active applications (performance optimized for this scale)
- Modern browser support is sufficient (last 2 major versions of Chrome, Firefox, Safari, Edge)
- Company categories are limited to the predefined list plus "Other" for flexibility
- Salary values are stored as numbers without currency specification (user's local currency assumed)
- URL validation checks format only, not whether the URL is reachable
