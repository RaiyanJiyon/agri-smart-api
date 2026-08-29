# ==========================================
# STAGE 1: Base & Dependencies Setup
# ==========================================
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
WORKDIR /app

# Install all dependencies (including devDependencies for building)
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ==========================================
# STAGE 2: Build Stage
# ==========================================
FROM base AS builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.build.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
RUN pnpm build

# Re-isolate ONLY production dependencies cleanly using pnpm fetch/install
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

# ==========================================
# STAGE 3: Production Production Runtime
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

USER node

COPY --chown=node:node package.json ./
# Pull production dependencies from the clean prod-deps stage
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
# Pull compiled JS code from builder stage
COPY --chown=node:node --from=builder /app/dist ./dist

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/api/v1/health || exit 1

CMD ["node", "dist/server.js"]
