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
