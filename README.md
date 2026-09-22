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
├── package.json      # Workspace root
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

## Features (roadmap)

1. Project foundation & workspace setup
2. API Gateway routing & middleware
3. Webhook ingestion & delivery
4. Futuristic console UI ← current
5. End-to-end gateway ↔ web integration
## License

MIT
