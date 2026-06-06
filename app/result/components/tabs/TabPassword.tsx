"use client";
import { useState, useMemo } from "react";
import {
  INK, RED, YELLOW, LIME, WHITE, MUTED,
  BORDER, BORDER_THIN, SHADOW, SHADOW_LG, SHADOW_SM, mono,
} from "@/app/result/tokens";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

// ── Password criteria per IPU portal ─────────────────────────────────────────
const CRITERIA = [
  { key: "upper",   label: "At least 1 uppercase letter (A-Z)",       test: (p: string) => /[A-Z]/.test(p) },
  { key: "lower",   label: "At least 1 lowercase letter (a-z)",       test: (p: string) => /[a-z]/.test(p) },
  { key: "digit",   label: "At least 1 numeric character (0-9)",      test: (p: string) => /[0-9]/.test(p) },
  { key: "special", label: "At least 1 special character (!@#$%^&*)", test: (p: string) => /[!@#$%^&*]/.test(p) },
  { key: "length",  label: "Minimum 8 characters",                    test: (p: string) => p.length >= 8 },
];

interface Props { sessionId: string | null }

export function TabPassword({ sessionId }: Props) {
  const [pwCurrent,   setPwCurrent]   = useState("");
  const [pwNew,       setPwNew]       = useState("");
  const [pwConfirm,   setPwConfirm]   = useState("");
  const [pwMsg,       setPwMsg]       = useState<{ ok: boolean; text: string } | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched,     setTouched]     = useState(false);

  const checks   = useMemo(() => CRITERIA.map(c => ({ ...c, passed: c.test(pwNew) })), [pwNew]);
  const allPass  = checks.every(c => c.passed);
  const matches  = pwNew === pwConfirm && pwConfirm.length > 0;
  const canSubmit = !!pwCurrent && allPass && matches && !loading && !!sessionId;

  const handleSubmit = async () => {
    setPwMsg(null);
    if (!sessionId)  { setPwMsg({ ok: false, text: "Session expired. Please log in again." }); return; }
    if (!pwCurrent)  { setPwMsg({ ok: false, text: "Enter your current password." }); return; }
    if (!allPass)    { setPwMsg({ ok: false, text: "New password doesn't meet all criteria." }); return; }
    if (!matches)    { setPwMsg({ ok: false, text: "Passwords don't match." }); return; }

    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/result/change-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          session_id:       sessionId,
          current_password: pwCurrent,
          new_password:     pwNew,
        }),
      });
      const data = await res.json();

      if (data.status === "success") {
        setPwMsg({ ok: true, text: data.message ?? "Password changed successfully." });
        setPwCurrent(""); setPwNew(""); setPwConfirm(""); setTouched(false);
      } else {
        setPwMsg({ ok: false, text: data.error ?? "Password change failed. Try again." });
      }
    } catch {
      setPwMsg({ ok: false, text: "Could not connect to server." });
    } finally {
      setLoading(false);
    }
  };

  const inputSt: React.CSSProperties = {
    width: "100%", padding: "12px 14px", background: WHITE,
    border: `4px solid ${INK}`, color: INK, fontSize: "14px", fontFamily: mono,
    fontWeight: 600, outline: "none", boxSizing: "border-box",
    boxShadow: `4px 4px 0 0 ${INK}`,
  };
  const labelSt: React.CSSProperties = {
    fontFamily: mono, fontSize: "10px", fontWeight: 800,
    textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 8, display: "block",
  };
  const showBtn = (show: boolean, toggle: () => void) => (
    <button type="button" onClick={toggle} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: YELLOW, border: BORDER_THIN, padding: "4px 8px", cursor: "pointer", fontFamily: mono, fontSize: "10px", fontWeight: 800, textTransform: "uppercase" }}>
      {show ? "HIDE" : "SHOW"}
    </button>
  );

  const passedCount = checks.filter(c => c.passed).length;
  const strengthColor = passedCount === 5 ? LIME : passedCount >= 3 ? YELLOW : RED;
  const strengthLabel = passedCount === 5 ? "Strong" : passedCount >= 3 ? "Medium" : "Weak";

  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ background: WHITE, border: `4px solid ${INK}`, boxShadow: SHADOW_LG, padding: 28 }}>
        <div style={{ fontFamily: mono, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: MUTED, marginBottom: 24 }}>◆ Change Password</div>

        {/* Session warning */}
        {!sessionId && (
          <div style={{ background: YELLOW, border: BORDER_THIN, padding: "10px 14px", fontFamily: mono, fontSize: "11px", fontWeight: 700, marginBottom: 20 }}>
            ⚠ No active session — log out and sign in again to change your password.
          </div>
        )}

        {pwMsg && (
          <div style={{ background: pwMsg.ok ? LIME : RED, color: pwMsg.ok ? INK : WHITE, border: `4px solid ${INK}`, padding: "10px 14px", fontFamily: mono, fontSize: "12px", fontWeight: 700, marginBottom: 20, boxShadow: SHADOW_SM }}>
            {pwMsg.ok ? "✓" : "✗"} {pwMsg.text}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Current password */}
          <div>
            <label style={labelSt}>Current Password</label>
            <div style={{ position: "relative" }}>
              <input type={showCurrent ? "text" : "password"} value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} disabled={loading} style={{ ...inputSt, paddingRight: 72 }} />
              {showBtn(showCurrent, () => setShowCurrent(!showCurrent))}
            </div>
          </div>

          {/* New password + live criteria */}
          <div>
            <label style={labelSt}>New Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showNew ? "text" : "password"}
                value={pwNew}
                onChange={e => { setPwNew(e.target.value); setTouched(true); }}
                disabled={loading}
                style={{ ...inputSt, paddingRight: 72, borderColor: touched && !allPass ? RED : INK }}
              />
              {showBtn(showNew, () => setShowNew(!showNew))}
            </div>

            {touched && (
              <div style={{ marginTop: 10, border: `2px solid ${INK}`, background: "#f9f7f0", padding: "12px 14px" }}>
                <div style={{ fontFamily: mono, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 10 }}>Password Criteria</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {checks.map(c => (
                    <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 18, height: 18, flexShrink: 0, background: c.passed ? LIME : RED, border: `2px solid ${INK}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: mono, fontSize: "11px", fontWeight: 900, color: c.passed ? INK : WHITE }}>
                        {c.passed ? "✓" : "✗"}
                      </div>
                      <span style={{ fontFamily: mono, fontSize: "11px", fontWeight: c.passed ? 700 : 500, color: c.passed ? INK : MUTED }}>{c.label}</span>
                    </div>
                  ))}
                </div>
                {/* Strength bar */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ height: 6, background: "#ddd", border: `1px solid ${INK}` }}>
                    <div style={{ height: "100%", width: `${(passedCount / 5) * 100}%`, background: strengthColor, transition: "width 0.3s ease" }} />
                  </div>
                  <div style={{ fontFamily: mono, fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginTop: 4, color: MUTED }}>{strengthLabel}</div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label style={labelSt}>Confirm New Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirm ? "text" : "password"}
                value={pwConfirm}
                onChange={e => setPwConfirm(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
                disabled={loading}
                style={{ ...inputSt, paddingRight: 72, borderColor: pwConfirm.length > 0 && !matches ? RED : INK }}
              />
              {showBtn(showConfirm, () => setShowConfirm(!showConfirm))}
            </div>
            {pwConfirm.length > 0 && (
              <div style={{ fontFamily: mono, fontSize: "10px", fontWeight: 700, marginTop: 6, color: matches ? "#2d7a2d" : RED }}>
                {matches ? "✓ Passwords match" : "✗ Passwords don't match"}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="button" onClick={handleSubmit} disabled={!canSubmit}
            style={{ marginTop: 4, padding: "14px 24px", background: canSubmit ? RED : "#ccc", color: WHITE, border: `4px solid ${INK}`, cursor: canSubmit ? "pointer" : "not-allowed", fontFamily: mono, fontSize: "13px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.18em", boxShadow: canSubmit ? SHADOW : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
            onMouseDown={e => { if (!canSubmit) return; e.currentTarget.style.transform = "translate(4px,4px)"; e.currentTarget.style.boxShadow = `2px 2px 0 0 ${INK}`; }}
            onMouseUp={e => { if (!canSubmit) return; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = SHADOW; }}
            onMouseLeave={e => { if (!canSubmit) return; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = SHADOW; }}
          >
            {loading
              ? <><span style={{ width: 16, height: 16, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: WHITE, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> UPDATING...</>
              : "UPDATE PASSWORD →"
            }
          </button>
        </div>

        {/* Warning note */}
        <div style={{ marginTop: 20, padding: "12px 14px", background: YELLOW, border: BORDER_THIN, fontFamily: mono, fontSize: "11px", lineHeight: 1.6 }}>
          <strong style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}>⚠ NOTE →</strong>{" "}
          After 3 consecutive failed attempts, your account will be locked and session automatically logged out.
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}