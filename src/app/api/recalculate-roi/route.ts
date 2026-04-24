import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const maxDuration = 30;

const DEFAULT_ZAI_BASE_URL = 'https://api.z.ai/api/paas/v4/';
const DEFAULT_ZAI_MODEL = 'glm-5.1';

interface RecalcResult {
  updatedRoi: string;
  explanation: string;
}

function parseMockRoi(currentRoi: string, assumptionLabel: string, oldValue: string, newValue: string): RecalcResult {
  const base = parseFloat(currentRoi.replace(/[^0-9.-]/g, '')) || 200;
  let delta = 0;

  const label = assumptionLabel.toLowerCase();
  if (label.includes('budget') || label.includes('capex') || label.includes('implementation')) {
    delta = -Math.round(base * 0.12);
  } else if (label.includes('timeline') || label.includes('payback')) {
    delta = -Math.round(base * 0.08);
  } else if (label.includes('roi') || label.includes('return')) {
    const newNum = parseFloat(newValue.replace(/[^0-9.-]/g, ''));
    if (!isNaN(newNum)) {
      return { updatedRoi: `${newNum}%`, explanation: `ROI revised to ${newNum}% based on corrected projection.` };
    }
    delta = -Math.round(base * 0.1);
  } else if (label.includes('headcount') || label.includes('team') || label.includes('capacity')) {
    delta = -Math.round(base * 0.06);
  } else {
    delta = -Math.round(base * 0.05);
  }

  const updated = Math.max(50, Math.round(base + delta));
  return {
    updatedRoi: `${updated}%`,
    explanation: `ROI revised from ${currentRoi} to ${updated}% after correcting ${assumptionLabel} from "${oldValue}" to "${newValue}".`,
  };
}

async function callZAI(prompt: string): Promise<string> {
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
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 200,
  });

  return completion.choices[0]?.message?.content ?? '';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assumptionLabel, oldValue, newValue, currentRoi, blueprintTitle } = body;

    if (!assumptionLabel || !currentRoi) {
      return NextResponse.json({ error: 'assumptionLabel and currentRoi required' }, { status: 400 });
    }

    const prompt = `A business blueprint titled "${blueprintTitle ?? 'Blueprint'}" has a current ROI of ${currentRoi}.
The assumption "${assumptionLabel}" was corrected from "${oldValue}" to "${newValue}".
Calculate the revised ROI percentage. Return ONLY a valid JSON object with no extra text: {"updatedRoi": "X%", "explanation": "one sentence"}`;

    let result: RecalcResult;

    try {
      const rawText = await callZAI(prompt);
      const jsonMatch = rawText.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (typeof parsed.updatedRoi === 'string' && typeof parsed.explanation === 'string') {
          result = parsed;
        } else {
          result = parseMockRoi(currentRoi, assumptionLabel, oldValue, newValue);
        }
      } else {
        result = parseMockRoi(currentRoi, assumptionLabel, oldValue, newValue);
      }
    } catch {
      result = parseMockRoi(currentRoi, assumptionLabel, oldValue, newValue);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[recalculate-roi] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
