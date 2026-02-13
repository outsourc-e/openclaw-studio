# --- Build stage ---
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# --- Production stage ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup -S clawsuite && adduser -S clawsuite -G clawsuite

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./

# Expose default port
EXPOSE 3000

USER clawsuite

CMD ["node", ".output/server/index.mjs"]
