# STANNEL Backend - Fastify API Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files from backend directory
COPY backend/package.json ./

# Install dependencies with npm (include devDependencies for prisma)
RUN npm install --legacy-peer-deps

# Copy backend source code
COPY backend/ ./

# Generate Prisma client
RUN npx prisma generate --schema=src/prisma/schema.prisma

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 8080

# Set environment
ENV PORT=8080
ENV NODE_ENV=production

# Push schema changes on startup, then start server
CMD npx prisma db push --schema=src/prisma/schema.prisma --accept-data-loss --skip-generate && node dist/server.js
