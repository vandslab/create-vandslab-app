# ---------- Base ----------
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install system deps (if needed for Prisma / Next builds)
RUN apk update && \
    apk add --no-cache openssl python3 make g++ && \
    rm -rf /var/cache/apk/*
RUN apk add --no-cache libc6-compat

# ---------- Dependencies & Build ----------
FROM base AS build

ARG BUILD_TARGET

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json ./apps/web/
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/prisma ./apps/backend/prisma

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Generate Prisma client before building (only if building backend)
RUN if [ "$BUILD_TARGET" = "backend" ]; then \
        cd apps/backend && pnpm prisma generate; \
    fi

COPY . .

# Build only the target app (or all if BUILD_TARGET=all)
RUN if [ "$BUILD_TARGET" = "web" ]; then \
        cd apps/web && pnpm run build; \
    elif [ "$BUILD_TARGET" = "backend" ]; then \
        cd apps/backend && pnpm run build; \
    else \
        pnpm run build; \
    fi

# Deploy web with production dependencies and copy build output
RUN if [ "$BUILD_TARGET" = "web" ]; then \
        pnpm deploy --filter=web --prod /apps/web && \
        cp -r /usr/src/app/apps/web/.next /apps/web/.next; \
    fi

# Deploy backend with production dependencies and copy build output
RUN if [ "$BUILD_TARGET" = "backend" ]; then \
        pnpm deploy --filter=backend --prod /apps/backend && \
        cp -r /usr/src/app/apps/backend/dist /apps/backend/dist; \
    fi

# ---------- Runtime for Next.js app ----------
FROM node:22-alpine AS web
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY --from=build /apps/web ./

RUN addgroup --system --gid 99995 nodejs && \
    adduser --system --uid 99995 nextjs && \
    chown -R nextjs:nodejs /app

USER nextjs

ENV NODE_ENV=production

ENV PORT=3000
EXPOSE 3000

CMD ["pnpm", "start"]

FROM node:22-alpine AS backend
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY --from=build /apps/backend ./

RUN pnpm prisma generate

RUN addgroup --system --gid 99995 nodejs && \
    adduser --system --uid 99995 nextjs && \
    chown -R nextjs:nodejs /app
USER nextjs

ENV NODE_ENV=production

ENV PORT=4000
EXPOSE 4000

CMD ["pnpm", "start"]
