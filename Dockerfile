FROM node:25.8-alpine AS builder

RUN npm install -g pnpm@10.30.3 esbuild

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

RUN DATABASE_URL=build.db \
    BETTER_AUTH_SECRET=placeholder \
    BETTER_AUTH_URL=http://localhost \
    ORIGIN=http://localhost \
    pnpm run build && rm -f build.db
RUN esbuild scripts/seed.ts --bundle --platform=node --format=esm --outfile=scripts/seed.mjs --external:better-sqlite3 --external:better-auth --external:drizzle-orm

FROM node:25.8-alpine

RUN addgroup -S app && adduser -S app -G app && \
    mkdir -p /data && chown app:app /data

WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/scripts/migrate.mjs ./scripts/migrate.mjs
COPY --from=builder /app/scripts/seed.mjs ./scripts/seed.mjs

ENV NODE_ENV=production
ENV HOST=0.0.0.0

EXPOSE 3000

USER app

CMD ["sh", "-c", "node scripts/migrate.mjs && node build"]
