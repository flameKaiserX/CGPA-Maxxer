import type { ResultData, StudentProfile } from "@/lib/types";
import { calcSGPA, getDivision } from "@/app/result/grading";
import { getCredits } from "@/lib/ipu-data";
import {
  BG, INK, RED, YELLOW, LIME, WHITE, MUTED,
  BORDER, BORDER_THIN, SHADOW, SHADOW_LG, SHADOW_SM, mono,
} from "@/app/result/tokens";

interface Props { data: ResultData; semKeys: string[] }

function Field({ label, value, accent }: { label: string; value?: string; accent?: string }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${INK}` }}>
      <span style={{ fontFamily: mono, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: MUTED }}>{label}</span>
      <span style={{
        fontFamily: mono, fontSize: "13px", fontWeight: 900,
        background: accent ?? "transparent",
        color: accent ? (accent === YELLOW || accent === LIME ? INK : WHITE) : INK,
        padding: accent ? "2px 10px" : "0",
        border: accent ? BORDER_THIN : "none",
        maxWidth: "60%", textAlign: "right", wordBreak: "break-word",
      }}>
        {value}
      </span>
    </div>
  );
}

export function TabProfile({ data, semKeys }: Props) {
  const p            = data.profile ?? {} as StudentProfile;
  const allSubjects  = semKeys.flatMap(k => data.semesters[k].subjects);
  const cgpa         = calcSGPA(allSubjects);
  const division     = getDivision(cgpa);
  const totalCredits = allSubjects.reduce((sum, s) => sum + getCredits(s.paper_code, s.subject_name), 0);

  const name       = p.name       || data.name       || "—";
  const enrollment = p.enrollment || data.enrollment || "—";
  const photoSrc   = p.photo
    ? (p.photo.startsWith("data:") ? p.photo : `data:image/jpeg;base64,${p.photo}`)
    : null;

  const labelMap: Record<string, string> = {
    photo:        "Photo",
    email:        "Email",
    mobile:       "Mobile",
    father_name:  "Father's Name",
    mother_name:  "Mother's Name",
    programme:    "Programme",
    institute:    "Institute",
    gender:       "Gender",
    batch:        "Batch / Year",
  };

  const unavailable = (["photo", "email", "mobile", "father_name", "mother_name", "programme", "institute", "gender", "batch"] as (keyof StudentProfile)[])
    .filter(k => !p[k])
    .map(k => labelMap[k] ?? k);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>

      {/* ── Identity card ── */}
      <div style={{ background: WHITE, border: `4px solid ${INK}`, boxShadow: SHADOW_LG, padding: 28 }}>
        <div style={{ fontFamily: mono, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: MUTED, marginBottom: 20 }}>◉ Identity</div>

        {/* Photo or initial */}
        <div style={{ width: 90, height: 110, background: BG, border: `4px solid ${INK}`, boxShadow: SHADOW, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, overflow: "hidden" }}>
          {photoSrc
            ? <img src={photoSrc} alt="Student photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: 36, fontWeight: 900, color: MUTED }}>{name[0]?.toUpperCase() ?? "?"}</span>
          }
        </div>

        <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.1, marginBottom: 4 }}>{name}</div>
        {p.father_name && <div style={{ fontFamily: mono, fontSize: "11px", color: MUTED, marginBottom: 4 }}>S/O · D/O {p.father_name}</div>}
        <div style={{ fontFamily: mono, fontSize: "12px", fontWeight: 700, color: MUTED, marginBottom: 16 }}>{enrollment}</div>

        <div style={{ display: "inline-block", background: division.color, border: `4px solid ${INK}`, padding: "5px 12px", fontFamily: mono, fontSize: "11px", fontWeight: 800, textTransform: "uppercase", boxShadow: SHADOW_SM }}>
          {division.label}
        </div>
      </div>

      {/* ── Academic + personal details ── */}
      <div style={{ background: WHITE, border: `4px solid ${INK}`, boxShadow: SHADOW_LG, padding: 28 }}>
        <div style={{ fontFamily: mono, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: MUTED, marginBottom: 20 }}>▦ Details</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Field label="Enrollment No."   value={enrollment}          accent="#3d5aff" />
          <Field label="Programme"        value={p.programme} />
          <Field label="Institute"        value={p.institute} />
          <Field label="Batch / Year"     value={p.batch} />
          <Field label="Gender"           value={p.gender} />
          <Field label="Email"            value={p.email} />
          <Field label="Mobile"           value={p.mobile} />
          <Field label="Father's Name"    value={p.father_name} />
          <Field label="Mother's Name"    value={p.mother_name} />
          {/* Computed stats always shown */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${INK}` }}>
            <span style={{ fontFamily: mono, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: MUTED }}>Semesters Done</span>
            <span style={{ fontFamily: mono, fontSize: "13px", fontWeight: 900 }}>{semKeys.length}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${INK}` }}>
            <span style={{ fontFamily: mono, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: MUTED }}>Total Credits</span>
            <span style={{ fontFamily: mono, fontSize: "13px", fontWeight: 900 }}>{totalCredits}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}>
            <span style={{ fontFamily: mono, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: MUTED }}>CGPA</span>
            <span style={{ fontFamily: mono, fontSize: "13px", fontWeight: 900, background: RED, color: WHITE, padding: "2px 10px", border: BORDER_THIN }}>{cgpa}</span>
          </div>
        </div>
      </div>

      {/* ── Not available card (only if some fields are missing) ── */}
      {unavailable.length > 0 && (
        <div style={{ background: BG, border: `4px dashed ${INK}`, padding: 28 }}>
          <div style={{ fontFamily: mono, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: MUTED, marginBottom: 16 }}>◌ Not Retrieved</div>
          <div style={{ fontFamily: mono, fontSize: "11px", color: MUTED, lineHeight: 1.7, marginBottom: 16 }}>
            These fields could not be found on the portal profile page. The portal may not expose them, or the page structure may differ.
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {unavailable.map(f => (
              <span key={f} style={{ border: BORDER_THIN, padding: "4px 10px", fontFamily: mono, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: MUTED, letterSpacing: "0.12em" }}>{f}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}