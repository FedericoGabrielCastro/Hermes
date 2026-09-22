import path from "node:path";
import { fileURLToPath } from "node:url";

const gatewayRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(gatewayRoot, "../..");

export const config = {
  port: Number(process.env.PORT) || 4000,
  serviceName: "hermes-gateway",
  version: "0.3.0",
  dataDir: process.env.HERMES_DATA_DIR || path.join(repoRoot, "data"),
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
    max: Number(process.env.RATE_LIMIT_MAX) || 120,
  },
  ingestRateLimit: {
    windowMs: Number(process.env.INGEST_RATE_LIMIT_WINDOW_MS) || 60_000,
    max: Number(process.env.INGEST_RATE_LIMIT_MAX) || 60,
  },
  audit: {
    maxEntries: Number(process.env.AUDIT_MAX_ENTRIES) || 100,
  },
  upstreams: {
    echo: {
      baseUrl: process.env.UPSTREAM_ECHO_URL || "https://httpbin.org",
      timeoutMs: 8_000,
    },
  },
  webhooks: {
    deliveryTimeoutMs: Number(process.env.WEBHOOK_DELIVERY_TIMEOUT_MS) || 5_000,
    ingestSecret: process.env.WEBHOOK_INGEST_SECRET || null,
    maxAttempts: Number(process.env.WEBHOOK_MAX_ATTEMPTS) || 3,
    retryBaseMs: Number(process.env.WEBHOOK_RETRY_BASE_MS) || 400,
    maxEvents: Number(process.env.WEBHOOK_MAX_EVENTS) || 200,
    maxDeadLetters: Number(process.env.WEBHOOK_MAX_DEAD_LETTERS) || 100,
  },
};
