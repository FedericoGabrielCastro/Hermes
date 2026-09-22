# Hermes Web

Next.js console for Hermes — futuristic operations UI, no login.

## Scripts

- `npm run dev` — development server on `:3000`
- `npm run build` — production build
- `npm run start` — serve production build

## Surfaces

| Path | Description |
|------|-------------|
| `/` | Brand landing with signal-field hero |
| `/console` | Live gateway + webhook operations console |

## Configuration

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_GATEWAY_URL=http://localhost:4000
```

Run gateway and web together from the repo root:

```bash
npm run dev:gateway
npm run dev:web
```

Copy and UI chrome are in English. No login required.
