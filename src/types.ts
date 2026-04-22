export type Role = 'staff' | 'lead' | 'director' | 'executive';

export type SubmissionStatus = 'draft' | 'analyzing' | 'blueprints' | 'conflicts' | 'scoring' | 'escalated';

export type ConflictType = 'budget' | 'timeline' | 'headcount' | 'technical';

export type Severity = 'high' | 'medium' | 'low';

export type EscalationStatus = 'pending' | 'merged';

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
  techStack: string[];
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
  techStack: string[];
  phases: Phase[];
  integrations: string[];
}

export interface Phase {
  name: string;
  duration: string;
  deliverables: string[];
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
