import {
  Attachment,
  Blueprint,
  Conflict,
  EscalationRecord,
  FinanceModel,
  MergeSuggestion,
  MergedStrategy,
  RetrievedContext,
  Role,
  Scores,
  Submission,
  TechnicalBlueprint,
  User,
} from '../types';

const TODAY = '2026-04-21';

const COLOR_TOKENS = [
  { color: 'var(--color-primary)', accentColor: 'var(--color-primary)' },
  { color: 'var(--color-success)', accentColor: 'var(--color-success)' },
  { color: 'var(--color-warning)', accentColor: 'var(--color-warning)' },
];

interface ProblemTheme {
  id: string;
  label: string;
  shortLabel: string;
  priority: string;
  desiredOutcome: string;
  constraint: string;
  executiveAngle: string;
  architectureFocus: string[];
  technologyFocus: string[];
}

const THEMES: ProblemTheme[] = [
  {
    id: 'modernization',
    label: 'platform modernization',
    shortLabel: 'modernization',
    priority: 'High',
    desiredOutcome: 'faster releases with lower delivery risk',
    constraint: 'protecting current operations while modernizing',
    executiveAngle: 'time-to-market acceleration',
    architectureFocus: ['event-driven services', 'shared platform governance', 'observability'],
    technologyFocus: ['Kubernetes', 'API gateway', 'workflow orchestration'],
  },
  {
    id: 'data',
    label: 'data alignment',
    shortLabel: 'data',
    priority: 'Critical',
    desiredOutcome: 'trusted insight across departments',
    constraint: 'removing duplicate reporting and inconsistent metrics',
    executiveAngle: 'cross-functional visibility',
    architectureFocus: ['semantic layer', 'lakehouse foundation', 'shared data contracts'],
    technologyFocus: ['dbt', 'stream processing', 'analytics workspace'],
  },
  {
    id: 'operations',
    label: 'operational enablement',
    shortLabel: 'operations',
    priority: 'Medium',
    desiredOutcome: 'self-serve execution for business teams',
    constraint: 'keeping governance intact while reducing bottlenecks',
    executiveAngle: 'delivery efficiency',
    architectureFocus: ['workflow automation', 'role-based controls', 'internal platform tooling'],
    technologyFocus: ['Retool', 'n8n', 'audit logging'],
  },
  {
    id: 'cost',
    label: 'cost optimization',
    shortLabel: 'cost',
    priority: 'High',
    desiredOutcome: 'better outcomes per dollar invested',
    constraint: 'meeting budget targets without cutting strategic capacity',
    executiveAngle: 'operating margin improvement',
    architectureFocus: ['shared services', 'portfolio governance', 'automation coverage'],
    technologyFocus: ['finops dashboards', 'infrastructure policy', 'cost telemetry'],
  },
];

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alex Chen', role: 'staff', department: 'Engineering', avatar: 'AC' },
  { id: 'u2', name: 'Priya Sharma', role: 'lead', department: 'Product', avatar: 'PS' },
  { id: 'u3', name: 'Marcus Webb', role: 'director', department: 'Technology', avatar: 'MW' },
  { id: 'u4', name: 'Sofia Reyes', role: 'executive', department: 'Executive Office', avatar: 'SR' },
  { id: 'u5', name: 'Jamie Patel', role: 'staff', department: 'Operations', avatar: 'JP' },
  { id: 'u6', name: 'Nina Brooks', role: 'staff', department: 'Data', avatar: 'NB' },
];

const TEAM_SUBMITTERS = MOCK_USERS.filter(user => user.role === 'staff');

