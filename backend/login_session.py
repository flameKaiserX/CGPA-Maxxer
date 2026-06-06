import io
import time
import base64
import threading
from datetime import datetime, timedelta
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from PIL import Image, ImageFilter
from pytesseract import TesseractNotFoundError
import pytesseract
import uuid

from backend.config import (
    CHROME_DRIVER_PATH,
    EXAMWEB_BASE_URL,
    HEADLESS,
    LOGIN_URL,
    MAX_AUTO_RETRIES,
    SESSION_CLEANUP_INTERVAL_SECONDS,
    SESSION_TTL_MINUTES,
    TESSERACT_CMD,
)
from backend.logger import logger

if TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
elif hasattr(pytesseract, "pytesseract"):
    # keep current environment default when not explicitly set
    pass

# ── In-memory session store ───────────────────────────────────────────────────
# { session_id: { "driver": ..., "created_at": ..., "status": ... } }
_sessions: dict = {}
_lock = threading.Lock()

_cleanup_thread_started = False


# ── Driver factory ────────────────────────────────────────────────────────────
def _create_driver() -> webdriver.Chrome:
    try:
        options = Options()
        if HEADLESS:
            options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--force-device-scale-factor=2")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option("useAutomationExtension", False)
        options.add_argument(
            "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        )
        if CHROME_DRIVER_PATH:
            logger.info("Using ChromeDriver from CHROME_DRIVER_PATH: %s", CHROME_DRIVER_PATH)
            service = Service(CHROME_DRIVER_PATH)
        else:
            service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        return driver
    except Exception as e:
        logger.exception("Failed to initialize Chrome WebDriver")
        raise RuntimeError(f"Failed to initialize Chrome WebDriver. Ensure Chrome is installed: {str(e)}") from e


# ── CAPTCHA processing ────────────────────────────────────────────────────────
def _get_captcha_image(driver: webdriver.Chrome) -> tuple[str, bytes]:
    """Returns (base64_string, raw_bytes) of the processed CAPTCHA image."""
    wait       = WebDriverWait(driver, 10)
    captcha_el = wait.until(EC.visibility_of_element_located(
        (By.CSS_SELECTOR, "img[src*='CaptchaServlet']")
    ))
    time.sleep(1)
    driver.execute_script("arguments[0].scrollIntoView(true);", captcha_el)
    time.sleep(0.5)

    raw_bytes = captcha_el.screenshot_as_png

    img = Image.open(io.BytesIO(raw_bytes))
    img = img.convert("L")
    img = img.point(lambda x: 0 if x < 100 else 255, "1")
    img = img.convert("L")
    img = img.resize((img.width * 3, img.height * 3), Image.LANCZOS)
    img = img.filter(ImageFilter.SHARPEN)

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    processed_bytes = buffer.getvalue()

    return base64.b64encode(processed_bytes).decode("utf-8"), processed_bytes

def _get_captcha_image_raw(driver: webdriver.Chrome) -> str:
    """Returns base64 of the ORIGINAL unprocessed CAPTCHA screenshot for human display."""
    wait       = WebDriverWait(driver, 10)
    captcha_el = wait.until(EC.visibility_of_element_located(
        (By.CSS_SELECTOR, "img[src*='CaptchaServlet']")
    ))
    time.sleep(1)
    driver.execute_script("arguments[0].scrollIntoView(true);", captcha_el)
    time.sleep(0.5)
    raw_bytes = captcha_el.screenshot_as_png
    return base64.b64encode(raw_bytes).decode("utf-8")


def get_captcha_only(session_id: str) -> dict:
    """Navigate to login page and return CAPTCHA image without solving."""
    with _lock:
        session = _sessions.get(session_id)
    if not session:
        return {"error": "Session not found"}

    driver = session["driver"]
    try:
        driver.get(LOGIN_URL)
        time.sleep(1)
        captcha_b64 = _get_captcha_image_raw(driver)
        with _lock:
            _sessions[session_id]["status"] = "captcha_required"
        return {
            "status":        "captcha_required",
            "session_id":    session_id,
            "captcha_image": captcha_b64,
        }
    except Exception as e:
        return {"error": str(e)}

def _solve_captcha_auto(driver: webdriver.Chrome) -> str:
    """Try to solve CAPTCHA using Tesseract OCR."""
    _, processed_bytes = _get_captcha_image(driver)
    img = Image.open(io.BytesIO(processed_bytes))

    try:
        text = pytesseract.image_to_string(
            img,
            config="--psm 8 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        ).strip().replace(" ", "")
        logger.info("Tesseract read CAPTCHA as: %s", text)
        return text
    except TesseractNotFoundError as exc:
        logger.warning(
            "Tesseract executable not found. Set TESSERACT_CMD or install Tesseract OCR to enable auto CAPTCHA solving."
        )
        raise


def _fill_and_submit(driver: webdriver.Chrome, enrollment: str, password: str, captcha: str) -> bool:
    """Fill the login form and submit. Returns True if login succeeded."""
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    
    try:
        wait = WebDriverWait(driver, 10)

        # Wait for form to be ready
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='password']")))
        time.sleep(0.5)

        # Find ALL text inputs to identify the correct ones
        text_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='text']")

        # Try to find enrollment field by common name patterns
        enrollment_input = None
        for inp in text_inputs:
            name = (inp.get_attribute("name") or "").lower()
            placeholder = (inp.get_attribute("placeholder") or "").lower()
            input_id = (inp.get_attribute("id") or "").lower()

            if any(x in name for x in ["eno", "enrollment", "roll", "student"]):
                enrollment_input = inp
                break
            elif any(x in placeholder for x in ["enrollment", "roll", "student"]):
                enrollment_input = inp
                break
            elif any(x in input_id for x in ["eno", "enrollment", "roll", "student"]):
                enrollment_input = inp
                break

        # Fallback: use first text input if we couldn't identify it
        if not enrollment_input and text_inputs:
            enrollment_input = text_inputs[0]

        if not enrollment_input:
            return False

        # Clear and fill enrollment
        enrollment_input.clear()
        time.sleep(0.2)
        enrollment_input.send_keys(enrollment)

        # Fill password
        password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        password_input.clear()
        time.sleep(0.2)
        password_input.send_keys(password)

        # Find captcha input - try multiple selectors
        captcha_input = None
        captcha_selectors = [
            "input[name='captcha']",
            "input[name='securityCode']",
            "input[name='captchaCode']",
            "input[id*='captcha' i]",
            "input[placeholder*='captcha' i]",
        ]

        for selector in captcha_selectors:
            try:
                captcha_input = driver.find_element(By.CSS_SELECTOR, selector)
                break
            except:
                continue

        # Fallback: if we have 2+ text inputs, use the second one
        if not captcha_input and len(text_inputs) >= 2:
            captcha_input = text_inputs[1]

        if not captcha_input:
            return False

        captcha_input.clear()
        time.sleep(0.2)
        captcha_input.send_keys(captcha)

        # Find and click submit button
        submit_selectors = [
            "input[type='submit']",
            "button[type='submit']",
            "input[value='Login']",
            "input[value='Sign In']",
            "button[value='Login']",
        ]

        submit_btn = None
        for selector in submit_selectors:
            try:
                submit_btn = driver.find_element(By.CSS_SELECTOR, selector)
                break
            except:
                continue

        if not submit_btn:
            return False

        # Click submit
        submit_btn.click()

        # Wait for page to load or redirect
        time.sleep(3)

        current_url = driver.current_url.lower()

        # Check if we're still on login page
        is_login_page = "login" in current_url or "login.jsp" in current_url

        if is_login_page:
            # Check for error messages (ignore)
            try:
                driver.find_element(By.CSS_SELECTOR, ".error, .alert, [class*='error']")
            except:
                pass
            return False
        else:
            return True

    except Exception:
        return False

