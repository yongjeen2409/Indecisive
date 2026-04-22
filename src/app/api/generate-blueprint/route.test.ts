// @vitest-environment node

import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const zaiSdkMocks = vi.hoisted(() => {
  const create = vi.fn();
  const OpenAI = vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create,
      },
    },
  }));

  return { create, OpenAI };
});

vi.mock('openai', () => ({
  default: zaiSdkMocks.OpenAI,
}));

const ORIGINAL_CWD = process.cwd();
const REPO_MOCK_BLUEPRINTS_PATH = path.join(ORIGINAL_CWD, 'data', 'mock-blueprints.json');
const ORIGINAL_ZAI_API_KEY = process.env.ZAI_API_KEY;
const ORIGINAL_ZAI_BASE_URL = process.env.ZAI_BASE_URL;
const ORIGINAL_ZAI_MODEL = process.env.ZAI_MODEL;
const ORIGINAL_GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TEMP_DIRS: string[] = [];

function createLegacyBlueprint(index: number) {
  return {
    title: `Stored blueprint ${index + 1}`,
    department: ['Engineering', 'Operations', 'Strategy & Data'][index] ?? 'Engineering',
    description: `Blueprint ${index + 1} focuses on reducing delivery friction across teams.`,
    prototypeCode: `<!doctype html><html><body><main>Prototype ${index + 1}</main></body></html>`,
    architecture: [
      `Experience Layer ${index + 1}: Operator workspace (React)`,
      `Service Layer ${index + 1}: Decision orchestration (FastAPI)`,
      `Data Layer ${index + 1}: Shared records (PostgreSQL)`,
      `Automation Layer ${index + 1}: Workflow engine (Temporal)`,
      `Infrastructure Layer ${index + 1}: Hosting and monitoring (Kubernetes)`,
    ],
    techStack: ['React', 'FastAPI', 'PostgreSQL', 'Temporal', 'Kubernetes'],
    financeModel: {
      capexValue: 120000 + index * 30000,
      opexMonthlyValue: 9000 + index * 2000,
      roiValue: 180 + index * 25,
      paybackMonths: 9 + index,
    },
    timeline: [
      {
        name: 'Phase 1 - Foundation',
        duration: '4 weeks',
        deliverables: ['Scope baseline', 'Architecture review', 'Delivery owners assigned'],
      },
      {
        name: 'Phase 2 - MVP',
        duration: '6 weeks',
        deliverables: ['Core workflow live', 'Pilot users onboarded', 'Feedback loop active'],
      },
      {
        name: 'Phase 3 - Rollout',
        duration: '8 weeks',
        deliverables: ['Organization rollout', 'Monitoring active', 'Success review complete'],
      },
    ],
    scores: {
      feasibility: 78 + index,
      businessImpact: 84 + index,
      effort: 68 + index,
      riskConflict: 70 + index,
    },
    scoringInsights: [
      { dimension: 'Budget', status: 'positive', summary: 'Budget is within range.', score: 82 },
      { dimension: 'Project Pipeline', status: 'neutral', summary: 'Moderate overlap with active work.', score: 68 },
      { dimension: 'Product Portfolio', status: 'positive', summary: 'Extends current capabilities.', score: 80 },
      { dimension: 'Past Rejections', status: 'positive', summary: 'Distinct from rejected ideas.', score: 86 },
      { dimension: 'Market Research', status: 'positive', summary: 'Demand signal is favorable.', score: 84 },
      { dimension: 'HR & Execution', status: 'neutral', summary: 'Small staffing gap remains.', score: 72 },
      { dimension: 'Legal & Compliance', status: 'positive', summary: 'Standard review only.', score: 88 },
    ],
  };
}

function createRouteRequest(problem = 'Need a better cross-team blueprint process.') {
  return new Request('http://localhost/api/generate-blueprint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ problem }),
  });
}

function createTempWorkspace() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'indecisive-generate-blueprint-'));
  fs.mkdirSync(path.join(tempDir, 'data'), { recursive: true });
  TEMP_DIRS.push(tempDir);
  return tempDir;
}

function createZAIResponse() {
  return JSON.stringify({
    blueprints: [createLegacyBlueprint(0), createLegacyBlueprint(1), createLegacyBlueprint(2)],
  });
}

