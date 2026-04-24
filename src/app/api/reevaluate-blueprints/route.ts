import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { AIProvider, Blueprint, FinanceModel, ReviewAssumption, Scores } from '../../../types';
import { buildSharedReviewAssumptions, reevaluateBlueprintSet } from '../../../lib/reviewAssumptions';

export const maxDuration = 120;

const DEFAULT_ZAI_BASE_URL = 'https://api.z.ai/api/paas/v4/';
const DEFAULT_ZAI_MODEL = 'glm-5.1';

const SYSTEM_PROMPT = `You are a senior enterprise architect reevaluating an existing ranked blueprint set after a manager edited shared assumption values.

Return ONLY valid JSON with this exact structure:
{
  "results": [
    {
      "id": "blueprint-id",
      "scores": {
        "feasibility": 80,
        "businessImpact": 85,
        "effort": 74,
        "riskConflict": 71
      },
      "financeModel": {
        "capexValue": 220000,
        "opexMonthlyValue": 18000,
        "roiValue": 74,
        "paybackMonths": 12
      }
    }
  ]
}

Rules:
1. Return one result for every blueprint id provided.
2. Keep scores in the 35-98 range.
3. Keep finance values realistic and positive.
4. Reevaluate based on the updated assumptions only.
5. Preserve the ranked set order implicitly by returning the same ids only.`;

interface AIReevaluationResult {
  id: string;
  scores: ScoresPayload;
  financeModel: FinanceModelPayload;
}

interface ScoresPayload {
  feasibility: number;
  businessImpact: number;
  effort: number;
  riskConflict: number;
}

interface FinanceModelPayload {
  capexValue: number;
  opexMonthlyValue: number;
  roiValue: number;
  paybackMonths: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatCurrency(value: number) {
  return `$${Math.round(value / 1000).toLocaleString()}k`;
}

function formatMonthlyCurrency(value: number) {
  return `${formatCurrency(value)}/mo`;
}

function formatPayback(months: number) {
  return `${months} months`;
}

function buildFinanceModel(capexValue: number, opexMonthlyValue: number, roiValue: number, paybackMonths: number): FinanceModel {
  const totalCostYearOneValue = capexValue + opexMonthlyValue * 12;
  const normalizedRoiValue = clamp(Math.round(roiValue), 25, 95);
  return {
    capex: formatCurrency(capexValue),
    opex: formatMonthlyCurrency(opexMonthlyValue),
    roi: `${normalizedRoiValue}%`,
    paybackPeriod: formatPayback(paybackMonths),
    totalCost: formatCurrency(totalCostYearOneValue),
    capexValue,
    opexMonthlyValue,
    roiValue: normalizedRoiValue,
    paybackMonths,
    totalCostYearOneValue,
  };
}

function buildScores(feasibility: number, businessImpact: number, effort: number, riskConflict: number): Scores {
  return {
    feasibility,
    businessImpact,
    effort,
    riskConflict,
    total: Math.round(feasibility * 0.28 + businessImpact * 0.34 + effort * 0.18 + riskConflict * 0.2),
  };
}

function extractJSON(text: string) {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  const firstBrace = text.indexOf('{');
  if (firstBrace === -1) return text;

  let depth = 0;
  for (let index = firstBrace; index < text.length; index += 1) {
    if (text[index] === '{') depth += 1;
    if (text[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(firstBrace, index + 1);
      }
    }
  }

  return text.slice(firstBrace);
}

function isScoresPayload(value: unknown): value is ScoresPayload {
  return (
    isRecord(value) &&
    typeof value.feasibility === 'number' &&
    typeof value.businessImpact === 'number' &&
    typeof value.effort === 'number' &&
    typeof value.riskConflict === 'number'
  );
}

function isFinanceModelPayload(value: unknown): value is FinanceModelPayload {
  return (
    isRecord(value) &&
    typeof value.capexValue === 'number' &&
    typeof value.opexMonthlyValue === 'number' &&
    typeof value.roiValue === 'number' &&
    typeof value.paybackMonths === 'number'
  );
}

function isAIReevaluationResult(value: unknown): value is AIReevaluationResult {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    isScoresPayload(value.scores) &&
    isFinanceModelPayload(value.financeModel)
  );
}

function isReviewAssumption(value: unknown): value is ReviewAssumption {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    typeof value.value === 'string' &&
    typeof value.source === 'string' &&
    (value.staleness === null || value.staleness === undefined || typeof value.staleness === 'string') &&
    (value.confidence === 'HIGH' || value.confidence === 'MEDIUM' || value.confidence === 'LOW') &&
    typeof value.impact === 'string'
  );
}

function mergeAssumptions(
  blueprints: Blueprint[],
  assumptionUpdates: Array<{ id: string; value: string }>,
  baselineAssumptions?: ReviewAssumption[],
): ReviewAssumption[] {
  const baseline =
    baselineAssumptions && baselineAssumptions.length > 0
      ? baselineAssumptions
      : buildSharedReviewAssumptions(blueprints);
  const updates = new Map(
    assumptionUpdates
      .filter(update => typeof update.id === 'string' && typeof update.value === 'string')
      .map(update => [update.id, update.value]),
  );

  return baseline.map(assumption => ({
    ...assumption,
    value: updates.get(assumption.id) ?? assumption.value,
  }));
}

