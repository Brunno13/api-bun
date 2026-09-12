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

USER bun

EXPOSE 3000

HEALTHCHECK \
  --interval=30s \
  --timeout=5s \
  --start-period=20s \
  --retries=3 \
  CMD bun -e 'try { const r = await fetch("http://127.0.0.1:3000/"); process.exit(r.ok ? 0 : 1); } catch { process.exit(1); }'

CMD ["sh", "-c", "bunx drizzle-kit push && bun run src/index.ts"]