# ---------- Build Stage ----------
FROM node:22-alpine AS builder

# Enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy everything (node_modules and .nuxt/.output excluded via .dockerignore)
COPY . .

# Install dependencies and build the Nitro server output (.output/)
# pnpm 11 errors on un-approved build scripts; skip them (nuxt build runs prepare itself)
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --ignore-scripts && pnpm run build

# ---------- Production Stage ----------
FROM node:22-alpine

# Create non-root user first
RUN addgroup --system --gid 99995 nodejs && \
    adduser --system --uid 99995 nuxt

WORKDIR /app
RUN chown nuxt:nodejs /app

# Switch to non-root user before copying
USER nuxt

# Copy the self-contained Nitro build (bundles its own node_modules + public/)
COPY --chown=nuxt:nodejs --from=builder /app/.output ./.output

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

# Start the Nitro server directly with node
CMD ["node", ".output/server/index.mjs"]
