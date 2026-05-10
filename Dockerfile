# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app/ai-household-mgr
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Build
FROM deps AS builder
WORKDIR /app/ai-household-mgr
COPY --from=deps /app/ai-household-mgr/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN NEXT_DISABLE_TURBOPACK=1 npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app/ai-household-mgr
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder /app/ai-household-mgr/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/ai-household-mgr/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/ai-household-mgr/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
