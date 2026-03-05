# STANNEL Backend Dockerfile

FROM node:20-alpine AS base
RUN npm install -g pnpm

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package.json ./
RUN pnpm install

# Build stage
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate --schema=src/prisma/schema.prisma
RUN pnpm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

# Copy built files
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src/prisma ./prisma
COPY --from=build /app/package.json ./

USER fastify

EXPOSE 8080

CMD ["node", "dist/server.js"]
