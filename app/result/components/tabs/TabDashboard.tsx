import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { getCredits, getMaxMarks } from "@/lib/ipu-data";
import type { ResultData } from "@/lib/types";
import { getGrade, safeInt, calcSGPA, getDivision } from "@/app/result/grading";
import { TabResults } from "./TabResults";
import {
  INK, RED, YELLOW, LIME, BLUE, PINK, WHITE, MUTED,
  BORDER, BORDER_THIN, SHADOW_LG, SHADOW_SM, GRADE_COLORS, mono,
} from "@/app/result/tokens";

interface Props { data: ResultData; semKeys: string[] }

export function TabDashboard({ data, semKeys }: Props) {
  const allSems        = semKeys.map(k => data.semesters[k]);
  const allSubjects    = allSems.flatMap(s => s.subjects);
  const cgpa           = calcSGPA(allSubjects);
  const division       = getDivision(cgpa);
  const gradedSubjects = allSubjects.filter(s => getCredits(s.paper_code, s.subject_name) > 0);
  const marksArr       = gradedSubjects.map(s => safeInt(s.total_marks));
  const highest        = marksArr.length ? Math.max(...marksArr) : 0;
  const lowest         = marksArr.length ? Math.min(...marksArr) : 0;
  const average        = marksArr.length ? Math.round(marksArr.reduce((a, b) => a + b, 0) / marksArr.length) : 0;
  const backlog        = marksArr.filter(m => m < 40).length;
  const totalCredits   = allSubjects.reduce((sum, s) => sum + getCredits(s.paper_code, s.subject_name), 0);

  const journeyData = semKeys.map(key => {
    const sem = data.semesters[key];
    return {
      semester: `S${sem.label}`,
      sgpa: calcSGPA(sem.subjects),
      fullLabel: `Semester ${sem.label}`,
      sortNum: parseInt(key.replace(/\D/g, "")) || 0,
    };
  }).sort((a, b) => a.sortNum - b.sortNum);

  const gradeCount: Record<string, number> = {};
  gradedSubjects.forEach(sub => {
    const { grade } = getGrade(safeInt(sub.total_marks), getMaxMarks(sub.paper_code, sub.subject_name));
    gradeCount[grade] = (gradeCount[grade] || 0) + 1;
  });
  const gradeData = Object.entries(gradeCount).map(([grade, count]) => ({
    name: grade, value: count, color: GRADE_COLORS[grade] || "#888",
  })).sort((a, b) =>
    ["O", "A+", "A", "B+", "B", "C", "P", "F", "-"].indexOf(a.name) -
    ["O", "A+", "A", "B+", "B", "C", "P", "F", "-"].indexOf(b.name)
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: WHITE, border: `4px solid ${INK}`, padding: "8px 12px", boxShadow: SHADOW_SM, fontFamily: mono, fontSize: "11px" }}>
        <div style={{ fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>{payload[0].payload.fullLabel}</div>
        <div style={{ color: RED, fontWeight: 900 }}>SGPA: {payload[0].value}</div>
      </div>
    );
  };

  const stats = [
    { label: "CGPA",      value: cgpa,                  bg: RED,    fg: WHITE },
    { label: "Credits",   value: totalCredits,           bg: YELLOW, fg: INK  },
    { label: "Semesters", value: semKeys.length,         bg: BLUE,   fg: WHITE },
    { label: "Subjects",  value: gradedSubjects.length,  bg: LIME,   fg: INK  },
    { label: "Average",   value: average,                bg: PINK,   fg: INK  },
    { label: "Highest",   value: highest,                bg: LIME,   fg: INK  },
    { label: "Lowest",    value: lowest,                 bg: lowest < 40 ? RED : YELLOW, fg: INK },
    { label: "Backlog",   value: backlog,                bg: backlog > 0 ? RED : LIME, fg: backlog > 0 ? WHITE : INK },
  ];

  return (
    <div>
      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
        {stats.map(stat => (
          <div key={stat.label} style={{ background: stat.bg, border: `4px solid ${INK}`, padding: 16, boxShadow: SHADOW_SM, color: stat.fg }}>
            <div style={{ fontFamily: mono, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em" }}>{stat.label}</div>
            <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1, marginTop: 4 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 24, marginBottom: 24 }}>
        {/* GPA Journey */}
        <div style={{ background: WHITE, border: `4px solid ${INK}`, boxShadow: SHADOW_LG, padding: 20 }}>
          <div style={{ fontFamily: mono, fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 4 }}>GPA Journey</div>
          <div style={{ fontSize: "12px", color: MUTED, marginBottom: 16 }}>Semester-wise SGPA</div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={journeyData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid stroke={INK} strokeDasharray="3 3" strokeWidth={1} />
                <XAxis dataKey="semester" stroke={INK} tick={{ fontFamily: mono, fontSize: 10, fontWeight: 700 }} tickLine={{ stroke: INK, strokeWidth: 2 }} axisLine={{ stroke: INK, strokeWidth: 2 }} />
                <YAxis domain={[0, 10]} stroke={INK} tick={{ fontFamily: mono, fontSize: 10, fontWeight: 700 }} tickLine={{ stroke: INK, strokeWidth: 2 }} axisLine={{ stroke: INK, strokeWidth: 2 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="sgpa" stroke={RED} strokeWidth={3} dot={{ fill: WHITE, stroke: RED, strokeWidth: 3, r: 5 }} activeDot={{ r: 7, fill: RED }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade Spectrum */}
        <div style={{ background: WHITE, border: `4px solid ${INK}`, boxShadow: SHADOW_LG, padding: 20 }}>
          <div style={{ fontFamily: mono, fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 16 }}>Grade Spectrum</div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: "0 0 180px", position: "relative" }}>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={gradeData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={2} dataKey="value" stroke={INK} strokeWidth={2}>
                    {gradeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ textAlign: "center", fontFamily: mono, fontSize: "12px", fontWeight: 800, position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }}>
                <div style={{ fontSize: 22 }}>{gradedSubjects.length}</div>
                <div style={{ fontSize: 9, color: MUTED, textTransform: "uppercase" }}>Subjects</div>
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              {gradeData.map(g => (
                <div key={g.name} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: g.color, border: BORDER_THIN, boxShadow: SHADOW_SM }}>
                  <span style={{ fontFamily: mono, fontSize: "11px", fontWeight: 900 }}>Grade {g.name}</span>
                  <span style={{ fontFamily: mono, fontSize: "13px", fontWeight: 900 }}>{g.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Results table — mirrored from Results tab */}
      <div style={{ marginTop: 8 }}>
        <TabResults data={data} semKeys={semKeys} />
      </div>
    </div>
  );
}