# ── Session cleanup ───────────────────────────────────────────────────────────
def _cleanup_expired():
    """Remove sessions older than SESSION_TTL_MINUTES."""
    cutoff = datetime.utcnow() - timedelta(minutes=SESSION_TTL_MINUTES)
    with _lock:
        expired = [sid for sid, s in _sessions.items() if s["created_at"] < cutoff]
        for sid in expired:
            try:
                _sessions[sid]["driver"].quit()
            except Exception:
                pass
            del _sessions[sid]
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


# ── Public API ────────────────────────────────────────────────────────────────
def start_session() -> dict:
    """
    Opens a browser, navigates to login page, attempts auto CAPTCHA.
    Returns:
      - If auto succeeds: { session_id, status: "logged_in" }
      - If auto fails:    { session_id, status: "captcha_required", captcha_image: base64 }
    """
    _cleanup_expired()

    session_id = str(uuid.uuid4())
    driver     = _create_driver()

    with _lock:
        _sessions[session_id] = {
            "driver":     driver,
            "created_at": datetime.utcnow(),
            "status":     "pending",
        }

    driver.get(LOGIN_URL)
    wait = WebDriverWait(driver, 10)

    logger.info("Session %s started", session_id[:8])
    return session_id, driver, wait


def start_session_manual(enrollment: str, password: str) -> dict:
    """
    Opens a browser, navigates to login page, and immediately returns the
    CAPTCHA image — no OCR, no auto-solve attempts whatsoever.
    """
    _cleanup_expired()
    session_id = str(uuid.uuid4())
    driver     = _create_driver()

    with _lock:
        _sessions[session_id] = {
            "driver":     driver,
            "created_at": datetime.utcnow(),
            "status":     "captcha_required",
        }

    logger.info("Manual session %s started (no auto-solve)", session_id[:8])
    driver.get(LOGIN_URL)
    time.sleep(1)

    try:
        captcha_b64 = _get_captcha_image_raw(driver)
        return {
            "status":        "captcha_required",
            "session_id":    session_id,
            "captcha_image": captcha_b64,
        }
    except Exception as e:
        driver.quit()
        with _lock:
            _sessions.pop(session_id, None)
        return {"error": f"Failed to load CAPTCHA: {e}"}