function createGeminiSuccessResponse(body: string) {
  return new Response(
    JSON.stringify({
      candidates: [{ content: { parts: [{ text: body }] } }],
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

async function importRouteForWorkspace(tempDir: string) {
  vi.resetModules();
  return import('./route');
}

function redirectMockBlueprintsFile(savedFile: string) {
  const actualReadFileSync = fs.readFileSync.bind(fs);
  const actualWriteFileSync = fs.writeFileSync.bind(fs);

  vi.spyOn(fs, 'readFileSync').mockImplementation((filePath, options) => {
    if (typeof filePath === 'string' && path.resolve(filePath) === REPO_MOCK_BLUEPRINTS_PATH) {
      if (!fs.existsSync(savedFile)) {
        const error = new Error(`ENOENT: no such file or directory, open '${savedFile}'`) as NodeJS.ErrnoException;
        error.code = 'ENOENT';
        throw error;
      }

      return actualReadFileSync(savedFile, options as never);
    }

    return actualReadFileSync(filePath, options as never);
  });

  vi.spyOn(fs, 'writeFileSync').mockImplementation((filePath, data, options) => {
    if (typeof filePath === 'string' && path.resolve(filePath) === REPO_MOCK_BLUEPRINTS_PATH) {
      return actualWriteFileSync(savedFile, data, options as never);
    }

    return actualWriteFileSync(filePath, data, options as never);
  });
}

describe('generate-blueprint route', () => {
  afterEach(() => {
    if (ORIGINAL_ZAI_API_KEY === undefined) delete process.env.ZAI_API_KEY;
    else process.env.ZAI_API_KEY = ORIGINAL_ZAI_API_KEY;
    if (ORIGINAL_ZAI_BASE_URL === undefined) delete process.env.ZAI_BASE_URL;
    else process.env.ZAI_BASE_URL = ORIGINAL_ZAI_BASE_URL;
    if (ORIGINAL_ZAI_MODEL === undefined) delete process.env.ZAI_MODEL;
    else process.env.ZAI_MODEL = ORIGINAL_ZAI_MODEL;
    if (ORIGINAL_GEMINI_API_KEY === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = ORIGINAL_GEMINI_API_KEY;

    vi.clearAllMocks();
    vi.unstubAllGlobals();
    zaiSdkMocks.OpenAI.mockClear();
    zaiSdkMocks.create.mockReset();

    while (TEMP_DIRS.length > 0) {
      const tempDir = TEMP_DIRS.pop();
      if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('stores the latest successful generated blueprints, honors env overrides, and reuses cached blueprints when providers fail', async () => {
    const tempDir = createTempWorkspace();
    const savedFile = path.join(tempDir, 'data', 'mock-blueprints.json');
    redirectMockBlueprintsFile(savedFile);

    process.env.ZAI_API_KEY = 'zai-test-key';
    process.env.ZAI_BASE_URL = 'https://z.ai/custom';
    process.env.ZAI_MODEL = 'glm-4.5-air';
    process.env.GEMINI_API_KEY = 'gemini-test-key';

    zaiSdkMocks.create.mockResolvedValueOnce({
      choices: [{ message: { content: createZAIResponse() } }],
    });

    const { POST } = await importRouteForWorkspace(tempDir);

    const firstResponse = await POST(createRouteRequest() as never);
    const firstBody = await firstResponse.json();

    expect(firstBody.blueprints).toHaveLength(3);
    expect(zaiSdkMocks.OpenAI).toHaveBeenCalledWith({
      apiKey: 'zai-test-key',
      baseURL: 'https://z.ai/custom/',
    });
    expect(zaiSdkMocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'glm-4.5-air',
      }),
    );

    const savedBlueprints = JSON.parse(fs.readFileSync(savedFile, 'utf-8'));
    expect(savedBlueprints).toHaveLength(3);
    expect(savedBlueprints[0]).toMatchObject({
      id: expect.any(String),
      title: 'Stored blueprint 1',
      color: expect.any(String),
      accentColor: expect.any(String),
      prototypePreview: {
        title: 'Prototype concept',
        summary: expect.any(String),
        prototypeCode: expect.stringContaining('Prototype 1'),
        screens: [],
      },
    });
    expect(savedBlueprints[0].financeModel.totalCostYearOneValue).toBeGreaterThan(0);
    expect(savedBlueprints[0].scores.total).toBeGreaterThan(0);

    const fetchMock = vi.fn().mockRejectedValue(new Error('provider unavailable'));
    vi.stubGlobal('fetch', fetchMock);
    zaiSdkMocks.create.mockRejectedValueOnce(new Error('provider unavailable'));

    const cachedResponse = await POST(createRouteRequest('Use the cached version.') as never);
    const cachedBody = await cachedResponse.json();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cachedBody.blueprints).toHaveLength(3);
    expect(cachedBody.blueprints[0].id).toBe(savedBlueprints[0].id);
    expect(cachedBody.blueprints[0].title).toBe(savedBlueprints[0].title);
  });

  it('uses the default Z.AI base URL and model when optional env values are absent', async () => {
    const tempDir = createTempWorkspace();
    const savedFile = path.join(tempDir, 'data', 'mock-blueprints.json');
    redirectMockBlueprintsFile(savedFile);

    process.env.ZAI_API_KEY = 'zai-default-key';
    delete process.env.ZAI_BASE_URL;
    delete process.env.ZAI_MODEL;

    zaiSdkMocks.create.mockResolvedValueOnce({
      choices: [{ message: { content: createZAIResponse() } }],
    });

    const { POST } = await importRouteForWorkspace(tempDir);
    const response = await POST(createRouteRequest('Verify the default config.') as never);
    const body = await response.json();

    expect(body.blueprints).toHaveLength(3);
    expect(zaiSdkMocks.OpenAI).toHaveBeenCalledWith({
      apiKey: 'zai-default-key',
      baseURL: 'https://api.z.ai/api/paas/v4/',
    });
    expect(zaiSdkMocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'glm-5.1',
      }),
    );
  });

  it('falls back to Gemini when Z.AI rejects the request', async () => {
    const tempDir = createTempWorkspace();
    const savedFile = path.join(tempDir, 'data', 'mock-blueprints.json');
    redirectMockBlueprintsFile(savedFile);

    process.env.ZAI_API_KEY = 'zai-test-key';
    process.env.GEMINI_API_KEY = 'gemini-test-key';

    zaiSdkMocks.create.mockRejectedValueOnce(new Error('provider unavailable'));

    const fetchMock = vi.fn().mockResolvedValue(createGeminiSuccessResponse(createZAIResponse()));
    vi.stubGlobal('fetch', fetchMock);

    const { POST } = await importRouteForWorkspace(tempDir);
    const response = await POST(createRouteRequest('Use Gemini when ZAI fails.') as never);
    const body = await response.json();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(body.blueprints).toHaveLength(3);
  });

  it('treats a missing ZAI_API_KEY as a recoverable failure when Gemini is available', async () => {
    const tempDir = createTempWorkspace();
    const savedFile = path.join(tempDir, 'data', 'mock-blueprints.json');
    redirectMockBlueprintsFile(savedFile);

    delete process.env.ZAI_API_KEY;
    process.env.GEMINI_API_KEY = 'gemini-test-key';

    const fetchMock = vi.fn().mockResolvedValue(createGeminiSuccessResponse(createZAIResponse()));
    vi.stubGlobal('fetch', fetchMock);

    const { POST } = await importRouteForWorkspace(tempDir);
    const response = await POST(createRouteRequest('Use Gemini when the ZAI key is missing.') as never);
    const body = await response.json();

    expect(zaiSdkMocks.OpenAI).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(body.blueprints).toHaveLength(3);
  });

  it('continues to support legacy mock-blueprints entries when api calls fail', async () => {
    const tempDir = createTempWorkspace();
    const savedFile = path.join(tempDir, 'data', 'mock-blueprints.json');
    redirectMockBlueprintsFile(savedFile);

    fs.writeFileSync(
      savedFile,
      JSON.stringify([createLegacyBlueprint(0), createLegacyBlueprint(1), createLegacyBlueprint(2)], null, 2),
      'utf-8',
    );

    process.env.ZAI_API_KEY = 'zai-test-key';
    process.env.GEMINI_API_KEY = 'gemini-test-key';

    const fetchMock = vi.fn().mockRejectedValue(new Error('provider unavailable'));
    vi.stubGlobal('fetch', fetchMock);
    zaiSdkMocks.create.mockRejectedValueOnce(new Error('provider unavailable'));

    const { POST } = await importRouteForWorkspace(tempDir);
    const response = await POST(createRouteRequest('Recover from saved mock data.') as never);
    const body = await response.json();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(body.blueprints).toHaveLength(3);
    expect(body.blueprints[0]).toMatchObject({
      id: expect.any(String),
      title: 'Stored blueprint 1',
      prototypePreview: {
        title: 'Prototype concept',
        summary: expect.any(String),
        prototypeCode: expect.stringContaining('Prototype 1'),
        screens: [],
      },
      financeModel: {
        totalCostYearOneValue: expect.any(Number),
      },
      scores: {
        total: expect.any(Number),
      },
    });
  });
});
