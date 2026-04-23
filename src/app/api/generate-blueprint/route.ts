import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { Blueprint, Conflict, Phase, FinanceModel, Scores, ScoringInsight, TechStackCategory } from '../../../types';
import { normalizeTechStack } from '../../../lib/techStack';

export const maxDuration = 300;
const DEFAULT_ILMU_BASE_URL = 'https://api.ilmu.ai/v1';
const DEFAULT_ILMU_MODEL = 'ilmu-glm-5.1';
const DEFAULT_ZAI_BASE_URL = 'https://api.z.ai/api/paas/v4/';
const DEFAULT_ZAI_MODEL = 'glm-5.1';

const COLOR_TOKENS = [
  { color: 'var(--color-primary)', accentColor: 'var(--color-primary)' },
  { color: 'var(--color-success)', accentColor: 'var(--color-success)' },
  { color: 'var(--color-warning)', accentColor: 'var(--color-warning)' },
];
const MOCK_BLUEPRINTS_SCHEMA_VERSION = 3;
const MOCK_PROTOTYPE_FALLBACK_SOURCE = 'data/interactive_prototype_mock_data.jsx';
const RESPONSE_SCHEMA_VERSION = 1;
const RESPONSE_DIR = path.join(process.cwd(), 'data', 'response');
const RESPONSE_PROTOTYPE_DIR = path.join(RESPONSE_DIR, 'prototype');
const RESPONSE_PROTOTYPE_PATHS = [
  'data/response/prototype/support-self-service-ai.jsx',
  'data/response/prototype/support-agent-assist.jsx',
  'data/response/prototype/support-knowledge-automation.jsx',
];
const RESPONSE_ARTIFACT_FILES = {
  index: 'index.json',
  prototypeConcepts: 'prototype-concepts.json',
  systemArchitectures: 'system-architectures.json',
  techStacks: 'tech-stacks.json',
  financeModels: 'finance-models.json',
  timelines: 'timelines.json',
  decisionReasoning: 'decision-reasoning.json',
};

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