def try_auto_login(session_id: str, enrollment: str, password: str) -> dict:
    """
    Attempts auto CAPTCHA solving up to MAX_AUTO_RETRIES times.
    Returns result dict with status.
    """
    with _lock:
        session = _sessions.get(session_id)
    if not session:
        return {"error": "Session not found"}

    driver = session["driver"]
    driver.get(LOGIN_URL)
    time.sleep(1)

    for attempt in range(1, MAX_AUTO_RETRIES + 1):
        logger.info("Auto attempt %d/%d", attempt, MAX_AUTO_RETRIES)
        try:
            captcha = _solve_captcha_auto(driver)
            success = _fill_and_submit(driver, enrollment, password, captcha)

            if success:
                logger.info("Auto login succeeded on attempt %d", attempt)
                with _lock:
                    _sessions[session_id]["status"] = "logged_in"
                return {"status": "logged_in", "session_id": session_id}

            logger.warning("Wrong CAPTCHA on auto login attempt %d", attempt)
            driver.get(LOGIN_URL)
            time.sleep(1)

        except TesseractNotFoundError:
            logger.warning("Tesseract not found; switching to manual CAPTCHA flow.")
            break
        except Exception:
            logger.exception("Auto login attempt %d failed", attempt)
            driver.get(LOGIN_URL)
            time.sleep(1)

    # Auto failed — get fresh CAPTCHA image for manual entry
    logger.warning("Auto login failed after %d attempts, switching to manual CAPTCHA", MAX_AUTO_RETRIES)
    driver.get(LOGIN_URL)
    time.sleep(1)

    try:
        captcha_b64 = _get_captcha_image_raw(driver)
        with _lock:
            _sessions[session_id]["status"] = "captcha_required"
        return {
            "status":        "captcha_required",
            "session_id":    session_id,
            "captcha_image": captcha_b64,
        }
    except Exception as e:
        return {"error": f"Failed to get CAPTCHA image: {e}"}


def refresh_captcha(session_id: str) -> dict:
    """Get a fresh CAPTCHA image for an existing session."""
    with _lock:
        session = _sessions.get(session_id)
    if not session:
        return {"error": "Session not found"}

    driver = session["driver"]
    try:
        # Method 1: Try clicking the refresh icon on the page
        try:
            refresh_btn = driver.find_element(By.CSS_SELECTOR, "img[src*='CaptchaServlet']")
            # Click the area around the captcha to trigger refresh, or use JS
            driver.execute_script("window.location.reload();")
            time.sleep(1.5)
        except Exception:
            pass

        # Navigate back to login to get fresh CAPTCHA
        driver.get(LOGIN_URL)
        time.sleep(1)

        captcha_b64 = _get_captcha_image_raw(driver)
        return {
            "status": "captcha_required",
            "captcha_image": captcha_b64,
        }
    except Exception as e:
        return {"error": str(e)}


