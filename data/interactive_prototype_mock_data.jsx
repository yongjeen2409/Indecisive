import { useMemo, useState } from "react";

const initialTickets = [
  {
    id: 1,
    name: "Sarah L.",
    initials: "SL",
    message: "How do I reset my password?",
    status: "ai",
    priority: "Low",
    topic: "Password reset",
    customerTier: "Pro",
    color: "#E1F5EE",
    textColor: "#0F6E56",
  },
  {
    id: 2,
    name: "Marcus K.",
    initials: "MK",
    message: "Where's my order #48821?",
    status: "ai",
    priority: "Medium",
    topic: "Order status",
    customerTier: "Business",
    color: "#FAEEDA",
    textColor: "#854F0B",
  },
  {
    id: 3,
    name: "Jess T.",
    initials: "JT",
    message: "I was double charged last month and need a correction.",
    status: "human",
    priority: "High",
    topic: "Billing complaint",
    customerTier: "Enterprise",
    color: "#FAECE7",
    textColor: "#993C1D",
  },
  {
    id: 4,
    name: "Raj P.",
    initials: "RP",
    message: "Do you offer annual billing discounts?",
    status: "ai",
    priority: "Low",
    topic: "Billing",
    customerTier: "Starter",
    color: "#E1F5EE",
    textColor: "#0F6E56",
  },
  {
    id: 5,
    name: "Amy L.",
    initials: "AL",
    message: "Need to cancel my subscription ASAP",
    status: "pending",
    priority: "High",
    topic: "Cancellation",
    customerTier: "Pro",
    color: "#FAEEDA",
    textColor: "#854F0B",
  },
  {
    id: 6,
    name: "Chen W.",
    initials: "CW",
    message: "App keeps crashing on iOS 17",
    status: "human",
    priority: "High",
    topic: "Technical issue",
    customerTier: "Enterprise",
    color: "#FAECE7",
    textColor: "#993C1D",
  },
  {
    id: 7,
    name: "Dana M.",
    initials: "DM",
    message: "What's included in the Pro plan?",
    status: "ai",
    priority: "Low",
    topic: "Plan comparison",
    customerTier: "Starter",
    color: "#E1F5EE",
    textColor: "#0F6E56",
  },
];

const topQuestions = [
  { label: "Password reset", pct: 88, color: "#1D9E75" },
  { label: "Order status", pct: 76, color: "#1D9E75" },
  { label: "Refund policy", pct: 71, color: "#1D9E75" },
  { label: "Account billing", pct: 65, color: "#EF9F27" },
  { label: "Cancellation", pct: 58, color: "#EF9F27" },
  { label: "Complex complaint", pct: 12, color: "#D85A30" },
];

const baseChatMessages = [
  { from: "user", name: "Marcus K.", text: "Hi, where is my order #48821? It was supposed to arrive yesterday." },
  { from: "bot", name: "AI assistant - 2 sec response", text: "Hi Marcus! I found your order #48821. It shipped on Apr 20 via FedEx and is currently out for delivery today. Tracking link: fedex.com/track/48821. Expected by 6 PM. Anything else I can help with?" },
  { from: "user", name: "Marcus K.", text: "Thanks! Also, what's your return policy?" },
  { from: "bot", name: "AI assistant - 1 sec response", text: "We offer free 30-day returns on all items. Just head to your account -> Orders -> Return item, and we'll email a prepaid label within minutes. Need help starting a return?" },
];

const baseMetrics = [
  { label: "Tickets today", value: 284, delta: "+12% vs yesterday", up: true },
  { label: "AI resolved", value: 198, delta: "70% auto-handled", up: true },
  { label: "Avg response", value: 18, delta: "was 4.2 min", up: true, suffix: "s" },
  { label: "Escalated to human", value: 86, delta: "30% need agent", up: false },
];

