# Build context: repository root (the server imports ../common)
#   docker build -f server/Dockerfile -t stocktracker-server .

# Compile and install on the build host's native arch. The server and all of
# its production dependencies are pure JavaScript, so the output is identical
# for every target platform and multi-arch builds skip QEMU-emulated npm.
FROM --platform=$BUILDPLATFORM node:26.13.1-alpine3.24 AS build-stage
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --no-audit --no-fund
COPY common/ /app/common/
COPY server/ ./
RUN npm run build && npm prune --omit=dev

FROM node:26.13.1-alpine3.24 AS production-stage
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build-stage /app/server/node_modules ./node_modules
COPY --from=build-stage /app/server/dist ./dist
COPY server/package.json ./
# Built-in non-root `node` user (uid 1000); nothing is written to disk.
USER node
EXPOSE 3000
CMD ["node", "dist/server/server.js"]
