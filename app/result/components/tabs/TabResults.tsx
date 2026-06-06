import { useState } from "react";
import { getCredits, getMaxMarks } from "@/lib/ipu-data";
import type { ResultData } from "@/lib/types";
import { getGrade, safeInt, calcSGPA, getDivision } from "@/app/result/grading";
import {
  BG, INK, RED, YELLOW, BLUE, WHITE, MUTED,
  BORDER, BORDER_THIN, SHADOW_LG, SHADOW_SM, GRADE_COLORS, mono,
} from "@/app/result/tokens";

interface Props { data: ResultData; semKeys: string[] }

export function TabResults({ data, semKeys }: Props) {
  const [activeSem, setActiveSem] = useState("all");
  const displaySems = activeSem === "all"
    ? semKeys.map(k => data.semesters[k])
    : [data.semesters[activeSem]].filter(Boolean);

  return (
    <div>
      {/* Semester filter */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {["all", ...semKeys].map(k => {
          const active = activeSem === k;
          return (
            <button key={k} onClick={() => setActiveSem(k)} style={{ padding: "10px 16px", fontFamily: mono, fontSize: "11px", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", background: active ? INK : WHITE, color: active ? BG : INK, border: `4px solid ${INK}`, boxShadow: active ? "none" : SHADOW_SM, transform: active ? "translate(3px,3px)" : "none" }}>
              {k === "all" ? "All Sems" : `Sem ${data.semesters[k].label}`}
            </button>
          );
        })}
      </div>

      {displaySems.map(sem => {
        const semSubjects = sem.subjects.filter(s => getCredits(s.paper_code, s.subject_name) > 0);
        const semSGPA     = calcSGPA(sem.subjects);
        const semDiv      = getDivision(semSGPA);
        const semTotal    = semSubjects.reduce((s, sub) => s + safeInt(sub.total_marks), 0);
        const semCredits  = sem.subjects.reduce((sum, s) => sum + getCredits(s.paper_code, s.subject_name), 0);

        return (
          <div key={sem.label} style={{ background: WHITE, border: `4px solid ${INK}`, boxShadow: SHADOW_LG, marginBottom: 24, overflow: "hidden" }}>
            {/* Semester header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: INK, color: BG, borderBottom: `4px solid ${INK}`, flexWrap: "wrap", gap: 12 }}>
              <div style={{ fontFamily: mono, fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em" }}>
                Semester {sem.label} — {semSubjects.length} Subjects · {semCredits} Credits
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { label: "Total", value: semTotal,      bg: WHITE,        fg: INK },
                  { label: "SGPA",  value: semSGPA,       bg: RED,          fg: WHITE },
                  { label: "Div",   value: semDiv.label,  bg: semDiv.color, fg: INK },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, color: s.fg, border: BORDER_THIN, padding: "4px 10px", fontFamily: mono, fontSize: "11px", fontWeight: 800 }}>
                    <span style={{ opacity: 0.7, marginRight: 6 }}>{s.label}</span>{s.value}
                  </div>
                ))}
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: mono, fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: YELLOW, borderBottom: `4px solid ${INK}` }}>
                    {["#", "Code", "Subject", "Credits", "Int", "Ext", "Total", "Grade"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 800, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", borderRight: BORDER_THIN }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sem.subjects.map((sub, i) => {
                    const credits = getCredits(sub.paper_code, sub.subject_name);
                    const { grade } = getGrade(safeInt(sub.total_marks), getMaxMarks(sub.paper_code, sub.subject_name));
                    const gc      = GRADE_COLORS[grade] || "#888";
                    const isAudit = credits === 0;
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? WHITE : "#f4f1e8", borderBottom: `1px solid ${INK}`, opacity: isAudit ? 0.6 : 1 }}>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: MUTED }}>{i + 1}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 700 }}>{sub.paper_code}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                          {sub.subject_name}
                          {isAudit && <span style={{ fontSize: "9px", color: MUTED, marginLeft: 8 }}>AUDIT</span>}
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 800 }}>
                          <span style={{ background: isAudit ? MUTED : BLUE, color: WHITE, border: BORDER_THIN, padding: "2px 8px", fontSize: "11px" }}>{credits}</span>
                        </td>
                        <td style={{ padding: "10px 12px" }}>{sub.internal_marks}</td>
                        <td style={{ padding: "10px 12px" }}>{sub.external_marks}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 800 }}>{sub.total_marks}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ background: gc, color: INK, border: BORDER_THIN, padding: "2px 8px", fontWeight: 900, fontSize: "12px" }}>{grade}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}