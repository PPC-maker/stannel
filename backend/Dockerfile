# STANNEL Backend - Fastify API Dockerfile
# Built from project root context
FROM node:20-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package.json ./

# Install dependencies with npm
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

# Start
CMD ["node", "dist/server.js"]
