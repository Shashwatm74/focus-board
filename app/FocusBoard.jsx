"use client";
// ══════════════════════════════════════════════════════════
// FocusBoard — Next.js + Supabase
// Drop this file at: app/page.jsx  (or pages/index.jsx)
//
// Setup checklist:
//   1. npm install @supabase/supabase-js
//   2. Run supabase_schema.sql in Supabase → SQL Editor
//   3. Add to .env.local:
//        NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
//        NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
// ══════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase client ──────────────────────────────────────
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "YOUR_SUPABASE_URL";
const SUPABASE_ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── Styles ───────────────────────────────────────────────
// Injected via useEffect to avoid SSR/client hydration mismatch
function GlobalStyles() {
  useEffect(() => {
    // Font link
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&display=swap";
    document.head.appendChild(link);

    // Styles
    const style = document.createElement("style");
    style.id = "focus-board-styles";
    if (!document.getElementById("focus-board-styles")) {
      style.textContent = [
        "* { margin: 0; padding: 0; box-sizing: border-box; }",
        ":root {",
        "  --bg: #0d0d0f; --surface: #141416; --surface2: #1c1c1f; --surface3: #242428;",
        "  --border: #2a2a2f; --border2: #3a3a40;",
        "  --text: #f0ede8; --text2: #9b9893; --text3: #5a5855;",
        "  --accent: #e8d5a3; --accent2: #c9a96e;",
        "  --green: #7bc4a0; --red: #d97b7b; --blue: #7badc4; --purple: #b07bc4;",
        "  --font-display: 'Syne', sans-serif; --font-mono: 'DM Mono', monospace;",
        "  --radius: 12px; --radius-sm: 8px;",
        "}",
        "body { background: var(--bg); color: var(--text); font-family: var(--font-display); }",
        "::-webkit-scrollbar { width: 4px; }",
        "::-webkit-scrollbar-track { background: transparent; }",
        "::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }",
        "input, textarea, select {",
        "  background: var(--surface2); border: 1px solid var(--border); color: var(--text);",
        "  font-family: var(--font-mono); font-size: 13px; border-radius: var(--radius-sm);",
        "  padding: 8px 12px; outline: none; transition: border-color 0.2s; width: 100%;",
        "}",
        "input:focus, textarea:focus, select:focus { border-color: var(--accent2); }",
        "input::placeholder, textarea::placeholder { color: var(--text3); }",
        "button { cursor: pointer; font-family: var(--font-display); border: none; outline: none; transition: all 0.15s; }",
        "select option { background: var(--surface2); }",
        "@keyframes spin { to { transform: rotate(360deg); } }",
        "@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }",
        ".fade-in { animation: fadeIn 0.2s ease forwards; }",
      ].join("\n");
      document.head.appendChild(style);
    }

    return () => {
      document.getElementById("focus-board-styles")?.remove();
    };
  }, []);

  return null;
}

// ─── Icons ────────────────────────────────────────────────
const Icon = ({ d, size = 16, stroke = "currentColor", fill = "none" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);
const icons = {
  todo: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
  timetable:
    "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  notes:
    "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  timer:
    "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2",
  history: "M3 12a9 9 0 105.657-8.485M3 3v5h5",
  plus: "M12 5v14M5 12h14",
  trash: "M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2",
  edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  pin: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18M6 6l12 12",
  play: "M5 3l14 9-14 9V3z",
  pause: "M6 4h4v16H6zM14 4h4v16h-4z",
  reset:
    "M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15",
  clock:
    "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
};

// ─── Helpers ──────────────────────────────────────────────
const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const formatTime = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const nowISO = () => new Date().toISOString();
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);
const PRIORITIES = {
  low: { label: "Low", color: "#7badc4" },
  medium: { label: "Med", color: "#e8d5a3" },
  high: { label: "High", color: "#d97b7b" },
};
const SLOT_COLORS = [
  "#7bc4a0",
  "#e8d5a3",
  "#7badc4",
  "#b07bc4",
  "#d97b7b",
  "#c4a07b",
];
const NAV_ITEMS = [
  { id: "todo", label: "Tasks" },
  { id: "timetable", label: "Timetable" },
  { id: "notes", label: "Notes" },
  { id: "timer", label: "Focus" },
  { id: "history", label: "History" },
];

