"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const INK    = "#0a0a0a";
const BG     = "#f4f1e8";
const RED    = "#ff3d00";
const YELLOW = "#ffd60a";
const LIME   = "#c6ff3d";
const BLUE   = "#3d5aff";
const WHITE  = "#ffffff";
const MUTED  = "#6b6b6b";
const mono   = "'JetBrains Mono', 'Fira Code', monospace";
const display = "'Space Grotesk', 'Arial Black', system-ui, sans-serif";

export default function HomePage() {
  const router = useRouter();
  const [hovered, setHovered] = useState<"chat" | "result" | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const cards = [
    {
      id:       "chat" as const,
      href:     "/chat",
      title:    "AI\nCHAT",
      sub:      "Ask anything about your syllabus, exams, grading, or IPU guidelines. Powered by Claude.",
      accent:   YELLOW,
      fg:       INK,
      tag:      "CHAT · AI POWERED",
      icon:     "◎",
      badges:   ["Syllabus Q&A", "Exam Prep", "IPU Guidelines", "Instant Answers"],
    },
    {
      id:       "result" as const,
      href:     "/result",
      title:    "RESULT\nPORTAL",
      sub:      "Fetch every semester's marks, auto-calculate your SGPA & CGPA per Ordinance 11, and view your full academic profile.",
      accent:   RED,
      fg:       WHITE,
      tag:      "RESULTS · IPU PORTAL",
      icon:     "◈",
      badges:   ["Auto CAPTCHA", "All Semesters", "SGPA · CGPA", "Profile"],
    },
  ];

  return (
    <div style={{
      minHeight: "100vh", width: "100%", background: BG, color: INK,
      fontFamily: display, position: "relative", overflowX: "hidden",
      backgroundImage: `linear-gradient(${INK} 1px, transparent 1px), linear-gradient(90deg, ${INK} 1px, transparent 1px)`,
      backgroundSize: "48px 48px", backgroundPosition: "-1px -1px",
    }}>

      {/* ── Decorative blobs — hidden on mobile to prevent overlap ── */}
      <div aria-hidden className="blob-left-top"    style={{ position: "fixed", left: -60,  top: "15%",   width: 200, height: 200, background: YELLOW, border: `4px solid ${INK}`, transform: "rotate(14deg)",  zIndex: 0, boxShadow: `8px 8px 0 0 ${INK}` }} />
      <div aria-hidden className="blob-right-top"   style={{ position: "fixed", right: -40, top: "8%",    width: 120, height: 120, background: BLUE,   border: `4px solid ${INK}`, transform: "rotate(-8deg)",  zIndex: 0, boxShadow: `8px 8px 0 0 ${INK}` }} />
      <div aria-hidden className="blob-right-bot"   style={{ position: "fixed", right: -60, bottom: "10%",width: 220, height: 220, background: LIME,   border: `4px solid ${INK}`, transform: "rotate(10deg)",  zIndex: 0, boxShadow: `8px 8px 0 0 ${INK}` }} />
      <div aria-hidden className="blob-bottom"      style={{ position: "fixed", left: "40%",bottom: -40,  width: 160, height: 160, background: RED,    border: `4px solid ${INK}`, transform: "rotate(-5deg)",  zIndex: 0, boxShadow: `8px 8px 0 0 ${INK}` }} />

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "40px 20px 100px", position: "relative", zIndex: 1 }}>

        {/* ── Header ── */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 48, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: mono, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.25em", color: MUTED, marginBottom: 8 }}>
              GGSIPU · Student Tools
            </div>
            <div style={{ fontSize: "clamp(22px, 5vw, 44px)", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.03em" }}>
              CGPA{" "}
              <span style={{ background: INK, color: BG, padding: "0 8px", display: "inline-block" }}>MAXXER</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            {["Ordinance 11", "IPU Portal", "AI Powered"].map(t => (
              <span key={t} style={{ border: `2px solid ${INK}`, background: WHITE, padding: "4px 8px", fontFamily: mono, fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>▸ {t}</span>
            ))}
          </div>
        </header>

        {/* ── Hero text ── */}
        <div style={{ marginBottom: 48, maxWidth: 700 }}>
          <h1 style={{ fontSize: "clamp(44px, 13vw, 120px)", fontWeight: 900, lineHeight: 0.85, textTransform: "uppercase", margin: 0, letterSpacing: "-0.04em" }}>
            YOUR<br />
            <span style={{ WebkitTextStroke: `3px ${INK}`, color: "transparent" }}>GRADES.</span><br />
            YOUR{" "}
            <span style={{ background: RED, color: WHITE, padding: "0 10px", display: "inline-block", transform: "rotate(-1deg)" }}>RULES.</span>
          </h1>
          <p style={{ marginTop: 24, fontFamily: mono, fontSize: "13px", lineHeight: 1.7, color: MUTED, fontWeight: 500, maxWidth: 480 }}>
            Two tools. One place. Check your results from the IPU portal or chat with AI about your academic queries — all without any tracking or data storage.
          </p>
        </div>

        {/* ── Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 40 }}>
          {cards.map(card => {
            const isHovered = hovered === card.id;
            return (
              <div
                key={card.id}
                onClick={() => router.push(card.href)}
                onMouseEnter={() => setHovered(card.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: WHITE, border: `4px solid ${INK}`, cursor: "pointer",
                  boxShadow: isHovered ? `12px 12px 0 0 ${INK}` : `6px 6px 0 0 ${INK}`,
                  transform: isHovered ? "translate(-4px,-4px)" : "none",
                  transition: "transform 0.12s ease, box-shadow 0.12s ease",
                  overflow: "hidden",
                }}
              >
                {/* Card accent bar */}
                <div style={{ background: card.accent, padding: "12px 18px", borderBottom: `4px solid ${INK}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: mono, fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: card.id === "result" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.5)" }}>{card.tag}</span>
                  <span style={{ fontFamily: mono, fontSize: "20px", fontWeight: 900, color: card.fg, opacity: 0.6 }}>{card.icon}</span>
                </div>

                <div style={{ padding: "24px 22px" }}>

                  {/* Title */}
                  <h2 style={{ fontSize: "clamp(36px, 10vw, 64px)", fontWeight: 900, lineHeight: 0.88, textTransform: "uppercase", letterSpacing: "-0.03em", margin: "0 0 16px 0", whiteSpace: "pre-line" }}>
                    {card.title}
                  </h2>

                  {/* Description */}
                  <p style={{ fontFamily: mono, fontSize: "12px", lineHeight: 1.7, color: MUTED, margin: "0 0 20px 0" }}>{card.sub}</p>

                  {/* Badges */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 24 }}>
                    {card.badges.map(b => (
                      <span key={b} style={{ background: card.accent, color: card.fg, border: `2px solid ${INK}`, padding: "3px 8px", fontFamily: mono, fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{b}</span>
                    ))}
                  </div>

                  {/* CTA */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 18, borderTop: `2px solid ${INK}` }}>
                    <span style={{ fontFamily: mono, fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em" }}>
                      {card.id === "chat" ? "Start Chatting" : "View Results"}
                    </span>
                    <div style={{ width: 38, height: 38, background: isHovered ? INK : card.accent, border: `3px solid ${INK}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 900, color: isHovered ? BG : card.fg, transition: "background 0.12s" }}>
                      →
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Stats bar ── */}
        <div style={{ background: INK, color: BG, border: `4px solid ${INK}`, padding: "16px 20px", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center", boxShadow: `6px 6px 0 0 ${MUTED}`, marginBottom: 28 }}>
          {[
            { label: "Grading System", value: "Ordinance 11" },
            { label: "University",     value: "GGSIPU" },
            { label: "Data Storage",   value: "Zero" },
            { label: "Auto CAPTCHA",   value: "Enabled" },
            { label: "AI Model",       value: "Claude" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: mono, fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: mono, fontSize: "13px", fontWeight: 900, color: YELLOW }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontFamily: mono, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: MUTED }}>
            Not affiliated with GGSIPU
          </span>
          <span style={{ fontFamily: mono, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: MUTED }}>
            Grading per Ordinance 11 · {new Date().getFullYear()}
          </span>
        </div>
      </div>

      {/* ── Marquee ── */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: INK, color: BG, borderTop: `4px solid ${INK}`, overflow: "hidden", padding: "10px 0", zIndex: 10 }}>
        <div style={{ display: "flex", gap: 48, whiteSpace: "nowrap", animation: "marquee 25s linear infinite", fontFamily: mono, fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} style={{ display: "flex", gap: 48, flexShrink: 0 }}>
              <span>★ CGPA MAXXER</span>
              <span>◎ AI CHAT</span>
              <span>◈ RESULT PORTAL</span>
              <span>▦ ORDINANCE 11</span>
              <span>◆ ZERO STORAGE</span>
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        /* ── Hide blobs on mobile so they don't overlap content ── */
        @media (max-width: 768px) {
          .blob-left-top,
          .blob-right-top,
          .blob-right-bot,
          .blob-bottom { display: none !important; }
        }

        /* ── Cards: single column on small screens ── */
        @media (max-width: 640px) {
          div[style*="minmax(300px"] {
            grid-template-columns: 1fr !important;
          }
        }

        /* ── Stats bar: 2-col grid on very small screens ── */
        @media (max-width: 480px) {
          div[style*="justify-content: space-between"][style*="rgba(255,255,255,0.45)"] {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}