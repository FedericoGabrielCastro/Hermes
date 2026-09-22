"use client";

import { useEffect, useState } from "react";
import { getGatewayUrl } from "@/lib/gateway";
import { SiteNav } from "@/components/SiteNav";
import { SignalField } from "@/components/SignalField";

export default function DocsPage() {
  const [spec, setSpec] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const gatewayUrl = getGatewayUrl();

  useEffect(() => {
    fetch(`${gatewayUrl}/api/v1/openapi.json`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Gateway responded with ${res.status}`);
        return res.json();
      })
      .then(setSpec)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load OpenAPI"),
      );
  }, [gatewayUrl]);

  const paths =
    spec && typeof spec === "object" && "paths" in spec
      ? (spec.paths as Record<string, Record<string, { summary?: string }>>)
      : null;

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <SignalField />
      <SiteNav active="docs" />
      <main
        style={{
          position: "relative",
          zIndex: 1,
          padding: "2rem clamp(1.25rem, 4vw, 3rem) 4rem",
          maxWidth: 960,
        }}
      >
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
          API reference
        </p>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            margin: "0.4rem 0 0.75rem",
            letterSpacing: "-0.03em",
          }}
        >
          Hermes OpenAPI
        </h1>
        <p style={{ color: "var(--muted)", margin: "0 0 1.5rem" }}>
          Live specification from{" "}
          <code style={{ color: "var(--accent)" }}>
            {gatewayUrl}/api/v1/openapi.json
          </code>
        </p>

        {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

        {paths && (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {Object.entries(paths).map(([path, methods]) =>
              Object.entries(methods).map(([method, details]) => (
                <li
                  key={`${method}-${path}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "5rem 1fr",
                    gap: "0.85rem",
                    padding: "0.85rem 0",
                    borderTop: "1px solid var(--line)",
                  }}
                >
                  <span
                    style={{
                      color: "var(--accent)",
                      fontFamily: "ui-monospace, monospace",
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                    }}
                  >
                    {method}
                  </span>
                  <div>
                    <div
                      style={{
                        fontFamily: "ui-monospace, monospace",
                        fontSize: "0.9rem",
                      }}
                    >
                      {path}
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                      {details.summary || "—"}
                    </div>
                  </div>
                </li>
              )),
            )}
          </ul>
        )}
      </main>
    </div>
  );
}