function stringifyContextData(value: unknown) {
  return JSON.stringify(value);
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
${stringifyContextData(budget)}

=== ACTIVE PROJECTS (in development) ===
${stringifyContextData(projects)}

=== PRODUCT PORTFOLIO (shipped products) ===
${stringifyContextData(products)}

=== PAST REJECTED IDEAS ===
${stringifyContextData(rejected)}

=== MARKET RESEARCH ===
${stringifyContextData(market)}

=== HR SYSTEM (employees & capacity) ===
${stringifyContextData(hr)}

=== LEGAL & COMPLIANCE POLICIES ===
${stringifyContextData(legal)}`;
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

const BLUEPRINT_SYSTEM_PROMPT = `You are a senior enterprise solutions architect. Analyze the business problem and company data, then generate exactly 3 distinct solution blueprints.

Return ONLY a valid JSON object — no markdown, no explanation, no code fences. Structure:
{
  "blueprints": [
    {
      "title": "Concise blueprint name",
      "department": "Primary owning department",
      "description": "2-3 sentence executive summary grounded in the company context",
      "summary": "One sentence prototype preview summary",
      "prototypeBrief": {
        "objective": "What the interactive prototype should demonstrate",
        "primaryUser": "Primary user persona",
        "keyScreens": ["Screen or panel 1", "Screen or panel 2", "Screen or panel 3"],
        "interactions": ["Clickable filter", "Approve button", "Tab switch"],
        "sampleData": ["Realistic metric or data point to show"],
        "visualDirection": "Distinct visual style and layout direction",
        "successMetric": "Primary metric the prototype should emphasize"
      },
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
7. Do not include prototypeSourceJsx or prototypeCode in this response
8. prototypeBrief must be detailed enough for a separate designer/developer model call to build an interactive prototype`;

const PROTOTYPE_GENERATION_PROMPT = `You are a senior product designer and frontend prototyper. Generate one rich interactive prototype for a single solution blueprint.

Return ONLY a valid JSON object - no markdown, no explanation, no code fences. Structure:
{
  "prototypeCode": "Complete self-contained HTML document with inline CSS and vanilla JavaScript.",
  "prototypeSourceJsx": "Optional complete self-contained .jsx file source exporting one default React component accepting { embedded = false }."
}

Rules:
1. prototypeCode is required and must be a complete HTML document with inline CSS and vanilla JavaScript
2. prototypeCode must be interactive with buttons, filters, tabs, or panel state
3. prototypeCode must be at least 400px tall, responsive, and visually polished
4. Use realistic mock data that matches the blueprint and company context
5. No external CDN links, image URLs, imports, or network calls
6. prototypeSourceJsx, if included, must be a valid self-contained .jsx file with no markdown fences`;

interface PrototypeBrief {
  objective?: string;
  primaryUser?: string;
  keyScreens?: string[];
  interactions?: string[];
  sampleData?: string[];
  visualDirection?: string;
  successMetric?: string;
}

interface AIPrototype {
  prototypeCode?: string;
  prototypeSourceJsx?: string;
}

interface AIBlueprint {
  title: string;
  department: string;
  description: string;
  summary?: string;
  prototypeBrief?: PrototypeBrief;
  prototypeSourceJsx?: string;
  prototypeSourcePath?: string;
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
  let inString = false;
  let escaped = false;
  for (let i = firstBrace; i < text.length; i++) {
    const char = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\' && inString) {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{') depth++;
    else if (char === '}') {
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
  const description = raw.description ?? 'A strategic solution addressing the identified business problem.';

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
    description,
    summary: raw.summary ?? raw.prototypeBrief?.objective ?? `${description.split('.')[0]}.`,
    prototypeBrief: raw.prototypeBrief,
    prototypeSourceJsx: raw.prototypeSourceJsx,
    prototypeSourcePath: raw.prototypeSourcePath,
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
      summary: ai.summary ?? `${ai.description.split('.')[0]}.`,
      prototypeSourceJsx: ai.prototypeSourceJsx,
      prototypeSourcePath: ai.prototypeSourcePath,
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

function responseArtifactPath(fileName: string) {
  return path.join(RESPONSE_DIR, fileName);
}

function responsePrototypePath(index: number) {
  return RESPONSE_PROTOTYPE_PATHS[index] ?? RESPONSE_PROTOTYPE_PATHS[0];
}

function toAbsoluteWorkspacePath(relativePath: string) {
  return path.join(process.cwd(), relativePath.replace(/[\\/]+/g, path.sep));
}

function readJsonFile(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function readResponseArtifact(fileName: string): Record<string, unknown> | null {
  try {
    const parsed = readJsonFile(responseArtifactPath(fileName));
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function getVersions(value: Record<string, unknown> | null): Record<string, unknown>[] {
  if (!value || !Array.isArray(value.versions)) return [];
  return value.versions.filter(isRecord);
}

function findVersion(versions: Record<string, unknown>[], id: string): Record<string, unknown> | null {
  return versions.find(version => version.id === id) ?? null;
}

function getString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function getNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function getStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function getPhaseArray(value: unknown): Phase[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isRecord)
    .map(phase => ({
      name: getString(phase.name, 'Phase'),
      duration: getString(phase.duration, '4 weeks'),
      deliverables: getStringArray(phase.deliverables),
    }))
    .filter(phase => phase.name && phase.deliverables.length > 0);
}

function getScores(value: unknown): AIBlueprint['scores'] {
  const record = isRecord(value) ? value : {};

  return {
    feasibility: getNumber(record.feasibility, 75),
    businessImpact: getNumber(record.businessImpact, 78),
    effort: getNumber(record.effort, 70),
    riskConflict: getNumber(record.riskConflict, 65),
  };
}

function getScoringInsights(value: unknown): ScoringInsight[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isRecord)
    .map(item => {
      const status = item.status;
      const normalizedStatus: ScoringInsight['status'] =
        status === 'positive' || status === 'neutral' || status === 'warning' ? status : 'neutral';

      return {
        dimension: getString(item.dimension, 'Decision factor'),
        status: normalizedStatus,
        summary: getString(item.summary, 'No reasoning summary provided.'),
        score: getNumber(item.score, 70),
      };
    })
    .filter(item => item.dimension && item.summary)
    .slice(0, 7);
}

function getFinanceInput(value: unknown): AIBlueprint['financeModel'] {
  const record = isRecord(value) ? value : {};

  return {
    capexValue: getNumber(record.capexValue, 200000),
    opexMonthlyValue: getNumber(record.opexMonthlyValue, 18000),
    roiValue: getNumber(record.roiValue, 200),
    paybackMonths: getNumber(record.paybackMonths, 12),
  };
}

function stripMarkdownFence(source: string) {
  const trimmed = source.trim();
  const fenceMatch = trimmed.match(/^```(?:html|jsx|javascript|js)?\s*([\s\S]*?)```$/);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

function isUsablePrototypeSource(source: string | undefined): source is string {
  if (!source) return false;
  const cleaned = stripMarkdownFence(source);
  return cleaned.includes('export default') && !/https?:\/\//.test(cleaned);
}

function withPrototypeSourcePaths(blueprints: Blueprint[]): Blueprint[] {
  return blueprints.map((blueprint, index) => ({
    ...blueprint,
    prototypePreview: {
      ...blueprint.prototypePreview,
      prototypeSourcePath: responsePrototypePath(index),
    },
  }));
}

function ensureResponseDirectories() {
  fs.mkdirSync(RESPONSE_DIR, { recursive: true });
  fs.mkdirSync(RESPONSE_PROTOTYPE_DIR, { recursive: true });
}

function writeResponseArtifact(fileName: string, data: unknown) {
  fs.writeFileSync(responseArtifactPath(fileName), JSON.stringify(data, null, 2), 'utf-8');
}

function savePrototypeSource(index: number, source: string | undefined) {
  if (!isUsablePrototypeSource(source)) return;

  const prototypePath = responsePrototypePath(index);
  fs.writeFileSync(toAbsoluteWorkspacePath(prototypePath), `${stripMarkdownFence(source)}\n`, 'utf-8');
}

type AIProvider = 'ilmu' | 'zai' | 'gemini';

function saveResponseArtifacts(blueprints: Blueprint[], provider: AIProvider, problem: string) {
  try {
    ensureResponseDirectories();
    const savedAt = new Date().toISOString();
    const budget = loadDataSource('budget.json');
    const versions = blueprints.map((blueprint, index) => ({
      id: blueprint.id,
      title: blueprint.title,
      department: blueprint.department,
      prototypeSourcePath: responsePrototypePath(index),
      color: blueprint.color,
      accentColor: blueprint.accentColor,
    }));
    const meta = {
      schemaVersion: RESPONSE_SCHEMA_VERSION,
      problemStatement: problem,
      savedAt,
      sourceProvider: provider,
    };

    blueprints.forEach((blueprint, index) => savePrototypeSource(index, blueprint.prototypePreview.prototypeSourceJsx));

    writeResponseArtifact(RESPONSE_ARTIFACT_FILES.index, {
      meta: {
        ...meta,
        sourceProviders: [provider],
        fallbackPurpose: 'Artifact-based fallback for API failures',
      },
      files: {
        prototypeConcepts: 'data/response/prototype-concepts.json',
        systemArchitectures: 'data/response/system-architectures.json',
        techStacks: 'data/response/tech-stacks.json',
        financeModels: 'data/response/finance-models.json',
        timelines: 'data/response/timelines.json',
        decisionReasoning: 'data/response/decision-reasoning.json',
      },
      versions,
    });

    writeResponseArtifact(RESPONSE_ARTIFACT_FILES.prototypeConcepts, {
      meta: { ...meta, artifact: 'prototype-concepts' },
      versions: blueprints.map((blueprint, index) => ({
        id: blueprint.id,
        title: blueprint.title,
        department: blueprint.department,
        description: blueprint.description,
        summary: blueprint.prototypePreview.summary,
        prototypeSourcePath: responsePrototypePath(index),
        providerSources: [provider],
      })),
    });

    writeResponseArtifact(RESPONSE_ARTIFACT_FILES.systemArchitectures, {
      meta: { ...meta, artifact: 'system-architectures' },
      versions: blueprints.map(blueprint => ({
        id: blueprint.id,
        architecture: blueprint.architecture,
      })),
    });

    writeResponseArtifact(RESPONSE_ARTIFACT_FILES.techStacks, {
      meta: { ...meta, artifact: 'tech-stacks' },
      versions: blueprints.map(blueprint => ({
        id: blueprint.id,
        techStack: blueprint.techStack,
      })),
    });

    writeResponseArtifact(RESPONSE_ARTIFACT_FILES.financeModels, {
      meta: {
        ...meta,
        artifact: 'finance-models',
        budgetContext: isRecord(budget)
          ? {
              currency: budget.currency,
              fiscalYear: budget.fiscalYear,
              remainingBudget: budget.remaining,
              remainingCapex: typeof budget.capexBudget === 'number' && typeof budget.capexUsed === 'number'
                ? budget.capexBudget - budget.capexUsed
                : undefined,
            }
          : undefined,
      },
      versions: blueprints.map(blueprint => ({
        id: blueprint.id,
        financeModel: {
          capexValue: blueprint.financeModel.capexValue,
          opexMonthlyValue: blueprint.financeModel.opexMonthlyValue,
          roiValue: blueprint.financeModel.roiValue,
          paybackMonths: blueprint.financeModel.paybackMonths,
        },
      })),
    });

    writeResponseArtifact(RESPONSE_ARTIFACT_FILES.timelines, {
      meta: { ...meta, artifact: 'timelines' },
      versions: blueprints.map(blueprint => ({
        id: blueprint.id,
        timeline: blueprint.timeline,
      })),
    });

    writeResponseArtifact(RESPONSE_ARTIFACT_FILES.decisionReasoning, {
      meta: { ...meta, artifact: 'decision-reasoning' },
      versions: blueprints.map(blueprint => ({
        id: blueprint.id,
        scores: {
          feasibility: blueprint.scores.feasibility,
          businessImpact: blueprint.scores.businessImpact,
          effort: blueprint.scores.effort,
          riskConflict: blueprint.scores.riskConflict,
        },
        problemFit: {
          score: blueprint.scores.businessImpact,
          summary: blueprint.description,
        },
        categoryScores: blueprint.scoringInsights,
      })),
    });

    console.log(`[Response] saved ${provider} artifacts to data/response`);
  } catch (err) {
    console.warn('[Response] failed to save response artifacts:', (err as Error).message);
  }
}

function loadPrototypeSource(prototypeSourcePath: string) {
  try {
    return fs.readFileSync(toAbsoluteWorkspacePath(prototypeSourcePath), 'utf-8');
  } catch {
    return undefined;
  }
}

function loadResponseBlueprints(): Blueprint[] | null {
  try {
    const indexArtifact = readResponseArtifact(RESPONSE_ARTIFACT_FILES.index);
    const indexVersions = getVersions(indexArtifact).slice(0, 3);
    if (indexVersions.length !== 3) return null;

    const conceptVersions = getVersions(readResponseArtifact(RESPONSE_ARTIFACT_FILES.prototypeConcepts));
    const architectureVersions = getVersions(readResponseArtifact(RESPONSE_ARTIFACT_FILES.systemArchitectures));
    const techStackVersions = getVersions(readResponseArtifact(RESPONSE_ARTIFACT_FILES.techStacks));
    const financeVersions = getVersions(readResponseArtifact(RESPONSE_ARTIFACT_FILES.financeModels));
    const timelineVersions = getVersions(readResponseArtifact(RESPONSE_ARTIFACT_FILES.timelines));
    const reasoningVersions = getVersions(readResponseArtifact(RESPONSE_ARTIFACT_FILES.decisionReasoning));

    const ids = indexVersions.map((version, index) => getString(version.id, `response-${index + 1}`));
    const conflicts = buildConflictsForBlueprints(ids);

    const blueprints = indexVersions.map((version, index): Blueprint => {
      const id = ids[index];
      const concept = findVersion(conceptVersions, id);
      const architecture = findVersion(architectureVersions, id);
      const techStack = findVersion(techStackVersions, id);
      const finance = findVersion(financeVersions, id);
      const timeline = findVersion(timelineVersions, id);
      const reasoning = findVersion(reasoningVersions, id);
      const financeInput = getFinanceInput(finance?.financeModel);
      const rawTechStack = techStack?.techStack;
      const rawScores = getScores(reasoning?.scores);
      const prototypeSourcePath = getString(concept?.prototypeSourcePath, getString(version.prototypeSourcePath, responsePrototypePath(index)));
      const description = getString(concept?.description, 'A customer support automation blueprint.');
      const colorToken = COLOR_TOKENS[index % COLOR_TOKENS.length];

      return {
        id,
        title: getString(concept?.title, getString(version.title, `Support Automation Blueprint ${index + 1}`)),
        department: getString(concept?.department, getString(version.department, ['Engineering', 'Operations', 'Strategy & Data'][index])),
        description,
        prototypePreview: {
          title: 'Prototype concept',
          summary: getString(concept?.summary, description.split('.')[0] + '.'),
          screens: [],
          prototypeSourcePath,
          prototypeSourceJsx: loadPrototypeSource(prototypeSourcePath),
        },
        architecture: getStringArray(architecture?.architecture),
        techStack: normalizeTechStack(isTechStackCategoryArray(rawTechStack) ? rawTechStack : [], 'Core stack'),
        financeModel: buildFinanceModel(
          financeInput.capexValue,
          financeInput.opexMonthlyValue,
          financeInput.roiValue,
          financeInput.paybackMonths,
        ),
        scores: buildScores(rawScores.feasibility, rawScores.businessImpact, rawScores.effort, rawScores.riskConflict),
        conflicts: conflicts.filter(conflict => conflict.affectedBlueprints.includes(id)),
        scoringInsights: getScoringInsights(reasoning?.categoryScores),
        timeline: getPhaseArray(timeline?.timeline),
        color: getString(version.color, colorToken.color),
        accentColor: getString(version.accentColor, colorToken.accentColor),
      };
    });

    if (blueprints.some(blueprint => blueprint.architecture.length === 0 || blueprint.techStack.length === 0 || blueprint.timeline.length === 0 || blueprint.scoringInsights.length !== 7)) {
      return null;
    }

    return blueprints;
  } catch {
    return null;
  }
}

function normalizeBaseURL(baseURL: string) {
  return baseURL.endsWith('/') ? baseURL : `${baseURL}/`;
}

function isLikelyIlmuApiKey(apiKey: string) {
  return /^sk-[a-f0-9]{48}$/i.test(apiKey.trim());
}

function getIlmuApiKey() {
  const apiKey = process.env.ILMU_API_KEY?.trim();
  if (apiKey) return apiKey;

  const legacyZaiKey = process.env.ZAI_API_KEY?.trim();
  return legacyZaiKey && isLikelyIlmuApiKey(legacyZaiKey) ? legacyZaiKey : '';
}

function getZaiApiKey() {
  const apiKey = process.env.ZAI_API_KEY?.trim();
  if (!apiKey || isLikelyIlmuApiKey(apiKey)) return '';
  return apiKey;
}

type ProviderLabel = 'ILMU' | 'ZAI' | 'Gemini';
type ChatMessage = { role: 'system' | 'user'; content: string };

const BLUEPRINT_MAX_TOKENS = 5000;
const PROTOTYPE_MAX_TOKENS = 5500;
const PROVIDER_TIMEOUT_MS = 180000;

async function callOpenAICompatibleProvider({
  provider,
  apiKey,
  baseURL,
  model,
  messages,
  maxTokens,
  temperature = 0.7,
}: {
  provider: 'ILMU' | 'ZAI';
  apiKey: string;
  baseURL: string;
  model: string;
  messages: ChatMessage[];
  maxTokens: number;
  temperature?: number;
}): Promise<string> {
  const client = new OpenAI({
    apiKey,
    baseURL: normalizeBaseURL(baseURL),
    maxRetries: 1,
    timeout: PROVIDER_TIMEOUT_MS,
  });

  const completion = await client.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  });

  const content = completion.choices[0]?.message?.content;
  if (typeof content === 'string') {
    console.log(`[${provider}] response received`);
    return content;
  }

  const contentParts: unknown[] = Array.isArray(content) ? content : [];
  const data = contentParts
    .map(part => {
      if (isRecord(part) && typeof part.text === 'string') return part.text;
      return '';
    })
    .join('');
  console.log(`[${provider}] response received`);
  return data;
}

async function callILMU(messages: ChatMessage[], maxTokens: number): Promise<string> {
  const apiKey = getIlmuApiKey();
  if (!apiKey) throw new Error('ILMU_API_KEY not set');

  const baseURL = process.env.ILMU_BASE_URL?.trim() || DEFAULT_ILMU_BASE_URL;
  const model = process.env.ILMU_MODEL?.trim() || DEFAULT_ILMU_MODEL;

  return callOpenAICompatibleProvider({
    provider: 'ILMU',
    apiKey,
    baseURL,
    model,
    messages,
    maxTokens,
  });
}

async function callZAI(messages: ChatMessage[], maxTokens: number): Promise<string> {
  const apiKey = getZaiApiKey();
  if (!apiKey) throw new Error('ZAI_API_KEY not set');

  const configuredBaseURL = process.env.ZAI_BASE_URL?.trim();
  const baseURL = configuredBaseURL || DEFAULT_ZAI_BASE_URL;
  const model = process.env.ZAI_MODEL?.trim() || DEFAULT_ZAI_MODEL;

  return callOpenAICompatibleProvider({
    provider: 'ZAI',
    apiKey,
    baseURL,
    model,
    messages,
    maxTokens,
  });
}

async function callGemini(systemPrompt: string, userContent: string, maxOutputTokens: number): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') throw new Error('GEMINI_API_KEY not set');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userContent }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
          maxOutputTokens,
        },
      }),
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
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

interface GenerationProvider {
  provider: AIProvider;
  label: ProviderLabel;
  generateBlueprintPlan: (userContent: string) => Promise<string>;
  generatePrototype: (userContent: string) => Promise<string>;
}

function getGenerationProviders(): GenerationProvider[] {
  const providers: GenerationProvider[] = [];

  if (getIlmuApiKey()) {
    providers.push({
      provider: 'ilmu',
      label: 'ILMU',
      generateBlueprintPlan: userContent => callILMU([
        { role: 'system', content: BLUEPRINT_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ], BLUEPRINT_MAX_TOKENS),
      generatePrototype: userContent => callILMU([
        { role: 'system', content: PROTOTYPE_GENERATION_PROMPT },
        { role: 'user', content: userContent },
      ], PROTOTYPE_MAX_TOKENS),
    });
  }

  if (getZaiApiKey()) {
    providers.push({
      provider: 'zai',
      label: 'ZAI',
      generateBlueprintPlan: userContent => callZAI([
        { role: 'system', content: BLUEPRINT_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ], BLUEPRINT_MAX_TOKENS),
      generatePrototype: userContent => callZAI([
        { role: 'system', content: PROTOTYPE_GENERATION_PROMPT },
        { role: 'user', content: userContent },
      ], PROTOTYPE_MAX_TOKENS),
    });
  }

  if (process.env.GEMINI_API_KEY?.trim()) {
    providers.push({
      provider: 'gemini',
      label: 'Gemini',
      generateBlueprintPlan: userContent => callGemini(BLUEPRINT_SYSTEM_PROMPT, userContent, BLUEPRINT_MAX_TOKENS),
      generatePrototype: userContent => callGemini(PROTOTYPE_GENERATION_PROMPT, userContent, PROTOTYPE_MAX_TOKENS),
    });
  }

  return providers;
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

function parseAIPrototype(rawText: string): AIPrototype {
  const jsonStr = extractJSON(rawText);
  const parsed = JSON.parse(jsonStr);
  if (!isRecord(parsed)) return {};

  const prototypeCode = typeof parsed.prototypeCode === 'string'
    ? stripMarkdownFence(parsed.prototypeCode)
    : undefined;
  const prototypeSourceJsx = typeof parsed.prototypeSourceJsx === 'string'
    ? stripMarkdownFence(parsed.prototypeSourceJsx)
    : undefined;

  return {
    prototypeCode: prototypeCode?.trim() || undefined,
    prototypeSourceJsx: prototypeSourceJsx?.trim() || undefined,
  };
}

function buildPrototypePrompt(problem: string, blueprint: AIBlueprint, index: number) {
  return `Build one interactive prototype for this generated solution blueprint.

The API response will render prototypeCode immediately in an iframe, so prototypeCode is the required primary output.
prototypeSourceJsx is optional and will be saved as a development artifact if it is valid.

Use this stable artifact path for any JSX source metadata: ${responsePrototypePath(index)}

Input:
${JSON.stringify({
  problem,
  blueprint: {
    title: blueprint.title,
    department: blueprint.department,
    description: blueprint.description,
    summary: blueprint.summary,
    prototypeBrief: blueprint.prototypeBrief,
    architecture: blueprint.architecture,
    techStack: blueprint.techStack,
    financeModel: blueprint.financeModel,
    timeline: blueprint.timeline,
    scores: blueprint.scores,
    scoringInsights: blueprint.scoringInsights,
  },
})}`;
}

async function generatePrototypeForBlueprint(
  blueprint: AIBlueprint,
  index: number,
  problem: string,
  providers: GenerationProvider[],
): Promise<AIPrototype> {
  const prompt = buildPrototypePrompt(problem, blueprint, index);

  for (const [providerIndex, provider] of providers.entries()) {
    try {
      const rawText = await provider.generatePrototype(prompt);
      const prototype = parseAIPrototype(rawText);
      if (prototype.prototypeCode || prototype.prototypeSourceJsx) {
        return prototype;
      }
      console.warn(`[${provider.label}] returned no usable prototype for ${blueprint.title}`);
    } catch (err) {
      const nextProvider = providers[providerIndex + 1]?.label ?? 'static prototype fallback';
      console.warn(`[${provider.label}] prototype failed for ${blueprint.title}, trying ${nextProvider}:`, (err as Error).message);
    }
  }

  return {};
}

async function attachGeneratedPrototypes(
  blueprints: AIBlueprint[],
  problem: string,
  providers: GenerationProvider[],
) {
  return Promise.all(blueprints.map(async (blueprint, index) => {
    const prototype = await generatePrototypeForBlueprint(blueprint, index, problem, providers);
    return {
      ...blueprint,
      ...prototype,
      prototypeSourcePath: responsePrototypePath(index),
    };
  }));
}

function assembleBlueprints(normalized: AIBlueprint[]): Blueprint[] {
  const ids = normalized.map(() => createId('bp'));
  const conflicts = buildConflictsForBlueprints(ids);
  return normalized.map((ai, i) => aiToBlueprintType(ai, i, ids, conflicts));
}

async function generateBlueprints(problem: string, { persist = true } = {}): Promise<Blueprint[]> {
  const userContent = buildContextMessage(problem);
  const providers = getGenerationProviders();

  for (const [index, providerConfig] of providers.entries()) {
    try {
      const rawText = await providerConfig.generateBlueprintPlan(userContent);
      const normalized = parseAIBlueprints(rawText);
      if (normalized.length > 0) {
        const normalizedWithPrototypes = await attachGeneratedPrototypes(normalized, problem, providers);
        const blueprints = withPrototypeSourcePaths(assembleBlueprints(normalizedWithPrototypes));
        if (persist) {
          saveResponseArtifacts(blueprints, providerConfig.provider, problem);
          saveMockBlueprints(blueprints);
        }
        return blueprints;
      }
      console.warn(`[${providerConfig.label}] returned no usable blueprints`);
    } catch (err) {
      const nextProvider = providers[index + 1]?.label ?? 'saved mock data';
      console.warn(`[${providerConfig.label}] failed, trying ${nextProvider}:`, (err as Error).message);
    }
  }

  // Structured response fallback
  const responseFallback = loadResponseBlueprints();
  if (responseFallback) {
    console.log('[Response] using saved data/response artifacts');
    return responseFallback;
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
    const persist = body.persist !== false;

    if (!problem.trim()) {
      return NextResponse.json({ error: 'problem is required' }, { status: 400 });
    }

    const blueprints = await generateBlueprints(problem, { persist });

    if (blueprints.length === 0) {
      return NextResponse.json({ blueprints: null, fallback: true });
    }

    return NextResponse.json({ blueprints, fallback: false });
  } catch (err) {
    console.error('generate-blueprint route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
