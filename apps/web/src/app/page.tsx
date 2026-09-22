export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div>
        <p style={{ letterSpacing: "0.35em", textTransform: "uppercase", color: "#8b9bb8", fontSize: "0.75rem" }}>
          Hermes
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)", margin: "0.5rem 0 1rem" }}>
          Gateway console coming online
        </h1>
        <p style={{ color: "#8b9bb8", maxWidth: "32rem", margin: "0 auto" }}>
          Foundation scaffold for the Next.js console. Futuristic UI lands in a later pull request.
        </p>
      </div>
    </main>
  );
}
