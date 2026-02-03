# ---------- Build Stage ----------
FROM node:22-alpine AS builder

# Enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy everything (node_modules and dist excluded via .dockerignore)
COPY . .

# Install dependencies and build
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install && pnpm run build

# ---------- Production Stage ----------
FROM nginx:alpine

# Create directories and set ownership for nginx user (nginx user already exists in nginx:alpine)
RUN mkdir -p /app && \
    chown -R nginx:nginx /app /var/cache/nginx /var/run && \
    # nginx needs write access to pid file and logs
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/log/nginx

WORKDIR /app

# Switch to non-root user before copying
USER nginx

# Copy built files with correct ownership
COPY --chown=nginx:nginx --from=builder /app/dist ./

# Copy nginx config (this needs to be done as root, so we'll handle it differently)
# Note: /etc/nginx/conf.d/ is typically writable by nginx user in official image
USER root
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN chown nginx:nginx /etc/nginx/conf.d/default.conf

USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
