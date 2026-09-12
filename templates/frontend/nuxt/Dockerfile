# ---------- Build Stage ----------
FROM node:22-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@11

WORKDIR /app

COPY . .

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --ignore-scripts && pnpm run build

# ---------- Production Stage ----------
FROM node:22-alpine

RUN addgroup --system --gid 99995 nodejs && \
    adduser --system --uid 99995 nuxt

WORKDIR /app
RUN chown nuxt:nodejs /app

USER nuxt

COPY --chown=nuxt:nodejs --from=builder /app/.output ./.output

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
