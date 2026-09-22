# Hermes

Modern event-driven platform built with **Node.js**, **Express**, and **Next.js**.

Hermes provides a lightweight API Gateway and webhook ingestion layer with a futuristic web console — no login required.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (App Router) |
| API Gateway | Express |
| Runtime | Node.js |

## Monorepo layout

```
Hermes/
├── apps/
│   ├── web/          # Next.js console
│   └── gateway/      # Express API Gateway + webhooks
├── docker-compose.yml
├── package.json
└── README.md
```

## Quick start

```bash
# Install dependencies (from repo root)
npm install

# Run API Gateway (default :4000)
npm run dev:gateway

# Run Next.js console (default :3000)
npm run dev:web
```

Set `NEXT_PUBLIC_GATEWAY_URL` in `apps/web/.env.local` if the gateway is not on `http://localhost:4000`.

### Docker

```bash
docker compose up --build
```

- Console: http://localhost:3000  
- Gateway: http://localhost:4000  

The web image bakes `NEXT_PUBLIC_GATEWAY_URL=http://localhost:4000` so the browser can reach the published gateway port.

## Features

1. Project foundation & workspace setup
2. API Gateway routing & middleware
3. Webhook ingestion & delivery
4. Futuristic console UI
5. End-to-end gateway ↔ web integration
6. Docker Compose deployment ← current

## License

MIT
