export const config = {
  port: Number(process.env.PORT) || 4000,
  serviceName: "hermes-gateway",
  version: "0.1.0",
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
    max: Number(process.env.RATE_LIMIT_MAX) || 120,
  },
  /** Upstream services the gateway can forward to */
  upstreams: {
    echo: {
      baseUrl: process.env.UPSTREAM_ECHO_URL || "https://httpbin.org",
      timeoutMs: 8_000,
    },
  },
  webhooks: {
    deliveryTimeoutMs: Number(process.env.WEBHOOK_DELIVERY_TIMEOUT_MS) || 5_000,
    /** Optional HMAC secret for inbound ingest verification */
    ingestSecret: process.env.WEBHOOK_INGEST_SECRET || null,
  },
};
