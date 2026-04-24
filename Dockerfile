# syntax=docker/dockerfile:1.7

FROM docker.io/oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY tsconfig.json tailwind.config.js ./
COPY src ./src
COPY public ./public
RUN bun run build

FROM docker.io/oven/bun:1-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    PUBLIC_DIR=dist

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/index.html ./src/index.html
COPY --from=builder /app/src/server.ts ./src/server.ts
COPY --from=builder /app/src/lib/proxy.ts ./src/lib/proxy.ts

EXPOSE 3000
CMD ["bun", "src/server.ts"]
