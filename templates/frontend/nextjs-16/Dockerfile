# ---------- Build Stage ----------
FROM node:22-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@11

WORKDIR /app

ENV NEXT_PUBLIC_API_URL=/api

COPY . .

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --ignore-scripts && pnpm run build

# ---------- Production Stage ----------
FROM node:22-alpine

RUN addgroup --system --gid 99995 nodejs && \
    adduser --system --uid 99995 nextjs

WORKDIR /app
RUN chown nextjs:nodejs /app

USER nextjs

COPY --chown=nextjs:nodejs --from=builder /app/.next/standalone ./
COPY --chown=nextjs:nodejs --from=builder /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs --from=builder /app/public ./public

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]
