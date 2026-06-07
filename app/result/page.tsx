"use client";
import { useState, useEffect } from "react";
import type { ResultData, CaptchaMode, PageState } from "@/lib/types";
import { GhostLoadingScreen  } from "./components/GhostLoadingScreen";
import { LoginForm           } from "./components/LoginForm";
import { ResultsDashboard} from "./components/ResultDashboard";

const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "";
const HEALTH_ENDPOINT = API ? `${API}/health` : "/health";

async function parseApiResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  const error = data.error ?? data.detail ?? null;
  return { ok: res.ok, data, error };
}

export default function ResultsPage() {
  const [pageState,      setPageState]     = useState<PageState>("form");
  const [backendDown,    setBackendDown]   = useState(false);
  const [error,          setError]         = useState<string | null>(null);
  const [result,         setResult]        = useState<ResultData | null>(null);
  const [sessionId,      setSessionId]     = useState<string | null>(null);
  const [captchaImage,   setCaptchaImage]  = useState<string | null>(null);
  const [loadingCaptcha, setLoadingCaptcha]= useState(false);
  const [captchaError,   setCaptchaError]  = useState<string | null>(null);
  const [loadingAuto,    setLoadingAuto]   = useState(false);
  const [enrollment,     setEnrollment]    = useState("");
  const [password,       setPassword]      = useState("");
  const [captchaMode,    setCaptchaMode]   = useState<CaptchaMode>("auto");

  useEffect(() => {
    fetch(HEALTH_ENDPOINT)
      .then(res => {
        setBackendDown(!res.ok);
      })
      .catch(() => setBackendDown(true));
  }, []);

  const fetchResults = async (sid: string) => {
    setPageState("fetching");
    try {
      const res  = await fetch(`${API}/api/result/fetch`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sid }),
      });
      const { ok, data, error } = await parseApiResponse(res);
      if (!ok) {
        setError(error ?? "Failed to fetch results.");
        setPageState("form");
        return;
      }
      setResult(data); setPageState("done");
    } catch {
      setError("Failed to fetch results."); setPageState("form");
    }
  };

  const handleAutoSubmit = async (e: string, p: string) => {
    setError(null); setLoadingAuto(true);
    try {
      const res  = await fetch(`${API}/api/result/start`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollment: e, password: p }),
      });
      const { ok, data, error } = await parseApiResponse(res);
      if (!ok) {
        setError(error ?? "Could not start session.");
        setPageState("form");
        return;
      }
      if (data.status === "logged_in") {
        await fetchResults(data.session_id);
      } else if (data.status === "captcha_required") {
        setError("❌ Auto-CAPTCHA failed — enter the code manually");
        setCaptchaMode("manual"); setSessionId(data.session_id);
        if (data.captcha_image) setCaptchaImage(data.captcha_image);
        else setCaptchaError("CAPTCHA image missing. Click refresh ↻");
        setPageState("form");
      } else {
        setError(error ?? "Auto CAPTCHA failed.");
        setCaptchaMode("manual"); setPageState("form");
      }
    } catch {
      setError("Could not connect to server."); setPageState("form");
    } finally { setLoadingAuto(false); }
  };

  const handleManualOpen = async (e: string, p: string) => {
    if (!e || !p) { setCaptchaError("Enter enrollment and password first."); return; }
    if (sessionId) {
      setLoadingCaptcha(true); setCaptchaError(null); setCaptchaImage(null);
      try {
        const res  = await fetch(`${API}/api/result/refresh-captcha`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        const { ok, data, error } = await parseApiResponse(res);
        if (!ok) { setCaptchaError(error ?? "Failed to load CAPTCHA."); return; }
        if (data.captcha_image) setCaptchaImage(data.captcha_image);
      } catch { setCaptchaError("Failed to load CAPTCHA."); }
      finally  { setLoadingCaptcha(false); }
      return;
    }
    setLoadingCaptcha(true); setCaptchaError(null); setCaptchaImage(null);
    try {
      const res  = await fetch(`${API}/api/result/start-manual`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollment: e, password: p }),
      });
      const { ok, data, error } = await parseApiResponse(res);
      if (!ok) { setCaptchaError(error ?? "Failed to load CAPTCHA."); return; }
      setSessionId(data.session_id);
      if (data.captcha_image) { setCaptchaImage(data.captcha_image); return; }
      setCaptchaError("No CAPTCHA image received. Try the refresh button.");
    } catch { setCaptchaError("Failed to load CAPTCHA. Check your connection."); }
    finally  { setLoadingCaptcha(false); }
  };

  const handleManualSubmit = async (e: string, p: string, c: string) => {
    if (!sessionId) { setError("Session expired. Please try again."); return; }
    setError(null); setLoadingAuto(true);
    try {
      const res  = await fetch(`${API}/api/result/manual-captcha`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, enrollment: e, password: p, captcha: c }),
      });
      const { ok, data, error } = await parseApiResponse(res);
      if (ok && data.status === "logged_in") {
        await fetchResults(sessionId);
        return;
      }
      setError(error ?? "❌ Wrong CAPTCHA or credentials. Please try again.");
      if (data.captcha_image) {
        setCaptchaImage(data.captcha_image);
      } else {
        setCaptchaImage(null);
        await handleManualRefresh();
      }
      setPageState("form");
    } catch { setError("Could not connect to server."); setPageState("form"); }
    finally  { setLoadingAuto(false); }
  };

  const handleManualRefresh = async () => {
    if (!sessionId) {
      if (!enrollment || !password) { setCaptchaError("Enter enrollment and password first."); return; }
      await handleManualOpen(enrollment, password);
      return;
    }
    setLoadingCaptcha(true); setCaptchaError(null); setCaptchaImage(null);
    try {
      const res  = await fetch(`${API}/api/result/refresh-captcha`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const { ok, data, error } = await parseApiResponse(res);
      if (!ok) { setCaptchaError(error ?? "Failed to refresh."); }
      else if (data.captcha_image) setCaptchaImage(data.captcha_image);
    } catch { setCaptchaError("Failed to refresh."); }
    finally  { setLoadingCaptcha(false); }
  };

  const handleLogout = async () => {
    if (sessionId) {
      try {
        await fetch(`${API}/api/result/logout`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
      } catch { /* TTL out anyway */ }
    }
    setResult(null); setSessionId(null); setCaptchaImage(null);
    setEnrollment(""); setPassword(""); setCaptchaMode("auto");
    setError(null); setPageState("form");
  };

  if (pageState === "fetching") return <GhostLoadingScreen />;
  if (pageState === "done" && result) return <ResultsDashboard data={result} onLogout={handleLogout} sessionId={sessionId} />;

  return (
    <LoginForm
      backendDown={backendDown}    error={error}
      onAutoSubmit={handleAutoSubmit}
      onManualOpen={handleManualOpen}
      onManualSubmit={handleManualSubmit}
      onManualRefresh={handleManualRefresh}
      captchaImage={captchaImage}  loadingCaptcha={loadingCaptcha}
      captchaError={captchaError}  loadingAuto={loadingAuto}
      captchaMode={captchaMode}    setCaptchaMode={setCaptchaMode}
      enrollment={enrollment}      setEnrollment={setEnrollment}
      password={password}          setPassword={setPassword}
    />
  );
}