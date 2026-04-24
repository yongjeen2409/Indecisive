'use client';

import { createContext, ReactNode, useContext, useMemo, useReducer } from 'react';
import {
  AIProvider,
  Attachment,
  Blueprint,
  EscalationRecord,
  ExistingSystem,
  ManagerReviewBatch,
  MergeSuggestion,
  MergedStrategy,
  ProjectTracker,
  RetrievedContext,
  ReviewAssumption,
  Submission,
  SubmissionStatus,
  User,
  ZAIMergeRecommendation,
} from '../types';
import {
  createDemoBlueprints,
  createDirectorMergeRecommendations,
  createMergedStrategy,
  createMergeSuggestions,
  createRetrievedContext,
  createSeedEscalationQueue,
  createSeedManagerReviewBatches,
  MOCK_EXISTING_SYSTEMS,
  MOCK_PROJECT_TRACKERS,
  MOCK_USERS,
} from '../data/mockData';
import { buildMergedSystemName } from '../lib/mergeNaming';
import {
  buildSharedReviewAssumptions,
  cloneReviewAssumptions,
  getDefaultRankingOrder,
  reevaluateBlueprintSet,
} from '../lib/reviewAssumptions';

export interface AppState {
  currentUser: User | null;
  activeSubmission: Submission | null;
  submissionStatus: SubmissionStatus;
  attachments: Attachment[];
  retrievedContext: RetrievedContext | null;
  blueprints: Blueprint[];
  reviewAssumptions: ReviewAssumption[];
  rankedBlueprintIds: string[];
  selectedBlueprintId: string | null;
  conflictsAcknowledged: boolean;
  escalationQueue: EscalationRecord[];
  managerReviewBatches: ManagerReviewBatch[];
  selectedMergeIds: string[];
  mergedStrategy: MergedStrategy | null;
  existingSystems: ExistingSystem[];
  projectTrackers: ProjectTracker[];
  mergedExistingSystems: ExistingSystem[];
  lastBlueprintProvider: AIProvider | null;
  lastBlueprintFallback: boolean;
}

interface AppContextValue extends AppState {
  selectedBlueprint: Blueprint | null;
  rankedBlueprints: Blueprint[];
  staffEscalations: EscalationRecord[];
  pendingEscalations: EscalationRecord[];
  mergeSuggestions: MergeSuggestion[];
  selectedMergeRecords: EscalationRecord[];
  activeMergeSuggestion: MergeSuggestion | null;
  directorPendingEscalations: EscalationRecord[];
  directorApprovedEscalations: EscalationRecord[];
  directorReviewedEscalations: EscalationRecord[];
  allDisplayedSystems: ExistingSystem[];
  directorMergeRecommendations: ZAIMergeRecommendation[];
  managerPendingBatches: ManagerReviewBatch[];
  managerReturnedBatches: ManagerReviewBatch[];
  managerForwardedBatches: ManagerReviewBatch[];
  myManagerReviewBatches: ManagerReviewBatch[];
  latestReturnedManagerBatch: ManagerReviewBatch | null;
  login: (userId: string) => void;
  logout: () => void;
  startSubmission: (problemStatement: string, attachments: Attachment[]) => void;
  completeAnalysis: () => void;
  completeAnalysisWithBlueprints: (payload: {
    blueprints: Blueprint[];
    assumptions?: ReviewAssumption[] | null;
    provider?: AIProvider;
    fallback?: boolean;
  }) => void;
  selectBlueprint: (blueprintId: string) => void;
  setBlueprintRanking: (blueprintIds: string[]) => void;
  openConflictReview: () => void;
  acknowledgeConflicts: () => void;
  escalateSelectedBlueprint: () => void;
  escalateRankedBlueprints: () => void;
  resetSubmission: () => void;
  approveToDirector: (recordId: string) => void;
  createEscalationTicket: (recordId: string) => void;
  deEscalateToStaff: (recordId: string, reviewNote: string) => void;
  deEscalateToDeptHead: (recordId: string, reviewNote: string) => void;
  managerUpdateAssumptionValue: (batchId: string, assumptionId: string, value: string) => void;
  managerApplyReevaluation: (batchId: string, blueprints: Blueprint[], provider: AIProvider, fallback: boolean) => void;
  managerSelectBatchBlueprint: (batchId: string, blueprintId: string) => void;
  managerEscalateBatchToDirector: (batchId: string) => void;
  managerRejectBatch: (batchId: string, note: string) => void;
  selectMergePair: (blueprintIds: string[]) => void;
  completeMerge: () => void;
  directorApprove: (recordId: string) => void;
  directorDeEscalateToStaff: (recordId: string, reviewNote: string) => void;
  approveMerge: (recommendation: ZAIMergeRecommendation) => void;
  logProjectDecision: (projectId: string, action: string) => void;
}

