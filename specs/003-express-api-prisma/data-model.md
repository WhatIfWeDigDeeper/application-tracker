# Data Model: Applications and Interview Stages

## Entities

### Application
- id: string (UUID)
- companyName: string (required)
- positionTitle: string (required)
- dateApplied: string (ISO date)
- status: enum `ApplicationStatus`
- createdAt: string (ISO datetime)
- updatedAt: string (ISO datetime)
- companyUrl?: string (URL)
- jobPostingUrl?: string (URL)
- companyCareerUrl?: string (URL)
- companyCategory?: enum `CompanyCategory`
- skillsMatch?: number (0-100)
- jobSource?: enum `JobSource`
- coverLetterRequired?: boolean
- specialRequirements?: string
- salaryMin?: number
- salaryMax?: number
- notes?: string
- offerDueDate?: string (ISO date)
- isArchived: boolean
- interviewStages: InterviewStage[] (1:N relation)

Validation:
- `companyName`, `positionTitle` non-empty
- `skillsMatch` 0-100 when provided
- URLs must be valid when provided
- `salaryMin` ≤ `salaryMax` when both provided

### InterviewStage
- id: string (UUID)
- applicationId: string (FK → Application.id)
- name: string (required)
- order: number (int ≥ 0)
- isCompleted: boolean (default false)
- completedDate?: string (ISO date)
- notes?: string
- performanceRating?: number (0-10)

Validation:
- `name` non-empty
- `order` non-negative integer
- `performanceRating` 0-10 when provided

## Relationships
- Application 1 — N InterviewStage
- Cascade delete stages when application deleted

## Prisma Schema (outline)

```prisma
model Application {
  id                 String           @id @default(uuid())
  companyName        String
  positionTitle      String
  dateApplied        DateTime?
  status             String
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt
  companyUrl         String?
  jobPostingUrl      String?
  companyCareerUrl   String?
  companyCategory    String?
  skillsMatch        Int?
  jobSource          String?
  coverLetterRequired Boolean?
  specialRequirements String?
  salaryMin          Int?
  salaryMax          Int?
  notes              String?
  offerDueDate       DateTime?
  isArchived         Boolean          @default(false)

  interviewStages    InterviewStage[]
}

model InterviewStage {
  id               String   @id @default(uuid())
  applicationId    String
  name             String
  order            Int      @default(0)
  isCompleted      Boolean  @default(false)
  completedDate    DateTime?
  notes            String?
  performanceRating Int?

  application      Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
}
```
