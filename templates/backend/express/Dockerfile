# ---------- Base ----------
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install system deps (for Prisma, native modules)
RUN apk update && \
    apk add --no-cache openssl python3 make g++ libc6-compat tzdata && \
    rm -rf /var/cache/apk/*

# ---------- Dependencies & Build ----------
FROM base AS build

ENV NODE_ENV=production

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml .npmrc ./

# Install all dependencies
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build backend
RUN pnpm run build

# ---------- Runtime: Express (backend) ----------
FROM node:22-alpine AS runtime
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install openssl for Prisma and create user first
RUN apk add --no-cache openssl tzdata && \
    addgroup --system --gid 99995 nodejs && \
    adduser --system --uid 99995 express

WORKDIR /app
RUN chown express:nodejs /app

# Switch to non-root user BEFORE pnpm install
USER express

# Copy package files
COPY --chown=express:nodejs package.json pnpm-lock.yaml .npmrc ./

# Install production dependencies only (as express user - no chown needed)
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --prod

# Copy built app with correct ownership
COPY --chown=express:nodejs --from=build /app/dist ./dist
COPY --chown=express:nodejs --from=build /app/prisma ./prisma

# Generate Prisma client in production
RUN pnpm prisma generate

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# Run Express app
CMD ["node", "dist/server.js"]
