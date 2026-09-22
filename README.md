# Hermes

Modern event-driven platform built with **Node.js**, **Express**, and **Next.js**.

Hermes provides a lightweight API Gateway and webhook ingestion layer with a futuristic web console — no login required.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (App Router) |
| API Gateway | Express |
| Runtime | Node.js |
| Deploy | Docker Compose |

## Monorepo layout

```
Hermes/
├── apps/
│   ├── web/          # Next.js console
│   └── gateway/      # Express API Gateway + webhooks
├── .github/workflows # CI
├── docker-compose.yml
├── package.json
└── README.md
```

## Quick start

```bash
npm install
npm run dev:gateway   # :4000
npm run dev:web       # :3000
```

Set `NEXT_PUBLIC_GATEWAY_URL` in `apps/web/.env.local` if needed.

### Docker

```bash
docker compose up --build
```

- Console: http://localhost:3000
- Gateway: http://localhost:4000

Webhook state persists in the `hermes-data` volume.

### Tests / CI

```bash
npm test
npm run build --workspace=@hermes/web
```

GitHub Actions runs gateway tests and the web production build on every PR.

## Platform capabilities

- Versioned API gateway with request IDs, rate limits, and echo proxy
- Webhook subscriptions, ingest, HMAC signatures, fan-out delivery
- Automatic delivery retries with exponential backoff
- Disk persistence for subscriptions and events
- `/api/v1/metrics` runtime counters
- Live console: create subscriptions, ingest events, replay deliveries

## Environment (gateway)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Listen port |
| `HERMES_DATA_DIR` | `<repo>/data` | Persistence directory |
| `WEBHOOK_MAX_ATTEMPTS` | `3` | Delivery attempts |
| `WEBHOOK_RETRY_BASE_MS` | `400` | Retry backoff base |
| `WEBHOOK_INGEST_SECRET` | _(empty)_ | Optional ingest HMAC |
| `RATE_LIMIT_MAX` | `120` | Requests per window |

## License

MIT
