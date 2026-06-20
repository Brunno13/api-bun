FROM oven/bun:alpine AS base
WORKDIR /app

FROM base AS builder

COPY package.json bun.lock* bun.lockb* ./
RUN bun install --frozen-lockfile

FROM base AS release
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules

COPY src ./src
COPY package.json drizzle.config.ts ./

EXPOSE 3000

CMD ["sh", "-c", "bunx drizzle-kit push && bun run src/index.ts"]
