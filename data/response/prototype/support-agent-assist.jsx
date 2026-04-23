import { useMemo, useState } from "react";

const queue = [
  { id: "t-1842", customer: "Nadia Chen", tier: "Enterprise", topic: "Invoice dispute", sentiment: "tense", confidence: 61, sla: "22m" },
  { id: "t-1843", customer: "Owen Hart", tier: "Pro", topic: "Password reset", sentiment: "calm", confidence: 94, sla: "2h" },
  { id: "t-1844", customer: "Mira Singh", tier: "Business", topic: "Plan downgrade", sentiment: "uncertain", confidence: 78, sla: "45m" },
  { id: "t-1845", customer: "Luis Romero", tier: "Starter", topic: "Refund status", sentiment: "calm", confidence: 82, sla: "1h" },
];

const snippets = {
  empathetic: "I understand why this is frustrating. I checked the account context and here is the clearest next step.",
  concise: "I reviewed the account and found the likely resolution. Here are the exact steps to complete it.",
  policy: "Based on the approved support policy, this case needs one confirmation before we can proceed.",
};

export default function SupportAgentAssistPrototype({ embedded = false }) {
  const [selectedTicketId, setSelectedTicketId] = useState("t-1842");
  const [tone, setTone] = useState("empathetic");
  const [approved, setApproved] = useState(7);
  const selected = queue.find((ticket) => ticket.id === selectedTicketId) ?? queue[0];

  const queueStats = useMemo(() => {
    const autoDraftable = queue.filter((ticket) => ticket.confidence >= 75).length;
    const avgConfidence = Math.round(queue.reduce((sum, ticket) => sum + ticket.confidence, 0) / queue.length);
    return { autoDraftable, avgConfidence };
  }, []);

  function approveDraft() {
    setApproved((current) => current + 1);
  }

  return (
    <div
      style={{
        minHeight: embedded ? 540 : "100vh",
        background: "linear-gradient(135deg, #101820 0%, #182b3a 48%, #f2efe6 48%, #f2efe6 100%)",
        padding: embedded ? 18 : 30,
        color: "#f8fafc",
        fontFamily: "'Segoe UI', 'Aptos', sans-serif",
      }}
    >
      <header style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <div style={{ color: "#7dd3fc", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Agent assist cockpit</div>
          <h1 style={{ margin: "8px 0 6px", fontSize: embedded ? 26 : 38, maxWidth: 720 }}>Draft faster while keeping humans in control</h1>
          <p style={{ margin: 0, color: "#cbd5e1", maxWidth: 640, lineHeight: 1.55 }}>
            Agents get suggested replies, policy guardrails, and escalation cues for support questions that should not be fully automated.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(90px, 1fr))", gap: 10 }}>
          <Tile label="Draftable" value={`${queueStats.autoDraftable}/${queue.length}`} />
          <Tile label="Avg confidence" value={`${queueStats.avgConfidence}%`} />
          <Tile label="Approved today" value={approved} />
        </div>
      </header>

      <main style={{ display: "grid", gridTemplateColumns: embedded ? "1fr" : "320px 1fr", gap: 18 }}>
        <aside style={{ background: "rgba(15,23,42,0.78)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 24, padding: 15 }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>Priority queue</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {queue.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setSelectedTicketId(ticket.id)}
                style={{
                  textAlign: "left",
                  border: `1px solid ${ticket.id === selectedTicketId ? "#7dd3fc" : "rgba(255,255,255,0.12)"}`,
                  background: ticket.id === selectedTicketId ? "rgba(14,165,233,0.18)" : "rgba(255,255,255,0.06)",
                  color: "#f8fafc",
                  borderRadius: 16,
                  padding: 12,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <strong>{ticket.customer}</strong>
                  <span>{ticket.sla}</span>
                </div>
                <div style={{ color: "#cbd5e1", marginTop: 5 }}>{ticket.topic} - {ticket.tier}</div>
              </button>
            ))}
          </div>
        </aside>

        <section style={{ background: "#f8fafc", color: "#10202f", borderRadius: 26, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 15 }}>
            <div>
              <div style={{ color: "#2563eb", fontSize: 12, letterSpacing: 1.6, textTransform: "uppercase" }}>Selected ticket</div>
              <h2 style={{ margin: "6px 0 0", fontSize: 24 }}>{selected.customer}: {selected.topic}</h2>
            </div>
            <Confidence value={selected.confidence} />
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {Object.keys(snippets).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTone(item)}
                style={{
                  border: "1px solid #bfdbfe",
                  background: tone === item ? "#1d4ed8" : "#eff6ff",
                  color: tone === item ? "#fff" : "#1d4ed8",
                  borderRadius: 999,
                  padding: "8px 12px",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {item} tone
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: embedded ? "1fr" : "1fr 0.8fr", gap: 14 }}>
            <div style={{ border: "1px solid #dbeafe", borderRadius: 20, padding: 15, background: "#ffffff" }}>
              <div style={{ color: "#64748b", fontSize: 12, marginBottom: 8 }}>AI draft</div>
              <p style={{ margin: 0, lineHeight: 1.6 }}>{snippets[tone]}</p>
              <p style={{ lineHeight: 1.6 }}>
                For {selected.topic.toLowerCase()}, the recommended response is to confirm the customer account state, provide the approved policy answer, and route to a specialist if confidence stays below 75%.
              </p>
              <button
                type="button"
                onClick={approveDraft}
                style={{ border: 0, background: "#0f172a", color: "#fff", borderRadius: 14, padding: "11px 14px", cursor: "pointer", fontWeight: 700 }}
              >
                Approve and send draft
              </button>
            </div>

            <div style={{ border: "1px solid #e2e8f0", borderRadius: 20, padding: 15, background: "#f8fafc" }}>
              <div style={{ color: "#64748b", fontSize: 12, marginBottom: 10 }}>Guardrails</div>
              {[
                "Human approval required for billing disputes.",
                "Use only approved knowledge snippets.",
                "Escalate sensitive personal data requests.",
                "Capture feedback after every modified draft.",
              ].map((item) => (
                <div key={item} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <span style={{ color: "#16a34a", fontWeight: 900 }}>OK</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Tile({ label, value }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 18, padding: 13 }}>
      <div style={{ color: "#cbd5e1", fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function Confidence({ value }) {
  const color = value >= 80 ? "#16a34a" : value >= 70 ? "#ca8a04" : "#dc2626";

  return (
    <div style={{ minWidth: 150 }}>
      <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: 12 }}>
        <span>AI confidence</span>
        <strong style={{ color }}>{value}%</strong>
      </div>
      <div style={{ height: 8, background: "#e2e8f0", borderRadius: 999, marginTop: 6, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}
