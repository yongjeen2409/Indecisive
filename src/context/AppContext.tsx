'use client';

import { createContext, ReactNode, useContext, useMemo, useReducer } from 'react';
import {
  Attachment,
  Blueprint,
  EscalationRecord,
  ExistingSystem,
  MergeSuggestion,
  MergedStrategy,
  ProjectTracker,
  RetrievedContext,
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
  MOCK_EXISTING_SYSTEMS,
  MOCK_PROJECT_TRACKERS,
  MOCK_USERS,
} from '../data/mockData';

export interface AppState {
  currentUser: User | null;
  activeSubmission: Submission | null;
  submissionStatus: SubmissionStatus;
  attachments: Attachment[];
  retrievedContext: RetrievedContext | null;
  blueprints: Blueprint[];
  selectedBlueprintId: string | null;
  conflictsAcknowledged: boolean;
  escalationQueue: EscalationRecord[];
  selectedMergeIds: string[];
  mergedStrategy: MergedStrategy | null;
  existingSystems: ExistingSystem[];
  projectTrackers: ProjectTracker[];
  mergedExistingSystems: ExistingSystem[];
}

interface AppContextValue extends AppState {
  selectedBlueprint: Blueprint | null;
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
  login: (userId: string) => void;
  logout: () => void;
  startSubmission: (problemStatement: string, attachments: Attachment[]) => void;
  completeAnalysis: () => void;
  completeAnalysisWithBlueprints: (blueprints: Blueprint[]) => void;
  selectBlueprint: (blueprintId: string) => void;
  openConflictReview: () => void;
  acknowledgeConflicts: () => void;
  escalateSelectedBlueprint: () => void;
  resetSubmission: () => void;
  approveToDirector: (recordId: string) => void;
  createEscalationTicket: (recordId: string) => void;
  deEscalateToStaff: (recordId: string, reviewNote: string) => void;
  deEscalateToDeptHead: (recordId: string, reviewNote: string) => void;
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
  | { type: 'completeAnalysisWithBlueprints'; payload: { blueprints: Blueprint[] } }
  | { type: 'selectBlueprint'; payload: { blueprintId: string } }
  | { type: 'openConflictReview' }
  | { type: 'acknowledgeConflicts' }
  | { type: 'escalateSelectedBlueprint' }
  | { type: 'resetSubmission' }
  | { type: 'approveToDirector'; payload: { recordId: string } }
  | { type: 'createEscalationTicket'; payload: { recordId: string } }
  | { type: 'deEscalateToStaff'; payload: { recordId: string; reviewNote: string } }
  | { type: 'deEscalateToDeptHead'; payload: { recordId: string; reviewNote: string } }
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
  const baseState: AppState = {
    currentUser: null,
    activeSubmission: null,
    submissionStatus: 'draft',
    attachments: [],
    retrievedContext: null,
    blueprints: [],
    selectedBlueprintId: null,
    conflictsAcknowledged: false,
    escalationQueue,
    selectedMergeIds: [],
    mergedStrategy: null,
    existingSystems: MOCK_EXISTING_SYSTEMS,
    projectTrackers: MOCK_PROJECT_TRACKERS,
    mergedExistingSystems: [],
  };

  return syncMergeSelection({
    ...baseState,
    ...overrides,
    escalationQueue: overrides?.escalationQueue ?? escalationQueue,
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

  return [...blueprints].sort((left, right) => right.scores.total - left.scores.total)[0]?.id ?? null;
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
        selectedBlueprintId: null,
        conflictsAcknowledged: false,
      };
    }
    case 'completeAnalysis': {
      if (!state.activeSubmission) return state;
      return {
        ...state,
        blueprints: createDemoBlueprints(state.activeSubmission.problemStatement),
        submissionStatus: 'blueprints',
      };
    }
    case 'completeAnalysisWithBlueprints': {
      if (!state.activeSubmission) return state;
      return {
        ...state,
        blueprints: action.payload.blueprints,
        submissionStatus: 'blueprints',
      };
    }
    case 'selectBlueprint':
      return {
        ...state,
        selectedBlueprintId: action.payload.blueprintId,
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
        submissionStatus: 'blueprints',
        selectedBlueprintId: getRecommendedBlueprintId(state.blueprints, state.selectedBlueprintId),
      };
    case 'escalateSelectedBlueprint': {
      const blueprint = state.blueprints.find(item => item.id === state.selectedBlueprintId);
      if (!blueprint || !state.activeSubmission || !state.currentUser) return state;

      const nextQueue = [
        {
          id: createId('escalation'),
          submission: state.activeSubmission,
          blueprint,
          submittedBy: {
            id: state.currentUser.id,
            name: state.currentUser.name,
            role: state.currentUser.role,
            department: state.currentUser.department,
            avatar: state.currentUser.avatar,
          },
          escalatedAt: '2026-04-21',
          note: `Escalated from the ${state.currentUser.department} team after staff review.`,
          status: 'pending' as const,
          level: 'staff_to_head' as const,
          ticket: null,
          reviews: [],
        },
        ...state.escalationQueue,
      ];

      return syncMergeSelection({
        ...state,
        escalationQueue: nextQueue,
        submissionStatus: 'escalated',
      });
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
    case 'resetSubmission':
      return {
        ...state,
        activeSubmission: null,
        submissionStatus: 'draft',
        attachments: [],
        retrievedContext: null,
        blueprints: [],
        selectedBlueprintId: null,
        conflictsAcknowledged: false,
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
        name: `Unified ${sourceBlueprints[0]?.department ?? 'Platform'} System`,
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

    return {
      ...state,
      selectedBlueprint,
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
      login: (userId: string) => dispatch({ type: 'login', payload: { userId } }),
      logout: () => dispatch({ type: 'logout' }),
      startSubmission: (problemStatement: string, attachments: Attachment[]) =>
        dispatch({ type: 'startSubmission', payload: { problemStatement, attachments } }),
      completeAnalysis: () => dispatch({ type: 'completeAnalysis' }),
      completeAnalysisWithBlueprints: (blueprints: Blueprint[]) =>
        dispatch({ type: 'completeAnalysisWithBlueprints', payload: { blueprints } }),
      selectBlueprint: (blueprintId: string) => dispatch({ type: 'selectBlueprint', payload: { blueprintId } }),
      openConflictReview: () => dispatch({ type: 'openConflictReview' }),
      acknowledgeConflicts: () => dispatch({ type: 'acknowledgeConflicts' }),
      escalateSelectedBlueprint: () => dispatch({ type: 'escalateSelectedBlueprint' }),
      resetSubmission: () => dispatch({ type: 'resetSubmission' }),
      approveToDirector: (recordId: string) => dispatch({ type: 'approveToDirector', payload: { recordId } }),
      createEscalationTicket: (recordId: string) =>
        dispatch({ type: 'createEscalationTicket', payload: { recordId } }),
      deEscalateToStaff: (recordId: string, reviewNote: string) =>
        dispatch({ type: 'deEscalateToStaff', payload: { recordId, reviewNote } }),
      deEscalateToDeptHead: (recordId: string, reviewNote: string) =>
        dispatch({ type: 'deEscalateToDeptHead', payload: { recordId, reviewNote } }),
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
