import { SiteNav } from "@/components/SiteNav";
import { SignalField } from "@/components/SignalField";
import { ConsoleDashboard } from "@/components/ConsoleDashboard";

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
        }}
      >
        <ConsoleDashboard />
      </main>
    </div>
  );
}
