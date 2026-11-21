# Build context: repository root
#   docker build -f client/Dockerfile -t stocktracker-client .

# Build stage runs on the build host's native arch: the output is static
# HTML/JS/CSS, identical for every target platform, so multi-arch builds
# don't need to run npm under QEMU.
FROM --platform=$BUILDPLATFORM node:26.13.1-alpine3.24 AS build-stage
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --no-audit --no-fund
COPY client/ ./
# Leave VITE_SERVER_URL unset: the app connects to its own origin and nginx
# proxies /api and /socket.io to the server.
RUN npm run build

# Production stage: unprivileged nginx (uid 101, listens on 8080) so the pod
# can run as non-root with a read-only root filesystem.
FROM nginxinc/nginx-unprivileged:1.30.6-alpine AS production-stage
# Rendered to /etc/nginx/conf.d/default.conf at start by the image's envsubst
# entrypoint, so the upstream can be changed without rebuilding.
COPY client/deploy/nginx/default.conf.template /etc/nginx/templates/default.conf.template
# host:port of the stocktracker server, as reachable from this container.
ENV SERVER_UPSTREAM=stocktracker-server:3000
COPY --from=build-stage /app/client/dist /usr/share/nginx/html
EXPOSE 8080
