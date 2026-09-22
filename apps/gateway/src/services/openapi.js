import { config } from "../config.js";
import { listRoutes } from "./routeRegistry.js";

/** Minimal OpenAPI 3 document for the Hermes gateway. */
export function buildOpenApi() {
  return {
    openapi: "3.0.3",
    info: {
      title: "Hermes API Gateway",
      version: config.version,
      description:
        "Event-driven API gateway with webhook ingest, fan-out delivery, retries, and dead-letter queue. No authentication required.",
    },
    servers: [{ url: `http://localhost:${config.port}`, description: "Local gateway" }],
    paths: {
      "/health": {
        get: {
          summary: "Liveness probe",
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/v1/status": {
        get: {
          summary: "Gateway status",
          responses: { 200: { description: "Status payload" } },
        },
      },
      "/api/v1/metrics": {
        get: {
          summary: "Runtime metrics",
          responses: { 200: { description: "Counters" } },
        },
      },
      "/api/v1/routes": {
        get: {
          summary: "Route catalog",
          responses: { 200: { description: "Registered routes" } },
        },
      },
      "/api/v1/audit": {
        get: {
          summary: "Recent request audit log",
          responses: { 200: { description: "Audit entries" } },
        },
      },
      "/api/v1/openapi.json": {
        get: {
          summary: "OpenAPI document",
          responses: { 200: { description: "OpenAPI JSON" } },
        },
      },
      "/api/v1/webhooks/subscriptions": {
        get: { summary: "List subscriptions", responses: { 200: { description: "OK" } } },
        post: { summary: "Create subscription", responses: { 201: { description: "Created" } } },
      },
      "/api/v1/webhooks/subscriptions/{id}": {
        get: { summary: "Get subscription", responses: { 200: { description: "OK" } } },
        patch: { summary: "Update subscription", responses: { 200: { description: "Updated" } } },
        delete: { summary: "Delete subscription", responses: { 204: { description: "Deleted" } } },
      },
      "/api/v1/webhooks/ingest/{source}": {
        post: {
          summary: "Ingest webhook and fan-out",
          parameters: [
            { name: "source", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { 202: { description: "Accepted" } },
        },
      },
      "/api/v1/webhooks/events": {
        get: { summary: "List events", responses: { 200: { description: "OK" } } },
      },
      "/api/v1/webhooks/events/{id}/replay": {
        post: { summary: "Replay event deliveries", responses: { 200: { description: "OK" } } },
      },
      "/api/v1/webhooks/dead-letters": {
        get: { summary: "List dead letters", responses: { 200: { description: "OK" } } },
      },
      "/api/v1/webhooks/dead-letters/{id}/replay": {
        post: {
          summary: "Replay a dead-letter entry",
          responses: { 200: { description: "Replayed" } },
        },
      },
    },
    "x-hermes-route-count": listRoutes().length,
  };
}
