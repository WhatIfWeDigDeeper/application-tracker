# State Transitions

This document defines the valid state transitions for domain entities and their side effects.

---

## ApplicationStatus State Machine

### State Diagram

```
                       ┌───────────────┐
                       │ unsubmitted  │ (default initial state)
                       └──────┬────────┘
                              │
                              ▼
                       ┌─────────────┐
                       │   applied   │
                       └──────┬──────┘
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
      ┌─────────────┐  ┌───────────┐    ┌───────────┐
      │interviewing │  │ rejected  │    │  (any)    │
      └──────┬──────┘  └───────────┘    │ archived  │
             │                          └───────────┘
     ┌───────┼───────────┐
     ▼       ▼           ▼
┌─────────────┐ ┌─────────┐ ┌─────────┐
│ given offer │ │no offer │ │ applied │ (revert)
└─────┬───────┘ └─────────┘ └─────────┘
      │
      ├──────────────┬────────────────┐
      ▼              ▼                ▼
┌──────────────┐ ┌───────────────┐ ┌─────────────┐
│accepted offer│ │declined offer │ │interviewing │
│  (terminal)  │ │  (terminal)   │ │(more rounds)│
└──────────────┘ └───────────────┘ └─────────────┘
```

### Transition Table

| From | To | Allowed | Side Effects |
|------|-----|---------|--------------|
| unsubmitted | applied | Yes | Auto-populate dateApplied with today if null |
| unsubmitted | interviewing | Yes | Auto-populate dateApplied; create default stages if none |
| unsubmitted | rejected | Yes | Auto-populate dateApplied with today if null |
| unsubmitted | given offer | Yes | Auto-populate dateApplied with today if null |
| (any non-terminal) | unsubmitted | Yes | Clear dateApplied to null |
| applied | rejected | Yes | None |
| applied | interviewing | Yes | Create default interview stages if none exist |
| applied | given offer | Yes | None (rare: direct offer) |
| interviewing | given offer | Yes | None |
| interviewing | no offer | Yes | Preserve interview data |
| interviewing | rejected | Yes | Preserve interview data |
| interviewing | applied | Yes | Preserve interview data (revert) |
| given offer | accepted offer | Yes | Terminal state |
| given offer | declined offer | Yes | Terminal state |
| given offer | interviewing | Yes | None (additional rounds) |
| given offer | rejected | Yes | Offer rescinded |
| accepted offer | (any) | No | Terminal state - no transitions allowed |
| declined offer | (any) | No | Terminal state - no transitions allowed |
| rejected | interviewing | Yes | Reconsideration |
| rejected | applied | Yes | Revert |
| no offer | applied | Yes | Reapply |
| no offer | interviewing | Yes | New interview process |

### Side Effects Detail

#### Transition: unsubmitted → (any status)

When an application moves away from "unsubmitted":

1. **Check** if dateApplied is null
2. **If null**, auto-populate with today's date
3. **If already set**, preserve existing value

#### Transition: (any) → unsubmitted

When an application reverts to "unsubmitted":

1. **Clear** dateApplied to null
2. Preserve all other application data

#### Transition: applied → interviewing

When an application moves to "interviewing" status:

1. **Check** if interviewStages array is empty
2. **If empty**, populate with default stages:
   - Contacted by Recruiter (order: 0)
   - Interview with Recruiter (order: 1)
   - Interview with Hiring Manager (order: 2)
   - Exercise (order: 3)
   - Technical Interview (order: 4)
   - Cross-functional Interviews (order: 5)
3. **If not empty**, preserve existing stages (user may have pre-configured)

#### Transition: (any) → rejected/no offer

- Preserve all interview stage data
- Data remains accessible if status reverts

#### Transition: (any) → given offer

- offerDueDate field becomes relevant
- UI should prompt/allow setting due date

---

## Archive State

Archiving is orthogonal to ApplicationStatus - any application can be archived.

| Action | Effect |
|--------|--------|
| Archive | Set isArchived=true; application hidden from default list views |
| Restore | Set isArchived=false; application visible in default list views |

### Archive Rules

- Archived applications retain all data including status
- Status transitions are still valid on archived applications
- Archiving does not change the application status
- Default list views exclude archived applications (includeArchived=false)

---

## InterviewStage State

Interview stages have a simpler state model:

### Completion State

| State | isCompleted | completedDate |
|-------|-------------|---------------|
| Pending | false | null |
| Completed | true | set (defaults to today if not provided) |

### Completion Transition

When marking a stage complete:

1. Set isCompleted=true
2. If completedDate not provided, set to current date
3. Optionally set notes and performanceRating

When marking a stage incomplete (reverting):

1. Set isCompleted=false
2. Optionally clear completedDate (or preserve for history)
3. Preserve notes and performanceRating

---

## Validation During Transitions

### Pre-Transition Checks

Before allowing a status transition:

1. Validate the transition is allowed (see transition table)
2. For terminal states, warn user the action cannot be undone
3. For "given offer", optionally prompt for offerDueDate

### Post-Transition Actions

After a successful transition:

1. Update the `updatedAt` timestamp
2. Execute any side effects (e.g., creating default stages)
3. Persist the change

---

## UI Considerations

### Status Selection

- Show only valid next statuses based on current status
- Or show all statuses but disable invalid transitions
- Provide confirmation for terminal states

### Visual Indicators

- Terminal states should be visually distinct
- Active states (applied, interviewing, given offer) should be prominent
- Archived applications should have a visual indicator

### Transition Feedback

- Confirm successful transitions
- Show side effects that occurred (e.g., "Default interview stages created")
- Warn before terminal state transitions
