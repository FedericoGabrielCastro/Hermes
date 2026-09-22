FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/gateway/package.json ./apps/gateway/
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps ./apps
COPY package.json package-lock.json ./
COPY apps/web ./apps/web
ARG NEXT_PUBLIC_GATEWAY_URL=http://localhost:4000
ENV NEXT_PUBLIC_GATEWAY_URL=$NEXT_PUBLIC_GATEWAY_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=@hermes/web

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S hermes && adduser -S hermes -G hermes

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=hermes:hermes /app/apps/web/.next/standalone ./
COPY --from=builder --chown=hermes:hermes /app/apps/web/.next/static ./apps/web/.next/static

USER hermes
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
