export type Role = 'staff' | 'lead' | 'director' | 'executive';

export type SubmissionStatus = 'draft' | 'analyzing' | 'blueprints' | 'conflicts' | 'scoring' | 'escalated';

export type ConflictType = 'budget' | 'timeline' | 'headcount' | 'technical';

export type Severity = 'high' | 'medium' | 'low';

export type EscalationStatus = 'pending' | 'forwarded' | 'merged' | 'returned_to_staff' | 'returned_to_head' | 'approved_by_director';
export type EscalationLevel = 'staff_to_head' | 'head_to_director';
export type EscalationTicketStatus = 'open';
export type EscalationReviewTarget = 'staff' | 'lead' | 'director';

export interface User {
  id: string;
  name: string;
  role: Role;
  department: string;
  avatar: string;
}

export interface Attachment {
  id: string;
  name: string;
  sizeLabel: string;
}

export interface Submission {
  id: string;
  problemStatement: string;
  createdAt: string;
  attachments: Attachment[];
  submittedBy: Pick<User, 'id' | 'name' | 'role' | 'department' | 'avatar'>;
}

export interface PrototypeScreen {
  id: string;
  label: string;
  headline: string;
  detail: string;
  metricLabel: string;
  metricValue: string;
}

export interface PrototypePreview {
  title: string;
  summary: string;
  screens: PrototypeScreen[];
  prototypeSourceJsx?: string;
  prototypeCode?: string;
}

export interface FinanceModel {
  capex: string;
  opex: string;
  roi: string;
  paybackPeriod: string;
  totalCost: string;
  capexValue: number;
  opexMonthlyValue: number;
  roiValue: number;
  paybackMonths: number;
  totalCostYearOneValue: number;
}

export interface TechStackCategory {
  category: string;
  tools: string[];
}

export interface Scores {
  feasibility: number;
  businessImpact: number;
  effort: number;
  riskConflict: number;
  total: number;
}

export type ScoringInsightStatus = 'positive' | 'neutral' | 'warning';

export interface ScoringInsight {
  dimension: string;
  status: ScoringInsightStatus;
  summary: string;
  score: number;
}

export interface Conflict {
  id: string;
  type: ConflictType;
  severity: Severity;
  description: string;
  resolution: string;
  affectedBlueprints: string[];
}

export interface Blueprint {
  id: string;
  title: string;
  department: string;
  description: string;
  prototypePreview: PrototypePreview;
  architecture: string[];
  techStack: TechStackCategory[];
  financeModel: FinanceModel;
  scores: Scores;
  conflicts: Conflict[];
  scoringInsights: ScoringInsight[];
  timeline: Phase[];
  color: string;
  accentColor: string;
}

export interface JiraTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignee: string;
}

export interface ConfluenceDoc {
  id: string;
  title: string;
  space: string;
  lastUpdated: string;
  relevance: number;
}

export interface PastDecision {
  id: string;
  title: string;
  date: string;
  outcome: string;
  relevance: number;
}

export interface RetrievedContext {
  jiraTickets: JiraTicket[];
  confluenceDocs: ConfluenceDoc[];
  pastDecisions: PastDecision[];
}

export interface EscalationRecord {
  id: string;
  submission: Submission;
  blueprint: Blueprint;
  submittedBy: Pick<User, 'id' | 'name' | 'role' | 'department' | 'avatar'>;
  escalatedAt: string;
  note: string;
  status: EscalationStatus;
  level: EscalationLevel;
  ticket: {
    id: string;
    title: string;
    status: EscalationTicketStatus;
    createdAt: string;
    createdByRole: Role;
  } | null;
  reviews: {
    id: string;
    byRole: Role;
    target: EscalationReviewTarget;
    note: string;
    createdAt: string;
  }[];
}

export interface MergeCompatibility {
  architecture: number;
  techStack: number;
  timeline: number;
  budget: number;
}

export interface MergeSuggestion {
  id: string;
  blueprintIds: string[];
  rationale: string;
  projectedSavings: string;
  compatibility: MergeCompatibility;
}

export interface TechnicalBlueprint {
  architecture: string[];
  techStack: TechStackCategory[];
  phases: Phase[];
  integrations: string[];
}

export interface Phase {
  name: string;
  duration: string;
  deliverables: string[];
}

export interface ExistingSystem {
  id: string;
  name: string;
  department: string;
  description: string;
  monthlyCost: number;
  color: string;
  isMerged?: boolean;
  combinedSavings?: string;
  sourceTitles?: string[];
}

export interface ZAIMergeRecommendation {
  id: string;
  title: string;
  rationale: string;
  candidateIds: string[];
  candidateType: Record<string, 'blueprint' | 'system'>;
  projectedSavings: string;
  compatibilityScore: number;
}

export type ProjectHealth = 'ON_TRACK' | 'AT_RISK' | 'DELAYED';

export interface MetricRow {
  label: string;
  predicted: string;
  actual: string;
  status: 'ok' | 'warn' | 'bad';
  impact: string;
}

export interface ProjectDecision {
  action: string;
  loggedAt: string;
}

export interface ProjectTracker {
  id: string;
  title: string;
  department: string;
  currentMonth: number;
  totalMonths: number;
  health: ProjectHealth;
  metrics: MetricRow[];
  glmRecommendation?: string;
  decisionActions?: string[];
  decisions: ProjectDecision[];
  roiProjected: string;
}

export interface MergedStrategy {
  id: string;
  title: string;
  executiveBrief: string;
  technicalBlueprint: TechnicalBlueprint;
  financeModel: FinanceModel;
  sourceBlueprintIds: string[];
  sourceBlueprintTitles: string[];
  createdAt: string;
  createdByRole: Role;
  approvalStatus: string;
}
