# User Prompt with SpecKit (/specify)

```markdown
/speckit.specify Build an application that can help track a user's job applications.
* The application should allow one to add new job applications with details such as company name, position, date applied, status (e.g., applied, interviewing, offered, rejected), and notes.
* Each company may have different rounds for interviewing. When the job application is in interviewing status, we should support multiple sub-states with a checklist in the order of the interviewing rounds. We will default the steps to Contacted by Recruiter, Interview with Recruiter, Interview with Hiring Manager, Exercise, Technical Interview, Cross-functional interviews. They should each have a completion date, an optional note section, and a rating scale from 1 - 5 with how the applicant think they did.
* If an offer is made it may have a due date.
* I should be able to archive or delete job applications.
* I should be able to view a list of all my job applications, filter them by status, and sort them by date applied or company name.
* The application should have a user-friendly interface and be accessible on both desktop and mobile devices.
```

```markdown
/speckit.clarify each application should support the name of the company applied to, the url to the company website, the title of the position with urls to the job site (such as LinkedIn) and the post on the company site. The category of the company, such as Education, Health, Climate, AI, FinTech. An indicator of skills match, High Medium Low, whether the application requires a cover letter, any special things requested as part of the job application, like sample of portfolio, sample code, etc. We should support the optional salary range, max and/or min.
```

Note: Manually edited spec to add more company categories, and change skill match to 1-5 rating.

```markdown
/speckit.plan The application is written in Typescript and uses React, Docker, Node, NextJs, Vite, Jest, Tailwind CSS, SVGs for any images/icons.
```

Note: had to add rule about not using prefix of "I" to interfaces. Chose to update the constitution.md file rather than CLAUDE.md for now.

## Add API

```md
/speckit.plan "Scaffold Express API with Prisma (Postgres) and reorganize UI for application-tracker

## Context
- Repository: application-tracker
- Target branch: api
- Deployment: Local Docker (api, ui, Postgres)
- DB: Postgres with Prisma ORM
- Goal: Move existing Next.js app under /ui, add /api Express server with Prisma

## Deliverables
1. Reorganize existing UI:
   - Move /src → /ui/src
   - Move /public → /ui/public
   - Move root Next.js configs (package.json, tsconfig.json, next.config.js, .eslintrc*) → /ui/
   - Move .env.local → /ui/.env.example
   - Update import paths if needed

2. API scaffold (TypeScript Express):
   - /api/src/index.ts (server bootstrap, port 5000)
   - /api/src/routes/applications.ts (CRUD)
   - /api/src/routes/interview-stages.ts (CRUD, linked to applications)
   - /api/src/middleware/errorHandler.ts, /api/src/middleware/logger.ts
   - /api/src/services/ (business logic using Prisma Client)
   - /api/src/types/ (DTOs aligned with UI types)
   - /api/package.json (express, zod, prisma, @prisma/client, pg, typescript, ts-node-dev)
   - /api/tsconfig.json
   - /api/.env.example (DATABASE_URL=postgres://user:pass@postgres:5432/app_tracker)

3. Prisma setup:
   - /api/prisma/schema.prisma (provider: postgresql; models: Application, InterviewStage; relation 1:N)
   - Configure env var: DATABASE_URL
   - Add scripts: prisma generate, migrate, seed
   - /api/src/db/seed.ts (optional sample data)

4. Database and Docker:
   - Root docker-compose.yml with services:
     - postgres (5432, volume, healthcheck)
     - api (depends_on postgres, runs migrations on start)
     - ui (Next.js dev server)
   - /api/Dockerfile (multi-stage: build, run with node:18-alpine)
   - /ui/Dockerfile (multi-stage Next.js)
   - Root .gitignore updates if needed (node_modules, .next, prisma migrations)

5. Dependabot and CI:
   - Update .github/dependabot.yml to track /ui and /api npm, and root docker
   - Add .github/workflows for:
     - ui: install, lint, build, test
     - api: install, prisma generate, lint, build, test
     - optional compose build checks

## Constraints
- TypeScript everywhere
- Prisma with Postgres only (no MongoDB)
- RESTful routes, validation via zod
- Ports: ui 3000, api 5000, db 5432
- Ready for docker-compose up local dev

## Acceptance
- docker-compose up starts postgres, api, ui successfully
- prisma migrate runs and tables exist
- /api/health returns 200
- UI can call API endpoints for applications and interview stages"
```

## Make tech agnostic specs

```text
 want to have specs for the existing implementation such that Claude could look at the specs and create the application with different technology, such as Vue instead of React, and parse server instead of Express. I have used the speckit to create three specs. They have drifted as the code has been developed iteratively. Recommend an approach to be able to have sufficient specs on the app to then be able to run Claude agents in parallel to implement with different technology
 ```
