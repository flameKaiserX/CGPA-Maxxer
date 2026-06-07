import base64
import json
import logging
import re
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

from backend.config import EXAMWEB_BASE_URL

logger = logging.getLogger("backend.result_scraper")

# ── Confirmed endpoints (verified via DevTools) ───────────────────────────────
_RESULT_SERVLET  = "/web/StudentSearchProcess"
_PROFILE_URL     = "/web/student/profile.jsp"
_HOME_URL        = "/web/student/studenthome.jsp"

# flag=2 + searchMode=2 is what stdata.js sends — always try this first.
# Fallbacks cover portal upgrades or config changes.
_PRIMARY_FLAG    = "2"
_FALLBACK_FLAGS  = ["getInternalMarks", "getResult", "internalMarks",
                    "result", "semResult", "getSemResult", "getMarks",
                    "studentResult", "1", "3"]

_AJAX_HEADERS = {
    "X-Requested-With": "XMLHttpRequest",
    "Accept": "application/json, text/html, */*; q=0.01",
}


# ── Low-level helpers ─────────────────────────────────────────────────────────

def _resolve_url(base: str, path: str) -> str:
    return urljoin(base, path) if path else base


def _get(session: dict, path: str, params: dict | None = None) -> httpx.Response | None:
    url = f"{EXAMWEB_BASE_URL}{path}"
    headers = {"Referer": session.get("last_url", url), **_AJAX_HEADERS}
    try:
        resp = session["client"].get(url, params=params or {}, headers=headers)
        if resp.status_code == 200 and resp.text.strip():
            logger.debug("GET %s %s → 200 (%d bytes)", path, params or "", len(resp.text))
            return resp
        logger.debug("GET %s %s → %d", path, params or "", resp.status_code)
    except Exception as exc:
        logger.warning("GET %s failed: %s", path, exc)
    return None


def _extract_float(text: str, pattern: str) -> float | None:
    m = re.search(pattern, text, re.I)
    return float(m.group(1)) if m else None


# ── Form parsing (for home page semester select) ──────────────────────────────

def _find_result_select(form: BeautifulSoup) -> BeautifulSoup | None:
    for s in form.find_all("select"):
        attrs = " ".join(filter(None, [s.get("id", ""), s.get("name", "")])).lower()
        if re.search(r"\b(euno|semester|sem|exam|result|term|batch)\b", attrs):
            return s
    selects = form.find_all("select")
    return selects[0] if len(selects) == 1 else None


def _extract_options(soup: BeautifulSoup) -> tuple[list[tuple[str, str]], str]:
    """Returns (options, searchMode) from the home page form."""
    for form in soup.find_all("form"):
        sel = _find_result_select(form)
        if not sel:
            continue
        options = [
            (opt.get("value", "").strip(), opt.get_text(strip=True))
            for opt in sel.find_all("option")
            if opt.get("value", "").strip()
        ]
        if options:
            sm_inp = form.find("input", {"name": "searchMode"})
            searchmode = sm_inp.get("value", "") if sm_inp else ""
            return options, searchmode
    return [], ""


# ── Result JSON parsing ───────────────────────────────────────────────────────

def _parse_stresult(text: str) -> list[dict]:
    """
    Parse the confirmed GGSIPU JSON format:
    {"stresult": [[sem, code, name, int, ext, total, status, examDate, declaredDate], ...],
     "header":   [...],
     "stprofile": {...}}
    """
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return []

    if not isinstance(data, dict):
        return []

    rows = data.get("stresult", [])
    if not rows or not isinstance(rows, list):
        return []

    subjects = []
    for row in rows:
        if not isinstance(row, (list, tuple)) or len(row) < 3:
            continue
        get = lambda i: str(row[i]).strip() if i < len(row) else ""
        subjects.append({
            "semester":       get(0),
            "paper_code":     get(1),
            "subject_name":   get(2),
            "internal_marks": get(3),
            "external_marks": get(4),
            "total_marks":    get(5),
            # index 6 = status code, index 7 = exam month/year
            "exam_date":      get(7) or None,
        })
    return subjects


def _extract_stprofile(data: dict) -> dict:
    """Pull profile fields from the stprofile block in the result JSON."""
    sp = data.get("stprofile", {})
    if not sp:
        return {}
    profile = {}
    mapping = {
        "enrollment": ["nrollno"],
        "name":       ["stname"],
        "batch":      ["byoa", "yoa"],
        "programme":  ["prgname"],
        "institute":  ["iname"],
    }
    for field, keys in mapping.items():
        for k in keys:
            if sp.get(k):
                profile[field] = str(sp[k]).strip()
                break
    return profile


# ── Profile JSON parsing (profile.jsp embeds full JSON as page text) ──────────

