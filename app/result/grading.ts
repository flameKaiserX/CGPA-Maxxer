import { getCredits, getMaxMarks } from "@/lib/ipu-data";
import type { Subject } from "@/lib/types";
import { LIME, YELLOW, RED } from "@/app/result/tokens";

// ── Grade thresholds per Ordinance 11, Clause 11.5 ───────────────────────────
export function getGrade(total: number, max: number): { grade: string; points: number } {
  if (max === 0) return { grade: "-", points: 0 };
  const p = (total / max) * 100;
  if (p >= 90) return { grade: "O",  points: 10 };
  if (p >= 75) return { grade: "A+", points: 9  };
  if (p >= 65) return { grade: "A",  points: 8  };
  if (p >= 55) return { grade: "B+", points: 7  };
  if (p >= 50) return { grade: "B",  points: 6  };
  if (p >= 45) return { grade: "C",  points: 5  };
  if (p >= 40) return { grade: "P",  points: 4  };
  return { grade: "F", points: 0 }; // < 40 or absent
}

// ── Safe integer parse (handles "-", null, undefined) ────────────────────────
export function safeInt(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "number" ? v : parseInt(v, 10);
  return isNaN(n) ? 0 : n;
}

// ── SGPA/CGPA per Ordinance 11, Clause 13 ────────────────────────────────────
// Formula: ∑(Ci × Gi) / ∑Ci
// Audit courses (credits = 0) excluded per Clause 13.4
// Rounded to 2 decimal places per Clause 13.1 / 13.2
export function calcSGPA(subjects: Subject[]): number {
  let pts = 0, creds = 0;
  subjects.forEach(s => {
    const c   = getCredits(s.paper_code, s.subject_name);
    const max = getMaxMarks(s.paper_code, s.subject_name);
    if (c > 0) {
      pts   += getGrade(safeInt(s.total_marks), max).points * c;
      creds += c;
    }
  });
  // Math.round avoids floating-point drift vs toFixed
  return creds > 0 ? Math.round((pts / creds) * 100) / 100 : 0;
}


export function getDivision(cgpa: number) {
  if (cgpa >= 6.5) return { label: "First Division",  color: LIME };
  if (cgpa >= 5.0) return { label: "Second Division", color: YELLOW };
  if (cgpa >= 4.0) return { label: "Third Division",  color: "#fb923c" };
  return              { label: "Fail",              color: RED };
}