// ── Subject & Semester ────────────────────────────────────────────────────────
export type Subject = {
  semester:       string;
  paper_code:     string;
  subject_name:   string;
  internal_marks: string;
  external_marks: string;
  total_marks:    string;
  exam_date:      string | null;
};

export type SemesterData = {
  label:    string;
  subjects: Subject[];
  sgpa:     number | null;
  cgpa:     number | null;
};

// ── Student Profile ───────────────────────────────────────────────────────────
export type StudentProfile = {
  name?:           string;
  father_name?:    string;
  mother_name?:    string;
  enrollment?:     string;
  programme?:      string;
  institute?:      string;
  batch?:          string;
  email?:          string;
  mobile?:         string;
  gender?:         string;
  photo?:          string; // base64 PNG/JPEG
};

// ── Result payload from backend ───────────────────────────────────────────────
export type ResultData = {
  name:       string;
  enrollment: string;
  profile:    StudentProfile;
  semesters:  Record<string, SemesterData>;
};

// ── UI state ──────────────────────────────────────────────────────────────────
export type CaptchaMode = "auto" | "manual";
export type PageState   = "form" | "fetching" | "done";
export type DashTab     = "dashboard" | "results" | "profile" | "password";