function inferTheme(problemStatement: string): ProblemTheme {
  const text = problemStatement.toLowerCase();

  if (/(data|analytics|report|insight|dashboard|silo)/.test(text)) {
    return THEMES[1];
  }
  if (/(internal tool|workflow|automation|self-serve|operations)/.test(text)) {
    return THEMES[2];
  }
  if (/(cost|budget|spend|roi|finance)/.test(text)) {
    return THEMES[3];
  }
  return THEMES[0];
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
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

function summarizeProblem(problemStatement: string, maxLength = 110) {
  const trimmed = problemStatement.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 3).trim()}...`;
}

function buildFinanceModel(capexValue: number, opexMonthlyValue: number, roiValue: number, paybackMonths: number): FinanceModel {
  const totalCostYearOneValue = capexValue + opexMonthlyValue * 12;
  return {
    capex: formatCurrency(capexValue),
    opex: formatMonthlyCurrency(opexMonthlyValue),
    roi: `${roiValue}%`,
    paybackPeriod: formatPayback(paybackMonths),
    totalCost: formatCurrency(totalCostYearOneValue),
    capexValue,
    opexMonthlyValue,
    roiValue,
    paybackMonths,
    totalCostYearOneValue,
  };
}

function buildScores(feasibility: number, businessImpact: number, effort: number, riskConflict: number): Scores {
  const total = Math.round(
    feasibility * 0.28 +
      businessImpact * 0.34 +
      effort * 0.18 +
      riskConflict * 0.2,
  );

  return {
    feasibility,
    businessImpact,
    effort,
    riskConflict,
    total,
  };
}

function buildPrototypeScreens(theme: ProblemTheme, label: string, blueprintTitle: string) {
  return [
    {
      id: `${label}-overview`,
      label: 'Overview',
      headline: `${sentenceCase(theme.shortLabel)} command panel`,
      detail: `ODIS highlights the core problem, active stakeholders, and the first milestone for ${blueprintTitle}.`,
      metricLabel: 'Decision pulse',
      metricValue: theme.priority,
    },
    {
      id: `${label}-orchestration`,
      label: 'Orchestration',
      headline: 'Cross-team workflow',
      detail: `A guided prototype view shows who owns delivery, what dependencies exist, and where ${theme.constraint} must be handled.`,
      metricLabel: 'Tracked teams',
      metricValue: '4 teams',
    },
    {
      id: `${label}-impact`,
      label: 'Impact',
      headline: 'Outcome snapshot',
      detail: `The prototype closes with an executive summary focused on ${theme.executiveAngle} and ${theme.desiredOutcome}.`,
      metricLabel: 'Expected lift',
      metricValue: '12-18%',
    },
  ];
}

function buildConflicts(ids: string[], theme: ProblemTheme): Conflict[] {
  return [
    {
      id: `${ids[0]}-timeline`,
      type: 'timeline',
      severity: 'high',
      description: `Engineering sequencing for ${theme.label} overlaps with the next planning window and could crowd out adjacent delivery work.`,
      resolution: 'Phase foundation work first and shift system cutovers after stakeholder sign-off.',
      affectedBlueprints: [ids[0], ids[1]],
    },
    {
      id: `${ids[1]}-budget`,
      type: 'budget',
      severity: 'high',
      description: 'Running the first two blueprints independently would duplicate platform spend and exceed the current quarterly investment envelope.',
      resolution: 'Share core platform services and consolidate vendor spend before parallel rollout.',
      affectedBlueprints: [ids[0], ids[1]],
    },
    {
      id: `${ids[2]}-headcount`,
      type: 'headcount',
      severity: 'medium',
      description: 'The operational blueprint needs a part-time platform owner to keep automation templates governed.',
      resolution: 'Assign a rotating service owner and standardize intake for new automations.',
      affectedBlueprints: [ids[2]],
    },
  ];
}

export function createRetrievedContext(problemStatement: string): RetrievedContext {
  const theme = inferTheme(problemStatement);
  const summary = summarizeProblem(problemStatement, 55);

  return {
    jiraTickets: [
      { id: 'ODIS-124', title: `Align delivery backlog around ${theme.label}`, status: 'In Progress', priority: theme.priority, assignee: 'Alex Chen' },
      { id: 'ODIS-208', title: `Reduce friction caused by ${theme.constraint}`, status: 'Open', priority: 'High', assignee: 'Priya Sharma' },
      { id: 'ODIS-311', title: `Create phased rollout plan for ${theme.desiredOutcome}`, status: 'Review', priority: 'Medium', assignee: 'Marcus Webb' },
      { id: 'ODIS-412', title: `Map dependencies for "${summary}"`, status: 'Open', priority: 'High', assignee: 'Jamie Patel' },
      { id: 'ODIS-418', title: `Prepare finance model tied to ${theme.executiveAngle}`, status: 'Blocked', priority: 'Medium', assignee: 'Sofia Reyes' },
    ],
    confluenceDocs: [
      { id: 'c1', title: `${sentenceCase(theme.shortLabel)} architecture options`, space: 'Technology', lastUpdated: '2026-04-16', relevance: 95 },
      { id: 'c2', title: 'Decision criteria and approval matrix', space: 'Strategy Office', lastUpdated: '2026-04-14', relevance: 91 },
      { id: 'c3', title: `Budget guardrails for ${theme.executiveAngle}`, space: 'Finance', lastUpdated: '2026-04-12', relevance: 86 },
      { id: 'c4', title: `Capability map linked to ${theme.desiredOutcome}`, space: 'Operations', lastUpdated: '2026-04-10', relevance: 79 },
    ],
    pastDecisions: [
      { id: 'pd1', title: `Sequenced delivery model for ${theme.label}`, date: '2025-11-03', outcome: 'Reduced execution risk by consolidating dependencies before rollout.', relevance: 93 },
      { id: 'pd2', title: `Shared platform funding for ${theme.executiveAngle}`, date: '2025-08-19', outcome: 'Unlocked joint budget approval across two departments.', relevance: 88 },
      { id: 'pd3', title: 'Blueprint review framework', date: '2025-06-08', outcome: 'Standardized scoring and escalation across staff and leadership.', relevance: 81 },
    ],
  };
}

export function createDemoBlueprints(problemStatement: string): Blueprint[] {
  const theme = inferTheme(problemStatement);
  const ids = ['bp-1', 'bp-2', 'bp-3'].map(id => createId(id));
  const conflicts = buildConflicts(ids, theme);

  return [
    {
      id: ids[0],
      title: `${sentenceCase(theme.shortLabel)} orchestration hub`,
      department: 'Engineering',
      description: `Build a controlled modernization lane that creates a shared delivery backbone for ${theme.label}, balancing speed with operational stability.`,
      prototypePreview: {
        title: 'Prototype concept',
        summary: 'An interactive command center for staged delivery governance.',
        screens: buildPrototypeScreens(theme, 'hub', 'orchestration hub'),
      },
      architecture: ['Event-driven service backbone', 'Unified dependency graph', ...theme.architectureFocus],
      techStack: ['React workspace', 'Workflow rules engine', ...theme.technologyFocus],
      financeModel: buildFinanceModel(210000, 18000, 228, 11),
      scores: buildScores(76, 88, 69, 63),
      conflicts: conflicts.filter(conflict => conflict.affectedBlueprints.includes(ids[0])),
      ...COLOR_TOKENS[0],
    },
    {
      id: ids[1],
      title: `${sentenceCase(theme.shortLabel)} intelligence layer`,
      department: 'Strategy & Data',
      description: `Create a decision intelligence layer that combines context retrieval, constraint mapping, and executive-ready recommendations for ${theme.label}.`,
      prototypePreview: {
        title: 'Prototype concept',
        summary: 'A guided cockpit that shows confidence, dependencies, and recommended actions.',
        screens: buildPrototypeScreens(theme, 'intelligence', 'intelligence layer'),
      },
      architecture: ['Semantic decision layer', 'Shared context retrieval', ...theme.architectureFocus],
      techStack: ['Decision graph service', 'Analytics workspace', ...theme.technologyFocus],
      financeModel: buildFinanceModel(175000, 22000, 276, 10),
      scores: buildScores(82, 92, 73, 72),
      conflicts: conflicts.filter(conflict => conflict.affectedBlueprints.includes(ids[1])),
      ...COLOR_TOKENS[1],
    },
    {
      id: ids[2],
      title: `${sentenceCase(theme.shortLabel)} enablement studio`,
      department: 'Operations',
      description: `Empower functional teams with templates, guarded automations, and clear ownership so the organization can act on ${theme.label} without waiting on bespoke build cycles.`,
      prototypePreview: {
        title: 'Prototype concept',
        summary: 'A prototype library for governed self-serve execution.',
        screens: buildPrototypeScreens(theme, 'studio', 'enablement studio'),
      },
      architecture: ['Template registry', 'Operational service catalog', ...theme.architectureFocus],
      techStack: ['Internal portal', 'Automation toolkit', ...theme.technologyFocus],
      financeModel: buildFinanceModel(90000, 12000, 192, 7),
      scores: buildScores(89, 75, 86, 79),
      conflicts: conflicts.filter(conflict => conflict.affectedBlueprints.includes(ids[2])),
      ...COLOR_TOKENS[2],
    },
  ];
}

function createSubmission(submittedBy: User, problemStatement: string, attachments: Attachment[]): Submission {
  return {
    id: createId('submission'),
    problemStatement,
    createdAt: TODAY,
    attachments,
    submittedBy: {
      id: submittedBy.id,
      name: submittedBy.name,
      role: submittedBy.role,
      department: submittedBy.department,
      avatar: submittedBy.avatar,
    },
  };
}

function createEscalationRecord(submittedBy: User, problemStatement: string, blueprintIndex: number, note: string): EscalationRecord {
  const attachments: Attachment[] = [
    { id: createId('attachment'), name: `${submittedBy.department.toLowerCase().replace(/\s+/g, '-')}-brief.pdf`, sizeLabel: '2.4 MB' },
  ];
  const submission = createSubmission(submittedBy, problemStatement, attachments);
  const blueprint = createDemoBlueprints(problemStatement)[blueprintIndex];

  return {
    id: createId('escalation'),
    submission,
    blueprint,
    submittedBy: submission.submittedBy,
    escalatedAt: TODAY,
    note,
    status: 'pending',
  };
}

export function createSeedEscalationQueue(): EscalationRecord[] {
  return [
    createEscalationRecord(
      TEAM_SUBMITTERS[0],
      'Our legacy delivery model is slowing releases and causing risk during major platform changes.',
      0,
      'Requesting leadership review on the staged modernization approach.',
    ),
    createEscalationRecord(
      TEAM_SUBMITTERS[2],
      'Business teams are making decisions with conflicting data and no shared view of constraints.',
      1,
      'Escalated for merge with any cross-functional intelligence initiative.',
    ),
    createEscalationRecord(
      TEAM_SUBMITTERS[1],
      'Engineering is overloaded with manual internal requests, and operations needs a governed self-serve option.',
      2,
      'Needs leadership approval for shared enablement capacity.',
    ),
  ];
}

function overlapScore(left: string[], right: string[]) {
  const leftTokens = new Set(left.map(item => item.toLowerCase()));
  const shared = right.filter(item => leftTokens.has(item.toLowerCase())).length;
  const baseline = Math.max(left.length, right.length);
  return baseline === 0 ? 0 : Math.round((shared / baseline) * 100);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function createMergeSuggestions(queue: EscalationRecord[]): MergeSuggestion[] {
  const pending = queue.filter(record => record.status === 'pending');
  const suggestions: MergeSuggestion[] = [];

  for (let index = 0; index < pending.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < pending.length; nextIndex += 1) {
      const left = pending[index].blueprint;
      const right = pending[nextIndex].blueprint;
      const architecture = clamp(55 + overlapScore(left.architecture, right.architecture), 58, 96);
      const techStack = clamp(52 + overlapScore(left.techStack, right.techStack), 57, 95);
      const timeline = clamp(
        Math.round((left.scores.feasibility + right.scores.feasibility) / 2 - Math.abs(left.scores.effort - right.scores.effort) / 2),
        56,
        92,
      );
      const budget = clamp(
        Math.round((left.financeModel.roiValue + right.financeModel.roiValue) / 6 - Math.abs(left.financeModel.capexValue - right.financeModel.capexValue) / 10000),
        54,
        91,
      );
      const totalSpend = left.financeModel.totalCostYearOneValue + right.financeModel.totalCostYearOneValue;
      const savingsValue = Math.round(totalSpend * 0.11);

      suggestions.push({
        id: createId('merge'),
        blueprintIds: [left.id, right.id],
        rationale: `ODIS suggests combining "${left.title}" and "${right.title}" because they address ${inferTheme(left.description).label} from complementary delivery angles.`,
        projectedSavings: formatCurrency(savingsValue),
        compatibility: {
          architecture,
          techStack,
          timeline,
          budget,
        },
      });
    }
  }

  return suggestions.sort((left, right) => {
    const leftScore = left.compatibility.architecture + left.compatibility.techStack + left.compatibility.timeline + left.compatibility.budget;
    const rightScore = right.compatibility.architecture + right.compatibility.techStack + right.compatibility.timeline + right.compatibility.budget;
    return rightScore - leftScore;
  });
}

function buildMergedTechnicalBlueprint(sourceBlueprints: Blueprint[]): TechnicalBlueprint {
  const architecture = Array.from(new Set(sourceBlueprints.flatMap(blueprint => blueprint.architecture))).slice(0, 6);
  const techStack = Array.from(new Set(sourceBlueprints.flatMap(blueprint => blueprint.techStack))).slice(0, 7);
  const integrations = [
    'Jira decision workflow',
    'Confluence publishing',
    'Leadership review channel',
    'Portfolio finance tracker',
    'Team capacity dashboard',
  ];

  return {
    architecture,
    techStack,
    phases: [
      {
        name: 'Phase 1: Shared foundation',
        duration: '4 weeks',
        deliverables: ['Unified context retrieval', 'Shared governance checkpoints', 'Cross-team operating rhythm'],
      },
      {
        name: 'Phase 2: Guided rollout',
        duration: '6 weeks',
        deliverables: ['Blueprint-specific pilots', 'Conflict resolution playbooks', 'Finance and staffing alignment'],
      },
      {
        name: 'Phase 3: Executive handoff',
        duration: '3 weeks',
        deliverables: ['Executive brief', 'Technical blueprint', 'Adoption dashboard'],
      },
    ],
    integrations,
  };
}

export function createMergedStrategy(records: EscalationRecord[], createdByRole: Role, suggestion?: MergeSuggestion): MergedStrategy {
  const sourceBlueprints = records.map(record => record.blueprint);
  const titles = sourceBlueprints.map(blueprint => blueprint.title);
  const totalCapex = sourceBlueprints.reduce((sum, blueprint) => sum + blueprint.financeModel.capexValue, 0);
  const totalOpex = sourceBlueprints.reduce((sum, blueprint) => sum + blueprint.financeModel.opexMonthlyValue, 0);
  const baseTotal = sourceBlueprints.reduce((sum, blueprint) => sum + blueprint.financeModel.totalCostYearOneValue, 0);
  const savingsValue = suggestion ? Number.parseInt(suggestion.projectedSavings.replace(/[$k,]/g, ''), 10) * 1000 : Math.round(baseTotal * 0.1);
  const mergedFinance = buildFinanceModel(
    Math.round(totalCapex - savingsValue * 0.35),
    Math.round(totalOpex * 0.88),
    clamp(Math.round(sourceBlueprints.reduce((sum, blueprint) => sum + blueprint.financeModel.roiValue, 0) / sourceBlueprints.length + 34), 220, 360),
    clamp(Math.round(sourceBlueprints.reduce((sum, blueprint) => sum + blueprint.financeModel.paybackMonths, 0) / sourceBlueprints.length - 1), 7, 14),
  );
  const theme = inferTheme(records[0]?.submission.problemStatement ?? 'organizational decisioning');
  const title = `Unified ${sentenceCase(theme.shortLabel)} strategy`;

  return {
    id: createId('strategy'),
    title,
    executiveBrief: [
      `${title} combines ${titles.join(' and ')} into one leadership-ready plan for ${theme.label}.`,
      `The merged strategy preserves the strongest parts of each blueprint while removing duplicated spend, clarifying ownership, and sequencing work around ${theme.constraint}.`,
      `ODIS projects ${mergedFinance.roi} ROI with a ${mergedFinance.paybackPeriod.toLowerCase()} payback window, supported by a shared technical foundation and a single executive approval path.`,
    ].join('\n\n'),
    technicalBlueprint: buildMergedTechnicalBlueprint(sourceBlueprints),
    financeModel: mergedFinance,
    sourceBlueprintIds: sourceBlueprints.map(blueprint => blueprint.id),
    sourceBlueprintTitles: titles,
    createdAt: TODAY,
    createdByRole,
    approvalStatus: createdByRole === 'executive' ? 'Ready for executive sign-off' : 'Ready for superior review',
  };
}

export function createDefaultAttachments(names: string[]): Attachment[] {
  return names.map((name, index) => ({
    id: createId(`attachment-${index}`),
    name,
    sizeLabel: `${(index + 2) * 0.8} MB`,
  }));
}
