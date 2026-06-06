import Link from "next/link";

const INK    = "#0a0a0a";
const BG     = "#f4f1e8";
const RED    = "#ff3d00";
const YELLOW = "#ffd60a";
const BLUE   = "#3d5aff";
const WHITE  = "#ffffff";
const MUTED  = "#6b6b6b";
const mono   = "'JetBrains Mono', 'Fira Code', monospace";
const display = "'Space Grotesk', 'Arial Black', system-ui, sans-serif";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh", width: "100%", background: BG, color: INK,
      fontFamily: display, position: "relative", overflowX: "hidden",
      backgroundImage: `linear-gradient(${INK} 1px, transparent 1px), linear-gradient(90deg, ${INK} 1px, transparent 1px)`,
      backgroundSize: "48px 48px", backgroundPosition: "-1px -1px",
    }}>

      {/* Decorative blobs */}
      <div aria-hidden className="blob-left" style={{ position: "fixed", left: -80, top: "20%", width: 240, height: 240, background: RED, border: `4px solid ${INK}`, transform: "rotate(12deg)", zIndex: 0, boxShadow: `8px 8px 0 0 ${INK}` }} />
      <div aria-hidden className="blob-right" style={{ position: "fixed", right: -60, top: "15%", width: 180, height: 180, background: BLUE, border: `4px solid ${INK}`, transform: "rotate(-10deg)", zIndex: 0, boxShadow: `8px 8px 0 0 ${INK}` }} />
      <div aria-hidden className="blob-bottom" style={{ position: "fixed", left: "30%", bottom: -60, width: 200, height: 200, background: YELLOW, border: `4px solid ${INK}`, transform: "rotate(8deg)", zIndex: 0, boxShadow: `8px 8px 0 0 ${INK}` }} />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "60px 20px", position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>

        {/* Error Code */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: mono, fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.25em", color: MUTED, marginBottom: 16 }}>
            Error 404 · Page Not Found
          </div>
          <h1 style={{ 
            fontSize: "clamp(80px, 20vw, 200px)", 
            fontWeight: 900, 
            lineHeight: 0.85, 
            margin: 0, 
            letterSpacing: "-0.04em",
            textTransform: "uppercase",
            color: "transparent",
            WebkitTextStroke: `4px ${INK}`,
            position: "relative",
          }}>
            404
            <span style={{
              position: "absolute",
              top: "10%",
              right: "5%",
              fontSize: "clamp(20px, 5vw, 40px)",
              WebkitTextStroke: "none",
              color: RED,
              background: WHITE,
              border: `3px solid ${INK}`,
              padding: "4px 12px",
              transform: "rotate(12deg)",
              fontFamily: mono,
            }}>
              NOT FOUND
            </span>
          </h1>
        </div>

        {/* Message */}
        <div style={{ maxWidth: 600, marginBottom: 48 }}>
          <p style={{ 
            fontFamily: mono, 
            fontSize: "clamp(16px, 3vw, 20px)", 
            lineHeight: 1.6, 
            fontWeight: 600,
            color: MUTED,
            marginBottom: 24,
          }}>
            The page you're looking for has vanished into the digital void. 
            It might have been moved, deleted, or never existed in the first place.
          </p>
          
          <div style={{ 
            background: WHITE, 
            border: `4px solid ${INK}`, 
            padding: "20px 24px",
            boxShadow: `8px 8px 0 0 ${INK}`,
            marginBottom: 32,
          }}>
            <div style={{ fontFamily: mono, fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: MUTED, marginBottom: 16 }}>
              SUGGESTED ACTIONS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Link 
                href="/"
                className="action-btn"
                style={{
                  background: YELLOW,
                  border: `3px solid ${INK}`,
                  padding: "14px 20px",
                  fontFamily: mono,
                  fontSize: "13px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  textDecoration: "none",
                  color: INK,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  boxShadow: `4px 4px 0 0 ${INK}`,
                }}
              >
                <span>→ Return to Homepage</span>
                <span style={{ opacity: 0.6 }}>HOME</span>
              </Link>
              
              <Link 
                href="/"
                className="action-btn"
                style={{
                  background: WHITE,
                  border: `3px solid ${INK}`,
                  padding: "14px 20px",
                  fontFamily: mono,
                  fontSize: "13px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  textDecoration: "none",
                  color: INK,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  boxShadow: `4px 4px 0 0 ${INK}`,
                }}
              >
                <span>← Go Back</span>
                <span style={{ opacity: 0.6 }}>BACK</span>
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {[
              { label: "AI CHAT", href: "/chat", color: YELLOW },
              { label: "RESULTS", href: "/result", color: RED },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="quick-link-btn"
                style={{
                  background: link.color,
                  border: `3px solid ${INK}`,
                  padding: "10px 16px",
                  fontFamily: mono,
                  fontSize: "10px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  textDecoration: "none",
                  color: INK,
                  boxShadow: `4px 4px 0 0 ${INK}`,
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: "auto", 
          paddingTop: 40, 
          borderTop: `3px solid ${INK}`,
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          flexWrap: "wrap", 
          gap: 16 
        }}>
          <span style={{ fontFamily: mono, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: MUTED }}>
            GGSIPU Student Tools
          </span>
          <span style={{ fontFamily: mono, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: MUTED }}>
            Ordinance 11 Compliant
          </span>
        </div>
      </div>

      <style>{`
        /* Hover effects for buttons since this is a Server Component */
        .action-btn, .quick-link-btn {
          transition: transform 0.12s ease, box-shadow 0.12s ease;
        }
        .action-btn:hover, .quick-link-btn:hover {
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0 0 ${INK} !important;
        }

        @media (max-width: 768px) {
          .blob-left, .blob-right, .blob-bottom { display: none !important; }
        }
      `}</style>
    </div>
  );
}