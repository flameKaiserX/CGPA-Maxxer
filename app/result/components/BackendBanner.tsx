import { RED, WHITE, BORDER, mono } from "@/app/result/tokens";

export function BackendBanner({ down }: { down: boolean }) {
  if (!down) return null;
  return (
    <div style={{
      background: RED, color: WHITE, padding: "10px 18px",
      borderBottom: BORDER, fontFamily: mono, fontSize: "12px",
      fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em",
      display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap",
    }}>
      <span>⚠ Backend Offline</span>
      <code style={{ background: "#0a0a0a", padding: "3px 8px", fontSize: "11px" }}>
        uvicorn backend.main:app --reload --port 8000
      </code>
    </div>
  );
}