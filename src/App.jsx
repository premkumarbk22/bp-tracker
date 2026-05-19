import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

// ─── Supabase client ────────────────────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const classify = (sys, dia) => {
  if (sys < 120 && dia <= 80) return { label: "Normal", color: "#16a34a" };
  if (sys < 130 && dia <= 80) return { label: "Elevated", color: "#ca8a04" };
  if (sys < 140 || dia < 90) return { label: "High Stage 1", color: "#ea580c" };
  return { label: "High Stage 2", color: "#dc2626" };
};

const fmt = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-MY", { month: "short", day: "numeric" });
};

const fmtFull = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString("en-MY", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen() {
  const [mode, setMode]   = useState("login"); // login | signup | reset
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [msg,   setMsg]   = useState({ text: "", ok: true });
  const [busy,  setBusy]  = useState(false);

  const submit = async () => {
    setBusy(true); setMsg({ text: "", ok: true });
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password: pass });
      if (error) setMsg({ text: error.message, ok: false });
      else setMsg({ text: "Check your email for a confirmation link.", ok: true });
    } else if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) setMsg({ text: error.message, ok: false });
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) setMsg({ text: error.message, ok: false });
      else setMsg({ text: "Password reset email sent.", ok: true });
    }
    setBusy(false);
  };

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "1.5rem",
      background: "linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)",
    }}>
      <div style={{
        width: "100%", maxWidth: 420,
        background: "#fff", borderRadius: 20,
        boxShadow: "0 4px 32px rgba(80,60,180,0.10)",
        padding: "2.5rem 2rem",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "linear-gradient(135deg, #6d28d9, #4f46e5)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: "1rem",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1e1b4b" }}>PressureLog</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#6b7280" }}>Your private blood pressure journal</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: "1.5rem", background: "#f3f4f6", borderRadius: 10, padding: 4 }}>
          {["login","signup"].map(m => (
            <button key={m} onClick={() => { setMode(m); setMsg({ text:"", ok:true }); }} style={{
              flex: 1, padding: "8px 0", borderRadius: 7, border: "none", cursor: "pointer",
              fontWeight: 600, fontSize: 14,
              background: mode === m ? "#fff" : "transparent",
              color: mode === m ? "#4f46e5" : "#6b7280",
              boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s",
            }}>
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email" placeholder="Email address" value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
          />
          {mode !== "reset" && (
            <input
              type="password" placeholder="Password" value={pass}
              onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              style={inputStyle}
            />
          )}

          {msg.text && (
            <div style={{
              padding: "10px 14px", borderRadius: 8, fontSize: 13,
              background: msg.ok ? "#f0fdf4" : "#fef2f2",
              color: msg.ok ? "#166534" : "#991b1b",
              border: `1px solid ${msg.ok ? "#bbf7d0" : "#fecaca"}`,
            }}>{msg.text}</div>
          )}

          <button onClick={submit} disabled={busy} style={{
            padding: "12px", borderRadius: 10, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, #6d28d9, #4f46e5)",
            color: "#fff", fontWeight: 700, fontSize: 15,
            opacity: busy ? 0.7 : 1, marginTop: 4,
          }}>
            {busy ? "Please wait…" : mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
          </button>

          {mode === "login" && (
            <button onClick={() => setMode("reset")} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#6d28d9", fontSize: 13, textAlign: "center", padding: "4px 0",
            }}>Forgot password?</button>
          )}
          {mode === "reset" && (
            <button onClick={() => setMode("login")} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#6b7280", fontSize: 13, textAlign: "center", padding: "4px 0",
            }}>← Back to sign in</button>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "11px 14px", borderRadius: 10,
  border: "1.5px solid #e5e7eb", fontSize: 15, outline: "none",
  boxSizing: "border-box", transition: "border-color 0.15s",
  fontFamily: "inherit",
};

// ─── Entry Form ───────────────────────────────────────────────────────────────
function EntryForm({ onSaved, user }) {
  const now = new Date();
  const localDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const localTime = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;

  const [fields, setFields] = useState({ date: localDate, time: localTime, systolic: "", diastolic: "", heart_rate: "", notes: "" });
  const [busy, setBusy]     = useState(false);
  const [err,  setErr]      = useState("");

  const set = (k, v) => setFields(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!fields.systolic || !fields.diastolic) { setErr("Systolic and diastolic are required."); return; }
    setBusy(true); setErr("");
    const measured_at = new Date(`${fields.date}T${fields.time}`).toISOString();
    const { error } = await supabase.from("bp_readings").insert({
      user_id: user.id,
      measured_at,
      systolic:   parseInt(fields.systolic),
      diastolic:  parseInt(fields.diastolic),
      heart_rate: fields.heart_rate ? parseInt(fields.heart_rate) : null,
      notes:      fields.notes || null,
    });
    setBusy(false);
    if (error) setErr(error.message);
    else { setFields(f => ({ ...f, systolic: "", diastolic: "", heart_rate: "", notes: "" })); onSaved(); }
  };

  const c = fields.systolic && fields.diastolic ? classify(+fields.systolic, +fields.diastolic) : null;

  return (
    <div style={card}>
      <h2 style={sectionTitle}>Log Reading</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label style={labelStyle}>
          Date
          <input type="date" value={fields.date} onChange={e => set("date", e.target.value)} style={formInput} />
        </label>
        <label style={labelStyle}>
          Time
          <input type="time" value={fields.time} onChange={e => set("time", e.target.value)} style={formInput} />
        </label>
        <label style={labelStyle}>
          Systolic (mmHg) *
          <input type="number" min="60" max="250" placeholder="120" value={fields.systolic} onChange={e => set("systolic", e.target.value)} style={formInput} />
        </label>
        <label style={labelStyle}>
          Diastolic (mmHg) *
          <input type="number" min="40" max="150" placeholder="80" value={fields.diastolic} onChange={e => set("diastolic", e.target.value)} style={formInput} />
        </label>
        <label style={labelStyle}>
          Heart Rate (bpm)
          <input type="number" min="30" max="220" placeholder="72" value={fields.heart_rate} onChange={e => set("heart_rate", e.target.value)} style={formInput} />
        </label>
        <label style={labelStyle}>
          Notes
          <input type="text" placeholder="Optional note…" value={fields.notes} onChange={e => set("notes", e.target.value)} style={formInput} />
        </label>
      </div>

      {c && (
        <div style={{
          marginTop: 12, padding: "8px 14px", borderRadius: 8,
          background: c.color + "18", border: `1px solid ${c.color}44`,
          color: c.color, fontWeight: 600, fontSize: 14, display: "inline-block",
        }}>
          Classification: {c.label}
        </div>
      )}

      {err && <p style={{ color: "#dc2626", fontSize: 13, marginTop: 8 }}>{err}</p>}

      <button onClick={save} disabled={busy} style={{
        marginTop: 16, width: "100%", padding: "12px", borderRadius: 10,
        border: "none", cursor: "pointer",
        background: "linear-gradient(135deg, #6d28d9, #4f46e5)",
        color: "#fff", fontWeight: 700, fontSize: 15,
        opacity: busy ? 0.7 : 1,
      }}>
        {busy ? "Saving…" : "Save Reading"}
      </button>
    </div>
  );
}