// ─── Shared UI ────────────────────────────────────────────
const Spinner = ({ size = 20, color = "var(--accent2)" }) => (
  <div
    style={{
      width: size,
      height: size,
      border: `2px solid ${color}33`,
      borderTop: `2px solid ${color}`,
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
    }}
  />
);

const ErrorBanner = ({ msg, onClose }) =>
  msg ? (
    <div
      style={{
        background: "#d97b7b22",
        border: "1px solid #d97b7b55",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 12,
        fontFamily: "var(--font-mono)",
        color: "var(--red)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {msg}
      <button
        onClick={onClose}
        style={{ background: "none", color: "var(--red)", display: "flex" }}
      >
        <Icon d={icons.x} size={13} />
      </button>
    </div>
  ) : null;

// ══════════════════════════════════════════════════════════
// AUTH SCREEN
// ══════════════════════════════════════════════════════════
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async () => {
    setError("");
    setSuccess("");
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        const { data, error: e } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (e) throw e;
        onAuth(data.user);
      } else {
        const { error: e } = await supabase.auth.signUp({ email, password });
        if (e) throw e;
        setSuccess(
          "Account created! Check your email to confirm, then log in.",
        );
        setMode("login");
      }
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        className="fade-in"
        style={{
          width: "100%",
          maxWidth: 380,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "baseline",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: "-1px",
                color: "var(--accent)",
              }}
            >
              Focus
            </span>
            <span
              style={{ fontSize: 32, fontWeight: 400, color: "var(--text2)" }}
            >
              Board
            </span>
          </div>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--text3)",
            }}
          >
            Your personal productivity space
          </p>
        </div>

        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border2)",
            borderRadius: 16,
            padding: 28,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              background: "var(--surface2)",
              borderRadius: 8,
              padding: 3,
              gap: 3,
            }}
          >
            {["login", "signup"].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
                  setSuccess("");
                }}
                style={{
                  flex: 1,
                  padding: "7px 0",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: mode === m ? 700 : 400,
                  background: mode === m ? "var(--surface3)" : "transparent",
                  color: mode === m ? "var(--text)" : "var(--text3)",
                  border:
                    mode === m
                      ? "1px solid var(--border2)"
                      : "1px solid transparent",
                }}
              >
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          <ErrorBanner msg={error} onClose={() => setError("")} />
          {success && (
            <div
              style={{
                background: "#7bc4a022",
                border: "1px solid #7bc4a055",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                color: "var(--green)",
              }}
            >
              {success}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text3)",
                  marginBottom: 5,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                }}
              >
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                autoFocus
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text3)",
                  marginBottom: 5,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                }}
              >
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>
          </div>

          <button
            onClick={submit}
            disabled={loading}
            style={{
              padding: "11px",
              background: loading ? "var(--accent2)" : "var(--accent)",
              color: "var(--bg)",
              borderRadius: 9,
              fontWeight: 800,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <Spinner size={16} color="var(--bg)" />
                {mode === "login" ? "Logging in…" : "Creating account…"}
              </>
            ) : mode === "login" ? (
              "Log In"
            ) : (
              "Create Account"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// TODO MODULE
// ══════════════════════════════════════════════════════════
function TodoModule({ user, onHistoryAdd }) {
  const [todos, setTodos] = useState([]);
  const [form, setForm] = useState({
    text: "",
    priority: "medium",
    due: "",
    tags: "",
  });
  const [filter, setFilter] = useState("all");
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error: e } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (e) setError(e.message);
      else setTodos(data || []);
      setLoading(false);
    };
    load();
  }, [user.id]);

  const add = async () => {
    if (!form.text.trim()) return;
    const payload = {
      user_id: user.id,
      text: form.text.trim(),
      priority: form.priority,
      due: form.due || null,
      done: false,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    const { data, error: e } = await supabase
      .from("todos")
      .insert(payload)
      .select()
      .single();
    if (e) {
      setError(e.message);
      return;
    }
    setTodos((p) => [data, ...p]);
    setForm({ text: "", priority: "medium", due: "", tags: "" });
    setAdding(false);
  };

  const toggle = async (todo) => {
    const newDone = !todo.done;
    const { error: e } = await supabase
      .from("todos")
      .update({ done: newDone })
      .eq("id", todo.id);
    if (e) {
      setError(e.message);
      return;
    }
    setTodos((p) =>
      p.map((t) => (t.id === todo.id ? { ...t, done: newDone } : t)),
    );
    if (newDone)
      onHistoryAdd({ type: "task", label: `Completed: ${todo.text}` });
  };

  const del = async (tid) => {
    const { error: e } = await supabase.from("todos").delete().eq("id", tid);
    if (e) {
      setError(e.message);
      return;
    }
    setTodos((p) => p.filter((t) => t.id !== tid));
  };

  const visible = todos
    .filter((t) =>
      filter === "all" ? true : filter === "active" ? !t.done : t.done,
    )
    .sort((a, b) => {
      const po = { high: 0, medium: 1, low: 2 };
      return po[a.priority] - po[b.priority] || (a.done ? 1 : -1);
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <ErrorBanner msg={error} onClose={() => setError("")} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "active", "done"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "5px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                background: filter === f ? "var(--accent2)" : "var(--surface2)",
                color: filter === f ? "var(--bg)" : "var(--text2)",
                border: `1px solid ${filter === f ? "var(--accent2)" : "var(--border)"}`,
                fontWeight: filter === f ? 600 : 400,
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setAdding((p) => !p)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 16px",
            background: "var(--accent)",
            color: "var(--bg)",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          <Icon d={icons.plus} size={14} /> Add Task
        </button>
      </div>

      {adding && (
        <div
          className="fade-in"
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--border2)",
            borderRadius: 12,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <input
            placeholder="Task description..."
            value={form.text}
            onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && add()}
            autoFocus
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select
              value={form.priority}
              onChange={(e) =>
                setForm((p) => ({ ...p, priority: e.target.value }))
              }
              style={{ flex: 1 }}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <input
              type="date"
              value={form.due}
              onChange={(e) => setForm((p) => ({ ...p, due: e.target.value }))}
              style={{ flex: 1 }}
            />
          </div>
          <input
            placeholder="Tags (comma separated)"
            value={form.tags}
            onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={() => setAdding(false)}
              style={{
                padding: "7px 14px",
                background: "var(--surface3)",
                color: "var(--text2)",
                borderRadius: 7,
                fontSize: 13,
              }}
            >
              Cancel
            </button>
            <button
              onClick={add}
              style={{
                padding: "7px 16px",
                background: "var(--accent)",
                color: "var(--bg)",
                borderRadius: 7,
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "40px 0",
          }}
        >
          <Spinner />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {visible.length === 0 && (
            <div
              style={{
                textAlign: "center",
                color: "var(--text3)",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                padding: "32px 0",
              }}
            >
              No tasks here
            </div>
          )}
          {visible.map((t) => (
            <div
              key={t.id}
              className="fade-in"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                background: t.done ? "var(--surface)" : "var(--surface2)",
                border: `1px solid ${t.done ? "var(--border)" : "var(--border2)"}`,
                borderRadius: 10,
                opacity: t.done ? 0.6 : 1,
                transition: "all 0.2s",
              }}
            >
              <button
                onClick={() => toggle(t)}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  flexShrink: 0,
                  border: `2px solid ${t.done ? "var(--green)" : PRIORITIES[t.priority].color}`,
                  background: t.done ? "var(--green)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {t.done && (
                  <Icon d={icons.check} size={11} stroke="var(--bg)" />
                )}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    textDecoration: t.done ? "line-through" : "none",
                    color: t.done ? "var(--text3)" : "var(--text)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {t.text}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    marginTop: 4,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: "var(--font-mono)",
                      color: PRIORITIES[t.priority].color,
                      background: PRIORITIES[t.priority].color + "22",
                      padding: "2px 7px",
                      borderRadius: 10,
                    }}
                  >
                    {PRIORITIES[t.priority].label}
                  </span>
                  {t.due && (
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: "var(--font-mono)",
                        color: "var(--text3)",
                      }}
                    >
                      Due {formatDate(t.due)}
                    </span>
                  )}
                  {(t.tags || []).map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: 10,
                        fontFamily: "var(--font-mono)",
                        color: "var(--purple)",
                        background: "#b07bc422",
                        padding: "2px 7px",
                        borderRadius: 10,
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => del(t.id)}
                style={{
                  color: "var(--text3)",
                  background: "none",
                  padding: 4,
                  borderRadius: 6,
                  flexShrink: 0,
                  display: "flex",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--red)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text3)")
                }
              >
                <Icon d={icons.trash} size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--text3)",
          textAlign: "right",
        }}
      >
        {todos.filter((t) => t.done).length}/{todos.length} completed
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// TIMETABLE MODULE
// ══════════════════════════════════════════════════════════
function TimetableModule({ user }) {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({
    day: "Mon",
    hour: "9",
    label: "",
    color: SLOT_COLORS[0],
    duration: "1",
  });
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error: e } = await supabase
        .from("timetable_slots")
        .select("*")
        .eq("user_id", user.id);
      if (e) setError(e.message);
      else setEntries(data || []);
      setLoading(false);
    };
    load();
  }, [user.id]);

  const add = async () => {
    if (!form.label.trim()) return;
    const payload = {
      user_id: user.id,
      day: form.day,
      hour: parseInt(form.hour),
      label: form.label,
      color: form.color,
      duration: parseInt(form.duration),
    };
    const { data, error: e } = await supabase
      .from("timetable_slots")
      .insert(payload)
      .select()
      .single();
    if (e) {
      setError(e.message);
      return;
    }
    setEntries((p) => [...p, data]);
    setForm((p) => ({ ...p, label: "" }));
    setAdding(false);
  };

  const del = async (eid) => {
    const { error: e } = await supabase
      .from("timetable_slots")
      .delete()
      .eq("id", eid);
    if (e) {
      setError(e.message);
      return;
    }
    setEntries((p) => p.filter((x) => x.id !== eid));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <ErrorBanner msg={error} onClose={() => setError("")} />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => setAdding((p) => !p)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 16px",
            background: "var(--accent)",
            color: "var(--bg)",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          <Icon d={icons.plus} size={14} /> Add Slot
        </button>
      </div>

      {adding && (
        <div
          className="fade-in"
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--border2)",
            borderRadius: 12,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select
              value={form.day}
              onChange={(e) => setForm((p) => ({ ...p, day: e.target.value }))}
              style={{ flex: 1 }}
            >
              {DAYS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <select
              value={form.hour}
              onChange={(e) => setForm((p) => ({ ...p, hour: e.target.value }))}
              style={{ flex: 1 }}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}:00
                </option>
              ))}
            </select>
            <select
              value={form.duration}
              onChange={(e) =>
                setForm((p) => ({ ...p, duration: e.target.value }))
              }
              style={{ flex: 1 }}
            >
              {[1, 2, 3, 4].map((d) => (
                <option key={d} value={d}>
                  {d}h
                </option>
              ))}
            </select>
          </div>
          <input
            placeholder="Activity name..."
            value={form.label}
            onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
          />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--text3)",
              }}
            >
              Color:
            </span>
            {SLOT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setForm((p) => ({ ...p, color: c }))}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: c,
                  border:
                    form.color === c
                      ? "2px solid var(--text)"
                      : "2px solid transparent",
                }}
              />
            ))}
            <div style={{ flex: 1 }} />
            <button
              onClick={() => setAdding(false)}
              style={{
                padding: "7px 14px",
                background: "var(--surface3)",
                color: "var(--text2)",
                borderRadius: 7,
                fontSize: 13,
              }}
            >
              Cancel
            </button>
            <button
              onClick={add}
              style={{
                padding: "7px 16px",
                background: "var(--accent)",
                color: "var(--bg)",
                borderRadius: 7,
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "40px 0",
          }}
        >
          <Spinner />
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <div
            style={{
              minWidth: 560,
              display: "grid",
              gridTemplateColumns: "48px repeat(7, 1fr)",
              gap: 2,
            }}
          >
            <div />
            {DAYS.map((d) => (
              <div
                key={d}
                style={{
                  textAlign: "center",
                  padding: "8px 4px",
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text2)",
                  background: "var(--surface2)",
                  borderRadius: 6,
                  fontWeight: 600,
                }}
              >
                {d}
              </div>
            ))}
            {HOURS.map((h) => (
              <span key={`row-${h}`}>
                <div
                  key={`h${h}`}
                  style={{
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                    color: "var(--text3)",
                    textAlign: "right",
                    paddingRight: 6,
                    paddingTop: 6,
                  }}
                >
                  {h}:00
                </div>
                {DAYS.map((d) => {
                  const entry = entries.find(
                    (e) => e.day === d && e.hour === h,
                  );
                  return (
                    <div
                      key={`${d}${h}`}
                      style={{
                        height: 36,
                        borderRadius: 5,
                        position: "relative",
                        background: entry
                          ? entry.color + "22"
                          : "var(--surface)",
                        border: entry
                          ? `1px solid ${entry.color}55`
                          : "1px solid var(--border)",
                        overflow: "hidden",
                      }}
                    >
                      {entry && (
                        <div
                          style={{
                            padding: "3px 6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            height: "100%",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              fontFamily: "var(--font-mono)",
                              color: entry.color,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              flex: 1,
                            }}
                          >
                            {entry.label}
                          </span>
                          <button
                            onClick={() => del(entry.id)}
                            style={{
                              background: "none",
                              color: entry.color + "88",
                              padding: 1,
                              display: "flex",
                              flexShrink: 0,
                            }}
                          >
                            <Icon d={icons.x} size={9} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// NOTES MODULE
// ══════════════════════════════════════════════════════════
function NotesModule({ user }) {
  const [notes, setNotes] = useState([]);
  const [draft, setDraft] = useState("");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error: e } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (e) setError(e.message);
      else setNotes(data || []);
      setLoading(false);
    };
    load();
  }, [user.id]);

  const add = async () => {
    if (!draft.trim()) return;
    const { data, error: e } = await supabase
      .from("notes")
      .insert({ user_id: user.id, text: draft.trim(), pinned: false })
      .select()
      .single();
    if (e) {
      setError(e.message);
      return;
    }
    setNotes((p) => [data, ...p]);
    setDraft("");
  };

  const del = async (nid) => {
    const { error: e } = await supabase.from("notes").delete().eq("id", nid);
    if (e) {
      setError(e.message);
      return;
    }
    setNotes((p) => p.filter((n) => n.id !== nid));
  };

  const pin = async (note) => {
    const { error: e } = await supabase
      .from("notes")
      .update({ pinned: !note.pinned })
      .eq("id", note.id);
    if (e) {
      setError(e.message);
      return;
    }
    setNotes((p) =>
      p
        .map((n) => (n.id === note.id ? { ...n, pinned: !n.pinned } : n))
        .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)),
    );
  };

  const saveEdit = async () => {
    const { error: e } = await supabase
      .from("notes")
      .update({ text: editText })
      .eq("id", editId);
    if (e) {
      setError(e.message);
      return;
    }
    setNotes((p) =>
      p.map((n) => (n.id === editId ? { ...n, text: editText } : n)),
    );
    setEditId(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <ErrorBanner msg={error} onClose={() => setError("")} />
      <div style={{ display: "flex", gap: 8 }}>
        <textarea
          placeholder="Jot something down… (Ctrl+Enter to save)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          style={{ resize: "vertical" }}
          onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && add()}
        />
        <button
          onClick={add}
          style={{
            padding: "0 16px",
            background: "var(--accent)",
            color: "var(--bg)",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            flexShrink: 0,
            alignSelf: "stretch",
          }}
        >
          Add
        </button>
      </div>
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "40px 0",
          }}
        >
          <Spinner />
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 10,
          }}
        >
          {notes.map((n) => (
            <div
              key={n.id}
              className="fade-in"
              style={{
                background: n.pinned ? "#e8d5a308" : "var(--surface2)",
                border: `1px solid ${n.pinned ? "var(--accent2)" : "var(--border)"}`,
                borderRadius: 10,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {editId === n.id ? (
                <>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={4}
                    style={{ resize: "none", fontSize: 13 }}
                    autoFocus
                  />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={saveEdit}
                      style={{
                        flex: 1,
                        padding: "6px",
                        background: "var(--accent)",
                        color: "var(--bg)",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      style={{
                        flex: 1,
                        padding: "6px",
                        background: "var(--surface3)",
                        color: "var(--text2)",
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p
                    style={{
                      fontSize: 13,
                      fontFamily: "var(--font-mono)",
                      color: "var(--text)",
                      lineHeight: 1.6,
                      flex: 1,
                    }}
                  >
                    {n.text}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: "var(--font-mono)",
                        color: "var(--text3)",
                      }}
                    >
                      {formatDate(n.created_at)}
                    </span>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        onClick={() => pin(n)}
                        style={{
                          background: "none",
                          color: n.pinned ? "var(--accent2)" : "var(--text3)",
                          padding: 3,
                          display: "flex",
                        }}
                      >
                        <Icon
                          d={icons.pin}
                          size={13}
                          fill={n.pinned ? "var(--accent2)" : "none"}
                        />
                      </button>
                      <button
                        onClick={() => {
                          setEditId(n.id);
                          setEditText(n.text);
                        }}
                        style={{
                          background: "none",
                          color: "var(--text3)",
                          padding: 3,
                          display: "flex",
                        }}
                      >
                        <Icon d={icons.edit} size={13} />
                      </button>
                      <button
                        onClick={() => del(n.id)}
                        style={{
                          background: "none",
                          color: "var(--text3)",
                          padding: 3,
                          display: "flex",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "var(--red)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "var(--text3)")
                        }
                      >
                        <Icon d={icons.trash} size={13} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// TIMER MODULE
// ══════════════════════════════════════════════════════════
function TimerModule({ user, onHistoryAdd }) {
  const [settings, setSettings] = useState({
    work: 25,
    shortBreak: 5,
    longBreak: 15,
  });
  const [mode, setMode] = useState("work");
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef(null);

  const modeConfig = {
    work: { label: "Focus", color: "var(--accent)", duration: settings.work },
    shortBreak: {
      label: "Short Break",
      color: "var(--green)",
      duration: settings.shortBreak,
    },
    longBreak: {
      label: "Long Break",
      color: "var(--blue)",
      duration: settings.longBreak,
    },
  };

  const logSession = useCallback(
    async (minutes) => {
      const label = `Focus session: ${minutes} min`;
      await supabase
        .from("history")
        .insert({ user_id: user.id, type: "timer", label, time: nowISO() });
      onHistoryAdd({ type: "timer", label });
    },
    [user.id, onHistoryAdd],
  );

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (mode === "work") {
              setSessions((prev) => {
                const newS = prev + 1;
                logSession(settings.work);
                setMode(newS % 4 === 0 ? "longBreak" : "shortBreak");
                setSeconds(
                  (newS % 4 === 0 ? settings.longBreak : settings.shortBreak) *
                    60,
                );
                return newS;
              });
            } else {
              setMode("work");
              setSeconds(settings.work * 60);
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, mode, settings, logSession]);

  const reset = () => {
    setRunning(false);
    clearInterval(intervalRef.current);
    setSeconds(modeConfig[mode].duration * 60);
  };
  const switchMode = (m) => {
    setMode(m);
    setRunning(false);
    clearInterval(intervalRef.current);
    setSeconds(modeConfig[m].duration * 60);
  };

  const cfg = modeConfig[mode];
  const total = cfg.duration * 60;
  const progress = (total - seconds) / total;
  const r = 88;
  const circ = 2 * Math.PI * r;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        {Object.entries(modeConfig).map(([k, v]) => (
          <button
            key={k}
            onClick={() => switchMode(k)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              background: mode === k ? cfg.color + "22" : "var(--surface2)",
              color: mode === k ? cfg.color : "var(--text3)",
              border: `1px solid ${mode === k ? cfg.color + "55" : "var(--border)"}`,
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div style={{ position: "relative", width: 220, height: 220 }}>
        <svg width="220" height="220" style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx="110"
            cy="110"
            r={r}
            fill="none"
            stroke="var(--surface2)"
            strokeWidth="6"
          />
          <circle
            cx="110"
            cy="110"
            r={r}
            fill="none"
            stroke={cfg.color}
            strokeWidth="6"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - progress)}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.9s ease, stroke 0.3s" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 800,
              letterSpacing: "-2px",
              fontFamily: "var(--font-mono)",
              color: cfg.color,
            }}
          >
            {formatTime(seconds)}
          </div>
          <div
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "var(--text3)",
              marginTop: 4,
            }}
          >
            {cfg.label}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button
          onClick={reset}
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            color: "var(--text2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon d={icons.reset} size={16} />
        </button>
        <button
          onClick={() => setRunning((p) => !p)}
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: cfg.color,
            color: "var(--bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 24px ${cfg.color}44`,
          }}
        >
          <Icon
            d={running ? icons.pause : icons.play}
            size={22}
            fill="var(--bg)"
            stroke="none"
          />
        </button>
        <button
          onClick={() => setShowSettings((p) => !p)}
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            color: "var(--text2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
          }}
        >
          ⚙
        </button>
      </div>

      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--text3)",
        }}
      >
        Sessions today:{" "}
        <span style={{ color: cfg.color, fontWeight: 600 }}>{sessions}</span>
      </div>

      {showSettings && (
        <div
          className="fade-in"
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--border2)",
            borderRadius: 12,
            padding: 16,
            width: "100%",
            maxWidth: 320,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 13,
              marginBottom: 12,
              color: "var(--text2)",
            }}
          >
            Timer Settings
          </div>
          {[
            ["work", "Focus (min)"],
            ["shortBreak", "Short Break (min)"],
            ["longBreak", "Long Break (min)"],
          ].map(([k, label]) => (
            <div
              key={k}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--text2)",
                }}
              >
                {label}
              </span>
              <input
                type="number"
                value={settings[k]}
                min={1}
                max={90}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setSettings((p) => ({ ...p, [k]: val }));
                  if (!running && mode === k) setSeconds(val * 60);
                }}
                style={{ width: 64, textAlign: "center" }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// HISTORY MODULE
// ══════════════════════════════════════════════════════════
function HistoryModule({ user, refreshSignal }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error: e } = await supabase
        .from("history")
        .select("*")
        .eq("user_id", user.id)
        .order("time", { ascending: false })
        .limit(100);
      if (e) setError(e.message);
      else setHistory(data || []);
      setLoading(false);
    };
    load();
  }, [user.id, refreshSignal]);

  const typeConfig = {
    task: { color: "var(--green)", icon: icons.check },
    timer: { color: "var(--accent2)", icon: icons.clock },
    note: { color: "var(--blue)", icon: icons.notes },
  };

  const grouped = history.reduce((acc, item) => {
    const day = new Date(item.time).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <ErrorBanner msg={error} onClose={() => setError("")} />
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "40px 0",
          }}
        >
          <Spinner />
        </div>
      ) : history.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 0",
            color: "var(--text3)",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
          }}
        >
          Complete tasks or finish focus sessions to see history here.
        </div>
      ) : (
        Object.entries(grouped).map(([day, items]) => (
          <div key={day}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--text3)",
                marginBottom: 8,
                paddingBottom: 6,
                borderBottom: "1px solid var(--border)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {day}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {items.map((item) => {
                const cfg = typeConfig[item.type] || typeConfig.note;
                return (
                  <div
                    key={item.id}
                    className="fade-in"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 14px",
                      background: "var(--surface2)",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: cfg.color + "22",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon d={cfg.icon} size={13} stroke={cfg.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: "var(--text)" }}>
                        {item.label}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          fontFamily: "var(--font-mono)",
                          color: "var(--text3)",
                          marginTop: 2,
                        }}
                      >
                        {new Date(item.time).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: "var(--font-mono)",
                        color: cfg.color,
                        background: cfg.color + "22",
                        padding: "3px 9px",
                        borderRadius: 10,
                      }}
                    >
                      {item.type}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════
