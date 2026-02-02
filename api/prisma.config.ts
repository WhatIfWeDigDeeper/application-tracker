import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrate: {
    migrations: 'prisma/migrations',
  },
  datasource: {
    // Fallback for CI where generation doesn't need a real connection
    url: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/app_tracker',
  },
})
