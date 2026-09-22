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
