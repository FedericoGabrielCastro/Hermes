import { config } from "../config.js";

/** In-memory catalog of gateway routes exposed via the admin API. */
const routes = [
  {
    id: "health",
    method: "GET",
    path: "/health",
    description: "Liveness probe",
  },
  {
    id: "root",
    method: "GET",
    path: "/",
    description: "Gateway info",
  },
  {
    id: "v1-status",
    method: "GET",
    path: "/api/v1/status",
    description: "Gateway status and upstream summary",
  },
  {
    id: "v1-routes",
    method: "GET",
    path: "/api/v1/routes",
    description: "List registered gateway routes",
  },
  {
    id: "v1-proxy-echo",
    method: "ALL",
    path: "/api/v1/proxy/echo/*",
    description: "Forward requests to the echo upstream",
    upstream: "echo",
  },
  {
    id: "v1-webhooks-subscriptions",
    method: "GET|POST",
    path: "/api/v1/webhooks/subscriptions",
    description: "List or create webhook subscriptions",
  },
  {
    id: "v1-webhooks-ingest",
    method: "POST",
    path: "/api/v1/webhooks/ingest/:source",
    description: "Ingest an inbound webhook and fan-out to subscribers",
  },
  {
    id: "v1-webhooks-events",
    method: "GET",
    path: "/api/v1/webhooks/events",
    description: "List recent webhook events and deliveries",
  },
  {
    id: "v1-metrics",
    method: "GET",
    path: "/api/v1/metrics",
    description: "Runtime counters for ingest, deliveries, and retries",
  },
  {
    id: "v1-audit",
    method: "GET",
    path: "/api/v1/audit",
    description: "Recent request audit log",
  },
  {
    id: "v1-openapi",
    method: "GET",
    path: "/api/v1/openapi.json",
    description: "OpenAPI 3 specification",
  },
  {
    id: "v1-webhooks-dead-letters",
    method: "GET",
    path: "/api/v1/webhooks/dead-letters",
    description: "Dead-letter queue for exhausted deliveries",
  },
];

export function listRoutes() {
  return routes.map((route) => ({
    ...route,
    upstream: route.upstream
      ? {
          name: route.upstream,
          baseUrl: config.upstreams[route.upstream]?.baseUrl,
        }
      : undefined,
  }));
}

export function getUpstream(name) {
  return config.upstreams[name] || null;
}
