"use client";
import { useState } from "react";
import type { CaptchaMode } from "@/lib/types";
import {
  pageShell, BG, INK, RED, YELLOW, LIME, BLUE, WHITE, MUTED,
  BORDER, BORDER_THIN, SHADOW, SHADOW_LG, SHADOW_SM, mono,
} from "@/app/result/tokens";
import { BackendBanner } from "./BackendBanner";

interface LoginFormProps {
  backendDown: boolean;
  error: string | null;
  onAutoSubmit: (e: string, p: string) => void;
  onManualOpen: (e: string, p: string) => void;
  onManualSubmit: (e: string, p: string, c: string) => void;
  onManualRefresh: () => void;
  captchaImage: string | null;
  loadingCaptcha: boolean;
  captchaError: string | null;
  loadingAuto: boolean;
  captchaMode: CaptchaMode;
  setCaptchaMode: (mode: CaptchaMode) => void;
  enrollment: string;
  setEnrollment: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
}

export function LoginForm({
  backendDown, error, onAutoSubmit, onManualOpen, onManualSubmit, onManualRefresh,
  captchaImage, loadingCaptcha, captchaError, loadingAuto, captchaMode, setCaptchaMode,
  enrollment, setEnrollment, password, setPassword,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [captchaInput, setCaptchaInput] = useState("");

  const isManual = captchaMode === "manual";
  const isLoading = loadingAuto || loadingCaptcha;
  const canSubmit = !!enrollment && !!password && !backendDown && !isLoading && (!isManual || captchaInput.trim());

  const handleAccordionClick = () => {
    if (isManual) {
      setCaptchaMode("auto");
      setCaptchaInput("");
    } else {
      setCaptchaMode("manual");
      if (!captchaImage && !loadingCaptcha && enrollment && password) {
        onManualOpen(enrollment, password);
      }
    }
  };

  const handleSignIn = () => {
    if (!canSubmit) return;
    if (isManual) onManualSubmit(enrollment, password, captchaInput);
    else onAutoSubmit(enrollment, password);
  };

  const captchaSrc = captchaImage
    ? (captchaImage.startsWith("data:") ? captchaImage : `data:image/png;base64,${captchaImage}`)
    : null;

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", background: WHITE,
    border: BORDER, color: INK, fontSize: "14px", fontFamily: mono,
    fontWeight: 600, outline: "none", boxSizing: "border-box",
    boxShadow: `4px 4px 0 0 ${INK}`, transition: "transform 0.1s",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: mono, fontSize: "10px", fontWeight: 800,
    textTransform: "uppercase", letterSpacing: "0.18em",
    marginBottom: "8px", display: "block",
  };

  return (
    <div style={pageShell}>
      <BackendBanner down={backendDown} />

      {/* ── Back to home nav ── */}
      <div style={{ position: "relative", zIndex: 10, background: INK, color: WHITE, borderBottom: `4px solid ${INK}`, padding: "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ fontFamily: mono, fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: WHITE, textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          ← CGPA MAXXER
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff3d00", border: "2px solid rgba(255,255,255,0.3)", display: "inline-block" }} />
          <span style={{ fontFamily: mono, fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em" }}>◈ RESULT PORTAL</span>
        </div>
      </div>

      <div aria-hidden style={{ position: "absolute", left: -40,  top: 120,    width: 140, height: 140, background: YELLOW, border: BORDER, boxShadow: SHADOW_LG, transform: "rotate(12deg)",  zIndex: 0 }} />
      <div aria-hidden style={{ position: "absolute", right: 40,  top: 80,     width: 90,  height: 90,  background: RED,    border: BORDER, boxShadow: SHADOW,    transform: "rotate(-6deg)", zIndex: 0 }} />
      <div aria-hidden style={{ position: "absolute", right: -30, bottom: 80,  width: 180, height: 180, background: BLUE,   border: BORDER, boxShadow: SHADOW_LG, transform: "rotate(8deg)",  zIndex: 0 }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 56, position: "relative", zIndex: 1 }} className="login-grid">
        {/* Hero */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <span style={{ alignSelf: "flex-start", background: YELLOW, border: BORDER, padding: "6px 12px", fontFamily: mono, fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", boxShadow: SHADOW_SM, marginBottom: 24 }}>
            IPU · Student Portal
          </span>
          <h1 style={{ fontSize: "clamp(56px, 9vw, 112px)", fontWeight: 900, lineHeight: 0.88, textTransform: "uppercase", margin: 0, letterSpacing: "-0.03em" }}>
            CGPA<br />
            <span style={{ display: "inline-block", background: RED, color: WHITE, padding: "0 14px", boxShadow: SHADOW_LG }}>MAXXER</span>
          </h1>
          <p style={{ marginTop: 28, maxWidth: 440, fontFamily: mono, fontSize: "14px", lineHeight: 1.6, color: MUTED, fontWeight: 500 }}>
            Sign in with your IPU credentials. We pull every semester, crunch your SGPA &amp; CGPA per Ordinance 11, and lay it all out — raw.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 28 }}>
            {["Auto Captcha", "All Semesters", "SGPA · CGPA", "Zero Storage"].map(t => (
              <span key={t} style={{ border: BORDER_THIN, background: WHITE, padding: "5px 10px", fontFamily: mono, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em" }}>▸ {t}</span>
            ))}
          </div>
        </div>

        {/* Form card */}
        <div style={{ position: "relative" }}>
          <div style={{ background: WHITE, border: BORDER, padding: "32px 28px", boxShadow: SHADOW_LG, position: "relative" }}>
            <div style={{ position: "absolute", top: -18, left: 24, background: INK, color: WHITE, border: BORDER_THIN, padding: "5px 12px", fontFamily: mono, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", transform: "rotate(-2deg)" }}>◆ Sign In</div>

            {error && (
              <div style={{ background: RED, color: WHITE, border: BORDER, padding: "10px 14px", fontFamily: mono, fontSize: "12px", fontWeight: 700, marginBottom: 18, boxShadow: SHADOW_SM }}>✗ {error}</div>
            )}

            <div style={{ background: YELLOW, border: BORDER_THIN, padding: "10px 12px", fontFamily: mono, fontSize: "11px", lineHeight: 1.5, marginBottom: 22, boxShadow: SHADOW_SM }}>
              <strong style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}>HINT →</strong>{" "}
              Default password is your Father's Name in CAPS —{" "}
              <span style={{ background: INK, color: WHITE, padding: "1px 6px" }}>MOHAN SINGH</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={labelStyle}>ENROLLMENT NUMBER</label>
                <input value={enrollment} onChange={e => setEnrollment(e.target.value)} placeholder="01217702725" style={inputStyle} disabled={isLoading} />
              </div>

              <div>
                <label style={labelStyle}>PASSWORD</label>
                <div style={{ position: "relative" }}>
                  <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="FATHER NAME IN CAPS" style={{ ...inputStyle, paddingRight: 64 }} disabled={isLoading} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={isLoading} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: YELLOW, border: BORDER_THIN, padding: "4px 8px", cursor: isLoading ? "not-allowed" : "pointer", fontFamily: mono, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", opacity: isLoading ? 0.5 : 1 }}>
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              {/* CAPTCHA accordion */}
              <div style={{ border: BORDER, background: WHITE, boxShadow: `4px 4px 0 0 ${INK}` }}>
                <button type="button" onClick={handleAccordionClick} disabled={isLoading} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "transparent", border: "none", cursor: isLoading ? "not-allowed" : "pointer", fontFamily: mono, fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: INK, opacity: isLoading ? 0.5 : 1 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ display: "inline-block", width: 12, height: 12, border: BORDER_THIN, background: isManual ? RED : LIME }} />
                    {isManual ? "MANUAL CAPTCHA" : "AUTO CAPTCHA"}
                  </span>
                  <span>{isManual ? "▴" : "▾"}</span>
                </button>

                {isManual && (
                  <div style={{ borderTop: BORDER, padding: 14, background: BG, display: "flex", flexDirection: "column", gap: 10 }}>
                    <label style={labelStyle}>SECURITY CODE</label>
                    <div style={{ height: 80, border: BORDER, background: WHITE, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {loadingCaptcha ? (
                        <div style={{ width: 24, height: 24, border: `3px solid ${INK}`, borderTopColor: RED, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      ) : captchaSrc ? (
                        <img src={captchaSrc} alt="captcha" style={{ maxHeight: "100%" }} />
                      ) : (
                        <span style={{ fontFamily: mono, fontSize: "10px", color: MUTED, textTransform: "uppercase", letterSpacing: "0.18em" }}>[ no image ]</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input value={captchaInput} onChange={e => setCaptchaInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleSignIn(); }} placeholder="Enter code" autoFocus disabled={isLoading} style={{ ...inputStyle, flex: 1, padding: "10px 12px" }} />
                      <button type="button" onClick={onManualRefresh} disabled={loadingCaptcha} style={{ background: YELLOW, border: BORDER, padding: "0 14px", fontFamily: mono, fontSize: "16px", fontWeight: 800, cursor: loadingCaptcha ? "not-allowed" : "pointer", boxShadow: SHADOW_SM, opacity: loadingCaptcha ? 0.5 : 1 }}>↻</button>
                    </div>
                    {captchaError && (
                      <div style={{ background: RED, color: WHITE, padding: "6px 10px", fontFamily: mono, fontSize: "11px", fontWeight: 700 }}>✗ {captchaError}</div>
                    )}
                  </div>
                )}
              </div>

              <button type="button" onClick={handleSignIn} disabled={!canSubmit}
                style={{ marginTop: 6, padding: "16px 24px", background: canSubmit ? RED : "#cccccc", color: WHITE, border: BORDER, cursor: canSubmit ? "pointer" : "not-allowed", fontFamily: mono, fontSize: "14px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.18em", boxShadow: canSubmit ? SHADOW : "none", transition: "transform 0.1s, box-shadow 0.1s", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
                onMouseDown={e => { if (!canSubmit) return; e.currentTarget.style.transform = "translate(4px,4px)"; e.currentTarget.style.boxShadow = `2px 2px 0 0 ${INK}`; }}
                onMouseUp={e => { if (!canSubmit) return; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = SHADOW; }}
                onMouseLeave={e => { if (!canSubmit) return; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = SHADOW; }}
              >
                {isLoading ? (
                  <>
                    <span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: WHITE, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    {loadingAuto ? "SOLVING CAPTCHA..." : "LOADING..."}
                  </>
                ) : backendDown ? "BACKEND OFFLINE" : "SIGN IN →"}
              </button>

              <div style={{ marginTop: 4, paddingTop: 12, borderTop: `2px dashed ${INK}`, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: mono, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: MUTED }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: backendDown ? RED : LIME, border: `1px solid ${INK}` }} />
                  {backendDown ? "OFFLINE" : "CONNECTED"}
                </span>
                <span>CREDENTIALS · NOT STORED</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Marquee */}
      <div style={{ background: INK, color: BG, borderTop: BORDER, borderBottom: BORDER, overflow: "hidden", padding: "12px 0", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", gap: 40, whiteSpace: "nowrap", animation: "marquee 30s linear infinite", fontFamily: mono, fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} style={{ display: "flex", gap: 40 }}>
              <span>★ CGPA MAXXER</span><span>● IPU ORDINANCE 11</span><span>▲ SGPA / CGPA</span><span>◆ ZERO STORAGE</span>
            </span>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px", textAlign: "center", position: "relative", zIndex: 1, fontFamily: mono, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: MUTED }}>
        Not affiliated with GGSIPU · Grading per Ordinance 11
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (max-width: 900px) { .login-grid { grid-template-columns: 1fr !important; gap: 32px !important; } }
      `}</style>
    </div>
  );
}