"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  createSubscription,
  deleteDeadLetter,
  deleteSubscription,
  fetchAudit,
  fetchDeadLetters,
  fetchEvents,
  fetchMetrics,
  fetchRoutes,
  fetchStatus,
  fetchSubscriptions,
  formatUptime,
  getGatewayUrl,
  ingestEvent,
  relativeTime,
  replayDeadLetter,
  replayEvent,
  updateSubscription,
  type AuditEntry,
  type DeadLetter,
  type GatewayMetrics,
  type GatewayRoute,
  type GatewayStatus,
  type WebhookEvent,
  type WebhookSubscription,
} from "@/lib/gateway";

type Tab = "overview" | "webhooks" | "routes" | "ops";

function statusColor(status: string) {
  if (status === "delivered" || status === "online" || status === "ok") {
    return "var(--ok)";
  }
  if (status === "partial" || status === "retrying") return "var(--warn)";
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

const tabs: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "webhooks", label: "Webhooks" },
  { id: "routes", label: "Routes" },
  { id: "ops", label: "Ops" },
];

export function ConsoleDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [status, setStatus] = useState<GatewayStatus | null>(null);
  const [metrics, setMetrics] = useState<GatewayMetrics | null>(null);
  const [routes, setRoutes] = useState<GatewayRoute[]>([]);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [subscriptions, setSubscriptions] = useState<WebhookSubscription[]>([]);
  const [deadLetters, setDeadLetters] = useState<DeadLetter[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
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
        const [
          statusRes,
          metricsRes,
          routesRes,
          eventsRes,
          subsRes,
          dlqRes,
          auditRes,
        ] = await Promise.all([
          fetchStatus(),
          fetchMetrics(),
          fetchRoutes(),
          fetchEvents(20),
          fetchSubscriptions(),
          fetchDeadLetters(20),
          fetchAudit(40),
        ]);
        setStatus(statusRes);
        setMetrics(metricsRes);
        setRoutes(routesRes.routes);
        setEvents(eventsRes.events);
        setSubscriptions(subsRes.subscriptions);
        setDeadLetters(dlqRes.deadLetters);
        setAudit(auditRes.entries);
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

  function run(action: () => Promise<void>, okMessage: string) {
    startTransition(async () => {
      setError(null);
      setMessage(null);
      try {
        await action();
        setMessage(okMessage);
        refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed");
      }
    });
  }

  const online = Boolean(status);

  return (
    <div style={{ display: "grid", gap: "1.75rem" }}>
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
              Operator console
            </p>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                margin: "0.4rem 0 0",
                letterSpacing: "-0.03em",
              }}
            >
              Hermes control plane
            </h1>
            <p style={{ color: "var(--muted)", margin: "0.6rem 0 0", maxWidth: "42rem" }}>
              Connected to <code style={{ color: "var(--accent)" }}>{getGatewayUrl()}</code>
              {" · "}v{status?.version || "—"}
              {" · "}
              <a href="/docs" style={{ color: "var(--accent)" }}>
                OpenAPI docs
              </a>
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

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginTop: "1.25rem",
            borderBottom: "1px solid var(--line)",
            paddingBottom: "0.75rem",
          }}
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              style={{
                ...buttonGhost,
                borderColor: tab === item.id ? "var(--accent)" : "var(--line)",
                color: tab === item.id ? "var(--accent)" : "var(--muted)",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {tab === "overview" && (
        <>
          <section
            className="rise rise-delay-1"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
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
                label: "Ingest",
                value: metrics ? String(metrics.counters.ingestAccepted) : "—",
                tone: "var(--fg)",
              },
              {
                label: "Deliveries OK",
                value: metrics ? String(metrics.counters.deliveriesOk) : "—",
                tone: "var(--accent)",
              },
              {
                label: "Dead letters",
                value: metrics ? String(metrics.counters.deadLetters || 0) : "—",
                tone: "var(--danger)",
              },
              {
                label: "Retries",
                value: metrics ? String(metrics.counters.retriesScheduled) : "—",
                tone: "var(--warn)",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: "rgba(16, 32, 40, 0.88)",
                  padding: "1.15rem 1.2rem",
                }}
              >
                <div style={labelStyle}>{stat.label}</div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.45rem",
                    marginTop: "0.35rem",
                    color: stat.tone,
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
            <section style={panel}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", margin: "0 0 1rem" }}>
                Recent events
              </h2>
              {events.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>No events yet.</p>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {events.slice(0, 8).map((event) => (
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
                        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.82rem" }}>
                          {event.type}
                        </div>
                        <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>
                          {event.source} · {relativeTime(event.createdAt)}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            color: statusColor(event.status),
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                          }}
                        >
                          {event.status}
                        </div>
                        <button
                          type="button"
                          style={{ ...buttonGhost, marginTop: 4, padding: "0.3rem 0.55rem", fontSize: "0.65rem" }}
                          onClick={() =>
                            run(async () => {
                              await replayEvent(event.id);
                            }, `Replayed ${event.id.slice(0, 8)}`)
                          }
                        >
                          Replay
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section style={panel}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", margin: "0 0 1rem" }}>
                Dead-letter queue
              </h2>
              {deadLetters.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>Queue empty.</p>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {deadLetters.map((item) => (
                    <li
                      key={item.id}
                      style={{
                        padding: "0.75rem 0",
                        borderTop: "1px solid var(--line)",
                        display: "grid",
                        gap: "0.4rem",
                      }}
                    >
                      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.82rem" }}>
                        {item.type}
                      </div>
                      <div style={{ color: "var(--danger)", fontSize: "0.78rem" }}>{item.error}</div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          type="button"
                          style={{ ...buttonGhost, padding: "0.35rem 0.65rem", fontSize: "0.65rem" }}
                          onClick={() =>
                            run(async () => {
                              await replayDeadLetter(item.id);
                            }, "Dead letter replayed")
                          }
                        >
                          Replay
                        </button>
                        <button
                          type="button"
                          style={{ ...buttonGhost, padding: "0.35rem 0.65rem", fontSize: "0.65rem" }}
                          onClick={() =>
                            run(async () => {
                              await deleteDeadLetter(item.id);
                            }, "Dead letter removed")
                          }
                        >
                          Dismiss
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}

      {tab === "webhooks" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
          }}
        >
          <section style={panel}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", margin: "0 0 1rem" }}>
              Create subscription
            </h2>
            <form onSubmit={onCreateSubscription} style={{ display: "grid", gap: "0.75rem" }}>
              <label style={{ display: "grid", gap: "0.35rem" }}>
                <span style={labelStyle}>Destination URL</span>
                <input style={inputStyle} value={subUrl} onChange={(e) => setSubUrl(e.target.value)} required />
              </label>
              <label style={{ display: "grid", gap: "0.35rem" }}>
                <span style={labelStyle}>Source</span>
                <input style={inputStyle} value={subSource} onChange={(e) => setSubSource(e.target.value)} />
              </label>
              <label style={{ display: "grid", gap: "0.35rem" }}>
                <span style={labelStyle}>Events</span>
                <input style={inputStyle} value={subEvents} onChange={(e) => setSubEvents(e.target.value)} />
              </label>
              <button type="submit" style={buttonPrimary} disabled={isPending}>
                Create
              </button>
            </form>

            <ul style={{ listStyle: "none", margin: "1.25rem 0 0", padding: 0 }}>
              {subscriptions.map((sub) => (
                <li
                  key={sub.id}
                  style={{
                    borderTop: "1px solid var(--line)",
                    padding: "0.75rem 0",
                    display: "grid",
                    gap: "0.4rem",
                  }}
                >
                  <div style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.78rem", wordBreak: "break-all" }}>
                    {sub.url}
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>
                    {sub.source} · {sub.events.join(", ")} · {sub.active ? "active" : "paused"}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      style={{ ...buttonGhost, padding: "0.4rem 0.7rem" }}
                      onClick={() =>
                        run(async () => {
                          await updateSubscription(sub.id, { active: !sub.active });
                        }, sub.active ? "Subscription paused" : "Subscription resumed")
                      }
                    >
                      {sub.active ? "Pause" : "Resume"}
                    </button>
                    <button
                      type="button"
                      style={{ ...buttonGhost, padding: "0.4rem 0.7rem" }}
                      onClick={() =>
                        run(async () => {
                          await deleteSubscription(sub.id);
                        }, "Subscription removed")
                      }
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section style={panel}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", margin: "0 0 1rem" }}>
              Ingest test event
            </h2>
            <form onSubmit={onIngest} style={{ display: "grid", gap: "0.75rem" }}>
              <label style={{ display: "grid", gap: "0.35rem" }}>
                <span style={labelStyle}>Source</span>
                <input style={inputStyle} value={ingestSource} onChange={(e) => setIngestSource(e.target.value)} />
              </label>
              <label style={{ display: "grid", gap: "0.35rem" }}>
                <span style={labelStyle}>Event type</span>
                <input style={inputStyle} value={ingestType} onChange={(e) => setIngestType(e.target.value)} />
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
      )}

      {tab === "routes" && (
        <section style={panel}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", margin: "0 0 1rem" }}>
            Gateway routes ({routes.length})
          </h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {routes.map((route) => (
              <li
                key={route.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "6rem 1fr",
                  gap: "0.75rem",
                  padding: "0.7rem 0",
                  borderTop: "1px solid var(--line)",
                }}
              >
                <span style={{ color: "var(--accent)", fontFamily: "ui-monospace, monospace", fontSize: "0.72rem" }}>
                  {route.method}
                </span>
                <div>
                  <div style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.82rem" }}>{route.path}</div>
                  <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{route.description}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "ops" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
          }}
        >
          <section style={panel}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", margin: "0 0 1rem" }}>
              Metrics
            </h2>
            {metrics ? (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {Object.entries(metrics.counters).map(([key, value]) => (
                  <li
                    key={key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0.55rem 0",
                      borderTop: "1px solid var(--line)",
                      fontSize: "0.85rem",
                    }}
                  >
                    <span style={{ color: "var(--muted)" }}>{key}</span>
                    <span style={{ fontFamily: "ui-monospace, monospace" }}>{value}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: "var(--muted)", margin: 0 }}>No metrics loaded.</p>
            )}
          </section>

          <section style={panel}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", margin: "0 0 1rem" }}>
              Audit log
            </h2>
            {audit.length === 0 ? (
              <p style={{ color: "var(--muted)", margin: 0 }}>No requests recorded yet.</p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: 420, overflow: "auto" }}>
                {audit.map((entry, index) => (
                  <li
                    key={`${entry.requestId || entry.at}-${index}`}
                    style={{
                      padding: "0.55rem 0",
                      borderTop: "1px solid var(--line)",
                      fontSize: "0.8rem",
                      fontFamily: "ui-monospace, monospace",
                    }}
                  >
                    <span style={{ color: "var(--accent)" }}>{entry.method}</span> {entry.path}{" "}
                    <span style={{ color: entry.statusCode >= 400 ? "var(--danger)" : "var(--ok)" }}>
                      {entry.statusCode}
                    </span>{" "}
                    <span style={{ color: "var(--muted)" }}>{entry.durationMs}ms</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