def _parse_profile_page(text: str, primary: dict) -> dict:
    """
    profile.jsp injects the student record as a raw JSON array string in the page body:
    [{"nrollno":"...","stname":"...","gender":"F","email":"...","mobno":"...",
      "father":"...","mother":"...","stimage":"<b64jpeg>","prgname":"...",...}]
    Scan lines for this pattern and parse it directly.
    """
    profile: dict = dict(primary)

    soup = BeautifulSoup(text, "html.parser")
    page_text = soup.get_text("\n", strip=True)

    for line in page_text.splitlines():
        line = line.strip()
        if not (line.startswith("[{") and ("\"nrollno\"" in line or "\"stname\"" in line)):
            continue
        try:
            data = json.loads(line)
            if not (isinstance(data, list) and data):
                continue
            sp = data[0]
            field_map = {
                "enrollment":  ["nrollno"],
                "name":        ["stname"],
                "gender":      ["gender"],
                "email":       ["email"],
                "mobile":      ["mobno", "mobile"],
                "father_name": ["father", "fathername"],
                "mother_name": ["mother", "mothername"],
                "batch":       ["byoa", "yoa", "batch"],
                "programme":   ["prgname", "programme"],
                "institute":   ["iname", "institute"],
            }
            for field, keys in field_map.items():
                if field not in profile:
                    for k in keys:
                        if sp.get(k):
                            profile[field] = str(sp[k]).strip()
                            break

            if "photo" not in profile and sp.get("stimage"):
                profile["photo"] = sp["stimage"].replace("\\n", "").replace("\n", "")

            logger.info("Profile parsed from embedded JSON: %s", list(profile.keys()))
            return profile

        except (json.JSONDecodeError, KeyError, IndexError) as exc:
            logger.warning("Profile embedded JSON parse error: %s", exc)

    # Fallback: use whatever primary already has
    logger.warning("Could not find embedded JSON in profile.jsp — returning primary only")
    return profile


# ── Public API ────────────────────────────────────────────────────────────────

def scrape_results(session: dict) -> dict:
    if not session or "client" not in session:
        return {"error": "Invalid session"}

    # ── Step 1: fetch home page to get semester options ───────────────────────
    home_resp = session["client"].get(f"{EXAMWEB_BASE_URL}{_HOME_URL}")
    home_resp.raise_for_status()
    session["last_url"] = str(home_resp.url)

    soup = BeautifulSoup(home_resp.text, "html.parser")
    options, searchmode = _extract_options(soup)
    if not options:
        return {"error": "No semester options found on home page"}

    logger.info("Semesters: %s  searchMode=%r", [l for _, l in options], searchmode)

    # ── Step 2: fetch each semester via StudentSearchProcess ──────────────────
    all_semesters: dict = {}
    inline_profile: dict = {}

    # Use the confirmed flag first; only iterate fallbacks if that fails
    primary_flag = searchmode if searchmode else _PRIMARY_FLAG

    for value, label in options:
        logger.info("Fetching semester %r …", label)

        resp = _get(session, _RESULT_SERVLET, {"flag": primary_flag, "euno": value})

        # If primary flag fails, try fallbacks (portal change / config drift)
        if resp is None:
            logger.info("Primary flag %r failed — trying fallbacks", primary_flag)
            for flag in _FALLBACK_FLAGS:
                if flag == primary_flag:
                    continue
                resp = _get(session, _RESULT_SERVLET, {"flag": flag, "euno": value})
                if resp is not None:
                    logger.info("Fallback flag %r worked for semester %r", flag, label)
                    break

        if resp is None:
            logger.warning("All flags failed for semester %r", label)
            continue

        session["last_url"] = str(resp.url)

        # Parse subjects
        subjects = _parse_stresult(resp.text)
        if subjects:
            logger.info("Semester %r: %d subjects parsed", label, len(subjects))
        else:
            logger.warning("Semester %r: no subjects in response (len=%d)", label, len(resp.text))

        # Extract profile stub from stprofile block (free, same response)
        if not inline_profile:
            try:
                jdata = json.loads(resp.text)
                inline_profile = _extract_stprofile(jdata)
                sgpa = _extract_float(str(jdata), r"sgpa[:\s\"]+([0-9.]+)")
                cgpa = _extract_float(str(jdata), r"cgpa[:\s\"]+([0-9.]+)")
            except Exception:
                sgpa = cgpa = None
        else:
            try:
                jdata = json.loads(resp.text)
                sgpa = _extract_float(str(jdata), r"sgpa[:\s\"]+([0-9.]+)")
                cgpa = _extract_float(str(jdata), r"cgpa[:\s\"]+([0-9.]+)")
            except Exception:
                sgpa = cgpa = None

        all_semesters[f"sem_{label}"] = {
            "label":    label,
            "subjects": subjects,
            "sgpa":     sgpa,
            "cgpa":     cgpa,
        }

    # ── Step 3: fetch full profile (email, mobile, mother, photo) ────────────
    profile = scrape_profile(session, primary=inline_profile)

    return {
        "name":       profile.get("name"),
        "enrollment": profile.get("enrollment"),
        "profile":    profile,
        "semesters":  all_semesters,
    }


def scrape_profile(session: dict, primary: dict | None = None) -> dict:
    if not session or "client" not in session:
        return primary or {}

    try:
        resp = session["client"].get(f"{EXAMWEB_BASE_URL}{_PROFILE_URL}")
        resp.raise_for_status()
        session["last_url"] = str(resp.url)
        session["last_html"] = resp.text
    except Exception as exc:
        logger.warning("Could not fetch profile page: %s", exc)
        return primary or {}

    return _parse_profile_page(resp.text, primary or {})