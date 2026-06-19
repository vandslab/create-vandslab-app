# ---------- Base ----------
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install system deps (for native modules)
RUN apk update && \
    apk add --no-cache python3 make g++ libc6-compat && \
    rm -rf /var/cache/apk/*

# ---------- Dependencies & Build ----------
FROM base AS build

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (incl. devDeps so the Nest CLI is available)
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --ignore-scripts --frozen-lockfile

# Copy source code
COPY . .

# Build NestJS
RUN pnpm run build

# Strip devDeps from node_modules
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm prune --prod --ignore-scripts

# ---------- Runtime ----------
FROM node:22-alpine AS runtime
RUN addgroup --system --gid 99995 nodejs && \
    adduser --system --uid 99995 nestjs

WORKDIR /app
RUN chown nestjs:nodejs /app
USER nestjs

# Copy pruned node_modules (prod-only) and build output
COPY --chown=nestjs:nodejs --from=build /app/node_modules ./node_modules
COPY --chown=nestjs:nodejs --from=build /app/dist ./dist
COPY --chown=nestjs:nodejs --from=build /app/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "dist/main.js"]
