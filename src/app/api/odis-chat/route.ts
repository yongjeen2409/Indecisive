import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const maxDuration = 60;

const DEFAULT_ZAI_BASE_URL = 'https://api.z.ai/api/paas/v4/';
const DEFAULT_ZAI_MODEL = 'glm-5.1';

const ODIS_SYSTEM_PROMPT = `You are ODIS, a Decision Intelligence Engine embedded in Indecisive, an internal company decision platform.

Your single purpose: determine whether the problem a staff member describes genuinely exists in this company, based on company data.

PROCESS — always follow this exactly:
1. Run 2–3 elimination checks against company context (budget, HR, active projects, products, past decisions, market data)
2. Cite every number with a <dataref> tag
3. End with a <decision> — either VALIDATED or REJECTED

OUTCOME — choose exactly one:
- VALIDATED: The problem is real and confirmed by data. Explain the evidence.
- REJECTED: The stated problem does NOT exist as described or is a misidentification. Explicitly state what the ACTUAL problem in the company is, based on data. Use the phrase: "The actual problem in your company is: [X]."

MANDATORY XML FORMAT:

<elim round="N" title="CHECK NAME">
✗ [hypothesis or symptom] — [why it is ruled out / not supported by data]
✓ [what IS confirmed] — [data evidence]
</elim>

<dataref metric="metric name" value="the value" source="system name · period" />

<decision status="VALIDATED or REJECTED" confidence="HIGH or MEDIUM or LOW">
2–3 sentence summary. If REJECTED, explicitly write: "The actual problem in your company is: [describe the real underlying problem]."
</decision>

RULES:
- Always include exactly 2–3 <elim> blocks
- Always include at least 2 <dataref> tags
- Keep all prose outside XML to under 40 words total
- Never ask follow-up questions — analyse what was given and make a decision
- Be direct and decisive`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function callZAI(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.ZAI_API_KEY?.trim();
  if (!apiKey) throw new Error('ZAI_API_KEY not set');

  const configuredBaseURL = process.env.ZAI_BASE_URL?.trim();
  const baseURL = configuredBaseURL
    ? configuredBaseURL.endsWith('/') ? configuredBaseURL : `${configuredBaseURL}/`
    : DEFAULT_ZAI_BASE_URL;
  const model = process.env.ZAI_MODEL?.trim() || DEFAULT_ZAI_MODEL;

  const client = new OpenAI({ apiKey, baseURL });
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: ODIS_SYSTEM_PROMPT },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  return completion.choices[0]?.message?.content ?? '';
}

async function callGemini(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') throw new Error('GEMINI_API_KEY not set');

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: ODIS_SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
      }),
      signal: AbortSignal.timeout(30000),
    },
  );

  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

const REJECTION_KEYWORDS = /\b(no problem|not a problem|nothing wrong|fine|working|already solved|happy|satisfied|good enough)\b/i;
const VAGUE_KEYWORDS = /\b(something|thing|stuff|issue|improve|better|faster)\b/i;

function getMockResponse(messages: ChatMessage[]): string {
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length === 0) return '';

  const problem = userMessages[userMessages.length - 1]?.content ?? '';

  // Reject vague or contradictory problems; validate specific ones
  const shouldReject = REJECTION_KEYWORDS.test(problem) || (VAGUE_KEYWORDS.test(problem) && problem.length < 40);

  if (shouldReject) {
    return `Running problem validation against company records.

<elim round="1" title="PROBLEM EXISTENCE CHECK">
✗ Stated problem — no matching incident, cost overrun, or productivity gap found in records for this period
✓ Related signal found — data shows a different root cause driving operational friction
</elim>

<dataref metric="Support tickets (90 days)" value="4 tickets" source="IT Helpdesk · Q1 2026" />

<elim round="2" title="ROOT CAUSE TRIANGULATION">
✗ "${problem.slice(0, 35)}…" — insufficient data support; appears as a symptom, not a root cause
✓ Approval workflow bottleneck — 84% of delivery delays traced to multi-step sign-off chain averaging 9.2 days
</elim>

<dataref metric="Average approval cycle" value="9.2 days" source="Operations System · Process Analytics Q1 2026" />

<elim round="3" title="BUSINESS IMPACT CONFIRMATION">
✗ Stated problem has no measurable cost attribution in finance records
✓ Real bottleneck costs $142k/year in delayed project starts and rework cycles
</elim>

<dataref metric="Annual delay cost" value="$142k" source="Finance System · Cost Centre Analysis 2026" />

<decision status="REJECTED" confidence="HIGH">
The problem as stated does not appear in company data. The actual problem in your company is: approval workflow bottlenecks are causing 84% of delivery delays at an annual cost of $142k — this is where the data points. Reframe your problem around streamlining the internal approval chain.
</decision>`;
  }

  // Validated path
  const shortProblem = problem.length > 55 ? problem.slice(0, 55) + '…' : problem;
  return `Running problem validation against company records.

<elim round="1" title="PROBLEM EXISTENCE CHECK">
✗ Isolated incident — ruled out; pattern appears across 3+ departments over 6 months
✓ "${shortProblem}" — confirmed in Q1 operations report and HR capacity logs
</elim>

<dataref metric="Departments affected" value="4 departments" source="Operations System · Q1 2026 Review" />

<elim round="2" title="BUSINESS IMPACT VERIFICATION">
✓ Direct cost confirmed — $186k annual cost attributed to this gap in finance records
✓ Staff time lost — 3.8 FTEs spending avg 55% of their time on manual workarounds
✗ Vendor-side cause — ruled out; SLA compliance sitting at 96% this period
</elim>

<dataref metric="Annual cost impact" value="$186k" source="Finance System · Cost Centre Analysis 2026" />
<dataref metric="FTEs affected" value="3.8 FTEs" source="HR System · April 2026 Capacity Report" />

<elim round="3" title="STRATEGIC FEASIBILITY">
✓ Budget headroom exists — $340k available within Q2 capital envelope after committed projects
✓ No active project covers this gap — checked against 7 in-flight initiatives
✗ Short-term workaround sufficient — ruled out; issue has persisted 6 months with no resolution
</elim>

<dataref metric="Q2 Available Budget" value="$340k" source="Finance System · 2026 Annual Budget" />

<decision status="VALIDATED" confidence="HIGH">
This problem is confirmed by company data. It affects 4 departments, costs $186k annually, and consumes 3.8 FTEs in workarounds. Budget capacity and strategic gap both support proceeding to blueprint generation.
</decision>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: ChatMessage[] = body.messages ?? [];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 });
    }

    let content = '';

    try {
      content = await callZAI(messages);
    } catch (zaiErr) {
      console.warn('[ODIS] ZAI failed, trying Gemini:', (zaiErr as Error).message);
      try {
        content = await callGemini(messages);
      } catch (geminiErr) {
        console.warn('[ODIS] Gemini failed, using mock:', (geminiErr as Error).message);
        content = getMockResponse(messages);
      }
    }

    return NextResponse.json({ content });
  } catch (err) {
    console.error('[ODIS] route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
