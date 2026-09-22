export function SignalField() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "-20%",
          background: `
            radial-gradient(ellipse 70% 50% at 70% 20%, rgba(62, 240, 210, 0.16), transparent 55%),
            radial-gradient(ellipse 50% 40% at 15% 80%, rgba(26, 159, 140, 0.18), transparent 50%),
            linear-gradient(165deg, #0a1218 0%, #102028 45%, #0d1a22 100%)
          `,
          animation: "drift 28s linear infinite alternate",
        }}
      />
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0, opacity: 0.55 }}
      >
        <defs>
          <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="rgba(125, 220, 210, 0.12)"
              strokeWidth="1"
            />
          </pattern>
          <linearGradient id="beam" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(62,240,210,0)" />
            <stop offset="50%" stopColor="rgba(62,240,210,0.85)" />
            <stop offset="100%" stopColor="rgba(62,240,210,0)" />
          </linearGradient>
        </defs>
        <rect width="1440" height="900" fill="url(#grid)" />
        <path
          d="M80 720 C 320 520, 480 780, 720 480 S 1120 200, 1380 340"
          fill="none"
          stroke="url(#beam)"
          strokeWidth="2"
          style={{ animation: "pulse-line 4.5s ease-in-out infinite" }}
        />
        <path
          d="M40 280 C 260 360, 420 120, 680 260 S 1080 420, 1400 180"
          fill="none"
          stroke="rgba(62,240,210,0.28)"
          strokeWidth="1.5"
          style={{ animation: "pulse-line 6s ease-in-out infinite 0.8s" }}
        />
        <circle cx="720" cy="480" r="4" fill="#3ef0d2" />
        <circle cx="480" cy="620" r="3" fill="#3ef0d2" opacity="0.7" />
        <circle cx="1080" cy="300" r="3" fill="#3ef0d2" opacity="0.7" />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: "18%",
          background:
            "linear-gradient(180deg, transparent, rgba(62, 240, 210, 0.06), transparent)",
          animation: "scan 9s linear infinite",
          opacity: 0.4,
        }}
      />
    </div>
  );
}
