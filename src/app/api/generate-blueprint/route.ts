import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { Blueprint, Conflict, Phase, FinanceModel, Scores, ScoringInsight, TechStackCategory } from '../../../types';
import { normalizeTechStack } from '../../../lib/techStack';

export const maxDuration = 300;
const DEFAULT_ZAI_BASE_URL = 'https://api.z.ai/api/paas/v4/';
const DEFAULT_ZAI_MODEL = 'glm-5.1';
const FORCE_MOCK_BLUEPRINTS = process.env.FORCE_MOCK_BLUEPRINTS === 'true';

const COLOR_TOKENS = [
  { color: 'var(--color-primary)', accentColor: 'var(--color-primary)' },
  { color: 'var(--color-success)', accentColor: 'var(--color-success)' },
  { color: 'var(--color-warning)', accentColor: 'var(--color-warning)' },
];
const MOCK_BLUEPRINTS_SCHEMA_VERSION = 3;
const MOCK_PROTOTYPE_FALLBACK_SOURCE = 'data/interactive_prototype_mock_data.jsx';

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatCurrency(value: number) {
  return `$${Math.round(value / 1000).toLocaleString()}k`;
}

function buildFinanceModel(capexValue: number, opexMonthlyValue: number, roiValue: number, paybackMonths: number): FinanceModel {
  const totalCostYearOneValue = capexValue + opexMonthlyValue * 12;
  return {
    capex: formatCurrency(capexValue),
    opex: `${formatCurrency(opexMonthlyValue)}/mo`,
    roi: `${roiValue}%`,
    paybackPeriod: `${paybackMonths} months`,
    totalCost: formatCurrency(totalCostYearOneValue),
    capexValue,
    opexMonthlyValue,
    roiValue,
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

function loadDataSource(filename: string) {
  try {
    const filePath = path.join(process.cwd(), 'data', filename);
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function buildContextMessage(problem: string) {
  const budget = loadDataSource('budget.json');
  const projects = loadDataSource('projects.json');
  const products = loadDataSource('products.json');
  const rejected = loadDataSource('rejected.json');
  const market = loadDataSource('market.json');
  const hr = loadDataSource('hr.json');
  const legal = loadDataSource('legal.json');

  return `PROBLEM STATEMENT:
${problem}

COMPANY DATA SOURCES:

=== BUDGET DATA ===
${JSON.stringify(budget, null, 2)}

=== ACTIVE PROJECTS (in development) ===
${JSON.stringify(projects, null, 2)}

=== PRODUCT PORTFOLIO (shipped products) ===
${JSON.stringify(products, null, 2)}

=== PAST REJECTED IDEAS ===
${JSON.stringify(rejected, null, 2)}

=== MARKET RESEARCH ===
${JSON.stringify(market, null, 2)}

=== HR SYSTEM (employees & capacity) ===
${JSON.stringify(hr, null, 2)}

=== LEGAL & COMPLIANCE POLICIES ===
${JSON.stringify(legal, null, 2)}`;
}

const SCORING_INSIGHTS_SCHEMA = `[
  { "dimension": "Budget", "status": "positive|neutral|warning", "summary": "One sentence referencing actual budget data", "score": 82 },
  { "dimension": "Project Pipeline", "status": "positive|neutral|warning", "summary": "One sentence referencing active projects", "score": 65 },
  { "dimension": "Product Portfolio", "status": "positive|neutral|warning", "summary": "One sentence about product overlap or gap", "score": 78 },
  { "dimension": "Past Rejections", "status": "positive|neutral|warning", "summary": "One sentence comparing to rejected ideas", "score": 85 },
  { "dimension": "Market Research", "status": "positive|neutral|warning", "summary": "One sentence citing market data", "score": 80 },
  { "dimension": "HR & Execution", "status": "positive|neutral|warning", "summary": "One sentence about team capacity and skills", "score": 70 },
  { "dimension": "Legal & Compliance", "status": "positive|neutral|warning", "summary": "One sentence about policy alignment", "score": 88 }
]`;

const BASE_RULES = `Rules:
1. All 3 blueprints must take fundamentally different approaches (build vs buy, AI-native vs incremental, internal vs external)
2. Finance numbers grounded in company budget data - capex $50k-$800k range
3. Architecture must have 5-7 layers in top-to-bottom flow order, each formatted as "Layer Name: description (Technology)"
4. techStack must be grouped into 3-6 meaningful categories, each with a specific category name and 1-4 concrete tools
5. Timeline must have exactly 3 phases
6. scoringInsights must have exactly 7 items in the order shown - status must be "positive", "neutral", or "warning"`;

const SYSTEM_PROMPT = `You are a senior enterprise solutions architect. Analyze the business problem and company data, then generate exactly 3 distinct solution blueprints.

Return ONLY a valid JSON object — no markdown, no explanation, no code fences. Structure:
{
  "blueprints": [
    {
      "title": "Concise blueprint name",
      "department": "Primary owning department",
      "description": "2-3 sentence executive summary grounded in the company context",
      "prototypeSourceJsx": "Complete self-contained .jsx file source exporting a default React component. No markdown fences. Keep all state, mock data, and styles inside the file. Make it interactive with filters, tabs, panel state, or buttons. No external CDN links.",
      "prototypeCode": "Complete self-contained HTML document with inline CSS and vanilla JS demoing the solution UI. Dark theme (#0a0a0f background). No external CDN links. Realistic mock data for this specific use case. Interactive (tabs, buttons). At least 400px tall.",
      "architecture": ["Layer Name: Component description (Technology)"],
      "techStack": [{ "category": "Frontend / Experience", "tools": ["React", "Next.js"] }],
      "financeModel": { "capexValue": 200000, "opexMonthlyValue": 15000, "roiValue": 250, "paybackMonths": 12 },
      "timeline": [{ "name": "Phase 1 — Foundation", "duration": "4 weeks", "deliverables": ["Item 1", "Item 2", "Item 3"] }],
      "scores": { "feasibility": 80, "businessImpact": 85, "effort": 75, "riskConflict": 70 },
      "scoringInsights": ${SCORING_INSIGHTS_SCHEMA}
    }
  ]
}

${BASE_RULES}
7. prototypeSourceJsx must be a valid self-contained .jsx file that exports a default React component
8. prototypeCode, if included, must be a complete valid HTML document representing the same prototype`;

// Gemini free tier has limited TPM — omit prototypeCode to stay under token budget (~3k tokens vs ~12k)
const SYSTEM_PROMPT_GEMINI = `You are a senior enterprise solutions architect. Analyze the business problem and company data, then generate exactly 3 distinct solution blueprints.

Return ONLY a valid JSON object — no markdown, no explanation, no code fences. Structure:
{
  "blueprints": [
    {
      "title": "Concise blueprint name",
      "department": "Primary owning department",
      "description": "2-3 sentence executive summary grounded in the company context",
      "prototypeSourceJsx": "Complete self-contained .jsx file source exporting a default React component. No markdown fences. Keep all state, mock data, and styles inside the file. Make it interactive with filters, tabs, panel state, or buttons. No external CDN links.",
      "architecture": ["Layer Name: Component description (Technology)"],
      "techStack": [{ "category": "Frontend / Experience", "tools": ["React", "Next.js"] }],
      "financeModel": { "capexValue": 200000, "opexMonthlyValue": 15000, "roiValue": 250, "paybackMonths": 12 },
      "timeline": [{ "name": "Phase 1 — Foundation", "duration": "4 weeks", "deliverables": ["Item 1", "Item 2", "Item 3"] }],
      "scores": { "feasibility": 80, "businessImpact": 85, "effort": 75, "riskConflict": 70 },
      "scoringInsights": ${SCORING_INSIGHTS_SCHEMA}
    }
  ]
}

${BASE_RULES}`;

interface AIBlueprint {
  title: string;
  department: string;
  description: string;
  prototypeSourceJsx?: string;
  prototypeCode?: string;
  architecture: string[];
  techStack: TechStackCategory[];
  financeModel: { capexValue: number; opexMonthlyValue: number; roiValue: number; paybackMonths: number };
  timeline: Phase[];
  scores: { feasibility: number; businessImpact: number; effort: number; riskConflict: number };
  scoringInsights: ScoringInsight[];
}

function extractJSON(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  const firstBrace = text.indexOf('{');
  if (firstBrace === -1) return text;

  let depth = 0;
  for (let i = firstBrace; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) return text.slice(firstBrace, i + 1);
    }
  }
  return text.slice(firstBrace);
}

function normalizeAIBlueprint(raw: Partial<AIBlueprint>, index: number): AIBlueprint {
  const scores = raw.scores ?? { feasibility: 75, businessImpact: 78, effort: 70, riskConflict: 65 };
  const financeModel = raw.financeModel ?? { capexValue: 200000, opexMonthlyValue: 18000, roiValue: 200, paybackMonths: 12 };
  const normalizedTechStack = normalizeTechStack(raw.techStack, 'Core stack');

  const defaultInsights: ScoringInsight[] = [
    { dimension: 'Budget', status: 'neutral', summary: 'Within acceptable budget range for strategic initiative', score: 72 },
    { dimension: 'Project Pipeline', status: 'neutral', summary: 'Some overlap with active initiatives in tracker', score: 65 },
    { dimension: 'Product Portfolio', status: 'positive', summary: 'Extends existing platform capabilities', score: 78 },
    { dimension: 'Past Rejections', status: 'positive', summary: 'No significant similarity to previously rejected ideas', score: 84 },
    { dimension: 'Market Research', status: 'positive', summary: 'Strong market demand signal identified', score: 80 },
    { dimension: 'HR & Execution', status: 'neutral', summary: 'Moderate skill gap — targeted hiring recommended', score: 68 },
    { dimension: 'Legal & Compliance', status: 'positive', summary: 'Aligns with current policy framework', score: 82 },
  ];

  return {
    title: raw.title ?? `Solution Blueprint ${index + 1}`,
    department: raw.department ?? ['Engineering', 'Operations', 'Strategy & Data'][index % 3],
    description: raw.description ?? 'A strategic solution addressing the identified business problem.',
    prototypeSourceJsx: raw.prototypeSourceJsx,
    prototypeCode: raw.prototypeCode,
    architecture: raw.architecture ?? ['Presentation Layer', 'API Layer', 'Business Logic', 'Data Layer', 'Infrastructure'],
    techStack: normalizedTechStack.length > 0
      ? normalizedTechStack
      : [
          { category: 'Experience layer', tools: ['React', 'Next.js'] },
          { category: 'Application layer', tools: ['Node.js', 'Python'] },
          { category: 'Data and infrastructure', tools: ['PostgreSQL', 'Redis', 'Kubernetes'] },
        ],
    financeModel,
    timeline: raw.timeline ?? [
      { name: 'Phase 1 — Foundation', duration: '4 weeks', deliverables: ['Initial setup', 'Team alignment', 'Architecture approved'] },
      { name: 'Phase 2 — MVP', duration: '6 weeks', deliverables: ['Core features live', 'Pilot users onboarded', 'Feedback collected'] },
      { name: 'Phase 3 — Full Rollout', duration: '12 weeks', deliverables: ['All teams onboarded', 'Monitoring in place', 'Executive review complete'] },
    ],
    scores,
    scoringInsights: Array.isArray(raw.scoringInsights) && raw.scoringInsights.length === 7
      ? raw.scoringInsights
      : defaultInsights,
  };
}

function buildConflictsForBlueprints(ids: string[]): Conflict[] {
  return [
    {
      id: `${ids[0]}-timeline`,
      type: 'timeline',
      severity: 'high',
      description: 'Engineering sequencing overlaps with the infrastructure migration project, risking shared team contention in Q2-Q3.',
      resolution: 'Phase foundation work after the migration milestone in August. Shared infrastructure team rotates in Q4.',
      affectedBlueprints: [ids[0], ids[1]],
    },
    {
      id: `${ids[1]}-budget`,
      type: 'budget',
      severity: 'high',
      description: 'Running the first two blueprints in parallel would duplicate platform spend and exceed the Q2 remaining budget envelope of $3.3M.',
      resolution: 'Share core platform services and consolidate vendor contracts. Sequence capex spend across quarters.',
      affectedBlueprints: [ids[0], ids[1]],
    },
    {
      id: `${ids[2]}-headcount`,
      type: 'headcount',
      severity: 'medium',
      description: 'The third blueprint requires ML engineering capacity currently allocated to the AI ticketing project until July.',
      resolution: 'Assign after July milestone or bring in contract ML engineer for initial phase.',
      affectedBlueprints: [ids[2]],
    },
  ];
}

function aiToBlueprintType(ai: AIBlueprint, index: number, ids: string[], conflicts: Conflict[]): Blueprint {
  const id = ids[index];
  const colorToken = COLOR_TOKENS[index % 3];
  const fm = buildFinanceModel(ai.financeModel.capexValue, ai.financeModel.opexMonthlyValue, ai.financeModel.roiValue, ai.financeModel.paybackMonths);
  const sc = buildScores(ai.scores.feasibility, ai.scores.businessImpact, ai.scores.effort, ai.scores.riskConflict);

  return {
    id,
    title: ai.title,
    department: ai.department,
    description: ai.description,
    prototypePreview: {
      title: 'Prototype concept',
      summary: ai.description.split('.')[0] + '.',
      prototypeSourceJsx: ai.prototypeSourceJsx,
      prototypeCode: ai.prototypeCode,
      screens: [],
    },
    architecture: ai.architecture,
    techStack: ai.techStack,
    financeModel: fm,
    scores: sc,
    conflicts: conflicts.filter(c => c.affectedBlueprints.includes(id)),
    scoringInsights: ai.scoringInsights,
    timeline: ai.timeline,
    ...colorToken,
  };
}

const MOCK_BLUEPRINTS_PATH = path.join(process.cwd(), 'data', 'mock-blueprints.json');

interface StoredBlueprintWithConflictIds extends Omit<Blueprint, 'conflicts'> {
  conflictIds: string[];
}

interface StoredBlueprintCache {
  meta: {
    schemaVersion: number;
    savedAt: string;
    prototypeFallbackSource: string;
  };
  conflicts: Conflict[];
  blueprints: StoredBlueprintWithConflictIds[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTechStackCategory(value: unknown): value is TechStackCategory {
  return (
    isRecord(value) &&
    typeof value.category === 'string' &&
    Array.isArray(value.tools) &&
    value.tools.every(tool => typeof tool === 'string')
  );
}

function isTechStackCategoryArray(value: unknown): value is TechStackCategory[] {
  return Array.isArray(value) && value.every(isTechStackCategory);
}

function isStoredBlueprint(value: unknown): value is Blueprint {
  if (!isRecord(value)) return false;

  const prototypePreview = value.prototypePreview;
  const financeModel = value.financeModel;
  const scores = value.scores;

  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.department === 'string' &&
    typeof value.description === 'string' &&
    typeof value.color === 'string' &&
    typeof value.accentColor === 'string' &&
    Array.isArray(value.architecture) &&
    isTechStackCategoryArray(value.techStack) &&
    Array.isArray(value.timeline) &&
    Array.isArray(value.conflicts) &&
    Array.isArray(value.scoringInsights) &&
    isRecord(prototypePreview) &&
    Array.isArray(prototypePreview.screens) &&
    isRecord(financeModel) &&
    typeof financeModel.capexValue === 'number' &&
    typeof financeModel.opexMonthlyValue === 'number' &&
    typeof financeModel.roiValue === 'number' &&
    typeof financeModel.paybackMonths === 'number' &&
    typeof financeModel.totalCostYearOneValue === 'number' &&
    isRecord(scores) &&
    typeof scores.feasibility === 'number' &&
    typeof scores.businessImpact === 'number' &&
    typeof scores.effort === 'number' &&
    typeof scores.riskConflict === 'number' &&
    typeof scores.total === 'number'
  );
}

function isStoredBlueprintWithConflictIds(value: unknown): value is StoredBlueprintWithConflictIds {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.department === 'string' &&
    typeof value.description === 'string' &&
    typeof value.color === 'string' &&
    typeof value.accentColor === 'string' &&
    Array.isArray(value.architecture) &&
    Array.isArray(value.techStack) &&
    Array.isArray(value.timeline) &&
    Array.isArray(value.scoringInsights) &&
    Array.isArray(value.conflictIds) &&
    isRecord(value.prototypePreview) &&
    Array.isArray(value.prototypePreview.screens) &&
    isRecord(value.financeModel) &&
    typeof value.financeModel.capexValue === 'number' &&
    typeof value.financeModel.opexMonthlyValue === 'number' &&
    typeof value.financeModel.roiValue === 'number' &&
    typeof value.financeModel.paybackMonths === 'number' &&
    typeof value.financeModel.totalCostYearOneValue === 'number' &&
    isRecord(value.scores) &&
    typeof value.scores.feasibility === 'number' &&
    typeof value.scores.businessImpact === 'number' &&
    typeof value.scores.effort === 'number' &&
    typeof value.scores.riskConflict === 'number' &&
    typeof value.scores.total === 'number'
  );
}

function isStoredBlueprintCache(value: unknown): value is StoredBlueprintCache {
  return (
    isRecord(value) &&
    isRecord(value.meta) &&
    typeof value.meta.schemaVersion === 'number' &&
    typeof value.meta.savedAt === 'string' &&
    typeof value.meta.prototypeFallbackSource === 'string' &&
    Array.isArray(value.conflicts) &&
    Array.isArray(value.blueprints) &&
    value.blueprints.every(isStoredBlueprintWithConflictIds)
  );
}

function toStoredBlueprintCache(blueprints: Blueprint[]): StoredBlueprintCache {
  const conflictsById = new Map<string, Conflict>();

  for (const blueprint of blueprints) {
    for (const conflict of blueprint.conflicts) {
      conflictsById.set(conflict.id, conflict);
    }
  }

  return {
    meta: {
      schemaVersion: MOCK_BLUEPRINTS_SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      prototypeFallbackSource: MOCK_PROTOTYPE_FALLBACK_SOURCE,
    },
    conflicts: Array.from(conflictsById.values()),
    blueprints: blueprints.map(({ conflicts, ...blueprint }) => ({
      ...blueprint,
      conflictIds: conflicts.map(conflict => conflict.id),
    })),
  };
}

function inflateStoredBlueprintCache(cache: StoredBlueprintCache): Blueprint[] {
  const conflictsById = new Map(cache.conflicts.map(conflict => [conflict.id, conflict]));

  return cache.blueprints.map(({ conflictIds, ...blueprint }) => ({
    ...blueprint,
    techStack: normalizeTechStack(blueprint.techStack, 'Core stack'),
    conflicts: conflictIds
      .map(conflictId => conflictsById.get(conflictId))
      .filter((conflict): conflict is Conflict => Boolean(conflict)),
  }));
}

function saveMockBlueprints(blueprints: Blueprint[]) {
  try {
    fs.writeFileSync(MOCK_BLUEPRINTS_PATH, JSON.stringify(toStoredBlueprintCache(blueprints), null, 2), 'utf-8');
    console.log('[Mock] saved latest generated blueprints to mock-blueprints.json');
  } catch (err) {
    console.warn('[Mock] failed to save mock blueprints:', (err as Error).message);
  }
}

function loadMockBlueprints(): Blueprint[] | null {
  try {
    const raw = fs.readFileSync(MOCK_BLUEPRINTS_PATH, 'utf-8');
    const parsed = JSON.parse(raw);

    if (isStoredBlueprintCache(parsed)) {
      const inflated = inflateStoredBlueprintCache(parsed);
      return inflated.length > 0 ? inflated : null;
    }

    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    if (parsed.every(isStoredBlueprint)) {
      return parsed;
    }

    const normalized = parsed
      .slice(0, 3)
      .map((item, index) => normalizeAIBlueprint(isRecord(item) ? item as Partial<AIBlueprint> : {}, index));

    if (normalized.length === 0) return null;
    return assembleBlueprints(normalized);
  } catch {
    return null;
  }
}

async function callZAI(userContent: string): Promise<string> {
  const apiKey = process.env.ZAI_API_KEY?.trim();
  if (!apiKey) throw new Error('ZAI_API_KEY not set');

  const configuredBaseURL = process.env.ZAI_BASE_URL?.trim();
  const baseURL = configuredBaseURL
    ? (configuredBaseURL.endsWith('/') ? configuredBaseURL : `${configuredBaseURL}/`)
    : DEFAULT_ZAI_BASE_URL;
  const model = process.env.ZAI_MODEL?.trim() || DEFAULT_ZAI_MODEL;

  const client = new OpenAI({
    apiKey,
    baseURL,
  });

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    temperature: 0.7,
    max_tokens: 12000,
  });

  const content = completion.choices[0]?.message?.content;
  if (typeof content === 'string') {
    console.log('[ZAI] response received');
    return content;
  }

  const contentParts: unknown[] = Array.isArray(content) ? content : [];
  const data = contentParts
    .map(part => {
      if (isRecord(part) && typeof part.text === 'string') return part.text;
      return '';
    })
    .join('');
  console.log('[ZAI] response received');
  return data;
}

