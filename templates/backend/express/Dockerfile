# ---------- Base ----------
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@11

RUN apk update &&     apk add --no-cache openssl python3 make g++ libc6-compat tzdata &&     rm -rf /var/cache/apk/*

# ---------- Production dependencies ----------
FROM base AS prod-deps

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store     pnpm install --prod --ignore-scripts --frozen-lockfile

RUN rm -rf node_modules/.pnpm

# ---------- Build ----------
FROM base AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store     pnpm install --ignore-scripts --frozen-lockfile

COPY . .

ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

RUN pnpm prisma generate

RUN pnpm test

RUN pnpm run build

# ---------- Runtime ----------
FROM node:22-alpine AS runtime
RUN apk add --no-cache openssl tzdata &&     addgroup --system --gid 99995 nodejs &&     adduser --system --uid 99995 express

WORKDIR /app
RUN chown express:nodejs /app
USER express

COPY --chown=express:nodejs --from=prod-deps /app/node_modules ./node_modules
COPY --chown=express:nodejs --from=build /app/dist ./dist
COPY --chown=express:nodejs --from=build /app/package.json ./package.json
COPY --chown=express:nodejs --from=build /app/prisma/schema.prisma ./prisma/schema.prisma

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "dist/server.js"]