export default function FocusBoard() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState("todo");
  const [historyRefresh, setHistoryRefresh] = useState(0);

  // Restore session on mount & listen for auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Called by Todo & Timer when they write a history row
  const handleHistoryAdd = useCallback(() => {
    setHistoryRefresh((n) => n + 1);
  }, []);

  const logout = async () => await supabase.auth.signOut();

  const tabIcon = {
    todo: icons.todo,
    timetable: icons.timetable,
    notes: icons.notes,
    timer: icons.timer,
    history: icons.history,
  };

  // ── Loading splash ──
  if (authLoading)
    return (
      <>
        <GlobalStyles />
        <div
          style={{
            minHeight: "100vh",
            background: "var(--bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spinner size={32} />
        </div>
      </>
    );

  // ── Auth wall ──
  if (!user)
    return (
      <>
        <GlobalStyles />
        <AuthScreen onAuth={setUser} />
      </>
    );

  // ── Authenticated app ──
  const modules = {
    todo: <TodoModule user={user} onHistoryAdd={handleHistoryAdd} />,
    timetable: <TimetableModule user={user} />,
    notes: <NotesModule user={user} />,
    timer: <TimerModule user={user} onHistoryAdd={handleHistoryAdd} />,
    history: <HistoryModule user={user} refreshSignal={historyRefresh} />,
  };

  return (
    <>
      <GlobalStyles />
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── Header ── */}
        <header
          style={{
            padding: "14px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 100,
            background: "var(--bg)",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span
              style={{
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: "-0.5px",
                color: "var(--accent)",
              }}
            >
              Focus
            </span>
            <span
              style={{ fontSize: 20, fontWeight: 400, color: "var(--text2)" }}
            >
              Board
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Icon d={icons.user} size={13} stroke="var(--text3)" />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text3)",
                  maxWidth: 200,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.email}
              </span>
            </div>
            <button
              onClick={logout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                color: "var(--text2)",
                borderRadius: 8,
                fontSize: 12,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--red)";
                e.currentTarget.style.color = "var(--red)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text2)";
              }}
            >
              <Icon d={icons.logout} size={13} /> Log out
            </button>
          </div>
        </header>

        <div style={{ display: "flex", flex: 1 }}>
          {/* ── Sidebar ── */}
          <nav
            style={{
              width: 200,
              borderRight: "1px solid var(--border)",
              padding: "20px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              flexShrink: 0,
            }}
          >
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background:
                    tab === item.id ? "var(--surface2)" : "transparent",
                  color: tab === item.id ? "var(--accent)" : "var(--text2)",
                  fontSize: 14,
                  fontWeight: tab === item.id ? 700 : 400,
                  border: `1px solid ${tab === item.id ? "var(--border2)" : "transparent"}`,
                  textAlign: "left",
                  transition: "all 0.15s",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  if (tab !== item.id)
                    e.currentTarget.style.background = "var(--surface)";
                }}
                onMouseLeave={(e) => {
                  if (tab !== item.id)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                <Icon
                  d={tabIcon[item.id]}
                  size={15}
                  stroke={tab === item.id ? "var(--accent)" : "var(--text3)"}
                />
                {item.label}
              </button>
            ))}
            <div
              style={{
                marginTop: "auto",
                paddingTop: 16,
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--text3)",
                paddingLeft: 12,
              }}
            >
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
          </nav>

          {/* ── Main ── */}
          <main
            style={{
              flex: 1,
              padding: "24px 28px",
              overflowY: "auto",
              maxWidth: 860,
            }}
          >
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                marginBottom: 20,
                color: "var(--text)",
              }}
            >
              {NAV_ITEMS.find((n) => n.id === tab)?.label}
            </h1>
            {modules[tab]}
          </main>
        </div>
      </div>
    </>
  );
}
