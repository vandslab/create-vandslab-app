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

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (incl. devDeps so prisma CLI / tsc / tsc-alias are available)
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --ignore-scripts --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client (writes into node_modules/@prisma/client)
RUN pnpm prisma generate

# Build Express
RUN pnpm run build

# Strip devDeps from node_modules but keep generated Prisma client
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm prune --prod --ignore-scripts

# ---------- Runtime ----------
FROM node:22-alpine AS runtime
RUN apk add --no-cache openssl tzdata && \
    addgroup --system --gid 99995 nodejs && \
    adduser --system --uid 99995 express

WORKDIR /app
RUN chown express:nodejs /app
USER express

# Copy pruned node_modules (prod-only, includes generated Prisma client)
COPY --chown=express:nodejs --from=build /app/node_modules ./node_modules
COPY --chown=express:nodejs --from=build /app/dist ./dist
COPY --chown=express:nodejs --from=build /app/package.json ./package.json
COPY --chown=express:nodejs --from=build /app/prisma/schema.prisma ./prisma/schema.prisma

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "dist/server.js"]
