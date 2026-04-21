'use client';

import { createContext, ReactNode, useContext, useMemo, useReducer } from 'react';
import {
  Attachment,
  Blueprint,
  EscalationRecord,
  MergeSuggestion,
  MergedStrategy,
  RetrievedContext,
  Submission,
  SubmissionStatus,
  User,
} from '../types';
import {
  createDemoBlueprints,
  createMergedStrategy,
  createMergeSuggestions,
  createRetrievedContext,
  createSeedEscalationQueue,
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
}

interface AppContextValue extends AppState {
  selectedBlueprint: Blueprint | null;
  pendingEscalations: EscalationRecord[];
  mergeSuggestions: MergeSuggestion[];
  selectedMergeRecords: EscalationRecord[];
  activeMergeSuggestion: MergeSuggestion | null;
  login: (userId: string) => void;
  logout: () => void;
  startSubmission: (problemStatement: string, attachments: Attachment[]) => void;
  completeAnalysis: () => void;
  selectBlueprint: (blueprintId: string) => void;
  openConflictReview: () => void;
  acknowledgeConflicts: () => void;
  escalateSelectedBlueprint: () => void;
  resetSubmission: () => void;
  selectMergePair: (blueprintIds: string[]) => void;
  completeMerge: () => void;
}

type Action =
  | { type: 'login'; payload: { userId: string } }
  | { type: 'logout' }
  | { type: 'startSubmission'; payload: { problemStatement: string; attachments: Attachment[] } }
  | { type: 'completeAnalysis' }
  | { type: 'selectBlueprint'; payload: { blueprintId: string } }
  | { type: 'openConflictReview' }
  | { type: 'acknowledgeConflicts' }
  | { type: 'escalateSelectedBlueprint' }
  | { type: 'resetSubmission' }
  | { type: 'selectMergePair'; payload: { blueprintIds: string[] } }
  | { type: 'completeMerge' };

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
  };

  return syncMergeSelection({
    ...baseState,
    ...overrides,
    escalationQueue: overrides?.escalationQueue ?? escalationQueue,
  });
}

function syncMergeSelection(state: AppState): AppState {
  const pendingIds = new Set(
    state.escalationQueue.filter(record => record.status === 'pending').map(record => record.blueprint.id),
  );
  const normalized = state.selectedMergeIds.filter(id => pendingIds.has(id));
  const mergeSuggestions = createMergeSuggestions(state.escalationQueue);
  const defaultSelection = mergeSuggestions[0]?.blueprintIds ?? [];
  const selectedMergeIds =
    normalized.length === 2 && normalized.every(id => pendingIds.has(id)) ? normalized : defaultSelection;

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
        submissionStatus: 'scoring',
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
        },
        ...state.escalationQueue,
      ];

      return syncMergeSelection({
        ...state,
        escalationQueue: nextQueue,
        submissionStatus: 'escalated',
      });
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
        record => record.status === 'pending' && state.selectedMergeIds.includes(record.blueprint.id),
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
    const pendingEscalations = state.escalationQueue.filter(record => record.status === 'pending');
    const mergeSuggestions = createMergeSuggestions(state.escalationQueue);
    const selectedMergeRecords = state.escalationQueue.filter(record =>
      state.selectedMergeIds.includes(record.blueprint.id),
    );
    const activeMergeSuggestion =
      mergeSuggestions.find(item => item.blueprintIds.every(id => state.selectedMergeIds.includes(id))) ?? null;

    return {
      ...state,
      selectedBlueprint,
      pendingEscalations,
      mergeSuggestions,
      selectedMergeRecords,
      activeMergeSuggestion,
      login: (userId: string) => dispatch({ type: 'login', payload: { userId } }),
      logout: () => dispatch({ type: 'logout' }),
      startSubmission: (problemStatement: string, attachments: Attachment[]) =>
        dispatch({ type: 'startSubmission', payload: { problemStatement, attachments } }),
      completeAnalysis: () => dispatch({ type: 'completeAnalysis' }),
      selectBlueprint: (blueprintId: string) => dispatch({ type: 'selectBlueprint', payload: { blueprintId } }),
      openConflictReview: () => dispatch({ type: 'openConflictReview' }),
      acknowledgeConflicts: () => dispatch({ type: 'acknowledgeConflicts' }),
      escalateSelectedBlueprint: () => dispatch({ type: 'escalateSelectedBlueprint' }),
      resetSubmission: () => dispatch({ type: 'resetSubmission' }),
      selectMergePair: (blueprintIds: string[]) =>
        dispatch({ type: 'selectMergePair', payload: { blueprintIds } }),
      completeMerge: () => dispatch({ type: 'completeMerge' }),
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
