import React from "react";

export const BG     = "#f4f1e8";
export const INK    = "#0a0a0a";
export const RED    = "#ff3d00";
export const YELLOW = "#ffd60a";
export const LIME   = "#c6ff3d";
export const BLUE   = "#3d5aff";
export const PINK   = "#ff5cb4";
export const WHITE  = "#ffffff";
export const MUTED  = "#6b6b6b";

export const display = "'Space Grotesk', 'Arial Black', system-ui, sans-serif";
export const mono    = "'JetBrains Mono', 'Fira Code', monospace";

export const SHADOW    = `6px 6px 0 0 ${INK}`;
export const SHADOW_LG = `10px 10px 0 0 ${INK}`;
export const SHADOW_SM = `3px 3px 0 0 ${INK}`;
export const BORDER      = `4px solid ${INK}`;
export const BORDER_THIN = `2px solid ${INK}`;

export const GRADE_COLORS: Record<string, string> = {
  "O": LIME, "A+": PINK, "A": BLUE,
  "B+": YELLOW, "B": "#fb923c", "C": "#f87171",
  "P": "#cccccc", "F": RED, "-": MUTED,
};

export const pageShell: React.CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  background: BG,
  color: INK,
  fontFamily: display,
  position: "relative",
  overflowX: "hidden",
  backgroundImage: `linear-gradient(${INK} 1px, transparent 1px), linear-gradient(90deg, ${INK} 1px, transparent 1px)`,
  backgroundSize: "48px 48px",
  backgroundPosition: "-1px -1px",
};