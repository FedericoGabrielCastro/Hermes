import Link from "next/link";
import { SignalField } from "@/components/SignalField";
import { SiteNav } from "@/components/SiteNav";
import { getGatewayUrl } from "@/lib/gateway";

export default function HomePage() {
  const gatewayUrl = getGatewayUrl();
  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <SignalField />
      <SiteNav active="home" />

      <section
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "calc(100vh - 65px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "clamp(2rem, 8vh, 5rem) clamp(1.25rem, 5vw, 4rem)",
          maxWidth: "1100px",
        }}
      >
        <p
          className="rise"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(3.2rem, 12vw, 7.5rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 0.9,
            margin: 0,
            background: "linear-gradient(120deg, #e7f4f2 10%, #3ef0d2 55%, #8aa8a6 100%)",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          Hermes
        </p>

        <h1
          className="rise rise-delay-1"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.4rem, 3.4vw, 2.35rem)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            maxWidth: "18ch",
            margin: "1.4rem 0 0",
          }}
        >
          Route signals. Deliver webhooks. Stay in sync.
        </h1>

        <p
          className="rise rise-delay-2"
          style={{
            color: "var(--muted)",
            fontSize: "1.05rem",
            maxWidth: "36rem",
            margin: "1rem 0 0",
          }}
        >
          A modern API gateway and webhook console for event-driven systems — open the
          console instantly, no account required.
        </p>

        <div
          className="rise rise-delay-3"
          style={{ display: "flex", flexWrap: "wrap", gap: "0.85rem", marginTop: "2rem" }}
        >
          <Link
            href="/console"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.85rem 1.4rem",
              background: "var(--accent)",
              color: "#04120f",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontSize: "0.78rem",
              borderRadius: "var(--radius)",
            }}
          >
            Open console
          </Link>
          <a
            href={`${gatewayUrl}/api/v1/status`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.85rem 1.4rem",
              border: "1px solid var(--line)",
              color: "var(--fg)",
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontSize: "0.78rem",
              borderRadius: "var(--radius)",
              background: "rgba(16, 32, 40, 0.55)",
            }}
          >
            Gateway status
          </a>
        </div>
      </section>

      <section
        style={{
          position: "relative",
          zIndex: 1,
          borderTop: "1px solid var(--line)",
          padding: "4rem clamp(1.25rem, 5vw, 4rem)",
          background: "rgba(10, 18, 24, 0.72)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
            margin: "0 0 0.75rem",
            letterSpacing: "-0.02em",
          }}
        >
          Built for event traffic
        </h2>
        <p style={{ color: "var(--muted)", maxWidth: "38rem", margin: 0 }}>
          Hermes sits between producers and consumers: ingest webhooks, apply gateway
          middleware, and fan-out deliveries with request tracing — all from one console.
        </p>
      </section>
    </div>
  );
}
