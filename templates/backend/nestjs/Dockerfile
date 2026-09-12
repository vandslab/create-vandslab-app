# ---------- Base ----------
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@11

RUN apk update && \
    apk add --no-cache python3 make g++ libc6-compat && \
    rm -rf /var/cache/apk/*

# ---------- Production dependencies ----------
FROM base AS prod-deps

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --prod --ignore-scripts --frozen-lockfile

RUN rm -rf node_modules/.pnpm

# ---------- Build ----------
FROM base AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --ignore-scripts --frozen-lockfile

COPY . .

RUN pnpm test

RUN pnpm run build

# ---------- Runtime ----------
FROM node:22-alpine AS runtime
RUN addgroup --system --gid 99995 nodejs && \
    adduser --system --uid 99995 nestjs

WORKDIR /app
RUN chown nestjs:nodejs /app
USER nestjs

COPY --chown=nestjs:nodejs --from=prod-deps /app/node_modules ./node_modules
COPY --chown=nestjs:nodejs --from=build /app/dist ./dist
COPY --chown=nestjs:nodejs --from=build /app/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "dist/main.js"]