const card       = { background: "#fff", borderRadius: 16, padding: "1.5rem", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", marginBottom: "1.5rem" };
const sectionTitle = { margin: "0 0 1rem", fontSize: 17, fontWeight: 700, color: "#1e1b4b" };
const labelStyle = { display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 600, color: "#374151" };
const formInput  = { marginTop: 2, padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 15, outline: "none", fontFamily: "inherit", boxSizing: "border-box", width: "100%" };

// ─── Chart ────────────────────────────────────────────────────────────────────
function BPChart({ data }) {
  const chartData = [...data].reverse().slice(-30).map(r => ({
    date: fmt(r.measured_at),
    Systolic:  r.systolic,
    Diastolic: r.diastolic,
    Pulse:     r.heart_rate,
  }));

  if (!chartData.length) return null;

  return (
    <div style={card}>
      <h2 style={sectionTitle}>Trend (last 30 readings)</h2>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis domain={[50, 180]} tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ borderRadius: 10, fontSize: 13 }} />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <ReferenceLine y={120} stroke="#16a34a" strokeDasharray="4 2" label={{ value: "Normal", position: "insideTopRight", fontSize: 11, fill: "#16a34a" }} />
          <ReferenceLine y={140} stroke="#ea580c" strokeDasharray="4 2" label={{ value: "Stage 1", position: "insideTopRight", fontSize: 11, fill: "#ea580c" }} />
          <Line type="monotone" dataKey="Systolic"  stroke="#6d28d9" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="Diastolic" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="Pulse"     stroke="#ec4899" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="4 2" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── History Table ────────────────────────────────────────────────────────────
function HistoryTable({ data, onDelete }) {
  return (
    <div style={card}>
      <h2 style={sectionTitle}>History ({data.length} readings)</h2>
      {data.length === 0 && <p style={{ color: "#6b7280", fontSize: 14 }}>No readings yet. Add your first one above!</p>}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
              {["Date & Time","Sys","Dia","HR","Classification","Notes",""].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 6px", color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => {
              const c = classify(r.systolic, r.diastolic);
              return (
                <tr key={r.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "10px 6px", whiteSpace: "nowrap", color: "#374151" }}>{fmtFull(r.measured_at)}</td>
                  <td style={{ padding: "10px 6px", fontWeight: 700, color: "#1e1b4b" }}>{r.systolic}</td>
                  <td style={{ padding: "10px 6px", fontWeight: 700, color: "#1e1b4b" }}>{r.diastolic}</td>
                  <td style={{ padding: "10px 6px", color: "#6b7280" }}>{r.heart_rate ?? "—"}</td>
                  <td style={{ padding: "10px 6px" }}>
                    <span style={{
                      padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                      background: c.color + "18", color: c.color,
                    }}>{c.label}</span>
                  </td>
                  <td style={{ padding: "10px 6px", color: "#6b7280", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.notes ?? "—"}</td>
                  <td style={{ padding: "10px 6px" }}>
                    <button onClick={() => onDelete(r.id)} title="Delete" style={{
                      background: "none", border: "none", cursor: "pointer", color: "#f87171",
                      fontSize: 16, padding: "0 4px",
                    }}>✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Export / Summary ─────────────────────────────────────────────────────────
function exportSummary(data, user) {
  if (!data.length) return;
  const avg = (arr) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  const avgSys = avg(data.map(r => r.systolic));
  const avgDia = avg(data.map(r => r.diastolic));
  const avgHR  = data.filter(r => r.heart_rate).length
    ? avg(data.filter(r => r.heart_rate).map(r => r.heart_rate)) : null;
  const recent = data.slice(0, 10);
  const c = classify(avgSys, avgDia);

  const lines = [
    "BLOOD PRESSURE SUMMARY REPORT",
    "================================",
    `Patient Email : ${user.email}`,
    `Generated     : ${new Date().toLocaleString("en-MY")}`,
    `Total Readings: ${data.length}`,
    `Date Range    : ${fmt(data[data.length-1].measured_at)} – ${fmt(data[0].measured_at)}`,
    "",
    "AVERAGES",
    "--------",
    `Average Systolic  : ${avgSys} mmHg`,
    `Average Diastolic : ${avgDia} mmHg`,
    avgHR ? `Average Heart Rate: ${avgHR} bpm` : "",
    `Classification    : ${c.label}`,
    "",
    "LAST 10 READINGS",
    "----------------",
    "Date & Time               Sys   Dia   HR    Classification",
    ...recent.map(r => {
      const cc = classify(r.systolic, r.diastolic);
      return `${fmtFull(r.measured_at).padEnd(26)}${String(r.systolic).padEnd(6)}${String(r.diastolic).padEnd(6)}${String(r.heart_rate ?? "—").padEnd(6)}${cc.label}`;
    }),
    "",
    "Note: This report is for informational purposes only.",
    "Please discuss results with your healthcare provider.",
  ].join("\n");

  const blob = new Blob([lines], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `bp-summary-${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar({ data }) {
  if (!data.length) return null;
  const avg = (arr) => Math.round(arr.reduce((a,b) => a+b, 0) / arr.length);
  const avgSys = avg(data.map(r => r.systolic));
  const avgDia = avg(data.map(r => r.diastolic));
  const last   = data[0];
  const c      = classify(avgSys, avgDia);

  const stats = [
    { label: "Avg Systolic",  value: avgSys, unit: "mmHg" },
    { label: "Avg Diastolic", value: avgDia, unit: "mmHg" },
    { label: "Latest",        value: `${last.systolic}/${last.diastolic}`, unit: "mmHg" },
    { label: "Status",        value: c.label, color: c.color },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
      {stats.map(s => (
        <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "1rem", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "#6b7280", fontWeight: 600 }}>{s.label}</p>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: s.color ?? "#1e1b4b" }}>
            {s.value} <span style={{ fontSize: 12, fontWeight: 400, color: "#9ca3af" }}>{s.unit}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [readings, setReadings] = useState([]);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const fetchReadings = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const { data } = await supabase
      .from("bp_readings")
      .select("*")
      .order("measured_at", { ascending: false });
    setReadings(data ?? []);
    setLoading(false);
  }, [session]);

  useEffect(() => { fetchReadings(); }, [fetchReadings]);

  const deleteReading = async (id) => {
    if (!confirm("Delete this reading?")) return;
    await supabase.from("bp_readings").delete().eq("id", id);
    fetchReadings();
  };

  if (session === undefined) {
    return <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>Loading…</div>;
  }

  if (!session) return <AuthScreen />;

  return (
    <div style={{ minHeight: "100dvh", background: "#f5f3ff" }}>
      {/* Header */}
      <header style={{
        background: "linear-gradient(135deg, #6d28d9, #4f46e5)",
        padding: "1rem 1.5rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 10,
        boxShadow: "0 2px 12px rgba(79,70,229,0.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>PressureLog</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {readings.length > 0 && (
            <button onClick={() => exportSummary(readings, session.user)} style={{
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600,
            }}>
              Export
            </button>
          )}
          <button onClick={() => supabase.auth.signOut()} style={{
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
            color: "#fff", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13,
          }}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Body */}
      <main style={{ maxWidth: 780, margin: "0 auto", padding: "1.5rem 1rem" }}>
        {readings.length > 0 && <StatsBar data={readings} />}
        <EntryForm onSaved={fetchReadings} user={session.user} />
        {readings.length > 1 && <BPChart data={readings} />}
        {loading
          ? <p style={{ color: "#6b7280", textAlign: "center" }}>Loading readings…</p>
          : <HistoryTable data={readings} onDelete={deleteReading} />
        }
      </main>
    </div>
  );
}
