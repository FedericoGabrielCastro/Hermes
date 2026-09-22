"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  createSubscription,
  deleteSubscription,
  fetchEvents,
  fetchRoutes,
  fetchStatus,
  fetchSubscriptions,
  formatUptime,
  getGatewayUrl,
  ingestEvent,
  relativeTime,
  type GatewayRoute,
  type GatewayStatus,
  type WebhookEvent,
  type WebhookSubscription,
} from "@/lib/gateway";

function statusColor(status: string) {
  if (status === "delivered" || status === "online" || status === "ok") {
    return "var(--ok)";
  }
  if (status === "partial") return "var(--warn)";
  if (status === "failed") return "var(--danger)";
  return "var(--muted)";
}

const panel: React.CSSProperties = {
  border: "1px solid var(--line)",
  background: "rgba(10, 18, 24, 0.72)",
  padding: "1.35rem 1.4rem",
};

const labelStyle: React.CSSProperties = {
  color: "var(--muted)",
  fontSize: "0.72rem",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.65rem 0.75rem",
  background: "rgba(16, 32, 40, 0.9)",
  border: "1px solid var(--line)",
  color: "var(--fg)",
  borderRadius: "var(--radius)",
};

const buttonPrimary: React.CSSProperties = {
  padding: "0.7rem 1.1rem",
  background: "var(--accent)",
  color: "#04120f",
  border: "none",
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  fontSize: "0.72rem",
  borderRadius: "var(--radius)",
  cursor: "pointer",
};

const buttonGhost: React.CSSProperties = {
  ...buttonPrimary,
  background: "transparent",
  color: "var(--fg)",
  border: "1px solid var(--line)",
};

