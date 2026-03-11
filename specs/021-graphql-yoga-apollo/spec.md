# Spec 021: GraphQL Yoga + React Apollo Implementation

## Status: In Progress

## Overview
Add a new implementation pair to the monorepo:
- **yoga-api**: GraphQL Yoga 5 + Pothos schema builder + Prisma ORM, port 5080, schema `graphql_yoga`
- **react-apollo-ui**: React 19 + Apollo Client 3 + TanStack Router + Tailwind CSS 4, port 3080

## Goals
- Full CRUD for job applications via GraphQL
- Interview stages management
- Snapshot-based history with restore
- Archive/restore support
- Filter, sort, paginate application list
- Dark mode toggle
- E2E compatibility with shared Playwright tests

## Database
Schema: `graphql_yoga` in the shared `app_tracker` PostgreSQL database.
Uses Prisma for migrations and ORM.