def submit_manual_captcha(session_id: str, enrollment: str, password: str, captcha: str) -> dict:
    """Submit the form with manually entered CAPTCHA."""
    with _lock:
        session = _sessions.get(session_id)
    if not session:
        return {"error": "Session not found"}

    driver = session["driver"]
    logger.info("Manual CAPTCHA submission for session %s", session_id[:8])
    logger.debug("Enrollment: %s", enrollment)
    logger.debug("CAPTCHA: %s", captcha)
    
    try:
        # Make sure we're on the login page
        if "login" not in driver.current_url.lower():
            logger.warning("Not on login page, navigating back")
            driver.get(LOGIN_URL)
            time.sleep(1)
        
        success = _fill_and_submit(driver, enrollment, password, captcha)
        
        if success:
            logger.info("Manual login succeeded")
            with _lock:
                _sessions[session_id]["status"] = "logged_in"
            return {"status": "logged_in", "session_id": session_id}
        else:
            logger.warning("Manual login failed, fetching fresh CAPTCHA")
            # Wrong manual CAPTCHA — get fresh one
            driver.get(LOGIN_URL)
            time.sleep(1)
            captcha_b64 = _get_captcha_image_raw(driver)
            return {
                "status":        "captcha_required",
                "captcha_image": captcha_b64,
                "error":         "Wrong CAPTCHA, please try again",
            }
    except Exception as e:
        logger.exception("Error in submit_manual_captcha")
        return {"error": str(e)}

