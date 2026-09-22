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
  ingestRateLimit?: { windowMs: number; max: number };
  webhooks?: {
    maxAttempts: number;
    retryBaseMs: number;
    deliveryTimeoutMs: number;
    maxDeadLetters?: number;
    persistence: boolean;
    deadLetterQueue?: boolean;
  };
  docs?: { openapi: string; console: string };
  upstreams: Record<string, { baseUrl: string; timeoutMs: number }>;
  timestamp: string;
};

export type GatewayMetrics = {
  service: string;
  uptimeSeconds: number;
  counters: {
    requests: number;
    ingestAccepted: number;
    deliveriesOk: number;
    deliveriesFailed: number;
    retriesScheduled: number;
    subscriptionsCreated: number;
    subscriptionsUpdated?: number;
    subscriptionsDeleted: number;
    deadLetters?: number;
  };
  timestamp: string;
};

export type AuditEntry = {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  requestId?: string | null;
  ip?: string | null;
  at: string;
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
  attempt?: number;
  retryScheduled?: boolean;
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

export type DeadLetter = {
  id: string;
  eventId: string;
  subscriptionId: string;
  url: string;
  source: string;
  type: string;
  error: string;
  attempts: number;
  payload: unknown;
  createdAt: string;
};

export function fetchStatus() {
  return gatewayFetch<GatewayStatus>("/api/v1/status");
}

export function fetchMetrics() {
  return gatewayFetch<GatewayMetrics>("/api/v1/metrics");
}

export function fetchAudit(limit = 40) {
  return gatewayFetch<{ count: number; entries: AuditEntry[] }>(
    `/api/v1/audit?limit=${limit}`,
  );
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

export function fetchDeadLetters(limit = 20) {
  return gatewayFetch<{ count: number; deadLetters: DeadLetter[] }>(
    `/api/v1/webhooks/dead-letters?limit=${limit}`,
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

export function updateSubscription(
  id: string,
  body: Partial<{ url: string; events: string[]; source: string; active: boolean }>,
) {
  return gatewayFetch<WebhookSubscription>(
    `/api/v1/webhooks/subscriptions/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
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

export function replayEvent(id: string) {
  return gatewayFetch<{
    eventId: string;
    status: string;
    deliveries: WebhookDelivery[];
  }>(`/api/v1/webhooks/events/${encodeURIComponent(id)}/replay`, {
    method: "POST",
  });
}

export function replayDeadLetter(id: string) {
  return gatewayFetch<{
    deadLetterId: string;
    eventId: string;
    status: string;
  }>(`/api/v1/webhooks/dead-letters/${encodeURIComponent(id)}/replay`, {
    method: "POST",
  });
}

export function deleteDeadLetter(id: string) {
  return gatewayFetch<void>(
    `/api/v1/webhooks/dead-letters/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
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
