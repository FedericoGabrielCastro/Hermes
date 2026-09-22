# Hermes Gateway

Express-based API Gateway for Hermes.

## Scripts

- `npm run dev` — start with file watching
- `npm run start` — production start
- `npm test` — signature + store unit tests

Default port: `4000`

## Docker

```bash
docker compose up --build gateway
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Gateway info |
| GET | `/health` | Liveness probe |
| GET | `/api/v1/status` | Status + webhook retry config |
| GET | `/api/v1/metrics` | Runtime counters |
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
3. Hermes fans out with optional HMAC (`X-Hermes-Signature`) and retries failed deliveries with exponential backoff.
4. Subscriptions and events persist under `HERMES_DATA_DIR` (default `<repo>/data`).

## Middleware

- **Request ID** — `X-Request-Id` on every response
- **Rate limit** — in-memory window
- **JSON body** — 1mb limit
- **404 / error handlers** — consistent JSON errors

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Listen port |
| `HERMES_DATA_DIR` | `<repo>/data` | Persistence directory |
| `RATE_LIMIT_MAX` | `120` | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate-limit window |
| `UPSTREAM_ECHO_URL` | `https://httpbin.org` | Echo upstream base URL |
| `WEBHOOK_DELIVERY_TIMEOUT_MS` | `5000` | Outbound delivery timeout |
| `WEBHOOK_MAX_ATTEMPTS` | `3` | Delivery attempts including first |
| `WEBHOOK_RETRY_BASE_MS` | `400` | Exponential backoff base |
| `WEBHOOK_INGEST_SECRET` | _(empty)_ | Optional HMAC secret for ingest |
