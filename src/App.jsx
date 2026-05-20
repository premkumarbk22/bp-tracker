import { useState, useEffect, useCallback } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { createClient } from "@supabase/supabase-js";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

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

// ─── Theme ────────────────────────────────────────────────────────────────────
const light = {
  bg: "#f5f3ff", card: "#fff", text: "#1e1b4b", sub: "#6b7280",
  border: "#e5e7eb", input: "#fff", inputBorder: "#e5e7eb",
  headerBg: "linear-gradient(135deg, #6d28d9, #4f46e5)",
  statBg: "#fff", altRow: "#fafafa",
};
const dark = {
  bg: "#0f0e1a", card: "#1a1829", text: "#e0d7ff", sub: "#9ca3af",
  border: "#2e2b45", input: "#12111f", inputBorder: "#3b3660",
  headerBg: "linear-gradient(135deg, #3b0764, #1e1b4b)",
  statBg: "#1a1829", altRow: "#15131f",
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
function AuthScreen({ theme: t }) {
  const [mode, setMode]   = useState("login");
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
      background: t.bg,
    }}>
      <div style={{
        width: "100%", maxWidth: 420, background: t.card, borderRadius: 20,
        boxShadow: "0 4px 32px rgba(80,60,180,0.10)", padding: "2.5rem 2rem",
      }}>
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
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: t.text }}>PressureLog</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: t.sub }}>Your private blood pressure journal</p>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: "1.5rem", background: t.bg, borderRadius: 10, padding: 4 }}>
          {["login","signup"].map(m => (
            <button key={m} onClick={() => { setMode(m); setMsg({ text:"", ok:true }); }} style={{
              flex: 1, padding: "8px 0", borderRadius: 7, border: "none", cursor: "pointer",
              fontWeight: 600, fontSize: 14,
              background: mode === m ? t.card : "transparent",
              color: mode === m ? "#4f46e5" : t.sub,
              boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s",
            }}>
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="email" placeholder="Email address" value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ ...inputBase, background: t.input, color: t.text, border: `1.5px solid ${t.inputBorder}` }} />
          {mode !== "reset" && (
            <input type="password" placeholder="Password" value={pass}
              onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              style={{ ...inputBase, background: t.input, color: t.text, border: `1.5px solid ${t.inputBorder}` }} />
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
            <button onClick={() => setMode("reset")} style={{ background: "none", border: "none", cursor: "pointer", color: "#6d28d9", fontSize: 13, textAlign: "center", padding: "4px 0" }}>Forgot password?</button>
          )}
          {mode === "reset" && (
            <button onClick={() => setMode("login")} style={{ background: "none", border: "none", cursor: "pointer", color: t.sub, fontSize: 13, textAlign: "center", padding: "4px 0" }}>← Back to sign in</button>
          )}
        </div>
      </div>
    </div>
  );
}

const inputBase = { width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

// ─── Family Profile Selector ──────────────────────────────────────────────────
function ProfileSelector({ profiles, activeProfile, onSelect, onAdd, onDelete, t }) {
  const [adding, setAdding] = useState(false);
  const [name,   setName]   = useState("");

  const save = async () => {
    if (!name.trim()) return;
    await onAdd(name.trim());
    setName(""); setAdding(false);
  };

  return (
    <div style={{ background: t.card, borderRadius: 16, padding: "1.2rem 1.5rem", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: t.text }}>👨‍👩‍👧 Family Members</h2>
        <button onClick={() => setAdding(a => !a)} style={{
          background: "linear-gradient(135deg, #6d28d9, #4f46e5)", border: "none",
          color: "#fff", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600,
        }}>+ Add</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {profiles.map(p => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button onClick={() => onSelect(p)} style={{
              padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: activeProfile?.id === p.id ? "linear-gradient(135deg, #6d28d9, #4f46e5)" : t.bg,
              color: activeProfile?.id === p.id ? "#fff" : t.text,
              boxShadow: activeProfile?.id === p.id ? "0 2px 8px rgba(109,40,217,0.3)" : "none",
            }}>{p.name}</button>
            {profiles.length > 1 && (
              <button onClick={() => onDelete(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: 14, padding: "0 2px" }}>✕</button>
            )}
          </div>
        ))}
        {profiles.length === 0 && <p style={{ color: t.sub, fontSize: 13, margin: 0 }}>No profiles yet. Add one!</p>}
      </div>
      {adding && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            autoFocus type="text" placeholder="Member name (e.g. Dad)"
            value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && save()}
            style={{ ...inputBase, flex: 1, background: t.input, color: t.text, border: `1.5px solid ${t.inputBorder}`, padding: "8px 12px" }}
          />
          <button onClick={save} style={{
            padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, #6d28d9, #4f46e5)", color: "#fff", fontWeight: 700, fontSize: 13,
          }}>Save</button>
          <button onClick={() => setAdding(false)} style={{
            padding: "8px 12px", borderRadius: 8, border: `1px solid ${t.border}`, cursor: "pointer",
            background: "transparent", color: t.sub, fontSize: 13,
          }}>Cancel</button>
        </div>
      )}
    </div>
  );
}

