"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: Date;
};

const BRANCHES = ["Common", "CSE", "IT", "ECE", "MAE", "EEE", "Civil", "Mech"];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

// ── BRUTALIST DESIGN TOKENS ───────────────────────────────────────────────────
const BG = "#f4f1e8";
const INK = "#0a0a0a";
const RED = "#ff3d00";
const YELLOW = "#ffd60a";
const LIME = "#c6ff3d";
const BLUE = "#3d5aff";
const PINK = "#ff5cb4";
const WHITE = "#ffffff";
const MUTED = "#6b6b6b";

const display = "'Space Grotesk', 'Arial Black', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'Fira Code', monospace";

const SHADOW = `6px 6px 0 0 ${INK}`;
const SHADOW_LG = `10px 10px 0 0 ${INK}`;
const SHADOW_SM = `3px 3px 0 0 ${INK}`;
const BORDER = `4px solid ${INK}`;
const BORDER_THIN = `2px solid ${INK}`;

export default function SyllabusChat() {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [program, setProgram] = useState<string>("Common");
  const [semester, setSemester] = useState<number>(1);
  const [configured, setConfigured] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          program,
          semester,
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const assistantMessageId = crypto.randomUUID();
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        createdAt: new Date(),
      }]);

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setMessages(prev => prev.map(m =>
            m.id === assistantMessageId ? { ...m, content: accumulated } : m
          ));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "❌ Sorry, I couldn't connect to the server. Please try again.",
        createdAt: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date?: Date) =>
    date ? new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  if (!mounted) {
    return (
      <div style={{
        minHeight: "100vh",
        width: "100%",
        background: BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: display,
      }}>
        <div style={{
          background: WHITE,
          border: BORDER,
          boxShadow: SHADOW_LG,
          padding: "32px 40px",
          textAlign: "center",
        }}>
          <div style={{
            width: 48,
            height: 48,
            border: `5px solid ${INK}`,
            borderTopColor: RED,
            borderRadius: "50%",
            margin: "0 auto 18px",
            animation: "spin 0.8s linear infinite",
          }} />
          <div style={{
            fontFamily: mono,
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
          }}>Loading...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const pageShell: React.CSSProperties = {
    height: "100vh",
    width: "100%",
    background: BG,
    color: INK,
    fontFamily: display,
    position: "relative",
    overflowX: "hidden",
    backgroundImage: `linear-gradient(${INK} 1px, transparent 1px), linear-gradient(90deg, ${INK} 1px, transparent 1px)`,
    backgroundSize: "48px 48px",
    backgroundPosition: "-1px -1px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0",
  };

  // ── Selector Screen ──────────────────────────────────────────────────────────
  if (!configured) {
    return (
      <div style={pageShell}>
        <div style={{
          width: "100%",
          maxWidth: "540px",
          margin: "24px",
          background: WHITE,
          border: BORDER,
          boxShadow: SHADOW_LG,
          position: "relative",
        }}>
          <div style={{
            background: INK,
            color: BG,
            padding: "14px 20px",
            fontFamily: mono,
            fontSize: "11px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: BORDER,
          }}>
            <span>◆ CGPA MAXXER</span>
          </div>

          <div style={{ padding: "28px 24px" }}>
            <div style={{ marginBottom: "28px" }}>
              <h2 style={{
                fontSize: "clamp(32px, 6vw, 48px)",
                fontWeight: 900,
                lineHeight: 0.9,
                textTransform: "uppercase",
                margin: 0,
                letterSpacing: "-0.02em",
              }}>
                What's in<br />
                your <span style={{
                  display: "inline-block",
                  background: YELLOW,
                  padding: "0 8px",
                  border: BORDER_THIN,
                  boxShadow: SHADOW_SM,
                }}>syllabus</span>?
              </h2>
              <p style={{
                marginTop: "16px",
                fontFamily: mono,
                fontSize: "12px",
                lineHeight: 1.6,
                color: MUTED,
                fontWeight: 500,
              }}>
                Pick your branch and semester. Ask anything — subjects, topics, credits, exam patterns.
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                fontFamily: mono,
                fontSize: "10px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                marginBottom: "10px",
                display: "block",
              }}>
                Branch
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {BRANCHES.map(b => {
                  const active = program === b;
                  return (
                    <button
                      key={b}
                      onClick={() => setProgram(b)}
                      style={{
                        padding: "8px 14px",
                        fontFamily: mono,
                        fontSize: "11px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        cursor: "pointer",
                        background: active ? INK : WHITE,
                        color: active ? BG : INK,
                        border: BORDER,
                        boxShadow: active ? "none" : SHADOW_SM,
                      }}
                    >
                      {b}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{
                fontFamily: mono,
                fontSize: "10px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                marginBottom: "10px",
                display: "block",
              }}>
                Semester
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {SEMESTERS.map(s => {
                  const active = semester === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setSemester(s)}
                      style={{
                        width: "44px",
                        height: "44px",
                        fontFamily: mono,
                        fontSize: "14px",
                        fontWeight: 900,
                        cursor: "pointer",
                        background: active ? RED : WHITE,
                        color: active ? WHITE : INK,
                        border: BORDER,
                        boxShadow: active ? "none" : SHADOW_SM,
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setConfigured(true)}
              style={{
                width: "100%",
                padding: "16px 24px",
                background: LIME,
                color: INK,
                border: BORDER,
                fontFamily: mono,
                fontSize: "14px",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                cursor: "pointer",
                boxShadow: SHADOW,
              }}
            >
              Start Chatting →
            </button>

            <div style={{
              marginTop: "16px",
              paddingTop: "12px",
              borderTop: `2px dashed ${INK}`,
              fontFamily: mono,
              fontSize: "10px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: MUTED,
              textAlign: "center",
            }}>
              Sourced from official IPU syllabus · Verify with your department
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Chat Screen ──────────────────────────────────────────────────────────────
  return (
    <div style={pageShell}>
      <div style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: WHITE,
        overflow: "hidden",
      }}>
        <div style={{
          padding: "14px 18px",
          background: INK,
          color: BG,
          borderBottom: BORDER,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              background: YELLOW,
              border: BORDER_THIN,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: 900,
              color: INK,
            }}>M</div>
            <div>
              <div style={{
                fontFamily: mono,
                fontSize: "12px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}>
                Maxxer
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              background: RED,
              color: WHITE,
              border: BORDER_THIN,
              padding: "5px 12px",
              fontFamily: mono,
              fontSize: "10px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}>
              {program} · Sem {semester}
            </div>
            <button
              onClick={() => { setConfigured(false); setMessages([]); }}
              style={{
                background: YELLOW,
                color: INK,
                border: BORDER_THIN,
                padding: "5px 12px",
                fontFamily: mono,
                fontSize: "10px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                cursor: "pointer",
              }}
            >
              Change
            </button>
          </div>
        </div>

        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          background: BG,
          scrollbarWidth: "thin",
          scrollbarColor: `${INK} ${BG}`,
        }}>
          {messages.length === 0 && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              gap: "20px",
              paddingTop: "40px",
            }}>
              <div style={{
                width: "72px",
                height: "72px",
                background: YELLOW,
                border: BORDER,
                boxShadow: SHADOW,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
              }}>📚</div>
              <div style={{ textAlign: "center" }}>
                <p style={{
                  fontFamily: mono,
                  color: INK,
                  fontSize: "13px",
                  margin: "0 0 18px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}>
                  Ask anything about your IPU syllabus
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
                  {["What subjects are in this semester?", "What are the important topics for exams?"].map(s => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      style={{
                        background: WHITE,
                        border: BORDER,
                        color: INK,
                        padding: "10px 16px",
                        fontFamily: mono,
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                        boxShadow: SHADOW_SM,
                      }}
                    >
                      ▸ {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div key={m.id} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
                {!isUser && (
                  <div style={{
                    width: "28px",
                    height: "28px",
                    background: YELLOW,
                    border: BORDER_THIN,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 900,
                    color: INK,
                    marginRight: "10px",
                    marginTop: "2px",
                    flexShrink: 0,
                  }}>M</div>
                )}
                <div style={{
                  maxWidth: "78%",
                  padding: "12px 16px",
                  background: isUser ? RED : WHITE,
                  color: isUser ? WHITE : INK,
                  border: BORDER,
                  boxShadow: SHADOW_SM,
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "6px",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                    fontFamily: mono,
                  }}>
                    <span style={{
                      fontSize: "9px",
                      fontWeight: 800,
                      color: isUser ? "rgba(255,255,255,0.7)" : MUTED,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                    }}>
                      {isUser ? "You" : "Maxxer"}
                    </span>
                    <span style={{
                      fontSize: "9px",
                      color: isUser ? "rgba(255,255,255,0.5)" : "#999",
                      letterSpacing: "0.08em",
                    }}>
                      {formatTime(m.createdAt)}
                    </span>
                  </div>

                  {isUser ? (
                    <div style={{
                      fontSize: "13px",
                      lineHeight: "1.6",
                      fontWeight: 600,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}>
                      {m.content}
                    </div>
                  ) : (
                    <div style={{
                      fontSize: "13px",
                      lineHeight: "1.7",
                      color: INK,
                      wordBreak: "break-word",
                    }} className="markdown-body">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p style={{ margin: "0 0 10px", fontFamily: display, fontWeight: 500 }}>{children}</p>,
                          strong: ({ children }) => <strong style={{ color: RED, fontWeight: 800 }}>{children}</strong>,
                          em: ({ children }) => <em style={{ color: MUTED, fontStyle: "italic" }}>{children}</em>,
                          ul: ({ children }) => <ul style={{ paddingLeft: "20px", margin: "8px 0", fontFamily: display }}>{children}</ul>,
                          ol: ({ children }) => <ol style={{ paddingLeft: "20px", margin: "8px 0", fontFamily: display }}>{children}</ol>,
                          li: ({ children }) => <li style={{ marginBottom: "4px", fontWeight: 500 }}>{children}</li>,
                          code: ({ children }) => (
                            <code style={{
                              background: YELLOW,
                              border: BORDER_THIN,
                              color: INK,
                              padding: "1px 6px",
                              fontFamily: mono,
                              fontSize: "12px",
                              fontWeight: 700,
                            }}>{children}</code>
                          ),
                          h1: ({ children }) => <h1 style={{ fontSize: "16px", color: INK, margin: "12px 0 8px", fontWeight: 900, fontFamily: display }}>{children}</h1>,
                          h2: ({ children }) => <h2 style={{ fontSize: "15px", color: INK, margin: "12px 0 8px", fontWeight: 900, fontFamily: display }}>{children}</h2>,
                          h3: ({ children }) => <h3 style={{ fontSize: "14px", color: RED, margin: "10px 0 6px", fontWeight: 800, fontFamily: display, textTransform: "uppercase", letterSpacing: "0.05em" }}>{children}</h3>,
                          blockquote: ({ children }) => (
                            <blockquote style={{
                              borderLeft: `4px solid ${RED}`,
                              paddingLeft: "14px",
                              margin: "10px 0",
                              color: MUTED,
                              fontStyle: "italic",
                            }}>{children}</blockquote>
                          ),
                          table: ({ children }) => (
                            <div style={{ overflowX: "auto", margin: "10px 0" }}>
                              <table style={{ borderCollapse: "collapse", fontFamily: mono, fontSize: "12px", width: "100%" }}>{children}</table>
                            </div>
                          ),
                          th: ({ children }) => (
                            <th style={{
                              background: YELLOW,
                              border: BORDER_THIN,
                              padding: "6px 10px",
                              fontWeight: 800,
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                              fontSize: "10px",
                            }}>{children}</th>
                          ),
                          td: ({ children }) => (
                            <td style={{ border: BORDER_THIN, padding: "6px 10px" }}>{children}</td>
                          ),
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {error && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{
                background: RED,
                color: WHITE,
                border: BORDER,
                padding: "10px 16px",
                fontFamily: mono,
                fontSize: "12px",
                fontWeight: 700,
                boxShadow: SHADOW_SM,
              }}>
                ⚠ {error}
              </div>
            </div>
          )}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "28px",
                height: "28px",
                background: YELLOW,
                border: BORDER_THIN,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: 900,
                color: INK,
                flexShrink: 0,
              }}>M</div>
              <div style={{
                background: WHITE,
                border: BORDER,
                boxShadow: SHADOW_SM,
                padding: "14px 18px",
                display: "flex",
                gap: "6px",
                alignItems: "center",
              }}>
                {[0, 150, 300].map(delay => (
                  <span key={delay} style={{
                    width: "8px",
                    height: "8px",
                    background: RED,
                    border: `1px solid ${INK}`,
                    display: "inline-block",
                    animation: "bounce 1.2s infinite",
                    animationDelay: `${delay}ms`,
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div style={{
          padding: "14px 16px",
          borderTop: BORDER,
          background: WHITE,
          flexShrink: 0,
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent); } }}
                placeholder="Ask about IPU syllabus..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: BG,
                  border: BORDER,
                  color: INK,
                  fontSize: "13px",
                  fontFamily: mono,
                  fontWeight: 600,
                  outline: "none",
                  boxShadow: SHADOW_SM,
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                style={{
                  padding: "12px 22px",
                  background: input.trim() && !isLoading ? RED : "#cccccc",
                  color: WHITE,
                  border: BORDER,
                  fontFamily: mono,
                  fontSize: "12px",
                  fontWeight: 900,
                  cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  boxShadow: input.trim() && !isLoading ? SHADOW_SM : "none",
                  minWidth: "80px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isLoading ? (
                  <span style={{
                    width: "14px",
                    height: "14px",
                    border: `2px solid ${WHITE}`,
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.7s linear infinite",
                  }} />
                ) : "Send →"}
              </button>
            </div>
          </form>
          <p style={{
            fontSize: "10px",
            color: MUTED,
            textAlign: "center",
            marginTop: "10px",
            fontFamily: mono,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
          }}>
            Sourced from official IPU syllabus · Verify with your department
          </p>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}