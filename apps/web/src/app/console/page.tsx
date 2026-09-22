import { SiteNav } from "@/components/SiteNav";
import { SignalField } from "@/components/SignalField";

const mockRoutes = [
  { method: "GET", path: "/health", label: "Liveness" },
  { method: "GET", path: "/api/v1/status", label: "Status" },
  { method: "GET", path: "/api/v1/routes", label: "Route catalog" },
  { method: "POST", path: "/api/v1/webhooks/ingest/:source", label: "Ingest" },
];

const mockEvents = [
  {
    id: "evt_8f2a",
    source: "shop",
    type: "order.created",
    status: "delivered",
    at: "2m ago",
  },
  {
    id: "evt_41bc",
    source: "billing",
    type: "invoice.paid",
    status: "partial",
    at: "11m ago",
  },
  {
    id: "evt_09de",
    source: "auth",
    type: "session.revoked",
    status: "stored",
    at: "34m ago",
  },
];

function statusColor(status: string) {
  if (status === "delivered") return "var(--ok)";
  if (status === "partial") return "var(--warn)";
  if (status === "failed") return "var(--danger)";
  return "var(--muted)";
}

export default function ConsolePage() {
  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <SignalField />
      <SiteNav active="console" />

      <main
        style={{
          position: "relative",
          zIndex: 1,
          padding: "2rem clamp(1.25rem, 4vw, 3rem) 4rem",
          display: "grid",
          gap: "2rem",
        }}
      >
        <header className="rise">
          <p
            style={{
              margin: 0,
              color: "var(--accent)",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontSize: "0.72rem",
              fontWeight: 600,
            }}
          >
            Console preview
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
          <p style={{ color: "var(--muted)", margin: "0.6rem 0 0", maxWidth: "36rem" }}>
            Visual shell for gateway health, route inventory, and webhook activity. Live
            API wiring lands in the next release.
          </p>
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
            { label: "Gateway", value: "ONLINE", tone: "var(--ok)" },
            { label: "Uptime", value: "99.98%", tone: "var(--fg)" },
            { label: "Routes", value: "8", tone: "var(--fg)" },
            { label: "Events (24h)", value: "1,284", tone: "var(--accent)" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "rgba(16, 32, 40, 0.88)",
                padding: "1.25rem 1.35rem",
              }}
            >
              <div
                style={{
                  color: "var(--muted)",
                  fontSize: "0.72rem",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                {stat.label}
              </div>
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
          <section
            className="rise rise-delay-2"
            style={{
              border: "1px solid var(--line)",
              background: "rgba(10, 18, 24, 0.72)",
              padding: "1.35rem 1.4rem",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.15rem",
                margin: "0 0 1rem",
              }}
            >
              Gateway routes
            </h2>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {mockRoutes.map((route) => (
                <li
                  key={route.path}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "4.5rem 1fr auto",
                    gap: "0.75rem",
                    alignItems: "center",
                    padding: "0.7rem 0",
                    borderTop: "1px solid var(--line)",
                    fontSize: "0.9rem",
                  }}
                >
                  <span
                    style={{
                      color: "var(--accent)",
                      fontFamily: "ui-monospace, monospace",
                      fontSize: "0.75rem",
                    }}
                  >
                    {route.method}
                  </span>
                  <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.8rem" }}>
                    {route.path}
                  </span>
                  <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                    {route.label}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="rise rise-delay-3"
            style={{
              border: "1px solid var(--line)",
              background: "rgba(10, 18, 24, 0.72)",
              padding: "1.35rem 1.4rem",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.15rem",
                margin: "0 0 1rem",
              }}
            >
              Recent webhook events
            </h2>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {mockEvents.map((event) => (
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
                    <div style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: 2 }}>
                      {event.source} · {event.id}
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
                    <div style={{ color: "var(--muted)", fontSize: "0.75rem" }}>{event.at}</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
