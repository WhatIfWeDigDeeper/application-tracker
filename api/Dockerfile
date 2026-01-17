# Multi-stage Express API Dockerfile
FROM node:18-alpine AS base

WORKDIR /app

# Install dependencies stage
FROM base AS deps
COPY api/package.json api/package-lock.json ./
RUN npm ci

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY api/src ./src
COPY api/tsconfig.json .
COPY api/prisma ./prisma
RUN npm run build

# Production stage
FROM base AS runner
ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S node -u 1001

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY api/package.json .

USER node

EXPOSE 5000
CMD ["node", "dist/index.js"]
