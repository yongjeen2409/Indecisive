import { useMemo, useState } from "react";

const clusters = [
  { id: "c1", label: "Password and login", tickets: 1180, freshness: 92, owner: "Support Ops", status: "Ready" },
  { id: "c2", label: "Invoice timing", tickets: 740, freshness: 81, owner: "Finance Ops", status: "Needs approval" },
  { id: "c3", label: "Refund eligibility", tickets: 510, freshness: 73, owner: "Legal", status: "Review" },
  { id: "c4", label: "Plan limits", tickets: 390, freshness: 87, owner: "Product", status: "Ready" },
];

const articleSteps = [
  "Detect repeated question pattern from ticket history.",
  "Draft approved knowledge article from best agent answers.",
  "Route to owner for policy and tone approval.",
  "Publish to help center and agent macros.",
  "Measure deflection and stale-content risk weekly.",
];

export default function SupportKnowledgeAutomationPrototype({ embedded = false }) {
  const [selectedClusterId, setSelectedClusterId] = useState("c2");
  const [published, setPublished] = useState(14);
  const [approvalView, setApprovalView] = useState("owner");
  const selected = clusters.find((cluster) => cluster.id === selectedClusterId) ?? clusters[0];

  const summary = useMemo(() => {
    const totalTickets = clusters.reduce((sum, cluster) => sum + cluster.tickets, 0);
    const ready = clusters.filter((cluster) => cluster.status === "Ready").length;
    return { totalTickets, ready, candidateSavings: Math.round(totalTickets * 0.68) };
  }, []);

  function publishArticle() {
    setPublished((current) => current + 1);
  }

  return (
    <div
      style={{
        minHeight: embedded ? 530 : "100vh",
        background: "#10100f",
        color: "#fbf5e8",
        padding: embedded ? 18 : 30,
        fontFamily: "'Segoe UI', 'Aptos', sans-serif",
      }}
    >
      <header style={{ display: "grid", gridTemplateColumns: embedded ? "1fr" : "1.3fr 0.7fr", gap: 18, marginBottom: 20 }}>
        <div style={{ background: "linear-gradient(135deg, #31402b, #1b2418)", border: "1px solid #506442", borderRadius: 26, padding: 20 }}>
          <div style={{ color: "#b8d982", letterSpacing: 2, fontSize: 12, textTransform: "uppercase" }}>Knowledge automation studio</div>
          <h1 style={{ margin: "8px 0 8px", fontSize: embedded ? 26 : 38, lineHeight: 1.08 }}>Turn repeated tickets into approved answers</h1>
          <p style={{ margin: 0, color: "#d5ddc5", lineHeight: 1.55 }}>
            A lower-risk automation path that converts frequent support answers into governed help content and agent macros.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          <Stat label="Clustered tickets" value={summary.totalTickets} />
          <Stat label="Ready clusters" value={summary.ready} />
          <Stat label="Candidate deflection" value={summary.candidateSavings} />
          <Stat label="Published articles" value={published} />
        </div>
      </header>

      <main style={{ display: "grid", gridTemplateColumns: embedded ? "1fr" : "0.95fr 1.05fr", gap: 18 }}>
        <section style={{ background: "#fbf5e8", color: "#181a16", borderRadius: 24, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Detected repetition clusters</h2>
            <select
              value={approvalView}
              onChange={(event) => setApprovalView(event.target.value)}
              style={{ border: "1px solid #c8bea7", borderRadius: 12, padding: "8px 10px", background: "#fff" }}
            >
              <option value="owner">Owner view</option>
              <option value="risk">Risk view</option>
              <option value="impact">Impact view</option>
            </select>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {clusters.map((cluster) => (
              <button
                key={cluster.id}
                type="button"
                onClick={() => setSelectedClusterId(cluster.id)}
                style={{
                  textAlign: "left",
                  border: `1px solid ${cluster.id === selectedClusterId ? "#31402b" : "#ddd2bd"}`,
                  background: cluster.id === selectedClusterId ? "#edf4df" : "#fffdf8",
                  borderRadius: 17,
                  padding: 13,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <strong>{cluster.label}</strong>
                  <span style={{ color: cluster.status === "Ready" ? "#276749" : "#975a16" }}>{cluster.status}</span>
                </div>
                <div style={{ color: "#66705e", marginTop: 6 }}>
                  {approvalView === "owner" ? `${cluster.owner} owns approval` : approvalView === "risk" ? `${100 - cluster.freshness}% stale-content risk` : `${cluster.tickets} tickets in last 90 days`}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section style={{ background: "#1d241a", border: "1px solid #435138", borderRadius: 26, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 15 }}>
            <div>
              <div style={{ color: "#b8d982", fontSize: 12, letterSpacing: 1.6, textTransform: "uppercase" }}>Article workflow</div>
              <h2 style={{ margin: "6px 0 0", fontSize: 24 }}>{selected.label}</h2>
            </div>
            <div style={{ minWidth: 150 }}>
              <div style={{ color: "#cbd5c0", fontSize: 12 }}>Freshness score</div>
              <strong style={{ color: selected.freshness >= 85 ? "#b8d982" : "#f8c471", fontSize: 24 }}>{selected.freshness}%</strong>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
            {articleSteps.map((step, index) => (
              <div key={step} style={{ display: "grid", gridTemplateColumns: "34px 1fr", gap: 10, alignItems: "center" }}>
                <div style={{ width: 30, height: 30, borderRadius: 10, background: index < 2 ? "#b8d982" : "rgba(255,255,255,0.1)", color: index < 2 ? "#172012" : "#fbf5e8", display: "grid", placeItems: "center", fontWeight: 900 }}>
                  {index + 1}
                </div>
                <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: 11 }}>{step}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#fbf5e8", color: "#181a16", borderRadius: 18, padding: 15 }}>
            <div style={{ color: "#66705e", fontSize: 12, marginBottom: 7 }}>Draft knowledge article</div>
            <strong>{selected.label}: approved answer pattern</strong>
            <p style={{ margin: "8px 0 14px", lineHeight: 1.55 }}>
              Use this article to answer the common question, include one verification step, and route policy exceptions to {selected.owner}.
            </p>
            <button
              type="button"
              onClick={publishArticle}
              style={{ border: 0, borderRadius: 14, background: "#31402b", color: "#fff", padding: "10px 13px", cursor: "pointer", fontWeight: 800 }}
            >
              Approve and publish
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ background: "#fbf5e8", color: "#181a16", borderRadius: 20, padding: 14 }}>
      <div style={{ color: "#66705e", fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900 }}>{value}</div>
    </div>
  );
}