const statusConfig = {
  ai: { label: "AI handled", bg: "#E1F5EE", color: "#0F6E56" },
  human: { label: "Escalated", bg: "#FAECE7", color: "#993C1D" },
  pending: { label: "In progress", bg: "#FAEEDA", color: "#854F0B" },
};

const suggestedResponses = {
  balanced: "AI drafts a response, confirms account context, and routes only when confidence drops below 78%.",
  speed: "AI prioritizes instant answers, auto-sends approved playbooks, and queues only billing exceptions for human review.",
  safety: "AI limits itself to retrieval and draft mode, requiring a human approval step before any customer-facing send.",
};

function formatMetric(metric) {
  return `${metric.value}${metric.suffix ?? ""}`;
}

export default function CustomerSupportDashboard({ embedded = false }) {
  const [filter, setFilter] = useState("all");
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedTicketId, setSelectedTicketId] = useState(2);
  const [assistantMode, setAssistantMode] = useState("balanced");
  const [chatMessages, setChatMessages] = useState(baseChatMessages);
  const [metrics, setMetrics] = useState(baseMetrics);

  const filteredTickets =
    filter === "all" ? tickets : tickets.filter((ticket) => ticket.status === filter);

  const selectedTicket =
    tickets.find((ticket) => ticket.id === selectedTicketId) ?? filteredTickets[0] ?? tickets[0];

  const queueHealth = useMemo(() => {
    const aiHandled = tickets.filter((ticket) => ticket.status === "ai").length;
    const humanNeeded = tickets.filter((ticket) => ticket.status === "human").length;
    return aiHandled > humanNeeded ? "Stable" : "Needs review";
  }, [tickets]);

  function updateTicketStatus(nextStatus) {
    if (!selectedTicket) return;

    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === selectedTicket.id ? { ...ticket, status: nextStatus } : ticket,
      ),
    );

    if (nextStatus === "ai") {
      setMetrics((currentMetrics) =>
        currentMetrics.map((metric) =>
          metric.label === "AI resolved"
            ? { ...metric, value: metric.value + 1, delta: "AI confidence improved" }
            : metric.label === "Escalated to human"
              ? { ...metric, value: Math.max(metric.value - 1, 0), delta: "Fewer agent handoffs" }
              : metric,
        ),
      );
    }
  }

  function applyQuestionPreset(question) {
    setSelectedTicketId(2);
    setChatMessages((currentMessages) => [
      ...currentMessages,
      {
        from: "system",
        name: "Workflow hint",
        text: `Suggested playbook opened for "${question.label}" with ${question.pct}% historical automation success.`,
      },
    ]);
  }

  function sendSuggestedReply() {
    if (!selectedTicket) return;

    setChatMessages((currentMessages) => [
      ...currentMessages,
      {
        from: "bot",
        name: `AI assistant - ${assistantMode} mode`,
        text: `Reply prepared for ${selectedTicket.name}: ${suggestedResponses[assistantMode]}`,
      },
    ]);

    updateTicketStatus("ai");
  }

  return (
    <div
      style={{
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        maxWidth: embedded ? "100%" : 1220,
        margin: "0 auto",
        padding: embedded ? "1.25rem" : "2rem 1.5rem",
        background: "#FAFAF9",
        minHeight: embedded ? 520 : "100vh",
        color: "#1a1a18",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: "1.75rem",
          paddingBottom: "1.25rem",
          borderBottom: "0.5px solid #ddddd8",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              color: "#888780",
              marginBottom: 4,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Customer support - AI overview
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: "#1a1a18", margin: 0 }}>
            Support command centre
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 11,
              padding: "4px 12px",
              borderRadius: 8,
              background: "#E1F5EE",
              color: "#0F6E56",
              fontWeight: 500,
            }}
          >
            AI active
          </span>
          <span
            style={{
              fontSize: 11,
              padding: "4px 12px",
              borderRadius: 8,
              background: queueHealth === "Stable" ? "#E8F0FF" : "#FAECE7",
              color: queueHealth === "Stable" ? "#1E4DB7" : "#993C1D",
              fontWeight: 500,
            }}
          >
            Queue {queueHealth}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: embedded ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: 10,
          marginBottom: "1.5rem",
        }}
      >
        {metrics.map((metric) => (
          <div key={metric.label} style={{ background: "#F1EFE8", borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ fontSize: 12, color: "#5F5E5A", marginBottom: 6 }}>{metric.label}</div>
            <div style={{ fontSize: 24, fontWeight: 500, color: "#1a1a18" }}>{formatMetric(metric)}</div>
            <div style={{ fontSize: 11, marginTop: 4, color: metric.up ? "#0F6E56" : "#993C1D" }}>
              {metric.delta}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: embedded ? "1fr" : "1fr 1.15fr",
          gap: 12,
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ background: "#fff", border: "0.5px solid #ddddd8", borderRadius: 12, padding: "1rem 1.25rem" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "#888780",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Top repetitive questions - click to load playbook
          </div>
          {topQuestions.map((question) => (
            <button
              key={question.label}
              onClick={() => applyQuestionPreset(question)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
                width: "100%",
                textAlign: "left",
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <div style={{ fontSize: 12, color: "#5F5E5A", width: 120, flexShrink: 0 }}>{question.label}</div>
              <div style={{ flex: 1, height: 8, background: "#F1EFE8", borderRadius: 4, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${question.pct}%`,
                    height: "100%",
                    background: question.color,
                    borderRadius: 4,
                  }}
                />
              </div>
              <div style={{ fontSize: 12, color: "#1a1a18", width: 34, textAlign: "right", flexShrink: 0 }}>
                {question.pct}%
              </div>
            </button>
          ))}
        </div>

        <div style={{ background: "#fff", border: "0.5px solid #ddddd8", borderRadius: 12, padding: "1rem 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#888780",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Live ticket queue
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["all", "ai", "human", "pending"].map((value) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  style={{
                    fontSize: 10,
                    padding: "3px 8px",
                    borderRadius: 6,
                    border: "0.5px solid",
                    borderColor: filter === value ? "#1a1a18" : "#ddddd8",
                    background: filter === value ? "#1a1a18" : "transparent",
                    color: filter === value ? "#fff" : "#888780",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: embedded ? "1fr" : "1fr 0.95fr", gap: 12 }}>
            <div style={{ overflowY: "auto", maxHeight: embedded ? 260 : 330 }}>
              {filteredTickets.map((ticket) => {
                const status = statusConfig[ticket.status];
                const isSelected = ticket.id === selectedTicket?.id;

                return (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "10px 0",
                      borderBottom: "0.5px solid #f0efeb",
                      background: "transparent",
                      borderLeft: "none",
                      borderRight: "none",
                      borderTop: "none",
                      width: "100%",
                      textAlign: "left",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      boxShadow: isSelected ? "inset 3px 0 0 #1D9E75" : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 500,
                        flexShrink: 0,
                        background: ticket.color,
                        color: ticket.textColor,
                      }}
                    >
                      {ticket.initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a18" }}>{ticket.name}</div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#888780",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          marginTop: 2,
                        }}
                      >
                        {ticket.message}
                      </div>
                      <div style={{ fontSize: 11, color: "#5F5E5A", marginTop: 5 }}>
                        {ticket.topic} - {ticket.customerTier} - {ticket.priority} priority
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: status.bg,
                        color: status.color,
                        flexShrink: 0,
                        alignSelf: "flex-start",
                        marginTop: 2,
                        fontWeight: 500,
                      }}
                    >
                      {status.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedTicket ? (
              <div style={{ background: "#FAFAF9", border: "0.5px solid #ddddd8", borderRadius: 10, padding: "0.9rem" }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: "#888780", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10 }}>
                  Operator panel
                </div>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>{selectedTicket.name}</div>
                <div style={{ fontSize: 12, color: "#5F5E5A", marginBottom: 12 }}>
                  {selectedTicket.topic} - {selectedTicket.customerTier} customer
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 12 }}>
                  {[
                    { label: "Priority", value: selectedTicket.priority },
                    { label: "Status", value: statusConfig[selectedTicket.status].label },
                    { label: "Mode", value: assistantMode },
                    { label: "Confidence", value: assistantMode === "speed" ? "86%" : assistantMode === "balanced" ? "79%" : "93%" },
                  ].map((item) => (
                    <div key={item.label} style={{ padding: "10px 12px", borderRadius: 8, background: "#fff", border: "0.5px solid #e3e1db" }}>
                      <div style={{ fontSize: 10, color: "#888780", marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: "#888780", marginBottom: 6 }}>Assistant mode</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["balanced", "speed", "safety"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setAssistantMode(mode)}
                        style={{
                          fontSize: 11,
                          padding: "5px 10px",
                          borderRadius: 999,
                          border: "0.5px solid",
                          borderColor: assistantMode === mode ? "#1a1a18" : "#ddddd8",
                          background: assistantMode === mode ? "#1a1a18" : "#fff",
                          color: assistantMode === mode ? "#fff" : "#5F5E5A",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          textTransform: "capitalize",
                        }}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                  <button
                    onClick={() => sendSuggestedReply()}
                    style={{
                      fontSize: 12,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: "#1D9E75",
                      color: "#fff",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Send suggested reply
                  </button>
                  <button
                    onClick={() => updateTicketStatus("human")}
                    style={{
                      fontSize: 12,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "0.5px solid #ddddd8",
                      background: "#fff",
                      color: "#1a1a18",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Escalate to human
                  </button>
                </div>

                <div style={{ fontSize: 12, color: "#5F5E5A", lineHeight: 1.55 }}>
                  {suggestedResponses[assistantMode]}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: embedded ? "1fr" : "1.15fr 0.85fr",
          gap: 12,
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ background: "#fff", border: "0.5px solid #ddddd8", borderRadius: 12, padding: "1rem 1.25rem" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "#888780",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            AI chatbot - sample conversation
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: embedded ? 220 : 280, overflowY: "auto" }}>
            {chatMessages.map((message, index) => (
              <div
                key={`${message.name}-${index}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: message.from === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div style={{ fontSize: 11, color: "#888780", marginBottom: 3 }}>{message.name}</div>
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "9px 13px",
                    fontSize: 13,
                    lineHeight: 1.55,
                    borderRadius: message.from === "user" ? "12px 0 12px 12px" : "0 12px 12px 12px",
                    background:
                      message.from === "user"
                        ? "#1D9E75"
                        : message.from === "system"
                          ? "#EEF2FF"
                          : "#F1EFE8",
                    color: message.from === "user" ? "#fff" : "#1a1a18",
                  }}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#fff", border: "0.5px solid #ddddd8", borderRadius: 12, padding: "1rem 1.25rem" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "#888780",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Suggested next steps
          </div>
          {[
            { dot: "#1D9E75", text: "Auto-triage low-risk billing and password tickets", action: () => setAssistantMode("speed") },
            { dot: "#1D9E75", text: "Push the selected ticket into AI draft mode", action: () => updateTicketStatus("pending") },
            { dot: "#EF9F27", text: "Review human-handoff thresholds for enterprise complaints", action: () => setAssistantMode("balanced") },
            { dot: "#D85A30", text: "Enable approval-only mode for sensitive financial cases", action: () => setAssistantMode("safety") },
          ].map((step, index) => (
            <button
              key={index}
              onClick={step.action}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                border: "0.5px solid #ddddd8",
                borderRadius: 8,
                background: "#FAFAF9",
                marginBottom: 6,
                fontSize: 13,
                color: "#1a1a18",
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
                fontFamily: "inherit",
              }}
            >
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: step.dot, flexShrink: 0 }} />
              {step.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
