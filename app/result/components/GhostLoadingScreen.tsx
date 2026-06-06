import { pageShell, INK, RED, YELLOW, LIME, BLUE, PINK, WHITE, MUTED, BORDER, SHADOW_LG, SHADOW_SM, mono } from "@/app/result/tokens";

// Solid muted skeleton block — no transparency
const SKEL = "#d4d0c8"; // warm grey that works on the BG
const SKEL_DARK = "#b8b4ac";

function Block({ w, h, color = SKEL, mb = 0, mt = 0 }: { w?: number | string; h: number; color?: string; mb?: number; mt?: number }) {
  return <div style={{ width: w ?? "100%", height: h, background: color, marginBottom: mb, marginTop: mt, flexShrink: 0 }} />;
}

export function GhostLoadingScreen() {
  return (
    <div style={pageShell}>
      <div className="ghost-root" style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 20px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

          {/* ── Skeleton Sidebar ── */}
          <div style={{ width: 220, flexShrink: 0, background: WHITE, border: BORDER, boxShadow: SHADOW_LG, display: "flex", flexDirection: "column" }}>
            {/* Identity block */}
            <div style={{ padding: "20px 16px 14px", borderBottom: BORDER }}>
              <Block w={80}  h={10} color={SKEL_DARK} mb={10} />
              <Block w={120} h={22} color={SKEL_DARK} mb={10} />
              <Block w={70}  h={36} color={RED} mb={6} />
              <Block w={100} h={10} color={SKEL} />
            </div>
            {/* Nav items */}
            <div style={{ padding: "8px 0" }}>
              {/* First nav item "active" — dark bg */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: INK, borderLeft: `4px solid ${RED}` }}>
                <Block w={14} h={14} color={WHITE} />
                <Block w={80} h={10} color={WHITE} />
              </div>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderLeft: "4px solid transparent" }}>
                  <Block w={14} h={14} color={SKEL} />
                  <Block w={[90, 60, 120][i]} h={10} color={SKEL} />
                </div>
              ))}
            </div>
            {/* Logout button */}
            <div style={{ borderTop: BORDER, padding: 12 }}>
              <Block h={40} color={SKEL_DARK} />
            </div>
          </div>

          {/* ── Skeleton Main Content ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Breadcrumb */}
            <Block w={180} h={10} color={SKEL} mb={18} />

            {/* Stats grid — 8 cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
              {([RED, YELLOW, BLUE, LIME, PINK, LIME, YELLOW, LIME] as string[]).map((color, i) => (
                <div key={i} style={{ background: color, border: BORDER, padding: 16, boxShadow: SHADOW_SM, height: 80 }}>
                  <Block w="60%"  h={10} color="rgba(0,0,0,0.18)" mb={8} />
                  <Block w="45%"  h={32} color="rgba(0,0,0,0.22)" />
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 24, marginBottom: 24 }}>
              {[0, 1].map(i => (
                <div key={i} style={{ background: WHITE, border: BORDER, boxShadow: SHADOW_LG, padding: 20, height: 300 }}>
                  <Block w={120} h={12} color={SKEL_DARK} mb={6} />
                  <Block w={160} h={10} color={SKEL}      mb={20} />
                  {/* Fake chart lines */}
                  <div style={{ height: 220, display: "flex", alignItems: "flex-end", gap: 8, paddingTop: 10 }}>
                    {[60, 80, 55, 90, 70, 85, 65, 95].map((h, j) => (
                      <div key={j} style={{ flex: 1, height: `${h}%`, background: SKEL, borderTop: `3px solid ${SKEL_DARK}` }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Result table skeleton */}
            <div style={{ background: WHITE, border: BORDER, boxShadow: SHADOW_LG, marginBottom: 24, overflow: "hidden" }}>
              {/* Table header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: INK, borderBottom: BORDER }}>
                <Block w={220} h={14} color="rgba(255,255,255,0.25)" />
                <div style={{ display: "flex", gap: 8 }}>
                  <Block w={70}  h={26} color="rgba(255,255,255,0.15)" />
                  <Block w={70}  h={26} color={RED} />
                  <Block w={90}  h={26} color={LIME} />
                </div>
              </div>
              {/* Column headers */}
              <div style={{ display: "grid", gridTemplateColumns: "40px 90px 1fr 70px 60px 60px 70px 70px", padding: "10px 18px", background: YELLOW, borderBottom: BORDER, gap: 8 }}>
                {[30, 60, 160, 50, 40, 40, 50, 55].map((w, i) => (
                  <Block key={i} w={w} h={10} color="rgba(0,0,0,0.25)" />
                ))}
              </div>
              {/* Rows */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "40px 90px 1fr 70px 60px 60px 70px 70px", padding: "12px 18px", background: i % 2 === 0 ? WHITE : "#f4f1e8", borderBottom: `1px solid ${INK}`, gap: 8, alignItems: "center" }}>
                  <Block w={20}  h={12} color={SKEL} />
                  <Block w={70}  h={12} color={SKEL} />
                  <Block w="80%" h={12} color={SKEL} />
                  <Block w={40}  h={20} color={BLUE} />
                  <Block w={35}  h={12} color={SKEL} />
                  <Block w={35}  h={12} color={SKEL} />
                  <Block w={40}  h={12} color={SKEL_DARK} />
                  <Block w={45}  h={22} color={LIME} />
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontFamily: mono, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: MUTED }}>
                Fetching your results...
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { opacity: 1; }
          50%  { opacity: 0.55; }
          100% { opacity: 1; }
        }
        .ghost-root { animation: shimmer 1.6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}