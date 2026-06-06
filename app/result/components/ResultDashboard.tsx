"use client";
import { useState } from "react";
import type { ResultData, DashTab } from "@/lib/types";
import { calcSGPA, getDivision } from "@/app/result/grading";
import {
  pageShell, INK, RED, BG, WHITE, MUTED,
  BORDER, SHADOW_LG, SHADOW_SM, mono,
} from "@/app/result/tokens";
import { TabDashboard } from "./tabs/TabDashboard";
import { TabResults   } from "./tabs/TabResults";
import { TabProfile   } from "./tabs/TabProfile";
import { TabPassword  } from "./tabs/TabPassword";

interface Props {
  data:      ResultData;
  onLogout:  () => void;
  sessionId: string | null;
}

const NAV: { id: DashTab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard",      icon: "▦" },
  { id: "results",   label: "Results",         icon: "◈" },
  { id: "profile",   label: "Profile",         icon: "◉" },
  { id: "password",  label: "Change Password", icon: "◆" },
];

export function ResultsDashboard({ data, onLogout, sessionId }: Props) {
  const [activeTab, setActiveTab] = useState<DashTab>("dashboard");

  const semKeys  = Object.keys(data.semesters).sort(
    (a, b) => (parseInt(a.replace(/\D/g, "")) || 0) - (parseInt(b.replace(/\D/g, "")) || 0)
  );
  const allSubjects = semKeys.flatMap(k => data.semesters[k].subjects);
  const cgpa        = calcSGPA(allSubjects);
  const division    = getDivision(cgpa);

  const navBtnStyle = (active: boolean): React.CSSProperties => ({
    width: "100%", display: "flex", alignItems: "center", gap: 10,
    padding: "12px 16px", border: "none", cursor: "pointer",
    fontFamily: mono, fontSize: "11px", fontWeight: 800,
    textTransform: "uppercase", letterSpacing: "0.12em",
    background: active ? INK : "transparent",
    color: active ? BG : INK,
    borderLeft: active ? `4px solid ${RED}` : "4px solid transparent",
    transition: "background 0.1s",
  });

  const tabLabel = NAV.find(n => n.id === activeTab)?.label ?? "";

  return (
    <div style={pageShell}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 20px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }} className="dash-layout">

          {/* ── Sidebar ── */}
          <div style={{ width: 220, flexShrink: 0, background: WHITE, border: BORDER, boxShadow: SHADOW_LG, display: "flex", flexDirection: "column", position: "sticky", top: 24, alignSelf: "flex-start" }}>
            {/* Identity */}
            <div style={{ padding: "20px 16px 14px", borderBottom: BORDER }}>
              <div style={{ fontFamily: mono, fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: MUTED }}>CGPA MAXXER</div>
              <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.1, marginTop: 4 }}>{data.name?.split(" ")[0] ?? "Student"}</div>
              <div style={{ marginTop: 8, display: "inline-block", background: RED, color: WHITE, padding: "3px 10px", fontFamily: mono, fontSize: "22px", fontWeight: 900 }}>{cgpa}</div>
              <div style={{ fontFamily: mono, fontSize: "9px", fontWeight: 700, color: MUTED, marginTop: 2, textTransform: "uppercase" }}>CGPA · {division.label}</div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: "8px 0" }}>
              {NAV.map(n => (
                <button key={n.id} onClick={() => setActiveTab(n.id)} style={navBtnStyle(activeTab === n.id)}>
                  <span style={{ fontSize: 14 }}>{n.icon}</span>
                  {n.label}
                </button>
              ))}
            </nav>

            {/* Logout */}
            <div style={{ borderTop: BORDER, padding: 12 }}>
              <button
                onClick={onLogout}
                style={{ width: "100%", padding: "11px 16px", background: INK, color: BG, border: BORDER, cursor: "pointer", fontFamily: mono, fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", display: "flex", alignItems: "center", gap: 8, boxShadow: SHADOW_SM }}
                onMouseDown={e => { e.currentTarget.style.transform = "translate(3px,3px)"; e.currentTarget.style.boxShadow = "none"; }}
                onMouseUp={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = SHADOW_SM; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = SHADOW_SM; }}
              >
                ← SIGN OUT
              </button>
            </div>
          </div>

          {/* ── Main content ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: mono, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: MUTED, marginBottom: 18 }}>
              CGPA MAXXER · {tabLabel}
            </div>

            {activeTab === "dashboard" && <TabDashboard data={data} semKeys={semKeys} />}
            {activeTab === "results"   && <TabResults   data={data} semKeys={semKeys} />}
            {activeTab === "profile"   && <TabProfile   data={data} semKeys={semKeys} />}
            {activeTab === "password"  && <TabPassword sessionId={sessionId} />}

            <div style={{ textAlign: "center", padding: "20px 0", fontFamily: mono, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: MUTED }}>
              CGPA Maxxer · Grading as per IPU Ordinance 11 · Not affiliated with GGSIPU
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .dash-layout { flex-direction: column !important; }
          .dash-layout > div:first-child { width: 100% !important; position: static !important; }
        }
      `}</style>
    </div>
  );
}