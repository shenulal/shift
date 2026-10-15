# syntax=docker/dockerfile:1
# SHIFT Coaching — one image: builds the React SPA, runs the Fastify API which also serves the SPA.
#   docker build -t shift-coaching .
#   docker run -p 4000:4000 -e DATABASE_URL=... -e COOKIE_SECRET=... -v shift-uploads:/data/uploads shift-coaching

# ── 1. install all workspace dependencies (cached on the lockfile)
FROM node:22.22.0-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/core/package.json packages/core/
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
RUN npm ci --no-audit --no-fund

# ── 2. build the web app (vite, production mode → talks to /api on the same origin)
FROM deps AS web
COPY packages/core packages/core
COPY apps/web apps/web
RUN cd apps/web && npx vite build

# ── 3. runtime: API production deps only + sources (run with tsx; core is consumed as TypeScript source)
FROM node:22.22.0-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=4000 \
    WEB_DIST=/app/apps/web/dist \
    UPLOAD_DIR=/data/uploads \
    TRUST_PROXY=true \
    TZ=Asia/Dubai
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/core/package.json packages/core/
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
RUN npm ci --omit=dev --no-audit --no-fund -w @shift/api && npm cache clean --force
COPY packages/core/src packages/core/src
COPY apps/api/src apps/api/src
COPY apps/api/drizzle apps/api/drizzle
COPY apps/api/tsconfig.json apps/api/docker-entrypoint.sh apps/api/
COPY --from=web /app/apps/web/dist apps/web/dist
RUN mkdir -p /data/uploads && chown -R node:node /data /app/apps/api
USER node
EXPOSE 4000
VOLUME ["/data/uploads"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["/app/apps/api/docker-entrypoint.sh"]
