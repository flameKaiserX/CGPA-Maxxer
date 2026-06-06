import re
import time
import logging
from selenium import webdriver
from selenium.webdriver.support.ui import Select
from bs4 import BeautifulSoup

logger = logging.getLogger("backend.result_scraper")


# ── Parse result table ────────────────────────────────────────────────────────
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
                "semester":       cols[0],
                "paper_code":     cols[1],
                "subject_name":   cols[2],
                "internal_marks": cols[3],
                "external_marks": cols[4],
                "total_marks":    cols[5],
                "exam_date":      cols[6] if len(cols) > 6 else None,
            })
    return subjects


# ── Scrape all semesters ──────────────────────────────────────────────────────
def scrape_results(driver: webdriver.Chrome) -> dict:
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC

    wait = WebDriverWait(driver, 10)
    wait.until(EC.presence_of_element_located((By.ID, "euno")))

    dropdown = Select(driver.find_element(By.ID, "euno"))
    options = [
        (opt.get_attribute("value"), opt.text.strip())
        for opt in dropdown.options
        if opt.get_attribute("value")
    ]
    logger.info("Found %d semester(s): %s", len(options), [o[1] for o in options])

    all_semesters = {}

    for value, label in options:
        logger.info("Fetching semester %s", label)
        Select(driver.find_element(By.ID, "euno")).select_by_value(value)
        time.sleep(1)
        driver.find_element(By.CSS_SELECTOR, "input[value='Get Result']").click()
        time.sleep(2)

        soup     = BeautifulSoup(driver.page_source, "html.parser")
        subjects = _parse_result_table(soup)

        if subjects:
            page_text  = soup.get_text()
            sgpa_match = re.search(r'sgpa[:\s]+([0-9.]+)', page_text, re.I)
            cgpa_match = re.search(r'cgpa[:\s]+([0-9.]+)', page_text, re.I)

            all_semesters[f"sem_{label}"] = {
                "label":    label,
                "subjects": subjects,
                "sgpa":     float(sgpa_match.group(1)) if sgpa_match else None,
                "cgpa":     float(cgpa_match.group(1)) if cgpa_match else None,
            }

    # Extract student name from last loaded page
    soup = BeautifulSoup(driver.page_source, "html.parser")
    name_el = soup.find(string=re.compile(r"Name", re.I))
    name = name_el.find_next().get_text(strip=True) if name_el else None

    logger.info("Scraping student profile")
    profile = scrape_profile(driver)

    return {
        "name":       name or profile.get("name"),
        "enrollment": profile.get("enrollment"),
        "profile":    profile,
        "semesters":  all_semesters,
    }

# ── Scrape student profile ────────────────────────────────────────────────────
def scrape_profile(driver: webdriver.Chrome) -> dict:
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    import base64, requests

    PROFILE_URLS = [
        "/web/student/profile.jsp",
    ]

    base_url = driver.current_url.split("/web/")[0]
    profile_soup = None

    for path in PROFILE_URLS:
        try:
            url = base_url + path
            logger.info("Trying profile URL: %s", url)
            driver.get(url)
            WebDriverWait(driver, 6).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            soup = BeautifulSoup(driver.page_source, "html.parser")
            page_text = soup.get_text().lower()
            if any(kw in page_text for kw in ["father", "date of birth", "programme", "enrollment", "branch"]):
                logger.info("Found profile page at: %s", url)
                profile_soup = soup
                break
            else:
                logger.warning("Page exists but doesn't look like profile, trying next: %s", url)
        except Exception as e:
                logger.warning("Profile URL failed: %s, error: %s", path, e)

    if not profile_soup:
        logger.warning("Could not find profile page")
        return {}

    profile = {}

    field_map = {
        "name":           ["student name", "name"],
        "father_name":    ["father", "father's name", "father name"],
        "mother_name":    ["mother", "mother's name", "mother name"],
        "enrollment":     ["enrollment no", "enrollment number", "enrolment no"],
        "programme":      ["programme", "program", "course"],
        "institute":      ["institute name", "institute", "college"],
        "batch":          ["batch", "admission year", "year of admission"],
        "email":          ["email", "e-mail", "email id"],
        "mobile":         ["mobile", "phone", "contact no", "mobile no"],
        "gender":         ["gender", "sex"],
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

    # ── Photo ─────────────────────────────────────────────────────────────────
    photo_b64 = None
    for img in profile_soup.find_all("img"):
        src = img.get("src", "")

        # Case 1: already a base64 data URI embedded in the HTML
        if src.startswith("data:image"):
            # Extract the base64 part after the comma
            try:
                photo_b64 = src.split(",", 1)[1]
                logger.info("Photo is inline base64 (%d chars)", len(photo_b64))
                break
            except IndexError:
                continue

        # Case 2: URL pointing to a photo resource
        if any(kw in src.lower() for kw in ["photo", "image", "student", "pic", ".jpg", ".jpeg", ".png"]):
            try:
                photo_url = src if src.startswith("http") else base_url + ("" if src.startswith("/") else "/") + src
                logger.info("Fetching photo from URL: %s", photo_url)
                cookies = {c["name"]: c["value"] for c in driver.get_cookies()}
                resp = requests.get(photo_url, cookies=cookies, timeout=8)
                if resp.status_code == 200 and "image" in resp.headers.get("content-type", ""):
                    photo_b64 = base64.b64encode(resp.content).decode("utf-8")
                    logger.info("Photo fetched (%d bytes)", len(resp.content))
                    break
            except Exception as e:
                logger.warning("Photo fetch failed: %s", e)

    if photo_b64:
        profile["photo"] = photo_b64

    logger.info("Profile fields scraped: %s", list(profile.keys()))
    return profile