async function callGemini(userContent: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') throw new Error('GEMINI_API_KEY not set');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT_GEMINI }] },
        contents: [{ role: 'user', parts: [{ text: userContent }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      }),
      signal: AbortSignal.timeout(90000),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  console.log('[Gemini] response received');
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

function parseAIBlueprints(rawText: string): AIBlueprint[] {
  const jsonStr = extractJSON(rawText);
  const parsed = JSON.parse(jsonStr);
  const rawBlueprints: Partial<AIBlueprint>[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.blueprints)
      ? parsed.blueprints
      : [];

  if (rawBlueprints.length === 0) return [];
  return rawBlueprints.slice(0, 3).map((raw, i) => normalizeAIBlueprint(raw, i));
}

function assembleBlueprints(normalized: AIBlueprint[]): Blueprint[] {
  const ids = normalized.map(() => createId('bp'));
  const conflicts = buildConflictsForBlueprints(ids);
  return normalized.map((ai, i) => aiToBlueprintType(ai, i, ids, conflicts));
}

async function generateBlueprints(problem: string): Promise<Blueprint[]> {
  if (FORCE_MOCK_BLUEPRINTS) {
    const cached = loadMockBlueprints();
    if (cached) {
      console.log('[Mock] FORCE_MOCK_BLUEPRINTS=true, using saved mock-blueprints.json');
      return cached;
    }

    console.warn('[Mock] FORCE_MOCK_BLUEPRINTS=true, but no valid mock blueprints were found');
    return [];
  }

  const userContent = buildContextMessage(problem);

  // Try ZAI first
  try {
    const rawText = await callZAI(userContent);
    const normalized = parseAIBlueprints(rawText);
    if (normalized.length > 0) {
      const blueprints = assembleBlueprints(normalized);
      saveMockBlueprints(blueprints);
      return blueprints;
    }
  } catch (zaiErr) {
    console.warn('[ZAI] failed, trying Gemini:', (zaiErr as Error).message);
  }

  // Gemini fallback
  try {
    const rawText = await callGemini(userContent);
    const normalized = parseAIBlueprints(rawText);
    if (normalized.length > 0) {
      const blueprints = assembleBlueprints(normalized);
      saveMockBlueprints(blueprints);
      return blueprints;
    }
  } catch (geminiErr) {
    console.warn('[Gemini] failed, trying saved mock data:', (geminiErr as Error).message);
  }

  // Saved mock data fallback
  const cached = loadMockBlueprints();
  if (cached) {
    console.log('[Mock] using saved mock-blueprints.json');
    return cached;
  }

  return [];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const problem: string = body.problem ?? '';

    if (!problem.trim()) {
      return NextResponse.json({ error: 'problem is required' }, { status: 400 });
    }

    const blueprints = await generateBlueprints(problem);

    if (blueprints.length === 0) {
      return NextResponse.json({ blueprints: null, fallback: true });
    }

    return NextResponse.json({ blueprints, fallback: false });
  } catch (err) {
    console.error('generate-blueprint route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
