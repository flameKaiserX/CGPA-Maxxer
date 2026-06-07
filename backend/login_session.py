import base64
import io
import re
import threading
import time
import uuid
from datetime import datetime, timedelta
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup
from PIL import Image, ImageFilter
from pytesseract import TesseractNotFoundError
import pytesseract

from backend.config import (
    EXAMWEB_BASE_URL,
    LOGIN_URL,
    MAX_AUTO_RETRIES,
    SESSION_CLEANUP_INTERVAL_SECONDS,
    SESSION_TTL_MINUTES,
    TESSERACT_CMD,
)
from backend.logger import logger


USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)
DEFAULT_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}
DEFAULT_TIMEOUT = httpx.Timeout(20.0, connect=10.0)


if TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD


_sessions: dict[str, dict] = {}
_lock = threading.Lock()
_cleanup_thread_started = False


def _make_client() -> httpx.Client:
    return httpx.Client(
        headers=DEFAULT_HEADERS,
        follow_redirects=True,
        timeout=DEFAULT_TIMEOUT,
    )


def _resolve_url(base: str, path: str) -> str:
    if not path:
        return base
    return urljoin(base, path)


def _parse_form(form: BeautifulSoup, base_url: str) -> tuple[str, str, dict]:
    action = _resolve_url(base_url, form.get("action", ""))
    method = (form.get("method", "post") or "post").strip().lower()
    payload: dict[str, str] = {}

    for inp in form.find_all("input"):
        name = inp.get("name")
        if not name:
            continue
        input_type = (inp.get("type") or "text").strip().lower()
        if input_type in ("submit", "button", "image", "reset"):
            continue
        if input_type == "checkbox":
            if inp.has_attr("checked"):
                payload[name] = inp.get("value", "on")
            continue
        payload[name] = inp.get("value", "")

    submit_button = form.find(["button", "input"], {"type": "submit"})
    if submit_button and submit_button.has_attr("name"):
        payload[submit_button["name"]] = submit_button.get("value", "")

    return action, method, payload


def _find_login_form(html: str, base_url: str) -> BeautifulSoup:
    soup = BeautifulSoup(html, "html.parser")
    forms = soup.find_all("form")
    if not forms:
        raise ValueError("Login form not found")

    for form in forms:
        if form.find("input", {"type": "password"}):
            return form
    return forms[0]


def _normalize_input_text(value: str | None) -> str:
    return (value or "").strip().lower()


def _hash_password(password: str, captcha: str) -> str:
    import hashlib
    raw = (password + captcha).encode("utf-8")
    digest = hashlib.sha256(raw).digest()
    return base64.b64encode(digest).decode("utf-8")


def _find_input_names(form: BeautifulSoup) -> tuple[str | None, str | None, str | None]:
    enrollment_name = None
    password_name = None
    captcha_name = None

    enroll_keywords = ["eno", "enrollment", "roll", "student", "registration", "uname", "username"]
    captcha_keywords = ["captcha", "securitycode", "security_code", "security", "code"]
    password_keywords = ["password", "pwd", "pass"]

    label_map: dict[str, str] = {}
    for label in form.find_all("label"):
        if label.has_attr("for"):
            label_map[label["for"]] = _normalize_input_text(label.get_text(strip=True))

    for inp in form.find_all("input"):
        name = inp.get("name")
        if not name:
            continue
        input_type = _normalize_input_text(inp.get("type"))
        attrs = " ".join(filter(None, [
            name,
            inp.get("id", ""),
            inp.get("placeholder", ""),
            inp.get("aria-label", ""),
            label_map.get(inp.get("id", ""), ""),
        ])).lower()

        if input_type == "password" and password_name is None:
            password_name = name
        if any(keyword in attrs for keyword in captcha_keywords) and captcha_name is None:
            captcha_name = name
        if any(keyword in attrs for keyword in enroll_keywords) and enrollment_name is None:
            enrollment_name = name

        if input_type in ("text", "email", "tel"):
            if enrollment_name is None:
                enrollment_name = name

    if not password_name:
        for inp in form.find_all("input"):
            name = inp.get("name")
            if not name:
                continue
            attrs = " ".join(filter(None, [name, inp.get("id", ""), inp.get("placeholder", "")])).lower()
            if any(keyword in attrs for keyword in password_keywords):
                password_name = name
                break

    return enrollment_name, password_name, captcha_name