// ─── Entry Form ───────────────────────────────────────────────────────────────
function EntryForm({ onSaved, user, activeProfile, t }) {
  const now = new Date();
  const localDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const localTime = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  const [fields, setFields] = useState({ date: localDate, time: localTime, systolic: "", diastolic: "", heart_rate: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState("");
  const set = (k, v) => setFields(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!activeProfile) { setErr("Please select or add a family member first."); return; }
    if (!fields.systolic || !fields.diastolic) { setErr("Systolic and diastolic are required."); return; }
    setBusy(true); setErr("");
    const measured_at = new Date(`${fields.date}T${fields.time}`).toISOString();
    const { error } = await supabase.from("bp_readings").insert({
      user_id: user.id, profile_id: activeProfile.id, measured_at,
      systolic: parseInt(fields.systolic), diastolic: parseInt(fields.diastolic),
      heart_rate: fields.heart_rate ? parseInt(fields.heart_rate) : null,
      notes: fields.notes || null,
    });
    setBusy(false);
    if (error) setErr(error.message);
    else { setFields(f => ({ ...f, systolic: "", diastolic: "", heart_rate: "", notes: "" })); onSaved(); }
  };

  const c = fields.systolic && fields.diastolic ? classify(+fields.systolic, +fields.diastolic) : null;
  const fi = { ...inputBase, background: t.input, color: t.text, border: `1.5px solid ${t.inputBorder}`, padding: "9px 12px", marginTop: 2 };

  return (
    <div style={{ background: t.card, borderRadius: 16, padding: "1.5rem", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", marginBottom: "1.5rem" }}>
      <h2 style={{ margin: "0 0 1rem", fontSize: 17, fontWeight: 700, color: t.text }}>
        Log Reading {activeProfile ? `— ${activeProfile.name}` : ""}
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 600, color: t.sub }}>Date<input type="date" value={fields.date} onChange={e => set("date", e.target.value)} style={fi} /></label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 600, color: t.sub }}>Time<input type="time" value={fields.time} onChange={e => set("time", e.target.value)} style={fi} /></label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 600, color: t.sub }}>Systolic (mmHg) *<input type="number" min="60" max="250" placeholder="120" value={fields.systolic} onChange={e => set("systolic", e.target.value)} style={fi} /></label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 600, color: t.sub }}>Diastolic (mmHg) *<input type="number" min="40" max="150" placeholder="80" value={fields.diastolic} onChange={e => set("diastolic", e.target.value)} style={fi} /></label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 600, color: t.sub }}>Heart Rate (bpm)<input type="number" min="30" max="220" placeholder="72" value={fields.heart_rate} onChange={e => set("heart_rate", e.target.value)} style={fi} /></label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 600, color: t.sub }}>Notes<input type="text" placeholder="Optional note…" value={fields.notes} onChange={e => set("notes", e.target.value)} style={fi} /></label>
      </div>
      {c && (
        <div style={{ marginTop: 12, padding: "8px 14px", borderRadius: 8, background: c.color + "18", border: `1px solid ${c.color}44`, color: c.color, fontWeight: 600, fontSize: 14, display: "inline-block" }}>
          Classification: {c.label}
        </div>
      )}
      {err && <p style={{ color: "#dc2626", fontSize: 13, marginTop: 8 }}>{err}</p>}
      <button onClick={save} disabled={busy} style={{
        marginTop: 16, width: "100%", padding: "12px", borderRadius: 10, border: "none", cursor: "pointer",
        background: "linear-gradient(135deg, #6d28d9, #4f46e5)", color: "#fff", fontWeight: 700, fontSize: 15, opacity: busy ? 0.7 : 1,
      }}>
        {busy ? "Saving…" : "Save Reading"}
      </button>
    </div>
  );
}

