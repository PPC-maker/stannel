# STANNEL Backend Dockerfile
# Build from monorepo root: docker build -f backend/Dockerfile .

FROM node:20-alpine AS base
RUN npm install -g pnpm

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY backend/package.json ./backend/

# Install all dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Build stage
FROM base AS build
WORKDIR /app

# Copy all node_modules from deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules

# Copy source
COPY packages/types ./packages/types
COPY backend ./backend

# Build types first, then backend
WORKDIR /app/packages/types
RUN pnpm run build || true

WORKDIR /app/backend
RUN npx prisma generate --schema=src/prisma/schema.prisma
RUN pnpm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN npm install -g pnpm

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

# Copy workspace config for pnpm
COPY package.json pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY backend/package.json ./backend/

# Copy built types package
COPY --from=build /app/packages/types/dist ./packages/types/dist

# Copy built backend
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/src/prisma ./backend/prisma

# Install production dependencies only with pnpm
RUN pnpm install --prod --frozen-lockfile || pnpm install --prod

# Generate Prisma client
WORKDIR /app/backend
RUN npx prisma generate --schema=prisma/schema.prisma

USER fastify

EXPOSE 8080

CMD ["node", "dist/server.js"]