def change_password(session_id: str, current_password: str, new_password: str) -> dict:
    """Navigate to the portal change-password page and submit the form."""
    with _lock:
        session = _sessions.get(session_id)
    if not session:
        return {"error": "Session not found or expired."}

    driver = session["driver"]
    from bs4 import BeautifulSoup
    wait = WebDriverWait(driver, 8)

    # ── Step 1: Discover the change-password URL from the nav menu ────────────
    # Navigate to student home and find a link containing "password" keywords
    pw_url = None
    try:
        home_url = f"{LOGIN_URL.rsplit('/web/login.jsp', 1)[0]}/web/student/studenthome.jsp"
        logger.info("Scraping nav from: %s", home_url)
        driver.get(home_url)
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        time.sleep(1)
        soup = BeautifulSoup(driver.page_source, "html.parser")
        for a in soup.find_all("a", href=True):
            href = a["href"].lower()
            text = a.get_text(strip=True).lower()
            if any(kw in href or kw in text for kw in ["changepassword", "changepwd", "change_password", "change password", "updatepassword"]):
                raw_href = a["href"]
                pw_url = raw_href if raw_href.startswith("http") else f"{EXAMWEB_BASE_URL}/{raw_href.lstrip('/')}"
                logger.info("Found password link '%s' -> %s", a.get_text(strip=True), pw_url)
                break
    except Exception as e:
            logger.warning("Nav discovery failed: %s", e)
    # ── Step 2: Fallback list if nav scrape didn't find it ───────────────────
    if not pw_url:
        logger.warning("Nav scrape found nothing, trying known URLs")
        CHANGE_PW_URLS = [
            "/web/student/changepassword.jsp",
            "/web/student/ChangePassword.jsp",
            "/web/student/changePwd.jsp",
            "/web/student/change_password.jsp",
            "/web/changepassword.jsp",
            "/web/ChangePassword.jsp",
            "/web/changePwd.jsp",
        ]
        for path in CHANGE_PW_URLS:
            try:
                url = EXAMWEB_BASE_URL + path
                logger.info("Trying URL: %s", url)
                driver.get(url)
                wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
                page_text = driver.page_source.lower()
                if any(kw in page_text for kw in ["new password", "old password", "current password", "confirm password"]):
                    pw_url = url
                    logger.info("Found password page: %s", url)
                    break
                logger.warning("Not a password page: %s", url)
            except Exception as e:
                logger.warning("Password page check failed for %s: %s", path, e)

    if not pw_url:
        return {"error": "Could not find the change-password page on the portal."}

    # Navigate to it
    try:
        driver.get(pw_url)
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        time.sleep(1)
        page_text = driver.page_source.lower()
        if not any(kw in page_text for kw in ["new password", "old password", "current password", "confirm password", "password"]):
            return {"error": f"Reached {pw_url} but it doesn't look like a password change page."}
        page_found = True
    except Exception as e:
        return {"error": f"Failed to load password page: {e}"}
    page_found = True

    try:
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(driver.page_source, "html.parser")

        def find_input(keywords):
            for inp in soup.find_all("input", {"type": ["password", "text"]}):
                attrs = (inp.get("name", "") + " " + inp.get("id", "") + " " + inp.get("placeholder", "")).lower()
                if any(kw in attrs for kw in keywords):
                    return inp.get("name") or inp.get("id")
            return None

        old_field     = find_input(["old", "current", "existing", "prev"])
        new_field     = find_input(["new"])
        confirm_field = find_input(["confirm", "retype", "repeat", "reenter"])
        logger.info("Password fields identified — old=%s new=%s confirm=%s", old_field, new_field, confirm_field)

        if not old_field or not new_field:
            pw_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='password']")
            if len(pw_inputs) < 2:
                return {"error": "Could not identify password fields on the page."}
            logger.warning("Positional fallback using %d password inputs", len(pw_inputs))
            pw_inputs[0].clear(); pw_inputs[0].send_keys(current_password)
            pw_inputs[1].clear(); pw_inputs[1].send_keys(new_password)
            if len(pw_inputs) >= 3:
                pw_inputs[2].clear(); pw_inputs[2].send_keys(new_password)
        else:
            def fill(name, value):
                try:    el = driver.find_element(By.NAME, name)
                except: el = driver.find_element(By.ID, name)
                el.clear(); el.send_keys(value)
            fill(old_field, current_password)
            fill(new_field, new_password)
            if confirm_field:
                fill(confirm_field, new_password)

        submit = None
        for sel in ["input[type='submit']", "button[type='submit']", "input[value*='Change']", "input[value*='Update']", "button"]:
            els = driver.find_elements(By.CSS_SELECTOR, sel)
            if els:
                submit = els[0]; break
        if not submit:
            return {"error": "Could not find the submit button on the page."}

        logger.info("Clicking submit button: %s", submit.get_attribute('value') or submit.text)
        submit.click()
        time.sleep(2)

        page_after = driver.page_source.lower()
        if any(kw in page_after for kw in ["password changed", "successfully", "updated", "success"]):
            logger.info("Password changed successfully")
            return {"status": "success", "message": "Password changed successfully."}

        if any(kw in page_after for kw in ["incorrect", "invalid", "wrong", "does not match", "error", "failed", "criteria"]):
            err_soup = BeautifulSoup(driver.page_source, "html.parser")
            for sel in [".error", ".alert", ".message", "span[style*='red']", "font[color]"]:
                el = err_soup.select_one(sel)
                if el and el.get_text(strip=True):
                    return {"error": el.get_text(strip=True)}
            return {"error": "Password change failed. Check your current password and try again."}

        return {"error": "Unexpected response from portal. Password may or may not have changed."}

    except Exception as e:
        import traceback; traceback.print_exc()
        return {"error": f"Password change failed: {e}"}


def end_session(session_id: str):
    """Clean up a session and quit the browser."""
    with _lock:
        session = _sessions.pop(session_id, None)
    if session:
        try:
            session["driver"].quit()
        except Exception:
            pass
        logger.info("Session %s ended", session_id[:8])


def get_driver(session_id: str):
    """Get the driver for an active session."""
    with _lock:
        session = _sessions.get(session_id)
    return session["driver"] if session else None

def get_portal_nav_links(session_id: str) -> dict:
    """Debug: returns all links from the student home page to help find the change-password URL."""
    with _lock:
        session = _sessions.get(session_id)
    if not session:
        return {"error": "Session not found."}
    driver = session["driver"]
    from bs4 import BeautifulSoup
    try:
        driver.get(f"{EXAMWEB_BASE_URL}/web/student/studenthome.jsp")
        time.sleep(1)
        soup = BeautifulSoup(driver.page_source, "html.parser")
        links = [
            {"text": a.get_text(strip=True), "href": a.get("href", "")}
            for a in soup.find_all("a", href=True)
            if a.get_text(strip=True)
        ]
        return {"current_url": driver.current_url, "links": links}
    except Exception as e:
        logger.exception("Failed to fetch portal nav links")
        return {"error": str(e)}