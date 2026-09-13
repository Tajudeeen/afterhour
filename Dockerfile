# syntax = docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"
RUN npm install -g pnpm

# Install dependencies (deduplicated layer for faster builds)
FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY packages/types/package.json packages/types/
COPY packages/config/package.json packages/config/
COPY packages/market-engine/package.json packages/market-engine/
COPY packages/risk-engine/package.json packages/risk-engine/
COPY packages/agent/package.json packages/agent/
COPY packages/solana/package.json packages/solana/
COPY packages/db/package.json packages/db/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --frozen-pnpm

# Build all packages
FROM deps AS builder
COPY packages/ packages/
COPY apps/ apps/
COPY . .
RUN pnpm --filter @afterhours/api build || true
RUN pnpm --filter @afterhours/web build || true

# Production image
FROM base AS production
WORKDIR /app

# Copy lockfile and package manifests
COPY package.json pnpm-workspace.yaml ./
COPY packages/types/package.json packages/types/
COPY packages/config/package.json packages/config/
COPY packages/market-engine/package.json packages/market-engine/
COPY packages/risk-engine/package.json packages/risk-engine/
COPY packages/agent/package.json packages/agent/
COPY packages/solana/package.json packages/solana/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

# Install production deps
RUN pnpm install --prod --frozen-lockfile --frozen-pnpm

# Copy built artifacts
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/web/.next apps/web/.next
COPY --from=builder /app/apps/web/public apps/web/public

# Generate Prisma client
RUN npx prisma generate --schema=packages/db/prisma/schema.prisma

EXPOSE 8787
CMD ["node", "apps/api/dist/server.js"]
