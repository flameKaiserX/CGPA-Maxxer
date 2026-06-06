import os
import sys

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.config import ALLOWED_ORIGINS
from backend.logger import logger

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI()

origins = [origin for origin in ALLOWED_ORIGINS if origin]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    from backend.login_session import start_cleanup_thread

    start_cleanup_thread()
    logger.info("Backend startup complete")

# ── Models ────────────────────────────────────────────────────────────────────
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[Message]
    program:  str | None = None
    semester: int | None = None

class StartRequest(BaseModel):
    enrollment: str
    password:   str

class CaptchaRequest(BaseModel):
    session_id: str

class ManualCaptchaRequest(BaseModel):
    session_id: str
    enrollment: str
    password:   str
    captcha:    str

class SessionRequest(BaseModel):
    session_id: str

class FetchRequest(BaseModel):
    session_id: str

class ChangePasswordRequest(BaseModel):
    session_id:       str
    current_password: str
    new_password:     str

# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok"}


def _unwrap_response(response: dict) -> dict:
    if response is None:
        logger.error("Received empty response from backend service")
        raise HTTPException(status_code=500, detail="Backend service error")
    if isinstance(response, dict) and "error" in response:
        logger.warning("Backend returned error: %s", response["error"])
        raise HTTPException(status_code=response.get("status_code", 400), detail=response["error"])
    return response


# ── Chat ──────────────────────────────────────────────────────────────────────
@app.post("/api/chat")
async def chat(request: ChatRequest):
    from backend.chat import stream_chat

    async def response():
        async for chunk in stream_chat(request.messages, request.program, request.semester):
            yield chunk

    return StreamingResponse(response(), media_type="text/plain")


# ── Result: Step 1 — start session + auto CAPTCHA ────────────────────────────
@app.post("/api/result/start")
def result_start(request: StartRequest):
    from backend.login_session import start_session, try_auto_login

    session_id, _, _ = start_session()
    return _unwrap_response(try_auto_login(session_id, request.enrollment, request.password))


# ── Result: Step 1b — start session for manual CAPTCHA (no auto-solve) ───────
@app.post("/api/result/start-manual")
def result_start_manual(request: StartRequest):
    from backend.login_session import start_session_manual
    return _unwrap_response(start_session_manual(request.enrollment, request.password))


# ── Result: Step 2a — fetch results (after successful login) ─────────────────
@app.post("/api/result/fetch")
def result_fetch(request: SessionRequest):
    from backend.login_session import get_driver
    from backend.result_scraper import scrape_results

    driver = get_driver(request.session_id)
    if not driver:
        logger.warning("Fetch requested for missing or expired session %s", request.session_id)
        raise HTTPException(status_code=404, detail="Session not found or expired. Please start again.")

    return _unwrap_response(scrape_results(driver))


# ── Result: Step 2b — submit manual CAPTCHA ──────────────────────────────────
@app.post("/api/result/manual-captcha")
def result_manual_captcha(request: ManualCaptchaRequest):
    from backend.login_session import submit_manual_captcha
    return _unwrap_response(submit_manual_captcha(
        request.session_id, request.enrollment, request.password, request.captcha
    ))


# ── Result: Change password ───────────────────────────────────────────────────
@app.post("/api/result/change-password")
def result_change_password(request: ChangePasswordRequest):
    from backend.login_session import change_password
    return _unwrap_response(change_password(
        request.session_id,
        request.current_password,
        request.new_password,
    ))


# ── Result: Logout — end session ─────────────────────────────────────────────
@app.post("/api/result/logout")
def result_logout(request: SessionRequest):
    from backend.login_session import end_session

    end_session(request.session_id)
    return {"status": "logged_out"}


# ── Result: Refresh CAPTCHA ───────────────────────────────────────────────────
@app.post("/api/result/refresh-captcha")
def result_refresh_captcha(request: CaptchaRequest):
    from backend.login_session import refresh_captcha
    return _unwrap_response(refresh_captcha(request.session_id))


# ── Debug: get portal nav links (find change-password URL) ───────────────────
@app.post("/api/result/debug-nav")
def result_debug_nav(request: SessionRequest):
    from backend.login_session import get_portal_nav_links
    return _unwrap_response(get_portal_nav_links(request.session_id))