export function ConsoleDashboard() {
  const [status, setStatus] = useState<GatewayStatus | null>(null);
  const [routes, setRoutes] = useState<GatewayRoute[]>([]);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [subscriptions, setSubscriptions] = useState<WebhookSubscription[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [subUrl, setSubUrl] = useState("https://httpbin.org/post");
  const [subSource, setSubSource] = useState("shop");
  const [subEvents, setSubEvents] = useState("order.created");

  const [ingestSource, setIngestSource] = useState("shop");
  const [ingestType, setIngestType] = useState("order.created");
  const [ingestPayload, setIngestPayload] = useState(
    '{\n  "orderId": "ord_demo",\n  "total": 42\n}',
  );

  const refresh = useCallback(() => {
    startTransition(async () => {
      setError(null);
      try {
        const [statusRes, routesRes, eventsRes, subsRes] = await Promise.all([
          fetchStatus(),
          fetchRoutes(),
          fetchEvents(20),
          fetchSubscriptions(),
        ]);
        setStatus(statusRes);
        setRoutes(routesRes.routes);
        setEvents(eventsRes.events);
        setSubscriptions(subsRes.subscriptions);
      } catch (err) {
        setStatus(null);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to reach the Hermes gateway",
        );
      }
    });
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 15_000);
    return () => clearInterval(timer);
  }, [refresh]);

  function onCreateSubscription(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      setMessage(null);
      setError(null);
      try {
        await createSubscription({
          url: subUrl.trim(),
          source: subSource.trim() || "*",
          events: subEvents
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        });
        setMessage("Subscription created.");
        refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Create failed");
      }
    });
  }

  function onIngest(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      setMessage(null);
      setError(null);
      try {
        const payload = JSON.parse(ingestPayload) as Record<string, unknown>;
        const result = await ingestEvent(
          ingestSource.trim() || "demo",
          payload,
          ingestType.trim() || undefined,
        );
        setMessage(
          `Ingested ${result.eventId} · ${result.status} · ${result.matchedSubscriptions} matched`,
        );
        refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Ingest failed (check JSON)",
        );
      }
    });
  }

  function onDeleteSubscription(id: string) {
    startTransition(async () => {
      setError(null);
      try {
        await deleteSubscription(id);
        setMessage("Subscription removed.");
        refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Delete failed");
      }
    });
  }

  const online = Boolean(status);

  return (
    <div style={{ display: "grid", gap: "2rem" }}>
      <header className="rise">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <p style={{ ...labelStyle, color: "var(--accent)", margin: 0 }}>
              Live console
            </p>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                margin: "0.4rem 0 0",
                letterSpacing: "-0.03em",
              }}
            >
              Operations surface
            </h1>
            <p style={{ color: "var(--muted)", margin: "0.6rem 0 0", maxWidth: "40rem" }}>
              Connected to{" "}
              <code style={{ color: "var(--accent)" }}>{getGatewayUrl()}</code>
              . Refresh every 15s. No login required.
            </p>
          </div>
          <button type="button" style={buttonGhost} onClick={refresh} disabled={isPending}>
            {isPending ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {(error || message) && (
          <p
            style={{
              margin: "1rem 0 0",
              color: error ? "var(--danger)" : "var(--ok)",
              fontSize: "0.9rem",
            }}
          >
            {error || message}
          </p>
        )}
      </header>

      <section
        className="rise rise-delay-1"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1px",
          background: "var(--line)",
          border: "1px solid var(--line)",
        }}
      >
        {[
          {
            label: "Gateway",
            value: online ? "ONLINE" : "OFFLINE",
            tone: online ? "var(--ok)" : "var(--danger)",
          },
          {
            label: "Uptime",
            value: status ? formatUptime(status.uptimeSeconds) : "—",
            tone: "var(--fg)",
          },
          {
            label: "Routes",
            value: String(routes.length || "—"),
            tone: "var(--fg)",
          },
          {
            label: "Events",
            value: String(events.length || "—"),
            tone: "var(--accent)",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "rgba(16, 32, 40, 0.88)",
              padding: "1.25rem 1.35rem",
            }}
          >
            <div style={labelStyle}>{stat.label}</div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.65rem",
                marginTop: "0.35rem",
                color: stat.tone,
                letterSpacing: "-0.02em",
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}
      >
        <section className="rise rise-delay-2" style={panel}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.15rem",
              margin: "0 0 1rem",
            }}
          >
            Gateway routes
          </h2>
          {routes.length === 0 ? (
            <p style={{ color: "var(--muted)", margin: 0 }}>
              No routes loaded. Start the gateway with{" "}
              <code>npm run dev:gateway</code>.
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {routes.map((route) => (
                <li
                  key={route.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "5.5rem 1fr",
                    gap: "0.75rem",
                    alignItems: "start",
                    padding: "0.7rem 0",
                    borderTop: "1px solid var(--line)",
                    fontSize: "0.9rem",
                  }}
                >
                  <span
                    style={{
                      color: "var(--accent)",
                      fontFamily: "ui-monospace, monospace",
                      fontSize: "0.72rem",
                    }}
                  >
                    {route.method}
                  </span>
                  <div>
                    <div
                      style={{
                        fontFamily: "ui-monospace, monospace",
                        fontSize: "0.8rem",
                      }}
                    >
                      {route.path}
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>
                      {route.description}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rise rise-delay-3" style={panel}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.15rem",
              margin: "0 0 1rem",
            }}
          >
            Recent webhook events
          </h2>
          {events.length === 0 ? (
            <p style={{ color: "var(--muted)", margin: 0 }}>
              No events yet. Ingest a test payload below.
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {events.map((event) => (
                <li
                  key={event.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "0.5rem",
                    padding: "0.75rem 0",
                    borderTop: "1px solid var(--line)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "ui-monospace, monospace",
                        fontSize: "0.82rem",
                      }}
                    >
                      {event.type}
                    </div>
                    <div
                      style={{
                        color: "var(--muted)",
                        fontSize: "0.78rem",
                        marginTop: 2,
                      }}
                    >
                      {event.source} · {event.id.slice(0, 8)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        color: statusColor(event.status),
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {event.status}
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: "0.75rem" }}>
                      {relativeTime(event.createdAt)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}
      >
        <section style={panel}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.15rem",
              margin: "0 0 0.35rem",
            }}
          >
            Create subscription
          </h2>
          <p style={{ color: "var(--muted)", margin: "0 0 1rem", fontSize: "0.85rem" }}>
            Register a destination URL for fan-out delivery.
          </p>
          <form onSubmit={onCreateSubscription} style={{ display: "grid", gap: "0.75rem" }}>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span style={labelStyle}>Destination URL</span>
              <input
                style={inputStyle}
                value={subUrl}
                onChange={(e) => setSubUrl(e.target.value)}
                required
              />
            </label>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span style={labelStyle}>Source</span>
              <input
                style={inputStyle}
                value={subSource}
                onChange={(e) => setSubSource(e.target.value)}
              />
            </label>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span style={labelStyle}>Events (comma-separated)</span>
              <input
                style={inputStyle}
                value={subEvents}
                onChange={(e) => setSubEvents(e.target.value)}
              />
            </label>
            <button type="submit" style={buttonPrimary} disabled={isPending}>
              Create
            </button>
          </form>

          {subscriptions.length > 0 && (
            <ul style={{ listStyle: "none", margin: "1.25rem 0 0", padding: 0 }}>
              {subscriptions.map((sub) => (
                <li
                  key={sub.id}
                  style={{
                    borderTop: "1px solid var(--line)",
                    padding: "0.75rem 0",
                    display: "grid",
                    gap: "0.35rem",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "ui-monospace, monospace",
                      fontSize: "0.78rem",
                      wordBreak: "break-all",
                    }}
                  >
                    {sub.url}
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>
                    {sub.source} · {sub.events.join(", ")}
                  </div>
                  <button
                    type="button"
                    style={{ ...buttonGhost, justifySelf: "start", padding: "0.45rem 0.8rem" }}
                    onClick={() => onDeleteSubscription(sub.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={panel}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.15rem",
              margin: "0 0 0.35rem",
            }}
          >
            Ingest test event
          </h2>
          <p style={{ color: "var(--muted)", margin: "0 0 1rem", fontSize: "0.85rem" }}>
            POST a payload through the gateway webhook ingest API.
          </p>
          <form onSubmit={onIngest} style={{ display: "grid", gap: "0.75rem" }}>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span style={labelStyle}>Source</span>
              <input
                style={inputStyle}
                value={ingestSource}
                onChange={(e) => setIngestSource(e.target.value)}
              />
            </label>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span style={labelStyle}>Event type</span>
              <input
                style={inputStyle}
                value={ingestType}
                onChange={(e) => setIngestType(e.target.value)}
              />
            </label>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span style={labelStyle}>JSON payload</span>
              <textarea
                style={{ ...inputStyle, minHeight: "8rem", fontFamily: "ui-monospace, monospace" }}
                value={ingestPayload}
                onChange={(e) => setIngestPayload(e.target.value)}
              />
            </label>
            <button type="submit" style={buttonPrimary} disabled={isPending}>
              Send ingest
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
