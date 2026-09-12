# ---------- Build Stage ----------
FROM node:22-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@11

WORKDIR /app

COPY . .

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install && pnpm run build

# ---------- Production Stage ----------
FROM nginx:alpine

RUN mkdir -p /app && \
    chown -R nginx:nginx /app /var/cache/nginx /var/run && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/log/nginx

WORKDIR /app

USER nginx

COPY --chown=nginx:nginx --from=builder /app/dist ./

USER root
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN chown nginx:nginx /etc/nginx/conf.d/default.conf

USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