// ─── Chart ────────────────────────────────────────────────────────────────────
function BPChart({ data, t }) {
  const chartData = [...data].reverse().slice(-30).map(r => ({
    date: fmt(r.measured_at), Systolic: r.systolic, Diastolic: r.diastolic, Pulse: r.heart_rate,
  }));
  if (!chartData.length) return null;
  return (
    <div style={{ background: t.card, borderRadius: 16, padding: "1.5rem", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", marginBottom: "1.5rem" }}>
      <h2 style={{ margin: "0 0 1rem", fontSize: 17, fontWeight: 700, color: t.text }}>Trend (last 30 readings)</h2>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: t.sub }} />
          <YAxis domain={[50, 180]} tick={{ fontSize: 11, fill: t.sub }} />
          <Tooltip contentStyle={{ borderRadius: 10, fontSize: 13, background: t.card, color: t.text, border: `1px solid ${t.border}` }} />
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
function HistoryTable({ data, onDelete, t }) {
  return (
    <div style={{ background: t.card, borderRadius: 16, padding: "1.5rem", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", marginBottom: "1.5rem" }}>
      <h2 style={{ margin: "0 0 1rem", fontSize: 17, fontWeight: 700, color: t.text }}>History ({data.length} readings)</h2>
      {data.length === 0 && <p style={{ color: t.sub, fontSize: 14 }}>No readings yet. Add your first one above!</p>}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${t.border}` }}>
              {["Date & Time","Sys","Dia","HR","Classification","Notes",""].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 6px", color: t.sub, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => {
              const c = classify(r.systolic, r.diastolic);
              return (
                <tr key={r.id} style={{ borderBottom: `1px solid ${t.border}`, background: i % 2 === 0 ? t.card : t.altRow }}>
                  <td style={{ padding: "10px 6px", whiteSpace: "nowrap", color: t.text }}>{fmtFull(r.measured_at)}</td>
                  <td style={{ padding: "10px 6px", fontWeight: 700, color: t.text }}>{r.systolic}</td>
                  <td style={{ padding: "10px 6px", fontWeight: 700, color: t.text }}>{r.diastolic}</td>
                  <td style={{ padding: "10px 6px", color: t.sub }}>{r.heart_rate ?? "—"}</td>
                  <td style={{ padding: "10px 6px" }}>
                    <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: c.color + "18", color: c.color }}>{c.label}</span>
                  </td>
                  <td style={{ padding: "10px 6px", color: t.sub, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.notes ?? "—"}</td>
                  <td style={{ padding: "10px 6px" }}>
                    <button onClick={() => onDelete(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: 16, padding: "0 4px" }}>✕</button>
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

// ─── Export PDF ───────────────────────────────────────────────────────────────
function exportSummary(data, user, profileName) {
  if (!data.length) return;
  const patientName = prompt("Enter patient name for the report:") || profileName || user.email;
  const doc = new jsPDF();
  const avg = (arr) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  const avgSys = avg(data.map(r => r.systolic));
  const avgDia = avg(data.map(r => r.diastolic));
  const avgHR  = data.filter(r => r.heart_rate).length ? avg(data.filter(r => r.heart_rate).map(r => r.heart_rate)) : null;
  const c = classify(avgSys, avgDia);

  doc.setFillColor(109, 40, 217);
  doc.rect(0, 0, 210, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22); doc.setFont("helvetica", "bold");
  doc.text("PressureLog", 14, 15);
  doc.setFontSize(11); doc.setFont("helvetica", "normal");
  doc.text("Blood Pressure Summary Report", 14, 24);
  doc.text(`Generated: ${new Date().toLocaleString("en-MY")}`, 14, 31);

  doc.setTextColor(30, 27, 75); doc.setFontSize(11);
  doc.text(`Patient: ${patientName}`, 14, 48);
  doc.text(`Total Readings: ${data.length}`, 14, 56);
  doc.text(`Date Range: ${fmt(data[data.length-1].measured_at)} - ${fmt(data[0].measured_at)}`, 14, 64);

  doc.setFillColor(245, 243, 255);
  doc.roundedRect(14, 72, 182, 35, 3, 3, "F");
  doc.setFontSize(12); doc.setFont("helvetica", "bold");
  doc.text("Averages", 20, 83);
  doc.setFont("helvetica", "normal"); doc.setFontSize(11);
  doc.text(`Systolic: ${avgSys} mmHg`, 20, 92);
  doc.text(`Diastolic: ${avgDia} mmHg`, 80, 92);
  if (avgHR) doc.text(`Heart Rate: ${avgHR} bpm`, 140, 92);
  doc.setFont("helvetica", "bold");
  doc.text(`Status: ${c.label}`, 20, 101);

  doc.setFontSize(12); doc.text("Recent Readings", 14, 118);

  autoTable(doc, {
    startY: 122,
    head: [["Date & Time", "Sys", "Dia", "HR", "Classification", "Notes"]],
    body: data.slice(0, 20).map(r => {
      const cc = classify(r.systolic, r.diastolic);
      return [fmtFull(r.measured_at), r.systolic, r.diastolic, r.heart_rate ?? "-", cc.label, r.notes ?? "-"];
    }),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [109, 40, 217], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 243, 255] },
  });

  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(9); doc.setTextColor(150, 150, 150); doc.setFont("helvetica", "normal");
  doc.text("This report is for informational purposes only. Please discuss with your healthcare provider.", 14, pageHeight - 10);
  doc.save(`bp-summary-${new Date().toISOString().slice(0,10)}.pdf`);
}

// ─── Weekly Summary (shown in app) ───────────────────────────────────────────
function WeeklySummary({ data, t }) {
  if (!data.length) return null;
  const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekData = data.filter(r => new Date(r.measured_at) >= oneWeekAgo);
  if (!weekData.length) return null;

  const avg = (arr) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  const avgSys = avg(weekData.map(r => r.systolic));
  const avgDia = avg(weekData.map(r => r.diastolic));
  const c = classify(avgSys, avgDia);
  const highest = weekData.reduce((a, b) => a.systolic > b.systolic ? a : b);
  const lowest  = weekData.reduce((a, b) => a.systolic < b.systolic ? a : b);

  return (
    <div style={{ background: t.card, borderRadius: 16, padding: "1.5rem", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", marginBottom: "1.5rem", border: `1px solid ${t.border}` }}>
      <h2 style={{ margin: "0 0 1rem", fontSize: 17, fontWeight: 700, color: t.text }}>📊 This Week's Summary</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        {[
          { label: "Readings taken", value: weekData.length, unit: "this week" },
          { label: "Avg Systolic",   value: avgSys, unit: "mmHg" },
          { label: "Avg Diastolic",  value: avgDia, unit: "mmHg" },
          { label: "Overall status", value: c.label, color: c.color },
        ].map(s => (
          <div key={s.label} style={{ background: t.bg, borderRadius: 10, padding: "0.8rem" }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: t.sub, fontWeight: 600 }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: s.color ?? t.text }}>
              {s.value} <span style={{ fontSize: 11, fontWeight: 400, color: t.sub }}>{s.unit}</span>
            </p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ background: "#fef2f2", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#dc2626", fontWeight: 600 }}>
          🔺 Highest: {highest.systolic}/{highest.diastolic} on {fmt(highest.measured_at)}
        </div>
        <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#16a34a", fontWeight: 600 }}>
          🔻 Lowest: {lowest.systolic}/{lowest.diastolic} on {fmt(lowest.measured_at)}
        </div>
      </div>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar({ data, t }) {
  if (!data.length) return null;
  const avg = (arr) => Math.round(arr.reduce((a,b) => a+b, 0) / arr.length);
  const avgSys = avg(data.map(r => r.systolic));
  const avgDia = avg(data.map(r => r.diastolic));
  const last   = data[0];
  const c      = classify(avgSys, avgDia);
  const stats  = [
    { label: "Avg Systolic",  value: avgSys, unit: "mmHg" },
    { label: "Avg Diastolic", value: avgDia, unit: "mmHg" },
    { label: "Latest",        value: `${last.systolic}/${last.diastolic}`, unit: "mmHg" },
    { label: "Status",        value: c.label, color: c.color },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
      {stats.map(s => (
        <div key={s.label} style={{ background: t.statBg, borderRadius: 12, padding: "1rem", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: t.sub, fontWeight: 600 }}>{s.label}</p>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: s.color ?? t.text }}>
            {s.value} <span style={{ fontSize: 12, fontWeight: 400, color: t.sub }}>{s.unit}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session,       setSession]       = useState(undefined);
  const [readings,      setReadings]      = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [profiles,      setProfiles]      = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [darkMode,      setDarkMode]      = useState(() => localStorage.getItem("bp_dark") === "true");
  const [notifTime,     setNotifTime]     = useState(() => localStorage.getItem("bp_notif_time") || "08:00");
  const [notifOn,       setNotifOn]       = useState(() => localStorage.getItem("bp_notif_on") === "true");
  const [showSettings,  setShowSettings]  = useState(false);

  const t = darkMode ? dark : light;

  const scheduleNotification = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    const now = new Date(); const next = new Date();
    next.setHours(hours, minutes, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    setTimeout(() => {
      new Notification("PressureLog 💊", { body: "Don't forget to log your blood pressure today!" });
      setInterval(() => {
        new Notification("PressureLog 💊", { body: "Don't forget to log your blood pressure today!" });
      }, 24 * 60 * 60 * 1000);
    }, next - now);
  };

  const requestAndSchedule = async (time) => {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") { alert("Please allow notifications in your browser settings."); return; }
    localStorage.setItem("bp_notif_on", "true");
    localStorage.setItem("bp_notif_time", time);
    setNotifOn(true); scheduleNotification(time);
    alert(`Reminder set for ${time} every day!`);
  };

  const turnOffNotif = () => {
    localStorage.setItem("bp_notif_on", "false");
    setNotifOn(false); alert("Reminders turned off.");
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session && notifOn && Notification.permission === "granted") scheduleNotification(notifTime);
  }, [session]);

  useEffect(() => {
    localStorage.setItem("bp_dark", darkMode);
    document.body.style.background = darkMode ? dark.bg : light.bg;
  }, [darkMode]);

  const fetchProfiles = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase.from("profiles").select("*").order("created_at");
    setProfiles(data ?? []);
    if (data && data.length > 0 && !activeProfile) setActiveProfile(data[0]);
  }, [session]);

  const addProfile = async (name) => {
    const { data } = await supabase.from("profiles").insert({ user_id: session.user.id, name }).select().single();
    if (data) { await fetchProfiles(); setActiveProfile(data); }
  };

  const deleteProfile = async (id) => {
    if (!confirm("Delete this profile and all their readings?")) return;
    await supabase.from("bp_readings").delete().eq("profile_id", id);
    await supabase.from("profiles").delete().eq("id", id);
    await fetchProfiles();
    setActiveProfile(null);
  };

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const fetchReadings = useCallback(async () => {
    if (!session || !activeProfile) { setReadings([]); return; }
    setLoading(true);
    const { data } = await supabase.from("bp_readings").select("*")
      .eq("profile_id", activeProfile.id).order("measured_at", { ascending: false });
    setReadings(data ?? []);
    setLoading(false);
  }, [session, activeProfile]);

  useEffect(() => { fetchReadings(); }, [fetchReadings]);

  const deleteReading = async (id) => {
    if (!confirm("Delete this reading?")) return;
    await supabase.from("bp_readings").delete().eq("id", id);
    fetchReadings();
  };

  if (session === undefined) {
    return <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>Loading…</div>;
  }

  if (!session) return <AuthScreen theme={t} />;

  return (
    <div style={{ minHeight: "100dvh", background: t.bg, transition: "background 0.2s" }}>
      <header style={{
        background: t.headerBg, padding: "1rem 1.5rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 10, boxShadow: "0 2px 12px rgba(79,70,229,0.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>PressureLog</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setDarkMode(d => !d)} title="Toggle dark mode" style={{
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
            color: "#fff", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 16,
          }}>{darkMode ? "☀️" : "🌙"}</button>
          <button onClick={() => setShowSettings(s => !s)} title="Reminder settings" style={{
            background: notifOn ? "rgba(167,139,250,0.3)" : "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "#fff", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 16,
          }}>{notifOn ? "🔔" : "🔕"}</button>
          {readings.length > 0 && (
            <button onClick={() => exportSummary(readings, session.user, activeProfile?.name)} style={{
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600,
            }}>Export PDF</button>
          )}
          <button onClick={() => supabase.auth.signOut()} style={{
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
            color: "#fff", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13,
          }}>Sign Out</button>
        </div>
      </header>

      <main style={{ maxWidth: 780, margin: "0 auto", padding: "1.5rem 1rem" }}>

        {showSettings && (
          <div style={{ background: "#1e1b4b", borderRadius: 16, padding: "1.5rem", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", marginBottom: "1.5rem" }}>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: 17, fontWeight: 700, color: "#fff" }}>🔔 Daily Reminder</h2>
            <p style={{ fontSize: 13, color: "#a5b4fc", marginBottom: 16 }}>Get a browser notification every day to remind you to log your blood pressure.</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <label style={{ color: "#fff", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                Remind me at:
                <input type="time" value={notifTime}
                  onChange={e => { setNotifTime(e.target.value); localStorage.setItem("bp_notif_time", e.target.value); }}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #6d28d9", fontSize: 14, background: "#312e81", color: "#fff", fontFamily: "inherit" }}
                />
              </label>
              <button onClick={() => requestAndSchedule(notifTime)} style={{
                padding: "9px 18px", borderRadius: 8, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #a78bfa, #6d28d9)", color: "#fff", fontWeight: 700, fontSize: 13,
              }}>{notifOn ? "Update Reminder" : "Turn On"}</button>
              {notifOn && (
                <button onClick={turnOffNotif} style={{
                  padding: "9px 18px", borderRadius: 8, border: "1px solid #f87171", cursor: "pointer",
                  background: "transparent", color: "#f87171", fontWeight: 600, fontSize: 13,
                }}>Turn Off</button>
              )}
            </div>
            {notifOn && <p style={{ marginTop: 12, fontSize: 13, color: "#86efac" }}>✅ Reminder active — you will be notified every day at {notifTime}</p>}
          </div>
        )}

        <ProfileSelector profiles={profiles} activeProfile={activeProfile} onSelect={setActiveProfile} onAdd={addProfile} onDelete={deleteProfile} t={t} />
        {readings.length > 0 && <StatsBar data={readings} t={t} />}
        {readings.length > 0 && <WeeklySummary data={readings} t={t} />}
        <EntryForm onSaved={fetchReadings} user={session.user} activeProfile={activeProfile} t={t} />
        {readings.length > 1 && <BPChart data={readings} t={t} />}
        {loading
          ? <p style={{ color: t.sub, textAlign: "center" }}>Loading readings…</p>
          : <HistoryTable data={readings} onDelete={deleteReading} t={t} />
        }
      </main>
    </div>
  );
}
