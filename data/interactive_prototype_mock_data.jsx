import { useState } from "react";

const mockTickets = [
  { id: 1, name: "Sarah L.", initials: "SL", message: "How do I reset my password?", status: "ai", color: "#E1F5EE", textColor: "#0F6E56" },
  { id: 2, name: "Marcus K.", initials: "MK", message: "Where's my order #48821?", status: "ai", color: "#FAEEDA", textColor: "#854F0B" },
  { id: 3, name: "Jess T.", initials: "JT", message: "I was double charged last month and...", status: "human", color: "#FAECE7", textColor: "#993C1D" },
  { id: 4, name: "Raj P.", initials: "RP", message: "Do you offer annual billing discounts?", status: "ai", color: "#E1F5EE", textColor: "#0F6E56" },
  { id: 5, name: "Amy L.", initials: "AL", message: "Need to cancel my subscription ASAP", status: "pending", color: "#FAEEDA", textColor: "#854F0B" },
  { id: 6, name: "Chen W.", initials: "CW", message: "App keeps crashing on iOS 17", status: "human", color: "#FAECE7", textColor: "#993C1D" },
  { id: 7, name: "Dana M.", initials: "DM", message: "What's included in the Pro plan?", status: "ai", color: "#E1F5EE", textColor: "#0F6E56" },
];

const topQuestions = [
  { label: "Password reset", pct: 88, color: "#1D9E75" },
  { label: "Order status", pct: 76, color: "#1D9E75" },
  { label: "Refund policy", pct: 71, color: "#1D9E75" },
  { label: "Account billing", pct: 65, color: "#EF9F27" },
  { label: "Cancellation", pct: 58, color: "#EF9F27" },
  { label: "Complex complaint", pct: 12, color: "#D85A30" },
];

const chatMessages = [
  { from: "user", name: "Marcus K.", text: "Hi, where is my order #48821? It was supposed to arrive yesterday." },
  { from: "bot", name: "AI assistant · 2 sec response", text: "Hi Marcus! I found your order #48821. It shipped on Apr 20 via FedEx and is currently out for delivery today. Tracking link: fedex.com/track/48821. Expected by 6 PM. Anything else I can help with?" },
  { from: "user", name: "Marcus K.", text: "Thanks! Also, what's your return policy?" },
  { from: "bot", name: "AI assistant · 1 sec response", text: "We offer free 30-day returns on all items. Just head to your account → Orders → Return item, and we'll email a prepaid label within minutes. Need help starting a return?" },
];

const metrics = [
  { label: "Tickets today", value: "284", delta: "+12% vs yesterday", up: true },
  { label: "AI resolved", value: "198", delta: "70% auto-handled", up: true },
  { label: "Avg response", value: "18s", delta: "was 4.2 min", up: true },
  { label: "Escalated to human", value: "86", delta: "30% need agent", up: false },
];

const statusConfig = {
  ai: { label: "AI handled", bg: "#E1F5EE", color: "#0F6E56" },
  human: { label: "Escalated", bg: "#FAECE7", color: "#993C1D" },
  pending: { label: "In progress", bg: "#FAEEDA", color: "#854F0B" },
};