def _find_captcha_image_url(html: str, base_url: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    matcher = re.compile(r"captcha|securitycode|security_code", re.I)
    image = soup.find("img", {"src": matcher})
    if not image:
        image = soup.find("img", src=matcher)
    if not image or not image.get("src"):
        raise ValueError("CAPTCHA image not found")

    src = image["src"].strip()
    if src.startswith("data:"):
        return src
    return _resolve_url(base_url, src)


def _image_to_base64(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode("utf-8")


def _preprocess_captcha(image_bytes: bytes) -> bytes:
    img = Image.open(io.BytesIO(image_bytes)).convert("L")
    img = img.point(lambda x: 0 if x < 140 else 255, "1")
    img = img.convert("L")
    img = img.resize((img.width * 2, img.height * 2), Image.LANCZOS)
    img = img.filter(ImageFilter.SHARPEN)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()


def _get_page(session: dict, url: str) -> httpx.Response:
    response = session["client"].get(url)
    response.raise_for_status()
    session["last_url"] = str(response.url)
    session["last_html"] = response.text
    return response


def _get_captcha_base64(session: dict, html: str) -> str:
    captcha_url = _find_captcha_image_url(html, session.get("last_url", LOGIN_URL))
    if captcha_url.startswith("data:"):
        return captcha_url.split(",", 1)[1]
    response = session["client"].get(captcha_url)
    response.raise_for_status()
    return _image_to_base64(response.content)


def _solve_captcha_auto(session: dict, html: str) -> str:
    captcha_url = _find_captcha_image_url(html, session.get("last_url", LOGIN_URL))
    if captcha_url.startswith("data:"):
        raw_bytes = base64.b64decode(captcha_url.split(",", 1)[1])
    else:
        response = session["client"].get(captcha_url)
        response.raise_for_status()
        raw_bytes = response.content

    processed = _preprocess_captcha(raw_bytes)
    img = Image.open(io.BytesIO(processed))
    text = pytesseract.image_to_string(
        img,
        config="--psm 8 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    ).strip().replace(" ", "")
    logger.info("Tesseract read CAPTCHA as: %s", text)
    return text


def _submit_login(session: dict, html: str, enrollment: str, password: str, captcha: str) -> httpx.Response:
    form = _find_login_form(html, session.get("last_url", LOGIN_URL))
    action, method, payload = _parse_form(form, session.get("last_url", LOGIN_URL))
    enrollment_name, password_name, captcha_name = _find_input_names(form)

    if not enrollment_name or not password_name:
        raise ValueError("Could not identify login form fields")

    payload[enrollment_name] = enrollment
    if captcha_name and captcha:
        payload[password_name] = _hash_password(password, captcha)
    else:
        payload[password_name] = password
    if captcha_name:
        payload[captcha_name] = captcha

    headers = {"Referer": session.get("last_url", LOGIN_URL)}
    if method == "post":
        response = session["client"].post(action, data=payload, headers=headers)
    else:
        response = session["client"].get(action, params=payload, headers=headers)

    response.raise_for_status()
    session["last_url"] = str(response.url)
    session["last_html"] = response.text
    return response


def _is_login_successful(response: httpx.Response) -> bool:
    html = response.text.lower()
    url = str(response.url).lower()
    if any(keyword in html for keyword in ["invalid", "incorrect", "wrong", "please try again", "enter the correct"]):
        return False
    if ("/web/login.jsp" in url or "login.jsp" in url or "/login" in url) and "studenthome" not in url:
        return False
    if any(keyword in html for keyword in ["student home", "logout", "welcome", "euno", "cgpa", "results"]):
        return True
    return "login" not in url


def _extract_error_message(html: str) -> str | None:
    soup = BeautifulSoup(html, "html.parser")
    selectors = [".error", ".alert", "span[style*='red']", "font[color]", "p.error", "div.error"]
    for selector in selectors:
        element = soup.select_one(selector)
        if element and element.get_text(strip=True):
            return element.get_text(strip=True)

    content = soup.select_one("#content") or soup
    if content:
        heading = content.find(["h1", "h2", "h3"])
        if heading and heading.get_text(strip=True):
            return heading.get_text(strip=True)
        paragraph = content.find(["p", "div"])
        if paragraph and paragraph.get_text(strip=True):
            return paragraph.get_text(strip=True)
    return None


def _cleanup_expired() -> None:
    cutoff = datetime.utcnow() - timedelta(minutes=SESSION_TTL_MINUTES)
    with _lock:
        expired = [sid for sid, s in _sessions.items() if s["created_at"] < cutoff]
        for sid in expired:
            session = _sessions.pop(sid, None)
            if session:
                try:
                    session["client"].close()
                except Exception:
                    pass
                logger.info("Cleaned up expired session: %s", sid)


def _cleanup_worker() -> None:
    while True:
        time.sleep(SESSION_CLEANUP_INTERVAL_SECONDS)
        _cleanup_expired()


def start_cleanup_thread() -> None:
    global _cleanup_thread_started
    if _cleanup_thread_started:
        return
    thread = threading.Thread(target=_cleanup_worker, daemon=True)
    thread.start()
    _cleanup_thread_started = True
    logger.info("Started session cleanup worker")


def start_session() -> tuple[str, None, None]:
    _cleanup_expired()
    session_id = str(uuid.uuid4())
    session = {
        "client": _make_client(),
        "created_at": datetime.utcnow(),
        "status": "pending",
        "last_url": "",
        "last_html": "",
    }
    with _lock:
        _sessions[session_id] = session
    logger.info("Session %s started", session_id[:8])
    return session_id, None, None


def start_session_manual(enrollment: str, password: str) -> dict:
    _cleanup_expired()
    session_id = str(uuid.uuid4())
    session = {
        "client": _make_client(),
        "created_at": datetime.utcnow(),
        "status": "captcha_required",
        "last_url": "",
        "last_html": "",
    }
    with _lock:
        _sessions[session_id] = session

    try:
        response = _get_page(session, LOGIN_URL)
        captcha_b64 = _get_captcha_base64(session, response.text)
        return {
            "status": "captcha_required",
            "session_id": session_id,
            "captcha_image": captcha_b64,
        }
    except Exception as exc:
        session["client"].close()
        with _lock:
            _sessions.pop(session_id, None)
        logger.exception("Failed to start manual session")
        return {"error": f"Failed to load CAPTCHA: {exc}"}


def try_auto_login(session_id: str, enrollment: str, password: str) -> dict:
    with _lock:
        session = _sessions.get(session_id)
    if not session:
        return {"error": "Session not found"}

    for attempt in range(1, MAX_AUTO_RETRIES + 1):
        logger.info("Auto login attempt %d/%d for session %s", attempt, MAX_AUTO_RETRIES, session_id[:8])
        try:
            response = _get_page(session, LOGIN_URL)
            captcha = _solve_captcha_auto(session, response.text)
            response = _submit_login(session, response.text, enrollment, password, captcha)
            if _is_login_successful(response):
                with _lock:
                    session["status"] = "logged_in"
                logger.info("Auto login succeeded for session %s", session_id[:8])
                return {"status": "logged_in", "session_id": session_id}
            logger.warning("Auto login failed on attempt %d for session %s", attempt, session_id[:8])
        except TesseractNotFoundError:
            logger.warning("Tesseract not available; switching to manual CAPTCHA")
            break
        except Exception as exc:
            logger.exception("Auto login attempt %d failed", attempt)

    try:
        response = _get_page(session, LOGIN_URL)
        captcha_b64 = _get_captcha_base64(session, response.text)
        with _lock:
            session["status"] = "captcha_required"
        return {
            "status": "captcha_required",
            "session_id": session_id,
            "captcha_image": captcha_b64,
        }
    except Exception as exc:
        logger.exception("Failed to load CAPTCHA after auto login failure")
        return {"error": f"Failed to load CAPTCHA: {exc}"}


def refresh_captcha(session_id: str) -> dict:
    with _lock:
        session = _sessions.get(session_id)
    if not session:
        return {"error": "Session not found"}

    try:
        response = _get_page(session, LOGIN_URL)
        captcha_b64 = _get_captcha_base64(session, response.text)
        return {"status": "captcha_required", "captcha_image": captcha_b64}
    except Exception as exc:
        logger.exception("Failed to refresh CAPTCHA")
        return {"error": str(exc)}


def submit_manual_captcha(session_id: str, enrollment: str, password: str, captcha: str) -> dict:
    with _lock:
        session = _sessions.get(session_id)
    if not session:
        return {"error": "Session not found"}

    try:
        html = session.get("last_html", "")
        if not html or "loginForm" not in html:
            response = _get_page(session, LOGIN_URL)
            html = response.text

        response = _submit_login(session, html, enrollment, password, captcha)
        if _is_login_successful(response):
            with _lock:
                session["status"] = "logged_in"
            return {"status": "logged_in", "session_id": session_id}

        error_message = _extract_error_message(response.text) or "Wrong CAPTCHA or credentials. Please try again."
        response = _get_page(session, LOGIN_URL)
        captcha_b64 = _get_captcha_base64(session, response.text)

        return {
            "status": "captcha_required",
            "session_id": session_id,
            "captcha_image": captcha_b64,
            "error": error_message,
        }
    except Exception as exc:
        logger.exception("Manual CAPTCHA submission failed")
        return {"error": str(exc)}


def get_driver(session_id: str):
    with _lock:
        return _sessions.get(session_id)


def _find_results_form(soup: BeautifulSoup) -> BeautifulSoup:
    forms = soup.find_all("form")
    if not forms:
        raise ValueError("Results form not found")

    for form in forms:
        if form.find("select", {"id": "euno"}) or re.search(r"get\s*result", form.get_text(strip=True), re.I):
            return form
    return forms[0]


def _find_result_select(form: BeautifulSoup) -> BeautifulSoup | None:
    return form.find("select", {"id": "euno"}) or form.find("select", attrs={"name": re.compile(r"euno", re.I)})


def _extract_result_options(form: BeautifulSoup) -> list[tuple[str, str]]:
    select = _find_result_select(form)
    if not select:
        raise ValueError("Result selection dropdown not found")

    options = []
    for opt in select.find_all("option"):
        value = opt.get("value", "").strip()
        label = opt.get_text(strip=True)
        if value:
            options.append((value, label))
    if not options:
        raise ValueError("No semester options found")
    return options


def _submit_results_form(session: dict, form: BeautifulSoup, semester_value: str) -> httpx.Response:
    action, method, payload = _parse_form(form, session.get("last_url", EXAMWEB_BASE_URL))
    select = _find_result_select(form)
    if not select or not select.has_attr("name"):
        raise ValueError("Result select field name not found")

    payload[select["name"]] = semester_value
    headers = {"Referer": session.get("last_url", EXAMWEB_BASE_URL)}
    if method == "post":
        response = session["client"].post(action, data=payload, headers=headers)
    else:
        response = session["client"].get(action, params=payload, headers=headers)
    response.raise_for_status()
    session["last_url"] = str(response.url)
    session["last_html"] = response.text
    return response


def _parse_result_table(soup: BeautifulSoup) -> list[dict]:
    subjects = []
    for table in soup.find_all("table", class_="modern-table"):
        tbody = table.find("tbody")
        if not tbody:
            continue
        for row in tbody.find_all("tr"):
            cols = [td.get_text(strip=True) for td in row.find_all("td")]
            if len(cols) < 6:
                continue
            subjects.append({
                "semester": cols[0],
                "paper_code": cols[1],
                "subject_name": cols[2],
                "internal_marks": cols[3],
                "external_marks": cols[4],
                "total_marks": cols[5],
                "exam_date": cols[6] if len(cols) > 6 else None,
            })
    return subjects


def scrape_results(session: dict) -> dict:
    if not session or "client" not in session:
        return {"error": "Invalid session object"}

    home_url = f"{EXAMWEB_BASE_URL}/web/student/studenthome.jsp"
    response = _get_page(session, home_url)
    soup = BeautifulSoup(response.text, "html.parser")
    form = _find_results_form(soup)
    options = _extract_result_options(form)

    logger.info("Found %d semester(s): %s", len(options), [label for _, label in options])
    all_semesters = {}

    for value, label in options:
        try:
            logger.info("Fetching semester %s", label)
            semester_response = _submit_results_form(session, form, value)
            semester_soup = BeautifulSoup(semester_response.text, "html.parser")
            subjects = _parse_result_table(semester_soup)
            page_text = semester_soup.get_text()
            sgpa_match = re.search(r"sgpa[:\s]+([0-9.]+)", page_text, re.I)
            cgpa_match = re.search(r"cgpa[:\s]+([0-9.]+)", page_text, re.I)
            all_semesters[f"sem_{label}"] = {
                "label": label,
                "subjects": subjects,
                "sgpa": float(sgpa_match.group(1)) if sgpa_match else None,
                "cgpa": float(cgpa_match.group(1)) if cgpa_match else None,
            }
        except Exception as exc:
            logger.warning("Failed to scrape semester %s: %s", label, exc)
            continue

    profile = scrape_profile(session)
    soup = BeautifulSoup(session.get("last_html", ""), "html.parser")
    name_el = soup.find(string=re.compile(r"Name", re.I))
    name = name_el.find_next().get_text(strip=True) if name_el else None

    return {
        "name": name or profile.get("name"),
        "enrollment": profile.get("enrollment"),
        "profile": profile,
        "semesters": all_semesters,
    }


def scrape_profile(session: dict) -> dict:
    if not session or "client" not in session:
        return {}

    profile_url = f"{EXAMWEB_BASE_URL}/web/student/profile.jsp"
    try:
        response = _get_page(session, profile_url)
    except Exception as exc:
        logger.warning("Could not fetch profile page: %s", exc)
        return {}

    profile_soup = BeautifulSoup(response.text, "html.parser")
    profile = {}

    field_map = {
        "name": ["student name", "name"],
        "father_name": ["father", "father's name", "father name"],
        "mother_name": ["mother", "mother's name", "mother name"],
        "enrollment": ["enrollment no", "enrollment number", "enrolment no"],
        "programme": ["programme", "program", "course"],
        "institute": ["institute name", "institute", "college"],
        "batch": ["batch", "admission year", "year of admission"],
        "email": ["email", "e-mail", "email id"],
        "mobile": ["mobile", "phone", "contact no", "mobile no"],
        "gender": ["gender", "sex"],
    }

    for row in profile_soup.find_all("tr"):
        cols = row.find_all(["td", "th"])
        if len(cols) < 2:
            continue
        label = cols[0].get_text(strip=True).lower().rstrip(":")
        value = cols[1].get_text(strip=True)
        if not value or value in ("-", "N/A", "NA", ""):
            continue
        for field, keywords in field_map.items():
            if field not in profile and any(kw in label for kw in keywords):
                profile[field] = value
                break

    for el in profile_soup.find_all(["dt", "label", "strong", "b"]):
        label = el.get_text(strip=True).lower().rstrip(":")
        sibling = el.find_next_sibling()
        if not sibling:
            sibling = el.parent.find_next_sibling()
        if not sibling:
            continue
        value = sibling.get_text(strip=True)
        if not value or value in ("-", "N/A", "NA", ""):
            continue
        for field, keywords in field_map.items():
            if field not in profile and any(kw in label for kw in keywords):
                profile[field] = value
                break

    photo_b64 = None
    for img in profile_soup.find_all("img"):
        src = img.get("src", "")
        if src.startswith("data:image"):
            try:
                photo_b64 = src.split(",", 1)[1]
                break
            except IndexError:
                continue

        if any(kw in src.lower() for kw in ["photo", "image", "student", "pic", ".jpg", ".jpeg", ".png"]):
            try:
                photo_url = src if src.startswith("http") else _resolve_url(profile_url, src)
                logger.info("Fetching photo from URL: %s", photo_url)
                resp = session["client"].get(photo_url, timeout=10.0)
                if resp.status_code == 200 and "image" in resp.headers.get("content-type", ""):
                    photo_b64 = base64.b64encode(resp.content).decode("utf-8")
                    break
            except Exception as exc:
                logger.warning("Photo fetch failed: %s", exc)

    if photo_b64:
        profile["photo"] = photo_b64

    logger.info("Profile fields scraped: %s", list(profile.keys()))
    return profile


def change_password(session_id: str, current_password: str, new_password: str) -> dict:
    with _lock:
        session = _sessions.get(session_id)
    if not session or session.get("status") != "logged_in":
        return {"error": "Session not found or expired."}

    profile_url = f"{EXAMWEB_BASE_URL}/web/student/changepassword.jsp"
    try:
        response = _get_page(session, profile_url)
    except Exception:
        response = _get_page(session, f"{EXAMWEB_BASE_URL}/web/student/ChangePassword.jsp")

    soup = BeautifulSoup(response.text, "html.parser")
    form = _find_login_form(response.text, profile_url)
    action, method, payload = _parse_form(form, response.url)

    password_fields = [inp for inp in form.find_all("input") if (inp.get("type") or "").lower() == "password"]
    names = [inp.get("name") for inp in password_fields if inp.get("name")]

    if len(names) >= 2:
        old_name, new_name = names[0], names[1]
        confirm_name = names[2] if len(names) >= 3 else new_name
    else:
        old_name = new_name = confirm_name = None
        for inp in password_fields:
            name = inp.get("name")
            attrs = " ".join(filter(None, [name, inp.get("id", ""), inp.get("placeholder", "")])).lower()
            if any(keyword in attrs for keyword in ["current", "old", "existing"]):
                old_name = name
            elif any(keyword in attrs for keyword in ["confirm", "repeat", "retype"]):
                confirm_name = name
            elif new_name is None:
                new_name = name

    if not old_name or not new_name:
        return {"error": "Could not identify password fields"}

    payload[old_name] = current_password
    payload[new_name] = new_password
    if confirm_name:
        payload[confirm_name] = new_password

    headers = {"Referer": str(response.url)}
    if method == "post":
        submission = session["client"].post(action, data=payload, headers=headers)
    else:
        submission = session["client"].get(action, params=payload, headers=headers)
    submission.raise_for_status()
    session["last_url"] = str(submission.url)
    session["last_html"] = submission.text

    body = submission.text.lower()
    if any(keyword in body for keyword in ["password changed", "successfully", "updated", "success"]):
        return {"status": "success", "message": "Password changed successfully."}

    error_message = _extract_error_message(submission.text)
    return {"error": error_message or "Password change failed. Please verify your current password and try again."}


def end_session(session_id: str) -> None:
    with _lock:
        session = _sessions.pop(session_id, None)
    if not session:
        return
    try:
        session["client"].close()
    except Exception:
        pass
    logger.info("Session %s ended", session_id[:8])


def get_portal_nav_links(session_id: str) -> dict:
    with _lock:
        session = _sessions.get(session_id)
    if not session:
        return {"error": "Session not found."}

    try:
        response = _get_page(session, f"{EXAMWEB_BASE_URL}/web/student/studenthome.jsp")
        soup = BeautifulSoup(response.text, "html.parser")
        links = [
            {"text": a.get_text(strip=True), "href": a.get("href", "")}
            for a in soup.find_all("a", href=True)
            if a.get_text(strip=True)
        ]
        return {"current_url": str(response.url), "links": links}
    except Exception as exc:
        logger.exception("Failed to fetch portal nav links")
        return {"error": str(exc)}