type Action =
  | { type: 'login'; payload: { userId: string } }
  | { type: 'logout' }
  | { type: 'startSubmission'; payload: { problemStatement: string; attachments: Attachment[] } }
  | { type: 'completeAnalysis' }
  | { type: 'completeAnalysisWithBlueprints'; payload: { blueprints: Blueprint[]; assumptions?: ReviewAssumption[] | null; provider?: AIProvider; fallback?: boolean } }
  | { type: 'selectBlueprint'; payload: { blueprintId: string } }
  | { type: 'setBlueprintRanking'; payload: { blueprintIds: string[] } }
  | { type: 'openConflictReview' }
  | { type: 'acknowledgeConflicts' }
  | { type: 'escalateRankedBlueprints' }
  | { type: 'resetSubmission' }
  | { type: 'approveToDirector'; payload: { recordId: string } }
  | { type: 'createEscalationTicket'; payload: { recordId: string } }
  | { type: 'deEscalateToStaff'; payload: { recordId: string; reviewNote: string } }
  | { type: 'deEscalateToDeptHead'; payload: { recordId: string; reviewNote: string } }
  | { type: 'managerUpdateAssumptionValue'; payload: { batchId: string; assumptionId: string; value: string } }
  | { type: 'managerApplyReevaluation'; payload: { batchId: string; blueprints: Blueprint[]; provider: AIProvider; fallback: boolean } }
  | { type: 'managerSelectBatchBlueprint'; payload: { batchId: string; blueprintId: string } }
  | { type: 'managerEscalateBatchToDirector'; payload: { batchId: string } }
  | { type: 'managerRejectBatch'; payload: { batchId: string; note: string } }
  | { type: 'selectMergePair'; payload: { blueprintIds: string[] } }
  | { type: 'completeMerge' }
  | { type: 'directorApprove'; payload: { recordId: string } }
  | { type: 'directorDeEscalateToStaff'; payload: { recordId: string; reviewNote: string } }
  | { type: 'approveMerge'; payload: { recommendation: ZAIMergeRecommendation } }
  | { type: 'logProjectDecision'; payload: { projectId: string; action: string } };

const AppContext = createContext<AppContextValue | null>(null);

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function createInitialState(overrides?: Partial<AppState>): AppState {
  const escalationQueue = createSeedEscalationQueue();
  const managerReviewBatches = createSeedManagerReviewBatches();
  const baseState: AppState = {
    currentUser: null,
    activeSubmission: null,
    submissionStatus: 'draft',
    attachments: [],
    retrievedContext: null,
    blueprints: [],
    reviewAssumptions: [],
    rankedBlueprintIds: [],
    selectedBlueprintId: null,
    conflictsAcknowledged: false,
    escalationQueue,
    managerReviewBatches,
    selectedMergeIds: [],
    mergedStrategy: null,
    existingSystems: MOCK_EXISTING_SYSTEMS,
    projectTrackers: MOCK_PROJECT_TRACKERS,
    mergedExistingSystems: [],
    lastBlueprintProvider: null,
    lastBlueprintFallback: false,
  };

  return syncMergeSelection({
    ...baseState,
    ...overrides,
    escalationQueue: overrides?.escalationQueue ?? escalationQueue,
    managerReviewBatches: overrides?.managerReviewBatches ?? managerReviewBatches,
  });
}

function syncMergeSelection(state: AppState): AppState {
  const forwardedIds = new Set(
    state.escalationQueue.filter(record => record.status === 'forwarded').map(record => record.blueprint.id),
  );
  const normalized = state.selectedMergeIds.filter(id => forwardedIds.has(id));
  const mergeSuggestions = createMergeSuggestions(state.escalationQueue);
  const defaultSelection = mergeSuggestions[0]?.blueprintIds ?? [];
  const selectedMergeIds =
    normalized.length === 2 && normalized.every(id => forwardedIds.has(id)) ? normalized : defaultSelection;

  return {
    ...state,
    selectedMergeIds,
  };
}

function buildSubmission(state: AppState, problemStatement: string, attachments: Attachment[]): Submission | null {
  if (!state.currentUser) return null;

  return {
    id: createId('submission'),
    problemStatement,
    createdAt: '2026-04-21',
    attachments,
    submittedBy: {
      id: state.currentUser.id,
      name: state.currentUser.name,
      role: state.currentUser.role,
      department: state.currentUser.department,
      avatar: state.currentUser.avatar,
    },
  };
}

