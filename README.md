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

## Quick start

```bash
npm install
npm run dev:gateway   # :4000
npm run dev:web       # :3000
```

```bash
docker compose up --build
```

- Console: http://localhost:3000/console
- Docs: http://localhost:3000/docs
- OpenAPI: http://localhost:4000/api/v1/openapi.json

## Capabilities

- Versioned API gateway (request IDs, rate limits, echo proxy)
- Webhook subscriptions with create / patch / pause / delete
- Ingest fan-out with HMAC, retries, and dead-letter queue
- Disk persistence for subscriptions, events, and DLQ
- Per-source ingest rate limits
- Request audit log + `/api/v1/metrics`
- OpenAPI 3 document and operator console tabs
- GitHub Actions CI (gateway tests + web build)

## Tests

```bash
npm test
npm run build --workspace=@hermes/web
```

## License

MIT
