const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

export function getGatewayUrl() {
  return GATEWAY_URL;
}

async function gatewayFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${GATEWAY_URL}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Gateway responded with ${response.status}`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export type GatewayStatus = {
  status: string;
  service: string;
  version: string;
  uptimeSeconds: number;
  rateLimit: { windowMs: number; max: number };
  upstreams: Record<string, { baseUrl: string; timeoutMs: number }>;
  timestamp: string;
};

export type GatewayRoute = {
  id: string;
  method: string;
  path: string;
  description: string;
  upstream?: { name: string; baseUrl?: string };
};

export type WebhookSubscription = {
  id: string;
  url: string;
  events: string[];
  source: string;
  active: boolean;
  hasSecret: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WebhookDelivery = {
  subscriptionId: string;
  url: string;
  ok: boolean;
  statusCode: number;
  durationMs: number;
  at: string;
  error?: string;
};

export type WebhookEvent = {
  id: string;
  source: string;
  type: string;
  payload: unknown;
  status: string;
  deliveries: WebhookDelivery[];
  createdAt: string;
  requestId?: string | null;
};

export function fetchStatus() {
  return gatewayFetch<GatewayStatus>("/api/v1/status");
}

export function fetchRoutes() {
  return gatewayFetch<{ count: number; routes: GatewayRoute[] }>("/api/v1/routes");
}

export function fetchEvents(limit = 20) {
  return gatewayFetch<{ count: number; events: WebhookEvent[] }>(
    `/api/v1/webhooks/events?limit=${limit}`,
  );
}

export function fetchSubscriptions() {
  return gatewayFetch<{ count: number; subscriptions: WebhookSubscription[] }>(
    "/api/v1/webhooks/subscriptions",
  );
}

export function createSubscription(body: {
  url: string;
  events?: string[];
  source?: string;
  secret?: string;
}) {
  return gatewayFetch<WebhookSubscription>("/api/v1/webhooks/subscriptions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function deleteSubscription(id: string) {
  return gatewayFetch<void>(`/api/v1/webhooks/subscriptions/${id}`, {
    method: "DELETE",
  });
}

export function ingestEvent(
  source: string,
  payload: Record<string, unknown>,
  type?: string,
) {
  return gatewayFetch<{
    accepted: boolean;
    eventId: string;
    matchedSubscriptions: number;
    status: string;
  }>(`/api/v1/webhooks/ingest/${encodeURIComponent(source)}`, {
    method: "POST",
    headers: type ? { "x-event-type": type } : undefined,
    body: JSON.stringify(payload),
  });
}

export function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function relativeTime(iso: string) {
  const delta = Date.now() - new Date(iso).getTime();
  const sec = Math.max(0, Math.floor(delta / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  return new Date(iso).toLocaleString();
}
