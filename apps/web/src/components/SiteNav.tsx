import Link from "next/link";

export function SiteNav({ active = "home" }: { active?: "home" | "console" }) {
  return (
    <header
      style={{
        position: "relative",
        zIndex: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1.25rem clamp(1.25rem, 4vw, 3rem)",
        borderBottom: "1px solid var(--line)",
        backdropFilter: "blur(10px)",
        background: "rgba(10, 18, 24, 0.55)",
      }}
    >
      <Link
        href="/"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          letterSpacing: "0.28em",
          fontSize: "0.85rem",
          textTransform: "uppercase",
        }}
      >
        Hermes
      </Link>
      <nav style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
        <Link
          href="/"
          style={{
            color: active === "home" ? "var(--accent)" : "var(--muted)",
            fontSize: "0.9rem",
          }}
        >
          Home
        </Link>
        <Link
          href="/console"
          style={{
            color: active === "console" ? "var(--accent)" : "var(--muted)",
            fontSize: "0.9rem",
          }}
        >
          Console
        </Link>
      </nav>
    </header>
  );
}
