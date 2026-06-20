# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Build tools needed for better-sqlite3 native module
RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
RUN npm ci

COPY . .
RUN npm run build --workspace=client
RUN npm run build --workspace=server

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
RUN apk add --no-cache tini
WORKDIR /app

# Compiled server
COPY --from=build /app/server/dist      ./server/dist
COPY --from=build /app/server/node_modules ./server/node_modules

# Frontend served as static files by Express
COPY --from=build /app/client/dist      ./public

RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data

EXPOSE 3000
VOLUME ["/app/data"]

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server/dist/index.js"]
