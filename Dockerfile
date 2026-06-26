# Build Stage
FROM node:20-slim AS builder

# Install OpenSSL
RUN apt-get update -y && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package definitions
COPY package*.json ./

# Install all dependencies (including devDependencies for compilation)
RUN npm ci

# Copy Prisma schema (needed by build / generator script)
COPY prisma ./prisma/

# Copy source code and build (this runs `rimraf dist && tsc && prisma generate`)
COPY . .
RUN npm run build

# Production Stage
FROM node:20-slim AS runner

# Install OpenSSL for Prisma engine runtime
RUN apt-get update -y && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

# Copy package definitions and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled JavaScript from builder
COPY --from=builder /app/dist ./dist

# Copy Prisma Client binaries and migrations
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Start application (runs migrations then starts the server)
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
