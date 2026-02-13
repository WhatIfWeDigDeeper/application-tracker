# Multi-stage Next.js Dockerfile
FROM node:24-alpine AS base

WORKDIR /app

# Install dependencies stage
FROM base AS deps
COPY ui/package.json ui/package-lock.json ./
RUN npm ci --no-update-notifier

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY ui/ .
RUN mkdir -p public
RUN npm run build

# Production stage
FROM base AS runner
ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
