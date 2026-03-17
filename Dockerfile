# STANNEL Web - Next.js Production Dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages ./packages

# Copy source code
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Set API URL for build (NEXT_PUBLIC vars are embedded at build time)
ENV NEXT_PUBLIC_API_URL=https://stannel-api-280659436731.me-west1.run.app

# Firebase config
ENV NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB_qejW2mxuNLVnDKhIG7Bzrl8u5X4DH_w
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=stannel-app.firebaseapp.com
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=stannel-app
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=stannel-app.firebasestorage.app
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1094694418275
ENV NEXT_PUBLIC_FIREBASE_APP_ID=1:1094694418275:web:4683e39d588d206963c556

# Build the app
WORKDIR /app/apps/web
RUN pnpm build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built files - standalone preserves monorepo structure
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

WORKDIR /app/apps/web

CMD ["node", "server.js"]
