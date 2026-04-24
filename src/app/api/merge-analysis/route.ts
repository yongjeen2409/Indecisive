import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildMergedSystemName } from '../../../lib/mergeNaming';
import { ZAIMergeRecommendation } from '../../../types';

export const maxDuration = 120;

const DEFAULT_ZAI_BASE_URL = 'https://api.z.ai/api/paas/v4/';
const DEFAULT_ZAI_MODEL = 'glm-5.1';

const SYSTEM_PROMPT = `You are a senior enterprise architect specializing in system consolidation and digital transformation.
Analyze a set of approved project blueprints and existing organizational systems, then group them into optimal merger lanes - clusters of blueprints and systems that should be unified into a single platform.

Rules:
1. Each blueprint and system can appear in AT MOST ONE lane (no duplicates across lanes)
2. Group by: functional overlap, department affinity, technology stack similarity, cost consolidation opportunity
3. Not all items need to be assigned - some may be standalone and should be left out
4. Give each lane a compelling unified product name (what the merged entity would be called)
5. Lanes should have 2+ items for a meaningful merge
6. Output ONLY valid JSON, no markdown fences, no explanation outside the JSON

Output format:
{
  "lanes": [
    {
      "id": "lane-1",
      "title": "Unified name for merged entity",
      "rationale": "2-3 sentences explaining why these items should merge and what value it creates",
      "projectedSavings": "$XXk/mo",
      "compatibilityScore": 85,
      "blueprintIds": ["bp-id-1"],
      "systemIds": ["sys-id-1"]
    }
  ]
}`;

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

async function callZAI(userContent: string): Promise<string> {
  const baseURL = process.env.ZAI_BASE_URL ?? DEFAULT_ZAI_BASE_URL;
  const model = process.env.ZAI_MODEL ?? DEFAULT_ZAI_MODEL;
  const apiKey = process.env.ZAI_API_KEY ?? '';

  const client = new OpenAI({ apiKey, baseURL });
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    temperature: 0.5,
    max_tokens: 4000,
  });
  return completion.choices[0]?.message?.content ?? '';
}

function buildMockLanes(
  blueprints: { id: string; title: string; department: string }[],
  systems: { id: string; name: string; department: string; monthlyCost: number }[],
): ZAIMergeRecommendation[] {
  const deptMap = new Map<string, { bps: typeof blueprints; sys: typeof systems }>();

  for (const bp of blueprints) {
    const d = bp.department || 'General';
    if (!deptMap.has(d)) deptMap.set(d, { bps: [], sys: [] });
    deptMap.get(d)!.bps.push(bp);
  }
  for (const s of systems) {
    const d = s.department || 'General';
    if (!deptMap.has(d)) deptMap.set(d, { bps: [], sys: [] });
    deptMap.get(d)!.sys.push(s);
  }

  const lanes: ZAIMergeRecommendation[] = [];
  for (const [dept, items] of deptMap.entries()) {
    if (items.bps.length + items.sys.length < 2) continue;

    const candidateIds: string[] = [];
    const candidateType: Record<string, 'blueprint' | 'system'> = {};

    for (const bp of items.bps) { candidateIds.push(bp.id); candidateType[bp.id] = 'blueprint'; }
    for (const s of items.sys) { candidateIds.push(s.id); candidateType[s.id] = 'system'; }

    const savings = Math.floor(Math.random() * 40 + 20);
    const score = Math.floor(Math.random() * 20 + 72);

    lanes.push({
      id: createId('lane'),
      title: buildMergedSystemName({
        department: dept,
        blueprintTitles: items.bps.map(bp => bp.title),
        systemNames: items.sys.map(system => system.name),
      }),
      rationale: `Consolidating ${dept} blueprints and systems under one platform eliminates redundant tooling, reduces operational overhead, and creates a single source of truth for ${dept.toLowerCase()} data.`,
      candidateIds,
      candidateType,
      projectedSavings: `$${savings}k/mo`,
      compatibilityScore: score,
    });
  }

  return lanes;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const blueprints: { id: string; title: string; department: string }[] = body.blueprints ?? [];
    const systems: { id: string; name: string; department: string; monthlyCost: number }[] = body.systems ?? [];
    const blueprintsById = new Map(blueprints.map(blueprint => [blueprint.id, blueprint]));
    const systemsById = new Map(systems.map(system => [system.id, system]));

    if (blueprints.length === 0 && systems.length === 0) {
      return NextResponse.json({ lanes: [] });
    }

    const userContent = `APPROVED BLUEPRINTS:\n${JSON.stringify(blueprints, null, 2)}\n\nEXISTING SYSTEMS:\n${JSON.stringify(systems, null, 2)}\n\nGroup these into merger lanes. Return JSON only.`;

    let raw: string;
    try {
      raw = await callZAI(userContent);
    } catch {
      return NextResponse.json({ lanes: buildMockLanes(blueprints, systems) });
    }

    try {
      const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
      const parsed = JSON.parse(cleaned);

      const lanes: ZAIMergeRecommendation[] = (parsed.lanes ?? []).map((lane: {
        id?: string;
        title?: string;
        rationale?: string;
        projectedSavings?: string;
        compatibilityScore?: number;
        blueprintIds?: string[];
        systemIds?: string[];
      }, i: number) => {
        const blueprintIds = lane.blueprintIds ?? [];
        const systemIds = lane.systemIds ?? [];
        const candidateIds: string[] = [];
        const candidateType: Record<string, 'blueprint' | 'system'> = {};

        for (const id of blueprintIds) { candidateIds.push(id); candidateType[id] = 'blueprint'; }
        for (const id of systemIds) { candidateIds.push(id); candidateType[id] = 'system'; }

        const blueprintTitles = blueprintIds.map(id => blueprintsById.get(id)?.title).filter((value): value is string => Boolean(value));
        const systemNames = systemIds.map(id => systemsById.get(id)?.name).filter((value): value is string => Boolean(value));
        const department =
          blueprintIds.map(id => blueprintsById.get(id)?.department).find(Boolean) ??
          systemIds.map(id => systemsById.get(id)?.department).find(Boolean) ??
          'Technology';

        return {
          id: lane.id ?? createId('lane'),
          title: buildMergedSystemName({
            proposedName: lane.title ?? `Merge Lane ${i + 1}`,
            department,
            blueprintTitles,
            systemNames,
          }),
          rationale: lane.rationale ?? '',
          candidateIds,
          candidateType,
          projectedSavings: lane.projectedSavings ?? '$0/mo',
          compatibilityScore: lane.compatibilityScore ?? 75,
        };
      });

      return NextResponse.json({ lanes });
    } catch {
      return NextResponse.json({ lanes: buildMockLanes(blueprints, systems) });
    }
  } catch {
    return NextResponse.json({ lanes: [] }, { status: 500 });
  }
}