function getRecommendedBlueprintId(blueprints: Blueprint[], selectedBlueprintId: string | null) {
  if (selectedBlueprintId && blueprints.some(blueprint => blueprint.id === selectedBlueprintId)) {
    return selectedBlueprintId;
  }

  return getDefaultRankingOrder(blueprints)[0] ?? null;
}

function normalizeRanking(currentBlueprints: Blueprint[], incomingIds: string[]) {
  const validIds = new Set(currentBlueprints.map(blueprint => blueprint.id));
  const filtered = incomingIds.filter(id => validIds.has(id));
  const missing = currentBlueprints.map(blueprint => blueprint.id).filter(id => !filtered.includes(id));
  return [...filtered, ...missing];
}

function createManagerBatchRecord(state: AppState, status: ManagerReviewBatch['status']) {
  const rankingOrder = normalizeRanking(state.blueprints, state.rankedBlueprintIds.length > 0 ? state.rankedBlueprintIds : getDefaultRankingOrder(state.blueprints));
  const currentAssumptions = state.reviewAssumptions.length > 0 ? state.reviewAssumptions : buildSharedReviewAssumptions(state.blueprints);

  return {
    id: createId('mgr-batch'),
    submission: state.activeSubmission!,
    submittedBy: state.activeSubmission!.submittedBy,
    blueprints: state.blueprints,
    rankingOrder,
    baselineAssumptions: cloneReviewAssumptions(currentAssumptions),
    assumptions: cloneReviewAssumptions(currentAssumptions),
    rescoredBlueprints: null,
    selectedBlueprintId: rankingOrder[0] ?? null,
    status,
    note: `Employee ranked ${state.blueprints.length} blueprints for manager review.`,
    provider: state.lastBlueprintProvider ?? 'mock',
    fallback: state.lastBlueprintFallback || state.lastBlueprintProvider === 'mock' || state.lastBlueprintProvider === null,
    managerNote: null,
    escalatedAt: '2026-04-21',
    history: [
      {
        id: createId('mgr-history'),
        action: 'submitted' as const,
        byRole: state.currentUser!.role,
        note: 'Employee submitted ranked blueprint set to manager review.',
        createdAt: '2026-04-21',
        provider: state.lastBlueprintProvider ?? 'mock',
      },
    ],
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'login': {
      const currentUser = MOCK_USERS.find(user => user.id === action.payload.userId) ?? null;
      return {
        ...state,
        currentUser,
      };
    }
    case 'logout':
      return {
        ...state,
        currentUser: null,
      };
    case 'startSubmission': {
      const activeSubmission = buildSubmission(
        state,
        action.payload.problemStatement,
        action.payload.attachments,
      );

      if (!activeSubmission) return state;

      return {
        ...state,
        activeSubmission,
        submissionStatus: 'analyzing',
        attachments: action.payload.attachments,
        retrievedContext: createRetrievedContext(action.payload.problemStatement),
        blueprints: [],
        reviewAssumptions: [],
        rankedBlueprintIds: [],
        selectedBlueprintId: null,
        conflictsAcknowledged: false,
        lastBlueprintProvider: null,
        lastBlueprintFallback: false,
      };
    }
    case 'completeAnalysis': {
      if (!state.activeSubmission) return state;
      const blueprints = createDemoBlueprints(state.activeSubmission.problemStatement);
      const rankingOrder = getDefaultRankingOrder(blueprints);
      return {
        ...state,
        blueprints,
        reviewAssumptions: buildSharedReviewAssumptions(blueprints),
        rankedBlueprintIds: rankingOrder,
        selectedBlueprintId: rankingOrder[0] ?? null,
        submissionStatus: 'blueprints',
        lastBlueprintProvider: 'mock',
        lastBlueprintFallback: true,
      };
    }
    case 'completeAnalysisWithBlueprints': {
      if (!state.activeSubmission) return state;
      const blueprints = action.payload.blueprints;
      const rankingOrder = getDefaultRankingOrder(blueprints);
      return {
        ...state,
        blueprints,
        reviewAssumptions:
          action.payload.assumptions && action.payload.assumptions.length > 0
            ? action.payload.assumptions
            : buildSharedReviewAssumptions(blueprints),
        rankedBlueprintIds: rankingOrder,
        selectedBlueprintId: rankingOrder[0] ?? null,
        submissionStatus: 'blueprints',
        lastBlueprintProvider: action.payload.provider ?? 'mock',
        lastBlueprintFallback: action.payload.fallback ?? false,
      };
    }
    case 'selectBlueprint':
      return {
        ...state,
        selectedBlueprintId: action.payload.blueprintId,
      };
    case 'setBlueprintRanking':
      return {
        ...state,
        rankedBlueprintIds: normalizeRanking(state.blueprints, action.payload.blueprintIds),
      };
    case 'openConflictReview':
      if (state.blueprints.length === 0) return state;
      return {
        ...state,
        submissionStatus: 'conflicts',
      };
    case 'acknowledgeConflicts':
      return {
        ...state,
        conflictsAcknowledged: true,
        submissionStatus: 'scoring',
        selectedBlueprintId: getRecommendedBlueprintId(state.blueprints, state.selectedBlueprintId),
      };
    case 'escalateRankedBlueprints': {
      if (!state.activeSubmission || !state.currentUser || state.blueprints.length === 0) return state;

      const currentUser = state.currentUser;
      const rankingOrder = normalizeRanking(state.blueprints, state.rankedBlueprintIds.length > 0 ? state.rankedBlueprintIds : getDefaultRankingOrder(state.blueprints));
      const assumptions = state.reviewAssumptions.length > 0 ? state.reviewAssumptions : buildSharedReviewAssumptions(state.blueprints);
      const existingBatchIndex = state.managerReviewBatches.findIndex(
        batch =>
          batch.submission.id === state.activeSubmission?.id &&
          batch.submittedBy.id === state.currentUser?.id &&
          batch.status === 'returned_to_employee',
      );

      const managerReviewBatches =
        existingBatchIndex >= 0
          ? state.managerReviewBatches.map((batch, index) =>
              index === existingBatchIndex
                ? {
                    ...batch,
                    blueprints: state.blueprints,
                    rankingOrder,
                    baselineAssumptions: cloneReviewAssumptions(assumptions),
                    assumptions: cloneReviewAssumptions(assumptions),
                    rescoredBlueprints: null,
                    selectedBlueprintId: rankingOrder[0] ?? null,
                    status: 'pending' as const,
                    note: 'Employee resubmitted the ranked blueprint set after manager feedback.',
                    managerNote: null,
                    history: [
                      {
                        id: createId('mgr-history'),
                        action: 'resubmitted' as const,
                        byRole: currentUser.role,
                        note: 'Employee resubmitted ranked blueprints after manager rejection.',
                        createdAt: '2026-04-24',
                        provider: state.lastBlueprintProvider ?? 'mock',
                      },
                      ...batch.history,
                    ],
                  }
                : batch,
            )
          : [createManagerBatchRecord({ ...state, rankedBlueprintIds: rankingOrder, reviewAssumptions: assumptions }, 'pending'), ...state.managerReviewBatches];

      return {
        ...state,
        managerReviewBatches,
        rankedBlueprintIds: rankingOrder,
        selectedBlueprintId: rankingOrder[0] ?? null,
        submissionStatus: 'escalated',
      };
    }
    case 'approveToDirector': {
      const escalationQueue = state.escalationQueue.map(record =>
        record.id === action.payload.recordId && (record.status === 'pending' || record.status === 'returned_to_head')
          ? { ...record, status: 'forwarded' as const }
          : record,
      );
      return syncMergeSelection({ ...state, escalationQueue });
    }
    case 'createEscalationTicket': {
      if (!state.currentUser) return state;
      const currentUser = state.currentUser;
      const escalationQueue = state.escalationQueue.map(record => {
        if (record.id !== action.payload.recordId || record.ticket) return record;
        return {
          ...record,
          ticket: {
            id: createId('ticket'),
            title: `Review ticket: ${record.blueprint.title}`,
            status: 'open' as const,
            createdAt: '2026-04-23',
            createdByRole: currentUser.role,
          },
        };
      });
      return { ...state, escalationQueue };
    }
    case 'deEscalateToStaff': {
      if (!state.currentUser || !action.payload.reviewNote.trim()) return state;
      const currentUser = state.currentUser;
      const escalationQueue = state.escalationQueue.map(record => {
        if (record.id !== action.payload.recordId) return record;
        if (record.status !== 'pending' && record.status !== 'returned_to_head') return record;

        return {
          ...record,
          status: 'returned_to_staff' as const,
          note: `Returned to staff by department head ${currentUser.name} for revision.`,
          reviews: [
            {
              id: createId('review'),
              byRole: currentUser.role,
              target: 'staff' as const,
              note: action.payload.reviewNote.trim(),
              createdAt: '2026-04-23',
            },
            ...(record.reviews ?? []),
          ],
        };
      });

      return syncMergeSelection({ ...state, escalationQueue });
    }
    case 'deEscalateToDeptHead': {
      if (!state.currentUser || !action.payload.reviewNote.trim()) return state;
      const currentUser = state.currentUser;
      const escalationQueue = state.escalationQueue.map(record => {
        if (record.id !== action.payload.recordId || record.status !== 'forwarded') return record;

        return {
          ...record,
          status: 'returned_to_head' as const,
          note: `Returned to department head by director ${currentUser.name} for further review.`,
          reviews: [
            {
              id: createId('review'),
              byRole: currentUser.role,
              target: 'lead' as const,
              note: action.payload.reviewNote.trim(),
              createdAt: '2026-04-23',
            },
            ...(record.reviews ?? []),
          ],
        };
      });

      return syncMergeSelection({ ...state, escalationQueue });
    }
    case 'managerUpdateAssumptionValue': {
      const managerReviewBatches = state.managerReviewBatches.map(batch =>
        batch.id !== action.payload.batchId
          ? batch
          : {
              ...batch,
              rescoredBlueprints: null,
              assumptions: batch.assumptions.map(assumption =>
                assumption.id === action.payload.assumptionId
                  ? { ...assumption, value: action.payload.value }
                  : assumption,
              ),
            },
      );

      return { ...state, managerReviewBatches };
    }
    case 'managerApplyReevaluation': {
      const managerReviewBatches = state.managerReviewBatches.map(batch =>
        batch.id !== action.payload.batchId
          ? batch
          : {
              ...batch,
              rescoredBlueprints: action.payload.blueprints,
              provider: action.payload.provider,
              fallback: action.payload.fallback,
              history: [
                {
                  id: createId('mgr-history'),
                  action: 'reevaluated' as const,
                  byRole: state.currentUser?.role ?? 'lead',
                  note: 'Manager reevaluated the ranked blueprint set after editing assumptions.',
                  createdAt: '2026-04-24',
                  provider: action.payload.provider,
                },
                ...batch.history,
              ],
            },
      );

      return { ...state, managerReviewBatches };
    }
    case 'managerSelectBatchBlueprint': {
      const managerReviewBatches = state.managerReviewBatches.map(batch =>
        batch.id !== action.payload.batchId
          ? batch
          : {
              ...batch,
              selectedBlueprintId: action.payload.blueprintId,
            },
      );

      return { ...state, managerReviewBatches };
    }
    case 'managerEscalateBatchToDirector': {
      if (!state.currentUser) return state;
      const currentUser = state.currentUser;
      const targetBatch = state.managerReviewBatches.find(batch => batch.id === action.payload.batchId);
      if (!targetBatch) return state;

      const displayedBlueprints =
        targetBatch.rescoredBlueprints ??
        reevaluateBlueprintSet(targetBatch.blueprints, targetBatch.assumptions, targetBatch.baselineAssumptions);
      const selectedBlueprint =
        displayedBlueprints.find(blueprint => blueprint.id === targetBatch.selectedBlueprintId) ??
        displayedBlueprints.find(blueprint => blueprint.id === targetBatch.rankingOrder[0]);
      if (!selectedBlueprint) return state;

      const escalationRecord: EscalationRecord = {
        id: createId('escalation'),
        submission: targetBatch.submission,
        blueprint: selectedBlueprint,
        submittedBy: targetBatch.submittedBy,
        escalatedAt: '2026-04-24',
        note: `Forwarded by manager ${state.currentUser.name} after reviewing ranked batch and updated assumptions.`,
        status: 'forwarded',
        level: 'head_to_director',
        ticket: null,
        reviews: [
          {
            id: createId('review'),
            byRole: currentUser.role,
            target: 'director',
            note: `Manager selected rank ${targetBatch.rankingOrder.findIndex(id => id === selectedBlueprint.id) + 1 || 1} after reevaluation.`,
            createdAt: '2026-04-24',
          },
        ],
      };

      const managerReviewBatches = state.managerReviewBatches.map(batch =>
        batch.id !== action.payload.batchId
          ? batch
          : {
              ...batch,
              status: 'forwarded_to_director' as const,
              managerNote: `Forwarded ${selectedBlueprint.title} to director after manager review.`,
              history: [
                {
                  id: createId('mgr-history'),
                  action: 'forwarded' as const,
                  byRole: currentUser.role,
                  note: `Forwarded ${selectedBlueprint.title} to the director queue.`,
                  createdAt: '2026-04-24',
                  provider: batch.provider,
                },
                ...batch.history,
              ],
            },
      );

      return syncMergeSelection({
        ...state,
        escalationQueue: [escalationRecord, ...state.escalationQueue],
        managerReviewBatches,
      });
    }
    case 'managerRejectBatch': {
      if (!state.currentUser || !action.payload.note.trim()) return state;
      const currentUser = state.currentUser;
      const targetBatch = state.managerReviewBatches.find(batch => batch.id === action.payload.batchId);
      if (!targetBatch) return state;
      const returnedAssumptions = cloneReviewAssumptions(targetBatch.assumptions);
      const returnedBlueprints =
        targetBatch.rescoredBlueprints ??
        reevaluateBlueprintSet(targetBatch.blueprints, targetBatch.assumptions, targetBatch.baselineAssumptions);

      const managerReviewBatches = state.managerReviewBatches.map(batch =>
        batch.id !== action.payload.batchId
          ? batch
          : {
              ...batch,
              blueprints: returnedBlueprints,
              baselineAssumptions: cloneReviewAssumptions(returnedAssumptions),
              assumptions: cloneReviewAssumptions(returnedAssumptions),
              rescoredBlueprints: null,
              status: 'returned_to_employee' as const,
              managerNote: action.payload.note.trim(),
              history: [
                {
                  id: createId('mgr-history'),
                  action: 'rejected' as const,
                  byRole: currentUser.role,
                  note: action.payload.note.trim(),
                  createdAt: '2026-04-24',
                  provider: batch.provider,
                },
                ...batch.history,
              ],
            },
      );

      return {
        ...state,
        managerReviewBatches,
        activeSubmission: targetBatch.submission,
        attachments: targetBatch.submission.attachments,
        retrievedContext: createRetrievedContext(targetBatch.submission.problemStatement),
        blueprints: returnedBlueprints,
        reviewAssumptions: returnedAssumptions,
        rankedBlueprintIds: targetBatch.rankingOrder,
        selectedBlueprintId: targetBatch.rankingOrder[0] ?? null,
        conflictsAcknowledged: true,
        submissionStatus: 'blueprints',
      };
    }
    case 'resetSubmission':
      return {
        ...state,
        activeSubmission: null,
        submissionStatus: 'draft',
        attachments: [],
        retrievedContext: null,
        blueprints: [],
        reviewAssumptions: [],
        rankedBlueprintIds: [],
        selectedBlueprintId: null,
        conflictsAcknowledged: false,
        lastBlueprintProvider: null,
        lastBlueprintFallback: false,
      };
    case 'selectMergePair':
      return syncMergeSelection({
        ...state,
        selectedMergeIds: action.payload.blueprintIds.slice(0, 2),
      });
    case 'completeMerge': {
      if (!state.currentUser || state.selectedMergeIds.length !== 2) return state;

      const selectedRecords = state.escalationQueue.filter(
        record => record.status === 'forwarded' && state.selectedMergeIds.includes(record.blueprint.id),
      );

      if (selectedRecords.length !== 2) return state;

      const suggestion =
        createMergeSuggestions(state.escalationQueue).find(item =>
          item.blueprintIds.every(id => state.selectedMergeIds.includes(id)),
        ) ?? undefined;

      const mergedStrategy = createMergedStrategy(selectedRecords, state.currentUser.role, suggestion);
      const escalationQueue = state.escalationQueue.map(record =>
        state.selectedMergeIds.includes(record.blueprint.id)
          ? { ...record, status: 'merged' as const }
          : record,
      );

      return syncMergeSelection({
        ...state,
        escalationQueue,
        mergedStrategy,
      });
    }
    case 'directorApprove': {
      const escalationQueue = state.escalationQueue.map(record =>
        record.id === action.payload.recordId && record.status === 'forwarded'
          ? { ...record, status: 'approved_by_director' as const }
          : record,
      );
      return syncMergeSelection({ ...state, escalationQueue });
    }
    case 'directorDeEscalateToStaff': {
      if (!state.currentUser || !action.payload.reviewNote.trim()) return state;
      const currentUser = state.currentUser;
      const escalationQueue = state.escalationQueue.map(record => {
        if (record.id !== action.payload.recordId || record.status !== 'forwarded') return record;
        return {
          ...record,
          status: 'returned_to_staff' as const,
          note: `Returned to staff by director ${currentUser.name} for revision.`,
          reviews: [
            {
              id: createId('review'),
              byRole: currentUser.role,
              target: 'staff' as const,
              note: action.payload.reviewNote.trim(),
              createdAt: '2026-04-24',
            },
            ...(record.reviews ?? []),
          ],
        };
      });
      return syncMergeSelection({ ...state, escalationQueue });
    }
    case 'approveMerge': {
      const { recommendation } = action.payload;
      const blueprintIds = recommendation.candidateIds.filter(id => recommendation.candidateType[id] === 'blueprint');
      const systemIds = recommendation.candidateIds.filter(id => recommendation.candidateType[id] === 'system');
      const escalationQueue = state.escalationQueue.map(record =>
        blueprintIds.includes(record.blueprint.id) ? { ...record, status: 'merged' as const } : record,
      );
      const sourceBlueprints = state.escalationQueue
        .filter(r => blueprintIds.includes(r.blueprint.id))
        .map(r => r.blueprint);
      const sourceSystems = state.existingSystems.filter(s => systemIds.includes(s.id));
      const totalOpex =
        sourceBlueprints.reduce((sum, bp) => sum + bp.financeModel.opexMonthlyValue, 0) +
        sourceSystems.reduce((sum, s) => sum + s.monthlyCost, 0);
      const sourceNames = [...sourceBlueprints.map(bp => bp.title), ...sourceSystems.map(s => s.name)];
      const mergedSystem: ExistingSystem = {
        id: createId('merged-sys'),
        name: buildMergedSystemName({
          proposedName: recommendation.title,
          department: sourceBlueprints[0]?.department ?? sourceSystems[0]?.department ?? 'Technology',
          blueprintTitles: sourceBlueprints.map(bp => bp.title),
          systemNames: sourceSystems.map(system => system.name),
        }),
        department: sourceBlueprints[0]?.department ?? 'Technology',
        description: `Merged from: ${sourceNames.join(' + ')}`,
        monthlyCost: Math.round(totalOpex * 0.82),
        color: 'var(--color-primary)',
        isMerged: true,
        combinedSavings: recommendation.projectedSavings,
        sourceTitles: sourceNames,
      };
      return syncMergeSelection({
        ...state,
        escalationQueue,
        mergedExistingSystems: [...state.mergedExistingSystems, mergedSystem],
      });
    }
    case 'logProjectDecision': {
      const { projectId, action: decisionAction } = action.payload;
      const projectTrackers = state.projectTrackers.map(tracker => {
        if (tracker.id !== projectId) return tracker;
        const baseRoi = parseInt(tracker.roiProjected, 10);
        const updatedRoi = decisionAction.includes('Accept')
          ? `${baseRoi - 8}%`
          : decisionAction.includes('Re-scope')
            ? `${baseRoi - 15}%`
            : tracker.roiProjected;
        return {
          ...tracker,
          decisions: [{ action: decisionAction, loggedAt: '2026-04-24' }, ...tracker.decisions],
          roiProjected: updatedRoi,
        };
      });
      return { ...state, projectTrackers };
    }
    default:
      return state;
  }
}