function buildUserPrompt(blueprints: Blueprint[], assumptions: ReviewAssumption[]) {
  const summaries = blueprints.map(blueprint => ({
    id: blueprint.id,
    title: blueprint.title,
    department: blueprint.department,
    scores: blueprint.scores,
    financeModel: {
      capexValue: blueprint.financeModel.capexValue,
      opexMonthlyValue: blueprint.financeModel.opexMonthlyValue,
      roiValue: blueprint.financeModel.roiValue,
      paybackMonths: blueprint.financeModel.paybackMonths,
    },
  }));

  return `Reevaluate these blueprints using the updated assumptions.

UPDATED ASSUMPTIONS:
${JSON.stringify(assumptions, null, 2)}

BLUEPRINTS:
${JSON.stringify(summaries, null, 2)}

Return JSON only.`;
}

function applyAIResults(blueprints: Blueprint[], aiResults: AIReevaluationResult[]) {
  const resultMap = new Map(aiResults.map(result => [result.id, result]));

  return blueprints.map(blueprint => {
    const matched = resultMap.get(blueprint.id);
    if (!matched) return blueprint;

    const feasibility = clamp(Math.round(matched.scores.feasibility), 35, 98);
    const businessImpact = clamp(Math.round(matched.scores.businessImpact), 35, 98);
    const effort = clamp(Math.round(matched.scores.effort), 35, 98);
    const riskConflict = clamp(Math.round(matched.scores.riskConflict), 35, 98);
    const capexValue = Math.max(25_000, Math.round(matched.financeModel.capexValue));
    const opexMonthlyValue = Math.max(4_000, Math.round(matched.financeModel.opexMonthlyValue));
    const roiValue = clamp(Math.round(matched.financeModel.roiValue), 25, 95);
    const paybackMonths = Math.max(3, Math.round(matched.financeModel.paybackMonths));

    return {
      ...blueprint,
      scores: buildScores(feasibility, businessImpact, effort, riskConflict),
      financeModel: buildFinanceModel(capexValue, opexMonthlyValue, roiValue, paybackMonths),
    };
  });
}

async function callZAI(userContent: string): Promise<string> {
  const apiKey = process.env.ZAI_API_KEY?.trim();
  if (!apiKey) throw new Error('ZAI_API_KEY not set');

  const configuredBaseURL = process.env.ZAI_BASE_URL?.trim();
  const baseURL = configuredBaseURL
    ? (configuredBaseURL.endsWith('/') ? configuredBaseURL : `${configuredBaseURL}/`)
    : DEFAULT_ZAI_BASE_URL;
  const model = process.env.ZAI_MODEL?.trim() || DEFAULT_ZAI_MODEL;

  const client = new OpenAI({ apiKey, baseURL });
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    temperature: 0.2,
    max_tokens: 3000,
  });

  const content = completion.choices[0]?.message?.content;
  if (typeof content === 'string') {
    return content;
  }

  const contentParts: unknown[] = Array.isArray(content) ? content : [];
  return contentParts
    .map(part => (isRecord(part) && typeof part.text === 'string' ? part.text : ''))
    .join('');
}

async function callGemini(userContent: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') throw new Error('GEMINI_API_KEY not set');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: userContent }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
          maxOutputTokens: 4096,
        },
      }),
      signal: AbortSignal.timeout(90000),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini API error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

function parseAIResults(rawText: string) {
  const json = JSON.parse(extractJSON(rawText));
  const rawResults = isRecord(json) && Array.isArray(json.results) ? json.results : [];
  return rawResults.filter(isAIReevaluationResult);
}

async function reevaluateWithProvider(
  provider: Exclude<AIProvider, 'mock'>,
  blueprints: Blueprint[],
  assumptions: ReviewAssumption[],
) {
  const prompt = buildUserPrompt(blueprints, assumptions);
  const rawText = provider === 'zai' ? await callZAI(prompt) : await callGemini(prompt);
  const parsedResults = parseAIResults(rawText);

  if (parsedResults.length !== blueprints.length) {
    throw new Error(`Expected ${blueprints.length} reevaluation results, received ${parsedResults.length}`);
  }

  return applyAIResults(blueprints, parsedResults);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const blueprints: Blueprint[] = Array.isArray(body.blueprints) ? body.blueprints : [];
    const rawAssumptions: unknown[] = Array.isArray(body.assumptions) ? body.assumptions : [];
    const baselineAssumptions = Array.isArray(body.baselineAssumptions)
      ? body.baselineAssumptions.filter(isReviewAssumption)
      : [];

    if (blueprints.length === 0) {
      return NextResponse.json({ error: 'blueprints are required' }, { status: 400 });
    }

    const mergedAssumptions =
      rawAssumptions.length > 0 && rawAssumptions.every(isReviewAssumption)
        ? rawAssumptions
        : mergeAssumptions(
            blueprints,
            rawAssumptions as Array<{ id: string; value: string }>,
            baselineAssumptions,
          );

    try {
      const reevaluated = await reevaluateWithProvider('zai', blueprints, mergedAssumptions);
      return NextResponse.json({ blueprints: reevaluated, provider: 'zai', fallback: false });
    } catch (zaiError) {
      console.warn('[reevaluate-blueprints] ZAI failed, trying Gemini:', (zaiError as Error).message);
    }

    try {
      const reevaluated = await reevaluateWithProvider('gemini', blueprints, mergedAssumptions);
      return NextResponse.json({ blueprints: reevaluated, provider: 'gemini', fallback: true });
    } catch (geminiError) {
      console.warn('[reevaluate-blueprints] Gemini failed, using mock reevaluation:', (geminiError as Error).message);
    }

    const reevaluated = reevaluateBlueprintSet(blueprints, mergedAssumptions, baselineAssumptions);
    return NextResponse.json({ blueprints: reevaluated, provider: 'mock', fallback: true });
  } catch (error) {
    console.error('[reevaluate-blueprints] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
