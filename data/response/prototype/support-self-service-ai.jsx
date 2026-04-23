import { useMemo, useState } from "react";

const questions = [
  { id: "password", topic: "Password reset", volume: 430, automation: 92, risk: "Low", owner: "Knowledge Base" },
  { id: "billing", topic: "Billing date", volume: 310, automation: 84, risk: "Medium", owner: "Billing Ops" },
  { id: "plan", topic: "Plan comparison", volume: 270, automation: 88, risk: "Low", owner: "Product Marketing" },
  { id: "refund", topic: "Refund policy", volume: 190, automation: 76, risk: "Medium", owner: "Support Lead" },
  { id: "security", topic: "Security questionnaire", volume: 95, automation: 48, risk: "High", owner: "Compliance" },
];

const journeys = {
  password: [
    "Customer asks how to reset their password.",
    "Assistant checks verified help center article.",
    "Assistant returns step-by-step answer and a reset link.",
    "Ticket is closed with confidence telemetry.",
  ],
  billing: [
    "Customer asks when the next invoice will run.",
    "Assistant confirms customer tier and billing cycle.",
    "Assistant explains the date and flags edge cases.",
    "Billing-sensitive cases route to an agent.",
  ],
  plan: [
    "Customer asks what is included in Pro.",
    "Assistant retrieves the approved plan matrix.",
    "Assistant compares plan limits in plain language.",
    "Customer sees an upgrade prompt only if relevant.",
  ],
  refund: [
    "Customer asks for refund eligibility.",
    "Assistant checks approved policy language.",
    "Assistant explains the process and gathers order context.",
    "Refund exceptions route to an agent.",
  ],
  security: [
    "Customer asks for security documentation.",
    "Assistant identifies sensitive compliance content.",
    "Assistant provides public docs and access request flow.",
    "Compliance owner reviews restricted answers.",
  ],
};

export default function SupportSelfServiceAIPrototype({ embedded = false }) {
  const [selectedId, setSelectedId] = useState("password");
  const [mode, setMode] = useState("balanced");
  const selected = questions.find((question) => question.id === selectedId) ?? questions[0];

  const projected = useMemo(() => {
    const modeBoost = mode === "speed" ? 8 : mode === "safe" ? -9 : 0;
    const automated = Math.round(questions.reduce((sum, item) => sum + item.volume * ((item.automation + modeBoost) / 100), 0));
    const total = questions.reduce((sum, item) => sum + item.volume, 0);
    return {
      automated,
      total,
      rate: Math.round((automated / total) * 100),
      savedHours: Math.round((automated * 4.5) / 60),
    };
  }, [mode]);

  return (
    <div
      style={{
        minHeight: embedded ? 520 : "100vh",
        padding: embedded ? 18 : 28,
        background: "#f7f4ec",
        color: "#1e211b",
        fontFamily: "'Aptos', 'Segoe UI', sans-serif",
      }}
    >
      <section style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: 2, color: "#7f5f1f", textTransform: "uppercase" }}>Customer self-service AI</div>
          <h1 style={{ margin: "8px 0 6px", fontSize: embedded ? 26 : 36, lineHeight: 1.05 }}>Deflect repetitive questions before they become tickets</h1>
          <p style={{ maxWidth: 620, margin: 0, color: "#5d6255", lineHeight: 1.55 }}>
            A guided customer portal answers approved FAQs, shows confidence, and escalates sensitive issues to agents.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(110px, 1fr))", gap: 10, minWidth: 260 }}>
          <Metric label="Auto-answer rate" value={`${projected.rate}%`} tone="#246f49" />
          <Metric label="Hours saved/day" value={projected.savedHours} tone="#9b5c13" />
          <Metric label="Tickets covered" value={projected.total} tone="#374151" />
          <Metric label="AI resolved" value={projected.automated} tone="#246f49" />
        </div>
      </section>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {["balanced", "speed", "safe"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            style={{
              border: "1px solid #d4c8a8",
              background: mode === item ? "#253d2a" : "#fffaf0",
              color: mode === item ? "#fffaf0" : "#253d2a",
              padding: "9px 13px",
              cursor: "pointer",
              borderRadius: 999,
              textTransform: "capitalize",
            }}
          >
            {item} mode
          </button>
        ))}
      </div>

      <main style={{ display: "grid", gridTemplateColumns: embedded ? "1fr" : "0.9fr 1.1fr", gap: 18 }}>
        <div style={{ background: "#fffaf0", border: "1px solid #ded2b1", borderRadius: 22, padding: 16 }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>Top repetitive questions</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {questions.map((question) => (
              <button
                key={question.id}
                type="button"
                onClick={() => setSelectedId(question.id)}
                style={{
                  textAlign: "left",
                  border: `1px solid ${selectedId === question.id ? "#253d2a" : "#e5dac0"}`,
                  background: selectedId === question.id ? "#eef4e9" : "#fff",
                  borderRadius: 16,
                  padding: 13,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <strong>{question.topic}</strong>
                  <span style={{ color: question.risk === "High" ? "#a33b2d" : "#246f49" }}>{question.risk}</span>
                </div>
                <div style={{ color: "#6b705f", marginTop: 6 }}>{question.volume} monthly tickets - {question.automation}% automation fit</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: "#18251c", color: "#f8f2df", borderRadius: 24, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <div style={{ color: "#c7aa61", fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase" }}>Live answer simulation</div>
              <h2 style={{ margin: "6px 0 0", fontSize: 22 }}>{selected.topic}</h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#cbd8be", fontSize: 12 }}>Owner</div>
              <strong>{selected.owner}</strong>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
            {journeys[selected.id].map((step, index) => (
              <div key={step} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#d5b867", color: "#18251c", display: "grid", placeItems: "center", fontWeight: 800 }}>
                  {index + 1}
                </div>
                <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: 11, flex: 1 }}>{step}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#f8f2df", color: "#1e211b", borderRadius: 18, padding: 14 }}>
            <div style={{ fontSize: 12, color: "#6b705f", marginBottom: 6 }}>Suggested customer response</div>
            <p style={{ margin: 0, lineHeight: 1.55 }}>
              I can help with {selected.topic.toLowerCase()}. Based on our approved help content, here is the fastest path. If your account has a special case, I will connect you with an agent.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div style={{ background: "#fffaf0", border: "1px solid #ded2b1", borderRadius: 18, padding: 13 }}>
      <div style={{ fontSize: 12, color: "#6b705f" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: tone }}>{value}</div>
    </div>
  );
}
