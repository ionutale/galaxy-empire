FROM node:20-bullseye-slim AS builder
WORKDIR /app

# Install build dependencies and activate pnpm via corepack
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ git ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate

# Allow overriding the database path at build-time
ARG DATABASE_URL=local.db
ENV DATABASE_URL=${DATABASE_URL}

# Copy sources and install + build
COPY package.json pnpm-lock.yaml* ./
COPY . .

# Ensure a local sqlite file exists so server-side build steps that expect DATABASE_URL pass
RUN mkdir -p $(dirname "$DATABASE_URL") || true && touch "$DATABASE_URL"

RUN pnpm install --no-frozen-lockfile --jobs 1
RUN pnpm build

FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Activate pnpm so we can install production deps
RUN corepack enable && corepack prepare pnpm@latest --activate

# Only install production deps in the runtime image
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build

# Copy the example local sqlite database created during build so the runtime has a DB file by default
ARG DATABASE_URL=local.db
ENV DATABASE_URL=${DATABASE_URL}
COPY --from=builder /app/${DATABASE_URL} ./${DATABASE_URL}

EXPOSE 3000
ENV PORT=3000

# Start the Node adapter build
CMD ["node", "build/index.js"]
