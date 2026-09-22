# Hermes Gateway

Express-based API Gateway for Hermes.

## Scripts

- `npm run dev` — start with file watching
- `npm run start` — production start

Default port: `4000`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Gateway info |
| GET | `/health` | Liveness probe |
| GET | `/api/v1/status` | Status + upstream summary |
| GET | `/api/v1/routes` | Registered route catalog |
| ALL | `/api/v1/proxy/echo/*` | Proxy to the echo upstream |
| POST | `/api/v1/webhooks/subscriptions` | Create a subscription |
| GET | `/api/v1/webhooks/subscriptions` | List subscriptions |
| DELETE | `/api/v1/webhooks/subscriptions/:id` | Remove a subscription |
| POST | `/api/v1/webhooks/ingest/:source` | Ingest + fan-out |
| GET | `/api/v1/webhooks/events` | Recent events |
| POST | `/api/v1/webhooks/events/:id/replay` | Redeliver an event |

## Webhooks

1. Create a subscription with a destination URL.
2. POST events to `/api/v1/webhooks/ingest/:source`.
3. Hermes fans out to matching subscribers with optional HMAC (`X-Hermes-Signature`).

Subscriptions and events are stored in memory (resets on process restart).

## Middleware

- **Request ID** — `X-Request-Id` on every response
- **Rate limit** — in-memory window (`RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS`)
- **JSON body** — 1mb limit
- **404 / error handlers** — consistent JSON errors

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Listen port |
| `RATE_LIMIT_MAX` | `120` | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate-limit window |
| `UPSTREAM_ECHO_URL` | `https://httpbin.org` | Echo upstream base URL |
| `WEBHOOK_DELIVERY_TIMEOUT_MS` | `5000` | Outbound delivery timeout |
| `WEBHOOK_INGEST_SECRET` | _(empty)_ | Optional HMAC secret for ingest |