export default function CustomerSupportDashboard() {
  const [filter, setFilter] = useState("all");

  const filteredTickets = filter === "all"
    ? mockTickets
    : mockTickets.filter((t) => t.status === filter);

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", maxWidth: 960, margin: "0 auto", padding: "2rem 1.5rem", background: "#FAFAF9", minHeight: "100vh", color: "#1a1a18" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem", paddingBottom: "1.25rem", borderBottom: "0.5px solid #ddddd8" }}>
        <div>
          <div style={{ fontSize: 12, color: "#888780", marginBottom: 4, letterSpacing: "0.04em", textTransform: "uppercase" }}>Customer support · AI overview</div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: "#1a1a18", margin: 0 }}>Support command centre</h1>
        </div>
        <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 8, background: "#E1F5EE", color: "#0F6E56", fontWeight: 500, marginTop: 4 }}>
          AI active
        </span>
      </div>

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: "1.5rem" }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ background: "#F1EFE8", borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ fontSize: 12, color: "#5F5E5A", marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 24, fontWeight: 500, color: "#1a1a18" }}>{m.value}</div>
            <div style={{ fontSize: 11, marginTop: 4, color: m.up ? "#0F6E56" : "#993C1D" }}>{m.delta}</div>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "1.5rem" }}>

        {/* Bar chart */}
        <div style={{ background: "#fff", border: "0.5px solid #ddddd8", borderRadius: 12, padding: "1rem 1.25rem" }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "#888780", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 14 }}>
            Top repetitive questions · AI handles these
          </div>
          {topQuestions.map((q) => (
            <div key={q.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "#5F5E5A", width: 120, flexShrink: 0 }}>{q.label}</div>
              <div style={{ flex: 1, height: 8, background: "#F1EFE8", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${q.pct}%`, height: "100%", background: q.color, borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 12, color: "#1a1a18", width: 34, textAlign: "right", flexShrink: 0 }}>{q.pct}%</div>
            </div>
          ))}
        </div>

        {/* Ticket queue */}
        <div style={{ background: "#fff", border: "0.5px solid #ddddd8", borderRadius: 12, padding: "1rem 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "#888780", letterSpacing: "0.05em", textTransform: "uppercase" }}>Live ticket queue</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["all", "ai", "human", "pending"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    fontSize: 10, padding: "3px 8px", borderRadius: 6,
                    border: "0.5px solid",
                    borderColor: filter === f ? "#1a1a18" : "#ddddd8",
                    background: filter === f ? "#1a1a18" : "transparent",
                    color: filter === f ? "#fff" : "#888780",
                    cursor: "pointer", fontFamily: "inherit"
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div style={{ overflowY: "auto", maxHeight: 280 }}>
            {filteredTickets.map((t) => {
              const s = statusConfig[t.status];
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderBottom: "0.5px solid #f0efeb" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, flexShrink: 0, background: t.color, color: t.textColor }}>
                    {t.initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a18" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#888780", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>{t.message}</div>
                  </div>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: s.bg, color: s.color, flexShrink: 0, alignSelf: "flex-start", marginTop: 2, fontWeight: 500 }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chat sample */}
      <div style={{ background: "#fff", border: "0.5px solid #ddddd8", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: "#888780", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 14 }}>
          AI chatbot · sample conversation
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {chatMessages.map((msg, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.from === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ fontSize: 11, color: "#888780", marginBottom: 3 }}>{msg.name}</div>
              <div style={{
                maxWidth: "80%", padding: "9px 13px", fontSize: 13, lineHeight: 1.55, borderRadius: msg.from === "user" ? "12px 0 12px 12px" : "0 12px 12px 12px",
                background: msg.from === "user" ? "#1D9E75" : "#F1EFE8",
                color: msg.from === "user" ? "#fff" : "#1a1a18"
              }}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested actions */}
      <div style={{ background: "#fff", border: "0.5px solid #ddddd8", borderRadius: 12, padding: "1rem 1.25rem" }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: "#888780", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 12 }}>
          Suggested next steps
        </div>
        {[
          { dot: "#1D9E75", text: "Evaluate AI tools for automating support responses" },
          { dot: "#1D9E75", text: "Build a knowledge base for the AI chatbot" },
          { dot: "#EF9F27", text: "Define metrics to measure AI support ROI" },
          { dot: "#D85A30", text: "Set escalation rules — when should AI hand off to a human?" },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", border: "0.5px solid #ddddd8", borderRadius: 8, background: "#FAFAF9", marginBottom: 6, fontSize: 13, color: "#1a1a18", cursor: "default" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
            {s.text}
          </div>
        ))}
      </div>
    </div>
  );
}
