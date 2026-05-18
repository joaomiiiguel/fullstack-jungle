# ---------------------------------------------------------------------------
# Base image matching the project stack (Bun)
# ---------------------------------------------------------------------------
FROM oven/bun:1-alpine AS base

WORKDIR /app

# Copy package manifests first to leverage Docker layer caching
COPY package.json bun.lock* ./

# Install dependencies (we don't use --frozen-lockfile by default in case 
# you initialize a scaffold and haven't run bun install yet)
RUN bun install

# Copy the rest of the application source code
COPY . .

# Expose port 3000 (mapped in docker-compose.yml)
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="localhost"

# ---------------------------------------------------------------------------
# Development/Standard Execution
# ---------------------------------------------------------------------------
# By default, we run the dev command (ideal for local development and hot-reloading).
# Change this to "start" or "preview" if you want to run the production build inside Docker.
CMD ["bun", "run", "dev"]

# ---------------------------------------------------------------------------
# ALTERNATIVE: Production Build (Multi-stage)
# If you are deploying to production with Next.js or TanStack Start, 
# uncomment the lines below and adjust accordingly:
# ---------------------------------------------------------------------------
# FROM base AS builder
# RUN bun run build
# 
# FROM oven/bun:1-alpine AS runner
# WORKDIR /app
# COPY --from=builder /app/.next/standalone ./
# COPY --from=builder /app/.next/static ./.next/static
# COPY --from=builder /app/public ./public
# EXPOSE 3000
# CMD ["bun", "run", "server.js"]