export function AppProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: Partial<AppState>;
}) {
  const [state, dispatch] = useReducer(reducer, initialState, createInitialState);

  const value = useMemo(() => {
    const selectedBlueprint =
      state.blueprints.find(blueprint => blueprint.id === state.selectedBlueprintId) ?? null;
    const rankedBlueprints =
      normalizeRanking(state.blueprints, state.rankedBlueprintIds).map(id => state.blueprints.find(blueprint => blueprint.id === id)).filter((blueprint): blueprint is Blueprint => Boolean(blueprint));
    const staffEscalations = state.escalationQueue.filter(record => record.level === 'staff_to_head');
    const pendingEscalations = state.escalationQueue.filter(record => record.status === 'forwarded');
    const mergeSuggestions = createMergeSuggestions(state.escalationQueue);
    const selectedMergeRecords = state.escalationQueue.filter(record =>
      state.selectedMergeIds.includes(record.blueprint.id),
    );
    const activeMergeSuggestion =
      mergeSuggestions.find(item => item.blueprintIds.every(id => state.selectedMergeIds.includes(id))) ?? null;
    const directorPendingEscalations = state.escalationQueue.filter(r => r.status === 'forwarded');
    const directorApprovedEscalations = state.escalationQueue.filter(r => r.status === 'approved_by_director');
    const directorReviewedEscalations = state.escalationQueue.filter(
      r => r.status === 'returned_to_head' || r.status === 'returned_to_staff',
    );
    const allDisplayedSystems = [...state.existingSystems, ...state.mergedExistingSystems];
    const directorMergeRecommendations = createDirectorMergeRecommendations(
      directorApprovedEscalations,
      allDisplayedSystems,
    );
    const managerPendingBatches = state.managerReviewBatches.filter(batch => batch.status === 'pending');
    const managerReturnedBatches = state.managerReviewBatches.filter(batch => batch.status === 'returned_to_employee');
    const managerForwardedBatches = state.managerReviewBatches.filter(batch => batch.status === 'forwarded_to_director');
    const myManagerReviewBatches = state.currentUser
      ? state.managerReviewBatches.filter(batch => batch.submittedBy.id === state.currentUser?.id)
      : [];
    const latestReturnedManagerBatch =
      state.activeSubmission
        ? state.managerReviewBatches.find(batch => batch.submission.id === state.activeSubmission?.id && batch.status === 'returned_to_employee') ?? null
        : null;

    return {
      ...state,
      selectedBlueprint,
      rankedBlueprints,
      staffEscalations,
      pendingEscalations,
      mergeSuggestions,
      selectedMergeRecords,
      activeMergeSuggestion,
      directorPendingEscalations,
      directorApprovedEscalations,
      directorReviewedEscalations,
      allDisplayedSystems,
      directorMergeRecommendations,
      managerPendingBatches,
      managerReturnedBatches,
      managerForwardedBatches,
      myManagerReviewBatches,
      latestReturnedManagerBatch,
      login: (userId: string) => dispatch({ type: 'login', payload: { userId } }),
      logout: () => dispatch({ type: 'logout' }),
      startSubmission: (problemStatement: string, attachments: Attachment[]) =>
        dispatch({ type: 'startSubmission', payload: { problemStatement, attachments } }),
      completeAnalysis: () => dispatch({ type: 'completeAnalysis' }),
      completeAnalysisWithBlueprints: (payload: {
        blueprints: Blueprint[];
        assumptions?: ReviewAssumption[] | null;
        provider?: AIProvider;
        fallback?: boolean;
      }) =>
        dispatch({ type: 'completeAnalysisWithBlueprints', payload }),
      selectBlueprint: (blueprintId: string) => dispatch({ type: 'selectBlueprint', payload: { blueprintId } }),
      setBlueprintRanking: (blueprintIds: string[]) =>
        dispatch({ type: 'setBlueprintRanking', payload: { blueprintIds } }),
      openConflictReview: () => dispatch({ type: 'openConflictReview' }),
      acknowledgeConflicts: () => dispatch({ type: 'acknowledgeConflicts' }),
      escalateSelectedBlueprint: () => dispatch({ type: 'escalateRankedBlueprints' }),
      escalateRankedBlueprints: () => dispatch({ type: 'escalateRankedBlueprints' }),
      resetSubmission: () => dispatch({ type: 'resetSubmission' }),
      approveToDirector: (recordId: string) => dispatch({ type: 'approveToDirector', payload: { recordId } }),
      createEscalationTicket: (recordId: string) =>
        dispatch({ type: 'createEscalationTicket', payload: { recordId } }),
      deEscalateToStaff: (recordId: string, reviewNote: string) =>
        dispatch({ type: 'deEscalateToStaff', payload: { recordId, reviewNote } }),
      deEscalateToDeptHead: (recordId: string, reviewNote: string) =>
        dispatch({ type: 'deEscalateToDeptHead', payload: { recordId, reviewNote } }),
      managerUpdateAssumptionValue: (batchId: string, assumptionId: string, value: string) =>
        dispatch({ type: 'managerUpdateAssumptionValue', payload: { batchId, assumptionId, value } }),
      managerApplyReevaluation: (batchId: string, blueprints: Blueprint[], provider: AIProvider, fallback: boolean) =>
        dispatch({ type: 'managerApplyReevaluation', payload: { batchId, blueprints, provider, fallback } }),
      managerSelectBatchBlueprint: (batchId: string, blueprintId: string) =>
        dispatch({ type: 'managerSelectBatchBlueprint', payload: { batchId, blueprintId } }),
      managerEscalateBatchToDirector: (batchId: string) =>
        dispatch({ type: 'managerEscalateBatchToDirector', payload: { batchId } }),
      managerRejectBatch: (batchId: string, note: string) =>
        dispatch({ type: 'managerRejectBatch', payload: { batchId, note } }),
      selectMergePair: (blueprintIds: string[]) =>
        dispatch({ type: 'selectMergePair', payload: { blueprintIds } }),
      completeMerge: () => dispatch({ type: 'completeMerge' }),
      directorApprove: (recordId: string) => dispatch({ type: 'directorApprove', payload: { recordId } }),
      directorDeEscalateToStaff: (recordId: string, reviewNote: string) =>
        dispatch({ type: 'directorDeEscalateToStaff', payload: { recordId, reviewNote } }),
      approveMerge: (recommendation: ZAIMergeRecommendation) =>
        dispatch({ type: 'approveMerge', payload: { recommendation } }),
      logProjectDecision: (projectId: string, action: string) =>
        dispatch({ type: 'logProjectDecision', payload: { projectId, action } }),
    };
  }, [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
